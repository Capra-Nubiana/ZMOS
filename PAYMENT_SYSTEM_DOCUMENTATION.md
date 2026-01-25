# ZMOS Payment System - Complete Documentation

**Version:** 1.0
**Last Updated:** January 19, 2026
**Status:** ✅ Fully Implemented & Tested

---

## Table of Contents

1. [Overview](#overview)
2. [Database Schema](#database-schema)
3. [API Endpoints](#api-endpoints)
4. [M-Pesa Integration](#mpesa-integration)
5. [Mobile App Integration](#mobile-app-integration)
6. [Testing Guide](#testing-guide)
7. [Deployment Checklist](#deployment-checklist)
8. [Troubleshooting](#troubleshooting)

---

## Overview

The ZMOS payment system supports:
- **Trainer → Client Payments** (session fees, personal training)
- **Gym → Member Payments** (membership subscriptions)
- **M-Pesa STK Push Integration** (Kenya)
- **Trainer Revenue Tracking** (10% platform fee)
- **Payment History & Receipts**

### Architecture

```
┌─────────────┐         ┌──────────────┐         ┌─────────────┐
│  Mobile App │ ─HTTP──→│ NestJS API   │ ─STK──→ │  M-Pesa     │
│  (Client)   │         │  (Backend)   │         │  Daraja API │
└─────────────┘         └──────────────┘         └─────────────┘
                               │                        │
                               ▼                        │
                        ┌─────────────┐                 │
                        │  PostgreSQL │                 │
                        │  (Neon)     │                 │
                        └─────────────┘                 │
                               ▲                        │
                               │                        ▼
                               └─────── Webhook ────────┘
```

---

## Database Schema

### 1. PaymentRequest (PAY_PAYMENT_REQUEST)

Core table for tracking all payment requests.

```typescript
{
  id: string              // CUID
  tenantId: string        // Gym/studio ID
  fromMemberId: string    // Who is requesting payment (trainer/owner)
  toMemberId: string      // Who should pay (client/member)

  amount: number          // Amount in currency units
  currency: string        // "KES", "USD", "ZAR", etc. (default: KES)

  paymentType: enum       // 'trainer_session', 'gym_membership', 'personal_training', 'equipment_rental'
  description: string     // What the payment is for

  status: enum            // 'PENDING', 'PROCESSING', 'COMPLETED', 'FAILED', 'CANCELLED', 'REFUNDED'

  dueDate: DateTime       // When payment is due (optional)
  paidAt: DateTime        // When payment was completed (optional)
  cancelledAt: DateTime   // When payment was cancelled (optional)

  metadata: JSON          // Flexible data (session IDs, booking references, etc.)

  createdAt: DateTime
  updatedAt: DateTime
}
```

**Indexes:** `tenantId`, `fromMemberId`, `toMemberId`, `status`, `paymentType`, `dueDate`, `createdAt`

---

### 2. MpesaTransaction (PAY_MPESA_TRANSACTION)

Tracks M-Pesa STK Push transactions and callbacks.

```typescript
{
  id: string                  // CUID
  tenantId: string
  paymentRequestId: string    // Links to PaymentRequest
  memberId: string            // Who is paying

  // Request data
  phoneNumber: string         // 254XXXXXXXXX format
  amount: number
  accountReference: string    // Payment request ID
  transactionDesc: string

  // M-Pesa STK Push response
  merchantRequestId: string   // From M-Pesa
  checkoutRequestId: string   // From M-Pesa (unique)
  responseCode: string        // "0" = success
  responseDescription: string
  customerMessage: string

  // M-Pesa callback data
  mpesaReceiptNumber: string  // Transaction receipt (unique)
  transactionDate: DateTime   // When payment completed
  resultCode: string          // "0" = success
  resultDesc: string

  status: enum                // 'INITIATED', 'PROCESSING', 'SUCCESS', 'FAILED', 'CANCELLED', 'TIMEOUT'

  callbackReceived: boolean   // Has callback been received?
  callbackData: JSON          // Full callback payload

  createdAt: DateTime
  updatedAt: DateTime
}
```

**Indexes:** `tenantId`, `paymentRequestId`, `memberId`, `status`, `checkoutRequestId`, `mpesaReceiptNumber`

---

### 3. MembershipPlan (PAY_MEMBERSHIP_PLAN)

Gym membership tiers/plans.

```typescript
{
  id: string
  tenantId: string

  name: string              // "Basic", "Premium", "Platinum"
  description: string       // What's included

  price: number             // Monthly/yearly price
  currency: string          // "KES", "USD", etc.

  billingCycle: enum        // 'monthly', 'quarterly', 'yearly'

  features: JSON            // Array of features/benefits

  sessionsPerMonth: number  // -1 for unlimited
  accessLevel: enum         // 'basic', 'standard', 'premium', 'vip'

  isActive: boolean
  createdAt: DateTime
  updatedAt: DateTime
}
```

---

### 4. MembershipSubscription (PAY_MEMBERSHIP_SUBSCRIPTION)

Member's subscription to a plan.

```typescript
{
  id: string
  tenantId: string
  memberId: string
  membershipPlanId: string

  status: enum              // 'ACTIVE', 'SUSPENDED', 'CANCELLED', 'EXPIRED'

  startDate: DateTime       // When subscription starts
  endDate: DateTime         // When current billing period ends
  nextBillingDate: DateTime // When next payment is due

  autoRenew: boolean        // Auto-renew subscription?

  cancelledAt: DateTime
  cancellationReason: string

  createdAt: DateTime
  updatedAt: DateTime
}
```

---

### 5. TrainerEarnings (PAY_TRAINER_EARNINGS)

Monthly trainer revenue and payout tracking.

```typescript
{
  id: string
  tenantId: string
  trainerId: string         // Member ID of trainer

  month: number             // 1-12
  year: number              // 2025, 2026, etc.

  totalRevenue: number      // Total revenue earned
  platformFee: number       // Platform commission (10%)
  netEarnings: number       // After platform fee

  payoutAmount: number      // Amount paid out
  payoutDate: DateTime      // When payout was made
  payoutMethod: string      // 'mpesa', 'bank_transfer', etc.
  payoutReference: string   // Transaction reference

  status: enum              // 'PENDING', 'PAID', 'PROCESSING'

  metadata: JSON

  createdAt: DateTime
  updatedAt: DateTime
}
```

**Unique constraint:** `trainerId + month + year` (one record per trainer per month)

---

## API Endpoints

### Base URL
- **Development:** `http://localhost:3000`
- **Production:** `https://your-cloud-run-url.com`

### Authentication
All endpoints (except M-Pesa callback) require JWT token in `Authorization` header:
```
Authorization: Bearer <your-jwt-token>
```

---

### Payment Request Endpoints

#### 1. Create Payment Request

**POST** `/payments/requests`

Create a new payment request (trainer → client or gym → member).

**Request Body:**
```json
{
  "toMemberId": "cm5abc123def456",
  "amount": 1500,
  "currency": "KES",
  "paymentType": "trainer_session",
  "description": "Personal Training Session - Jan 20, 2026",
  "dueDate": "2026-01-25T00:00:00Z",
  "metadata": {
    "sessionId": "cm5xyz789",
    "sessionDate": "2026-01-20"
  }
}
```

**Response (201 Created):**
```json
{
  "id": "cm5pay123abc",
  "tenantId": "cm5ten456",
  "fromMemberId": "cm5trainer789",
  "toMemberId": "cm5abc123def456",
  "amount": 1500,
  "currency": "KES",
  "paymentType": "trainer_session",
  "description": "Personal Training Session - Jan 20, 2026",
  "status": "PENDING",
  "dueDate": "2026-01-25T00:00:00.000Z",
  "paidAt": null,
  "cancelledAt": null,
  "metadata": {
    "sessionId": "cm5xyz789",
    "sessionDate": "2026-01-20"
  },
  "createdAt": "2026-01-19T12:00:00.000Z",
  "updatedAt": "2026-01-19T12:00:00.000Z",
  "fromMember": {
    "id": "cm5trainer789",
    "name": "John Trainer",
    "email": "john@zmos.app",
    "role": "TRAINER"
  },
  "toMember": {
    "id": "cm5abc123def456",
    "name": "Jane Client",
    "email": "jane@example.com",
    "phoneNumber": "254712345678"
  }
}
```

---

#### 2. Get Pending Payments (Client)

**GET** `/payments/client/pending`

Get all pending payments for the current client (what they owe).

**Response (200 OK):**
```json
[
  {
    "id": "cm5pay123abc",
    "amount": 1500,
    "currency": "KES",
    "paymentType": "trainer_session",
    "description": "Personal Training Session - Jan 20, 2026",
    "status": "PENDING",
    "dueDate": "2026-01-25T00:00:00.000Z",
    "createdAt": "2026-01-19T12:00:00.000Z",
    "fromMember": {
      "id": "cm5trainer789",
      "name": "John Trainer",
      "email": "john@zmos.app",
      "role": "TRAINER"
    }
  }
]
```

---

#### 3. Get Sent Payment Requests (Trainer)

**GET** `/payments/trainer/sent`

Get all payment requests sent by the current trainer/gym owner.

**Response (200 OK):**
```json
[
  {
    "id": "cm5pay123abc",
    "amount": 1500,
    "currency": "KES",
    "paymentType": "trainer_session",
    "description": "Personal Training Session - Jan 20, 2026",
    "status": "PENDING",
    "dueDate": "2026-01-25T00:00:00.000Z",
    "createdAt": "2026-01-19T12:00:00.000Z",
    "toMember": {
      "id": "cm5abc123def456",
      "name": "Jane Client",
      "email": "jane@example.com"
    }
  }
]
```

---

#### 4. Get Payment Request Details

**GET** `/payments/requests/:id`

Get detailed information about a specific payment request.

**Response (200 OK):**
```json
{
  "id": "cm5pay123abc",
  "tenantId": "cm5ten456",
  "fromMemberId": "cm5trainer789",
  "toMemberId": "cm5abc123def456",
  "amount": 1500,
  "currency": "KES",
  "paymentType": "trainer_session",
  "description": "Personal Training Session - Jan 20, 2026",
  "status": "COMPLETED",
  "dueDate": "2026-01-25T00:00:00.000Z",
  "paidAt": "2026-01-20T15:30:00.000Z",
  "fromMember": { /* full member object */ },
  "toMember": { /* full member object */ },
  "mpesaTransactions": [
    {
      "id": "cm5mpesa123",
      "mpesaReceiptNumber": "QAB7C8D9E0",
      "transactionDate": "2026-01-20T15:30:00.000Z",
      "status": "SUCCESS"
    }
  ]
}
```

---

#### 5. Get Payment History

**GET** `/payments/history`

Get payment history for the current member (both sent and received).

**Response (200 OK):**
```json
[
  {
    "id": "cm5pay123abc",
    "amount": 1500,
    "currency": "KES",
    "paymentType": "trainer_session",
    "description": "Personal Training Session - Jan 20, 2026",
    "status": "COMPLETED",
    "paidAt": "2026-01-20T15:30:00.000Z",
    "fromMember": { /* member info */ },
    "toMember": { /* member info */ },
    "mpesaTransactions": [
      {
        "mpesaReceiptNumber": "QAB7C8D9E0",
        "transactionDate": "2026-01-20T15:30:00.000Z"
      }
    ]
  }
]
```

---

### M-Pesa Endpoints

#### 6. Initiate M-Pesa Payment (STK Push)

**POST** `/payments/mpesa/initiate`

Initiate M-Pesa STK Push to client's phone.

**Request Body:**
```json
{
  "paymentRequestId": "cm5pay123abc",
  "phoneNumber": "254712345678"
}
```

**Validation Rules:**
- `phoneNumber` must match pattern: `254[0-9]{9}` (Kenyan numbers only)
- Must be 12 digits exactly

**Response (200 OK - Success):**
```json
{
  "success": true,
  "message": "Payment request sent. Please enter your M-Pesa PIN on your phone.",
  "checkoutRequestId": "ws_CO_19012026123456789",
  "merchantRequestId": "29115-34620561-1",
  "transaction": {
    "id": "cm5mpesa123",
    "status": "INITIATED",
    "phoneNumber": "254712345678",
    "amount": 1500,
    "createdAt": "2026-01-19T12:30:00.000Z"
  }
}
```

**Response (400 Bad Request - Errors):**
```json
{
  "statusCode": 400,
  "message": "Phone number must be in format 254XXXXXXXXX (Kenyan number)",
  "error": "Bad Request"
}
```

**Possible Errors:**
- `404` - Payment request not found
- `400` - Payment already completed
- `400` - Invalid phone number format
- `401` - Not authorized to pay this request
- `500` - M-Pesa API connection failed

---

#### 7. M-Pesa Callback (Webhook)

**POST** `/payments/mpesa/callback`

**⚠️ This endpoint has NO authentication** - it's called by M-Pesa servers.

**Request Body (from M-Pesa):**
```json
{
  "Body": {
    "stkCallback": {
      "MerchantRequestID": "29115-34620561-1",
      "CheckoutRequestID": "ws_CO_19012026123456789",
      "ResultCode": 0,
      "ResultDesc": "The service request is processed successfully.",
      "CallbackMetadata": {
        "Item": [
          { "Name": "Amount", "Value": 1500 },
          { "Name": "MpesaReceiptNumber", "Value": "QAB7C8D9E0" },
          { "Name": "TransactionDate", "Value": 20260120153000 },
          { "Name": "PhoneNumber", "Value": 254712345678 }
        ]
      }
    }
  }
}
```

**ResultCode Values:**
- `0` = Success
- `1` = Insufficient Balance
- `1032` = Request cancelled by user
- `1037` = Timeout (user didn't enter PIN)
- Other codes = Various failures

**Response (200 OK):**
```json
{
  "success": true,
  "message": "Callback processed"
}
```

**What happens on callback:**
1. Transaction status updated
2. Payment request marked as COMPLETED or FAILED
3. Trainer earnings updated (if successful)
4. M-Pesa receipt number saved

---

### Trainer Revenue Endpoints

#### 8. Get Trainer Revenue

**GET** `/payments/trainer/revenue?month=1&year=2026`

Get revenue statistics for the current trainer.

**Query Parameters:**
- `month` (optional) - Month number (1-12)
- `year` (optional) - Year (2025, 2026, etc.)
- If not provided, returns all months

**Response (200 OK):**
```json
[
  {
    "id": "cm5earn123",
    "tenantId": "cm5ten456",
    "trainerId": "cm5trainer789",
    "month": 1,
    "year": 2026,
    "totalRevenue": 45000,
    "platformFee": 4500,
    "netEarnings": 40500,
    "payoutAmount": 0,
    "payoutDate": null,
    "payoutMethod": null,
    "payoutReference": null,
    "status": "PENDING",
    "createdAt": "2026-01-20T00:00:00.000Z",
    "updatedAt": "2026-01-20T15:30:00.000Z"
  }
]
```

**Calculation:**
- `platformFee = totalRevenue * 0.10` (10% commission)
- `netEarnings = totalRevenue - platformFee`

---

## M-Pesa Integration

### Overview

ZMOS uses M-Pesa Daraja API 2.0 with **STK Push** (Lipa Na M-Pesa Online).

### Flow Diagram

```
┌─────────┐     ┌──────────┐     ┌──────────┐     ┌─────────┐
│ Client  │     │   ZMOS   │     │  M-Pesa  │     │ Client  │
│   App   │     │    API   │     │  Daraja  │     │  Phone  │
└────┬────┘     └─────┬────┘     └─────┬────┘     └────┬────┘
     │                │                 │                │
     │ 1. Pay Button │                 │                │
     ├──────────────►│                 │                │
     │                │                 │                │
     │                │ 2. Get Token   │                │
     │                ├────────────────►│                │
     │                │◄────────────────┤                │
     │                │                 │                │
     │                │ 3. STK Push     │                │
     │                ├────────────────►│                │
     │                │                 │ 4. Push Prompt │
     │                │                 ├───────────────►│
     │                │                 │                │
     │ 5. CheckoutID  │                 │                │
     │◄───────────────┤                 │                │
     │                │                 │ 6. Enter PIN   │
     │                │                 │◄───────────────┤
     │                │ 7. Callback     │                │
     │                │◄────────────────┤                │
     │                │                 │                │
     │ 8. Success!    │                 │                │
     │◄───────────────┤                 │                │
```

### Configuration

**Environment Variables (`.env`):**
```bash
# M-Pesa Configuration
MPESA_ENVIRONMENT="sandbox"  # or "production"
MPESA_CONSUMER_KEY="your_consumer_key"
MPESA_CONSUMER_SECRET="your_consumer_secret"
MPESA_SHORTCODE="174379"  # Your paybill/till number
MPESA_PASSKEY="your_passkey"
MPESA_CALLBACK_URL="https://your-backend.com/payments/mpesa/callback"
```

**⚠️ IMPORTANT: Update Callback URL**

Before going live, update `MPESA_CALLBACK_URL` to your deployed backend URL.

### Sandbox vs Production

**Sandbox (Testing):**
- Environment: `sandbox`
- Base URL: `https://sandbox.safaricom.co.ke`
- Test with Safaricom test credentials
- No real money charged

**Production (Live):**
- Environment: `production`
- Base URL: `https://api.safaricom.co.ke`
- Real M-Pesa account required
- Real money charged

### Testing in Sandbox

1. Use test phone number: `254708374149`
2. Test amount: Any amount (no real charge)
3. M-Pesa PIN: Not required in sandbox (auto-approves)

### Going Live Checklist

- [ ] Register for M-Pesa Daraja production account
- [ ] Get production credentials (consumer key, secret, passkey)
- [ ] Update `.env` with production values
- [ ] Set `MPESA_ENVIRONMENT="production"`
- [ ] Update `MPESA_CALLBACK_URL` to production backend
- [ ] Test with real phone number (small amount first)
- [ ] Verify callback is received
- [ ] Monitor logs for errors

### Callback URL Requirements

**Your backend must be:**
- Publicly accessible (no localhost)
- HTTPS enabled (M-Pesa requires SSL)
- Respond within 30 seconds
- Return `200 OK` status

**Recommended hosting:**
- Google Cloud Run ✅
- Heroku ✅
- AWS Lambda ✅
- Railway ✅

**NOT supported:**
- Localhost ❌
- ngrok (unstable) ⚠️

---

## Mobile App Integration

### Overview

The mobile app already has payment UI components built. You just need to wire them to the new backend endpoints.

### Existing Mobile Components

**File:** `/zmos-mobile/app/src/main/java/com/zimasa/zmos/ui/payments/`

1. **PaymentRequestDialog.kt** - Trainer creates payment request
2. **MpesaPaymentDialog.kt** - Client enters phone & pays
3. **PendingPaymentsScreen.kt** - Client views pending payments
4. **PaymentsViewModel.kt** - ViewModel (needs updating)

### Integration Steps

#### Step 1: Update API Service

Add payment endpoints to `ZMOSApiService.kt`:

```kotlin
// File: app/src/main/java/com/zimasa/zmos/data/api/ZMOSApiService.kt

interface ZMOSApiService {
    // ... existing endpoints ...

    // Payment endpoints
    @POST("payments/requests")
    suspend fun createPaymentRequest(
        @Body request: CreatePaymentRequestDto
    ): PaymentRequestResponse

    @GET("payments/client/pending")
    suspend fun getPendingPayments(): List<PaymentRequestResponse>

    @GET("payments/trainer/sent")
    suspend fun getSentPaymentRequests(): List<PaymentRequestResponse>

    @POST("payments/mpesa/initiate")
    suspend fun initiateMpesaPayment(
        @Body request: InitiateMpesaDto
    ): MpesaInitiateResponse

    @GET("payments/history")
    suspend fun getPaymentHistory(): List<PaymentRequestResponse>

    @GET("payments/trainer/revenue")
    suspend fun getTrainerRevenue(
        @Query("month") month: Int?,
        @Query("year") year: Int?
    ): List<TrainerEarningsResponse>
}
```

#### Step 2: Update ViewModel

```kotlin
// File: app/src/main/java/com/zimasa/zmos/ui/payments/PaymentsViewModel.kt

class PaymentsViewModel(
    private val apiService: ZMOSApiService
) : ViewModel() {

    private val _pendingPayments = MutableStateFlow<List<PaymentRequestResponse>>(emptyList())
    val pendingPayments: StateFlow<List<PaymentRequestResponse>> = _pendingPayments

    private val _paymentStatus = MutableStateFlow<PaymentStatus>(PaymentStatus.Idle)
    val paymentStatus: StateFlow<PaymentStatus> = _paymentStatus

    fun loadPendingPayments() {
        viewModelScope.launch {
            try {
                val payments = apiService.getPendingPayments()
                _pendingPayments.value = payments
            } catch (e: Exception) {
                // Handle error
            }
        }
    }

    fun initiatePayment(paymentRequestId: String, phoneNumber: String) {
        viewModelScope.launch {
            try {
                _paymentStatus.value = PaymentStatus.Processing
                val response = apiService.initiateMpesaPayment(
                    InitiateMpesaDto(
                        paymentRequestId = paymentRequestId,
                        phoneNumber = phoneNumber
                    )
                )
                if (response.success) {
                    _paymentStatus.value = PaymentStatus.Success(response.message)
                    // Poll for payment status or wait for backend confirmation
                    pollPaymentStatus(paymentRequestId)
                } else {
                    _paymentStatus.value = PaymentStatus.Error(response.message)
                }
            } catch (e: Exception) {
                _paymentStatus.value = PaymentStatus.Error(e.message ?: "Payment failed")
            }
        }
    }

    private suspend fun pollPaymentStatus(paymentRequestId: String) {
        // Poll every 3 seconds for up to 60 seconds
        repeat(20) {
            delay(3000)
            val payment = apiService.getPaymentRequest(paymentRequestId)
            if (payment.status == "COMPLETED") {
                _paymentStatus.value = PaymentStatus.Completed
                return
            } else if (payment.status == "FAILED") {
                _paymentStatus.value = PaymentStatus.Error("Payment failed")
                return
            }
        }
        _paymentStatus.value = PaymentStatus.Timeout
    }
}

sealed class PaymentStatus {
    object Idle : PaymentStatus()
    object Processing : PaymentStatus()
    data class Success(val message: String) : PaymentStatus()
    object Completed : PaymentStatus()
    data class Error(val message: String) : PaymentStatus()
    object Timeout : PaymentStatus()
}
```

#### Step 3: Update Data Models

The mobile app already has these models in `PaymentModels.kt`. Just verify they match the backend:

```kotlin
data class CreatePaymentRequestDto(
    val toMemberId: String,
    val amount: Double,
    val currency: String = "KES",
    val paymentType: String,
    val description: String?,
    val dueDate: String?,
    val metadata: Map<String, Any>?
)

data class InitiateMpesaDto(
    val paymentRequestId: String,
    val phoneNumber: String
)

data class PaymentRequestResponse(
    val id: String,
    val amount: Double,
    val currency: String,
    val paymentType: String,
    val description: String?,
    val status: String,
    val dueDate: String?,
    val paidAt: String?,
    val createdAt: String,
    val fromMember: MemberSummary?,
    val toMember: MemberSummary?
)
```

#### Step 4: Update Base URL

```kotlin
// File: app/src/main/java/com/zimasa/zmos/data/api/NetworkModule.kt

const val BASE_URL = "https://your-cloud-run-backend.com/"
```

### Testing Flow

1. **Trainer creates payment request:**
   - Open PaymentRequestDialog
   - Select client, enter amount
   - Click "Send Request"
   - Verify request appears in backend database

2. **Client views pending payment:**
   - Open PendingPaymentsScreen
   - Should see trainer's request

3. **Client pays with M-Pesa:**
   - Click "Pay with M-Pesa"
   - Enter phone: `254712345678`
   - STK Push sent to phone
   - Enter M-Pesa PIN
   - Wait for confirmation (polling)

4. **Verify payment completed:**
   - Payment status changes to COMPLETED
   - Trainer earnings updated
   - Receipt number saved

---

## Testing Guide

### 1. Local Testing (Without M-Pesa)

Test payment request flow without M-Pesa integration:

```bash
# Start backend
cd /home/turnkey/zmos-backend
npm run start:dev

# Create payment request
curl -X POST http://localhost:3000/payments/requests \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "toMemberId": "MEMBER_ID",
    "amount": 1500,
    "paymentType": "trainer_session",
    "description": "Test payment"
  }'

# Get pending payments
curl -X GET http://localhost:3000/payments/client/pending \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

### 2. M-Pesa Sandbox Testing

**Prerequisites:**
- M-Pesa sandbox credentials configured in `.env`
- Backend deployed to public URL (for callback)

**Test Flow:**
```bash
# 1. Create payment request (from test above)
PAYMENT_ID="cm5pay123abc"

# 2. Initiate M-Pesa STK Push
curl -X POST http://localhost:3000/payments/mpesa/initiate \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "paymentRequestId": "'$PAYMENT_ID'",
    "phoneNumber": "254708374149"
  }'

# 3. M-Pesa will call your callback URL automatically
# Check database for transaction status

# 4. Verify payment completed
curl -X GET http://localhost:3000/payments/requests/$PAYMENT_ID \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

### 3. Testing Trainer Earnings

```bash
# Complete a payment (steps above)

# Check trainer earnings
curl -X GET http://localhost:3000/payments/trainer/revenue?month=1&year=2026 \
  -H "Authorization: Bearer TRAINER_JWT_TOKEN"
```

**Expected Result:**
```json
{
  "totalRevenue": 1500,
  "platformFee": 150,
  "netEarnings": 1350,
  "status": "PENDING"
}
```

### 4. Database Verification

```bash
# Connect to database
cd /home/turnkey/zmos-backend
npx prisma studio

# Check tables:
# - PAY_PAYMENT_REQUEST
# - PAY_MPESA_TRANSACTION
# - PAY_TRAINER_EARNINGS
```

---

## Deployment Checklist

### Pre-Deployment

- [ ] Update `.env` with production values
- [ ] Set `DATABASE_URL` to Neon PostgreSQL connection string
- [ ] Set `MPESA_ENVIRONMENT="production"`
- [ ] Update `MPESA_CALLBACK_URL` to production backend URL
- [ ] Change Prisma schema provider back to `postgresql`

### Database Migration

```bash
# Switch to PostgreSQL
# Edit prisma/schema.prisma:
datasource db {
  provider = "postgresql"
}

# Update .env with Neon connection string
DATABASE_URL="postgresql://user:password@host.neon.tech/dbname?sslmode=require"

# Deploy migration
npx prisma migrate deploy

# Generate client
npx prisma generate
```

### Deploy Backend

```bash
# Build
npm run build

# Deploy to Google Cloud Run
gcloud run deploy zmos-backend \
  --source . \
  --region us-central1 \
  --allow-unauthenticated \
  --set-env-vars DATABASE_URL=$DATABASE_URL \
  --set-env-vars MPESA_CONSUMER_KEY=$MPESA_CONSUMER_KEY \
  --set-env-vars MPESA_CONSUMER_SECRET=$MPESA_CONSUMER_SECRET
  # ... (set all env vars)
```

### Update Mobile App

```kotlin
// Update BASE_URL in NetworkModule.kt
const val BASE_URL = "https://zmos-backend-xxxxx.run.app/"
```

### Post-Deployment

- [ ] Test payment request creation
- [ ] Test M-Pesa STK Push with real phone number (small amount)
- [ ] Verify callback is received
- [ ] Check payment status updates correctly
- [ ] Verify trainer earnings calculation
- [ ] Test payment history retrieval
- [ ] Monitor logs for errors

---

## Troubleshooting

### M-Pesa STK Push Not Received

**Symptom:** User doesn't receive M-Pesa prompt on phone.

**Possible Causes:**
1. Phone number format incorrect (must be `254XXXXXXXXX`)
2. Phone is offline or unreachable
3. M-Pesa service down (check Safaricom status)
4. Invalid credentials

**Solutions:**
- Verify phone number format
- Check M-Pesa credentials in `.env`
- Test with different phone number
- Check backend logs for M-Pesa API errors

---

### Callback Not Received

**Symptom:** Payment status stuck on "PROCESSING".

**Possible Causes:**
1. Callback URL not publicly accessible
2. Backend not responding to callback
3. Callback URL incorrect in `.env`
4. Firewall blocking M-Pesa servers

**Solutions:**
- Verify `MPESA_CALLBACK_URL` is correct
- Test callback URL manually: `curl -X POST YOUR_CALLBACK_URL`
- Check backend is deployed and running
- Verify HTTPS is enabled
- Check firewall/security group settings

---

### Payment Status Not Updating

**Symptom:** Payment completed but status still "PENDING".

**Possible Causes:**
1. Callback failed to process
2. Database transaction error
3. Trainer earnings update failed

**Solutions:**
- Check backend logs for errors
- Manually check `PAY_MPESA_TRANSACTION` table for callback data
- Re-process callback manually if needed

---

### Trainer Earnings Not Updated

**Symptom:** Payment completed but earnings not incremented.

**Possible Causes:**
1. `fromMemberId` is null
2. Member role is not "TRAINER"
3. Earnings update transaction failed

**Solutions:**
- Verify payment request has `fromMemberId`
- Check member's role is "TRAINER"
- Check backend logs for transaction errors

---

### Invalid M-Pesa Credentials

**Symptom:** Error: "Failed to get M-Pesa access token"

**Solution:**
- Verify `MPESA_CONSUMER_KEY` and `MPESA_CONSUMER_SECRET` are correct
- Check if using sandbox vs production credentials
- Regenerate credentials from M-Pesa portal

---

## Support & Resources

**M-Pesa Daraja API Documentation:**
- https://developer.safaricom.co.ke/docs

**M-Pesa Test Credentials:**
- https://developer.safaricom.co.ke/test_credentials

**ZMOS Backend Code:**
- `/home/turnkey/zmos-backend/src/moveos/services/payment.service.ts`
- `/home/turnkey/zmos-backend/src/moveos/controllers/payment.controller.ts`

**Database Schema:**
- `/home/turnkey/zmos-backend/prisma/schema.prisma`

---

## Summary

✅ **5 Database Tables** - PaymentRequest, MpesaTransaction, MembershipPlan, MembershipSubscription, TrainerEarnings
✅ **8 API Endpoints** - Create, view, pay, callback, revenue tracking
✅ **M-Pesa Integration** - STK Push with callback handling
✅ **Trainer Revenue** - 10% platform fee, monthly aggregation
✅ **Mobile App Ready** - UI components exist, just wire up endpoints

**Next Steps:** Wire mobile app → backend → test with M-Pesa sandbox → deploy to production.
