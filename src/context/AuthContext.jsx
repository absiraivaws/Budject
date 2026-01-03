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
import { initializeDefaultData, createOrUpdateUserRoot } from '../services/firestoreService.js';

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
            // Include referredBy in the user root doc so it's recorded
            await createOrUpdateUserRoot(userCredential.user.uid, {
                email: userCredential.user.email,
                displayName: displayName || userCredential.user.displayName,
                referrals: 0,
                referredBy: referredBy || null
            });

            // If referredBy present, notify server-side endpoint (Vercel) to increment referrer's count
            if (referredBy) {
                try {
                    const idToken = await userCredential.user.getIdToken();
                    await fetch('/api/referral', {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                            'Authorization': `Bearer ${idToken}`
                        },
                        body: JSON.stringify({ referrerId: referredBy, newUserId: userCredential.user.uid })
                    });
                } catch (e) {
                    console.error('Failed to notify referral endpoint:', e);
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
        await signOut(auth);
    };

    const resetPassword = async (email) => {
        await sendPasswordResetEmail(auth, email);
    };

    const value = {
        user,
        loading,
        isAuthenticated: !!user,
        register,
        login,
        logout,
        resetPassword
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
