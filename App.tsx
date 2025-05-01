import React, { useEffect, useCallback } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator, NativeStackScreenProps } from '@react-navigation/native-stack';
import { StatusBar } from 'expo-status-bar';
import { View, ActivityIndicator, StyleSheet, Text } from 'react-native'; // Import Text

// Import Expo Font and Splash Screen
import * as SplashScreen from 'expo-splash-screen';

// Import Stores and Navigators
import { useAuthStore } from './src/stores/authStore';
import AppNavigator from './src/navigation/AppNavigator';

// Import Auth screens
import LoginScreen from './src/screens/Auth/LoginScreen';
import RegisterScreen from './src/screens/Auth/RegisterScreen';

// Import expo-font hook
import { useFonts } from 'expo-font';

// Define Auth stack params and props
export type AuthStackParamList = {
  Login: undefined;
  Register: undefined;
};
export type LoginScreenProps = NativeStackScreenProps<AuthStackParamList, 'Login'>;
export type RegisterScreenProps = NativeStackScreenProps<AuthStackParamList, 'Register'>;

const AuthStack = createNativeStackNavigator<AuthStackParamList>();

// Auth Navigator Component
const AuthNavigator = () => {
  return (
    <AuthStack.Navigator initialRouteName="Login" screenOptions={{ headerShown: false }}>
      <AuthStack.Screen name="Login" component={LoginScreen} />
      <AuthStack.Screen name="Register" component={RegisterScreen} />
    </AuthStack.Navigator>
  );
};

// Keep the splash screen visible while we fetch resources
SplashScreen.preventAutoHideAsync();

// Main App Component
export default function App() {
  const { initializeAuth, isAuthenticated, status } = useAuthStore();

  // Load fonts
  const [fontsLoaded, fontError] = useFonts({
    'PlayfairDisplay-Regular': require('./assets/fonts/PlayfairDisplay-Regular.ttf'),
    'PlayfairDisplay-Bold': require('./assets/fonts/PlayfairDisplay-Bold.ttf'),
    // Add other weights/styles like Italic here if you downloaded them
    // e.g., 'PlayfairDisplay-Italic': require('./assets/fonts/PlayfairDisplay-Italic.ttf'),
  });

  useEffect(() => {
    // Attempt to load token from storage when app starts
    initializeAuth();
  }, [initializeAuth]);

  // Use useCallback to memoize the function for hiding the splash screen
  const onLayoutRootView = useCallback(async () => {
    if (fontsLoaded || fontError) {
      await SplashScreen.hideAsync();
    }
  }, [fontsLoaded, fontError]);

  // Show loading indicator while checking auth status OR loading fonts
  // Also check for font errors
  if (status === 'loading' || (!fontsLoaded && !fontError)) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#1A237E" />
      </View>
    );
  }

  // Optionally handle font loading error
  if (fontError) {
      console.error("Font Loading Error:", fontError);
      // Render fallback or error message
      return (
          <View style={styles.loadingContainer}>
              <Text>Error loading fonts. Please restart the app.</Text>
          </View>
      );
  }

  // Add this console log to check status
  console.log(`Fonts loaded: ${fontsLoaded}, Font error: ${fontError}`);

  // Render the app only when fonts are loaded and auth status is determined
  return (
    // Apply onLayout to the root view to hide splash screen
    // Set default font family in the root view's style
    <View style={styles.appContainer} onLayout={onLayoutRootView}>
      <NavigationContainer>
        {isAuthenticated ? <AppNavigator /> : <AuthNavigator />}
        <StatusBar style="auto" />
      </NavigationContainer>
    </View>
  );
}

// Styles
const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F5F5F5', // Match auth screen background
  },
  appContainer: { // New style for the root view
      flex: 1,
      fontFamily: 'PlayfairDisplay-Regular', // Set new default font
  },
});
