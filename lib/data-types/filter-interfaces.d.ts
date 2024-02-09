import { DataType, DateFormat, TimeFormat } from './variable-types';
export declare enum FilterTypes {
    BEFORE = "BEFORE",
    AFTER = "AFTER",
    IN = "IN",
    BETWEEN = "<>",
    LESS_THAN = "<",
    LESS_THAN_EQUAL = "<=",
    GREATER_THAN = ">",
    GREATER_THAN_EQUAL = ">=",
    EQUAL = "==",
    NOT_EQUAL = "!=",
    BETWEEN_RANGE = "bet",
    NOT_IN = "NOT IN"
}
export interface Filters {
    xAxis: NormalFilter[];
    yAxis: NormalFilter[];
    yPreAxis: NormalFilter[];
    customFilter: CustomFilter[];
}
interface NormalFilter {
    variableName: string;
    filterType: FilterTypes;
    values: any[];
    variableType: DataType;
    format: DateFormat | TimeFormat | string;
}
export declare enum CustomFilterTypes {
    SINGLE_EQUATION = "Single Equation",
    A_OR_B = "A or B",
    A_AND_B = "A and B",
    A_OR_B_OR_C = "A or B or C",
    A_AND_B_AND_C = "A and B and C",
    A_OR_B_AND_C = "A or ( B and C )",
    A_AND_B_OR_C = "A and ( B or C )"
}
export interface CustomFilter {
    customFilterName: string;
    customFilterType: CustomFilterTypes;
    customFiltervar1: string;
    filterType1: DataType;
    filterFormat1: DateFormat | TimeFormat | string;
    filterFormat2: DateFormat | TimeFormat | string;
    filterFormat3: DateFormat | TimeFormat | string;
    values1: any[];
    symbol1: FilterTypes;
    customFilterVar1Value: any[];
    customFiltervar2: string;
    filterType2: DataType;
    values2: any[];
    symbol2: FilterTypes;
    customFilterVar2Value: any[];
    customFiltervar3: string;
    filterType3: DataType;
    values3: any[];
    customFilterVar3Value: any[];
    symbol3: FilterTypes;
}
export {};
