import type { CSSProperties } from "vue";

export interface IChildIndex {
    childType?: "only" | "first" | "second";
}

export type TSortType = "initial" | "ascending" | "descending";
export interface IColumn {
    header: string;
    field: string;
    show: boolean;
    icon: boolean;
    children?: (IColumn & IChildIndex)[];
    style?: CSSProperties;
    sort?: boolean;
    sortOrder?: TSortType;
    data?: any;
}

export type TColumnChildren = (IColumn & IChildIndex)[];

export type TTableItem<T> = T;

export type TSortDetail = Record<
    string,
    {
        index: number;
        sortOrder: TSortType;
    }
>;

export interface IDraggableItem<T> {
    data: TTableItem<T>;
    index: number;
}

export interface IDataOrder {
    tempID: string;
    order: number;
}
