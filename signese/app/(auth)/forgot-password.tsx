import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { useAuthStore } from '../../src/state/authStore';
import { forgotPasswordSchema, ForgotPasswordFormData } from '../../src/features/auth/validators';

export default function ForgotPasswordScreen() {
  const [email, setEmail] = useState('');
  const [errors, setErrors] = useState<Partial<ForgotPasswordFormData>>({});
  const [successMessage, setSuccessMessage] = useState('');

  const { resetPassword, isLoading, error } = useAuthStore();
  const router = useRouter();

  const handleResetPassword = async () => {
    try {
      const validatedData = forgotPasswordSchema.parse({ email });
      setErrors({});
      setSuccessMessage('');

      await resetPassword(validatedData.email);
      setSuccessMessage('Password reset email sent! Check your inbox.');
    } catch (err: any) {
      if (err.issues) {
        const fieldErrors: Partial<ForgotPasswordFormData> = {};
        err.issues.forEach((issue: any) => {
          fieldErrors[issue.path[0] as keyof ForgotPasswordFormData] = issue.message;
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
    <View style={{ flex: 1, justifyContent: 'center', padding: 20 }}>
      <Text style={{ fontSize: 24, fontWeight: 'bold', marginBottom: 20, textAlign: 'center' }}>
        Reset Password
      </Text>

      <Text style={{ textAlign: 'center', marginBottom: 20, color: '#666' }}>
        Enter your email address and we&apos;ll send you a link to reset your password.
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

      {error && <Text style={{ color: 'red', marginBottom: 10 }}>{error}</Text>}
      {successMessage && <Text style={{ color: 'green', marginBottom: 10 }}>{successMessage}</Text>}

      <TouchableOpacity
        onPress={handleResetPassword}
        disabled={isLoading}
        style={{
          backgroundColor: isLoading ? '#ccc' : '#007AFF',
          padding: 15,
          borderRadius: 5,
          marginBottom: 20,
        }}
      >
        <Text style={{ color: 'white', textAlign: 'center', fontWeight: 'bold' }}>
          {isLoading ? 'Sending...' : 'Send Reset Email'}
        </Text>
      </TouchableOpacity>

      <TouchableOpacity onPress={navigateToLogin}>
        <Text style={{ textAlign: 'center', color: '#007AFF' }}>Back to Sign In</Text>
      </TouchableOpacity>
    </View>
  );
}
