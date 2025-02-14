import type {
    IFormFieldEditCheckActionData,
    IFormFieldEditCheckStepData,
    TDisableEditCheckResult,
    TFormFieldDisableEditCheckData,
    TFormFieldNonLogDataEditCheckData,
    TFormFieldVisibiltyEditCheckData,
    TVisibilityEditCheckResult,
} from "~/services/apis/handlers/types/data-collection-types";
import type {
    IDataCollectionFormDetails,
    IFormFieldDisableEditCheckDetails,
    IFormFieldNonLogDataEditCheckDetails,
    IFormFieldVisibiltyEditCheckDetails,
    TEditCheckDetails,
} from "~/types/form-generation";
import { getFieldDetailsById } from "./derivation";
import { getAPIFieldValueDetails } from "./form-generation";
import type { TDataCollectionFormDetails, TNullableString } from "~/types/common";
import useDataCollectionStore from "~/stores/data-collection";

interface IProcessFormFieldVisibiltyEditCheckParam {
    assignedFieldEditChecks: TFormFieldVisibiltyEditCheckData<IFormFieldVisibiltyEditCheckDetails>;
    // formsList: IDataCollectionFormDetails[];
    formsList: TDataCollectionFormDetails;
    checkForVisitId: boolean;
}

interface IProcessFormFieldDisableEditCheckParam {
    assignedFieldEditChecks: TFormFieldDisableEditCheckData<IFormFieldDisableEditCheckDetails>;
    // formsList: IDataCollectionFormDetails[];
    formsList: TDataCollectionFormDetails;
    checkForVisitId: boolean;
}

async function processEditCheckSteps(
    steps: IFormFieldEditCheckStepData[],
    formsList: IDataCollectionFormDetails[],
) {
    const result: Array<TEditCheckDetails> = [];
    let stepsGrouping: TEditCheckDetails = {};
    let paramsCount = 1;
    for (const row of steps) {
        switch (row.type) {
            case 1: {
                const fieldDetails = getFieldDetailsById(formsList, row.fieldId);
                if (fieldDetails) {
                    const fieldValueDetails = await getAPIFieldValueDetails(fieldDetails);
                    stepsGrouping[`param${paramsCount}`] =
                        getArrayLength(fieldValueDetails) > 0
                            ? fieldValueDetails[0].fieldValue
                            : getArrayLength(fieldValueDetails) > 0
                              ? fieldValueDetails[0].specifiedValue
                              : fieldDetails.modelValue;
                    paramsCount++;
                } else {
                    stepsGrouping[`param${paramsCount}`] = null;
                    paramsCount++;
                }
                break;
            }
            case 2: {
                if (row.checkFunctionName) {
                    if (
                        convertToLowerCase(row.checkFunctionName) === "and" ||
                        convertToLowerCase(row.checkFunctionName) === "or"
                    ) {
                        result.push(deepClone({ ...stepsGrouping, action: "expression" }));
                        result.push(
                            deepClone({
                                function1: row.checkFunctionName,
                                action: "join",
                            }),
                        );
                        stepsGrouping = {};
                        paramsCount = 1;
                    } else if (convertToLowerCase(row.checkFunctionName) === "not")
                        stepsGrouping["function2"] = row.checkFunctionName;
                    else stepsGrouping["function1"] = row.checkFunctionName;
                }
                break;
            }
            case 3: {
                if (row.value) {
                    stepsGrouping[`param${paramsCount}`] = row.value;
                    paramsCount++;
                }
                break;
            }
        }
    }
    if (getArrayLength(Object.keys(stepsGrouping)) > 0)
        result.push(deepClone({ ...stepsGrouping, action: "expression" }));
    return deepClone(result);
}

// function processEditCheckActions(
//     actions: IFormFieldEditCheckActionData[],
//     dataCollectionDetails: IDataCollectionFormDetails,
// ) {
//     let editCheckFieldId = -1;
//     if (actions.id && isEqual(actions.fieldId, dataCollectionDetails.id, "number")) {
//         editCheckFieldId = dataCollectionDetails.id;
//     }
//     return editCheckFieldId;
// }
function checkIfFolderIdMatches(action: IFormFieldEditCheckActionData, checkForVisitId: boolean) {
    const dataCollectionStore = useDataCollectionStore();
    let result = false;
    if (!checkForVisitId) result = true;
    if (!action.folderId) result = true;
    else if (action.folderId && dataCollectionStore.queryParamDetails.folderId === action.folderId)
        result = true;
    return result;
}

