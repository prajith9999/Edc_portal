<script setup lang="ts">
    import { type TNullableString } from "~/types/common";
    import useToastStore from "~/stores/toast";
    import { loginAPI } from "~/services/apis/handlers/portal/user";
    import useUserStore from "~/stores/user";
    import useGlobalStore from "~/stores/global";

    useHead({
        title: seoPageTitle("Login"),
    });

    const toastStore = useToastStore();
    const userStore = useUserStore();
    const globalStore = useGlobalStore();

    interface IFormModel {
        userName: TNullableString;
        password: TNullableString;
        enterpriseName: TNullableString;
    }
    const formModel = ref<IFormModel>({
        userName: null,
        password: null,
        enterpriseName: null,
    });
    const errorModel = ref<IFormModel>({
        userName: null,
        password: null,
        enterpriseName: null,
    });

    const loading = ref<boolean>(false);

    function validateForm() {
        if (
            getStringLength(formModel.value.userName) === 0
            // || !checkEmail(formModel.value.userName)
        ) {
            errorModel.value.userName = "Please enter a valid username";
        } else {
            errorModel.value.userName = "";
        }
        if (getStringLength(formModel.value.password) === 0) {
            errorModel.value.password = "Please enter a valid password";
        } else {
            errorModel.value.password = "";
        }
        if (getStringLength(formModel.value.enterpriseName) === 0) {
            errorModel.value.enterpriseName = "Please enter a valid enterprise";
        } else {
            errorModel.value.enterpriseName = "";
        }
        return !errorModel.value.userName && !errorModel.value.password;
    }

    async function handleLogin() {
        // reloadNuxtApp();
        const validationResult = validateForm();
        if (validationResult) {
            loading.value = true;
            formModel.value.password = encodeData(String(formModel.value.password));
            const { data, status, message } = await loginAPI({
                enterpriseName: encodeData(String(formModel.value.enterpriseName)),
                username: encodeData(String(formModel.value.userName)),
                password: formModel.value.password,
            });
            if (status === 200) {
                toastStore.success({
                    title: "Success",
                    message,
                });
                const authDetails: IAuth = {
                    token: data?.token || "",
                    tokenType: data?.tokenType || "",
                    expiry: data?.expiry || "",
                };
                userStore.userDetails.enterpriseName = String(formModel.value.enterpriseName);
                userStore.setAuthDetails(deepClone(authDetails) as IAuth);
                setToLocalStorage(TLocalStorageKeys.auth, encodeData(authDetails));
                await navigateTo(
                    getRouteNavigationData({
                        path: PortalPath.Dashboard,
                    }),
                );
                globalStore.checkRefreshTokenCondition = true;
                formModel.value.userName = null;
                formModel.value.password = null;
                formModel.value.enterpriseName = null;

                errorModel.value.userName = "";
                errorModel.value.password = "";
                errorModel.value.enterpriseName = "";
            } else if (status !== 401) {
                formModel.value.password = null;
                toastStore.error({
                    title: "Error",
                    message,
                });
                // if (validationErrors) {

                // }
            }
            loading.value = false;
        } else {
            toastStore.error({
                title: "Error",
                message: "Please enter valid credentials",
            });
        }
    }
</script>

