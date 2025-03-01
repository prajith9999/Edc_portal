export type TIcon =
    | "chevron-down-curve"
    | "3-horizontal-bars"
    | "close-icon"
    | "chevron-down-sharp"
    | "chevron-right-sharp"
    | "clock"
    | "sort-ascending"
    | "sort-descending"
    | "double-arrow"
    | "profile"
    | "eye"
    | "eye-slash"
    | "circle-check"
    | "circle-close"
    | "circle-exclamation"
    | "circle-info"
    | "circle-play"
    | "fallback-image"
    | "home"
    | "circle-plus"
    | "check"
    | "list-view"
    | "grid-view"
    | "plus"
    | "minus"
    | "save"
    | "undo"
    | "circle-left"
    | "upload"
    | "push-version"
    | "hospital"
    | "edit"
    | "update"
    | "magnifying-glass"
    | "download"
    | "form-fields"
    | "architect"
    | "reporter"
    | "pdf"
    | "query-management"
    | "users"
    | "environment-setup"
    | "forms"
    | "folders"
    | "dictionaries"
    | "unit-dictionaries"
    | "matrices"
    | "edit-checks"
    | "custom-functions"
    | "derivations"
    | "restrictions"
    | "site-administration"
    | "site-group"
    | "subject-field-config"
    | "not-found"
    | "triangle-exclamation"
    | "wrench"
    | "email-configuration"
    | "user"
    | "library"
    | "subject"
    | "dashboard"
    | "clinical-trials"
    | "my-tasks"
    | "discrepancy-management"
    | "medical-coding"
    | "onboard-subjects"
    | "onboard-users"
    | "add-event"
    | "data-view-or-export"
    | "report"
    | "lock"
    | "unlock"
    | "calendar"
    | "circle-arrow-right";

export interface IIconProps {
    fill?: string;
    stroke?: string;
    strokeWidth?: number;
    class?: string;
    icon: TIcon;
}

export const commonClass = (...additionalClass: string[]) =>
    `w-[1.6rem] h-[1.6rem] outline-none transition-all ${additionalClass.join(" ")}`.trim();
