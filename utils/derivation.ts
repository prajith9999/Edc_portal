import type {
    IFormFieldDerivationActionData,
    IFormFieldDerivationStepData,
    TDerivationResult,
    TFormFieldDerivationData,
} from "~/services/apis/handlers/types/data-collection-types";
import type { TDataCollectionFormDetails, TNullableNumber, TNullableString } from "~/types/common";
import type {
    IDataCollectionFormDetails,
    IFormFieldDerivationDetails,
    TDerivationDetails,
    TModelValue,
} from "~/types/form-generation";
import { FetchValue, Mean, type IExpressionFormat } from "./derivation-expression";
import { processIsEqualTo, processIsGreaterThan, processIsLessThan } from "./edit-check";
import useDataCollectionStore from "~/stores/data-collection";

export function derivationParameters(expression: string) {
    // Regular expression to match words inside square brackets
    const regex = /\[([a-zA-Z_][a-zA-Z0-9_]*)\]/g;

    const matches = [...expression.matchAll(regex)];
    return [...new Set(matches.map((match) => match[1]))];
}

export const removeDerivationParameterBrackets = (expression: string) =>
    expression.replaceAll("[", "").replaceAll("]", "");

function checkIfAllParamsAreNotNull(
    parameters: string[],
    expressionValues: Record<string, TNullableString | TNullableNumber>,
) {
    let result = true;
    for (const parameter of parameters) {
        if (
            (checkIfKeyExistsInObject(parameter, expressionValues) &&
                (expressionValues[parameter] === null ||
                    typeof expressionValues[parameter] === "undefined")) ||
            !checkIfKeyExistsInObject(parameter, expressionValues)
        ) {
            result = false;
            break;
        }
    }
    return result;
}

export function evaluateDerivationExpression(
    expression: string,
    expressionValues: Record<string, TNullableString | TNullableNumber>,
) {
    // Using Function constructor
    // const parameters = derivationParameters(expression);
    // console.log("parameters", parameters);
    // const actualExpression = removeDerivationParameterBrackets(expression);
    // console.log("actualExpression", actualExpression);
    // const actualParameters: string[] = [];
    // for (const parameter of parameters) {
    //     if (expressionValues[parameter]) actualParameters.push(String(expressionValues[parameter]));
    // }
    // console.log("actualParameters", actualParameters);
    // const functionExpression = new Function(...actualParameters, actualExpression);
    // return functionExpression();

    // Using eval
    const parameters = derivationParameters(expression);
    if (!checkIfAllParamsAreNotNull(parameters, expressionValues)) return null;
    let finalExpression = expression;
    for (const parameter of parameters) {
        if (
            checkIfKeyExistsInObject(parameter, expressionValues) &&
            (expressionValues[parameter] !== null ||
                typeof expressionValues[parameter] !== "undefined")
        )
            finalExpression = finalExpression.replaceAll(
                `[${parameter}]`,
                String(expressionValues[parameter]),
            );
    }
    // eslint-disable-next-line no-eval
    return typeof window !== "undefined" ? window.eval(finalExpression) : null;
}

function dataCollectionDetailsByFieldId(
    fieldId: number,
    dataCollectionRow: IDataCollectionFormDetails,
) {
    let exitOutOfLoop = false;
    let result: IDataCollectionFormDetails | null = null;
    if (isEqual(fieldId, dataCollectionRow.id, "number")) {
        result = deepClone(dataCollectionRow);
        exitOutOfLoop = true;
    }
    return {
        exitOutOfLoop,
        result,
    };
}

// Processing of derivation for data collection entry
export function getFieldDetailsById(formsList: IDataCollectionFormDetails[], fieldId: number) {
    let finalResult: IDataCollectionFormDetails | null = null;
    for (const dataCollectionRow of formsList) {
        if (dataCollectionRow.isHeading && getArrayLength(dataCollectionRow.children) > 0) {
            for (const childrenRow of dataCollectionRow.children) {
                const { exitOutOfLoop, result } = dataCollectionDetailsByFieldId(
                    fieldId,
                    childrenRow,
                );
                if (exitOutOfLoop) {
                    finalResult = result;
                    break;
                }
            }
        } else if (!dataCollectionRow.isHeading) {
            const { exitOutOfLoop, result } = dataCollectionDetailsByFieldId(
                fieldId,
                dataCollectionRow,
            );
            if (exitOutOfLoop) {
                finalResult = result;
                break;
            }
        }
    }
    return finalResult;
}

