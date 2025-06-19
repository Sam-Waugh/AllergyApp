import requests
import json

# Create test user
print('🔐 Creating test user...')
user_data = {'email': 'test@allergyapp.com', 'password': 'testpassword123', 'full_name': 'Test User'}
try:
    r = requests.post('http://127.0.0.1:8090/api/v1/auth/register', json=user_data)
    print(f'Register status: {r.status_code}')
    if r.status_code == 400:
        print('✅ User might already exist - continuing...')
    elif r.status_code == 200:
        print('✅ User created successfully')
except Exception as e:
    print(f'❌ Register error: {e}')

# Get token
print('🔑 Getting authentication token...')
token_data = {'username': 'test@allergyapp.com', 'password': 'testpassword123'}
try:
    r = requests.post('http://127.0.0.1:8090/api/v1/auth/token', data=token_data)
    print(f'Token status: {r.status_code}')
    if r.status_code == 200:
        token_response = r.json()
        token = token_response['access_token']
        print(f'✅ Token obtained: {token[:20]}...')
        
        # Test environment API
        print('🌿 Testing environment API...')
        headers = {'Authorization': f'Bearer {token}'}
        params = {'lat': 40.7128, 'lon': -74.0060, 'include_heatmap': True}
        r = requests.get('http://127.0.0.1:8090/api/v1/environment/current', params=params, headers=headers)
        print(f'Environment API status: {r.status_code}')
        
        if r.status_code == 200:
            data = r.json()
            print(f'✅ API working! Location: {data.get("location", "Unknown")}')
            print(f'🌡️ Temperature: {data.get("temperature", "N/A")}°C')
            print(f'🌾 Legacy pollen: {data.get("pollen_count", "N/A")}')
            
            # Check for enhanced pollen data
            has_pollen_data = "daily_pollen_info" in data
            print(f'🔍 Enhanced pollen data present: {has_pollen_data}')
            
            if has_pollen_data and data["daily_pollen_info"]:
                pollen_days = len(data["daily_pollen_info"])
                print(f'📅 Pollen forecast days: {pollen_days}')
                
                if data["daily_pollen_info"][0].get("pollen_types"):
                    pollen_types = len(data["daily_pollen_info"][0]["pollen_types"])
                    print(f'🌿 Pollen types today: {pollen_types}')
                    
                    # Show first pollen type as example
                    first_pollen = data["daily_pollen_info"][0]["pollen_types"][0]
                    print(f'📊 Example: {first_pollen.get("display_name", "Unknown")} - {first_pollen.get("category", "Unknown")}')
            
            # Save token for frontend use
            print(f'\n🔐 Use this token in your frontend: {token}')
            
        else:
            print(f'❌ Environment API error: {r.text}')
    else:
        print(f'❌ Token error: {r.text}')
except Exception as e:
    print(f'❌ Token error: {e}')

print('\n✅ Test complete!')
