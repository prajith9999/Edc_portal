import getEnvironmentVariables, { EnvLabel } from "~/config/env-variables";
import useAdminWinFormStore from "~/stores/admin-winform";
import useCodeUpdateStore from "~/stores/code-update";
import useDataCollectionStore from "~/stores/data-collection";
import useGlobalStore from "~/stores/global";
import useLoaderStore from "~/stores/loader";
import usePopupModalStore from "~/stores/popup-modal";
import useQuickLinkStore from "~/stores/quick-link";
import useSideBarStore from "~/stores/side-bar";
import useStudyStore from "~/stores/study";
import useToastStore from "~/stores/toast";
import useUnsavedAlertStore from "~/stores/unsaved-alert";
import useUrlStore from "~/stores/url";
import useUserStore from "~/stores/user";
import type {
    IEmailMetaDetailsParams,
    IOptions,
    TEditFormDetail,
    TNullableNumber,
    TNullableString,
    TObject,
    TOptionValue,
    TStoreName,
} from "~/types/common";

export function isEqual(
    value1: any,
    value2: any,
    type: "string" | "number" | "boolean" = "string",
): boolean {
    let result = false;
    if (type === "string") result = String(value1) === String(value2);
    else if (type === "number") result = Number(value1) === Number(value2);
    else if (type === "boolean") result = Boolean(value1) === Boolean(value2);
    return result;
}

export const checkFalsy = (value: any) => ["", null, undefined, 0, false].includes(value);

export const checkShallowFalsy = (value: any) => ["", null, undefined, false].includes(value);

export const checkIfNullOrUndefined = (value: any) =>
    typeof value === "undefined" || value === null;

export const checkIfEmptyArray = (value: any[]) => getArrayLength(value) === 0;

export const checkIfEmptyObject = (value: TObject) =>
    value && getArrayLength(Object.keys(value)) === 0;

export const checkIfValidNumber = (value: any) => !isNaN(value);

// export const deepClone = (value: any) => structuredClone(value);
export const deepClone = (value: any) => JSON.parse(JSON.stringify(value));

export const returnNullIfFalsy = (value: any) => (checkFalsy(value) ? null : value);

export function parseJSON(data: string) {
    try {
        return JSON.parse(data);
    } catch (err) {
        return null;
    }
}

export const uniqueID = () => `id${Math.random().toString(16).slice(2)}`;

export const returnEmptyStringIfFalsy = (value: any) =>
    returnNullIfFalsy(value) ? String(value) : "";

export function getOptionsList(
    data: any[],
    labelKey: string,
    valueKey: string,
    valueType: "string" | "number" = "number",
): IOptions[] {
    const result: IOptions[] = [];
    for (const row of data) {
        if (row[valueKey])
            result.push({
                label: String(row[labelKey]),
                value: valueType === "string" ? String(row[valueKey]) : Number(row[valueKey]),
            });
    }
    return deepClone(result);
}

export const isEditable = (rowIndex: number | string, editFormDetails: TEditFormDetail) =>
    checkIfKeyExistsInObject(rowIndex, editFormDetails) && editFormDetails[rowIndex];

export function getFormOrderOptions(
    tableData: any[],
    key: string,
    valueType: "string" | "number" = "string",
) {
    const result: IOptions[] = [];
    if (getArrayLength(tableData) > 0) result.push({ label: "Top", value: "Top" });
    for (const rowData of tableData) {
        if (rowData[key])
            result.push({
                label: rowData[key],
                value: valueType === "number" ? Number(rowData[key]) : String(rowData[key]),
            });
    }
    result.push({ label: "Bottom", value: "Bottom" });
    return deepClone(result) as IOptions[];
}

export function getDropdownValueByLabel(
    options: IOptions[],
    label: TNullableString | TNullableNumber,
) {
    if (!label) return null;
    const filteredValue = options.filter((row) => row.label === label);
    return getArrayLength(filteredValue) > 0 ? filteredValue[0].value : null;
}

export function getDropdownLabelByValue(options: IOptions[], value: TOptionValue) {
    if (!value) return null;
    const filteredValue = options.filter((row) => isEqual(row.value, value, "string"));
    return getArrayLength(filteredValue) > 0 ? filteredValue[0].label : null;
}

