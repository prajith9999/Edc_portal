export default defineNuxtRouteMiddleware((to) => {
    // if ((to.path === "/login/" || to.path === "/") && checkIfUserIsAuthorized()) {
        if ((to.path === "/login/" || to.path === "/") ) {
        return navigateTo(
            getRouteNavigationData({
                path: PortalPath.Dashboard,
            }),
        );
    } else if (to.path === "/") {
        return navigateTo(
            getRouteNavigationData({
                path: PortalPath.Login,
            }),
        );
    } else if (to.path === "/admin/" || to.path === "/admin") {
        return navigateTo(
            getRouteNavigationData({
                path: AdminPath.Login,
            }),
        );
    }
});
