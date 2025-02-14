
<script setup lang="ts">
type T = any;
   
    import type {
        IColumn,
        TTableItem,
        TSortDetail,
        TSortType,
        IDraggableItem,
    } from "~/types/datatable";
    import PaginationModel from "~/utils/pagination";
    import { PAGE_LIMIT_OPTIONS } from "~/constants/options";
    import useGlobalStore from "~/stores/global";
    import type { TVoidAction } from "~/types/common";

    const props = withDefaults(
        defineProps<{
            columns: IColumn[];
            tableData: TTableItem<T>[];
            expandedRow?: Record<string, TTableItem<T>>;
            paginationModel?: PaginationModel;
            loading?: boolean;
            disabled?: boolean;
            paginationType: "classic" | "lazy" | "none";
            emptyMessage?: string;
            searchKey?: string;
            tableStyle?:
                | "outlined"
                | "default"
                | "sticky-header"
                | "sticky-columns"
                | "sticky-header-column";
            enableRowClick?: boolean;
            customContent?: boolean;
            enableReorder?: boolean;
            reorderClass?: string;
            tableBadge?: string;
            skeletonDataCount?: number;
            tableBadgeClass?: string;
            actionRowClass?: string;
            tableId?: string;
            skeletonLoaderClass?: string;
            tableCellContainerClass?: string;
            enableColumnLoader?: boolean;
            columnSkeletonDataCount?: number;
            disableTextEllipse?: boolean;
            tableWrapperClass?: string;
            actionAtStartTableHeaderStyle?: string;
            actionAtStartTableBodyStyle?: string;
        }>(),
        {
            expandedRow: undefined,
            emptyMessage: "No record(s)",
            searchKey: "",
            tableStyle: "default",
            enableRowClick: false,
            loading: false,
            disabled: false,
            customContent: false,
            enableReorder: false,
            reorderClass: "",
            paginationModel: () => new PaginationModel(),
            tableBadge: "",
            skeletonDataCount: 4,
            tableBadgeClass: "",
            actionRowClass: "",
            tableId: "",
            skeletonLoaderClass: "",
            tableCellContainerClass: "",
            enableColumnLoader: false,
            columnSkeletonDataCount: 5,
            disableTextEllipse: false,
            tableWrapperClass: "",
            actionAtStartTableHeaderStyle: "",
            actionAtStartTableBodyStyle: "",
        },
    );

    // (eventName: "on-drag", event: DragEvent, item: TTableItem<T>): void,
    const emit = defineEmits<{
        "on-drag": [event: DragEvent, IDraggableItem<T>];
        "on-drop": [event: DragEvent, IDraggableItem<T>, clearTransferData: TVoidAction];
        "on-expand": [rowData: TTableItem<T>, rowIndex: number];
        "on-collapse": [rowData: TTableItem<T>, rowIndex: number];
        "on-page-change": [];
        "on-sort-change": [column: string, order: TSortType];
        "on-icon-click": [rowDetails: T];
        "on-scroll-end": [];
        "on-row-click": [rowDetails: T];
        "on-page-limit-changed": [];
        "on-sticky-table-horizontal-scroll": [lastFrozenColumnShowShadow: boolean];
        "on-sticky-table-vertical-scroll": [lastFrozenColumnShowShadow: boolean];
    }>();

    const slots = useSlots();

    const globalStore = useGlobalStore();

    const lastRow = ref(null);
    const lastRowVisibility = useElementVisibility(lastRow);

    const itemRefs = ref<HTMLDivElement[]>([]);
    const sortDetails = ref<TSortDetail>({});
    const tableContainer = ref();
    const showShadow = ref<boolean>(false);
    const hideRowFreeze = ref<boolean>(false);

    const tableElementId = computed(() => props.tableId || `table-${currentEpochTime()}`);

    const tableClasses = computed(() => ({
        "w-full table-container": true,
        [props.tableStyle]: true,
    }));
    const tableRowTextClasses = computed(() => ({
        // "cursor-pointer hover:bg-[var(--color-secondary)] hover:text-white":
        "cursor-pointer hover:bg-[--color-table-hover] hover:text-black":
            props.enableRowClick && props.tableStyle === "outlined",
        "pointer-events-none [&>td>span.ellipsed-text]:!pointer-events-auto":
            !props.enableRowClick && !props.customContent,
        "[&>td>span.ellipsed-text]:!pointer-events-auto": true,
        "[&>td.action-row]:cursor-pointer [&>td.action-row]:pointer-events-auto [&>td.drag]:pointer-events-auto":
            !props.disabled,
        // "[&:has(td.action-row)]:cursor-pointer": true,
    }));

    const tableBadgeClasses = computed(() => ({
        "bg-[var(--color-gray-line)] white-text text-[1.2rem] w-fit font-bold py-[0.2rem] px-[0.5rem] rounded-t-[var(--border-radius-6)] -mb-[1rem]":
            true,
        [props.tableBadgeClass]: props.tableBadgeClass,
    }));
    // const tableRowTextClasses = computed(() => ({
    //     "cursor-pointer opacity-70": props.enableRowClick,
    //     "pointer-events-none": !props.enableRowClick,
    // }));
    const dummyColumns = computed(() => props.columns);

    // const ellipsedText = (text: TNullableString | TNullableNumber) => {
    //     let result = "";
    //     if (text && getStringLength(text) > 35) result = `${String(text).slice(0, 35)}...`;
    //     else if (text) result = text;
    //     return String(result);
    // };

    const getReasonStyles = (reason: string) => `${convertToLowerCase(String(reason))}-reason`;

    function startDrag(evt: DragEvent, slotProps: IDraggableItem<T>) {
        if (props.reorderClass.includes("!pointer-events-none")) return null;
        evt.dataTransfer!.dropEffect = "move";
        evt.dataTransfer!.effectAllowed = "move";
        // evt.dataTransfer!.setData("item", JSON.stringify({
        //     row: item,
        //     index: rowIndex
        // }));
        evt.dataTransfer!.setData("item", JSON.stringify(slotProps));
        emit("on-drag", evt, slotProps);
    }

    function onDrop(evt: DragEvent, slotProps: IDraggableItem<T>) {
        if (props.reorderClass.includes("!pointer-events-none")) return null;
        emit("on-drop", evt, slotProps, () => evt.dataTransfer!.clearData("item"));
    }

    const isRowExpanded = (rowIndex: number) => props.expandedRow && props.expandedRow[rowIndex];

    // function expandOrCollapseRow(rowData: TTableItem<T>, rowIndex: number) {
    //     // if (props.expandedRow) props.expandedRow[rowIndex] = { ...rowData };
    //     let classAction = "";
    //     if (!isRowExpanded(rowIndex)) {
    //         emit("on-expand", rowData, rowIndex);
    //         classAction = "add";
    //     } else {
    //         emit("on-collapse", rowData, rowIndex);
    //         classAction = "remove";
    //     }
    //     for (const row of itemRefs.value) {
    //         const rowId = row.getAttribute("id");
    //         if (rowId === `row-${rowIndex}`) {
    //             row.style.backgroundColor = classAction === "add" ? "pink" : "initial";
    //             const firstChild = row.firstElementChild as HTMLElement | null;
    //             if (firstChild) {
    //                 const svgElement = firstChild?.querySelector("svg") as SVGSVGElement;
    //                 if (classAction === "add") svgElement.classList.add("rotate-0");
    //                 else svgElement.classList.remove("rotate-0");
    //             }
    //             // h("tr", "<tr><slot><span>testing</span></slot></tr>");
    //             // row.append(`
    //             //     <tr>
    //             //         <slot>
    //             //             <span>testing</span>
    //             //         </slot>
    //             //     </tr>
    //             // `);
    //         }
    //     }
    // }

    function handlePageClick(
        action: "previous" | "next" | "page",
        page: number,
        paginationModel: PaginationModel,
        initial: boolean,
    ) {
        handlePagination(action, page, paginationModel, initial);
        if (!initial) emit("on-page-change");
        // (async function () {
        //         products.value = [];
        //         await getBestSellerProducts();
        //     })();
    }

    function handleSorting(columnHeading: string) {
        const newOrderType = getSortType(sortDetails.value[columnHeading].sortOrder);
        sortDetails.value[columnHeading].sortOrder = newOrderType;
        emit("on-sort-change", columnHeading, newOrderType);
    }

    function onIconClick(row: any) {
        emit("on-icon-click", row);
    }

    function handlePageLimit(selectedOptions: string[]) {
        props.paginationModel.pageDetails.pageLimit = Number(selectedOptions[0]);
        emit("on-page-limit-changed");
    }

    function handleRowClick(row: any) {
        emit("on-row-click", row);
    }

    function handleScroll() {
        if (tableContainer.value.scrollLeft > 0) {
            showShadow.value = true;
        } else {
            showShadow.value = false;
        }
        if (tableContainer.value.scrollTop > 0) {
            hideRowFreeze.value = true;
        } else {
            hideRowFreeze.value = false;
        }
        emit("on-sticky-table-horizontal-scroll", showShadow.value);
        emit("on-sticky-table-vertical-scroll", hideRowFreeze.value);
    }

    watch(
        () => lastRowVisibility.value,
        (newValue) => {
            if (props.paginationType === "lazy") {
                if (newValue) {
                    emit("on-scroll-end");
                }
            }
        },
    );

    // container-class="w-[40%] h-[1.5rem] my-[1rem]"
    const skeletonLoaderContainerClasses = () =>
        `${props.skeletonLoaderClass.includes("w-[") ? "" : "w-[40%]"} h-[1.5rem] my-[1rem] ${
            ["default", "sticky-header", "sticky-columns", "sticky-header-column"].includes(
                props.tableStyle,
            )
                ? "mx-auto"
                : ""
        }`.trim();

    const isAtleastOneColumnHasSortingEnabled = computed(() => {
        let result = false;
        for (const row of props.columns) {
            if (row.sort) {
                result = true;
                break;
            }
        }
        return result;
    });

    watch(
        () => props.columns,
        (newColumns) => {
            if (isAtleastOneColumnHasSortingEnabled.value)
                sortDetails.value = getSortDetails(newColumns, sortDetails.value);
        },
        { deep: true },
    );

    onMounted(() => {
        sortDetails.value = getSortDetails(props.columns, sortDetails.value);
        if (
            tableContainer.value &&
            (props.tableStyle === "sticky-header" || props.tableStyle === "sticky-header-column")
        )
            tableContainer.value.addEventListener("scroll", handleScroll);
    });

    onBeforeUnmount(() => {
        if (
            tableContainer.value &&
            (props.tableStyle === "sticky-header" || props.tableStyle === "sticky-header-column")
        )
            tableContainer.value.removeEventListener("scroll", handleScroll);
    });
