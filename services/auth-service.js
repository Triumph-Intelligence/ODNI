/**
 * Authentication Service
 * Handles user authentication via Firebase
 * 
 * Required: Firebase SDK must be loaded before this service
 * Include in HTML: <script src="https://www.gstatic.com/firebasejs/10.7.1/firebase-app-compat.js"></script>
 *                  <script src="https://www.gstatic.com/firebasejs/10.7.1/firebase-auth-compat.js"></script>
 */

const AuthService = {
  // Firebase auth instance
  auth: null,
  
  // Current user
  currentUser: null,
  
  // Authentication state listeners
  authStateListeners: [],

  /**
   * Initialize Firebase and Auth Service
   */
  async init() {
    try {
      // Check if Firebase is loaded
      if (typeof firebase === 'undefined') {
        Utils.error('Firebase SDK not loaded. Please include Firebase scripts in HTML.');
        return false;
      }

      // Initialize Firebase
      if (!firebase.apps.length) {
        firebase.initializeApp(CONFIG.firebase);
        Utils.info('Firebase initialized');
      }

      // Get auth instance
      this.auth = firebase.auth();

      // Set up auth state observer
      this.auth.onAuthStateChanged(user => {
        this.handleAuthStateChanged(user);
      });

      // Check for stored token
      const storedUser = this.getStoredUser();
      if (storedUser) {
        this.currentUser = storedUser;
      }

      Utils.info('Auth Service initialized');
      return true;

    } catch (error) {
      Utils.error('Failed to initialize Auth Service:', error);
      return false;
    }
  },

  /**
   * Handle auth state changes
   */
  handleAuthStateChanged(user) {
    if (user) {
      // User is signed in
      this.currentUser = {
        uid: user.uid,
        email: user.email,
        displayName: user.displayName || user.email.split('@')[0],
        photoURL: user.photoURL,
        emailVerified: user.emailVerified
      };

      // Store user data
      this.storeUser(this.currentUser);

      // Get user organization from Xano
      this.getUserOrganization();

      Utils.info('User signed in:', this.currentUser.email);

    } else {
      // User is signed out
      this.currentUser = null;
      this.clearStoredUser();
      Utils.info('User signed out');
    }

    // Notify listeners
    this.notifyAuthStateListeners(this.currentUser);

    // Dispatch global event
    window.dispatchEvent(new CustomEvent('auth-state-changed', {
      detail: { user: this.currentUser }
    }));
  },

  /**
   * Sign up new user
   */
  async signUp(email, password, displayName = null, organization = null) {
    try {
      // Create user in Firebase
      const userCredential = await this.auth.createUserWithEmailAndPassword(email, password);
      const user = userCredential.user;

      // Update profile if display name provided
      if (displayName) {
        await user.updateProfile({ displayName });
      }

      // Send verification email
      await user.sendEmailVerification();

      // Create user record in Xano
      if (organization) {
        await this.createUserInXano({
          uid: user.uid,
          email: user.email,
          displayName: displayName || user.email.split('@')[0],
          organization: organization
        });
      }

      Utils.info('User created successfully');
      
      return {
        success: true,
        user: user,
        message: 'Account created! Please check your email to verify your account.'
      };

    } catch (error) {
      Utils.error('Sign up error:', error);
      return {
        success: false,
        error: error.code,
        message: this.getErrorMessage(error.code)
      };
    }
  },

  /**
   * Sign in user
   */
  async signIn(email, password) {
    try {
      const userCredential = await this.auth.signInWithEmailAndPassword(email, password);
      
      Utils.info('User signed in successfully');
      
      return {
        success: true,
        user: userCredential.user
      };

    } catch (error) {
      Utils.error('Sign in error:', error);
      return {
        success: false,
        error: error.code,
        message: this.getErrorMessage(error.code)
      };
    }
  },

  /**
   * Sign out user
   */
  async signOut() {
    try {
      await this.auth.signOut();
      this.clearStoredUser();
      
      Utils.info('User signed out');
      
      return { success: true };

    } catch (error) {
      Utils.error('Sign out error:', error);
      return {
        success: false,
        error: error.code,
        message: 'Failed to sign out'
      };
    }
  },

  /**
   * Reset password
   */
  async resetPassword(email) {
    try {
      await this.auth.sendPasswordResetEmail(email);
      
      return {
        success: true,
        message: 'Password reset email sent! Check your inbox.'
      };

    } catch (error) {
      Utils.error('Password reset error:', error);
      return {
        success: false,
        error: error.code,
        message: this.getErrorMessage(error.code)
      };
    }
  },

  /**
   * Update user profile
   */
  async updateProfile(updates) {
    try {
      if (!this.auth.currentUser) {
        throw new Error('No user signed in');
      }

      await this.auth.currentUser.updateProfile(updates);
      
      // Update local user object
      if (this.currentUser) {
        this.currentUser = {
          ...this.currentUser,
          ...updates
        };
        this.storeUser(this.currentUser);
      }

      return { success: true };

    } catch (error) {
      Utils.error('Profile update error:', error);
      return {
        success: false,
        message: 'Failed to update profile'
      };
    }
  },

  /**
   * Change password
   */
  async changePassword(currentPassword, newPassword) {
    try {
      if (!this.auth.currentUser) {
        throw new Error('No user signed in');
      }

      // Re-authenticate user
      const credential = firebase.auth.EmailAuthProvider.credential(
        this.auth.currentUser.email,
        currentPassword
      );
      
      await this.auth.currentUser.reauthenticateWithCredential(credential);

      // Update password
      await this.auth.currentUser.updatePassword(newPassword);

      return {
        success: true,
        message: 'Password changed successfully'
      };

    } catch (error) {
      Utils.error('Password change error:', error);
      return {
        success: false,
        error: error.code,
        message: this.getErrorMessage(error.code)
      };
    }
  },

  /**
   * Get current user
   */
  getCurrentUser() {
    return this.currentUser;
  },

  /**
   * Check if user is authenticated
   */
  isAuthenticated() {
    return this.currentUser !== null;
  },

  /**
   * Get user's ID token
   */
  async getIdToken() {
    if (!this.auth.currentUser) {
      return null;
    }

    try {
      return await this.auth.currentUser.getIdToken();
    } catch (error) {
      Utils.error('Failed to get ID token:', error);
      return null;
    }
  },

  /**
   * Create user record in Xano
   */
  async createUserInXano(userData) {
    try {
      // This will be implemented with api-service.js
      // For now, just store locally
      const users = JSON.parse(localStorage.getItem(CONFIG.storage.prefix + 'users') || '[]');
      users.push(userData);
      localStorage.setItem(CONFIG.storage.prefix + 'users', JSON.stringify(users));

      return { success: true };

    } catch (error) {
      Utils.error('Failed to create user in Xano:', error);
      return { success: false };
    }
  },

  /**
   * Get user organization from Xano
   */
  async getUserOrganization() {
    try {
      if (!this.currentUser) return null;

      // This will be implemented with api-service.js
      // For now, get from localStorage
      const users = JSON.parse(localStorage.getItem(CONFIG.storage.prefix + 'users') || '[]');
      const user = users.find(u => u.uid === this.currentUser.uid);

      if (user && user.organization) {
        this.currentUser.organization = user.organization;
        this.storeUser(this.currentUser);
        
        // Set organization in visibility service
        if (window.VisibilityService) {
          VisibilityService.setOrganization(user.organization);
        }

        return user.organization;
      }

      // Default to oversight if no organization set
      return CONFIG.organizations.oversight;

    } catch (error) {
      Utils.error('Failed to get user organization:', error);
      return CONFIG.organizations.oversight;
    }
  },

  /**
   * Store user in localStorage
   */
  storeUser(user) {
    localStorage.setItem(
      CONFIG.storage.prefix + CONFIG.storage.keys.currentUser,
      JSON.stringify(user)
    );
  },

  /**
   * Get stored user from localStorage
   */
  getStoredUser() {
    const stored = localStorage.getItem(
      CONFIG.storage.prefix + CONFIG.storage.keys.currentUser
    );
    return stored ? JSON.parse(stored) : null;
  },

  /**
   * Clear stored user
   */
  clearStoredUser() {
    localStorage.removeItem(
      CONFIG.storage.prefix + CONFIG.storage.keys.currentUser
    );
  },

  /**
   * Add auth state listener
   */
  onAuthStateChanged(callback) {
    this.authStateListeners.push(callback);
    
    // Call immediately with current state
    callback(this.currentUser);
    
    // Return unsubscribe function
    return () => {
      const index = this.authStateListeners.indexOf(callback);
      if (index > -1) {
        this.authStateListeners.splice(index, 1);
      }
    };
  },

  /**
   * Notify all auth state listeners
   */
  notifyAuthStateListeners(user) {
    this.authStateListeners.forEach(callback => {
      try {
        callback(user);
      } catch (error) {
        Utils.error('Auth state listener error:', error);
      }
    });
  },

  /**
   * Get user-friendly error message
   */
  getErrorMessage(errorCode) {
    const errorMessages = {
      'auth/email-already-in-use': 'This email is already registered.',
      'auth/invalid-email': 'Invalid email address.',
      'auth/operation-not-allowed': 'Operation not allowed.',
      'auth/weak-password': 'Password is too weak. Use at least 8 characters.',
      'auth/user-disabled': 'This account has been disabled.',
      'auth/user-not-found': 'No account found with this email.',
      'auth/wrong-password': 'Incorrect password.',
      'auth/too-many-requests': 'Too many attempts. Please try again later.',
      'auth/network-request-failed': 'Network error. Please check your connection.',
      'auth/requires-recent-login': 'Please sign in again to continue.'
    };

    return errorMessages[errorCode] || 'An error occurred. Please try again.';
  }
};

// Make available globally
window.AuthService = AuthService;

// Log initialization
if (CONFIG.dev.debugMode) {
  console.log('🔐 Auth Service loaded');
}
