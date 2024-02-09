import { AggregationFunction } from './aggregation-interfaces';
import { DerivedVariable } from './derived-variable-interfaces';
import { Filters } from "./filter-interfaces";
import { DataFormat } from './variable-types';
import { TrendsRange } from './trend-interfaces';
export interface GraphData {
    graphId: string;
    graphTitle: string;
    rows: string[];
    columns: string[];
    currLevel?: any;
    graphTypes: GraphTypes[];
    graphData: any;
    prevLevelData?: any;
    adminId?: any;
    aggregationFunctions: AggregationFunction[];
    filter: Filters;
    selKeys?: string[];
    range?: TrendsRange;
    colors: string[];
    order?: any;
    customVariable: DerivedVariable[];
    dataFormat: DataFormat[];
    colToShow?: string;
    lastLevelColumns: string[];
    sourceId?: any;
    dashboardFilter?: any;
    shareid?: any;
    breadCrumb?: any;
}
export declare enum GraphTypes {
    BAR = "bar",
    LINE = "line",
    AREA = "area",
    COLUMN = "column",
    PIE = "pie",
    STACKED_COLUMN = "stacked-column",
    STACKED_COLUMN_PERCENTAGE = "stacked-column%",
    STACKED_BAR = "stacked-bar",
    STACKED_BAR_PERCENTAGE = "stacked-bar%",
    SCATTER = "scatter",
    SPLINE = "spline"
}
export interface GraphList {
    [key: string]: GraphData;
}
