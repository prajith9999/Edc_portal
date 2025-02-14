import type { IColumn } from "~/types/datatable";
import type {
    ICheckboxGroupOptions,
    IDataCollectionFormDetails,
    IFileModel,
    IFormAdditionalProps,
    TTabIndex,
} from "~/types/form-generation";
// import EdcTextInputGroup from "~/components/EdcTextInputGroup.vue";
// import EdcTextArea from "~/components/EdcTextArea.vue";
// import EdcCalendar from "~/components/EdcCalendar.vue";
// import EdcCheckboxGroup from "~/components/EdcCheckboxGroup.vue";
// import EdcDropdown from "~/components/EdcDropdown.vue";
// import EdcFileUpload from "~/components/EdcFileUpload.vue";
// import EdcRadioGroup from "~/components/EdcRadioGroup.vue";
import type {
    TDataCollectionFormDetails,
    TDateFormat,
    TNullableDate,
    TNullableString,
} from "~/types/common";
import type {
    IFieldValueDetail,
    IGenerateFormFieldsData,
} from "~/services/apis/handlers/types/data-collection-types";
import useStudyStore from "~/stores/study";
import useDataCollectionStore from "~/stores/data-collection";
import convertBase64 from "./file-upload";

export interface IListData {
    columns: IColumn[];
    tableData: any[];
}

// export function getTableDataForListView(formsList: IFormList[], formCount = 1) {
//     const columns: IColumn[] = [
//         {
//             field: "form",
//             header: "Form",
//             icon: false,
//             show: true,
//             style: {
//                 fontWeight: 700,
//             },
//         },
//     ];
//     const tableData: any[] = [];
//     for (const formRow of formsList) {
//         columns.push({
//             field: formRow.question,
//             header: formRow.question,
//             icon: false,
//             show: true,
//         });
//     }
//     for (let i = 1; i <= formCount; i++) {
//         let obj: Record<string, any> = {};
//         for (const formRow of formsList) {
//             // tableData.push({
//             //     Form: `Form ${index}`,
//             //     [formRow.question]: "Answer",
//             // });
//             obj[formRow.question] = "Answer";
//         }
//         tableData.push({
//             Form: `Form ${i}`,
//             ...deepClone(obj),
//         });
//         obj = {};
//     }
//     return deepClone({
//         columns,
//         tableData,
//     }) as IListData;
// }

export const formFieldsSlot: Record<number, Component> = {
    // 1: defineAsyncComponent(() => import("~/components/EdcTextInputGroup.vue")),
    2: defineAsyncComponent(() => import("~/components/EdcTextArea.vue")),
    3: defineAsyncComponent(() => import("~/components/EdcCalendar.vue")),
    4: defineAsyncComponent(() => import("~/components/EdcCalendar.vue")),
    5: defineAsyncComponent(() => import("~/components/EdcCalendar.vue")),
    // 6: defineAsyncComponent(() => import("~/components/EdcCheckboxGroup.vue")),
    7: defineAsyncComponent(() => import("~/components/EdcDropdown.vue")),
    8: defineAsyncComponent(() => import("~/components/EdcRadioGroup.vue")),
    9: defineAsyncComponent(() => import("~/components/EdcRadioGroup.vue")),
    // 10: defineAsyncComponent(() => import("~/components/EdcFileUpload.vue")),
    // 11: , // Signature
};
// export const formFieldsSlot = (): Record<number, Component> => ({
//     1: EdcTextInputGroup,
//     2: EdcTextArea,
//     3: EdcCalendar,
//     4: EdcCalendar,
//     5: EdcCalendar,
//     6: EdcCheckboxGroup,
//     7: EdcDropdown,
//     8: EdcRadioGroup,
//     9: EdcRadioGroup,
//     10: EdcFileUpload,
//     // 11: , // Signature
// });

