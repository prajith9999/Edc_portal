/* eslint-disable array-callback-return */
import { cssvar } from "~/utils/dom";

export const BAR_CHART_OPTIONS = (isAngledLabel: boolean = true) => ({
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
        legend: {
            display: false,
            // labels: {
            //     font: {
            //         size: 50,
            //         family: "Avenir LT Std Book, Helvetica, sans-serif",
            //     },
            // },
        },
        datalabels: {
            color: cssvar("--color-white"), // Set text color (white for better contrast on colored bars)
            anchor: "center", // Position the label in the center of the bar
            align: "center", // Align the label in the middle of the bar
            font: {
                size: 11, // Set font size for the data labels
                family: "Avenir LT Std Book, Helvetica, sans-serif",
                weight: "bold", // Make the text bold for better visibility
            },
            formatter: (value: any) => {
                return value; // Display the actual data value (count)
            },
        },
    },
    scales: {
        x: {
            ticks: {
                autoSkip: false,
                maxRotation: isAngledLabel ? 60 : 0,
                minRotation: isAngledLabel ? 45 : 0,
                font: {
                    size: 11,
                    family: "Avenir LT Std Book, Helvetica, sans-serif",
                },
                color: cssvar("--color-tab-header"),
            },
        },
        y: {
            ticks: {
                font: {
                    size: 11,
                    family: "Avenir LT Std Book, Helvetica, sans-serif",
                },
                color: cssvar("--color-tab-header"),
            },
        },
    },
    elements: {
        bar: {
            borderRadius: 20, // Rounds the corners of the bars
            // hover: {
            //     cursor: "pointer", // Change cursor to pointer on hover
            // },
        },
    },
    onHover: (event: any, chartElement: any) => {
        // Change the cursor to pointer when hovering over a bar
        const chartArea = event.native.target;
        chartArea.style.cursor = "pointer";
        event.native.target.style.cursor = chartElement[0] ? "pointer" : "default";
    },
});

export const DOUGHNUT_CHART_OPTIONS = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
        datalabels: {
            color: "white", // Set text color (white for better contrast on colored bars)
            anchor: "center", // Position the label in the center of the bar
            align: "center", // Align the label in the middle of the bar
            font: {
                size: 11, // Set font size for the data labels
                family: "Avenir LT Std Book, Helvetica, sans-serif",
                weight: "bold", // Make the text bold for better visibility
            },
            formatter: (value: any, ctx: any) => {
                let sum = 0;
                const dataArr = ctx.chart.data.datasets[0].data;
                dataArr.map((data: any) => {
                    sum += data;
                });
                const percentage = ((value * 100) / sum).toFixed(1) + "%";
                return percentage;
            },
            display: (context: any) => {
                // Only display labels if the value is greater than 0
                return context.dataset.data[context.dataIndex] !== 0;
            },
        },
        legend: {
            position: "bottom",
        },
        // tooltip: {
        //     callbacks: {
        //         // Modify tooltip to avoid showing 0% for zero values
        //         label: (tooltipItem) => {
        //             console.log("tooltipItem", tooltipItem);
        //             const value = tooltipItem.raw;
        //             // If the value is 0, return an empty string to avoid displaying "0.0%"
        //             return value === 0 ? "" : `${value}%`;
        //         },
        //     },
        // },
    },
    onHover: (event: any, chartElement: any) => {
        // Change the cursor to pointer when hovering over a bar
        const chartArea = event.native.target;
        chartArea.style.cursor = "pointer";
        event.native.target.style.cursor = chartElement[0] ? "pointer" : "default";
    },
};
