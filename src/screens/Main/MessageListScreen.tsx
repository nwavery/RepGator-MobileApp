import React, { useEffect, useState, useCallback } from 'react';
import {
    View,
    Text,
    StyleSheet,
    FlatList,
    ActivityIndicator,
    TouchableOpacity,
    RefreshControl,
    // Removed Image, Button
} from 'react-native';
// Import Icon component
import { Ionicons } from '@expo/vector-icons';
import { CompositeScreenProps } from '@react-navigation/native';
import { BottomTabScreenProps } from '@react-navigation/bottom-tabs';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { AppStackParamList, MainTabsParamList } from '../../navigation/AppNavigator'; // Adjust path
import { useMessagesStore, ConversationPreview } from '../../stores/messagesStore'; // Import store and type
// Optional: import useAuthStore to get current user ID if needed for display logic
import { useAuthStore } from '../../stores/authStore';

// Define colors
const COLORS = {
    primaryBlue: '#1A237E',
    primaryRed: '#B71C1C',
    white: '#FFFFFF',
    lightGray: '#F8F9FA',
    mediumGray: '#DEE2E6',
    darkGray: '#343A40',
    textGray: '#6C757D',
    textDark: '#212121', // Define textDark
    errorRed: '#D32F2F',
    cardBackground: '#FFFFFF',
    unreadIndicator: '#1976D2', // Blue for unread
    unreadText: '#1976D2',
    avatarBackground: '#BDBDBD',
};

// Helper function to format date/time (implement more robustly later)
const formatTimestamp = (timestamp: string | undefined | null): string => {
    if (!timestamp) return '';
    try {
        const date = new Date(timestamp);
        // Very basic formatting, consider using a library like date-fns
        const time = date.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
        const day = date.toLocaleDateString([], { month: 'short', day: 'numeric' });
        // Basic logic: show time if today, date otherwise
        if (new Date().toDateString() === date.toDateString()) {
            return time;
        }
        return day;
    } catch (e) {
        return ''; // Handle invalid date format
    }
};

// Update Props type for use in Tab Navigator and potentially Stack
type Props = CompositeScreenProps<
  BottomTabScreenProps<MainTabsParamList, 'Messages'>,
  NativeStackScreenProps<AppStackParamList> // Include stack props for potential parent navigation
>;