function processEditCheckActions(
    actions: IFormFieldEditCheckActionData[],
    dataCollectionDetails: IDataCollectionFormDetails,
    checkForVisitId: boolean,
) {
    let editCheckFieldId = -1;
    if (getArrayLength(actions) > 0) {
        for (const action of actions) {
            if (
                action.id &&
                isEqual(action.fieldId, dataCollectionDetails.id, "number") &&
                checkIfFolderIdMatches(action, checkForVisitId)
            ) {
                editCheckFieldId = dataCollectionDetails.id;
                break;
            }
        }
    }
    return editCheckFieldId;
}

// function processIsEqualTo(stepDetail: TEditCheckDetails) {
//     const paramDetails = Object.entries(stepDetail);
//     const totalLength = getArrayLength(paramDetails);
//     for (let firstIteration = 0; firstIteration < totalLength; firstIteration++) {
//         for (let secondIteration = firstIteration + 1; secondIteration < totalLength; secondIteration++) {
//             console.log("paramDetails[firstIteration]", paramDetails[firstIteration]);
//             console.log("paramDetails[secondIteration]", paramDetails[secondIteration]);
//             if (paramDetails[firstIteration] === paramDetails[secondIteration])
//         }
//     }
// }
export function processIsEqualTo(params: string[]) {
    return params.every((value, _index, array) => value === array[0]);
}

export function areAllTrue(params: boolean[]) {
    return params.every((val) => val === true);
}

export function isAnyTrue(params: boolean[]) {
    // eslint-disable-next-line unicorn/prefer-includes
    return params.some((val) => val === true);
}

export function processIsNotEmpty(params: string[]) {
    // eslint-disable-next-line unicorn/prefer-includes
    return checkIfIndexExistInArray(0, params)
        ? params[0] !== null && String(params[0]) !== "false"
        : false;
}

export function processIsLessThan(params: string[]) {
    let result = false;
    if (
        checkIfIndexExistInArray(0, params) &&
        checkIfIndexExistInArray(1, params) &&
        params[0] &&
        params[1]
    ) {
        result = Number(params[0]) < Number(params[1]);
    }
    return result;
}

export function processIsGreaterThan(params: string[]) {
    let result = false;
    if (
        checkIfIndexExistInArray(0, params) &&
        checkIfIndexExistInArray(1, params) &&
        params[0] &&
        params[1]
    ) {
        result = Number(params[0]) > Number(params[1]);
    }
    return result;
}

function doesJoinExist(stepDetails: Array<TEditCheckDetails>) {
    let result = "";
    for (const row of stepDetails) {
        if (row["action"] === "join") {
            result = row["action"] === "And" ? "and" : "or";
            break;
        }
    }
    return result;
}

function performVisibilityEditCheck(stepDetails: Array<TEditCheckDetails>) {
    let result = false;
    const andConditions: boolean[] = [];
    const orConditions: boolean[] = [];
    for (const row of stepDetails) {
        if (row["action"] === "expression") {
            if (row["function1"] === "IsEqualTo") {
                result = processIsEqualTo(
                    Object.entries(row)
                        .filter(([key]) => !["function1", "function2", "action"].includes(key))
                        .map((arrRow: any) => arrRow[1]) as string[],
                );
            } else if (row["function1"] === "IsNotEmpty")
                result = processIsNotEmpty(
                    Object.entries(row)
                        .filter(([key]) => !["function1", "function2", "action"].includes(key))
                        .map((arrRow: any) => arrRow[1]) as string[],
                );
        } else if (row["action"] === "join") {
            if (row["function1"] === "And") andConditions.push(result);
            else if (row["function1"] === "Or") orConditions.push(result);
            result = false;
        }
    }
    const joinType = doesJoinExist(stepDetails);
    if (joinType) {
        if (joinType === "and") andConditions.push(result);
        else if (joinType === "or") orConditions.push(result);
    }
    const isAndConditionPresent = getArrayLength(andConditions) > 0;
    const isOrConditionPresent = getArrayLength(orConditions) > 0;
    if (isAndConditionPresent || isOrConditionPresent)
        return areAllTrue([
            isAndConditionPresent ? areAllTrue(andConditions) : true,
            isOrConditionPresent ? isAnyTrue(orConditions) : true,
        ]);
    return result;
}

