import React, { useState, useEffect, useCallback } from 'react';
import {
    View,
    Text,
    TextInput,
    TouchableOpacity,
    FlatList,
    StyleSheet,
    KeyboardAvoidingView,
    Platform,
    ActivityIndicator,
    Alert,
} from 'react-native';
import { NativeStackScreenProps, NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RouteProp } from '@react-navigation/native';
import { AppStackParamList } from '../../navigation/AppNavigator'; // Adjust path as necessary
import { useMessagesStore, Message, ConversationPreview } from '../../stores/messagesStore'; // Adjust path as necessary
import { useAuthStore } from '../../stores/authStore'; // Adjust path as necessary
import { sendMessage, SendMessageRequest, SendMessageResponse } from '../../services/apiClient';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
// import styles from '../../styles/styles'; // Assuming styles are defined here or adjust path

// Define colors locally or import from theme
const COLORS = {
    primaryBlue: '#1A237E',
    white: '#FFFFFF',
    lightGray: '#f0f0f0',
    mediumGray: '#ccc',
    darkGray: '#333',
    errorRed: '#D32F2F',
    myMessageBubble: '#DCF8C6',
    theirMessageBubble: '#FFFFFF',
    sendButton: '#007bff',
    sendButtonDisabled: '#a0cfff',
    failedBorder: '#D32F2F',
    failedBackground: '#FFEBEE',
    failedText: '#D32F2F',
    avatarBackground: '#BDBDBD', // Added for avatar
    senderName: '#333', // Added for sender color
};

// Define type for route params expected by this screen
type MessageViewScreenRouteProp = RouteProp<AppStackParamList, 'MessageDetail'>;

// Define type for navigation prop
type MessageViewScreenNavigationProp = NativeStackNavigationProp<AppStackParamList, 'MessageDetail'>;

type Props = {
    route: MessageViewScreenRouteProp;
    navigation: MessageViewScreenNavigationProp;
};

