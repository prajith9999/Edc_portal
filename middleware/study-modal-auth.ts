export default defineNuxtRouteMiddleware((to, from) => {
    if (import.meta.server) return;
    isTriggerStudyModal(to, from);
});
