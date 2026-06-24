let toastsList = $state([]);

export const toastState = {
    get toasts() {
        return toastsList;
    },
    show(message, type = 'success', title = 'Notification') {
        const id = Date.now();
        toastsList = [...toastsList, { id, message, type, title }];
        setTimeout(() => {
            toastsList = toastsList.filter(t => t.id !== id);
        }, 4000);
    }
};
