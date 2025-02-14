import { trialEnvironmentDetailsAPI } from "~/services/apis/handlers/portal/study";
import type { ITrialEnvironmentDetailData } from "~/services/apis/handlers/types/study-types";
import type { IUserRolePermissionData } from "~/services/apis/handlers/types/user-types";
import type { IOptions, TNullableNumber } from "~/types/common";

interface IStudyDetail {
    environmentId: TNullableNumber;
    trialId: TNullableNumber;
    studyId: TNullableNumber;
    latestReleaseVersionId: TNullableNumber;
}

interface IStudyDetailError {
    environmentId: string;
    trialId: string;
}

interface ILoading {
    trialList: boolean;
    environmentList: boolean;
    pageDetails: boolean;
    processPageQueryOnPageLoad: boolean;
}

const useStudyStore = defineStore("studyStore", () => {
    const studyInformation = ref<IStudyDetail>({
        studyId: null,
        trialId: null,
        environmentId: null,
        latestReleaseVersionId: null,
    });
    const studyInformationRef = ref<IStudyDetail>({
        studyId: null,
        trialId: null,
        environmentId: null,
        latestReleaseVersionId: null,
    });
    const studyInformationError = ref<IStudyDetailError>({
        trialId: "",
        environmentId: "",
    });
    const loading = ref<ILoading>({
        environmentList: false,
        trialList: false,
        pageDetails: true,
        processPageQueryOnPageLoad: false,
    });
    const triggerModel = ref<boolean>(false);
    const triggerModelInDashboard = ref<boolean>(false);
    const trialEnvironmentDetails = ref<ITrialEnvironmentDetailData[]>([]);
    const studyRolePermissionDetails = ref<IUserRolePermissionData[]>([]);
    const trialsListData = ref<IOptions[]>([]);
    const environmentsListData = ref<IOptions[]>([]);
    const trialLookups = computed(() => getOptionsList(trialsListData.value, "label", "value"));
    const trialName = computed(() => {
        let result = "";
        for (const row of trialEnvironmentDetails.value) {
            if (row.trialId === studyInformation.value.trialId) {
                result = row.trialName;
                break;
            }
        }
        return result;
    });
    const environmentLookups = computed(() =>
        getOptionsList(environmentsListData.value, "label", "value"),
    );
    const environmentName = computed(() => {
        let result = "";
        for (const row of trialEnvironmentDetails.value) {
            if (row.trialId === studyInformation.value.trialId) {
                for (const subRow of row.environmentDetails) {
                    if (subRow.id === studyInformation.value.environmentId) {
                        result = subRow.environment;
                        break;
                    }
                }
            }
        }
        return result;
    });

    function validateStudySelect() {
        if (!studyInformation.value.trialId)
            studyInformationError.value.trialId = "Please select a trial";
        else studyInformationError.value.trialId = "";
        if (!studyInformation.value.environmentId)
            studyInformationError.value.environmentId = "Please select an environment";
        else studyInformationError.value.environmentId = "";

        return !!studyInformationError.value.trialId || !!studyInformationError.value.environmentId;
    }

    function storeInLocalStorage() {
        setToLocalStorage(TLocalStorageKeys.studyDetails, encodeData(studyInformation.value));
    }

    function hydrateDetails() {
        const localStoredStudyDetails = getFromLocalStorage(TLocalStorageKeys.studyDetails);
        if (localStoredStudyDetails) {
            const {
                environmentId = null,
                trialId = null,
                studyId = null,
                latestReleaseVersionId = null,
            } = decodeData(localStoredStudyDetails) as IStudyDetail;
            studyInformation.value.trialId = trialId; // FIXME: need to change this to number if requrired based on API response
            studyInformation.value.environmentId = environmentId; // FIXME: need to change this to number if requrired based on API response
            studyInformation.value.studyId = studyId; // FIXME: need to change this to number if requrired based on API response
            studyInformation.value.latestReleaseVersionId = latestReleaseVersionId; // FIXME: need to change this to number if requrired based on API response
            studyInformationRef.value.trialId = trialId; // FIXME: need to change this to number if requrired based on API response
            studyInformationRef.value.environmentId = environmentId; // FIXME: need to change this to number if requrired based on API response
            studyInformationRef.value.studyId = studyId; // FIXME: need to change this to number if requrired based on API response
            studyInformationRef.value.latestReleaseVersionId = latestReleaseVersionId; // FIXME: need to change this to number if requrired based on API response
        }
    }

    function isStudySelected(checkOnlyForLogic: boolean = false) {
        if (!checkOnlyForLogic) hydrateDetails();
        return !!studyInformation.value.trialId && !!studyInformation.value.environmentId;
    }

    function processTrialDetails() {
        const result: IOptions[] = [];
        for (const row of trialEnvironmentDetails.value) {
            result.push({
                label: row.trialName,
                value: row.trialId,
            });
        }
        trialsListData.value = deepClone(result);
        loading.value.trialList = false;
    }

    function processEnvironmentDetails() {
        loading.value.environmentList = true;
        const result: IOptions[] = [];
        for (const row of trialEnvironmentDetails.value) {
            if (row.trialId === studyInformation.value.trialId && row.environmentDetails) {
                for (const subRow of row.environmentDetails) {
                    result.push({
                        label: subRow.environment,
                        value: subRow.id,
                    });
                }
            }
        }
        environmentsListData.value = deepClone(result);
        loading.value.environmentList = false;
    }

    async function getTrialEnvironmentDetails() {
        // if (!loading.value.pageDetails) loading.value.pageDetails = true;
        loading.value.trialList = true;
        const { status, data } = await trialEnvironmentDetailsAPI();
        if (status === 200) {
            trialEnvironmentDetails.value = deepClone(data);
        } else {
            trialEnvironmentDetails.value = [];
        }
        processTrialDetails();
        if (studyInformation.value.environmentId) processEnvironmentDetails();
        // loading.value.pageDetails = false;
    }

    function getStudyPermissionDetails() {
        if (getArrayLength(studyRolePermissionDetails.value) === 0) {
            const studyPermissionDetailsInLocalStorage = getFromLocalStorage(
                TLocalStorageKeys.studyPermissions,
            );
            if (studyPermissionDetailsInLocalStorage) {
                const parsedStudyPermissionDetails = decodeData(
                    studyPermissionDetailsInLocalStorage,
                ) as IUserRolePermissionData[];
                studyRolePermissionDetails.value = deepClone(parsedStudyPermissionDetails);
            }
        }
    }

    function setStudyPermissionDetails(listData: IUserRolePermissionData[]) {
        studyRolePermissionDetails.value = deepClone(listData);
        setToLocalStorage(TLocalStorageKeys.studyPermissions, encodeData(listData));
    }

    function getRoleIdBySiteId(siteId?: number) {
        getStudyPermissionDetails();
        const result: number[] = [];
        for (const row of studyRolePermissionDetails.value) {
            if ((siteId && isEqual(row.siteId, siteId, "number")) || !siteId) {
                result.push(row.roleId);
            }
        }
        return [...result];
    }

    function clearStore() {
        studyInformation.value.studyId = null;
        studyInformation.value.trialId = null;
        studyInformation.value.environmentId = null;
        studyInformation.value.latestReleaseVersionId = null;
        studyInformationRef.value.studyId = null;
        studyInformationRef.value.trialId = null;
        studyInformationRef.value.environmentId = null;
        studyInformationRef.value.latestReleaseVersionId = null;
        studyInformationError.value.trialId = "";
        studyInformationError.value.environmentId = "";
        studyRolePermissionDetails.value = [];
        loading.value.trialList = false;
        loading.value.environmentList = false;
        loading.value.pageDetails = true;
        loading.value.processPageQueryOnPageLoad = false;
    }

    return {
        studyInformation,
        studyInformationRef,
        studyInformationError,
        loading,
        trialLookups,
        environmentLookups,
        trialName,
        environmentName,
        triggerModel,
        trialEnvironmentDetails,
        triggerModelInDashboard,
        studyRolePermissionDetails,
        validateStudySelect,
        storeInLocalStorage,
        hydrateDetails,
        isStudySelected,
        getTrialEnvironmentDetails,
        processTrialDetails,
        processEnvironmentDetails,
        getRoleIdBySiteId,
        setStudyPermissionDetails,
        clearStore,
    };
});

export default useStudyStore;
