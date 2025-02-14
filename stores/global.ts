import type { IAppVersion, TNullableString } from "~/types/common";

const defaultHeaderTitle = "Dashboard";

const useGlobalStore = defineStore("globalStore", () => {
    const edcService = ref<TNullableString>("EDC");
    const headerTitle = ref<string>(defaultHeaderTitle);
    const sideMenuExpanded = ref<boolean>(false);
    const dropdownOptionVisible = ref<boolean>(false);
    const showTableProcessingMessage = ref<Record<string, boolean>>({});
    const checkRefreshTokenCondition = ref<boolean>(false);
    const appVersion = ref<IAppVersion>({ admin: "", portal: "" });

    function setService(service: TNullableString) {
        edcService.value = service;
    }
    function setHeaderTitle(title: string) {
        headerTitle.value = title;
    }
    function clearHeaderTitle() {
        headerTitle.value = defaultHeaderTitle;
    }
    function toggleProcessingMessage(value: boolean, key: string) {
        showTableProcessingMessage.value[key] = value;
    }
    function triggerSearchBarRefocus(elementId: string) {
        const inputElement = getDOMElement(elementId);
        if (inputElement) inputElement.focus();
    }
    function clearStore() {
        edcService.value = "EDC";
        headerTitle.value = defaultHeaderTitle;
        sideMenuExpanded.value = false;
        dropdownOptionVisible.value = false;
        showTableProcessingMessage.value = {};
        checkRefreshTokenCondition.value = false;
        appVersion.value = {
            admin: "",
            portal: "",
        };
    }

    return {
        edcService,
        dropdownOptionVisible,
        headerTitle,
        sideMenuExpanded,
        showTableProcessingMessage,
        checkRefreshTokenCondition,
        appVersion,
        setService,
        setHeaderTitle,
        toggleProcessingMessage,
        clearHeaderTitle,
        triggerSearchBarRefocus,
        clearStore,
    };
});

export default useGlobalStore;
