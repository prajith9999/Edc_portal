<script setup lang="ts">
    import { DISCREPANCY_REASONS, PAGE_LIMIT_OPTIONS } from "~/constants/options";
    import { getTableColumns, auditHistoryColumns } from "~/services/apis/data/clinical-trials";
    import DropdownOption from "~/services/apis/data/dropdown-option";
    import Loading from "~/services/apis/data/loading";
    import { controlTypesListAPI } from "~/services/apis/handlers/admin/form-field";
    import { siteListByStudyIdAPI } from "~/services/apis/handlers/admin/site";
    import {
        changeSubjectStatusAPI,
        subjectDetailsBySubjectIdAPI,
        subjectListByStudyIdAPI,
        updateFormActivationStatusAPI,
        type IUpdateFormData,
    } from "~/services/apis/handlers/admin/subject";
    import {
        changeFormFieldProgressStatusApi,
        deletePublishedFormFieldsAPI,
        formFieldCaptureSignatureAPI,
        formFieldCheckActionAuditAPI,
        formFieldCheckProgressStatusWorkflowAPI,
        formFieldDetailsByIdsAPI,
        generateFormFieldsListAPI,
        generateFormFieldsStructureListAPI,
        processFormFieldEditCheckAPI,
        assignedDerivationsAPI,
        publishedDataDictionaryEntriesListByIdAPI,
        publishedSubjectFormFieldDetailAPI,
        publishedUnitDictionaryEntriesListByIdAPI,
        saveFormFieldsAPI,
        subjectCompletionFormSigningAPI,
        assignedVisibilityEditChecksAPI,
        addFormEditChecksAPI,
        assignedDisableFieldEditChecksAPI,
        type TGenerateFormFieldsData,
        formFieldCheckActionStatusAPI,
        assignedNonLogDataValueEditChecksAPI,
    } from "~/services/apis/handlers/portal/data-collection";
    import {
        badgeCountDetailsAPI,
        discrepancyPaginationListAPI,
        formFieldDiscrepancyAPI,
    } from "~/services/apis/handlers/portal/discrepancy";
    import {
        auditEntryDetailsAPI,
        auditFormDetailsAPI,
        auditHistoryDetailsPaginationListAPI,
        subjectDetailsPaginationListAPI,
    } from "~/services/apis/handlers/portal/form-field-audit-detail";
    import { processMyTaskAPI } from "~/services/apis/handlers/portal/my-task";
    import type {
        IFieldValueDetail,
        IFormFieldCheckActionAuditData,
        IFormFieldCheckProgressStatusWorkflowData,
        IFormFieldDetailsData,
        IGenerateFormFieldsData,
        IPublishedDataDictionaryEntryListData,
        IPublishedSubjectFormFieldDetailData,
        IPublishedUnitDictionaryEntryListData,
        ISubjectFormData,
        ISubjectTrialVisitData,
        ITrialVisitAndFormDetails,
        TFormFieldDerivationData,
        TFormFieldDisableEditCheckData,
        TFormFieldNonLogDataEditCheckData,
        TFormFieldVisibiltyEditCheckData,
    } from "~/services/apis/handlers/types/data-collection-types";
    import type {
        IFormFieldDiscrepancyBadgeCount,
        IFormFieldDiscrepancyData,
    } from "~/services/apis/handlers/types/discrepancy-types";
    import type {
        IAuditEntryDetailData,
        IAuditFormData,
        IAuditHistoryDetailsData,
    } from "~/services/apis/handlers/types/form-field-audit-detail-types";
    import type {
        IConditionalFormData,
        IDeactivatedFormData,
        ISubjectDetailPaginationList,
    } from "~/services/apis/handlers/types/subject-types";
    import useDataCollectionStore, { type IFormLink } from "~/stores/data-collection";
    import useGlobalStore from "~/stores/global";
    import useLoaderStore from "~/stores/loader";
    import usePopupModalStore from "~/stores/popup-modal";
    import useQuickLinkStore from "~/stores/quick-link";
    import useSideBarStore from "~/stores/side-bar";
    import useStudyStore from "~/stores/study";
    import useToastStore from "~/stores/toast";
    import useUserStore, { type IUser } from "~/stores/user";
    import type {
        IDataCollectionDetail,
        IDataCollectionUnsavedProgressStatusDetails,
        IDictionaryDetails,
        IOptions,
        IPublishedSubjectFormFieldMetaDetail,
        IPublishedSubjectFormMetaDetail,
        TDataCollectionFormDetails,
        TDataCollectionLogFormDetails,
        TDataCollectionResetType,
        TEditFormDetail,
        TNullableNumber,
        TNullableString,
        TOptionValue,
        TPageFilterAction,
        TPublishedSubjectFormFieldMetaDetail,
        TTableData,
        TUnsavedFormAction,
        TVoidAction,
    } from "~/types/common";
    import type { IColumn, TColumnChildren, TSortType } from "~/types/datatable";
    import type {
        ICalendarProps,
        ICheckboxGroupOptions,
        ICheckboxGroupProps,
        IDataCollectionFormDetails,
        IDropdownOptions,
        IDropdownProps,
        IFileUploadProps,
        IFormFieldDerivationDetails,
        IFormFieldDisableEditCheckDetails,
        IFormFieldNonLogDataEditCheckDetails,
        IFormFieldVisibiltyEditCheckDetails,
        IRadioGroupOptions,
        IRadioGroupProps,
        ITextAreaProps,
        ITextInputGroupProps,
        TDataCollectionFormType,
        TModelValue,
    } from "~/types/form-generation";
    import { isDerivedField, setAssignedDerivationDetails } from "~/utils/derivation";
    import {
        setAssignedFormFieldVisibiltyEditCheckDetails,
        setFormFieldDisableBasedOnDisableEditChecks,
        setFormFieldVisibiltyBasedOnVisbilityEditChecks,
    } from "~/utils/edit-check";
    import {
        getAPIFieldValueDetails,
        getElementTabIndex,
        getNextProgressStatusByCurrentStatus,
    } from "~/utils/form-generation";
    import PaginationModel from "~/utils/pagination";

    definePageMeta({
        layout: "portal-layout",
    });

    useHead({
        title: seoPageTitle("Clinical Trials"),
    });

    interface IAuditHistoryQueryParam {
        subjectId: number;
        siteId: number;
        formId: number;
        folderId: TNullableNumber;
        formName: string;
    }

    interface IFilterModel {
        search: TNullableString;
        subjectId: TNullableNumber;
        siteId: TNullableNumber;
        groupId: TNullableNumber;
    }

    interface IFormUpdateDetail {
        progressStatus: boolean;
        formSaved: boolean;
    }

    interface IFormFieldSignatureFormModel {
        username: TNullableString;
        password: TNullableString;
        enterpriseName: TNullableString;
    }

    interface IFormFieldSignatureErrorModel {
        username: string;
        password: string;
        enterpriseName: string;
    }

    // type TFormFieldCheckActionType = "Verify" | "Lock" | "Freeze";

    const defaultFormFieldSignatureFormModel = (): IFormFieldSignatureFormModel => ({
        enterpriseName: null,
        password: null,
        username: null,
    });

    const defaultFormFieldSignatureErrorModel = (): IFormFieldSignatureErrorModel => ({
        enterpriseName: "",
        password: "",
        username: "",
    });

    const defaultFilterModel = () => ({
        search: null,
        subjectId: null,
        groupId: null,
        siteId: null,
    });

    const defaultAuditHistoryQueryParam = (): IAuditHistoryQueryParam => ({
        subjectId: 0,
        siteId: 0,
        formId: 0,
        folderId: null,
        formName: "",
    });

    const defaultFormUpdateDetails = (): IFormUpdateDetail => ({
        formSaved: false,
        progressStatus: false,
    });

    interface IRaiseDiscrepancyFormModel {
        comments: TNullableString;
        status: TNullableString;
        formFieldDiscrepancyId: number;
        selectedReason: TNullableString;
    }
    interface IRaiseDiscrepancyErrorModel {
        comments: string;
    }
    const defaultRaiseDiscrepancyFormModel = (): IRaiseDiscrepancyFormModel => ({
        comments: null,
        status: "1",
        formFieldDiscrepancyId: 0,
        selectedReason: null,
    });
    const defaultRaiseDiscrepancyErrorModel = (): IRaiseDiscrepancyErrorModel => ({
        comments: "",
    });

    interface IFieldStatusMetaData {
        progressStatus: string;
        fieldId: number;
        publishedSubjectFormFieldChildDetailId: number;
        isVerified: boolean;
        isFrozen: boolean;
        isLocked: boolean;
    }

    interface IFormFieldProgressStatusMetaData {
        fieldIds: number[];
        publishedSubjectFormFieldChildDetailIds: number[];
        formProgressStatus: string;
        fieldProgressStatus: string;
    }

    const defaultFormFieldProgressStatus = (): IFormFieldProgressStatusMetaData => ({
        fieldIds: [],
        publishedSubjectFormFieldChildDetailIds: [],
        fieldProgressStatus: "",
        formProgressStatus: "",
    });

    // interface IDataCollectionQuery {
    //     siteId: number;
    //     formId: number;
    //     folderId: number;
    //     subjectId: number;
    // }

    // const getDefaultDataCollectionQueryDetails = (): IDataCollectionQuery => ({
    //     subjectId: 0,
    //     siteId: 2015,
    //     formId: 0,
    //     folderId: 0,
    // });

    const globalStore = useGlobalStore();
    const popupModalStore = usePopupModalStore();
    const studyStore = useStudyStore();
    const toastStore = useToastStore();
    const dataCollectionStore = useDataCollectionStore();
    const sideBarStore = useSideBarStore();
    const userStore = useUserStore();
    const quickLinkStore = useQuickLinkStore();
    const loaderStore = useLoaderStore();
    const route = useRoute();

    const paginationModel = ref<PaginationModel>(new PaginationModel());
    const tableColumns = ref<IColumn[]>(getTableColumns());
    const auditTableData = ref<TTableData[]>([]);
    const subjectDetailsList = ref<ISubjectDetailPaginationList[]>([]);
    const filterModel = ref<IFilterModel>({ ...defaultFilterModel() });
    const filterModelRef = ref<IFilterModel>({ ...defaultFilterModel() });
    // const dataCollectionFormDetails = ref<IDataCollectionFormDetails[]>([]);
    // const dataCollectionFormDetailsRef = ref<IDataCollectionFormDetails[]>([]);
    const dataCollectionFormDetails = ref<TDataCollectionFormDetails>({});
    const dataCollectionFormDetailsRef = ref<TDataCollectionFormDetails>({});
    const logFormDetails = ref<TDataCollectionLogFormDetails>({});
    const dataCollectionDetails = ref<Record<string, IDataCollectionDetail>>({});
    // TODO: currently figuring out what is the root cause of the maximum stack reached error.
    // dataCollectionFormDetails
    // dataCollectionFormDetailsRef
    // logFormDetails
    // dataCollectionDetails

    // dataDictionaryEntriesList
    // unitDictionaryEntriesList
    // publishedSubjectFormFieldDetails
    // currentLogFormEditIndex
    // publishedSubjectFormDetails
    // loading
    // isModelChanged

    const auditHistoryPagination = ref<PaginationModel>(new PaginationModel());
    const loading = ref<Loading>(new Loading());
    const isFormEntered = ref<IFormUpdateDetail>({ ...defaultFormUpdateDetails() });
    // const dataCollectionQueryDetails = ref<IDataCollectionQuery>({
    //     ...getDefaultDataCollectionQueryDetails(),
    // });

    const dataCollectionFormFieldStructureDetails = ref<IGenerateFormFieldsData[]>([]);
    const dataCollectionFormFieldDetailsList = ref<IGenerateFormFieldsData[]>([]);
    const controlTypeOptions = ref<DropdownOption>(new DropdownOption());
    const dataDictionaryEntriesList = ref<IPublishedDataDictionaryEntryListData[]>([]);
    const unitDictionaryEntriesList = ref<IPublishedUnitDictionaryEntryListData[]>([]);
    const subjectOptions = ref<DropdownOption>(new DropdownOption());
    const studySiteOptions = ref<DropdownOption>(new DropdownOption());
    const auditEntryDetailsData = ref<IAuditEntryDetailData | null>(null);
    const auditFormDetailsData = ref<IAuditFormData[]>([]);
    const auditHistoryDetailsData = ref<IAuditHistoryDetailsData[]>([]);
    const auditHistoryQueryParams = ref<IAuditHistoryQueryParam>({
        ...defaultAuditHistoryQueryParam(),
    });
    const showShadow = ref<boolean>(false);
    const formFieldSignatureFormModel = ref<IFormFieldSignatureFormModel>({
        ...defaultFormFieldSignatureFormModel(),
    });
    const formFieldSignatureFormModelRef = ref<IFormFieldSignatureFormModel>({
        ...defaultFormFieldSignatureFormModel(),
    });
    const formFieldSignatureErrorModel = ref<IFormFieldSignatureErrorModel>({
        ...defaultFormFieldSignatureErrorModel(),
    });
    const publishedSubjectFormDetails = ref<IPublishedSubjectFormMetaDetail[]>([]);
    const publishedSubjectFormAuditDetails = ref<IPublishedSubjectFormMetaDetail[]>([]);
    const currentFormIndex = ref<number>(0);
    const publishedSubjectFormFieldDetails = ref<TPublishedSubjectFormFieldMetaDetail>({});

    const raiseDiscrepancyFormModel = ref<IRaiseDiscrepancyFormModel>({
        ...defaultRaiseDiscrepancyFormModel(),
    });
    const raiseDiscrepancyFormModelRef = ref<IRaiseDiscrepancyFormModel>({
        ...defaultRaiseDiscrepancyFormModel(),
    });
    const raiseDiscrepancyErrorModel = ref<IRaiseDiscrepancyErrorModel>({
        ...defaultRaiseDiscrepancyErrorModel(),
    });
    const disableDiscrepancyLazyLoad = ref<boolean>(false);
    const discrepancyListPagination = ref<PaginationModel>(new PaginationModel());
    const raisedDiscrepanciesData = ref<IFormFieldDiscrepancyData[]>([]);
    const raiseDiscrepancyModelTriggerChange = ref<TUnsavedFormAction>("none");
    const lastRow = ref(null);
    const lastRowVisibility = useElementVisibility(lastRow);
    const selectedFormFieldDetails = ref<IDataCollectionFormDetails | null>(null);
    const currentLogFormEditIndex = ref<number>(-1);
    // const currentLogFormGroupId = ref<number>(-1);
    const demographicFormEnteredFieldIds = ref<number[]>([]);
    const demographicFormEnteredPublishedSubjectFormFieldChildDetailIds = ref<number[]>([]);
    type IRaisedDiscrepancyDataDetail = Record<
        string,
        {
            heading: IFormFieldDiscrepancyData | null;
            content: IFormFieldDiscrepancyData[];
            isActive: boolean;
        }
    >;

    const raisedDiscrepanciesDataDetails = ref<IRaisedDiscrepancyDataDetail>({});
    const showResolveDiscrepancySection = ref<boolean>(false);
    const showRaiseDiscrepancySection = ref<boolean>(false);
    type TDiscrepancyActionType = "raise" | "others";
    const discrepancyFormFieldMapper = ref<Record<string, boolean>>({});
    const formFieldDetails = ref<IFormFieldDetailsData | null>(null);
    const assignedFieldDerivations = ref<TFormFieldDerivationData<IFormFieldDerivationDetails>>({});
    const assignedFormFieldVisibiltyEditChecks = ref<
        TFormFieldVisibiltyEditCheckData<IFormFieldVisibiltyEditCheckDetails>
    >({});
    const assignedFormFieldDisableEditChecks = ref<
        TFormFieldDisableEditCheckData<IFormFieldDisableEditCheckDetails>
    >({});
    const assignedFormFieldNonLogDataValueEditChecks = ref<
        TFormFieldNonLogDataEditCheckData<IFormFieldNonLogDataEditCheckDetails>
    >({});
    const triggerDerivationOnlyOnceIds = ref<number[]>([]);
    const discrepancyStatuses = ref<IRadioGroupOptions[]>([]);
    const logDataEntryCheckValueResult = ref<Record<string, TNullableString>>({});
    const orderByDetails = ref<Record<string, "asc" | "desc"> | undefined>(undefined);
    const isUserAllowedToEnterData = ref<boolean>(
        checkIfActionIsAllowed(studyStore.getRoleIdBySiteId(), [RolePermissionType.Edit]),
    );

    const clinicalTrialBreadCrumbDetails = computed(() => {
        const result: string[] = ["Dashboard", "Clinical Trials"];
        // if (studyStore.isStudySelected(true)) result.push(studyStore.trialName);
        return result;
    });
    const breadCrumbDetails = computed(() => {
        const result: string[] = [];
        if (formFieldDetails.value) {
            if (formFieldDetails.value.folderName) result.push(formFieldDetails.value.folderName);
            if (formFieldDetails.value.publishedSubjectFormFieldParentIds)
                result.push(
                    `${formFieldDetails.value.formName}${
                        getArrayLength(formFieldDetails.value.publishedSubjectFormFieldParentIds) >
                        1
                            ? ` (${String(
                                  getIndexOfTheItem({
                                      data: formFieldDetails.value
                                          .publishedSubjectFormFieldParentIds,
                                      type: "primitive",
                                      value: formFieldDetails.value
                                          .publishedSubjectFormFieldParentId as number,
                                  }) + 1,
                              )})`
                            : ""
                    }`,
                );
            result.push(formFieldDetails.value.fieldLabel);
        }
        return result;
    });

    const controlTypeLookups = computed(() =>
        getOptionsList(controlTypeOptions.value.options, "name", "id"),
    );
    const subjectLookups = computed(() =>
        getOptionsList(subjectOptions.value.options, "fieldValue", "id"),
    );
    const studySiteLookups = computed(() =>
        getOptionsList(studySiteOptions.value.options, "siteName", "siteId"),
    );

    function setDiscrepancyStatuses() {
        const result: IRadioGroupOptions[] = [];
        // result.push(
        //     { label: "Raise", value: "1", specify: false },
        //     { label: "Resolve", value: "2", specify: false },
        //     { label: "Cancel", value: "3", specify: false },
        //     { label: "Answer", value: "4", specify: false },
        // );
        // return result;
        const roleBySiteIds = studyStore.getRoleIdBySiteId(
            dataCollectionStore.queryParamDetails.siteId,
        );
        // const isAllowedToPerformQueryAction = checkIfActionIsAllowed(
        //                                                             studyStore.getRoleIdBySiteId(),
        //                                                             RolePermissionType.Query,
        //                                                         );
        let isFieldLocked = false;
        for (const formCollectionRow of Object.values(dataCollectionFormDetails.value)) {
            for (const row of formCollectionRow) {
                if (row.isHeading && getArrayLength(row.children) > 0) {
                    for (const childrenRow of row.children) {
                        if (
                            childrenRow.publishedSubjectFormFieldChildDetailId ===
                                dataCollectionStore.selectedFieldId &&
                            childrenRow.isLocked
                        ) {
                            isFieldLocked = true;
                            break;
                        }
                    }
                } else if (!row.isHeading) {
                    if (
                        row.publishedSubjectFormFieldChildDetailId ===
                            dataCollectionStore.selectedFieldId &&
                        row.isLocked
                    ) {
                        isFieldLocked = true;
                        break;
                    }
                }
            }
        }
        if (isFieldLocked) return [];
        if (checkIfActionIsAllowed(roleBySiteIds, [RolePermissionType.Query])) {
            result.push({ label: "Raise", value: "1", specify: false });
            let isDMRaisedQuery = false;
            for (const row of raisedDiscrepanciesData.value) {
                if ([2, 3].includes(row.status)) break;
                if (row.modifiedBy === "DM" || !row.modifiedBy) {
                    isDMRaisedQuery = true;
                    break;
                }
            }
            if (
                roleBySiteIds.includes(6) ||
                roleBySiteIds.includes(14) ||
                roleBySiteIds.includes(15) ||
                (roleBySiteIds.includes(3) && !isDMRaisedQuery)
            ) {
                result.push(
                    { label: "Resolve", value: "2", specify: false },
                    { label: "Cancel", value: "3", specify: false },
                );
            }
        }

        if (roleBySiteIds.includes(1) || roleBySiteIds.includes(2) || roleBySiteIds.includes(15)) {
            let isActiveRaisedOrAnsweredQuery = false;
            if (getArrayLength(raisedDiscrepanciesData.value) > 0) {
                if (
                    [1, 4].includes(
                        raisedDiscrepanciesData.value[
                            getArrayLength(raisedDiscrepanciesData.value) - 1
                        ].status,
                    )
                )
                    isActiveRaisedOrAnsweredQuery = true;
            }
            if (isActiveRaisedOrAnsweredQuery)
                result.push({ label: "Answer", value: "4", specify: false });
        }
        return result;
    }

    async function subjectsList() {
        subjectOptions.value.loading = true;
        const { status, data, message } = await subjectListByStudyIdAPI(
            studyStore.studyInformation.studyId as number,
        );
        if (status === 200) {
            subjectOptions.value.options = deepClone(data);
        } else if (status !== 401) {
            subjectOptions.value.options = [];
            toastStore.error({
                title: "Error",
                message,
            });
        }
        subjectOptions.value.loading = false;
    }

    async function studySitesList() {
        studySiteOptions.value.loading = true;
        const { status, data, message } = await siteListByStudyIdAPI({
            studyId: Number(studyStore.studyInformation.studyId),
        });
        if (status === 200) {
            studySiteOptions.value.options = deepClone(data);
        } else if (status !== 401) {
            studySiteOptions.value.options = [];
            toastStore.error({
                title: "Error",
                message,
            });
        }
        studySiteOptions.value.loading = false;
    }

    function getFormTableColumns(
        subjectId: number,
        formDetailItems: ISubjectFormData[],
        isDirectForm: boolean = false,
        folderId: number = 0,
    ): TColumnChildren {
        const result: TColumnChildren = [];
        if (isDirectForm) {
            for (const row of formDetailItems) {
                result.push({
                    header: "",
                    field: "",
                    show: true,
                    icon: true,
                    children: [
                        {
                            header: row.formName,
                            field: row.formName,
                            show: true,
                            icon: true,
                            childType: "only",
                            data: { ...row, subjectId },
                        },
                    ],
                });
            }
        } else {
            for (const [index, row] of formDetailItems.entries()) {
                result.push({
                    header: row.formName,
                    field: row.formName,
                    show: true,
                    icon: true,
                    childType: index !== formDetailItems.length - 1 ? "first" : "second",
                    data: { ...row, subjectId, folderId },
                });
            }
        }
        return result;
    }

    function getTrialVisitTableColumns(
        subjectId: number,
        trialVisitDetailItems: ISubjectTrialVisitData[],
    ): TColumnChildren {
        const result: TColumnChildren = [];
        for (const row of trialVisitDetailItems) {
            result.push({
                header: row.name,
                field: row.name,
                show: true,
                icon: false,
                children: getFormTableColumns(subjectId, row.forms || [], false, row.id),
            });
        }
        return result;
    }

    function getBaseTableColumns() {
        const result: IColumn[] = [];
        for (const [tableColumnIndex, tableColumnRow] of tableColumns.value.entries()) {
            if (tableColumnIndex > 2) break;
            result.push(deepClone(tableColumnRow));
        }
        return result;
    }

    function setTableColumns(
        tableItems: ISubjectDetailPaginationList[],
        combinedTrialVisits: ISubjectTrialVisitData[] = [],
        combinedForms: ISubjectFormData[] = [],
        addConditionalForms: boolean = false,
    ) {
        // const result: IColumn[] = [...getTableColumns()];
        const result: IColumn[] = [...getBaseTableColumns()];
        const formFoldersList: TColumnChildren = [];
        for (const [index, row] of tableItems.entries()) {
            if (index !== 0) break;
            formFoldersList.push(
                ...getTrialVisitTableColumns(
                    row.subjectId,
                    addConditionalForms ? combinedTrialVisits : row.trialVisits || [],
                ),
                ...getFormTableColumns(
                    row.subjectId,
                    addConditionalForms ? combinedForms : row.forms || [],
                    true,
                ),
            );
        }
        tableColumns.value = deepClone([...result, ...formFoldersList]);
    }

    // function getRandomFormProgressStatus(formName: string, subjectName: string) {
    //     const items = [
    //         "Planned",
    //         "Data Entry Inprogress",
    //         "Data Entry Completed",
    //         "Verify In Progress",
    //         "Review 1 In Progress",
    //         "Review 2 In Progress",
    //         "Verify Completed",
    //         "Review 1 Completed",
    //         "Review 2 Completed",
    //         "Locked",
    //         "Frozen",
    //     ];
    //     return items[Math.floor(Math.random() * items.length)];
    //     // let progressStatus = "Planned";
    //     // if (
    //     //     [
    //     //         "0001",
    //     //         "0002",
    //     //         "0003",
    //     //         "0004",
    //     //         // "0005",
    //     //         // "0006",
    //     //         // "0007",
    //     //         // "0008"
    //     //     ].includes(subjectName)
    //     // ) {
    //     //     if (formName === "Demographics") progressStatus = "Locked";
    //     //     else if (formName === "Substance History") progressStatus = "Review 1 In Progress";
    //     //     else if (formName === "ECG") progressStatus = "Data Entry Completed";
    //     // }
    //     return progressStatus;
    // }

    // function setFormsTableData(tableDataItems: ISubjectFormData[], subjectName: string) {
    //     return tableDataItems.map((row) => ({
    //         ...row,
    //         // progressStatus: getRandomFormProgressStatus(row.formName, subjectName),
    //     }));
    // }

    // function setTrialVisitTableData(tableDataItems: ISubjectTrialVisitData[], subjectName: string) {
    //     return tableDataItems.map((row) => ({
    //         ...row,
    //         forms: setFormsTableData(row.forms, subjectName),
    //     }));
    // }

    function checkIfFormIsDisabled(
        disabledForms: IDeactivatedFormData[],
        formId: number,
        folderId: TNullableNumber,
    ) {
        let result = false;
        for (const row of disabledForms) {
            if (row.folderId && row.folderId === folderId && row.formId === formId) {
                result = true;
                break;
            } else if (!row.folderId && row.formId === formId) {
                result = true;
                break;
            }
        }
        return result;
    }

    function setFormsTableData(
        tableDataItems: ISubjectFormData[],
        conditionalForms: ISubjectFormData[],
        addConditionalForms: boolean,
        disabledForms: IDeactivatedFormData[],
    ) {
        const result: TTableData = {};
        const sortedForms = sortArray({
            data: [
                ...(tableDataItems || []),
                ...(addConditionalForms && conditionalForms && getArrayLength(conditionalForms) > 0
                    ? conditionalForms
                    : []),
            ],
            type: "object",
            key: "formOrderNumber",
            sortBy: "asc",
            valueTypeCast: "number",
        }) as ISubjectFormData[];
        for (const row of sortedForms) {
            result[`#$%${row.id}`] = checkIfFormIsDisabled(disabledForms, row.id, null)
                ? "Disabled"
                : row.progressStatus;
        }
        return result;
    }

    function setTrialVisitTableData(
        tableDataItems: ISubjectTrialVisitData[],
        conditionalTrialVisits: ISubjectTrialVisitData[],
        addConditionalForms: boolean,
        disabledForms: IDeactivatedFormData[],
    ) {
        const result: TTableData = {};
        for (const row of tableDataItems) {
            const filteredConditionalItems = getFilteredItems({
                data: conditionalTrialVisits,
                type: "object",
                value: row.id,
                key: "id",
            }) as ISubjectTrialVisitData[];
            const sortedForms = sortArray({
                data: [
                    ...(row.forms || []),
                    ...(addConditionalForms &&
                    filteredConditionalItems &&
                    getArrayLength(filteredConditionalItems) > 0
                        ? filteredConditionalItems[0].forms
                        : []),
                ],
                type: "object",
                key: "formOrderNumber",
                sortBy: "asc",
                valueTypeCast: "number",
            });
            for (const subRow of sortedForms) {
                result[`${row.id}#$%${subRow.id}`] = checkIfFormIsDisabled(
                    disabledForms,
                    subRow.id,
                    row.id,
                )
                    ? "Disabled"
                    : subRow.progressStatus;
            }
        }
        return result;
    }

    function defaultFormToBeOpened(
        trialVisits: ISubjectTrialVisitData[],
        forms: ISubjectFormData[],
    ) {
        const result: IFormLink = {
            folderId: null,
            formId: 0,
        };
        if (getArrayLength(trialVisits) > 0) {
            result.folderId = trialVisits[0].id;
            if (getArrayLength(trialVisits[0].forms) > 0)
                result.formId = trialVisits[0].forms[0].id;
        } else if (getArrayLength(forms) > 0) result.formId = forms[0].id;
        return result;
    }

    function setFormToBeOpenedBySubjectId(
        trialVisits: ISubjectTrialVisitData[],
        forms: ISubjectFormData[],
        progressStatusIndex: number,
        isDefaultFormFolder: boolean,
        finalCheck: boolean = false,
        skipLoop: boolean = false,
    ) {
        if (skipLoop) return { formId: 0, folderId: null };
        if (isDefaultFormFolder) return defaultFormToBeOpened(trialVisits, forms);
        let exitFromOuterLoop = false;
        const progressStatusesToBeChecked = [
            "Data Entry Inprogress",
            "Verify In Progress",
            "Planned",
            "Data Entry Completed",
            "Verify Completed",
        ];
        const progressStatusToBeChecked = checkIfIndexExistInArray(
            progressStatusIndex,
            progressStatusesToBeChecked,
        )
            ? progressStatusesToBeChecked[progressStatusIndex]
            : "Planned";
        const result: IFormLink = {
            folderId: null,
            formId: 0,
        };
        for (const trialVisitRow of trialVisits) {
            for (const formRow of trialVisitRow.forms) {
                if (formRow.progressStatus === progressStatusToBeChecked) {
                    result.folderId = trialVisitRow.id;
                    result.formId = formRow.id;
                    exitFromOuterLoop = true;
                    break;
                }
            }
            if (exitFromOuterLoop) break;
        }
        // if (result.formId > 0) {
        if (result.formId === 0) {
            for (const formRow of forms) {
                if (formRow.progressStatus === progressStatusToBeChecked) {
                    result.folderId = null;
                    result.formId = formRow.id;
                    break;
                }
            }
        }
        if (result.formId === 0 && finalCheck) {
            const { folderId, formId } = defaultFormToBeOpened(trialVisits, forms);
            result.folderId = folderId;
            result.formId = formId;
        } else if (result.formId === 0 && !finalCheck) {
            return setFormToBeOpenedBySubjectId(
                trialVisits,
                forms,
                progressStatusIndex + 1,
                false,
                false,
                false,
            );
        }
        return result;
    }

    function areAllFormsFilled(trialVisits: ISubjectTrialVisitData[], forms: ISubjectFormData[]) {
        let result = true;
        let exitFromOuterLoop = false;
        for (const trialVisitRow of trialVisits) {
            for (const formRow of trialVisitRow.forms) {
                if (!formRow.progressStatus) continue;
                if (!["Frozen", "Locked"].includes(String(formRow.progressStatus))) {
                    result = false;
                    exitFromOuterLoop = true;
                    break;
                }
            }
            if (exitFromOuterLoop) break;
        }
        if (result) {
            for (const formRow of forms) {
                if (!formRow.progressStatus) continue;
                if (!["Frozen", "Locked"].includes(String(formRow.progressStatus))) {
                    result = false;
                    break;
                }
            }
        }
        return result;
    }

    function checkIfAllFormsAreFilledBySubjectId() {
        for (const row of auditTableData.value) {
            if (row.subjectId === dataCollectionStore.queryParamDetails.subjectId) {
                dataCollectionStore.areAllFormsFilledForSelectedSubject = row.areAllFormsFilled;
                break;
            }
        }
    }

    function combineFormDetailsAndConditionalForms(
        params: ITrialVisitAndFormDetails & IConditionalFormData,
    ) {
        const combinedTrialVisits: ISubjectTrialVisitData[] = [];
        const combinedForms: ISubjectFormData[] = [...params.forms];
        for (const trialVisitRow of params.trialVisits) {
            const forms: ISubjectFormData[] = [];
            const filteredItem = getFilteredItems({
                data: params.conditionalForms.trialVisits,
                type: "object",
                value: Number(trialVisitRow.id),
                key: "id",
            }) as ISubjectTrialVisitData[];
            if (getArrayLength(filteredItem) > 0) {
                for (const formRow of filteredItem[0].forms) {
                    if (formRow.progressStatus) {
                        forms.push(deepClone(formRow));
                    }
                }
            }
            combinedTrialVisits.push(
                deepClone({
                    ...trialVisitRow,
                    forms: deepClone(
                        sortArray({
                            data: [...(trialVisitRow.forms || []), ...forms],
                            type: "object",
                            key: "formOrderNumber",
                            sortBy: "asc",
                            valueTypeCast: "number",
                        }),
                    ),
                }),
            );
        }
        for (const formRow of params.conditionalForms.forms) {
            if (formRow.progressStatus) combinedForms.push(deepClone(formRow));
        }
        return {
            combinedTrialVisits,
            combinedForms,
        };
    }

    function doesAtleastOneSubjectHasConditionalFormsEnabled(
        dataList: ISubjectDetailPaginationList[],
    ) {
        let result = false;
        const trialVisits: ISubjectTrialVisitData[] = [];
        const forms: ISubjectFormData[] = [];
        for (const row of dataList) {
            // for (const trialVisitRow of row.trialVisits) {
            //     console.log("trialVisitRow in doesAtleastOneSubject in sdpr", trialVisitRow);
            //     trialVisits.push(trialVisitRow);
            // }
            for (const trialVisitRow of row.conditionalForms[0].trialVisits) {
                trialVisits.push(trialVisitRow);
            }
            // for (const formRow of row.forms) {
            //     console.log("formRow in doesAtleastOneSubject in sdpr", formRow);
            //     forms.push(formRow);
            // }
            for (const formRow of row.conditionalForms[0].forms) {
                forms.push(formRow);
            }
        }
        for (const trialVisitRow of trialVisits) {
            for (const formRow of trialVisitRow.forms) {
                if (formRow.progressStatus) {
                    result = true;
                    break;
                }
            }
        }
        if (!result) {
            for (const formRow of forms) {
                if (formRow.progressStatus) {
                    result = true;
                    break;
                }
            }
        }
        return result;
    }

    function setTableData(
        tableItems: ISubjectDetailPaginationList[],
        combinedTrialVisits: ISubjectTrialVisitData[],
        combinedForms: ISubjectFormData[],
        addConditionalForms: boolean,
    ) {
        const result: TTableData[] = [];
        if (getArrayLength(Object.keys(dataCollectionStore.formLinkDetails)) > 0)
            dataCollectionStore.formLinkDetails = {};
        let isFormLinkDetailsSet = false;
        for (const [rowIndex, row] of tableItems.entries()) {
            const areAllFormsFilledResult =
                areAllFormsFilled(row.trialVisits, row.forms) &&
                areAllFormsFilled(
                    row.conditionalForms[0].trialVisits,
                    row.conditionalForms[0].forms,
                );
            const { folderId, formId } = setFormToBeOpenedBySubjectId(
                // row.trialVisits,
                // row.forms,
                combinedTrialVisits,
                combinedForms,
                0,
                areAllFormsFilledResult,
                rowIndex === getArrayLength(tableItems) - 1,
                isFormLinkDetailsSet,
            );
            if (formId > 0 && !isFormLinkDetailsSet) {
                isFormLinkDetailsSet = true;
                dataCollectionStore.formLinkDetails[row.subjectId] = { folderId, formId };
            }
            result.push({
                ...row,
                group: null,
                areAllFormsFilled: areAllFormsFilledResult,
                ...setTrialVisitTableData(
                    row.trialVisits,
                    row.conditionalForms[0].trialVisits,
                    addConditionalForms,
                    row.deactivatedForms,
                ),
                // ...setTrialVisitTableData(combinedTrialVisits),
                ...setFormsTableData(
                    row.forms,
                    row.conditionalForms[0].forms,
                    addConditionalForms,
                    row.deactivatedForms,
                ),
                // ...setFormsTableData(combinedForms),
                // trialVisits: [...setTrialVisitTableData(row.trialVisits, row.fieldValue)],
                // forms: [...setFormsTableData(row.forms, row.fieldValue)],
            });
        }
        return result;
    }

    function resetTableData() {
        auditTableData.value = [];
        subjectDetailsList.value = [];
        paginationModel.value.clearPageDetails();
        paginationModel.value.clearCountDetails();
        setTableColumns([]);
    }

    async function subjectDetailsPaginationList() {
        loading.value.dynamicLoading["auditTable"] = true;
        const { status, data, message } = await subjectDetailsPaginationListAPI(
            getAPIFilters({
                search: filterModel.value.search,
                filter: {
                    trialId: studyStore.studyInformation.trialId,
                    environmentId: studyStore.studyInformation.environmentId,
                    siteId: filterModel.value.siteId,
                    subjectId: filterModel.value.subjectId,
                },
                top: paginationModel.value.pageDetails.pageLimit,
                page: paginationModel.value.pageDetails.currentPage,
                orderBy: orderByDetails.value,
            }),
        );
        if (status === 200) {
            const { items, total } = data;
            const isAddConditionalForms = doesAtleastOneSubjectHasConditionalFormsEnabled(items);
            const { combinedTrialVisits, combinedForms } = combineFormDetailsAndConditionalForms({
                conditionalForms:
                    getArrayLength(items) > 0
                        ? items[0].conditionalForms[0]
                        : { forms: [], trialVisits: [] },
                forms: getArrayLength(items) > 0 ? items[0].forms : [],
                trialVisits: getArrayLength(items) > 0 ? items[0].trialVisits : [],
            });
            const tableDataItems = setTableData(
                items,
                combinedTrialVisits,
                combinedForms,
                isAddConditionalForms,
            );
            auditTableData.value = deepClone(tableDataItems);
            paginationModel.value.pageDetails.totalRecords = total;
            paginationModel.value.pageDetails.lastPage = paginationModel.value.getLastPage();
            setTableColumns(
                tableDataItems as ISubjectDetailPaginationList[],
                combinedTrialVisits,
                combinedForms,
                isAddConditionalForms,
            );
            subjectDetailsList.value = deepClone(items);
        } else if (status !== 401) {
            toastStore.error({
                title: "Error",
                message,
            });
            resetTableData();
        }
        loading.value.dynamicLoading["auditTable"] = false;
    }

    async function publishedDataDictionaryEntriesListById(params: IDictionaryDetails) {
        if (
            getArrayLength(params.globalDictionaryIds) > 0 ||
            getArrayLength(params.publishedDictionaryIds) > 0
        ) {
            loading.value.dynamicLoading["dataCollectionDataDictionaryEntriesList"] = true;
            const { status, data } = await publishedDataDictionaryEntriesListByIdAPI({
                trialId: studyStore.studyInformation.trialId as number,
                environmentId: studyStore.studyInformation.environmentId as number,
                siteId: dataCollectionStore.queryParamDetails.siteId,
                globalDataDictionaryIds: params.globalDictionaryIds,
                publishedDataDictionaryIds: params.publishedDictionaryIds,
            });
            if (status === 200) {
                dataDictionaryEntriesList.value = deepClone(data);
            } else if (status !== 401) {
                dataDictionaryEntriesList.value = [];
            }
            loading.value.dynamicLoading["dataCollectionDataDictionaryEntriesList"] = false;
        }
    }

    async function publishedUnitDictionaryEntriesListById(params: IDictionaryDetails) {
        if (
            getArrayLength(params.globalDictionaryIds) > 0 ||
            getArrayLength(params.publishedDictionaryIds) > 0
        ) {
            loading.value.dynamicLoading["dataCollectionUnitDictionaryEntriesList"] = true;
            const { status, data } = await publishedUnitDictionaryEntriesListByIdAPI({
                trialId: studyStore.studyInformation.trialId as number,
                environmentId: studyStore.studyInformation.environmentId as number,
                siteId: dataCollectionStore.queryParamDetails.siteId,
                globalUnitDictionaryIds: params.globalDictionaryIds,
                publishedUnitDictionaryIds: params.publishedDictionaryIds,
            });
            if (status === 200) {
                unitDictionaryEntriesList.value = deepClone(data);
            } else if (status !== 401) {
                unitDictionaryEntriesList.value = [];
            }
            loading.value.dynamicLoading["dataCollectionUnitDictionaryEntriesList"] = false;
        }
    }

    async function getDictionaryEntries(
        dataDictionaryDetails: IDictionaryDetails,
        unitDictionaryDetails: IDictionaryDetails,
    ) {
        await Promise.all([
            publishedDataDictionaryEntriesListById(dataDictionaryDetails),
            publishedUnitDictionaryEntriesListById(unitDictionaryDetails),
        ]);
    }

    function getDictionaryEntryDetails(
        dataDictionaryDetails: IDictionaryDetails,
        unitDictionaryDetails: IDictionaryDetails,
    ) {
        for (const formConfigRow of dataCollectionFormFieldDetailsList.value) {
            if (formConfigRow.dictionaryId) {
                if (formConfigRow.isDataDictionaryGlobal)
                    dataDictionaryDetails.globalDictionaryIds.push(
                        formConfigRow.dictionaryId as number,
                    );
                else
                    dataDictionaryDetails.publishedDictionaryIds.push(
                        formConfigRow.dictionaryId as number,
                    );
            }

            if (formConfigRow.unitDictionaryId) {
                if (formConfigRow.isUnitDictionaryGlobal)
                    unitDictionaryDetails.globalDictionaryIds.push(
                        formConfigRow.unitDictionaryId as number,
                    );
                else
                    unitDictionaryDetails.publishedDictionaryIds.push(
                        formConfigRow.unitDictionaryId as number,
                    );
            }
        }
    }

    function findItemInFieldValueDetails(
        fieldValueDetails: IFieldValueDetail[],
        dictionaryValue: string,
    ): IFieldValueDetail {
        const filteredItems = getFilteredItems({
            data: fieldValueDetails,
            type: "object",
            key: "fieldValue",
            value: dictionaryValue,
        });
        return getArrayLength(filteredItems) > 0
            ? filteredItems[0]
            : {
                  id: 0,
                  fieldValue: null,
                  publishedSubjectFormFieldChildValueDetailId: 0,
                  specifiedValue: null,
              };
    }

    // const maxLogFormDataEntryRecordOccurences = () => {
    //     const arr = dataCollectionFormFieldDetailsList.value
    //         .filter((row) => row.isLogDataEntry)
    //         .map((row) => row.id);
    //     const countDetails = arr.reduce((acc: Record<string, number>, item) => {
    //         acc[item] = (acc[item] || 0) + 1; // Increment the count for each item
    //         return acc;
    //     }, {});
    //     let count = 0;
    //     const nonEnteredRecordIds: number[] = [];
    //     if (getArrayLength(Object.keys(countDetails)) > 0) {
    //         for (const row of Object.values(countDetails)) {
    //             if (Number(row) > count) count = Number(row);
    //         }
    //         for (const [key, value] of Object.entries(countDetails)) {
    //             if (Number(value) !== count) {
    //                 nonEnteredRecordIds.push(Number(key));
    //             }
    //         }
    //     }
    //     return {
    //         maxCount: count,
    //         nonEnteredRecordIds,
    //     };
    // };

    // function checkIfAllLogFieldsDataAreEmpty(enteredResult: TDataCollectionLogFormDetails) {
    //     const entryIndexToBeRemoved: string[] = [];
    //     console.log("enteredResult in checkIfAllLogFieldsDataAreEmpty", enteredResult);
    //     for (const [rowKey, rowValue] of Object.entries(enteredResult)) {
    //         let result = true;
    //         for (const dataRow of rowValue) {
    //             if (
    //                 (Array.isArray(dataRow.modelValue) && getArrayLength(dataRow.modelValue) > 0) ||
    //                 dataRow.modelValue
    //             ) {
    //                 if (result) result = false;
    //                 break;
    //             }
    //         }
    //         if (result) entryIndexToBeRemoved.push(rowKey);
    //     }
    //     console.log(
    //         "entryIndexToBeRemoved in checkIfAllLogFieldsDataAreEmpty",
    //         entryIndexToBeRemoved,
    //     );
    //     if (getArrayLength(entryIndexToBeRemoved) > 0) {
    //         for (const key of entryIndexToBeRemoved) {
    //             delete enteredResult[key];
    //         }
    //     }
    // }

    // function removeEnteredResult(
    //     enteredResult: TDataCollectionLogFormDetails,
    //     dataResult: IDataCollectionFormDetails[],
    // ) {
    //     const firstDataValue = getArrayLength(dataResult) > 0 ? dataResult[0].modelValue : null;
    //     const setEmptyObjForLogFormDetails =
    //         dataCollectionStore.isLogFormBeingEnteredForFirstTime ||
    //         firstDataValue === null ||
    //         firstDataValue === "No";
    //     console.log("setEmptyObjForLogFormDetails", setEmptyObjForLogFormDetails);
    //     return setEmptyObjForLogFormDetails ? {} : enteredResult;
    // }

    // function isFirstTimeLogForm(dataResult: IDataCollectionFormDetails[]) {
    //     const firstDataValue: TModelValue[] = [];
    //     for (const row of dataResult) {
    //         if (row.isHeading && getArrayLength(row.children) > 0) {
    //             for (const childrenRow of row.children) {
    //                 if (!childrenRow.isLogDataEntry) firstDataValue.push(childrenRow.modelValue);
    //             }
    //         } else if (!row.isHeading) {
    //             if (!row.isLogDataEntry) firstDataValue.push(row.modelValue);
    //         }
    //     }
    //     const isAllYesSelected = firstDataValue.every((row) => row === "Yes");
    //     return (
    //         dataCollectionStore.isLogFormBeingEnteredForFirstTime || !isAllYesSelected
    //     );
    // }
    function isFirstTimeLogForm(dataResult: IDataCollectionFormDetails[]) {
        const firstDataValue: TModelValue[] = [];
        const nonLogDataFieldIds: number[] = [];
        for (const row of dataResult) {
            if (row.isHeading && getArrayLength(row.children) > 0) {
                for (const childrenRow of row.children) {
                    if (!childrenRow.isLogDataEntry) {
                        nonLogDataFieldIds.push(childrenRow.id);
                        firstDataValue.push(childrenRow.modelValue);
                    }
                }
            } else if (!row.isHeading) {
                if (!row.isLogDataEntry) {
                    nonLogDataFieldIds.push(row.id);
                    firstDataValue.push(row.modelValue);
                }
            }
        }
        const nonLogDataEnterResult = getLogDataEntryHideCheckValueWithoutForm(
            assignedFormFieldNonLogDataValueEditChecks.value,
            nonLogDataFieldIds,
        );
        const finalResult = [
            ...new Set(Object.values(nonLogDataEnterResult).filter((row) => row !== null)),
        ];
        const isProperValueSelectedForNonLogDataEntry = firstDataValue.every(
            (row) => row === (getArrayLength(finalResult) > 0 ? finalResult[0] : "Yes"),
        );
        return (
            dataCollectionStore.isLogFormBeingEnteredForFirstTime ||
            isProperValueSelectedForNonLogDataEntry
        );
    }

    function checkIfMultipleEntriesPresentForLogForms(
        generateFormFieldsData: IGenerateFormFieldsData[],
    ) {
        const logFieldsCount: Record<string, number> = {};
        for (const row of generateFormFieldsData) {
            if (!row.isLogDataEntry) continue;
            if (!checkIfKeyExistsInObject(row.id, logFieldsCount)) logFieldsCount[row.id] = 0;
            if (getArrayLength(row.fieldValueDetails) > 0) logFieldsCount[row.id]++;
        }
        let isAtleastOneEntryEntered = false;
        for (const entryCount of Object.values(logFieldsCount)) {
            if (entryCount > 0) {
                isAtleastOneEntryEntered = true;
                break;
            }
        }
        return isAtleastOneEntryEntered;
    }

    function getEnteredSubjectDemographicDetails(fieldLabel: string) {
        let result: TNullableString = null;
        let searchKey = "";
        switch (convertToLowerCase(String(fieldLabel))) {
            case "subject initials": {
                // searchKey = "Subject Code";
                searchKey = "";
                break;
            }
            case "age": {
                searchKey = "Age";
                break;
            }
            case "gender": {
                searchKey = "Gender";
                break;
            }
        }
        if (
            checkIfKeyExistsInObject(
                dataCollectionStore.queryParamDetails.subjectId,
                dataCollectionStore.enteredSubjectDetails,
            ) &&
            searchKey
        ) {
            const filteredItems = getFilteredItems({
                data: dataCollectionStore.enteredSubjectDetails[
                    dataCollectionStore.queryParamDetails.subjectId
                ],
                type: "object",
                key: "label",
                value: searchKey,
            });
            if (getArrayLength(filteredItems) > 0) {
                result = filteredItems[0].fieldValue;
            }
        }
        return result;
    }

    function processFormGeneration(isNewForm: boolean = false) {
        // dataCollectionStore.selectedFormType = 3;
        let groupId = dataCollectionStore.selectedFormType === 3 ? 1 : 0;
        const result: IDataCollectionFormDetails[] = [];
        const finalResult: TDataCollectionFormDetails = {};
        let childrenResult: IDataCollectionFormDetails[] = [];
        // const enteredResult: IDataCollectionFormDetails[] = [];
        const enteredResult: Record<string, IDataCollectionFormDetails[]> = {};
        // const enteredResult: TDataCollectionLogFormDetails = {};
        const processsFormFieldIds: number[] = [];
        // const logFormCountDetails: Record<string, Record<string, number>> = {};
        const logFormCountDetails: Record<string, number> = {};

        // const { maxCount, nonEnteredRecordIds } = maxLogFormDataEntryRecordOccurences();
        let tabindexCount = 0;
        for (const [
            formConfigRowIndex,
            formConfigRow,
        ] of dataCollectionFormFieldDetailsList.value.entries()) {
            const controlTypeDetails = getFilteredItems({
                data: controlTypeLookups.value,
                type: "object",
                key: "value",
                value: formConfigRow.controlType,
            });

            let logFormModelValue: boolean | any[] | TNullableString = null;

            const demographicFormDetailsByFieldLabel =
                dataCollectionStore.selectedFormName === "Demographics" &&
                formConfigRow.progressStatus === "Planned"
                    ? getEnteredSubjectDemographicDetails(formConfigRow.label || "")
                    : null;
            const formProgressStatus =
                dataCollectionStore.selectedFormName === "Demographics" &&
                demographicFormDetailsByFieldLabel &&
                formConfigRow.progressStatus === "Planned"
                    ? "Data Entry Inprogress"
                    : formConfigRow.progressStatus;

            let publishedSubjectFormFieldChildDetailId = null;
            if (!formConfigRow.isLogDataEntry) {
                publishedSubjectFormFieldChildDetailId =
                    getPublishedSubjectFormFieldChildDetailId(formConfigRow);
            }

            if (demographicFormDetailsByFieldLabel) {
                demographicFormEnteredFieldIds.value.push(formConfigRow.id);
                demographicFormEnteredPublishedSubjectFormFieldChildDetailIds.value.push(
                    publishedSubjectFormFieldChildDetailId as number,
                );
            }

            const { modelValue, specifiedValue } = getModelAndSpecifiedValueByControlType(
                controlTypeDetails[0].value,
                isNewForm || formConfigRow.isLogDataEntry ? [] : formConfigRow.fieldValueDetails,
                formConfigRow.defaultValue || demographicFormDetailsByFieldLabel,
            );
            if (formConfigRow.isLogDataEntry) {
                if (!dataCollectionStore.isLogForm) dataCollectionStore.isLogForm = true;
                const { modelValue: logFormModelValueRef } = getModelAndSpecifiedValueByControlType(
                    controlTypeDetails[0].value,
                    formConfigRow.fieldValueDetails,
                    formConfigRow.defaultValue,
                );
                logFormModelValue = logFormModelValueRef;
            }

            const disabledCheckCondition = isNewForm
                ? false
                : formConfigRow.isFrozen || formConfigRow.isLocked;

            let optionDetails: ICheckboxGroupOptions[] = [];
            if (controlTypeDetails[0].value === 6) {
                optionDetails = formConfigRow.dictionaryId
                    ? (dataDictionaryEntriesList.value
                          .filter((row) => row.dataDictionaryId === formConfigRow.dictionaryId)
                          .map((row) => {
                              const {
                                  id,
                                  publishedSubjectFormFieldChildValueDetailId,
                                  fieldValue,
                                  specifiedValue: specifiedFieldValue,
                              } = findItemInFieldValueDetails(
                                  formConfigRow.fieldValueDetails,
                                  row.userDataString,
                              );
                              return {
                                  id: getArrayLength(formConfigRow.fieldValueDetails) > 0 ? id : 0,
                                  publishedSubjectFormFieldChildValueDetailId:
                                      getArrayLength(formConfigRow.fieldValueDetails) > 0
                                          ? publishedSubjectFormFieldChildValueDetailId
                                          : 0,
                                  label: row.userDataString,
                                  value: row.codedData,
                                  specify: row.specify,
                                  isChecked: !!fieldValue,
                                  specifiedValue: specifiedFieldValue,
                              };
                          }) as ICheckboxGroupOptions[])
                    : [];
            }
            const tabindexCountResult = getElementTabIndex(
                controlTypeDetails[0].value,
                tabindexCount,
                controlTypeDetails[0].value === 6 && getArrayLength(optionDetails) > 0
                    ? getArrayLength(optionDetails)
                    : 1,
            );
            let formObj: Record<string, any> = {
                id: formConfigRow.id,
                elementId: convertWordsIntoCasedWords(formConfigRow.label || "", "camel case"),
                modelValue,
                specifiedValue: isNewForm ? null : specifiedValue,
                controlType: formConfigRow.controlType,
                defaultModelValue: formConfigRow.defaultValue,
                labelClass: "",
                inputClass: "",
                label: formConfigRow.label,
                containerClass: "w-[34rem]",
                // disabled:
                //     !checkIfActionIsAllowed(
                //         studyStore.getRoleIdBySiteId(),
                //         RolePermissionType.Edit,
                //     ) ||
                //     disabledCheckCondition ||
                //     !dataCollectionStore.isDataAllowedToEnterForTheSubject(),
                disabled: isFieldDisabled(disabledCheckCondition),
                showHelpText: !!formConfigRow.helpText,
                helpText: formConfigRow.helpText,
                dictionaryId: formConfigRow.dictionaryId,
                unitDictionaryId: formConfigRow.unitDictionaryId,
                isDataDictionaryGlobal: formConfigRow.isDataDictionaryGlobal,
                isUnitDictionaryGlobal: formConfigRow.isUnitDictionaryGlobal,
                progressStatus: isNewForm ? "Planned" : formProgressStatus, // formConfigRow.progressStatus,
                isVerified: isNewForm ? false : formConfigRow.isVerified,
                isFrozen: isNewForm ? false : formConfigRow.isFrozen,
                isLocked: isNewForm ? false : formConfigRow.isLocked,
                publishedSubjectFormFieldParentId: isNewForm
                    ? dataCollectionStore.selectedPublishedSubjectFormFieldParentId
                    : formConfigRow.publishedSubjectFormFieldParentId,
                publishedSubjectFormFieldChildDetailId: isNewForm
                    ? publishedSubjectFormFieldChildDetailId
                    : formConfigRow.publishedSubjectFormFieldChildDetailId,
                isLogDataEntry: formConfigRow.isLogDataEntry,
                fieldValueDetails: isNewForm ? [] : [...formConfigRow.fieldValueDetails],
                componentKey: `${formConfigRow.id}_${uniqueID()}`,
                tabindex: [1, 6, 7, 8, 9].includes(controlTypeDetails[0].value)
                    ? undefined
                    : tabindexCountResult[0], // formConfigIndex + 1,
                tabindexes: [1, 6, 7, 8, 9].includes(controlTypeDetails[0].value)
                    ? [...tabindexCountResult]
                    : undefined,
                isVisible: formConfigRow.isVisible,
                format: formConfigRow.format,
                isHeading: !formConfigRow.varOID,
                indentLevel: formConfigRow.indentLevel,
                oid: formConfigRow.oid,
            };
            if ([1, 6, 7, 8, 9].includes(controlTypeDetails[0].value))
                tabindexCount = tabindexCountResult[getArrayLength(tabindexCountResult) - 1];
            else tabindexCount = tabindexCountResult[0];

            const {
                type,
                fractionalPart,
                maxLength,
                minLength,
                wholePart,
                dateFormat,
                multipleUpload,
            } = getValidationPropsDetails(formConfigRow.format, controlTypeDetails[0].value);
            if (getArrayLength(controlTypeDetails) > 0) {
                if (controlTypeDetails[0].value === 1) {
                    // Text
                    formObj = {
                        ...formObj,
                        type,
                        // elementId,
                        error: null,
                        // inputContainerClass,
                        containerClass: formConfigRow.unitDictionaryId
                            ? "w-[23.45rem]"
                            : "w-[34rem]",
                        minLength,
                        maxLength,
                        wholePart,
                        fractionalPart,
                        // placeholder: `Please enter a ${formConfigRow.label ? convertToLowerCase(formConfigRow.label) : "value"}`,
                        placeholder: "Please enter a value",
                        // readOnly: false,
                        required: false,
                        specifiedOptions: unitDictionaryEntriesList.value
                            .filter(
                                (row) => row.unitDictionaryId === formConfigRow.unitDictionaryId,
                            )
                            .map((row) => ({
                                label: row.userDataString,
                                value: row.codedUnit,
                            })) as IOptions[],
                    } as ITextInputGroupProps;
                } else if (controlTypeDetails[0].value === 2) {
                    // Long text
                    formObj = {
                        ...formObj,
                        // elementId,
                        placeholder: "Please enter a value",
                        required: false,
                        error: null,
                        // rows,
                        // cols,
                        // showCharacterCount,
                        max: maxLength,
                        // ellipseCount,
                    } as ITextAreaProps;
                } else if ([3, 4, 5].includes(controlTypeDetails[0].value)) {
                    // 3 -> Date, 4 -> Time, 5 -> DateTime
                    formObj = {
                        ...formObj,
                        disabledDates: [],
                        // elementId,
                        error: null,
                        format: dateFormat,
                        // maxDate,
                        // minDate,
                        pickerClass: "w-[34rem]",
                        pickerOffset: 0,
                        pickerPlacement: "bottom",
                        // pickerPosition,
                        // placeholder: `Please select a ${formConfigRow.label ? convertToLowerCase(formConfigRow.label) : "value"}`,
                        placeholder: "Please enter an option",
                        // readOnly,
                        required: false,
                        type:
                            controlTypeDetails[0].value === 3
                                ? "date"
                                : controlTypeDetails[0].value === 4
                                  ? "time"
                                  : "datetime",
                    } as ICalendarProps;
                } else if (controlTypeDetails[0].value === 6) {
                    // Checkbox
                    formObj = {
                        ...formObj,
                        // elementId,
                        // name: convertWordsIntoCasedWords(
                        //     formConfigRow.label ||
                        //         `${convertToLowerCase(formConfigRow.name)} Group`,
                        //     "camel case",
                        // ),
                        name: convertWordsIntoCasedWords(
                            `${formConfigRow.label || ""}${formConfigRow.name} Group`,
                            "camel case",
                        ),
                        options: optionDetails,
                        required: false,
                        type: "vertical",
                        error: null,
                    } as ICheckboxGroupProps;
                } else if (controlTypeDetails[0].value === 7) {
                    // Dropdown
                    formObj = {
                        ...formObj,
                        options: formConfigRow.dictionaryId
                            ? (dataDictionaryEntriesList.value
                                  .filter(
                                      (row) => row.dataDictionaryId === formConfigRow.dictionaryId,
                                  )
                                  .map((row) => ({
                                      label: row.userDataString,
                                      value: row.codedData,
                                      specify: row.specify,
                                  })) as IDropdownOptions[])
                            : formConfigRow.unitDictionaryId
                              ? (unitDictionaryEntriesList.value
                                    .filter(
                                        (row) =>
                                            row.unitDictionaryId === formConfigRow.unitDictionaryId,
                                    )
                                    .map((row) => ({
                                        label: row.userDataString,
                                        value: row.codedUnit,
                                    })) as IOptions[])
                              : [],
                        // defaultValue: `Please select a ${formConfigRow.label ? convertToLowerCase(formConfigRow.label) : "value"}`,
                        defaultValue: `Please select an option`,
                        // elementId,
                        enableClear: true,
                        error: null,
                        // inputContainerClass,
                        // labelAction,
                        loading: false,
                        optionClass: "w-[34rem]",
                        // optionOffset,
                        optionPlacement: "bottom",
                        // optionPosition,
                        // readOnly,
                        required: false,
                        // resetOption: true,
                    } as unknown as IDropdownProps;
                } else if ([8, 9].includes(controlTypeDetails[0].value)) {
                    // 8 -> Horizontal radio, 9 -> Vertical radio
                    formObj = {
                        ...formObj,
                        // elementId,
                        // name: convertWordsIntoCasedWords(
                        //     formConfigRow.label ||
                        //         `${convertToLowerCase(formConfigRow.name)} Group`,
                        //     "camel case",
                        // ),
                        name: convertWordsIntoCasedWords(
                            `${formConfigRow.label || ""}${formConfigRow.name} Group`,
                            "camel case",
                        ),
                        options: dataDictionaryEntriesList.value
                            .filter((row) => row.dataDictionaryId === formConfigRow.dictionaryId)
                            .map((row) => ({
                                label: row.userDataString,
                                value: row.codedData,
                                specify: row.specify,
                            })) as IRadioGroupOptions[],
                        required: false,
                        type: controlTypeDetails[0].value === 8 ? "horizontal" : "vertical",
                        allowDeselect: true,
                        // isSpecifyEntry: false,
                        error: null,
                    } as IRadioGroupProps;
                } else if (controlTypeDetails[0].value === 10) {
                    // 10 -> File upload
                    formObj = {
                        ...formObj,
                        // elementId,
                        placeholder: "Please upload one or more file(s)",
                        required: false,
                        multiple: multipleUpload,
                        extensions: formConfigRow.validExtensions
                            ? formConfigRow.validExtensions.split("|")
                            : ["image/*"],
                    } as IFileUploadProps;
                } else if (controlTypeDetails[0].value === 11) {
                    // 11 -> Signature
                    // formObj = {
                    //     ...formObj,
                    //     // elementId,
                    //     placeholder: "Please enter a value",
                    //     required: false,
                    //     error: null,
                    //     // rows,
                    //     // cols,
                    //     disabled: !["vh.crc"].includes(
                    //         String(userStore.getDetails().username).toLocaleLowerCase(),
                    //     ),
                    //     // showCharacterCount,
                    //     max: maxLength,
                    //     // ellipseCount,
                    // } as ITextAreaProps;
                }
            }

            // if (
            //     (formConfigRow.isLogDataEntry &&
            //         !processsFormFieldIds.includes(formConfigRow.id)) ||
            //     !formConfigRow.isLogDataEntry
            // ) {
            //     if (
            //         formConfigRow.isLogDataEntry &&
            //         !processsFormFieldIds.includes(formConfigRow.id) &&
            //         ((Array.isArray(logFormModelValue) && getArrayLength(logFormModelValue) > 0) ||
            //             logFormModelValue)
            //     ) {
            //         processsFormFieldIds.push(formConfigRow.id);
            //         enteredResult.push({
            //             ...(formObj as IDataCollectionFormDetails),
            //             modelValue: logFormModelValue as TModelValue,
            //         });
            //     }
            //     result.push({
            //         ...(formObj as IDataCollectionFormDetails),
            //         specifiedValue: formConfigRow.isLogDataEntry ? null : formObj.specifiedValue,
            //         progressStatus: formConfigRow.isLogDataEntry
            //             ? "Planned"
            //             : formObj.progressStatus,
            //         isVerified: formConfigRow.isLogDataEntry ? false : formObj.isVerified,
            //         isFrozen: formConfigRow.isLogDataEntry ? false : formObj.isFrozen,
            //         isLocked: formConfigRow.isLogDataEntry ? false : formObj.isLocked,
            //         publishedSubjectFormFieldParentId:
            //             dataCollectionStore.selectedPublishedSubjectFormFieldParentId,
            //         publishedSubjectFormFieldChildDetailId: formConfigRow.isLogDataEntry
            //             ? null
            //             : formObj.publishedSubjectFormFieldChildDetailId,
            //         fieldValueDetails: formConfigRow.isLogDataEntry
            //             ? []
            //             : formObj.fieldValueDetails,
            //     });
            // } else if (
            //     formConfigRow.isLogDataEntry &&
            //     processsFormFieldIds.includes(formConfigRow.id) &&
            //     ((Array.isArray(logFormModelValue) && getArrayLength(logFormModelValue) > 0) ||
            //         logFormModelValue)
            // ) {
            //     enteredResult.push({
            //         ...(formObj as IDataCollectionFormDetails),
            //         modelValue: logFormModelValue as TModelValue,
            //     });
            // }
            if (
                (formConfigRow.isLogDataEntry &&
                    !processsFormFieldIds.includes(formConfigRow.id)) ||
                !formConfigRow.isLogDataEntry
            ) {
                if (
                    formConfigRow.isLogDataEntry &&
                    !processsFormFieldIds.includes(formConfigRow.id)
                ) {
                    // if (formConfigRow.indentLevel === 0)
                    //     result.push({
                    //         ...(formObj as IDataCollectionFormDetails),
                    //         specifiedValue: formConfigRow.isLogDataEntry
                    //             ? null
                    //             : formObj.specifiedValue,
                    //         progressStatus: formConfigRow.isLogDataEntry
                    //             ? "Planned"
                    //             : formObj.progressStatus,
                    //         isVerified: formConfigRow.isLogDataEntry ? false : formObj.isVerified,
                    //         isFrozen: formConfigRow.isLogDataEntry ? false : formObj.isFrozen,
                    //         isLocked: formConfigRow.isLogDataEntry ? false : formObj.isLocked,
                    //         publishedSubjectFormFieldParentId:
                    //             dataCollectionStore.selectedPublishedSubjectFormFieldParentId,
                    //         publishedSubjectFormFieldChildDetailId: formConfigRow.isLogDataEntry
                    //             ? null
                    //             : formObj.publishedSubjectFormFieldChildDetailId,
                    //         fieldValueDetails: formConfigRow.isLogDataEntry
                    //             ? []
                    //             : formObj.fieldValueDetails,
                    //         children: [],
                    //     });
                    // else
                    //     childrenResult.push({
                    //         ...(formObj as IDataCollectionFormDetails),
                    //         specifiedValue: formConfigRow.isLogDataEntry
                    //             ? null
                    //             : formObj.specifiedValue,
                    //         progressStatus: formConfigRow.isLogDataEntry
                    //             ? "Planned"
                    //             : formObj.progressStatus,
                    //         isVerified: formConfigRow.isLogDataEntry ? false : formObj.isVerified,
                    //         isFrozen: formConfigRow.isLogDataEntry ? false : formObj.isFrozen,
                    //         isLocked: formConfigRow.isLogDataEntry ? false : formObj.isLocked,
                    //         publishedSubjectFormFieldParentId:
                    //             dataCollectionStore.selectedPublishedSubjectFormFieldParentId,
                    //         publishedSubjectFormFieldChildDetailId: formConfigRow.isLogDataEntry
                    //             ? null
                    //             : formObj.publishedSubjectFormFieldChildDetailId,
                    //         fieldValueDetails: formConfigRow.isLogDataEntry
                    //             ? []
                    //             : formObj.fieldValueDetails,
                    //         children: [],
                    //     });
                }
                // else {
                //     const { currentPointer, nextPointer } = checkWhereToPushByIndentLevel(
                //         formConfigRow,
                //         formConfigRowIndex,
                //         dataCollectionFormFieldDetailsList.value,
                //     );
                //     console.log(
                //         "currentPointer, nextPointer",
                //         formConfigRow.oid,
                //         currentPointer,
                //         nextPointer,
                //     );
                //     if (currentPointer === "children" && nextPointer === "children") {
                //         childrenResult.push({
                //             ...(formObj as IDataCollectionFormDetails),
                //             children: [],
                //         });
                //     } else if (currentPointer === "children" && nextPointer === "parent") {
                //         childrenResult.push({
                //             ...(formObj as IDataCollectionFormDetails),
                //             children: [],
                //         });
                //         result[getArrayLength(result) - 1].children = deepClone(childrenResult);
                //         childrenResult = [];
                //     } else {
                //         result.push({ ...(formObj as IDataCollectionFormDetails), children: [] });
                //     }
                // }
                let finalFormObj = {
                    ...(formObj as IDataCollectionFormDetails),
                };
                if (
                    formConfigRow.isLogDataEntry &&
                    !processsFormFieldIds.includes(formConfigRow.id)
                ) {
                    finalFormObj = {
                        ...finalFormObj,
                        specifiedValue: formConfigRow.isLogDataEntry
                            ? null
                            : formObj.specifiedValue,
                        progressStatus: formConfigRow.isLogDataEntry
                            ? "Planned"
                            : formObj.progressStatus,
                        isVerified: formConfigRow.isLogDataEntry ? false : formObj.isVerified,
                        isFrozen: formConfigRow.isLogDataEntry ? false : formObj.isFrozen,
                        isLocked: formConfigRow.isLogDataEntry ? false : formObj.isLocked,
                        publishedSubjectFormFieldParentId:
                            dataCollectionStore.selectedPublishedSubjectFormFieldParentId,
                        publishedSubjectFormFieldChildDetailId: formConfigRow.isLogDataEntry
                            ? null
                            : formObj.publishedSubjectFormFieldChildDetailId,
                        fieldValueDetails: formConfigRow.isLogDataEntry
                            ? []
                            : formObj.fieldValueDetails,
                    };
                }
                const { currentPointer, nextPointer } = checkWhereToPushByIndentLevel(
                    formConfigRow,
                    formConfigRowIndex,
                    dataCollectionFormFieldDetailsList.value,
                );
                if (currentPointer === "children" && nextPointer === "children") {
                    childrenResult.push({
                        ...(finalFormObj as IDataCollectionFormDetails),
                        children: [],
                    });
                } else if (currentPointer === "children" && nextPointer === "parent") {
                    childrenResult.push({
                        ...(finalFormObj as IDataCollectionFormDetails),
                        children: [],
                    });
                    result[getArrayLength(result) - 1].children = deepClone(childrenResult);
                    childrenResult = [];
                } else {
                    result.push({ ...(finalFormObj as IDataCollectionFormDetails), children: [] });
                }
                processsFormFieldIds.push(formConfigRow.id);
            }
            // FIXME: fix the log form details
            if (
                formConfigRow.isLogDataEntry
                // &&
                // ((Array.isArray(logFormModelValue) && getArrayLength(logFormModelValue) > 0) ||
                //     logFormModelValue)
            ) {
                // if (!checkIfKeyExistsInObject(formConfigRow.groupId, logFormCountDetails))
                //     logFormCountDetails[formConfigRow.groupId] = {};
                // if (
                //     !checkIfKeyExistsInObject(
                //         formConfigRow.id,
                //         logFormCountDetails[formConfigRow.groupId],
                //     )
                // )
                //     logFormCountDetails[formConfigRow.groupId][formConfigRow.id] = 0;
                // if (!checkIfKeyExistsInObject(formConfigRow.groupId, enteredResult))
                //     enteredResult[formConfigRow.groupId] = {};
                // if (
                //     !checkIfKeyExistsInObject(
                //         logFormCountDetails[formConfigRow.groupId][formConfigRow.id],
                //         enteredResult[formConfigRow.groupId],
                //     )
                // )
                //     enteredResult[formConfigRow.groupId][
                //         logFormCountDetails[formConfigRow.groupId][formConfigRow.id]
                //     ] = [];
                // enteredResult[formConfigRow.groupId][
                //     logFormCountDetails[formConfigRow.groupId][formConfigRow.id]
                // ].push({
                //     ...(formObj as IDataCollectionFormDetails),
                //     modelValue: logFormModelValue as TModelValue,
                // });
                // logFormCountDetails[formConfigRow.groupId][formConfigRow.id]++;
                // if (nonEnteredRecordIds.includes(formConfigRow.id)) {
                //     for (let i = 0; i <= maxCount - 1; i++) {
                //         if (i === recordCount) continue;
                //         if (!checkIfKeyExistsInObject(i, result)) result[i] = [];
                //         result[i].push(deepClone({ ...row, fieldValueDetails: [] }));
                //     }
                if (!checkIfKeyExistsInObject(formConfigRow.id, logFormCountDetails))
                    logFormCountDetails[formConfigRow.id] = 0;
                // if (!checkIfKeyExistsInObject(formConfigRow.groupId, enteredResult))
                //     enteredResult = {};
                if (!checkIfKeyExistsInObject(logFormCountDetails[formConfigRow.id], enteredResult))
                    enteredResult[logFormCountDetails[formConfigRow.id]] = [];
                enteredResult[logFormCountDetails[formConfigRow.id]].push({
                    ...(formObj as IDataCollectionFormDetails),
                    modelValue: logFormModelValue as TModelValue,
                });
                logFormCountDetails[formConfigRow.id]++;
                // if (nonEnteredRecordIds.includes(formConfigRow.id)) {
                //     for (let i = 0; i <= maxCount - 1; i++) {
                //         if (i === recordCount) continue;
                //         if (!checkIfKeyExistsInObject(i, result)) result[i] = [];
                //         result[i].push(deepClone({ ...row, fieldValueDetails: [] }));
                //     }
            }
            // FIXME: fix the log form details
        }
        // checkIfAllLogFieldsDataAreEmpty(enteredResult);

        if (dataCollectionStore.selectedFormType === 3) {
            for (const resultRow of result) {
                finalResult[groupId] = [{ ...resultRow }];
                groupId++;
            }
        } else if ([1, 2].includes(dataCollectionStore.selectedFormType)) {
            finalResult[groupId] = result;
        }

        const finalLogFormResult: TDataCollectionLogFormDetails = {};
        if ([2, 3].includes(dataCollectionStore.selectedFormType)) {
            for (const [dataCollectionRowGroupId, dataCollectionRow] of Object.entries(
                finalResult,
            )) {
                finalLogFormResult[dataCollectionRowGroupId] = {};
                if (
                    isFirstTimeLogForm(dataCollectionRow) ||
                    !checkIfMultipleEntriesPresentForLogForms(
                        dataCollectionFormFieldDetailsList.value,
                    )
                )
                    continue;
                for (const row of dataCollectionRow) {
                    if (row.isHeading && getArrayLength(row.children) > 0) {
                        for (const childrenRow of row.children) {
                            const fieldIds: number[] = [];
                            if (!childrenRow.isLogDataEntry) continue;
                            fieldIds.push(childrenRow.id);
                            const groupResult = groupLogEntriesByFieldIds(enteredResult, fieldIds);
                            if (getArrayLength(Object.keys(groupResult)) > 0)
                                finalLogFormResult[dataCollectionRowGroupId] = {
                                    // ...finalLogFormResult[dataCollectionRowGroupId],
                                    // ...groupResult,
                                    ...Object.keys({
                                        ...finalLogFormResult[dataCollectionRowGroupId],
                                        ...groupResult,
                                    }).reduce((acc, key) => {
                                        (acc as Record<string, any[]>)[key] = [
                                            ...(finalLogFormResult[dataCollectionRowGroupId][key] ||
                                                []),
                                            ...(groupResult[key] || []),
                                        ]; // Concatenate arrays from both objects
                                        return acc;
                                    }, {}),
                                };
                        }
                    } else if (!row.isHeading) {
                        const fieldIds: number[] = [];
                        if (!row.isLogDataEntry) continue;
                        fieldIds.push(row.id);
                        const groupResult = groupLogEntriesByFieldIds(enteredResult, fieldIds);
                        if (getArrayLength(Object.keys(groupResult)) > 0)
                            finalLogFormResult[dataCollectionRowGroupId] = {
                                // ...finalLogFormResult[dataCollectionRowGroupId],
                                // ...groupResult,
                                ...Object.keys({
                                    ...finalLogFormResult[dataCollectionRowGroupId],
                                    ...groupResult,
                                }).reduce((acc, key) => {
                                    (acc as Record<string, any[]>)[key] = [
                                        ...(finalLogFormResult[dataCollectionRowGroupId][key] ||
                                            []),
                                        ...(groupResult[key] || []),
                                    ]; // Concatenate arrays from both objects
                                    return acc;
                                }, {}),
                            };
                    }
                }
            }
        }
        const finalLogFormResultRef: TDataCollectionLogFormDetails = {};
        for (const [logRowGroupId, logRowResult] of Object.entries(finalLogFormResult)) {
            finalLogFormResultRef[logRowGroupId] = {};
            for (const [logKey, logValue] of Object.entries(logRowResult)) {
                if (getArrayLength(logValue) > 0) {
                    finalLogFormResultRef[logRowGroupId][logKey] = [];
                    for (const row of logValue) {
                        finalLogFormResultRef[logRowGroupId][logKey].push(deepClone(row));
                    }
                }
            }
        }
        dataCollectionFormDetailsRef.value = deepClone(finalResult);
        dataCollectionFormDetails.value = deepClone(finalResult);
        logFormDetails.value = deepClone(finalLogFormResultRef);
        if (
            checkIfKeyExistsInObject(
                dataCollectionStore.activeFormIndex,
                dataCollectionDetails.value,
            )
        ) {
            dataCollectionDetails.value[dataCollectionStore.activeFormIndex].formDetails =
                deepClone(finalResult);
            dataCollectionDetails.value[dataCollectionStore.activeFormIndex].formDetailsRef =
                deepClone(finalResult);
            dataCollectionDetails.value[dataCollectionStore.activeFormIndex].logFormDetails =
                deepClone(finalLogFormResultRef);
        }
    }

    function groupLogEntriesByFieldIds(
        enteredLogData: TDataCollectionFormDetails,
        fieldIds: number[],
    ) {
        const logFormDetailsResult: TDataCollectionFormDetails = {};
        for (const [logEntryIndex, logEntryRow] of Object.entries(enteredLogData)) {
            // if (logEntryIndex)
            // if (Number(logEntryIndex))
            logFormDetailsResult[logEntryIndex] = [];
            for (const [, row] of logEntryRow.entries()) {
                if (fieldIds.includes(row.id)) {
                    logFormDetailsResult[logEntryIndex].push(row);
                }
            }
        }
        return logFormDetailsResult;
    }

    // function combineObjects(objA: TDataCollectionFormDetails, objB: TDataCollectionFormDetails) {
    //     const result: TDataCollectionFormDetails = {};
    //     for (const )
    // }

    // function getLogEntryDataAndCountByFieldId(enteredLogData: Record<string, IDataCollectionFormDetails[]>, fieldId: number, currentEntryCount: number, currentEntryIndex: number) {
    //     let entryCount = -1;
    //     let entryData = null;
    //     for (const [logEntryIndex, logEntryRow] of Object.entries(enteredLogData)) {
    //         // if (logEntryIndex)
    //         // if (Number(logEntryIndex))
    //         for (const [rowIndex, row] of logEntryRow.entries()) {
    //             if (isEqual(row.id, fieldId, "number") && rowIndex !== currentEntrycurrentEntryIndex) {
    //                 entryCount = Number(logEntryIndex);
    //                 entryData = deepClone(row);
    //                 break;
    //             }
    //         }
    //     }
    //     return {entryCount, entryData};
    // }

    async function controlTypesList() {
        controlTypeOptions.value.loading = true;
        const { status, data, message } = await controlTypesListAPI();
        if (status === 200) {
            controlTypeOptions.value.options = deepClone(data);
        } else if (status !== 401) {
            controlTypeOptions.value.options = [];
            toastStore.error({
                title: "Error",
                message,
            });
        }
        controlTypeOptions.value.loading = false;
    }

    async function handleProcessFormGeneration(isNewForm: boolean = false) {
        let dataDictionaryDetails: IDictionaryDetails = {
            globalDictionaryIds: [],
            publishedDictionaryIds: [],
        };
        let unitDictionaryDetails: IDictionaryDetails = {
            globalDictionaryIds: [],
            publishedDictionaryIds: [],
        };
        getDictionaryEntryDetails(dataDictionaryDetails, unitDictionaryDetails);
        await Promise.all([
            getDictionaryEntries(dataDictionaryDetails, unitDictionaryDetails),
            assignedNonLogDataValueEditChecks(),
        ]);
        processFormGeneration(isNewForm);
        dataDictionaryDetails = {
            globalDictionaryIds: [],
            publishedDictionaryIds: [],
        };
        unitDictionaryDetails = {
            globalDictionaryIds: [],
            publishedDictionaryIds: [],
        };
    }

    async function generateFormFieldsStructureList() {
        loading.value.dynamicLoading["dataCollectionFormFieldStructure"] = true;
        const queryParams = {
            trialId: studyStore.studyInformation.trialId as number,
            environmentId: studyStore.studyInformation.environmentId as number,
            subjectId: dataCollectionStore.queryParamDetails.subjectId,
            siteId: dataCollectionStore.queryParamDetails.siteId,
            formId: dataCollectionStore.queryParamDetails.formId,
            folderId: dataCollectionStore.queryParamDetails.folderId,
        };
        const { status, message, data } = await generateFormFieldsStructureListAPI(queryParams);
        if (status === 200) {
            dataCollectionFormFieldStructureDetails.value = deepClone(data);
        } else if (status !== 401) {
            dataCollectionFormFieldStructureDetails.value = [];
            toastStore.error({
                title: "Error",
                message,
            });
        }
        loading.value.dynamicLoading["dataCollectionFormFieldStructure"] = false;
    }

    async function generateFormFieldsList() {
        // if (!loading.value.dynamicLoading["dataCollectionGrid"])
        //     loading.value.dynamicLoading["dataCollectionGrid"] = true;
        const queryParams = {
            trialId: studyStore.studyInformation.trialId as number,
            environmentId: studyStore.studyInformation.environmentId as number,
            subjectId: dataCollectionStore.queryParamDetails.subjectId,
            siteId: dataCollectionStore.queryParamDetails.siteId,
            formId: dataCollectionStore.queryParamDetails.formId,
            publishedSubjectFormFieldParentId:
                dataCollectionStore.selectedPublishedSubjectFormFieldParentId,
            folderId: dataCollectionStore.queryParamDetails.folderId,
        };
        const { status, message, data } = await generateFormFieldsListAPI(queryParams);
        if (status === 200) {
            dataCollectionFormFieldDetailsList.value = deepClone(data);
        } else if (status !== 401) {
            dataCollectionFormFieldDetailsList.value = [];
            toastStore.error({
                title: "Error",
                message,
            });
        }
        await handleProcessFormGeneration();
        // loading.value.dynamicLoading["dataCollectionGrid"] = false;
    }

    // function getParentAndChildDetailId(rowIndex: number) {
    //     return {
    //         publishedSubjectFormFieldParentId:
    //             dataCollectionStore.selectedPublishedSubjectFormFieldParentId &&
    //             checkIfKeyExistsInObject(
    //                 dataCollectionStore.selectedPublishedSubjectFormFieldParentId,
    //                 publishedSubjectFormFieldDetails.value,
    //             ) &&
    //             returnNullIfIndexDoesNotExist(
    //                 rowIndex,
    //                 publishedSubjectFormFieldDetails.value[
    //                     dataCollectionStore.selectedPublishedSubjectFormFieldParentId
    //                 ],
    //             )
    //                 ? publishedSubjectFormFieldDetails.value[
    //                       dataCollectionStore.selectedPublishedSubjectFormFieldParentId
    //                   ][rowIndex].publishedSubjectFormFieldParentId
    //                 : null,
    //         publishedSubjectFormFieldChildDetailId:
    //             dataCollectionStore.selectedPublishedSubjectFormFieldParentId &&
    //             checkIfKeyExistsInObject(
    //                 dataCollectionStore.selectedPublishedSubjectFormFieldParentId,
    //                 publishedSubjectFormFieldDetails.value,
    //             ) &&
    //             returnNullIfIndexDoesNotExist(
    //                 rowIndex,
    //                 publishedSubjectFormFieldDetails.value[
    //                     dataCollectionStore.selectedPublishedSubjectFormFieldParentId
    //                 ],
    //             )
    //                 ? publishedSubjectFormFieldDetails.value[
    //                       dataCollectionStore.selectedPublishedSubjectFormFieldParentId
    //                   ][rowIndex].publishedSubjectFormFieldChildDetailId
    //                 : null,
    //     };
    // }

    async function processSaveAPIData(
        row: IDataCollectionFormDetails,
        result: IGenerateFormFieldsData[],
        publishedSubjectFormFieldChildDetailIdsToBeProcessed: number[] = [],
        groupId: number = -1,
    ) {
        if (row.publishedSubjectFormFieldChildDetailId)
            publishedSubjectFormFieldChildDetailIdsToBeProcessed.push(
                row.publishedSubjectFormFieldChildDetailId,
            );
        result.push({
            id: row.id,
            orderNumber: row.orderNumber,
            controlTypeId: 0,
            formId: dataCollectionStore.queryParamDetails.formId,
            trialId: studyStore.studyInformation.trialId,
            environmentId: studyStore.studyInformation.environmentId,
            siteId: dataCollectionStore.queryParamDetails.siteId,
            subjectId: dataCollectionStore.queryParamDetails.subjectId,
            folderId: dataCollectionStore.queryParamDetails.folderId,
            releaseVersionId: null,
            formName: row.formName,
            fieldVariableId: null,
            fieldRestrictionId: null,
            formFieldsId: null,
            fieldEditChecksId: null,
            variableId: null,
            controlType: row.controlType,
            fieldNum: row.fieldNum,
            oid: row.oid,
            name: row.name,
            isLogDataEntry: row.isLogDataEntry,
            isVisible: row.isVisible,
            helpText: row.helpText,
            requiresTranslation: false,
            doesNotParticipateSignature: row.doesNotParticipateSignature,
            promptClinicalSignificance: false,
            labAnalytics: null,
            defaultValue: null,
            sasLabel: null,
            sasFormat: null,
            indentLevel: row.indentLevel,
            label: null,
            header: null,
            fixedUnit: row.fixedUnit,
            validExtensions: row.validExtensions,
            isActive: row.isActive,
            location: null,
            fieldHelpText: row.fieldHelpText,
            canSetRecordDate: false,
            canSetDatapage: false,
            canSetInstanceDate: false,
            canSetSubjectDate: false,
            showPreviousVisitValues: false,
            // publishedSubjectFormFieldParentId:
            //     isAtleastOneFieldChangedFromPlannedToDataEntryInProgressInAForm.value
            //         ? publishedSubjectFormFieldParentId
            //         : row.publishedSubjectFormFieldParentId,
            // publishedSubjectFormFieldChildDetailId:
            //     isAtleastOneFieldChangedFromPlannedToDataEntryInProgressInAForm.value
            //         ? publishedSubjectFormFieldChildDetailId
            //         : row.publishedSubjectFormFieldChildDetailId,
            publishedSubjectFormFieldParentId: row.publishedSubjectFormFieldParentId,
            publishedSubjectFormFieldChildDetailId: row.publishedSubjectFormFieldChildDetailId,
            fieldId: row.id,
            fieldValue: row.modelValue ? String(row.modelValue) : null,
            progressStatus: row.progressStatus,
            isVerified: row.isVerified,
            isFrozen: row.isFrozen,
            isLocked: row.isLocked,
            fieldValueDetails: [...(await getAPIFieldValueDetails(row))],
            varOID: "",
            dictionaryId: 0,
            unitDictionaryId: 0,
            format: "",
            codingDictionaryId: 0,
            isDataDictionaryGlobal: false,
            isUnitDictionaryGlobal: false,
            autoQueryForRequiredDataEntry: false,
            autoQueryForNonConformantData: false,
            autoQueryForFutureDateTime: false,
            autoQueryForDataOutOfRangeLowValue: 0,
            autoQueryForDataOutOfRangeHighValue: 0,
            markNonConformantDataOutOfRangeLowValue: 0,
            markNonConformantDataOutOfRangeHighValue: 0,
            requiresVerification: false,
            oldValue: null,
            newValue: null,
            manualReviews: [],
            viewRestrictions: [],
            entryRestrictions: [],
            groupId: groupId !== -1 ? groupId : row.groupId,
            updatedBy: 0,
        });
    }

    async function getAPIData(
        doNotSaveLogFormEntry: TEditFormDetail = {},
        publishedSubjectFormFieldChildDetailIdsToBeProcessed: number[] = [],
        excludedGroupIds: number[] = [],
    ) {
        const result: TGenerateFormFieldsData = {};
        let loopResult: IGenerateFormFieldsData[] = [];
        for (const [dataCollectionGroupId, dataCollectionRow] of Object.entries(
            dataCollectionFormDetails.value,
        )) {
            if (excludedGroupIds.includes(Number(dataCollectionGroupId))) continue;
            for (const row of dataCollectionRow) {
                // const { publishedSubjectFormFieldParentId, publishedSubjectFormFieldChildDetailId } =
                //     getParentAndChildDetailId(rowIndex);
                // console.log(
                //     "publishedSubjectFormFieldParentId in getAPIData",
                //     publishedSubjectFormFieldParentId,
                // );
                // console.log(
                //     "publishedSubjectFormFieldChildDetailId in getAPIData",
                //     publishedSubjectFormFieldChildDetailId,
                // );
                if (
                    checkIfKeyExistsInObject(dataCollectionGroupId, doNotSaveLogFormEntry) &&
                    doNotSaveLogFormEntry[dataCollectionGroupId] &&
                    row.isLogDataEntry
                )
                    continue;
                if (!row.isHeading) {
                    await processSaveAPIData(
                        row,
                        loopResult,
                        publishedSubjectFormFieldChildDetailIdsToBeProcessed,
                        Number(dataCollectionGroupId),
                    );
                } else if (row.isHeading && getArrayLength(row.children) > 0) {
                    for (const childrenRow of row.children) {
                        await processSaveAPIData(
                            childrenRow,
                            loopResult,
                            publishedSubjectFormFieldChildDetailIdsToBeProcessed,
                            Number(dataCollectionGroupId),
                        );
                    }
                }
            }
            result[dataCollectionGroupId] = deepClone(loopResult);
            loopResult = [];
        }
        return result;
    }

    function resetDataCollectionModel(type: TDataCollectionResetType) {
        if (type === "reset") {
            const resettedModel: TDataCollectionFormDetails = {};
            for (const [dataCollectionRowIndex, dataCollectionRow] of Object.entries(
                dataCollectionDetails.value[dataCollectionStore.activeFormIndex].formDetailsRef,
            )) {
                const innerLoopRecord: IDataCollectionFormDetails[] = [];
                for (const row of dataCollectionRow) {
                    innerLoopRecord.push({
                        ...row,
                        progressStatus: row.isLogDataEntry ? "Planned" : row.progressStatus,
                    });
                }
                resettedModel[dataCollectionRowIndex] = deepClone(innerLoopRecord);
            }
            // const resettedModel = dataCollectionDetails.value[
            //     dataCollectionStore.activeFormIndex
            // ].formDetailsRef.map((row) => ({
            //     ...row,
            //     progressStatus: row.isLogDataEntry ? "Planned" : row.progressStatus,
            // }));
            dataCollectionFormDetailsRef.value = deepClone(resettedModel);
            dataCollectionFormDetails.value = deepClone(resettedModel);
        } else {
            dataCollectionFormDetails.value = {};
            dataCollectionFormDetailsRef.value = {};
            dataCollectionStore.clearDataCollectionData();
            logFormDetails.value = {};
            dataCollectionDetails.value = {};
            dataCollectionFormFieldStructureDetails.value = [];
            dataCollectionFormFieldDetailsList.value = [];
            publishedSubjectFormDetails.value = [];
            publishedSubjectFormFieldDetails.value = {};
        }
        currentLogFormEditIndex.value = -1;
        // currentLogFormGroupId.value = -1;
    }

    function processPagination(initial: boolean = false) {
        handleDefaultPaginationPageCount(paginationModel.value);
        handlePagination("page", initial ? 0 : 1, paginationModel.value, initial);
    }

    function setNewStatusInDataCollectionForm(
        nextProgressStatus: string,
        revertStatusResult: IFormFieldProgressStatusMetaData[],
        excludedGroupIds: number[] = [],
    ) {
        // for (const row of dataCollectionFormDetails.value) {
        //     row.progressStatus = nextProgressStatus;
        // }
        const result: TDataCollectionFormDetails = {};
        for (const [dataCollectionGroupId, dataCollectionRow] of Object.entries(
            dataCollectionFormDetails.value,
        )) {
            result[dataCollectionGroupId] = [];
            for (const row of dataCollectionRow) {
                let fieldProgressStatus = "";
                let childFieldProgressStatus = "";
                if (excludedGroupIds.includes(Number(dataCollectionGroupId))) {
                    result[dataCollectionGroupId].push({
                        ...row,
                        // progressStatus: row.isHeading ? row.progressStatus : fieldProgressStatus,
                    });
                } else {
                    if (row.isHeading && getArrayLength(row.children) > 0) {
                        outerloop: for (const childrenRow of row.children) {
                            for (const subRow of revertStatusResult) {
                                if (subRow.fieldIds.includes(childrenRow.id)) {
                                    childFieldProgressStatus = subRow.fieldProgressStatus;
                                    break outerloop;
                                }
                            }
                            if (!childFieldProgressStatus && !nextProgressStatus)
                                childFieldProgressStatus = String(childrenRow.progressStatus);
                            else if (!childFieldProgressStatus && nextProgressStatus)
                                childFieldProgressStatus = nextProgressStatus;
                        }
                    }
                    for (const subRow of revertStatusResult) {
                        if (subRow.fieldIds.includes(row.id)) {
                            fieldProgressStatus = subRow.fieldProgressStatus;
                            break;
                        }
                    }
                    if (!fieldProgressStatus && !nextProgressStatus)
                        fieldProgressStatus = String(row.progressStatus);
                    else if (!fieldProgressStatus && nextProgressStatus)
                        fieldProgressStatus = nextProgressStatus;

                    if (row.isHeading && getArrayLength(row.children) > 0) {
                        for (const childrenRow of row.children) {
                            childrenRow.progressStatus = childFieldProgressStatus;
                        }
                    }
                    result[dataCollectionGroupId].push({
                        ...row,
                        progressStatus: row.isHeading ? row.progressStatus : fieldProgressStatus,
                    });
                }
            }
        }
        return result;
    }

    async function processFormFieldEditCheck(
        publishedSubjectFormFieldChildDetailIdsToBeProcessed: number[],
    ) {
        await processFormFieldEditCheckAPI({
            id: 0,
            trialId: studyStore.studyInformation.trialId as number,
            environmentId: studyStore.studyInformation.environmentId as number,
            subjectId: dataCollectionStore.queryParamDetails.subjectId,
            siteId: dataCollectionStore.queryParamDetails.siteId,
            formId: dataCollectionStore.queryParamDetails.formId,
            folderId: dataCollectionStore.queryParamDetails.folderId,
            publishedSubjectFormFieldParentId:
                dataCollectionStore.selectedPublishedSubjectFormFieldParentId,
            publishedSubjectFormFieldChildDetailIds:
                publishedSubjectFormFieldChildDetailIdsToBeProcessed,
            isLogForm: dataCollectionStore.isLogForm,
        });
    }

    async function addFormEditChecks(
        publishedSubjectFormFieldChildDetailIdsToBeProcessed: number[],
    ) {
        const { status, data } = await addFormEditChecksAPI({
            id: 0,
            trialId: studyStore.studyInformation.trialId as number,
            environmentId: studyStore.studyInformation.environmentId as number,
            subjectId: dataCollectionStore.queryParamDetails.subjectId,
            siteId: dataCollectionStore.queryParamDetails.siteId,
            formId: dataCollectionStore.queryParamDetails.formId,
            folderId: dataCollectionStore.queryParamDetails.folderId,
            publishedSubjectFormFieldParentId:
                dataCollectionStore.selectedPublishedSubjectFormFieldParentId,
            publishedSubjectFormFieldChildDetailIds:
                publishedSubjectFormFieldChildDetailIdsToBeProcessed,
            isLogForm: dataCollectionStore.isLogForm,
        });
        if (status === 200) {
            if (data.checkResult) {
                dataCollectionStore.setDynamicFormsToBeAdded({
                    forms: data.forms,
                    trialVisits: data.trialVisits,
                    subjectId: dataCollectionStore.queryParamDetails.subjectId,
                });
                if (
                    getArrayLength(dataCollectionStore.dynamicFormsToBeAdded.trialVisits) > 0 ||
                    getArrayLength(dataCollectionStore.dynamicFormsToBeAdded.forms) > 0
                )
                    dataCollectionStore.dynamicFormsToBeAdded.isAddDynamicForms = true;
            }
        }
    }

    // function checkIfDerivationFieldAndIsEnabled(actions: IFormFieldDerivationActionData[]) {
    //     let isDerivation = false;
    //     let isEnabled = false;
    //     if (getArrayLength(actions) > 0) isDerivation = true;
    //     for (const action of actions) {
    //         if (action.id && action.isEnableField) {
    //             isEnabled = true;
    //             break;
    //         }
    //     }
    //     return {
    //         isDerivation,
    //         isEnabled,
    //     };
    // }

    // function setAssignedDerivationDetails(data: TFormFieldDerivationData) {
    //     const result: TFormFieldDerivationData<IFormFieldDerivationDetails> = {};
    //     for (const [fieldKey, derivationDetails] of Object.entries(data)) {
    //         const { isDerivation, isEnabled } = checkIfDerivationFieldAndIsEnabled(
    //             derivationDetails.actions,
    //         );
    //         result[fieldKey] = {
    //             steps: deepClone(derivationDetails.steps),
    //             actions: deepClone(derivationDetails.actions),
    //             // isDerivation: !!(
    //             //     checkIfKeyExistsInObject("id", derivationDetails.actions) &&
    //             //     derivationDetails.actions.id
    //             // ),
    //             isDerivation,
    //             isEnabled,
    //         };
    //     }
    //     return result;
    // }

    // function updateDerivedFieldValue(params: {
    //     fieldId: string;
    //     dataCollectionRow: IDataCollectionFormDetails;
    //     rowValue: IFormFieldDerivationDetails;
    //     dataCollectionRowIndex: number;
    //     formsListRef: IDataCollectionFormDetails[];
    // }) {
    //     const { fieldId, dataCollectionRow, rowValue, dataCollectionRowIndex, formsListRef } =
    //         params;
    //     let exitOutOfLoop = false;
    //     if (isEqual(fieldId, dataCollectionRow.id, "number")) {
    //         const isDisabledDerivationField = rowValue.isDerivation && !rowValue.isEnabled;
    //         dataCollectionRow.disabled = isDisabledDerivationField || dataCollectionRow.disabled;
    //         if (isDisabledDerivationField) dataCollectionRow.placeholder = "Derived";
    //         if (checkIfIndexExistInArray(dataCollectionRowIndex, formsListRef))
    //             formsListRef[dataCollectionRowIndex].disabled =
    //                 isDisabledDerivationField || formsListRef[dataCollectionRowIndex].disabled;
    //         if (isDisabledDerivationField)
    //             formsListRef[dataCollectionRowIndex].placeholder = "Derived";
    //         exitOutOfLoop = true;
    //     }
    //     return exitOutOfLoop;
    // }

    // function isDerivedField() {
    //     if (getArrayLength(Object.keys(assignedFieldDerivations.value)) > 0) {
    //         const formsList = deepClone(
    //             dataCollectionFormDetails.value,
    //         ) as TDataCollectionFormDetails;
    //         const formsListRef = deepClone(
    //             dataCollectionFormDetailsRef.value,
    //         ) as TDataCollectionFormDetails;

    //         for (const [rowKey, rowValue] of Object.entries(assignedFieldDerivations.value)) {
    //             const [, fieldId] = rowKey.split("_");
    //             for (const [
    //                 dataCollectionFormFieldGroupId,
    //                 dataCollectionFormFieldRow,
    //             ] of Object.entries(formsList)) {
    //                 for (const [
    //                     dataCollectionRowIndex,
    //                     dataCollectionRow,
    //                 ] of dataCollectionFormFieldRow.entries()) {
    //                     if (
    //                         dataCollectionRow.isHeading &&
    //                         getArrayLength(dataCollectionRow.children) > 0
    //                     ) {
    //                         for (const [
    //                             childrenRowIndex,
    //                             childrenRow,
    //                         ] of dataCollectionRow.children.entries()) {
    //                             const result = updateDerivedFieldValue({
    //                                 dataCollectionRow: childrenRow,
    //                                 dataCollectionRowIndex: childrenRowIndex,
    //                                 fieldId,
    //                                 formsListRef:
    //                                     checkIfKeyExistsInObject(
    //                                         dataCollectionFormFieldGroupId,
    //                                         formsListRef,
    //                                     ) &&
    //                                     checkIfKeyExistsInObject(
    //                                         dataCollectionRowIndex,
    //                                         formsListRef[dataCollectionFormFieldGroupId],
    //                                     )
    //                                         ? formsListRef[dataCollectionFormFieldGroupId][
    //                                               dataCollectionRowIndex
    //                                           ].children
    //                                         : [],
    //                                 rowValue,
    //                             });
    //                             if (result) break;
    //                         }
    //                     } else if (!dataCollectionRow.isHeading) {
    //                         const result = updateDerivedFieldValue({
    //                             dataCollectionRow,
    //                             dataCollectionRowIndex,
    //                             fieldId,
    //                             formsListRef: checkIfKeyExistsInObject(
    //                                 dataCollectionFormFieldGroupId,
    //                                 formsListRef,
    //                             )
    //                                 ? formsListRef[dataCollectionFormFieldGroupId]
    //                                 : [],
    //                             rowValue,
    //                         });
    //                         if (result) break;
    //                     }
    //                 }
    //             }
    //         }

    //         dataCollectionFormDetails.value = deepClone(formsList);
    //         dataCollectionFormDetailsRef.value = deepClone(formsListRef);
    //         if (
    //             checkIfKeyExistsInObject(
    //                 dataCollectionStore.activeFormIndex,
    //                 dataCollectionDetails.value,
    //             )
    //         ) {
    //             dataCollectionDetails.value[dataCollectionStore.activeFormIndex].formDetails =
    //                 deepClone(formsList);
    //             dataCollectionDetails.value[dataCollectionStore.activeFormIndex].formDetailsRef =
    //                 deepClone(formsListRef);
    //         }
    //     }
    // }

    function processFormFieldDerivationOnChange() {
        if (isUserAllowedToEnterData.value) {
            const updatedResult = processFormFieldDerivation({
                assignedFieldDerivations: deepClone(assignedFieldDerivations.value),
                formsList: dataCollectionFormDetails.value,
                runOnceFieldIds: triggerDerivationOnlyOnceIds.value,
                checkForVisitId: true,
            });
            if (updatedResult) {
                dataCollectionFormDetails.value = deepClone(updatedResult);
                // const instance = getCurrentInstance();
                // instance?.proxy?.$forceUpdate();
                // Promise.all([nextTick()]).then(() => {
                //     dataCollectionFormDetails.value = deepClone(updatedResult);
                // });
            }
            // processFormFieldDerivation({
            //     assignedFieldDerivations: assignedFieldDerivations.value,
            //     formsList: dataCollectionFormDetails.value,
            //     runOnceFieldIds: triggerDerivationOnlyOnceIds.value,
            // });
        }
    }

    function processIsDerivedField() {
        const derivedResult = isDerivedField(
            deepClone(assignedFieldDerivations.value),
            dataCollectionFormDetails.value,
            dataCollectionFormDetailsRef.value,
            true,
        );
        if (derivedResult) {
            dataCollectionFormDetails.value = deepClone(derivedResult.formsList);
            dataCollectionFormDetailsRef.value = deepClone(derivedResult.formsListRef);
            if (
                checkIfKeyExistsInObject(
                    dataCollectionStore.activeFormIndex,
                    dataCollectionDetails.value,
                )
            ) {
                dataCollectionDetails.value[dataCollectionStore.activeFormIndex].formDetails =
                    deepClone(derivedResult.formsList);
                dataCollectionDetails.value[dataCollectionStore.activeFormIndex].formDetailsRef =
                    deepClone(derivedResult.formsListRef);
            }
        }
    }

    async function assignedDerivations() {
        const { status, data } = await assignedDerivationsAPI({
            id: 0,
            trialId: studyStore.studyInformation.trialId as number,
            environmentId: studyStore.studyInformation.environmentId as number,
            subjectId: dataCollectionStore.queryParamDetails.subjectId,
            siteId: dataCollectionStore.queryParamDetails.siteId,
            formId: dataCollectionStore.queryParamDetails.formId,
            folderId: dataCollectionStore.queryParamDetails.folderId,
            publishedSubjectFormFieldParentId:
                dataCollectionStore.selectedPublishedSubjectFormFieldParentId,
        });
        if (status === 200) {
            assignedFieldDerivations.value = deepClone(setAssignedDerivationDetails(data));
            processIsDerivedField();
            processFormFieldDerivationOnChange();
        } else {
            assignedFieldDerivations.value = {};
        }
    }

    async function checkForInitialFormFieldVisibility() {
        const result = await processFormFieldVisibiltyEditChecks({
            assignedFieldEditChecks: assignedFormFieldVisibiltyEditChecks.value,
            formsList: dataCollectionFormDetails.value,
            checkForVisitId: true,
        });
        // const modifiedDataCollectionFormDetails: TDataCollectionFormDetails = {};
        // const modifiedDataCollectionFormDetailsRef: TDataCollectionFormDetails = {};
        // // eslint-disable-next-line prefer-const
        // for (let [dataCollectionGroupId, dataCollectionRow] of Object.entries(
        //     dataCollectionFormDetails.value,
        // )) {
        //     const dataCollectionRowRef = checkIfKeyExistsInObject(
        //         dataCollectionGroupId,
        //         dataCollectionFormDetailsRef.value,
        //     )
        //         ? dataCollectionFormDetailsRef.value[dataCollectionGroupId]
        //         : [];
        //     const { formsList, formsListRef, isValueChanged } =
        //         setFormFieldVisibiltyBasedOnVisbilityEditChecks(
        //             dataCollectionRow,
        //             dataCollectionRowRef,
        //             result,
        //         );
        //     if (isValueChanged) {
        //         modifiedDataCollectionFormDetails[dataCollectionGroupId] = deepClone(formsList);
        //         modifiedDataCollectionFormDetailsRef[dataCollectionGroupId] =
        //             deepClone(formsListRef);
        //         // dataCollectionRow = deepClone(formsList);
        //         // dataCollectionRowRef = deepClone(formsListRef);
        //     }
        // }
        // if (getArrayLength(Object.keys(modifiedDataCollectionFormDetails)) > 0) {
        //     for (const [dataCollectionGroupId, dataCollectionRow] of Object.entries(
        //         dataCollectionFormDetails.value,
        //     )) {
        //         if (
        //             !checkIfKeyExistsInObject(
        //                 dataCollectionGroupId,
        //                 modifiedDataCollectionFormDetails,
        //             )
        //         )
        //             modifiedDataCollectionFormDetails[dataCollectionGroupId] =
        //                 deepClone(dataCollectionRow);
        //     }
        //     for (const [dataCollectionRefGroupId, dataCollectionRowRef] of Object.entries(
        //         dataCollectionFormDetailsRef.value,
        //     )) {
        //         if (
        //             !checkIfKeyExistsInObject(
        //                 dataCollectionRefGroupId,
        //                 modifiedDataCollectionFormDetailsRef,
        //             )
        //         )
        //             modifiedDataCollectionFormDetailsRef[dataCollectionRefGroupId] =
        //                 deepClone(dataCollectionRowRef);
        //     }
        //     dataCollectionFormDetails.value = deepClone(modifiedDataCollectionFormDetails);
        //     dataCollectionFormDetailsRef.value = deepClone(modifiedDataCollectionFormDetailsRef);
        // }
        for (const dataCollectionGroupId of Object.keys(dataCollectionFormDetails.value)) {
            const { formsList, formsListRef, isValueChanged } =
                setFormFieldVisibiltyBasedOnVisbilityEditChecks(
                    dataCollectionFormDetails.value[dataCollectionGroupId],
                    dataCollectionFormDetailsRef.value[dataCollectionGroupId],
                    result,
                );
            if (isValueChanged) {
                dataCollectionFormDetails.value[dataCollectionGroupId] = deepClone(formsList);
                dataCollectionFormDetailsRef.value[dataCollectionGroupId] = deepClone(formsListRef);
            }
        }
    }

    async function assignedVisibiltyEditChecks() {
        const { status, data } = await assignedVisibilityEditChecksAPI({
            id: 0,
            trialId: studyStore.studyInformation.trialId as number,
            environmentId: studyStore.studyInformation.environmentId as number,
            subjectId: dataCollectionStore.queryParamDetails.subjectId,
            siteId: dataCollectionStore.queryParamDetails.siteId,
            formId: dataCollectionStore.queryParamDetails.formId,
            folderId: dataCollectionStore.queryParamDetails.folderId,
            publishedSubjectFormFieldParentId:
                dataCollectionStore.selectedPublishedSubjectFormFieldParentId,
            // trialId: 6,
            // environmentId: 8,
            // subjectId: 196,
            // siteId: 6,
            // formId: 1099,
            // folderId: 809,
            // publishedSubjectFormFieldParentId: 223,
        });
        if (status === 200) {
            assignedFormFieldVisibiltyEditChecks.value = deepClone(
                setAssignedFormFieldVisibiltyEditCheckDetails(data),
            );
            await checkForInitialFormFieldVisibility();
        } else {
            assignedFormFieldVisibiltyEditChecks.value = {};
        }
    }

    async function checkForInitialFormFieldDisable() {
        const result = await processFormFieldDisableEditChecks({
            assignedFieldEditChecks: assignedFormFieldDisableEditChecks.value,
            formsList: dataCollectionFormDetails.value,
            checkForVisitId: true,
        });
        // const modifiedDataCollectionFormDetails: TDataCollectionFormDetails = {};
        // const modifiedDataCollectionFormDetailsRef: TDataCollectionFormDetails = {};
        // // eslint-disable-next-line prefer-const
        // for (let [dataCollectionGroupId, dataCollectionRow] of Object.entries(
        //     dataCollectionFormDetails.value,
        // )) {
        //     const dataCollectionRowRef = checkIfKeyExistsInObject(
        //         dataCollectionGroupId,
        //         dataCollectionFormDetailsRef.value,
        //     )
        //         ? dataCollectionFormDetailsRef.value[dataCollectionGroupId]
        //         : [];
        //     const { formsList, formsListRef, isValueChanged } =
        //         setFormFieldDisableBasedOnDisableEditChecks(
        //             dataCollectionRow,
        //             dataCollectionRowRef,
        //             result,
        //         );
        //     if (isValueChanged) {
        //         // modifiedDataCollectionFormDetails[dataCollectionGroupId] = deepClone(formsList);
        //         // modifiedDataCollectionFormDetailsRef[dataCollectionGroupId] =
        //         //     deepClone(formsListRef);
        //         // dataCollectionRow = deepClone(formsList);
        //         // dataCollectionRowRef = deepClone(formsListRef);
        //     }
        // }
        // if (getArrayLength(Object.keys(modifiedDataCollectionFormDetails)) > 0) {
        //     dataCollectionFormDetails.value = deepClone(modifiedDataCollectionFormDetails);
        //     dataCollectionFormDetailsRef.value = deepClone(modifiedDataCollectionFormDetailsRef);
        // }
        for (const dataCollectionGroupId of Object.keys(dataCollectionFormDetails.value)) {
            const { formsList, formsListRef, isValueChanged } =
                setFormFieldDisableBasedOnDisableEditChecks(
                    dataCollectionFormDetails.value[dataCollectionGroupId],
                    dataCollectionFormDetailsRef.value[dataCollectionGroupId],
                    result,
                );
            if (isValueChanged) {
                dataCollectionFormDetails.value[dataCollectionGroupId] = deepClone(formsList);
                dataCollectionFormDetailsRef.value[dataCollectionGroupId] = deepClone(formsListRef);
            }
        }
    }

    async function assignedDisableFieldEditChecks() {
        const { status, data } = await assignedDisableFieldEditChecksAPI({
            id: 0,
            trialId: studyStore.studyInformation.trialId as number,
            environmentId: studyStore.studyInformation.environmentId as number,
            subjectId: dataCollectionStore.queryParamDetails.subjectId,
            siteId: dataCollectionStore.queryParamDetails.siteId,
            formId: dataCollectionStore.queryParamDetails.formId,
            folderId: dataCollectionStore.queryParamDetails.folderId,
            publishedSubjectFormFieldParentId:
                dataCollectionStore.selectedPublishedSubjectFormFieldParentId,
            // trialId: 6,
            // environmentId: 8,
            // subjectId: 196,
            // siteId: 6,
            // formId: 1099,
            // folderId: 809,
            // publishedSubjectFormFieldParentId: 223,
        });
        if (status === 200) {
            assignedFormFieldDisableEditChecks.value = deepClone(
                setAssignedFormFieldDisableEditCheckDetails(data),
            );
            checkForInitialFormFieldDisable();
        } else {
            assignedFormFieldDisableEditChecks.value = {};
        }
    }

    async function assignedNonLogDataValueEditChecks() {
        const { status, data } = await assignedNonLogDataValueEditChecksAPI({
            id: 0,
            trialId: studyStore.studyInformation.trialId as number,
            environmentId: studyStore.studyInformation.environmentId as number,
            subjectId: dataCollectionStore.queryParamDetails.subjectId,
            siteId: dataCollectionStore.queryParamDetails.siteId,
            formId: dataCollectionStore.queryParamDetails.formId,
            folderId: dataCollectionStore.queryParamDetails.folderId,
            publishedSubjectFormFieldParentId:
                dataCollectionStore.selectedPublishedSubjectFormFieldParentId,
        });
        if (status === 200) {
            assignedFormFieldNonLogDataValueEditChecks.value = deepClone(
                setAssignedFormFieldNonLogDataEditCheckDetails(data),
            );
            logDataEntryCheckValueResult.value = getLogDataEntryHideCheckValue(
                dataCollectionFormDetails.value,
                assignedFormFieldNonLogDataValueEditChecks.value,
            );
        } else {
            assignedFormFieldNonLogDataValueEditChecks.value = {};
            logDataEntryCheckValueResult.value = {};
        }
    }

    function getRecordPositionByFormType() {
        let result = 0;
        if (dataCollectionStore.isLogForm) {
            result = currentLogFormEditIndex.value !== -1 ? currentLogFormEditIndex.value : 0;
        } else {
            for (const [index, row] of publishedSubjectFormDetails.value.entries()) {
                if (row.isActive) {
                    result = index;
                    break;
                }
            }
        }
        return result;
    }

    async function processMyTasks(typeIds: number[], isCallAPI: boolean = true) {
        if (isCallAPI)
            await processMyTaskAPI({
                id: 0,
                trialId: studyStore.studyInformation.trialId as number,
                environmentId: studyStore.studyInformation.environmentId as number,
                subjectId: dataCollectionStore.queryParamDetails.subjectId,
                subjectName: "",
                siteId: dataCollectionStore.queryParamDetails.siteId,
                siteName: "",
                formId: dataCollectionStore.queryParamDetails.formId,
                formName: "",
                folderId: dataCollectionStore.queryParamDetails.folderId,
                folderName: "",
                publishedSubjectFormFieldParentId:
                    dataCollectionStore.selectedPublishedSubjectFormFieldParentId,
                typeIds,
                typeId: 0,
                typeName: "",
                statusId: 1,
                statusName: "",
                description: "",
                recordPosition: getRecordPositionByFormType(),
                updatedBy: 0,
            });
    }

    // TODO: if required need to add a seperate function to copy new FieldValueDetails to existing dataCollectionVariable for FileUpload variable to hold it
    async function saveFormFields(
        isSameStatus: boolean,
        nextProgressStatus: string,
        revertStatusResult: IFormFieldProgressStatusMetaData[],
        doNotSaveLogFormEntry: TEditFormDetail = {},
        excludedGroupIds: number[] = [],
    ) {
        let result = false;
        const publishedSubjectFormFieldChildDetailIdsToBeProcessed: number[] = [];
        loading.value.dynamicLoading["dataCollectionFormSubmit"] = true;
        // console.log(
        //     "saveFormField requestData in handleLogFormSubmit",
        //     await getAPIData(
        //         doNotSaveLogFormEntry,
        //         publishedSubjectFormFieldChildDetailIdsToBeProcessed,
        //         excludedGroupIds,
        //     ),
        // );
        // TODO: uncomment the line
        const { status, message } = await saveFormFieldsAPI({
            groupedFormFields: await getAPIData(
                doNotSaveLogFormEntry,
                publishedSubjectFormFieldChildDetailIdsToBeProcessed,
                excludedGroupIds,
            ),
        });
        if (status === 200) {
            toastStore.success({
                title: "Success",
                message,
            });
            let updatedResult = deepClone(dataCollectionFormDetails.value);
            if (isSameStatus && getStringLength(nextProgressStatus) > 0) {
                updatedResult = setNewStatusInDataCollectionForm(
                    nextProgressStatus,
                    [],
                    excludedGroupIds,
                );
            } else if (getArrayLength(revertStatusResult) > 0) {
                updatedResult = setNewStatusInDataCollectionForm(
                    "",
                    revertStatusResult,
                    excludedGroupIds,
                );
            }
            dataCollectionFormDetailsRef.value = deepClone(updatedResult);
            dataCollectionFormDetails.value = deepClone(updatedResult);
            if (
                checkIfKeyExistsInObject(
                    dataCollectionStore.activeFormIndex,
                    dataCollectionDetails.value,
                )
            ) {
                dataCollectionDetails.value[dataCollectionStore.activeFormIndex].formDetails =
                    deepClone(updatedResult);
                dataCollectionDetails.value[dataCollectionStore.activeFormIndex].formDetailsRef =
                    deepClone(updatedResult);
            }
            isFormEntered.value.formSaved = true;
            result = true;
            Promise.all([
                processFormFieldEditCheck(publishedSubjectFormFieldChildDetailIdsToBeProcessed),
            ]).then(() => {
                Promise.all([
                    addFormEditChecks(publishedSubjectFormFieldChildDetailIdsToBeProcessed),
                    processMyTasks([3, 4, 5]),
                ]);
            });
        } else if (status !== 401) {
            toastStore.error({
                title: "Error",
                message,
            });
            isFormEntered.value.formSaved = false;
            result = false;
        }
        // TODO: uncomment the line
        loading.value.dynamicLoading["dataCollectionFormSubmit"] = false;
        return result;
    }

    async function changeFormFieldProgressStatus(
        fieldIds: number[],
        publishedSubjectFormFieldChildDetailIds: number[],
        newFormProgressStatus: string,
        newFieldProgressStatus: string,
    ) {
        let result = false;
        const { status, message } = await changeFormFieldProgressStatusApi({
            id: 0,
            subjectId: dataCollectionStore.queryParamDetails.subjectId,
            trialId: Number(studyStore.studyInformation.trialId),
            environmentId: Number(studyStore.studyInformation.environmentId),
            siteId: dataCollectionStore.queryParamDetails.siteId,
            formId: dataCollectionStore.queryParamDetails.formId,
            folderId: dataCollectionStore.queryParamDetails.folderId,
            fieldId: 0,
            fieldIds,
            publishedSubjectFormFieldChildDetailIds,
            publishedSubjectFormFieldParentId:
                dataCollectionStore.selectedPublishedSubjectFormFieldParentId,
            formProgressStatus: newFormProgressStatus,
            fieldProgressStatus: newFieldProgressStatus,
            label: "",
            fieldValue: "",
            updatedBy: 0,
        });
        if (status === 200) {
            result = true;
            isFormEntered.value.progressStatus = true;
        } else if (status !== 401) {
            result = false;
            toastStore.error({
                title: "Error",
                message,
            });
            isFormEntered.value.progressStatus = false;
        }
        return result;
    }

    async function formFieldCheckActionAudit(updatedDetails: IFormFieldCheckActionAuditData[]) {
        // const { status, message } = await formFieldCheckActionAuditAPI({
        //     publishedSubjectFormFieldChildDetailIds,
        //     type,
        //     value,
        // });
        const { status, message } = await formFieldCheckActionAuditAPI(updatedDetails);
        if (status !== 401 && status !== 200) {
            toastStore.error({
                title: "Error",
                message,
            });
        }
        // if (getArrayLength(formFieldCheckActionAuditDetails.value) > 0) {
        //     const { status, message } = await formFieldCheckActionAuditAPI(
        //         formFieldCheckActionAuditDetails.value,
        //     );
        //     if (status !== 401 && status !== 200) {
        //         toastStore.error({
        //             title: "Error",
        //             message,
        //         });
        //     }
        //     if (status === 200) formFieldCheckActionAuditDetails.value = [];
        // }
    }

    async function formFieldCheckActionStatus(updatedDetails: IFormFieldCheckActionAuditData[]) {
        const { status, message } = await formFieldCheckActionStatusAPI(updatedDetails);
        if (status !== 401 && status !== 200) {
            toastStore.error({
                title: "Error",
                message,
            });
        }
    }

    async function processFormFieldCheckActionAuditAndStatus(
        updatedDetails: IFormFieldCheckActionAuditData[],
    ) {
        await Promise.all([
            formFieldCheckActionAudit(updatedDetails),
            formFieldCheckActionStatus(updatedDetails),
        ]);
    }

    // function handleFormFieldCheckActionClick(
    //     publishedSubjectFormFieldChildDetailId: number,
    //     type: TFormFieldCheckActionType,
    //     value: boolean,
    // ) {
    //     formFieldCheckActionAuditDetails.value.push({
    //         publishedSubjectFormFieldChildDetailId,
    //         type,
    //         value,
    //     });
    // }

    function checkForStatusRevert(result: IFieldStatusMetaData[]) {
        const uniqueResult: string[] = [];
        // const updateProgressStatusFields: IFormFieldProgressStatusMetaData = {
        //     fieldIds: [],
        //     fieldProgressStatus: "",
        //     formProgressStatus: ""
        // };
        const updateProgressStatusFields: IFormFieldProgressStatusMetaData[] = [];
        for (const row of result) {
            uniqueResult.push(row.progressStatus);
        }
        const verifyResults: IFormFieldProgressStatusMetaData = {
            ...defaultFormFieldProgressStatus(),
            fieldProgressStatus: "Verify Completed",
        };
        for (const row of result) {
            if (
                row.progressStatus === "Verify In Progress" &&
                row.isVerified &&
                uniqueResult.includes("Verify Completed")
            )
                verifyResults.fieldIds.push(row.fieldId);
            verifyResults.publishedSubjectFormFieldChildDetailIds.push(
                row.publishedSubjectFormFieldChildDetailId,
            );
        }
        const uniqueStatuses = [...new Set(result.map((row) => row.progressStatus))];
        const {
            // planned,
            // dataEntryInProgress,
            // dataEntryCompleted,
            verifyInProgress,
            verifyCompleted,
            // reviewInProgress,
            // reviewCompleted,
            // frozen,
            // locked,
        } = getFormFieldStatusCountDetails(uniqueStatuses);
        let verifyFormProgressStatus = "";
        if (
            verifyCompleted > 0 &&
            verifyInProgress > 0 &&
            verifyInProgress === getArrayLength(verifyResults.fieldIds)
        )
            verifyFormProgressStatus = "Verify Completed";
        // else if (statusCount.verifyCompleted > 0 && statusCount.verifyInProgress > 0 && statusCount.verifyInProgress === getArrayLength(verifyResults.fieldIds)) verifyFormProgressStatus = "Verify Completed";
        updateProgressStatusFields.push({
            ...verifyResults,
            formProgressStatus: verifyFormProgressStatus,
        });
        return updateProgressStatusFields;
    }

    function fieldStatuesList() {
        const result: IFieldStatusMetaData[] = [];
        for (const [, dataCollectionRow] of Object.entries(dataCollectionFormDetails.value)) {
            for (const row of dataCollectionRow) {
                // if (!nonEnteredLogFormFields.includes(row.id))
                if (row.isHeading && getArrayLength(row.children) > 0) {
                    for (const childrenRow of row.children) {
                        if (!showComponent(childrenRow)) continue;
                        result.push({
                            fieldId: childrenRow.id,
                            publishedSubjectFormFieldChildDetailId:
                                childrenRow.publishedSubjectFormFieldChildDetailId as number,
                            isFrozen: childrenRow.isFrozen,
                            isLocked: childrenRow.isLocked,
                            isVerified: childrenRow.isVerified,
                            progressStatus: childrenRow.progressStatus || "Planned",
                        });
                    }
                } else {
                    if (!showComponent(row)) continue;
                    result.push({
                        fieldId: row.id,
                        publishedSubjectFormFieldChildDetailId:
                            row.publishedSubjectFormFieldChildDetailId as number,
                        isFrozen: row.isFrozen,
                        isLocked: row.isLocked,
                        isVerified: row.isVerified,
                        progressStatus: row.progressStatus || "Planned",
                    });
                }
            }
        }
        const isSameStatus =
            getArrayLength(result) > 0
                ? // ? result.every((status) => status.progressStatus === result[0].progressStatus)
                  result.every(
                      (status) =>
                          (["Data Entry Inprogress", "Data Entry Completed"].includes(
                              result[0].progressStatus,
                          ) &&
                              status.progressStatus === result[0].progressStatus) ||
                          (result[0].progressStatus === "Verify In Progress" &&
                              status.isVerified &&
                              status.progressStatus === result[0].progressStatus) ||
                          (result[0].progressStatus === "Frozen" &&
                              status.isFrozen &&
                              status.progressStatus === result[0].progressStatus) ||
                          (result[0].progressStatus === "Locked" &&
                              status.isLocked &&
                              status.progressStatus === result[0].progressStatus),
                  )
                : false;

        return {
            isSameStatus,
            revertStatusResult: checkForStatusRevert(result),
            progressStatus:
                getArrayLength(result) > 0 && isSameStatus ? result[0].progressStatus : "",
        };
    }

    function pushFieldAndChildDetailIdsForSameProgressStatus(
        row: IDataCollectionFormDetails,
        fieldIds: number[],
        publishedSubjectFormFieldChildDetailIds: number[],
    ) {
        if (!fieldIds.includes(row.id)) fieldIds.push(row.id);
        const publishedSubjectFormFieldChildDetailId =
            row.publishedSubjectFormFieldChildDetailId as number;
        if (
            !publishedSubjectFormFieldChildDetailIds.includes(
                publishedSubjectFormFieldChildDetailId,
            )
        )
            publishedSubjectFormFieldChildDetailIds.push(publishedSubjectFormFieldChildDetailId);
    }

    async function triggerFormFieldProgressStatusIfAllAreSame(
        isSameStatus: boolean,
        nextProgressStatus: string,
        excludedGroupIds: number[] = [],
    ) {
        const fieldIds: number[] = [];
        const publishedSubjectFormFieldChildDetailIds: number[] = [];
        for (const [dataCollectionGroupId, dataCollectionRow] of Object.entries(
            dataCollectionFormDetails.value,
        )) {
            if (excludedGroupIds.includes(Number(dataCollectionGroupId))) continue;
            for (const row of dataCollectionRow) {
                if (row.isHeading && getArrayLength(row.children) > 0) {
                    for (const childrenRow of row.children) {
                        pushFieldAndChildDetailIdsForSameProgressStatus(
                            childrenRow,
                            fieldIds,
                            publishedSubjectFormFieldChildDetailIds,
                        );
                    }
                } else if (!row.isHeading) {
                    pushFieldAndChildDetailIdsForSameProgressStatus(
                        row,
                        fieldIds,
                        publishedSubjectFormFieldChildDetailIds,
                    );
                }
            }
        }
        if (isSameStatus && getStringLength(nextProgressStatus) > 0) {
            await changeFormFieldProgressStatus(
                fieldIds,
                publishedSubjectFormFieldChildDetailIds,
                nextProgressStatus,
                nextProgressStatus,
            );
        }
    }

    async function changeSubjectToVisitInProgress(isFormChangedAfterSign: boolean = false) {
        if (dataCollectionStore.subjectStatus === "Screening")
            await changeSubjectStatus("Visits in progress");
        else if (
            isFormChangedAfterSign &&
            (dataCollectionStore.areAllFormsFilledForSelectedSubject ||
                dataCollectionStore.subjectStatus === "All visits completed")
        )
            await changeSubjectStatus("Visits in progress");
    }

    async function processUnsavedProgressStatusFieldIds(
        unsavedProgressStatusFieldIds: IDataCollectionUnsavedProgressStatusDetails[],
        formStatus: string,
    ) {
        if (getArrayLength(unsavedProgressStatusFieldIds) > 0) {
            const dataEntryInProgressFieldIds: number[] = [];
            const plannedFieldIds: number[] = [];
            for (const row of unsavedProgressStatusFieldIds) {
                if (
                    !dataEntryInProgressFieldIds.includes(row.fieldId) &&
                    row.progressStatus === "Data Entry Inprogress"
                )
                    dataEntryInProgressFieldIds.push(row.fieldId);
                else if (!plannedFieldIds.includes(row.fieldId) && row.progressStatus === "Planned")
                    plannedFieldIds.push(row.fieldId);
            }
            // const fieldStatus =
            //     formStatus === "Data Entry Completed"
            //         ? "Data Entry Completed"
            //         : "Data Entry Inprogress";
            // const fieldStatus =
            //     formStatus === "Data Entry Completed"
            //         ? "Data Entry Completed"
            //         : "Data Entry Inprogress";
            let fieldStatus = "";
            if (
                getArrayLength(unsavedProgressStatusFieldIds) ===
                    getArrayLength(dataEntryInProgressFieldIds) &&
                formStatus === "Data Entry Completed"
            )
                fieldStatus = "Data Entry Completed";
            else fieldStatus = "Data Entry Inprogress";
            // TODO: uncomment the line
            if (
                getArrayLength(plannedFieldIds) > 0 &&
                getArrayLength(dataEntryInProgressFieldIds) > 0
            ) {
                await Promise.all([
                    changeFormFieldProgressStatus(plannedFieldIds, [], fieldStatus, "Planned"),
                    changeFormFieldProgressStatus(
                        dataEntryInProgressFieldIds,
                        [],
                        fieldStatus,
                        fieldStatus,
                    ),
                ]);
            } else if (getArrayLength(plannedFieldIds) > 0) {
                await changeFormFieldProgressStatus(plannedFieldIds, [], fieldStatus, "Planned");
            } else if (getArrayLength(dataEntryInProgressFieldIds) > 0) {
                await changeFormFieldProgressStatus(
                    dataEntryInProgressFieldIds,
                    [],
                    fieldStatus,
                    fieldStatus,
                );
            }
            // TODO: uncomment the line
            // await changeFormFieldProgressStatus(fieldIds, [], fieldStatus, fieldStatus);
            await publishedSubjectFormFieldDetail(); // TODO: uncomment the line
            const resultRef = deepClone(
                dataCollectionFormDetails.value,
            ) as TDataCollectionFormDetails;
            const finalResult: TDataCollectionFormDetails = {};
            const combinedFieldIds = [...plannedFieldIds, ...dataEntryInProgressFieldIds];
            for (const [dataCollectionGroupId, dataCollectionRow] of Object.entries(resultRef)) {
                for (const row of dataCollectionRow) {
                    // if (fieldIds.includes(row.id)) {
                    if (row.isHeading && getArrayLength(row.children) > 0) {
                        for (const childrenRow of row.children) {
                            if (combinedFieldIds.includes(childrenRow.id)) {
                                childrenRow.publishedSubjectFormFieldChildDetailId =
                                    getPublishedSubjectFormFieldChildDetailId(childrenRow);
                                childrenRow.progressStatus = plannedFieldIds.includes(
                                    childrenRow.id,
                                )
                                    ? "Planned"
                                    : fieldStatus;
                            }
                        }
                    } else if (!row.isHeading) {
                        if (combinedFieldIds.includes(row.id)) {
                            row.publishedSubjectFormFieldChildDetailId =
                                getPublishedSubjectFormFieldChildDetailId(row);
                            row.progressStatus = plannedFieldIds.includes(row.id)
                                ? "Planned"
                                : fieldStatus;
                        }
                    }
                }
                finalResult[dataCollectionGroupId] = deepClone(dataCollectionRow);
            }
            dataCollectionFormDetailsRef.value = deepClone(finalResult);
            dataCollectionFormDetails.value = deepClone(finalResult);
            // const updatedResult = setNewStatusInDataCollectionForm("", [
            //         {
            //             fieldIds,
            //             publishedSubjectFormFieldChildDetailIds: [],
            //             fieldProgressStatus: fieldStatus,
            //             formProgressStatus: "",
            //         },
            //     ]);
            //     dataCollectionFormDetailsRef.value = deepClone(updatedResult);
            //     dataCollectionFormDetails.value = deepClone(updatedResult);
        }
    }

    function getFirstFieldProgressStatus() {
        let result = "";
        for (const dataCollectionRow of Object.values(dataCollectionFormDetails.value)) {
            result = dataCollectionRow[0].progressStatus as string;
        }
        return result;
    }

    async function handleFormFieldSubmit(
        unsavedProgressStatusFieldIds: IDataCollectionUnsavedProgressStatusDetails[],
        checkForSameStatus: boolean = true,
        doNotSaveLogFormEntry: TEditFormDetail = {},
        triggerSaveForm: boolean = true,
        excludedGroupIds: number[] = [],
    ) {
        // TODO: Checking for log form
        if (getArrayLength(Object.keys(doNotSaveLogFormEntry)) === 0) {
            await processUnsavedProgressStatusFieldIds(
                unsavedProgressStatusFieldIds,
                getFirstFieldProgressStatus(),
            );
        } else if (getArrayLength(Object.keys(doNotSaveLogFormEntry)) > 0) {
            let atleastOneFalse = false;
            for (const groupId of Object.keys(doNotSaveLogFormEntry)) {
                if (!doNotSaveLogFormEntry[groupId]) {
                    atleastOneFalse = true;
                    break;
                }
            }
            if (atleastOneFalse)
                await processUnsavedProgressStatusFieldIds(
                    unsavedProgressStatusFieldIds,
                    getFirstFieldProgressStatus(),
                );
        }
        let isSameStatus = false;
        let nextProgressStatus = "";
        let revertStatusResult: IFormFieldProgressStatusMetaData[] = [];
        if (dataCollectionStore.selectedFormType === 1) {
            const {
                isSameStatus: isAllFieldSameStatus,
                progressStatus,
                revertStatusResult: fieldRevertStatusResult,
            } = fieldStatuesList();
            isSameStatus = isAllFieldSameStatus;
            revertStatusResult = deepClone(fieldRevertStatusResult);
            nextProgressStatus = getNextProgressStatusByCurrentStatus(progressStatus);
        }
        let saveFormFieldResult = false;
        if (triggerSaveForm) {
            const [apiResult] = await Promise.all([
                saveFormFields(
                    checkForSameStatus && isSameStatus,
                    nextProgressStatus,
                    revertStatusResult,
                    doNotSaveLogFormEntry,
                    excludedGroupIds,
                ),
                changeSubjectToVisitInProgress(), // TODO: uncomment the line
            ]);
            saveFormFieldResult = apiResult;
            // TODO: uncomment the line
            if (saveFormFieldResult)
                Promise.all([
                    triggerFormFieldProgressStatusIfAllAreSame(
                        checkForSameStatus && isSameStatus,
                        nextProgressStatus,
                    ),
                ]);
            if (getArrayLength(revertStatusResult) > 0) {
                for (const row of revertStatusResult) {
                    if (
                        row.fieldProgressStatus &&
                        row.formProgressStatus &&
                        getArrayLength(row.fieldIds) > 0
                    ) {
                        Promise.all([
                            changeFormFieldProgressStatus(
                                row.fieldIds,
                                row.publishedSubjectFormFieldChildDetailIds,
                                row.formProgressStatus,
                                row.fieldProgressStatus,
                            ),
                        ]);
                    }
                }
            }
            // TODO: uncomment the line
        }
        return saveFormFieldResult;
    }

    function getFormFieldIds(
        resultRef: IDataCollectionFormDetails[] | IGenerateFormFieldsData[],
        type: TDataCollectionFormType = "log",
    ) {
        const result: number[] = [];
        for (const row of resultRef) {
            if (type === "log" && row.isLogDataEntry) result.push(row.id);
            else if (
                type === "standard" &&
                !row.isLogDataEntry &&
                !!(row as IGenerateFormFieldsData).varOID
            )
                result.push(row.id);
        }
        return result;
    }

    function getPublishedSubjectFormFieldChildDetailId(
        resultRow: IDataCollectionFormDetails | IGenerateFormFieldsData,
    ) {
        const formFieldDetailsRef =
            publishedSubjectFormFieldDetails.value[
                dataCollectionStore.selectedPublishedSubjectFormFieldParentId
            ];

        let publishedSubjectFormFieldChildDetailId = 0;
        const filteredItems = getFilteredItems({
            data: formFieldDetailsRef || [],
            type: "object",
            value: resultRow.id,
            key: "id",
        });
        if (getArrayLength(filteredItems) > 0) {
            let recordIndex = 0;
            const publishedFilteredItems = filteredItems as IPublishedSubjectFormFieldMetaDetail[];
            if (resultRow.isLogDataEntry) recordIndex = getArrayLength(publishedFilteredItems) - 1;
            publishedSubjectFormFieldChildDetailId =
                publishedFilteredItems[recordIndex].publishedSubjectFormFieldChildDetailId;
        }
        return publishedSubjectFormFieldChildDetailId;
    }

    function checkForLogFormStatusRevert(result: IFieldStatusMetaData[]) {
        const uniqueResult: string[] = [];
        const updateProgressStatusFields: IFormFieldProgressStatusMetaData[] = [];
        for (const row of result) {
            uniqueResult.push(row.progressStatus);
        }
        const verifyResults: IFormFieldProgressStatusMetaData = {
            ...defaultFormFieldProgressStatus(),
            fieldProgressStatus: "Verify Completed",
        };
        for (const row of result) {
            if (
                row.progressStatus === "Verify In Progress" &&
                row.isVerified &&
                uniqueResult.includes("Verify Completed")
            )
                verifyResults.fieldIds.push(row.fieldId);
            verifyResults.publishedSubjectFormFieldChildDetailIds.push(
                row.publishedSubjectFormFieldChildDetailId,
            );
        }
        const uniqueStatuses = [...new Set(result.map((row) => row.progressStatus))];
        const {
            // planned,
            // dataEntryInProgress,
            // dataEntryCompleted,
            verifyInProgress,
            verifyCompleted,
            // reviewInProgress,
            // reviewCompleted,
            // frozen,
            // locked,
        } = getFormFieldStatusCountDetails(uniqueStatuses);
        let verifyFormProgressStatus = "";
        if (
            verifyCompleted > 0 &&
            verifyInProgress > 0 &&
            verifyInProgress === getArrayLength(verifyResults.fieldIds)
        )
            verifyFormProgressStatus = "Verify Completed";
        // else if (statusCount.verifyCompleted > 0 && statusCount.verifyInProgress > 0 && statusCount.verifyInProgress === getArrayLength(verifyResults.fieldIds)) verifyFormProgressStatus = "Verify Completed";
        updateProgressStatusFields.push({
            ...verifyResults,
            formProgressStatus: verifyFormProgressStatus,
        });
        return updateProgressStatusFields;
    }

    function combineAllFieldsInLogFormDetails(excludedGroupIds: number[] = []) {
        const result: IDataCollectionFormDetails[] = [];
        for (const [dataCollectionGroupId, dataCollectionRow] of Object.entries(
            logFormDetails.value,
        )) {
            if (excludedGroupIds.includes(Number(dataCollectionGroupId))) continue;
            for (const [logEntryIndex, logEntryValue] of Object.entries(dataCollectionRow)) {
                if (
                    currentLogFormEditIndex.value !== -1 &&
                    Number(logEntryIndex) === currentLogFormEditIndex.value
                )
                    continue;
                for (const rowDetails of logEntryValue) {
                    if (rowDetails.isHeading && getArrayLength(rowDetails.children) > 0) {
                        for (const childrenRow of rowDetails.children) {
                            result.push(deepClone(childrenRow));
                        }
                    } else if (!rowDetails.isHeading) {
                        result.push(deepClone(rowDetails));
                    }
                }
            }
        }
        return result;
    }

    // function pushFormFieldIdInCheckForNonEnteredLogFormFields(
    //     row: IDataCollectionFormDetails,
    //     result: number[],
    // ) {
    //     if (
    //         row.isLogDataEntry &&
    //         !row.publishedSubjectFormFieldChildDetailId &&
    //         ((Array.isArray(row.modelValue) && getArrayLength(row.modelValue) === 0) ||
    //             !row.modelValue)
    //     ) {
    //         result.push(row.id);
    //     }
    // }

    // function checkForNonEnteredLogFormFields() {
    //     const result: Record<string, number[]> = {};
    //     for (const [dataCollectionGroupId, dataCollectionRow] of Object.entries(
    //         dataCollectionFormDetails.value,
    //     )) {
    //         result[dataCollectionGroupId] = [];
    //         for (const row of dataCollectionRow) {
    //             // if (
    //             //     row.isLogDataEntry &&
    //             //     !row.publishedSubjectFormFieldChildDetailId &&
    //             //     ((Array.isArray(row.modelValue) && getArrayLength(row.modelValue) === 0) ||
    //             //         !row.modelValue)
    //             // ) {
    //             //     result.push(row.id);
    //             // }
    //             if (row.isLogDataEntry) {
    //                 if (row.isHeading && getArrayLength(row.children) > 0) {
    //                     for (const childrenRow of row.children) {
    //                         pushFormFieldIdInCheckForNonEnteredLogFormFields(
    //                             childrenRow,
    //                             result[dataCollectionGroupId],
    //                         );
    //                     }
    //                 } else if (!row.isHeading) {
    //                     pushFormFieldIdInCheckForNonEnteredLogFormFields(
    //                         row,
    //                         result[dataCollectionGroupId],
    //                     );
    //                 }
    //             }
    //         }
    //     }
    //     return result;
    // }

    function logFormFieldStatuesList(
        // nonEnteredLogFormFields: number[]
        excludedGroupIds: number[] = [],
    ) {
        // FIXME: if not needed remove the param
        // console.log("nonEnteredLogFormFields", nonEnteredLogFormFields);
        const result: IFieldStatusMetaData[] = [];
        for (const [dataCollectionGroupId, dataCollectionRow] of Object.entries(
            dataCollectionFormDetails.value,
        )) {
            if (excludedGroupIds.includes(Number(dataCollectionGroupId))) continue;
            for (const row of dataCollectionRow) {
                // if (!nonEnteredLogFormFields.includes(row.id))
                if (row.isHeading && getArrayLength(row.children) > 0) {
                    for (const childrenRow of row.children) {
                        if (!showComponent(childrenRow)) continue;
                        result.push({
                            fieldId: childrenRow.id,
                            publishedSubjectFormFieldChildDetailId:
                                childrenRow.publishedSubjectFormFieldChildDetailId as number,
                            isFrozen: childrenRow.isFrozen,
                            isLocked: childrenRow.isLocked,
                            isVerified: childrenRow.isVerified,
                            progressStatus: childrenRow.progressStatus || "Planned",
                        });
                    }
                } else {
                    if (!showComponent(row)) continue;
                    result.push({
                        fieldId: row.id,
                        publishedSubjectFormFieldChildDetailId:
                            row.publishedSubjectFormFieldChildDetailId as number,
                        isFrozen: row.isFrozen,
                        isLocked: row.isLocked,
                        isVerified: row.isVerified,
                        progressStatus: row.progressStatus || "Planned",
                    });
                }
            }
        }
        // for (const row of logFormDetails.value) {
        //     result.push({
        //         fieldId: row.id,
        //         publishedSubjectFormFieldChildDetailId:
        //             row.publishedSubjectFormFieldChildDetailId as number,
        //         isFrozen: row.isFrozen,
        //         isLocked: row.isLocked,
        //         isVerified: row.isVerified,
        //         progressStatus: row.progressStatus || "Planned",
        //     });
        // }
        for (const row of combineAllFieldsInLogFormDetails(excludedGroupIds)) {
            result.push({
                fieldId: row.id,
                publishedSubjectFormFieldChildDetailId:
                    row.publishedSubjectFormFieldChildDetailId as number,
                isFrozen: row.isFrozen,
                isLocked: row.isLocked,
                isVerified: row.isVerified,
                progressStatus: row.progressStatus || "Planned",
            });
        }
        // const isSameStatus =
        //     getArrayLength(result) > 0
        //         ? result.every((status) => status.progressStatus === result[0].progressStatus)
        //         : false;
        const isSameStatus =
            getArrayLength(result) > 0
                ? // ? result.every((status) => status.progressStatus === result[0].progressStatus)
                  result.every(
                      (status) =>
                          (["Data Entry Inprogress", "Data Entry Completed"].includes(
                              result[0].progressStatus,
                          ) &&
                              status.progressStatus === result[0].progressStatus) ||
                          (result[0].progressStatus === "Verify In Progress" &&
                              status.isVerified &&
                              status.progressStatus === result[0].progressStatus) ||
                          (result[0].progressStatus === "Frozen" &&
                              status.isFrozen &&
                              status.progressStatus === result[0].progressStatus) ||
                          (result[0].progressStatus === "Locked" &&
                              status.isLocked &&
                              status.progressStatus === result[0].progressStatus),
                  )
                : false;

        return {
            isSameStatus,
            revertStatusResult: checkForLogFormStatusRevert(result),
            progressStatus:
                getArrayLength(result) > 0 && isSameStatus ? result[0].progressStatus : "",
        };
    }

    function pushToResultForTriggerLogFormFieldProgressStatusIfAllAreSame(
        row: IDataCollectionFormDetails,
        fieldIds: number[],
        publishedSubjectFormFieldChildDetailIds: number[],
    ) {
        if (!fieldIds.includes(row.id) && row.id) fieldIds.push(row.id);
        const publishedSubjectFormFieldChildDetailId =
            row.publishedSubjectFormFieldChildDetailId as number;
        if (
            !publishedSubjectFormFieldChildDetailIds.includes(
                publishedSubjectFormFieldChildDetailId,
            ) &&
            publishedSubjectFormFieldChildDetailId
        )
            publishedSubjectFormFieldChildDetailIds.push(publishedSubjectFormFieldChildDetailId);
    }

    function currentLogFieldsList(excludedGroupIds: number[] = []) {
        const result: IDataCollectionFormDetails[] = [];
        for (const [dataCollectionGroupId, dataCollectionRow] of Object.entries(
            dataCollectionFormDetails.value,
        )) {
            if (excludedGroupIds.includes(Number(dataCollectionGroupId))) continue;
            for (const row of dataCollectionRow) {
                result.push({ ...row });
            }
        }
        return result;
    }

    async function triggerLogFormFieldProgressStatusIfAllAreSame(
        isSameStatus: boolean,
        nextProgressStatus: string,
        excludedGroupIds: number[] = [],
    ) {
        const fieldIds: number[] = [];
        const publishedSubjectFormFieldChildDetailIds: number[] = [];
        // for (const row of [...dataCollectionFormDetails.value, ...logFormDetails.value]) {
        for (const row of [
            ...currentLogFieldsList(excludedGroupIds),
            ...combineAllFieldsInLogFormDetails(excludedGroupIds),
        ]) {
            if (row.isHeading && getArrayLength(row.children) > 0) {
                for (const childrenRow of row.children) {
                    pushToResultForTriggerLogFormFieldProgressStatusIfAllAreSame(
                        childrenRow,
                        fieldIds,
                        publishedSubjectFormFieldChildDetailIds,
                    );
                }
            } else if (!row.isHeading) {
                pushToResultForTriggerLogFormFieldProgressStatusIfAllAreSame(
                    row,
                    fieldIds,
                    publishedSubjectFormFieldChildDetailIds,
                );
            }
        }
        if (isSameStatus && getStringLength(nextProgressStatus) > 0) {
            await changeFormFieldProgressStatus(
                fieldIds,
                publishedSubjectFormFieldChildDetailIds,
                nextProgressStatus,
                nextProgressStatus,
            );
            const resultRef: TDataCollectionFormDetails = {};
            for (const [dataCollectionGroupId, dataCollectionRow] of Object.entries(
                dataCollectionFormDetails.value,
            )) {
                if (excludedGroupIds.includes(Number(dataCollectionGroupId))) continue;
                const loopResult = [];
                for (const row of dataCollectionRow) {
                    loopResult.push({
                        ...row,
                        children: row.isHeading
                            ? row.children.map((childrenRow) => ({
                                  ...childrenRow,
                                  progressStatus: nextProgressStatus,
                              }))
                            : [],
                        progressStatus: nextProgressStatus,
                    });
                }
                resultRef[dataCollectionGroupId] = deepClone(loopResult);
            }
            // const resultRef = deepClone(
            //     dataCollectionFormDetails.value.map((row) => ({
            //         ...row,
            //         children: row.isHeading
            //             ? row.children.map((childrenRow) => ({
            //                   ...childrenRow,
            //                   progressStatus: nextProgressStatus,
            //               }))
            //             : [],
            //         progressStatus: nextProgressStatus,
            //     })),
            // ) as IDataCollectionFormDetails[];
            const entryDetails = deepClone(logFormDetails.value) as TDataCollectionLogFormDetails;
            const entryDetailsRef: TDataCollectionLogFormDetails = {};
            for (const [dataCollectionGroupId, dataCollectionRow] of Object.entries(entryDetails)) {
                if (excludedGroupIds.includes(Number(dataCollectionGroupId))) continue;
                const innerEnteredLogDetails: TDataCollectionFormDetails = {};
                for (const [key, value] of Object.entries(dataCollectionRow)) {
                    if (
                        currentLogFormEditIndex.value !== -1 &&
                        Number(key) === currentLogFormEditIndex.value
                    ) {
                        innerEnteredLogDetails[key] = value;
                        continue;
                    }
                    for (const subRow of value) {
                        if (subRow.isHeading && getArrayLength(subRow.children) > 0) {
                            for (const childrenRow of subRow.children) {
                                childrenRow.progressStatus = nextProgressStatus;
                            }
                        } else if (!subRow.isHeading) {
                            subRow.progressStatus = nextProgressStatus;
                        }
                    }
                    innerEnteredLogDetails[key] = value;
                }
                entryDetailsRef[dataCollectionGroupId] = innerEnteredLogDetails;
            }
            logFormDetails.value = deepClone(entryDetailsRef);
            dataCollectionFormDetailsRef.value = deepClone(resultRef);
            dataCollectionFormDetails.value = deepClone(resultRef);
        }
    }

    // function removeLogDataEntryFields(doNotSaveLogFormEntry: boolean) {
    //     const resultRef: IDataCollectionFormDetails[] = [];
    //     for (const row of dataCollectionFormDetails.value) {
    //         if (!row.isLogDataEntry || (row.isLogDataEntry && !doNotSaveLogFormEntry))
    //             resultRef.push(deepClone(row));
    //     }
    //     dataCollectionFormDetails.value = deepClone(resultRef);
    //     dataCollectionFormDetailsRef.value = deepClone(resultRef);
    // }

    function pushDetailsForGetAllLogFieldsAsDefault(
        row: IDataCollectionFormDetails,
        unsavedProgressStatusFieldIds: IDataCollectionUnsavedProgressStatusDetails[],
        result: IDataCollectionUnsavedProgressStatusDetails[],
    ) {
        if (
            row.isLogDataEntry &&
            // row.progressStatus === "Planned" &&
            !row.publishedSubjectFormFieldChildDetailId
        ) {
            const filteredItems = getFilteredItems({
                data: unsavedProgressStatusFieldIds,
                type: "object",
                value: row.id,
                key: "fieldId",
            });
            result.push({
                fieldId: row.id,
                progressStatus:
                    getArrayLength(filteredItems) > 0 ? filteredItems[0].progressStatus : "Planned",
            });
        }
    }

    function getAllLogFieldsAsDefault(
        unsavedProgressStatusFieldIds: IDataCollectionUnsavedProgressStatusDetails[],
    ) {
        const result: Record<string, IDataCollectionUnsavedProgressStatusDetails[]> = {};
        for (const [dataCollectionGroupId, dataCollectionRow] of Object.entries(
            dataCollectionFormDetails.value,
        )) {
            result[dataCollectionGroupId] = [];
            for (const row of dataCollectionRow) {
                if (row.isHeading && getArrayLength(row.children) > 0) {
                    for (const childrenRow of row.children) {
                        if (!childrenRow.isLogDataEntry) continue;
                        pushDetailsForGetAllLogFieldsAsDefault(
                            childrenRow,
                            unsavedProgressStatusFieldIds,
                            result[dataCollectionGroupId],
                        );
                    }
                } else if (!row.isHeading) {
                    if (!row.isLogDataEntry) continue;
                    pushDetailsForGetAllLogFieldsAsDefault(
                        row,
                        unsavedProgressStatusFieldIds,
                        result[dataCollectionGroupId],
                    );
                }
            }
        }
        return result;
    }

    // function checkForDoNotSaveLogFormEntry() {
    //     const result: TEditFormDetail = {};
    //     for (const [dataCollectionGroupId, dataCollectionRow] of Object.entries(
    //         dataCollectionFormDetails.value,
    //     )) {
    //         let innerResult = false;
    //         for (const row of dataCollectionRow) {
    //             if (row.isHeading) continue;
    //             if (row.isLogDataEntry) break;
    //             if (!row.modelValue || row.modelValue === "No") {
    //                 innerResult = true;
    //                 break;
    //             }
    //         }
    //         result[dataCollectionGroupId] = innerResult;
    //     }
    //     return result;
    // }

    function checkForDoNotSaveLogFormEntry() {
        const result: TEditFormDetail = {};

        for (const [dataCollectionGroupId, dataCollectionRow] of Object.entries(
            dataCollectionFormDetails.value,
        )) {
            let innerResult = false;
            outerLoop: for (const row of dataCollectionRow) {
                if (row.isHeading && getArrayLength(row.children) > 0) {
                    for (const childrenRow of row.children) {
                        if (childrenRow.isLogDataEntry) break outerLoop;
                        if (
                            !childrenRow.modelValue ||
                            childrenRow.modelValue ===
                                logDataEntryCheckValueResult.value[childrenRow.id]
                        ) {
                            innerResult = true;
                            break outerLoop;
                        }
                    }
                } else if (!row.isHeading) {
                    if (row.isLogDataEntry) break;
                    if (
                        !row.modelValue ||
                        row.modelValue === logDataEntryCheckValueResult.value[row.id]
                    ) {
                        innerResult = true;
                        break;
                    }
                }
            }
            result[dataCollectionGroupId] = innerResult;
        }
        return result;
    }

    function resetLogDataEntryFormFieldDetails(resultRow: IDataCollectionFormDetails) {
        const controlTypeDetails = getFilteredItems({
            data: controlTypeLookups.value,
            type: "object",
            key: "value",
            value: resultRow.controlType,
        });
        const { modelValue } = getModelAndSpecifiedValueByControlType(
            controlTypeDetails[0].value,
            [],
            resultRow.defaultModelValue,
        );

        resultRow.modelValue = modelValue as TModelValue;
        resultRow.specifiedValue = null;
        // resultRow.disabled =
        //     !checkIfActionIsAllowed(studyStore.getRoleIdBySiteId(), RolePermissionType.Edit) ||
        //     !dataCollectionStore.isDataAllowedToEnterForTheSubject();
        resultRow.disabled = isFieldDisabled(
            resultRow.disabled || resultRow.isFrozen || resultRow.isLocked,
        );
        resultRow.progressStatus = "Planned";
        resultRow.isVerified = false;
        resultRow.isFrozen = false;
        resultRow.isLocked = false;
        resultRow.publishedSubjectFormFieldParentId =
            dataCollectionStore.selectedPublishedSubjectFormFieldParentId;
        resultRow.publishedSubjectFormFieldChildDetailId = null; // publishedSubjectFormFieldChildDetailId;
        resultRow.fieldValueDetails = [];
        resultRow.componentKey = `${resultRow.id}_${uniqueID()}`;
    }

    function checkIfSameAsRefModel(
        currentModel: IDataCollectionFormDetails,
        parentIndex: number,
        childrenIndex: number,
    ) {
        let isUpdated = false;
        outerLoop: for (const dataCollectionRow of Object.values(
            dataCollectionFormDetailsRef.value,
        )) {
            for (const [rowIndex, row] of dataCollectionRow.entries()) {
                if (row.isHeading && getArrayLength(row.children) > 0) {
                    for (const [childrenRowIndex, childrenRow] of row.children.entries()) {
                        if (childrenRowIndex === childrenIndex) {
                            if (
                                childrenRow.modelValue &&
                                currentModel.modelValue &&
                                JSON.stringify(childrenRow.modelValue) ===
                                    JSON.stringify(currentModel.modelValue)
                            ) {
                                isUpdated = true;
                                break outerLoop;
                            } else if (childrenRow.modelValue === currentModel.modelValue) {
                                isUpdated = true;
                                break outerLoop;
                            }
                        }
                    }
                } else if (!row.isHeading) {
                    if (rowIndex === parentIndex) {
                        if (
                            row.modelValue &&
                            currentModel.modelValue &&
                            JSON.stringify(row.modelValue) ===
                                JSON.stringify(currentModel.modelValue)
                        ) {
                            isUpdated = true;
                            break outerLoop;
                        } else if (row.modelValue === currentModel.modelValue) {
                            isUpdated = true;
                            break outerLoop;
                        }
                    }
                }
            }
        }
        return isUpdated;
    }

    function checkIfCurrentLogEntryAreAllEmptyAndUnchanged(enteredFormGroupIds: number[]) {
        const results: Record<string, boolean[]> = {};
        const finalResults: Record<string, boolean> = {};
        for (const [dataCollectionGroupId, dataCollectionRow] of Object.entries(
            dataCollectionFormDetails.value,
        )) {
            if (!enteredFormGroupIds.includes(Number(dataCollectionGroupId))) continue;
            results[dataCollectionGroupId] = [];
            for (const [rowIndex, row] of dataCollectionRow.entries()) {
                if (row.isHeading && getArrayLength(row.children) > 0) {
                    for (const [childrenRowIndex, childrenRow] of row.children.entries()) {
                        if (!childrenRow.isLogDataEntry) continue;
                        results[dataCollectionGroupId].push(
                            checkIfSameAsRefModel(childrenRow, -1, childrenRowIndex),
                        );
                    }
                } else if (!row.isHeading) {
                    if (!row.isLogDataEntry) continue;
                    results[dataCollectionGroupId].push(checkIfSameAsRefModel(row, rowIndex, -1));
                }
            }
        }
        for (const [key, value] of Object.entries(results)) {
            finalResults[key] = value.every((row) => row === true);
        }
        return finalResults;
    }

    function checkIfNonLogEntryAreAllUnchanged(enteredFormGroupIds: number[]) {
        const results: Record<string, boolean[]> = {};
        const finalResults: Record<string, boolean> = {};
        for (const [dataCollectionGroupId, dataCollectionRow] of Object.entries(
            dataCollectionFormDetails.value,
        )) {
            if (!enteredFormGroupIds.includes(Number(dataCollectionGroupId))) continue;
            results[dataCollectionGroupId] = [];
            for (const [rowIndex, row] of dataCollectionRow.entries()) {
                if (row.isHeading && getArrayLength(row.children) > 0) {
                    for (const [childrenRowIndex, childrenRow] of row.children.entries()) {
                        if (childrenRow.isLogDataEntry) continue;
                        results[dataCollectionGroupId].push(
                            checkIfSameAsRefModel(childrenRow, -1, childrenRowIndex),
                        );
                    }
                } else if (!row.isHeading) {
                    if (row.isLogDataEntry) continue;
                    results[dataCollectionGroupId].push(checkIfSameAsRefModel(row, rowIndex, -1));
                }
            }
        }
        for (const [key, value] of Object.entries(results)) {
            finalResults[key] = value.every((row) => row === true);
        }
        return finalResults;
    }

    type TLogEntry = Record<
        string,
        {
            key: string;
            index: number;
        }
    >;

    function checkEnteredLogData(
        isDataEntryFirstTime: boolean,
        enteredFormGroupIds: number[],
        logEntryDetails: TLogEntry,
    ) {
        const checkResults = checkIfCurrentLogEntryAreAllEmptyAndUnchanged(enteredFormGroupIds);
        const checkNonLogEntryResults = checkIfNonLogEntryAreAllUnchanged(enteredFormGroupIds);
        const results: Record<string, string> = {};
        for (const groupId of enteredFormGroupIds) {
            if (!checkIfKeyExistsInObject(groupId, checkResults)) continue;
            results[groupId] = "";
            const isFirstTime = logEntryDetails[groupId].index === -1 || isDataEntryFirstTime;
            const allAreEmpty = checkIfAllAreEmptyInLatestLogEntry(
                groupId,
                logEntryDetails[groupId].index,
            );
            if (!checkNonLogEntryResults[groupId]) results[groupId] = "non log entry changed";
            else if (
                (checkResults[groupId] && isFirstTime) ||
                (!checkResults[groupId] && isFirstTime) ||
                (!checkResults[groupId] && !allAreEmpty)
            )
                results[groupId] = "new entry";
            else if (
                (checkResults[groupId] && logEntryDetails[groupId].index !== -1 && allAreEmpty) ||
                (checkResults[groupId] && logEntryDetails[groupId].index !== -1 && !allAreEmpty)
            )
                results[groupId] = "do not trigger";
            else if (!checkResults[groupId] && allAreEmpty)
                results[groupId] = "update latest entry";
        }
        // else if (checkResult && !isModelChanged.value && ) result = "unchanged";
        return results;
    }

    function getLatestLogEntryDetails(groupIds: number[]) {
        const results: TLogEntry = {};
        for (const groupId of groupIds) {
            results[groupId] = {
                index: -1,
                key: "",
            };
            if (checkIfKeyExistsInObject(groupId, logFormDetails.value)) {
                const logEntryKeys = Object.keys(logFormDetails.value[groupId]);
                const logEntryKeysLength = getArrayLength(logEntryKeys);
                if (logEntryKeysLength > 0) {
                    results[groupId].index = logEntryKeysLength - 1;
                    results[groupId].key = logEntryKeys[logEntryKeysLength - 1];
                }
            }
        }
        return results;
    }

    function checkIfAllAreEmptyInLatestLogEntry(groupId: number, lastEntryIndex: number) {
        const latestEntry =
            lastEntryIndex !== -1 ? logFormDetails.value[groupId][lastEntryIndex] : null;
        let allAreEmpty = true;
        if (latestEntry) {
            for (const row of latestEntry) {
                if (
                    (Array.isArray(row.modelValue) && getArrayLength(row.modelValue) > 0) ||
                    row.modelValue
                ) {
                    allAreEmpty = false;
                    break;
                }
            }
        }
        return allAreEmpty;
    }

    async function handleStandardFormSubmit(
        unsavedProgressStatusFieldIds: IDataCollectionUnsavedProgressStatusDetails[],
    ) {
        const isStandaradFormBeingEnteredForFirstTime =
            dataCollectionStore.isStandaradFormBeingEnteredForFirstTime;
        if (dataCollectionStore.isStandaradFormBeingEnteredForFirstTime)
            dataCollectionStore.isStandaradFormBeingEnteredForFirstTime = false;

        let submitResult = false;
        const triggerSaveForm =
            (!isStandaradFormBeingEnteredForFirstTime && isModelChanged.value) ||
            isStandaradFormBeingEnteredForFirstTime;
        submitResult = await handleFormFieldSubmit(
            unsavedProgressStatusFieldIds,
            true,
            {},
            triggerSaveForm,
        );
        // doNotSaveForm
        return submitResult;
    }

    function processDataCollectionByCheckResult(
        enteredFormGroupIds: number[],
        checkResults: Record<string, string>,
        logEntryDetails: TLogEntry,
    ) {
        const finalGroupIds: number[] = [];
        for (const enteredFormGroupId of enteredFormGroupIds) {
            if (!checkIfKeyExistsInObject(enteredFormGroupId, checkResults)) continue;
            // do not trigger, update latest entry, new entry, non log entry changed
            if (
                ["do not trigger", "new entry", "non log entry changed"].includes(
                    checkResults[enteredFormGroupId],
                )
            ) {
                if (
                    checkResults[enteredFormGroupId] === "new entry" ||
                    checkResults[enteredFormGroupId] === "non log entry changed"
                )
                    finalGroupIds.push(Number(enteredFormGroupId));
                continue;
            }
            finalGroupIds.push(Number(enteredFormGroupId));
            if (
                checkIfKeyExistsInObject(enteredFormGroupId, dataCollectionFormDetails.value) &&
                checkIfKeyExistsInObject(enteredFormGroupId, logEntryDetails) &&
                checkIfKeyExistsInObject(enteredFormGroupId, logFormDetails.value) &&
                checkIfKeyExistsInObject(
                    logEntryDetails[enteredFormGroupId].index,
                    logFormDetails.value[enteredFormGroupId],
                )
            ) {
                for (const row of dataCollectionFormDetails.value[enteredFormGroupId]) {
                    if (row.isHeading && getArrayLength(row.children) > 0) {
                        for (const childrenRow of row.children) {
                            const filteredItems = getFilteredItems({
                                data: logFormDetails.value[enteredFormGroupId][
                                    logEntryDetails[enteredFormGroupId].index
                                ],
                                type: "object",
                                value: childrenRow.id,
                                key: "id",
                            }) as IDataCollectionFormDetails[];
                            if (getArrayLength(filteredItems) > 0) {
                                childrenRow.modelValue =
                                    childrenRow.modelValue || filteredItems[0].modelValue;
                                childrenRow.specifiedValue =
                                    childrenRow.specifiedValue || filteredItems[0].specifiedValue;
                                childrenRow.publishedSubjectFormFieldChildDetailId =
                                    filteredItems[0].publishedSubjectFormFieldChildDetailId;
                                childrenRow.progressStatus = filteredItems[0].progressStatus;
                            }
                        }
                    } else if (!row.isHeading) {
                        const filteredItems = getFilteredItems({
                            data: logFormDetails.value[enteredFormGroupId][
                                logEntryDetails[enteredFormGroupId].index
                            ],
                            type: "object",
                            value: row.id,
                            key: "id",
                        });
                        if (getArrayLength(filteredItems) > 0) {
                            row.modelValue = row.modelValue || filteredItems[0].modelValue;
                            row.specifiedValue =
                                row.specifiedValue || filteredItems[0].specifiedValue;
                            row.publishedSubjectFormFieldChildDetailId =
                                filteredItems[0].publishedSubjectFormFieldChildDetailId;
                            row.progressStatus = filteredItems[0].progressStatus;
                        }
                    }
                }
            }
        }
        return finalGroupIds;
    }

    async function handleLogFormSubmit(
        unsavedProgressStatusFieldIds: IDataCollectionUnsavedProgressStatusDetails[],
        type: "add more" | "submit",
        enteredFormGroupIds: number[],
    ) {
        const isLogFormBeingEnteredForFirstTime =
            dataCollectionStore.isLogFormBeingEnteredForFirstTime;
        if (dataCollectionStore.isLogFormBeingEnteredForFirstTime)
            dataCollectionStore.isLogFormBeingEnteredForFirstTime = false;
        // await Promise.all([
        //     handleFormFieldSubmit(unsavedProgressStatusFieldIds, false),
        //     changeFormFieldProgressStatus(getFormFieldIds(resultRef), [], "Planned", "Planned"),
        // ]);
        // await publishedSubjectFormFieldDetail();
        // const doNotSaveLogFormEntry =
        //     !dataCollectionFormDetails.value[0].modelValue ||
        //     dataCollectionFormDetails.value[0].modelValue === "No";
        const finalEnteredFormGroupIds =
            getArrayLength(enteredFormGroupIds) > 0
                ? [...enteredFormGroupIds]
                : [...Object.keys(dataCollectionFormDetails.value).map((row) => Number(row))];
        const logEntryDetails = getLatestLogEntryDetails(finalEnteredFormGroupIds);
        const checkResults = checkEnteredLogData(
            isLogFormBeingEnteredForFirstTime,
            finalEnteredFormGroupIds,
            logEntryDetails,
        ); // {}
        const doNotSaveLogFormEntry = checkForDoNotSaveLogFormEntry();
        // removeLogDataEntryFields(doNotSaveLogFormEntry);
        // const nonEnteredLogFormFields = checkForNonEnteredLogFormFields();
        // const finalUnsavedProgressStatusFieldIds: IDataCollectionUnsavedProgressStatusDetails[] = [];
        // const finalUnsavedProgressStatusFieldIds =
        //     getArrayLength(unsavedProgressStatusFieldIds) > 0
        //         ? unsavedProgressStatusFieldIds
        //         : getAllLogFieldsAsDefault();
        const finalUnsavedProgressStatusFieldIdsByGroupId = getAllLogFieldsAsDefault(
            unsavedProgressStatusFieldIds,
        );
        const finalGroupIds = processDataCollectionByCheckResult(
            enteredFormGroupIds,
            checkResults,
            logEntryDetails,
        );
        const excludedGroupIds: number[] = [];
        for (const dataCollectionGroupId of Object.keys(dataCollectionFormDetails.value)) {
            if (!finalGroupIds.includes(Number(dataCollectionGroupId)))
                excludedGroupIds.push(Number(dataCollectionGroupId));
        }
        const triggerSaveForm = getArrayLength(finalGroupIds) > 0;
        // const asdasd: IDataCollectionUnsavedProgressStatusDetails[] = []
        const finalUnsavedProgressStatusFieldIds: IDataCollectionUnsavedProgressStatusDetails[] =
            [];
        for (const finalGroupId of finalGroupIds) {
            if (
                checkIfKeyExistsInObject(finalGroupId, finalUnsavedProgressStatusFieldIdsByGroupId)
            ) {
                for (const row of finalUnsavedProgressStatusFieldIdsByGroupId[finalGroupId]) {
                    finalUnsavedProgressStatusFieldIds.push({ ...row });
                }
            }
        }

        const saveFormFieldResult = await handleFormFieldSubmit(
            finalUnsavedProgressStatusFieldIds,
            false,
            doNotSaveLogFormEntry,
            triggerSaveForm,
            excludedGroupIds,
        );
        // return false;

        let newProgressStatus = "";
        if (type === "submit") {
            const { isSameStatus, progressStatus, revertStatusResult } = logFormFieldStatuesList(
                // nonEnteredLogFormFields
                excludedGroupIds,
            );
            const nextProgressStatus = getNextProgressStatusByCurrentStatus(progressStatus);
            if (saveFormFieldResult)
                await triggerLogFormFieldProgressStatusIfAllAreSame(
                    isSameStatus,
                    nextProgressStatus,
                    excludedGroupIds,
                );
            newProgressStatus = saveFormFieldResult && isSameStatus ? nextProgressStatus : "";
            if (getArrayLength(revertStatusResult) > 0) {
                for (const row of revertStatusResult) {
                    if (
                        row.fieldProgressStatus &&
                        row.formProgressStatus &&
                        getArrayLength(row.fieldIds) > 0
                    ) {
                        Promise.all([
                            changeFormFieldProgressStatus(
                                row.fieldIds,
                                row.publishedSubjectFormFieldChildDetailIds,
                                row.formProgressStatus,
                                row.fieldProgressStatus,
                            ),
                        ]);
                    }
                }
            }
        }

        const resultRef = deepClone(dataCollectionFormDetails.value) as TDataCollectionFormDetails;
        // let enteredResult: IDataCollectionFormDetails[] = deepClone(logFormDetails.value);
        const enteredResult: TDataCollectionLogFormDetails = deepClone(logFormDetails.value);
        if (getArrayLength(finalGroupIds) > 0) {
            for (const enteredFormGroupId of finalGroupIds) {
                const entryKey = getLogFormDetailKeyByIndex(
                    currentLogFormEditIndex.value,
                    enteredFormGroupId,
                );
                let enteredResultKey = 0;
                if (currentLogFormEditIndex.value !== -1 && entryKey)
                    enteredResultKey = Number(entryKey);
                else if (
                    checkIfKeyExistsInObject(enteredFormGroupId, checkResults) &&
                    checkIfKeyExistsInObject(enteredFormGroupId, logEntryDetails) &&
                    checkResults[enteredFormGroupId] === "update latest entry" &&
                    logEntryDetails[enteredFormGroupId].index !== -1
                )
                    enteredResultKey = Number(logEntryDetails[enteredFormGroupId].index);
                else if (checkIfKeyExistsInObject(enteredFormGroupId, enteredResult))
                    enteredResultKey = getArrayLength(
                        Object.keys(enteredResult[enteredFormGroupId]),
                    );

                // if (
                //     checkIfKeyExistsInObject(enteredFormGroupId, enteredResult) &&
                //     checkIfKeyExistsInObject(enteredResultKey, enteredResult[enteredFormGroupId])
                // ) {
                enteredResult[enteredFormGroupId][enteredResultKey] = [];
                for (const resultRow of resultRef[enteredFormGroupId]) {
                    let finalResultRow = null;
                    if (resultRow.isHeading && getArrayLength(resultRow.children) > 0) {
                        const childrenDetails: IDataCollectionFormDetails[] = [];
                        for (const childrenRow of resultRow.children) {
                            if (!childrenRow.isLogDataEntry) continue;
                            childrenDetails.push(
                                deepClone({
                                    ...childrenRow,
                                    fieldValueDetails: [
                                        ...(await getAPIFieldValueDetails(childrenRow)),
                                    ],
                                }),
                            );
                        }
                        finalResultRow = deepClone({
                            ...resultRow,
                            fieldValueDetails: [...(await getAPIFieldValueDetails(resultRow))],
                            children: deepClone(childrenDetails),
                        });
                    } else if (!resultRow.isHeading) {
                        if (!resultRow.isLogDataEntry) continue;
                        finalResultRow = deepClone({
                            ...resultRow,
                            fieldValueDetails: [...(await getAPIFieldValueDetails(resultRow))],
                            children: [],
                        });
                    }

                    // enteredResult.push(
                    //     deepClone({
                    //         ...resultRow,
                    //         fieldValueDetails: [...(await getAPIFieldValueDetails(resultRow))],
                    //     }),
                    // );
                    // enteredResult[enteredFormGroupId][enteredResultKey].push(
                    //     deepClone({
                    //         ...resultRow,
                    //         fieldValueDetails: resultRow.isHeading
                    //             ? []
                    //             : [...(await getAPIFieldValueDetails(resultRow))],
                    //         children: resultRow.isHeading
                    //             ? resultRow.children.map(async (childrenRow) => ({
                    //                   ...childrenRow,
                    //                   fieldValueDetails: [
                    //                       ...(await getAPIFieldValueDetails(resultRow)),
                    //                   ],
                    //               }))
                    //             : [],
                    //     }),
                    // );
                    if (finalResultRow)
                        enteredResult[enteredFormGroupId][enteredResultKey].push(
                            deepClone(finalResultRow),
                        );
                    if (resultRow.isHeading && getArrayLength(resultRow.children) > 0) {
                        for (const childrenRow of resultRow.children) {
                            if (!childrenRow.isLogDataEntry) continue;
                            resetLogDataEntryFormFieldDetails(childrenRow);
                        }
                    } else if (!resultRow.isHeading) {
                        if (!resultRow.isLogDataEntry) continue;
                        resetLogDataEntryFormFieldDetails(resultRow);
                    }
                    // const publishedSubjectFormFieldChildDetailId =
                    //     getPublishedSubjectFormFieldChildDetailId(resultRow);
                }
                enteredResult[enteredFormGroupId][enteredResultKey] = enteredResult[
                    enteredFormGroupId
                ][enteredResultKey]
                    .map((row) => ({
                        ...row,
                        progressStatus: newProgressStatus || row.progressStatus,
                        children: row.isHeading
                            ? row.children.map((childrenRow) => ({
                                  ...childrenRow,
                                  progressStatus: newProgressStatus || childrenRow.progressStatus,
                              }))
                            : [],
                    }))
                    .sort((a, b) => {
                        // if (a.id > b.id) return 1;
                        // if (a.id < b.id) return -1;
                        if (a.orderNumber > b.orderNumber) return 1;
                        if (a.orderNumber < b.orderNumber) return -1;
                        return 0;
                    });
                // }
            }
        } else {
            for (const [dataCollectionGroupId] of Object.keys(resultRef)) {
                for (const resultRow of resultRef[dataCollectionGroupId]) {
                    if (resultRow.isHeading && getArrayLength(resultRow.children) > 0) {
                        for (const childrenRow of resultRow.children) {
                            if (!childrenRow.isLogDataEntry) continue;
                            resetLogDataEntryFormFieldDetails(childrenRow);
                        }
                    } else if (!resultRow.isHeading) {
                        if (!resultRow.isLogDataEntry) continue;
                        resetLogDataEntryFormFieldDetails(resultRow);
                    }
                }
            }
        }
        dataCollectionFormDetailsRef.value = deepClone(resultRef);
        dataCollectionFormDetails.value = deepClone(resultRef);
        logFormDetails.value = deepClone(enteredResult);

        if (
            checkIfKeyExistsInObject(
                dataCollectionStore.activeFormIndex,
                dataCollectionDetails.value,
            )
        ) {
            dataCollectionDetails.value[dataCollectionStore.activeFormIndex].formDetails =
                deepClone(resultRef);
            dataCollectionDetails.value[dataCollectionStore.activeFormIndex].formDetailsRef =
                deepClone(resultRef);
            dataCollectionDetails.value[dataCollectionStore.activeFormIndex].logFormDetails =
                deepClone(enteredResult);
        }
        processIsDerivedField();
        processFormFieldDerivationOnChange();

        // FIXME: need to handle the below condition change
        if (getArrayLength(Object.keys(doNotSaveLogFormEntry)) > 0) {
            let rowIndexes: number[] = [];
            const groupIds: number[] = [];
            for (const [groupId, valueResult] of Object.entries(doNotSaveLogFormEntry)) {
                if (valueResult && checkIfKeyExistsInObject(groupId, logFormDetails.value)) {
                    rowIndexes = Object.keys(logFormDetails.value[groupId]).map((row) =>
                        Number(row),
                    );
                    if (getArrayLength(rowIndexes) > 0) groupIds.push(Number(groupId));
                }
            }
            if (getArrayLength(rowIndexes) > 0 && getArrayLength(groupIds) > 0)
                await handleFormDelete(null, rowIndexes, groupIds);
            // const rowIndexes = Object.keys(logFormDetails.value).map((row) => Number(row));
            // await handleFormDelete(null, rowIndexes, -1);
        }
        if (currentLogFormEditIndex.value !== -1) currentLogFormEditIndex.value = -1;

        return saveFormFieldResult;
    }

    function getLogFormDetailKeyByIndex(rowIndex: number, groupId: number) {
        let result = "";
        for (const [dataCollectionGroupId, dataCollectionRow] of Object.entries(
            logFormDetails.value,
        )) {
            if (isEqual(dataCollectionGroupId, groupId, "number")) {
                for (const [logFormDetailIndex, logFormDetailKey] of Object.entries(
                    Object.keys(dataCollectionRow),
                ))
                    if (isEqual(logFormDetailIndex, rowIndex, "number")) {
                        result = logFormDetailKey;
                    }
            }
        }
        return result;
    }

    function setDataForLogFormEntryUpdate(
        row: IDataCollectionFormDetails,
        entryDetailsByIndex: IDataCollectionFormDetails[],
    ) {
        const filteredEntryDetails = getFilteredItems({
            data: entryDetailsByIndex,
            type: "object",
            key: "id",
            value: row.id,
        }) as IDataCollectionFormDetails[];
        if (getArrayLength(filteredEntryDetails) > 0) {
            const { modelValue, specifiedValue } = getModelAndSpecifiedValueByControlType(
                row.controlType,
                filteredEntryDetails[0].fieldValueDetails,
                row.defaultModelValue,
            );

            row.modelValue = modelValue as TModelValue;
            row.specifiedValue = specifiedValue;
            // row.disabled =
            //     !checkIfActionIsAllowed(studyStore.getRoleIdBySiteId(), RolePermissionType.Edit) ||
            //     filteredEntryDetails[0].isFrozen ||
            //     filteredEntryDetails[0].isLocked;
            row.disabled = isFieldDisabled(
                filteredEntryDetails[0].disabled ||
                    filteredEntryDetails[0].isFrozen ||
                    filteredEntryDetails[0].isLocked,
            );
            row.progressStatus = filteredEntryDetails[0].progressStatus;
            row.isVerified = filteredEntryDetails[0].isVerified;
            row.isFrozen = filteredEntryDetails[0].isFrozen;
            row.isLocked = filteredEntryDetails[0].isLocked;
            row.publishedSubjectFormFieldParentId =
                dataCollectionStore.selectedPublishedSubjectFormFieldParentId;
            row.publishedSubjectFormFieldChildDetailId =
                filteredEntryDetails[0].publishedSubjectFormFieldChildDetailId;
            row.fieldValueDetails = [...filteredEntryDetails[0].fieldValueDetails];
            row.componentKey = `${row.id}_${uniqueID()}`;
        }
        // if (getArrayLength(filteredEntryDetails) === 0) continue;
    }

    async function handleLogFormEntryUpdateByIndex(rowIndex: number, groupId: number) {
        if (groupId !== -1) {
            const resultRef = deepClone(
                dataCollectionFormDetails.value,
            ) as TDataCollectionFormDetails;
            const entryDetails: TDataCollectionLogFormDetails = deepClone(logFormDetails.value);

            const finalResult: TDataCollectionFormDetails = {};
            for (const [dataCollectionIndex, dataCollectionRow] of Object.entries(resultRef)) {
                const loopRecord: IDataCollectionFormDetails[] = [];
                for (const row of dataCollectionRow) {
                    const entryKey = getLogFormDetailKeyByIndex(rowIndex, groupId);
                    if (!entryKey) continue;
                    const entryDetailsByIndex = entryDetails[groupId][entryKey];
                    if (row.isHeading && getArrayLength(row.children) > 0) {
                        for (const childrenRow of row.children) {
                            setDataForLogFormEntryUpdate(childrenRow, entryDetailsByIndex);
                        }
                    } else if (!row.isHeading) {
                        setDataForLogFormEntryUpdate(row, entryDetailsByIndex);
                    }
                    loopRecord.push(deepClone(row));
                }
                finalResult[dataCollectionIndex] = deepClone(loopRecord);
            }
            dataCollectionFormDetailsRef.value = deepClone(finalResult);
            dataCollectionFormDetails.value = deepClone(finalResult);
            currentLogFormEditIndex.value = rowIndex;
            processIsDerivedField();
            processFormFieldDerivationOnChange();
            await Promise.all([
                checkForInitialFormFieldVisibility(),
                checkForInitialFormFieldDisable(),
            ]);

            if (dataCollectionStore.selectedDiscrepancyDetails.isProcessLogForm) {
                dataCollectionStore.selectedDiscrepancyDetails.processLogForm = true;
                dataCollectionStore.selectedDiscrepancyDetails.isProcessLogForm = false;
            }
        }
    }

    function triggerFormSignatureModal() {
        popupModalStore.show("subjectFormSignatureModal");
    }

    function validateAll(userDetails: IUser) {
        if (!formFieldSignatureFormModel.value.username)
            formFieldSignatureErrorModel.value.username = "Please enter the username";
        else if (
            !isEqual(formFieldSignatureFormModel.value.username, userDetails.username, "string")
        )
            formFieldSignatureErrorModel.value.username = "Please enter a valid username";
        else formFieldSignatureErrorModel.value.username = "";
        if (!formFieldSignatureFormModel.value.password)
            formFieldSignatureErrorModel.value.password = "Please enter the password";
        else formFieldSignatureErrorModel.value.password = "";
    }

    async function subjectCompletionFormSigning() {
        await subjectCompletionFormSigningAPI({
            id: 0,
            trialId: Number(studyStore.studyInformation.trialId),
            environmentId: Number(studyStore.studyInformation.environmentId),
            formId: dataCollectionStore.queryParamDetails.formId,
            folderId: dataCollectionStore.queryParamDetails.folderId,
            siteId: dataCollectionStore.queryParamDetails.siteId,
            subjectId: dataCollectionStore.queryParamDetails.subjectId,
            publishedSubjectFormFieldParentDetailId: 0,
            masterSubjectFormActionId: 0,
            comments: null,
            updatedBy: 0,
        });
    }

    async function changeSubjectStatus(subjectStatus: string) {
        const { status } = await changeSubjectStatusAPI({
            id: 0,
            studyId: 0,
            statusId: 0,
            statusName: subjectStatus,
            trialId: Number(studyStore.studyInformation.trialId),
            environmentId: Number(studyStore.studyInformation.environmentId),
            trialName: null,
            environmentName: null,
            siteId: dataCollectionStore.queryParamDetails.siteId,
            siteName: null,
            subjectFormConfigId: 0,
            subjectId: dataCollectionStore.queryParamDetails.subjectId,
            label: null,
            value: null,
            fieldValue: null,
            lastUpdated: null,
            orderNumber: 0,
            isActive: false,
            isMandatory: false,
            isSpecify: false,
            format: null,
            subjectDetails: [],
            forms: [],
            updatedBy: 0,
        });
        if (status === 200) {
            dataCollectionStore.subjectStatus = subjectStatus;
        }
    }

    async function handleOnProgressStatusChange(
        fieldId: number[],
        publishedSubjectFormFieldChildDetailId: number[],
        formProgressStatus: string,
        fieldProgressStatus: string,
    ) {
        await Promise.all([
            changeFormFieldProgressStatus(
                fieldId,
                publishedSubjectFormFieldChildDetailId,
                formProgressStatus,
                fieldProgressStatus,
            ),
            changeSubjectToVisitInProgress(),
        ]);
    }

    function resetFormFieldSignatureModel(closeModal?: TVoidAction) {
        formFieldSignatureFormModel.value = { ...defaultFormFieldSignatureFormModel() };
        formFieldSignatureFormModelRef.value = { ...defaultFormFieldSignatureFormModel() };
        formFieldSignatureErrorModel.value = { ...defaultFormFieldSignatureErrorModel() };
        if (closeModal) closeModal();
    }

    async function handleOnSignatureCompleted(closeModal: TVoidAction) {
        const userDetails = userStore.getDetails();
        validateAll(userDetails);
        formFieldSignatureFormModel.value.enterpriseName = userDetails.enterpriseName;
        formFieldSignatureFormModelRef.value.enterpriseName = userDetails.enterpriseName;
        let saveFormFieldResult = false;
        if (!checkIfModelHasErrors(formFieldSignatureErrorModel.value)) {
            const encodedPassword = encodeData(String(formFieldSignatureFormModel.value.password));
            formFieldSignatureFormModel.value.password = encodedPassword;
            formFieldSignatureFormModel.value.password = encodedPassword;
            const { status, message, data } = await formFieldCaptureSignatureAPI({
                id: 0,
                userId: 0,
                username: encodeData(formFieldSignatureFormModel.value.username),
                password: formFieldSignatureFormModel.value.password,
                enterpriseName: encodeData(formFieldSignatureFormModel.value.enterpriseName),
                studyId: 0,
                siteId: dataCollectionStore.queryParamDetails.siteId,
                roleId: 0,
                roleName: "",
                roleDescription: "",
                trialId: Number(studyStore.studyInformation.trialId),
                trialName: "",
                environmentId: Number(studyStore.studyInformation.environmentId),
                environmentName: "",
                updatedBy: 0,
            });
            if (status === 200) {
                if (data) {
                    saveFormFieldResult = await handleFormFieldSubmit([]);
                    if (saveFormFieldResult)
                        await Promise.all([
                            subjectCompletionFormSigning(),
                            changeSubjectStatus("All visits completed"),
                        ]);
                }
                resetFormFieldSignatureModel(closeModal);
            } else if (status !== 401) {
                formFieldSignatureFormModel.value.password = null;
                formFieldSignatureFormModelRef.value.password = null;
                toastStore.error({
                    title: "Error",
                    message,
                });
            }
        }
        return saveFormFieldResult;
    }

    // function setSubjectFormFieldDetailTableData(
    //     tableData: IPublishedSubjectFormFieldDetailData[],
    //     badgeCountDetailsData: IFormFieldDiscrepancyBadgeCount[],
    // ): IPublishedSubjectFormFieldMetaDetail[] {
    //     const result: IPublishedSubjectFormFieldMetaDetail[] = [];
    //     for (const [index, row] of tableData.entries()) {
    //         // FIXME: Fix for multiple form
    //         if (index !== 0) break;
    //         for (const subRow of row.fieldValueDetails) {
    //             const badgeCountData = getFilteredItems({
    //                 data: badgeCountDetailsData,
    //                 type: "object",
    //                 value: subRow.publishedSubjectFormFieldChildDetailId,
    //                 key: "publishedSubjectFormFieldChildDetailId",
    //             }) as IFormFieldDiscrepancyBadgeCount[];
    //             console.log("badgeCountData in setSubjectFormFieldDetailTableData", badgeCountData);
    //             result.push({
    //                 discrepancyCount:
    //                     getArrayLength(badgeCountData) > 0 ? badgeCountData[0].count : null,
    //                 publishedSubjectDetailId: row.publishedSubjectDetailId,
    //                 publishedSubjectFormFieldChildDetailId:
    //                     subRow.publishedSubjectFormFieldChildDetailId,
    //                 publishedSubjectFormFieldParentId: row.publishedSubjectFormFieldParentId,
    //             });
    //         }
    //     }
    //     return result;
    // }
    function setSubjectFormFieldDetailTableData(
        tableData: IPublishedSubjectFormFieldDetailData[],
        badgeCountDetailsData: IFormFieldDiscrepancyBadgeCount[],
        formFieldCheckProgressStatusWorkflowData: IFormFieldCheckProgressStatusWorkflowData[],
    ): TPublishedSubjectFormFieldMetaDetail {
        const result: TPublishedSubjectFormFieldMetaDetail = {};
        for (const row of tableData) {
            const subResult: IPublishedSubjectFormFieldMetaDetail[] = [];
            for (const subRow of row.fieldValueDetails) {
                const badgeCountData = getFilteredItems({
                    data: badgeCountDetailsData,
                    type: "object",
                    value: subRow.publishedSubjectFormFieldChildDetailId,
                    key: "publishedSubjectFormFieldChildDetailId",
                }) as IFormFieldDiscrepancyBadgeCount[];
                const progressStatusWorkflowData = getFilteredItems({
                    data: formFieldCheckProgressStatusWorkflowData,
                    type: "object",
                    value: subRow.publishedSubjectFormFieldChildDetailId,
                    key: "publishedSubjectFormFieldChildDetailId",
                }) as IFormFieldCheckProgressStatusWorkflowData[];
                subResult.push({
                    id: subRow.id,
                    discrepancyCount:
                        getArrayLength(badgeCountData) > 0 ? badgeCountData[0].count : null,
                    movedFromFrozenToLocked:
                        getArrayLength(progressStatusWorkflowData) > 0
                            ? progressStatusWorkflowData[0].isFrozen
                            : false,
                    publishedSubjectDetailId: row.publishedSubjectDetailId,
                    publishedSubjectFormFieldChildDetailId:
                        subRow.publishedSubjectFormFieldChildDetailId,
                    publishedSubjectFormFieldParentId: row.publishedSubjectFormFieldParentId,
                });
            }
            result[row.publishedSubjectFormFieldParentId] = deepClone(subResult);
        }
        return result;
    }

    function setPublishedSubjectFormDetailsTableData(
        tableData: IPublishedSubjectFormFieldDetailData[],
    ): IPublishedSubjectFormMetaDetail[] {
        return tableData.map((row, index) => {
            let publishedSubjectFormFieldParentId = 0;
            if (dataCollectionStore.selectedDiscrepancyDetails)
                publishedSubjectFormFieldParentId =
                    dataCollectionStore.selectedDiscrepancyDetails
                        .publishedSubjectFormFieldParentId;
            if (dataCollectionStore.selectedMyTaskDetails)
                publishedSubjectFormFieldParentId =
                    dataCollectionStore.selectedMyTaskDetails.publishedSubjectFormFieldParentId;
            else if (dataCollectionStore.selectedPublishedSubjectFormFieldParentIdRef)
                publishedSubjectFormFieldParentId =
                    dataCollectionStore.selectedPublishedSubjectFormFieldParentIdRef;
            return {
                publishedSubjectDetailId: row.publishedSubjectDetailId,
                publishedSubjectFormFieldParentId: row.publishedSubjectFormFieldParentId,
                isActive: publishedSubjectFormFieldParentId
                    ? publishedSubjectFormFieldParentId === row.publishedSubjectFormFieldParentId
                    : index === 0,
            };
        });
    }

    async function getBadgeCountDetails(
        triggerAPI: boolean,
        publishedSubjectFormFieldParentId: number,
    ) {
        let badgeDetailsData: IFormFieldDiscrepancyBadgeCount[] = [];
        if (triggerAPI) {
            badgeDetailsData = await badgeCountDetails(publishedSubjectFormFieldParentId);
        }
        return badgeDetailsData;
    }

    async function getFormFieldCheckProgressStatusWorkflow(
        triggerAPI: boolean,
        publishedSubjectFormFieldParentId: number,
    ) {
        let formFieldCheckProgressStatusWorkflowData: IFormFieldCheckProgressStatusWorkflowData[] =
            [];
        if (triggerAPI) {
            formFieldCheckProgressStatusWorkflowData = await formFieldCheckProgressStatusWorkflow(
                publishedSubjectFormFieldParentId,
            );
        }
        return formFieldCheckProgressStatusWorkflowData;
    }

    async function publishedSubjectFormFieldDetail(disableGlobalLoader: boolean = false) {
        const { data, status } = await publishedSubjectFormFieldDetailAPI(
            {
                id: 0,
                subjectId: dataCollectionStore.queryParamDetails.subjectId,
                trialId: Number(studyStore.studyInformation.trialId),
                environmentId: Number(studyStore.studyInformation.environmentId),
                siteId: dataCollectionStore.queryParamDetails.siteId,
                formId: dataCollectionStore.queryParamDetails.formId,
                folderId: dataCollectionStore.queryParamDetails.folderId,
                fieldId: null,
                publishedSubjectFormFieldChildDetailId: 0,
                publishedSubjectFormFieldParentId: 0,
                publishedSubjectDetailId: 0,
                progressStatus: "",
                label: "",
                fieldValue: "",
                fieldValueDetails: [],
                updatedBy: 0,
            },
            disableGlobalLoader,
        );
        if (status === 200) {
            // let badgeDetailsData: IFormFieldDiscrepancyBadgeCount[] = [];
            // let formFieldCheckProgressStatusWorkflowData: IFormFieldCheckProgressStatusWorkflowData[] =
            //     [];
            // if (getArrayLength(data) > 0) {
            //     badgeDetailsData = await badgeCountDetails(
            //         data[0].publishedSubjectFormFieldParentId,
            //     );
            //     formFieldCheckProgressStatusWorkflowData =
            //         await formFieldCheckProgressStatusWorkflow(
            //             data[0].publishedSubjectFormFieldParentId,
            //         );
            // }
            const [badgeDetailsData, formFieldCheckProgressStatusWorkflowData] = await Promise.all([
                getBadgeCountDetails(
                    getArrayLength(data) > 0,
                    getArrayLength(data) > 0 ? data[0].publishedSubjectFormFieldParentId : 0,
                ),
                getFormFieldCheckProgressStatusWorkflow(
                    getArrayLength(data) > 0,
                    getArrayLength(data) > 0 ? data[0].publishedSubjectFormFieldParentId : 0,
                ),
            ]);
            publishedSubjectFormFieldDetails.value = deepClone(
                setSubjectFormFieldDetailTableData(
                    data,
                    badgeDetailsData,
                    formFieldCheckProgressStatusWorkflowData,
                ),
            );
            publishedSubjectFormDetails.value = deepClone(
                setPublishedSubjectFormDetailsTableData(data),
            );
        } else if (status !== 401) {
            publishedSubjectFormFieldDetails.value = {};
            publishedSubjectFormDetails.value = [];
        }
    }

    async function badgeCountDetails(publishedSubjectFormFieldParentId: number) {
        let result: IFormFieldDiscrepancyBadgeCount[] = [];
        const { data, status } = await badgeCountDetailsAPI(publishedSubjectFormFieldParentId);
        if (status === 200) {
            result = deepClone(data);
        } else if (status !== 401) {
            result = [];
        }
        return result;
    }

    async function subjectDetailsBySubjectId() {
        const { data, status } = await subjectDetailsBySubjectIdAPI(
            Number(dataCollectionStore.queryParamDetails.subjectId),
        );
        if (status === 200) {
            dataCollectionStore.subjectStatus = data.statusName;
        } else if (status !== 401) {
            dataCollectionStore.subjectStatus = "";
        }
    }

    async function formFieldCheckProgressStatusWorkflow(publishedSubjectFormFieldParentId: number) {
        let result: IFormFieldCheckProgressStatusWorkflowData[] = [];
        const { status, data } = await formFieldCheckProgressStatusWorkflowAPI(
            publishedSubjectFormFieldParentId,
        );
        if (status === 200) {
            result = deepClone(data);
        } else {
            result = [];
        }
        return result;
    }

    // interface IFindResult {
    //     formId: number;
    //     folderId: number;
    //     uniqueId: string;
    // }

    // function getParamDetails(
    //     // children: IDCMenuLink[],
    //     // parentDetails: IDCMenuLink,
    //     // clickedRow: IDCMenuLink,
    //     loopData: ISubjectTrialVisitData[] | ISubjectFormData[],
    //     uniqueId: string,
    // ): IFindResult | null {
    //     let result: IFindResult | null = null;
    //     for (const row of loopData) {
    //         console.log("row in getParamDetails", row);
    //         if (!checkIfKeyExistsInObject("formName", row)) {
    //             result = getParamDetails((row as ISubjectTrialVisitData).forms || []);
    //             if (result) return result;
    //         } else if (uniqueId === row.uniqueId) {
    //             return {
    //                 formId: row.id,
    //                 type: row.type,
    //                 folderId: parentDetails.id,
    //                 parentType: parentDetails.type,
    //                 uniqueId: row.uniqueId,
    //             };
    //         }
    //     }
    //     return result;
    // }

    // function handleMenuClick(menuRow: TTableData) {
    //     console.log("menuRow in handleMenuClick", menuRow);
    //     let result = null;
    //     let subjectId = 0;
    //     let siteId = 0;
    //     let uniqueId = "";
    //     result = getParamDetails(menuRow.trialVisits || [], menuRow, menuRow);
    //     console.log("result in for loop", result);
    //     if (result) {
    //         subjectId = row.id;
    //         siteId = row.siteId;
    //         uniqueId = result.uniqueId;
    //         break;
    //     }
    //     console.log("subjectId in handleMenuClick", subjectId);
    //     console.log("siteId in handleMenuClick", siteId);
    //     console.log("result in handleMenuClick", result);
    // }

    function processPublishedSubjectFormAuditDetails() {
        const result: IPublishedSubjectFormMetaDetail[] = [];
        for (const [index, row] of auditFormDetailsData.value.entries()) {
            result.push({
                isActive: index === 0,
                publishedSubjectDetailId: 0,
                publishedSubjectFormFieldParentId: row.publishedSubjectFormFieldParentId,
            });
        }
        publishedSubjectFormAuditDetails.value = deepClone(result);
    }

    function setProgressStatusToDisableIfFormIsInactive(
        subjectId: number,
        siteId: number,
        formId: number,
        folderId: TNullableNumber,
    ) {
        let result = false;
        for (const subjectDetailRow of subjectDetailsList.value) {
            if (subjectDetailRow.subjectId === subjectId && subjectDetailRow.siteId === siteId) {
                result = checkIfFormIsDisabled(subjectDetailRow.deactivatedForms, formId, folderId);
                break;
            }
        }
        return result;
    }

    function disableClickIfFormIsDisabled(data: TTableData, columnRow: IColumn) {
        const result = setProgressStatusToDisableIfFormIsInactive(
            data.subjectId,
            data.siteId,
            columnRow.data.id,
            columnRow.data.folderId || null,
        );
        // return result ? " pointer-events-none" : "";
        return result;
    }

    async function auditEntryDetails(
        subjectId: number,
        siteId: number,
        formId: number,
        folderId: TNullableNumber,
    ) {
        loading.value.dynamicLoading["auditEntryDetails"] = true;
        const { status, data, message } = await auditEntryDetailsAPI(
            studyStore.studyInformation.trialId as number,
            studyStore.studyInformation.environmentId as number,
            subjectId,
            siteId,
            formId,
            folderId || null,
        );
        if (status === 200) {
            auditEntryDetailsData.value = deepClone(data);
        } else if (status !== 401) {
            toastStore.error({
                title: "Error",
                message,
            });
            auditEntryDetailsData.value = null;
        }
        loading.value.dynamicLoading["auditEntryDetails"] = false;
    }

    async function auditFormDetails(
        subjectId: number,
        siteId: number,
        formId: number,
        folderId: TNullableNumber,
    ) {
        loading.value.dynamicLoading["auditFormDetails"] = true;
        // "auditEntryDetails",
        // "auditHistoryDetails",
        const { status, data, message } = await auditFormDetailsAPI(
            studyStore.studyInformation.trialId as number,
            studyStore.studyInformation.environmentId as number,
            subjectId,
            siteId,
            formId,
            folderId || null,
        );
        if (status === 200) {
            auditFormDetailsData.value = deepClone(data);
        } else if (status !== 401) {
            toastStore.error({
                title: "Error",
                message,
            });
            auditFormDetailsData.value = [];
        }
        processPublishedSubjectFormAuditDetails();
        loading.value.dynamicLoading["auditFormDetails"] = false;
    }

    async function auditHistoryDetailsPaginationList(
        subjectId: number,
        siteId: number,
        formId: number,
        folderId: TNullableNumber,
        fieldId: TNullableNumber,
        publishedSubjectFormFieldParentId: number,
    ) {
        loading.value.dynamicLoading["auditHistoryDetails"] = true;
        const {
            status,
            data: { items, total },
            message,
        } = await auditHistoryDetailsPaginationListAPI(
            getAPIFilters({
                top: auditHistoryPagination.value.pageDetails.pageLimit,
                page: auditHistoryPagination.value.pageDetails.currentPage,
                filter: {
                    trialId: studyStore.studyInformation.trialId as number,
                    environmentId: studyStore.studyInformation.environmentId as number,
                    subjectId,
                    siteId,
                    formId,
                    folderId,
                    publishedSubjectFormFieldChildDetailId: fieldId,
                    publishedSubjectFormFieldParentId,
                },
            }),
        );
        if (status === 200) {
            auditHistoryDetailsData.value = deepClone([...auditHistoryDetailsData.value, ...items]);
            auditHistoryPagination.value.pageDetails.totalRecords = total;
            auditHistoryPagination.value.pageDetails.lastPage =
                auditHistoryPagination.value.getLastPage();
        } else if (status !== 401) {
            toastStore.error({
                title: "Error",
                message,
            });
            auditHistoryDetailsData.value = [];
        }
        loading.value.dynamicLoading["auditHistoryDetails"] = false;
    }

    async function handleFormIconClick(row: TTableData) {
        log("info", [row]);
        const { subjectId = 0, siteId = 0 } = row;
        const { folderId = 0, id = 0 } = row.columnRow.data;
        auditHistoryQueryParams.value.subjectId = subjectId;
        auditHistoryQueryParams.value.siteId = siteId;
        auditHistoryQueryParams.value.formId = id;
        auditHistoryQueryParams.value.folderId = folderId || null;
        auditHistoryQueryParams.value.formName = row.columnRow.header;
        // handleMenuClick(row);
        // auditHistoryData.value = getAuditHistoryData(20);
        popupModalStore.show("clinicalTrialAuditAndDataCollectionModal");
        await Promise.all([
            auditEntryDetails(subjectId, siteId, id, folderId),
            auditFormDetails(subjectId, siteId, id, folderId),
        ]);
        const selectedPublishedSubjectFormFieldParentId =
            getArrayLength(auditFormDetailsData.value) > 0
                ? auditFormDetailsData.value[0].publishedSubjectFormFieldParentId
                : 0;
        await auditHistoryDetailsPaginationList(
            subjectId,
            siteId,
            id,
            folderId,
            null,
            selectedPublishedSubjectFormFieldParentId,
        );
    }

    async function handleDataCollectionAuditClick() {
        popupModalStore.show("clinicalTrialAuditAndDataCollectionModal");
        await Promise.all([
            auditHistoryDetailsPaginationList(
                dataCollectionStore.queryParamDetails.subjectId,
                dataCollectionStore.queryParamDetails.siteId,
                dataCollectionStore.queryParamDetails.formId,
                dataCollectionStore.queryParamDetails.folderId,
                dataCollectionStore.selectedFieldId,
                dataCollectionStore.selectedPublishedSubjectFormFieldParentId,
            ),
            auditEntryDetails(
                dataCollectionStore.queryParamDetails.subjectId,
                dataCollectionStore.queryParamDetails.siteId,
                dataCollectionStore.queryParamDetails.formId,
                dataCollectionStore.queryParamDetails.folderId,
            ),
            auditFormDetails(
                dataCollectionStore.queryParamDetails.subjectId,
                dataCollectionStore.queryParamDetails.siteId,
                dataCollectionStore.queryParamDetails.formId,
                dataCollectionStore.queryParamDetails.folderId,
            ),
        ]);
    }

    async function handleLazyLoad(publishedSubjectFormFieldParentId: number) {
        if (
            auditHistoryPagination.value.pageDetails.currentPage <
            auditHistoryPagination.value.pageDetails.lastPage
        ) {
            auditHistoryPagination.value.pageDetails.currentPage++;
            await auditHistoryDetailsPaginationList(
                auditHistoryQueryParams.value.subjectId,
                auditHistoryQueryParams.value.siteId,
                auditHistoryQueryParams.value.formId,
                auditHistoryQueryParams.value.folderId,
                dataCollectionStore.selectedFieldId,
                publishedSubjectFormFieldParentId,
            );
        }
    }

    function getProgressStatusIcon(rowData: any, data: any) {
        const { subjectId, id, folderId = undefined } = data;
        // console.log("data in getProgressStatusIcon", data);
        // console.log("subjectId, id, folderId in getProgressStatusIcon", subjectId, id, folderId);
        // console.log(
        //     "data.formName, data.progressStatus in getProgressStatusIcon",
        //     data.formName,
        //     data.progressStatus,
        // );
        // let result = "Planned";
        let result = null;
        for (const row of auditTableData.value) {
            if (isEqual(subjectId, row.subjectId, "number")) {
                // console.log("row folder in getProgressStatusIcon", row);
                // console.log(
                //     "checkIfKeyExistsInObject(folderId, data) && data[folderId] folder in getProgressStatusIcon",
                //     checkIfKeyExistsInObject("folderId", data) && data["folderId"],
                // );
                if (checkIfKeyExistsInObject("folderId", data) && data["folderId"]) {
                    for (const folderRow of row.trialVisits) {
                        // console.log(
                        //     "isEqual(folderRow.id, data.folderId, number) in getProgressStatusIcon",
                        //     isEqual(folderRow.id, data.folderId, "number"),
                        // );
                        if (isEqual(folderRow.id, data.folderId, "number")) {
                            const key = `${folderId}#$%${id}`;
                            // console.log("key in getProgressStatusIcon", key);
                            if (checkIfKeyExistsInObject(key, rowData)) {
                                // console.log(
                                //     "checkIfKeyExistsInObject(key, rowData) in getProgressStatusIcon",
                                //     checkIfKeyExistsInObject(key, rowData),
                                // );
                                // console.log("rowData folder in getProgressStatusIcon", rowData);
                                result = rowData[key];
                            }
                            break;
                        }
                    }
                } else {
                    const key = `#$%${id}`;
                    // console.log("key in else in getProgressStatusIcon ", key);
                    // console.log(
                    //     "checkIfKeyExistsInObject(key, rowData) in else in getProgressStatusIcon ",
                    //     checkIfKeyExistsInObject(key, rowData),
                    // );
                    if (checkIfKeyExistsInObject(key, rowData)) {
                        // console.log("rowData form in getProgressStatusIcon", rowData);
                        result = rowData[key];
                    }
                }
                break;
            }
        }
        return result;
    }

    const lastUpdatedTime = (lastUpdated: TNullableString, isDateTime: boolean = false) => {
        return lastUpdated
            ? formatDate(lastUpdated, isDateTime ? "DD-MMM-YYYY HH:mm:ss" : "DD-MMM-YYYY")
            : null;
    };

    function handleDiscrepancyActionClick(
        action: string,
        type: TDiscrepancyActionType,
        formFieldDiscrepancyId: number,
    ) {
        if (type === "others") showResolveDiscrepancySection.value = true;
        else showRaiseDiscrepancySection.value = true;
        raiseDiscrepancyFormModel.value.status = action;
        raiseDiscrepancyFormModelRef.value.status = action;
        if (formFieldDiscrepancyId) {
            raiseDiscrepancyFormModel.value.formFieldDiscrepancyId = formFieldDiscrepancyId;
            raiseDiscrepancyFormModelRef.value.formFieldDiscrepancyId = formFieldDiscrepancyId;
        } else {
            raiseDiscrepancyFormModel.value.formFieldDiscrepancyId = 0;
            raiseDiscrepancyFormModelRef.value.formFieldDiscrepancyId = 0;
        }
    }

    function scrollToStartOfDiscrepancy(fieldLabel: string) {
        // rowIndex: number
        // const discrepancyContainer = getDOMElement(`.fieldDiscrepancyContainer${rowIndex}`);
        // console.log("discrepancyContainer", discrepancyContainer);
        // if (discrepancyContainer)
        //     discrepancyContainer.scrollIntoView({
        //         behavior: "smooth",
        //         block: "start", // or 'center' based on your preference
        //     });
        const discrepancyContainer = getDOMElement(
            `label[for='${convertWordsIntoCasedWords(fieldLabel, "camel case")}']`,
        );
        if (discrepancyContainer)
            discrepancyContainer.scrollIntoView({
                behavior: "smooth",
                block: "start",
            });
    }

    function showGoUpArrow() {
        let result = false;
        if (getArrayLength(Object.keys(raisedDiscrepanciesDataDetails.value)) >= 2) result = true;
        else {
            for (const row of Object.values(raisedDiscrepanciesDataDetails.value)) {
                if (getArrayLength(row.content) >= 3) {
                    result = true;
                    break;
                }
            }
        }
        return result;
    }

    // function setRaisedDiscrepancyDetails() {
    //     const result: IRaisedDiscrepancyDataDetail = {};
    //     const finalResult: IRaisedDiscrepancyDataDetail = {};
    //     for (const row of raisedDiscrepanciesData.value) {
    //         if (!checkIfKeyExistsInObject(row.formFieldDiscrepancyId, result))
    //             result[row.formFieldDiscrepancyId] = {
    //                 heading: null,
    //                 content: [],
    //                 isActive: false,
    //             };
    //         if (row.status === 1 && !result[row.formFieldDiscrepancyId].heading) {
    //             result[row.formFieldDiscrepancyId].heading = { ...row };
    //         } else if (row.status !== 1) {
    //             result[row.formFieldDiscrepancyId].content.push({ ...row });
    //         }
    //     }
    //     for (const [index, [rowKey, rowValue]] of Object.entries(result)
    //         .sort((a, b) => {
    //             if (Number(a[0]) > Number(b[0])) return -1;
    //             if (Number(a[0]) < Number(b[0])) return 1;
    //             return 0;
    //         })
    //         .entries()) {
    //         const updatedKey = `${rowKey}_${index}`;
    //         if (index === 0) rowValue.isActive = true;
    //         else rowValue.isActive = false;
    //         finalResult[updatedKey] = deepClone(rowValue);
    //     }
    //     return finalResult;
    // }
    function setRaisedDiscrepancyDetails() {
        const result: IRaisedDiscrepancyDataDetail = {};
        const finalResult: IRaisedDiscrepancyDataDetail = {};
        for (const row of raisedDiscrepanciesData.value) {
            if (!checkIfKeyExistsInObject(row.formFieldDiscrepancyId, result))
                result[row.formFieldDiscrepancyId] = {
                    heading: null,
                    content: [],
                    isActive: false,
                };
            if (row.status === 1 && !result[row.formFieldDiscrepancyId].heading) {
                result[row.formFieldDiscrepancyId].heading = { ...row };
            }
            result[row.formFieldDiscrepancyId].content.push({ ...row });
        }
        for (const [index, [rowKey, rowValue]] of Object.entries(result)
            .sort((a, b) => {
                if (Number(a[0]) > Number(b[0])) return -1;
                if (Number(a[0]) < Number(b[0])) return 1;
                return 0;
            })
            // .sort((a, b) => {
            //     if (Number(a[1]) > Number(b[0])) return -1;
            //     if (Number(a[0]) < Number(b[0])) return 1;
            //     return 0;
            // })
            .entries()) {
            const updatedKey = `${rowKey}_${index}`;
            if (index === 0) rowValue.isActive = true;
            else rowValue.isActive = false;
            finalResult[updatedKey] = deepClone({
                ...rowValue,
                content: rowValue.content.sort((a, b) => {
                    if (!a.modifiedDate || !b.modifiedDate) return 0;
                    if (dayjsDate(a.modifiedDate).isAfter(b.modifiedDate)) return 1;
                    if (!dayjsDate(a.modifiedDate).isAfter(b.modifiedDate)) return -1;
                    return 0;
                }),
            });
        }
        return finalResult;
    }

    // function processAccordionExpand(rowKey: string) {
    //     console.log("rowKey in processAccordionExpand", rowKey);
    //     const resultRef = deepClone(raisedDiscrepanciesDataDetails.value);
    //     for (const row of Object.keys(resultRef)) {
    //         console.log("row in processAccordionExpand", row);
    //         const isActiveRef = resultRef[rowKey].isActive;
    //         console.log("isActiveRef", isActiveRef);
    //         if (row === rowKey) {
    //             resultRef[rowKey].isActive = !isActiveRef;
    //         } else {
    //             resultRef[rowKey].isActive = false;
    //         }
    //     }
    //     console.log("resultRef", resultRef);
    //     raisedDiscrepanciesDataDetails.value = deepClone(resultRef);
    // }

    // const raisedDiscrepanciesDataDetails = computed(() => {
    //     // const result: Record<string, IFormFieldDiscrepancyData[]> = {};
    //     // let count = 1;
    //     // let rowIndex = 0;
    //     // for (const row of raisedDiscrepanciesData.value) {
    //     //     if (count === 3) {
    //     //         count = 1;
    //     //         rowIndex++;
    //     //     }
    //     //     if (!checkIfKeyExistsInObject(rowIndex, result)) result[rowIndex] = [];
    //     //     result[rowIndex].push({ ...row });
    //     // }
    //     // return result;
    //     const result: IRaisedDiscrepancyDataDetail = {};
    //     for (const row of raisedDiscrepanciesData.value) {
    //         if (!checkIfKeyExistsInObject(row.formFieldDiscrepancyId, result))
    //             result[row.formFieldDiscrepancyId] = {
    //                 heading: null,
    //                 content: [],
    //             };
    //         if (row.status === 1 && !result[row.formFieldDiscrepancyId].heading) {
    //             result[row.formFieldDiscrepancyId].heading = { ...row };
    //         } else if (row.status !== 1) {
    //             result[row.formFieldDiscrepancyId].content.push({ ...row });
    //         }
    //     }
    //     return result;
    // });

    async function discrepancyPaginationList(clearTableData: boolean = false) {
        loading.value.dynamicLoading["discrepancyList"] = true;
        if (clearTableData) raisedDiscrepanciesData.value = [];
        const {
            status,
            data: { items, total },
            message,
        } = await discrepancyPaginationListAPI(
            getAPIFilters({
                top: discrepancyListPagination.value.pageDetails.pageLimit,
                page: discrepancyListPagination.value.pageDetails.currentPage,
                filter: {
                    trialId: Number(studyStore.studyInformation.trialId),
                    environmentId: Number(studyStore.studyInformation.environmentId),
                    publishedSubjectFormFieldChildDetailId: dataCollectionStore.selectedFieldId,
                },
            }),
        );
        if (status === 200) {
            raisedDiscrepanciesData.value = deepClone([
                ...raisedDiscrepanciesData.value,
                ...items.map((row) => ({
                    ...row,
                    comments: row.comments ? row.comments.split(": ")[1] : "",
                })),
            ]);
            raisedDiscrepanciesDataDetails.value = deepClone(setRaisedDiscrepancyDetails());
            discrepancyListPagination.value.pageDetails.totalRecords = total;
            discrepancyListPagination.value.pageDetails.lastPage =
                discrepancyListPagination.value.getLastPage();
        } else if (status !== 401) {
            toastStore.error({
                title: "Error",
                message,
            });
            raisedDiscrepanciesData.value = [];
            raisedDiscrepanciesDataDetails.value = {};
        }
        loading.value.dynamicLoading["discrepancyList"] = false;
    }

    async function handleDiscrepancyLazyLoad() {
        if (
            discrepancyListPagination.value.pageDetails.currentPage <
            discrepancyListPagination.value.pageDetails.lastPage
        ) {
            loading.value.dynamicLoading["discrepancyLazyLoad"] = true;
            discrepancyListPagination.value.pageDetails.currentPage++;
            await discrepancyPaginationList();
            loading.value.dynamicLoading["discrepancyLazyLoad"] = false;
        }
    }

    async function formFieldDetailsByIds() {
        const { status, data } = await formFieldDetailsByIdsAPI({
            id: 0,
            subjectId: dataCollectionStore.queryParamDetails.subjectId,
            siteId: dataCollectionStore.queryParamDetails.siteId,
            formId: dataCollectionStore.queryParamDetails.formId,
            folderId: dataCollectionStore.queryParamDetails.folderId,
            publishedSubjectFormFieldParentId:
                dataCollectionStore.selectedPublishedSubjectFormFieldParentId,
            publishedSubjectFormFieldChildDetailId: dataCollectionStore.selectedFieldId as number,
        });
        if (status === 200) {
            formFieldDetails.value = deepClone(data);
            if (formFieldDetails.value)
                formFieldDetails.value.publishedSubjectFormFieldParentId =
                    dataCollectionStore.selectedPublishedSubjectFormFieldParentId;
        } else if (status !== 401) {
            formFieldDetails.value = null;
        }
    }

    function setDiscrepancyFormFieldMapper() {
        if (getArrayLength(Object.keys(discrepancyFormFieldMapper)) === 0) {
            // for (let i = 0; i < getArrayLength(dataCollectionFormDetails.value); i++) {
            //     discrepancyFormFieldMapper.value[i] = false;
            // }
            for (const dataCollectionRow of Object.values(dataCollectionFormDetails.value)) {
                for (const row of dataCollectionRow) {
                    if (row.isHeading && getArrayLength(row.children) > 0) {
                        for (const childrenRow of row.children) {
                            discrepancyFormFieldMapper.value[childrenRow.id] = false;
                        }
                    } else if (!row.isHeading) {
                        discrepancyFormFieldMapper.value[row.id] = false;
                    }
                }
            }
        }
    }

    function openDiscrepanyConditionCheck(row: IDataCollectionFormDetails) {
        let label = "";
        if (row.publishedSubjectFormFieldChildDetailId === dataCollectionStore.selectedFieldId) {
            discrepancyFormFieldMapper.value[row.id] = true;
            label = String(row.label);
        } else discrepancyFormFieldMapper.value[row.id] = false;
        return label;
    }

    function openDiscrepancyBySelectedFieldId() {
        let label = "";
        for (const dataCollectionRow of Object.values(dataCollectionFormDetails.value)) {
            for (const row of dataCollectionRow) {
                if (row.isHeading && getArrayLength(row.children) > 0) {
                    for (const childrenRow of row.children) {
                        const result = openDiscrepanyConditionCheck(childrenRow);
                        if (result) label = result;
                    }
                } else if (!row.isHeading) {
                    const result = openDiscrepanyConditionCheck(row);
                    if (result) label = result;
                }
            }
        }
        return label;
    }

    async function handleViewDiscrepancyDetails() {
        setDiscrepancyFormFieldMapper();
        const label = openDiscrepancyBySelectedFieldId();
        // popupModalStore.show("dataCollectionDiscrepancyModal");
        // await discrepancyPaginationList();
        raisedDiscrepanciesData.value = [];
        await Promise.all([discrepancyPaginationList(), formFieldDetailsByIds()]);
        discrepancyStatuses.value = setDiscrepancyStatuses();
        // scrollToStartOfDiscrepancy(scrollIndex);
        scrollToStartOfDiscrepancy(label);
    }

    function isDiscrepancyClosed(content: IFormFieldDiscrepancyData[]) {
        let result = false;
        for (const row of content) {
            if ([2, 3].includes(row.status)) {
                result = true;
                break;
            }
        }
        return result;
    }

    function resetDiscrepancyFormModel() {
        raiseDiscrepancyFormModel.value = { ...defaultRaiseDiscrepancyFormModel() };
        raiseDiscrepancyFormModelRef.value = { ...defaultRaiseDiscrepancyFormModel() };
        raiseDiscrepancyErrorModel.value = { ...defaultRaiseDiscrepancyErrorModel() };
    }

    function resetDiscrepancyModel(closeModal?: TVoidAction) {
        if (closeModal) {
            closeModal();
            selectedFormFieldDetails.value = null;
        }
        raisedDiscrepanciesData.value = [];
        raisedDiscrepanciesDataDetails.value = {};
        formFieldDetails.value = null;
        discrepancyListPagination.value.clearCountDetails();
        discrepancyListPagination.value.clearPageDetails();
        discrepancyStatuses.value = [];
        selectedFormFieldDetails.value = null;
        resetDiscrepancyFormModel();
    }

    // function handleRaiseDiscrepancyClose(closeModal: TVoidAction) {
    //     if (raiseDiscrepancyModelTriggerChange.value === "unsaved") {
    //         if (!window.confirm("Reload page confirmation message")) {
    //             // return false;
    //         } else {
    //             resetDiscrepancyModel(closeModal);
    //             raiseDiscrepancyModelTriggerChange.value = "reset";
    //         }
    //     } else {
    //         resetDiscrepancyModel(closeModal);
    //     }
    // }

    function validateRaiseDiscrepancyModel() {
        if (getStringLength(raiseDiscrepancyFormModel.value.comments) === 0)
            raiseDiscrepancyErrorModel.value.comments = "Please enter a comment";
        else if (getStringLength(raiseDiscrepancyFormModel.value.comments) > 200)
            raiseDiscrepancyErrorModel.value.comments =
                "Comments cannot be more than 200 characters";
        else raiseDiscrepancyErrorModel.value.comments = "";
    }

    async function changeFormAndFieldProgressStatusDueToDiscrepancy() {
        if (selectedFormFieldDetails.value) {
            if (selectedFormFieldDetails.value.progressStatus === "Verify Completed") {
                await changeFormFieldProgressStatus(
                    [selectedFormFieldDetails.value.id],
                    [Number(selectedFormFieldDetails.value.publishedSubjectFormFieldChildDetailId)],
                    "Verify In Progress",
                    "Verify In Progress",
                );

                const updatedResult = setNewStatusInDataCollectionForm("", [
                    {
                        fieldIds: [selectedFormFieldDetails.value.id],
                        publishedSubjectFormFieldChildDetailIds: [
                            Number(
                                selectedFormFieldDetails.value
                                    .publishedSubjectFormFieldChildDetailId,
                            ),
                        ],
                        fieldProgressStatus: "Verify In Progress",
                        formProgressStatus: "",
                    },
                ]);
                dataCollectionFormDetailsRef.value = deepClone(updatedResult);
                dataCollectionFormDetails.value = deepClone(updatedResult);
            }
        }
    }

    async function dataCollectionDiscrepancyModal(
        type: TDiscrepancyActionType,
        afterSave: TVoidAction,
    ) {
        validateRaiseDiscrepancyModel();
        if (!checkIfModelHasErrors(raiseDiscrepancyErrorModel.value)) {
            loading.value.dynamicLoading["raiseDiscrepancy"] = true;
            const { status, message } = await formFieldDiscrepancyAPI({
                id: 0,
                formFieldDiscrepancyId: raiseDiscrepancyFormModel.value.formFieldDiscrepancyId,
                comments: raiseDiscrepancyFormModel.value.comments as string,
                publishedSubjectFormFieldChildDetailId: Number(dataCollectionStore.selectedFieldId),
                status: Number(raiseDiscrepancyFormModel.value.status),
                type: 2,
                updatedBy: 0,
                count: 0,
                modifiedBy: "",
                modifiedDate: null,
            });
            if (status === 200) {
                disableDiscrepancyLazyLoad.value = true;
                discrepancyListPagination.value.clearCountDetails();
                discrepancyListPagination.value.clearPageDetails();
                if (type === "raise") showRaiseDiscrepancySection.value = false;
                else showResolveDiscrepancySection.value = false;
                toastStore.success({
                    title: "Success",
                    message,
                });
                await Promise.all([
                    publishedSubjectFormFieldDetail(true),
                    discrepancyPaginationList(true),
                    changeFormAndFieldProgressStatusDueToDiscrepancy(),
                    processMyTasks(
                        [1],
                        [1, 2, 3].includes(Number(raiseDiscrepancyFormModel.value.status)),
                    ),
                ]);
                discrepancyStatuses.value = setDiscrepancyStatuses();
                resetDiscrepancyFormModel();
                afterSave();
                disableDiscrepancyLazyLoad.value = false;
            } else if (status !== 401) {
                toastStore.error({
                    title: "Error",
                    message,
                });
            }
            loading.value.dynamicLoading["raiseDiscrepancy"] = false;
        }
    }

    function checkFormType() {
        let result: TDataCollectionFormType = "standard";
        for (const row of dataCollectionFormFieldStructureDetails.value) {
            if (row.isLogDataEntry) {
                result = "log";
                break;
            }
        }
        return result;
    }

    async function handleGenerateStandardFormFields(
        isNewForm: boolean = false,
        changeForm: boolean = false,
        dataAllowedToEnter: boolean,
    ) {
        if (!changeForm) {
            if (getArrayLength(publishedSubjectFormDetails.value) === 0)
                await publishedSubjectFormFieldDetail();

            // TODO: For disabling data entry based on subject status need to address over here.
            if (
                dataAllowedToEnter &&
                (getArrayLength(publishedSubjectFormDetails.value) === 0 || isNewForm)
            ) {
                dataCollectionStore.isStandaradFormBeingEnteredForFirstTime = true;
                await changeFormFieldProgressStatus([], [], "Planned", "Planned");
                await publishedSubjectFormFieldDetail();
                if (isNewForm) {
                    publishedSubjectFormDetails.value = deepClone(
                        publishedSubjectFormDetails.value.map((row, index) => ({
                            ...row,
                            isActive:
                                index === getArrayLength(publishedSubjectFormDetails.value) - 1,
                        })),
                    );
                }
            }
        }
        for (const [index, row] of publishedSubjectFormDetails.value.entries()) {
            if (!checkIfKeyExistsInObject(index, dataCollectionDetails.value))
                dataCollectionDetails.value[index] = {
                    formDetails: {},
                    formDetailsRef: {},
                    logFormDetails: {},
                };
            if (row.isActive) {
                dataCollectionStore.activeFormIndex = index;
                dataCollectionStore.selectedPublishedSubjectFormFieldParentId =
                    row.publishedSubjectFormFieldParentId;
                break;
            }
        }
        if (changeForm) await setBadgeCountAndProgressWorkflowDetailsToChangedForm();
        if (isNewForm) await handleProcessFormGeneration(true);
        else await generateFormFieldsList();
    }

    async function handleGenerateLogFormFields(dataAllowedToEnter: boolean) {
        if (getArrayLength(publishedSubjectFormDetails.value) === 0)
            await publishedSubjectFormFieldDetail();

        // TODO: For disabling data entry based on subject status need to address over here.
        if (dataAllowedToEnter && getArrayLength(publishedSubjectFormDetails.value) === 0) {
            const nonLogFieldIds = getFormFieldIds(
                dataCollectionFormFieldStructureDetails.value,
                "standard",
            );
            dataCollectionStore.isLogFormBeingEnteredForFirstTime = true;
            await changeFormFieldProgressStatus(nonLogFieldIds, [], "Planned", "Planned");
            await publishedSubjectFormFieldDetail();
        }
        for (const [index, row] of publishedSubjectFormDetails.value.entries()) {
            if (!checkIfKeyExistsInObject(index, dataCollectionDetails.value))
                dataCollectionDetails.value[index] = {
                    formDetails: {},
                    formDetailsRef: {},
                    logFormDetails: {},
                };
            if (row.isActive) {
                dataCollectionStore.activeFormIndex = index;
                dataCollectionStore.selectedPublishedSubjectFormFieldParentId =
                    row.publishedSubjectFormFieldParentId;
                break;
            }
        }
        await generateFormFieldsList();
    }

    async function handleGenerateFormFields(
        isNewForm: boolean = false,
        changeForm: boolean = false,
    ) {
        if (!loading.value.dynamicLoading["dataCollectionGrid"])
            loading.value.dynamicLoading["dataCollectionGrid"] = true;
        const formType = checkFormType();
        const isDataAllowedToEnter = dataCollectionStore.isDataAllowedToEnterForTheSubject();
        if (formType === "log") {
            await handleGenerateLogFormFields(isDataAllowedToEnter);
        } else {
            await handleGenerateStandardFormFields(isNewForm, changeForm, isDataAllowedToEnter);
        }

        await Promise.all([
            assignedVisibiltyEditChecks(),
            assignedDerivations(),
            assignedDisableFieldEditChecks(),
        ]);
        isUserAllowedToEnterData.value = checkIfActionIsAllowed(studyStore.getRoleIdBySiteId(), [
            RolePermissionType.Edit,
        ]);
        loading.value.dynamicLoading["dataCollectionGrid"] = false;
    }

    // async function handleAddForm() {
    //     loading.value.dynamicLoading["dataCollectionGrid"] = true;
    //     const publishedSubjectDetailId =
    //         publishedSubjectFormDetails.value[0].publishedSubjectDetailId;
    //     const insertIndex = publishedSubjectFormDetails.value.length;
    //     console.log("insertIndex", insertIndex);
    //     publishedSubjectFormDetails.value.push({
    //         isActive: false,
    //         publishedSubjectDetailId,
    //         publishedSubjectFormFieldParentId: 0,
    //     });
    //     publishedSubjectFormDetails.value = deepClone(
    //         publishedSubjectFormDetails.value.map((row, index) => ({
    //             ...row,
    //             isActive: index === insertIndex,
    //         })),
    //     );
    //     await Promise.all([handleProcessFormGeneration(true)]);
    //     loading.value.dynamicLoading["dataCollectionGrid"] = false;
    // }
    async function handleAddForm() {
        dataCollectionStore.selectedPublishedSubjectFormFieldParentId = 0;
        dataCollectionStore.selectedPublishedSubjectFormFieldParentIdRef = 0;
        await handleGenerateFormFields(true);
    }

    async function setBadgeCountAndProgressWorkflowDetailsToChangedForm() {
        const [badgeDetailsData, formFieldCheckProgressStatusWorkflowData] = await Promise.all([
            getBadgeCountDetails(
                true,
                dataCollectionStore.selectedPublishedSubjectFormFieldParentId,
            ),
            getFormFieldCheckProgressStatusWorkflow(
                true,
                dataCollectionStore.selectedPublishedSubjectFormFieldParentId,
            ),
        ]);
        for (const row of publishedSubjectFormFieldDetails.value[
            dataCollectionStore.selectedPublishedSubjectFormFieldParentId
        ]) {
            const badgeCountData = getFilteredItems({
                data: badgeDetailsData,
                type: "object",
                value: row.publishedSubjectFormFieldChildDetailId,
                key: "publishedSubjectFormFieldChildDetailId",
            }) as IFormFieldDiscrepancyBadgeCount[];
            const progressStatusWorkflowData = getFilteredItems({
                data: formFieldCheckProgressStatusWorkflowData,
                type: "object",
                value: row.publishedSubjectFormFieldChildDetailId,
                key: "publishedSubjectFormFieldChildDetailId",
            }) as IFormFieldCheckProgressStatusWorkflowData[];
            row.discrepancyCount =
                getArrayLength(badgeCountData) > 0 ? badgeCountData[0].count : null;
            row.movedFromFrozenToLocked =
                getArrayLength(progressStatusWorkflowData) > 0
                    ? progressStatusWorkflowData[0].isFrozen
                    : false;
        }
    }

    async function handleFormChange() {
        if (
            checkIfKeyExistsInObject(
                dataCollectionStore.activeFormIndex,
                dataCollectionDetails.value,
            ) &&
            getArrayLength(
                Object.keys(
                    dataCollectionDetails.value[dataCollectionStore.activeFormIndex].formDetails,
                ),
            ) > 0
        ) {
            dataCollectionFormDetails.value = deepClone(
                dataCollectionDetails.value[dataCollectionStore.activeFormIndex].formDetails,
            );
            dataCollectionFormDetailsRef.value = deepClone(
                dataCollectionDetails.value[dataCollectionStore.activeFormIndex].formDetailsRef,
            );
        } else {
            await handleGenerateFormFields(false, true);
        }
        dataCollectionStore.isFormIndexChanged = false;
    }

    function getPublishedSubjectFormFieldChildDetailIdsByLogFormRowIndex(
        rowIndexes: number[],
        groupIds: number[],
    ) {
        if (getArrayLength(rowIndexes) === 0) return [];
        const result: number[] = [];
        for (const [dataCollectionRowIndex, dataCollectionRow] of Object.entries(
            logFormDetails.value,
        )) {
            if (!groupIds.includes(Number(dataCollectionRowIndex))) continue;
            for (const groupId of groupIds) {
                if (isEqual(dataCollectionRowIndex, groupId, "number")) {
                    for (const row of rowIndexes) {
                        if (checkIfKeyExistsInObject(row, dataCollectionRow)) {
                            for (const subRow of dataCollectionRow[row]) {
                                if (subRow.isHeading && getArrayLength(subRow.children) > 0) {
                                    for (const childrenRow of subRow.children) {
                                        result.push(
                                            Number(
                                                childrenRow.publishedSubjectFormFieldChildDetailId,
                                            ),
                                        );
                                    }
                                } else if (!subRow.isHeading) {
                                    result.push(
                                        Number(subRow.publishedSubjectFormFieldChildDetailId),
                                    );
                                }
                            }
                        }
                    }
                    break;
                }
            }
            // if (groupId !== -1) {

            // } else {
            //     for (const row of rowIndexes) {
            //         if (checkIfKeyExistsInObject(row, dataCollectionRow)) {
            //             for (const subRow of dataCollectionRow[row]) {
            //                 if (subRow.isHeading && getArrayLength(subRow.children) > 0) {
            //                     for (const childrenRow of subRow.children) {
            //                         result.push(
            //                             Number(childrenRow.publishedSubjectFormFieldChildDetailId),
            //                         );
            //                     }
            //                 } else if (!subRow.isHeading) {
            //                     result.push(Number(subRow.publishedSubjectFormFieldChildDetailId));
            //                 }
            //             }
            //         }
            //     }
            // }
        }
        return result;
    }

    async function handleFormDelete(
        publishedSubjectFormFieldParentId: TNullableNumber,
        rowIndexes: number[],
        groupIds: number[],
    ) {
        loading.value.dynamicLoading["dataCollectionFormDelete"] = true;
        const { status, message } = await deletePublishedFormFieldsAPI({
            publishedSubjectFormFieldParentId,
            publishedSubjectFormFieldChildDetailIds:
                getPublishedSubjectFormFieldChildDetailIdsByLogFormRowIndex(rowIndexes, groupIds),
        });
        if (status === 200) {
            toastStore.success({
                title: "Success",
                message,
            });
            if (publishedSubjectFormFieldParentId) {
                publishedSubjectFormDetails.value.splice(dataCollectionStore.activeFormIndex, 1);
                delete dataCollectionDetails.value[dataCollectionStore.activeFormIndex];
                for (const [index, row] of publishedSubjectFormDetails.value.entries()) {
                    if (index === 0) {
                        dataCollectionStore.activeFormIndex = index;
                        dataCollectionStore.selectedPublishedSubjectFormFieldParentId =
                            row.publishedSubjectFormFieldParentId;
                        row.isActive = true;
                    } else {
                        row.isActive = false;
                    }
                }
                dataCollectionStore.isFormIndexChanged = true;
            } else if (getArrayLength(rowIndexes) > 0) {
                const logFormDetailsRef = deepClone(
                    logFormDetails.value,
                ) as TDataCollectionLogFormDetails;
                const keysToBeDeleted: Record<string, string[]> = {};
                for (const groupId of groupIds) {
                    if (checkIfKeyExistsInObject(groupId, logFormDetailsRef)) {
                        keysToBeDeleted[groupId] = [];
                        for (const row of rowIndexes) {
                            for (const logFormDetailKey of Object.keys(
                                logFormDetailsRef[groupId],
                            )) {
                                if (isEqual(logFormDetailKey, row, "number"))
                                    keysToBeDeleted[groupId].push(logFormDetailKey);
                            }
                        }
                    }
                    //     for (const row of rowIndexes) {
                    //     if (groupId !== -1) {
                    //         for (const [logFormDetailIndex, logFormDetailKey] of Object.keys(
                    //             logFormDetailsRef[groupId],
                    //         )) {
                    //             if (isEqual(logFormDetailIndex, row, "number"))
                    //                 keysToBeDeleted.push(logFormDetailKey);
                    //         }
                    //     } else {
                    //         for (const dataCollectionRow of Object.values(logFormDetailsRef)) {
                    //             for (const [logFormDetailIndex, logFormDetailKey] of Object.keys(
                    //                 dataCollectionRow,
                    //             )) {
                    //                 if (isEqual(logFormDetailIndex, row, "number"))
                    //                     keysToBeDeleted.push(logFormDetailKey);
                    //             }
                    //         }
                    //     }
                    // }
                }
                for (const [groupId, keys] of Object.entries(keysToBeDeleted)) {
                    for (const key of keys) {
                        delete logFormDetailsRef[groupId][key];
                    }
                }
                // if (getArrayLength(keysToBeDeleted) > 0) {
                //     for (const row of keysToBeDeleted) {
                //         if (groupId !== -1) {
                //             delete logFormDetailsRef[groupId][row];
                //         } else {
                //             for (const [
                //                 dataCollectionRowIndex,
                //                 dataCollectionRow,
                //             ] of Object.entries(logFormDetailsRef)) {
                //                 for (const [logFormDetailIndex] of Object.keys(dataCollectionRow)) {
                //                     if (isEqual(logFormDetailIndex, row, "number"))
                //                         delete logFormDetailsRef[dataCollectionRowIndex][row];
                //                 }
                //             }
                //         }
                //     }
                // }
                logFormDetails.value = deepClone(logFormDetailsRef);
                dataCollectionDetails.value[dataCollectionStore.activeFormIndex].logFormDetails =
                    deepClone(logFormDetailsRef);
            }
        } else if (status !== 401) {
            toastStore.error({
                title: "Error",
                message,
            });
        }
        loading.value.dynamicLoading["dataCollectionFormDelete"] = false;
    }

    async function handleFormInactive(inactiveReason: string, callback: () => void) {
        loading.value.dynamicLoading["dataCollectionFormInactive"] = true;
        const inactivationFormDetails = {
            id: dataCollectionStore.queryParamDetails.formId,
            folderId: dataCollectionStore.queryParamDetails.folderId || null,
            type: "inactivate",
        } as IUpdateFormData;

        const { status = 500, message } = await updateFormActivationStatusAPI({
            subjectId: dataCollectionStore.queryParamDetails.subjectId,
            trialId: studyStore.studyInformation.trialId as number,
            environmentId: studyStore.studyInformation.environmentId as number,
            forms: [inactivationFormDetails],
            reason: inactiveReason,
        });
        if (status === 200) {
            toastStore.success({
                title: "Success",
                message,
            });
            callback();
            dataCollectionStore.inactivatedFormDetails = {
                folderId: inactivationFormDetails.folderId,
                formId: inactivationFormDetails.id,
                subjectId: dataCollectionStore.queryParamDetails.subjectId,
                triggerInactivation: true,
            };
        } else {
            toastStore.error({
                title: "Error",
                message,
            });
        }
        loading.value.dynamicLoading["dataCollectionFormInactive"] = false;
    }

    function onPageLoad() {
        if (dataCollectionStore.clinicalTrialsInitialTabIndex === 0) {
            loading.value.dynamicLoading["tableSkeletonLoader"] = true;
            Promise.all([
                subjectsList(),
                studySitesList(),
                quickLinkStore.triggerSaveAsQuickLinkAPI({
                    id: 0,
                    trialId: studyStore.studyInformation.trialId as number,
                    environmentId: studyStore.studyInformation.environmentId as number,
                    page: "Clinical Trials",
                    pageDetails: JSON.stringify({
                        page: PortalPath.ClinicalTrials,
                    }),
                    studyId: 0,
                }),
            ])
                .then(async () => {
                    if (studyStore.loading.processPageQueryOnPageLoad) {
                        processPageQueryOnPageLoad();
                        studyStore.loading.processPageQueryOnPageLoad = false;
                    }
                    await subjectDetailsPaginationList();
                    processPagination(true);
                    loading.value.dynamicLoading["tableSkeletonLoader"] = false;
                })
                .catch(() => {
                    resetTableData();
                    loading.value.dynamicLoading["tableSkeletonLoader"] = false;
                });
        }
    }

    // function isGoToNextForm() {
    //     // return !dataCollectionStore.isSignatureRequiredForSelectedForm && dataCollectionStore.selectedFormName !== 'Subject Completion' && dataCollectionStore.selectedFormName !== 'Subject Disposition'
    //     return true;
    // }

    function handleAuditPopupModalClose(closeModal?: TVoidAction) {
        if (closeModal) closeModal();
        auditHistoryQueryParams.value = { ...defaultAuditHistoryQueryParam() };
        auditFormDetailsData.value = [];
        auditEntryDetailsData.value = null;
        auditHistoryDetailsData.value = [];
        auditHistoryPagination.value.clearCountDetails();
        auditHistoryPagination.value.clearPageDetails();
        dataCollectionStore.dataCollectionDataViewType = "grid";
        dataCollectionStore.selectedFieldId = null;
        currentFormIndex.value = 0;
        publishedSubjectFormAuditDetails.value = [];
    }

    function handleDataCollectionFormSubmitProcessLoader(triggerLoader: boolean) {
        if (triggerLoader) loading.value.dynamicLoading["dataCollectionFormSubmitProcess"] = true;
        else loading.value.dynamicLoading["dataCollectionFormSubmitProcess"] = false;
    }

    async function handleTableSort(columnHeading: string, newOrderType: TSortType) {
        let previousOrder: TSortType = "descending";
        const columnsRef = deepClone(tableColumns.value) as IColumn[];
        for (const [columnsRefIndex, columnsRefRow] of columnsRef.entries()) {
            if (columnsRefIndex > 2) break;
            const columnsRefRowChildren = columnsRefRow.children ? columnsRefRow.children[0] : null;
            if (columnsRefRowChildren && columnsRefRowChildren.header === columnHeading) {
                previousOrder = getSortOrderByAction(newOrderType, "previous");
                columnsRefRowChildren.sortOrder = previousOrder;
            } else if (columnsRefRowChildren) columnsRefRowChildren.sortOrder = "descending";
        }
        tableColumns.value = deepClone(columnsRef);
        if (previousOrder !== "descending") {
            const correctSortKeyName =
                columnHeading === "Subject ID"
                    ? "Field Value"
                    : columnHeading === "Site"
                      ? "Site Name"
                      : "Last Updated";
            orderByDetails.value = {
                [convertWordsIntoCasedWords(correctSortKeyName, "pascal case")]:
                    previousOrder === "ascending" ? "desc" : "asc",
            };
        } else {
            orderByDetails.value = undefined;
        }
        paginationModel.value.clearCountDetails();
        paginationModel.value.pageDetails.currentPage = 1;
        paginationModel.value.pageDetails.lastPage = 0;
        await subjectDetailsPaginationList();
        processPagination();
    }

    const { isModelChanged, model, modelRef } = useUnsavedAlert(
        dataCollectionFormDetails.value,
        dataCollectionFormDetailsRef.value,
    );
    const {
        isModelChanged: isRaiseDiscrepancyModelChanged,
        model: raiseDiscrepancyModel,
        modelRef: raiseDiscrepancyModelRef,
    } = useUnsavedAlert(raiseDiscrepancyFormModel.value, raiseDiscrepancyFormModelRef.value);

    watch(
        () => lastRowVisibility.value,
        async (newValue) => {
            if (newValue && !disableDiscrepancyLazyLoad.value) {
                await handleDiscrepancyLazyLoad();
            }
        },
    );

    watch(
        () => dataCollectionFormDetails.value,
        (newValue) => {
            model.value = newValue;
            modelRef.value = dataCollectionFormDetailsRef.value;
        },
        { deep: true },
    );
    watch(
        () => raiseDiscrepancyFormModel.value,
        (newValue) => {
            raiseDiscrepancyModel.value = newValue;
            raiseDiscrepancyModelRef.value = raiseDiscrepancyFormModelRef.value;
        },
        { deep: true },
    );

    watch(
        () => isModelChanged.value,
        (newValue) => {
            if (newValue) dataCollectionStore.triggerModelChanged = "unsaved";
            else dataCollectionStore.triggerModelChanged = "none";
        },
    );
    watch(
        () => isRaiseDiscrepancyModelChanged.value,
        (newValue) => {
            if (newValue) raiseDiscrepancyModelTriggerChange.value = "unsaved";
            else raiseDiscrepancyModelTriggerChange.value = "none";
        },
    );

    watch(
        () => dataCollectionStore.triggerModelChanged,
        (newValue) => {
            if (newValue) {
                if (newValue === "reset") {
                    dataCollectionStore.triggerModelChanged = "none";
                    resetDataCollectionModel("hard reset");
                    dataCollectionStore.triggerNestedMenuLinkClick = true;
                }
            }
        },
    );
    watch(
        () => raiseDiscrepancyModelTriggerChange.value,
        (newRaiseDiscrepancyModelTriggerChange) => {
            if (newRaiseDiscrepancyModelTriggerChange) {
                if (
                    newRaiseDiscrepancyModelTriggerChange === "reset" &&
                    isRaiseDiscrepancyModelChanged.value
                ) {
                    resetDiscrepancyFormModel();
                    raiseDiscrepancyModelTriggerChange.value = "none";
                }
            }
        },
    );

    watch(
        () => dataCollectionStore.triggerGenerateForm,
        async (newValue) => {
            if (newValue) {
                // await Promise.all([
                //     generateFormFieldsList(),
                //     subjectDetailsBySubjectId(),
                //     publishedSubjectFormFieldDetail(),
                // ]);
                publishedSubjectFormDetails.value = [];
                publishedSubjectFormFieldDetails.value = {};
                dataCollectionDetails.value = {};
                dataCollectionFormDetails.value = {};
                dataCollectionFormDetailsRef.value = {};
                logFormDetails.value = {};
                dataCollectionStore.isLogForm = false;
                dataCollectionStore.isLogFormBeingEnteredForFirstTime = false;
                demographicFormEnteredFieldIds.value = [];
                demographicFormEnteredPublishedSubjectFormFieldChildDetailIds.value = [];
                discrepancyFormFieldMapper.value = {};
                triggerDerivationOnlyOnceIds.value = [];
                if (currentLogFormEditIndex.value !== -1) currentLogFormEditIndex.value = -1;

                const loaderId = "dataCollectionGridGlobal";
                loaderStore.show(loaderId);
                if (
                    dataCollectionStore.queryParamDetails.subjectId &&
                    dataCollectionStore.queryParamDetails.siteId &&
                    dataCollectionStore.queryParamDetails.formId &&
                    dataCollectionStore.selectedFormId
                ) {
                    loading.value.dynamicLoading["dataCollectionGrid"] = true;
                    await Promise.all([
                        generateFormFieldsStructureList(),
                        subjectDetailsBySubjectId(),
                    ]);
                    if (getArrayLength(dataCollectionFormFieldStructureDetails.value) > 0) {
                        await handleGenerateFormFields();
                        loading.value.dynamicLoading["dataCollectionGrid"] = false;
                        if (dataCollectionStore.selectedDiscrepancyDetails.subjectId !== 0)
                            dataCollectionStore.selectedDiscrepancyDetails.showDiscrepancy = true;
                        else if (dataCollectionStore.selectedMyTaskDetails.subjectId !== 0)
                            dataCollectionStore.selectedMyTaskDetails.isProcessLogForm = true;

                        if (
                            dataCollectionStore.isDataAllowedToEnterForTheSubject() &&
                            getArrayLength(demographicFormEnteredFieldIds.value) > 0 &&
                            getArrayLength(
                                demographicFormEnteredPublishedSubjectFormFieldChildDetailIds.value,
                            ) > 0
                        )
                            await changeFormFieldProgressStatus(
                                demographicFormEnteredFieldIds.value,
                                demographicFormEnteredPublishedSubjectFormFieldChildDetailIds.value,
                                "Data Entry Inprogress",
                                "Data Entry Inprogress",
                            );
                        Promise.all([
                            quickLinkStore.triggerSaveAsQuickLinkAPI(
                                {
                                    id: 0,
                                    trialId: studyStore.studyInformation.trialId as number,
                                    environmentId: studyStore.studyInformation
                                        .environmentId as number,
                                    page: "Data Entry",
                                    pageDetails: JSON.stringify({
                                        page: PortalPath.ClinicalTrials,
                                        clinicalTrialsInitialTabIndex: 1,
                                        siteId: dataCollectionStore.queryParamDetails.siteId,
                                        subjectId: dataCollectionStore.queryParamDetails.subjectId,
                                        formId: dataCollectionStore.queryParamDetails.formId,
                                        folderId: dataCollectionStore.queryParamDetails.folderId,
                                        selectedPublishedSubjectFormFieldParentId:
                                            dataCollectionStore.selectedPublishedSubjectFormFieldParentId,
                                        formName: dataCollectionStore.selectedFormName,
                                    }),
                                    studyId: 0,
                                },
                                false,
                            ),
                        ]);
                        logDataEntryCheckValueResult.value = getLogDataEntryHideCheckValue(
                            dataCollectionFormDetails.value,
                            assignedFormFieldNonLogDataValueEditChecks.value,
                        );
                    } else {
                        loading.value.dynamicLoading["dataCollectionGrid"] = false;
                    }
                } else {
                    loading.value.dynamicLoading["dataCollectionGrid"] = false;
                }
                loaderStore.hide(loaderId);

                dataCollectionStore.triggerGenerateForm = false;
            }
        },
    );

    // function checkIfDemographicFormIsFilled() {
    //     let result = false;
    //     for (const row of dataCollectionFormDetails.value) {
    //         // if ((Array.isArray(row.modelValue) && getArrayLength(row.modelValue) === 0) || !row.modelValue) {
    //         //     result = false;

    //         // }
    //         if (row.progressStatus !== "Planned" &&
    //             (convertToLowerCase(String(row.label)) === "subject initials" || )
    //         )
    //     }
    // }

    watch(
        () => dataCollectionStore.isFormIndexChanged,
        async (newIsFormIndexChanged) => {
            if (newIsFormIndexChanged) {
                if (dataCollectionStore.triggerModelChanged === "unsaved") {
                    if (!window.confirm("Reload page confirmation message")) {
                        // return false;
                    } else {
                        await handleFormChange();
                        dataCollectionStore.triggerModelChanged = "reset";
                    }
                } else {
                    await handleFormChange();
                }
            }
        },
    );

    watch(
        () => dataCollectionStore.isFormIndexChanged,
        async (newIsFormIndexChanged) => {
            if (newIsFormIndexChanged) {
                if (dataCollectionStore.triggerModelChanged === "unsaved") {
                    if (!window.confirm("Reload page confirmation message")) {
                        // return false;
                    } else {
                        await handleFormChange();
                        dataCollectionStore.triggerModelChanged = "reset";
                    }
                } else {
                    await handleFormChange();
                }
            }
        },
    );

    function processPageQueryOnPageLoad() {
        if (route.query && dataCollectionStore.clinicalTrialsInitialTabIndex === 0) {
            const {
                search = "",
                subject = "",
                site = "",
                currentPage = "",
                pageLimit = "",
            } = route.query;
            if (search) filterModel.value.search = (search as string) || null;
            if (subject)
                filterModel.value.subjectId = subject
                    ? Number(getDropdownValueByLabel(subjectLookups.value, String(subject)))
                    : null;
            if (site)
                filterModel.value.siteId = site
                    ? Number(getDropdownValueByLabel(studySiteLookups.value, String(site)))
                    : null;
            if (currentPage)
                paginationModel.value.pageDetails.currentPage = Number(currentPage) || 1;
            if (pageLimit)
                paginationModel.value.pageDetails.pageLimit =
                    getArrayLength(
                        getFilteredItems({
                            data: PAGE_LIMIT_OPTIONS,
                            type: "object",
                            value: Number(pageLimit),
                            key: "value",
                        }),
                    ) > 0
                        ? Number(pageLimit)
                        : 8;
        }
    }

    function processPageFilters(type: TPageFilterAction, removeKeys: string[] = []) {
        if (type === "apply")
            applyFiltersToQuery(
                {
                    search: filterModel.value.search,
                    subject: getDropdownLabelByValue(
                        subjectLookups.value,
                        filterModel.value.subjectId as TOptionValue,
                    ),
                    site: getDropdownLabelByValue(
                        studySiteLookups.value,
                        filterModel.value.siteId as TOptionValue,
                    ),
                    currentPage: paginationModel.value.pageDetails.currentPage,
                    pageLimit: paginationModel.value.pageDetails.pageLimit,
                },
                PortalPath.ClinicalTrials,
                removeKeys,
            );
        else removeFiltersFromQuery(removeKeys, PortalPath.ClinicalTrials);
    }

    watch(
        () => studyStore.loading.pageDetails,
        (newValue, oldValue) => {
            if (oldValue && !newValue) {
                if (
                    dataCollectionStore.clinicalTrialsInitialTabIndex === 0 &&
                    !studyStore.loading.processPageQueryOnPageLoad
                ) {
                    filterModel.value = { ...defaultFilterModel() };
                    filterModelRef.value = { ...defaultFilterModel() };
                    processPageFilters("reset");
                }
                onPageLoad();
            }
        },
        { deep: true },
    );

    watch(
        () => dataCollectionStore.queryParamDetails.subjectId,
        () => {
            dataCollectionStore.subjectStatus = "";
            checkIfAllFormsAreFilledBySubjectId();
        },
    );

    onMounted(() => {
        loading.value.setDynamicLoading([
            "auditTable",
            "auditEntryDetails",
            "auditFormDetails",
            "auditHistoryDetails",
            "dataCollectionFormFieldStructure",
            "dataCollectionGrid",
            // "dataCollectionForm", use this if required
            "dataCollectionFormSubmit",
            "dataCollectionFormSubmitProcess",
            "dataCollectionFormDelete",
            "dataCollectionDataDictionaryEntriesList",
            "dataCollectionUnitDictionaryEntriesList",
            "raiseDiscrepancy",
            "discrepancyList",
            "discrepancyLazyLoad",
            "tableSkeletonLoader",
            "dataCollectionFormInactive",
        ]);
        console.log("clinical trials page mounted");
        if (
            dataCollectionStore.clinicalTrialsInitialTabIndex > 1 ||
            dataCollectionStore.clinicalTrialsInitialTabIndex < 0
        )
            dataCollectionStore.clinicalTrialsInitialTabIndex = 0;
        if (studyStore.isStudySelected()) {
            if (dataCollectionStore.clinicalTrialsInitialTabIndex === 0)
                studyStore.loading.processPageQueryOnPageLoad = true;
            if (studyStore.loading.pageDetails) studyStore.loading.pageDetails = false;
            else onPageLoad();
        } else {
            studyStore.triggerModel = true;
        }
        // loadData();
        // handleDefaultPaginationPageCount(paginationModel.value);
        // handlePagination("page", 0, paginationModel.value, true);
        // loadFormsLists();

        Promise.all([dataCollectionStore.formFieldStatusesList(), controlTypesList()]);
    });

    onUnmounted(() => {
        dataCollectionStore.clinicalTrialsInitialTabIndex = 0;
        dataCollectionStore.formLinkDetails = {};
        dataCollectionStore.selectedDiscrepancyDetails = {
            ...getDefaultSelectedDiscrepancyDetails(),
        };
        dataCollectionStore.selectedMyTaskDetails = { ...getDefaultSelectedMyTaskDetails() };
    });

    // @on-log-form-entry-update="
    //                                 async (rowIndex, groupId) => {
    //                                     await handleLogFormEntryUpdateByIndex(rowIndex, groupId);
    //                                 }
    //                             "
