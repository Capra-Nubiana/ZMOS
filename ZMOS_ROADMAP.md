# ZMOS Development Roadmap

**Last Updated:** January 19, 2026
**Current Status:** Phase 3A Complete ✅

---

## 🎯 What's Done (Phase 3A - Payment System)

### ✅ Backend Payment System (100%)
- **Database Schema:** 5 tables created (PaymentRequest, MpesaTransaction, MembershipPlan, MembershipSubscription, TrainerEarnings)
- **API Endpoints:** 8 endpoints fully functional
- **M-Pesa Integration:** STK Push + callback webhook working
- **Trainer Revenue:** 10% platform fee, monthly earnings aggregation
- **Documentation:** Complete API docs with examples

### ✅ Mobile App (Partial)
- **Payment UI:** Dialogs and screens exist
- **Data Models:** DTOs defined
- **Status:** Needs wiring to new backend endpoints (2-3 hours)

---

## 📋 Remaining Work - Priority Order

---

## **PHASE 3B: Complete Payment Integration** (2-4 hours)

**Goal:** Wire mobile app to backend payment endpoints and test end-to-end flow.

### Tasks

#### 1. Mobile App Backend Integration
- [ ] Update `ZMOSApiService.kt` with payment endpoints
- [ ] Update `PaymentsViewModel.kt` with API calls
- [ ] Implement payment status polling (check every 3s for 60s)
- [ ] Update BASE_URL to production backend

**Files to Edit:**
- `/zmos-mobile/app/src/main/java/com/zimasa/zmos/data/api/ZMOSApiService.kt`
- `/zmos-mobile/app/src/main/java/com/zimasa/zmos/ui/payments/PaymentsViewModel.kt`
- `/zmos-mobile/app/src/main/java/com/zimasa/zmos/di/NetworkModule.kt`

**Estimated Time:** 2 hours

#### 2. Deploy Backend to Production
- [ ] Update `.env` with Neon PostgreSQL connection string
- [ ] Change Prisma schema provider to `postgresql`
- [ ] Run `npx prisma migrate deploy`
- [ ] Deploy to Google Cloud Run
- [ ] Update `MPESA_CALLBACK_URL` to production URL

**Files to Edit:**
- `/zmos-backend/.env`
- `/zmos-backend/prisma/schema.prisma`

**Commands:**
```bash
cd /home/turnkey/zmos-backend
npx prisma migrate deploy
gcloud run deploy zmos-backend --source .
```

**Estimated Time:** 1 hour

#### 3. Test Payment Flow End-to-End
- [ ] Trainer creates payment request → client
- [ ] Client sees pending payment
- [ ] Client initiates M-Pesa payment
- [ ] STK Push received on phone
- [ ] Client enters PIN
- [ ] Callback updates payment status
- [ ] Trainer earnings updated
- [ ] Payment history shows transaction

**Estimated Time:** 1 hour

**Status:** 🟡 Ready to Start
**Priority:** HIGH
**Blocking:** Session booking payments

---

## **PHASE 4: Interactive Map View (Uber/Bolt Style)** (6-8 hours)

**Goal:** Add interactive Google Maps UI for finding gyms visually with real-time location.

### Current Status
- ✅ GPS location service working
- ✅ Backend gym search API ready
- ✅ Google Maps API key configured
- ❌ No map UI component

### Tasks

#### 1. Add Google Maps Compose Library
- [ ] Add dependency: `com.google.maps.android:maps-compose`
- [ ] Initialize Google Maps SDK

**File:** `/zmos-mobile/app/build.gradle.kts`

```kotlin
dependencies {
    implementation("com.google.maps.android:maps-compose:4.3.0")
    implementation("com.google.android.gms:play-services-maps:18.2.0")
}
```

**Estimated Time:** 30 min

#### 2. Create MapScreen with Gym Markers
- [ ] GoogleMap composable
- [ ] Show user's current location (blue dot)
- [ ] Show gym markers (red pins)
- [ ] Cluster markers when zoomed out
- [ ] Tap marker to show gym details

