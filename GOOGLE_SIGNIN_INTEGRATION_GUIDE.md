# Google Sign-In Integration Guide for Mobile Apps

## Overview

The MoveOS backend supports Google Sign-In authentication with automatic tenant creation or joining. This guide explains how to properly integrate Google Sign-In in your mobile app.

---

## Authentication Endpoint

**URL:** `POST /auth/google`

**Headers:**
```
Content-Type: application/json
```

**Important:** Do NOT include `x-tenant-id` header during authentication - the tenant context comes from the request body.

---

## Request Body

### For New Users (First-time Sign-In)

When a user signs in with Google for the first time and wants to **create a new gym/studio**:

```json
{
  "idToken": "eyJhbGciOiJSUzI1NiIs...",
  "tenantName": "My Awesome Gym"
}
```

**Fields:**
- `idToken` (required): The Google ID token from Google Sign-In
- `tenantName` (required for new users): The name of the gym/studio to create

### For Joining an Existing Gym

When a user signs in with Google and wants to **join an existing gym**:

```json
{
  "idToken": "eyJhbGciOiJSUzI1NiIs...",
  "tenantId": "clx1234567890abcdef"
}
```

**Fields:**
- `idToken` (required): The Google ID token from Google Sign-In
- `tenantId` (required): The ID of the existing gym/studio to join

### For Returning Users (Already Registered)

When a user who has already signed up tries to sign in again:

```json
{
  "idToken": "eyJhbGciOiJSUzI1NiIs..."
}
```

**The backend will automatically recognize the user by their Google ID or email and log them in.**

---

## Response

### Success Response (200 OK)

```json
{
  "member": {
    "id": "clx1234567890abcdef",
    "email": "user@example.com",
    "name": "John Doe",
    "tenantId": "clx9876543210fedcba"
  },
  "tenant": {
    "id": "clx9876543210fedcba",
    "name": "My Awesome Gym"
  },
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

**Save these values:**
- `token`: Use this JWT token in the `Authorization: Bearer <token>` header for all subsequent API calls
- `member.tenantId`: Use this in the `x-tenant-id` header for all subsequent API calls
- `member.id`: The member's unique ID
- `tenant.name`: Display the gym name in the app

### Error Responses

#### 400 Bad Request - Missing Tenant Info (New User)

```json
{
  "message": "Either tenantId (to join existing tenant) or tenantName (to create new tenant) must be provided",
  "error": "Bad Request",
  "statusCode": 400
}
```

**This means:** The user is signing in for the first time. Ask them to provide a gym name to create, or a gym ID to join.

#### 400 Bad Request - Invalid Token

```json
{
  "message": "Invalid Google token",
  "error": "Bad Request",
  "statusCode": 400
}
```

#### 409 Conflict - Tenant Name Exists

```json
{
  "message": "Tenant with name \"My Awesome Gym\" already exists",
  "error": "Conflict",
  "statusCode": 409
}
```

**This means:** Someone already created a gym with this name. Ask the user to choose a different name.

#### 409 Conflict - Member Already Exists in Tenant

```json
{
  "message": "Member with email \"user@example.com\" already exists in this tenant",
  "error": "Conflict",
  "statusCode": 409
}
```

---

## Mobile App Implementation Flow

### Recommended UX Flow

```
1. User taps "Sign in with Google"
   ↓
2. Google Sign-In SDK returns idToken
   ↓
3. Call POST /auth/google with { idToken }
   ↓
