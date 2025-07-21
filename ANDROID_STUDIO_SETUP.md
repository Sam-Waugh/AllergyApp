# Android Studio Installation Steps

## Download and Install Android Studio

1. **Download Android Studio**
   - Go to: https://developer.android.com/studio
   - Click "Download Android Studio"
   - Choose the Windows version

2. **Run the Installer**
   - Run the downloaded .exe file
   - Choose "Standard" installation
   - Accept all license agreements
   - Let it install Android SDK, Android SDK Platform, and Android Virtual Device

3. **First Launch Setup**
   - Open Android Studio
   - Go through the setup wizard
   - Choose "Standard" setup
   - Select your UI theme
   - Let it download additional components

## Important: Set Environment Variables

After installation, you need to set up environment variables:

### Add to Windows Environment Variables:
1. **Open System Properties** → Advanced → Environment Variables
2. **Add these variables**:
   - `ANDROID_HOME`: `C:\Users\%USERNAME%\AppData\Local\Android\Sdk`
   - `ANDROID_SDK_ROOT`: `C:\Users\%USERNAME%\AppData\Local\Android\Sdk`
3. **Add to PATH**:
   - `%ANDROID_HOME%\platform-tools`
   - `%ANDROID_HOME%\emulator`
   - `%ANDROID_HOME%\tools`

### Or use PowerShell (easier):
```powershell
# Run these commands in PowerShell as Administrator
[Environment]::SetEnvironmentVariable("ANDROID_HOME", "$env:LOCALAPPDATA\Android\Sdk", "User")
[Environment]::SetEnvironmentVariable("ANDROID_SDK_ROOT", "$env:LOCALAPPDATA\Android\Sdk", "User")

# Add to PATH
$currentPath = [Environment]::GetEnvironmentVariable("PATH", "User")
$newPath = "$currentPath;$env:LOCALAPPDATA\Android\Sdk\platform-tools;$env:LOCALAPPDATA\Android\Sdk\emulator;$env:LOCALAPPDATA\Android\Sdk\tools"
[Environment]::SetEnvironmentVariable("PATH", $newPath, "User")
```

## Next: Create Virtual Device

After Android Studio is installed, come back for the next steps!
