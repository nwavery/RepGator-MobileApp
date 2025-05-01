import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    Button,
    TextInput,
    ActivityIndicator,
    Alert,
    KeyboardAvoidingView,
    Platform,
    ScrollView,
    TouchableOpacity
} from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { AppStackParamList } from '../../navigation/AppNavigator'; // Adjust path
import { sendMessage, SendMessageRequest, SendMessageResponse, getRepresentativeDetails } from '../../services/apiClient'; // Import API function and types
import { useAuthStore } from '../../stores/authStore'; // Import auth store
// Optional: Import messages store if needed for refreshing
import { useMessagesStore } from '../../stores/messagesStore';
import { useFocusEffect } from '@react-navigation/native'; // Import useFocusEffect

// Define colors
const COLORS = {
    primaryBlue: '#1A237E',
    primaryRed: '#B71C1C',
    white: '#FFFFFF',
    lightGray: '#F5F5F5',
    mediumGray: '#BDBDBD',
    darkGray: '#212121',
    textGray: '#757575',
    errorRed: '#D32F2F',
};

// Define types for route and navigation
type MessageComposeScreenProps = NativeStackScreenProps<AppStackParamList, 'MessageCompose'>;

const MessageComposeScreen: React.FC<MessageComposeScreenProps> = ({ route, navigation }) => {
    const initialRecipientId = route.params?.selectedRepId; // Use selectedRepId
    const initialRecipientName = route.params?.selectedRepName;
    const [recipientName, setRecipientName] = useState<string>(initialRecipientName || '');
    const [messageText, setMessageText] = useState('');
    const [isSending, setIsSending] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const { user } = useAuthStore(); // Get user from store
    const addMessage = useMessagesStore((state) => state.addMessage); // Get action from message store
    const currentUserId = user?.userId; // Use userId

    // Fetch recipient name if only ID is provided
    useEffect(() => {
        const fetchName = async () => {
            if (initialRecipientId && !initialRecipientName) {
                try {
                    // TODO: Update getRepresentativeDetails if needed, or use a simpler lookup
                    const repDetails = await getRepresentativeDetails(initialRecipientId);
                    setRecipientName(repDetails.name);
                } catch (err) {
                    console.error("Failed to fetch recipient name:", err);
                    setError("Could not load recipient details.");
                }
            }
        };
        fetchName();
    }, [initialRecipientId, initialRecipientName]);

    const handleSend = async () => {
        if (!initialRecipientId || !messageText.trim() || !currentUserId) {
            setError('Recipient and message text are required.');
            return;
        }

        setIsSending(true);
        setError(null);

        const messageData: SendMessageRequest = {
            recipientId: initialRecipientId,
            text: messageText.trim(),
        };

        // Optimistic UI update (optional but good UX)
        const optimisticMessage = {
            id: `temp-${Date.now()}`,
            conversationId: `conv-with-${initialRecipientId}`, // Need a way to determine this
            senderId: currentUserId,
            text: messageText.trim(),
            timestamp: new Date().toISOString(),
            status: 'pending' as 'pending', // Type assertion
        };
        // addMessage(optimisticMessage); // Add optimistic message

        try {
            const sentMessage = await sendMessage(messageData);
            // addMessage(sentMessage); // Replace temp message with actual from server

            // Navigate to the conversation view after sending
            // Need to ensure conversationId is available or fetched
             navigation.replace('MessageDetail', { conversationId: sentMessage.conversationId }); // Correct screen name
        } catch (err: any) {
            setError(err.message || 'Failed to send message.');
            // Optionally remove/update optimistic message status to 'failed'
        } finally {
            setIsSending(false);
        }
    };

    const navigateToRecipientSelection = () => {
        navigation.navigate('RepresentativeList', {
            isSelecting: true,
            sourceRoute: 'MessageCompose', // Tell the list where to return
        });
    };

    // --- Recipient Handling UI --- 
    const renderRecipientInfo = () => {
        if (initialRecipientId) {
            return (
                 <View style={styles.recipientDisplayContainer}>
                    <Text style={styles.label}>To:</Text>
                    <Text style={styles.fixedRecipientText}>{recipientName || `ID: ${initialRecipientId}`}</Text>
                    {!initialRecipientId && isSending !== true && (
                         <TouchableOpacity onPress={navigateToRecipientSelection} style={styles.changeButton}>
                            <Text style={styles.changeButtonText}>Change</Text>
                        </TouchableOpacity>
                    )}
                </View>
            );
        }
        // Show button to select recipient
        return (
            <>
                <Text style={styles.label}>To:</Text>
                <TouchableOpacity onPress={navigateToRecipientSelection} style={styles.selectButton}>
                    <Text style={styles.selectButtonText}>Select Recipient...</Text>
                </TouchableOpacity>
             </>
        );
    };

    return (
        <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            style={styles.keyboardAvoidingContainer}
        >
            <ScrollView contentContainerStyle={styles.container}>
                <Text style={styles.title}>Compose New Message</Text>

                {renderRecipientInfo()}

                <Text style={styles.label}>Message:</Text>
                <TextInput
                    style={[styles.input, styles.messageInput]}
                    placeholder="Your message..."
                    value={messageText}
                    onChangeText={setMessageText}
                    multiline
                    editable={isSending !== true && !!currentUserId} // Disable if sending or not logged in
                />

                {error && (
                     <Text style={styles.errorText}>{error}</Text>
                )}

                <TouchableOpacity
                    style={[styles.sendButton, (isSending === true || !currentUserId || !initialRecipientId || !messageText.trim()) && styles.buttonDisabled]}
                    onPress={handleSend}
                    disabled={isSending === true || !currentUserId || !initialRecipientId || !messageText.trim()} // More robust disabled check
                >
                     {isSending === true ? (
                        <ActivityIndicator color={COLORS.white} />
                    ) : (
                        <Text style={styles.sendButtonText}>Send Message</Text>
                    )}
                </TouchableOpacity>

                <Button title="Cancel" onPress={() => navigation.goBack()} color="gray" disabled={isSending === true}/>
            </ScrollView>
        </KeyboardAvoidingView>
    );
};

