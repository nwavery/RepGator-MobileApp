import React, { useState } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, KeyboardAvoidingView, Platform, Alert, ActivityIndicator, ScrollView } from 'react-native';
import { RegisterScreenProps } from './types';
import { useAuthStore } from '../../stores/authStore';
import { registerUser } from '../../services/apiClient';
import { Ionicons } from '@expo/vector-icons';

// Reusing colors from LoginScreen (Ideally, define these globally later)
const COLORS = {
  primaryRed: '#B71C1C',
  primaryBlue: '#1A237E',
  white: '#FFFFFF',
  lightGray: '#F5F5F5',
  darkGray: '#212121',
  mediumGray: '#BDBDBD',
  textGray: '#757575',
  errorRed: '#D32F2F', // For error messages
};

const RegisterScreen: React.FC<RegisterScreenProps> = ({ navigation }) => {
  const [name, setName] = useState('');
  const [address, setAddress] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isPasswordVisible, setIsPasswordVisible] = useState(false);
  const [isConfirmPasswordVisible, setIsConfirmPasswordVisible] = useState(false);

  // Get state and actions from Zustand store
  const { setToken, setLoading, setError, status, error } = useAuthStore();

  const handleRegister = async () => {
    if (!name || !email || !password || !confirmPassword || !address) {
      Alert.alert('Missing Information', 'Please fill in all fields, including address.');
      return;
    }
    if (password !== confirmPassword) {
      Alert.alert('Password Mismatch', 'Passwords do not match.');
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const response = await registerUser({ name, email, password, address });
      setToken(response.token);
    } catch (err: any) {
      setError(err.message || 'Failed to register');
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      style={styles.keyboardAvoidingContainer}
    >
      <ScrollView contentContainerStyle={styles.scrollContainer} keyboardShouldPersistTaps="handled">
        <View style={styles.container}>
          <Text style={styles.title}>Create Account</Text>
          <Text style={styles.subtitle}>Get started with RepGator</Text>

          {/* Display Error Message */}
          {status === 'error' && error && (
            <Text style={styles.errorText}>{error}</Text>
          )}

          <TextInput
            style={styles.input}
            placeholder="Name"
            value={name}
            onChangeText={setName}
          />

          <TextInput
            style={styles.input}
            placeholder="Address"
            value={address}
            onChangeText={setAddress}
            autoCapitalize="words"
            textContentType="fullStreetAddress"
          />

          <TextInput
            style={styles.input}
            placeholder="Email"
            value={email}
            onChangeText={setEmail}
            autoCapitalize="none"
            keyboardType="email-address"
          />

          {/* Password Input with Toggle */}
          <View style={styles.passwordContainer}>
            <TextInput
              style={styles.inputPassword}
              placeholder="Password"
              value={password}
              onChangeText={setPassword}
              secureTextEntry={!isPasswordVisible}
            />
            <TouchableOpacity
              style={styles.eyeIcon}
              onPress={() => setIsPasswordVisible(!isPasswordVisible)}
            >
              <Ionicons
                name={isPasswordVisible ? 'eye-off' : 'eye'}
                size={24}
                color={COLORS.textGray}
              />
            </TouchableOpacity>
          </View>

          {/* Confirm Password Input with Toggle */}
          <View style={styles.passwordContainer}>
            <TextInput
              style={styles.inputPassword}
              placeholder="Confirm Password"
              value={confirmPassword}
              onChangeText={setConfirmPassword}
              secureTextEntry={!isConfirmPasswordVisible}
            />
            <TouchableOpacity
              style={styles.eyeIcon}
              onPress={() => setIsConfirmPasswordVisible(!isConfirmPasswordVisible)}
            >
              <Ionicons
                name={isConfirmPasswordVisible ? 'eye-off' : 'eye'}
                size={24}
                color={COLORS.textGray}
              />
            </TouchableOpacity>
          </View>

          <TouchableOpacity
            style={[styles.registerButton, status === 'loading' && styles.buttonDisabled]}
            onPress={handleRegister}
            disabled={status === 'loading'}
          >
            {status === 'loading' ? (
              <ActivityIndicator color={COLORS.white} />
            ) : (
              <Text style={styles.registerButtonText}>Register</Text>
            )}
          </TouchableOpacity>

          <View style={styles.loginContainer}>
            <Text style={styles.loginText}>Already have an account? </Text>
            <TouchableOpacity
              onPress={() => navigation.navigate('Login')}
              disabled={status === 'loading'}
            >
              <Text style={[styles.loginLink, status === 'loading' && styles.linkDisabled]}>Sign In</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

// Using similar styles to LoginScreen for consistency
const styles = StyleSheet.create({
  keyboardAvoidingContainer: {
      flex: 1,
      backgroundColor: COLORS.lightGray,
  },
  scrollContainer: {
    flexGrow: 1,
    justifyContent: 'center',
  },
  container: {
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingVertical: 20,
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
    marginBottom: 20, // Reduced margin
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
  passwordContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '100%',
    backgroundColor: COLORS.white,
    borderColor: COLORS.mediumGray,
    borderWidth: 1,
    borderRadius: 8,
    marginBottom: 15,
  },
  inputPassword: {
    flex: 1,
    height: 50,
    paddingHorizontal: 15,
    fontSize: 16,
    color: COLORS.darkGray,
  },
  eyeIcon: {
    padding: 10,
  },
  registerButton: {
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
  registerButtonText: {
    color: COLORS.white,
    fontSize: 18,
    fontFamily: 'PlayfairDisplay-Bold',
  },
  loginContainer: {
      flexDirection: 'row',
      marginTop: 30,
      alignItems: 'center',
  },
  loginText: {
      color: COLORS.textGray,
      fontSize: 14,
  },
  loginLink: {
      color: COLORS.primaryBlue,
      fontSize: 14,
      textDecorationLine: 'underline',
      fontFamily: 'PlayfairDisplay-Bold',
  },
  buttonDisabled: {
    backgroundColor: COLORS.mediumGray,
    elevation: 0,
  },
  linkDisabled: {
      color: COLORS.mediumGray,
      textDecorationLine: 'none',
  }
});

export default RegisterScreen; 