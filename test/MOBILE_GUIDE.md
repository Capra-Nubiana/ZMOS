# ZMOS Mobile App Development Guide

This guide provides comprehensive specifications and best practices for developing the ZMOS Android mobile application. It covers UI/UX design, architecture patterns, offline capabilities, and integration requirements.

## App Overview

### Core Features
- **Authentication**: Secure login/signup with biometric support
- **Session Discovery**: Browse and filter available fitness classes
- **Booking Management**: Book, cancel, and track reservations
- **Check-in System**: GPS-based attendance tracking
- **Progress Tracking**: Streak counters and achievement badges
- **Social Features**: Community challenges and leaderboards

### Target Platforms
- **Primary**: Android 8.0+ (API 26+)
- **Architecture**: MVVM with Repository pattern
- **Language**: Kotlin with Coroutines
- **Minimum SDK**: API 26 (Oreo)
- **Target SDK**: Latest stable Android API

## Design System

### Color Palette

#### Primary Colors
```kotlin
val primary = Color(0xFF1976D2)      // Blue 700
val primaryVariant = Color(0xFF1565C0) // Blue 800
val secondary = Color(0xFFFF6F00)     // Orange 800
val secondaryVariant = Color(0xFFE65100) // Orange 900
```

#### Semantic Colors
```kotlin
val success = Color(0xFF4CAF50)      // Green 500
val error = Color(0xFFF44336)        // Red 500
val warning = Color(0xFFFF9800)      // Orange 500
val info = Color(0xFF2196F3)         // Blue 500
```

#### Neutral Colors
```kotlin
val background = Color(0xFFFAFAFA)   // Gray 50
val surface = Color(0xFFFFFFFF)      // White
val textPrimary = Color(0xFF212121)  // Gray 900
val textSecondary = Color(0xFF757575) // Gray 600
```

### Typography Scale

#### Font Family
- **Primary**: Roboto (system font)
- **Accent**: Roboto Condensed (for headers)

#### Text Styles
```kotlin
// Headline styles
val h1 = TextStyle(fontSize = 32.sp, fontWeight = FontWeight.Bold)
val h2 = TextStyle(fontSize = 24.sp, fontWeight = FontWeight.Bold)
val h3 = TextStyle(fontSize = 20.sp, fontWeight = FontWeight.SemiBold)

// Body styles
val body1 = TextStyle(fontSize = 16.sp, lineHeight = 24.sp)
val body2 = TextStyle(fontSize = 14.sp, lineHeight = 20.sp)
val caption = TextStyle(fontSize = 12.sp, fontWeight = FontWeight.Medium)
```

### Component Specifications

#### Buttons
```kotlin
@Composable
fun ZMOSButton(
    text: String,
    onClick: () -> Unit,
    type: ButtonType = ButtonType.Primary,
    enabled: Boolean = true,
    loading: Boolean = false
) {
    Button(
        onClick = onClick,
        enabled = enabled && !loading,
        colors = when (type) {
            ButtonType.Primary -> ButtonDefaults.buttonColors(
                backgroundColor = primary,
                contentColor = Color.White
            )
            ButtonType.Secondary -> ButtonDefaults.buttonColors(
                backgroundColor = secondary,
                contentColor = Color.White
            )
        },
        shape = RoundedCornerShape(8.dp),
        modifier = Modifier
            .fillMaxWidth()
            .height(48.dp)
    ) {
        if (loading) {
            CircularProgressIndicator(
                modifier = Modifier.size(20.dp),
                color = Color.White
            )
        } else {
            Text(text = text, style = buttonText)
        }
    }
}
```

