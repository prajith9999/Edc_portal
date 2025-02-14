const useSideBarStore = defineStore("sideBarStore", () => {
    const showBar = ref<boolean>(false);

    function show() {
        showBar.value = true;
    }

    function hide() {
        showBar.value = false;
    }

    function clearStore() {
        showBar.value = false;
    }

    return { showBar, show, hide, clearStore };
});

export default useSideBarStore;
