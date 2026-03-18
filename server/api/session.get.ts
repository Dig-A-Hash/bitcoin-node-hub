export default defineEventHandler(async (event): Promise<ApiResponse<{ authEnabled: boolean; authenticated: boolean }>> => {
    try {
        const runtimeConfig = useRuntimeConfig(event);
        if (!runtimeConfig.public.authEnabled) {
            return {
                success: true,
                data: {
                    authEnabled: false,
                    authenticated: false,
                },
            };
        }

        const session = await getUserSession(event);
        return {
            success: true,
            data: {
                authEnabled: true,
                authenticated: Boolean(session.user),
            },
        };
    } catch (error: any) {
        return sendErrorResponse(event, error);
    }
});