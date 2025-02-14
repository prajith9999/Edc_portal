<script setup lang="ts">
    import EmailContent from "~/assets/email-content.json";

    const route = useRoute();
    const htmlContent = ref<string>("Invalid email template");

    // async function loadHtmlContent(type: string) {
    //     let url = "";
    //     if (type === "user creation") {
    //         url = "email-template-test.html";
    //     }
    //     if (url) {
    //         const content = await fetch(url);
    //         htmlContent.value = await content.text();
    //     }
    // }

    // onMounted(async () => {
    //     const { type = "" } = route.query;
    //     await loadHtmlContent(String(type));
    // });

    function loadHtmlContent(templateId: string) {
        const emailTemplateInLocalStorage = getEmailTemplatesFromLocalStorage();
        if (emailTemplateInLocalStorage) {
            const emailTemplateDetails = { ...emailTemplateInLocalStorage[templateId] };
            if (emailTemplateDetails.bodyKey === "UserCreation") {
                let bodyDetails = EmailContent.UserCreation.Body;
                bodyDetails = bodyDetails
                    .replace(
                        "<!-- Email details Content here -->",
                        emailMetaDetails({
                            toAddress: emailTemplateDetails.toAddress.join(", "),
                            ccAddress: emailTemplateDetails.ccAddress
                                ? emailTemplateDetails.ccAddress.join(", ")
                                : "",
                            bccAddress: emailTemplateDetails.bccAddress
                                ? emailTemplateDetails.bccAddress.join(", ")
                                : "",
                            subject: emailTemplateDetails.subject,
                        }),
                    )
                    .replace("{{AppURL}}", appBaseURL())
                    .replace("{{Name}}", String(emailTemplateDetails.emailDetails.name))
                    .replace("{{UserId}}", String(emailTemplateDetails.emailDetails.id));
                htmlContent.value = bodyDetails;
            } else if (emailTemplateDetails.bodyKey === "SubjectSiteTransferRequestApproval") {
                let bodyDetails = EmailContent.SubjectSiteTransferRequestApproval.Body;
                bodyDetails = bodyDetails
                    .replace(
                        "<!-- Email details Content here -->",
                        emailMetaDetails({
                            toAddress: emailTemplateDetails.toAddress.join(", "),
                            ccAddress: emailTemplateDetails.ccAddress
                                ? emailTemplateDetails.ccAddress.join(", ")
                                : "",
                            bccAddress: emailTemplateDetails.bccAddress
                                ? emailTemplateDetails.bccAddress.join(", ")
                                : "",
                            subject: emailTemplateDetails.subject,
                        }),
                    )
                    .replace("{{AppURL}}", appBaseURL())
                    .replace("{{Action}}", String(emailTemplateDetails.emailDetails.action))
                    .replace(
                        "{{ActionDateTime}}",
                        formatDate(
                            String(emailTemplateDetails.emailDetails.actionDateTime),
                            "DD MMM YYYY HH:mm:ss A",
                        ),
                    )
                    .replace("{{SubjectId}}", String(emailTemplateDetails.emailDetails.subjectName))
                    .replace(
                        "{{FromSiteName}}",
                        String(emailTemplateDetails.emailDetails.fromSiteName),
                    )
                    .replace("{{ToSiteName}}", String(emailTemplateDetails.emailDetails.toSiteName))
                    .replace(
                        /{{SubjectTransferId}}/g,
                        String(emailTemplateDetails.emailDetails.id),
                    );
                htmlContent.value = bodyDetails;
            } else if (emailTemplateDetails.bodyKey === "SubjectSiteTransferRequestCompletion") {
                let bodyDetails = EmailContent.SubjectSiteTransferRequestCompletion.Body;
                bodyDetails = bodyDetails
                    .replace(
                        "<!-- Email details Content here -->",
                        emailMetaDetails({
                            toAddress: emailTemplateDetails.toAddress.join(", "),
                            ccAddress: emailTemplateDetails.ccAddress
                                ? emailTemplateDetails.ccAddress.join(", ")
                                : "",
                            bccAddress: emailTemplateDetails.bccAddress
                                ? emailTemplateDetails.bccAddress.join(", ")
                                : "",
                            subject: emailTemplateDetails.subject.replace(
                                "{{Action}}",
                                String(emailTemplateDetails.emailDetails.action),
                            ),
                        }),
                    )
                    .replace("{{AppURL}}", appBaseURL())
                    .replace("{{Action}}", String(emailTemplateDetails.emailDetails.action))
                    .replace(
                        "{{ActionDateTime}}",
                        formatDate(
                            String(emailTemplateDetails.emailDetails.actionDateTime),
                            "DD MMM YYYY HH:mm:ss A",
                        ),
                    )
                    .replace("{{SubjectId}}", String(emailTemplateDetails.emailDetails.subjectName))
                    .replace(
                        "{{FromSiteName}}",
                        String(emailTemplateDetails.emailDetails.fromSiteName),
                    )
                    .replace(
                        "{{ToSiteName}}",
                        String(emailTemplateDetails.emailDetails.toSiteName),
                    );
                htmlContent.value = bodyDetails;
            }
            removeTemplatesById(templateId, emailTemplateInLocalStorage);
        }
    }

    onMounted(() => {
        const { templateId = "" } = route.query;
        loadHtmlContent(String(templateId));
    });
</script>

<template>
    <div v-html="htmlContent"></div>
</template>
