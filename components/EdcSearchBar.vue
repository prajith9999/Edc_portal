<script setup lang="ts">
    import useGlobalStore from "~/stores/global";
    import type { TNullableString } from "~/types/common";

    const modelValue = defineModel<TNullableString>();
    const globalStore = useGlobalStore();

    const props = withDefaults(
        defineProps<{
            elementId: string;
            inputClass?: string;
            placeholder?: string;
            isDebounce?: boolean;
            disabled?: boolean;
            label?: string;
            labelClass?: string;
            debounceDelay?: number;
            containerClass?: string;
        }>(),
        {
            inputClass: "",
            placeholder: "Search...",
            isDebounce: true,
            disabled: false,
            label: "",
            labelClass: "",
            debounceDelay: 500,
            containerClass: "",
        },
    );

    const emit = defineEmits<{
        "on-input": [];
        "on-search": [searchQuery: TNullableString];
    }>();

    const getInputId = useMemoize(() => props.elementId);

    const containerClasses = computed(() => ({
        "flex flex-col gap-[0rem]": true,
        [props.containerClass]: props.containerClass,
    }));

    const inputClasses = computed(() => ({
        "outline-none w-[90%]": true,
        [props.inputClass]: props.inputClass,
        "input-font": !props.inputClass.includes("font"),
        // "bg-[var(--color-disabled-alternative)]": props.disabled,
    }));

    function handleInputChange() {
        if (props.isDebounce) {
            if (!globalStore.showTableProcessingMessage[props.elementId])
                globalStore.toggleProcessingMessage(true, props.elementId);
            debouncedSearchFilter();
        } else {
            log("info", ["Not debounced.... :)"]);
            emit("on-input");
        }
    }

    function handleClearSearch() {
        modelValue.value = null;
        handleInputChange();
    }

    const debouncedSearchFilter = useDebounceFn(() => {
        log("info", ["Debounced.... :)"]);
        emit("on-search", modelValue.value as TNullableString);
        globalStore.toggleProcessingMessage(false, props.elementId);
    }, props.debounceDelay);

    watch(
        () => modelValue.value,
        (newValue) => {
            if (!newValue) modelValue.value = null;
        },
    );
</script>

<template>
    <div :class="containerClasses" :disabled="isElementDisabled(disabled)">
        <edc-form-label
            v-if="label"
            :input-id="getInputId()"
            :label="label"
            :label-class="labelClass"
            :disabled="disabled"
        />
        <div
            class="relative flex flex-row items-center gap-[0.5rem] form-input bg-white"
            :disabled="isElementDisabled(disabled)"
        >
            <img
                :src="getImageSource(IconKeys.Search, 'icon')"
                :alt="getAltTagTitle('Search')"
                class="md:h-[1.2rem] lg:h-[1.5rem]"
            />
            <input
                :id="getInputId()"
                v-model="modelValue"
                type="text"
                :class="inputClasses"
                :placeholder="placeholder || ''"
                :disabled="isElementDisabled(disabled)"
                @input="handleInputChange()"
            />
            <edc-pressable
                v-if="getStringLength(modelValue) > 0"
                :disabled="isElementDisabled(disabled)"
                :on-click="
                    () => {
                        handleClearSearch();
                    }
                "
            >
                <edc-icon
                    icon="close-icon"
                    class="stroke-[var(--color-black)] !w-[1rem] !h-[1rem]"
                />
            </edc-pressable>
        </div>
    </div>
</template>

<style scoped></style>
