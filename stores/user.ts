import { logoutAPI } from "~/services/apis/handlers/portal/user";
import type { IRolePermissionData } from "~/services/apis/handlers/types/user-types";
import useToastStore from "./toast";

export interface IUser {
    id: number;
    name: string;
    orgType: string;
    firstName: string;
    lastName: string;
    username: string;
    orgName: string;
    enterpriseName: string;
    lastLoginTime: string;
    roleId: number;
    role: string;
}

export interface IAuth {
    token: string;
    tokenType: string;
    expiry: string;
}

interface ICheckPermission {
    isUserDetails: boolean;
    isRolePermissions: boolean;
}

const getDefaultUserDetails = (): IUser => ({
    id: 0,
    name: "",
    orgType: "",
    firstName: "",
    lastName: "",
    username: "",
    orgName: "",
    enterpriseName: "",
    lastLoginTime: "",
    roleId: 0,
    role: "",
});

const getDefaultAuthDetails = (): IAuth => ({
    token: "",
    tokenType: "",
    expiry: "",
});

const getDefaultCheckPermissionDetails = (): ICheckPermission => ({
    isRolePermissions: false,
    isUserDetails: false,
});

const useUserStore = defineStore("userStore", () => {
    const userDetails = ref<IUser>({
        ...getDefaultUserDetails(),
    });
    const authDetails = ref<IAuth>({
        ...getDefaultAuthDetails(),
    });
    const rolePermissionsDetails = ref<IRolePermissionData[]>([]);
    const triggerDashboardMenuChange = ref<boolean>(false);
    const isLogoutTriggered = ref<boolean>(false);
    const adminCheckPermissionDetails = ref<ICheckPermission>({
        ...getDefaultCheckPermissionDetails(),
    });

    function setDetails(details: IUser) {
        userDetails.value.id = details.id;
        userDetails.value.name = details.name;
        userDetails.value.orgType = details.orgType;
        userDetails.value.firstName = details.firstName;
        userDetails.value.lastName = details.lastName;
        userDetails.value.username = details.username;
        userDetails.value.orgName = details.orgName;
        userDetails.value.lastLoginTime = details.lastLoginTime;
        userDetails.value.enterpriseName = details.enterpriseName;
        userDetails.value.role = details.role;
        userDetails.value.roleId = details.roleId;
    }

    function setAuthDetails(details: IAuth) {
        authDetails.value.token = details.token;
        authDetails.value.tokenType = details.tokenType;
        authDetails.value.expiry = details.expiry;
    }

    function getDetails(): IUser {
        const userDetailsInLocalStorage = getFromLocalStorage(TLocalStorageKeys.userDetails);
        if (userDetailsInLocalStorage) return JSON.parse(userDetailsInLocalStorage);
        return userDetails.value;
    }

    function getAuthDetails(): IAuth {
        const authDetailsInLocalStorage = getFromLocalStorage(TLocalStorageKeys.auth);
        if (authDetailsInLocalStorage) return decodeData(authDetailsInLocalStorage);
        return authDetails.value;
    }

    async function logout(type: "portal" | "admin", showLogoutMessage: boolean = true) {
        const router = useRouter();
        const toastStore = useToastStore();
        isLogoutTriggered.value = true;
        await logoutAPI();
        router.replace(
            getRouteNavigationData({
                path: type === "portal" ? PortalPath.Login : AdminPath.Login,
            }),
        );
        if (showLogoutMessage)
            toastStore.success({
                title: "Success",
                message: "Logout success",
            });
        isLogoutTriggered.value = false;
        clearPiniaStores(
            type === "admin" ? "adminWinFormStore" : "",
            "codeUpdateStore",
            "dataCollectionStore",
            "globalStore",
            "loaderStore",
            "popupModalStore",
            "sideBarStore",
            "studyStore",
            // "toastStore",
            "unsavedAlertStore",
            "urlStore",
            "userStore",
            "quickLinkStore",
        );
        clearFromLocalStorage(TLocalStorageKeys.userDetails);
        clearFromLocalStorage(TLocalStorageKeys.auth);
        clearFromLocalStorage(TLocalStorageKeys.emailTemplates);
        clearFromLocalStorage(TLocalStorageKeys.studyDetails);
        clearFromLocalStorage(TLocalStorageKeys.permissions);
        clearFromLocalStorage(TLocalStorageKeys.studyPermissions);
    }

    function getRolePermissionDetails() {
        const rolePermissionDetailsInLocalStorage = getFromLocalStorage(
            TLocalStorageKeys.permissions,
        );
        if (rolePermissionDetailsInLocalStorage) {
            const parsedRolePermissionDetails = decodeData(
                rolePermissionDetailsInLocalStorage,
            ) as IRolePermissionData[];
            rolePermissionsDetails.value = deepClone(parsedRolePermissionDetails);
        }
    }

    function setRolePermissionDetails(listData: IRolePermissionData[]) {
        rolePermissionsDetails.value = [...listData];
        setToLocalStorage(TLocalStorageKeys.permissions, encodeData(listData));
    }

    function checkIfPermissionAllowed(roleId: number, rolePermissionTypeId: number) {
        let result = false;
        for (const row of rolePermissionsDetails.value) {
            if (
                row.roleId === roleId &&
                row.rolePermissionTypeId === rolePermissionTypeId &&
                row.isAccessGranted
            ) {
                result = true;
                break;
            }
        }
        return result;
    }

    function clearStore() {
        userDetails.value = { ...getDefaultUserDetails() };
        authDetails.value = { ...getDefaultAuthDetails() };
        rolePermissionsDetails.value = [];
        triggerDashboardMenuChange.value = false;
        adminCheckPermissionDetails.value = { ...getDefaultCheckPermissionDetails() };
    }

    return {
        userDetails,
        authDetails,
        rolePermissionsDetails,
        triggerDashboardMenuChange,
        isLogoutTriggered,
        adminCheckPermissionDetails,
        setDetails,
        getDetails,
        setAuthDetails,
        getAuthDetails,
        logout,
        getRolePermissionDetails,
        setRolePermissionDetails,
        checkIfPermissionAllowed,
        clearStore,
    };
});

export default useUserStore;
