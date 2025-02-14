<script setup lang="ts">
    import EdcAccordion from "./components/EdcAccordion.vue";
import { refreshTokenAPI } from "./services/apis/handlers/portal/user";
    import useGlobalStore from "./stores/global";
    import usePopupModalStore from "./stores/popup-modal";
    import useSideBarStore from "./stores/side-bar";
    import useUserStore, { type IAuth } from "./stores/user";

    const route = useRoute();
    const sideBarStore = useSideBarStore();
    const popupModalStore = usePopupModalStore();
    const userStore = useUserStore();
    const globalStore = useGlobalStore();

    const { pause, resume } = useIntervalFn(async () => {
        await isRefreshToken();
    }, 1000);

    const pagesContainer = computed(() => ({
        "w-screen h-screen overflow-x-hidden": ["/", "/login", "/admin/login"].includes(route.path),
    }));

    function stopBodyScroll(enableScroll: boolean) {
        if (enableScroll) {
            document.body.style.overflowY = "hidden";
        } else {
            document.body.style.overflowY = "unset";
        }
    }

    async function refreshToken(authTokenDetails: IAuth) {
        let result = false;
        const { status, data } = await refreshTokenAPI({
            token: authTokenDetails.token,
        });
        if (status === 200) {
            const authDetails: IAuth = {
                token: data?.token || "",
                tokenType: data?.tokenType || "",
                expiry: data?.expiry || "",
            };
            userStore.setAuthDetails(deepClone(authDetails) as IAuth);
            setToLocalStorage(TLocalStorageKeys.auth, encodeData(authDetails));
            result = true;
        }
        return result;
    }

    async function isRefreshToken() {
        pause();
        const authTokenDetails = userStore.getAuthDetails();
        const tokenExpiry = `${formatDate(authTokenDetails.expiry, "YYYY-MM-DD HH:mm")}:00`;
        const dateNow = `${formatDate(currentDate(), "YYYY-MM-DD HH:mm", false)}:00`;
        const dateDifferenceResult = Math.abs(dateDifference(tokenExpiry, dateNow, "minutes"));
        let isResumeCheck = true;
        if (dateDifferenceResult <= 3) {
            isResumeCheck = await refreshToken(authTokenDetails);
        }
        if (isResumeCheck) {
            resume();
        }
    }

    watch(
        () => sideBarStore.showBar,
        (newValue) => {
            stopBodyScroll(newValue);
        },
    );
    watch(
        () => popupModalStore.isModalOpened,
        (newValue) => {
            stopBodyScroll(newValue);
        },
    );

    watch(
        () => globalStore.checkRefreshTokenCondition,
        (newCheckRefreshTokenCondition) => {
            if (newCheckRefreshTokenCondition) resume();
            else pause();
        },
    );

    onMounted(() => {
        const authTokenDetails = userStore.getAuthDetails();
        if (authTokenDetails.token) globalStore.checkRefreshTokenCondition = true;
        else {
            globalStore.checkRefreshTokenCondition = false;
            pause();
        }
    });
</script>

<template>
    <EdcAccordion/>
    <!-- <edc-page-progress /> -->
    <!-- <edc-toast title="Test" message="Testing toast" /> -->
    <!-- <Transition name="toast"> -->
    <!-- <edc-toast v-if="toastStore.id" /> -->
    <edc-toast />
    <edc-code-update />
    <edc-inactivity-alert />
    <!-- </Transition> -->
    <!-- <NuxtLoadingIndicator color="var(--color-primary)" :throttle="0" /> -->
    <NuxtLoadingIndicator color="#0ea5e9" :height="5" :throttle="0" />
    <NuxtLayout>
        <div v-if="getAppType() !== 'admin'" :class="pagesContainer">
            <!-- <main class="w-screen h-screen overflow-x-hidden"> -->
            <NuxtPage />
        </div>
        <NuxtPage v-else />
        <!-- </main> -->
    </NuxtLayout>
</template>

<style>
    .toast-enter,
    .toast-leave-to {
        transform: translateX(100%);
        opacity: 0;
    }

    .toast-leave,
    .toast-enter-to {
        opacity: 1;
    }

    .toast-enter-active,
    .toast-leave-active {
        transition: 0.25s ease all;
    }
    /* .toast-enter-active,
    .toast-leave-active {
        transition: opacity 10s ease;
    }

    .toast-enter-from,
    .toast-leave-to {
        opacity: 0;
    } */
</style>
