import * as WebBrowser from "expo-web-browser";
import * as Google from "expo-auth-session/providers/google";

WebBrowser.maybeCompleteAuthSession();

export function useGoogleSignIn() {
  const [request, response, promptAsync] = Google.useAuthRequest({
    expoClientId: "YOUR_EXPO_CLIENT_ID",
    iosClientId: "YOUR_IOS_CLIENT_ID",
    androidClientId: "YOUR_ANDROID_CLIENT_ID",
    webClientId: "YOUR_WEB_CLIENT_ID",
  });

  const handleResponse = () => {
    if (response?.type === "success") {
      const { id_token } = response.authentication ?? {};

      if (!id_token) {
        throw new Error("Google sign-in failed: no ID token returned.");
      }

      return id_token;
    }
    return null;
  };

  return {
    request,
    response,
    promptAsync,
    handleResponse,
  };
}