const MessageViewScreen: React.FC<Props> = ({ route, navigation }) => {
    const conversationId = route.params?.conversationId;
    // Get conversations, messages, and actions from the store
    const { conversations, messages, fetchMessages, addMessage, updateSentMessage } = useMessagesStore(
        (state) => ({
            conversations: state.conversations, // Get the list of conversations
            messages: state.messages[conversationId] || [],
            fetchMessages: state.fetchMessages,
            addMessage: state.addMessage,
            updateSentMessage: state.updateSentMessage, // Get action
        })
    );
    const { user } = useAuthStore(); // Get logged-in user from auth store
    const [newMessage, setNewMessage] = useState('');
    const [isSending, setIsSending] = useState(false); // Add state for sending status

    // State for initial message fetching
    const [isLoadingMessages, setIsLoadingMessages] = useState(true); // Start loading initially
    const [fetchError, setFetchError] = useState<string | null>(null);

    const currentUserId = user?.userId; // Use userId from user object

    // Find the current conversation details and recipient
    const currentConversation = React.useMemo(() => {
        return conversations.find(conv => conv.id === conversationId);
    }, [conversations, conversationId]);

    const recipient = React.useMemo(() => {
        if (!currentConversation || !currentUserId) {
            return null;
        }
        // Find the participant who is not the current user
        return currentConversation.participants.find(p => p.id !== currentUserId);
    }, [currentConversation, currentUserId]);

    const recipientId = recipient?.id; // Get the recipient's ID

    // Effect for fetching messages
    const loadMessages = useCallback(async () => {
        if (!conversationId || !currentUserId) {
            // Cannot load without conversation ID or user
            setIsLoadingMessages(false); // Stop loading if conditions aren't met
            if (!currentUserId) {
                console.warn('MessageViewScreen: User ID not available.');
                 // Potentially set an error state here?
            }
            return;
        }

        // Fetch conversations if needed (e.g., if currentConversation is not found)
        // This might indicate the conversation list isn't loaded yet.
        if (!currentConversation) {
            console.warn('MessageViewScreen: Conversation details not found in store.');
            // TODO: Maybe trigger fetchConversations here? Or ensure it runs earlier.
        }

        setIsLoadingMessages(true);
        setFetchError(null);
        try {
            console.log(`Fetching messages for ${conversationId}...`);
            await fetchMessages(conversationId);
             console.log(`Messages fetched successfully for ${conversationId}.`);
        } catch (err: any) {
            console.error(`Failed to fetch messages for ${conversationId}:`, err);
            setFetchError(err.message || 'Failed to load messages. Please try again.');
        } finally {
            setIsLoadingMessages(false);
        }
    }, [conversationId, currentUserId, fetchMessages, currentConversation]);

    useEffect(() => {
        loadMessages();
    }, [loadMessages]); // Rerun loadMessages if any dependency changes

    // --- Helper for Initials ---
    const getInitials = (name: string | undefined): string => {
        if (!name) return '?';
        const parts = name.trim().split(' ');
        if (parts.length === 1) return parts[0].charAt(0).toUpperCase();
        return (parts[0].charAt(0) + (parts.length > 1 ? parts[parts.length - 1].charAt(0) : '')).toUpperCase();
    };

    // --- Get Participant Name by ID ---
    // Create a lookup map for efficiency
    const participantMap = React.useMemo(() => {
        const map = new Map<string, string>();
        currentConversation?.participants.forEach(p => {
            map.set(p.id, p.name || 'Unknown');
        });
        return map;
    }, [currentConversation]);

    const handleSendMessage = useCallback(async () => {
        // Ensure we have a user, message content, and a found recipient ID
        if (!currentUserId || !recipientId || newMessage.trim() === '') {
            console.log('Cannot send message. Missing userId, recipientId, or message content.');
            if (!recipientId) {
                 console.error('Could not determine recipient for this conversation.');
                 Alert.alert('Error', 'Could not determine recipient.'); // Notify user
            }
            return;
        }

        setIsSending(true); // Set sending status
        const tempId = `temp-${Date.now()}`;
        // Use the dynamically found recipientId
        const optimisticMessage: Message = {
            id: tempId, // Temporary ID
            conversationId: conversationId,
            senderId: currentUserId,
            recipientId: recipientId,
            text: newMessage.trim(),
            timestamp: new Date().toISOString(),
            isRead: false,
            sendStatus: 'sending', // Initial status: sending
        };

        // Optimistically add message to the store
        addMessage(conversationId, optimisticMessage);
        setNewMessage('');

        try {
            // Construct request data for the API
            const apiRequestData: SendMessageRequest = {
                recipientId: recipientId, // Use dynamic recipient ID
                text: optimisticMessage.text,
            };

            console.log('Sending message via API:', apiRequestData);
            // Explicitly type the response
            const confirmedMessage: SendMessageResponse = await sendMessage(apiRequestData);

            console.log('Message sent successfully, confirmed message:', confirmedMessage);
            // Update message in store with real ID and status 'sent'
            updateSentMessage(conversationId, tempId, confirmedMessage, 'sent');

        } catch (error: any) {
            console.error("Failed to send message via API:", error);
            // Update message in store with status 'failed'
            updateSentMessage(conversationId, tempId, null, 'failed');
            // Show user feedback about the failure
            Alert.alert('Send Failed', error.message || 'Could not send message. Please check your connection and try again.');
        } finally {
             setIsSending(false);
        }
    }, [newMessage, conversationId, currentUserId, recipientId, addMessage, updateSentMessage]); // Add recipientId to dependencies

    const renderMessage = ({ item }: { item: Message }) => {
        const isMyMessage = item.senderId === currentUserId;
        const senderName = participantMap.get(item.senderId) || 'Unknown';

        return (
             <View style={[styles.messageRow, isMyMessage ? styles.myMessageRow : styles.theirMessageRow]}>
                 {!isMyMessage && (
                    <View style={styles.avatarContainer}>
                         <Text style={styles.avatarText}>{getInitials(senderName)}</Text>
                     </View>
                 )}
                 <View
             style={[
                 styles.messageBubble,
                 isMyMessage
                     ? styles.myMessageBubbleStyle // Renamed style for clarity
                     : styles.theirMessageBubbleStyle, // Renamed style for clarity
                 // Add styles based on sendStatus
                 item.sendStatus === 'sending' && styles.sendingMessage,
                 item.sendStatus === 'failed' && styles.failedMessage,
             ]}
         >
             <Text style={styles.messageText}>{item.text}</Text>
             {/* Optional: Display timestamp or status indicator */}
             {item.sendStatus === 'failed' && <Text style={styles.failedText}>!</Text>}
         </View>
         {isMyMessage && (
            <View style={styles.avatarContainer}>
                 <Text style={styles.avatarText}>{getInitials(user?.name)}</Text>
             </View>
         )}
     </View>
     );
    };

    // --- Content Rendering Logic ---
    const renderContent = () => {
        if (isLoadingMessages) {
            return (
                <View style={styles.centeredContainer}>
                    <ActivityIndicator size="large" color={COLORS.primaryBlue} />
                    <Text style={styles.loadingText}>Loading Messages...</Text>
                </View>
            );
        }

        if (fetchError) {
             return (
                <View style={styles.centeredContainer}>
                    <Text style={styles.errorTitle}>Error Loading Messages</Text>
                    <Text style={styles.errorTextDetail}>{fetchError}</Text>
                    <TouchableOpacity style={styles.retryButton} onPress={loadMessages}>
                        <Text style={styles.retryButtonText}>Retry</Text>
                    </TouchableOpacity>
                </View>
             );
        }

        // Render message list if not loading and no error
        return (
            <FlatList
                data={messages}
                renderItem={renderMessage}
                keyExtractor={(item) => item.id}
                style={styles.messageList}
                contentContainerStyle={styles.messageListContent} // Add padding at bottom
                inverted // Show newest messages at the bottom
                extraData={messages.length}
                ListEmptyComponent={
                    <View style={styles.centeredContainer}>
                        <Text>No messages yet.</Text>
                    </View>
                }
            />
        );
    };

    return (
        <KeyboardAvoidingView
            style={styles.container}
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0} // Adjust offset as needed
        >
           {renderContent()}

            {/* Only show input if messages loaded successfully */}
            {!isLoadingMessages && !fetchError && (
                <View style={styles.inputContainer}>
                    <TextInput
                        style={styles.input}
                        value={newMessage}
                        onChangeText={setNewMessage}
                        placeholder="Type a message..."
                        onSubmitEditing={handleSendMessage} // Send on keyboard submit
                        editable={!isSending && !!currentUserId} // Disable input while sending or if no user
                        multiline // Allow multiline input
                    />
                    <TouchableOpacity
                        style={[styles.sendButton, (isSending || !currentUserId || newMessage.trim() === '') && styles.disabledButton]} // Added disabled style
                        onPress={handleSendMessage}
                        disabled={isSending || !currentUserId || newMessage.trim() === ''} // Disable button
                    >
                        {isSending ? (
                            <ActivityIndicator size="small" color={COLORS.white} /> // Show indicator while sending
                        ) : (
                            <Text style={styles.sendButtonText}>Send</Text>
                        )}
                    </TouchableOpacity>
                </View>
            )}
        </KeyboardAvoidingView>
    );
};

