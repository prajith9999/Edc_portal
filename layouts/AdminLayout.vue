<script setup lang="ts">
    import Loading from "~/services/apis/data/loading";
    import {
        changeNewPasswordUserAPI,
        rolePermissionsListAPI,
    } from "~/services/apis/handlers/portal/user";
    import useGlobalStore from "~/stores/global";
    import usePopupModalStore from "~/stores/popup-modal";
    import useToastStore from "~/stores/toast";
    import useUserStore from "~/stores/user";
    import type { TNullableString, TVoidAction } from "~/types/common";

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

    const userStore = useUserStore();
    const popupModalStore = usePopupModalStore();
    const profileIcon = ref();
    const toastStore = useToastStore();
    const globalStore = useGlobalStore();
    const isProfileHovered = useElementHover(profileIcon);

    const changePasswordModel = ref<IChangePasswordFormModel>({
        ...getDefaultChangePasswordFormModel(),
    });
    const changeErrorPasswordModel = ref<IChangePasswordErrorModel>({
        ...getDefaultChangePasswordErrorModel(),
    });
    const showChangePasswordModal = ref<boolean>(false);
    const loading = ref<Loading>(new Loading());

    const userDetails = computed(() => {
        return userStore.getDetails();
    });

    // const { copy } = useClipboard();

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
                await userStore.logout("admin");
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

    watch(
        () => userStore.adminCheckPermissionDetails,
        async (newValue) => {
            if (newValue.isRolePermissions && newValue.isUserDetails) {
                if (!checkIfUserIsAllowedToAccessAdminModule()) {
                    await redirectToDashboardDueToNoPermission();
                }
                userStore.adminCheckPermissionDetails.isRolePermissions = false;
                userStore.adminCheckPermissionDetails.isUserDetails = false;
            }
        },
        { deep: true },
    );

    onMounted(async () => {
        await rolePermissionsList();
        userStore.adminCheckPermissionDetails.isRolePermissions = true;
        // Promise.all([rolePermissionsList()]);
        // .then(async () => {
        //     console.log(
        //         "useUserStore().getDetails() in onMounted checking permissions",
        //         useUserStore().getDetails(),
        //     );
        //     if (!checkIfUserIsAllowedToAccessAdminModule()) {
        //         await redirectToDashboardDueToNoPermission();
        //     }
        // });
    });
</script>

<template>
    <section class="flex flex-col w-screen h-screen overflow-x-hidden overflow-y-hidden">
        <header class="flex flex-row items-center justify-between py-[0.2rem] px-[0.5rem]">
            <div class="flex flex-col">
                <img
                    :src="getImageSource(IconKeys.AppLogo, 'icon')"
                    :alt="getAltTagTitle('App logo')"
                    class="h-[4.5rem] fill-black"
                />
            </div>
            <div class="flex flex-row gap-[2rem]">
                <div class="flex flex-row items-center gap-[1.5rem]">
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
                    <!-- <img
                        :src="getImageSource(IconKeys.Bell, 'icon')"
                        :alt="getAltTagTitle('Bell')"
                        class="h-[1.5rem] lg:h-[1.7rem]"
                    /> -->
                    <edc-pressable
                        :disable-loader="true"
                        :on-click="
                            async () => {
                                await userStore.logout('admin');
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
        <div class="flex-1 min-h-[80%]">
            <slot />
        </div>
        <footer
            class="flex flex-row items-center justify-between box-shadow-footer py-[1rem] px-[0.5rem]"
        >
            <div class="flex flex-row items-center gap-[1rem]">
                <div class="flex flex-row items-center gap-[0.5rem]">
                    <span class="font-normal font-12 gray-text portal-meta-details">Build</span>
                    <span class="font-bold font-12 gray-text">{{
                        globalStore.appVersion.admin || "-"
                    }}</span>
                </div>
                <div class="flex flex-row items-center gap-[0.5rem]"></div>
            </div>
            <div class="flex flex-row items-center">
                <span class="policy-link black-text"
                    >Copyrights © 2024.
                    <a
                        href="https://www.vhypotenuse.com"
                        target="_blank"
                        referrerpolicy="no-referrer"
                        class="transition-all black-text hover:opacity-70"
                        >VHypotenuse</a
                    >
                    |
                    <NuxtLink to="" class="transition-all black-text hover:opacity-70"
                        >Privacy Policy</NuxtLink
                    >
                </span>
            </div>
        </footer>
    </section>
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

<style scoped></style>
