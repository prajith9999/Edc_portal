import { IconKeys } from "#imports";
import type { IDCMenuLink } from "~/services/apis/data/clinical-trials";
import { formFieldStatusesListAPI } from "~/services/apis/handlers/portal/data-collection";
import type {
    IFormFieldStatus,
    ISubjectFormData,
    ISubjectTrialVisitData,
    ITrialVisitAndFormDetails,
} from "~/services/apis/handlers/types/data-collection-types";
import type { ISubjectDetail } from "~/services/apis/handlers/types/subject-types";
import type { TIconType, TNullableNumber, TObject, TUnsavedFormAction } from "~/types/common";

export interface IDataCollectionQuery {
    siteId: number;
    formId: number;
    folderId: TNullableNumber;
    subjectId: number;
}

// interface ISelectedFormCountDetail {
//     currentCount: number;
//     maxCount: number;
// }

export const getDefaultDataCollectionQueryDetails = (): IDataCollectionQuery => ({
    subjectId: 0,
    siteId: 0,
    formId: 0,
    folderId: null,
});

export interface IFormLink {
    formId: number;
    folderId: TNullableNumber;
}

export interface ISelectedDiscrepancyDetails extends IDataCollectionQuery {
    publishedSubjectFormFieldParentId: number;
    publishedSubjectFormFieldChildDetailId: number;
    showDiscrepancy: boolean;
    isProcessLogForm: boolean;
    processLogForm: boolean;
}

export interface ISelectedMyTaskDetails extends IDataCollectionQuery {
    publishedSubjectFormFieldParentId: number;
    recordPosition: number;
    isProcessLogForm: boolean;
    // groupId: number;
}

export type TFilePreview = File | string | null;

export type TConditionalFormType = "add form" | "list";

interface IAddDynamiForm extends ITrialVisitAndFormDetails {
    isAddDynamicForms: boolean;
    subjectId: number;
}

interface IInactivatedFormDetail {
    formId: number;
    folderId: TNullableNumber;
    subjectId: number;
    triggerInactivation: boolean;
}

export const getDefaultSelectedDiscrepancyDetails = (): ISelectedDiscrepancyDetails => ({
    ...getDefaultDataCollectionQueryDetails(),
    publishedSubjectFormFieldChildDetailId: 0,
    publishedSubjectFormFieldParentId: 0,
    showDiscrepancy: false,
    isProcessLogForm: false,
    processLogForm: false,
});

export const getDefaultSelectedMyTaskDetails = (): ISelectedMyTaskDetails => ({
    ...getDefaultDataCollectionQueryDetails(),
    recordPosition: -1,
    publishedSubjectFormFieldParentId: 0,
    isProcessLogForm: false,
    // groupId: -1
});

export const getDefaultInactivatedFormDetails = (): IInactivatedFormDetail => ({
    formId: 0,
    folderId: null,
    subjectId: 0,
    triggerInactivation: false,
});