async function setVisibilityEditCheckContent(params: {
    fieldId: string;
    dataCollectionRow: IDataCollectionFormDetails;
    rowValue: IFormFieldVisibiltyEditCheckDetails;
    formsList: IDataCollectionFormDetails[];
    result: TVisibilityEditCheckResult;
    editCheckId: string;
    checkForVisitId: boolean;
}) {
    const {
        dataCollectionRow,
        fieldId,
        formsList,
        rowValue,
        result,
        editCheckId,
        checkForVisitId,
    } = params;
    let exitOutOfLoop = false;
    if (isEqual(fieldId, dataCollectionRow.id, "number")) {
        const stepDetails = await processEditCheckSteps(rowValue.steps, formsList);
        const editCheckFieldId = processEditCheckActions(
            rowValue.actions,
            dataCollectionRow,
            checkForVisitId,
        );
        const finalEditCheckFieldId =
            editCheckFieldId !== -1 ? editCheckFieldId : dataCollectionRow.id;
        const editCheckResult = performVisibilityEditCheck(stepDetails);
        if (!checkIfKeyExistsInObject(finalEditCheckFieldId, result))
            result[finalEditCheckFieldId] = {};
        result[finalEditCheckFieldId][editCheckId] =
            editCheckFieldId !== -1 ? editCheckResult : false;
        // const derivationResult = performDerivation(
        //     stepDetails,
        //     expressionType,
        //     expressionFormat,
        // );
        // console.log(
        //     "derivationResult in processFormFieldVisibiltyEditChecks for edit checks",
        //     derivationResult,
        // );
        // if (derivationResult) dataCollectionRow.modelValue = derivationResult;
        // else dataCollectionRow.modelValue = null;
        exitOutOfLoop = true;
    }
    return exitOutOfLoop;
}

export async function processFormFieldVisibiltyEditChecks(
    params: IProcessFormFieldVisibiltyEditCheckParam,
) {
    const finalResult: TVisibilityEditCheckResult = {};
    if (getArrayLength(Object.keys(params.assignedFieldEditChecks)) > 0) {
        for (const [rowKey, rowValue] of Object.entries(params.assignedFieldEditChecks)) {
            const [, fieldId] = rowKey.split("_");
            for (const [editCheckId, editCheckDetailRow] of Object.entries(rowValue)) {
                if (!editCheckDetailRow.isVisibiltyEditCheck) continue;
                for (const dataCollectionFormFieldRow of Object.values(params.formsList)) {
                    for (const dataCollectionRow of dataCollectionFormFieldRow) {
                        if (
                            dataCollectionRow.isHeading &&
                            getArrayLength(dataCollectionRow.children) > 0
                        ) {
                            for (const childrenRow of dataCollectionRow.children) {
                                const result = await setVisibilityEditCheckContent({
                                    dataCollectionRow: childrenRow,
                                    fieldId,
                                    formsList: dataCollectionFormFieldRow,
                                    result: finalResult,
                                    rowValue: editCheckDetailRow,
                                    editCheckId,
                                    checkForVisitId: params.checkForVisitId,
                                });
                                if (result) break;
                            }
                        } else if (!dataCollectionRow.isHeading) {
                            const result = await setVisibilityEditCheckContent({
                                dataCollectionRow,
                                fieldId,
                                formsList: dataCollectionFormFieldRow,
                                result: finalResult,
                                rowValue: editCheckDetailRow,
                                editCheckId,
                                checkForVisitId: params.checkForVisitId,
                            });
                            if (result) break;
                        }
                    }
                }
            }
        }
    }
    return finalResult;
}

