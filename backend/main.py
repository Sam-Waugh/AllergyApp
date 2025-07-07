from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import HTMLResponse
import os
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

from routers import logs, photos, profiles, environment, research, auth, children
from database.database import engine
from models.models import Base

# Create database tables
Base.metadata.create_all(bind=engine)

app = FastAPI(
    title="Allergy App API",
    description="API for tracking allergies, eczema, asthma, and related health conditions",
    version="1.0.0"
)

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # In production, specify exact origins
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Static files for photo uploads
if not os.path.exists("uploads"):
    os.makedirs("uploads")
app.mount("/uploads", StaticFiles(directory="uploads"), name="uploads")

# Include routers
app.include_router(auth.router, prefix="/api/v1/auth", tags=["authentication"])
app.include_router(children.router, prefix="/api/v1", tags=["children"])
app.include_router(logs.router, prefix="/api/v1/logs", tags=["logs"])
app.include_router(photos.router, prefix="/api/v1/photos", tags=["photos"])
app.include_router(profiles.router, prefix="/api/v1/profiles", tags=["profiles"])
app.include_router(environment.router, prefix="/api/v1/environment", tags=["environment"])
app.include_router(research.router, prefix="/api/v1/research", tags=["research"])

@app.get("/")
def read_root():
    return {"message": "Allergy App API - Health tracking for children"}

@app.get("/health")
def health_check():
    return {"status": "healthy", "message": "Allergy App API is running"}

# Debug endpoint to test environment functionality step by step
@app.get("/api/v1/debug/environment-test")
def debug_environment_test():
    """Debug endpoint to test environment functionality"""
    try:
        import os
        from routers.environment import GOOGLE_MAPS_API_KEY
        
        result = {
            "status": "testing",
            "checks": {
                "api_key_present": bool(GOOGLE_MAPS_API_KEY),
                "api_key_starts_with": GOOGLE_MAPS_API_KEY[:10] + "..." if GOOGLE_MAPS_API_KEY else None,
            }
        }
        
        # Test schema import
        try:
            from schemas.schemas import EnvironmentDataResponse
            result["checks"]["schema_import"] = "success"
            
            # Test simple response creation
            test_data = {
                "location": "Debug Test",
                "latitude": 40.7128,
                "longitude": -74.0060,
                "weather_conditions": "sunny",
                "temperature": 20.0,
                "humidity": 50.0,
                "air_quality_index": 30,
                "pollen_count": "low",
                "uv_index": 5
            }
            
            response = EnvironmentDataResponse(**test_data)
            result["checks"]["response_creation"] = "success"
            result["checks"]["sample_location"] = response.location
            
        except Exception as e:
            result["checks"]["schema_import"] = f"failed: {str(e)}"
        
        result["status"] = "completed"
        return result
        
    except Exception as e:
        return {
            "status": "error",
            "error": str(e),
            "type": type(e).__name__
        }

