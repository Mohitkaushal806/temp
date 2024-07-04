import { Injectable } from '@angular/core';
import * as lodash from 'lodash';
import { DataType } from '../data-types/variable-types';
import * as moment from 'moment';
import * as i0 from "@angular/core";
import * as i1 from "@angular/common/http";
export class DataService {
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
                let dataKey = dataKeys.find((key) => key.name == row);
                return dataKey?.title ?? row;
            });
            graphData.columns = graphData.columns.map((column) => {
                let dataKey = dataKeys.find((key) => key.name == column);
                return dataKey?.title ?? column;
            });
            graphData.lastLevelColumns = graphData.lastLevelColumns.map((column) => {
                let dataKey = dataKeys.find((key) => key.name == column);
                return dataKey?.title ?? column;
            });
            if (graphData.colToShow != null) {
                let dataKey = dataKeys.find((key) => key.name == graphData.colToShow);
                graphData.colToShow = dataKey?.title ?? graphData.colToShow;
            }
            graphData.aggregationFunctions = graphData.aggregationFunctions.map((func) => {
                let dataKey = dataKeys.find((key) => key.name == func.variableName);
                return {
                    ...func,
                    variableName: dataKey?.title ?? func.variableName,
                };
            });
            graphData.filter.xAxis = graphData.filter.xAxis.map((f) => {
                let dataKey = dataKeys.find((key) => key.name == f.variableName);
                return {
                    ...f,
                    variableName: dataKey?.title ?? f.variableName,
                };
            });
            graphData.filter.yAxis = graphData.filter.yAxis.map((f) => {
                let dataKey = dataKeys.find((key) => key.name == f.variableName);
                return {
                    ...f,
                    variableName: dataKey?.title ?? f.variableName,
                };
            });
            graphData.filter.yPreAxis = graphData.filter.yPreAxis.map((f) => {
                let dataKey = dataKeys.find((key) => key.name == f.variableName);
                return {
                    ...f,
                    variableName: dataKey?.title ?? f.variableName,
                };
            });
            graphData.filter.customFilter = graphData.filter.customFilter.map((f) => {
                let dataKey1 = dataKeys.find((key) => key.name == f.customFiltervar1);
                let dataKey2 = dataKeys.find((key) => key.name == f.customFiltervar2);
                let dataKey3 = dataKeys.find((key) => key.name == f.customFiltervar3);
                return {
                    ...f,
                    customFiltervar1: dataKey1?.title ?? f.customFiltervar1,
                    customFiltervar2: dataKey2?.title ?? f.customFiltervar2,
                    customFiltervar3: dataKey3?.title ?? f.customFiltervar3,
                };
            });
            graphData.customVariable = graphData.customVariable.map((variable) => {
                if (variable.is_filter || variable.is_slab) {
                    variable.filters = variable.filters.map((f) => {
                        if (!f.isCustomValue) {
                            let dataKey = dataKeys.find((key) => key.name == f.values);
                            f.values = dataKey?.title ?? f.values;
                        }
                        f.conditions = f.conditions.map((condition) => {
                            let dataKey = dataKeys.find((key) => key.name == condition.variable.name);
                            condition.variable.name =
                                dataKey?.title ?? condition.variable.name;
                            return condition;
                        });
                        return f;
                    });
                }
                else {
                    variable.operation = variable.operation.map((op) => {
                        if (!op.isCustomValue) {
                            let dataKey = dataKeys.find((key) => key.name.split(' ').join('_') == op.value);
                            op.value = dataKey?.title ?? op.value;
                        }
                        return op;
                    });
                }
                return this.createNewFormula(variable);
            });
            graphData.dataFormat = graphData.dataFormat.map((format) => {
                let dataKey = dataKeys.find((key) => key.name == format.name);
                return {
                    ...format,
                    name: dataKey?.title ?? format.name,
                };
            });
        }
        else {
            graphData.rows = graphData.rows.map((row) => {
                let dataKey = dataKeys.find((key) => key.title == row);
                return dataKey?.name ?? row;
            });
            graphData.columns = graphData.columns.map((column) => {
                let dataKey = dataKeys.find((key) => key.title == column);
                return dataKey?.name ?? column;
            });
            graphData.lastLevelColumns = graphData.lastLevelColumns.map((column) => {
                let dataKey = dataKeys.find((key) => key.title == column);
                return dataKey?.name ?? column;
            });
            if (graphData.colToShow != null) {
                let dataKey = dataKeys.find((key) => key.title == graphData.colToShow);
                graphData.colToShow = dataKey?.name ?? graphData.colToShow;
            }
            graphData.aggregationFunctions = graphData.aggregationFunctions.map((func) => {
                let dataKey = dataKeys.find((key) => key.title == func.variableName);
                return {
                    ...func,
                    variableName: dataKey?.name ?? func.variableName,
                };
            });
            graphData.filter.xAxis = graphData.filter.xAxis.map((f) => {
                let dataKey = dataKeys.find((key) => key.title == f.variableName);
                return {
                    ...f,
                    variableName: dataKey?.name ?? f.variableName,
                };
            });
            graphData.filter.yAxis = graphData.filter.yAxis.map((f) => {
                let dataKey = dataKeys.find((key) => key.title == f.variableName);
                return {
                    ...f,
                    variableName: dataKey?.name ?? f.variableName,
                };
            });
            graphData.filter.yPreAxis = graphData.filter.yPreAxis.map((f) => {
                let dataKey = dataKeys.find((key) => key.title == f.variableName);
                return {
                    ...f,
                    variableName: dataKey?.name ?? f.variableName,
                };
            });
            graphData.filter.customFilter = graphData.filter.customFilter.map((f) => {
                let dataKey1 = dataKeys.find((key) => key.title == f.customFiltervar1);
                let dataKey2 = dataKeys.find((key) => key.title == f.customFiltervar2);
                let dataKey3 = dataKeys.find((key) => key.title == f.customFiltervar3);
                return {
                    ...f,
                    customFiltervar1: dataKey1?.name ?? f.customFiltervar1,
                    customFiltervar2: dataKey2?.name ?? f.customFiltervar2,
                    customFiltervar3: dataKey3?.name ?? f.customFiltervar3,
                };
            });
            graphData.customVariable = graphData.customVariable.map((variable) => {
                if (variable.is_filter || variable.is_slab) {
                    variable.filters = variable.filters.map((f) => {
                        if (!f.isCustomValue) {
                            let dataKey = dataKeys.find((key) => key.title == f.values);
                            f.values = dataKey?.name ?? f.values;
                        }
                        f.conditions = f.conditions.map((condition) => {
                            let dataKey = dataKeys.find((key) => key.title == condition.variable.name);
                            condition.variable.name =
                                dataKey?.name ?? condition.variable.name;
                            return condition;
                        });
                        return f;
                    });
                }
                else {
                    variable.operation = variable.operation.map((op) => {
                        if (!op.isCustomValue) {
                            let dataKey = dataKeys.find((key) => key.title.split(' ').join('_') == op.value);
                            op.value = dataKey?.name ?? op.value;
                        }
                        return op;
                    });
                }
                return this.createNewFormula(variable);
            });
            graphData.dataFormat = graphData.dataFormat.map((format) => {
                let dataKey = dataKeys.find((key) => key.title == format.name);
                return {
                    ...format,
                    name: dataKey?.name ?? format.name,
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZGF0YS5zZXJ2aWNlLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vLi4vLi4vLi4vcHJvamVjdHMveC1zaWdodHMtY29yZS9zcmMvbGliL3NlcnZpY2VzL2RhdGEuc2VydmljZS50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFDQSxPQUFPLEVBQUUsVUFBVSxFQUFFLE1BQU0sZUFBZSxDQUFDO0FBQzNDLE9BQU8sS0FBSyxNQUFNLE1BQU0sUUFBUSxDQUFDO0FBQ2pDLE9BQU8sRUFBRSxRQUFRLEVBQUUsTUFBTSw4QkFBOEIsQ0FBQztBQUN4RCxPQUFPLEtBQUssTUFBTSxNQUFNLFFBQVEsQ0FBQzs7O0FBS2pDLE1BQU0sT0FBTyxXQUFXO0lBTXRCLFlBQW9CLElBQWdCO1FBQWhCLFNBQUksR0FBSixJQUFJLENBQVk7UUFMcEMsb0JBQWUsR0FBUSwyQ0FBMkMsQ0FBQztRQUNuRSxvQkFBZSxHQUFRLHFCQUFxQixDQUFDO1FBQzdDLGVBQVUsR0FBRyxFQUFFLENBQUM7UUFDaEIsY0FBUyxHQUFXLEdBQUcsQ0FBQztRQUN4QixZQUFPLEdBQVcsRUFBRSxDQUFDO1FBRW5CLElBQUksQ0FBQyxTQUFTLEdBQUcsWUFBWSxDQUFDLE9BQU8sQ0FBQyxtQkFBbUIsQ0FBQyxJQUFJLEdBQUcsQ0FBQztRQUNsRSxJQUFJLENBQUMsT0FBTyxHQUFHLFlBQVksQ0FBQyxPQUFPLENBQUMsaUJBQWlCLENBQUMsSUFBSSxFQUFFLENBQUM7SUFDL0QsQ0FBQztJQUNELFVBQVUsQ0FBQyxPQUFlO1FBQ3hCLE9BQU87WUFDTCxPQUFPLEVBQUUsS0FBSztZQUNkLFNBQVMsRUFBRSxJQUFJLENBQUMsU0FBUztZQUN6QixPQUFPLEVBQUUsV0FBVztZQUNwQixPQUFPLEVBQUUsSUFBSSxDQUFDLE9BQU87WUFDckIsU0FBUyxFQUFFLE9BQU87WUFDbEIsbUJBQW1CLEVBQUUsTUFBTTtTQUM1QixDQUFDO0lBQ0osQ0FBQztJQUNELFlBQVksQ0FBQyxTQUFjO1FBQ3pC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RCxTQUFTLEVBQUUsQ0FBQztJQUNqQixDQUFDO0lBQ0QseUJBQXlCLENBQUMsTUFBVyxFQUFFLE9BQWU7UUFDcEQsT0FBTyxJQUFJLENBQUMsSUFBSTthQUNiLElBQUksQ0FBQyxJQUFJLENBQUMsZUFBZSxHQUFHLDZDQUE2QyxFQUFFLE1BQU0sRUFBRTtZQUNsRixPQUFPLEVBQUUsSUFBSSxDQUFDLFVBQVUsQ0FBQyxPQUFPLENBQUM7U0FDbEMsQ0FBQzthQUNELFNBQVMsRUFBRSxDQUFDO0lBQ2pCLENBQUM7SUFDRCxzQkFBc0IsQ0FBQyxZQUFpQixFQUFFLE9BQWU7UUFDdkQsT0FBTyxJQUFJLENBQUMsSUFBSTthQUNiLEdBQUcsQ0FDRixJQUFJLENBQUMsZUFBZTtZQUNsQiw4Q0FBOEM7WUFDOUMsWUFBWSxFQUNkO1lBQ0UsT0FBTyxFQUFFLElBQUksQ0FBQyxVQUFVLENBQUMsT0FBTyxDQUFDO1NBQ2xDLENBQ0Y7YUFDQSxTQUFTLEVBQUUsQ0FBQztJQUNqQixDQUFDOzt3R0E1akJVLFdBQVc7NEdBQVgsV0FBVyxjQUZWLE1BQU07MkZBRVAsV0FBVztrQkFIdkIsVUFBVTttQkFBQztvQkFDVixVQUFVLEVBQUUsTUFBTTtpQkFDbkIiLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgeyBIdHRwQ2xpZW50IH0gZnJvbSAnQGFuZ3VsYXIvY29tbW9uL2h0dHAnO1xuaW1wb3J0IHsgSW5qZWN0YWJsZSB9IGZyb20gJ0Bhbmd1bGFyL2NvcmUnO1xuaW1wb3J0ICogYXMgbG9kYXNoIGZyb20gJ2xvZGFzaCc7XG5pbXBvcnQgeyBEYXRhVHlwZSB9IGZyb20gJy4uL2RhdGEtdHlwZXMvdmFyaWFibGUtdHlwZXMnO1xuaW1wb3J0ICogYXMgbW9tZW50IGZyb20gJ21vbWVudCc7XG5cbkBJbmplY3RhYmxlKHtcbiAgcHJvdmlkZWRJbjogJ3Jvb3QnLFxufSlcbmV4cG9ydCBjbGFzcyBEYXRhU2VydmljZSB7XG4gIFhTSUdIVF9CQVNFX1VSTDogYW55ID0gJ2h0dHBzOi8veHNpZ2h0Lnhzd2lmdC5iaXoveC1zaWdodC9hcGkvdjEvJztcbiAgRENVVExZX0JBU0VfVVJMOiBhbnkgPSAnaHR0cHM6Ly9kY3V0bHkuY29tLyc7XG4gIE1PREFMX0RBVEEgPSB7fTtcbiAgZW50cnlNb2RlOiBzdHJpbmcgPSAnMSc7XG4gIGF1dGhLZXk6IHN0cmluZyA9ICcnO1xuICBjb25zdHJ1Y3Rvcihwcml2YXRlIGh0dHA6IEh0dHBDbGllbnQpIHtcbiAgICB0aGlzLmVudHJ5TW9kZSA9IGxvY2FsU3RvcmFnZS5nZXRJdGVtKFwieHNpZ2h0c19lbnRyeW1vZGVcIikgPz8gXCIwXCI7XG4gICAgdGhpcy5hdXRoS2V5ID0gbG9jYWxTdG9yYWdlLmdldEl0ZW0oXCJ4c2lnaHRzX2F1dGhrZXlcIikgPz8gXCJcIjtcbiAgfVxuICBzZXRIZWFkZXJzKGFkbWluSWQ6IHN0cmluZykge1xuICAgIHJldHVybiB7XG4gICAgICB2ZXJzaW9uOiAnMS4wJyxcbiAgICAgIGVudHJ5bW9kZTogdGhpcy5lbnRyeU1vZGUsXG4gICAgICBhcHB0eXBlOiAnZGFzaGJvYXJkJyxcbiAgICAgIGF1dGhrZXk6IHRoaXMuYXV0aEtleSxcbiAgICAgIGZvQWRtaW5JZDogYWRtaW5JZCxcbiAgICAgICdjb250ZW50LWVuY29uZGluZyc6ICdnemlwJyxcbiAgICB9O1xuICB9XG4gIHNldE1vZGFsRGF0YShtb2RhbERhdGE6IGFueSkge1xuICAgIHRoaXMuTU9EQUxfREFUQSA9IG1vZGFsRGF0YTtcbiAgfVxuICBnZXRNb2RhbERhdGEoKSB7XG4gICAgcmV0dXJuIHRoaXMuTU9EQUxfREFUQTtcbiAgfVxuICBnZXREYXNoYm9hcmRCeUlkKGRhc2hib2FyZElkOiBhbnksIGFkbWluSWQ6IHN0cmluZykge1xuICAgIHJldHVybiB0aGlzLmh0dHBcbiAgICAgIC5nZXQoXG4gICAgICAgIHRoaXMuWFNJR0hUX0JBU0VfVVJMICtcbiAgICAgICAgICAnZGFzaGJvYXJkL2dldC1kYXNoYm9hcmQtZGF0YT9kYXNoYm9hcmRfaWQ9JyArXG4gICAgICAgICAgZGFzaGJvYXJkSWQsXG4gICAgICAgIHtcbiAgICAgICAgICBoZWFkZXJzOiB0aGlzLnNldEhlYWRlcnMoYWRtaW5JZCksXG4gICAgICAgIH1cbiAgICAgIClcbiAgICAgIC50b1Byb21pc2UoKTtcbiAgfVxuICBnZXRHcmFwaERhc2hCb2FyZEJ5SWQoZGF0YTogYW55LCBhZG1pbklkOiBzdHJpbmcpIHtcbiAgICByZXR1cm4gdGhpcy5odHRwXG4gICAgICAucG9zdChcbiAgICAgICAgdGhpcy5YU0lHSFRfQkFTRV9VUkwgK1xuICAgICAgICAgICdkYXNoYm9hcmQvZ2V0LWRhc2hib2FyZC1ncmFwaC1kYXRhJywgZGF0YSxcbiAgICAgICAge1xuICAgICAgICAgIGhlYWRlcnM6IHRoaXMuc2V0SGVhZGVycyhhZG1pbklkKSxcbiAgICAgICAgfVxuICAgICAgKVxuICAgICAgLnRvUHJvbWlzZSgpO1xuICB9XG5cblxuICBnZXRHcmFwaERhdGFCeUlkKGRhdGE6IGFueSkge1xuICAgIHJldHVybiB0aGlzLmh0dHBcbiAgICAgIC5wb3N0KFxuICAgICAgICB0aGlzLlhTSUdIVF9CQVNFX1VSTCArXG4gICAgICAgICAgJ2dyYXBocy9nZXQtZ3JhcGgtZGF0YS1ieS1pZCcsIGRhdGEsXG4gICAgICAgIHtcbiAgICAgICAgICBoZWFkZXJzOiB0aGlzLnNldEhlYWRlcnMoZGF0YS5hZG1pbklkKSxcbiAgICAgICAgfVxuICAgICAgKVxuICAgICAgLnRvUHJvbWlzZSgpO1xuICB9XG5cbiAgZ2V0R3JhcGhEcmlsbGRvd25CeUlkKGRhdGE6IGFueSkge1xuICAgIHJldHVybiB0aGlzLmh0dHBcbiAgICAgIC5wb3N0KFxuICAgICAgICB0aGlzLlhTSUdIVF9CQVNFX1VSTCArXG4gICAgICAgICAgJ2dyYXBocy9nZXQtZ3JhcGgtZHJpbGxkb3duLWRhdGEnLCBkYXRhLFxuICAgICAgICB7XG4gICAgICAgICAgaGVhZGVyczogdGhpcy5zZXRIZWFkZXJzKGRhdGEuYWRtaW5JZCksXG4gICAgICAgIH1cbiAgICAgIClcbiAgICAgIC50b1Byb21pc2UoKTtcbiAgfVxuICBkb3dubG9hZERyaWxsZG93bkJ5SWQoZGF0YTogYW55KSB7XG4gICAgcmV0dXJuIHRoaXMuaHR0cFxuICAgICAgLnBvc3QoXG4gICAgICAgIHRoaXMuWFNJR0hUX0JBU0VfVVJMICtcbiAgICAgICAgICAnZ3JhcGhzL2Rvd25sb2FkLWRyaWxsZG93bi1kYXRhJywgZGF0YSxcbiAgICAgICAge1xuICAgICAgICAgIHJlcG9ydFByb2dyZXNzOiB0cnVlLFxuICAgICAgICAgIG9ic2VydmU6ICdldmVudHMnLFxuICAgICAgICAgIHJlc3BvbnNlVHlwZTogJ2Jsb2InLFxuICAgICAgICAgIGhlYWRlcnM6IHRoaXMuc2V0SGVhZGVycyhkYXRhLmFkbWluSWQpLFxuICAgICAgICB9XG4gICAgICApO1xuICB9XG4gIGZldGNoRGF0YVNvdXJjZShwYXJhbXM6IGFueSwgYWRtaW5JZDogc3RyaW5nKSB7XG4gICAgcmV0dXJuIHRoaXMuaHR0cFxuICAgICAgLmdldChcbiAgICAgICAgdGhpcy5YU0lHSFRfQkFTRV9VUkwgK1xuICAgICAgICAgICdkYXRhLXNvdXJjZS9mZXRjaC1kYXRhLWZyb20tc291cmNlP3NvdXJjZUlkPScgK1xuICAgICAgICAgIHBhcmFtcy5zb3VyY2VpZCArXG4gICAgICAgICAgJyZzdGFydFRpbWU9JyArXG4gICAgICAgICAgcGFyYW1zLnN0YXJ0VGltZSArXG4gICAgICAgICAgJyZlbmRUaW1lPScgK1xuICAgICAgICAgIHBhcmFtcy5lbmRUaW1lLFxuICAgICAgICB7XG4gICAgICAgICAgaGVhZGVyczogdGhpcy5zZXRIZWFkZXJzKGFkbWluSWQpLFxuICAgICAgICB9XG4gICAgICApXG4gICAgICAudG9Qcm9taXNlKCk7XG4gIH1cbiAgZ2V0R3JhcGhCeUlkKHdpZGdldElkOiBhbnksIGFkbWluSWQ6IHN0cmluZykge1xuICAgIHJldHVybiB0aGlzLmh0dHBcbiAgICAgIC5nZXQoXG4gICAgICAgIHRoaXMuWFNJR0hUX0JBU0VfVVJMICsgJ2dyYXBocy9nZXQtZ3JhcGgtYnktaWQ/Z3JhcGhJZD0nICsgd2lkZ2V0SWQsXG4gICAgICAgIHtcbiAgICAgICAgICBoZWFkZXJzOiB0aGlzLnNldEhlYWRlcnMoYWRtaW5JZCksXG4gICAgICAgIH1cbiAgICAgIClcbiAgICAgIC50b1Byb21pc2UoKTtcbiAgfVxuICBjcmVhdGVOZXdGb3JtdWxhKGN1c3RvbVZhcmlhYmxlOiBhbnkpIHtcbiAgICBpZiAoY3VzdG9tVmFyaWFibGUuaXNfZmlsdGVyKSB7XG4gICAgICBjdXN0b21WYXJpYWJsZS5mb3JtdWxhID0gJ2lmICgnO1xuICAgICAgZm9yIChsZXQgaSA9IDA7IGkgPCBjdXN0b21WYXJpYWJsZS5maWx0ZXJzLmxlbmd0aDsgaSsrKSB7XG4gICAgICAgIGxldCB2YWx1ZSA9IGN1c3RvbVZhcmlhYmxlLmZpbHRlcnNbaV0uaXNDdXN0b21WYWx1ZVxuICAgICAgICAgID8gY3VzdG9tVmFyaWFibGUuZmlsdGVyc1tpXS52YWx1ZXNcbiAgICAgICAgICA6IGN1c3RvbVZhcmlhYmxlLmZpbHRlcnNbaV0uYWdncmVnYXRpb25GdW5jdGlvbiArXG4gICAgICAgICAgICAnKFwiJyArXG4gICAgICAgICAgICBjdXN0b21WYXJpYWJsZS5maWx0ZXJzW2ldLnZhbHVlcyArXG4gICAgICAgICAgICAnXCIpJztcbiAgICAgICAgbGV0IGNvbmRpdGlvbnMgPSAnJztcbiAgICAgICAgY3VzdG9tVmFyaWFibGUuZmlsdGVyc1tpXS5jb25kaXRpb25zLmZvckVhY2goKGNvbmRpdGlvbjogYW55KSA9PiB7XG4gICAgICAgICAgY29uZGl0aW9ucyArPVxuICAgICAgICAgICAgKGNvbmRpdGlvbi5yZWxhdGlvbiA9PSBudWxsID8gJycgOiBjb25kaXRpb24ucmVsYXRpb24pICtcbiAgICAgICAgICAgICcgJyArXG4gICAgICAgICAgICBjb25kaXRpb24udmFyaWFibGUubmFtZSArXG4gICAgICAgICAgICAnICcgK1xuICAgICAgICAgICAgY29uZGl0aW9uLm9wZXJhdG9yICtcbiAgICAgICAgICAgICcgWycgK1xuICAgICAgICAgICAgY29uZGl0aW9uLmNvbXBhcmF0aXZlVmFyaWFibGVzICtcbiAgICAgICAgICAgICddICc7XG4gICAgICAgIH0pO1xuICAgICAgICBjdXN0b21WYXJpYWJsZS5mb3JtdWxhICs9IGNvbmRpdGlvbnMgKyAnKSB7ICcgKyB2YWx1ZSArICcgfSc7XG4gICAgICAgIGlmIChpICsgMSAhPSBjdXN0b21WYXJpYWJsZS5maWx0ZXJzLmxlbmd0aCkge1xuICAgICAgICAgIGN1c3RvbVZhcmlhYmxlLmZvcm11bGEgKz0gJyBlbHNlIGlmICggJztcbiAgICAgICAgfVxuICAgICAgICBpZiAoaSA9PSBjdXN0b21WYXJpYWJsZS5maWx0ZXJzLmxlbmd0aCAtIDEpIHtcbiAgICAgICAgICBjdXN0b21WYXJpYWJsZS5mb3JtdWxhICs9XG4gICAgICAgICAgICAnIGVsc2UgeyAnICsgY3VzdG9tVmFyaWFibGUuZGVmYXVsdFZhbHVlICsgJyB9JztcbiAgICAgICAgfVxuICAgICAgfVxuICAgICAgaWYgKGN1c3RvbVZhcmlhYmxlLmZpbHRlcnMubGVuZ3RoID09IDApIHtcbiAgICAgICAgY3VzdG9tVmFyaWFibGUuZm9ybXVsYSA9XG4gICAgICAgICAgJyApIHsgIH0gZWxzZSB7ICcgKyBjdXN0b21WYXJpYWJsZS5kZWZhdWx0VmFsdWUgKyAnIH0nO1xuICAgICAgfVxuICAgIH0gZWxzZSB7XG4gICAgICBjdXN0b21WYXJpYWJsZS5mb3JtdWxhID0gJyc7XG4gICAgICBjdXN0b21WYXJpYWJsZS5vcGVyYXRpb24uZm9yRWFjaCgob3A6IGFueSkgPT4ge1xuICAgICAgICBjdXN0b21WYXJpYWJsZS5mb3JtdWxhICs9IG9wLnZhbHVlICsgJyAnO1xuICAgICAgfSk7XG4gICAgfVxuICAgIHJldHVybiBjdXN0b21WYXJpYWJsZTtcbiAgfVxuICBwYXJzZURhdGFGb3JtYXQoZGF0YTogYW55LCBmb3JtYXQ6IGFueSkge1xuICAgIGxldCB1bk1hdGNoRGF0YSA9IFtdO1xuICAgIGxldCByZXMgPSBsb2Rhc2gubWFwKGRhdGEsIChkKSA9PiB7XG4gICAgICBPYmplY3QuZW50cmllcyhkKS5mb3JFYWNoKCh2YWx1ZSkgPT4ge1xuICAgICAgICBsZXQgZm9ybWF0SW5kZXggPSBmb3JtYXQuZmluZEluZGV4KChlbDogYW55KSA9PiB7XG4gICAgICAgICAgcmV0dXJuIGVsLm5hbWUgPT0gdmFsdWVbMF07XG4gICAgICAgIH0pO1xuICAgICAgICBpZiAoZm9ybWF0SW5kZXggPT0gLTEpIHtcbiAgICAgICAgICB1bk1hdGNoRGF0YS5wdXNoKHZhbHVlWzBdKTtcbiAgICAgICAgICBkW3ZhbHVlWzBdXSA9IDA7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgbGV0IHR5cGUgPSBmb3JtYXRbZm9ybWF0SW5kZXhdLnR5cGU7XG4gICAgICAgICAgaWYgKHR5cGUgPT0gJ251bWJlcicpIHtcbiAgICAgICAgICAgIGlmIChcbiAgICAgICAgICAgICAgdGhpcy5nZXRWYXJpYWJsZURhdGEodmFsdWVbMV0pWzBdICE9ICdudW1iZXInIHx8XG4gICAgICAgICAgICAgIHZhbHVlWzFdID09IG51bGwgfHxcbiAgICAgICAgICAgICAgdmFsdWVbMV0gPT0gJydcbiAgICAgICAgICAgICkge1xuICAgICAgICAgICAgICBkW3ZhbHVlWzBdXSA9IDA7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgfSBlbHNlIGlmICh0eXBlID09ICdzdHJpbmcnKSB7XG4gICAgICAgICAgICBpZiAoXG4gICAgICAgICAgICAgIHRoaXMuZ2V0VmFyaWFibGVEYXRhKHZhbHVlWzFdKVswXSAhPSAnc3RyaW5nJyB8fFxuICAgICAgICAgICAgICB2YWx1ZVsxXSA9PSBudWxsIHx8XG4gICAgICAgICAgICAgIHZhbHVlWzFdID09ICcnXG4gICAgICAgICAgICApIHtcbiAgICAgICAgICAgICAgZFt2YWx1ZVswXV0gPSAnLSc7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgfSBlbHNlIGlmICh0eXBlID09ICdkYXRlJykge1xuICAgICAgICAgICAgbGV0IGRhdGVGb3JtYXQgPSBmb3JtYXRbZm9ybWF0SW5kZXhdLmZvcm1hdDtcbiAgICAgICAgICAgIGRbdmFsdWVbMF1dID0gdGhpcy5jb252ZXJ0RGF0ZUZvcm1hdCh2YWx1ZVsxXSwgZGF0ZUZvcm1hdCk7XG4gICAgICAgICAgfSBlbHNlIGlmICh0eXBlID09ICd0aW1lJykge1xuICAgICAgICAgICAgbGV0IHRpbWVGb3JtYXQgPSBmb3JtYXRbZm9ybWF0SW5kZXhdLmZvcm1hdDtcbiAgICAgICAgICAgIGRbdmFsdWVbMF1dID0gdGhpcy5jb252ZXJ0RGF0ZUZvcm1hdCh2YWx1ZVsxXSwgdGltZUZvcm1hdCk7XG4gICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICB9KTtcbiAgICAgIHJldHVybiBkO1xuICAgIH0pO1xuICAgIHJldHVybiByZXM7XG4gIH1cblxuICBrZXlDb252ZXJ0ZXIoZ3JhcGhEYXRhOiBhbnksIGRhdGFLZXlzOiBhbnksIGRpcmVjdGlvbjogbnVtYmVyID0gMSkge1xuICAgIGlmIChkaXJlY3Rpb24gPT09IDEpIHtcbiAgICAgIGdyYXBoRGF0YS5yb3dzID0gZ3JhcGhEYXRhLnJvd3MubWFwKChyb3c6IGFueSkgPT4ge1xuICAgICAgICBsZXQgZGF0YUtleSA9IGRhdGFLZXlzLmZpbmQoKGtleTogYW55KSA9PiBrZXkubmFtZSA9PSByb3cpO1xuICAgICAgICByZXR1cm4gZGF0YUtleT8udGl0bGUgPz8gcm93O1xuICAgICAgfSk7XG4gICAgICBncmFwaERhdGEuY29sdW1ucyA9IGdyYXBoRGF0YS5jb2x1bW5zLm1hcCgoY29sdW1uOiBhbnkpID0+IHtcbiAgICAgICAgbGV0IGRhdGFLZXkgPSBkYXRhS2V5cy5maW5kKChrZXk6IGFueSkgPT4ga2V5Lm5hbWUgPT0gY29sdW1uKTtcbiAgICAgICAgcmV0dXJuIGRhdGFLZXk/LnRpdGxlID8/IGNvbHVtbjtcbiAgICAgIH0pO1xuICAgICAgZ3JhcGhEYXRhLmxhc3RMZXZlbENvbHVtbnMgPSBncmFwaERhdGEubGFzdExldmVsQ29sdW1ucy5tYXAoXG4gICAgICAgIChjb2x1bW46IGFueSkgPT4ge1xuICAgICAgICAgIGxldCBkYXRhS2V5ID0gZGF0YUtleXMuZmluZCgoa2V5OiBhbnkpID0+IGtleS5uYW1lID09IGNvbHVtbik7XG4gICAgICAgICAgcmV0dXJuIGRhdGFLZXk/LnRpdGxlID8/IGNvbHVtbjtcbiAgICAgICAgfVxuICAgICAgKTtcbiAgICAgIGlmIChncmFwaERhdGEuY29sVG9TaG93ICE9IG51bGwpIHtcbiAgICAgICAgbGV0IGRhdGFLZXkgPSBkYXRhS2V5cy5maW5kKFxuICAgICAgICAgIChrZXk6IGFueSkgPT4ga2V5Lm5hbWUgPT0gZ3JhcGhEYXRhLmNvbFRvU2hvd1xuICAgICAgICApO1xuICAgICAgICBncmFwaERhdGEuY29sVG9TaG93ID0gZGF0YUtleT8udGl0bGUgPz8gZ3JhcGhEYXRhLmNvbFRvU2hvdztcbiAgICAgIH1cbiAgICAgIGdyYXBoRGF0YS5hZ2dyZWdhdGlvbkZ1bmN0aW9ucyA9IGdyYXBoRGF0YS5hZ2dyZWdhdGlvbkZ1bmN0aW9ucy5tYXAoXG4gICAgICAgIChmdW5jOiBhbnkpID0+IHtcbiAgICAgICAgICBsZXQgZGF0YUtleSA9IGRhdGFLZXlzLmZpbmQoXG4gICAgICAgICAgICAoa2V5OiBhbnkpID0+IGtleS5uYW1lID09IGZ1bmMudmFyaWFibGVOYW1lXG4gICAgICAgICAgKTtcbiAgICAgICAgICByZXR1cm4ge1xuICAgICAgICAgICAgLi4uZnVuYyxcbiAgICAgICAgICAgIHZhcmlhYmxlTmFtZTogZGF0YUtleT8udGl0bGUgPz8gZnVuYy52YXJpYWJsZU5hbWUsXG4gICAgICAgICAgfTtcbiAgICAgICAgfVxuICAgICAgKTtcblxuICAgICAgZ3JhcGhEYXRhLmZpbHRlci54QXhpcyA9IGdyYXBoRGF0YS5maWx0ZXIueEF4aXMubWFwKChmOiBhbnkpID0+IHtcbiAgICAgICAgbGV0IGRhdGFLZXkgPSBkYXRhS2V5cy5maW5kKFxuICAgICAgICAgIChrZXk6IGFueSkgPT4ga2V5Lm5hbWUgPT0gZi52YXJpYWJsZU5hbWVcbiAgICAgICAgKTtcbiAgICAgICAgcmV0dXJuIHtcbiAgICAgICAgICAuLi5mLFxuICAgICAgICAgIHZhcmlhYmxlTmFtZTogZGF0YUtleT8udGl0bGUgPz8gZi52YXJpYWJsZU5hbWUsXG4gICAgICAgIH07XG4gICAgICB9KTtcbiAgICAgIGdyYXBoRGF0YS5maWx0ZXIueUF4aXMgPSBncmFwaERhdGEuZmlsdGVyLnlBeGlzLm1hcCgoZjogYW55KSA9PiB7XG4gICAgICAgIGxldCBkYXRhS2V5ID0gZGF0YUtleXMuZmluZChcbiAgICAgICAgICAoa2V5OiBhbnkpID0+IGtleS5uYW1lID09IGYudmFyaWFibGVOYW1lXG4gICAgICAgICk7XG4gICAgICAgIHJldHVybiB7XG4gICAgICAgICAgLi4uZixcbiAgICAgICAgICB2YXJpYWJsZU5hbWU6IGRhdGFLZXk/LnRpdGxlID8/IGYudmFyaWFibGVOYW1lLFxuICAgICAgICB9O1xuICAgICAgfSk7XG4gICAgICBncmFwaERhdGEuZmlsdGVyLnlQcmVBeGlzID0gZ3JhcGhEYXRhLmZpbHRlci55UHJlQXhpcy5tYXAoKGY6IGFueSkgPT4ge1xuICAgICAgICBsZXQgZGF0YUtleSA9IGRhdGFLZXlzLmZpbmQoXG4gICAgICAgICAgKGtleTogYW55KSA9PiBrZXkubmFtZSA9PSBmLnZhcmlhYmxlTmFtZVxuICAgICAgICApO1xuICAgICAgICByZXR1cm4ge1xuICAgICAgICAgIC4uLmYsXG4gICAgICAgICAgdmFyaWFibGVOYW1lOiBkYXRhS2V5Py50aXRsZSA/PyBmLnZhcmlhYmxlTmFtZSxcbiAgICAgICAgfTtcbiAgICAgIH0pO1xuICAgICAgZ3JhcGhEYXRhLmZpbHRlci5jdXN0b21GaWx0ZXIgPSBncmFwaERhdGEuZmlsdGVyLmN1c3RvbUZpbHRlci5tYXAoXG4gICAgICAgIChmOiBhbnkpID0+IHtcbiAgICAgICAgICBsZXQgZGF0YUtleTEgPSBkYXRhS2V5cy5maW5kKFxuICAgICAgICAgICAgKGtleTogYW55KSA9PiBrZXkubmFtZSA9PSBmLmN1c3RvbUZpbHRlcnZhcjFcbiAgICAgICAgICApO1xuICAgICAgICAgIGxldCBkYXRhS2V5MiA9IGRhdGFLZXlzLmZpbmQoXG4gICAgICAgICAgICAoa2V5OiBhbnkpID0+IGtleS5uYW1lID09IGYuY3VzdG9tRmlsdGVydmFyMlxuICAgICAgICAgICk7XG4gICAgICAgICAgbGV0IGRhdGFLZXkzID0gZGF0YUtleXMuZmluZChcbiAgICAgICAgICAgIChrZXk6IGFueSkgPT4ga2V5Lm5hbWUgPT0gZi5jdXN0b21GaWx0ZXJ2YXIzXG4gICAgICAgICAgKTtcbiAgICAgICAgICByZXR1cm4ge1xuICAgICAgICAgICAgLi4uZixcbiAgICAgICAgICAgIGN1c3RvbUZpbHRlcnZhcjE6IGRhdGFLZXkxPy50aXRsZSA/PyBmLmN1c3RvbUZpbHRlcnZhcjEsXG4gICAgICAgICAgICBjdXN0b21GaWx0ZXJ2YXIyOiBkYXRhS2V5Mj8udGl0bGUgPz8gZi5jdXN0b21GaWx0ZXJ2YXIyLFxuICAgICAgICAgICAgY3VzdG9tRmlsdGVydmFyMzogZGF0YUtleTM/LnRpdGxlID8/IGYuY3VzdG9tRmlsdGVydmFyMyxcbiAgICAgICAgICB9O1xuICAgICAgICB9XG4gICAgICApO1xuXG4gICAgICBncmFwaERhdGEuY3VzdG9tVmFyaWFibGUgPSBncmFwaERhdGEuY3VzdG9tVmFyaWFibGUubWFwKFxuICAgICAgICAodmFyaWFibGU6IGFueSkgPT4ge1xuICAgICAgICAgIGlmICh2YXJpYWJsZS5pc19maWx0ZXIgfHwgdmFyaWFibGUuaXNfc2xhYikge1xuICAgICAgICAgICAgdmFyaWFibGUuZmlsdGVycyA9IHZhcmlhYmxlLmZpbHRlcnMubWFwKChmOiBhbnkpID0+IHtcbiAgICAgICAgICAgICAgaWYgKCFmLmlzQ3VzdG9tVmFsdWUpIHtcbiAgICAgICAgICAgICAgICBsZXQgZGF0YUtleSA9IGRhdGFLZXlzLmZpbmQoXG4gICAgICAgICAgICAgICAgICAoa2V5OiBhbnkpID0+IGtleS5uYW1lID09IGYudmFsdWVzXG4gICAgICAgICAgICAgICAgKTtcbiAgICAgICAgICAgICAgICBmLnZhbHVlcyA9IGRhdGFLZXk/LnRpdGxlID8/IGYudmFsdWVzO1xuICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgIGYuY29uZGl0aW9ucyA9IGYuY29uZGl0aW9ucy5tYXAoKGNvbmRpdGlvbjogYW55KSA9PiB7XG4gICAgICAgICAgICAgICAgbGV0IGRhdGFLZXkgPSBkYXRhS2V5cy5maW5kKFxuICAgICAgICAgICAgICAgICAgKGtleTogYW55KSA9PiBrZXkubmFtZSA9PSBjb25kaXRpb24udmFyaWFibGUubmFtZVxuICAgICAgICAgICAgICAgICk7XG4gICAgICAgICAgICAgICAgY29uZGl0aW9uLnZhcmlhYmxlLm5hbWUgPVxuICAgICAgICAgICAgICAgICAgZGF0YUtleT8udGl0bGUgPz8gY29uZGl0aW9uLnZhcmlhYmxlLm5hbWU7XG4gICAgICAgICAgICAgICAgcmV0dXJuIGNvbmRpdGlvbjtcbiAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICAgIHJldHVybiBmO1xuICAgICAgICAgICAgfSk7XG4gICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIHZhcmlhYmxlLm9wZXJhdGlvbiA9IHZhcmlhYmxlLm9wZXJhdGlvbi5tYXAoKG9wOiBhbnkpID0+IHtcbiAgICAgICAgICAgICAgaWYgKCFvcC5pc0N1c3RvbVZhbHVlKSB7XG4gICAgICAgICAgICAgICAgbGV0IGRhdGFLZXkgPSBkYXRhS2V5cy5maW5kKFxuICAgICAgICAgICAgICAgICAgKGtleTogYW55KSA9PiBrZXkubmFtZS5zcGxpdCgnICcpLmpvaW4oJ18nKSA9PSBvcC52YWx1ZVxuICAgICAgICAgICAgICAgICk7XG4gICAgICAgICAgICAgICAgb3AudmFsdWUgPSBkYXRhS2V5Py50aXRsZSA/PyBvcC52YWx1ZTtcbiAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICByZXR1cm4gb3A7XG4gICAgICAgICAgICB9KTtcbiAgICAgICAgICB9XG4gICAgICAgICAgcmV0dXJuIHRoaXMuY3JlYXRlTmV3Rm9ybXVsYSh2YXJpYWJsZSk7XG4gICAgICAgIH1cbiAgICAgICk7XG5cbiAgICAgIGdyYXBoRGF0YS5kYXRhRm9ybWF0ID0gZ3JhcGhEYXRhLmRhdGFGb3JtYXQubWFwKChmb3JtYXQ6IGFueSkgPT4ge1xuICAgICAgICBsZXQgZGF0YUtleSA9IGRhdGFLZXlzLmZpbmQoKGtleTogYW55KSA9PiBrZXkubmFtZSA9PSBmb3JtYXQubmFtZSk7XG4gICAgICAgIHJldHVybiB7XG4gICAgICAgICAgLi4uZm9ybWF0LFxuICAgICAgICAgIG5hbWU6IGRhdGFLZXk/LnRpdGxlID8/IGZvcm1hdC5uYW1lLFxuICAgICAgICB9O1xuICAgICAgfSk7XG4gICAgfSBlbHNlIHtcbiAgICAgIGdyYXBoRGF0YS5yb3dzID0gZ3JhcGhEYXRhLnJvd3MubWFwKChyb3c6IGFueSkgPT4ge1xuICAgICAgICBsZXQgZGF0YUtleSA9IGRhdGFLZXlzLmZpbmQoKGtleTogYW55KSA9PiBrZXkudGl0bGUgPT0gcm93KTtcbiAgICAgICAgcmV0dXJuIGRhdGFLZXk/Lm5hbWUgPz8gcm93O1xuICAgICAgfSk7XG4gICAgICBncmFwaERhdGEuY29sdW1ucyA9IGdyYXBoRGF0YS5jb2x1bW5zLm1hcCgoY29sdW1uOiBhbnkpID0+IHtcbiAgICAgICAgbGV0IGRhdGFLZXkgPSBkYXRhS2V5cy5maW5kKChrZXk6IGFueSkgPT4ga2V5LnRpdGxlID09IGNvbHVtbik7XG4gICAgICAgIHJldHVybiBkYXRhS2V5Py5uYW1lID8/IGNvbHVtbjtcbiAgICAgIH0pO1xuICAgICAgZ3JhcGhEYXRhLmxhc3RMZXZlbENvbHVtbnMgPSBncmFwaERhdGEubGFzdExldmVsQ29sdW1ucy5tYXAoXG4gICAgICAgIChjb2x1bW46IGFueSkgPT4ge1xuICAgICAgICAgIGxldCBkYXRhS2V5ID0gZGF0YUtleXMuZmluZCgoa2V5OiBhbnkpID0+IGtleS50aXRsZSA9PSBjb2x1bW4pO1xuICAgICAgICAgIHJldHVybiBkYXRhS2V5Py5uYW1lID8/IGNvbHVtbjtcbiAgICAgICAgfVxuICAgICAgKTtcbiAgICAgIGlmIChncmFwaERhdGEuY29sVG9TaG93ICE9IG51bGwpIHtcbiAgICAgICAgbGV0IGRhdGFLZXkgPSBkYXRhS2V5cy5maW5kKFxuICAgICAgICAgIChrZXk6IGFueSkgPT4ga2V5LnRpdGxlID09IGdyYXBoRGF0YS5jb2xUb1Nob3dcbiAgICAgICAgKTtcbiAgICAgICAgZ3JhcGhEYXRhLmNvbFRvU2hvdyA9IGRhdGFLZXk/Lm5hbWUgPz8gZ3JhcGhEYXRhLmNvbFRvU2hvdztcbiAgICAgIH1cbiAgICAgIGdyYXBoRGF0YS5hZ2dyZWdhdGlvbkZ1bmN0aW9ucyA9IGdyYXBoRGF0YS5hZ2dyZWdhdGlvbkZ1bmN0aW9ucy5tYXAoXG4gICAgICAgIChmdW5jOiBhbnkpID0+IHtcbiAgICAgICAgICBsZXQgZGF0YUtleSA9IGRhdGFLZXlzLmZpbmQoXG4gICAgICAgICAgICAoa2V5OiBhbnkpID0+IGtleS50aXRsZSA9PSBmdW5jLnZhcmlhYmxlTmFtZVxuICAgICAgICAgICk7XG4gICAgICAgICAgcmV0dXJuIHtcbiAgICAgICAgICAgIC4uLmZ1bmMsXG4gICAgICAgICAgICB2YXJpYWJsZU5hbWU6IGRhdGFLZXk/Lm5hbWUgPz8gZnVuYy52YXJpYWJsZU5hbWUsXG4gICAgICAgICAgfTtcbiAgICAgICAgfVxuICAgICAgKTtcblxuICAgICAgZ3JhcGhEYXRhLmZpbHRlci54QXhpcyA9IGdyYXBoRGF0YS5maWx0ZXIueEF4aXMubWFwKChmOiBhbnkpID0+IHtcbiAgICAgICAgbGV0IGRhdGFLZXkgPSBkYXRhS2V5cy5maW5kKFxuICAgICAgICAgIChrZXk6IGFueSkgPT4ga2V5LnRpdGxlID09IGYudmFyaWFibGVOYW1lXG4gICAgICAgICk7XG4gICAgICAgIHJldHVybiB7XG4gICAgICAgICAgLi4uZixcbiAgICAgICAgICB2YXJpYWJsZU5hbWU6IGRhdGFLZXk/Lm5hbWUgPz8gZi52YXJpYWJsZU5hbWUsXG4gICAgICAgIH07XG4gICAgICB9KTtcbiAgICAgIGdyYXBoRGF0YS5maWx0ZXIueUF4aXMgPSBncmFwaERhdGEuZmlsdGVyLnlBeGlzLm1hcCgoZjogYW55KSA9PiB7XG4gICAgICAgIGxldCBkYXRhS2V5ID0gZGF0YUtleXMuZmluZChcbiAgICAgICAgICAoa2V5OiBhbnkpID0+IGtleS50aXRsZSA9PSBmLnZhcmlhYmxlTmFtZVxuICAgICAgICApO1xuICAgICAgICByZXR1cm4ge1xuICAgICAgICAgIC4uLmYsXG4gICAgICAgICAgdmFyaWFibGVOYW1lOiBkYXRhS2V5Py5uYW1lID8/IGYudmFyaWFibGVOYW1lLFxuICAgICAgICB9O1xuICAgICAgfSk7XG4gICAgICBncmFwaERhdGEuZmlsdGVyLnlQcmVBeGlzID0gZ3JhcGhEYXRhLmZpbHRlci55UHJlQXhpcy5tYXAoKGY6IGFueSkgPT4ge1xuICAgICAgICBsZXQgZGF0YUtleSA9IGRhdGFLZXlzLmZpbmQoXG4gICAgICAgICAgKGtleTogYW55KSA9PiBrZXkudGl0bGUgPT0gZi52YXJpYWJsZU5hbWVcbiAgICAgICAgKTtcbiAgICAgICAgcmV0dXJuIHtcbiAgICAgICAgICAuLi5mLFxuICAgICAgICAgIHZhcmlhYmxlTmFtZTogZGF0YUtleT8ubmFtZSA/PyBmLnZhcmlhYmxlTmFtZSxcbiAgICAgICAgfTtcbiAgICAgIH0pO1xuICAgICAgZ3JhcGhEYXRhLmZpbHRlci5jdXN0b21GaWx0ZXIgPSBncmFwaERhdGEuZmlsdGVyLmN1c3RvbUZpbHRlci5tYXAoXG4gICAgICAgIChmOiBhbnkpID0+IHtcbiAgICAgICAgICBsZXQgZGF0YUtleTEgPSBkYXRhS2V5cy5maW5kKFxuICAgICAgICAgICAgKGtleTogYW55KSA9PiBrZXkudGl0bGUgPT0gZi5jdXN0b21GaWx0ZXJ2YXIxXG4gICAgICAgICAgKTtcbiAgICAgICAgICBsZXQgZGF0YUtleTIgPSBkYXRhS2V5cy5maW5kKFxuICAgICAgICAgICAgKGtleTogYW55KSA9PiBrZXkudGl0bGUgPT0gZi5jdXN0b21GaWx0ZXJ2YXIyXG4gICAgICAgICAgKTtcbiAgICAgICAgICBsZXQgZGF0YUtleTMgPSBkYXRhS2V5cy5maW5kKFxuICAgICAgICAgICAgKGtleTogYW55KSA9PiBrZXkudGl0bGUgPT0gZi5jdXN0b21GaWx0ZXJ2YXIzXG4gICAgICAgICAgKTtcbiAgICAgICAgICByZXR1cm4ge1xuICAgICAgICAgICAgLi4uZixcbiAgICAgICAgICAgIGN1c3RvbUZpbHRlcnZhcjE6IGRhdGFLZXkxPy5uYW1lID8/IGYuY3VzdG9tRmlsdGVydmFyMSxcbiAgICAgICAgICAgIGN1c3RvbUZpbHRlcnZhcjI6IGRhdGFLZXkyPy5uYW1lID8/IGYuY3VzdG9tRmlsdGVydmFyMixcbiAgICAgICAgICAgIGN1c3RvbUZpbHRlcnZhcjM6IGRhdGFLZXkzPy5uYW1lID8/IGYuY3VzdG9tRmlsdGVydmFyMyxcbiAgICAgICAgICB9O1xuICAgICAgICB9XG4gICAgICApO1xuXG4gICAgICBncmFwaERhdGEuY3VzdG9tVmFyaWFibGUgPSBncmFwaERhdGEuY3VzdG9tVmFyaWFibGUubWFwKFxuICAgICAgICAodmFyaWFibGU6IGFueSkgPT4ge1xuICAgICAgICAgIGlmICh2YXJpYWJsZS5pc19maWx0ZXIgfHwgdmFyaWFibGUuaXNfc2xhYikge1xuICAgICAgICAgICAgdmFyaWFibGUuZmlsdGVycyA9IHZhcmlhYmxlLmZpbHRlcnMubWFwKChmOiBhbnkpID0+IHtcbiAgICAgICAgICAgICAgaWYgKCFmLmlzQ3VzdG9tVmFsdWUpIHtcbiAgICAgICAgICAgICAgICBsZXQgZGF0YUtleSA9IGRhdGFLZXlzLmZpbmQoXG4gICAgICAgICAgICAgICAgICAoa2V5OiBhbnkpID0+IGtleS50aXRsZSA9PSBmLnZhbHVlc1xuICAgICAgICAgICAgICAgICk7XG4gICAgICAgICAgICAgICAgZi52YWx1ZXMgPSBkYXRhS2V5Py5uYW1lID8/IGYudmFsdWVzO1xuICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgIGYuY29uZGl0aW9ucyA9IGYuY29uZGl0aW9ucy5tYXAoKGNvbmRpdGlvbjogYW55KSA9PiB7XG4gICAgICAgICAgICAgICAgbGV0IGRhdGFLZXkgPSBkYXRhS2V5cy5maW5kKFxuICAgICAgICAgICAgICAgICAgKGtleTogYW55KSA9PiBrZXkudGl0bGUgPT0gY29uZGl0aW9uLnZhcmlhYmxlLm5hbWVcbiAgICAgICAgICAgICAgICApO1xuICAgICAgICAgICAgICAgIGNvbmRpdGlvbi52YXJpYWJsZS5uYW1lID1cbiAgICAgICAgICAgICAgICAgIGRhdGFLZXk/Lm5hbWUgPz8gY29uZGl0aW9uLnZhcmlhYmxlLm5hbWU7XG4gICAgICAgICAgICAgICAgcmV0dXJuIGNvbmRpdGlvbjtcbiAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICAgIHJldHVybiBmO1xuICAgICAgICAgICAgfSk7XG4gICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIHZhcmlhYmxlLm9wZXJhdGlvbiA9IHZhcmlhYmxlLm9wZXJhdGlvbi5tYXAoKG9wOiBhbnkpID0+IHtcbiAgICAgICAgICAgICAgaWYgKCFvcC5pc0N1c3RvbVZhbHVlKSB7XG4gICAgICAgICAgICAgICAgbGV0IGRhdGFLZXkgPSBkYXRhS2V5cy5maW5kKFxuICAgICAgICAgICAgICAgICAgKGtleTogYW55KSA9PiBrZXkudGl0bGUuc3BsaXQoJyAnKS5qb2luKCdfJykgPT0gb3AudmFsdWVcbiAgICAgICAgICAgICAgICApO1xuICAgICAgICAgICAgICAgIG9wLnZhbHVlID0gZGF0YUtleT8ubmFtZSA/PyBvcC52YWx1ZTtcbiAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICByZXR1cm4gb3A7XG4gICAgICAgICAgICB9KTtcbiAgICAgICAgICB9XG4gICAgICAgICAgcmV0dXJuIHRoaXMuY3JlYXRlTmV3Rm9ybXVsYSh2YXJpYWJsZSk7XG4gICAgICAgIH1cbiAgICAgICk7XG5cbiAgICAgIGdyYXBoRGF0YS5kYXRhRm9ybWF0ID0gZ3JhcGhEYXRhLmRhdGFGb3JtYXQubWFwKChmb3JtYXQ6IGFueSkgPT4ge1xuICAgICAgICBsZXQgZGF0YUtleSA9IGRhdGFLZXlzLmZpbmQoKGtleTogYW55KSA9PiBrZXkudGl0bGUgPT0gZm9ybWF0Lm5hbWUpO1xuICAgICAgICByZXR1cm4ge1xuICAgICAgICAgIC4uLmZvcm1hdCxcbiAgICAgICAgICBuYW1lOiBkYXRhS2V5Py5uYW1lID8/IGZvcm1hdC5uYW1lLFxuICAgICAgICB9O1xuICAgICAgfSk7XG4gICAgfVxuXG4gICAgcmV0dXJuIGdyYXBoRGF0YTtcbiAgfVxuXG4gIGdldFZhcmlhYmxlRGF0YShpbnB1dDogYW55KSB7XG4gICAgaWYgKHRoaXMudmFsaWRhdGVUaW1lKGlucHV0KSkge1xuICAgICAgbGV0IHR5cGUgPSBEYXRhVHlwZS5USU1FO1xuICAgICAgcmV0dXJuIFt0eXBlXTtcbiAgICB9IGVsc2UgaWYgKHRoaXMuY2hlY2tEYXRlKGlucHV0KSkge1xuICAgICAgbGV0IHR5cGUgPSBEYXRhVHlwZS5EQVRFO1xuICAgICAgcmV0dXJuIFt0eXBlXTtcbiAgICB9IGVsc2UgaWYgKHRoaXMudmFsaWRhdGVOdW1iZXIoaW5wdXQpKSB7XG4gICAgICBsZXQgdHlwZSA9IERhdGFUeXBlLk5VTUJFUjtcbiAgICAgIHJldHVybiBbdHlwZV07XG4gICAgfSBlbHNlIHtcbiAgICAgIGxldCB0eXBlID0gRGF0YVR5cGUuU1RSSU5HO1xuICAgICAgcmV0dXJuIFt0eXBlXTtcbiAgICB9XG4gIH1cbiAgdmFsaWRhdGVUaW1lKGlucHV0OiBhbnkpIHtcbiAgICBsZXQgcGF0dGVybjEgPSAvXigxWzAtMl18MD9bMS05XSk6KFswLTVdP1swLTldKTooWzAtNV0/WzAtOV0pICjil48/W0FQXU0pPyQvO1xuICAgIGxldCBwYXR0ZXJuMiA9IC9eKDFbMC0yXXwwP1sxLTldKTooWzAtNV0/WzAtOV0pOihbMC01XT9bMC05XSkgKOKXjz9bYXBdbSk/JC87XG4gICAgbGV0IHBhdHRlcm4zID0gL14oMVswLTJdfDA/WzEtOV0pOihbMC01XT9bMC05XSkgKOKXjz9bQVBdTSk/JC87XG4gICAgbGV0IHBhdHRlcm40ID0gL14oMVswLTJdfDA/WzEtOV0pOihbMC01XT9bMC05XSkgKOKXjz9bYXBdbSk/JC87XG4gICAgbGV0IHBhdHRlcm41ID0gL14oMlswLTNdfFswMV0/WzAtOV0pOihbMC01XT9bMC05XSk6KFswLTVdP1swLTldKSQvO1xuICAgIGxldCBwYXR0ZXJuNiA9IC9eKDJbMC0zXXxbMDFdP1swLTldKTooWzAtNV0/WzAtOV0pJC87XG4gICAgcmV0dXJuIChcbiAgICAgIHBhdHRlcm4xLnRlc3QoaW5wdXQpIHx8XG4gICAgICBwYXR0ZXJuMi50ZXN0KGlucHV0KSB8fFxuICAgICAgcGF0dGVybjMudGVzdChpbnB1dCkgfHxcbiAgICAgIHBhdHRlcm40LnRlc3QoaW5wdXQpIHx8XG4gICAgICBwYXR0ZXJuNS50ZXN0KGlucHV0KSB8fFxuICAgICAgcGF0dGVybjYudGVzdChpbnB1dClcbiAgICApO1xuICB9XG4gIHZhbGlkYXRlTnVtYmVyKGU6IGFueSkge1xuICAgIGNvbnN0IHBhdHRlcm4yID0gL15bLStdP1swLTldK1xcLlswLTldKyQvO1xuICAgIGNvbnN0IHBhdHRlcm4gPSAvXlstK10/WzAtOV0rJC87XG4gICAgcmV0dXJuIHBhdHRlcm4udGVzdChlKSB8fCBwYXR0ZXJuMi50ZXN0KGUpO1xuICB9XG4gIGNoZWNrRGF0ZShpbnB1dDogYW55KSB7XG4gICAgY29uc3QgcGF0dGVybiA9XG4gICAgICAvXihbMC0yXVxcZHxbM11bMC0xXSlcXC0oWzBdXFxkfFsxXVswLTJdKVxcLShbMl1bMDFdfFsxXVs2LTldKVxcZHsyfShcXHMoWzAtMV1cXGR8WzJdWzAtM10pKFxcOlswLTVdXFxkKXsxLDJ9KT8kLztcbiAgICByZXR1cm4gcGF0dGVybi50ZXN0KGlucHV0KTtcbiAgfVxuICBjb252ZXJ0RGF0ZUZvcm1hdChpbnB1dDogYW55LCB0eXBlOiBhbnkpIHtcbiAgICBpZiAobW9tZW50KGlucHV0LCB0eXBlKS5pc1ZhbGlkKCkpIHtcbiAgICAgIHN3aXRjaCAodHlwZSkge1xuICAgICAgICBjYXNlICdERC1NTS1ZWVlZIGhoOm1tOnNzIGEnOlxuICAgICAgICAgIHJldHVybiBtb21lbnQoaW5wdXQsIHR5cGUpLmZvcm1hdCgnREQtTU0tWVlZWSBoaDptbTpzcyBhJyk7XG4gICAgICAgIGNhc2UgJ01NLURELVlZWVkgaGg6bW06c3MgYSc6XG4gICAgICAgICAgcmV0dXJuIG1vbWVudChpbnB1dCwgdHlwZSkuZm9ybWF0KCdERC1NTS1ZWVlZIGhoOm1tOnNzIGEnKTtcbiAgICAgICAgY2FzZSAnWVlZWS1NTS1ERCBoaDptbTpzcyBhJzpcbiAgICAgICAgICByZXR1cm4gbW9tZW50KGlucHV0LCB0eXBlKS5mb3JtYXQoJ0RELU1NLVlZWVkgaGg6bW06c3MgYScpO1xuICAgICAgICBjYXNlICdERC1NTS1ZWVlZJzpcbiAgICAgICAgICByZXR1cm4gbW9tZW50KGlucHV0LCB0eXBlKS5mb3JtYXQoJ0RELU1NLVlZWVknKTtcbiAgICAgICAgY2FzZSAnTU0tREQtWVlZWSc6XG4gICAgICAgICAgcmV0dXJuIG1vbWVudChpbnB1dCwgdHlwZSkuZm9ybWF0KCdERC1NTS1ZWVlZJyk7XG4gICAgICAgIGNhc2UgJ1lZWVktTU0tREQnOlxuICAgICAgICAgIHJldHVybiBtb21lbnQoaW5wdXQsIHR5cGUpLmZvcm1hdCgnREQtTU0tWVlZWScpO1xuICAgICAgICBjYXNlICdERC9NTS9ZWVlZIGhoOm1tOnNzIGEnOlxuICAgICAgICAgIHJldHVybiBtb21lbnQoaW5wdXQsIHR5cGUpLmZvcm1hdCgnREQtTU0tWVlZWSBoaDptbTpzcyBhJyk7XG4gICAgICAgIGNhc2UgJ01NL0REL1lZWVkgaGg6bW06c3MgYSc6XG4gICAgICAgICAgcmV0dXJuIG1vbWVudChpbnB1dCwgdHlwZSkuZm9ybWF0KCdERC1NTS1ZWVlZIGhoOm1tOnNzIGEnKTtcbiAgICAgICAgY2FzZSAnWVlZWS9NTS9ERCBoaDptbTpzcyBhJzpcbiAgICAgICAgICByZXR1cm4gbW9tZW50KGlucHV0LCB0eXBlKS5mb3JtYXQoJ0RELU1NLVlZWVkgaGg6bW06c3MgYScpO1xuICAgICAgICBjYXNlICdERC9NTS9ZWVlZJzpcbiAgICAgICAgICByZXR1cm4gbW9tZW50KGlucHV0LCB0eXBlKS5mb3JtYXQoJ0RELU1NLVlZWVknKTtcbiAgICAgICAgY2FzZSAnTU0vREQvWVlZWSc6XG4gICAgICAgICAgcmV0dXJuIG1vbWVudChpbnB1dCwgdHlwZSkuZm9ybWF0KCdERC1NTS1ZWVlZJyk7XG4gICAgICAgIGNhc2UgJ1lZWVkvTU0vREQnOlxuICAgICAgICAgIHJldHVybiBtb21lbnQoaW5wdXQsIHR5cGUpLmZvcm1hdCgnREQtTU0tWVlZWScpO1xuICAgICAgICBjYXNlICdISDptbSc6XG4gICAgICAgICAgcmV0dXJuIG1vbWVudChpbnB1dCwgdHlwZSkuZm9ybWF0KCdISDptbTpzcycpO1xuICAgICAgICBjYXNlICdISDptbTpzcyc6XG4gICAgICAgICAgcmV0dXJuIG1vbWVudChpbnB1dCwgdHlwZSkuZm9ybWF0KCdISDptbTpzcycpO1xuICAgICAgICBjYXNlICdoaDptbSBhJzpcbiAgICAgICAgICByZXR1cm4gbW9tZW50KGlucHV0LCB0eXBlKS5mb3JtYXQoJ0hIOm1tOnNzJyk7XG4gICAgICAgIGNhc2UgJ2hoOm1tOnNzIGEnOlxuICAgICAgICAgIHJldHVybiBtb21lbnQoaW5wdXQsIHR5cGUpLmZvcm1hdCgnSEg6bW06c3MnKTtcbiAgICAgICAgZGVmYXVsdDpcbiAgICAgICAgICByZXR1cm4gbnVsbDtcbiAgICAgIH1cbiAgICB9IGVsc2Uge1xuICAgICAgcmV0dXJuIG51bGw7XG4gICAgfVxuICB9XG4gIGdldERlY29kZWRVcmwodXJsOiBhbnkpIHtcbiAgICByZXR1cm4gdGhpcy5odHRwXG4gICAgICAucG9zdCh0aGlzLkRDVVRMWV9CQVNFX1VSTCArICdjdXQvZGVjb2RlVXJsJywge1xuICAgICAgICB1cmw6IHVybCxcbiAgICAgICAgcGFyYW1FbmNyeXB0aW9uOiBmYWxzZSxcbiAgICAgIH0pXG4gICAgICAudG9Qcm9taXNlKCk7XG4gIH1cbiAgZ2V0RW5jb2RlZFVybCh1cmw6IGFueSkge1xuICAgIHJldHVybiB0aGlzLmh0dHBcbiAgICAgIC5wb3N0KHRoaXMuRENVVExZX0JBU0VfVVJMICsgJ2N1dC9zaG9ydCcsIHtcbiAgICAgICAgdXJsOiB1cmwsXG4gICAgICAgIHBhcmFtRW5jcnlwdGlvbjogdHJ1ZSxcbiAgICAgIH0pXG4gICAgICAudG9Qcm9taXNlKCk7XG4gIH1cbiAgZ2V0U2hhcmVkRGFzaGJvYXJkKHBhcmFtczogYW55LCBhZG1pbklkOiBzdHJpbmcpIHtcbiAgICByZXR1cm4gdGhpcy5odHRwXG4gICAgICAuZ2V0KHRoaXMuWFNJR0hUX0JBU0VfVVJMICsgJ2Rhc2hib2FyZC9nZXQtc2hhcmVkLWRhc2hib2FyZCcgKyBwYXJhbXMsIHtcbiAgICAgICAgaGVhZGVyczogdGhpcy5zZXRIZWFkZXJzKGFkbWluSWQpLFxuICAgICAgfSlcbiAgICAgIC50b1Byb21pc2UoKTtcbiAgfVxuICBnZXRTaGFyZWRCYWNrZW5kRGFzaGJvYXJkKHBhcmFtczogYW55LCBhZG1pbklkOiBzdHJpbmcpIHtcbiAgICByZXR1cm4gdGhpcy5odHRwXG4gICAgICAucG9zdCh0aGlzLlhTSUdIVF9CQVNFX1VSTCArICdkYXNoYm9hcmQvZ2V0LXNoYXJlZC1iYWNrZW5kLWRhc2hib2FyZC1kYXRhJywgcGFyYW1zLCB7XG4gICAgICAgIGhlYWRlcnM6IHRoaXMuc2V0SGVhZGVycyhhZG1pbklkKSxcbiAgICAgIH0pXG4gICAgICAudG9Qcm9taXNlKCk7XG4gIH1cbiAgZ2V0U2hhcmVkRGFzaGJvYXJkRGF0YShkYXNoYm9hcmRfaWQ6IGFueSwgYWRtaW5JZDogc3RyaW5nKSB7XG4gICAgcmV0dXJuIHRoaXMuaHR0cFxuICAgICAgLmdldChcbiAgICAgICAgdGhpcy5YU0lHSFRfQkFTRV9VUkwgK1xuICAgICAgICAgICdkYXNoYm9hcmQvZ2V0LXNoYXJlZC1kYXNoYm9hcmQtZGF0YT9zaGFyZWlkPScgK1xuICAgICAgICAgIGRhc2hib2FyZF9pZCxcbiAgICAgICAge1xuICAgICAgICAgIGhlYWRlcnM6IHRoaXMuc2V0SGVhZGVycyhhZG1pbklkKSxcbiAgICAgICAgfVxuICAgICAgKVxuICAgICAgLnRvUHJvbWlzZSgpO1xuICB9XG59XG4iXX0=