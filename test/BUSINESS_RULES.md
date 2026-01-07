# ZMOS Business Rules & Edge Cases

This document defines the complete business logic, validation rules, and edge case handling for the ZMOS platform. These rules must be implemented consistently across all clients (web, mobile, API).

## Booking System Rules

### Capacity Management

#### Basic Capacity Rules
- **Session Capacity**: Must be > 0 and ≤ location capacity
- **Location Capacity**: Maximum concurrent sessions allowed
- **Overbooking**: Not allowed by default (can be configured per session type)

#### Capacity Validation Flow
```javascript
function validateBookingCapacity(sessionInstanceId, tenantId) {
  // Get session details
  const session = await prisma.sessionInstance.findUnique({
    where: { id: sessionInstanceId },
    include: { location: true, sessionType: true }
  });

  // Check location capacity
  const concurrentSessions = await prisma.sessionInstance.count({
    where: {
      locationId: session.locationId,
      startTime: { lte: session.endTime },
      endTime: { gte: session.startTime },
      status: 'scheduled'
    }
  });

  if (concurrentSessions >= session.location.capacity) {
    throw new Error('Location at maximum capacity for this time slot');
  }

  // Check session capacity
  const currentBookings = await prisma.booking.count({
    where: {
      sessionInstanceId,
      status: { in: ['confirmed', 'attended'] }
    }
  });

  if (currentBookings >= session.capacity) {
    throw new Error('Session is fully booked');
  }

  return true;
}
```

### Waitlist Management

#### Waitlist Activation
- **Trigger**: When session reaches 100% capacity
- **Size**: Unlimited (configurable per tenant)
- **Priority**: First-come, first-served
- **Duration**: Waitlist expires when session starts

#### Waitlist Flow
```javascript
// When session becomes full
async function handleWaitlist(sessionInstanceId, userId) {
  // Check if waitlist is enabled for this session type
  const sessionType = await prisma.sessionType.findFirst({
    where: { sessions: { some: { id: sessionInstanceId } } }
  });

  if (!sessionType.enableWaitlist) {
    throw new Error('No spots available and waitlist not enabled');
  }

  // Add to waitlist
  const waitlistEntry = await prisma.waitlist.create({
    data: {
      sessionInstanceId,
      memberId: userId,
      position: await getNextWaitlistPosition(sessionInstanceId),
      expiresAt: session.startTime // Expires when session starts
    }
  });

  // Send notification
  await sendWaitlistNotification(userId, sessionInstanceId, waitlistEntry.position);

  return waitlistEntry;
}

// When spot becomes available
async function promoteFromWaitlist(sessionInstanceId) {
  const nextInLine = await prisma.waitlist.findFirst({
    where: { sessionInstanceId },
    orderBy: { position: 'asc' }
  });

  if (nextInLine) {
    // Convert waitlist to booking
    await prisma.booking.create({
      data: {
        sessionInstanceId,
        memberId: nextInLine.memberId,
        status: 'confirmed',
        source: 'waitlist_promotion'
      }
    });

    // Remove from waitlist
    await prisma.waitlist.delete({ where: { id: nextInLine.id } });

    // Notify user
    await sendPromotionNotification(nextInLine.memberId, sessionInstanceId);
  }
}
```

### Overbooking Policies

#### Configurable Overbooking
```javascript
// Session type configuration
const sessionTypeConfig = {
  allowOverbooking: false, // Default: false
  overbookingPercentage: 0, // Default: 0%
  overbookingLimit: 0, // Max additional spots
  autoPromoteWaitlist: true // Auto-promote when spots free up
};
```

#### Overbooking Rules
- **Percentage-based**: Allow X% overbooking (e.g., 10% for no-shows)
- **Fixed Limit**: Allow exactly Y additional bookings
- **Time-based**: Different rules for last-minute bookings
- **Provider Override**: Manual approval for special cases

### Cancellation Policies

#### Cancellation Windows
- **Free Cancellation**: > 24 hours before session
- **Late Fee**: 2-24 hours before session (configurable)
- **No Refund**: < 2 hours before session
- **No-Show Penalty**: Automatic penalties for no-shows

