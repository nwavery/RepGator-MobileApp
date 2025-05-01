import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

// Define or import COLORS
const COLORS = {
    secondaryBlue: '#535FBF',
    primaryRed: '#B71C1C',
    white: '#FFFFFF',
    mediumGray: '#DEE2E6',
    darkGray: '#343A40',
    cardBackground: '#FFFFFF',
};

type DashboardQuickActionsProps = {
    onNavigateProfile: () => void;
    onLogout: () => void;
};

const DashboardQuickActions: React.FC<DashboardQuickActionsProps> = ({ onNavigateProfile, onLogout }) => {
    return (
        <View style={styles.actionsContainer}>
            <TouchableOpacity style={[styles.actionButton, styles.profileButton]} onPress={onNavigateProfile}>
                <Ionicons name="person-circle-outline" size={20} color={COLORS.white} style={styles.actionIcon} />
                <Text style={[styles.actionButtonText, styles.profileButtonText]}>My Profile</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.actionButton, styles.logoutButton]} onPress={onLogout}>
                <Ionicons name="log-out-outline" size={20} color={COLORS.darkGray} style={styles.actionIcon} />
                <Text style={[styles.actionButtonText, styles.logoutText]}>Logout</Text>
            </TouchableOpacity>
        </View>
    );
};

const styles = StyleSheet.create({
    actionsContainer: {
        marginTop: 25,
        backgroundColor: COLORS.cardBackground,
        borderRadius: 10,
        padding: 20,
    },
    actionButton: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 14,
        paddingHorizontal: 20,
        borderRadius: 10,
        marginBottom: 12,
        borderWidth: 1,
        borderColor: COLORS.mediumGray,
    },
    profileButton: {
        backgroundColor: COLORS.secondaryBlue,
        borderColor: COLORS.secondaryBlue,
        elevation: 2,
    },
    profileButtonText: {
        color: COLORS.white,
        fontSize: 16, // Ensure consistency
        fontWeight: '500',
    },
    logoutButton: {
        backgroundColor: COLORS.primaryRed,
        borderColor: COLORS.primaryRed,
    },
    actionIcon: {
        marginRight: 15,
    },
    actionButtonText: {
        fontSize: 16,
        marginLeft: 12,
        color: COLORS.darkGray,
    },
    logoutText: {
        color: COLORS.darkGray,
    },
});

export default DashboardQuickActions; 