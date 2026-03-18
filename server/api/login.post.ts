import { HttpStatusCode } from 'axios';
import { z } from 'zod';

const LOGIN_SCHEMA = z.object({
    password: z.string().min(1, 'Password is required.'),
});

export default defineEventHandler(async (event): Promise<ApiResponse<{ authenticated: boolean }>> => {
    try {
        const runtimeConfig = useRuntimeConfig(event);
        const adminPasswordHash = runtimeConfig.adminPasswordHash?.trim();

        if (!adminPasswordHash) {
            throw new StatusError(
                HttpStatusCode.Forbidden,
                'Login is disabled by configuration. Set ADMIN_PASSWORD_HASH to enable authentication. See README for setup details.'
            );
        }

        const { password } = LOGIN_SCHEMA.parse(await readBody(event));
        const isValidPassword = await verifyPassword(adminPasswordHash, password);

        if (!isValidPassword) {
            throw new StatusError(HttpStatusCode.Unauthorized, 'Invalid password.');
        }

        await setUserSession(event, {
            user: {
                role: 'admin',
            },
            loggedInAt: Date.now(),
        });

        return {
            success: true,
            data: {
                authenticated: true,
            },
        };
    } catch (error: any) {
        return sendErrorResponse(event, error);
    }
});