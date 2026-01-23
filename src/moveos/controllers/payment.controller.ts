/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-argument */
/* eslint-disable @typescript-eslint/no-unsafe-return */

import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Query,
  UseGuards,
} from '@nestjs/common';
import { PaymentService } from '../services/payment.service';
import { JwtAuthGuard } from '../../auth/jwt-auth.guard';
import { CurrentMember } from '../../auth/current-member.decorator';
import { CreatePaymentRequestDto } from '../dto/create-payment-request.dto';
import { InitiateMpesaDto } from '../dto/initiate-mpesa.dto';
import { MpesaCallbackDto } from '../dto/mpesa-callback.dto';

@Controller('payments')
export class PaymentController {
  constructor(private readonly paymentService: PaymentService) { }

  // ========================================================================
  // Payment Request Endpoints
  // ========================================================================

  /**
   * POST /payments/requests
   * Create a new payment request (trainer → client or gym → member)
   */
  @Post('requests')
  @UseGuards(JwtAuthGuard)
  createPaymentRequest(
    @Body() createPaymentRequestDto: CreatePaymentRequestDto,
    @CurrentMember() member: any,
  ) {
    return this.paymentService.createPaymentRequest(
      createPaymentRequestDto,
      member.id,
      member.tenantId,
    );
  }

  /**
   * GET /payments/client/pending
   * Get pending payments for current client (what they need to pay)
   */
  @Get('client/pending')
  @UseGuards(JwtAuthGuard)
  getPendingPayments(@CurrentMember() member: any) {
    return this.paymentService.getPendingPayments(member.id);
  }

  /**
   * GET /payments/trainer/sent
   * Get payment requests sent by trainer/gym owner
   */
  @Get('trainer/sent')
  @UseGuards(JwtAuthGuard)
  getSentPaymentRequests(@CurrentMember() member: any) {
    return this.paymentService.getSentPaymentRequests(member.id);
  }

  /**
   * GET /payments/requests/:id
   * Get payment request details by ID
   */
  @Get('requests/:id')
  @UseGuards(JwtAuthGuard)
  getPaymentRequest(@Param('id') id: string) {
    return this.paymentService.getPaymentRequest(id);
  }

  /**
   * GET /payments/history
   * Get payment history for current member
   */
  @Get('history')
  @UseGuards(JwtAuthGuard)
  getPaymentHistory(@CurrentMember() member: any) {
    return this.paymentService.getPaymentHistory(member.id);
  }

  // ========================================================================
  // M-Pesa Endpoints
  // ========================================================================

  /**
   * POST /payments/mpesa/initiate
   * Initiate M-Pesa STK Push payment
   */
  @Post('mpesa/initiate')
  @UseGuards(JwtAuthGuard)
  initiateMpesaPayment(
    @Body() initiateMpesaDto: InitiateMpesaDto,
    @CurrentMember() member: any,
  ) {
    return this.paymentService.initiateMpesaPayment(
      initiateMpesaDto,
      member.id,
      member.tenantId,
    );
  }

  /**
   * POST /payments/mpesa/callback
   * M-Pesa callback handler (webhook from Safaricom)
   * Note: This endpoint should NOT have authentication guard
   */
  @Post('mpesa/callback')
  handleMpesaCallback(@Body() callbackData: MpesaCallbackDto) {
    return this.paymentService.handleMpesaCallback(callbackData);
  }

  // ========================================================================
  // Trainer Revenue Endpoints
  // ========================================================================

  /**
   * GET /payments/trainer/revenue
   * Get trainer revenue statistics
   * Query params: month (optional), year (optional)
   */
  @Get('trainer/revenue')
  @UseGuards(JwtAuthGuard)
  getTrainerRevenue(
    @CurrentMember() member: any,
    @Query('month') month?: string,
    @Query('year') year?: string,
  ) {
    const monthNum = month ? parseInt(month, 10) : undefined;
    const yearNum = year ? parseInt(year, 10) : undefined;

    return this.paymentService.getTrainerRevenue(member.id, monthNum, yearNum);
  }

  /**
   * GET /payments/owner/trainer-earnings
   * Get all trainer earnings for a tenant (Owner/Admin)
   */
  @Get('owner/trainer-earnings')
  @UseGuards(JwtAuthGuard)
  getAllTrainerEarnings(
    @CurrentMember() member: any,
    @Query('month') month: string,
    @Query('year') year: string,
  ) {
    const monthNum = parseInt(month, 10);
    const yearNum = parseInt(year, 10);
    return this.paymentService.getAllTrainerEarnings(
      member.tenantId,
      monthNum,
      yearNum,
    );
  }

  /**
   * PATCH /payments/owner/payouts/:id
   * Update payout status (mark as PAID)
   */
  @Post('owner/payouts/:id/status') // Using Post for status update to avoid patch complexity for now
  @UseGuards(JwtAuthGuard)
  updatePayoutStatus(
    @Param('id') id: string,
    @Body('status') status: string,
    @Body('reference') reference?: string,
    @Body('method') method?: string,
  ) {
    return this.paymentService.updatePayoutStatus(id, status, reference, method);
  }
}
