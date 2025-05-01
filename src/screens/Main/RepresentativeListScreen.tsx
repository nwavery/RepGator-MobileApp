import React, { useEffect, useState, useCallback, useRef } from 'react';
import {
    View,
    Text,
    StyleSheet,
    FlatList,
    ActivityIndicator,
    TouchableOpacity,
    Image,
    RefreshControl,
} from 'react-native';
import { CompositeScreenProps } from '@react-navigation/native';
import { BottomTabScreenProps } from '@react-navigation/bottom-tabs';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons'; // Import icons
import { AppStackParamList, MainTabsParamList } from '../../navigation/AppNavigator'; // Adjust path
import { useAuthStore } from '../../stores/authStore'; // <-- Import base store hook
import { useStoreWithEqualityFn } from 'zustand/traditional'; // <-- Import the dedicated hook
import { shallow } from 'zustand/shallow'; // <-- Import shallow
import { getRepresentativesByDistrict, RepresentativeListItem, getUserProfile } from '../../services/apiClient'; // <-- Import new API call and type

// Define colors (Consider moving to a global theme file)
const COLORS = {
  primaryBlue: '#1A237E',
  white: '#FFFFFF',
  lightGray: '#F5F5F5',
  mediumGray: '#E0E0E0',
  darkGray: '#212121',
  textGray: '#757575',
  errorRed: '#D32F2F',
  repCardBackground: '#FFFFFF', // Default card background
  partyDemocrat: '#2196F3', // Blue for Democrat indicator
  partyRepublican: '#F44336', // Red for Republican indicator
  partyIndependent: '#9E9E9E', // Gray for Independent/Other indicator
  // New background colors
  partyDemocratBackground: '#002868', // US Flag Blue
  partyRepublicanBackground: '#B22234', // US Flag Red
  iconColor: '#616161', // Color for icons
  avatarBackground: '#BDBDBD', // Added for consistency
};

// Define the screen's specific params including optional selection params
type RepresentativeListRouteParams = AppStackParamList['RepresentativeList']; // Get params from AppStackParamList

// Combine navigator props using CompositeScreenProps
type Props = CompositeScreenProps<
  BottomTabScreenProps<MainTabsParamList, 'Representatives'>,
  NativeStackScreenProps<AppStackParamList, 'RepresentativeList'>
>;