const MessageListScreen: React.FC<Props> = ({ navigation }) => {
    const { conversations, status, error, fetchConversations } = useMessagesStore();
    const { user } = useAuthStore(); // Get user to help determine participant name
    const currentUserId = user?.userId;

    // State for pull-to-refresh
    const [isRefreshing, setIsRefreshing] = useState(false);

    // Fetch logic (no changes)
    useEffect(() => {
        // Don't trigger full loading state if just refreshing
        if (!isRefreshing) {
            fetchConversations();
        }
    }, [fetchConversations, isRefreshing]);

    // Refresh handler
    const onRefresh = useCallback(async () => {
        setIsRefreshing(true);
        try {
            await fetchConversations();
        } catch (e) {
            // Error is handled within fetchConversations/store
            console.error("Refresh error:", e);
        } finally {
            setIsRefreshing(false);
        }
    }, [fetchConversations]);

    const getOtherParticipant = (item: ConversationPreview): { id: string, name: string } => {
        // Find the first participant who is not the current user
        const other = item.participants?.find(p => p.id !== currentUserId);
        return other || { id: 'unknown', name: 'Unknown Contact' };
    };

    // Generate simple initials for avatar fallback
    const getInitials = (name: string): string => {
        const parts = name.split(' ');
        if (parts.length === 1) return parts[0].charAt(0).toUpperCase();
        return (parts[0].charAt(0) + (parts.length > 1 ? parts[parts.length - 1].charAt(0) : '')).toUpperCase();
    };

    const renderConversationItem = ({ item }: { item: ConversationPreview }) => {
        const otherParticipant = getOtherParticipant(item);
        const isUnread = item.unreadCount > 0;

        return (
            <TouchableOpacity
                style={styles.conversationItemContainer}
                // Navigate to MessageDetail (defined in AppStack) - Requires Stack navigation context
                onPress={() => navigation.navigate('MessageDetail', { conversationId: item.id })}
            >
                <View style={styles.avatarContainer}>
                     <Text style={styles.avatarText}>{getInitials(otherParticipant.name)}</Text>
                 </View>
                <View style={styles.conversationTextContainer}>
                    <View style={styles.conversationHeader}>
                        <Text style={[styles.participantName, isUnread && styles.participantNameUnread]}>
                             {otherParticipant.name}
                        </Text>
                        <Text style={styles.timestamp}>{formatTimestamp(item.lastMessage?.timestamp)}</Text>
                    </View>
                    <View style={styles.messagePreviewContainer}>
                        <Text
                            style={[styles.lastMessage, isUnread && styles.lastMessageUnread]}
                            numberOfLines={1}
                            ellipsizeMode="tail"
                        >
                            {item.lastMessage ? item.lastMessage.text : 'No messages yet'}
                        </Text>
                        {isUnread && (
                             <View style={styles.unreadIndicator} />
                        )}
                     </View>
                </View>
            </TouchableOpacity>
        );
    };

     if (status === 'loading' && conversations.length === 0) {
        return (
            <View style={styles.centeredContainer}>
                <ActivityIndicator size="large" color={COLORS.primaryBlue} />
                <Text>Loading Conversations...</Text>
            </View>
        );
    }

    if (status === 'error') {
        return (
            <View style={styles.centeredContainer}>
                <Text style={styles.errorTitle}>Error loading conversations:</Text>
                <Text style={styles.errorTextDetail}>{error}</Text>
                 <TouchableOpacity onPress={fetchConversations} style={styles.retryButton}>
                     <Text style={styles.retryButtonText}>Retry</Text>
                 </TouchableOpacity>
            </View>
        );
    }

    return (
        <View style={styles.screenContainer}>
            <FlatList
                style={styles.listContainer}
                data={conversations}
                renderItem={renderConversationItem}
                keyExtractor={(item) => item.id}
                ListEmptyComponent={() => (
                    <View style={styles.centeredContainer}>
                        <Text>Your inbox is empty.</Text>
                    </View>
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
            />
            {/* Floating Action Button for Compose */}
            <TouchableOpacity
                style={styles.fab}
                // Navigate to MessageCompose (defined in AppStack)
                onPress={() => navigation.navigate('MessageCompose', {})}
            >
                 <Ionicons name="pencil" size={24} color={COLORS.white} />
            </TouchableOpacity>
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
        marginBottom: 10,
        fontSize: 16,
    },
    retryButton: {
        backgroundColor: COLORS.primaryBlue,
        paddingVertical: 10,
        paddingHorizontal: 25,
        borderRadius: 20,
        marginTop: 15,
    },
    retryButtonText: {
        color: COLORS.white,
        fontSize: 16,
    },
    listContainer: {
        flex: 1,
        backgroundColor: COLORS.lightGray,
    },
    conversationItemContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 15,
        backgroundColor: COLORS.cardBackground,
        borderBottomWidth: 1,
        borderBottomColor: COLORS.mediumGray,
        position: 'relative', // For absolute positioning of the dot
    },
    avatarContainer: {
        width: 50,
        height: 50,
        borderRadius: 25,
        backgroundColor: COLORS.avatarBackground,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 15,
    },
    avatarText: {
        color: COLORS.white,
        fontSize: 18,
        fontWeight: 'bold', // Keep bold for avatar initials
    },
    conversationTextContainer: {
        flex: 1,
    },
    conversationHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 4,
    },
    participantName: {
        fontSize: 16,
        color: COLORS.darkGray,
        // fontWeight: '500', // Keep 500 or map to regular?
    },
    participantNameUnread: {
        color: COLORS.textDark,
        fontFamily: 'PlayfairDisplay-Bold',
    },
    timestamp: {
        fontSize: 12,
        color: COLORS.textGray,
    },
    messagePreviewContainer: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    lastMessage: {
        fontSize: 14,
        color: COLORS.textGray,
        flexShrink: 1, // Allow text to shrink
    },
    lastMessageUnread: {
        color: COLORS.textDark,
        fontFamily: 'PlayfairDisplay-Bold',
    },
    unreadIndicator: {
        position: 'absolute',
        top: 15,
        right: 15,
        width: 10,
        height: 10,
        borderRadius: 5,
        backgroundColor: COLORS.unreadIndicator,
    },
    separator: {
        height: 1,
        backgroundColor: COLORS.mediumGray,
        marginLeft: 80, // Align with text content (Avatar width + margin)
    },
    emptyText: {
        textAlign: 'center',
        marginTop: 50,
        color: COLORS.textGray,
        fontSize: 16,
    },
    fab: {
        position: 'absolute',
        right: 20,
        bottom: 20,
        backgroundColor: COLORS.primaryRed,
        width: 56,
        height: 56,
        borderRadius: 28,
        justifyContent: 'center',
        alignItems: 'center',
        elevation: 8,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.3,
        shadowRadius: 4,
    },
});

export default MessageListScreen; 