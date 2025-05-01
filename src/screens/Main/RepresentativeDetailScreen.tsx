import React, { useState, useEffect, useCallback } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    ActivityIndicator,
    Image,
    Button,
    TouchableOpacity,
    Linking, // To open websites
} from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { AppStackParamList } from '../../navigation/AppNavigator'; // Adjust path
import { RepresentativeListItem } from '../../services/apiClient';
import { Ionicons } from '@expo/vector-icons';

// Reuse or define colors
const COLORS = {
  primaryBlue: '#0A3161', // Darker, richer blue
  accentRed: '#B71C1C',   // Deep red for accents
  white: '#FFFFFF',
  lightGray: '#ECEFF1', // Lighter gray for background
  mediumGray: '#B0BEC5', // Softer medium gray
  darkGray: '#37474F',   // Slightly softer dark gray
  textGray: '#546E7A',   // Muted text gray
  errorRed: '#D32F2F',
  partyDemocrat: '#1976D2', // Standard Dem blue
  partyRepublican: '#D32F2F', // Standard Rep red
  partyIndependent: '#78909C', // Neutral gray for Independent
  sectionBackground: '#FFFFFF',
  iconColor: '#546E7A', // Use textGray
  borderColor: '#CFD8DC', // Light border color
};

type Props = NativeStackScreenProps<AppStackParamList, 'RepresentativeDetail'>;

const RepresentativeDetailScreen: React.FC<Props> = ({ route, navigation }) => {
    // Get the representative object passed during navigation
    const { representative } = route.params;

    // Add a basic check if representative data is missing (shouldn't happen with TS)
    if (!representative) {
        return (
            <View style={styles.centeredContainer}>
                <Ionicons name="alert-circle-outline" size={60} color={COLORS.errorRed} />
                <Text style={styles.errorTitle}>Error</Text>
                <Text style={styles.errorTextDetail}>Representative data not found.</Text>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.retryButton}>
                   <Ionicons name="arrow-back-outline" size={20} color={COLORS.white} />
                   <Text style={styles.retryButtonText}>Back to List</Text>
                </TouchableOpacity>
            </View>
        );
    }

    const getPartyColor = (party?: string): string => {
        // Use representative.party
        if (!party) return COLORS.partyIndependent;
        const lowerParty = party.toLowerCase();
        if (lowerParty === 'd') return COLORS.partyDemocrat; // Use abbreviations
        if (lowerParty === 'r') return COLORS.partyRepublican;
        return COLORS.partyIndependent;
    };

    const handleOpenUrl = (url?: string) => {
        if (url) {
            const safeUrl = url.startsWith('http') ? url : `https://${url}`;
            Linking.openURL(safeUrl).catch(err => console.error("Couldn't load page", err));
        }
    };

    const getInitials = (firstName?: string, lastName?: string): string => {
        // Use representative fields
        if (!firstName) return '?';
        const firstInitial = firstName.charAt(0).toUpperCase();
        const lastInitial = lastName ? lastName.charAt(0).toUpperCase() : '';
        return firstInitial + lastInitial;
    };

    // --- Render Success State (Now uses `representative` prop directly) ---
    // Use representative fields directly
    const fullName = representative.name || `${representative.firstName} ${representative.lastName}`;
    return (
        <ScrollView style={styles.scrollContainer} contentContainerStyle={styles.contentContainer}>
            {/* Header with Name, Title, Party */}
            <View style={styles.headerContainer}>
                 <View style={styles.avatarContainer}>
                     <Text style={styles.avatarText}>{getInitials(representative.firstName, representative.lastName)}</Text>
                 </View>

                <Text style={styles.repName}>{fullName}</Text>
                <Text style={styles.repTitle}>{representative.type}</Text>
                 {/* Use representative.party */}
                <View style={[styles.partyBanner, { backgroundColor: getPartyColor(representative.party) }]}>
                    {/* Use representative.party (displaying abbreviation might be fine here?) */}
                    <Text style={styles.partyText}>{representative.party}</Text>
                </View>
            </View>

            {/* Details Section */}
            <View style={styles.section}>
                <Text style={styles.sectionTitle}>Details</Text>
                {/* Use representative.state */}
                <InfoRow label="State:" value={representative.state} />
                {/* District/Class info might not be in ListItem, check API response if needed */}
                {/* {representative.districtId && <InfoRow label="District:" value={representative.districtId} />} */}
                {/* {representative.class && <InfoRow label="Senate Class:" value={representative.class} />} */}
            </View>

            {/* Contact Info Section */}
            {/* Use representative.phone, representative.website, and representative.email */}
            {(representative.phone || representative.website || representative.email) && (
                 <View style={styles.section}>
                     <Text style={styles.sectionTitle}>Contact Information</Text>
                     {representative.phone && (
                         <TouchableOpacity onPress={() => Linking.openURL(`tel:${representative.phone}`)} style={styles.infoRow}>
                            <Ionicons name="call-outline" size={18} color={COLORS.iconColor} style={styles.infoIcon} />
                            <Text style={styles.contactLink}>{representative.phone}</Text>
                         </TouchableOpacity>
                     )}
                     {representative.website && (
                         <TouchableOpacity onPress={() => handleOpenUrl(representative.website)} style={styles.infoRow}>
                            <Ionicons name="globe-outline" size={18} color={COLORS.iconColor} style={styles.infoIcon} />
                             <Text style={styles.contactLink}>{representative.website}</Text>
                         </TouchableOpacity>
                     )}
                    {/* Added Email Row */}
                     {representative.email && (
                         <TouchableOpacity onPress={() => handleOpenUrl(representative.email)} style={styles.infoRow}>
                             <Ionicons name="mail-outline" size={18} color={COLORS.iconColor} style={styles.infoIcon} />
                             <Text style={styles.contactLink}>{representative.email}</Text>
                         </TouchableOpacity>
                     )}
                 </View>
             )}

        </ScrollView>
    );
};

