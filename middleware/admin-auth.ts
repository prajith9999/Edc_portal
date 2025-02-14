export default defineNuxtRouteMiddleware((to: any) => {
    if (import.meta.server) return;
    // if (checkIfAuthorizedAdminRoutes(to.fullPath) && !checkIfUserIsAuthorized()) {
    //     triggerUnauthorizedToastMessage();
    //     return navigateTo(
    //         getRouteNavigationData({
    //             path: AdminPath.Login,
    //         }),
    //     );
    // }
    return navigateTo(
        getRouteNavigationData({
            path: to.fullPath,
        }))
});
