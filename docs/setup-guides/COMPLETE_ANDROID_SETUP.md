# Android Emulator Setup - Complete Guide

## 📋 Prerequisites ✅
- ✅ Java is installed (OpenJDK 11.0.16.1)
- ✅ Your Expo app is running on http://localhost:8081
- ⏳ Android Studio (need to install)

## 🚀 Step-by-Step Setup

### Step 1: Install Android Studio (15-20 minutes)

#### A. Download
1. **Open**: https://developer.android.com/studio
2. **Download**: "Android Studio Giraffe" or latest version
3. **Size**: ~1GB, be patient

#### B. Install
1. **Run** the .exe file as Administrator
2. **Choose**: "Standard" installation (recommended)
3. **Accept** all license agreements
4. **Components to install**:
   - Android SDK
   - Android SDK Platform
   - Android Virtual Device (AVD)
   - Intel HAXM (for faster emulation)

#### C. First Launch Setup
1. **Start Android Studio**
2. **Setup Wizard**: Choose "Standard"
3. **UI Theme**: Pick your preference
4. **SDK Components**: Let it download (~2-3GB)

### Step 2: Set Environment Variables

After Android Studio is installed, run these PowerShell commands **as Administrator**:

```powershell
# Set ANDROID_HOME
[Environment]::SetEnvironmentVariable("ANDROID_HOME", "$env:LOCALAPPDATA\Android\Sdk", "User")
[Environment]::SetEnvironmentVariable("ANDROID_SDK_ROOT", "$env:LOCALAPPDATA\Android\Sdk", "User")

# Add to PATH
$currentPath = [Environment]::GetEnvironmentVariable("PATH", "User")
$androidPaths = ";$env:LOCALAPPDATA\Android\Sdk\platform-tools;$env:LOCALAPPDATA\Android\Sdk\emulator"
[Environment]::SetEnvironmentVariable("PATH", "$currentPath$androidPaths", "User")

# Restart VS Code after this
```

### Step 3: Create Virtual Device

#### A. Open AVD Manager
1. **In Android Studio**: Tools → AVD Manager
2. **Or**: Welcome Screen → More Actions → Virtual Device Manager

#### B. Create Device
1. **Click**: "Create Virtual Device"
2. **Choose Phone**: Pixel 7 or Pixel 6 (recommended)
3. **Click**: "Next"

#### C. Select System Image
1. **Choose**: API Level 30+ (Android 11+)
2. **Recommended**: API 33 (Android 13) with Google Play
3. **Download** if not already downloaded
4. **Click**: "Next"

#### D. Configure AVD
1. **AVD Name**: "Allergy_App_Test"
2. **Startup Orientation**: Portrait
3. **Advanced Settings** (optional):
   - RAM: 4GB (if your laptop has 8GB+ RAM)
   - Internal Storage: 8GB
   - SD Card: 512MB
4. **Click**: "Finish"

### Step 4: Test the Emulator

#### A. Start Emulator
1. **In AVD Manager**: Click ▶️ next to your device
2. **Wait**: 2-3 minutes for first boot
3. **Success**: You'll see Android home screen

#### B. Connect to Your App
1. **In VS Code terminal** (where Expo is running)
2. **Press**: 'a' (for Android)
3. **Or run**: 
   ```bash
   npx expo run:android
   ```

### Step 5: Verify Everything Works

Once emulator is running and your app is installed:
1. **Test navigation** between tabs
2. **Test the Daily Log** screen refresh functionality
3. **Test Firebase** connectivity
4. **Check console logs** for any errors

## 🔧 Troubleshooting

### If emulator won't start:
```powershell
# Enable Hyper-V (run as Administrator)
Enable-WindowsOptionalFeature -Online -FeatureName Microsoft-Hyper-V -All

# Or enable HAXM
# Download from: https://github.com/intel/haxm/releases
```

### If Expo can't connect to emulator:
```bash
# In VS Code terminal
adb devices
# Should show your emulator

# If not connected:
adb kill-server
adb start-server
```

### If app won't install:
```bash
# Clear Expo cache
npx expo start -c

# Or reinstall Expo CLI
npm uninstall -g expo-cli
npm install -g @expo/cli
```

## ⏱️ Estimated Time
- **Download**: 10-15 minutes
- **Installation**: 15-20 minutes  
- **Setup**: 10 minutes
- **First emulator boot**: 5 minutes
- **Total**: ~45-60 minutes

## 🎯 What You'll Get
- ✅ Full Android environment
- ✅ Real device testing
- ✅ Hot reload development
- ✅ Native features working
- ✅ Firebase integration testing
- ✅ Debug tools access

---

**Let me know when you've completed each step and I'll help with the next one!**