export function getValidationPropsDetails(format: TNullableString, controlType: number) {
    const result: IFormAdditionalProps = { type: "text", multipleUpload: false };
    // format: $n, n, n+, n.x, n+.x, n.x+, n+.x+
    if (format) {
        if (format.includes("$")) {
            result["type"] = "text";
            const dollarRemovedFormat = Number(format.replace("$", ""));
            result["minLength"] = 0;
            result["maxLength"] = dollarRemovedFormat || 1000;
        } else if (format.includes(".")) {
            result["type"] = "number";
            const [wholePart, fractionalPart] = format.split(".");
            const plusRemovedWholePart = Number(wholePart.replace("+", ""));
            const plusRemovedFractionalPart = Number(fractionalPart.replace("+", ""));
            if (wholePart.includes("+")) {
                result["wholePart"] = {
                    minLength: plusRemovedWholePart || 1000,
                    maxLength: plusRemovedWholePart || 1000,
                };
            } else {
                result["wholePart"] = {
                    minLength: 0,
                    maxLength: plusRemovedWholePart || 1000,
                };
            }

            if (fractionalPart.includes("+")) {
                result["fractionalPart"] = {
                    minLength: plusRemovedFractionalPart || 1000,
                    maxLength: plusRemovedFractionalPart || 1000,
                };
            } else {
                result["fractionalPart"] = {
                    minLength: 0,
                    maxLength: plusRemovedFractionalPart || 1000,
                };
            }
        } else if (format.includes("+")) {
            result["type"] = "number";
            const plusRemovedFormat = Number(format.replace("+", ""));
            result["minLength"] = plusRemovedFormat || 1000;
            result["maxLength"] = plusRemovedFormat || 1000;
        } else if (controlType === 10 && format.toLowerCase().includes("m")) {
            result["multipleUpload"] = true;
        } else if (
            [3, 4, 5].includes(controlType) &&
            (format.toLowerCase().includes("d") ||
                format.toLowerCase().includes("m") ||
                format.toLowerCase().includes("y") ||
                format.toLowerCase().includes("h") ||
                format.toLowerCase().includes("m") ||
                format.toLowerCase().includes("s"))
        ) {
            result["dateFormat"] = format;
        } else {
            result["type"] = "number";
            result["minLength"] = 0;
            result["maxLength"] = Number(format) || 1000;
        }
    }
    return result;
}

export function getModelAndSpecifiedValueByControlType(
    controlType: number,
    fieldValueDetails: IFieldValueDetail[],
    defaultValue: TNullableString,
    // dictionaryId: TNullableNumber,
    // dataDictionaryEntriesList: IPublishedDataDictionaryEntryListData[],
) {
    let modelValue = null;
    let specifiedValue = null;
    if (getArrayLength(fieldValueDetails) > 0 && controlType === 10)
        // modelValue = fieldValueDetails.map((row) => row.fieldValue);
        modelValue = [...fieldValueDetails];
    else if (getArrayLength(fieldValueDetails) === 0 && controlType === 10) modelValue = [];
    else if (
        getArrayLength(fieldValueDetails) > 0 &&
        fieldValueDetails[0].fieldValue &&
        [3, 4, 5].includes(controlType)
    ) {
        if (controlType === 4) {
            modelValue = formatDate(
                `${formatDate(currentDate(), "YYYY-MM-DD", false)} ${getArrayLength(String(fieldValueDetails[0].fieldValue).split(":")) === 3 ? fieldValueDetails[0].fieldValue : `${fieldValueDetails[0].fieldValue}:00`}`,
                "YYYY-MM-DD HH:mm:ss",
                false,
            );
        } else if (
            controlType === 3 &&
            (fieldValueDetails[0].fieldValue.includes("UN") ||
                fieldValueDetails[0].fieldValue.includes("UNK"))
        ) {
            modelValue = `${fieldValueDetails[0].fieldValue}`;
        } else if (controlType === 3) {
            modelValue = formatDate(fieldValueDetails[0].fieldValue, "YYYY-MM-DD HH:mm:ss", false);
        } else if (
            controlType === 5 &&
            (fieldValueDetails[0].fieldValue.includes("UN") ||
                fieldValueDetails[0].fieldValue.includes("UNK"))
        ) {
            modelValue = `${fieldValueDetails[0].fieldValue}`;
        } else if (controlType === 5) {
            modelValue = formatDate(fieldValueDetails[0].fieldValue, "YYYY-MM-DD HH:mm:ss", false);
        }
        // modelValue =
        //     controlType === 4
        //         ? formatDate(
        //               `${formatDate(currentDate(), "YYYY-MM-DD", false)} ${getArrayLength(String(fieldValueDetails[0].fieldValue).split(":")) === 3 ? fieldValueDetails[0].fieldValue : `${fieldValueDetails[0].fieldValue}:00`}`,
        //               "YYYY-MM-DD HH:mm:ss",
        //               false,
        //           )
        //         : formatDate(fieldValueDetails[0].fieldValue, "YYYY-MM-DD HH:mm:ss", false);
    } else if (getArrayLength(fieldValueDetails) > 0 && controlType === 6)
        modelValue = !!isEqual(fieldValueDetails[0].fieldValue, "true", "string");
    else if (getArrayLength(fieldValueDetails) > 0) modelValue = fieldValueDetails[0].fieldValue;
    else if (defaultValue) modelValue = defaultValue;

    if (getArrayLength(fieldValueDetails) > 0 && [1, 7, 8, 9].includes(controlType))
        specifiedValue = fieldValueDetails[0].specifiedValue;

    return { modelValue, specifiedValue };
}

