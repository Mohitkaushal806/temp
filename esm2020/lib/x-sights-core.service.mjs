import { Injectable } from '@angular/core';
import * as Highcharts from 'highcharts';
import Drilldown from 'highcharts/modules/drilldown';
import * as lodash from 'lodash';
import HC_exporting from 'highcharts/modules/exporting';
import offlineExporting from 'highcharts/modules/offline-exporting';
import accessibility from 'highcharts/modules/accessibility';
import highStocks from 'highcharts/modules/stock';
import { BigNumber } from 'bignumber.js';
import { GraphTypes, } from './data-types/graph-interfaces';
import { RangeFilter, } from './data-types/trend-interfaces';
import { CustomFilterTypes, FilterTypes, } from './data-types/filter-interfaces';
import { DataType, DateFormat, TimeFormat, } from './data-types/variable-types';
import { PivotFieldsArea, } from './data-types/pivot-interfaces';
import PivotGridDataSource from 'devextreme/ui/pivot_grid/data_source';
import { DataPopupComponent } from './components/data-popup/data-popup.component';
import * as i0 from "@angular/core";
import * as i1 from "@ng-bootstrap/ng-bootstrap";
import * as i2 from "./services/data.service";
HC_exporting(Highcharts);
offlineExporting(Highcharts);
highStocks(Highcharts);
accessibility(Highcharts);
Drilldown(Highcharts);
export var WidgetType;
(function (WidgetType) {
    WidgetType["GRAPH"] = "graph";
    WidgetType["TREND"] = "trend";
    WidgetType["PIVOT_TABLE"] = "pivot_table";
})(WidgetType || (WidgetType = {}));
export class XSightsCoreService {
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
                case WidgetType.PIVOT_TABLE:
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
                            let aggName = _self.charts[currGraphId].aggregationFunctions[colId].aggregationFunctions;
                            let tempData = lodash.cloneDeep(_self.charts[currGraphId].graphData[e.point.name]);
                            if (aggName == "NO FUNCTION") {
                                tempData = tempData.filter((d) => d[_self.charts[currGraphId].columns[colId]] > 0);
                            }
                            _self.dataService.setModalData({
                                colToView: _self.charts[currGraphId].lastLevelColumns,
                                refData: tempData,
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
                        if (index > 0) {
                            // this.buildGraph()
                            //Restoring Data using previous store data
                            _this.charts[graphId].currLevel = index;
                            _this.charts[graphId].graphData = _this.charts[graphId].prevLevelData[index];
                            //Refresh Previous Data List
                            _this.charts[graphId].prevLevelData = _this.charts[graphId].prevLevelData.slice(0, index);
                            _this.charts[graphId].breadCrumb = _this.charts[graphId].breadCrumb.slice(0, index + 1);
                            _this.charts[graphId].selKeys = _this.charts[graphId].selKeys?.slice(0, index);
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
        let resultantData = [...allData];
        if (!addSlab) {
            customVariable = customVariable.filter((variable) => !variable.is_slab);
        }
        lodash.forEach(customVariable, (variable, index) => {
            if (variable.is_filter) {
                //Check validity over all filters
                lodash.forEach(variable.filters, (filter) => {
                    let residingData = []; //Data where filter is not applicable
                    let filteredData = [];
                    filteredData = [...resultantData]; //Data where filter is applicable
                    let dataToTraverse = null;
                    if (filter.isCustomValue || !withoutAgg) {
                        lodash.forEach(filter.conditions, (condition, i) => {
                            let variableInfo = null;
                            let tempResidingList = [];
                            switch (condition.operator) {
                                case FilterTypes.IN:
                                    [filteredData, tempResidingList] = lodash.reduce(lodash.cloneDeep(filteredData), (result, elData) => {
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
                                    [filteredData, tempResidingList] = lodash.reduce(filteredData, (result, elData) => {
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
                                    [filteredData, tempResidingList] = lodash.reduce(filteredData, (result, elData) => {
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
                                    [filteredData, tempResidingList] = lodash.reduce(filteredData, (result, elData) => {
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
                                    [filteredData, tempResidingList] = lodash.reduce(filteredData, (result, elData) => {
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
                                    [filteredData, tempResidingList] = lodash.reduce(filteredData, (result, elData) => {
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
                                    [filteredData, tempResidingList] = lodash.reduce(filteredData, (result, elData) => {
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
                                    [filteredData, tempResidingList] = lodash.reduce(filteredData, (result, elData) => {
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
                                    [filteredData, tempResidingList] = lodash.reduce(filteredData, (result, elData) => {
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
                                                tempResidingList.push(elData);
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
                                                tempResidingList.push(elData);
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
                                                tempResidingList.push(elData);
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
                                                tempResidingList.push(elData);
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
                                                tempResidingList.push(elData);
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
                                                tempResidingList.push(elData);
                                            }
                                        }
                                    });
                                    break;
                            }
                            residingData = [...residingData, ...tempResidingList];
                        });
                        if (filter.isCustomValue) {
                            //Insert custom value
                            let value = this.validateNumber(filter.values)
                                ? parseFloat(filter.values)
                                : filter.values;
                            resultantData = [
                                ...lodash.map(lodash.cloneDeep(filteredData), (d) => ({
                                    ...d,
                                    [variable.name]: value,
                                })),
                                ...lodash.cloneDeep(residingData),
                            ];
                        }
                        else {
                            //Insert calculated value
                            dataToTraverse = lodash.without(lodash.map(lodash.cloneDeep(filteredData), filter.values), undefined);
                            let value = filter.aggregationFunction == 'NO FUNCTION'
                                ? null
                                : this.getAggregatedValueOfCustomVariable(dataToTraverse, filter);
                            resultantData = [
                                ...lodash.map(lodash.cloneDeep(filteredData), (d) => ({
                                    ...d,
                                    [variable.name]: value == null ? d[filter.values] : value,
                                })),
                                ...lodash.cloneDeep(residingData),
                            ];
                        }
                        filteredData = null;
                        residingData = null;
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
XSightsCoreService.ɵfac = i0.ɵɵngDeclareFactory({ minVersion: "12.0.0", version: "13.0.3", ngImport: i0, type: XSightsCoreService, deps: [{ token: i1.NgbModal }, { token: i1.NgbModalConfig }, { token: i2.DataService }], target: i0.ɵɵFactoryTarget.Injectable });
XSightsCoreService.ɵprov = i0.ɵɵngDeclareInjectable({ minVersion: "12.0.0", version: "13.0.3", ngImport: i0, type: XSightsCoreService, providedIn: 'root' });
i0.ɵɵngDeclareClassMetadata({ minVersion: "12.0.0", version: "13.0.3", ngImport: i0, type: XSightsCoreService, decorators: [{
            type: Injectable,
            args: [{
                    providedIn: 'root',
                }]
        }], ctorParameters: function () { return [{ type: i1.NgbModal }, { type: i1.NgbModalConfig }, { type: i2.DataService }]; } });
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoieC1zaWdodHMtY29yZS5zZXJ2aWNlLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vLi4vLi4vcHJvamVjdHMveC1zaWdodHMtY29yZS9zcmMvbGliL3gtc2lnaHRzLWNvcmUuc2VydmljZS50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQSxPQUFPLEVBQUUsVUFBVSxFQUFFLE1BQU0sZUFBZSxDQUFDO0FBRTNDLE9BQU8sS0FBSyxVQUFVLE1BQU0sWUFBWSxDQUFDO0FBQ3pDLE9BQU8sU0FBUyxNQUFNLDhCQUE4QixDQUFDO0FBQ3JELE9BQU8sS0FBSyxNQUFNLE1BQU0sUUFBUSxDQUFDO0FBQ2pDLE9BQU8sWUFBWSxNQUFNLDhCQUE4QixDQUFDO0FBQ3hELE9BQU8sZ0JBQWdCLE1BQU0sc0NBQXNDLENBQUM7QUFDcEUsT0FBTyxhQUFhLE1BQU0sa0NBQWtDLENBQUM7QUFDN0QsT0FBTyxVQUFVLE1BQU0sMEJBQTBCLENBQUM7QUFDbEQsT0FBTyxFQUFFLFNBQVMsRUFBRSxNQUFNLGNBQWMsQ0FBQztBQUl6QyxPQUFPLEVBRUwsVUFBVSxHQUVYLE1BQU0sK0JBQStCLENBQUM7QUFDdkMsT0FBTyxFQUNMLFdBQVcsR0FHWixNQUFNLCtCQUErQixDQUFDO0FBS3ZDLE9BQU8sRUFFTCxpQkFBaUIsRUFFakIsV0FBVyxHQUNaLE1BQU0sZ0NBQWdDLENBQUM7QUFNeEMsT0FBTyxFQUVMLFFBQVEsRUFDUixVQUFVLEVBQ1YsVUFBVSxHQUNYLE1BQU0sNkJBQTZCLENBQUM7QUFDckMsT0FBTyxFQUVMLGVBQWUsR0FFaEIsTUFBTSwrQkFBK0IsQ0FBQztBQUN2QyxPQUFPLG1CQUFtQixNQUFNLHNDQUFzQyxDQUFDO0FBQ3ZFLE9BQU8sRUFBRSxrQkFBa0IsRUFBRSxNQUFNLDhDQUE4QyxDQUFDOzs7O0FBR2xGLFlBQVksQ0FBQyxVQUFVLENBQUMsQ0FBQztBQUN6QixnQkFBZ0IsQ0FBQyxVQUFVLENBQUMsQ0FBQztBQUM3QixVQUFVLENBQUMs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NkJBQ1YsR0FBRyxDQUFDLENBQUMsRUFBTyxFQUFFLEVBQUUsQ0FBQyxRQUFRLENBQUMsRUFBRSxDQUFDLENBQUMsQ0FBQzt3QkFDaEMsSUFBSSxXQUFXLEdBQUcsSUFBSSxHQUFHLEVBQUUsR0FBRyxFQUFFLEdBQUcsR0FBRyxHQUFHLEVBQUUsQ0FBQzt3QkFDNUMsSUFBSSxjQUFjLEdBQUcsT0FBTyxHQUFHLEVBQUUsR0FBRyxFQUFFLEdBQUcsTUFBTSxHQUFHLEVBQUUsQ0FBQzt3QkFDckQsSUFBSyxXQUFXLElBQUksV0FBVzs0QkFDN0IsV0FBVyxHQUFHLGNBQWMsRUFBRTs0QkFDOUIsT0FBTyxHQUFHLElBQUksQ0FBQzt5QkFDaEI7cUJBQ0Y7b0JBQ0QsTUFBTTthQUNiO1NBQ0o7UUFDRCxtREFBbUQ7UUFDbkQsc0RBQXNEO1FBQ3RELElBQUk7UUFDSixPQUFPLE9BQU8sQ0FBQztJQUNuQixDQUFDOzsrR0FybUZZLGtCQUFrQjttSEFBbEIsa0JBQWtCLGNBRmpCLE1BQU07MkZBRVAsa0JBQWtCO2tCQUg5QixVQUFVO21CQUFDO29CQUNWLFVBQVUsRUFBRSxNQUFNO2lCQUNuQiIsInNvdXJjZXNDb250ZW50IjpbImltcG9ydCB7IEluamVjdGFibGUgfSBmcm9tICdAYW5ndWxhci9jb3JlJztcbmltcG9ydCB7IE5nYk1vZGFsLCBOZ2JNb2RhbENvbmZpZyB9IGZyb20gJ0BuZy1ib290c3RyYXAvbmctYm9vdHN0cmFwJztcbmltcG9ydCAqIGFzIEhpZ2hjaGFydHMgZnJvbSAnaGlnaGNoYXJ0cyc7XG5pbXBvcnQgRHJpbGxkb3duIGZyb20gJ2hpZ2hjaGFydHMvbW9kdWxlcy9kcmlsbGRvd24nO1xuaW1wb3J0ICogYXMgbG9kYXNoIGZyb20gJ2xvZGFzaCc7XG5pbXBvcnQgSENfZXhwb3J0aW5nIGZyb20gJ2hpZ2hjaGFydHMvbW9kdWxlcy9leHBvcnRpbmcnO1xuaW1wb3J0IG9mZmxpbmVFeHBvcnRpbmcgZnJvbSAnaGlnaGNoYXJ0cy9tb2R1bGVzL29mZmxpbmUtZXhwb3J0aW5nJztcbmltcG9ydCBhY2Nlc3NpYmlsaXR5IGZyb20gJ2hpZ2hjaGFydHMvbW9kdWxlcy9hY2Nlc3NpYmlsaXR5JztcbmltcG9ydCBoaWdoU3RvY2tzIGZyb20gJ2hpZ2hjaGFydHMvbW9kdWxlcy9zdG9jayc7XG5pbXBvcnQgeyBCaWdOdW1iZXIgfSBmcm9tICdiaWdudW1iZXIuanMnO1xuXG5cbmltcG9ydCBEZWNpbWFsIGZyb20gJ2RlY2ltYWwuanMnO1xuaW1wb3J0IHtcbiAgR3JhcGhEYXRhLFxuICBHcmFwaFR5cGVzLFxuICBHcmFwaExpc3QsXG59IGZyb20gJy4vZGF0YS10eXBlcy9ncmFwaC1pbnRlcmZhY2VzJztcbmltcG9ydCB7XG4gIFJhbmdlRmlsdGVyLFxuICBUcmVuZHNEYXRhLFxuICBUcmVuZHNMaXN0LFxufSBmcm9tICcuL2RhdGEtdHlwZXMvdHJlbmQtaW50ZXJmYWNlcyc7XG5pbXBvcnQge1xuICBBZ2dyZWdhdGlvbkZ1bmN0aW9uLFxuICBBZ2dyZWdhdGlvbkZ1bmN0aW9uc1R5cGUsXG59IGZyb20gJy4vZGF0YS10eXBlcy9hZ2dyZWdhdGlvbi1pbnRlcmZhY2VzJztcbmltcG9ydCB7XG4gIEN1c3RvbUZpbHRlcixcbiAgQ3VzdG9tRmlsdGVyVHlwZXMsXG4gIEZpbHRlcnMsXG4gIEZpbHRlclR5cGVzLFxufSBmcm9tICcuL2RhdGEtdHlwZXMvZmlsdGVyLWludGVyZmFjZXMnO1xuaW1wb3J0IHtcbiAgRGVyaXZlZFZhcmlhYmxlLFxuICBEZXJpdmVkVmFyaWFibGVGaWx0ZXIsXG4gIERlcml2ZWRWYXJpYWJsZUZpbHRlckNvbmRpdGlvbixcbn0gZnJvbSAnLi9kYXRhLXR5cGVzL2Rlcml2ZWQtdmFyaWFibGUtaW50ZXJmYWNlcyc7XG5pbXBvcnQge1xuICBEYXRhRm9ybWF0LFxuICBEYXRhVHlwZSxcbiAgRGF0ZUZvcm1hdCxcbiAgVGltZUZvcm1hdCxcbn0gZnJvbSAnLi9kYXRhLXR5cGVzL3ZhcmlhYmxlLXR5cGVzJztcbmltcG9ydCB7XG4gIEZpZWxkcyxcbiAgUGl2b3RGaWVsZHNBcmVhLFxuICBQaXZvdFRhYmxlRGF0YSxcbn0gZnJvbSAnLi9kYXRhLXR5cGVzL3Bpdm90LWludGVyZmFjZXMnO1xuaW1wb3J0IFBpdm90R3JpZERhdGFTb3VyY2UgZnJvbSAnZGV2ZXh0cmVtZS91aS9waXZvdF9ncmlkL2RhdGFfc291cmNlJztcbmltcG9ydCB7IERhdGFQb3B1cENvbXBvbmVudCB9IGZyb20gJy4vY29tcG9uZW50cy9kYXRhLXBvcHVwL2RhdGEtcG9wdXAuY29tcG9uZW50JztcbmltcG9ydCB7IERhdGFTZXJ2aWNlIH0gZnJvbSAnLi9zZXJ2aWNlcy9kYXRhLnNlcnZpY2UnO1xuXG5IQ19leHBvcnRpbmcoSGlnaGNoYXJ0cyk7XG5vZmZsaW5lRXhwb3J0aW5nKEhpZ2hjaGFydHMpO1xuaGlnaFN0b2NrcyhIaWdoY2hhcnRzKTtcbmFjY2Vzc2liaWxpdHkoSGlnaGNoYXJ0cyk7XG5EcmlsbGRvd24oSGlnaGNoYXJ0cyk7XG5cbmV4cG9ydCBlbnVtIFdpZGdldFR5cGUge1xuICBHUkFQSCA9ICdncmFwaCcsXG4gIFRSRU5EID0gJ3RyZW5kJyxcbiAgUElWT1RfVEFCTEUgPSAncGl2b3RfdGFibGUnLFxufVxuXG5ASW5qZWN0YWJsZSh7XG4gIHByb3ZpZGVkSW46ICdyb290Jyxcbn0pXG5leHBvcnQgY2xhc3MgWFNpZ2h0c0NvcmVTZXJ2aWNlIHtcbiAgcHJpdmF0ZSBtb2RhbERhdGE6IGFueSA9IHt9O1xuICBwcml2YXRlIGhpZ2hjaGFydHM6IHR5cGVvZiBIaWdoY2hhcnRzID0gSGlnaGNoYXJ0cztcbiAgcHJpdmF0ZSBkaXZTdHlsZXMgPVxuICAgICdkaXNwbGF5OiBmbGV4OyBqdXN0aWZ5LWNvbnRlbnQ6IGZsZXgtc3RhcnQ7IGFsaWduLWl0ZW1zOiBjZW50ZXI7IHBvc2l0aW9uOiBhYnNvbHV0ZTsgdG9wOiA1cHg7IGxlZnQ6IDVweDsnO1xuICBwcml2YXRlIGljb25TdHlsZXMgPVxuICAgICdib3JkZXI6IDJweCBzb2xpZCAjZWVlOyBwYWRkaW5nOiA1cHg7IG1pbi13aWR0aDogMjhweDsgdGV4dC1hbGlnbjogY2VudGVyOyBib3JkZXItcmFkaXVzOiA4cHg7IGJhY2tncm91bmQ6ICNjY2M7IGJveC1zaGFkb3c6IDJweCAycHggMnB4ICNjY2M7IG1hcmdpbi1yaWdodDogMTBweDsnO1xuICBwcml2YXRlIGNyZWRpdFRpdGxlID0gJ1Bvd2VyZWQgYnkgQXhlc3RyYWNrJztcbiAgcHJpdmF0ZSBjcmVkaXRVcmwgPSAnaHR0cHM6Ly93d3cuYXhlc3RyYWNrLmNvbS8nO1xuICBwcml2YXRlIGJyZWFkY3J1bWJTdHlsZXMgPVxuICAnYm9yZGVyOiAycHggc29saWQgI2VlZTsgYmFja2dyb3VuZDogI2NjYzsgcGFkZGluZzogNXB4OyBtaW4td2lkdGg6IDI4cHg7IHRleHQtYWxpZ246IGNlbnRlcjsgYm9yZGVyLXJhZGl1czogOHB4OyBkaXNwbGF5OiBmbGV4OyBib3gtc2hhZG93OiAycHggMnB4IDJweCAjY2NjOyBtYXJnaW4tcmlnaHQ6IDEwcHg7JztcblxuICBwcml2YXRlIGNoYXJ0czogR3JhcGhMaXN0ID0ge307XG4gIHByaXZhdGUgdHJlbmRzOiBUcmVuZHNMaXN0ID0ge307XG5cbiAgY29uc3RydWN0b3IoXG4gICAgcHJpdmF0ZSBkaWFsb2c6IE5nYk1vZGFsLFxuICAgIHByaXZhdGUgbW9kYWxDb25maWc6IE5nYk1vZGFsQ29uZmlnLFxuICAgIHByaXZhdGUgZGF0YVNlcnZpY2U6IERhdGFTZXJ2aWNlXG4gICkge1xuICAgIHRoaXMubW9kYWxDb25maWcubW9kYWxEaWFsb2dDbGFzcyA9ICdkYXRhcG9wdXAtZGFpbG9nJztcbiAgICB0aGlzLm1vZGFsQ29uZmlnLndpbmRvd0NsYXNzID0gJ2RhdGFwb3B1cC13aW5kb3cnO1xuICB9XG5cbiAgcHVibGljIGJ1aWxkKFxuICAgIHdpZGdldFR5cGU6IFdpZGdldFR5cGUsXG4gICAgd2lkZ2V0RGF0YTogR3JhcGhEYXRhIHwgVHJlbmRzRGF0YSB8IFBpdm90VGFibGVEYXRhXG4gICk6IFByb21pc2U8YW55PiB7XG4gICAgcmV0dXJuIG5ldyBQcm9taXNlKChyZXNvbHZlLCByZWplY3QpID0+IHtcbiAgICAgIHN3aXRjaCAod2lkZ2V0VHlwZSkge1xuICAgICAgICBjYXNlIFdpZGdldFR5cGUuR1JBUEg6XG4gICAgICAgICAgcmVzb2x2ZShcbiAgICAgICAgICAgIHRoaXMuYnVpbGRHcmFwaCh7XG4gICAgICAgICAgICAgIC4uLndpZGdldERhdGEsXG4gICAgICAgICAgICAgIGJyZWFkQ3J1bWI6IFsnSG9tZSddLFxuICAgICAgICAgICAgICBjdXJyTGV2ZWw6IDAsXG4gICAgICAgICAgICAgIHByZXZMZXZlbERhdGE6IFtdLFxuICAgICAgICAgICAgICBzZWxLZXlzOiBbXSxcbiAgICAgICAgICAgICAgb3JkZXI6IDAsXG4gICAgICAgICAgICAgIGNvbFRvU2hvdzogJycsXG4gICAgICAgICAgICB9IGFzIEdyYXBoRGF0YSlcbiAgICAgICAgICApO1xuICAgICAgICAgIGJyZWFrO1xuICAgICAgICBjYXNlIFdpZGdldFR5cGUuVFJFTkQ6XG4gICAgICAgICAgbGV0IHdpZGdldDogVHJlbmRzRGF0YSA9IHdpZGdldERhdGEgYXMgVHJlbmRzRGF0YTtcbiAgICAgICAgICByZXNvbHZlKFxuICAgICAgICAgICAgdGhpcy5idWlsZFRyZW5kKHtcbiAgICAgICAgICAgICAgLi4ud2lkZ2V0LFxuICAgICAgICAgICAgICByYXdEYXRhOiB3aWRnZXQuZ3JhcGhEYXRhLFxuICAgICAgICAgICAgICBjdXJyTGV2ZWw6IDEsXG4gICAgICAgICAgICAgIG9yZGVyOiAwLFxuICAgICAgICAgICAgICBwcmV2TGV2ZWxEYXRhOiBbXSxcbiAgICAgICAgICAgIH0gYXMgVHJlbmRzRGF0YSlcbiAgICAgICAgICApO1xuICAgICAgICAgIGJyZWFrO1xuICAgICAgICBjYXNlIFdpZGdldFR5cGUuUElWT1RfVEFCTEU6XG4gICAgICAgICAgcmVzb2x2ZSh0aGlzLmJ1aWxkUGl2b3RUYWJsZSh3aWRnZXREYXRhIGFzIFBpdm90VGFibGVEYXRhKSk7XG4gICAgICAgICAgYnJlYWs7XG4gICAgICB9XG4gICAgfSk7XG4gIH1cblxuICBwcml2YXRlIGJ1aWxkUGl2b3RUYWJsZSh0YWJsZURhdGE6IFBpdm90VGFibGVEYXRhKSB7XG4gICAgLy9BcHBseWluZyBDdXN0b20gRmlsdGVyXG4gICAgbGV0IGRhdGEgPSB0YWJsZURhdGEuZGF0YTtcbiAgICBcbiAgICBsZXQgZmllbGRzOiBGaWVsZHNbXSA9IFtdO1xuICAgIHRhYmxlRGF0YS5yb3dzLmZvckVhY2goKHJvdykgPT4ge1xuICAgICAgZmllbGRzLnB1c2goe1xuICAgICAgICBjYXB0aW9uOiByb3csXG4gICAgICAgIGRhdGFGaWVsZDogcm93LFxuICAgICAgICBhcmVhOiBQaXZvdEZpZWxkc0FyZWEuUk9XLFxuICAgICAgfSk7XG4gICAgfSk7XG4gICAgdGFibGVEYXRhLmNhdGVnb3JpZXMuZm9yRWFjaCgoY29sKSA9PiB7XG4gICAgICBmaWVsZHMucHVzaCh7XG4gICAgICAgIGNhcHRpb246IGNvbCxcbiAgICAgICAgZGF0YUZpZWxkOiBjb2wsXG4gICAgICAgIGFyZWE6IFBpdm90RmllbGRzQXJlYS5DT0xVTU4sXG4gICAgICB9KTtcbiAgICB9KTtcbiAgICB0YWJsZURhdGEuY29sdW1uLmZvckVhY2goKHZhbCwgaW5kZXgpID0+IHtcbiAgICAgIGZpZWxkcy5wdXNoKHtcbiAgICAgICAgY2FwdGlvbjpcbiAgICAgICAgICB2YWwgK1xuICAgICAgICAgICcoJyArXG4gICAgICAgICAgdGFibGVEYXRhLmFnZ3JlZ2F0aW9uRnVuY3Rpb25bXG4gICAgICAgICAgICBpbmRleFxuICAgICAgICAgIF0uYWdncmVnYXRpb25GdW5jdGlvbnMudG9Mb3dlckNhc2UoKSArXG4gICAgICAgICAgJyknLFxuICAgICAgICBkYXRhRmllbGQ6IHZhbCxcbiAgICAgICAgYXJlYTogUGl2b3RGaWVsZHNBcmVhLkRBVEEsXG4gICAgICAgIGFsbG93RmlsdGVyaW5nOiB0cnVlLFxuICAgICAgICBhbGxvd1NvcnRpbmc6IHRydWUsXG4gICAgICAgIGZvcm1hdDogZnVuY3Rpb24gKHZhbHVlOiBhbnkpIHtcbiAgICAgICAgICBpZiAoIU51bWJlci5pc0ludGVnZXIodmFsdWUpKSB7XG4gICAgICAgICAgICByZXR1cm4gdmFsdWUudG9GaXhlZCgyKS50b1N0cmluZygpO1xuICAgICAgICAgIH1cbiAgICAgICAgICByZXR1cm4gdmFsdWUudG9TdHJpbmcoKTtcbiAgICAgICAgfSxcbiAgICAgICAgc3VtbWFyeVR5cGU6XG4gICAgICAgICAgdGFibGVEYXRhLmFnZ3JlZ2F0aW9uRnVuY3Rpb25bXG4gICAgICAgICAgICBpbmRleFxuICAgICAgICAgIF0uYWdncmVnYXRpb25GdW5jdGlvbnMudG9Mb3dlckNhc2UoKSxcbiAgICAgIH0pO1xuICAgIH0pO1xuICAgIGxldCBwaXZvdERhdGE6IGFueSA9IHtcbiAgICAgIGZpZWxkczogZmllbGRzLFxuICAgICAgc3RvcmU6IGRhdGEsXG4gICAgfTtcbiAgICBsZXQgcmVzcG9uc2UgPSBuZXcgUGl2b3RHcmlkRGF0YVNvdXJjZShwaXZvdERhdGEpO1xuICAgIHJldHVybiByZXNwb25zZTtcbiAgfVxuXG4gIC8vR3JhcGggRnVuY3Rpb25cbiAgcHJpdmF0ZSBhc3luYyBidWlsZEdyYXBoKGdyYXBoRGF0YTogR3JhcGhEYXRhKTogUHJvbWlzZTxib29sZWFuPiB7XG4gICAgLy9BcHBseWluZyBDdXN0b20gRmlsdGVyXG4gICAgLy9TZXQgR3JhcGhPYmplY3Qgd2l0aCBHcmFwaElkXG4gICAgdGhpcy5jaGFydHNbZ3JhcGhEYXRhLmdyYXBoSWRdID0gZ3JhcGhEYXRhO1xuICAgIHRoaXMuY2hhcnRzW2dyYXBoRGF0YS5ncmFwaElkXS5ncmFwaERhdGEgPSB0aGlzLmNoYXJ0c1tncmFwaERhdGEuZ3JhcGhJZF0uZ3JhcGhEYXRhLmZpbHRlcigoZDogYW55KSA9PiB0aGlzLmFwcGx5Q3VzdG9tRmlsdGVyKGQsIHRoaXMuY2hhcnRzW2dyYXBoRGF0YS5ncmFwaElkXS5maWx0ZXIpKVxuICAgIGlmICh0aGlzLmNoYXJ0c1tncmFwaERhdGEuZ3JhcGhJZF0ucm93c1t0aGlzLmNoYXJ0c1tncmFwaERhdGEuZ3JhcGhJZF0uY3VyckxldmVsXSA9PSAnKioqTEFCRUwqKionKSB7XG4gICAgICAvL0NyZWF0ZSBMYWJlbCBCbG9ja1xuICAgICAgbGV0IHJlc3BvbnNlID0gYXdhaXQgdGhpcy5wdWJsaXNoTGFiZWwoZ3JhcGhEYXRhLmdyYXBoSWQpO1xuICAgICAgLy9EaXNwYXRjaCBhZnRlciBidWlsZCBldmVudFxuICAgICAgcmV0dXJuIHJlc3BvbnNlO1xuICAgIH0gZWxzZSB7XG4gICAgICAvL0NyZWF0ZSBHcmFwaFxuICAgICAgbGV0IHJlc3BvbnNlID0gYXdhaXQgdGhpcy5zdGFydEdyYXBoQnVpbGRlcihncmFwaERhdGEuZ3JhcGhJZCwgdGhpcy5jaGFydHNbZ3JhcGhEYXRhLmdyYXBoSWRdLmN1cnJMZXZlbCwgJycpO1xuICAgICAgLy9EaXNwYXRjaCBhZnRlciBidWlsZCBldmVudFxuICAgICAgcmV0dXJuIHJlc3BvbnNlO1xuICAgIH1cbiAgfVxuXG4gIHByaXZhdGUgYXN5bmMgcHVibGlzaExhYmVsKGdyYXBoSWQ6IHN0cmluZykge1xuICAgIC8vRmx1c2ggQ29udGVudCBvZiBHcmFwaCBEaXZcbiAgICBkb2N1bWVudC5xdWVyeVNlbGVjdG9yKCcjJyArIGdyYXBoSWQpIS5pbm5lckhUTUwgPSAnJztcblxuICAgIC8vQWRkIEN1c3RvbSBWYXJpYWJsZSBpbiBSYXcgRGF0YVxuICAgIGxldCBkYXRhID0gYXdhaXQgdGhpcy5hZGRDdXN0b21WYXJpYWJsZShcbiAgICAgIHRoaXMuY2hhcnRzW2dyYXBoSWRdLmN1c3RvbVZhcmlhYmxlLFxuICAgICAgdGhpcy5jaGFydHNbZ3JhcGhJZF0uZ3JhcGhEYXRhLFxuICAgICAgZmFsc2UsXG4gICAgICB0aGlzLmNoYXJ0c1tncmFwaElkXS5kYXRhRm9ybWF0LFxuICAgICAgZmFsc2VcbiAgICApO1xuXG4gICAgbGV0IGNvbERhdGEgPSB0aGlzLmFwcGx5RGF0YUZpbHRlcihkYXRhLCB0aGlzLmNoYXJ0c1tncmFwaElkXS5maWx0ZXIsIHRoaXMuY2hhcnRzW2dyYXBoSWRdLmNvbHVtbnMsZ3JhcGhJZCk7XG5cbiAgICAvL0xhYmVscyBEYXRhIGNyZWF0aW9uXG4gICAgbGV0IGh0bWxEaXYgPSB0aGlzLmNoYXJ0c1tncmFwaElkXS5jb2x1bW5zLm1hcCgoeSwgeUluZGV4KSA9PiB7XG4gICAgICBsZXQgYWxsRGF0YSA9IGNvbERhdGFbeV0ubWFwKChkOiBhbnkpID0+IGRbeV0pO1xuXG4gICAgICBhbGxEYXRhID0gbG9kYXNoLndpdGhvdXQoYWxsRGF0YSwgJycpO1xuICAgICAgYWxsRGF0YSA9IGxvZGFzaC53aXRob3V0KGFsbERhdGEsIHVuZGVmaW5lZCk7XG4gICAgICByZXR1cm4ge1xuICAgICAgICBsYWJlbDogeSxcbiAgICAgICAgdmFsdWU6XG4gICAgICAgICAgdGhpcy5jaGFydHNbZ3JhcGhJZF0uYWdncmVnYXRpb25GdW5jdGlvbnNbeUluZGV4XVxuICAgICAgICAgICAgLmFnZ3JlZ2F0aW9uRnVuY3Rpb25zID09ICdOTyBGVU5DVElPTidcbiAgICAgICAgICAgID8gbG9kYXNoLm1heChhbGxEYXRhKSAvL0dldHRpbmcgTWF4IFZhbHVlIG9uIE5PIEZ1bmN0aW9uXG4gICAgICAgICAgICA6IHRoaXMuYXBwbHlBZ2dyZWdhdGlvbihcbiAgICAgICAgICAgICAgICBhbGxEYXRhLFxuICAgICAgICAgICAgICAgIHlJbmRleCxcbiAgICAgICAgICAgICAgICB0aGlzLmNoYXJ0c1tncmFwaElkXS5hZ2dyZWdhdGlvbkZ1bmN0aW9uc1xuICAgICAgICAgICAgICApLCAvL0FwcGx5aW5nIEFnZ3JlZ2F0aW9uXG4gICAgICB9O1xuICAgIH0pO1xuXG4gICAgLy9DcmVhdGluZyBMYWJlbCBIdG1sIERVTVBcbiAgICBsZXQgaHRtbCA9IGBcbiAgICA8ZGl2IGNsYXNzPVwiY2FyZFwiIHN0eWxlPVwicGFkZGluZy10b3A6IDMlOyBwYWRkaW5nLWJvdHRvbTogMyU7IHdpZHRoOiBpbmhlcml0O1wiPlxuICAgICR7XG4gICAgICBodG1sRGl2Lmxlbmd0aCA9PSAxXG4gICAgICAgID8gYDxoMyBzdHlsZT1cInRleHQtYWxpZ246IGNlbnRlcjtcIj4ke3RoaXMuY2hhcnRzW2dyYXBoSWRdLmdyYXBoVGl0bGV9PC9oMz5gXG4gICAgICAgIDogYGBcbiAgICB9XG4gICAgPGRpdiBjbGFzcz1cImdyYXBoLWxhYmVsXCIgPlxuICAgICR7aHRtbERpdlxuICAgICAgLm1hcChcbiAgICAgICAgKGQ6IGFueSwgaW5kZXgpID0+IGBcbiAgICAgICAgPGRpdiBjbGFzcz1cImxhYmVsLWl0ZW1cIiAke1xuICAgICAgICAgIHRoaXMuY2hhcnRzW2dyYXBoSWRdLmNvbG9yc1tpbmRleF0gIT0gdW5kZWZpbmVkXG4gICAgICAgICAgICA/IGBzdHlsZT1cImJhY2tncm91bmQtY29sb3I6ICR7dGhpcy5jaGFydHNbZ3JhcGhJZF0uY29sb3JzW2luZGV4XX1cImBcbiAgICAgICAgICAgIDogJydcbiAgICAgICAgfSBpZD1cImNhcmQtZ3JhcGgtJHtncmFwaElkfVwiIGRhdGE9XCIke1xuICAgICAgICAgIHRoaXMuY2hhcnRzW2dyYXBoSWRdLmNvbHVtbnNbaW5kZXhdXG4gICAgICAgIH1cIj5cbiAgICAgICAgICA8aDMgc3R5bGU9XCIke2RhdGEubGVuZ3RoID09IDEgPyAnZm9udC1zaXplOiAxOHB4OycgOiAnJ31cIiBkYXRhPVwiJHtcbiAgICAgICAgICB0aGlzLmNoYXJ0c1tncmFwaElkXS5jb2x1bW5zW2luZGV4XVxuICAgICAgICB9XCI+PGIgZGF0YT1cIiR7dGhpcy5jaGFydHNbZ3JhcGhJZF0uY29sdW1uc1tpbmRleF19XCI+JHtNYXRoLnJvdW5kKFxuICAgICAgICAgIGQudmFsdWVcbiAgICAgICAgKX08L2I+PC9oMz5cbiAgICAgICAgICAke1xuICAgICAgICAgICAgZGF0YS5sZW5ndGggPiAxXG4gICAgICAgICAgICAgID8gYDxoMyBkYXRhPVwiJHt0aGlzLmNoYXJ0c1tncmFwaElkXS5jb2x1bW5zW2luZGV4XX1cIj5gICtcbiAgICAgICAgICAgICAgICBkLmxhYmVsICtcbiAgICAgICAgICAgICAgICAnPC9oMz4nXG4gICAgICAgICAgICAgIDogJydcbiAgICAgICAgICB9XG4gICAgICAgIDwvZGl2PlxuXG4gICAgICAgIGBcbiAgICAgIClcbiAgICAgIC5qb2luKCcnKX1cbiAgICAgICAgPC9kaXY+XG4gICAgPC9kaXY+YDtcblxuICAgIC8vUmVuZGVyaW5nIExhYmVsIEhUTUwgRFVNUCBvdmVyIGRvY3VtZW50XG4gICAgZG9jdW1lbnQucXVlcnlTZWxlY3RvcignIycgKyBncmFwaElkKSEuaW5uZXJIVE1MID0gaHRtbDtcblxuICAgIGxldCBfc2VsZiA9IHRoaXM7XG5cbiAgICAvL0xhYmVsIENsaWNrIGhhbmRsZXJcbiAgICBkb2N1bWVudC5xdWVyeVNlbGVjdG9yQWxsKCcjY2FyZC1ncmFwaC0nICsgZ3JhcGhJZCkuZm9yRWFjaCgoY2FyZCkgPT5cbiAgICAgIGNhcmQuYWRkRXZlbnRMaXN0ZW5lcignY2xpY2snLCBmdW5jdGlvbiAoZTogYW55KSB7XG4gICAgICAgIGlmIChfc2VsZi5jaGFydHNbZ3JhcGhJZF0ucm93cy5sZW5ndGggPT0gMSkge1xuICAgICAgICAgIC8vUmVuZGVyaW5nIExhc3QgbGV2ZWwgQ29tcG9uZW50XG4gICAgICAgICAgX3NlbGYubW9kYWxEYXRhID0ge1xuICAgICAgICAgICAgY29sVG9WaWV3OiBfc2VsZi5jaGFydHNbZ3JhcGhJZF0ubGFzdExldmVsQ29sdW1ucyxcbiAgICAgICAgICAgIHJlZkRhdGE6IF9zZWxmLmNoYXJ0c1tncmFwaElkXS5ncmFwaERhdGEsXG4gICAgICAgICAgfTtcbiAgICAgICAgICBsZXQgbW9kYWxPcHRpb25zOiBhbnkgPSB7XG4gICAgICAgICAgICBwYW5lbENsYXNzOiAnZGF0YVBvcHVwLW1vZGFsJyxcbiAgICAgICAgICAgIGJhY2tkcm9wQ2xhc3M6ICdtb2RhbC1iYWNrZHJvcCcsXG4gICAgICAgICAgfTtcbiAgICAgICAgICBfc2VsZi5kaWFsb2cub3BlbihEYXRhUG9wdXBDb21wb25lbnQsIG1vZGFsT3B0aW9ucyk7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgX3NlbGYuY2hhcnRzW2dyYXBoSWRdLmN1cnJMZXZlbCArPSAxO1xuICAgICAgICAgIF9zZWxmLmNoYXJ0c1tncmFwaElkXS5wcmV2TGV2ZWxEYXRhLnB1c2goX3NlbGYuY2hhcnRzW2dyYXBoSWRdLmdyYXBoRGF0YSk7XG4gICAgICAgICAgX3NlbGYuY2hhcnRzW2dyYXBoSWRdLmJyZWFkQ3J1bWIucHVzaChlLnRhcmdldC5nZXRBdHRyaWJ1dGUoJ2RhdGEnKSk7XG5cbiAgICAgICAgICAvL0ZsdXNoIExhYmVsIENvbnRlbnQgZnJvbSBkb2N1bWVudFxuICAgICAgICAgIGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3IoJyMnICsgZ3JhcGhJZCkhLmlubmVySFRNTCA9ICcnO1xuXG4gICAgICAgICAgLy9HZW5lcmF0aW5nIENoaWxkIEdyYXBoIG9mIExhYmVsXG4gICAgICAgICAgX3NlbGYuc3RhcnRHcmFwaEJ1aWxkZXIoZ3JhcGhJZCwgMSwgZS50YXJnZXQuZ2V0QXR0cmlidXRlKCdkYXRhJykpO1xuICAgICAgICB9XG4gICAgICB9KVxuICAgICk7XG4gICAgcmV0dXJuIHRydWU7XG4gIH1cblxuXG4gIHByaXZhdGUgYXBwbHlEYXRhRmlsdGVyKGRhdGE6IGFueSwgZmlsdGVyOiBGaWx0ZXJzLCBjb2x1bW5zOiBhbnkgLCBncmFwaElkOiBhbnkpe1xuICAgIGNvbnN0IHlGaWx0ZXIgPSBmaWx0ZXIueVByZUF4aXM7XG4gICAgbGV0IGNvbERhdGEgOiBhbnkgPSB7fTtcbiAgICBsb2Rhc2guZm9yRWFjaChkYXRhLCAoZCkgPT4ge1xuICAgICAgY29sdW1ucy5mb3JFYWNoKChjb2w6IHN0cmluZykgPT4ge1xuICAgICAgICBjb25zdCBmaWx0ZXJUb0FwcGx5ID0geUZpbHRlci5maWx0ZXIoeSA9PiB5LnZhcmlhYmxlTmFtZSA9PSBjb2wpO1xuICAgICAgICBsZXQgaXNWYWxpZCA9IHlGaWx0ZXIubGVuZ3RoID09IDA7XG4gICAgICAgIGlmKHlGaWx0ZXIubGVuZ3RoID4gMCl7XG4gICAgICAgICAgbGV0IHZhbHVlcyA9IGZpbHRlclRvQXBwbHlbMF0udmFsdWVzO1xuICAgICAgICAgIGxldCBkYXRhVmFsdWUgPSBkW2ZpbHRlclRvQXBwbHlbMF0udmFyaWFibGVOYW1lXTtcbiAgICAgICAgICBsZXQgdmFyaWFibGVUeXBlID0gZmlsdGVyVG9BcHBseVswXS52YXJpYWJsZVR5cGU7XG4gICAgICAgICAgc3dpdGNoKGZpbHRlclRvQXBwbHlbMF0uZmlsdGVyVHlwZSl7XG4gICAgICAgICAgICAgIGNhc2UgRmlsdGVyVHlwZXMuR1JFQVRFUl9USEFOOlxuICAgICAgICAgICAgICAgIGlmIChkYXRhVmFsdWUgPiB2YWx1ZXNbMF0pIHtcbiAgICAgICAgICAgICAgICAgIGlzVmFsaWQgPSB0cnVlO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgICAgY2FzZSBGaWx0ZXJUeXBlcy5MRVNTX1RIQU46XG4gICAgICAgICAgICAgICAgaWYgKGRhdGFWYWx1ZSA8IHZhbHVlc1swXSkge1xuICAgICAgICAgICAgICAgICAgaXNWYWxpZCA9IHRydWU7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgICBjYXNlIEZpbHRlclR5cGVzLkxFU1NfVEhBTl9FUVVBTDpcbiAgICAgICAgICAgICAgICBpZiAoZGF0YVZhbHVlIDw9IHZhbHVlc1swXSkge1xuICAgICAgICAgICAgICAgICAgaXNWYWxpZCA9IHRydWU7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgICBjYXNlIEZpbHRlclR5cGVzLkdSRUFURVJfVEhBTl9FUVVBTDpcbiAgICAgICAgICAgICAgICBpZiAoZGF0YVZhbHVlID49IHZhbHVlc1swXSkge1xuICAgICAgICAgICAgICAgICAgaXNWYWxpZCA9IHRydWU7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgICBjYXNlIEZpbHRlclR5cGVzLkVRVUFMOlxuICAgICAgICAgICAgICAgIGlmIChkYXRhVmFsdWUgPT0gdmFsdWVzWzBdKSB7XG4gICAgICAgICAgICAgICAgICBpc1ZhbGlkID0gdHJ1ZTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICAgIGNhc2UgRmlsdGVyVHlwZXMuTk9UX0VRVUFMOlxuICAgICAgICAgICAgICAgIGlmIChkYXRhVmFsdWUgIT0gdmFsdWVzWzBdKSB7XG4gICAgICAgICAgICAgICAgICBpc1ZhbGlkID0gdHJ1ZTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICAgIGNhc2UgRmlsdGVyVHlwZXMuQkVUV0VFTl9SQU5HRTpcbiAgICAgICAgICAgICAgICBpZiAoZGF0YVZhbHVlID49IHZhbHVlc1swXSAmJiBkYXRhVmFsdWUgPCB2YWx1ZXNbMV0pIHtcbiAgICAgICAgICAgICAgICAgIGlzVmFsaWQgPSB0cnVlO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgICAgY2FzZSBGaWx0ZXJUeXBlcy5CRUZPUkU6XG4gICAgICAgICAgICAgICAgaWYgKHZhcmlhYmxlVHlwZSA9PSBEYXRhVHlwZS5EQVRFKSB7XG4gICAgICAgICAgICAgICAgICBsZXQgb3BlcmFuZDEgPSB0aGlzLmdldEZvcm1hdHRlZERhdGUoXG4gICAgICAgICAgICAgICAgICAgIGRhdGFWYWx1ZSxcbiAgICAgICAgICAgICAgICAgICAgZmlsdGVyVG9BcHBseVswXS5mb3JtYXRcbiAgICAgICAgICAgICAgICAgICk7XG4gICAgICAgICAgICAgICAgICBsZXQgb3BlcmFuZDIgPSBuZXcgRGF0ZSh2YWx1ZXNbMF0pO1xuICAgICAgICAgICAgICAgICAgaWYgKG9wZXJhbmQxIDwgb3BlcmFuZDIpIHtcbiAgICAgICAgICAgICAgICAgICAgaXNWYWxpZCA9IHRydWU7XG4gICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICAgIGxldCBjdXJyU2Vjb25kcyA9IHRoaXMuZ2V0Rm9ybWF0dGVkRGF0ZShcbiAgICAgICAgICAgICAgICAgICAgZGF0YVZhbHVlLFxuICAgICAgICAgICAgICAgICAgICBmaWx0ZXJUb0FwcGx5WzBdLmZvcm1hdFxuICAgICAgICAgICAgICAgICAgKTtcbiAgICAgICAgICAgICAgICAgIGxldCBbaG91ciwgbWluXSA9IHZhbHVlc1swXVxuICAgICAgICAgICAgICAgICAgICAuc3BsaXQoJzonKVxuICAgICAgICAgICAgICAgICAgICAubWFwKChlbDogYW55KSA9PiBwYXJzZUludChlbCkpO1xuICAgICAgICAgICAgICAgICAgbGV0IGNvbXBhcmVkU2VjID0gaG91ciAqIDYwICogNjAgKyBtaW4gKiA2MDtcbiAgICAgICAgICAgICAgICAgIGlmIChjdXJyU2Vjb25kcyA8IGNvbXBhcmVkU2VjKSB7XG4gICAgICAgICAgICAgICAgICAgIGlzVmFsaWQgPSB0cnVlO1xuICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgICAgY2FzZSBGaWx0ZXJUeXBlcy5BRlRFUjpcbiAgICAgICAgICAgICAgICBpZiAodmFyaWFibGVUeXBlID09IERhdGFUeXBlLkRBVEUpIHtcbiAgICAgICAgICAgICAgICAgIGxldCBvcGVyYW5kMSA9IHRoaXMuZ2V0Rm9ybWF0dGVkRGF0ZShcbiAgICAgICAgICAgICAgICAgICAgZGF0YVZhbHVlLFxuICAgICAgICAgICAgICAgICAgICBmaWx0ZXJUb0FwcGx5WzBdLmZvcm1hdFxuICAgICAgICAgICAgICAgICAgKTtcbiAgICAgICAgICAgICAgICAgIGxldCBvcGVyYW5kMiA9IG5ldyBEYXRlKHZhbHVlc1swXSk7XG4gICAgICAgICAgICAgICAgICBpZiAob3BlcmFuZDEgPiBvcGVyYW5kMikge1xuICAgICAgICAgICAgICAgICAgICBpc1ZhbGlkID0gdHJ1ZTtcbiAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgICAgbGV0IGN1cnJTZWNvbmRzID0gdGhpcy5nZXRGb3JtYXR0ZWREYXRlKFxuICAgICAgICAgICAgICAgICAgICBkYXRhVmFsdWUsXG4gICAgICAgICAgICAgICAgICAgIGZpbHRlclRvQXBwbHlbMF0uZm9ybWF0XG4gICAgICAgICAgICAgICAgICApO1xuICAgICAgICAgICAgICAgICAgbGV0IFtob3VyLCBtaW5dID0gdmFsdWVzWzBdXG4gICAgICAgICAgICAgICAgICAgIC5zcGxpdCgnOicpXG4gICAgICAgICAgICAgICAgICAgIC5tYXAoKGVsOiBhbnkpID0+IHBhcnNlSW50KGVsKSk7XG4gICAgICAgICAgICAgICAgICBsZXQgY29tcGFyZWRTZWMgPSBob3VyICogNjAgKiA2MCArIG1pbiAqIDYwO1xuICAgICAgICAgICAgICAgICAgaWYgKGN1cnJTZWNvbmRzID4gY29tcGFyZWRTZWMpIHtcbiAgICAgICAgICAgICAgICAgICAgaXNWYWxpZCA9IHRydWU7XG4gICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgICBjYXNlIEZpbHRlclR5cGVzLkJFVFdFRU46XG4gICAgICAgICAgICAgICAgaWYgKHZhcmlhYmxlVHlwZSA9PSBEYXRhVHlwZS5EQVRFKSB7XG4gICAgICAgICAgICAgICAgICBsZXQgb3BlcmFuZDEgPSB0aGlzLmdldEZvcm1hdHRlZERhdGUoXG4gICAgICAgICAgICAgICAgICAgIGRhdGFWYWx1ZSxcbiAgICAgICAgICAgICAgICAgICAgZmlsdGVyVG9BcHBseVswXS5mb3JtYXRcbiAgICAgICAgICAgICAgICAgICk7XG4gICAgICAgICAgICAgICAgICBsZXQgb3BlcmFuZDIgPSBuZXcgRGF0ZSh2YWx1ZXNbMF0pO1xuICAgICAgICAgICAgICAgICAgbGV0IG9wZXJhbmQzID0gbmV3IERhdGUodmFsdWVzWzFdKTtcbiAgICAgICAgICAgICAgICAgIGlmIChvcGVyYW5kMSA+PSBvcGVyYW5kMiAmJiBvcGVyYW5kMSA8IG9wZXJhbmQzKSB7XG4gICAgICAgICAgICAgICAgICAgIGlzVmFsaWQgPSB0cnVlO1xuICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgICBsZXQgY3VyclNlY29uZHMgPSB0aGlzLmdldEZvcm1hdHRlZERhdGUoXG4gICAgICAgICAgICAgICAgICAgIGRhdGFWYWx1ZSxcbiAgICAgICAgICAgICAgICAgICAgZmlsdGVyVG9BcHBseVswXS5mb3JtYXRcbiAgICAgICAgICAgICAgICAgICk7XG4gICAgICAgICAgICAgICAgICBsZXQgW2hvdXIsIG1pbl0gPSB2YWx1ZXNbMF1cbiAgICAgICAgICAgICAgICAgICAgLnNwbGl0KCc6JylcbiAgICAgICAgICAgICAgICAgICAgLm1hcCgoZWw6IGFueSkgPT4gcGFyc2VJbnQoZWwpKTtcbiAgICAgICAgICAgICAgICAgIGxldCBbZW5kaG91ciwgZW5kbWluXSA9IHZhbHVlc1sxXVxuICAgICAgICAgICAgICAgICAgLnNwbGl0KCc6JylcbiAgICAgICAgICAgICAgICAgIC5tYXAoKGVsOiBhbnkpID0+IHBhcnNlSW50KGVsKSk7XG4gICAgICAgICAgICAgICAgICBsZXQgY29tcGFyZWRTZWMgPSBob3VyICogNjAgKiA2MCArIG1pbiAqIDYwO1xuICAgICAgICAgICAgICAgICAgbGV0IGVuZENvbXBhcmVkU2VjID0gZW5kaG91ciAqIDYwICogNjAgKyBlbmRtaW4gKiA2MDtcbiAgICAgICAgICAgICAgICAgIGlmICggY3VyclNlY29uZHMgPj0gY29tcGFyZWRTZWMgJiZcbiAgICAgICAgICAgICAgICAgICAgY3VyclNlY29uZHMgPCBlbmRDb21wYXJlZFNlYykge1xuICAgICAgICAgICAgICAgICAgICBpc1ZhbGlkID0gdHJ1ZTtcbiAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICAgIGNhc2UgRmlsdGVyVHlwZXMuSU46XG4gICAgICAgICAgICAgICAgaWYgKFxuICAgICAgICAgICAgICAgICAgdmFsdWVzLmluZGV4T2YoZGF0YVZhbHVlLnRvU3RyaW5nKClcbiAgICAgICAgICAgICAgICAgICkgIT0gLTFcbiAgICAgICAgICAgICAgICApIHtcbiAgICAgICAgICAgICAgICAgIGlzVmFsaWQgPSB0cnVlO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgICAgY2FzZSBGaWx0ZXJUeXBlcy5OT1RfSU46XG4gICAgICAgICAgICAgICAgaWYgKFxuICAgICAgICAgICAgICAgICAgXG4gICAgICAgICAgICAgICAgICB2YWx1ZXMuaW5kZXhPZihkYXRhVmFsdWUudG9TdHJpbmcoKSkgPT0gLTFcbiAgICAgICAgICAgICAgICApIHtcbiAgICAgICAgICAgICAgICAgIGlzVmFsaWQgPSB0cnVlO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgICAgLy8gaWYoaXNWYWxpZCAmJiBmaWx0ZXIuY3VzdG9tRmlsdGVyLmxlbmd0aCA+IDApe1xuICAgICAgICAvLyAgIGlzVmFsaWQgPSB0aGlzLmFwcGx5Q3VzdG9tRmlsdGVyKGQsIGZpbHRlcik7XG4gICAgICAgIC8vIH1cbiAgICAgICAgaWYoaXNWYWxpZCl7XG4gICAgICAgICAgaWYoY29sRGF0YS5oYXNPd25Qcm9wZXJ0eShjb2wpKXtcbiAgICAgICAgICAgIGNvbERhdGFbY29sXS5wdXNoKGQpO1xuICAgICAgICAgIH1lbHNle1xuICAgICAgICAgICAgY29sRGF0YVtjb2xdID0gW2RdO1xuICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgfSlcbiAgICB9KVxuICAgIHJldHVybiBjb2xEYXRhO1xuICB9XG5cbiAgcHJpdmF0ZSBhc3luYyBzdGFydEdyYXBoQnVpbGRlcihcbiAgICBncmFwaElkOiBzdHJpbmcsXG4gICAgY3VyckxldmVsOiBudW1iZXIsXG4gICAgY29sVG9TaG93OiBzdHJpbmdcbiAgKSB7XG4gICAgLy9BZGQgQ3VzdG9tIFNsYWJzIGluIFJhdyBEYXRhXG4gICAgbGV0IGRhdGEgPSBhd2FpdCB0aGlzLmFkZEN1c3RvbVZhcmlhYmxlKFxuICAgICAgdGhpcy5jaGFydHNbZ3JhcGhJZF0uY3VzdG9tVmFyaWFibGUsXG4gICAgICB0aGlzLmNoYXJ0c1tncmFwaElkXS5ncmFwaERhdGEsXG4gICAgICB0cnVlLFxuICAgICAgdGhpcy5jaGFydHNbZ3JhcGhJZF0uZGF0YUZvcm1hdCxcbiAgICAgIHRydWVcbiAgICApO1xuXG4gICAgdGhpcy5jaGFydHNbZ3JhcGhJZF0uZ3JhcGhEYXRhID0gbG9kYXNoLmdyb3VwQnkoXG4gICAgICBkYXRhLFxuICAgICAgdGhpcy5jaGFydHNbZ3JhcGhJZF0ucm93c1tjdXJyTGV2ZWxdXG4gICAgKTtcbiAgICB0aGlzLmNoYXJ0c1tncmFwaElkXS5jdXJyTGV2ZWwgPSBjdXJyTGV2ZWw7XG4gICAgLy8gdGhpcy5jaGFydHNbZ3JhcGhJZF0ucHJldkxldmVsRGF0YSA9IGN1cnJMZXZlbCA9PSAwID8gW10gOiBbZGF0YV07XG4gICAgdGhpcy5jaGFydHNbZ3JhcGhJZF0uY29sVG9TaG93ID0gY29sVG9TaG93O1xuXG4gICAgLy9DcmVhdGluZyBDaGFydCBSYXcgSnNvblxuICAgIGxldCBjaGFydE9wdGlvbnM6IGFueSA9IHRoaXMuY3JlYXRlQ2hhcnREYXRhKGdyYXBoSWQsIGN1cnJMZXZlbCk7XG5cbiAgICAvL1JlbmRlcmluZyBDaGFydCBvZiBHcmFwaElkXG4gICAgdGhpcy5oaWdoY2hhcnRzLmNoYXJ0KHRoaXMuY2hhcnRzW2dyYXBoSWRdLmdyYXBoSWQsIGNoYXJ0T3B0aW9ucyk7XG5cbiAgICAvL0FkZCBBY3Rpb24gQnV0dG9ucyBPdmVyIENoYXJ0XG4gICAgdGhpcy5hZGRBY3Rpb25CdG4oZ3JhcGhJZCk7XG5cbiAgICByZXR1cm4gdHJ1ZTtcbiAgfVxuXG4gIHByaXZhdGUgZ2V0UGxvdE9wdGlvbnMoZ3JhcGhJZDogc3RyaW5nLCBjdXJyTGV2ZWw6IG51bWJlcikge1xuICAgIGxldCBwbG90T3B0aW9uczogYW55ID0ge1xuICAgICAgc2VyaWVzOiB7XG4gICAgICAgIHR1cmJvVGhyZXNob2xkOiAxMDAwMDAwLFxuICAgICAgICBkYXRhTGFiZWxzOiB7XG4gICAgICAgICAgY29sb3I6ICdibGFjaycsXG4gICAgICAgICAgZW5hYmxlZDogdHJ1ZSxcbiAgICAgICAgICBzdHlsZToge1xuICAgICAgICAgICAgY29sb3I6ICdibGFjaycsXG4gICAgICAgICAgICB0ZXh0U2hhZG93OiBmYWxzZSxcbiAgICAgICAgICAgIHRleHREZWNvcmF0aW9uOiAnbm9uZScsXG4gICAgICAgICAgfSxcbiAgICAgICAgfSxcbiAgICAgICAgbGFiZWw6IHtcbiAgICAgICAgICBzdHlsZToge1xuICAgICAgICAgICAgY29sb3I6ICdibGFjaycsXG4gICAgICAgICAgfSxcbiAgICAgICAgfSxcbiAgICAgIH0sXG4gICAgfTtcblxuICAgIC8vT3B0aW9ucyBmb3IgU3RhY2sgR3JhcGhcbiAgICBpZiAoXG4gICAgICB0aGlzLmNoYXJ0c1tncmFwaElkXS5ncmFwaFR5cGVzW2N1cnJMZXZlbF0gPT0gR3JhcGhUeXBlcy5TVEFDS0VEX0JBUiB8fFxuICAgICAgdGhpcy5jaGFydHNbZ3JhcGhJZF0uZ3JhcGhUeXBlc1tjdXJyTGV2ZWxdID09IEdyYXBoVHlwZXMuU1RBQ0tFRF9DT0xVTU5cbiAgICApIHtcbiAgICAgIHBsb3RPcHRpb25zLnNlcmllc1snc3RhY2tpbmcnXSA9ICdub3JtYWwnOyAvL05vcm1hbCBTdGFja2luZyBvZiB5LWF4aXNcbiAgICB9IGVsc2UgaWYgKFxuICAgICAgdGhpcy5jaGFydHNbZ3JhcGhJZF0uZ3JhcGhUeXBlc1tjdXJyTGV2ZWxdID09XG4gICAgICAgIEdyYXBoVHlwZXMuU1RBQ0tFRF9CQVJfUEVSQ0VOVEFHRSB8fFxuICAgICAgdGhpcy5jaGFydHNbZ3JhcGhJZF0uZ3JhcGhUeXBlc1tjdXJyTGV2ZWxdID09XG4gICAgICAgIEdyYXBoVHlwZXMuU1RBQ0tFRF9DT0xVTU5fUEVSQ0VOVEFHRVxuICAgICkge1xuICAgICAgcGxvdE9wdGlvbnMuc2VyaWVzWydzdGFja2luZyddID0gJ3BlcmNlbnQnOyAvL1N0YWNraW5nIG9mIHktYXhpcyBvbiBiYXNpcyBvZiBwZXJjZW50YWdlXG4gICAgICAvL0FkZCBQZXJjZW50IFNpZ24gYWZ0ZXIgeS1heGlzIHZhbHVlc1xuICAgICAgcGxvdE9wdGlvbnMuc2VyaWVzLmRhdGFMYWJlbHNbJ2Zvcm1hdHRlciddID0gZnVuY3Rpb24gKCkge1xuICAgICAgICByZXR1cm4gdGhpcy5wZXJjZW50YWdlLnRvRml4ZWQoMikgKyAnICUnO1xuICAgICAgfTtcbiAgICB9XG4gICAgcmV0dXJuIHBsb3RPcHRpb25zO1xuICB9XG5cbiAgcHJpdmF0ZSBjcmVhdGVDaGFydERhdGEoZ3JhcGhJZDogc3RyaW5nLCBjdXJyTGV2ZWw6IG51bWJlcikge1xuICAgIGxldCBfc2VsZiA9IHRoaXM7XG5cbiAgICAvL0dldHRpbmcgUGxvdCBPcHRpb25zIGZvciBHcmFwaFxuICAgIGxldCBwbG90T3B0aW9ucyA9IHRoaXMuZ2V0UGxvdE9wdGlvbnMoZ3JhcGhJZCwgY3VyckxldmVsKTtcblxuICAgIHJldHVybiB7XG4gICAgICBjcmVkaXRzOiB7XG4gICAgICAgIHRleHQ6IHRoaXMuY3JlZGl0VGl0bGUsXG4gICAgICAgIGhyZWY6IHRoaXMuY3JlZGl0VXJsLFxuICAgICAgICBzdHlsZToge1xuICAgICAgICAgIGZvbnRTaXplOiAnMTJweCcsXG4gICAgICAgIH0sXG4gICAgICB9LFxuICAgICAgdGl0bGU6IG51bGwsXG4gICAgICBwbG90T3B0aW9uczogcGxvdE9wdGlvbnMsXG4gICAgICBjaGFydDoge1xuICAgICAgICBldmVudHM6IHtcbiAgICAgICAgICAvL0hhbmRsZSBEcmlsbGRvd24gRXZlbnQgb2YgR3JhcGhcbiAgICAgICAgICBkcmlsbGRvd246IGZ1bmN0aW9uIChlOiBhbnkpIHtcbiAgICAgICAgICAgIGlmKGUucG9pbnRzICE9IGZhbHNlKSByZXR1cm5cbiAgICAgICAgICAgIGxldCBjdXJyR3JhcGhJZCA9IGUucG9pbnQub3B0aW9ucy5ncmFwaElkOyAvL0dyYXBoSWRcbiAgICAgICAgICAgIGxldCBjb2xJZCA9IGUucG9pbnQuY29sSW5kZXg7IC8vQ29sb3JJbmRleCBvZiBiYXJcbiAgICAgICAgICAgIC8vSW5jcmVhc2luZyBHcmFwaCBEcmlsbGRvd24gbGV2ZWxcbiAgICAgICAgICAgIF9zZWxmLmNoYXJ0c1tjdXJyR3JhcGhJZF0uY3VyckxldmVsICs9IDE7XG4gICAgICAgICAgICBfc2VsZi5jaGFydHNbY3VyckdyYXBoSWRdLmJyZWFkQ3J1bWIucHVzaChlLnBvaW50Lm5hbWUpO1xuICAgICAgICAgICAgX3NlbGYuY2hhcnRzW2N1cnJHcmFwaElkXS5zZWxLZXlzPy5wdXNoKGUucG9pbnQubmFtZSk7XG5cbiAgICAgICAgICAgIC8vT3BlbiBMYXN0IExldmVsIENvbXBvbmVudFxuICAgICAgICAgICAgaWYgKFxuICAgICAgICAgICAgICBfc2VsZi5jaGFydHNbY3VyckdyYXBoSWRdLnJvd3NbXG4gICAgICAgICAgICAgICAgX3NlbGYuY2hhcnRzW2N1cnJHcmFwaElkXS5jdXJyTGV2ZWxcbiAgICAgICAgICAgICAgXSA9PSBudWxsXG4gICAgICAgICAgICApIHtcbiAgICAgICAgICAgICAgbGV0IGFnZ05hbWUgPSBfc2VsZi5jaGFydHNbY3VyckdyYXBoSWRdLmFnZ3JlZ2F0aW9uRnVuY3Rpb25zW2NvbElkXS5hZ2dyZWdhdGlvbkZ1bmN0aW9ucztcbiAgICAgICAgICAgICAgbGV0IHRlbXBEYXRhID0gbG9kYXNoLmNsb25lRGVlcChfc2VsZi5jaGFydHNbY3VyckdyYXBoSWRdLmdyYXBoRGF0YVtlLnBvaW50Lm5hbWVdKTtcbiAgICAgICAgICAgICAgaWYoYWdnTmFtZSA9PSBcIk5PIEZVTkNUSU9OXCIpe1xuICAgICAgICAgICAgICAgIHRlbXBEYXRhID0gdGVtcERhdGEuZmlsdGVyKChkIDogYW55KSA9PiBkW19zZWxmLmNoYXJ0c1tjdXJyR3JhcGhJZF0uY29sdW1uc1tjb2xJZF1dID4gMCk7XG4gICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgX3NlbGYuZGF0YVNlcnZpY2Uuc2V0TW9kYWxEYXRhKHtcbiAgICAgICAgICAgICAgICBjb2xUb1ZpZXc6IF9zZWxmLmNoYXJ0c1tjdXJyR3JhcGhJZF0ubGFzdExldmVsQ29sdW1ucyxcbiAgICAgICAgICAgICAgICByZWZEYXRhOiB0ZW1wRGF0YSxcbiAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICAgIGxldCBtb2RhbE9wdGlvbnMgPSB7XG4gICAgICAgICAgICAgICAgcGFuZWxDbGFzczogJ2RhdGFQb3B1cC1tb2RhbCcsXG4gICAgICAgICAgICAgICAgYmFja2Ryb3BDbGFzczogJ21vZGFsLWJhY2tkcm9wJyxcbiAgICAgICAgICAgICAgfTtcbiAgICAgICAgICAgICAgX3NlbGYuZGlhbG9nLm9wZW4oRGF0YVBvcHVwQ29tcG9uZW50LCBtb2RhbE9wdGlvbnMpO1xuICAgICAgICAgICAgICAvL1JlZHVjaW5nIEdyYXBoIERyaWxsZG93biBMZXZlbFxuICAgICAgICAgICAgICBfc2VsZi5jaGFydHNbY3VyckdyYXBoSWRdLmN1cnJMZXZlbCAtPSAxO1xuICAgICAgICAgICAgICByZXR1cm47XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIC8vU3RvcmluZyBQcmV2aW91cyBTbmFwc2hvdCBvZiBEYXRhIHRvIHJlc3RvcmUgZ3JhcGggb24gYmFja1xuICAgICAgICAgICAgX3NlbGYuY2hhcnRzW2N1cnJHcmFwaElkXS5wcmV2TGV2ZWxEYXRhLnB1c2goXG4gICAgICAgICAgICAgIChbXSBhcyBhbnlbXSkuY29uY2F0KC4uLk9iamVjdC52YWx1ZXMoX3NlbGYuY2hhcnRzW2N1cnJHcmFwaElkXS5ncmFwaERhdGEpKVxuICAgICAgICAgICAgKTtcblxuICAgICAgICAgICAgLy9Hcm91cCBEYXRhIGFjY29yZGluZyB0byBuZXh0IGRyaWxsZG93biBmaWVsZFxuICAgICAgICAgICAgX3NlbGYuY2hhcnRzW2N1cnJHcmFwaElkXS5ncmFwaERhdGEgPSBsb2Rhc2guZ3JvdXBCeShcbiAgICAgICAgICAgICAgX3NlbGYuY2hhcnRzW2N1cnJHcmFwaElkXS5ncmFwaERhdGFbZS5wb2ludC5uYW1lXSxcbiAgICAgICAgICAgICAgX3NlbGYuY2hhcnRzW2N1cnJHcmFwaElkXS5yb3dzW1xuICAgICAgICAgICAgICAgIF9zZWxmLmNoYXJ0c1tjdXJyR3JhcGhJZF0uY3VyckxldmVsXG4gICAgICAgICAgICAgIF1cbiAgICAgICAgICAgICk7XG4gICAgICAgICAgICBsZXQgY2hhcnQ6IGFueSA9IHRoaXM7XG5cbiAgICAgICAgICAgIF9zZWxmLm1hbmFnZUJyZWFkQ3J1bWIoY3VyckdyYXBoSWQsIF9zZWxmKTtcbiAgICAgICAgICAgIFxuICAgICAgICAgICAgLy9HZXR0aW5nIGRyaWxsZG93biBzZXJpZXMgZGF0YVxuICAgICAgICAgICAgbGV0IHNlcmllcyA9IF9zZWxmLmdldERyaWxsRG93bkRhdGEoXG4gICAgICAgICAgICAgIGUucG9pbnQubmFtZSxcbiAgICAgICAgICAgICAgX3NlbGYuY2hhcnRzW2N1cnJHcmFwaElkXS5ncmFwaERhdGEsXG4gICAgICAgICAgICAgIGN1cnJHcmFwaElkLFxuICAgICAgICAgICAgICBjb2xJZFxuICAgICAgICAgICAgKTtcblxuICAgICAgICAgICAgLy9TaG93IExvYWRpbmcgaW4gQ2hhcnRcbiAgICAgICAgICAgIGNoYXJ0LnNob3dMb2FkaW5nKCdMb2FkaW5nLi4uJyk7XG4gICAgICAgICAgICAvLyBpZiAoXG4gICAgICAgICAgICAvLyAgIF9zZWxmLmNoYXJ0c1tjdXJyR3JhcGhJZF0uZ3JhcGhUeXBlc1swXSA9PVxuICAgICAgICAgICAgLy8gICAgIEdyYXBoVHlwZXMuU1RBQ0tFRF9CQVJfUEVSQ0VOVEFHRSB8fFxuICAgICAgICAgICAgLy8gICBfc2VsZi5jaGFydHNbY3VyckdyYXBoSWRdLmdyYXBoVHlwZXNbMF0gPT1cbiAgICAgICAgICAgIC8vICAgICBHcmFwaFR5cGVzLlNUQUNLRURfQ09MVU1OX1BFUkNFTlRBR0VcbiAgICAgICAgICAgIC8vICkge1xuICAgICAgICAgICAgLy8gICBwbG90T3B0aW9ucy5zZXJpZXNbJ3N0YWNraW5nJ10gPSAnbm9ybWFsJztcbiAgICAgICAgICAgIC8vICAgcGxvdE9wdGlvbnMuc2VyaWVzLmRhdGFMYWJlbHNbJ2Zvcm1hdHRlciddID0gZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgLy8gICAgIHJldHVybiB0aGlzLnk7XG4gICAgICAgICAgICAvLyAgIH07XG4gICAgICAgICAgICAvLyAgIGNoYXJ0LnVwZGF0ZSh7XG4gICAgICAgICAgICAvLyAgICAgcGxvdE9wdGlvbnM6IHBsb3RPcHRpb25zLFxuICAgICAgICAgICAgLy8gICB9KTtcbiAgICAgICAgICAgIC8vIH1cblxuICAgICAgICAgICAgc2V0VGltZW91dCgoKSA9PiB7XG4gICAgICAgICAgICAgIC8vSGlkZSBMb2FkaW5nIGluIGNoYXJ0XG4gICAgICAgICAgICAgIGNoYXJ0LmhpZGVMb2FkaW5nKCk7XG4gICAgICAgICAgICAgIC8vQWRkIERyaWxsZG93biBTZXJpZXMgRGF0YSBhcyBNYWluIFNlcmllc1xuICAgICAgICAgICAgICBjaGFydC51cGRhdGUoe1xuICAgICAgICAgICAgICAgIHBsb3RPcHRpb25zOiBwbG90T3B0aW9ucyxcbiAgICAgICAgICAgICAgICB4QXhpczoge1xuICAgICAgICAgICAgICAgICAgdHlwZTogJ2NhdGVnb3J5JyxcbiAgICAgICAgICAgICAgICAgIGxhYmVsczoge1xuICAgICAgICAgICAgICAgICAgICBzdHlsZToge1xuICAgICAgICAgICAgICAgICAgICAgIGNvbG9yOiAncmVkJyxcbiAgICAgICAgICAgICAgICAgICAgICB0ZXh0RGVjb3JhdGlvbjogJ25vbmUnLFxuICAgICAgICAgICAgICAgICAgICAgIHRleHRPdXRsaW5lOiAnMHB4JyxcbiAgICAgICAgICAgICAgICAgICAgfSxcbiAgICAgICAgICAgICAgICAgIH0sXG4gICAgICAgICAgICAgICAgICBtaW46IDAsXG4gICAgICAgICAgICAgICAgICBtYXg6IDYsXG4gICAgICAgICAgICAgICAgICBhbGxvd0RlY2ltYWxzOiBmYWxzZSxcbiAgICAgICAgICAgICAgICAgIHNjcm9sbGJhcjoge1xuICAgICAgICAgICAgICAgICAgICBlbmFibGVkOiB0cnVlLFxuICAgICAgICAgICAgICAgICAgfSxcbiAgICAgICAgICAgICAgICB9LFxuICAgICAgICAgICAgICAgIHNlcmllczogc2VyaWVzXG4gICAgICAgICAgICAgIH0pXG4gICAgICAgICAgICAgIC8vIGNoYXJ0LmFkZFNlcmllc0FzRHJpbGxkb3duKGUucG9pbnQsIHNlcmllcyk7XG4gICAgICAgICAgICB9LCAxMDAwKTtcbiAgICAgICAgICB9LFxuICAgICAgICAgIC8vSGFuZGxlIERyaWxsVXAgRXZlbnRcbiAgICAgICAgICBkcmlsbHVwOiBhc3luYyBmdW5jdGlvbiAoZTogYW55KSB7XG4gICAgICAgICAgICAvLyBsZXQgY3VyckdyYXBoSWQgPSBlLnNlcmllc09wdGlvbnMuZ3JhcGhJZDsgLy9HcmFwaElkXG4gICAgICAgICAgICAvLyBsZXQgbGV2ZWwgPSBlLnNlcmllc09wdGlvbnMubGV2ZWw7IC8vQ3VycmVudCBMZXZlbCBvZiBEcmlsbGRvd25cbiAgICAgICAgICAgIC8vIGxldCBjaGFydDogYW55ID0gdGhpcztcbiAgICAgICAgICAgIC8vIF9zZWxmLmNoYXJ0c1tjdXJyR3JhcGhJZF0uY3VyckxldmVsID0gbGV2ZWw7XG5cbiAgICAgICAgICAgIC8vIC8vUmVzdG9yaW5nIERhdGEgdXNpbmcgcHJldmlvdXMgc3RvcmUgZGF0YVxuICAgICAgICAgICAgLy8gX3NlbGYuY2hhcnRzW2N1cnJHcmFwaElkXS5ncmFwaERhdGEgPSBhd2FpdCBfc2VsZi5jaGFydHNbXG4gICAgICAgICAgICAvLyAgIGN1cnJHcmFwaElkXG4gICAgICAgICAgICAvLyBdLnByZXZMZXZlbERhdGFbbGV2ZWxdO1xuXG4gICAgICAgICAgICAvLyAvL1JlZnJlc2ggUHJldmlvdXMgRGF0YSBMaXN0XG4gICAgICAgICAgICAvLyBfc2VsZi5jaGFydHNbY3VyckdyYXBoSWRdLnByZXZMZXZlbERhdGEuc3BsaWNlKGxldmVsLCAxKTtcbiAgICAgICAgICAgIC8vIGlmIChcbiAgICAgICAgICAgIC8vICAgbGV2ZWwgPT0gMCAmJlxuICAgICAgICAgICAgLy8gICAoX3NlbGYuY2hhcnRzW2dyYXBoSWRdLmdyYXBoVHlwZXNbMF0gPT1cbiAgICAgICAgICAgIC8vICAgICBHcmFwaFR5cGVzLlNUQUNLRURfQkFSX1BFUkNFTlRBR0UgfHxcbiAgICAgICAgICAgIC8vICAgICBfc2VsZi5jaGFydHNbZ3JhcGhJZF0uZ3JhcGhUeXBlc1swXSA9PVxuICAgICAgICAgICAgLy8gICAgICAgR3JhcGhUeXBlcy5TVEFDS0VEX0NPTFVNTl9QRVJDRU5UQUdFKVxuICAgICAgICAgICAgLy8gKSB7XG4gICAgICAgICAgICAvLyAgIHBsb3RPcHRpb25zLnNlcmllc1snc3RhY2tpbmcnXSA9ICdwZXJjZW50JzsgLy9TdGFja2luZyBvZiB5LWF4aXMgb24gYmFzaXMgb2YgcGVyY2VudGFnZVxuICAgICAgICAgICAgLy8gICAvL0FkZCBQZXJjZW50IFNpZ24gYWZ0ZXIgeS1heGlzIHZhbHVlc1xuICAgICAgICAgICAgLy8gICBwbG90T3B0aW9ucy5zZXJpZXMuZGF0YUxhYmVsc1snZm9ybWF0dGVyJ10gPSBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICAvLyAgICAgcmV0dXJuIHRoaXMucGVyY2VudGFnZS50b0ZpeGVkKDIpICsgJyAlJztcbiAgICAgICAgICAgIC8vICAgfTtcblxuICAgICAgICAgICAgLy8gICBjaGFydC51cGRhdGUoe1xuICAgICAgICAgICAgLy8gICAgIHBsb3RPcHRpb25zOiBwbG90T3B0aW9ucyxcbiAgICAgICAgICAgIC8vICAgfSk7XG4gICAgICAgICAgICAvLyB9XG4gICAgICAgICAgfSxcbiAgICAgICAgfSxcbiAgICAgIH0sXG4gICAgICAvL0NvbmZpZ3VyaW5nIFgtYXhpc1xuICAgICAgeEF4aXM6IHtcbiAgICAgICAgdHlwZTogJ2NhdGVnb3J5JyxcbiAgICAgICAgbGFiZWxzOiB7XG4gICAgICAgICAgc3R5bGU6IHtcbiAgICAgICAgICAgIGNvbG9yOiAncmVkJyxcbiAgICAgICAgICAgIHRleHREZWNvcmF0aW9uOiAnbm9uZScsXG4gICAgICAgICAgICB0ZXh0T3V0bGluZTogJzBweCcsXG4gICAgICAgICAgfSxcbiAgICAgICAgfSxcbiAgICAgICAgbWluOiAwLFxuICAgICAgICBtYXg6XG4gICAgICAgICAgT2JqZWN0LmtleXModGhpcy5jaGFydHNbZ3JhcGhJZF0uZ3JhcGhEYXRhKS5sZW5ndGggPD0gNlxuICAgICAgICAgICAgPyBPYmplY3Qua2V5cyh0aGlzLmNoYXJ0c1tncmFwaElkXS5ncmFwaERhdGEpLmxlbmd0aCAtIDFcbiAgICAgICAgICAgIDogNixcbiAgICAgICAgYWxsb3dEZWNpbWFsczogZmFsc2UsXG4gICAgICAgIHNjcm9sbGJhcjoge1xuICAgICAgICAgIGVuYWJsZWQ6IHRydWUsXG4gICAgICAgIH0sXG4gICAgICB9LFxuICAgICAgLy9Db25maWd1cmluZyBZLWF4aXNcbiAgICAgIHlBeGlzOiBsb2Rhc2gubWFwKHRoaXMuY2hhcnRzW2dyYXBoSWRdLmNvbHVtbnMsICh5OiBhbnkpID0+IHtcbiAgICAgICAgcmV0dXJuIHtcbiAgICAgICAgICBvcHBvc2l0ZTogdHJ1ZSxcbiAgICAgICAgICB0aXRsZToge1xuICAgICAgICAgICAgdGV4dDogbnVsbCwgLy8gSGlkaW5nIHZlcnRpY2FsIGxhYmVscyBvdmVyIHktYXhpc1xuICAgICAgICAgIH0sXG4gICAgICAgIH07XG4gICAgICB9KSxcbiAgICAgIC8vR2V0dGluZyBNYWluIFNlcmllcyBEYXRhXG4gICAgICBzZXJpZXM6IHRoaXMuZ2V0RHJpbGxEb3duRGF0YShcbiAgICAgICAgbnVsbCxcbiAgICAgICAgdGhpcy5jaGFydHNbZ3JhcGhJZF0uZ3JhcGhEYXRhLFxuICAgICAgICB0aGlzLmNoYXJ0c1tncmFwaElkXS5ncmFwaElkXG4gICAgICApLFxuICAgIH07XG4gIH1cblxuICBwcml2YXRlIG1hbmFnZUJyZWFkQ3J1bWIoZ3JhcGhJZDogc3RyaW5nLCBfc2VsZjogYW55KSB7XG4gICAgY29uc3QgZGl2ID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoXCJncmFwaC1vcHRpb25zLVwiICsgZ3JhcGhJZCk7XG4gICAgZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoXCJicmVhZGNydW1iLVwiICsgZ3JhcGhJZCk/LnJlbW92ZSgpO1xuICAgIGNvbnN0IGJyZWFkQ3J1bWIgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KFwiZGl2XCIpO1xuICAgIGlmKF9zZWxmLmNoYXJ0c1tncmFwaElkXS5icmVhZENydW1iLmxlbmd0aCA9PSAxKXtcbiAgICAgIHJldHVybjtcbiAgICB9XG5cbiAgICBicmVhZENydW1iLnNldEF0dHJpYnV0ZSgnc3R5bGUnLCB0aGlzLmJyZWFkY3J1bWJTdHlsZXMpO1xuICAgIGJyZWFkQ3J1bWIuc2V0QXR0cmlidXRlKCdpZCcsIFwiYnJlYWRjcnVtYi1cIiArIGdyYXBoSWQpO1xuICAgIC8vIGhvbWVJY29uLnNldEF0dHJpYnV0ZSgnaWQnLCAnaG9tZS1sYWJlbC0nICsgZ3JhcGhJZCk7XG4gICAgLy8gaG9tZUljb24uc2V0QXR0cmlidXRlKCdjbGFzcycsICdmYSBmYS1ob21lJyk7XG4gICAgX3NlbGYuY2hhcnRzW2dyYXBoSWRdLmJyZWFkQ3J1bWIuZm9yRWFjaCgoYnJlYWRjcnVtYjogYW55LCBpbmRleDogYW55KSA9PiB7XG4gICAgICBjb25zdCBwYXJhID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudChcInBcIik7XG4gICAgICBjb25zdCBzcGFuID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudChcInNwYW5cIik7XG4gICAgICBzcGFuLnNldEF0dHJpYnV0ZShcInN0eWxlXCIsIFwidGV4dC1kZWNvcmF0aW9uOiB1bmRlcmxpbmU7IGN1cnNvcjogcG9pbnRlcjtcIilcbiAgICAgIHNwYW4uc2V0QXR0cmlidXRlKFwiaWRcIiwgYnJlYWRjcnVtYik7XG4gICAgICBzcGFuLmFwcGVuZChicmVhZGNydW1iKTtcbiAgICAgIHBhcmEuYXBwZW5kQ2hpbGQoc3Bhbik7XG4gICAgICBwYXJhLnNldEF0dHJpYnV0ZShcInN0eWxlXCIsIFwibWFyZ2luLWJvdHRvbTogMHB4O1wiKVxuICAgICAgaWYgKGluZGV4ICE9IHRoaXMuY2hhcnRzW2dyYXBoSWRdLmJyZWFkQ3J1bWIubGVuZ3RoIC0gMSkge1xuICAgICAgICBwYXJhLmFwcGVuZChcIiA+IFwiKTtcbiAgICAgICAgc3Bhbi5hZGRFdmVudExpc3RlbmVyKFwiY2xpY2tcIiwgKGV2ZW50IDphbnkpID0+IHtcbiAgICAgICAgICBpZihldmVudC50YXJnZXQuaWQgPT0gXCJIb21lXCIpe1xuICAgICAgICAgICAgX3RoaXMuY2hhcnRzW2dyYXBoSWRdLmdyYXBoRGF0YSA9IF90aGlzLmNoYXJ0c1tncmFwaElkXS5wcmV2TGV2ZWxEYXRhWzBdO1xuICAgICAgICAgICAgX3RoaXMuYnVpbGRHcmFwaCh7XG4gICAgICAgICAgICAgIC4uLl90aGlzLmNoYXJ0c1tncmFwaElkXSxcbiAgICAgICAgICAgICAgYnJlYWRDcnVtYjogWydIb21lJ10sXG4gICAgICAgICAgICAgIGN1cnJMZXZlbDogMCxcbiAgICAgICAgICAgICAgcHJldkxldmVsRGF0YTogW10sXG4gICAgICAgICAgICAgIG9yZGVyOiAwLFxuICAgICAgICAgICAgICBzZWxLZXlzOiBbXSxcbiAgICAgICAgICAgICAgY29sVG9TaG93OiAnJyxcbiAgICAgICAgICAgIH0gYXMgR3JhcGhEYXRhKVxuICAgICAgICAgIH1lbHNle1xuICAgICAgICAgICAgY29uc3QgaW5kZXggPSBfdGhpcy5jaGFydHNbZ3JhcGhJZF0uYnJlYWRDcnVtYi5maW5kSW5kZXgoKGVsOiBhbnkpID0+IGVsID09IGV2ZW50LnRhcmdldC5pZCk7XG4gICAgICAgICAgICBpZihpbmRleCA+IDApe1xuICAgICAgICAgICAgICAvLyB0aGlzLmJ1aWxkR3JhcGgoKVxuICAgICAgICAgICAgICAvL1Jlc3RvcmluZyBEYXRhIHVzaW5nIHByZXZpb3VzIHN0b3JlIGRhdGFcbiAgICAgICAgICAgICAgX3RoaXMuY2hhcnRzW2dyYXBoSWRdLmN1cnJMZXZlbCA9IGluZGV4O1xuICAgICAgICAgICAgICBfdGhpcy5jaGFydHNbZ3JhcGhJZF0uZ3JhcGhEYXRhID0gX3RoaXMuY2hhcnRzW2dyYXBoSWRdLnByZXZMZXZlbERhdGFbaW5kZXhdO1xuICAgICAgICAgICAgICBcbiAgICAgICAgICAgICAgLy9SZWZyZXNoIFByZXZpb3VzIERhdGEgTGlzdFxuICAgICAgICAgICAgICBfdGhpcy5jaGFydHNbZ3JhcGhJZF0ucHJldkxldmVsRGF0YSA9IF90aGlzLmNoYXJ0c1tncmFwaElkXS5wcmV2TGV2ZWxEYXRhLnNsaWNlKDAsIGluZGV4KTtcbiAgXG4gICAgICAgICAgICAgIF90aGlzLmNoYXJ0c1tncmFwaElkXS5icmVhZENydW1iID0gX3RoaXMuY2hhcnRzW2dyYXBoSWRdLmJyZWFkQ3J1bWIuc2xpY2UoMCwgaW5kZXggKyAxKTtcbiAgICAgICAgICAgICAgXG4gICAgICAgICAgICAgIF90aGlzLmNoYXJ0c1tncmFwaElkXS5zZWxLZXlzID0gX3RoaXMuY2hhcnRzW2dyYXBoSWRdLnNlbEtleXM/LnNsaWNlKDAsIGluZGV4KTtcbiAgICAgICAgICAgICAgXG4gICAgICAgICAgICAgIF90aGlzLmJ1aWxkR3JhcGgoe1xuICAgICAgICAgICAgICAgIC4uLl90aGlzLmNoYXJ0c1tncmFwaElkXSxcbiAgICAgICAgICAgICAgfSBhcyBHcmFwaERhdGEpXG4gICAgICAgICAgICB9XG4gICAgICAgICAgfVxuICAgICAgICB9KVxuICAgICAgfVxuICAgICAgYnJlYWRDcnVtYi5hcHBlbmRDaGlsZChwYXJhKTtcbiAgICAgIGxldCBfdGhpcyA9IHRoaXM7XG4gICAgfSk7XG4gICAgZGl2IS5hcHBlbmRDaGlsZChicmVhZENydW1iKTtcbiAgfVxuXG4gIHByaXZhdGUgYXBwbHlDdXN0b21GaWx0ZXIoZDogYW55LCBmaWx0ZXI6IEZpbHRlcnMpIHtcbiAgICBsZXQgaXNWYWxpZCA9IGZpbHRlci5jdXN0b21GaWx0ZXIubGVuZ3RoID09IDA7XG4gICAgaWYgKGZpbHRlci5jdXN0b21GaWx0ZXIgJiYgZmlsdGVyLmN1c3RvbUZpbHRlci5sZW5ndGggPiAwKSB7XG4gICAgICBmb3IgKGNvbnN0IGVsZW1lbnQgb2YgZmlsdGVyLmN1c3RvbUZpbHRlcikge1xuICAgICAgICBpc1ZhbGlkID0gZmFsc2U7XG4gICAgICAgIGNvbnN0IF9maWx0ZXIgOiBDdXN0b21GaWx0ZXIgPSBlbGVtZW50XG4gICAgICAgIHN3aXRjaCAoX2ZpbHRlci5jdXN0b21GaWx0ZXJUeXBlKSB7XG4gICAgICAgICAgY2FzZSBDdXN0b21GaWx0ZXJUeXBlcy5TSU5HTEVfRVFVQVRJT046XG4gICAgICAgICAgICBpZiAoXG4gICAgICAgICAgICAgIHRoaXMuZ2V0RXF1YXRpb25SZXN1bHQoXG4gICAgICAgICAgICAgICAgZFtfZmlsdGVyLmN1c3RvbUZpbHRlcnZhcjFdLFxuICAgICAgICAgICAgICAgIF9maWx0ZXIuY3VzdG9tRmlsdGVyVmFyMVZhbHVlLFxuICAgICAgICAgICAgICAgIF9maWx0ZXIuc3ltYm9sMSxcbiAgICAgICAgICAgICAgICBfZmlsdGVyLmZpbHRlclR5cGUxLFxuICAgICAgICAgICAgICAgIF9maWx0ZXIuZmlsdGVyRm9ybWF0MVxuICAgICAgICAgICAgICApXG4gICAgICAgICAgICApIHtcbiAgICAgICAgICAgICAgaXNWYWxpZCA9IHRydWU7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBicmVhaztcbiAgICAgICAgICBjYXNlIEN1c3RvbUZpbHRlclR5cGVzLkFfT1JfQjpcbiAgICAgICAgICAgIGlmIChcbiAgICAgICAgICAgICAgKHRoaXMuZ2V0RXF1YXRpb25SZXN1bHQoXG4gICAgICAgICAgICAgICAgZFtfZmlsdGVyLmN1c3RvbUZpbHRlcnZhcjFdLFxuICAgICAgICAgICAgICAgIF9maWx0ZXIuY3VzdG9tRmlsdGVyVmFyMVZhbHVlLFxuICAgICAgICAgICAgICAgIF9maWx0ZXIuc3ltYm9sMSxcbiAgICAgICAgICAgICAgICBfZmlsdGVyLmZpbHRlclR5cGUxLFxuICAgICAgICAgICAgICAgIF9maWx0ZXIuZmlsdGVyRm9ybWF0MVxuICAgICAgICAgICAgICApIHx8XG4gICAgICAgICAgICAgIHRoaXMuZ2V0RXF1YXRpb25SZXN1bHQoXG4gICAgICAgICAgICAgICAgZFtfZmlsdGVyLmN1c3RvbUZpbHRlcnZhcjJdLFxuICAgICAgICAgICAgICAgIF9maWx0ZXIuY3VzdG9tRmlsdGVyVmFyMlZhbHVlLFxuICAgICAgICAgICAgICAgIF9maWx0ZXIuc3ltYm9sMixcbiAgICAgICAgICAgICAgICBfZmlsdGVyLmZpbHRlclR5cGUyLFxuICAgICAgICAgICAgICAgIF9maWx0ZXIuZmlsdGVyRm9ybWF0MlxuICAgICAgICAgICAgICApKVxuICAgICAgICAgICAgKSB7XG4gICAgICAgICAgICAgIGlzVmFsaWQgPSB0cnVlO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgY2FzZSBDdXN0b21GaWx0ZXJUeXBlcy5BX0FORF9COlxuICAgICAgICAgICAgaWYgKFxuICAgICAgICAgICAgICAodGhpcy5nZXRFcXVhdGlvblJlc3VsdChcbiAgICAgICAgICAgICAgICBkW19maWx0ZXIuY3VzdG9tRmlsdGVydmFyMV0sXG4gICAgICAgICAgICAgICAgX2ZpbHRlci5jdXN0b21GaWx0ZXJWYXIxVmFsdWUsXG4gICAgICAgICAgICAgICAgX2ZpbHRlci5zeW1ib2wxLFxuICAgICAgICAgICAgICAgIF9maWx0ZXIuZmlsdGVyVHlwZTEsXG4gICAgICAgICAgICAgICAgX2ZpbHRlci5maWx0ZXJGb3JtYXQxXG4gICAgICAgICAgICAgICkgJiZcbiAgICAgICAgICAgICAgdGhpcy5nZXRFcXVhdGlvblJlc3VsdChcbiAgICAgICAgICAgICAgICBkW19maWx0ZXIuY3VzdG9tRmlsdGVydmFyMl0sXG4gICAgICAgICAgICAgICAgX2ZpbHRlci5jdXN0b21GaWx0ZXJWYXIyVmFsdWUsXG4gICAgICAgICAgICAgICAgX2ZpbHRlci5zeW1ib2wyLFxuICAgICAgICAgICAgICAgIF9maWx0ZXIuZmlsdGVyVHlwZTIsXG4gICAgICAgICAgICAgICAgX2ZpbHRlci5maWx0ZXJGb3JtYXQyXG4gICAgICAgICAgICAgICkpXG4gICAgICAgICAgICApIHtcbiAgICAgICAgICAgICAgaXNWYWxpZCA9IHRydWU7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBicmVhaztcbiAgICAgICAgICBjYXNlIEN1c3RvbUZpbHRlclR5cGVzLkFfT1JfQl9PUl9DOlxuICAgICAgICAgICAgaWYgKFxuICAgICAgICAgICAgICAodGhpcy5nZXRFcXVhdGlvblJlc3VsdChcbiAgICAgICAgICAgICAgICBkW19maWx0ZXIuY3VzdG9tRmlsdGVydmFyMV0sXG4gICAgICAgICAgICAgICAgX2ZpbHRlci5jdXN0b21GaWx0ZXJWYXIxVmFsdWUsXG4gICAgICAgICAgICAgICAgX2ZpbHRlci5zeW1ib2wxLFxuICAgICAgICAgICAgICAgIF9maWx0ZXIuZmlsdGVyVHlwZTEsXG4gICAgICAgICAgICAgICAgX2ZpbHRlci5maWx0ZXJGb3JtYXQxXG4gICAgICAgICAgICAgICkgfHxcbiAgICAgICAgICAgICAgdGhpcy5nZXRFcXVhdGlvblJlc3VsdChcbiAgICAgICAgICAgICAgICBkW19maWx0ZXIuY3VzdG9tRmlsdGVydmFyMl0sXG4gICAgICAgICAgICAgICAgX2ZpbHRlci5jdXN0b21GaWx0ZXJWYXIyVmFsdWUsXG4gICAgICAgICAgICAgICAgX2ZpbHRlci5zeW1ib2wyLFxuICAgICAgICAgICAgICAgIF9maWx0ZXIuZmlsdGVyVHlwZTIsXG4gICAgICAgICAgICAgICAgX2ZpbHRlci5maWx0ZXJGb3JtYXQyXG4gICAgICAgICAgICAgICkgfHxcbiAgICAgICAgICAgICAgdGhpcy5nZXRFcXVhdGlvblJlc3VsdChcbiAgICAgICAgICAgICAgICBkW19maWx0ZXIuY3VzdG9tRmlsdGVydmFyM10sXG4gICAgICAgICAgICAgICAgX2ZpbHRlci5jdXN0b21GaWx0ZXJWYXIzVmFsdWUsXG4gICAgICAgICAgICAgICAgX2ZpbHRlci5zeW1ib2wzLFxuICAgICAgICAgICAgICAgIF9maWx0ZXIuZmlsdGVyVHlwZTMsXG4gICAgICAgICAgICAgICAgX2ZpbHRlci5maWx0ZXJGb3JtYXQzXG4gICAgICAgICAgICAgICkpXG4gICAgICAgICAgICApIHtcbiAgICAgICAgICAgICAgaXNWYWxpZCA9IHRydWU7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBicmVhaztcbiAgICAgICAgICBjYXNlIEN1c3RvbUZpbHRlclR5cGVzLkFfQU5EX0JfQU5EX0M6XG4gICAgICAgICAgICBpZiAoXG4gICAgICAgICAgICAodGhpcy5nZXRFcXVhdGlvblJlc3VsdChcbiAgICAgICAgICAgICAgICBkW19maWx0ZXIuY3VzdG9tRmlsdGVydmFyMV0sXG4gICAgICAgICAgICAgICAgX2ZpbHRlci5jdXN0b21GaWx0ZXJWYXIxVmFsdWUsXG4gICAgICAgICAgICAgICAgX2ZpbHRlci5zeW1ib2wxLFxuICAgICAgICAgICAgICAgIF9maWx0ZXIuZmlsdGVyVHlwZTEsXG4gICAgICAgICAgICAgICAgX2ZpbHRlci5maWx0ZXJGb3JtYXQxXG4gICAgICAgICAgICAgICkgJiZcbiAgICAgICAgICAgICAgdGhpcy5nZXRFcXVhdGlvblJlc3VsdChcbiAgICAgICAgICAgICAgICBkW19maWx0ZXIuY3VzdG9tRmlsdGVydmFyMl0sXG4gICAgICAgICAgICAgICAgX2ZpbHRlci5jdXN0b21GaWx0ZXJWYXIyVmFsdWUsXG4gICAgICAgICAgICAgICAgX2ZpbHRlci5zeW1ib2wyLFxuICAgICAgICAgICAgICAgIF9maWx0ZXIuZmlsdGVyVHlwZTIsXG4gICAgICAgICAgICAgICAgX2ZpbHRlci5maWx0ZXJGb3JtYXQyXG4gICAgICAgICAgICAgICkgJiZcbiAgICAgICAgICAgICAgdGhpcy5nZXRFcXVhdGlvblJlc3VsdChcbiAgICAgICAgICAgICAgICBkW19maWx0ZXIuY3VzdG9tRmlsdGVydmFyM10sXG4gICAgICAgICAgICAgICAgX2ZpbHRlci5jdXN0b21GaWx0ZXJWYXIzVmFsdWUsXG4gICAgICAgICAgICAgICAgX2ZpbHRlci5zeW1ib2wzLFxuICAgICAgICAgICAgICAgIF9maWx0ZXIuZmlsdGVyVHlwZTMsXG4gICAgICAgICAgICAgICAgX2ZpbHRlci5maWx0ZXJGb3JtYXQzXG4gICAgICAgICAgICAgICkpXG4gICAgICAgICAgICApIHtcbiAgICAgICAgICAgICAgaXNWYWxpZCA9IHRydWU7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBicmVhaztcbiAgICAgICAgICBjYXNlIEN1c3RvbUZpbHRlclR5cGVzLkFfT1JfQl9BTkRfQzpcbiAgICAgICAgICAgIGlmIChcbiAgICAgICAgICAgICAgKHRoaXMuZ2V0RXF1YXRpb25SZXN1bHQoXG4gICAgICAgICAgICAgICAgZFtfZmlsdGVyLmN1c3RvbUZpbHRlcnZhcjFdLFxuICAgICAgICAgICAgICAgIF9maWx0ZXIuY3VzdG9tRmlsdGVyVmFyMVZhbHVlLFxuICAgICAgICAgICAgICAgIF9maWx0ZXIuc3ltYm9sMSxcbiAgICAgICAgICAgICAgICBfZmlsdGVyLmZpbHRlclR5cGUxLFxuICAgICAgICAgICAgICAgIF9maWx0ZXIuZmlsdGVyRm9ybWF0MVxuICAgICAgICAgICAgICApIHx8XG4gICAgICAgICAgICAgICh0aGlzLmdldEVxdWF0aW9uUmVzdWx0KFxuICAgICAgICAgICAgICAgIGRbX2ZpbHRlci5jdXN0b21GaWx0ZXJ2YXIyXSxcbiAgICAgICAgICAgICAgICBfZmlsdGVyLmN1c3RvbUZpbHRlclZhcjJWYWx1ZSxcbiAgICAgICAgICAgICAgICBfZmlsdGVyLnN5bWJvbDIsXG4gICAgICAgICAgICAgICAgX2ZpbHRlci5maWx0ZXJUeXBlMixcbiAgICAgICAgICAgICAgICBfZmlsdGVyLmZpbHRlckZvcm1hdDJcbiAgICAgICAgICAgICAgKSAmJlxuICAgICAgICAgICAgICAgIHRoaXMuZ2V0RXF1YXRpb25SZXN1bHQoXG4gICAgICAgICAgICAgICAgICBkW19maWx0ZXIuY3VzdG9tRmlsdGVydmFyM10sXG4gICAgICAgICAgICAgICAgICBfZmlsdGVyLmN1c3RvbUZpbHRlclZhcjNWYWx1ZSxcbiAgICAgICAgICAgICAgICAgIF9maWx0ZXIuc3ltYm9sMyxcbiAgICAgICAgICAgICAgICAgIF9maWx0ZXIuZmlsdGVyVHlwZTMsXG4gICAgICAgICAgICAgICAgICBfZmlsdGVyLmZpbHRlckZvcm1hdDNcbiAgICAgICAgICAgICAgICApKSlcbiAgICAgICAgICAgICkge1xuICAgICAgICAgICAgICBpc1ZhbGlkID0gdHJ1ZTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgIGNhc2UgQ3VzdG9tRmlsdGVyVHlwZXMuQV9BTkRfQl9PUl9DOlxuICAgICAgICAgICAgaWYgKFxuICAgICAgICAgICAgICAodGhpcy5nZXRFcXVhdGlvblJlc3VsdChcbiAgICAgICAgICAgICAgICBkW19maWx0ZXIuY3VzdG9tRmlsdGVydmFyMV0sXG4gICAgICAgICAgICAgICAgX2ZpbHRlci5jdXN0b21GaWx0ZXJWYXIxVmFsdWUsXG4gICAgICAgICAgICAgICAgX2ZpbHRlci5zeW1ib2wxLFxuICAgICAgICAgICAgICAgIF9maWx0ZXIuZmlsdGVyVHlwZTEsXG4gICAgICAgICAgICAgICAgX2ZpbHRlci5maWx0ZXJGb3JtYXQxXG4gICAgICAgICAgICAgICkgJiZcbiAgICAgICAgICAgICAgKHRoaXMuZ2V0RXF1YXRpb25SZXN1bHQoXG4gICAgICAgICAgICAgICAgZFtfZmlsdGVyLmN1c3RvbUZpbHRlcnZhcjJdLFxuICAgICAgICAgICAgICAgIF9maWx0ZXIuY3VzdG9tRmlsdGVyVmFyMlZhbHVlLFxuICAgICAgICAgICAgICAgIF9maWx0ZXIuc3ltYm9sMixcbiAgICAgICAgICAgICAgICBfZmlsdGVyLmZpbHRlclR5cGUyLFxuICAgICAgICAgICAgICAgIF9maWx0ZXIuZmlsdGVyRm9ybWF0MlxuICAgICAgICAgICAgICApIHx8XG4gICAgICAgICAgICAgICAgdGhpcy5nZXRFcXVhdGlvblJlc3VsdChcbiAgICAgICAgICAgICAgICAgIGRbX2ZpbHRlci5jdXN0b21GaWx0ZXJ2YXIzXSxcbiAgICAgICAgICAgICAgICAgIF9maWx0ZXIuY3VzdG9tRmlsdGVyVmFyM1ZhbHVlLFxuICAgICAgICAgICAgICAgICAgX2ZpbHRlci5zeW1ib2wzLFxuICAgICAgICAgICAgICAgICAgX2ZpbHRlci5maWx0ZXJUeXBlMyxcbiAgICAgICAgICAgICAgICAgIF9maWx0ZXIuZmlsdGVyRm9ybWF0M1xuICAgICAgICAgICAgICAgICkpKVxuICAgICAgICAgICAgKSB7XG4gICAgICAgICAgICAgIGlzVmFsaWQgPSB0cnVlO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgIH1cbiAgXG4gICAgICAgIGlmKCFpc1ZhbGlkKSBicmVhaztcbiAgICAgIH1cbiAgICB9XG4gICAgcmV0dXJuIGlzVmFsaWQ7XG4gIH1cblxuICBwcml2YXRlIGdldEZvcm1hdHRlZERhdGUoXG4gICAgaW5wdXRTdHI6IGFueSxcbiAgICBmb3JtYXQ6IGFueSA9IERhdGVGb3JtYXQuRERfTU1fWVlZWV9ISF9tbV9zc1xuICApIHtcbiAgICBpZiAoXG4gICAgICBbXG4gICAgICAgIERhdGVGb3JtYXQuRERfTU1fWVlZWSxcbiAgICAgICAgRGF0ZUZvcm1hdC5NTV9ERF9ZWVlZLFxuICAgICAgICBEYXRlRm9ybWF0LkREX3NfTU1fc19ZWVlZLFxuICAgICAgICBEYXRlRm9ybWF0Lk1NX3NfRERfc19ZWVlZLFxuICAgICAgICBEYXRlRm9ybWF0LllZWVlfc19NTV9zX0RELFxuICAgICAgICBEYXRlRm9ybWF0LllZWVlfTU1fREQsXG4gICAgICBdLmluZGV4T2YoZm9ybWF0KSAhPSAtMVxuICAgICkge1xuICAgICAgbGV0IHRlbXBBcnIgPSBpbnB1dFN0ci5zcGxpdCgnICcpO1xuICAgICAgbGV0IGRhdGVTdHIgPSB0ZW1wQXJyWzBdO1xuICAgICAgbGV0IFtkYXksIG1vbnRoLCB5ZWFyXSA9IGRhdGVTdHIuc3BsaXQoJy0nKTtcbiAgICAgIHJldHVybiBuZXcgRGF0ZSgreWVhciwgbW9udGggLSAxLCArZGF5KTtcbiAgICB9IGVsc2UgaWYgKGZvcm1hdCA9PSBUaW1lRm9ybWF0LkhIX21tX3NzKSB7XG4gICAgICBsZXQgW2hvdXIsIG1pbnV0ZSwgc2Vjb25kXSA9IGlucHV0U3RyXG4gICAgICAgIC5zcGxpdCgnOicpXG4gICAgICAgIC5tYXAoKGVsOiBhbnkpID0+IHBhcnNlSW50KGVsKSk7XG4gICAgICByZXR1cm4gaG91ciAqIDYwICogNjAgKyBtaW51dGUgKiA2MCArIHNlY29uZDtcbiAgICB9IGVsc2Uge1xuICAgICAgbGV0IHRlbXBBcnIgPSBpbnB1dFN0ci5zcGxpdCgnICcpO1xuICAgICAgbGV0IGRhdGVTdHIgPSB0ZW1wQXJyWzBdO1xuICAgICAgbGV0IHRpbWUgPSB0ZW1wQXJyWzFdO1xuICAgICAgbGV0IFtkYXksIG1vbnRoLCB5ZWFyXSA9IGRhdGVTdHIuc3BsaXQoJy0nKTtcbiAgICAgIGxldCBbaG91ciwgbWludXRlXSA9IHRpbWUuc3BsaXQoJzonKTtcbiAgICAgIGxldCBzZWNvbmQgPSAwO1xuICAgICAgcmV0dXJuIG5ldyBEYXRlKCt5ZWFyLCBtb250aCAtIDEsICtkYXksICtob3VyLCArbWludXRlLCArc2Vjb25kKTtcbiAgICB9XG4gIH1cblxuICBwcml2YXRlIGdldEVxdWF0aW9uUmVzdWx0KFxuICAgIHZhcmlhYmxlMTogc3RyaW5nIHwgbnVtYmVyLFxuICAgIHZhcmlhYmxlMjogYW55LFxuICAgIG9wZXJhdG9yOiBGaWx0ZXJUeXBlcyxcbiAgICB0eXBlOiBEYXRhVHlwZSxcbiAgICBmb3JtYXQ6IGFueVxuICApIHtcbiAgICBzd2l0Y2ggKG9wZXJhdG9yKSB7XG4gICAgICBjYXNlIEZpbHRlclR5cGVzLkVRVUFMOlxuICAgICAgICBpZiAodmFyaWFibGUxID09IHZhcmlhYmxlMlswXSkge1xuICAgICAgICAgIHJldHVybiB0cnVlO1xuICAgICAgICB9XG4gICAgICAgIGJyZWFrO1xuICAgICAgY2FzZSBGaWx0ZXJUeXBlcy5HUkVBVEVSX1RIQU46XG4gICAgICAgIGlmICh2YXJpYWJsZTEgPiB2YXJpYWJsZTJbMF0pIHtcbiAgICAgICAgICByZXR1cm4gdHJ1ZTtcbiAgICAgICAgfVxuICAgICAgICBicmVhaztcbiAgICAgIGNhc2UgRmlsdGVyVHlwZXMuTEVTU19USEFOOlxuICAgICAgICBpZiAodmFyaWFibGUxIDwgdmFyaWFibGUyWzBdKSB7XG4gICAgICAgICAgcmV0dXJuIHRydWU7XG4gICAgICAgIH1cbiAgICAgICAgYnJlYWs7XG4gICAgICBjYXNlIEZpbHRlclR5cGVzLk5PVF9FUVVBTDpcbiAgICAgICAgaWYgKHZhcmlhYmxlMSAhPSB2YXJpYWJsZTJbMF0pIHtcbiAgICAgICAgICByZXR1cm4gdHJ1ZTtcbiAgICAgICAgfVxuICAgICAgICBicmVhaztcbiAgICAgIGNhc2UgRmlsdGVyVHlwZXMuR1JFQVRFUl9USEFOX0VRVUFMOlxuICAgICAgICBpZiAodmFyaWFibGUxID49IHZhcmlhYmxlMlswXSkge1xuICAgICAgICAgIHJldHVybiB0cnVlO1xuICAgICAgICB9XG4gICAgICAgIGJyZWFrO1xuICAgICAgY2FzZSBGaWx0ZXJUeXBlcy5MRVNTX1RIQU5fRVFVQUw6XG4gICAgICAgIGlmICh2YXJpYWJsZTEgPD0gdmFyaWFibGUyWzBdKSB7XG4gICAgICAgICAgcmV0dXJuIHRydWU7XG4gICAgICAgIH1cbiAgICAgICAgYnJlYWs7XG4gICAgICBjYXNlIEZpbHRlclR5cGVzLkJFVFdFRU5fUkFOR0U6XG4gICAgICAgIGlmICh2YXJpYWJsZTEgPj0gdmFyaWFibGUyWzBdICYmIHZhcmlhYmxlMSA8IHZhcmlhYmxlMlsxXSkge1xuICAgICAgICAgIHJldHVybiB0cnVlO1xuICAgICAgICB9XG4gICAgICAgIGJyZWFrO1xuICAgICAgY2FzZSBGaWx0ZXJUeXBlcy5JTjpcbiAgICAgICAgaWYgKHZhcmlhYmxlMi5pbmRleE9mKHZhcmlhYmxlMS50b1N0cmluZygpKSAhPSAtMSkge1xuICAgICAgICAgIHJldHVybiB0cnVlO1xuICAgICAgICB9XG4gICAgICAgIGJyZWFrO1xuICAgICAgY2FzZSBGaWx0ZXJUeXBlcy5OT1RfSU46XG4gICAgICAgIGlmICh2YXJpYWJsZTIuaW5kZXhPZih2YXJpYWJsZTEudG9TdHJpbmcoKSkgPT0gLTEpIHtcbiAgICAgICAgICByZXR1cm4gdHJ1ZTtcbiAgICAgICAgfVxuICAgICAgICBicmVhaztcbiAgICAgIGNhc2UgRmlsdGVyVHlwZXMuQkVGT1JFOlxuICAgICAgICBpZiAodHlwZSA9PSBEYXRhVHlwZS5EQVRFKSB7XG4gICAgICAgICAgLy9EYXRlIFR5cGUgdmFyaWFibGVcbiAgICAgICAgICBsZXQgb3BlcmFuZDEgPSB0aGlzLmdldEZvcm1hdHRlZERhdGUodmFyaWFibGUxLCBmb3JtYXQpO1xuICAgICAgICAgIGxldCBvcGVyYW5kMiA9IG5ldyBEYXRlKHZhcmlhYmxlMik7XG4gICAgICAgICAgaWYgKG9wZXJhbmQxIDwgb3BlcmFuZDIpIHtcbiAgICAgICAgICAgIHJldHVybiB0cnVlO1xuICAgICAgICAgIH1cbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAvL1RpbWUgVHlwZSB2YXJpYWJsZVxuICAgICAgICAgIGxldCBjdXJyU2Vjb25kcyA9IHRoaXMuZ2V0Rm9ybWF0dGVkRGF0ZSh2YXJpYWJsZTEsIGZvcm1hdCk7XG4gICAgICAgICAgbGV0IFtob3VyLCBtaW5dID0gdmFyaWFibGUyLnNwbGl0KCc6JykubWFwKChlbDogYW55KSA9PiBwYXJzZUludChlbCkpO1xuICAgICAgICAgIGxldCBjb21wYXJlZFNlYyA9IGhvdXIgKiA2MCAqIDYwICsgbWluICogNjA7XG4gICAgICAgICAgaWYgKGN1cnJTZWNvbmRzIDwgY29tcGFyZWRTZWMpIHtcbiAgICAgICAgICAgIHJldHVybiB0cnVlO1xuICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgICBicmVhaztcbiAgICAgIGNhc2UgRmlsdGVyVHlwZXMuQUZURVI6XG4gICAgICAgIGlmICh0eXBlID09IERhdGFUeXBlLkRBVEUpIHtcbiAgICAgICAgICAvL0RhdGUgVHlwZSB2YXJpYWJsZVxuICAgICAgICAgIGxldCBvcGVyYW5kMSA9IHRoaXMuZ2V0Rm9ybWF0dGVkRGF0ZSh2YXJpYWJsZTEsIGZvcm1hdCk7XG4gICAgICAgICAgbGV0IG9wZXJhbmQyID0gbmV3IERhdGUodmFyaWFibGUyKTtcbiAgICAgICAgICBpZiAob3BlcmFuZDEgPiBvcGVyYW5kMikge1xuICAgICAgICAgICAgcmV0dXJuIHRydWU7XG4gICAgICAgICAgfVxuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgIC8vVGltZSBUeXBlIHZhcmlhYmxlXG4gICAgICAgICAgbGV0IGN1cnJTZWNvbmRzID0gdGhpcy5nZXRGb3JtYXR0ZWREYXRlKHZhcmlhYmxlMSwgZm9ybWF0KTtcbiAgICAgICAgICBsZXQgW2hvdXIsIG1pbl0gPSB2YXJpYWJsZTIuc3BsaXQoJzonKS5tYXAoKGVsOiBhbnkpID0+IHBhcnNlSW50KGVsKSk7XG4gICAgICAgICAgbGV0IGNvbXBhcmVkU2VjID0gaG91ciAqIDYwICogNjAgKyBtaW4gKiA2MDtcbiAgICAgICAgICBpZiAoY3VyclNlY29uZHMgPiBjb21wYXJlZFNlYykge1xuICAgICAgICAgICAgcmV0dXJuIHRydWU7XG4gICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICAgIGJyZWFrO1xuICAgICAgY2FzZSBGaWx0ZXJUeXBlcy5CRVRXRUVOOlxuICAgICAgICBpZiAodHlwZSA9PSBEYXRhVHlwZS5EQVRFKSB7XG4gICAgICAgICAgLy9EYXRlIFR5cGUgdmFyaWFibGVcbiAgICAgICAgICBsZXQgb3BlcmFuZDEgPSB0aGlzLmdldEZvcm1hdHRlZERhdGUodmFyaWFibGUxLCBmb3JtYXQpO1xuICAgICAgICAgIGxldCBvcGVyYW5kMiA9IG5ldyBEYXRlKHZhcmlhYmxlMlswXSk7XG4gICAgICAgICAgbGV0IG9wZXJhbmQzID0gbmV3IERhdGUodmFyaWFibGUyWzFdKTtcbiAgICAgICAgICBpZiAob3BlcmFuZDEgPj0gb3BlcmFuZDIgJiYgb3BlcmFuZDEgPCBvcGVyYW5kMykge1xuICAgICAgICAgICAgcmV0dXJuIHRydWU7XG4gICAgICAgICAgfVxuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgIC8vVGltZSBUeXBlIHZhcmlhYmxlXG4gICAgICAgICAgbGV0IGN1cnJTZWNvbmRzID0gdGhpcy5nZXRGb3JtYXR0ZWREYXRlKHZhcmlhYmxlMSwgZm9ybWF0KTtcbiAgICAgICAgICBsZXQgW2hvdXIsIG1pbl0gPSB2YXJpYWJsZTJbMF1cbiAgICAgICAgICAgIC5zcGxpdCgnOicpXG4gICAgICAgICAgICAubWFwKChlbDogYW55KSA9PiBwYXJzZUludChlbCkpO1xuICAgICAgICAgIGxldCBbZW5kaG91ciwgZW5kbWluXSA9IHZhcmlhYmxlMlsxXVxuICAgICAgICAgICAgLnNwbGl0KCc6JylcbiAgICAgICAgICAgIC5tYXAoKGVsOiBhbnkpID0+IHBhcnNlSW50KGVsKSk7XG4gICAgICAgICAgbGV0IGNvbXBhcmVkU2VjID0gaG91ciAqIDYwICogNjAgKyBtaW4gKiA2MDtcbiAgICAgICAgICBsZXQgZW5kQ29tcGFyZWRTZWMgPSBlbmRob3VyICogNjAgKiA2MCArIGVuZG1pbiAqIDYwO1xuICAgICAgICAgIGlmIChjdXJyU2Vjb25kcyA+PSBjb21wYXJlZFNlYyAmJiBjdXJyU2Vjb25kcyA8IGVuZENvbXBhcmVkU2VjKSB7XG4gICAgICAgICAgICByZXR1cm4gdHJ1ZTtcbiAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgICAgYnJlYWs7XG4gICAgfVxuICAgIHJldHVybiBmYWxzZTtcbiAgfVxuXG4gIHByaXZhdGUgc29ydEdyYXBoKGU6IGFueSkge1xuICAgIGNvbnN0IHRlbXBBcnIgPSBlLnRhcmdldC5pZC5zcGxpdCgnQCcpO1xuICAgIGNvbnN0IGdyYXBoSWQgPSB0ZW1wQXJyW3RlbXBBcnIubGVuZ3RoIC0gMV07XG4gICAgaWYgKHRoaXMuY2hhcnRzW2dyYXBoSWRdLm9yZGVyIDwgMSkge1xuICAgICAgdGhpcy5jaGFydHNbZ3JhcGhJZF0ub3JkZXIgKz0gMTtcbiAgICB9IGVsc2Uge1xuICAgICAgdGhpcy5jaGFydHNbZ3JhcGhJZF0ub3JkZXIgPSAtMTtcbiAgICB9XG4gICAgaWYgKHRoaXMuY2hhcnRzW2dyYXBoSWRdLmN1cnJMZXZlbCAhPSAwKSB7XG4gICAgICB0aGlzLmNoYXJ0c1tncmFwaElkXS5ncmFwaERhdGEgPSB0aGlzLmNoYXJ0c1tncmFwaElkXS5wcmV2TGV2ZWxEYXRhWzBdO1xuICAgIH1cbiAgICB0aGlzLmNoYXJ0c1tncmFwaElkXS5jdXJyTGV2ZWwgPSAwO1xuICAgIGxldCBjaGFydE9wdGlvbnM6IGFueSA9IHRoaXMuY3JlYXRlQ2hhcnREYXRhKGdyYXBoSWQsIDApO1xuICAgIHRoaXMuaGlnaGNoYXJ0cy5jaGFydChncmFwaElkLCBjaGFydE9wdGlvbnMpO1xuICAgIHRoaXMuYWRkQWN0aW9uQnRuKGdyYXBoSWQpO1xuICB9XG5cbiAgcHJpdmF0ZSBkb3dubG9hZEdyYXBoRGF0YShlOiBhbnksIGRhdGE6IGFueSwgbGFzdExldmVsQ29sOiBhbnkpe1xuICAgIHRoaXMuZGF0YVNlcnZpY2Uuc2V0TW9kYWxEYXRhKHtcbiAgICAgIGNvbFRvVmlldzogbGFzdExldmVsQ29sLFxuICAgICAgcmVmRGF0YTogZGF0YVxuICAgIH0pO1xuICAgIGxldCBtb2RhbE9wdGlvbnMgPSB7XG4gICAgICBwYW5lbENsYXNzOiAnZGF0YVBvcHVwLW1vZGFsJyxcbiAgICAgIGJhY2tkcm9wQ2xhc3M6ICdtb2RhbC1iYWNrZHJvcCcsXG4gICAgfTtcbiAgICB0aGlzLmRpYWxvZy5vcGVuKERhdGFQb3B1cENvbXBvbmVudCwgbW9kYWxPcHRpb25zKTtcbiAgfVxuXG4gIHByaXZhdGUgYWRkQWN0aW9uQnRuKGdyYXBoSWQ6IHN0cmluZykge1xuICAgIGxldCBfc2VsZiA9IHRoaXM7XG4gICAgY29uc3QgZGl2ID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnZGl2Jyk7XG4gICAgZGl2LnNldEF0dHJpYnV0ZSgnc3R5bGUnLCB0aGlzLmRpdlN0eWxlcyk7XG4gICAgZGl2LnNldEF0dHJpYnV0ZShcImlkXCIsIFwiZ3JhcGgtb3B0aW9ucy1cIiArIGdyYXBoSWQpO1xuICAgIGNvbnN0IHNvcnRJY29uID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnaScpO1xuICAgIHNvcnRJY29uLnNldEF0dHJpYnV0ZSgnaWQnLCAnc29ydEAnICsgZ3JhcGhJZCk7XG4gICAgc29ydEljb24uc2V0QXR0cmlidXRlKCdzdHlsZScsIHRoaXMuaWNvblN0eWxlcyk7XG4gICAgaWYgKHRoaXMuY2hhcnRzW2dyYXBoSWRdLm9yZGVyID09IDEpIHtcbiAgICAgIHNvcnRJY29uLnNldEF0dHJpYnV0ZSgnY2xhc3MnLCAnZmEgZmEtc29ydC1hbW91bnQtZGVzYycpO1xuICAgIH0gZWxzZSBpZiAodGhpcy5jaGFydHNbZ3JhcGhJZF0ub3JkZXIgPT0gLTEpIHtcbiAgICAgIHNvcnRJY29uLnNldEF0dHJpYnV0ZSgnY2xhc3MnLCAnZmEgZmEtc29ydC1hbW91bnQtYXNjJyk7XG4gICAgfSBlbHNlIHtcbiAgICAgIHNvcnRJY29uLnNldEF0dHJpYnV0ZSgnY2xhc3MnLCAnZmEgZmEtc29ydCcpO1xuICAgIH1cbiAgICBjb25zdCBkb3dubG9hZEljb24gPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KFwiaVwiKTtcbiAgICBkb3dubG9hZEljb24uc2V0QXR0cmlidXRlKCdpZCcsICdkb3dubG9hZEAnICsgZ3JhcGhJZCk7XG4gICAgZG93bmxvYWRJY29uLnNldEF0dHJpYnV0ZSgnc3R5bGUnLCB0aGlzLmljb25TdHlsZXMpO1xuICAgIGRvd25sb2FkSWNvbi5zZXRBdHRyaWJ1dGUoJ2NsYXNzJywgJ2ZhIGZhLWRvd25sb2FkJylcblxuICAgIGRpdi5hcHBlbmRDaGlsZChkb3dubG9hZEljb24pO1xuICAgIGRpdi5hcHBlbmRDaGlsZChzb3J0SWNvbik7XG4gICAgLy8gaWYgKHRoaXMuY2hhcnRzW2dyYXBoSWRdLnJvd3NbMF0gPT0gJyoqKkxBQkVMKioqJykge1xuICAgIC8vICAgY29uc3QgaG9tZUljb24gPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdpY29uJyk7XG4gICAgLy8gICBob21lSWNvbi5zZXRBdHRyaWJ1dGUoJ3N0eWxlJywgdGhpcy5pY29uU3R5bGVzKTtcbiAgICAvLyAgIGhvbWVJY29uLnNldEF0dHJpYnV0ZSgnaWQnLCAnaG9tZS1sYWJlbC0nICsgZ3JhcGhJZCk7XG4gICAgLy8gICBob21lSWNvbi5zZXRBdHRyaWJ1dGUoJ2NsYXNzJywgJ2ZhIGZhLWhvbWUnKTtcbiAgICAvLyAgIGRpdi5hcHBlbmRDaGlsZChob21lSWNvbik7XG4gICAgLy8gICBzZXRUaW1lb3V0KCgpID0+IHtcbiAgICAvLyAgICAgZG9jdW1lbnRcbiAgICAvLyAgICAgICAucXVlcnlTZWxlY3RvcignI2hvbWUtbGFiZWwtJyArIGdyYXBoSWQpIVxuICAgIC8vICAgICAgIC5hZGRFdmVudExpc3RlbmVyKCdjbGljaycsIGZ1bmN0aW9uICgpIHtcbiAgICAvLyAgICAgICAgIF9zZWxmLmJ1aWxkKFxuICAgIC8vICAgICAgICAgICBXaWRnZXRUeXBlLkdSQVBILFxuICAgIC8vICAgICAgICAgICBPYmplY3QuYXNzaWduKE9iamVjdC5hc3NpZ24oe30sIF9zZWxmLmNoYXJ0c1tncmFwaElkXSksIHtcbiAgICAvLyAgICAgICAgICAgICBncmFwaERhdGE6IF9zZWxmLmNoYXJ0c1tncmFwaElkXS5wcmV2TGV2ZWxEYXRhWzBdLFxuICAgIC8vICAgICAgICAgICB9KVxuICAgIC8vICAgICAgICAgKTtcbiAgICAvLyAgICAgICB9KTtcbiAgICAvLyAgIH0sIDUwMCk7XG4gICAgLy8gfVxuICAgIGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3IoJyMnICsgZ3JhcGhJZCkhLmFwcGVuZENoaWxkKGRpdik7XG4gICAgdGhpcy5tYW5hZ2VCcmVhZENydW1iKGdyYXBoSWQsIHRoaXMpO1xuICAgIHNvcnRJY29uLmFkZEV2ZW50TGlzdGVuZXIoJ2NsaWNrJywgZnVuY3Rpb24gKGUpIHtcbiAgICAgIF9zZWxmLnNvcnRHcmFwaChlKTtcbiAgICB9KTtcbiAgICBkb3dubG9hZEljb24uYWRkRXZlbnRMaXN0ZW5lcignY2xpY2snLCBmdW5jdGlvbiAoZTogYW55KSB7XG4gICAgICBjb25zdCB0ZW1wQXJyID0gZS50YXJnZXQuaWQuc3BsaXQoJ0AnKTtcbiAgICAgIGNvbnN0IGdyYXBoSWQgPSB0ZW1wQXJyW3RlbXBBcnIubGVuZ3RoIC0gMV07XG4gICAgICBfc2VsZi5kb3dubG9hZEdyYXBoRGF0YShlLCAgT2JqZWN0LnZhbHVlcyhfc2VsZi5jaGFydHNbZ3JhcGhJZF0uZ3JhcGhEYXRhKS5mbGF0KCksX3NlbGYuY2hhcnRzW2dyYXBoSWRdLmxhc3RMZXZlbENvbHVtbnMpO1xuICAgIH0pO1xuICB9XG5cbiAgcHJpdmF0ZSBhcHBseUFnZ3JlZ2F0aW9uKFxuICAgIGFsbERhdGE6IGFueSxcbiAgICB5SW5kZXg6IG51bWJlcixcbiAgICBhZ2dyZWFnYXRpb25zOiBBZ2dyZWdhdGlvbkZ1bmN0aW9uW11cbiAgKSB7XG4gICAgbGV0IHJlc3VsdCA9IDA7XG4gICAgc3dpdGNoIChhZ2dyZWFnYXRpb25zW3lJbmRleF0uYWdncmVnYXRpb25GdW5jdGlvbnMpIHtcbiAgICAgIGNhc2UgJ1NVTScgLyogU1VNICovOlxuICAgICAgICByZXN1bHQgPSBsb2Rhc2guc3VtKGFsbERhdGEubWFwKE51bWJlcikpO1xuICAgICAgICBicmVhaztcbiAgICAgIGNhc2UgJ0NPVU5UX1VOSVFVRScgLyogQ09VTlRfVU5JUVVFICovOlxuICAgICAgICByZXN1bHQgPSBsb2Rhc2gudW5pcShhbGxEYXRhKS5sZW5ndGg7XG4gICAgICAgIGJyZWFrO1xuICAgICAgY2FzZSAnQ09VTlQnIC8qIENPVU5UICovOlxuICAgICAgICByZXN1bHQgPSBhbGxEYXRhLmxlbmd0aDtcbiAgICAgICAgYnJlYWs7XG4gICAgICBjYXNlICdNQVhJTVVNJyAvKiBNQVhJTVVNICovOlxuICAgICAgICByZXN1bHQgPSBsb2Rhc2gubWF4KGFsbERhdGEubWFwKE51bWJlcikpID8/IDA7XG4gICAgICAgIGJyZWFrO1xuICAgICAgY2FzZSAnTUlOSU1VTScgLyogTUlOSU1VTSAqLzpcbiAgICAgICAgcmVzdWx0ID0gbG9kYXNoLm1pbihhbGxEYXRhLm1hcChOdW1iZXIpKSA/PyAwO1xuICAgICAgICBicmVhaztcbiAgICAgIGNhc2UgJ0FWRVJBR0UnIC8qIEFWRVJBR0UgKi86XG4gICAgICAgIHJlc3VsdCA9IGxvZGFzaC5tZWFuKGFsbERhdGEubWFwKE51bWJlcikpO1xuICAgICAgICBicmVhaztcbiAgICB9XG4gICAgcmV0dXJuIHJlc3VsdDtcbiAgfVxuXG4gIHByaXZhdGUgYXBwbHlZZmlsdGVyKGQ6IGFueSwgeUluZGV4OiBudW1iZXIsIGdyYXBoSWQ6IHN0cmluZykge1xuICAgIGlmICh0aGlzLmNoYXJ0c1tncmFwaElkXS5maWx0ZXIueUF4aXMubGVuZ3RoID4gMCkge1xuICAgICAgY29uc3QgZmlsdGVyID0gdGhpcy5jaGFydHNbZ3JhcGhJZF0uZmlsdGVyLnlBeGlzLmZpbHRlcihcbiAgICAgICAgKHkpID0+IHRoaXMuY2hhcnRzW2dyYXBoSWRdLmNvbHVtbnNbeUluZGV4XSA9PSB5LnZhcmlhYmxlTmFtZVxuICAgICAgKTtcbiAgICAgIGlmIChmaWx0ZXIubGVuZ3RoID4gMCkge1xuICAgICAgICBzd2l0Y2ggKGZpbHRlclswXS5maWx0ZXJUeXBlKSB7XG4gICAgICAgICAgY2FzZSBGaWx0ZXJUeXBlcy5HUkVBVEVSX1RIQU46XG4gICAgICAgICAgICBpZiAoZC55IDwgZmlsdGVyWzBdLnZhbHVlc1swXSkge1xuICAgICAgICAgICAgICBkID0gbnVsbDtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgIGNhc2UgJzwnOlxuICAgICAgICAgICAgaWYgKGQueSA+IGZpbHRlclswXS52YWx1ZXNbMF0pIHtcbiAgICAgICAgICAgICAgZCA9IG51bGw7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBicmVhaztcbiAgICAgICAgICBjYXNlICc8PSc6XG4gICAgICAgICAgICBpZiAoIShkLnkgPD0gZmlsdGVyWzBdLnZhbHVlc1swXSkpIHtcbiAgICAgICAgICAgICAgZCA9IG51bGw7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBicmVhaztcbiAgICAgICAgICBjYXNlICc+PSc6XG4gICAgICAgICAgICBpZiAoIShkLnkgPj0gZmlsdGVyWzBdLnZhbHVlc1swXSkpIHtcbiAgICAgICAgICAgICAgZCA9IG51bGw7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBicmVhaztcbiAgICAgICAgICBjYXNlICc9PSc6XG4gICAgICAgICAgICBpZiAoZC55ICE9IGZpbHRlclswXS52YWx1ZXNbMF0pIHtcbiAgICAgICAgICAgICAgZCA9IG51bGw7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBicmVhaztcbiAgICAgICAgICBjYXNlICchPSc6XG4gICAgICAgICAgICBpZiAoZC55ID09IGZpbHRlclswXS52YWx1ZXNbMF0pIHtcbiAgICAgICAgICAgICAgZCA9IG51bGw7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBicmVhaztcbiAgICAgICAgICBjYXNlICdiZXQnOlxuICAgICAgICAgICAgaWYgKCEoZC55ID49IGZpbHRlclswXS52YWx1ZXNbMF0gJiYgZC55IDwgZmlsdGVyWzBdLnZhbHVlc1sxXSkpIHtcbiAgICAgICAgICAgICAgZCA9IG51bGw7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBicmVhaztcbiAgICAgICAgfVxuICAgICAgfVxuICAgIH1cbiAgICByZXR1cm4gZDtcbiAgfVxuXG4gIHByaXZhdGUgYXBwbHlYZmlsdGVyKFxuICAgIGVsOiBhbnksXG4gICAgZmlsdGVyczogRmlsdGVycyxcbiAgICByb3dzOiBzdHJpbmdbXSxcbiAgICBjb2x1bW5zOiBzdHJpbmdbXSxcbiAgICBjdXJyTGV2ZWw6IG51bWJlclxuICApIHtcbiAgICBpZiAoZmlsdGVycy54QXhpcy5sZW5ndGggPiAwKSB7XG4gICAgICBsZXQgaXNWYWxpZCA9IHRydWU7XG4gICAgICBjb25zdCBmaWx0ZXIgPSBmaWx0ZXJzLnhBeGlzLmZpbHRlcihcbiAgICAgICAgKGYpID0+IGYudmFyaWFibGVOYW1lID09IHJvd3NbY3VyckxldmVsXVxuICAgICAgKTtcbiAgICAgIGlmIChmaWx0ZXIubGVuZ3RoID4gMCkge1xuICAgICAgICBzd2l0Y2ggKGZpbHRlclswXS5maWx0ZXJUeXBlKSB7XG4gICAgICAgICAgY2FzZSBGaWx0ZXJUeXBlcy5JTjpcbiAgICAgICAgICAgIGlmIChmaWx0ZXJbMF0udmFsdWVzLmluZGV4T2YoZWwua2V5LnRvU3RyaW5nKCkpID09IC0xKSB7XG4gICAgICAgICAgICAgIGlzVmFsaWQgPSBmYWxzZTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgIGNhc2UgRmlsdGVyVHlwZXMuTk9UX0lOOlxuICAgICAgICAgICAgaWYgKGZpbHRlclswXS52YWx1ZXMuaW5kZXhPZihlbC5rZXkudG9TdHJpbmcoKSkgIT0gLTEpIHtcbiAgICAgICAgICAgICAgaXNWYWxpZCA9IGZhbHNlO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgY2FzZSBGaWx0ZXJUeXBlcy5HUkVBVEVSX1RIQU46XG4gICAgICAgICAgICBpZiAoZWwua2V5IDw9IGZpbHRlclswXS52YWx1ZXNbMF0pIHtcbiAgICAgICAgICAgICAgaXNWYWxpZCA9IGZhbHNlO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgY2FzZSBGaWx0ZXJUeXBlcy5MRVNTX1RIQU46XG4gICAgICAgICAgICBpZiAoZWwua2V5ID49IGZpbHRlclswXS52YWx1ZXNbMF0pIHtcbiAgICAgICAgICAgICAgaXNWYWxpZCA9IGZhbHNlO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgY2FzZSBGaWx0ZXJUeXBlcy5MRVNTX1RIQU5fRVFVQUw6XG4gICAgICAgICAgICBpZiAoZWwua2V5ID4gZmlsdGVyWzBdLnZhbHVlc1swXSkge1xuICAgICAgICAgICAgICBpc1ZhbGlkID0gZmFsc2U7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBicmVhaztcbiAgICAgICAgICBjYXNlIEZpbHRlclR5cGVzLkdSRUFURVJfVEhBTl9FUVVBTDpcbiAgICAgICAgICAgIGlmIChlbC5rZXkgPCBmaWx0ZXJbMF0udmFsdWVzWzBdKSB7XG4gICAgICAgICAgICAgIGlzVmFsaWQgPSBmYWxzZTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgIGNhc2UgRmlsdGVyVHlwZXMuRVFVQUw6XG4gICAgICAgICAgICBpZiAoZWwua2V5ICE9IGZpbHRlclswXS52YWx1ZXNbMF0pIHtcbiAgICAgICAgICAgICAgaXNWYWxpZCA9IGZhbHNlO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgY2FzZSBGaWx0ZXJUeXBlcy5OT1RfRVFVQUw6XG4gICAgICAgICAgICBpZiAoZWwua2V5ID09IGZpbHRlclswXS52YWx1ZXNbMF0pIHtcbiAgICAgICAgICAgICAgaXNWYWxpZCA9IGZhbHNlO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgY2FzZSBGaWx0ZXJUeXBlcy5CRVRXRUVOX1JBTkdFOlxuICAgICAgICAgICAgaWYgKGVsLmtleSA8IGZpbHRlclswXS52YWx1ZXNbMF0gJiYgZWwua2V5ID49IGZpbHRlclswXS52YWx1ZXNbMV0pIHtcbiAgICAgICAgICAgICAgaXNWYWxpZCA9IGZhbHNlO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgY2FzZSBGaWx0ZXJUeXBlcy5CRUZPUkU6XG4gICAgICAgICAgICBpZiAoZmlsdGVyWzBdLnZhcmlhYmxlVHlwZSA9PSBEYXRhVHlwZS5EQVRFKSB7XG4gICAgICAgICAgICAgIGxldCBvcGVyYW5kMSA9IHRoaXMuZ2V0Rm9ybWF0dGVkRGF0ZShlbC5rZXksIGZpbHRlclswXS5mb3JtYXQpO1xuICAgICAgICAgICAgICBsZXQgb3BlcmFuZDIgPSBuZXcgRGF0ZShmaWx0ZXJbMF0udmFsdWVzWzBdKTtcbiAgICAgICAgICAgICAgaWYgKG9wZXJhbmQxID4gb3BlcmFuZDIpIHtcbiAgICAgICAgICAgICAgICBpc1ZhbGlkID0gZmFsc2U7XG4gICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgIGxldCBjdXJyU2Vjb25kcyA9IHRoaXMuZ2V0Rm9ybWF0dGVkRGF0ZShlbC5rZXksIGZpbHRlclswXS5mb3JtYXQpO1xuICAgICAgICAgICAgICBsZXQgW2hvdXIsIG1pbl0gPSBmaWx0ZXJbMF0udmFsdWVzWzBdXG4gICAgICAgICAgICAgICAgLnNwbGl0KCc6JylcbiAgICAgICAgICAgICAgICAubWFwKChlbDogYW55KSA9PiBwYXJzZUludChlbCkpO1xuICAgICAgICAgICAgICBsZXQgY29tcGFyZWRTZWMgPSBob3VyICogNjAgKiA2MCArIG1pbiAqIDYwO1xuICAgICAgICAgICAgICBpZiAoY3VyclNlY29uZHMgPiBjb21wYXJlZFNlYykge1xuICAgICAgICAgICAgICAgIGlzVmFsaWQgPSBmYWxzZTtcbiAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgY2FzZSBGaWx0ZXJUeXBlcy5BRlRFUjpcbiAgICAgICAgICAgIGlmIChmaWx0ZXJbMF0udmFyaWFibGVUeXBlID09IERhdGFUeXBlLkRBVEUpIHtcbiAgICAgICAgICAgICAgbGV0IG9wZXJhbmQxID0gdGhpcy5nZXRGb3JtYXR0ZWREYXRlKGVsLmtleSwgZmlsdGVyWzBdLmZvcm1hdCk7XG4gICAgICAgICAgICAgIGxldCBvcGVyYW5kMiA9IG5ldyBEYXRlKGZpbHRlclswXS52YWx1ZXNbMF0pO1xuICAgICAgICAgICAgICBpZiAob3BlcmFuZDEgPCBvcGVyYW5kMikge1xuICAgICAgICAgICAgICAgIGlzVmFsaWQgPSBmYWxzZTtcbiAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgbGV0IGN1cnJTZWNvbmRzID0gdGhpcy5nZXRGb3JtYXR0ZWREYXRlKGVsLmtleSwgZmlsdGVyWzBdLmZvcm1hdCk7XG4gICAgICAgICAgICAgIGxldCBbaG91ciwgbWluXSA9IGZpbHRlclswXS52YWx1ZXNbMF1cbiAgICAgICAgICAgICAgICAuc3BsaXQoJzonKVxuICAgICAgICAgICAgICAgIC5tYXAoKGVsOiBhbnkpID0+IHBhcnNlSW50KGVsKSk7XG4gICAgICAgICAgICAgIGxldCBjb21wYXJlZFNlYyA9IGhvdXIgKiA2MCAqIDYwICsgbWluICogNjA7XG4gICAgICAgICAgICAgIGlmIChjdXJyU2Vjb25kcyA8IGNvbXBhcmVkU2VjKSB7XG4gICAgICAgICAgICAgICAgaXNWYWxpZCA9IGZhbHNlO1xuICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBicmVhaztcbiAgICAgICAgICBjYXNlIEZpbHRlclR5cGVzLkJFVFdFRU46XG4gICAgICAgICAgICBpZiAoZmlsdGVyWzBdLnZhcmlhYmxlVHlwZSA9PSBEYXRhVHlwZS5EQVRFKSB7XG4gICAgICAgICAgICAgIGxldCBvcGVyYW5kMSA9IHRoaXMuZ2V0Rm9ybWF0dGVkRGF0ZShlbC5rZXksIGZpbHRlclswXS5mb3JtYXQpO1xuICAgICAgICAgICAgICBsZXQgb3BlcmFuZDIgPSBuZXcgRGF0ZShmaWx0ZXJbMF0udmFsdWVzWzBdKTtcbiAgICAgICAgICAgICAgbGV0IG9wZXJhbmQzID0gbmV3IERhdGUoZmlsdGVyWzBdLnZhbHVlc1sxXSk7XG4gICAgICAgICAgICAgIGlmIChvcGVyYW5kMSA8IG9wZXJhbmQyICYmIG9wZXJhbmQxID49IG9wZXJhbmQzKSB7XG4gICAgICAgICAgICAgICAgaXNWYWxpZCA9IGZhbHNlO1xuICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICBsZXQgY3VyclNlY29uZHMgPSB0aGlzLmdldEZvcm1hdHRlZERhdGUoZWwua2V5LCBmaWx0ZXJbMF0uZm9ybWF0KTtcbiAgICAgICAgICAgICAgbGV0IFtob3VyLCBtaW5dID0gZmlsdGVyWzBdLnZhbHVlc1swXVxuICAgICAgICAgICAgICAgIC5zcGxpdCgnOicpXG4gICAgICAgICAgICAgICAgLm1hcCgoZWw6IGFueSkgPT4gcGFyc2VJbnQoZWwpKTtcbiAgICAgICAgICAgICAgbGV0IFtlbmRob3VyLCBlbmRtaW5dID0gZmlsdGVyWzBdLnZhbHVlc1sxXVxuICAgICAgICAgICAgICAgIC5zcGxpdCgnOicpXG4gICAgICAgICAgICAgICAgLm1hcCgoZWw6IGFueSkgPT4gcGFyc2VJbnQoZWwpKTtcbiAgICAgICAgICAgICAgbGV0IGNvbXBhcmVkU2VjID0gaG91ciAqIDYwICogNjAgKyBtaW4gKiA2MDtcbiAgICAgICAgICAgICAgbGV0IGVuZENvbXBhcmVkU2VjID0gZW5kaG91ciAqIDYwICogNjAgKyBlbmRtaW4gKiA2MDtcbiAgICAgICAgICAgICAgaWYgKGN1cnJTZWNvbmRzIDwgY29tcGFyZWRTZWMgJiYgY3VyclNlY29uZHMgPj0gZW5kQ29tcGFyZWRTZWMpIHtcbiAgICAgICAgICAgICAgICBpc1ZhbGlkID0gZmFsc2U7XG4gICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICB9XG4gICAgICB9XG5cbiAgICAgIHJldHVybiBpc1ZhbGlkO1xuICAgIH0gZWxzZSB7XG4gICAgICByZXR1cm4gdHJ1ZVxuICAgIH1cbiAgfVxuXG4gIHByaXZhdGUgZ2V0RHJpbGxEb3duRGF0YShcbiAgICBzZWxLZXk6IGFueSxcbiAgICBkYXRhOiBhbnksXG4gICAgZ3JhcGhJZDogYW55LFxuICAgIGNvbElkOiBhbnkgPSBudWxsXG4gICkge1xuICAgIGxldCBncmFwaFNlcmllczogYW55ID0gW107IC8vU2VyaWVzIE9iamVjdFxuICAgIGxvZGFzaC5mb3JFYWNoKHRoaXMuY2hhcnRzW2dyYXBoSWRdLmNvbHVtbnMsICh5OiBhbnksIHlJbmRleDogYW55KSA9PiB7XG4gICAgICBpZiAoXG4gICAgICAgICh0aGlzLmNoYXJ0c1tncmFwaElkXS5jb2xUb1Nob3cgPT0gJycgfHxcbiAgICAgICAgICB5ID09IHRoaXMuY2hhcnRzW2dyYXBoSWRdLmNvbFRvU2hvdylcbiAgICAgICkge1xuICAgICAgICBjb25zdCBmdW5jID1cbiAgICAgICAgICB0aGlzLmNoYXJ0c1tncmFwaElkXS5hZ2dyZWdhdGlvbkZ1bmN0aW9uc1t5SW5kZXhdXG4gICAgICAgICAgICAuYWdncmVnYXRpb25GdW5jdGlvbnM7XG4gICAgICAgIGNvbnN0IHNlcmllc0RhdGE6IGFueSA9IFtdOyAvL2RhdGEgb2JqZWN0IGZvciBzZXJpZXNcbiAgICAgICAgbG9kYXNoLmZvckVhY2goT2JqZWN0LmtleXMoZGF0YSksIChlbDogYW55KSA9PiB7XG4gICAgICAgICAgLy9GaWx0ZXIgQWNjb3JkaW5nIHRvIHgtYXhpc1xuICAgICAgICAgIGxldCB2YWxpZEtleSA9IHRoaXMuYXBwbHlYZmlsdGVyKFxuICAgICAgICAgICAgICB7XG4gICAgICAgICAgICAgICAga2V5OiBlbCxcbiAgICAgICAgICAgICAgICBkYXRhOiBkYXRhW2VsXSxcbiAgICAgICAgICAgICAgfSxcbiAgICAgICAgICAgICAgdGhpcy5jaGFydHNbZ3JhcGhJZF0uZmlsdGVyLFxuICAgICAgICAgICAgICB0aGlzLmNoYXJ0c1tncmFwaElkXS5yb3dzLFxuICAgICAgICAgICAgICB0aGlzLmNoYXJ0c1tncmFwaElkXS5jb2x1bW5zLFxuICAgICAgICAgICAgICB0aGlzLmNoYXJ0c1tncmFwaElkXS5jdXJyTGV2ZWxcbiAgICAgICAgICAgICk7XG4gICAgICAgICAgZGF0YVtlbF0gPSB0aGlzLmFwcGx5RGF0YUZpbHRlcihkYXRhW2VsXSx0aGlzLmNoYXJ0c1tncmFwaElkXS5maWx0ZXIsdGhpcy5jaGFydHNbZ3JhcGhJZF0uY29sdW1ucywgZ3JhcGhJZClbeV07XG4gICAgICAgICAgaWYodmFsaWRLZXkgJiYgZGF0YVtlbF0gIT0gbnVsbCl7XG5cbiAgICAgICAgICAgIC8vQWRkIEN1c3RvbSBWYXJpYWJsZVxuICAgICAgICAgICAgZGF0YVtlbF0gPSB0aGlzLmFkZEN1c3RvbVZhcmlhYmxlKFxuICAgICAgICAgICAgICB0aGlzLmNoYXJ0c1tncmFwaElkXS5jdXN0b21WYXJpYWJsZSxcbiAgICAgICAgICAgICAgZGF0YVtlbF0sXG4gICAgICAgICAgICAgIGZhbHNlLFxuICAgICAgICAgICAgICB0aGlzLmNoYXJ0c1tncmFwaElkXS5kYXRhRm9ybWF0LFxuICAgICAgICAgICAgICBmYWxzZVxuICAgICAgICAgICAgKTtcbiAgICAgICAgICAgIC8vR2V0dGluZyBEYXRhIEFycmF5IHRvIGFnZ3JlZ2F0ZVxuICAgICAgICAgICAgbGV0IHZhcmlhYmxlVHlwZSA9IHRoaXMuZ2V0VmFyaWFibGVUeXBlQnlIZWFkZXIoeSwgdGhpcy5jaGFydHNbZ3JhcGhJZF0uZGF0YUZvcm1hdCk7XG4gICAgICAgICAgICBsZXQgdHlwZSA9IFwic3RyaW5nXCI7XG4gICAgICAgICAgICBpZih2YXJpYWJsZVR5cGUgPT0gbnVsbCl7XG4gICAgICAgICAgICAgIHR5cGUgPSB0aGlzLmdldFZhcmlhYmxlRGF0YShkYXRhW2VsXVswXVt5XSlbMF07XG4gICAgICAgICAgICB9ZWxzZXtcbiAgICAgICAgICAgICAgdHlwZSA9IHZhcmlhYmxlVHlwZS50eXBlO1xuICAgICAgICAgICAgfVxuICBcbiAgICAgICAgICAgIGxldCBkYXRhVG9UcmF2ZXJzZSA9IGxvZGFzaC5tYXAoZGF0YVtlbF0sIChlbERhdGEpID0+IHtcbiAgICAgICAgICAgICAgcmV0dXJuIHR5cGUgIT0gXCJudW1iZXJcIiA/IGVsRGF0YVt5XSA6IHBhcnNlRmxvYXQoZWxEYXRhW3ldKTtcbiAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgZGF0YVRvVHJhdmVyc2UgPSBsb2Rhc2gud2l0aG91dChsb2Rhc2gud2l0aG91dChkYXRhVG9UcmF2ZXJzZSwgdW5kZWZpbmVkKSwgJycpO1xuICAgICAgICAgICAgbGV0IGdlbkRhdGEgPSB7XG4gICAgICAgICAgICAgIG5hbWU6IGVsLFxuICAgICAgICAgICAgICBkYXRhTGFiZWxzOiB7XG4gICAgICAgICAgICAgICAgc2hhZG93OiBmYWxzZSxcbiAgICAgICAgICAgICAgICBzdHlsZToge1xuICAgICAgICAgICAgICAgICAgY29sb3I6ICdibGFjaycsXG4gICAgICAgICAgICAgICAgICB0ZXh0RGVjb3JhdGlvbjogJ25vbmUnLFxuICAgICAgICAgICAgICAgICAgdGV4dFNoYWRvdzogZmFsc2UsXG4gIFxuICAgICAgICAgICAgICAgICAgdGV4dE91dGxpbmU6IDAsXG4gICAgICAgICAgICAgICAgfSxcbiAgICAgICAgICAgICAgICBjbGFzc05hbWU6ICdncmFwaC1kYXRhLWxhYmVsJyxcbiAgICAgICAgICAgICAgfSxcbiAgICAgICAgICAgICAgZHJpbGxkb3duOiB0cnVlLFxuICAgICAgICAgICAgICBncmFwaElkOiBncmFwaElkLFxuICAgICAgICAgICAgICBjb2xJbmRleDogeUluZGV4LFxuICAgICAgICAgICAgICBsZXZlbDogdGhpcy5jaGFydHNbZ3JhcGhJZF0uY3VyckxldmVsLFxuICAgICAgICAgICAgICB5OiBwYXJzZUZsb2F0KFxuICAgICAgICAgICAgICAgIC8vIG5ldyBEZWNpbWFsKFxuICAgICAgICAgICAgICAgICAgdGhpcy5jaGFydHNbZ3JhcGhJZF0uYWdncmVnYXRpb25GdW5jdGlvbnNbeUluZGV4XVxuICAgICAgICAgICAgICAgICAgICAuYWdncmVnYXRpb25GdW5jdGlvbnMgPT0gQWdncmVnYXRpb25GdW5jdGlvbnNUeXBlLk5PX0ZVTkNUSU9OXG4gICAgICAgICAgICAgICAgICAgID8gbmV3IEJpZ051bWJlcihcbiAgICAgICAgICAgICAgICAgICAgICAgIGRhdGFUb1RyYXZlcnNlLmxlbmd0aCA9PSAwXG4gICAgICAgICAgICAgICAgICAgICAgICAgID8gMFxuICAgICAgICAgICAgICAgICAgICAgICAgICA6IGxvZGFzaC5tYXgoZGF0YVRvVHJhdmVyc2UpXG4gICAgICAgICAgICAgICAgICAgICAgKS50b1N0cmluZygpIC8vR2V0dGluZyBNYXggVmFsdWUgb2YgRGF0YSBBcnJcbiAgICAgICAgICAgICAgICAgICAgOiB0aGlzLmFwcGx5QWdncmVnYXRpb24oXG4gICAgICAgICAgICAgICAgICAgICAgICBkYXRhVG9UcmF2ZXJzZSxcbiAgICAgICAgICAgICAgICAgICAgICAgIHlJbmRleCxcbiAgICAgICAgICAgICAgICAgICAgICAgIHRoaXMuY2hhcnRzW2dyYXBoSWRdLmFnZ3JlZ2F0aW9uRnVuY3Rpb25zXG4gICAgICAgICAgICAgICAgICAgICAgLy8gKSAvLyBHZXR0aW5nIEFnZ3JlZ2F0ZWQgVmFsdWVcbiAgICAgICAgICAgICAgICApLnRvUHJlY2lzaW9uKDIpXG4gICAgICAgICAgICAgICksXG4gICAgICAgICAgICB9O1xuICAgICAgICAgICAgLy9BcHBseWluZyBBZnRlciBBZ2dyZWdhdGlvbiBGaWx0ZXJcbiAgICAgICAgICAgIGxldCBhZnRlcllyZXN1bHQgPSB0aGlzLmFwcGx5WWZpbHRlcihnZW5EYXRhLCB5SW5kZXgsIGdyYXBoSWQpO1xuICAgICAgICAgICAgaWYgKGFmdGVyWXJlc3VsdCAhPSBudWxsKSB7XG4gICAgICAgICAgICAgIHNlcmllc0RhdGEucHVzaChhZnRlcllyZXN1bHQpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgIH1cbiAgICAgICAgfSk7XG4gICAgICAgICBncmFwaFNlcmllcy5wdXNoKHtcbiAgICAgICAgICBuYW1lOlxuICAgICAgICAgICAgc2VsS2V5ID09IG51bGwgfHwgdGhpcy5jaGFydHNbZ3JhcGhJZF0uY29sdW1ucy5sZW5ndGggPiAxXG4gICAgICAgICAgICAgID8gZnVuYyAhPSAnTk8gRlVOQ1RJT04nXG4gICAgICAgICAgICAgICAgPyBmdW5jICsgJygnICsgeSArICcpJ1xuICAgICAgICAgICAgICAgIDogeVxuICAgICAgICAgICAgICA6IHNlbEtleSxcbiAgICAgICAgICBjb2xvcjogdGhpcy5jaGFydHNbZ3JhcGhJZF0uY29sb3JzW3lJbmRleF0sXG4gICAgICAgICAgZ3JhcGhJZDogZ3JhcGhJZCxcbiAgICAgICAgICBjb2xJbmRleDogeUluZGV4LFxuICAgICAgICAgIGxldmVsOiB0aGlzLmNoYXJ0c1tncmFwaElkXS5jdXJyTGV2ZWwsXG4gICAgICAgICAgdHlwZTpcbiAgICAgICAgICAgIHRoaXMuY2hhcnRzW2dyYXBoSWRdLmdyYXBoVHlwZXNbeUluZGV4XSA9PSAnc3RhY2tlZC1iYXInIHx8XG4gICAgICAgICAgICB0aGlzLmNoYXJ0c1tncmFwaElkXS5ncmFwaFR5cGVzW3lJbmRleF0gPT0gJ3N0YWNrZWQtYmFyJSdcbiAgICAgICAgICAgICAgPyAnYmFyJ1xuICAgICAgICAgICAgICA6IHRoaXMuY2hhcnRzW2dyYXBoSWRdLmdyYXBoVHlwZXNbeUluZGV4XSA9PSAnc3RhY2tlZC1jb2x1bW4nIHx8XG4gICAgICAgICAgICAgICAgdGhpcy5jaGFydHNbZ3JhcGhJZF0uZ3JhcGhUeXBlc1t5SW5kZXhdID09ICdzdGFja2VkLWNvbHVtbiUnXG4gICAgICAgICAgICAgID8gJ2NvbHVtbidcbiAgICAgICAgICAgICAgOiB0aGlzLmNoYXJ0c1tncmFwaElkXS5ncmFwaFR5cGVzW3lJbmRleF0sXG4gICAgICAgICAgZGF0YTogc2VyaWVzRGF0YSxcbiAgICAgICAgfSk7XG4gICAgICB9XG4gICAgfSk7XG4gICAgLy9BcHBseSBTb3J0aW5nIG92ZXIgc2VyaWVzXG4gICAgcmV0dXJuIHRoaXMuYXBwbHlTb3J0KGdyYXBoSWQsIGdyYXBoU2VyaWVzKTtcbiAgfVxuXG4gIC8vVG8gYmUgY2hlY2tlZFxuICBwcml2YXRlIGFwcGx5U29ydChncmFwaElkOiBzdHJpbmcsIGRhdGE6IGFueSkge1xuICAgIGlmIChkYXRhID09IG51bGwpIHtcbiAgICAgIHJldHVybiBbXTtcbiAgICB9XG4gICAgaWYgKHRoaXMuY2hhcnRzW2dyYXBoSWRdLm9yZGVyID09IDEpIHtcbiAgICAgIC8vU29ydCBEYXRhIGluIGRlc2NlbmRpbmcgb3JkZXJcbiAgICAgIHJldHVybiBsb2Rhc2gubWFwKGRhdGEsIChlbCkgPT4ge1xuICAgICAgICBlbC5kYXRhID0gZWwuZGF0YS5zb3J0KChkMTogYW55LCBkMjogYW55KSA9PiB7XG4gICAgICAgICAgaWYgKGQxLnkgPiBkMi55KSB7XG4gICAgICAgICAgICByZXR1cm4gLTE7XG4gICAgICAgICAgfVxuICAgICAgICAgIHJldHVybiAxO1xuICAgICAgICB9KTtcbiAgICAgICAgcmV0dXJuIGVsO1xuICAgICAgfSk7XG4gICAgfSBlbHNlIGlmICh0aGlzLmNoYXJ0c1tncmFwaElkXS5vcmRlciA9PSAtMSkge1xuICAgICAgLy9Tb3J0IERhdGEgaW4gYXNjZW5kaW5nIG9yZGVyXG4gICAgICByZXR1cm4gbG9kYXNoLm1hcChkYXRhLCAoZWwpID0+IHtcbiAgICAgICAgZWwuZGF0YSA9IGVsLmRhdGEuc29ydCgoZDE6IGFueSwgZDI6IGFueSkgPT4ge1xuICAgICAgICAgIGlmIChkMS55ID4gZDIueSkge1xuICAgICAgICAgICAgcmV0dXJuIDE7XG4gICAgICAgICAgfVxuICAgICAgICAgIHJldHVybiAtMTtcbiAgICAgICAgfSk7XG4gICAgICAgIHJldHVybiBlbDtcbiAgICAgIH0pO1xuICAgIH0gZWxzZSB7XG4gICAgICByZXR1cm4gZGF0YS5tYXAoKGVsOiBhbnkpID0+IHtcbiAgICAgICAgaWYgKGVsLmRhdGEubGVuZ3RoID4gMCkge1xuICAgICAgICAgIGxldCB0eXBlID0gdGhpcy5nZXRWYXJpYWJsZURhdGEoXG4gICAgICAgICAgICBlbC5kYXRhWzBdW3RoaXMuY2hhcnRzW2dyYXBoSWRdLnJvd3NbMF1dXG4gICAgICAgICAgKTtcbiAgICAgICAgICBpZiAodHlwZVswXSA9PSAnc3RyaW5nJyB8fCB0eXBlWzBdID09ICdudW1iZXInKSB7XG4gICAgICAgICAgICBlbC5kYXRhID0gZWwuZGF0YS5zb3J0KChkMTogYW55LCBkMjogYW55KSA9PiB7XG4gICAgICAgICAgICAgIGlmIChkMS5uYW1lID4gZDIubmFtZSkge1xuICAgICAgICAgICAgICAgIHJldHVybiAxO1xuICAgICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgIHJldHVybiAtMTtcbiAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfSk7XG4gICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIGVsLmRhdGEgPSBlbC5kYXRhLnNvcnQoKGQxOiBhbnksIGQyOiBhbnkpID0+IHtcbiAgICAgICAgICAgICAgaWYgKG5ldyBEYXRlKGQxLm5hbWUpLmdldFRpbWUoKSA+IG5ldyBEYXRlKGQyLm5hbWUpLmdldFRpbWUoKSkge1xuICAgICAgICAgICAgICAgIHJldHVybiAxO1xuICAgICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgIHJldHVybiAtMTtcbiAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfSk7XG4gICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICAgIHJldHVybiBlbDtcbiAgICAgIH0pO1xuICAgIH1cbiAgfVxuXG4gIHByaXZhdGUgZ2V0VmFyaWFibGVEYXRhKGlucHV0OiBhbnkpIHtcbiAgICBpZiAodGhpcy52YWxpZGF0ZVRpbWUoaW5wdXQpKSB7XG4gICAgICBsZXQgdHlwZSA9IERhdGFUeXBlLlRJTUU7XG4gICAgICByZXR1cm4gW3R5cGVdO1xuICAgIH0gZWxzZSBpZiAodGhpcy5jaGVja0RhdGUoaW5wdXQpKSB7XG4gICAgICBsZXQgdHlwZSA9IERhdGFUeXBlLkRBVEU7XG4gICAgICByZXR1cm4gW3R5cGVdO1xuICAgIH0gZWxzZSBpZiAodGhpcy52YWxpZGF0ZU51bWJlcihpbnB1dCkpIHtcbiAgICAgIGxldCB0eXBlID0gRGF0YVR5cGUuTlVNQkVSO1xuICAgICAgcmV0dXJuIFt0eXBlXTtcbiAgICB9IGVsc2Uge1xuICAgICAgbGV0IHR5cGUgPSBEYXRhVHlwZS5TVFJJTkc7XG4gICAgICByZXR1cm4gW3R5cGVdO1xuICAgIH1cbiAgfVxuXG4gIHByaXZhdGUgZ2V0VmFyaWFibGVUeXBlQnlIZWFkZXIoaGVhZGVyOiBhbnksIGZvcm1hdDogYW55KSB7XG4gICAgbGV0IGZvcm1hdEV4aXN0ID0gZm9ybWF0LmZpbHRlcihcbiAgICAgIChmb3JtYXQ6IGFueSkgPT4gZm9ybWF0Lm5hbWUudG9Mb3dlckNhc2UoKSA9PSBoZWFkZXIudG9Mb3dlckNhc2UoKVxuICAgICk7XG4gICAgaWYgKGZvcm1hdEV4aXN0Lmxlbmd0aCA+IDApIHtcbiAgICAgIHJldHVybiB7XG4gICAgICAgIHR5cGU6IGZvcm1hdEV4aXN0WzBdLnR5cGUsXG4gICAgICAgIGZvcm1hdDogZm9ybWF0RXhpc3RbMF0uZm9ybWF0LFxuICAgICAgfTtcbiAgICB9IGVsc2Uge1xuICAgICAgcmV0dXJuIHtcbiAgICAgICAgdHlwZTogRGF0YVR5cGUuU1RSSU5HLFxuICAgICAgICBmb3JtYXQ6ICcnLFxuICAgICAgfTtcbiAgICB9XG4gIH1cblxuICBwcml2YXRlIHZhbGlkYXRlVGltZShpbnB1dDogYW55KSB7XG4gICAgbGV0IHBhdHRlcm4xID0gL14oMVswLTJdfDA/WzEtOV0pOihbMC01XT9bMC05XSk6KFswLTVdP1swLTldKSAo4pePP1tBUF1NKT8kLztcbiAgICBsZXQgcGF0dGVybjIgPSAvXigxWzAtMl18MD9bMS05XSk6KFswLTVdP1swLTldKTooWzAtNV0/WzAtOV0pICjil48/W2FwXW0pPyQvO1xuICAgIGxldCBwYXR0ZXJuMyA9IC9eKDFbMC0yXXwwP1sxLTldKTooWzAtNV0/WzAtOV0pICjil48/W0FQXU0pPyQvO1xuICAgIGxldCBwYXR0ZXJuNCA9IC9eKDFbMC0yXXwwP1sxLTldKTooWzAtNV0/WzAtOV0pICjil48/W2FwXW0pPyQvO1xuICAgIGxldCBwYXR0ZXJuNSA9IC9eKDJbMC0zXXxbMDFdP1swLTldKTooWzAtNV0/WzAtOV0pOihbMC01XT9bMC05XSkkLztcbiAgICBsZXQgcGF0dGVybjYgPSAvXigyWzAtM118WzAxXT9bMC05XSk6KFswLTVdP1swLTldKSQvO1xuXG4gICAgcmV0dXJuIChcbiAgICAgIHBhdHRlcm4xLnRlc3QoaW5wdXQpIHx8XG4gICAgICBwYXR0ZXJuMi50ZXN0KGlucHV0KSB8fFxuICAgICAgcGF0dGVybjMudGVzdChpbnB1dCkgfHxcbiAgICAgIHBhdHRlcm40LnRlc3QoaW5wdXQpIHx8XG4gICAgICBwYXR0ZXJuNS50ZXN0KGlucHV0KSB8fFxuICAgICAgcGF0dGVybjYudGVzdChpbnB1dClcbiAgICApO1xuICB9XG5cbiAgcHJpdmF0ZSB2YWxpZGF0ZU51bWJlcihlOiBhbnkpIHtcbiAgICBjb25zdCBwYXR0ZXJuMiA9IC9eWy0rXT9bMC05XStcXC5bMC05XSskLztcbiAgICBjb25zdCBwYXR0ZXJuID0gL15bLStdP1swLTldKyQvO1xuXG4gICAgcmV0dXJuIHBhdHRlcm4udGVzdChlKSB8fCBwYXR0ZXJuMi50ZXN0KGUpO1xuICB9XG5cbiAgcHJpdmF0ZSBjaGVja0RhdGUoaW5wdXQ6IGFueSkge1xuICAgIGNvbnN0IHBhdHRlcm4gPVxuICAgICAgL14oWzAtMl1cXGR8WzNdWzAtMV0pXFwtKFswXVxcZHxbMV1bMC0yXSlcXC0oWzJdWzAxXXxbMV1bNi05XSlcXGR7Mn0oXFxzKFswLTFdXFxkfFsyXVswLTNdKShcXDpbMC01XVxcZCl7MSwyfSk/JC87XG4gICAgcmV0dXJuIHBhdHRlcm4udGVzdChpbnB1dCk7XG4gIH1cblxuICBwcml2YXRlIGFkZEN1c3RvbVZhcmlhYmxlKFxuICAgIGN1c3RvbVZhcmlhYmxlOiBEZXJpdmVkVmFyaWFibGVbXSxcbiAgICBhbGxEYXRhOiBhbnksXG4gICAgYWRkU2xhYjogYm9vbGVhbiA9IGZhbHNlLFxuICAgIGRhdGFGb3JtYXQ6IERhdGFGb3JtYXRbXSxcbiAgICB3aXRob3V0QWdnOiBCb29sZWFuXG4gICkge1xuICAgIGxldCByZXN1bHRhbnREYXRhID0gWy4uLmFsbERhdGFdO1xuICAgIGlmICghYWRkU2xhYikge1xuICAgICAgY3VzdG9tVmFyaWFibGUgPSBjdXN0b21WYXJpYWJsZS5maWx0ZXIoKHZhcmlhYmxlKSA9PiAhdmFyaWFibGUuaXNfc2xhYik7XG4gICAgfVxuICAgIGxvZGFzaC5mb3JFYWNoKGN1c3RvbVZhcmlhYmxlLCAodmFyaWFibGUsIGluZGV4KSA9PiB7XG4gICAgICAgIGlmICh2YXJpYWJsZS5pc19maWx0ZXIpIHtcbiAgICAgICAgICAvL0NoZWNrIHZhbGlkaXR5IG92ZXIgYWxsIGZpbHRlcnNcbiAgICAgICAgICBsb2Rhc2guZm9yRWFjaCh2YXJpYWJsZS5maWx0ZXJzLCAoZmlsdGVyOiBEZXJpdmVkVmFyaWFibGVGaWx0ZXIpID0+IHtcbiAgICAgICAgICAgIGxldCByZXNpZGluZ0RhdGE6IGFueSA9IFtdOyAvL0RhdGEgd2hlcmUgZmlsdGVyIGlzIG5vdCBhcHBsaWNhYmxlXG4gICAgICAgICAgICBsZXQgZmlsdGVyZWREYXRhOiBhbnkgPSBbXTtcbiAgICAgICAgICAgIGZpbHRlcmVkRGF0YSA9IFsuLi5yZXN1bHRhbnREYXRhXTsgLy9EYXRhIHdoZXJlIGZpbHRlciBpcyBhcHBsaWNhYmxlXG4gICAgICAgICAgICBsZXQgZGF0YVRvVHJhdmVyc2U6IGFueSA9IG51bGw7XG4gICAgICAgICAgICBpZihmaWx0ZXIuaXNDdXN0b21WYWx1ZSB8fCAhd2l0aG91dEFnZyl7XG4gICAgICAgICAgICAgIGxvZGFzaC5mb3JFYWNoKFxuICAgICAgICAgICAgICAgIGZpbHRlci5jb25kaXRpb25zLFxuICAgICAgICAgICAgICAgIChjb25kaXRpb246IERlcml2ZWRWYXJpYWJsZUZpbHRlckNvbmRpdGlvbiwgaSkgPT4ge1xuICAgICAgICAgICAgICAgICAgbGV0IHZhcmlhYmxlSW5mbyA6IGFueSA9IG51bGw7XG4gICAgICAgICAgICAgICAgICBsZXQgdGVtcFJlc2lkaW5nTGlzdCA9IFtdO1xuICAgICAgICAgICAgICAgICAgc3dpdGNoIChjb25kaXRpb24ub3BlcmF0b3IpIHtcbiAgICAgICAgICAgICAgICAgICAgY2FzZSBGaWx0ZXJUeXBlcy5JTjpcbiAgICAgICAgICAgICAgICAgICAgICBbZmlsdGVyZWREYXRhLCB0ZW1wUmVzaWRpbmdMaXN0XSA9IGxvZGFzaC5yZWR1Y2UoXG4gICAgICAgICAgICAgICAgICAgICAgICBsb2Rhc2guY2xvbmVEZWVwKGZpbHRlcmVkRGF0YSksXG4gICAgICAgICAgICAgICAgICAgICAgICAocmVzdWx0OiBhbnksIGVsRGF0YSkgPT4ge1xuICAgICAgICAgICAgICAgICAgICAgICAgICBpZiAoIU9iamVjdC5rZXlzKGVsRGF0YSkuaW5jbHVkZXModmFyaWFibGUubmFtZSkpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBlbERhdGFbdmFyaWFibGUubmFtZV0gPSAwO1xuICAgICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgICAgIHJlc3VsdFtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBlbERhdGFbY29uZGl0aW9uLnZhcmlhYmxlLm5hbWVdICE9IG51bGwgJiYgY29uZGl0aW9uLmNvbXBhcmF0aXZlVmFyaWFibGVzLmluY2x1ZGVzKFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgZWxEYXRhW2NvbmRpdGlvbi52YXJpYWJsZS5uYW1lXS50b1N0cmluZygpXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgKVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgPyAwXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICA6IDFcbiAgICAgICAgICAgICAgICAgICAgICAgICAgXS5wdXNoKGVsRGF0YSk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybiByZXN1bHQ7XG4gICAgICAgICAgICAgICAgICAgICAgICB9LFxuICAgICAgICAgICAgICAgICAgICAgICAgW1tdLCBbXV1cbiAgICAgICAgICAgICAgICAgICAgICApO1xuICAgICAgICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgICAgICAgICBjYXNlIEZpbHRlclR5cGVzLk5PVF9JTjpcbiAgICAgICAgICAgICAgICAgICAgICBbZmlsdGVyZWREYXRhLCB0ZW1wUmVzaWRpbmdMaXN0XSA9IGxvZGFzaC5yZWR1Y2UoXG4gICAgICAgICAgICAgICAgICAgICAgICBmaWx0ZXJlZERhdGEsXG4gICAgICAgICAgICAgICAgICAgICAgICAocmVzdWx0OiBhbnksIGVsRGF0YSkgPT4ge1xuICAgICAgICAgICAgICAgICAgICAgICAgICBpZiAoIU9iamVjdC5rZXlzKGVsRGF0YSkuaW5jbHVkZXModmFyaWFibGUubmFtZSkpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBlbERhdGFbdmFyaWFibGUubmFtZV0gPSAwO1xuICAgICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgICAgIHJlc3VsdFtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBlbERhdGFbY29uZGl0aW9uLnZhcmlhYmxlLm5hbWVdICE9IG51bGwgJiYgIWNvbmRpdGlvbi5jb21wYXJhdGl2ZVZhcmlhYmxlcy5pbmNsdWRlcyhcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGVsRGF0YVtjb25kaXRpb24udmFyaWFibGUubmFtZV0udG9TdHJpbmcoKVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIClcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgID8gMFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgOiAxXG4gICAgICAgICAgICAgICAgICAgICAgICAgIF0ucHVzaChlbERhdGEpO1xuICAgICAgICAgICAgICAgICAgICAgICAgICByZXR1cm4gcmVzdWx0O1xuICAgICAgICAgICAgICAgICAgICAgICAgfSxcbiAgICAgICAgICAgICAgICAgICAgICAgIFtbXSwgW11dXG4gICAgICAgICAgICAgICAgICAgICAgKTtcbiAgICAgICAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgICAgICAgICAgY2FzZSBGaWx0ZXJUeXBlcy5MRVNTX1RIQU46XG4gICAgICAgICAgICAgICAgICAgICAgW2ZpbHRlcmVkRGF0YSwgdGVtcFJlc2lkaW5nTGlzdF0gPSBsb2Rhc2gucmVkdWNlKFxuICAgICAgICAgICAgICAgICAgICAgICAgZmlsdGVyZWREYXRhLFxuICAgICAgICAgICAgICAgICAgICAgICAgKHJlc3VsdDogYW55LCBlbERhdGEpID0+IHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgaWYgKCFPYmplY3Qua2V5cyhlbERhdGEpLmluY2x1ZGVzKHZhcmlhYmxlLm5hbWUpKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgZWxEYXRhW3ZhcmlhYmxlLm5hbWVdID0gMDtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgICAgICByZXN1bHRbXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgZWxEYXRhW2NvbmRpdGlvbi52YXJpYWJsZS5uYW1lXSAhPSBudWxsICYmIGVsRGF0YVtjb25kaXRpb24udmFyaWFibGUubmFtZV0gPFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGNvbmRpdGlvbi5jb21wYXJhdGl2ZVZhcmlhYmxlc1swXVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgPyAwXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICA6IDFcbiAgICAgICAgICAgICAgICAgICAgICAgICAgXS5wdXNoKGVsRGF0YSk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybiByZXN1bHQ7XG4gICAgICAgICAgICAgICAgICAgICAgICB9LFxuICAgICAgICAgICAgICAgICAgICAgICAgW1tdLCBbXV1cbiAgICAgICAgICAgICAgICAgICAgICApO1xuICAgICAgICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgICAgICAgICBjYXNlIEZpbHRlclR5cGVzLkdSRUFURVJfVEhBTjpcbiAgICAgICAgICAgICAgICAgICAgICBbZmlsdGVyZWREYXRhLCB0ZW1wUmVzaWRpbmdMaXN0XSA9IGxvZGFzaC5yZWR1Y2UoXG4gICAgICAgICAgICAgICAgICAgICAgICBmaWx0ZXJlZERhdGEsXG4gICAgICAgICAgICAgICAgICAgICAgICAocmVzdWx0OiBhbnksIGVsRGF0YSkgPT4ge1xuICAgICAgICAgICAgICAgICAgICAgICAgICBpZiAoIU9iamVjdC5rZXlzKGVsRGF0YSkuaW5jbHVkZXModmFyaWFibGUubmFtZSkpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBlbERhdGFbdmFyaWFibGUubmFtZV0gPSAwO1xuICAgICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgICAgIHJlc3VsdFtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBlbERhdGFbY29uZGl0aW9uLnZhcmlhYmxlLm5hbWVdICE9IG51bGwgJiYgZWxEYXRhW2NvbmRpdGlvbi52YXJpYWJsZS5uYW1lXSA+XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgY29uZGl0aW9uLmNvbXBhcmF0aXZlVmFyaWFibGVzWzBdXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICA/IDBcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIDogMVxuICAgICAgICAgICAgICAgICAgICAgICAgICBdLnB1c2goZWxEYXRhKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuIHJlc3VsdDtcbiAgICAgICAgICAgICAgICAgICAgICAgIH0sXG4gICAgICAgICAgICAgICAgICAgICAgICBbW10sIFtdXVxuICAgICAgICAgICAgICAgICAgICAgICk7XG4gICAgICAgICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICAgICAgICAgIGNhc2UgRmlsdGVyVHlwZXMuTEVTU19USEFOX0VRVUFMOlxuICAgICAgICAgICAgICAgICAgICAgIFtmaWx0ZXJlZERhdGEsIHRlbXBSZXNpZGluZ0xpc3RdID0gbG9kYXNoLnJlZHVjZShcbiAgICAgICAgICAgICAgICAgICAgICAgIGZpbHRlcmVkRGF0YSxcbiAgICAgICAgICAgICAgICAgICAgICAgIChyZXN1bHQ6IGFueSwgZWxEYXRhKSA9PiB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgIGlmICghT2JqZWN0LmtleXMoZWxEYXRhKS5pbmNsdWRlcyh2YXJpYWJsZS5uYW1lKSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGVsRGF0YVt2YXJpYWJsZS5uYW1lXSA9IDA7XG4gICAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgICAgICAgcmVzdWx0W1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGVsRGF0YVtjb25kaXRpb24udmFyaWFibGUubmFtZV0gIT0gbnVsbCAmJiBlbERhdGFbY29uZGl0aW9uLnZhcmlhYmxlLm5hbWVdIDw9XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgY29uZGl0aW9uLmNvbXBhcmF0aXZlVmFyaWFibGVzWzBdXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICA/IDBcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIDogMVxuICAgICAgICAgICAgICAgICAgICAgICAgICBdLnB1c2goZWxEYXRhKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuIHJlc3VsdDtcbiAgICAgICAgICAgICAgICAgICAgICAgIH0sXG4gICAgICAgICAgICAgICAgICAgICAgICBbW10sIFtdXVxuICAgICAgICAgICAgICAgICAgICAgICk7XG4gICAgICAgICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICAgICAgICAgIGNhc2UgRmlsdGVyVHlwZXMuR1JFQVRFUl9USEFOX0VRVUFMOlxuICAgICAgICAgICAgICAgICAgICAgIFtmaWx0ZXJlZERhdGEsIHRlbXBSZXNpZGluZ0xpc3RdID0gbG9kYXNoLnJlZHVjZShcbiAgICAgICAgICAgICAgICAgICAgICAgIGZpbHRlcmVkRGF0YSxcbiAgICAgICAgICAgICAgICAgICAgICAgIChyZXN1bHQ6IGFueSwgZWxEYXRhKSA9PiB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgIGlmICghT2JqZWN0LmtleXMoZWxEYXRhKS5pbmNsdWRlcyh2YXJpYWJsZS5uYW1lKSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGVsRGF0YVt2YXJpYWJsZS5uYW1lXSA9IDA7XG4gICAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgICAgICAgcmVzdWx0W1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGVsRGF0YVtjb25kaXRpb24udmFyaWFibGUubmFtZV0gIT0gbnVsbCAmJiBlbERhdGFbY29uZGl0aW9uLnZhcmlhYmxlLm5hbWVdID49XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgY29uZGl0aW9uLmNvbXBhcmF0aXZlVmFyaWFibGVzWzBdXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICA/IDBcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIDogMVxuICAgICAgICAgICAgICAgICAgICAgICAgICBdLnB1c2goZWxEYXRhKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuIHJlc3VsdDtcbiAgICAgICAgICAgICAgICAgICAgICAgIH0sXG4gICAgICAgICAgICAgICAgICAgICAgICBbW10sIFtdXVxuICAgICAgICAgICAgICAgICAgICAgICk7XG4gICAgICAgICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICAgICAgICAgIGNhc2UgRmlsdGVyVHlwZXMuRVFVQUw6XG4gICAgICAgICAgICAgICAgICAgICAgW2ZpbHRlcmVkRGF0YSwgdGVtcFJlc2lkaW5nTGlzdF0gPSBsb2Rhc2gucmVkdWNlKFxuICAgICAgICAgICAgICAgICAgICAgICAgZmlsdGVyZWREYXRhLFxuICAgICAgICAgICAgICAgICAgICAgICAgKHJlc3VsdDogYW55LCBlbERhdGEpID0+IHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgaWYgKCFPYmplY3Qua2V5cyhlbERhdGEpLmluY2x1ZGVzKHZhcmlhYmxlLm5hbWUpKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgZWxEYXRhW3ZhcmlhYmxlLm5hbWVdID0gMDtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgICAgICByZXN1bHRbXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgZWxEYXRhW2NvbmRpdGlvbi52YXJpYWJsZS5uYW1lXSAhPSBudWxsICYmIGVsRGF0YVtjb25kaXRpb24udmFyaWFibGUubmFtZV0gPT1cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBjb25kaXRpb24uY29tcGFyYXRpdmVWYXJpYWJsZXNbMF1cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgID8gMFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgOiAxXG4gICAgICAgICAgICAgICAgICAgICAgICAgIF0ucHVzaChlbERhdGEpO1xuICAgICAgICAgICAgICAgICAgICAgICAgICByZXR1cm4gcmVzdWx0O1xuICAgICAgICAgICAgICAgICAgICAgICAgfSxcbiAgICAgICAgICAgICAgICAgICAgICAgIFtbXSwgW11dXG4gICAgICAgICAgICAgICAgICAgICAgKTtcbiAgICAgICAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgICAgICAgICAgY2FzZSBGaWx0ZXJUeXBlcy5CRVRXRUVOX1JBTkdFOlxuICAgICAgICAgICAgICAgICAgICAgIFtmaWx0ZXJlZERhdGEsIHRlbXBSZXNpZGluZ0xpc3RdID0gbG9kYXNoLnJlZHVjZShcbiAgICAgICAgICAgICAgICAgICAgICAgIGZpbHRlcmVkRGF0YSxcbiAgICAgICAgICAgICAgICAgICAgICAgIChyZXN1bHQ6IGFueSwgZWxEYXRhKSA9PiB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgIGlmICghT2JqZWN0LmtleXMoZWxEYXRhKS5pbmNsdWRlcyh2YXJpYWJsZS5uYW1lKSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGVsRGF0YVt2YXJpYWJsZS5uYW1lXSA9IDA7XG4gICAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgICAgICAgcmVzdWx0W1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGVsRGF0YVtjb25kaXRpb24udmFyaWFibGUubmFtZV0gIT0gbnVsbCAmJiBlbERhdGFbY29uZGl0aW9uLnZhcmlhYmxlLm5hbWVdID49XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICBjb25kaXRpb24uY29tcGFyYXRpdmVWYXJpYWJsZXNbMF0gJiZcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBlbERhdGFbY29uZGl0aW9uLnZhcmlhYmxlLm5hbWVdIDxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGNvbmRpdGlvbi5jb21wYXJhdGl2ZVZhcmlhYmxlc1sxXVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgPyAwXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICA6IDFcbiAgICAgICAgICAgICAgICAgICAgICAgICAgXS5wdXNoKGVsRGF0YSk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybiByZXN1bHQ7XG4gICAgICAgICAgICAgICAgICAgICAgICB9LFxuICAgICAgICAgICAgICAgICAgICAgICAgW1tdLCBbXV1cbiAgICAgICAgICAgICAgICAgICAgICApO1xuICAgICAgICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgICAgICAgICBjYXNlIEZpbHRlclR5cGVzLk5PVF9FUVVBTDpcbiAgICAgICAgICAgICAgICAgICAgICBbZmlsdGVyZWREYXRhLCB0ZW1wUmVzaWRpbmdMaXN0XSA9IGxvZGFzaC5yZWR1Y2UoXG4gICAgICAgICAgICAgICAgICAgICAgICBmaWx0ZXJlZERhdGEsXG4gICAgICAgICAgICAgICAgICAgICAgICAocmVzdWx0OiBhbnksIGVsRGF0YSkgPT4ge1xuICAgICAgICAgICAgICAgICAgICAgICAgICBpZiAoIU9iamVjdC5rZXlzKGVsRGF0YSkuaW5jbHVkZXModmFyaWFibGUubmFtZSkpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBlbERhdGFbdmFyaWFibGUubmFtZV0gPSAwO1xuICAgICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgICAgIHJlc3VsdFtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBlbERhdGFbY29uZGl0aW9uLnZhcmlhYmxlLm5hbWVdICE9IG51bGwgJiYgZWxEYXRhW2NvbmRpdGlvbi52YXJpYWJsZS5uYW1lXSAhPVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGNvbmRpdGlvbi5jb21wYXJhdGl2ZVZhcmlhYmxlc1swXVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgPyAwXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICA6IDFcbiAgICAgICAgICAgICAgICAgICAgICAgICAgXS5wdXNoKGVsRGF0YSk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybiByZXN1bHQ7XG4gICAgICAgICAgICAgICAgICAgICAgICB9LFxuICAgICAgICAgICAgICAgICAgICAgICAgW1tdLCBbXV1cbiAgICAgICAgICAgICAgICAgICAgICApO1xuICAgICAgICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgICAgICAgICBjYXNlIEZpbHRlclR5cGVzLkJFRk9SRTpcbiAgICAgICAgICAgICAgICAgICAgICB2YXJpYWJsZUluZm8gPSB0aGlzLmdldFZhcmlhYmxlVHlwZUJ5SGVhZGVyKFxuICAgICAgICAgICAgICAgICAgICAgICAgY29uZGl0aW9uLnZhcmlhYmxlLm5hbWUsXG4gICAgICAgICAgICAgICAgICAgICAgICBkYXRhRm9ybWF0XG4gICAgICAgICAgICAgICAgICAgICAgKTtcbiAgICAgICAgICAgICAgICAgICAgICBsb2Rhc2guZm9yRWFjaChmaWx0ZXJlZERhdGEsIChlbERhdGEpID0+IHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGxldCB2YXJpYWJsZVR5cGUgPSB2YXJpYWJsZUluZm8udHlwZTtcbiAgICAgICAgICAgICAgICAgICAgICAgIGlmICh2YXJpYWJsZVR5cGUgPT0gRGF0YVR5cGUuREFURSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICBpZiAoXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgdGhpcy5nZXRGb3JtYXR0ZWREYXRlKFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgZWxEYXRhW2NvbmRpdGlvbi52YXJpYWJsZS5uYW1lXSxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHZhcmlhYmxlSW5mby5mb3JtYXRcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICApLmdldFRpbWUoKSA8XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgbmV3IERhdGUoY29uZGl0aW9uLmNvbXBhcmF0aXZlVmFyaWFibGVzWzBdKS5nZXRUaW1lKClcbiAgICAgICAgICAgICAgICAgICAgICAgICAgKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgZmlsdGVyZWREYXRhLnB1c2goZWxEYXRhKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBpZiAoXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICBPYmplY3Qua2V5cyhlbERhdGEpLmluZGV4T2YodmFyaWFibGUubmFtZSkgPT0gLTFcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICApIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGVsRGF0YVt2YXJpYWJsZS5uYW1lXSA9IDA7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHRlbXBSZXNpZGluZ0xpc3QucHVzaChlbERhdGEpO1xuICAgICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICAgICAgICBsZXQgY3VyclNlY29uZHMgPSB0aGlzLmdldEZvcm1hdHRlZERhdGUoXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgZWxEYXRhW2NvbmRpdGlvbi52YXJpYWJsZS5uYW1lXSxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB2YXJpYWJsZUluZm8uZm9ybWF0XG4gICAgICAgICAgICAgICAgICAgICAgICAgICk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgIGxldCBbaG91ciwgbWluXSA9IGNvbmRpdGlvbi5jb21wYXJhdGl2ZVZhcmlhYmxlc1swXVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIC5zcGxpdCgnOicpXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgLm1hcCgoZWw6IGFueSkgPT4gcGFyc2VJbnQoZWwpKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgbGV0IGNvbXBhcmVkU2VjID0gaG91ciAqIDYwICogNjAgKyBtaW4gKiA2MDtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgaWYgKGN1cnJTZWNvbmRzIDwgY29tcGFyZWRTZWMpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBmaWx0ZXJlZERhdGEucHVzaChlbERhdGEpO1xuICAgICAgICAgICAgICAgICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGlmIChcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIE9iamVjdC5rZXlzKGVsRGF0YSkuaW5kZXhPZih2YXJpYWJsZS5uYW1lKSA9PSAtMVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgZWxEYXRhW3ZhcmlhYmxlLm5hbWVdID0gMDtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgdGVtcFJlc2lkaW5nTGlzdC5wdXNoKGVsRGF0YSk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgICAgICAgICAgY2FzZSBGaWx0ZXJUeXBlcy5BRlRFUjpcbiAgICAgICAgICAgICAgICAgICAgICB2YXJpYWJsZUluZm8gPSB0aGlzLmdldFZhcmlhYmxlVHlwZUJ5SGVhZGVyKFxuICAgICAgICAgICAgICAgICAgICAgICAgY29uZGl0aW9uLnZhcmlhYmxlLm5hbWUsXG4gICAgICAgICAgICAgICAgICAgICAgICBkYXRhRm9ybWF0XG4gICAgICAgICAgICAgICAgICAgICAgKTtcbiAgICAgICAgICAgICAgICAgICAgICBsb2Rhc2guZm9yRWFjaChmaWx0ZXJlZERhdGEsIChlbERhdGEpID0+IHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGxldCB2YXJpYWJsZVR5cGUgPSB2YXJpYWJsZUluZm8udHlwZTtcbiAgICAgICAgICAgICAgICAgICAgICAgIGlmICh2YXJpYWJsZVR5cGUgPT0gRGF0YVR5cGUuREFURSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICBpZiAoXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgdGhpcy5nZXRGb3JtYXR0ZWREYXRlKFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgZWxEYXRhW2NvbmRpdGlvbi52YXJpYWJsZS5uYW1lXSxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHZhcmlhYmxlSW5mby5mb3JtYXRcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICApLmdldFRpbWUoKSA+XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgbmV3IERhdGUoY29uZGl0aW9uLmNvbXBhcmF0aXZlVmFyaWFibGVzWzBdKS5nZXRUaW1lKClcbiAgICAgICAgICAgICAgICAgICAgICAgICAgKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgZmlsdGVyZWREYXRhLnB1c2goZWxEYXRhKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBpZiAoXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICBPYmplY3Qua2V5cyhlbERhdGEpLmluZGV4T2YodmFyaWFibGUubmFtZSkgPT0gLTFcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICApIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGVsRGF0YVt2YXJpYWJsZS5uYW1lXSA9IDA7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHRlbXBSZXNpZGluZ0xpc3QucHVzaChlbERhdGEpO1xuICAgICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICAgICAgICBsZXQgY3VyclNlY29uZHMgPSB0aGlzLmdldEZvcm1hdHRlZERhdGUoXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgZWxEYXRhW2NvbmRpdGlvbi52YXJpYWJsZS5uYW1lXSxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB2YXJpYWJsZUluZm8uZm9ybWF0XG4gICAgICAgICAgICAgICAgICAgICAgICAgICk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgIGxldCBbaG91ciwgbWluXSA9IGNvbmRpdGlvbi5jb21wYXJhdGl2ZVZhcmlhYmxlc1swXVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIC5zcGxpdCgnOicpXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgLm1hcCgoZWw6IGFueSkgPT4gcGFyc2VJbnQoZWwpKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgbGV0IGNvbXBhcmVkU2VjID0gaG91ciAqIDYwICogNjAgKyBtaW4gKiA2MDtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgaWYgKGN1cnJTZWNvbmRzID4gY29tcGFyZWRTZWMpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBmaWx0ZXJlZERhdGEucHVzaChlbERhdGEpO1xuICAgICAgICAgICAgICAgICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGlmIChcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIE9iamVjdC5rZXlzKGVsRGF0YSkuaW5kZXhPZih2YXJpYWJsZS5uYW1lKSA9PSAtMVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgZWxEYXRhW3ZhcmlhYmxlLm5hbWVdID0gMDtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgdGVtcFJlc2lkaW5nTGlzdC5wdXNoKGVsRGF0YSk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgICAgICAgICAgY2FzZSAnPD4nOlxuICAgICAgICAgICAgICAgICAgICAgIHZhcmlhYmxlSW5mbyA9IHRoaXMuZ2V0VmFyaWFibGVUeXBlQnlIZWFkZXIoXG4gICAgICAgICAgICAgICAgICAgICAgICBjb25kaXRpb24udmFyaWFibGUubmFtZSxcbiAgICAgICAgICAgICAgICAgICAgICAgIGRhdGFGb3JtYXRcbiAgICAgICAgICAgICAgICAgICAgICApO1xuICAgICAgICAgICAgICAgICAgICAgIGxvZGFzaC5mb3JFYWNoKGZpbHRlcmVkRGF0YSwgKGVsRGF0YSkgPT4ge1xuICAgICAgICAgICAgICAgICAgICAgICAgbGV0IHZhcmlhYmxlVHlwZSA9IHZhcmlhYmxlSW5mby50eXBlO1xuICAgICAgICAgICAgICAgICAgICAgICAgaWYgKHZhcmlhYmxlVHlwZSA9PSAnZGF0ZScpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgbGV0IHZhckRhdGUgPSB0aGlzLmdldEZvcm1hdHRlZERhdGUoXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgZWxEYXRhW2NvbmRpdGlvbi52YXJpYWJsZS5uYW1lXSxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB2YXJpYWJsZUluZm8uZm9ybWF0XG4gICAgICAgICAgICAgICAgICAgICAgICAgICkuZ2V0VGltZSgpO1xuICAgICAgICAgICAgICAgICAgICAgICAgICBpZiAoXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgdmFyRGF0ZSA+PVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgbmV3IERhdGUoXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGNvbmRpdGlvbi5jb21wYXJhdGl2ZVZhcmlhYmxlc1swXVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgKS5nZXRUaW1lKCkgJiZcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB2YXJEYXRlIDxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIG5ldyBEYXRlKFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBjb25kaXRpb24uY29tcGFyYXRpdmVWYXJpYWJsZXNbMV1cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICkuZ2V0VGltZSgpXG4gICAgICAgICAgICAgICAgICAgICAgICAgICkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGZpbHRlcmVkRGF0YS5wdXNoKGVsRGF0YSk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgaWYgKE9iamVjdC5rZXlzKGVsRGF0YSkuaW5jbHVkZXModmFyaWFibGUubmFtZSkpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGVsRGF0YVt2YXJpYWJsZS5uYW1lXSA9IDA7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHRlbXBSZXNpZGluZ0xpc3QucHVzaChlbERhdGEpO1xuICAgICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICAgICAgICBsZXQgY3VyclNlY29uZHMgPSB0aGlzLmdldEZvcm1hdHRlZERhdGUoXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgZWxEYXRhW2NvbmRpdGlvbi52YXJpYWJsZS5uYW1lXSxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB2YXJpYWJsZUluZm8uZm9ybWF0XG4gICAgICAgICAgICAgICAgICAgICAgICAgICk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgIGxldCBbaG91ciwgbWluXSA9IGNvbmRpdGlvbi5jb21wYXJhdGl2ZVZhcmlhYmxlc1swXVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIC5zcGxpdCgnOicpXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgLm1hcCgoZWw6IGFueSkgPT4gcGFyc2VJbnQoZWwpKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgbGV0IFtlbmRob3VyLCBlbmRtaW5dID1cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBjb25kaXRpb24uY29tcGFyYXRpdmVWYXJpYWJsZXNbMV1cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC5zcGxpdCgnOicpXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAubWFwKChlbDogYW55KSA9PiBwYXJzZUludChlbCkpO1xuICAgICAgICAgICAgICAgICAgICAgICAgICBsZXQgY29tcGFyZWRTZWMgPSBob3VyICogNjAgKiA2MCArIG1pbiAqIDYwO1xuICAgICAgICAgICAgICAgICAgICAgICAgICBsZXQgZW5kY29tcGFyZWRTZWMgPSBlbmRob3VyICogNjAgKiA2MCArIGVuZG1pbiAqIDYwO1xuICAgICAgICAgICAgICAgICAgICAgICAgICBpZiAoXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgY3VyclNlY29uZHMgPj0gY29tcGFyZWRTZWMgJiZcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBjdXJyU2Vjb25kcyA8IGVuZGNvbXBhcmVkU2VjXG4gICAgICAgICAgICAgICAgICAgICAgICAgICkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGZpbHRlcmVkRGF0YS5wdXNoKGVsRGF0YSk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgaWYgKE9iamVjdC5rZXlzKGVsRGF0YSkuaW5jbHVkZXModmFyaWFibGUubmFtZSkpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGVsRGF0YVt2YXJpYWJsZS5uYW1lXSA9IDA7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHRlbXBSZXNpZGluZ0xpc3QucHVzaChlbERhdGEpO1xuICAgICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICAgICAgICB9ICAgIFxuICAgICAgICAgICAgICAgICAgXG4gICAgICAgICAgICAgICAgICByZXNpZGluZ0RhdGEgPSBbLi4ucmVzaWRpbmdEYXRhLCAuLi50ZW1wUmVzaWRpbmdMaXN0XTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICk7XG4gICAgICAgICAgICAgIGlmIChmaWx0ZXIuaXNDdXN0b21WYWx1ZSkge1xuICAgICAgICAgICAgICAgIC8vSW5zZXJ0IGN1c3RvbSB2YWx1ZVxuICAgICAgICAgICAgICAgIGxldCB2YWx1ZSA9IHRoaXMudmFsaWRhdGVOdW1iZXIoZmlsdGVyLnZhbHVlcylcbiAgICAgICAgICAgICAgICAgID8gcGFyc2VGbG9hdChmaWx0ZXIudmFsdWVzKVxuICAgICAgICAgICAgICAgICAgOiBmaWx0ZXIudmFsdWVzO1xuICAgICAgICAgICAgICAgIHJlc3VsdGFudERhdGEgPSBbXG4gICAgICAgICAgICAgICAgICAuLi5sb2Rhc2gubWFwKGxvZGFzaC5jbG9uZURlZXAoZmlsdGVyZWREYXRhKSwgKGQ6IGFueSkgPT4gKHtcbiAgICAgICAgICAgICAgICAgICAgLi4uZCxcbiAgICAgICAgICAgICAgICAgICAgW3ZhcmlhYmxlLm5hbWVdOiB2YWx1ZSxcbiAgICAgICAgICAgICAgICAgIH0pKSxcbiAgICAgICAgICAgICAgICAgIC4uLmxvZGFzaC5jbG9uZURlZXAocmVzaWRpbmdEYXRhKSxcbiAgICAgICAgICAgICAgICBdO1xuICAgICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgIC8vSW5zZXJ0IGNhbGN1bGF0ZWQgdmFsdWVcbiAgICAgICAgICAgICAgICBkYXRhVG9UcmF2ZXJzZSA9IGxvZGFzaC53aXRob3V0KFxuICAgICAgICAgICAgICAgICAgbG9kYXNoLm1hcChsb2Rhc2guY2xvbmVEZWVwKGZpbHRlcmVkRGF0YSksIGZpbHRlci52YWx1ZXMpLFxuICAgICAgICAgICAgICAgICAgdW5kZWZpbmVkXG4gICAgICAgICAgICAgICAgKTtcbiAgICAgICAgICAgICAgICBsZXQgdmFsdWUgPVxuICAgICAgICAgICAgICAgICAgZmlsdGVyLmFnZ3JlZ2F0aW9uRnVuY3Rpb24gPT0gJ05PIEZVTkNUSU9OJ1xuICAgICAgICAgICAgICAgICAgICA/IG51bGxcbiAgICAgICAgICAgICAgICAgICAgOiB0aGlzLmdldEFnZ3JlZ2F0ZWRWYWx1ZU9mQ3VzdG9tVmFyaWFibGUoXG4gICAgICAgICAgICAgICAgICAgICAgICBkYXRhVG9UcmF2ZXJzZSxcbiAgICAgICAgICAgICAgICAgICAgICAgIGZpbHRlclxuICAgICAgICAgICAgICAgICAgICAgICk7XG4gICAgICAgICAgICAgICAgcmVzdWx0YW50RGF0YSA9IFtcbiAgICAgICAgICAgICAgICAgIC4uLmxvZGFzaC5tYXAobG9kYXNoLmNsb25lRGVlcChmaWx0ZXJlZERhdGEpLCAoZDogYW55KSA9PiAoe1xuICAgICAgICAgICAgICAgICAgICAuLi5kLFxuICAgICAgICAgICAgICAgICAgICBbdmFyaWFibGUubmFtZV06XG4gICAgICAgICAgICAgICAgICAgICAgdmFsdWUgPT0gbnVsbCA/IGRbZmlsdGVyLnZhbHVlc10gOiB2YWx1ZSxcbiAgICAgICAgICAgICAgICAgIH0pKSxcbiAgICAgICAgICAgICAgICAgIC4uLmxvZGFzaC5jbG9uZURlZXAocmVzaWRpbmdEYXRhKSxcbiAgICAgICAgICAgICAgICBdO1xuICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgIGZpbHRlcmVkRGF0YSA9IG51bGw7XG4gICAgICAgICAgICAgIHJlc2lkaW5nRGF0YSA9IG51bGw7XG4gICAgICAgICAgICB9ZWxzZXtcbiAgICAgICAgICAgICAgcmVzdWx0YW50RGF0YSA9IGxvZGFzaC5jbG9uZURlZXAoZmlsdGVyZWREYXRhKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICB9KTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAvL0Jhc2VkIG9uIE9wZXJhdGlvblxuICAgICAgICAgIGlmICh2YXJpYWJsZS5vcGVyYXRpb25bMF0uaXNBZ2dyZWdhdGlvbiAmJiAhd2l0aG91dEFnZykge1xuICAgICAgICAgICAgLy9DdXN0b20gVmFyaWFibGUgQ29udGFpbiBBZ2dyZWdhdGVkIFZhbHVlXG4gICAgICAgICAgICByZXN1bHRhbnREYXRhID0gdGhpcy5nZXRDdXN0b21WYXJpYWJsZVZhbHVlQWdncmVnYXRlZChcbiAgICAgICAgICAgICAgdmFyaWFibGUsXG4gICAgICAgICAgICAgIHJlc3VsdGFudERhdGFcbiAgICAgICAgICAgICk7XG4gICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIC8vQ3VzdG9tIFZhcmlhYmxlIENvbnRhaW4gTm9uLUFnZ3JlZ2F0ZWQgVmFsdWVcbiAgICAgICAgICAgIHJlc3VsdGFudERhdGEgPSBsb2Rhc2gubWFwKHJlc3VsdGFudERhdGEsIChkOiBhbnkpID0+ICh7XG4gICAgICAgICAgICAgIC4uLmQsXG4gICAgICAgICAgICAgIFt2YXJpYWJsZS5uYW1lXTogdGhpcy5nZXRDdXN0b21WYXJpYWJsZVZhbHVlKHZhcmlhYmxlLCBkKSxcbiAgICAgICAgICAgIH0pKTtcbiAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICB9KTtcbiAgICByZXR1cm4gcmVzdWx0YW50RGF0YTtcbiAgfVxuXG4gIHByaXZhdGUgZ2V0QWdncmVnYXRlZFZhbHVlT2ZDdXN0b21WYXJpYWJsZShcbiAgICBhbGxEYXRhOiBhbnksXG4gICAgZmlsdGVyOiBEZXJpdmVkVmFyaWFibGVGaWx0ZXJcbiAgKTogYW55IHtcbiAgICBsZXQgcmVzdWx0ID0gMDtcbiAgICBzd2l0Y2ggKGZpbHRlci5hZ2dyZWdhdGlvbkZ1bmN0aW9uKSB7XG4gICAgICBjYXNlIEFnZ3JlZ2F0aW9uRnVuY3Rpb25zVHlwZS5TVU06XG4gICAgICAgIHJlc3VsdCA9IGxvZGFzaC5zdW0oYWxsRGF0YS5tYXAoTnVtYmVyKSk7XG4gICAgICAgIGJyZWFrO1xuICAgICAgY2FzZSBBZ2dyZWdhdGlvbkZ1bmN0aW9uc1R5cGUuQ09VTlRfVU5JUVVFOlxuICAgICAgICByZXN1bHQgPSBsb2Rhc2gudW5pcShhbGxEYXRhKS5sZW5ndGg7XG4gICAgICAgIGJyZWFrO1xuICAgICAgY2FzZSBBZ2dyZWdhdGlvbkZ1bmN0aW9uc1R5cGUuQ09VTlQ6XG4gICAgICAgIHJlc3VsdCA9IGFsbERhdGEubGVuZ3RoO1xuICAgICAgICBicmVhaztcbiAgICAgIGNhc2UgQWdncmVnYXRpb25GdW5jdGlvbnNUeXBlLk1BWElNVU06XG4gICAgICAgIHJlc3VsdCA9IGxvZGFzaC5tYXgoYWxsRGF0YS5tYXAoTnVtYmVyKSkgPz8gMDtcbiAgICAgICAgYnJlYWs7XG4gICAgICBjYXNlIEFnZ3JlZ2F0aW9uRnVuY3Rpb25zVHlwZS5NSU5JTVVNOlxuICAgICAgICByZXN1bHQgPSBsb2Rhc2gubWluKGFsbERhdGEubWFwKE51bWJlcikpID8/IDA7XG4gICAgICAgIGJyZWFrO1xuICAgICAgY2FzZSBBZ2dyZWdhdGlvbkZ1bmN0aW9uc1R5cGUuQVZFUkFHRTpcbiAgICAgICAgcmVzdWx0ID0gbG9kYXNoLm1lYW4oYWxsRGF0YS5tYXAoTnVtYmVyKSkgPz8gMDtcbiAgICAgICAgYnJlYWs7XG4gICAgfVxuICAgIHJldHVybiByZXN1bHQ7XG4gIH1cblxuICBwcml2YXRlIGdldEN1c3RvbVZhcmlhYmxlVmFsdWUodmFyaWFibGU6IERlcml2ZWRWYXJpYWJsZSwgZGF0YTogYW55KSB7XG4gICAgbGV0IHRlbXBBcnI6IGFueSA9IHZhcmlhYmxlLmZvcm11bGEudHJpbSgpLnNwbGl0KCcgJyk7XG4gICAgdGVtcEFyciA9IHRlbXBBcnIubWFwKChlbDogYW55KSA9PiB7XG4gICAgICBsZXQgYWxsa2V5cyA9IE9iamVjdC5rZXlzKGRhdGEpO1xuICAgICAgaWYgKGFsbGtleXMuaW5kZXhPZihlbC5yZXBsYWNlQWxsKCdfJywgJyAnKSkgIT0gLTEpIHtcbiAgICAgICAgaWYgKFxuICAgICAgICAgIGRhdGFbZWwucmVwbGFjZUFsbCgnXycsICcgJyldID09ICcnIHx8XG4gICAgICAgICAgZGF0YVtlbC5yZXBsYWNlQWxsKCdfJywgJyAnKV0gPT0gbnVsbFxuICAgICAgICApIHtcbiAgICAgICAgICBlbCA9IDA7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgZWwgPSBuZXcgQmlnTnVtYmVyKGRhdGFbZWwucmVwbGFjZUFsbCgnXycsICcgJyldKTtcbiAgICAgICAgfVxuICAgICAgfSBlbHNlIHtcbiAgICAgICAgaWYgKGVsLmluZGV4T2YoJ18nKSAhPSAtMSkge1xuICAgICAgICAgIGVsID0gMDtcbiAgICAgICAgfVxuICAgICAgfVxuICAgICAgcmV0dXJuIGVsO1xuICAgIH0pO1xuICAgIHJldHVybiBldmFsKHRlbXBBcnIuam9pbignICcpKTtcbiAgfVxuXG4gIHByaXZhdGUgZ2V0Q3VzdG9tVmFyaWFibGVWYWx1ZUFnZ3JlZ2F0ZWQoXG4gICAgdmFyaWFibGU6IERlcml2ZWRWYXJpYWJsZSxcbiAgICBkYXRhOiBhbnlcbiAgKSB7XG4gICAgbGV0IHRlbXBBcnIgPSB2YXJpYWJsZS5mb3JtdWxhLnRyaW0oKS5zcGxpdCgnICcpO1xuICAgIHRlbXBBcnIgPSBsb2Rhc2gubWFwKHRlbXBBcnIsIChlbDogYW55KSA9PiB7XG4gICAgICBsZXQgYWxsa2V5cyA9IE9iamVjdC5rZXlzKGRhdGFbMF0pO1xuICAgICAgaWYgKGFsbGtleXMuaW5kZXhPZihlbC5yZXBsYWNlQWxsKCdfJywgJyAnKSkgIT0gLTEpIHtcbiAgICAgICAgbGV0IGtleSA9IGVsLnJlcGxhY2VBbGwoJ18nLCAnICcpO1xuICAgICAgICBsZXQgZGF0YVRvVHJhdmVyc2UgPSBsb2Rhc2gubWFwKGRhdGEsIGtleSk7XG4gICAgICAgIGRhdGFUb1RyYXZlcnNlID0gbG9kYXNoLndpdGhvdXQoZGF0YVRvVHJhdmVyc2UsICcwJyk7XG4gICAgICAgIGVsID0gbmV3IEJpZ051bWJlcihcbiAgICAgICAgICAoZGF0YVRvVHJhdmVyc2UubGVuZ3RoID09IDBcbiAgICAgICAgICAgID8gMFxuICAgICAgICAgICAgOiBsb2Rhc2gubWF4KGRhdGFUb1RyYXZlcnNlKSkgYXMgc3RyaW5nXG4gICAgICAgICk7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICBpZiAoZWwuaW5kZXhPZignXycpICE9IC0xKSB7XG4gICAgICAgICAgZWwgPSAwO1xuICAgICAgICB9XG4gICAgICB9XG4gICAgICByZXR1cm4gZWw7XG4gICAgfSk7XG4gICAgbGV0IHZhbHVlID0gZXZhbCh0ZW1wQXJyLmpvaW4oJyAnKSk7XG4gICAgcmV0dXJuIGxvZGFzaC5tYXAoZGF0YSwgKGQpID0+ICh7XG4gICAgICAuLi5kLFxuICAgICAgW3ZhcmlhYmxlLm5hbWVdOiB2YWx1ZSxcbiAgICB9KSk7XG4gIH1cbiAgXG5cbiAgLy90cmVuZHMgRGF0YVxuICBwcml2YXRlIGJ1aWxkVHJlbmQodHJlbmREYXRhOiBUcmVuZHNEYXRhKSB7XG4gICAgLy9TZXQgVHJlbmRzT2JqZWN0IHdpdGggR3JhcGhJZFxuICAgIHRoaXMudHJlbmRzW3RyZW5kRGF0YS5ncmFwaElkXSA9IHRyZW5kRGF0YTtcblxuICAgIHRoaXMudHJlbmRzW3RyZW5kRGF0YS5ncmFwaElkXS5ncmFwaERhdGEgPSB0aGlzLnRyZW5kc1t0cmVuZERhdGEuZ3JhcGhJZF0uZ3JhcGhEYXRhLmZpbHRlcigoZDogYW55KSA9PiB0aGlzLmFwcGx5Q3VzdG9tRmlsdGVyKGQsIHRoaXMudHJlbmRzW3RyZW5kRGF0YS5ncmFwaElkXS5maWx0ZXIpKVxuXG4gICAgdGhpcy5pbml0VHJlbmQodHJlbmREYXRhLmdyYXBoSWQpO1xuICB9XG5cbiAgcHJpdmF0ZSBhc3luYyBpbml0VHJlbmQoZ3JhcGhJZDogYW55KSB7XG4gICAgLy9DcmVhdGluZyBDaGFydCBSYXcgSnNvblxuICAgIGNvbnN0IHRyZW5kRGF0YTogYW55ID0gYXdhaXQgdGhpcy5jcmVhdGVUcmVuZERhdGEoZ3JhcGhJZCk7XG5cbiAgICAvL1JlbmRlcmluZyBDaGFydCBvZiBHcmFwaElkXG4gICAgSGlnaGNoYXJ0cy5jaGFydChncmFwaElkLCB0cmVuZERhdGEpO1xuXG4gICAgLy8gdGhpcy5hZGRBY3Rpb25CdG5UcmVuZHMoZ3JhcGhJZCk7XG5cbiAgICByZXR1cm4gdHJ1ZTtcbiAgfVxuXG4gIHByaXZhdGUgZ2V0V2Vla3Moc3RhcnREYXRlOiBEYXRlLCBlbmREYXRlOiBEYXRlKSB7XG4gICAgbGV0IHdlZWtzID0gW107XG4gICAgLy9HZXQgV2Vla3MgZnJvbSBnaXZlbiBkYXRlIFJhbmdlXG4gICAgd2hpbGUgKHN0YXJ0RGF0ZSA8PSBlbmREYXRlKSB7XG4gICAgICBsZXQgdGVtcCA9IG5ldyBEYXRlKHN0YXJ0RGF0ZSk7XG4gICAgICB0ZW1wLnNldERhdGUodGVtcC5nZXREYXRlKCkgKyA2KTtcbiAgICAgIHdlZWtzLnB1c2godGhpcy5jb252ZXJ0RGF0ZShzdGFydERhdGUpICsgJyAtICcgKyB0aGlzLmNvbnZlcnREYXRlKHRlbXApKTtcbiAgICAgIHN0YXJ0RGF0ZSA9IHRlbXA7XG4gICAgfVxuICAgIHJldHVybiB3ZWVrcztcbiAgfVxuXG4gIHByaXZhdGUgZ2V0UXVhcnRlcnMoc3RhcnREYXRlOiBhbnksIGVuZERhdGU6IGFueSkge1xuICAgIGxldCBxdWF0YXJzID0gW107XG4gICAgLy9HZXQgUXVhcnRlcnMgZnJvbSBnaXZlbiBkYXRlIFJhbmdlXG4gICAgd2hpbGUgKHN0YXJ0RGF0ZSA8PSBlbmREYXRlKSB7XG4gICAgICBsZXQgdGVtcCA9IG5ldyBEYXRlKHN0YXJ0RGF0ZSk7XG4gICAgICB0ZW1wLnNldE1vbnRoKHRlbXAuZ2V0TW9udGgoKSArIDIpO1xuICAgICAgcXVhdGFycy5wdXNoKFxuICAgICAgICB0aGlzLmNvbnZlcnREYXRlKHN0YXJ0RGF0ZSkgKyAnIC0gJyArIHRoaXMuY29udmVydERhdGUodGVtcClcbiAgICAgICk7XG4gICAgICBzdGFydERhdGUgPSB0ZW1wO1xuICAgIH1cbiAgICByZXR1cm4gcXVhdGFycztcbiAgfVxuXG4gIHByaXZhdGUgY29udmVydERhdGUoaW5wdXREYXRlOiBEYXRlKSB7XG4gICAgbGV0IGRhdGUgPSBpbnB1dERhdGUuZ2V0RGF0ZSgpO1xuICAgIGxldCBtb250aCA9IGlucHV0RGF0ZS5nZXRNb250aCgpO1xuICAgIGxldCB5ZWFyID0gaW5wdXREYXRlLmdldEZ1bGxZZWFyKCk7XG4gICAgLy9HZXQgRGF0ZSBpbiBGb3JtYXR0ZWQgU3RyaW5nXG4gICAgcmV0dXJuIChcbiAgICAgIFN0cmluZyhkYXRlKS5wYWRTdGFydCgyLCAnMCcpICtcbiAgICAgICctJyArXG4gICAgICBTdHJpbmcobW9udGggKyAxKS5wYWRTdGFydCgyLCAnMCcpICtcbiAgICAgICctJyArXG4gICAgICBTdHJpbmcoeWVhcikucGFkU3RhcnQoNCwgJzAnKVxuICAgICk7XG4gIH1cblxuICBwcml2YXRlIGdldFBsb3RPcHRpb25zVHJlbmRzKGdyYXBoSWQ6IHN0cmluZykge1xuICAgIGxldCBwbG90T3B0aW9ucyA9IHtcbiAgICAgIHNlcmllczoge1xuICAgICAgICB0dXJib1RocmVzaG9sZDogMTAwMDAsXG4gICAgICAgIGRhdGFMYWJlbHM6IHtcbiAgICAgICAgICBjb2xvcjogJ2JsYWNrJyxcbiAgICAgICAgICBlbmFibGVkOiB0cnVlLFxuICAgICAgICAgIHN0eWxlOiB7XG4gICAgICAgICAgICBjb2xvcjogJ2JsYWNrJyxcbiAgICAgICAgICAgIHRleHRTaGFkb3c6IGZhbHNlLFxuICAgICAgICAgICAgdGV4dERlY29yYXRpb246ICdub25lJyxcbiAgICAgICAgICB9LFxuICAgICAgICB9LFxuICAgICAgICBsYWJlbDoge1xuICAgICAgICAgIHN0eWxlOiB7XG4gICAgICAgICAgICBjb2xvcjogJ2JsYWNrJyxcbiAgICAgICAgICB9LFxuICAgICAgICB9LFxuICAgICAgfSxcbiAgICB9O1xuXG4gICAgLy9PcHRpb25zIGZvciBTdGFjayBHcmFwaFxuICAgIC8vIGlmICh0aGlzLnRyZW5kc1tncmFwaElkXS5jb2x1bW5zLmluZGV4T2YoXCIlXCIpID09IC0xKSB7XG4gICAgLy8gICAvL0FkZCBQZXJjZW50IFNpZ24gYWZ0ZXIgeS1heGlzIHZhbHVlc1xuICAgIC8vICAgcGxvdE9wdGlvbnMuc2VyaWVzLmRhdGFMYWJlbHNbJ2Zvcm1hdHRlciddID0gZnVuY3Rpb24gKCkge1xuICAgIC8vICAgICByZXR1cm4gdGhpcy5wZXJjZW50YWdlLnRvRml4ZWQoMikgKyAnICUnO1xuICAgIC8vICAgfTtcbiAgICAvLyB9XG4gICAgcmV0dXJuIHBsb3RPcHRpb25zO1xuICB9XG5cbiAgcHJpdmF0ZSBjcmVhdGVUcmVuZERhdGEoZ3JhcGhJZDogYW55KTogYW55IHtcbiAgICBsZXQgX3NlbGYgPSB0aGlzO1xuXG4gICAgLy9HZXR0aW5nIFBsb3QgT3B0aW9ucyBmb3IgR3JhcGhcbiAgICBjb25zdCBwbG90T3B0aW9ucyA9IHRoaXMuZ2V0UGxvdE9wdGlvbnNUcmVuZHMoZ3JhcGhJZCk7XG4gICAgY29uc3Qgc2VyaWVzRGF0YSA9IHRoaXMuZ2V0U2VyaWVzRGF0YShcbiAgICAgIHRoaXMudHJlbmRzW2dyYXBoSWRdLmdyYXBoRGF0YSxcbiAgICAgIHRoaXMudHJlbmRzW2dyYXBoSWRdLmdyYXBoSWRcbiAgICApO1xuXG4gICAgcmV0dXJuIHtcbiAgICAgIGNyZWRpdHM6IHtcbiAgICAgICAgdGV4dDogdGhpcy5jcmVkaXRUaXRsZSxcbiAgICAgICAgaHJlZjogdGhpcy5jcmVkaXRVcmwsXG4gICAgICAgIHN0eWxlOiB7XG4gICAgICAgICAgZm9udFNpemU6ICcxMnB4JyxcbiAgICAgICAgfSxcbiAgICAgIH0sXG4gICAgICB0aXRsZTogbnVsbCxcbiAgICAgIHBsb3RPcHRpb25zOiBwbG90T3B0aW9ucyxcbiAgICAgIGNoYXJ0OiB7XG4gICAgICAgIHR5cGU6ICdsaW5lJyxcbiAgICAgICAgZXZlbnRzOiB7XG4gICAgICAgICAgLy9IYW5kbGUgRHJpbGxkb3duIEV2ZW50IG9mIEdyYXBoXG4gICAgICAgICAgZHJpbGxkb3duOiBmdW5jdGlvbiAoZTogYW55KSB7XG4gICAgICAgICAgICBpZihlLnBvaW50cyAhPSBmYWxzZSkgcmV0dXJuXG4gICAgICAgICAgICBsZXQgY3VyckdyYXBoSWQgPSBlLnRhcmdldC51c2VyT3B0aW9ucy5zZXJpZXNbMF0uZ3JhcGhJZDsgLy9HcmFwaElkXG4gICAgICAgICAgICBsZXQgY29tcGFyaXNvbktleSA9IGUucG9pbnQub3B0aW9ucy5jb21wYXJpc29uS2V5OyAvL0NvbG9ySW5kZXggb2YgYmFyXG4gICAgICAgICAgICBsZXQgY2hhcnQgOiBhbnkgPSB0aGlzO1xuICAgICAgICAgICAgY2hhcnQuc2hvd0xvYWRpbmcoJ0xvYWRpbmcuLi4nKTtcbiAgICAgICAgICAgIGxldCBzZWxLZXkgPSBlLnBvaW50Lm5hbWU7XG4gICAgICAgICAgICBsZXQgcmFuZ2VEYXRhID0gW107XG4gICAgICAgICAgICBpZihjb21wYXJpc29uS2V5ICE9IG51bGwpe1xuICAgICAgICAgICAgICBsZXQgY29tcGFyaXNvbkRhdGEgPSBsb2Rhc2guZ3JvdXBCeShfc2VsZi50cmVuZHNbY3VyckdyYXBoSWRdLmdyYXBoRGF0YSwgX3NlbGYudHJlbmRzW2N1cnJHcmFwaElkXS5yb3dzKTtcbiAgICAgICAgICAgICAgcmFuZ2VEYXRhID0gX3NlbGYuZ2V0UmFuZ2VPYmooY29tcGFyaXNvbkRhdGFbY29tcGFyaXNvbktleV0sIF9zZWxmLnRyZW5kc1tjdXJyR3JhcGhJZF0ucmFuZ2VGaWx0ZXIsICBfc2VsZi50cmVuZHNbY3VyckdyYXBoSWRdLnJhbmdlLnN0YXJ0RGF0ZSwgX3NlbGYudHJlbmRzW2N1cnJHcmFwaElkXS5yYW5nZS5lbmREYXRlLCBfc2VsZi50cmVuZHNbY3VyckdyYXBoSWRdLmRhdGVWYXJpYWJsZSwgX3NlbGYudHJlbmRzW2N1cnJHcmFwaElkXS5yb3dzLCBfc2VsZi50cmVuZHNbY3VyckdyYXBoSWRdLmZpbHRlciwgY3VyckdyYXBoSWQpXG4gICAgICAgICAgICB9ZWxzZXtcbiAgICAgICAgICAgICAgcmFuZ2VEYXRhID0gX3NlbGYuZ2V0UmFuZ2VPYmooX3NlbGYudHJlbmRzW2N1cnJHcmFwaElkXS5ncmFwaERhdGEsIF9zZWxmLnRyZW5kc1tjdXJyR3JhcGhJZF0ucmFuZ2VGaWx0ZXIsICBfc2VsZi50cmVuZHNbY3VyckdyYXBoSWRdLnJhbmdlLnN0YXJ0RGF0ZSwgX3NlbGYudHJlbmRzW2N1cnJHcmFwaElkXS5yYW5nZS5lbmREYXRlLCBfc2VsZi50cmVuZHNbY3VyckdyYXBoSWRdLmRhdGVWYXJpYWJsZSwgX3NlbGYudHJlbmRzW2N1cnJHcmFwaElkXS5yb3dzLCBfc2VsZi50cmVuZHNbY3VyckdyYXBoSWRdLmZpbHRlciwgY3VyckdyYXBoSWQpXG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBfc2VsZi5kYXRhU2VydmljZS5zZXRNb2RhbERhdGEoe1xuICAgICAgICAgICAgICBjb2xUb1ZpZXc6IF9zZWxmLnRyZW5kc1tjdXJyR3JhcGhJZF0ubGFzdExldmVsQ29sdW1ucyxcbiAgICAgICAgICAgICAgcmVmRGF0YTogcmFuZ2VEYXRhW3NlbEtleV1cbiAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgbGV0IG1vZGFsT3B0aW9ucyA9IHtcbiAgICAgICAgICAgICAgcGFuZWxDbGFzczogJ2RhdGFQb3B1cC1tb2RhbCcsXG4gICAgICAgICAgICAgIGJhY2tkcm9wQ2xhc3M6ICdtb2RhbC1iYWNrZHJvcCcsXG4gICAgICAgICAgICB9O1xuICAgICAgICAgICAgX3NlbGYuZGlhbG9nLm9wZW4oRGF0YVBvcHVwQ29tcG9uZW50LCBtb2RhbE9wdGlvbnMpO1xuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICAgIH0sXG4gICAgICAgIH0sXG4gICAgICB9LFxuICAgICAgeEF4aXM6IHtcbiAgICAgICAgdHlwZTogJ2NhdGVnb3J5JyxcbiAgICAgICAgbGFiZWxzOiB7XG4gICAgICAgICAgc3R5bGU6IHtcbiAgICAgICAgICAgIGNvbG9yOiAncmVkJyxcbiAgICAgICAgICAgIHRleHREZWNvcmF0aW9uOiAnbm9uZScsXG4gICAgICAgICAgICB0ZXh0T3V0bGluZTogJzBweCcsXG4gICAgICAgICAgfSxcbiAgICAgICAgfSxcbiAgICAgICAgbWluOiAwLFxuICAgICAgICBhbGxvd0RlY2ltYWxzOiBmYWxzZSxcbiAgICAgICAgc2Nyb2xsYmFyOiB7XG4gICAgICAgICAgZW5hYmxlZDogdHJ1ZSxcbiAgICAgICAgfSxcbiAgICAgIH0sXG4gICAgICB5QXhpczogW1xuICAgICAgICB7XG4gICAgICAgICAgb3Bwb3NpdGU6IHRydWUsXG4gICAgICAgICAgdGl0bGU6IHtcbiAgICAgICAgICAgIHRleHQ6IG51bGwsXG4gICAgICAgICAgfSxcbiAgICAgICAgfSxcbiAgICAgIF0sXG4gICAgICBzZXJpZXM6IHNlcmllc0RhdGEsXG4gICAgfTtcbiAgfVxuXG4gIHByaXZhdGUgZ2V0U2VyaWVzRGF0YShkYXRhOiBhbnksIGdyYXBoSWQ6IHN0cmluZykge1xuICAgIGxldCBzZXJpZXMgPSBbXTtcbiAgICBpZiAodGhpcy50cmVuZHNbZ3JhcGhJZF0uY29tcGFyaXNvbi5sZW5ndGggPiAwKSB7XG4gICAgICAvL011bHRpLWxpbmUgVHJlbmRzIGZvciBDb21wYXJpc29uXG4gICAgICBsZXQgZmluYWxEYXRhID0gdGhpcy5nZXRDb21wYXJpc29uRGF0YSh0aGlzLnRyZW5kc1tncmFwaElkXS5jb21wYXJpc29uLCB0aGlzLnRyZW5kc1tncmFwaElkXS5ncmFwaERhdGEsIHRoaXMudHJlbmRzW2dyYXBoSWRdLnJvd3MsIHRoaXMudHJlbmRzW2dyYXBoSWRdLnJhbmdlRmlsdGVyLCB0aGlzLnRyZW5kc1tncmFwaElkXS5yYW5nZS5zdGFydERhdGUsIHRoaXMudHJlbmRzW2dyYXBoSWRdLnJhbmdlLmVuZERhdGUsIHRoaXMudHJlbmRzW2dyYXBoSWRdLmRhdGVWYXJpYWJsZSwgdGhpcy50cmVuZHNbZ3JhcGhJZF0uZmlsdGVyLCBncmFwaElkKTtcbiAgICAgIE9iamVjdC5rZXlzKGZpbmFsRGF0YSkuZm9yRWFjaChrZXkgPT4ge1xuICAgICAgICBsZXQgcmFuZ2VEYXRhIDogYW55ID0gW107XG4gICAgICAgIE9iamVjdC5rZXlzKGZpbmFsRGF0YVtrZXldKS5mb3JFYWNoKGtleTIgPT4ge1xuICAgICAgICAgIGxldCB0ZW1wRGF0YSA9IGZpbmFsRGF0YVtrZXldW2tleTJdO1xuICAgICAgICAgIGlmKHRlbXBEYXRhLmxlbmd0aCA+IDApe1xuICAgICAgICAgICAgdGVtcERhdGEgPSB0aGlzLmFkZEN1c3RvbVZhcmlhYmxlKHRoaXMudHJlbmRzW2dyYXBoSWRdLmN1c3RvbVZhcmlhYmxlLCB0ZW1wRGF0YSwgZmFsc2UsIHRoaXMudHJlbmRzW2dyYXBoSWRdLmRhdGFGb3JtYXQsIGZhbHNlKTtcbiAgICAgICAgICAgIGNvbnN0IGVuY291bnRlcmVkVmFsdWVzID0gdGVtcERhdGEubGVuZ3RoXG4gICAgICAgICAgICAgID8gbG9kYXNoLm1hcCh0ZW1wRGF0YSwgdGhpcy50cmVuZHNbZ3JhcGhJZF0uY29sdW1ucylcbiAgICAgICAgICAgICAgOiBbXTtcblxuICAgICAgICAgICAgY29uc3QgZGF0YVRvVHJhdmVyc2UgPSBsb2Rhc2gud2l0aG91dChcbiAgICAgICAgICAgICAgbG9kYXNoLndpdGhvdXQoZW5jb3VudGVyZWRWYWx1ZXMsICcwJyksXG4gICAgICAgICAgICAgICcnXG4gICAgICAgICAgICApO1xuICAgICAgICAgICAgcmFuZ2VEYXRhLnB1c2goe1xuICAgICAgICAgICAgICBuYW1lOiBrZXkyLFxuICAgICAgICAgICAgICBkcmlsbGRvd246IHRydWUsXG4gICAgICAgICAgICAgIGRhdGFMYWJlbHM6IHtcbiAgICAgICAgICAgICAgICBzaGFkb3c6IGZhbHNlLFxuICAgICAgICAgICAgICAgIHN0eWxlOiB7XG4gICAgICAgICAgICAgICAgICBjb2xvcjogJ2JsYWNrJyxcbiAgICAgICAgICAgICAgICAgIHRleHREZWNvcmF0aW9uOiAnbm9uZScsXG4gICAgICAgICAgICAgICAgICB0ZXh0U2hhZG93OiBmYWxzZSxcblxuICAgICAgICAgICAgICAgICAgdGV4dE91dGxpbmU6IDAsXG4gICAgICAgICAgICAgICAgfSxcbiAgICAgICAgICAgICAgICBjbGFzc05hbWU6ICdncmFwaC1kYXRhLWxhYmVsJyxcbiAgICAgICAgICAgICAgfSxcbiAgICAgICAgICAgICAgY29tcGFyaXNvbktleToga2V5LFxuICAgICAgICAgICAgICB5OiB0ZW1wRGF0YS5sZW5ndGhcbiAgICAgICAgICAgICAgICA/IHBhcnNlRmxvYXQoXG4gICAgICAgICAgICAgICAgICAvLyBuZXcgRGVjaW1hbChcbiAgICAgICAgICAgICAgICAgICAgICB0aGlzLnRyZW5kc1tncmFwaElkXS5hZ2dyZWdhdGlvbkZ1bmN0aW9uc1xuICAgICAgICAgICAgICAgICAgICAgICAgLmFnZ3JlZ2F0aW9uRnVuY3Rpb25zID09XG4gICAgICAgICAgICAgICAgICAgICAgQWdncmVnYXRpb25GdW5jdGlvbnNUeXBlLk5PX0ZVTkNUSU9OXG4gICAgICAgICAgICAgICAgICAgICAgICA/IHBhcnNlRmxvYXQoXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgZGF0YVRvVHJhdmVyc2UubGVuZ3RoID09IDBcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgID8gMFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgOiBsb2Rhc2gubWF4KGRhdGFUb1RyYXZlcnNlKVxuICAgICAgICAgICAgICAgICAgICAgICAgICApLnRvU3RyaW5nKClcbiAgICAgICAgICAgICAgICAgICAgICAgIDogdGhpcy5hcHBseUFnZ3JlZ2F0aW9uKGVuY291bnRlcmVkVmFsdWVzLCAwLCBbXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgdGhpcy50cmVuZHNbZ3JhcGhJZF0uYWdncmVnYXRpb25GdW5jdGlvbnMsXG4gICAgICAgICAgICAgICAgICAgICAgICAgIF0pLnRvUHJlY2lzaW9uKDIpXG4gICAgICAgICAgICAgICAgICApXG4gICAgICAgICAgICAgICAgICAvLyApXG4gICAgICAgICAgICAgICAgOiAwLFxuICAgICAgICAgICAgfSlcbiAgICAgICAgICB9XG5cbiAgICAgICAgfSlcbiAgICAgICAgc2VyaWVzLnB1c2goe1xuICAgICAgICAgIG5hbWU6XG4gICAgICAgICAgICBrZXkgK1xuICAgICAgICAgICAgJy0nICtcbiAgICAgICAgICAgIHRoaXMudHJlbmRzW2dyYXBoSWRdLmFnZ3JlZ2F0aW9uRnVuY3Rpb25zLmFnZ3JlZ2F0aW9uRnVuY3Rpb25zICtcbiAgICAgICAgICAgICcoJyArXG4gICAgICAgICAgICB0aGlzLnRyZW5kc1tncmFwaElkXS5jb2x1bW5zICtcbiAgICAgICAgICAgICcpJyxcbiAgICAgICAgICB0eXBlOiAnbGluZScsXG4gICAgICAgICAgZ3JhcGhJZDogZ3JhcGhJZCxcbiAgICAgICAgICBkYXRhOiByYW5nZURhdGEsXG4gICAgICAgICAgY29tcGFyaXNvbktleToga2V5XG4gICAgICAgIH0pXG4gICAgICB9KVxuICAgIH0gZWxzZSB7XG4gICAgICBsZXQgZmluYWxEYXRhID0gdGhpcy5nZXRSYW5nZU9iaih0aGlzLnRyZW5kc1tncmFwaElkXS5ncmFwaERhdGEsIHRoaXMudHJlbmRzW2dyYXBoSWRdLnJhbmdlRmlsdGVyLCB0aGlzLnRyZW5kc1tncmFwaElkXS5yYW5nZS5zdGFydERhdGUsIHRoaXMudHJlbmRzW2dyYXBoSWRdLnJhbmdlLmVuZERhdGUsIHRoaXMudHJlbmRzW2dyYXBoSWRdLmRhdGVWYXJpYWJsZSx0aGlzLnRyZW5kc1tncmFwaElkXS5yb3dzLCB0aGlzLnRyZW5kc1tncmFwaElkXS5maWx0ZXIsIGdyYXBoSWQpO1xuICAgICAgbGV0IHJhbmdlRGF0YSA6IGFueSA9IFtdO1xuICAgICAgT2JqZWN0LmtleXMoZmluYWxEYXRhKS5mb3JFYWNoKGtleSA9PiB7XG4gICAgICAgIGxldCB0ZW1wRGF0YSA9IGZpbmFsRGF0YVtrZXldO1xuICAgICAgICBpZih0ZW1wRGF0YS5sZW5ndGggPiAwKXtcbiAgICAgICAgICB0ZW1wRGF0YSA9IHRoaXMuYWRkQ3VzdG9tVmFyaWFibGUodGhpcy50cmVuZHNbZ3JhcGhJZF0uY3VzdG9tVmFyaWFibGUsIHRlbXBEYXRhLCBmYWxzZSwgdGhpcy50cmVuZHNbZ3JhcGhJZF0uZGF0YUZvcm1hdCwgZmFsc2UpO1xuICAgICAgICAgIGNvbnN0IGVuY291bnRlcmVkVmFsdWVzID0gdGVtcERhdGEubGVuZ3RoXG4gICAgICAgICAgICA/IGxvZGFzaC5tYXAodGVtcERhdGEsIHRoaXMudHJlbmRzW2dyYXBoSWRdLmNvbHVtbnMpXG4gICAgICAgICAgICA6IFtdO1xuXG4gICAgICAgICAgY29uc3QgZGF0YVRvVHJhdmVyc2UgPSBsb2Rhc2gud2l0aG91dChcbiAgICAgICAgICAgIGxvZGFzaC53aXRob3V0KGVuY291bnRlcmVkVmFsdWVzLCAnMCcpLFxuICAgICAgICAgICAgJydcbiAgICAgICAgICApO1xuICAgICAgICAgIHJhbmdlRGF0YS5wdXNoKHtcbiAgICAgICAgICAgIG5hbWU6IGtleSxcbiAgICAgICAgICAgIGRyaWxsZG93bjogdHJ1ZSxcbiAgICAgICAgICAgIGRhdGFMYWJlbHM6IHtcbiAgICAgICAgICAgICAgc2hhZG93OiBmYWxzZSxcbiAgICAgICAgICAgICAgc3R5bGU6IHtcbiAgICAgICAgICAgICAgICBjb2xvcjogJ2JsYWNrJyxcbiAgICAgICAgICAgICAgICB0ZXh0RGVjb3JhdGlvbjogJ25vbmUnLFxuICAgICAgICAgICAgICAgIHRleHRTaGFkb3c6IGZhbHNlLFxuXG4gICAgICAgICAgICAgICAgdGV4dE91dGxpbmU6IDAsXG4gICAgICAgICAgICAgIH0sXG4gICAgICAgICAgICAgIGNsYXNzTmFtZTogJ2dyYXBoLWRhdGEtbGFiZWwnLFxuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIGNvbXBhcmlzb25LZXk6IG51bGwsXG4gICAgICAgICAgICB5OiB0ZW1wRGF0YS5sZW5ndGhcbiAgICAgICAgICAgICAgPyBwYXJzZUZsb2F0KFxuICAgICAgICAgICAgICAgIC8vIG5ldyBEZWNpbWFsKFxuICAgICAgICAgICAgICAgICAgICB0aGlzLnRyZW5kc1tncmFwaElkXS5hZ2dyZWdhdGlvbkZ1bmN0aW9uc1xuICAgICAgICAgICAgICAgICAgICAgIC5hZ2dyZWdhdGlvbkZ1bmN0aW9ucyA9PVxuICAgICAgICAgICAgICAgICAgICBBZ2dyZWdhdGlvbkZ1bmN0aW9uc1R5cGUuTk9fRlVOQ1RJT05cbiAgICAgICAgICAgICAgICAgICAgICA/IHBhcnNlRmxvYXQoXG4gICAgICAgICAgICAgICAgICAgICAgICAgIGRhdGFUb1RyYXZlcnNlLmxlbmd0aCA9PSAwXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgPyAwXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgOiBsb2Rhc2gubWF4KGRhdGFUb1RyYXZlcnNlKVxuICAgICAgICAgICAgICAgICAgICAgICAgKS50b1N0cmluZygpXG4gICAgICAgICAgICAgICAgICAgICAgOiB0aGlzLmFwcGx5QWdncmVnYXRpb24oZW5jb3VudGVyZWRWYWx1ZXMsIDAsIFtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgdGhpcy50cmVuZHNbZ3JhcGhJZF0uYWdncmVnYXRpb25GdW5jdGlvbnMsXG4gICAgICAgICAgICAgICAgICAgICAgICBdKS50b1ByZWNpc2lvbigyKVxuICAgICAgICAgICAgICAgIClcbiAgICAgICAgICAgICAgICAvLyApXG4gICAgICAgICAgICAgIDogMCxcbiAgICAgICAgICB9KVxuICAgICAgICB9XG5cbiAgICAgIH0pXG4gICAgICBzZXJpZXMucHVzaCh7XG4gICAgICAgIG5hbWU6XG4gICAgICAgICAgdGhpcy50cmVuZHNbZ3JhcGhJZF0uYWdncmVnYXRpb25GdW5jdGlvbnMuYWdncmVnYXRpb25GdW5jdGlvbnMgK1xuICAgICAgICAgICcoJyArXG4gICAgICAgICAgdGhpcy50cmVuZHNbZ3JhcGhJZF0uY29sdW1ucyArXG4gICAgICAgICAgJyknLFxuICAgICAgICB0eXBlOiAnbGluZScsXG4gICAgICAgIGdyYXBoSWQ6IGdyYXBoSWQsXG4gICAgICAgIGNvbXBhcmlzb25LZXk6IG51bGwsXG4gICAgICAgIGRhdGE6IHJhbmdlRGF0YVxuICAgICAgfSlcbiAgICB9XG4gICAgcmV0dXJuIHNlcmllcztcbiAgfVxuXG4gIHByaXZhdGUgZ2V0Q29tcGFyaXNvbkRhdGEoY29tcGFyaXNvbjogYW55LCBkYXRhOiBhbnksIHhBeGlzOiBhbnksIHJhbmdlRmlsdGVyOiBhbnksIHN0YXJ0RGF0ZTogYW55LCBlbmREYXRlOiBhbnksIGRhdGVWYXJpYWJsZTogYW55LCBmaWx0ZXI6IEZpbHRlcnMsZ3JhcGhJZDogYW55KXtcbiAgICBsZXQgY29tcGFyaXNvbktleSA9IHhBeGlzO1xuICAgIGxldCBjb21wYXJpc29uRGF0YSA9IGxvZGFzaC5ncm91cEJ5KGRhdGEsIGNvbXBhcmlzb25LZXkpO1xuICAgIGxldCBmaW5hbFJlcyA6IGFueSA9IHt9O1xuICAgIE9iamVjdC5rZXlzKGNvbXBhcmlzb25EYXRhKS5mb3JFYWNoKGtleSA9PiB7XG4gICAgICBpZihjb21wYXJpc29uLmluZGV4T2Yoa2V5KSAhPSAtMSl7XG4gICAgICAgIGxldCByYW5nZU9iaiA9IHRoaXMuZ2V0UmFuZ2VPYmooY29tcGFyaXNvbkRhdGFba2V5XSxyYW5nZUZpbHRlciwgc3RhcnREYXRlLCBlbmREYXRlLCBkYXRlVmFyaWFibGUsIHhBeGlzLCBmaWx0ZXIsIGdyYXBoSWQpXG4gICAgICAgIGZpbmFsUmVzW2tleV0gPSByYW5nZU9iajtcbiAgICAgIH1cbiAgICB9KVxuICAgIHJldHVybiBmaW5hbFJlcztcbiAgfVxuXG4gIHByaXZhdGUgZ2V0UmFuZ2VPYmooZGF0YTogYW55LCByYW5nZUZpbHRlcjogYW55LCBzdGFydERhdGU6IGFueSwgZW5kRGF0ZTogYW55LCBkYXRlVmFyaWFibGU6IGFueSwgeEF4aXM6IGFueSwgZmlsdGVyOiBGaWx0ZXJzLCBncmFwaElkOiBhbnkpe1xuICAgIGxldCByYW5nZU9iaiA6IGFueSA9IHt9O1xuICAgIGxldCBzb3J0ZWRNYXA6IGFueSA9IHt9O1xuICAgIGxldCBzb3J0ZWRLZXkgPSBbXTtcbiAgICBsZXQgZmlsdGVyZWREYXRhID0gW107XG4gICAgc3dpdGNoKHJhbmdlRmlsdGVyKXtcbiAgICAgIGNhc2UgUmFuZ2VGaWx0ZXIuREFJTFk6XG4gICAgICAgIGRhdGEuZm9yRWFjaCgoZDogYW55KSA9PiB7XG4gICAgICAgICAgbGV0IGRhdGVWYWx1ZSA9IGRbZGF0ZVZhcmlhYmxlXS5zcGxpdChcIiBcIilbMF07XG4gICAgICAgICAgZFtcIioqKmRhdGUqKipcIl0gPSBkYXRlVmFsdWU7XG4gICAgICAgICAgaWYodGhpcy5hcHBseURhdGFGaWx0ZXJUcmVuZHMoZCxmaWx0ZXIseEF4aXMsZ3JhcGhJZCkpe1xuICAgICAgICAgICAgZmlsdGVyZWREYXRhLnB1c2goZCk7XG4gICAgICAgICAgfVxuICAgICAgICB9KVxuICAgICAgICByYW5nZU9iaiA9IGxvZGFzaC5ncm91cEJ5KGRhdGEsIFwiKioqZGF0ZSoqKlwiKTtcbiAgICAgICAgc29ydGVkS2V5ID0gT2JqZWN0LmtleXMocmFuZ2VPYmopLnNvcnQoKGEgLCBiKSA9PiB7XG4gICAgICAgICAgbGV0IGRhdGVBID0gdGhpcy5nZXRGb3JtYXR0ZWREYXRlKGEsIERhdGVGb3JtYXQuRERfTU1fWVlZWSk7XG4gICAgICAgICAgbGV0IGRhdGVCID0gdGhpcy5nZXRGb3JtYXR0ZWREYXRlKGIsIERhdGVGb3JtYXQuRERfTU1fWVlZWSk7XG4gICAgICAgICAgcmV0dXJuIGRhdGVBIC0gZGF0ZUI7XG4gICAgICAgIH0pXG4gICAgICAgIHNvcnRlZEtleS5mb3JFYWNoKGtleSA9PiB7XG4gICAgICAgICAgc29ydGVkTWFwW2tleV0gPSByYW5nZU9ialtrZXldO1xuICAgICAgICB9KVxuICAgICAgICBicmVhaztcbiAgICAgIGNhc2UgUmFuZ2VGaWx0ZXIuV0VFS0xZOlxuICAgICAgICBsZXQgYWxsV2Vla3MgPSB0aGlzLmdldFdlZWtzKHN0YXJ0RGF0ZSwgZW5kRGF0ZSk7XG4gICAgICAgIGRhdGEuZm9yRWFjaCgoZDogYW55KSA9PiB7XG4gICAgICAgICAgICBsZXQgdmFyaWFibGVEYXRlID0gdGhpcy5nZXRGb3JtYXR0ZWREYXRlKGRbZGF0ZVZhcmlhYmxlXSk7XG4gICAgICAgICAgICBsZXQgc2VsV2VlayA9IGFsbFdlZWtzLmZpbHRlcih3ZWVrID0+IHtcbiAgICAgICAgICAgICAgbGV0IFtzdGFydFJhbmdlLCBlbmRSYW5nZV0gOiBhbnkgPSB3ZWVrLnNwbGl0KFwiIC0gXCIpO1xuICAgICAgICAgICAgICBzdGFydFJhbmdlID0gdGhpcy5nZXRGb3JtYXR0ZWREYXRlKHN0YXJ0UmFuZ2UsRGF0ZUZvcm1hdC5ERF9NTV9ZWVlZKTtcbiAgICAgICAgICAgICAgZW5kUmFuZ2UgPSB0aGlzLmdldEZvcm1hdHRlZERhdGUoZW5kUmFuZ2UsIERhdGVGb3JtYXQuRERfTU1fWVlZWSk7XG4gICAgICAgICAgICAgIGlmKHZhcmlhYmxlRGF0ZS5nZXRUaW1lKCkgPj0gc3RhcnRSYW5nZS5nZXRUaW1lKCkgJiYgdmFyaWFibGVEYXRlLmdldFRpbWUoKSA8PSBlbmRSYW5nZS5nZXRUaW1lKCkpe1xuICAgICAgICAgICAgICAgIHJldHVybiB0cnVlO1xuICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgIHJldHVybiBmYWxzZTtcbiAgICAgICAgICAgIH0pXG4gICAgICAgICAgICBpZiAoc2VsV2Vlay5sZW5ndGggPiAwKXtcbiAgICAgICAgICAgICAgICBkLnB1dChcIioqKndlZWsqKipcIiwgc2VsV2Vla1swXSk7XG4gICAgICAgICAgICB9ZWxzZSB7XG4gICAgICAgICAgICAgICAgZC5wdXQoXCIqKip3ZWVrKioqXCIsIFwiXCIpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgaWYodGhpcy5hcHBseURhdGFGaWx0ZXJUcmVuZHMoZCxmaWx0ZXIseEF4aXMsZ3JhcGhJZCkpe1xuICAgICAgICAgICAgICAgIGZpbHRlcmVkRGF0YS5wdXNoKGQpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9KTtcbiAgICAgICAgcmFuZ2VPYmogPSBsb2Rhc2guZ3JvdXBCeShkYXRhLCBcIioqKndlZWsqKipcIik7XG4gICAgICAgIHNvcnRlZEtleSA9IE9iamVjdC5rZXlzKHJhbmdlT2JqKS5zb3J0KChhICwgYikgPT4ge1xuICAgICAgICAgIGxldCBkYXRlQSA9IHRoaXMuZ2V0Rm9ybWF0dGVkRGF0ZShhLnNwbGl0KFwiIC0gXCIpWzBdLCBEYXRlRm9ybWF0LkREX01NX1lZWVkpO1xuICAgICAgICAgIGxldCBkYXRlQiA9IHRoaXMuZ2V0Rm9ybWF0dGVkRGF0ZShiLnNwbGl0KFwiIC0gXCIpWzBdLCBEYXRlRm9ybWF0LkREX01NX1lZWVkpO1xuICAgICAgICAgIHJldHVybiBkYXRlQSAtIGRhdGVCO1xuICAgICAgICB9KVxuICAgICAgICBzb3J0ZWRLZXkuZm9yRWFjaChrZXkgPT4ge1xuICAgICAgICAgIHNvcnRlZE1hcFtrZXldID0gcmFuZ2VPYmpba2V5XTtcbiAgICAgICAgfSlcbiAgICAgICAgYnJlYWs7XG4gICAgICBjYXNlIFJhbmdlRmlsdGVyLk1PTlRITFk6XG4gICAgICAgIGRhdGEuZm9yRWFjaCgoZDogYW55KSA9PiB7XG4gICAgICAgICAgbGV0IGRhdGVWYWx1ZSA9IGRbZGF0ZVZhcmlhYmxlXS5zcGxpdChcIiBcIilbMF07XG4gICAgICAgICAgZGF0ZVZhbHVlID0gZGF0ZVZhbHVlLnNwbGl0KFwiLVwiKVsxXSArIGRhdGVWYWx1ZS5zcGxpdChcIi1cIilbMl07XG4gICAgICAgICAgZFtcIioqKm1vbnRoKioqXCJdID0gZGF0ZVZhbHVlO1xuICAgICAgICAgIGlmKHRoaXMuYXBwbHlEYXRhRmlsdGVyVHJlbmRzKGQsZmlsdGVyLHhBeGlzLGdyYXBoSWQpKXtcbiAgICAgICAgICAgIGZpbHRlcmVkRGF0YS5wdXNoKGQpO1xuICAgICAgICAgIH1cbiAgICAgICAgfSlcbiAgICAgICAgcmFuZ2VPYmogPSBsb2Rhc2guZ3JvdXBCeShkYXRhLCBcIioqKm1vbnRoKioqXCIpO1xuICAgICAgICBzb3J0ZWRLZXkgPSBPYmplY3Qua2V5cyhyYW5nZU9iaikuc29ydCgoYSAsIGIpID0+IHtcbiAgICAgICAgICBsZXQgW2RhdGVBTW9udGgsIGRhdGVBWWVhcl0gPSBhLnNwbGl0KFwiLVwiKTtcbiAgICAgICAgICBsZXQgW2RhdGVCTW9udGgsIGRhdGVCWWVhcl0gPSBiLnNwbGl0KFwiLVwiKTtcbiAgICAgICAgICByZXR1cm4gZGF0ZUFZZWFyID09IGRhdGVCWWVhciA/IChwYXJzZUludChkYXRlQU1vbnRoKSAtIHBhcnNlSW50KGRhdGVCTW9udGgpKSA6IChwYXJzZUludChkYXRlQVllYXIpIC0gcGFyc2VJbnQoZGF0ZUJZZWFyKSk7XG4gICAgICAgIH0pXG4gICAgICAgIHNvcnRlZEtleS5mb3JFYWNoKGtleSA9PiB7XG4gICAgICAgICAgc29ydGVkTWFwW2tleV0gPSByYW5nZU9ialtrZXldO1xuICAgICAgICB9KVxuICAgICAgICBicmVhaztcbiAgICAgIGNhc2UgUmFuZ2VGaWx0ZXIuUVVBUlRFUkxZOlxuICAgICAgICBsZXQgYWxsUXVhcnRhcnMgPSB0aGlzLmdldFF1YXJ0ZXJzKHN0YXJ0RGF0ZSwgZW5kRGF0ZSk7XG4gICAgICAgIGRhdGEuZm9yRWFjaCgoZDogYW55KSA9PiB7XG4gICAgICAgICAgICBsZXQgdmFyaWFibGVEYXRlID0gdGhpcy5nZXRGb3JtYXR0ZWREYXRlKGRbZGF0ZVZhcmlhYmxlXSk7XG4gICAgICAgICAgICBsZXQgc2VsUXVhcnRhciA9IGFsbFF1YXJ0YXJzLmZpbHRlcihxdWFydGFyID0+IHtcbiAgICAgICAgICAgICAgbGV0IFtzdGFydFJhbmdlLCBlbmRSYW5nZV0gOiBhbnkgPSBxdWFydGFyLnNwbGl0KFwiIC0gXCIpO1xuICAgICAgICAgICAgICBzdGFydFJhbmdlID0gdGhpcy5nZXRGb3JtYXR0ZWREYXRlKHN0YXJ0UmFuZ2UsRGF0ZUZvcm1hdC5ERF9NTV9ZWVlZKTtcbiAgICAgICAgICAgICAgZW5kUmFuZ2UgPSB0aGlzLmdldEZvcm1hdHRlZERhdGUoZW5kUmFuZ2UsIERhdGVGb3JtYXQuRERfTU1fWVlZWSk7XG4gICAgICAgICAgICAgIGlmKHZhcmlhYmxlRGF0ZS5nZXRUaW1lKCkgPj0gc3RhcnRSYW5nZS5nZXRUaW1lKCkgJiYgdmFyaWFibGVEYXRlLmdldFRpbWUoKSA8PSBlbmRSYW5nZS5nZXRUaW1lKCkpe1xuICAgICAgICAgICAgICAgIHJldHVybiB0cnVlO1xuICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgIHJldHVybiBmYWxzZTtcbiAgICAgICAgICAgIH0pXG4gICAgICAgICAgICBpZiAoc2VsUXVhcnRhci5sZW5ndGggPiAwKXtcbiAgICAgICAgICAgICAgICBkLnB1dChcIioqKnF1YXRhcioqKlwiLCBzZWxRdWFydGFyWzBdKTtcbiAgICAgICAgICAgIH1lbHNlIHtcbiAgICAgICAgICAgICAgICBkLnB1dChcIioqKnF1YXRhcioqKlwiLCBcIlwiKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGlmKHRoaXMuYXBwbHlEYXRhRmlsdGVyVHJlbmRzKGQsZmlsdGVyLHhBeGlzLGdyYXBoSWQpKXtcbiAgICAgICAgICAgICAgICBmaWx0ZXJlZERhdGEucHVzaChkKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfSk7XG4gICAgICAgIHJhbmdlT2JqID0gbG9kYXNoLmdyb3VwQnkoZGF0YSwgXCIqKipxdWF0YXIqKipcIik7XG4gICAgICAgIHNvcnRlZEtleSA9IE9iamVjdC5rZXlzKHJhbmdlT2JqKS5zb3J0KChhICwgYikgPT4ge1xuICAgICAgICAgIGxldCBkYXRlQSA9IHRoaXMuZ2V0Rm9ybWF0dGVkRGF0ZShhLnNwbGl0KFwiIC0gXCIpWzBdLCBEYXRlRm9ybWF0LkREX01NX1lZWVkpO1xuICAgICAgICAgIGxldCBkYXRlQiA9IHRoaXMuZ2V0Rm9ybWF0dGVkRGF0ZShiLnNwbGl0KFwiIC0gXCIpWzBdLCBEYXRlRm9ybWF0LkREX01NX1lZWVkpO1xuICAgICAgICAgIHJldHVybiBkYXRlQSAtIGRhdGVCO1xuICAgICAgICB9KVxuICAgICAgICBzb3J0ZWRLZXkuZm9yRWFjaChrZXkgPT4ge1xuICAgICAgICAgIHNvcnRlZE1hcFtrZXldID0gcmFuZ2VPYmpba2V5XTtcbiAgICAgICAgfSlcbiAgICAgICAgYnJlYWs7XG4gICAgICBjYXNlIFJhbmdlRmlsdGVyLllFQVJMWTpcbiAgICAgICAgZGF0YS5mb3JFYWNoKChkOiBhbnkpID0+IHtcbiAgICAgICAgICBsZXQgZGF0ZVZhbHVlID0gZFtkYXRlVmFyaWFibGVdLnNwbGl0KFwiIFwiKVsyXTtcbiAgICAgICAgICBkW1wiKioqeWVhcioqKlwiXSA9IGRhdGVWYWx1ZTtcbiAgICAgICAgICBpZih0aGlzLmFwcGx5RGF0YUZpbHRlclRyZW5kcyhkLGZpbHRlcix4QXhpcyxncmFwaElkKSl7XG4gICAgICAgICAgICBmaWx0ZXJlZERhdGEucHVzaChkKTtcbiAgICAgICAgICB9XG4gICAgICAgIH0pXG4gICAgICAgIHJhbmdlT2JqID0gbG9kYXNoLmdyb3VwQnkoZGF0YSwgXCIqKip5ZWFyKioqXCIpO1xuICAgICAgICBzb3J0ZWRLZXkgPSBPYmplY3Qua2V5cyhyYW5nZU9iaikuc29ydCgoYSAsIGIpID0+IHtcbiAgICAgICAgICBsZXQgZGF0ZUFZZWFyID0gYTtcbiAgICAgICAgICBsZXQgZGF0ZUJZZWFyID0gYjtcbiAgICAgICAgICByZXR1cm4gKHBhcnNlSW50KGRhdGVBWWVhcikgLSBwYXJzZUludChkYXRlQlllYXIpKTtcbiAgICAgICAgfSlcbiAgICAgICAgc29ydGVkS2V5LmZvckVhY2goa2V5ID0+IHtcbiAgICAgICAgICBzb3J0ZWRNYXBba2V5XSA9IHJhbmdlT2JqW2tleV07XG4gICAgICAgIH0pXG4gICAgICAgIGJyZWFrO1xuICAgIH1cbiAgICByZXR1cm4gc29ydGVkTWFwO1xuICB9XG5cbiAgcHJpdmF0ZSBhcHBseURhdGFGaWx0ZXJUcmVuZHMoZGF0YTogYW55LCBmaWx0ZXI6IEZpbHRlcnMsIHhBeGlzOiBhbnkgLGdyYXBoSWQ6IGFueSkge1xuXG4gICAgbGV0IHNlbFhGaWx0ZXIgPSBmaWx0ZXIueEF4aXMuZmlsdGVyKGYgPT4gZi52YXJpYWJsZU5hbWUgPT0geEF4aXMpO1xuICAgIGxldCBpc1ZhbGlkID0gc2VsWEZpbHRlci5sZW5ndGggPT0gMDtcbiAgICBpZiAoc2VsWEZpbHRlci5sZW5ndGggPiAwKSB7XG4gICAgICAgIGxldCBmaWx0ZXJUb0FwcGx5ID0gc2VsWEZpbHRlclswXTtcbiAgICAgICAgbGV0IHZhbHVlcyA9ICBmaWx0ZXJUb0FwcGx5LnZhbHVlcztcbiAgICAgICAgbGV0IGRhdGFWYWx1ZSA9IGRhdGFbZmlsdGVyVG9BcHBseS52YXJpYWJsZU5hbWVdO1xuICAgICAgICBsZXQgdmFyaWFibGVUeXBlID0gZmlsdGVyVG9BcHBseS52YXJpYWJsZVR5cGU7XG4gICAgICAgIHN3aXRjaCAoZmlsdGVyVG9BcHBseS5maWx0ZXJUeXBlKSB7XG4gICAgICAgICAgICBjYXNlIFwiSU5cIjpcbiAgICAgICAgICAgICAgICBpZiAodmFsdWVzLmluY2x1ZGVzKGRhdGFWYWx1ZS50b1N0cmluZygpKSkge1xuICAgICAgICAgICAgICAgICAgICBpc1ZhbGlkID0gdHJ1ZTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICBjYXNlIFwiTk9UIElOXCI6XG4gICAgICAgICAgICAgICAgaWYgKCF2YWx1ZXMuaW5jbHVkZXMoZGF0YVZhbHVlLnRvU3RyaW5nKCkpKSB7XG4gICAgICAgICAgICAgICAgICAgIGlzVmFsaWQgPSB0cnVlO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgIGNhc2UgXCI+XCI6XG4gICAgICAgICAgICAgICAgaWYgKGRhdGFWYWx1ZSA+IHZhbHVlc1swXSkge1xuICAgICAgICAgICAgICAgICAgICBpc1ZhbGlkID0gdHJ1ZTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICBjYXNlIFwiPFwiOlxuICAgICAgICAgICAgICAgIGlmIChkYXRhVmFsdWUgPCB2YWx1ZXNbMF0pIHtcbiAgICAgICAgICAgICAgICAgICAgaXNWYWxpZCA9IHRydWU7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgY2FzZSBcIj49XCI6XG4gICAgICAgICAgICAgICAgaWYgKGRhdGFWYWx1ZSA+PSB2YWx1ZXNbMF0pIHtcbiAgICAgICAgICAgICAgICAgICAgaXNWYWxpZCA9IHRydWU7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgY2FzZSBcIjw9XCI6XG4gICAgICAgICAgICAgICAgaWYgKGRhdGFWYWx1ZSA8PSB2YWx1ZXMpIHtcbiAgICAgICAgICAgICAgICAgICAgaXNWYWxpZCA9IHRydWU7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgY2FzZSBcIj09XCI6XG4gICAgICAgICAgICAgICAgaWYgKGRhdGFWYWx1ZSA9PSB2YWx1ZXMpIHtcbiAgICAgICAgICAgICAgICAgICAgaXNWYWxpZCA9IHRydWU7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgY2FzZSBcIiE9XCI6XG4gICAgICAgICAgICAgICAgaWYgKGRhdGFWYWx1ZSAhPSB2YWx1ZXNbMF0pIHtcbiAgICAgICAgICAgICAgICAgICAgaXNWYWxpZCA9IGZhbHNlO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgIGNhc2UgXCJiZXRcIjpcbiAgICAgICAgICAgICAgICBpZiAoZGF0YVZhbHVlID49IHZhbHVlc1swXSAmJiBkYXRhVmFsdWUgPCB2YWx1ZXNbMV0pIHtcbiAgICAgICAgICAgICAgICAgICAgaXNWYWxpZCA9IHRydWU7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgICAgIGNhc2UgRmlsdGVyVHlwZXMuQkVGT1JFOlxuICAgICAgICAgICAgICAgIGlmICh2YXJpYWJsZVR5cGUgPT0gRGF0YVR5cGUuREFURSkge1xuICAgICAgICAgICAgICAgICAgbGV0IG9wZXJhbmQxID0gdGhpcy5nZXRGb3JtYXR0ZWREYXRlKFxuICAgICAgICAgICAgICAgICAgICBkYXRhVmFsdWUsXG4gICAgICAgICAgICAgICAgICAgIGZpbHRlclRvQXBwbHkuZm9ybWF0XG4gICAgICAgICAgICAgICAgICApO1xuICAgICAgICAgICAgICAgICAgbGV0IG9wZXJhbmQyID0gbmV3IERhdGUodmFsdWVzWzBdKTtcbiAgICAgICAgICAgICAgICAgIGlmIChvcGVyYW5kMSA8IG9wZXJhbmQyKSB7XG4gICAgICAgICAgICAgICAgICAgIGlzVmFsaWQgPSB0cnVlO1xuICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgICBsZXQgY3VyclNlY29uZHMgPSB0aGlzLmdldEZvcm1hdHRlZERhdGUoXG4gICAgICAgICAgICAgICAgICAgIGRhdGFWYWx1ZSxcbiAgICAgICAgICAgICAgICAgICAgZmlsdGVyVG9BcHBseS5mb3JtYXRcbiAgICAgICAgICAgICAgICAgICk7XG4gICAgICAgICAgICAgICAgICBsZXQgW2hvdXIsIG1pbl0gPSB2YWx1ZXNbMF1cbiAgICAgICAgICAgICAgICAgICAgLnNwbGl0KCc6JylcbiAgICAgICAgICAgICAgICAgICAgLm1hcCgoZWw6IGFueSkgPT4gcGFyc2VJbnQoZWwpKTtcbiAgICAgICAgICAgICAgICAgIGxldCBjb21wYXJlZFNlYyA9IGhvdXIgKiA2MCAqIDYwICsgbWluICogNjA7XG4gICAgICAgICAgICAgICAgICBpZiAoY3VyclNlY29uZHMgPCBjb21wYXJlZFNlYykge1xuICAgICAgICAgICAgICAgICAgICBpc1ZhbGlkID0gdHJ1ZTtcbiAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICAgIGNhc2UgRmlsdGVyVHlwZXMuQUZURVI6XG4gICAgICAgICAgICAgICAgaWYgKHZhcmlhYmxlVHlwZSA9PSBEYXRhVHlwZS5EQVRFKSB7XG4gICAgICAgICAgICAgICAgICBsZXQgb3BlcmFuZDEgPSB0aGlzLmdldEZvcm1hdHRlZERhdGUoXG4gICAgICAgICAgICAgICAgICAgIGRhdGFWYWx1ZSxcbiAgICAgICAgICAgICAgICAgICAgZmlsdGVyVG9BcHBseS5mb3JtYXRcbiAgICAgICAgICAgICAgICAgICk7XG4gICAgICAgICAgICAgICAgICBsZXQgb3BlcmFuZDIgPSBuZXcgRGF0ZSh2YWx1ZXNbMF0pO1xuICAgICAgICAgICAgICAgICAgaWYgKG9wZXJhbmQxID4gb3BlcmFuZDIpIHtcbiAgICAgICAgICAgICAgICAgICAgaXNWYWxpZCA9IHRydWU7XG4gICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICAgIGxldCBjdXJyU2Vjb25kcyA9IHRoaXMuZ2V0Rm9ybWF0dGVkRGF0ZShcbiAgICAgICAgICAgICAgICAgICAgZGF0YVZhbHVlLFxuICAgICAgICAgICAgICAgICAgICBmaWx0ZXJUb0FwcGx5LmZvcm1hdFxuICAgICAgICAgICAgICAgICAgKTtcbiAgICAgICAgICAgICAgICAgIGxldCBbaG91ciwgbWluXSA9IHZhbHVlc1swXVxuICAgICAgICAgICAgICAgICAgICAuc3BsaXQoJzonKVxuICAgICAgICAgICAgICAgICAgICAubWFwKChlbDogYW55KSA9PiBwYXJzZUludChlbCkpO1xuICAgICAgICAgICAgICAgICAgbGV0IGNvbXBhcmVkU2VjID0gaG91ciAqIDYwICogNjAgKyBtaW4gKiA2MDtcbiAgICAgICAgICAgICAgICAgIGlmIChjdXJyU2Vjb25kcyA+IGNvbXBhcmVkU2VjKSB7XG4gICAgICAgICAgICAgICAgICAgIGlzVmFsaWQgPSB0cnVlO1xuICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgICAgY2FzZSBGaWx0ZXJUeXBlcy5CRVRXRUVOOlxuICAgICAgICAgICAgICAgIGlmICh2YXJpYWJsZVR5cGUgPT0gRGF0YVR5cGUuREFURSkge1xuICAgICAgICAgICAgICAgICAgbGV0IG9wZXJhbmQxID0gdGhpcy5nZXRGb3JtYXR0ZWREYXRlKFxuICAgICAgICAgICAgICAgICAgICBkYXRhVmFsdWUsXG4gICAgICAgICAgICAgICAgICAgIGZpbHRlclRvQXBwbHkuZm9ybWF0XG4gICAgICAgICAgICAgICAgICApO1xuICAgICAgICAgICAgICAgICAgbGV0IG9wZXJhbmQyID0gbmV3IERhdGUodmFsdWVzWzBdKTtcbiAgICAgICAgICAgICAgICAgIGxldCBvcGVyYW5kMyA9IG5ldyBEYXRlKHZhbHVlc1sxXSk7XG4gICAgICAgICAgICAgICAgICBpZiAob3BlcmFuZDEgPj0gb3BlcmFuZDIgJiYgb3BlcmFuZDEgPCBvcGVyYW5kMykge1xuICAgICAgICAgICAgICAgICAgICBpc1ZhbGlkID0gdHJ1ZTtcbiAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgICAgbGV0IGN1cnJTZWNvbmRzID0gdGhpcy5nZXRGb3JtYXR0ZWREYXRlKFxuICAgICAgICAgICAgICAgICAgICBkYXRhVmFsdWUsXG4gICAgICAgICAgICAgICAgICAgIGZpbHRlclRvQXBwbHkuZm9ybWF0XG4gICAgICAgICAgICAgICAgICApO1xuICAgICAgICAgICAgICAgICAgbGV0IFtob3VyLCBtaW5dID0gdmFsdWVzWzBdXG4gICAgICAgICAgICAgICAgICAgIC5zcGxpdCgnOicpXG4gICAgICAgICAgICAgICAgICAgIC5tYXAoKGVsOiBhbnkpID0+IHBhcnNlSW50KGVsKSk7XG4gICAgICAgICAgICAgICAgICBsZXQgW2VuZGhvdXIsIGVuZG1pbl0gPSB2YWx1ZXNbMV1cbiAgICAgICAgICAgICAgICAgIC5zcGxpdCgnOicpXG4gICAgICAgICAgICAgICAgICAubWFwKChlbDogYW55KSA9PiBwYXJzZUludChlbCkpO1xuICAgICAgICAgICAgICAgICAgbGV0IGNvbXBhcmVkU2VjID0gaG91ciAqIDYwICogNjAgKyBtaW4gKiA2MDtcbiAgICAgICAgICAgICAgICAgIGxldCBlbmRDb21wYXJlZFNlYyA9IGVuZGhvdXIgKiA2MCAqIDYwICsgZW5kbWluICogNjA7XG4gICAgICAgICAgICAgICAgICBpZiAoIGN1cnJTZWNvbmRzID49IGNvbXBhcmVkU2VjICYmXG4gICAgICAgICAgICAgICAgICAgIGN1cnJTZWNvbmRzIDwgZW5kQ29tcGFyZWRTZWMpIHtcbiAgICAgICAgICAgICAgICAgICAgaXNWYWxpZCA9IHRydWU7XG4gICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICB9XG4gICAgfVxuICAgIC8vIGlmIChpc1ZhbGlkICYmIGZpbHRlci5jdXN0b21GaWx0ZXIubGVuZ3RoID4gMCkge1xuICAgIC8vICAgICBpc1ZhbGlkID0gdGhpcy5hcHBseUN1c3RvbUZpbHRlcihkYXRhLCBmaWx0ZXIpO1xuICAgIC8vIH1cbiAgICByZXR1cm4gaXNWYWxpZDtcbn1cbn1cbiJdfQ==