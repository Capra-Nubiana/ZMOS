# Workout Preferences & Facility Services Implementation

## Overview

This document outlines the complete implementation of **workout preferences**, **facility services**, and **equipment/amenities** tracking for the ZMOS platform. This enables:

1. **Member Workout Preferences** - Track what activities, goals, and equipment members prefer
2. **Facility Equipment & Amenities** - List what each location offers
3. **Facility Services** - Track services like personal training, nutrition coaching, etc.
4. **Smart Matching** - Match members with facilities that have their preferred equipment/services
5. **Location Discovery** - Search and filter locations by amenities, equipment, and services

## Database Schema

### Location Model Enhancements

Added facility-specific fields to the `Location` model:

```prisma
model Location {
  // ... existing fields ...

  // Facility Services & Amenities
  amenities       String? // JSON array of amenity IDs (e.g., ["WIFI", "PARKING", "SHOWERS"])
  equipment       String? // JSON array of available equipment (e.g., ["TREADMILL", "WEIGHTS", "YOGA_MATS"])
  services        String? // JSON array of services offered (e.g., ["PERSONAL_TRAINING", "GROUP_CLASSES"])
  description     String? // Detailed facility description
  photos          String? // JSON array of photo URLs
  operatingHours  String? // JSON object { "monday": {"open": "06:00", "close": "22:00"}, ... }
}
```

### Member Profile Fields (JSON Storage)

**Owner Profile** (`ownerProfile` JSON field):
```typescript
{
  businessName: string;
  businessType: string;
  amenities: string[];    // What the business offers
  businessHours: {...};
  socialMedia: {...};
}
```

**Trainer Profile** (`trainerProfile` JSON field):
```typescript
{
  specializations: string[];  // YOGA, STRENGTH_TRAINING, CROSSFIT, etc.
  certifications: [...];
  languages: string[];
  availability: {...};
}
```

**Client Profile** (`clientProfile` JSON field):
```typescript
{
  fitnessGoals: string[];         // WEIGHT_LOSS, MUSCLE_GAIN, ENDURANCE
  experienceLevel: string;        // BEGINNER, INTERMEDIATE, ADVANCED
  preferredActivities: string[];  // YOGA, PILATES, STRENGTH_TRAINING
  healthConditions: string[];
  preferences: {
    preferredSessionTimes: string[];
    ...
  };
}
```

## Reference Data

### 1. Equipment (30+ Items)

Categorized gym equipment that facilities can have:

**Cardio Equipment:**
- `TREADMILL` 🏃
- `ELLIPTICAL` ⚡
- `STATIONARY_BIKE` 🚴
- `ROWING_MACHINE` 🚣
- `STAIR_CLIMBER` 🪜

**Strength Equipment:**
- `FREE_WEIGHTS` 🏋️
- `DUMBBELLS` 💪
- `BARBELLS` 🏋️
- `KETTLEBELLS` ⚖️
- `WEIGHT_MACHINES` 🏋️
- `SQUAT_RACK` 🦵
- `BENCH_PRESS` 🛋️
- `CABLE_MACHINE` 🔗
- `SMITH_MACHINE` 🏗️

**Functional Training:**
- `RESISTANCE_BANDS` 🔗
- `TRX_SUSPENSION` 🪢
- `MEDICINE_BALLS` ⚽
- `STABILITY_BALLS` 🔵
- `FOAM_ROLLERS` 📦
- `BATTLE_ROPES` 🪢
- `PLYO_BOXES` 📦

**Yoga & Flexibility:**
- `YOGA_MATS` 🧘
- `YOGA_BLOCKS` 🧱
- `YOGA_STRAPS` 🔗
- `PILATES_REFORMER` 🛋️

**Sports & Recreation:**
- `BOXING_BAGS` 🥊
- `BOXING_RING` 🥊
- `BASKETBALL_COURT` 🏀
- `SWIMMING_POOL` 🏊

**Recovery:**
- `SAUNA` 🧖
- `STEAM_ROOM` 💨

### 2. Amenities (10 Items)

Facility amenities for owner profiles:

- `WIFI` - WiFi
- `PARKING` - Parking
- `SHOWERS` - Showers
- `LOCKERS` - Lockers
- `SAUNA` - Sauna
- `POOL` - Pool
- `CAFE` - Café
- `PRO_SHOP` - Pro Shop
- `CHILDCARE` - Childcare
- `PERSONAL_TRAINING` - Personal Training

