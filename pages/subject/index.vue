<script setup lang="ts">
    import { PAGE_LIMIT_OPTIONS, SUBJECT_GENDER_OPTIONS } from "~/constants/options";
    import DropdownOption from "~/services/apis/data/dropdown-option";
    import Loading, { setLoaderForArrayDatas } from "~/services/apis/data/loading";
    import { controlTypesListAPI } from "~/services/apis/handlers/admin/form-field";
    import {
        addEventAPI,
        addVisitAPI,
        onboardSubjectExportDataAPI,
        onboardSubjectPaginationListAPI,
        subjectDeleteAPI,
        subjectDetailsBySubjectIdAPI,
        subjectStatusesListAPI,
        subjectUpdateAPI,
        updateFormActivationStatusAPI,
        type IUpdateFormData,
    } from "~/services/apis/handlers/admin/subject";
    import { subjectFormConfigListByTrialIdAPI } from "~/services/apis/handlers/admin/subject-form-config";
    import type { ISubjectFormConfigData } from "~/services/apis/handlers/types/subject-form-config-types";
    import type {
        ISubjectData,
        ISubjectDetail,
    } from "~/services/apis/handlers/types/subject-types";
    import useGlobalStore from "~/stores/global";
    import usePopupModalStore from "~/stores/popup-modal";
    import useSideBarStore from "~/stores/side-bar";
    import useStudyStore from "~/stores/study";
    import useToastStore from "~/stores/toast";
    import type {
        IOptions,
        TAdminFormAction,
        TNullableDate,
        TNullableNumber,
        TNullableString,
        TOptionValue,
        TPageFilterAction,
        TTableData,
        TTableLoaderDetail,
        TUnsavedFormAction,
        TVoidAction,
    } from "~/types/common";
    import type { IColumn, TSortType } from "~/types/datatable";
    import type {
        ICalendarProps,
        IDropdownProps,
        IFormGeneration,
        ITextAreaProps,
        ITextInputProps,
        TModelValue,
    } from "~/types/form-generation";
    import PaginationModel from "~/utils/pagination";
    import { formFieldsSlot } from "~/utils/form-generation";
    import { siteListByStudyIdAPI } from "~/services/apis/handlers/admin/site";
    import {
        publishedFormsListByTrialIdAndEnvironmentIdAPI,
        publishedTrialVisitsListByTrialIdAndEnvironmentIdAPI,
    } from "~/services/apis/handlers/portal/study";
    import useQuickLinkStore from "~/stores/quick-link";
    import type {
        IPublishedFormData,
        IPublishedTrialVisit,
        IUpdatePublishedFormFolder,
    } from "~/services/apis/handlers/types/admin/release-version-detail-types";
    import useUserStore from "~/stores/user";

    definePageMeta({
        layout: "portal-layout",
    });

    useHead({
        title: seoPageTitle("Onboard Subjects"),
    });

    interface IFilterModel {
        search: TNullableString;
        siteId: TNullableNumber;
        statusId: TNullableNumber;
    }

    interface ISubjectFormDetails extends IFormGeneration {
        subjectFormConfigId: number;
        controlTypeId: number;
    }

    interface IAddVisitFormModel {
        name: TNullableString;
        oid: TNullableString;
        access: TNullableNumber;
        start: TNullableNumber;
        target: TNullableNumber;
        end: TNullableNumber;
        overDue: TNullableNumber;
        close: TNullableNumber;
        reusable: boolean;
    }

    interface IAddVisitErrorModel {
        name: string;
        oid: string;
    }

    interface IAddEventFormModel {
        trialVisitId: TNullableNumber;
        isUnscheduled: boolean;
        formId: TNullableNumber;
        formCount: number;
    }

    interface IAddEventErrorModel {
        trialVisitId: string;
        formId: string;
    }

    const defaultFilterModel = (): IFilterModel => ({
        search: null,
        siteId: null,
        statusId: null,
    });

    const defaultAddVisitFormModel = (): IAddVisitFormModel => ({
        name: null,
        oid: null,
        access: 0,
        start: 0,
        target: 0,
        end: 0,
        overDue: 0,
        close: 0,
        reusable: false,
    });

    const defaultAddVisitErrorModel = (): IAddVisitErrorModel => ({
        name: "",
        oid: "",
    });

    const defaultAddEventFormModel = (): IAddEventFormModel => ({
        formId: null,
        trialVisitId: null,
        isUnscheduled: false,
        formCount: 0,
    });

    const defaultAddEventErrorModel = (): IAddEventErrorModel => ({
        formId: "",
        trialVisitId: "",
    });

    const globalStore = useGlobalStore();
    const toastStore = useToastStore();
    const sideBarStore = useSideBarStore();
    const popupModalStore = usePopupModalStore();
    const studyStore = useStudyStore();
    const quickLinkStore = useQuickLinkStore();
    const userStore = useUserStore();
    const route = useRoute();

    const columns = ref<IColumn[]>([]);

    const subjectModelTriggerChange = ref<TUnsavedFormAction>("none");
    const addVisitModelTriggerChange = ref<TUnsavedFormAction>("none");
    const addEventModelTriggerChange = ref<TUnsavedFormAction>("none");
    const paginationModel = ref<PaginationModel>(new PaginationModel());
    const tableData = ref<TTableData[]>([]);
    const filterModel = ref<IFilterModel>({ ...defaultFilterModel() });
    const filterModelRef = ref<IFilterModel>({ ...defaultFilterModel() });
    const loading = ref<Loading>(new Loading());
    const formAction = ref<TAdminFormAction>("View");
    const addEventFormAction = ref<TAdminFormAction>("View");
    const addVisitFormAction = ref<TAdminFormAction>("View");
    const subjectFormConfigList = ref<ISubjectFormConfigData[]>([]);
    const subjectDetails = ref<ISubjectData | null>(null);
    const subjectFormDetails = ref<ISubjectFormDetails[]>([]);
    const subjectFormDetailsRef = ref<ISubjectFormDetails[]>([]);
    const controlTypeOptions = ref<DropdownOption>(new DropdownOption());
    const studySiteOptions = ref<DropdownOption>(new DropdownOption());
    const selectedSubjectSiteId = ref<TNullableNumber>(null);
    const selectedSubjectSiteRefId = ref<TNullableNumber>(null);
    const selectedSubjectSiteIdError = ref<TNullableString>(null);
    const addVisitFormModel = ref<IAddVisitFormModel>({ ...defaultAddVisitFormModel() });
    const addVisitFormModelRef = ref<IAddVisitFormModel>({ ...defaultAddVisitFormModel() });
    const addVisitErrorModel = ref<IAddVisitErrorModel>({ ...defaultAddVisitErrorModel() });
    const addEventFormModel = ref<IAddEventFormModel>({ ...defaultAddEventFormModel() });
    const addEventFormModelRef = ref<IAddEventFormModel>({ ...defaultAddEventFormModel() });
    const addEventErrorModel = ref<IAddEventErrorModel>({ ...defaultAddEventErrorModel() });
    const visitOptions = ref<DropdownOption>(new DropdownOption());
    const formOptions = ref<DropdownOption>(new DropdownOption());
    const subjectStatusOptions = ref<DropdownOption>(new DropdownOption());
    const tableLoaderDetails = ref<TTableLoaderDetail>({});
    const siteName = ref<string>("");
    // const formFieldsSlotDetails = ref(formFieldsSlot());
    const orderByDetails = ref<Record<string, "asc" | "desc"> | undefined>(undefined);

    const controlTypeLookups = computed(() =>
        getOptionsList(controlTypeOptions.value.options, "name", "id"),
    );
    const studySiteLookups = computed(() =>
        getOptionsList(studySiteOptions.value.options, "siteName", "siteId"),
    );
    const visitLookups = computed(() => getOptionsList(visitOptions.value.options, "name", "id"));
    const formLookups = computed(() => {
        // const options = getOptionsList(formOptions.value.options, "formName", "id");
        const result: IOptions[] = [];
        if (addEventFormModel.value.trialVisitId) {
            for (const row of formOptions.value.options as unknown as IPublishedFormData[]) {
                result.push({
                    label: `${row.formName}${row.formCount > 0 ? ` (${row.formCount})` : ""}`,
                    value: row.id,
                });
            }
        }
        return result;
    });
    const subjectStatusLookups = computed(() =>
        getOptionsList(subjectStatusOptions.value.options, "statusName", "id"),
    );
    const isAddEventAllowed = computed(() =>
        checkIfActionIsAllowed(studyStore.getRoleIdBySiteId(), [
            RolePermissionType.AddEventWithinAVisitAddNewRowForLogeCRF,
        ]),
    );
    const isAddVisitAllowed = computed(() =>
        checkIfActionIsAllowed(studyStore.getRoleIdBySiteId(), [
            RolePermissionType.AddUNSUnscheduledVisit,
        ]),
    );
    const isOnboardSubjectActionAllowed = computed(() =>
        checkIfActionIsAllowed(studyStore.getRoleIdBySiteId(), [
            RolePermissionType.SubjectEnrollment,
        ]),
    );
    const isSubjectFormActivationAllowed = computed(() =>
        [1, 2, 3, 4, 5, 15].includes(userStore.getDetails().roleId),
    );

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

    async function subjectStatusesList() {
        subjectStatusOptions.value.loading = true;
        const { status, data, message } = await subjectStatusesListAPI();
        if (status === 200) {
            subjectStatusOptions.value.options = deepClone(data);
        } else if (status !== 401) {
            subjectStatusOptions.value.options = [];
            toastStore.error({
                title: "Error",
                message,
            });
        }
        subjectStatusOptions.value.loading = false;
    }

    function setTableColumns() {
        const result: IColumn[] = [];
        if (getArrayLength(subjectFormConfigList.value) > 0) {
            for (const row of subjectFormConfigList.value) {
                result.push({
                    field: "fieldValue",
                    header: row.label,
                    icon: false,
                    show: true,
                    sort: true,
                    sortOrder: "descending",
                });
            }
        } else {
            result.push({
                field: "fieldValue",
                header: "Subject ID",
                icon: false,
                show: true,
                sort: true,
                sortOrder: "descending",
            });
        }
        result.splice(result.length, 0, {
            field: "siteName",
            header: "Site Name",
            icon: false,
            show: true,
            sort: true,
            sortOrder: "descending",
        });
        columns.value = deepClone(result);
    }

    function setIsUnscheduled() {
        if (addEventFormModel.value.trialVisitId) {
            for (const row of visitOptions.value.options as unknown as IPublishedTrialVisit[]) {
                if (row.id === addEventFormModel.value.trialVisitId) {
                    addEventFormModel.value.isUnscheduled = row.isUnscheduled;
                    break;
                }
            }
        } else {
            addEventFormModel.value.isUnscheduled = false;
        }
    }

    async function subjectFormConfigListByStudyId() {
        loading.value.dynamicLoading["subjectFormConfigList"] = true;
        const { status, message, data } = await subjectFormConfigListByTrialIdAPI(
            String(studyStore.studyInformation.studyId),
        );
        if (status === 200) {
            subjectFormConfigList.value = deepClone(data);
        } else if (status !== 401) {
            toastStore.error({
                title: "Error",
                message,
            });
            subjectFormConfigList.value = [];
        }
        loading.value.dynamicLoading["subjectFormConfigList"] = false;
    }

    function getSubjectFormConfigIdByLabel(
        subjectDetailsList: ISubjectDetail[],
        formConfigLabel: string,
    ) {
        let formConfigId = -1;
        for (const row of subjectDetailsList) {
            if (row.label === formConfigLabel) {
                formConfigId = Number(row.subjectFormConfigId);
                break;
            }
        }
        return formConfigId;
    }

    function setTableData(data: ISubjectData[]) {
        const result: TTableData = [];
        for (const row of data) {
            const obj: Record<string, any> = {
                id: row.subjectId,
                siteName: row.siteName,
            };

            // if (row.subjectDetails) {
            //     for (const subRow of row.subjectDetails) {
            //         const subjectFormConfigDetails = getFilteredItems({
            //             data: subjectFormConfigList.value,
            //             type: "object",
            //             key: "id",
            //             value: subRow.subjectFormConfigId,
            //         }) as ISubjectFormConfigData[];
            //         if (getArrayLength(subjectFormConfigDetails) > 0)
            //             obj[subRow.label] = [3, 4, 5].includes(
            //                 subjectFormConfigDetails[0].controlTypeId,
            //             )
            //                 ? formatDate(subRow.fieldValue as TNullableDate, "DD MMM YYYY")
            //                 : subRow.fieldValue;
            //         else obj[subRow.label] = subRow.fieldValue;
            //     }
            // }
            if (row.dynamicProperties && getArrayLength(Object.keys(row.dynamicProperties)) > 0) {
                for (const [fieldLabel, fieldValue] of Object.entries(row.dynamicProperties)) {
                    const subjectFormConfigDetails = getFilteredItems({
                        data: subjectFormConfigList.value,
                        type: "object",
                        key: "id",
                        value: getSubjectFormConfigIdByLabel(row.subjectDetails, fieldLabel),
                    }) as ISubjectFormConfigData[];
                    if (getArrayLength(subjectFormConfigDetails) > 0)
                        obj[`${subjectFormConfigDetails[0].orderNumber}_${fieldLabel}`] = [
                            3, 4, 5,
                        ].includes(subjectFormConfigDetails[0].controlTypeId)
                            ? formatDate(fieldValue as TNullableDate, "DD MMM YYYY")
                            : fieldValue;
                    else obj[fieldLabel] = fieldValue;
                }
            }
            result.push({ ...obj });
        }
        return result;
    }

    function resetTableData() {
        tableData.value = [];
        paginationModel.value.clearPageDetails();
        paginationModel.value.clearCountDetails();
    }

    async function onboardSubjectPaginationList() {
        loading.value.table = true;
        const { status, data, message } = await onboardSubjectPaginationListAPI(
            getAPIFilters({
                search: filterModel.value.search,
                filter: {
                    trialId: studyStore.studyInformation.trialId,
                    environmentId: studyStore.studyInformation.environmentId,
                    siteId: filterModel.value.siteId,
                    status: filterModel.value.statusId,
                },
                top: paginationModel.value.pageDetails.pageLimit,
                page: paginationModel.value.pageDetails.currentPage,
                orderBy: orderByDetails.value,
            }),
        );
        if (status === 200) {
            const { items = [], total = 0 } = data || {};
            toastStore.success({
                title: "Success",
                message,
            });
            const tableDataItems = setTableData(items);
            tableLoaderDetails.value = setLoaderForArrayDatas(Object.keys(tableDataItems));
            tableData.value = deepClone(tableDataItems);
            paginationModel.value.pageDetails.totalRecords = total;
            paginationModel.value.pageDetails.lastPage = paginationModel.value.getLastPage();
        } else if (status !== 401) {
            toastStore.error({
                title: "Error",
                message,
            });
            resetTableData();
        }
        loading.value.table = false;
    }

    function resetModel(closeModal?: TVoidAction) {
        if (closeModal) closeModal();
        selectedSubjectSiteId.value = null;
        selectedSubjectSiteRefId.value = null;
        subjectFormDetails.value = [];
        subjectFormDetailsRef.value = [];
        subjectDetails.value = null;
        if (formAction.value !== "View") formAction.value = "View";
    }

    function processFormGeneration() {
        const result: ISubjectFormDetails[] = [];
        for (const formConfigRow of subjectFormConfigList.value) {
            const controlTypeDetails = getFilteredItems({
                data: controlTypeLookups.value,
                type: "object",
                key: "value",
                value: formConfigRow.controlTypeId,
            });
            const subjectDetailsBySubjectFormId = getFilteredItems({
                data: subjectDetails.value ? subjectDetails.value.subjectDetails : [],
                type: "object",
                key: "subjectFormConfigId",
                value: formConfigRow.id,
            });
            let formObj: Record<string, any> = {
                subjectFormConfigId: formConfigRow.id,
                elementId: convertWordsIntoCasedWords(formConfigRow.label || "", "camel case"),
                modelValue: formConfigRow.defaultValue
                    ? formConfigRow.defaultValue
                    : getArrayLength(subjectDetailsBySubjectFormId) > 0
                      ? subjectDetailsBySubjectFormId[0].fieldValue
                      : null,
                // modelValue:
                //     checkIfKeyExistsInObject()
                //         ? subjectDetailsBySubjectFormId[0].fieldValue
                //         : null,
                controlTypeId: formConfigRow.controlTypeId,
                label: formConfigRow.label,
                containerClass: "w-full",
                showHelpText: !!formConfigRow.helpText,
                helpText: formConfigRow.helpText,
                disabled: formConfigRow.readOnly,
            };
            const { type, fractionalPart, maxLength, minLength, wholePart, dateFormat } =
                getValidationPropsDetails(formConfigRow.format, controlTypeDetails[0].value);
            if (getArrayLength(controlTypeDetails) > 0) {
                if (controlTypeDetails[0].value === 1) {
                    formObj = {
                        ...formObj,
                        type,
                        // elementId,
                        error: null,
                        // inputContainerClass,
                        containerWrapperClass: "w-full",
                        minLength,
                        maxLength,
                        wholePart,
                        fractionalPart,
                        placeholder: `Please enter a ${convertToLowerCase(formConfigRow.label)}`,
                        // readOnly: false,
                        required: formConfigRow.isMandatory,
                    } as ITextInputProps;
                } else if (controlTypeDetails[0].value === 7) {
                    formObj = {
                        ...formObj,
                        options: formConfigRow.label === "Gender" ? SUBJECT_GENDER_OPTIONS : [],
                        // defaultValue: `Please select a ${convertToLowerCase(formConfigRow.label)}`,
                        defaultValue: `Please select an option`,
                        // elementId,
                        enableClear: !formConfigRow.isMandatory,
                        error: null,
                        // inputContainerClass,
                        // labelAction,
                        loading: false,
                        // optionClass: "w-[30rem] lg:w-[27rem] xl:w-[34rem]",
                        // optionOffset,
                        optionPlacement: "bottom",
                        // optionPosition,
                        // readOnly,
                        required: formConfigRow.isMandatory,
                        // resetOption,
                    } as IDropdownProps;
                } else if (controlTypeDetails[0].value === 2) {
                    formObj = {
                        ...formObj,
                        // cols,
                        // elementId,
                        // ellipseCount,
                        error: null,
                        // inputContainerClass,
                        // max,
                        placeholder: `Please enter a ${convertToLowerCase(formConfigRow.label)}`,
                        // readOnly,
                        required: formConfigRow.isMandatory,
                        // rows,
                        // showCharacterCount,
                    } as ITextAreaProps;
                } else if ([3, 4, 5].includes(controlTypeDetails[0].value)) {
                    formObj = {
                        ...formObj,
                        disabledDates: [],
                        // elementId,
                        error: null,
                        format: dateFormat,
                        // maxDate,
                        // minDate,
                        pickerClass: "w-[30rem] lg:w-[27rem] xl:w-[34rem]",
                        pickerOffset: 0,
                        pickerPlacement: "bottom",
                        // pickerPosition,
                        placeholder: `Please select a ${convertToLowerCase(formConfigRow.label)}`,
                        // readOnly,
                        required: formConfigRow.isMandatory,
                        type:
                            controlTypeDetails[0].value === 3
                                ? "date"
                                : controlTypeDetails[0].value === 4
                                  ? "time"
                                  : "datetime",
                    } as ICalendarProps;
                }
            }
            result.push({ ...(formObj as ISubjectFormDetails) });
        }
        subjectFormDetails.value = deepClone(result);
        subjectFormDetailsRef.value = deepClone(result);
    }

    async function subjectDetailsBySubjectId(subjectId: number) {
        loading.value.form = true;
        const { message, data, status } = await subjectDetailsBySubjectIdAPI(subjectId);
        if (status === 200) {
            subjectDetails.value = deepClone(data);
            if (data) {
                selectedSubjectSiteId.value = data.siteId;
                selectedSubjectSiteRefId.value = data.siteId;
            }
        } else {
            toastStore.error({
                title: "Error",
                message,
            });
            subjectDetails.value = null;
        }
        loading.value.form = false;
    }

    async function triggerAddOrEditSubject(action: "Add" | "Update", data?: TTableData) {
        loading.value.dynamicLoading["formGeneration"] = true;
        formAction.value = action;
        if (action === "Update") {
            await subjectDetailsBySubjectId(data ? Number(data.id) : 0);
        }
        // if (getArrayLength(subjectFormConfigList.value) === 0)
        //     await Promise.all([subjectFormConfigListByTrialId()]);

        processFormGeneration();
        popupModalStore.show("onboardSubjectModal");
        loading.value.dynamicLoading["formGeneration"] = false;
    }

    function validateAll() {
        let isError = false;
        for (const [index, subjectFormDetailRow] of subjectFormDetails.value.entries()) {
            let errorText: TNullableString = null;
            const subjectFormConfigDetails = getFilteredItems({
                data: subjectFormConfigList.value,
                type: "object",
                key: "id",
                value: subjectFormDetailRow.subjectFormConfigId,
            }) as ISubjectFormConfigData[];
            if (subjectFormConfigDetails[0].isMandatory && !subjectFormDetailRow.modelValue) {
                errorText = `Please ${subjectFormConfigDetails[0].controlTypeId === 7 ? "select" : "enter"} a ${convertToLowerCase(subjectFormConfigDetails[0].label)}`;
            }
            if (
                subjectFormDetailRow.modelValue &&
                getStringLength(String(subjectFormDetailRow.modelValue)) > 1000
            )
                errorText = `${capitalizeWord(subjectFormConfigDetails[0].label, true)} cannot be more than 1000 characters`;
            if (getStringLength(errorText) > 0 && !isError) isError = true;
            subjectFormDetailRow.error = errorText;
            subjectFormDetailsRef.value[index].error = errorText;
        }
        if (!selectedSubjectSiteId.value) {
            selectedSubjectSiteIdError.value = "Please select a site";
            if (!isError) isError = true;
        } else selectedSubjectSiteIdError.value = "";
        return isError;
    }

    function getFieldValueByControlType(controlTypeId: number, fieldValue: TModelValue) {
        if ([3, 4, 5].includes(controlTypeId) && fieldValue)
            return getAsISOString(fieldValue as TNullableDate);
        return fieldValue ? String(fieldValue) : null;
    }

    function getSubjectDetailsAPIData() {
        const result: ISubjectDetail[] = [];
        for (const formRow of subjectFormDetails.value) {
            const subjectDetailsBySubjectFormId = getFilteredItems({
                data: subjectDetails.value ? subjectDetails.value.subjectDetails : [],
                type: "object",
                key: "subjectFormConfigId",
                value: formRow.subjectFormConfigId,
            });
            result.push({
                id:
                    getArrayLength(subjectDetailsBySubjectFormId) > 0
                        ? subjectDetailsBySubjectFormId[0].id
                        : 0,
                fieldValue: getFieldValueByControlType(formRow.controlTypeId, formRow.modelValue),
                subjectFormConfigId: formRow.subjectFormConfigId,
                subjectId:
                    getArrayLength(subjectDetailsBySubjectFormId) > 0
                        ? subjectDetailsBySubjectFormId[0].subjectId
                        : 0,
                format: null,
                isActive: false,
                isMandatory: false,
                isSpecify: false,
                label: "",
                orderNumber: 0,
                updatedBy: 0,
            });
        }
        return deepClone(result) as ISubjectDetail[];
    }

    async function addOrEditSubject(closeModal: TVoidAction) {
        const isValidationError = validateAll();
        if (!isValidationError) {
            let message = "";
            let status = 500;
            // let validationErrorsData = null;
            const requestData = {
                id: subjectDetails.value ? subjectDetails.value.id : 0,
                fieldValue: subjectDetails.value ? subjectDetails.value.fieldValue : "",
                format: subjectDetails.value ? subjectDetails.value.format : "",
                isActive: subjectDetails.value ? subjectDetails.value.isActive : false,
                isMandatory: subjectDetails.value ? subjectDetails.value.isMandatory : false,
                isSpecify: subjectDetails.value ? subjectDetails.value.isSpecify : false,
                label: subjectDetails.value ? subjectDetails.value.label : "",
                orderNumber: subjectDetails.value ? subjectDetails.value.orderNumber : 0,
                studyId: subjectDetails.value
                    ? subjectDetails.value.studyId
                    : (studyStore.studyInformation.studyId as number),
                subjectDetails: getSubjectDetailsAPIData(),
                subjectFormConfigId: subjectDetails.value ? subjectDetails.value.studyId : 0,
                subjectId: subjectDetails.value ? subjectDetails.value.studyId : 0,
                trialId: subjectDetails.value
                    ? subjectDetails.value.trialId
                    : (studyStore.studyInformation.trialId as number),
                trialName: subjectDetails.value
                    ? subjectDetails.value.trialName
                    : studyStore.trialName,
                siteId: selectedSubjectSiteId.value as number,
                siteName: subjectDetails.value ? subjectDetails.value.siteName : "",
                statusId: null,
                statusName: "",
                value: subjectDetails.value ? subjectDetails.value.value : "",
                updatedBy: 0,
                lastUpdated: null,
                dynamicProperties: {},
            };
            const {
                message: apiMessage,
                status: apiStatus,
                // validationErrors: apiValidationErrors,
            } = await subjectUpdateAPI([requestData]);
            message = apiMessage;
            status = apiStatus;

            if (status === 200) {
                toastStore.success({
                    title: "Success",
                    message,
                });
                resetModel(closeModal);
                paginationModel.value.clearPageDetails();
                paginationModel.value.clearCountDetails();
                await onboardSubjectPaginationList();
                processPagination();
            } else if (status !== 401) {
                toastStore.error({
                    title: "Error",
                    message,
                });
            }
            loading.value.form = false;
        }
    }

    async function deleteSubject(subjectId: string) {
        loading.value.form = true;
        const { status, message } = await subjectDeleteAPI(subjectId);
        if (status === 200) {
            toastStore.success({
                title: "Success",
                message,
            });
            await onboardSubjectPaginationList();
        } else if (status !== 401) {
            toastStore.error({
                title: "Error",
                message,
            });
        }
        loading.value.form = false;
    }

    function processPagination(initial: boolean = false) {
        handleDefaultPaginationPageCount(paginationModel.value);
        handlePagination("page", initial ? 0 : 1, paginationModel.value, initial);
    }

    function onPageLoad() {
        loading.value.dynamicLoading["tableSkeletonLoader"] = true;
        Promise.all([
            subjectFormConfigListByStudyId(),
            studySitesList(),
            subjectStatusesList(),
            quickLinkStore.triggerSaveAsQuickLinkAPI({
                id: 0,
                trialId: studyStore.studyInformation.trialId as number,
                environmentId: studyStore.studyInformation.environmentId as number,
                page: "Onboard Subjects",
                pageDetails: JSON.stringify({
                    page: PortalPath.Subject,
                }),
                studyId: 0,
            }),
        ])
            .then(async () => {
                setTableColumns();
                if (studyStore.loading.processPageQueryOnPageLoad) {
                    processPageQueryOnPageLoad();
                    studyStore.loading.processPageQueryOnPageLoad = false;
                }
                await onboardSubjectPaginationList();
                processPagination(true);
                loading.value.dynamicLoading["tableSkeletonLoader"] = false;
            })
            .catch(() => {
                resetTableData();
                loading.value.dynamicLoading["tableSkeletonLoader"] = false;
            });
    }

    function handleAddVisit() {
        addVisitFormAction.value = "Add";
        popupModalStore.show("addVisitModal");
    }

    function resetAddVisitModel(closeModal?: TVoidAction) {
        if (closeModal) closeModal();
        if (addVisitFormAction.value !== "View") addVisitFormAction.value = "View";
        addVisitFormModel.value = { ...defaultAddVisitFormModel() };
        addVisitFormModelRef.value = { ...defaultAddVisitFormModel() };
        addVisitErrorModel.value = { ...defaultAddVisitErrorModel() };
    }

    function validateAddVisit() {
        if (getStringLength(addVisitFormModel.value.name) === 0)
            addVisitErrorModel.value.name = "Please enter a name";
        else if (getStringLength(addVisitFormModel.value.name) > 50)
            addVisitErrorModel.value.name = "Name cannot be more than 50 characters";
        else addVisitErrorModel.value.name = "";
        if (getStringLength(addVisitFormModel.value.oid) === 0)
            addVisitErrorModel.value.oid = "Please enter an oid";
        else if (getStringLength(addVisitFormModel.value.oid) > 50)
            addVisitErrorModel.value.oid = "OID cannot be more than 50 characters";
        else addVisitErrorModel.value.oid = "";
    }

    function setVisitOIDFromVisitName() {
        if (addVisitFormModel.value.name && getStringLength(addVisitFormModel.value.name) > 0) {
            const visitOID = convertToUpperCase(slicedText(addVisitFormModel.value.name));
            addVisitFormModel.value.oid = visitOID;
            addVisitFormModelRef.value.oid = visitOID;
        } else {
            addVisitFormModel.value.oid = null;
            addVisitFormModelRef.value.oid = null;
        }
    }

    async function addVisit(closeModal: TVoidAction) {
        setVisitOIDFromVisitName();
        validateAddVisit();
        if (!checkIfModelHasErrors(addVisitErrorModel.value)) {
            loading.value.dynamicLoading["addVisit"] = true;
            const { status, message } = await addVisitAPI({
                id: 0,
                branchId: 0,
                trialId: Number(studyStore.studyInformation.trialId),
                environmentId: Number(studyStore.studyInformation.environmentId),
                orderNumber: 0,
                oldOrderNumber: 0,
                newOrderNumber: 0,
                name: addVisitFormModel.value.name as string,
                oid: addVisitFormModel.value.oid as string,
                parentFolder: null,
                access: Number(addVisitFormModel.value.access),
                start: Number(addVisitFormModel.value.start),
                target: Number(addVisitFormModel.value.target),
                end: Number(addVisitFormModel.value.end),
                overDue: Number(addVisitFormModel.value.overDue),
                close: Number(addVisitFormModel.value.close),
                reusable: addVisitFormModel.value.reusable,
                updatedBy: 0,
            });
            if (status === 200) {
                toastStore.success({
                    title: "Success",
                    message,
                });
                resetAddVisitModel(closeModal);
            } else if (status !== 401) {
                toastStore.error({
                    title: "Error",
                    message,
                });
            }
            loading.value.dynamicLoading["addVisit"] = false;
        }
    }

    async function handleAddEvent() {
        addEventFormAction.value = "Add";
        popupModalStore.show("addEventModal");
        await folderList();
    }

    function resetAddEventModel(closeModal?: TVoidAction) {
        if (closeModal) closeModal();
        if (addEventFormAction.value !== "View") addEventFormAction.value = "View";
        addEventFormModel.value = { ...defaultAddEventFormModel() };
        addEventFormModelRef.value = { ...defaultAddEventFormModel() };
        addEventErrorModel.value = { ...defaultAddEventErrorModel() };
    }

    function validateAddEvent() {
        if (!addEventFormModel.value.trialVisitId)
            addEventErrorModel.value.trialVisitId = "Please select a visit";
        else addEventErrorModel.value.trialVisitId = "";
        if (!addEventFormModel.value.formId)
            addEventErrorModel.value.formId = "Please select a form";
        else addEventErrorModel.value.formId = "";
    }

    async function addEvent(closeModal: TVoidAction) {
        validateAddEvent();
        if (!checkIfModelHasErrors(addEventErrorModel.value)) {
            loading.value.dynamicLoading["addEvent"] = true;
            const { status, message } = await addEventAPI({
                id: 0,
                trialId: Number(studyStore.studyInformation.trialId),
                environmentId: Number(studyStore.studyInformation.environmentId),
                formId: addEventFormModel.value.formId as number,
                formCount: addEventFormModel.value.formCount as number,
                folderId: addEventFormModel.value.trialVisitId as number,
                updatedBy: 0,
            });
            if (status === 200) {
                toastStore.success({
                    title: "Success",
                    message,
                });
                resetAddEventModel(closeModal);
            } else if (status !== 401) {
                toastStore.error({
                    title: "Error",
                    message,
                });
            }
            loading.value.dynamicLoading["addEvent"] = false;
        }
    }

    async function formList() {
        formOptions.value.loading = true;
        const { status, data, message } = await publishedFormsListByTrialIdAndEnvironmentIdAPI(
            Number(studyStore.studyInformation.trialId),
            Number(studyStore.studyInformation.environmentId),
            Number(addEventFormModel.value.trialVisitId),
        );
        if (status === 200) {
            formOptions.value.options = deepClone(data);
        } else if (status !== 401) {
            formOptions.value.options = [];
            toastStore.error({
                title: "Error",
                message,
            });
        }
        formOptions.value.loading = false;
    }

    async function folderList() {
        visitOptions.value.loading = true;
        const { status, data, message } =
            await publishedTrialVisitsListByTrialIdAndEnvironmentIdAPI(
                Number(studyStore.studyInformation.trialId),
                Number(studyStore.studyInformation.environmentId),
            );
        if (status === 200) {
            visitOptions.value.options = deepClone(data);
        } else if (status !== 401) {
            visitOptions.value.options = [];
            toastStore.error({
                title: "Error",
                message,
            });
        }
        visitOptions.value.loading = false;
    }

    function resetSubjectDeactivateFormModel(closeModal?: TVoidAction) {
        if (closeModal) closeModal();
        selectedSubjectSiteId.value = null;
        selectedSubjectSiteRefId.value = null;
        subjectDetails.value = null;
    }

    function setSiteNameById() {
        if (subjectDetails.value) {
            for (const row of studySiteLookups.value) {
                if (row.value === subjectDetails.value.siteId) {
                    siteName.value = row.label;
                    break;
                }
            }
        }
    }

    async function triggerViewSubjectDetails(data?: TTableData) {
        loading.value.dynamicLoading["viewSubjectDetails"] = true;
        await subjectDetailsBySubjectId(data ? Number(data.id) : 0);
        setSiteNameById();
        popupModalStore.show("subjectDeactivateFormModal");
        loading.value.dynamicLoading["viewSubjectDetails"] = false;
    }

    // async function handleSubjectDeactivateFormSubmit(closeModal: TVoidAction) {
    //     //
    //     if (closeModal) closeModal();
    // }

    function processFormActivation(finalResult: IUpdatePublishedFormFolder[]) {
        const result: IUpdateFormData[] = [];
        for (const row of finalResult) {
            result.push({
                id: row.formId,
                folderId: row.folderId || null,
                type: row.value ? "activate" : "inactivate",
            });
        }
        return result;
    }

    async function updateFormActivationStatus(
        finalResult: IUpdatePublishedFormFolder[],
        reasonText: string,
        resetUpdateReasonModel: () => void,
    ) {
        const apiFormsData = processFormActivation(finalResult);
        console.log("apiFormsData", apiFormsData);
        console.log("subjectDetails.value", subjectDetails.value);
        loading.value.dynamicLoading["formInactivationSave"] = true;
        const { status = 500, message } = await updateFormActivationStatusAPI({
            subjectId: subjectDetails.value?.id as number,
            trialId: studyStore.studyInformation.trialId as number,
            environmentId: studyStore.studyInformation.environmentId as number,
            forms: apiFormsData,
            reason: reasonText,
        });
        if (status === 200) {
            toastStore.success({
                title: "Success",
                message,
            });
            resetUpdateReasonModel();
        } else {
            toastStore.error({
                title: "Error",
                message,
            });
        }

        loading.value.dynamicLoading["formInactivationSave"] = false;
    }

    function setSelectedFormCountToModel() {
        if (addEventFormModel.value.formId) {
            const filteredItems = getFilteredItems({
                data: formOptions.value.options,
                type: "object",
                value: addEventFormModel.value.formId,
                key: "id",
            });
            if (getArrayLength(filteredItems) > 0)
                addEventFormModel.value.formCount = filteredItems[0].formCount;
        } else {
            addEventFormModel.value.formCount = 0;
        }
    }

    function handleAddSubjectFormCancel(closeModal: TVoidAction) {
        // if (subjectModelTriggerChange.value === "unsaved") {
        //     if (!window.confirm("Reload page confirmation message")) {
        //         // return false;
        //     } else {
        //         resetModel(closeModal);
        //         subjectModelTriggerChange.value = "reset";
        //     }
        // } else {
        //     resetModel(closeModal);
        // }
        resetModel(closeModal);
    }
    function handleAddVisitFormCancel(closeModal: TVoidAction) {
        // if (addVisitModelTriggerChange.value === "unsaved") {
        //     if (!window.confirm("Reload page confirmation message")) {
        //         // return false;
        //     } else {
        //         resetAddVisitModel(closeModal);
        //         addVisitModelTriggerChange.value = "reset";
        //     }
        // } else {
        //     resetAddVisitModel(closeModal);
        // }
        resetAddVisitModel(closeModal);
    }
    function handleAddEventFormCancel(closeModal: TVoidAction) {
        // if (addEventModelTriggerChange.value === "unsaved") {
        //     if (!window.confirm("Reload page confirmation message")) {
        //         // return false;
        //     } else {
        //         resetAddEventModel(closeModal);
        //         addEventModelTriggerChange.value = "reset";
        //     }
        // } else {
        //     resetAddEventModel(closeModal);
        // }
        resetAddEventModel(closeModal);
    }
    function handleSubjectDeactivateFormCancel(closeModal: TVoidAction) {
        // if (subjectModelTriggerChange.value === "unsaved") {
        //     if (!window.confirm("Reload page confirmation message")) {
        //         // return false;
        //     } else {
        //         resetModel(closeModal);
        //         subjectModelTriggerChange.value = "reset";
        //     }
        // } else {
        //     resetModel(closeModal);
        // }
        resetSubjectDeactivateFormModel(closeModal);
    }

    function processPageQueryOnPageLoad() {
        if (route.query) {
            const {
                search = "",
                site = "",
                status = "",
                currentPage = "",
                pageLimit = "",
            } = route.query;
            if (search) filterModel.value.search = (search as string) || null;
            if (site)
                filterModel.value.siteId = site
                    ? Number(getDropdownValueByLabel(studySiteLookups.value, String(site)))
                    : null;
            if (status)
                filterModel.value.statusId = status
                    ? Number(getDropdownValueByLabel(subjectStatusLookups.value, String(status)))
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
                    site: getDropdownLabelByValue(
                        studySiteLookups.value,
                        filterModel.value.siteId as TOptionValue,
                    ),
                    status: getDropdownLabelByValue(
                        subjectStatusLookups.value,
                        filterModel.value.statusId as TOptionValue,
                    ),
                    currentPage: paginationModel.value.pageDetails.currentPage,
                    pageLimit: paginationModel.value.pageDetails.pageLimit,
                },
                PortalPath.Subject,
                removeKeys,
            );
        else removeFiltersFromQuery(removeKeys, PortalPath.Subject);
    }

    async function handleTableSort(columnHeading: string, newOrderType: TSortType) {
        let previousOrder: TSortType = "descending";
        const columnsRef = deepClone(columns.value) as IColumn[];
        for (const columnsRefRow of columnsRef) {
            if (columnsRefRow.header === columnHeading) {
                previousOrder = getSortOrderByAction(newOrderType, "previous");
                columnsRefRow.sortOrder = previousOrder;
            } else columnsRefRow.sortOrder = "descending";
        }
        columns.value = deepClone(columnsRef);
        if (previousOrder !== "descending") {
            orderByDetails.value = {
                [convertWordsIntoCasedWords(columnHeading, "pascal case")]:
                    previousOrder === "ascending" ? "desc" : "asc",
            };
        } else {
            orderByDetails.value = undefined;
        }
        paginationModel.value.clearCountDetails();
        paginationModel.value.pageDetails.currentPage = 1;
        paginationModel.value.pageDetails.lastPage = 0;
        await onboardSubjectPaginationList();
        processPagination();
    }

    async function onboardSubjectExportData(
        dataset: string,
        exportDataTo: string,
        extensionType: string,
    ) {
        loading.value.dynamicLoading["downloadExportedData"] = true;
        const {
            status,
            data,
            message = "Export success",
            headers,
        } = await onboardSubjectExportDataAPI({
            top: dataset === "current" ? paginationModel.value.pageDetails.pageLimit : null,
            skip: 0,
            trialId: studyStore.studyInformation.trialId as number,
            environmentId: studyStore.studyInformation.environmentId as number,
            searchPhrase: filterModel.value.search,
            siteId: filterModel.value.siteId,
            statusId: filterModel.value.statusId,
            dataSet: dataset,
            extensionType,
            exportDataTo,
        });
        if (status === 200) {
            const headerContentType = String(headers["content-type"]);
            if (!headerContentType.includes("application/json")) {
                const url = window.URL.createObjectURL(
                    new Blob([data as Blob], { type: headerContentType }),
                );
                const link = document.createElement("a");
                link.href = url;
                const contentDisposition = String(headers["content-disposition"]);
                let fileName = `data.${extensionType}`;
                if (contentDisposition) {
                    const matches = contentDisposition.match(
                        /filename[^;=\n]*=((['"]).*?\2|[^;\n]*)/,
                    );
                    if (matches && matches.length > 1) {
                        fileName = matches[1].replaceAll('"', "");
                    }
                }
                link.setAttribute("download", fileName);
                document.body.appendChild(link);
                link.click();
                if (link.parentNode) link.parentNode.removeChild(link);
                window.URL.revokeObjectURL(url);
            }
            toastStore.success({
                title: "Success",
                message,
            });
        } else if (status !== 401) {
            toastStore.error({
                title: "Error",
                message: status === 400 ? "No records found" : message,
            });
        }
        loading.value.dynamicLoading["downloadExportedData"] = false;
    }

    watch(
        () => studyStore.loading.pageDetails,
        (newValue, oldValue) => {
            if (oldValue && !newValue) {
                if (!studyStore.loading.processPageQueryOnPageLoad) {
                    filterModel.value = { ...defaultFilterModel() };
                    filterModelRef.value = { ...defaultFilterModel() };
                    processPageFilters("reset");
                }
                onPageLoad();
            }
        },
    );

    const {
        isModelChanged: isSubjectModelChanged,
        model: subjectModel,
        modelRef: subjectModelRef,
    } = useUnsavedAlert(subjectFormDetails.value, subjectFormDetailsRef.value);
    const {
        isModelChanged: isAddVisitModelChanged,
        model: addVisitModel,
        modelRef: addVisitModelRef,
    } = useUnsavedAlert(addVisitFormModel.value, addVisitFormModelRef.value);
    const {
        isModelChanged: isAddEventModelChanged,
        model: addEventModel,
        modelRef: addEventModelRef,
    } = useUnsavedAlert(addEventFormModel.value, addEventFormModelRef.value);

    watch(
        () => subjectFormDetails.value,
        (newValue) => {
            subjectModel.value = newValue;
            subjectModelRef.value = subjectFormDetailsRef.value;
        },
        { deep: true },
    );
    watch(
        () => addVisitFormModel.value,
        (newValue) => {
            addVisitModel.value = newValue;
            addVisitModelRef.value = addVisitFormModelRef.value;
        },
        { deep: true },
    );
    watch(
        () => addEventFormModel.value,
        (newValue) => {
            addEventModel.value = newValue;
            addEventModelRef.value = addEventFormModelRef.value;
        },
        { deep: true },
    );

    watch(
        () => selectedSubjectSiteId.value,
        (newSelectedSubjectId) => {
            if (newSelectedSubjectId && formAction.value === "Add")
                subjectModelTriggerChange.value = "unsaved";
            else if (
                newSelectedSubjectId &&
                formAction.value === "Update" &&
                newSelectedSubjectId !== selectedSubjectSiteRefId.value
            )
                subjectModelTriggerChange.value = "unsaved";
            else subjectModelTriggerChange.value = "none";
        },
    );

    watch(
        () => isSubjectModelChanged.value,
        (newValue) => {
            if (newValue) subjectModelTriggerChange.value = "unsaved";
            else subjectModelTriggerChange.value = "none";
        },
    );
    watch(
        () => isAddVisitModelChanged.value,
        (newValue) => {
            if (newValue) addVisitModelTriggerChange.value = "unsaved";
            else addVisitModelTriggerChange.value = "none";
        },
    );
    watch(
        () => isAddEventModelChanged.value,
        (newValue) => {
            if (newValue) addEventModelTriggerChange.value = "unsaved";
            else addEventModelTriggerChange.value = "none";
        },
    );

    watch(
        () => subjectModelTriggerChange.value,
        (newSubjectModelTriggerChange) => {
            if (newSubjectModelTriggerChange === "reset" && isSubjectModelChanged.value) {
                resetModel();
                subjectModelTriggerChange.value = "none";
                formAction.value = "View";
                popupModalStore.hide("onboardSubjectModal");
            }
        },
    );
    watch(
        () => addVisitModelTriggerChange.value,
        (newAddVisitModelTriggerChange) => {
            if (newAddVisitModelTriggerChange === "reset" && isAddVisitModelChanged.value) {
                resetAddVisitModel();
                addVisitModelTriggerChange.value = "none";
                addVisitFormAction.value = "View";
                popupModalStore.hide("addVisitModal");
            }
        },
    );
    watch(
        () => addEventModelTriggerChange.value,
        (newAddEventModelTriggerChange) => {
            if (newAddEventModelTriggerChange === "reset" && isAddEventModelChanged.value) {
                resetModel();
                addEventModelTriggerChange.value = "none";
                addEventFormAction.value = "View";
                popupModalStore.hide("addEventModal");
            }
        },
    );

    onMounted(() => {
        loading.value.setDynamicLoading([
            "tableSkeletonLoader",
            "subjectFormConfigList",
            "formGeneration",
            "addVisit",
            "addEvent",
            "downloadExportedData",
            "viewSubjectDetails",
            "formInactivationSave",
        ]);
        // if (
        //     checkIfActionIsAllowed(
        //         studyStore.getRoleIdBySiteId(),
        //         RolePermissionType.SubjectEnrollment,
        //     )
        // ) {
        //     await Promise.all([subjectStatusesList()]).then(() => {
        //         processPageQueryOnPageLoad();
        //     });
        //     // processPageQueryOnPageLoad();
        //     if (studyStore.isStudySelected()) {
        //         if (studyStore.loading.pageDetails) studyStore.loading.pageDetails = false;
        //         else onPageLoad();
        //     } else {
        //         studyStore.triggerModel = true;
        //     }
        //     Promise.all([controlTypesList()]);
        // } else {
        //     await redirectToDashboardDueToNoPermission(true);
        // }
        // processPageQueryOnPageLoad();
        if (studyStore.isStudySelected()) {
            studyStore.loading.processPageQueryOnPageLoad = true;
            if (studyStore.loading.pageDetails) studyStore.loading.pageDetails = false;
            else onPageLoad();
        } else {
            studyStore.triggerModel = true;
        }
        Promise.all([controlTypesList()]);
    });
</script>

<template>
    <div class="flex flex-row flex-wrap items-center gap-[2rem] py-[2rem]">
        <div
            class="transition-all min-h-full bg-white rounded-[var(--border-radius-20)] w-full user-list-container"
            :class="[globalStore.dropdownOptionVisible ? 'overflow-y-auto' : 'overflow-y-auto']"
        >
            <div class="flex flex-col gap-[1rem] w-full px-[2rem] py-[1rem]">
                <div class="flex flex-row items-center self-end gap-[1rem]">
                    <edc-pressable
                        v-if="isAddEventAllowed"
                        container-class="hover:opacity-100 rounded-[var(--border-radius-6)] bg-[var(--color-accent)] hover:bg-[var(--color-accent-hover)]"
                        slot-wrapper-class="flex flex-row items-center justify-between gap-x-[1.5rem] px-[1rem] py-[0.6rem] lg:py-[0.7rem]"
                        :on-click="
                            async () => {
                                await handleAddEvent();
                            }
                        "
                    >
                        <span class="text-[1.2rem] white-text">Add Event</span>
                        <edc-icon icon="plus" class="h-[1.5rem]" fill="var(--color-white)" />
                    </edc-pressable>
                    <edc-pressable
                        v-if="isAddVisitAllowed"
                        container-class="hover:opacity-100 rounded-[var(--border-radius-6)] bg-[var(--color-accent)] hover:bg-[var(--color-accent-hover)]"
                        slot-wrapper-class="flex flex-row items-center justify-between gap-x-[1.5rem] px-[1rem] py-[0.6rem] lg:py-[0.7rem]"
                        :on-click="
                            () => {
                                handleAddVisit();
                            }
                        "
                    >
                        <span class="text-[1.2rem] white-text">Add Visit</span>
                        <edc-icon icon="plus" class="h-[1.5rem]" fill="var(--color-white)" />
                    </edc-pressable>
                    <edc-pressable
                        v-if="isOnboardSubjectActionAllowed"
                        container-class="hover:opacity-100 rounded-[var(--border-radius-6)] bg-[var(--color-accent)] hover:bg-[var(--color-accent-hover)]"
                        slot-wrapper-class="flex flex-row items-center justify-between gap-x-[1.5rem] px-[1rem] py-[0.6rem] lg:py-[0.7rem]"
                        :on-click="
                            async () => {
                                await triggerAddOrEditSubject('Add');
                            }
                        "
                    >
                        <span class="text-[1.2rem] white-text">Add Subject</span>
                        <edc-icon icon="plus" class="h-[1.5rem]" fill="var(--color-white)" />
                    </edc-pressable>
                    <edc-export-button
                        :show-loader="loading.dynamicLoading['downloadExportedData']"
                        :handle-submit="
                            async (params) => {
                                await onboardSubjectExportData(
                                    params.dataset,
                                    params.exportDataTo,
                                    'xlsx',
                                );
                            }
                        "
                    />
                    <edc-search-bar
                        v-model="filterModel.search"
                        element-id="subjectSearch"
                        @on-search="
                            async () => {
                                paginationModel.clearCountDetails();
                                if (filterModel.search)
                                    processPageFilters('apply', ['currentPage']);
                                else processPageFilters('reset', ['search', 'currentPage']);
                                paginationModel.pageDetails.currentPage = 1;
                                paginationModel.pageDetails.lastPage = 0;
                                await onboardSubjectPaginationList();
                                processPagination();
                                globalStore.triggerSearchBarRefocus('#subjectSearch');
                            }
                        "
                    />
                    <edc-pressable
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
                <edc-data-table
                    v-if="loading.dynamicLoading['tableSkeletonLoader']"
                    :columns="[]"
                    :table-data="[]"
                    :loading="true"
                    pagination-type="none"
                    table-style="default"
                    :skeleton-data-count="5"
                    :enable-column-loader="true"
                />
                <edc-data-table
                    v-else
                    table-id="onboardSubjectsDataTable"
                    :columns="columns"
                    :table-data="tableData"
                    :pagination-model="paginationModel"
                    :loading="loading.table || studyStore.loading.pageDetails"
                    pagination-type="classic"
                    table-style="default"
                    :enable-row-click="false"
                    table-cell-container-class="!py-[1.85rem]"
                    :disable-text-ellipse="true"
                    :custom-content="true"
                    @on-page-limit-changed="
                        async () => {
                            if (paginationModel.pageDetails.pageLimit > 8)
                                processPageFilters('apply', ['currentPage']);
                            else processPageFilters('reset', ['pageLimit']);
                            paginationModel.pageDetails.currentPage = 1;
                            paginationModel.pageDetails.lastPage = 0;
                            paginationModel.clearCountDetails();
                            await onboardSubjectPaginationList();
                            processPagination();
                        }
                    "
                    @on-page-change="
                        async () => {
                            if (paginationModel.pageDetails.currentPage > 1)
                                processPageFilters('apply');
                            else processPageFilters('reset', ['currentPage']);
                            await onboardSubjectPaginationList();
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
                            v-for="[objectKey, objectValue] of Object.entries(data)
                                .filter((row) => !['id', 'siteName'].includes(row[0]))
                                .sort((a, b) => {
                                    if (a > b) return 1;
                                    if (a < b) return -1;
                                    return 0;
                                })"
                            :key="objectKey"
                            class="font-normal text-center font-12 !whitespace-normal !break-words custom-row !min-w-[15rem] !max-w-[15rem]"
                        >
                            <span>{{ objectValue }}</span>
                        </td>
                        <td
                            class="font-normal text-center font-12 !whitespace-normal !break-words custom-row !min-w-[40rem]"
                        >
                            <span>{{ data.siteName }}</span>
                        </td>
                    </template>
                    <template #action="{ data, index }">
                        <edc-pressable
                            v-if="isOnboardSubjectActionAllowed"
                            loader-type="table-save"
                            :disabled="loading.isDisabled()"
                            :on-click="
                                async () => {
                                    await triggerAddOrEditSubject('Update', data);
                                }
                            "
                        >
                            <edc-icon
                                v-tooltip.top="'Update'"
                                icon="edit"
                                fill="var(--color-secondary)"
                                :tabindex="-1"
                                :class="`${commonActionIconClasses('Update')}`"
                            />
                        </edc-pressable>
                        <edc-pressable
                            v-if="isSubjectFormActivationAllowed"
                            loader-type="table-save"
                            :disabled="loading.isDisabled()"
                            :on-click="
                                async () => {
                                    await triggerViewSubjectDetails(data);
                                }
                            "
                        >
                            <edc-icon
                                v-tooltip.top="'Details'"
                                icon="eye"
                                :tabindex="-1"
                                :class="`${commonActionIconClasses('Details')} fill-[var(--color-secondary)]`"
                            />
                        </edc-pressable>
                        <edc-delete-confirmation
                            v-if="data.id && isOnboardSubjectActionAllowed"
                            :key="`${checkIfKeyExistsInObject(index, tableLoaderDetails) && tableLoaderDetails[index] ? 'show' : 'hide'}DeleteConfirmation`"
                            message="Are you sure you want to delete the subject?"
                            :disabled="loading.isDisabled()"
                            :on-delete="
                                async () => {
                                    tableLoaderDetails[index] = true;
                                    await deleteSubject(String(data.id));
                                    tableLoaderDetails[index] = false;
                                }
                            "
                        >
                            <template #icon>
                                <edc-pressable
                                    loader-type="table-save"
                                    :disabled="loading.isDisabled()"
                                    :show-loader="tableLoaderDetails[index]"
                                >
                                    <edc-icon
                                        v-tooltip.top="'Delete'"
                                        icon="close-icon"
                                        :tabindex="-1"
                                        :class="`${commonActionIconClasses('Delete')} stroke-[var(--color-error)]`"
                                    />
                                </edc-pressable>
                            </template>
                        </edc-delete-confirmation>
                    </template>
                </edc-data-table>
            </div>
        </div>
    </div>
    <edc-side-bar
        @on-filter="
            async () => {
                sideBarStore.hide();
                processPageFilters('apply', ['currentPage']);
                paginationModel.pageDetails.currentPage = 1;
                paginationModel.pageDetails.lastPage = 0;
                paginationModel.clearCountDetails();
                await onboardSubjectPaginationList();
                processPagination();
            }
        "
        @on-reset="
            async () => {
                sideBarStore.hide();
                filterModel = { ...filterModel, siteId: null, statusId: null };
                processPageFilters('reset', ['site', 'status', 'currentPage']);
                paginationModel.pageDetails.currentPage = 1;
                paginationModel.pageDetails.lastPage = 0;
                paginationModel.clearCountDetails();
                await onboardSubjectPaginationList();
                processPagination();
            }
        "
        @on-close="
            () => {
                filterModel = deepClone(filterModelRef);
            }
        "
    >
        <!-- option-class="w-[10rem] lg:w-[24rem] xl:w-[32rem]" -->
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
        <edc-dropdown
            :key="`statusId-${filterModel.statusId ? filterModel.statusId : ''}`"
            v-model="filterModel.statusId"
            container-class="w-full"
            default-value="Select status"
            label="Status"
            :options="subjectStatusLookups"
            option-placement="bottom"
            :enable-clear="true"
            :disabled="loading.isDisabled(subjectStatusOptions.loading)"
            :loading="subjectStatusOptions.loading"
            :ellipse-count="43"
        />
    </edc-side-bar>
    <edc-popup-modal
        v-if="formAction !== 'View'"
        modal-id="onboardSubjectModal"
        container-class="min-w-[80vw]"
        :submit-label="formAction"
        :on-submit="
            async (closeModal) => {
                await addOrEditSubject(closeModal);
            }
        "
        :on-cancel="
            (closeModal) => {
                handleAddSubjectFormCancel(closeModal);
            }
        "
    >
        <span class="text-[1.2rem] font-semibold self-start"
            >Fields marked with an asterisk (<span class="text-[var(--color-error)]">*</span>) are
            required</span
        >
        <div class="grid grid-cols-2 lg:grid-cols-3 gap-x-[5rem] gap-y-[1rem]">
            <template v-if="loading.dynamicLoading['formGeneration']">
                <admin-form-skeleton-loader
                    v-for="count of [1, 2, 3, 4, 5, 6]"
                    :key="count"
                    container-class="w-full h-[3.2rem] my-[1rem]"
                />
            </template>
            <template v-else-if="getArrayLength(subjectFormDetails) > 0">
                <template v-for="(formDetails, index) of subjectFormDetails" :key="index">
                    <component
                        :is="formFieldsSlot[formDetails.controlTypeId]"
                        v-bind="formDetails"
                        v-model="formDetails.modelValue"
                    />
                </template>
                <edc-dropdown
                    :key="`subjectSiteId-${selectedSubjectSiteId ? selectedSubjectSiteId : ''}`"
                    v-model="selectedSubjectSiteId"
                    container-class="w-full"
                    default-value="Select site"
                    label="Site"
                    :options="studySiteLookups"
                    option-placement="bottom"
                    :disabled="loading.isDisabled(studySiteOptions.loading)"
                    :loading="studySiteOptions.loading"
                    :required="true"
                    :ellipse-count="48"
                    :error="selectedSubjectSiteIdError"
                />
            </template>
            <template v-else>
                <span class="text-[1.2rem] font-normal self-start"
                    >No form config is available. Please do contact the admin</span
                >
            </template>
        </div>
    </edc-popup-modal>
    <edc-popup-modal
        v-if="addVisitFormAction !== 'View'"
        modal-id="addVisitModal"
        container-class="min-w-[82vw]"
        :submit-label="addVisitFormAction"
        :on-submit="
            async (closeModal) => {
                await addVisit(closeModal);
            }
        "
        :on-cancel="
            (closeModal) => {
                handleAddVisitFormCancel(closeModal);
            }
        "
    >
        <span class="text-[1.2rem] font-semibold self-start"
            >Fields marked with an asterisk (<span class="text-[var(--color-error)]">*</span>) are
            required</span
        >
        <div class="grid grid-cols-3 gap-x-[5rem] gap-y-[1rem]">
            <edc-text-input
                v-model="addVisitFormModel.name"
                container-class="w-full"
                type="text"
                placeholder="Enter name"
                label="Name"
                :disabled="loading.isDisabled()"
                :required="true"
                :error="addVisitErrorModel.name"
            />
            <!-- <edc-text-input
                v-model="addVisitFormModel.oid"
                container-class="w-full"
                type="text"
                placeholder="Enter oid"
                label="OID"
                :disabled="loading.isDisabled()"
                :required="true"
                :error="addVisitErrorModel.oid"
            /> -->
            <edc-text-input
                v-model="addVisitFormModel.access"
                container-class="w-full"
                type="number"
                placeholder="Enter access"
                label="Access"
                :disabled="loading.isDisabled()"
            />
            <edc-text-input
                v-model="addVisitFormModel.start"
                container-class="w-full"
                type="number"
                placeholder="Enter start"
                label="Start"
                :disabled="loading.isDisabled()"
            />
            <edc-text-input
                v-model="addVisitFormModel.target"
                container-class="w-full"
                type="number"
                placeholder="Enter target"
                label="Target"
                :disabled="loading.isDisabled()"
            />
            <edc-text-input
                v-model="addVisitFormModel.end"
                container-class="w-full"
                type="number"
                placeholder="Enter end"
                label="End"
                :disabled="loading.isDisabled()"
            />
            <edc-text-input
                v-model="addVisitFormModel.overDue"
                container-class="w-full"
                type="number"
                placeholder="Enter overDue"
                label="Overdue"
                :disabled="loading.isDisabled()"
            />
            <edc-text-input
                v-model="addVisitFormModel.close"
                container-class="w-full"
                type="number"
                placeholder="Enter close"
                label="Close"
                :disabled="loading.isDisabled()"
            />
            <edc-checkbox
                v-model="addVisitFormModel.reusable"
                label="Reusable"
                container-class="!flex-row"
                name="reusable"
                :disabled="loading.isDisabled()"
            />
        </div>
    </edc-popup-modal>
    <edc-popup-modal
        v-if="addEventFormAction !== 'View'"
        modal-id="addEventModal"
        :submit-label="addEventFormAction"
        :on-submit="
            async (closeModal) => {
                await addEvent(closeModal);
            }
        "
        :on-cancel="
            (closeModal) => {
                handleAddEventFormCancel(closeModal);
            }
        "
    >
        <span class="text-[1.2rem] font-semibold self-start"
            >Fields marked with an asterisk (<span class="text-[var(--color-error)]">*</span>) are
            required</span
        >
        <div class="grid grid-cols-2 lg:grid-cols-3 gap-x-[5rem] gap-y-[1rem]">
            <edc-dropdown
                :key="`visitId-${addEventFormModel.trialVisitId ? addEventFormModel.trialVisitId : ''}`"
                v-model="addEventFormModel.trialVisitId"
                container-class="w-[34rem] lg:w-[30rem] xl:w-[34rem]"
                default-value="Select visit"
                label="Visit"
                :options="visitLookups"
                option-placement="bottom"
                :disabled="loading.isDisabled(visitOptions.loading)"
                :loading="visitOptions.loading"
                :required="true"
                :ellipse-count="50"
                :error="addEventErrorModel.trialVisitId"
                @on-select="
                    async () => {
                        if (addEventFormModel.trialVisitId) {
                            addEventFormModel.formId = null;
                            addEventFormModel.formCount = 0;
                            await formList();
                        } else formOptions.options = [];
                        setIsUnscheduled();
                    }
                "
                @on-clear="
                    () => {
                        formOptions.options = [];
                    }
                "
            />
            <div class="flex flex-row items-center gap-[1rem] col-span-2">
                <edc-dropdown
                    :key="`formId-${addEventFormModel.formId ? addEventFormModel.formId : ''}`"
                    v-model="addEventFormModel.formId"
                    container-class="w-[34rem] lg:w-[30rem] xl:w-[34rem]"
                    default-value="Select form"
                    label="Form"
                    :options="formLookups"
                    option-placement="bottom"
                    :disabled="loading.isDisabled(formOptions.loading)"
                    :loading="formOptions.loading"
                    :required="true"
                    :ellipse-count="50"
                    :error="addEventErrorModel.formId"
                    @on-select="
                        () => {
                            setSelectedFormCountToModel();
                        }
                    "
                />
                <div
                    v-if="addEventFormModel.formId"
                    :class="[addEventErrorModel.formId ? '-mt-[2rem]' : '']"
                >
                    <edc-form-label input-id="formsAssigning" label="Count" />
                    <edc-event-form-incrementer
                        v-model="addEventFormModel.formCount"
                        :is-unscheduled-visit="addEventFormModel.isUnscheduled"
                    />
                </div>
            </div>
            <!-- <div class="col-span-3">
                <edc-form-label input-id="formsAssigning" label="Forms" :required="true" />
                <div class="grid grid-cols-4 gap-[0.5rem]">
                    <div
                        v-for="(formRow, formRowIndex) of formLookups"
                        :key="formRowIndex"
                        class="flex flex-row items-center gap-[0.5rem]"
                    >
                        // v-model="data.isActive"
                        <edc-checkbox
                            :key="`isFormAssigned-${formRowIndex}`"
                            container-class=""
                            :name="`isFormAssigned-${formRowIndex}`"
                            :disabled="loading.isDisabled()"
                        />
                        <p class="font-14">{{ formRow.label }}</p>
                        <edc-event-form-incrementer />
                    </div>
                </div>
                <div class="flex flex-row items-center w-full">
                    <edc-error-text
                        :error="addEventErrorModel.formIds"
                        container-class="mt-[0.3rem]"
                    />
                </div>
            </div> -->
            <!-- <edc-multi-select
                :key="`formIds-${getArrayLength(addEventFormModel.formIds) > 0 ? addEventFormModel.formIds.join(', ') : ''}`"
                v-model="addEventFormModel.formIds"
                container-class="w-[34rem]"
                default-value="Select forms"
                label="Forms"
                :options="formLookups"
                option-placement="bottom"
                option-class="w-[34rem]"
                :required="true"
                :disabled="loading.isDisabled(formOptions.loading)"
                :loading="formOptions.loading"
                :error="addEventErrorModel.formIds"
                :ellipse-count="43"
                @on-blur="
                    (selectedOptions) => {
                        addEventFormModel.formIds = [...(selectedOptions as number[])];
                    }
                "
            /> -->
        </div>
    </edc-popup-modal>
    <edc-popup-modal
        modal-id="subjectDeactivateFormModal"
        submit-label="Close"
        container-class="min-w-[92vw]"
        :hide-cancel="true"
        :on-submit="
            (closeModal) => {
                handleSubjectDeactivateFormCancel(closeModal);
            }
        "
        :on-cancel="
            (closeModal) => {
                handleSubjectDeactivateFormCancel(closeModal);
            }
        "
    >
        <edc-subject-form-deactivation-details
            :subject-details="subjectDetails"
            :loading="loading"
            :site-name="siteName"
        />
        <div class="overflow-x-auto">
            <edc-subject-form-deactivation-matrix
                :subject-details="subjectDetails"
                :on-save="
                    async (finalResult, reasonText, resetUpdateReasonModel) => {
                        await updateFormActivationStatus(
                            finalResult,
                            reasonText,
                            resetUpdateReasonModel,
                        );
                    }
                "
            />
        </div>
    </edc-popup-modal>
</template>

<style>
    div.table-wrapper[skeleton]
        table#onboardSubjectsDataTable
        thead
        tr
        th:not(:nth-last-child(-n + 2)) {
        min-width: 15rem;
        max-width: 15rem;
    }
    div.table-wrapper[skeleton] table#onboardSubjectsDataTable thead tr th:nth-last-child(2) {
        min-width: 40rem;
        max-width: 40rem;
    }
    div.table-wrapper[skeleton] table#onboardSubjectsDataTable thead tr th:nth-last-child(1) {
        min-width: 6rem;
        max-width: 6rem;
    }
    @media screen and (min-width: 1440px) {
        div.table-wrapper[skeleton]
            table#onboardSubjectsDataTable
            thead
            tr
            th:not(:nth-last-child(-n + 2)) {
            min-width: 19.668rem;
            max-width: 19.668rem;
        }
        div.table-wrapper[skeleton] table#onboardSubjectsDataTable thead tr th:nth-last-child(2) {
            min-width: 63.373rem;
            max-width: 63.373rem;
        }
        div.table-wrapper[skeleton] table#onboardSubjectsDataTable thead tr th:nth-last-child(1) {
            min-width: 7.87rem;
            max-width: 7.87rem;
        }
    }
</style>
