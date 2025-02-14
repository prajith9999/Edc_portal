<script setup lang="ts">
    import { IconKeys } from "~/utils/images-and-icons";
    import { type TNullableString, type TVoidAction } from "~/types/common";
    import useGlobalStore from "~/stores/global";
    import useStudyStore from "~/stores/study";
    import usePopupModalStore from "~/stores/popup-modal";
    import useUserStore from "~/stores/user";
    import type { IMenu } from "~/utils/route";
    import {
        changeNewPasswordUserAPI,
        rolePermissionsListAPI,
        rolePermissionsListByTrialIdAndEnvironmentAPI,
    } from "~/services/apis/handlers/portal/user";
    import {
        detailsByTrialIdAndEnvironmentId,
        studyLatestReleaseVersionDetailsyTrialAndEnvironmentIdAPI,
    } from "~/services/apis/handlers/portal/study";
    import Loading from "~/services/apis/data/loading";
    import useToastStore from "~/stores/toast";
    import type { IUserRolePermissionData } from "~/services/apis/handlers/types/user-types";
    import { taskNotificationCountAPI } from "~/services/apis/handlers/portal/my-task";

    interface IChangePasswordFormModel {
        oldPassword: TNullableString;
        newPassword: TNullableString;
        confirmPassword: TNullableString;
    }

    interface IChangePasswordErrorModel {
        oldPassword: string;
        newPassword: string;
        confirmPassword: string;
    }

    const getDefaultChangePasswordFormModel = (): IChangePasswordFormModel => ({
        oldPassword: null,
        newPassword: null,
        confirmPassword: null,
    });

    const getDefaultChangePasswordErrorModel = (): IChangePasswordErrorModel => ({
        oldPassword: "",
        newPassword: "",
        confirmPassword: "",
    });

    const menus = ref<IMenu[]>(menusList("side menu"));

    const globalStore = useGlobalStore();
    const studyStore = useStudyStore();
    const popupModalStore = usePopupModalStore();
    const userStore = useUserStore();
    const toastStore = useToastStore();
    const route = useRoute();
    // const { copy } = useClipboard();

    const [menuExpanded, toggle] = useToggle(false);

    const profileIcon = ref();
    const loading = ref<Loading>(new Loading());
    const isProfileHovered = useElementHover(profileIcon);
    const showChangePasswordModal = ref<boolean>(false);
    const changePasswordModel = ref<IChangePasswordFormModel>({
        ...getDefaultChangePasswordFormModel(),
    });
    const changeErrorPasswordModel = ref<IChangePasswordErrorModel>({
        ...getDefaultChangePasswordErrorModel(),
    });
    // const latestReleaseVersionId = ref<TNullableNumber>(null);
    const notificationCount = ref<number>(0);

    const userDetails = computed(() => {
        return userStore.getDetails();
    });
    const versionLabel = computed(() => (menuExpanded.value ? "CRF Version" : "V"));
    const buildLabel = computed(() => (menuExpanded.value ? "Build" : "B"));
    const environmentLabel = computed(() => (menuExpanded.value ? "Environment" : "E"));
    const headerTitle = computed(() => {
        let result = "Dashboard";
        if (route.name === "subject-site-transfer-approval") result = "Subject Site Transfer";
        else result = getEmptyValue(studyStore.trialName || "Dashboard");
        return result;
    });

    async function rolePermissionsList() {
        userStore.getRolePermissionDetails();
        if (getArrayLength(userStore.rolePermissionsDetails) === 0) {
            const { status, data } = await rolePermissionsListAPI();
            if (status === 200) {
                userStore.setRolePermissionDetails(data);
            } else {
                userStore.setRolePermissionDetails([]);
            }
        }
    }

    async function getStudyDetails() {
        if (studyStore.studyInformation.trialId && studyStore.studyInformation.environmentId) {
            const { status, data } = await detailsByTrialIdAndEnvironmentId(
                studyStore.studyInformation.trialId,
                studyStore.studyInformation.environmentId,
            );
            if (status === 200 && data) {
                studyStore.studyInformation.studyId = data.id;
            } else if (status !== 401) {
                studyStore.studyInformation.studyId = null;
            }
        }
    }

    async function resetStudyModal(closeModal?: TVoidAction) {
        studyStore.triggerModel = false;
        if (closeModal) closeModal();
        // studyStore.loading.pageDetails = false;
        await redirectToDashboard();
        studyStore.triggerModelInDashboard = false;
    }

    // TODO: commenting the below due to read access is there for all users
    // function triggerMenuChange() {
    //     userStore.triggerDashboardMenuChange = true;
    //     menus.value = menusList("side menu");
    // }

    async function handleSubmit(closeModal: TVoidAction) {
        if (!studyStore.validateStudySelect()) {
            log("info", ["studyStore.studyInformation", studyStore.studyInformation]);
            await Promise.all([
                getStudyDetails(),
                rolePermissionsListByTrialIdAndEnvironment(),
                studyLatestReleaseVersionDetailsyTrialAndEnvironmentId(),
                taskNotificationCount(),
            ]);
            // globalStore.setHeaderTitle(getEmptyValue(studyStore.trialName));
            // await navigateTo(
            //     getRouteNavigationData({
            //         path: PortalPath.ClinicalTrials,
            //         params: {
            //             trialId: studyStore.studyInformation.trialId,
            //         },
            //     }),
            // );
            // triggerMenuChange();
            studyStore.studyInformationRef.trialId = studyStore.studyInformation.trialId;
            studyStore.studyInformationRef.environmentId =
                studyStore.studyInformation.environmentId;
            studyStore.studyInformationRef.studyId = studyStore.studyInformation.studyId;
            studyStore.studyInformationRef.latestReleaseVersionId =
                studyStore.studyInformation.latestReleaseVersionId;
            studyStore.storeInLocalStorage();
            await resetStudyModal();
            closeModal();
        }
    }

    function processTriggerModel() {
        studyStore.loading.pageDetails = true;
        studyStore.hydrateDetails();
        studyStore.processEnvironmentDetails();
        popupModalStore.show("studyInformationModal");
    }

    function triggerModel() {
        // const navigationType = performance.getEntriesByType("navigation")[0]
        //     ? (performance.getEntriesByType("navigation")[0] as PerformanceNavigationTiming).type
        //     : "";
        // if (navigationType === "reload") {
        //     setTimeout(() => {
        //         processTriggerModel();
        //     }, 100);
        // } else {
        //     processTriggerModel();
        // }
        processTriggerModel();
    }

    async function rolePermissionsListByTrialIdAndEnvironment() {
        const { status, data } = await rolePermissionsListByTrialIdAndEnvironmentAPI(
            studyStore.studyInformation.trialId as number,
            studyStore.studyInformation.environmentId as number,
        );
        let result: IUserRolePermissionData[] = [];
        if (status === 200) {
            result = deepClone(data);
            // studyStore.studyRolePermissionDetails = deepClone(data);
        } else if (status !== 401) {
            result = [];
            // studyStore.studyRolePermissionDetails = [];
        }
        studyStore.setStudyPermissionDetails(result);
    }

    async function taskNotificationCount() {
        const { status, data } = await taskNotificationCountAPI({
            trialId: studyStore.studyInformation.trialId as number,
            environmentId: studyStore.studyInformation.environmentId as number,
        });
        if (status === 200) {
            notificationCount.value = data.count;
        } else {
            notificationCount.value = 0;
        }
    }

    function resetChangePasswordModel(closeModal?: TVoidAction) {
        if (closeModal) {
            showChangePasswordModal.value = false;
            popupModalStore.hide("changePasswordModal");
            closeModal();
        }
        changePasswordModel.value = { ...getDefaultChangePasswordFormModel() };
        changeErrorPasswordModel.value = { ...getDefaultChangePasswordErrorModel() };
    }

    function handleChangePassword() {
        showChangePasswordModal.value = true;
        popupModalStore.show("changePasswordModal");
        isProfileHovered.value = false;
    }

    function validateAll() {
        if (!changePasswordModel.value.oldPassword)
            changeErrorPasswordModel.value.oldPassword = "Please enter a password";
        else changeErrorPasswordModel.value.oldPassword = "";
        if (!changePasswordModel.value.newPassword)
            changeErrorPasswordModel.value.newPassword = "Please enter a password";
        else if (changePasswordModel.value.newPassword === changePasswordModel.value.oldPassword)
            changeErrorPasswordModel.value.newPassword = "Please enter a new password";
        else changeErrorPasswordModel.value.newPassword = "";
        if (!changePasswordModel.value.confirmPassword)
            changeErrorPasswordModel.value.confirmPassword = "Please enter a password";
        else if (
            changePasswordModel.value.confirmPassword !== changePasswordModel.value.newPassword
        )
            changeErrorPasswordModel.value.confirmPassword = "Password does not match";
        else changeErrorPasswordModel.value.confirmPassword = "";
    }

    async function handleChangePasswordSubmit(closeModal?: TVoidAction) {
        validateAll();
        if (!checkIfModelHasErrors(changeErrorPasswordModel.value, ["id"])) {
            loading.value.form = true;
            const oldPassword = encodeData(changePasswordModel.value.oldPassword);
            const newPassword = encodeData(changePasswordModel.value.newPassword);
            const confirmPassword = encodeData(changePasswordModel.value.confirmPassword);
            const { status, message } = await changeNewPasswordUserAPI({
                id: 0,
                oldPassword,
                newPassword,
                confirmPassword,
                encodedId: "",
            });
            if (status === 200) {
                toastStore.success({
                    title: "Success",
                    message,
                });
                await userStore.logout("portal");
                resetChangePasswordModel(closeModal);
            } else if (status !== 401) {
                resetChangePasswordModel();
                toastStore.error({
                    title: "Error",
                    message,
                });
            }
            loading.value.form = false;
        }
    }

    async function studyLatestReleaseVersionDetailsyTrialAndEnvironmentId() {
        loading.value.dynamicLoading["version"] = true;
        const { status, data } = await studyLatestReleaseVersionDetailsyTrialAndEnvironmentIdAPI({
            trialId: Number(studyStore.studyInformation.trialId),
            environmentId: Number(studyStore.studyInformation.environmentId),
        });
        if (status === 200 && data) {
            // latestReleaseVersionId.value = data.releaseVersionId;
            studyStore.studyInformation.latestReleaseVersionId = data.releaseVersionId;
        } else if (status !== 401) {
            // latestReleaseVersionId.value = null;
            studyStore.studyInformation.latestReleaseVersionId = null;
        }
        studyStore.storeInLocalStorage();
        loading.value.dynamicLoading["version"] = false;
    }

    function handleSideMenuClick(event: MouseEvent, path: string) {
        toggle(false);
        if (event.metaKey) {
            window.open(`${appBaseURL()}${path}`, "_blank");
        }
    }

    watch(
        () => studyStore.triggerModel,
        async (newValue) => {
            if (newValue) {
                triggerModel();
            } else {
                await redirectToDashboard();
            }
        },
    );
    watch(
        () => menuExpanded.value,
        (newValue) => {
            globalStore.sideMenuExpanded = newValue;
        },
    );

    onMounted(() => {
        loading.value.setDynamicLoading(["version"]);
        Promise.all([studyStore.getTrialEnvironmentDetails(), rolePermissionsList()]);
        if (
            !popupModalStore.modalDetailsById("studyInformationModal") &&
            studyStore.studyInformation.trialId &&
            studyStore.studyInformation.environmentId
        ) {
            Promise.all([
                studyLatestReleaseVersionDetailsyTrialAndEnvironmentId(),
                taskNotificationCount(),
            ]);
            // triggerMenuChange();
        }
        // if (!studyStore.isStudySelected()) {
        //     popupModalStore.show("studyInformationModal");
        // }
    });