#### Cards
```kotlin
@Composable
fun SessionCard(
    session: SessionInstance,
    onBook: () -> Unit,
    onViewDetails: () -> Unit
) {
    Card(
        modifier = Modifier
            .fillMaxWidth()
            .padding(8.dp),
        elevation = 4.dp,
        shape = RoundedCornerShape(12.dp)
    ) {
        Column(modifier = Modifier.padding(16.dp)) {
            // Header
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween
            ) {
                Text(
                    text = session.sessionType.name,
                    style = h3,
                    color = textPrimary
                )
                StatusBadge(status = session.status)
            }

            Spacer(modifier = Modifier.height(8.dp))

            // Time and location
            Text(
                text = "${formatTime(session.startTime)} - ${formatTime(session.endTime)}",
                style = body2,
                color = textSecondary
            )

            Text(
                text = session.location.name,
                style = body2,
                color = textSecondary
            )

            Spacer(modifier = Modifier.height(12.dp))

            // Capacity indicator
            CapacityIndicator(
                current = session.currentBookings,
                capacity = session.capacity
            )

            Spacer(modifier = Modifier.height(12.dp))

            // Action buttons
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.spacedBy(8.dp)
            ) {
                OutlinedButton(
                    onClick = onViewDetails,
                    modifier = Modifier.weight(1f)
                ) {
                    Text("Details")
                }

                ZMOSButton(
                    text = "Book Now",
                    onClick = onBook,
                    modifier = Modifier.weight(1f),
                    enabled = session.canBook
                )
            }
        }
    }
}
```

## App Architecture

### MVVM Pattern Implementation

#### ViewModel Structure
```kotlin
class SessionListViewModel @Inject constructor(
    private val sessionRepository: SessionRepository,
    private val bookingRepository: BookingRepository
) : ViewModel() {

    private val _sessions = MutableStateFlow<List<SessionInstance>>(emptyList())
    val sessions: StateFlow<List<SessionInstance>> = _sessions

    private val _uiState = MutableStateFlow<SessionListState>(SessionListState.Loading)
    val uiState: StateFlow<SessionListState> = _uiState

    fun loadSessions(filter: SessionFilter) {
        viewModelScope.launch {
            _uiState.value = SessionListState.Loading

            try {
                val result = sessionRepository.getSessions(filter)
                _sessions.value = result.sessions
                _uiState.value = SessionListState.Success
            } catch (e: Exception) {
                _uiState.value = SessionListState.Error(e.message ?: "Unknown error")
            }
        }
    }

    fun bookSession(sessionId: String) {
        viewModelScope.launch {
            try {
                val booking = bookingRepository.createBooking(sessionId)
                // Update local session state
                updateSessionBookingStatus(sessionId, true)
                // Show success message
                _uiState.value = SessionListState.BookingSuccess(booking)
            } catch (e: Exception) {
                _uiState.value = SessionListState.BookingError(e.message ?: "Booking failed")
            }
        }
    }
}
```

#### Repository Pattern
```kotlin
class SessionRepository @Inject constructor(
    private val apiService: ZMOSApiService,
    private val sessionDao: SessionDao,
    private val networkManager: NetworkManager
) {

    suspend fun getSessions(filter: SessionFilter): SessionResult {
        return if (networkManager.isOnline()) {
            try {
                val response = apiService.getSessions(
                    date = filter.date,
                    category = filter.category,
                    locationId = filter.locationId,
                    page = filter.page,
                    limit = filter.limit
                )

                // Cache for offline use
                sessionDao.insertSessions(response.data)

                SessionResult.Success(response.data, response.pagination)
            } catch (e: Exception) {
                // Try offline cache
                val cached = sessionDao.getSessions(filter)
                if (cached.isNotEmpty()) {
                    SessionResult.Offline(cached)
                } else {
                    SessionResult.Error(e.message ?: "Failed to load sessions")
                }
            }
        } else {
            // Offline mode
            val cached = sessionDao.getSessions(filter)
            SessionResult.Offline(cached)
        }
    }
}
```

## Offline Capabilities

### Data Synchronization

#### Sync Strategy
```kotlin
class DataSyncManager @Inject constructor(
    private val syncDao: SyncDao,
    private val apiService: ZMOSApiService,
    private val networkManager: NetworkManager
) {

    suspend fun syncPendingOperations() {
        if (!networkManager.isOnline()) return

        val pendingOperations = syncDao.getPendingOperations()

        for (operation in pendingOperations) {
            try {
                when (operation.type) {
                    SyncOperation.Type.BOOKING -> {
                        apiService.createBooking(operation.data as BookingRequest)
                        syncDao.markOperationComplete(operation.id)
                    }
                    SyncOperation.Type.CANCELLATION -> {
                        apiService.cancelBooking(operation.bookingId)
                        syncDao.markOperationComplete(operation.id)
                    }
                }
            } catch (e: Exception) {
                // Handle sync conflicts
                handleSyncConflict(operation, e)
            }
        }
    }

    private suspend fun handleSyncConflict(operation: SyncOperation, error: Exception) {
        when (error) {
            is HttpException -> {
                when (error.code()) {
                    409 -> { // Conflict
                        // Session became full while offline
                        notifyUserOfConflict(operation)
                        syncDao.deleteOperation(operation.id)
                    }
                    401 -> { // Unauthorized - token refresh needed
                        // Will be handled by token interceptor
                    }
                }
            }
        }
    }
}
```