// function setFieldVisibilty(
//     checkResult: boolean,
//     formsList: IDataCollectionFormDetails[],
//     formsListRef: IDataCollectionFormDetails[],
//     formRowIndex: number,
// ) {
//     let isValueChanged = false;
//     if (
//         (checkResult && !formsList[formRowIndex].isVisible) ||
//         (!checkResult && formsList[formRowIndex].isVisible)
//     ) {
//         formsList[formRowIndex].isVisible = checkResult;
//         formsListRef[formRowIndex].isVisible = checkResult;
//         if (!checkResult && formsList[formRowIndex].modelValue) {
//             if (Array.isArray(formsList[formRowIndex].modelValue)) {
//                 formsList[formRowIndex].modelValue = [];
//                 formsListRef[formRowIndex].modelValue = [];
//             } else {
//                 formsList[formRowIndex].modelValue = null;
//                 formsListRef[formRowIndex].modelValue = null;
//             }
//             formsList[formRowIndex].specifiedValue = null;
//             formsListRef[formRowIndex].modelValue = null;
//         }
//         if (!isValueChanged) isValueChanged = true;
//     }
//     return isValueChanged;
// }
function setFieldVisibilty(
    checkResult: boolean,
    formsList: IDataCollectionFormDetails,
    formsListRef: IDataCollectionFormDetails,
) {
    let isValueChanged = false;
    if ((checkResult && !formsList.isVisible) || (!checkResult && formsList.isVisible)) {
        formsList.isVisible = checkResult;
        formsListRef.isVisible = checkResult;
        if (!checkResult && formsList.modelValue) {
            if (Array.isArray(formsList.modelValue)) {
                formsList.modelValue = [];
                formsListRef.modelValue = [];
            } else {
                formsList.modelValue = null;
                formsListRef.modelValue = null;
            }
            formsList.specifiedValue = null;
            formsListRef.modelValue = null;
        }
        if (!isValueChanged) isValueChanged = true;
    }
    return isValueChanged;
    // formsList.isVisible = checkResult;
    // formsListRef.isVisible = checkResult;
    // if (!checkResult && formsList.modelValue) {
    //     if (Array.isArray(formsList.modelValue)) {
    //         formsList.modelValue = [];
    //         formsListRef.modelValue = [];
    //     } else {
    //         formsList.modelValue = null;
    //         formsListRef.modelValue = null;
    //     }
    //     formsList.specifiedValue = null;
    //     formsListRef.modelValue = null;
    // }
    // return true;
}

function processSetFieldVisibilty(
    fieldId: string,
    formDetails: IDataCollectionFormDetails,
    formDetailsRef: IDataCollectionFormDetails,
    checkResult: boolean,
    type: "visibilty" | "disable",
) {
    let result = false;
    if (isEqual(fieldId, formDetails.id, "number")) {
        if (type === "visibilty")
            result = setFieldVisibilty(checkResult, formDetails, formDetailsRef);
        else if (type === "disable")
            result = setFieldDisable(checkResult, formDetails, formDetailsRef);
    }
    return result;
}

function checkIfAtleastOneChildrenHasVisibilty(children: IDataCollectionFormDetails[]) {
    let result = false;
    for (const childrenRow of children) {
        if (childrenRow.isVisible) {
            result = true;
            break;
        }
    }
    return result;
}

