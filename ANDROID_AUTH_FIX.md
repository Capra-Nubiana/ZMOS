# Android App Authentication Fix

## The Problem

Your Android app is currently receiving this error when attempting Google Sign-In:

```json
{
  "message": "Either tenantId (to join existing tenant) or tenantName (to create new tenant) must be provided",
  "error": "Bad Request",
  "statusCode": 400
}
```

**Current Request (from your logs):**
```json
{
  "idToken": "eyJhbGciOiJSUzI1NiIs..."
}
```

## Why This Happens

This is **NOT a bug** - it's expected behavior! Here's what's happening:

1. User signs in with Google for the **first time**
2. Android app sends only the `idToken` to `/auth/google`
3. Backend checks: "Does this Google account exist in our database?"
4. Backend finds: "No, this is a new user!"
5. Backend responds: "I need to know which gym/studio to add this user to"

The backend needs to know: Should I create a **new gym** for this user, or add them to an **existing gym**?

## The Solution

Your Android app needs to implement a **two-step authentication flow** for new users:

### Step 1: Attempt Sign-In

Try signing in with just the `idToken`:

```kotlin
// First attempt
val response = authApi.googleAuth(
    GoogleAuthRequest(idToken = idToken)
)
```

### Step 2: Handle New User Case

If you get a 400 error, the user is new. Show them a dialog:

```kotlin
catch (e: HttpException) {
    if (e.code() == 400 && e.message().contains("tenantId")) {
        // User is NEW - show tenant selection dialog
        showNewUserDialog(idToken)
    }
}
```

### Step 3: Let User Choose

Present two options:

**Option A: "Create My Own Gym/Studio"**
```kotlin
// User enters gym name: "Sarah's Yoga Studio"
val response = authApi.googleAuth(
    GoogleAuthRequest(
        idToken = idToken,
        tenantName = "Sarah's Yoga Studio"
    )
)
```

**Option B: "Join Existing Gym"**
```kotlin
// User enters gym code/ID or selects from list
val response = authApi.googleAuth(
    GoogleAuthRequest(
        idToken = idToken,
        tenantId = "clx1234567890"
    )
)
```

## Quick Fix for Testing

For quick testing, you can hardcode a tenant name in your Android app:

```kotlin
// TEMPORARY - Just for testing
suspend fun googleSignIn(idToken: String) {
    try {
        // Try normal sign-in first
        val response = authApi.googleAuth(
            GoogleAuthRequest(idToken = idToken)
        )
        handleSuccess(response)
    } catch (e: HttpException) {
        if (e.code() == 400) {
            // New user - auto-create gym for testing
            val response = authApi.googleAuth(
                GoogleAuthRequest(
                    idToken = idToken,
                    tenantName = "Test Gym ${System.currentTimeMillis()}" // Unique name
                )
            )
            handleSuccess(response)
        }
    }
}
```

## Complete Android Implementation

Here's the complete recommended implementation:

