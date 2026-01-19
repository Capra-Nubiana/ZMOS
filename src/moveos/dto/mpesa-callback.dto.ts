import { IsObject } from 'class-validator';

// M-Pesa callback DTO - based on Daraja API callback structure
export class MpesaCallbackDto {
  @IsObject()
  Body: {
    stkCallback: {
      MerchantRequestID: string;
      CheckoutRequestID: string;
      ResultCode: number;
      ResultDesc: string;
      CallbackMetadata?: {
        Item: Array<{
          Name: string;
          Value: string | number;
        }>;
      };
    };
  };
}

// Response items from successful callback
export interface MpesaCallbackMetadata {
  Amount: number;
  MpesaReceiptNumber: string;
  Balance?: number;
  TransactionDate: number; // Unix timestamp
  PhoneNumber: string;
}