@app.get("/test-pollen", response_class=HTMLResponse)
def test_pollen_page():
    """Serve a test page for Google Pollen API testing"""
    # Get API key from environment
    from routers.environment import GOOGLE_MAPS_API_KEY
    api_key = GOOGLE_MAPS_API_KEY or ""
    
    html_content = '''
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Google Pollen API Test</title>
    <style>
        body { font-family: Arial, sans-serif; max-width: 800px; margin: 0 auto; padding: 20px; }
        .card { background: white; border: 1px solid #ddd; border-radius: 8px; padding: 20px; margin: 16px 0; box-shadow: 0 2px 4px rgba(0,0,0,0.1); }
        .success { background-color: #d4edda; border-color: #c3e6cb; color: #155724; }
        .error { background-color: #f8d7da; border-color: #f5c6cb; color: #721c24; }
        .warning { background-color: #fff3cd; border-color: #ffeaa7; color: #856404; }
        button { background: #007bff; color: white; border: none; padding: 12px 24px; border-radius: 4px; cursor: pointer; margin: 8px 8px 8px 0; }
        button:hover { background: #0056b3; }
        .status { padding: 12px; border-radius: 4px; margin: 8px 0; }
        pre { background: #f8f9fa; padding: 12px; border-radius: 4px; overflow-x: auto; }
        .loading { color: #6c757d; }
    </style>
</head>
<body>
    <h1>🌸 Google Pollen API Test</h1>
    
    <div class="card">
        <h2>API Key Status</h2>
        <p><strong>API Key:</strong> <span id="api-key-status">Checking...</span></p>
        <p><strong>Backend Status:</strong> <span id="backend-status">Checking...</span></p>
    </div>

    <div class="card">
        <h2>Direct Google API Test</h2>
        <p>Test your Google Pollen API key directly:</p>
        <button onclick="testDirectAPI()">Test Direct Google API</button>
        <div id="direct-result"></div>
    </div>

    <div class="card">
        <h2>Backend Integration Test</h2>
        <p>Test the pollen API through your backend:</p>
        <button onclick="testBackendAPI()">Test Backend Integration</button>
        <div id="backend-result"></div>
    </div>

    <div class="card">
        <h2>Setup Information</h2>
        <p>If the API tests fail, you may need to:</p>
        <ol>
            <li>Enable the <strong>Pollen API</strong> in Google Cloud Console</li>
            <li>Ensure billing is enabled for your Google Cloud project</li>
            <li>Verify your API key has the correct permissions</li>
            <li>Check that your API key isn't restricted to specific domains</li>
        </ol>
        <p><a href="https://developers.google.com/maps/documentation/pollen/get-api-key" target="_blank">📖 Google Pollen API Setup Guide</a></p>
    </div>

    <script>
        const API_KEY = '''' + api_key + '''';
        
        // Check initial status
        document.addEventListener('DOMContentLoaded', function() {
            document.getElementById('api-key-status').textContent = API_KEY ? (API_KEY.substring(0, 20) + '...') : 'Not configured';
            document.getElementById('backend-status').textContent = '✅ Connected (you can see this page)';
        });

        async function testDirectAPI() {
            const resultDiv = document.getElementById('direct-result');
            
            if (!API_KEY) {
                resultDiv.innerHTML = '<div class="status error">❌ API Key not configured in environment variables</div>';
                return;
            }
            
            resultDiv.innerHTML = '<div class="status loading">🔄 Testing Google Pollen API...</div>';

            try {
                const url = 'https://pollen.googleapis.com/v1/forecast:lookup';
                const params = new URLSearchParams({
                    'key': API_KEY,
                    'location.latitude': '40.7128',
                    'location.longitude': '-74.0060',
                    'days': '1'
                });

                const response = await fetch(`${url}?${params}`);
                
                if (response.ok) {
                    const data = await response.json();
                    let resultHtml = '<div class="status success">✅ Google Pollen API is working!</div>';
                    
                    if (data.dailyInfo && data.dailyInfo.length > 0) {
                        const today = data.dailyInfo[0];
                        resultHtml += '<h4>Today\\'s Pollen Data:</h4>';
                        
                        if (today.pollenTypeInfo && today.pollenTypeInfo.length > 0) {
                            today.pollenTypeInfo.forEach(pollen => {
                                const category = pollen.indexInfo ? pollen.indexInfo.category : 'Unknown';
                                const value = pollen.indexInfo ? pollen.indexInfo.value : 0;
                                resultHtml += `<p><strong>${pollen.displayName}:</strong> ${category} (${value})</p>`;
                            });
                        } else {
                            resultHtml += '<p>No pollen type information available</p>';
                        }
                    } else {
                        resultHtml += '<p>No daily pollen information available</p>';
                    }
                    
                    resultHtml += '<details><summary>View Raw Response</summary><pre>' + JSON.stringify(data, null, 2) + '</pre></details>';
                    resultDiv.innerHTML = resultHtml;
                    
                } else if (response.status === 403) {
                    resultDiv.innerHTML = '<div class="status error">❌ API Key Error (403 Forbidden)<br>The Pollen API may not be enabled for your project or your API key may not have the right permissions.</div>';
                } else {
                    const errorText = await response.text();
                    resultDiv.innerHTML = `<div class="status error">❌ API Error (${response.status})<br>${errorText}</div>`;
                }
            } catch (error) {
                resultDiv.innerHTML = `<div class="status error">❌ Network Error: ${error.message}</div>`;
            }
        }

        async function testBackendAPI() {
            const resultDiv = document.getElementById('backend-result');
            resultDiv.innerHTML = '<div class="status loading">🔄 Testing backend integration...</div>';

            try {
                // First get auth token
                const authResponse = await fetch('/api/v1/auth/token', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
                    body: 'username=test@allergyapp.com&password=testpassword123'
                });

                if (!authResponse.ok) {
                    resultDiv.innerHTML = '<div class="status error">❌ Authentication failed</div>';
                    return;
                }

                const authData = await authResponse.json();
                const token = authData.access_token;

                // Test environment endpoint
                const envResponse = await fetch('/api/v1/environment/New York', {
                    headers: { 'Authorization': `Bearer ${token}` }
                });

                if (envResponse.ok) {
                    const envData = await envResponse.json();
                    let resultHtml = '<div class="status success">✅ Backend integration working!</div>';
                    
                    resultHtml += `<p><strong>Location:</strong> ${envData.location}</p>`;
                    resultHtml += `<p><strong>Pollen Count:</strong> ${envData.pollen_count}</p>`;
                    
                    if (envData.daily_pollen_info && envData.daily_pollen_info.length > 0) {
                        resultHtml += '<p>✅ Real pollen data available!</p>';
                    } else {
                        resultHtml += '<p>⚠️ Using mock data (Google API may need setup)</p>';
                    }
                    
                    resultHtml += '<details><summary>View Full Response</summary><pre>' + JSON.stringify(envData, null, 2) + '</pre></details>';
                    resultDiv.innerHTML = resultHtml;
                } else {
                    resultDiv.innerHTML = `<div class="status error">❌ Backend API Error (${envResponse.status})</div>`;
                }
            } catch (error) {
                resultDiv.innerHTML = `<div class="status error">❌ Backend Error: ${error.message}</div>`;
            }
        }
    </script>
</body>
</html>    '''
    return HTMLResponse(content=html_content)

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8080)
