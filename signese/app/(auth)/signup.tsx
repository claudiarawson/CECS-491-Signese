import React, { useState } from 'react';
import { Text, TextInput, TouchableOpacity, Alert, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import { useAuthStore } from '../../src/state/authStore';
import { signUpSchema, SignUpFormData } from '../../src/features/auth/validators';

export default function SignupScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [errors, setErrors] = useState<Partial<SignUpFormData>>({});

  const { signUp, isLoading, error } = useAuthStore();
  const router = useRouter();

  const handleSignup = async () => {
    try {
      const validatedData = signUpSchema.parse({
        email,
        password,
        confirmPassword,
        displayName: displayName || undefined,
      });
      setErrors({});

      await signUp(validatedData);
      router.replace('/(tabs)');
    } catch (err: any) {
      if (err.issues) {
        const fieldErrors: Partial<SignUpFormData> = {};
        err.issues.forEach((issue: any) => {
          fieldErrors[issue.path[0] as keyof SignUpFormData] = issue.message;
        });
        setErrors(fieldErrors);
      } else {
        Alert.alert('Error', err.message);
      }
    }
  };

  const navigateToLogin = () => {
    router.push('/login');
  };

  return (
    <ScrollView contentContainerStyle={{ flexGrow: 1, justifyContent: 'center', padding: 20 }}>
      <Text style={{ fontSize: 24, fontWeight: 'bold', marginBottom: 20, textAlign: 'center' }}>
        Sign Up
      </Text>

      <TextInput
        placeholder="Display Name (optional)"
        value={displayName}
        onChangeText={setDisplayName}
        style={{
          borderWidth: 1,
          borderColor: errors.displayName ? 'red' : '#ccc',
          padding: 10,
          marginBottom: 10,
          borderRadius: 5,
        }}
      />
      {errors.displayName && <Text style={{ color: 'red', marginBottom: 10 }}>{errors.displayName}</Text>}

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

      <TextInput
        placeholder="Confirm Password"
        value={confirmPassword}
        onChangeText={setConfirmPassword}
        secureTextEntry
        style={{
          borderWidth: 1,
          borderColor: errors.confirmPassword ? 'red' : '#ccc',
          padding: 10,
          marginBottom: 10,
          borderRadius: 5,
        }}
      />
      {errors.confirmPassword && <Text style={{ color: 'red', marginBottom: 10 }}>{errors.confirmPassword}</Text>}

      {error && <Text style={{ color: 'red', marginBottom: 10 }}>{error}</Text>}

      <TouchableOpacity
        onPress={handleSignup}
        disabled={isLoading}
        style={{
          backgroundColor: isLoading ? '#ccc' : '#007AFF',
          padding: 15,
          borderRadius: 5,
          marginBottom: 10,
        }}
      >
        <Text style={{ color: 'white', textAlign: 'center', fontWeight: 'bold' }}>
          {isLoading ? 'Signing Up...' : 'Sign Up'}
        </Text>
      </TouchableOpacity>

      <TouchableOpacity onPress={navigateToLogin}>
        <Text style={{ textAlign: 'center' }}>
          Already have an account? <Text style={{ color: '#007AFF' }}>Sign In</Text>
        </Text>
      </TouchableOpacity>
    </ScrollView>
  );
}
