<script setup lang="ts">
    import {
        subjectSiteTransferDetailsByIdAPI,
        updateSubjectSiteTransferRequestAPI,
    } from "~/services/apis/handlers/admin/subject-site-transfer";
    import useStudyStore from "~/stores/study";
    import useToastStore from "~/stores/toast";
    import type { TNullableDate, TNullableNumber, TNullableString } from "~/types/common";

    definePageMeta({
        layout: "portal-layout",
        isAuth: false,
    });

    useHead({
        title: seoPageTitle("Subject Site Transfer Approval"),
    });

    interface IFormModel {
        id: TNullableNumber;
        studyId: TNullableNumber;
        subjectId: TNullableNumber;
        subjectName: string;
        fromSiteId: TNullableNumber;
        fromSiteName: string;
        fromSiteNumber: string;
        toSiteId: TNullableNumber;
        toSiteName: string;
        toSiteNumber: string;
        transferRequestedOn: TNullableDate;
        approvalStatus: TNullableString;
        transferredOn: TNullableDate;
        transferredBy: TNullableNumber;
        transferredByName: TNullableString;
        trialId: number;
        trialName: string;
        environmentId: number;
        environmentName: string;
    }

    const defaultFormModel = (): IFormModel => ({
        id: null,
        studyId: null,
        subjectId: null,
        subjectName: "",
        fromSiteId: null,
        fromSiteName: "",
        fromSiteNumber: "",
        toSiteId: null,
        toSiteName: "",
        toSiteNumber: "",
        transferRequestedOn: null,
        approvalStatus: null,
        transferredOn: null,
        transferredBy: null,
        transferredByName: null,
        environmentId: 0,
        environmentName: "",
        trialId: 0,
        trialName: "",
    });

    const route = useRoute();
    const toastStore = useToastStore();
    const studyStore = useStudyStore();

    const loading = ref<boolean>(false);
    const formModel = ref<IFormModel>({ ...defaultFormModel() });

    async function subjectTransferDetailsById(subjectSiteTransferId: number) {
        const { data, status, message } =
            await subjectSiteTransferDetailsByIdAPI(subjectSiteTransferId);
        if (status === 200) {
            formModel.value.id = data.id;
            formModel.value.subjectId = data.subjectId;
            formModel.value.subjectName = data.subjectName;
            formModel.value.fromSiteId = data.fromSiteId;
            formModel.value.fromSiteName = data.fromSiteName;
            formModel.value.fromSiteNumber = data.fromSiteNumber;
            formModel.value.toSiteId = data.toSiteId;
            formModel.value.toSiteName = data.toSiteName;
            formModel.value.toSiteNumber = data.toSiteNumber;
            formModel.value.approvalStatus = data.approvalStatus;
            formModel.value.transferRequestedOn = data.transferRequestedOn;
            formModel.value.transferredOn = data.transferredOn;
            formModel.value.transferredBy = data.transferredBy;
            formModel.value.transferredByName = data.transferredByName;
            formModel.value.trialId = data.trialId;
            formModel.value.trialName = data.trialName;
            formModel.value.environmentId = data.environmentId;
            formModel.value.environmentName = data.environmentName;
        } else if (status !== 401) {
            formModel.value = { ...defaultFormModel() };
            toastStore.error({
                title: "Error",
                message,
            });
        }
    }

    async function updateSubjectSiteTransferRequest(id: string, action: string) {
        const { status, message, data } = await updateSubjectSiteTransferRequestAPI({
            id,
            action,
        });
        if (status === 200) {
            toastStore.success({
                title: "Success",
                message,
            });
            if (data && data?.id) {
                await subjectTransferDetailsById(data.id);
                if (
                    (data?.subject && message === "Subject Site Transfer is Approved") ||
                    message === "Subject Site Transfer is Rejected"
                ) {
                    setTimeout(() => {
                        const uniqueKey = setEmailTemplate({
                            to: data?.to || "",
                            cc: data?.cc || "",
                            bcc: data?.bcc || "",
                            subject: data?.subject || "",
                            body: data?.body || "",
                            emailDetails: {
                                id: data?.tempId || "",
                                action: data?.action || "",
                                actionDateTime: data?.actionDateTime || "",
                                subjectName: data?.subjectName || "",
                                fromSiteName: data?.fromSiteName || "",
                                toSiteName: data?.toSiteName || "",
                            },
                        });
                        renderEmailTemplate(uniqueKey);
                    }, 1000);
                }
            }
        } else if (status !== 401) {
            toastStore.error({
                title: "Error",
                message,
            });
        }
    }

    onMounted(async () => {
        const { id = "", action = "" } = route.query;
        if (studyStore.loading.pageDetails) studyStore.loading.pageDetails = false;
        loading.value = true;
        if (!id || !action) {
            await redirectToPortalLogin();
        } else if (checkIfUserIsAuthorized()) {
            await updateSubjectSiteTransferRequest(String(id), String(action));
        }
        loading.value = false;
    });

    // onUnmounted(() => {
    //     if (!studyStore.loading.pageDetails) studyStore.loading.pageDetails = true;
    // });
</script>