</script>

<template>
    <section class="flex flex-row w-screen">
        <!-- class="fixed top-0 left-0 z-[1000] transition-all h-screen box-shadow flex flex-col gap-[2rem] w-fit white-bg" -->
        <!-- w-[27rem] -->
        <!-- :class="[menuExpanded ? 'fixed left-0 top-0 z-[2000] w-[27rem]' : 'w-[6rem]']" -->
        <aside
            class="aside-menu min-h-screen box-shadow-sidebar flex flex-col justify-between gap-[2rem] sidebar-expand white-bg overflow-x-hidden"
            :class="[menuExpanded ? 'fixed left-0 top-0 z-[2000] w-[27rem]' : 'w-[6rem]']"
        >
            <div class="flex flex-col gap-[2rem] relative">
                <!-- <div class="flex flex-row justify-between min-w-[6rem] overflow-x-hidden">
                <edc-pressable
                        container-class="secondary-bg-hover w-[6rem] h-[6rem] flex-1"
                        @click="toggle()"
                    >
                        <img
                            :src="getImageSource(IconKeys.HamburgerMenu, 'icon')"
                            :alt="getAltTagTitle('Hamburger menu')"
                            class="h-[1.8rem] fill-black"
                        />
                    </edc-pressable>
                    <img
                        v-if="menuExpanded"
                        :src="getImageSource(IconKeys.AppLogo, 'icon')"
                        :alt="getAltTagTitle('App logo')"
                        class="h-[4.5rem] fill-black"
                    />
                </div> -->
                <img
                    v-if="menuExpanded"
                    :src="getImageSource(IconKeys.AppLogo, 'icon')"
                    :alt="getAltTagTitle('App logo')"
                    class="h-[4.5rem] fill-black absolute right-[6rem] top-[1rem]"
                />
                <edc-pressable
                    container-class="secondary-bg-hover !hover:opacity-100 max-w-[6rem] h-[6rem]"
                    :on-click="() => toggle()"
                >
                    <img
                        :src="getImageSource(IconKeys.HamburgerMenu, 'icon')"
                        :alt="getAltTagTitle('Hamburger menu')"
                        class="h-[1.8rem] fill-black"
                    />
                </edc-pressable>
                <ul
                    class="flex flex-col items gap-[2rem]"
                    :class="[menuExpanded ? 'items-start px-[2rem]' : 'items-center']"
                >
                    <li
                        v-for="menuRow of menus"
                        ref="menuRef"
                        :key="menuRow.id"
                        class="transition-all"
                    >
                        <template v-if="studyStore.loading.pageDetails">
                            <edc-skeleton-loader
                                :container-class="`${menuExpanded ? 'w-[20rem] h-[3rem]' : 'w-[3rem] h-[3rem]'}`"
                                loader-type="rectangle"
                            />
                        </template>
                        <template v-else>
                            <NuxtLink
                                :to="
                                    getRouteNavigationData({
                                        path: menuRow.routeDetails.path,
                                    })
                                "
                                class="transition-all cursor-pointer flex flex-row items-center font-16 gap-[2rem] min-w-max group"
                                @click.prevent="
                                    (event) => {
                                        handleSideMenuClick(event, menuRow.routeDetails.path);
                                    }
                                "
                            >
                                <!-- <img
                                    :src="getImageSource(menuRow.icon, 'icon')"
                                    :alt="getAltTagTitle(menuRow.label)"
                                    class="h-[2rem]"
                                /> -->
                                <edc-icon
                                    v-tooltip.right="!menuExpanded && menuRow.label"
                                    :icon="menuRow.icon"
                                    :class="`
                                        ${
                                            menuRow.label === 'Discrepancy Management'
                                                ? '!w-[3.2rem] !h-[3.2rem]'
                                                : menuRow.label === 'Dashboard'
                                                  ? '!w-[2.2rem] !h-[2.2rem]'
                                                  : '!w-[2.5rem] !h-[2.5rem]'
                                        } ${menuRow.label === 'Dashboard' ? 'stroke-[--color-tab-header] group-hover:stroke-[var(--color-secondary)]' : 'fill-[--color-tab-header] group-hover:fill-[var(--color-secondary)]'} ${menuRow.label === 'My Tasks' ? '-ml-[0.3rem]' : menuRow.label === 'Discrepancy Management' && !menuExpanded ? 'ml-[0.3rem]' : menuRow.label === 'Discrepancy Management' && menuExpanded ? '-ml-[0.3rem]' : ''}`"
                                />
                                <span
                                    v-if="menuExpanded"
                                    class="text-[--color-tab-header] font-1 group-hover:text-[var(--color-secondary)]"
                                    :class="[
                                        menuExpanded && menuRow.label === 'Discrepancy Management'
                                            ? '-ml-[0.5rem]'
                                            : menuExpanded &&
                                                ['Dashboard', 'My Tasks'].includes(menuRow.label)
                                              ? 'ml-[0.2rem]'
                                              : '-ml-[0.1rem]',
                                    ]"
                                    >{{ menuRow.label }}</span
                                >
                            </NuxtLink>
                        </template>
                    </li>
                </ul>
            </div>
            <div
                class="flex flex-col flex-wrap mb-[2rem] px-[1rem] gap-[1rem]"
                :class="[menuExpanded ? 'self-start' : 'self-center']"
            >
                <div
                    v-tooltip.right="
                        !menuExpanded && !studyStore.loading.pageDetails && 'CRF Version'
                    "
                    class="flex flex-row items-center gap-[0.5rem]"
                >
                    <template
                        v-if="studyStore.loading.pageDetails || loading.dynamicLoading['version']"
                    >
                        <edc-skeleton-loader
                            :container-class="`${menuExpanded ? 'w-[5rem] h-[1rem]' : 'w-[2rem] h-[1rem]'}`"
                            loader-type="rectangle"
                        />
                        <edc-skeleton-loader
                            :container-class="`${menuExpanded ? 'w-[5rem] h-[1rem]' : 'w-[2rem] h-[1rem]'}`"
                            loader-type="rectangle"
                        />
                    </template>
                    <template v-else>
                        <span class="font-normal font-12 gray-text portal-meta-details">{{
                            versionLabel
                        }}</span>
                        <span class="font-bold font-12 gray-text">{{
                            studyStore.studyInformation.latestReleaseVersionId
                                ? padCharactersToString(
                                      studyStore.studyInformation.latestReleaseVersionId,
                                      "start",
                                  )
                                : "-"
                        }}</span>
                    </template>
                </div>
                <div
                    v-tooltip.right="!menuExpanded && !studyStore.loading.pageDetails && 'Build'"
                    class="flex flex-row items-center gap-[0.5rem]"
                >
                    <template v-if="studyStore.loading.pageDetails">
                        <edc-skeleton-loader
                            :container-class="`${menuExpanded ? 'w-[5rem] h-[1rem]' : 'w-[2rem] h-[1rem]'}`"
                            loader-type="rectangle"
                        />
                        <edc-skeleton-loader
                            :container-class="`${menuExpanded ? 'w-[5rem] h-[1rem]' : 'w-[2rem] h-[1rem]'}`"
                            loader-type="rectangle"
                        />
                    </template>
                    <template v-else>
                        <span class="font-normal font-12 gray-text portal-meta-details">{{
                            buildLabel
                        }}</span>
                        <span class="font-bold font-12 gray-text">{{
                            globalStore.appVersion.portal || "-"
                        }}</span>
                    </template>
                </div>
                <!-- <div class="flex flex-row items-center gap-[0.5rem]">
                    <span class="font-normal font-12 gray-text portal-meta-details">{{
                        environmentLabel
                    }}</span>
                    <span class="font-bold uppercase font-12 gray-text">{{
                        getEmptyValue(studyStore.environmentName)
                    }}</span>
                </div> -->
                <edc-pressable
                    :container-class="`w-fit ${studyStore.loading.pageDetails ? 'pointer-events-none' : ''}`"
                    slot-wrapper-class="flex flex-row items-center gap-[0.5rem]"
                    :on-click="
                        () => {
                            processTriggerModel();
                        }
                    "
                >
                    <template v-if="studyStore.loading.pageDetails">
                        <edc-skeleton-loader
                            :container-class="`${menuExpanded ? 'w-[5rem] h-[1rem]' : 'w-[2rem] h-[1rem]'}`"
                            loader-type="rectangle"
                        />
                        <edc-skeleton-loader
                            :container-class="`${menuExpanded ? 'w-[5rem] h-[1rem]' : 'w-[2rem] h-[1rem]'}`"
                            loader-type="rectangle"
                        />
                    </template>
                    <div
                        v-else
                        v-tooltip.right="
                            !menuExpanded && !studyStore.loading.pageDetails && 'Environment'
                        "
                        class="flex flex-row items-center gap-[0.5rem]"
                    >
                        <span class="font-normal font-12 gray-text portal-meta-details">{{
                            environmentLabel
                        }}</span>
                        <span class="font-bold uppercase font-12 gray-text">{{
                            getEmptyValue(studyStore.environmentName)
                        }}</span>
                    </div>
                </edc-pressable>
            </div>
        </aside>
        <!-- :class="[menuExpanded ? 'min-h-screen lg:w-full' : 'lg:w-[95%] min-[1200px]:w-full']" -->
        <div class="flex flex-col gap-[1rem] px-[2rem] gray-bg w-full min-h-screen overflow-hidden">
            <header
                class="flex flex-row items-center justify-between py-[0.2rem] md:mt-[1rem] lg:mt-[0.8rem]"
            >
                <edc-pressable
                    :container-class="`w-fit ${studyStore.loading.pageDetails ? 'pointer-events-none' : ''}`"
                    slot-wrapper-class="flex flex-col"
                    :on-click="
                        () => {
                            processTriggerModel();
                        }
                    "
                >
                    <h2
                        v-if="studyStore.loading.pageDetails"
                        class="font-bold dashboard-heading-alt"
                    >
                        <edc-skeleton-loader
                            container-class="w-[10rem] h-[2.4rem]"
                            loader-type="rectangle"
                        />
                    </h2>
                    <h2 v-else class="font-bold dashboard-heading-alt">
                        <!-- {{ globalStore.headerTitle }} -->
                        {{ headerTitle }}
                    </h2>
                    <!-- <span class="text-[0.8rem] gray-text">Feb 26, 2024</span> -->
                </edc-pressable>
                <div class="flex flex-row gap-[2rem]">
                    <!-- <div class="flex flex-col text-right">
                        <span class="font-bold font-14">Venkatesh A</span>
                        <span class="font-bold font-12 secondary-text">Data Entry Operator</span>
                        <NuxtLink class="underline font-10 gray-text">Change Password</NuxtLink>
                    </div> -->
                    <div class="flex flex-row items-center gap-[1.5rem]">
                        <!-- FIXME: need to remove it before deployment -->
                        <!-- <edc-pressable
                            :on-click="
                                () => {
                                    const authDetails = getFromLocalStorage(TLocalStorageKeys.auth);
                                    if (authDetails) {
                                        copy((decodeData(authDetails) as IAuth).token);
                                    }
                                }
                            "
                        >
                            <span class="font-12">Copy Token</span>
                        </edc-pressable> -->
                        <div ref="profileIcon" class="relative">
                            <edc-icon
                                icon="profile"
                                class="h-[1.5rem] lg:h-[1.7rem]"
                                @click="
                                    () => {
                                        isProfileHovered = !isProfileHovered;
                                    }
                                "
                            />
                            <edc-transition-visibility>
                                <div
                                    v-if="isProfileHovered"
                                    class="absolute top-0 right-0 z-[500] min-w-[18rem] white-bg box-shadow-mild rounded-[var(--border-radius-6)]"
                                >
                                    <div class="flex flex-col text-right px-[2rem] py-[2rem]">
                                        <span class="font-bold font-14">{{
                                            getEmptyValue(userDetails.name)
                                        }}</span>
                                        <span class="font-bold font-12 secondary-text">{{
                                            getEmptyValue(userDetails.role)
                                        }}</span>
                                        <span class="font-normal font-10 black-text">{{
                                            userDetails.lastLoginTime
                                                ? formatDate(
                                                      userDetails.lastLoginTime,
                                                      "DD MMM YYYY HH:mm:ss A",
                                                  )
                                                : "-"
                                        }}</span>
                                        <!-- <NuxtLink class="underline font-10 gray-text"
                                            >Change Password</NuxtLink
                                        > -->
                                        <edc-pressable
                                            container-class="self-end underline font-10 gray-text w-fit"
                                            :on-click="
                                                () => {
                                                    handleChangePassword();
                                                }
                                            "
                                        >
                                            Change Password
                                        </edc-pressable>
                                    </div>
                                </div>
                            </edc-transition-visibility>
                        </div>
                        <!-- <img
                            :src="getImageSource(IconKeys.Mail, 'icon')"
                            :alt="getAltTagTitle('Mail')"
                            class="h-[1.5rem] lg:h-[1.7rem]"
                        /> -->
                        <edc-pressable
                            container-class="relative"
                            :on-click="
                                async () => {
                                    await navigateTo({ path: PortalPath.MyTasks });
                                }
                            "
                        >
                            <div
                                v-if="notificationCount > 0"
                                v-tooltip="
                                    notificationCount > 0 &&
                                    `You have ${notificationCount} new notification${notificationCount > 1 ? 's' : ''}`
                                "
                                class="absolute -top-[1rem] right-0 z-10 w-[1.2rem] h-[1.2rem] flex flex-row items-center justify-center rounded-full bg-[var(--color-warning)]"
                            >
                                <!-- <span class="text-[1rem] font-bold white-text">{{
                                    notificationCount
                                }}</span> -->
                            </div>
                            <img
                                v-tooltip="
                                    notificationCount > 0 &&
                                    `You have ${notificationCount} new notification${notificationCount > 1 ? 's' : ''}`
                                "
                                :src="getImageSource(IconKeys.Bell, 'icon')"
                                :alt="getAltTagTitle('Bell')"
                                class="h-[1.5rem] lg:h-[1.7rem]"
                            />
                        </edc-pressable>
                        <edc-pressable
                            :disable-loader="true"
                            :on-click="
                                async () => {
                                    await userStore.logout('portal');
                                }
                            "
                        >
                            <img
                                v-tooltip="'Logout'"
                                :src="getImageSource(IconKeys.Logout, 'icon')"
                                :alt="getAltTagTitle('Logout')"
                                class="h-[1.5rem] lg:h-[1.7rem]"
                            />
                        </edc-pressable>
                    </div>
                </div>
            </header>
            <hr class="bg-[var(--color-gray-line)]" />
            <!-- <div class="w-[50%]"> -->
            <slot />
            <!-- </div> -->
        </div>
    </section>
    <!-- <section></section> -->
    <edc-popup-modal
        modal-id="studyInformationModal"
        :on-submit="
            async (closeModal) => {
                await handleSubmit(closeModal);
            }
        "
        :on-cancel="
            async (closeModal) => {
                studyStore.studyInformation.trialId = studyStore.studyInformationRef.trialId;
                studyStore.studyInformation.environmentId =
                    studyStore.studyInformationRef.environmentId;
                studyStore.studyInformation.studyId = studyStore.studyInformationRef.studyId;
                // triggerMenuChange();
                await resetStudyModal(closeModal);
            }
        "
    >
        <div class="flex flex-col items-start gap-[2rem]">
            <h2 class="font-variety-black font-20">Details of Environment & Trials</h2>
            <edc-dropdown
                key="trial"
                v-model="studyStore.studyInformation.trialId"
                container-class="w-[34rem]"
                label="Trials"
                :options="studyStore.trialLookups"
                default-value="Choose Trials"
                option-placement="bottom"
                option-class="w-[34rem]"
                :loading="studyStore.loading.trialList"
                :disabled="studyStore.loading.trialList"
                :error="studyStore.studyInformationError.trialId"
                :ellipse-count="50"
                @on-select="
                    () => {
                        studyStore.processEnvironmentDetails();
                    }
                "
            />
            <edc-dropdown
                key="environment"
                v-model="studyStore.studyInformation.environmentId"
                container-class="w-[34rem]"
                label="Environment"
                option-placement="bottom"
                option-class="min-w-[34rem] max-w-[34rem]"
                :options="studyStore.environmentLookups"
                :loading="studyStore.loading.environmentList"
                :disabled="studyStore.loading.environmentList"
                default-value="Choose Environment"
                :error="studyStore.studyInformationError.environmentId"
                :ellipse-count="50"
            />
        </div>
    </edc-popup-modal>
    <edc-popup-modal
        v-if="showChangePasswordModal"
        modal-id="changePasswordModal"
        :on-submit="
            async (closeModal) => {
                await handleChangePasswordSubmit(closeModal);
            }
        "
        :on-cancel="
            (closeModal) => {
                resetChangePasswordModel(closeModal);
            }
        "
    >
        <div class="flex flex-col items-start gap-[2rem]">
            <h2 class="font-variety-black font-20">Change Password</h2>
            <edc-text-input
                v-model="changePasswordModel.oldPassword"
                type="password"
                container-class="w-[34rem]"
                label="Old Password"
                placeholder="Enter old password"
                :disabled="loading.isDisabled()"
                :error="changeErrorPasswordModel.oldPassword"
                :ellipse-count="50"
            />
            <edc-text-input
                v-model="changePasswordModel.newPassword"
                type="password"
                container-class="w-[34rem]"
                label="New Password"
                placeholder="Enter new password"
                :disabled="loading.isDisabled()"
                :error="changeErrorPasswordModel.newPassword"
                :ellipse-count="50"
            />
            <edc-text-input
                v-model="changePasswordModel.confirmPassword"
                type="password"
                container-class="w-[34rem]"
                label="Confirm Password"
                placeholder="Enter confirm password"
                :disabled="loading.isDisabled()"
                :error="changeErrorPasswordModel.confirmPassword"
                :ellipse-count="50"
            />
        </div>
    </edc-popup-modal>
</template>

<style scoped>
    .sidebar-expand {
        /* transition-property: all;
        transition-timing-function: cubic-bezier(0.4, 0, 0.2, 1);
        transition-duration: 1s; */
        /* transition: 0.2s ease-out; */
        transition: 0.3s cubic-bezier(0.075, 0.82, 0.165, 1);
    }
</style>
