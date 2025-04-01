interface AuthModalProps {
    container: HTMLElement;
}

export class AuthModal {
    private container: HTMLElement;
    private isLoginMode: boolean = true;
    public onLogin?: (username: string, password: string) => Promise<void>;
    public onRegister?: (username: string, password: string, email: string) => Promise<void>;

    constructor(props: AuthModalProps) {
        this.container = props.container;
        this.initialize();
    }

    private initialize(): void {
        this.container.innerHTML = `
            <div class="auth-modal fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                <div class="bg-white rounded-lg p-8 max-w-md w-full mx-4 shadow-xl">
                    <div class="flex justify-between items-center mb-6">
                        <h2 class="text-2xl font-bold text-gray-900 modal-title">Login</h2>
                        <button class="auth-modal-close text-gray-400 hover:text-gray-500 text-2xl">&times;</button>
                    </div>
                    <div class="error-message hidden bg-red-100 border-l-4 border-red-500 text-red-700 p-4 mb-5 rounded-lg shadow-sm">
                        <div class="flex items-center">
                            <svg class="h-5 w-5 mr-2 text-red-500" fill="currentColor" viewBox="0 0 20 20">
                                <path fill-rule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clip-rule="evenodd"></path>
                            </svg>
                            <span class="error-text font-medium"></span>
                        </div>
                    </div>
                    
                    <!-- Login Form -->
                    <form class="login-form space-y-4" novalidate>
                        <div class="form-group">
                            <label for="login-username" class="block text-sm font-medium text-gray-700 mb-1">Username</label>
                            <input type="text" id="login-username" required minlength="3"
                                class="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                                placeholder="Enter your username">
                        </div>
                        <div class="form-group">
                            <label for="login-password" class="block text-sm font-medium text-gray-700 mb-1">Password</label>
                            <input type="password" id="login-password" required minlength="6"
                                class="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                                placeholder="Enter your password">
                        </div>
                        <!-- Login error message container below password field -->
                        <div class="login-error-container hidden">
                            <p class="text-xs text-red-500 font-medium"></p>
                        </div>
                        <div class="flex justify-end space-x-3">
                            <button type="button" class="switch-to-register px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-md transition-colors">
                                Register
                            </button>
                            <button type="submit" class="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-md transition-colors">
                                Login
                            </button>
                        </div>
                    </form>

                    <!-- Register Form -->
                    <form class="register-form hidden space-y-4" novalidate>
                        <div class="form-group">
                            <label for="register-username" class="block text-sm font-medium text-gray-700 mb-1">Username</label>
                            <input type="text" id="register-username" required minlength="3"
                                class="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                                placeholder="Choose a username">
                            <p class="text-xs text-gray-500 mt-1">Minimum 3 characters</p>
                        </div>
                        <div class="form-group">
                            <label for="register-password" class="block text-sm font-medium text-gray-700 mb-1">Password</label>
                            <input type="password" id="register-password" required minlength="6"
                                class="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                                placeholder="Create a password">
                            <p class="text-xs text-gray-500 mt-1">Minimum 6 characters</p>
                        </div>
                        <div class="form-group">
                            <label for="register-email" class="block text-sm font-medium text-gray-700 mb-1">Email</label>
                            <input type="email" id="register-email" required
                                class="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                                placeholder="Enter your email">
                        </div>
                        <div class="flex justify-end space-x-3">
                            <button type="button" class="switch-to-login px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-md transition-colors">
                                Back to Login
                            </button>
                            <button type="submit" class="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-md transition-colors">
                                Register
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        `;

        this.addEventListeners();
        this.show();
    }

