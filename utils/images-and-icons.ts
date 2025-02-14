// Images
import loginIntro from "~/assets/images/login-info.svg";
import loginBackground from "~/assets/images/login-background.svg";
// Icons
import hamburgerMenu from "~/assets/icons/hamburger-menu.svg";
import dashboard from "~/assets/icons/dashboard.svg";
import myTasks from "~/assets/icons/my-tasks.svg";
import clinicalTrials from "~/assets/icons/clinical-trials.svg";
import discrepancyManagement from "~/assets/icons/discrepancy-management.svg";
import medicalCoding from "~/assets/icons/medical-coding.svg";
import mail from "~/assets/icons/mail.svg";
import bell from "~/assets/icons/bell.svg";
import logout from "~/assets/icons/logout.svg";
import filter from "~/assets/icons/filter.svg";
import close from "~/assets/icons/close.svg";
import appLogo from "~/assets/icons/app-logo.svg";
import search from "~/assets/icons/search.svg";
import status from "~/assets/icons/status.svg";
import lock from "~/assets/icons/lock.svg";
import audit from "~/assets/icons/audit.svg";
import frozen from "~/assets/icons/frozen.svg";
import form from "~/assets/icons/form.svg";
import formInactive from "~/assets/icons/form-inactive.svg";
import systemUpdate from "~/assets/images/system-update.webp";
import workInProgress from "~/assets/images/work-in-progress.webp";
import stage1Planned from "~/assets/icons/stage-1-planned.svg";
import stage2DateEntryInProgress from "~/assets/icons/stage-2-data-entry-in-progress.svg";
import stage3DataEntryCompleted from "~/assets/icons/stage-3-data-entry-completed.svg";
import stage4VerifyInProgress from "~/assets/icons/stage-4-verify-in-progress.svg";
import stage5Review1InProgress from "~/assets/icons/stage-5-review-1-in-progress.svg";
import stage6Review2InProgress from "~/assets/icons/stage-6-review-2-in-progress.svg";
import stage7VerifyCompleted from "~/assets/icons/stage-7-verify-completed.svg";
import stage8Review1Completed from "~/assets/icons/stage-8-review-1-completed.svg";
import stage9Review2Completed from "~/assets/icons/stage-9-review-2-completed.svg";
import stage10Locked from "~/assets/icons/stage-10-locked.svg";
import stage11Frozen from "~/assets/icons/stage-11-frozen.svg";
import stage12Disabled from "~/assets/icons/stage-12-disabled.svg";
import dashboardRightScrollIcon from "~/assets/icons/dashboard-right-scroll-arrow.svg";
import quickLinkIcon from "~/assets/icons/quick-link.svg";
import verified from "~/assets/icons/verified.svg";
import unverified from "~/assets/icons/unverified.svg";

type TType = "image" | "icon";

export enum ImageKeys {
    LoginIntro = "loginIntro",
    LoginBackground = "loginBackground",
    SystemUpdate = "systemUpdate",
    WorkInProgress = "workInProgress",
}

export enum IconKeys {
    Dashboard = "dashboard",
    HamburgerMenu = "hamburgerMenu",
    MyTasks = "myTasks",
    ClinicalTrials = "clinicalTrials",
    DiscrepancyManagement = "discrepancyManagement",
    MedicalCoding = "medicalCoding",
    Mail = "mail",
    Bell = "bell",
    Logout = "logout",
    Filter = "filter",
    PlannedStatus = "stage1Planned",
    DataEntryInprogressStatus = "stage2DateEntryInProgress",
    DataEntryCompletedStatus = "stage3DataEntryCompleted",
    VerifyInProgressStatus = "stage4VerifyInProgress",
    Review1InProgressStatus = "stage5Review1InProgress",
    Review2InProgressStatus = "stage6Review2InProgress",
    VerifyCompletedStatus = "stage7VerifyCompleted",
    Review1CompletedStatus = "stage8Review1Completed",
    Review2CompletedStatus = "stage9Review2Completed",
    LockedStatus = "stage10Locked",
    FrozenStatus = "stage11Frozen",
    DisabledStatus = "stage12Disabled",
    Close = "close",
    AppLogo = "appLogo",
    Search = "search",
    Status = "status",
    Lock = "lock",
    Audit = "audit",
    Frozen = "frozen",
    Form = "form",
    FormInactive = "formInactive",
    DashboardRightScrollIcon = "dashboardRightScrollIcon",
    QuickLinkIcon = "quickLinkIcon",
    Verified = "verified",
    Unverified = "unverified",
}

const Images: Record<ImageKeys, string> = {
    loginIntro,
    loginBackground,
    systemUpdate,
    workInProgress,
};

const Icons: Record<IconKeys, string> = {
    hamburgerMenu,
    dashboard,
    myTasks,
    clinicalTrials,
    discrepancyManagement,
    medicalCoding,
    mail,
    bell,
    logout,
    filter,
    stage1Planned,
    stage2DateEntryInProgress,
    stage3DataEntryCompleted,
    stage4VerifyInProgress,
    stage5Review1InProgress,
    stage6Review2InProgress,
    stage7VerifyCompleted,
    stage8Review1Completed,
    stage9Review2Completed,
    stage10Locked,
    stage11Frozen,
    stage12Disabled,
    close,
    appLogo,
    search,
    status,
    lock,
    audit,
    frozen,
    form,
    formInactive,
    dashboardRightScrollIcon,
    quickLinkIcon,
    verified,
    unverified,
};

export function getImageSource(key: ImageKeys | IconKeys, type: TType = "image") {
    const imageKey = key as ImageKeys;
    const iconKey = key as IconKeys;
    return type === "image" ? Images[imageKey] : Icons[iconKey];
}

export const getAltTagTitle = (imageTitle: string, type: TType = "image") =>
    `${capitalizeWord(imageTitle, true)} ${type}`;

export const checkIfImageURL = (image: string) =>
    ["http", "https"].includes(convertToLowerCase(String(image)));
