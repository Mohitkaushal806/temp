import { AggregationFunctionsType } from "./aggregation-interfaces";
import { FilterTypes } from "./filter-interfaces";
import { DataType } from "./variable-types";
export interface DerivedVariable {
    name: string;
    filters: DerivedVariableFilter[];
    formula: string;
    is_slab: boolean;
    is_filter: boolean;
    operation: DerivedVariableOperations[];
    defaultValue: string | number;
}
export interface DerivedVariableFilter {
    values: string;
    conditions: DerivedVariableFilterCondition[];
    isCustomValue: boolean;
    aggregationFunction: AggregationFunctionsType;
}
interface DerivedVariableOperations {
    value: string;
    isCustom: boolean;
    isOperator: boolean;
    isAggregation: boolean;
}
export interface DerivedVariableFilterCondition {
    operator: FilterTypes;
    relation: Relation;
    variable: DerivedVariableFilterConditionVariable;
    comparativeVariables: any[];
}
declare enum Relation {
    AND = "and",
    OR = "or"
}
interface DerivedVariableFilterConditionVariable {
    name: string;
    type: DataType;
}
export {};