type TDerivationExpressionType =
    | "BSA"
    | "BMI"
    | "TotalSum"
    | "Mean"
    | "FetchValue"
    | "And"
    | "Or"
    | "LessThan"
    | "GreaterThan"
    | "EqualTo"
    | "SetValue"
    | "AlternateValue"
    | "";

function getDerivationExpressionTypes(steps: IFormFieldDerivationStepData[]) {
    const type: TDerivationExpressionType[] = [];
    for (const row of steps) {
        if (row.type === 2) {
            type.includes(row.derivationFunctionName as TDerivationExpressionType);
            break;
        }
    }
    return type;
}

function getKeyByFormFieldLabelAndDerivationExpressionType(
    dataCollectionDetails: IDataCollectionFormDetails,
) {
    let key = "";
    const checkString = convertToLowerCase(dataCollectionDetails.label || "");
    if (checkString.includes("weight")) key = "weight";
    else if (checkString.includes("height")) key = "height";
    return key;
}

function getUnitByFormFieldLabelAndDerivationExpressionType(
    dataCollectionDetails: IDataCollectionFormDetails,
) {
    let unit = "";
    const checkString = convertToLowerCase(dataCollectionDetails.label || "");
    if (checkString.includes("cm")) unit = "cm";
    else if (checkString.includes("m")) unit = "m";
    else if (checkString.includes("kg")) unit = "kg";
    return unit;
}

