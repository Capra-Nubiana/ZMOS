#!/bin/bash

echo "Testing Trainer Profile Completion API..."
echo ""

# Login or create a test trainer account
TOKEN="your-jwt-token-here"  # You'll need to replace this

# Test payload with new fields
curl -X POST http://localhost:3000/members/my/profile/complete/trainer \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -H "x-tenant-id: your-tenant-id" \
  -d '{
    "bio": "Certified fitness trainer with 5 years experience",
    "specializations": ["STRENGTH_TRAINING", "YOGA"],
    "experience": "5 years",
    "hourlyRate": 50,
    "languages": ["English", "Spanish"],
    "trainerType": "freelance",
    "businessHours": {
      "monday": [{"startTime": "09:00", "endTime": "17:00"}],
      "tuesday": [{"startTime": "09:00", "endTime": "17:00"}],
      "wednesday": [{"startTime": "09:00", "endTime": "17:00"}]
    }
  }' | jq .

echo ""
echo "Check the response above for the trainer code!"
