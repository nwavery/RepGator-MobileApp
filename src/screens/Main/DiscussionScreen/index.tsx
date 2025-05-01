import React, { useState, useEffect, useCallback } from 'react';
import {
    View,
    Text,
    FlatList,
    TextInput,
    TouchableOpacity,
    ActivityIndicator,
    KeyboardAvoidingView,
    Platform,
    SafeAreaView,
    RefreshControl,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Props, PostStatus, PostingStatus, ProcessedPost } from './types';
import { styles } from './styles';
import { COLORS } from './constants';
import { PostItem } from './PostItem';
import { useAuthStore } from '../../../stores/authStore';
import { getDiscussionPosts, createDiscussionPost, DiscussionPost, CreatePostRequest } from '../../../services/apiClient';

export const DiscussionScreen: React.FC<Props> = ({ navigation }): JSX.Element => {
    const [posts, setPosts] = useState<DiscussionPost[]>([]);
    const [processedPosts, setProcessedPosts] = useState<ProcessedPost[]>([]);
    const [status, setStatus] = useState<PostStatus>('idle');
    const [error, setError] = useState<string | null>(null);
    const [newPostText, setNewPostText] = useState('');
    const [postingStatus, setPostingStatus] = useState<PostingStatus>('idle');
    const [postingError, setPostingError] = useState<string | null>(null);
    const [isRefreshing, setIsRefreshing] = useState(false);

    const user = useAuthStore((state) => state.user);
    const districtId = user?.districtId;

    const fetchPosts = useCallback(async (isManualRefresh = false) => {
        if (!districtId) {
            setError('District information not available. Cannot load discussion.');
            setStatus('error');
            if (isManualRefresh) setIsRefreshing(false);
            return;
        }

        if (!isManualRefresh) {
            setStatus('loading');
        }
        setError(null);
        try {
            const fetchedPosts = await getDiscussionPosts(districtId);
            const sortedPosts = fetchedPosts.sort((a: DiscussionPost, b: DiscussionPost) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
            setPosts(sortedPosts);
            setStatus('success');
        } catch (apiError: any) {
            console.error('Failed to fetch discussion posts:', apiError);
            setError(apiError.message || 'Failed to load posts.');
            setStatus('error');
        } finally {
            if (isManualRefresh) setIsRefreshing(false);
        }
    }, [districtId]);

    useEffect(() => {
        if (districtId) {
            fetchPosts(false);
        } else {
            setStatus('idle');
            setError('Waiting for user district information...');
        }
    }, [fetchPosts, districtId]);

    useEffect(() => {
        const topLevelPosts: DiscussionPost[] = [];
        const repliesMap = new Map<string, DiscussionPost[]>();

        posts.forEach(post => {
            if (post.parentPostId) {
                const parentReplies = repliesMap.get(post.parentPostId) || [];
                parentReplies.push(post);
                repliesMap.set(post.parentPostId, parentReplies);
            } else {
                topLevelPosts.push(post);
            }
        });

        repliesMap.forEach(replies => {
            replies.sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
        });

        const processed = topLevelPosts.map(post => ({
            post: post,
            replies: repliesMap.get(post.id) || [],
        }));

        processed.sort((a, b) => new Date(b.post.timestamp).getTime() - new Date(a.post.timestamp).getTime());
        setProcessedPosts(processed);
    }, [posts]);

    const onRefresh = useCallback(() => {
        setIsRefreshing(true);
        fetchPosts(true);
    }, [fetchPosts]);

    const handlePost = async () => {
        if (!newPostText.trim() || postingStatus === 'posting') return;

        if (!districtId) {
            setPostingError('District information not available. Cannot create post.');
            setPostingStatus('error');
            return;
        }

        setPostingStatus('posting');
        setPostingError(null);

        const postData: CreatePostRequest = {
            text: newPostText.trim(),
            districtId: districtId,
        };

        try {
            const createdPost = await createDiscussionPost(postData);
            setPosts(prevPosts => [createdPost, ...prevPosts]);
            setNewPostText('');
            setPostingStatus('idle');
        } catch (apiError: any) {
            console.error('Failed to create post:', apiError);
            setPostingError(apiError.message || 'Failed to create post.');
            setPostingStatus('error');
        }
    };

    const renderContent = () => {
        if (status === 'error' && error === 'District information not available. Cannot load discussion.') {
            return (
                <View style={styles.centeredContainer}>
                    <Ionicons name="alert-circle-outline" size={60} color={COLORS.errorRed} />
                    <Text style={styles.errorTitle}>District Info Missing</Text>
                    <Text style={styles.errorTextDetail}>{error}</Text>
                    <Text style={styles.emptySubText}>Please ensure your profile is complete.</Text>
                </View>
            );
        }
        if (status === 'idle' && error === 'Waiting for user district information...') {
            return (
                <View style={styles.centeredContainer}>
                    <ActivityIndicator size="large" color={COLORS.primaryBlue} />
                    <Text style={styles.emptySubText}>Loading user information...</Text>
                </View>
            );
        }

        if (status === 'loading' && !isRefreshing) {
            return (
                <View style={styles.centeredContainer}>
                    <ActivityIndicator size="large" color={COLORS.primaryBlue} />
                </View>
            );
        }

        if (status === 'error') {
            return (
                <View style={styles.centeredContainer}>
                    <Ionicons name="warning-outline" size={60} color={COLORS.errorRed} />
                    <Text style={styles.errorTitle}>Error Loading Discussion</Text>
                    <Text style={styles.errorTextDetail}>{error}</Text>
                    <TouchableOpacity onPress={() => fetchPosts(false)} style={styles.retryButton}>
                        <Ionicons name="refresh-outline" size={20} color={COLORS.white} />
                        <Text style={styles.retryButtonText}>Retry</Text>
                    </TouchableOpacity>
                </View>
            );
        }

        return (
            <FlatList
                style={styles.listContainer}
                contentContainerStyle={styles.listContentContainer}
                data={processedPosts}
                renderItem={({ item }) => (
                    <PostItem
                        post={item.post}
                        replies={item.replies}
                        onReplyPosted={() => fetchPosts(true)}
                    />
                )}
                keyExtractor={(item) => item.post.id}
                ListEmptyComponent={() => (
                    <View style={styles.centeredContainer}>
                        <Ionicons name="chatbubbles-outline" size={50} color={COLORS.mediumGray} />
                        <Text style={styles.emptyText}>No discussion posts yet.</Text>
                        <Text style={styles.emptySubText}>Be the first to share your thoughts!</Text>
                    </View>
                )}
                ItemSeparatorComponent={() => <View style={styles.separator} />}
                showsVerticalScrollIndicator={false}
                refreshControl={
                    <RefreshControl
                        refreshing={isRefreshing}
                        onRefresh={onRefresh}
                        colors={[COLORS.primaryBlue]}
                        tintColor={COLORS.primaryBlue}
                    />
                }
            />
        );
    };

    return (
        <SafeAreaView style={styles.screenContainer}>
            <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                style={styles.keyboardAvoidingContainer}
                keyboardVerticalOffset={Platform.OS === 'ios' ? 60 : 0}
            >
                {renderContent()}
                <View style={styles.inputOuterContainer}>
                    {postingStatus === 'error' && postingError && (
                        <Text style={styles.postingErrorText}>{postingError}</Text>
                    )}
                    <View style={styles.inputInnerContainer}>
                        <TextInput
                            style={styles.textInput}
                            placeholder={districtId ? "Share your thoughts..." : "District info needed to post"}
                            value={newPostText}
                            onChangeText={setNewPostText}
                            multiline
                            editable={postingStatus !== 'posting' && !!districtId}
                            placeholderTextColor={COLORS.textGray}
                        />
                        <TouchableOpacity
                            style={[styles.postButton, (postingStatus === 'posting' || !newPostText.trim() || !districtId) && styles.buttonDisabled]}
                            onPress={handlePost}
                            disabled={postingStatus === 'posting' || !newPostText.trim() || !districtId}
                        >
                            {postingStatus === 'posting' ? (
                                <ActivityIndicator size="small" color={COLORS.primaryBlue} />
                            ) : (
                                <Ionicons name="send" size={20} color={COLORS.primaryBlue} />
                            )}
                        </TouchableOpacity>
                    </View>
                </View>
            </KeyboardAvoidingView>
        </SafeAreaView>
    );
};

export default DiscussionScreen; 