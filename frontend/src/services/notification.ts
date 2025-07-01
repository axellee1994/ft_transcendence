export class NotificationService {
    private static instance: NotificationService;
    private container: HTMLDivElement | null = null;

    private constructor() {
        this.createContainer();
    }

    public static getInstance(): NotificationService {
        if (!NotificationService.instance) {
            NotificationService.instance = new NotificationService();
        }
        return NotificationService.instance;
    }

    private createContainer() {
        if (document.getElementById('global-notification-container')) {
            this.container = document.getElementById('global-notification-container') as HTMLDivElement;
            return;
        }

        this.container = document.createElement('div');
        this.container.id = 'global-notification-container';
        this.container.style.position = 'fixed';
        this.container.style.top = '20px';
        this.container.style.right = '20px';
        this.container.style.zIndex = '9999';
        this.container.style.maxWidth = '80%';
        document.body.appendChild(this.container);
    }

    public showError(message: string, duration: number = 5000): void {
        if (!this.container) {
            this.createContainer();
        }

        const notification = document.createElement('div');
        notification.style.backgroundColor = '#f56565';
        notification.style.color = 'white';
        notification.style.padding = '10px 15px';
        notification.style.borderRadius = '5px';
        notification.style.marginBottom = '10px';
        notification.style.boxShadow = '0 2px 4px rgba(0, 0, 0, 0.2)';
        notification.style.transition = 'opacity 0.3s, transform 0.3s';
        notification.style.opacity = '0';
        notification.style.transform = 'translateY(-20px)';
        notification.textContent = message;

        this.container!.appendChild(notification);

        setTimeout(() => {
            notification.style.opacity = '1';
            notification.style.transform = 'translateY(0)';
        }, 10);

        setTimeout(() => {
            notification.style.opacity = '0';
            notification.style.transform = 'translateY(-20px)';
            
            setTimeout(() => {
                if (notification.parentNode) {
                    notification.parentNode.removeChild(notification);
                }
            }, 300);
        }, duration);
    }
} 