// Basic styling - consider moving to a separate styles file
const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: COLORS.lightGray, // Light grey background
    },
    centeredContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 20,
    },
    loadingText: {
        marginTop: 10,
        color: COLORS.darkGray,
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
        fontSize: 14,
        color: COLORS.errorRed,
        textAlign: 'center',
        marginBottom: 20,
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
    },
    messageList: {
        flex: 1,
        paddingHorizontal: 10,
    },
    messageListContent: {
        paddingBottom: 10, // Add padding to the bottom of the list
    },
    messageRow: {
        flexDirection: 'row',
        marginVertical: 5,
        marginHorizontal: 10,
        alignItems: 'flex-end', // Align avatar and bubble bottom
    },
    myMessageRow: {
        justifyContent: 'flex-end',
    },
    theirMessageRow: {
        justifyContent: 'flex-start',
    },
    avatarContainer: {
        width: 30, // Smaller avatar for messages
        height: 30,
        borderRadius: 15,
        backgroundColor: COLORS.avatarBackground,
        justifyContent: 'center',
        alignItems: 'center',
        marginHorizontal: 8,
    },
    avatarText: {
         color: COLORS.white,
        fontSize: 12,
        fontWeight: 'bold',
    },
    messageBubble: {
        paddingVertical: 8,
        paddingHorizontal: 12,
        borderRadius: 15,
        maxWidth: '75%', // Limit bubble width
    },
    myMessageBubbleStyle: {
        backgroundColor: COLORS.myMessageBubble,
        borderBottomRightRadius: 5, // Typical chat bubble style
    },
    theirMessageBubbleStyle: {
        backgroundColor: COLORS.theirMessageBubble,
        borderBottomLeftRadius: 5, // Typical chat bubble style
    },
    messageText: {
        fontSize: 16,
        color: COLORS.darkGray,
        fontFamily: 'PlayfairDisplay-Bold',
    },
    inputContainer: {
        flexDirection: 'row',
        paddingVertical: 8, // Adjust padding
        paddingHorizontal: 10,
        borderTopWidth: 1,
        borderTopColor: COLORS.mediumGray,
        backgroundColor: '#fff',
        alignItems: 'flex-end', // Align items bottom for multiline
    },
    input: {
        flex: 1,
        borderWidth: 1,
        borderColor: COLORS.mediumGray,
        borderRadius: 20,
        paddingHorizontal: 15,
        paddingVertical: Platform.OS === 'ios' ? 10 : 8,
        paddingTop: Platform.OS === 'ios' ? 10 : 8, // Ensure consistent padding top for multiline
        marginRight: 10,
        backgroundColor: '#fff',
        fontSize: 16,
        maxHeight: 100, // Limit input height
    },
    sendButton: {
        backgroundColor: COLORS.sendButton,
        borderRadius: 20,
        width: 40, // Circular button
        height: 40,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: Platform.OS === 'ios' ? 0 : 4, // Align with input bottom on Android
    },
    sendButtonText: {
        color: COLORS.white,
        fontSize: 16,
        fontFamily: 'PlayfairDisplay-Bold',
    },
    disabledButton: {
        backgroundColor: COLORS.sendButtonDisabled,
    },
    // Styles for message status
    sendingMessage: {
        opacity: 0.7, // Dim sending messages
    },
    failedMessage: {
        borderColor: COLORS.failedBorder, // Red border for failed messages
        borderWidth: 1,
        backgroundColor: COLORS.failedBackground, // Light red background
    },
    failedText: {
      color: COLORS.failedText,
      fontWeight: 'bold',
      fontSize: 14,
      position: 'absolute',
      right: -5, // Position outside bubble slightly
      bottom: -5,
      backgroundColor: COLORS.lightGray, // Background to lift it off bubble
      borderRadius: 8,
      paddingHorizontal: 4,
      overflow: 'hidden', // Hide parts of circle for ! effect
    },
});

export default MessageViewScreen; 