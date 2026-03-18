export default defineNuxtRouteMiddleware(async (to) => {
    const runtimeConfig = useRuntimeConfig();
    if (!runtimeConfig.public.authEnabled) {
        return;
    }

    if (to.path === '/login') {
        return;
    }

    const { loggedIn, ready, fetch } = useUserSession();

    if (!ready.value) {
        await fetch();
    }

    if (!loggedIn.value) {
        return navigateTo('/login');
    }
});