#### Offline Queue Management
```kotlin
@Entity(tableName = "sync_operations")
data class SyncOperation(
    @PrimaryKey
    val id: String,
    val type: Type,
    val data: String, // JSON serialized
    val createdAt: Long,
    val retryCount: Int = 0,
    val maxRetries: Int = 3
) {
    enum class Type {
        BOOKING,
        CANCELLATION,
        CHECK_IN
    }
}

@Dao
interface SyncDao {
    @Query("SELECT * FROM sync_operations ORDER BY createdAt ASC")
    suspend fun getPendingOperations(): List<SyncOperation>

    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun insertOperation(operation: SyncOperation)

    @Query("DELETE FROM sync_operations WHERE id = :id")
    suspend fun deleteOperation(id: String)

    @Query("UPDATE sync_operations SET retryCount = retryCount + 1 WHERE id = :id")
    suspend fun incrementRetryCount(id: String)
}
```

## Push Notifications

### Notification Channels
```kotlin
class NotificationManager @Inject constructor(
    private val context: Context,
    private val notificationDao: NotificationDao
) {

    init {
        createNotificationChannels()
    }

    private fun createNotificationChannels() {
        val notificationManager = context.getSystemService(NotificationManager::class.java)

        val bookingChannel = NotificationChannel(
            BOOKING_CHANNEL_ID,
            "Bookings",
            NotificationManager.IMPORTANCE_HIGH
        ).apply {
            description = "Booking confirmations and updates"
            enableLights(true)
            lightColor = Color.BLUE
            enableVibration(true)
        }

        val reminderChannel = NotificationChannel(
            REMINDER_CHANNEL_ID,
            "Session Reminders",
            NotificationManager.IMPORTANCE_DEFAULT
        ).apply {
            description = "Upcoming session reminders"
        }

        val streakChannel = NotificationChannel(
            STREAK_CHANNEL_ID,
            "Achievements",
            NotificationManager.IMPORTANCE_LOW
        ).apply {
            description = "Streak and achievement notifications"
        }

        notificationManager.createNotificationChannels(listOf(
            bookingChannel,
            reminderChannel,
            streakChannel
        ))
    }

    fun showBookingConfirmation(booking: Booking) {
        val notification = NotificationCompat.Builder(context, BOOKING_CHANNEL_ID)
            .setSmallIcon(R.drawable.ic_booking_confirmed)
            .setContentTitle("Booking Confirmed!")
            .setContentText("${booking.sessionType.name} at ${booking.location.name}")
            .setPriority(NotificationCompat.PRIORITY_HIGH)
            .setAutoCancel(true)
            .build()

        notificationManager.notify(booking.id.hashCode(), notification)
    }

    companion object {
        const val BOOKING_CHANNEL_ID = "booking_channel"
        const val REMINDER_CHANNEL_ID = "reminder_channel"
        const val STREAK_CHANNEL_ID = "streak_channel"
    }
}
```

