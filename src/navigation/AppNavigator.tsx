import React, { useEffect } from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator, NativeStackScreenProps } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { useAuthStore } from '../stores/authStore';
import { RepresentativeListItem } from '../services/apiClient';
import { LinearGradient } from 'expo-linear-gradient';

// Auth Screens
import LoginScreen from '../screens/Auth/LoginScreen';
import RegisterScreen from '../screens/Auth/RegisterScreen';

// Main Screens
import DashboardScreen from '../screens/Main/DashboardScreen';
import RepresentativeListScreen from '../screens/Main/RepresentativeListScreen';
import RepresentativeDetailScreen from '../screens/Main/RepresentativeDetailScreen';
import MessageListScreen from '../screens/Main/MessageListScreen';
import MessageViewScreen from '../screens/Main/MessageViewScreen'; // Corrected name
import MessageComposeScreen from '../screens/Main/MessageComposeScreen';
import NewsScreen from '../screens/Main/NewsScreen'; // <-- Import NewsScreen
// import DiscussionScreen from '../screens/Main/DiscussionScreen'; // Path points to directory, comment out for now
// import SettingsScreen from '../screens/Main/SettingsScreen'; // File missing

// Settings Screens (Corrected/Removed)
import ProfileSettingsScreen from '../screens/Main/ProfileSettingsScreen'; // Corrected path
// import AccountSettingsScreen from '../screens/Settings/AccountSettingsScreen'; // Dir missing
// import NotificationSettingsScreen from '../screens/Settings/NotificationSettingsScreen'; // Dir missing
// import AboutScreen from '../screens/Settings/AboutScreen'; // Dir missing

// --- Param List Definitions ---

export type AuthStackParamList = {
    Login: undefined;
    Register: undefined;
};

// Update: Remove Settings screens for now
export type SettingsStackParamList = {
    // SettingsHome: undefined; // Component (SettingsScreen) missing
    ProfileSettings: undefined;
    // AccountSettings: undefined;
    // NotificationSettings: undefined;
    // About: undefined;
};

export type MainTabsParamList = {
    Dashboard: undefined;
    Representatives: undefined;
    Messages: undefined;
    News: undefined; // <-- Add News to the tab list
    // Discussion: undefined; // Commented out
    // Settings: { screen: keyof SettingsStackParamList } | undefined; // Commented out
};

// Combined App Stack
export type AppStackParamList = {
    Auth: { screen: keyof AuthStackParamList };
    Main: { screen: keyof MainTabsParamList };
    RepresentativeList: { // Keep params for selection mode
        isSelecting?: boolean;
        sourceRoute?: keyof AppStackParamList;
    } | undefined;
    RepresentativeDetail: { representative: RepresentativeListItem };
    MessageList: undefined; // Added for direct navigation if needed outside tabs
    MessageDetail: { conversationId: string }; // Use MessageViewScreen component
    MessageCompose: {
        selectedRepId?: string;
        selectedRepName?: string;
    } | undefined;
    // Discussion: undefined; // Commented out
    // Direct access to settings screens
    ProfileSettings: undefined;
    // AccountSettings: undefined;
    // NotificationSettings: undefined;
    // About: undefined;
    // SettingsStack: { screen: keyof SettingsStackParamList } | undefined; // Commented out
};

// --- Navigators ---

const Stack = createNativeStackNavigator<AppStackParamList>();
const AuthStack = createNativeStackNavigator<AuthStackParamList>();
// const SettingsStackNav = createNativeStackNavigator<SettingsStackParamList>(); // Comment out for now
const MainTab = createBottomTabNavigator<MainTabsParamList>();

// --- Navigator Components ---

function AuthStackNavigator() {
    return (
        <AuthStack.Navigator screenOptions={{ headerShown: false }} initialRouteName="Login">
            <AuthStack.Screen name="Login" component={LoginScreen} />
            <AuthStack.Screen name="Register" component={RegisterScreen} />
        </AuthStack.Navigator>
    );
}

// Comment out Settings Stack for now as its root screen is missing
/*
function SettingsStackNavigator() {
    return (
        <SettingsStackNav.Navigator initialRouteName="ProfileSettings"> // Changed initial route
            // <SettingsStackNav.Screen name="SettingsHome" component={SettingsScreen} options={{ title: 'Settings' }} />
            <SettingsStackNav.Screen name="ProfileSettings" component={ProfileSettingsScreen} options={{ title: 'Profile' }} />
            // <SettingsStackNav.Screen name="AccountSettings" component={AccountSettingsScreen} options={{ title: 'Account' }} />
            // <SettingsStackNav.Screen name="NotificationSettings" component={NotificationSettingsScreen} options={{ title: 'Notifications' }} />
            // <SettingsStackNav.Screen name="About" component={AboutScreen} options={{ title: 'About' }} />
        </SettingsStackNav.Navigator>
    );
}
*/

