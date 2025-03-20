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
                <div id="navigation"></div>
                <div id="content"></div>
            </div>
        `;

        // Initialize navigation in its dedicated container
        const navigationContainer = this.container.querySelector('#navigation') as HTMLElement;
        this.navigation = new Navigation(navigationContainer);

        // Store content container reference
        this.contentContainer = this.container.querySelector('#content') as HTMLElement;
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