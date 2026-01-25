/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable @typescript-eslint/no-unsafe-return */
/* eslint-disable @typescript-eslint/no-unsafe-argument */

import {
  Injectable,
  NotFoundException,
  BadRequestException,
  InternalServerErrorException,
  Logger,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { ConfigService } from '@nestjs/config';
import axios from 'axios';
import { CreatePaymentRequestDto } from '../dto/create-payment-request.dto';
import { InitiateMpesaDto } from '../dto/initiate-mpesa.dto';
import { MpesaCallbackDto } from '../dto/mpesa-callback.dto';

@Injectable()
export class PaymentService {
  private readonly logger = new Logger(PaymentService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly configService: ConfigService,
  ) { }

  // ========================================================================
  // Payment Request Methods
  // ========================================================================

  /**
   * Create a payment request (trainer → client or gym → member)
   */
  async createPaymentRequest(
    createPaymentRequestDto: CreatePaymentRequestDto,
    currentMemberId: string,
    tenantId: string,
  ) {
    const {
      fromMemberId,
      toMemberId,
      amount,
      currency = 'KES',
      paymentType,
      description,
      dueDate,
      metadata,
    } = createPaymentRequestDto;

    // Validate toMember exists
    const toMember = await this.prisma.extended.member.findUnique({
      where: { id: toMemberId },
    });

    if (!toMember) {
      throw new NotFoundException('Recipient member not found');
    }

    // Create payment request
    const paymentRequest = await this.prisma.extended.paymentRequest.create({
      data: {
        tenantId,
        fromMemberId: fromMemberId || currentMemberId,
        toMemberId,
        amount,
        currency,
        paymentType,
        description,
        dueDate: dueDate ? new Date(dueDate) : null,
        metadata: metadata || {},
        status: 'PENDING',
      },
      include: {
        fromMember: {
          select: {
            id: true,
            name: true,
            email: true,
            role: true,
          },
        },
        toMember: {
          select: {
            id: true,
            name: true,
            email: true,
            phoneNumber: true,
          },
        },
      },
    });

    this.logger.log(
      `Payment request created: ${paymentRequest.id} - ${amount} ${currency} from ${paymentRequest.fromMember.name} to ${paymentRequest.toMember.name}`,
    );

    return paymentRequest;
  }

  /**
   * Get payment requests for current member (what they need to pay)
   */
  getPendingPayments(memberId: string) {
    return this.prisma.extended.paymentRequest.findMany({
      where: {
        toMemberId: memberId,
        status: 'PENDING',
      },
      include: {
        fromMember: {
          select: {
            id: true,
            name: true,
            email: true,
            role: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
  }

  /**
   * Get payment requests sent by trainer/gym owner
   */
  getSentPaymentRequests(memberId: string) {
    return this.prisma.extended.paymentRequest.findMany({
      where: {
        fromMemberId: memberId,
      },
      include: {
        toMember: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
  }

  /**
   * Get payment request by ID
   */
  async getPaymentRequest(paymentRequestId: string) {
    const paymentRequest = await this.prisma.extended.paymentRequest.findUnique(
      {
        where: { id: paymentRequestId },
        include: {
          fromMember: true,
          toMember: true,
          mpesaTransactions: true,
        },
      },
    );

    if (!paymentRequest) {
      throw new NotFoundException('Payment request not found');
    }

    return paymentRequest;
  }

  // ========================================================================
  // M-Pesa Integration Methods
  // ========================================================================

  /**
   * Get M-Pesa OAuth access token
   */
  private async getMpesaAccessToken(): Promise<string> {
    const consumerKey = this.configService.get<string>('MPESA_CONSUMER_KEY');
    const consumerSecret = this.configService.get<string>(
      'MPESA_CONSUMER_SECRET',
    );
    const environment = this.configService.get<string>('MPESA_ENVIRONMENT');

    const auth = Buffer.from(`${consumerKey}:${consumerSecret}`).toString(
      'base64',
    );

    const url =
      environment === 'sandbox'
        ? 'https://sandbox.safaricom.co.ke/oauth/v1/generate?grant_type=client_credentials'
        : 'https://api.safaricom.co.ke/oauth/v1/generate?grant_type=client_credentials';

    try {
      const response = await axios.get(url, {
        headers: {
          Authorization: `Basic ${auth}`,
        },
      });

      return response.data.access_token;
    } catch (error) {
      this.logger.error('Failed to get M-Pesa access token', error);
      throw new InternalServerErrorException(
        'Failed to connect to M-Pesa. Please try again.',
      );
    }
  }

  /**
   * Initiate M-Pesa STK Push payment
   */
  async initiateMpesaPayment(
    initiateMpesaDto: InitiateMpesaDto,
    memberId: string,
    tenantId: string,
  ) {
    const { paymentRequestId, phoneNumber } = initiateMpesaDto;

    // Get payment request
    const paymentRequest = await this.getPaymentRequest(paymentRequestId);

    if (paymentRequest.toMemberId !== memberId) {
      throw new BadRequestException(
        'You are not authorized to pay this request',
      );
    }

    if (paymentRequest.status !== 'PENDING') {
      throw new BadRequestException(
        `Payment request is already ${paymentRequest.status}`,
      );
    }

    // Get M-Pesa config
    const accessToken = await this.getMpesaAccessToken();
    const environment = this.configService.get<string>('MPESA_ENVIRONMENT');
    const shortCode = this.configService.get<string>('MPESA_SHORTCODE');
    const passkey = this.configService.get<string>('MPESA_PASSKEY');
    const callbackUrl = this.configService.get<string>('MPESA_CALLBACK_URL');

    // Generate timestamp (YYYYMMDDHHmmss)
    const timestamp = new Date()
      .toISOString()
      .replace(/[-:TZ.]/g, '')
      .slice(0, 14);

    // Generate password
    const password = Buffer.from(`${shortCode}${passkey}${timestamp}`).toString(
      'base64',
    );

    // Prepare STK Push payload
    const stkPushUrl =
      environment === 'sandbox'
        ? 'https://sandbox.safaricom.co.ke/mpesa/stkpush/v1/processrequest'
        : 'https://api.safaricom.co.ke/mpesa/stkpush/v1/processrequest';

    const payload = {
      BusinessShortCode: shortCode,
      Password: password,
      Timestamp: timestamp,
      TransactionType: 'CustomerPayBillOnline',
      Amount: Math.round(paymentRequest.amount), // M-Pesa requires integer
      PartyA: phoneNumber, // Customer phone
      PartyB: shortCode, // Paybill number
      PhoneNumber: phoneNumber,
      CallBackURL: callbackUrl,
      AccountReference: paymentRequestId, // Reference for this payment
      TransactionDesc: paymentRequest.description || 'ZMOS Payment',
    };

    try {
      // Send STK Push request
      const response = await axios.post(stkPushUrl, payload, {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
      });

      const {
        MerchantRequestID,
        CheckoutRequestID,
        ResponseCode,
        ResponseDescription,
        CustomerMessage,
      } = response.data;

      // Save M-Pesa transaction
      const mpesaTransaction =
        await this.prisma.extended.mpesaTransaction.create({
          data: {
            tenantId,
            paymentRequestId,
            memberId,
            phoneNumber,
            amount: paymentRequest.amount,
            accountReference: paymentRequestId,
            transactionDesc: paymentRequest.description || 'ZMOS Payment',
            merchantRequestId: MerchantRequestID,
            checkoutRequestId: CheckoutRequestID,
            responseCode: ResponseCode,
            responseDescription: ResponseDescription,
            customerMessage: CustomerMessage,
            status: ResponseCode === '0' ? 'INITIATED' : 'FAILED',
          },
        });

      // Update payment request status
      await this.prisma.extended.paymentRequest.update({
        where: { id: paymentRequestId },
        data: {
          status: ResponseCode === '0' ? 'PROCESSING' : 'FAILED',
        },
      });

      this.logger.log(
        `M-Pesa STK Push initiated: ${CheckoutRequestID} for payment ${paymentRequestId}`,
      );

      return {
        success: ResponseCode === '0',
        message: CustomerMessage,
        checkoutRequestId: CheckoutRequestID,
        merchantRequestId: MerchantRequestID,
        transaction: mpesaTransaction,
      };
    } catch (error) {
      this.logger.error('M-Pesa STK Push failed', error);

      // Save failed transaction
      await this.prisma.extended.mpesaTransaction.create({
        data: {
          tenantId,
          paymentRequestId,
          memberId,
          phoneNumber,
          amount: paymentRequest.amount,
          accountReference: paymentRequestId,
          transactionDesc: paymentRequest.description || 'ZMOS Payment',
          status: 'FAILED',
          responseDescription:
            error.response?.data?.errorMessage || 'Unknown error',
        },
      });

      throw new BadRequestException(
        error.response?.data?.errorMessage || 'Failed to initiate payment',
      );
    }
  }

  /**
   * Handle M-Pesa callback
   */
  async handleMpesaCallback(callbackData: MpesaCallbackDto) {
    const { stkCallback } = callbackData.Body;
    const { CheckoutRequestID, ResultCode, ResultDesc } = stkCallback;

    this.logger.log(
      `M-Pesa callback received: ${CheckoutRequestID}, ResultCode: ${ResultCode}`,
    );

    // Find transaction by CheckoutRequestID
    const transaction = await this.prisma.extended.mpesaTransaction.findUnique({
      where: { checkoutRequestId: CheckoutRequestID },
    });

    if (!transaction) {
      this.logger.warn(`Transaction not found for ${CheckoutRequestID}`);
      return { success: false, message: 'Transaction not found' };
    }

    // Update transaction with callback data
    const updateData: any = {
      callbackReceived: true,
      callbackData: callbackData,
      resultCode: ResultCode.toString(),
      resultDesc: ResultDesc,
      status: ResultCode === 0 ? 'SUCCESS' : 'FAILED',
    };

    // If payment was successful, extract metadata
    if (ResultCode === 0 && stkCallback.CallbackMetadata) {
      const metadata = stkCallback.CallbackMetadata.Item;
      const getMetadataValue = (name: string) =>
        metadata.find((item) => item.Name === name)?.Value;

      updateData.mpesaReceiptNumber = getMetadataValue('MpesaReceiptNumber');
      updateData.transactionDate = new Date(
        Number(getMetadataValue('TransactionDate')),
      );
    }

    // Update transaction
    await this.prisma.extended.mpesaTransaction.update({
      where: { id: transaction.id },
      data: updateData,
    });

    // Update payment request status
    const paymentStatus = ResultCode === 0 ? 'COMPLETED' : 'FAILED';
    const paidAt = ResultCode === 0 ? new Date() : null;

    await this.prisma.extended.paymentRequest.update({
      where: { id: transaction.paymentRequestId },
      data: {
        status: paymentStatus,
        paidAt,
      },
    });

    // If successful, update trainer earnings
    if (ResultCode === 0) {
      await this.updateTrainerEarnings(transaction.paymentRequestId);
    }

    this.logger.log(
      `Payment ${transaction.paymentRequestId} marked as ${paymentStatus}`,
    );

    return { success: true, message: 'Callback processed' };
  }

  // ========================================================================
  // Trainer Revenue Methods
  // ========================================================================

  /**
   * Update trainer earnings when payment is completed
   */
  private async updateTrainerEarnings(paymentRequestId: string) {
    const paymentRequest = await this.getPaymentRequest(paymentRequestId);

    if (!paymentRequest.fromMemberId) {
      return; // No trainer to credit
    }

    const fromMember = paymentRequest.fromMember;
    if (fromMember.role !== 'TRAINER') {
      return; // Only credit trainers
    }

    const now = new Date();
    const month = now.getMonth() + 1; // 1-12
    const year = now.getFullYear();

    // Calculate platform fee (10%)
    const platformFeePercent = 0.1;
    const platformFee = paymentRequest.amount * platformFeePercent;
    const netEarnings = paymentRequest.amount - platformFee;

    // Upsert trainer earnings
    const earnings = await this.prisma.extended.trainerEarnings.upsert({
      where: {
        trainerId_month_year: {
          trainerId: paymentRequest.fromMemberId,
          month,
          year,
        },
      },
      update: {
        totalRevenue: { increment: paymentRequest.amount },
        platformFee: { increment: platformFee },
        netEarnings: { increment: netEarnings },
      },
      create: {
        tenantId: paymentRequest.tenantId,
        trainerId: paymentRequest.fromMemberId,
        month,
        year,
        totalRevenue: paymentRequest.amount,
        platformFee,
        netEarnings,
        status: 'PENDING',
      },
    });

    this.logger.log(
      `Trainer earnings updated: ${fromMember.name} earned ${netEarnings} ${paymentRequest.currency}`,
    );

    return earnings;
  }

  /**
  /**
   * Get all trainer earnings for a tenant (for owners)
   */
  async getAllTrainerEarnings(tenantId: string, month: number, year: number) {
    return this.prisma.extended.trainerEarnings.findMany({
      where: {
        tenantId,
        month,
        year,
      },
      include: {
        trainer: {
          select: {
            id: true,
            name: true,
            email: true,
            trainerCode: true,
          },
        },
      },
      orderBy: {
        netEarnings: 'desc',
      },
    });
  }

  /**
   * Update payout status (mark as PAID)
   */
  async updatePayoutStatus(
    payoutId: string,
    status: string,
    payoutReference?: string,
    payoutMethod?: string,
  ) {
    const payout = await this.prisma.extended.trainerEarnings.findUnique({
      where: { id: payoutId },
    });

    if (!payout) {
      throw new NotFoundException('Payout record not found');
    }

    return this.prisma.extended.trainerEarnings.update({
      where: { id: payoutId },
      data: {
        status,
        payoutReference,
        payoutMethod,
        payoutDate: status === 'PAID' ? new Date() : undefined,
      },
    });
  }

  /**
   * Get trainer revenue statistics
   */
  getTrainerRevenue(trainerId: string, month?: number, year?: number) {
    const whereClause: any = { trainerId };

    if (month && year) {
      whereClause.month = month;
      whereClause.year = year;
    }

    return this.prisma.extended.trainerEarnings.findMany({
      where: whereClause,
      orderBy: [{ year: 'desc' }, { month: 'desc' }],
    });
  }

  /**
   * Get payment history for a member
   */
  getPaymentHistory(memberId: string) {
    return this.prisma.extended.paymentRequest.findMany({
      where: {
        OR: [{ toMemberId: memberId }, { fromMemberId: memberId }],
        status: { in: ['COMPLETED', 'FAILED', 'REFUNDED'] },
      },
      include: {
        fromMember: {
          select: {
            id: true,
            name: true,
            email: true,
            role: true,
          },
        },
        toMember: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        mpesaTransactions: {
          where: {
            status: 'SUCCESS',
          },
          select: {
            mpesaReceiptNumber: true,
            transactionDate: true,
          },
        },
      },
      orderBy: {
        paidAt: 'desc',
      },
    });
  }
}