function MainTabNavigator() {
    return (
        <MainTab.Navigator
            screenOptions={({ route }) => ({
                tabBarIcon: ({ focused, color, size }) => {
                    let iconName: keyof typeof Ionicons.glyphMap = 'help-circle-outline'; // Default icon
                    if (route.name === 'Dashboard') iconName = focused ? 'home' : 'home-outline';
                    else if (route.name === 'Representatives') iconName = focused ? 'people' : 'people-outline';
                    else if (route.name === 'Messages') iconName = focused ? 'mail' : 'mail-outline';
                    else if (route.name === 'News') iconName = focused ? 'newspaper' : 'newspaper-outline'; // <-- Add icon for News
                    // else if (route.name === 'Discussion') iconName = focused ? 'chatbubbles' : 'chatbubbles-outline'; // Commented out
                    // else if (route.name === 'Settings') iconName = focused ? 'settings' : 'settings-outline'; // Commented out
                    return <Ionicons name={iconName} size={size} color={color} />;
                },
                tabBarActiveTintColor: '#FFFFFF',
                tabBarInactiveTintColor: '#FFFFFF',
                headerShown: true,
                tabBarBackground: () => (
                    <LinearGradient
                        colors={['blue', 'red']}
                        style={{ flex: 1 }}
                        start={{ x: 0.5, y: 0 }}
                        end={{ x: 0.5, y: 1 }}
                    />
                ),
                 tabBarStyle: { borderTopWidth: 0 },
            })}
        >
            <MainTab.Screen 
                name="Dashboard" 
                component={DashboardScreen} 
                options={{
                    headerTitle: 'RepGator',
                    headerTitleAlign: 'center', 
                    headerTintColor: '#FFFFFF', 
                    headerTitleStyle: { 
                        fontFamily: 'PlayfairDisplay-Bold',
                        fontSize: 30,
                    },
                    headerBackground: () => (
                        <LinearGradient colors={['blue', 'red']} style={{ flex: 1 }} start={{ x: 0.5, y: 0 }} end={{ x: 0.5, y: 1 }} />
                    ),
                    headerStyle: { backgroundColor: 'transparent' },
                }}
            />
            <MainTab.Screen 
                name="Representatives" 
                component={RepresentativeListScreen} 
                options={{ 
                    headerTitle: 'Your Representatives',
                    headerTitleAlign: 'center',
                    headerTintColor: '#000000',
                    headerTitleStyle: { 
                        fontFamily: 'PlayfairDisplay-Bold',
                        fontSize: 30,
                    },
                    headerBackground: () => (
                        <LinearGradient colors={['blue', 'white']} style={{ flex: 1 }} start={{ x: 0.5, y: 0 }} end={{ x: 0.5, y: 1 }} />
                    ),
                    headerStyle: { backgroundColor: 'transparent' },
                }}
            />
            <MainTab.Screen 
                name="Messages" 
                component={MessageListScreen} 
                options={{ 
                    headerTitle: 'Messages',
                    headerTitleAlign: 'center',
                    headerTintColor: '#FFFFFF',
                    headerTitleStyle: { // Add font style explicitly
                        fontFamily: 'PlayfairDisplay-Bold',
                        fontSize: 30,
                    },
                    headerBackground: () => (
                        <LinearGradient colors={['blue', 'red']} style={{ flex: 1 }} start={{ x: 0.5, y: 0 }} end={{ x: 0.5, y: 1 }} />
                    ),
                    headerStyle: { backgroundColor: 'transparent' },
                }}
            />
            <MainTab.Screen 
                name="News" 
                component={NewsScreen} 
                options={{ 
                    headerTitle: 'Political News',
                    headerTitleAlign: 'center',
                    headerTintColor: '#FFFFFF',
                    headerTitleStyle: { // Add font style explicitly
                        fontFamily: 'PlayfairDisplay-Bold',
                        fontSize: 30,
                    },
                    headerBackground: () => (
                         <LinearGradient colors={['blue', 'red']} style={{ flex: 1 }} start={{ x: 0.5, y: 0 }} end={{ x: 0.5, y: 1 }} />
                    ),
                    headerStyle: { backgroundColor: 'transparent' },
                }}
            />
            {/* <MainTab.Screen name="Discussion" component={DiscussionScreen} /> // Commented out */}
            {/* <MainTab.Screen
                name="Settings"
                component={SettingsStackNavigator} // Commented out
                options={{ headerShown: false }}
            /> */}
        </MainTab.Navigator>
    );
}

