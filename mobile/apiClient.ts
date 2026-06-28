import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Define the base URL for your local backend server
const baseURL = 'http://localhost:3001/api';
// The backend server runs on port 5000.
const baseURL = 'http://localhost:5000/api';

const apiClient = axios.create({
    baseURL,
    headers: {
        'Content-Type': 'application/json',
    },
});

// Intercept requests to automatically add the JWT token
apiClient.interceptors.request.use(async (config) => {
    const token = await AsyncStorage.getItem('userToken');
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
});

export default apiClient;