### 3. Facility Services (16 Items)

Services that facilities can offer:

**Training Services:**
- `PERSONAL_TRAINING` 👤 - One-on-one coaching sessions
- `GROUP_CLASSES` 👥 - Group fitness classes
- `VIRTUAL_TRAINING` 💻 - Online training sessions

**Wellness Services:**
- `NUTRITION_COACHING` 🥗 - Dietary guidance and meal planning
- `WELLNESS_COACHING` 🧘 - Holistic health coaching

**Specialized Programs:**
- `WEIGHT_LOSS_PROGRAM` ⚖️ - Structured weight loss support
- `STRENGTH_PROGRAM` 💪 - Progressive strength training
- `ATHLETIC_TRAINING` 🏃 - Sports performance training
- `SENIOR_FITNESS` 👴 - Age-appropriate fitness programs
- `YOUTH_PROGRAMS` 👶 - Kids and teen fitness

**Recovery & Wellness:**
- `MASSAGE_THERAPY` 💆 - Sports and recovery massage
- `PHYSICAL_THERAPY` 🏥 - Injury rehabilitation
- `CRYOTHERAPY` ❄️ - Cold therapy for recovery

**Assessments:**
- `FITNESS_ASSESSMENT` 📊 - Comprehensive fitness evaluation
- `BODY_COMPOSITION` 📈 - Body fat and muscle analysis
- `MOVEMENT_SCREENING` 🔍 - Functional movement assessment

### 4. Fitness Goals (7 Items)

Member fitness goal options:

- `WEIGHT_LOSS` - Weight Loss
- `MUSCLE_GAIN` - Muscle Gain
- `ENDURANCE` - Endurance
- `FLEXIBILITY` - Flexibility
- `GENERAL_FITNESS` - General Fitness
- `REHABILITATION` - Rehabilitation
- `SPORTS_PERFORMANCE` - Sports Performance

### 5. Preferred Activities (12 Items)

Activities members enjoy:

- `YOGA` - Yoga
- `PILATES` - Pilates
- `STRENGTH_TRAINING` - Strength Training
- `CARDIO` - Cardio
- `CROSSFIT` - CrossFit
- `SWIMMING` - Swimming
- `CYCLING` - Cycling
- `DANCE` - Dance
- `MARTIAL_ARTS` - Martial Arts
- `BOXING` - Boxing
- `RUNNING` - Running
- `GROUP_CLASSES` - Group Classes

### 6. Trainer Specializations (11 Items)

Trainer expertise areas:

- `YOGA` - Yoga
- `PILATES` - Pilates
- `STRENGTH_TRAINING` - Strength Training
- `CARDIO` - Cardio
- `CROSSFIT` - CrossFit
- `MARTIAL_ARTS` - Martial Arts
- `DANCE` - Dance
- `SWIMMING` - Swimming
- `CYCLING` - Cycling
- `NUTRITION` - Nutrition
- `PHYSICAL_THERAPY` - Physical Therapy

## API Endpoints

### 1. Get All Reference Data

```http
GET /reference/onboarding
Authorization: Bearer {token}
```

**Response:**
```json
{
  "equipment": [
    { "id": "TREADMILL", "category": "CARDIO", "name": "Treadmill", "icon": "🏃" },
    ...
  ],
  "facilityServices": [
    {
      "id": "PERSONAL_TRAINING",
      "category": "TRAINING",
      "name": "Personal Training",
      "icon": "👤",
      "description": "One-on-one coaching sessions"
    },
    ...
  ],
  "amenities": [...],
  "fitnessGoals": [...],
  "activities": [...],
  "specializations": [...],
  ...
}
```

### 2. Search Locations by Facilities

Search and filter locations based on amenities, equipment, and services:

```http
GET /locations/search/facilities?amenities=WIFI,PARKING&equipment=TREADMILL,FREE_WEIGHTS&services=PERSONAL_TRAINING
Authorization: Bearer {token}
```

**Query Parameters:**
- `amenities` (optional) - Comma-separated amenity IDs
- `equipment` (optional) - Comma-separated equipment IDs
- `services` (optional) - Comma-separated service IDs
- `locationType` (optional) - Filter by type: `indoor`, `outdoor`, `hybrid`, `virtual`
- `country` (optional) - ISO country code
- `province` (optional) - Province/state code
- `city` (optional) - City name