4. Backend checks if user exists:

   ┌─────────────────────────────────────────┐
   │ User exists?                            │
   └─────────────────────────────────────────┘
            ↓ YES                    ↓ NO
   ┌─────────────────┐      ┌─────────────────────────┐
   │ Return success  │      │ Return 400 error asking │
   │ with token      │      │ for tenantName/tenantId │
   └─────────────────┘      └─────────────────────────┘
            ↓                         ↓
   ┌─────────────────┐      ┌─────────────────────────┐
   │ Save token &    │      │ Show dialog to user:    │
   │ proceed to app  │      │ "Create new gym" or     │
   │                 │      │ "Join existing gym"     │
   └─────────────────┘      └─────────────────────────┘
                                     ↓
                          ┌─────────────────────────┐
                          │ If "Create new gym":    │
                          │ - Ask for gym name      │
                          │ - Call /auth/google     │
                          │   with tenantName       │
                          └─────────────────────────┘
                                     ↓
                          ┌─────────────────────────┐
                          │ If "Join existing gym": │
                          │ - Show list of gyms or  │
                          │   ask for gym code      │
                          │ - Call /auth/google     │
                          │   with tenantId         │
                          └─────────────────────────┘
```

### Android Implementation Example (Kotlin)

```kotlin
class AuthViewModel : ViewModel() {

    suspend fun handleGoogleSignIn(idToken: String) {
        try {
            // First attempt: Try signing in with just the idToken
            val response = authApi.googleAuth(
                GoogleAuthRequest(idToken = idToken)
            )

            // Success! User already exists
            saveAuthData(response.token, response.member.tenantId)
            navigateToHome()

        } catch (e: HttpException) {
            if (e.code() == 400) {
                // User is new - need to create or join tenant
                showTenantSelectionDialog(idToken)
            } else {
                showError(e.message())
            }
        }
    }

    private fun showTenantSelectionDialog(idToken: String) {
        // Show dialog with two options:
        // 1. "Create new gym" -> showCreateGymDialog(idToken)
        // 2. "Join existing gym" -> showJoinGymDialog(idToken)
    }

    private suspend fun createNewGym(idToken: String, gymName: String) {
        try {
            val response = authApi.googleAuth(
                GoogleAuthRequest(
                    idToken = idToken,
                    tenantName = gymName
                )
            )

            saveAuthData(response.token, response.member.tenantId)
            navigateToHome()

        } catch (e: HttpException) {
            if (e.code() == 409) {
                showError("A gym with this name already exists. Please choose a different name.")
            } else {
                showError(e.message())
            }
        }
    }

    private suspend fun joinExistingGym(idToken: String, tenantId: String) {
        try {
            val response = authApi.googleAuth(
                GoogleAuthRequest(
                    idToken = idToken,
                    tenantId = tenantId
                )
            )

            saveAuthData(response.token, response.member.tenantId)
            navigateToHome()

        } catch (e: HttpException) {
            showError(e.message())
        }
    }

    private fun saveAuthData(token: String, tenantId: String) {
        // Save to SharedPreferences or DataStore
        preferences.edit {
            putString("jwt_token", token)
            putString("tenant_id", tenantId)
        }
    }
}

// Data classes
data class GoogleAuthRequest(
    val idToken: String,
    val tenantName: String? = null,
    val tenantId: String? = null
)

data class GoogleAuthResponse(
    val member: Member,
    val tenant: Tenant,
    val token: String
)
```

### iOS Implementation Example (Swift)

```swift
class AuthViewModel: ObservableObject {

    func handleGoogleSignIn(idToken: String) async {
        do {
            // First attempt: Try signing in with just the idToken
            let response = try await authAPI.googleAuth(
                GoogleAuthRequest(idToken: idToken)
            )

            // Success! User already exists
            saveAuthData(token: response.token, tenantId: response.member.tenantId)
            navigateToHome()

        } catch let error as APIError where error.statusCode == 400 {
            // User is new - need to create or join tenant
            showTenantSelectionDialog(idToken: idToken)

        } catch {
            showError(error.localizedDescription)
        }
    }

    func createNewGym(idToken: String, gymName: String) async {
        do {
            let response = try await authAPI.googleAuth(
                GoogleAuthRequest(
                    idToken: idToken,
                    tenantName: gymName
                )
            )

            saveAuthData(token: response.token, tenantId: response.member.tenantId)
            navigateToHome()

        } catch let error as APIError where error.statusCode == 409 {
            showError("A gym with this name already exists. Please choose a different name.")

        } catch {
            showError(error.localizedDescription)
        }
    }

