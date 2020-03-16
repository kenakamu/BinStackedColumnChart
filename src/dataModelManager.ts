import powerbi from "powerbi-visuals-api";
import VisualUpdateOptions = powerbi.extensibility.visual.VisualUpdateOptions;
import IVisualHost = powerbi.extensibility.visual.IVisualHost;

export interface BinBarChartViewModel {
    dataPoints: BinBarChartDataPoint[]
    axises: axisPoint[];
    legends: LegendPoint[];
    maxValue: number;
    highlighted: boolean;
}

export interface BinBarChartDataPoint {
    axis: string;
    legend: string;
    value: number;
    value2: number;
    highlighted: boolean;
}

export interface LegendPoint {
    value: string;
    highlighted: boolean;
}

export interface axisPoint {
    value: number;
    axis: string;
    selectedPointTotal: number;
}

class DataModelManager {

    public ConverData = (options: VisualUpdateOptions, host: IVisualHost): BinBarChartViewModel => {
        let dataViews = options.dataViews;

        let dataModel: BinBarChartViewModel = {
            dataPoints: [],
            axises: [],
            legends: [],
            maxValue: 0,
            highlighted: false
        }

        if (!this.checkDataset(dataViews)) return dataModel;

        let columns = dataViews[0].matrix.columns.root.children;
        let rows = dataViews[0].matrix.rows.root.children;

        let maxValue = 0;
        let axises: axisPoint[] = [];
        let legends: LegendPoint[] = [];
        let dataPoints: BinBarChartDataPoint[] = [];
        let highlighted = false;
        rows.forEach(row => {
            let rowDataPoints: BinBarChartDataPoint[] = [];
            let selectedPointTotal = 0;
            let axisName = <string> row.value;

            for (let key of Object.keys(row.values)) {
                let value = <number> row.values[key].value;
                let dataPoint: BinBarChartDataPoint = {
                    axis: axisName,
                    legend: <string> columns[key].value,
                    value: value,
                    value2: 0,
                    highlighted: row.values[key].highlight ? true : false
                };

                if (dataPoint.highlighted) {
                    highlighted = true;
                    rowDataPoints.push(dataPoint);
                    selectedPointTotal += dataPoint.value;
                } else {
                    rowDataPoints.unshift(dataPoint);
                }

                let legend = legends.find(d => d.value == dataPoint.legend);
                if (legend === undefined) {
                    legends.push({
                        value: dataPoint.legend,
                        highlighted: dataPoint.highlighted
                    })
                }
                else if (!legend.highlighted && dataPoint.highlighted) {
                    legend.highlighted = true;
                }
            }

            let max = 0
            rowDataPoints.forEach(d => {
                max += d.value;
                d.value = max - d.value;
                d.value2 = max;
            });

            axises.push({
                value: max,
                axis: axisName,
                selectedPointTotal: selectedPointTotal
            });

            maxValue = Math.max(maxValue, max);
            dataPoints.push(...rowDataPoints);
        });

        if (legends.filter(d => d.highlighted).length != legends.length) {
            legends.push({ value: "others", highlighted: true });
        }

        dataModel.dataPoints = dataPoints;
        dataModel.axises = axises;
        dataModel.legends = legends;
        dataModel.maxValue = maxValue;
        dataModel.highlighted = highlighted;
        return dataModel;
    }

    private checkDataset(dataViews: powerbi.DataView[]): boolean {
        if (!dataViews
            || !dataViews[0]
            || !dataViews[0].matrix
            || !dataViews[0].matrix.columns
            || !dataViews[0].matrix.columns.root
            || !dataViews[0].matrix.columns.root.children
            || !dataViews[0].matrix.rows
            || !dataViews[0].matrix.rows.root
            || !dataViews[0].matrix.rows.root.children
        ) {
            return false;
        }

        return true;
    }
}

export default DataModelManager;