// function processDerivationSteps(
//     steps: IFormFieldDerivationStepData[],
//     formsList: IDataCollectionFormDetails[],
// ) {
//     const result: TDerivationDetails = {};
//     let paramCount = 1;
//     for (const row of steps) {
//         console.log("row in processDerivationSteps for derivation", row);
//         switch (row.type) {
//             case 1: {
//                 // if (isEqual(row.fieldId, dataCollectionDetails.id, "number")) {
//                 //     const paramKey =
//                 //         getKeyByFormFieldLabelAndDerivationExpressionType(dataCollectionDetails);
//                 //     console.log("paramKey in processDerivationSteps for derivation", paramKey);
//                 //     // if (paramKey) result[paramKey] = dataCollectionDetails.modelValue;
//                 //     if (paramKey) result[paramKey] = ;
//                 //     result[`unit${unitCount}`] =
//                 //         getUnitByFormFieldLabelAndDerivationExpressionType(dataCollectionDetails);
//                 //     unitCount++;
//                 // }
//                 const fieldDetails = getFieldDetailsById(formsList, row.fieldId);
//                 if (fieldDetails) {
//                     const paramKey =
//                         getKeyByFormFieldLabelAndDerivationExpressionType(fieldDetails);
//                     console.log("paramKey in processDerivationSteps for derivation", paramKey);
//                     // if (paramKey) result[paramKey] = dataCollectionDetails.modelValue;
//                     if (paramKey) {
//                         result[paramKey] = fieldDetails.modelValue;
//                         result[`${paramKey}Unit`] =
//                             getUnitByFormFieldLabelAndDerivationExpressionType(fieldDetails);
//                     } else {
//                         result[`param${paramCount}`] = fieldDetails.modelValue;
//                         paramCount++;
//                     }
//                     // result[`unit${unitCount}`] =
//                     //     getUnitByFormFieldLabelAndDerivationExpressionType(fieldDetails);
//                 }
//                 break;
//             }
//             case 2: {
//                 if (row.derivationFunctionName) {
//                     result["function"] = row.derivationFunctionName;
//                 }
//                 break;
//             }
//             case 3: {
//                 if (row.value) {
//                     result["constant"] = row.value;
//                 }
//                 break;
//             }
//         }
//     }
//     return deepClone(result);
// }
function processDerivationSteps(
    steps: IFormFieldDerivationStepData[],
    formsList: IDataCollectionFormDetails[],
) {
    const result: Array<TDerivationDetails> = [];
    let stepsGrouping: TDerivationDetails = {};
    let paramsCount = 1;
    for (const row of steps) {
        switch (row.type) {
            case 1: {
                const fieldDetails = getFieldDetailsById(formsList, row.fieldId);
                if (fieldDetails) {
                    const paramKey =
                        getKeyByFormFieldLabelAndDerivationExpressionType(fieldDetails);
                    // if (paramKey) result[paramKey] = dataCollectionDetails.modelValue;
                    if (paramKey) {
                        stepsGrouping[paramKey] = fieldDetails.modelValue;
                        stepsGrouping[`${paramKey}Unit`] =
                            getUnitByFormFieldLabelAndDerivationExpressionType(fieldDetails);
                    } else {
                        stepsGrouping[`param${paramsCount}`] = fieldDetails.modelValue;
                        paramsCount++;
                    }
                } else if (row.value) {
                    stepsGrouping[`param${paramsCount}`] = row.value;
                    paramsCount++;
                }
                break;
            }
            case 2: {
                if (row.derivationFunctionName) {
                    if (
                        convertToLowerCase(row.derivationFunctionName) === "and" ||
                        convertToLowerCase(row.derivationFunctionName) === "or" ||
                        convertToLowerCase(row.derivationFunctionName) === "setvalue"
                    ) {
                        result.push(
                            deepClone({
                                ...stepsGrouping,
                                // action: ["setvalue", "alternatevalue"].includes(
                                //     convertToLowerCase(row.derivationFunctionName),
                                // )
                                //     ? "set"
                                //     : "expression",
                                action: "expression",
                            }),
                        );
                        if (convertToLowerCase(row.derivationFunctionName) !== "setvalue")
                            result.push(
                                deepClone({
                                    function1: row.derivationFunctionName,
                                    action: "join",
                                }),
                            );
                        stepsGrouping = {};
                        paramsCount = 1;
                    } else if (
                        convertToLowerCase(row.derivationFunctionName) !== "setvalue" &&
                        convertToLowerCase(row.derivationFunctionName) !== "alternatevalue"
                    )
                        stepsGrouping["function1"] = row.derivationFunctionName;
                    if (
                        convertToLowerCase(row.derivationFunctionName) === "setvalue" ||
                        convertToLowerCase(row.derivationFunctionName) === "alternatevalue"
                    ) {
                        if (convertToLowerCase(row.derivationFunctionName) === "alternatevalue")
                            stepsGrouping["function2"] = row.derivationFunctionName;
                        else stepsGrouping["function1"] = row.derivationFunctionName;
                    }
                    //     else if (convertToLowerCase(row.derivationFunctionName) === "alternatevalue")
                    //     stepsGrouping["function2"] = row.derivationFunctionName;
                    // else stepsGrouping["function1"] = row.derivationFunctionName;
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
        result.push(
            deepClone({
                ...stepsGrouping,
                action: ["setvalue", "alternatevalue"].includes(
                    checkIfKeyExistsInObject("function1", stepsGrouping)
                        ? convertToLowerCase(stepsGrouping["function1"])
                        : "",
                )
                    ? "set"
                    : "expression",
            }),
        );
    return deepClone(result);
}

// function processDerivationActions(
//     actions: IFormFieldDerivationActionData[],
//     dataCollectionDetails: IDataCollectionFormDetails,
// ) {
//     let derivedFieldId = -1;
//     if (actions.id && isEqual(actions.fieldId, dataCollectionDetails.id, "number")) {
//         derivedFieldId = dataCollectionDetails.id;
//     }
//     return derivedFieldId;
// }

function checkIfFolderIdMatches(action: IFormFieldDerivationActionData, checkForVisitId: boolean) {
    const dataCollectionStore = useDataCollectionStore();
    let result = false;
    if (!checkForVisitId) result = true;
    if (!action.folderId) result = true;
    else if (action.folderId && dataCollectionStore.queryParamDetails.folderId === action.folderId)
        result = true;
    return result;
}

function processDerivationActions(
    actions: IFormFieldDerivationActionData[],
    dataCollectionDetails: IDataCollectionFormDetails,
    checkForVisitId: boolean,
) {
    let derivedFieldId = -1;
    if (getArrayLength(actions) > 0) {
        for (const action of actions) {
            if (
                action.id &&
                isEqual(action.fieldId, dataCollectionDetails.id, "number") &&
                checkIfFolderIdMatches(action, checkForVisitId)
            ) {
                derivedFieldId = dataCollectionDetails.id;
                break;
            }
        }
    }
    return derivedFieldId;
}

// function performDerivation(
//     stepDetails: TDerivationDetails,
//     expressionType: TDerivationExpressionType[],
//     formatDetails: IExpressionFormat,
// ) {
//     let result;
//     console.log("stepDetails in performDerivation for derivation", stepDetails);
//     console.log("expressionType in performDerivation for derivation", expressionType);
//     console.log("formatDetails in performDerivation for derivation", formatDetails);
//     switch (expressionType) {
//         case "BMI": {
//             if (
//                 checkIfKeyExistsInObject("weight", stepDetails) &&
//                 checkIfKeyExistsInObject("height", stepDetails) &&
//                 checkIfKeyExistsInObject("heightUnit", stepDetails)
//             ) {
//                 const derivationResult = BMI(
//                     stepDetails["weight"],
//                     stepDetails["height"],
//                     stepDetails["heightUnit"],
//                 );
//                 if (
//                     derivationResult &&
//                     formatDetails.type === "number" &&
//                     formatDetails.afterDecimalPlace
//                 )
//                     result = Number(
//                         Number(derivationResult).toFixed(formatDetails.afterDecimalPlace),
//                     );
//             }
//             break;
//         }
//         case "BSA": {
//             if (
//                 checkIfKeyExistsInObject("weight", stepDetails) &&
//                 checkIfKeyExistsInObject("height", stepDetails)
//             ) {
//                 const derivationResult = BSA(stepDetails["weight"], stepDetails["height"]);
//                 if (
//                     derivationResult &&
//                     formatDetails.type === "number" &&
//                     formatDetails.afterDecimalPlace
//                 )
//                     result = Number(
//                         Number(derivationResult).toFixed(formatDetails.afterDecimalPlace),
//                     );
//             }
//             break;
//         }
//         case "TotalSum": {
//             if (checkIfSimilarKeyExistsInObject("param", stepDetails)) {
//                 const fieldSums = Object.entries(stepDetails)
//                     .filter(([key]) => key.includes("param"))
//                     .map(([, value]) => value);
//                 const derivationResult = TotalSum(
//                     fieldSums.every((number) => number === null) ? [] : fieldSums,
//                 );
//                 if (derivationResult && formatDetails.type === "number")
//                     result = Number(derivationResult);
//             }
//             break;
//         }
//         case "Mean": {
//             if (checkIfSimilarKeyExistsInObject("param", stepDetails)) {
//                 const fieldSums = Object.entries(stepDetails)
//                     .filter(([key]) => key.includes("param"))
//                     .map(([, value]) => value);
//                 const derivationResult = Mean(
//                     fieldSums.every((number) => number === null) ? [] : fieldSums,
//                 );
//                 if (derivationResult && formatDetails.type === "number")
//                     result = Number(derivationResult);
//             }
//             break;
//         }
//         case "FetchValue": {
//             if (checkIfSimilarKeyExistsInObject("param1", stepDetails)) {
//                 const derivationResult = FetchValue(stepDetails["param1"]);
//                 if (derivationResult && formatDetails.type) result = Number(derivationResult);
//             }
//             break;
//         }
//     }
//     console.log("result in performDerivation for derivation", result);
//     return result;
// }

function performDerivationExpression(row: TDerivationDetails, formatDetails: IExpressionFormat) {
    let result = false;
    let isFinalResult = true;
    let finalValue;
    switch (row["function1"]) {
        case "EqualTo": {
            result = processIsEqualTo(
                Object.entries(row)
                    .filter(([key]) => !["function1", "function2", "action"].includes(key))
                    .map((arrRow: any) => arrRow[1]) as string[],
            );
            break;
        }
        case "LessThan": {
            result = processIsLessThan(
                Object.entries(row)
                    .filter(([key]) => !["function1", "function2", "action"].includes(key))
                    .map((arrRow: any) => arrRow[1]) as string[],
            );
            break;
        }
        case "GreaterThan": {
            result = processIsGreaterThan(
                Object.entries(row)
                    .filter(([key]) => !["function1", "function2", "action"].includes(key))
                    .map((arrRow: any) => arrRow[1]) as string[],
            );
            break;
        }
        case "BMI": {
            if (
                checkIfKeyExistsInObject("weight", row) &&
                checkIfKeyExistsInObject("height", row) &&
                checkIfKeyExistsInObject("heightUnit", row)
            ) {
                const derivationResult = BMI(row["weight"], row["height"], row["heightUnit"]);
                if (
                    derivationResult &&
                    formatDetails.type === "number" &&
                    formatDetails.afterDecimalPlace
                ) {
                    finalValue = Number(
                        Number(derivationResult).toFixed(formatDetails.afterDecimalPlace),
                    );
                    isFinalResult = true;
                }
            }
            break;
        }
        case "BSA": {
            if (
                checkIfKeyExistsInObject("weight", row) &&
                checkIfKeyExistsInObject("height", row)
            ) {
                const derivationResult = BSA(row["weight"], row["height"]);
                if (
                    derivationResult &&
                    formatDetails.type === "number" &&
                    formatDetails.afterDecimalPlace
                ) {
                    finalValue = Number(
                        Number(derivationResult).toFixed(formatDetails.afterDecimalPlace),
                    );
                    isFinalResult = true;
                }
            }
            break;
        }
        case "TotalSum": {
            if (checkIfSimilarKeyExistsInObject("param", row)) {
                const fieldSums = Object.entries(row)
                    .filter(([key]) => key.includes("param"))
                    .map(([, value]) => value);
                const derivationResult = TotalSum(
                    fieldSums.every((number) => number === null) ? [] : fieldSums,
                );
                if (derivationResult && formatDetails.type === "number") {
                    finalValue = Number(derivationResult);
                    isFinalResult = true;
                }
            }
            break;
        }
        case "Mean": {
            if (checkIfSimilarKeyExistsInObject("param", row)) {
                const fieldSums = Object.entries(row)
                    .filter(([key]) => key.includes("param"))
                    .map(([, value]) => value);
                const derivationResult = Mean(fieldSums.includes(null) ? [] : fieldSums);
                if (derivationResult && formatDetails.type === "number") {
                    finalValue = Math.ceil(Number(derivationResult));
                    isFinalResult = true;
                }
            }
            break;
        }
        case "FetchValue": {
            if (checkIfSimilarKeyExistsInObject("param1", row)) {
                const derivationResult = FetchValue(row["param1"]);
                if (derivationResult && formatDetails.type) {
                    finalValue = derivationResult;
                    isFinalResult = true;
                }
            }
            break;
        }
    }
    return { result, isFinalResult, finalValue };
}

// function processDerivationExpression(row: TDerivationDetails, formatDetails: IExpressionFormat) {
//     const {finalValue, isFinalResult, result } = ;

// }

function performDerivation(
    stepDetails: Array<TDerivationDetails>,
    _expressionTypes: TDerivationExpressionType[],
    formatDetails: IExpressionFormat,
) {
    let result = false;
    const enteredCheckFieldData: TModelValue[] = [];
    let previousAction = "";
    let finalValue;
    let setValue;
    let alternateValue;
    const andConditions: boolean[] = [];
    const orConditions: boolean[] = [];
    for (const row of stepDetails) {
        if (row["action"] === "expression") {
            //     if (
            //         ||
            //        (checkIfKeyExistsInObject("function2", row) &&
            //            row["function2"] === "AlternateValue" &&
            //            !result)
            //    ) {

            //    }
            const processResult = performDerivationExpression(row, formatDetails);
            if (row["function1"] === "LessThan" || row["function1"] === "GreaterThan")
                enteredCheckFieldData.push(row["param1"]);
            result = processResult.result;
            if (processResult.isFinalResult) finalValue = processResult.finalValue;
        } else if (row["action"] === "join") {
            if (row["function1"] === "And") andConditions.push(result);
            else if (row["function1"] === "Or") orConditions.push(result);
            previousAction = row["function1"];
            result = false;
        } else if (
            row["action"] === "set"
            // && row["param1"]
        ) {
            if (previousAction === "And") andConditions.push(result);
            else if (previousAction === "Or") orConditions.push(result);
            result = false;
            if (row["function1"] === "SetValue") {
                setValue = row["param1"];
                if (row["function2"] === "AlternateValue") alternateValue = row["param2"];
            }
        }
    }
    const isAndConditionPresent = getArrayLength(andConditions) > 0;
    const isOrConditionPresent = getArrayLength(orConditions) > 0;
    if (isAndConditionPresent || isOrConditionPresent) {
        if (
            areAllTrue([
                isAndConditionPresent ? areAllTrue(andConditions) : true,
                isOrConditionPresent ? isAnyTrue(orConditions) : false,
            ])
        )
            return finalValue || setValue;
        // Newly added condition below
        else if (
            isAndConditionPresent &&
            andConditions[0] &&
            !isOrConditionPresent &&
            !areAllTrue(andConditions) &&
            enteredCheckFieldData.some((row) => row !== null)
        ) {
            return finalValue || setValue || undefined;
        }
    } else if (!isAndConditionPresent && !isOrConditionPresent) return finalValue;
    if (
        areAllTrue(andConditions) &&
        enteredCheckFieldData.some((row) => row !== null) &&
        alternateValue
    )
        return alternateValue;
    return undefined;
}

function setDerivationContent(params: {
    fieldId: string;
    dataCollectionRow: IDataCollectionFormDetails;
    rowValue: IFormFieldDerivationDetails;
    formsList: IDataCollectionFormDetails[];
    result: TDerivationResult;
    derivationId: string;
    checkForVisitId: boolean;
}) {
    let exitOutOfLoop = false;
    const {
        dataCollectionRow,
        fieldId,
        formsList,
        rowValue,
        checkForVisitId,
        derivationId,
        result,
    } = params;
    if (isEqual(fieldId, dataCollectionRow.id, "number")) {
        const expressionTypes = getDerivationExpressionTypes(rowValue.steps);
        const stepDetails = processDerivationSteps(rowValue.steps, formsList);
        const derivationFieldId = processDerivationActions(
            rowValue.actions,
            dataCollectionRow,
            checkForVisitId,
        );

        const finalDerivationFieldId =
            derivationFieldId !== -1 ? derivationFieldId : dataCollectionRow.id;
        if (!checkIfKeyExistsInObject(finalDerivationFieldId, result))
            result[finalDerivationFieldId] = {};

        const expressionFormat = convertExpressionResultToDefinedFormat(dataCollectionRow);
        const derivationResult = performDerivation(stepDetails, expressionTypes, expressionFormat);
        result[finalDerivationFieldId][derivationId] =
            derivationFieldId !== -1 ? derivationResult : false;

        // if (derivationResult) params.dataCollectionRow.modelValue = derivationResult;
        // else params.dataCollectionRow.modelValue = null;
        exitOutOfLoop = true;
    }
    return exitOutOfLoop;
}

interface IProcessFormFieldDerivationParam {
    assignedFieldDerivations: TFormFieldDerivationData<IFormFieldDerivationDetails>;
    // formsList: IDataCollectionFormDetails[];
    formsList: TDataCollectionFormDetails;
    runOnceFieldIds: number[];
    checkForVisitId: boolean;
}
export function processFormFieldDerivation(params: IProcessFormFieldDerivationParam) {
    const finalResult: TDerivationResult = {};
    if (getArrayLength(Object.keys(params.assignedFieldDerivations)) > 0) {
        const copiedFormsList = deepClone(params.formsList) as TDataCollectionFormDetails;
        for (const [rowKey, rowValue] of Object.entries(params.assignedFieldDerivations)) {
            const [, fieldId] = rowKey.split("_");
            for (const [derivationId, derivationDetailRow] of Object.entries(rowValue)) {
                if (!derivationDetailRow.isDerivation) continue;
                if (
                    derivationDetailRow.isEnabled &&
                    !params.runOnceFieldIds.includes(Number(fieldId))
                )
                    params.runOnceFieldIds.push(Number(fieldId));
                else if (params.runOnceFieldIds.includes(Number(fieldId))) continue;
                for (const dataCollectionFormFieldKey of Object.keys(copiedFormsList)) {
                    for (const dataCollectionRow of copiedFormsList[dataCollectionFormFieldKey]) {
                        if (
                            dataCollectionRow.isHeading &&
                            getArrayLength(dataCollectionRow.children) > 0
                        ) {
                            for (const childrenRow of dataCollectionRow.children) {
                                if (
                                    setDerivationContent({
                                        dataCollectionRow: childrenRow,
                                        fieldId,
                                        formsList: copiedFormsList[dataCollectionFormFieldKey], // params.formsList,
                                        rowValue: derivationDetailRow,
                                        result: finalResult,
                                        derivationId,
                                        checkForVisitId: params.checkForVisitId,
                                    })
                                )
                                    break;
                            }
                        } else if (!dataCollectionRow.isHeading) {
                            if (
                                setDerivationContent({
                                    dataCollectionRow,
                                    fieldId,
                                    formsList: copiedFormsList[dataCollectionFormFieldKey], // params.formsList,
                                    rowValue: derivationDetailRow,
                                    result: finalResult,
                                    derivationId,
                                    checkForVisitId: params.checkForVisitId,
                                })
                            )
                                break;
                        }
                    }
                }
            }
        }
        processSetDerivationResultToModel(copiedFormsList, finalResult);
        return copiedFormsList;
    }
}

function setDerivationResultToModel(
    finalResult: TDerivationResult,
    formDetails: IDataCollectionFormDetails,
) {
    let result = false;
    mainLoop: for (const [fieldId, derivationDetails] of Object.entries(finalResult)) {
        if (isEqual(fieldId, formDetails.id, "number")) {
            for (const derivationCheckResult of Object.values(derivationDetails)) {
                if (derivationCheckResult) {
                    result = true;
                    formDetails.modelValue = derivationCheckResult;
                    break;
                }
            }
            if (!result) {
                formDetails.modelValue = null;
                break mainLoop;
            }
        }
    }
}

function processSetDerivationResultToModel(
    copiedFormsList: TDataCollectionFormDetails,
    finalResult: TDerivationResult,
) {
    for (const copiedFormsListGroupId of Object.keys(copiedFormsList)) {
        for (const copiedFormRow of copiedFormsList[copiedFormsListGroupId]) {
            if (copiedFormRow.isHeading && getArrayLength(copiedFormRow.children) > 0) {
                for (const childrenRow of copiedFormRow.children) {
                    setDerivationResultToModel(finalResult, childrenRow);
                }
            } else if (!copiedFormRow.isHeading) {
                setDerivationResultToModel(finalResult, copiedFormRow);
            }
        }
    }
}

function checkIfDerivationFieldAndIsEnabled(actions: IFormFieldDerivationActionData[]) {
    let isDerivation = false;
    let isEnabled = false;
    if (getArrayLength(actions) > 0) isDerivation = true;
    for (const action of actions) {
        if (action.id && action.isEnableField) {
            isEnabled = true;
            break;
        }
    }
    return {
        isDerivation,
        isEnabled,
    };
}

export function setAssignedDerivationDetails(data: TFormFieldDerivationData) {
    const result: TFormFieldDerivationData<IFormFieldDerivationDetails> = {};
    for (const [fieldKey, derivationDetails] of Object.entries(data)) {
        if (!checkIfKeyExistsInObject(fieldKey, result)) result[fieldKey] = {};
        for (const [derivationId, derivationDetailRow] of Object.entries(derivationDetails)) {
            const { isDerivation, isEnabled } = checkIfDerivationFieldAndIsEnabled(
                derivationDetailRow.actions,
            );
            result[fieldKey][derivationId] = {
                steps: deepClone(derivationDetailRow.steps),
                actions: deepClone(derivationDetailRow.actions),
                // isDerivation: !!(
                //     checkIfKeyExistsInObject("id", derivationDetails.actions) &&
                //     derivationDetails.actions.id
                // ),
                isDerivation,
                isEnabled,
            };
        }
    }
    return result;
}

function deriveOnlyIfValidActionExists(
    actions: IFormFieldDerivationActionData[],
    checkForVisitId: boolean,
    fieldId: number,
) {
    const dataCollectionStore = useDataCollectionStore();
    let result = false;
    if (!checkForVisitId) result = true;
    for (const actionRow of actions) {
        if (!actionRow.folderId && actionRow.fieldId === fieldId) result = true;
        else if (
            actionRow.folderId &&
            dataCollectionStore.queryParamDetails.folderId === actionRow.folderId &&
            actionRow.fieldId === fieldId
        )
            result = true;
        if (result) break;
    }
    return result;
}

function updateDerivedFieldValue(params: {
    fieldId: string;
    dataCollectionRow: IDataCollectionFormDetails;
    rowValue: IFormFieldDerivationDetails;
    dataCollectionRowIndex: number;
    formsListRef: IDataCollectionFormDetails[];
    checkForVisitId: boolean;
}) {
    const {
        fieldId,
        dataCollectionRow,
        rowValue,
        dataCollectionRowIndex,
        formsListRef,
        checkForVisitId,
    } = params;
    let exitOutOfLoop = false;
    if (
        isEqual(fieldId, dataCollectionRow.id, "number") &&
        deriveOnlyIfValidActionExists(rowValue.actions, checkForVisitId, Number(fieldId))
    ) {
        const currentFieldDisabledValue = dataCollectionRow.disabled;
        const isDisabledDerivationField = rowValue.isDerivation && !rowValue.isEnabled;
        dataCollectionRow.disabled = isDisabledDerivationField || currentFieldDisabledValue;
        if (isDisabledDerivationField) dataCollectionRow.placeholder = "Derived";
        if (checkIfIndexExistInArray(dataCollectionRowIndex, formsListRef))
            formsListRef[dataCollectionRowIndex].disabled =
                isDisabledDerivationField || currentFieldDisabledValue;
        if (isDisabledDerivationField) formsListRef[dataCollectionRowIndex].placeholder = "Derived";
        exitOutOfLoop = true;
    }
    return exitOutOfLoop;
}

export function isDerivedField(
    assignedFieldDerivations: TFormFieldDerivationData<IFormFieldDerivationDetails>,
    formDetails: TDataCollectionFormDetails,
    formDetailsRef: TDataCollectionFormDetails,
    checkForVisitId: boolean,
) {
    if (getArrayLength(Object.keys(assignedFieldDerivations)) > 0) {
        const formsList = deepClone(formDetails) as TDataCollectionFormDetails;
        const formsListRef = deepClone(formDetailsRef) as TDataCollectionFormDetails;

        for (const [rowKey, rowValue] of Object.entries(assignedFieldDerivations)) {
            const [, fieldId] = rowKey.split("_");
            for (const [, derivationDetailRow] of Object.entries(rowValue)) {
                if (!derivationDetailRow.isDerivation) continue;
                for (const [
                    dataCollectionFormFieldGroupId,
                    // dataCollectionFormFieldRow,
                ] of Object.keys(formsList)) {
                    for (const [dataCollectionRowIndex, dataCollectionRow] of formsList[
                        dataCollectionFormFieldGroupId
                    ].entries()) {
                        if (
                            dataCollectionRow.isHeading &&
                            getArrayLength(dataCollectionRow.children) > 0
                        ) {
                            for (const [
                                childrenRowIndex,
                                childrenRow,
                            ] of dataCollectionRow.children.entries()) {
                                const result = updateDerivedFieldValue({
                                    dataCollectionRow: childrenRow,
                                    dataCollectionRowIndex: childrenRowIndex,
                                    fieldId,
                                    formsListRef:
                                        checkIfKeyExistsInObject(
                                            dataCollectionFormFieldGroupId,
                                            formsListRef,
                                        ) &&
                                        checkIfKeyExistsInObject(
                                            dataCollectionRowIndex,
                                            formsListRef[dataCollectionFormFieldGroupId],
                                        )
                                            ? formsListRef[dataCollectionFormFieldGroupId][
                                                  dataCollectionRowIndex
                                              ].children
                                            : [],
                                    rowValue: derivationDetailRow,
                                    checkForVisitId,
                                });
                                if (result) break;
                            }
                        } else if (!dataCollectionRow.isHeading) {
                            const result = updateDerivedFieldValue({
                                dataCollectionRow,
                                dataCollectionRowIndex,
                                fieldId,
                                formsListRef: checkIfKeyExistsInObject(
                                    dataCollectionFormFieldGroupId,
                                    formsListRef,
                                )
                                    ? formsListRef[dataCollectionFormFieldGroupId]
                                    : [],
                                rowValue: derivationDetailRow,
                                checkForVisitId,
                            });
                            if (result) break;
                        }
                    }
                }
            }
        }

        return {
            formsList,
            formsListRef,
        };

        // dataCollectionFormDetails.value = deepClone(formsList);
        // dataCollectionFormDetailsRef.value = deepClone(formsListRef);
        // if (
        //     checkIfKeyExistsInObject(
        //         dataCollectionStore.activeFormIndex,
        //         dataCollectionDetails.value,
        //     )
        // ) {
        //     dataCollectionDetails.value[dataCollectionStore.activeFormIndex].formDetails =
        //         deepClone(formsList);
        //     dataCollectionDetails.value[dataCollectionStore.activeFormIndex].formDetailsRef =
        //         deepClone(formsListRef);
        // }
    }
}