<template>
    <div class="flex flex-col gap-[1rem] pb-[3rem] h-screen">
        <div
            class="flex flex-row items-center justify-center min-h-full transition-all site-transfer-container"
        >
            <div
                class="flex flex-col box-shadow-mild bg-white rounded-[var(--border-radius-20)] p-[2rem] gap-[1rem] mb-[10rem]"
            >
                <h2 class="font-semibold font-16">Subject Site Transfer Details</h2>
                <div class="flex flex-row items-center gap-[1rem]">
                    <template v-if="loading">
                        <edc-skeleton-loader
                            container-class="w-[50%] h-[1.5rem] my-[1rem]"
                            loader-type="rectangle"
                        />
                        <edc-skeleton-loader
                            container-class="w-[40%] h-[1.5rem] my-[1rem]"
                            loader-type="rectangle"
                        />
                    </template>
                    <template v-else>
                        <span class="font-semibold font-14 w-[15rem]">Study:</span>
                        <span class="font-14 font-regular">{{
                            formModel.trialName && formModel.environmentName
                                ? `${formModel.trialName}:${formModel.environmentName}`
                                : "-"
                        }}</span>
                    </template>
                </div>
                <div class="flex flex-row items-center gap-[1rem]">
                    <template v-if="loading">
                        <edc-skeleton-loader
                            container-class="w-[50%] h-[1.5rem] my-[1rem]"
                            loader-type="rectangle"
                        />
                        <edc-skeleton-loader
                            container-class="w-[40%] h-[1.5rem] my-[1rem]"
                            loader-type="rectangle"
                        />
                    </template>
                    <template v-else>
                        <span class="font-semibold font-14 w-[15rem]">Subject Code:</span>
                        <span class="font-14 font-regular">{{ formModel.subjectName || "-" }}</span>
                    </template>
                </div>
                <div class="flex flex-row items-center gap-[1rem]">
                    <template v-if="loading">
                        <edc-skeleton-loader
                            container-class="w-[50%] h-[1.5rem] my-[1rem]"
                            loader-type="rectangle"
                        />
                        <edc-skeleton-loader
                            container-class="w-[40%] h-[1.5rem] my-[1rem]"
                            loader-type="rectangle"
                        />
                    </template>
                    <template v-else>
                        <span class="font-semibold font-14 w-[15rem]">From Site:</span>
                        <span
                            v-if="formModel.fromSiteName && formModel.fromSiteNumber"
                            class="font-14 font-regular"
                            >{{ formModel.fromSiteName }} ({{ formModel.fromSiteNumber }})</span
                        >
                        <span v-else class="font-14 font-regular">-</span>
                    </template>
                </div>
                <div class="flex flex-row items-center gap-[1rem]">
                    <template v-if="loading">
                        <edc-skeleton-loader
                            container-class="w-[50%] h-[1.5rem] my-[1rem]"
                            loader-type="rectangle"
                        />
                        <edc-skeleton-loader
                            container-class="w-[40%] h-[1.5rem] my-[1rem]"
                            loader-type="rectangle"
                        />
                    </template>
                    <template v-else>
                        <span class="font-semibold font-14 w-[15rem]">To Site:</span>
                        <span
                            v-if="formModel.toSiteName && formModel.toSiteNumber"
                            class="font-14 font-regular"
                            >{{ formModel.toSiteName }} ({{ formModel.toSiteNumber }})</span
                        >
                        <span v-else class="font-14 font-regular">-</span>
                    </template>
                </div>
                <div class="flex flex-row items-center gap-[1rem]">
                    <template v-if="loading">
                        <edc-skeleton-loader
                            container-class="w-[50%] h-[1.5rem] my-[1rem]"
                            loader-type="rectangle"
                        />
                        <edc-skeleton-loader
                            container-class="w-[40%] h-[1.5rem] my-[1rem]"
                            loader-type="rectangle"
                        />
                    </template>
                    <template v-else>
                        <span class="font-semibold font-14 w-[15rem]">Approval Status:</span>
                        <span
                            v-if="formModel.approvalStatus && formModel.approvalStatus"
                            class="font-14 font-regular"
                            >{{ formModel.approvalStatus }}</span
                        >
                        <span v-else class="font-14 font-regular">-</span>
                    </template>
                </div>
                <div class="flex flex-row items-center gap-[1rem]">
                    <template v-if="loading">
                        <edc-skeleton-loader
                            container-class="w-[50%] h-[1.5rem] my-[1rem]"
                            loader-type="rectangle"
                        />
                        <edc-skeleton-loader
                            container-class="w-[40%] h-[1.5rem] my-[1rem]"
                            loader-type="rectangle"
                        />
                    </template>
                    <template v-else>
                        <span class="font-semibold font-14 w-[15rem]">Transfer Details:</span>
                        <span
                            v-if="formModel.transferredByName && formModel.transferredOn"
                            class="font-14 font-regular"
                            >Transferred by
                            {{ capitalizeWord(formModel.transferredByName, true) }} on
                            {{
                                formatDate(formModel.transferredOn, "DD MMM YYYY HH:mm:ss A")
                            }}</span
                        >
                        <span v-else class="font-14 font-regular">-</span>
                    </template>
                </div>
            </div>
        </div>
    </div>
</template>

<style scoped></style>
