# Missing APIs for Phase 1 & Phase 2 Completion

This document lists all APIs needed to complete MoveOS Phase 1 and Phase 2 for full mobile app functionality.

## Current Status Summary

### ✅ Already Implemented (Complete)
1. **Authentication**
   - ✅ POST `/auth/signup` - Email/password signup
   - ✅ POST `/auth/login` - Email/password login
   - ✅ POST `/auth/google` - Google OAuth signup/login

2. **Locations**
   - ✅ POST `/locations` - Create location
   - ✅ GET `/locations` - List all locations
   - ✅ GET `/locations/active` - Get active locations
   - ✅ GET `/locations/:id` - Get location by ID
   - ✅ PATCH `/locations/:id` - Update location
   - ✅ DELETE `/locations/:id` - Soft delete location

3. **Session Types**
   - ✅ POST `/session-types` - Create session type
   - ✅ GET `/session-types` - List all session types
   - ✅ GET `/session-types/active` - Get active session types
   - ✅ GET `/session-types/category/:category` - Filter by category
   - ✅ GET `/session-types/:id` - Get session type by ID
   - ✅ PATCH `/session-types/:id` - Update session type
   - ✅ DELETE `/session-types/:id` - Soft delete session type

4. **Session Instances**
   - ✅ POST `/sessions` - Create session instance
   - ✅ GET `/sessions` - List sessions with filtering
   - ✅ GET `/sessions/available` - Get available sessions
   - ✅ GET `/sessions/:id` - Get session by ID
   - ✅ PATCH `/sessions/:id` - Update session
   - ✅ PUT `/sessions/:id/cancel` - Cancel session
   - ✅ PUT `/sessions/:id/complete` - Mark session complete
   - ✅ POST `/sessions/:id/checkin` - Check into session (GPS-based)
   - ✅ DELETE `/sessions/:id` - Delete session

5. **Bookings**
   - ✅ POST `/bookings` - Create booking
   - ✅ GET `/bookings` - List all bookings (admin)
   - ✅ GET `/bookings/my` - Get current user's bookings
   - ✅ GET `/bookings/:id` - Get booking details
   - ✅ DELETE `/bookings/:id` - Cancel booking

6. **Member Profile (Basic)**
   - ✅ GET `/my/bookings` - Get current member's bookings

---

## ❌ Missing APIs Needed for Complete Phase 1 & Phase 2

### 1. Member Profile & Settings (Priority: HIGH)

#### GET `/my/profile`
**Purpose**: Get current member's profile information
**Response**:
```json
{
  "id": "cmjl...",
  "email": "user@example.com",
  "name": "John Doe",
  "avatarUrl": "https://...",
  "googleId": "106026...",
  "joinDate": "2024-12-01T00:00:00.000Z",
  "tenant": {
    "id": "tenant-123",
    "name": "My Gym"
  }
}
```

#### PUT `/my/profile`
**Purpose**: Update current member's profile
**Request**:
```json
{
  "name": "John Doe Updated",
  "avatarUrl": "https://new-avatar.com/image.jpg"
}
```

#### GET `/my/stats`
**Purpose**: Get member's activity statistics
**Response**:
```json
{
  "totalBookings": 25,
  "attendedSessions": 20,
  "cancelledBookings": 3,
  "noShows": 2,
  "currentStreak": 5,
  "longestStreak": 12,
  "favoriteSessionTypes": [
    { "name": "HIIT", "count": 10 },
    { "name": "Yoga", "count": 8 }
  ],
  "monthlyActivity": {
    "january": 8,
    "february": 12,
    "march": 10
  }
}
```

---

### 2. Session Discovery & Filtering (Priority: HIGH)

#### GET `/sessions/upcoming`
**Purpose**: Get upcoming sessions for member (next 7 days)
**Query Params**:
- `days` (optional): Number of days to look ahead (default: 7)
- `category` (optional): Filter by session category
- `locationId` (optional): Filter by location

