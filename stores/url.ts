type TURLData = IRouteObject | null;

const useUrlStore = defineStore("urlStore", () => {
    const urlWhenUnauthorized = ref<TURLData>(null);
    const portalLinkDetails = ref<TURLData>(null);

    function setRouteDetailsWhenUnauthorized(routeParam: IRouteObject) {
        urlWhenUnauthorized.value = { ...routeParam };
    }
    function setPortalLinkDetails(routeParam: IRouteObject) {
        portalLinkDetails.value = { ...routeParam };
    }
    function clearStore() {
        urlWhenUnauthorized.value = null;
        portalLinkDetails.value = null;
    }

    return {
        urlWhenUnauthorized,
        portalLinkDetails,
        setRouteDetailsWhenUnauthorized,
        setPortalLinkDetails,
        clearStore,
    };
});

export default useUrlStore;
