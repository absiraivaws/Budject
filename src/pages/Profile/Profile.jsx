import { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext.jsx';
import { getUserRoot, createOrUpdateUserRoot } from '../../services/firestoreService.js';
import { LOCATIONS } from '../../config/locations.js';
import Card from '../../components/UI/Card.jsx';
import Button from '../../components/UI/Button.jsx';
import './Profile.css';

export default function Profile() {
    const { user, updateUserProfile } = useAuth();
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [formData, setFormData] = useState({
        fullName: '',
        nickname: '',
        dob: '',
        sex: '',
        country: '',
        city: '',
        whatsappNumber: ''
    });

    // Referral state
    const [referralsCount, setReferralsCount] = useState(0);
    const [copied, setCopied] = useState(false);

    useEffect(() => {
        let mounted = true;
        async function fetchData() {
            if (!user) return;
            try {
                const profile = await getUserRoot();
                if (!mounted) return;

                if (profile) {
                    setFormData({
                        fullName: profile.fullName || '',
                        nickname: profile.nickname || profile.displayName || '',
                        dob: profile.dob || '',
                        sex: profile.sex || '',
                        country: profile.country || '',
                        city: profile.city || '',
                        whatsappNumber: profile.whatsappNumber || ''
                    });
                    setReferralsCount(profile.referrals || 0);
                }
            } catch (err) {
                console.error('Failed to fetch profile:', err);
            } finally {
                if (mounted) setLoading(false);
            }
        }
        fetchData();
        return () => { mounted = false; };
    }, [user]);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => {
            const updates = { [name]: value };
            // Reset city if country changes
            if (name === 'country') {
                updates.city = '';
            }
            return { ...prev, ...updates };
        });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setSaving(true);
        try {
            const displayName = formData.nickname || formData.fullName;

            // Update Firestore
            await createOrUpdateUserRoot(user.id, {
                ...formData,
                displayName
            });

            // Update Auth Profile (triggers header update)
            await updateUserProfile({ displayName });

            alert('Profile updated successfully!');
        } catch (err) {
            console.error('Error updating profile:', err);
            alert('Failed to update profile.');
        } finally {
            setSaving(false);
        }
    };

    // Referral Logic
    const referralLink = user ? `${window.location.origin}/register?ref=${user.id}` : '';

    const handleCopyLink = async () => {
        try {
            await navigator.clipboard.writeText(referralLink);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        } catch (err) {
            console.error('Copy failed', err);
        }
    };

    if (loading) return <div className="loading-spinner">Loading...</div>;

    const countries = Object.keys(LOCATIONS).sort();
    const cities = formData.country ? (LOCATIONS[formData.country] || []).sort() : [];

    return (
        <div className="profile-page fade-in">
            <div className="profile-header">
                <div>
                    <h1>My Profile</h1>
                    <p className="text-secondary">Manage your personal information</p>
                </div>
            </div>

            {/* Stats Cards - Similar to AssetManager */}
            <div className="grid grid-cols-3">
                <Card glass>
                    <div className="stat-card">
                        <div className="stat-icon profile-icon">👤</div>
                        <div className="stat-content">
                            <div className="stat-label">Profile Status</div>
                            <div className="stat-value text-primary">Active</div>
                        </div>
                    </div>
                </Card>

                <Card glass>
                    <div className="stat-card">
                        <div className="stat-icon referral-icon">🤝</div>
                        <div className="stat-content">
                            <div className="stat-label">Total Referrals</div>
                            <div className="stat-value text-success">{referralsCount}</div>
                        </div>
                    </div>
                </Card>

                <Card glass>
                    <div className="stat-card">
                        <div className="stat-icon location-icon">📍</div>
                        <div className="stat-content">
                            <div className="stat-label">Location</div>
                            <div className="stat-value text-secondary-dark">
                                {formData.country || 'Not Set'}
                            </div>
                        </div>
                    </div>
                </Card>
            </div>

            {/* Main Content */}
            <div className="profile-content-grid">
                {/* Referral Section - Moved to Top */}
                <Card className="full-width-card">
                    <div className="card-header-custom">
                        <h3>Referral Program</h3>
                    </div>
                    <div className="profile-section">
                        <p className="text-secondary">
                            Invite your friends to Spendex and track your referrals here.
                        </p>

                        <div className="referral-container">
                            <div className="referral-link-box">
                                <span className="referral-link-text">{referralLink}</span>
                                <Button
                                    type="button"
                                    variant="primary"
                                    size="sm"
                                    onClick={handleCopyLink}
                                >
                                    {copied ? 'Copied!' : 'Copy'}
                                </Button>
                            </div>
                        </div>
                    </div>
                </Card>

                {/* Profile Form */}
                <Card className="full-width-card">
                    <div className="card-header-custom">
                        <h3>Edit Profile</h3>
                    </div>
                    <form onSubmit={handleSubmit} className="profile-form">
                        <div className="form-grid">
                            <div className="form-group full-width">
                                <label className="form-label">Email</label>
                                <input
                                    type="email"
                                    className="form-input"
                                    value={user?.email || ''}
                                    disabled
                                    readOnly
                                />
                            </div>

                            <div className="form-group full-width">
                                <label className="form-label">Full Name</label>
                                <input
                                    type="text"
                                    name="fullName"
                                    className="form-input"
                                    value={formData.fullName}
                                    onChange={handleChange}
                                    placeholder="Enter your full name"
                                />
                            </div>

                            <div className="form-group">
                                <label className="form-label">Nickname (Display Name)</label>
                                <input
                                    type="text"
                                    name="nickname"
                                    className="form-input"
                                    value={formData.nickname}
                                    onChange={handleChange}
                                    placeholder="How should we call you?"
                                    required
                                />
                            </div>

                            <div className="form-group">
                                <label className="form-label">Date of Birth</label>
                                <input
                                    type="date"
                                    name="dob"
                                    className="form-input"
                                    value={formData.dob}
                                    onChange={handleChange}
                                />
                            </div>

                            <div className="form-group">
                                <label className="form-label">Sex</label>
                                <select
                                    name="sex"
                                    className="form-select"
                                    value={formData.sex}
                                    onChange={handleChange}
                                >
                                    <option value="">Select...</option>
                                    <option value="male">Male</option>
                                    <option value="female">Female</option>
                                    <option value="other">Other</option>
                                </select>
                            </div>

                            <div className="form-group">
                                <label className="form-label">Country</label>
                                <select
                                    name="country"
                                    className="form-select"
                                    value={formData.country}
                                    onChange={handleChange}
                                >
                                    <option value="">Select Country...</option>
                                    {countries.map(c => (
                                        <option key={c} value={c}>{c}</option>
                                    ))}
                                </select>
                            </div>

                            <div className="form-group">
                                <label className="form-label">City</label>
                                <select
                                    name="city"
                                    className="form-select"
                                    value={formData.city}
                                    onChange={handleChange}
                                    disabled={!formData.country}
                                >
                                    <option value="">Select City...</option>
                                    {cities.map(c => (
                                        <option key={c} value={c}>{c}</option>
                                    ))}
                                </select>
                            </div>

                            <div className="form-group full-width">
                                <label className="form-label">WhatsApp Number</label>
                                <input
                                    type="tel"
                                    name="whatsappNumber"
                                    className="form-input"
                                    value={formData.whatsappNumber}
                                    onChange={handleChange}
                                    placeholder="+94 77 123 4567"
                                />
                            </div>
                        </div>

                        <div className="profile-actions">
                            <Button type="submit" variant="primary" disabled={saving}>
                                {saving ? 'Saving...' : 'Save Changes'}
                            </Button>
                        </div>
                    </form>
                </Card>
            </div>
        </div>
    );
}
