type TPopupModalDetails = Record<string, boolean>;

const usePopupModalStore = defineStore("popupModalStore", () => {
    const modalDetails = ref<TPopupModalDetails>({});

    function show(modalId: string) {
        // if (!checkIfKeyExistsInObject(id, modalDetails.value)) modalDetails.value[id] = true;
        // else modalDetails.value[id] = true;
        modalDetails.value[modalId] = true;
    }

    function hide(modalId: string) {
        modalDetails.value[modalId] = false;
    }

    function modalDetailsById(modalId: string) {
        return checkIfKeyExistsInObject(modalId, modalDetails.value)
            ? modalDetails.value[modalId]
            : false;
    }

    const isModalOpened = computed(() => {
        let result = false;
        for (const row of Object.values(modalDetails.value)) {
            if (row) {
                result = true;
                break;
            }
        }
        return result;
    });

    function clearStore() {
        modalDetails.value = {};
    }

    return { modalDetails, isModalOpened, show, hide, modalDetailsById, clearStore };
});

export default usePopupModalStore;
