import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TextInput,
    FlatList,
    ActivityIndicator,
    TouchableOpacity,
    KeyboardAvoidingView,
    Platform,
    Alert,
    Keyboard, // Import Keyboard
} from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { AppStackParamList } from '../../navigation/AppNavigator'; // Adjust path
import { getMessagesForConversation, sendMessage } from '../../services/apiClient';
import { Message } from '../../stores/messagesStore';
import { useAuthStore } from '../../stores/authStore'; // To get current user ID

// Reuse or define colors
const COLORS = {
    primaryBlue: '#1A237E',
    primaryRed: '#B71C1C',
    white: '#FFFFFF',
    lightGray: '#F5F5F5',
    mediumGray: '#BDBDBD',
    darkGray: '#212121',
    textGray: '#757575',
    errorRed: '#D32F2F',
    myMessageBackground: '#DCF8C6', // Light green for user messages
    otherMessageBackground: '#FFFFFF', // White for other messages
    inputBackground: '#FFFFFF',
    senderName: '#000', // Placeholder for sender color
};

// Helper function to format time (consider moving to utils)
const formatMessageTime = (timestamp: string): string => {
    try {
        return new Date(timestamp).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
    } catch (e) {
        return '';
    }
};

// Correct Props type for Stack Navigator screen
type Props = NativeStackScreenProps<AppStackParamList, 'MessageDetail'>;