function checkIndexOfFormsList(
    formsList: IDataCollectionFormDetails[],
    formsListRef: IDataCollectionFormDetails[],
    fieldId: string,
    checkResult: boolean,
    type: "visibilty" | "disable",
) {
    let isValueChanged = false;
    // let parentFormRowIndex = -1;
    // let childrenFormRowIndex = -1;
    // let formType = "";
    // for (const [rowIndex, row] of formsList.entries()) {
    //     if (row.isHeading && getArrayLength(row.children) > 0) {
    //         let exitOutOfLoop = false;
    //         for (const [childrenRowIndex, childrenRow] of row.children.entries()) {
    //             if (isEqual(fieldId, childrenRow.id, "number")) {
    //                 childrenFormRowIndex = childrenRowIndex;
    //                 parentFormRowIndex = rowIndex;
    //                 formType = "children";
    //                 exitOutOfLoop = true;
    //                 break;
    //             }
    //         }
    //         if (exitOutOfLoop) break;
    //     } else if (!row.isHeading) {
    //         if (isEqual(fieldId, row.id, "number")) {
    //             parentFormRowIndex = rowIndex;
    //             formType = "parent";
    //             break;
    //         }
    //     }
    // }
    // console.log(
    //     "formRowIndex, formType in setFormFieldVisibiltyBasedOnVisbilityEditChecks for edit checks",
    //     parentFormRowIndex,
    //     childrenFormRowIndex,
    //     formType,
    // );
    for (const [rowIndex, row] of formsList.entries()) {
        if (row.isHeading && getArrayLength(row.children) > 0) {
            // let result = false;
            // result = processSetFieldVisibilty(
            //     fieldId,
            //     row,
            //     formsListRef[rowIndex].children[rowIndex],
            //     checkResult,
            //     type,
            // );
            // if (result && !isValueChanged) isValueChanged = true;
            for (const [childrenRowIndex, childrenRow] of row.children.entries()) {
                let childrenResult = false;
                childrenResult = processSetFieldVisibilty(
                    fieldId,
                    childrenRow,
                    formsListRef[rowIndex].children[childrenRowIndex],
                    checkResult,
                    type,
                );
                if (childrenResult && !isValueChanged) isValueChanged = true;
                // if (isEqual(fieldId, childrenRow.id, "number")) {
                //     let result = false;
                //     if (type === "visibilty")
                //         result = setFieldVisibilty(
                //             checkResult,
                //             childrenRow,
                //             formsListRef[rowIndex].children[childrenRowIndex],
                //         );
                //     else if (type === "disable")
                //         result = setFieldDisable(
                //             checkResult,
                //             childrenRow,
                //             formsListRef[rowIndex].children[childrenRowIndex],
                //         );
                //     if (result && !isValueChanged) isValueChanged = true;
                // }
            }
            if (isValueChanged) {
                if (checkIfAtleastOneChildrenHasVisibilty(row.children)) row.isVisible = true;
                else row.isVisible = false;
            }
        } else if (!row.isHeading) {
            let result = false;
            result = processSetFieldVisibilty(
                fieldId,
                row,
                formsListRef[rowIndex],
                checkResult,
                type,
            );
            if (result && !isValueChanged) isValueChanged = true;
            // if (isEqual(fieldId, row.id, "number")) {
            //     let result = false;
            //     if (type === "visibilty")
            //         result = setFieldVisibilty(checkResult, row, formsListRef[rowIndex]);
            //     else if (type === "disable")
            //         result = setFieldDisable(checkResult, row, formsListRef[rowIndex]);
            //     if (result && !isValueChanged) isValueChanged = true;
            // }
        }
    }
    return isValueChanged;
    // if (formType === "children" && parentFormRowIndex >= 0 && childrenFormRowIndex >= 0) {
    //     for (const row of formsList) {
    //         if ()
    //     }
    // } else if (formType === "parent" && parentFormRowIndex >= 0) {
    //     isValueChanged = setFieldVisibilty(
    //         checkResult,
    //         formsList,
    //         formsListRef,
    //         parentFormRowIndex
    //     );
    // }
    // if (dataCollectionRowIndex >= 0) {
    //     if (
    //         (checkResult && !result[dataCollectionRowIndex].isVisible) ||
    //         (!checkResult && result[dataCollectionRowIndex].isVisible)
    //     ) {
    //         result[dataCollectionRowIndex].isVisible = checkResult;
    //         resultRef[dataCollectionRowIndex].isVisible = checkResult;
    //         if (!checkResult && result[dataCollectionRowIndex].modelValue) {
    //             if (Array.isArray(result[dataCollectionRowIndex].modelValue)) {
    //                 result[dataCollectionRowIndex].modelValue = [];
    //                 resultRef[dataCollectionRowIndex].modelValue = [];
    //             } else {
    //                 result[dataCollectionRowIndex].modelValue = null;
    //                 resultRef[dataCollectionRowIndex].modelValue = null;
    //             }
    //             result[dataCollectionRowIndex].specifiedValue = null;
    //             resultRef[dataCollectionRowIndex].modelValue = null;
    //         }
    //         if (!isValueChanged) isValueChanged = true;
    //     }
    // }
}

// function checkIfAllTheResultsForAnEditCheckAreTrue(checkResultDetail: Record<string, boolean>) {
//     let result = true;
//     for (const row of Object.values(checkResultDetail)) {
//         if (!row) {
//             result = false;
//             break;
//         }
//     }
//     return result;
// }