**Response**:
```json
{
  "sessions": [
    {
      "id": "session-123",
      "sessionType": { ... },
      "location": { ... },
      "startTime": "2024-12-27T10:00:00.000Z",
      "endTime": "2024-12-27T11:00:00.000Z",
      "capacity": 20,
      "currentBookings": 15,
      "availableSpots": 5,
      "isBooked": false,
      "instructor": "Sarah Smith"
    }
  ],
  "total": 25
}
```

#### GET `/sessions/today`
**Purpose**: Get all sessions happening today
**Response**: Same format as `/sessions/upcoming`

#### GET `/sessions/my-bookings`
**Purpose**: Get sessions the member has booked (upcoming only)
**Response**:
```json
{
  "upcomingBookings": [
    {
      "booking": {
        "id": "booking-123",
        "status": "confirmed",
        "bookedAt": "2024-12-20T10:00:00.000Z"
      },
      "session": {
        "id": "session-123",
        "sessionType": { ... },
        "location": { ... },
        "startTime": "2024-12-27T10:00:00.000Z",
        "endTime": "2024-12-27T11:00:00.000Z"
      }
    }
  ],
  "total": 5
}
```

---

### 3. Booking History & Details (Priority: MEDIUM)

#### GET `/my/bookings/history`
**Purpose**: Get member's booking history (past bookings)
**Query Params**:
- `page` (optional): Page number
- `limit` (optional): Items per page
- `status` (optional): Filter by status (attended, cancelled, no_show)

**Response**:
```json
{
  "bookings": [
    {
      "id": "booking-123",
      "session": {
        "sessionType": { "name": "HIIT" },
        "startTime": "2024-12-01T10:00:00.000Z"
      },
      "status": "attended",
      "attendedAt": "2024-12-01T09:55:00.000Z"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 50,
    "totalPages": 3
  }
}
```

#### PUT `/bookings/:id/no-show`
**Purpose**: Mark a booking as no-show (admin only)
**Response**:
```json
{
  "id": "booking-123",
  "status": "no_show",
  "updatedAt": "2024-12-26T00:00:00.000Z"
}
```

---

### 4. Waitlist Management (Priority: MEDIUM)

#### POST `/sessions/:id/waitlist`
**Purpose**: Join waitlist for a full session
**Response**:
```json
{
  "id": "waitlist-entry-123",
  "sessionId": "session-123",
  "memberId": "member-123",
  "position": 3,
  "createdAt": "2024-12-26T00:00:00.000Z"
}
```

#### GET `/sessions/:id/waitlist`
**Purpose**: Get waitlist for a session (admin only)
**Response**:
```json
{
  "waitlist": [
    {
      "id": "waitlist-entry-1",
      "member": {
        "id": "member-123",
        "name": "John Doe",
        "email": "john@example.com"
      },
      "position": 1,
      "createdAt": "2024-12-25T10:00:00.000Z"
    }
  ],
  "total": 5
}
```

#### DELETE `/sessions/:id/waitlist`
**Purpose**: Leave waitlist
**Response**: 204 No Content

---

### 5. Search & Discovery (Priority: MEDIUM)

#### GET `/sessions/search`
**Purpose**: Full-text search for sessions
**Query Params**:
- `q`: Search query (session type name, instructor, etc.)
- `date`: Specific date filter
- `category`: Category filter
- `difficulty`: Difficulty level filter

**Response**:
```json
{
  "results": [
    {
      "id": "session-123",
      "sessionType": {
        "name": "HIIT Cardio",
        "category": "class",
        "difficulty": "intermediate"
      },
      "startTime": "2024-12-27T10:00:00.000Z",
      "relevanceScore": 0.95
    }
  ],
  "total": 10
}
```

---

### 6. Favorites & Preferences (Priority: LOW)

#### POST `/my/favorites/:sessionTypeId`
**Purpose**: Mark a session type as favorite
**Response**:
```json
{
  "sessionType": {
    "id": "type-123",
    "name": "HIIT",
    "isFavorite": true
  }
}
```

#### DELETE `/my/favorites/:sessionTypeId`
**Purpose**: Remove from favorites
**Response**: 204 No Content

