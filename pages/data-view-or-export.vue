<script setup lang="ts">
    import Loading from "~/services/apis/data/loading";
    import useGlobalStore from "~/stores/global";
    import useStudyStore from "~/stores/study";
    import useToastStore from "~/stores/toast";
    import type {
        IOptions,
        IPublishedSubjectFormMetaDetail,
        ITrialVisitFormDetail,
        TNullableNumber,
        TNullableString,
    } from "~/types/common";
    import DropdownOption from "~/services/apis/data/dropdown-option";
    import { siteListByStudyIdAPI } from "~/services/apis/handlers/admin/site";
    import type { IColumn, TSortType } from "~/types/datatable";
    import { nestedSubjectsListAPI } from "~/services/apis/handlers/portal/data-collection";
    import {
        annotatedCRFAPI,
        blankCRFAPI,
        publishedFormFieldExportDataAPI,
        publishedFormFieldsViewDataAPI,
    } from "~/services/apis/handlers/portal/data-view-or-export";
    import type { IPublishedFormFieldsViewData } from "~/services/apis/handlers/types/data-view-export-types";
    import useQuickLinkStore from "~/stores/quick-link";
    import { EXPORT_DATA_TO_OPTIONS } from "~/constants/options";
    import type { AxiosResponseHeaders } from "axios";
    import { subjectListByStudyIdAPI } from "~/services/apis/handlers/admin/subject";
    import type { ISubjectListData } from "~/services/apis/handlers/types/data-collection-types";

    definePageMeta({
        layout: "portal-layout",
    });

    useHead({
        title: seoPageTitle("Date View Or Export"),
    });

    interface IDataExportDetail {
        dataSources: TNullableNumber;
        formIds: number[];
        siteIds: number[];
        visitIds: number[];
        subjectIds: number[];
        jobModeType: TNullableString;
        exportType: TNullableString;
        fileExtensionType: TNullableString;
        exportDataTo: TNullableString;
        isZippingRequired: boolean;
        successNotificationEmailIds: TNullableString;
        failureNotificationEmailIds: TNullableString;
        isIncrementalDate: boolean;
        columnNameAsFirstRow: boolean;
        setDebugFlag: boolean;
    }

    interface IDataExportErrorDetail {
        formIds: string;
    }

    const defaultExportDataToOption = () => String(EXPORT_DATA_TO_OPTIONS[0].value);

    const defaultDataExportDetail = (): IDataExportDetail => ({
        dataSources: null,
        formIds: [],
        siteIds: [],
        visitIds: [],
        subjectIds: [],
        jobModeType: "Immediate",
        exportType: "Text Export",
        fileExtensionType: "xlsx",
        exportDataTo: defaultExportDataToOption(),
        isZippingRequired: false,
        successNotificationEmailIds: null,
        failureNotificationEmailIds: null,
        isIncrementalDate: false,
        columnNameAsFirstRow: true,
        setDebugFlag: false,
    });

    const defaultDataExportErrorDetail = (): IDataExportErrorDetail => ({
        formIds: "",
    });

    interface IDataViewDetail {
        dataSources: TNullableNumber;
        formId: TNullableNumber;
        siteId: TNullableNumber;
        visitId: TNullableNumber;
        subjectIds: number[];
        timezone: string;
    }

    interface IDataViewErrorDetail {
        formId: string;
    }

    const defaultDataViewDetail = (): IDataViewDetail => ({
        dataSources: null,
        formId: null,
        siteId: null,
        visitId: null,
        subjectIds: [],
        timezone: "GMT",
    });

    const defaultDataViewErrorDetail = (): IDataViewErrorDetail => ({
        formId: "",
    });

    interface ICRFDataDetail {
        type: TNullableString;
        exportDataTo: TNullableString;
    }

    interface ICRFDataErrorDetail {
        type: string;
        exportDataTo: string;
    }

    const defaultCRFDataDetail = (): ICRFDataDetail => ({
        exportDataTo: defaultExportDataToOption(),
        type: "Blank",
    });

    const defaultCRFDatarrorDetail = (): ICRFDataErrorDetail => ({
        exportDataTo: "",
        type: "",
    });

    // interface IJobTableData {
    //     jobId: TNullableString;
    //     scheduledParentJobId: TNullableString;
    //     submissionMode: TNullableString;
    //     status: TNullableString;
    //     startDate: TNullableString;
    //     endDate: TNullableString;
    //     submittedBy: TNullableString;
    //     submittedOn: TNullableString;
    //     dataFile: TNullableString;
    //     exportDateTo: TNullableString;
    //     fileName: TNullableString;
    //     scheduledInterval: TNullableString;
    //     scheduledStartDate: TNullableString;
    //     scheduledEndDate: TNullableString;
    // }

    // interface IActiveScheduledJobTableData {
    //     jobId: TNullableString;
    //     jobName: TNullableString;
    //     refJobName: TNullableString;
    //     status: TNullableString;
    //     submittedBy: TNullableString;
    //     submittedOn: TNullableString;
    //     scheduledInterval: TNullableString;
    //     scheduledStartDate: TNullableString;
    //     scheduledEndDate: TNullableString;
    // }

    const toastStore = useToastStore();
    const studyStore = useStudyStore();
    const globalStore = useGlobalStore();
    const quickLinkStore = useQuickLinkStore();

    const loading = ref<Loading>(new Loading());
    const studyInformation = ref<{
        trialId: TNullableNumber;
        environmentId: TNullableNumber;
    }>({
        trialId: null,
        environmentId: null,
    });
    const studyInformationError = ref<{
        trialId: string;
        environmentId: string;
    }>({
        trialId: "",
        environmentId: "",
    });
    const formDetails = ref<ITrialVisitFormDetail>({
        trialVisits: [],
        forms: [],
    });
    const studySiteOptions = ref<DropdownOption>(new DropdownOption());
    const subjectOptions = ref<DropdownOption>(new DropdownOption());
    const dataExportDetails = ref<IDataExportDetail>({ ...defaultDataExportDetail() });
    const dataExportErrorDetails = ref<IDataExportErrorDetail>({
        ...defaultDataExportErrorDetail(),
    });
    const dataViewDetails = ref<IDataViewDetail>({ ...defaultDataViewDetail() });
    const dataViewErrorDetails = ref<IDataViewErrorDetail>({ ...defaultDataViewErrorDetail() });
    const crfDataDetails = ref<ICRFDataDetail>({ ...defaultCRFDataDetail() });
    const crfDataErrorDetails = ref<ICRFDataErrorDetail>({ ...defaultCRFDatarrorDetail() });
    // const jobSearch = ref<TNullableString>(null);
    // const jobTableColumns: IColumn[] = [
    //     {
    //         field: "jobId",
    //         header: "Job ID",
    //         icon: false,
    //         show: true,
    //     },
    //     {
    //         field: "scheduledParentJobId",
    //         header: "Scheduled Parent Job ID",
    //         icon: false,
    //         show: true,
    //     },
    //     {
    //         field: "submissionMode",
    //         header: "Submission Mode",
    //         icon: false,
    //         show: true,
    //     },
    //     {
    //         field: "status",
    //         header: "Status",
    //         icon: false,
    //         show: true,
    //     },
    //     {
    //         field: "startDate",
    //         header: "Start Date",
    //         icon: false,
    //         show: true,
    //     },
    //     {
    //         field: "endDate",
    //         header: "End Date",
    //         icon: false,
    //         show: true,
    //     },
    //     {
    //         field: "submittedBy",
    //         header: "Submitted By",
    //         icon: false,
    //         show: true,
    //     },
    //     {
    //         field: "submittedOn",
    //         header: "Submitted On",
    //         icon: false,
    //         show: true,
    //     },
    //     {
    //         field: "dataFile",
    //         header: "Data File",
    //         icon: false,
    //         show: true,
    //     },
    //     {
    //         field: "exportDateTo",
    //         header: "Export Date To",
    //         icon: false,
    //         show: true,
    //     },
    //     {
    //         field: "fileName",
    //         header: "File Name",
    //         icon: false,
    //         show: true,
    //     },
    //     {
    //         field: "scheduledInterval",
    //         header: "Scheduled Interval",
    //         icon: false,
    //         show: true,
    //     },
    //     {
    //         field: "scheduledStartDate",
    //         header: "Scheduled Start Date",
    //         icon: false,
    //         show: true,
    //     },
    //     {
    //         field: "scheduledEndDate",
    //         header: "Scheduled End Date",
    //         icon: false,
    //         show: true,
    //     },
    // ];
    // const jobTableData = ref<IJobTableData[]>([
    //     {
    //         jobId: "132796005",
    //         scheduledParentJobId: null,
    //         submissionMode: "Immediate",
    //         status: "Success",
    //         startDate: "2024-08-09 05:10:00Z",
    //         endDate: "2024-08-09 05:10:00Z",
    //         submittedBy: "Yuvraj",
    //         submittedOn: "2024-08-09 05:10:00Z",
    //         dataFile: null,
    //         exportDateTo: defaultExportDataToOption(),
    //         fileName: "SDY_EXPORT_H5P-LC-VHHL-001_DEV_YUVRAJ_20240809051000",
    //         scheduledInterval: null,
    //         scheduledStartDate: null,
    //         scheduledEndDate: null,
    //     },
    // ]);
    // const activeScheduledJobSearch = ref<TNullableString>(null);
    // const activeScheduledJobTableColumns: IColumn[] = [
    //     {
    //         field: "jobId",
    //         header: "Job ID",
    //         icon: false,
    //         show: true,
    //     },
    //     {
    //         field: "jobName",
    //         header: "Job Name",
    //         icon: false,
    //         show: true,
    //     },
    //     {
    //         field: "refJobName",
    //         header: "Ref Job Name",
    //         icon: false,
    //         show: true,
    //     },
    //     {
    //         field: "status",
    //         header: "Status",
    //         icon: false,
    //         show: true,
    //     },
    //     {
    //         field: "submittedBy",
    //         header: "Submitted By",
    //         icon: false,
    //         show: true,
    //     },
    //     {
    //         field: "submittedOn",
    //         header: "Submitted On",
    //         icon: false,
    //         show: true,
    //     },
    //     {
    //         field: "scheduledInterval",
    //         header: "Scheduled Interval",
    //         icon: false,
    //         show: true,
    //     },
    //     {
    //         field: "scheduledStartDate",
    //         header: "Scheduled Start Date",
    //         icon: false,
    //         show: true,
    //     },
    //     {
    //         field: "scheduledEndDate",
    //         header: "Scheduled End Date",
    //         icon: false,
    //         show: true,
    //     },
    // ];
    // const activeScheduledJobTableData = ref<IActiveScheduledJobTableData[]>([]);
    const showViewData = ref<boolean>(false);
    // const viewDataColumns: IColumn[] = [
    //     {
    //         header: "Record ID",
    //         field: "recordId",
    //         icon: false,
    //         show: true,
    //     },
    //     {
    //         header: "SUBINT",
    //         field: "subjectInitials",
    //         icon: false,
    //         show: true,
    //     },
    //     {
    //         header: "DMAGE",
    //         field: "age",
    //         icon: false,
    //         show: true,
    //     },
    //     {
    //         header: "DMSEX",
    //         field: "sex",
    //         icon: false,
    //         show: true,
    //     },
    //     {
    //         header: "DMRACE",
    //         field: "race",
    //         icon: false,
    //         show: true,
    //     },
    //     {
    //         header: "DMHGT",
    //         field: "height",
    //         icon: false,
    //         show: true,
    //     },
    //     {
    //         header: "DMWGT",
    //         field: "weight",
    //         icon: false,
    //         show: true,
    //     },
    //     {
    //         header: "DMBMI",
    //         field: "bmi",
    //         icon: false,
    //         show: true,
    //     },
    //     {
    //         header: "DMBSA",
    //         field: "bsa",
    //         icon: false,
    //         show: true,
    //     },
    // ];
    // const viewDataDetails = ref<
    //     {
    //         recordId: TNullableString;
    //         subjectInitials: TNullableString;
    //         age: TNullableString;
    //         sex: TNullableString;
    //         race: TNullableString;
    //         height: TNullableString;
    //         weight: TNullableString;
    //         bmi: TNullableString;
    //         bsa: TNullableString;
    //     }[]
    // >([
    //     {
    //         recordId: "1123209562891",
    //         subjectInitials: "VA",
    //         age: "28",
    //         sex: "MALE",
    //         race: "ASIAN",
    //         height: "173",
    //         weight: "67",
    //         bmi: "23.8",
    //         bsa: "1.8",
    //     },
    //     {
    //         recordId: "1323209562860",
    //         subjectInitials: "JK",
    //         age: "55",
    //         sex: "MALE",
    //         race: "ASIAN",
    //         height: "180",
    //         weight: "70",
    //         bmi: "22.2",
    //         bsa: "1.6",
    //     },
    //     {
    //         recordId: "2823129562891",
    //         subjectInitials: "SK",
    //         age: "50",
    //         sex: "MALE",
    //         race: "ASIAN",
    //         height: "170",
    //         weight: "71",
    //         bmi: "24.8",
    //         bsa: "1.9",
    //     },
    //     {
    //         recordId: "3323209561291",
    //         subjectInitials: "VM",
    //         age: "37",
    //         sex: "MALE",
    //         race: "ASIAN",
    //         height: "177",
    //         weight: "69",
    //         bmi: "22.8",
    //         bsa: "1.8",
    //     },
    // ]);
    const viewDataColumns = ref<IColumn[]>([]);
    const viewDataDetails = ref<Record<string, any[]>>({});
    const viewDataDetailsRef = ref<Record<string, any[]>>({});
    const currentIndex = ref<number>(0);
    const standardFormsDetails = ref<IPublishedSubjectFormMetaDetail[]>([]);
    const standardFormName = ref<string>("");
    const formDetailsData = ref<IPublishedFormFieldsViewData[]>([]);

    const studySiteLookups = computed(() =>
        getOptionsList(studySiteOptions.value.options, "siteName", "siteId"),
    );
    const subjectLookups = computed(() =>
        getOptionsList(subjectOptions.value.options, "fieldValue", "id"),
    );
    const subjectBySiteIdLookups = computed(() => {
        const subjectOptionsList = dataViewDetails.value.siteId
            ? (subjectOptions.value.options as ISubjectListData[]).filter(
                  (row) => dataViewDetails.value.siteId === row.siteId,
              )
            : subjectOptions.value.options;
        return getOptionsList(subjectOptionsList, "fieldValue", "id");
    });

    const trialVisitLookups = computed(() => {
        const result: IOptions[] = [];
        for (const row of formDetails.value.trialVisits) {
            result.push({
                label: row.name,
                value: row.id,
            });
        }
        return result;
    });

    function getTrialVisitForms(visitsIds: number[]) {
        const result: IOptions[] = [];
        const uniqueForms: number[] = [];
        for (const row of formDetails.value.trialVisits) {
            if (visitsIds.includes(row.id)) continue;
            for (const subRow of row.forms) {
                // if (getArrayLength(visitsIds) === 0 && subRow.formType === 1) continue;
                if (!uniqueForms.includes(subRow.id)) {
                    result.push({
                        label: subRow.formName,
                        value: subRow.id,
                    });
                    uniqueForms.push(subRow.id);
                }
            }
        }
        return { result, uniqueForms };
    }

    const formLookups = computed(() => {
        const result: IOptions[] = [];
        let uniqueForms: number[] = [];
        // if (getArrayLength(dataExportDetails.value.visitIds) > 0 || dataViewDetails.value.visitId) {
        //     for (const row of formDetails.value.trialVisits) {
        //         if (
        //             (getArrayLength(dataExportDetails.value.visitIds) > 0 &&
        //                 !dataExportDetails.value.visitIds.includes(row.id)) ||
        //             (dataViewDetails.value.visitId && dataViewDetails.value.visitId !== row.id)
        //         )
        //             continue;
        //         for (const subRow of row.forms) {
        //             if (!uniqueForms.includes(subRow.id)) {
        //                 result.push({
        //                     label: subRow.formName,
        //                     value: subRow.id,
        //                 });
        //                 uniqueForms.push(subRow.id);
        //             }
        //         }
        //     }
        // } else {
        //     for (const row of formDetails.value.forms) {
        //         if (!uniqueForms.includes(row.id)) {
        //             result.push({
        //                 label: row.formName,
        //                 value: row.id,
        //             });
        //             uniqueForms.push(row.id);
        //         }
        //     }
        // }

        const trialVisitResult = getTrialVisitForms(
            getArrayLength(dataExportDetails.value.visitIds) > 0
                ? dataExportDetails.value.visitIds
                : dataViewDetails.value.visitId
                  ? [dataViewDetails.value.visitId]
                  : [],
        );
        uniqueForms = [...trialVisitResult.uniqueForms];
        for (const row of trialVisitResult.result) {
            result.push({ ...row });
        }

        for (const row of formDetails.value.forms) {
            if (!uniqueForms.includes(row.id)) {
                result.push({
                    label: row.formName,
                    value: row.id,
                });
                uniqueForms.push(row.id);
            }
        }

        return result;
    });

    const crfTypeLookups = computed(
        () =>
            [
                {
                    label: "Blank",
                    value: "Blank",
                },
                {
                    label: "Annotated",
                    value: "Annotated",
                },
            ] as IOptions[],
    );

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

    function onPageLoad() {
        Promise.all([
            studySitesList(),
            subjectsList(),
            nestedSubjectsList(),
            quickLinkStore.triggerSaveAsQuickLinkAPI({
                id: 0,
                trialId: studyStore.studyInformation.trialId as number,
                environmentId: studyStore.studyInformation.environmentId as number,
                page: "Data View Or Export",
                pageDetails: JSON.stringify({
                    page: PortalPath.DataViewOrExport,
                }),
                studyId: 0,
            }),
        ]);
        studyInformation.value.trialId = studyStore.studyInformation.trialId;
        studyStore.processEnvironmentDetails();
        studyInformation.value.environmentId = studyStore.studyInformation.environmentId;
    }

    async function nestedSubjectsList() {
        if (studyStore.studyInformation.trialId && studyStore.studyInformation.environmentId) {
            loading.value.dynamicLoading["nestedSubjectList"] = true;
            const { status, data } = await nestedSubjectsListAPI({
                trialId: studyStore.studyInformation.trialId,
                environmentId: studyStore.studyInformation.environmentId,
            });
            if (status === 200) {
                formDetails.value.trialVisits = deepClone(data.formDetails.trialVisits);
                formDetails.value.forms = deepClone(data.formDetails.forms);
            } else if (status !== 401) {
                formDetails.value.trialVisits = [];
                formDetails.value.forms = [];
            }
            loading.value.dynamicLoading["nestedSubjectList"] = false;
        }
    }

    function resetExportModel() {
        dataExportDetails.value = { ...defaultDataExportDetail() };
        dataExportErrorDetails.value = { ...defaultDataExportErrorDetail() };
    }

    function processEmailIds(type: "success" | "failure") {
        if (
            (type === "success" && !dataExportDetails.value.successNotificationEmailIds) ||
            (type === "failure" && !dataExportDetails.value.failureNotificationEmailIds)
        )
            return [];
        if (
            type === "success" &&
            dataExportDetails.value.successNotificationEmailIds &&
            dataExportDetails.value.successNotificationEmailIds.includes(", ")
        )
            return dataExportDetails.value.successNotificationEmailIds.split(", ");
        if (
            type === "success" &&
            dataExportDetails.value.successNotificationEmailIds &&
            dataExportDetails.value.successNotificationEmailIds.includes(",")
        )
            return dataExportDetails.value.successNotificationEmailIds.split(",");
        if (
            type === "failure" &&
            dataExportDetails.value.failureNotificationEmailIds &&
            dataExportDetails.value.failureNotificationEmailIds.includes(", ")
        )
            return dataExportDetails.value.failureNotificationEmailIds.split(", ");
        if (
            type === "failure" &&
            dataExportDetails.value.failureNotificationEmailIds &&
            dataExportDetails.value.failureNotificationEmailIds.includes(",")
        )
            return dataExportDetails.value.failureNotificationEmailIds.split(",");
        return [];
    }

    function validateSelectedStudy() {
        if (!studyInformation.value.trialId)
            studyInformationError.value.trialId = "Please select a study";
        else studyInformationError.value.trialId = "";
        if (!studyInformation.value.environmentId)
            studyInformationError.value.environmentId = "Please select an environment";
        else studyInformationError.value.environmentId = "";
    }

    function validateExportData() {
        if (getArrayLength(dataExportDetails.value.formIds) === 0)
            dataExportErrorDetails.value.formIds = "Please select atleast one form";
        else dataExportErrorDetails.value.formIds = "";
    }

    async function handleSubmit() {
        validateSelectedStudy();
        validateExportData();
        if (
            !checkIfModelHasErrors(dataExportErrorDetails.value) &&
            !checkIfModelHasErrors(studyInformationError.value)
        ) {
            loading.value.dynamicLoading["downloadExportedData"] = true;
            const {
                status,
                data,
                message = "Export success",
                headers,
            } = await publishedFormFieldExportDataAPI({
                id: 0,
                formName: "",
                publishedSubjectFormFieldParentId: 0,
                trialId: studyInformation.value.trialId as number,
                environmentId: studyInformation.value.environmentId as number,
                formIds: dataExportDetails.value.formIds,
                folderIds: dataExportDetails.value.visitIds,
                siteIds: dataExportDetails.value.siteIds,
                isZippingRequired: true, // dataExportDetails.value.isZippingRequired,
                columnNameAsFirstName: dataExportDetails.value.columnNameAsFirstRow,
                successMessageEmailIds: processEmailIds("success"),
                failureMessageEmailIds: processEmailIds("failure"),
                extensionType: dataExportDetails.value.fileExtensionType as string,
                exportDataTo: dataExportDetails.value.exportDataTo as string,
                fieldDetails: [],
                formDetails: [],
                subjectIds: dataExportDetails.value.subjectIds,
            });
            if (status === 200) {
                // const blob = new Blob([data.fileContents], { type: "application/octet-stream" });
                // const url = window.URL.createObjectURL(blob);
                // const url = window.URL.createObjectURL(new Blob([data.fileContents]));
                const headerContentType = String(headers["content-type"]);
                if (!headerContentType.includes("application/json")) {
                    const url = window.URL.createObjectURL(
                        new Blob([data as Blob], { type: headerContentType }),
                    );
                    // Create a link element
                    const link = document.createElement("a");
                    link.href = url;

                    const contentDisposition = String(headers["content-disposition"]);
                    let fileName = `data.${dataExportDetails.value.fileExtensionType}`; // Default name
                    if (contentDisposition) {
                        // const matches = contentDisposition.match(/filename="(.+)"/);
                        const matches = contentDisposition.match(
                            /filename[^;=\n]*=((['"]).*?\2|[^;\n]*)/,
                        );
                        if (matches && matches.length > 1) {
                            fileName = matches[1].replaceAll('"', "");
                        }
                    }
                    // const fileName = data.fileDownloadName;
                    // Set the file name (you can customize this)
                    link.setAttribute("download", fileName);

                    // Append to the body
                    document.body.appendChild(link);

                    // Programmatically click the link to trigger the download
                    link.click();

                    // Cleanup - remove the link and revoke the blob URL
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
    }

    const isLogForm = computed(() => {
        let result = false;
        let exitLoop = false;
        for (const row of formDetailsData.value) {
            for (const subRow of row.fieldDetails) {
                if (subRow.isLogDataEntry) {
                    result = true;
                    exitLoop = true;
                    break;
                }
            }
            if (exitLoop) break;
        }
        return result;
    });

    // const logFormFirstQuestionAndAnswer = computed(() => {
    //     let question = "";
    //     let answer = "";
    //     if (
    //         getArrayLength(formDetailsData.value) > 0 &&
    //         getArrayLength(formDetailsData.value[0].fieldDetails) > 0
    //     ) {
    //         question = formDetailsData.value[0].fieldDetails[0].label;
    //         if (getArrayLength(formDetailsData.value[0].fieldDetails[0].fieldValueDetails) > 0) {
    //             answer = processDisplayName(
    //                 formDetailsData.value[0].fieldDetails[0].fieldValueDetails,
    //                 formDetailsData.value[0].fieldDetails[0].controlType,
    //             );
    //         }
    //     }
    //     return { question, answer };
    // });
    const logFormFirstQuestionAndAnswers = computed(() => {
        const questionAndAnswers: {
            question: string;
            answer: string;
        }[] = [];
        if (
            getArrayLength(formDetailsData.value) > 0 &&
            getArrayLength(formDetailsData.value[0].fieldDetails) > 0
        ) {
            for (const row of formDetailsData.value[0].fieldDetails) {
                if (row.isLogDataEntry || !row.varOID) continue;
                let answer = "";
                if (getArrayLength(row.fieldValueDetails) > 0) {
                    answer = processDisplayName(row.fieldValueDetails, row.controlType);
                }
                questionAndAnswers.push({
                    question: row.label,
                    answer,
                });
            }
        }
        return questionAndAnswers;
    });

    const isYesEnteredForNonLogDataEntriesInLogForm = computed(() => {
        let result = true;
        for (const row of logFormFirstQuestionAndAnswers.value) {
            if (row.answer !== "Yes") {
                result = false;
                break;
            }
        }
        return result;
    });

    // function processStandardFormTableDetails(
    //     columnsResult: IColumn[],
    //     tableData: Record<string, any[]>,
    // ) {
    //     let tableDataRow: Record<string, string> = {};
    //     for (const [index, row] of formDetailsData.value.entries()) {
    //         if (index === 0) standardFormName.value = row.formName;
    //         standardFormsDetails.value.push({
    //             publishedSubjectFormFieldParentId: row.publishedSubjectFormFieldParentId,
    //             publishedSubjectDetailId: 0,
    //             isActive: index === 0,
    //         });
    //         // if (index !== currentIndex.value) continue;
    //         if (!checkIfKeyExistsInObject(index, tableData)) tableData[index] = [];
    //         for (const subRow of row.fieldDetails) {
    //             console.log("subRow in listViewData", index, subRow);
    //             if (index === currentIndex.value)
    //                 columnsResult.push({
    //                     header: subRow.label,
    //                     field: subRow.label,
    //                     show: true,
    //                     icon: false,
    //                 });
    //             tableDataRow[subRow.label] = processDisplayName(
    //                 subRow.fieldValueDetails,
    //                 subRow.controlType,
    //             );
    //         }
    //         if (tableDataRow) tableData[index].push(deepClone(tableDataRow));
    //         tableDataRow = {};
    //     }
    // }

    function processStandardFormDetails() {
        const countDetails: Record<
            string,
            {
                subjectId: number;
                formCount: number;
            }
        > = {};
        const objIndexes: Record<string, number> = {};
        let objIndexCount = 0;
        for (const [index, row] of formDetailsData.value.entries()) {
            if (index === 0) standardFormName.value = row.formName;
            if (!checkIfKeyExistsInObject(row.subjectId, objIndexes)) {
                objIndexes[row.subjectId] = objIndexCount;
                objIndexCount++;
            }
            if (!checkIfKeyExistsInObject(objIndexes[row.subjectId], countDetails))
                countDetails[objIndexes[row.subjectId]] = {
                    subjectId: row.subjectId,
                    formCount: 0,
                };
            countDetails[objIndexes[row.subjectId]].formCount++;
        }
        let maxCount = 0;
        for (const countValue of Object.values(countDetails)) {
            if (maxCount < countValue.formCount) maxCount = countValue.formCount;
        }
        for (let i = 0; i < maxCount; i++) {
            standardFormsDetails.value.push({
                publishedSubjectFormFieldParentId: 0, // row.publishedSubjectFormFieldParentId,
                publishedSubjectDetailId: 0,
                isActive: i === 0,
            });
        }
        return objIndexes;
    }

    const validGroupIds = computed(() => {
        const result: number[] = [];
        for (const row of formDetailsData.value) {
            for (const subRow of row.fieldDetails) {
                if (!result.includes(subRow.groupId)) result.push(subRow.groupId);
            }
        }
        return result;
    });

    const groupedTabs = computed(() => {
        const tabsList: string[] = [];
        const tabKeys: {
            slotName: string;
            groupId: number;
        }[] = [];
        for (const row of formDetailsData.value) {
            for (const subRow of row.fieldDetails) {
                if (!subRow.varOID) {
                    tabsList.push(capitalizeWord(subRow.label));
                    tabKeys.push({
                        groupId: Number(subRow.groupId),
                        slotName: convertWordsIntoCasedWords(subRow.label, "camel case"),
                    });
                }
            }
        }
        return { tabsList, tabKeys };
    });

    const activeTabIndex = ref<number>(0);

    function processStandardFormTableDetails(
        columnsResult: Record<string, IColumn[]>,
        tableData: Record<string, Record<string, any[]>>,
    ) {
        let tableDataRow: Record<string, string> = {};
        processStandardFormDetails();
        const objIndexes: Record<string, number> = {};
        for (const [index, row] of formDetailsData.value.entries()) {
            if (!checkIfKeyExistsInObject(row.subjectId, objIndexes)) objIndexes[row.subjectId] = 0;
            else objIndexes[row.subjectId]++;

            for (const groupId of validGroupIds.value) {
                if (!checkIfKeyExistsInObject(groupId, columnsResult)) columnsResult[groupId] = [];
                // if (!checkIfKeyExistsInObject(groupId, tableDataRow)) tableDataRow[groupId] = {};

                if (!checkIfKeyExistsInObject(groupId, tableData)) tableData[groupId] = {};

                if (!checkIfKeyExistsInObject(objIndexes[row.subjectId], tableData[groupId]))
                    tableData[groupId][objIndexes[row.subjectId]] = [];

                if (index === currentIndex.value) {
                    columnsResult[groupId].push(
                        {
                            header: "Subject ID",
                            field: "Subject ID",
                            show: true,
                            icon: false,
                            sort: true,
                            sortOrder: "descending",
                        },
                        {
                            header: "Site Name",
                            field: "Site Name",
                            show: true,
                            icon: false,
                            sort: true,
                            sortOrder: "descending",
                        },
                        {
                            header: "Site Code",
                            field: "Site Code",
                            show: true,
                            icon: false,
                            sort: true,
                            sortOrder: "descending",
                        },
                    );
                }
                tableDataRow["Subject ID"] = row.subjectName;
                tableDataRow["Site Name"] = row.siteName;
                tableDataRow["Site Code"] = row.siteNumber;

                for (const subRow of row.fieldDetails) {
                    if (!subRow.varOID) continue;
                    if (index === currentIndex.value)
                        columnsResult[groupId].push({
                            header: subRow.label,
                            field: subRow.label,
                            show: true,
                            icon: false,
                            sort: true,
                            sortOrder: "descending",
                        });
                    tableDataRow[subRow.label] = processDisplayName(
                        subRow.fieldValueDetails,
                        subRow.controlType,
                    );
                }
                if (tableDataRow)
                    tableData[groupId][objIndexes[row.subjectId]].push(deepClone(tableDataRow));
                tableDataRow = {};
            }
        }
    }

    function processLogFormTableDetails(
        columnsResult: Record<string, IColumn[]>,
        tableData: Record<string, Record<string, any[]>>,
    ) {
        let tableDataRow: Record<string, string> = {};
        let tableDataRowRef: Record<string, Record<string, string>> = {};
        const tableDataCountDetails: Record<string, number> = {};
        const processedUniqueIds: number[] = [];
        const processedFieldsIds: number[] = [];
        for (const [index, row] of formDetailsData.value.entries()) {
            for (const groupId of validGroupIds.value) {
                if (!checkIfKeyExistsInObject(groupId, columnsResult)) columnsResult[groupId] = [];
                if (!checkIfKeyExistsInObject(groupId, tableData)) tableData[groupId] = {};
                if (!checkIfKeyExistsInObject(index, tableData[groupId]))
                    tableData[groupId][index] = [];
                if (index === currentIndex.value)
                    columnsResult[groupId].push(
                        {
                            header: "Subject ID",
                            field: "Subject ID",
                            show: true,
                            icon: false,
                            sort: true,
                            sortOrder: "descending",
                        },
                        {
                            header: "Site Name",
                            field: "Site Name",
                            show: true,
                            icon: false,
                            sort: true,
                            sortOrder: "descending",
                        },
                        {
                            header: "Site Code",
                            field: "Site Code",
                            show: true,
                            icon: false,
                            sort: true,
                            sortOrder: "descending",
                        },
                    );
                for (const subRow of row.fieldDetails) {
                    // if (!("Record Id" in tableDataRow)) tableDataRow["Record Id"] = String(subRow.id);
                    if (!subRow.isLogDataEntry) continue;
                    if (!subRow.varOID) continue;
                    if (!processedUniqueIds.includes(subRow.id)) {
                        processedUniqueIds.push(subRow.id);
                        columnsResult[groupId].push({
                            header: subRow.oid,
                            field: subRow.oid,
                            show: true,
                            icon: false,
                            sort: true,
                            sortOrder: "descending",
                        });
                    }
                    if (!processedFieldsIds.includes(subRow.id)) {
                        processedFieldsIds.push(subRow.id);
                        if (!checkIfKeyExistsInObject(subRow.id, tableDataCountDetails))
                            tableDataCountDetails[subRow.id] = 0;
                    } else {
                        tableDataCountDetails[subRow.id]++;
                    }
                    if (!checkIfKeyExistsInObject("Subject ID", tableDataRow))
                        tableDataRow["Subject ID"] = row.subjectName;
                    if (!checkIfKeyExistsInObject("Site Name", tableDataRow))
                        tableDataRow["Site Name"] = row.siteName;
                    if (!checkIfKeyExistsInObject("Site Code", tableDataRow))
                        tableDataRow["Site Code"] = row.siteNumber;
                    tableDataRow[subRow.oid] =
                        processDisplayName(subRow.fieldValueDetails, subRow.controlType) || "-";
                    // if (!checkIfKeyExistsInObject(groupId, tableDataRowRef))
                    //     tableDataRowRef[groupId] = {};
                    if (
                        !checkIfKeyExistsInObject(tableDataCountDetails[subRow.id], tableDataRowRef)
                    )
                        tableDataRowRef[tableDataCountDetails[subRow.id]] = {};
                    tableDataRowRef[tableDataCountDetails[subRow.id]] = {
                        ...tableDataRowRef[tableDataCountDetails[subRow.id]],
                        ...tableDataRow,
                    };
                    tableDataRow = {};
                }
                for (const [key] of Object.entries(tableDataRowRef)) {
                    // value["Subject Code"] = row.subjectName;
                    // value["Site Name"] = row.siteName;
                    // value["Site Code"] = row.siteNumber;
                    if (tableDataRowRef[key])
                        tableData[groupId][index].push(deepClone(tableDataRowRef[key]));
                }
                tableDataRowRef = {};
            }
            // checkIfAllLogFieldsDataAreEmpty(tableDataRowRef);
            // if (tableDataRowRef) tableData[index].push(deepClone(tableDataRowRef));
            // tableDataRow = {};
        }
    }

    function resetViewData() {
        showViewData.value = false;
        currentIndex.value = 0;
        viewDataColumns.value = [];
        viewDataDetails.value = {};
        viewDataDetailsRef.value = {};
        standardFormsDetails.value = [];
        standardFormName.value = "";
        formDetailsData.value = [];
    }

    function resetAllViewDataDetails() {
        resetViewData();
        dataViewDetails.value = { ...defaultDataViewDetail() };
        dataViewErrorDetails.value = { ...defaultDataViewErrorDetail() };
    }

    function processColumnsAndTableData() {
        const columnsResult: Record<string, IColumn[]> = {};
        // const tableDataResult: Record<string, Record<string, string>> = {};
        const tableDataResult: Record<string, Record<string, any[]>> = {};
        // viewDataDetails
        if (isLogForm.value) processLogFormTableDetails(columnsResult, tableDataResult);
        else processStandardFormTableDetails(columnsResult, tableDataResult);
        // for (const formRow of data) {
        //     const fieldObj: Record<string, TNullableString>[] = [];
        //     for (const fieldDetailRow of formRow.fieldDetails) {
        //         const fieldValueDetailObj: Record<string, TNullableString> = {};
        //         for (const fieldValueDetailRow of fieldDetailRow.fieldValueDetails) {

        //         }
        //     }
        // }
        console.log("columnsResult in processColumnsAndTableData", columnsResult);
        console.log("tableDataResult in processColumnsAndTableData", tableDataResult);
        viewDataColumns.value = deepClone(columnsResult);
        viewDataDetails.value = deepClone(tableDataResult);
        viewDataDetailsRef.value = deepClone(tableDataResult);
    }

    function validateViewData() {
        if (!dataViewDetails.value.formId)
            dataViewErrorDetails.value.formId = "Please select a form";
        else dataViewErrorDetails.value.formId = "";
    }

    async function publishedFormFieldsViewData() {
        validateSelectedStudy();
        validateViewData();
        if (
            !checkIfModelHasErrors(dataViewErrorDetails.value) &&
            !checkIfModelHasErrors(studyInformationError.value)
        ) {
            loading.value.dynamicLoading["viewData"] = true;
            resetViewData();
            const { status, data } = await publishedFormFieldsViewDataAPI({
                trialId: studyInformation.value.trialId as number,
                environmentId: studyInformation.value.environmentId as number,
                folderId: dataViewDetails.value.visitId as number,
                formId: dataViewDetails.value.formId as number,
                siteId: dataViewDetails.value.siteId,
                subjects: dataViewDetails.value.subjectIds.join(","),
            });
            if (status === 200) {
                formDetailsData.value = deepClone(data);
                processColumnsAndTableData();
            } else if (status !== 401) {
                formDetailsData.value = [];
            }
            showViewData.value = true;
            loading.value.dynamicLoading["viewData"] = false;
        }
    }

    function handleFormBadgeClick(rowIndex: number) {
        for (const [index, row] of standardFormsDetails.value.entries()) {
            if (index === rowIndex) {
                row.isActive = true;
                currentIndex.value = index;
            } else {
                row.isActive = false;
            }
        }
    }

    function handleViewDataTableSort(columnHeading: string, newOrderType: TSortType) {
        if (checkIfKeyExistsInObject(currentIndex.value, viewDataDetails.value)) {
            if (newOrderType === "initial")
                viewDataDetails.value[currentIndex.value] = deepClone(
                    viewDataDetailsRef.value[currentIndex.value],
                );
            else
                viewDataDetails.value[currentIndex.value] = sortArray({
                    data: deepClone(viewDataDetails.value[currentIndex.value]),
                    key: columnHeading,
                    sortBy: newOrderType === "descending" ? "desc" : "asc",
                    type: "object",
                    valueTypeCast: isDateTimeField(columnHeading) ? "date" : "string",
                });
        }
    }

    function validateCRFData() {
        if (!crfDataDetails.value.exportDataTo)
            crfDataErrorDetails.value.exportDataTo = "Please select a export option";
        else crfDataErrorDetails.value.exportDataTo = "";
        if (!crfDataDetails.value.type) crfDataErrorDetails.value.type = "Please select a type";
        else crfDataErrorDetails.value.type = "";
    }

    async function publishedFormFieldsCRFData() {
        validateSelectedStudy();
        validateCRFData();
        if (
            !checkIfModelHasErrors(crfDataErrorDetails.value) &&
            !checkIfModelHasErrors(studyInformationError.value)
        ) {
            loading.value.dynamicLoading["crfData"] = true;
            let status = 500;
            let data: Blob | JSON | null = null;
            let message = "";
            let headers: AxiosResponseHeaders | null = null;
            if (crfDataDetails.value.type === "Blank") {
                const blankCRFResponse = await blankCRFAPI({
                    trialId: studyInformation.value.trialId as number,
                    environmentId: studyInformation.value.environmentId as number,
                    exportDataTo: crfDataDetails.value.exportDataTo as string,
                    studyName: null,
                    pageName: null,
                    siteName: null,
                    visitName: null,
                    subjectCode: null,
                    investigatorName: null,
                    questionsAndResponses: [],
                });
                status = blankCRFResponse.status;
                data = blankCRFResponse.data;
                message = blankCRFResponse.message;
                headers = blankCRFResponse.headers;
            } else {
                const annotatedCRFResponse = await annotatedCRFAPI({
                    trialId: studyInformation.value.trialId as number,
                    environmentId: studyInformation.value.environmentId as number,
                    exportDataTo: crfDataDetails.value.exportDataTo as string,
                    studyName: null,
                    pageName: null,
                    siteName: null,
                    visitName: null,
                    subjectCode: null,
                    investigatorName: null,
                    questionsAndResponses: [],
                });
                status = annotatedCRFResponse.status;
                data = annotatedCRFResponse.data;
                message = annotatedCRFResponse.message;
                headers = annotatedCRFResponse.headers;
            }
            if (status === 200) {
                const headerContentType = String(headers["content-type"]);
                if (!headerContentType.includes("application/json")) {
                    const url = window.URL.createObjectURL(
                        new Blob([data as Blob], { type: headerContentType }),
                    );
                    const link = document.createElement("a");
                    link.href = url;
                    const contentDisposition = String(headers["content-disposition"]);
                    let fileName = `data.${dataExportDetails.value.fileExtensionType}`; // Default name
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
            // const { status, data } = await publishedFormFieldsViewDataAPI({
            //     trialId: studyInformation.value.trialId as number,
            //     environmentId: studyInformation.value.environmentId as number,
            //     visitId: dataViewDetails.value.visitId as number,
            //     formId: dataViewDetails.value.formId as number,
            //     siteId: dataViewDetails.value.siteId,
            // });
            // if (status === 200) {
            //     formDetailsData.value = deepClone(data);
            //     processColumnsAndTableData();
            //     showViewData.value = true;
            // } else if (status !== 401) {
            //     formDetailsData.value = [];
            // }
            loading.value.dynamicLoading["crfData"] = false;
        }
    }

    function resetAllCRFDataDetails() {
        crfDataDetails.value = { ...defaultCRFDataDetail() };
        crfDataErrorDetails.value = { ...defaultCRFDatarrorDetail() };
    }

    watch(
        () => studyStore.loading.pageDetails,
        (newValue, oldValue) => {
            if (oldValue && !newValue) {
                onPageLoad();
            }
        },
    );

    onMounted(() => {
        loading.value.setDynamicLoading([
            "nestedSubjectList",
            "downloadExportedData",
            "viewData",
            "crfData",
        ]);
        // if (
        //     checkIfActionIsAllowed(studyStore.getRoleIdBySiteId(), RolePermissionType.ReportModule)
        // ) {
        //     if (studyStore.isStudySelected()) {
        //         if (studyStore.loading.pageDetails) studyStore.loading.pageDetails = false;
        //         else onPageLoad();
        //     } else {
        //         studyStore.triggerModel = true;
        //     }
        // } else {
        //     await redirectToDashboardDueToNoPermission(true);
        // }
        if (studyStore.isStudySelected()) {
            if (studyStore.loading.pageDetails) studyStore.loading.pageDetails = false;
            else onPageLoad();
        } else {
            studyStore.triggerModel = true;
        }
    });
</script>

<template>
    <div class="flex flex-row flex-wrap items-center gap-[2rem] py-[2rem]">
        <div
            class="transition-all min-h-full bg-white rounded-[var(--border-radius-20)] w-full user-list-container"
            :class="[globalStore.dropdownOptionVisible ? 'overflow-y-auto' : 'overflow-y-auto']"
        >
            <edc-tab-view
                :tabs="['Data Export', 'Data View', 'CRF Export']"
                @on-tab-change="
                    (tabIndex) => {
                        if (tabIndex === 0) {
                            resetAllViewDataDetails();
                            resetAllCRFDataDetails();
                        } else if (tabIndex === 1) {
                            resetExportModel();
                            resetAllCRFDataDetails();
                        } else {
                            resetAllViewDataDetails();
                            resetExportModel();
                        }
                    }
                "
            >
                <template #dataExport>
                    <div class="flex flex-row items-start gap-[1rem]">
                        <edc-dropdown
                            :key="`trialId-${studyInformation.trialId ? studyInformation.trialId : ''}`"
                            v-model="studyInformation.trialId"
                            container-class="w-[20rem]"
                            default-value="Select Study"
                            label="Study"
                            :options="studyStore.trialLookups"
                            label-class="mt-[0.5rem]"
                            option-placement="bottom"
                            option-class="w-[20rem]"
                            :enable-clear="true"
                            :required="true"
                            :disabled="loading.isDisabled(studyStore.loading.trialList)"
                            :loading="studyStore.loading.trialList"
                            :ellipse-count="50"
                            :error="studyInformationError.trialId"
                            @on-select="
                                () => {
                                    studyStore.processEnvironmentDetails();
                                }
                            "
                        />
                        <edc-dropdown
                            :key="`environmentId-${studyInformation.environmentId ? studyInformation.environmentId : ''}`"
                            v-model="studyInformation.environmentId"
                            container-class="w-[20rem]"
                            default-value="Select Environment"
                            label="Environment"
                            :options="studyStore.environmentLookups"
                            label-class="mt-[0.5rem]"
                            option-placement="bottom"
                            option-class="w-[20rem]"
                            :enable-clear="true"
                            :required="true"
                            :disabled="loading.isDisabled(studyStore.loading.environmentList)"
                            :loading="studyStore.loading.environmentList"
                            :ellipse-count="50"
                            :error="studyInformationError.environmentId"
                        />
                    </div>
                    <div
                        class="md:max-h-[36rem] lg:max-h-[38rem] xl:max-h-[42rem] 2xl:max-h-[60rem]"
                    >
                        <edc-tab-view
                            :tabs="[
                                'Export',
                                // 'Jobs', 'Active Scheduled Jobs'
                            ]"
                        >
                            <template #export>
                                <div class="flex flex-col gap-[1rem]">
                                    <div class="grid grid-cols-2 gap-[1rem] w-[70%] lg:w-1/2">
                                        <!-- <edc-dropdown
                                            :key="`dataSources-${dataExportDetails.dataSources ? dataExportDetails.dataSources : ''}`"
                                            v-model="dataExportDetails.dataSources"
                                            container-class="w-[32rem]"
                                            default-value="Select Data Sources"
                                            label="Data Sources"
                                            :options="[]"
                                            
                                            
                                            option-placement="bottom"
                                            option-class="w-[32rem]"
                                            :enable-clear="true"
                                            :disabled="false"
                                            :loading="false"
                                            :ellipse-count="50"
                                        /> -->
                                        <edc-multi-select
                                            :key="`visitIds-${getArrayLength(dataExportDetails.visitIds) > 0 ? dataExportDetails.visitIds.join(', ') : ''}`"
                                            v-model="dataExportDetails.visitIds"
                                            container-class="w-full"
                                            default-value="Select visits"
                                            label="Visits"
                                            :options="trialVisitLookups"
                                            option-placement="bottom"
                                            :disabled="false"
                                            :loading="false"
                                            :error="null"
                                            :ellipse-count="43"
                                            :is-all-options-selected="
                                                getArrayLength(dataExportDetails.visitIds) !== 0 &&
                                                getArrayLength(dataExportDetails.visitIds) ===
                                                    getArrayLength(trialVisitLookups)
                                            "
                                            select-all-label="Select all visits"
                                            @on-blur="
                                                (selectedOptions: number[]) => {
                                                    dataExportDetails.visitIds = [
                                                        ...selectedOptions,
                                                    ];
                                                    dataExportDetails.formIds = [];
                                                    // if (
                                                    //     // getArrayLength(
                                                    //     //     dataExportDetails.visitIds,
                                                    //     // ) !== 0 &&
                                                    //     // getArrayLength(
                                                    //     //     dataExportDetails.visitIds,
                                                    //     // ) === getArrayLength(trialVisitLookups)
                                                    //     getArrayLength(dataExportDetails.visitIds) >
                                                    //     1
                                                    // ) {
                                                    //     dataExportDetails.isZippingRequired = true;
                                                    // } else if (
                                                    //     getArrayLength(
                                                    //         dataExportDetails.visitIds,
                                                    //     ) === 0 &&
                                                    //     dataExportDetails.isZippingRequired
                                                    // )
                                                    //     dataExportDetails.isZippingRequired = false;
                                                }
                                            "
                                        />
                                        <edc-multi-select
                                            :key="`formIds-${getArrayLength(dataExportDetails.formIds) > 0 ? dataExportDetails.formIds.join(', ') : ''}`"
                                            v-model="dataExportDetails.formIds"
                                            container-class="w-full"
                                            default-value="Select forms"
                                            label="Forms"
                                            :options="formLookups"
                                            option-placement="bottom"
                                            :disabled="false"
                                            :loading="false"
                                            :error="dataExportErrorDetails.formIds"
                                            :required="true"
                                            :ellipse-count="39"
                                            :is-all-options-selected="
                                                getArrayLength(dataExportDetails.formIds) !== 0 &&
                                                getArrayLength(dataExportDetails.formIds) ===
                                                    getArrayLength(formLookups)
                                            "
                                            select-all-label="Select all forms"
                                            @on-blur="
                                                (selectedOptions) => {
                                                    dataExportDetails.formIds = [
                                                        ...(selectedOptions as number[]),
                                                    ];
                                                    // if (
                                                    //     getArrayLength(dataExportDetails.formIds) >
                                                    //     1
                                                    // ) {
                                                    //     dataExportDetails.isZippingRequired = true;
                                                    // } else if (
                                                    //     getArrayLength(
                                                    //         dataExportDetails.formIds,
                                                    //     ) === 0 &&
                                                    //     dataExportDetails.isZippingRequired
                                                    // )
                                                    //     dataExportDetails.isZippingRequired = false;
                                                }
                                            "
                                        />
                                        <edc-multi-select
                                            :key="`siteIds-${getArrayLength(dataExportDetails.siteIds) > 0 ? dataExportDetails.siteIds.join(', ') : ''}`"
                                            v-model="dataExportDetails.siteIds"
                                            container-class="w-full"
                                            default-value="Select sites"
                                            label="Sites"
                                            :options="studySiteLookups"
                                            option-placement="bottom"
                                            :disabled="false"
                                            :loading="false"
                                            :error="null"
                                            :ellipse-count="43"
                                            :is-all-options-selected="
                                                getArrayLength(dataExportDetails.siteIds) !== 0 &&
                                                getArrayLength(dataExportDetails.siteIds) ===
                                                    getArrayLength(studySiteLookups)
                                            "
                                            select-all-label="Select all sites"
                                            @on-blur="
                                                (selectedOptions) => {
                                                    dataExportDetails.siteIds = [
                                                        ...(selectedOptions as number[]),
                                                    ];
                                                }
                                            "
                                        />
                                        <edc-multi-select
                                            :key="`subjectIds-${getArrayLength(dataExportDetails.subjectIds) > 0 ? dataExportDetails.subjectIds.join(', ') : ''}`"
                                            v-model="dataExportDetails.subjectIds"
                                            container-class="w-full"
                                            default-value="Select subjects"
                                            label="Subjects"
                                            :options="subjectLookups"
                                            option-placement="bottom"
                                            :disabled="false"
                                            :loading="false"
                                            :error="null"
                                            :ellipse-count="43"
                                            :is-all-options-selected="
                                                getArrayLength(dataExportDetails.subjectIds) !==
                                                    0 &&
                                                getArrayLength(dataExportDetails.subjectIds) ===
                                                    getArrayLength(subjectLookups)
                                            "
                                            select-all-label="Select all subjects"
                                            @on-blur="
                                                (selectedOptions) => {
                                                    dataExportDetails.subjectIds = [
                                                        ...(selectedOptions as number[]),
                                                    ];
                                                }
                                            "
                                        />
                                        <edc-dropdown
                                            :key="`jobModeType-${dataExportDetails.jobModeType ? dataExportDetails.jobModeType : ''}`"
                                            v-model="dataExportDetails.jobModeType"
                                            container-class="w-full"
                                            default-value="Select a type"
                                            label="Job Mode Type"
                                            :options="[
                                                {
                                                    label: 'Immediate',
                                                    value: 'Immediate',
                                                },
                                                // {
                                                //     label: 'Scheduled',
                                                //     value: 'Scheduled',
                                                // },
                                            ]"
                                            option-placement="bottom"
                                            :disabled="false"
                                            :loading="false"
                                            :ellipse-count="50"
                                        />
                                        <edc-dropdown
                                            :key="`exportType-${dataExportDetails.exportType ? dataExportDetails.exportType : ''}`"
                                            v-model="dataExportDetails.exportType"
                                            container-class="w-full"
                                            default-value="Select a type"
                                            label="Export Type"
                                            :options="[
                                                {
                                                    label: 'Text Export',
                                                    value: 'Text Export',
                                                },
                                            ]"
                                            option-placement="bottom"
                                            :disabled="false"
                                            :loading="false"
                                            :ellipse-count="50"
                                        />
                                        <edc-dropdown
                                            :key="`fileExtensionType-${dataExportDetails.fileExtensionType ? dataExportDetails.fileExtensionType : ''}`"
                                            v-model="dataExportDetails.fileExtensionType"
                                            container-class="w-full"
                                            default-value="Select an extension"
                                            label="Extension Type"
                                            :options="[
                                                {
                                                    label: 'csv',
                                                    value: 'csv',
                                                },
                                                {
                                                    label: 'xlsx',
                                                    value: 'xlsx',
                                                },
                                            ]"
                                            option-placement="bottom"
                                            :disabled="false"
                                            :loading="false"
                                            :ellipse-count="50"
                                        />
                                        <edc-dropdown
                                            :key="`exportDataTo-${dataExportDetails.exportDataTo ? dataExportDetails.exportDataTo : ''}`"
                                            v-model="dataExportDetails.exportDataTo"
                                            container-class="w-full"
                                            default-value="Select an option"
                                            label="Export Data To"
                                            :options="EXPORT_DATA_TO_OPTIONS"
                                            option-placement="bottom"
                                            :disabled="false"
                                            :loading="false"
                                            :ellipse-count="50"
                                            @on-select="
                                                () => {
                                                    dataExportDetails.successNotificationEmailIds =
                                                        null;
                                                    dataExportDetails.failureNotificationEmailIds =
                                                        null;
                                                }
                                            "
                                        />
                                        <!-- <edc-checkbox
                                            v-model="dataExportDetails.isZippingRequired"
                                            label="Is Zipping Required?"
                                            label-class="!mb-[0.2rem]"
                                            name="isZippingRequired"
                                            :disabled="false"
                                        /> -->
                                        <edc-text-area
                                            v-if="dataExportDetails.exportDataTo === 'Email'"
                                            v-model="dataExportDetails.successNotificationEmailIds"
                                            container-class="w-full"
                                            label="Success Notification Email IDs (Comma seperated)"
                                            :disabled="false"
                                        />
                                        <edc-text-area
                                            v-if="dataExportDetails.exportDataTo === 'Email'"
                                            v-model="dataExportDetails.failureNotificationEmailIds"
                                            container-class="w-full"
                                            label="Failure Notification Email IDs (Comma seperated)"
                                            :disabled="false"
                                        />

                                        <!-- <edc-checkbox
                                            v-model="dataExportDetails.isIncrementalDate"
                                            
                                            label="Incremental Name"
                                            label-class="!mb-[0.2rem]"
                                            
                                            name="isIncrementalDate"
                                            :disabled="false"
                                        /> -->
                                        <edc-checkbox
                                            v-model="dataExportDetails.columnNameAsFirstRow"
                                            label="Column Name as First Row"
                                            label-class="!mb-[0.2rem]"
                                            name="columnNameAsFirstRow"
                                            :disabled="false"
                                        />
                                        <!-- <edc-checkbox
                                            v-model="dataExportDetails.setDebugFlag"
                                            
                                            label="Set Debug Flag"
                                            label-class="!mb-[0.2rem]"
                                            
                                            name="setDebugFlag"
                                            :disabled="false"
                                        /> -->
                                    </div>
                                    <div class="cols-span-2 flex flex-row items-center gap-[1rem]">
                                        <!-- <edc-action-button
                                            label="Submit"
                                            :on-click="() => {}"
                                            container-class="rounded-[--border-radius-4] px-[2rem] py-[0.5rem]"
                                            label-class="font-12"
                                        /> -->
                                        <edc-action-button
                                            label="Submit"
                                            :on-click="
                                                async () => {
                                                    await handleSubmit();
                                                }
                                            "
                                            container-class="rounded-[--border-radius-4] px-[2rem] py-[0.5rem]"
                                            label-class="font-12"
                                            type="submit"
                                        />
                                        <!-- <edc-action-button
                                            label="Cancel"
                                            type="cancel"
                                            :on-click="
                                                () => {
                                                    resetExportModel();
                                                }
                                            "
                                            container-class="rounded-[--border-radius-4] px-[2rem] py-[0.5rem]"
                                            label-class="font-12"
                                        /> -->
                                    </div>
                                </div>
                            </template>
                            <!-- <template #jobs>
                                <div class="flex flex-col gap-[1rem]">
                                    <div class="flex flex-row items-center w-fit gap-[1rem]">
                                        <edc-search-bar
                                            v-model="jobSearch"
                                            element-id="jobSearch"
                                        />
                                        <edc-pressable
                                            container-class="hover:opacity-100 rounded-[var(--border-radius-6)] bg-[var(--color-accent)] hover:bg-[var(--color-accent-hover)]"
                                            slot-wrapper-class="flex flex-row items-center justify-between gap-x-[1.5rem] px-[1rem] py-[0.6rem] lg:py-[0.7rem]"
                                            :on-click="async () => {}"
                                        >
                                            <span class="text-[1.2rem] white-text">Create Job</span>
                                            <edc-icon
                                                icon="plus"
                                                class="h-[1.5rem]"
                                                fill="var(--color-white)"
                                            />
                                        </edc-pressable>
                                    </div>
                                    <edc-data-table
                                        :columns="jobTableColumns"
                                        :table-data="jobTableData"
                                        :loading="false"
                                        :disabled="loading.isDisabled()"
                                        pagination-type="none"
                                        search-key="jobSearch"
                                        table-style="default"
                                        :enable-row-click="false"
                                        :custom-content="true"
                                        table-cell-container-class="!py-[1.85rem]"
                                    >
                                        <template #custom-content="{ data }">
                                            <td
                                                class="font-normal text-left font-12 custom-row !py-[1.85rem]"
                                            >
                                                <span>{{ data.jobId }}</span>
                                            </td>
                                            <td
                                                class="font-normal text-left font-12 custom-row !py-[1.85rem]"
                                            >
                                                <span>{{ data.scheduledParentJobId }}</span>
                                            </td>
                                            <td
                                                class="font-normal text-left font-12 custom-row !py-[1.85rem]"
                                            >
                                                <span>{{ data.submissionMode }}</span>
                                            </td>
                                            <td
                                                class="font-normal text-left font-12 custom-row !py-[1.85rem]"
                                            >
                                                <span>{{ data.status }}</span>
                                            </td>
                                            <td
                                                class="font-normal text-left font-12 custom-row !py-[1.85rem]"
                                            >
                                                <span>{{
                                                    data.startDate
                                                        ? formatDate(
                                                              data.startDate,
                                                              "DD-MMM-YYYY HH:mm:ss",
                                                          )
                                                        : ""
                                                }}</span>
                                            </td>
                                            <td
                                                class="font-normal text-left font-12 custom-row !py-[1.85rem]"
                                            >
                                                <span>{{
                                                    data.endDate
                                                        ? formatDate(
                                                              data.endDate,
                                                              "DD-MMM-YYYY HH:mm:ss",
                                                          )
                                                        : ""
                                                }}</span>
                                            </td>
                                            <td
                                                class="font-normal text-left font-12 custom-row !py-[1.85rem]"
                                            >
                                                <span>{{ data.submittedBy }}</span>
                                            </td>
                                            <td
                                                class="font-normal text-left font-12 custom-row !py-[1.85rem]"
                                            >
                                                <span>{{
                                                    data.submittedOn
                                                        ? formatDate(
                                                              data.submittedOn,
                                                              "DD-MMM-YYYY HH:mm:ss",
                                                          )
                                                        : ""
                                                }}</span>
                                            </td>
                                            <td
                                                class="font-normal text-left font-12 custom-row !py-[1.85rem]"
                                            >
                                                <span>{{ data.dataFile }}</span>
                                            </td>
                                            <td
                                                class="font-normal text-left font-12 custom-row !py-[1.85rem]"
                                            >
                                                <span>{{ data.exportDateTo }}</span>
                                            </td>
                                            <td
                                                class="font-normal text-left font-12 custom-row !py-[1.85rem]"
                                            >
                                                <span>{{ data.fileName }}</span>
                                            </td>
                                            <td
                                                class="font-normal text-left font-12 custom-row !py-[1.85rem]"
                                            >
                                                <span>{{ data.scheduledInterval }}</span>
                                            </td>
                                            <td
                                                class="font-normal text-left font-12 custom-row !py-[1.85rem]"
                                            >
                                                <span>{{
                                                    data.scheduledStartDate
                                                        ? formatDate(
                                                              data.scheduledStartDate,
                                                              "DD-MMM-YYYY HH:mm:ss",
                                                          )
                                                        : ""
                                                }}</span>
                                            </td>
                                            <td
                                                class="font-normal text-left font-12 custom-row !py-[1.85rem]"
                                            >
                                                <span>{{
                                                    data.scheduledEndDate
                                                        ? formatDate(
                                                              data.scheduledEndDate,
                                                              "DD-MMM-YYYY HH:mm:ss",
                                                          )
                                                        : ""
                                                }}</span>
                                            </td>
                                        </template>
                                    </edc-data-table>
                                </div>
                            </template>
                            <template #activeScheduledJobs>
                                <div class="flex flex-col gap-[1rem]">
                                    <div class="w-fit">
                                        <edc-search-bar
                                            v-model="activeScheduledJobSearch"
                                            element-id="activeScheduledJobSearch"
                                        />
                                    </div>
                                    <edc-data-table
                                        :columns="activeScheduledJobTableColumns"
                                        :table-data="activeScheduledJobTableData"
                                        :loading="false"
                                        :disabled="loading.isDisabled()"
                                        pagination-type="none"
                                        search-key="activeScheduledJobSearch"
                                        table-style="default"
                                        :enable-row-click="false"
                                        :custom-content="true"
                                        table-cell-container-class="!py-[1.85rem]"
                                    >
                                        <template #custom-content="{ data }">
                                            <td
                                                class="font-normal text-left font-12 custom-row !py-[1.85rem]"
                                            >
                                                <span>{{ data.jobId }}</span>
                                            </td>
                                            <td
                                                class="font-normal text-left font-12 custom-row !py-[1.85rem]"
                                            >
                                                <span>{{ data.jobName }}</span>
                                            </td>
                                            <td
                                                class="font-normal text-left font-12 custom-row !py-[1.85rem]"
                                            >
                                                <span>{{ data.refJobName }}</span>
                                            </td>
                                            <td
                                                class="font-normal text-left font-12 custom-row !py-[1.85rem]"
                                            >
                                                <span>{{ data.status }}</span>
                                            </td>
                                            <td
                                                class="font-normal text-left font-12 custom-row !py-[1.85rem]"
                                            >
                                                <span>{{ data.submittedBy }}</span>
                                            </td>
                                            <td
                                                class="font-normal text-left font-12 custom-row !py-[1.85rem]"
                                            >
                                                <span>{{
                                                    data.submittedOn
                                                        ? formatDate(
                                                              data.submittedOn,
                                                              "DD-MMM-YYYY HH:mm:ss",
                                                          )
                                                        : ""
                                                }}</span>
                                            </td>
                                            <td
                                                class="font-normal text-left font-12 custom-row !py-[1.85rem]"
                                            >
                                                <span>{{ data.scheduledInterval }}</span>
                                            </td>
                                            <td
                                                class="font-normal text-left font-12 custom-row !py-[1.85rem]"
                                            >
                                                <span>{{
                                                    data.scheduledStartDate
                                                        ? formatDate(
                                                              data.scheduledStartDate,
                                                              "DD-MMM-YYYY HH:mm:ss",
                                                          )
                                                        : ""
                                                }}</span>
                                            </td>
                                            <td
                                                class="font-normal text-left font-12 custom-row !py-[1.85rem]"
                                            >
                                                <span>{{
                                                    data.scheduledEndDate
                                                        ? formatDate(
                                                              data.scheduledEndDate,
                                                              "DD-MMM-YYYY HH:mm:ss",
                                                          )
                                                        : ""
                                                }}</span>
                                            </td>
                                        </template>
                                    </edc-data-table>
                                </div>
                            </template> -->
                        </edc-tab-view>
                    </div>
                </template>
                <template #dataView>
                    <div class="flex flex-row items-start gap-[1rem]">
                        <edc-dropdown
                            :key="`trialId-${studyInformation.trialId ? studyInformation.trialId : ''}`"
                            v-model="studyInformation.trialId"
                            container-class="w-[20rem]"
                            default-value="Select Study"
                            label="Study"
                            :options="studyStore.trialLookups"
                            label-class="mt-[0.5rem]"
                            option-placement="bottom"
                            option-class="w-[20rem]"
                            :enable-clear="true"
                            :required="true"
                            :disabled="loading.isDisabled(studyStore.loading.trialList)"
                            :loading="studyStore.loading.trialList"
                            :ellipse-count="50"
                            :error="studyInformationError.trialId"
                            @on-select="
                                () => {
                                    studyStore.processEnvironmentDetails();
                                }
                            "
                        />
                        <edc-dropdown
                            :key="`environmentId-${studyInformation.environmentId ? studyInformation.environmentId : ''}`"
                            v-model="studyInformation.environmentId"
                            container-class="w-[20rem]"
                            default-value="Select Environment"
                            label="Environment"
                            :options="studyStore.environmentLookups"
                            label-class="mt-[0.5rem]"
                            option-placement="bottom"
                            option-class="w-[20rem]"
                            :enable-clear="true"
                            :required="true"
                            :disabled="loading.isDisabled(studyStore.loading.environmentList)"
                            :loading="studyStore.loading.environmentList"
                            :ellipse-count="50"
                            :error="studyInformationError.environmentId"
                        />
                    </div>
                    <div class="flex flex-col gap-[1rem] mt-[1rem]">
                        <div class="grid grid-cols-2 gap-[1rem] w-[70%] lg:w-1/2">
                            <!-- <edc-dropdown
                                :key="`dataSources-${dataViewDetails.dataSources ? dataViewDetails.dataSources : ''}`"
                                v-model="dataViewDetails.dataSources"
                                container-class="w-[32rem]"
                                default-value="Select Data Sources"
                                label="Data Sources"
                                :options="[]"
                                
                                
                                option-placement="bottom"
                                option-class="w-[32rem]"
                                :enable-clear="true"
                                :disabled="false"
                                :loading="false"
                                :ellipse-count="50"
                            /> -->
                            <edc-dropdown
                                :key="`visitId-${dataViewDetails.visitId ? dataViewDetails.visitId : ''}`"
                                v-model="dataViewDetails.visitId"
                                container-class="w-full"
                                default-value="Select a visit"
                                label="Visits"
                                :options="trialVisitLookups"
                                option-placement="bottom"
                                :enable-clear="true"
                                :disabled="false"
                                :loading="false"
                                :ellipse-count="50"
                                @on-select="
                                    () => {
                                        dataViewDetails.formId = null;
                                        dataViewErrorDetails.formId = '';
                                    }
                                "
                                @on-clear="
                                    () => {
                                        dataViewDetails.formId = null;
                                        dataViewErrorDetails.formId = '';
                                    }
                                "
                            />
                            <edc-dropdown
                                :key="`formId-${dataViewDetails.formId ? dataViewDetails.formId : ''}`"
                                v-model="dataViewDetails.formId"
                                container-class="w-full"
                                default-value="Select Form"
                                label="Forms"
                                :options="formLookups"
                                option-placement="bottom"
                                :enable-clear="true"
                                :disabled="false"
                                :loading="false"
                                :ellipse-count="50"
                                :required="true"
                                :error="dataViewErrorDetails.formId"
                            />
                            <edc-dropdown
                                :key="`siteId-${dataViewDetails.siteId ? dataViewDetails.siteId : ''}`"
                                v-model="dataViewDetails.siteId"
                                container-class="w-full"
                                default-value="Select a site"
                                label="Sites"
                                :options="studySiteLookups"
                                option-placement="bottom"
                                :enable-clear="true"
                                :disabled="false"
                                :loading="false"
                                :ellipse-count="43"
                            />
                            <edc-multi-select
                                :key="`subjectIds-${getArrayLength(dataViewDetails.subjectIds) > 0 ? dataViewDetails.subjectIds.join(', ') : ''}`"
                                v-model="dataViewDetails.subjectIds"
                                container-class="w-full"
                                default-value="Select subjects"
                                label="Subjects"
                                :options="subjectBySiteIdLookups"
                                option-placement="bottom"
                                :disabled="false"
                                :loading="false"
                                :error="null"
                                :ellipse-count="43"
                                :is-all-options-selected="
                                    getArrayLength(dataViewDetails.subjectIds) !== 0 &&
                                    getArrayLength(dataViewDetails.subjectIds) ===
                                        getArrayLength(subjectBySiteIdLookups)
                                "
                                select-all-label="Select all subjects"
                                @on-blur="
                                    (selectedOptions) => {
                                        dataViewDetails.subjectIds = [
                                            ...(selectedOptions as number[]),
                                        ];
                                    }
                                "
                            />
                            <!-- <edc-radio-group
                                v-model="dataViewDetails.timezone"
                                name="preferredTimezone"
                                :options="[
                                    { label: 'GMT', value: 'GMT', specify: false },
                                    {
                                        label: 'User Timezone',
                                        value: 'User Timezone',
                                        specify: false,
                                    },
                                ]"
                                container-class="mt-[3.3rem]"
                                label-class="Timezone"
                                
                                type="horizontal"
                            /> -->
                        </div>
                        <div class="cols-span-2 flex flex-row items-center gap-[1rem]">
                            <edc-action-button
                                label="View Data"
                                :on-click="
                                    async () => {
                                        await publishedFormFieldsViewData();
                                    }
                                "
                                container-class="rounded-[--border-radius-4] px-[2rem] py-[0.5rem]"
                                label-class="font-12"
                            />
                            <!-- <edc-action-button
                                label="Cancel"
                                type="cancel"
                                :on-click="() => {}"
                                container-class="rounded-[--border-radius-4] px-[2rem] py-[0.5rem]"
                                label-class="font-12"
                            /> -->
                        </div>
                        <div v-if="showViewData">
                            <h3 class="font-semibold md:text-[1.3rem] lg:text-[1.5rem]">
                                Generated Data:
                            </h3>
                            <div v-if="!isLogForm" class="my-[1rem]">
                                <edc-multiple-form-button-carousel
                                    :forms-list="standardFormsDetails"
                                    :form-name="standardFormName"
                                    :disable-scroll-into-view="true"
                                    :loading="loading"
                                    :disable-delete="true"
                                    direction="ltr"
                                    :handle-form-badge-click="
                                        (rowIndex) => {
                                            handleFormBadgeClick(rowIndex);
                                        }
                                    "
                                />
                            </div>
                            <template v-if="getArrayLength(Object.keys(viewDataColumns)) > 0">
                                <!-- <div v-if="isLogForm" class="flex flex-row items-center gap-[1rem]">
                                    <span
                                        class="font-bold md:text-[1.2rem] lg:text-[1.4rem] inline-block text-left my-[1rem]"
                                        >{{ logFormFirstQuestionAndAnswer.question }}:
                                    </span>
                                    <span class="font-normal md:text-[1.2rem] lg:text-[1.4rem]">
                                        {{ logFormFirstQuestionAndAnswer.answer }}</span
                                    >
                                </div> -->
                                <div v-if="isLogForm" class="flex flex-col gap-[1rem]">
                                    <div
                                        v-for="(
                                            questionAndAnswerRow, questionAndAnswerRowIndex
                                        ) of logFormFirstQuestionAndAnswers"
                                        :key="questionAndAnswerRowIndex"
                                        class="flex flex-row items-center gap-[1rem]"
                                    >
                                        <span
                                            class="font-bold md:text-[1.2rem] lg:text-[1.4rem] inline-block text-left my-[1rem]"
                                            >{{ questionAndAnswerRow.question }}:
                                        </span>
                                        <span class="font-normal md:text-[1.2rem] lg:text-[1.4rem]">
                                            {{ questionAndAnswerRow.answer }}</span
                                        >
                                    </div>
                                </div>
                                <!-- {{ viewDataColumns }} -->
                                <!-- (isLogForm &&
                    logFormFirstQuestionAndAnswer.answer === 'Yes') -->
                                <template v-if="getArrayLength(validGroupIds) === 1">
                                    <edc-data-table
                                        v-if="
                                            checkIfKeyExistsInObject(0, viewDataColumns) &&
                                            (!isLogForm ||
                                                (isLogForm &&
                                                    isYesEnteredForNonLogDataEntriesInLogForm))
                                        "
                                        :columns="
                                            checkIfKeyExistsInObject(0, viewDataColumns)
                                                ? viewDataColumns[0]
                                                : []
                                        "
                                        :table-data="
                                            checkIfKeyExistsInObject(0, viewDataDetails) &&
                                            checkIfKeyExistsInObject(
                                                currentIndex,
                                                viewDataDetails[0],
                                            )
                                                ? viewDataDetails[0][currentIndex]
                                                : []
                                        "
                                        :loading="false"
                                        pagination-type="none"
                                        :custom-content="true"
                                        table-style="default"
                                        @on-sort-change="
                                            (columnHeading, newOrderType) => {
                                                handleViewDataTableSort(
                                                    columnHeading,
                                                    newOrderType,
                                                );
                                            }
                                        "
                                    >
                                        <template #custom-content="{ data }">
                                            <td
                                                v-for="(
                                                    enteredData, enteredDataIndex
                                                ) of Object.values(data).entries()"
                                                :key="enteredDataIndex"
                                                class="font-normal text-center font-12 custom-row !break-words !whitespace-normal"
                                                :class="[
                                                    getStringLength(enteredData[1] as string) > 36
                                                        ? '!min-w-[40rem]'
                                                        : '!min-w-[15rem]',
                                                ]"
                                            >
                                                <span class="inline-block min-h-[1rem]">{{
                                                    enteredData[1]
                                                }}</span>
                                            </td>
                                        </template>
                                    </edc-data-table>
                                </template>
                                <template v-if="getArrayLength(validGroupIds) > 1">
                                    <edc-tab-view
                                        v-if="getArrayLength(groupedTabs.tabsList) > 0"
                                        :tabs="groupedTabs.tabsList"
                                        :active-index="activeTabIndex"
                                        :disable-unsaved-check="true"
                                        @on-tab-change="() => {}"
                                    >
                                        <template
                                            v-for="groupedTab of groupedTabs.tabKeys"
                                            :key="groupedTab.slotName"
                                            #[groupedTab.slotName]
                                        >
                                            <edc-data-table
                                                v-if="
                                                    checkIfKeyExistsInObject(
                                                        groupedTab.groupId,
                                                        viewDataColumns,
                                                    ) &&
                                                    (!isLogForm ||
                                                        (isLogForm &&
                                                            isYesEnteredForNonLogDataEntriesInLogForm))
                                                "
                                                :columns="
                                                    checkIfKeyExistsInObject(
                                                        groupedTab.groupId,
                                                        viewDataColumns,
                                                    )
                                                        ? viewDataColumns[groupedTab.groupId]
                                                        : []
                                                "
                                                :table-data="
                                                    checkIfKeyExistsInObject(
                                                        groupedTab.groupId,
                                                        viewDataDetails,
                                                    ) &&
                                                    checkIfKeyExistsInObject(
                                                        currentIndex,
                                                        viewDataDetails[groupedTab.groupId],
                                                    )
                                                        ? viewDataDetails[groupedTab.groupId][
                                                              currentIndex
                                                          ]
                                                        : []
                                                "
                                                :loading="false"
                                                pagination-type="none"
                                                :custom-content="true"
                                                table-style="default"
                                                @on-sort-change="
                                                    (columnHeading, newOrderType) => {
                                                        handleViewDataTableSort(
                                                            columnHeading,
                                                            newOrderType,
                                                        );
                                                    }
                                                "
                                            >
                                                <template #custom-content="{ data }">
                                                    <td
                                                        v-for="(
                                                            enteredData, enteredDataIndex
                                                        ) of Object.values(data).entries()"
                                                        :key="enteredDataIndex"
                                                        class="font-normal text-center font-12 custom-row !break-words !whitespace-normal"
                                                        :class="[
                                                            getStringLength(
                                                                enteredData[1] as string,
                                                            ) > 36
                                                                ? '!min-w-[40rem]'
                                                                : '!min-w-[15rem]',
                                                        ]"
                                                    >
                                                        <span class="inline-block min-h-[1rem]">{{
                                                            enteredData[1]
                                                        }}</span>
                                                    </td>
                                                </template>
                                            </edc-data-table>
                                            <span v-else class="self-start font-semibold font-12"
                                                >No form details to show</span
                                            >
                                        </template>
                                    </edc-tab-view>
                                </template>
                            </template>
                            <span v-else class="self-start font-semibold font-12"
                                >No form details to show</span
                            >
                            <!-- <edc-data-table
                                :columns="viewDataColumns"
                                :table-data="viewDataDetails[0]"
                                :loading="false"
                                :disabled="loading.isDisabled()"
                                pagination-type="none"
                                table-style="default"
                                :enable-row-click="false"
                                :custom-content="true"
                                table-cell-container-class="!py-[1.85rem]"
                            >
                                <template #custom-content="{ data }">
                                    <td
                                        class="font-normal text-left font-12 custom-row !py-[1.85rem]"
                                    >
                                        <span>{{ data.recordId }}</span>
                                    </td>
                                    <td
                                        class="font-normal text-left font-12 custom-row !py-[1.85rem]"
                                    >
                                        <span>{{ data.subjectInitials }}</span>
                                    </td>
                                    <td
                                        class="font-normal text-left font-12 custom-row !py-[1.85rem]"
                                    >
                                        <span>{{ data.age }}</span>
                                    </td>
                                    <td
                                        class="font-normal text-left font-12 custom-row !py-[1.85rem]"
                                    >
                                        <span>{{ data.sex }}</span>
                                    </td>
                                    <td
                                        class="font-normal text-left font-12 custom-row !py-[1.85rem]"
                                    >
                                        <span>{{ data.race }}</span>
                                    </td>
                                    <td
                                        class="font-normal text-left font-12 custom-row !py-[1.85rem]"
                                    >
                                        <span>{{ data.height }}</span>
                                    </td>
                                    <td
                                        class="font-normal text-left font-12 custom-row !py-[1.85rem]"
                                    >
                                        <span>{{ data.weight }}</span>
                                    </td>
                                    <td
                                        class="font-normal text-left font-12 custom-row !py-[1.85rem]"
                                    >
                                        <span>{{ data.bmi }}</span>
                                    </td>
                                    <td
                                        class="font-normal text-left font-12 custom-row !py-[1.85rem]"
                                    >
                                        <span>{{ data.bsa }}</span>
                                    </td>
                                </template>
                            </edc-data-table> -->
                        </div>
                    </div>
                </template>
                <template #crfExport>
                    <div class="flex flex-row items-start gap-[1rem]">
                        <edc-dropdown
                            :key="`trialId-${studyInformation.trialId ? studyInformation.trialId : ''}`"
                            v-model="studyInformation.trialId"
                            container-class="w-[20rem]"
                            default-value="Select Study"
                            label="Study"
                            :options="studyStore.trialLookups"
                            label-class="mt-[0.5rem]"
                            option-placement="bottom"
                            option-class="w-[20rem]"
                            :enable-clear="true"
                            :required="true"
                            :disabled="loading.isDisabled(studyStore.loading.trialList)"
                            :loading="studyStore.loading.trialList"
                            :ellipse-count="50"
                            :error="studyInformationError.trialId"
                            @on-select="
                                () => {
                                    studyStore.processEnvironmentDetails();
                                }
                            "
                        />
                        <edc-dropdown
                            :key="`environmentId-${studyInformation.environmentId ? studyInformation.environmentId : ''}`"
                            v-model="studyInformation.environmentId"
                            container-class="w-[20rem]"
                            default-value="Select Environment"
                            label="Environment"
                            :options="studyStore.environmentLookups"
                            label-class="mt-[0.5rem]"
                            option-placement="bottom"
                            option-class="w-[20rem]"
                            :enable-clear="true"
                            :required="true"
                            :disabled="loading.isDisabled(studyStore.loading.environmentList)"
                            :loading="studyStore.loading.environmentList"
                            :ellipse-count="50"
                            :error="studyInformationError.environmentId"
                        />
                    </div>
                    <div class="flex flex-col gap-[1rem] mt-[1rem]">
                        <div class="grid grid-cols-2 gap-[1rem] w-[70%] lg:w-1/2">
                            <edc-dropdown
                                :key="`type-${crfDataDetails.type ? crfDataDetails.type : ''}`"
                                v-model="crfDataDetails.type"
                                container-class="w-full"
                                default-value="Select an option"
                                label="Type"
                                :options="crfTypeLookups"
                                option-placement="bottom"
                                :enable-clear="true"
                                :disabled="false"
                                :loading="false"
                                :ellipse-count="50"
                                :error="crfDataErrorDetails.type"
                            />
                            <edc-dropdown
                                :key="`exportDataTo-${crfDataDetails.exportDataTo ? crfDataDetails.exportDataTo : ''}`"
                                v-model="crfDataDetails.exportDataTo"
                                container-class="w-full"
                                default-value="Select an option"
                                label="Export Data To"
                                :options="EXPORT_DATA_TO_OPTIONS"
                                option-placement="bottom"
                                :disabled="false"
                                :loading="false"
                                :ellipse-count="50"
                                :error="crfDataErrorDetails.exportDataTo"
                            />
                        </div>
                        <div class="cols-span-2 flex flex-row items-center gap-[1rem]">
                            <edc-action-button
                                label="Submit"
                                :on-click="
                                    async () => {
                                        await publishedFormFieldsCRFData();
                                    }
                                "
                                container-class="rounded-[--border-radius-4] px-[2rem] py-[0.5rem]"
                                label-class="font-12"
                            />
                            <!-- <edc-action-button
                                label="Cancel"
                                type="cancel"
                                :on-click="() => {}"
                                container-class="rounded-[--border-radius-4] px-[2rem] py-[0.5rem]"
                                label-class="font-12"
                            /> -->
                        </div>
                    </div>
                </template>
            </edc-tab-view>
        </div>
    </div>
</template>

<style scoped></style>
