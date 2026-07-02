let currentTheme = $state(
    typeof window !== 'undefined' ? (localStorage.getItem('theme') || 'dark') : 'dark'
);

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
            document.documentElement.setAttribute('data-theme', currentTheme);
        }
    }
};

