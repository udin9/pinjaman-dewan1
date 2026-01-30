# Firebase Google Sign-In Setup Guide

## 🔍 Debugging Checklist

### 1. **Firebase Console Configuration**
Pastikan di Firebase Console sudah setting:
- ✅ Enable Google Authentication di Authentication > Sign-in method
- ✅ Add authorized redirect URIs di Authentication > Settings:
  ```
  http://localhost:8000
  http://localhost
  ```

### 2. **Browser Console Checks**
Buka Developer Tools (F12) dan check:
- ✅ Cek apakah `Firebase initialized successfully` muncul di console
- ✅ Cek apakah `Google Sign-In button initialized` muncul
- ✅ Klik button dan lihat error yang muncul

### 3. **Common Errors & Solutions**

#### Error: `auth is not defined`
- ❌ Firebase SDK tidak load
- ✅ Solusi: Buat sure `<script src="https://www.gstatic.com/firebasejs/..."></script>` loaded sebelum script.js

#### Error: `GoogleAuthProvider is not defined`
- ❌ Firebase Auth module tidak load
- ✅ Solusi: Ensure `firebase-auth.js` SDK included

#### Error: `CONFIGURATION_NOT_FOUND`
- ❌ Authorized redirect URIs tidak match
- ✅ Solusi: Add `http://localhost:8000` ke Firebase Console

#### Popup blocked
- ❌ Browser blocking popup
- ✅ Solusi: Allow popups untuk domain ini

### 4. **Test Steps**
1. Refresh page (Ctrl+Shift+R)
2. Open Developer Console (F12)
3. Click "Log Masuk dengan Google" button
4. Check console untuk logs

### 5. **Current Setup**
- **Firebase Config**: ✅ Added
- **Google Sign-In Button**: ✅ Added
- **Auth State Listener**: ✅ Added
- **Logout Handler**: ✅ Updated

## 📝 Files Modified
- `index.html` - Added Firebase SDK + initialization
- `script.js` - Added Google Sign-In handler + auth state listener