#### Cancellation Flow
```javascript
async function cancelBooking(bookingId, memberId, reason = 'user_cancelled') {
  const booking = await prisma.booking.findUnique({
    where: { id: bookingId },
    include: { sessionInstance: true }
  });

  const hoursUntilSession = getHoursUntilSession(booking.sessionInstance.startTime);
  let refundAmount = 0;
  let penaltyApplied = false;

  // Determine cancellation policy
  if (hoursUntilSession > 24) {
    // Full refund
    refundAmount = booking.price || 0;
  } else if (hoursUntilSession > 2) {
    // Partial refund with fee
    const fee = booking.price * 0.1; // 10% cancellation fee
    refundAmount = Math.max(0, (booking.price || 0) - fee);
    penaltyApplied = true;
  } else {
    // No refund
    refundAmount = 0;
    penaltyApplied = true;

    // Apply no-show penalty if within 2 hours
    if (hoursUntilSession <= 2) {
      await applyNoShowPenalty(memberId);
    }
  }

  // Update booking status
  await prisma.booking.update({
    where: { id: bookingId },
    data: {
      status: 'cancelled',
      cancelledAt: new Date(),
      cancellationReason: reason,
      refundAmount
    }
  });

  // Create movement event
  await prisma.movementEvent.create({
    data: {
      memberId,
      type: 'booking_cancelled',
      tenantId: booking.tenantId,
      metadata: {
        sessionInstanceId: booking.sessionInstanceId,
        hoursUntilSession,
        refundAmount,
        penaltyApplied
      }
    }
  });

  // Promote from waitlist if applicable
  await promoteFromWaitlist(booking.sessionInstanceId);

  return { refundAmount, penaltyApplied };
}
```

### No-Show Handling

#### No-Show Detection
```javascript
async function detectNoShows() {
  // Run 30 minutes after session start
  const thirtyMinutesAgo = new Date(Date.now() - 30 * 60 * 1000);

  const noShows = await prisma.booking.findMany({
    where: {
      status: 'confirmed',
      sessionInstance: {
        startTime: { lte: thirtyMinutesAgo },
        status: 'completed'
      }
    },
    include: { sessionInstance: true, member: true }
  });

  for (const booking of noShows) {
    await handleNoShow(booking);
  }
}

async function handleNoShow(booking) {
  // Mark as no-show
  await prisma.booking.update({
    where: { id: booking.id },
    data: { status: 'no_show' }
  });

  // Apply penalty
  await applyNoShowPenalty(booking.memberId);

  // Create movement event
  await prisma.movementEvent.create({
    data: {
      memberId: booking.memberId,
      type: 'no_show_penalty',
      tenantId: booking.tenantId,
      metadata: {
        sessionInstanceId: booking.sessionInstanceId,
        penaltyApplied: true
      }
    }
  });
}
```

#### No-Show Penalty System
- **Warning System**: 1st no-show = warning, 2nd = suspension
- **Suspension Duration**: 24 hours after 2nd no-show
- **Permanent Ban**: After 5 no-shows in 30 days
- **Appeal Process**: Manual review by provider

### Concurrency Handling

#### Race Condition Prevention
```javascript
// Optimistic locking for booking
async function createBookingAtomic(sessionInstanceId, memberId) {
  return await prisma.$transaction(async (tx) => {
    // Lock the session for update
    const session = await tx.sessionInstance.findUnique({
      where: { id: sessionInstanceId },
      lock: true // Pessimistic locking
    });

    // Recheck capacity (another transaction might have booked)
    const currentBookings = await tx.booking.count({
      where: {
        sessionInstanceId,
        status: { in: ['confirmed', 'attended'] }
      }
    });

    if (currentBookings >= session.capacity) {
      throw new Error('Session became full during booking');
    }

    // Check for existing booking
    const existingBooking = await tx.booking.findFirst({
      where: {
        sessionInstanceId,
        memberId,
        status: { in: ['confirmed', 'pending_checkin'] }
      }
    });

    if (existingBooking) {
      throw new Error('Already booked for this session');
    }

    // Create booking
    const booking = await tx.booking.create({
      data: {
        sessionInstanceId,
        memberId,
        status: 'confirmed'
      }
    });

    return booking;
  });
}
```

## Streak Calculation Rules

### Basic Streak Logic
- **Consecutive Days**: Must attend sessions on consecutive calendar days
- **Session Count**: At least 1 session per day counts
- **Grace Period**: 2-day gap allowed (configurable)
- **Reset Condition**: 3+ day gap resets streak to 0