const useDataCollectionStore = defineStore("dataCollectionStore", () => {
    const queryParamDetails = ref<IDataCollectionQuery>({
        ...getDefaultDataCollectionQueryDetails(),
    });
    const triggerGenerateForm = ref<boolean>(false);
    const selectedFormId = ref<string>("");
    const selectedSubjectId = ref<string>("");
    const selectedFormName = ref<string>("");
    const selectedFormMaxCount = ref<number>(0);
    const formFieldStatuses = ref<IFormFieldStatus[]>([]);
    const activeTrialVisits = ref<TObject<number[]>>({});
    const triggerModelChanged = ref<TUnsavedFormAction>("none");
    const dataCollectionDataViewType = ref<TIconType>("grid");
    const isSignatureRequiredForSelectedForm = ref<boolean>(false);
    const isNavigateToSubjectDispositionForm = ref<boolean>(false);
    const isCheckForNavigateToSubjectDispositionForm = ref<boolean>(false);
    const subjectStatus = ref<string>("");
    const selectedFieldId = ref<TNullableNumber>(null);
    const areAllFormsFilledForSelectedSubject = ref<boolean>(false);
    const selectedPublishedSubjectFormFieldParentId = ref<number>(0);
    const selectedPublishedSubjectFormFieldParentIdRef = ref<number>(0);
    const activeFormIndex = ref<number>(0);
    const isFormIndexChanged = ref<boolean>(false);
    const isLogForm = ref<boolean>(false);
    const formLinkDetails = ref<Record<string, IFormLink>>({});
    const triggerNextFormLink = ref<boolean>(false);
    const subjectFormFolderDetails = ref<IDataCollectionQuery[]>([]);
    const activeSubjectFormFolderIndex = ref<number>(0);
    const isLogFormBeingEnteredForFirstTime = ref<boolean>(false);
    const isStandaradFormBeingEnteredForFirstTime = ref<boolean>(false);
    const clinicalTrialsInitialTabIndex = ref<number>(0);
    const selectedDiscrepancyDetails = ref<ISelectedDiscrepancyDetails>({
        ...getDefaultSelectedDiscrepancyDetails(),
    });
    const selectedMyTaskDetails = ref<ISelectedMyTaskDetails>({
        ...getDefaultSelectedMyTaskDetails(),
    });
    const enteredSubjectDetails = ref<Record<string, ISubjectDetail[]>>({});
    const triggerNestedMenuLinkClick = ref<boolean>(false);
    const selectedMenuDetails = ref<{
        rowDetails: IDCMenuLink;
        subjectDetails: IDCMenuLink;
        trialVisitDetails: IDCMenuLink | null;
    } | null>(null);
    // const isDemographicsFormEntered = ref<boolean>(false);
    const filePreview = ref<TFilePreview>(null);
    const dynamicFormsToBeAdded = ref<IAddDynamiForm>({
        forms: [],
        trialVisits: [],
        isAddDynamicForms: false,
        subjectId: -1,
    });
    const conditionalForms = ref<Record<string, ITrialVisitAndFormDetails>>({});
    const selectedFormType = ref<number>(-1);
    const inactivatedFormDetails = ref<IInactivatedFormDetail>({
        ...getDefaultInactivatedFormDetails(),
    });

    async function formFieldStatusesList() {
        const { status, data } = await formFieldStatusesListAPI();
        if (status === 200) {
            formFieldStatuses.value = deepClone(data);
        } else if (status !== 401) {
            formFieldStatuses.value = [];
        }
    }

    function getEnumKeyByStatusName(formFieldStatus: string): IconKeys {
        let result: IconKeys = IconKeys.PlannedStatus;
        switch (formFieldStatus) {
            case "Planned": {
                result = IconKeys.PlannedStatus;
                break;
            }
            case "Data Entry Inprogress": {
                result = IconKeys.DataEntryInprogressStatus;
                break;
            }
            case "Data Entry Completed": {
                result = IconKeys.DataEntryCompletedStatus;
                break;
            }
            case "Verify In Progress": {
                result = IconKeys.VerifyInProgressStatus;
                break;
            }
            case "Review 1 In Progress": {
                result = IconKeys.Review1InProgressStatus;
                break;
            }
            case "Review 2 In Progress": {
                result = IconKeys.Review2InProgressStatus;
                break;
            }
            case "Verify Completed": {
                result = IconKeys.VerifyCompletedStatus;
                break;
            }
            case "Review 1 Completed": {
                result = IconKeys.Review1CompletedStatus;
                break;
            }
            case "Review 2 Completed": {
                result = IconKeys.Review2CompletedStatus;
                break;
            }
            case "Locked": {
                result = IconKeys.LockedStatus;
                break;
            }
            case "Frozen": {
                result = IconKeys.FrozenStatus;
                break;
            }
            case "Disabled": {
                result = IconKeys.DisabledStatus;
                break;
            }
        }
        return result;
    }

    // dataCollectionStore.activeTrialVisits[
    //     dataCollectionStore.queryParamDetails.subjectId
    // ] = [];
    function clearTrialVisitsBySubjectsInActiveTrialVisits(subjectIds: TNullableNumber[] = []) {
        for (const row of Object.keys(activeTrialVisits.value)) {
            if (getArrayLength(subjectIds) > 0 && !subjectIds.includes(Number(row))) continue;
            else if (
                (getArrayLength(subjectIds) > 0 && subjectIds.includes(Number(row))) ||
                getArrayLength(subjectIds) === 0
            )
                activeTrialVisits.value[row] = [];
        }
    }

    function setDynamicFormsToBeAdded(params: ITrialVisitAndFormDetails & { subjectId: number }) {
        const trialVisits: ISubjectTrialVisitData[] = [];
        const forms: ISubjectFormData[] = [];
        if (params.trialVisits) {
            for (const row of params.trialVisits) {
                if (row.forms && getArrayLength(row.forms) > 0) {
                    trialVisits.push(deepClone(row));
                }
            }
        }
        if (params.forms) {
            for (const row of params.forms) {
                forms.push(deepClone(row));
            }
        }
        dynamicFormsToBeAdded.value.trialVisits = deepClone(trialVisits);
        dynamicFormsToBeAdded.value.forms = deepClone(forms);
        dynamicFormsToBeAdded.value.subjectId = params.subjectId;
    }

    // function setSubjectIdsToConditionalForms(subjectIds: number[]) {
    //     if (getArrayLength(subjectIds) > 0) {
    //         for (const subjectId of subjectIds) {
    //             if (!checkIfKeyExistsInObject(subjectId, conditionalForms.value))
    //                 conditionalForms.value[subjectId] = {
    //                     forms: [],
    //                     trialVisits: [],
    //                 };
    //         }
    //     }
    // }
    function setToConditionalTrialVisitForms(
        data: Record<string, ISubjectFormData[]>,
        trialVisitDetails: ISubjectTrialVisitData[],
    ) {
        for (const [subjectAndTrialVisitId, formDetails] of Object.entries(data)) {
            const [subjectId, trialVisitId] = subjectAndTrialVisitId.split("_");
            if (!checkIfKeyExistsInObject(subjectId, conditionalForms.value)) {
                conditionalForms.value[subjectId] = {
                    forms: [],
                    trialVisits: [],
                };
            }
            const trialVisitData = getFilteredItems({
                data: trialVisitDetails,
                type: "object",
                value: Number(trialVisitId),
                key: "id",
            });
            if (getArrayLength(trialVisitData) > 0) {
                conditionalForms.value[subjectId].trialVisits.push(
                    deepClone({
                        ...trialVisitData[0],
                        forms: deepClone(formDetails),
                    }),
                );
            }
        }
    }
    function setToConditionalForms(data: Record<string, ISubjectFormData[]>) {
        for (const [subjectId, formDetails] of Object.entries(data)) {
            if (!checkIfKeyExistsInObject(subjectId, conditionalForms.value)) {
                conditionalForms.value[subjectId] = {
                    forms: [],
                    trialVisits: [],
                };
            }
            for (const formRow of formDetails) {
                conditionalForms.value[subjectId].forms.push(deepClone(formRow));
            }
        }
    }

    function setConditionalForms(
        params: ITrialVisitAndFormDetails & { subjectIds: number[] },
        type: TConditionalFormType,
    ) {
        conditionalForms.value = {};
        if (type === "add form") {
            if (getArrayLength(params.subjectIds) > 0) {
                for (const subjectId of params.subjectIds) {
                    if (!checkIfKeyExistsInObject(subjectId, conditionalForms.value))
                        conditionalForms.value[subjectId] = {
                            forms: [],
                            trialVisits: [],
                        };
                    if (getArrayLength(params.trialVisits) > 0) {
                        for (const trialVisitRow of params.trialVisits) {
                            conditionalForms.value[subjectId].trialVisits.push(
                                deepClone(trialVisitRow),
                            );
                        }
                    }
                    if (getArrayLength(params.forms) > 0) {
                        for (const formRow of params.forms) {
                            conditionalForms.value[subjectId].forms.push(deepClone(formRow));
                        }
                    }
                }
            }
        } else {
            const trialVisitForms: Record<string, ISubjectFormData[]> = {};
            const forms: Record<string, ISubjectFormData[]> = {};
            for (const trialVisitRow of params.trialVisits) {
                for (const formRow of trialVisitRow.forms) {
                    const splittedSubjectIds = formRow.subjectIds
                        ? formRow.subjectIds.split(",").map((row) => Number(row))
                        : [];
                    if (getArrayLength(splittedSubjectIds) > 0) {
                        for (const subjectId of splittedSubjectIds) {
                            const key = `${subjectId}_${trialVisitRow.id}`;
                            if (!checkIfKeyExistsInObject(key, trialVisitForms))
                                trialVisitForms[key] = [];
                            trialVisitForms[key].push(deepClone(formRow));
                        }
                    }
                    // setSubjectIdsToConditionalForms(splittedSubjectIds);
                    // if (getArrayLength(splittedSubjectIds) > 0) {
                    //     for (const subjectId of splittedSubjectIds) {
                    //         if (checkIfKeyExistsInObject(subjectId, conditionalForms.value)) {
                    //             const trialVisitRowIndex = getIndexOfTheItem({
                    //                 data: conditionalForms.value[subjectId].trialVisits,
                    //                 type: "object",
                    //                 value: trialVisitRow.id,
                    //                 key: "id",
                    //             });
                    //             if (trialVisitRowIndex === -1) {
                    //                 conditionalForms.value[subjectId].trialVisits.push(deepClone(trialVisitRow));
                    //             } else {
                    //                 conditionalForms.value[subjectId].trialVisits[trialVisitRowIndex];
                    //             }
                    //         }
                    //     }
                    //     forms.push(deepClone(formRow));
                    // }
                }
            }
            for (const formRow of params.forms) {
                const splittedSubjectIds = formRow.subjectIds
                    ? formRow.subjectIds.split(",").map((row) => Number(row))
                    : [];
                if (getArrayLength(splittedSubjectIds) > 0) {
                    for (const subjectId of splittedSubjectIds) {
                        if (!checkIfKeyExistsInObject(subjectId, forms)) forms[subjectId] = [];
                        forms[subjectId].push(deepClone(formRow));
                    }
                }
            }
            setToConditionalTrialVisitForms(trialVisitForms, params.trialVisits);
            setToConditionalForms(forms);
        }
    }

    function isDataAllowedToEnterForTheSubject() {
        // return false;
        return !["Withdrawn by subject", "Terminated", "Screening failed"].includes(
            subjectStatus.value,
        );
    }

    function clearDataCollectionData() {
        activeFormIndex.value = 0;
        activeSubjectFormFolderIndex.value = 0;
        if (!selectedMenuDetails.value) activeTrialVisits.value = {};
        areAllFormsFilledForSelectedSubject.value = false;
        formLinkDetails.value = {};
        isFormIndexChanged.value = false;
        isLogForm.value = false;
        isLogFormBeingEnteredForFirstTime.value = false;
        isStandaradFormBeingEnteredForFirstTime.value = false;
        isSignatureRequiredForSelectedForm.value = false;
        isNavigateToSubjectDispositionForm.value = false;
        isCheckForNavigateToSubjectDispositionForm.value = false;
        selectedFieldId.value = null;
        selectedFormId.value = "";
        selectedFormName.value = "";
        selectedFormMaxCount.value = 0;
        selectedPublishedSubjectFormFieldParentId.value = 0;
        selectedPublishedSubjectFormFieldParentIdRef.value = 0;
        selectedSubjectId.value = "";
        // subjectFormFolderDetails.value = [];
        triggerNextFormLink.value = false;
        queryParamDetails.value = {
            ...getDefaultDataCollectionQueryDetails(),
        };
        selectedDiscrepancyDetails.value = { ...getDefaultSelectedDiscrepancyDetails() };
        selectedMyTaskDetails.value = { ...getDefaultSelectedMyTaskDetails() };
        conditionalForms.value = {};
        selectedFormType.value = -1;
        inactivatedFormDetails.value = { ...getDefaultInactivatedFormDetails() };
    }

    function clearStore() {
        queryParamDetails.value = { ...getDefaultDataCollectionQueryDetails() };
        triggerGenerateForm.value = false;
        selectedFormId.value = "";
        selectedSubjectId.value = "";
        selectedFormName.value = "";
        formFieldStatuses.value = [];
        activeTrialVisits.value = {};
        dataCollectionDataViewType.value = "grid";
        isSignatureRequiredForSelectedForm.value = false;
        isNavigateToSubjectDispositionForm.value = false;
        isCheckForNavigateToSubjectDispositionForm.value = false;
        subjectStatus.value = "";
        selectedFormMaxCount.value = 0;
        selectedFieldId.value = null;
        areAllFormsFilledForSelectedSubject.value = false;
        selectedPublishedSubjectFormFieldParentId.value = 0;
        selectedPublishedSubjectFormFieldParentIdRef.value = 0;
        activeFormIndex.value = 0;
        isFormIndexChanged.value = false;
        isLogForm.value = false;
        formLinkDetails.value = {};
        triggerNextFormLink.value = false;
        subjectFormFolderDetails.value = [];
        activeSubjectFormFolderIndex.value = 0;
        isLogFormBeingEnteredForFirstTime.value = false;
        isStandaradFormBeingEnteredForFirstTime.value = false;
        clinicalTrialsInitialTabIndex.value = 0;
        selectedDiscrepancyDetails.value = { ...getDefaultSelectedDiscrepancyDetails() };
        selectedMyTaskDetails.value = { ...getDefaultSelectedMyTaskDetails() };
        enteredSubjectDetails.value = {};
        // isDemographicsFormEntered.value = false;
        triggerNestedMenuLinkClick.value = false;
        selectedMenuDetails.value = null;
        filePreview.value = null;
        dynamicFormsToBeAdded.value = {
            isAddDynamicForms: false,
            forms: [],
            trialVisits: [],
            subjectId: -1,
        };
        conditionalForms.value = {};
        selectedFormType.value = -1;
        inactivatedFormDetails.value = { ...getDefaultInactivatedFormDetails() };
    }

    return {
        queryParamDetails,
        triggerGenerateForm,
        selectedFormId,
        selectedSubjectId,
        selectedFormName,
        formFieldStatuses,
        activeTrialVisits,
        triggerModelChanged,
        dataCollectionDataViewType,
        isSignatureRequiredForSelectedForm,
        isNavigateToSubjectDispositionForm,
        isCheckForNavigateToSubjectDispositionForm,
        subjectStatus,
        selectedFormMaxCount,
        selectedFieldId,
        areAllFormsFilledForSelectedSubject,
        selectedPublishedSubjectFormFieldParentId,
        selectedPublishedSubjectFormFieldParentIdRef,
        activeFormIndex,
        isFormIndexChanged,
        isLogForm,
        formLinkDetails,
        triggerNextFormLink,
        subjectFormFolderDetails,
        activeSubjectFormFolderIndex,
        isLogFormBeingEnteredForFirstTime,
        isStandaradFormBeingEnteredForFirstTime,
        clinicalTrialsInitialTabIndex,
        selectedDiscrepancyDetails,
        selectedMyTaskDetails,
        enteredSubjectDetails,
        // isDemographicsFormEntered,
        triggerNestedMenuLinkClick,
        selectedMenuDetails,
        filePreview,
        dynamicFormsToBeAdded,
        conditionalForms,
        selectedFormType,
        inactivatedFormDetails,
        formFieldStatusesList,
        getEnumKeyByStatusName,
        setDynamicFormsToBeAdded,
        setConditionalForms,
        isDataAllowedToEnterForTheSubject,
        clearTrialVisitsBySubjectsInActiveTrialVisits,
        clearDataCollectionData,
        clearStore,
    };
});

export default useDataCollectionStore;
