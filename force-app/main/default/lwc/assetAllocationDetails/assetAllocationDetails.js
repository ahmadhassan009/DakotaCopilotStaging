import { LightningElement, api, wire, track } from 'lwc';
import { loadScript } from 'lightning/platformResourceLoader';
import Chart from '@salesforce/resourceUrl/JS_chartjs';
import ResizeJS from '@salesforce/resourceUrl/JS_resizeobserver';
import getChartData from '@salesforce/apex/AssetAllocationDetailsController.getChartDetails';

export default class AssetAllocationDetails extends LightningElement {
    @api recordId;

    @track dataSet;
    @track mapData = [];
    @track notes;
    @track dataSetTarget;
    @track mapDataTarget = [];
    @track notesTarget;

    dataSetExist = false;
    notesExist = false;
    isLoading = false;
    displayCmp = 'slds-hide';
    isScriptLoadError = false;
    asOfDateExist = false;
    asOfDate;
    displayCmpTarget = 'slds-hide';
    dataSetTargetExist = false;
    notesTargetExist = false;
    asOfDateTargetExist = false;
    asOfDateTarget;

    async connectedCallback() {
        try {
            this.isLoading = true;
            await this.loadScripts();
            await this.fetchTargetData();
            await this.fetchCurrentData();
            this.isLoading = false;
        } catch (e) {
            this.isLoading = false;
        }
    }

    async loadScripts() {
        try {

            await loadScript(this, Chart + '/Chart-min.js');
            await loadScript(this, ResizeJS + '/ResizeObserver.min.js');
            await loadScript(this, Chart + '/chartjs-plugin-labels.js');
        } catch (error) {
            this.isScriptLoadError = true;
            this.isLoading = false;
            console.log("There was an Error in Loading Static Resources.");
        }
    }

    async fetchTargetData() {
        try {
            let returnedData = await getChartData({
                recId: this.recordId,
                assetType: 'Target'
            });
            if (returnedData?.length > 0) {
                this.displayCmpTarget = 'slds-show';
                this.setTargetDetails(returnedData?.at(0));
                let ctx = this.template.querySelector(".pie-chart-target")?.getContext('2d');
                this.InitializeChartJs(this.dataSetTarget, ctx);
                if (returnedData?.at(0)?.asOfDate != null) {
                    this.asOfDateTarget = returnedData?.at(0)?.asOfDate;
                    this.asOfDateTargetExist = true;
                }
            }
        } catch (error) {
            console.log(error);
        };
    }

    async fetchCurrentData() {
        try {
            let returnedData = await getChartData({
                recId: this.recordId,
                assetType: 'Actual'
            });
            if (returnedData?.length > 0) {
                this.displayCmp = 'slds-show';
                this.setCurrentDetails(returnedData?.at(0));
                let ctx = this.template.querySelector(".pie-chart")?.getContext('2d');
                this.InitializeChartJs(this.dataSet, ctx);
                if (returnedData?.at(0).asOfDate != null) {
                    this.asOfDate = returnedData?.at(0)?.asOfDate;
                    this.asOfDateExist = true;
                }
            }
        } catch (error) {
            console.log(error);
        };
    }

