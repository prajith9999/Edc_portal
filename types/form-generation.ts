// @ts-ignore
// @ts-nocheck
import type {
    IFieldValueDetail,
    IFormFieldDerivationData,
    IFormFieldEditCheckData,
} from "~/services/apis/handlers/types/data-collection-types";
import type {
    IOptions,
    TButtonAction,
    TDate,
    TDateFormat,
    TNullableDate,
    TNullableNumber,
    TNullableString,
    TVoidAction,
} from "./common";

/* Form generation */

export interface IRadioGroupOptions {
    label: string;
    value: string;
    specify: boolean;
}
export interface ICheckboxGroupOptions extends IFieldValueDetail {
    label: string;
    value: string;
    isChecked: boolean;
    specify: boolean;
    specifiedValue: TNullableString;
}

export interface IDropdownOptions extends IOptions {
    specify?: boolean;
}

export interface IHelpText {
    showHelpText?: boolean;
    helpText?: TNullableString;
}

export interface IErrorText {
    error?: TNullableString;
}

export interface IViewType {
    readOnly?: boolean;
}
interface ISpecifiedValue {
    specifiedValue: TNullableString;
}

export type TControlType =
    | "textinputgroup"
    | "textarea"
    | "calendar"
    | "checkboxgroup"
    | "dropdown"
    | "radiogroup"
    | "fileupload";
export type TTabIndex = Array<number | undefined>;
interface ITabIndexes {
    tabindexes?: TTabIndex;
}
interface ITabIndex {
    tabindex?: number;
}
/* Form generation */

/* Form elements */
export interface IErrorTextProps extends IErrorText {
    containerClass?: string;
}

type TTextInputType = "text" | "number" | "password";

interface ITooltipText {
    tooltipText?: string;
    showTooltip?: boolean;
    tooltipPlacement?: "top" | "left" | "right" | "bottom";
}

export type TFloatingDropdownPlacement =
    | "top"
    | "top-start"
    | "top-end"
    | "bottom"
    | "bottom-start"
    | "bottom-end"
    | "left"
    | "left-start"
    | "left-end"
    | "right"
    | "right-start"
    | "right-end";

// interface ITextMeta {
//     value: number;
//     valueLength: number;
// }
export interface ITextInputProps extends IErrorText, IViewType, ITooltipText, IHelpText, ITabIndex {
    label?: string;
    elementId?: string;
    containerClass?: string;
    inputContainerClass?: string;
    inputClass?: string;
    labelClass?: string;
    labelContainerClass?: string;
    type: TTextInputType;
    placeholder?: string;
    required?: boolean;
    disabled?: boolean;
    minLength?: number;
    maxLength?: number;
    wholePart?: {
        minLength: number;
        maxLength: number;
    };
    fractionalPart?: {
        minLength: number;
        maxLength: number;
    };
    disableDefaultValueSetter?: boolean;
    onKeyUp?: TButtonAction;
}
export interface ITextInputGroupProps extends ITextInputProps, ISpecifiedValue, ITabIndexes {
    containerWrapperClass?: string;
    specifiedOptions?: IOptions[];
}

export interface ITextAreaProps extends IErrorText, IViewType, IHelpText, ITabIndex {
    label?: string;
    elementId?: string;
    containerClass?: string;
    inputContainerClass?: string;
    labelContainerClass?: string;
    inputClass?: string;
    labelClass?: string;
    placeholder?: string;
    required?: boolean;
    rows?: number;
    cols?: number;
    disabled?: boolean;
    showCharacterCount?: boolean;
    max?: number;
    ellipseCount?: number;
}

