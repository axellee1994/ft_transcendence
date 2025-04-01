export function createNavbar(user: any): HTMLElement {
    const navbar = document.createElement('nav');
    navbar.className = 'navbar';

    const logo = document.createElement('div');
    logo.className = 'logo';
    logo.textContent = 'Pong Game';
    navbar.appendChild(logo);

    const menu = document.createElement('ul');
    menu.className = 'menu';
    
    // Home link
    const homeItem = document.createElement('li');
    const homeLink = document.createElement('a');
    homeLink.href = '#';
    homeLink.textContent = 'Home';
    homeLink.addEventListener('click', (e) => {
        e.preventDefault();
        window.history.pushState({}, '', '/');
        const event = new CustomEvent('urlchange', { detail: { url: '/' } });
        window.dispatchEvent(event);
    });
    homeItem.appendChild(homeLink);
    menu.appendChild(homeItem);

    // Stats link
    const statsItem = document.createElement('li');
    const statsLink = document.createElement('a');
    statsLink.href = '#';
    statsLink.textContent = 'Stats';
    statsLink.addEventListener('click', (e) => {
        e.preventDefault();
        window.history.pushState({}, '', '/stats');
        const event = new CustomEvent('urlchange', { detail: { url: '/stats' } });
        window.dispatchEvent(event);
    });
    statsItem.appendChild(statsLink);
    menu.appendChild(statsItem);

    // Tournament link
    const tournamentItem = document.createElement('li');
    const tournamentLink = document.createElement('a');
    tournamentLink.href = '#';
    tournamentLink.textContent = 'Tournaments';
    tournamentLink.addEventListener('click', (e) => {
        e.preventDefault();
        window.history.pushState({}, '', '/tournaments');
        const event = new CustomEvent('urlchange', { detail: { url: '/tournaments' } });
        window.dispatchEvent(event);
    });
    tournamentItem.appendChild(tournamentLink);
    menu.appendChild(tournamentItem);

    // Profile link
    const profileItem = document.createElement('li');
    const profileLink = document.createElement('a');
    profileLink.href = '#';
    profileLink.textContent = 'Profile';
    profileLink.addEventListener('click', (e) => {
        e.preventDefault();
        window.history.pushState({}, '', '/profile');
        const event = new CustomEvent('urlchange', { detail: { url: '/profile' } });
        window.dispatchEvent(event);
    });
    profileItem.appendChild(profileLink);
    menu.appendChild(profileItem);

    // Friends link
    const friendsItem = document.createElement('li');
    const friendsLink = document.createElement('a');
    friendsLink.href = '#';
    friendsLink.textContent = 'Friends';
    friendsLink.addEventListener('click', (e) => {
        e.preventDefault();
        window.history.pushState({}, '', '/friends');
        const event = new CustomEvent('urlchange', { detail: { url: '/friends' } });
        window.dispatchEvent(event);
    });
    friendsItem.appendChild(friendsLink);
    menu.appendChild(friendsItem);

    navbar.appendChild(menu);
    return navbar;
} 