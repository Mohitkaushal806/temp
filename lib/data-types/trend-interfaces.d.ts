import { AggregationFunction } from "./aggregation-interfaces";
import { DerivedVariable } from "./derived-variable-interfaces";
import { Filters } from "./filter-interfaces";
import { GraphTypes } from "./graph-interfaces";
import { DataFormat } from "./variable-types";
export interface TrendsData {
    graphId: string;
    graphTitle: string;
    rows: string;
    columns: string;
    currLevel?: any;
    graphTypes: GraphTypes;
    graphData: any;
    prevLevelData?: any;
    aggregationFunctions: AggregationFunction;
    filter: Filters;
    colors: string;
    order?: number;
    rawData?: any[];
    range: TrendsRange;
    dateVariable: string;
    rangeFilter: RangeFilter;
    comparison: any[];
    customVariable: DerivedVariable[];
    dataFormat: DataFormat[];
    lastLevelColumns: string[];
    sourceId?: any;
    dashboardFilter?: any;
    shareid?: any;
    selKeys?: string[];
    adminId?: any;
}
export interface TrendsRange {
    startDate: any;
    endDate: any;
}
export declare enum RangeFilter {
    YEARLY = "Yearly",
    QUARTERLY = "Quatarly",
    MONTHLY = "Monthly",
    WEEKLY = "Weekly",
    DAILY = "Daily"
}
export interface TrendsList {
    [key: string]: TrendsData;
}
