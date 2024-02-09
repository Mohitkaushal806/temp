import { NgbModal, NgbModalConfig } from '@ng-bootstrap/ng-bootstrap';
import { GraphData } from '../data-types/graph-interfaces';
import { TrendsData } from '../data-types/trend-interfaces';
import { PivotTableData } from '../data-types/pivot-interfaces';
import { DataService } from '../services/data.service';
import { DatePipe } from '@angular/common';
import { HttpEvent } from '@angular/common/http';
import * as i0 from "@angular/core";
export declare enum WidgetType {
    GRAPH = "graph",
    TREND = "trend",
    PIVOT_TABLE = "pivot_table"
}
export declare class XsightsBackendService {
    private dialog;
    private modalConfig;
    private dataService;
    private datePipe;
    private systemApis;
    private modalData;
    private highcharts;
    private divStyles;
    private iconStyles;
    private breadcrumbStyles;
    private creditTitle;
    private creditUrl;
    private charts;
    private trends;
    constructor(dialog: NgbModal, modalConfig: NgbModalConfig, dataService: DataService, datePipe: DatePipe);
    build(widgetType: WidgetType, widgetData: GraphData | TrendsData | PivotTableData): Promise<any>;
    private buildGraph;
    private publishLabel;
    private startGraphBuilder;
    private getPlotOptions;
    private createChartData;
    private sortGraph;
    private addActionBtn;
    private downloadGraphData;
    download(httpEvent: HttpEvent<string> | Blob): void;
    private manageBreadCrumb;
    private buildTrend;
    private initTrend;
    private addActionBtnTrends;
    private getPlotOptionsTrends;
    private createTrendData;
    static ɵfac: i0.ɵɵFactoryDeclaration<XsightsBackendService, never>;
    static ɵprov: i0.ɵɵInjectableDeclaration<XsightsBackendService>;
}