// Helper component for consistent row display
const InfoRow: React.FC<{ label: string; value?: string | null }> = ({ label, value }) => {
    if (!value) return null;
    return (
        <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>{label}</Text>
            <Text style={styles.infoValue}>{value}</Text>
        </View>
    );
};

const styles = StyleSheet.create({
    centeredContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 20,
        backgroundColor: COLORS.lightGray,
    },
    scrollContainer: {
        flex: 1,
        backgroundColor: COLORS.lightGray,
    },
    contentContainer: {
        paddingBottom: 30, // Ensure spacing at the bottom
    },
    headerContainer: {
        alignItems: 'center',
        paddingVertical: 20,
        paddingHorizontal: 15,
        backgroundColor: COLORS.primaryBlue, // Use primary blue for header background
        marginBottom: 20,
    },
    avatarContainer: {
        width: 100,
        height: 100,
        borderRadius: 50,
        marginBottom: 15,
        backgroundColor: COLORS.mediumGray, // Placeholder background
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 4, // Thicker border
        borderColor: COLORS.white, // White border stands out on blue
        shadowColor: "#000", // Add subtle shadow
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.2,
        shadowRadius: 3,
        elevation: 5,
    },
    avatarText: {
        fontSize: 40,
        color: COLORS.white,
        fontFamily: 'PlayfairDisplay-Bold',
    },
    repName: {
        fontSize: 26, // Slightly larger
        color: COLORS.white,
        textAlign: 'center',
        marginBottom: 4,
        fontFamily: 'PlayfairDisplay-Bold',
    },
    repTitle: {
        fontSize: 18,
        color: COLORS.lightGray, // Lighter text on dark blue
        fontStyle: 'italic', // Add italic style
        marginBottom: 12, // More space before party banner
    },
    partyBanner: {
        paddingVertical: 6, // Adjusted padding
        paddingHorizontal: 18, // Adjusted padding
        borderRadius: 20, // More rounded
        elevation: 3, // Add elevation
    },
    partyText: {
        color: COLORS.white,
        fontSize: 14,
        textTransform: 'uppercase',
        fontFamily: 'PlayfairDisplay-Bold',
    },
    section: {
        backgroundColor: COLORS.sectionBackground,
        marginHorizontal: 15,
        marginBottom: 15,
        padding: 18, // Increased padding
        borderRadius: 10, // Slightly more rounded corners
        borderWidth: 1, // Add border
        borderColor: COLORS.borderColor, // Use defined border color
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.08, // Subtle shadow
        shadowRadius: 2,
        elevation: 2,
    },
    sectionTitle: {
        fontSize: 19, // Slightly larger
        color: COLORS.accentRed, // Use accent red for section titles
        marginBottom: 15, // More space below title
        borderBottomWidth: 2, // Thicker border
        borderBottomColor: COLORS.accentRed, // Match title color
        paddingBottom: 8, // More padding below text
        fontFamily: 'PlayfairDisplay-Bold', // APPLY bold font family
    },
    infoRow: {
        flexDirection: 'row',
        alignItems: 'flex-start', // Align items to the start for potentially longer text
        marginBottom: 10, // Increased spacing
        // Removed minWidth from infoLabel, relying on flexbox
    },
    infoLabel: {
        fontSize: 16,
        color: COLORS.textGray,
        marginRight: 8,
        width: 110, // Set fixed width for label alignment
    },
    infoValue: {
        fontSize: 16,
        color: COLORS.darkGray,
        flex: 1, // Allow value to take remaining space
    },
    infoIcon: {
       marginRight: 10,
       marginTop: 2, // Align icon slightly better with text line
    },
    contactLink: {
        fontSize: 16,
        color: COLORS.primaryBlue, // Keep links blue
        textDecorationLine: 'underline',
        flex: 1, // Allow link text to take space and wrap
    },
    // Error styles
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
         marginTop: 10,
     },
     retryButtonText: {
         color: COLORS.white,
         fontSize: 16,
         marginLeft: 10,
     },
    // ... other styles ...
});

export default RepresentativeDetailScreen; 