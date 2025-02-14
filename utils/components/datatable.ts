// @ts-ignore
// @ts-nocheck
import {
    type IChildIndex,
    type IColumn,
    type IDataOrder,
    type TSortDetail,
    type TSortType,
} from "~/types/datatable";
import type { TIcon } from "../icons";
import useDataCollectionStore from "~/stores/data-collection";

// Common
export const getIndexOfVisibleColumns = (columns: IColumn[]) =>
    columns
        .map((row, index) => (row.show ? index : undefined))
        .filter((index) => !checkIfValidNumber(index));

export function getRowKeyByColumnHeader(columns: IColumn[], rowKey: string) {
    const currentColumn = columns.filter((columnRow) => columnRow.header === rowKey);
    return getArrayLength(currentColumn) > 0 ? currentColumn[0].header : "";
}

// export const getFormIcon = (row: any, header: string) => IconKeys[capitalizeWord(row[header], true)];
export const getFormIcon = (progressStatus: string) =>
    useDataCollectionStore().getEnumKeyByStatusName(progressStatus);

export function checkIfChildrenExists(columns: IColumn[]) {
    let childrenExists = false;
    for (const columnRow of columns) {
        if (columnRow.children && getArrayLength(columnRow.children) > 0) {
            childrenExists = true;
            break;
        }
    }
    return childrenExists;
}

export function getAllChildren(columns: IColumn[]): any[] {
    let result: (IColumn & IChildIndex)[] = [];
    for (const columnRow of columns) {
        if (columnRow.children) result = [...result, ...columnRow.children];
    }
    return deepClone(result);
}

export function getDummyTableData(columns: IColumn[], dataCount: number): any[] {
    const result: any[] = [];
    const columnCount = checkIfChildrenExists(columns)
        ? getArrayLength(getAllChildren(columns))
        : getArrayLength(columns);
    for (let i = 1; i <= dataCount; i++) {
        let obj: any = {};
        for (let j = 1; j <= columnCount; j++) {
            obj[j] = "loading";
        }
        result.push(deepClone(obj));
        obj = {};
    }
    return deepClone(result);
}

export function getSortType(currentValue: TSortType) {
    // let result: TSortType = "initial";
    // if (currentValue === "initial") result = "descending";
    // else if (currentValue === "descending") result = "ascending";
    // return result;
    let result: TSortType = "initial";
    if (currentValue === "initial") result = "ascending";
    else if (currentValue === "ascending") result = "descending";
    return result;
}

export function getSortIconByType(type: TSortType) {
    let result = "";
    if (type === "initial") result = "double-arrow";
    else if (type === "ascending") result = "sort-ascending";
    else result = "sort-descending";
    return result as TIcon;
}

export function getSortOrderByAction(currentOrder: TSortType, action: "next" | "previous") {
    const sortOrdersList = ["initial", "ascending", "descending"];
    const sortOrdersListLength = getArrayLength(sortOrdersList);
    let rowIndex = 0;
    for (const [index, row] of sortOrdersList.entries()) {
        if (row === currentOrder) {
            rowIndex =
                action === "next"
                    ? (index + 1) % sortOrdersListLength
                    : (index - 1 + sortOrdersListLength) % sortOrdersListLength;
            break;
        }
    }
    return sortOrdersList[rowIndex] as TSortType;
}

export function getSortDetails(columns: IColumn[], currentSortDetails: TSortDetail) {
    let result: IColumn[] = [];
    if (checkIfChildrenExists(columns)) {
        result = getAllChildren(columns.filter((columnRow) => columnRow.show && columnRow.sort));
    } else {
        result = deepClone(columns.filter((columnRow) => columnRow.show && columnRow.sort));
    }
    const obj: TSortDetail = { ...currentSortDetails };
    for (const [rowIndex, resultRow] of result.entries()) {
        if (!(resultRow.header in obj)) {
            obj[resultRow.header] = {
                index: rowIndex,
                sortOrder: getSortType(resultRow.sortOrder || "descending"), // getSortType("ascending"),
            };
        } else {
            obj[resultRow.header] = {
                index: rowIndex,
                sortOrder: getSortType(resultRow.sortOrder || obj[resultRow.header].sortOrder),
            };
        }
    }
    return deepClone(obj);
}

export function returnValueAccessorKey(row: any, header: string, field: string): string {
    if (header in row) return header;
    return field;
}
// Common

// Drag and drop
// const getDataTransferElement = (index: string) =>
//     tableData.value.findIndex((row) => isEqual(row.id, index));
export const getDataTransferElement = (index: string, data: any[]) =>
    data.filter((row) => isEqual(row.id, index));

export const getItemOrder = (
    currentOrder: number,
    draggedElementOrder: number,
    droppedElementOrder: number,
) => {
    if (draggedElementOrder < droppedElementOrder) {
        if (currentOrder === draggedElementOrder) return droppedElementOrder;
        if (currentOrder < droppedElementOrder || currentOrder > droppedElementOrder)
            return currentOrder;
        if (currentOrder > 1) return currentOrder - 1;
        return currentOrder;
    }
    if (currentOrder === draggedElementOrder) return droppedElementOrder;
    if (currentOrder < droppedElementOrder || currentOrder > draggedElementOrder)
        return currentOrder;
    return currentOrder + 1;
};

export const checkIfItemOrderChanged = (
    data: any[],
    dataRef: any[],
    idKey: string,
    orderKey: string,
) => {
    const dataOrder: IDataOrder[] = data.map((row) => ({
        tempID: row[idKey],
        order: row[orderKey],
    }));
    const dataRefOrder: IDataOrder[] = dataRef.map((row) => ({
        tempID: row[idKey],
        order: row[orderKey],
    }));

    let result = false;

    for (const dataRow of dataOrder) {
        for (const dataRefRow of dataRefOrder) {
            if (dataRow.tempID === dataRefRow.tempID && dataRow.order !== dataRefRow.order) {
                result = true;
                break;
            }
        }
    }

    return result;
};
// Drag and drop
