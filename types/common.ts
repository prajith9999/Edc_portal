import type { Dayjs } from "dayjs";
import type { IActiveTab } from "~/services/apis/data/admin/win-forms";
import type { IDataCollectionFormDetails } from "./form-generation";
import type { ITrialVisitAndFormDetails } from "~/services/apis/handlers/types/data-collection-types";

export type TNullableString = null | string;

export type TNullableNumber = null | number;

export type TIDType = null | string | number;

export type TUniqueID = string | number;

export type TButtonAction = () => void | boolean | Promise<void> | Promise<boolean>;

export type TVoidAction = () => void;

export type TIconType = "list" | "grid";

export type TAdminFormAction = "Add" | "Update" | "View" | "Delete";

export type TObject<T = any> = Record<string, T>;

export type TEditFormDetail = Record<string, boolean>;

export type TTableLoaderDetail = Record<string, boolean>;

export type TOptionValue = string | number;

export type TRestrictionEntry = "View" | "Entry" | "Manual Review";

export interface IAppVersion {
    portal: string;
    admin: string;
}

export interface IOptions {
    label: string;
    value: TOptionValue;
}

export type TDateFormat =
    | "YYYY-MM-DD"
    | "DD-MM-YYYY"
    | "YYYY"
    | "M"
    | "D"
    | "MMMM"
    | "MMM"
    | "DD-MMM-YYYY"
    | "DD MMM YYYY"
    | "DD-MMM-YYYY HH:mm:ss"
    | "DD MMM YYYY HH:mm:ss A"
    | "DD MMM YYYY HH:mm:ss"
    | "YYYY-MM-DD HH:mm:ss.SSS"
    | "YYYY-MM-DD HH:mm:ss"
    | "YYYY-MM-DD HH:mm"
    | "HH:mm:ss";

export type TDate = Date | string | Dayjs;

export type TNullableDate = TDate | null;

export interface IWinFormProps {
    // tabLabel: string;
    tabData?: any;
    activeTab: IActiveTab;
}

export interface IBaseValidationError {
    index: number | string;
}

export type TValidationErrorData<T> = Record<string, T>;

export interface IAdminListQueryParam {
    top?: number;
    search?: string;
    filters?: Record<string, string | number | string[] | number[] | boolean>;
    orderBy?: Record<string, "asc" | "desc">;
}
export interface IPaginationListQueryParam {
    top?: number;
    page?: number;
    search?: string;
    filter?: Record<string, string | number | string[] | number[] | boolean>;
    orderBy?: string;
}

export type TTokenType = "emailAddress" | "variable";
export interface ITokenVariableDragItem {
    label: string;
    type: TTokenType;
}

export interface IEmailMetaDetailsParams {
    toAddress: string;
    ccAddress: string;
    bccAddress: string;
    subject: string;
}

export interface IEmailResponse {
    to: string; // "nirikshabiradar2000@gmail.com,vamshimengarthi@gmail.com"
    cc: TNullableString;
    bcc: TNullableString;
    subject: string;
    body: string;
}

export type TTableData = Record<string, any>;

export type TStoreName =
    | "adminWinFormStore"
    | "codeUpdateStore"
    | "dataCollectionStore"
    | "globalStore"
    | "loaderStore"
    | "popupModalStore"
    | "sideBarStore"
    | "studyStore"
    | "toastStore"
    | "unsavedAlertStore"
    | "urlStore"
    | "userStore"
    | "quickLinkStore"
    | "";

export interface IDictionaryDetails {
    publishedDictionaryIds: number[];
    globalDictionaryIds: number[];
}

export type TUnsavedFormAction = "none" | "unsaved" | "reset";

export interface IDateTimeSeperator {
    date: string;
    time: string;
}

export interface IDateTimeFormatData {
    original: string;
    formatted: string;
    order: number;
}

export interface IDateTimeFormatDetail {
    day: IDateTimeFormatData;
    month: IDateTimeFormatData;
    year: IDateTimeFormatData;
    hour: IDateTimeFormatData;
    minute: IDateTimeFormatData;
    second: IDateTimeFormatData;
    timeOfTheDay: IDateTimeFormatData;
    seperator: IDateTimeSeperator;
    fullFormat: IDateTimeFormatData;
}

export interface IPublishedSubjectFormMetaDetail {
    publishedSubjectFormFieldParentId: number;
    publishedSubjectDetailId: number;
    isActive: boolean;
}

export interface IPublishedSubjectFormFieldMetaDetail {
    id: number;
    publishedSubjectFormFieldParentId: number;
    publishedSubjectDetailId: number;
    publishedSubjectFormFieldChildDetailId: number;
    discrepancyCount: TNullableNumber;
    movedFromFrozenToLocked: boolean;
}

export type TPublishedSubjectFormFieldMetaDetail = Record<
    string,
    IPublishedSubjectFormFieldMetaDetail[]
    // Record<string, IPublishedSubjectFormFieldMetaDetail[]>
>;

export interface IDataCollectionUnsavedProgressStatusDetails {
    fieldId: number;
    progressStatus: string;
}

export type TDataCollectionFormDetails = Record<string, IDataCollectionFormDetails[]>;

export type TDataCollectionLogFormDetails = Record<string, TDataCollectionFormDetails>; // Key = groupId and Value = entryDetails

export interface IDataCollectionDetail {
    // formDetails: IDataCollectionFormDetails[];
    // formDetailsRef: IDataCollectionFormDetails[];
    // logFormDetails: TDataCollectionLogFormDetails; // IDataCollectionFormDetails[];
    formDetails: TDataCollectionFormDetails;
    formDetailsRef: TDataCollectionFormDetails;
    logFormDetails: TDataCollectionLogFormDetails; // IDataCollectionFormDetails[];
    // publishedSubjectFormFieldDetails: TPublishedSubjectFormFieldMetaDetail;
}

export type TDataCollectionResetType = "reset" | "hard reset";
export interface IChartOption {
    datasetIndex: number;
    index: number;
}

export type TPageFilterAction = "apply" | "reset";

export interface ITrialVisitFormDetail extends ITrialVisitAndFormDetails {}

export interface IFilterOptionalParams {
    pageLimit: TNullableNumber;
    currentPage: TNullableNumber;
}
