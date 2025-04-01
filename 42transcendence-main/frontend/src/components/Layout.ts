import { Navigation } from './Navigation';

export class Layout {
    private container: HTMLElement;
    private contentContainer: HTMLElement;
    private navigation: Navigation;

    constructor(container: HTMLElement) {
        this.container = container;
        this.initialize();
    }

    private initialize(): void {
        // Create the basic layout structure
        this.container.innerHTML = `
            <div class="min-h-screen bg-gray-50">
                <div id="navigation-container"></div>
                <div id="content" class="container mx-auto px-4 py-8"></div>
            </div>
        `;

        // Initialize navigation in its dedicated container
        const navigationContainer = this.container.querySelector('#navigation-container') as HTMLElement;
        if (!navigationContainer) {
            throw new Error('Navigation container not found');
        }
        this.navigation = new Navigation(navigationContainer);

        // Store content container reference
        this.contentContainer = this.container.querySelector('#content') as HTMLElement;
        if (!this.contentContainer) {
            throw new Error('Content container not found');
        }
    }

    public setContent(content: string): void {
        if (this.contentContainer) {
            this.contentContainer.innerHTML = content;
        }
    }

    public getContentContainer(): HTMLElement {
        return this.contentContainer;
    }
} 