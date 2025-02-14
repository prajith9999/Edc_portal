<script setup lang="ts">
    import { type TNullableString } from "~/types/common";
    import Loading from "~/services/apis/data/loading";
    import { setNewPasswordUserAPI } from "~/services/apis/handlers/portal/user";
    import useToastStore from "~/stores/toast";

    useHead({
        title: seoPageTitle("Set Password"),
    });

    const route = useRoute();
    const toastStore = useToastStore();

    const loading = ref<Loading>(new Loading());
    const formModel = ref<{
        id: TNullableString;
        newPassword: TNullableString;
        confirmPassword: TNullableString;
    }>({
        id: null,
        newPassword: null,
        confirmPassword: null,
    });

    const errorModel = ref<{
        newPassword: string;
        confirmPassword: string;
    }>({
        newPassword: "",
        confirmPassword: "",
    });

    function validateAll() {
        if (!formModel.value.newPassword) errorModel.value.newPassword = "Please enter a password";
        else errorModel.value.newPassword = "";
        if (!formModel.value.confirmPassword)
            errorModel.value.confirmPassword = "Please enter a password";
        else if (formModel.value.confirmPassword !== formModel.value.newPassword)
            errorModel.value.confirmPassword = "Password does not match";
        else errorModel.value.confirmPassword = "";
    }

    async function handleSetPassword() {
        validateAll();
        if (!checkIfModelHasErrors(errorModel.value, ["id"])) {
            loading.value.form = true;
            formModel.value.newPassword = encodeData(formModel.value.newPassword);
            formModel.value.confirmPassword = encodeData(formModel.value.confirmPassword);
            const { status, message, data } = await setNewPasswordUserAPI({
                id: 0,
                encodedId: formModel.value.id as string,
                newPassword: formModel.value.newPassword,
                confirmPassword: formModel.value.confirmPassword,
            });
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
                            id: data?.id || "",
                            name: data?.name || "",
                        },
                    });
                    renderEmailTemplate(uniqueKey);
                }
                await redirectToPortalLogin();
                formModel.value.id = null;
                formModel.value.newPassword = null;
                formModel.value.confirmPassword = null;

                errorModel.value.newPassword = "";
                errorModel.value.confirmPassword = "";
            } else if (status !== 401) {
                formModel.value.newPassword = null;
                formModel.value.confirmPassword = null;
                toastStore.error({
                    title: "Error",
                    message,
                });
            }
            loading.value.form = false;
        }
    }

    onMounted(async () => {
        const { id = "" } = route.query;
        if (!id) {
            await redirectToPortalLogin();
        } else {
            formModel.value.id = id as string;
        }
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
                        Set New Password
                    </h2>
                </div>
                <div class="flex flex-col md:gap-[1rem] lg:gap-[2rem]">
                    <edc-text-input
                        v-model="formModel.newPassword"
                        label="Password"
                        type="password"
                        placeholder="Enter new password"
                        label-class="white-text"
                        :disabled="loading.isDisabled()"
                        :error="errorModel.newPassword"
                        :on-key-up="
                            async () => {
                                await handleSetPassword();
                            }
                        "
                    />
                    <edc-text-input
                        v-model="formModel.confirmPassword"
                        label="Confirm Password"
                        type="password"
                        placeholder="Enter confirm password"
                        label-class="white-text"
                        :disabled="loading.isDisabled()"
                        :error="errorModel.confirmPassword"
                        :on-key-up="
                            async () => {
                                await handleSetPassword();
                            }
                        "
                    />
                </div>
                <div class="flex flex-row items-center justify-between md:mt-[1rem] lg:mt-[2rem]">
                    <edc-action-button label="Set password" @click="handleSetPassword()" />
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
