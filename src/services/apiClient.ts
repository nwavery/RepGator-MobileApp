import { useAuthStore } from '../stores/authStore';
import { Representative } from '../stores/repsStore'; // Import Representative type
import { ConversationPreview, Message } from '../stores/messagesStore'; // Import message types

// const API_BASE_URL = 'https://your-api-gateway-url.com/api'; // Placeholder REMOVED
// Use environment variable if available, otherwise fallback to common local development URL.
// NOTE: For local development:
// - iOS Simulator / Standard Android Emulator (localhost works): Use http://localhost:8080
// - Older Android Emulator (localhost fails): Use http://10.0.2.2:8080
// - Physical Device on same WiFi: Use http://<YOUR_MACHINE_LOCAL_IP>:8080 (e.g., http://192.168.1.100:8080)
const API_BASE_URL = process.env.EXPO_PUBLIC_API_URL || 'http://192.168.0.159:8080';
type ApiErrorResponse = {
  message: string;
  errors?: { [key: string]: string[] }; // Optional detailed validation errors
};

async function handleResponse<T>(response: Response): Promise<T> {
  const contentType = response.headers.get('content-type');
  let data;

  if (contentType && contentType.includes('application/json')) {
    data = await response.json();
  } else {
    // Handle non-JSON responses if necessary, or just get text
    data = await response.text();
  }

  if (!response.ok) {
    // Construct a meaningful error message
    let errorMessage = `HTTP error ${response.status}: ${response.statusText}`;
    if (data && typeof data === 'object' && data.message) {
      errorMessage = data.message; // Use message from API error response if available
    } else if (typeof data === 'string' && data.length > 0 && data.length < 100) {
      errorMessage = data; // Use text response if short
    }

    const error: Error & { data?: any } = new Error(errorMessage);
    error.data = data; // Attach full response data to the error object
    console.error('API Error:', error);
    throw error;
  }

  // Check if the data has a 'payload' key, common in our API structure
  if (data && typeof data === 'object' && 'payload' in data) {
    return data.payload as T;
  }

  // Otherwise, return the data directly
  return data as T;
}

// Function to get the auth token from Zustand store
const getAuthHeaders = (): { [key: string]: string } => {
  const token = useAuthStore.getState().token;
  if (token) {
    return {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    };
  }
  return {
     'Content-Type': 'application/json',
  };
};


// --- Authentication Endpoints ---

// TODO: Define LoginRequest based on the actual API request shape.
type LoginRequest = { email: string; password: string };
// TODO: Define LoginResponse based on the actual API response shape (e.g., token structure, user object details).
// Export the type
export type LoginResponse = { token: string; user: UserProfile };

export const loginUser = async (credentials: LoginRequest): Promise<LoginResponse> => {
  console.log(`Attempting login for ${credentials.email} to ${API_BASE_URL}/auth/login`); // Debug log
  const finalUrl = `${API_BASE_URL}/auth/login`; // Store final URL
  console.log(`[apiClient] Making fetch request to: ${finalUrl}`); // Log the final URL
  const response = await fetch(finalUrl, {
    method: 'POST',
    headers: {
        'Content-Type': 'application/json',
        // No Authorization header needed for login
    },
    body: JSON.stringify(credentials),
  });
  return handleResponse<LoginResponse>(response);
};

// TODO: Define RegisterRequest based on the actual API request shape (e.g., required fields like name, address).
// Updated to include address as per new requirement
type RegisterRequest = { 
    email: string; 
    password: string; 
    name: string; 
    address: string; // Added address field
    /* add other fields */ 
};
// TODO: Define RegisterResponse based on the actual API response shape (e.g., user object structure).
export type RegisterResponse = { token: string; user: UserProfile }; // Example shape

export const registerUser = async (details: RegisterRequest): Promise<RegisterResponse> => {
  console.log(`Attempting registration for ${details.email} to ${API_BASE_URL}/auth/register`); // Debug log
  const response = await fetch(`${API_BASE_URL}/auth/register`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
       // No Authorization header needed for register
    },
    body: JSON.stringify(details),
  });
  return handleResponse<RegisterResponse>(response);
};

// --- Representative Endpoints (New/Updated for Feature) ---

// Type for the items in the representative list
export interface RepresentativeListItem {
  bioguideId: string;
  firstName: string;
  lastName: string;
  name?: string; // Optional combined name
  party: string; // "R", "D", or "I"
  state: string;
  phone?: string;
  website?: string;
  email?: string; // Added optional email field
  type: string; // Changed from title based on API response
}

// Type for the detailed representative view
export interface RepresentativeDetailData extends RepresentativeListItem {
  districtId?: string; // Only for Representatives
  class?: string;      // Only for Senators
  // Add any other detail fields if the API provides them
}