</script>

<template>
    <div class="flex flex-col gap-[1rem] pb-[3rem] min-h-max">
        <div class="flex flex-row items-center justify-between">
            <edc-breadcrumb :bread-crumb-details="clinicalTrialBreadCrumbDetails" />
            <!-- <edc-dropdown
                container-class="w-[10rem]"
                :model="globalStore"
                model-key="edcService"
                
                
                :options="[{ label: 'EDC', value: 'EDC' }]"
                @on-select="(selectedOptions) => handleSelect('environment', selectedOptions)"
            /> -->
        </div>
        <!-- class="transition-all md:h-[40rem] lg:h-[55rem] overflow-y-auto bg-white rounded-[var(--border-radius-20)]" -->
        <!-- :class="[
                globalStore.sideMenuExpanded
                    ? 'md:w-[72rem] lg:w-[132rem]'
                    : 'md:w-[65rem] lg:w-[130rem]',
            ]" -->
        <!-- class="transition-all min-h-full bg-white rounded-[var(--border-radius-20)]" -->
        <!-- globalStore.sideMenuExpanded
                    ? 'md:w-[95vw] lg:w-[100%]'
                    : 'md:w-[90vw] lg:w-[100%]', -->
        <!-- :class="[globalStore.dropdownOptionVisible ? 'overflow-y-hidden' : 'overflow-y-auto']" -->
        <div
            class="transition-all min-h-full bg-white rounded-[var(--border-radius-20)] trial-tab-view-container"
            :class="[globalStore.dropdownOptionVisible ? 'overflow-y-auto' : 'overflow-y-auto']"
        >
            <edc-tab-view
                :tabs="['Audit', 'Data Collection']"
                :active-index="dataCollectionStore.clinicalTrialsInitialTabIndex"
                @on-tab-change="
                    async (tabIndex) => {
                        if (tabIndex === 0) {
                            if (isFormEntered.formSaved || isFormEntered.progressStatus) {
                                filterModel = { ...defaultFilterModel() };
                                filterModelRef = { ...defaultFilterModel() };
                                paginationModel.pageDetails.currentPage = 1;
                                paginationModel.pageDetails.lastPage = 0;
                                paginationModel.clearCountDetails();
                                await subjectDetailsPaginationList();
                                processPagination();
                                isFormEntered = { ...defaultFormUpdateDetails() };
                            } else if (getArrayLength(auditTableData) === 0) {
                                onPageLoad();
                            }
                            selectedFormFieldDetails = null;
                            dataCollectionStore.selectedDiscrepancyDetails = {
                                ...getDefaultSelectedDiscrepancyDetails(),
                            };
                            dataCollectionStore.selectedMyTaskDetails = {
                                ...getDefaultSelectedMyTaskDetails(),
                            };
                            loading.dynamicLoading['dataCollectionGrid'] = true;
                        } else {
                            loading.dynamicLoading['dataCollectionGrid'] = true;
                        }
                    }
                "
            >
                <template #audit>
                    <div class="md:max-h-[36rem] lg:max-h-[38rem] xl:max-h-[42rem]">
                        <!-- @on-icon-click="
                                async (row: TTableData) => {
                                    await handleFormIconClick(row);
                                }
                            " -->
                        <edc-data-table
                            table-id="clinicalTrialDataTable"
                            :columns="tableColumns"
                            :table-data="auditTableData"
                            :pagination-model="paginationModel"
                            :loading="
                                loading.dynamicLoading['tableSkeletonLoader'] ||
                                loading.dynamicLoading['auditTable'] ||
                                studyStore.loading.pageDetails
                            "
                            pagination-type="classic"
                            table-style="sticky-header"
                            :enable-row-click="true"
                            :custom-content="true"
                            @on-page-limit-changed="
                                async () => {
                                    if (paginationModel.pageDetails.pageLimit > 8)
                                        processPageFilters('apply', ['currentPage']);
                                    else processPageFilters('reset', ['pageLimit']);
                                    paginationModel.pageDetails.currentPage = 1;
                                    paginationModel.pageDetails.lastPage = 0;
                                    paginationModel.clearCountDetails();
                                    await subjectDetailsPaginationList();
                                    processPagination();
                                }
                            "
                            @on-page-change="
                                async () => {
                                    if (paginationModel.pageDetails.currentPage > 1)
                                        processPageFilters('apply');
                                    else processPageFilters('reset', ['currentPage']);
                                    await subjectDetailsPaginationList();
                                }
                            "
                            @on-sticky-table-horizontal-scroll="
                                (lastFrozenColumnShowShadow: boolean) => {
                                    showShadow = lastFrozenColumnShowShadow;
                                }
                            "
                            @on-sort-change="
                                async (columnHeading, newOrderType) => {
                                    await handleTableSort(columnHeading, newOrderType);
                                }
                            "
                        >
                            <template #custom-content="{ data }">
                                <td
                                    class="font-normal text-left font-12 custom-row min-w-[8rem] max-w-[8rem] lg:min-w-[10rem] lg:max-w-[10rem] !sticky !left-0 !z-[503] bg-[var(--color-white)]"
                                >
                                    <span>{{ data.fieldValue }}</span>
                                </td>
                                <td
                                    class="font-normal text-left font-12 custom-row min-w-[17rem] max-w-[17rem] lg:!min-w-[20rem] lg:!max-w-[20rem] !break-words !sticky !left-[8rem] lg:!left-[10rem] !z-[502] bg-[var(--color-white)]"
                                >
                                    <span>{{ data.siteName }}</span>
                                </td>
                                <td
                                    class="font-normal text-left font-12 custom-row min-w-[10rem] max-w-[10rem] !sticky !left-[25rem] lg:!left-[30rem] !z-[501] bg-[var(--color-white)]"
                                    :class="[showShadow ? 'box-shadow-table-frozen-column' : '']"
                                >
                                    <span
                                        v-tooltip.top="
                                            data.lastUpdated &&
                                            lastUpdatedTime(data.lastUpdated, true)
                                        "
                                        >{{ lastUpdatedTime(data.lastUpdated) }}</span
                                    >
                                </td>
                                <td
                                    v-for="[columnIndex, columnRow] of getAllChildren(
                                        tableColumns.slice(3),
                                    )
                                        .filter((columnRow) => columnRow.show)
                                        .entries()"
                                    :key="columnIndex"
                                    class="font-normal text-left font-12 !min-w-[5rem]"
                                >
                                    <edc-pressable
                                        :container-class="`mx-auto w-fit${disableClickIfFormIsDisabled(data, columnRow) ? ' !cursor-default' : ''}`"
                                        :on-click="
                                            () => {
                                                if (!disableClickIfFormIsDisabled(data, columnRow))
                                                    handleFormIconClick({
                                                        ...data,
                                                        columnRow: { ...columnRow },
                                                    });
                                            }
                                        "
                                    >
                                        <!-- getFormIcon(columnRow.data.progressStatus), -->
                                        <!-- <span class="text-[0.9rem]">{{
                                            String(getProgressStatusIcon(data, columnRow.data))
                                        }}</span> -->
                                        <img
                                            v-if="getProgressStatusIcon(data, columnRow.data)"
                                            v-tooltip.bottom="
                                                getProgressStatusIcon(data, columnRow.data)
                                            "
                                            :src="
                                                getImageSource(
                                                    getFormIcon(
                                                        getProgressStatusIcon(data, columnRow.data),
                                                    ),
                                                    'icon',
                                                )
                                            "
                                            :alt="getAltTagTitle(columnRow.header)"
                                            class="h-[3.5rem]"
                                        />
                                    </edc-pressable>
                                </td>
                            </template>
                        </edc-data-table>
                    </div>
                </template>
                <template #dataCollection>
                    <div class="w-full flex flex-row justify-between gap-[2rem]">
                        <div class="min-w-[68%] lg:min-w-[73%]">
                            <edc-data-collection-form-generation
                                :forms-list="dataCollectionFormDetails"
                                :forms-list-ref="dataCollectionFormDetailsRef"
                                :log-form-details="logFormDetails"
                                :published-subject-form-field-details="
                                    publishedSubjectFormFieldDetails
                                "
                                :data-collection-details="dataCollectionDetails"
                                :current-log-form-edit-index="currentLogFormEditIndex"
                                :published-subject-form-details="publishedSubjectFormDetails"
                                :loading="loading"
                                :is-model-changed="isModelChanged"
                                :log-data-entry-check-value-result="logDataEntryCheckValueResult"
                                :handle-submit="
                                    async (unsavedProgressStatusFieldIds) => {
                                        handleDataCollectionFormSubmitProcessLoader(true);
                                        if (dataCollectionStore.isSignatureRequiredForSelectedForm)
                                            triggerFormSignatureModal();
                                        else {
                                            const submitResult = await handleStandardFormSubmit(
                                                unsavedProgressStatusFieldIds,
                                            );
                                            if (
                                                submitResult &&
                                                dataCollectionStore.isNavigateToSubjectDispositionForm
                                            )
                                                dataCollectionStore.isCheckForNavigateToSubjectDispositionForm = true;
                                        }
                                        handleDataCollectionFormSubmitProcessLoader(false);
                                        // FIXME: For time being automatic going to next task is disabled
                                        // if (isGoToNextForm())
                                        //     dataCollectionStore.triggerNextFormLink = true;
                                    }
                                "
                                :handle-log-form-submit="
                                    async (
                                        unsavedProgressStatusFieldIds,
                                        actionType,
                                        enteredFormGroupIds,
                                    ) => {
                                        handleDataCollectionFormSubmitProcessLoader(true);
                                        const submitResult = await handleLogFormSubmit(
                                            unsavedProgressStatusFieldIds,
                                            actionType,
                                            enteredFormGroupIds,
                                        );
                                        if (
                                            submitResult &&
                                            actionType === 'submit' &&
                                            dataCollectionStore.isNavigateToSubjectDispositionForm
                                        )
                                            dataCollectionStore.isCheckForNavigateToSubjectDispositionForm = true;
                                        handleDataCollectionFormSubmitProcessLoader(false);
                                        // FIXME: For time being automatic going to next task is disabled
                                        // if (actionType === 'submit')
                                        //     dataCollectionStore.triggerNextFormLink = true;
                                    }
                                "
                                :handle-cancel="
                                    () => {
                                        resetDataCollectionModel('reset');
                                    }
                                "
                                :handle-delete="
                                    async (
                                        publishedSubjectFormFieldParentId,
                                        rowIndex,
                                        groupIds,
                                    ) => {
                                        await handleFormDelete(
                                            publishedSubjectFormFieldParentId,
                                            rowIndex,
                                            groupIds,
                                        );
                                    }
                                "
                                :handle-go-next="
                                    () => {
                                        dataCollectionStore.triggerNextFormLink = true;
                                    }
                                "
                                :handle-form-inactive="
                                    async (inactiveReason, callback) => {
                                        await handleFormInactive(inactiveReason, callback);
                                    }
                                "
                                :handle-log-form-entry-update="
                                    async (rowIndex, groupId) => {
                                        await handleLogFormEntryUpdateByIndex(rowIndex, groupId);
                                    }
                                "
                                @on-progress-status-change="
                                    async (
                                        fieldId: number[],
                                        publishedSubjectFormFieldChildDetailId: number[],
                                        formProgressStatus: string,
                                        fieldProgressStatus: string,
                                    ) => {
                                        await handleOnProgressStatusChange(
                                            fieldId,
                                            publishedSubjectFormFieldChildDetailId,
                                            formProgressStatus,
                                            fieldProgressStatus,
                                        );
                                    }
                                "
                                @on-audit-icon-click="
                                    async (publishedSubjectFormFieldChildDetailId: number) => {
                                        dataCollectionStore.selectedFieldId =
                                            publishedSubjectFormFieldChildDetailId;
                                        await handleDataCollectionAuditClick();
                                    }
                                "
                                @on-discrepancy-icon-click="
                                    async (formDetails: IDataCollectionFormDetails) => {
                                        selectedFormFieldDetails = deepClone(formDetails);
                                        dataCollectionStore.selectedFieldId =
                                            formDetails.publishedSubjectFormFieldChildDetailId;
                                        await handleViewDiscrepancyDetails();
                                    }
                                "
                                @on-verify-icon-click="
                                    async (
                                        // publishedSubjectFormFieldChildDetailId: number,
                                        // verifyValue: boolean,
                                        updatedActionDetails: IFormFieldCheckActionAuditData[],
                                    ) => {
                                        // dataCollectionStore.selectedFieldId =
                                        //     publishedSubjectFormFieldChildDetailId;
                                        await processFormFieldCheckActionAuditAndStatus(
                                            updatedActionDetails,
                                        );
                                    }
                                "
                                @on-lock-icon-click="
                                    async (
                                        updatedActionDetails: IFormFieldCheckActionAuditData[],
                                    ) => {
                                        // dataCollectionStore.selectedFieldId =
                                        //     publishedSubjectFormFieldChildDetailId;
                                        await processFormFieldCheckActionAuditAndStatus(
                                            updatedActionDetails,
                                        );
                                    }
                                "
                                @on-freeze-icon-click="
                                    async (
                                        updatedActionDetails: IFormFieldCheckActionAuditData[],
                                    ) => {
                                        // dataCollectionStore.selectedFieldId =
                                        //     publishedSubjectFormFieldChildDetailId;
                                        await processFormFieldCheckActionAuditAndStatus(
                                            updatedActionDetails,
                                        );
                                    }
                                "
                                @on-model-update-after-sign-or-forms-filled="
                                    async () => {
                                        await changeSubjectToVisitInProgress(true);
                                    }
                                "
                                @on-file-preview="
                                    (selectedFile) => {
                                        dataCollectionStore.filePreview = selectedFile;
                                        popupModalStore.show('dataEntryUploadedFilePreview');
                                    }
                                "
                                @on-model-change-process-derivation="
                                    () => {
                                        processFormFieldDerivationOnChange();
                                    }
                                "
                                @on-model-change-check-visibility="
                                    async () => {
                                        await checkForInitialFormFieldVisibility();
                                    }
                                "
                                @on-model-change-check-disable="
                                    async () => {
                                        await checkForInitialFormFieldDisable();
                                    }
                                "
                            >
                                <template #fieldDiscrepancy="{ data, index, afterSave }">
                                    <div
                                        v-if="
                                            checkIfKeyExistsInObject(
                                                data.id,
                                                discrepancyFormFieldMapper,
                                            ) && discrepancyFormFieldMapper[data.id]
                                        "
                                        class="relative flex flex-col items-center justify-center white-bg border-[0.1rem] rounded-[var(--border-radius-5)] p-[1rem]"
                                        :class="[`fieldDiscrepancyContainer${data.id}`]"
                                    >
                                        <edc-pressable
                                            v-if="showGoUpArrow()"
                                            container-class="absolute bottom-[1rem] right-[1rem] z-10"
                                            :on-click="
                                                () => {
                                                    // scrollToStartOfDiscrepancy(index);
                                                    scrollToStartOfDiscrepancy(String(data.label));
                                                }
                                            "
                                        >
                                            <edc-icon
                                                icon="circle-left"
                                                :class="`${commonActionIconClasses('Save')} fill-[var(--color-secondary)] rotate-90 !w-[2rem] !h-[2rem]`"
                                                fill="var(--color-secondary)"
                                            />
                                        </edc-pressable>
                                        <div
                                            class="flex flex-row items-center justify-between w-full"
                                        >
                                            <h2
                                                class="text-[1.3rem] lg:text-[1.6rem] self-start font-bold mb-[1rem]"
                                            >
                                                Discrepancy History
                                            </h2>
                                            <edc-pressable
                                                :on-click="
                                                    () => {
                                                        if (
                                                            checkIfKeyExistsInObject(
                                                                data.id,
                                                                discrepancyFormFieldMapper,
                                                            )
                                                        )
                                                            discrepancyFormFieldMapper[data.id] =
                                                                false;
                                                        resetDiscrepancyModel();
                                                    }
                                                "
                                            >
                                                <edc-icon
                                                    icon="close-icon"
                                                    :class="`${commonActionIconClasses('Delete')} stroke-[var(--color-black)]`"
                                                />
                                            </edc-pressable>
                                        </div>
                                        <edc-breadcrumb
                                            :bread-crumb-details="
                                                breadCrumbDetails.filter(
                                                    (row, rowIndex) => rowIndex !== 3,
                                                )
                                            "
                                            type="discrepancy-modal"
                                        />
                                        <template
                                            v-if="
                                                loading.dynamicLoading['discrepancyList'] &&
                                                !loading.dynamicLoading['discrepancyLazyLoad']
                                            "
                                        >
                                            <edc-discrepancy-timeline
                                                v-for="(numberCount, timelineIndex) of [1, 2, 1, 2]"
                                                :key="`${numberCount}-${timelineIndex}`"
                                                text="Loading"
                                                raised-on="Loading"
                                                :status="numberCount"
                                                role="Loading"
                                                user="Loading"
                                                :loading="
                                                    loading.dynamicLoading['discrepancyList'] &&
                                                    !loading.dynamicLoading['discrepancyLazyLoad']
                                                "
                                                :is-indent="false"
                                                :is-end="false"
                                            />
                                        </template>
                                        <template v-else>
                                            <div
                                                v-if="
                                                    getArrayLength(
                                                        discrepancyStatuses.filter(
                                                            (row) => row.label === 'Raise',
                                                        ),
                                                    ) > 0
                                                "
                                                class="flex flex-row w-full justify-start gap-[1rem] mb-[2rem] relative"
                                            >
                                                <edc-pressable
                                                    :on-click="
                                                        () => {
                                                            handleDiscrepancyActionClick(
                                                                '1',
                                                                'raise',
                                                                0,
                                                            );
                                                        }
                                                    "
                                                >
                                                    <span
                                                        class="font-10 self-end gray-text inline-block py-[0.4rem] px-[1rem] w-fit white-text rounded-[var(--border-radius-4)] bg-[--color-accent]"
                                                        >Raise</span
                                                    >
                                                </edc-pressable>
                                                <div
                                                    v-if="showRaiseDiscrepancySection"
                                                    class="absolute -bottom-[19.3rem] left-0 p-[1rem] w-full z-[1000] white-bg border-[0.1rem] border-[var(--color-gray-line)] rounded-[var(--border-radius-6)]"
                                                >
                                                    <div class="flex flex-row justify-end">
                                                        <edc-pressable
                                                            :on-click="
                                                                () => {
                                                                    showRaiseDiscrepancySection = false;
                                                                }
                                                            "
                                                        >
                                                            <edc-icon
                                                                icon="close-icon"
                                                                :class="`${commonActionIconClasses('Delete')} stroke-[var(--color-black)]`"
                                                            />
                                                        </edc-pressable>
                                                    </div>
                                                    <div class="flex flex-col gap-[1rem] w-fit">
                                                        <edc-text-area
                                                            v-model="
                                                                raiseDiscrepancyFormModel.comments
                                                            "
                                                            container-class="w-[34rem]"
                                                            placeholder="Enter query text"
                                                            label="Query Text"
                                                            :required="true"
                                                            :disabled="loading.isDisabled()"
                                                            :error="
                                                                raiseDiscrepancyErrorModel.comments
                                                            "
                                                        />
                                                    </div>
                                                    <div
                                                        class="flex flex-row items-center self-end gap-[1rem]"
                                                    >
                                                        <edc-action-button
                                                            v-if="isRaiseDiscrepancyModelChanged"
                                                            label="Reset"
                                                            type="cancel"
                                                            :on-click="
                                                                () => {
                                                                    resetDiscrepancyFormModel();
                                                                }
                                                            "
                                                            container-class="rounded-[--border-radius-4] px-[2rem] py-[0.5rem]"
                                                            label-class="font-12"
                                                        />
                                                        <edc-action-button
                                                            label="Submit"
                                                            :on-click="
                                                                async () => {
                                                                    await dataCollectionDiscrepancyModal(
                                                                        'raise',
                                                                        afterSave,
                                                                    );
                                                                }
                                                            "
                                                            container-class="rounded-[--border-radius-4] px-[2rem] py-[0.5rem]"
                                                            label-class="font-12"
                                                            type="submit"
                                                        />
                                                    </div>
                                                </div>
                                            </div>
                                            <template
                                                v-if="
                                                    getArrayLength(
                                                        Object.keys(raisedDiscrepanciesDataDetails),
                                                    ) > 0
                                                "
                                            >
                                                <template
                                                    v-for="[
                                                        raisedDiscrepancyIndex,
                                                        [, raisedDiscrepanciesDataValue],
                                                    ] of Object.entries(
                                                        raisedDiscrepanciesDataDetails,
                                                    ).entries()"
                                                    :key="raisedDiscrepancyIndex"
                                                >
                                                    <template
                                                        v-if="
                                                            getArrayLength(
                                                                raisedDiscrepanciesDataValue.content,
                                                            ) > 0
                                                        "
                                                    >
                                                        <edc-discrepancy-timeline
                                                            v-for="(
                                                                discrepancyRow, discrepancyRowIndex
                                                            ) of raisedDiscrepanciesDataValue.content"
                                                            :key="discrepancyRow.id"
                                                            :text="discrepancyRow.comments"
                                                            :raised-on="discrepancyRow.modifiedDate"
                                                            :status="discrepancyRow.status"
                                                            :role="discrepancyRow.modifiedBy"
                                                            :user="discrepancyRow.user"
                                                            :loading="false"
                                                            :is-indent="discrepancyRow.status !== 1"
                                                            :is-end="
                                                                index ===
                                                                    getArrayLength(
                                                                        Object.entries(
                                                                            raisedDiscrepanciesDataDetails,
                                                                        ),
                                                                    ) -
                                                                        1 &&
                                                                discrepancyRowIndex ===
                                                                    getArrayLength(
                                                                        raisedDiscrepanciesDataValue.content,
                                                                    ) -
                                                                        1
                                                            "
                                                        >
                                                            <template
                                                                v-if="
                                                                    discrepancyRow.status === 1 &&
                                                                    !isDiscrepancyClosed(
                                                                        raisedDiscrepanciesDataValue.content,
                                                                    )
                                                                "
                                                                #action-buttons
                                                            >
                                                                <div
                                                                    class="flex flex-row flex-wrap items-center gap-[1rem] relative w-[80%]"
                                                                >
                                                                    <template
                                                                        v-for="discrepancyStatusRow of discrepancyStatuses.filter(
                                                                            (row) =>
                                                                                row.label !==
                                                                                'Raise',
                                                                        )"
                                                                        :key="
                                                                            discrepancyStatusRow.label
                                                                        "
                                                                    >
                                                                        <edc-pressable
                                                                            :on-click="
                                                                                () => {
                                                                                    handleDiscrepancyActionClick(
                                                                                        discrepancyStatusRow.value,
                                                                                        'others',
                                                                                        raisedDiscrepanciesDataValue.heading
                                                                                            ? raisedDiscrepanciesDataValue
                                                                                                  .heading
                                                                                                  .formFieldDiscrepancyId
                                                                                            : 0,
                                                                                    );
                                                                                }
                                                                            "
                                                                        >
                                                                            <span
                                                                                class="font-10 self-end gray-text inline-block py-[0.1rem] px-[0.4rem] w-fit white-text rounded-[var(--border-radius-4)] bg-[--color-accent]"
                                                                                >{{
                                                                                    discrepancyStatusRow.label
                                                                                }}</span
                                                                            >
                                                                        </edc-pressable>
                                                                    </template>
                                                                    <div
                                                                        v-if="
                                                                            showResolveDiscrepancySection &&
                                                                            raiseDiscrepancyFormModel.formFieldDiscrepancyId ===
                                                                                discrepancyRow.formFieldDiscrepancyId
                                                                        "
                                                                        class="absolute -bottom-[13rem] left-0 p-[1rem] w-full z-[1000] white-bg border-[0.1rem] border-[var(--color-gray-line)] rounded-[var(--border-radius-6)]"
                                                                    >
                                                                        <div
                                                                            class="flex flex-row justify-end"
                                                                        >
                                                                            <edc-pressable
                                                                                :on-click="
                                                                                    () => {
                                                                                        showResolveDiscrepancySection = false;
                                                                                    }
                                                                                "
                                                                            >
                                                                                <edc-icon
                                                                                    icon="close-icon"
                                                                                    :class="`${commonActionIconClasses('Delete')} stroke-[var(--color-black)]`"
                                                                                />
                                                                            </edc-pressable>
                                                                        </div>
                                                                        <div
                                                                            class="flex flex-col gap-[1rem] w-fit"
                                                                            :class="[
                                                                                raiseDiscrepancyFormModel.selectedReason !==
                                                                                    'Other' ||
                                                                                !raiseDiscrepancyFormModel.selectedReason
                                                                                    ? 'mb-[1rem]'
                                                                                    : '',
                                                                            ]"
                                                                        >
                                                                            <edc-dropdown
                                                                                v-model="
                                                                                    raiseDiscrepancyFormModel.selectedReason
                                                                                "
                                                                                :options="
                                                                                    DISCREPANCY_REASONS
                                                                                "
                                                                                container-class="w-[34rem]"
                                                                                default-value="Select a query reason"
                                                                                label="Query Reason"
                                                                                :required="true"
                                                                                :disabled="
                                                                                    loading.isDisabled()
                                                                                "
                                                                                :error="
                                                                                    raiseDiscrepancyFormModel.selectedReason !==
                                                                                    'Other'
                                                                                        ? raiseDiscrepancyErrorModel.comments
                                                                                        : null
                                                                                "
                                                                                @on-select="
                                                                                    () => {
                                                                                        if (
                                                                                            raiseDiscrepancyFormModel.selectedReason !==
                                                                                            'Other'
                                                                                        )
                                                                                            raiseDiscrepancyFormModel.comments =
                                                                                                raiseDiscrepancyFormModel.selectedReason;
                                                                                        else
                                                                                            raiseDiscrepancyFormModel.comments =
                                                                                                null;
                                                                                    }
                                                                                "
                                                                            />
                                                                            <edc-text-area
                                                                                v-if="
                                                                                    raiseDiscrepancyFormModel.selectedReason ===
                                                                                    'Other'
                                                                                "
                                                                                v-model="
                                                                                    raiseDiscrepancyFormModel.comments
                                                                                "
                                                                                container-class="w-[34rem]"
                                                                                placeholder="Enter query text"
                                                                                label="Query Text"
                                                                                :required="true"
                                                                                :disabled="
                                                                                    loading.isDisabled()
                                                                                "
                                                                                :error="
                                                                                    raiseDiscrepancyErrorModel.comments
                                                                                "
                                                                            />
                                                                        </div>
                                                                        <div
                                                                            class="flex flex-row items-center self-end gap-[1rem]"
                                                                        >
                                                                            <edc-action-button
                                                                                v-if="
                                                                                    isRaiseDiscrepancyModelChanged
                                                                                "
                                                                                label="Reset"
                                                                                type="cancel"
                                                                                :on-click="
                                                                                    () => {
                                                                                        resetDiscrepancyFormModel();
                                                                                    }
                                                                                "
                                                                                container-class="rounded-[--border-radius-4] px-[2rem] py-[0.5rem]"
                                                                                label-class="font-12"
                                                                            />
                                                                            <edc-action-button
                                                                                label="Submit"
                                                                                :on-click="
                                                                                    async () => {
                                                                                        await dataCollectionDiscrepancyModal(
                                                                                            'others',
                                                                                            afterSave,
                                                                                        );
                                                                                    }
                                                                                "
                                                                                container-class="rounded-[--border-radius-4] px-[2rem] py-[0.5rem]"
                                                                                label-class="font-12"
                                                                                type="submit"
                                                                            />
                                                                        </div>
                                                                    </div>
                                                                </div>
                                                            </template>
                                                        </edc-discrepancy-timeline>
                                                    </template>
                                                    <template v-else>
                                                        <div
                                                            class="flex flex-row items-center w-full"
                                                        >
                                                            <span class="font-14"
                                                                >No query timeline</span
                                                            >
                                                        </div>
                                                    </template>
                                                </template>
                                            </template>
                                            <template v-else
                                                ><span class="self-start font-14"
                                                    >No records</span
                                                ></template
                                            >
                                        </template>
                                        <div
                                            ref="lastRow"
                                            class="flex flex-row items-center justify-center mt-[1rem]"
                                        >
                                            <edc-spinner
                                                v-if="loading.dynamicLoading['discrepancyLazyLoad']"
                                                loader-class="w-[1rem] h-[1rem] p-[0.1rem]"
                                            />
                                        </div>
                                    </div>
                                </template>
                            </edc-data-collection-form-generation>
                        </div>
                        <!-- <edc-form-menu-link /> -->
                        <edc-form-menu-alternate-link />
                    </div>
                </template>
                <template #actions="{ label: activeTabLabel }">
                    <div class="flex flex-row items-center gap-[2rem] mb-[1rem]">
                        <edc-search-bar
                            v-if="activeTabLabel === 'Audit'"
                            v-model="filterModel.search"
                            element-id="auditSearch"
                            @on-search="
                                async () => {
                                    paginationModel.clearPageDetails();
                                    paginationModel.clearCountDetails();
                                    if (filterModel.search)
                                        processPageFilters('apply', ['currentPage']);
                                    else processPageFilters('reset', ['search', 'currentPage']);
                                    await subjectDetailsPaginationList();
                                    processPagination();
                                    globalStore.triggerSearchBarRefocus('#auditSearch');
                                }
                            "
                        />
                        <edc-pressable
                            v-if="
                                activeTabLabel === 'Data Collection' &&
                                dataCollectionStore.dataCollectionDataViewType === 'grid' &&
                                dataCollectionStore.selectedFormMaxCount > 1 &&
                                getArrayLength(publishedSubjectFormDetails) <
                                    dataCollectionStore.selectedFormMaxCount &&
                                !isModelChanged &&
                                !dataCollectionStore.isLogForm
                            "
                            container-class="hover:opacity-100 rounded-[var(--border-radius-6)] bg-[var(--color-accent)] hover:bg-[var(--color-accent-hover)]"
                            slot-wrapper-class="flex flex-row items-center justify-between gap-x-[1.5rem] px-[1rem] py-[0.6rem] lg:py-[0.7rem]"
                            :show-loader="false"
                            loader-style="skeleton"
                            :on-click="
                                async () => {
                                    await handleAddForm();
                                }
                            "
                        >
                            <span class="text-[1.2rem] white-text">Add Form</span>
                            <edc-icon icon="plus" class="h-[1.5rem]" fill="var(--color-white)" />

                            <template #skeleton-loader>
                                <edc-skeleton-loader
                                    loader-type="rectangle"
                                    container-class="w-[11rem] h-[3.2rem]"
                                />
                            </template>
                        </edc-pressable>
                        <edc-pressable
                            v-if="activeTabLabel === 'Audit'"
                            :on-click="
                                () => {
                                    filterModelRef = deepClone(filterModel);
                                    sideBarStore.show();
                                }
                            "
                        >
                            <img
                                :src="getImageSource(IconKeys.Filter, 'icon')"
                                :alt="getAltTagTitle('filter')"
                                class="md:h-[2rem] lg:h-[2.5rem]"
                            />
                        </edc-pressable>
                    </div>
                </template>
            </edc-tab-view>
        </div>
        <edc-audit-legend />
    </div>
    <edc-side-bar
        @on-filter="
            async () => {
                sideBarStore.hide();
                processPageFilters('apply', ['currentPage']);
                paginationModel.pageDetails.currentPage = 1;
                paginationModel.pageDetails.lastPage = 0;
                paginationModel.clearCountDetails();
                await subjectDetailsPaginationList();
                processPagination();
            }
        "
        @on-reset="
            async () => {
                sideBarStore.hide();
                filterModel.subjectId = null;
                filterModel.siteId = null;
                filterModel = { ...filterModel, siteId: null, subjectId: null };
                processPageFilters('reset', ['site', 'subject', 'currentPage']);
                paginationModel.pageDetails.currentPage = 1;
                paginationModel.pageDetails.lastPage = 0;
                paginationModel.clearCountDetails();
                await subjectDetailsPaginationList();
                processPagination();
            }
        "
        @on-close="
            () => {
                filterModel = deepClone(filterModelRef);
            }
        "
    >
        <edc-dropdown
            :key="`subjectId-${filterModel.subjectId ? filterModel.subjectId : ''}`"
            v-model="filterModel.subjectId"
            container-class="w-full"
            default-value="Select Subject"
            label="Subject"
            :options="subjectLookups"
            option-placement="bottom"
            :enable-clear="true"
            :disabled="loading.isDisabled(subjectOptions.loading)"
            :loading="subjectOptions.loading"
            :ellipse-count="43"
        />
        <edc-dropdown
            :key="`siteId-${filterModel.siteId ? filterModel.siteId : ''}`"
            v-model="filterModel.siteId"
            container-class="w-full"
            default-value="Select site"
            label="Site"
            :options="studySiteLookups"
            option-placement="bottom"
            :enable-clear="true"
            :disabled="loading.isDisabled(studySiteOptions.loading)"
            :loading="studySiteOptions.loading"
            :ellipse-count="43"
        />
        <!-- <edc-dropdown
            :key="`groupId-${filterModel.groupId ? filterModel.groupId : ''}`"
            v-model="filterModel.groupId"
            container-class="w-[32rem]"
            default-value="Select site"
            label="Site"
            :options="[]"
            
            
            option-placement="bottom"
            option-class="w-[32rem]"
            :disabled="loading.isDisabled(subjectOptions.loading)"
            :loading="subjectOptions.loading"
            :ellipse-count="50"
        /> -->
    </edc-side-bar>
    <edc-popup-modal
        modal-id="clinicalTrialAuditAndDataCollectionModal"
        submit-label="Close"
        container-class="min-w-[92vw]"
        :hide-cancel="true"
        :on-submit="
            (closeModal) => {
                closeModal();
                // dataCollectionStore.dataCollectionDataViewType = 'grid';
                // auditHistoryPagination.clearCountDetails();
                // auditHistoryPagination.clearPageDetails();
                handleAuditPopupModalClose();
            }
        "
        :on-cancel="
            (closeModal) => {
                handleAuditPopupModalClose(closeModal);
            }
        "
    >
        <edc-form-audit-details
            :form-details="auditFormDetailsData"
            :entry-details="auditEntryDetailsData"
            :table-columns="auditHistoryColumns"
            :table-data="auditHistoryDetailsData"
            :pagination-model="auditHistoryPagination"
            :loading="loading"
            :form-name="auditHistoryQueryParams.formName"
            :hide-form-details="dataCollectionStore.selectedFieldId !== null"
            :current-form-index="currentFormIndex"
            :published-subject-form-audit-details="publishedSubjectFormAuditDetails"
            :handle-lazy-load="
                async (publishedSubjectFormFieldParentId) =>
                    await handleLazyLoad(publishedSubjectFormFieldParentId)
            "
            @on-form-change="
                async (publishedSubjectFormFieldParentId, selectedFormIndex) => {
                    currentFormIndex = selectedFormIndex;
                    auditHistoryPagination.clearCountDetails();
                    auditHistoryPagination.clearPageDetails();
                    auditHistoryDetailsData = [];
                    await auditHistoryDetailsPaginationList(
                        auditHistoryQueryParams.subjectId,
                        auditHistoryQueryParams.siteId,
                        auditHistoryQueryParams.formId,
                        auditHistoryQueryParams.folderId,
                        dataCollectionStore.selectedFieldId,
                        publishedSubjectFormFieldParentId,
                    );
                }
            "
        />
    </edc-popup-modal>
    <edc-popup-modal
        modal-id="subjectFormSignatureModal"
        container-class="min-w-[92vw]"
        :on-submit="
            async (closeModal) => {
                const submitResult = await handleOnSignatureCompleted(closeModal);
                if (submitResult && dataCollectionStore.isNavigateToSubjectDispositionForm)
                    dataCollectionStore.isCheckForNavigateToSubjectDispositionForm = true;
            }
        "
        :on-cancel="
            (closeModal) => {
                closeModal();
            }
        "
    >
        <span class="text-[1.2rem] font-semibold self-start"
            >Fields marked with an asterisk (<span class="text-[var(--color-error)]">*</span>) are
            required</span
        >
        <div class="grid grid-cols-3 gap-x-[5rem] gap-y-[1rem]">
            <edc-text-input
                v-model="formFieldSignatureFormModel.username"
                container-class="w-full"
                type="text"
                placeholder="Enter username"
                label="Username"
                :required="true"
                :disabled="loading.isDisabled()"
                :error="formFieldSignatureErrorModel.username"
            />
            <edc-text-input
                v-model="formFieldSignatureFormModel.password"
                container-class="w-full"
                type="password"
                placeholder="Enter password"
                label="Password"
                :required="true"
                :disabled="loading.isDisabled()"
                :error="formFieldSignatureErrorModel.password"
            />
        </div>
    </edc-popup-modal>
    <!-- <edc-popup-modal
        modal-id="dataCollectionDiscrepancyModal"
        container-class="min-w-[82rem]"
        submit-label="Close"
        :hide-cancel="true"
        :on-submit="
            (closeModal) => {
                handleRaiseDiscrepancyClose(closeModal);
            }
        "
        :on-cancel="
            (closeModal) => {
                handleRaiseDiscrepancyClose(closeModal);
            }
        "
    >
        <div class="flex flex-row items-start gap-[5rem] min-h-[30rem]">
            <div class="flex flex-col items-center justify-center min-w-[82rem]">
                <h2 class="text-[1.6rem] self-start font-bold mb-[1rem]">Discrepancy History</h2>
                <edc-breadcrumb
                    :bread-crumb-details="breadCrumbDetails.filter((row, index) => index !== 3)"
                    type="discrepancy-modal"
                />
                <template
                    v-if="
                        loading.dynamicLoading['discrepancyList'] &&
                        !loading.dynamicLoading['discrepancyLazyLoad']
                    "
                >
                    <edc-discrepancy-timeline
                        v-for="(numberCount, index) of [1, 2, 1, 2]"
                        :key="`${numberCount}-${index}`"
                        text="Loading"
                        raised-on="Loading"
                        :status="numberCount"
                        role="Loading"
                        :loading="
                            loading.dynamicLoading['discrepancyList'] &&
                            !loading.dynamicLoading['discrepancyLazyLoad']
                        "
                        :is-indent="false"
                        :is-end="false"
                    />
                </template>
                <template v-else>
                    <div class="flex flex-row w-full justify-start gap-[1rem] mb-[2rem] relative">
                        <edc-pressable
                            :on-click="
                                () => {
                                    handleDiscrepancyActionClick('1', 'raise', 0);
                                }
                            "
                        >
                            <span
                                class="font-10 self-end gray-text inline-block py-[0.4rem] px-[1rem] w-fit white-text rounded-[var(--border-radius-4)] bg-[--color-accent]"
                                >Raise</span
                            >
                        </edc-pressable>
                        <div
                            v-if="showRaiseDiscrepancySection"
                            class="absolute -bottom-[18.3rem] left-0 p-[1rem] w-full z-[1000] white-bg border-[0.1rem] border-[var(--color-gray-line)] rounded-[var(--border-radius-6)]"
                        >
                            <div class="flex flex-row justify-end">
                                <edc-pressable
                                    :on-click="
                                        () => {
                                            showRaiseDiscrepancySection = false;
                                        }
                                    "
                                >
                                    <edc-icon
                                        icon="close-icon"
                                        :class="`${commonActionIconClasses('Delete')} stroke-[var(--color-black)]`"
                                    />
                                </edc-pressable>
                            </div>
                            <div class="flex flex-col gap-[1rem] w-fit">
                                <edc-text-area
                                    v-model="raiseDiscrepancyFormModel.comments"
                                    container-class="w-[34rem]"
                                    placeholder="Enter comments"
                                    label="Comments"
                                    :required="true"
                                    :disabled="loading.isDisabled()"
                                    :error="raiseDiscrepancyErrorModel.comments"
                                />
                            </div>
                            <div class="flex flex-row items-center self-end gap-[1rem]">
                                <edc-action-button
                                    v-if="isRaiseDiscrepancyModelChanged"
                                    label="Reset"
                                    type="cancel"
                                    :on-click="
                                        () => {
                                            resetDiscrepancyFormModel();
                                        }
                                    "
                                    container-class="rounded-[--border-radius-4] px-[2rem] py-[0.5rem]"
                                    label-class="font-12"
                                />
                                <edc-action-button
                                    label="Submit"
                                    :on-click="
                                        async () => {
                                            await dataCollectionDiscrepancyModal('raise');
                                        }
                                    "
                                    container-class="rounded-[--border-radius-4] px-[2rem] py-[0.5rem]"
                                    label-class="font-12"
                                    type="submit"
                                />
                            </div>
                        </div>
                    </div>
                    <template
                        v-if="getArrayLength(Object.keys(raisedDiscrepanciesDataDetails)) > 0"
                    >
                        <template
                            v-for="[index, [, raisedDiscrepanciesDataValue]] of Object.entries(
                                raisedDiscrepanciesDataDetails,
                            ).entries()"
                            :key="index"
                        >
                            <template
                                v-if="getArrayLength(raisedDiscrepanciesDataValue.content) > 0"
                            >
                                <edc-discrepancy-timeline
                                    v-for="(
                                        discrepancyRow, discrepancyRowIndex
                                    ) of raisedDiscrepanciesDataValue.content"
                                    :key="discrepancyRow.id"
                                    :text="discrepancyRow.comments"
                                    :raised-on="discrepancyRow.modifiedDate"
                                    :status="discrepancyRow.status"
                                    :role="discrepancyRow.modifiedBy"
                                    :loading="false"
                                    :is-indent="discrepancyRow.status !== 1"
                                    :is-end="
                                        index ===
                                            getArrayLength(
                                                Object.entries(raisedDiscrepanciesDataDetails),
                                            ) -
                                                1 &&
                                        discrepancyRowIndex ===
                                            getArrayLength(raisedDiscrepanciesDataValue.content) - 1
                                    "
                                >
                                    <template
                                        v-if="
                                            discrepancyRow.status === 1 &&
                                            !isDiscrepancyClosed(
                                                raisedDiscrepanciesDataValue.content,
                                            )
                                        "
                                        #action-buttons
                                    >
                                        <div
                                            class="flex flex-row flex-wrap items-center gap-[1rem] relative w-[80%]"
                                        >
                                            <template
                                                v-for="discrepancyStatusRow of discrepancyStatuses.filter(
                                                    (row) => row.label !== 'Raise',
                                                )"
                                                :key="discrepancyStatusRow.label"
                                            >
                                                <edc-pressable
                                                    :on-click="
                                                        () => {
                                                            handleDiscrepancyActionClick(
                                                                discrepancyStatusRow.value,
                                                                'others',
                                                                raisedDiscrepanciesDataValue.heading
                                                                    ? raisedDiscrepanciesDataValue
                                                                          .heading
                                                                          .formFieldDiscrepancyId
                                                                    : 0,
                                                            );
                                                        }
                                                    "
                                                >
                                                    <span
                                                        class="font-10 self-end gray-text inline-block py-[0.1rem] px-[0.4rem] w-fit white-text rounded-[var(--border-radius-4)] bg-[--color-accent]"
                                                        >{{ discrepancyStatusRow.label }}</span
                                                    >
                                                </edc-pressable>
                                            </template>
                                            <div
                                                v-if="
                                                    showResolveDiscrepancySection &&
                                                    raiseDiscrepancyFormModel.formFieldDiscrepancyId ===
                                                        discrepancyRow.formFieldDiscrepancyId
                                                "
                                                class="absolute -bottom-[18.3rem] left-0 p-[1rem] w-full z-[1000] white-bg border-[0.1rem] border-[var(--color-gray-line)] rounded-[var(--border-radius-6)]"
                                            >
                                                <div class="flex flex-row justify-end">
                                                    <edc-pressable
                                                        :on-click="
                                                            () => {
                                                                showResolveDiscrepancySection = false;
                                                            }
                                                        "
                                                    >
                                                        <edc-icon
                                                            icon="close-icon"
                                                            :class="`${commonActionIconClasses('Delete')} stroke-[var(--color-black)]`"
                                                        />
                                                    </edc-pressable>
                                                </div>
                                                <div class="flex flex-col gap-[1rem] w-fit">
                                                    <edc-text-area
                                                        v-model="raiseDiscrepancyFormModel.comments"
                                                        container-class="w-[34rem]"
                                                        placeholder="Enter comments"
                                                        label="Comments"
                                                        :required="true"
                                                        :disabled="loading.isDisabled()"
                                                        :error="raiseDiscrepancyErrorModel.comments"
                                                    />
                                                </div>
                                                <div
                                                    class="flex flex-row items-center self-end gap-[1rem]"
                                                >
                                                    <edc-action-button
                                                        v-if="isRaiseDiscrepancyModelChanged"
                                                        label="Reset"
                                                        type="cancel"
                                                        :on-click="
                                                            () => {
                                                                resetDiscrepancyFormModel();
                                                            }
                                                        "
                                                        container-class="rounded-[--border-radius-4] px-[2rem] py-[0.5rem]"
                                                        label-class="font-12"
                                                    />
                                                    <edc-action-button
                                                        label="Submit"
                                                        :on-click="
                                                            async () => {
                                                                await dataCollectionDiscrepancyModal(
                                                                    'others',
                                                                );
                                                            }
                                                        "
                                                        container-class="rounded-[--border-radius-4] px-[2rem] py-[0.5rem]"
                                                        label-class="font-12"
                                                        type="submit"
                                                    />
                                                </div>
                                            </div>
                                        </div>
                                    </template>
                                </edc-discrepancy-timeline>
                            </template>
                            <template v-else>
                                <div class="flex flex-row items-center w-full">
                                    <span class="font-14">No query timeline</span>
                                </div>
                            </template>
                        </template>
                    </template>
                    <template v-else><span class="self-start font-14">No records</span></template>
                </template>
                <div ref="lastRow" class="flex flex-row items-center justify-center mt-[1rem]">
                    <edc-spinner
                        v-if="loading.dynamicLoading['discrepancyLazyLoad']"
                        loader-class="w-[1rem] h-[1rem] p-[0.1rem]"
                    />
                </div>
            </div>
        </div>
    </edc-popup-modal> -->
    <edc-file-preview
        modal-id="dataEntryUploadedFilePreview"
        :image="dataCollectionStore.filePreview"
    />
