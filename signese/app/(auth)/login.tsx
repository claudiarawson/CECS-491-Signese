import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { useAuthStore } from '../../src/state/authStore';
import { signInSchema, SignInFormData } from '../../src/features/auth/validators';
import { useGoogleSignIn } from '../../src/services/firebase/googleAuth.services';

export default function LoginScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errors, setErrors] = useState<Partial<SignInFormData>>({});

  const { signIn, signInWithGoogle, isLoading, error } = useAuthStore();
  const { request, response, promptAsync, handleResponse } = useGoogleSignIn();
  const router = useRouter();

  useEffect(() => {
    if (response?.type === "success") {
      const idToken = handleResponse();
      if (idToken) {
        signInWithGoogle(idToken);
      }
    }
  }, [response, handleResponse, signInWithGoogle]);

  const handleLogin = async () => {
    try {
      const validatedData = signInSchema.parse({ email, password });
      setErrors({});

      await signIn(validatedData);
      router.replace('/(tabs)');
    } catch (err: any) {
      if (err.issues) {
        const fieldErrors: Partial<SignInFormData> = {};
        err.issues.forEach((issue: any) => {
          fieldErrors[issue.path[0] as keyof SignInFormData] = issue.message;
        });
        setErrors(fieldErrors);
      } else {
        Alert.alert('Error', err.message);
      }
    }
  };

  const navigateToForgotPassword = () => {
    router.push('/forgot-password');
  };

  return (
    <View style={{ flex: 1, justifyContent: 'center', padding: 20 }}>
      <Text style={{ fontSize: 24, fontWeight: 'bold', marginBottom: 20, textAlign: 'center' }}>
        Sign In
      </Text>

      <TextInput
        placeholder="Email"
        value={email}
        onChangeText={setEmail}
        keyboardType="email-address"
        autoCapitalize="none"
        style={{
          borderWidth: 1,
          borderColor: errors.email ? 'red' : '#ccc',
          padding: 10,
          marginBottom: 10,
          borderRadius: 5,
        }}
      />
      {errors.email && <Text style={{ color: 'red', marginBottom: 10 }}>{errors.email}</Text>}

      <TextInput
        placeholder="Password"
        value={password}
        onChangeText={setPassword}
        secureTextEntry
        style={{
          borderWidth: 1,
          borderColor: errors.password ? 'red' : '#ccc',
          padding: 10,
          marginBottom: 10,
          borderRadius: 5,
        }}
      />
      {errors.password && <Text style={{ color: 'red', marginBottom: 10 }}>{errors.password}</Text>}

      {error && <Text style={{ color: 'red', marginBottom: 10 }}>{error}</Text>}

      <TouchableOpacity
        onPress={handleLogin}
        disabled={isLoading}
        style={{
          backgroundColor: isLoading ? '#ccc' : '#007AFF',
          padding: 15,
          borderRadius: 5,
          marginBottom: 10,
        }}
      >
        <Text style={{ color: 'white', textAlign: 'center', fontWeight: 'bold' }}>
          {isLoading ? 'Signing In...' : 'Sign In'}
        </Text>
      </TouchableOpacity>

      <TouchableOpacity
        onPress={() => promptAsync()}
        disabled={!request}
        style={{
          backgroundColor: '#4285F4',
          padding: 15,
          borderRadius: 5,
          marginBottom: 10,
        }}
      >
        <Text style={{ color: 'white', textAlign: 'center', fontWeight: 'bold' }}>
          Sign In with Google
        </Text>
      </TouchableOpacity>

      <TouchableOpacity onPress={navigateToForgotPassword} style={{ marginBottom: 10 }}>
        <Text style={{ color: '#007AFF', textAlign: 'center' }}>Forgot Password?</Text>
      </TouchableOpacity>

        <Text style={{ textAlign: 'center' }}>
          Don&apos;t have an account? <Text style={{ color: '#007AFF' }}>Sign Up</Text>
        </Text>
    </View>
  );
}