// Fetch representatives for a specific districtId
export const getRepresentativesByDistrict = async (districtId: string): Promise<RepresentativeListItem[]> => {
  if (!districtId) {
    console.error('getRepresentativesByDistrict: districtId is required.');
    // Depending on UI needs, return empty array or throw error
    return [];
    // Or: throw new Error('District ID is required to fetch representatives.');
  }
  const endpoint = `representatives?districtId=${encodeURIComponent(districtId)}`;
  console.log(`Fetching representatives for district ${districtId} from ${API_BASE_URL}/${endpoint}`);
  return fetchProtectedData<RepresentativeListItem[]>(endpoint);
};

// Fetch details for a single representative by their bioguideId
export const getRepresentativeDetailsById = async (repId: string): Promise<RepresentativeDetailData> => {
  if (!repId) {
    console.error('getRepresentativeDetailsById: repId is required.');
    throw new Error('Representative ID is required to fetch details.');
  }
  const endpoint = `representatives/${repId}`;
  console.log(`Fetching details for rep ${repId} from ${API_BASE_URL}/${endpoint}`);
  return fetchProtectedData<RepresentativeDetailData>(endpoint);
};

// --- Old/Existing Representative Endpoints (If needed for other stores/features, keep them) ---

// Added function to fetch all representatives (used by repsStore)
export const getRepresentatives = async (): Promise<Representative[]> => {
    const endpoint = 'representatives'; // Verify this endpoint
    return fetchProtectedData<Representative[]>(endpoint);
};

// Function to fetch details for a single representative
// TODO: Define the actual shape of RepresentativeDetail
export type RepresentativeDetail = Representative & {
    bio?: string;
    contactInfo?: { phone?: string; website?: string };
    committees?: string[];
    // Add more detailed fields
};

export const getRepresentativeDetails = async (repId: string): Promise<RepresentativeDetail> => {
    const endpoint = `representatives/${repId}`; // Verify this endpoint structure
    console.log(`Fetching details for rep ${repId} from ${API_BASE_URL}/${endpoint}`); // Debug log
    return fetchProtectedData<RepresentativeDetail>(endpoint);
};

// --- Message Endpoints ---

// Fetch list of conversation previews (for inbox)
export const getConversations = async (): Promise<ConversationPreview[]> => {
    const endpoint = 'conversations'; // Verify this endpoint
    return fetchProtectedData<ConversationPreview[]>(endpoint);
};

// Fetch messages for a specific conversation
// Uses Message type from messagesStore.ts
export const getMessagesForConversation = async (conversationId: string): Promise<Message[]> => {
    const endpoint = `conversations/${conversationId}/messages`; // Verify this endpoint structure
    console.log(`Fetching messages for conversation ${conversationId} from ${API_BASE_URL}/${endpoint}`);
    return fetchProtectedData<Message[]>(endpoint);
};

// Send a new message
// TODO: Define the exact request body structure expected by the API
// Export the type
export type SendMessageRequest = {
    recipientId: string; // ID of the representative or user
    text: string;
};
// Uses Message type from messagesStore.ts for response
// Export the type
export type SendMessageResponse = Message; // Example: returns the created message

export const sendMessage = async (messageData: SendMessageRequest): Promise<SendMessageResponse> => {
    const endpoint = 'messages'; // Verify this endpoint for sending
    console.log(`Sending message to ${messageData.recipientId} via ${API_BASE_URL}/${endpoint}`);
    return fetchProtectedData<SendMessageResponse>(endpoint, {
        method: 'POST',
        body: JSON.stringify(messageData),
    });
};

// --- Dashboard Endpoints ---

// Updated DashboardSummary structure based on backend update
export type DashboardSummary = {
    userName: string;
    districtId: string; // Changed from districtName, removed other fields
    // representativeCount: number; // Removed
    // unreadMessages: number; // Removed
    // upcomingEvents: number; // Removed
};

export const getDashboardSummary = async (): Promise<DashboardSummary> => {
    // TODO: Verify this endpoint with the backend API documentation
    const endpoint = 'dashboard/summary';
    console.log(`Fetching dashboard summary from ${API_BASE_URL}/${endpoint}`);
    // Assuming a GET request, add method/body if needed
    return fetchProtectedData<DashboardSummary>(endpoint);
};

// --- Discussion Types ---
// TODO: Define based on actual API structure
export interface DiscussionPost {
    id: string;
    text: string;
    timestamp: string;
    parentPostId?: string;
    userId: string;
    userName: string;
}

// --- Discussion Endpoints ---

