import { AggregationFunction } from "./aggregation-interfaces";
import { DerivedVariable } from "./derived-variable-interfaces";
import { Filters } from "./filter-interfaces";
import { TrendsRange } from "./trend-interfaces";
import { DataFormat } from "./variable-types";
export interface Fields {
    caption: string;
    dataField: string | number;
    area: PivotFieldsArea;
    allowFiltering?: boolean;
    allowSorting?: boolean;
    format?: Function;
    summaryType?: string;
}
export declare enum PivotFieldsArea {
    ROW = "row",
    COLUMN = "column",
    DATA = "data"
}
export interface PivotTableData {
    data: any[];
    rows: string[];
    range?: TrendsRange;
    column: string[];
    aggregationFunction: AggregationFunction[];
    filter: Filters;
    derivedVariables: DerivedVariable[];
    categories: string[];
    dataFormat: DataFormat[];
}
