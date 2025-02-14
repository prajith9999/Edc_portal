export type TToastStatus = "success" | "error" | "warning" | "info";

type TToastTimeout = 3000 | 5000 | 7000;

interface IToast {
    id: string;
    title: string;
    message: string;
    status: TToastStatus;
    timeout: TToastTimeout;
    createdOn: string;
    enableAutoClear: boolean;
}

type ToastPayload = {
    timeout?: TToastTimeout;
    title?: string;
    message: string;
    id?: string;
    enableAutoClear?: boolean;
};

const defaultTimeout: TToastTimeout = 3000;

const getDefaultToastId = () => btoa(String(new Date().getTime() + Math.random() * 1000));

const getDefaultTitle = (status: TToastStatus) => capitalizeWord(status, true);

const createToast = (
    id: string,
    title: string = getDefaultTitle("success"),
    message: string,
    status: TToastStatus,
    timeout: TToastTimeout = defaultTimeout,
    enableAutoClear: boolean = false,
): IToast => ({
    id,
    title,
    message,
    status,
    timeout,
    createdOn: formatDate(currentDate(), "YYYY-MM-DD HH:mm:ss", false),
    enableAutoClear,
});

const useToastStore = defineStore("toastStore", () => {
    const toasts = ref<IToast[]>([]);

    function show(payload: ToastPayload, status: TToastStatus) {
        const {
            id = getDefaultToastId(),
            timeout = defaultTimeout,
            message,
            title = getDefaultTitle(status),
            enableAutoClear = false,
        } = payload;
        const toast = createToast(id, title, message, status, timeout, enableAutoClear);
        if (
            !checkIfItemExists({
                data: toasts.value,
                type: "object",
                value: toast.id,
                key: "id",
            })
        ) {
            toasts.value.push(toast);
            useTimeoutFn(() => {
                close(toast.id);
            }, timeout);
        }
    }

    function success(payload: ToastPayload) {
        show(
            {
                ...payload,
                title: payload.title || getDefaultTitle("success"),
            },
            "success",
        );
    }

    function error(payload: ToastPayload) {
        show(
            {
                ...payload,
                title: payload.title || getDefaultTitle("error"),
            },
            "error",
        );
    }

    function warning(payload: ToastPayload) {
        show(
            {
                ...payload,
                title: payload.title || getDefaultTitle("warning"),
            },
            "warning",
        );
    }

    function info(payload: ToastPayload) {
        show(
            {
                ...payload,
                title: payload.title || getDefaultTitle("info"),
            },
            "info",
        );
    }

    function close(id: string) {
        const index = getIndexOfTheItem({
            data: toasts.value,
            type: "object",
            value: id,
            key: "id",
        });
        if (index >= 0) toasts.value.splice(index, 1);
    }

    function clearStore() {
        toasts.value = [];
    }

    return { toasts, show, success, error, warning, info, close, clearStore };
});

export default useToastStore;
