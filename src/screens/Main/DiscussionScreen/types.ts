import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { AppStackParamList } from '../../../navigation/AppNavigator';

export interface DiscussionPost {
    id: string;
    text: string;
    timestamp: string;
    parentPostId?: string;
    userId: string;
    userName: string;
}

export type ProcessedPost = {
    post: DiscussionPost;
    replies: DiscussionPost[];
};

export type Props = NativeStackScreenProps<AppStackParamList, 'Discussion'>;

export type PostStatus = 'idle' | 'loading' | 'error' | 'success';
export type PostingStatus = 'idle' | 'posting' | 'error'; 