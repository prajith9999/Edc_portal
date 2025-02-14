<script setup lang="ts">
    import { PAGE_LIMIT_OPTIONS } from "~/constants/options";
    import DropdownOption from "~/services/apis/data/dropdown-option";
    import Loading from "~/services/apis/data/loading";
    import {
        sitesByTrialAndEnvironmentAPI,
        subjectByTrialAndEnvironmentAPI,
    } from "~/services/apis/handlers/portal/dashboard";
    import { nestedSubjectsListAPI } from "~/services/apis/handlers/portal/data-collection";
    import { myTaskPaginationListAPI } from "~/services/apis/handlers/portal/my-task";
    import type { IMyTaskData } from "~/services/apis/handlers/types/my-task-types";
    import useDataCollectionStore from "~/stores/data-collection";
    import useGlobalStore from "~/stores/global";
    import useQuickLinkStore from "~/stores/quick-link";
    import useSideBarStore from "~/stores/side-bar";
    import useStudyStore from "~/stores/study";
    import useToastStore from "~/stores/toast";
    import type {
        IOptions,
        ITrialVisitFormDetail,
        TNullableString,
        TPageFilterAction,
    } from "~/types/common";
    import type { IColumn, TSortType } from "~/types/datatable";
    import { getSortOrderByAction } from "~/utils/components/datatable";
    import PaginationModel from "~/utils/pagination";

    definePageMeta({
        layout: "portal-layout",
    });

    useHead({
        title: seoPageTitle("My Tasks"),
    });

    interface IFilterModel {
        search: TNullableString;
        typeIds: number[];
        statusIds: number[];
        subjectIds: number[];
        siteIds: number[];
        visitIds: number[];
        formIds: number[];
    }

    const defaultFilterModel = (): IFilterModel => ({
        search: null,
        siteIds: [],
        subjectIds: [],
        formIds: [],
        visitIds: [],
        statusIds: [],
        typeIds: [],
    });

    const toastStore = useToastStore();
    const studyStore = useStudyStore();
    const globalStore = useGlobalStore();
    const sideBarStore = useSideBarStore();
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
            // style: {
            //     minWidth:
            //         loading.value.table ||
            //         studyStore.loading.pageDetails ||
            //         (checkIfKeyExistsInObject(
            //             "tableSkeletonLoader",
            //             loading.value.dynamicLoading,
            //         ) &&
            //             loading.value.dynamicLoading["tableSkeletonLoader"])
            //             ? "5rem"
            //             : "auto",
            //     maxWidth:
            //         loading.value.table ||
            //         studyStore.loading.pageDetails ||
            //         (checkIfKeyExistsInObject(
            //             "tableSkeletonLoader",
            //             loading.value.dynamicLoading,
            //         ) &&
            //             loading.value.dynamicLoading["tableSkeletonLoader"])
            //             ? "5.2rem"
            //             : "auto",
            // },
        },
        {
            header: "Subject",
            field: "subjectName",
            show: true,
            icon: false,
            sort: true,
            sortOrder: "descending",
            // style: {
            //     minWidth:
            //         loading.value.table ||
            //         studyStore.loading.pageDetails ||
            //         (checkIfKeyExistsInObject(
            //             "tableSkeletonLoader",
            //             loading.value.dynamicLoading,
            //         ) &&
            //             loading.value.dynamicLoading["tableSkeletonLoader"])
            //             ? "8.8rem"
            //             : "auto",
            //     maxWidth:
            //         loading.value.table ||
            //         studyStore.loading.pageDetails ||
            //         (checkIfKeyExistsInObject(
            //             "tableSkeletonLoader",
            //             loading.value.dynamicLoading,
            //         ) &&
            //             loading.value.dynamicLoading["tableSkeletonLoader"])
            //             ? "9.2rem"
            //             : "auto",
            // },
        },
        {
            header: "Site",
            field: "siteName",
            show: true,
            icon: false,
            sort: true,
            sortOrder: "descending",
            // style: {
            //     minWidth:
            //         loading.value.table ||
            //         studyStore.loading.pageDetails ||
            //         (checkIfKeyExistsInObject(
            //             "tableSkeletonLoader",
            //             loading.value.dynamicLoading,
            //         ) &&
            //             loading.value.dynamicLoading["tableSkeletonLoader"])
            //             ? "20rem"
            //             : "auto",
            //     maxWidth:
            //         loading.value.table ||
            //         studyStore.loading.pageDetails ||
            //         (checkIfKeyExistsInObject(
            //             "tableSkeletonLoader",
            //             loading.value.dynamicLoading,
            //         ) &&
            //             loading.value.dynamicLoading["tableSkeletonLoader"])
            //             ? "21rem"
            //             : "auto",
            // },
        },
        {
            header: "Type",
            field: "typeName",
            show: true,
            icon: false,
            sort: true,
            sortOrder: "descending",
            // style: {
            //     minWidth:
            //         loading.value.table ||
            //         studyStore.loading.pageDetails ||
            //         (checkIfKeyExistsInObject(
            //             "tableSkeletonLoader",
            //             loading.value.dynamicLoading,
            //         ) &&
            //             loading.value.dynamicLoading["tableSkeletonLoader"])
            //             ? "13.3rem"
            //             : "auto",
            //     maxWidth:
            //         loading.value.table ||
            //         studyStore.loading.pageDetails ||
            //         (checkIfKeyExistsInObject(
            //             "tableSkeletonLoader",
            //             loading.value.dynamicLoading,
            //         ) &&
            //             loading.value.dynamicLoading["tableSkeletonLoader"])
            //             ? "13.9rem"
            //             : "auto",
            // },
        },
        {
            header: "Status",
            field: "statusName",
            show: true,
            icon: false,
            sort: true,
            sortOrder: "descending",
            // style: {
            //     minWidth:
            //         loading.value.table ||
            //         studyStore.loading.pageDetails ||
            //         (checkIfKeyExistsInObject(
            //             "tableSkeletonLoader",
            //             loading.value.dynamicLoading,
            //         ) &&
            //             loading.value.dynamicLoading["tableSkeletonLoader"])
            //             ? "7.9rem"
            //             : "auto",
            //     maxWidth:
            //         loading.value.table ||
            //         studyStore.loading.pageDetails ||
            //         (checkIfKeyExistsInObject(
            //             "tableSkeletonLoader",
            //             loading.value.dynamicLoading,
            //         ) &&
            //             loading.value.dynamicLoading["tableSkeletonLoader"])
            //             ? "8.3rem"
            //             : "auto",
            // },
        },
        {
            header: "Description",
            field: "description",
            show: true,
            icon: false,
            sortOrder: "descending",
            // style: {
            //     minWidth:
            //         loading.value.table ||
            //         studyStore.loading.pageDetails ||
            //         (checkIfKeyExistsInObject(
            //             "tableSkeletonLoader",
            //             loading.value.dynamicLoading,
            //         ) &&
            //             loading.value.dynamicLoading["tableSkeletonLoader"])
            //             ? "62.8rem"
            //             : "auto",
            //     maxWidth:
            //         loading.value.table ||
            //         studyStore.loading.pageDetails ||
            //         (checkIfKeyExistsInObject(
            //             "tableSkeletonLoader",
            //             loading.value.dynamicLoading,
            //         ) &&
            //             loading.value.dynamicLoading["tableSkeletonLoader"])
            //             ? "66rem"
            //             : "auto",
            // },
        },
    ]);
    const tableData = ref<IMyTaskData[]>([]);
    const paginationModel = ref<PaginationModel>(new PaginationModel());
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
    const taskTypeLookups = computed(() => {
        return [
            {
                label: "Discrepancy",
                value: 1,
            },
            {
                label: "Data Entry",
                value: 2,
            },
            {
                label: "Data Verification",
                value: 3,
            },
            {
                label: "Data Review",
                value: 4,
            },
            {
                label: "Data Locking",
                value: 5,
            },
        ] as IOptions[];
    });
    const taskStatusLookups = computed(() => {
        return [
            {
                label: "Pending",
                value: 1,
            },
            {
                label: "Completed",
                value: 2,
            },
        ] as IOptions[];
    });

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

    function setTableData(apiData: IMyTaskData[]) {
        return apiData.map((row) => ({
            ...row,
            description: row.description ? row.description : "",
        }));
    }

    function resetTableData() {
        tableData.value = [];
        paginationModel.value.clearPageDetails();
        paginationModel.value.clearCountDetails();
    }

    async function myTaskPaginationList() {
        loading.value.table = true;
        const { status, data, message } = await myTaskPaginationListAPI(
            getAPIFilters({
                search: filterModel.value.search,
                filter: {
                    trialId: studyStore.studyInformation.trialId,
                    environmentId: studyStore.studyInformation.environmentId,
                    siteIds: filterModel.value.siteIds,
                    subjectIds: filterModel.value.subjectIds,
                    formIds: filterModel.value.formIds,
                    folderIds: filterModel.value.visitIds,
                    typeIds: filterModel.value.typeIds,
                    statusIds: filterModel.value.statusIds,
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

    async function handleNavigation(rowData: IMyTaskData) {
        // Type:
        // 1 = Discrepancy
        // 2 = Data Entry
        // 3 = Data Verification
        // 4 = Data Review
        // 5 = Data Locking
        let result: IRouteObject | null = null;
        if (rowData.typeId === 1) {
            result = getRouteNavigationData({
                path: PortalPath.DiscrepancyManagement,
                query: {
                    sites: rowData.siteName,
                    subjects: rowData.subjectName,
                    visits: rowData.folderId ? rowData.folderName : "",
                    forms: rowData.formId ? rowData.formName : "",
                    status: "Raised",
                    // type, status,
                },
            });
        } else {
            dataCollectionStore.formLinkDetails[rowData.subjectId] = {
                formId: rowData.formId,
                folderId: rowData.folderId,
            };
            dataCollectionStore.selectedMyTaskDetails.siteId = rowData.siteId;
            dataCollectionStore.selectedMyTaskDetails.subjectId = rowData.subjectId;
            dataCollectionStore.selectedMyTaskDetails.formId = rowData.formId;
            dataCollectionStore.selectedMyTaskDetails.folderId = rowData.folderId;
            dataCollectionStore.selectedMyTaskDetails.publishedSubjectFormFieldParentId =
                rowData.publishedSubjectFormFieldParentId;
            dataCollectionStore.selectedMyTaskDetails.recordPosition = 0; // rowData.recordPosition;
            dataCollectionStore.clinicalTrialsInitialTabIndex = 1;
            result = getRouteNavigationData({
                path: PortalPath.ClinicalTrials,
            });
        }
        if (result) await navigateTo(result);
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
                await myTaskPaginationList();
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
                statuses = "",
                types = "",
                forms = "",
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
            if (statuses)
                filterModel.value.statusIds = statuses
                    ? (setFilterOptionsIds(
                          String(statuses).split(","),
                          taskStatusLookups.value,
                          "value",
                      ) as number[])
                    : [];
            if (types)
                filterModel.value.typeIds = types
                    ? (setFilterOptionsIds(
                          String(types).split(","),
                          taskTypeLookups.value,
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
                    types: setFilterOptionsIds(
                        filterModel.value.typeIds,
                        taskTypeLookups.value,
                        "label",
                    ),
                    statuses: setFilterOptionsIds(
                        filterModel.value.statusIds,
                        taskStatusLookups.value,
                        "label",
                    ),
                    currentPage: paginationModel.value.pageDetails.currentPage,
                    pageLimit: paginationModel.value.pageDetails.pageLimit,
                },
                PortalPath.MyTasks,
                removeKeys,
            );
        else removeFiltersFromQuery(removeKeys, PortalPath.MyTasks);
    }

    async function handleTableSort(columnHeading: string, newOrderType: TSortType) {
        // let orderBy: Record<string, string> | undefined;
        // if (columnHeading === "Type") {
        //     let orderDirection = "";
        //     if (newOrderType === "ascending") orderDirection = "ASC";
        //     else if (newOrderType === "descending") orderDirection = "DESC";
        //     if (orderDirection)
        //         orderBy = {
        //             [columnHeading]: orderDirection,
        //             // type: orderDirection,
        //         };
        // }
        // orderByDetails.value = orderBy ? { ...orderBy } : orderBy;
        // paginationModel.value.clearCountDetails();
        // // if (filterModel.value.search) processPageFilters('apply');
        // // else processPageFilters('reset', ['search']);
        // paginationModel.value.pageDetails.currentPage = 1;
        // paginationModel.value.pageDetails.lastPage = 0;
        // await myTaskPaginationList();
        // processPagination();
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
        await myTaskPaginationList();
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
            "tableSkeletonLoader",
            "downloadExportedData",
            "discrepancyList",
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
                    <edc-search-bar
                        v-model="filterModel.search"
                        element-id="myTaskSearch"
                        @on-search="
                            async () => {
                                paginationModel.clearCountDetails();
                                if (filterModel.search)
                                    processPageFilters('apply', ['currentPage']);
                                else processPageFilters('reset', ['search', 'currentPage']);
                                paginationModel.pageDetails.currentPage = 1;
                                paginationModel.pageDetails.lastPage = 0;
                                await myTaskPaginationList();
                                processPagination();
                                globalStore.triggerSearchBarRefocus('#myTaskSearch');
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
                    table-id="myTasksDataTable"
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
                            await myTaskPaginationList();
                            processPagination();
                        }
                    "
                    @on-page-change="
                        async () => {
                            if (paginationModel.pageDetails.currentPage > 1)
                                processPageFilters('apply');
                            else processPageFilters('reset', ['currentPage']);
                            await myTaskPaginationList();
                        }
                    "
                    @on-sort-change="
                        async (columnHeading, newOrderType) => {
                            await handleTableSort(columnHeading, newOrderType);
                        }
                    "
                >
                    <template #custom-content="{ data }">
                        <td class="font-normal text-center font-12 custom-row min-w-[5rem]">
                            <span>{{ data.id }}</span>
                        </td>
                        <td class="font-normal text-center font-12 custom-row min-w-[8.8rem]">
                            <span>{{ data.subjectName }}</span>
                        </td>
                        <td
                            class="font-normal text-center font-12 custom-row !min-w-[20rem] !max-w-[20rem]"
                        >
                            <span
                                v-if="ellipsedText(data.siteName).includes('...')"
                                v-tooltip.top="data.siteName"
                                >{{ ellipsedText(data.siteName) }}</span
                            >
                            <span v-else>{{ data.siteName }}</span>
                        </td>
                        <td class="font-normal text-center font-12 custom-row min-w-[13.3rem]">
                            <span>{{ data.typeName }}</span>
                        </td>
                        <td class="font-normal text-center font-12 custom-row min-w-[7.9rem]">
                            <span>{{ data.statusName }}</span>
                        </td>
                        <td class="font-normal text-center font-12 custom-row min-w-[62.8rem]">
                            <span>{{ data.description }}</span>
                        </td>
                    </template>
                    <template #action="{ data }">
                        <edc-pressable
                            loader-type="table-save"
                            :disabled="loading.isDisabled()"
                            :on-click="
                                async () => {
                                    await handleNavigation(data);
                                }
                            "
                        >
                            <!-- <edc-icon
                                v-tooltip.top="'Update'"
                                icon="edit"
                                fill="var(--color-secondary)"
                                :class="`${commonActionIconClasses('Update')}`"
                            /> -->
                            <edc-icon
                                v-tooltip.top="
                                    data.typeId === 1 ? 'Discrepancy Management' : 'Data Collection'
                                "
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
                await myTaskPaginationList();
                processPagination();
            }
        "
        @on-reset="
            async () => {
                sideBarStore.hide();
                filterModel = {
                    ...filterModel,
                    visitIds: [],
                    formIds: [],
                    siteIds: [],
                    statusIds: [],
                    subjectIds: [],
                    typeIds: [],
                };
                processPageFilters('reset', [
                    'sites',
                    'statuses',
                    'types',
                    'visits',
                    'subjects',
                    'forms',
                    'currentPage',
                ]);
                paginationModel.pageDetails.currentPage = 1;
                paginationModel.pageDetails.lastPage = 0;
                paginationModel.clearCountDetails();
                await myTaskPaginationList();
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
                (selectedOptions: number[]) => {
                    filterModel.siteIds = [...selectedOptions];
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
                (selectedOptions: number[]) => {
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
                (selectedOptions: number[]) => {
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
                (selectedOptions: number[]) => {
                    filterModel.formIds = [...(selectedOptions as number[])];
                }
            "
        />
        <edc-multi-select
            :key="`typeIds-${getArrayLength(filterModel.typeIds) > 0 ? filterModel.typeIds.join(', ') : ''}`"
            v-model="filterModel.typeIds"
            container-class="w-full"
            default-value="Select types"
            label="Types"
            :options="taskTypeLookups"
            option-placement="bottom"
            :disabled="loading.isDisabled()"
            :error="null"
            :ellipse-count="50"
            :is-all-options-selected="
                getArrayLength(filterModel.typeIds) !== 0 &&
                getArrayLength(filterModel.typeIds) === getArrayLength([])
            "
            select-all-label="Select all types"
            @on-blur="
                (selectedOptions: number[]) => {
                    filterModel.typeIds = [...(selectedOptions as number[])];
                }
            "
        />
        <edc-multi-select
            :key="`statusIds-${getArrayLength(filterModel.statusIds) > 0 ? filterModel.statusIds.join(', ') : ''}`"
            v-model="filterModel.statusIds"
            container-class="w-full"
            default-value="Select statuses"
            label="Statuses"
            :options="taskStatusLookups"
            option-placement="bottom"
            :disabled="loading.isDisabled()"
            :error="null"
            :ellipse-count="50"
            :is-all-options-selected="
                getArrayLength(filterModel.statusIds) !== 0 &&
                getArrayLength(filterModel.statusIds) === getArrayLength([])
            "
            select-all-label="Select all statuses"
            @on-blur="
                (selectedOptions: number[]) => {
                    filterModel.statusIds = [...(selectedOptions as number[])];
                }
            "
        />
    </edc-side-bar>
</template>

<style>
    /* div.table-wrapper[skeleton] table#myTasksDataTable thead tr th:nth-child(1) {
}
div.table-wrapper[skeleton] table#myTasksDataTable thead tr th:nth-child(2) {
} */
    div.table-wrapper[skeleton] table#myTasksDataTable thead tr th:nth-child(1) {
        min-width: 5rem;
        max-width: 5.2rem;
    }
    div.table-wrapper[skeleton] table#myTasksDataTable thead tr th:nth-child(2) {
        min-width: 8.8rem;
        max-width: 9.2rem;
    }
    div.table-wrapper[skeleton] table#myTasksDataTable thead tr th:nth-child(3) {
        min-width: 20rem;
        max-width: 20rem;
    }
    div.table-wrapper[skeleton] table#myTasksDataTable thead tr th:nth-child(4) {
        min-width: 13.3rem;
        max-width: 13.9rem;
    }
    div.table-wrapper[skeleton] table#myTasksDataTable thead tr th:nth-child(5) {
        min-width: 7.9rem;
        max-width: 8.3rem;
    }
    div.table-wrapper[skeleton] table#myTasksDataTable thead tr th:nth-child(6) {
        min-width: 62.8rem;
        max-width: 66rem;
    }
    div.table-wrapper[skeleton] table#myTasksDataTable thead tr th:nth-child(7) {
        min-width: 6rem;
        max-width: 6rem;
    }
    @media screen and (min-width: 1440px) {
        div.table-wrapper[skeleton] table#myTasksDataTable thead tr th:nth-child(1) {
            min-width: 5.26rem;
            max-width: 5.26rem;
        }
        div.table-wrapper[skeleton] table#myTasksDataTable thead tr th:nth-child(2) {
            min-width: 9.258rem;
            max-width: 9.258rem;
        }
        div.table-wrapper[skeleton] table#myTasksDataTable thead tr th:nth-child(3) {
            min-width: 21.041rem;
            max-width: 21.041rem;
        }
        div.table-wrapper[skeleton] table#myTasksDataTable thead tr th:nth-child(4) {
            min-width: 13.992rem;
            max-width: 13.992rem;
        }
        div.table-wrapper[skeleton] table#myTasksDataTable thead tr th:nth-child(5) {
            min-width: 8.311rem;
            max-width: 8.311rem;
        }
        div.table-wrapper[skeleton] table#myTasksDataTable thead tr th:nth-child(6) {
            min-width: 66.07rem;
            max-width: 66.07rem;
        }
        div.table-wrapper[skeleton] table#myTasksDataTable thead tr th:nth-child(7) {
            min-width: 6.315rem;
            max-width: 6.315rem;
        }
        /* div.table-wrapper[skeleton] table#myTasksDataTable thead tr th:nth-child(1) div {
            min-width: 4.21rem;
            max-width: 4.21rem;
        }
        div.table-wrapper[skeleton] table#myTasksDataTable thead tr th:nth-child(2) div {
            min-width: 8.158rem;
            max-width: 8.158rem;
        }
        div.table-wrapper[skeleton] table#myTasksDataTable thead tr th:nth-child(3) div {
            min-width: 19.941rem;
            max-width: 19.941rem;
        }
        div.table-wrapper[skeleton] table#myTasksDataTable thead tr th:nth-child(4) div {
            min-width: 12.892rem;
            max-width: 12.892rem;
        }
        div.table-wrapper[skeleton] table#myTasksDataTable thead tr th:nth-child(5) div {
            min-width: 7.211rem;
            max-width: 7.211rem;
        }
        div.table-wrapper[skeleton] table#myTasksDataTable thead tr th:nth-child(6) div {
            min-width: 64.97rem;
            max-width: 64.97rem;
        } */
    }
    /* div.table-wrapper[skeleton] table#myTasksDataTable thead tr th:nth-child(4) {
}
div.table-wrapper[skeleton] table#myTasksDataTable thead tr th:nth-child(5) {
}
div.table-wrapper[skeleton] table#myTasksDataTable thead tr th:nth-child(6) {
} */
</style>
