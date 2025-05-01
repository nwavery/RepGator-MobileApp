import React from 'react';
import { View, Text } from 'react-native';
import { DiscussionPost } from './types';
import { styles } from './styles';
import { formatTimestamp, getInitials } from './constants';

interface ReplyItemProps {
    reply: DiscussionPost;
}

export const ReplyItem: React.FC<ReplyItemProps> = ({ reply }) => (
    <View style={styles.replyItemContainer}>
        <View style={styles.replyHeader}>
            <View style={styles.replyAvatarContainer}>
                <Text style={styles.replyAvatarText}>{getInitials(reply.userName)}</Text>
            </View>
            <View style={styles.replyHeaderText}>
                <Text style={styles.replyAuthorName}>{reply.userName || 'Unknown User'}</Text>
                <Text style={styles.replyTimestamp}>{formatTimestamp(reply.timestamp)}</Text>
            </View>
        </View>
        <Text style={styles.replyText}>{reply.text}</Text>
    </View>
); 