```kotlin
// AuthViewModel.kt
class AuthViewModel @Inject constructor(
    private val authApi: AuthApi,
    private val preferences: UserPreferences
) : ViewModel() {

    private val _authState = MutableStateFlow<AuthState>(AuthState.Idle)
    val authState = _authState.asStateFlow()

    fun handleGoogleSignIn(idToken: String) {
        viewModelScope.launch {
            _authState.value = AuthState.Loading

            try {
                // Step 1: Try signing in with just idToken
                val response = authApi.googleAuth(
                    GoogleAuthRequest(idToken = idToken)
                )

                // Success! Existing user
                saveAuthData(response)
                _authState.value = AuthState.Success(response)

            } catch (e: HttpException) {
                when {
                    e.code() == 400 && e.message()?.contains("tenantId") == true -> {
                        // New user - need tenant selection
                        _authState.value = AuthState.NeedsTenantSelection(idToken)
                    }
                    else -> {
                        _authState.value = AuthState.Error(e.message() ?: "Unknown error")
                    }
                }
            } catch (e: Exception) {
                _authState.value = AuthState.Error(e.message ?: "Network error")
            }
        }
    }

    fun createNewGym(idToken: String, gymName: String) {
        viewModelScope.launch {
            _authState.value = AuthState.Loading

            try {
                val response = authApi.googleAuth(
                    GoogleAuthRequest(
                        idToken = idToken,
                        tenantName = gymName
                    )
                )

                saveAuthData(response)
                _authState.value = AuthState.Success(response)

            } catch (e: HttpException) {
                when {
                    e.code() == 409 -> {
                        _authState.value = AuthState.Error(
                            "A gym with this name already exists. Please choose a different name."
                        )
                    }
                    else -> {
                        _authState.value = AuthState.Error(e.message() ?: "Unknown error")
                    }
                }
            } catch (e: Exception) {
                _authState.value = AuthState.Error(e.message ?: "Network error")
            }
        }
    }

    fun joinExistingGym(idToken: String, tenantId: String) {
        viewModelScope.launch {
            _authState.value = AuthState.Loading

            try {
                val response = authApi.googleAuth(
                    GoogleAuthRequest(
                        idToken = idToken,
                        tenantId = tenantId
                    )
                )

                saveAuthData(response)
                _authState.value = AuthState.Success(response)

            } catch (e: Exception) {
                _authState.value = AuthState.Error(e.message ?: "Unknown error")
            }
        }
    }

    private suspend fun saveAuthData(response: GoogleAuthResponse) {
        preferences.saveToken(response.token)
        preferences.saveTenantId(response.member.tenantId)
        preferences.saveMemberId(response.member.id)
        preferences.saveGymName(response.tenant.name)
    }
}

// Auth state sealed class
sealed class AuthState {
    object Idle : AuthState()
    object Loading : AuthState()
    data class Success(val response: GoogleAuthResponse) : AuthState()
    data class NeedsTenantSelection(val idToken: String) : AuthState()
    data class Error(val message: String) : AuthState()
}

// API data classes
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

data class Member(
    val id: String,
    val email: String,
    val name: String,
    val tenantId: String
)

data class Tenant(
    val id: String,
    val name: String
)
```

## UI Implementation (Jetpack Compose)

