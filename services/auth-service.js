/**
 * Authentication Service
 * Handles Firebase Authentication with Demo Mode fallback
 */

const AuthService = {
    currentUser: null,
    isInitialized: false,
    demoMode: false,

    // Demo users (for testing without Firebase)
    demoUsers: [
        { email: 'demo@triumphatlantic.com', password: 'demo123', name: 'Demo User', org: 'Triumph Atlantic' },
        { email: 'Ryan@triumphatlantic.com', password: 'demo123', name: 'Ryan Morris', org: 'Triumph Atlantic' },
        { email: 'Rob@triumphatlantic.com', password: 'admin123', name: 'Rob Sebia - Admin User', org: 'Triumph Atlantic' },
        { email: 'Gianfranco@guerciogroup.com', password: 'demo123', name: 'Gianfranco Guercio', org: 'Guercio Energy Group' },
        { email: 'Bill@myersindustrialsvc.com', password: 'demo123', name: 'Bill Myers', org: 'Myers Industrial Services' },
        { email: 'mike@kmp.com', password: 'demo123', name: 'Mike KMP', org: 'KMP' },
        { email: 'wadey@stableworks.com', password: 'demo123', name: 'Wade Zane', org: 'Stable Works' },
        { email: 'Ericd@reddoormarketingco.com', password: 'demo123', name: 'Eric Quidort', org: 'Red Door' },
        { email: 'Nick@fritzstaffing.com', password: 'demo123', name: 'Nick Wagner', org: 'Fritz Staffing' },
        { email: 'Ryan@byersindustrial.com', password: 'demo123', name: 'Ryan Morris', org: 'Byers' }
    ],

    /**
     * Initialize the authentication service
     */
    async init() {
        if (this.isInitialized) {
            return;
        }

        console.log('🔐 Initializing Auth Service...');

        // Check if Firebase is properly configured
        const firebaseConfig = window.CONFIG?.firebase;
        
        if (!firebaseConfig || !firebaseConfig.apiKey || firebaseConfig.apiKey.includes('YOUR_')) {
            console.warn('⚠️ Firebase not configured. Running in DEMO MODE.');
            this.demoMode = true;
            this.isInitialized = true;
            this.restoreDemoSession();
            return;
        }

        try {
            // Initialize Firebase
            if (!firebase.apps.length) {
                firebase.initializeApp(firebaseConfig);
                console.log('✅ Firebase initialized');
            }

            // Set up auth state listener
            firebase.auth().onAuthStateChanged((user) => {
                this.currentUser = user;
                console.log('Auth state changed:', user ? user.email : 'No user');
            });

            this.isInitialized = true;
            console.log('✅ Auth Service initialized (Firebase mode)');

        } catch (error) {
            console.error('❌ Firebase initialization failed, falling back to DEMO MODE:', error);
            this.demoMode = true;
            this.isInitialized = true;
            this.restoreDemoSession();
        }
    },

    /**
     * Check if running in demo mode
     */
    isDemoMode() {
        return this.demoMode;
    },

    /**
     * Restore demo session from localStorage
     */
    restoreDemoSession() {
        const savedUser = localStorage.getItem('demoUser');
        if (savedUser) {
            this.currentUser = JSON.parse(savedUser);
            console.log('✅ Restored demo session:', this.currentUser.email);
        }
    },

    /**
     * Save demo session to localStorage
     */
    saveDemoSession(user) {
        localStorage.setItem('demoUser', JSON.stringify(user));
    },

    /**
     * Clear demo session
     */
    clearDemoSession() {
        localStorage.removeItem('demoUser');
    },

    /**
     * Login with email and password
     */
    async login(email, password) {
        await this.init();

        if (this.demoMode) {
            return this.demoLogin(email, password);
        }

        try {
            const userCredential = await firebase.auth().signInWithEmailAndPassword(email, password);
            this.currentUser = userCredential.user;
            console.log('✅ Login successful:', this.currentUser.email);
            return this.currentUser;
        } catch (error) {
            console.error('❌ Login failed:', error);
            throw error;
        }
    },

    /**
     * Demo mode login (no Firebase required)
     */
    demoLogin(email, password) {
        console.log('🎭 Demo login attempt:', email);
        
        const user = this.demoUsers.find(u => 
            u.email.toLowerCase() === email.toLowerCase() && u.password === password
        );

        if (!user) {
            const error = new Error('Invalid credentials');
            error.code = 'auth/wrong-password';
            throw error;
        }

        // Create mock user object
        this.currentUser = {
            uid: 'demo-' + Date.now(),
            email: user.email,
            displayName: user.name,
            emailVerified: true,
            metadata: {
                creationTime: new Date().toISOString(),
                lastSignInTime: new Date().toISOString()
            }
        };

        // Save to localStorage
        this.saveDemoSession(this.currentUser);

        console.log('✅ Demo login successful:', this.currentUser.email);
        return this.currentUser;
    },

    /**
     * Login with Google
     */
    async loginWithGoogle() {
        await this.init();

        if (this.demoMode) {
            // In demo mode, just create a mock Google user
            this.currentUser = {
                uid: 'demo-google-' + Date.now(),
                email: 'demo@triumphatl.com',
                displayName: 'Demo Google User',
                emailVerified: true,
                photoURL: 'https://via.placeholder.com/150',
                metadata: {
                    creationTime: new Date().toISOString(),
                    lastSignInTime: new Date().toISOString()
                }
            };
            this.saveDemoSession(this.currentUser);
            console.log('✅ Demo Google login successful');
            return this.currentUser;
        }

        try {
            const provider = new firebase.auth.GoogleAuthProvider();
            const result = await firebase.auth().signInWithPopup(provider);
            this.currentUser = result.user;
            console.log('✅ Google login successful:', this.currentUser.email);
            return this.currentUser;
        } catch (error) {
            console.error('❌ Google login failed:', error);
            throw error;
        }
    },

    /**
     * Register new user
     */
    async register(email, password, displayName) {
        await this.init();

        if (this.demoMode) {
            // In demo mode, just add to demo users
            const newUser = {
                uid: 'demo-' + Date.now(),
                email: email,
                displayName: displayName,
                emailVerified: false,
                metadata: {
                    creationTime: new Date().toISOString(),
                    lastSignInTime: new Date().toISOString()
                }
            };
            this.currentUser = newUser;
            this.saveDemoSession(this.currentUser);
            console.log('✅ Demo registration successful:', email);
            return this.currentUser;
        }

        try {
            const userCredential = await firebase.auth().createUserWithEmailAndPassword(email, password);
            
            // Update profile with display name
            if (displayName) {
                await userCredential.user.updateProfile({
                    displayName: displayName
                });
            }

            this.currentUser = userCredential.user;
            console.log('✅ Registration successful:', this.currentUser.email);
            return this.currentUser;
        } catch (error) {
            console.error('❌ Registration failed:', error);
            throw error;
        }
    },

    /**
     * Logout
     */
    async logout() {
        if (this.demoMode) {
            this.currentUser = null;
            this.clearDemoSession();
            console.log('✅ Demo logout successful');
            return;
        }

        try {
            await firebase.auth().signOut();
            this.currentUser = null;
            console.log('✅ Logout successful');
        } catch (error) {
            console.error('❌ Logout failed:', error);
            throw error;
        }
    },

    /**
     * Reset password
     */
    async resetPassword(email) {
        await this.init();

        if (this.demoMode) {
            console.log('🎭 Demo password reset for:', email);
            // In demo mode, just simulate success
            return Promise.resolve();
        }

        try {
            await firebase.auth().sendPasswordResetEmail(email);
            console.log('✅ Password reset email sent to:', email);
        } catch (error) {
            console.error('❌ Password reset failed:', error);
            throw error;
        }
    },

    /**
     * Get current user
     */
    async getCurrentUser() {
        await this.init();

        if (this.demoMode) {
            return this.currentUser;
        }

        return new Promise((resolve) => {
            const unsubscribe = firebase.auth().onAuthStateChanged((user) => {
                unsubscribe();
                this.currentUser = user;
                resolve(user);
            });
        });
    },

    /**
     * Update user profile
     */
    async updateProfile(updates) {
        if (this.demoMode) {
            this.currentUser = { ...this.currentUser, ...updates };
            this.saveDemoSession(this.currentUser);
            console.log('✅ Demo profile updated');
            return;
        }

        try {
            const user = firebase.auth().currentUser;
            if (!user) {
                throw new Error('No user logged in');
            }

            await user.updateProfile(updates);
            console.log('✅ Profile updated');
        } catch (error) {
            console.error('❌ Profile update failed:', error);
            throw error;
        }
    },

    /**
     * Update email
     */
    async updateEmail(newEmail) {
        if (this.demoMode) {
            this.currentUser.email = newEmail;
            this.saveDemoSession(this.currentUser);
            console.log('✅ Demo email updated');
            return;
        }

        try {
            const user = firebase.auth().currentUser;
            if (!user) {
                throw new Error('No user logged in');
            }

            await user.updateEmail(newEmail);
            console.log('✅ Email updated');
        } catch (error) {
            console.error('❌ Email update failed:', error);
            throw error;
        }
    },

    /**
     * Update password
     */
    async updatePassword(newPassword) {
        if (this.demoMode) {
            console.log('✅ Demo password updated');
            return;
        }

        try {
            const user = firebase.auth().currentUser;
            if (!user) {
                throw new Error('No user logged in');
            }

            await user.updatePassword(newPassword);
            console.log('✅ Password updated');
        } catch (error) {
            console.error('❌ Password update failed:', error);
            throw error;
        }
    },

    /**
     * Delete user account
     */
    async deleteAccount() {
        if (this.demoMode) {
            this.currentUser = null;
            this.clearDemoSession();
            console.log('✅ Demo account deleted');
            return;
        }

        try {
            const user = firebase.auth().currentUser;
            if (!user) {
                throw new Error('No user logged in');
            }

            await user.delete();
            this.currentUser = null;
            console.log('✅ Account deleted');
        } catch (error) {
            console.error('❌ Account deletion failed:', error);
            throw error;
        }
    },

    /**
     * Get ID token for API calls
     */
    async getIdToken() {
        if (this.demoMode) {
            return 'demo-token-' + Date.now();
        }

        try {
            const user = firebase.auth().currentUser;
            if (!user) {
                throw new Error('No user logged in');
            }

            return await user.getIdToken();
        } catch (error) {
            console.error('❌ Failed to get ID token:', error);
            throw error;
        }
    }
};

// Export to window
window.AuthService = AuthService;
