import * as i0 from '@angular/core';
import { Injectable, Component, ViewEncapsulation, EventEmitter, Input, Output, NgModule } from '@angular/core';
import * as Highcharts from 'highcharts';
import Drilldown from 'highcharts/modules/drilldown';
import * as lodash from 'lodash';
import HC_exporting from 'highcharts/modules/exporting';
import offlineExporting from 'highcharts/modules/offline-exporting';
import accessibility from 'highcharts/modules/accessibility';
import highStocks from 'highcharts/modules/stock';
import { BigNumber } from 'bignumber.js';
import PivotGridDataSource from 'devextreme/ui/pivot_grid/data_source';
import * as FileSave from 'file-saver';
import * as i1$1 from '@ng-bootstrap/ng-bootstrap';
import { NgbModalModule, NgbModule, NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import * as moment from 'moment';
import * as i1 from '@angular/common/http';
import { HttpEventType, HttpClientModule } from '@angular/common/http';
import * as i3 from 'primeng/table';
import { TableModule } from 'primeng/table';
import * as i4 from 'primeng/api';
import * as i4$1 from '@angular/common';
import { CommonModule, DatePipe } from '@angular/common';
import * as i9 from '@angular/forms';
import { FormsModule } from '@angular/forms';
import { BrowserModule } from '@angular/platform-browser';
import * as i6 from 'devextreme-angular';
import { DxPivotGridModule } from 'devextreme-angular';
import * as i2 from 'ngx-toastr';
import { ToastrModule } from 'ngx-toastr';
import { ChartsModule } from 'ng2-charts';
import { AngularPivotTableModule } from 'angular-pivot-table';
import { HighchartsChartModule } from 'highcharts-angular';
import { NgSelect2Module } from 'ng-select2';
import * as i5 from 'ng-multiselect-dropdown';
import { NgMultiSelectDropDownModule } from 'ng-multiselect-dropdown';
import * as i7 from 'devextreme-angular/ui/nested';
import Swal from 'sweetalert2';

var GraphTypes;
(function (GraphTypes) {
    GraphTypes["BAR"] = "bar";
    GraphTypes["LINE"] = "line";
    GraphTypes["AREA"] = "area";
    GraphTypes["COLUMN"] = "column";
    GraphTypes["PIE"] = "pie";
    GraphTypes["STACKED_COLUMN"] = "stacked-column";
    GraphTypes["STACKED_COLUMN_PERCENTAGE"] = "stacked-column%";
    GraphTypes["STACKED_BAR"] = "stacked-bar";
    GraphTypes["STACKED_BAR_PERCENTAGE"] = "stacked-bar%";
    GraphTypes["SCATTER"] = "scatter";
    GraphTypes["SPLINE"] = "spline";
})(GraphTypes || (GraphTypes = {}));

var RangeFilter;
(function (RangeFilter) {
    RangeFilter["YEARLY"] = "Yearly";
    RangeFilter["QUARTERLY"] = "Quatarly";
    RangeFilter["MONTHLY"] = "Monthly";
    RangeFilter["WEEKLY"] = "Weekly";
    RangeFilter["DAILY"] = "Daily";
})(RangeFilter || (RangeFilter = {}));

var FilterTypes;
(function (FilterTypes) {
    FilterTypes["BEFORE"] = "BEFORE";
    FilterTypes["AFTER"] = "AFTER";
    FilterTypes["IN"] = "IN";
    FilterTypes["BETWEEN"] = "<>";
    FilterTypes["LESS_THAN"] = "<";
    FilterTypes["LESS_THAN_EQUAL"] = "<=";
    FilterTypes["GREATER_THAN"] = ">";
    FilterTypes["GREATER_THAN_EQUAL"] = ">=";
    FilterTypes["EQUAL"] = "==";
    FilterTypes["NOT_EQUAL"] = "!=";
    FilterTypes["BETWEEN_RANGE"] = "bet";
    FilterTypes["NOT_IN"] = "NOT IN";
})(FilterTypes || (FilterTypes = {}));
var CustomFilterTypes;
(function (CustomFilterTypes) {
    CustomFilterTypes["SINGLE_EQUATION"] = "Single Equation";
    CustomFilterTypes["A_OR_B"] = "A or B";
    CustomFilterTypes["A_AND_B"] = "A and B";
    CustomFilterTypes["A_OR_B_OR_C"] = "A or B or C";
    CustomFilterTypes["A_AND_B_AND_C"] = "A and B and C";
    CustomFilterTypes["A_OR_B_AND_C"] = "A or ( B and C )";
    CustomFilterTypes["A_AND_B_OR_C"] = "A and ( B or C )";
})(CustomFilterTypes || (CustomFilterTypes = {}));

var DataType;
(function (DataType) {
    DataType["STRING"] = "string";
    DataType["NUMBER"] = "number";
    DataType["DATE"] = "date";
    DataType["TIME"] = "time";
})(DataType || (DataType = {}));
var DateFormat;
(function (DateFormat) {
    DateFormat["DD_MM_YYYY_hh_mm_ss_a"] = "DD-MM-YYYY hh:mm:ss a";
    DateFormat["DD_MM_YYYY_HH_mm_ss"] = "DD-MM-YYYY HH:mm:ss";
    DateFormat["MM_DD_YYYY_hh_mm_ss_a"] = "MM-DD-YYYY hh:mm:ss a";
    DateFormat["YYYY_MM_DD_hh_mm_ss_a"] = "YYYY-MM-DD hh:mm:ss a";
    DateFormat["DD_s_MM_s_YYYY_hh_mm_ss_a"] = "DD/MM/YYYY hh:mm:ss a";
    DateFormat["MM_s_DD_s_YYYY_hh_mm_ss_a"] = "MM/DD/YYYY hh:mm:ss a";
    DateFormat["YYYY_s_MM_s_DD_hh_mm_ss_a"] = "YYYY/MM/DD hh:mm:ss a";
    DateFormat["DD_MM_YYYY"] = "DD-MM-YYYY";
    DateFormat["MM_DD_YYYY"] = "MM-DD-YYYY";
    DateFormat["YYYY_MM_DD"] = "YYYY-MM-DD";
    DateFormat["DD_s_MM_s_YYYY"] = "DD/MM/YYYY";
    DateFormat["MM_s_DD_s_YYYY"] = "MM/DD/YYYY";
    DateFormat["YYYY_s_MM_s_DD"] = "YYYY/MM/DD";
})(DateFormat || (DateFormat = {}));
var TimeFormat;
(function (TimeFormat) {
    TimeFormat["HH_mm_ss"] = "HH:mm:ss";
    TimeFormat["HH_mm"] = "HH:mm";
    TimeFormat["hh_mm_ss_a"] = "hh:mm:ss a";
    TimeFormat["hh_mm_a"] = "hh:mm a";
})(TimeFormat || (TimeFormat = {}));

var PivotFieldsArea;
(function (PivotFieldsArea) {
    PivotFieldsArea["ROW"] = "row";
    PivotFieldsArea["COLUMN"] = "column";
    PivotFieldsArea["DATA"] = "data";
})(PivotFieldsArea || (PivotFieldsArea = {}));

class DataService {
    constructor(http) {
        this.http = http;
        this.XSIGHT_BASE_URL = 'https://xsight.xswift.biz/x-sight/api/v1/';
        this.DCUTLY_BASE_URL = 'https://dcutly.com/';
        this.MODAL_DATA = {};
        this.entryMode = '1';
        this.authKey = '';
        this.entryMode = localStorage.getItem("xsights_entrymode") ?? "0";
        this.authKey = localStorage.getItem("xsights_authkey") ?? "";
    }
    setHeaders(adminId) {
        return {
            version: '1.0',
            entrymode: this.entryMode,
            apptype: 'dashboard',
            authkey: this.authKey,
            foAdminId: adminId,
            'content-enconding': 'gzip',
        };
    }
    setModalData(modalData) {
        this.MODAL_DATA = modalData;
    }
    getModalData() {
        return this.MODAL_DATA;
    }
    getDashboardById(dashboardId, adminId) {
        return this.http
            .get(this.XSIGHT_BASE_URL +
            'dashboard/get-dashboard-data?dashboard_id=' +
            dashboardId, {
            headers: this.setHeaders(adminId),
        })
            .toPromise();
    }
    getGraphDashBoardById(data, adminId) {
        return this.http
            .post(this.XSIGHT_BASE_URL +
            'dashboard/get-dashboard-graph-data', data, {
            headers: this.setHeaders(adminId),
        })
            .toPromise();
    }
    getGraphDataById(data) {
        return this.http
            .post(this.XSIGHT_BASE_URL +
            'graphs/get-graph-data-by-id', data, {
            headers: this.setHeaders(data.adminId),
        })
            .toPromise();
    }
    getGraphDrilldownById(data) {
        return this.http
            .post(this.XSIGHT_BASE_URL +
            'graphs/get-graph-drilldown-data', data, {
            headers: this.setHeaders(data.adminId),
        })
            .toPromise();
    }
    downloadDrilldownById(data) {
        return this.http
            .post(this.XSIGHT_BASE_URL +
            'graphs/download-drilldown-data', data, {
            reportProgress: true,
            observe: 'events',
            responseType: 'blob',
            headers: this.setHeaders(data.adminId),
        });
    }
    fetchDataSource(params, adminId) {
        return this.http
            .get(this.XSIGHT_BASE_URL +
            'data-source/fetch-data-from-source?sourceId=' +
            params.sourceid +
            '&startTime=' +
            params.startTime +
            '&endTime=' +
            params.endTime, {
            headers: this.setHeaders(adminId),
        })
            .toPromise();
    }
    getGraphById(widgetId, adminId) {
        return this.http
            .get(this.XSIGHT_BASE_URL + 'graphs/get-graph-by-id?graphId=' + widgetId, {
            headers: this.setHeaders(adminId),
        })
            .toPromise();
    }
    createNewFormula(customVariable) {
        if (customVariable.is_filter) {
            customVariable.formula = 'if (';
            for (let i = 0; i < customVariable.filters.length; i++) {
                let value = customVariable.filters[i].isCustomValue
                    ? customVariable.filters[i].values
                    : customVariable.filters[i].aggregationFunction +
                        '("' +
                        customVariable.filters[i].values +
                        '")';
                let conditions = '';
                customVariable.filters[i].conditions.forEach((condition) => {
                    conditions +=
                        (condition.relation == null ? '' : condition.relation) +
                            ' ' +
                            condition.variable.name +
                            ' ' +
                            condition.operator +
                            ' [' +
                            condition.comparativeVariables +
                            '] ';
                });
                customVariable.formula += conditions + ') { ' + value + ' }';
                if (i + 1 != customVariable.filters.length) {
                    customVariable.formula += ' else if ( ';
                }
                if (i == customVariable.filters.length - 1) {
                    customVariable.formula +=
                        ' else { ' + customVariable.defaultValue + ' }';
                }
            }
            if (customVariable.filters.length == 0) {
                customVariable.formula =
                    ' ) {  } else { ' + customVariable.defaultValue + ' }';
            }
        }
        else {
            customVariable.formula = '';
            customVariable.operation.forEach((op) => {
                customVariable.formula += op.value + ' ';
            });
        }
        return customVariable;
    }
    parseDataFormat(data, format) {
        let unMatchData = [];
        let res = lodash.map(data, (d) => {
            Object.entries(d).forEach((value) => {
                let formatIndex = format.findIndex((el) => {
                    return el.name == value[0];
                });
                if (formatIndex == -1) {
                    unMatchData.push(value[0]);
                    d[value[0]] = 0;
                }
                else {
                    let type = format[formatIndex].type;
                    if (type == 'number') {
                        if (this.getVariableData(value[1])[0] != 'number' ||
                            value[1] == null ||
                            value[1] == '') {
                            d[value[0]] = 0;
                        }
                    }
                    else if (type == 'string') {
                        if (this.getVariableData(value[1])[0] != 'string' ||
                            value[1] == null ||
                            value[1] == '') {
                            d[value[0]] = '-';
                        }
                    }
                    else if (type == 'date') {
                        let dateFormat = format[formatIndex].format;
                        d[value[0]] = this.convertDateFormat(value[1], dateFormat);
                    }
                    else if (type == 'time') {
                        let timeFormat = format[formatIndex].format;
                        d[value[0]] = this.convertDateFormat(value[1], timeFormat);
                    }
                }
            });
            return d;
        });
        return res;
    }
    keyConverter(graphData, dataKeys, direction = 1) {
        if (direction === 1) {
            graphData.rows = graphData.rows.map((row) => {
                let dataKey = dataKeys.find((key) => key.col_name == row);
                return dataKey?.col_title ?? row;
            });
            graphData.columns = graphData.columns.map((column) => {
                let dataKey = dataKeys.find((key) => key.col_name == column);
                return dataKey?.col_title ?? column;
            });
            graphData.lastLevelColumns = graphData.lastLevelColumns.map((column) => {
                let dataKey = dataKeys.find((key) => key.col_name == column);
                return dataKey?.col_title ?? column;
            });
            if (graphData.colToShow != null) {
                let dataKey = dataKeys.find((key) => key.col_name == graphData.colToShow);
                graphData.colToShow = dataKey?.col_title ?? graphData.colToShow;
            }
            graphData.aggregationFunctions = graphData.aggregationFunctions.map((func) => {
                let dataKey = dataKeys.find((key) => key.col_name == func.variableName);
                return {
                    ...func,
                    variableName: dataKey?.col_title ?? func.variableName,
                };
            });
            graphData.filter.xAxis = graphData.filter.xAxis.map((f) => {
                let dataKey = dataKeys.find((key) => key.col_name == f.variableName);
                return {
                    ...f,
                    variableName: dataKey?.col_title ?? f.variableName,
                };
            });
            graphData.filter.yAxis = graphData.filter.yAxis.map((f) => {
                let dataKey = dataKeys.find((key) => key.col_name == f.variableName);
                return {
                    ...f,
                    variableName: dataKey?.col_title ?? f.variableName,
                };
            });
            graphData.filter.yPreAxis = graphData.filter.yPreAxis.map((f) => {
                let dataKey = dataKeys.find((key) => key.col_name == f.variableName);
                return {
                    ...f,
                    variableName: dataKey?.col_title ?? f.variableName,
                };
            });
            graphData.filter.customFilter = graphData.filter.customFilter.map((f) => {
                let dataKey1 = dataKeys.find((key) => key.col_name == f.customFiltervar1);
                let dataKey2 = dataKeys.find((key) => key.col_name == f.customFiltervar2);
                let dataKey3 = dataKeys.find((key) => key.col_name == f.customFiltervar3);
                return {
                    ...f,
                    customFiltervar1: dataKey1?.col_title ?? f.customFiltervar1,
                    customFiltervar2: dataKey2?.col_title ?? f.customFiltervar2,
                    customFiltervar3: dataKey3?.col_title ?? f.customFiltervar3,
                };
            });
            graphData.customVariable = graphData.customVariable.map((variable) => {
                if (variable.is_filter || variable.is_slab) {
                    variable.filters = variable.filters.map((f) => {
                        if (!f.isCustomValue) {
                            let dataKey = dataKeys.find((key) => key.col_name == f.values);
                            f.values = dataKey?.col_title ?? f.values;
                        }
                        f.conditions = f.conditions.map((condition) => {
                            let dataKey = dataKeys.find((key) => key.col_name == condition.variable.name);
                            condition.variable.name =
                                dataKey?.col_title ?? condition.variable.name;
                            return condition;
                        });
                        return f;
                    });
                }
                else {
                    variable.operation = variable.operation.map((op) => {
                        if (!op.isCustomValue) {
                            let dataKey = dataKeys.find((key) => key.col_name.split(' ').join('_') == op.value);
                            op.value = dataKey?.col_title ?? op.value;
                        }
                        return op;
                    });
                }
                return this.createNewFormula(variable);
            });
            graphData.dataFormat = graphData.dataFormat.map((format) => {
                let dataKey = dataKeys.find((key) => key.col_name == format.name);
                return {
                    ...format,
                    name: dataKey?.col_title ?? format.name,
                };
            });
        }
        else {
            graphData.rows = graphData.rows.map((row) => {
                let dataKey = dataKeys.find((key) => key.col_title == row);
                return dataKey?.col_name ?? row;
            });
            graphData.columns = graphData.columns.map((column) => {
                let dataKey = dataKeys.find((key) => key.col_title == column);
                return dataKey?.col_name ?? column;
            });
            graphData.lastLevelColumns = graphData.lastLevelColumns.map((column) => {
                let dataKey = dataKeys.find((key) => key.col_title == column);
                return dataKey?.col_name ?? column;
            });
            if (graphData.colToShow != null) {
                let dataKey = dataKeys.find((key) => key.col_title == graphData.colToShow);
                graphData.colToShow = dataKey?.col_name ?? graphData.colToShow;
            }
            graphData.aggregationFunctions = graphData.aggregationFunctions.map((func) => {
                let dataKey = dataKeys.find((key) => key.col_title == func.variableName);
                return {
                    ...func,
                    variableName: dataKey?.col_name ?? func.variableName,
                };
            });
            graphData.filter.xAxis = graphData.filter.xAxis.map((f) => {
                let dataKey = dataKeys.find((key) => key.col_title == f.variableName);
                return {
                    ...f,
                    variableName: dataKey?.col_name ?? f.variableName,
                };
            });
            graphData.filter.yAxis = graphData.filter.yAxis.map((f) => {
                let dataKey = dataKeys.find((key) => key.col_title == f.variableName);
                return {
                    ...f,
                    variableName: dataKey?.col_name ?? f.variableName,
                };
            });
            graphData.filter.yPreAxis = graphData.filter.yPreAxis.map((f) => {
                let dataKey = dataKeys.find((key) => key.col_title == f.variableName);
                return {
                    ...f,
                    variableName: dataKey?.col_name ?? f.variableName,
                };
            });
            graphData.filter.customFilter = graphData.filter.customFilter.map((f) => {
                let dataKey1 = dataKeys.find((key) => key.col_title == f.customFiltervar1);
                let dataKey2 = dataKeys.find((key) => key.col_title == f.customFiltervar2);
                let dataKey3 = dataKeys.find((key) => key.col_title == f.customFiltervar3);
                return {
                    ...f,
                    customFiltervar1: dataKey1?.col_name ?? f.customFiltervar1,
                    customFiltervar2: dataKey2?.col_name ?? f.customFiltervar2,
                    customFiltervar3: dataKey3?.col_name ?? f.customFiltervar3,
                };
            });
            graphData.customVariable = graphData.customVariable.map((variable) => {
                if (variable.is_filter || variable.is_slab) {
                    variable.filters = variable.filters.map((f) => {
                        if (!f.isCustomValue) {
                            let dataKey = dataKeys.find((key) => key.col_title == f.values);
                            f.values = dataKey?.col_name ?? f.values;
                        }
                        f.conditions = f.conditions.map((condition) => {
                            let dataKey = dataKeys.find((key) => key.col_title == condition.variable.name);
                            condition.variable.name =
                                dataKey?.col_name ?? condition.variable.name;
                            return condition;
                        });
                        return f;
                    });
                }
                else {
                    variable.operation = variable.operation.map((op) => {
                        if (!op.isCustomValue) {
                            let dataKey = dataKeys.find((key) => key.col_title.split(' ').join('_') == op.value);
                            op.value = dataKey?.col_name ?? op.value;
                        }
                        return op;
                    });
                }
                return this.createNewFormula(variable);
            });
            graphData.dataFormat = graphData.dataFormat.map((format) => {
                let dataKey = dataKeys.find((key) => key.col_title == format.name);
                return {
                    ...format,
                    name: dataKey?.col_name ?? format.name,
                };
            });
        }
        return graphData;
    }
    getVariableData(input) {
        if (this.validateTime(input)) {
            let type = DataType.TIME;
            return [type];
        }
        else if (this.checkDate(input)) {
            let type = DataType.DATE;
            return [type];
        }
        else if (this.validateNumber(input)) {
            let type = DataType.NUMBER;
            return [type];
        }
        else {
            let type = DataType.STRING;
            return [type];
        }
    }
    validateTime(input) {
        let pattern1 = /^(1[0-2]|0?[1-9]):([0-5]?[0-9]):([0-5]?[0-9]) (●?[AP]M)?$/;
        let pattern2 = /^(1[0-2]|0?[1-9]):([0-5]?[0-9]):([0-5]?[0-9]) (●?[ap]m)?$/;
        let pattern3 = /^(1[0-2]|0?[1-9]):([0-5]?[0-9]) (●?[AP]M)?$/;
        let pattern4 = /^(1[0-2]|0?[1-9]):([0-5]?[0-9]) (●?[ap]m)?$/;
        let pattern5 = /^(2[0-3]|[01]?[0-9]):([0-5]?[0-9]):([0-5]?[0-9])$/;
        let pattern6 = /^(2[0-3]|[01]?[0-9]):([0-5]?[0-9])$/;
        return (pattern1.test(input) ||
            pattern2.test(input) ||
            pattern3.test(input) ||
            pattern4.test(input) ||
            pattern5.test(input) ||
            pattern6.test(input));
    }
    validateNumber(e) {
        const pattern2 = /^[-+]?[0-9]+\.[0-9]+$/;
        const pattern = /^[-+]?[0-9]+$/;
        return pattern.test(e) || pattern2.test(e);
    }
    checkDate(input) {
        const pattern = /^([0-2]\d|[3][0-1])\-([0]\d|[1][0-2])\-([2][01]|[1][6-9])\d{2}(\s([0-1]\d|[2][0-3])(\:[0-5]\d){1,2})?$/;
        return pattern.test(input);
    }
    convertDateFormat(input, type) {
        if (moment(input, type).isValid()) {
            switch (type) {
                case 'DD-MM-YYYY hh:mm:ss a':
                    return moment(input, type).format('DD-MM-YYYY hh:mm:ss a');
                case 'MM-DD-YYYY hh:mm:ss a':
                    return moment(input, type).format('DD-MM-YYYY hh:mm:ss a');
                case 'YYYY-MM-DD hh:mm:ss a':
                    return moment(input, type).format('DD-MM-YYYY hh:mm:ss a');
                case 'DD-MM-YYYY':
                    return moment(input, type).format('DD-MM-YYYY');
                case 'MM-DD-YYYY':
                    return moment(input, type).format('DD-MM-YYYY');
                case 'YYYY-MM-DD':
                    return moment(input, type).format('DD-MM-YYYY');
                case 'DD/MM/YYYY hh:mm:ss a':
                    return moment(input, type).format('DD-MM-YYYY hh:mm:ss a');
                case 'MM/DD/YYYY hh:mm:ss a':
                    return moment(input, type).format('DD-MM-YYYY hh:mm:ss a');
                case 'YYYY/MM/DD hh:mm:ss a':
                    return moment(input, type).format('DD-MM-YYYY hh:mm:ss a');
                case 'DD/MM/YYYY':
                    return moment(input, type).format('DD-MM-YYYY');
                case 'MM/DD/YYYY':
                    return moment(input, type).format('DD-MM-YYYY');
                case 'YYYY/MM/DD':
                    return moment(input, type).format('DD-MM-YYYY');
                case 'HH:mm':
                    return moment(input, type).format('HH:mm:ss');
                case 'HH:mm:ss':
                    return moment(input, type).format('HH:mm:ss');
                case 'hh:mm a':
                    return moment(input, type).format('HH:mm:ss');
                case 'hh:mm:ss a':
                    return moment(input, type).format('HH:mm:ss');
                default:
                    return null;
            }
        }
        else {
            return null;
        }
    }
    getDecodedUrl(url) {
        return this.http
            .post(this.DCUTLY_BASE_URL + 'cut/decodeUrl', {
            url: url,
            paramEncryption: false,
        })
            .toPromise();
    }
    getEncodedUrl(url) {
        return this.http
            .post(this.DCUTLY_BASE_URL + 'cut/short', {
            url: url,
            paramEncryption: true,
        })
            .toPromise();
    }
    getSharedDashboard(params, adminId) {
        return this.http
            .get(this.XSIGHT_BASE_URL + 'dashboard/get-shared-dashboard' + params, {
            headers: this.setHeaders(adminId),
        })
            .toPromise();
    }
    getSharedBackendDashboard(params, adminId) {
        return this.http
            .post(this.XSIGHT_BASE_URL + 'dashboard/get-shared-backend-dashboard-data', params, {
            headers: this.setHeaders(adminId),
        })
            .toPromise();
    }
    getSharedDashboardData(dashboard_id, adminId) {
        return this.http
            .get(this.XSIGHT_BASE_URL +
            'dashboard/get-shared-dashboard-data?shareid=' +
            dashboard_id, {
            headers: this.setHeaders(adminId),
        })
            .toPromise();
    }
}
DataService.ɵfac = i0.ɵɵngDeclareFactory({ minVersion: "12.0.0", version: "13.0.3", ngImport: i0, type: DataService, deps: [{ token: i1.HttpClient }], target: i0.ɵɵFactoryTarget.Injectable });
DataService.ɵprov = i0.ɵɵngDeclareInjectable({ minVersion: "12.0.0", version: "13.0.3", ngImport: i0, type: DataService, providedIn: 'root' });
i0.ɵɵngDeclareClassMetadata({ minVersion: "12.0.0", version: "13.0.3", ngImport: i0, type: DataService, decorators: [{
            type: Injectable,
            args: [{
                    providedIn: 'root',
                }]
        }], ctorParameters: function () { return [{ type: i1.HttpClient }]; } });

class DataPopupComponent {
    constructor(activeModal, dataService) {
        this.activeModal = activeModal;
        this.dataService = dataService;
        this.keys = [];
        this.dataSource = [];
        this.columnToView = [];
    }
    ngOnInit() {
        let data = this.dataService.getModalData();
        this.columnToView = data.colToView;
        //console.log('this.columnToView: ', this.columnToView);
        this.keys = Object.keys(data.refData[0]).filter((key) => this.columnToView.length == 0 || this.columnToView.includes(key));
        this.dataSource = data.refData;
    }
    closeModal() {
        this.activeModal.close();
    }
    exportExcel() {
        import('xlsx').then((xlsx) => {
            const worksheet = xlsx.utils.json_to_sheet(this.dataSource);
            const workbook = { Sheets: { data: worksheet }, SheetNames: ['data'] };
            const excelBuffer = xlsx.write(workbook, {
                bookType: 'xlsx',
                type: 'array',
            });
            this.saveAsExcelFile(excelBuffer, 'data');
        });
    }
    saveAsExcelFile(buffer, fileName) {
        let EXCEL_TYPE = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet;charset=UTF-8';
        let EXCEL_EXTENSION = '.xlsx';
        const data = new Blob([buffer], {
            type: EXCEL_TYPE,
        });
        FileSave.saveAs(data, fileName + '_export_' + new Date().getTime() + EXCEL_EXTENSION);
    }
}
DataPopupComponent.ɵfac = i0.ɵɵngDeclareFactory({ minVersion: "12.0.0", version: "13.0.3", ngImport: i0, type: DataPopupComponent, deps: [{ token: i1$1.NgbActiveModal }, { token: DataService }], target: i0.ɵɵFactoryTarget.Component });
DataPopupComponent.ɵcmp = i0.ɵɵngDeclareComponent({ minVersion: "12.0.0", version: "13.0.3", type: DataPopupComponent, selector: "lib-data-popup", ngImport: i0, template: "<div>\n  <div style=\"display: flex; justify-content:space-between;align-items: center;padding: 5px;\">\n    <h3 style=\"margin-bottom: 0; font-size: 20px;font-weight: 500;\">Data</h3> \n    <button class=\"btn btn-primary dwnld_btn\" (click)=\"exportExcel()\">Download</button>\n  </div>\n  <div class=\"smart_table\"> <p-table #dt1 [value]=\"dataSource\" [(selection)]=\"dataSource\" dataKey=\"id\"\n      styleClass=\"p-datatable-customers\" [rows]=\"10\" [paginator]=\"true\"> <ng-template pTemplate=\"header\">\n        <tr>\n          <th *ngFor=\"let heading of keys;\" pSortableColumn=\"{{heading}}\">{{heading}} <p-sortIcon\n              field=\"{{heading}}\"></p-sortIcon> </th>\n        </tr>\n        <tr>\n          <th *ngFor=\"let heading of keys;\"> <input pInputText type=\"text\"\n              (input)=\"dt1.filter($any($event.target)?.value, heading, 'contains')\"\n              [value]=\"$any(dt1.filters[heading])?.value\" placeholder=\"Search by {{heading}}\" class=\"p-column-filter\">\n          </th>\n        </tr>\n      </ng-template> <ng-template pTemplate=\"body\" let-data>\n        <tr>\n          <td *ngFor=\"let heading of keys\"> <span class=\"p-column-title\">{{heading}}</span> {{data[heading]}} </td>\n        </tr>\n      </ng-template> <ng-template pTemplate=\"emptymessage\">\n        <tr>\n          <td colspan=\"12\" class=\"text-center\">No Data found.</td>\n        </tr>\n      </ng-template> </p-table> </div>\n</div>", styles: [""], components: [{ type: i3.Table, selector: "p-table", inputs: ["frozenColumns", "frozenValue", "style", "styleClass", "tableStyle", "tableStyleClass", "paginator", "pageLinks", "rowsPerPageOptions", "alwaysShowPaginator", "paginatorPosition", "paginatorDropdownAppendTo", "paginatorDropdownScrollHeight", "currentPageReportTemplate", "showCurrentPageReport", "showJumpToPageDropdown", "showJumpToPageInput", "showFirstLastIcon", "showPageLinks", "defaultSortOrder", "sortMode", "resetPageOnSort", "selectionMode", "selectionPageOnly", "contextMenuSelection", "contextMenuSelectionMode", "dataKey", "metaKeySelection", "rowSelectable", "rowTrackBy", "lazy", "lazyLoadOnInit", "compareSelectionBy", "csvSeparator", "exportFilename", "filters", "globalFilterFields", "filterDelay", "filterLocale", "expandedRowKeys", "editingRowKeys", "rowExpandMode", "scrollable", "scrollDirection", "rowGroupMode", "scrollHeight", "virtualScroll", "virtualScrollDelay", "virtualRowHeight", "frozenWidth", "responsive", "contextMenu", "resizableColumns", "columnResizeMode", "reorderableColumns", "loading", "loadingIcon", "showLoader", "rowHover", "customSort", "showInitialSortBadge", "autoLayout", "exportFunction", "exportHeader", "stateKey", "stateStorage", "editMode", "groupRowsBy", "groupRowsByOrder", "minBufferPx", "maxBufferPx", "responsiveLayout", "breakpoint", "value", "columns", "first", "rows", "totalRecords", "sortField", "sortOrder", "multiSortMeta", "selection", "selectAll"], outputs: ["selectAllChange", "selectionChange", "contextMenuSelectionChange", "onRowSelect", "onRowUnselect", "onPage", "onSort", "onFilter", "onLazyLoad", "onRowExpand", "onRowCollapse", "onContextMenuSelect", "onColResize", "onColReorder", "onRowReorder", "onEditInit", "onEditComplete", "onEditCancel", "onHeaderCheckboxToggle", "sortFunction", "firstChange", "rowsChange", "onStateSave", "onStateRestore"] }, { type: i3.SortIcon, selector: "p-sortIcon", inputs: ["field"] }], directives: [{ type: i4.PrimeTemplate, selector: "[pTemplate]", inputs: ["type", "pTemplate"] }, { type: i4$1.NgForOf, selector: "[ngFor][ngForOf]", inputs: ["ngForOf", "ngForTrackBy", "ngForTemplate"] }, { type: i3.SortableColumn, selector: "[pSortableColumn]", inputs: ["pSortableColumn", "pSortableColumnDisabled"] }], encapsulation: i0.ViewEncapsulation.None });
i0.ɵɵngDeclareClassMetadata({ minVersion: "12.0.0", version: "13.0.3", ngImport: i0, type: DataPopupComponent, decorators: [{
            type: Component,
            args: [{ selector: 'lib-data-popup', encapsulation: ViewEncapsulation.None, template: "<div>\n  <div style=\"display: flex; justify-content:space-between;align-items: center;padding: 5px;\">\n    <h3 style=\"margin-bottom: 0; font-size: 20px;font-weight: 500;\">Data</h3> \n    <button class=\"btn btn-primary dwnld_btn\" (click)=\"exportExcel()\">Download</button>\n  </div>\n  <div class=\"smart_table\"> <p-table #dt1 [value]=\"dataSource\" [(selection)]=\"dataSource\" dataKey=\"id\"\n      styleClass=\"p-datatable-customers\" [rows]=\"10\" [paginator]=\"true\"> <ng-template pTemplate=\"header\">\n        <tr>\n          <th *ngFor=\"let heading of keys;\" pSortableColumn=\"{{heading}}\">{{heading}} <p-sortIcon\n              field=\"{{heading}}\"></p-sortIcon> </th>\n        </tr>\n        <tr>\n          <th *ngFor=\"let heading of keys;\"> <input pInputText type=\"text\"\n              (input)=\"dt1.filter($any($event.target)?.value, heading, 'contains')\"\n              [value]=\"$any(dt1.filters[heading])?.value\" placeholder=\"Search by {{heading}}\" class=\"p-column-filter\">\n          </th>\n        </tr>\n      </ng-template> <ng-template pTemplate=\"body\" let-data>\n        <tr>\n          <td *ngFor=\"let heading of keys\"> <span class=\"p-column-title\">{{heading}}</span> {{data[heading]}} </td>\n        </tr>\n      </ng-template> <ng-template pTemplate=\"emptymessage\">\n        <tr>\n          <td colspan=\"12\" class=\"text-center\">No Data found.</td>\n        </tr>\n      </ng-template> </p-table> </div>\n</div>", styles: [""] }]
        }], ctorParameters: function () { return [{ type: i1$1.NgbActiveModal }, { type: DataService }]; } });

HC_exporting(Highcharts);
offlineExporting(Highcharts);
highStocks(Highcharts);
accessibility(Highcharts);
Drilldown(Highcharts);
var WidgetType$1;
(function (WidgetType) {
    WidgetType["GRAPH"] = "graph";
    WidgetType["TREND"] = "trend";
    WidgetType["PIVOT_TABLE"] = "pivot_table";
})(WidgetType$1 || (WidgetType$1 = {}));
class XSightsCoreService {
    constructor(dialog, modalConfig, dataService) {
        this.dialog = dialog;
        this.modalConfig = modalConfig;
        this.dataService = dataService;
        this.modalData = {};
        this.highcharts = Highcharts;
        this.divStyles = 'display: flex; justify-content: flex-start; align-items: center; position: absolute; top: 5px; left: 5px;';
        this.iconStyles = 'border: 2px solid #eee; padding: 5px; min-width: 28px; text-align: center; border-radius: 8px; background: #ccc; box-shadow: 2px 2px 2px #ccc; margin-right: 10px;';
        this.creditTitle = 'Powered by Axestrack';
        this.creditUrl = 'https://www.axestrack.com/';
        this.breadcrumbStyles = 'border: 2px solid #eee; background: #ccc; padding: 5px; min-width: 28px; text-align: center; border-radius: 8px; display: flex; box-shadow: 2px 2px 2px #ccc; margin-right: 10px;';
        this.charts = {};
        this.trends = {};
        this.modalConfig.modalDialogClass = 'datapopup-dailog';
        this.modalConfig.windowClass = 'datapopup-window';
    }
    build(widgetType, widgetData) {
        return new Promise((resolve, reject) => {
            switch (widgetType) {
                case WidgetType$1.GRAPH:
                    resolve(this.buildGraph({
                        ...widgetData,
                        breadCrumb: ['Home'],
                        currLevel: 0,
                        prevLevelData: [],
                        selKeys: [],
                        order: 0,
                        colToShow: '',
                    }));
                    break;
                case WidgetType$1.TREND:
                    let widget = widgetData;
                    resolve(this.buildTrend({
                        ...widget,
                        rawData: widget.graphData,
                        currLevel: 1,
                        order: 0,
                        prevLevelData: [],
                    }));
                    break;
                case WidgetType$1.PIVOT_TABLE:
                    resolve(this.buildPivotTable(widgetData));
                    break;
            }
        });
    }
    buildPivotTable(tableData) {
        //Applying Custom Filter
        let data = tableData.data;
        let fields = [];
        tableData.rows.forEach((row) => {
            fields.push({
                caption: row,
                dataField: row,
                area: PivotFieldsArea.ROW,
            });
        });
        tableData.categories.forEach((col) => {
            fields.push({
                caption: col,
                dataField: col,
                area: PivotFieldsArea.COLUMN,
            });
        });
        tableData.column.forEach((val, index) => {
            fields.push({
                caption: val +
                    '(' +
                    tableData.aggregationFunction[index].aggregationFunctions.toLowerCase() +
                    ')',
                dataField: val,
                area: PivotFieldsArea.DATA,
                allowFiltering: true,
                allowSorting: true,
                format: function (value) {
                    if (!Number.isInteger(value)) {
                        return value.toFixed(2).toString();
                    }
                    return value.toString();
                },
                summaryType: tableData.aggregationFunction[index].aggregationFunctions.toLowerCase(),
            });
        });
        let pivotData = {
            fields: fields,
            store: data,
        };
        let response = new PivotGridDataSource(pivotData);
        return response;
    }
    //Graph Function
    async buildGraph(graphData) {
        //Applying Custom Filter
        //Set GraphObject with GraphId
        this.charts[graphData.graphId] = graphData;
        this.charts[graphData.graphId].graphData = this.charts[graphData.graphId].graphData.filter((d) => this.applyCustomFilter(d, this.charts[graphData.graphId].filter));
        if (this.charts[graphData.graphId].rows[this.charts[graphData.graphId].currLevel] == '***LABEL***') {
            //Create Label Block
            let response = await this.publishLabel(graphData.graphId);
            //Dispatch after build event
            return response;
        }
        else {
            //Create Graph
            let response = await this.startGraphBuilder(graphData.graphId, this.charts[graphData.graphId].currLevel, '');
            //Dispatch after build event
            return response;
        }
    }
    async publishLabel(graphId) {
        //Flush Content of Graph Div
        document.querySelector('#' + graphId).innerHTML = '';
        //Add Custom Variable in Raw Data
        let data = await this.addCustomVariable(this.charts[graphId].customVariable, this.charts[graphId].graphData, false, this.charts[graphId].dataFormat, false);
        let colData = this.applyDataFilter(data, this.charts[graphId].filter, this.charts[graphId].columns, graphId);
        //Labels Data creation
        let htmlDiv = this.charts[graphId].columns.map((y, yIndex) => {
            let allData = colData[y].map((d) => d[y]);
            allData = lodash.without(allData, '');
            allData = lodash.without(allData, undefined);
            return {
                label: y,
                value: this.charts[graphId].aggregationFunctions[yIndex]
                    .aggregationFunctions == 'NO FUNCTION'
                    ? lodash.max(allData) //Getting Max Value on NO Function
                    : this.applyAggregation(allData, yIndex, this.charts[graphId].aggregationFunctions), //Applying Aggregation
            };
        });
        //Creating Label Html DUMP
        let html = `
    <div class="card" style="padding-top: 3%; padding-bottom: 3%; width: inherit;">
    ${htmlDiv.length == 1
            ? `<h3 style="text-align: center;">${this.charts[graphId].graphTitle}</h3>`
            : ``}
    <div class="graph-label" >
    ${htmlDiv
            .map((d, index) => `
        <div class="label-item" ${this.charts[graphId].colors[index] != undefined
            ? `style="background-color: ${this.charts[graphId].colors[index]}"`
            : ''} id="card-graph-${graphId}" data="${this.charts[graphId].columns[index]}">
          <h3 style="${data.length == 1 ? 'font-size: 18px;' : ''}" data="${this.charts[graphId].columns[index]}"><b data="${this.charts[graphId].columns[index]}">${Math.round(d.value)}</b></h3>
          ${data.length > 1
            ? `<h3 data="${this.charts[graphId].columns[index]}">` +
                d.label +
                '</h3>'
            : ''}
        </div>

        `)
            .join('')}
        </div>
    </div>`;
        //Rendering Label HTML DUMP over document
        document.querySelector('#' + graphId).innerHTML = html;
        let _self = this;
        //Label Click handler
        document.querySelectorAll('#card-graph-' + graphId).forEach((card) => card.addEventListener('click', function (e) {
            if (_self.charts[graphId].rows.length == 1) {
                //Rendering Last level Component
                _self.modalData = {
                    colToView: _self.charts[graphId].lastLevelColumns,
                    refData: _self.charts[graphId].graphData,
                };
                let modalOptions = {
                    panelClass: 'dataPopup-modal',
                    backdropClass: 'modal-backdrop',
                };
                _self.dialog.open(DataPopupComponent, modalOptions);
            }
            else {
                _self.charts[graphId].currLevel += 1;
                _self.charts[graphId].prevLevelData.push(_self.charts[graphId].graphData);
                _self.charts[graphId].breadCrumb.push(e.target.getAttribute('data'));
                //Flush Label Content from document
                document.querySelector('#' + graphId).innerHTML = '';
                //Generating Child Graph of Label
                _self.startGraphBuilder(graphId, 1, e.target.getAttribute('data'));
            }
        }));
        return true;
    }
    applyDataFilter(data, filter, columns, graphId) {
        const yFilter = filter.yPreAxis;
        let colData = {};
        lodash.forEach(data, (d) => {
            columns.forEach((col) => {
                const filterToApply = yFilter.filter(y => y.variableName == col);
                let isValid = yFilter.length == 0;
                if (yFilter.length > 0) {
                    let values = filterToApply[0].values;
                    let dataValue = d[filterToApply[0].variableName];
                    let variableType = filterToApply[0].variableType;
                    switch (filterToApply[0].filterType) {
                        case FilterTypes.GREATER_THAN:
                            if (dataValue > values[0]) {
                                isValid = true;
                            }
                            break;
                        case FilterTypes.LESS_THAN:
                            if (dataValue < values[0]) {
                                isValid = true;
                            }
                            break;
                        case FilterTypes.LESS_THAN_EQUAL:
                            if (dataValue <= values[0]) {
                                isValid = true;
                            }
                            break;
                        case FilterTypes.GREATER_THAN_EQUAL:
                            if (dataValue >= values[0]) {
                                isValid = true;
                            }
                            break;
                        case FilterTypes.EQUAL:
                            if (dataValue == values[0]) {
                                isValid = true;
                            }
                            break;
                        case FilterTypes.NOT_EQUAL:
                            if (dataValue != values[0]) {
                                isValid = true;
                            }
                            break;
                        case FilterTypes.BETWEEN_RANGE:
                            if (dataValue >= values[0] && dataValue < values[1]) {
                                isValid = true;
                            }
                            break;
                        case FilterTypes.BEFORE:
                            if (variableType == DataType.DATE) {
                                let operand1 = this.getFormattedDate(dataValue, filterToApply[0].format);
                                let operand2 = new Date(values[0]);
                                if (operand1 < operand2) {
                                    isValid = true;
                                }
                            }
                            else {
                                let currSeconds = this.getFormattedDate(dataValue, filterToApply[0].format);
                                let [hour, min] = values[0]
                                    .split(':')
                                    .map((el) => parseInt(el));
                                let comparedSec = hour * 60 * 60 + min * 60;
                                if (currSeconds < comparedSec) {
                                    isValid = true;
                                }
                            }
                            break;
                        case FilterTypes.AFTER:
                            if (variableType == DataType.DATE) {
                                let operand1 = this.getFormattedDate(dataValue, filterToApply[0].format);
                                let operand2 = new Date(values[0]);
                                if (operand1 > operand2) {
                                    isValid = true;
                                }
                            }
                            else {
                                let currSeconds = this.getFormattedDate(dataValue, filterToApply[0].format);
                                let [hour, min] = values[0]
                                    .split(':')
                                    .map((el) => parseInt(el));
                                let comparedSec = hour * 60 * 60 + min * 60;
                                if (currSeconds > comparedSec) {
                                    isValid = true;
                                }
                            }
                            break;
                        case FilterTypes.BETWEEN:
                            if (variableType == DataType.DATE) {
                                let operand1 = this.getFormattedDate(dataValue, filterToApply[0].format);
                                let operand2 = new Date(values[0]);
                                let operand3 = new Date(values[1]);
                                if (operand1 >= operand2 && operand1 < operand3) {
                                    isValid = true;
                                }
                            }
                            else {
                                let currSeconds = this.getFormattedDate(dataValue, filterToApply[0].format);
                                let [hour, min] = values[0]
                                    .split(':')
                                    .map((el) => parseInt(el));
                                let [endhour, endmin] = values[1]
                                    .split(':')
                                    .map((el) => parseInt(el));
                                let comparedSec = hour * 60 * 60 + min * 60;
                                let endComparedSec = endhour * 60 * 60 + endmin * 60;
                                if (currSeconds >= comparedSec &&
                                    currSeconds < endComparedSec) {
                                    isValid = true;
                                }
                            }
                            break;
                        case FilterTypes.IN:
                            if (values.indexOf(dataValue.toString()) != -1) {
                                isValid = true;
                            }
                            break;
                        case FilterTypes.NOT_IN:
                            if (values.indexOf(dataValue.toString()) == -1) {
                                isValid = true;
                            }
                            break;
                    }
                }
                // if(isValid && filter.customFilter.length > 0){
                //   isValid = this.applyCustomFilter(d, filter);
                // }
                if (isValid) {
                    if (colData.hasOwnProperty(col)) {
                        colData[col].push(d);
                    }
                    else {
                        colData[col] = [d];
                    }
                }
            });
        });
        return colData;
    }
    async startGraphBuilder(graphId, currLevel, colToShow) {
        //Add Custom Slabs in Raw Data
        let data = await this.addCustomVariable(this.charts[graphId].customVariable, this.charts[graphId].graphData, true, this.charts[graphId].dataFormat, true);
        this.charts[graphId].graphData = lodash.groupBy(data, this.charts[graphId].rows[currLevel]);
        this.charts[graphId].currLevel = currLevel;
        // this.charts[graphId].prevLevelData = currLevel == 0 ? [] : [data];
        this.charts[graphId].colToShow = colToShow;
        //Creating Chart Raw Json
        let chartOptions = this.createChartData(graphId, currLevel);
        //Rendering Chart of GraphId
        this.highcharts.chart(this.charts[graphId].graphId, chartOptions);
        //Add Action Buttons Over Chart
        this.addActionBtn(graphId);
        return true;
    }
    getPlotOptions(graphId, currLevel) {
        let plotOptions = {
            series: {
                turboThreshold: 1000000,
                dataLabels: {
                    color: 'black',
                    enabled: true,
                    style: {
                        color: 'black',
                        textShadow: false,
                        textDecoration: 'none',
                    },
                },
                label: {
                    style: {
                        color: 'black',
                    },
                },
            },
        };
        //Options for Stack Graph
        if (this.charts[graphId].graphTypes[currLevel] == GraphTypes.STACKED_BAR ||
            this.charts[graphId].graphTypes[currLevel] == GraphTypes.STACKED_COLUMN) {
            plotOptions.series['stacking'] = 'normal'; //Normal Stacking of y-axis
        }
        else if (this.charts[graphId].graphTypes[currLevel] ==
            GraphTypes.STACKED_BAR_PERCENTAGE ||
            this.charts[graphId].graphTypes[currLevel] ==
                GraphTypes.STACKED_COLUMN_PERCENTAGE) {
            plotOptions.series['stacking'] = 'percent'; //Stacking of y-axis on basis of percentage
            //Add Percent Sign after y-axis values
            plotOptions.series.dataLabels['formatter'] = function () {
                return this.percentage.toFixed(2) + ' %';
            };
        }
        return plotOptions;
    }
    createChartData(graphId, currLevel) {
        let _self = this;
        //Getting Plot Options for Graph
        let plotOptions = this.getPlotOptions(graphId, currLevel);
        return {
            credits: {
                text: this.creditTitle,
                href: this.creditUrl,
                style: {
                    fontSize: '12px',
                },
            },
            title: null,
            plotOptions: plotOptions,
            chart: {
                events: {
                    //Handle Drilldown Event of Graph
                    drilldown: function (e) {
                        if (e.points != false)
                            return;
                        let currGraphId = e.point.options.graphId; //GraphId
                        let colId = e.point.colIndex; //ColorIndex of bar
                        //Increasing Graph Drilldown level
                        _self.charts[currGraphId].currLevel += 1;
                        _self.charts[currGraphId].breadCrumb.push(e.point.name);
                        _self.charts[currGraphId].selKeys?.push(e.point.name);
                        //Open Last Level Component
                        if (_self.charts[currGraphId].rows[_self.charts[currGraphId].currLevel] == null) {
                            _self.dataService.setModalData({
                                colToView: _self.charts[currGraphId].lastLevelColumns,
                                refData: _self.charts[currGraphId].graphData[e.point.name],
                            });
                            let modalOptions = {
                                panelClass: 'dataPopup-modal',
                                backdropClass: 'modal-backdrop',
                            };
                            _self.dialog.open(DataPopupComponent, modalOptions);
                            //Reducing Graph Drilldown Level
                            _self.charts[currGraphId].currLevel -= 1;
                            return;
                        }
                        //Storing Previous Snapshot of Data to restore graph on back
                        _self.charts[currGraphId].prevLevelData.push([].concat(...Object.values(_self.charts[currGraphId].graphData)));
                        //Group Data according to next drilldown field
                        _self.charts[currGraphId].graphData = lodash.groupBy(_self.charts[currGraphId].graphData[e.point.name], _self.charts[currGraphId].rows[_self.charts[currGraphId].currLevel]);
                        let chart = this;
                        _self.manageBreadCrumb(currGraphId, _self);
                        //Getting drilldown series data
                        let series = _self.getDrillDownData(e.point.name, _self.charts[currGraphId].graphData, currGraphId, colId);
                        //Show Loading in Chart
                        chart.showLoading('Loading...');
                        // if (
                        //   _self.charts[currGraphId].graphTypes[0] ==
                        //     GraphTypes.STACKED_BAR_PERCENTAGE ||
                        //   _self.charts[currGraphId].graphTypes[0] ==
                        //     GraphTypes.STACKED_COLUMN_PERCENTAGE
                        // ) {
                        //   plotOptions.series['stacking'] = 'normal';
                        //   plotOptions.series.dataLabels['formatter'] = function () {
                        //     return this.y;
                        //   };
                        //   chart.update({
                        //     plotOptions: plotOptions,
                        //   });
                        // }
                        setTimeout(() => {
                            //Hide Loading in chart
                            chart.hideLoading();
                            //Add Drilldown Series Data as Main Series
                            chart.update({
                                plotOptions: plotOptions,
                                xAxis: {
                                    type: 'category',
                                    labels: {
                                        style: {
                                            color: 'red',
                                            textDecoration: 'none',
                                            textOutline: '0px',
                                        },
                                    },
                                    min: 0,
                                    max: 6,
                                    allowDecimals: false,
                                    scrollbar: {
                                        enabled: true,
                                    },
                                },
                                series: series
                            });
                            // chart.addSeriesAsDrilldown(e.point, series);
                        }, 1000);
                    },
                    //Handle DrillUp Event
                    drillup: async function (e) {
                        // let currGraphId = e.seriesOptions.graphId; //GraphId
                        // let level = e.seriesOptions.level; //Current Level of Drilldown
                        // let chart: any = this;
                        // _self.charts[currGraphId].currLevel = level;
                        // //Restoring Data using previous store data
                        // _self.charts[currGraphId].graphData = await _self.charts[
                        //   currGraphId
                        // ].prevLevelData[level];
                        // //Refresh Previous Data List
                        // _self.charts[currGraphId].prevLevelData.splice(level, 1);
                        // if (
                        //   level == 0 &&
                        //   (_self.charts[graphId].graphTypes[0] ==
                        //     GraphTypes.STACKED_BAR_PERCENTAGE ||
                        //     _self.charts[graphId].graphTypes[0] ==
                        //       GraphTypes.STACKED_COLUMN_PERCENTAGE)
                        // ) {
                        //   plotOptions.series['stacking'] = 'percent'; //Stacking of y-axis on basis of percentage
                        //   //Add Percent Sign after y-axis values
                        //   plotOptions.series.dataLabels['formatter'] = function () {
                        //     return this.percentage.toFixed(2) + ' %';
                        //   };
                        //   chart.update({
                        //     plotOptions: plotOptions,
                        //   });
                        // }
                    },
                },
            },
            //Configuring X-axis
            xAxis: {
                type: 'category',
                labels: {
                    style: {
                        color: 'red',
                        textDecoration: 'none',
                        textOutline: '0px',
                    },
                },
                min: 0,
                max: Object.keys(this.charts[graphId].graphData).length <= 6
                    ? Object.keys(this.charts[graphId].graphData).length - 1
                    : 6,
                allowDecimals: false,
                scrollbar: {
                    enabled: true,
                },
            },
            //Configuring Y-axis
            yAxis: lodash.map(this.charts[graphId].columns, (y) => {
                return {
                    opposite: true,
                    title: {
                        text: null, // Hiding vertical labels over y-axis
                    },
                };
            }),
            //Getting Main Series Data
            series: this.getDrillDownData(null, this.charts[graphId].graphData, this.charts[graphId].graphId),
        };
    }
    manageBreadCrumb(graphId, _self) {
        const div = document.getElementById("graph-options-" + graphId);
        document.getElementById("breadcrumb-" + graphId)?.remove();
        const breadCrumb = document.createElement("div");
        if (_self.charts[graphId].breadCrumb.length == 1) {
            return;
        }
        breadCrumb.setAttribute('style', this.breadcrumbStyles);
        breadCrumb.setAttribute('id', "breadcrumb-" + graphId);
        // homeIcon.setAttribute('id', 'home-label-' + graphId);
        // homeIcon.setAttribute('class', 'fa fa-home');
        _self.charts[graphId].breadCrumb.forEach((breadcrumb, index) => {
            const para = document.createElement("p");
            const span = document.createElement("span");
            span.setAttribute("style", "text-decoration: underline; cursor: pointer;");
            span.setAttribute("id", breadcrumb);
            span.append(breadcrumb);
            para.appendChild(span);
            para.setAttribute("style", "margin-bottom: 0px;");
            if (index != this.charts[graphId].breadCrumb.length - 1) {
                para.append(" > ");
                span.addEventListener("click", (event) => {
                    console.log(event.target.id);
                    if (event.target.id == "Home") {
                        _this.charts[graphId].graphData = _this.charts[graphId].prevLevelData[0];
                        _this.buildGraph({
                            ..._this.charts[graphId],
                            breadCrumb: ['Home'],
                            currLevel: 0,
                            prevLevelData: [],
                            order: 0,
                            selKeys: [],
                            colToShow: '',
                        });
                    }
                    else {
                        const index = _this.charts[graphId].breadCrumb.findIndex((el) => el == event.target.id);
                        console.log('index: ', index);
                        if (index > 0) {
                            // this.buildGraph()
                            console.log('prev  _this.charts[graphId]: ', _this.charts[graphId]);
                            //Restoring Data using previous store data
                            _this.charts[graphId].currLevel = index;
                            _this.charts[graphId].graphData = _this.charts[graphId].prevLevelData[index];
                            //Refresh Previous Data List
                            _this.charts[graphId].prevLevelData = _this.charts[graphId].prevLevelData.slice(0, index);
                            _this.charts[graphId].breadCrumb = _this.charts[graphId].breadCrumb.slice(0, index + 1);
                            _this.charts[graphId].selKeys = _this.charts[graphId].selKeys?.slice(0, index);
                            console.log('_this.charts[graphId]: ', _this.charts[graphId]);
                            _this.buildGraph({
                                ..._this.charts[graphId],
                            });
                        }
                    }
                });
            }
            breadCrumb.appendChild(para);
            let _this = this;
        });
        div.appendChild(breadCrumb);
    }
    applyCustomFilter(d, filter) {
        let isValid = filter.customFilter.length == 0;
        if (filter.customFilter && filter.customFilter.length > 0) {
            for (const element of filter.customFilter) {
                isValid = false;
                const _filter = element;
                switch (_filter.customFilterType) {
                    case CustomFilterTypes.SINGLE_EQUATION:
                        if (this.getEquationResult(d[_filter.customFiltervar1], _filter.customFilterVar1Value, _filter.symbol1, _filter.filterType1, _filter.filterFormat1)) {
                            isValid = true;
                        }
                        break;
                    case CustomFilterTypes.A_OR_B:
                        if ((this.getEquationResult(d[_filter.customFiltervar1], _filter.customFilterVar1Value, _filter.symbol1, _filter.filterType1, _filter.filterFormat1) ||
                            this.getEquationResult(d[_filter.customFiltervar2], _filter.customFilterVar2Value, _filter.symbol2, _filter.filterType2, _filter.filterFormat2))) {
                            isValid = true;
                        }
                        break;
                    case CustomFilterTypes.A_AND_B:
                        if ((this.getEquationResult(d[_filter.customFiltervar1], _filter.customFilterVar1Value, _filter.symbol1, _filter.filterType1, _filter.filterFormat1) &&
                            this.getEquationResult(d[_filter.customFiltervar2], _filter.customFilterVar2Value, _filter.symbol2, _filter.filterType2, _filter.filterFormat2))) {
                            isValid = true;
                        }
                        break;
                    case CustomFilterTypes.A_OR_B_OR_C:
                        if ((this.getEquationResult(d[_filter.customFiltervar1], _filter.customFilterVar1Value, _filter.symbol1, _filter.filterType1, _filter.filterFormat1) ||
                            this.getEquationResult(d[_filter.customFiltervar2], _filter.customFilterVar2Value, _filter.symbol2, _filter.filterType2, _filter.filterFormat2) ||
                            this.getEquationResult(d[_filter.customFiltervar3], _filter.customFilterVar3Value, _filter.symbol3, _filter.filterType3, _filter.filterFormat3))) {
                            isValid = true;
                        }
                        break;
                    case CustomFilterTypes.A_AND_B_AND_C:
                        if ((this.getEquationResult(d[_filter.customFiltervar1], _filter.customFilterVar1Value, _filter.symbol1, _filter.filterType1, _filter.filterFormat1) &&
                            this.getEquationResult(d[_filter.customFiltervar2], _filter.customFilterVar2Value, _filter.symbol2, _filter.filterType2, _filter.filterFormat2) &&
                            this.getEquationResult(d[_filter.customFiltervar3], _filter.customFilterVar3Value, _filter.symbol3, _filter.filterType3, _filter.filterFormat3))) {
                            isValid = true;
                        }
                        break;
                    case CustomFilterTypes.A_OR_B_AND_C:
                        if ((this.getEquationResult(d[_filter.customFiltervar1], _filter.customFilterVar1Value, _filter.symbol1, _filter.filterType1, _filter.filterFormat1) ||
                            (this.getEquationResult(d[_filter.customFiltervar2], _filter.customFilterVar2Value, _filter.symbol2, _filter.filterType2, _filter.filterFormat2) &&
                                this.getEquationResult(d[_filter.customFiltervar3], _filter.customFilterVar3Value, _filter.symbol3, _filter.filterType3, _filter.filterFormat3)))) {
                            isValid = true;
                        }
                        break;
                    case CustomFilterTypes.A_AND_B_OR_C:
                        if ((this.getEquationResult(d[_filter.customFiltervar1], _filter.customFilterVar1Value, _filter.symbol1, _filter.filterType1, _filter.filterFormat1) &&
                            (this.getEquationResult(d[_filter.customFiltervar2], _filter.customFilterVar2Value, _filter.symbol2, _filter.filterType2, _filter.filterFormat2) ||
                                this.getEquationResult(d[_filter.customFiltervar3], _filter.customFilterVar3Value, _filter.symbol3, _filter.filterType3, _filter.filterFormat3)))) {
                            isValid = true;
                        }
                        break;
                }
                if (!isValid)
                    break;
            }
        }
        return isValid;
    }
    getFormattedDate(inputStr, format = DateFormat.DD_MM_YYYY_HH_mm_ss) {
        if ([
            DateFormat.DD_MM_YYYY,
            DateFormat.MM_DD_YYYY,
            DateFormat.DD_s_MM_s_YYYY,
            DateFormat.MM_s_DD_s_YYYY,
            DateFormat.YYYY_s_MM_s_DD,
            DateFormat.YYYY_MM_DD,
        ].indexOf(format) != -1) {
            let tempArr = inputStr.split(' ');
            let dateStr = tempArr[0];
            let [day, month, year] = dateStr.split('-');
            return new Date(+year, month - 1, +day);
        }
        else if (format == TimeFormat.HH_mm_ss) {
            let [hour, minute, second] = inputStr
                .split(':')
                .map((el) => parseInt(el));
            return hour * 60 * 60 + minute * 60 + second;
        }
        else {
            let tempArr = inputStr.split(' ');
            let dateStr = tempArr[0];
            let time = tempArr[1];
            let [day, month, year] = dateStr.split('-');
            let [hour, minute] = time.split(':');
            let second = 0;
            return new Date(+year, month - 1, +day, +hour, +minute, +second);
        }
    }
    getEquationResult(variable1, variable2, operator, type, format) {
        switch (operator) {
            case FilterTypes.EQUAL:
                if (variable1 == variable2[0]) {
                    return true;
                }
                break;
            case FilterTypes.GREATER_THAN:
                if (variable1 > variable2[0]) {
                    return true;
                }
                break;
            case FilterTypes.LESS_THAN:
                if (variable1 < variable2[0]) {
                    return true;
                }
                break;
            case FilterTypes.NOT_EQUAL:
                if (variable1 != variable2[0]) {
                    return true;
                }
                break;
            case FilterTypes.GREATER_THAN_EQUAL:
                if (variable1 >= variable2[0]) {
                    return true;
                }
                break;
            case FilterTypes.LESS_THAN_EQUAL:
                if (variable1 <= variable2[0]) {
                    return true;
                }
                break;
            case FilterTypes.BETWEEN_RANGE:
                if (variable1 >= variable2[0] && variable1 < variable2[1]) {
                    return true;
                }
                break;
            case FilterTypes.IN:
                if (variable2.indexOf(variable1.toString()) != -1) {
                    return true;
                }
                break;
            case FilterTypes.NOT_IN:
                if (variable2.indexOf(variable1.toString()) == -1) {
                    return true;
                }
                break;
            case FilterTypes.BEFORE:
                if (type == DataType.DATE) {
                    //Date Type variable
                    let operand1 = this.getFormattedDate(variable1, format);
                    let operand2 = new Date(variable2);
                    if (operand1 < operand2) {
                        return true;
                    }
                }
                else {
                    //Time Type variable
                    let currSeconds = this.getFormattedDate(variable1, format);
                    let [hour, min] = variable2.split(':').map((el) => parseInt(el));
                    let comparedSec = hour * 60 * 60 + min * 60;
                    if (currSeconds < comparedSec) {
                        return true;
                    }
                }
                break;
            case FilterTypes.AFTER:
                if (type == DataType.DATE) {
                    //Date Type variable
                    let operand1 = this.getFormattedDate(variable1, format);
                    let operand2 = new Date(variable2);
                    if (operand1 > operand2) {
                        return true;
                    }
                }
                else {
                    //Time Type variable
                    let currSeconds = this.getFormattedDate(variable1, format);
                    let [hour, min] = variable2.split(':').map((el) => parseInt(el));
                    let comparedSec = hour * 60 * 60 + min * 60;
                    if (currSeconds > comparedSec) {
                        return true;
                    }
                }
                break;
            case FilterTypes.BETWEEN:
                if (type == DataType.DATE) {
                    //Date Type variable
                    let operand1 = this.getFormattedDate(variable1, format);
                    let operand2 = new Date(variable2[0]);
                    let operand3 = new Date(variable2[1]);
                    if (operand1 >= operand2 && operand1 < operand3) {
                        return true;
                    }
                }
                else {
                    //Time Type variable
                    let currSeconds = this.getFormattedDate(variable1, format);
                    let [hour, min] = variable2[0]
                        .split(':')
                        .map((el) => parseInt(el));
                    let [endhour, endmin] = variable2[1]
                        .split(':')
                        .map((el) => parseInt(el));
                    let comparedSec = hour * 60 * 60 + min * 60;
                    let endComparedSec = endhour * 60 * 60 + endmin * 60;
                    if (currSeconds >= comparedSec && currSeconds < endComparedSec) {
                        return true;
                    }
                }
                break;
        }
        return false;
    }
    sortGraph(e) {
        const tempArr = e.target.id.split('@');
        const graphId = tempArr[tempArr.length - 1];
        if (this.charts[graphId].order < 1) {
            this.charts[graphId].order += 1;
        }
        else {
            this.charts[graphId].order = -1;
        }
        if (this.charts[graphId].currLevel != 0) {
            this.charts[graphId].graphData = this.charts[graphId].prevLevelData[0];
        }
        this.charts[graphId].currLevel = 0;
        let chartOptions = this.createChartData(graphId, 0);
        this.highcharts.chart(graphId, chartOptions);
        this.addActionBtn(graphId);
    }
    downloadGraphData(e, data, lastLevelCol) {
        this.dataService.setModalData({
            colToView: lastLevelCol,
            refData: data
        });
        let modalOptions = {
            panelClass: 'dataPopup-modal',
            backdropClass: 'modal-backdrop',
        };
        this.dialog.open(DataPopupComponent, modalOptions);
    }
    addActionBtn(graphId) {
        let _self = this;
        const div = document.createElement('div');
        div.setAttribute('style', this.divStyles);
        div.setAttribute("id", "graph-options-" + graphId);
        const sortIcon = document.createElement('i');
        sortIcon.setAttribute('id', 'sort@' + graphId);
        sortIcon.setAttribute('style', this.iconStyles);
        if (this.charts[graphId].order == 1) {
            sortIcon.setAttribute('class', 'fa fa-sort-amount-desc');
        }
        else if (this.charts[graphId].order == -1) {
            sortIcon.setAttribute('class', 'fa fa-sort-amount-asc');
        }
        else {
            sortIcon.setAttribute('class', 'fa fa-sort');
        }
        const downloadIcon = document.createElement("i");
        downloadIcon.setAttribute('id', 'download@' + graphId);
        downloadIcon.setAttribute('style', this.iconStyles);
        downloadIcon.setAttribute('class', 'fa fa-download');
        div.appendChild(downloadIcon);
        div.appendChild(sortIcon);
        // if (this.charts[graphId].rows[0] == '***LABEL***') {
        //   const homeIcon = document.createElement('icon');
        //   homeIcon.setAttribute('style', this.iconStyles);
        //   homeIcon.setAttribute('id', 'home-label-' + graphId);
        //   homeIcon.setAttribute('class', 'fa fa-home');
        //   div.appendChild(homeIcon);
        //   setTimeout(() => {
        //     document
        //       .querySelector('#home-label-' + graphId)!
        //       .addEventListener('click', function () {
        //         _self.build(
        //           WidgetType.GRAPH,
        //           Object.assign(Object.assign({}, _self.charts[graphId]), {
        //             graphData: _self.charts[graphId].prevLevelData[0],
        //           })
        //         );
        //       });
        //   }, 500);
        // }
        document.querySelector('#' + graphId).appendChild(div);
        this.manageBreadCrumb(graphId, this);
        sortIcon.addEventListener('click', function (e) {
            _self.sortGraph(e);
        });
        downloadIcon.addEventListener('click', function (e) {
            const tempArr = e.target.id.split('@');
            const graphId = tempArr[tempArr.length - 1];
            _self.downloadGraphData(e, Object.values(_self.charts[graphId].graphData).flat(), _self.charts[graphId].lastLevelColumns);
        });
    }
    applyAggregation(allData, yIndex, aggreagations) {
        let result = 0;
        switch (aggreagations[yIndex].aggregationFunctions) {
            case 'SUM' /* SUM */:
                result = lodash.sum(allData.map(Number));
                break;
            case 'COUNT_UNIQUE' /* COUNT_UNIQUE */:
                result = lodash.uniq(allData).length;
                break;
            case 'COUNT' /* COUNT */:
                result = allData.length;
                break;
            case 'MAXIMUM' /* MAXIMUM */:
                result = lodash.max(allData.map(Number)) ?? 0;
                break;
            case 'MINIMUM' /* MINIMUM */:
                result = lodash.min(allData.map(Number)) ?? 0;
                break;
            case 'AVERAGE' /* AVERAGE */:
                result = lodash.mean(allData.map(Number));
                break;
        }
        return result;
    }
    applyYfilter(d, yIndex, graphId) {
        if (this.charts[graphId].filter.yAxis.length > 0) {
            const filter = this.charts[graphId].filter.yAxis.filter((y) => this.charts[graphId].columns[yIndex] == y.variableName);
            if (filter.length > 0) {
                switch (filter[0].filterType) {
                    case FilterTypes.GREATER_THAN:
                        if (d.y < filter[0].values[0]) {
                            d = null;
                        }
                        break;
                    case '<':
                        if (d.y > filter[0].values[0]) {
                            d = null;
                        }
                        break;
                    case '<=':
                        if (!(d.y <= filter[0].values[0])) {
                            d = null;
                        }
                        break;
                    case '>=':
                        if (!(d.y >= filter[0].values[0])) {
                            d = null;
                        }
                        break;
                    case '==':
                        if (d.y != filter[0].values[0]) {
                            d = null;
                        }
                        break;
                    case '!=':
                        if (d.y == filter[0].values[0]) {
                            d = null;
                        }
                        break;
                    case 'bet':
                        if (!(d.y >= filter[0].values[0] && d.y < filter[0].values[1])) {
                            d = null;
                        }
                        break;
                }
            }
        }
        return d;
    }
    applyXfilter(el, filters, rows, columns, currLevel) {
        if (filters.xAxis.length > 0) {
            let isValid = true;
            const filter = filters.xAxis.filter((f) => f.variableName == rows[currLevel]);
            if (filter.length > 0) {
                switch (filter[0].filterType) {
                    case FilterTypes.IN:
                        if (filter[0].values.indexOf(el.key.toString()) == -1) {
                            isValid = false;
                        }
                        break;
                    case FilterTypes.NOT_IN:
                        if (filter[0].values.indexOf(el.key.toString()) != -1) {
                            isValid = false;
                        }
                        break;
                    case FilterTypes.GREATER_THAN:
                        if (el.key <= filter[0].values[0]) {
                            isValid = false;
                        }
                        break;
                    case FilterTypes.LESS_THAN:
                        if (el.key >= filter[0].values[0]) {
                            isValid = false;
                        }
                        break;
                    case FilterTypes.LESS_THAN_EQUAL:
                        if (el.key > filter[0].values[0]) {
                            isValid = false;
                        }
                        break;
                    case FilterTypes.GREATER_THAN_EQUAL:
                        if (el.key < filter[0].values[0]) {
                            isValid = false;
                        }
                        break;
                    case FilterTypes.EQUAL:
                        if (el.key != filter[0].values[0]) {
                            isValid = false;
                        }
                        break;
                    case FilterTypes.NOT_EQUAL:
                        if (el.key == filter[0].values[0]) {
                            isValid = false;
                        }
                        break;
                    case FilterTypes.BETWEEN_RANGE:
                        if (el.key < filter[0].values[0] && el.key >= filter[0].values[1]) {
                            isValid = false;
                        }
                        break;
                    case FilterTypes.BEFORE:
                        if (filter[0].variableType == DataType.DATE) {
                            let operand1 = this.getFormattedDate(el.key, filter[0].format);
                            let operand2 = new Date(filter[0].values[0]);
                            if (operand1 > operand2) {
                                isValid = false;
                            }
                        }
                        else {
                            let currSeconds = this.getFormattedDate(el.key, filter[0].format);
                            let [hour, min] = filter[0].values[0]
                                .split(':')
                                .map((el) => parseInt(el));
                            let comparedSec = hour * 60 * 60 + min * 60;
                            if (currSeconds > comparedSec) {
                                isValid = false;
                            }
                        }
                        break;
                    case FilterTypes.AFTER:
                        if (filter[0].variableType == DataType.DATE) {
                            let operand1 = this.getFormattedDate(el.key, filter[0].format);
                            let operand2 = new Date(filter[0].values[0]);
                            if (operand1 < operand2) {
                                isValid = false;
                            }
                        }
                        else {
                            let currSeconds = this.getFormattedDate(el.key, filter[0].format);
                            let [hour, min] = filter[0].values[0]
                                .split(':')
                                .map((el) => parseInt(el));
                            let comparedSec = hour * 60 * 60 + min * 60;
                            if (currSeconds < comparedSec) {
                                isValid = false;
                            }
                        }
                        break;
                    case FilterTypes.BETWEEN:
                        if (filter[0].variableType == DataType.DATE) {
                            let operand1 = this.getFormattedDate(el.key, filter[0].format);
                            let operand2 = new Date(filter[0].values[0]);
                            let operand3 = new Date(filter[0].values[1]);
                            if (operand1 < operand2 && operand1 >= operand3) {
                                isValid = false;
                            }
                        }
                        else {
                            let currSeconds = this.getFormattedDate(el.key, filter[0].format);
                            let [hour, min] = filter[0].values[0]
                                .split(':')
                                .map((el) => parseInt(el));
                            let [endhour, endmin] = filter[0].values[1]
                                .split(':')
                                .map((el) => parseInt(el));
                            let comparedSec = hour * 60 * 60 + min * 60;
                            let endComparedSec = endhour * 60 * 60 + endmin * 60;
                            if (currSeconds < comparedSec && currSeconds >= endComparedSec) {
                                isValid = false;
                            }
                        }
                        break;
                }
            }
            return isValid;
        }
        else {
            return true;
        }
    }
    getDrillDownData(selKey, data, graphId, colId = null) {
        let graphSeries = []; //Series Object
        lodash.forEach(this.charts[graphId].columns, (y, yIndex) => {
            if ((this.charts[graphId].colToShow == '' ||
                y == this.charts[graphId].colToShow)) {
                const func = this.charts[graphId].aggregationFunctions[yIndex]
                    .aggregationFunctions;
                const seriesData = []; //data object for series
                lodash.forEach(Object.keys(data), (el) => {
                    //Filter According to x-axis
                    let validKey = this.applyXfilter({
                        key: el,
                        data: data[el],
                    }, this.charts[graphId].filter, this.charts[graphId].rows, this.charts[graphId].columns, this.charts[graphId].currLevel);
                    data[el] = this.applyDataFilter(data[el], this.charts[graphId].filter, this.charts[graphId].columns, graphId)[y];
                    if (validKey && data[el] != null) {
                        //Add Custom Variable
                        data[el] = this.addCustomVariable(this.charts[graphId].customVariable, data[el], false, this.charts[graphId].dataFormat, false);
                        //Getting Data Array to aggregate
                        let variableType = this.getVariableTypeByHeader(y, this.charts[graphId].dataFormat);
                        let type = "string";
                        if (variableType == null) {
                            type = this.getVariableData(data[el][0][y])[0];
                        }
                        else {
                            type = variableType.type;
                        }
                        let dataToTraverse = lodash.map(data[el], (elData) => {
                            return type != "number" ? elData[y] : parseFloat(elData[y]);
                        });
                        dataToTraverse = lodash.without(lodash.without(dataToTraverse, undefined), '');
                        let genData = {
                            name: el,
                            dataLabels: {
                                shadow: false,
                                style: {
                                    color: 'black',
                                    textDecoration: 'none',
                                    textShadow: false,
                                    textOutline: 0,
                                },
                                className: 'graph-data-label',
                            },
                            drilldown: true,
                            graphId: graphId,
                            colIndex: yIndex,
                            level: this.charts[graphId].currLevel,
                            y: parseFloat(
                            // new Decimal(
                            this.charts[graphId].aggregationFunctions[yIndex]
                                .aggregationFunctions == "NO FUNCTION" /* NO_FUNCTION */
                                ? new BigNumber(dataToTraverse.length == 0
                                    ? 0
                                    : lodash.max(dataToTraverse)).toString() //Getting Max Value of Data Arr
                                : this.applyAggregation(dataToTraverse, yIndex, this.charts[graphId].aggregationFunctions
                                // ) // Getting Aggregated Value
                                ).toPrecision(2)),
                        };
                        //Applying After Aggregation Filter
                        let afterYresult = this.applyYfilter(genData, yIndex, graphId);
                        if (afterYresult != null) {
                            seriesData.push(afterYresult);
                        }
                    }
                });
                graphSeries.push({
                    name: selKey == null || this.charts[graphId].columns.length > 1
                        ? func != 'NO FUNCTION'
                            ? func + '(' + y + ')'
                            : y
                        : selKey,
                    color: this.charts[graphId].colors[yIndex],
                    graphId: graphId,
                    colIndex: yIndex,
                    level: this.charts[graphId].currLevel,
                    type: this.charts[graphId].graphTypes[yIndex] == 'stacked-bar' ||
                        this.charts[graphId].graphTypes[yIndex] == 'stacked-bar%'
                        ? 'bar'
                        : this.charts[graphId].graphTypes[yIndex] == 'stacked-column' ||
                            this.charts[graphId].graphTypes[yIndex] == 'stacked-column%'
                            ? 'column'
                            : this.charts[graphId].graphTypes[yIndex],
                    data: seriesData,
                });
            }
        });
        //Apply Sorting over series
        return this.applySort(graphId, graphSeries);
    }
    //To be checked
    applySort(graphId, data) {
        if (data == null) {
            return [];
        }
        if (this.charts[graphId].order == 1) {
            //Sort Data in descending order
            return lodash.map(data, (el) => {
                el.data = el.data.sort((d1, d2) => {
                    if (d1.y > d2.y) {
                        return -1;
                    }
                    return 1;
                });
                return el;
            });
        }
        else if (this.charts[graphId].order == -1) {
            //Sort Data in ascending order
            return lodash.map(data, (el) => {
                el.data = el.data.sort((d1, d2) => {
                    if (d1.y > d2.y) {
                        return 1;
                    }
                    return -1;
                });
                return el;
            });
        }
        else {
            return data.map((el) => {
                if (el.data.length > 0) {
                    let type = this.getVariableData(el.data[0][this.charts[graphId].rows[0]]);
                    if (type[0] == 'string' || type[0] == 'number') {
                        el.data = el.data.sort((d1, d2) => {
                            if (d1.name > d2.name) {
                                return 1;
                            }
                            else {
                                return -1;
                            }
                        });
                    }
                    else {
                        el.data = el.data.sort((d1, d2) => {
                            if (new Date(d1.name).getTime() > new Date(d2.name).getTime()) {
                                return 1;
                            }
                            else {
                                return -1;
                            }
                        });
                    }
                }
                return el;
            });
        }
    }
    getVariableData(input) {
        if (this.validateTime(input)) {
            let type = DataType.TIME;
            return [type];
        }
        else if (this.checkDate(input)) {
            let type = DataType.DATE;
            return [type];
        }
        else if (this.validateNumber(input)) {
            let type = DataType.NUMBER;
            return [type];
        }
        else {
            let type = DataType.STRING;
            return [type];
        }
    }
    getVariableTypeByHeader(header, format) {
        let formatExist = format.filter((format) => format.name.toLowerCase() == header.toLowerCase());
        if (formatExist.length > 0) {
            return {
                type: formatExist[0].type,
                format: formatExist[0].format,
            };
        }
        else {
            return {
                type: DataType.STRING,
                format: '',
            };
        }
    }
    validateTime(input) {
        let pattern1 = /^(1[0-2]|0?[1-9]):([0-5]?[0-9]):([0-5]?[0-9]) (●?[AP]M)?$/;
        let pattern2 = /^(1[0-2]|0?[1-9]):([0-5]?[0-9]):([0-5]?[0-9]) (●?[ap]m)?$/;
        let pattern3 = /^(1[0-2]|0?[1-9]):([0-5]?[0-9]) (●?[AP]M)?$/;
        let pattern4 = /^(1[0-2]|0?[1-9]):([0-5]?[0-9]) (●?[ap]m)?$/;
        let pattern5 = /^(2[0-3]|[01]?[0-9]):([0-5]?[0-9]):([0-5]?[0-9])$/;
        let pattern6 = /^(2[0-3]|[01]?[0-9]):([0-5]?[0-9])$/;
        return (pattern1.test(input) ||
            pattern2.test(input) ||
            pattern3.test(input) ||
            pattern4.test(input) ||
            pattern5.test(input) ||
            pattern6.test(input));
    }
    validateNumber(e) {
        const pattern2 = /^[-+]?[0-9]+\.[0-9]+$/;
        const pattern = /^[-+]?[0-9]+$/;
        return pattern.test(e) || pattern2.test(e);
    }
    checkDate(input) {
        const pattern = /^([0-2]\d|[3][0-1])\-([0]\d|[1][0-2])\-([2][01]|[1][6-9])\d{2}(\s([0-1]\d|[2][0-3])(\:[0-5]\d){1,2})?$/;
        return pattern.test(input);
    }
    addCustomVariable(customVariable, allData, addSlab = false, dataFormat, withoutAgg) {
        let resultantData = allData;
        if (!addSlab) {
            customVariable = customVariable.filter((variable) => !variable.is_slab);
        }
        lodash.forEach(customVariable, (variable, index) => {
            if (variable.is_filter) {
                //Check validity over all filters
                lodash.forEach(variable.filters, (filter) => {
                    let residingData = []; //Data where filter is not applicable
                    let filteredData = lodash.cloneDeep(resultantData); //Data where filter is applicable
                    let dataToTraverse = null;
                    if (filter.isCustomValue || !withoutAgg) {
                        lodash.forEach(filter.conditions, (condition, i) => {
                            let variableInfo = null;
                            switch (condition.operator) {
                                case FilterTypes.IN:
                                    [filteredData, residingData] = lodash.reduce(filteredData, (result, elData) => {
                                        if (!Object.keys(elData).includes(variable.name)) {
                                            elData[variable.name] = 0;
                                        }
                                        result[elData[condition.variable.name] != null && condition.comparativeVariables.includes(elData[condition.variable.name].toString())
                                            ? 0
                                            : 1].push(elData);
                                        return result;
                                    }, [[], []]);
                                    break;
                                case FilterTypes.NOT_IN:
                                    [filteredData, residingData] = lodash.reduce(filteredData, (result, elData) => {
                                        if (!Object.keys(elData).includes(variable.name)) {
                                            elData[variable.name] = 0;
                                        }
                                        result[elData[condition.variable.name] != null && !condition.comparativeVariables.includes(elData[condition.variable.name].toString())
                                            ? 0
                                            : 1].push(elData);
                                        return result;
                                    }, [[], []]);
                                    break;
                                case FilterTypes.LESS_THAN:
                                    [filteredData, residingData] = lodash.reduce(filteredData, (result, elData) => {
                                        if (!Object.keys(elData).includes(variable.name)) {
                                            elData[variable.name] = 0;
                                        }
                                        result[elData[condition.variable.name] != null && elData[condition.variable.name] <
                                            condition.comparativeVariables[0]
                                            ? 0
                                            : 1].push(elData);
                                        return result;
                                    }, [[], []]);
                                    break;
                                case FilterTypes.GREATER_THAN:
                                    [filteredData, residingData] = lodash.reduce(filteredData, (result, elData) => {
                                        if (!Object.keys(elData).includes(variable.name)) {
                                            elData[variable.name] = 0;
                                        }
                                        result[elData[condition.variable.name] != null && elData[condition.variable.name] >
                                            condition.comparativeVariables[0]
                                            ? 0
                                            : 1].push(elData);
                                        return result;
                                    }, [[], []]);
                                    break;
                                case FilterTypes.LESS_THAN_EQUAL:
                                    [filteredData, residingData] = lodash.reduce(filteredData, (result, elData) => {
                                        if (!Object.keys(elData).includes(variable.name)) {
                                            elData[variable.name] = 0;
                                        }
                                        result[elData[condition.variable.name] != null && elData[condition.variable.name] <=
                                            condition.comparativeVariables[0]
                                            ? 0
                                            : 1].push(elData);
                                        return result;
                                    }, [[], []]);
                                    break;
                                case FilterTypes.GREATER_THAN_EQUAL:
                                    [filteredData, residingData] = lodash.reduce(filteredData, (result, elData) => {
                                        if (!Object.keys(elData).includes(variable.name)) {
                                            elData[variable.name] = 0;
                                        }
                                        result[elData[condition.variable.name] != null && elData[condition.variable.name] >=
                                            condition.comparativeVariables[0]
                                            ? 0
                                            : 1].push(elData);
                                        return result;
                                    }, [[], []]);
                                    break;
                                case FilterTypes.EQUAL:
                                    [filteredData, residingData] = lodash.reduce(filteredData, (result, elData) => {
                                        if (!Object.keys(elData).includes(variable.name)) {
                                            elData[variable.name] = 0;
                                        }
                                        result[elData[condition.variable.name] != null && elData[condition.variable.name] ==
                                            condition.comparativeVariables[0]
                                            ? 0
                                            : 1].push(elData);
                                        return result;
                                    }, [[], []]);
                                    break;
                                case FilterTypes.BETWEEN_RANGE:
                                    [filteredData, residingData] = lodash.reduce(filteredData, (result, elData) => {
                                        if (!Object.keys(elData).includes(variable.name)) {
                                            elData[variable.name] = 0;
                                        }
                                        result[elData[condition.variable.name] != null && elData[condition.variable.name] >=
                                            condition.comparativeVariables[0] &&
                                            elData[condition.variable.name] <
                                                condition.comparativeVariables[1]
                                            ? 0
                                            : 1].push(elData);
                                        return result;
                                    }, [[], []]);
                                    break;
                                case FilterTypes.NOT_EQUAL:
                                    [filteredData, residingData] = lodash.reduce(filteredData, (result, elData) => {
                                        if (!Object.keys(elData).includes(variable.name)) {
                                            elData[variable.name] = 0;
                                        }
                                        result[elData[condition.variable.name] != null && elData[condition.variable.name] !=
                                            condition.comparativeVariables[0]
                                            ? 0
                                            : 1].push(elData);
                                        return result;
                                    }, [[], []]);
                                    break;
                                case FilterTypes.BEFORE:
                                    variableInfo = this.getVariableTypeByHeader(condition.variable.name, dataFormat);
                                    lodash.forEach(filteredData, (elData) => {
                                        let variableType = variableInfo.type;
                                        if (variableType == DataType.DATE) {
                                            if (this.getFormattedDate(elData[condition.variable.name], variableInfo.format).getTime() <
                                                new Date(condition.comparativeVariables[0]).getTime()) {
                                                filteredData.push(elData);
                                            }
                                            else {
                                                if (Object.keys(elData).indexOf(variable.name) == -1) {
                                                    elData[variable.name] = 0;
                                                }
                                                residingData.push(elData);
                                            }
                                        }
                                        else {
                                            let currSeconds = this.getFormattedDate(elData[condition.variable.name], variableInfo.format);
                                            let [hour, min] = condition.comparativeVariables[0]
                                                .split(':')
                                                .map((el) => parseInt(el));
                                            let comparedSec = hour * 60 * 60 + min * 60;
                                            if (currSeconds < comparedSec) {
                                                filteredData.push(elData);
                                            }
                                            else {
                                                if (Object.keys(elData).indexOf(variable.name) == -1) {
                                                    elData[variable.name] = 0;
                                                }
                                                residingData.push(elData);
                                            }
                                        }
                                    });
                                    break;
                                case FilterTypes.AFTER:
                                    variableInfo = this.getVariableTypeByHeader(condition.variable.name, dataFormat);
                                    lodash.forEach(filteredData, (elData) => {
                                        let variableType = variableInfo.type;
                                        if (variableType == DataType.DATE) {
                                            if (this.getFormattedDate(elData[condition.variable.name], variableInfo.format).getTime() >
                                                new Date(condition.comparativeVariables[0]).getTime()) {
                                                filteredData.push(elData);
                                            }
                                            else {
                                                if (Object.keys(elData).indexOf(variable.name) == -1) {
                                                    elData[variable.name] = 0;
                                                }
                                                residingData.push(elData);
                                            }
                                        }
                                        else {
                                            let currSeconds = this.getFormattedDate(elData[condition.variable.name], variableInfo.format);
                                            let [hour, min] = condition.comparativeVariables[0]
                                                .split(':')
                                                .map((el) => parseInt(el));
                                            let comparedSec = hour * 60 * 60 + min * 60;
                                            if (currSeconds > comparedSec) {
                                                filteredData.push(elData);
                                            }
                                            else {
                                                if (Object.keys(elData).indexOf(variable.name) == -1) {
                                                    elData[variable.name] = 0;
                                                }
                                                residingData.push(elData);
                                            }
                                        }
                                    });
                                    break;
                                case '<>':
                                    variableInfo = this.getVariableTypeByHeader(condition.variable.name, dataFormat);
                                    lodash.forEach(filteredData, (elData) => {
                                        let variableType = variableInfo.type;
                                        if (variableType == 'date') {
                                            let varDate = this.getFormattedDate(elData[condition.variable.name], variableInfo.format).getTime();
                                            if (varDate >=
                                                new Date(condition.comparativeVariables[0]).getTime() &&
                                                varDate <
                                                    new Date(condition.comparativeVariables[1]).getTime()) {
                                                filteredData.push(elData);
                                            }
                                            else {
                                                if (Object.keys(elData).includes(variable.name)) {
                                                    elData[variable.name] = 0;
                                                }
                                                residingData.push(elData);
                                            }
                                        }
                                        else {
                                            let currSeconds = this.getFormattedDate(elData[condition.variable.name], variableInfo.format);
                                            let [hour, min] = condition.comparativeVariables[0]
                                                .split(':')
                                                .map((el) => parseInt(el));
                                            let [endhour, endmin] = condition.comparativeVariables[1]
                                                .split(':')
                                                .map((el) => parseInt(el));
                                            let comparedSec = hour * 60 * 60 + min * 60;
                                            let endcomparedSec = endhour * 60 * 60 + endmin * 60;
                                            if (currSeconds >= comparedSec &&
                                                currSeconds < endcomparedSec) {
                                                filteredData.push(elData);
                                            }
                                            else {
                                                if (Object.keys(elData).includes(variable.name)) {
                                                    elData[variable.name] = 0;
                                                }
                                                residingData.push(elData);
                                            }
                                        }
                                    });
                                    break;
                            }
                        });
                        if (filter.isCustomValue) {
                            //Insert custom value
                            let value = this.validateNumber(filter.values)
                                ? parseFloat(filter.values)
                                : filter.values;
                            resultantData = [
                                ...lodash.map(filteredData, (d) => ({
                                    ...d,
                                    [variable.name]: value,
                                })),
                                ...residingData,
                            ];
                        }
                        else {
                            //Insert calculated value
                            dataToTraverse = lodash.without(lodash.map(filteredData, filter.values), undefined);
                            let value = filter.aggregationFunction == 'NO FUNCTION'
                                ? null
                                : this.getAggregatedValueOfCustomVariable(dataToTraverse, filter);
                            resultantData = [
                                ...lodash.map(filteredData, (d) => ({
                                    ...d,
                                    [variable.name]: value == null ? d[filter.values] : value,
                                })),
                                ...residingData,
                            ];
                        }
                    }
                    else {
                        resultantData = lodash.cloneDeep(filteredData);
                    }
                });
            }
            else {
                //Based on Operation
                if (variable.operation[0].isAggregation && !withoutAgg) {
                    //Custom Variable Contain Aggregated Value
                    resultantData = this.getCustomVariableValueAggregated(variable, resultantData);
                }
                else {
                    //Custom Variable Contain Non-Aggregated Value
                    resultantData = lodash.map(resultantData, (d) => ({
                        ...d,
                        [variable.name]: this.getCustomVariableValue(variable, d),
                    }));
                }
            }
        });
        return resultantData;
    }
    getAggregatedValueOfCustomVariable(allData, filter) {
        let result = 0;
        switch (filter.aggregationFunction) {
            case "SUM" /* SUM */:
                result = lodash.sum(allData.map(Number));
                break;
            case "COUNT_UNIQUE" /* COUNT_UNIQUE */:
                result = lodash.uniq(allData).length;
                break;
            case "COUNT" /* COUNT */:
                result = allData.length;
                break;
            case "MAXIMUM" /* MAXIMUM */:
                result = lodash.max(allData.map(Number)) ?? 0;
                break;
            case "MINIMUM" /* MINIMUM */:
                result = lodash.min(allData.map(Number)) ?? 0;
                break;
            case "AVERAGE" /* AVERAGE */:
                result = lodash.mean(allData.map(Number)) ?? 0;
                break;
        }
        return result;
    }
    getCustomVariableValue(variable, data) {
        let tempArr = variable.formula.trim().split(' ');
        tempArr = tempArr.map((el) => {
            let allkeys = Object.keys(data);
            if (allkeys.indexOf(el.replaceAll('_', ' ')) != -1) {
                if (data[el.replaceAll('_', ' ')] == '' ||
                    data[el.replaceAll('_', ' ')] == null) {
                    el = 0;
                }
                else {
                    el = new BigNumber(data[el.replaceAll('_', ' ')]);
                }
            }
            else {
                if (el.indexOf('_') != -1) {
                    el = 0;
                }
            }
            return el;
        });
        return eval(tempArr.join(' '));
    }
    getCustomVariableValueAggregated(variable, data) {
        let tempArr = variable.formula.trim().split(' ');
        tempArr = lodash.map(tempArr, (el) => {
            let allkeys = Object.keys(data[0]);
            if (allkeys.indexOf(el.replaceAll('_', ' ')) != -1) {
                let key = el.replaceAll('_', ' ');
                let dataToTraverse = lodash.map(data, key);
                dataToTraverse = lodash.without(dataToTraverse, '0');
                el = new BigNumber((dataToTraverse.length == 0
                    ? 0
                    : lodash.max(dataToTraverse)));
            }
            else {
                if (el.indexOf('_') != -1) {
                    el = 0;
                }
            }
            return el;
        });
        let value = eval(tempArr.join(' '));
        return lodash.map(data, (d) => ({
            ...d,
            [variable.name]: value,
        }));
    }
    //trends Data
    buildTrend(trendData) {
        //Set TrendsObject with GraphId
        this.trends[trendData.graphId] = trendData;
        this.trends[trendData.graphId].graphData = this.trends[trendData.graphId].graphData.filter((d) => this.applyCustomFilter(d, this.trends[trendData.graphId].filter));
        this.initTrend(trendData.graphId);
    }
    async initTrend(graphId) {
        //Creating Chart Raw Json
        const trendData = await this.createTrendData(graphId);
        //Rendering Chart of GraphId
        Highcharts.chart(graphId, trendData);
        // this.addActionBtnTrends(graphId);
        return true;
    }
    getWeeks(startDate, endDate) {
        let weeks = [];
        //Get Weeks from given date Range
        while (startDate <= endDate) {
            let temp = new Date(startDate);
            temp.setDate(temp.getDate() + 6);
            weeks.push(this.convertDate(startDate) + ' - ' + this.convertDate(temp));
            startDate = temp;
        }
        return weeks;
    }
    getQuarters(startDate, endDate) {
        let quatars = [];
        //Get Quarters from given date Range
        while (startDate <= endDate) {
            let temp = new Date(startDate);
            temp.setMonth(temp.getMonth() + 2);
            quatars.push(this.convertDate(startDate) + ' - ' + this.convertDate(temp));
            startDate = temp;
        }
        return quatars;
    }
    convertDate(inputDate) {
        let date = inputDate.getDate();
        let month = inputDate.getMonth();
        let year = inputDate.getFullYear();
        //Get Date in Formatted String
        return (String(date).padStart(2, '0') +
            '-' +
            String(month + 1).padStart(2, '0') +
            '-' +
            String(year).padStart(4, '0'));
    }
    getPlotOptionsTrends(graphId) {
        let plotOptions = {
            series: {
                turboThreshold: 10000,
                dataLabels: {
                    color: 'black',
                    enabled: true,
                    style: {
                        color: 'black',
                        textShadow: false,
                        textDecoration: 'none',
                    },
                },
                label: {
                    style: {
                        color: 'black',
                    },
                },
            },
        };
        //Options for Stack Graph
        // if (this.trends[graphId].columns.indexOf("%") == -1) {
        //   //Add Percent Sign after y-axis values
        //   plotOptions.series.dataLabels['formatter'] = function () {
        //     return this.percentage.toFixed(2) + ' %';
        //   };
        // }
        return plotOptions;
    }
    createTrendData(graphId) {
        let _self = this;
        //Getting Plot Options for Graph
        const plotOptions = this.getPlotOptionsTrends(graphId);
        const seriesData = this.getSeriesData(this.trends[graphId].graphData, this.trends[graphId].graphId);
        return {
            credits: {
                text: this.creditTitle,
                href: this.creditUrl,
                style: {
                    fontSize: '12px',
                },
            },
            title: null,
            plotOptions: plotOptions,
            chart: {
                type: 'line',
                events: {
                    //Handle Drilldown Event of Graph
                    drilldown: function (e) {
                        if (e.points != false)
                            return;
                        let currGraphId = e.target.userOptions.series[0].graphId; //GraphId
                        let comparisonKey = e.point.options.comparisonKey; //ColorIndex of bar
                        let chart = this;
                        chart.showLoading('Loading...');
                        let selKey = e.point.name;
                        let rangeData = [];
                        if (comparisonKey != null) {
                            let comparisonData = lodash.groupBy(_self.trends[currGraphId].graphData, _self.trends[currGraphId].rows);
                            rangeData = _self.getRangeObj(comparisonData[comparisonKey], _self.trends[currGraphId].rangeFilter, _self.trends[currGraphId].range.startDate, _self.trends[currGraphId].range.endDate, _self.trends[currGraphId].dateVariable, _self.trends[currGraphId].rows, _self.trends[currGraphId].filter, currGraphId);
                        }
                        else {
                            rangeData = _self.getRangeObj(_self.trends[currGraphId].graphData, _self.trends[currGraphId].rangeFilter, _self.trends[currGraphId].range.startDate, _self.trends[currGraphId].range.endDate, _self.trends[currGraphId].dateVariable, _self.trends[currGraphId].rows, _self.trends[currGraphId].filter, currGraphId);
                        }
                        _self.dataService.setModalData({
                            colToView: _self.trends[currGraphId].lastLevelColumns,
                            refData: rangeData[selKey]
                        });
                        let modalOptions = {
                            panelClass: 'dataPopup-modal',
                            backdropClass: 'modal-backdrop',
                        };
                        _self.dialog.open(DataPopupComponent, modalOptions);
                        return;
                    },
                },
            },
            xAxis: {
                type: 'category',
                labels: {
                    style: {
                        color: 'red',
                        textDecoration: 'none',
                        textOutline: '0px',
                    },
                },
                min: 0,
                allowDecimals: false,
                scrollbar: {
                    enabled: true,
                },
            },
            yAxis: [
                {
                    opposite: true,
                    title: {
                        text: null,
                    },
                },
            ],
            series: seriesData,
        };
    }
    getSeriesData(data, graphId) {
        let series = [];
        if (this.trends[graphId].comparison.length > 0) {
            //Multi-line Trends for Comparison
            let finalData = this.getComparisonData(this.trends[graphId].comparison, this.trends[graphId].graphData, this.trends[graphId].rows, this.trends[graphId].rangeFilter, this.trends[graphId].range.startDate, this.trends[graphId].range.endDate, this.trends[graphId].dateVariable, this.trends[graphId].filter, graphId);
            Object.keys(finalData).forEach(key => {
                let rangeData = [];
                Object.keys(finalData[key]).forEach(key2 => {
                    let tempData = finalData[key][key2];
                    if (tempData.length > 0) {
                        tempData = this.addCustomVariable(this.trends[graphId].customVariable, tempData, false, this.trends[graphId].dataFormat, false);
                        const encounteredValues = tempData.length
                            ? lodash.map(tempData, this.trends[graphId].columns)
                            : [];
                        const dataToTraverse = lodash.without(lodash.without(encounteredValues, '0'), '');
                        rangeData.push({
                            name: key2,
                            drilldown: true,
                            dataLabels: {
                                shadow: false,
                                style: {
                                    color: 'black',
                                    textDecoration: 'none',
                                    textShadow: false,
                                    textOutline: 0,
                                },
                                className: 'graph-data-label',
                            },
                            comparisonKey: key,
                            y: tempData.length
                                ? parseFloat(
                                // new Decimal(
                                this.trends[graphId].aggregationFunctions
                                    .aggregationFunctions ==
                                    "NO FUNCTION" /* NO_FUNCTION */
                                    ? parseFloat(dataToTraverse.length == 0
                                        ? 0
                                        : lodash.max(dataToTraverse)).toString()
                                    : this.applyAggregation(encounteredValues, 0, [
                                        this.trends[graphId].aggregationFunctions,
                                    ]).toPrecision(2))
                                // )
                                : 0,
                        });
                    }
                });
                series.push({
                    name: key +
                        '-' +
                        this.trends[graphId].aggregationFunctions.aggregationFunctions +
                        '(' +
                        this.trends[graphId].columns +
                        ')',
                    type: 'line',
                    graphId: graphId,
                    data: rangeData,
                    comparisonKey: key
                });
            });
        }
        else {
            let finalData = this.getRangeObj(this.trends[graphId].graphData, this.trends[graphId].rangeFilter, this.trends[graphId].range.startDate, this.trends[graphId].range.endDate, this.trends[graphId].dateVariable, this.trends[graphId].rows, this.trends[graphId].filter, graphId);
            let rangeData = [];
            Object.keys(finalData).forEach(key => {
                let tempData = finalData[key];
                if (tempData.length > 0) {
                    tempData = this.addCustomVariable(this.trends[graphId].customVariable, tempData, false, this.trends[graphId].dataFormat, false);
                    const encounteredValues = tempData.length
                        ? lodash.map(tempData, this.trends[graphId].columns)
                        : [];
                    const dataToTraverse = lodash.without(lodash.without(encounteredValues, '0'), '');
                    rangeData.push({
                        name: key,
                        drilldown: true,
                        dataLabels: {
                            shadow: false,
                            style: {
                                color: 'black',
                                textDecoration: 'none',
                                textShadow: false,
                                textOutline: 0,
                            },
                            className: 'graph-data-label',
                        },
                        comparisonKey: null,
                        y: tempData.length
                            ? parseFloat(
                            // new Decimal(
                            this.trends[graphId].aggregationFunctions
                                .aggregationFunctions ==
                                "NO FUNCTION" /* NO_FUNCTION */
                                ? parseFloat(dataToTraverse.length == 0
                                    ? 0
                                    : lodash.max(dataToTraverse)).toString()
                                : this.applyAggregation(encounteredValues, 0, [
                                    this.trends[graphId].aggregationFunctions,
                                ]).toPrecision(2))
                            // )
                            : 0,
                    });
                }
            });
            series.push({
                name: this.trends[graphId].aggregationFunctions.aggregationFunctions +
                    '(' +
                    this.trends[graphId].columns +
                    ')',
                type: 'line',
                graphId: graphId,
                comparisonKey: null,
                data: rangeData
            });
        }
        return series;
    }
    getComparisonData(comparison, data, xAxis, rangeFilter, startDate, endDate, dateVariable, filter, graphId) {
        let comparisonKey = xAxis;
        let comparisonData = lodash.groupBy(data, comparisonKey);
        let finalRes = {};
        Object.keys(comparisonData).forEach(key => {
            if (comparison.indexOf(key) != -1) {
                let rangeObj = this.getRangeObj(comparisonData[key], rangeFilter, startDate, endDate, dateVariable, xAxis, filter, graphId);
                finalRes[key] = rangeObj;
            }
        });
        return finalRes;
    }
    getRangeObj(data, rangeFilter, startDate, endDate, dateVariable, xAxis, filter, graphId) {
        let rangeObj = {};
        let sortedMap = {};
        let sortedKey = [];
        let filteredData = [];
        switch (rangeFilter) {
            case RangeFilter.DAILY:
                data.forEach((d) => {
                    let dateValue = d[dateVariable].split(" ")[0];
                    d["***date***"] = dateValue;
                    if (this.applyDataFilterTrends(d, filter, xAxis, graphId)) {
                        filteredData.push(d);
                    }
                });
                rangeObj = lodash.groupBy(data, "***date***");
                sortedKey = Object.keys(rangeObj).sort((a, b) => {
                    let dateA = this.getFormattedDate(a, DateFormat.DD_MM_YYYY);
                    let dateB = this.getFormattedDate(b, DateFormat.DD_MM_YYYY);
                    return dateA - dateB;
                });
                sortedKey.forEach(key => {
                    sortedMap[key] = rangeObj[key];
                });
                break;
            case RangeFilter.WEEKLY:
                let allWeeks = this.getWeeks(startDate, endDate);
                data.forEach((d) => {
                    let variableDate = this.getFormattedDate(d[dateVariable]);
                    let selWeek = allWeeks.filter(week => {
                        let [startRange, endRange] = week.split(" - ");
                        startRange = this.getFormattedDate(startRange, DateFormat.DD_MM_YYYY);
                        endRange = this.getFormattedDate(endRange, DateFormat.DD_MM_YYYY);
                        if (variableDate.getTime() >= startRange.getTime() && variableDate.getTime() <= endRange.getTime()) {
                            return true;
                        }
                        return false;
                    });
                    if (selWeek.length > 0) {
                        d.put("***week***", selWeek[0]);
                    }
                    else {
                        d.put("***week***", "");
                    }
                    if (this.applyDataFilterTrends(d, filter, xAxis, graphId)) {
                        filteredData.push(d);
                    }
                });
                rangeObj = lodash.groupBy(data, "***week***");
                sortedKey = Object.keys(rangeObj).sort((a, b) => {
                    let dateA = this.getFormattedDate(a.split(" - ")[0], DateFormat.DD_MM_YYYY);
                    let dateB = this.getFormattedDate(b.split(" - ")[0], DateFormat.DD_MM_YYYY);
                    return dateA - dateB;
                });
                sortedKey.forEach(key => {
                    sortedMap[key] = rangeObj[key];
                });
                break;
            case RangeFilter.MONTHLY:
                data.forEach((d) => {
                    let dateValue = d[dateVariable].split(" ")[0];
                    dateValue = dateValue.split("-")[1] + dateValue.split("-")[2];
                    d["***month***"] = dateValue;
                    if (this.applyDataFilterTrends(d, filter, xAxis, graphId)) {
                        filteredData.push(d);
                    }
                });
                rangeObj = lodash.groupBy(data, "***month***");
                sortedKey = Object.keys(rangeObj).sort((a, b) => {
                    let [dateAMonth, dateAYear] = a.split("-");
                    let [dateBMonth, dateBYear] = b.split("-");
                    return dateAYear == dateBYear ? (parseInt(dateAMonth) - parseInt(dateBMonth)) : (parseInt(dateAYear) - parseInt(dateBYear));
                });
                sortedKey.forEach(key => {
                    sortedMap[key] = rangeObj[key];
                });
                break;
            case RangeFilter.QUARTERLY:
                let allQuartars = this.getQuarters(startDate, endDate);
                data.forEach((d) => {
                    let variableDate = this.getFormattedDate(d[dateVariable]);
                    let selQuartar = allQuartars.filter(quartar => {
                        let [startRange, endRange] = quartar.split(" - ");
                        startRange = this.getFormattedDate(startRange, DateFormat.DD_MM_YYYY);
                        endRange = this.getFormattedDate(endRange, DateFormat.DD_MM_YYYY);
                        if (variableDate.getTime() >= startRange.getTime() && variableDate.getTime() <= endRange.getTime()) {
                            return true;
                        }
                        return false;
                    });
                    if (selQuartar.length > 0) {
                        d.put("***quatar***", selQuartar[0]);
                    }
                    else {
                        d.put("***quatar***", "");
                    }
                    if (this.applyDataFilterTrends(d, filter, xAxis, graphId)) {
                        filteredData.push(d);
                    }
                });
                rangeObj = lodash.groupBy(data, "***quatar***");
                sortedKey = Object.keys(rangeObj).sort((a, b) => {
                    let dateA = this.getFormattedDate(a.split(" - ")[0], DateFormat.DD_MM_YYYY);
                    let dateB = this.getFormattedDate(b.split(" - ")[0], DateFormat.DD_MM_YYYY);
                    return dateA - dateB;
                });
                sortedKey.forEach(key => {
                    sortedMap[key] = rangeObj[key];
                });
                break;
            case RangeFilter.YEARLY:
                data.forEach((d) => {
                    let dateValue = d[dateVariable].split(" ")[2];
                    d["***year***"] = dateValue;
                    if (this.applyDataFilterTrends(d, filter, xAxis, graphId)) {
                        filteredData.push(d);
                    }
                });
                rangeObj = lodash.groupBy(data, "***year***");
                sortedKey = Object.keys(rangeObj).sort((a, b) => {
                    let dateAYear = a;
                    let dateBYear = b;
                    return (parseInt(dateAYear) - parseInt(dateBYear));
                });
                sortedKey.forEach(key => {
                    sortedMap[key] = rangeObj[key];
                });
                break;
        }
        return sortedMap;
    }
    applyDataFilterTrends(data, filter, xAxis, graphId) {
        let selXFilter = filter.xAxis.filter(f => f.variableName == xAxis);
        let isValid = selXFilter.length == 0;
        if (selXFilter.length > 0) {
            let filterToApply = selXFilter[0];
            let values = filterToApply.values;
            let dataValue = data[filterToApply.variableName];
            let variableType = filterToApply.variableType;
            switch (filterToApply.filterType) {
                case "IN":
                    if (values.includes(dataValue.toString())) {
                        isValid = true;
                    }
                    break;
                case "NOT IN":
                    if (!values.includes(dataValue.toString())) {
                        isValid = true;
                    }
                    break;
                case ">":
                    if (dataValue > values[0]) {
                        isValid = true;
                    }
                    break;
                case "<":
                    if (dataValue < values[0]) {
                        isValid = true;
                    }
                    break;
                case ">=":
                    if (dataValue >= values[0]) {
                        isValid = true;
                    }
                    break;
                case "<=":
                    if (dataValue <= values) {
                        isValid = true;
                    }
                    break;
                case "==":
                    if (dataValue == values) {
                        isValid = true;
                    }
                    break;
                case "!=":
                    if (dataValue != values[0]) {
                        isValid = false;
                    }
                    break;
                case "bet":
                    if (dataValue >= values[0] && dataValue < values[1]) {
                        isValid = true;
                    }
                    break;
                case FilterTypes.BEFORE:
                    if (variableType == DataType.DATE) {
                        let operand1 = this.getFormattedDate(dataValue, filterToApply.format);
                        let operand2 = new Date(values[0]);
                        if (operand1 < operand2) {
                            isValid = true;
                        }
                    }
                    else {
                        let currSeconds = this.getFormattedDate(dataValue, filterToApply.format);
                        let [hour, min] = values[0]
                            .split(':')
                            .map((el) => parseInt(el));
                        let comparedSec = hour * 60 * 60 + min * 60;
                        if (currSeconds < comparedSec) {
                            isValid = true;
                        }
                    }
                    break;
                case FilterTypes.AFTER:
                    if (variableType == DataType.DATE) {
                        let operand1 = this.getFormattedDate(dataValue, filterToApply.format);
                        let operand2 = new Date(values[0]);
                        if (operand1 > operand2) {
                            isValid = true;
                        }
                    }
                    else {
                        let currSeconds = this.getFormattedDate(dataValue, filterToApply.format);
                        let [hour, min] = values[0]
                            .split(':')
                            .map((el) => parseInt(el));
                        let comparedSec = hour * 60 * 60 + min * 60;
                        if (currSeconds > comparedSec) {
                            isValid = true;
                        }
                    }
                    break;
                case FilterTypes.BETWEEN:
                    if (variableType == DataType.DATE) {
                        let operand1 = this.getFormattedDate(dataValue, filterToApply.format);
                        let operand2 = new Date(values[0]);
                        let operand3 = new Date(values[1]);
                        if (operand1 >= operand2 && operand1 < operand3) {
                            isValid = true;
                        }
                    }
                    else {
                        let currSeconds = this.getFormattedDate(dataValue, filterToApply.format);
                        let [hour, min] = values[0]
                            .split(':')
                            .map((el) => parseInt(el));
                        let [endhour, endmin] = values[1]
                            .split(':')
                            .map((el) => parseInt(el));
                        let comparedSec = hour * 60 * 60 + min * 60;
                        let endComparedSec = endhour * 60 * 60 + endmin * 60;
                        if (currSeconds >= comparedSec &&
                            currSeconds < endComparedSec) {
                            isValid = true;
                        }
                    }
                    break;
            }
        }
        // if (isValid && filter.customFilter.length > 0) {
        //     isValid = this.applyCustomFilter(data, filter);
        // }
        return isValid;
    }
}
XSightsCoreService.ɵfac = i0.ɵɵngDeclareFactory({ minVersion: "12.0.0", version: "13.0.3", ngImport: i0, type: XSightsCoreService, deps: [{ token: i1$1.NgbModal }, { token: i1$1.NgbModalConfig }, { token: DataService }], target: i0.ɵɵFactoryTarget.Injectable });
XSightsCoreService.ɵprov = i0.ɵɵngDeclareInjectable({ minVersion: "12.0.0", version: "13.0.3", ngImport: i0, type: XSightsCoreService, providedIn: 'root' });
i0.ɵɵngDeclareClassMetadata({ minVersion: "12.0.0", version: "13.0.3", ngImport: i0, type: XSightsCoreService, decorators: [{
            type: Injectable,
            args: [{
                    providedIn: 'root',
                }]
        }], ctorParameters: function () { return [{ type: i1$1.NgbModal }, { type: i1$1.NgbModalConfig }, { type: DataService }]; } });

class XSightsCoreComponent {
    constructor() { }
    ngOnInit() {
    }
}
XSightsCoreComponent.ɵfac = i0.ɵɵngDeclareFactory({ minVersion: "12.0.0", version: "13.0.3", ngImport: i0, type: XSightsCoreComponent, deps: [], target: i0.ɵɵFactoryTarget.Component });
XSightsCoreComponent.ɵcmp = i0.ɵɵngDeclareComponent({ minVersion: "12.0.0", version: "13.0.3", type: XSightsCoreComponent, selector: "lib-x-sights-core", ngImport: i0, template: `
    <p>
      x-sights-core works!
    </p>
  `, isInline: true });
i0.ɵɵngDeclareClassMetadata({ minVersion: "12.0.0", version: "13.0.3", ngImport: i0, type: XSightsCoreComponent, decorators: [{
            type: Component,
            args: [{
                    selector: 'lib-x-sights-core',
                    template: `
    <p>
      x-sights-core works!
    </p>
  `,
                    styles: []
                }]
        }], ctorParameters: function () { return []; } });

class XSightsPublicDashboardComponent {
    constructor(dataService, xsights) {
        this.dataService = dataService;
        this.xsights = xsights;
        this.dashboardUrl = '';
        this.adminId = 0;
        this.dashboardLoaded = new EventEmitter();
        this.mtrSource = '138';
        this.decodedParams = {};
        this.dashboardData = null;
        this.filters = [];
        this.dropdownSettings = {};
        this.tableDatas = {};
        this.dumpData = [];
    }
    ngOnInit() {
        // this.decodeUrl();
        this.dropdownSettings = {
            singleSelection: false,
            enableCheckAll: false,
            allowSearchFilter: true,
        };
    }
    ngOnChanges(changes) {
        //Called before any other lifecycle hook. Use it to inject dependencies, but avoid any serious work here.
        //Add '${implements OnChanges}' to the class.
        if (changes['dashboardUrl'].previousValue !=
            changes['dashboardUrl'].currentValue ||
            changes['adminId'].previousValue != changes['adminId'].currentValue) {
            this.decodeUrl();
        }
    }
    checkDashboardLoading() {
        const elements = document.querySelectorAll('.lds-ellipsis');
        console.log(elements.length);
        if (elements.length == 0) {
            this.dashboardLoaded.emit({
                isLoaded: true,
            });
        }
    }
    decodeUrl() {
        this.dataService.getDecodedUrl(this.dashboardUrl).then((res) => {
            const urlParamsStr = res.data[0].split('?')[1];
            const urlParamsArr = urlParamsStr.split('&');
            urlParamsArr.forEach((param) => {
                this.decodedParams[param.split('=')[0]] = param.split('=')[1];
            });
            this.getSharedDashboard();
        });
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
    getSharedDashboard() {
        this.adminId = this.decodedParams.foAdminId;
        let params = '?dash_id=' +
            this.decodedParams.dash_id +
            '&fileId=' +
            this.decodedParams.fileId;
        this.dataService
            .getSharedDashboard(params, this.adminId)
            .then((res) => {
            this.filters = res.data[0].filters;
            res.data[0].graphs = res.data[0].graphs.sort(this.setGraphOrder);
            this.dashboardData = res.data[0];
            this.dataService
                .getSharedDashboardData(this.dashboardData.id, this.adminId)
                .then((res) => {
                // //console.log(res);
                this.dumpData = res;
                lodash.forEach(this.dashboardData.graphs, (graph) => {
                    if (graph.graphType != 2) {
                        let dataIndex = res.findIndex((d) => d.chartId == 'graph-' + graph.graph_id);
                        let graphD = typeof res[dataIndex].data != "object"
                            ? res[res[dataIndex].data].data
                            : res[dataIndex].data;
                        if (dataIndex != -1) {
                            this.filters = lodash.map(this.filters, (filter) => {
                                if (filter.sourceId.toString() == graph.sourceid.toString()) {
                                    filter.values = Object.keys(lodash.groupBy(graphD, filter.fieldName)).map((key, index) => ({
                                        id: index,
                                        text: key,
                                    }));
                                    filter.selValues = [];
                                }
                                return filter;
                            });
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
                                tempGraphData = this.dataService.keyConverter(tempGraphData, res[dataIndex].columns, 1);
                            }
                            this.buildChart(graph, graphD, tempGraphData);
                        }
                    }
                });
            });
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
    buildChart(widgetData, data, tempData) {
        let _self = this;
        return new Promise(async (resolve, reject) => {
            data = this.filterData(data, widgetData.sourceid.toString());
            // data = this.filterData(data, widgetData.sourceid);
            if (widgetData.graphType == 1) {
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
                    range: {
                        startDate: widgetData.graph_structure.startDate,
                        endDate: widgetData.graph_structure.endDate,
                    },
                    dateVariable: tempData.dateVariable,
                    rangeFilter: widgetData.graph_structure.rangeFilter,
                    comparison: widgetData.graph_structure.comparison ?? [],
                    customVariable: tempData.customVariable,
                    dataFormat: tempData.dataFormat ?? [],
                    lastLevelColumns: tempData.lastLevelColumns ?? [],
                };
                let response = await _self.xsights.build(WidgetType$1.TREND, graphData);
                resolve(response);
                _self.checkDashboardLoading();
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
                _self.tableDatas['table-graph-' + widgetData.graph_id] =
                    await _self.xsights.build(WidgetType$1.PIVOT_TABLE, tableData);
                resolve(true);
                setTimeout(() => {
                    _self.checkDashboardLoading();
                }, 500);
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
                let response = await this.xsights.build(WidgetType$1.GRAPH, graphdata);
                resolve(response);
                _self.checkDashboardLoading();
            }
        });
    }
    async filteredDashboard() {
        for (const element of this.dashboardData.graphs) {
            const graph = element;
            let res = null;
            if (graph.graphType != 2) {
                let dataIndex = this.dumpData.findIndex((d) => d.chartId == 'graph-' + graph.graph_id);
                res = this.dumpData[dataIndex].data;
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
                    tempGraphData = this.dataService.keyConverter(tempGraphData, this.dumpData[dataIndex].columns, 1);
                }
                this.buildChart(graph, res, tempGraphData);
            }
        }
    }
}
XSightsPublicDashboardComponent.ɵfac = i0.ɵɵngDeclareFactory({ minVersion: "12.0.0", version: "13.0.3", ngImport: i0, type: XSightsPublicDashboardComponent, deps: [{ token: DataService }, { token: XSightsCoreService }], target: i0.ɵɵFactoryTarget.Component });
XSightsPublicDashboardComponent.ɵcmp = i0.ɵɵngDeclareComponent({ minVersion: "12.0.0", version: "13.0.3", type: XSightsPublicDashboardComponent, selector: "x-sights-public-dashboard", inputs: { dashboardUrl: "dashboardUrl", adminId: "adminId" }, outputs: { dashboardLoaded: "dashboardLoaded" }, usesOnChanges: true, ngImport: i0, template: "<div *ngIf=\"dashboardData !=null\">\n    <div class=\"dash_graph_sec\">\n        <div class=\"dash_graph dashboard-wrapper\">\n            <div>\n                <h3 class=\"graph_name\" style=\"height: 44px;\">{{dashboardData.dashboard_name}} </h3>\n            </div>\n            <div class=\"filter-container\" *ngIf=\"filters.length\">\n                <h3>Filters:</h3>\n                <div class=\"col-lg-12 row\">\n                    <div class=\"col-lg-3\" *ngFor=\"let filter of filters;let i=index\"> <ng-multiselect-dropdown [placeholder]=\"'Select ' + filter.fieldName + '...'\" [(ngModel)]=\"filter.selValues\" (onSelect)=\"filteredDashboard()\"\n                            (onDeSelect)=\"filteredDashboard()\" [settings]=\"dropdownSettings\" [data]=\"filter.values\">\n                        </ng-multiselect-dropdown> </div>\n                </div>\n            </div>\n            <div class=\"row graph_design\" id=\"dashboardScreen\"> \n                <ng-container *ngFor=\"let graph of dashboardData?.graphs;let i=index;\">\n                    <!-- <div class=\"page-break\" *ngIf=\"i % 5 == 0 && i != 0\"></div> -->\n                    <ng-container *ngIf=\"graph.graphType != 3 && graph.graphType != 2\">\n                        <div class=\"dashboard-graph\"\n                            [ngClass]=\"{'col-lg-12': graph.graph_index == 1,'col-lg-6': graph.graph_index == 2,'col-lg-4': graph.graph_index == 3,'col-lg-3': graph.graph_index == 4}\"\n                            style=\"min-height: 370px; padding: 0px;\"> <!-- loader start -->\n                            <h3 *ngIf=\"graph.graph_structure.xAxis[0] != '***LABEL***'\" style=\"text-align: center; background-color: #eee; padding: 2px;\">{{graph.graphname}}</h3>\n                            <div [id]=\"'graph-'+ graph.graph_id\" style=\"position: relative; padding: 10px; padding-top: 45px;\">\n                                <div class=\"lds-ellipsis\">\n                                    <div></div>\n                                    <div></div>\n                                    <div></div>\n                                    <div></div>\n                                </div> <!-- loader end -->\n                            </div>\n                        </div>\n                    </ng-container>\n                    <!-- <div *ngIf=\"graph.graphType !=3 && graph.graphType !=2\" class=\"dashboard-graph\" [id]=\"'graph-'+\n                        graph.graph_id\" [ngClass]=\"{'col-lg-12': graph.graph_index==1,'col-lg-6':\n                        graph.graph_index==2,'col-lg-4': graph.graph_index==3,'col-lg-3': graph.graph_index==4}\"\n                        style=\"min-height: 370px; display: flex;\"> \n                        <div class=\"lds-ellipsis\">\n                            <div></div>\n                            <div></div>\n                            <div></div>\n                            <div></div>\n                        </div> \n                    </div> -->\n                    <div *ngIf=\"graph.graphType==2\" class=\"dashboard-graph\" [id]=\"'table-graph-'+ graph.graph_id\"\n                        [ngClass]=\"{'col-lg-12':\n                        graph.graph_index==1,'col-lg-6': graph.graph_index==2,'col-lg-4':\n                        graph.graph_index==3,'col-lg-3': graph.graph_index==4}\" style=\"display: flex;\n                        flex-direction: column; border-bottom: 0px; background-color:antiquewhite;\">\n                        <!-- loader start -->\n                        <h2 style=\"text-align: center; margin-bottom: 0px;\">\n                            {{graph.graphname}}</h2> <!-- loader end -->\n                    </div>\n                    <div *ngIf=\"graph.graphType==3\" class=\"dashboard-graph\" [id]=\"'table-graph-'+\n                        graph.graph_id\" [ngClass]=\"{'col-lg-12': graph.graph_index==1,'col-lg-6':\n                        graph.graph_index==2,'col-lg-4': graph.graph_index==3,'col-lg-3': graph.graph_index==4}\"\n                        style=\"min-height: 300px; display: flex; flex-direction: column; padding-bottom: 2%;\">\n                        <!-- loader start -->\n                        <h3 style=\"text-align: center;\">{{graph.graphname}}</h3>\n                        <ng-container *ngIf=\"tableDatas.hasOwnProperty('table-graph-' + graph.graph_id)\">\n                            <dx-pivot-grid [allowSortingBySummary]=\"true\" [allowSorting]=\"true\" [allowFiltering]=\"true\"\n                                [showBorders]=\"true\" [dataSource]=\"tableDatas['table-graph-' + graph.graph_id]\">\n                                <dxo-field-chooser [enabled]=\"false\"></dxo-field-chooser> </dx-pivot-grid>\n                        </ng-container> <ng-container *ngIf=\"tableDatas['table-graph-' +\n                            graph.graph_id]==undefined\">\n                            <div class=\"lds-ellipsis\">\n                                <div></div>\n                                <div>\n                                </div>\n                                <div></div>\n                                <div></div>\n                            </div>\n                        </ng-container>\n                        <!-- loader end -->\n                    </div>\n                </ng-container> </div>\n        </div>\n    </div>\n</div>", styles: [".left-sidebar .nav-link{text-transform:capitalize}.left-sidebar i{margin-right:10px}.left-sidebar .nav-tabs .nav-item{text-transform:capitalize}::ng-deep .left-sidebar .nav-item{text-transform:capitalize}::ng-deep .modal{z-index:1060}.filter-container{padding:10px;background:whitesmoke;border:2px solid #ccc}.filter-container h3{margin-bottom:auto}.filter-container .col-lg-3{padding-left:0}.search-filter{height:23px}.search-group{display:flex;align-items:center;justify-content:space-between}.search-group .filter-icon{margin:0}.dash_graph_sec .dash_graph{background-color:#fff}.dash_graph_sec .dash_graph .graph_name{text-align:center;background-color:#000;color:#fff;padding:5px;margin-bottom:0}.dash_graph_sec .dash_graph .graph_design{margin:0}.dashboard-graph{border:1px solid #e4e4e4;border-top:0px;align-items:center;justify-content:center}.modal{z-index:1060!important}::ng-deep .dropdown-custom{inset:103% 0 auto auto!important}.dashname{border-style:groove;background-color:#eee;width:64px;height:34px;display:flex;justify-content:center;align-items:center}.beans-list{padding-left:0;display:flex;flex-wrap:wrap}.beans{border-style:groove;background-color:#fd8309;color:#fff;border-radius:10px;padding:1%;border-color:#fd8309}.captcha-box{display:flex;justify-content:center;align-items:center;height:100%;position:absolute;width:100%;padding:5%;background:#ccc}.dashboard-wrapper{box-shadow:1px 1px 10px #ddd;border-radius:5px}.main_container{background-size:cover;background-repeat:no-repeat}@media print{.page-break{page-break-after:always!important}#dashboardScreen{display:block}}@media print{::ng-deep body,::ng-deep html,::ng-deep #wrapper{width:100%!important}::ng-deep .highcharts-root{width:100%!important}}\n"], components: [{ type: i5.MultiSelectComponent, selector: "ng-multiselect-dropdown", inputs: ["disabled", "placeholder", "settings", "data"], outputs: ["onFilterChange", "onDropDownClose", "onSelect", "onDeSelect", "onSelectAll", "onDeSelectAll"] }, { type: i6.DxPivotGridComponent, selector: "dx-pivot-grid", inputs: ["allowExpandAll", "allowFiltering", "allowSorting", "allowSortingBySummary", "dataFieldArea", "dataSource", "disabled", "elementAttr", "encodeHtml", "export", "fieldChooser", "fieldPanel", "headerFilter", "height", "hideEmptySummaryCells", "hint", "loadPanel", "rowHeaderLayout", "rtlEnabled", "scrolling", "showBorders", "showColumnGrandTotals", "showColumnTotals", "showRowGrandTotals", "showRowTotals", "showTotalsPrior", "stateStoring", "tabIndex", "texts", "visible", "width", "wordWrapEnabled"], outputs: ["onCellClick", "onCellPrepared", "onContentReady", "onContextMenuPreparing", "onDisposing", "onExporting", "onInitialized", "onOptionChanged", "allowExpandAllChange", "allowFilteringChange", "allowSortingChange", "allowSortingBySummaryChange", "dataFieldAreaChange", "dataSourceChange", "disabledChange", "elementAttrChange", "encodeHtmlChange", "exportChange", "fieldChooserChange", "fieldPanelChange", "headerFilterChange", "heightChange", "hideEmptySummaryCellsChange", "hintChange", "loadPanelChange", "rowHeaderLayoutChange", "rtlEnabledChange", "scrollingChange", "showBordersChange", "showColumnGrandTotalsChange", "showColumnTotalsChange", "showRowGrandTotalsChange", "showRowTotalsChange", "showTotalsPriorChange", "stateStoringChange", "tabIndexChange", "textsChange", "visibleChange", "widthChange", "wordWrapEnabledChange"] }, { type: i7.DxoFieldChooserComponent, selector: "dxo-field-chooser", inputs: ["allowSearch", "applyChangesMode", "enabled", "height", "layout", "searchTimeout", "texts", "title", "width"] }], directives: [{ type: i4$1.NgIf, selector: "[ngIf]", inputs: ["ngIf", "ngIfThen", "ngIfElse"] }, { type: i4$1.NgForOf, selector: "[ngFor][ngForOf]", inputs: ["ngForOf", "ngForTrackBy", "ngForTemplate"] }, { type: i9.NgControlStatus, selector: "[formControlName],[ngModel],[formControl]" }, { type: i9.NgModel, selector: "[ngModel]:not([formControlName]):not([formControl])", inputs: ["name", "disabled", "ngModel", "ngModelOptions"], outputs: ["ngModelChange"], exportAs: ["ngModel"] }, { type: i4$1.NgClass, selector: "[ngClass]", inputs: ["class", "ngClass"] }] });
i0.ɵɵngDeclareClassMetadata({ minVersion: "12.0.0", version: "13.0.3", ngImport: i0, type: XSightsPublicDashboardComponent, decorators: [{
            type: Component,
            args: [{ selector: 'x-sights-public-dashboard', template: "<div *ngIf=\"dashboardData !=null\">\n    <div class=\"dash_graph_sec\">\n        <div class=\"dash_graph dashboard-wrapper\">\n            <div>\n                <h3 class=\"graph_name\" style=\"height: 44px;\">{{dashboardData.dashboard_name}} </h3>\n            </div>\n            <div class=\"filter-container\" *ngIf=\"filters.length\">\n                <h3>Filters:</h3>\n                <div class=\"col-lg-12 row\">\n                    <div class=\"col-lg-3\" *ngFor=\"let filter of filters;let i=index\"> <ng-multiselect-dropdown [placeholder]=\"'Select ' + filter.fieldName + '...'\" [(ngModel)]=\"filter.selValues\" (onSelect)=\"filteredDashboard()\"\n                            (onDeSelect)=\"filteredDashboard()\" [settings]=\"dropdownSettings\" [data]=\"filter.values\">\n                        </ng-multiselect-dropdown> </div>\n                </div>\n            </div>\n            <div class=\"row graph_design\" id=\"dashboardScreen\"> \n                <ng-container *ngFor=\"let graph of dashboardData?.graphs;let i=index;\">\n                    <!-- <div class=\"page-break\" *ngIf=\"i % 5 == 0 && i != 0\"></div> -->\n                    <ng-container *ngIf=\"graph.graphType != 3 && graph.graphType != 2\">\n                        <div class=\"dashboard-graph\"\n                            [ngClass]=\"{'col-lg-12': graph.graph_index == 1,'col-lg-6': graph.graph_index == 2,'col-lg-4': graph.graph_index == 3,'col-lg-3': graph.graph_index == 4}\"\n                            style=\"min-height: 370px; padding: 0px;\"> <!-- loader start -->\n                            <h3 *ngIf=\"graph.graph_structure.xAxis[0] != '***LABEL***'\" style=\"text-align: center; background-color: #eee; padding: 2px;\">{{graph.graphname}}</h3>\n                            <div [id]=\"'graph-'+ graph.graph_id\" style=\"position: relative; padding: 10px; padding-top: 45px;\">\n                                <div class=\"lds-ellipsis\">\n                                    <div></div>\n                                    <div></div>\n                                    <div></div>\n                                    <div></div>\n                                </div> <!-- loader end -->\n                            </div>\n                        </div>\n                    </ng-container>\n                    <!-- <div *ngIf=\"graph.graphType !=3 && graph.graphType !=2\" class=\"dashboard-graph\" [id]=\"'graph-'+\n                        graph.graph_id\" [ngClass]=\"{'col-lg-12': graph.graph_index==1,'col-lg-6':\n                        graph.graph_index==2,'col-lg-4': graph.graph_index==3,'col-lg-3': graph.graph_index==4}\"\n                        style=\"min-height: 370px; display: flex;\"> \n                        <div class=\"lds-ellipsis\">\n                            <div></div>\n                            <div></div>\n                            <div></div>\n                            <div></div>\n                        </div> \n                    </div> -->\n                    <div *ngIf=\"graph.graphType==2\" class=\"dashboard-graph\" [id]=\"'table-graph-'+ graph.graph_id\"\n                        [ngClass]=\"{'col-lg-12':\n                        graph.graph_index==1,'col-lg-6': graph.graph_index==2,'col-lg-4':\n                        graph.graph_index==3,'col-lg-3': graph.graph_index==4}\" style=\"display: flex;\n                        flex-direction: column; border-bottom: 0px; background-color:antiquewhite;\">\n                        <!-- loader start -->\n                        <h2 style=\"text-align: center; margin-bottom: 0px;\">\n                            {{graph.graphname}}</h2> <!-- loader end -->\n                    </div>\n                    <div *ngIf=\"graph.graphType==3\" class=\"dashboard-graph\" [id]=\"'table-graph-'+\n                        graph.graph_id\" [ngClass]=\"{'col-lg-12': graph.graph_index==1,'col-lg-6':\n                        graph.graph_index==2,'col-lg-4': graph.graph_index==3,'col-lg-3': graph.graph_index==4}\"\n                        style=\"min-height: 300px; display: flex; flex-direction: column; padding-bottom: 2%;\">\n                        <!-- loader start -->\n                        <h3 style=\"text-align: center;\">{{graph.graphname}}</h3>\n                        <ng-container *ngIf=\"tableDatas.hasOwnProperty('table-graph-' + graph.graph_id)\">\n                            <dx-pivot-grid [allowSortingBySummary]=\"true\" [allowSorting]=\"true\" [allowFiltering]=\"true\"\n                                [showBorders]=\"true\" [dataSource]=\"tableDatas['table-graph-' + graph.graph_id]\">\n                                <dxo-field-chooser [enabled]=\"false\"></dxo-field-chooser> </dx-pivot-grid>\n                        </ng-container> <ng-container *ngIf=\"tableDatas['table-graph-' +\n                            graph.graph_id]==undefined\">\n                            <div class=\"lds-ellipsis\">\n                                <div></div>\n                                <div>\n                                </div>\n                                <div></div>\n                                <div></div>\n                            </div>\n                        </ng-container>\n                        <!-- loader end -->\n                    </div>\n                </ng-container> </div>\n        </div>\n    </div>\n</div>", styles: [".left-sidebar .nav-link{text-transform:capitalize}.left-sidebar i{margin-right:10px}.left-sidebar .nav-tabs .nav-item{text-transform:capitalize}::ng-deep .left-sidebar .nav-item{text-transform:capitalize}::ng-deep .modal{z-index:1060}.filter-container{padding:10px;background:whitesmoke;border:2px solid #ccc}.filter-container h3{margin-bottom:auto}.filter-container .col-lg-3{padding-left:0}.search-filter{height:23px}.search-group{display:flex;align-items:center;justify-content:space-between}.search-group .filter-icon{margin:0}.dash_graph_sec .dash_graph{background-color:#fff}.dash_graph_sec .dash_graph .graph_name{text-align:center;background-color:#000;color:#fff;padding:5px;margin-bottom:0}.dash_graph_sec .dash_graph .graph_design{margin:0}.dashboard-graph{border:1px solid #e4e4e4;border-top:0px;align-items:center;justify-content:center}.modal{z-index:1060!important}::ng-deep .dropdown-custom{inset:103% 0 auto auto!important}.dashname{border-style:groove;background-color:#eee;width:64px;height:34px;display:flex;justify-content:center;align-items:center}.beans-list{padding-left:0;display:flex;flex-wrap:wrap}.beans{border-style:groove;background-color:#fd8309;color:#fff;border-radius:10px;padding:1%;border-color:#fd8309}.captcha-box{display:flex;justify-content:center;align-items:center;height:100%;position:absolute;width:100%;padding:5%;background:#ccc}.dashboard-wrapper{box-shadow:1px 1px 10px #ddd;border-radius:5px}.main_container{background-size:cover;background-repeat:no-repeat}@media print{.page-break{page-break-after:always!important}#dashboardScreen{display:block}}@media print{::ng-deep body,::ng-deep html,::ng-deep #wrapper{width:100%!important}::ng-deep .highcharts-root{width:100%!important}}\n"] }]
        }], ctorParameters: function () { return [{ type: DataService }, { type: XSightsCoreService }]; }, propDecorators: { dashboardUrl: [{
                type: Input
            }], adminId: [{
                type: Input
            }], dashboardLoaded: [{
                type: Output
            }] } });

class XSightsDashboardComponent {
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
                let response = await _self.xsights.build(WidgetType$1.TREND, graphData);
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
                    await _self.xsights.build(WidgetType$1.PIVOT_TABLE, tableData);
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
                let response = await this.xsights.build(WidgetType$1.GRAPH, graphdata);
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
XSightsDashboardComponent.ɵfac = i0.ɵɵngDeclareFactory({ minVersion: "12.0.0", version: "13.0.3", ngImport: i0, type: XSightsDashboardComponent, deps: [{ token: XSightsCoreService }, { token: i2.ToastrService }, { token: i4$1.DatePipe }, { token: DataService }], target: i0.ɵɵFactoryTarget.Component });
XSightsDashboardComponent.ɵcmp = i0.ɵɵngDeclareComponent({ minVersion: "12.0.0", version: "13.0.3", type: XSightsDashboardComponent, selector: "x-sights-dashboard", inputs: { dashboardId: "dashboardId", adminId: "adminId", showHeader: "showHeader", showFilters: "showFilters", startDate: "startDate", endDate: "endDate", toggleDashboard: "toggleDashboard" }, outputs: { isDashboardLoaded: "isDashboardLoaded" }, usesOnChanges: true, ngImport: i0, template: "<div class=\"row\" *ngIf=\"dashboardData != null\">\n    <div class=\"col-md-12\">\n        <div class=\"dash_graph_sec\">\n            <div class=\"dash_graph\">\n                <div style=\"display: flex; background-color:#000;\" *ngIf=\"showHeader\">\n                    <h3 class=\"graph_name\" style=\"height: 44px;flex:auto;text-transform:capitalize;\">\n                        {{dashboardData.dashboard_name}} &nbsp; <span class=\"badge badge-warning\"\n                            *ngIf=\"dashboardData.dashboard_type == 1\">LIVE</span> </h3>\n                    <div class=\"row date-container\" *ngIf=\"showHeaderInputs\">\n                        <div class=\"col-lg-5\"> <label for=\"startDate\">From &nbsp;&nbsp;</label> <input type=\"date\"\n                                [(ngModel)]=\"fromDate\" id=\"startDate\" class=\"form-control\"> </div>\n                        <div class=\"col-lg-5\">\n                            <label for=\"endDate\">To &nbsp;&nbsp;</label> <input type=\"date\" [(ngModel)]=\"toDate\"\n                                id=\"endDate\" class=\"form-control\">\n                        </div>\n                        <div class=\"col-lg-2\">\n                            <i class=\"fa fa-search\" (click)=\"refreshSystemApis()\"></i>\n                        </div>\n                    </div>\n                </div>\n                <div class=\"filter-container\" *ngIf=\"filters.length\">\n                    <h3>Filters:</h3>\n                    <div class=\"col-lg-12 row\">\n                        <div class=\"col-lg-3\" *ngFor=\"let filter of filters;let i = index\"> <ng-multiselect-dropdown\n                                [placeholder]=\"'Select ' + filter.fieldName + '...'\" [(ngModel)]=\"filter.selValues\"\n                                (onSelect)=\"filteredDashboard()\" (onDeSelect)=\"filteredDashboard()\"\n                                [settings]=\"dropdownSettings\" [data]=\"filter.values\"> </ng-multiselect-dropdown> </div>\n                    </div>\n                </div>\n                <div class=\"row graph_design\" id=\"dashboardScreen\" #dashboardScreen>\n                    <ng-container *ngFor=\"let graph of dashboardData.graphs;\">\n\n                        <ng-container *ngIf=\"graph.graphType != 3 && graph.graphType != 2\">\n                            <div class=\"dashboard-graph\"\n                                [ngClass]=\"{'col-lg-12': graph.graph_index == 1,'col-lg-6': graph.graph_index == 2,'col-lg-4': graph.graph_index == 3,'col-lg-3': graph.graph_index == 4}\"\n                                style=\"min-height: 370px; padding: 0px;\"> <!-- loader start -->\n                                <h3 *ngIf=\"graph.graph_structure.xAxis[0] != '***LABEL***'\" style=\"text-align: center; background-color: #eee; padding: 2px;\">{{graph.graphname}}</h3>\n                                <div [id]=\"'graph-'+ graph.graph_id\" style=\"position: relative; padding: 10px; padding-top: 45px;\">\n                                    <div class=\"lds-ellipsis\">\n                                        <div></div>\n                                        <div></div>\n                                        <div></div>\n                                        <div></div>\n                                    </div> <!-- loader end -->\n                                </div>\n                            </div>\n                        </ng-container>\n                        <div *ngIf=\"graph.graphType == 2\" class=\"dashboard-graph\" [id]=\"'table-graph-'+ graph.graph_id\"\n                            [ngClass]=\"{'col-lg-12': graph.graph_index == 1,'col-lg-6': graph.graph_index == 2,'col-lg-4': graph.graph_index == 3,'col-lg-3': graph.graph_index == 4}\"\n                            style=\"display: flex; flex-direction: column; border-bottom: 0px; background-color:antiquewhite;\">\n                            <!-- loader start -->\n                            <h2 style=\"text-align: center; margin-bottom: 0px;\">{{graph.graphname}}</h2>\n                            <!-- loader end -->\n                        </div>\n                        <div *ngIf=\"graph.graphType == 3\" class=\"dashboard-graph\" [id]=\"'table-'+ graph.graph_id\"\n                            [ngClass]=\"{'col-lg-12': graph.graph_index == 1,'col-lg-6': graph.graph_index == 2,'col-lg-4': graph.graph_index == 3,'col-lg-3': graph.graph_index == 4}\"\n                            style=\"min-height: 300px; display: flex; flex-direction: column; padding-bottom: 2%;\">\n                            <!-- loader start -->\n                            <h3 style=\"text-align: center;\">{{graph.graphname}}</h3>\n                            <ng-container *ngIf=\"pivotTables.hasOwnProperty('table-' + graph.graph_id)\"> <dx-pivot-grid\n                                    [allowSortingBySummary]=\"true\" [allowSorting]=\"true\" [allowFiltering]=\"true\"\n                                    [showBorders]=\"true\" [dataSource]=\"pivotTables['table-' + graph.graph_id]\">\n                                    <dxo-field-chooser [enabled]=\"false\"></dxo-field-chooser> </dx-pivot-grid>\n                            </ng-container> <ng-container *ngIf=\"pivotTables['table-' + graph.graph_id] == undefined\">\n                                <div class=\"lds-ellipsis\">\n                                    <div></div>\n                                    <div></div>\n                                    <div></div>\n                                    <div></div>\n                                </div>\n                            </ng-container> <!-- loader end -->\n                        </div>\n                    </ng-container>\n                </div>\n            </div>\n        </div>\n    </div>\n</div>", styles: [".left-sidebar .nav-link{text-transform:capitalize}.left-sidebar i{margin-right:10px}.left-sidebar .nav-tabs .nav-item{text-transform:capitalize}::ng-deep .left-sidebar .nav-item{text-transform:capitalize}::ng-deep .modal{z-index:1060}.search-filter{height:23px}.search-group{display:flex;align-items:center;justify-content:space-between}.search-group .filter-icon{margin:0}.dash_graph_sec{overflow:auto}.dash_graph_sec .dash_graph{background-color:#fff;margin:15px}.dash_graph_sec .dash_graph .graph_name{text-align:center;align-self:flex-end;color:#fff;padding:5px;margin-bottom:0}.dash_graph_sec .dash_graph .graph_design{margin:0}.dashboard-graph{border:3px solid #dadada;align-items:center;justify-content:center}.modal{z-index:1060!important}::ng-deep .dropdown-custom{inset:103% 0 auto auto!important}.dashname{border-style:groove;background-color:#eee;width:64px;height:34px;display:flex;justify-content:center;align-items:center}.beans-list{padding-left:0;display:flex;flex-wrap:wrap}.beans{border-style:groove;background-color:#fd8309;color:#fff;border-radius:10px;padding:1%;border-color:#fd8309}.graph-source{display:flex;justify-content:space-between;align-items:center}.graph-source h3{margin-bottom:0}.filter-container{padding:10px;background:whitesmoke;border:2px solid #ccc}.filter-container h3{margin-bottom:auto}.filter-container .col-lg-3{padding-left:0}.date-container{justify-content:space-between;align-items:center;color:#fff}.date-container .col-lg-6{display:flex;align-items:center}.date-container .col-lg-6 label{width:70px}\n"], components: [{ type: i5.MultiSelectComponent, selector: "ng-multiselect-dropdown", inputs: ["disabled", "placeholder", "settings", "data"], outputs: ["onFilterChange", "onDropDownClose", "onSelect", "onDeSelect", "onSelectAll", "onDeSelectAll"] }, { type: i6.DxPivotGridComponent, selector: "dx-pivot-grid", inputs: ["allowExpandAll", "allowFiltering", "allowSorting", "allowSortingBySummary", "dataFieldArea", "dataSource", "disabled", "elementAttr", "encodeHtml", "export", "fieldChooser", "fieldPanel", "headerFilter", "height", "hideEmptySummaryCells", "hint", "loadPanel", "rowHeaderLayout", "rtlEnabled", "scrolling", "showBorders", "showColumnGrandTotals", "showColumnTotals", "showRowGrandTotals", "showRowTotals", "showTotalsPrior", "stateStoring", "tabIndex", "texts", "visible", "width", "wordWrapEnabled"], outputs: ["onCellClick", "onCellPrepared", "onContentReady", "onContextMenuPreparing", "onDisposing", "onExporting", "onInitialized", "onOptionChanged", "allowExpandAllChange", "allowFilteringChange", "allowSortingChange", "allowSortingBySummaryChange", "dataFieldAreaChange", "dataSourceChange", "disabledChange", "elementAttrChange", "encodeHtmlChange", "exportChange", "fieldChooserChange", "fieldPanelChange", "headerFilterChange", "heightChange", "hideEmptySummaryCellsChange", "hintChange", "loadPanelChange", "rowHeaderLayoutChange", "rtlEnabledChange", "scrollingChange", "showBordersChange", "showColumnGrandTotalsChange", "showColumnTotalsChange", "showRowGrandTotalsChange", "showRowTotalsChange", "showTotalsPriorChange", "stateStoringChange", "tabIndexChange", "textsChange", "visibleChange", "widthChange", "wordWrapEnabledChange"] }, { type: i7.DxoFieldChooserComponent, selector: "dxo-field-chooser", inputs: ["allowSearch", "applyChangesMode", "enabled", "height", "layout", "searchTimeout", "texts", "title", "width"] }], directives: [{ type: i4$1.NgIf, selector: "[ngIf]", inputs: ["ngIf", "ngIfThen", "ngIfElse"] }, { type: i9.DefaultValueAccessor, selector: "input:not([type=checkbox])[formControlName],textarea[formControlName],input:not([type=checkbox])[formControl],textarea[formControl],input:not([type=checkbox])[ngModel],textarea[ngModel],[ngDefaultControl]" }, { type: i9.NgControlStatus, selector: "[formControlName],[ngModel],[formControl]" }, { type: i9.NgModel, selector: "[ngModel]:not([formControlName]):not([formControl])", inputs: ["name", "disabled", "ngModel", "ngModelOptions"], outputs: ["ngModelChange"], exportAs: ["ngModel"] }, { type: i4$1.NgForOf, selector: "[ngFor][ngForOf]", inputs: ["ngForOf", "ngForTrackBy", "ngForTemplate"] }, { type: i4$1.NgClass, selector: "[ngClass]", inputs: ["class", "ngClass"] }] });
i0.ɵɵngDeclareClassMetadata({ minVersion: "12.0.0", version: "13.0.3", ngImport: i0, type: XSightsDashboardComponent, decorators: [{
            type: Component,
            args: [{ selector: 'x-sights-dashboard', template: "<div class=\"row\" *ngIf=\"dashboardData != null\">\n    <div class=\"col-md-12\">\n        <div class=\"dash_graph_sec\">\n            <div class=\"dash_graph\">\n                <div style=\"display: flex; background-color:#000;\" *ngIf=\"showHeader\">\n                    <h3 class=\"graph_name\" style=\"height: 44px;flex:auto;text-transform:capitalize;\">\n                        {{dashboardData.dashboard_name}} &nbsp; <span class=\"badge badge-warning\"\n                            *ngIf=\"dashboardData.dashboard_type == 1\">LIVE</span> </h3>\n                    <div class=\"row date-container\" *ngIf=\"showHeaderInputs\">\n                        <div class=\"col-lg-5\"> <label for=\"startDate\">From &nbsp;&nbsp;</label> <input type=\"date\"\n                                [(ngModel)]=\"fromDate\" id=\"startDate\" class=\"form-control\"> </div>\n                        <div class=\"col-lg-5\">\n                            <label for=\"endDate\">To &nbsp;&nbsp;</label> <input type=\"date\" [(ngModel)]=\"toDate\"\n                                id=\"endDate\" class=\"form-control\">\n                        </div>\n                        <div class=\"col-lg-2\">\n                            <i class=\"fa fa-search\" (click)=\"refreshSystemApis()\"></i>\n                        </div>\n                    </div>\n                </div>\n                <div class=\"filter-container\" *ngIf=\"filters.length\">\n                    <h3>Filters:</h3>\n                    <div class=\"col-lg-12 row\">\n                        <div class=\"col-lg-3\" *ngFor=\"let filter of filters;let i = index\"> <ng-multiselect-dropdown\n                                [placeholder]=\"'Select ' + filter.fieldName + '...'\" [(ngModel)]=\"filter.selValues\"\n                                (onSelect)=\"filteredDashboard()\" (onDeSelect)=\"filteredDashboard()\"\n                                [settings]=\"dropdownSettings\" [data]=\"filter.values\"> </ng-multiselect-dropdown> </div>\n                    </div>\n                </div>\n                <div class=\"row graph_design\" id=\"dashboardScreen\" #dashboardScreen>\n                    <ng-container *ngFor=\"let graph of dashboardData.graphs;\">\n\n                        <ng-container *ngIf=\"graph.graphType != 3 && graph.graphType != 2\">\n                            <div class=\"dashboard-graph\"\n                                [ngClass]=\"{'col-lg-12': graph.graph_index == 1,'col-lg-6': graph.graph_index == 2,'col-lg-4': graph.graph_index == 3,'col-lg-3': graph.graph_index == 4}\"\n                                style=\"min-height: 370px; padding: 0px;\"> <!-- loader start -->\n                                <h3 *ngIf=\"graph.graph_structure.xAxis[0] != '***LABEL***'\" style=\"text-align: center; background-color: #eee; padding: 2px;\">{{graph.graphname}}</h3>\n                                <div [id]=\"'graph-'+ graph.graph_id\" style=\"position: relative; padding: 10px; padding-top: 45px;\">\n                                    <div class=\"lds-ellipsis\">\n                                        <div></div>\n                                        <div></div>\n                                        <div></div>\n                                        <div></div>\n                                    </div> <!-- loader end -->\n                                </div>\n                            </div>\n                        </ng-container>\n                        <div *ngIf=\"graph.graphType == 2\" class=\"dashboard-graph\" [id]=\"'table-graph-'+ graph.graph_id\"\n                            [ngClass]=\"{'col-lg-12': graph.graph_index == 1,'col-lg-6': graph.graph_index == 2,'col-lg-4': graph.graph_index == 3,'col-lg-3': graph.graph_index == 4}\"\n                            style=\"display: flex; flex-direction: column; border-bottom: 0px; background-color:antiquewhite;\">\n                            <!-- loader start -->\n                            <h2 style=\"text-align: center; margin-bottom: 0px;\">{{graph.graphname}}</h2>\n                            <!-- loader end -->\n                        </div>\n                        <div *ngIf=\"graph.graphType == 3\" class=\"dashboard-graph\" [id]=\"'table-'+ graph.graph_id\"\n                            [ngClass]=\"{'col-lg-12': graph.graph_index == 1,'col-lg-6': graph.graph_index == 2,'col-lg-4': graph.graph_index == 3,'col-lg-3': graph.graph_index == 4}\"\n                            style=\"min-height: 300px; display: flex; flex-direction: column; padding-bottom: 2%;\">\n                            <!-- loader start -->\n                            <h3 style=\"text-align: center;\">{{graph.graphname}}</h3>\n                            <ng-container *ngIf=\"pivotTables.hasOwnProperty('table-' + graph.graph_id)\"> <dx-pivot-grid\n                                    [allowSortingBySummary]=\"true\" [allowSorting]=\"true\" [allowFiltering]=\"true\"\n                                    [showBorders]=\"true\" [dataSource]=\"pivotTables['table-' + graph.graph_id]\">\n                                    <dxo-field-chooser [enabled]=\"false\"></dxo-field-chooser> </dx-pivot-grid>\n                            </ng-container> <ng-container *ngIf=\"pivotTables['table-' + graph.graph_id] == undefined\">\n                                <div class=\"lds-ellipsis\">\n                                    <div></div>\n                                    <div></div>\n                                    <div></div>\n                                    <div></div>\n                                </div>\n                            </ng-container> <!-- loader end -->\n                        </div>\n                    </ng-container>\n                </div>\n            </div>\n        </div>\n    </div>\n</div>", styles: [".left-sidebar .nav-link{text-transform:capitalize}.left-sidebar i{margin-right:10px}.left-sidebar .nav-tabs .nav-item{text-transform:capitalize}::ng-deep .left-sidebar .nav-item{text-transform:capitalize}::ng-deep .modal{z-index:1060}.search-filter{height:23px}.search-group{display:flex;align-items:center;justify-content:space-between}.search-group .filter-icon{margin:0}.dash_graph_sec{overflow:auto}.dash_graph_sec .dash_graph{background-color:#fff;margin:15px}.dash_graph_sec .dash_graph .graph_name{text-align:center;align-self:flex-end;color:#fff;padding:5px;margin-bottom:0}.dash_graph_sec .dash_graph .graph_design{margin:0}.dashboard-graph{border:3px solid #dadada;align-items:center;justify-content:center}.modal{z-index:1060!important}::ng-deep .dropdown-custom{inset:103% 0 auto auto!important}.dashname{border-style:groove;background-color:#eee;width:64px;height:34px;display:flex;justify-content:center;align-items:center}.beans-list{padding-left:0;display:flex;flex-wrap:wrap}.beans{border-style:groove;background-color:#fd8309;color:#fff;border-radius:10px;padding:1%;border-color:#fd8309}.graph-source{display:flex;justify-content:space-between;align-items:center}.graph-source h3{margin-bottom:0}.filter-container{padding:10px;background:whitesmoke;border:2px solid #ccc}.filter-container h3{margin-bottom:auto}.filter-container .col-lg-3{padding-left:0}.date-container{justify-content:space-between;align-items:center;color:#fff}.date-container .col-lg-6{display:flex;align-items:center}.date-container .col-lg-6 label{width:70px}\n"] }]
        }], ctorParameters: function () { return [{ type: XSightsCoreService }, { type: i2.ToastrService }, { type: i4$1.DatePipe }, { type: DataService }]; }, propDecorators: { dashboardId: [{
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

HC_exporting(Highcharts);
offlineExporting(Highcharts);
// exportData(Highcharts);
highStocks(Highcharts);
accessibility(Highcharts);
Drilldown(Highcharts);
var WidgetType;
(function (WidgetType) {
    WidgetType["GRAPH"] = "graph";
    WidgetType["TREND"] = "trend";
    WidgetType["PIVOT_TABLE"] = "pivot_table";
})(WidgetType || (WidgetType = {}));
class XsightsBackendService {
    constructor(dialog, modalConfig, dataService, datePipe) {
        this.dialog = dialog;
        this.modalConfig = modalConfig;
        this.dataService = dataService;
        this.datePipe = datePipe;
        this.systemApis = ['198', '138', '279'];
        this.modalData = {};
        this.highcharts = Highcharts;
        this.divStyles = 'display: flex; justify-content: flex-start; align-items: center; position: absolute; top: 5px; left: 5px;';
        this.iconStyles = 'border: 2px solid #eee; padding: 5px; min-width: 28px; text-align: center; border-radius: 8px; background: #ccc; box-shadow: 2px 2px 2px #ccc; margin-right: 10px;';
        this.breadcrumbStyles = 'border: 2px solid #eee; padding: 5px;  background: #ccc; min-width: 28px; text-align: center; border-radius: 8px; display: flex; box-shadow: 2px 2px 2px #ccc; margin-right: 10px;';
        this.creditTitle = 'Powered by Axestrack';
        this.creditUrl = 'https://www.axestrack.com/';
        this.charts = {};
        this.trends = {};
        this.modalConfig.modalDialogClass = 'datapopup-dailog';
        this.modalConfig.windowClass = 'datapopup-window';
    }
    build(widgetType, widgetData) {
        return new Promise((resolve, reject) => {
            switch (widgetType) {
                case WidgetType.GRAPH:
                    resolve(this.buildGraph({
                        ...widgetData,
                        breadCrumb: ['Home'],
                        currLevel: 0,
                        prevLevelData: [],
                        selKeys: [],
                        order: 0,
                        colToShow: '',
                    }));
                    break;
                case WidgetType.TREND:
                    let widget = widgetData;
                    resolve(this.buildTrend({
                        ...widget,
                        rawData: widget.graphData,
                        currLevel: 1,
                        order: 0,
                        prevLevelData: [],
                    }));
                    break;
            }
        });
    }
    //Graph Function
    async buildGraph(graphData) {
        //Set GraphObject with GraphId
        this.charts[graphData.graphId] = graphData;
        if (this.charts[graphData.graphId].rows[this.charts[graphData.graphId].currLevel] == '***LABEL***') {
            //Create Label Block
            let response = await this.publishLabel(graphData.graphId);
            //Dispatch after build event
            return response;
        }
        else {
            //Create Graph
            let response = await this.startGraphBuilder(graphData.graphId);
            //Dispatch after build event
            return response;
        }
    }
    async publishLabel(graphId) {
        //Flush Content of Graph Div
        document.querySelector('#' + graphId).innerHTML = '';
        //Labels Data creation
        let htmlDiv = this.charts[graphId].graphData.map((y, yIndex) => {
            return {
                label: y.label,
                value: y.value
            };
        });
        //Creating Label Html DUMP
        let html = `
    <div class="card" style="padding-top: 3%; padding-bottom: 3%; width: inherit;">
    ${htmlDiv.length == 1
            ? `<h3 style="text-align: center;">${this.charts[graphId].graphTitle}</h3>`
            : ``}
    <div class="graph-label" >
    ${htmlDiv
            .map((d, index) => `
        <div class="label-item" ${this.charts[graphId].colors[index] != undefined
            ? `style="background-color: ${this.charts[graphId].colors[index]}"`
            : ''} id="card-graph-${graphId}" data="${this.charts[graphId].columns[index]}">
          <h3 style="${this.charts[graphId].graphData.length == 1 ? 'font-size: 18px;' : ''}" data="${this.charts[graphId].columns[index]}"><b data="${this.charts[graphId].columns[index]}">${Math.round(d.value)}</b></h3>
          ${this.charts[graphId].graphData.length > 1
            ? `<h3 data="${this.charts[graphId].columns[index]}">` +
                d.label +
                '</h3>'
            : ''}
        </div>

        `)
            .join('')}
        </div>
    </div>`;
        //Rendering Label HTML DUMP over document
        document.querySelector('#' + graphId).innerHTML = html;
        let _self = this;
        //Label Click handler
        document.querySelectorAll('#card-graph-' + graphId).forEach((card) => card.addEventListener('click', function (e) {
            _self.charts[graphId].currLevel += 1;
            _self.charts[graphId].prevLevelData.push(_self.charts[graphId].graphData);
            let colToShow = e.target.getAttribute('data');
            _self.charts[graphId].breadCrumb.push(colToShow);
            let dataObj = {
                graphId: graphId.split("-")[1],
                currLevel: _self.charts[graphId].currLevel,
                colId: null,
                selKey: [],
                colToShow: colToShow,
                direction: 0,
                dataFilter: _self.charts[graphId].dashboardFilter,
                adminId: _self.charts[graphId].adminId,
                shareid: _self.charts[graphId].shareid ?? null,
                startDate: _self.charts[graphId].range.startDate ?? null,
                endDate: _self.charts[graphId].range.endDate ?? null
            };
            Swal.fire({
                text: "Please Wait...",
                allowOutsideClick: false
            });
            Swal.showLoading();
            _self.dataService.getGraphDrilldownById(dataObj).then((res) => {
                Swal.hideLoading();
                Swal.close();
                if (_self.charts[graphId].rows.length == 1) {
                    //Rendering Last level Component, Integer sortingDirection
                    _self.dataService.setModalData({
                        colToView: _self.charts[graphId].lastLevelColumns,
                        refData: res.data,
                    });
                    let modalOptions = {
                        panelClass: 'dataPopup-modal',
                        backdropClass: 'modal-backdrop',
                    };
                    _self.dialog.open(DataPopupComponent, modalOptions);
                }
                else {
                    //Flush Label Content from document
                    document.querySelector('#' + graphId).innerHTML = '';
                    _self.charts[graphId].graphData = res.data;
                    //Generating Child Graph of Label
                    _self.startGraphBuilder(graphId);
                }
            });
        }));
        return true;
    }
    async startGraphBuilder(graphId) {
        // this.charts[graphId].currLevel = currLevel;
        // this.charts[graphId].prevLevelData = [];
        // this.charts[graphId].selKeys = [];
        // this.charts[graphId].colToShow = colToShow;
        // this.charts[graphId].currLevel = 0;
        //Creating Chart Raw Json
        let chartOptions = this.createChartData(graphId, this.charts[graphId].currLevel);
        //Rendering Chart of GraphId
        this.highcharts.chart(this.charts[graphId].graphId, chartOptions);
        //Add Action Buttons Over Chart
        this.addActionBtn(graphId);
        return true;
    }
    getPlotOptions(graphId, currLevel) {
        let plotOptions = {
            series: {
                turboThreshold: 1000000,
                dataLabels: {
                    color: 'black',
                    enabled: true,
                    style: {
                        color: 'black',
                        textShadow: false,
                        textDecoration: 'none',
                    },
                },
                label: {
                    style: {
                        color: 'black',
                    },
                },
            },
        };
        //Options for Stack Graph
        if (this.charts[graphId].graphTypes[currLevel] == GraphTypes.STACKED_BAR ||
            this.charts[graphId].graphTypes[currLevel] == GraphTypes.STACKED_COLUMN) {
            plotOptions.series['stacking'] = 'normal'; //Normal Stacking of y-axis
        }
        else if (this.charts[graphId].graphTypes[currLevel] ==
            GraphTypes.STACKED_BAR_PERCENTAGE ||
            this.charts[graphId].graphTypes[currLevel] ==
                GraphTypes.STACKED_COLUMN_PERCENTAGE) {
            plotOptions.series['stacking'] = 'percent'; //Stacking of y-axis on basis of percentage
            //Add Percent Sign after y-axis values
            plotOptions.series.dataLabels['formatter'] = function () {
                return this.percentage.toFixed(2) + ' %';
            };
        }
        return plotOptions;
    }
    createChartData(graphId, currLevel) {
        let _self = this;
        //Getting Plot Options for Graph
        let plotOptions = this.getPlotOptions(graphId, currLevel);
        return {
            credits: {
                text: this.creditTitle,
                href: this.creditUrl,
                style: {
                    fontSize: '12px',
                },
            },
            title: null,
            plotOptions: plotOptions,
            chart: {
                events: {
                    //Handle Drilldown Event of Graph
                    drilldown: function (e) {
                        if (e.points != false)
                            return;
                        let chart = this;
                        //Show Loading in Chart
                        chart.showLoading('Loading...');
                        let currGraphId = e.point.options.graphId; //GraphId
                        let colId = e.point.colIndex; //ColorIndex of bar
                        //Increasing Graph Drilldown level
                        _self.charts["graph-" + currGraphId].currLevel += 1;
                        _self.charts["graph-" + currGraphId].breadCrumb.push(e.point.name);
                        _self.charts["graph-" + currGraphId].selKeys?.push(e.point.name);
                        let dataObj = {
                            graphId: currGraphId,
                            currLevel: _self.charts["graph-" + currGraphId].currLevel,
                            colId: colId,
                            selKey: _self.charts["graph-" + currGraphId].selKeys,
                            colToShow: null,
                            direction: _self.charts["graph-" + currGraphId].order,
                            dataFilter: _self.charts["graph-" + currGraphId].dashboardFilter,
                            adminId: _self.charts["graph-" + currGraphId].adminId,
                            shareid: _self.charts["graph-" + currGraphId].shareid ?? null,
                            startDate: _self.charts["graph-" + currGraphId].range.startDate ?? null,
                            endDate: _self.charts["graph-" + currGraphId].range.endDate ?? null
                        };
                        _self.dataService.getGraphDrilldownById(dataObj).then((res) => {
                            //Open Last Level Component
                            if (_self.charts["graph-" + currGraphId].rows.length == _self.charts["graph-" + currGraphId].currLevel) {
                                _self.dataService.setModalData({
                                    colToView: _self.charts["graph-" + currGraphId].lastLevelColumns,
                                    refData: res.data,
                                });
                                let modalOptions = {
                                    panelClass: 'dataPopup-modal',
                                    backdropClass: 'modal-backdrop',
                                };
                                _self.dialog.open(DataPopupComponent, modalOptions);
                                //Reducing Graph Drilldown Level
                                _self.charts["graph-" + currGraphId].currLevel -= 1;
                                _self.charts["graph-" + currGraphId].selKeys?.pop();
                                setTimeout(() => {
                                    //Hide Loading in chart
                                    chart.hideLoading();
                                }, 1000);
                                return;
                            }
                            else {
                                //Storing Previous Snapshot of Data to restore graph on back
                                _self.charts["graph-" + currGraphId].prevLevelData.push(_self.charts["graph-" + currGraphId].graphData);
                                _self.manageBreadCrumb("graph-" + currGraphId, _self);
                                //Getting drilldown series data
                                let series = res.data;
                                // if (
                                //   _self.charts["graph-" + currGraphId].graphTypes[0] ==
                                //     GraphTypes.STACKED_BAR_PERCENTAGE ||
                                //   _self.charts["graph-" + currGraphId].graphTypes[0] ==
                                //     GraphTypes.STACKED_COLUMN_PERCENTAGE
                                // ) {
                                //   plotOptions.series['stacking'] = 'normal';
                                //   plotOptions.series.dataLabels['formatter'] = function () {
                                //     return this.y;
                                //   };
                                //   chart.update({
                                //     plotOptions: plotOptions,
                                //   });
                                // }
                                _self.charts["graph-" + currGraphId].graphData = series;
                                setTimeout(() => {
                                    //Hide Loading in chart
                                    chart.hideLoading();
                                    //Add Drilldown Series Data as Main Series
                                    chart.update({
                                        plotOptions: plotOptions,
                                        xAxis: {
                                            type: 'category',
                                            labels: {
                                                style: {
                                                    color: 'red',
                                                    textDecoration: 'none',
                                                    textOutline: '0px',
                                                },
                                            },
                                            min: 0,
                                            max: 6,
                                            allowDecimals: false,
                                            scrollbar: {
                                                enabled: true,
                                            },
                                        },
                                        series: series
                                    });
                                    // .addSeriesAsDrilldown(e.point, {
                                    //   data: [series],
                                    //   name: e.point.name
                                    // });
                                }, 1000);
                            }
                        });
                    },
                    //Handle DrillUp Event
                    drillup: async function (e) {
                        // let currGraphId = e.seriesOptions.graphId; //GraphId
                        // let level = e.seriesOptions.level; //Current Level of Drilldown
                        // let chart: any = this;
                        // _self.charts["graph-" + currGraphId].currLevel = level;
                        // //Restoring Data using previous store data
                        // _self.charts["graph-" + currGraphId].graphData = await _self.charts[
                        //   "graph-" + currGraphId
                        // ].prevLevelData[level];
                        // //Refresh Previous Data List
                        // _self.charts["graph-" + currGraphId].prevLevelData.splice(level, 1);
                        // _self.charts["graph-" + currGraphId].selKeys?.pop();
                        // _self.charts
                        // if (
                        //   level == 0 &&
                        //   (_self.charts["graph-" + currGraphId].graphTypes[0] ==
                        //     GraphTypes.STACKED_BAR_PERCENTAGE ||
                        //     _self.charts["graph-" + currGraphId].graphTypes[0] ==
                        //       GraphTypes.STACKED_COLUMN_PERCENTAGE)
                        // ) {
                        //   plotOptions.series['stacking'] = 'percent'; //Stacking of y-axis on basis of percentage
                        //   //Add Percent Sign after y-axis values
                        //   plotOptions.series.dataLabels['formatter'] = function () {
                        //     return this.percentage.toFixed(2) + ' %';
                        //   };
                        //   chart.update({
                        //     plotOptions: plotOptions,
                        //     series: _self.charts["graph-" + currGraphId].graphData
                        //   });
                        // }
                    },
                },
            },
            //Configuring X-axis
            xAxis: {
                type: 'category',
                labels: {
                    style: {
                        color: 'red',
                        textDecoration: 'none',
                        textOutline: '0px',
                    },
                },
                min: 0,
                max: Object.keys(this.charts[graphId].graphData[0].data).length <= 6
                    ? Object.keys(this.charts[graphId].graphData[0].data).length - 1
                    : 6,
                allowDecimals: false,
                scrollbar: {
                    enabled: true,
                },
            },
            //Configuring Y-axis
            yAxis: lodash.map(this.charts[graphId].columns, (y) => {
                return {
                    opposite: true,
                    title: {
                        text: null, // Hiding vertical labels over y-axis
                    },
                };
            }),
            //Getting Main Series Data
            series: this.charts[graphId].graphData
        };
    }
    sortGraph(e) {
        const tempArr = e.target.id.split('@');
        const graphId = tempArr[tempArr.length - 1];
        if (this.charts[graphId].order < 1) {
            this.charts[graphId].order += 1;
        }
        else {
            this.charts[graphId].order = -1;
        }
        let d = {
            graphId: graphId.split("-")[1],
            dataFilter: this.charts[graphId].dashboardFilter,
            direction: this.charts[graphId].order,
            adminId: this.charts[graphId].adminId,
            shareid: this.charts[graphId].shareid ?? null,
            startDate: this.charts[graphId].range.startDate ?? null,
            endDate: this.charts[graphId].range.endDate ?? null
        };
        Swal.fire({
            text: "Please Wait...",
            allowOutsideClick: false
        });
        Swal.showLoading();
        this.dataService.getGraphDataById(d).then((res) => {
            Swal.hideLoading();
            Swal.close();
            this.charts[graphId].graphData = res.data;
            this.buildGraph({ ...this.charts[graphId],
                breadCrumb: ['Home'],
                currLevel: 0,
                selKeys: [],
                order: 0,
                prevLevelData: [],
                colToShow: '' });
        });
    }
    addActionBtn(graphId) {
        let _self = this;
        const div = document.createElement('div');
        div.setAttribute('style', this.divStyles);
        div.setAttribute("id", "graph-options-" + graphId);
        const sortIcon = document.createElement('i');
        sortIcon.setAttribute('id', 'sort@' + graphId);
        sortIcon.setAttribute('style', this.iconStyles);
        if (this.charts[graphId].order == 1) {
            sortIcon.setAttribute('class', 'fa fa-sort-amount-desc');
        }
        else if (this.charts[graphId].order == -1) {
            sortIcon.setAttribute('class', 'fa fa-sort-amount-asc');
        }
        else {
            sortIcon.setAttribute('class', 'fa fa-sort');
        }
        const downloadIcon = document.createElement("i");
        downloadIcon.setAttribute('id', 'download@' + graphId);
        downloadIcon.setAttribute('style', this.iconStyles);
        downloadIcon.setAttribute('class', 'fa fa-download');
        div.appendChild(downloadIcon);
        div.appendChild(sortIcon);
        div.appendChild(sortIcon);
        document.querySelector('#' + graphId).appendChild(div);
        // if (this.charts[graphId].rows[0] == '***LABEL***') {
        // }
        this.manageBreadCrumb(graphId, this);
        sortIcon.addEventListener('click', function (e) {
            _self.sortGraph(e);
        });
        downloadIcon.addEventListener('click', function (e) {
            const tempArr = e.target.id.split('@');
            const graphId = tempArr[tempArr.length - 1];
            let dataObj = {
                graphId: graphId.split("-")[1],
                currLevel: _self.charts[graphId].currLevel,
                colId: null,
                selKey: _self.charts[graphId].selKeys,
                colToShow: null,
                direction: 0,
                dataFilter: _self.charts[graphId].dashboardFilter,
                adminId: _self.charts[graphId].adminId,
                shareid: _self.charts[graphId].shareid ?? null,
                startDate: _self.datePipe.transform(_self.charts[graphId].range.startDate, "yyyy-MM-dd"),
                endDate: _self.datePipe.transform(_self.charts[graphId].range.endDate, "yyyy-MM-dd"),
                fetchRawData: true
            };
            _self.downloadGraphData(e, graphId, dataObj, _self.charts[graphId].lastLevelColumns);
        });
    }
    downloadGraphData(e, graphId, data, lastLevelCol) {
        Swal.fire({
            text: "Downloading...",
            allowOutsideClick: false
        });
        Swal.showLoading();
        this.dataService.downloadDrilldownById(data).subscribe((res) => {
            //Open Last Level Component
            this.download(res);
            // this.dataService.setModalData({
            //   colToView: lastLevelCol,
            //   refData: res.data,
            // });
            // let modalOptions = {
            //   panelClass: 'dataPopup-modal',
            //   backdropClass: 'modal-backdrop',
            // };
            // this.dialog.open(DataPopupComponent, modalOptions);
        });
    }
    download(httpEvent) {
        // Swal.fire({text: "Downloading..."})
        // Swal.showLoading()
        switch (httpEvent.type) {
            case HttpEventType.Sent:
                break;
            case HttpEventType.ResponseHeader:
                break;
            case HttpEventType.DownloadProgress:
                break;
            case HttpEventType.Response:
                if (httpEvent.body instanceof Array) {
                }
                else {
                    Swal.close();
                    Swal.hideLoading();
                    let EXCEL_TYPE = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet;charset=UTF-8';
                    let EXCEL_EXTENSION = '.xlsx';
                    const data = new Blob([httpEvent.body], {
                        type: EXCEL_TYPE,
                    });
                    FileSave.saveAs(data, "data.xls");
                }
        }
    }
    manageBreadCrumb(graphId, _self) {
        const div = document.getElementById("graph-options-" + graphId);
        document.getElementById("breadcrumb-" + graphId)?.remove();
        const breadCrumb = document.createElement("div");
        if (_self.charts[graphId].breadCrumb.length == 1) {
            return;
        }
        breadCrumb.setAttribute('style', this.breadcrumbStyles);
        breadCrumb.setAttribute('id', "breadcrumb-" + graphId);
        // homeIcon.setAttribute('id', 'home-label-' + graphId);
        // homeIcon.setAttribute('class', 'fa fa-home');
        _self.charts[graphId].breadCrumb.forEach((breadcrumb, index) => {
            const para = document.createElement("p");
            const span = document.createElement("span");
            span.setAttribute("style", "text-decoration: underline; cursor: pointer;");
            span.setAttribute("id", breadcrumb);
            span.append(breadcrumb);
            para.appendChild(span);
            para.setAttribute("style", "margin-bottom: 0px;");
            if (index != this.charts[graphId].breadCrumb.length - 1) {
                para.append(" > ");
                span.addEventListener("click", (event) => {
                    console.log(event.target.id);
                    if (event.target.id == "Home") {
                        let d = {
                            graphId: graphId.split("-")[1],
                            dataFilter: this.charts[graphId].dashboardFilter,
                            direction: this.charts[graphId].order,
                            adminId: this.charts[graphId].adminId,
                            shareid: this.charts[graphId].shareid ?? null,
                            startDate: this.charts[graphId].range.startDate ?? null,
                            endDate: this.charts[graphId].range.endDate ?? null
                        };
                        Swal.fire({
                            text: "Please Wait...",
                            allowOutsideClick: false
                        });
                        Swal.showLoading();
                        this.dataService.getGraphDataById(d).then((res) => {
                            this.charts[graphId].graphData = res.data;
                            Swal.hideLoading();
                            Swal.close();
                            this.buildGraph({ ...this.charts[graphId],
                                breadCrumb: ['Home'],
                                currLevel: 0,
                                selKeys: [],
                                order: 0,
                                prevLevelData: [],
                                colToShow: '' });
                        });
                        // _this.charts[graphId].graphData = _this.charts[graphId].prevLevelData[0];
                        // _this.buildGraph({
                        //   ..._this.charts[graphId],
                        //   breadCrumb: ['Home'],
                        //   currLevel: 0,
                        //   prevLevelData: [],
                        //   order: 0,
                        //   selKeys: [],
                        //   colToShow: '',
                        // } as GraphData)
                    }
                    else {
                        const index = _this.charts[graphId].breadCrumb.findIndex((el) => el == event.target.id);
                        console.log('index: ', index);
                        if (index > 0) {
                            // this.buildGraph()
                            console.log('prev  _this.charts[graphId]: ', _this.charts[graphId]);
                            //Restoring Data using previous store data
                            _this.charts[graphId].currLevel = index;
                            _this.charts[graphId].graphData = _this.charts[graphId].prevLevelData[index];
                            //Refresh Previous Data List
                            _this.charts[graphId].prevLevelData = _this.charts[graphId].prevLevelData.slice(0, index);
                            _this.charts[graphId].breadCrumb = _this.charts[graphId].breadCrumb.slice(0, index + 1);
                            _this.charts[graphId].selKeys = _this.charts[graphId].selKeys?.slice(0, index);
                            console.log('_this.charts[graphId]: ', _this.charts[graphId]);
                            _this.buildGraph({
                                ..._this.charts[graphId],
                            });
                        }
                    }
                });
            }
            breadCrumb.appendChild(para);
            let _this = this;
        });
        div.appendChild(breadCrumb);
    }
    //trends Data
    buildTrend(trendData) {
        //Set TrendsObject with GraphId
        this.trends[trendData.graphId] = trendData;
        this.initTrend(trendData.graphId);
    }
    async initTrend(graphId) {
        //Creating Chart Raw Json
        const trendData = await this.createTrendData(graphId);
        console.log('trendData: ', trendData);
        //Rendering Chart of GraphId
        console.log('graphId: ', graphId);
        setTimeout(() => {
            this.highcharts.chart(graphId, trendData);
        }, 500);
        this.addActionBtnTrends(graphId);
        return true;
    }
    addActionBtnTrends(graphId) {
        if (this.systemApis.includes(this.trends[graphId].sourceId)) {
            return;
        }
        let _self = this;
        const div = document.createElement('div');
        div.setAttribute('style', this.divStyles);
        let calendarIcon = document.createElement('i'); //Calendar Icon
        calendarIcon.setAttribute('style', this.iconStyles);
        calendarIcon.setAttribute('class', 'fa fa-calendar');
        const downloadIcon = document.createElement("i");
        downloadIcon.setAttribute('id', 'download@' + graphId);
        downloadIcon.setAttribute('style', this.iconStyles);
        downloadIcon.setAttribute('class', 'fa fa-download');
        div.appendChild(downloadIcon);
        div.appendChild(calendarIcon);
        //Calendar Icon Click handler
        calendarIcon.addEventListener('click', function (e) {
            var _a;
            if (e.target.localName == 'i') {
                if (((_a = document.getElementById('hidden-date-' + graphId)) === null ||
                    _a === void 0
                    ? void 0
                    : _a.style.display) == 'block') {
                    document.getElementById('hidden-date-' + graphId).style.display =
                        'none'; // Hide Change Date modal
                }
                else {
                    document.getElementById('hidden-date-' + graphId).style.display =
                        'block'; //Show Change Date modal
                }
            }
        });
        let div2 = document.createElement('div'); //Change Date Modal
        div2.setAttribute('style', this.divStyles +
            'display: none;padding: 30%;height: 220px;background-color: #ccc;width: 172px;border-radius: 5px;');
        div2.setAttribute('id', 'hidden-date-' + graphId);
        let startDateInput = document.createElement('input'); //Start Date Input
        let startDateLabel = document.createElement('label');
        startDateLabel.innerHTML = 'Start Date';
        startDateInput.setAttribute('type', 'date');
        startDateInput.setAttribute('class', 'form-control startDate-' + graphId);
        startDateInput.setAttribute('value', this.trends[graphId].range.startDate);
        let endDateInput = document.createElement('input'); //End Date Input
        let endDateLabel = document.createElement('label');
        endDateLabel.innerHTML = 'End Date';
        endDateInput.setAttribute('type', 'date');
        endDateInput.setAttribute('class', 'form-control endDate-' + graphId);
        endDateInput.setAttribute('value', this.trends[graphId].range.endDate);
        let submitButton = document.createElement('button');
        submitButton.innerHTML = 'Done';
        submitButton.setAttribute('class', 'btn btn-success');
        submitButton.setAttribute('style', 'float: right;');
        //Handle Submit button click
        submitButton.addEventListener('click', function () {
            let startDate = document.querySelector('.startDate-' + graphId);
            let endDate = document.querySelector('.endDate-' + graphId);
            let d = {
                graphId: graphId.split("-")[1],
                dataFilter: _self.trends[graphId].dashboardFilter,
                direction: _self.trends[graphId].order,
                adminId: _self.trends[graphId].adminId,
                shareid: _self.trends[graphId].shareid ?? null,
                startDate: startDate.value,
                endDate: endDate.value
            };
            Swal.fire({
                text: "Please Wait...",
                allowOutsideClick: false
            });
            Swal.showLoading();
            _self.dataService.getGraphDataById(d).then((res) => {
                _self.trends[graphId].graphData = res.data;
                Swal.hideLoading();
                Swal.close();
                _self.buildTrend(_self.trends[graphId]);
            });
            document.getElementById('hidden-date-' + graphId).style.display = 'none';
        });
        div2.append(startDateLabel, startDateInput, document.createElement('br'), endDateLabel, endDateInput, document.createElement('br'), submitButton); // Appending Inputs in Change Date Modal
        div.append(calendarIcon); //Add Calendar icon in action button
        div.appendChild(div2); //Add Change Date modal in action button
        document.querySelector('#' + graphId).appendChild(div); //Rendering action buttons to graph div
        downloadIcon.addEventListener('click', function (e) {
            const tempArr = e.target.id.split('@');
            const graphId = tempArr[tempArr.length - 1];
            let dataObj = {
                graphId: graphId.split("-")[1],
                currLevel: 0,
                colId: null,
                selKey: _self.trends[graphId].selKeys,
                colToShow: null,
                direction: 0,
                dataFilter: _self.trends[graphId].dashboardFilter,
                adminId: _self.trends[graphId].adminId,
                shareid: _self.trends[graphId].shareid ?? null,
                startDate: _self.datePipe.transform(_self.trends[graphId].range.startDate, "yyyy-MM-dd"),
                endDate: _self.datePipe.transform(_self.trends[graphId].range.endDate, "yyyy-MM-dd"),
                fetchRawData: true
            };
            _self.downloadGraphData(e, graphId, dataObj, _self.trends[graphId].lastLevelColumns);
        });
    }
    getPlotOptionsTrends(graphId) {
        let plotOptions = {
            series: {
                turboThreshold: 10000,
                dataLabels: {
                    color: 'black',
                    enabled: true,
                    style: {
                        color: 'black',
                        textShadow: false,
                        textDecoration: 'none',
                    },
                },
                label: {
                    style: {
                        color: 'black',
                    },
                },
            },
        };
        return plotOptions;
    }
    createTrendData(graphId) {
        let _self = this;
        //Getting Plot Options for Graph
        const plotOptions = this.getPlotOptionsTrends(graphId);
        return {
            credits: {
                text: this.creditTitle,
                href: this.creditUrl,
                style: {
                    fontSize: '12px',
                },
            },
            title: null,
            plotOptions: plotOptions,
            chart: {
                type: 'line',
                events: {
                    //Handle Drilldown Event of Graph
                    drilldown: function (e) {
                        if (e.points != false)
                            return;
                        let currGraphId = e.target.userOptions.series[0].graphId; //GraphId
                        let colIndex = e.point.colIndex; //ColorIndex of bar
                        let comparisonKey = e.point.options.comparisonKey; //ColorIndex of bar
                        let chart = this;
                        chart.showLoading('Loading...');
                        let selKey = e.point.name;
                        let dataObj = {
                            graphId: currGraphId,
                            currLevel: 1,
                            colId: colIndex,
                            selKey: [selKey],
                            colToShow: null,
                            direction: 0,
                            dataFilter: _self.trends["graph-" + currGraphId].dashboardFilter,
                            adminId: _self.trends["graph-" + currGraphId].adminId,
                            shareid: _self.trends["graph-" + currGraphId].shareid ?? null,
                            startDate: _self.datePipe.transform(_self.trends["graph-" + currGraphId].range.startDate, "yyyy-MM-dd"),
                            endDate: _self.datePipe.transform(_self.trends["graph-" + currGraphId].range.endDate, "yyyy-MM-dd")
                        };
                        if (comparisonKey != null) {
                            dataObj.selKey.push(comparisonKey);
                        }
                        _self.dataService.getGraphDrilldownById(dataObj).then((res) => {
                            //Open Last Level Component
                            _self.dataService.setModalData({
                                colToView: _self.trends["graph-" + currGraphId].lastLevelColumns,
                                refData: res.data,
                            });
                            let modalOptions = {
                                panelClass: 'dataPopup-modal',
                                backdropClass: 'modal-backdrop',
                            };
                            _self.dialog.open(DataPopupComponent, modalOptions);
                            setTimeout(() => {
                                //Hide Loading in chart
                                chart.hideLoading();
                            }, 1000);
                            // return;
                        });
                    },
                },
            },
            xAxis: {
                type: 'category',
                labels: {
                    style: {
                        color: 'red',
                        textDecoration: 'none',
                        textOutline: '0px',
                    },
                },
                min: 0,
                allowDecimals: false,
                scrollbar: {
                    enabled: true,
                },
            },
            yAxis: [
                {
                    opposite: true,
                    title: {
                        text: null,
                    },
                },
            ],
            series: this.trends[graphId].graphData,
        };
    }
}
XsightsBackendService.ɵfac = i0.ɵɵngDeclareFactory({ minVersion: "12.0.0", version: "13.0.3", ngImport: i0, type: XsightsBackendService, deps: [{ token: i1$1.NgbModal }, { token: i1$1.NgbModalConfig }, { token: DataService }, { token: i4$1.DatePipe }], target: i0.ɵɵFactoryTarget.Injectable });
XsightsBackendService.ɵprov = i0.ɵɵngDeclareInjectable({ minVersion: "12.0.0", version: "13.0.3", ngImport: i0, type: XsightsBackendService, providedIn: 'root' });
i0.ɵɵngDeclareClassMetadata({ minVersion: "12.0.0", version: "13.0.3", ngImport: i0, type: XsightsBackendService, decorators: [{
            type: Injectable,
            args: [{
                    providedIn: 'root'
                }]
        }], ctorParameters: function () { return [{ type: i1$1.NgbModal }, { type: i1$1.NgbModalConfig }, { type: DataService }, { type: i4$1.DatePipe }]; } });

class XSightsWidgetComponent {
    constructor(xsights, xsightsBackend, dataService, datePipe) {
        this.xsights = xsights;
        this.xsightsBackend = xsightsBackend;
        this.dataService = dataService;
        this.datePipe = datePipe;
        this.widgetId = 0;
        this.graphPrefix = '';
        this.startDate = null;
        this.endDate = null;
        this.adminId = '0';
        this.isLoad = true;
        this.widgetLoaded = new EventEmitter();
        this.graphData = null;
        this.fields = [];
        this.pivotTable = null;
        this.structure = null;
        if (this.startDate == null) {
            this.startDate = this.datePipe.transform(new Date(new Date().setDate(new Date().getDate() - 3)), 'yyyy-MM-dd');
        }
        if (this.endDate == null) {
            this.endDate = this.datePipe.transform(new Date(), 'yyyy-MM-dd');
        }
    }
    ngOnInit() {
    }
    ngAfterContentInit() {
        //Called after ngOnInit when the component's or directive's content has been initialized.
        //Add 'implements AfterContentInit' to the class.
    }
    ngOnChanges(changes) {
        //Called before any other lifecycle hook. Use it to inject dependencies, but avoid any serious work here.
        //Add '${implements OnChanges}' to the class.
        if (changes['widgetId'].currentValue != changes['widgetId'].previousValue ||
            changes['adminId'].currentValue != changes['adminId'].previousValue ||
            changes['startDate'].currentValue != changes['startDate'].previousValue ||
            changes['endDate'].currentValue != changes['endDate'].previousValue) {
            this.renderWidget();
        }
    }
    renderWidget() {
        if (this.isLoad) {
            this.drawWidgetById().then(() => {
                this.widgetLoaded.emit({
                    isLoaded: true
                });
            });
        }
        else {
            this.widgetLoaded.emit({
                isLoaded: true
            });
        }
    }
    drawWidgetById() {
        return new Promise(async (resolve, reject) => {
            let d = {
                graphId: this.widgetId,
                dataFilter: {},
                direction: 0,
                adminId: this.adminId,
                shareid: null
            };
            let structure = JSON.parse(this.graphData.structure);
            this.structure = structure;
            this.dataService.getGraphDataById(d).then((res) => {
                let graphData = res.data;
                if (this.graphData.graphtype != 2) {
                    let tempGraphData = {
                        rows: structure.xAxis,
                        columns: structure.yAxis,
                        aggregationFunctions: structure.aggreagations,
                        filter: structure.filter,
                        customVariable: structure.derivedVariables,
                        dataFormat: [],
                        colToShow: null,
                        lastLevelColumns: structure.lastLevelData ?? [],
                        chartType: structure.chartType,
                        rangeFilter: structure.rangeFilter,
                        dateVariable: structure.dateVariable,
                        comparison: structure.comparison,
                        colColours: structure.colColours,
                        startDate: structure.startDate,
                        endDate: structure.endDate
                    };
                    this.buildChart(this.graphData, graphData, tempGraphData);
                }
            });
        });
    }
    buildChart(widgetData, data, tempData) {
        let _self = this;
        return new Promise(async (resolve, reject) => {
            if (widgetData.graphtype == 1) {
                let range = {
                    startDate: this.datePipe.transform(tempData.startDate, 'yyyy-MM-dd'),
                    endDate: this.datePipe.transform(tempData.endDate, 'yyyy-MM-dd'),
                };
                let graphData = {
                    graphId: 'graph-' + widgetData.id,
                    graphTitle: widgetData.graphname,
                    rows: tempData.rows[0],
                    columns: tempData.columns[0],
                    graphTypes: tempData.chartType[0],
                    graphData: data,
                    aggregationFunctions: tempData.aggregationFunctions[0],
                    filter: tempData.filter,
                    colors: tempData.colColours[0],
                    range: range,
                    dateVariable: tempData.dateVariable,
                    rangeFilter: tempData.rangeFilter,
                    comparison: tempData.comparison ?? [],
                    customVariable: tempData.customVariable,
                    dataFormat: tempData.dataFormat ?? [],
                    lastLevelColumns: tempData.lastLevelColumns ?? [],
                    selKeys: [],
                    adminId: this.adminId,
                    sourceId: widgetData.sourceid,
                    dashboardFilter: []
                };
                let response = await _self.xsightsBackend.build(WidgetType$1.TREND, graphData);
                resolve(response);
            }
            else if (widgetData.graphtype == 3) {
                let tableData = {
                    rows: tempData.rows,
                    column: tempData.columns,
                    aggregationFunction: tempData.aggregationFunctions,
                    filter: tempData.filter,
                    derivedVariables: tempData.customVariable,
                    dataFormat: tempData.dataFormat ?? [],
                    data: data,
                    categories: tempData.chartType
                };
                _self.pivotTable =
                    await _self.xsights.build(WidgetType$1.PIVOT_TABLE, tableData);
                resolve(true);
            }
            else {
                let graphdata = {
                    graphId: 'graph-' + widgetData.id,
                    graphTitle: widgetData.graphname,
                    rows: tempData.rows,
                    adminId: this.adminId,
                    columns: tempData.columns,
                    aggregationFunctions: tempData.aggregationFunctions,
                    filter: tempData.filter,
                    customVariable: tempData.customVariable,
                    selKeys: [],
                    sourceId: widgetData.sourceid,
                    dataFormat: tempData.dataFormat ?? [],
                    lastLevelColumns: tempData.lastLevelColumns ?? [],
                    graphTypes: tempData.chartType,
                    graphData: data,
                    colors: tempData.colColours,
                    dashboardFilter: []
                };
                setTimeout(() => {
                    let response = this.xsightsBackend.build(WidgetType$1.GRAPH, graphdata);
                }, 500);
                resolve(true);
            }
        });
    }
}
XSightsWidgetComponent.ɵfac = i0.ɵɵngDeclareFactory({ minVersion: "12.0.0", version: "13.0.3", ngImport: i0, type: XSightsWidgetComponent, deps: [{ token: XSightsCoreService }, { token: XsightsBackendService }, { token: DataService }, { token: i4$1.DatePipe }], target: i0.ɵɵFactoryTarget.Component });
XSightsWidgetComponent.ɵcmp = i0.ɵɵngDeclareComponent({ minVersion: "12.0.0", version: "13.0.3", type: XSightsWidgetComponent, selector: "x-sights-widget", inputs: { widgetId: "widgetId", graphPrefix: "graphPrefix", startDate: "startDate", endDate: "endDate", adminId: "adminId", isLoad: "isLoad", graphData: "graphData" }, outputs: { widgetLoaded: "widgetLoaded" }, usesOnChanges: true, ngImport: i0, template: "<ng-container *ngIf=\"graphData != null\">\n    <div class=\"header-classs\" *ngIf=\"graphData.graphtype == 2\">\n        <h3>{{graphData.name}}</h3>\n    </div>\n    <div class=\"graph-class\" *ngIf=\"graphData.graphtype != 2 && !isLoad\">\n        <h3>{{graphData.name}}</h3>\n    </div>\n    <ng-container *ngIf=\"isLoad && graphData.graphtype != 2 && graphData.graphtype != 3\">\n        <div class=\"widgetContainer\" style=\"padding: 0px;\"> <!-- loader start -->\n            <h3 *ngIf=\"graphData.structure.xAxis[0] != '***LABEL***'\" style=\"text-align: center; background-color: #eee; padding: 2px;\">{{graphData.name}}</h3>\n            <div [id]=\"'graph-' + graphPrefix + widgetId\"  style=\"position: relative; padding: 10px; padding-top: 45px;\">\n                <div class=\"lds-ellipsis\">\n                    <div></div>\n                    <div></div>\n                    <div></div>\n                    <div></div>\n                </div> <!-- loader end -->\n            </div>\n        </div>\n    </ng-container>\n    <div *ngIf=\"isLoad && graphData.graphtype == 3 && pivotTable\"\n        style=\"display: flex; flex-direction:column; width: 100%; align-items: center;\">\n        <p style=\"font-size: 16px; font-weight: 600;\">{{graphData.name}}</p> <dx-pivot-grid [allowSortingBySummary]=\"true\"\n            [allowSorting]=\"true\" [allowFiltering]=\"true\" [showBorders]=\"true\" [dataSource]=\"pivotTable\"> <dxo-field-chooser\n                [enabled]=\"false\"></dxo-field-chooser> </dx-pivot-grid>\n    </div>\n</ng-container>", styles: [".widgetContainer{position:relative;min-height:300px;width:-webkit-fill-available;display:flex;align-items:center;justify-content:center}.header-classs{padding:20px;width:100%;background:#eac9a8;color:#fff;display:flex;align-items:center;justify-content:center}.graph-class{height:200px;width:100%;display:flex;align-items:center;justify-content:center;background:#eee}.graph-class h3{margin-bottom:0;font-size:28px;font-weight:400}.header-classs h3{margin-bottom:0;font-size:31px;font-weight:500}.lds-ellipsis{display:flex;align-items:center;position:relative;width:80px;margin:auto;height:80px}.lds-ellipsis div{position:absolute;top:33px;width:13px;height:13px;border-radius:50%;background:#000;animation-timing-function:cubic-bezier(0,1,1,0)}.lds-ellipsis div:nth-child(1){left:8px;animation:lds-ellipsis1 .6s infinite}.lds-ellipsis div:nth-child(2){left:8px;animation:lds-ellipsis2 .6s infinite}.lds-ellipsis div:nth-child(3){left:32px;animation:lds-ellipsis2 .6s infinite}.lds-ellipsis div:nth-child(4){left:56px;animation:lds-ellipsis3 .6s infinite}@keyframes lds-ellipsis1{0%{transform:scale(0)}to{transform:scale(1)}}@keyframes lds-ellipsis3{0%{transform:scale(1)}to{transform:scale(0)}}@keyframes lds-ellipsis2{0%{transform:translate(0)}to{transform:translate(24px)}}\n"], components: [{ type: i6.DxPivotGridComponent, selector: "dx-pivot-grid", inputs: ["allowExpandAll", "allowFiltering", "allowSorting", "allowSortingBySummary", "dataFieldArea", "dataSource", "disabled", "elementAttr", "encodeHtml", "export", "fieldChooser", "fieldPanel", "headerFilter", "height", "hideEmptySummaryCells", "hint", "loadPanel", "rowHeaderLayout", "rtlEnabled", "scrolling", "showBorders", "showColumnGrandTotals", "showColumnTotals", "showRowGrandTotals", "showRowTotals", "showTotalsPrior", "stateStoring", "tabIndex", "texts", "visible", "width", "wordWrapEnabled"], outputs: ["onCellClick", "onCellPrepared", "onContentReady", "onContextMenuPreparing", "onDisposing", "onExporting", "onInitialized", "onOptionChanged", "allowExpandAllChange", "allowFilteringChange", "allowSortingChange", "allowSortingBySummaryChange", "dataFieldAreaChange", "dataSourceChange", "disabledChange", "elementAttrChange", "encodeHtmlChange", "exportChange", "fieldChooserChange", "fieldPanelChange", "headerFilterChange", "heightChange", "hideEmptySummaryCellsChange", "hintChange", "loadPanelChange", "rowHeaderLayoutChange", "rtlEnabledChange", "scrollingChange", "showBordersChange", "showColumnGrandTotalsChange", "showColumnTotalsChange", "showRowGrandTotalsChange", "showRowTotalsChange", "showTotalsPriorChange", "stateStoringChange", "tabIndexChange", "textsChange", "visibleChange", "widthChange", "wordWrapEnabledChange"] }, { type: i7.DxoFieldChooserComponent, selector: "dxo-field-chooser", inputs: ["allowSearch", "applyChangesMode", "enabled", "height", "layout", "searchTimeout", "texts", "title", "width"] }], directives: [{ type: i4$1.NgIf, selector: "[ngIf]", inputs: ["ngIf", "ngIfThen", "ngIfElse"] }] });
i0.ɵɵngDeclareClassMetadata({ minVersion: "12.0.0", version: "13.0.3", ngImport: i0, type: XSightsWidgetComponent, decorators: [{
            type: Component,
            args: [{ selector: 'x-sights-widget', template: "<ng-container *ngIf=\"graphData != null\">\n    <div class=\"header-classs\" *ngIf=\"graphData.graphtype == 2\">\n        <h3>{{graphData.name}}</h3>\n    </div>\n    <div class=\"graph-class\" *ngIf=\"graphData.graphtype != 2 && !isLoad\">\n        <h3>{{graphData.name}}</h3>\n    </div>\n    <ng-container *ngIf=\"isLoad && graphData.graphtype != 2 && graphData.graphtype != 3\">\n        <div class=\"widgetContainer\" style=\"padding: 0px;\"> <!-- loader start -->\n            <h3 *ngIf=\"graphData.structure.xAxis[0] != '***LABEL***'\" style=\"text-align: center; background-color: #eee; padding: 2px;\">{{graphData.name}}</h3>\n            <div [id]=\"'graph-' + graphPrefix + widgetId\"  style=\"position: relative; padding: 10px; padding-top: 45px;\">\n                <div class=\"lds-ellipsis\">\n                    <div></div>\n                    <div></div>\n                    <div></div>\n                    <div></div>\n                </div> <!-- loader end -->\n            </div>\n        </div>\n    </ng-container>\n    <div *ngIf=\"isLoad && graphData.graphtype == 3 && pivotTable\"\n        style=\"display: flex; flex-direction:column; width: 100%; align-items: center;\">\n        <p style=\"font-size: 16px; font-weight: 600;\">{{graphData.name}}</p> <dx-pivot-grid [allowSortingBySummary]=\"true\"\n            [allowSorting]=\"true\" [allowFiltering]=\"true\" [showBorders]=\"true\" [dataSource]=\"pivotTable\"> <dxo-field-chooser\n                [enabled]=\"false\"></dxo-field-chooser> </dx-pivot-grid>\n    </div>\n</ng-container>", styles: [".widgetContainer{position:relative;min-height:300px;width:-webkit-fill-available;display:flex;align-items:center;justify-content:center}.header-classs{padding:20px;width:100%;background:#eac9a8;color:#fff;display:flex;align-items:center;justify-content:center}.graph-class{height:200px;width:100%;display:flex;align-items:center;justify-content:center;background:#eee}.graph-class h3{margin-bottom:0;font-size:28px;font-weight:400}.header-classs h3{margin-bottom:0;font-size:31px;font-weight:500}.lds-ellipsis{display:flex;align-items:center;position:relative;width:80px;margin:auto;height:80px}.lds-ellipsis div{position:absolute;top:33px;width:13px;height:13px;border-radius:50%;background:#000;animation-timing-function:cubic-bezier(0,1,1,0)}.lds-ellipsis div:nth-child(1){left:8px;animation:lds-ellipsis1 .6s infinite}.lds-ellipsis div:nth-child(2){left:8px;animation:lds-ellipsis2 .6s infinite}.lds-ellipsis div:nth-child(3){left:32px;animation:lds-ellipsis2 .6s infinite}.lds-ellipsis div:nth-child(4){left:56px;animation:lds-ellipsis3 .6s infinite}@keyframes lds-ellipsis1{0%{transform:scale(0)}to{transform:scale(1)}}@keyframes lds-ellipsis3{0%{transform:scale(1)}to{transform:scale(0)}}@keyframes lds-ellipsis2{0%{transform:translate(0)}to{transform:translate(24px)}}\n"] }]
        }], ctorParameters: function () { return [{ type: XSightsCoreService }, { type: XsightsBackendService }, { type: DataService }, { type: i4$1.DatePipe }]; }, propDecorators: { widgetId: [{
                type: Input
            }], graphPrefix: [{
                type: Input
            }], startDate: [{
                type: Input
            }], endDate: [{
                type: Input
            }], adminId: [{
                type: Input
            }], isLoad: [{
                type: Input
            }], widgetLoaded: [{
                type: Output
            }], graphData: [{
                type: Input
            }] } });

class XSightsBackendDashboardComponent {
    constructor(xsightsBackend, xsights, toastService, datePipe, dataService) {
        this.xsightsBackend = xsightsBackend;
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
        this.showLoading = new EventEmitter();
        this.dashboardData = null;
        this.fromDate = null;
        this.toDate = null;
        this.showHeaderInputs = false;
        this.filters = [];
        this.selFilters = {};
        this.liveRefreshMin = 5;
        this.seriesData = {};
        this.pivotTables = {};
        this.dashPublicUrl = '';
        this.dropdownSettings = {};
        this.tableGraphs = [];
        this.calledSourceData = {};
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
        this.showLoading.emit(true);
        this.getGraphDashBoardById();
    }
    ngOnDestroy() {
        //Called once, before the instance is destroyed.
        //Add 'implements OnDestroy' to the class.
        clearInterval(this.dashboardInterval);
    }
    ngOnChanges(changes) {
        //Called before any other lifecycle hook. Use it to inject dependencies, but avoid any serious work here.
        //Add '${implements OnChanges}' to the class.
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
    getGraphDashBoardById() {
        let filter = {};
        this.filters.forEach((f) => {
            if (filter[f.sourceId]) {
                filter[f.sourceId] = {
                    ...filter[f.sourceId],
                    [f.fieldName]: f.selValues.map((value) => value.text)
                };
            }
            else {
                filter[f.sourceId] = {
                    [f.fieldName]: f.selValues.map((value) => value.text)
                };
            }
        });
        this.selFilters = filter;
        let data = {
            dashboardId: this.dashboardId,
            filters: filter,
            startDate: this.startDate == null ? null : this.datePipe.transform(new Date(this.startDate), "yyyy-MM-dd"),
            endDate: this.endDate == null ? null : this.datePipe.transform(new Date(this.endDate), "yyyy-MM-dd")
        };
        if (this.isDateDifferenceGreaterThan15Days(this.startDate, this.endDate)) {
            Swal.fire({
                title: "Error",
                text: "Date range greater than 30 days is not supported",
                icon: "error",
                showCloseButton: true
            });
            this.showLoading.emit(false);
            return;
        }
        this.dataService
            .getGraphDashBoardById(data, this.adminId)
            .then(async (res) => {
            this.showLoading.emit(false);
            this.filters = this.filters.length == 0 ? res.data[0]?.filters.map((filter) => {
                filter["values"] = JSON.parse(filter["values"]).map((value, index) => {
                    return {
                        id: index,
                        text: value
                    };
                });
                filter["selValues"] = filter["selValues"] ? filter["selValues"] : [];
                return filter;
            }) ?? [] : this.filters;
            this.seriesData = res.data[0]?.seriesData;
            res.data[0].graphs = res.data[0].graphs.sort(this.setGraphOrder);
            this.dashboardData = res.data[0];
            setTimeout(() => {
                for (const element of this.dashboardData.graphs) {
                    const graph = element;
                    if (this.systemApis.includes(graph.sourceid.toString())) {
                        this.showHeaderInputs = true;
                    }
                    if (graph.graphType != 2 && graph.graphType != 3) {
                        let res = this.seriesData[graph.graph_id];
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
                        this.buildChart(graph, res, tempGraphData, this.selFilters);
                    }
                    else if (graph.graphType == 3) {
                        this.tableGraphs.push(graph);
                        console.log('this.tableGraphs: ', this.tableGraphs);
                    }
                }
                this.loadingComplete();
            }, 500);
        }).catch(err => {
            console.log(err);
        });
    }
    isDateDifferenceGreaterThan15Days(date1, date2) {
        // Create Date objects
        const startDate = new Date(date1);
        const endDate = new Date(date2);
        // Calculate the difference in milliseconds
        const differenceInMillis = Math.abs(startDate - endDate);
        // Calculate the difference in days
        const differenceInDays = differenceInMillis / (1000 * 60 * 60 * 24);
        // Check if the difference is greater than 15 days
        return differenceInDays > 30;
    }
    async renderTable() {
        if (this.tableGraphs.length > 0) {
            this.tableGraphs.forEach(async (graph) => {
                let data = await this.generateDashboard(graph, false);
                console.log('data: ', data);
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
                    tempGraphData = this.dataService.keyConverter(tempGraphData, data[0].columns, 1);
                }
                this.buildChart(graph, data[0].data, tempGraphData, null);
            });
        }
    }
    generateDashboard(graph, reCall = false) {
        return new Promise((resolve, reject) => {
            if (this.calledSourceData.hasOwnProperty(graph.sourceid.toString()) &&
                !reCall) {
                resolve(this.calledSourceData[graph.sourceid.toString()]);
            }
            else {
                let d = {
                    graphId: graph.graph_id,
                    dataFilter: this.selFilters,
                    direction: 0,
                    adminId: this.adminId,
                    shareid: null,
                    startTime: this.startDate ?? this.fromDate,
                    endTime: this.endDate ?? this.toDate
                };
                this.dataService.getGraphDataById(d).then((res) => {
                    Swal.hideLoading();
                    Swal.close();
                    let dumpData = res.data;
                    // this.uniqueSourceData.push(graph);
                    if (graph.dataType == 'remote-json' &&
                        !this.systemApis.includes(graph.sourceid.toString())) {
                        res.data = this.dataService.parseDataFormat(res.data, graph.dataFormat);
                    }
                    this.calledSourceData[graph.sourceid.toString()] = dumpData;
                    resolve(dumpData);
                })
                    .catch((err) => {
                    Swal.hideLoading();
                    Swal.close();
                    this.toastService.error('Unable to Fetch Data');
                });
            }
        });
    }
    buildChart(widgetData, data, tempData, dashboardFilter) {
        let _self = this;
        return new Promise(async (resolve, reject) => {
            let range = {};
            if (this.systemApis.includes(widgetData.sourceid.toString())) {
                range = {
                    startDate: this.startDate ?? this.fromDate,
                    endDate: this.endDate ?? this.toDate,
                };
            }
            if (widgetData.graphType == 1) {
                if (!this.systemApis.includes(widgetData.sourceid.toString())) {
                    range = {
                        startDate: this.datePipe.transform(widgetData.graph_structure.startDate, 'yyyy-MM-dd'),
                        endDate: this.datePipe.transform(widgetData.graph_structure.endDate, 'yyyy-MM-dd'),
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
                    selKeys: [],
                    adminId: this.adminId,
                    sourceId: widgetData.sourceId,
                    dashboardFilter: dashboardFilter
                };
                let response = await _self.xsightsBackend.build(WidgetType$1.TREND, graphData);
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
                    range: range,
                    categories: widgetData.graph_structure.chartType
                };
                _self.pivotTables['table-' + widgetData.graph_id] =
                    await _self.xsights.build(WidgetType$1.PIVOT_TABLE, tableData);
                resolve(true);
            }
            else {
                let graphdata = {
                    graphId: 'graph-' + widgetData.graph_id,
                    graphTitle: widgetData.graphname,
                    rows: tempData.rows,
                    adminId: this.adminId,
                    columns: tempData.columns,
                    aggregationFunctions: tempData.aggregationFunctions,
                    filter: tempData.filter,
                    customVariable: tempData.customVariable,
                    selKeys: [],
                    range: range,
                    sourceId: widgetData.sourceId,
                    dataFormat: tempData.dataFormat ?? [],
                    lastLevelColumns: tempData.lastLevelColumns ?? [],
                    graphTypes: widgetData.graph_structure.chartType,
                    graphData: data,
                    colors: widgetData.graph_structure.colColours,
                    dashboardFilter: dashboardFilter
                };
                setTimeout(() => {
                    let response = this.xsightsBackend.build(WidgetType$1.GRAPH, graphdata);
                }, 500);
                resolve(true);
            }
        });
    }
    loadingComplete() {
        this.renderTable();
        this.isDashboardLoaded.emit({
            isLoaded: true,
            hasSystemApi: this.showHeaderInputs
        });
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
}
XSightsBackendDashboardComponent.ɵfac = i0.ɵɵngDeclareFactory({ minVersion: "12.0.0", version: "13.0.3", ngImport: i0, type: XSightsBackendDashboardComponent, deps: [{ token: XsightsBackendService }, { token: XSightsCoreService }, { token: i2.ToastrService }, { token: i4$1.DatePipe }, { token: DataService }], target: i0.ɵɵFactoryTarget.Component });
XSightsBackendDashboardComponent.ɵcmp = i0.ɵɵngDeclareComponent({ minVersion: "12.0.0", version: "13.0.3", type: XSightsBackendDashboardComponent, selector: "lib-x-sights-backend-dashboard", inputs: { dashboardId: "dashboardId", adminId: "adminId", showHeader: "showHeader", showFilters: "showFilters", startDate: "startDate", endDate: "endDate", toggleDashboard: "toggleDashboard" }, outputs: { isDashboardLoaded: "isDashboardLoaded", showLoading: "showLoading" }, usesOnChanges: true, ngImport: i0, template: "<div class=\"row\" *ngIf=\"dashboardData != null\">\n    <div class=\"col-md-12\">\n        <div class=\"dash_graph_sec\">\n            <div class=\"dash_graph\">\n                <div style=\"display: flex; background-color:#000;\" *ngIf=\"showHeader\">\n                    <h3 class=\"graph_name\" style=\"height: 44px;flex:auto;text-transform:capitalize;\">\n                        {{dashboardData.dashboard_name}} &nbsp; <span class=\"badge badge-warning\"\n                            *ngIf=\"dashboardData.dashboard_type == 1\">LIVE</span> </h3>\n                    <div class=\"row date-container\" *ngIf=\"showHeaderInputs\">\n                        <div class=\"col-lg-6\"> <label for=\"startDate\">From &nbsp;&nbsp;</label> <input type=\"date\"\n                                [(ngModel)]=\"fromDate\" id=\"startDate\" class=\"form-control\"> </div>\n                        <div class=\"col-lg-6\"> <label for=\"endDate\">To &nbsp;&nbsp;</label> <input type=\"date\"\n                                [(ngModel)]=\"toDate\" id=\"endDate\" class=\"form-control\">\n                        </div>\n                        <button class=\"btn btn-primary\" (click)=\"renderPage()\">Search</button>\n                    </div>\n                </div>\n                <div class=\"filter-container\" *ngIf=\"filters.length\">\n                    <h3>Filters:</h3>\n                    <div class=\"col-lg-12 row\">\n                        <div class=\"col-lg-3\" *ngFor=\"let filter of filters;let i = index\"> \n                            <ng-multiselect-dropdown\n                                [placeholder]=\"'Select ' + filter.fieldName + '...'\" [(ngModel)]=\"filter.selValues\"\n                                [settings]=\"dropdownSettings\" [data]=\"filter.values\"> \n                            </ng-multiselect-dropdown> \n                        </div>\n                    </div>\n                    <div class=\"col-lg-12\">\n                        <button class=\"btn btn-primary\" (click)=\"getGraphDashBoardById()\">Apply Filter</button>\n                    </div>\n                </div>\n                <div class=\"row graph_design\" id=\"dashboardScreen\" #dashboardScreen> <ng-container\n                        *ngFor=\"let graph of dashboardData.graphs;\">\n                        \n                        <ng-container *ngIf=\"graph.graphType != 3 && graph.graphType != 2\">\n                            <div class=\"dashboard-graph\"\n                                [ngClass]=\"{'col-lg-12': graph.graph_index == 1,'col-lg-6': graph.graph_index == 2,'col-lg-4': graph.graph_index == 3,'col-lg-3': graph.graph_index == 4}\"\n                                style=\"min-height: 370px; padding: 0px;\"> <!-- loader start -->\n                                <h3 *ngIf=\"graph.graph_structure.xAxis[0] != '***LABEL***'\" style=\"text-align: center; background-color: #eee; padding: 2px;\">{{graph.graphname}}</h3>\n                                <div [id]=\"'graph-'+ graph.graph_id\" style=\"position: relative; padding: 10px; padding-top: 45px;\">\n                                    <div class=\"lds-ellipsis\">\n                                        <div></div>\n                                        <div></div>\n                                        <div></div>\n                                        <div></div>\n                                    </div> <!-- loader end -->\n                                </div>\n                            </div>\n                        </ng-container>\n                        <div *ngIf=\"graph.graphType == 2\" class=\"dashboard-graph\" [id]=\"'table-graph-'+ graph.graph_id\"\n                            [ngClass]=\"{'col-lg-12': graph.graph_index == 1,'col-lg-6': graph.graph_index == 2,'col-lg-4': graph.graph_index == 3,'col-lg-3': graph.graph_index == 4}\"\n                            style=\"display: flex; flex-direction: column; border-bottom: 0px; background-color:antiquewhite;\">\n                            <!-- loader start -->\n                            <h2 style=\"text-align: center; margin-bottom: 0px;\">{{graph.graphname}}</h2>\n                            <!-- loader end -->\n                        </div>\n                        <div *ngIf=\"graph.graphType == 3\" class=\"dashboard-graph\" [id]=\"'table-'+ graph.graph_id\"\n                            [ngClass]=\"{'col-lg-12': graph.graph_index == 1,'col-lg-6': graph.graph_index == 2,'col-lg-4': graph.graph_index == 3,'col-lg-3': graph.graph_index == 4}\"\n                            style=\"min-height: 300px; display: flex; flex-direction: column; padding-bottom: 2%;\">\n                            <!-- loader start -->\n                            <h3 style=\"text-align: center;\">{{graph.graphname}}</h3> <ng-container\n                                *ngIf=\"pivotTables.hasOwnProperty('table-' + graph.graph_id)\"> <dx-pivot-grid\n                                    [allowSortingBySummary]=\"true\" [allowSorting]=\"true\" [allowFiltering]=\"true\"\n                                    [showBorders]=\"true\" [dataSource]=\"pivotTables['table-' + graph.graph_id]\">\n                                    <dxo-field-chooser [enabled]=\"false\"></dxo-field-chooser> </dx-pivot-grid>\n                            </ng-container> <ng-container *ngIf=\"pivotTables['table-' + graph.graph_id] == undefined\">\n                                <div class=\"lds-ellipsis\">\n                                    <div></div>\n                                    <div></div>\n                                    <div></div>\n                                    <div></div>\n                                </div>\n                            </ng-container> <!-- loader end -->\n                        </div>\n                    </ng-container> </div>\n            </div>\n        </div>\n    </div>\n</div>", styles: [".left-sidebar .nav-link{text-transform:capitalize}.left-sidebar i{margin-right:10px}.left-sidebar .nav-tabs .nav-item{text-transform:capitalize}::ng-deep .left-sidebar .nav-item{text-transform:capitalize}::ng-deep .modal{z-index:1060}.search-filter{height:23px}.search-group{display:flex;align-items:center;justify-content:space-between}.search-group .filter-icon{margin:0}.dash_graph_sec{overflow:auto}.dash_graph_sec .dash_graph{background-color:#fff;margin:15px}.dash_graph_sec .dash_graph .graph_name{text-align:center;align-self:flex-end;color:#fff;padding:5px;margin-bottom:0}.dash_graph_sec .dash_graph .graph_design{margin:0}.dashboard-graph{border:3px solid #dadada;align-items:center;justify-content:center}.modal{z-index:1060!important}::ng-deep .dropdown-custom{inset:103% 0 auto auto!important}.dashname{border-style:groove;background-color:#eee;width:64px;height:34px;display:flex;justify-content:center;align-items:center}.beans-list{padding-left:0;display:flex;flex-wrap:wrap}.beans{border-style:groove;background-color:#fd8309;color:#fff;border-radius:10px;padding:1%;border-color:#fd8309}.graph-source{display:flex;justify-content:space-between;align-items:center}.graph-source h3{margin-bottom:0}.filter-container{padding:10px;background:whitesmoke;border:2px solid #ccc}.filter-container h3{margin-bottom:auto}.filter-container .col-lg-3{padding-left:0}.date-container{justify-content:space-between;align-items:center;color:#fff}.date-container .col-lg-6{display:flex;align-items:center}.date-container .col-lg-6 label{width:70px}\n"], components: [{ type: i5.MultiSelectComponent, selector: "ng-multiselect-dropdown", inputs: ["disabled", "placeholder", "settings", "data"], outputs: ["onFilterChange", "onDropDownClose", "onSelect", "onDeSelect", "onSelectAll", "onDeSelectAll"] }, { type: i6.DxPivotGridComponent, selector: "dx-pivot-grid", inputs: ["allowExpandAll", "allowFiltering", "allowSorting", "allowSortingBySummary", "dataFieldArea", "dataSource", "disabled", "elementAttr", "encodeHtml", "export", "fieldChooser", "fieldPanel", "headerFilter", "height", "hideEmptySummaryCells", "hint", "loadPanel", "rowHeaderLayout", "rtlEnabled", "scrolling", "showBorders", "showColumnGrandTotals", "showColumnTotals", "showRowGrandTotals", "showRowTotals", "showTotalsPrior", "stateStoring", "tabIndex", "texts", "visible", "width", "wordWrapEnabled"], outputs: ["onCellClick", "onCellPrepared", "onContentReady", "onContextMenuPreparing", "onDisposing", "onExporting", "onInitialized", "onOptionChanged", "allowExpandAllChange", "allowFilteringChange", "allowSortingChange", "allowSortingBySummaryChange", "dataFieldAreaChange", "dataSourceChange", "disabledChange", "elementAttrChange", "encodeHtmlChange", "exportChange", "fieldChooserChange", "fieldPanelChange", "headerFilterChange", "heightChange", "hideEmptySummaryCellsChange", "hintChange", "loadPanelChange", "rowHeaderLayoutChange", "rtlEnabledChange", "scrollingChange", "showBordersChange", "showColumnGrandTotalsChange", "showColumnTotalsChange", "showRowGrandTotalsChange", "showRowTotalsChange", "showTotalsPriorChange", "stateStoringChange", "tabIndexChange", "textsChange", "visibleChange", "widthChange", "wordWrapEnabledChange"] }, { type: i7.DxoFieldChooserComponent, selector: "dxo-field-chooser", inputs: ["allowSearch", "applyChangesMode", "enabled", "height", "layout", "searchTimeout", "texts", "title", "width"] }], directives: [{ type: i4$1.NgIf, selector: "[ngIf]", inputs: ["ngIf", "ngIfThen", "ngIfElse"] }, { type: i9.DefaultValueAccessor, selector: "input:not([type=checkbox])[formControlName],textarea[formControlName],input:not([type=checkbox])[formControl],textarea[formControl],input:not([type=checkbox])[ngModel],textarea[ngModel],[ngDefaultControl]" }, { type: i9.NgControlStatus, selector: "[formControlName],[ngModel],[formControl]" }, { type: i9.NgModel, selector: "[ngModel]:not([formControlName]):not([formControl])", inputs: ["name", "disabled", "ngModel", "ngModelOptions"], outputs: ["ngModelChange"], exportAs: ["ngModel"] }, { type: i4$1.NgForOf, selector: "[ngFor][ngForOf]", inputs: ["ngForOf", "ngForTrackBy", "ngForTemplate"] }, { type: i4$1.NgClass, selector: "[ngClass]", inputs: ["class", "ngClass"] }] });
i0.ɵɵngDeclareClassMetadata({ minVersion: "12.0.0", version: "13.0.3", ngImport: i0, type: XSightsBackendDashboardComponent, decorators: [{
            type: Component,
            args: [{ selector: 'lib-x-sights-backend-dashboard', template: "<div class=\"row\" *ngIf=\"dashboardData != null\">\n    <div class=\"col-md-12\">\n        <div class=\"dash_graph_sec\">\n            <div class=\"dash_graph\">\n                <div style=\"display: flex; background-color:#000;\" *ngIf=\"showHeader\">\n                    <h3 class=\"graph_name\" style=\"height: 44px;flex:auto;text-transform:capitalize;\">\n                        {{dashboardData.dashboard_name}} &nbsp; <span class=\"badge badge-warning\"\n                            *ngIf=\"dashboardData.dashboard_type == 1\">LIVE</span> </h3>\n                    <div class=\"row date-container\" *ngIf=\"showHeaderInputs\">\n                        <div class=\"col-lg-6\"> <label for=\"startDate\">From &nbsp;&nbsp;</label> <input type=\"date\"\n                                [(ngModel)]=\"fromDate\" id=\"startDate\" class=\"form-control\"> </div>\n                        <div class=\"col-lg-6\"> <label for=\"endDate\">To &nbsp;&nbsp;</label> <input type=\"date\"\n                                [(ngModel)]=\"toDate\" id=\"endDate\" class=\"form-control\">\n                        </div>\n                        <button class=\"btn btn-primary\" (click)=\"renderPage()\">Search</button>\n                    </div>\n                </div>\n                <div class=\"filter-container\" *ngIf=\"filters.length\">\n                    <h3>Filters:</h3>\n                    <div class=\"col-lg-12 row\">\n                        <div class=\"col-lg-3\" *ngFor=\"let filter of filters;let i = index\"> \n                            <ng-multiselect-dropdown\n                                [placeholder]=\"'Select ' + filter.fieldName + '...'\" [(ngModel)]=\"filter.selValues\"\n                                [settings]=\"dropdownSettings\" [data]=\"filter.values\"> \n                            </ng-multiselect-dropdown> \n                        </div>\n                    </div>\n                    <div class=\"col-lg-12\">\n                        <button class=\"btn btn-primary\" (click)=\"getGraphDashBoardById()\">Apply Filter</button>\n                    </div>\n                </div>\n                <div class=\"row graph_design\" id=\"dashboardScreen\" #dashboardScreen> <ng-container\n                        *ngFor=\"let graph of dashboardData.graphs;\">\n                        \n                        <ng-container *ngIf=\"graph.graphType != 3 && graph.graphType != 2\">\n                            <div class=\"dashboard-graph\"\n                                [ngClass]=\"{'col-lg-12': graph.graph_index == 1,'col-lg-6': graph.graph_index == 2,'col-lg-4': graph.graph_index == 3,'col-lg-3': graph.graph_index == 4}\"\n                                style=\"min-height: 370px; padding: 0px;\"> <!-- loader start -->\n                                <h3 *ngIf=\"graph.graph_structure.xAxis[0] != '***LABEL***'\" style=\"text-align: center; background-color: #eee; padding: 2px;\">{{graph.graphname}}</h3>\n                                <div [id]=\"'graph-'+ graph.graph_id\" style=\"position: relative; padding: 10px; padding-top: 45px;\">\n                                    <div class=\"lds-ellipsis\">\n                                        <div></div>\n                                        <div></div>\n                                        <div></div>\n                                        <div></div>\n                                    </div> <!-- loader end -->\n                                </div>\n                            </div>\n                        </ng-container>\n                        <div *ngIf=\"graph.graphType == 2\" class=\"dashboard-graph\" [id]=\"'table-graph-'+ graph.graph_id\"\n                            [ngClass]=\"{'col-lg-12': graph.graph_index == 1,'col-lg-6': graph.graph_index == 2,'col-lg-4': graph.graph_index == 3,'col-lg-3': graph.graph_index == 4}\"\n                            style=\"display: flex; flex-direction: column; border-bottom: 0px; background-color:antiquewhite;\">\n                            <!-- loader start -->\n                            <h2 style=\"text-align: center; margin-bottom: 0px;\">{{graph.graphname}}</h2>\n                            <!-- loader end -->\n                        </div>\n                        <div *ngIf=\"graph.graphType == 3\" class=\"dashboard-graph\" [id]=\"'table-'+ graph.graph_id\"\n                            [ngClass]=\"{'col-lg-12': graph.graph_index == 1,'col-lg-6': graph.graph_index == 2,'col-lg-4': graph.graph_index == 3,'col-lg-3': graph.graph_index == 4}\"\n                            style=\"min-height: 300px; display: flex; flex-direction: column; padding-bottom: 2%;\">\n                            <!-- loader start -->\n                            <h3 style=\"text-align: center;\">{{graph.graphname}}</h3> <ng-container\n                                *ngIf=\"pivotTables.hasOwnProperty('table-' + graph.graph_id)\"> <dx-pivot-grid\n                                    [allowSortingBySummary]=\"true\" [allowSorting]=\"true\" [allowFiltering]=\"true\"\n                                    [showBorders]=\"true\" [dataSource]=\"pivotTables['table-' + graph.graph_id]\">\n                                    <dxo-field-chooser [enabled]=\"false\"></dxo-field-chooser> </dx-pivot-grid>\n                            </ng-container> <ng-container *ngIf=\"pivotTables['table-' + graph.graph_id] == undefined\">\n                                <div class=\"lds-ellipsis\">\n                                    <div></div>\n                                    <div></div>\n                                    <div></div>\n                                    <div></div>\n                                </div>\n                            </ng-container> <!-- loader end -->\n                        </div>\n                    </ng-container> </div>\n            </div>\n        </div>\n    </div>\n</div>", styles: [".left-sidebar .nav-link{text-transform:capitalize}.left-sidebar i{margin-right:10px}.left-sidebar .nav-tabs .nav-item{text-transform:capitalize}::ng-deep .left-sidebar .nav-item{text-transform:capitalize}::ng-deep .modal{z-index:1060}.search-filter{height:23px}.search-group{display:flex;align-items:center;justify-content:space-between}.search-group .filter-icon{margin:0}.dash_graph_sec{overflow:auto}.dash_graph_sec .dash_graph{background-color:#fff;margin:15px}.dash_graph_sec .dash_graph .graph_name{text-align:center;align-self:flex-end;color:#fff;padding:5px;margin-bottom:0}.dash_graph_sec .dash_graph .graph_design{margin:0}.dashboard-graph{border:3px solid #dadada;align-items:center;justify-content:center}.modal{z-index:1060!important}::ng-deep .dropdown-custom{inset:103% 0 auto auto!important}.dashname{border-style:groove;background-color:#eee;width:64px;height:34px;display:flex;justify-content:center;align-items:center}.beans-list{padding-left:0;display:flex;flex-wrap:wrap}.beans{border-style:groove;background-color:#fd8309;color:#fff;border-radius:10px;padding:1%;border-color:#fd8309}.graph-source{display:flex;justify-content:space-between;align-items:center}.graph-source h3{margin-bottom:0}.filter-container{padding:10px;background:whitesmoke;border:2px solid #ccc}.filter-container h3{margin-bottom:auto}.filter-container .col-lg-3{padding-left:0}.date-container{justify-content:space-between;align-items:center;color:#fff}.date-container .col-lg-6{display:flex;align-items:center}.date-container .col-lg-6 label{width:70px}\n"] }]
        }], ctorParameters: function () { return [{ type: XsightsBackendService }, { type: XSightsCoreService }, { type: i2.ToastrService }, { type: i4$1.DatePipe }, { type: DataService }]; }, propDecorators: { dashboardId: [{
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
            }], showLoading: [{
                type: Output
            }] } });

class XSightsBackendPublicDashboardComponent {
    constructor(dataService, toastService, xsightsBackend, xsights) {
        this.dataService = dataService;
        this.toastService = toastService;
        this.xsightsBackend = xsightsBackend;
        this.xsights = xsights;
        this.dashboardUrl = '';
        this.adminId = 0;
        this.dashboardLoaded = new EventEmitter();
        this.mtrSource = '138';
        this.decodedParams = {};
        this.dashboardData = {};
        this.filters = [];
        this.selFilters = {};
        this.dropdownSettings = {};
        this.tableDatas = {};
        this.seriesData = {};
        this.dumpData = [];
        this.calledSourceData = {};
        this.tableGraphs = [];
    }
    ngOnInit() {
        // this.decodeUrl();
        this.dropdownSettings = {
            singleSelection: false,
            enableCheckAll: false,
            allowSearchFilter: true,
        };
    }
    ngOnChanges(changes) {
        //Called before any other lifecycle hook. Use it to inject dependencies, but avoid any serious work here.
        //Add '${implements OnChanges}' to the class.
        if (changes['dashboardUrl'].previousValue !=
            changes['dashboardUrl'].currentValue ||
            changes['adminId'].previousValue != changes['adminId'].currentValue) {
            this.decodeUrl();
        }
    }
    decodeUrl() {
        this.dataService.getDecodedUrl(this.dashboardUrl).then((res) => {
            const urlParamsStr = res.data[0].split('?')[1];
            const urlParamsArr = urlParamsStr.split('&');
            urlParamsArr.forEach((param) => {
                this.decodedParams[param.split('=')[0]] = param.split('=')[1];
            });
            this.getGraphDashBoardById();
        });
    }
    getGraphDashBoardById() {
        this.adminId = this.decodedParams.foAdminId;
        let filter = {};
        this.filters.forEach((f) => {
            if (filter[f.sourceId]) {
                filter[f.sourceId] = {
                    ...filter[f.sourceId],
                    [f.fieldName]: f.selValues.map((value) => value.text)
                };
            }
            else {
                filter[f.sourceId] = {
                    [f.fieldName]: f.selValues.map((value) => value.text)
                };
            }
        });
        this.selFilters = filter;
        let data = {
            dashboardId: this.decodedParams.dash_id,
            filters: filter,
            fileId: this.decodedParams.fileId
        };
        this.dataService
            .getSharedBackendDashboard(data, this.adminId)
            .then(async (res) => {
            this.dashboardData.id = res.data[0].share_id;
            this.filters = this.filters.length == 0 ? res.data[0]?.filters.map((filter) => {
                filter["values"] = JSON.parse(filter["values"]).map((value, index) => {
                    return {
                        id: index,
                        text: value
                    };
                });
                filter["selValues"] = filter["selValues"] ? filter["selValues"] : [];
                return filter;
            }) ?? [] : this.filters;
            this.seriesData = res.data[0]?.seriesData;
            res.data[0].graphs = res.data[0].graphs.sort(this.setGraphOrder);
            this.dashboardData = res.data[0];
            for (const element of this.dashboardData.graphs) {
                const graph = element;
                if (graph.graphType != 2 && graph.graphType != 3) {
                    let res = this.seriesData[graph.graph_id];
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
                    this.buildChart(graph, res, tempGraphData, this.selFilters);
                }
                else if (graph.graphType == 3) {
                    this.tableGraphs.push(graph);
                }
            }
            this.loadingComplete();
        });
    }
    buildChart(widgetData, data, tempData, dashboardFilter) {
        let _self = this;
        return new Promise(async (resolve, reject) => {
            if (widgetData.graphType == 1) {
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
                    range: {
                        startDate: widgetData.graph_structure.startDate,
                        endDate: widgetData.graph_structure.endDate,
                    },
                    dateVariable: tempData.dateVariable,
                    rangeFilter: widgetData.graph_structure.rangeFilter,
                    comparison: widgetData.graph_structure.comparison ?? [],
                    customVariable: tempData.customVariable,
                    dataFormat: tempData.dataFormat ?? [],
                    lastLevelColumns: tempData.lastLevelColumns ?? [],
                    selKeys: [],
                    adminId: this.adminId,
                    sourceId: widgetData.sourceId,
                    dashboardFilter: dashboardFilter,
                    shareid: this.dashboardData.id
                };
                let response = await _self.xsightsBackend.build(WidgetType$1.TREND, graphData);
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
                    range: {
                        startDate: null,
                        endDate: null
                    },
                    data: data,
                    categories: widgetData.graph_structure.chartType,
                };
                _self.tableDatas['table-graph-' + widgetData.graph_id] =
                    await _self.xsights.build(WidgetType$1.PIVOT_TABLE, tableData);
                resolve(true);
            }
            else {
                let graphdata = {
                    graphId: 'graph-' + widgetData.graph_id,
                    graphTitle: widgetData.graphname,
                    rows: tempData.rows,
                    adminId: this.adminId,
                    columns: tempData.columns,
                    aggregationFunctions: tempData.aggregationFunctions,
                    filter: tempData.filter,
                    customVariable: tempData.customVariable,
                    selKeys: [],
                    sourceId: widgetData.sourceId,
                    range: {
                        startDate: null,
                        endDate: null
                    },
                    dataFormat: tempData.dataFormat ?? [],
                    lastLevelColumns: tempData.lastLevelColumns ?? [],
                    graphTypes: widgetData.graph_structure.chartType,
                    graphData: data,
                    colors: widgetData.graph_structure.colColours,
                    dashboardFilter: dashboardFilter,
                    shareid: this.dashboardData.id
                };
                setTimeout(() => {
                    let response = this.xsightsBackend.build(WidgetType$1.GRAPH, graphdata);
                }, 500);
                resolve(true);
            }
        });
    }
    loadingComplete() {
        this.renderTable();
        this.dashboardLoaded.emit({
            isLoaded: true
        });
    }
    async renderTable() {
        if (this.tableGraphs.length > 0) {
            this.tableGraphs.forEach(async (graph) => {
                let data = await this.generateDashboard(graph, false);
                console.log('data: ', data);
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
                    tempGraphData = this.dataService.keyConverter(tempGraphData, data[0].columns, 1);
                }
                this.buildChart(graph, data[0].data, tempGraphData, null);
            });
        }
    }
    generateDashboard(graph, reCall = false) {
        return new Promise((resolve, reject) => {
            if (this.calledSourceData.hasOwnProperty(graph.sourceid.toString()) &&
                !reCall) {
                resolve(this.calledSourceData[graph.sourceid.toString()]);
            }
            else {
                let d = {
                    graphId: graph.graph_id,
                    dataFilter: this.selFilters,
                    direction: 0,
                    adminId: this.adminId,
                    shareid: this.dashboardData.id,
                    startDate: null,
                    endDate: null
                };
                this.dataService.getGraphDataById(d).then((res) => {
                    Swal.hideLoading();
                    Swal.close();
                    let keys = null;
                    let dumpData = res.data;
                    this.calledSourceData[graph.sourceid.toString()] = dumpData;
                    resolve(dumpData);
                })
                    .catch((err) => {
                    Swal.hideLoading();
                    Swal.close();
                    this.toastService.error('Unable to Fetch Data');
                });
            }
        });
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
}
XSightsBackendPublicDashboardComponent.ɵfac = i0.ɵɵngDeclareFactory({ minVersion: "12.0.0", version: "13.0.3", ngImport: i0, type: XSightsBackendPublicDashboardComponent, deps: [{ token: DataService }, { token: i2.ToastrService }, { token: XsightsBackendService }, { token: XSightsCoreService }], target: i0.ɵɵFactoryTarget.Component });
XSightsBackendPublicDashboardComponent.ɵcmp = i0.ɵɵngDeclareComponent({ minVersion: "12.0.0", version: "13.0.3", type: XSightsBackendPublicDashboardComponent, selector: "lib-x-sights-backend-public-dashboard", inputs: { dashboardUrl: "dashboardUrl", adminId: "adminId" }, outputs: { dashboardLoaded: "dashboardLoaded" }, usesOnChanges: true, ngImport: i0, template: "<div *ngIf=\"dashboardData != {}\">\n    <div class=\"dash_graph_sec\">\n        <div class=\"dash_graph dashboard-wrapper\">\n            <div>\n                <h3 class=\"graph_name\" style=\"height: 44px;\">{{dashboardData.dashboard_name}} </h3>\n            </div>\n            <div class=\"filter-container\" *ngIf=\"filters.length\">\n                <h3>Filters:</h3>\n                <div class=\"col-lg-12 row\">\n                    <div class=\"col-lg-3\" *ngFor=\"let filter of filters;let i = index\"> \n                        <ng-multiselect-dropdown\n                            [placeholder]=\"'Select ' + filter.fieldName + '...'\" [(ngModel)]=\"filter.selValues\"\n                            [settings]=\"dropdownSettings\" [data]=\"filter.values\"> \n                        </ng-multiselect-dropdown> \n                    </div>\n                </div>\n                <div class=\"col-lg-12\">\n                    <button class=\"btn btn-primary\" (click)=\"getGraphDashBoardById()\">Apply Filter</button>\n                </div>\n            </div>\n            <div class=\"row graph_design\" id=\"dashboardScreen\"> \n                <ng-container *ngFor=\"let graph of dashboardData?.graphs;let i=index;\">\n                    <!-- <div class=\"page-break\" *ngIf=\"i % 5 == 0 && i != 0\"></div> -->\n                    \n                    <ng-container *ngIf=\"graph.graphType != 3 && graph.graphType != 2\">\n                        <div class=\"dashboard-graph\"\n                            [ngClass]=\"{'col-lg-12': graph.graph_index == 1,'col-lg-6': graph.graph_index == 2,'col-lg-4': graph.graph_index == 3,'col-lg-3': graph.graph_index == 4}\"\n                            style=\"min-height: 370px; padding: 0px;\"> <!-- loader start -->\n                            <h3 *ngIf=\"graph.graph_structure.xAxis[0] != '***LABEL***'\" style=\"text-align: center; background-color: #eee; padding: 2px;\">{{graph.graphname}}</h3>\n                            <div [id]=\"'graph-'+ graph.graph_id\" style=\"position: relative; padding: 10px; padding-top: 45px;\">\n                                <div class=\"lds-ellipsis\">\n                                    <div></div>\n                                    <div></div>\n                                    <div></div>\n                                    <div></div>\n                                </div> <!-- loader end -->\n                            </div>\n                        </div>\n                    </ng-container>\n                    <div *ngIf=\"graph.graphType==2\" class=\"dashboard-graph\" [id]=\"'table-graph-'+ graph.graph_id\"\n                        [ngClass]=\"{'col-lg-12':\n                        graph.graph_index==1,'col-lg-6': graph.graph_index==2,'col-lg-4':\n                        graph.graph_index==3,'col-lg-3': graph.graph_index==4}\" style=\"display: flex;\n                        flex-direction: column; border-bottom: 0px; background-color:antiquewhite;\">\n                        <!-- loader start -->\n                        <h2 style=\"text-align: center; margin-bottom: 0px;\">\n                            {{graph.graphname}}</h2> <!-- loader end -->\n                    </div>\n                    <div *ngIf=\"graph.graphType==3\" class=\"dashboard-graph\" [id]=\"'table-graph-'+\n                        graph.graph_id\" [ngClass]=\"{'col-lg-12': graph.graph_index==1,'col-lg-6':\n                        graph.graph_index==2,'col-lg-4': graph.graph_index==3,'col-lg-3': graph.graph_index==4}\"\n                        style=\"min-height: 300px; display: flex; flex-direction: column; padding-bottom: 2%;\">\n                        <!-- loader start -->\n                        <h3 style=\"text-align: center;\">{{graph.graphname}}</h3>\n                        <ng-container *ngIf=\"tableDatas.hasOwnProperty('table-graph-' + graph.graph_id)\">\n                            <dx-pivot-grid [allowSortingBySummary]=\"true\" [allowSorting]=\"true\" [allowFiltering]=\"true\"\n                                [showBorders]=\"true\" [dataSource]=\"tableDatas['table-graph-' + graph.graph_id]\">\n                                <dxo-field-chooser [enabled]=\"false\"></dxo-field-chooser> </dx-pivot-grid>\n                        </ng-container> <ng-container *ngIf=\"tableDatas['table-graph-' +\n                            graph.graph_id]==undefined\">\n                            <div class=\"lds-ellipsis\">\n                                <div></div>\n                                <div>\n                                </div>\n                                <div></div>\n                                <div></div>\n                            </div>\n                        </ng-container>\n                        <!-- loader end -->\n                    </div>\n                </ng-container> </div>\n        </div>\n    </div>\n</div>", styles: [".left-sidebar .nav-link{text-transform:capitalize}.left-sidebar i{margin-right:10px}.left-sidebar .nav-tabs .nav-item{text-transform:capitalize}::ng-deep .left-sidebar .nav-item{text-transform:capitalize}::ng-deep .modal{z-index:1060}.filter-container{padding:10px;background:whitesmoke;border:2px solid #ccc}.filter-container h3{margin-bottom:auto}.filter-container .col-lg-3{padding-left:0}.search-filter{height:23px}.search-group{display:flex;align-items:center;justify-content:space-between}.search-group .filter-icon{margin:0}.dash_graph_sec .dash_graph{background-color:#fff}.dash_graph_sec .dash_graph .graph_name{text-align:center;background-color:#000;color:#fff;padding:5px;margin-bottom:0}.dash_graph_sec .dash_graph .graph_design{margin:0}.dashboard-graph{border:1px solid #e4e4e4;border-top:0px;align-items:center;justify-content:center}.modal{z-index:1060!important}::ng-deep .dropdown-custom{inset:103% 0 auto auto!important}.dashname{border-style:groove;background-color:#eee;width:64px;height:34px;display:flex;justify-content:center;align-items:center}.beans-list{padding-left:0;display:flex;flex-wrap:wrap}.beans{border-style:groove;background-color:#fd8309;color:#fff;border-radius:10px;padding:1%;border-color:#fd8309}.captcha-box{display:flex;justify-content:center;align-items:center;height:100%;position:absolute;width:100%;padding:5%;background:#ccc}.dashboard-wrapper{box-shadow:1px 1px 10px #ddd;border-radius:5px}.main_container{background-size:cover;background-repeat:no-repeat}@media print{.page-break{page-break-after:always!important}#dashboardScreen{display:block}}@media print{::ng-deep body,::ng-deep html,::ng-deep #wrapper{width:100%!important}::ng-deep .highcharts-root{width:100%!important}}\n"], components: [{ type: i5.MultiSelectComponent, selector: "ng-multiselect-dropdown", inputs: ["disabled", "placeholder", "settings", "data"], outputs: ["onFilterChange", "onDropDownClose", "onSelect", "onDeSelect", "onSelectAll", "onDeSelectAll"] }, { type: i6.DxPivotGridComponent, selector: "dx-pivot-grid", inputs: ["allowExpandAll", "allowFiltering", "allowSorting", "allowSortingBySummary", "dataFieldArea", "dataSource", "disabled", "elementAttr", "encodeHtml", "export", "fieldChooser", "fieldPanel", "headerFilter", "height", "hideEmptySummaryCells", "hint", "loadPanel", "rowHeaderLayout", "rtlEnabled", "scrolling", "showBorders", "showColumnGrandTotals", "showColumnTotals", "showRowGrandTotals", "showRowTotals", "showTotalsPrior", "stateStoring", "tabIndex", "texts", "visible", "width", "wordWrapEnabled"], outputs: ["onCellClick", "onCellPrepared", "onContentReady", "onContextMenuPreparing", "onDisposing", "onExporting", "onInitialized", "onOptionChanged", "allowExpandAllChange", "allowFilteringChange", "allowSortingChange", "allowSortingBySummaryChange", "dataFieldAreaChange", "dataSourceChange", "disabledChange", "elementAttrChange", "encodeHtmlChange", "exportChange", "fieldChooserChange", "fieldPanelChange", "headerFilterChange", "heightChange", "hideEmptySummaryCellsChange", "hintChange", "loadPanelChange", "rowHeaderLayoutChange", "rtlEnabledChange", "scrollingChange", "showBordersChange", "showColumnGrandTotalsChange", "showColumnTotalsChange", "showRowGrandTotalsChange", "showRowTotalsChange", "showTotalsPriorChange", "stateStoringChange", "tabIndexChange", "textsChange", "visibleChange", "widthChange", "wordWrapEnabledChange"] }, { type: i7.DxoFieldChooserComponent, selector: "dxo-field-chooser", inputs: ["allowSearch", "applyChangesMode", "enabled", "height", "layout", "searchTimeout", "texts", "title", "width"] }], directives: [{ type: i4$1.NgIf, selector: "[ngIf]", inputs: ["ngIf", "ngIfThen", "ngIfElse"] }, { type: i4$1.NgForOf, selector: "[ngFor][ngForOf]", inputs: ["ngForOf", "ngForTrackBy", "ngForTemplate"] }, { type: i9.NgControlStatus, selector: "[formControlName],[ngModel],[formControl]" }, { type: i9.NgModel, selector: "[ngModel]:not([formControlName]):not([formControl])", inputs: ["name", "disabled", "ngModel", "ngModelOptions"], outputs: ["ngModelChange"], exportAs: ["ngModel"] }, { type: i4$1.NgClass, selector: "[ngClass]", inputs: ["class", "ngClass"] }] });
i0.ɵɵngDeclareClassMetadata({ minVersion: "12.0.0", version: "13.0.3", ngImport: i0, type: XSightsBackendPublicDashboardComponent, decorators: [{
            type: Component,
            args: [{ selector: 'lib-x-sights-backend-public-dashboard', template: "<div *ngIf=\"dashboardData != {}\">\n    <div class=\"dash_graph_sec\">\n        <div class=\"dash_graph dashboard-wrapper\">\n            <div>\n                <h3 class=\"graph_name\" style=\"height: 44px;\">{{dashboardData.dashboard_name}} </h3>\n            </div>\n            <div class=\"filter-container\" *ngIf=\"filters.length\">\n                <h3>Filters:</h3>\n                <div class=\"col-lg-12 row\">\n                    <div class=\"col-lg-3\" *ngFor=\"let filter of filters;let i = index\"> \n                        <ng-multiselect-dropdown\n                            [placeholder]=\"'Select ' + filter.fieldName + '...'\" [(ngModel)]=\"filter.selValues\"\n                            [settings]=\"dropdownSettings\" [data]=\"filter.values\"> \n                        </ng-multiselect-dropdown> \n                    </div>\n                </div>\n                <div class=\"col-lg-12\">\n                    <button class=\"btn btn-primary\" (click)=\"getGraphDashBoardById()\">Apply Filter</button>\n                </div>\n            </div>\n            <div class=\"row graph_design\" id=\"dashboardScreen\"> \n                <ng-container *ngFor=\"let graph of dashboardData?.graphs;let i=index;\">\n                    <!-- <div class=\"page-break\" *ngIf=\"i % 5 == 0 && i != 0\"></div> -->\n                    \n                    <ng-container *ngIf=\"graph.graphType != 3 && graph.graphType != 2\">\n                        <div class=\"dashboard-graph\"\n                            [ngClass]=\"{'col-lg-12': graph.graph_index == 1,'col-lg-6': graph.graph_index == 2,'col-lg-4': graph.graph_index == 3,'col-lg-3': graph.graph_index == 4}\"\n                            style=\"min-height: 370px; padding: 0px;\"> <!-- loader start -->\n                            <h3 *ngIf=\"graph.graph_structure.xAxis[0] != '***LABEL***'\" style=\"text-align: center; background-color: #eee; padding: 2px;\">{{graph.graphname}}</h3>\n                            <div [id]=\"'graph-'+ graph.graph_id\" style=\"position: relative; padding: 10px; padding-top: 45px;\">\n                                <div class=\"lds-ellipsis\">\n                                    <div></div>\n                                    <div></div>\n                                    <div></div>\n                                    <div></div>\n                                </div> <!-- loader end -->\n                            </div>\n                        </div>\n                    </ng-container>\n                    <div *ngIf=\"graph.graphType==2\" class=\"dashboard-graph\" [id]=\"'table-graph-'+ graph.graph_id\"\n                        [ngClass]=\"{'col-lg-12':\n                        graph.graph_index==1,'col-lg-6': graph.graph_index==2,'col-lg-4':\n                        graph.graph_index==3,'col-lg-3': graph.graph_index==4}\" style=\"display: flex;\n                        flex-direction: column; border-bottom: 0px; background-color:antiquewhite;\">\n                        <!-- loader start -->\n                        <h2 style=\"text-align: center; margin-bottom: 0px;\">\n                            {{graph.graphname}}</h2> <!-- loader end -->\n                    </div>\n                    <div *ngIf=\"graph.graphType==3\" class=\"dashboard-graph\" [id]=\"'table-graph-'+\n                        graph.graph_id\" [ngClass]=\"{'col-lg-12': graph.graph_index==1,'col-lg-6':\n                        graph.graph_index==2,'col-lg-4': graph.graph_index==3,'col-lg-3': graph.graph_index==4}\"\n                        style=\"min-height: 300px; display: flex; flex-direction: column; padding-bottom: 2%;\">\n                        <!-- loader start -->\n                        <h3 style=\"text-align: center;\">{{graph.graphname}}</h3>\n                        <ng-container *ngIf=\"tableDatas.hasOwnProperty('table-graph-' + graph.graph_id)\">\n                            <dx-pivot-grid [allowSortingBySummary]=\"true\" [allowSorting]=\"true\" [allowFiltering]=\"true\"\n                                [showBorders]=\"true\" [dataSource]=\"tableDatas['table-graph-' + graph.graph_id]\">\n                                <dxo-field-chooser [enabled]=\"false\"></dxo-field-chooser> </dx-pivot-grid>\n                        </ng-container> <ng-container *ngIf=\"tableDatas['table-graph-' +\n                            graph.graph_id]==undefined\">\n                            <div class=\"lds-ellipsis\">\n                                <div></div>\n                                <div>\n                                </div>\n                                <div></div>\n                                <div></div>\n                            </div>\n                        </ng-container>\n                        <!-- loader end -->\n                    </div>\n                </ng-container> </div>\n        </div>\n    </div>\n</div>", styles: [".left-sidebar .nav-link{text-transform:capitalize}.left-sidebar i{margin-right:10px}.left-sidebar .nav-tabs .nav-item{text-transform:capitalize}::ng-deep .left-sidebar .nav-item{text-transform:capitalize}::ng-deep .modal{z-index:1060}.filter-container{padding:10px;background:whitesmoke;border:2px solid #ccc}.filter-container h3{margin-bottom:auto}.filter-container .col-lg-3{padding-left:0}.search-filter{height:23px}.search-group{display:flex;align-items:center;justify-content:space-between}.search-group .filter-icon{margin:0}.dash_graph_sec .dash_graph{background-color:#fff}.dash_graph_sec .dash_graph .graph_name{text-align:center;background-color:#000;color:#fff;padding:5px;margin-bottom:0}.dash_graph_sec .dash_graph .graph_design{margin:0}.dashboard-graph{border:1px solid #e4e4e4;border-top:0px;align-items:center;justify-content:center}.modal{z-index:1060!important}::ng-deep .dropdown-custom{inset:103% 0 auto auto!important}.dashname{border-style:groove;background-color:#eee;width:64px;height:34px;display:flex;justify-content:center;align-items:center}.beans-list{padding-left:0;display:flex;flex-wrap:wrap}.beans{border-style:groove;background-color:#fd8309;color:#fff;border-radius:10px;padding:1%;border-color:#fd8309}.captcha-box{display:flex;justify-content:center;align-items:center;height:100%;position:absolute;width:100%;padding:5%;background:#ccc}.dashboard-wrapper{box-shadow:1px 1px 10px #ddd;border-radius:5px}.main_container{background-size:cover;background-repeat:no-repeat}@media print{.page-break{page-break-after:always!important}#dashboardScreen{display:block}}@media print{::ng-deep body,::ng-deep html,::ng-deep #wrapper{width:100%!important}::ng-deep .highcharts-root{width:100%!important}}\n"] }]
        }], ctorParameters: function () { return [{ type: DataService }, { type: i2.ToastrService }, { type: XsightsBackendService }, { type: XSightsCoreService }]; }, propDecorators: { dashboardUrl: [{
                type: Input
            }], adminId: [{
                type: Input
            }], dashboardLoaded: [{
                type: Output
            }] } });

class XSightsCoreModule {
}
XSightsCoreModule.ɵfac = i0.ɵɵngDeclareFactory({ minVersion: "12.0.0", version: "13.0.3", ngImport: i0, type: XSightsCoreModule, deps: [], target: i0.ɵɵFactoryTarget.NgModule });
XSightsCoreModule.ɵmod = i0.ɵɵngDeclareNgModule({ minVersion: "12.0.0", version: "13.0.3", ngImport: i0, type: XSightsCoreModule, bootstrap: [XSightsCoreComponent], declarations: [XSightsCoreComponent,
        DataPopupComponent,
        XSightsPublicDashboardComponent,
        XSightsDashboardComponent,
        XSightsWidgetComponent,
        XSightsBackendDashboardComponent,
        XSightsBackendPublicDashboardComponent], imports: [CommonModule,
        DxPivotGridModule,
        AngularPivotTableModule,
        TableModule,
        HttpClientModule, i2.ToastrModule, NgSelect2Module, i5.NgMultiSelectDropDownModule, NgbModalModule,
        BrowserModule,
        NgbModule,
        HighchartsChartModule,
        ChartsModule,
        FormsModule], exports: [XSightsCoreComponent,
        XSightsDashboardComponent,
        XSightsBackendDashboardComponent,
        XSightsBackendPublicDashboardComponent,
        DataPopupComponent,
        XSightsWidgetComponent,
        XSightsPublicDashboardComponent] });
XSightsCoreModule.ɵinj = i0.ɵɵngDeclareInjector({ minVersion: "12.0.0", version: "13.0.3", ngImport: i0, type: XSightsCoreModule, providers: [
        NgbActiveModal,
        DatePipe
    ], imports: [[
            CommonModule,
            DxPivotGridModule,
            AngularPivotTableModule,
            TableModule,
            HttpClientModule,
            ToastrModule.forRoot(),
            NgSelect2Module,
            NgMultiSelectDropDownModule.forRoot(),
            NgbModalModule,
            BrowserModule,
            NgbModule,
            HighchartsChartModule,
            ChartsModule,
            FormsModule
        ]] });
i0.ɵɵngDeclareClassMetadata({ minVersion: "12.0.0", version: "13.0.3", ngImport: i0, type: XSightsCoreModule, decorators: [{
            type: NgModule,
            args: [{
                    declarations: [
                        XSightsCoreComponent,
                        DataPopupComponent,
                        XSightsPublicDashboardComponent,
                        XSightsDashboardComponent,
                        XSightsWidgetComponent,
                        XSightsBackendDashboardComponent,
                        XSightsBackendPublicDashboardComponent
                    ],
                    imports: [
                        CommonModule,
                        DxPivotGridModule,
                        AngularPivotTableModule,
                        TableModule,
                        HttpClientModule,
                        ToastrModule.forRoot(),
                        NgSelect2Module,
                        NgMultiSelectDropDownModule.forRoot(),
                        NgbModalModule,
                        BrowserModule,
                        NgbModule,
                        HighchartsChartModule,
                        ChartsModule,
                        FormsModule
                    ],
                    providers: [
                        NgbActiveModal,
                        DatePipe
                    ],
                    exports: [
                        XSightsCoreComponent,
                        XSightsDashboardComponent,
                        XSightsBackendDashboardComponent,
                        XSightsBackendPublicDashboardComponent,
                        DataPopupComponent,
                        XSightsWidgetComponent,
                        XSightsPublicDashboardComponent
                    ],
                    bootstrap: [XSightsCoreComponent]
                }]
        }] });

/*
 * Public API Surface of x-sights-core
 */

/**
 * Generated bundle index. Do not edit.
 */

export { DataPopupComponent, WidgetType$1 as WidgetType, XSightsBackendDashboardComponent, XSightsBackendPublicDashboardComponent, XSightsCoreComponent, XSightsCoreModule, XSightsCoreService, XSightsDashboardComponent, XSightsPublicDashboardComponent, XSightsWidgetComponent };
//# sourceMappingURL=x-sights-core.mjs.map
