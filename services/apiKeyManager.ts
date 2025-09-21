const API_KEY_STORAGE_KEY = 'rix-gemini-api-key';

export const saveApiKey = (key: string): void => {
    try {
        localStorage.setItem(API_KEY_STORAGE_KEY, key);
    } catch (error) {
        console.error("Could not save API key to local storage", error);
    }
};


export const getApiKey = (): string | null => {
    try {
        return localStorage.getItem(API_KEY_STORAGE_KEY);
    } catch (error) {
        console.error("Could not read API key from local storage", error);
        return null;
    }
};

export const clearApiKey = (): void => {
     try {
        localStorage.removeItem(API_KEY_STORAGE_KEY);
    } catch (error) {
        console.error("Could not remove API key from local storage", error);
    }
}