**Example Request:**
```bash
GET /locations/search/facilities?equipment=YOGA_MATS,PILATES_REFORMER&services=GROUP_CLASSES&city=Johannesburg
```

**Response:**
```json
[
  {
    "id": "loc_123",
    "name": "Zen Yoga Studio",
    "address": "123 Main St, Johannesburg",
    "city": "Johannesburg",
    "province": "ZA-GP",
    "country": "ZA",
    "locationType": "indoor",
    "amenities": ["WIFI", "SHOWERS", "PARKING"],
    "equipment": ["YOGA_MATS", "YOGA_BLOCKS", "PILATES_REFORMER"],
    "services": ["GROUP_CLASSES", "PERSONAL_TRAINING", "WELLNESS_COACHING"],
    "description": "Premium yoga and pilates studio",
    "photos": ["https://example.com/photo1.jpg", "https://example.com/photo2.jpg"],
    "operatingHours": {
      "monday": {"open": "06:00", "close": "21:00"},
      "tuesday": {"open": "06:00", "close": "21:00"},
      ...
    },
    "capacity": 30,
    "latitude": -26.2041,
    "longitude": 28.0473
  },
  ...
]
```

### 3. Find Nearby Locations

Find locations near a specific coordinate within a radius:

```http
GET /locations/search/nearby?latitude=-26.2041&longitude=28.0473&radiusKm=5
Authorization: Bearer {token}
```

**Query Parameters:**
- `latitude` (required) - Latitude coordinate
- `longitude` (required) - Longitude coordinate
- `radiusKm` (optional, default: 10) - Search radius in kilometers

**Response:**
```json
[
  {
    "id": "loc_123",
    "name": "FitZone Sandton",
    "distance": 2.34,  // Distance in km from search point
    "amenities": ["WIFI", "PARKING", "SHOWERS", "SAUNA"],
    "equipment": ["TREADMILL", "FREE_WEIGHTS", "YOGA_MATS"],
    "services": ["PERSONAL_TRAINING", "GROUP_CLASSES"],
    "latitude": -26.1076,
    "longitude": 28.0567,
    ...
  },
  {
    "id": "loc_456",
    "name": "Iron House Gym",
    "distance": 4.87,
    ...
  }
]
```

**Note:** Locations are sorted by distance (closest first) using the Haversine formula for accurate geographic distance calculation.

## Use Cases

### 1. Member Finds Gym with Preferred Equipment

**Scenario:** Client prefers strength training and wants a gym with free weights and squat rack near them.

**Implementation:**
```typescript
// Mobile app flow:
1. Get member location: { lat: -26.2041, lon: 28.0473 }
2. Get member preferences from profile:
   { preferredActivities: ["STRENGTH_TRAINING"], equipment: ["FREE_WEIGHTS", "SQUAT_RACK"] }
3. Search nearby with equipment filter:
   GET /locations/search/nearby?latitude=-26.2041&longitude=28.0473&radiusKm=10
4. Client-side filter results by required equipment
5. Display matched locations sorted by distance
```

### 2. Owner Sets Up Facility Profile

**Scenario:** Gym owner completes their profile and lists all available equipment and services.

**Implementation:**
```typescript
// During owner onboarding:
1. Fetch equipment reference data: GET /reference/onboarding
2. Owner selects equipment available at facility:
   ["TREADMILL", "FREE_WEIGHTS", "YOGA_MATS", "SWIMMING_POOL"]
3. Owner selects amenities:
   ["WIFI", "PARKING", "SHOWERS", "CAFE"]
4. Owner selects services offered:
   ["PERSONAL_TRAINING", "GROUP_CLASSES", "NUTRITION_COACHING"]
5. Save to ownerProfile JSON field
6. Create location with this data:
   POST /locations
   {
     "name": "Elite Fitness Center",
     "equipment": ["TREADMILL", "FREE_WEIGHTS", ...],
     "amenities": ["WIFI", "PARKING", ...],
     "services": ["PERSONAL_TRAINING", ...],
     ...
   }
```

### 3. Trainer Advertises Specializations

**Scenario:** Personal trainer lists their specializations to attract clients.