const styles = StyleSheet.create({
    keyboardAvoidingContainer: {
        flex: 1,
        backgroundColor: COLORS.lightGray,
    },
    container: {
        flexGrow: 1,
        padding: 20,
    },
    title: {
        fontSize: 24,
        fontWeight: 'bold',
        marginBottom: 20,
        color: COLORS.primaryBlue,
        textAlign: 'center',
    },
    label: {
      fontSize: 16,
      color: COLORS.darkGray,
      marginBottom: 8,
      fontFamily: 'PlayfairDisplay-Bold',
    },
    fixedRecipientText: {
        flex: 1, // Allow text to take space
        fontSize: 16,
        paddingVertical: 10,
        paddingHorizontal: 5,
        color: COLORS.darkGray,
    },
    input: {
        backgroundColor: COLORS.white,
        width: '100%',
        borderColor: COLORS.mediumGray,
        borderWidth: 1,
        marginBottom: 15,
        paddingHorizontal: 15,
        paddingVertical: 10,
        borderRadius: 8,
        fontSize: 16,
    },
    messageInput: {
        minHeight: 150, // Ensure decent starting height
        textAlignVertical: 'top', // Align text top in multiline
    },
    sendButton: {
        backgroundColor: COLORS.primaryRed,
        padding: 15,
        borderRadius: 8,
        alignItems: 'center',
        marginTop: 10,
        marginBottom: 15,
    },
     buttonDisabled: {
        backgroundColor: COLORS.mediumGray,
    },
    sendButtonText: {
        color: COLORS.white,
        fontSize: 16,
        fontFamily: 'PlayfairDisplay-Bold',
    },
    errorText: {
        color: COLORS.errorRed,
        textAlign: 'center',
        marginBottom: 10,
        fontSize: 14,
    },
    recipientDisplayContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 15,
        minHeight: 40, // Ensure container has height for indicator
    },
    nameLoadingIndicator: {
        marginHorizontal: 10,
    },
    changeButton: {
        paddingHorizontal: 10,
        paddingVertical: 5,
    },
    changeButtonText: {
        color: COLORS.primaryRed,
        fontSize: 14,
        textDecorationLine: 'underline',
    },
    selectButton: {
        backgroundColor: COLORS.white,
        borderColor: COLORS.primaryBlue,
        borderWidth: 1,
        borderRadius: 8,
        paddingVertical: 12,
        paddingHorizontal: 15,
        marginBottom: 15,
        alignItems: 'center',
    },
    selectButtonText: {
        color: COLORS.primaryBlue,
        fontSize: 16,
        fontWeight: '500',
    },
    cancelButtonText: {
        color: COLORS.textGray,
        fontSize: 16,
    },
});

export default MessageComposeScreen; 