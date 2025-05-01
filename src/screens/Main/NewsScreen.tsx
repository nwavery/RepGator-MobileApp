import React, { useState, useEffect, useCallback } from 'react';
import {
    View,
    Text,
    StyleSheet,
    FlatList,
    TouchableOpacity,
    Image,
    Linking,
    ActivityIndicator,
    RefreshControl,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { parseISO, isValid, format, isFuture } from 'date-fns';
import { LinearGradient } from 'expo-linear-gradient';

// Import the API call function (we will create this next)
import { getNewsArticles, NewsArticle } from '../../services/apiClient'; // <-- Uncomment and ensure type import

// Define colors (Consider moving to a global theme file if not already done)
const COLORS = {
  primaryBlue: '#1A237E',
  white: '#FFFFFF',
  lightGray: '#F5F5F5',
  mediumGray: '#E0E0E0',
  darkGray: '#212121',
  textGray: '#757575',
  errorRed: '#D32F2F',
  cardBackground: '#FFFFFF',
};

const NewsScreen = () => {
    const [articles, setArticles] = useState<NewsArticle[]>([]);
    const [status, setStatus] = useState<'idle' | 'loading' | 'error' | 'success'>('idle');
    const [error, setError] = useState<string | null>(null);
    const [isRefreshing, setIsRefreshing] = useState(false);

    // --- Fetching Logic ---
    const fetchNews = useCallback(async (isManualRefresh = false) => {
        console.log("Attempting to fetch news...");
        if (!isManualRefresh) {
            setStatus('loading');
        }
        setError(null);
        try {
            // --- Replace mock data with actual API call ---
            console.log("Calling getNewsArticles API...");
            const fetchedArticles = await getNewsArticles(); 
            // Add log to inspect the actual data received
            console.log('Fetched articles data:', JSON.stringify(fetchedArticles, null, 2));
            setArticles(fetchedArticles); // Set state with the received data
            // --- End of replacement ---

            setStatus('success');
            console.log("News fetched successfully.");
        } catch (e: any) {
            console.error("Failed to fetch news:", e);
            setError(e.message || 'Could not load news articles.');
            setStatus('error');
        } finally {
             if (isManualRefresh) {
                setIsRefreshing(false);
            }
        }
    }, []); // Keep dependencies empty for now, fetch triggered by status

    // --- Initial Fetch Effect ---
    useEffect(() => {
        if (status === 'idle') {
            fetchNews();
        }
    }, [status, fetchNews]);

    // --- Pull-to-Refresh Handler ---
     const onRefresh = useCallback(() => {
        setIsRefreshing(true);
        fetchNews(true); // Pass true to indicate manual refresh
    }, [fetchNews]);

    // --- Render Individual Article Item ---
    const renderArticleItem = ({ item }: { item: NewsArticle }) => {
        // Parse the date string
        const publishedDate = parseISO(item.published_at);
        let formattedDate = ''; // Default to empty string

        if (isValid(publishedDate)) {
             if (isFuture(publishedDate)) {
                // If it's valid but in the future, format DATE ONLY
                formattedDate = format(publishedDate, 'MMM d, yyyy');
            } else {
                // If valid and not future, format normally (date and time)
                formattedDate = format(publishedDate, 'MMM d, yyyy h:mm a');
            }
        } else {
            // If the date is invalid for any other reason, keep it blank
            formattedDate = '';
        }

        return (
            <TouchableOpacity
                style={styles.card}
                onPress={() => Linking.openURL(item.url).catch(err => console.error("Couldn't load page", err))}
            >
                {item.image_url ? (
                    <Image source={{ uri: item.image_url }} style={styles.cardImage} resizeMode="cover" />
                ) : (
                    <View style={styles.imagePlaceholder}><Ionicons name="image-outline" size={24} color={COLORS.mediumGray} /></View>
                )}
                <View style={styles.cardTextContainer}>
                    <Text style={styles.cardTitle} numberOfLines={2}>{item.title}</Text>
                    <View style={styles.sourceDateContainer}>
                        <Text style={styles.cardSource} numberOfLines={1}>{item.source}</Text>
                        <Text style={styles.cardDate}>{formattedDate}</Text>
                    </View>
                    <Text style={styles.cardSnippet} numberOfLines={3}>{item.snippet ?? item.description}</Text>
                </View>
            </TouchableOpacity>
        );
    };

    // --- Conditional Rendering for Status ---
    if (status === 'loading' && !isRefreshing) {
        return (
            <View style={styles.centeredContainer}>
                <ActivityIndicator size="large" color={COLORS.primaryBlue} />
                <Text style={styles.loadingText}>Loading News...</Text>
            </View>
        );
    }

    if (status === 'error') {
        return (
            <View style={styles.centeredContainer}>
                 <Ionicons name="warning-outline" size={60} color={COLORS.errorRed} />
                <Text style={styles.errorTitle}>Error Loading News</Text>
                <Text style={styles.errorTextDetail}>{error}</Text>
                <TouchableOpacity onPress={() => fetchNews()} style={styles.retryButton}>
                    <Ionicons name="refresh-outline" size={20} color={COLORS.white} />
                    <Text style={styles.retryButtonText}>Retry</Text>
                 </TouchableOpacity>
            </View>
        );
    }

    // --- Main Render with FlatList ---
    return (
        <LinearGradient
            colors={['red', 'blue']}
            style={styles.gradientContainer}
        >
            <FlatList
                data={articles}
                renderItem={renderArticleItem}
                keyExtractor={(item) => item.uuid}
                style={styles.listContainer}
                contentContainerStyle={styles.listContentContainer}
                ListEmptyComponent={() => (
                     status === 'success' && (
                        <View style={styles.centeredContainer}>
                            <Ionicons name="newspaper-outline" size={50} color={COLORS.mediumGray} />
                            <Text style={styles.emptyText}>No news articles available right now.</Text>
                        </View>
                    )
                )}
                 refreshControl={
                    <RefreshControl 
                        refreshing={isRefreshing} 
                        onRefresh={onRefresh} 
                        colors={[COLORS.primaryBlue]}
                        tintColor={COLORS.primaryBlue}
                    />
                }
                showsVerticalScrollIndicator={false}
            />
        </LinearGradient>
    );
};

const styles = StyleSheet.create({
    gradientContainer: {
        flex: 1,
    },
    listContainer: {
        flex: 1,
    },
    listContentContainer: {
        paddingVertical: 10,
        paddingHorizontal: 12,
    },
    centeredContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 20,
        backgroundColor: COLORS.lightGray,
    },
    loadingText: {
        marginTop: 10,
        fontSize: 16,
        color: COLORS.textGray,
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
        marginBottom: 25,
        fontSize: 16,
    },
    retryButton: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: COLORS.primaryBlue,
        paddingVertical: 10,
        paddingHorizontal: 25,
        borderRadius: 20,
        elevation: 2,
    },
    retryButtonText: {
        color: COLORS.white,
        fontSize: 16,
        marginLeft: 10,
    },
    emptyText: {
        marginTop: 15,
        fontSize: 16,
        color: COLORS.textGray,
    },
    card: {
        backgroundColor: COLORS.cardBackground,
        borderRadius: 8,
        padding: 12,
        marginBottom: 12,
        flexDirection: 'row',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.15,
        shadowRadius: 2,
        elevation: 3,
    },
    cardImage: {
        width: 80,
        height: 80,
        borderRadius: 6,
        marginRight: 12,
    },
    imagePlaceholder: {
        width: 80,
        height: 80,
        borderRadius: 6,
        marginRight: 12,
        backgroundColor: COLORS.lightGray,
        justifyContent: 'center',
        alignItems: 'center',
    },
    cardTextContainer: {
        flex: 1,
        justifyContent: 'space-between',
    },
    cardTitle: {
        fontSize: 17,
        marginBottom: 4,
        color: COLORS.darkGray,
        fontFamily: 'PlayfairDisplay-Bold',
    },
    sourceDateContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 6,
    },
    cardSource: {
        fontSize: 12,
        color: COLORS.primaryBlue,
        flexShrink: 1,
        marginRight: 5,
    },
    cardDate: {
        fontSize: 12,
        color: COLORS.textGray,
    },
    cardSnippet: {
        fontSize: 14,
        color: COLORS.textGray,
        lineHeight: 18,
    },
});

export default NewsScreen; 