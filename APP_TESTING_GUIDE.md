# 📱 TESTING THE POLLEN APP - QUICK GUIDE

## 🚀 HOW TO TEST

### 1. Open the App
- **Mobile**: Scan QR code with Expo Go app
- **Web**: Click "Open in web browser" in Expo interface
- **Simulator**: Use your preferred simulator/emulator

### 2. Check HomeScreen
Navigate to the main screen and look for:
- ✅ **Environment Section**: Should show weather + pollen data
- ✅ **"View Full Pollen Forecast" Button**: Tap to go to detailed pollen page
- ✅ **Basic Pollen Count**: Should show "low", "moderate", or "high"

### 3. Check New PollenScreen
Look for "Pollen" tab in navigation:
- ✅ **Detailed Forecasts**: Color-coded pollen information
- ✅ **Health Tips**: Recommendations based on pollen levels
- ✅ **Pull to Refresh**: Swipe down to get latest data

## 🔍 WHAT YOU MIGHT SEE

### ✅ SUCCESS - Google API Working
```
🌸 Pollen Forecast
📍 New York, NY
Today's Pollen Level: MODERATE

🌸 Detailed Pollen Forecast:
Today (2025-06-13)
- Tree Pollen: LOW (Index: 2) 🌟 In Season
- Grass Pollen: MODERATE (Index: 3) ❄️ Out of Season
- Weed Pollen: HIGH (Index: 4) 🌟 In Season

Recommendations:
• Limit outdoor activities if sensitive
• Keep windows closed
• Take allergy medication as prescribed
```

### ⚠️ PARTIAL - Google API Needs Setup
```
📊 Limited Pollen Data
Detailed pollen forecast is not available at the moment.

Current Information Available:
• General pollen level: moderate
• Air quality index: 45
• UV index: 6

[API Setup Information Button]
```

### ❌ ERROR - Need to Debug
```
⚠️ Unable to load pollen data
Error: Network request failed
[Retry Button]
```

## 🛠️ TROUBLESHOOTING

### If You See "Limited Pollen Data":
1. **Google Cloud Console Issue**: Pollen API not enabled
2. **API Key Permissions**: May need broader permissions
3. **Billing**: Google Cloud billing not set up

### If You See Network Errors:
1. **Backend Down**: Check if backend server is running
2. **Authentication**: Test user account may need setup
3. **CORS**: Cross-origin request issues

### If No Environment Section:
1. **Authentication**: Frontend can't get auth token
2. **API Service**: ApiService may have issues
3. **Redux State**: Environment data not loading

## 🔧 QUICK FIXES

### Test Backend Directly:
Visit: http://127.0.0.1:8090/test-pollen

### Check Server Status:
- Backend: http://127.0.0.1:8090/health
- Frontend: http://localhost:8084

### Enable Google Pollen API:
1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Search for "Pollen API"
3. Click "Enable"
4. Ensure billing is set up

## 📋 TESTING CHECKLIST

- [ ] App loads successfully
- [ ] HomeScreen shows environment section
- [ ] Environment data includes pollen count
- [ ] "View Full Pollen Forecast" button works
- [ ] PollenScreen accessible from navigation
- [ ] Pollen data refreshes when pulled down
- [ ] Error messages are helpful if API fails
- [ ] Health recommendations show when data available

## 🎯 SUCCESS CRITERIA

**BASIC SUCCESS**: App shows pollen count and has dedicated pollen page
**FULL SUCCESS**: App shows detailed pollen forecasts with color coding and health tips

---

**💡 TIP**: Even if Google Pollen API isn't working yet, the app should still show basic pollen information and guide you through the setup process!
