<script setup lang="ts">
    const error = useError();
    log("error", ["error =>", error.value]);

    const errorType = computed(() => {
        let type: "page not found" | "code error" | "" = "";
        if (error.value?.statusCode === 404) type = "page not found";
        // else if (error.value?.statusCode === 500) type = "code error";
        else type = "code error";
        return type;
    });

    function handleGoBack() {
        const path = getAppType() === "admin" ? AdminPath.Login : PortalPath.Login;
        return navigateTo(
            getRouteNavigationData({
                path,
            }),
        );
    }
</script>

<template>
    <div class="flex flex-col items-center justify-center w-screen h-screen">
        <div
            v-if="errorType === 'page not found'"
            class="page-not-found-container flex flex-col justify-center items-center gap-[1rem]"
        >
            <edc-icon
                key="pageNotFound"
                icon="not-found"
                class="fill-[var(--color-primary)] w-[10rem] h-[10rem]"
            />
            <div class="flex flex-row items-center gap-[1rem]">
                <span class="font-bold primary-text font-18">404</span>
                <span class="font-normal black-text font-18">Page not found</span>
            </div>
            <edc-action-button
                container-class="px-[1rem] py-[0.5rem] rounded-[--border-radius-4]"
                label="Go back"
                :on-click="
                    () => {
                        handleGoBack();
                    }
                "
            />
        </div>
        <div
            v-else
            class="code-error-container flex flex-col justify-center items-center gap-[1rem]"
        >
            <edc-icon
                key="codeError"
                icon="triangle-exclamation"
                class="fill-[var(--color-error)] w-[10rem] h-[10rem]"
            />
            <div class="flex flex-row items-center gap-[1rem]">
                <span class="font-bold black-text font-18">Something went wrong</span>
            </div>
            <edc-action-button
                container-class="px-[1rem] py-[0.5rem] rounded-[--border-radius-4]"
                label="Go back"
                :on-click="
                    () => {
                        handleGoBack();
                    }
                "
            />
        </div>
    </div>
</template>

<style scoped></style>
