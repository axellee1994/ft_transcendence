import { AuthService } from './auth';

const googleClientId = '523736629943-2mvnn0n0a0k9ebknnainp04mq8gf0ac6.apps.googleusercontent.com';
const redirectUri = 'https://localhost:3000/api/auth/google/callback';

const googleAuthUrl = new URL('https://accounts.google.com/o/oauth2/v2/auth');
googleAuthUrl.searchParams.set('client_id', googleClientId);
googleAuthUrl.searchParams.set('redirect_uri', redirectUri);
googleAuthUrl.searchParams.set('response_type', 'code');
googleAuthUrl.searchParams.set('scope', 'email profile');

export function initializeGoogleSignIn(): void {
    const googleSignInButton = document.getElementById('google-sign-in');
    if (googleSignInButton) {
        googleSignInButton.addEventListener('click', () => {
            window.location.href = googleAuthUrl.toString();
        });
    }
}

// On page load, checks URL for specific parameters and handles them accordingly (existing/new users).
window.onload = () => {
    
    const urlParams = new URLSearchParams(window.location.search);
    const redirected = urlParams.get('redirected');
    const avatar_url = urlParams.get('avatar_url');

    if (redirected === 'true' && avatar_url) {
        
        function getCookie(name: string): string | null {
            const value = `; ${document.cookie}`;
            const parts = value.split(`; ${name}=`);
            if (parts.length === 2) return parts.pop()!.split(';').shift() || null;
            return null;
        }

        const token = getCookie('auth_token');
        const username = getCookie('username');
        const email = getCookie('email');
        const id = getCookie('user_id');
        const display_name = getCookie('display_name') || '';

        if (token && username && email) {
            if (avatar_url !== 'null') {
                if (!display_name || display_name === 'null') {
                    
                    custom_avatar_only(token, username, email, id, avatar_url);
                } else {
                    
                    full_custom_settings(token, username, email, id, display_name, avatar_url);
                }
            }
            else if (avatar_url === 'null') {
                if (display_name !== 'null') {
                    
                    custom_displayname_only(token, username, email, id, display_name);
                } else {
                    
                    default_settings(token, username, email, id);
                }
            }
        } else {
            console.log('auth_token or username not found in cookies');
        }
    }
    else if (redirected === 'true' && !avatar_url) {
        
        function getCookie(name: string): string | null {
            const value = `; ${document.cookie}`;
            const parts = value.split(`; ${name}=`);
            if (parts.length === 2) return parts.pop()!.split(';').shift() || null;
            return null;
        }

        const token = getCookie('auth_token');
        const username = getCookie('username');
        const email = getCookie('email');
        const id = getCookie('user_id');

        if (token && username && email) {
            default_settings(token, username, email, id);
        } else {
            console.log('auth_token or username not found in cookies');
        }
    }
};


function default_settings(token: string, username: string, email: string, id: string): void {
    
    localStorage.setItem('auth_token', token);
    localStorage.setItem('user_data', JSON.stringify({
        username: decodeURIComponent(username),
        email: decodeURIComponent(email),
        id: Number(decodeURIComponent(id)),
        is_remote_user: true
    }));
    
    const authService = AuthService.getInstance();
    authService.updateCurrentUserFromlocalStorage();

    document.cookie = 'auth_token=; Path=/; Expires=Thu, 01 Jan 1970 00:00:01 GMT; SameSite=None; Secure';
    document.cookie = 'username=; Path=/; Expires=Thu, 01 Jan 1970 00:00:01 GMT; SameSite=None; Secure';
    document.cookie = 'email=; Path=/; Expires=Thu, 01 Jan 1970 00:00:01 GMT; SameSite=None; Secure';
    document.cookie = 'user_id=; Path=/; Expires=Thu, 01 Jan 1970 00:00:01 GMT; SameSite=None; Secure';
}

function full_custom_settings(token: string, username: string, email: string, id: string, display_name: string, avatar_url: string): void {
    
    localStorage.setItem('auth_token', token);
    localStorage.setItem('user_data', JSON.stringify({
        username: decodeURIComponent(username),
        email: decodeURIComponent(email),
        id: Number(decodeURIComponent(id)),
        display_name: decodeURIComponent(display_name),
        avatar_url: decodeURIComponent(avatar_url),
        is_remote_user: true
    }));
    
    const authService = AuthService.getInstance();
    authService.updateCurrentUserFromlocalStorage();

    document.cookie = 'auth_token=; Path=/; Expires=Thu, 01 Jan 1970 00:00:01 GMT; SameSite=None; Secure';
    document.cookie = 'username=; Path=/; Expires=Thu, 01 Jan 1970 00:00:01 GMT; SameSite=None; Secure';
    document.cookie = 'email=; Path=/; Expires=Thu, 01 Jan 1970 00:00:01 GMT; SameSite=None; Secure';
    document.cookie = 'user_id=; Path=/; Expires=Thu, 01 Jan 1970 00:00:01 GMT; SameSite=None; Secure';
    document.cookie = 'display_name=; Path=/; Expires=Thu, 01 Jan 1970 00:00:01 GMT; SameSite=None; Secure';
}

function custom_avatar_only(token: string, username: string, email: string, id: string, avatar_url: string): void {
    
    localStorage.setItem('auth_token', token);
    localStorage.setItem('user_data', JSON.stringify({
        username: decodeURIComponent(username),
        email: decodeURIComponent(email),
        id: Number(decodeURIComponent(id)),
        avatar_url: decodeURIComponent(avatar_url),
        is_remote_user: true
    }));
    
    const authService = AuthService.getInstance();
    authService.updateCurrentUserFromlocalStorage();

    document.cookie = 'auth_token=; Path=/; Expires=Thu, 01 Jan 1970 00:00:01 GMT; SameSite=None; Secure';
    document.cookie = 'username=; Path=/; Expires=Thu, 01 Jan 1970 00:00:01 GMT; SameSite=None; Secure';
    document.cookie = 'email=; Path=/; Expires=Thu, 01 Jan 1970 00:00:01 GMT; SameSite=None; Secure';
    document.cookie = 'user_id=; Path=/; Expires=Thu, 01 Jan 1970 00:00:01 GMT; SameSite=None; Secure';
    document.cookie = 'display_name=; Path=/; Expires=Thu, 01 Jan 1970 00:00:01 GMT; SameSite=None; Secure';
}

function custom_displayname_only(token: string, username: string, email: string, id: string, display_name: string): void {
    
    localStorage.setItem('auth_token', token);
    localStorage.setItem('user_data', JSON.stringify({
        username: decodeURIComponent(username),
        email: decodeURIComponent(email),
        id: Number(decodeURIComponent(id)),
        display_name: decodeURIComponent(display_name),
        avatar_url: "",
        is_remote_user: true
    }));
    
    const authService = AuthService.getInstance();
    authService.updateCurrentUserFromlocalStorage();
    
    document.cookie = 'auth_token=; Path=/; Expires=Thu, 01 Jan 1970 00:00:01 GMT; SameSite=None; Secure';
    document.cookie = 'username=; Path=/; Expires=Thu, 01 Jan 1970 00:00:01 GMT; SameSite=None; Secure';
    document.cookie = 'email=; Path=/; Expires=Thu, 01 Jan 1970 00:00:01 GMT; SameSite=None; Secure';
    document.cookie = 'user_id=; Path=/; Expires=Thu, 01 Jan 1970 00:00:01 GMT; SameSite=None; Secure';
    document.cookie = 'display_name=; Path=/; Expires=Thu, 01 Jan 1970 00:00:01 GMT; SameSite=None; Secure';
}