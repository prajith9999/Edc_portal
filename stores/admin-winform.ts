import type { IActiveTab } from "~/services/apis/data/admin/win-forms";

interface IGoBackDetail {
    parentTab: IActiveTab;
}

interface IGoBackPostHook {
    type: string;
    trigger: boolean;
    isActionPerformed: boolean;
}

const defaultTriggerGoBackPostHook = (): IGoBackPostHook => ({
    type: "",
    trigger: false,
    isActionPerformed: false,
});

const useAdminWinFormStore = defineStore("adminWinFormStore", () => {
    const goBackWinFormDetails = ref<Record<string, IGoBackDetail>>({});
    const triggerGoBack = ref<boolean>(false);
    const triggerGoBackPostHook = ref<IGoBackPostHook>({ ...defaultTriggerGoBackPostHook() });

    function clearGoBackPostHook() {
        triggerGoBackPostHook.value.trigger = false;
        triggerGoBackPostHook.value.isActionPerformed = false;
        triggerGoBackPostHook.value.type = "";
    }

    function clearStore() {
        goBackWinFormDetails.value = {};
        triggerGoBack.value = false;
        triggerGoBackPostHook.value = { ...defaultTriggerGoBackPostHook() };
    }

    return {
        goBackWinFormDetails,
        triggerGoBack,
        triggerGoBackPostHook,
        clearGoBackPostHook,
        clearStore,
    };
});

export default useAdminWinFormStore;
