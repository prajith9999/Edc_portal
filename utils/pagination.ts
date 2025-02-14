export interface IPages {
    isActive: boolean;
    label: string;
}
export interface IPaginationCount {
    from: number;
    to: number;
    pages: IPages[];
}
export interface IPaginationPage {
    pageLimit: number;
    currentPage: number;
    lastPage: number;
    totalRecords: number;
}

export default class PaginationModel {
    countDetails: IPaginationCount = {
        from: 0,
        to: 0,
        pages: [],
    };

    pageDetails: IPaginationPage = {
        currentPage: 1,
        lastPage: 0,
        pageLimit: 8,
        totalRecords: 0,
    };

    clearCountDetails() {
        this.countDetails = {
            from: 0,
            to: 0,
            pages: [],
        };
    }

    clearPageDetails() {
        this.pageDetails = {
            currentPage: 1,
            lastPage: 0,
            pageLimit: 8,
            totalRecords: 0,
        };
    }

    getLastPage() {
        return Math.ceil(this.pageDetails.totalRecords / this.pageDetails.pageLimit);
    }

    processDefaultPaginationCount() {
        const result: IPages[] = [];
        for (let i = 1; i <= this.pageDetails.lastPage; i += 1) {
            if (this.pageDetails.currentPage > 4 && i === 2) {
                result.push({
                    isActive: false,
                    label: "...",
                });
            }
            if (i === this.pageDetails.currentPage)
                result.push({
                    isActive: true,
                    label: String(i),
                });
            else if (
                i === this.pageDetails.currentPage + 1 ||
                i === this.pageDetails.currentPage + 2 ||
                i === this.pageDetails.currentPage - 1 ||
                i === this.pageDetails.currentPage - 2 ||
                i === this.pageDetails.lastPage ||
                i === 1
            )
                result.push({
                    isActive: false,
                    label: String(i),
                });
            if (
                this.pageDetails.currentPage < this.pageDetails.lastPage - 3 &&
                i === this.pageDetails.lastPage - 1
            )
                result.push({
                    isActive: false,
                    label: "...",
                });
        }
        return [...result];
    }

    processFromAndToCount(page: number) {
        let from = 0;
        let to = 0;
        const previousPage = page > 0 ? page - 1 : this.pageDetails.currentPage - 1;
        if (this.pageDetails.currentPage === 1) {
            from = 1;
            to =
                this.pageDetails.totalRecords < Number(this.pageDetails.pageLimit)
                    ? this.pageDetails.totalRecords
                    : Number(this.pageDetails.pageLimit);
        } else {
            // from = previousPage + Number(pageLimit);
            from = previousPage * Number(this.pageDetails.pageLimit) + 1;
            to =
                this.pageDetails.totalRecords <
                Number(this.pageDetails.pageLimit) * this.pageDetails.currentPage
                    ? this.pageDetails.totalRecords
                    : Number(this.pageDetails.pageLimit) * this.pageDetails.currentPage;
        }

        return {
            from,
            to,
        };
    }

    paginationClick() {
        const result = [...this.countDetails.pages];
        for (const row of result) {
            if (Number(row.label) === this.pageDetails.currentPage) {
                row.isActive = true;
            } else {
                row.isActive = false;
            }
        }
        return [...result];
    }

    // handlePagination(action: "previous" | "next" | "page", page: number, initial: boolean) {
    //     // scrollToTop();
    //     if (!initial && action === "previous")
    //         paginationModel.value.currentPage = String(Number(paginationModel.value.currentPage) - 1);
    //     if (!initial && action === "next")
    //         paginationModel.value.currentPage = String(Number(paginationModel.value.currentPage) + 1);
    //     else if (!initial && action === "page") paginationModel.value.currentPage = String(page);
    //     handleFromAndToCount(page);
    //     handleDefaultPaginationPageCount();
    //     handlePaginationClick();
    //     if (!initial)
    //         (async function () {
    //             products.value = [];
    //             await getBestSellerProducts();
    //         })();
    // }
}

export const checkIfPreviousIsDisabled = (currentPage: number) => currentPage === 1;
export const checkIfNextIsDisabled = (currentPage: number, lastPage: number) =>
    currentPage === lastPage;

function handleFromAndToCount(page: number, paginationModel: PaginationModel) {
    const { from, to } = paginationModel.processFromAndToCount(page);
    paginationModel.countDetails.from = from;
    paginationModel.countDetails.to = to;
}

function handlePaginationClick(paginationModel: PaginationModel) {
    paginationModel.countDetails.pages = [...paginationModel.paginationClick()];
}

export function handleDefaultPaginationPageCount(paginationModel: PaginationModel) {
    paginationModel.countDetails.pages = [...paginationModel.processDefaultPaginationCount()];
}

export function handlePagination(
    action: "previous" | "next" | "page",
    page: number,
    paginationModel: PaginationModel,
    initial: boolean,
) {
    // scrollToTop();
    if (!initial && action === "previous")
        paginationModel.pageDetails.currentPage = Number(
            Number(paginationModel.pageDetails.currentPage) - 1,
        );
    if (!initial && action === "next")
        paginationModel.pageDetails.currentPage = Number(
            Number(paginationModel.pageDetails.currentPage) + 1,
        );
    else if (!initial && action === "page") paginationModel.pageDetails.currentPage = Number(page);
    handleFromAndToCount(page, paginationModel);
    handleDefaultPaginationPageCount(paginationModel);
    handlePaginationClick(paginationModel);
}