### FCM Integration
```kotlin
class FCMService : FirebaseMessagingService() {

    override fun onMessageReceived(remoteMessage: RemoteMessage) {
        val notificationType = remoteMessage.data["type"]
        val title = remoteMessage.data["title"] ?: "ZMOS"
        val body = remoteMessage.data["body"] ?: ""

        when (notificationType) {
            "booking_confirmation" -> handleBookingNotification(remoteMessage)
            "session_reminder" -> handleReminderNotification(remoteMessage)
            "streak_achievement" -> handleStreakNotification(remoteMessage)
            "waitlist_promotion" -> handleWaitlistNotification(remoteMessage)
        }
    }

    private fun handleBookingNotification(message: RemoteMessage) {
        val sessionId = message.data["sessionId"]
        val bookingId = message.data["bookingId"]

        // Navigate to booking details
        val intent = Intent(this, BookingDetailsActivity::class.java).apply {
            putExtra("bookingId", bookingId)
            putExtra("sessionId", sessionId)
        }

        showNotification(
            channelId = NotificationManager.BOOKING_CHANNEL_ID,
            title = message.data["title"] ?: "Booking Confirmed",
            body = message.data["body"] ?: "",
            intent = intent
        )
    }
}
```

## Location Services

### GPS Check-in Implementation
```kotlin
class LocationCheckInManager @Inject constructor(
    private val locationClient: FusedLocationProviderClient,
    private val apiService: ZMOSApiService
) {

    suspend fun checkInToSession(sessionId: String): CheckInResult {
        return try {
            val location = getCurrentLocation()
            val session = apiService.getSession(sessionId)

            // Validate proximity
            val distance = calculateDistance(
                location.latitude, location.longitude,
                session.location.latitude, session.location.longitude
            )

            if (distance > CHECK_IN_RADIUS_METERS) {
                return CheckInResult.LocationError("Too far from session location")
            }

            // Check if session is active
            val now = System.currentTimeMillis()
            val sessionStart = session.startTime.toInstant().toEpochMilli()
            val sessionEnd = session.endTime.toInstant().toEpochMilli()

            if (now < sessionStart - 15 * 60 * 1000) { // 15 min early
                return CheckInResult.TimeError("Session hasn't started yet")
            }

            if (now > sessionEnd) {
                return CheckInResult.TimeError("Session has ended")
            }

            // Perform check-in
            val result = apiService.checkInToSession(sessionId)
            CheckInResult.Success(result)

        } catch (e: Exception) {
            CheckInResult.Error(e.message ?: "Check-in failed")
        }
    }

    private suspend fun getCurrentLocation(): Location {
        return suspendCoroutine { continuation ->
            locationClient.getCurrentLocation(Priority.PRIORITY_HIGH_ACCURACY, null)
                .addOnSuccessListener { location ->
                    if (location != null) {
                        continuation.resume(location)
                    } else {
                        continuation.resumeWithException(Exception("Location unavailable"))
                    }
                }
                .addOnFailureListener { exception ->
                    continuation.resumeWithException(exception)
                }
        }
    }

    private fun calculateDistance(lat1: Double, lon1: Double, lat2: Double, lon2: Double): Double {
        val results = FloatArray(1)
        Location.distanceBetween(lat1, lon1, lat2, lon2, results)
        return results[0].toDouble()
    }

    companion object {
        const val CHECK_IN_RADIUS_METERS = 100.0 // 100 meters
    }
}
```

## Navigation & Deep Linking

### Navigation Structure
```kotlin
sealed class Screen(val route: String) {
    object Auth : Screen("auth")
    object Home : Screen("home")
    object Sessions : Screen("sessions")
    object Bookings : Screen("bookings")
    object Profile : Screen("profile")

    // Parameterized routes
    object SessionDetails : Screen("sessions/{sessionId}") {
        fun createRoute(sessionId: String) = "sessions/$sessionId"
    }

    object BookingDetails : Screen("bookings/{bookingId}") {
        fun createRoute(bookingId: String) = "bookings/$bookingId"
    }
}
```

### Deep Linking Setup
```xml
<!-- AndroidManifest.xml -->
<activity android:name=".MainActivity">
    <intent-filter android:autoVerify="true">
        <action android:name="android.intent.action.VIEW" />
        <category android:name="android.intent.category.DEFAULT" />
        <category android:name="android.intent.category.BROWSABLE" />

        <data
            android:scheme="https"
            android:host="app.zmos.com"
            android:pathPrefix="/sessions" />

        <data
            android:scheme="https"
            android:host="app.zmos.com"
            android:pathPrefix="/bookings" />
    </intent-filter>
</activity>
```

