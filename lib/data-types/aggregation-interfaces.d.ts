export declare const enum AggregationFunctionsType {
    NO_FUNCTION = "NO FUNCTION",
    COUNT = "COUNT",
    SUM = "SUM",
    AVERAGE = "AVERAGE",
    COUNT_UNIQUE = "COUNT_UNIQUE",
    MINIMUM = "MINIMUM",
    MAXIMUM = "MAXIMUM"
}
export interface AggregationFunction {
    variableName: string;
    aggregationFunctions: AggregationFunctionsType;
}
