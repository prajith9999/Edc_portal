// import useGlobalStore from "~/stores/global";

export default defineNuxtRouteMiddleware((to) => {
    // return;
    if (import.meta.server) return;

    if (checkIfAuthorizedPortalRoutes(to.fullPath) && !checkIfUserIsAuthorized()) {
        triggerUnauthorizedToastMessage();
        storeCurrentURLIfUnauthorized({
            path: to.path as any,
            params: to.params,
            query: to.query,
        });
        return navigateTo(
            getRouteNavigationData({
                path: PortalPath.Login,
            }),
        );
    }
});
