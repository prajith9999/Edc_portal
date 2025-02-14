type TArrayType = "primitive" | "object";
export interface IItemCheck {
    data: any[];
    type: TArrayType;
    value: string | number | boolean;
    key?: string;
}

export const getFilteredItems = (params: IItemCheck) =>
    params.type === "object"
        ? params.data.filter((row) => row[params.key!] === params.value)
        : params.data.filter((row) => row === params.value);

export const getArrayLength = (data: any[] | null) => (data ? data.length : 0);

export const checkIfItemExists = (params: IItemCheck) =>
    getArrayLength(getFilteredItems(params)) > 0;

export const getIndexOfTheItem = (params: IItemCheck) =>
    params.data.findIndex((row) =>
        params.type === "object" ? row[params.key!] === params.value : row === params.value,
    );

export const getRandomArrayIndex = (data: any[]) =>
    Math.floor(Math.random() * getArrayLength(data));

export const checkIfIndexExistInArray = (index: number, data: any[]) =>
    typeof data[index] !== "undefined";

export const returnNullIfIndexDoesNotExist = (index: number, data: any[]) =>
    checkIfIndexExistInArray(index, data) ? data[index] : null;

export function getMaxOfAValue(data: any[], key?: string) {
    let max = 0;
    for (const row of data) {
        max += key ? Number(row[key]) : Number(row);
    }
    return max;
}

export function checkIfDataHasErrors(data: any[], key?: string) {
    let result = false;
    for (const row of data) {
        if (key && !checkShallowFalsy(row[key])) {
            result = true;
        } else if (checkIfModelHasErrors(row)) {
            result = true;
        }
        if (result) break;
    }
    return result;
}

export function setNoErrorTextIfDataHasErrors(data: any[]): any[] {
    let result: any[] = [];
    if (checkIfDataHasErrors(data)) {
        for (const row of data) {
            const obj = { ...row };
            for (const [key, value] of Object.entries(row)) {
                if (!value) obj[key] = "No error";
            }
            result.push({ ...obj });
        }
    } else {
        result = data;
    }
    return deepClone(result);
}

export function getUniqueArrayItems(data: any[], key?: string): any[] {
    return deepClone(
        data.filter(
            (row, index, self) =>
                self.findIndex((selfRow) =>
                    key ? selfRow["key"] === row["key"] : selfRow === row,
                ) === index,
        ),
    );
}

export function sortArray(params: {
    data: any[];
    type?: TArrayType;
    key?: string;
    sortBy?: "asc" | "desc";
    valueTypeCast?: "number" | "string" | "date";
}) {
    const {
        data = [],
        key = undefined,
        sortBy = "asc",
        type = "object",
        valueTypeCast = "number",
    } = params;
    if (type === "primitive") return data.sort();
    if (key) {
        return data.sort((row1, row2) => {
            // if (Number(row1.formOrderNumber) > Number(row2.formOrderNumber)) return 1;
            // if (Number(row1.formOrderNumber) < Number(row2.formOrderNumber)) return -1;
            const row1Value =
                valueTypeCast === "number"
                    ? Number(row1[key])
                    : valueTypeCast === "date" && isValidDate(String(row1[key]))
                      ? convertToEpochTime(row1[key])
                      : String(row1[key]);
            const row2Value =
                valueTypeCast === "number"
                    ? Number(row2[key])
                    : valueTypeCast === "date" && isValidDate(String(row2[key]))
                      ? convertToEpochTime(row2[key])
                      : String(row2[key]);
            if (sortBy === "asc") {
                if (row1Value > row2Value) return 1;
                if (row1Value < row2Value) return -1;
            } else {
                if (row1Value > row2Value) return -1;
                if (row1Value < row2Value) return 1;
            }
            return 0;
        });
    }
    return data;
}
