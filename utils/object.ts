import type {
    IPaginationListQueryParam,
    TEditFormDetail,
    TNullableNumber,
    TNullableString,
    TObject,
} from "~/types/common";

export function getModelProperties(model: TObject, ignoreProperties: string[] = []) {
    // Object.entries(model)
    //     .map(([key, value]) => {
    //         if (key in model && typeof key !== "function") return { key, value };
    //         return false;
    //     })
    //     .filter((row) => row);
    const properties: TObject = {};
    for (const [key, value] of Object.entries(model)) {
        if (key in model && typeof key !== "function" && !ignoreProperties.includes(key))
            properties[key] = value;
    }
    return deepClone(properties) as TObject;
}

export function checkIfModelChanged(model: any, modelRef: any) {
    const modelStringified = JSON.stringify(
        Array.isArray(model) || !model ? model : getModelProperties(model),
    );
    const refModelStringified = JSON.stringify(
        Array.isArray(modelRef) || !modelRef ? modelRef : getModelProperties(modelRef),
    );
    return modelStringified !== refModelStringified;
}

export function checkIfModelHasErrors(model: TObject, exludedKey?: string[]) {
    const properties = getModelProperties(model);
    let result = false;
    for (const [key, value] of Object.entries(properties)) {
        if (exludedKey && exludedKey.includes(key)) continue;
        if (typeof value === "string" && value.trim()) {
            result = true;
            break;
        } else if (value) {
            result = true;
            break;
        }
    }
    return result;
}

export const checkIfKeyExistsInObject = (key: string | number, data: Record<string, any>) =>
    String(key) in data;

export function checkIfObjectHasErrors(data: Record<string, any>) {
    let result = false;
    for (const [key, row] of Object.entries(data)) {
        if (typeof row !== "object") {
            if (key !== "index" && row) {
                result = true;
                break;
            }
        } else if (row) {
            for (const [subKey, subRow] of Object.entries(row)) {
                if (subKey !== "index" && subRow) {
                    result = true;
                    break;
                }
                if (result) break;
            }
        }
    }
    return result;
}

export function setNoErrorTextIfObjectHasErrors(data: Record<string, any>): Record<string, any> {
    for (const [, row] of Object.entries(data)) {
        for (const [subKey, subRow] of Object.entries(row)) {
            if (checkIfObjectHasErrors(row)) {
                if (!subRow) row[subKey] = "No error";
            }
        }
    }
    return deepClone(data);
}

export function deleteObjectPropertyByKey(key: string, object: Record<string, any>) {
    if (checkIfKeyExistsInObject(key, object)) delete object[key];
}

export function checkIfEditFormActive(editFormDetails: TEditFormDetail) {
    let result = false;
    for (const value of Object.values(editFormDetails)) {
        if (value) {
            result = true;
            break;
        }
    }
    return result;
}

export function setDefaultValueByKeyIfKeyDoesNotExists(
    key: string,
    model: Record<string, any>,
    defaultValue: any,
) {
    if (!checkIfKeyExistsInObject(key, model))
        model[key] =
            typeof defaultValue === "object" && defaultValue
                ? deepClone(defaultValue)
                : defaultValue;
}

export function setAPIValidationErrors(
    validationErrors: Record<string, string>,
    errorModel: any,
    errorKey?: string,
) {
    for (const [key, value] of Object.entries(validationErrors)) {
        if (errorKey) errorModel[errorKey][key] = value;
        else errorModel[key] = value;
    }
}

interface IAPIFilter {
    top?: TNullableNumber;
    page?: TNullableNumber;
    search?: TNullableString;
    filter?: Record<string, string | number | string[] | number[] | boolean | null>;
    orderBy?: Record<string, "asc" | "desc">;
}
export function getAPIFilters(params: IAPIFilter) {
    const {
        filter = undefined,
        orderBy = undefined,
        search = undefined,
        top = undefined,
        page = undefined,
    } = params;
    if (!filter && !orderBy && !search && !top) return undefined;
    const queryData: IPaginationListQueryParam = {};
    if (search) queryData["search"] = search;
    if (top) queryData["top"] = top;
    if (page) queryData["page"] = page;
    if (filter) {
        queryData["filter"] = {};
        for (const [key, value] of Object.entries(filter)) {
            if (value) queryData["filter"][key] = value;
        }
        if (Object.keys(queryData["filter"]).length === 0)
            deleteObjectPropertyByKey("filter", queryData);
    }
    if (orderBy) {
        // queryData["orderBy"] = {};
        // for (const [key, value] of Object.entries(orderBy)) {
        //     if (value) queryData["orderBy"][key] = value;
        // }
        // if (Object.keys(queryData["orderBy"]).length === 0)
        //     deleteObjectPropertyByKey("orderBy", queryData);
        let orderByString = "";
        for (const [key, value] of Object.entries(orderBy)) {
            if (value) orderByString = `${key}:${convertToUpperCase(value)}`;
        }
        queryData["orderBy"] = orderByString;
    }
    return deepClone(queryData) as IPaginationListQueryParam;
}

export function checkIfSimilarKeyExistsInObject(key: string | number, data: Record<string, any>) {
    let result = false;
    const keysList = Object.keys(data);
    if (getArrayLength(keysList) > 0) {
        for (const objKey of keysList) {
            if (objKey.includes(String(key))) {
                result = true;
                break;
            }
        }
    }
    return result;
}
