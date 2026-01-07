# Quick Fix Summary - Android Google Sign-In Error

## The Problem

```
❌ Google auth failed: {
  "message": "Either tenantId or tenantName must be provided",
  "statusCode": 400
}
```

## The Cause

Your Android app is sending:
```json
{
  "idToken": "eyJhbGci..."
}
```

But for **new users**, the backend needs to know which gym to add them to. You must also send either:
- `tenantName: "My Gym Name"` (to create a new gym), OR
- `tenantId: "clx123..."` (to join an existing gym)

## The Solution (2 Steps)

### Step 1: Try signing in with just idToken

```kotlin
try {
    val response = authApi.googleAuth(
        GoogleAuthRequest(idToken = idToken)
    )
    // SUCCESS - existing user
    saveTokenAndNavigate(response)
} catch (e: HttpException) {
    if (e.code() == 400) {
        // NEW USER - go to Step 2
        showTenantSelectionDialog(idToken)
    }
}
```

### Step 2: If 400 error, ask user to create or join gym

**Option A: Create New Gym**
```kotlin
val response = authApi.googleAuth(
    GoogleAuthRequest(
        idToken = idToken,
        tenantName = "Sarah's Yoga Studio" // User enters this
    )
)
```

**Option B: Join Existing Gym**
```kotlin
val response = authApi.googleAuth(
    GoogleAuthRequest(
        idToken = idToken,
        tenantId = "clx123..." // User enters gym code
    )
)
```

## Quick Test Fix

For quick testing, auto-create a gym for new users:

```kotlin
try {
    authApi.googleAuth(GoogleAuthRequest(idToken = idToken))
} catch (e: HttpException) {
    if (e.code() == 400) {
        // Auto-create gym for testing
        authApi.googleAuth(
            GoogleAuthRequest(
                idToken = idToken,
                tenantName = "Test Gym ${System.currentTimeMillis()}"
            )
        )
    }
}
```

## What This Means

- **Existing users**: Just send `idToken` → works immediately ✅
- **New users**: Send `idToken` + `tenantName` (or `tenantId`) → creates account ✅

## Backend is Working Correctly

This is **NOT a bug**! The backend is correctly asking: "Which gym should I add this new user to?"

Your mobile app just needs to provide that information.

## Detailed Guides

For complete implementation:
- See `ANDROID_AUTH_FIX.md` for complete Android code examples
- See `GOOGLE_SIGNIN_INTEGRATION_GUIDE.md` for full API documentation

## Need Help?

The backend is ready and working. The issue is in the mobile app's authentication flow. Implement the two-step process above and you're good to go!
