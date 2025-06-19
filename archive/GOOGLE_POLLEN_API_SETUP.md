# Google Maps Pollen API Integration

This document explains how to set up and integrate the Google Maps Pollen API with the Allergy App.

## API Overview

The Google Maps Pollen API provides detailed pollen forecast information including:
- Daily pollen forecasts for up to 5 days
- Pollen type data (tree, grass, weed pollen)
- Pollen index values and categories
- Seasonal information
- Plant descriptions

## Setup Instructions

### 1. Get Google Cloud Project and API Key

1. Go to the [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select an existing one
3. Enable the "Pollen API" in the APIs & Services section
4. Create credentials (API Key) for the Pollen API
5. Optionally restrict the API key to specific APIs and IP addresses

### 2. Configure Environment Variables

1. Copy `.env.example` to `.env` in the backend directory
2. Add your Google Maps API key:
   ```
   GOOGLE_MAPS_API_KEY=your-actual-api-key-here
   ```

### 3. API Usage

The app now supports two endpoints for environmental data:

#### Get Environment Data by Location Name
```
GET /environment/{location}
```
- Uses predefined coordinates for known locations
- Falls back to mock data if location not found
- Includes real pollen data when available

#### Get Environment Data by Coordinates
```
GET /environment/current?lat={latitude}&lon={longitude}
```
- Uses exact coordinates for precise pollen data
- Recommended for mobile apps with GPS access

## Pollen Data Structure

The API returns enhanced pollen information:

```json
{
  "location": "New York, NY",
  "latitude": 40.7128,
  "longitude": -74.0060,
  "temperature": 22.5,
  "humidity": 65.0,
  "air_quality_index": 45,
  "uv_index": 6,
  "pollen_count": "moderate",
  "daily_pollen_info": [
    {
      "date": "2025-06-04",
      "pollen_types": [
        {
          "code": "TREE",
          "display_name": "Tree",
          "index_value": 3,
          "category": "MODERATE",
          "color": {"red": 255, "green": 165, "blue": 0},
          "in_season": true
        }
      ]
    }
  ],
  "plant_description": "Common plants in season include oak, maple, and birch trees."
}
```

## Frontend Integration

The frontend `EnvironmentService` now includes:

- `getCurrentLocation()` - Get user's GPS coordinates
- `getCurrentEnvironmentData(lat, lon)` - Get pollen data for specific coordinates
- `getPollenRiskForAllergen(data, allergen)` - Check risk for specific allergens
- `getOverallPollenRisk(data)` - Get overall pollen risk level

## Usage in Daily Logging

The enhanced pollen data can be used to:
- Automatically log environmental conditions with daily symptoms
- Provide personalized allergen warnings
- Track correlations between pollen levels and symptom severity
- Generate insights for doctor reports

## Cost Considerations

- Google Maps Pollen API has usage limits and pricing
- Consider caching responses for frequently requested locations
- Implement rate limiting to avoid excessive API calls
- Monitor usage in Google Cloud Console

## Fallback Strategy

When the Google Maps API is unavailable:
- The system falls back to mock pollen data
- Basic pollen levels (low/moderate/high) are still provided
- Weather and air quality data from other sources remain available

## Future Enhancements

Potential improvements:
- Add air quality data from Google Maps Air Quality API
- Integrate weather data from OpenWeatherMap
- Implement caching for frequently requested locations
- Add historical pollen data tracking
- Create pollen alerts and notifications
