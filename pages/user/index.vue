<script setup lang="ts">
    import { PAGE_LIMIT_OPTIONS } from "~/constants/options";
    import DropdownOption from "~/services/apis/data/dropdown-option";
    import Loading, { setLoaderForArrayDatas } from "~/services/apis/data/loading";
    import { siteListByStudyIdAPI } from "~/services/apis/handlers/admin/site";
    import { deleteUserByIdAPI, rolesListAPI } from "~/services/apis/handlers/admin/user";
    import {
        detailsByUserIdTrialIdAndEnvironmentIdAPI,
        onboardUserCreateAPI,
        onboardUsersPaginationListAPI,
        onboardUserUpdateAPI,
    } from "~/services/apis/handlers/portal/user";
    import type { IStudyUserSiteData } from "~/services/apis/handlers/types/admin/study-user-site-types";
    import type { IOnboardUserData } from "~/services/apis/handlers/types/user-types";
    import useGlobalStore from "~/stores/global";
    import usePopupModalStore from "~/stores/popup-modal";
    import useQuickLinkStore from "~/stores/quick-link";
    import useSideBarStore from "~/stores/side-bar";
    import useStudyStore from "~/stores/study";
    import useToastStore from "~/stores/toast";
    import useUserStore from "~/stores/user";
    import type {
        TAdminFormAction,
        TNullableNumber,
        TNullableString,
        TPageFilterAction,
        TTableLoaderDetail,
        TUnsavedFormAction,
        TVoidAction,
    } from "~/types/common";
    import type { IColumn, TSortType } from "~/types/datatable";
    import PaginationModel from "~/utils/pagination";

    definePageMeta({
        layout: "portal-layout",
    });

    useHead({
        title: seoPageTitle("Onboard Users"),
    });

    interface IFilterModel {
        enterpriseName: TNullableString;
        organization: TNullableString;
        search: TNullableString;
    }

    interface IFormModel {
        id: TNullableNumber;
        trialId: TNullableNumber;
        environmentId: TNullableNumber;
        siteIds: number[];
        name: TNullableString;
        roleId: TNullableNumber;
        role: TNullableString;
        orgType: TNullableString;
        isActive: boolean;
        isInternal: boolean;
        firstName: TNullableString;
        lastName: TNullableString;
        username: TNullableString;
        password: TNullableString;
        enterpriseName: TNullableString;
        emailAddress: TNullableString;
        lastLoginTime: TNullableString;
    }

    interface IErrorModel {
        id: string;
        trialId: string;
        environmentId: string;
        siteIds: string;
        name: string;
        roleId: string;
        role: string;
        orgType: string;
        isActive: string;
        isInternal: string;
        firstName: string;
        lastName: string;
        username: string;
        password: string;
        enterpriseName: string;
        emailAddress: string;
        lastLoginTime: string;
    }

    const defaultFilterModel = (): IFilterModel => ({
        search: null,
        enterpriseName: null,
        organization: null,
    });

    const defaultFormModel = (): IFormModel => ({
        id: null,
        trialId: null,
        environmentId: null,
        siteIds: [],
        name: null,
        roleId: null,
        role: null,
        orgType: null,
        isActive: false,
        isInternal: false,
        firstName: null,
        lastName: null,
        username: null,
        password: null,
        enterpriseName: null,
        emailAddress: null,
        lastLoginTime: null,
    });

    const defaultErrorModel = (): IErrorModel => ({
        id: "",
        trialId: "",
        environmentId: "",
        siteIds: "",
        name: "",
        roleId: "",
        role: "",
        orgType: "",
        isActive: "",
        isInternal: "",
        firstName: "",
        lastName: "",
        username: "",
        password: "",
        enterpriseName: "",
        emailAddress: "",
        lastLoginTime: "",
    });

    const globalStore = useGlobalStore();
    const toastStore = useToastStore();
    const sideBarStore = useSideBarStore();
    const popupModalStore = usePopupModalStore();
    const studyStore = useStudyStore();
    const userStore = useUserStore();
    const quickLinkStore = useQuickLinkStore();
    const route = useRoute();

    const columns = ref<IColumn[]>([
        {
            header: "First Name",
            field: "firstName",
            show: true,
            icon: false,
            sort: true,
            sortOrder: "descending",
        },
        {
            header: "Last Name",
            field: "lastName",
            show: true,
            icon: false,
            sort: true,
            sortOrder: "descending",
        },
        {
            header: "Username",
            field: "username",
            show: true,
            icon: false,
            sort: true,
            sortOrder: "descending",
        },
        {
            header: "Email",
            field: "emailAddress",
            show: true,
            icon: false,
            sort: true,
            sortOrder: "descending",
        },
        {
            header: "Role",
            field: "role",
            show: true,
            icon: false,
            sort: true,
            sortOrder: "descending",
        },
        // {
        //     header: "Activated",
        //     field: "isActive",
        //     show: true,
        //     icon: false,
        // },
        {
            header: "Organization",
            field: "orgType",
            show: true,
            icon: false,
            sort: true,
            sortOrder: "descending",
        },
        {
            header: "Enterprise",
            field: "enterpriseName",
            show: true,
            icon: false,
            sort: true,
            sortOrder: "descending",
        },
    ]);

    const paginationModel = ref<PaginationModel>(new PaginationModel());
    const tableData = ref<IOnboardUserData[]>([]);
    const filterModel = ref<IFilterModel>({ ...defaultFilterModel() });
    const filterModelRef = ref<IFilterModel>({ ...defaultFilterModel() });
    const loading = ref<Loading>(new Loading());
    const formAction = ref<TAdminFormAction>("View");
    const formModel = ref<IFormModel>({ ...defaultFormModel() });
    const formModelRef = ref<IFormModel>({ ...defaultFormModel() });
    const errorModel = ref<IErrorModel>({ ...defaultErrorModel() });
    const roleOptions = ref<DropdownOption>(new DropdownOption());
    const studySiteOptions = ref<DropdownOption>(new DropdownOption());
    const tableLoaderDetails = ref<TTableLoaderDetail>({});
    const modelTriggerChange = ref<TUnsavedFormAction>("none");
    const orderByDetails = ref<Record<string, "asc" | "desc"> | undefined>(undefined);

    const roleLookups = computed(() => getOptionsList(roleOptions.value.options, "role", "id"));

    const studySiteLookups = computed(() =>
        getOptionsList(studySiteOptions.value.options, "siteName", "siteId"),
    );
    const isUserActionAllowed = computed(() =>
        checkIfActionIsAllowed(studyStore.getRoleIdBySiteId(), [
            RolePermissionType.UserAdditionAndRoleAssingment,
        ]),
    );

    async function roleList() {
        roleOptions.value.loading = true;
        const { status, data } = await rolesListAPI({
            onlyRoles: "true",
        });
        if (status === 200) {
            roleOptions.value.options = deepClone(data);
        } else {
            roleOptions.value.options = [];
        }
        roleOptions.value.loading = false;
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

    async function onboardUsersPaginationList() {
        loading.value.table = true;
        const { status, data, message } = await onboardUsersPaginationListAPI(
            getAPIFilters({
                search: filterModel.value.search,
                filter: {
                    trialId: studyStore.studyInformation.trialId,
                    environmentId: studyStore.studyInformation.environmentId,
                    enterpriseName: filterModel.value.enterpriseName,
                    organisation: filterModel.value.organization,
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
            tableData.value = deepClone(items);
            tableLoaderDetails.value = setLoaderForArrayDatas(items);
            paginationModel.value.pageDetails.totalRecords = total;
            paginationModel.value.pageDetails.lastPage = paginationModel.value.getLastPage();
        } else if (status !== 401) {
            toastStore.error({
                title: "Error",
                message,
            });
            tableData.value = [];
            paginationModel.value.clearPageDetails();
            paginationModel.value.clearCountDetails();
        }
        loading.value.table = false;
    }

    function resetModel(closeModal?: TVoidAction) {
        formModel.value = { ...defaultFormModel() };
        formModelRef.value = { ...defaultFormModel() };
        errorModel.value = { ...defaultErrorModel() };
        if (closeModal) closeModal();
        if (formAction.value !== "View") formAction.value = "View";
    }

    function validateAll() {
        if (getStringLength(formModel.value.firstName) === 0)
            errorModel.value.firstName = "Please enter a first name";
        else if (getStringLength(formModel.value.firstName) > 50)
            errorModel.value.firstName = "First name cannot be more than 50 characters";
        else errorModel.value.firstName = "";
        if (formModel.value.lastName && getStringLength(formModel.value.lastName) > 50)
            errorModel.value.lastName = "Last name cannot be more than 50 characters";
        else errorModel.value.lastName = "";
        if (getStringLength(formModel.value.username) === 0)
            errorModel.value.username = "Please enter a username";
        else if (getStringLength(formModel.value.username) > 50)
            errorModel.value.username = "Username cannot be more than 50 characters";
        else errorModel.value.username = "";
        if (getStringLength(formModel.value.emailAddress) === 0)
            errorModel.value.emailAddress = "Please enter an email";
        else if (getStringLength(formModel.value.emailAddress) > 255)
            errorModel.value.emailAddress = "Email cannot be more than 255 characters";
        else if (!checkEmail(formModel.value.emailAddress || ""))
            errorModel.value.emailAddress = "Please enter a valid email";
        else errorModel.value.emailAddress = "";
        if (formModel.value.orgType && getStringLength(formModel.value.orgType) > 50)
            errorModel.value.orgType = "Organization cannot be more than 50 characters";
        else errorModel.value.orgType = "";
        if (formModel.value.enterpriseName && getStringLength(formModel.value.enterpriseName) > 128)
            errorModel.value.enterpriseName = "Enterprise cannot be more than 128 characters";
        else errorModel.value.enterpriseName = "";
        if (!formModel.value.roleId) errorModel.value.roleId = "Please select a role";
        else errorModel.value.roleId = "";
        if (getArrayLength(formModel.value.siteIds) === 0)
            errorModel.value.siteIds = "Please select atleast one site";
        else errorModel.value.siteIds = "";
    }

    function getSiteIds(siteDetails: IStudyUserSiteData[]) {
        const result: number[] = [];
        for (const row of siteDetails) {
            result.push(row.siteId);
        }
        return result;
    }

    async function detailsByUserIdTrialIdAndEnvironmentId(userId: number) {
        loading.value.form = true;
        const { status, message, data } = await detailsByUserIdTrialIdAndEnvironmentIdAPI(
            userId,
            studyStore.studyInformation.trialId as number,
            studyStore.studyInformation.environmentId as number,
        );
        if (status === 200) {
            toastStore.success({
                title: "Success",
                message,
            });
            const siteIds = getSiteIds(data.studyUserSites);
            formModel.value.id = data.id;
            formModel.value.trialId = data.studies
                ? data.studies.trialId
                : studyStore.studyInformation.trialId;
            formModel.value.environmentId = data.studies
                ? data.studies.environmentId
                : studyStore.studyInformation.environmentId;
            formModel.value.siteIds = [...siteIds];
            formModel.value.name = data.name;
            formModel.value.roleId = data.roleId;
            formModel.value.role = null;
            formModel.value.orgType = data.orgType;
            formModel.value.isActive = data.isActive;
            formModel.value.isInternal = data.isInternal;
            formModel.value.firstName = data.firstName;
            formModel.value.lastName = data.lastName;
            formModel.value.username = data.username;
            formModel.value.password = data.password;
            formModel.value.emailAddress = data.emailAddress;
            formModel.value.lastLoginTime = data.lastLoginTime;

            formModelRef.value.id = data.id;
            formModelRef.value.trialId = data.studies
                ? data.studies.trialId
                : studyStore.studyInformation.trialId;
            formModelRef.value.environmentId = data.studies
                ? data.studies.environmentId
                : studyStore.studyInformation.environmentId;
            formModelRef.value.siteIds = [...siteIds];
            formModelRef.value.name = data.name;
            formModelRef.value.roleId = data.roleId;
            formModelRef.value.role = null;
            formModelRef.value.orgType = data.orgType;
            formModelRef.value.isActive = data.isActive;
            formModelRef.value.isInternal = data.isInternal;
            formModelRef.value.firstName = data.firstName;
            formModelRef.value.lastName = data.lastName;
            formModelRef.value.username = data.username;
            formModelRef.value.password = data.password;
            formModelRef.value.emailAddress = data.emailAddress;
            formModelRef.value.lastLoginTime = data.lastLoginTime;
        } else if (status !== 401) {
            toastStore.error({
                title: "Error",
                message,
            });
            formModel.value = { ...defaultFormModel() };
            formModelRef.value = { ...defaultFormModel() };
        }
        loading.value.form = false;
    }

    async function triggerAddOrEditUser(action: "Add" | "Update", data?: IOnboardUserData) {
        if (action === "Update") {
            await detailsByUserIdTrialIdAndEnvironmentId(data ? data.id : 0);
        }
        const { enterpriseName } = userStore.getDetails();
        formModel.value.enterpriseName = enterpriseName;
        formModelRef.value.enterpriseName = enterpriseName;
        popupModalStore.show("onboardUserModal");
        formAction.value = action;
    }

    async function addOrEditUser(closeModal: TVoidAction) {
        validateAll();
        if (!checkIfModelHasErrors(errorModel.value, ["isActive", "isInternal"])) {
            let message = "";
            let status = 500;
            let validationErrorsData = null;
            let data = null;
            loading.value.form = true;
            const requestData = {
                id: formModel.value.id || 0,
                firstName: formModel.value.firstName as string,
                lastName: formModel.value.lastName,
                username: formModel.value.username as string,
                name: "",
                emailAddress: formModel.value.emailAddress as string,
                trialId: formModel.value.trialId || studyStore.studyInformation.trialId,
                environmentId:
                    formModel.value.environmentId || studyStore.studyInformation.environmentId,
                enterpriseName: formModel.value.enterpriseName,
                orgType: formModel.value.orgType,
                password: formModel.value.password,
                isActive: formModel.value.isActive,
                isInternal: formModel.value.isInternal,
                lastLoginTime: formModel.value.lastLoginTime,
                role: formModel.value.role,
                roleId: formModel.value.roleId,
                siteIds: formModel.value.siteIds,
                updatedBy: 0,
            };
            if (!formModel.value.id) {
                const {
                    message: apiMessage,
                    status: apiStatus,
                    validationErrors: apiValidationErrors,
                    data: apiData,
                } = await onboardUserCreateAPI(requestData);
                message = apiMessage;
                status = apiStatus;
                validationErrorsData = apiValidationErrors;
                data = apiData;
            } else {
                const {
                    message: apiMessage,
                    status: apiStatus,
                    validationErrors: apiValidationErrors,
                    data: apiData,
                } = await onboardUserUpdateAPI(requestData);
                message = apiMessage;
                status = apiStatus;
                validationErrorsData = apiValidationErrors;
                data = apiData;
            }

            if (status === 200) {
                toastStore.success({
                    title: "Success",
                    message,
                });
                if (data && data?.subject) {
                    const uniqueKey = setEmailTemplate({
                        to: data?.to || "",
                        cc: data?.cc || "",
                        bcc: data?.bcc || "",
                        subject: data?.subject || "",
                        body: data?.body || "",
                        emailDetails: {
                            id: data?.tempId || "",
                            name: data?.name || "",
                        },
                    });
                    renderEmailTemplate(uniqueKey);
                }
                resetModel(closeModal);
                await onboardUsersPaginationList();
                paginationModel.value.clearCountDetails();
                paginationModel.value.clearPageDetails();
                processPagination();
            } else if (status !== 401) {
                toastStore.error({
                    title: "Error",
                    message,
                });
                if (status === 400 && validationErrorsData) {
                    setAPIValidationErrors(validationErrorsData, errorModel.value);
                }
            }
            loading.value.form = false;
        }
        // onboardUserUpdateAPI
    }

    async function deleteUserById(userId: string) {
        loading.value.form = true;
        const { status, message } = await deleteUserByIdAPI(userId);
        if (status === 200) {
            toastStore.success({
                title: "Success",
                message,
            });
            await onboardUsersPaginationList();
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
        Promise.all([
            onboardUsersPaginationList(),
            studySitesList(),
            quickLinkStore.triggerSaveAsQuickLinkAPI({
                id: 0,
                trialId: studyStore.studyInformation.trialId as number,
                environmentId: studyStore.studyInformation.environmentId as number,
                page: "Onboard Users",
                pageDetails: JSON.stringify({
                    page: PortalPath.User,
                }),
                studyId: 0,
            }),
        ]).then(() => {
            processPagination(true);
            if (studyStore.loading.processPageQueryOnPageLoad)
                studyStore.loading.processPageQueryOnPageLoad = false;
        });
    }

    function processPageQueryOnPageLoad() {
        if (route.query) {
            const {
                search = "",
                enterprise = "",
                organization = "",
                currentPage = "",
                pageLimit = "",
            } = route.query;
            if (search) filterModel.value.search = (search as string) || null;
            if (enterprise) filterModel.value.enterpriseName = (enterprise as string) || null;
            if (organization) filterModel.value.organization = (organization as string) || null;
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
                    enterprise: filterModel.value.enterpriseName,
                    organization: filterModel.value.organization,
                    currentPage: paginationModel.value.pageDetails.currentPage,
                    pageLimit: paginationModel.value.pageDetails.pageLimit,
                },
                PortalPath.User,
                removeKeys,
            );
        else removeFiltersFromQuery(removeKeys, PortalPath.User);
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
        await onboardUsersPaginationList();
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

    const { isModelChanged, model, modelRef } = useUnsavedAlert(
        formModel.value,
        formModelRef.value,
    );
    watch(
        () => formModel.value,
        (newValue) => {
            model.value = newValue;
            modelRef.value = formModelRef.value;
        },
        { deep: true },
    );

    watch(
        () => isModelChanged.value,
        (newValue) => {
            if (newValue) modelTriggerChange.value = "unsaved";
            else modelTriggerChange.value = "none";
        },
    );

    watch(
        () => modelTriggerChange.value,
        (newmodelTriggerChange) => {
            if (newmodelTriggerChange === "reset" && isModelChanged.value) {
                resetModel();
                modelTriggerChange.value = "none";
                formAction.value = "View";
                popupModalStore.hide("onboardUserModal");
            }
        },
    );

    onMounted(() => {
        // if (
        //     checkIfActionIsAllowed(
        //         studyStore.getRoleIdBySiteId(),
        //         RolePermissionType.UserAdditionAndRoleAssingment,
        //     )
        // ) {
        //     if (studyStore.isStudySelected()) {
        //         if (studyStore.loading.pageDetails) studyStore.loading.pageDetails = false;
        //         else onPageLoad();
        //     } else {
        //         studyStore.triggerModel = true;
        //     }
        //     Promise.all([roleList()]);
        // } else {
        //     await redirectToDashboardDueToNoPermission(true);
        // }
        processPageQueryOnPageLoad();
        if (studyStore.isStudySelected()) {
            studyStore.loading.processPageQueryOnPageLoad = true;
            if (studyStore.loading.pageDetails) studyStore.loading.pageDetails = false;
            else onPageLoad();
        } else {
            studyStore.triggerModel = true;
        }
        Promise.all([roleList()]);
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
                        v-if="isUserActionAllowed"
                        container-class="hover:opacity-100 rounded-[var(--border-radius-6)] bg-[var(--color-accent)] hover:bg-[var(--color-accent-hover)]"
                        slot-wrapper-class="flex flex-row items-center justify-between gap-x-[1.5rem] px-[1rem] py-[0.6rem] lg:py-[0.7rem]"
                        :on-click="
                            async () => {
                                await triggerAddOrEditUser('Add');
                            }
                        "
                    >
                        <span class="text-[1.2rem] white-text">Add User</span>
                        <edc-icon icon="plus" class="h-[1.5rem]" fill="var(--color-white)" />
                    </edc-pressable>
                    <edc-search-bar
                        v-model="filterModel.search"
                        element-id="userSearch"
                        class="w-[20rem]"
                        @on-search="
                            async () => {
                                paginationModel.clearCountDetails();
                                if (filterModel.search)
                                    processPageFilters('apply', ['currentPage']);
                                else processPageFilters('reset', ['search', 'currentPage']);
                                processPageFilters('reset', ['currentPage', 'pageLimit']);
                                paginationModel.pageDetails.currentPage = 1;
                                paginationModel.pageDetails.lastPage = 0;
                                await onboardUsersPaginationList();
                                processPagination();
                                globalStore.triggerSearchBarRefocus('#userSearch');
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
                    table-id="onboardUsersDataTable"
                    :columns="columns"
                    :table-data="tableData"
                    :pagination-model="paginationModel"
                    :loading="loading.table || studyStore.loading.pageDetails"
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
                            paginationModel.clearCountDetails();
                            paginationModel.pageDetails.currentPage = 1;
                            paginationModel.pageDetails.lastPage = 0;
                            await onboardUsersPaginationList();
                            processPagination();
                        }
                    "
                    @on-page-change="
                        async () => {
                            if (paginationModel.pageDetails.currentPage > 1)
                                processPageFilters('apply');
                            else processPageFilters('reset', ['currentPage']);
                            await onboardUsersPaginationList();
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
                            class="font-normal text-center font-12 !whitespace-normal !break-words custom-row !min-w-[15rem] !max-w-[15rem]"
                        >
                            <span>{{ data.firstName }}</span>
                        </td>
                        <td
                            class="font-normal text-center font-12 !whitespace-normal !break-words custom-row !min-w-[15rem] !max-w-[15rem]"
                        >
                            <span>{{ data.lastName }}</span>
                        </td>
                        <td
                            class="font-normal text-center font-12 !whitespace-normal !break-words custom-row !min-w-[10rem] !max-w-[10rem]"
                        >
                            <span>{{ data.username }}</span>
                        </td>
                        <td
                            class="font-normal text-center font-12 !whitespace-normal !break-words custom-row min-w-[12rem] max-w-[12rem]"
                        >
                            <span>{{ data.emailAddress }}</span>
                        </td>
                        <td
                            class="font-normal text-center font-12 !whitespace-normal !break-words custom-row !min-w-[8rem] !max-w-[8rem]"
                        >
                            <span>{{ data.role }}</span>
                        </td>
                        <td
                            class="font-normal text-center font-12 !whitespace-normal !break-words custom-row !min-w-[5rem] !max-w-[5rem]"
                        >
                            <span>{{ data.organization }}</span>
                        </td>
                        <td
                            class="font-normal text-center font-12 !whitespace-normal !break-words custom-row !min-w-[5rem] !max-w-[5rem]"
                        >
                            <span>{{ data.enterpriseName }}</span>
                        </td>
                    </template>
                    <template #action="{ data, index }">
                        <edc-pressable
                            v-if="isUserActionAllowed"
                            loader-type="table-save"
                            :disabled="loading.isDisabled()"
                            :on-click="
                                async () => {
                                    await triggerAddOrEditUser('Update', data);
                                }
                            "
                        >
                            <edc-icon
                                v-tooltip.top="'Update'"
                                icon="edit"
                                fill="var(--color-secondary)"
                                :class="`${commonActionIconClasses('Update')}`"
                            />
                        </edc-pressable>
                        <edc-delete-confirmation
                            v-if="data.id && isUserActionAllowed"
                            :key="`${checkIfKeyExistsInObject(index, tableLoaderDetails) && tableLoaderDetails[index] ? 'show' : 'hide'}DeleteConfirmation`"
                            message="Are you sure you want to delete the user?"
                            :disabled="loading.isDisabled()"
                            :on-delete="
                                async () => {
                                    tableLoaderDetails[index] = true;
                                    await deleteUserById(String(data.id));
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
                paginationModel.clearCountDetails();
                paginationModel.pageDetails.currentPage = 1;
                paginationModel.pageDetails.lastPage = 0;
                await onboardUsersPaginationList();
                processPagination();
            }
        "
        @on-reset="
            async () => {
                sideBarStore.hide();
                filterModel = { ...filterModel, enterpriseName: null, organization: null };
                processPageFilters('reset', ['enterprise', 'organization', 'currentPage']);
                paginationModel.pageDetails.currentPage = 1;
                paginationModel.pageDetails.lastPage = 0;
                paginationModel.clearCountDetails();
                await onboardUsersPaginationList();
                processPagination();
            }
        "
        @on-close="
            () => {
                filterModel = deepClone(filterModelRef);
            }
        "
    >
        <edc-text-input
            v-model="filterModel.organization"
            container-class="w-full"
            type="text"
            placeholder="Enter organization"
            label="Organization"
            :disabled="loading.isDisabled()"
        />
        <edc-text-input
            v-model="filterModel.enterpriseName"
            container-class="w-full"
            type="text"
            placeholder="Enter enterprise"
            label="Enterprise"
            :disabled="loading.isDisabled()"
        />
    </edc-side-bar>
    <edc-popup-modal
        v-if="formAction !== 'View'"
        modal-id="onboardUserModal"
        container-class="min-w-[82vw]"
        :submit-label="formAction"
        :on-submit="
            async (closeModal) => {
                await addOrEditUser(closeModal);
            }
        "
        :on-cancel="
            (closeModal) => {
                resetModel(closeModal);
            }
        "
    >
        <span class="text-[1.2rem] font-semibold self-start"
            >Fields marked with an asterisk (<span class="text-[var(--color-error)]">*</span>) are
            required</span
        >
        <div class="grid grid-cols-3 gap-x-[5rem] gap-y-[1rem]">
            <edc-text-input
                v-model="formModel.firstName"
                container-class="w-full"
                type="text"
                placeholder="Enter first name"
                label="First name"
                :required="true"
                :disabled="loading.isDisabled()"
                :error="errorModel.firstName"
            />
            <edc-text-input
                v-model="formModel.lastName"
                container-class="w-full"
                type="text"
                placeholder="Enter last name"
                label="Last name"
                :disabled="loading.isDisabled()"
                :error="errorModel.lastName"
            />
            <edc-text-input
                v-model="formModel.username"
                container-class="w-full"
                type="text"
                placeholder="Enter username"
                label="Username"
                :required="true"
                :disabled="loading.isDisabled()"
                :error="errorModel.username"
            />
            <edc-text-input
                v-model="formModel.emailAddress"
                container-class="w-full"
                type="text"
                placeholder="Enter email"
                label="Email"
                :required="true"
                :disabled="loading.isDisabled()"
                :error="errorModel.emailAddress"
            />
            <edc-text-input
                v-model="formModel.orgType"
                container-class="w-full"
                type="text"
                placeholder="Enter organization"
                label="Organization"
                :disabled="loading.isDisabled()"
                :error="errorModel.orgType"
            />
            <edc-text-input
                v-model="formModel.enterpriseName"
                container-class="w-full"
                type="text"
                placeholder="Enter enterprise"
                label="Enterprise"
                :disabled="loading.isDisabled(true)"
                :error="errorModel.enterpriseName"
            />
            <edc-dropdown
                :key="`roleId-${formModel.roleId ? formModel.roleId : ''}`"
                v-model="formModel.roleId"
                container-class="w-full"
                default-value="Select role"
                label="Role"
                :options="roleLookups"
                option-placement="bottom"
                :required="true"
                :disabled="loading.isDisabled(roleOptions.loading)"
                :loading="roleOptions.loading"
                :error="errorModel.roleId"
                :ellipse-count="50"
            />
            <edc-multi-select
                :key="`siteIds-${getArrayLength(formModel.siteIds) > 0 ? formModel.siteIds.join(', ') : ''}`"
                v-model="formModel.siteIds"
                container-class="w-full"
                default-value="Select sites"
                label="Sites"
                :options="studySiteLookups"
                option-placement="bottom"
                :required="true"
                :disabled="loading.isDisabled(studySiteOptions.loading)"
                :loading="roleOptions.loading"
                :error="errorModel.siteIds"
                :ellipse-count="50"
                @on-blur="
                    (selectedOptions: number[]) => {
                        formModel.value.siteIds = [...selectedOptions];
                    }
                "
            />
        </div>
    </edc-popup-modal>
</template>

<style>
    div.table-wrapper[skeleton] table#onboardUsersDataTable thead tr th:nth-child(1) {
        min-width: 15rem;
        max-width: 15rem;
    }
    div.table-wrapper[skeleton] table#onboardUsersDataTable thead tr th:nth-child(2) {
        min-width: 15rem;
        max-width: 15rem;
    }
    div.table-wrapper[skeleton] table#onboardUsersDataTable thead tr th:nth-child(3) {
        min-width: 10rem;
        max-width: 10rem;
    }
    div.table-wrapper[skeleton] table#onboardUsersDataTable thead tr th:nth-child(4) {
        min-width: 17.812rem;
        max-width: 17.812rem;
    }
    div.table-wrapper[skeleton] table#onboardUsersDataTable thead tr th:nth-child(5) {
        min-width: 8rem;
        max-width: 8rem;
    }
    div.table-wrapper[skeleton] table#onboardUsersDataTable thead tr th:nth-child(6) {
        min-width: 9.514rem;
        max-width: 9.514rem;
    }
    div.table-wrapper[skeleton] table#onboardUsersDataTable thead tr th:nth-child(7) {
        min-width: 8.188rem;
        max-width: 8.188rem;
    }
    div.table-wrapper[skeleton] table#onboardUsersDataTable thead tr th:nth-child(8) {
        min-width: 6rem;
        max-width: 6rem;
    }
    @media screen and (min-width: 1440px) {
        div.table-wrapper[skeleton] table#onboardUsersDataTable thead tr th:nth-child(1) {
            min-width: 21.577rem;
            max-width: 21.577rem;
        }
        div.table-wrapper[skeleton] table#onboardUsersDataTable thead tr th:nth-child(2) {
            min-width: 21.577rem;
            max-width: 21.577rem;
        }
        div.table-wrapper[skeleton] table#onboardUsersDataTable thead tr th:nth-child(3) {
            min-width: 14.385rem;
            max-width: 14.385rem;
        }
        div.table-wrapper[skeleton] table#onboardUsersDataTable thead tr th:nth-child(4) {
            min-width: 25.623rem;
            max-width: 25.623rem;
        }
        div.table-wrapper[skeleton] table#onboardUsersDataTable thead tr th:nth-child(5) {
            min-width: 11.508rem;
            max-width: 11.508rem;
        }
        div.table-wrapper[skeleton] table#onboardUsersDataTable thead tr th:nth-child(6) {
            min-width: 14.512rem;
            max-width: 14.512rem;
        }
        div.table-wrapper[skeleton] table#onboardUsersDataTable thead tr th:nth-child(7) {
            min-width: 12.431rem;
            max-width: 12.431rem;
        }
        div.table-wrapper[skeleton] table#onboardUsersDataTable thead tr th:nth-child(8) {
            min-width: 8.634rem;
            max-width: 8.634rem;
        }
    }
</style>
