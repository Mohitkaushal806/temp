import { EventEmitter, OnInit, SimpleChanges } from '@angular/core';
import { DataService } from '../../services/data.service';
import { XSightsCoreService } from '../../x-sights-core.service';
import * as i0 from "@angular/core";
export declare class XSightsPublicDashboardComponent implements OnInit {
    private dataService;
    private xsights;
    dashboardUrl: string;
    adminId: any;
    dashboardLoaded: EventEmitter<any>;
    private mtrSource;
    decodedParams: any;
    dashboardData: any;
    filters: any;
    dropdownSettings: any;
    tableDatas: any;
    dumpData: any;
    constructor(dataService: DataService, xsights: XSightsCoreService);
    ngOnInit(): void;
    ngOnChanges(changes: SimpleChanges): void;
    checkDashboardLoading(): void;
    decodeUrl(): void;
    setGraphOrder(a: any, b: any): 1 | -1 | 0;
    getSharedDashboard(): void;
    filterData(data: any, sourceId: any): any;
    buildChart(widgetData: any, data: any, tempData: any): Promise<unknown>;
    filteredDashboard(): Promise<void>;
    static ɵfac: i0.ɵɵFactoryDeclaration<XSightsPublicDashboardComponent, never>;
    static ɵcmp: i0.ɵɵComponentDeclaration<XSightsPublicDashboardComponent, "x-sights-public-dashboard", never, { "dashboardUrl": "dashboardUrl"; "adminId": "adminId"; }, { "dashboardLoaded": "dashboardLoaded"; }, never, never>;
}