type TLoader = Record<string, boolean>;

const useLoaderStore = defineStore("loaderStore", () => {
    const loaderDetails = ref<TLoader>({});
    const isLoaderActive = computed(() => {
        if (disableLoader.value) return false;
        let result = false;
        for (const row of Object.values(loaderDetails.value)) {
            if (row) {
                result = true;
                break;
            }
        }
        return result;
    });
    const disableLoader = ref<boolean>(false);

    function show(loaderId: string) {
        loaderDetails.value[loaderId] = true;
    }
    function hide(loaderId: string) {
        loaderDetails.value[loaderId] = false;
    }
    function clearStore() {
        loaderDetails.value = {};
    }

    return {
        isLoaderActive,
        disableLoader,
        show,
        hide,
        clearStore,
    };
});

export default useLoaderStore;