**Implementation:**
```typescript
// Trainer profile completion:
1. Fetch specialization reference data: GET /reference/onboarding
2. Trainer selects specializations:
   ["STRENGTH_TRAINING", "NUTRITION", "SPORTS_PERFORMANCE"]
3. Save to trainerProfile JSON:
   POST /members/my/profile/complete/trainer
   {
     "name": "John Doe",
     "specializations": ["STRENGTH_TRAINING", "NUTRITION", "SPORTS_PERFORMANCE"],
     "certifications": [...],
     "languages": ["EN", "ES"]
   }
4. System can later match trainers with members seeking those specializations
```

### 4. Smart Location Recommendations

**Scenario:** Recommend gyms to a member based on their workout preferences.

**Pseudo-code for recommendation service:**
```typescript
async getRecommendedLocations(memberId: string) {
  // Get member profile
  const member = await getMember(memberId);
  const preferences = member.clientProfile;

  // Extract preferred equipment from activities
  const equipmentNeeds = mapActivitiesToEquipment(preferences.preferredActivities);
  // e.g., YOGA -> YOGA_MATS, STRENGTH_TRAINING -> FREE_WEIGHTS

  // Search locations with required equipment
  const locations = await searchByFacilities({
    equipment: equipmentNeeds,
    country: member.country,
  });

  // Get member location for distance calculation
  const nearby = await findNearby(member.latitude, member.longitude, 15);

  // Combine and rank by:
  // 1. Has required equipment (must-have)
  // 2. Distance (closer is better)
  // 3. Has preferred services
  // 4. User ratings (future feature)

  return rankedLocations;
}
```

## Mobile App Integration Guide

### 1. Facility Discovery Screen

```typescript
// React Native / Kotlin Compose
const FacilitySearch = () => {
  const [filters, setFilters] = useState({
    equipment: [],
    amenities: [],
    services: [],
  });

  const searchFacilities = async () => {
    const params = new URLSearchParams({
      equipment: filters.equipment.join(','),
      amenities: filters.amenities.join(','),
      services: filters.services.join(','),
    });

    const response = await fetch(`/locations/search/facilities?${params}`);
    const locations = await response.json();

    // Display locations
  };

  return (
    <View>
      <EquipmentFilter
        selected={filters.equipment}
        onChange={(eq) => setFilters({...filters, equipment: eq})}
      />
      <AmenityFilter
        selected={filters.amenities}
        onChange={(am) => setFilters({...filters, amenities: am})}
      />
      <Button onPress={searchFacilities}>Search</Button>
      <LocationList locations={locations} />
    </View>
  );
};
```

### 2. Location Detail View

```typescript
const LocationDetail = ({ locationId }) => {
  const [location, setLocation] = useState(null);

  useEffect(() => {
    fetch(`/locations/${locationId}`)
      .then(res => res.json())
      .then(data => setLocation(data));
  }, [locationId]);

  return (
    <ScrollView>
      <Image source={{ uri: location.photos[0] }} />
      <Text>{location.name}</Text>
      <Text>{location.description}</Text>

      <Section title="Amenities">
        {location.amenities.map(amenityId => (
          <Chip key={amenityId} icon={getAmenityIcon(amenityId)}>
            {getAmenityName(amenityId)}
          </Chip>
        ))}
      </Section>

      <Section title="Equipment">
        {location.equipment.map(equipId => (
          <Chip key={equipId} icon={getEquipmentIcon(equipId)}>
            {getEquipmentName(equipId)}
          </Chip>
        ))}
      </Section>

      <Section title="Services">
        {location.services.map(serviceId => (
          <ListItem
            key={serviceId}
            icon={getServiceIcon(serviceId)}
            title={getServiceName(serviceId)}
            subtitle={getServiceDescription(serviceId)}
          />
        ))}
      </Section>

      <OperatingHours hours={location.operatingHours} />
    </ScrollView>
  );
};
```

### 3. Onboarding Equipment Selection

```typescript
const EquipmentSelection = ({ onComplete }) => {
  const [equipment, setEquipment] = useState([]);
  const [referenceData, setReferenceData] = useState(null);

  useEffect(() => {
    // Load reference data
    fetch('/reference/onboarding')
      .then(res => res.json())
      .then(data => setReferenceData(data));
  }, []);

  const toggleEquipment = (equipId) => {
    setEquipment(prev =>
      prev.includes(equipId)
        ? prev.filter(id => id !== equipId)
        : [...prev, equipId]
    );
  };

  return (
    <View>
      <Text>What equipment does your facility have?</Text>

      {Object.entries(groupByCategory(referenceData?.equipment)).map(([category, items]) => (
        <Section key={category} title={category}>
          {items.map(item => (
            <Checkbox
              key={item.id}
              checked={equipment.includes(item.id)}
              onChange={() => toggleEquipment(item.id)}
              label={`${item.icon} ${item.name}`}
            />
          ))}
        </Section>
      ))}

      <Button onPress={() => onComplete(equipment)}>
        Continue
      </Button>
    </View>
  );
};
```

