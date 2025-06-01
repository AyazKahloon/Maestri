import { createSlice } from '@reduxjs/toolkit';

// Helper function to safely get from localStorage
const getFromStorage = (key) => {
  try {
    if (typeof window !== 'undefined') {
      return localStorage.getItem(key);
    }
    return null;
  } catch (error) {
    console.error('Error reading from localStorage:', error);
    return null;
  }
};

// Helper function to safely parse JSON
const parseStoredUser = (userData) => {
  try {
    return userData ? JSON.parse(userData) : null;
  } catch (error) {
    console.error('Error parsing stored user:', error);
    return null;
  }
};

// Initialize state from localStorage
const initializeState = () => {
  const token = getFromStorage('token');
  const userData = getFromStorage('user');
  const userType = getFromStorage('userType');
  const parsedUser = parseStoredUser(userData);

  // Only consider authenticated if all required data exists and user has isAuthenticated flag
  const isAuthenticated = !!(token && parsedUser && parsedUser.isAuthenticated && userType);

  return {
    user: isAuthenticated ? parsedUser : null,
    token: isAuthenticated ? token : null,
    isAuthenticated,
    loading: false,
    error: null,
    userType: isAuthenticated ? userType : null,
  };
};

const initialState = initializeState();

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    loginStart: (state) => {
      state.loading = true;
      state.error = null;
    },
    loginSuccess: (state, action) => {
      state.loading = false;
      state.isAuthenticated = true;
      state.user = action.payload.user;
      state.token = action.payload.token;
      state.userType = action.payload.user.userType;
      state.error = null;
      
      // Store in localStorage
      try {
        localStorage.setItem('token', action.payload.token);
        localStorage.setItem('user', JSON.stringify(action.payload.user));
        localStorage.setItem('userType', action.payload.user.userType);
      } catch (error) {
        console.error('Error storing to localStorage:', error);
      }
    },
    loginFailure: (state, action) => {
      state.loading = false;
      state.isAuthenticated = false;
      state.user = null;
      state.token = null;
      state.userType = null;
      state.error = action.payload;
      
      // Clear localStorage
      try {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        localStorage.removeItem('userType');
      } catch (error) {
        console.error('Error clearing localStorage:', error);
      }
    },
    registerStart: (state) => {
      state.loading = true;
      state.error = null;
    },
    registerSuccess: (state, action) => {
      state.loading = false;
      state.isAuthenticated = true;
      state.user = action.payload.user;
      state.token = action.payload.token;
      state.userType = action.payload.user.userType;
      state.error = null;
      
      // Store in localStorage
      try {
        localStorage.setItem('token', action.payload.token);
        localStorage.setItem('user', JSON.stringify(action.payload.user));
        localStorage.setItem('userType', action.payload.user.userType);
      } catch (error) {
        console.error('Error storing to localStorage:', error);
      }
    },
    registerFailure: (state, action) => {
      state.loading = false;
      state.isAuthenticated = false;
      state.user = null;
      state.token = null;
      state.userType = null;
      state.error = action.payload;
      
      // Clear localStorage
      try {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        localStorage.removeItem('userType');
      } catch (error) {
        console.error('Error clearing localStorage:', error);
      }
    },
    logout: (state) => {
      state.user = null;
      state.token = null;
      state.isAuthenticated = false;
      state.userType = null;
      state.error = null;
      state.loading = false;
      
      // Clear localStorage
      try {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        localStorage.removeItem('userType');
      } catch (error) {
        console.error('Error clearing localStorage:', error);
      }
    },
    clearError: (state) => {
      state.error = null;
    },
    setUser: (state, action) => {
      state.user = action.payload;
      state.userType = action.payload.userType;
      
      // Store in localStorage
      try {
        localStorage.setItem('user', JSON.stringify(action.payload));
        localStorage.setItem('userType', action.payload.userType);
      } catch (error) {
        console.error('Error storing to localStorage:', error);
      }
    },
    loadUserFromStorage: (state) => {
      const token = getFromStorage('token');
      const userData = getFromStorage('user');
      const userType = getFromStorage('userType');
      
      if (token && userData && userType) {
        const user = parseStoredUser(userData);
        if (user && user.isAuthenticated) {
          state.token = token;
          state.user = user;
          state.userType = userType;
          state.isAuthenticated = true;
        } else {
          // Clear invalid data
          try {
            localStorage.removeItem('token');
            localStorage.removeItem('user');
            localStorage.removeItem('userType');
          } catch (error) {
            console.error('Error clearing localStorage:', error);
          }
          state.token = null;
          state.user = null;
          state.userType = null;
          state.isAuthenticated = false;
        }
      }
    },
  },
});

export const {
  loginStart,
  loginSuccess,
  loginFailure,
  registerStart,
  registerSuccess,
  registerFailure,
  logout,
  clearError,
  setUser,
  loadUserFromStorage,
} = authSlice.actions;

export default authSlice.reducer;