const RepresentativeListScreen: React.FC<Props> = ({ route, navigation }) => {
    const [reps, setReps] = useState<RepresentativeListItem[]>([]);
    const [repStatus, setRepStatus] = useState<'idle' | 'loading' | 'error' | 'success'>('idle');
    const [repError, setRepError] = useState<string | null>(null);
    const [isRefreshing, setIsRefreshing] = useState(false);

    const [profileStatus, setProfileStatus] = useState<'idle' | 'loading' | 'error' | 'success'>('idle');
    const [profileError, setProfileError] = useState<string | null>(null);

    // Use dedicated hook with shallow compare
    const { user, updateUser } = useStoreWithEqualityFn(
        useAuthStore, // Pass the base store hook
        (state) => ({ user: state.user, updateUser: state.updateUser }), // Selector remains the same
        shallow // Pass shallow comparer
    );

    // Refs - only needed for reps now to prevent re-fetch during loading
    const repsFetchInitiatedForDistrict = useRef<string | null>(null);

    // Get selection params from route
    const params = route.params as RepresentativeListRouteParams | undefined;
    const isSelecting = params?.isSelecting ?? false;
    const sourceRoute = params?.sourceRoute;

    // performProfileFetch now sets its own loading status
    const performProfileFetch = useCallback(async () => {
        // Set loading status *immediately* upon starting the fetch attempt
        setProfileStatus('loading');
        try {
            console.log('RepListScreen: Performing profile fetch...');
            const fetchedProfile = await getUserProfile();
            updateUser(fetchedProfile);
            console.log('RepListScreen: Profile fetched, updateUser called, setting status to success');
            setProfileStatus('success');
        } catch (e: any) {
            console.error('RepListScreen: Failed to fetch profile:', e);
            setProfileError(e.message || 'Could not load profile to find district.');
            setProfileStatus('error');
            // No ref to reset here anymore
        }
    }, [updateUser]);

    // performRepsFetch - loading status set by trigger effect
    const performRepsFetch = useCallback(async (districtId: string, isManualRefresh = false) => {
         try {
             console.log(`RepListScreen: Performing reps fetch for district ${districtId}...`);
             const data = await getRepresentativesByDistrict(districtId);
             setReps(data);
             setRepStatus('success');
         } catch (e: any) {
             console.error("Fetch reps error:", e);
             setRepError(e.message || 'Failed to load representatives.');
             setRepStatus('error');
             repsFetchInitiatedForDistrict.current = null; // Reset on error
         } finally {
             if (isManualRefresh) setIsRefreshing(false);
         }
    }, []);

    // Effect #1: Trigger Initial Profile Fetch (if needed)
    useEffect(() => {
        console.log(`RepListScreen Initial Profile Trigger: User=${!!user}`);
        // If there's no user, attempt to fetch the profile.
        // performProfileFetch handles its own loading/success/error states.
        if (!user) {
            console.log("--> Triggering performProfileFetch");
            performProfileFetch();
        }
    }, [user, performProfileFetch]); // Run if user state changes or function ref changes

    // Effect #2: Trigger Reps Fetch (if needed)
     useEffect(() => {
         const districtId = user?.districtId;
         console.log(`RepListScreen Reps Trigger: District=${districtId}, RepStatus=${repStatus}, RepsInitiated=${repsFetchInitiatedForDistrict.current}`);
         // If we have a district, status is idle, and not already initiated for this district
         if (districtId && repStatus === 'idle' && repsFetchInitiatedForDistrict.current !== districtId) {
             console.log(`--> Triggering Reps Fetch for ${districtId} by setting status loading`);
             setRepStatus('loading');
             repsFetchInitiatedForDistrict.current = districtId; // Mark as initiated
         }
     }, [user?.districtId, repStatus]);

    // Effect #3: Execute Reps Fetch - Consume the initiation flag
    useEffect(() => {
        const districtId = user?.districtId;
        console.log(`RepListScreen Reps Exec Effect: Status=${repStatus}, InitiatedForThisDistrict=${repsFetchInitiatedForDistrict.current === districtId}, District=${districtId}`);
        if (repStatus === 'loading' && districtId && repsFetchInitiatedForDistrict.current === districtId) {
            console.log(`--> Consuming Reps Initiate flag for ${districtId} and Executing Fetch`);
            repsFetchInitiatedForDistrict.current = null; // Consume the flag immediately
            performRepsFetch(districtId);
        }
    }, [repStatus, user?.districtId, performRepsFetch]);

    // onRefresh: Directly call performRepsFetch with manual flag
    const onRefresh = useCallback(() => {
        const districtId = user?.districtId;
        if (districtId) {
            console.log("--> onRefresh: Initiating manual refresh..."); // Add log
            setIsRefreshing(true);
            repsFetchInitiatedForDistrict.current = null; // Reset initiation flag is still okay
            // Directly call the fetch function with the manual refresh flag
            performRepsFetch(districtId, true);
        } else {
            console.warn("Cannot refresh reps, districtId missing.");
            setIsRefreshing(false); // Ensure spinner stops if no district ID
        }
    }, [user?.districtId, performRepsFetch]); // Add performRepsFetch dependency

    // --- Helper for Initials ---
    const getInitials = (firstName?: string, lastName?: string): string => {
        if (!firstName) return '?';
        const firstInitial = firstName.charAt(0).toUpperCase();
        const lastInitial = lastName ? lastName.charAt(0).toUpperCase() : '';
        return firstInitial + lastInitial;
    };

    const getPartyColor = (party: string): string => {
        const lowerParty = party?.toLowerCase() || '';
        if (lowerParty.includes('democrat')) return COLORS.partyDemocrat;
        if (lowerParty.includes('republican')) return COLORS.partyRepublican;
        return COLORS.partyIndependent;
    };

    // --- Helper for Card Background Color ---
    const getPartyBackgroundColor = (party: string): string => {
        console.log(`getPartyBackgroundColor received party: '${party}'`);
        const lowerParty = party?.toLowerCase() || '';
        // Check for exact abbreviation
        if (lowerParty === 'd') return COLORS.partyDemocratBackground;
        if (lowerParty === 'r') return COLORS.partyRepublicanBackground;
        return COLORS.repCardBackground; // Default white background
    };

    // --- Helper for Secondary Text Color (District/Party) based on background ---
    const getPartySecondaryTextColor = (party: string): string => {
        const lowerParty = party?.toLowerCase() || '';
        // Dark backgrounds (Democrat Blue, Republican Red) need light text
        if (lowerParty === 'd') return COLORS.white;
        if (lowerParty === 'r') return COLORS.white; // Changed from darkGray to white
        // Otherwise, use the standard text gray for light backgrounds
        return COLORS.textGray;
    };

    // --- Helper for Primary Text Color (Name) based on background ---
    const getPartyPrimaryTextColor = (party: string): string => {
        const lowerParty = party?.toLowerCase() || '';
        // Dark backgrounds (Democrat Blue, Republican Red) need light text
        if (lowerParty === 'd' || lowerParty === 'r') return COLORS.white;
        // Otherwise, use the standard dark gray for light backgrounds
        return COLORS.darkGray;
    };

    // --- Helper for Full Party Name ---
    const getPartyFullName = (partyAbbr?: string): string => {
        switch (partyAbbr?.toUpperCase()) {
            case 'R': return 'Republican';
            case 'D': return 'Democrat';
            case 'I': // Fallback for Independent or others
            default: return partyAbbr || 'Independent'; // Return original abbr if unexpected, or Independent
        }
    };

    const handleRepPress = (rep: RepresentativeListItem) => {
        if (isSelecting) {
            if (sourceRoute === 'MessageCompose') {
                navigation.navigate('MessageCompose', {
                    selectedRepId: rep.bioguideId,
                    selectedRepName: rep.name || `${rep.firstName} ${rep.lastName}`, // Use combined or construct
                });
            } else {
                console.warn('Selection mode active but sourceRoute is not MessageCompose.');
                navigation.goBack();
            }
        } else {
            navigation.navigate('RepresentativeDetail', { representative: rep });
        }
    };

    const renderRepItem = ({ item }: { item: RepresentativeListItem }) => (
        <TouchableOpacity
            style={[
                styles.repCard,
                { backgroundColor: getPartyBackgroundColor(item.party) }
            ]}
            onPress={() => handleRepPress(item)}
        >
            <View style={styles.avatarContainer}>
                 <Text style={styles.avatarText}>{getInitials(item.firstName, item.lastName)}</Text>
             </View>
            <View style={styles.repInfo}>
                <Text style={[styles.repName, { color: getPartyPrimaryTextColor(item.party) }]}>
                    {`${item.type} ${item.name || `${item.firstName} ${item.lastName}`}`}
                </Text>
                <Text style={[styles.repDistrict, { color: getPartySecondaryTextColor(item.party) }]}>
                    {item.phone || 'Phone not available'}
                </Text>
                <View style={styles.partyContainer}>
                     <View style={[styles.partyIndicator, { backgroundColor: getPartyColor(item.party) }]} />
                    <Text style={[styles.repParty, { color: getPartySecondaryTextColor(item.party) }]}>
                        {getPartyFullName(item.party)}
                    </Text>
                 </View>
            </View>
            <Ionicons
                 name={isSelecting ? "checkmark-circle-outline" : "chevron-forward-outline"}
                 size={24}
                 color={isSelecting ? COLORS.primaryBlue : COLORS.iconColor}
                 style={styles.arrowIndicator}
            />
        </TouchableOpacity>
    );

    if (profileStatus === 'loading' && !user) {
        return (
            <View style={styles.centeredContainer}>
                <ActivityIndicator size="large" color={COLORS.primaryBlue} />
                <Text style={styles.loadingText}>Loading Profile...</Text>
            </View>
        );
    }

    if (profileStatus === 'error' && !user) {
        return (
            <View style={styles.centeredContainer}>
                 <Ionicons name="alert-circle-outline" size={60} color={COLORS.errorRed} />
                <Text style={styles.errorTitle}>Error Loading Profile</Text>
                <Text style={styles.errorTextDetail}>{profileError}</Text>
                <TouchableOpacity onPress={performProfileFetch} style={styles.retryButton}>
                    <Ionicons name="refresh-outline" size={20} color={COLORS.white} />
                    <Text style={styles.retryButtonText}>Retry Profile</Text>
                 </TouchableOpacity>
            </View>
        );
    }

    if (repStatus === 'loading' && !isRefreshing && reps.length === 0) {
        return (
            <View style={styles.centeredContainer}>
                <ActivityIndicator size="large" color={COLORS.primaryBlue} />
                 <Text style={styles.loadingText}>Loading Representatives...</Text>
            </View>
        );
    }

    if (repStatus === 'error' && reps.length === 0) {
        return (
            <View style={styles.centeredContainer}>
                 <Ionicons name="warning-outline" size={60} color={COLORS.errorRed} />
                <Text style={styles.errorTitle}>Error Loading Representatives</Text>
                <Text style={styles.errorTextDetail}>{repError}</Text>
                <TouchableOpacity onPress={() => {
                     repsFetchInitiatedForDistrict.current = null; // Reset flag
                     setRepStatus('idle');
                 }} style={styles.retryButton}>
                    <Ionicons name="refresh-outline" size={20} color={COLORS.white} />
                    <Text style={styles.retryButtonText}>Retry</Text>
                 </TouchableOpacity>
            </View>
        );
    }

    if (user && !user.districtId && profileStatus !== 'loading' && profileStatus !== 'error') {
         return (
             <View style={styles.centeredContainer}>
                 <Ionicons name="alert-circle-outline" size={60} color={COLORS.errorRed} />
                 <Text style={styles.errorTitle}>District Not Found</Text>
                 <Text style={styles.errorTextDetail}>Your district ID could not be determined from your profile.</Text>
                 <TouchableOpacity onPress={() => navigation.navigate('ProfileSettings')} style={styles.retryButton}>
                    <Ionicons name="person-outline" size={20} color={COLORS.white} />
                    <Text style={styles.retryButtonText}>Go to Profile</Text>
                 </TouchableOpacity>
             </View>
         );
     }

    return (
        <View style={styles.screenContainer}>
            <FlatList
                style={styles.listContainer}
                contentContainerStyle={styles.listContentContainer}
                data={reps}
                renderItem={renderRepItem}
                keyExtractor={(item) => item.bioguideId}
                ListEmptyComponent={() => (
                    (repStatus === 'success' || repStatus === 'idle') && profileStatus === 'success' && reps.length === 0 && (
                        <View style={styles.centeredContainer}>
                            <Ionicons name="people-outline" size={50} color={COLORS.mediumGray} />
                            <Text style={styles.emptyText}>No representatives found for your district.</Text>
                        </View>
                    )
                )}
                ItemSeparatorComponent={() => <View style={styles.separator} />}
                refreshControl={
                    <RefreshControl
                        refreshing={isRefreshing}
                        onRefresh={onRefresh}
                        colors={[COLORS.primaryBlue]}
                        tintColor={COLORS.primaryBlue}
                    />
                 }
                showsVerticalScrollIndicator={false}
            />
            <Image 
                source={require('../../../assets/splash-icon.png')} 
                style={styles.bottomIcon}
                resizeMode="contain"
            />
        </View>
    );
};