    private func saveAuthData(token: String, tenantId: String) {
        UserDefaults.standard.set(token, forKey: "jwt_token")
        UserDefaults.standard.set(tenantId, forKey: "tenant_id")
    }
}
```

---

## Testing the API

### Test 1: New User Creates Gym

```bash
curl -X POST http://localhost:3000/auth/google \
  -H "Content-Type: application/json" \
  -d '{
    "idToken": "GOOGLE_ID_TOKEN_HERE",
    "tenantName": "Test Gym Studio"
  }'
```

**Expected:** 200 OK with member, tenant, and token

### Test 2: New User Joins Existing Gym

```bash
curl -X POST http://localhost:3000/auth/google \
  -H "Content-Type: application/json" \
  -d '{
    "idToken": "GOOGLE_ID_TOKEN_HERE",
    "tenantId": "EXISTING_TENANT_ID_HERE"
  }'
```

**Expected:** 200 OK with member, tenant, and token

### Test 3: Returning User Sign-In

```bash
curl -X POST http://localhost:3000/auth/google \
  -H "Content-Type: application/json" \
  -d '{
    "idToken": "GOOGLE_ID_TOKEN_HERE"
  }'
```

**Expected:** 200 OK (if user exists) or 400 Bad Request (if new user)

### Test 4: Missing Tenant Info for New User

```bash
curl -X POST http://localhost:3000/auth/google \
  -H "Content-Type: application/json" \
  -d '{
    "idToken": "GOOGLE_ID_TOKEN_HERE"
  }'
```

**Expected (for new user):** 400 Bad Request with message about providing tenantId or tenantName

---

## Common Issues and Solutions

### Issue 1: "Either tenantId or tenantName must be provided"

**Cause:** The user is signing in for the first time, but the mobile app is not providing tenant information.

**Solution:** Implement the tenant selection flow shown above. Ask the user if they want to create a new gym or join an existing one.

### Issue 2: "Invalid Google token"

**Cause:** The Google ID token is invalid, expired, or the GOOGLE_CLIENT_ID doesn't match.

**Solution:**
- Ensure you're using a fresh ID token from Google Sign-In
- Verify that your Google Cloud Console project's Client ID matches the backend's GOOGLE_CLIENT_ID environment variable
- Check that the ID token is for the correct audience

### Issue 3: "Tenant with name already exists"

**Cause:** A gym with this name was already created by someone else.

**Solution:** Ask the user to choose a different gym name.

### Issue 4: Network errors or timeout

**Cause:** Backend server is not running or unreachable.

**Solution:** Verify the backend is running on the expected URL (e.g., http://localhost:3000 for local development).

---

## Backend Configuration

The backend requires these environment variables:

```env
# Google OAuth Configuration
GOOGLE_CLIENT_ID=your-google-client-id-here.apps.googleusercontent.com

# These are already set for JWT
JWT_SECRET=your-secret-key-here
```

Get your `GOOGLE_CLIENT_ID` from:
1. Go to https://console.cloud.google.com
2. Select your project
3. Navigate to "APIs & Services" > "Credentials"
4. Find your OAuth 2.0 Client ID

---

## Next Steps After Authentication

After successful Google Sign-In, the mobile app should:

1. **Save the JWT token** to secure storage (Keychain/KeyStore)
2. **Save the tenant ID** to secure storage
3. **Include these in all API requests:**
   - `Authorization: Bearer <token>` header
   - `x-tenant-id: <tenantId>` header

Example authenticated API call:

```bash
curl -X GET http://localhost:3000/my/profile \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIs..." \
  -H "x-tenant-id: clx9876543210fedcba"
```

---

## Summary

**Key Points:**
- New users MUST provide either `tenantName` (create gym) or `tenantId` (join gym)
- Returning users only need to provide `idToken`
- Always handle the 400 error for new users by showing a tenant selection dialog
- Save both the JWT token and tenant ID after successful authentication
- Include both in headers for all subsequent API requests

The 400 error you're seeing is **expected behavior** for first-time users - it's the backend's way of asking "which gym should I add this user to?"
