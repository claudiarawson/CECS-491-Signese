# Firebase Authentication Setup

This guide will help you set up Firebase Authentication for your Signese app.

## Prerequisites

1. A Google account
2. Node.js and npm installed
3. Expo CLI installed

## Step 1: Create a Firebase Project

1. Go to the [Firebase Console](https://console.firebase.google.com/)
2. Click "Create a project" or "Add project"
3. Enter your project name (e.g., "signese-app")
4. Follow the setup wizard (enable Google Analytics if desired)
5. Choose your Google Analytics account or create a new one

## Step 2: Enable Authentication

1. In your Firebase project console, go to "Authentication" in the left sidebar
2. Click on the "Get started" button
3. Go to the "Sign-in method" tab
4. Enable "Email/Password" provider
5. Enable "Google" provider
6. (Optional) Enable other providers like Facebook, etc.

## Step 3: Set Up Google OAuth

### For Web:
1. In Firebase Console → Authentication → Sign-in method → Google
2. Add your domain to authorized domains
3. Get the Web client ID from Google Cloud Console

### For Android:
1. In Firebase Console → Project settings → General → Your apps
2. Add Android app with package name
3. Download `google-services.json` and place in `android/app/`

### For iOS:
1. Add iOS app with bundle ID
2. Download `GoogleService-Info.plist` and place in `ios/`

### Expo Configuration:
Update your `app.json` or `app.config.js`:
```json
{
  "expo": {
    "scheme": "your-app-scheme"
  }
}
```

Update the client IDs in `src/services/firebase/googleAuth.services.ts`:
- `expoClientId`: From Expo Application Services
- `webClientId`: From Google Cloud Console (Web application)
- `androidClientId`: From google-services.json
- `iosClientId`: From GoogleService-Info.plist

## Step 3: Get Firebase Configuration

1. In your Firebase project console, click the gear icon → "Project settings"
2. Scroll down to "Your apps" section
3. Click "Add app" → Web app (</>) icon
4. Register your app with a nickname (e.g., "Signese Web")
5. Copy the Firebase config object

## Step 4: Configure Your App

1. Open `src/services/firebase/config.ts`
2. Replace the placeholder values with your actual Firebase config:

```typescript
export const firebaseConfig = {
  apiKey: "your-actual-api-key",
  authDomain: "your-project-id.firebaseapp.com",
  projectId: "your-project-id",
  storageBucket: "your-project-id.appspot.com",
  messagingSenderId: "your-messaging-sender-id",
  appId: "your-app-id"
};
```

## Step 5: Enable Web Support (For Expo Web)

Since you're starting with web authentication, ensure your Firebase project allows web requests:

1. In Firebase Console → Authentication → Settings → Authorized domains
2. Add your development domains (e.g., `localhost`, your Expo web URL)
3. For production, add your deployed domain

## Step 6: Test the Setup

1. Run your app: `npx expo start --web`
2. Navigate to the login/signup screens
3. Try creating an account and signing in

## Additional Configuration

### For Android (Future)
When setting up for Android:
1. Add Android app in Firebase Console
2. Download `google-services.json`
3. Place it in `android/app/`
4. Follow Expo documentation for Firebase Android setup

### For iOS (Future)
When setting up for iOS:
1. Add iOS app in Firebase Console
2. Download `GoogleService-Info.plist`
3. Place it in `ios/`
4. Follow Expo documentation for Firebase iOS setup

## Security Notes

- Never commit your Firebase config with real API keys to version control
- Consider using environment variables for production configs
- Regularly review your Firebase security rules

## Troubleshooting

- **Auth not working**: Check that your Firebase config is correct
- **Web not working**: Ensure your domain is authorized in Firebase
- **Expo Go issues**: Firebase may not work properly in Expo Go; use development builds

For more information, check the [Firebase Documentation](https://firebase.google.com/docs/auth) and [Expo Firebase Guide](https://docs.expo.dev/guides/using-firebase/).