export function getNextProgressStatusByCurrentStatus(currentStatus: string) {
    let result = "";
    switch (currentStatus) {
        case "Planned":
            result = "Data Entry Inprogress";
            break;
        case "Data Entry Inprogress":
            result = "Data Entry Completed";
            break;
        case "Verify In Progress":
            result = "Verify Completed";
            break;
        case "Frozen":
            result = "Frozen";
            break;
        case "Locked":
            result = "Locked";
            break;
        default:
            result = "";
            break;
    }
    return result;
}

export function getFormFieldStatusCountDetails(uniqueStatuses: string[]) {
    const statusCount = {
        planned: 0,
        dataEntryInProgress: 0,
        dataEntryCompleted: 0,
        verifyInProgress: 0,
        verifyCompleted: 0,
        reviewInProgress: 0,
        reviewCompleted: 0,
        frozen: 0,
        locked: 0,
    };
    for (const row of uniqueStatuses) {
        if (row === "Planned") statusCount.planned++;
        else if (row === "Data Entry Inprogress") statusCount.dataEntryInProgress++;
        else if (row === "Data Entry Completed") statusCount.dataEntryCompleted++;
        else if (row === "Verify In Progress") statusCount.verifyInProgress++;
        else if (row === "Verify Completed") statusCount.verifyCompleted++;
        else if (row === "Review In Progress") statusCount.reviewInProgress++;
        else if (row === "Review Completed") statusCount.reviewCompleted++;
        else if (row === "Frozen") statusCount.frozen++;
        else if (row === "Locked") statusCount.locked++;
    }

    return statusCount;
}

export function processDisplayName(
    fieldValueDetails: IFieldValueDetail[],
    controlType: number,
): string {
    const result: string[] = [];
    for (const row of fieldValueDetails) {
        let displayValue = "";
        if (row.fieldValue && row.specifiedValue)
            displayValue = `${row.fieldValue} - ${row.specifiedValue}`;
        else if (row.fieldValue && controlType === 10) displayValue = getFileName(row.fieldValue);
        else if (row.fieldValue) displayValue = row.fieldValue;
        else displayValue = "-";
        // if (index !== getArrayLength(fieldValueDetails) - 1) displayValue += `, `;
        result.push(displayValue);
    }
    return result.join(controlType === 6 ? ",\n" : ", ").trim();
}

export function getTabIndexByControlType(value?: TTabIndex) {
    if (value && Array.isArray(value)) return value;
    return [undefined, undefined];
}

export function getTabIndexByIndex(value: TTabIndex, index: number) {
    if (checkIfIndexExistInArray(index, value)) return value[index];
    return undefined;
}

export function getElementTabIndex(controlType: number, currentCount: number, loopCount: number) {
    let result: number[] = [];
    let countRef = currentCount;
    for (let i = 0; i < loopCount; i++) {
        const mainTabIndex = countRef + 1;
        const specifyTabIndex = countRef + 2;
        countRef = specifyTabIndex;
        if ([1, 6, 7, 8, 9].includes(controlType))
            result = [...result, mainTabIndex, specifyTabIndex];
        else result = [mainTabIndex];
    }
    return result;
    // if ([1, 6, 7, 8, 9].includes(controlType)) return [currentCount + 1, currentCount + 2];
    // // if ([2, 3, 4, 5, 10].includes(controlType)) return currentCount + 1;
    // return currentCount + 1;
}

