# Google Cloud Console Setup Guide for Allergy App

## Current Status
✅ **API Key**: `YOUR_API_KEY_HERE`  
✅ **Code Implementation**: Complete with fallback UI  
❌ **Google Cloud Configuration**: Needs setup for billing and API enablement  

## Step-by-Step Setup Instructions

### 1. Access Google Cloud Console
1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Sign in with your Google account
3. Select your project (or create a new one if needed)

### 2. Enable Billing (REQUIRED - Even for Free Tier)
🚨 **CRITICAL**: Google Maps API requires billing to be enabled, even for free usage under the $200 monthly credit.

1. Navigate to **Billing** in the left sidebar
2. Click **"Link a billing account"** or **"Enable billing"**
3. Add a valid payment method (credit card)
4. Don't worry - you get $200 free credits monthly, which is more than enough for development

### 3. Enable Required APIs
Navigate to **APIs & Services > Library** and enable these APIs:

#### Required APIs:
- ✅ **Maps Static API** (Primary requirement)
- ✅ **Maps JavaScript API** (For advanced features)
- ✅ **Places API** (For location search)
- ✅ **Geocoding API** (For address/coordinate conversion)

#### How to Enable:
1. Search for "Maps Static API"
2. Click on it
3. Click **"Enable"**
4. Repeat for other APIs

### 4. Configure API Key Restrictions (Security)
1. Go to **APIs & Services > Credentials**
2. Find your API key: `YOUR_API_KEY_HERE`
3. Click the edit/pencil icon
4. Under **API restrictions**, select **"Restrict key"**
5. Check these APIs:
   - Maps Static API
   - Maps JavaScript API
   - Places API
   - Geocoding API

### 5. Set Application Restrictions (Optional but Recommended)
For development, you can restrict by:
- **HTTP referrers**: Add `localhost:*`, `127.0.0.1:*`, `192.168.*:*`
- **IP addresses**: Add your development IPs

### 6. Test Your Configuration

#### Option A: Use Our Diagnostic Tool
Open: `file:///c:/Users/sam_w/OneDrive/Documents/AllergyApp/QUICK_API_KEY_TEST.html`

#### Option B: Direct URL Test
Replace `YOUR_API_KEY` with your key and test in browser:
```
https://maps.googleapis.com/maps/api/staticmap?center=40.7128,-74.0060&zoom=13&size=400x300&maptype=roadmap&markers=color:red|40.7128,-74.0060&key=YOUR_API_KEY
```

### 7. Common Error Solutions

#### "This API project is not authorized to use this API"
- ✅ Enable Maps Static API in APIs & Services > Library

#### "API key not valid"
- ✅ Check API key restrictions
- ✅ Ensure billing is enabled
- ✅ Wait 5-10 minutes for changes to propagate

#### "REQUEST_DENIED"
- ✅ Enable billing account
- ✅ Check API quotas and limits

#### "OVER_QUERY_LIMIT"
- ✅ Check API quotas in APIs & Services > Quotas
- ✅ Enable billing for higher limits

### 8. Verify App Functionality
After setup, test your Allergy App:

1. Run the app: `npm start` (in frontend directory)
2. Navigate to the Pollen screen
3. Check if maps load properly
4. If still showing fallback UI, check browser console for errors

### 9. Production Considerations

#### API Key Security:
- Never commit API keys to public repositories
- Use environment variables (already configured in `.env`)
- Implement API key rotation policy

#### Quotas & Billing:
- Monitor usage in Google Cloud Console
- Set up billing alerts
- Consider implementing client-side caching

#### Performance:
- Use appropriate image sizes
- Implement map tile caching
- Consider Progressive Web App (PWA) features

## Quick Verification Checklist

- [ ] Google Cloud project created/selected
- [ ] Billing enabled with valid payment method
- [ ] Maps Static API enabled
- [ ] API key restrictions configured
- [ ] Test URL returns map image (not error)
- [ ] Allergy App displays maps (not fallback UI)
- [ ] No console errors in browser developer tools

## Support Resources

- [Google Maps Platform Documentation](https://developers.google.com/maps/documentation)
- [Google Cloud Console](https://console.cloud.google.com/)
- [API Key Best Practices](https://developers.google.com/maps/api-key-best-practices)
- [Billing FAQ](https://cloud.google.com/billing/docs/how-to/billing-faq)

## Next Steps After Setup

1. **Test the diagnostic tool** to confirm API is working
2. **Run your Allergy App** to see maps instead of fallback UI
3. **Monitor usage** in Google Cloud Console
4. **Implement additional map features** (markers, overlays, etc.)

---

**Need Help?** 
- Check the browser console for specific error messages
- Use the diagnostic HTML tools in your project directory
- Verify each step in Google Cloud Console