const styles = StyleSheet.create({
    screenContainer: {
        flex: 1,
        backgroundColor: COLORS.lightGray,
    },
    centeredContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 20,
        backgroundColor: COLORS.lightGray,
    },
    listContainer: {
        flex: 1,
    },
    listContentContainer: {
        paddingVertical: 8,
        paddingBottom: 10,
    },
    errorTitle: {
        fontSize: 22,
        color: COLORS.errorRed,
        marginTop: 15,
        marginBottom: 8,
        textAlign: 'center',
        fontFamily: 'PlayfairDisplay-Bold',
    },
    errorTextDetail: {
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
    emptyText: {
        marginTop: 15,
        fontSize: 16,
        color: COLORS.textGray,
    },
    repCard: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 16,
        paddingVertical: 14,
        marginVertical: 5,
        marginHorizontal: 12,
        borderRadius: 12,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.12,
        shadowRadius: 4,
        elevation: 4,
        borderWidth: 1,
        borderColor: COLORS.mediumGray,
    },
    avatarContainer: {
        width: 55,
        height: 55,
        borderRadius: 27.5,
        marginRight: 14,
        backgroundColor: COLORS.avatarBackground,
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: COLORS.mediumGray,
    },
    avatarText: {
        color: COLORS.white,
        fontSize: 22,
        fontWeight: 'bold',
    },
    repInfo: {
        flex: 1,
        justifyContent: 'center',
    },
    repName: {
        fontSize: 17,
        marginBottom: 2,
        color: COLORS.darkGray,
        fontFamily: 'PlayfairDisplay-Bold',
    },
    repDistrict: {
        fontSize: 15,
        color: COLORS.textGray,
        marginBottom: 5,
    },
    partyContainer: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    partyIndicator: {
        width: 8,
        height: 8,
        borderRadius: 4,
        marginRight: 6,
    },
     repParty: {
        fontSize: 15,
        color: COLORS.textGray,
        fontWeight: '500',
    },
    arrowIndicator: {
        marginLeft: 10,
    },
    separator: {
        height: 0,
    },
    loadingText: {
        marginTop: 10,
        fontSize: 16,
        color: COLORS.textGray,
    },
    bottomIcon: {
        width: 400,
        height: 400,
        alignSelf: 'center',
        marginTop: 10,
        marginBottom: 20,
    },
});

export default RepresentativeListScreen; 