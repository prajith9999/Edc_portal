<script setup lang="ts">
    import { userDetailsAPI } from "~/services/apis/handlers/portal/user";
    import useUserStore, { type IUser } from "~/stores/user";

    definePageMeta({
        middleware: ["admin-auth"],
        layout: "admin-layout",
    });

    useHead({
        title: seoPageTitle("Dashboard"),
    });

    const userStore = useUserStore();

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
        userStore.adminCheckPermissionDetails.isUserDetails = true;
    }

    onMounted(() => {
        getUserDetails();
    });
</script>

<template>
    <admin-win-form />
</template>

<style scoped></style>
