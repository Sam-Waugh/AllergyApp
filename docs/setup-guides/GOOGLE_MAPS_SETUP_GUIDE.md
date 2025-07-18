# 🗺️ Google Maps API Setup & Troubleshooting Guide

## Current Issue: "Failed to load map image"

Based on the error you're experiencing, here's a comprehensive guide to fix the Google Maps Static API integration.

## 🔧 Step-by-Step Fix

### 1. **Verify Google Cloud Console Setup**

#### Enable Required APIs:
1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Select your project (or create a new one)
3. Navigate to **APIs & Services** > **Library**
4. Enable these APIs:
   - ✅ **Maps Static API** (Essential)
   - ✅ **Maps JavaScript API** (For enhanced features)
   - ✅ **Geocoding API** (For location search)

#### API Key Configuration:
1. Go to **APIs & Services** > **Credentials**
2. Click **Create Credentials** > **API Key**
3. Copy the API key
4. Click **Restrict Key** and configure:
   - **Application restrictions**: None (for testing)
   - **API restrictions**: Select the APIs listed above

### 2. **Update Environment Variables**

Create/update your `.env` file in the frontend directory:

```bash
# Google Maps API Configuration
EXPO_PUBLIC_GOOGLE_MAPS_API_KEY=YOUR_NEW_API_KEY_HERE

# Backend API Configuration  
EXPO_PUBLIC_API_BASE_URL=http://localhost:8090

# Environment
EXPO_PUBLIC_ENV=development
```

### 3. **Enable Billing** (Critical!)

Google Maps requires billing to be enabled even for free tier usage:

1. Go to **Billing** in Google Cloud Console
2. Link a billing account to your project
3. Set up billing alerts to monitor usage

### 4. **Test API Key**

Use our test page to verify the API key works:

1. Open the test file: `quick_maps_test.html`
2. Replace the API key in the file with your new key
3. Check if the map loads successfully

### 5. **Common Troubleshooting**

#### Error: "This API project is not authorized to use this API"
- **Solution**: Enable Maps Static API in Google Cloud Console

#### Error: "The provided API key is invalid"
- **Solution**: Regenerate API key and update environment variables

#### Error: "You must enable Billing on the Google Cloud Project"
- **Solution**: Set up billing account (required even for free usage)

#### Error: "API key quota exceeded"
- **Solution**: Check quotas in Google Cloud Console and increase if needed

#### Error: "REQUEST_DENIED"
- **Solution**: Remove API key restrictions temporarily for testing

## 🧪 Testing Steps

### Step 1: Basic API Test
```bash
# Test URL (replace YOUR_API_KEY):
https://maps.googleapis.com/maps/api/staticmap?center=54.6534,-5.6683&zoom=11&size=400x200&key=YOUR_API_KEY
```

### Step 2: React Native App Test
1. Restart the Expo server: `npm start`
2. Navigate to the Pollen screen
3. Check the browser console for map loading logs
4. Verify the map displays correctly

### Step 3: Verify Integration
1. Test map type cycling (Road → Satellite → Hybrid)
2. Test fullscreen modal
3. Test pollen layer information

## 🔑 API Key Best Practices

### For Development:
- Use unrestricted API key initially
- Enable all required APIs
- Monitor usage in Google Cloud Console

### For Production:
- Restrict API key by domain/app
- Set up usage quotas and alerts
- Use separate keys for different environments

## 📊 Expected Results

When properly configured, you should see:
- ✅ Map loads with Bangor, Northern Ireland location
- ✅ Red marker showing your exact coordinates
- ✅ Pollen level indicator overlay
- ✅ Interactive controls working smoothly
- ✅ No console errors about map loading

## 🚨 Emergency Fallback

If Google Maps continues to fail, the app includes a fallback UI that shows:
- Location coordinates
- Pollen information
- Interactive controls
- Fullscreen modal with enhanced features

The app remains fully functional even without map images.

## 📞 Support Resources

- [Google Maps Platform Documentation](https://developers.google.com/maps/documentation)
- [Maps Static API Reference](https://developers.google.com/maps/documentation/maps-static)
- [Billing & Quotas Guide](https://developers.google.com/maps/documentation/maps-static/usage-and-billing)

## 🎯 Next Steps

1. **Set up proper Google Cloud project with billing**
2. **Enable Maps Static API**
3. **Update the API key in your .env file**
4. **Test using the quick test page**
5. **Restart the Expo server and test the app**

The map functionality has been implemented with comprehensive error handling and fallback mechanisms to ensure the app works reliably regardless of API status.
