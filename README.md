# Allergy App

A comprehensive allergy tracking and management application built with React Native (Expo) frontend and FastAPI backend.

## 🔐 Security First

**This project requires API key setup before running.** All hardcoded API keys have been removed for security.

👉 **[See API Key Setup Guide](./API_KEY_SETUP_GUIDE.md)** for complete setup instructions.

## 🚀 Quick Start

### Prerequisites
- Node.js 18+
- Python 3.8+
- Google Cloud API keys (see setup guide)

### 1. Environment Setup

Create environment files:

**Frontend (.env):**
```bash
EXPO_PUBLIC_GOOGLE_MAPS_API_KEY=your_api_key_here
EXPO_PUBLIC_API_URL=http://localhost:8090
EXPO_PUBLIC_API_BASE_URL=http://127.0.0.1:8090
EXPO_PUBLIC_ENV=development
```

**Backend (.env):**
```bash
GOOGLE_MAPS_API_KEY=your_api_key_here
DATABASE_URL=your_database_url
SECRET_KEY=your_secret_key
```

### 2. Backend Setup

```bash
cd backend
python -m venv venv
# Windows:
venv\Scripts\activate
# macOS/Linux:  
source venv/bin/activate

pip install -r requirements.txt
uvicorn main:app --host 0.0.0.0 --port 8090 --reload
```

### 3. Frontend Setup

```bash
cd frontend
npm install
npm start
```

## 📱 Features

- **PDF Generation**: Cross-platform doctor reports (web + mobile)
- **Pollen Tracking**: Real-time pollen data and maps  
- **Allergy Management**: Track symptoms, medications, and triggers
- **Location Services**: GPS-based environmental data
- **User Authentication**: Secure login and data management

## 🛠️ Tech Stack

### Frontend
- React Native with Expo
- TypeScript
- React Navigation
- Redux Toolkit
- Expo Print & Sharing (mobile PDF)
- jsPDF & html2canvas (web PDF)

### Backend  
- FastAPI (Python)
- SQLAlchemy ORM
- JWT Authentication
- Google Pollen API integration
- Google Maps API integration

## 🏗️ Architecture

See `PROJECT_STRUCTURE.md` for detailed project organization.

**Key Directories:**
- `frontend/` - React Native (Expo) mobile app
- `backend/` - FastAPI Python server  
- `archive/` - Development files and deprecated code

## 🔧 Development

### Available Scripts

**Frontend:**
- `npm start` - Start Expo development server
- `npm run web` - Run on web browser
- `npm run android` - Run on Android
- `npm run ios` - Run on iOS

**Backend:**
- `uvicorn main:app --reload` - Start development server
- `pytest` - Run tests

### VS Code Tasks

Use the integrated tasks for development:
- **Backend: Install Dependencies**
- **Backend: Start Development Server** 
- **Frontend: Install Dependencies**
- **Frontend: Start Expo Server**

## 🔒 Security Features

- ✅ No hardcoded API keys in source code
- ✅ Environment variable configuration
- ✅ Comprehensive .gitignore patterns
- ✅ Secure JWT authentication
- ✅ API key validation and error handling

## 📋 API Endpoints

### Authentication
- `POST /api/v1/auth/token` - Get access token
- `POST /api/v1/auth/register` - Register new user

### Environment Data
- `GET /api/v1/environment/{location}` - Get pollen and weather data
- `GET /api/v1/debug/test-api` - Test API connectivity

### Health
- `GET /health` - Server health check
- `GET /test-pollen` - Interactive API testing page

## 🧪 Testing

Test files use `YOUR_API_KEY_HERE` placeholders. For local testing:

1. Replace placeholders with your API key
2. **Don't commit these changes**
3. Use for development only

## 🚀 Deployment

### Environment Variables Required

**Production Frontend:**
```bash
EXPO_PUBLIC_GOOGLE_MAPS_API_KEY=production_key
EXPO_PUBLIC_API_URL=https://your-api-domain.com  
EXPO_PUBLIC_ENV=production
```

**Production Backend:**
```bash
GOOGLE_MAPS_API_KEY=production_key
DATABASE_URL=production_database_url
SECRET_KEY=secure_random_key
```

### Security Checklist
- [ ] API keys configured in environment
- [ ] Database secured with authentication
- [ ] HTTPS enabled for production
- [ ] API rate limiting configured
- [ ] Error logging set up

## 🐛 Troubleshooting

**"API key not configured"**
- Check .env file exists and has correct variable names
- Restart development server after changing .env

**"Failed to resolve module jspdf"**  
- This is fixed - web version uses CDN loading
- Clear Metro cache: `npx expo start --clear`

**"403 Forbidden" from Google APIs**
- Enable required APIs in Google Cloud Console
- Check API key restrictions
- Verify billing is enabled

## 📄 License

This project is for educational/development purposes. Ensure proper licensing for production use.

## 🤝 Contributing

1. Fork the repository
2. Create feature branch
3. **Never commit API keys**
4. Submit pull request

---

⚠️ **Security Reminder**: This project requires proper API key setup. See [API_KEY_SETUP_GUIDE.md](./API_KEY_SETUP_GUIDE.md) for complete instructions.