export function setFormFieldVisibiltyBasedOnVisbilityEditChecks(
    dataCollection: IDataCollectionFormDetails[],
    dataCollectionRef: IDataCollectionFormDetails[],
    editCheckResult: TVisibilityEditCheckResult,
) {
    const result = deepClone(dataCollection);
    const resultRef = deepClone(dataCollectionRef);
    let isValueChanged = false;
    for (const [fieldId, checkResultDetail] of Object.entries(editCheckResult)) {
        // const areAllCheckResultTrue = checkIfAllTheResultsForAnEditCheckAreTrue(checkResultDetail);
        // if (!areAllCheckResultTrue) continue;
        const finalResult = checkIndexOfFormsList(
            result,
            resultRef,
            fieldId,
            areAllTrue([...Object.values(checkResultDetail)]),
            "visibilty",
        );
        if (finalResult && !isValueChanged) isValueChanged = true;
        // for (const [, checkResult] of Object.entries(checkResultDetail)) {
        // }
    }
    // if (isValueChanged) {
    //     dataCollection = deepClone(result);
    //     dataCollectionRef = deepClone(resultRef);
    // }
    return {
        isValueChanged,
        formsList: result,
        formsListRef: resultRef,
    };
}

// export function setAssignedFormFieldVisibiltyEditCheckDetails(
//     data: TFormFieldVisibiltyEditCheckData,
// ) {
//     const result: TFormFieldVisibiltyEditCheckData<IFormFieldVisibiltyEditCheckDetails> = {};
//     for (const [fieldKey, editCheckDetails] of Object.entries(data)) {
//         result[fieldKey] = {
//             steps: deepClone(editCheckDetails.steps),
//             actions: deepClone(editCheckDetails.actions),
//             isVisibiltyEditCheck: getArrayLength(editCheckDetails.actions) > 0,
//         };
//     }
//     return result;
// }
export function setAssignedFormFieldVisibiltyEditCheckDetails(
    data: TFormFieldVisibiltyEditCheckData,
) {
    const result: TFormFieldVisibiltyEditCheckData<IFormFieldVisibiltyEditCheckDetails> = {};
    for (const [fieldKey, editCheckDetails] of Object.entries(data)) {
        if (!checkIfKeyExistsInObject(fieldKey, result)) result[fieldKey] = {};
        for (const [editCheckId, editCheckDetailRow] of Object.entries(editCheckDetails)) {
            result[fieldKey][editCheckId] = {
                steps: deepClone(editCheckDetailRow.steps),
                actions: deepClone(editCheckDetailRow.actions),
                isVisibiltyEditCheck: getArrayLength(editCheckDetailRow.actions) > 0,
            };
        }
    }
    return result;
}

// Disable edit check
async function setDisableEditCheckContent(params: {
    fieldId: string;
    dataCollectionRow: IDataCollectionFormDetails;
    rowValue: IFormFieldDisableEditCheckDetails;
    formsList: IDataCollectionFormDetails[];
    result: TDisableEditCheckResult;
    editCheckId: string;
    checkForVisitId: boolean;
}) {
    const {
        dataCollectionRow,
        fieldId,
        formsList,
        rowValue,
        result,
        editCheckId,
        checkForVisitId,
    } = params;
    let exitOutOfLoop = false;
    if (isEqual(fieldId, dataCollectionRow.id, "number")) {
        const stepDetails = await processEditCheckSteps(rowValue.steps, formsList);
        const editCheckFieldId = processEditCheckActions(
            rowValue.actions,
            dataCollectionRow,
            checkForVisitId,
        );
        const finalEditCheckFieldId =
            editCheckFieldId !== -1 ? editCheckFieldId : dataCollectionRow.id;
        const editCheckResult = performVisibilityEditCheck(stepDetails);
        if (!checkIfKeyExistsInObject(finalEditCheckFieldId, result))
            result[finalEditCheckFieldId] = {};
        result[finalEditCheckFieldId][editCheckId] =
            editCheckFieldId !== -1 ? editCheckResult : false;
        // const derivationResult = performDerivation(
        //     stepDetails,
        //     expressionType,
        //     expressionFormat,
        // );
        // console.log(
        //     "derivationResult in setDisableEditCheckContent for disable edit checks",
        //     derivationResult,
        // );
        // if (derivationResult) dataCollectionRow.modelValue = derivationResult;
        // else dataCollectionRow.modelValue = null;
        exitOutOfLoop = true;
    }
    return exitOutOfLoop;
}