// Fetch discussion posts for a specific district
export const getDiscussionPosts = async (districtId: string): Promise<DiscussionPost[]> => {
    if (!districtId) {
        console.error('getDiscussionPosts: districtId is required.');
        return []; // Or throw an error
    }
    const endpoint = `discussions?districtId=${encodeURIComponent(districtId)}`;
    console.log(`Fetching discussion posts for district ${districtId} from ${API_BASE_URL}/${endpoint}`);
    return fetchProtectedData<DiscussionPost[]>(endpoint);
};

// Create a new discussion post
export interface CreatePostRequest {
    districtId: string; // Added districtId
    text: string;
    parentPostId?: string;
}

export const createDiscussionPost = async (request: CreatePostRequest): Promise<DiscussionPost> => {
    if (!request.districtId) {
        throw new Error('createDiscussionPost: districtId is required in the request.');
    }
    const endpoint = 'discussions';
    console.log(`Creating discussion post in district ${request.districtId} via ${API_BASE_URL}/${endpoint}`);
    return fetchProtectedData<DiscussionPost>(endpoint, {
        method: 'POST',
        body: JSON.stringify(request), // Send the whole request object including districtId
    });
};

// --- User Profile Types ---
// Updated based on actual API response example
export type UserProfile = {
    userId: string;
    name?: string;
    email: string;
    districtId?: string;
    preferences?: object;
    // Changed address type to string | null
    address?: string | null;
    // Add other relevant profile fields if needed later
};

// Define the type for the update request - likely a partial profile
// IMPORTANT: The UPDATE request might still need the structured object!
// We only changed the type for the GET response.
export type UpdateUserProfileRequest = {
    name?: string;
    preferences?: object;
    // Address update requires the structured object
    address?: { 
        street: string;
        city: string;
        state: string;
        zip: string;
    } | null;
};

// --- User Profile Endpoints ---

export const getUserProfile = async (): Promise<UserProfile> => {
    const endpoint = 'user/profile'; // Verify this endpoint
    console.log(`Fetching user profile from ${API_BASE_URL}/${endpoint}`);
    const profileData = await fetchProtectedData<UserProfile>(endpoint);
    // Log the received data
    console.log('[apiClient] Received profile data:', JSON.stringify(profileData));
    return profileData;
};

// TODO: Add functions for updating profile/address later
// export const updateUserAddress = async (addressData: UserProfile['address']) => { ... };

// --- NEW FUNCTION: Update User Profile ---
export const updateUserProfile = async (profileData: UpdateUserProfileRequest): Promise<UserProfile> => {
    const endpoint = 'user/profile'; // Verify this endpoint
    console.log(`Updating user profile via ${API_BASE_URL}/${endpoint}`);
    return fetchProtectedData<UserProfile>(endpoint, {
        method: 'PUT', // Or PATCH depending on API design
        body: JSON.stringify(profileData),
    });
};

// --- News Endpoints ---

// Type for individual news articles (matches NewsScreen.tsx)
export type NewsArticle = {
    uuid: string;
    title: string;
    description?: string;
    snippet?: string;
    url: string;
    image_url?: string;
    published_at: string; // Assuming ISO date string
    source: string;
};

// Type for the expected API response structure
type NewsApiResponse = {
    articles: NewsArticle[];
};

// Fetch political news articles
export const getNewsArticles = async (): Promise<NewsArticle[]> => {
    const endpoint = 'news/politics';
    console.log(`Fetching news articles from ${API_BASE_URL}/${endpoint}`);
    try {
        // Adjust type hint: Expect fetchProtectedData to return the array directly here
        const response = await fetchProtectedData<NewsArticle[]>(endpoint);
        // Log remains useful for debugging
        console.log('[apiClient] Raw news response:', JSON.stringify(response, null, 2)); 
        // Return the response directly, as it is the array of articles
        return response; 
    } catch (error) {
        console.error('Error fetching news articles:', error);
        // Re-throw the error to be handled by the calling component
        throw error;
    }
};

// --- Other API functions will go here ---

// Example of a protected request helper
export const fetchProtectedData = async <T>(endpoint: string, options: RequestInit = {}): Promise<T> => {
    const response = await fetch(`${API_BASE_URL}/${endpoint}`, {
        ...options,
        headers: {
            ...getAuthHeaders(), // Automatically includes Bearer token if available
            ...options.headers,
        },
    });
    return handleResponse<T>(response);
};

// Example usage for a GET request:
// const userProfile = await fetchProtectedData<{id: string, name: string}>('user/profile');

// Example usage for a POST request:
// const newMessage = { text: 'Hello' };
// const sentMessage = await fetchProtectedData<any>('messages', {
//    method: 'POST',
//    body: JSON.stringify(newMessage),
// }); 