### Advanced Streak Rules
```javascript
function calculateStreak(attendanceDates) {
  if (!attendanceDates.length) return 0;

  // Sort dates in descending order (most recent first)
  const sortedDates = attendanceDates.sort((a, b) => b - a);

  let streak = 0;
  let lastDate = null;
  let gapCount = 0;
  const maxGap = 2; // Allow 2-day gaps

  for (const date of sortedDates) {
    if (!lastDate) {
      // First attendance
      streak = 1;
      lastDate = date;
      continue;
    }

    const daysDiff = Math.floor((lastDate - date) / (1000 * 60 * 60 * 24));

    if (daysDiff === 1) {
      // Consecutive day
      streak++;
      gapCount = 0;
    } else if (daysDiff <= maxGap + 1) {
      // Within grace period
      streak++;
      gapCount += (daysDiff - 1);
    } else {
      // Gap too large, reset streak
      break;
    }

    lastDate = date;
  }

  return streak;
}
```

### Streak Milestones
- **7-day streak**: "Week Warrior" achievement
- **30-day streak**: "Monthly Champion"
- **100-day streak**: "Century Club"
- **365-day streak**: "Annual Legend"

### Streak Recovery
- **Grace Period**: 3-day recovery window after streak break
- **Partial Recovery**: Keep 50% of previous streak value
- **Full Recovery**: Attend 3 consecutive days to restore

## Time Zone Handling

### Session Scheduling
- **Storage**: All times stored in UTC
- **Display**: Convert to user's local timezone
- **Booking**: Validate against session timezone
- **Notifications**: Send in user's preferred timezone

### Cross-Timezone Edge Cases
```javascript
function validateBookingTime(session, userTimezone) {
  const now = new Date();
  const sessionStart = new Date(session.startTime);

  // Convert session time to user's timezone for validation
  const userSessionStart = new Date(sessionStart.toLocaleString("en-US", {
    timeZone: userTimezone
  }));

  const hoursUntilSession = (userSessionStart - now) / (1000 * 60 * 60);

  if (hoursUntilSession < 2) {
    throw new Error('Cannot book sessions starting within 2 hours');
  }

  return true;
}
```

## Session State Management

### Session Status Transitions
```
scheduled → in_progress (when started)
in_progress → completed (when ended)
scheduled → cancelled (provider cancellation)
in_progress → cancelled (emergency cancellation)
```

### Automated State Changes
```javascript
async function updateSessionStates() {
  const now = new Date();

  // Mark sessions as in_progress
  await prisma.sessionInstance.updateMany({
    where: {
      status: 'scheduled',
      startTime: { lte: now },
      endTime: { gt: now }
    },
    data: { status: 'in_progress' }
  });

  // Mark sessions as completed
  await prisma.sessionInstance.updateMany({
    where: {
      status: 'in_progress',
      endTime: { lte: now }
    },
    data: { status: 'completed' }
  });

  // Auto-checkout attendees
  await autoCheckoutAttendees();
}
```

## Pricing & Billing Rules

### Session Pricing
- **Fixed Price**: Set per session type
- **Dynamic Pricing**: Peak hours pricing (configurable)
- **Package Discounts**: Bulk booking discounts
- **Membership Tiers**: Different pricing for member levels

### Refund Policies
- **Full Refund**: > 24 hours before session
- **Partial Refund**: 2-24 hours (90% refund)
- **No Refund**: < 2 hours before session
- **Credit System**: Refunds issued as credits for future bookings

## Notification Rules

### Booking Confirmations
- **Immediate**: Email/SMS confirmation when booked
- **Reminder**: 24 hours before session
- **Last Call**: 2 hours before session
- **Check-in Reminder**: 15 minutes before session

### Cancellation Notifications
- **Member Cancellation**: Immediate confirmation
- **Provider Cancellation**: Immediate notification with alternatives
- **Waitlist Promotion**: Immediate upgrade notification

### Streak Notifications
- **Milestone Achievement**: Congratulatory message
- **Streak at Risk**: Warning when streak might break
- **Recovery Opportunity**: Encouragement after brief break

## Data Validation Rules

### Input Validation
```javascript
const validationRules = {
  email: {
    pattern: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
    maxLength: 254
  },
  name: {
    minLength: 1,
    maxLength: 100,
    pattern: /^[a-zA-Z\s'-]+$/
  },
  capacity: {
    min: 1,
    max: 1000
  },
  duration: {
    min: 15, // 15 minutes
    max: 480 // 8 hours
  }
};
```

