// import { IconKeys } from "#imports";
import type { LocationQueryRaw, RouteLocationNormalized, RouteParamsRaw } from "vue-router";
import useStudyStore from "~/stores/study";
import useToastStore from "~/stores/toast";
import type { TNullableNumber, TNullableString, TUniqueID } from "~/types/common";

export enum PortalPath {
    Home = "/",
    Login = "/login/",
    Dashboard = "/dashboard/",
    ClinicalTrials = "/clinical-trials/",
    SubjectSiteTransferApproval = "/subject/site-transfer-approval/",
    Subject = "/subject/",
    EmailTemplate = "/email-template/",
    SetNewPassword = "/set-password/",
    ForgotPassword = "/forgot-password/",
    ForgotPasswordOtp = "/forgot-password-otp/",
    ResetPassword = "/reset-password/",
    User = "/user/",
    DataViewOrExport = "/data-view-or-export/",
    DiscrepancyManagement = "/discrepancy-management/",
    MyTasks = "/my-tasks/",
}

export enum AdminPath {
    Login = "/admin/login/",
    Dashboard = "/admin/dashboard/",
}

export enum DemoPath {
    Login = "/demo/login/",
    Dashboard = "/demo/dashboard/",
    ClinicalTrials = "/demo/clinical-trials/",
}

export interface IRouteObject {
    path: PortalPath | AdminPath | DemoPath;
    query?: LocationQueryRaw;
    params?: RouteParamsRaw;
}

export function getRouteNavigationData(parameters: IRouteObject): IRouteObject {
    const { path = PortalPath.Home, params = undefined, query = undefined } = parameters;
    const result: IRouteObject = {
        path,
    };
    if (params) result["params"] = { ...params };
    if (query) result["query"] = { ...query };
    return {
        ...result,
    };
}

export interface IMenu {
    id: TUniqueID;
    label: string;
    icon: TIcon; // IconKeys;
    // type: "button" | "link";
    routeDetails: IRouteObject;
    // action: () => RouteLocationRaw | undefined;
}

// export function menusList(type: "side menu" | "dashboard"): IMenu[] {
//     const studyStore = useStudyStore();
//     const result: IMenu[] = [];
//     if (type === "side menu") {
//         result.push({
//             id: 1,
//             label: "Dashboard",
//             icon: "dashboard",
//             routeDetails: {
//                 path: PortalPath.Dashboard,
//             },
//             // action: () => {
//             //     log("info", ["My Tasks is pressed"]);
//             //     return undefined;
//             // },
//         });
//     }
//     result.push(
//         {
//             id: 2,
//             label: "My Tasks",
//             icon: "my-tasks",
//             routeDetails: {
//                 path: PortalPath.Dashboard,
//             },
//             // action: () => {
//             //     log("info", ["My Tasks is pressed"]);
//             //     return undefined;
//             // },
//         },
//         {
//             id: 3,
//             label: "Clinical Trials",
//             icon: "clinical-trials",
//             routeDetails: {
//                 path: PortalPath.ClinicalTrials,
//             },
//             // action: () => {
//             //     // popupModalStore.show();
//             //     log("info", ["Clinical Trials is pressed"]);
//             //     let result = undefined;
//             //     return result;
//             // },
//         },
//     );