<template>
    <section class="flex flex-row items-stretch w-full min-h-screen">
        <landing-carousel />
        <!-- <section class="w-[35%] h-full flex flex-col items-center justify-center primary-bg"> -->
        <section
            class="form-container relative md:w-[35%] lg:w-[35%] xl:w-[35%] flex flex-col items-center justify-center px-[2rem]"
        >
            <div class="flex flex-col md:gap-[1rem] lg:gap-[2rem] md:w-[90%] lg:w-[85%] xl:w-[85%]">
                <div>
                    <!-- text-24 -->
                    <h2 class="font-variety-black dashboard-heading white-text">Hello!</h2>
                    <!-- text-16 -->
                    <span class="white-text login-sub-message">Welcome to EDC solution</span>
                </div>
                <div class="flex flex-col md:gap-[1rem] lg:gap-[2rem]">
                    <!-- <edc-text-input
                        v-model="formModel.userName"
                        label="User name"
                        type="text"
                        placeholder="Enter user name"
                        label-class="white-text"
                        :error="errorModel.userName"
                        :disabled="loading"
                        :on-key-up="
                            async () => {
                                await handleLogin();
                            }
                        "
                    /> -->
                    <edc-text-input
                        v-model="formModel.userName"
                        label="User name"
                        type="text"
                        placeholder="Enter user name"
                        label-class="white-text"
                        :error="errorModel.userName"
                        :disable-default-value-setter="true"
                        :disabled="loading"
                        :on-key-up="
                            async () => {
                                await handleLogin();
                            }
                        "
                    />
                    <edc-text-input
                        v-model="formModel.password"
                        label="Password"
                        type="password"
                        placeholder="Enter password"
                        label-class="white-text"
                        :error="errorModel.password"
                        :disable-default-value-setter="true"
                        :disabled="loading"
                        :on-key-up="
                            async () => {
                                await handleLogin();
                            }
                        "
                    />
                    <!-- @on-input="
                            (inputValue) => {
                                formModel.password = inputValue;
                            }
                        " -->
                    <edc-text-input
                        v-model="formModel.enterpriseName"
                        label="Enterprise name"
                        type="text"
                        placeholder="Enter enterprise name"
                        label-class="white-text"
                        :error="errorModel.enterpriseName"
                        :disable-default-value-setter="true"
                        :disabled="loading"
                        :on-key-up="
                            async () => {
                                await handleLogin();
                            }
                        "
                    />
                </div>
                <div class="flex flex-row items-center justify-between md:mt-[1rem] lg:mt-[2rem]">
                    <edc-action-button
                        label="Login"
                        :show-loader="loading"
                        @click="handleLogin()"
                    />
                    <NuxtLink
                        :to="
                            getRouteNavigationData({
                                path: PortalPath.ForgotPassword,
                                query: {
                                    path: encodeData('portal'),
                                },
                            })
                        "
                        class="login-sub-message white-text"
                        :disabled="isElementDisabled(loading)"
                    >
                        Forgot password?
                    </NuxtLink>
                </div>
                <span
                    class="md:top-[8rem] lg:top-[8rem] min-[1440px]:top-[13rem] mx-auto policy-link white-text"
                    >Copyrights © 2024. VH Suite |
                    <NuxtLink to="" class="transition-all white-text hover:opacity-70"
                        >Privacy Policy</NuxtLink
                    >
                </span>
            </div>
            <!-- class="inline-block absolute bottom-0 left-0 m-auto md:text-[1.3rem] lg:text-[1.6rem] gray-text" -->
            <!-- <span class="top-[10rem] mx-auto md:text-[1.3rem] lg:text-[1.6rem] gray-text"
                >Copyrights © 2024. EDC Solution |
                <NuxtLink to="" class="text-white">Privacy Policy</NuxtLink>
            </span> -->
        </section>
    </section>
</template>

<style scoped>
    .form-container {
        background-color: var(--color-primary);
    }
    svg {
        display: inline-block;
        position: absolute;
        top: 0;
        left: 0;
    }
    .half-circle {
        width: 200px;
        height: 100px;
        position: absolute;
        /* left: 50%; */
        /* left: 0; */
        right: 70%;
        top: 50%;
        /* top: -1px; */
        transform: translateX(-50%);
        /* transform: translateY(-50%); */
        transform: rotate(270deg);
        border-bottom: 1px solid orange;
        border-left: 1px solid orange;
        border-right: 1px solid orange;
        border-bottom-left-radius: 100px;
        border-bottom-right-radius: 100px;
        background: #fff;
    }

    @media screen and (min-width: 1024px) {
        .form-container {
            background-image: url("../assets/images/login-background.svg");
            background-position: center;
            background-repeat: no-repeat;
            background-size: cover;
            background-color: transparent;
        }
    }
</style>
