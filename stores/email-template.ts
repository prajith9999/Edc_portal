import type {
    IEmailResponse,
    TNullableDate,
    TNullableNumber,
    TNullableString,
} from "~/types/common";

interface IEmailDetails {
    emailDetails: Record<string, TNullableString | TNullableNumber | TNullableDate>;
}
interface IEmailTemplate extends IEmailDetails {
    // id: string;
    toAddress: string[];
    ccAddress: string[];
    bccAddress: string[];
    subject: string;
    bodyKey: string;
    expiry: number;
}

interface IEmailTemplateParam extends IEmailResponse, IEmailDetails {}

export function getEmailTemplatesFromLocalStorage() {
    const emailTemplates = getFromLocalStorage(TLocalStorageKeys.emailTemplates);
    return emailTemplates ? (decodeData(emailTemplates) as Record<string, IEmailTemplate>) : null;
}

function setEmailTemplatesToLocalStorage(result: Record<string, IEmailTemplate>) {
    setToLocalStorage(TLocalStorageKeys.emailTemplates, encodeData(result));
}

function clearEmailTemplates() {
    clearFromLocalStorage(TLocalStorageKeys.emailTemplates);
}

function removeExpiredTemplates(emailDetails: Record<string, IEmailTemplate>) {
    const templateKeys = Object.keys(emailDetails);
    if (getArrayLength(templateKeys) === 0) clearEmailTemplates();
    for (const uniqueKey of templateKeys) {
        const dayDifference = dateDifference(
            new Date(emailDetails[uniqueKey].expiry),
            new Date(currentEpochTime()),
        );
        if (Math.abs(dayDifference) > 1) {
            deleteObjectPropertyByKey(uniqueKey, emailDetails);
        }
    }
}

export function removeTemplatesById(id: string, emailDetails: Record<string, IEmailTemplate>) {
    const emailDetailsRef = { ...emailDetails };
    deleteObjectPropertyByKey(id, emailDetailsRef);
    if (Object.keys(emailDetailsRef).length > 0) setEmailTemplatesToLocalStorage(emailDetailsRef);
    else clearEmailTemplates();
}

export function setEmailTemplate(data: IEmailTemplateParam) {
    const key = uniqueID();
    let result: Record<string, IEmailTemplate> = {};
    const emailDetails = getEmailTemplatesFromLocalStorage();
    if (emailDetails) {
        removeExpiredTemplates(emailDetails);
        result = { ...emailDetails };
    }
    result[key] = {
        toAddress: [...data.to.split(",")],
        ccAddress: data.cc ? [...data.cc.split(",")] : [],
        bccAddress: data.bcc ? [...data.bcc.split(",")] : [],
        subject: data.subject,
        bodyKey: data.body,
        emailDetails: { ...data.emailDetails },
        expiry: currentEpochTime(),
    };
    setEmailTemplatesToLocalStorage(result);
    return key;
}

export async function renderEmailTemplate(uniqueKey: string) {
    await navigateTo(`${appBaseURL()}${PortalPath.EmailTemplate}?templateId=${uniqueKey}`, {
        open: {
            target: "_blank",
        },
    });
}

// const useEmailTemplateStore = defineStore("emailTemplateStore", () => {
//     // const emailTemplates = ref<IEmailTemplate[]>([]);
//     const emailTemplates = ref<Record<string, IEmailTemplate>>({});

//     // function setEmail(data: IEmailTemplateParam) {
//     //     emailTemplates.value.push({
//     //         id: uniqueID(),
//     //         toAddress: [...data.to.split(",")],
//     //         ccAddress: data.cc,
//     //         bccAddress: data.bcc,
//     //         subject: data.subject,
//     //         body: data.body,
//     //         emailDetails: { ...data.emailDetails },
//     //     });
//     // }
//     function setEmail(data: IEmailTemplateParam) {
//         const key = uniqueID();
//         emailTemplates.value[key] = {
//             toAddress: [...data.to.split(",")],
//             ccAddress: data.cc ? [...data.cc.split(",")] : [],
//             bccAddress: data.bcc ? [...data.bcc.split(",")] : [],
//             subject: data.subject,
//             bodyKey: data.body,
//             emailDetails: { ...data.emailDetails },
//         };
//         return key;
//     }

//     function clearEmailByKey(key: string) {
//         deleteObjectPropertyByKey(key, emailTemplates.value);
//     }

//     function clearStore() {
//         // emailTemplates.value = [];
//         emailTemplates.value = {};
//     }

//     return {
//         emailTemplates,
//         setEmail,
//         clearEmailByKey,
//         clearStore,
//     };
// });

// export default useEmailTemplateStore;