**File:** `/zmos-mobile/app/src/main/java/com/zimasa/zmos/ui/discover/MapScreen.kt`

**Features:**
- Current location button
- Search bar overlay
- Bottom sheet with gym details
- Distance from user
- "Get Directions" button
- Gym photos carousel

**Estimated Time:** 4 hours

#### 3. Integrate with Existing DiscoverScreen
- [ ] Add "Map View" / "List View" toggle
- [ ] Share ViewModel between screens
- [ ] Filter gyms by map bounds (viewport)
- [ ] Update markers when map moves

**File:** `/zmos-mobile/app/src/main/java/com/zimasa/zmos/ui/discover/DiscoverScreen.kt`

**Estimated Time:** 2 hours

#### 4. Add Map Filters
- [ ] Distance radius slider (1km, 5km, 10km, 20km)
- [ ] Category filters (show on map)
- [ ] Rating filter (show only 4+ stars)
- [ ] "Open now" filter

**Estimated Time:** 1.5 hours

**Status:** 🟡 Ready to Start
**Priority:** HIGH
**Blocking:** Owner/member gym discovery UX

**Reference:**
- Uber map implementation
- Google Maps Flutter example: https://github.com/googlemaps/android-maps-compose

---

## **PHASE 5: Gym Membership Subscription System** (4-6 hours)

**Goal:** Allow gym owners to create membership plans and members to subscribe.

### Current Status
- ✅ Database tables created (MembershipPlan, MembershipSubscription)
- ❌ No API endpoints for memberships
- ❌ No mobile UI for subscriptions

### Tasks

#### 1. Backend Membership Endpoints
- [ ] `POST /memberships/plans` - Create membership plan (owner only)
- [ ] `GET /memberships/plans` - List gym's membership plans
- [ ] `GET /memberships/plans/:id` - Get plan details
- [ ] `PATCH /memberships/plans/:id` - Update plan
- [ ] `DELETE /memberships/plans/:id` - Deactivate plan

- [ ] `POST /memberships/subscriptions` - Subscribe to plan
- [ ] `GET /memberships/my-subscription` - Get member's subscription
- [ ] `PATCH /memberships/my-subscription/cancel` - Cancel subscription

**Files to Create:**
- `/zmos-backend/src/moveos/services/membership.service.ts`
- `/zmos-backend/src/moveos/controllers/membership.controller.ts`

**Estimated Time:** 3 hours

#### 2. Mobile UI - Owner Membership Management
- [ ] Create membership plan screen
- [ ] List existing plans
- [ ] Edit/deactivate plans
- [ ] Set pricing, billing cycle, features

**File:** `/zmos-mobile/app/src/main/java/com/zimasa/zmos/ui/owner/MembershipPlansScreen.kt`

**Estimated Time:** 2 hours

#### 3. Mobile UI - Member Subscription Flow
- [ ] View available membership plans
- [ ] Compare plans (pricing table)
- [ ] Subscribe to plan (triggers payment)
- [ ] View current subscription status
- [ ] Cancel subscription

**File:** `/zmos-mobile/app/src/main/java/com/zimasa/zmos/ui/membership/SubscribeScreen.kt`

**Estimated Time:** 2 hours

#### 4. Recurring Billing Logic
- [ ] Scheduled job to check `nextBillingDate`
- [ ] Auto-create payment requests for renewals
- [ ] Send notifications before billing
- [ ] Handle failed payments (retry, suspend subscription)

**File:** `/zmos-backend/src/moveos/services/billing.service.ts`

**Note:** Use Cloud Scheduler or cron job

**Estimated Time:** 3 hours (bonus)

**Status:** 🟡 Ready to Start
**Priority:** MEDIUM
**Blocking:** Recurring revenue for gym owners

---

## **PHASE 6: Session Booking Improvements** (2-3 hours)

**Goal:** Improve session booking UX with confirmation dialogs and better creation flow.