export function getAppType(): "admin" | "portal" {
    const route = useRoute();
    return route.path.includes("admin") ? "admin" : "portal";
}

export function addItemByPosition(selectedOrder: string, tableData: any[], key: string) {
    let order = 0;
    if (!["Top", "Bottom"].includes(selectedOrder)) {
        const indexOfSelectedRow = getIndexOfTheItem({
            data: tableData,
            type: "object",
            value: selectedOrder,
            key,
        });
        order = indexOfSelectedRow + 1;
    } else if (selectedOrder === "Top") {
        order = 0;
    } else {
        order = getArrayLength(tableData);
    }
    return order;
}

export function commonActionIconClasses(
    type: "Delete" | "Add" | "Save" | "Reset" | "Update" | "Details" | "Entries" | "Fields",
) {
    // if (type === "Delete") return "!w-[1.1rem] !h-[1.1rem]";
    // else if (type === "Fields") return "!w-[1.7rem] !h-[1.7rem]";
    // return "!h-[1.4rem]";
    if (type === "Delete") return "delete-action-icon";
    else if (type === "Fields") return "field-action-icon";
    return "add-action-icon";
}

export function triggerUnauthorizedToastMessage(
    message: string = "Oops! It looks like you're not logged in. Please log in to continue.",
    enableAutoClear: boolean = false,
) {
    const toastStore = useToastStore();
    toastStore.error({
        id: "unauthorizedResponse",
        title: "Error",
        message,
        enableAutoClear,
    });
}

export function checkIfUserIsAuthorized() {
    const authDetails = useUserStore().getAuthDetails();
    return !!authDetails.token && !!authDetails.tokenType;
}

export function storeCurrentURLIfUnauthorized(routeParams: IRouteObject) {
    const urlStore = useUrlStore();
    // if (process.client) localStorage.setItem("url", url);
    urlStore.setRouteDetailsWhenUnauthorized(routeParams);
}

export function checkIfUserIsAllowedToAccessAdminModule() {
    const userDetails = useUserStore().getDetails();
    return (
        !!userDetails.roleId &&
        checkIfActionIsAllowed(userDetails.roleId, [RolePermissionType.BackendDevelopmerMode])
    );
}

export function appBaseURL() {
    let origin = "";
    if (typeof window !== "undefined") origin = window.location.origin;
    return origin;
}

export function encodeData(data: any) {
    const encodedDetails = encodeURIComponent(
        `${JSON.stringify(data)}${getEnvironmentVariables(EnvLabel.encodeKey)}`,
    );
    return btoa(encodedDetails);
}

export function decodeData(data: string) {
    const decodedDetails = decodeURIComponent(atob(data)).replace(
        getEnvironmentVariables(EnvLabel.encodeKey),
        "",
    );
    return JSON.parse(decodedDetails);
}

export function clearPiniaStores(...storeNames: TStoreName[]) {
    for (const storeName of storeNames) {
        if (!storeName) continue;
        switch (storeName) {
            case "adminWinFormStore": {
                useAdminWinFormStore().clearStore();
                break;
            }
            case "codeUpdateStore": {
                useCodeUpdateStore().clearStore();
                break;
            }
            case "dataCollectionStore": {
                useDataCollectionStore().clearStore();
                break;
            }
            case "globalStore": {
                useGlobalStore().clearStore();
                break;
            }
            case "loaderStore": {
                useLoaderStore().clearStore();
                break;
            }
            case "popupModalStore": {
                usePopupModalStore().clearStore();
                break;
            }
            case "sideBarStore": {
                useSideBarStore().clearStore();
                break;
            }
            case "studyStore": {
                useStudyStore().clearStore();
                break;
            }
            case "toastStore": {
                useToastStore().clearStore();
                break;
            }
            case "unsavedAlertStore": {
                useUnsavedAlertStore().clearStore();
                break;
            }
            case "urlStore": {
                useUrlStore().clearStore();
                break;
            }
            case "userStore": {
                useUserStore().clearStore();
                break;
            }
            case "quickLinkStore": {
                useQuickLinkStore().clearStore();
                break;
            }
        }
    }
}

export async function mockDelay(delayTime = 1000) {
    await new Promise((resolve) => setTimeout(resolve, delayTime));
}

