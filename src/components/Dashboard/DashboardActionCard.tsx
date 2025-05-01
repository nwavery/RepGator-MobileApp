import React from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    Image,
    ImageSourcePropType,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

// Define or import COLORS
const COLORS = {
    primaryBlue: '#1A237E',
    white: '#FFFFFF',
    cardBackground: '#FFFFFF',
};

type DashboardActionCardProps = {
    imageSource: ImageSourcePropType;
    buttonText: string;
    iconName: keyof typeof Ionicons.glyphMap;
    onPress: () => void;
};

const DashboardActionCard: React.FC<DashboardActionCardProps> = ({
    imageSource,
    buttonText,
    iconName,
    onPress,
}) => {
    return (
        <View style={styles.findRepContainer}>
            <View style={styles.findRepImageWrapper}>
                <Image
                    source={imageSource}
                    style={styles.findRepImage}
                    resizeMode="cover"
                />
            </View>
            <TouchableOpacity
                style={styles.findRepButton}
                onPress={onPress}
            >
                <Ionicons name={iconName} size={20} color={COLORS.white} style={styles.findRepButtonIcon} />
                <Text style={styles.findRepButtonText}>{buttonText}</Text>
            </TouchableOpacity>
        </View>
    );
};

const styles = StyleSheet.create({
    findRepContainer: {
        marginTop: 25,
        backgroundColor: COLORS.cardBackground,
        borderRadius: 10,
        padding: 0,
        position: 'relative',
        minHeight: 350,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.1,
        shadowRadius: 3,
        elevation: 3,
    },
    findRepImageWrapper: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        height: 350,
        justifyContent: 'center',
        alignItems: 'center',
        borderRadius: 10,
        overflow: 'hidden',
    },
    findRepImage: {
        width: '100%',
        height: '100%',
    },
    findRepButton: {
        position: 'absolute',
        bottom: 90,
        alignSelf: 'center',
        zIndex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: COLORS.primaryBlue,
        paddingVertical: 12,
        paddingHorizontal: 30,
        borderRadius: 25,
        elevation: 4,
    },
    findRepButtonIcon: {
        marginRight: 10,
    },
    findRepButtonText: {
        color: COLORS.white,
        fontSize: 16,
        marginLeft: 10,
        fontFamily: 'PlayfairDisplay-Bold',
    },
});

export default DashboardActionCard; 