import { IsString, IsUUID, Matches, Length } from 'class-validator';

export class InitiateMpesaDto {
  @IsUUID()
  paymentRequestId: string;

  @IsString()
  @Matches(/^254[0-9]{9}$/, {
    message: 'Phone number must be in format 254XXXXXXXXX (Kenyan number)',
  })
  @Length(12, 12)
  phoneNumber: string; // Kenyan phone number (254XXXXXXXXX)
}
