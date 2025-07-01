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

        this.container.innerHTML = `
            <div class="min-h-screen bg-gray-50">
                <div id="navigation-container"></div>
                <div id="content" class="container mx-auto px-4 py-8"></div>
            </div>
        `;

        const navigationContainer = this.container.querySelector('#navigation-container') as HTMLElement;
        if (!navigationContainer) {
            throw new Error('Navigation container not found');
        }
        this.navigation = new Navigation(navigationContainer);

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