const MessageViewScreen: React.FC<Props> = ({ route, navigation }) => {
    const { conversationId } = route.params;
    const [messages, setMessages] = useState<Message[]>([]);
    const [status, setStatus] = useState<'idle' | 'loading' | 'error' | 'success'>('idle');
    const [error, setError] = useState<string | null>(null);
    const [newMessage, setNewMessage] = useState('');
    const [sendingStatus, setSendingStatus] = useState<'idle' | 'sending' | 'error'>('idle');
    const [sendingError, setSendingError] = useState<string | null>(null);

    // Get user ID to determine message alignment and sender info for sending
    // TODO: Make sure user object with ID is available in authStore
    // const currentUserId = useAuthStore(state => state.user?.id) || 'temp-user-id';
    const currentUserId = 'temp-user-id'; // Placeholder ID - REPLACE THIS

    const flatListRef = useRef<FlatList>(null); // Ref for scrolling

    // --- Fetching Logic ---
    const fetchMessages = useCallback(async () => {
        if (status === 'loading') return;
        setStatus('loading');
        setError(null);
        try {
            const fetchedMessages = await getMessagesForConversation(conversationId);
            // Sort messages by timestamp (oldest first for chat view)
            const sortedMessages = fetchedMessages.sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
            setMessages(sortedMessages);
            setStatus('success');
        } catch (apiError: any) {
            console.error('Failed to fetch messages:', apiError);
            setError(apiError.message || 'Failed to load messages.');
            setStatus('error');
        }
    }, [conversationId, status]);

    useEffect(() => {
        fetchMessages();
        // TODO: Implement polling or WebSocket for real-time updates
    }, [fetchMessages]);

    // Scroll to bottom when messages load or new message is added
    useEffect(() => {
        if (messages.length > 0) {
            setTimeout(() => flatListRef.current?.scrollToEnd({ animated: true }), 100);
        }
    }, [messages]);

    // --- Sending Logic ---
    const handleSend = async () => {
        if (!newMessage.trim() || sendingStatus === 'sending') return;

        setSendingStatus('sending');
        setSendingError(null);
        Keyboard.dismiss(); // Dismiss keyboard on send

        // TODO: Determine the actual recipientId for the message
        // This might require fetching conversation details or finding the other participant
        const recipientId = 'temp-recipient-id'; // Placeholder - REPLACE THIS

        try {
            const sentMessage = await sendMessage({
                recipientId: recipientId, // This needs to be determined correctly
                text: newMessage.trim(),
            });

            // Optimistically add the message to the list
            // Ideally, the API response (`sentMessage`) should match the `Message` type
            setMessages(prevMessages => [...prevMessages, sentMessage]);
            setNewMessage(''); // Clear input
            setSendingStatus('idle');
            // Scroll to bottom after sending
             setTimeout(() => flatListRef.current?.scrollToEnd({ animated: true }), 100);
        } catch (apiError: any) {
            console.error('Failed to send message:', apiError);
            setSendingError(apiError.message || 'Failed to send message.');
            setSendingStatus('error');
            Alert.alert('Error', 'Could not send message. Please try again.');
        }
    };

    // --- Rendering Logic ---
    const renderMessageItem = ({ item }: { item: Message }) => {
        const isMyMessage = item.senderId === currentUserId;
        return (
            <View style={[styles.messageRow, isMyMessage ? styles.myMessageRow : styles.otherMessageRow]}>
                <View style={[styles.messageBubble, isMyMessage ? styles.myMessageBubble : styles.otherMessageBubble]}>
                    <Text style={isMyMessage ? styles.myMessageText : styles.otherMessageText}>{item.text}</Text>
                    <Text style={styles.messageTimestamp}>{formatMessageTime(item.timestamp)}</Text>
                </View>
            </View>
        );
    };

    if (status === 'loading') {
        return (
            <View style={styles.centeredContainer}>
                <ActivityIndicator size="large" color={COLORS.primaryBlue} />
                <Text>Loading Messages...</Text>
            </View>
        );
    }

    if (status === 'error') {
        return (
            <View style={styles.centeredContainer}>
                <Text style={styles.errorText}>Error loading messages:</Text>
                <Text style={styles.errorText}>{error}</Text>
                <TouchableOpacity onPress={fetchMessages} style={styles.retryButton}>
                    <Text style={styles.retryButtonText}>Retry</Text>
                </TouchableOpacity>
            </View>
        );
    }

    return (
        <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            style={styles.screenContainer}
            keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0} // Adjust offset as needed
        >
            <FlatList
                ref={flatListRef}
                style={styles.messageList}
                data={messages}
                renderItem={renderMessageItem}
                keyExtractor={(item) => item.id}
                ListEmptyComponent={() => (
                    <View style={styles.centeredContainer}>
                        <Text>No messages in this conversation yet.</Text>
                    </View>
                )}
                onContentSizeChange={() => {
                     // Ensure scroll to end happens after layout is complete
                     // setTimeout(() => flatListRef.current?.scrollToEnd({ animated: false }), 50);
                 }}
                onLayout={() => {
                    // setTimeout(() => flatListRef.current?.scrollToEnd({ animated: false }), 50);
                }}
            />

            {/* Input Area */}
            <View style={styles.inputContainer}>
                <TextInput
                    style={styles.textInput}
                    placeholder="Type your message..."
                    value={newMessage}
                    onChangeText={setNewMessage}
                    multiline
                    editable={sendingStatus !== 'sending'}
                />
                <TouchableOpacity
                    style={[styles.sendButton, (sendingStatus === 'sending' || !newMessage.trim()) && styles.sendButtonDisabled]}
                    onPress={handleSend}
                    disabled={sendingStatus === 'sending' || !newMessage.trim()}
                >
                    {sendingStatus === 'sending' ? (
                        <ActivityIndicator size="small" color={COLORS.white} />
                    ) : (
                        // Replace with an Icon later if desired
                        <Text style={styles.sendButtonText}>Send</Text>
                    )}
                </TouchableOpacity>
            </View>
        </KeyboardAvoidingView>
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
    },
    messageList: {
        flex: 1,
        paddingHorizontal: 10,
        paddingTop: 10,
    },
    errorText: {
        color: COLORS.errorRed,
        textAlign: 'center',
        marginBottom: 10,
        fontSize: 16,
    },
    retryButton: {
        backgroundColor: COLORS.primaryBlue,
        paddingVertical: 10,
        paddingHorizontal: 20,
        borderRadius: 5,
        marginTop: 10,
    },
    retryButtonText: {
        color: COLORS.white,
        fontSize: 16,
    },
    messageRow: {
        flexDirection: 'row',
        marginVertical: 5,
    },
    myMessageRow: {
        justifyContent: 'flex-end',
    },
    otherMessageRow: {
        justifyContent: 'flex-start',
    },
    messageBubble: {
        maxWidth: '80%',
        padding: 10,
        borderRadius: 15,
        elevation: 1, // Subtle shadow on Android
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.1,
        shadowRadius: 1,
    },
    myMessageBubble: {
        backgroundColor: COLORS.myMessageBackground,
        borderBottomRightRadius: 5, // Slightly different shape
    },
    otherMessageBubble: {
        backgroundColor: COLORS.otherMessageBackground,
        borderBottomLeftRadius: 5,
    },
    myMessageText: {
        color: COLORS.darkGray,
        fontSize: 16,
    },
    otherMessageText: {
         color: COLORS.darkGray,
         fontSize: 16,
    },
    messageTimestamp: {
        fontSize: 10,
        color: COLORS.textGray,
        alignSelf: 'flex-end',
        marginTop: 3,
    },
    inputContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 10,
        borderTopWidth: 1,
        borderTopColor: COLORS.mediumGray,
        backgroundColor: COLORS.lightGray,
    },
    textInput: {
        flex: 1,
        backgroundColor: COLORS.inputBackground,
        borderColor: COLORS.mediumGray,
        borderWidth: 1,
        borderRadius: 20,
        paddingHorizontal: 15,
        paddingVertical: 10,
        maxHeight: 100, // Limit multiline input height
        marginRight: 10,
        fontSize: 16,
    },
    sendButton: {
        backgroundColor: COLORS.primaryBlue,
        borderRadius: 20,
        width: 40,
        height: 40,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 0,
    },
    sendButtonDisabled: {
        backgroundColor: COLORS.mediumGray,
    },
    sendButtonText: {
        color: COLORS.white,
        fontSize: 14, // Smaller text for send button
        fontWeight: 'bold',
    },
    senderName: {
        color: COLORS.senderName,
        marginBottom: 3,
        fontFamily: 'PlayfairDisplay-Bold',
    },
});

export default MessageViewScreen; 