function getNextNonRepeatingElementInFormFields(
    formsList: IGenerateFormFieldsData[],
    currentRow: IGenerateFormFieldsData,
    currentIndex: number,
) {
    let result = -1;
    for (const [rowIndex, row] of formsList.entries()) {
        if (rowIndex <= currentIndex) continue;
        if (row.id === currentRow.id) continue;
        result = rowIndex;
        break;
    }
    return result;
}

export function checkWhereToPushByIndentLevel(
    formRow: IGenerateFormFieldsData,
    currentIndex: number,
    formsList: IGenerateFormFieldsData[],
) {
    let currentPointer = "parent";
    let nextPointer = "parent";
    // const isNextIndex = checkIfIndexExistInArray(currentIndex + 1, formsList);
    const nextIndex = getNextNonRepeatingElementInFormFields(formsList, formRow, currentIndex);
    const isNextIndex = checkIfIndexExistInArray(nextIndex, formsList);
    if (
        (formRow.indentLevel === 1 && isNextIndex && formsList[nextIndex].indentLevel === 0) ||
        (formRow.indentLevel === 1 && !isNextIndex)
    ) {
        currentPointer = "children";
        nextPointer = "parent";
    } else if (formRow.indentLevel === 1 && isNextIndex && formsList[nextIndex].indentLevel === 1) {
        currentPointer = "children";
        nextPointer = "children";
    } else if (formRow.indentLevel === 0 && isNextIndex && formsList[nextIndex].indentLevel === 1) {
        currentPointer = "parent";
        nextPointer = "children";
    }
    return {
        currentPointer,
        nextPointer,
    };
}

export function isFieldDisabled(additionalConditions: boolean = false) {
    const studyStore = useStudyStore();
    const dataCollectionStore = useDataCollectionStore();
    return (
        !checkIfActionIsAllowed(studyStore.getRoleIdBySiteId(), [RolePermissionType.Edit]) ||
        !dataCollectionStore.isDataAllowedToEnterForTheSubject() ||
        additionalConditions
    );
}