export interface IRadioProps extends IErrorText, ITabIndex {
    label?: string;
    value: string;
    elementId?: string;
    containerClass?: string;
    inputClass?: string;
    labelClass?: string;
    name: string;
    checked?: boolean;
    required?: boolean;
    disabled?: boolean;
    allowDeselect?: boolean;
}
// Remove the above once form are integrated into portal
export interface IRadioGroupProps extends IErrorText, IHelpText, ITabIndexes {
    name: string;
    options: IRadioGroupOptions[];
    containerClass?: string;
    labelClass?: string;
    inputClass?: string;
    required?: boolean;
    disabled?: boolean;
    type?: "horizontal" | "vertical";
    allowDeselect?: boolean;
    isSpecifyEntry?: boolean;
    label?: string;
    labelContainerClass?: string;
}
export interface ICheckboxProps extends IErrorText, IViewType, ITabIndex {
    label?: string;
    value?: string;
    elementId?: string;
    containerClass?: string;
    inputClass?: string;
    labelClass?: string;
    name: string;
    checked?: boolean;
    required?: boolean;
    disabled?: boolean;
    setCheckedToModel?: boolean;
}
export interface ICheckboxSelectedValue {
    label: string;
    isChecked: boolean;
    specify: TNullableString;
}
export interface ICheckboxGroupProps extends IErrorText, IHelpText, ITabIndexes {
    name: string;
    options: ICheckboxGroupOptions[];
    containerClass?: string;
    labelClass?: string;
    inputClass?: string;
    required?: boolean;
    disabled?: boolean;
    type?: "vertical";
    isSpecifyEntry?: boolean;
    label?: string;
    labelContainerClass?: string;
}

export interface IDropdownProps extends IErrorText, IViewType, IHelpText, ITabIndexes {
    label?: string;
    elementId?: string;
    containerClass?: string;
    inputContainerClass?: string;
    labelContainerClass?: string;
    inputClass?: string;
    labelClass?: string;
    options: IDropdownOptions[];
    defaultValue?: string;
    optionPosition?: "top" | "bottom" | "auto";
    disabled?: boolean;
    // model: any;
    // modelKey: string;
    optionPlacement?: TFloatingDropdownPlacement;
    optionOffset?: number;
    optionClass?: string;
    type?: "default" | "label";
    labelAction?: TVoidAction;
    resetOption?: boolean;
    required?: boolean;
    loading?: boolean;
    enableClear?: boolean;
    ellipseCount?: number;
}

export interface IMultiSelectProps extends IDropdownProps {
    label?: string;
    elementId?: string;
    containerClass?: string;
    inputContainerClass?: string;
    labelContainerClass?: string;
    inputClass?: string;
    labelClass?: string;
    options: IOptions[];
    defaultValue?: string;
    optionPosition?: "top" | "bottom" | "auto";
    disabled?: boolean;
    optionPlacement?: TFloatingDropdownPlacement;
    optionOffset?: number;
    optionClass?: string;
    type?: "default" | "label";
    labelAction?: TVoidAction;
    resetOption?: boolean;
    required?: boolean;
    loading?: boolean;
    enableClear?: boolean;
    ellipseCount?: number;
    isAllOptionsSelected?: boolean;
    selectAllLabel?: string;
}
export interface ICalendarProps extends IErrorText, IViewType, IHelpText, ITabIndex {
    label?: string;
    elementId?: string;
    type?: "date" | "time" | "datetime";
    format?: TDateFormat;
    containerClass?: string;
    labelContainerClass?: string;
    inputClass?: string;
    labelClass?: string;
    disabled?: boolean;
    required?: boolean;
    pickerPosition?: "top" | "bottom" | "auto";
    pickerPlacement?: TFloatingDropdownPlacement;
    pickerOffset?: number;
    pickerClass?: string;
    placeholder?: string;
    disabledDates?: TDate[];
    minDate?: TDate;
    maxDate?: TDate;
    isDateTime?: boolean;
}

export type TValidFileExtension = "image/*" | ".pdf" | ".doc";