#### GET `/my/favorites`
**Purpose**: Get member's favorite session types
**Response**:
```json
{
  "favorites": [
    {
      "id": "type-123",
      "name": "HIIT",
      "category": "class"
    }
  ]
}
```

---

### 7. Notifications (Priority: MEDIUM)

#### GET `/my/notifications`
**Purpose**: Get member's notifications
**Query Params**:
- `unreadOnly` (boolean): Only unread notifications

**Response**:
```json
{
  "notifications": [
    {
      "id": "notif-123",
      "type": "booking_confirmation",
      "title": "Booking Confirmed",
      "message": "Your booking for HIIT Class on Dec 27 is confirmed",
      "read": false,
      "createdAt": "2024-12-26T00:00:00.000Z",
      "data": {
        "bookingId": "booking-123",
        "sessionId": "session-123"
      }
    }
  ],
  "unreadCount": 5
}
```

#### PUT `/my/notifications/:id/read`
**Purpose**: Mark notification as read
**Response**: 204 No Content

#### PUT `/my/notifications/mark-all-read`
**Purpose**: Mark all notifications as read
**Response**: 204 No Content

---

### 8. Achievements & Streaks (Priority: LOW)

#### GET `/my/achievements`
**Purpose**: Get member's achievements and badges
**Response**:
```json
{
  "achievements": [
    {
      "id": "achievement-123",
      "name": "5-Day Streak",
      "description": "Attended 5 consecutive days",
      "icon": "🔥",
      "unlockedAt": "2024-12-20T00:00:00.000Z"
    }
  ],
  "currentStreak": {
    "days": 5,
    "lastAttendance": "2024-12-26T00:00:00.000Z"
  }
}
```

---

### 9. Session Recommendations (Priority: LOW - Phase 3)

#### GET `/sessions/recommended`
**Purpose**: Get AI-recommended sessions based on member's history
**Response**:
```json
{
  "recommendations": [
    {
      "session": { ... },
      "reason": "Based on your preference for HIIT classes",
      "score": 0.92
    }
  ]
}
```

---

### 10. Member Management (Admin) (Priority: MEDIUM)

#### GET `/members/:id`
**Purpose**: Get member details (admin only)
**Response**:
```json
{
  "id": "member-123",
  "email": "member@example.com",
  "name": "John Doe",
  "joinDate": "2024-01-15T00:00:00.000Z",
  "stats": {
    "totalBookings": 25,
    "attendanceRate": 85,
    "currentStreak": 5
  }
}
```

#### PUT `/members/:id/role`
**Purpose**: Update member role (admin only)
**Request**:
```json
{
  "role": "provider"
}
```

---

## Priority Implementation Order

### 🔥 Phase 1 - Critical for Mobile App (Week 1)
1. ✅ GET `/my/profile` - View own profile
2. ✅ PUT `/my/profile` - Update profile
3. ✅ GET `/my/stats` - Activity statistics
4. ✅ GET `/sessions/upcoming` - Discover upcoming sessions
5. ✅ GET `/sessions/my-bookings` - View booked sessions

### 🚀 Phase 2 - Enhanced UX (Week 2)
6. ✅ GET `/my/bookings/history` - Booking history
7. ✅ GET `/sessions/today` - Today's sessions
8. ✅ GET `/sessions/search` - Search functionality
9. ✅ POST `/sessions/:id/waitlist` - Join waitlist
10. ✅ GET `/my/notifications` - Notification system

### 🎯 Phase 3 - Nice to Have (Week 3+)
11. ✅ Favorites system (`/my/favorites/*`)
12. ✅ Achievements & Streaks
13. ✅ Member management (admin endpoints)
14. ✅ AI recommendations

---

## Database Schema Changes Needed

### New Tables Required

