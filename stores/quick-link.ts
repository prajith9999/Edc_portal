import {
    quickLinksListAPI,
    saveAsQuickLinkAPI,
    type IQuickLinkSaveBody,
} from "~/services/apis/handlers/portal/dashboard";
import type { IQuickLinkData } from "~/services/apis/handlers/types/dashboard-types";

const useQuickLinkStore = defineStore("quickLinkStore", () => {
    const linksList = ref<IQuickLinkData[]>([]);
    const loading = ref<boolean>(false);

    async function fetchLinksList(trialId: number, environmentId: number) {
        if (trialId && environmentId) {
            loading.value = true;
            const { status, data } = await quickLinksListAPI({
                trialId,
                environmentId,
            });
            if (status === 200) {
                linksList.value = deepClone(data);
            } else {
                linksList.value = [];
            }
            loading.value = false;
        }
    }

    function checkIfPageExists(page: string) {
        let result = false;
        for (const row of linksList.value) {
            if (row.page === page) {
                result = true;
                break;
            }
        }
        return result;
    }

    async function triggerSaveAsQuickLinkAPI(
        params: IQuickLinkSaveBody,
        enableDuplicateCheck: boolean = true,
    ) {
        if (!checkIfPageExists(params.page) || !enableDuplicateCheck)
            await saveAsQuickLinkAPI({
                id: params.id,
                trialId: params.trialId,
                environmentId: params.environmentId,
                page: params.page,
                pageDetails: params.pageDetails,
                studyId: params.studyId,
            });
    }
    function clearStore() {
        linksList.value = [];
        loading.value = false;
    }

    return {
        linksList,
        loading,
        fetchLinksList,
        triggerSaveAsQuickLinkAPI,
        clearStore,
    };
});

export default useQuickLinkStore;
