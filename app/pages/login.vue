<script setup lang="ts">
const runtimeConfig = useRuntimeConfig();
const authEnabled = computed(() => runtimeConfig.public.authEnabled);
const password = ref('');
const isSubmitting = ref(false);
const isCheckingSession = ref(false);
const errorMessage = ref<string | null>(null);

const { loggedIn, ready, fetch } = useUserSession();

async function ensureUserSessionReady() {
    if (!authEnabled.value || ready.value || isCheckingSession.value) {
        return;
    }

    isCheckingSession.value = true;

    try {
        await fetch();
    } finally {
        isCheckingSession.value = false;
    }
}

watch(
    [authEnabled, ready, loggedIn],
    async ([isAuthEnabled, isReady, isLoggedIn]) => {
        if (!isAuthEnabled) {
            await navigateTo('/');
            return;
        }

        if (!isReady) {
            await ensureUserSessionReady();
            return;
        }

        if (isLoggedIn) {
            await navigateTo('/');
        }
    },
    { immediate: true }
);

async function submitLogin() {
    if (isSubmitting.value || !authEnabled.value) {
        return;
    }

    isSubmitting.value = true;
    errorMessage.value = null;

    try {
        const payload = await $fetch<ApiResponse<{ authenticated: boolean }>>('/api/login', {
            method: 'POST',
            body: {
                password: password.value,
            },
        });

        if (!payload.success || !payload.data?.authenticated) {
            throw new Error(
                typeof payload.error === 'string' ? payload.error : 'Login failed.'
            );
        }

        await fetch();

        if (!loggedIn.value) {
            throw new Error('Login succeeded, but the session was not established.');
        }

        await navigateTo('/');
    } catch (error: any) {
        errorMessage.value = error?.data?.error || error?.message || 'Login failed.';
    } finally {
        isSubmitting.value = false;
    }
}
</script>

<template>
    <UContainer class="py-8">
        <div class="max-w-md mx-auto">
            <card-subtle>
                <template #header>
                    <div class="p-2 text-lg">Admin Login</div>
                </template>
                <form class="p-4" @submit.prevent="submitLogin">
                    <UFormField label="Password" help="Enter the admin password to continue.">
                        <UInput v-model="password" type="password" autocomplete="current-password"
                            :disabled="isSubmitting || isCheckingSession" />
                    </UFormField>

                    <p v-if="errorMessage" class="mt-4 text-sm text-error">
                        {{ errorMessage }}
                    </p>

                    <div class="mt-4 text-right">
                        <UButton type="submit" color="primary" :loading="isSubmitting"
                            :disabled="isSubmitting || isCheckingSession || !password">
                            Login
                        </UButton>
                    </div>
                </form>
            </card-subtle>
        </div>
    </UContainer>
</template>