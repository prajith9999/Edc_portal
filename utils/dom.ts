import useLoaderStore from "~/stores/loader";

export const getDOMElement = (selector: string) => document.querySelector(selector) as HTMLElement;

export const getDOMElements = (selector: string) => document.querySelectorAll(selector);

export function isElementDisabled(...disabledValues: boolean[]) {
    const loaderStore = useLoaderStore();
    let result = false;
    for (const row of disabledValues) {
        if (row) {
            result = true;
            break;
        }
    }
    return returnNullIfFalsy(loaderStore.isLoaderActive || result);
}

export function scrollToNewlyCreatedRow(rowIndex?: number, tableId?: string) {
    try {
        const tableSelector = tableId ? `table#${tableId} tbody tr` : "table tbody tr";
        const tableBodyRows = getDOMElements(tableSelector);
        if (tableBodyRows.length > 0) {
            const arrayIndex =
                typeof rowIndex !== "undefined" ? rowIndex : tableBodyRows.length - 1;
            tableBodyRows[arrayIndex].scrollIntoView({
                behavior: "smooth",
                block: "center",
                inline: "start",
            });
        }
        return true;
    } catch (error) {
        console.error("error in scrollToNewlyCreatedRow FormContent", error);
        return false;
    }
}

export const cssvar = (variableName: string) =>
    typeof window !== "undefined"
        ? getComputedStyle(document.documentElement).getPropertyValue(variableName)
        : "";
