import type { IAppVersion } from "~/types/common";

const useCodeUpdateStore = defineStore("codeUpdateStore", () => {
    const showModal = ref<boolean>(false);

    function show() {
        showModal.value = true;
    }

    function hide() {
        showModal.value = false;
    }

    function getAppVersionFromLocalStorage() {
        const appVersion = getFromLocalStorage(TLocalStorageKeys.appVersion);
        return appVersion ? (JSON.parse(appVersion) as IAppVersion) : null;
    }

    function clearStore() {
        showModal.value = false;
    }

    return { showModal, show, getAppVersionFromLocalStorage, hide, clearStore };
});

export default useCodeUpdateStore;