</script>

<template>
    <div class="flex flex-col gap-[1rem]">
        <h4 v-if="tableBadge" :class="tableBadgeClasses">
            {{ tableBadge }}
        </h4>
        <div
            ref="tableContainer"
            class="table-wrapper w-full flex flex-col gap-[1rem] relative"
            :class="[
                loading
                    ? 'overflow-x-hidden'
                    : tableStyle === 'sticky-columns'
                      ? ''
                      : 'overflow-x-auto',
                tableWrapperClass,
            ]"
            :skeleton="loading || null"
            :tabindex="-1"
        >
            <!-- <table class="w-full table-container"> -->
            <table :id="tableElementId" :class="tableClasses">
                <thead class="table-header">
                    <tr v-if="loading && enableColumnLoader" class="table-header-divider">
                        <th
                            v-for="column in columnSkeletonDataCount"
                            :key="column"
                            class="relative font-bold text-[1.1rem] lg:text-[1.2rem]"
                        >
                            <edc-skeleton-loader
                                :container-class="skeletonLoaderContainerClasses()"
                                loader-type="rectangle"
                            />
                        </th>
                    </tr>
                    <tr v-if="checkIfChildrenExists(columns)">
                        <!-- text-[1.2rem] font-bold min-w-[20rem] -->
                        <th
                            v-for="column of columns.filter((row) => row.show)"
                            :key="column.header"
                            class="relative font-bold text-[1.1rem] lg:text-[1.2rem]"
                            :style="returnNullIfFalsy(column.style)"
                            :colspan="column.children ? getArrayLength(column.children) : 1"
                        >
                            {{ column.header }}
                            <!-- <div
                                class="absolute top-0 bottom-0 left-0 right-0 bg-transparent right-border"
                            /> -->
                        </th>
                    </tr>
                    <tr v-if="checkIfChildrenExists(columns)" class="table-header-divider">
                        <th
                            v-for="column of getAllChildren(columns).filter(
                                (columnRow) => columnRow.show,
                            )"
                            :key="column.header"
                            class="relative text-[1.1rem] lg:text-[1.2rem]"
                            :class="[
                                column.childType === 'first' ? 'colspan' : '',
                                column.childType !== 'only' ? 'font-medium' : 'font-bold',
                            ]"
                            :style="returnNullIfFalsy(column.style)"
                        >
                            <div
                                class="flex flex-row items-center gap-[1rem]"
                                :class="[
                                    [
                                        'default',
                                        'sticky-header',
                                        'sticky-columns',
                                        'sticky-header-column',
                                    ].includes(tableStyle)
                                        ? 'justify-center'
                                        : '',
                                ]"
                            >
                                <span>{{ column.header }}</span>
                                <edc-pressable
                                    v-if="column.sort"
                                    :disabled="loading"
                                    :on-click="() => handleSorting(column.header)"
                                >
                                    <edc-icon
                                        :icon="
                                            getSortIconByType(sortDetails[column.header]?.sortOrder)
                                        "
                                        class="!w-[1.1rem] !h-[1.1rem] fill-[var(--color-table-header)]"
                                    />
                                </edc-pressable>
                            </div>
                            <!-- <div
                                class="absolute top-0 bottom-0 left-0 right-0 bg-transparent h-[80%] right-border"
                            /> -->
                            <!-- <div class="pb-[0.5rem]" /> -->
                        </th>
                    </tr>
                    <tr v-else>
                        <!-- expansion / drag & drop -->
                        <th
                            v-if="enableReorder"
                            class="font-bold text-[1.1rem] lg:text-[1.2rem] table-header-divider"
                        />
                        <!-- expansion / drag & drop -->
                        <!-- <th class="colspan text-[1.2rem] font-normal min-w-[20rem]">
                        Concomitant medication
                    </th>
                    <th class="text-[1.2rem] font-normal min-w-[20rem]">Adverse Event</th> -->
                        <th
                            v-if="slots['actionAtStart']"
                            class="font-bold text-[1.1rem] lg:text-[1.2rem] table-header-divider"
                            :class="[actionAtStartTableHeaderStyle]"
                        >
                            Action
                        </th>
                        <th
                            v-for="column of columns.filter((row) => row.show)"
                            :key="column.header"
                            class="font-bold text-[1.1rem] lg:text-[1.2rem] table-header-divider"
                            :class="[
                                '!sticky',
                                // tableStyle === 'sticky-header'
                                //     ? '!sticky !top-0 !z-[503] white-bg'
                                //     : '',
                            ]"
                            :style="returnNullIfFalsy(column.style)"
                        >
                            <div
                                class="flex flex-row items-center gap-[1rem] font-bold"
                                :class="[
                                    [
                                        'default',
                                        'sticky-header',
                                        'sticky-columns',
                                        'sticky-header-column',
                                    ].includes(tableStyle)
                                        ? 'justify-center'
                                        : '',
                                ]"
                            >
                                {{ column.header }}
                                <edc-pressable
                                    v-if="column.sort"
                                    :disabled="loading"
                                    :on-click="() => handleSorting(column.header)"
                                >
                                    <edc-icon
                                        :icon="
                                            getSortIconByType(sortDetails[column.header]?.sortOrder)
                                        "
                                        class="!w-[1.1rem] !h-[1.1rem] fill-[var(--color-table-header)]"
                                    />
                                </edc-pressable>
                            </div>
                        </th>
                        <th
                            v-if="slots['action']"
                            class="font-bold text-[1.1rem] lg:text-[1.2rem] table-header-divider"
                        >
                            Action
                        </th>
                    </tr>
                </thead>
                <tbody v-if="loading && enableColumnLoader" class="table-body mb-[20rem]">
                    <template
                        v-for="(row, index) of getDummyTableData(dummyColumns, skeletonDataCount)"
                        :key="index"
                    >
                        <tr
                            :id="`loading-row-${index}`"
                            @dragstart="
                                startDrag($event, {
                                    data: row,
                                    index,
                                })
                            "
                            @drop="
                                onDrop($event, {
                                    data: row,
                                    index,
                                })
                            "
                            @dragover.prevent
                            @dragenter.prevent
                        >
                            <td
                                v-for="columnIndex in columnSkeletonDataCount"
                                :key="columnIndex"
                                class="font-normal text-left pointer-events-none text-[1.1rem] lg:text-[1.2rem]"
                                :class="[tableCellContainerClass]"
                            >
                                <edc-skeleton-loader
                                    :container-class="skeletonLoaderContainerClasses()"
                                    loader-type="rectangle"
                                />
                            </td>
                        </tr>
                    </template>
                    <!-- <div class="pb-[0.2rem]" /> -->
                </tbody>
                <tbody
                    v-if="
                        (paginationType !== 'lazy' ||
                            (paginationType === 'lazy' && getArrayLength(tableData) === 0)) &&
                        loading &&
                        checkIfChildrenExists(columns)
                    "
                    class="table-body mb-[20rem]"
                >
                    <template
                        v-for="(row, index) of getDummyTableData(dummyColumns, skeletonDataCount)"
                        :key="index"
                    >
                        <tr
                            :id="`loading-row-${index}`"
                            @dragstart="
                                startDrag($event, {
                                    data: row,
                                    index,
                                })
                            "
                            @drop="
                                onDrop($event, {
                                    data: row,
                                    index,
                                })
                            "
                            @dragover.prevent
                            @dragenter.prevent
                        >
                            <td
                                v-if="slots['actionAtStart']"
                                class="action-row"
                                :disabled="isElementDisabled(loading, disabled)"
                                :class="[tableCellContainerClass]"
                            >
                                <div
                                    :class="[
                                        'flex flex-flex-row items-center justify-start gap-[1rem]',
                                    ]"
                                >
                                    <edc-skeleton-loader
                                        container-class="w-[40%] h-[1.5rem] my-[1rem]"
                                        loader-type="rectangle"
                                    />
                                </div>
                            </td>
                            <td
                                v-for="[columnIndex] of getAllChildren(dummyColumns)
                                    .filter((columnRow) => columnRow.show)
                                    .entries()"
                                :key="columnIndex"
                                class="font-normal text-left pointer-events-none text-[1.1rem] lg:text-[1.2rem]"
                                :class="[tableCellContainerClass]"
                            >
                                <edc-skeleton-loader
                                    :container-class="skeletonLoaderContainerClasses()"
                                    loader-type="rectangle"
                                />
                            </td>
                            <td
                                v-if="slots['action']"
                                class="action-row"
                                :disabled="isElementDisabled(loading, disabled)"
                                :class="[tableCellContainerClass]"
                            >
                                <div
                                    :class="[
                                        'flex flex-flex-row items-center justify-start gap-[1rem]',
                                    ]"
                                >
                                    <edc-skeleton-loader
                                        container-class="w-[40%] h-[1.5rem] my-[1rem]"
                                        loader-type="rectangle"
                                    />
                                </div>
                            </td>
                        </tr>
                    </template>
                    <!-- <div class="pb-[0.2rem]" /> -->
                </tbody>
                <tbody
                    v-else-if="
                        (paginationType !== 'lazy' ||
                            (paginationType === 'lazy' && getArrayLength(tableData) === 0)) &&
                        loading &&
                        !checkIfChildrenExists(columns)
                    "
                    class="table-body mb-[20rem]"
                >
                    <template
                        v-for="(row, index) of getDummyTableData(dummyColumns, skeletonDataCount)"
                        :key="index"
                    >
                        <tr
                            :id="`loading-row-${index}`"
                            @dragstart="
                                startDrag($event, {
                                    data: row,
                                    index,
                                })
                            "
                            @drop="
                                onDrop($event, {
                                    data: row,
                                    index,
                                })
                            "
                            @dragover.prevent
                            @dragenter.prevent
                        >
                            <td
                                v-if="enableReorder"
                                valign="top"
                                :class="[
                                    'pointer-events-none',
                                    reorderClass,
                                    tableCellContainerClass,
                                ]"
                            >
                                <edc-skeleton-loader
                                    container-class="w-[2rem] h-[1.5rem] my-[1rem]"
                                    loader-type="rectangle"
                                />
                            </td>
                            <td
                                v-if="slots['actionAtStart']"
                                class="action-row"
                                :disabled="isElementDisabled(loading, disabled)"
                                :class="[tableCellContainerClass]"
                            >
                                <div
                                    :class="[
                                        'flex flex-flex-row items-center justify-start gap-[1rem]',
                                    ]"
                                >
                                    <edc-skeleton-loader
                                        container-class="w-[40%] h-[1.5rem] my-[1rem]"
                                        loader-type="rectangle"
                                    />
                                </div>
                            </td>
                            <td
                                v-for="[columnIndex] of dummyColumns
                                    .filter((columnRow) => columnRow.show)
                                    .entries()"
                                :key="columnIndex"
                                class="font-normal text-left pointer-events-none text-[1.1rem] lg:text-[1.2rem]"
                                :class="[tableCellContainerClass]"
                            >
                                <edc-skeleton-loader
                                    :container-class="skeletonLoaderContainerClasses()"
                                    loader-type="rectangle"
                                />
                            </td>
                            <td
                                v-if="slots['action']"
                                class="action-row"
                                :disabled="isElementDisabled(loading, disabled)"
                                :class="[tableCellContainerClass]"
                            >
                                <div
                                    :class="[
                                        'flex flex-flex-row items-center justify-start gap-[1rem]',
                                    ]"
                                >
                                    <edc-skeleton-loader
                                        container-class="w-[40%] h-[1.5rem] my-[1rem]"
                                        loader-type="rectangle"
                                    />
                                </div>
                            </td>
                        </tr>
                    </template>
                    <!-- <div class="pb-[0.2rem]" /> -->
                </tbody>
                <!-- class="table-body mb-[20rem] relative" -->
                <tbody
                    v-else-if="
                        ((paginationType !== 'lazy' && !loading) || paginationType === 'lazy') &&
                        getArrayLength(tableData) > 0
                    "
                    class="table-body mb-[0rem] relative"
                >
                    <transition name="processing-fade">
                        <div
                            v-if="globalStore.showTableProcessingMessage[searchKey]"
                            class="absolute z-[50] top-0 right-0 bottom-0 left-0 bg-[rgba(0,0,0,0.3)] flex flex-row items-center justify-center"
                        >
                            <span
                                class="inline-block font-semibold p-[1rem] rounded-[--border-radius-4] bg-white w-fit h-fit text-[1.1rem] lg:text-[1.2rem]"
                                >Processing<span
                                    class="inline-block first-dot bounce-effect text-[1.8rem] lg:text-[2rem] ml-[0.2rem]"
                                    >.</span
                                ><span
                                    class="inline-block second-dot bounce-effect text-[1.8rem] lg:text-[2rem]"
                                    >.</span
                                ><span
                                    class="inline-block third-dot bounce-effect text-[1.8rem] lg:text-[2rem]"
                                    >.</span
                                ></span
                            >
                        </div>
                    </transition>
                    <template v-for="(row, index) in tableData" :key="index">
                        <!-- draggable="true" -->
                        <tr
                            :id="`row-${index}`"
                            ref="itemRefs"
                            class="drag-el"
                            :disabled="disabled ? disabled : null"
                            :draggable="enableReorder"
                            :class="tableRowTextClasses"
                            @dragstart="
                                startDrag($event, {
                                    data: row,
                                    index,
                                })
                            "
                            @drop="
                                onDrop($event, {
                                    data: row,
                                    index,
                                })
                            "
                            @dragover.prevent
                            @dragenter.prevent
                        >
                            <!-- drag and drop -->
                            <td
                                v-if="enableReorder"
                                valign="top"
                                :class="[
                                    'cursor-pointer drag',
                                    reorderClass,
                                    tableCellContainerClass,
                                ]"
                            >
                                <edc-icon
                                    icon="3-horizontal-bars"
                                    class="w-[2rem] h-[2rem] stroke-[var(--color-black)] hover:stroke-[var(--color-gray-text)] group-hover:stroke-[var(--color-gray-text)]"
                                />
                            </td>
                            <!-- drag and drop -->
                            <!-- :class="[
                                isRowExpanded(index)
                                    ? 'pointer-events-none'
                                    : 'cursor-pointer',
                            ]" -->
                            <!-- expansion -->
                            <!-- <td class="cursor-pointer" @click="expandOrCollapseRow(row, index)">
                            <edc-icon
                                icon="chevron-down"
                                class="w-[2rem] h-[2rem] stroke-[var(--color-black)] hover:stroke-[var(--color-grey)] group-hover:stroke-[var(--color-grey)] -rotate-90"
                            />
                        </td> -->
                            <!-- expansion -->
                            <!-- <td
                            v-for="([, item], subIndex) of Object.entries(row as any).filter(
                                (row, rowIndex) =>
                                    getIndexOfVisibleColumns(columns).includes(rowIndex),
                            )"
                            :key="subIndex"
                            class="pointer-events-none"
                        >
                            {{ item }}
                        </td> -->
                            <td
                                v-if="slots['actionAtStart']"
                                :class="[
                                    'action-row',
                                    actionRowClass ? actionRowClass : 'min-w-[6rem] max-w-[6rem]',
                                    tableCellContainerClass,
                                    actionAtStartTableBodyStyle,
                                ]"
                                valign="top"
                                :disabled="isElementDisabled(loading, disabled)"
                            >
                                <div class="flex flex-col">
                                    <div
                                        :class="[
                                            'flex flex-flex-row items-center gap-[1rem]',
                                            [
                                                'default',
                                                'sticky-header',
                                                'sticky-columns',
                                                'sticky-header-column',
                                            ].includes(tableStyle)
                                                ? 'justify-center'
                                                : 'justify-start',
                                        ]"
                                    >
                                        <slot
                                            name="actionAtStart"
                                            v-bind="{
                                                index,
                                                data: row,
                                            }"
                                        />
                                    </div>
                                    <slot
                                        v-if="slots['errorMessage']"
                                        name="errorMessage"
                                        v-bind="{
                                            index,
                                            data: row,
                                        }"
                                    />
                                </div>
                            </td>
                            <template v-if="customContent">
                                <slot
                                    name="custom-content"
                                    v-bind="{
                                        index,
                                        data: row,
                                    }"
                                />
                            </template>
                            <template v-else-if="checkIfChildrenExists(columns)">
                                <td
                                    v-for="[columnIndex, columnRow] of getAllChildren(columns)
                                        .filter((columnRow) => columnRow.show)
                                        .entries()"
                                    :key="columnIndex"
                                    class="font-normal text-[1.1rem] lg:text-[1.2rem]"
                                    :class="[
                                        tableCellContainerClass,
                                        [
                                            'default',
                                            'sticky-header',
                                            'sticky-columns',
                                            'sticky-header-column',
                                        ].includes(tableStyle)
                                            ? 'text-center'
                                            : 'text-left',
                                    ]"
                                >
                                    <edc-pressable
                                        v-if="columnRow.icon"
                                        container-class="mx-auto w-fit"
                                        :on-click="
                                            () =>
                                                onIconClick({
                                                    ...row,
                                                    columnRow: { ...columnRow },
                                                })
                                        "
                                    >
                                        <img
                                            v-tooltip.bottom="
                                                columnRow.data.progressStatus &&
                                                columnRow.data.progressStatus
                                            "
                                            :src="
                                                getImageSource(
                                                    getFormIcon(columnRow.data.progressStatus),
                                                    'icon',
                                                )
                                            "
                                            :alt="getAltTagTitle(columnRow.header)"
                                            class="h-[3.5rem]"
                                        />
                                    </edc-pressable>
                                    <span
                                        v-else-if="columnRow.header === 'Reason'"
                                        :class="[
                                            'reason-text',
                                            getReasonStyles((row as Record<string, any>)[columnRow.header]),
                                            [
                                                'default',
                                                'sticky-header',
                                                'sticky-columns',
                                                'sticky-header-column',
                                            ].includes(tableStyle)
                                                ? 'text-center'
                                                : '',
                                        ]"
                                    >
                                        {{
                                            (row as Record<string, any>)[
                                                returnValueAccessorKey(
                                                    row as Record<string, any>,
                                                    columnRow.header,
                                                    columnRow.field,
                                                )
                                            ]
                                        }}
                                    </span>
                                    <span
                                        v-else
                                        :style="columnRow.style ? isElementDisabled(columnRow.style) : ''"
                                        @click="handleRowClick(row)"
                                        >{{
                                            (row as Record<string, any>)[
                                                returnValueAccessorKey(
                                                    row,
                                                    columnRow.header,
                                                    columnRow.field,
                                                )
                                            ]
                                        }}</span
                                    >
                                </td>
                            </template>
                            <template v-else>
                                <td
                                    v-for="[columnIndex, columnRow] of columns
                                        .filter((columnRow) => columnRow.show)
                                        .entries()"
                                    :key="columnIndex"
                                    class="font-normal text-left text-[1.1rem] lg:text-[1.2rem]"
                                    :class="[
                                        tableCellContainerClass,
                                        [
                                            'default',
                                            'sticky-header',
                                            'sticky-columns',
                                            'sticky-header-column',
                                        ].includes(tableStyle)
                                            ? 'text-center'
                                            : 'text-left',
                                    ]"
                                >
                                    <!-- <div class="flex flex-row justify-center"> -->
                                    <edc-pressable
                                        v-if="columnRow.icon"
                                        container-class="mx-auto"
                                        :on-click="
                                            () =>
                                                onIconClick({
                                                    ...row,
                                                    columnRow: { ...columnRow },
                                                })
                                        "
                                    >
                                        <img
                                            v-tooltip.bottom="
                                                columnRow.data.progressStatus &&
                                                columnRow.data.progressStatus
                                            "
                                            :src="
                                                getImageSource(
                                                    getFormIcon(columnRow.data.progressStatus),
                                                    'icon',
                                                )
                                            "
                                            :alt="getAltTagTitle(columnRow.header)"
                                            class="h-[3.5rem]"
                                        />
                                    </edc-pressable>
                                    <span
                                        v-else-if="columnRow.header === 'Reason'"
                                        :class="[
                                            'reason-text',
                                            getReasonStyles(row[columnRow.header]),
                                        ]"
                                    >
                                        {{
                                            row[
                                                returnValueAccessorKey(
                                                    row,
                                                    columnRow.header,
                                                    columnRow.field,
                                                )
                                            ]
                                        }}
                                    </span>
                                    <span
                                        v-else-if="
                                            !disableTextEllipse &&
                                            ellipsedText(
                                                row[
                                                    returnValueAccessorKey(
                                                        row,
                                                        columnRow.header,
                                                        columnRow.field,
                                                    )
                                                ],
                                            ).includes('...')
                                        "
                                        v-tooltip.top="
                                            row[
                                                returnValueAccessorKey(
                                                    row,
                                                    columnRow.header,
                                                    columnRow.field,
                                                )
                                            ]
                                        "
                                        :style="columnRow.style ? isElementDisabled(true) : ''"
                                        class="ellipsed-text"
                                        @click="handleRowClick(row)"
                                        >{{
                                            ellipsedText(
                                                row[
                                                    returnValueAccessorKey(
                                                        row,
                                                        columnRow.header,
                                                        columnRow.field,
                                                    )
                                                ],
                                            )
                                        }}</span
                                    >
                                    <span
                                        v-else
                                        :style="columnRow.style ? isElementDisabled(true) : ''"
                                        @click="handleRowClick(row)"
                                        >{{
                                            row[
                                                returnValueAccessorKey(
                                                    row,
                                                    columnRow.header,
                                                    columnRow.field,
                                                )
                                            ]
                                        }}</span
                                    >
                                    <!-- </div> -->
                                </td>
                            </template>
                            <td
                                v-if="slots['action']"
                                :class="[
                                    'action-row',
                                    actionRowClass ? actionRowClass : 'min-w-[6rem] max-w-[6rem]',
                                    tableCellContainerClass,
                                ]"
                                valign="top"
                                :disabled="isElementDisabled(loading, disabled)"
                            >
                                <div class="flex flex-col">
                                    <div
                                        :class="[
                                            'flex flex-flex-row items-center gap-[1rem]',
                                            [
                                                'default',
                                                'sticky-header',
                                                'sticky-columns',
                                                'sticky-header-column',
                                            ].includes(tableStyle)
                                                ? 'justify-center'
                                                : 'justify-start',
                                        ]"
                                    >
                                        <slot
                                            name="action"
                                            v-bind="{
                                                index,
                                                data: row,
                                            }"
                                        />
                                    </div>
                                    <slot
                                        v-if="slots['errorMessage']"
                                        name="errorMessage"
                                        v-bind="{
                                            index,
                                            data: row,
                                        }"
                                    />
                                </div>
                            </td>
                        </tr>
                        <tr v-if="isRowExpanded(index)" class="row-expansion">
                            <td :colspan="getArrayLength(columns) + 1">
                                <!-- <Transition name="fade" appear> -->
                                <slot name="rowExpansion" />
                                <!-- </Transition> -->
                            </td>
                        </tr>
                    </template>
                    <tr
                        v-if="paginationType === 'lazy'"
                        ref="lastRow"
                        :class="[loading ? '' : 'collapse']"
                    >
                        <td :colspan="columns.length + 1">
                            <div v-if="loading" class="flex flex-row items-center justify-center">
                                <edc-spinner loader-class="w-[1rem] h-[1rem] p-[0.1rem]" />
                            </div>
                        </td>
                    </tr>
                    <!-- <div class="pb-[0.2rem]" /> -->
                </tbody>
                <tbody v-else class="table-body">
                    <transition name="processing-fade">
                        <div
                            v-if="globalStore.showTableProcessingMessage[searchKey]"
                            class="absolute z-[50] top-0 right-0 bottom-0 left-0 bg-[rgba(0,0,0,0.3)] flex flex-row items-center justify-center"
                        >
                            <span
                                class="inline-block font-semibold p-[1rem] rounded-[--border-radius-4] bg-white w-fit h-fit text-[1.1rem] lg:text-[1.2rem]"
                                >Processing<span
                                    class="inline-block first-dot bounce-effect text-[1.8rem] lg:text-[2rem] ml-[0.2rem]"
                                    >.</span
                                ><span
                                    class="inline-block second-dot bounce-effect text-[1.8rem] lg:text-[2rem]"
                                    >.</span
                                ><span
                                    class="inline-block third-dot bounce-effect text-[1.8rem] lg:text-[2rem]"
                                    >.</span
                                ></span
                            >
                        </div>
                    </transition>
                    <tr>
                        <td
                            :colspan="getArrayLength(columns) + 1"
                            class="text-[1.1rem] lg:text-[1.2rem]"
                            :class="[tableCellContainerClass]"
                        >
                            {{ emptyMessage }}
                        </td>
                    </tr>
                </tbody>
            </table>
        </div>
        <div
            v-if="paginationType === 'classic'"
            class="pagination-container self-end flex flex-row items-center gap-[1rem] mb-[1rem]"
        >
            <edc-dropdown
                :key="`dataTablePageLimit-${paginationModel.pageDetails.pageLimit}`"
                v-model="paginationModel.pageDetails.pageLimit"
                container-class="w-[7rem]"
                :options="PAGE_LIMIT_OPTIONS"
                option-placement="top"
                @on-select="(selectedOptions) => handlePageLimit(selectedOptions as string[])"
            />
            <!-- <h6 class="count-container text-[1.3rem]">
                Showing {{ paginationModel.countDetails.from }} to
                {{ paginationModel.countDetails.to }} of
                {{ paginationModel.pageDetails.totalRecords }} results
            </h6> -->
            <h6 class="count-container text-[1.1rem] lg:text-[1.3rem]">
                Results: {{ paginationModel.countDetails.from }} to
                {{ paginationModel.countDetails.to }} of
                {{ paginationModel.pageDetails.totalRecords }}
            </h6>
            <!-- min-w-[30rem] max-w-[30rem] -->
            <div class="page-and-action-container flex flex-row items-center gap-[0.5rem]">
                <edc-pressable
                    :container-class="`${paginationModel.pageDetails.currentPage > 1 ? '' : 'pointer-events-none'}`"
                    :on-click="
                        () => {
                            handlePageClick('previous', 0, paginationModel, false);
                        }
                    "
                >
                    <span
                        class="transition-all text-[1.1rem] lg:text-[1.3rem]"
                        :class="
                            paginationModel.pageDetails.currentPage > 1
                                ? 'text-[var(--color-secondary)] cursor-pointer'
                                : 'text-black'
                        "
                        >Prev</span
                    >
                </edc-pressable>
                <ul class="flex flex-row items-center justify-start gap-[1rem] w-[20rem]">
                    <li
                        v-for="[index, pageRow] of paginationModel.countDetails.pages.entries()"
                        :key="index"
                        class="text-[1.1rem] lg:text-[1.3rem] text-center flex flex-row justify-center cursor-pointer items-center transition-all hover:bg-[var(--color-primary)] hover:text-white"
                        :class="[
                            'rounded-full w-[2rem] h-[2rem]',
                            pageRow.isActive
                                ? 'bg-[var(--color-primary)] white-text pointer-events-none'
                                : 'bg-transparent',
                        ]"
                        @click="
                            handlePageClick('page', Number(pageRow.label), paginationModel, false)
                        "
                    >
                        {{ pageRow.label }}
                    </li>
                </ul>
                <edc-pressable
                    :container-class="`${
                        paginationModel.pageDetails.currentPage <
                        paginationModel.pageDetails.lastPage
                            ? ''
                            : 'pointer-events-none'
                    }`"
                    :on-click="
                        () => {
                            handlePageClick('next', 0, paginationModel, false);
                        }
                    "
                >
                    <span
                        class="transition-all text-[1.1rem] lg:text-[1.3rem]"
                        :class="
                            paginationModel.pageDetails.currentPage <
                            paginationModel.pageDetails.lastPage
                                ? 'text-[var(--color-secondary)] cursor-pointer'
                                : 'text-black'
                        "
                    >
                        Next
                    </span>
                </edc-pressable>
            </div>
        </div>
    </div>
</template>

<style scoped>
    .processing-fade-enter-active,
    .processing-fade-leave-active {
        transition: opacity 0.4s linear;
        /* transition: opacity 500ms ease-out; */
    }

    .processing-fade-enter-from,
    .processing-fade-leave-to {
        opacity: 0;
        transform: translateX(0%);
    }

    .processing-slide-enter-active,
    .processing-slide-leave-active {
        transition:
            transform 0.4s cubic-bezier(0.5, 0, 0.5, 1),
            opacity 0.4s linear;
    }

    .processing-slide-enter-from,
    .processing-slide-leave-to {
        opacity: 0;
        transform: translateX(100%);
    }
    .first-dot {
        animation: bounce 1s ease infinite;
    }
    .second-dot {
        animation: bounce 1s ease infinite 0.1s;
    }
    .third-dot {
        animation: bounce 1s ease infinite 0.2s;
    }

    @keyframes bounce {
        0% {
            transform: scale(1, 1) translateY(0);
        }
        10% {
            transform: scale(1.1, 0.9) translateY(0);
        }
        30% {
            transform: scale(0.9, 1.1) translateY(-7px);
        }
        50% {
            transform: scale(1.05, 0.95) translateY(0);
        }
        58% {
            transform: scale(1, 1) translateY(-3px);
        }
        65% {
            transform: scale(1, 1) translateY(0);
        }
        100% {
            transform: scale(1, 1) translateY(0);
        }
    }

    .reason-text {
        display: inline-block;
        border-width: 0.1rem;
        border-style: solid;
        border-radius: var(--border-radius-4);
        text-align: center;
        padding: 0.1rem 1rem;
        width: 8rem;
    }
    .created-reason {
        border-color: var(--color-secondary);
        color: var(--color-secondary);
    }
    .updated-reason {
        border-color: var(--color-updated-reason);
        color: var(--color-updated-reason);
    }
    .reviewed-reason {
        border-color: var(--color-reviewed-reason);
        color: var(--color-reviewed-reason);
    }
    .approved-reason {
        border-color: var(--color-approved-reason);
        color: var(--color-approved-reason);
    }
</style>
