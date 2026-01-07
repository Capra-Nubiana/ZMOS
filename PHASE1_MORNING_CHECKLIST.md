# Phase 1 Implementation Checklist - Morning Tasks

**Date**: December 27, 2025 (Morning)
**Goal**: Complete Phase 1 Critical APIs (6-8 hours)
**Focus**: Get mobile app MVP ready

---

## Pre-Implementation Setup (15 minutes)

### ☐ 1. Get Google AI API Key
- [ ] Visit: https://aistudio.google.com/app/apikey
- [ ] Sign in with Google account
- [ ] Click "Create API Key"
- [ ] Copy the key (starts with `AIzaSyC...`)
- [ ] Keep it secure

### ☐ 2. Update Environment Variables
```bash
# Edit .env file
nano .env

# Add this line:
GOOGLE_AI_API_KEY="AIzaSyC_paste_your_actual_key_here"

# Save and exit (Ctrl+X, Y, Enter)
```

### ☐ 3. Install Dependencies
```bash
cd /home/turnkey/zmos-backend
npm install @google/generative-ai
```

### ☐ 4. Test Gemini Connection
```bash
# Create test file
cat > test-gemini.js << 'EOF'
require('dotenv').config();
const { GoogleGenerativeAI } = require('@google/generative-ai');

async function testGemini() {
  const genAI = new GoogleGenerativeAI(process.env.GOOGLE_AI_API_KEY);
  const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

  console.log('🧪 Testing Gemini AI...');
  try {
    const result = await model.generateContent('Hello! Are you working?');
    const response = await result.response;
    console.log('✅ Success:', response.text());
  } catch (error) {
    console.error('❌ Failed:', error.message);
  }
}

testGemini();
EOF

# Run test
node test-gemini.js
```

**Expected**: You should see "✅ Success:" with AI response

---

## Implementation Tasks

### Task 1: Member Profile APIs (2-3 hours)

#### ☐ 1.1 Create Member Service
**File**: `src/moveos/services/member.service.ts`

```bash
# Create the file
touch src/moveos/services/member.service.ts
```

**Implementation Points**:
- [ ] `getProfile(memberId)` - Get member details
- [ ] `updateProfile(memberId, data)` - Update name, avatar
- [ ] `getMemberStats(memberId)` - Calculate activity statistics
- [ ] Include: bookings count, attendance rate, current streak

#### ☐ 1.2 Update Member Controller
**File**: `src/moveos/controllers/member.controller.ts`

**Add these endpoints**:
- [ ] `GET /my/profile` - Current member's profile
- [ ] `PUT /my/profile` - Update profile
- [ ] `GET /my/stats` - Activity statistics

#### ☐ 1.3 Test Profile APIs
```bash
# After implementation, test with:

# 1. Get profile
curl -X GET http://localhost:3000/my/profile \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"

# 2. Update profile
curl -X PUT http://localhost:3000/my/profile \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"name": "Updated Name"}'

# 3. Get stats
curl -X GET http://localhost:3000/my/stats \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

---

### Task 2: Session Discovery APIs (2-3 hours)

#### ☐ 2.1 Update Session Service
**File**: `src/moveos/services/session.service.ts`

**Add methods**:
- [ ] `getUpcomingSessions(tenantId, days, filters)` - Next 7 days
- [ ] `getTodaysSessions(tenantId)` - Today's sessions
- [ ] `getMemberBookedSessions(memberId)` - Member's bookings

#### ☐ 2.2 Update Session Controller
**File**: `src/moveos/controllers/session.controller.ts`

**Add endpoints**:
- [ ] `GET /sessions/upcoming` - Upcoming sessions
- [ ] `GET /sessions/today` - Today's sessions
- [ ] `GET /sessions/my-bookings` - Member's booked sessions

**Query Parameters**:
- `days` (optional): Look-ahead days (default: 7)
- `category` (optional): Filter by category
- `locationId` (optional): Filter by location

#### ☐ 2.3 Test Session Discovery APIs
```bash
# 1. Get upcoming sessions
curl -X GET "http://localhost:3000/sessions/upcoming?days=7" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"

# 2. Get today's sessions
curl -X GET http://localhost:3000/sessions/today \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"

# 3. Get my bookings
curl -X GET http://localhost:3000/sessions/my-bookings \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

---

### Task 3: AI Recommendations (1-2 hours)

#### ☐ 3.1 Create AI Module and Service
```bash
# Create directory structure
mkdir -p src/ai/dto

# Create files
touch src/ai/ai.module.ts
touch src/ai/ai.service.ts
touch src/ai/dto/recommendation.dto.ts
```

**Follow**: Instructions in `GOOGLE_GEMINI_INTEGRATION.md`

#### ☐ 3.2 Create Recommendation Controller
```bash
touch src/moveos/controllers/recommendation.controller.ts
```

**Implement**:
- [ ] `GET /sessions/recommended` - AI recommendations

#### ☐ 3.3 Update MoveOS Module
**File**: `src/moveos/moveos.module.ts`

