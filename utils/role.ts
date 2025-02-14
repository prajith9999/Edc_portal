// @ts-ignore
// @ts-nocheck
import useUserStore from "~/stores/user";

export enum RolePermissionType {
    Read = 1,
    Edit = 2,
    Delete = 3,
    Query = 4,
    SDV = 5,
    DataReview = 6,
    Freeze = 7,
    Lock = 8,
    SiteCreationOrUpdateOrDelete = 9,
    SubjectEnrollment = 10,
    MoveSubjectsAcrossSite = 11,
    INVSignature = 12,
    AddUNSUnscheduledVisit = 13,
    AddEventWithinAVisitAddNewRowForLogeCRF = 14,
    UserAdditionAndRoleAssingment = 15,
    BackendDevelopmerMode = 16,
    ReportModule = 17,
}
export function checkIfActionIsAllowed(
    roleId: number | number[],
    rolePermissionTypeIds: RolePermissionType[],
) {
    let result = false;
    const userStore = useUserStore();
    userStore.getRolePermissionDetails();
    for (const rolePermissionsDetails of userStore.rolePermissionsDetails) {
        if (
            Array.isArray(roleId) &&
            roleId.includes(Number(rolePermissionsDetails.roleId)) &&
            // isEqual(rolePermissionsDetails.rolePermissionTypeId, rolePermissionTypeId, "number")
            rolePermissionTypeIds.includes(rolePermissionsDetails.rolePermissionTypeId)
        ) {
            result = rolePermissionsDetails.isAccessGranted;
            if (result) break;
        } else if (
            isEqual(rolePermissionsDetails.roleId, roleId, "number") &&
            // isEqual(rolePermissionsDetails.rolePermissionTypeId, rolePermissionTypeId, "number")
            rolePermissionTypeIds.includes(rolePermissionsDetails.rolePermissionTypeId)
        ) {
            result = rolePermissionsDetails.isAccessGranted;
            if (result) break;
        }
    }
    return result;
}

const rolesList = {
    1: "PI",
    2: "CRC",
    3: "CRA",
    4: "DE1",
    5: "DE2",
    6: "DM",
    7: "Sponsor",
    8: "SU",
    9: "EDC Admin",
    10: "Programmer(Prod)",
    11: "Programmer",
    12: "MC",
    13: "SP",
    14: "UDM",
    15: "INT",
};
export function isRoleAllowedForTheSelectedEnvironment(environment: string, role: string) {
    let result = false;
    switch (environment) {
        case "DEV":
            result = [rolesList[11], rolesList[15]].includes(role);
            break;
        case "MIGRATION":
            result = [rolesList[11], rolesList[15]].includes(role);
            break;
        case "PROD":
            result = [
                rolesList[1],
                rolesList[2],
                rolesList[3],
                rolesList[4],
                rolesList[5],
                rolesList[6],
                rolesList[7],
                rolesList[9],
                rolesList[10],
            ].includes(role);
            break;
        case "TRAINING":
            result = [
                rolesList[1],
                rolesList[2],
                rolesList[3],
                rolesList[4],
                rolesList[5],
                rolesList[6],
                rolesList[7],
                rolesList[8],
                rolesList[9],
                rolesList[11],
                rolesList[12],
                rolesList[13],
                rolesList[14],
                rolesList[15],
            ].includes(role);
            break;
        case "UAT":
            result = [
                rolesList[4],
                rolesList[5],
                rolesList[6],
                rolesList[7],
                rolesList[9],
                rolesList[11],
                rolesList[14],
                rolesList[15],
            ].includes(role);
            break;
    }
    return result;
}