//     // if (checkIfActionIsAllowed(studyStore.getRoleIdBySiteId(), RolePermissionType.Query)) {
//     // }
//     result.push({
//         id: 4,
//         label: "Discrepancy Management",
//         icon: "discrepancy-management",
//         routeDetails: {
//             path: PortalPath.DiscrepancyManagement,
//         },
//         // action: () => {
//         //     log("info", ["Discrepancy Management is pressed"]);
//         //     return undefined;
//         // },
//     });
//     result.push({
//         id: 5,
//         label: "Medical Coding",
//         icon: "medical-coding",
//         routeDetails: {
//             path: PortalPath.Dashboard,
//         },
//         // action: () => {
//         //     log("info", ["Medical Coding is pressed"]);
//         //     return undefined;
//         // },
//     });
//     if (
//         checkIfActionIsAllowed(studyStore.getRoleIdBySiteId(), RolePermissionType.SubjectEnrollment)
//     ) {
//         result.push({
//             id: 6,
//             label: "Onboard Subjects",
//             icon: "onboard-subjects",
//             routeDetails: {
//                 path: PortalPath.Subject,
//             },
//             // action: () => {
//             //     log("info", ["Onboard subjects is pressed"]);
//             //     return undefined;
//             // },
//         });
//     }
//     if (
//         checkIfActionIsAllowed(
//             studyStore.getRoleIdBySiteId(),
//             RolePermissionType.UserAdditionAndRoleAssingment,
//         )
//     ) {
//         result.push({
//             id: 7,
//             label: "Onboard Users",
//             icon: "onboard-users",
//             routeDetails: {
//                 path: PortalPath.User,
//             },
//             // action: () => {
//             //     log("info", ["Onboard users is pressed"]);
//             //     return undefined;
//             // },
//         });
//     }
//     if (checkIfActionIsAllowed(studyStore.getRoleIdBySiteId(), RolePermissionType.ReportModule)) {
//         result.push({
//             id: 9,
//             label: "Report",
//             icon: "report",
//             routeDetails: {
//                 path: PortalPath.Dashboard,
//             },
//             // action: () => {
//             //     log("info", ["Onboard users is pressed"]);
//             //     return undefined;
//             // },
//         });
//     }
//     if (checkIfActionIsAllowed(studyStore.getRoleIdBySiteId(), RolePermissionType.ReportModule)) {
//         result.push({
//             id: 10,
//             label: "Data View/Export",
//             icon: "data-view-or-export",
//             routeDetails: {
//                 path: PortalPath.DataViewOrExport,
//             },
//             // action: () => {
//             //     log("info", ["Onboard users is pressed"]);
//             //     return undefined;
//             // },
//         });
//     }
//     return deepClone(result);
// }
export function menusList(type: "side menu" | "dashboard"): IMenu[] {
    // const studyStore = useStudyStore();
    const result: IMenu[] = [];
    if (type === "side menu") {
        result.push({
            id: 1,
            label: "Dashboard",
            icon: "dashboard",
            routeDetails: {
                path: PortalPath.Dashboard,
            },
        });
    }
    result.push(
        {
            id: 2,
            label: "My Tasks",
            icon: "my-tasks",
            routeDetails: {
                path: PortalPath.MyTasks,
            },
        },
        {
            id: 3,
            label: "Clinical Trials",
            icon: "clinical-trials",
            routeDetails: {
                path: PortalPath.ClinicalTrials,
            },
        },
        {
            id: 4,
            label: "Discrepancy Management",
            icon: "discrepancy-management",
            routeDetails: {
                path: PortalPath.DiscrepancyManagement,
            },
        },
        // {
        //     id: 5,
        //     label: "Medical Coding",
        //     icon: "medical-coding",
        //     routeDetails: {
        //         path: PortalPath.Dashboard,
        //     },
        // },
        {
            id: 6,
            label: "Onboard Subjects",
            icon: "onboard-subjects",
            routeDetails: {
                path: PortalPath.Subject,
            },
        },
        {
            id: 7,
            label: "Onboard Users",
            icon: "onboard-users",
            routeDetails: {
                path: PortalPath.User,
            },
        },
        // {
        //     id: 9,
        //     label: "Report",
        //     icon: "report",
        //     routeDetails: {
        //         path: PortalPath.Dashboard,
        //     },
        // },
        {
            id: 10,
            label: "Data View/Export",
            icon: "data-view-or-export",
            routeDetails: {
                path: PortalPath.DataViewOrExport,
            },
        },
    );
    return deepClone(result);
}

export function checkIfAuthorizedAdminRoutes(path: string) {
    let result = false;
    for (const [key, adminPath] of Object.entries(AdminPath)) {
        if (key === "Login") continue;
        if (path.includes(adminPath)) {
            result = true;
            break;
        }
    }
    return result;
}

export function checkIfAuthorizedPortalRoutes(path: string) {
    let result = false;
    const excludedKeys = [
        "Home",
        "Login",
        "SetNewPassword",
        "ForgotPassword",
        "ForgotPasswordOtp",
        "ResetPassword",
    ];
    for (const [key, portalPath] of Object.entries(PortalPath)) {
        if (excludedKeys.includes(key)) continue;
        if (path.includes(portalPath) && !path.includes("admin")) {
            result = true;
            break;
        }
    }
    return result;
}

export async function redirectToPortalLogin(showMessage: boolean = false) {
    if (showMessage) {
        const toastStore = useToastStore();
        toastStore.error({
            title: "Error",
            message: "Invalid URL",
        });
    }
    await navigateTo(
        {
            path: PortalPath.Login,
        },
        {
            replace: true,
        },
    );
}

