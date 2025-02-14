<script setup lang="ts">
    import useStudyStore from "~/stores/study";

    const props = withDefaults(
        defineProps<{
            breadCrumbDetails: string[];
            type?: "clinical-trials" | "discrepancy-modal";
        }>(),
        {
            type: "clinical-trials",
        },
    );

    const studyStore = useStudyStore();

    const labelClasses = computed(() => ({
        "font-bold": true,
        "text-[1.2rem] lg:text-[1.3rem] accent-text": props.type === "clinical-trials",
        "text-[1.3rem] lg:text-[1.4rem]": props.type === "discrepancy-modal",
    }));
</script>

<template>
    <section
        v-if="getArrayLength(breadCrumbDetails) > 0"
        class="flex flex-row items-center self-start gap-[1rem] mb-[2rem]"
    >
        <template
            v-for="(breadCrumbDetailRow, breadCrumbDetailRowIndex) of breadCrumbDetails"
            :key="breadCrumbDetailRowIndex"
        >
            <edc-skeleton-loader
                v-if="studyStore.loading.pageDetails"
                container-class="w-[9rem] h-[1.95rem]"
            />
            <!-- breadCrumbDetailRowIndex <= 1 -->
            <span
                v-else
                :class="[
                    labelClasses,
                    breadCrumbDetailRowIndex === getArrayLength(breadCrumbDetails) - 1
                        ? 'opacity-60'
                        : '',
                ]"
                >{{ breadCrumbDetailRow }}</span
            >
            <edc-icon
                v-if="
                    (getArrayLength(breadCrumbDetails) === 3 && breadCrumbDetailRowIndex <= 1) ||
                    (getArrayLength(breadCrumbDetails) === 2 && breadCrumbDetailRowIndex <= 0)
                "
                icon="chevron-right-sharp"
                class="w-[1.2rem] h-[1.2rem] opacity-60"
                fill="var(--color-accent)"
            />
        </template>
    </section>
</template>