### Business Validation
```javascript
function validateSessionCreation(data) {
  // Location exists and is active
  const location = await prisma.location.findUnique({
    where: { id: data.locationId }
  });
  if (!location || !location.isActive) {
    throw new Error('Invalid or inactive location');
  }

  // Time slot available
  const conflictingSession = await prisma.sessionInstance.findFirst({
    where: {
      locationId: data.locationId,
      OR: [
        {
          AND: [
            { startTime: { lte: data.startTime } },
            { endTime: { gt: data.startTime } }
          ]
        },
        {
          AND: [
            { startTime: { lt: data.endTime } },
            { endTime: { gte: data.endTime } }
          ]
        }
      ]
    }
  });

  if (conflictingSession) {
    throw new Error('Time slot conflicts with existing session');
  }

  return true;
}
```

## Mobile-Specific Business Rules

### Offline Booking Handling
- **Optimistic UI**: Allow booking UI while offline
- **Queue Sync**: Store bookings for sync when online
- **Conflict Resolution**: Handle booking conflicts on sync
- **Retry Logic**: Automatic retry with exponential backoff

### Push Notification Rules
- **Booking Confirmation**: Immediate push notification
- **Session Reminders**: Configurable timing (15min, 1hr, 24hr)
- **Waitlist Updates**: Instant notification when promoted
- **Streak Alerts**: Achievement notifications and warnings

### Location-Based Features
- **Check-in Validation**: GPS verification for session attendance
- **Nearby Sessions**: Location-based session discovery
- **Travel Time**: Calculate travel time to sessions

## Error Handling & User Experience

### User-Friendly Error Messages
```javascript
const errorMessages = {
  SESSION_FULL: 'This class is fully booked. Would you like to join the waitlist?',
  BOOKING_CONFLICT: 'You already have a booking for this time slot.',
  LATE_CANCELLATION: 'Cancellations within 2 hours are not refundable.',
  SESSION_STARTED: 'This session has already started.',
  INVALID_TIMEZONE: 'Please check your timezone settings.'
};
```

### Graceful Degradation
- **Network Issues**: Offline booking queue
- **Service Unavailable**: Cached data display
- **Partial Failures**: Allow partial operations to continue

## Compliance Rules

### Data Export Requirements
- **GDPR Right to Access**: Complete data export within 30 days
- **Data Portability**: Machine-readable format
- **Audit Trail**: All data access logged

### Data Deletion Rules
- **Soft Delete**: Mark as deleted, retain for 30 days
- **Hard Delete**: Permanent removal after grace period
- **Anonymization**: Replace PII with hashes before deletion

## Performance Rules

### Query Optimization
- **Index Strategy**: Composite indexes on (tenant_id, created_at)
- **Pagination**: Mandatory for all list endpoints
- **Caching**: Session data cached for 5 minutes

### Scalability Rules
- **Tenant Isolation**: Database queries always filtered by tenant
- **Connection Pooling**: Configurable pool sizes
- **Read Replicas**: Separate read/write databases

---

## Implementation Checklist

### For Backend Developers
- [ ] Implement capacity validation logic
- [ ] Add waitlist management system
- [ ] Configure cancellation policies
- [ ] Implement streak calculation algorithm
- [ ] Add concurrency controls
- [ ] Set up automated session state management

### For Mobile Developers
- [ ] Handle offline booking scenarios
- [ ] Implement conflict resolution UI
- [ ] Add timezone-aware time display
- [ ] Create notification handling
- [ ] Implement location-based check-in

### For QA Testers
- [ ] Test race condition scenarios
- [ ] Validate edge case handling
- [ ] Test timezone conversions
- [ ] Verify notification timing
- [ ] Test offline/online sync

---

## Change Management

### Rule Updates
- **Version Control**: All rule changes versioned
- **Documentation**: Updated simultaneously with code
- **Testing**: Comprehensive test coverage for rule changes
- **Communication**: Client updates communicated to users

### Backward Compatibility
- **Rule Changes**: Non-breaking for existing bookings
- **Migration Path**: Clear upgrade path for breaking changes
- **Deprecation**: 90-day notice for rule changes

---

*This document must be updated whenever business rules change. All changes require review and approval from product, engineering, and legal teams.*