export async function getAPIFieldValueDetails(row: IDataCollectionFormDetails) {
    const result: IFieldValueDetail[] = [];
    if (row.controlType === 10) {
        // Array<string | File>
        for (const dataRow of row.modelValue as unknown as IFileModel[]) {
            let fieldValue = "";
            let specifiedValue = null;
            if (typeof dataRow.fieldValue === "string") {
                fieldValue = dataRow.fieldValue;
            } else {
                fieldValue = (await convertBase64(dataRow.fieldValue)) as string;
                specifiedValue = dataRow.fieldValue.name.split(".")[0];
            }
            result.push({
                id: dataRow.id,
                publishedSubjectFormFieldChildValueDetailId:
                    dataRow.publishedSubjectFormFieldChildValueDetailId,
                fieldValue,
                specifiedValue,
            });
        }
    } else if (row.controlType === 6) {
        if (getArrayLength(row.options) > 0) {
            for (const dataRow of row.options as ICheckboxGroupOptions[]) {
                if (dataRow.isChecked) {
                    result.push({
                        id: dataRow.id,
                        publishedSubjectFormFieldChildValueDetailId:
                            dataRow.publishedSubjectFormFieldChildValueDetailId,
                        fieldValue: dataRow.value,
                        specifiedValue: dataRow.specifiedValue
                            ? String(dataRow.specifiedValue)
                            : null,
                    });
                }
            }
        } else {
            result.push({
                id: getArrayLength(row.fieldValueDetails) > 0 ? row.fieldValueDetails[0].id : 0,
                publishedSubjectFormFieldChildValueDetailId:
                    getArrayLength(row.fieldValueDetails) > 0
                        ? row.fieldValueDetails[0].publishedSubjectFormFieldChildValueDetailId
                        : 0,
                // fieldValue: row.modelValue ? String(row.modelValue) : null,
                fieldValue: row.modelValue ? String(row.label || row.modelValue) : null,
                specifiedValue: row.specifiedValue ? row.specifiedValue : null,
            });
        }
    } else if ([3, 4, 5].includes(row.controlType)) {
        result.push({
            id: getArrayLength(row.fieldValueDetails) > 0 ? row.fieldValueDetails[0].id : 0,
            publishedSubjectFormFieldChildValueDetailId:
                getArrayLength(row.fieldValueDetails) > 0
                    ? row.fieldValueDetails[0].publishedSubjectFormFieldChildValueDetailId
                    : 0,
            // fieldValue: row.modelValue ? getAsISOString(row.modelValue as TNullableDate) : null,
            fieldValue:
                row.modelValue &&
                (String(row.modelValue).includes("UN") || String(row.modelValue).includes("UNK"))
                    ? formatUnkownDate(String(row.format), String(row.modelValue))
                    : row.modelValue
                      ? formatDate(
                            row.modelValue as TNullableDate,
                            String(row.format).replaceAll("?", "") as TDateFormat,
                            false,
                        )
                      : null,
            specifiedValue: row.specifiedValue ? String(row.specifiedValue) : null,
        });
    } else if ([1, 2, 7, 8, 9].includes(row.controlType)) {
        result.push({
            id: getArrayLength(row.fieldValueDetails) > 0 ? row.fieldValueDetails[0].id : 0,
            publishedSubjectFormFieldChildValueDetailId:
                getArrayLength(row.fieldValueDetails) > 0
                    ? row.fieldValueDetails[0].publishedSubjectFormFieldChildValueDetailId
                    : 0,
            fieldValue: row.modelValue ? String(row.modelValue) : null,
            specifiedValue: row.specifiedValue ? String(row.specifiedValue) : null,
        });
    }
    return result;
}

// function checkIfYesEnteredForNonLogDataEntriesInLogForm(
//     groupId: number,
//     formsList: TDataCollectionFormDetails,
// ) {
//     let result = true;
//     if (checkIfKeyExistsInObject(groupId, formsList)) {
//         for (const row of formsList[groupId]) {
//             if (row.isHeading && getArrayLength(row.children) > 0) {
//                 for (const childrenRow of row.children) {
//                     if (childrenRow.isLogDataEntry) continue;
//                     if (
//                         !childrenRow.isLogDataEntry &&
//                         (!childrenRow.modelValue || childrenRow.modelValue === "No")
//                     ) {
//                         result = false;
//                         break;
//                     }
//                 }
//             } else if (!row.isHeading) {
//                 if (row.isLogDataEntry) continue;
//                 if (!row.isLogDataEntry && (!row.modelValue || row.modelValue === "No")) {
//                     result = false;
//                     break;
//                 }
//             }
//         }
//     }
//     return result;
// }

export function showComponent(
    formDetails: IDataCollectionFormDetails,
    // groupId: number,
    // formsList: TDataCollectionFormDetails,
) {
    let result = true;
    if (
        // (formDetails.isLogDataEntry &&
        //     !checkIfYesEnteredForNonLogDataEntriesInLogForm(groupId, formsList)) ||
        !formDetails.isVisible
    )
        result = false;
    // console.log(
    //     `result in showComponent for ${formDetails.oid} (${formDetails.label}) field in group ${groupId}`,
    //     result,
    // );
    return result;
}

export function commonLoopForBulkOperation(
    formsList: TDataCollectionFormDetails,
    callback: (formDetails: IDataCollectionFormDetails) => void | boolean,
) {
    for (const [, dataCollectionRow] of Object.entries(formsList)) {
        dataCollectionLoop: for (const row of dataCollectionRow) {
            if (row.isHeading && getArrayLength(row.children) > 0) {
                for (const childrenRow of row.children) {
                    if (!showComponent(childrenRow)) continue;
                    if (callback(childrenRow)) break dataCollectionLoop;
                }
            } else if (!row.isHeading) {
                if (!showComponent(row)) continue;
                if (callback(row)) break dataCollectionLoop;
            }
        }
    }
}
