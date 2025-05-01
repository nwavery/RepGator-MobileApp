import React, { useState } from 'react';
import {
    View,
    Text,
    TextInput,
    TouchableOpacity,
    ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { DiscussionPost } from './types';
import { styles } from './styles';
import { formatTimestamp, getInitials, COLORS } from './constants';
import { ReplyItem } from './ReplyItem';

// Mock API function - replace with actual API call
const createDiscussionPost = async (request: { text: string; parentPostId?: string }): Promise<DiscussionPost> => {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Mock data - replace with actual API call
    return {
        id: Math.random().toString(36).substr(2, 9),
        text: request.text,
        timestamp: new Date().toISOString(),
        parentPostId: request.parentPostId,
        userId: 'currentUser',
        userName: 'Current User'
    };
};

interface PostItemProps {
    post: DiscussionPost;
    replies: DiscussionPost[];
    onReplyPosted: () => void;
}

export const PostItem: React.FC<PostItemProps> = ({ post, replies, onReplyPosted }) => {
    const [replyingToPostId, setReplyingToPostId] = useState<string | null>(null);
    const [replyText, setReplyText] = useState('');
    const [replyingStatus, setReplyingStatus] = useState<'idle' | 'posting' | 'error'>('idle');
    const [replyingError, setReplyingError] = useState<string | null>(null);

    const handleToggleReply = (postId: string) => {
        setReplyingToPostId(currentId => {
            if (currentId === postId) {
                return null;
            } else {
                setReplyText('');
                setReplyingError(null);
                setReplyingStatus('idle');
                return postId;
            }
        });
    };

    const handleSubmitReply = async (parentPostId: string) => {
        if (!replyText.trim() || replyingStatus === 'posting') return;

        setReplyingStatus('posting');
        setReplyingError(null);

        try {
            await createDiscussionPost({
                text: replyText.trim(),
                parentPostId: parentPostId,
            });
            setReplyingStatus('idle');
            setReplyText('');
            setReplyingToPostId(null);
            onReplyPosted();
        } catch (apiError: any) {
            console.error('Failed to post reply:', apiError);
            setReplyingError(apiError.message || 'Failed to post reply.');
            setReplyingStatus('error');
        }
    };

    return (
        <View style={styles.postCard}>
            <View style={styles.postHeader}>
                <View style={styles.avatarContainer}>
                    <Text style={styles.avatarText}>{getInitials(post.userName)}</Text>
                </View>
                <View style={styles.postHeaderText}>
                    <Text style={styles.authorName}>{post.userName || 'Unknown User'}</Text>
                    <Text style={styles.timestamp}>{formatTimestamp(post.timestamp)}</Text>
                </View>
            </View>
            <Text style={styles.postText}>{post.text}</Text>
            <View style={styles.postFooter}>
                <TouchableOpacity style={styles.footerAction} onPress={() => handleToggleReply(post.id)}>
                    <Ionicons name="chatbubble-outline" size={18} color={COLORS.textGray} />
                    <Text style={styles.footerActionText}>Reply {replies.length ? `(${replies.length})` : ''}</Text>
                </TouchableOpacity>
            </View>

            {replyingToPostId === post.id && (
                <View style={styles.replyContainer}>
                    <TextInput
                        style={styles.replyInput}
                        placeholder={`Replying to ${post.userName}...`}
                        value={replyText}
                        onChangeText={setReplyText}
                        editable={replyingStatus !== 'posting'}
                        multiline
                        placeholderTextColor={COLORS.textGray}
                        autoFocus={true}
                    />
                    {replyingError && <Text style={styles.replyErrorText}>{replyingError}</Text>}
                    <View style={styles.replyActions}>
                        <TouchableOpacity
                            style={[styles.replyButton, styles.cancelReplyButton]}
                            onPress={() => setReplyingToPostId(null)}
                            disabled={replyingStatus === 'posting'}
                        >
                            <Text style={styles.replyButtonText}>Cancel</Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                            style={[
                                styles.replyButton,
                                styles.submitReplyButton,
                                (replyingStatus === 'posting' || !replyText.trim()) && styles.buttonDisabled
                            ]}
                            onPress={() => handleSubmitReply(post.id)}
                            disabled={replyingStatus === 'posting' || !replyText.trim()}
                        >
                            {replyingStatus === 'posting' ? (
                                <ActivityIndicator size="small" color={COLORS.white} />
                            ) : (
                                <Text style={[styles.replyButtonText, styles.submitReplyButtonText]}>Post Reply</Text>
                            )}
                        </TouchableOpacity>
                    </View>
                </View>
            )}

            {replies.length > 0 && (
                <View style={styles.repliesContainer}>
                    {replies.map(reply => (
                        <ReplyItem key={reply.id} reply={reply} />
                    ))}
                </View>
            )}
        </View>
    );
}; 