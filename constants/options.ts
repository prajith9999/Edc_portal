import type { IOptions } from "~/types/common";

// const colors = ["bg-[#FFCC00]", "bg-[#FF8800]", "bg-[#00FFFF]", "bg-[#A200FF]"];
export const COLORS = [
    {
        foreground: "#0842a0",
        background: "#a8c7fa",
        base: "#757575",
    },
    {
        foreground: "#474747",
        background: "#a8c7fa",
        base: "#757575",
    },
    {
        foreground: "#1f467e",
        background: "#aac7ff",
        base: "#6e778a",
    },
    {
        foreground: "#3b475e",
        background: "#bac7e3",
        base: "#74777f",
    },
    {
        foreground: "#39494c",
        background: "#b8cacd",
        base: "#6f797a",
    },
    {
        foreground: "#005049",
        background: "#74d7cb",
        base: "#627c78",
    },
    {
        foreground: "#23501b",
        background: "#a0d490",
        base: "#6c7b65",
    },
    {
        foreground: "#3f4a3c",
        background: "#becab8",
        base: "#72796f",
    },
    {
        foreground: "#544600",
        background: "#dec663",
        base: "#807757",
    },
    {
        foreground: "#713704",
        background: "#ffb787",
        base: "#90715d",
    },
    {
        foreground: "#574236",
        background: "#dec1b1",
        base: "#85746b",
    },
    {
        foreground: "#753041",
        background: "#ffb1c0",
        base: "#906e74",
    },
    {
        foreground: "#574145",
        background: "#ddbfc3",
        base: "#847375",
    },
    {
        foreground: "#693364",
        background: "#f6b0ea",
        base: "#877082",
    },
    {
        foreground: "#513a7a",
        background: "#d4bbff",
        base: "#7c7389",
    },
];

export const PAGE_LIMIT_OPTIONS: IOptions[] = [
    {
        label: "8",
        value: 8,
    },
    {
        label: "16",
        value: 16,
    },
];

export function TIME_OPTIONS(type: "hours" | "minutes" | "seconds") {
    const result: string[] = [];
    let loopCount = 0;
    if (type === "hours") loopCount = 24;
    else loopCount = 60;
    for (let i = 0; i < loopCount; i++) {
        result.push(String(i).padStart(2, "0"));
    }
    return deepClone(result) as string[];
}

export const LOG_DIRECTION_OPTIONS: IOptions[] = [
    {
        label: "Vertical",
        value: "vertical",
    },
    {
        label: "Horizontal",
        value: "horizontal",
    },
];

export const EDIT_CHECK_TYPE_OPTIONS: IOptions[] = [
    {
        label: "Data Value",
        value: 1,
    },
    {
        label: "Check Function",
        value: 2,
    },
    {
        label: "Constant",
        value: 3,
    },
];

export const DERIVATION_TYPE_OPTIONS: IOptions[] = [
    {
        label: "Data Value",
        value: 1,
    },
    {
        label: "Derivation Function",
        value: 2,
    },
    {
        label: "Constant",
        value: 3,
    },
];

export const SUBJECT_FIELD_CONFIG_SEARCH_VALUES: IOptions[] = [
    {
        label: "Coded",
        value: "coded",
    },
    {
        label: "Standard",
        value: "standard",
    },
    {
        label: "User",
        value: "user",
    },
];

export const CUSTOM_FUNCTION_LANGUAGE_OPTIONS: IOptions[] = [
    {
        label: "CSharp",
        value: "CSharp",
    },
];

export const TRIAL_ENVIRONMENT_OPTIONS: IOptions[] = [
    {
        label: "DEV",
        value: "DEV",
    },
    {
        label: "MIGRATION",
        value: "MIGRATION",
    },
    {
        label: "PROD",
        value: "PROD",
    },
    {
        label: "TRAINING",
        value: "TRAINING",
    },
    {
        label: "UAT",
        value: "UAT",
    },
];

export const INDENT_LEVEL_OPTIONS: IOptions[] = [
    {
        label: "0",
        value: 0,
    },
    {
        label: "1",
        value: 1,
    },
    // {
    //     label: "2",
    //     value: 2,
    // },
];

export const SUBJECT_GENDER_OPTIONS: IOptions[] = [
    {
        label: "Female",
        value: "Female",
    },
    {
        label: "Male",
        value: "Male",
    },
    {
        label: "Transgender",
        value: "Transgender",
    },
    // {
    //     label: "Unknown",
    //     value: "Unknown",
    // },
];

export const SUBJECT_STATUS_OPTIONS: IOptions[] = [
    {
        label: "Withdrawn by subject",
        value: "Withdrawn by subject",
    },
    {
        label: "Visits in progress",
        value: "Visits in progress",
    },
    {
        label: "Locked",
        value: "Locked",
    },
    {
        label: "Enrolled to trial",
        value: "Enrolled to trial",
    },
    {
        label: "Registered",
        value: "Registered",
    },
    {
        label: "Screening",
        value: "Screening",
    },
    {
        label: "All visits completed",
        value: "All visits completed",
    },
    {
        label: "Re-screening",
        value: "Re-screening",
    },
    {
        label: "Terminated",
        value: "Terminated",
    },
    // {
    //     label: "Screening failed",
    //     value: "Screening failed",
    // },
    {
        label: "Screen failure",
        value: "Screen failure",
    },
];

export const EXPORT_DATA_TO_OPTIONS: IOptions[] = [
    {
        // label: "Download from UI",
        label: "Download",
        value: "Download",
    },
    {
        label: "Email",
        value: "Email",
    },
    // {
    //     label: 'Server',
    //     value: 'Server',
    // },
];

export const DISCREPANCY_REASONS: IOptions[] = [
    {
        label: "The original value is accurate",
        value: "The original value is accurate",
    },
    {
        label: "Change the data according to query",
        value: "Change the data according to query",
    },
    {
        label: "The query is unclear",
        value: "The query is unclear",
    },
    {
        label: "The data is missing from the subject record",
        value: "The data is missing from the subject record",
    },
    {
        label: "The measurement was not taken during this visit",
        value: "The measurement was not taken during this visit",
    },
    {
        label: "Other",
        value: "Other",
    },
];

export const EDIT_CHECK_ACTION_TYPES: IOptions[] = [
    {
        label: "Raise Discrepancy",
        value: 1,
    },
    {
        label: "Show Field",
        value: 2,
    },
    {
        label: "Add Form",
        value: 3,
    },
    {
        label: "Disable Field",
        value: 4,
    },
    {
        label: "Trigger Email",
        value: 5,
    },
    {
        label: "Invalid Non Log Value",
        value: 6,
    },
];

export const FORM_TYPES: IOptions[] = [
    {
        label: "Standard",
        value: 1,
    },
    {
        label: "Log",
        value: 2,
    },
    {
        label: "Grouped Log",
        value: 3,
    },
];
