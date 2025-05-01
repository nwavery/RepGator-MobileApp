import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    Modal,
    TextInput,
    TouchableOpacity,
    ActivityIndicator,
    KeyboardAvoidingView,
    Platform,
    Alert, // Added for potential internal alerts if needed
} from 'react-native';
import { Ionicons } from '@expo/vector-icons'; // Assuming icons are used

// Define colors locally or import from theme
const COLORS = {
    primaryBlue: '#1A237E',
    white: '#FFFFFF',
    lightGray: '#F8F9FA',
    mediumGray: '#DEE2E6',
    darkGray: '#343A40',
    textGray: '#6C757D',
    errorRed: '#D32F2F',
    modalBackground: 'rgba(0, 0, 0, 0.5)',
    inputBackground: '#FFFFFF',
    placeholderText: '#ADB5BD',
    buttonDisabled: '#CED4DA',
};

// Address type expected as prop and used internally
export type Address = {
    street: string;
    city: string;
    state: string;
    zip: string;
};

type AddressModalProps = {
    isVisible: boolean;
    onClose: () => void;
    initialAddress: Address | null;
    // onSave receives the address data, returns Promise<void> to handle async ops
    onSave: (addressData: Address) => Promise<void>;
};

const AddressModal: React.FC<AddressModalProps> = ({
    isVisible,
    onClose,
    initialAddress,
    onSave,
}) => {
    // Internal state for the form, saving status, and errors
    const [addressForm, setAddressForm] = useState<Address>({ street: '', city: '', state: '', zip: '' });
    const [isSavingAddress, setIsSavingAddress] = useState(false);
    const [addressSaveError, setAddressSaveError] = useState<string | null>(null);

    // Update internal form state when initialAddress prop changes (e.g., when modal opens)
    useEffect(() => {
        setAddressForm(initialAddress || { street: '', city: '', state: '', zip: '' });
        setAddressSaveError(null); // Clear errors when modal re-opens/props change
    }, [initialAddress, isVisible]); // Depend on isVisible ensure reset on open

    const handleInternalSave = async () => {
        if (isSavingAddress) return;

        setIsSavingAddress(true);
        setAddressSaveError(null);

        try {
            // Call the onSave prop passed from the parent, which handles the API call
            await onSave(addressForm);
            // Parent component will handle closing on success via Alert or state change
            // onClose(); // Or close directly if preferred
        } catch (saveError: any) {
            console.error('AddressModal: Error during save callback:', saveError);
            setAddressSaveError(saveError.message || 'Could not update address. Please try again.');
            // Keep modal open to show error
        } finally {
            setIsSavingAddress(false);
        }
    };

    return (
        <Modal
            animationType="slide"
            transparent={true}
            visible={isVisible}
            onRequestClose={() => {
                if (!isSavingAddress) onClose(); // Use onClose prop
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
                            onPress={onClose} // Use onClose prop
                            disabled={isSavingAddress}
                        >
                            <Text style={styles.modalButtonText}>Cancel</Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                            style={[styles.modalButton, styles.saveButton, isSavingAddress && styles.buttonDisabled]}
                            onPress={handleInternalSave} // Call internal save handler
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
};

// Copy relevant styles from ProfileSettingsScreen
const styles = StyleSheet.create({
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
        alignItems: 'stretch',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.25,
        shadowRadius: 4,
        elevation: 5,
    },
    modalTitle: {
        fontSize: 20,
        color: COLORS.darkGray,
        marginBottom: 20,
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
        flex: 1,
        paddingVertical: 12,
        borderRadius: 8,
        alignItems: 'center',
        marginHorizontal: 5,
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
        color: COLORS.textGray,
    },
    saveButtonText: {
         color: COLORS.white,
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

export default AddressModal; 