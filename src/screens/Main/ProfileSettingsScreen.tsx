import React, { useState, useEffect, useCallback } from 'react';
import {
    View,
    Text,
    StyleSheet,
    Button,
    ScrollView,
    ActivityIndicator,
    TouchableOpacity,
    RefreshControl,
    Alert,
    Modal,
    TextInput,
    Platform,
    KeyboardAvoidingView
} from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { AppStackParamList } from '../../navigation/AppNavigator'; // Adjust path
import { useAuthStore } from '../../stores/authStore';
import { getUserProfile, updateUserProfile, UserProfile, UpdateUserProfileRequest } from '../../services/apiClient'; // Import API functions and types
import { Ionicons } from '@expo/vector-icons';
import AddressModal, { Address as ModalAddress } from '../../components/Profile/AddressModal'; // Import the new component

// Define colors
const COLORS = {
    primaryBlue: '#1A237E',
    primaryRed: '#B71C1C',
    white: '#FFFFFF',
    lightGray: '#F8F9FA',
    mediumGray: '#DEE2E6',
    darkGray: '#343A40',
    textGray: '#6C757D',
    iconColor: '#495057',
    errorRed: '#D32F2F',
    sectionBackground: '#FFFFFF',
    borderColor: '#E9ECEF',
    modalBackground: 'rgba(0, 0, 0, 0.5)', // For modal overlay
    inputBackground: '#FFFFFF',
    placeholderText: '#ADB5BD',
    buttonDisabled: '#CED4DA',
    avatarBackground: '#BDBDBD', // Added for avatar
};

// Address type helper removed (imported from AddressModal)
// type Address = { ... };

// Ensure Props type is correct for Stack Navigator usage
type Props = NativeStackScreenProps<AppStackParamList, 'ProfileSettings'>;