    private addEventListeners(): void {
        const modal = this.container.querySelector('.auth-modal');
        const loginForm = this.container.querySelector('.login-form');
        const registerForm = this.container.querySelector('.register-form');
        const switchToRegisterButton = this.container.querySelector('.switch-to-register');
        const switchToLoginButton = this.container.querySelector('.switch-to-login');
        const modalTitle = this.container.querySelector('.modal-title');

        if (switchToRegisterButton && switchToLoginButton && loginForm && registerForm && modalTitle) {
            switchToRegisterButton.addEventListener('click', () => {
                this.isLoginMode = false;
                loginForm.classList.add('hidden');
                registerForm.classList.remove('hidden');
                modalTitle.textContent = 'Register';
            });

            switchToLoginButton.addEventListener('click', () => {
                this.isLoginMode = true;
                registerForm.classList.add('hidden');
                loginForm.classList.remove('hidden');
                modalTitle.textContent = 'Login';
            });
        }

        if (loginForm) {
            // Add input validation on blur/focus events for instant feedback
            const usernameInput = this.container.querySelector('#login-username') as HTMLInputElement;
            const passwordInput = this.container.querySelector('#login-password') as HTMLInputElement;
            
            // Validate username on blur
            usernameInput.addEventListener('blur', () => {
                this.validateLoginField(usernameInput, 'Username');
            });
            
            // Clear error on focus
            usernameInput.addEventListener('focus', () => {
                this.clearFieldError(usernameInput);
            });
            
            // Validate password on blur
            passwordInput.addEventListener('blur', () => {
                this.validateLoginField(passwordInput, 'Password');
            });
            
            // Clear error on focus
            passwordInput.addEventListener('focus', () => {
                this.clearFieldError(passwordInput);
            });
            
            loginForm.addEventListener('submit', async (e) => {
                e.preventDefault();
                const submitButton = loginForm.querySelector('button[type="submit"]') as HTMLButtonElement;
                
                // Clear previous error
                this.clearError();
                
                // Track if we have validation errors
                let hasErrors = false;
                
                // Validate username
                if (!this.validateLoginField(usernameInput, 'Username')) {
                    hasErrors = true;
                }
                
                // Validate password - perform this validation regardless of username status
                if (!this.validateLoginField(passwordInput, 'Password')) {
                    hasErrors = true;
                }
                
                // Stop if we have errors
                if (hasErrors) {
                    return;
                }
                
                // Remove any field error styling
                this.clearFieldErrors();
                
                submitButton.disabled = true;
                submitButton.textContent = 'Logging in...';

                try {
                    const username = usernameInput.value;
                    const password = passwordInput.value;

                    if (this.onLogin) {
                        await this.onLogin(username, password);
                    }
                } catch (error) {
                    this.showError(error instanceof Error ? error.message : 'Login failed');
                    submitButton.disabled = false;
                    submitButton.textContent = 'Login';
                }
            });
        }

        if (registerForm) {
            // Add input validation on blur/focus events for instant feedback
            const usernameInput = this.container.querySelector('#register-username') as HTMLInputElement;
            const passwordInput = this.container.querySelector('#register-password') as HTMLInputElement;
            const emailInput = this.container.querySelector('#register-email') as HTMLInputElement;
            
            // Validate username on blur
            usernameInput.addEventListener('blur', () => {
                this.validateRegisterField(usernameInput, 'Username');
            });
            
            // Clear error on focus
            usernameInput.addEventListener('focus', () => {
                this.clearFieldError(usernameInput);
            });
            
            // Validate password on blur
            passwordInput.addEventListener('blur', () => {
                this.validateRegisterField(passwordInput, 'Password');
            });
            
            // Clear error on focus
            passwordInput.addEventListener('focus', () => {
                this.clearFieldError(passwordInput);
            });
            
            // Validate email on blur
            emailInput.addEventListener('blur', () => {
                this.validateEmailField(emailInput);
            });
            
            // Clear error on focus
            emailInput.addEventListener('focus', () => {
                this.clearFieldError(emailInput);
            });
            
            registerForm.addEventListener('submit', async (e) => {
                e.preventDefault();
                const submitButton = registerForm.querySelector('button[type="submit"]') as HTMLButtonElement;
                
                // Clear previous error
                this.clearError();
                
                // Track if we have validation errors
                let hasErrors = false;
                
                // Validate all fields independently
                if (!this.validateRegisterField(usernameInput, 'Username')) {
                    hasErrors = true;
                }
                
                if (!this.validateRegisterField(passwordInput, 'Password')) {
                    hasErrors = true;
                }
                
                if (!this.validateEmailField(emailInput)) {
                    hasErrors = true;
                }
                
                // Stop if we have errors
                if (hasErrors) {
                    return;
                }
                
                // Remove any field error styling
                this.clearFieldErrors();
                
                submitButton.disabled = true;
                submitButton.textContent = 'Registering...';

                try {
                    const username = usernameInput.value;
                    const password = passwordInput.value;
                    const email = emailInput.value;

                    if (this.onRegister) {
                        await this.onRegister(username, password, email);
                    }
                } catch (error) {
                    this.showError(error instanceof Error ? error.message : 'Registration failed');
                    submitButton.disabled = false;
                    submitButton.textContent = 'Register';
                }
            });
        }
    }

    public show(): void {
        const modal = this.container.querySelector('.auth-modal');
        if (modal) {
            modal.classList.remove('hidden');
        }
    }

