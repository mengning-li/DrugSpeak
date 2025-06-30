import { Platform } from 'react-native';

// Update API URL based on platform
// For iOS simulator, use localhost
// For Android emulator, use 10.0.2.2 (which maps to host's localhost)
// For physical devices, use your computer's IP address on the local network
export const API_URL = Platform.OS === 'ios' 
  ? 'http://localhost:3000'
  : 'http://10.0.2.2:3000';

// Other API configuration can go here
export const API_TIMEOUT = 15000; // 15 seconds timeout