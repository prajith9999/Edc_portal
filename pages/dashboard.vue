<script setup lang="ts">
    import DropdownOption from "~/services/apis/data/dropdown-option";
    import Loading from "~/services/apis/data/loading";
    import {
        adverseOrConcomitantCountAPI,
        formFieldDiscrepanciesProgressStatusCountAPI,
        sitesByTrialAndEnvironmentAPI,
        subjectByTrialAndEnvironmentAPI,
        subjectOverDueVisitCountAPI,
        subjectTrialSitesCountAPI,
    } from "~/services/apis/handlers/portal/dashboard";
    import { nestedSubjectsListAPI } from "~/services/apis/handlers/portal/data-collection";
    import { userDetailsAPI } from "~/services/apis/handlers/portal/user";
    import type {
        ISubjectNestedListData,
        ISubjectTrialVisitData,
    } from "~/services/apis/handlers/types/data-collection-types";
    import useQuickLinkStore from "~/stores/quick-link";
    import useStudyStore from "~/stores/study";
    import useUserStore from "~/stores/user";
    import type { IChartOption, IOptions, TNullableNumber } from "~/types/common";
    import type { IMenu } from "~/utils/route";
    import {
        Chart,
        BarController,
        CategoryScale,
        LinearScale,
        BarElement,
        Title,
        Tooltip,
        Legend,
        DoughnutController,
        ArcElement,
    } from "chart.js";
    import ChartDataLabels from "chartjs-plugin-datalabels";
    import { BarChart, useBarChart, DoughnutChart, useDoughnutChart } from "vue-chart-3";
    import { cssvar } from "~/utils/dom";
    import { BAR_CHART_OPTIONS, DOUGHNUT_CHART_OPTIONS } from "~/constants/chart";
    import { splitLabelForChart } from "~/utils/common";

    // Chart.register(ChartDataLabels, ...registerables);
    Chart.register(
        BarController,
        CategoryScale,
        LinearScale,
        BarElement,
        Title,
        Tooltip,
        Legend,
        DoughnutController,
        ArcElement,
        ChartDataLabels,
    );

    definePageMeta({
        middleware: ["study-modal-auth"],
        layout: "portal-layout",
    });

    useHead({
        title: seoPageTitle("Dashboard"),
    });

    const studyStore = useStudyStore();
    const userStore = useUserStore();
    const quickLinkStore = useQuickLinkStore();
    const menus = ref<IMenu[]>(menusList("dashboard"));

    const loading = ref<Loading>(new Loading());

    async function getUserDetails() {
        const { data, status } = await userDetailsAPI();
        if (status === 200) {
            const userDetails: IUser = {
                ...userStore.getDetails(),
                id: data?.id || 0,
                name: data?.name || "",
                orgType: data?.orgType || "",
                firstName: data?.firstName || "",
                lastName: data?.lastName || "",
                username: data?.username || "",
                orgName: data?.orgName || "",
                lastLoginTime: data?.lastLoginTime || "",
                role: data?.role || "",
                roleId: data?.roleId || 0,
            };
            userStore.setDetails(deepClone(userDetails) as IUser);
            setToLocalStorage(TLocalStorageKeys.userDetails, JSON.stringify(userDetails));
        } else {
            // TODO: Need to clear store if error
            // userStore.clearStore()
        }
    }

    interface ISubjectTrialSitesCountDetail {
        label: string;
        count: number;
    }
    interface ISubjectTrialSitesCountFilter {
        siteIds: number[];
    }
    const subjectTrialSitesCountFilters = ref<ISubjectTrialSitesCountFilter>({ siteIds: [] });
    const subjectTrialSitesCountDetails = ref<ISubjectTrialSitesCountDetail[]>([]);
    interface IAdverseOrConcomitantCountFilter {
        siteIds: number[];
        subjectIds: number[];
        folderIds: number[];
    }
    const adverseOrConcomitantCountFilters = ref<IAdverseOrConcomitantCountFilter>({
        siteIds: [],
        folderIds: [],
        subjectIds: [],
    });
    const adverseOrConcomitantCountDetails = ref<ISubjectTrialSitesCountDetail[]>([]);
    interface IFormFieldDiscrepanciesProgressStatusCountFilter {
        siteIds: number[];
        subjectIds: number[];
        typeId: TNullableNumber;
    }
    const formFieldDiscrepanciesProgressStatusCountFilters =
        ref<IFormFieldDiscrepanciesProgressStatusCountFilter>({
            siteIds: [],
            subjectIds: [],
            typeId: null,
        });
    const formFieldDiscrepanciesProgressStatusCountDetails = ref<ISubjectTrialSitesCountDetail[]>(
        [],
    );
    interface ISubjectOverDueVisitCountFilter {
        siteIds: number[];
        subjectIds: number[];
    }
    const subjectOverDueVisitCountFilters = ref<ISubjectOverDueVisitCountFilter>({
        siteIds: [],
        subjectIds: [],
    });
    const subjectOverDueVisitCountDetails = ref<ISubjectTrialSitesCountDetail[]>([]);

    const subjectTrialSiteChartData = computed(() => ({
        labels: subjectTrialSitesCountDetails.value
            // FIXME: once handled in API remove the below line of code
            .filter((row) => row.label !== "Registered")
            .map((row) => row.label)
            .map((label) => splitLabelForChart(label)),
        datasets: [
            {
                data: subjectTrialSitesCountDetails.value
                    // FIXME: once handled in API remove the below line of code
                    .filter((row) => row.label !== "Registered")
                    .map((row) => row.count),
                backgroundColor: cssvar("--color-secondary"),
            },
        ],
    }));
    const adverseOrConcomitantChartData = computed(() => ({
        // labels: adverseOrConcomitantCountDetails.value.map((row) => row.label),
        labels: adverseOrConcomitantCountDetails.value
            .map((row) => row.label)
            .map((label) => splitLabelForChart(label)),
        datasets: [
            {
                data: adverseOrConcomitantCountDetails.value.map((row) => row.count),
                backgroundColor: cssvar("--color-secondary"),
            },
        ],
    }));
    const formFieldDiscrepancyChartData = computed(() => ({
        labels: formFieldDiscrepanciesProgressStatusCountDetails.value.map((row) => row.label),
        datasets: [
            {
                data: formFieldDiscrepanciesProgressStatusCountDetails.value.map(
                    (row) => row.count,
                ),
                backgroundColor: [
                    cssvar("--color-donut-shade-1"),
                    cssvar("--color-donut-shade-2"),
                    cssvar("--color-donut-shade-3"),
                    cssvar("--color-donut-shade-4"),
                ],
            },
        ],
    }));
    const subjectOverDueVisitChartData = computed(() => ({
        labels: subjectOverDueVisitCountDetails.value
            .map((row) => row.label)
            .map((label) => splitLabelForChart(label)),
        datasets: [
            {
                data: subjectOverDueVisitCountDetails.value.map((row) => row.count),
                backgroundColor: cssvar("--color-secondary"),
            },
        ],
    }));

    const isSubjectTrialSitesEmpty = computed(() => {
        if (
            getArrayLength(subjectTrialSitesCountFilters.value.siteIds) === 0 &&
            getArrayLength(subjectTrialSitesCountDetails.value) === 0
        )
            return "No records";
        if (
            getArrayLength(subjectTrialSitesCountFilters.value.siteIds) > 0 &&
            getArrayLength(subjectTrialSitesCountDetails.value) === 0
        )
            return "No records after filter";
        return "";
    });
    const isAdverseOrConcomitantEmpty = computed(() => {
        if (
            getArrayLength(adverseOrConcomitantCountFilters.value.siteIds) === 0 &&
            getArrayLength(adverseOrConcomitantCountFilters.value.folderIds) === 0 &&
            getArrayLength(adverseOrConcomitantCountFilters.value.subjectIds) === 0 &&
            getArrayLength(adverseOrConcomitantCountDetails.value) === 0
        )
            return "No records";
        if (
            (getArrayLength(adverseOrConcomitantCountFilters.value.siteIds) > 0 ||
                getArrayLength(adverseOrConcomitantCountFilters.value.folderIds) > 0 ||
                getArrayLength(adverseOrConcomitantCountFilters.value.subjectIds) > 0) &&
            getArrayLength(adverseOrConcomitantCountDetails.value) === 0
        )
            return "No records after filter";
        return "";
    });
    const isFormFieldDiscrepanciesProgressStatusEmpty = computed(() => {
        const actualDataLength = getArrayLength(
            formFieldDiscrepanciesProgressStatusCountDetails.value.filter(
                (row) => row.count && row.count > 0,
            ),
        );
        if (
            getArrayLength(formFieldDiscrepanciesProgressStatusCountFilters.value.siteIds) === 0 &&
            getArrayLength(formFieldDiscrepanciesProgressStatusCountFilters.value.subjectIds) ===
                0 &&
            !formFieldDiscrepanciesProgressStatusCountFilters.value.typeId &&
            actualDataLength === 0
        )
            return "No records";
        if (
            (getArrayLength(formFieldDiscrepanciesProgressStatusCountFilters.value.siteIds) > 0 ||
                getArrayLength(formFieldDiscrepanciesProgressStatusCountFilters.value.subjectIds) >
                    0 ||
                formFieldDiscrepanciesProgressStatusCountFilters.value.typeId) &&
            actualDataLength === 0
        )
            return "No records after filter";
        return "";
    });
    const isSubjectOverDueVisitEmpty = computed(() => {
        if (
            getArrayLength(subjectOverDueVisitCountFilters.value.siteIds) === 0 &&
            getArrayLength(formFieldDiscrepanciesProgressStatusCountFilters.value.subjectIds) ===
                0 &&
            getArrayLength(subjectOverDueVisitCountDetails.value) === 0
        )
            return "No records";
        if (
            (getArrayLength(subjectOverDueVisitCountFilters.value.siteIds) > 0 ||
                getArrayLength(subjectOverDueVisitCountFilters.value.subjectIds) > 0) &&
            getArrayLength(subjectOverDueVisitCountDetails.value) === 0
        )
            return "No records after filter";
        return "";
    });

    const { barChartProps: subjectTrialSiteChartProps } = useBarChart({
        chartData: subjectTrialSiteChartData,
        options: {
            // ...commonBarChartOptions.value,
            ...BAR_CHART_OPTIONS(false),
            // onHover: (event, chartElement) => {
            //     // Change the cursor to pointer when hovering over a bar
            //     const chartArea = event.native.target;
            //     chartArea.style.cursor = "pointer";
            //     event.native.target.style.cursor = chartElement[0] ? "pointer" : "default";
            // },
            onClick: async (_event: any, chartElement: any) => {
                if (getArrayLength(chartElement) > 0) {
                    await handleChartClick("subject statuses", chartElement[0]);
                }
            },
        },
    });
    const { barChartProps: adverseOrConcomitantChartProps } = useBarChart({
        chartData: adverseOrConcomitantChartData,
        options: {
            ...BAR_CHART_OPTIONS(false),
            barThickness: 40,
        },
    });
    const { doughnutChartProps: formFieldDiscrepancyChartProps } = useDoughnutChart({
        chartData: formFieldDiscrepancyChartData,
        options: {
            ...DOUGHNUT_CHART_OPTIONS,
            cutout: "60%",
            // maintainAspectRatio: false,
            // aspectRatio: 0.1,
            onClick: async (_event: any, chartElement: any) => {
                if (getArrayLength(chartElement) > 0) {
                    await handleChartClick("discrepancies", chartElement[0]);
                }
            },
        },
    });
    const { barChartProps: subjectOverDueVisitChartProps } = useBarChart({
        chartData: subjectOverDueVisitChartData,
        options: {
            ...BAR_CHART_OPTIONS(false),
            barThickness: 40,
        },
    });

    async function subjectTrialSitesCount() {
        loading.value.dynamicLoading["subjectTrialSitesCount"] = true;
        const { status, data } = await subjectTrialSitesCountAPI({
            trialId: studyStore.studyInformation.trialId as number,
            environmentId: studyStore.studyInformation.environmentId as number,
            siteIds: subjectTrialSitesCountFilters.value.siteIds,
            subjectIds: [],
            folderIds: [],
            type: 0,
            count: 0,
            folderId: 0,
            siteId: 0,
            name: "",
            statusName: "",
            subjectId: 0,
        });
        if (status === 200) {
            subjectTrialSitesCountDetails.value = deepClone(
                data.map((row) => ({
                    label: row.statusName,
                    count: row.count,
                })),
            );
        } else if (status !== 401) {
            subjectTrialSitesCountDetails.value = [];
        }
        loading.value.dynamicLoading["subjectTrialSitesCount"] = false;
    }
    async function adverseOrConcomitantCount() {
        loading.value.dynamicLoading["adverseOrConcomitantCount"] = true;
        const { status, data } = await adverseOrConcomitantCountAPI({
            trialId: studyStore.studyInformation.trialId as number,
            environmentId: studyStore.studyInformation.environmentId as number,
            siteIds: adverseOrConcomitantCountFilters.value.siteIds,
            subjectIds: adverseOrConcomitantCountFilters.value.subjectIds,
            folderIds: adverseOrConcomitantCountFilters.value.folderIds,
            type: 0,
            count: 0,
            folderId: 0,
            siteId: 0,
            name: "",
            statusName: "",
            subjectId: 0,
        });
        if (status === 200) {
            adverseOrConcomitantCountDetails.value = deepClone(
                data.map((row) => ({
                    label: row.name,
                    count: row.count,
                })),
            );
        } else if (status !== 401) {
            adverseOrConcomitantCountDetails.value = [];
        }
        loading.value.dynamicLoading["adverseOrConcomitantCount"] = false;
    }
    async function formFieldDiscrepanciesProgressStatusCount() {
        loading.value.dynamicLoading["formFieldDiscrepanciesProgressStatusCount"] = true;
        const { status, data } = await formFieldDiscrepanciesProgressStatusCountAPI({
            trialId: studyStore.studyInformation.trialId as number,
            environmentId: studyStore.studyInformation.environmentId as number,
            siteIds: formFieldDiscrepanciesProgressStatusCountFilters.value.siteIds,
            subjectIds: formFieldDiscrepanciesProgressStatusCountFilters.value.subjectIds,
            folderIds: [],
            type: formFieldDiscrepanciesProgressStatusCountFilters.value.typeId || 0,
            count: 0,
            folderId: 0,
            siteId: 0,
            name: "",
            statusName: "",
            subjectId: 0,
        });
        if (status === 200) {
            formFieldDiscrepanciesProgressStatusCountDetails.value = deepClone(
                data.map((row) => ({
                    label: row.statusName,
                    count: row.count,
                })),
            );
        } else if (status !== 401) {
            formFieldDiscrepanciesProgressStatusCountDetails.value = [];
        }
        loading.value.dynamicLoading["formFieldDiscrepanciesProgressStatusCount"] = false;
    }
    async function subjectOverDueVisitCount() {
        loading.value.dynamicLoading["subjectOverDueVisitCount"] = true;
        const { status, data } = await subjectOverDueVisitCountAPI({
            trialId: studyStore.studyInformation.trialId as number,
            environmentId: studyStore.studyInformation.environmentId as number,
            siteIds: subjectOverDueVisitCountFilters.value.siteIds,
            subjectIds: subjectOverDueVisitCountFilters.value.subjectIds,
            folderIds: [],
            type: 0,
            count: 0,
            folderId: 0,
            siteId: 0,
            name: "",
            statusName: "",
            subjectId: 0,
        });
        if (status === 200) {
            subjectOverDueVisitCountDetails.value = deepClone(
                data.map((row) => ({
                    label: row.name,
                    count: row.count,
                })),
            );
        } else if (status !== 401) {
            subjectOverDueVisitCountDetails.value = [];
        }
        loading.value.dynamicLoading["subjectOverDueVisitCount"] = false;
    }

    const siteOptions = ref<DropdownOption>(new DropdownOption());
    const subjectOptions = ref<DropdownOption>(new DropdownOption());
    const trialVisitOptions = ref<DropdownOption>(new DropdownOption());

    const siteLookups = computed(() => getOptionsList(siteOptions.value.options, "siteName", "id"));
    const subjectLookups = computed(() =>
        getOptionsList(subjectOptions.value.options, "fieldValue", "id"),
    );
    const trialVisitLookups = computed(() =>
        getOptionsList(trialVisitOptions.value.options, "name", "id"),
    );
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

    function processTrialVisits(data: ISubjectNestedListData) {
        const result: ISubjectTrialVisitData[] = [];
        if (getArrayLength(data.formDetails.trialVisits) > 0) {
            for (const row of data.formDetails.trialVisits) {
                result.push({ ...row });
            }
        }
        return result;
    }
    async function nestedSubjectsList() {
        if (studyStore.studyInformation.trialId && studyStore.studyInformation.environmentId) {
            trialVisitOptions.value.loading = true;
            const { status, data } = await nestedSubjectsListAPI({
                trialId: studyStore.studyInformation.trialId,
                environmentId: studyStore.studyInformation.environmentId,
            });
            if (status === 200) {
                trialVisitOptions.value.options = deepClone(processTrialVisits(data));
            } else if (status !== 401) {
                trialVisitOptions.value.options = [];
            }
            trialVisitOptions.value.loading = false;
        }
    }

    async function handleChartClick(
        module: "subject statuses" | "discrepancies",
        options: IChartOption,
    ) {
        const { index: dataPointIndex } = options;
        let result: IRouteObject | null = null;
        if (module === "subject statuses") {
            const filteredValue = subjectTrialSitesCountDetails.value.filter(
                (_row, index) => index === dataPointIndex,
            );
            if (getArrayLength(filteredValue) > 0)
                result = {
                    path: PortalPath.Subject,
                    query: {
                        status: filteredValue[0].label,
                    },
                };
        } else {
            const filteredValue = formFieldDiscrepanciesProgressStatusCountDetails.value.filter(
                (_row, index) => index === dataPointIndex,
            );
            if (getArrayLength(filteredValue) > 0)
                result = {
                    path: PortalPath.DiscrepancyManagement,
                    query: {
                        status: filteredValue[0].label,
                    },
                };
        }
        if (result) await navigateTo(result);
    }

    function onPageLoad() {
        if (studyStore.isStudySelected()) {
            loading.value.dynamicLoading["reportGraph"] = true;
            Promise.all([
                sitesByTrialAndEnvironment(),
                subjectByTrialAndEnvironment(),
                nestedSubjectsList(),
                subjectTrialSitesCount(),
                adverseOrConcomitantCount(),
                formFieldDiscrepanciesProgressStatusCount(),
                subjectOverDueVisitCount(),
                quickLinkStore.fetchLinksList(
                    studyStore.studyInformation.trialId as number,
                    studyStore.studyInformation.environmentId as number,
                ),
            ]);
            loading.value.dynamicLoading["reportGraph"] = false;
        }
    }

    // TODO: commenting the below due to read access is there for all users. There is a dependency for this in PortalLayout.vue page
    // watch(
    //     () => userStore.triggerDashboardMenuChange,
    //     (newValue) => {
    //         if (newValue) {
    //             menus.value = menusList("dashboard");
    //             userStore.triggerDashboardMenuChange = false;
    //         }
    //     },
    // );

    watch(
        () => studyStore.loading.pageDetails,
        (newValue, oldValue) => {
            if (oldValue && !newValue) {
                onPageLoad();
            }
        },
    );

    onMounted(async () => {
        loading.value.setDynamicLoading([
            "reportGraph",
            "subjectTrialSitesCount",
            "adverseOrConcomitantCount",
            "formFieldDiscrepanciesProgressStatusCount",
            "subjectOverDueVisitCount",
        ]);
        // if (studyStore.isStudySelected()) {
        //     if (studyStore.loading.pageDetails) studyStore.loading.pageDetails = false;
        // } else {
        //     studyStore.triggerModel = true;
        // }
        if (!studyStore.triggerModelInDashboard) {
            if (studyStore.loading.pageDetails) studyStore.loading.pageDetails = false;
            else onPageLoad();
        } else {
            studyStore.triggerModel = true;
        }
        await getUserDetails();
    });
    // old apex chart height = 250 new 260
    // old skeleton loader height = 30.7rem new 31.7rem

    // const fileUpload = ref<any[]>([]);
    // const dataCollectionStore = useDataCollectionStore();
