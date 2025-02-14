export function checkEmail(email: string) {
    const regex =
        // /^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/i;
        /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    return regex.test(email);
}

export function checkOID(oid: string, type: "default" | "form field" = "default") {
    // /^(?=.*[A-Za-z])(?=.*\d)[A-Za-z\d_]{1,50}$/
    const regex = type === "default" ? /^(?=.*[A-Za-z])[A-Za-z\d_]{1,50}$/ : /^[a-zA-Z0-9_]{1,50}$/;
    return regex.test(oid);
}

export function checkVariableFormat(format: string) {
    // eslint-disable-next-line no-useless-escape
    const regex = /^(?=[^$]*\$?[^$]*$)(?=[^+]*\+?[^+]*\+?[^+]*$)(?=[^.]*\.?[^.]*$)[\d$+\.]+$/;
    return regex.test(format);
}
