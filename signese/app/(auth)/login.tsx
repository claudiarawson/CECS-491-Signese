import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  Image,
} from "react-native";
import { useRouter } from "expo-router";
import { LinearGradient } from "expo-linear-gradient";
import { loginColors as c } from "@/src/theme/pages/login.colors";

export default function LoginScreen() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const handleLogin = () => {
    // TODO: replace with real authentication call
    Alert.alert("Login", `email: ${email}\npassword: ${password}`);
  };

  return (
    <LinearGradient colors={[c.backgroundTop, c.backgroundBottom]} style={{ flex: 1 }}>
      <View style={styles.container}>
        <Image
          source={require("../../assets/images/signese-logo.png")}
          style={styles.logo}
          resizeMode="contain"
        />
        <Text style={styles.title}>Welcome back</Text>

        <TextInput
          value={email}
          onChangeText={setEmail}
          placeholder="Email"
          style={styles.input}
          autoCapitalize="none"
          keyboardType="email-address"
        />

        <TextInput
          value={password}
          onChangeText={setPassword}
          placeholder="Password"
          style={styles.input}
          secureTextEntry
        />

        <TouchableOpacity onPress={handleLogin} style={styles.button}>
          <Text style={styles.buttonText}>Sign in</Text>
        </TouchableOpacity>

        <View style={styles.links}>
          <TouchableOpacity onPress={() => router.push("/signup")}>
            <Text style={styles.linkText}>Create account</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={() => router.push("/forgot-password")}>
            <Text style={styles.linkText}>Forgot password?</Text>
          </TouchableOpacity>
        </View>
      </View>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 24,
    justifyContent: "center",
    backgroundColor: c.cardBackground,
    margin: 16,
    borderRadius: 12,
  },
  logo: {
    width: 80,
    height: 80,
    alignSelf: "center",
    marginBottom: 16,
  },
  title: {
    fontSize: 28,
    fontWeight: "bold",
    marginBottom: 24,
    textAlign: "center",
    color: c.titleText,
  },
  input: {
    backgroundColor: c.inputBackground,
    borderWidth: 1,
    borderColor: c.inputBorder,
    borderRadius: 4,
    padding: 12,
    marginBottom: 12,
    color: c.inputText,
  },
  button: {
    backgroundColor: c.primaryButton,
    padding: 14,
    borderRadius: 4,
    alignItems: "center",
    marginTop: 12,
  },
  buttonText: {
    color: c.buttonText,
    fontWeight: "600",
  },
  links: {
    marginTop: 24,
    alignItems: "center",
  },
  linkText: {
    color: c.linkText,
    marginTop: 8,
  },
});