### Current Status
- ✅ Session booking API working
- ✅ Session creation working (basic)
- ❌ No booking confirmation dialog
- ❌ Session creation uses text input instead of dropdowns

### Tasks

#### 1. Add Booking Confirmation Dialog
- [ ] Show session details before booking
- [ ] Display price (if paid session)
- [ ] "Add to Calendar" option
- [ ] Notes field for special requests
- [ ] Cancellation policy

**File:** `/zmos-mobile/app/src/main/java/com/zimasa/zmos/ui/sessions/BookingConfirmationDialog.kt`

**Estimated Time:** 1 hour

#### 2. Improve Session Creation UI (Trainer/Owner)
- [ ] Replace text input with dropdowns
- [ ] Session type dropdown (from API)
- [ ] Location dropdown (from API)
- [ ] Time picker (Material3 TimePicker)
- [ ] Capacity slider with visual indicator
- [ ] Recurring session option (weekly pattern)

**File:** `/zmos-mobile/app/src/main/java/com/zimasa/zmos/ui/sessions/ScheduleManagementScreen.kt`

**Estimated Time:** 2 hours

#### 3. Payment Before Booking (Optional)
- [ ] If session requires payment, show price
- [ ] Create payment request before confirming booking
- [ ] Link booking to payment in metadata

**Estimated Time:** 1 hour (bonus)

**Status:** 🟡 Ready to Start
**Priority:** MEDIUM
**Blocking:** Better UX for core feature

---

## **PHASE 7: Waitlist UI & Notifications** (3-4 hours)

**Goal:** Implement waitlist when sessions are full and notify when space opens.

### Current Status
- ✅ Waitlist API endpoints ready
- ❌ No mobile UI for waitlist
- ❌ No notifications when space opens

### Tasks

