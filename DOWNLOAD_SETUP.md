
# Download Functionality Setup Instructions

This implementation provides complete file downloading capabilities for React Native with real-time progress tracking and background download support.

## Required Dependencies

The following packages need to be installed:

```bash
npm install react-native-fs react-native-permissions @react-native-async-storage/async-storage
```

## iOS Setup

### 1. iOS Permissions (ios/YourApp/Info.plist)

Add the following permissions to your `Info.plist`:

```xml
<key>NSPhotoLibraryUsageDescription</key>
<string>This app needs access to save downloaded movies to your device.</string>
<key>NSDocumentsFolderUsageDescription</key>
<string>This app needs access to save downloaded movies to your Documents folder.</string>
<key>UIBackgroundModes</key>
<array>
    <string>background-fetch</string>
    <string>background-processing</string>
</array>
```

### 2. iOS Linking

For React Native 0.60+, run:
```bash
cd ios && pod install
```

## Android Setup

### 1. Android Permissions (android/app/src/main/AndroidManifest.xml)

Add the following permissions:

```xml
<uses-permission android:name="android.permission.INTERNET" />
<uses-permission android:name="android.permission.WRITE_EXTERNAL_STORAGE" />
<uses-permission android:name="android.permission.READ_EXTERNAL_STORAGE" />
<uses-permission android:name="android.permission.DOWNLOAD_WITHOUT_NOTIFICATION" />
<uses-permission android:name="android.permission.WAKE_LOCK" />

<!-- For Android 11+ (API 30+) scoped storage -->
<uses-permission android:name="android.permission.MANAGE_EXTERNAL_STORAGE" tools:ignore="ScopedStorage" />
```

### 2. Android Network Security Config

Create `android/app/src/main/res/xml/network_security_config.xml`:

```xml
<?xml version="1.0" encoding="utf-8"?>
<network-security-config>
    <domain-config cleartextTrafficPermitted="true">
        <domain includeSubdomains="true">archive.org</domain>
    </domain-config>
</network-security-config>
```

Add to `AndroidManifest.xml` application tag:
```xml
<application
    android:networkSecurityConfig="@xml/network_security_config"
    ...>
```

### 3. Android File Provider (android/app/src/main/AndroidManifest.xml)

Add inside the `<application>` tag:

```xml
<provider
    android:name="androidx.core.content.FileProvider"
    android:authorities="${applicationId}.fileprovider"
    android:exported="false"
    android:grantUriPermissions="true">
    <meta-data
        android:name="android.support.FILE_PROVIDER_PATHS"
        android:resource="@xml/file_paths" />
</provider>
```

Create `android/app/src/main/res/xml/file_paths.xml`:

```xml
<?xml version="1.0" encoding="utf-8"?>
<paths xmlns:android="http://schemas.android.com/apk/res/android">
    <external-path name="external_files" path="."/>
    <external-files-path name="external_files" path="Downloads"/>
    <external-cache-path name="external_cache" path="."/>
    <files-path name="files" path="."/>
</paths>
```

## Usage

### Basic Download

```typescript
import { fileDownloadService } from '@/services/fileDownloadService';

const downloadId = await fileDownloadService.startDownload(
  'https://archive.org/download/item-id/filename.mp4?download=1',
  'Movie Name.mp4',
  'Movie Title',
  {
    onProgress: (progress) => {
      console.log(`Download progress: ${progress.progress}%`);
    },
    onComplete: (filePath) => {
      console.log(`Download completed: ${filePath}`);
    },
    onError: (error) => {
      console.error(`Download failed: ${error}`);
    }
  }
);
```

### Progress Tracking

```typescript
const progress = fileDownloadService.getDownloadProgress(downloadId);
console.log(`Status: ${progress?.status}, Progress: ${progress?.progress}%`);
```

### Download Management

```typescript
// Pause download
fileDownloadService.pauseDownload(downloadId);

// Resume download
fileDownloadService.resumeDownload(downloadId);

// Cancel download
fileDownloadService.cancelDownload(downloadId);

// Delete download
fileDownloadService.deleteDownload(downloadId);
```

## Features

- ✅ **Real file downloads** to device storage
- ✅ **Background download support** - continues when app is minimized
- ✅ **Real-time progress tracking** with speed and ETA
- ✅ **Permission handling** for both Android and iOS
- ✅ **Storage space checking** before download
- ✅ **File management** in Downloads folder
- ✅ **Error handling** for network issues and storage problems
- ✅ **Download resumption** support
- ✅ **Scoped storage** support for Android 11+
- ✅ **File visibility** in device file managers

## File Locations

- **Android**: `/storage/emulated/0/Download/`
- **iOS**: `Documents/Downloads/` (accessible via Files app)

## Troubleshooting

### Permission Issues
- Ensure all permissions are properly declared in manifest files
- Test on real devices (simulators may have permission issues)
- Check Android SDK version compatibility

### Download Failures
- Verify network connectivity
- Check if the download URL is accessible
- Ensure sufficient storage space
- Check file permissions

### Background Downloads
- Test on real devices (background execution varies between platforms)
- Ensure battery optimization is disabled for your app on Android
- Background downloads work best with stable internet connections

## Production Considerations

1. **Test thoroughly** on different devices and OS versions
2. **Handle edge cases** like low storage, poor network conditions
3. **Implement retry logic** for failed downloads
4. **Monitor download performance** and optimize as needed
5. **Consider chunked downloads** for very large files
6. **Implement download scheduling** for better user experience
