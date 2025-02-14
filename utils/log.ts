import getEnvironmentVariables, { EnvLabel } from "~/config/env-variables";

// const getAppMode = () => getEnvironmentVariables(EnvLabel.appMode);

type TLogLevel = "info" | "error" | "warn";

export default function log(level: TLogLevel, message: any[], show = level === "error") {
    const appMode = getEnvironmentVariables(EnvLabel.appMode);
    const enableLog = appMode === "dev" || show;
    if (enableLog) {
        if (level === "info") console.log(...message);
        else if (level === "error") console.error(...message);
        else console.warn(...message);
    }
}
