import { decodeToken } from '@/lib/utils';
import { createSlice, PayloadAction } from '@reduxjs/toolkit';

// Define User and UserProfile interfaces
interface User {
  id: string;
  email: string;
}

interface UserProfile {
  // Define properties for user profile as needed
  name?: string;
  imageUrl?: string;
  email?: string;
  // Add other relevant fields
}

// Define the structure of the Auth state
interface AuthState {
  token: string | null;
  user: User | null;
  isLoggedIn: boolean;
  userProfile: UserProfile | null; // Initialize user profile state
}

// Function to get token from local storage
const getTokenFromLocalStorage = (): AuthState => {
  if (typeof window !== 'undefined') {
    const token = localStorage.getItem('token');
    if (token) {
      const decoded = decodeToken(token);
      if (decoded) {
        return {
          token,
          user: { id: decoded.id, email: decoded.email },
          isLoggedIn: true,
          userProfile: null, // Initialize user profile state
        };
      }
    }
  }
  return { token: null, user: null, isLoggedIn: false, userProfile: null };
};

// Initial state based on local storage
const initialState: AuthState = getTokenFromLocalStorage();

// Create the auth slice
export const authSlice = createSlice({
  name: 'authSlice',
  initialState,
  reducers: {
    setLogin: (state, action: PayloadAction<{ token: string }>) => {
      state.token = action.payload.token;
      localStorage.setItem('token', action.payload.token);
      const decoded = decodeToken(action.payload.token);

      if (decoded) {
        state.user = {
          id: decoded.id,
          email: decoded.email,
        };
        state.isLoggedIn = true;
      } else {
        state.isLoggedIn = false;
        state.user = null;
      }
    },
    logOut: (state) => {
      state.token = null;
      state.user = null;
      state.isLoggedIn = false;
      state.userProfile = null; // Reset profile data on logout
      localStorage.removeItem('token');
    },
    setUserProfile: (state, action: PayloadAction<UserProfile | null>) => {
      state.userProfile = action.payload; // Store the user profile data in state
    },
  },
});

// Export actions and reducer
export const { setLogin, logOut, setUserProfile } = authSlice.actions;
export default authSlice.reducer;