#### 1. Waitlist
```prisma
model Waitlist {
  id               String   @id @default(cuid())
  tenantId         String
  memberId         String
  sessionInstanceId String
  position         Int      // Auto-calculated based on createdAt
  createdAt        DateTime @default(now())

  tenant          Tenant          @relation(fields: [tenantId], references: [id])
  member          Member          @relation(fields: [memberId], references: [id])
  sessionInstance SessionInstance @relation(fields: [sessionInstanceId], references: [id])

  @@unique([memberId, sessionInstanceId])
  @@index([sessionInstanceId])
  @@index([memberId])
}
```

#### 2. Favorites
```prisma
model Favorite {
  id            String   @id @default(cuid())
  tenantId      String
  memberId      String
  sessionTypeId String
  createdAt     DateTime @default(now())

  tenant      Tenant      @relation(fields: [tenantId], references: [id])
  member      Member      @relation(fields: [memberId], references: [id])
  sessionType SessionType @relation(fields: [sessionTypeId], references: [id])

  @@unique([memberId, sessionTypeId])
  @@index([memberId])
}
```

#### 3. Notifications
```prisma
model Notification {
  id        String   @id @default(cuid())
  tenantId  String
  memberId  String
  type      String   // 'booking_confirmation', 'session_reminder', 'waitlist_promotion'
  title     String
  message   String
  data      Json?    // Additional notification data
  read      Boolean  @default(false)
  createdAt DateTime @default(now())

  tenant Tenant @relation(fields: [tenantId], references: [id])
  member Member @relation(fields: [memberId], references: [id])

  @@index([memberId, read])
  @@index([createdAt])
}
```

#### 4. Achievements (Optional - Phase 3)
```prisma
model Achievement {
  id          String @id @default(cuid())
  name        String
  description String
  icon        String
  criteria    Json   // Achievement unlock criteria

  memberAchievements MemberAchievement[]
}

model MemberAchievement {
  id            String   @id @default(cuid())
  memberId      String
  achievementId String
  unlockedAt    DateTime @default(now())

  member      Member      @relation(fields: [memberId], references: [id])
  achievement Achievement @relation(fields: [achievementId], references: [id])

  @@unique([memberId, achievementId])
}
```

### Updates to Existing Models

#### Member Model - Add role field
```prisma
model Member {
  // ... existing fields
  role String @default("member") // 'member', 'provider', 'admin'

  // New relations
  favorites      Favorite[]
  notifications  Notification[]
  waitlistEntries Waitlist[]
  achievements   MemberAchievement[]
}
```

---

## Testing Strategy

### Unit Tests Required
- ✅ Profile CRUD operations
- ✅ Stats calculation logic
- ✅ Waitlist position management
- ✅ Notification creation and delivery
- ✅ Search/filter functionality

### Integration Tests Required
- ✅ Complete booking flow with waitlist
- ✅ Notification triggers (booking, cancellation, waitlist promotion)
- ✅ Profile update and avatar upload
- ✅ Streak calculation across days

### Mobile App Testing Checklist
- ✅ Profile screen displays correctly
- ✅ Stats update in real-time
- ✅ Booking flow with waitlist works
- ✅ Notifications appear and can be dismissed
- ✅ Search finds relevant sessions
- ✅ History shows past bookings

---

## Estimated Implementation Time

| Priority | APIs | Database | Tests | Total Time |
|----------|------|----------|-------|------------|
| Phase 1  | 3 days | 1 day | 2 days | **6 days** |
| Phase 2  | 4 days | 2 days | 3 days | **9 days** |
| Phase 3  | 3 days | 1 day | 2 days | **6 days** |

**Total**: ~21 days (3 weeks) for complete implementation

---

## Next Steps

1. ✅ **Review this document** with the team
2. ✅ **Prioritize** which APIs are most critical for mobile MVP
3. ✅ **Create Prisma migrations** for new tables
4. ✅ **Implement Phase 1 APIs** first (critical for mobile)
5. ✅ **Write comprehensive tests** for each endpoint
6. ✅ **Document** each API in the main documentation
7. ✅ **Update mobile app** to consume new APIs

---

**Status**: 📋 Ready for implementation
**Last Updated**: December 26, 2025
**Created By**: AI Assistant
**Review Required**: Product Team