export interface IFileModel {
    id: number;
    publishedSubjectFormFieldChildValueDetailId: number;
    fieldValue: string | File;
    specifiedValue: TNullableString;
}
export interface IFileUploadProps extends IErrorText, IHelpText, ITabIndex {
    label?: string;
    elementId?: string;
    containerClass?: string;
    inputClass?: string;
    labelClass?: string;
    placeholder?: string;
    required?: boolean;
    disabled?: boolean;
    multiple?: boolean;
    sizeLimit?: number; // In mb
    extensions?: TValidFileExtension[];
}
/* Form elements */

export type TModelValue = TNullableString | TNullableNumber | TNullableDate | IOptions;
export interface IFormGeneration
    extends ITextInputProps,
        ITextAreaProps,
        IRadioGroupProps,
        ICheckboxProps,
        IDropdownProps,
        ICalendarProps,
        IFileUpload,
        ISpecifiedValue {
    modelValue: TModelValue;
}

export interface IFormAdditionalProps {
    type: TTextInputType;
    minLength?: number;
    maxLength?: number;
    wholePart?: {
        minLength: number;
        maxLength: number;
    };
    fractionalPart?: {
        minLength: number;
        maxLength: number;
    };
    dateFormat?: string;
    multipleUpload?: boolean;
}

export interface IDataCollectionFormDetails extends IFormGeneration {
    id: number;
    orderNumber: number;
    formId: number;
    trialId: number;
    environmentId: number;
    siteId: number;
    subjectId: number;
    folderId: number;
    formName: string;
    dictionaryId: TNullableNumber;
    unitDictionaryId: TNullableNumber;
    isDataDictionaryGlobal: boolean;
    isUnitDictionaryGlobal: boolean;
    // "fieldVariableId": TNullableNumber,
    // "fieldRestrictionId": TNullableNumber,
    // "formFieldsId": TNullableNumber,
    // "fieldEditChecksId": TNullableNumber,
    // "variableId": number,
    controlType: number;
    fieldNum: TNullableString;
    oid: string;
    name: string;
    isLogDataEntry: boolean;
    isVisible: boolean;
    helpText: TNullableString;
    // "requiresTranslation": boolean,
    doesNotParticipateSignature: boolean;
    // "promptClinicalSignificance": boolean,
    // "labAnalytics": TNullableNumber,
    defaultModelValue: TNullableString;
    // "sasLabel": TNullableString,
    // "sasFormat": TNullableString,
    indentLevel: TNullableNumber;
    // label: TNullableString;
    // header: TNullableString;
    fixedUnit: TNullableString;
    validExtensions: TNullableString;
    isActive: boolean;
    // "location": null,
    fieldHelpText: TNullableString;
    // "canSetRecordDate": false,
    // "canSetDatapage": false,
    // "canSetInstanceDate": false,
    // "canSetSubjectDate": false,
    // "showPreviousVisitValues": false,
    publishedSubjectFormFieldParentId: TNullableNumber;
    publishedSubjectFormFieldChildDetailId: TNullableNumber;
    fieldId: TNullableNumber;
    progressStatus: TNullableString;
    isVerified: boolean;
    isFrozen: boolean;
    isLocked: boolean;
    fieldValueDetails: IFieldValueDetail[];
    componentKey: string;
    tabindex?: number;
    tabindexes?: TTabIndex;
    format: TNullableString;
    isHeading: boolean;
    children: IDataCollectionFormDetails[];
    groupId: number;
}

export type TDataCollectionFormType = "standard" | "log";

export interface IFormFieldDerivationDetails extends IFormFieldDerivationData {
    isDerivation: boolean;
    isEnabled: boolean;
}

export type TDerivationDetails = Record<string, any>;
export type TEditCheckDetails = TDerivationDetails;

export interface IFormFieldVisibiltyEditCheckDetails extends IFormFieldEditCheckData {
    isVisibiltyEditCheck: boolean;
}
export interface IFormFieldDisableEditCheckDetails extends IFormFieldEditCheckData {
    isDisableEditCheck: boolean;
}
export interface IFormFieldNonLogDataEditCheckDetails extends IFormFieldEditCheckData {
    isNonLogDataEditCheck: boolean;
}