</script>

<template>
    <div class="flex flex-col gap-[2rem]">
        <edc-dashboard-menu-carousel :menus="menus" :loading="loading" />
        <div class="grid grid-cols-1 lg:grid-cols-2 gap-[1rem] pb-[2rem] w-[98%]">
            <template
                v-if="
                    studyStore.loading.pageDetails ||
                    loading.dynamicLoading['subjectTrialSitesCount']
                "
            >
                <edc-skeleton-loader
                    container-class="w-full h-[44.25rem] lg:h-[44.25rem] rounded-[var(--border-radius-10)]"
                    loader-type="rectangle"
                />
            </template>
            <template v-else-if="studyStore.isStudySelected()">
                <edc-dashboard-report-card>
                    <template #filters>
                        <span
                            class="text-[var(--color-report-heading)] text-[1.5rem] font-semibold mx-auto mt-[1rem]"
                            >Subjects Status</span
                        >
                        <div
                            v-if="isSubjectTrialSitesEmpty !== 'No records'"
                            class="self-end gap-[1rem] w-full py-[1rem] pl-[1rem] pr-[3rem] flex flex-row items-center justify-end"
                        >
                            <!-- <span
                                class="text-[var(--color-report-heading)] text-[1.5rem] ml-[43%] font-semibold"
                                >Subjects Status</span
                            > -->
                            <div class="flex flex-row items-center">
                                <span class="mr-[2rem] text-[1.3rem] text-[var(--color-tab-header)]"
                                    >Filter by</span
                                >
                                <edc-multi-select-filter
                                    :key="`siteIds-${getArrayLength(subjectTrialSitesCountFilters.siteIds) > 0 ? subjectTrialSitesCountFilters.siteIds.join(', ') : ''}`"
                                    v-model="subjectTrialSitesCountFilters.siteIds"
                                    label="Sites"
                                    icon="chevron-down-curve"
                                    :options="siteLookups"
                                    option-placement="bottom-end"
                                    option-class="w-[32rem]"
                                    :disabled="loading.isDisabled(siteOptions.loading)"
                                    :loading="siteOptions.loading"
                                    :error="null"
                                    :ellipse-count="50"
                                    :is-all-options-selected="
                                        getArrayLength(subjectTrialSitesCountFilters.siteIds) !==
                                            0 &&
                                        getArrayLength(subjectTrialSitesCountFilters.siteIds) ===
                                            getArrayLength(siteLookups)
                                    "
                                    select-all-label="Select all sites"
                                    :is-filter-active="
                                        getArrayLength(subjectTrialSitesCountFilters.siteIds) > 0
                                    "
                                    @on-clear="
                                        async () => {
                                            subjectTrialSitesCountFilters.siteIds = [];
                                            await subjectTrialSitesCount();
                                        }
                                    "
                                    @on-blur="
                                        async (selectedOptions) => {
                                            const isOptionsChanged = checkIfModelChanged(
                                                selectedOptions,
                                                subjectTrialSitesCountFilters.siteIds,
                                            );
                                            subjectTrialSitesCountFilters.siteIds = [
                                                ...(selectedOptions as number[]),
                                            ];
                                            if (isOptionsChanged) await subjectTrialSitesCount();
                                        }
                                    "
                                />
                            </div>
                        </div>
                    </template>
                    <template #chart>
                        <BarChart
                            v-if="isSubjectTrialSitesEmpty !== 'No records'"
                            v-bind="subjectTrialSiteChartProps"
                            class="w-[90%]"
                        />
                        <div v-else class="flex flex-row items-center justify-center h-[25rem]">
                            <span
                                v-if="isSubjectTrialSitesEmpty === 'No records'"
                                class="inline-block font-13"
                                >No records</span
                            >
                            <span v-else class="inline-block font-13">No subjects status</span>
                        </div>
                    </template>
                </edc-dashboard-report-card>
            </template>
            <template
                v-if="
                    studyStore.loading.pageDetails ||
                    loading.dynamicLoading['adverseOrConcomitantCount']
                "
            >
                <edc-skeleton-loader
                    container-class="w-full h-[21.25rem] lg:h-[44.25rem] rounded-[var(--border-radius-10)]"
                    loader-type="rectangle"
                />
            </template>
            <template v-else-if="studyStore.isStudySelected()">
                <edc-dashboard-report-card>
                    <template #filters>
                        <span
                            class="text-[var(--color-report-heading)] text-[1.5rem] font-semibold mx-auto mt-[1rem]"
                            >Trial Events</span
                        >
                        <div
                            v-if="isAdverseOrConcomitantEmpty !== 'No records'"
                            class="self-end gap-[1rem] w-full py-[1rem] pl-[1rem] pr-[3rem] flex flex-row items-center justify-end"
                        >
                            <div class="flex flex-row items-center gap-[1rem]">
                                <span class="mr-[1rem] text-[1.3rem] text-[var(--color-tab-header)]"
                                    >Filter by</span
                                >
                                <edc-multi-select-filter
                                    :key="`siteIds-${getArrayLength(adverseOrConcomitantCountFilters.siteIds) > 0 ? adverseOrConcomitantCountFilters.siteIds.join(', ') : ''}`"
                                    v-model="adverseOrConcomitantCountFilters.siteIds"
                                    label="Sites"
                                    icon="chevron-down-curve"
                                    :options="siteLookups"
                                    option-placement="bottom-end"
                                    option-class="w-[32rem]"
                                    :disabled="loading.isDisabled(siteOptions.loading)"
                                    :loading="siteOptions.loading"
                                    :error="null"
                                    :ellipse-count="50"
                                    :is-all-options-selected="
                                        getArrayLength(adverseOrConcomitantCountFilters.siteIds) !==
                                            0 &&
                                        getArrayLength(adverseOrConcomitantCountFilters.siteIds) ===
                                            getArrayLength(siteLookups)
                                    "
                                    select-all-label="Select all sites"
                                    :is-filter-active="
                                        getArrayLength(adverseOrConcomitantCountFilters.siteIds) > 0
                                    "
                                    @on-clear="
                                        async () => {
                                            adverseOrConcomitantCountFilters.siteIds = [];
                                            await adverseOrConcomitantCount();
                                        }
                                    "
                                    @on-blur="
                                        async (selectedOptions) => {
                                            const isOptionsChanged = checkIfModelChanged(
                                                selectedOptions,
                                                adverseOrConcomitantCountFilters.siteIds,
                                            );
                                            adverseOrConcomitantCountFilters.siteIds = [
                                                ...(selectedOptions as number[]),
                                            ];
                                            if (isOptionsChanged) await adverseOrConcomitantCount();
                                        }
                                    "
                                />
                                <edc-multi-select-filter
                                    :key="`subjectIds-${getArrayLength(adverseOrConcomitantCountFilters.subjectIds) > 0 ? adverseOrConcomitantCountFilters.subjectIds.join(', ') : ''}`"
                                    v-model="adverseOrConcomitantCountFilters.subjectIds"
                                    label="Subjects"
                                    icon="chevron-down-curve"
                                    :options="subjectLookups"
                                    option-placement="bottom-end"
                                    option-class="w-[32rem]"
                                    :disabled="loading.isDisabled(subjectOptions.loading)"
                                    :loading="subjectOptions.loading"
                                    :error="null"
                                    :ellipse-count="50"
                                    :is-all-options-selected="
                                        getArrayLength(
                                            adverseOrConcomitantCountFilters.subjectIds,
                                        ) !== 0 &&
                                        getArrayLength(
                                            adverseOrConcomitantCountFilters.subjectIds,
                                        ) === getArrayLength(subjectLookups)
                                    "
                                    select-all-label="Select all subjects"
                                    :is-filter-active="
                                        getArrayLength(
                                            adverseOrConcomitantCountFilters.subjectIds,
                                        ) > 0
                                    "
                                    @on-clear="
                                        async () => {
                                            adverseOrConcomitantCountFilters.subjectIds = [];
                                            await adverseOrConcomitantCount();
                                        }
                                    "
                                    @on-blur="
                                        async (selectedOptions) => {
                                            const isOptionsChanged = checkIfModelChanged(
                                                selectedOptions,
                                                adverseOrConcomitantCountFilters.subjectIds,
                                            );
                                            adverseOrConcomitantCountFilters.subjectIds = [
                                                ...(selectedOptions as number[]),
                                            ];
                                            if (isOptionsChanged) await adverseOrConcomitantCount();
                                        }
                                    "
                                />
                                <edc-multi-select-filter
                                    :key="`folderIds-${getArrayLength(adverseOrConcomitantCountFilters.folderIds) > 0 ? adverseOrConcomitantCountFilters.folderIds.join(', ') : ''}`"
                                    v-model="adverseOrConcomitantCountFilters.folderIds"
                                    label="Visits"
                                    icon="chevron-down-curve"
                                    :options="trialVisitLookups"
                                    option-placement="bottom-end"
                                    option-class="w-[32rem]"
                                    :disabled="loading.isDisabled(trialVisitOptions.loading)"
                                    :loading="trialVisitOptions.loading"
                                    :error="null"
                                    :ellipse-count="50"
                                    :is-all-options-selected="
                                        getArrayLength(
                                            adverseOrConcomitantCountFilters.folderIds,
                                        ) !== 0 &&
                                        getArrayLength(
                                            adverseOrConcomitantCountFilters.folderIds,
                                        ) === getArrayLength(trialVisitLookups)
                                    "
                                    select-all-label="Select all visits"
                                    :is-filter-active="
                                        getArrayLength(adverseOrConcomitantCountFilters.folderIds) >
                                        0
                                    "
                                    @on-clear="
                                        async () => {
                                            adverseOrConcomitantCountFilters.folderIds = [];
                                            await adverseOrConcomitantCount();
                                        }
                                    "
                                    @on-blur="
                                        async (selectedOptions) => {
                                            const isOptionsChanged = checkIfModelChanged(
                                                selectedOptions,
                                                adverseOrConcomitantCountFilters.folderIds,
                                            );
                                            adverseOrConcomitantCountFilters.folderIds = [
                                                ...(selectedOptions as number[]),
                                            ];
                                            if (isOptionsChanged) await adverseOrConcomitantCount();
                                        }
                                    "
                                />
                            </div>
                        </div>
                    </template>
                    <template #chart>
                        <BarChart
                            v-if="isAdverseOrConcomitantEmpty !== 'No records'"
                            v-bind="adverseOrConcomitantChartProps"
                            class="w-[90%]"
                        />
                        <div v-else class="flex flex-row items-center justify-center h-[25rem]">
                            <span
                                v-if="isAdverseOrConcomitantEmpty === 'No records'"
                                class="inline-block font-13"
                                >No records</span
                            >
                            <span v-else class="inline-block font-13">No subjects status</span>
                        </div>
                    </template>
                </edc-dashboard-report-card>
            </template>
            <template
                v-if="
                    studyStore.loading.pageDetails ||
                    loading.dynamicLoading['formFieldDiscrepanciesProgressStatusCount']
                "
            >
                <edc-skeleton-loader
                    container-class="w-full h-[28.25rem] lg:h-[44.25rem] rounded-[var(--border-radius-10)]"
                    loader-type="rectangle"
                />
            </template>
            <template v-else-if="studyStore.isStudySelected()">
                <edc-dashboard-report-card>
                    <template #filters>
                        <span
                            class="text-[var(--color-report-heading)] text-[1.5rem] font-semibold mx-auto mt-[1rem]"
                            >Discrepancies</span
                        >
                        <div
                            v-if="isFormFieldDiscrepanciesProgressStatusEmpty !== 'No records'"
                            class="self-end gap-[1rem] w-full py-[1rem] pl-[1rem] pr-[3rem] flex flex-row items-center justify-end"
                        >
                            <div class="flex flex-row items-center gap-[1rem]">
                                <span class="mr-[1rem] text-[1.3rem] text-[var(--color-tab-header)]"
                                    >Filter by</span
                                >
                                <edc-multi-select-filter
                                    :key="`siteIds-${getArrayLength(formFieldDiscrepanciesProgressStatusCountFilters.siteIds) > 0 ? formFieldDiscrepanciesProgressStatusCountFilters.siteIds.join(', ') : ''}`"
                                    v-model="
                                        formFieldDiscrepanciesProgressStatusCountFilters.siteIds
                                    "
                                    label="Sites"
                                    icon="chevron-down-curve"
                                    :options="siteLookups"
                                    option-placement="bottom-end"
                                    option-class="w-[32rem]"
                                    :disabled="loading.isDisabled(siteOptions.loading)"
                                    :loading="siteOptions.loading"
                                    :error="null"
                                    :ellipse-count="50"
                                    :is-all-options-selected="
                                        getArrayLength(
                                            formFieldDiscrepanciesProgressStatusCountFilters.siteIds,
                                        ) !== 0 &&
                                        getArrayLength(
                                            formFieldDiscrepanciesProgressStatusCountFilters.siteIds,
                                        ) === getArrayLength(siteLookups)
                                    "
                                    select-all-label="Select all sites"
                                    :is-filter-active="
                                        getArrayLength(
                                            formFieldDiscrepanciesProgressStatusCountFilters.siteIds,
                                        ) > 0
                                    "
                                    @on-clear="
                                        async () => {
                                            formFieldDiscrepanciesProgressStatusCountFilters.siteIds =
                                                [];
                                            await formFieldDiscrepanciesProgressStatusCount();
                                        }
                                    "
                                    @on-blur="
                                        async (selectedOptions) => {
                                            const isOptionsChanged = checkIfModelChanged(
                                                selectedOptions,
                                                formFieldDiscrepanciesProgressStatusCountFilters.siteIds,
                                            );
                                            formFieldDiscrepanciesProgressStatusCountFilters.siteIds =
                                                [...(selectedOptions as number[])];
                                            if (isOptionsChanged)
                                                await formFieldDiscrepanciesProgressStatusCount();
                                        }
                                    "
                                />
                                <edc-multi-select-filter
                                    :key="`subjectIds-${getArrayLength(formFieldDiscrepanciesProgressStatusCountFilters.subjectIds) > 0 ? formFieldDiscrepanciesProgressStatusCountFilters.subjectIds.join(', ') : ''}`"
                                    v-model="
                                        formFieldDiscrepanciesProgressStatusCountFilters.subjectIds
                                    "
                                    label="Subjects"
                                    icon="chevron-down-curve"
                                    :options="subjectLookups"
                                    option-placement="bottom-end"
                                    option-class="w-[32rem]"
                                    :disabled="loading.isDisabled(subjectOptions.loading)"
                                    :loading="subjectOptions.loading"
                                    :error="null"
                                    :ellipse-count="50"
                                    :is-all-options-selected="
                                        getArrayLength(
                                            formFieldDiscrepanciesProgressStatusCountFilters.subjectIds,
                                        ) !== 0 &&
                                        getArrayLength(
                                            formFieldDiscrepanciesProgressStatusCountFilters.subjectIds,
                                        ) === getArrayLength(subjectLookups)
                                    "
                                    select-all-label="Select all subjects"
                                    :is-filter-active="
                                        getArrayLength(
                                            formFieldDiscrepanciesProgressStatusCountFilters.subjectIds,
                                        ) > 0
                                    "
                                    @on-clear="
                                        async () => {
                                            formFieldDiscrepanciesProgressStatusCountFilters.subjectIds =
                                                [];
                                            await formFieldDiscrepanciesProgressStatusCount();
                                        }
                                    "
                                    @on-blur="
                                        async (selectedOptions) => {
                                            const isOptionsChanged = checkIfModelChanged(
                                                selectedOptions,
                                                formFieldDiscrepanciesProgressStatusCountFilters.siteIds,
                                            );
                                            formFieldDiscrepanciesProgressStatusCountFilters.subjectIds =
                                                [...(selectedOptions as number[])];
                                            if (isOptionsChanged)
                                                await formFieldDiscrepanciesProgressStatusCount();
                                        }
                                    "
                                />
                                <edc-dropdown-filter
                                    :key="`typeId-${formFieldDiscrepanciesProgressStatusCountFilters.typeId ? formFieldDiscrepanciesProgressStatusCountFilters.typeId : ''}`"
                                    v-model="
                                        formFieldDiscrepanciesProgressStatusCountFilters.typeId
                                    "
                                    label="Type"
                                    icon="chevron-down-curve"
                                    :options="discrepancyTypeLookups"
                                    option-placement="bottom-end"
                                    option-class="w-[32rem]"
                                    :disabled="loading.isDisabled()"
                                    :loading="false"
                                    :error="null"
                                    :ellipse-count="50"
                                    select-all-label="Select all types"
                                    :is-filter-active="
                                        !!formFieldDiscrepanciesProgressStatusCountFilters.typeId
                                    "
                                    @on-select="
                                        async () => {
                                            await formFieldDiscrepanciesProgressStatusCount();
                                        }
                                    "
                                    @on-clear="
                                        async () => {
                                            await formFieldDiscrepanciesProgressStatusCount();
                                        }
                                    "
                                />
                            </div>
                        </div>
                    </template>
                    <template #chart>
                        <DoughnutChart
                            v-if="isFormFieldDiscrepanciesProgressStatusEmpty === ''"
                            v-bind="formFieldDiscrepancyChartProps"
                            class="w-[90%] h-[85%] lg:h-[70%]"
                        />
                        <div v-else class="flex flex-row items-center justify-center h-[25rem]">
                            <span
                                v-if="isFormFieldDiscrepanciesProgressStatusEmpty === 'No records'"
                                class="inline-block font-13"
                                >No records</span
                            >
                            <span v-else class="inline-block font-13">No discrepancies</span>
                        </div>
                    </template>
                </edc-dashboard-report-card>
            </template>
            <template
                v-if="
                    studyStore.loading.pageDetails ||
                    loading.dynamicLoading['subjectOverDueVisitCount']
                "
            >
                <edc-skeleton-loader
                    container-class="w-full h-[44.25remrem] lg:h-[44.25rem] rounded-[var(--border-radius-10)]"
                    loader-type="rectangle"
                />
            </template>
            <template v-else-if="studyStore.isStudySelected()">
                <edc-dashboard-report-card>
                    <template #filters>
                        <span
                            class="text-[var(--color-report-heading)] text-[1.5rem] font-semibold mx-auto mt-[1rem]"
                            >Overdue Visits</span
                        >
                        <div
                            v-if="isSubjectOverDueVisitEmpty !== 'No records'"
                            class="self-end gap-[1rem] w-full py-[1rem] pl-[1rem] pr-[3rem] flex flex-row items-center justify-end"
                        >
                            <div class="flex flex-row items-center gap-[1rem]">
                                <span class="mr-[1rem] text-[1.3rem] text-[var(--color-tab-header)]"
                                    >Filter by</span
                                >
                                <edc-multi-select-filter
                                    :key="`siteIds-${getArrayLength(subjectOverDueVisitCountFilters.siteIds) > 0 ? subjectOverDueVisitCountFilters.siteIds.join(', ') : ''}`"
                                    v-model="subjectOverDueVisitCountFilters.siteIds"
                                    label="Sites"
                                    icon="chevron-down-curve"
                                    :options="siteLookups"
                                    option-placement="bottom-end"
                                    option-class="w-[32rem]"
                                    :disabled="loading.isDisabled(siteOptions.loading)"
                                    :loading="siteOptions.loading"
                                    :error="null"
                                    :ellipse-count="50"
                                    :is-all-options-selected="
                                        getArrayLength(subjectOverDueVisitCountFilters.siteIds) !==
                                            0 &&
                                        getArrayLength(subjectOverDueVisitCountFilters.siteIds) ===
                                            getArrayLength(siteLookups)
                                    "
                                    select-all-label="Select all sites"
                                    :is-filter-active="
                                        getArrayLength(subjectOverDueVisitCountFilters.siteIds) > 0
                                    "
                                    @on-clear="
                                        async () => {
                                            subjectOverDueVisitCountFilters.siteIds = [];
                                            await subjectOverDueVisitCount();
                                        }
                                    "
                                    @on-blur="
                                        async (selectedOptions) => {
                                            const isOptionsChanged = checkIfModelChanged(
                                                selectedOptions,
                                                subjectOverDueVisitCountFilters.siteIds,
                                            );
                                            subjectOverDueVisitCountFilters.siteIds = [
                                                ...(selectedOptions as number[]),
                                            ];
                                            if (isOptionsChanged) await subjectOverDueVisitCount();
                                        }
                                    "
                                />
                                <edc-multi-select-filter
                                    :key="`subjectIds-${getArrayLength(subjectOverDueVisitCountFilters.subjectIds) > 0 ? subjectOverDueVisitCountFilters.subjectIds.join(', ') : ''}`"
                                    v-model="subjectOverDueVisitCountFilters.subjectIds"
                                    label="Subjects"
                                    icon="chevron-down-curve"
                                    :options="subjectLookups"
                                    option-placement="bottom-end"
                                    option-class="w-[32rem]"
                                    :disabled="loading.isDisabled(subjectOptions.loading)"
                                    :loading="subjectOptions.loading"
                                    :error="null"
                                    :ellipse-count="50"
                                    :is-all-options-selected="
                                        getArrayLength(
                                            subjectOverDueVisitCountFilters.subjectIds,
                                        ) !== 0 &&
                                        getArrayLength(
                                            subjectOverDueVisitCountFilters.subjectIds,
                                        ) === getArrayLength(subjectLookups)
                                    "
                                    select-all-label="Select all subjects"
                                    :is-filter-active="
                                        getArrayLength(subjectOverDueVisitCountFilters.subjectIds) >
                                        0
                                    "
                                    @on-clear="
                                        async () => {
                                            subjectOverDueVisitCountFilters.subjectIds = [];
                                            await subjectOverDueVisitCount();
                                        }
                                    "
                                    @on-blur="
                                        async (selectedOptions) => {
                                            const isOptionsChanged = checkIfModelChanged(
                                                selectedOptions,
                                                subjectOverDueVisitCountFilters.subjectIds,
                                            );
                                            subjectOverDueVisitCountFilters.subjectIds = [
                                                ...(selectedOptions as number[]),
                                            ];
                                            if (isOptionsChanged) await subjectOverDueVisitCount();
                                        }
                                    "
                                />
                            </div>
                            <!-- <edc-dropdown
                            :key="`siteId-${subjectOverDueVisitCountFilters.siteId ? subjectOverDueVisitCountFilters.siteId : ''}`"
                            v-model="subjectOverDueVisitCountFilters.siteId"
                            container-class="w-[15rem]"
                            default-value="Select site"
                            label="Site"
                            :options="[]"
                            
                            
                            option-placement="bottom"
                            option-class="w-[15rem]"
                            :disabled="loading.isDisabled()"
                            :loading="false"
                            :ellipse-count="50"
                        />
                        <edc-dropdown
                            :key="`subjectId-${subjectOverDueVisitCountFilters.subjectId ? subjectOverDueVisitCountFilters.subjectId : ''}`"
                            v-model="subjectOverDueVisitCountFilters.subjectId"
                            container-class="w-[15rem]"
                            default-value="Select subject"
                            label="Subject"
                            :options="[]"
                            
                            
                            option-placement="bottom"
                            option-class="w-[15rem]"
                            :disabled="loading.isDisabled()"
                            :loading="false"
                            :ellipse-count="50"
                        /> -->
                        </div>
                    </template>
                    <template #chart>
                        <BarChart
                            v-if="isSubjectOverDueVisitEmpty !== 'No records'"
                            v-bind="subjectOverDueVisitChartProps"
                            class="w-[90%]"
                        />
                        <div v-else class="flex flex-row items-center justify-center h-[25rem]">
                            <span
                                v-if="isSubjectOverDueVisitEmpty === 'No records'"
                                class="inline-block font-13"
                                >No records</span
                            >
                            <span v-else class="inline-block font-13">No overdues</span>
                        </div>
                    </template>
                </edc-dashboard-report-card>
            </template>
        </div>
    </div>
