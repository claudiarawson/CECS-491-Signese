import { LinearGradient } from "expo-linear-gradient";
import { landingColors as c } from "@/src/theme/pages/landing.colors";
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import { useRouter } from "expo-router";

export default function HomeScreen() {
  const router = useRouter();

  return (
    <LinearGradient
      colors={[c.bgTop, c.bgBottom]}
      style={{ flex: 1 }}
    >
      <View style={styles.container}>
        <Text style={styles.title}>SIGNese</Text>
        <Text style={styles.subtitle}>Learn sign language with ease</Text>

        <View style={styles.buttons}>
          <TouchableOpacity
            style={[styles.button, styles.loginButton]}
            onPress={() => router.push("/login")}
          >
            <Text style={[styles.buttonText, styles.loginText]}>Login</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.button, styles.signupButton]}
            onPress={() => router.push("/signup")}
          >
            <Text style={[styles.buttonText, styles.signupText]}>Sign Up</Text>
          </TouchableOpacity>
        </View>
      </View>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 24,
  },
  title: {
    fontSize: 48,
    fontWeight: "bold",
    color: c.logoText,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 18,
    color: "#666",
    marginBottom: 48,
    textAlign: "center",
  },
  buttons: {
    width: "100%",
    gap: 16,
  },
  button: {
    padding: 16,
    borderRadius: 8,
    alignItems: "center",
  },
  loginButton: {
    backgroundColor: c.loginBackground,
    borderWidth: 1,
    borderColor: c.loginBorder,
  },
  signupButton: {
    backgroundColor: c.signupBackground,
  },
  buttonText: {
    fontSize: 16,
    fontWeight: "600",
  },
  loginText: {
    color: c.loginText,
  },
  signupText: {
    color: c.signupText,
  },
});