### Deep Link Handling
```kotlin
class DeepLinkHandler @Inject constructor(
    private val navController: NavController
) {

    fun handleDeepLink(uri: Uri) {
        when {
            uri.path?.startsWith("/sessions/") == true -> {
                val sessionId = uri.lastPathSegment
                navController.navigate(Screen.SessionDetails.createRoute(sessionId!!))
            }
            uri.path?.startsWith("/bookings/") == true -> {
                val bookingId = uri.lastPathSegment
                navController.navigate(Screen.BookingDetails.createRoute(bookingId!!))
            }
            uri.path?.startsWith("/reset-password") == true -> {
                val token = uri.getQueryParameter("token")
                navController.navigate(Screen.ResetPassword.createRoute(token!!))
            }
        }
    }
}
```

## Error Handling & User Experience

### Error States
```kotlin
sealed class UiState<out T> {
    object Loading : UiState<Nothing>()
    data class Success<T>(val data: T) : UiState<T>()
    data class Error(val message: String, val code: String? = null) : UiState<Nothing>()

    // Specific error types
    data class NetworkError(val message: String) : UiState<Nothing>()
    data class AuthError(val message: String) : UiState<Nothing>()
    data class ValidationError(val errors: Map<String, String>) : UiState<Nothing>()
}
```

### Retry Mechanisms
```kotlin
@Composable
fun RetryButton(
    onRetry: () -> Unit,
    modifier: Modifier = Modifier
) {
    Column(
        modifier = modifier,
        horizontalAlignment = Alignment.CenterHorizontally
    ) {
        Icon(
            imageVector = Icons.Default.Refresh,
            contentDescription = "Retry",
            tint = MaterialTheme.colors.primary
        )

        Spacer(modifier = Modifier.height(8.dp))

        Text(
            text = "Something went wrong",
            style = MaterialTheme.typography.body2,
            color = MaterialTheme.colors.error
        )

        Spacer(modifier = Modifier.height(8.dp))

        OutlinedButton(onClick = onRetry) {
            Text("Try Again")
        }
    }
}
```

## Performance Optimization

### Image Loading
```kotlin
@Composable
fun SessionImage(
    imageUrl: String,
    contentDescription: String,
    modifier: Modifier = Modifier
) {
    val painter = rememberAsyncImagePainter(
        model = ImageRequest.Builder(LocalContext.current)
            .data(imageUrl)
            .crossfade(true)
            .build(),
        placeholder = painterResource(R.drawable.session_placeholder),
        error = painterResource(R.drawable.session_error)
    )

    Image(
        painter = painter,
        contentDescription = contentDescription,
        modifier = modifier,
        contentScale = ContentScale.Crop
    )
}
```

### List Virtualization
```kotlin
@Composable
fun SessionList(
    sessions: List<SessionInstance>,
    onSessionClick: (SessionInstance) -> Unit
) {
    LazyColumn(
        modifier = Modifier.fillMaxSize(),
        contentPadding = PaddingValues(16.dp),
        verticalArrangement = Arrangement.spacedBy(8.dp)
    ) {
        items(
            items = sessions,
            key = { it.id }
        ) { session ->
            SessionCard(
                session = session,
                onClick = { onSessionClick(session) },
                modifier = Modifier.animateItemPlacement()
            )
        }
    }
}
```

## Testing Strategy

### Unit Tests
```kotlin
@Test
fun `booking creation should validate session availability`() = runTest {
    // Given
    val sessionId = "session-123"
    val mockSession = mock<SessionInstance> {
        on { capacity } doReturn 10
        on { currentBookings } doReturn 5
    }

    whenever(sessionRepository.getSession(sessionId)).thenReturn(mockSession)
    whenever(bookingRepository.createBooking(any())).thenReturn(mockBooking())

    // When
    val result = bookingViewModel.bookSession(sessionId)

    // Then
    assertTrue(result is BookingResult.Success)
}
```

### Integration Tests
```kotlin
@RunWith(AndroidJUnit4::class)
class BookingIntegrationTest {

    @get:Rule
    val instantTaskExecutorRule = InstantTaskExecutorRule()

    private lateinit var bookingViewModel: BookingViewModel

    @Before
    fun setup() {
        val apiService = mock<ZMOSApiService>()
        val repository = BookingRepository(apiService)
        bookingViewModel = BookingViewModel(repository)
    }

    @Test
    fun bookingFlow_shouldCompleteSuccessfully() {
        // Test full booking flow from UI to API
    }
}
```

