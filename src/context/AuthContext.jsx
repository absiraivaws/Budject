import { createContext, useContext, useState, useEffect } from 'react';
import {
    createUserWithEmailAndPassword,
    signInWithEmailAndPassword,
    signOut,
    sendPasswordResetEmail,
    onAuthStateChanged,
    updateProfile
} from 'firebase/auth';
import { auth } from '../config/firebase.js';
import { initializeDefaultData, createOrUpdateUserRoot, recordReferralOnSignup } from '../services/firestoreService.js';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        // Listen for auth state changes
        const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
            if (firebaseUser) {
                setUser({
                    id: firebaseUser.uid,
                    email: firebaseUser.email,
                    displayName: firebaseUser.displayName
                });

                // Initialize default data for new users
                try {
                    await initializeDefaultData();
                } catch (error) {
                    console.error('Error initializing default data:', error);
                }
            } else {
                setUser(null);
            }
            setLoading(false);
        });

        return unsubscribe;
    }, []);

    const register = async (email, password, displayName = '', referredBy = null) => {
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);

        // Update profile with display name if provided
        if (displayName) {
            await updateProfile(userCredential.user, { displayName });
        }

        // Create root user document
        try {
            await createOrUpdateUserRoot(userCredential.user.uid, {
                email: userCredential.user.email,
                displayName: displayName || userCredential.user.displayName,
                referrals: 0
            });

            // If referredBy present, record referral
            if (referredBy) {
                try {
                    await recordReferralOnSignup(userCredential.user.uid, referredBy);
                } catch (e) {
                    console.error('Failed to record referral:', e);
                }
            }
        } catch (err) {
            console.error('Error creating user root doc:', err);
        }

        return {
            id: userCredential.user.uid,
            email: userCredential.user.email,
            displayName: displayName || userCredential.user.displayName
        };
    };

    const login = async (email, password) => {
        const userCredential = await signInWithEmailAndPassword(auth, email, password);
        return {
            id: userCredential.user.uid,
            email: userCredential.user.email,
            displayName: userCredential.user.displayName
        };
    };

    const logout = async () => {
        const { clearAllData } = await import('../services/db.js');
        await clearAllData();
        await signOut(auth);
    };

    const resetPassword = async (email) => {
        await sendPasswordResetEmail(auth, email);
    };

    const updateUserProfile = async (updates) => {
        if (auth.currentUser) {
            await updateProfile(auth.currentUser, updates);
            setUser(prev => ({ ...prev, ...updates }));
        }
    };

    const value = {
        user,
        loading,
        isAuthenticated: !!user,
        register,
        login,
        logout,
        resetPassword,
        updateUserProfile
    };

    return (
        <AuthContext.Provider value={value}>
            {children}
        </AuthContext.Provider>
    );
}

export function useAuth() {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
}