export async function redirectToAdminLogin(showMessage: boolean = false) {
    if (showMessage) {
        const toastStore = useToastStore();
        toastStore.error({
            title: "Error",
            message: "Invalid URL",
        });
    }
    await navigateTo(
        {
            path: AdminPath.Login,
        },
        {
            replace: true,
        },
    );
}

export async function redirectToDashboard() {
    const studyStore = useStudyStore();
    if (!studyStore.isStudySelected()) {
        const route = useRoute();
        let isRedirect = false;
        // TODO whenever a new route in portal is added and selection of study is mandatory, please add it to the below list.
        for (const row of [
            PortalPath.ClinicalTrials,
            PortalPath.Subject,
            PortalPath.User,
            PortalPath.DataViewOrExport,
            PortalPath.DiscrepancyManagement,
            PortalPath.MyTasks,
        ]) {
            if (route.fullPath.includes(row)) {
                isRedirect = true;
                break;
            }
        }
        if (isRedirect) {
            await navigateTo({
                path: PortalPath.Dashboard,
            });
        } else if (route.fullPath.includes(PortalPath.Dashboard)) {
            studyStore.loading.pageDetails = false;
        }
    } else {
        studyStore.loading.pageDetails = false;
    }
}

export function isTriggerStudyModal(to: RouteLocationNormalized, from: RouteLocationNormalized) {
    let triggerModal = false;
    // if (
    //     (from.fullPath.includes(PortalPath.Dashboard) &&
    //         to.fullPath.includes(PortalPath.Dashboard)) ||
    //     (from.fullPath.includes(PortalPath.Login) && to.fullPath.includes(PortalPath.Dashboard))
    // ) {
    //     triggerModal = true;
    const validDashboardPaths = ["/dashboard", "/dashboard/"];
    const validLoginPaths = ["/login", "/login/"];
    if (
        (validDashboardPaths.includes(from.fullPath) &&
            validDashboardPaths.includes(to.fullPath)) ||
        (validLoginPaths.includes(from.fullPath) && validDashboardPaths.includes(to.fullPath))
    ) {
        triggerModal = true;
    }
    if (triggerModal) {
        const studyStore = useStudyStore();
        studyStore.triggerModelInDashboard = true;
    }
}

export async function redirectToDashboardDueToNoPermission(enableAutoClear: boolean = false) {
    triggerUnauthorizedToastMessage(
        "You do not have the necessary permissions to view this page.",
        enableAutoClear,
    );
    await navigateTo(
        getRouteNavigationData({
            path: PortalPath.Dashboard,
        }),
    );
}

export function applyFiltersToQuery(
    filters: Record<string, TNullableNumber | TNullableString | Array<string | number>>,
    path: PortalPath,
    keys: string[],
) {
    const route = useRoute();
    const router = useRouter();
    const currentQuery = { ...route.query };
    for (const [filterKey, filterValue] of Object.entries(filters)) {
        if (
            Array.isArray(filterValue) &&
            getArrayLength(filterValue) > 0
            // &&
            // !checkIfKeyExistsInObject(filterKey, currentQuery)
        )
            currentQuery[filterKey] = filterValue.join(",");
        else if (
            !Array.isArray(filterValue) &&
            filterValue !== null
            // &&
            // !checkIfKeyExistsInObject(filterKey, currentQuery)
        )
            currentQuery[filterKey] = String(filterValue);
        else delete currentQuery[filterKey];
    }
    if (getArrayLength(keys) > 0) {
        for (const queryKey of Object.keys(currentQuery)) {
            if (keys.includes(queryKey)) delete currentQuery[queryKey];
        }
    }
    router.replace({ path, query: currentQuery });
}

export function removeFiltersFromQuery(keys: string[], path: PortalPath) {
    const route = useRoute();
    const router = useRouter();
    let currentQuery = { ...route.query };
    if (getArrayLength(keys) > 0) {
        for (const queryKey of Object.keys(currentQuery)) {
            if (keys.includes(queryKey)) delete currentQuery[queryKey];
        }
    } else {
        currentQuery = {};
    }
    // console.log("currentQuery initial", deepClone(currentQuery));
    // for (const [filterKey, filterValue] of Object.entries(filters)) {
    //     if (
    //         (Array.isArray(filterValue) && getArrayLength(filterValue) === 0) ||
    //         (!Array.isArray(filterValue) && filterValue === null)
    //     )
    //         delete currentQuery[filterKey];
    // }
    // console.log("currentQuery final", deepClone(currentQuery));
    router.replace({ path, query: currentQuery });
}
