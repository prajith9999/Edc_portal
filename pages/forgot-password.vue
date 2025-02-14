<script setup lang="ts">
    import { type TNullableString } from "~/types/common";
    import Loading from "~/services/apis/data/loading";
    import useToastStore from "~/stores/toast";
    import { triggerForgotPasswordOTPAPI } from "~/services/apis/handlers/portal/user";

    useHead({
        title: seoPageTitle("Forgot Password"),
    });

    const route = useRoute();
    const toastStore = useToastStore();

    const loading = ref<Loading>(new Loading());
    const formModel = ref<{
        email: TNullableString;
    }>({
        email: null,
    });

    const errorModel = ref<{
        email: string;
    }>({
        email: "",
    });

    const encodedPath = computed(() => {
        const { path = "" } = route.query;
        return path as string;
    });

    function validateAll() {
        if (!formModel.value.email) errorModel.value.email = "Please enter an email";
        else errorModel.value.email = "";
    }

    async function handleForgotPassword() {
        validateAll();
        if (!checkIfModelHasErrors(errorModel.value)) {
            loading.value.form = true;
            const encodedEmail = encodeData(formModel.value.email);
            const { status, message, data } = await triggerForgotPasswordOTPAPI({
                emailId: encodedEmail,
                isResend: false,
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
                await navigateTo(
                    getRouteNavigationData({
                        path: PortalPath.ForgotPasswordOtp,
                        query: {
                            id: encodedEmail,
                            resend: encodeData("true"),
                            path: encodedPath.value,
                        },
                    }),
                    {
                        replace: true,
                    },
                );
                formModel.value.email = null;
                errorModel.value.email = "";
            } else if (status !== 401) {
                toastStore.error({
                    title: "Error",
                    message,
                });
            }
            loading.value.form = false;
        }
    }
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
                    <h2 class="font-variety-black dashboard-heading white-text">Forgot Password</h2>
                </div>
                <div class="flex flex-col md:gap-[1rem] lg:gap-[2rem]">
                    <edc-text-input
                        v-model="formModel.email"
                        label="Email"
                        type="text"
                        placeholder="Enter email"
                        label-class="white-text"
                        :disabled="loading.isDisabled()"
                        :error="errorModel.email"
                        :on-key-up="
                            async () => {
                                await handleForgotPassword();
                            }
                        "
                    />
                </div>
                <div class="flex flex-row items-center justify-between md:mt-[1rem] lg:mt-[2rem]">
                    <edc-action-button
                        label="Submit"
                        :show-loader="loading.form"
                        @click="handleForgotPassword()"
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