    public hide(): void {
        const modal = this.container.querySelector('.auth-modal');
        if (modal) {
            modal.classList.add('hidden');
        }
    }

    public showError(message: string): void {
        // Reduce logging - just a single message
        
        // Determine which form is active
        const isLoginFormActive = !this.container.querySelector('.login-form')?.classList.contains('hidden');
        
        if (isLoginFormActive) {
            // Show error in the login form's error container
            const loginErrorContainer = this.container.querySelector('.login-error-container');
            const errorParagraph = loginErrorContainer?.querySelector('p');
            
            if (loginErrorContainer && errorParagraph) {
                loginErrorContainer.classList.remove('hidden');
                errorParagraph.textContent = message;
            } else {
                // Fallback to alert if error container not found
                console.error('Login error container not found in the DOM');
                alert('Login Error: ' + message);
            }
        } else {
            // Use the old method for register form for now
            const errorElement = this.container.querySelector('.error-message');
            const errorText = this.container.querySelector('.error-text');
            
            if (!errorElement || !errorText) {
                console.error('Error elements not found in the DOM');
                alert('Registration Error: ' + message);
                return;
            }
            
            // Make sure error is visible
            errorText.textContent = message;
            errorElement.classList.remove('hidden');
        }
        
        // Automatically hide the error after 10 seconds
        setTimeout(() => {
            if (isLoginFormActive) {
                const loginErrorContainer = this.container.querySelector('.login-error-container');
                loginErrorContainer?.classList.add('hidden');
            } else {
                const errorElement = this.container.querySelector('.error-message');
                errorElement?.classList.add('hidden');
            }
        }, 10000);
    }

    private isValidEmail(email: string): boolean {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email);
    }

    private clearError(): void {
        // Clear the top banner error message
        const errorElement = this.container.querySelector('.error-message');
        if (errorElement) {
            errorElement.classList.add('hidden');
        }
        
        // Clear the login form error message
        const loginErrorContainer = this.container.querySelector('.login-error-container');
        if (loginErrorContainer) {
            loginErrorContainer.classList.add('hidden');
        }
    }
    
    private addFieldError(input: HTMLInputElement, message: string): void {
        // Add red border
        input.classList.add('border-red-500');
        
        // Check if error message element already exists
        let errorMsg = input.parentElement?.querySelector('.field-error-message');
        if (!errorMsg) {
            // Create new error message element
            errorMsg = document.createElement('p');
            errorMsg.className = 'field-error-message text-xs text-red-500 mt-1';
            input.parentElement?.appendChild(errorMsg);
        }
        
        // Set error message
        errorMsg.textContent = message;
    }
    
    private clearFieldErrors(): void {
        // Remove all field error styling
        const inputs = this.container.querySelectorAll('input');
        inputs.forEach(input => {
            input.classList.remove('border-red-500');
            const errorMsg = input.parentElement?.querySelector('.field-error-message');
            if (errorMsg) {
                errorMsg.remove();
            }
        });
    }

    private validateLoginField(input: HTMLInputElement, fieldName: string): boolean {
        // Empty check
        if (!input.value.trim()) {
            this.addFieldError(input, `${fieldName} is required`);
            return false;
        }
        
        // Length check
        const minLength = input.minLength;
        if (minLength && input.value.trim().length < minLength) {
            this.addFieldError(input, `${fieldName} must be at least ${minLength} characters`);
            return false;
        }
        
        return true;
    }
    
    private clearFieldError(input: HTMLInputElement): void {
        input.classList.remove('border-red-500');
        const errorMsg = input.parentElement?.querySelector('.field-error-message');
        if (errorMsg) {
            errorMsg.remove();
        }
    }

    private validateRegisterField(input: HTMLInputElement, fieldName: string): boolean {
        // Empty check
        if (!input.value.trim()) {
            this.addFieldError(input, `${fieldName} is required`);
            return false;
        }
        
        // Length check
        const minLength = input.minLength;
        if (minLength && input.value.trim().length < minLength) {
            this.addFieldError(input, `${fieldName} must be at least ${minLength} characters`);
            return false;
        }
        
        return true;
    }
    
    private validateEmailField(input: HTMLInputElement): boolean {
        // Empty check
        if (!input.value.trim()) {
            this.addFieldError(input, 'Email is required');
            return false;
        }
        
        // Format check
        if (!this.isValidEmail(input.value.trim())) {
            this.addFieldError(input, 'Invalid email format');
            return false;
        }
        
        return true;
    }
} 