```kotlin
// GoogleSignInScreen.kt
@Composable
fun GoogleSignInScreen(
    viewModel: AuthViewModel = hiltViewModel(),
    onSuccess: () -> Unit
) {
    val authState by viewModel.authState.collectAsState()

    // Google Sign-In launcher
    val launcher = rememberFirebaseAuthLauncher(
        onAuthComplete = { result ->
            result.user?.let { user ->
                user.getIdToken(false).addOnSuccessListener { tokenResult ->
                    viewModel.handleGoogleSignIn(tokenResult.token!!)
                }
            }
        },
        onAuthError = { error ->
            // Handle error
        }
    )

    when (val state = authState) {
        is AuthState.Idle -> {
            GoogleSignInButton(
                onClick = { launcher.launch() }
            )
        }

        is AuthState.Loading -> {
            CircularProgressIndicator()
        }

        is AuthState.Success -> {
            LaunchedEffect(Unit) {
                onSuccess()
            }
        }

        is AuthState.NeedsTenantSelection -> {
            TenantSelectionDialog(
                idToken = state.idToken,
                onCreateGym = { gymName ->
                    viewModel.createNewGym(state.idToken, gymName)
                },
                onJoinGym = { tenantId ->
                    viewModel.joinExistingGym(state.idToken, tenantId)
                },
                onDismiss = {
                    viewModel.reset()
                }
            )
        }

        is AuthState.Error -> {
            ErrorMessage(message = state.message)
        }
    }
}

@Composable
fun TenantSelectionDialog(
    idToken: String,
    onCreateGym: (String) -> Unit,
    onJoinGym: (String) -> Unit,
    onDismiss: () -> Unit
) {
    var showCreateDialog by remember { mutableStateOf(false) }
    var showJoinDialog by remember { mutableStateOf(false) }

    AlertDialog(
        onDismissRequest = onDismiss,
        title = { Text("Welcome to MoveOS!") },
        text = {
            Column {
                Text("Are you a gym owner or a member?")
                Spacer(modifier = Modifier.height(16.dp))

                OutlinedButton(
                    onClick = { showCreateDialog = true },
                    modifier = Modifier.fillMaxWidth()
                ) {
                    Icon(Icons.Default.Add, contentDescription = null)
                    Spacer(modifier = Modifier.width(8.dp))
                    Text("Create My Gym/Studio")
                }

                Spacer(modifier = Modifier.height(8.dp))

                OutlinedButton(
                    onClick = { showJoinDialog = true },
                    modifier = Modifier.fillMaxWidth()
                ) {
                    Icon(Icons.Default.Login, contentDescription = null)
                    Spacer(modifier = Modifier.width(8.dp))
                    Text("Join Existing Gym")
                }
            }
        },
        confirmButton = {},
        dismissButton = {
            TextButton(onClick = onDismiss) {
                Text("Cancel")
            }
        }
    )

    if (showCreateDialog) {
        CreateGymDialog(
            onConfirm = { gymName ->
                onCreateGym(gymName)
                showCreateDialog = false
            },
            onDismiss = { showCreateDialog = false }
        )
    }

    if (showJoinDialog) {
        JoinGymDialog(
            onConfirm = { tenantId ->
                onJoinGym(tenantId)
                showJoinDialog = false
            },
            onDismiss = { showJoinDialog = false }
        )
    }
}

@Composable
fun CreateGymDialog(
    onConfirm: (String) -> Unit,
    onDismiss: () -> Unit
) {
    var gymName by remember { mutableStateOf("") }

    AlertDialog(
        onDismissRequest = onDismiss,
        title = { Text("Create Your Gym/Studio") },
        text = {
            Column {
                Text("What's the name of your gym or studio?")
                Spacer(modifier = Modifier.height(16.dp))
                OutlinedTextField(
                    value = gymName,
                    onValueChange = { gymName = it },
                    label = { Text("Gym/Studio Name") },
                    placeholder = { Text("e.g., Sarah's Yoga Studio") },
                    modifier = Modifier.fillMaxWidth()
                )
            }
        },
        confirmButton = {
            Button(
                onClick = { onConfirm(gymName) },
                enabled = gymName.isNotBlank()
            ) {
                Text("Create")
            }
        },
        dismissButton = {
            TextButton(onClick = onDismiss) {
                Text("Cancel")
            }
        }
    )
}

@Composable
fun JoinGymDialog(
    onConfirm: (String) -> Unit,
    onDismiss: () -> Unit
) {
    var gymCode by remember { mutableStateOf("") }

    AlertDialog(
        onDismissRequest = onDismiss,
        title = { Text("Join Existing Gym") },
        text = {
            Column {
                Text("Enter the gym code provided by your gym:")
                Spacer(modifier = Modifier.height(16.dp))
                OutlinedTextField(
                    value = gymCode,
                    onValueChange = { gymCode = it },
                    label = { Text("Gym Code") },
                    placeholder = { Text("e.g., clx1234567890") },
                    modifier = Modifier.fillMaxWidth()
                )
            }
        },
        confirmButton = {
            Button(
                onClick = { onConfirm(gymCode) },
                enabled = gymCode.isNotBlank()
            ) {
                Text("Join")
            }
        },
        dismissButton = {
            TextButton(onClick = onDismiss) {
                Text("Cancel")
            }
        }
    )
}
```

## Testing the Fix

### Test Case 1: Existing User
1. Sign in with Google
2. Should succeed immediately without dialog

### Test Case 2: New User - Create Gym
1. Sign in with Google (first time)
2. See "Welcome to MoveOS" dialog
3. Click "Create My Gym/Studio"
4. Enter gym name: "Test Yoga Studio"
5. Should create gym and sign in successfully

### Test Case 3: New User - Join Gym
1. Sign in with Google (first time)
2. See "Welcome to MoveOS" dialog
3. Click "Join Existing Gym"
4. Enter gym code (tenant ID)
5. Should join gym and sign in successfully

## Summary

**The Fix:**
1. Catch the 400 error when signing in new users
2. Show a dialog asking if they want to create a gym or join one
3. Re-call `/auth/google` with `tenantName` or `tenantId`

**This is NOT a backend bug** - the backend is correctly asking for required information. The mobile app just needs to implement the proper UX flow for new users.

See `GOOGLE_SIGNIN_INTEGRATION_GUIDE.md` for more detailed information about the authentication flow and API usage.