export const seoPageTitle = (pageName: string) => `VHSuite - ${pageName}`;

export const emailMetaDetails = (emailDetails: IEmailMetaDetailsParams) => `
    <table role='presentation' border='0' cellspacing='0' width='fit'
            style='display: table; padding: 30px 0px 20px 0; margin: 20px 5px; border: 1px solid #3663b4'>
            <tr>
                <td style='padding: 0px 15px;'>
                    <span
                        style='font-family: Arial, Helvetica, sans-serif; font-weight: 700; font-size: 15px; color: #000000; margin-top: 10px;'>
                        To Address:</span>
                    <span
                        style='font-family: Arial, Helvetica, sans-serif; font-weight: 400; font-size: 15px; color: #000000; margin-top: 10px;'>
                        ${emailDetails.toAddress || ""}</span>
                </td>
            </tr>
            <tr>
                <td style='padding: 0px 15px;'>
                    <span
                        style='font-family: Arial, Helvetica, sans-serif; font-weight: 700; font-size: 15px; color: #000000; margin-top: 10px;'>
                        CC Address:</span>
                    <span
                        style='font-family: Arial, Helvetica, sans-serif; font-weight: 400; font-size: 15px; color: #000000; margin-top: 10px;'>
                        ${emailDetails.ccAddress || ""}</span>
                </td>
            </tr>
            <tr>
                <td style='padding: 0px 15px;'>
                    <span
                        style='font-family: Arial, Helvetica, sans-serif; font-weight: 700; font-size: 15px; color: #000000; margin-top: 10px;'>
                        BCC Address:</span>
                    <span
                        style='font-family: Arial, Helvetica, sans-serif; font-weight: 400; font-size: 15px; color: #000000; margin-top: 10px;'>
                        ${emailDetails.bccAddress || ""}</span>
                </td>
            </tr>
            <tr>
                <td style='padding: 0px 15px;'>
                    <span
                        style='font-family: Arial, Helvetica, sans-serif; font-weight: 700; font-size: 15px; color: #000000; margin-top: 10px;'>
                        Subject:</span>
                    <span
                        style='font-family: Arial, Helvetica, sans-serif; font-weight: 400; font-size: 15px; color: #000000; margin-top: 10px;'>
                        ${emailDetails.subject || ""}</span>
                </td>
            </tr>
        </table>
`;

export function discrepancyStatus(discrepancyStatusId: number) {
    let result = "";
    if (discrepancyStatusId === 1) result = "Raised";
    else if (discrepancyStatusId === 2) result = "Resolved";
    else if (discrepancyStatusId === 3) result = "Cancelled";
    else if (discrepancyStatusId === 4) result = "Answered";
    return result;
}

export function setFilterOptionsIds(
    filtersList: Array<string | number>,
    filterOptionsList: IOptions[],
    endResult: "label" | "value",
) {
    const result: Array<string | number> = [];
    for (const row of filtersList) {
        if (endResult === "label") {
            const labelResult = getDropdownLabelByValue(filterOptionsList, row);
            if (labelResult) result.push(labelResult);
        } else {
            const valueResult = getDropdownValueByLabel(filterOptionsList, row);
            if (valueResult) result.push(Number(valueResult));
        }
    }
    return result;
}

export function isDateTimeField(fieldLabel: string) {
    let result = false;
    // TODO based on the date/datetime field need to add it to include function
    if (
        String(fieldLabel).toLowerCase().includes("date")
        // ||
        // String(fieldLabel).toLowerCase().includes("time")
    )
        result = true;
    return result;
}

export function splitLabelForChart(label: string) {
    const words = label.split(" ");
    const lineLimit = 14;
    const lines = [];

    let line = "";
    let currentWordIdx = 0;

    while (currentWordIdx < words.length) {
        if (line.length + words[currentWordIdx].length < lineLimit) {
            line += `${words[currentWordIdx]} `;
            currentWordIdx++;

            if (currentWordIdx === words.length) {
                lines.push(line);
            }
        } else {
            if (line.length) {
                lines.push(line);
                line = "";
            }

            if (words[currentWordIdx].length >= lineLimit) {
                lines.push([words[currentWordIdx]]);
                currentWordIdx++;
            }
        }
    }

    return lines;
}
