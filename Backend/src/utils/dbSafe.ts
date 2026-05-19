export const dbSafeError = (error: unknown): string => {
    if (error instanceof Error) {
        return error.message.substring(0, 255);
    }
    return 'Unknown error occurred';
};