export async function processFormFieldDisableEditChecks(
    params: IProcessFormFieldDisableEditCheckParam,
) {
    const finalResult: TDisableEditCheckResult = {};
    if (getArrayLength(Object.keys(params.assignedFieldEditChecks)) > 0) {
        for (const [rowKey, rowValue] of Object.entries(params.assignedFieldEditChecks)) {
            const [, fieldId] = rowKey.split("_");
            for (const [editCheckId, editCheckDetailRow] of Object.entries(rowValue)) {
                if (!editCheckDetailRow.isDisableEditCheck) continue;
                for (const dataCollectionFormFieldRow of Object.values(params.formsList)) {
                    for (const dataCollectionRow of dataCollectionFormFieldRow) {
                        if (
                            dataCollectionRow.isHeading &&
                            getArrayLength(dataCollectionRow.children) > 0
                        ) {
                            for (const childrenRow of dataCollectionRow.children) {
                                const result = await setDisableEditCheckContent({
                                    dataCollectionRow: childrenRow,
                                    fieldId,
                                    formsList: dataCollectionFormFieldRow,
                                    result: finalResult,
                                    rowValue: editCheckDetailRow,
                                    editCheckId,
                                    checkForVisitId: params.checkForVisitId,
                                });
                                if (result) break;
                            }
                        } else if (!dataCollectionRow.isHeading) {
                            const result = await setDisableEditCheckContent({
                                dataCollectionRow,
                                fieldId,
                                formsList: dataCollectionFormFieldRow,
                                result: finalResult,
                                rowValue: editCheckDetailRow,
                                editCheckId,
                                checkForVisitId: params.checkForVisitId,
                            });
                            if (result) break;
                        }
                    }
                }
            }
        }
    }
    return finalResult;
}

function setFieldDisable(
    checkResult: boolean,
    formsList: IDataCollectionFormDetails,
    formsListRef: IDataCollectionFormDetails,
) {
    let isValueChanged = false;
    if ((checkResult && !formsList.disabled) || (!checkResult && formsList.disabled)) {
        formsList.disabled = isFieldDisabled(
            checkResult || formsList.isFrozen || formsList.isLocked,
        );
        formsListRef.disabled = isFieldDisabled(
            checkResult || formsListRef.isFrozen || formsListRef.isLocked,
        );
        if (checkResult && formsList.modelValue) {
            if (Array.isArray(formsList.modelValue)) {
                formsList.modelValue = [];
                formsListRef.modelValue = [];
            } else {
                formsList.modelValue = null;
                formsListRef.modelValue = null;
            }
            formsList.specifiedValue = null;
            formsListRef.modelValue = null;
        }
        if (!isValueChanged) isValueChanged = true;
    }
    return isValueChanged;
}

export function setFormFieldDisableBasedOnDisableEditChecks(
    dataCollection: IDataCollectionFormDetails[],
    dataCollectionRef: IDataCollectionFormDetails[],
    editCheckResult: TDisableEditCheckResult,
) {
    const result = deepClone(dataCollection);
    const resultRef = deepClone(dataCollectionRef);
    let isValueChanged = false;
    for (const [fieldId, checkResultDetail] of Object.entries(editCheckResult)) {
        for (const [, checkResult] of Object.entries(checkResultDetail)) {
            const finalResult = checkIndexOfFormsList(
                result,
                resultRef,
                fieldId,
                checkResult,
                "disable",
            );
            if (finalResult && !isValueChanged) isValueChanged = true;
        }
    }
    // if (isValueChanged) {
    //     dataCollection = deepClone(result);
    //     dataCollectionRef = deepClone(resultRef);
    // }
    return {
        isValueChanged,
        formsList: result,
        formsListRef: resultRef,
    };
}

export function setAssignedFormFieldDisableEditCheckDetails(data: TFormFieldDisableEditCheckData) {
    const result: TFormFieldDisableEditCheckData<IFormFieldDisableEditCheckDetails> = {};
    for (const [fieldKey, editCheckDetails] of Object.entries(data)) {
        if (!checkIfKeyExistsInObject(fieldKey, result)) result[fieldKey] = {};
        for (const [editCheckId, editCheckDetailRow] of Object.entries(editCheckDetails)) {
            result[fieldKey][editCheckId] = {
                steps: deepClone(editCheckDetailRow.steps),
                actions: deepClone(editCheckDetailRow.actions),
                isDisableEditCheck: getArrayLength(editCheckDetailRow.actions) > 0,
            };
        }
    }
    return result;
}