## Security Implementation

### Certificate Pinning
```kotlin
// network_security_config.xml
<network-security-config>
    <domain-config>
        <domain includeSubdomains="true">api.zmos.com</domain>
        <pin-set expiration="2024-12-31">
            <pin digest="SHA-256">base64EncodedCertificatePin</pin>
        </pin-set>
    </domain-config>
</network-security-config>
```

### Biometric Authentication
```kotlin
class BiometricManager @Inject constructor(
    private val context: Context
) {

    private val biometricPrompt = BiometricPrompt(
        activity,
        ContextCompat.getMainExecutor(context),
        object : BiometricPrompt.AuthenticationCallback() {
            override fun onAuthenticationSucceeded(result: BiometricPrompt.AuthenticationResult) {
                // Authentication successful - proceed with action
                onAuthSuccess()
            }

            override fun onAuthenticationError(errorCode: Int, errString: CharSequence) {
                // Handle authentication error
                onAuthError(errorCode, errString)
            }
        }
    )

    fun authenticateForBooking() {
        val promptInfo = BiometricPrompt.PromptInfo.Builder()
            .setTitle("Confirm Booking")
            .setSubtitle("Use biometric authentication")
            .setNegativeButtonText("Cancel")
            .build()

        biometricPrompt.authenticate(promptInfo)
    }
}
```

## Accessibility

### Screen Reader Support
```kotlin
@Composable
fun AccessibleSessionCard(
    session: SessionInstance,
    onBook: () -> Unit,
    modifier: Modifier = Modifier
) {
    Card(
        modifier = modifier.semantics {
            contentDescription = buildString {
                append("${session.sessionType.name} session")
                append(" at ${session.location.name}")
                append(" from ${formatTime(session.startTime)}")
                append(" to ${formatTime(session.endTime)}")
                append(" ${session.currentBookings} of ${session.capacity} spots filled")
            }
            onClick(label = "Book session", action = { onBook(); true })
        }
    ) {
        // Card content
    }
}
```

### Dynamic Text Support
```kotlin
@Composable
fun ScalableText(
    text: String,
    style: TextStyle,
    modifier: Modifier = Modifier
) {
    val fontScale = LocalDensity.current.fontScale

    Text(
        text = text,
        style = style.copy(
            fontSize = style.fontSize * fontScale
        ),
        modifier = modifier
    )
}
```

---

## Development Workflow

### Git Branching Strategy
```
main (production)
├── develop (integration)
│   ├── feature/auth-flow
│   ├── feature/session-booking
│   └── feature/check-in-system
```

### Code Quality Standards
- **Linting**: Enabled with strict rules
- **Testing**: 80%+ code coverage required
- **Reviews**: All PRs require 2 approvals
- **Documentation**: All features documented

### Release Process
1. Feature branches merge to `develop`
2. `develop` tested and stabilized
3. `develop` merges to `main` for release
4. Tag release with semantic versioning

---

## Monitoring & Analytics

### Crash Reporting
```kotlin
class CrashReportingInitializer : Initializer<Unit> {

    override fun create(context: Context) {
        FirebaseCrashlytics.getInstance().setCrashlyticsCollectionEnabled(true)

        // Set user properties for better crash analysis
        FirebaseCrashlytics.getInstance().setUserId(userId)
        FirebaseCrashlytics.getInstance().setCustomKey("tenantId", tenantId)
    }
}
```

### Performance Monitoring
```kotlin
class PerformanceMonitor {

    fun trackApiCall(apiName: String, duration: Long, success: Boolean) {
        FirebaseAnalytics.getInstance(context).logEvent("api_call") {
            param("api_name", apiName)
            param("duration_ms", duration)
            param("success", success)
        }
    }

    fun trackScreenLoad(screenName: String, loadTime: Long) {
        FirebasePerformance.getInstance().newTrace("screen_load_$screenName").apply {
            putMetric("load_time_ms", loadTime)
        }.start()
    }
}
```

---

*This guide should be updated as the mobile app evolves. All UI/UX changes require design team approval.*