</template>

<style scoped>
    .box-shadow-a {
        box-shadow: 0px 2px 2px 0px #0000001a;
    }
</style>

<!-- <div class="flex flex-row flex-wrap items-center gap-[2rem] py-[2rem]">
    // comments
    <div
    v-for="menuRow of menus"
    :key="menuRow.id"
    class="transition-all cursor-pointer box-shadow-a flex flex-col items-start justify-between md:w-[25rem] md:h-[14.4rem] px-[2rem] py-[1rem] bg-white rounded-[var(--border-radius-10)] border-[0.1rem] border-transparent hover:border-[var(--color-primary)]"
    @click="menuRow.action"
>
    <img
        :src="getImageSource(menuRow.icon, 'icon')"
        :alt="getAltTagTitle(menuRow.label)"
        class="h-[5rem]"
    />
    <span class="gray-text font-14">{{ menuRow.label }}</span>
</div>
// comments
    <template v-if="studyStore.loading.pageDetails">
        <edc-skeleton-loader
            v-for="menuRow of menus"
            :key="menuRow.id"
            container-class="w-[25rem] h-[14.4rem]"
            loader-type="rectangle"
        />
    </template>
    <template v-else>
        <NuxtLink
            v-for="menuRow of menus"
            :key="menuRow.id"
            :to="
                getRouteNavigationData({
                    path: menuRow.routeDetails.path,
                })
            "
            class="transition-all cursor-pointer box-shadow-a flex flex-col items-start justify-between md:w-[25rem] md:h-[14.4rem] px-[2rem] py-[1rem] bg-white rounded-[var(--border-radius-10)] border-[0.1rem] border-transparent hover:border-[var(--color-primary)] group"
        >
            // Comments
            @click.prevent="menuRow.action()"
            // Comments
            // Comments
            <img
            :src="getImageSource(menuRow.icon, 'icon')"
            :alt="getAltTagTitle(menuRow.label)"
            class="h-[5rem]"
        />
            // Comments
            <edc-icon
                :icon="menuRow.icon"
                :class="`!w-[5rem] !h-[5rem] ${menuRow.label === 'Dashboard' ? 'stroke-[var(--color-gray-text)] group-hover:stroke-[var(--color-secondary)]' : 'fill-[var(--color-gray-text)] group-hover:fill-[var(--color-secondary)]'}`"
            />
            <span
                class="font-14 text-[var(--color-gray-text)] group-hover:text-[var(--color-secondary)]"
                >{{ menuRow.label }}</span
            >
        </NuxtLink>
    </template>
</div> -->
