export function useApiErrorHelpers() {
    const BAN_PERMISSION_REQUIRED_METHODS = ['listbanned', 'setban', 'clearbanned'];
    const BAN_PERMISSION_GUIDANCE =
        'Ban actions are not permitted on this node. Enable the required RPC whitelist methods if you want to use ban features.';
    const BAN_PERMISSION_FULL_MESSAGE = `${BAN_PERMISSION_GUIDANCE} Required methods: ${BAN_PERMISSION_REQUIRED_METHODS.join(', ')}.`;

    function getApiErrorMessage(error: unknown, fallback = 'An unexpected error occurred.') {
        const candidate = error as {
            data?: { error?: string };
            response?: { _data?: { error?: string } };
            message?: string;
            statusMessage?: string;
        };

        return (
            candidate?.data?.error ||
            candidate?.response?._data?.error ||
            candidate?.message ||
            candidate?.statusMessage ||
            fallback
        );
    }

    function isBanPermissionDeniedMessage(message: string) {
        const normalizedMessage = message.toLowerCase();
        return (
            normalizedMessage.includes('forbidden') ||
            normalizedMessage.includes('permission') ||
            normalizedMessage.includes('not allowed') ||
            normalizedMessage.includes('rpc method not found') ||
            normalizedMessage.includes('method not found')
        );
    }

    function isBanPermissionDeniedError(error: unknown) {
        const candidate = error as {
            status?: number;
            statusCode?: number;
            response?: { status?: number };
            data?: { error?: string };
            message?: string;
            statusMessage?: string;
        };

        const status =
            candidate?.status || candidate?.statusCode || candidate?.response?.status;
        if (status === 403) {
            return true;
        }

        const message = getApiErrorMessage(error, '').toLowerCase();
        return isBanPermissionDeniedMessage(message);
    }

    return {
        BAN_PERMISSION_REQUIRED_METHODS,
        BAN_PERMISSION_GUIDANCE,
        BAN_PERMISSION_FULL_MESSAGE,
        getApiErrorMessage,
        isBanPermissionDeniedError,
        isBanPermissionDeniedMessage,
    };
}