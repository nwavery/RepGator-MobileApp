export const COLORS = {
    primaryBlue: '#1A237E',
    primaryRed: '#B71C1C',
    white: '#FFFFFF',
    lightGray: '#F8F9FA',
    mediumGray: '#E0E0E0',
    darkGray: '#343A40',
    textGray: '#6C757D',
    iconColor: '#495057',
    errorRed: '#D32F2F',
    postBackground: '#FFFFFF',
    inputBackground: '#FFFFFF',
    avatarBackground: '#BDBDBD',
    borderColor: '#E9ECEF',
    replyBackground: '#F1F3F5',
};

export const formatTimestamp = (timestamp: string | null | undefined): string => {
    if (!timestamp) return '';
    try {
        const date = new Date(timestamp);
        const time = date.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
        const day = date.toLocaleDateString([], { month: 'short', day: 'numeric' });
        if (new Date().toDateString() === date.toDateString()) {
            return time;
        }
        return `${day}, ${time}`;
    } catch (e) {
        return '';
    }
};

export const getInitials = (name: string): string => {
    if (!name) return '?';
    const parts = name.trim().split(' ');
    if (parts.length === 1) return parts[0].charAt(0).toUpperCase();
    return (parts[0].charAt(0) + (parts.length > 1 ? parts[parts.length - 1].charAt(0) : '')).toUpperCase();
}; 