# Project Structure

## 📁 Directory Overview

```
AllergyApp/
├── backend/                 # FastAPI backend server
│   ├── app/                # (empty - reserved for future modules)
│   ├── crud/               # Database CRUD operations
│   ├── database/           # Database configuration and models
│   ├── models/             # SQLAlchemy models
│   ├── routers/            # API route handlers
│   ├── schemas/            # Pydantic schemas
│   ├── utils/              # Utility functions
│   ├── uploads/            # File upload directory
│   ├── venv/               # Python virtual environment
│   ├── main.py             # FastAPI application entry point
│   ├── requirements.txt    # Python dependencies
│   └── .env                # Backend environment variables
│
├── frontend/               # React Native (Expo) frontend
│   ├── src/                # Source code
│   │   ├── components/     # Reusable UI components
│   │   ├── config/         # Configuration files
│   │   ├── models/         # TypeScript type definitions
│   │   ├── navigation/     # Navigation setup
│   │   ├── screens/        # App screens/pages
│   │   ├── services/       # API services
│   │   ├── store/          # State management
│   │   └── utils/          # Utility functions
│   ├── assets/             # Static assets (images, fonts)
│   ├── __tests__/          # Test files
│   ├── App.tsx             # Main app component
│   ├── app.json           # Expo configuration
│   ├── package.json       # Node.js dependencies
│   ├── tsconfig.json      # TypeScript configuration
│   └── .env               # Frontend environment variables
│
├── archive/               # Archived development files
├── .vscode/              # VS Code workspace settings
├── README.md             # Main project documentation
├── API_KEY_SETUP_GUIDE.md # API key setup instructions
├── APP_TESTING_GUIDE.md  # Testing documentation
└── AllergyApp.code-workspace # VS Code workspace file
```

## 🔧 Key Components

### Backend (FastAPI)
- **Main entry**: `backend/main.py`
- **API routes**: `backend/routers/`
  - `auth.py` - Authentication endpoints
  - `environment.py` - Environmental data (pollen, weather)
  - `logs.py` - Logging endpoints
  - `photos.py` - Photo upload/management
  - `profiles.py` - User profile management
  - `research.py` - Research data endpoints

### Frontend (React Native + Expo)
- **Main entry**: `frontend/App.tsx`
- **Navigation**: `frontend/src/navigation/`
- **Screens**: `frontend/src/screens/`
- **Components**: `frontend/src/components/`
- **Services**: `frontend/src/services/` (API communication)

## 🚀 Development Commands

Available VS Code tasks:
- **Backend: Install Dependencies** - Install Python packages
- **Backend: Start Development Server** - Run FastAPI server (port 8090)
- **Frontend: Install Dependencies** - Install Node.js packages
- **Frontend: Start Expo Server** - Run Expo development server (port 8084)
- **Frontend: TypeScript Check** - Validate TypeScript code
- **Backend: Run Tests** - Execute Python tests

## 📝 Environment Setup
See `README.md` and `API_KEY_SETUP_GUIDE.md` for complete setup instructions.
