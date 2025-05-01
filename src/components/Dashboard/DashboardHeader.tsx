import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { formatDistrictId } from '../../utils/formatters'; // Adjust path if needed
import { parseISO, isValid, format } from 'date-fns';

// Define or import COLORS - For simplicity, copying relevant ones for now
const COLORS = {
    primaryBlue: '#1A237E',
    secondaryBlue: '#535FBF',
    white: '#FFFFFF',
    darkGray: '#343A40',
    textGray: '#6C757D',
    cardBackground: '#FFFFFF',
    iconColor: '#495057',
};

type DashboardHeaderProps = {
    userName?: string | null;
    districtId: string;
};

// Simple initials helper (can be made more robust)
const getInitials = (name: string | undefined | null): string => {
    if (!name) return '?';
    const parts = name.trim().split(' ');
    if (parts.length === 1) return parts[0].charAt(0).toUpperCase();
    return (parts[0].charAt(0) + (parts.length > 1 ? parts[parts.length - 1].charAt(0) : '')).toUpperCase();
};


const DashboardHeader: React.FC<DashboardHeaderProps> = ({ userName, districtId }) => {
    return (
        <View style={styles.headerContainer}>
            <View style={styles.avatarContainer}>
                {/* Using initials as fallback */}
                 <Text style={styles.avatarText}>{getInitials(userName)}</Text>
                {/* Alternate: Use a static icon if you prefer */}
                {/* <Ionicons name="person-outline" size={24} color={COLORS.white} /> */}
            </View>
            <View style={styles.headerTextContainer}>
                <Text style={styles.welcomeMessage}>Welcome, {userName || 'User'}!</Text>
                <Text style={styles.districtInfo}>
                    {formatDistrictId(districtId)}
                </Text>
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    headerContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 5,
        backgroundColor: COLORS.cardBackground,
        padding: 15,
        borderRadius: 10,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.15,
        shadowRadius: 4,
        elevation: 4,
    },
    avatarContainer: {
        width: 60,
        height: 60,
        borderRadius: 25,
        backgroundColor: COLORS.secondaryBlue,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 15,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.15,
        shadowRadius: 4,
        elevation: 4,
    },
    avatarText: {
        color: COLORS.white,
        fontSize: 18,
        fontWeight: 'bold',
    },
    headerTextContainer: {
        flex: 1,
    },
    welcomeMessage: {
        fontSize: 20,
        color: COLORS.darkGray,
        marginBottom: 2,
        fontFamily: 'PlayfairDisplay-Bold',
    },
    districtInfo: {
        fontSize: 16,
        color: COLORS.textGray,
        fontFamily: 'PlayfairDisplay-Regular',
    },
});

export default DashboardHeader; 