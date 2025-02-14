<script setup lang="ts">
    import type { TNullableNumber, TNullableString } from "~/types/common";
    import type { IRadioGroupProps, TTabIndex } from "~/types/form-generation";
    import { getTabIndexByControlType, getTabIndexByIndex } from "~/utils/form-generation";

    const modelValue = defineModel<TNullableString | TNullableNumber>({
        default: null,
    });
    const specifyModel = defineModel<TNullableString>("specify");

    const props = withDefaults(defineProps<IRadioGroupProps>(), {
        disabled: false,
        error: "",
        labelClass: "",
        containerClass: "",
        required: false,
        type: "horizontal",
        allowDeselect: false,
        isSpecifyEntry: false,
        label: "",
        labelContainerClass: "",
        helpText: null,
        inputClass: "",
        showHelpText: false,
        tabindex: undefined,
        tabindexes: undefined,
    });

    const emit = defineEmits<{
        "on-change": [selectedValue: string];
        "on-model-change": [];
    }>();

    const tabIndexes = ref<TTabIndex>(getTabIndexByControlType(props.tabindexes));

    const containerClasses = () => `w-fit ${props.containerClass}`.trim();

    const labelClasses = () => `mb-[0.2rem] ${props.labelClass}`.trim();

    const groupContainerClasses = computed(() => ({
        flex: true,
        "flex-col gap-[0.5rem]": props.type === "vertical",
        "flex-row items-center gap-[1rem]": props.type === "horizontal",
    }));

    const showSpecifyEntry = computed(
        () =>
            getArrayLength(
                props.options.filter(
                    ({ value, specify = false }) => value === modelValue.value && specify,
                ),
            ) > 0,
    );

    // const getInputId = useMemoize(
    //     () => props.name || convertWordsIntoCasedWords(props.label || "", "camel case"),
    // );

    // const isEnabled = () =>
    //     getArrayLength(
    //         props.options.filter((row) => row.value === inputModel.value && row.specify),
    //     );

    // <edc-text-input
    //         v-if="isSpecifyEntry"
    //         v-model="specifyModel"
    //         type="text"
    //         :input-class="inputClass"
    //         placeholder="Specify"
    //         :disabled="isEnabled() === 0"
    //     />

    // :container-class="`${isSpecifyEntry ? 'mt-[0.3rem]' : '-mt-[0.2rem]'}`"
    watch(
        () => modelValue.value,
        (newModelValue) => {
            if (newModelValue === null) {
                emit("on-model-change");
            }
        },
    );
</script>

<template>
    <div class="flex flex-col gap-[0rem] w-fit">
        <edc-form-label
            :input-id="''"
            :label="label"
            :required="required"
            :label-class="labelClass"
            :disabled="disabled"
            :show-help-text="showHelpText"
            :help-text="helpText"
            :label-container-class="labelContainerClass"
        />
        <div :class="groupContainerClasses">
            <template v-if="type === 'vertical'">
                <template v-for="optionRow of options" :key="optionRow.label">
                    <div class="grid grid-cols-2 gap-[1rem]">
                        <edc-radio
                            v-model="modelValue"
                            :name="name"
                            :label="optionRow.label"
                            :value="optionRow.value"
                            :label-class="labelClasses()"
                            :input-class="inputClass"
                            :container-class="containerClasses()"
                            :allow-deselect="allowDeselect"
                            :disabled="isElementDisabled(disabled)"
                            :checked="optionRow.value === modelValue"
                            :tabindex="getTabIndexByIndex(tabIndexes, 0)"
                            @on-change="
                                (selectedOption: string) => {
                                    // model[modelKey] = selectedOption;
                                    emit('on-change', selectedOption);
                                    emit('on-model-change');
                                    // model[modelKey] = selectedOption;
                                }
                            "
                        />
                        <edc-text-input
                            v-model="specifyModel"
                            :container-class="`${optionRow.specify && modelValue === optionRow.value ? 'visible' : 'invisible'}`"
                            type="text"
                            :input-class="inputClass"
                            placeholder="Specify"
                            :tabindex="getTabIndexByIndex(tabIndexes, 1)"
                        />
                    </div>
                </template>
            </template>
            <template v-else>
                <edc-radio
                    v-for="optionRow of options"
                    :key="optionRow.label"
                    v-model="modelValue"
                    :name="name"
                    :label="optionRow.label"
                    :value="optionRow.value"
                    :label-class="labelClasses()"
                    :input-class="inputClass"
                    :container-class="containerClasses()"
                    :allow-deselect="allowDeselect"
                    :disabled="isElementDisabled(disabled)"
                    :checked="optionRow.value === modelValue"
                    :tabindex="getTabIndexByIndex(tabIndexes, 0)"
                    @on-change="
                        (selectedOption: string) => {
                            // model[modelKey] = selectedOption;
                            emit('on-change', selectedOption);
                            emit('on-model-change');
                            // model[modelKey] = selectedOption;
                        }
                    "
                />
            </template>
        </div>
        <!-- <span v-if="getArrayLength(options) === 0" class="font-12"> No options to show</span> -->
        <edc-text-input
            v-if="type === 'horizontal' && showSpecifyEntry"
            v-model="specifyModel"
            type="text"
            :input-class="inputClass"
            placeholder="Specify"
            :tabindex="getTabIndexByIndex(tabIndexes, 1)"
        />
        <edc-error-text
            :error="error"
            :container-class="`${showSpecifyEntry ? 'mt-[0.3rem]' : '-mt-[0.2rem]'}`"
        />
    </div>
</template>

<style scoped></style>
