import React, { useState } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, KeyboardAvoidingView, Platform, Alert, ActivityIndicator } from 'react-native';
import { LoginScreenProps } from './types';
import { useAuthStore } from '../../stores/authStore';
import { loginUser } from '../../services/apiClient';

// Define colors
const COLORS = {
  primaryRed: '#B71C1C', // A strong red
  primaryBlue: '#1A237E', // A deep blue
  white: '#FFFFFF',
  lightGray: '#F5F5F5', // Background
  darkGray: '#212121', // Text
  mediumGray: '#BDBDBD', // Borders
  textGray: '#757575', // Placeholder text
  errorRed: '#D32F2F', // For error messages
};

const LoginScreen: React.FC<LoginScreenProps> = ({ navigation }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  // Get state and actions from Zustand store
  const { setToken, setLoading, setError, status, error } = useAuthStore();

  const handleLogin = async () => {
    setLoading(true);
    setError(null);

    // Debug log to check state values just before comparison
    console.log(`Comparing: email='${email}', password='${password}'`);

    // Original API call logic
    try {
      const response = await loginUser({ email, password });
      setToken(response.token);
    } catch (err: any) {
      setError(err.message || 'Failed to login');
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      style={styles.keyboardAvoidingContainer}
    >
      <View style={styles.container}>
        <Text style={styles.title}>Welcome Back!</Text>
        <Text style={styles.subtitle}>Sign in to continue</Text>

        {/* Display Error Message */}
        {status === 'error' && error && (
          <Text style={styles.errorText}>{error}</Text>
        )}

        <TextInput
          style={styles.input}
          placeholder="Email"
          placeholderTextColor={COLORS.textGray}
          value={email}
          onChangeText={setEmail}
          autoCapitalize="none"
          keyboardType="email-address"
          editable={status !== 'loading'} // Disable input while loading
        />

        <TextInput
          style={styles.input}
          placeholder="Password"
          placeholderTextColor={COLORS.textGray}
          value={password}
          onChangeText={setPassword}
          secureTextEntry
          editable={status !== 'loading'} // Disable input while loading
        />

        <TouchableOpacity
          style={[styles.loginButton, status === 'loading' && styles.buttonDisabled]} // Apply disabled style
          onPress={handleLogin}
          disabled={status === 'loading'} // Disable button while loading
        >
          {status === 'loading' ? (
            <ActivityIndicator color={COLORS.white} />
          ) : (
            <Text style={styles.loginButtonText}>Login</Text>
          )}
        </TouchableOpacity>

        <View style={styles.registerContainer}>
            <Text style={styles.registerText}>Don't have an account? </Text>
            <TouchableOpacity
              onPress={() => navigation.navigate('Register')}
              disabled={status === 'loading'} // Disable navigation while loading
            >
                <Text style={[styles.registerLink, status === 'loading' && styles.linkDisabled]}>Create one</Text>
            </TouchableOpacity>
        </View>
      </View>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  keyboardAvoidingContainer: {
      flex: 1,
      backgroundColor: COLORS.lightGray,
  },
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24, // More padding
    backgroundColor: COLORS.lightGray,
  },
  title: {
    fontSize: 32,
    color: COLORS.primaryBlue,
    marginBottom: 8,
    fontFamily: 'PlayfairDisplay-Bold',
  },
  subtitle: {
    fontSize: 16,
    color: COLORS.textGray,
    marginBottom: 20, // Reduced margin to make space for error
  },
  errorText: {
    color: COLORS.errorRed,
    fontSize: 14,
    marginBottom: 15,
    textAlign: 'center',
    width: '100%',
  },
  input: {
    height: 50,
    width: '100%',
    backgroundColor: COLORS.white,
    borderColor: COLORS.mediumGray,
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 15,
    marginBottom: 15,
    fontSize: 16,
    color: COLORS.darkGray,
  },
  loginButton: {
    width: '100%',
    height: 50,
    backgroundColor: COLORS.primaryRed,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 8,
    marginTop: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  loginButtonText: {
    color: COLORS.white,
    fontSize: 18,
    fontFamily: 'PlayfairDisplay-Bold',
  },
  registerContainer: {
      flexDirection: 'row',
      marginTop: 30,
      alignItems: 'center',
  },
  registerText: {
      color: COLORS.textGray,
      fontSize: 14,
  },
  registerLink: {
      color: COLORS.primaryBlue,
      fontSize: 14,
      textDecorationLine: 'underline',
      fontFamily: 'PlayfairDisplay-Bold',
  },
  buttonDisabled: {
    backgroundColor: COLORS.mediumGray, // Visually indicate disabled state
    elevation: 0, // Remove shadow when disabled
  },
  linkDisabled: {
      color: COLORS.mediumGray, // Grey out link when disabled
      textDecorationLine: 'none',
  }
});

export default LoginScreen; 