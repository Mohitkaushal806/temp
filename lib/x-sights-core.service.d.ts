import { NgbModal, NgbModalConfig } from '@ng-bootstrap/ng-bootstrap';
import { GraphData } from './data-types/graph-interfaces';
import { TrendsData } from './data-types/trend-interfaces';
import { PivotTableData } from './data-types/pivot-interfaces';
import { DataService } from './services/data.service';
import * as i0 from "@angular/core";
export declare enum WidgetType {
    GRAPH = "graph",
    TREND = "trend",
    PIVOT_TABLE = "pivot_table"
}
export declare class XSightsCoreService {
    private dialog;
    private modalConfig;
    private dataService;
    private modalData;
    private highcharts;
    private divStyles;
    private iconStyles;
    private creditTitle;
    private creditUrl;
    private breadcrumbStyles;
    private charts;
    private trends;
    constructor(dialog: NgbModal, modalConfig: NgbModalConfig, dataService: DataService);
    build(widgetType: WidgetType, widgetData: GraphData | TrendsData | PivotTableData): Promise<any>;
    private buildPivotTable;
    private buildGraph;
    private publishLabel;
    private applyDataFilter;
    private startGraphBuilder;
    private getPlotOptions;
    private createChartData;
    private manageBreadCrumb;
    private applyCustomFilter;
    private getFormattedDate;
    private getEquationResult;
    private sortGraph;
    private downloadGraphData;
    private addActionBtn;
    private applyAggregation;
    private applyYfilter;
    private applyXfilter;
    private getDrillDownData;
    private applySort;
    private getVariableData;
    private getVariableTypeByHeader;
    private validateTime;
    private validateNumber;
    private checkDate;
    private addCustomVariable;
    private getAggregatedValueOfCustomVariable;
    private getCustomVariableValue;
    private getCustomVariableValueAggregated;
    private buildTrend;
    private initTrend;
    private getWeeks;
    private getQuarters;
    private convertDate;
    private getPlotOptionsTrends;
    private createTrendData;
    private getSeriesData;
    private getComparisonData;
    private getRangeObj;
    private applyDataFilterTrends;
    static ɵfac: i0.ɵɵFactoryDeclaration<XSightsCoreService, never>;
    static ɵprov: i0.ɵɵInjectableDeclaration<XSightsCoreService>;
}
