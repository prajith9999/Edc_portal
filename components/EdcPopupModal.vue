<script setup lang="ts">
    import usePopupModalStore from "~/stores/popup-modal";
    import useUnsavedAlertStore from "~/stores/unsaved-alert";
    import type { TVoidAction } from "~/types/common";

    const props = withDefaults(
        defineProps<{
            modalId: string;
            cancelLabel?: string;
            submitLabel?: string;
            containerClass?: string;
            primaryButtonType?: "cancel" | "submit" | "delete";
            hideCancel?: boolean;
            onSubmit: (closeModal: TVoidAction) => Promise<void> | void;
            onCancel?: (closeModal: TVoidAction) => void;
        }>(),
        {
            cancelLabel: "Cancel",
            submitLabel: "Submit",
            containerClass: "",
            primaryButtonType: "submit",
            hideCancel: false,
            onCancel: () => {},
        },
    );

    // const emit = defineEmits<{
    //     "after-submit": [closeModal: TVoidAction];
    //     "after-cancel": [closeModal: TVoidAction];
    // }>();

    const popupModalStore = usePopupModalStore();
    const unsavedAlertStore = useUnsavedAlertStore();

    const containerClasses = computed(() => ({
        modal: true,
        [props.containerClass]: props.containerClass,
    }));

    function processUnsavedChanges() {
        return window.confirm("Reload page confirmation message");
    }

    // async function handleSubmit() {
    //     await mockDelay();
    //     emit("after-submit", () => popupModalStore.hide(props.modalId));
    // }

    async function handleSubmit() {
        await props.onSubmit(() => popupModalStore.hide(props.modalId));
    }

    // function handleCancel() {
    //     if (unsavedAlertStore.isUnsavedChanges) {
    //         if (processUnsavedChanges()) {
    //             emit("after-cancel", () => popupModalStore.hide(props.modalId));
    //             unsavedAlertStore.clearStore();
    //         }
    //     } else {
    //         emit("after-cancel", () => popupModalStore.hide(props.modalId));
    //     }
    // }
    function handleCancel() {
        if (unsavedAlertStore.isUnsavedChanges) {
            if (processUnsavedChanges()) {
                props.onCancel(() => popupModalStore.hide(props.modalId));
                unsavedAlertStore.clearStore();
            }
        } else {
            props.onCancel(() => popupModalStore.hide(props.modalId));
        }
    }
</script>

<!-- @click="popupModalStore.hide()" -->
<template>
    <transition name="fade" appear>
        <div v-if="popupModalStore.modalDetailsById(modalId)" class="modal-overlay"></div>
    </transition>
    <transition name="pop" appear>
        <div
            v-if="popupModalStore.modalDetailsById(modalId)"
            :class="[containerClasses]"
            role="dialog"
        >
            <div class="relative">
                <div
                    class="sticky top-0 z-[1000] w-full flex flex-row items-center justify-end white-bg px-[2rem] py-[1rem]"
                >
                    <edc-pressable :on-click="() => handleCancel()">
                        <img
                            :src="getImageSource(IconKeys.Close, 'icon')"
                            :alt="getAltTagTitle('close')"
                            class="h-[1.2rem]"
                        />
                    </edc-pressable>
                </div>
                <div class="flex flex-col gap-[2rem] px-[2rem] pb-[2rem] overflow-x-hidden">
                    <slot />
                </div>
                <div
                    class="sticky bottom-0 z-10 flex flex-row items-center justify-end w-full white-bg p-[2rem]"
                >
                    <div class="flex flex-row items-center self-end gap-[2rem]">
                        <edc-action-button
                            v-if="!hideCancel"
                            :label="cancelLabel"
                            type="cancel"
                            :on-click="() => handleCancel()"
                            container-class="rounded-[--border-radius-4] px-[2rem] py-[0.5rem]"
                            label-class="font-12"
                        />
                        <edc-action-button
                            :label="submitLabel"
                            :on-click="() => handleSubmit()"
                            container-class="rounded-[--border-radius-4] px-[2rem] py-[0.5rem]"
                            label-class="font-12"
                            :type="primaryButtonType"
                        />
                    </div>
                </div>
            </div>
        </div>
    </transition>
</template>

<style scoped>
    .modal {
        /* position: absolute; */
        position: fixed;
        top: 0;
        right: 0;
        bottom: 0;
        left: 0;
        margin: auto;
        text-align: center;
        width: fit-content;
        max-width: 92vw;
        height: fit-content;
        max-height: 88vh;
        overflow-y: auto;
        /* padding: 2rem; */
        border-radius: var(--border-radius-6);
        /* box-shadow: 0 5px 5px rgba(0, 0, 0, 0.2); */
        background: var(--color-white);
        z-index: 999;
        transform: none;
    }

    .modal-overlay {
        content: "";
        position: absolute;
        position: fixed;
        top: 0;
        right: 0;
        bottom: 0;
        left: 0;
        z-index: 998;
        background: var(--color-modal-popup);
        opacity: 0.6;
        cursor: pointer;
    }

    .fade-enter-active,
    .fade-leave-active {
        transition: opacity 0.4s linear;
        /* transition: opacity 500ms ease-out; */
    }

    .fade-enter,
    .fade-leave-to {
        opacity: 0;
    }

    .pop-enter-active,
    .pop-leave-active {
        transition:
            transform 0.4s cubic-bezier(0.5, 0, 0.5, 1),
            opacity 0.4s linear;
    }

    .pop-enter-from,
    .pop-leave-to {
        opacity: 0;
        /* transform: scale(0.3) translateY(-50%); */
        transform: scale(0.3) translateY(-0%);
    }
</style>
