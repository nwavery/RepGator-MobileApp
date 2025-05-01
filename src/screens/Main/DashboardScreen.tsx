import React, { useEffect, useState, useCallback } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    TouchableOpacity,
    ActivityIndicator,
    RefreshControl, // For pull-to-refresh
    Alert, // Import Alert
} from 'react-native';
import { CompositeScreenProps } from '@react-navigation/native';
import { BottomTabScreenProps } from '@react-navigation/bottom-tabs';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { AppStackParamList, MainTabsParamList } from '../../navigation/AppNavigator'; // Adjust path as needed
import { useAuthStore } from '../../stores/authStore';
// Assuming API client has functions to get dashboard data
import { getDashboardSummary, DashboardSummary } from '../../services/apiClient'; // Placeholder
// Import Ionicons
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient'; // <-- Import LinearGradient
import { formatDistrictId } from '../../utils/formatters'; // <-- Import formatter
// Import new components
import DashboardHeader from '../../components/Dashboard/DashboardHeader';
import DashboardActionCard from '../../components/Dashboard/DashboardActionCard';
import DashboardQuickActions from '../../components/Dashboard/DashboardQuickActions';

// Define colors
const COLORS = {
    primaryBlue: '#1A237E',
    secondaryBlue: '#535FBF', // Lighter blue for gradients/accents
    primaryRed: '#B71C1C',
    white: '#FFFFFF',
    lightGray: '#F8F9FA', // Slightly off-white background
    mediumGray: '#DEE2E6',
    darkGray: '#343A40',
    textGray: '#6C757D',
    errorRed: '#D32F2F',
    cardBackground: '#FFFFFF',
    accentColor: '#FFC107', // Example accent (Amber)
    iconColor: '#495057',
    avatarBackground: '#BDBDBD', // Added for consistency
    gradientStart: '#F8F9FA', // Light gray start
    gradientEnd: '#E9ECEF',   // Slightly darker gray end
};

// Updated type using CompositeScreenProps
type DashboardScreenProps = CompositeScreenProps<
  BottomTabScreenProps<MainTabsParamList, 'Dashboard'>,
  NativeStackScreenProps<AppStackParamList>
>;

