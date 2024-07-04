import { Component, EventEmitter, Input, Output } from '@angular/core';
import * as lodash from 'lodash';
import { WidgetType } from '../../x-sights-core.service';
import Swal from 'sweetalert2';
import * as i0 from "@angular/core";
import * as i1 from "../../x-sights-core.service";
import * as i2 from "ngx-toastr";
import * as i3 from "@angular/common";
import * as i4 from "../../services/data.service";
import * as i5 from "ng-multiselect-dropdown";
import * as i6 from "devextreme-angular";
import * as i7 from "devextreme-angular/ui/nested";
import * as i8 from "@angular/forms";
export class XSightsDashboardComponent {
    constructor(xsights, toastService, datePipe, dataService) {
        this.xsights = xsights;
        this.toastService = toastService;
        this.datePipe = datePipe;
        this.dataService = dataService;
        this.systemApis = ['198', '138', '279'];
        this.mtrSource = '138';
        this.dashboardId = 0;
        this.adminId = '0';
        this.showHeader = true;
        this.showFilters = true;
        this.startDate = null;
        this.endDate = null;
        this.toggleDashboard = false;
        this.isDashboardLoaded = new EventEmitter();
        this.dashboardData = null;
        this.fromDate = null;
        this.toDate = null;
        this.showHeaderInputs = false;
        this.filters = [];
        this.calledSource = {};
        this.calledSourceKeys = {};
        this.liveRefreshMin = 5;
        this.dataFile = [];
        this.dataFileIndex = [];
        this.pivotTables = {};
        this.dashPublicUrl = '';
        this.dropdownSettings = {};
        if (this.startDate == null) {
            this.fromDate = this.datePipe.transform(new Date(new Date().setDate(new Date().getDate() - 3)), 'yyyy-MM-dd');
        }
        else {
            this.fromDate = this.startDate;
        }
        if (this.endDate == null) {
            this.toDate = this.datePipe.transform(new Date(), 'yyyy-MM-dd');
        }
        else {
            this.toDate = this.endDate;
        }
    }
    ngOnInit() {
        this.dropdownSettings = {
            singleSelection: false,
            enableCheckAll: false,
            allowSearchFilter: true,
        };
        // this.renderPage();
    }
    renderPage() {
        this.getDashBoardById();
    }
    ngOnDestroy() {
        //Called once, before the instance is destroyed.
        //Add 'implements OnDestroy' to the class.
        clearInterval(this.dashboardInterval);
    }
    ngOnChanges(changes) {
        //Called before any other lifecycle hook. Use it to inject dependencies, but avoid any serious work here.
        //Add '${implements OnChanges}' to the class.
        // if (
        //   (!changes['refreshDashboard']?.isFirstChange() &&
        //     changes['refreshDashboard']?.currentValue !=
        //       changes['refreshDashboard']?.previousValue)
        // ) {
        //   this.refreshSystemApis();
        // }
        if (changes['dashboardId']?.currentValue !=
            changes['dashboardId']?.previousValue ||
            changes['adminId']?.currentValue != changes['adminId']?.previousValue ||
            changes['showHeader']?.currentValue !=
                changes['showHeader']?.previousValue ||
            changes['showFilters']?.currentValue !=
                changes['showFilters']?.previousValue ||
            changes['toggleDashboard']?.currentValue !=
                changes['toggleDashboard']?.previousValue) {
            this.renderPage();
        }
    }
    async refreshSystemApis() {
        let calledOnce = false;
        for (let index = 0; index < this.dashboardData.graphs.length; index++) {
            let _self = this;
            const graph = _self.dashboardData.graphs[index];
            if (graph.sourceid.toString() == '138') {
                //show loader in MTR graph
                if (!calledOnce) {
                    // Swal.fire({
                    //   title: 'Please Wait...',
                    //   text: 'Fetch MTR Report',
                    //   icon: 'info',
                    //   showConfirmButton: false,
                    //   showCancelButton: false,
                    //   allowEnterKey: false,
                    //   allowOutsideClick: false,
                    //   allowEscapeKey: false,
                    // });
                    // Swal.isLoading();
                }
                let res = await _self.generateDashboard(graph, !calledOnce);
                let tempGraphData = {
                    rows: graph.graph_structure.xAxis,
                    columns: graph.graph_structure.yAxis,
                    aggregationFunctions: graph.graph_structure.aggreagations,
                    filter: graph.graph_structure.filter,
                    customVariable: graph.graph_structure.derivedVariables,
                    dataFormat: [],
                    colToShow: null,
                    chartType: graph.graph_structure.chartType,
                    lastLevelColumns: graph.graph_structure.lastLevelData ?? [],
                    dateVariable: graph.graph_structure.dateVariable,
                };
                if (graph.sourceid.toString() == this.mtrSource) {
                    tempGraphData = this.dataService.keyConverter(tempGraphData, this.calledSourceKeys[graph.sourceid.toString()], 1);
                }
                this.buildChart(graph, res, tempGraphData);
                calledOnce = true;
            }
            else if (graph.sourceid.toString() == '198') {
                if (!calledOnce) {
                    // Swal.fire({
                    //   title: 'Please Wait...',
                    //   text: 'Fetch Chettinad Fault MTR Report',
                    //   icon: 'info',
                    //   showConfirmButton: false,
                    //   showCancelButton: false,
                    //   allowEnterKey: false,
                    //   allowOutsideClick: false,
                    //   allowEscapeKey: false,
                    // });
                    // Swal.isLoading();
                }
                let res = await _self.generateDashboard(graph, !calledOnce);
                let tempGraphData = {
                    rows: graph.graph_structure.xAxis,
                    columns: graph.graph_structure.yAxis,
                    aggregationFunctions: graph.graph_structure.aggreagations,
                    filter: graph.graph_structure.filter,
                    customVariable: graph.graph_structure.derivedVariables,
                    dataFormat: [],
                    colToShow: null,
                    chartType: graph.graph_structure.chartType,
                    lastLevelColumns: graph.graph_structure.lastLevelData ?? [],
                    dateVariable: graph.graph_structure.dateVariable,
                };
                if (graph.sourceid.toString() == this.mtrSource) {
                    tempGraphData = this.dataService.keyConverter(tempGraphData, this.calledSourceKeys[graph.sourceid.toString()], 1);
                }
                this.buildChart(graph, res, tempGraphData);
                calledOnce = true;
            }
        }
    }
    getDashBoardById() {
        this.dataService
            .getDashboardById(this.dashboardId, this.adminId)
            .then(async (res) => {
            this.filters = res.data[0]?.filters ?? [];
            res.data[0].graphs = res.data[0].graphs.sort(this.setGraphOrder);
            this.dashboardData = res.data[0];
            for (const element of this.dashboardData.graphs) {
                const graph = element;
                if (graph.graphType != 2) {
                    let res = await this.generateDashboard(graph);
                    let tempGraphData = {
                        rows: graph.graph_structure.xAxis,
                        columns: graph.graph_structure.yAxis,
                        aggregationFunctions: graph.graph_structure.aggreagations,
                        filter: graph.graph_structure.filter,
                        customVariable: graph.graph_structure.derivedVariables,
                        dataFormat: [],
                        colToShow: null,
                        lastLevelColumns: graph.graph_structure.lastLevelData ?? [],
                        chartType: graph.graph_structure.chartType,
                        dateVariable: graph.graph_structure.dateVariable,
                    };
                    if (graph.sourceid.toString() == this.mtrSource) {
                        tempGraphData = this.dataService.keyConverter(tempGraphData, this.calledSourceKeys[graph.sourceid.toString()], 1);
                    }
                    this.buildChart(graph, res, tempGraphData);
                }
                // if(this.dashboardData.dashboard_type == 1){
                //Set Live Dashboard Interval
                // this.dashboardInterval = setInterval(async () => {
                //   this.calledSource = {};
                //   if(graph.graphType != 2){
                //     let graphBuild = await _self.buildChart('graph-' + graph.graph_id, graph.graph_structure, res, graph.graphname, graph.graphType, {
                //       startDate: this.datePipe.transform(graph.graph_structure.startDate,'yyyy-MM-dd'),
                //       endDate: this.datePipe.transform(graph.graph_structure.endDate,'yyyy-MM-dd')
                //     }, graph.sourceid);
                //   }
                //   if (index == _self.dashboardData.graphs.length - 1) {
                //     setTimeout(() => {
                //       _self.dashboardLoadedCompletely = true;
                //     }, 500);
                //   }
                // },  this.liveRefreshMin * 60 * 1000)
                // }
            }
        });
    }
    generateDashboard(graph, reCall = false) {
        return new Promise((resolve, reject) => {
            if (this.calledSource.hasOwnProperty(graph.sourceid.toString()) &&
                !reCall) {
                resolve(this.calledSource[graph.sourceid.toString()]);
            }
            else {
                let extraData = {
                    startTime: (this.startDate ?? this.fromDate) + ' 00:00:00',
                    endTime: (this.endDate ?? this.toDate) + ' 00:00:00',
                };
                this.dataService
                    .fetchDataSource({
                    sourceid: graph.sourceid,
                    startTime: extraData.startTime,
                    endTime: extraData.endTime,
                }, this.adminId)
                    .then((res) => {
                    Swal.hideLoading();
                    Swal.close();
                    let keys = null;
                    let dumpData = res;
                    // this.uniqueSourceData.push(graph);
                    if (graph.dataType == 'remote-json' &&
                        !this.systemApis.includes(graph.sourceid.toString())) {
                        res = this.dataService.parseDataFormat(res, graph.dataFormat);
                    }
                    if (this.systemApis.includes(graph.sourceid.toString())) {
                        this.showHeaderInputs = true;
                        if (graph.sourceid.toString() == this.mtrSource) {
                            dumpData = res[0].data;
                            keys = res[0].columns;
                        }
                    }
                    this.filters = this.filters.map((filter) => {
                        if (filter.sourceId.toString() == graph.sourceid.toString()) {
                            filter.values = Object.keys(lodash.groupBy(dumpData, filter.fieldName)).map((key, index) => ({
                                id: index,
                                text: key,
                            }));
                            filter.selValues = [];
                        }
                        return filter;
                    });
                    if (dumpData) {
                        this.calledSource[graph.sourceid.toString()] = dumpData;
                        this.calledSourceKeys[graph.sourceid.toString()] = keys;
                        resolve(dumpData);
                    }
                })
                    .catch((err) => {
                    Swal.hideLoading();
                    Swal.close();
                    this.toastService.error('Unable to Fetch Data');
                });
            }
        });
    }
    buildChart(widgetData, data, tempData) {
        let _self = this;
        return new Promise(async (resolve, reject) => {
            let existIndex = _self.dataFileIndex.findIndex((data) => data.chartId == 'graph-' + widgetData.graph_id);
            let existSourceIndex = _self.dataFileIndex.findIndex((data) => data.sourceId == widgetData.sourceid.toString());
            if (existIndex == -1) {
                _self.dataFile.push({
                    chartId: 'graph-' + widgetData.graph_id,
                    sourceId: widgetData.sourceid.toString(),
                    data: existSourceIndex != -1 ? existSourceIndex : data,
                    columns: this.calledSourceKeys[widgetData.sourceid.toString()],
                });
                _self.dataFileIndex.push({
                    chartId: 'graph-' + widgetData.graph_id,
                    sourceId: widgetData.sourceid.toString(),
                });
            }
            else {
                _self.dataFile[existIndex] = {
                    ..._self.dataFile[existIndex],
                    data: existSourceIndex != -1 ? existSourceIndex : data,
                };
            }
            data = this.filterData(data, widgetData.sourceid.toString());
            if (widgetData.graphType == 1) {
                let range = {
                    startDate: this.datePipe.transform(widgetData.graph_structure.startDate, 'yyyy-MM-dd'),
                    endDate: this.datePipe.transform(widgetData.graph_structure.endDate, 'yyyy-MM-dd'),
                };
                if (this.systemApis.includes(widgetData.sourceid.toString())) {
                    range = {
                        startDate: this.startDate ?? this.fromDate,
                        endDate: this.endDate ?? this.toDate,
                    };
                }
                let graphData = {
                    graphId: 'graph-' + widgetData.graph_id,
                    graphTitle: widgetData.graphname,
                    rows: tempData.rows[0],
                    columns: tempData.columns[0],
                    graphTypes: widgetData.graph_structure.chartType[0],
                    graphData: data,
                    aggregationFunctions: tempData.aggregationFunctions[0],
                    filter: tempData.filter,
                    colors: widgetData.graph_structure.colColours[0],
                    range: range,
                    dateVariable: tempData.dateVariable,
                    rangeFilter: widgetData.graph_structure.rangeFilter,
                    comparison: widgetData.graph_structure.comparison ?? [],
                    customVariable: tempData.customVariable,
                    dataFormat: tempData.dataFormat ?? [],
                    lastLevelColumns: tempData.lastLevelColumns ?? [],
                };
                let response = await _self.xsights.build(WidgetType.TREND, graphData);
                this.checkDashboardLoading();
                resolve(response);
            }
            else if (widgetData.graphType == 3) {
                let tableData = {
                    rows: tempData.rows,
                    column: tempData.columns,
                    aggregationFunction: tempData.aggregationFunctions,
                    filter: tempData.filter,
                    derivedVariables: tempData.customVariable,
                    dataFormat: tempData.dataFormat ?? [],
                    data: data,
                    categories: widgetData.graph_structure.chartType,
                };
                _self.pivotTables['table-' + widgetData.graph_id] =
                    await _self.xsights.build(WidgetType.PIVOT_TABLE, tableData);
                setTimeout(() => {
                    _self.checkDashboardLoading();
                }, 500);
                resolve(true);
            }
            else {
                let graphdata = {
                    graphId: 'graph-' + widgetData.graph_id,
                    graphTitle: widgetData.graphname,
                    rows: tempData.rows,
                    columns: tempData.columns,
                    aggregationFunctions: tempData.aggregationFunctions,
                    filter: tempData.filter,
                    customVariable: tempData.customVariable,
                    dataFormat: tempData.dataFormat ?? [],
                    lastLevelColumns: tempData.lastLevelColumns ?? [],
                    graphTypes: widgetData.graph_structure.chartType,
                    graphData: data,
                    colors: widgetData.graph_structure.colColours,
                };
                let response = await this.xsights.build(WidgetType.GRAPH, graphdata);
                this.checkDashboardLoading();
                resolve(response);
            }
        });
    }
    filterData(data, sourceId) {
        let filterToApply = this.filters.filter((filter) => filter.sourceId.toString() == sourceId.toString());
        filterToApply.forEach((filter) => {
            if (filter.selValues.length) {
                let validValues = filter.selValues.map((value) => value.text);
                let temp = [];
                let groupData = lodash.groupBy(data, filter.fieldName);
                let allKeys = Object.keys(groupData);
                allKeys.forEach((key) => {
                    if (validValues.includes(key)) {
                        temp.push(...groupData[key]);
                    }
                });
                data = temp;
            }
        });
        return data;
    }
    checkDashboardLoading() {
        const elements = document.querySelectorAll('.lds-ellipsis');
        if (elements.length == 0) {
            this.isDashboardLoaded.emit({
                isLoaded: true,
                hasSystemApi: this.showHeaderInputs,
                dataFile: this.dataFile,
            });
        }
    }
    setGraphOrder(a, b) {
        if (a.order < b.order) {
            return -1;
        }
        if (a.order > b.order) {
            return 1;
        }
        return 0;
    }
    async filteredDashboard() {
        for (let index = 0; index < this.dashboardData.graphs.length; index++) {
            const graph = this.dashboardData.graphs[index];
            let res = null;
            if (graph.graphType != 2) {
                res = await this.generateDashboard(graph);
                let tempGraphData = {
                    rows: graph.graph_structure.xAxis,
                    columns: graph.graph_structure.yAxis,
                    aggregationFunctions: graph.graph_structure.aggreagations,
                    filter: graph.graph_structure.filter,
                    customVariable: graph.graph_structure.derivedVariables,
                    dataFormat: [],
                    colToShow: null,
                    lastLevelColumns: graph.graph_structure.lastLevelData ?? [],
                    dateVariable: graph.graph_structure.dateVariable,
                    chartType: graph.graph_structure.chartType,
                };
                if (graph.sourceid.toString() == this.mtrSource) {
                    tempGraphData = this.dataService.keyConverter(tempGraphData, this.calledSourceKeys[graph.sourceid.toString()], 1);
                }
                this.buildChart(graph, res, tempGraphData);
            }
        }
    }
    createJSONFileOfData(data) {
        // console.log('data: ', data);
        const blob = new Blob([JSON.stringify(data)], {
            type: 'application/json',
        });
        return new File([blob], 'data.json');
        // return new Promise((resolve, reject) => {
        //   const outputStream = fs.createWriteStream('data.json');
        //   const jsonWriter : any = JSONStream.stringify();
        //   jsonWriter.pipe(outputStream);
        //   for (const item of data) {
        //     jsonWriter.write(item);
        //   }
        //   jsonWriter.end();
        //   outputStream.on('finish', () => {
        //     const file = fs.readFileSync('data.json');
        //     resolve(file);
        //   });
        // })
    }
}
XSightsDashboardComponent.ɵfac = i0.ɵɵngDeclareFactory({ minVersion: "12.0.0", version: "13.0.3", ngImport: i0, type: XSightsDashboardComponent, deps: [{ token: i1.XSightsCoreService }, { token: i2.ToastrService }, { token: i3.DatePipe }, { token: i4.DataService }], target: i0.ɵɵFactoryTarget.Component });
XSightsDashboardComponent.ɵcmp = i0.ɵɵngDeclareComponent({ minVersion: "12.0.0", version: "13.0.3", type: XSightsDashboardComponent, selector: "x-sights-dashboard", inputs: { dashboardId: "dashboardId", adminId: "adminId", showHeader: "showHeader", showFilters: "showFilters", startDate: "startDate", endDate: "endDate", toggleDashboard: "toggleDashboard" }, outputs: { isDashboardLoaded: "isDashboardLoaded" }, usesOnChanges: true, ngImport: i0, template: "<div class=\"row\" *ngIf=\"dashboardData != null\">\n    <div class=\"col-md-12\">\n        <div class=\"dash_graph_sec\">\n            <div class=\"dash_graph\">\n                <div style=\"display: flex; background-color:#000;\" *ngIf=\"showHeader\">\n                    <h3 class=\"graph_name\" style=\"height: 44px;flex:auto;text-transform:capitalize;\">\n                        {{dashboardData.dashboard_name}} &nbsp; <span class=\"badge badge-warning\"\n                            *ngIf=\"dashboardData.dashboard_type == 1\">LIVE</span> </h3>\n                    <div class=\"row date-container\" *ngIf=\"showHeaderInputs\">\n                        <div class=\"col-lg-5\"> <label for=\"startDate\">From &nbsp;&nbsp;</label> <input type=\"date\"\n                                [(ngModel)]=\"fromDate\" id=\"startDate\" class=\"form-control\"> </div>\n                        <div class=\"col-lg-5\">\n                            <label for=\"endDate\">To &nbsp;&nbsp;</label> <input type=\"date\" [(ngModel)]=\"toDate\"\n                                id=\"endDate\" class=\"form-control\">\n                        </div>\n                        <div class=\"col-lg-2\">\n                            <i class=\"fa fa-search\" (click)=\"refreshSystemApis()\"></i>\n                        </div>\n                    </div>\n                </div>\n                <div class=\"filter-container\" *ngIf=\"filters.length\">\n                    <h3>Filters:</h3>\n                    <div class=\"col-lg-12 row\">\n                        <div class=\"col-lg-3\" *ngFor=\"let filter of filters;let i = index\"> <ng-multiselect-dropdown\n                                [placeholder]=\"'Select ' + filter.fieldName + '...'\" [(ngModel)]=\"filter.selValues\"\n                                (onSelect)=\"filteredDashboard()\" (onDeSelect)=\"filteredDashboard()\"\n                                [settings]=\"dropdownSettings\" [data]=\"filter.values\"> </ng-multiselect-dropdown> </div>\n                    </div>\n                </div>\n                <div class=\"row graph_design\" id=\"dashboardScreen\" #dashboardScreen>\n                    <ng-container *ngFor=\"let graph of dashboardData.graphs;\">\n\n                        <ng-container *ngIf=\"graph.graphType != 3 && graph.graphType != 2\">\n                            <div class=\"dashboard-graph\"\n                                [ngClass]=\"{'col-lg-12': graph.graph_index == 1,'col-lg-6': graph.graph_index == 2,'col-lg-4': graph.graph_index == 3,'col-lg-3': graph.graph_index == 4}\"\n                                style=\"min-height: 370px; padding: 0px;\"> <!-- loader start -->\n                                <h3 *ngIf=\"graph.graph_structure.xAxis[0] != '***LABEL***'\" style=\"text-align: center; background-color: #eee; padding: 2px;\">{{graph.graphname}}</h3>\n                                <div [id]=\"'graph-'+ graph.graph_id\" style=\"position: relative; padding: 10px; padding-top: 45px;\">\n                                    <div class=\"lds-ellipsis\">\n                                        <div></div>\n                                        <div></div>\n                                        <div></div>\n                                        <div></div>\n                                    </div> <!-- loader end -->\n                                </div>\n                            </div>\n                        </ng-container>\n                        <div *ngIf=\"graph.graphType == 2\" class=\"dashboard-graph\" [id]=\"'table-graph-'+ graph.graph_id\"\n                            [ngClass]=\"{'col-lg-12': graph.graph_index == 1,'col-lg-6': graph.graph_index == 2,'col-lg-4': graph.graph_index == 3,'col-lg-3': graph.graph_index == 4}\"\n                            style=\"display: flex; flex-direction: column; border-bottom: 0px; background-color:antiquewhite;\">\n                            <!-- loader start -->\n                            <h2 style=\"text-align: center; margin-bottom: 0px;\">{{graph.graphname}}</h2>\n                            <!-- loader end -->\n                        </div>\n                        <div *ngIf=\"graph.graphType == 3\" class=\"dashboard-graph\" [id]=\"'table-'+ graph.graph_id\"\n                            [ngClass]=\"{'col-lg-12': graph.graph_index == 1,'col-lg-6': graph.graph_index == 2,'col-lg-4': graph.graph_index == 3,'col-lg-3': graph.graph_index == 4}\"\n                            style=\"min-height: 300px; display: flex; flex-direction: column; padding-bottom: 2%;\">\n                            <!-- loader start -->\n                            <h3 style=\"text-align: center;\">{{graph.graphname}}</h3>\n                            <ng-container *ngIf=\"pivotTables.hasOwnProperty('table-' + graph.graph_id)\"> <dx-pivot-grid\n                                    [allowSortingBySummary]=\"true\" [allowSorting]=\"true\" [allowFiltering]=\"true\"\n                                    [showBorders]=\"true\" [dataSource]=\"pivotTables['table-' + graph.graph_id]\">\n                                    <dxo-field-chooser [enabled]=\"false\"></dxo-field-chooser> </dx-pivot-grid>\n                            </ng-container> <ng-container *ngIf=\"pivotTables['table-' + graph.graph_id] == undefined\">\n                                <div class=\"lds-ellipsis\">\n                                    <div></div>\n                                    <div></div>\n                                    <div></div>\n                                    <div></div>\n                                </div>\n                            </ng-container> <!-- loader end -->\n                        </div>\n                    </ng-container>\n                </div>\n            </div>\n        </div>\n    </div>\n</div>", styles: [".left-sidebar .nav-link{text-transform:capitalize}.left-sidebar i{margin-right:10px}.left-sidebar .nav-tabs .nav-item{text-transform:capitalize}::ng-deep .left-sidebar .nav-item{text-transform:capitalize}::ng-deep .modal{z-index:1060}.search-filter{height:23px}.search-group{display:flex;align-items:center;justify-content:space-between}.search-group .filter-icon{margin:0}.dash_graph_sec{overflow:auto}.dash_graph_sec .dash_graph{background-color:#fff;margin:15px}.dash_graph_sec .dash_graph .graph_name{text-align:center;align-self:flex-end;color:#fff;padding:5px;margin-bottom:0}.dash_graph_sec .dash_graph .graph_design{margin:0}.dashboard-graph{border:3px solid #dadada;align-items:center;justify-content:center}.modal{z-index:1060!important}::ng-deep .dropdown-custom{inset:103% 0 auto auto!important}.dashname{border-style:groove;background-color:#eee;width:64px;height:34px;display:flex;justify-content:center;align-items:center}.beans-list{padding-left:0;display:flex;flex-wrap:wrap}.beans{border-style:groove;background-color:#fd8309;color:#fff;border-radius:10px;padding:1%;border-color:#fd8309}.graph-source{display:flex;justify-content:space-between;align-items:center}.graph-source h3{margin-bottom:0}.filter-container{padding:10px;background:whitesmoke;border:2px solid #ccc}.filter-container h3{margin-bottom:auto}.filter-container .col-lg-3{padding-left:0}.date-container{justify-content:space-between;align-items:center;color:#fff}.date-container .col-lg-6{display:flex;align-items:center}.date-container .col-lg-6 label{width:70px}\n"], components: [{ type: i5.MultiSelectComponent, selector: "ng-multiselect-dropdown", inputs: ["disabled", "placeholder", "settings", "data"], outputs: ["onFilterChange", "onDropDownClose", "onSelect", "onDeSelect", "onSelectAll", "onDeSelectAll"] }, { type: i6.DxPivotGridComponent, selector: "dx-pivot-grid", inputs: ["allowExpandAll", "allowFiltering", "allowSorting", "allowSortingBySummary", "dataFieldArea", "dataSource", "disabled", "elementAttr", "encodeHtml", "export", "fieldChooser", "fieldPanel", "headerFilter", "height", "hideEmptySummaryCells", "hint", "loadPanel", "rowHeaderLayout", "rtlEnabled", "scrolling", "showBorders", "showColumnGrandTotals", "showColumnTotals", "showRowGrandTotals", "showRowTotals", "showTotalsPrior", "stateStoring", "tabIndex", "texts", "visible", "width", "wordWrapEnabled"], outputs: ["onCellClick", "onCellPrepared", "onContentReady", "onContextMenuPreparing", "onDisposing", "onExporting", "onInitialized", "onOptionChanged", "allowExpandAllChange", "allowFilteringChange", "allowSortingChange", "allowSortingBySummaryChange", "dataFieldAreaChange", "dataSourceChange", "disabledChange", "elementAttrChange", "encodeHtmlChange", "exportChange", "fieldChooserChange", "fieldPanelChange", "headerFilterChange", "heightChange", "hideEmptySummaryCellsChange", "hintChange", "loadPanelChange", "rowHeaderLayoutChange", "rtlEnabledChange", "scrollingChange", "showBordersChange", "showColumnGrandTotalsChange", "showColumnTotalsChange", "showRowGrandTotalsChange", "showRowTotalsChange", "showTotalsPriorChange", "stateStoringChange", "tabIndexChange", "textsChange", "visibleChange", "widthChange", "wordWrapEnabledChange"] }, { type: i7.DxoFieldChooserComponent, selector: "dxo-field-chooser", inputs: ["allowSearch", "applyChangesMode", "enabled", "height", "layout", "searchTimeout", "texts", "title", "width"] }], directives: [{ type: i3.NgIf, selector: "[ngIf]", inputs: ["ngIf", "ngIfThen", "ngIfElse"] }, { type: i8.DefaultValueAccessor, selector: "input:not([type=checkbox])[formControlName],textarea[formControlName],input:not([type=checkbox])[formControl],textarea[formControl],input:not([type=checkbox])[ngModel],textarea[ngModel],[ngDefaultControl]" }, { type: i8.NgControlStatus, selector: "[formControlName],[ngModel],[formControl]" }, { type: i8.NgModel, selector: "[ngModel]:not([formControlName]):not([formControl])", inputs: ["name", "disabled", "ngModel", "ngModelOptions"], outputs: ["ngModelChange"], exportAs: ["ngModel"] }, { type: i3.NgForOf, selector: "[ngFor][ngForOf]", inputs: ["ngForOf", "ngForTrackBy", "ngForTemplate"] }, { type: i3.NgClass, selector: "[ngClass]", inputs: ["class", "ngClass"] }] });
i0.ɵɵngDeclareClassMetadata({ minVersion: "12.0.0", version: "13.0.3", ngImport: i0, type: XSightsDashboardComponent, decorators: [{
            type: Component,
            args: [{ selector: 'x-sights-dashboard', template: "<div class=\"row\" *ngIf=\"dashboardData != null\">\n    <div class=\"col-md-12\">\n        <div class=\"dash_graph_sec\">\n            <div class=\"dash_graph\">\n                <div style=\"display: flex; background-color:#000;\" *ngIf=\"showHeader\">\n                    <h3 class=\"graph_name\" style=\"height: 44px;flex:auto;text-transform:capitalize;\">\n                        {{dashboardData.dashboard_name}} &nbsp; <span class=\"badge badge-warning\"\n                            *ngIf=\"dashboardData.dashboard_type == 1\">LIVE</span> </h3>\n                    <div class=\"row date-container\" *ngIf=\"showHeaderInputs\">\n                        <div class=\"col-lg-5\"> <label for=\"startDate\">From &nbsp;&nbsp;</label> <input type=\"date\"\n                                [(ngModel)]=\"fromDate\" id=\"startDate\" class=\"form-control\"> </div>\n                        <div class=\"col-lg-5\">\n                            <label for=\"endDate\">To &nbsp;&nbsp;</label> <input type=\"date\" [(ngModel)]=\"toDate\"\n                                id=\"endDate\" class=\"form-control\">\n                        </div>\n                        <div class=\"col-lg-2\">\n                            <i class=\"fa fa-search\" (click)=\"refreshSystemApis()\"></i>\n                        </div>\n                    </div>\n                </div>\n                <div class=\"filter-container\" *ngIf=\"filters.length\">\n                    <h3>Filters:</h3>\n                    <div class=\"col-lg-12 row\">\n                        <div class=\"col-lg-3\" *ngFor=\"let filter of filters;let i = index\"> <ng-multiselect-dropdown\n                                [placeholder]=\"'Select ' + filter.fieldName + '...'\" [(ngModel)]=\"filter.selValues\"\n                                (onSelect)=\"filteredDashboard()\" (onDeSelect)=\"filteredDashboard()\"\n                                [settings]=\"dropdownSettings\" [data]=\"filter.values\"> </ng-multiselect-dropdown> </div>\n                    </div>\n                </div>\n                <div class=\"row graph_design\" id=\"dashboardScreen\" #dashboardScreen>\n                    <ng-container *ngFor=\"let graph of dashboardData.graphs;\">\n\n                        <ng-container *ngIf=\"graph.graphType != 3 && graph.graphType != 2\">\n                            <div class=\"dashboard-graph\"\n                                [ngClass]=\"{'col-lg-12': graph.graph_index == 1,'col-lg-6': graph.graph_index == 2,'col-lg-4': graph.graph_index == 3,'col-lg-3': graph.graph_index == 4}\"\n                                style=\"min-height: 370px; padding: 0px;\"> <!-- loader start -->\n                                <h3 *ngIf=\"graph.graph_structure.xAxis[0] != '***LABEL***'\" style=\"text-align: center; background-color: #eee; padding: 2px;\">{{graph.graphname}}</h3>\n                                <div [id]=\"'graph-'+ graph.graph_id\" style=\"position: relative; padding: 10px; padding-top: 45px;\">\n                                    <div class=\"lds-ellipsis\">\n                                        <div></div>\n                                        <div></div>\n                                        <div></div>\n                                        <div></div>\n                                    </div> <!-- loader end -->\n                                </div>\n                            </div>\n                        </ng-container>\n                        <div *ngIf=\"graph.graphType == 2\" class=\"dashboard-graph\" [id]=\"'table-graph-'+ graph.graph_id\"\n                            [ngClass]=\"{'col-lg-12': graph.graph_index == 1,'col-lg-6': graph.graph_index == 2,'col-lg-4': graph.graph_index == 3,'col-lg-3': graph.graph_index == 4}\"\n                            style=\"display: flex; flex-direction: column; border-bottom: 0px; background-color:antiquewhite;\">\n                            <!-- loader start -->\n                            <h2 style=\"text-align: center; margin-bottom: 0px;\">{{graph.graphname}}</h2>\n                            <!-- loader end -->\n                        </div>\n                        <div *ngIf=\"graph.graphType == 3\" class=\"dashboard-graph\" [id]=\"'table-'+ graph.graph_id\"\n                            [ngClass]=\"{'col-lg-12': graph.graph_index == 1,'col-lg-6': graph.graph_index == 2,'col-lg-4': graph.graph_index == 3,'col-lg-3': graph.graph_index == 4}\"\n                            style=\"min-height: 300px; display: flex; flex-direction: column; padding-bottom: 2%;\">\n                            <!-- loader start -->\n                            <h3 style=\"text-align: center;\">{{graph.graphname}}</h3>\n                            <ng-container *ngIf=\"pivotTables.hasOwnProperty('table-' + graph.graph_id)\"> <dx-pivot-grid\n                                    [allowSortingBySummary]=\"true\" [allowSorting]=\"true\" [allowFiltering]=\"true\"\n                                    [showBorders]=\"true\" [dataSource]=\"pivotTables['table-' + graph.graph_id]\">\n                                    <dxo-field-chooser [enabled]=\"false\"></dxo-field-chooser> </dx-pivot-grid>\n                            </ng-container> <ng-container *ngIf=\"pivotTables['table-' + graph.graph_id] == undefined\">\n                                <div class=\"lds-ellipsis\">\n                                    <div></div>\n                                    <div></div>\n                                    <div></div>\n                                    <div></div>\n                                </div>\n                            </ng-container> <!-- loader end -->\n                        </div>\n                    </ng-container>\n                </div>\n            </div>\n        </div>\n    </div>\n</div>", styles: [".left-sidebar .nav-link{text-transform:capitalize}.left-sidebar i{margin-right:10px}.left-sidebar .nav-tabs .nav-item{text-transform:capitalize}::ng-deep .left-sidebar .nav-item{text-transform:capitalize}::ng-deep .modal{z-index:1060}.search-filter{height:23px}.search-group{display:flex;align-items:center;justify-content:space-between}.search-group .filter-icon{margin:0}.dash_graph_sec{overflow:auto}.dash_graph_sec .dash_graph{background-color:#fff;margin:15px}.dash_graph_sec .dash_graph .graph_name{text-align:center;align-self:flex-end;color:#fff;padding:5px;margin-bottom:0}.dash_graph_sec .dash_graph .graph_design{margin:0}.dashboard-graph{border:3px solid #dadada;align-items:center;justify-content:center}.modal{z-index:1060!important}::ng-deep .dropdown-custom{inset:103% 0 auto auto!important}.dashname{border-style:groove;background-color:#eee;width:64px;height:34px;display:flex;justify-content:center;align-items:center}.beans-list{padding-left:0;display:flex;flex-wrap:wrap}.beans{border-style:groove;background-color:#fd8309;color:#fff;border-radius:10px;padding:1%;border-color:#fd8309}.graph-source{display:flex;justify-content:space-between;align-items:center}.graph-source h3{margin-bottom:0}.filter-container{padding:10px;background:whitesmoke;border:2px solid #ccc}.filter-container h3{margin-bottom:auto}.filter-container .col-lg-3{padding-left:0}.date-container{justify-content:space-between;align-items:center;color:#fff}.date-container .col-lg-6{display:flex;align-items:center}.date-container .col-lg-6 label{width:70px}\n"] }]
        }], ctorParameters: function () { return [{ type: i1.XSightsCoreService }, { type: i2.ToastrService }, { type: i3.DatePipe }, { type: i4.DataService }]; }, propDecorators: { dashboardId: [{
                type: Input
            }], adminId: [{
                type: Input
            }], showHeader: [{
                type: Input
            }], showFilters: [{
                type: Input
            }], startDate: [{
                type: Input
            }], endDate: [{
                type: Input
            }], toggleDashboard: [{
                type: Input
            }], isDashboardLoaded: [{
                type: Output
            }] } });
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoieC1zaWdodHMtZGFzaGJvYXJkLmNvbXBvbmVudC5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uLy4uLy4uLy4uLy4uL3Byb2plY3RzL3gtc2lnaHRzLWNvcmUvc3JjL2xpYi9jb21wb25lbnRzL3gtc2lnaHRzLWRhc2hib2FyZC94LXNpZ2h0cy1kYXNoYm9hcmQuY29tcG9uZW50LnRzIiwiLi4vLi4vLi4vLi4vLi4vLi4vcHJvamVjdHMveC1zaWdodHMtY29yZS9zcmMvbGliL2NvbXBvbmVudHMveC1zaWdodHMtZGFzaGJvYXJkL3gtc2lnaHRzLWRhc2hib2FyZC5jb21wb25lbnQuaHRtbCJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFDQSxPQUFPLEVBQUUsU0FBUyxFQUFFLFlBQVksRUFBRSxLQUFLLEVBQVUsTUFBTSxFQUFpQixNQUFNLGVBQWUsQ0FBQztBQUM5RixPQUFPLEtBQUssTUFBTSxNQUFNLFFBQVEsQ0FBQztBQUdqQyxPQUFPLEVBQUUsVUFBVSxFQUFzQixNQUFNLDZCQUE2QixDQUFDO0FBQzdFLE9BQU8sSUFBSSxNQUFNLGFBQWEsQ0FBQzs7Ozs7Ozs7OztBQU8vQixNQUFNLE9BQU8seUJBQXlCO0lBNEJwQyxZQUNVLE9BQTJCLEVBQzNCLFlBQTJCLEVBQzNCLFFBQWtCLEVBQ2xCLFdBQXdCO1FBSHhCLFlBQU8sR0FBUCxPQUFPLENBQW9CO1FBQzNCLGlCQUFZLEdBQVosWUFBWSxDQUFlO1FBQzNCLGFBQVEsR0FBUixRQUFRLENBQVU7UUFDbEIsZ0JBQVcsR0FBWCxXQUFXLENBQWE7UUEvQjFCLGVBQVUsR0FBRyxDQUFDLEtBQUssRUFBRSxLQUFLLEVBQUUsS0FBSyxDQUFDLENBQUM7UUFDbkMsY0FBUyxHQUFHLEtBQUssQ0FBQztRQUNqQixnQkFBVyxHQUFXLENBQUMsQ0FBQztRQUN4QixZQUFPLEdBQVEsR0FBRyxDQUFDO1FBQ25CLGVBQVUsR0FBWSxJQUFJLENBQUM7UUFDM0IsZ0JBQVcsR0FBWSxJQUFJLENBQUM7UUFD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QyxxckxBNkVNOzJGRGhFTyx5QkFBeUI7a0JBTHJDLFNBQVM7K0JBQ0Usb0JBQW9CO3NMQU9yQixXQUFXO3NCQUFuQixLQUFLO2dCQUNHLE9BQU87c0JBQWYsS0FBSztnQkFDRyxVQUFVO3NCQUFsQixLQUFLO2dCQUNHLFdBQVc7c0JBQW5CLEtBQUs7Z0JBQ0csU0FBUztzQkFBakIsS0FBSztnQkFDRyxPQUFPO3NCQUFmLEtBQUs7Z0JBQ0csZUFBZTtzQkFBdkIsS0FBSztnQkFFSSxpQkFBaUI7c0JBQTFCLE1BQU0iLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgeyBEYXRlUGlwZSB9IGZyb20gJ0Bhbmd1bGFyL2NvbW1vbic7XG5pbXBvcnQgeyBDb21wb25lbnQsIEV2ZW50RW1pdHRlciwgSW5wdXQsIE9uSW5pdCwgT3V0cHV0LCBTaW1wbGVDaGFuZ2VzIH0gZnJvbSAnQGFuZ3VsYXIvY29yZSc7XG5pbXBvcnQgKiBhcyBsb2Rhc2ggZnJvbSAnbG9kYXNoJztcbmltcG9ydCB7IFRvYXN0clNlcnZpY2UgfSBmcm9tICduZ3gtdG9hc3RyJztcbmltcG9ydCB7IERhdGFTZXJ2aWNlIH0gZnJvbSAnLi4vLi4vc2VydmljZXMvZGF0YS5zZXJ2aWNlJztcbmltcG9ydCB7IFdpZGdldFR5cGUsIFhTaWdodHNDb3JlU2VydmljZSB9IGZyb20gJy4uLy4uL3gtc2lnaHRzLWNvcmUuc2VydmljZSc7XG5pbXBvcnQgU3dhbCBmcm9tICdzd2VldGFsZXJ0Mic7XG5cbkBDb21wb25lbnQoe1xuICBzZWxlY3RvcjogJ3gtc2lnaHRzLWRhc2hib2FyZCcsXG4gIHRlbXBsYXRlVXJsOiAnLi94LXNpZ2h0cy1kYXNoYm9hcmQuY29tcG9uZW50Lmh0bWwnLFxuICBzdHlsZVVybHM6IFsnLi94LXNpZ2h0cy1kYXNoYm9hcmQuY29tcG9uZW50LnNjc3MnXSxcbn0pXG5leHBvcnQgY2xhc3MgWFNpZ2h0c0Rhc2hib2FyZENvbXBvbmVudCBpbXBsZW1lbnRzIE9uSW5pdCB7XG4gIHByaXZhdGUgc3lzdGVtQXBpcyA9IFsnMTk4JywgJzEzOCcsICcyNzknXTtcbiAgcHJpdmF0ZSBtdHJTb3VyY2UgPSAnMTM4JztcbiAgQElucHV0KCkgZGFzaGJvYXJkSWQ6IG51bWJlciA9IDA7XG4gIEBJbnB1dCgpIGFkbWluSWQ6IGFueSA9ICcwJztcbiAgQElucHV0KCkgc2hvd0hlYWRlcjogYm9vbGVhbiA9IHRydWU7XG4gIEBJbnB1dCgpIHNob3dGaWx0ZXJzOiBib29sZWFuID0gdHJ1ZTtcbiAgQElucHV0KCkgc3RhcnREYXRlOiBhbnkgPSBudWxsO1xuICBASW5wdXQoKSBlbmREYXRlOiBhbnkgPSBudWxsO1xuICBASW5wdXQoKSB0b2dnbGVEYXNoYm9hcmQ6IGJvb2xlYW4gPSBmYWxzZTtcblxuICBAT3V0cHV0KCkgaXNEYXNoYm9hcmRMb2FkZWQ6IEV2ZW50RW1pdHRlcjxhbnk+ID0gbmV3IEV2ZW50RW1pdHRlcigpO1xuXG4gIGRhc2hib2FyZERhdGE6IGFueSA9IG51bGw7XG4gIGZyb21EYXRlOiBhbnkgPSBudWxsO1xuICB0b0RhdGU6IGFueSA9IG51bGw7XG4gIHNob3dIZWFkZXJJbnB1dHM6IGFueSA9IGZhbHNlO1xuICBmaWx0ZXJzOiBhbnkgPSBbXTtcbiAgY2FsbGVkU291cmNlOiBhbnkgPSB7fTtcbiAgY2FsbGVkU291cmNlS2V5czogYW55ID0ge307XG4gIGxpdmVSZWZyZXNoTWluOiBhbnkgPSA1O1xuICBkYXRhRmlsZTogYW55ID0gW107XG4gIGRhdGFGaWxlSW5kZXg6IGFueSA9IFtdO1xuICBwaXZvdFRhYmxlczogYW55ID0ge307XG4gIGRhc2hQdWJsaWNVcmw6IGFueSA9ICcnO1xuICBkYXNoYm9hcmRJbnRlcnZhbDogYW55O1xuICBkcm9wZG93blNldHRpbmdzOiBhbnkgPSB7fTtcblxuICBjb25zdHJ1Y3RvcihcbiAgICBwcml2YXRlIHhzaWdodHM6IFhTaWdodHNDb3JlU2VydmljZSxcbiAgICBwcml2YXRlIHRvYXN0U2VydmljZTogVG9hc3RyU2VydmljZSxcbiAgICBwcml2YXRlIGRhdGVQaXBlOiBEYXRlUGlwZSxcbiAgICBwcml2YXRlIGRhdGFTZXJ2aWNlOiBEYXRhU2VydmljZVxuICApIHtcbiAgICBpZiAodGhpcy5zdGFydERhdGUgPT0gbnVsbCkge1xuICAgICAgdGhpcy5mcm9tRGF0ZSA9IHRoaXMuZGF0ZVBpcGUudHJhbnNmb3JtKFxuICAgICAgICBuZXcgRGF0ZShuZXcgRGF0ZSgpLnNldERhdGUobmV3IERhdGUoKS5nZXREYXRlKCkgLSAzKSksXG4gICAgICAgICd5eXl5LU1NLWRkJ1xuICAgICAgKTtcbiAgICB9IGVsc2Uge1xuICAgICAgdGhpcy5mcm9tRGF0ZSA9IHRoaXMuc3RhcnREYXRlO1xuICAgIH1cbiAgICBpZiAodGhpcy5lbmREYXRlID09IG51bGwpIHtcbiAgICAgIHRoaXMudG9EYXRlID0gdGhpcy5kYXRlUGlwZS50cmFuc2Zvcm0obmV3IERhdGUoKSwgJ3l5eXktTU0tZGQnKTtcbiAgICB9IGVsc2Uge1xuICAgICAgdGhpcy50b0RhdGUgPSB0aGlzLmVuZERhdGU7XG4gICAgfVxuICB9XG5cbiAgbmdPbkluaXQoKSB7XG4gICAgdGhpcy5kcm9wZG93blNldHRpbmdzID0ge1xuICAgICAgc2luZ2xlU2VsZWN0aW9uOiBmYWxzZSxcbiAgICAgIGVuYWJsZUNoZWNrQWxsOiBmYWxzZSxcbiAgICAgIGFsbG93U2VhcmNoRmlsdGVyOiB0cnVlLFxuICAgIH07XG4gICAgLy8gdGhpcy5yZW5kZXJQYWdlKCk7XG4gIH1cblxuICByZW5kZXJQYWdlKCkge1xuICAgIHRoaXMuZ2V0RGFzaEJvYXJkQnlJZCgpO1xuICB9XG5cbiAgbmdPbkRlc3Ryb3koKSB7XG4gICAgLy9DYWxsZWQgb25jZSwgYmVmb3JlIHRoZSBpbnN0YW5jZSBpcyBkZXN0cm95ZWQuXG4gICAgLy9BZGQgJ2ltcGxlbWVudHMgT25EZXN0cm95JyB0byB0aGUgY2xhc3MuXG4gICAgY2xlYXJJbnRlcnZhbCh0aGlzLmRhc2hib2FyZEludGVydmFsKTtcbiAgfVxuICBuZ09uQ2hhbmdlcyhjaGFuZ2VzOiBTaW1wbGVDaGFuZ2VzKSB7XG4gICAgLy9DYWxsZWQgYmVmb3JlIGFueSBvdGhlciBsaWZlY3ljbGUgaG9vay4gVXNlIGl0IHRvIGluamVjdCBkZXBlbmRlbmNpZXMsIGJ1dCBhdm9pZCBhbnkgc2VyaW91cyB3b3JrIGhlcmUuXG4gICAgLy9BZGQgJyR7aW1wbGVtZW50cyBPbkNoYW5nZXN9JyB0byB0aGUgY2xhc3MuXG4gICAgLy8gaWYgKFxuICAgIC8vICAgKCFjaGFuZ2VzWydyZWZyZXNoRGFzaGJvYXJkJ10/LmlzRmlyc3RDaGFuZ2UoKSAmJlxuICAgIC8vICAgICBjaGFuZ2VzWydyZWZyZXNoRGFzaGJvYXJkJ10/LmN1cnJlbnRWYWx1ZSAhPVxuICAgIC8vICAgICAgIGNoYW5nZXNbJ3JlZnJlc2hEYXNoYm9hcmQnXT8ucHJldmlvdXNWYWx1ZSlcbiAgICAvLyApIHtcbiAgICAvLyAgIHRoaXMucmVmcmVzaFN5c3RlbUFwaXMoKTtcbiAgICAvLyB9XG4gICAgaWYgKFxuICAgICAgY2hhbmdlc1snZGFzaGJvYXJkSWQnXT8uY3VycmVudFZhbHVlICE9XG4gICAgICAgIGNoYW5nZXNbJ2Rhc2hib2FyZElkJ10/LnByZXZpb3VzVmFsdWUgfHxcbiAgICAgIGNoYW5nZXNbJ2FkbWluSWQnXT8uY3VycmVudFZhbHVlICE9IGNoYW5nZXNbJ2FkbWluSWQnXT8ucHJldmlvdXNWYWx1ZSB8fFxuICAgICAgY2hhbmdlc1snc2hvd0hlYWRlciddPy5jdXJyZW50VmFsdWUgIT1cbiAgICAgICAgY2hhbmdlc1snc2hvd0hlYWRlciddPy5wcmV2aW91c1ZhbHVlIHx8XG4gICAgICBjaGFuZ2VzWydzaG93RmlsdGVycyddPy5jdXJyZW50VmFsdWUgIT1cbiAgICAgICAgY2hhbmdlc1snc2hvd0ZpbHRlcnMnXT8ucHJldmlvdXNWYWx1ZSB8fFxuICAgICAgY2hhbmdlc1sndG9nZ2xlRGFzaGJvYXJkJ10/LmN1cnJlbnRWYWx1ZSAhPVxuICAgICAgICBjaGFuZ2VzWyd0b2dnbGVEYXNoYm9hcmQnXT8ucHJldmlvdXNWYWx1ZVxuICAgICkge1xuICAgICAgdGhpcy5yZW5kZXJQYWdlKCk7XG4gICAgfVxuICB9XG4gIGFzeW5jIHJlZnJlc2hTeXN0ZW1BcGlzKCkge1xuICAgIGxldCBjYWxsZWRPbmNlID0gZmFsc2U7XG4gICAgZm9yIChsZXQgaW5kZXggPSAwOyBpbmRleCA8IHRoaXMuZGFzaGJvYXJkRGF0YS5ncmFwaHMubGVuZ3RoOyBpbmRleCsrKSB7XG4gICAgICBsZXQgX3NlbGYgPSB0aGlzO1xuICAgICAgY29uc3QgZ3JhcGggPSBfc2VsZi5kYXNoYm9hcmREYXRhLmdyYXBoc1tpbmRleF07XG4gICAgICBpZiAoZ3JhcGguc291cmNlaWQudG9TdHJpbmcoKSA9PSAnMTM4Jykge1xuICAgICAgICAvL3Nob3cgbG9hZGVyIGluIE1UUiBncmFwaFxuICAgICAgICBpZiAoIWNhbGxlZE9uY2UpIHtcbiAgICAgICAgICAvLyBTd2FsLmZpcmUoe1xuICAgICAgICAgIC8vICAgdGl0bGU6ICdQbGVhc2UgV2FpdC4uLicsXG4gICAgICAgICAgLy8gICB0ZXh0OiAnRmV0Y2ggTVRSIFJlcG9ydCcsXG4gICAgICAgICAgLy8gICBpY29uOiAnaW5mbycsXG4gICAgICAgICAgLy8gICBzaG93Q29uZmlybUJ1dHRvbjogZmFsc2UsXG4gICAgICAgICAgLy8gICBzaG93Q2FuY2VsQnV0dG9uOiBmYWxzZSxcbiAgICAgICAgICAvLyAgIGFsbG93RW50ZXJLZXk6IGZhbHNlLFxuICAgICAgICAgIC8vICAgYWxsb3dPdXRzaWRlQ2xpY2s6IGZhbHNlLFxuICAgICAgICAgIC8vICAgYWxsb3dFc2NhcGVLZXk6IGZhbHNlLFxuICAgICAgICAgIC8vIH0pO1xuICAgICAgICAgIC8vIFN3YWwuaXNMb2FkaW5nKCk7XG4gICAgICAgIH1cbiAgICAgICAgbGV0IHJlcyA9IGF3YWl0IF9zZWxmLmdlbmVyYXRlRGFzaGJvYXJkKGdyYXBoLCAhY2FsbGVkT25jZSk7XG4gICAgICAgIGxldCB0ZW1wR3JhcGhEYXRhID0ge1xuICAgICAgICAgIHJvd3M6IGdyYXBoLmdyYXBoX3N0cnVjdHVyZS54QXhpcyxcbiAgICAgICAgICBjb2x1bW5zOiBncmFwaC5ncmFwaF9zdHJ1Y3R1cmUueUF4aXMsXG4gICAgICAgICAgYWdncmVnYXRpb25GdW5jdGlvbnM6IGdyYXBoLmdyYXBoX3N0cnVjdHVyZS5hZ2dyZWFnYXRpb25zLFxuICAgICAgICAgIGZpbHRlcjogZ3JhcGguZ3JhcGhfc3RydWN0dXJlLmZpbHRlcixcbiAgICAgICAgICBjdXN0b21WYXJpYWJsZTogZ3JhcGguZ3JhcGhfc3RydWN0dXJlLmRlcml2ZWRWYXJpYWJsZXMsXG4gICAgICAgICAgZGF0YUZvcm1hdDogW10sXG4gICAgICAgICAgY29sVG9TaG93OiBudWxsLFxuICAgICAgICAgIGNoYXJ0VHlwZTogZ3JhcGguZ3JhcGhfc3RydWN0dXJlLmNoYXJ0VHlwZSxcbiAgICAgICAgICBsYXN0TGV2ZWxDb2x1bW5zOiBncmFwaC5ncmFwaF9zdHJ1Y3R1cmUubGFzdExldmVsRGF0YSA/PyBbXSxcbiAgICAgICAgICBkYXRlVmFyaWFibGU6IGdyYXBoLmdyYXBoX3N0cnVjdHVyZS5kYXRlVmFyaWFibGUsXG4gICAgICAgIH07XG4gICAgICAgIGlmIChncmFwaC5zb3VyY2VpZC50b1N0cmluZygpID09IHRoaXMubXRyU291cmNlKSB7XG4gICAgICAgICAgdGVtcEdyYXBoRGF0YSA9IHRoaXMuZGF0YVNlcnZpY2Uua2V5Q29udmVydGVyKFxuICAgICAgICAgICAgdGVtcEdyYXBoRGF0YSxcbiAgICAgICAgICAgIHRoaXMuY2FsbGVkU291cmNlS2V5c1tncmFwaC5zb3VyY2VpZC50b1N0cmluZygpXSxcbiAgICAgICAgICAgIDFcbiAgICAgICAgICApO1xuICAgICAgICB9XG4gICAgICAgIHRoaXMuYnVpbGRDaGFydChncmFwaCwgcmVzLCB0ZW1wR3JhcGhEYXRhKTtcbiAgICAgICAgY2FsbGVkT25jZSA9IHRydWU7XG4gICAgICB9IGVsc2UgaWYgKGdyYXBoLnNvdXJjZWlkLnRvU3RyaW5nKCkgPT0gJzE5OCcpIHtcbiAgICAgICAgaWYgKCFjYWxsZWRPbmNlKSB7XG4gICAgICAgICAgLy8gU3dhbC5maXJlKHtcbiAgICAgICAgICAvLyAgIHRpdGxlOiAnUGxlYXNlIFdhaXQuLi4nLFxuICAgICAgICAgIC8vICAgdGV4dDogJ0ZldGNoIENoZXR0aW5hZCBGYXVsdCBNVFIgUmVwb3J0JyxcbiAgICAgICAgICAvLyAgIGljb246ICdpbmZvJyxcbiAgICAgICAgICAvLyAgIHNob3dDb25maXJtQnV0dG9uOiBmYWxzZSxcbiAgICAgICAgICAvLyAgIHNob3dDYW5jZWxCdXR0b246IGZhbHNlLFxuICAgICAgICAgIC8vICAgYWxsb3dFbnRlcktleTogZmFsc2UsXG4gICAgICAgICAgLy8gICBhbGxvd091dHNpZGVDbGljazogZmFsc2UsXG4gICAgICAgICAgLy8gICBhbGxvd0VzY2FwZUtleTogZmFsc2UsXG4gICAgICAgICAgLy8gfSk7XG4gICAgICAgICAgLy8gU3dhbC5pc0xvYWRpbmcoKTtcbiAgICAgICAgfVxuICAgICAgICBsZXQgcmVzID0gYXdhaXQgX3NlbGYuZ2VuZXJhdGVEYXNoYm9hcmQoZ3JhcGgsICFjYWxsZWRPbmNlKTtcbiAgICAgICAgbGV0IHRlbXBHcmFwaERhdGEgPSB7XG4gICAgICAgICAgcm93czogZ3JhcGguZ3JhcGhfc3RydWN0dXJlLnhBeGlzLFxuICAgICAgICAgIGNvbHVtbnM6IGdyYXBoLmdyYXBoX3N0cnVjdHVyZS55QXhpcyxcbiAgICAgICAgICBhZ2dyZWdhdGlvbkZ1bmN0aW9uczogZ3JhcGguZ3JhcGhfc3RydWN0dXJlLmFnZ3JlYWdhdGlvbnMsXG4gICAgICAgICAgZmlsdGVyOiBncmFwaC5ncmFwaF9zdHJ1Y3R1cmUuZmlsdGVyLFxuICAgICAgICAgIGN1c3RvbVZhcmlhYmxlOiBncmFwaC5ncmFwaF9zdHJ1Y3R1cmUuZGVyaXZlZFZhcmlhYmxlcyxcbiAgICAgICAgICBkYXRhRm9ybWF0OiBbXSxcbiAgICAgICAgICBjb2xUb1Nob3c6IG51bGwsXG4gICAgICAgICAgY2hhcnRUeXBlOiBncmFwaC5ncmFwaF9zdHJ1Y3R1cmUuY2hhcnRUeXBlLFxuICAgICAgICAgIGxhc3RMZXZlbENvbHVtbnM6IGdyYXBoLmdyYXBoX3N0cnVjdHVyZS5sYXN0TGV2ZWxEYXRhID8/IFtdLFxuICAgICAgICAgIGRhdGVWYXJpYWJsZTogZ3JhcGguZ3JhcGhfc3RydWN0dXJlLmRhdGVWYXJpYWJsZSxcbiAgICAgICAgfTtcbiAgICAgICAgaWYgKGdyYXBoLnNvdXJjZWlkLnRvU3RyaW5nKCkgPT0gdGhpcy5tdHJTb3VyY2UpIHtcbiAgICAgICAgICB0ZW1wR3JhcGhEYXRhID0gdGhpcy5kYXRhU2VydmljZS5rZXlDb252ZXJ0ZXIoXG4gICAgICAgICAgICB0ZW1wR3JhcGhEYXRhLFxuICAgICAgICAgICAgdGhpcy5jYWxsZWRTb3VyY2VLZXlzW2dyYXBoLnNvdXJjZWlkLnRvU3RyaW5nKCldLFxuICAgICAgICAgICAgMVxuICAgICAgICAgICk7XG4gICAgICAgIH1cbiAgICAgICAgdGhpcy5idWlsZENoYXJ0KGdyYXBoLCByZXMsIHRlbXBHcmFwaERhdGEpO1xuICAgICAgICBjYWxsZWRPbmNlID0gdHJ1ZTtcbiAgICAgIH1cbiAgICB9XG4gIH1cbiAgZ2V0RGFzaEJvYXJkQnlJZCgpIHtcbiAgICB0aGlzLmRhdGFTZXJ2aWNlXG4gICAgICAuZ2V0RGFzaGJvYXJkQnlJZCh0aGlzLmRhc2hib2FyZElkLCB0aGlzLmFkbWluSWQpXG4gICAgICAudGhlbihhc3luYyAocmVzOiBhbnkpID0+IHtcbiAgICAgICAgdGhpcy5maWx0ZXJzID0gcmVzLmRhdGFbMF0/LmZpbHRlcnMgPz8gW107XG4gICAgICAgIHJlcy5kYXRhWzBdLmdyYXBocyA9IHJlcy5kYXRhWzBdLmdyYXBocy5zb3J0KHRoaXMuc2V0R3JhcGhPcmRlcik7XG4gICAgICAgIHRoaXMuZGFzaGJvYXJkRGF0YSA9IHJlcy5kYXRhWzBdO1xuICAgICAgICBmb3IgKGNvbnN0IGVsZW1lbnQgb2YgdGhpcy5kYXNoYm9hcmREYXRhLmdyYXBocykge1xuICAgICAgICAgIGNvbnN0IGdyYXBoID0gZWxlbWVudDtcbiAgICAgICAgICBpZiAoZ3JhcGguZ3JhcGhUeXBlICE9IDIpIHtcbiAgICAgICAgICAgIGxldCByZXMgPSBhd2FpdCB0aGlzLmdlbmVyYXRlRGFzaGJvYXJkKGdyYXBoKTtcbiAgICAgICAgICAgIGxldCB0ZW1wR3JhcGhEYXRhID0ge1xuICAgICAgICAgICAgICByb3dzOiBncmFwaC5ncmFwaF9zdHJ1Y3R1cmUueEF4aXMsXG4gICAgICAgICAgICAgIGNvbHVtbnM6IGdyYXBoLmdyYXBoX3N0cnVjdHVyZS55QXhpcyxcbiAgICAgICAgICAgICAgYWdncmVnYXRpb25GdW5jdGlvbnM6IGdyYXBoLmdyYXBoX3N0cnVjdHVyZS5hZ2dyZWFnYXRpb25zLFxuICAgICAgICAgICAgICBmaWx0ZXI6IGdyYXBoLmdyYXBoX3N0cnVjdHVyZS5maWx0ZXIsXG4gICAgICAgICAgICAgIGN1c3RvbVZhcmlhYmxlOiBncmFwaC5ncmFwaF9zdHJ1Y3R1cmUuZGVyaXZlZFZhcmlhYmxlcyxcbiAgICAgICAgICAgICAgZGF0YUZvcm1hdDogW10sXG4gICAgICAgICAgICAgIGNvbFRvU2hvdzogbnVsbCxcbiAgICAgICAgICAgICAgbGFzdExldmVsQ29sdW1uczogZ3JhcGguZ3JhcGhfc3RydWN0dXJlLmxhc3RMZXZlbERhdGEgPz8gW10sXG4gICAgICAgICAgICAgIGNoYXJ0VHlwZTogZ3JhcGguZ3JhcGhfc3RydWN0dXJlLmNoYXJ0VHlwZSxcbiAgICAgICAgICAgICAgZGF0ZVZhcmlhYmxlOiBncmFwaC5ncmFwaF9zdHJ1Y3R1cmUuZGF0ZVZhcmlhYmxlLFxuICAgICAgICAgICAgfTtcbiAgICAgICAgICAgIGlmIChncmFwaC5zb3VyY2VpZC50b1N0cmluZygpID09IHRoaXMubXRyU291cmNlKSB7XG4gICAgICAgICAgICAgIHRlbXBHcmFwaERhdGEgPSB0aGlzLmRhdGFTZXJ2aWNlLmtleUNvbnZlcnRlcihcbiAgICAgICAgICAgICAgICB0ZW1wR3JhcGhEYXRhLFxuICAgICAgICAgICAgICAgIHRoaXMuY2FsbGVkU291cmNlS2V5c1tncmFwaC5zb3VyY2VpZC50b1N0cmluZygpXSxcbiAgICAgICAgICAgICAgICAxXG4gICAgICAgICAgICAgICk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICB0aGlzLmJ1aWxkQ2hhcnQoZ3JhcGgsIHJlcywgdGVtcEdyYXBoRGF0YSk7XG4gICAgICAgICAgfVxuICAgICAgICAgIC8vIGlmKHRoaXMuZGFzaGJvYXJkRGF0YS5kYXNoYm9hcmRfdHlwZSA9PSAxKXtcbiAgICAgICAgICAvL1NldCBMaXZlIERhc2hib2FyZCBJbnRlcnZhbFxuICAgICAgICAgIC8vIHRoaXMuZGFzaGJvYXJkSW50ZXJ2YWwgPSBzZXRJbnRlcnZhbChhc3luYyAoKSA9PiB7XG4gICAgICAgICAgLy8gICB0aGlzLmNhbGxlZFNvdXJjZSA9IHt9O1xuICAgICAgICAgIC8vICAgaWYoZ3JhcGguZ3JhcGhUeXBlICE9IDIpe1xuICAgICAgICAgIC8vICAgICBsZXQgZ3JhcGhCdWlsZCA9IGF3YWl0IF9zZWxmLmJ1aWxkQ2hhcnQoJ2dyYXBoLScgKyBncmFwaC5ncmFwaF9pZCwgZ3JhcGguZ3JhcGhfc3RydWN0dXJlLCByZXMsIGdyYXBoLmdyYXBobmFtZSwgZ3JhcGguZ3JhcGhUeXBlLCB7XG4gICAgICAgICAgLy8gICAgICAgc3RhcnREYXRlOiB0aGlzLmRhdGVQaXBlLnRyYW5zZm9ybShncmFwaC5ncmFwaF9zdHJ1Y3R1cmUuc3RhcnREYXRlLCd5eXl5LU1NLWRkJyksXG4gICAgICAgICAgLy8gICAgICAgZW5kRGF0ZTogdGhpcy5kYXRlUGlwZS50cmFuc2Zvcm0oZ3JhcGguZ3JhcGhfc3RydWN0dXJlLmVuZERhdGUsJ3l5eXktTU0tZGQnKVxuICAgICAgICAgIC8vICAgICB9LCBncmFwaC5zb3VyY2VpZCk7XG4gICAgICAgICAgLy8gICB9XG4gICAgICAgICAgLy8gICBpZiAoaW5kZXggPT0gX3NlbGYuZGFzaGJvYXJkRGF0YS5ncmFwaHMubGVuZ3RoIC0gMSkge1xuICAgICAgICAgIC8vICAgICBzZXRUaW1lb3V0KCgpID0+IHtcbiAgICAgICAgICAvLyAgICAgICBfc2VsZi5kYXNoYm9hcmRMb2FkZWRDb21wbGV0ZWx5ID0gdHJ1ZTtcbiAgICAgICAgICAvLyAgICAgfSwgNTAwKTtcbiAgICAgICAgICAvLyAgIH1cbiAgICAgICAgICAvLyB9LCAgdGhpcy5saXZlUmVmcmVzaE1pbiAqIDYwICogMTAwMClcbiAgICAgICAgICAvLyB9XG4gICAgICAgIH1cbiAgICAgIH0pO1xuICB9XG4gIGdlbmVyYXRlRGFzaGJvYXJkKGdyYXBoOiBhbnksIHJlQ2FsbDogYm9vbGVhbiA9IGZhbHNlKSB7XG4gICAgcmV0dXJuIG5ldyBQcm9taXNlKChyZXNvbHZlLCByZWplY3QpID0+IHtcbiAgICAgIGlmIChcbiAgICAgICAgdGhpcy5jYWxsZWRTb3VyY2UuaGFzT3duUHJvcGVydHkoZ3JhcGguc291cmNlaWQudG9TdHJpbmcoKSkgJiZcbiAgICAgICAgIXJlQ2FsbFxuICAgICAgKSB7XG4gICAgICAgIHJlc29sdmUodGhpcy5jYWxsZWRTb3VyY2VbZ3JhcGguc291cmNlaWQudG9TdHJpbmcoKV0pO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgbGV0IGV4dHJhRGF0YSA9IHtcbiAgICAgICAgICBzdGFydFRpbWU6ICh0aGlzLnN0YXJ0RGF0ZSA/PyB0aGlzLmZyb21EYXRlKSArICcgMDA6MDA6MDAnLFxuICAgICAgICAgIGVuZFRpbWU6ICh0aGlzLmVuZERhdGUgPz8gdGhpcy50b0RhdGUpICsgJyAwMDowMDowMCcsXG4gICAgICAgIH07XG4gICAgICAgIHRoaXMuZGF0YVNlcnZpY2VcbiAgICAgICAgICAuZmV0Y2hEYXRhU291cmNlKFxuICAgICAgICAgICAge1xuICAgICAgICAgICAgICBzb3VyY2VpZDogZ3JhcGguc291cmNlaWQsXG4gICAgICAgICAgICAgIHN0YXJ0VGltZTogZXh0cmFEYXRhLnN0YXJ0VGltZSxcbiAgICAgICAgICAgICAgZW5kVGltZTogZXh0cmFEYXRhLmVuZFRpbWUsXG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgdGhpcy5hZG1pbklkXG4gICAgICAgICAgKVxuICAgICAgICAgIC50aGVuKChyZXM6IGFueSkgPT4ge1xuICAgICAgICAgICAgU3dhbC5oaWRlTG9hZGluZygpO1xuICAgICAgICAgICAgU3dhbC5jbG9zZSgpO1xuICAgICAgICAgICAgbGV0IGtleXMgPSBudWxsO1xuICAgICAgICAgICAgbGV0IGR1bXBEYXRhID0gcmVzO1xuICAgICAgICAgICAgLy8gdGhpcy51bmlxdWVTb3VyY2VEYXRhLnB1c2goZ3JhcGgpO1xuICAgICAgICAgICAgaWYgKFxuICAgICAgICAgICAgICBncmFwaC5kYXRhVHlwZSA9PSAncmVtb3RlLWpzb24nICYmXG4gICAgICAgICAgICAgICF0aGlzLnN5c3RlbUFwaXMuaW5jbHVkZXMoZ3JhcGguc291cmNlaWQudG9TdHJpbmcoKSlcbiAgICAgICAgICAgICkge1xuICAgICAgICAgICAgICByZXMgPSB0aGlzLmRhdGFTZXJ2aWNlLnBhcnNlRGF0YUZvcm1hdChyZXMsIGdyYXBoLmRhdGFGb3JtYXQpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgaWYgKHRoaXMuc3lzdGVtQXBpcy5pbmNsdWRlcyhncmFwaC5zb3VyY2VpZC50b1N0cmluZygpKSkge1xuICAgICAgICAgICAgICB0aGlzLnNob3dIZWFkZXJJbnB1dHMgPSB0cnVlO1xuICAgICAgICAgICAgICBpZiAoZ3JhcGguc291cmNlaWQudG9TdHJpbmcoKSA9PSB0aGlzLm10clNvdXJjZSkge1xuICAgICAgICAgICAgICAgIGR1bXBEYXRhID0gcmVzWzBdLmRhdGE7XG4gICAgICAgICAgICAgICAga2V5cyA9IHJlc1swXS5jb2x1bW5zO1xuICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICB0aGlzLmZpbHRlcnMgPSB0aGlzLmZpbHRlcnMubWFwKChmaWx0ZXI6IGFueSkgPT4ge1xuICAgICAgICAgICAgICBpZiAoZmlsdGVyLnNvdXJjZUlkLnRvU3RyaW5nKCkgPT0gZ3JhcGguc291cmNlaWQudG9TdHJpbmcoKSkge1xuICAgICAgICAgICAgICAgIGZpbHRlci52YWx1ZXMgPSBPYmplY3Qua2V5cyhcbiAgICAgICAgICAgICAgICAgIGxvZGFzaC5ncm91cEJ5KGR1bXBEYXRhLCBmaWx0ZXIuZmllbGROYW1lKVxuICAgICAgICAgICAgICAgICkubWFwKChrZXksIGluZGV4KSA9PiAoe1xuICAgICAgICAgICAgICAgICAgaWQ6IGluZGV4LFxuICAgICAgICAgICAgICAgICAgdGV4dDoga2V5LFxuICAgICAgICAgICAgICAgIH0pKTtcbiAgICAgICAgICAgICAgICBmaWx0ZXIuc2VsVmFsdWVzID0gW107XG4gICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgcmV0dXJuIGZpbHRlcjtcbiAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgaWYgKGR1bXBEYXRhKSB7XG4gICAgICAgICAgICAgIHRoaXMuY2FsbGVkU291cmNlW2dyYXBoLnNvdXJjZWlkLnRvU3RyaW5nKCldID0gZHVtcERhdGE7XG4gICAgICAgICAgICAgIHRoaXMuY2FsbGVkU291cmNlS2V5c1tncmFwaC5zb3VyY2VpZC50b1N0cmluZygpXSA9IGtleXM7XG4gICAgICAgICAgICAgIHJlc29sdmUoZHVtcERhdGEpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgIH0pXG4gICAgICAgICAgLmNhdGNoKChlcnIpID0+IHtcbiAgICAgICAgICAgIFN3YWwuaGlkZUxvYWRpbmcoKTtcbiAgICAgICAgICAgIFN3YWwuY2xvc2UoKTtcbiAgICAgICAgICAgIHRoaXMudG9hc3RTZXJ2aWNlLmVycm9yKCdVbmFibGUgdG8gRmV0Y2ggRGF0YScpO1xuICAgICAgICAgIH0pO1xuICAgICAgfVxuICAgIH0pO1xuICB9XG4gIFxuICBidWlsZENoYXJ0KHdpZGdldERhdGE6IGFueSwgZGF0YTogYW55LCB0ZW1wRGF0YTogYW55KSB7XG4gICAgbGV0IF9zZWxmID0gdGhpcztcbiAgICByZXR1cm4gbmV3IFByb21pc2UoYXN5bmMgKHJlc29sdmUsIHJlamVjdCkgPT4ge1xuICAgICAgbGV0IGV4aXN0SW5kZXggPSBfc2VsZi5kYXRhRmlsZUluZGV4LmZpbmRJbmRleChcbiAgICAgICAgKGRhdGE6IGFueSkgPT4gZGF0YS5jaGFydElkID09ICdncmFwaC0nICsgd2lkZ2V0RGF0YS5ncmFwaF9pZFxuICAgICAgKTtcbiAgICAgIGxldCBleGlzdFNvdXJjZUluZGV4ID0gX3NlbGYuZGF0YUZpbGVJbmRleC5maW5kSW5kZXgoKGRhdGE6IGFueSkgPT4gZGF0YS5zb3VyY2VJZCA9PSB3aWRnZXREYXRhLnNvdXJjZWlkLnRvU3RyaW5nKCkpO1xuICAgICAgaWYgKGV4aXN0SW5kZXggPT0gLTEpIHtcbiAgICAgICAgX3NlbGYuZGF0YUZpbGUucHVzaCh7XG4gICAgICAgICAgY2hhcnRJZDogJ2dyYXBoLScgKyB3aWRnZXREYXRhLmdyYXBoX2lkLFxuICAgICAgICAgIHNvdXJjZUlkOiB3aWRnZXREYXRhLnNvdXJjZWlkLnRvU3RyaW5nKCksXG4gICAgICAgICAgZGF0YTogZXhpc3RTb3VyY2VJbmRleCAhPSAtMSA/IGV4aXN0U291cmNlSW5kZXggOiBkYXRhLFxuICAgICAgICAgIGNvbHVtbnM6IHRoaXMuY2FsbGVkU291cmNlS2V5c1t3aWRnZXREYXRhLnNvdXJjZWlkLnRvU3RyaW5nKCldLFxuICAgICAgICB9KTtcbiAgICAgICAgX3NlbGYuZGF0YUZpbGVJbmRleC5wdXNoKHtcbiAgICAgICAgICBjaGFydElkOiAnZ3JhcGgtJyArIHdpZGdldERhdGEuZ3JhcGhfaWQsXG4gICAgICAgICAgc291cmNlSWQ6IHdpZGdldERhdGEuc291cmNlaWQudG9TdHJpbmcoKSxcbiAgICAgICAgfSlcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIF9zZWxmLmRhdGFGaWxlW2V4aXN0SW5kZXhdID0ge1xuICAgICAgICAgIC4uLl9zZWxmLmRhdGFGaWxlW2V4aXN0SW5kZXhdLFxuICAgICAgICAgIGRhdGE6IGV4aXN0U291cmNlSW5kZXggIT0gLTEgPyBleGlzdFNvdXJjZUluZGV4IDogZGF0YSxcbiAgICAgICAgfTtcbiAgICAgIH1cbiAgICAgIGRhdGEgPSB0aGlzLmZpbHRlckRhdGEoZGF0YSwgd2lkZ2V0RGF0YS5zb3VyY2VpZC50b1N0cmluZygpKTtcbiAgICAgIGlmICh3aWRnZXREYXRhLmdyYXBoVHlwZSA9PSAxKSB7XG4gICAgICAgIGxldCByYW5nZSA9IHtcbiAgICAgICAgICBzdGFydERhdGU6IHRoaXMuZGF0ZVBpcGUudHJhbnNmb3JtKFxuICAgICAgICAgICAgd2lkZ2V0RGF0YS5ncmFwaF9zdHJ1Y3R1cmUuc3RhcnREYXRlLFxuICAgICAgICAgICAgJ3l5eXktTU0tZGQnXG4gICAgICAgICAgKSxcbiAgICAgICAgICBlbmREYXRlOiB0aGlzLmRhdGVQaXBlLnRyYW5zZm9ybShcbiAgICAgICAgICAgIHdpZGdldERhdGEuZ3JhcGhfc3RydWN0dXJlLmVuZERhdGUsXG4gICAgICAgICAgICAneXl5eS1NTS1kZCdcbiAgICAgICAgICApLFxuICAgICAgICB9O1xuICAgICAgICBpZiAodGhpcy5zeXN0ZW1BcGlzLmluY2x1ZGVzKHdpZGdldERhdGEuc291cmNlaWQudG9TdHJpbmcoKSkpIHtcbiAgICAgICAgICByYW5nZSA9IHtcbiAgICAgICAgICAgIHN0YXJ0RGF0ZTogdGhpcy5zdGFydERhdGUgPz8gdGhpcy5mcm9tRGF0ZSxcbiAgICAgICAgICAgIGVuZERhdGU6IHRoaXMuZW5kRGF0ZSA/PyB0aGlzLnRvRGF0ZSxcbiAgICAgICAgICB9O1xuICAgICAgICB9XG4gICAgICAgIGxldCBncmFwaERhdGEgPSB7XG4gICAgICAgICAgZ3JhcGhJZDogJ2dyYXBoLScgKyB3aWRnZXREYXRhLmdyYXBoX2lkLFxuICAgICAgICAgIGdyYXBoVGl0bGU6IHdpZGdldERhdGEuZ3JhcGhuYW1lLFxuICAgICAgICAgIHJvd3M6IHRlbXBEYXRhLnJvd3NbMF0sXG4gICAgICAgICAgY29sdW1uczogdGVtcERhdGEuY29sdW1uc1swXSxcbiAgICAgICAgICBncmFwaFR5cGVzOiB3aWRnZXREYXRhLmdyYXBoX3N0cnVjdHVyZS5jaGFydFR5cGVbMF0sXG4gICAgICAgICAgZ3JhcGhEYXRhOiBkYXRhLFxuICAgICAgICAgIGFnZ3JlZ2F0aW9uRnVuY3Rpb25zOiB0ZW1wRGF0YS5hZ2dyZWdhdGlvbkZ1bmN0aW9uc1swXSxcbiAgICAgICAgICBmaWx0ZXI6IHRlbXBEYXRhLmZpbHRlcixcbiAgICAgICAgICBjb2xvcnM6IHdpZGdldERhdGEuZ3JhcGhfc3RydWN0dXJlLmNvbENvbG91cnNbMF0sXG4gICAgICAgICAgcmFuZ2U6IHJhbmdlLFxuICAgICAgICAgIGRhdGVWYXJpYWJsZTogdGVtcERhdGEuZGF0ZVZhcmlhYmxlLFxuICAgICAgICAgIHJhbmdlRmlsdGVyOiB3aWRnZXREYXRhLmdyYXBoX3N0cnVjdHVyZS5yYW5nZUZpbHRlcixcbiAgICAgICAgICBjb21wYXJpc29uOiB3aWRnZXREYXRhLmdyYXBoX3N0cnVjdHVyZS5jb21wYXJpc29uID8/IFtdLFxuICAgICAgICAgIGN1c3RvbVZhcmlhYmxlOiB0ZW1wRGF0YS5jdXN0b21WYXJpYWJsZSxcbiAgICAgICAgICBkYXRhRm9ybWF0OiB0ZW1wRGF0YS5kYXRhRm9ybWF0ID8/IFtdLFxuICAgICAgICAgIGxhc3RMZXZlbENvbHVtbnM6IHRlbXBEYXRhLmxhc3RMZXZlbENvbHVtbnMgPz8gW10sXG4gICAgICAgIH07XG4gICAgICAgIGxldCByZXNwb25zZSA9IGF3YWl0IF9zZWxmLnhzaWdodHMuYnVpbGQoV2lkZ2V0VHlwZS5UUkVORCwgZ3JhcGhEYXRhKTtcbiAgICAgICAgdGhpcy5jaGVja0Rhc2hib2FyZExvYWRpbmcoKTtcbiAgICAgICAgcmVzb2x2ZShyZXNwb25zZSk7XG4gICAgICB9IGVsc2UgaWYgKHdpZGdldERhdGEuZ3JhcGhUeXBlID09IDMpIHtcbiAgICAgICAgbGV0IHRhYmxlRGF0YSA9IHtcbiAgICAgICAgICByb3dzOiB0ZW1wRGF0YS5yb3dzLFxuICAgICAgICAgIGNvbHVtbjogdGVtcERhdGEuY29sdW1ucyxcbiAgICAgICAgICBhZ2dyZWdhdGlvbkZ1bmN0aW9uOiB0ZW1wRGF0YS5hZ2dyZWdhdGlvbkZ1bmN0aW9ucyxcbiAgICAgICAgICBmaWx0ZXI6IHRlbXBEYXRhLmZpbHRlcixcbiAgICAgICAgICBkZXJpdmVkVmFyaWFibGVzOiB0ZW1wRGF0YS5jdXN0b21WYXJpYWJsZSxcbiAgICAgICAgICBkYXRhRm9ybWF0OiB0ZW1wRGF0YS5kYXRhRm9ybWF0ID8/IFtdLFxuICAgICAgICAgIGRhdGE6IGRhdGEsXG4gICAgICAgICAgY2F0ZWdvcmllczogd2lkZ2V0RGF0YS5ncmFwaF9zdHJ1Y3R1cmUuY2hhcnRUeXBlLFxuICAgICAgICB9O1xuICAgICAgICBfc2VsZi5waXZvdFRhYmxlc1sndGFibGUtJyArIHdpZGdldERhdGEuZ3JhcGhfaWRdID1cbiAgICAgICAgICBhd2FpdCBfc2VsZi54c2lnaHRzLmJ1aWxkKFdpZGdldFR5cGUuUElWT1RfVEFCTEUsIHRhYmxlRGF0YSk7XG4gICAgICAgIHNldFRpbWVvdXQoKCkgPT4ge1xuICAgICAgICAgIF9zZWxmLmNoZWNrRGFzaGJvYXJkTG9hZGluZygpO1xuICAgICAgICB9LCA1MDApO1xuICAgICAgICByZXNvbHZlKHRydWUpO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgbGV0IGdyYXBoZGF0YSA9IHtcbiAgICAgICAgICBncmFwaElkOiAnZ3JhcGgtJyArIHdpZGdldERhdGEuZ3JhcGhfaWQsXG4gICAgICAgICAgZ3JhcGhUaXRsZTogd2lkZ2V0RGF0YS5ncmFwaG5hbWUsXG4gICAgICAgICAgcm93czogdGVtcERhdGEucm93cyxcbiAgICAgICAgICBjb2x1bW5zOiB0ZW1wRGF0YS5jb2x1bW5zLFxuICAgICAgICAgIGFnZ3JlZ2F0aW9uRnVuY3Rpb25zOiB0ZW1wRGF0YS5hZ2dyZWdhdGlvbkZ1bmN0aW9ucyxcbiAgICAgICAgICBmaWx0ZXI6IHRlbXBEYXRhLmZpbHRlcixcbiAgICAgICAgICBjdXN0b21WYXJpYWJsZTogdGVtcERhdGEuY3VzdG9tVmFyaWFibGUsXG4gICAgICAgICAgZGF0YUZvcm1hdDogdGVtcERhdGEuZGF0YUZvcm1hdCA/PyBbXSxcbiAgICAgICAgICBsYXN0TGV2ZWxDb2x1bW5zOiB0ZW1wRGF0YS5sYXN0TGV2ZWxDb2x1bW5zID8/IFtdLFxuICAgICAgICAgIGdyYXBoVHlwZXM6IHdpZGdldERhdGEuZ3JhcGhfc3RydWN0dXJlLmNoYXJ0VHlwZSxcbiAgICAgICAgICBncmFwaERhdGE6IGRhdGEsXG4gICAgICAgICAgY29sb3JzOiB3aWRnZXREYXRhLmdyYXBoX3N0cnVjdHVyZS5jb2xDb2xvdXJzLFxuICAgICAgICB9O1xuICAgICAgICBsZXQgcmVzcG9uc2UgPSBhd2FpdCB0aGlzLnhzaWdodHMuYnVpbGQoV2lkZ2V0VHlwZS5HUkFQSCwgZ3JhcGhkYXRhKTtcbiAgICAgICAgdGhpcy5jaGVja0Rhc2hib2FyZExvYWRpbmcoKTtcbiAgICAgICAgcmVzb2x2ZShyZXNwb25zZSk7XG4gICAgICB9XG4gICAgfSk7XG4gIH1cbiAgZmlsdGVyRGF0YShkYXRhOiBhbnksIHNvdXJjZUlkOiBhbnkpIHtcbiAgICBsZXQgZmlsdGVyVG9BcHBseSA9IHRoaXMuZmlsdGVycy5maWx0ZXIoXG4gICAgICAoZmlsdGVyOiBhbnkpID0+IGZpbHRlci5zb3VyY2VJZC50b1N0cmluZygpID09IHNvdXJjZUlkLnRvU3RyaW5nKClcbiAgICApO1xuICAgIGZpbHRlclRvQXBwbHkuZm9yRWFjaCgoZmlsdGVyOiBhbnkpID0+IHtcbiAgICAgIGlmIChmaWx0ZXIuc2VsVmFsdWVzLmxlbmd0aCkge1xuICAgICAgICBsZXQgdmFsaWRWYWx1ZXMgPSBmaWx0ZXIuc2VsVmFsdWVzLm1hcCgodmFsdWU6IGFueSkgPT4gdmFsdWUudGV4dCk7XG4gICAgICAgIGxldCB0ZW1wOiBhbnkgPSBbXTtcbiAgICAgICAgbGV0IGdyb3VwRGF0YSA9IGxvZGFzaC5ncm91cEJ5KGRhdGEsIGZpbHRlci5maWVsZE5hbWUpO1xuICAgICAgICBsZXQgYWxsS2V5cyA9IE9iamVjdC5rZXlzKGdyb3VwRGF0YSk7XG4gICAgICAgIGFsbEtleXMuZm9yRWFjaCgoa2V5KSA9PiB7XG4gICAgICAgICAgaWYgKHZhbGlkVmFsdWVzLmluY2x1ZGVzKGtleSkpIHtcbiAgICAgICAgICAgIHRlbXAucHVzaCguLi5ncm91cERhdGFba2V5XSk7XG4gICAgICAgICAgfVxuICAgICAgICB9KTtcbiAgICAgICAgZGF0YSA9IHRlbXA7XG4gICAgICB9XG4gICAgfSk7XG4gICAgcmV0dXJuIGRhdGE7XG4gIH1cbiAgY2hlY2tEYXNoYm9hcmRMb2FkaW5nKCkge1xuICAgIGNvbnN0IGVsZW1lbnRzID0gZG9jdW1lbnQucXVlcnlTZWxlY3RvckFsbCgnLmxkcy1lbGxpcHNpcycpO1xuICAgIGlmIChlbGVtZW50cy5sZW5ndGggPT0gMCkge1xuICAgICAgdGhpcy5pc0Rhc2hib2FyZExvYWRlZC5lbWl0KHtcbiAgICAgICAgaXNMb2FkZWQ6IHRydWUsXG4gICAgICAgIGhhc1N5c3RlbUFwaTogdGhpcy5zaG93SGVhZGVySW5wdXRzLFxuICAgICAgICBkYXRhRmlsZTogdGhpcy5kYXRhRmlsZSxcbiAgICAgIH0pO1xuICAgIH1cbiAgfVxuICBzZXRHcmFwaE9yZGVyKGE6IGFueSwgYjogYW55KSB7XG4gICAgaWYgKGEub3JkZXIgPCBiLm9yZGVyKSB7XG4gICAgICByZXR1cm4gLTE7XG4gICAgfVxuICAgIGlmIChhLm9yZGVyID4gYi5vcmRlcikge1xuICAgICAgcmV0dXJuIDE7XG4gICAgfVxuICAgIHJldHVybiAwO1xuICB9XG4gIGFzeW5jIGZpbHRlcmVkRGFzaGJvYXJkKCkge1xuICAgIGZvciAobGV0IGluZGV4ID0gMDsgaW5kZXggPCB0aGlzLmRhc2hib2FyZERhdGEuZ3JhcGhzLmxlbmd0aDsgaW5kZXgrKykge1xuICAgICAgY29uc3QgZ3JhcGggPSB0aGlzLmRhc2hib2FyZERhdGEuZ3JhcGhzW2luZGV4XTtcbiAgICAgIGxldCByZXMgPSBudWxsO1xuICAgICAgaWYgKGdyYXBoLmdyYXBoVHlwZSAhPSAyKSB7XG4gICAgICAgIHJlcyA9IGF3YWl0IHRoaXMuZ2VuZXJhdGVEYXNoYm9hcmQoZ3JhcGgpO1xuICAgICAgICBsZXQgdGVtcEdyYXBoRGF0YSA9IHtcbiAgICAgICAgICByb3dzOiBncmFwaC5ncmFwaF9zdHJ1Y3R1cmUueEF4aXMsXG4gICAgICAgICAgY29sdW1uczogZ3JhcGguZ3JhcGhfc3RydWN0dXJlLnlBeGlzLFxuICAgICAgICAgIGFnZ3JlZ2F0aW9uRnVuY3Rpb25zOiBncmFwaC5ncmFwaF9zdHJ1Y3R1cmUuYWdncmVhZ2F0aW9ucyxcbiAgICAgICAgICBmaWx0ZXI6IGdyYXBoLmdyYXBoX3N0cnVjdHVyZS5maWx0ZXIsXG4gICAgICAgICAgY3VzdG9tVmFyaWFibGU6IGdyYXBoLmdyYXBoX3N0cnVjdHVyZS5kZXJpdmVkVmFyaWFibGVzLFxuICAgICAgICAgIGRhdGFGb3JtYXQ6IFtdLFxuICAgICAgICAgIGNvbFRvU2hvdzogbnVsbCxcbiAgICAgICAgICBsYXN0TGV2ZWxDb2x1bW5zOiBncmFwaC5ncmFwaF9zdHJ1Y3R1cmUubGFzdExldmVsRGF0YSA/PyBbXSxcbiAgICAgICAgICBkYXRlVmFyaWFibGU6IGdyYXBoLmdyYXBoX3N0cnVjdHVyZS5kYXRlVmFyaWFibGUsXG4gICAgICAgICAgY2hhcnRUeXBlOiBncmFwaC5ncmFwaF9zdHJ1Y3R1cmUuY2hhcnRUeXBlLFxuICAgICAgICB9O1xuICAgICAgICBpZiAoZ3JhcGguc291cmNlaWQudG9TdHJpbmcoKSA9PSB0aGlzLm10clNvdXJjZSkge1xuICAgICAgICAgIHRlbXBHcmFwaERhdGEgPSB0aGlzLmRhdGFTZXJ2aWNlLmtleUNvbnZlcnRlcihcbiAgICAgICAgICAgIHRlbXBHcmFwaERhdGEsXG4gICAgICAgICAgICB0aGlzLmNhbGxlZFNvdXJjZUtleXNbZ3JhcGguc291cmNlaWQudG9TdHJpbmcoKV0sXG4gICAgICAgICAgICAxXG4gICAgICAgICAgKTtcbiAgICAgICAgfVxuICAgICAgICB0aGlzLmJ1aWxkQ2hhcnQoZ3JhcGgsIHJlcywgdGVtcEdyYXBoRGF0YSk7XG4gICAgICB9XG4gICAgfVxuICB9XG4gIGNyZWF0ZUpTT05GaWxlT2ZEYXRhKGRhdGE6IGFueSkge1xuICAvLyBjb25zb2xlLmxvZygnZGF0YTogJywgZGF0YSk7XG4gICAgY29uc3QgYmxvYiA9IG5ldyBCbG9iKFtKU09OLnN0cmluZ2lmeShkYXRhKV0sIHtcbiAgICAgIHR5cGU6ICdhcHBsaWNhdGlvbi9qc29uJyxcbiAgICB9KTtcbiAgICByZXR1cm4gbmV3IEZpbGUoW2Jsb2JdLCAnZGF0YS5qc29uJyk7XG4gICAgLy8gcmV0dXJuIG5ldyBQcm9taXNlKChyZXNvbHZlLCByZWplY3QpID0+IHtcbiAgICAvLyAgIGNvbnN0IG91dHB1dFN0cmVhbSA9IGZzLmNyZWF0ZVdyaXRlU3RyZWFtKCdkYXRhLmpzb24nKTtcbiAgICAvLyAgIGNvbnN0IGpzb25Xcml0ZXIgOiBhbnkgPSBKU09OU3RyZWFtLnN0cmluZ2lmeSgpO1xuXG4gICAgLy8gICBqc29uV3JpdGVyLnBpcGUob3V0cHV0U3RyZWFtKTtcblxuICAgIC8vICAgZm9yIChjb25zdCBpdGVtIG9mIGRhdGEpIHtcbiAgICAvLyAgICAganNvbldyaXRlci53cml0ZShpdGVtKTtcbiAgICAvLyAgIH1cblxuICAgIC8vICAganNvbldyaXRlci5lbmQoKTtcblxuICAgIC8vICAgb3V0cHV0U3RyZWFtLm9uKCdmaW5pc2gnLCAoKSA9PiB7XG4gICAgLy8gICAgIGNvbnN0IGZpbGUgPSBmcy5yZWFkRmlsZVN5bmMoJ2RhdGEuanNvbicpO1xuICAgIC8vICAgICByZXNvbHZlKGZpbGUpO1xuICAgIC8vICAgfSk7XG4gICAgLy8gfSlcbiAgfVxufVxuIiwiPGRpdiBjbGFzcz1cInJvd1wiICpuZ0lmPVwiZGFzaGJvYXJkRGF0YSAhPSBudWxsXCI+XG4gICAgPGRpdiBjbGFzcz1cImNvbC1tZC0xMlwiPlxuICAgICAgICA8ZGl2IGNsYXNzPVwiZGFzaF9ncmFwaF9zZWNcIj5cbiAgICAgICAgICAgIDxkaXYgY2xhc3M9XCJkYXNoX2dyYXBoXCI+XG4gICAgICAgICAgICAgICAgPGRpdiBzdHlsZT1cImRpc3BsYXk6IGZsZXg7IGJhY2tncm91bmQtY29sb3I6IzAwMDtcIiAqbmdJZj1cInNob3dIZWFkZXJcIj5cbiAgICAgICAgICAgICAgICAgICAgPGgzIGNsYXNzPVwiZ3JhcGhfbmFtZVwiIHN0eWxlPVwiaGVpZ2h0OiA0NHB4O2ZsZXg6YXV0bzt0ZXh0LXRyYW5zZm9ybTpjYXBpdGFsaXplO1wiPlxuICAgICAgICAgICAgICAgICAgICAgICAge3tkYXNoYm9hcmREYXRhLmRhc2hib2FyZF9uYW1lfX0gJm5ic3A7IDxzcGFuIGNsYXNzPVwiYmFkZ2UgYmFkZ2Utd2FybmluZ1wiXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgKm5nSWY9XCJkYXNoYm9hcmREYXRhLmRhc2hib2FyZF90eXBlID09IDFcIj5MSVZFPC9zcGFuPiA8L2gzPlxuICAgICAgICAgICAgICAgICAgICA8ZGl2IGNsYXNzPVwicm93IGRhdGUtY29udGFpbmVyXCIgKm5nSWY9XCJzaG93SGVhZGVySW5wdXRzXCI+XG4gICAgICAgICAgICAgICAgICAgICAgICA8ZGl2IGNsYXNzPVwiY29sLWxnLTVcIj4gPGxhYmVsIGZvcj1cInN0YXJ0RGF0ZVwiPkZyb20gJm5ic3A7Jm5ic3A7PC9sYWJlbD4gPGlucHV0IHR5cGU9XCJkYXRlXCJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgWyhuZ01vZGVsKV09XCJmcm9tRGF0ZVwiIGlkPVwic3RhcnREYXRlXCIgY2xhc3M9XCJmb3JtLWNvbnRyb2xcIj4gPC9kaXY+XG4gICAgICAgICAgICAgICAgICAgICAgICA8ZGl2IGNsYXNzPVwiY29sLWxnLTVcIj5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICA8bGFiZWwgZm9yPVwiZW5kRGF0ZVwiPlRvICZuYnNwOyZuYnNwOzwvbGFiZWw+IDxpbnB1dCB0eXBlPVwiZGF0ZVwiIFsobmdNb2RlbCldPVwidG9EYXRlXCJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgaWQ9XCJlbmREYXRlXCIgY2xhc3M9XCJmb3JtLWNvbnRyb2xcIj5cbiAgICAgICAgICAgICAgICAgICAgICAgIDwvZGl2PlxuICAgICAgICAgICAgICAgICAgICAgICAgPGRpdiBjbGFzcz1cImNvbC1sZy0yXCI+XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgPGkgY2xhc3M9XCJmYSBmYS1zZWFyY2hcIiAoY2xpY2spPVwicmVmcmVzaFN5c3RlbUFwaXMoKVwiPjwvaT5cbiAgICAgICAgICAgICAgICAgICAgICAgIDwvZGl2PlxuICAgICAgICAgICAgICAgICAgICA8L2Rpdj5cbiAgICAgICAgICAgICAgICA8L2Rpdj5cbiAgICAgICAgICAgICAgICA8ZGl2IGNsYXNzPVwiZmlsdGVyLWNvbnRhaW5lclwiICpuZ0lmPVwiZmlsdGVycy5sZW5ndGhcIj5cbiAgICAgICAgICAgICAgICAgICAgPGgzPkZpbHRlcnM6PC9oMz5cbiAgICAgICAgICAgICAgICAgICAgPGRpdiBjbGFzcz1cImNvbC1sZy0xMiByb3dcIj5cbiAgICAgICAgICAgICAgICAgICAgICAgIDxkaXYgY2xhc3M9XCJjb2wtbGctM1wiICpuZ0Zvcj1cImxldCBmaWx0ZXIgb2YgZmlsdGVycztsZXQgaSA9IGluZGV4XCI+IDxuZy1tdWx0aXNlbGVjdC1kcm9wZG93blxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBbcGxhY2Vob2xkZXJdPVwiJ1NlbGVjdCAnICsgZmlsdGVyLmZpZWxkTmFtZSArICcuLi4nXCIgWyhuZ01vZGVsKV09XCJmaWx0ZXIuc2VsVmFsdWVzXCJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgKG9uU2VsZWN0KT1cImZpbHRlcmVkRGFzaGJvYXJkKClcIiAob25EZVNlbGVjdCk9XCJmaWx0ZXJlZERhc2hib2FyZCgpXCJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgW3NldHRpbmdzXT1cImRyb3Bkb3duU2V0dGluZ3NcIiBbZGF0YV09XCJmaWx0ZXIudmFsdWVzXCI+IDwvbmctbXVsdGlzZWxlY3QtZHJvcGRvd24+IDwvZGl2PlxuICAgICAgICAgICAgICAgICAgICA8L2Rpdj5cbiAgICAgICAgICAgICAgICA8L2Rpdj5cbiAgICAgICAgICAgICAgICA8ZGl2IGNsYXNzPVwicm93IGdyYXBoX2Rlc2lnblwiIGlkPVwiZGFzaGJvYXJkU2NyZWVuXCIgI2Rhc2hib2FyZFNjcmVlbj5cbiAgICAgICAgICAgICAgICAgICAgPG5nLWNvbnRhaW5lciAqbmdGb3I9XCJsZXQgZ3JhcGggb2YgZGFzaGJvYXJkRGF0YS5ncmFwaHM7XCI+XG5cbiAgICAgICAgICAgICAgICAgICAgICAgIDxuZy1jb250YWluZXIgKm5nSWY9XCJncmFwaC5ncmFwaFR5cGUgIT0gMyAmJiBncmFwaC5ncmFwaFR5cGUgIT0gMlwiPlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIDxkaXYgY2xhc3M9XCJkYXNoYm9hcmQtZ3JhcGhcIlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBbbmdDbGFzc109XCJ7J2NvbC1sZy0xMic6IGdyYXBoLmdyYXBoX2luZGV4ID09IDEsJ2NvbC1sZy02JzogZ3JhcGguZ3JhcGhfaW5kZXggPT0gMiwnY29sLWxnLTQnOiBncmFwaC5ncmFwaF9pbmRleCA9PSAzLCdjb2wtbGctMyc6IGdyYXBoLmdyYXBoX2luZGV4ID09IDR9XCJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgc3R5bGU9XCJtaW4taGVpZ2h0OiAzNzBweDsgcGFkZGluZzogMHB4O1wiPiA8IS0tIGxvYWRlciBzdGFydCAtLT5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgPGgzICpuZ0lmPVwiZ3JhcGguZ3JhcGhfc3RydWN0dXJlLnhBeGlzWzBdICE9ICcqKipMQUJFTCoqKidcIiBzdHlsZT1cInRleHQtYWxpZ246IGNlbnRlcjsgYmFja2dyb3VuZC1jb2xvcjogI2VlZTsgcGFkZGluZzogMnB4O1wiPnt7Z3JhcGguZ3JhcGhuYW1lfX08L2gzPlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA8ZGl2IFtpZF09XCInZ3JhcGgtJysgZ3JhcGguZ3JhcGhfaWRcIiBzdHlsZT1cInBvc2l0aW9uOiByZWxhdGl2ZTsgcGFkZGluZzogMTBweDsgcGFkZGluZy10b3A6IDQ1cHg7XCI+XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA8ZGl2IGNsYXNzPVwibGRzLWVsbGlwc2lzXCI+XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgPGRpdj48L2Rpdj5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA8ZGl2PjwvZGl2PlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIDxkaXY+PC9kaXY+XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgPGRpdj48L2Rpdj5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIDwvZGl2PiA8IS0tIGxvYWRlciBlbmQgLS0+XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIDwvZGl2PlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIDwvZGl2PlxuICAgICAgICAgICAgICAgICAgICAgICAgPC9uZy1jb250YWluZXI+XG4gICAgICAgICAgICAgICAgICAgICAgICA8ZGl2ICpuZ0lmPVwiZ3JhcGguZ3JhcGhUeXBlID09IDJcIiBjbGFzcz1cImRhc2hib2FyZC1ncmFwaFwiIFtpZF09XCIndGFibGUtZ3JhcGgtJysgZ3JhcGguZ3JhcGhfaWRcIlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIFtuZ0NsYXNzXT1cInsnY29sLWxnLTEyJzogZ3JhcGguZ3JhcGhfaW5kZXggPT0gMSwnY29sLWxnLTYnOiBncmFwaC5ncmFwaF9pbmRleCA9PSAyLCdjb2wtbGctNCc6IGdyYXBoLmdyYXBoX2luZGV4ID09IDMsJ2NvbC1sZy0zJzogZ3JhcGguZ3JhcGhfaW5kZXggPT0gNH1cIlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHN0eWxlPVwiZGlzcGxheTogZmxleDsgZmxleC1kaXJlY3Rpb246IGNvbHVtbjsgYm9yZGVyLWJvdHRvbTogMHB4OyBiYWNrZ3JvdW5kLWNvbG9yOmFudGlxdWV3aGl0ZTtcIj5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICA8IS0tIGxvYWRlciBzdGFydCAtLT5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICA8aDIgc3R5bGU9XCJ0ZXh0LWFsaWduOiBjZW50ZXI7IG1hcmdpbi1ib3R0b206IDBweDtcIj57e2dyYXBoLmdyYXBobmFtZX19PC9oMj5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICA8IS0tIGxvYWRlciBlbmQgLS0+XG4gICAgICAgICAgICAgICAgICAgICAgICA8L2Rpdj5cbiAgICAgICAgICAgICAgICAgICAgICAgIDxkaXYgKm5nSWY9XCJncmFwaC5ncmFwaFR5cGUgPT0gM1wiIGNsYXNzPVwiZGFzaGJvYXJkLWdyYXBoXCIgW2lkXT1cIid0YWJsZS0nKyBncmFwaC5ncmFwaF9pZFwiXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgW25nQ2xhc3NdPVwieydjb2wtbGctMTInOiBncmFwaC5ncmFwaF9pbmRleCA9PSAxLCdjb2wtbGctNic6IGdyYXBoLmdyYXBoX2luZGV4ID09IDIsJ2NvbC1sZy00JzogZ3JhcGguZ3JhcGhfaW5kZXggPT0gMywnY29sLWxnLTMnOiBncmFwaC5ncmFwaF9pbmRleCA9PSA0fVwiXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgc3R5bGU9XCJtaW4taGVpZ2h0OiAzMDBweDsgZGlzcGxheTogZmxleDsgZmxleC1kaXJlY3Rpb246IGNvbHVtbjsgcGFkZGluZy1ib3R0b206IDIlO1wiPlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIDwhLS0gbG9hZGVyIHN0YXJ0IC0tPlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIDxoMyBzdHlsZT1cInRleHQtYWxpZ246IGNlbnRlcjtcIj57e2dyYXBoLmdyYXBobmFtZX19PC9oMz5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICA8bmctY29udGFpbmVyICpuZ0lmPVwicGl2b3RUYWJsZXMuaGFzT3duUHJvcGVydHkoJ3RhYmxlLScgKyBncmFwaC5ncmFwaF9pZClcIj4gPGR4LXBpdm90LWdyaWRcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIFthbGxvd1NvcnRpbmdCeVN1bW1hcnldPVwidHJ1ZVwiIFthbGxvd1NvcnRpbmddPVwidHJ1ZVwiIFthbGxvd0ZpbHRlcmluZ109XCJ0cnVlXCJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIFtzaG93Qm9yZGVyc109XCJ0cnVlXCIgW2RhdGFTb3VyY2VdPVwicGl2b3RUYWJsZXNbJ3RhYmxlLScgKyBncmFwaC5ncmFwaF9pZF1cIj5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIDxkeG8tZmllbGQtY2hvb3NlciBbZW5hYmxlZF09XCJmYWxzZVwiPjwvZHhvLWZpZWxkLWNob29zZXI+IDwvZHgtcGl2b3QtZ3JpZD5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICA8L25nLWNvbnRhaW5lcj4gPG5nLWNvbnRhaW5lciAqbmdJZj1cInBpdm90VGFibGVzWyd0YWJsZS0nICsgZ3JhcGguZ3JhcGhfaWRdID09IHVuZGVmaW5lZFwiPlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA8ZGl2IGNsYXNzPVwibGRzLWVsbGlwc2lzXCI+XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA8ZGl2PjwvZGl2PlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgPGRpdj48L2Rpdj5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIDxkaXY+PC9kaXY+XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA8ZGl2PjwvZGl2PlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA8L2Rpdj5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICA8L25nLWNvbnRhaW5lcj4gPCEtLSBsb2FkZXIgZW5kIC0tPlxuICAgICAgICAgICAgICAgICAgICAgICAgPC9kaXY+XG4gICAgICAgICAgICAgICAgICAgIDwvbmctY29udGFpbmVyPlxuICAgICAgICAgICAgICAgIDwvZGl2PlxuICAgICAgICAgICAgPC9kaXY+XG4gICAgICAgIDwvZGl2PlxuICAgIDwvZGl2PlxuPC9kaXY+Il19