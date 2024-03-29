import { EventEmitter, OnInit, SimpleChanges } from '@angular/core';
import { DataService } from '../../services/data.service';
import { XSightsCoreService } from '../../x-sights-core.service';
import { XsightsBackendService } from '../../services/xsights-backend.service';
import { ToastrService } from 'ngx-toastr';
import * as i0 from "@angular/core";
export declare class XSightsBackendPublicDashboardComponent implements OnInit {
    private dataService;
    private toastService;
    private xsightsBackend;
    private xsights;
    dashboardUrl: string;
    adminId: any;
    dashboardLoaded: EventEmitter<any>;
    private mtrSource;
    decodedParams: any;
    dashboardData: any;
    filters: any;
    selFilters: any;
    dropdownSettings: any;
    tableDatas: any;
    seriesData: any;
    dumpData: any;
    calledSourceData: any;
    tableGraphs: any;
    constructor(dataService: DataService, toastService: ToastrService, xsightsBackend: XsightsBackendService, xsights: XSightsCoreService);
    ngOnInit(): void;
    ngOnChanges(changes: SimpleChanges): void;
    decodeUrl(): void;
    getGraphDashBoardById(): void;
    buildChart(widgetData: any, data: any, tempData: any, dashboardFilter: any): Promise<unknown>;
    loadingComplete(): void;
    renderTable(): Promise<void>;
    generateDashboard(graph: any, reCall?: boolean): Promise<unknown>;
    setGraphOrder(a: any, b: any): 1 | -1 | 0;
    static ɵfac: i0.ɵɵFactoryDeclaration<XSightsBackendPublicDashboardComponent, never>;
    static ɵcmp: i0.ɵɵComponentDeclaration<XSightsBackendPublicDashboardComponent, "lib-x-sights-backend-public-dashboard", never, { "dashboardUrl": "dashboardUrl"; "adminId": "adminId"; }, { "dashboardLoaded": "dashboardLoaded"; }, never, never>;
}
