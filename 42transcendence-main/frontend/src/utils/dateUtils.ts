/**
 * Format a date string to the user's local timezone
 */
export function formatDateTime(dateString: string): string {
    // SQLite timestamps are in UTC format
    const date = new Date(dateString + 'Z');
    return date.toLocaleString(undefined, {
        year: 'numeric',
        month: 'numeric',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        hour12: false,
        timeZoneName: 'short'
    });
}

/**
 * Format a relative time (e.g., "2 hours ago", "Just now", etc.)
 */
export function formatRelativeTime(dateString: string): string {
    // SQLite timestamps are in UTC format
    const date = new Date(dateString + 'Z');
    const now = new Date();
    
    // Get the time difference in minutes
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    
    // Log for debugging
    console.log('Last seen date (UTC):', dateString);
    console.log('Parsed date:', date.toISOString());
    console.log('Current date:', now.toISOString());
    console.log('Difference in minutes:', diffMins);
    
    if (diffMins < 1) {
        return 'Just now';
    } else if (diffMins < 60) {
        return `${diffMins} minute${diffMins === 1 ? '' : 's'} ago`;
    } else if (diffMins < 1440) {
        const hours = Math.floor(diffMins / 60);
        return `${hours} hour${hours === 1 ? '' : 's'} ago`;
    } else if (diffMins < 10080) { // Less than 7 days
        const days = Math.floor(diffMins / 1440);
        return `${days} day${days === 1 ? '' : 's'} ago`;
    } else {
        return formatDateTime(dateString);
    }
} 