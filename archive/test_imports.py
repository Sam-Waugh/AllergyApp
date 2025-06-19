#!/usr/bin/env python3
"""
Test file to verify Python environment and imports
Run this to test if your virtual environment is working
"""

try:
    import fastapi
    print("✅ FastAPI imported successfully")
    print(f"   Version: {fastapi.__version__}")
    print(f"   Location: {fastapi.__file__}")
except ImportError as e:
    print("❌ FastAPI import failed:", e)

try:
    import sqlalchemy
    print("✅ SQLAlchemy imported successfully")
    print(f"   Version: {sqlalchemy.__version__}")
except ImportError as e:
    print("❌ SQLAlchemy import failed:", e)

try:
    import jose
    print("✅ python-jose imported successfully")
    print(f"   Location: {jose.__file__}")
except ImportError as e:
    print("❌ python-jose import failed:", e)

try:
    import passlib
    print("✅ passlib imported successfully")
    print(f"   Location: {passlib.__file__}")
except ImportError as e:
    print("❌ passlib import failed:", e)

try:
    import uvicorn
    print("✅ uvicorn imported successfully")
    print(f"   Version: {uvicorn.__version__}")
except ImportError as e:
    print("❌ uvicorn import failed:", e)

import sys
print(f"\n🐍 Python executable: {sys.executable}")
print(f"🐍 Python version: {sys.version}")
print(f"📦 Python path: {sys.path[:3]}...")  # Show first 3 paths
