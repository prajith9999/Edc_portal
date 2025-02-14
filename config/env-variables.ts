export enum EnvLabel {
    appMode = "App Mode",
    apiBaseURL = "Api Base URL",
    encodeKey = "Encode Key",
}

export default function getEnvironmentVariables(label: EnvLabel): string {
    // const appConfig = useAppConfig();
    const runtimeConfig = useRuntimeConfig();
    switch (label) {
        case EnvLabel.appMode:
            return runtimeConfig.public.mode;
        case EnvLabel.apiBaseURL:
            return runtimeConfig.public.apiBaseURL;
        case EnvLabel.encodeKey:
            return runtimeConfig.public.encodeKey;
        default:
            return "";
    }
}