- [ ] Import `AiModule`
- [ ] Add `RecommendationController`

#### ☐ 3.4 Test AI Recommendations
```bash
curl -X GET http://localhost:3000/sessions/recommended \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

**Expected Response**:
```json
{
  "recommendations": [
    {
      "sessionType": { ... },
      "reason": "AI-generated reason",
      "score": 0.85
    }
  ],
  "confidence": 0.85,
  "source": "ai"
}
```

---

## Testing Checklist

### ☐ Unit Tests (Optional for Phase 1)
- [ ] Member service tests
- [ ] Session service tests
- [ ] AI service tests

### ☐ Manual Testing (Required)
- [ ] All endpoints return 200 OK
- [ ] JWT authentication works
- [ ] Data is tenant-isolated
- [ ] AI recommendations are reasonable
- [ ] Fallback to rules works when AI fails

### ☐ Mobile App Integration
- [ ] Share API documentation with mobile team
- [ ] Provide example requests/responses
- [ ] Test with real mobile app

---

## File Creation Summary

**New Files to Create** (9 files):

```
src/
├── ai/
│   ├── ai.module.ts                      # NEW
│   ├── ai.service.ts                     # NEW
│   └── dto/
│       └── recommendation.dto.ts         # NEW
├── moveos/
│   ├── services/
│   │   └── member.service.ts             # NEW
│   └── controllers/
│       └── recommendation.controller.ts  # NEW
└── test-gemini.js                         # NEW (temporary test)
```

**Files to Modify** (3 files):

```
src/moveos/
├── controllers/
│   ├── member.controller.ts              # MODIFY
│   └── session.controller.ts             # MODIFY
├── services/
│   └── session.service.ts                # MODIFY
└── moveos.module.ts                      # MODIFY
```

---

## Quick Reference Commands

### Start Development Server
```bash
cd /home/turnkey/zmos-backend
npm run start:dev
```

### Check Running Server
```bash
curl http://localhost:3000
```

### Test Endpoints (Get JWT first)
```bash
# Login to get JWT token
curl -X POST http://localhost:3000/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "ikambili34@gmail.com",
    "password": "your_password"
  }'

# Copy the "token" from response
# Use it in all subsequent requests as:
# -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

### Monitor Backend Logs
```bash
# Watch logs in real-time
tail -f logs/combined.log

# Or just watch console output
# (Already running in your terminal)
```

---

## Success Criteria

### Phase 1 Complete When:
- [x] ✅ Google Gemini AI integrated and tested
- [ ] ✅ GET `/my/profile` working
- [ ] ✅ PUT `/my/profile` working
- [ ] ✅ GET `/my/stats` working
- [ ] ✅ GET `/sessions/upcoming` working
- [ ] ✅ GET `/sessions/today` working
- [ ] ✅ GET `/sessions/my-bookings` working
- [ ] ✅ GET `/sessions/recommended` working (with AI)
- [ ] ✅ All endpoints tested with Postman/curl
- [ ] ✅ Mobile team can integrate APIs

---

## Time Estimates

| Task | Time | Priority |
|------|------|----------|
| **Setup** | 15 min | CRITICAL |
| **Member Profile APIs** | 2-3 hours | HIGH |
| **Session Discovery APIs** | 2-3 hours | HIGH |
| **AI Recommendations** | 1-2 hours | MEDIUM |
| **Testing** | 1 hour | HIGH |
| **Documentation** | 30 min | MEDIUM |
| **Total** | **6-8 hours** | - |

---

## Troubleshooting

### If Gemini AI test fails:
1. Check API key in `.env`
2. Verify internet connection
3. Check rate limits (15 req/min)
4. Restart server: `npm run start:dev`

### If endpoints return 401:
1. Check JWT token is valid
2. Token should be in header: `Authorization: Bearer TOKEN`
3. Token expires after 24h - get new one

### If server won't start:
1. Check all imports are correct
2. Run: `npm install`
3. Check for TypeScript errors: `npm run build`

---

## Next Steps After Phase 1

Once Phase 1 is complete:
1. ✅ Mobile team can start UI/UX implementation
2. ✅ You can begin Phase 2 APIs (waitlist, notifications, history)
3. ✅ Add more sophisticated AI features

---

## Resources

### Documentation
- ✅ `MISSING_APIS_PHASE1_PHASE2.md` - Full API list
- ✅ `GOOGLE_GEMINI_INTEGRATION.md` - AI integration guide
- ✅ `test/MOBILE_GUIDE.md` - Mobile app guide

### Google Services
- **Gemini API Key**: https://aistudio.google.com/app/apikey
- **Gemini Documentation**: https://ai.google.dev/docs
- **Rate Limits**: 1,500 requests/day (free)

### Testing Tools
- **Postman**: Test APIs with GUI
- **curl**: Command-line testing
- **Thunder Client** (VS Code): In-editor testing

---

**Status**: 📋 Ready to start in the morning
**Estimated Completion**: End of day (assuming 6-8 hours focused work)
**Blockers**: None - all dependencies documented

**Good luck with Phase 1 implementation! 🚀**
