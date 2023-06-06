const chartConfig = {
    type: 'bar',
    data: {
        labels: ["12:00 AM", "1:00 AM", "2:00 AM", "3:00 AM",
            "4:00 AM", "5:00 AM", "6:00 AM", "7:00 AM",
            "8:00 AM", "9:00 AM", "10:00 AM", "11:00 AM",
            "12:00 PM", "1:00 PM", "2:00 PM", "3:00 PM",
            "4:00 PM", "5:00 PM", "6:00 PM", "7:00 PM",
            "8:00 PM", "9:00 PM", "10:00 PM", "11:00 PM",
            "12:00 AM"
        ],
        datasets: [
            {
                label: 'Tide: ',
                data: [],
                borderWidth: 1,
                backgroundColor: '#7faefa'
            }
        ]
    },
    options: {
        plugins: {
            legend: {
                display: false
            },
            title: {
                display: true,
                text: "",
                padding: {
                    top: 10,
                    bottom: 14
                },
                font: {
                    size: 18
                }
            }
        },
        scales: {
            y: {
                beginAtZero: true,
                title: {
                    display: true,
                    text: "Height (ft.)",
                    font: {
                        size: 16
                    }
                }
            },
            x: {
                title: {
                    display: true,
                    text: "",
                    font: {
                        size: 16
                    }
                }
            }
        }
    }
}