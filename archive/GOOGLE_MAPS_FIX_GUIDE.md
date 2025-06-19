# 🔧 Google Maps API Fix Guide

## Current Issue: "Google Maps unavailable" 

Your interactive map is working perfectly, but Google Maps images aren't loading due to API configuration. Here's how to fix it:

## 🎯 **MOST LIKELY CAUSE: Billing Not Enabled**

Google Maps API requires billing to be enabled, even for free tier usage.

## ✅ **Quick Fix Steps:**

### Step 1: Enable Billing (Required!)
1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Select your project
3. Go to **Billing** in the left sidebar
4. Click **Link a billing account** or **Set up billing**
5. Add a valid credit/debit card
6. **Note:** Google provides $200 free credit monthly - you won't be charged for normal usage

### Step 2: Enable Maps Static API
1. In Google Cloud Console, go to **APIs & Services** > **Library**
2. Search for "Maps Static API"
3. Click on it and press **Enable**

### Step 3: Create/Update API Key
1. Go to **APIs & Services** > **Credentials** 
2. If you don't have an API key:
   - Click **Create Credentials** > **API Key**
3. If you have an API key:
   - Click on your existing API key to edit it
4. Under **API restrictions**:
   - Select "Restrict key"
   - Choose "Maps Static API"
5. Copy your API key

### Step 4: Update Your App
1. Open your `.env` file in the frontend folder
2. Update the API key:
   ```
   EXPO_PUBLIC_GOOGLE_MAPS_API_KEY=your_new_api_key_here
   ```
3. Save the file

### Step 5: Restart Your App
```bash
# Stop the current server (Ctrl+C) then restart:
npx expo start --clear --port 8084
```

## 🧪 **Test Your Fix:**

1. Wait 5-10 minutes after making changes (Google needs time to propagate)
2. Open your app: http://localhost:8084
3. Navigate to the Pollen tab
4. You should now see actual map imagery instead of the fallback

## 🔍 **Alternative Testing:**

Use this URL to test your API key directly (replace YOUR_API_KEY):
```
https://maps.googleapis.com/maps/api/staticmap?center=54.666194,-5.680421&zoom=11&size=400x200&key=YOUR_API_KEY
```

If this loads a map image in your browser, your API key is working.

## 💡 **If You Don't Want to Set Up Billing:**

Your app works perfectly without Google Maps images! The current fallback UI provides:
- ✅ Professional appearance
- ✅ All interactive features
- ✅ Location and pollen information
- ✅ Full functionality

## 🆘 **Still Having Issues?**

Common problems and solutions:

### Error: "API key invalid"
- Regenerate your API key in Google Cloud Console
- Make sure there are no spaces in the .env file

### Error: "REQUEST_DENIED" 
- Enable billing on your Google Cloud project
- Enable Maps Static API

### Error: "OVER_QUERY_LIMIT"
- You've exceeded the free quota (unlikely for personal use)
- Check quotas in Google Cloud Console

### Error: "API key restrictions"
- Remove all restrictions from your API key temporarily
- Test with an unrestricted key first

## 📞 **Need Help?**

1. Check the [Google Maps Platform Documentation](https://developers.google.com/maps/documentation/maps-static)
2. Verify your Google Cloud Console setup
3. Make sure billing is enabled (this is the #1 cause of failures)

## 🎉 **Expected Result:**

After following these steps, you should see beautiful Google Maps imagery in your Pollen screen showing your exact location in Bangor, Northern Ireland with pollen data overlays!