## Best Practices

### 1. Equipment IDs Consistency

Always use the predefined equipment IDs from reference data. Never create custom equipment IDs.

✅ **Good:**
```json
{
  "equipment": ["TREADMILL", "FREE_WEIGHTS", "YOGA_MATS"]
}
```

❌ **Bad:**
```json
{
  "equipment": ["treadmill", "weights", "mat"]  // Not using official IDs
}
```

### 2. Filtering Locations

When filtering locations by multiple criteria, use AND logic (location must have ALL specified equipment/amenities):

```typescript
// This finds gyms that have BOTH treadmill AND free weights
GET /locations/search/facilities?equipment=TREADMILL,FREE_WEIGHTS
```

### 3. Distance Calculation

The Haversine formula provides accurate distances for short distances (<500km). For very long distances or precise routing, integrate with Google Maps Distance Matrix API.

### 4. Caching Reference Data

Reference data rarely changes. Cache it in the mobile app for 24 hours:

```typescript
// Cache reference data
const CACHE_KEY = 'reference_data';
const CACHE_DURATION = 24 * 60 * 60 * 1000; // 24 hours

const getReferenceData = async () => {
  const cached = await AsyncStorage.getItem(CACHE_KEY);
  if (cached) {
    const { data, timestamp } = JSON.parse(cached);
    if (Date.now() - timestamp < CACHE_DURATION) {
      return data;
    }
  }

  // Fetch fresh data
  const response = await fetch('/reference/onboarding');
  const data = await response.json();

  // Cache it
  await AsyncStorage.setItem(CACHE_KEY, JSON.stringify({
    data,
    timestamp: Date.now(),
  }));

  return data;
};
```

## Summary

### Completed Features ✅

1. **Database Schema**
   - Added 6 facility-related fields to Location model
   - Equipment, amenities, services, description, photos, operating hours

2. **Reference Data**
   - 30+ equipment items across 5 categories
   - 16 facility services across 4 categories
   - 10 amenities
   - Fitness goals, activities, specializations

3. **API Endpoints**
   - `GET /reference/onboarding` - All reference data
   - `GET /locations/search/facilities` - Filter by equipment/amenities/services
   - `GET /locations/search/nearby` - Geographic search with Haversine distance

4. **Smart Search**
   - Multi-criteria filtering (AND logic)
   - Geographic search with distance calculation
   - JSON field parsing for amenities/equipment/services

### Integration with Existing Features

- **Workout Preferences** (Client Profile) ↔ **Location Equipment** = Smart matching
- **Trainer Specializations** ↔ **Facility Services** = Service availability
- **Owner Amenities** ↔ **Location Amenities** = Comprehensive facility info

### Next Steps (Future Enhancements)

1. **Smart Recommendations Engine**
   - ML-based facility recommendations based on member preferences
   - Collaborative filtering (members like you also visited...)

2. **Equipment Availability Tracking**
   - Real-time tracking of equipment in use
   - Reserve equipment for specific time slots

3. **Service Booking**
   - Book facility services (massage, nutrition consultation)
   - Integration with session booking

4. **User Reviews & Ratings**
   - Members rate facilities and equipment
   - Factor ratings into search rankings

5. **Photo Upload**
   - Allow facilities to upload equipment photos
   - Virtual tours

## Testing Examples

### Test Facility Search

```bash
# Search for gyms with specific equipment
curl -H "Authorization: Bearer $TOKEN" \
  "http://localhost:3000/locations/search/facilities?equipment=TREADMILL,FREE_WEIGHTS&services=PERSONAL_TRAINING"

# Find nearby gyms
curl -H "Authorization: Bearer $TOKEN" \
  "http://localhost:3000/locations/search/nearby?latitude=-26.2041&longitude=28.0473&radiusKm=10"

# Get all reference data
curl -H "Authorization: Bearer $TOKEN" \
  "http://localhost:3000/reference/onboarding"
```

---

**This implementation provides a solid foundation for member-facility matching and ensures members can easily find gyms with the equipment and services they need!** 🏋️💪🧘
