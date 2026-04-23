import * as WebBrowser from "expo-web-browser";
import * as Google from "expo-auth-session/providers/google";

WebBrowser.maybeCompleteAuthSession();

export function useGoogleSignIn() {
  const [request, response, promptAsync] = Google.useAuthRequest({
    iosClientId: "YOUR_IOS_CLIENT_ID",
    androidClientId: "YOUR_ANDROID_CLIENT_ID",
    webClientId: "YOUR_WEB_CLIENT_ID",
  });

  const handleResponse = () => {
    if (response?.type === "success") {
      const idToken =
        response.params.id_token ?? response.authentication?.idToken;

      if (!idToken) {
        throw new Error("Google sign-in failed: no ID token returned.");
      }

      return idToken;
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