export enum TLocalStorageKeys {
    appVersion = "appVersion",
    auth = "auth",
    userDetails = "userDetails",
    emailTemplates = "emailTemplates",
    studyDetails = "studyDetails",
    permissions = "permissions",
    studyPermissions = "studyPermissions",
}

export function getFromLocalStorage(key: TLocalStorageKeys) {
    let data = null;
    if (process.client) data = localStorage.getItem(key);
    return data;
}

export function setToLocalStorage(key: TLocalStorageKeys, data: string) {
    if (process.client) localStorage.setItem(key, data);
}

export function clearFromLocalStorage(key?: TLocalStorageKeys) {
    if (process.client) {
        if (key) {
            localStorage.removeItem(key);
        } else {
            localStorage.clear();
        }
    }
}
