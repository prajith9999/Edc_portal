<script setup lang="ts">
    import { PAGE_LIMIT_OPTIONS } from "~/constants/options";
    import DropdownOption from "~/services/apis/data/dropdown-option";
    import Loading from "~/services/apis/data/loading";
    import {
        sitesByTrialAndEnvironmentAPI,
        subjectByTrialAndEnvironmentAPI,
    } from "~/services/apis/handlers/portal/dashboard";
    import {
        formFieldDetailsByIdsAPI,
        nestedSubjectsListAPI,
    } from "~/services/apis/handlers/portal/data-collection";
    import {
        discrepancyManagementDetailsByIdAPI,
        discrepancyManagementExportDataAPI,
        discrepancyManagementPaginationListAPI,
    } from "~/services/apis/handlers/portal/discrepancy";
    import type { IFormFieldDetailsData } from "~/services/apis/handlers/types/data-collection-types";
    import type { IDiscrepancyManagementData } from "~/services/apis/handlers/types/discrepancy-types";
    import useDataCollectionStore from "~/stores/data-collection";
    import useGlobalStore from "~/stores/global";
    import usePopupModalStore from "~/stores/popup-modal";
    import useQuickLinkStore from "~/stores/quick-link";
    import useSideBarStore from "~/stores/side-bar";
    import useStudyStore from "~/stores/study";
    import useToastStore from "~/stores/toast";
    import type {
        IOptions,
        ITrialVisitFormDetail,
        TNullableNumber,
        TNullableString,
        TOptionValue,
        TPageFilterAction,
        TVoidAction,
    } from "~/types/common";
    import type { IColumn, TSortType } from "~/types/datatable";
    import PaginationModel from "~/utils/pagination";

    definePageMeta({
        layout: "portal-layout",
    });

    useHead({
        title: seoPageTitle("Discrepancy Management"),
    });

    interface IFilterModel {
        search: TNullableString;
        siteIds: number[];
        subjectIds: number[];
        visitIds: number[];
        formIds: number[];
        typeId: TNullableNumber;
        statusId: TNullableNumber;
        fromDate: TNullableString;
        toDate: TNullableString;
    }

    const defaultFilterModel = (): IFilterModel => ({
        search: null,
        siteIds: [],
        subjectIds: [],
        visitIds: [],
        formIds: [],
        typeId: null,
        statusId: null,
        fromDate: null,
        toDate: null,
    });

    const toastStore = useToastStore();
    const studyStore = useStudyStore();
    const globalStore = useGlobalStore();
    const sideBarStore = useSideBarStore();
    const popupModalStore = usePopupModalStore();
    const dataCollectionStore = useDataCollectionStore();
    const quickLinkStore = useQuickLinkStore();
    const route = useRoute();

    const loading = ref<Loading>(new Loading());
    const filterModel = ref<IFilterModel>({ ...defaultFilterModel() });
    const filterModelRef = ref<IFilterModel>({ ...defaultFilterModel() });
    const columns = ref<IColumn[]>([
        {
            header: "Id",
            field: "id",
            show: true,
            icon: false,
            sort: true,
            sortOrder: "initial",
        },
        {
            header: "Subject",
            field: "subjectName",
            show: true,
            icon: false,
            sort: true,
            sortOrder: "descending",
        },
        {
            header: "Type",
            field: "type",
            show: true,
            icon: false,
            sort: true,
            sortOrder: "descending",
        },
        {
            header: "Status",
            field: "statusName",
            show: true,
            icon: false,
            sort: true,
            sortOrder: "descending",
        },
        {
            header: "Created by",
            field: "createdBy",
            show: true,
            icon: false,
            sort: true,
            sortOrder: "descending",
        },
        {
            header: "Assigned To",
            field: "assignedToRoles",
            show: true,
            icon: false,
            sort: true,
            sortOrder: "descending",
        },
        {
            header: "Date Updated",
            field: "dateUpdated",
            show: true,
            icon: false,
            sort: true,
            sortOrder: "descending",
        },
    ]);
    const tableData = ref<IDiscrepancyManagementData[]>([]);
    const paginationModel = ref<PaginationModel>(new PaginationModel());
    const discrepancyDetails = ref<IDiscrepancyManagementData[]>([]);
    const formFieldDetails = ref<IFormFieldDetailsData | null>(null);
    const formDetails = ref<ITrialVisitFormDetail>({
        trialVisits: [],
        forms: [],
    });
    const siteOptions = ref<DropdownOption>(new DropdownOption());
    const subjectOptions = ref<DropdownOption>(new DropdownOption());
    const orderByDetails = ref<Record<string, "asc" | "desc"> | undefined>(undefined);

    const siteLookups = computed(() => getOptionsList(siteOptions.value.options, "siteName", "id"));
    const subjectLookups = computed(() =>
        getOptionsList(subjectOptions.value.options, "fieldValue", "id"),
    );
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

    const formLookups = computed(() => {
        const result: IOptions[] = [];
        const uniqueForms: number[] = [];
        if (getArrayLength(filterModel.value.visitIds) > 0) {
            for (const row of formDetails.value.trialVisits) {
                if (
                    getArrayLength(filterModel.value.visitIds) > 0 &&
                    !filterModel.value.visitIds.includes(row.id)
                )
                    continue;
                for (const subRow of row.forms) {
                    if (!uniqueForms.includes(subRow.id)) {
                        result.push({
                            label: subRow.formName,
                            value: subRow.id,
                        });
                        uniqueForms.push(subRow.id);
                    }
                }
            }
        } else {
            for (const row of formDetails.value.forms) {
                if (!uniqueForms.includes(row.id)) {
                    result.push({
                        label: row.formName,
                        value: row.id,
                    });
                    uniqueForms.push(row.id);
                }
            }
        }

        return result;
    });
    const discrepancyTypeLookups = computed(() => {
        return [
            {
                label: "System",
                value: 1,
            },
            {
                label: "Manual",
                value: 2,
            },
        ] as IOptions[];
    });
    const discrepancyStatusLookups = computed(() => {
        return [
            {
                label: "Raised",
                value: 1,
            },
            {
                label: "Resolved",
                value: 2,
            },
            {
                label: "Cancelled",
                value: 3,
            },
            {
                label: "Answered",
                value: 4,
            },
        ] as IOptions[];
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
            else result.push(`${formFieldDetails.value.formName} (1)`);
            result.push(formFieldDetails.value.fieldLabel);
        }
        return result;
    });

    const isQueryActionAllowed = computed(() =>
        checkIfActionIsAllowed(studyStore.getRoleIdBySiteId(), [RolePermissionType.Query]),
    );

    async function sitesByTrialAndEnvironment() {
        siteOptions.value.loading = true;
        const { status, data } = await sitesByTrialAndEnvironmentAPI({
            trialId: studyStore.studyInformation.trialId as number,
            environmentId: studyStore.studyInformation.environmentId as number,
        });
        if (status === 200) {
            siteOptions.value.options = deepClone(data);
        } else {
            siteOptions.value.options = [];
        }
        siteOptions.value.loading = false;
    }

    async function subjectByTrialAndEnvironment() {
        subjectOptions.value.loading = true;
        const { status, data } = await subjectByTrialAndEnvironmentAPI({
            trialId: studyStore.studyInformation.trialId as number,
            environmentId: studyStore.studyInformation.environmentId as number,
            siteIds: [],
        });
        if (status === 200) {
            subjectOptions.value.options = deepClone(data);
        } else {
            subjectOptions.value.options = [];
        }
        subjectOptions.value.loading = false;
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
                formDetails.value.trialVisits = deepClone(data.formDetails.trialVisits);
                formDetails.value.forms = deepClone(data.formDetails.forms);
            }
            loading.value.dynamicLoading["nestedSubjectList"] = false;
        }
    }

    function processAssignedRoles(roles: string) {
        const splittedRoles = roles.split(",");
        const filteredItem = getFilteredItems({
            data: studyStore.environmentLookups,
            type: "object",
            value: studyStore.studyInformation.environmentId as number,
            key: "value",
        });
        const selectedEnvironmentName =
            getArrayLength(filteredItem) > 0 ? filteredItem[0].label : "";
        const result: string[] = [];
        for (const role of splittedRoles) {
            if (isRoleAllowedForTheSelectedEnvironment(selectedEnvironmentName, role))
                result.push(role);
        }
        return result.join(", ");
    }

    function createdByDetails(row: IDiscrepancyManagementData) {
        if (row.user && row.createdByRole) return `${row.user} (${row.createdByRole})`;
        if (row.user) return row.user;
        if (row.createdByRole) return row.createdByRole;
        return "";
    }

    function setTableData(apiData: IDiscrepancyManagementData[]) {
        return apiData.map((row) => ({
            ...row,
            type: row.type === 1 ? "System" : "Manual",
            // createdByRole: row.createdByRole ? row.createdByRole : "",
            createdBy: createdByDetails(row),
            assignedToRoles: row.assignedToRoles ? processAssignedRoles(row.assignedToRoles) : "",
            dateUpdated: row.dateUpdated ? formatDate(row.dateUpdated, "DD MMM YYYY HH:mm:ss") : "",
        }));
    }

    function resetTableData() {
        tableData.value = [];
        paginationModel.value.clearPageDetails();
        paginationModel.value.clearCountDetails();
    }

    async function discrepancyManagementPaginationList() {
        loading.value.table = true;
        const { status, data, message } = await discrepancyManagementPaginationListAPI(
            getAPIFilters({
                search: filterModel.value.search,
                filter: {
                    trialId: studyStore.studyInformation.trialId,
                    environmentId: studyStore.studyInformation.environmentId,
                    siteIds: filterModel.value.siteIds,
                    subjectIds: filterModel.value.subjectIds,
                    formIds: filterModel.value.formIds,
                    folderIds: filterModel.value.visitIds,
                    type: filterModel.value.typeId,
                    status: filterModel.value.statusId,
                    fromDate: filterModel.value.fromDate,
                    toDate: filterModel.value.toDate,
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
            tableData.value = deepClone(setTableData(items));
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

    async function discrepancyManagementExportData(
        dataset: string,
        exportDataTo: string,
        extensionType: string,
    ) {
        loading.value.dynamicLoading["downloadExportedData"] = true;
        // const queryParams: any = {
        //     trialId: studyStore.studyInformation.trialId as number,
        //     environmentId: studyStore.studyInformation.environmentId as number,
        //     dataSet: dataset,
        //     extensionType,
        // };
        // if (dataset === "current") queryParams["top"] = 1;
        const {
            status,
            data,
            message = "Export success",
            headers,
        } = await discrepancyManagementExportDataAPI({
            top: dataset === "current" ? paginationModel.value.pageDetails.pageLimit : null,
            skip: 0,
            trialId: studyStore.studyInformation.trialId as number,
            environmentId: studyStore.studyInformation.environmentId as number,
            search: filterModel.value.search,
            subjectIds: filterModel.value.subjectIds,
            formIds: filterModel.value.formIds,
            folderIds: filterModel.value.visitIds,
            siteIds: filterModel.value.siteIds,
            type: filterModel.value.typeId,
            status: filterModel.value.statusId,
            fromDate: filterModel.value.fromDate,
            toDate: filterModel.value.toDate,
            dataSet: dataset,
            extensionType,
            exportDataTo,
        });
        // await discrepancyManagementExportDataAPI(
        //     getAPIFilters({
        //         search: filterModel.value.search,
        //         filter: {
        //             trialId: studyStore.studyInformation.trialId,
        //             environmentId: studyStore.studyInformation.environmentId,
        //             siteIds: filterModel.value.siteIds,
        //             subjectIds: filterModel.value.subjectIds,
        //             folderIds: filterModel.value.visitIds,
        //             type: filterModel.value.typeId,
        //             status: filterModel.value.statusId,
        //             fromDate: filterModel.value.fromDate,
        //             toDate: filterModel.value.toDate,
        //             dataSet: dataset,
        //             extensionType,
        //             exportDataTo,
        //         },
        //         top:
        //             dataset === "current" ? paginationModel.value.pageDetails.pageLimit : undefined,
        //     }),
        // );
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

    function handleRaiseDiscrepancyClose(closeModal?: TVoidAction) {
        if (closeModal) closeModal();
        discrepancyDetails.value = [];
        formFieldDetails.value = null;
    }

    async function formFieldDetailsByIds(rowData: IDiscrepancyManagementData) {
        const { status, data } = await formFieldDetailsByIdsAPI({
            id: 0,
            subjectId: rowData.subjectId,
            siteId: rowData.siteId,
            formId: rowData.formId,
            folderId: rowData.folderId,
            publishedSubjectFormFieldParentId: rowData.publishedSubjectFormFieldParentId,
            publishedSubjectFormFieldChildDetailId: rowData.publishedSubjectFormFieldChildDetailId,
        });
        if (status === 200) {
            formFieldDetails.value = deepClone(data);
            if (formFieldDetails.value)
                formFieldDetails.value.publishedSubjectFormFieldParentId =
                    rowData.publishedSubjectFormFieldParentId;
        } else if (status !== 401) {
            formFieldDetails.value = null;
        }
    }

    async function discrepancyManagementDetailsById(rowData: IDiscrepancyManagementData) {
        const { status, data, message } = await discrepancyManagementDetailsByIdAPI(rowData.id);
        if (status === 200) {
            discrepancyDetails.value = deepClone(
                data.map((row) => ({
                    ...row,
                    comments: row.comments ? row.comments.split(": ")[1] : "-",
                })),
            );
        } else if (status !== 401) {
            discrepancyDetails.value = [];
            toastStore.error({
                title: "Error",
                message,
            });
        }
    }

    async function viewDiscrepancyDetails(rowData: IDiscrepancyManagementData) {
        popupModalStore.show("dataCollectionDiscrepancyModal");
        loading.value.dynamicLoading["discrepancyList"] = true;
        await Promise.all([
            discrepancyManagementDetailsById(rowData),
            formFieldDetailsByIds(rowData),
        ]);
        loading.value.dynamicLoading["discrepancyList"] = false;
    }

    async function navigateToDataCollectionPage(rowData: IDiscrepancyManagementData) {
        // dataCollectionStore.queryParamDetails.subjectId = rowData.subjectId;
        // dataCollectionStore.queryParamDetails.siteId = rowData.siteId;
        // dataCollectionStore.queryParamDetails.formId = rowData.formId;
        // dataCollectionStore.queryParamDetails.folderId = rowData.folderId;
        dataCollectionStore.formLinkDetails[rowData.subjectId] = {
            formId: rowData.formId,
            folderId: rowData.folderId,
        };
        dataCollectionStore.selectedDiscrepancyDetails.siteId = rowData.siteId;
        dataCollectionStore.selectedDiscrepancyDetails.subjectId = rowData.subjectId;
        dataCollectionStore.selectedDiscrepancyDetails.formId = rowData.formId;
        dataCollectionStore.selectedDiscrepancyDetails.folderId = rowData.folderId;
        dataCollectionStore.selectedDiscrepancyDetails.publishedSubjectFormFieldParentId =
            rowData.publishedSubjectFormFieldParentId;
        dataCollectionStore.selectedDiscrepancyDetails.publishedSubjectFormFieldChildDetailId =
            rowData.publishedSubjectFormFieldChildDetailId;
        dataCollectionStore.clinicalTrialsInitialTabIndex = 1;
        await navigateTo(
            getRouteNavigationData({
                path: PortalPath.ClinicalTrials,
            }),
        );
    }

    function processPagination(initial: boolean = false) {
        handleDefaultPaginationPageCount(paginationModel.value);
        handlePagination("page", initial ? 0 : 1, paginationModel.value, initial);
    }

    function onPageLoad() {
        loading.value.dynamicLoading["tableSkeletonLoader"] = true;
        Promise.all([
            sitesByTrialAndEnvironment(),
            subjectByTrialAndEnvironment(),
            nestedSubjectsList(),
            quickLinkStore.triggerSaveAsQuickLinkAPI({
                id: 0,
                trialId: studyStore.studyInformation.trialId as number,
                environmentId: studyStore.studyInformation.environmentId as number,
                page: "Discrepancy Management",
                pageDetails: JSON.stringify({
                    page: PortalPath.DiscrepancyManagement,
                }),
                studyId: 0,
            }),
        ])
            .then(async () => {
                if (studyStore.loading.processPageQueryOnPageLoad) {
                    processPageQueryOnPageLoad();
                    studyStore.loading.processPageQueryOnPageLoad = false;
                }
                await discrepancyManagementPaginationList();
                processPagination(true);
                loading.value.dynamicLoading["tableSkeletonLoader"] = false;
            })
            .catch(() => {
                resetTableData();
                loading.value.dynamicLoading["tableSkeletonLoader"] = false;
            });
        // studyInformation.value.trialId = studyStore.studyInformation.trialId;
        // studyStore.processEnvironmentDetails();
        // studyInformation.value.environmentId = studyStore.studyInformation.environmentId;
    }

    function processPageQueryOnPageLoad() {
        if (route.query) {
            const {
                search = "",
                sites = "",
                subjects = "",
                visits = "",
                forms = "",
                type = "",
                status = "",
                from = "",
                to = "",
                currentPage = "",
                pageLimit = "",
            } = route.query;
            if (search) filterModel.value.search = (search as string) || null;
            if (sites)
                filterModel.value.siteIds = sites
                    ? (setFilterOptionsIds(
                          String(sites).split(","),
                          siteLookups.value,
                          "value",
                      ) as number[])
                    : [];
            if (subjects)
                filterModel.value.subjectIds = subjects
                    ? (setFilterOptionsIds(
                          String(subjects).split(","),
                          subjectLookups.value,
                          "value",
                      ) as number[])
                    : [];
            if (visits)
                filterModel.value.visitIds = visits
                    ? (setFilterOptionsIds(
                          String(visits).split(","),
                          trialVisitLookups.value,
                          "value",
                      ) as number[])
                    : [];
            if (forms)
                filterModel.value.formIds = forms
                    ? (setFilterOptionsIds(
                          String(forms).split(","),
                          formLookups.value,
                          "value",
                      ) as number[])
                    : [];
            if (type)
                filterModel.value.typeId = type
                    ? Number(getDropdownValueByLabel(discrepancyTypeLookups.value, String(type)))
                    : null;
            if (status)
                filterModel.value.statusId = status
                    ? Number(
                          getDropdownValueByLabel(discrepancyStatusLookups.value, String(status)),
                      )
                    : null;
            if (from)
                // filterModel.value.fromDate = from
                //     ? formatDate(from as string, "YYYY-MM-DD HH:mm:ss.SSS")
                //     : null;
                filterModel.value.fromDate = from ? (from as string) : null;
            if (to)
                // filterModel.value.toDate = to
                //     ? formatDate(to as string, "YYYY-MM-DD HH:mm:ss.SSS")
                //     : null;
                filterModel.value.toDate = to ? (to as string) : null;
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
                    sites: setFilterOptionsIds(
                        filterModel.value.siteIds,
                        siteLookups.value,
                        "label",
                    ),
                    subjects: setFilterOptionsIds(
                        filterModel.value.subjectIds,
                        subjectLookups.value,
                        "label",
                    ),
                    visits: setFilterOptionsIds(
                        filterModel.value.visitIds,
                        trialVisitLookups.value,
                        "label",
                    ),
                    forms: setFilterOptionsIds(
                        filterModel.value.formIds,
                        formLookups.value,
                        "label",
                    ),
                    type: getDropdownLabelByValue(
                        discrepancyTypeLookups.value,
                        filterModel.value.typeId as TOptionValue,
                    ),
                    status: getDropdownLabelByValue(
                        discrepancyStatusLookups.value,
                        filterModel.value.statusId as TOptionValue,
                    ),
                    from: filterModel.value.fromDate
                        ? formatDate(filterModel.value.fromDate, "YYYY-MM-DD")
                        : null,
                    to: filterModel.value.toDate
                        ? formatDate(filterModel.value.toDate, "YYYY-MM-DD")
                        : null,
                    currentPage: paginationModel.value.pageDetails.currentPage,
                    pageLimit: paginationModel.value.pageDetails.pageLimit,
                },
                PortalPath.DiscrepancyManagement,
                removeKeys,
            );
        else removeFiltersFromQuery(removeKeys, PortalPath.DiscrepancyManagement);
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
            orderByDetails.value = {
                Id: "asc",
            };
        }
        paginationModel.value.clearCountDetails();
        paginationModel.value.pageDetails.currentPage = 1;
        paginationModel.value.pageDetails.lastPage = 0;
        await discrepancyManagementPaginationList();
        processPagination();
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

    onMounted(() => {
        loading.value.setDynamicLoading([
            "downloadExportedData",
            "discrepancyList",
            "tableSkeletonLoader",
            "nestedSubjectList",
        ]);
        // if (
        //     checkIfActionIsAllowed(studyStore.getRoleIdBySiteId(), RolePermissionType.Query)
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
            studyStore.loading.processPageQueryOnPageLoad = true;
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
            <div class="flex flex-col gap-[1rem] w-full px-[2rem] py-[1rem]">
                <div class="flex flex-row items-center self-end gap-[1rem]">
                    <edc-export-button
                        :show-loader="loading.dynamicLoading['downloadExportedData']"
                        :handle-submit="
                            async (params) => {
                                await discrepancyManagementExportData(
                                    params.dataset,
                                    params.exportDataTo,
                                    'xlsx',
                                );
                            }
                        "
                    />
                    <edc-search-bar
                        v-model="filterModel.search"
                        element-id="discrepancySearch"
                        @on-search="
                            async () => {
                                paginationModel.clearCountDetails();
                                if (filterModel.search)
                                    processPageFilters('apply', ['currentPage']);
                                else processPageFilters('reset', ['search', 'currentPage']);
                                paginationModel.pageDetails.currentPage = 1;
                                paginationModel.pageDetails.lastPage = 0;
                                await discrepancyManagementPaginationList();
                                processPagination();
                                globalStore.triggerSearchBarRefocus('#discrepancySearch');
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
                    table-id="discrepancyManagementDataTable"
                    :columns="columns"
                    :table-data="tableData"
                    :pagination-model="paginationModel"
                    :loading="
                        loading.table ||
                        studyStore.loading.pageDetails ||
                        loading.dynamicLoading['tableSkeletonLoader']
                    "
                    pagination-type="classic"
                    table-style="default"
                    :enable-row-click="false"
                    table-cell-container-class="!py-[1.85rem]"
                    :custom-content="true"
                    @on-page-limit-changed="
                        async () => {
                            if (paginationModel.pageDetails.pageLimit > 8)
                                processPageFilters('apply', ['currentPage']);
                            else processPageFilters('reset', ['pageLimit']);
                            paginationModel.pageDetails.currentPage = 1;
                            paginationModel.pageDetails.lastPage = 0;
                            paginationModel.clearCountDetails();
                            await discrepancyManagementPaginationList();
                            processPagination();
                        }
                    "
                    @on-page-change="
                        async () => {
                            if (paginationModel.pageDetails.currentPage > 1)
                                processPageFilters('apply');
                            else processPageFilters('reset', ['currentPage']);
                            await discrepancyManagementPaginationList();
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
                            class="font-normal text-center font-12 !whitespace-normal !break-words custom-row !min-w-[8rem] !max-w-[8rem]"
                        >
                            <span>{{ data.id }}</span>
                        </td>
                        <td
                            class="font-normal text-center font-12 !whitespace-normal !break-words custom-row !min-w-[15rem] !max-w-[15rem]"
                        >
                            <span>{{ data.subjectName }}</span>
                        </td>
                        <td
                            class="font-normal text-center font-12 !whitespace-normal !break-words custom-row !min-w-[10rem] !max-w-[10rem]"
                        >
                            <span>{{ data.type }}</span>
                        </td>
                        <td
                            class="font-normal text-center font-12 !whitespace-normal !break-words custom-row min-w-[14rem] max-w-[14rem]"
                        >
                            <span>{{ data.statusName }}</span>
                        </td>
                        <td
                            class="font-normal text-center font-12 !whitespace-normal !break-words custom-row !min-w-[15rem] !max-w-[15rem]"
                        >
                            <span>{{ data.createdBy }}</span>
                        </td>
                        <td
                            class="font-normal text-center font-12 !whitespace-normal !break-words custom-row !min-w-[20rem] !max-w-[20rem]"
                        >
                            <span>{{ data.assignedToRoles }}</span>
                        </td>
                        <td
                            class="font-normal text-center font-12 !whitespace-normal !break-words custom-row !min-w-[20rem] !max-w-[20rem]"
                        >
                            <span>{{ data.dateUpdated }}</span>
                        </td>
                    </template>
                    <template #action="{ data }">
                        <edc-pressable
                            loader-type="table-save"
                            :disabled="loading.isDisabled()"
                            :on-click="
                                async () => {
                                    await viewDiscrepancyDetails(data);
                                }
                            "
                        >
                            <edc-icon
                                v-tooltip.top="'View'"
                                icon="eye"
                                :class="`${commonActionIconClasses('Update')} fill-[var(--color-secondary)]`"
                            />
                        </edc-pressable>
                        <edc-pressable
                            v-if="isQueryActionAllowed"
                            loader-type="table-save"
                            :disabled="loading.isDisabled()"
                            :on-click="
                                async () => {
                                    await navigateToDataCollectionPage(data);
                                }
                            "
                        >
                            <edc-icon
                                v-tooltip.top="'Data Collection'"
                                icon="circle-arrow-right"
                                :class="`${commonActionIconClasses('Entries')} fill-[var(--color-secondary)]`"
                            />
                        </edc-pressable>
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
                await discrepancyManagementPaginationList();
                processPagination();
            }
        "
        @on-reset="
            async () => {
                sideBarStore.hide();
                filterModel = {
                    ...filterModel,
                    siteIds: [],
                    statusId: null,
                    subjectIds: [],
                    typeId: null,
                    visitIds: [],
                    fromDate: null,
                    toDate: null,
                };
                processPageFilters('reset', [
                    'sites',
                    'status',
                    'type',
                    'visits',
                    'subjects',
                    'currentPage',
                ]);
                paginationModel.pageDetails.currentPage = 1;
                paginationModel.pageDetails.lastPage = 0;
                paginationModel.clearCountDetails();
                await discrepancyManagementPaginationList();
                processPagination();
            }
        "
        @on-close="
            () => {
                filterModel = deepClone(filterModelRef);
            }
        "
    >
        <edc-multi-select
            :key="`siteIds-${getArrayLength(filterModel.siteIds) > 0 ? filterModel.siteIds.join(', ') : ''}`"
            v-model="filterModel.siteIds"
            container-class="w-full"
            default-value="Select sites"
            label="Sites"
            :options="siteLookups"
            option-placement="bottom"
            :disabled="loading.isDisabled(siteOptions.loading)"
            :loading="siteOptions.loading"
            :error="null"
            :ellipse-count="43"
            :is-all-options-selected="
                getArrayLength(filterModel.siteIds) !== 0 &&
                getArrayLength(filterModel.siteIds) === getArrayLength([])
            "
            select-all-label="Select all sites"
            @on-blur="
                (selectedOptions) => {
                    filterModel.siteIds = [...(selectedOptions as number[])];
                }
            "
        />
        <edc-multi-select
            :key="`subjectIds-${getArrayLength(filterModel.subjectIds) > 0 ? filterModel.subjectIds.join(', ') : ''}`"
            v-model="filterModel.subjectIds"
            container-class="w-full"
            default-value="Select subjects"
            label="Subjects"
            :options="subjectLookups"
            option-placement="bottom"
            :disabled="loading.isDisabled(subjectOptions.loading)"
            :loading="subjectOptions.loading"
            :error="null"
            :ellipse-count="50"
            :is-all-options-selected="
                getArrayLength(filterModel.subjectIds) !== 0 &&
                getArrayLength(filterModel.subjectIds) === getArrayLength([])
            "
            select-all-label="Select all subjects"
            @on-blur="
                (selectedOptions) => {
                    filterModel.subjectIds = [...(selectedOptions as number[])];
                }
            "
        />
        <edc-multi-select
            :key="`visitIds-${getArrayLength(filterModel.visitIds) > 0 ? filterModel.visitIds.join(', ') : ''}`"
            v-model="filterModel.visitIds"
            container-class="w-full"
            default-value="Select visits"
            label="Visits"
            :options="trialVisitLookups"
            option-placement="bottom"
            :disabled="loading.isDisabled(loading.dynamicLoading['nestedSubjectList'])"
            :loading="loading.dynamicLoading['nestedSubjectList']"
            :error="null"
            :ellipse-count="50"
            :is-all-options-selected="
                getArrayLength(filterModel.visitIds) !== 0 &&
                getArrayLength(filterModel.visitIds) === getArrayLength([])
            "
            select-all-label="Select all visits"
            @on-blur="
                (selectedOptions) => {
                    filterModel.visitIds = [...(selectedOptions as number[])];
                }
            "
        />
        <edc-multi-select
            :key="`formIds-${getArrayLength(filterModel.formIds) > 0 ? filterModel.formIds.join(', ') : ''}`"
            v-model="filterModel.formIds"
            container-class="w-full"
            default-value="Select forms"
            label="Forms"
            :options="formLookups"
            option-placement="bottom"
            :disabled="loading.isDisabled(loading.dynamicLoading['nestedSubjectList'])"
            :loading="loading.dynamicLoading['nestedSubjectList']"
            :error="null"
            :ellipse-count="50"
            :is-all-options-selected="
                getArrayLength(filterModel.formIds) !== 0 &&
                getArrayLength(filterModel.formIds) === getArrayLength([])
            "
            select-all-label="Select all forms"
            @on-blur="
                (selectedOptions) => {
                    filterModel.formIds = [...(selectedOptions as number[])];
                }
            "
        />
        <!-- :key="`fromDate-${filterModel.fromDate ? filterModel.fromDate : ''}`" -->
        <edc-calendar
            key="fromDate"
            v-model="filterModel.fromDate"
            container-class="w-full"
            picker-placement="bottom"
            :picker-offset="0"
            label="From Date"
            placeholder="Select from date"
            :disabled="loading.isDisabled()"
            @on-model-change="
                () => {
                    if (filterModel.toDate) filterModel.toDate = null;
                }
            "
            @on-clear="
                () => {
                    if (filterModel.toDate) filterModel.toDate = null;
                }
            "
        />
        <edc-calendar
            key="toDate"
            v-model="filterModel.toDate"
            container-class="w-full"
            picker-placement="bottom"
            :picker-offset="0"
            label="To Date"
            placeholder="Select to date"
            :disabled="loading.isDisabled()"
            :min-date="filterModel.fromDate || undefined"
        />
        <edc-dropdown
            :key="`typeId-${filterModel.typeId ? filterModel.typeId : ''}`"
            v-model="filterModel.typeId"
            container-class="w-full"
            default-value="Select type"
            label="Type"
            :options="discrepancyTypeLookups"
            option-placement="bottom"
            :enable-clear="true"
            :disabled="loading.isDisabled()"
            :loading="false"
            :ellipse-count="50"
        />
        <edc-dropdown
            :key="`statusId-${filterModel.statusId ? filterModel.statusId : ''}`"
            v-model="filterModel.statusId"
            container-class="w-full"
            default-value="Select status"
            label="Status"
            :options="discrepancyStatusLookups"
            option-placement="bottom"
            :enable-clear="true"
            :disabled="loading.isDisabled()"
            :loading="false"
            :ellipse-count="50"
        />
    </edc-side-bar>
    <edc-popup-modal
        modal-id="dataCollectionDiscrepancyModal"
        container-class="min-w-[82vw] lg:min-w-[82rem]"
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
            <div class="flex flex-col items-center justify-center min-w-[82vw] lg:min-w-[82rem]">
                <h2 class="text-[1.6rem] self-start font-bold mb-[2rem]">Discrepancy History</h2>
                <edc-breadcrumb
                    :bread-crumb-details="breadCrumbDetails.filter((row, index) => index !== 3)"
                    type="discrepancy-modal"
                />
                <!-- <section
                    v-if="getArrayLength(breadCrumbDetails) > 0"
                    class="flex flex-row items-center self-start gap-[1rem] mb-[2rem]"
                > -->
                <!-- <template
                        v-for="(
                            breadCrumbDetailRow, breadCrumbDetailRowIndex
                        ) of breadCrumbDetails.filter((row, index) => index !== 3)"
                        :key="breadCrumbDetailRowIndex"
                    >
                        <span
                            class="font-bold label font-14"
                            :class="[breadCrumbDetailRowIndex <= 1 ? 'opacity-60' : '']"
                            >{{ breadCrumbDetailRow }}</span
                        >
                        <edc-icon
                            v-if="breadCrumbDetailRowIndex <= 1"
                            icon="chevron-right-sharp"
                            class="w-[1.2rem] h-[1.2rem] opacity-60"
                            fill="var(--color-accent)"
                        />
                    </template> -->
                <!-- <span class="font-bold label accent-text">({{ breadCrumbDetails[3] }})</span> -->
                <!-- <span class="font-bold opacity-60 label accent-text">Clinical Trials</span>
                    <edc-icon
                        icon="chevron-right-sharp"
                        class="w-[1.2rem] h-[1.2rem] opacity-60"
                        fill="var(--color-accent)"
                    />
                    <span class="font-bold label accent-text">H5P-LC-BWWL</span> -->
                <!-- </section> -->
                <template v-if="loading.dynamicLoading['discrepancyList']">
                    <!-- <edc-accordion
                        :data-count="4"
                        :loading="loading.dynamicLoading['discrepancyList']"
                        :is-active="false"
                        @on-heading-click="() => {}"
                    /> -->
                    <edc-discrepancy-timeline
                        v-for="(numberCount, index) of [1, 2, 1, 2]"
                        :key="`${numberCount}-${index}`"
                        text="Loading"
                        raised-on="Loading"
                        :status="numberCount"
                        role="Loading"
                        user="Loading"
                        :loading="loading.dynamicLoading['discrepancyList']"
                        :is-indent="false"
                        :is-end="false"
                    />
                </template>
                <template v-else-if="getArrayLength(discrepancyDetails) > 0">
                    <div class="flex flex-col items-center gap-[0rem] w-full relative">
                        <edc-discrepancy-timeline
                            v-for="(discrepancyRow, discrepancyRowIndex) of discrepancyDetails"
                            :key="discrepancyRow.id"
                            :text="discrepancyRow.comments || '-'"
                            :raised-on="discrepancyRow.modifiedDate"
                            :status="discrepancyRow.status"
                            :role="discrepancyRow.modifiedBy"
                            :user="discrepancyRow.user"
                            :loading="false"
                            :is-indent="discrepancyRow.status !== 1"
                            :is-end="discrepancyRowIndex === getArrayLength(discrepancyDetails) - 1"
                        />
                    </div>
                </template>
                <template v-else><span class="self-start font-14">No records</span></template>
                <!-- <div ref="lastRow" class="flex flex-row items-center justify-center mt-[1rem]">
                    <edc-spinner
                        v-if="loading.dynamicLoading['discrepancyLazyLoad']"
                        loader-class="w-[1rem] h-[1rem] p-[0.1rem]"
                    />
                </div> -->
            </div>
        </div>
    </edc-popup-modal>
</template>

<style>
    div.table-wrapper[skeleton] table#discrepancyManagementDataTable thead tr th:nth-child(1) {
        min-width: 8rem;
        max-width: 8rem;
    }
    div.table-wrapper[skeleton] table#discrepancyManagementDataTable thead tr th:nth-child(2) {
        min-width: 15rem;
        max-width: 15rem;
    }
    div.table-wrapper[skeleton] table#discrepancyManagementDataTable thead tr th:nth-child(3) {
        min-width: 10rem;
        max-width: 10rem;
    }
    div.table-wrapper[skeleton] table#discrepancyManagementDataTable thead tr th:nth-child(4) {
        min-width: 14rem;
        max-width: 14rem;
    }
    div.table-wrapper[skeleton] table#discrepancyManagementDataTable thead tr th:nth-child(5) {
        min-width: 15rem;
        max-width: 15rem;
    }
    div.table-wrapper[skeleton] table#discrepancyManagementDataTable thead tr th:nth-child(6) {
        min-width: 20rem;
        max-width: 20rem;
    }
    div.table-wrapper[skeleton] table#discrepancyManagementDataTable thead tr th:nth-child(7) {
        min-width: 20rem;
        max-width: 20rem;
    }
    div.table-wrapper[skeleton] table#discrepancyManagementDataTable thead tr th:nth-child(8) {
        min-width: 6.2rem;
        max-width: 6.2rem;
    }
    @media screen and (min-width: 1440px) {
        div.table-wrapper[skeleton] table#discrepancyManagementDataTable thead tr th:nth-child(1) {
            min-width: 9.63rem;
            max-width: 9.63rem;
        }
        div.table-wrapper[skeleton] table#discrepancyManagementDataTable thead tr th:nth-child(2) {
            min-width: 18.056rem;
            max-width: 18.056rem;
        }
        div.table-wrapper[skeleton] table#discrepancyManagementDataTable thead tr th:nth-child(3) {
            min-width: 12.038rem;
            max-width: 12.038rem;
        }
        div.table-wrapper[skeleton] table#discrepancyManagementDataTable thead tr th:nth-child(4) {
            min-width: 16.852rem;
            max-width: 16.852rem;
        }
        div.table-wrapper[skeleton] table#discrepancyManagementDataTable thead tr th:nth-child(5) {
            min-width: 18.056rem;
            max-width: 18.056rem;
        }
        div.table-wrapper[skeleton] table#discrepancyManagementDataTable thead tr th:nth-child(6) {
            min-width: 24.075rem;
            max-width: 24.075rem;
        }
        div.table-wrapper[skeleton] table#discrepancyManagementDataTable thead tr th:nth-child(7) {
            min-width: 24.075rem;
            max-width: 24.075rem;
        }
        div.table-wrapper[skeleton] table#discrepancyManagementDataTable thead tr th:nth-child(8) {
            min-width: 7.465rem;
            max-width: 7.465rem;
        }
    }
</style>