const ProfileSettingsScreen: React.FC<Props> = ({ navigation }) => {
    const user = useAuthStore(state => state.user);
    const updateUser = useAuthStore(state => state.updateUser);
    const clearAuth = useAuthStore(state => state.clearAuth);

    // Re-add local status/error for fetch initiated by this screen
    const [status, setStatus] = useState<'idle' | 'loading' | 'error' | 'success'>(
        user ? 'success' : 'idle' // Start with success if user already exists
    );
    const [error, setError] = useState<string | null>(null);
    const [isRefreshing, setIsRefreshing] = useState(false);

    // --- State for Address Modal (Keep this) ---
    const [isAddressModalVisible, setIsAddressModalVisible] = useState(false);
    const [addressForm, setAddressForm] = useState<ModalAddress>({ street: '', city: '', state: '', zip: '' });
    const [isSavingAddress, setIsSavingAddress] = useState(false);
    const [addressSaveError, setAddressSaveError] = useState<string | null>(null);

    // Re-add fetchProfile function
    const fetchProfile = useCallback(async (isRefresh = false) => {
        if (isRefresh) {
             setIsRefreshing(true);
        }
        // Only set loading status if we don't already have user data
        // or if it's a manual refresh.
        if (!user || isRefresh) {
             setStatus('loading');
        }
        setError(null);
        try {
            console.log('ProfileSettingsScreen: Fetching profile...'); // Add log
            const fetchedProfile = await getUserProfile();
            updateUser(fetchedProfile);
            setStatus('success');
        } catch (apiError: any) {
            console.error('ProfileSettingsScreen: Failed to fetch profile:', apiError);
            setError(apiError.message || 'Failed to load profile.');
            setStatus('error');
        } finally {
            if (isRefresh) {
                 setIsRefreshing(false);
            }
        }
    }, [updateUser, user]);

    // Re-add useEffect to fetch if necessary
    useEffect(() => {
        // Fetch profile only if user data is not available when the screen mounts.
        if (!user && status === 'idle') {
            console.log('ProfileSettingsScreen useEffect: No user found, calling fetchProfile');
            fetchProfile();
        }
        // If user data arrives from the store later, update status
        else if (user && status !== 'success') {
             setStatus('success');
        }
    }, [user, fetchProfile, status]);

    // Refresh logic remains the same, calls fetchProfile
    const onRefresh = useCallback(async () => {
       console.log('onRefresh: Manually refreshing profile...');
       await fetchProfile(true); // Pass true for refresh
    }, [fetchProfile]);

    // --- Address Modal Logic ---
    const handleManageAddress = () => {
        if (!user) return;
        // Initialize form empty as we receive address as a string
        setAddressForm({ street: '', city: '', state: '', zip: '' });
        setAddressSaveError(null);
        setIsAddressModalVisible(true);
    };

    const handleSaveAddress = async (addressData: ModalAddress) => {
        // Construct the object expected by the PUT/PATCH API
        const updatePayload: UpdateUserProfileRequest = { address: addressData };
        setIsSavingAddress(true);
        setAddressSaveError(null);
        try {
            // Use the structured payload for the update
            const updatedProfile = await updateUserProfile(updatePayload);
            updateUser(updatedProfile); // Update store (will receive string address back)
            setIsAddressModalVisible(false);
            Alert.alert('Success', 'Address updated successfully.');
        } catch (saveError: any) {
            console.error('ProfileSettingsScreen: Failed to save address:', saveError);
            setAddressSaveError(saveError.message || 'Could not update address.');
            throw saveError;
        } finally {
            setIsSavingAddress(false);
        }
    };

    // --- Helper for Initials ---
    const getInitials = (name: string | undefined): string => {
        if (!name) return '?';
        const parts = name.trim().split(' ');
        if (parts.length === 1) return parts[0].charAt(0).toUpperCase();
        return (parts[0].charAt(0) + (parts.length > 1 ? parts[parts.length - 1].charAt(0) : '')).toUpperCase();
    };

    // --- Info Row Component ---
    const InfoRow = ({ iconName, label, value }: {
        iconName: keyof typeof Ionicons.glyphMap;
        label: string;
        value: string | undefined | null;
    }) => (
        <View style={styles.infoRow}>
            <Ionicons name={iconName} size={22} color={COLORS.iconColor} style={styles.infoIcon} />
            <View style={styles.infoTextContainer}>
                 <Text style={styles.infoLabel}>{label}</Text>
                 <Text style={styles.infoValue}>{value || '-'}</Text>
             </View>
        </View>
    );

    // --- Rendering Logic (Simplified: relies on store having user) ---
    const renderContent = () => {
        if (!user) {
             // Log added here
             console.log('ProfileSettingsScreen renderContent: User is null/undefined. Showing loading.');
            return (
                <View style={styles.centeredContainer}>
                    <ActivityIndicator size="large" color={COLORS.primaryBlue} />
                     <Text style={{marginTop: 10, color: COLORS.textGray}}>Loading Profile...</Text>
                </View>
            );
        }

        // --- We have user data, render the profile ---
        // Log added here
        console.log('ProfileSettingsScreen renderContent: User object found. Rendering profile:', JSON.stringify(user));

        // Directly use the address string from the user object, or default.
        const displayAddress = user.address || 'Not Set';

        return (
             <>
                <View style={styles.avatarSection}>
                     <View style={styles.avatarContainer}>
                        <Text style={styles.avatarText}>{getInitials(user.name)}</Text>
                     </View>
                </View>

                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Personal Information</Text>
                    <InfoRow iconName="person-outline" label="Name" value={user.name} />
                    <InfoRow iconName="mail-outline" label="Email" value={user.email} />
                </View>

                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Address</Text>
                    <InfoRow iconName="location-outline" label="Address" value={displayAddress} />
                     <TouchableOpacity style={styles.manageButton} onPress={handleManageAddress}>
                        <Ionicons name="create-outline" size={18} color={COLORS.primaryBlue} style={styles.buttonIcon} />
                         <Text style={styles.manageButtonText}>Manage Address</Text>
                    </TouchableOpacity>
                </View>

                 <View style={[styles.section, styles.actionsSection]}>
                     <TouchableOpacity style={[styles.actionButton, styles.logoutButton]} onPress={clearAuth}>
                        <Ionicons name="log-out-outline" size={20} color={COLORS.primaryRed} style={styles.buttonIcon} />
                        <Text style={[styles.actionButtonText, styles.logoutText]}>Logout</Text>
                    </TouchableOpacity>
                </View>
            </>
        );
    };

    // --- Address Modal ---
    const renderAddressModal = () => (
        <Modal
            animationType="slide"
            transparent={true}
            visible={isAddressModalVisible}
            onRequestClose={() => {
                if (!isSavingAddress) setIsAddressModalVisible(false);
            }}
        >
            <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                style={styles.modalOverlay}
            >
                <View style={styles.modalContent}>
                    <Text style={styles.modalTitle}>Manage Address</Text>

                    <TextInput
                        style={styles.input}
                        placeholder="Street Address"
                        value={addressForm.street}
                        onChangeText={(text) => setAddressForm({ ...addressForm, street: text })}
                        placeholderTextColor={COLORS.placeholderText}
                        editable={!isSavingAddress}
                    />
                    <TextInput
                        style={styles.input}
                        placeholder="City"
                        value={addressForm.city}
                        onChangeText={(text) => setAddressForm({ ...addressForm, city: text })}
                        placeholderTextColor={COLORS.placeholderText}
                         editable={!isSavingAddress}
                   />
                    <TextInput
                        style={styles.input}
                        placeholder="State"
                        value={addressForm.state}
                        onChangeText={(text) => setAddressForm({ ...addressForm, state: text })}
                        placeholderTextColor={COLORS.placeholderText}
                        autoCapitalize="characters"
                         editable={!isSavingAddress}
                   />
                    <TextInput
                        style={styles.input}
                        placeholder="ZIP Code"
                        value={addressForm.zip}
                        onChangeText={(text) => setAddressForm({ ...addressForm, zip: text })}
                        placeholderTextColor={COLORS.placeholderText}
                        keyboardType="numeric"
                         editable={!isSavingAddress}
                   />

                    {addressSaveError && <Text style={styles.errorTextModal}>{addressSaveError}</Text>}

                    <View style={styles.modalActions}>
                        <TouchableOpacity
                            style={[styles.modalButton, styles.cancelButton]}
                            onPress={() => setIsAddressModalVisible(false)}
                            disabled={isSavingAddress}
                        >
                            <Text style={styles.modalButtonText}>Cancel</Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                            style={[styles.modalButton, styles.saveButton, isSavingAddress && styles.buttonDisabled]}
                            onPress={() => handleSaveAddress(addressForm)}
                            disabled={isSavingAddress}
                        >
                            {isSavingAddress ? (
                                <ActivityIndicator color={COLORS.white} size="small" />
                            ) : (
                                <Text style={[styles.modalButtonText, styles.saveButtonText]}>Save Address</Text>
                            )}
                        </TouchableOpacity>
                    </View>
                </View>
            </KeyboardAvoidingView>
        </Modal>
    );

    return (
        <ScrollView
            style={styles.scrollContainer}
            contentContainerStyle={styles.contentContainer}
            refreshControl={
                <RefreshControl
                    refreshing={isRefreshing}
                    onRefresh={onRefresh}
                    colors={[COLORS.primaryBlue]}
                    tintColor={COLORS.primaryBlue}
                />
            }
            showsVerticalScrollIndicator={false}
        >
            {renderContent()}
            <AddressModal
                isVisible={isAddressModalVisible}
                onClose={() => setIsAddressModalVisible(false)}
                initialAddress={null}
                onSave={handleSaveAddress}
            />
        </ScrollView>
    );
};