// Non log data entry
export function setAssignedFormFieldNonLogDataEditCheckDetails(
    data: TFormFieldNonLogDataEditCheckData,
) {
    const result: TFormFieldNonLogDataEditCheckData<IFormFieldNonLogDataEditCheckDetails> = {};
    for (const [fieldKey, editCheckDetails] of Object.entries(data)) {
        result[fieldKey] = {
            steps: deepClone(editCheckDetails.steps),
            actions: deepClone(editCheckDetails.actions),
            isNonLogDataEditCheck: getArrayLength(editCheckDetails.actions) > 0,
        };
    }
    return result;
}

function getConstantValueFromAssignedFieldExpression(
    fieldId: number,
    assignedFieldEditChecks: TFormFieldNonLogDataEditCheckData<IFormFieldNonLogDataEditCheckDetails>,
) {
    let result = null;
    mainLoop: for (const [editCheckFieldRowId, editCheckDetails] of Object.entries(
        assignedFieldEditChecks,
    )) {
        const [, editCheckFieldId] = editCheckFieldRowId.split("_");
        if (isEqual(editCheckFieldId, fieldId, "number")) {
            for (const stepRow of editCheckDetails.steps) {
                if (stepRow.type === 3 && stepRow.value) {
                    // FIXME: if the value is other than yes/no or totally different address this.
                    result = stepRow.value;
                    break mainLoop;
                }
            }
            // for (const [, editCheckDetailRow] of Object.entries(editCheckDetails)) {
            //     console.log("editCheckDetailRow for non log value", editCheckDetailRow);
            //     for (const stepRow of editCheckDetailRow.steps) {
            //         if (stepRow.type === 3 && stepRow.value) {
            //             result = stepRow.value;
            //             break mainLoop;
            //         }
            //     }
            // }
        }
    }
    return result;
}

export function getLogDataEntryHideCheckValue(
    formsList: TDataCollectionFormDetails,
    assignedFieldEditChecks: TFormFieldNonLogDataEditCheckData<IFormFieldNonLogDataEditCheckDetails>,
) {
    const result: Record<string, TNullableString> = {};
    commonLoopForBulkOperation(formsList, (formDetails: IDataCollectionFormDetails) => {
        if (formDetails.isHeading && getArrayLength(formDetails.children) > 0) {
            for (const childrenRow of formDetails.children) {
                if (!childrenRow.isLogDataEntry) {
                    if (!checkIfKeyExistsInObject(childrenRow.id, result))
                        result[childrenRow.id] = null;
                    result[childrenRow.id] = getConstantValueFromAssignedFieldExpression(
                        childrenRow.id,
                        assignedFieldEditChecks,
                    );
                }
            }
        } else if (!formDetails.isHeading) {
            if (!formDetails.isLogDataEntry) {
                if (!checkIfKeyExistsInObject(formDetails.id, result))
                    result[formDetails.id] = null;
                result[formDetails.id] = getConstantValueFromAssignedFieldExpression(
                    formDetails.id,
                    assignedFieldEditChecks,
                );
            }
        }
    });
    return result;
}

export function getLogDataEntryHideCheckValueWithoutForm(
    assignedFieldEditChecks: TFormFieldNonLogDataEditCheckData<IFormFieldNonLogDataEditCheckDetails>,
    nonLogDataFieldIds: number[],
) {
    const result: Record<string, TNullableString> = {};
    let checkValue: TNullableString = null;
    for (const [, editCheckDetails] of Object.entries(assignedFieldEditChecks)) {
        if (!editCheckDetails.isNonLogDataEditCheck) continue;
        for (const stepRow of editCheckDetails.steps) {
            if (stepRow.type === 3 && stepRow.value) checkValue = stepRow.value;
        }
        for (const actionRow of editCheckDetails.actions) {
            if (nonLogDataFieldIds.includes(actionRow.fieldId)) {
                result[actionRow.fieldId] = checkValue;
                break;
            }
        }
    }
    return result;
}
