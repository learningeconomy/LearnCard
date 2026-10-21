// A screenshot fixture must not end an account session or invoke auth services.
const useLogout = () => ({
    isLoggingOut: false,
    handleLogout: async (): Promise<never> => {
        throw new Error('Signing out is disabled in the visual fixture.');
    },
});

export default useLogout;