    InitializeChartJs(chartDataSet, ctx) {

        let data = {
            labels: Object.keys(chartDataSet),
            datasets: [{

                data: Object.values(chartDataSet),
                backgroundColor: ["#479fdb", "#1d3159", "#90dcd8", "#4ba49e", "#Dfcf88", "#Dca238", "#B3443b", "#F5ba6d", "#74af81", "#306f6b", "#F012BE", "#B10DC9", "#111111", "#AAAAAA"],
            }]
        };
        let options = {
            layout: {
                padding: {
                    top: 45,
                    bottom: 25
                }
            },
            borderColor: 'rgba(0,0,0,0)',
            responsive: true,
            maintainAspectRatio: false,
            tooltips: {
                enabled: false
            },
            plugins: {
                legend: {
                    display: false
                },
                datalabels: {
                    display: 'auto',
                    formatter: (value, ctx) => {
                        if (value > 0) {
                            let sum = 0;
                            let dataArr = ctx.chart.data.datasets[0].data;
                            dataArr.map(data => {
                                let v = parseFloat(data);

                                sum += v;
                            });
                            const percentage = value / sum * 100
                            return percentage.toFixed(2) + "%";
                        }
                        else {
                            return '';
                        }
                    },
                    color: '#fff'
                },
                tooltip: {
                    enabled: true,
                    padding: {
                        top: 10,
                        bottom: 8,
                        left: 11,
                        right: 11
                    },
                    callbacks: {
                        label: function (tooltipItems) {
                            if (tooltipItems.parsed) {
                                return tooltipItems.label + ': ' + tooltipItems.parsed + '%';
                            }
                            else '';
                        },
                        footer: (ttItem) => {
                            let sum = 0;
                            let dataArr = ttItem[0].dataset.data;
                            dataArr.map(data => {
                                sum += Number(data);
                            });

                            let percentage = (ttItem[0].parsed * 100 / sum).toFixed(2) + '%';
                            return `Percentage of data: ${percentage}`;
                        }
                    }
                },
            }
        };
        let piechart;
        piechart = new window.Chart(ctx, {
            type: 'doughnut',
            data: data,
            options: options,
            plugins: [ChartDataLabels],
        });
    }

    setTargetDetails(returedData) {
        if (returedData.chartDetails != null && returedData.chartDetails.length > 0) {
            if (returedData.notes != null) {
                this.notesTarget = returedData.notes;
                this.notesTargetExist = true;
            }
            this.dataSetTarget = returedData.chartDetails[0];

            let map1 = this.dataSetTarget;
            let map2 = [];
            let map3 = {};

            for (let key in map1) {
                if (map1[key] >= 0) {
                    map2.push({ value: map1[key], key: key });
                }
            }

            let mapSort1 = new Map([...map2.entries()].sort((a, b) => b[1].value - a[1].value));

            if (mapSort1) {
                mapSort1.forEach((value, key) => {
                    map3[value.key] = [value.value];
                })
            }
            this.dataSetTarget = map3;

            // Set data for Table 
            let conts = this.dataSetTarget;
            let backgroundColor = ["#479fdb", "#1d3159", "#90dcd8", "#4ba49e", "#Dfcf88", "#Dca238", "#B3443b", "#F5ba6d", "#74af81", "#306f6b", "#F012BE", "#B10DC9", "#111111", "#AAAAAA"];
            let i = 0;
            for (let key in conts) {
                this.mapDataTarget.push({ value: conts[key], key: key, color: 'background-color:' + backgroundColor[i] });
                i++;
            }
            this.dataSetTargetExist = true;
        }
    }

    setCurrentDetails(returedData) {
        if (returedData.chartDetails != null && returedData.chartDetails.length > 0) {
            if (returedData.notes != null) {
                this.notes = returedData.notes;
                this.notesExist = true;
            }
            this.dataSet = returedData.chartDetails[0];

            let map1 = this.dataSet;
            let map2 = [];
            let map3 = {};

            for (let key in map1) {
                if (map1[key] >= 0) {
                    map2.push({ value: map1[key], key: key });
                }
            }

            let mapSort1 = new Map([...map2.entries()].sort((a, b) => b[1].value - a[1].value));

            if (mapSort1) {
                mapSort1.forEach((value, key) => {
                    map3[value.key] = [value.value];
                })
            }
            this.dataSet = map3;

            // Set data for Table 
            let conts = this.dataSet;
            let backgroundColor = ["#479fdb", "#1d3159", "#90dcd8", "#4ba49e", "#Dfcf88", "#Dca238", "#B3443b", "#F5ba6d", "#74af81", "#306f6b", "#F012BE", "#B10DC9", "#111111", "#AAAAAA"];
            let i = 0;
            for (let key in conts) {
                this.mapData.push({ value: conts[key], key: key, color: 'background-color:' + backgroundColor[i] });
                i++;
            }
            this.dataSetExist = true;
        }
    }

}