</template>

<style>
    div.table-wrapper[skeleton] table#clinicalTrialDataTable thead tr:nth-child(2) th:nth-child(1) {
        min-width: 8.278rem;
        max-width: 8.278rem;
    }
    div.table-wrapper[skeleton] table#clinicalTrialDataTable thead tr:nth-child(2) th:nth-child(2) {
        min-width: 17rem;
        max-width: 17rem;
    }
    div.table-wrapper[skeleton] table#clinicalTrialDataTable thead tr:nth-child(2) th:nth-child(3) {
        min-width: 10rem;
        max-width: 10rem;
    }
    @media screen and (min-width: 1024px) {
        div.table-wrapper[skeleton]
            table#clinicalTrialDataTable
            thead
            tr:nth-child(2)
            th:nth-child(1) {
            min-width: 10rem;
            max-width: 10rem;
        }
        div.table-wrapper[skeleton]
            table#clinicalTrialDataTable
            thead
            tr:nth-child(2)
            th:nth-child(2) {
            min-width: 20rem;
            max-width: 20rem;
        }
        div.table-wrapper[skeleton]
            table#clinicalTrialDataTable
            thead
            tr:nth-child(2)
            th:nth-child(3) {
            min-width: 10.377rem;
            max-width: 10.377rem;
        }
    }
</style>
