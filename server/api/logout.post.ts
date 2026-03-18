export default defineEventHandler(async (event): Promise<ApiResponse<{ loggedOut: boolean }>> => {
    try {
        const runtimeConfig = useRuntimeConfig(event);
        if (runtimeConfig.public.authEnabled) {
            await clearUserSession(event);
        }

        return {
            success: true,
            data: {
                loggedOut: true,
            },
        };
    } catch (error: any) {
        return sendErrorResponse(event, error);
    }
});