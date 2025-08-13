# Firebase Troubleshooting Guide for NaYa Market

## Common Issues and Solutions

### 1. Data Not Saving to Database

**Problem**: You fill out the form and submit, but data doesn't appear in Firebase.

**Possible Causes**:
- Firebase security rules are too restrictive
- Firebase configuration is incorrect
- JavaScript errors preventing form submission
- Network connectivity issues

**Solutions**:

#### A. Check Firebase Console
1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Select your project: `naya-market-60190`
3. Check if the project is active and billing is set up

#### B. Check Firestore Security Rules
1. In Firebase Console, go to Firestore Database → Rules
2. Your current rules might be too restrictive
3. **Temporary test rules** (for development only):
```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /{document=**} {
      allow read, write: if true;  // WARNING: This allows anyone to read/write
    }
  }
}
```

#### C. Check Storage Security Rules
1. In Firebase Console, go to Storage → Rules
2. **Temporary test rules** (for development only):
```javascript
rules_version = '2';
service firebase.storage {
  match /b/{bucket}/o {
    match /{allPaths=**} {
      allow read, write: if true;  // WARNING: This allows anyone to read/write
    }
  }
}
```

### 2. Use the Test Page
1. Open `firebase-test.html` in your browser
2. Click "Test Connection" to verify Firebase setup
3. Click "Test Firestore Write" to test database permissions
4. Click "Test Storage Upload" to test file upload permissions

### 3. Check Browser Console
1. Open Developer Tools (F12)
2. Go to Console tab
3. Look for error messages when submitting the form
4. Common errors:
   - `permission-denied`: Security rules issue
   - `unauthenticated`: Authentication required
   - `not-found`: Collection doesn't exist

### 4. Verify Firebase Configuration
Your current config looks correct, but verify in Firebase Console:
- Project ID: `naya-market-60190`
- API Key: `AIzaSyDXfcM8ClwOJE8Zv6u-N-RuLCxNnjwXuus`
- Storage Bucket: `naya-market-60190.firebasestorage.app`

### 5. Enable Required Services
Make sure these services are enabled in Firebase Console:
- **Firestore Database**: Create database if not exists
- **Storage**: Create storage bucket if not exists
- **Authentication**: Not required for basic setup but recommended

### 6. Test Step by Step
1. **Test basic connection**: Use `firebase-test.html`
2. **Test form submission**: Check console logs in vendor page
3. **Test image upload**: Verify storage permissions
4. **Test database write**: Verify Firestore permissions

## Security Rules for Production

Once everything works, update your security rules to be more restrictive:

### Firestore Rules (Production)
```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /vendors/{document} {
      allow read: if true;  // Anyone can read vendor data
      allow write: if request.auth != null;  // Only authenticated users can write
    }
  }
}
```

### Storage Rules (Production)
```javascript
rules_version = '2';
service firebase.storage {
  match /b/{bucket}/o {
    match /product-images/{allPaths=**} {
      allow read: if true;  // Anyone can view product images
      allow write: if request.auth != null;  // Only authenticated users can upload
    }
  }
}
```

## Getting Help

If you're still having issues:
1. Check the browser console for specific error messages
2. Use the test page to isolate the problem
3. Verify your Firebase project settings
4. Check if your Firebase project has billing enabled (required for some services)

## Quick Fix Checklist

- [ ] Firebase project is active
- [ ] Firestore Database is created
- [ ] Storage bucket is created
- [ ] Security rules allow read/write
- [ ] No JavaScript errors in console
- [ ] Network connection is stable
- [ ] Firebase configuration is correct
