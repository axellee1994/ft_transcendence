import React, { useState, useRef } from 'react';
import axios from 'axios';

const AvatarUpload = ({ currentAvatar, onAvatarUpdate }) => {
    const [preview, setPreview] = useState(null);
    const [error, setError] = useState(null);
    const [isUploading, setIsUploading] = useState(false);
    const fileInputRef = useRef(null);

    const handleFileSelect = (event) => {
        const file = event.target.files[0];
        if (!file) return;

        // Validate file type
        if (!file.type.startsWith('image/')) {
            setError('Please select an image file');
            return;
        }

        // Validate file size (5MB limit)
        if (file.size > 5 * 1024 * 1024) {
            setError('File size must be less than 5MB');
            return;
        }

        // Create preview
        const reader = new FileReader();
        reader.onloadend = () => {
            setPreview(reader.result);
            setError(null);
        };
        reader.readAsDataURL(file);

        // Upload file
        uploadAvatar(file);
    };

    const uploadAvatar = async (file) => {
        setIsUploading(true);
        setError(null);

        const formData = new FormData();
        formData.append('avatar', file);

        try {
            const token = localStorage.getItem('auth_token');
            const response = await axios.post('/api/users/avatar', formData, {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'multipart/form-data',
                },
            });

            onAvatarUpdate(response.data.avatar_url);
            setPreview(null);
        } catch (err) {
            setError(err.response?.data?.error || 'Failed to upload avatar');
            setPreview(null);
        } finally {
            setIsUploading(false);
        }
    };

    return (
        <div className="avatar-upload">
            <div className="avatar-preview">
                <img 
                    src={preview || currentAvatar} 
                    alt="Avatar preview" 
                    className="avatar-image"
                />
            </div>
            
            <div className="avatar-actions">
                <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleFileSelect}
                    accept="image/*"
                    style={{ display: 'none' }}
                />
                
                <button
                    onClick={() => fileInputRef.current?.click()}
                    disabled={isUploading}
                    className="upload-button"
                >
                    {isUploading ? 'Uploading...' : 'Change Avatar'}
                </button>
            </div>

            {error && (
                <div className="error-message">
                    {error}
                </div>
            )}

            <style jsx>{`
                .avatar-upload {
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    gap: 1rem;
                }

                .avatar-preview {
                    width: 150px;
                    height: 150px;
                    border-radius: 50%;
                    overflow: hidden;
                    border: 2px solid #ddd;
                }

                .avatar-image {
                    width: 100%;
                    height: 100%;
                    object-fit: cover;
                }

                .avatar-actions {
                    display: flex;
                    gap: 1rem;
                }

                .upload-button {
                    padding: 0.5rem 1rem;
                    background-color: #4a90e2;
                    color: white;
                    border: none;
                    border-radius: 4px;
                    cursor: pointer;
                    transition: background-color 0.2s;
                }

                .upload-button:hover {
                    background-color: #357abd;
                }

                .upload-button:disabled {
                    background-color: #ccc;
                    cursor: not-allowed;
                }

                .error-message {
                    color: #dc3545;
                    font-size: 0.875rem;
                    text-align: center;
                }
            `}</style>
        </div>
    );
};

export default AvatarUpload; 