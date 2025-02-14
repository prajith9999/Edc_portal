<script setup lang="ts">
    import { ImageKeys } from "~/utils/images-and-icons";
    import { type TNullableString, type TUniqueID } from "~/types/common";
    import useToastStore from "~/stores/toast";
    import { loginAPI } from "~/services/apis/handlers/portal/user";
    import useUserStore, { type IAuth } from "~/stores/user";
    import useGlobalStore from "~/stores/global";

    interface IInfoCarousal {
        id: TUniqueID;
        description: string;
        highlightedWord: string;
        image: string;
    }

    useHead({
        title: seoPageTitle("Login"),
    });

    const userStore = useUserStore();
    const globalStore = useGlobalStore();
    const carousalData = ref<IInfoCarousal[]>([
        {
            id: 1,
            description: `Simplify your workflow with the world’s most intuitive and secure
                        <span class="italic font-bold font-variety-black primary-text">EDC</span>
                        solution`,
            highlightedWord: "EDC",
            image: ImageKeys.LoginIntro,
        },
        // {
        //     id: 2,
        //     description: `Simplify your workflow with the world’s most intuitive and secure
        //                 <span class="italic font-bold font-variety-black primary-text">EDC solution</span>`,
        //     highlightedWord: "EDC",
        //     image: ImageKeys.LoginIntro,
        // },
    ]);

    const carousalDataLength = computed(() => getArrayLength(carousalData.value));

    const { index, next, state } = useCycleList(carousalData.value);

    const carousalContainerRef = ref(null);
    const isHovered = useElementHover(carousalContainerRef);
    const { pause, resume } = useIntervalFn(
        () => {
            next();
        },
        3000,
        {
            immediate: false,
        },
    );
    const toastStore = useToastStore();

    interface IFormModel {
        userName: TNullableString;
        password: TNullableString;
        enterpriseName: TNullableString;
    }
    const formModel = ref<IFormModel>({
        userName: null,
        password: null,
        enterpriseName: "VH",
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
        return !errorModel.value.userName && !errorModel.value.password;
    }

    async function handleLogin() {
        // reloadNuxtApp();
        pause();
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
                userStore.setAuthDetails(deepClone(authDetails) as IAuth);
                setToLocalStorage(TLocalStorageKeys.auth, encodeData(authDetails));
                await navigateTo(
                    getRouteNavigationData({
                        path: AdminPath.Dashboard,
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
                resume();
            }
            loading.value = false;
        } else {
            toastStore.error({
                title: "Error",
                message: "Please enter valid credentials",
            });
            resume();
        }
    }

    watch(
        () => isHovered.value,
        (newValue) => {
            if (carousalDataLength.value > 1) {
                if (newValue) {
                    pause();
                } else {
                    resume();
                }
            }
        },
    );

    onMounted(() => {
        if (carousalDataLength.value > 1) resume();
    });
</script>

<template>
    <section class="flex flex-row items-stretch w-full min-h-screen">
        <section
            class="relative md:w-[65%] lg:w-[65%] xl:w-[65%] flex flex-col justify-center gap-[1rem] px-[5rem] py-[5rem]"
        >
            <!-- <h1 class="font-normal md:text-[2rem] lg:text-[3rem] gray-text w-[47%] ml-[5rem]">
                Simplify your workflow with the world’s most intuitive and secure
                <span class="italic font-bold font-variety-black primary-text">EDC</span>
                solution
            </h1>
            <img
                :src="getImageSource(ImageKeys.LoginIntro)"
                :alt="getAltTagTitle('edc')"
                class="md:h-[30rem] lg:h-[40rem] mx-auto"
            /> -->
            <transition name="login-carousal">
                <div
                    ref="carousalContainerRef"
                    :key="state.id"
                    class="absolute"
                    @touchstart="isHovered = true"
                    @touchend="isHovered = false"
                >
                    <!-- <h1
                        class="font-normal md:text-[2rem] lg:text-[3rem] gray-text w-[47%] ml-[5rem]"
                    >
                        {{ state.description }}
                        <span class="italic font-bold font-variety-black primary-text">{{
                            state.highlightedWord
                        }}</span>
                        solution
                    </h1>
                    <img
                        :src="
                            checkIfImageURL(state.image)
                                ? state.image
                                : getImageSource(state.image as ImageKeys)
                        "
                        :alt="getAltTagTitle(`EDC info ${state.id}`)"
                        class="md:h-[30rem] lg:h-[40rem] mx-auto"
                    /> -->
                    <h1
                        class="font-normal login-portal-description gray-text w-[47%] ml-[5rem]"
                        v-html="state.description"
                    ></h1>
                    <img
                        :src="
                            checkIfImageURL(state.image)
                                ? state.image
                                : getImageSource(state.image as ImageKeys)
                        "
                        :alt="getAltTagTitle(`EDC info ${state.id}`)"
                        class="md:h-[20rem] lg:h-[40rem] mx-auto"
                    />
                </div>
            </transition>
            <div
                v-if="carousalDataLength > 1"
                class="absolute md:bottom-[3rem] lg:bottom-0 left-1/2 -translate-x-1/2 flex flex-row items-center gap-[0.3rem]"
            >
                <div
                    v-for="(row, rowIndex) of carousalData"
                    :key="row.id"
                    class="transition-all w-[1.2rem] h-[1.2rem] rounded-full border-[0.1rem]"
                    :class="[
                        index === rowIndex
                            ? 'bg-[var(--color-primary)] border-transparent'
                            : 'bg-[var(--color-white)] border-[var(--color-primary)]',
                    ]"
                />
            </div>
        </section>
        <!-- <section class="w-[35%] h-full flex flex-col items-center justify-center primary-bg"> -->
        <section
            class="form-container relative md:w-[35%] lg:w-[35%] xl:w-[35%] flex flex-col items-center justify-center px-[2rem]"
        >
            <div class="flex flex-col md:gap-[1rem] lg:gap-[2rem] md:w-[90%] lg:w-[85%] xl:w-[85%]">
                <div>
                    <!-- text-24 -->
                    <h2 class="font-variety-black dashboard-heading white-text">Hello!</h2>
                    <!-- text-16 -->
                    <span class="white-text login-sub-message">Welcome to Admin portal</span>
                </div>
                <div class="flex flex-col md:gap-[1rem] lg:gap-[2rem]">
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
                </div>
                <div class="flex flex-row items-center justify-between md:mt-[1rem] lg:mt-[2rem]">
                    <edc-action-button
                        label="Login"
                        :disabled="loading"
                        :show-loader="loading"
                        @click="handleLogin()"
                    />
                    <NuxtLink
                        :to="
                            getRouteNavigationData({
                                path: PortalPath.ForgotPassword,
                                query: {
                                    path: encodeData('admin'),
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
                    <NuxtLink to="" class="text-white transition-all hover:opacity-70"
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
    .login-carousal-enter-from,
    .login-carousal-leave-to {
        transform: translateX(100%);
        opacity: 0;
    }

    .login-carousal-enter-active,
    .login-carousal-leave-active {
        transition: 2s cubic-bezier(0.075, 0.82, 0.165, 1) all;
    }
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
    /* .form-container {
        width: 35%;
        height: 100%;
    }
    .form-container::before {
        content: "";
        position: absolute;
        top: 0px;
        left: 0px;
        bottom: 0px;
        right: 0px;
        border: 1px solid orange;
    }
    .container::after {
        content: "";
        position: absolute;
        width: 200px;
        height: 200px;
        top: 50%;
        margin-left: -100px;
        top: -100px;
        border-radius: 50%;
        border: 1px solid orange;
        background-color: white;
    } */

    @media screen and (min-width: 1024px) {
        .form-container {
            background-image: url("../../assets/images/login-background.svg");
            background-position: center;
            background-repeat: no-repeat;
            background-size: cover;
            background-color: transparent;
        }
    }
</style>