export default function AppNavigator() {
    const isAuthenticated = useAuthStore(state => state.isAuthenticated);
    const initializeAuth = useAuthStore(state => state.initializeAuth);
    const authStatus = useAuthStore(state => state.status);

    console.log(`AppNavigator Render/Re-render: isAuthenticated=${isAuthenticated}, authStatus=${authStatus}`);

    useEffect(() => {
        console.log(`AppNavigator initializeAuth Effect: authStatus=${authStatus}, isAuthenticated=${isAuthenticated}`); // Add isAuthenticated to log
        // Only initialize if status is idle AND we are not authenticated.
        if (authStatus === 'idle' && !isAuthenticated) {
             console.log("--> Calling initializeAuth");
             initializeAuth();
        }
    }, [authStatus, isAuthenticated, initializeAuth]); // Add isAuthenticated dependency

    if (authStatus === 'loading' || authStatus === 'idle') {
        // If we are idle but authenticated, we should still render the main stack
        // This handles the case after login where status might briefly be idle
        if (authStatus === 'idle' && isAuthenticated) {
            // Proceed to render based on isAuthenticated
        } else {
            return null; // Or ActivityIndicator for loading/initial idle
        }
    }

    return (
        <Stack.Navigator 
            screenOptions={{ // REMOVE ALL DEFAULT HEADER STYLES
                // Only non-header options remain if needed
            }}
        >
            {isAuthenticated ? (
                <>
                    <Stack.Screen 
                        name="Main" 
                        component={MainTabNavigator} 
                        options={{ headerShown: false }} // Keep this!
                    />
                    <Stack.Screen
                        name="RepresentativeDetail"
                        component={RepresentativeDetailScreen}
                        options={{
                            headerShown: true, 
                            title: 'Representative Details',
                            // Add explicit styles needed here
                            headerStyle: { backgroundColor: 'transparent' },
                            headerBackground: () => (
                                <LinearGradient colors={['blue', 'red']} style={{ flex: 1 }} start={{ x: 0.5, y: 0 }} end={{ x: 0.5, y: 1 }} />
                            ),
                             headerTintColor: '#FFFFFF',
                             headerTitleStyle: {
                                fontFamily: 'PlayfairDisplay-Bold',
                             },
                        }}
                    />
                     <Stack.Screen
                        name="MessageDetail"
                        component={MessageViewScreen}
                        options={{
                            headerShown: true, 
                            title: 'Conversation',
                            // Add explicit styles needed here
                            headerStyle: { backgroundColor: 'transparent' },
                            headerBackground: () => (
                                <LinearGradient colors={['blue', 'red']} style={{ flex: 1 }} start={{ x: 0.5, y: 0 }} end={{ x: 0.5, y: 1 }} />
                            ),
                             headerTintColor: '#FFFFFF',
                             headerTitleStyle: {
                                fontFamily: 'PlayfairDisplay-Bold',
                             },
                        }}
                    />
                    <Stack.Screen
                        name="MessageCompose"
                        component={MessageComposeScreen}
                        options={{
                            headerShown: true, 
                            title: 'Compose Message',
                            // Add explicit styles needed here
                             headerStyle: { backgroundColor: 'transparent' },
                            headerBackground: () => (
                                <LinearGradient colors={['blue', 'red']} style={{ flex: 1 }} start={{ x: 0.5, y: 0 }} end={{ x: 0.5, y: 1 }} />
                            ),
                             headerTintColor: '#FFFFFF',
                             headerTitleStyle: {
                                fontFamily: 'PlayfairDisplay-Bold',
                             },
                        }}
                    />
                    <Stack.Screen 
                        name="ProfileSettings"
                        component={ProfileSettingsScreen}
                        options={{
                            headerShown: true, 
                            title: 'Profile Settings',
                            // Add explicit styles needed here
                             headerStyle: { backgroundColor: 'transparent' },
                            headerBackground: () => (
                                <LinearGradient colors={['blue', 'red']} style={{ flex: 1 }} start={{ x: 0.5, y: 0 }} end={{ x: 0.5, y: 1 }} />
                            ),
                             headerTintColor: '#FFFFFF',
                             headerTitleStyle: {
                                fontFamily: 'PlayfairDisplay-Bold',
                             },
                        }}
                    />
                </>
            ) : (
                <Stack.Screen name="Auth" component={AuthStackNavigator} options={{ headerShown: false }} />
            )}
        </Stack.Navigator>
    );
} 