const styles = StyleSheet.create({
    scrollContainer: {
        flex: 1,
        backgroundColor: COLORS.lightGray,
    },
    avatarSection: {
        alignItems: 'center',
        marginBottom: 25,
        marginTop: 10, // Add some top margin
    },
    avatarContainer: {
        width: 100,
        height: 100,
        borderRadius: 50,
        backgroundColor: COLORS.avatarBackground,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 10, // Space between avatar and name (if added)
    },
    avatarText: {
         color: COLORS.white,
        fontSize: 36,
        fontWeight: 'bold',
    },
    contentContainer: {
        paddingBottom: 40,
        paddingHorizontal: 16,
        paddingTop: 20,
    },
     centeredContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 30,
    },
    section: {
        backgroundColor: COLORS.sectionBackground,
        borderRadius: 12,
        padding: 18,
        marginBottom: 16,
        borderWidth: 1,
        borderColor: COLORS.borderColor,
    },
    actionsSection: {
         backgroundColor: 'transparent',
         borderWidth: 0,
         padding: 0,
    },
    sectionTitle: {
        fontSize: 18,
        color: COLORS.primaryBlue,
        marginBottom: 12,
        paddingBottom: 6,
        borderBottomWidth: 1,
        borderBottomColor: COLORS.mediumGray,
        fontFamily: 'PlayfairDisplay-Bold',
    },
    infoRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 16,
    },
    infoIcon: {
        marginRight: 18,
        width: 24,
        textAlign: 'center',
        color: COLORS.primaryBlue,
    },
     infoTextContainer: {
        flex: 1,
    },
    infoLabel: {
        fontSize: 16,
        color: COLORS.darkGray,
        marginBottom: 5,
    },
    infoValue: {
        fontSize: 16,
        color: COLORS.darkGray,
    },
    actionButton: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: COLORS.white,
        paddingVertical: 14,
        paddingHorizontal: 20,
        borderRadius: 10,
        borderWidth: 1,
        borderColor: COLORS.mediumGray,
        elevation: 1,
        justifyContent: 'center',
    },
    actionButtonText: {
        fontSize: 16,
        fontWeight: '500',
    },
    buttonIcon: {
         marginRight: 10,
    },
    manageButton: {
        flexDirection: 'row',
        alignItems: 'center',
        alignSelf: 'flex-start',
        marginTop: 10,
        paddingVertical: 8,
        paddingHorizontal: 12,
        backgroundColor: COLORS.white,
        borderWidth: 1,
        borderColor: COLORS.primaryBlue,
        borderRadius: 8,
    },
    manageButtonText: {
        color: COLORS.primaryBlue,
        fontSize: 14,
        fontWeight: '500',
    },
    logoutButton: {
         borderColor: COLORS.errorRed,
    },
    logoutText: {
        color: COLORS.errorRed,
    },
    errorTitle: {
        fontSize: 22,
        fontWeight: 'bold',
        color: COLORS.errorRed,
        marginTop: 15,
        marginBottom: 8,
        textAlign: 'center',
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
        fontWeight: '500',
    },
    modalOverlay: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: COLORS.modalBackground,
    },
    modalContent: {
        width: '90%',
        backgroundColor: COLORS.lightGray,
        borderRadius: 12,
        padding: 25,
        alignItems: 'stretch', // Make children stretch
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.25,
        shadowRadius: 4,
        elevation: 5,
    },
    modalTitle: {
        fontSize: 20,
        marginBottom: 20,
        color: COLORS.darkGray,
        textAlign: 'center',
        fontFamily: 'PlayfairDisplay-Bold',
    },
    input: {
        backgroundColor: COLORS.inputBackground,
        borderWidth: 1,
        borderColor: COLORS.mediumGray,
        borderRadius: 8,
        paddingHorizontal: 15,
        paddingVertical: 12,
        fontSize: 16,
        marginBottom: 15,
        color: COLORS.darkGray,
    },
    modalActions: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginTop: 20,
    },
    modalButton: {
        flex: 1, // Make buttons share space
        paddingVertical: 12,
        borderRadius: 8,
        alignItems: 'center',
        marginHorizontal: 5, // Add spacing between buttons
    },
    cancelButton: {
        backgroundColor: COLORS.white,
        borderWidth: 1,
        borderColor: COLORS.mediumGray,
    },
    saveButton: {
        backgroundColor: COLORS.primaryBlue,
    },
    modalButtonText: {
        fontSize: 16,
        fontWeight: '500',
        color: COLORS.textGray,
    },
    saveButtonText: {
        color: COLORS.white,
        fontSize: 16,
        fontFamily: 'PlayfairDisplay-Bold',
    },
    buttonDisabled: {
        backgroundColor: COLORS.buttonDisabled,
        opacity: 0.7,
    },
     errorTextModal: {
        color: COLORS.errorRed,
        textAlign: 'center',
        marginBottom: 10,
        fontSize: 14,
    },
});

export default ProfileSettingsScreen; 