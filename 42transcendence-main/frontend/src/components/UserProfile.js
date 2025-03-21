import React, { useState, useEffect } from 'react';
import AvatarUpload from './AvatarUpload';
import { API_URL } from '../services/auth';

const UserProfile = () => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [isEditing, setIsEditing] = useState(false);
    const [formData, setFormData] = useState({
        display_name: '',
        email: ''
    });

    useEffect(() => {
        fetchUserProfile();
    }, []);

    const fetchUserProfile = async () => {
        try {
            const token = localStorage.getItem('auth_token');
            if (!token) {
                throw new Error('Authentication required');
            }

            const response = await fetch(`${API_URL}/users/me`, {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Accept': 'application/json'
                }
            });

            if (!response.ok) {
                throw new Error('Failed to fetch user data');
            }

            const userData = await response.json();
            setUser(userData);
            setFormData({
                display_name: userData.display_name || '',
                email: userData.email || ''
            });
        } catch (error) {
            console.error('Error fetching user data:', error);
            setError('Failed to load user profile');
        } finally {
            setLoading(false);
        }
    };

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            const token = localStorage.getItem('auth_token');
            if (!token) {
                throw new Error('Authentication required');
            }

            const response = await fetch(`${API_URL}/users/me`, {
                method: 'PUT',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(formData)
            });

            if (!response.ok) {
                throw new Error('Failed to update profile');
            }

            const updatedUser = await response.json();
            setUser(updatedUser);
            setIsEditing(false);
        } catch (error) {
            console.error('Error updating profile:', error);
            setError(error.message || 'Failed to update profile');
        }
    };

    const handleAvatarUpdate = (newAvatarUrl) => {
        setUser(prev => ({
            ...prev,
            avatar_url: newAvatarUrl
        }));
    };

    if (loading) return <div>Loading...</div>;
    if (error) return <div className="error">{error}</div>;
    if (!user) return <div>User not found</div>;

    return (
        <div className="user-profile">
            <div className="profile-header">
                <AvatarUpload 
                    currentAvatar={user.avatar_url} 
                    onAvatarUpdate={handleAvatarUpdate}
                />
                <h2>{user.username}</h2>
            </div>

            <div className="profile-content">
                {isEditing ? (
                    <form onSubmit={handleSubmit} className="edit-form">
                        <div className="form-group">
                            <label htmlFor="display_name">Display Name</label>
                            <input
                                type="text"
                                id="display_name"
                                name="display_name"
                                value={formData.display_name}
                                onChange={handleInputChange}
                            />
                        </div>

                        <div className="form-group">
                            <label htmlFor="email">Email</label>
                            <input
                                type="email"
                                id="email"
                                name="email"
                                value={formData.email}
                                onChange={handleInputChange}
                            />
                        </div>

                        <div className="form-actions">
                            <button type="submit" className="save-button">
                                Save Changes
                            </button>
                            <button 
                                type="button" 
                                className="cancel-button"
                                onClick={() => setIsEditing(false)}
                            >
                                Cancel
                            </button>
                        </div>
                    </form>
                ) : (
                    <div className="profile-info">
                        <div className="info-group">
                            <label>Display Name</label>
                            <p>{user.display_name || 'Not set'}</p>
                        </div>

                        <div className="info-group">
                            <label>Email</label>
                            <p>{user.email || 'Not set'}</p>
                        </div>

                        <div className="info-group">
                            <label>Member Since</label>
                            <p>{new Date(user.created_at).toLocaleDateString()}</p>
                        </div>

                        <div className="info-group">
                            <label>Last Seen</label>
                            <p>{new Date(user.last_seen).toLocaleString()}</p>
                        </div>

                        <div className="info-group">
                            <label>Status</label>
                            <p className={`status ${user.is_online ? 'online' : 'offline'}`}>
                                {user.is_online ? 'Online' : 'Offline'}
                            </p>
                        </div>

                        <button 
                            className="edit-button"
                            onClick={() => setIsEditing(true)}
                        >
                            Edit Profile
                        </button>
                    </div>
                )}
            </div>

            <style jsx>{`
                .user-profile {
                    max-width: 800px;
                    margin: 0 auto;
                    padding: 2rem;
                }

                .profile-header {
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    gap: 1rem;
                    margin-bottom: 2rem;
                }

                .profile-content {
                    background: white;
                    border-radius: 8px;
                    padding: 2rem;
                    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
                }

                .profile-info {
                    display: grid;
                    gap: 1.5rem;
                }

                .info-group {
                    display: grid;
                    gap: 0.5rem;
                }

                .info-group label {
                    font-weight: 600;
                    color: #666;
                }

                .status {
                    display: inline-block;
                    padding: 0.25rem 0.75rem;
                    border-radius: 1rem;
                    font-size: 0.875rem;
                }

                .status.online {
                    background-color: #e6f4ea;
                    color: #1e7e34;
                }

                .status.offline {
                    background-color: #f8d7da;
                    color: #721c24;
                }

                .edit-form {
                    display: grid;
                    gap: 1.5rem;
                }

                .form-group {
                    display: grid;
                    gap: 0.5rem;
                }

                .form-group label {
                    font-weight: 600;
                    color: #666;
                }

                .form-group input {
                    padding: 0.5rem;
                    border: 1px solid #ddd;
                    border-radius: 4px;
                    font-size: 1rem;
                }

                .form-actions {
                    display: flex;
                    gap: 1rem;
                    margin-top: 1rem;
                }

                .edit-button,
                .save-button,
                .cancel-button {
                    padding: 0.5rem 1rem;
                    border: none;
                    border-radius: 4px;
                    cursor: pointer;
                    font-size: 1rem;
                    transition: background-color 0.2s;
                }

                .edit-button {
                    background-color: #4a90e2;
                    color: white;
                }

                .save-button {
                    background-color: #28a745;
                    color: white;
                }

                .cancel-button {
                    background-color: #dc3545;
                    color: white;
                }

                .edit-button:hover {
                    background-color: #357abd;
                }

                .save-button:hover {
                    background-color: #218838;
                }

                .cancel-button:hover {
                    background-color: #c82333;
                }

                .error {
                    color: #dc3545;
                    text-align: center;
                    padding: 1rem;
                    background-color: #f8d7da;
                    border-radius: 4px;
                    margin: 1rem 0;
                }
            `}</style>
        </div>
    );
};

export default UserProfile; 