let currentTheme = $state('dark');

// Safe init on client import
if (typeof window !== 'undefined') {
    currentTheme = localStorage.getItem('theme') || 'dark';
    document.documentElement.setAttribute('data-theme', currentTheme);
}

export const themeState = {
    get theme() {
        return currentTheme;
    },
    toggle() {
        currentTheme = currentTheme === 'dark' ? 'light' : 'dark';
        if (typeof window !== 'undefined') {
            localStorage.setItem('theme', currentTheme);
            document.documentElement.setAttribute('data-theme', currentTheme);
        }
    },
    init() {
        if (typeof window !== 'undefined') {
            currentTheme = localStorage.getItem('theme') || 'dark';
            document.documentElement.setAttribute('data-theme', currentTheme);
        }
    }
};