const DashboardScreen: React.FC<DashboardScreenProps> = ({ navigation }) => {
    const { clearAuth, user } = useAuthStore();
    const [dashboardData, setDashboardData] = useState<DashboardSummary | null>(null);
    const [status, setStatus] = useState<'idle' | 'loading' | 'error' | 'success'>('idle');
    const [error, setError] = useState<string | null>(null);
    const [isRefreshing, setIsRefreshing] = useState(false);

    // --- Fetching Logic ---
    const fetchDashboardData = useCallback(async () => {
        // Don't set loading if just refreshing
        if (!isRefreshing) {
             setStatus('loading');
        }
        setError(null);
        try {
            const data = await getDashboardSummary();
            setDashboardData(data);
            setStatus('success');
        } catch (apiError: any) {
            console.error('Failed to fetch dashboard data:', apiError);
            setError(apiError.message || 'Failed to load dashboard data.');
            setStatus('error');
        }
         finally {
             setIsRefreshing(false);
        }
    }, [isRefreshing]);

    useEffect(() => {
        fetchDashboardData();
    }, [fetchDashboardData]);

    // --- Helper for Initials (Copied for consistency) ---
    const getInitials = (name: string | undefined): string => {
        if (!name) return '?';
        const parts = name.trim().split(' ');
        if (parts.length === 1) return parts[0].charAt(0).toUpperCase();
        return (parts[0].charAt(0) + (parts.length > 1 ? parts[parts.length - 1].charAt(0) : '')).toUpperCase();
    };

    const onRefresh = useCallback(() => {
        setIsRefreshing(true);
        fetchDashboardData();
    }, [fetchDashboardData]);

    // --- Rendering --- 

    const renderContent = () => {
        if (status === 'loading' && !isRefreshing) {
            return (
                 <View style={styles.centeredContainer}>
                    <ActivityIndicator size="large" color={COLORS.primaryBlue} />
                </View>
            );
        }

        if (status === 'error') {
            return (
                <View style={styles.centeredContainer}>
                    <Ionicons name="cloud-offline-outline" size={60} color={COLORS.errorRed} />
                    <Text style={styles.errorTitle}>Oops!</Text>
                    <Text style={styles.errorText}>{error || 'Could not load dashboard data.'}</Text>
                    <TouchableOpacity onPress={fetchDashboardData} style={styles.retryButton}>
                        <Ionicons name="refresh-outline" size={20} color={COLORS.white} />
                        <Text style={styles.retryButtonText}>Retry</Text>
                    </TouchableOpacity>
                </View>
            );
        }

        if (!dashboardData) {
            // Should only happen briefly or on initial error before retry
            return (
                <View style={styles.centeredContainer}>
                    <Text>No dashboard data available.</Text>
                </View>
            );
        }

        // --- Success State Content ---
        return (
            <> 
                <DashboardHeader 
                    userName={dashboardData.userName} 
                    districtId={dashboardData.districtId} 
                />

                <DashboardActionCard 
                    imageSource={require('../../../assets/RepGatorFind.png')} 
                    buttonText="Find Your Representatives" 
                    iconName="search-outline" 
                    onPress={() => navigation.navigate('Representatives')}
                />

                 <DashboardActionCard 
                    imageSource={require('../../../assets/RepGatorNews.png')} 
                    buttonText="Keep Up With The News" 
                    iconName="newspaper-outline" 
                    onPress={() => navigation.navigate('News')}
                />

                 <DashboardActionCard 
                    imageSource={require('../../../assets/RepGatorJoin.png')}
                    buttonText="Join The Conversation" 
                    iconName="chatbubbles-outline" 
                    onPress={() => navigation.getParent()?.navigate('Discussion')} // Navigate to Discussion (Ensure Discussion is defined in AppStackParamList)
                />

                <DashboardQuickActions 
                    onNavigateProfile={() => navigation.getParent()?.navigate('ProfileSettings')} 
                    onLogout={clearAuth} 
                />
             </>
        );
    };

    return (
        <LinearGradient
            colors={['red', 'blue']} // Apply gradient
            style={styles.gradientContainer}
        >
            <ScrollView
                 style={styles.container}
                 contentContainerStyle={styles.scrollContentContainer}
                 refreshControl={
                    <RefreshControl refreshing={isRefreshing} onRefresh={onRefresh} colors={[COLORS.primaryBlue]} tintColor={COLORS.primaryBlue} />
                }
                showsVerticalScrollIndicator={false}
            >
               {renderContent()}
            </ScrollView>
        </LinearGradient>
    );
};

const styles = StyleSheet.create({
    gradientContainer: { // Style for the gradient wrapper
        flex: 1,
    },
    container: {
        flex: 1,
        // backgroundColor removed here
    },
    scrollContentContainer: {
        flexGrow: 1,
        paddingTop: 0,
        paddingBottom: 0,
        paddingHorizontal: 20,
    },
    centeredContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: 30, // Give errors more space
    },
    errorTitle: {
        fontSize: 24,
        color: COLORS.errorRed,
        marginTop: 15,
        marginBottom: 8,
        fontFamily: 'PlayfairDisplay-Bold',
    },
    errorText: {
        color: COLORS.textGray,
        textAlign: 'center',
        marginBottom: 25,
        fontSize: 16,
    },
    retryButton: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: COLORS.primaryBlue,
        paddingVertical: 12,
        paddingHorizontal: 30,
        borderRadius: 25,
        elevation: 2,
    },
    retryButtonText: {
        color: COLORS.white,
        fontSize: 16,
        marginLeft: 10,
    },
    // REMOVED: headerContainer, avatarContainer, avatarText, headerTextContainer, welcomeMessage, districtInfo
    // REMOVED: findRepContainer, findRepImageWrapper, findRepImage, findRepButton, findRepButtonIcon, findRepButtonText
    // REMOVED: actionsContainer, actionButton, profileButton, profileButtonText, logoutButton, actionIcon, actionButtonText, logoutText
});

export default DashboardScreen;

// Placeholder type definition in apiClient.ts needs to be created:
/*
export type DashboardSummary = {
    userName: string;
    districtName: string;
    representativeCount: number;
    unreadMessages: number;
    upcomingEvents: number;
};

export const getDashboardSummary = async (): Promise<DashboardSummary> => {
    const endpoint = 'dashboard/summary'; // Verify this endpoint
    return fetchProtectedData<DashboardSummary>(endpoint);
};
*/ 