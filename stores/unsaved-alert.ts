import type { IActiveTab, ITabMenu } from "~/services/apis/data/admin/win-forms";
import type { TUnsavedFormAction } from "~/types/common";

const useUnsavedAlertStore = defineStore("unsavedAlertStore", () => {
    const tabMenuRef = ref<ITabMenu | null>(null);
    const tabRowRef = ref<IActiveTab | null>(null);
    const tabDataRef = ref<Record<string, any> | null>(null);
    const tabQueryDataRef = ref<Record<string, any> | undefined>(undefined);
    const activeTabRef = ref<IActiveTab | null>(null);
    const isUnsavedChanges = ref<boolean>(false);
    const triggerWinformAlert = ref<boolean>(false);
    const triggerFormActionAlert = ref<TUnsavedFormAction>("none");
    const tabAction = ref<"" | "new menu" | "close menu" | "change menu" | "go back">("");

    function clearStore() {
        isUnsavedChanges.value = false;
        triggerWinformAlert.value = false;
        triggerFormActionAlert.value = "none";
        tabMenuRef.value = null;
        tabRowRef.value = null;
        tabDataRef.value = null;
        tabQueryDataRef.value = undefined;
        activeTabRef.value = null;
        tabAction.value = "";
    }

    return {
        isUnsavedChanges,
        triggerWinformAlert,
        triggerFormActionAlert,
        tabAction,
        tabMenuRef,
        tabRowRef,
        tabDataRef,
        tabQueryDataRef,
        activeTabRef,
        clearStore,
    };
});

export default useUnsavedAlertStore;