#### 1. Mobile Waitlist UI
- [ ] "Join Waitlist" button when session full
- [ ] Show waitlist position (#3 in line)
- [ ] Leave waitlist button
- [ ] Waitlist indicator on session cards

**File:** `/zmos-mobile/app/src/main/java/com/zimasa/zmos/ui/sessions/SessionDetailScreen.kt`

**Estimated Time:** 2 hours

#### 2. Waitlist Notifications
- [ ] Backend: When booking cancelled, promote from waitlist
- [ ] Send push notification to next person in line
- [ ] Notification: "A spot opened for Yoga Class - Book now!"
- [ ] Auto-expire if not booked within 30 minutes

**Files:**
- `/zmos-backend/src/moveos/services/waitlist.service.ts`
- `/zmos-backend/src/moveos/services/notification.service.ts`

**Estimated Time:** 2 hours

**Status:** 🟡 Ready to Start
**Priority:** LOW
**Blocking:** None (nice-to-have)

---

## **PHASE 8: Payment Notifications & Receipts** (3-4 hours)

**Goal:** Send SMS/email notifications for payment requests and receipts.

### Tasks

#### 1. SMS Notifications (Africa's Talking)
- [ ] Send SMS when payment request created
- [ ] Include payment link/details
- [ ] Send receipt SMS when payment completed

**File:** `/zmos-backend/src/moveos/services/sms.service.ts`

**Note:** Africa's Talking credentials already in `.env`

**Estimated Time:** 2 hours

#### 2. Email Notifications
- [ ] Payment request email template
- [ ] Payment receipt email template
- [ ] Use SendGrid or similar

**Estimated Time:** 2 hours

#### 3. Receipt Generation
- [ ] Generate PDF receipt
- [ ] Include gym logo, payment details, M-Pesa receipt number
- [ ] Allow download from app

**Estimated Time:** 2 hours (bonus)

**Status:** 🟡 Ready to Start
**Priority:** MEDIUM
**Blocking:** Professional payment experience

---

## **PHASE 9: Analytics Dashboard** (6-8 hours)

**Goal:** Owner/trainer dashboard with revenue, member stats, session analytics.

### Tasks

#### 1. Backend Analytics Endpoints
- [ ] `GET /analytics/revenue` - Revenue over time (chart data)
- [ ] `GET /analytics/members` - Member growth, retention
- [ ] `GET /analytics/sessions` - Session attendance, popular times
- [ ] `GET /analytics/trainers` - Top trainers by revenue

**File:** `/zmos-backend/src/moveos/services/analytics.service.ts`

**Estimated Time:** 3 hours

#### 2. Mobile Analytics Screen
- [ ] Revenue chart (line/bar chart)
- [ ] Member stats cards
- [ ] Session attendance chart
- [ ] Top sessions leaderboard
- [ ] Date range filter (week, month, year)

**File:** `/zmos-mobile/app/src/main/java/com/zimasa/zmos/ui/analytics/AnalyticsScreen.kt`

**Library:** MPAndroidChart or Jetpack Compose Charts

**Estimated Time:** 4 hours

**Status:** 🔴 Not Started
**Priority:** LOW
**Blocking:** None (owner dashboard feature)

---

## **PHASE 10: Favorites & Recommendations** (2-3 hours)

**Goal:** Wire up existing favorites API and AI recommendations.

### Current Status
- ✅ Favorites API ready
- ✅ AI recommendations API ready
- ❌ UI not fully integrated

### Tasks

#### 1. Favorites Integration
- [ ] Heart icon on session cards
- [ ] Add/remove from favorites
- [ ] "My Favorites" tab in SessionsScreen
- [ ] Show favorite indicator

**Estimated Time:** 1.5 hours

#### 2. AI Recommendations Integration
- [ ] "Recommended for You" section
- [ ] Show personalized session suggestions
- [ ] Explain why recommended

**Estimated Time:** 1.5 hours

**Status:** 🟡 Ready to Start
**Priority:** LOW
**Blocking:** None (engagement feature)

---

## **BONUS FEATURES** (Future Enhancements)

### 1. Check-In QR Code
- Generate QR code for each session
- Trainer scans member's QR to check them in
- Auto-attendance tracking

### 2. Social Features
- Member activity feed
- Follow other members
- Share workout achievements
- Leaderboards

### 3. Equipment Rental
- List available equipment (bikes, lockers, etc.)
- Book equipment with sessions
- Payment integration

### 4. Corporate Wellness
- Company accounts
- Employee subsidized memberships
- Wellness points system
- Challenge competitions

### 5. Nutrition Tracking
- Meal logging
- Integration with session plans
- Trainer can assign meal plans

### 6. Video Streaming
- Record sessions
- On-demand workout videos
- Live stream classes

---

## 📊 Progress Summary

| Phase | Feature | Status | Priority | Time |
|-------|---------|--------|----------|------|
| 3A | Payment System (Backend) | ✅ 100% | HIGH | Complete |
| 3B | Payment Integration (Mobile) | 🟡 0% | HIGH | 2-4 hrs |
| 4 | Interactive Map View | 🟡 0% | HIGH | 6-8 hrs |
| 5 | Membership Subscriptions | 🟡 0% | MEDIUM | 4-6 hrs |
| 6 | Session Booking Improvements | 🟡 0% | MEDIUM | 2-3 hrs |
| 7 | Waitlist UI & Notifications | 🟡 0% | LOW | 3-4 hrs |
| 8 | Payment Notifications | 🟡 0% | MEDIUM | 3-4 hrs |
| 9 | Analytics Dashboard | 🔴 0% | LOW | 6-8 hrs |
| 10 | Favorites & Recommendations | 🟡 0% | LOW | 2-3 hrs |

**Legend:**
- ✅ Complete
- 🟡 Ready to Start
- 🔴 Not Started

---

## 🚀 Recommended Next Steps (In Order)

### This Week (8-12 hours)
1. **Phase 3B** - Wire mobile app to payment endpoints (2-4 hrs) ⭐
2. **Phase 4** - Build interactive map view (6-8 hrs) ⭐
3. Test end-to-end: gym discovery → booking → payment

### Next Week (10-14 hours)
4. **Phase 5** - Membership subscription system (4-6 hrs)
5. **Phase 6** - Session booking UX improvements (2-3 hrs)
6. **Phase 8** - Payment notifications (3-4 hrs)
7. Deploy to production & beta test

### Future Sprints
8. **Phase 7** - Waitlist UI (3-4 hrs)
9. **Phase 9** - Analytics dashboard (6-8 hrs)
10. **Phase 10** - Favorites & recommendations (2-3 hrs)

---

## 🛠️ Technical Debt & Cleanup

### Code Quality
- [ ] Add unit tests for payment service
- [ ] Add integration tests for M-Pesa flow
- [ ] Add error boundary components
- [ ] Improve error handling in ViewModels

### Performance
- [ ] Add caching for gym list
- [ ] Implement pagination for payment history
- [ ] Optimize map marker rendering (clustering)
- [ ] Add image caching for gym photos

### Security
- [ ] Add rate limiting for payment endpoints
- [ ] Validate M-Pesa callback signature
- [ ] Add request encryption for sensitive data
- [ ] Implement CSRF protection

### Documentation
- [x] Payment API documentation
- [ ] Mobile app architecture docs
- [ ] Database schema diagrams
- [ ] Deployment runbook

---

## 📈 Success Metrics

### MVP Launch Targets
- [ ] 100 gyms registered
- [ ] 1,000 members signed up
- [ ] 500 sessions booked per week
- [ ] 100 payments processed per week
- [ ] <5% payment failure rate
- [ ] <2s average API response time
- [ ] >95% uptime

### User Satisfaction
- [ ] >4.5 star rating on Play Store
- [ ] <5% churn rate
- [ ] >70% weekly active users
- [ ] >50% monthly retention

---

## 🎯 MVP Definition

**Minimum Viable Product for Beta Launch:**

**Core Features (MUST HAVE):**
- ✅ Authentication (Google OAuth + JWT)
- ✅ Gym/studio creation
- ✅ Session scheduling
- ✅ Session booking
- ✅ Payment system (trainer → client)
- ⏳ Interactive map (gym discovery)
- ⏳ M-Pesa integration tested
- ⏳ Basic error handling

**Nice to Have (Can launch without):**
- Membership subscriptions
- Recurring billing
- Waitlist
- Analytics dashboard
- Notifications
- Favorites
- Recommendations

**Launch Blockers:**
1. ⏳ Complete Phase 3B (payment integration)
2. ⏳ Complete Phase 4 (map view)
3. ⏳ Deploy to production
4. ⏳ Test with 5-10 beta users

**Estimated time to MVP:** 15-20 hours

---

## 🐛 Known Issues

### Backend
- [ ] SQLite migration conflict with PostgreSQL (resolved - using SQLite for dev)
- [ ] M-Pesa callback timeout handling not implemented

### Mobile
- [ ] Payment status polling could be more efficient (use WebSocket?)
- [ ] Location permission edge cases not handled
- [ ] Session creation UI needs UX improvements

### Infrastructure
- [ ] No monitoring/alerting setup
- [ ] No backup strategy for database
- [ ] No CI/CD pipeline

---

## 📞 Support

**Questions?**
- Backend code: `/home/turnkey/zmos-backend/`
- Mobile code: `/home/turnkey/zmos-mobile/`
- Payment docs: `/home/turnkey/zmos-backend/PAYMENT_SYSTEM_DOCUMENTATION.md`
- This roadmap: `/home/turnkey/zmos-backend/ZMOS_ROADMAP.md`

**Key Resources:**
- Prisma docs: https://www.prisma.io/docs
- NestJS docs: https://docs.nestjs.com
- M-Pesa API: https://developer.safaricom.co.ke
- Jetpack Compose: https://developer.android.com/jetpack/compose
- Google Maps Compose: https://github.com/googlemaps/android-maps-compose

---

**Last Updated:** January 19, 2026
**Status:** Payment system complete, ready for mobile integration and map view
