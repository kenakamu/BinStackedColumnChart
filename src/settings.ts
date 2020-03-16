"use strict";

import { dataViewObjectsParser } from "powerbi-visuals-utils-dataviewutils";
import DataViewObjectsParser = dataViewObjectsParser.DataViewObjectsParser;

export class VisualSettings extends DataViewObjectsParser {
      public xAxis: xAxisSettings = new xAxisSettings();
      public yAxis: yAxisSettings = new yAxisSettings();
      public bin: binSettings = new binSettings();
}

export class xAxisSettings {
  public fontSize: number = 12;
}

export class yAxisSettings {
  public fontSize: number = 12;
}

export class binSettings {
  public useSameColor: boolean = true;
  public fill: string = "";
  public fontSize: number = 12;
}

