<script setup lang="ts">
    import { type TNullableString } from "~/types/common";
    import Loading from "~/services/apis/data/loading";
    import useToastStore from "~/stores/toast";
    import {
        triggerForgotPasswordOTPAPI,
        verifyForgotPasswordOTPAPI,
    } from "~/services/apis/handlers/portal/user";

    useHead({
        title: seoPageTitle("OTP Verification"),
    });

    const route = useRoute();
    const router = useRouter();
    const toastStore = useToastStore();

    const loading = ref<Loading>(new Loading());
    const formModel = ref<{
        otp: TNullableString[];
    }>({
        otp: [],
    });

    const timer = ref<number>(30);

    const errorModel = ref<{
        otp: string;
    }>({
        otp: "",
    });

    const queryDetails = computed(() => route.query);
    const encodedEmail = computed(() => {
        const { id = "" } = queryDetails.value;
        return id as string;
    });
    const encodedResend = computed(() => {
        const { resend = "" } = queryDetails.value;
        return resend as string;
    });
    const decodedResend = computed(
        () => (encodedResend.value ? decodeData(encodedResend.value) : "") as string,
    );
    const encodedPath = computed(() => {
        const { path = "" } = route.query;
        return path as string;
    });

    const { pause } = useIntervalFn(() => {
        if (!encodedResend.value || !isEqual(decodedResend.value, "true", "string")) pause();
        else if (timer.value > 0) timer.value -= 1;
        else pause();
    }, 1000);

    function validateAll() {
        if (
            getArrayLength(formModel.value.otp) === 0 ||
            getArrayLength(formModel.value.otp.filter((row) => row === null)) > 0
        )
            errorModel.value.otp = "Please enter the otp";
        else errorModel.value.otp = "";
    }

    async function handleOTPVerification() {
        validateAll();
        if (!checkIfModelHasErrors(errorModel.value)) {
            loading.value.form = true;
            const { id = "" } = queryDetails.value;
            const finalOTP = formModel.value.otp.filter((row) => row).join("");
            const encodedOTP = encodeData(finalOTP);
            // const decodedEmail = id ? decodeData(String(route.query.id)) : "";
            const { status, message } = await verifyForgotPasswordOTPAPI({
                emailId: id as string,
                otp: encodedOTP,
            });
            if (status === 200) {
                toastStore.success({
                    title: "Success",
                    message,
                });
                await navigateTo(
                    getRouteNavigationData({
                        path: PortalPath.ResetPassword,
                        query: {
                            id,
                            path: encodedPath.value,
                        },
                    }),
                    {
                        replace: true,
                    },
                );
                formModel.value.otp = [];
                errorModel.value.otp = "";
            } else if (status !== 401) {
                toastStore.error({
                    title: "Error",
                    message,
                });
            }
            loading.value.form = false;
        }
    }

    async function handleResendOTP() {
        loading.value.dynamicLoading["resendOtp"] = true;
        formModel.value.otp = [];
        const { id = "" } = queryDetails.value;
        const { status, message, data } = await triggerForgotPasswordOTPAPI({
            emailId: id as string,
            isResend: true,
        });
        if (status === 200) {
            toastStore.success({
                title: "Success",
                message,
            });
            if (data && data?.otp) {
                const uniqueKey = setEmailTemplate({
                    to: data?.to || "",
                    cc: data?.cc || "",
                    bcc: data?.bcc || "",
                    subject: data?.subject || "",
                    body: data?.body || "",
                    emailDetails: {
                        name: data?.name || "",
                        otp: data?.otp,
                    },
                });
                renderEmailTemplate(uniqueKey);
            }
            router.replace({
                path: PortalPath.ForgotPasswordOtp,
                query: {
                    id: encodedEmail.value,
                    resend: encodeData("false"),
                },
            });
        } else if (status !== 401) {
            toastStore.error({
                title: "Error",
                message,
            });
        }
        loading.value.dynamicLoading["resendOtp"] = false;
    }

    onMounted(() => {
        loading.value.setDynamicLoading(["resendOtp"]);
        if (!encodedEmail.value || !encodedResend.value) redirectToPortalLogin();
    });
</script>

<template>
    <section class="flex flex-row items-stretch w-full min-h-screen">
        <landing-carousel />
        <section
            class="form-container relative md:w-[35%] lg:w-[35%] xl:w-[35%] flex flex-col items-center justify-center px-[2rem]"
        >
            <div class="flex flex-col md:gap-[1rem] lg:gap-[2rem] md:w-[90%] lg:w-[85%] xl:w-[85%]">
                <div>
                    <!-- text-24 -->
                    <h2 class="font-variety-black dashboard-heading white-text">
                        OTP Verification
                    </h2>
                </div>
                <div class="flex flex-col md:gap-[1rem] lg:gap-[1rem]">
                    <edc-otp-input
                        v-model="formModel.otp"
                        :digit-length="6"
                        :error="errorModel.otp"
                        :disabled="loading.isDisabled()"
                        :on-key-up="async () => await handleOTPVerification()"
                    />
                    <edc-skeleton-loader
                        v-if="loading.dynamicLoading['resendOtp']"
                        container-class="w-[6.67rem] lg:w-[7.226rem] h-[0.8rem] lg:h-[1rem]"
                    />
                    <!-- <span
                        v-else-if="decodedResend === 'true' && timer > 0"
                        class="white-text text-[1.2rem] lg:text-[1.3rem]"
                        >Resend OTP in 0:{{ padCharactersToString(timer, "start", 2) }}</span
                    > -->
                    <span
                        v-else-if="decodedResend === 'true' && timer <= 0"
                        class="cursor-pointer hover:opacity-70 white-text text-[1.2rem] lg:text-[1.3rem]"
                        @click="handleResendOTP()"
                        >Resend OTP</span
                    >
                </div>
                <div class="flex flex-row items-center justify-between md:mt-[1rem] lg:mt-[2rem]">
                    <edc-action-button
                        label="Submit"
                        :show-loader="loading.form"
                        @click="handleOTPVerification()"
                    />
                </div>
                <span
                    class="md:top-[8rem] lg:top-[8rem] min-[1440px]:top-[13rem] mx-auto policy-link white-text"
                    >Copyrights © 2024. VH Suite |
                    <NuxtLink to="" class="transition-all white-text hover:opacity-70"
                        >Privacy Policy</NuxtLink
                    >
                </span>
            </div>
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
