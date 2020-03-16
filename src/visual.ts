"use strict";

import "core-js/stable";
import "./../style/visual.less";
import powerbi from "powerbi-visuals-api";
import VisualConstructorOptions = powerbi.extensibility.visual.VisualConstructorOptions;
import VisualUpdateOptions = powerbi.extensibility.visual.VisualUpdateOptions;
import IVisual = powerbi.extensibility.visual.IVisual;
import EnumerateVisualObjectInstancesOptions = powerbi.EnumerateVisualObjectInstancesOptions;
import VisualObjectInstance = powerbi.VisualObjectInstance;
import VisualObjectInstanceEnumerationObject = powerbi.VisualObjectInstanceEnumerationObject;
import { textMeasurementService } from "powerbi-visuals-utils-formattingutils";
import * as d3 from 'd3';
import IVisualHost = powerbi.extensibility.visual.IVisualHost;

import { VisualSettings } from "./settings";

import dataModelManager, { BinBarChartViewModel } from './dataModelManager';

export class Visual implements IVisual {
    private svg: d3.Selection<d3.BaseType, any, HTMLElement, any>;
    private stackBarContainer: d3.Selection<d3.BaseType, any, any, any>;
    private total: d3.Selection<d3.BaseType, any, any, any>;
    private remains: d3.Selection<d3.BaseType, any, any, any>;
    private xAxis: d3.Selection<d3.BaseType, any, any, any>;
    private yAxis: d3.Selection<d3.BaseType, any, any, any>;
    private legend: d3.Selection<d3.BaseType, any, any, any>;
    private host: IVisualHost;
    private settings: VisualSettings;
    private dataModelManager: dataModelManager;

    constructor(options: VisualConstructorOptions) {
        this.init(options);
    }

    public init(options: VisualConstructorOptions) {
        this.host = options.host;
        this.dataModelManager = new dataModelManager();
        this.svg = d3.select<SVGElement, any>(<any> options.element)
            .append('svg');
        this.stackBarContainer = this.svg
            .append('g');
        this.total = this.svg
            .append('g');
        this.remains = this.svg
            .append('g');
        this.xAxis = this.svg
            .append('g');
        this.yAxis = this.svg
            .append('g');
        this.legend = this.svg
            .append("g");
    }

    public update(options: VisualUpdateOptions) {
        this.settings = VisualSettings.parse<VisualSettings>(options.dataViews[0]);

        let viewModel: BinBarChartViewModel = this.dataModelManager.ConverData(options, this.host);

        let legendTextWidth = textMeasurementService.measureSvgTextWidth({
            text: viewModel.legends
                .slice()
                .reverse()
                .filter(d => d.highlighted)
                .sort((a, b) => b.value.length - a.value.length)[0].value,
            fontSize: "16px",
            fontFamily: "helvetica, arial, sans-serif"
        }) + 15;

        let width = options.viewport.width;
        let height = options.viewport.height;
        let margin = { top: 30, bottom: 25, left: 40, right: legendTextWidth + 5 }

        this.svg
            .attr("width", width)
            .attr("height", height);

        let x = d3.scaleBand()
            .domain(viewModel.axises.map(d => d.axis))
            .range([margin.left, width - margin.right])
            .padding(0.1);

        let y = d3.scaleLinear()
            .domain([0, viewModel.maxValue])
            .rangeRound([height - margin.bottom, margin.top]);

        let color = d3.scaleOrdinal()
            .domain(viewModel.legends.map(s => s.value))
            .range(d3.schemeRdBu[viewModel.legends.length])
            .unknown("#ccc");

        this.stackBarContainer.selectAll('rect')
            .data(viewModel.dataPoints)
            .join('rect')
            .classed('bar', true)
            .attr('fill', d => d.highlighted ? this.settings.bin.useSameColor ? this.settings.bin.fill : color(d.legend).toString() : "#ccc")
            .attr("x", (d, i) => x(d.axis.toString()))
            .attr("y", d => y(d.value2))
            .attr("height", d => y(d.value) - y(d.value2))
            .attr("width", x.bandwidth());

        this.total.selectAll('text')
            .data(Array.from(viewModel.axises))
            .join('text')
            .text(d => `${d.value}(${d.selectedPointTotal})`)
            .attr("x", d => x(d.axis) + x.bandwidth() / 2)
            .attr("y", d => y(d.value) - 10)
            .attr("font-size", this.settings.bin.fontSize)
            .attr("height", 40)
            .attr("width", x.bandwidth())
            .attr("text-anchor", "middle");

        this.remains.selectAll('text')
            .data(Array.from(viewModel.axises))
            .join('text')
            .text(d => `${Math.floor((d.value - d.selectedPointTotal) / d.value * 100)}%`)
            .attr("x", d => x(d.axis) + x.bandwidth() / 2)
            .attr("y", d => y((d.value - d.selectedPointTotal) / 2))
            .attr("font-Size", this.settings.bin.fontSize)
            .attr("height", 40)
            .attr("width", x.bandwidth())
            .attr("text-anchor", "middle");

        let xAxis = g => g
            .style("font-size", this.settings.xAxis.fontSize)
            .attr("transform", `translate(0,${height - margin.bottom})`)
            .call(d3.axisBottom(x).tickSizeOuter(0))
            .call(g => g.selectAll(".domain").remove());
        this.xAxis.call(xAxis);

        let yAxis = g => g
            .style("font-size", this.settings.yAxis.fontSize)
            .attr("transform", `translate(${margin.left},0)`)
            .call(d3.axisLeft(y).ticks(null, "s"))
            .call(g => g.selectAll(".domain").remove());
        this.yAxis.call(yAxis);

        let legend = svg => {
            let g = svg
                .attr("transform", `translate(${width},0)`)
                .attr("text-anchor", "end")
                .selectAll("g")
                .data(viewModel.legends.slice().reverse().filter(d => d.highlighted))
                .join("g")
                .attr("transform", (d, i) => `translate(0,${i * 20})`)

            g.call(g => g.selectAll("circle").remove());
            g.call(g => g.selectAll("text").remove());

            g.append("circle")
                .attr("cx", -legendTextWidth)
                .attr("cy", 10)
                .attr("r", 5)
                .attr("fill", d => d.highlighted ? color(d.value).toString() : "#ccc");

            g.append("text")
                .attr("x", -10)
                .attr("y", 9.5)
                .attr("dy", "0.35em")
                .text(d => d.value);
        }
        this.legend.call(legend);
    }

    public enumerateObjectInstances(options: EnumerateVisualObjectInstancesOptions): VisualObjectInstance[] | VisualObjectInstanceEnumerationObject {
        const settings: VisualSettings = this.settings || <VisualSettings> VisualSettings.getDefault();
        return VisualSettings.enumerateObjectInstances(settings, options);
    }
}