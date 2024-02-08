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
XSightsCoreService.ɵfac = i0.ɵɵngDeclareFactory({ minVersion: "12.0.0", version: "13.0.3", ngImport: i0, type: XSightsCoreService, deps: [{ token: i1.NgbModal }, { token: i1.NgbModalConfig }, { token: i2.DataService }], target: i0.ɵɵFactoryTarget.Injectable });
XSightsCoreService.ɵprov = i0.ɵɵngDeclareInjectable({ minVersion: "12.0.0", version: "13.0.3", ngImport: i0, type: XSightsCoreService, providedIn: 'root' });
i0.ɵɵngDeclareClassMetadata({ minVersion: "12.0.0", version: "13.0.3", ngImport: i0, type: XSightsCoreService, decorators: [{
            type: Injectable,
            args: [{
                    providedIn: 'root',
                }]
        }], ctorParameters: function () { return [{ type: i1.NgbModal }, { type: i1.NgbModalConfig }, { type: i2.DataService }]; } });
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoieC1zaWdodHMtY29yZS5zZXJ2aWNlLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vLi4vLi4vcHJvamVjdHMveC1zaWdodHMtY29yZS9zcmMvbGliL3gtc2lnaHRzLWNvcmUuc2VydmljZS50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQSxPQUFPLEVBQUUsVUFBVSxFQUFFLE1BQU0sZUFBZSxDQUFDO0FBRTNDLE9BQU8sS0FBSyxVQUFVLE1BQU0sWUFBWSxDQUFDO0FBQ3pDLE9BQU8sU0FBUyxNQUFNLDhCQUE4QixDQUFDO0FBQ3JELE9BQU8sS0FBSyxNQUFNLE1BQU0sUUFBUSxDQUFDO0FBQ2pDLE9BQU8sWUFBWSxNQUFNLDhCQUE4QixDQUFDO0FBQ3hELE9BQU8sZ0JBQWdCLE1BQU0sc0NBQXNDLENBQUM7QUFDcEUsT0FBTyxhQUFhLE1BQU0sa0NBQWtDLENBQUM7QUFDN0QsT0FBTyxVQUFVLE1BQU0sMEJBQTBCLENBQUM7QUFDbEQsT0FBTyxFQUFFLFNBQVMsRUFBRSxNQUFNLGNBQWMsQ0FBQztBQUl6QyxPQUFPLEVBRUwsVUFBVSxHQUVYLE1BQU0sK0JBQStCLENBQUM7QUFDdkMsT0FBTyxFQUNMLFdBQVcsR0FHWixNQUFNLCtCQUErQixDQUFDO0FBS3ZDLE9BQU8sRUFFTCxpQkFBaUIsRUFFakIsV0FBVyxHQUNaLE1BQU0sZ0NBQWdDLENBQUM7QUFNeEMsT0FBTyxFQUVMLFFBQVEsRUFDUixVQUFVLEVBQ1YsVUFBVSxHQUNYLE1BQU0sNkJBQTZCLENBQUM7QUFDckMsT0FBTyxFQUVMLGVBQWUsR0FFaEIsTUFBTSwrQkFBK0IsQ0FBQztBQUN2QyxPQUFPLG1CQUFtQixNQUFNLHNDQUFzQyxDQUFDO0FBQ3ZFLE9BQU8sRUFBRSxrQkFBa0IsRUFBRSxNQUFNLDhDQUE4QyxDQUFDOzs7O0FBR2xGLFlBQVksQ0FBQyxVQUFVLENBQUMsQ0FBQztBQUN6QixnQkFBZ0IsQ0FBQyxVQUFVLENBQUMsQ0FBQztBQUM3QixVQUFVLENBQUMs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QixNQUFNOzJGQUVQLGtCQUFrQjtrQkFIOUIsVUFBVTttQkFBQztvQkFDVixVQUFVLEVBQUUsTUFBTTtpQkFDbkIiLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgeyBJbmplY3RhYmxlIH0gZnJvbSAnQGFuZ3VsYXIvY29yZSc7XG5pbXBvcnQgeyBOZ2JNb2RhbCwgTmdiTW9kYWxDb25maWcgfSBmcm9tICdAbmctYm9vdHN0cmFwL25nLWJvb3RzdHJhcCc7XG5pbXBvcnQgKiBhcyBIaWdoY2hhcnRzIGZyb20gJ2hpZ2hjaGFydHMnO1xuaW1wb3J0IERyaWxsZG93biBmcm9tICdoaWdoY2hhcnRzL21vZHVsZXMvZHJpbGxkb3duJztcbmltcG9ydCAqIGFzIGxvZGFzaCBmcm9tICdsb2Rhc2gnO1xuaW1wb3J0IEhDX2V4cG9ydGluZyBmcm9tICdoaWdoY2hhcnRzL21vZHVsZXMvZXhwb3J0aW5nJztcbmltcG9ydCBvZmZsaW5lRXhwb3J0aW5nIGZyb20gJ2hpZ2hjaGFydHMvbW9kdWxlcy9vZmZsaW5lLWV4cG9ydGluZyc7XG5pbXBvcnQgYWNjZXNzaWJpbGl0eSBmcm9tICdoaWdoY2hhcnRzL21vZHVsZXMvYWNjZXNzaWJpbGl0eSc7XG5pbXBvcnQgaGlnaFN0b2NrcyBmcm9tICdoaWdoY2hhcnRzL21vZHVsZXMvc3RvY2snO1xuaW1wb3J0IHsgQmlnTnVtYmVyIH0gZnJvbSAnYmlnbnVtYmVyLmpzJztcblxuXG5pbXBvcnQgRGVjaW1hbCBmcm9tICdkZWNpbWFsLmpzJztcbmltcG9ydCB7XG4gIEdyYXBoRGF0YSxcbiAgR3JhcGhUeXBlcyxcbiAgR3JhcGhMaXN0LFxufSBmcm9tICcuL2RhdGEtdHlwZXMvZ3JhcGgtaW50ZXJmYWNlcyc7XG5pbXBvcnQge1xuICBSYW5nZUZpbHRlcixcbiAgVHJlbmRzRGF0YSxcbiAgVHJlbmRzTGlzdCxcbn0gZnJvbSAnLi9kYXRhLXR5cGVzL3RyZW5kLWludGVyZmFjZXMnO1xuaW1wb3J0IHtcbiAgQWdncmVnYXRpb25GdW5jdGlvbixcbiAgQWdncmVnYXRpb25GdW5jdGlvbnNUeXBlLFxufSBmcm9tICcuL2RhdGEtdHlwZXMvYWdncmVnYXRpb24taW50ZXJmYWNlcyc7XG5pbXBvcnQge1xuICBDdXN0b21GaWx0ZXIsXG4gIEN1c3RvbUZpbHRlclR5cGVzLFxuICBGaWx0ZXJzLFxuICBGaWx0ZXJUeXBlcyxcbn0gZnJvbSAnLi9kYXRhLXR5cGVzL2ZpbHRlci1pbnRlcmZhY2VzJztcbmltcG9ydCB7XG4gIERlcml2ZWRWYXJpYWJsZSxcbiAgRGVyaXZlZFZhcmlhYmxlRmlsdGVyLFxuICBEZXJpdmVkVmFyaWFibGVGaWx0ZXJDb25kaXRpb24sXG59IGZyb20gJy4vZGF0YS10eXBlcy9kZXJpdmVkLXZhcmlhYmxlLWludGVyZmFjZXMnO1xuaW1wb3J0IHtcbiAgRGF0YUZvcm1hdCxcbiAgRGF0YVR5cGUsXG4gIERhdGVGb3JtYXQsXG4gIFRpbWVGb3JtYXQsXG59IGZyb20gJy4vZGF0YS10eXBlcy92YXJpYWJsZS10eXBlcyc7XG5pbXBvcnQge1xuICBGaWVsZHMsXG4gIFBpdm90RmllbGRzQXJlYSxcbiAgUGl2b3RUYWJsZURhdGEsXG59IGZyb20gJy4vZGF0YS10eXBlcy9waXZvdC1pbnRlcmZhY2VzJztcbmltcG9ydCBQaXZvdEdyaWREYXRhU291cmNlIGZyb20gJ2RldmV4dHJlbWUvdWkvcGl2b3RfZ3JpZC9kYXRhX3NvdXJjZSc7XG5pbXBvcnQgeyBEYXRhUG9wdXBDb21wb25lbnQgfSBmcm9tICcuL2NvbXBvbmVudHMvZGF0YS1wb3B1cC9kYXRhLXBvcHVwLmNvbXBvbmVudCc7XG5pbXBvcnQgeyBEYXRhU2VydmljZSB9IGZyb20gJy4vc2VydmljZXMvZGF0YS5zZXJ2aWNlJztcblxuSENfZXhwb3J0aW5nKEhpZ2hjaGFydHMpO1xub2ZmbGluZUV4cG9ydGluZyhIaWdoY2hhcnRzKTtcbmhpZ2hTdG9ja3MoSGlnaGNoYXJ0cyk7XG5hY2Nlc3NpYmlsaXR5KEhpZ2hjaGFydHMpO1xuRHJpbGxkb3duKEhpZ2hjaGFydHMpO1xuXG5leHBvcnQgZW51bSBXaWRnZXRUeXBlIHtcbiAgR1JBUEggPSAnZ3JhcGgnLFxuICBUUkVORCA9ICd0cmVuZCcsXG4gIFBJVk9UX1RBQkxFID0gJ3Bpdm90X3RhYmxlJyxcbn1cblxuQEluamVjdGFibGUoe1xuICBwcm92aWRlZEluOiAncm9vdCcsXG59KVxuZXhwb3J0IGNsYXNzIFhTaWdodHNDb3JlU2VydmljZSB7XG4gIHByaXZhdGUgbW9kYWxEYXRhOiBhbnkgPSB7fTtcbiAgcHJpdmF0ZSBoaWdoY2hhcnRzOiB0eXBlb2YgSGlnaGNoYXJ0cyA9IEhpZ2hjaGFydHM7XG4gIHByaXZhdGUgZGl2U3R5bGVzID1cbiAgICAnZGlzcGxheTogZmxleDsganVzdGlmeS1jb250ZW50OiBmbGV4LXN0YXJ0OyBhbGlnbi1pdGVtczogY2VudGVyOyBwb3NpdGlvbjogYWJzb2x1dGU7IHRvcDogNXB4OyBsZWZ0OiA1cHg7JztcbiAgcHJpdmF0ZSBpY29uU3R5bGVzID1cbiAgICAnYm9yZGVyOiAycHggc29saWQgI2VlZTsgcGFkZGluZzogNXB4OyBtaW4td2lkdGg6IDI4cHg7IHRleHQtYWxpZ246IGNlbnRlcjsgYm9yZGVyLXJhZGl1czogOHB4OyBiYWNrZ3JvdW5kOiAjY2NjOyBib3gtc2hhZG93OiAycHggMnB4IDJweCAjY2NjOyBtYXJnaW4tcmlnaHQ6IDEwcHg7JztcbiAgcHJpdmF0ZSBjcmVkaXRUaXRsZSA9ICdQb3dlcmVkIGJ5IEF4ZXN0cmFjayc7XG4gIHByaXZhdGUgY3JlZGl0VXJsID0gJ2h0dHBzOi8vd3d3LmF4ZXN0cmFjay5jb20vJztcbiAgcHJpdmF0ZSBicmVhZGNydW1iU3R5bGVzID1cbiAgJ2JvcmRlcjogMnB4IHNvbGlkICNlZWU7IGJhY2tncm91bmQ6ICNjY2M7IHBhZGRpbmc6IDVweDsgbWluLXdpZHRoOiAyOHB4OyB0ZXh0LWFsaWduOiBjZW50ZXI7IGJvcmRlci1yYWRpdXM6IDhweDsgZGlzcGxheTogZmxleDsgYm94LXNoYWRvdzogMnB4IDJweCAycHggI2NjYzsgbWFyZ2luLXJpZ2h0OiAxMHB4Oyc7XG5cbiAgcHJpdmF0ZSBjaGFydHM6IEdyYXBoTGlzdCA9IHt9O1xuICBwcml2YXRlIHRyZW5kczogVHJlbmRzTGlzdCA9IHt9O1xuXG4gIGNvbnN0cnVjdG9yKFxuICAgIHByaXZhdGUgZGlhbG9nOiBOZ2JNb2RhbCxcbiAgICBwcml2YXRlIG1vZGFsQ29uZmlnOiBOZ2JNb2RhbENvbmZpZyxcbiAgICBwcml2YXRlIGRhdGFTZXJ2aWNlOiBEYXRhU2VydmljZVxuICApIHtcbiAgICB0aGlzLm1vZGFsQ29uZmlnLm1vZGFsRGlhbG9nQ2xhc3MgPSAnZGF0YXBvcHVwLWRhaWxvZyc7XG4gICAgdGhpcy5tb2RhbENvbmZpZy53aW5kb3dDbGFzcyA9ICdkYXRhcG9wdXAtd2luZG93JztcbiAgfVxuXG4gIHB1YmxpYyBidWlsZChcbiAgICB3aWRnZXRUeXBlOiBXaWRnZXRUeXBlLFxuICAgIHdpZGdldERhdGE6IEdyYXBoRGF0YSB8IFRyZW5kc0RhdGEgfCBQaXZvdFRhYmxlRGF0YVxuICApOiBQcm9taXNlPGFueT4ge1xuICAgIHJldHVybiBuZXcgUHJvbWlzZSgocmVzb2x2ZSwgcmVqZWN0KSA9PiB7XG4gICAgICBzd2l0Y2ggKHdpZGdldFR5cGUpIHtcbiAgICAgICAgY2FzZSBXaWRnZXRUeXBlLkdSQVBIOlxuICAgICAgICAgIHJlc29sdmUoXG4gICAgICAgICAgICB0aGlzLmJ1aWxkR3JhcGgoe1xuICAgICAgICAgICAgICAuLi53aWRnZXREYXRhLFxuICAgICAgICAgICAgICBicmVhZENydW1iOiBbJ0hvbWUnXSxcbiAgICAgICAgICAgICAgY3VyckxldmVsOiAwLFxuICAgICAgICAgICAgICBwcmV2TGV2ZWxEYXRhOiBbXSxcbiAgICAgICAgICAgICAgc2VsS2V5czogW10sXG4gICAgICAgICAgICAgIG9yZGVyOiAwLFxuICAgICAgICAgICAgICBjb2xUb1Nob3c6ICcnLFxuICAgICAgICAgICAgfSBhcyBHcmFwaERhdGEpXG4gICAgICAgICAgKTtcbiAgICAgICAgICBicmVhaztcbiAgICAgICAgY2FzZSBXaWRnZXRUeXBlLlRSRU5EOlxuICAgICAgICAgIGxldCB3aWRnZXQ6IFRyZW5kc0RhdGEgPSB3aWRnZXREYXRhIGFzIFRyZW5kc0RhdGE7XG4gICAgICAgICAgcmVzb2x2ZShcbiAgICAgICAgICAgIHRoaXMuYnVpbGRUcmVuZCh7XG4gICAgICAgICAgICAgIC4uLndpZGdldCxcbiAgICAgICAgICAgICAgcmF3RGF0YTogd2lkZ2V0LmdyYXBoRGF0YSxcbiAgICAgICAgICAgICAgY3VyckxldmVsOiAxLFxuICAgICAgICAgICAgICBvcmRlcjogMCxcbiAgICAgICAgICAgICAgcHJldkxldmVsRGF0YTogW10sXG4gICAgICAgICAgICB9IGFzIFRyZW5kc0RhdGEpXG4gICAgICAgICAgKTtcbiAgICAgICAgICBicmVhaztcbiAgICAgICAgY2FzZSBXaWRnZXRUeXBlLlBJVk9UX1RBQkxFOlxuICAgICAgICAgIHJlc29sdmUodGhpcy5idWlsZFBpdm90VGFibGUod2lkZ2V0RGF0YSBhcyBQaXZvdFRhYmxlRGF0YSkpO1xuICAgICAgICAgIGJyZWFrO1xuICAgICAgfVxuICAgIH0pO1xuICB9XG5cbiAgcHJpdmF0ZSBidWlsZFBpdm90VGFibGUodGFibGVEYXRhOiBQaXZvdFRhYmxlRGF0YSkge1xuICAgIC8vQXBwbHlpbmcgQ3VzdG9tIEZpbHRlclxuICAgIGxldCBkYXRhID0gdGFibGVEYXRhLmRhdGE7XG4gICAgXG4gICAgbGV0IGZpZWxkczogRmllbGRzW10gPSBbXTtcbiAgICB0YWJsZURhdGEucm93cy5mb3JFYWNoKChyb3cpID0+IHtcbiAgICAgIGZpZWxkcy5wdXNoKHtcbiAgICAgICAgY2FwdGlvbjogcm93LFxuICAgICAgICBkYXRhRmllbGQ6IHJvdyxcbiAgICAgICAgYXJlYTogUGl2b3RGaWVsZHNBcmVhLlJPVyxcbiAgICAgIH0pO1xuICAgIH0pO1xuICAgIHRhYmxlRGF0YS5jYXRlZ29yaWVzLmZvckVhY2goKGNvbCkgPT4ge1xuICAgICAgZmllbGRzLnB1c2goe1xuICAgICAgICBjYXB0aW9uOiBjb2wsXG4gICAgICAgIGRhdGFGaWVsZDogY29sLFxuICAgICAgICBhcmVhOiBQaXZvdEZpZWxkc0FyZWEuQ09MVU1OLFxuICAgICAgfSk7XG4gICAgfSk7XG4gICAgdGFibGVEYXRhLmNvbHVtbi5mb3JFYWNoKCh2YWwsIGluZGV4KSA9PiB7XG4gICAgICBmaWVsZHMucHVzaCh7XG4gICAgICAgIGNhcHRpb246XG4gICAgICAgICAgdmFsICtcbiAgICAgICAgICAnKCcgK1xuICAgICAgICAgIHRhYmxlRGF0YS5hZ2dyZWdhdGlvbkZ1bmN0aW9uW1xuICAgICAgICAgICAgaW5kZXhcbiAgICAgICAgICBdLmFnZ3JlZ2F0aW9uRnVuY3Rpb25zLnRvTG93ZXJDYXNlKCkgK1xuICAgICAgICAgICcpJyxcbiAgICAgICAgZGF0YUZpZWxkOiB2YWwsXG4gICAgICAgIGFyZWE6IFBpdm90RmllbGRzQXJlYS5EQVRBLFxuICAgICAgICBhbGxvd0ZpbHRlcmluZzogdHJ1ZSxcbiAgICAgICAgYWxsb3dTb3J0aW5nOiB0cnVlLFxuICAgICAgICBmb3JtYXQ6IGZ1bmN0aW9uICh2YWx1ZTogYW55KSB7XG4gICAgICAgICAgaWYgKCFOdW1iZXIuaXNJbnRlZ2VyKHZhbHVlKSkge1xuICAgICAgICAgICAgcmV0dXJuIHZhbHVlLnRvRml4ZWQoMikudG9TdHJpbmcoKTtcbiAgICAgICAgICB9XG4gICAgICAgICAgcmV0dXJuIHZhbHVlLnRvU3RyaW5nKCk7XG4gICAgICAgIH0sXG4gICAgICAgIHN1bW1hcnlUeXBlOlxuICAgICAgICAgIHRhYmxlRGF0YS5hZ2dyZWdhdGlvbkZ1bmN0aW9uW1xuICAgICAgICAgICAgaW5kZXhcbiAgICAgICAgICBdLmFnZ3JlZ2F0aW9uRnVuY3Rpb25zLnRvTG93ZXJDYXNlKCksXG4gICAgICB9KTtcbiAgICB9KTtcbiAgICBsZXQgcGl2b3REYXRhOiBhbnkgPSB7XG4gICAgICBmaWVsZHM6IGZpZWxkcyxcbiAgICAgIHN0b3JlOiBkYXRhLFxuICAgIH07XG4gICAgbGV0IHJlc3BvbnNlID0gbmV3IFBpdm90R3JpZERhdGFTb3VyY2UocGl2b3REYXRhKTtcbiAgICByZXR1cm4gcmVzcG9uc2U7XG4gIH1cblxuICAvL0dyYXBoIEZ1bmN0aW9uXG4gIHByaXZhdGUgYXN5bmMgYnVpbGRHcmFwaChncmFwaERhdGE6IEdyYXBoRGF0YSk6IFByb21pc2U8Ym9vbGVhbj4ge1xuICAgIC8vQXBwbHlpbmcgQ3VzdG9tIEZpbHRlclxuICAgIC8vU2V0IEdyYXBoT2JqZWN0IHdpdGggR3JhcGhJZFxuICAgIHRoaXMuY2hhcnRzW2dyYXBoRGF0YS5ncmFwaElkXSA9IGdyYXBoRGF0YTtcbiAgICB0aGlzLmNoYXJ0c1tncmFwaERhdGEuZ3JhcGhJZF0uZ3JhcGhEYXRhID0gdGhpcy5jaGFydHNbZ3JhcGhEYXRhLmdyYXBoSWRdLmdyYXBoRGF0YS5maWx0ZXIoKGQ6IGFueSkgPT4gdGhpcy5hcHBseUN1c3RvbUZpbHRlcihkLCB0aGlzLmNoYXJ0c1tncmFwaERhdGEuZ3JhcGhJZF0uZmlsdGVyKSlcbiAgICBpZiAodGhpcy5jaGFydHNbZ3JhcGhEYXRhLmdyYXBoSWRdLnJvd3NbdGhpcy5jaGFydHNbZ3JhcGhEYXRhLmdyYXBoSWRdLmN1cnJMZXZlbF0gPT0gJyoqKkxBQkVMKioqJykge1xuICAgICAgLy9DcmVhdGUgTGFiZWwgQmxvY2tcbiAgICAgIGxldCByZXNwb25zZSA9IGF3YWl0IHRoaXMucHVibGlzaExhYmVsKGdyYXBoRGF0YS5ncmFwaElkKTtcbiAgICAgIC8vRGlzcGF0Y2ggYWZ0ZXIgYnVpbGQgZXZlbnRcbiAgICAgIHJldHVybiByZXNwb25zZTtcbiAgICB9IGVsc2Uge1xuICAgICAgLy9DcmVhdGUgR3JhcGhcbiAgICAgIGxldCByZXNwb25zZSA9IGF3YWl0IHRoaXMuc3RhcnRHcmFwaEJ1aWxkZXIoZ3JhcGhEYXRhLmdyYXBoSWQsIHRoaXMuY2hhcnRzW2dyYXBoRGF0YS5ncmFwaElkXS5jdXJyTGV2ZWwsICcnKTtcbiAgICAgIC8vRGlzcGF0Y2ggYWZ0ZXIgYnVpbGQgZXZlbnRcbiAgICAgIHJldHVybiByZXNwb25zZTtcbiAgICB9XG4gIH1cblxuICBwcml2YXRlIGFzeW5jIHB1Ymxpc2hMYWJlbChncmFwaElkOiBzdHJpbmcpIHtcbiAgICAvL0ZsdXNoIENvbnRlbnQgb2YgR3JhcGggRGl2XG4gICAgZG9jdW1lbnQucXVlcnlTZWxlY3RvcignIycgKyBncmFwaElkKSEuaW5uZXJIVE1MID0gJyc7XG5cbiAgICAvL0FkZCBDdXN0b20gVmFyaWFibGUgaW4gUmF3IERhdGFcbiAgICBsZXQgZGF0YSA9IGF3YWl0IHRoaXMuYWRkQ3VzdG9tVmFyaWFibGUoXG4gICAgICB0aGlzLmNoYXJ0c1tncmFwaElkXS5jdXN0b21WYXJpYWJsZSxcbiAgICAgIHRoaXMuY2hhcnRzW2dyYXBoSWRdLmdyYXBoRGF0YSxcbiAgICAgIGZhbHNlLFxuICAgICAgdGhpcy5jaGFydHNbZ3JhcGhJZF0uZGF0YUZvcm1hdCxcbiAgICAgIGZhbHNlXG4gICAgKTtcblxuICAgIGxldCBjb2xEYXRhID0gdGhpcy5hcHBseURhdGFGaWx0ZXIoZGF0YSwgdGhpcy5jaGFydHNbZ3JhcGhJZF0uZmlsdGVyLCB0aGlzLmNoYXJ0c1tncmFwaElkXS5jb2x1bW5zLGdyYXBoSWQpO1xuXG4gICAgLy9MYWJlbHMgRGF0YSBjcmVhdGlvblxuICAgIGxldCBodG1sRGl2ID0gdGhpcy5jaGFydHNbZ3JhcGhJZF0uY29sdW1ucy5tYXAoKHksIHlJbmRleCkgPT4ge1xuICAgICAgbGV0IGFsbERhdGEgPSBjb2xEYXRhW3ldLm1hcCgoZDogYW55KSA9PiBkW3ldKTtcblxuICAgICAgYWxsRGF0YSA9IGxvZGFzaC53aXRob3V0KGFsbERhdGEsICcnKTtcbiAgICAgIGFsbERhdGEgPSBsb2Rhc2gud2l0aG91dChhbGxEYXRhLCB1bmRlZmluZWQpO1xuICAgICAgcmV0dXJuIHtcbiAgICAgICAgbGFiZWw6IHksXG4gICAgICAgIHZhbHVlOlxuICAgICAgICAgIHRoaXMuY2hhcnRzW2dyYXBoSWRdLmFnZ3JlZ2F0aW9uRnVuY3Rpb25zW3lJbmRleF1cbiAgICAgICAgICAgIC5hZ2dyZWdhdGlvbkZ1bmN0aW9ucyA9PSAnTk8gRlVOQ1RJT04nXG4gICAgICAgICAgICA/IGxvZGFzaC5tYXgoYWxsRGF0YSkgLy9HZXR0aW5nIE1heCBWYWx1ZSBvbiBOTyBGdW5jdGlvblxuICAgICAgICAgICAgOiB0aGlzLmFwcGx5QWdncmVnYXRpb24oXG4gICAgICAgICAgICAgICAgYWxsRGF0YSxcbiAgICAgICAgICAgICAgICB5SW5kZXgsXG4gICAgICAgICAgICAgICAgdGhpcy5jaGFydHNbZ3JhcGhJZF0uYWdncmVnYXRpb25GdW5jdGlvbnNcbiAgICAgICAgICAgICAgKSwgLy9BcHBseWluZyBBZ2dyZWdhdGlvblxuICAgICAgfTtcbiAgICB9KTtcblxuICAgIC8vQ3JlYXRpbmcgTGFiZWwgSHRtbCBEVU1QXG4gICAgbGV0IGh0bWwgPSBgXG4gICAgPGRpdiBjbGFzcz1cImNhcmRcIiBzdHlsZT1cInBhZGRpbmctdG9wOiAzJTsgcGFkZGluZy1ib3R0b206IDMlOyB3aWR0aDogaW5oZXJpdDtcIj5cbiAgICAke1xuICAgICAgaHRtbERpdi5sZW5ndGggPT0gMVxuICAgICAgICA/IGA8aDMgc3R5bGU9XCJ0ZXh0LWFsaWduOiBjZW50ZXI7XCI+JHt0aGlzLmNoYXJ0c1tncmFwaElkXS5ncmFwaFRpdGxlfTwvaDM+YFxuICAgICAgICA6IGBgXG4gICAgfVxuICAgIDxkaXYgY2xhc3M9XCJncmFwaC1sYWJlbFwiID5cbiAgICAke2h0bWxEaXZcbiAgICAgIC5tYXAoXG4gICAgICAgIChkOiBhbnksIGluZGV4KSA9PiBgXG4gICAgICAgIDxkaXYgY2xhc3M9XCJsYWJlbC1pdGVtXCIgJHtcbiAgICAgICAgICB0aGlzLmNoYXJ0c1tncmFwaElkXS5jb2xvcnNbaW5kZXhdICE9IHVuZGVmaW5lZFxuICAgICAgICAgICAgPyBgc3R5bGU9XCJiYWNrZ3JvdW5kLWNvbG9yOiAke3RoaXMuY2hhcnRzW2dyYXBoSWRdLmNvbG9yc1tpbmRleF19XCJgXG4gICAgICAgICAgICA6ICcnXG4gICAgICAgIH0gaWQ9XCJjYXJkLWdyYXBoLSR7Z3JhcGhJZH1cIiBkYXRhPVwiJHtcbiAgICAgICAgICB0aGlzLmNoYXJ0c1tncmFwaElkXS5jb2x1bW5zW2luZGV4XVxuICAgICAgICB9XCI+XG4gICAgICAgICAgPGgzIHN0eWxlPVwiJHtkYXRhLmxlbmd0aCA9PSAxID8gJ2ZvbnQtc2l6ZTogMThweDsnIDogJyd9XCIgZGF0YT1cIiR7XG4gICAgICAgICAgdGhpcy5jaGFydHNbZ3JhcGhJZF0uY29sdW1uc1tpbmRleF1cbiAgICAgICAgfVwiPjxiIGRhdGE9XCIke3RoaXMuY2hhcnRzW2dyYXBoSWRdLmNvbHVtbnNbaW5kZXhdfVwiPiR7TWF0aC5yb3VuZChcbiAgICAgICAgICBkLnZhbHVlXG4gICAgICAgICl9PC9iPjwvaDM+XG4gICAgICAgICAgJHtcbiAgICAgICAgICAgIGRhdGEubGVuZ3RoID4gMVxuICAgICAgICAgICAgICA/IGA8aDMgZGF0YT1cIiR7dGhpcy5jaGFydHNbZ3JhcGhJZF0uY29sdW1uc1tpbmRleF19XCI+YCArXG4gICAgICAgICAgICAgICAgZC5sYWJlbCArXG4gICAgICAgICAgICAgICAgJzwvaDM+J1xuICAgICAgICAgICAgICA6ICcnXG4gICAgICAgICAgfVxuICAgICAgICA8L2Rpdj5cblxuICAgICAgICBgXG4gICAgICApXG4gICAgICAuam9pbignJyl9XG4gICAgICAgIDwvZGl2PlxuICAgIDwvZGl2PmA7XG5cbiAgICAvL1JlbmRlcmluZyBMYWJlbCBIVE1MIERVTVAgb3ZlciBkb2N1bWVudFxuICAgIGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3IoJyMnICsgZ3JhcGhJZCkhLmlubmVySFRNTCA9IGh0bWw7XG5cbiAgICBsZXQgX3NlbGYgPSB0aGlzO1xuXG4gICAgLy9MYWJlbCBDbGljayBoYW5kbGVyXG4gICAgZG9jdW1lbnQucXVlcnlTZWxlY3RvckFsbCgnI2NhcmQtZ3JhcGgtJyArIGdyYXBoSWQpLmZvckVhY2goKGNhcmQpID0+XG4gICAgICBjYXJkLmFkZEV2ZW50TGlzdGVuZXIoJ2NsaWNrJywgZnVuY3Rpb24gKGU6IGFueSkge1xuICAgICAgICBpZiAoX3NlbGYuY2hhcnRzW2dyYXBoSWRdLnJvd3MubGVuZ3RoID09IDEpIHtcbiAgICAgICAgICAvL1JlbmRlcmluZyBMYXN0IGxldmVsIENvbXBvbmVudFxuICAgICAgICAgIF9zZWxmLm1vZGFsRGF0YSA9IHtcbiAgICAgICAgICAgIGNvbFRvVmlldzogX3NlbGYuY2hhcnRzW2dyYXBoSWRdLmxhc3RMZXZlbENvbHVtbnMsXG4gICAgICAgICAgICByZWZEYXRhOiBfc2VsZi5jaGFydHNbZ3JhcGhJZF0uZ3JhcGhEYXRhLFxuICAgICAgICAgIH07XG4gICAgICAgICAgbGV0IG1vZGFsT3B0aW9uczogYW55ID0ge1xuICAgICAgICAgICAgcGFuZWxDbGFzczogJ2RhdGFQb3B1cC1tb2RhbCcsXG4gICAgICAgICAgICBiYWNrZHJvcENsYXNzOiAnbW9kYWwtYmFja2Ryb3AnLFxuICAgICAgICAgIH07XG4gICAgICAgICAgX3NlbGYuZGlhbG9nLm9wZW4oRGF0YVBvcHVwQ29tcG9uZW50LCBtb2RhbE9wdGlvbnMpO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgIF9zZWxmLmNoYXJ0c1tncmFwaElkXS5jdXJyTGV2ZWwgKz0gMTtcbiAgICAgICAgICBfc2VsZi5jaGFydHNbZ3JhcGhJZF0ucHJldkxldmVsRGF0YS5wdXNoKF9zZWxmLmNoYXJ0c1tncmFwaElkXS5ncmFwaERhdGEpO1xuICAgICAgICAgIF9zZWxmLmNoYXJ0c1tncmFwaElkXS5icmVhZENydW1iLnB1c2goZS50YXJnZXQuZ2V0QXR0cmlidXRlKCdkYXRhJykpO1xuXG4gICAgICAgICAgLy9GbHVzaCBMYWJlbCBDb250ZW50IGZyb20gZG9jdW1lbnRcbiAgICAgICAgICBkb2N1bWVudC5xdWVyeVNlbGVjdG9yKCcjJyArIGdyYXBoSWQpIS5pbm5lckhUTUwgPSAnJztcblxuICAgICAgICAgIC8vR2VuZXJhdGluZyBDaGlsZCBHcmFwaCBvZiBMYWJlbFxuICAgICAgICAgIF9zZWxmLnN0YXJ0R3JhcGhCdWlsZGVyKGdyYXBoSWQsIDEsIGUudGFyZ2V0LmdldEF0dHJpYnV0ZSgnZGF0YScpKTtcbiAgICAgICAgfVxuICAgICAgfSlcbiAgICApO1xuICAgIHJldHVybiB0cnVlO1xuICB9XG5cblxuICBwcml2YXRlIGFwcGx5RGF0YUZpbHRlcihkYXRhOiBhbnksIGZpbHRlcjogRmlsdGVycywgY29sdW1uczogYW55ICwgZ3JhcGhJZDogYW55KXtcbiAgICBjb25zdCB5RmlsdGVyID0gZmlsdGVyLnlQcmVBeGlzO1xuICAgIGxldCBjb2xEYXRhIDogYW55ID0ge307XG4gICAgbG9kYXNoLmZvckVhY2goZGF0YSwgKGQpID0+IHtcbiAgICAgIGNvbHVtbnMuZm9yRWFjaCgoY29sOiBzdHJpbmcpID0+IHtcbiAgICAgICAgY29uc3QgZmlsdGVyVG9BcHBseSA9IHlGaWx0ZXIuZmlsdGVyKHkgPT4geS52YXJpYWJsZU5hbWUgPT0gY29sKTtcbiAgICAgICAgbGV0IGlzVmFsaWQgPSB5RmlsdGVyLmxlbmd0aCA9PSAwO1xuICAgICAgICBpZih5RmlsdGVyLmxlbmd0aCA+IDApe1xuICAgICAgICAgIGxldCB2YWx1ZXMgPSBmaWx0ZXJUb0FwcGx5WzBdLnZhbHVlcztcbiAgICAgICAgICBsZXQgZGF0YVZhbHVlID0gZFtmaWx0ZXJUb0FwcGx5WzBdLnZhcmlhYmxlTmFtZV07XG4gICAgICAgICAgbGV0IHZhcmlhYmxlVHlwZSA9IGZpbHRlclRvQXBwbHlbMF0udmFyaWFibGVUeXBlO1xuICAgICAgICAgIHN3aXRjaChmaWx0ZXJUb0FwcGx5WzBdLmZpbHRlclR5cGUpe1xuICAgICAgICAgICAgICBjYXNlIEZpbHRlclR5cGVzLkdSRUFURVJfVEhBTjpcbiAgICAgICAgICAgICAgICBpZiAoZGF0YVZhbHVlID4gdmFsdWVzWzBdKSB7XG4gICAgICAgICAgICAgICAgICBpc1ZhbGlkID0gdHJ1ZTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICAgIGNhc2UgRmlsdGVyVHlwZXMuTEVTU19USEFOOlxuICAgICAgICAgICAgICAgIGlmIChkYXRhVmFsdWUgPCB2YWx1ZXNbMF0pIHtcbiAgICAgICAgICAgICAgICAgIGlzVmFsaWQgPSB0cnVlO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgICAgY2FzZSBGaWx0ZXJUeXBlcy5MRVNTX1RIQU5fRVFVQUw6XG4gICAgICAgICAgICAgICAgaWYgKGRhdGFWYWx1ZSA8PSB2YWx1ZXNbMF0pIHtcbiAgICAgICAgICAgICAgICAgIGlzVmFsaWQgPSB0cnVlO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgICAgY2FzZSBGaWx0ZXJUeXBlcy5HUkVBVEVSX1RIQU5fRVFVQUw6XG4gICAgICAgICAgICAgICAgaWYgKGRhdGFWYWx1ZSA+PSB2YWx1ZXNbMF0pIHtcbiAgICAgICAgICAgICAgICAgIGlzVmFsaWQgPSB0cnVlO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgICAgY2FzZSBGaWx0ZXJUeXBlcy5FUVVBTDpcbiAgICAgICAgICAgICAgICBpZiAoZGF0YVZhbHVlID09IHZhbHVlc1swXSkge1xuICAgICAgICAgICAgICAgICAgaXNWYWxpZCA9IHRydWU7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgICBjYXNlIEZpbHRlclR5cGVzLk5PVF9FUVVBTDpcbiAgICAgICAgICAgICAgICBpZiAoZGF0YVZhbHVlICE9IHZhbHVlc1swXSkge1xuICAgICAgICAgICAgICAgICAgaXNWYWxpZCA9IHRydWU7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgICBjYXNlIEZpbHRlclR5cGVzLkJFVFdFRU5fUkFOR0U6XG4gICAgICAgICAgICAgICAgaWYgKGRhdGFWYWx1ZSA+PSB2YWx1ZXNbMF0gJiYgZGF0YVZhbHVlIDwgdmFsdWVzWzFdKSB7XG4gICAgICAgICAgICAgICAgICBpc1ZhbGlkID0gdHJ1ZTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICAgIGNhc2UgRmlsdGVyVHlwZXMuQkVGT1JFOlxuICAgICAgICAgICAgICAgIGlmICh2YXJpYWJsZVR5cGUgPT0gRGF0YVR5cGUuREFURSkge1xuICAgICAgICAgICAgICAgICAgbGV0IG9wZXJhbmQxID0gdGhpcy5nZXRGb3JtYXR0ZWREYXRlKFxuICAgICAgICAgICAgICAgICAgICBkYXRhVmFsdWUsXG4gICAgICAgICAgICAgICAgICAgIGZpbHRlclRvQXBwbHlbMF0uZm9ybWF0XG4gICAgICAgICAgICAgICAgICApO1xuICAgICAgICAgICAgICAgICAgbGV0IG9wZXJhbmQyID0gbmV3IERhdGUodmFsdWVzWzBdKTtcbiAgICAgICAgICAgICAgICAgIGlmIChvcGVyYW5kMSA8IG9wZXJhbmQyKSB7XG4gICAgICAgICAgICAgICAgICAgIGlzVmFsaWQgPSB0cnVlO1xuICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgICBsZXQgY3VyclNlY29uZHMgPSB0aGlzLmdldEZvcm1hdHRlZERhdGUoXG4gICAgICAgICAgICAgICAgICAgIGRhdGFWYWx1ZSxcbiAgICAgICAgICAgICAgICAgICAgZmlsdGVyVG9BcHBseVswXS5mb3JtYXRcbiAgICAgICAgICAgICAgICAgICk7XG4gICAgICAgICAgICAgICAgICBsZXQgW2hvdXIsIG1pbl0gPSB2YWx1ZXNbMF1cbiAgICAgICAgICAgICAgICAgICAgLnNwbGl0KCc6JylcbiAgICAgICAgICAgICAgICAgICAgLm1hcCgoZWw6IGFueSkgPT4gcGFyc2VJbnQoZWwpKTtcbiAgICAgICAgICAgICAgICAgIGxldCBjb21wYXJlZFNlYyA9IGhvdXIgKiA2MCAqIDYwICsgbWluICogNjA7XG4gICAgICAgICAgICAgICAgICBpZiAoY3VyclNlY29uZHMgPCBjb21wYXJlZFNlYykge1xuICAgICAgICAgICAgICAgICAgICBpc1ZhbGlkID0gdHJ1ZTtcbiAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICAgIGNhc2UgRmlsdGVyVHlwZXMuQUZURVI6XG4gICAgICAgICAgICAgICAgaWYgKHZhcmlhYmxlVHlwZSA9PSBEYXRhVHlwZS5EQVRFKSB7XG4gICAgICAgICAgICAgICAgICBsZXQgb3BlcmFuZDEgPSB0aGlzLmdldEZvcm1hdHRlZERhdGUoXG4gICAgICAgICAgICAgICAgICAgIGRhdGFWYWx1ZSxcbiAgICAgICAgICAgICAgICAgICAgZmlsdGVyVG9BcHBseVswXS5mb3JtYXRcbiAgICAgICAgICAgICAgICAgICk7XG4gICAgICAgICAgICAgICAgICBsZXQgb3BlcmFuZDIgPSBuZXcgRGF0ZSh2YWx1ZXNbMF0pO1xuICAgICAgICAgICAgICAgICAgaWYgKG9wZXJhbmQxID4gb3BlcmFuZDIpIHtcbiAgICAgICAgICAgICAgICAgICAgaXNWYWxpZCA9IHRydWU7XG4gICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICAgIGxldCBjdXJyU2Vjb25kcyA9IHRoaXMuZ2V0Rm9ybWF0dGVkRGF0ZShcbiAgICAgICAgICAgICAgICAgICAgZGF0YVZhbHVlLFxuICAgICAgICAgICAgICAgICAgICBmaWx0ZXJUb0FwcGx5WzBdLmZvcm1hdFxuICAgICAgICAgICAgICAgICAgKTtcbiAgICAgICAgICAgICAgICAgIGxldCBbaG91ciwgbWluXSA9IHZhbHVlc1swXVxuICAgICAgICAgICAgICAgICAgICAuc3BsaXQoJzonKVxuICAgICAgICAgICAgICAgICAgICAubWFwKChlbDogYW55KSA9PiBwYXJzZUludChlbCkpO1xuICAgICAgICAgICAgICAgICAgbGV0IGNvbXBhcmVkU2VjID0gaG91ciAqIDYwICogNjAgKyBtaW4gKiA2MDtcbiAgICAgICAgICAgICAgICAgIGlmIChjdXJyU2Vjb25kcyA+IGNvbXBhcmVkU2VjKSB7XG4gICAgICAgICAgICAgICAgICAgIGlzVmFsaWQgPSB0cnVlO1xuICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgICAgY2FzZSBGaWx0ZXJUeXBlcy5CRVRXRUVOOlxuICAgICAgICAgICAgICAgIGlmICh2YXJpYWJsZVR5cGUgPT0gRGF0YVR5cGUuREFURSkge1xuICAgICAgICAgICAgICAgICAgbGV0IG9wZXJhbmQxID0gdGhpcy5nZXRGb3JtYXR0ZWREYXRlKFxuICAgICAgICAgICAgICAgICAgICBkYXRhVmFsdWUsXG4gICAgICAgICAgICAgICAgICAgIGZpbHRlclRvQXBwbHlbMF0uZm9ybWF0XG4gICAgICAgICAgICAgICAgICApO1xuICAgICAgICAgICAgICAgICAgbGV0IG9wZXJhbmQyID0gbmV3IERhdGUodmFsdWVzWzBdKTtcbiAgICAgICAgICAgICAgICAgIGxldCBvcGVyYW5kMyA9IG5ldyBEYXRlKHZhbHVlc1sxXSk7XG4gICAgICAgICAgICAgICAgICBpZiAob3BlcmFuZDEgPj0gb3BlcmFuZDIgJiYgb3BlcmFuZDEgPCBvcGVyYW5kMykge1xuICAgICAgICAgICAgICAgICAgICBpc1ZhbGlkID0gdHJ1ZTtcbiAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgICAgbGV0IGN1cnJTZWNvbmRzID0gdGhpcy5nZXRGb3JtYXR0ZWREYXRlKFxuICAgICAgICAgICAgICAgICAgICBkYXRhVmFsdWUsXG4gICAgICAgICAgICAgICAgICAgIGZpbHRlclRvQXBwbHlbMF0uZm9ybWF0XG4gICAgICAgICAgICAgICAgICApO1xuICAgICAgICAgICAgICAgICAgbGV0IFtob3VyLCBtaW5dID0gdmFsdWVzWzBdXG4gICAgICAgICAgICAgICAgICAgIC5zcGxpdCgnOicpXG4gICAgICAgICAgICAgICAgICAgIC5tYXAoKGVsOiBhbnkpID0+IHBhcnNlSW50KGVsKSk7XG4gICAgICAgICAgICAgICAgICBsZXQgW2VuZGhvdXIsIGVuZG1pbl0gPSB2YWx1ZXNbMV1cbiAgICAgICAgICAgICAgICAgIC5zcGxpdCgnOicpXG4gICAgICAgICAgICAgICAgICAubWFwKChlbDogYW55KSA9PiBwYXJzZUludChlbCkpO1xuICAgICAgICAgICAgICAgICAgbGV0IGNvbXBhcmVkU2VjID0gaG91ciAqIDYwICogNjAgKyBtaW4gKiA2MDtcbiAgICAgICAgICAgICAgICAgIGxldCBlbmRDb21wYXJlZFNlYyA9IGVuZGhvdXIgKiA2MCAqIDYwICsgZW5kbWluICogNjA7XG4gICAgICAgICAgICAgICAgICBpZiAoIGN1cnJTZWNvbmRzID49IGNvbXBhcmVkU2VjICYmXG4gICAgICAgICAgICAgICAgICAgIGN1cnJTZWNvbmRzIDwgZW5kQ29tcGFyZWRTZWMpIHtcbiAgICAgICAgICAgICAgICAgICAgaXNWYWxpZCA9IHRydWU7XG4gICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgICBjYXNlIEZpbHRlclR5cGVzLklOOlxuICAgICAgICAgICAgICAgIGlmIChcbiAgICAgICAgICAgICAgICAgIHZhbHVlcy5pbmRleE9mKGRhdGFWYWx1ZS50b1N0cmluZygpXG4gICAgICAgICAgICAgICAgICApICE9IC0xXG4gICAgICAgICAgICAgICAgKSB7XG4gICAgICAgICAgICAgICAgICBpc1ZhbGlkID0gdHJ1ZTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICAgIGNhc2UgRmlsdGVyVHlwZXMuTk9UX0lOOlxuICAgICAgICAgICAgICAgIGlmIChcbiAgICAgICAgICAgICAgICAgIFxuICAgICAgICAgICAgICAgICAgdmFsdWVzLmluZGV4T2YoZGF0YVZhbHVlLnRvU3RyaW5nKCkpID09IC0xXG4gICAgICAgICAgICAgICAgKSB7XG4gICAgICAgICAgICAgICAgICBpc1ZhbGlkID0gdHJ1ZTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICAgIC8vIGlmKGlzVmFsaWQgJiYgZmlsdGVyLmN1c3RvbUZpbHRlci5sZW5ndGggPiAwKXtcbiAgICAgICAgLy8gICBpc1ZhbGlkID0gdGhpcy5hcHBseUN1c3RvbUZpbHRlcihkLCBmaWx0ZXIpO1xuICAgICAgICAvLyB9XG4gICAgICAgIGlmKGlzVmFsaWQpe1xuICAgICAgICAgIGlmKGNvbERhdGEuaGFzT3duUHJvcGVydHkoY29sKSl7XG4gICAgICAgICAgICBjb2xEYXRhW2NvbF0ucHVzaChkKTtcbiAgICAgICAgICB9ZWxzZXtcbiAgICAgICAgICAgIGNvbERhdGFbY29sXSA9IFtkXTtcbiAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgIH0pXG4gICAgfSlcbiAgICByZXR1cm4gY29sRGF0YTtcbiAgfVxuXG4gIHByaXZhdGUgYXN5bmMgc3RhcnRHcmFwaEJ1aWxkZXIoXG4gICAgZ3JhcGhJZDogc3RyaW5nLFxuICAgIGN1cnJMZXZlbDogbnVtYmVyLFxuICAgIGNvbFRvU2hvdzogc3RyaW5nXG4gICkge1xuICAgIC8vQWRkIEN1c3RvbSBTbGFicyBpbiBSYXcgRGF0YVxuICAgIGxldCBkYXRhID0gYXdhaXQgdGhpcy5hZGRDdXN0b21WYXJpYWJsZShcbiAgICAgIHRoaXMuY2hhcnRzW2dyYXBoSWRdLmN1c3RvbVZhcmlhYmxlLFxuICAgICAgdGhpcy5jaGFydHNbZ3JhcGhJZF0uZ3JhcGhEYXRhLFxuICAgICAgdHJ1ZSxcbiAgICAgIHRoaXMuY2hhcnRzW2dyYXBoSWRdLmRhdGFGb3JtYXQsXG4gICAgICB0cnVlXG4gICAgKTtcblxuICAgIHRoaXMuY2hhcnRzW2dyYXBoSWRdLmdyYXBoRGF0YSA9IGxvZGFzaC5ncm91cEJ5KFxuICAgICAgZGF0YSxcbiAgICAgIHRoaXMuY2hhcnRzW2dyYXBoSWRdLnJvd3NbY3VyckxldmVsXVxuICAgICk7XG4gICAgdGhpcy5jaGFydHNbZ3JhcGhJZF0uY3VyckxldmVsID0gY3VyckxldmVsO1xuICAgIC8vIHRoaXMuY2hhcnRzW2dyYXBoSWRdLnByZXZMZXZlbERhdGEgPSBjdXJyTGV2ZWwgPT0gMCA/IFtdIDogW2RhdGFdO1xuICAgIHRoaXMuY2hhcnRzW2dyYXBoSWRdLmNvbFRvU2hvdyA9IGNvbFRvU2hvdztcblxuICAgIC8vQ3JlYXRpbmcgQ2hhcnQgUmF3IEpzb25cbiAgICBsZXQgY2hhcnRPcHRpb25zOiBhbnkgPSB0aGlzLmNyZWF0ZUNoYXJ0RGF0YShncmFwaElkLCBjdXJyTGV2ZWwpO1xuXG4gICAgLy9SZW5kZXJpbmcgQ2hhcnQgb2YgR3JhcGhJZFxuICAgIHRoaXMuaGlnaGNoYXJ0cy5jaGFydCh0aGlzLmNoYXJ0c1tncmFwaElkXS5ncmFwaElkLCBjaGFydE9wdGlvbnMpO1xuXG4gICAgLy9BZGQgQWN0aW9uIEJ1dHRvbnMgT3ZlciBDaGFydFxuICAgIHRoaXMuYWRkQWN0aW9uQnRuKGdyYXBoSWQpO1xuXG4gICAgcmV0dXJuIHRydWU7XG4gIH1cblxuICBwcml2YXRlIGdldFBsb3RPcHRpb25zKGdyYXBoSWQ6IHN0cmluZywgY3VyckxldmVsOiBudW1iZXIpIHtcbiAgICBsZXQgcGxvdE9wdGlvbnM6IGFueSA9IHtcbiAgICAgIHNlcmllczoge1xuICAgICAgICB0dXJib1RocmVzaG9sZDogMTAwMDAwMCxcbiAgICAgICAgZGF0YUxhYmVsczoge1xuICAgICAgICAgIGNvbG9yOiAnYmxhY2snLFxuICAgICAgICAgIGVuYWJsZWQ6IHRydWUsXG4gICAgICAgICAgc3R5bGU6IHtcbiAgICAgICAgICAgIGNvbG9yOiAnYmxhY2snLFxuICAgICAgICAgICAgdGV4dFNoYWRvdzogZmFsc2UsXG4gICAgICAgICAgICB0ZXh0RGVjb3JhdGlvbjogJ25vbmUnLFxuICAgICAgICAgIH0sXG4gICAgICAgIH0sXG4gICAgICAgIGxhYmVsOiB7XG4gICAgICAgICAgc3R5bGU6IHtcbiAgICAgICAgICAgIGNvbG9yOiAnYmxhY2snLFxuICAgICAgICAgIH0sXG4gICAgICAgIH0sXG4gICAgICB9LFxuICAgIH07XG5cbiAgICAvL09wdGlvbnMgZm9yIFN0YWNrIEdyYXBoXG4gICAgaWYgKFxuICAgICAgdGhpcy5jaGFydHNbZ3JhcGhJZF0uZ3JhcGhUeXBlc1tjdXJyTGV2ZWxdID09IEdyYXBoVHlwZXMuU1RBQ0tFRF9CQVIgfHxcbiAgICAgIHRoaXMuY2hhcnRzW2dyYXBoSWRdLmdyYXBoVHlwZXNbY3VyckxldmVsXSA9PSBHcmFwaFR5cGVzLlNUQUNLRURfQ09MVU1OXG4gICAgKSB7XG4gICAgICBwbG90T3B0aW9ucy5zZXJpZXNbJ3N0YWNraW5nJ10gPSAnbm9ybWFsJzsgLy9Ob3JtYWwgU3RhY2tpbmcgb2YgeS1heGlzXG4gICAgfSBlbHNlIGlmIChcbiAgICAgIHRoaXMuY2hhcnRzW2dyYXBoSWRdLmdyYXBoVHlwZXNbY3VyckxldmVsXSA9PVxuICAgICAgICBHcmFwaFR5cGVzLlNUQUNLRURfQkFSX1BFUkNFTlRBR0UgfHxcbiAgICAgIHRoaXMuY2hhcnRzW2dyYXBoSWRdLmdyYXBoVHlwZXNbY3VyckxldmVsXSA9PVxuICAgICAgICBHcmFwaFR5cGVzLlNUQUNLRURfQ09MVU1OX1BFUkNFTlRBR0VcbiAgICApIHtcbiAgICAgIHBsb3RPcHRpb25zLnNlcmllc1snc3RhY2tpbmcnXSA9ICdwZXJjZW50JzsgLy9TdGFja2luZyBvZiB5LWF4aXMgb24gYmFzaXMgb2YgcGVyY2VudGFnZVxuICAgICAgLy9BZGQgUGVyY2VudCBTaWduIGFmdGVyIHktYXhpcyB2YWx1ZXNcbiAgICAgIHBsb3RPcHRpb25zLnNlcmllcy5kYXRhTGFiZWxzWydmb3JtYXR0ZXInXSA9IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgcmV0dXJuIHRoaXMucGVyY2VudGFnZS50b0ZpeGVkKDIpICsgJyAlJztcbiAgICAgIH07XG4gICAgfVxuICAgIHJldHVybiBwbG90T3B0aW9ucztcbiAgfVxuXG4gIHByaXZhdGUgY3JlYXRlQ2hhcnREYXRhKGdyYXBoSWQ6IHN0cmluZywgY3VyckxldmVsOiBudW1iZXIpIHtcbiAgICBsZXQgX3NlbGYgPSB0aGlzO1xuXG4gICAgLy9HZXR0aW5nIFBsb3QgT3B0aW9ucyBmb3IgR3JhcGhcbiAgICBsZXQgcGxvdE9wdGlvbnMgPSB0aGlzLmdldFBsb3RPcHRpb25zKGdyYXBoSWQsIGN1cnJMZXZlbCk7XG5cbiAgICByZXR1cm4ge1xuICAgICAgY3JlZGl0czoge1xuICAgICAgICB0ZXh0OiB0aGlzLmNyZWRpdFRpdGxlLFxuICAgICAgICBocmVmOiB0aGlzLmNyZWRpdFVybCxcbiAgICAgICAgc3R5bGU6IHtcbiAgICAgICAgICBmb250U2l6ZTogJzEycHgnLFxuICAgICAgICB9LFxuICAgICAgfSxcbiAgICAgIHRpdGxlOiBudWxsLFxuICAgICAgcGxvdE9wdGlvbnM6IHBsb3RPcHRpb25zLFxuICAgICAgY2hhcnQ6IHtcbiAgICAgICAgZXZlbnRzOiB7XG4gICAgICAgICAgLy9IYW5kbGUgRHJpbGxkb3duIEV2ZW50IG9mIEdyYXBoXG4gICAgICAgICAgZHJpbGxkb3duOiBmdW5jdGlvbiAoZTogYW55KSB7XG4gICAgICAgICAgICBpZihlLnBvaW50cyAhPSBmYWxzZSkgcmV0dXJuXG4gICAgICAgICAgICBsZXQgY3VyckdyYXBoSWQgPSBlLnBvaW50Lm9wdGlvbnMuZ3JhcGhJZDsgLy9HcmFwaElkXG4gICAgICAgICAgICBsZXQgY29sSWQgPSBlLnBvaW50LmNvbEluZGV4OyAvL0NvbG9ySW5kZXggb2YgYmFyXG4gICAgICAgICAgICAvL0luY3JlYXNpbmcgR3JhcGggRHJpbGxkb3duIGxldmVsXG4gICAgICAgICAgICBfc2VsZi5jaGFydHNbY3VyckdyYXBoSWRdLmN1cnJMZXZlbCArPSAxO1xuICAgICAgICAgICAgX3NlbGYuY2hhcnRzW2N1cnJHcmFwaElkXS5icmVhZENydW1iLnB1c2goZS5wb2ludC5uYW1lKTtcbiAgICAgICAgICAgIF9zZWxmLmNoYXJ0c1tjdXJyR3JhcGhJZF0uc2VsS2V5cz8ucHVzaChlLnBvaW50Lm5hbWUpO1xuXG4gICAgICAgICAgICAvL09wZW4gTGFzdCBMZXZlbCBDb21wb25lbnRcbiAgICAgICAgICAgIGlmIChcbiAgICAgICAgICAgICAgX3NlbGYuY2hhcnRzW2N1cnJHcmFwaElkXS5yb3dzW1xuICAgICAgICAgICAgICAgIF9zZWxmLmNoYXJ0c1tjdXJyR3JhcGhJZF0uY3VyckxldmVsXG4gICAgICAgICAgICAgIF0gPT0gbnVsbFxuICAgICAgICAgICAgKSB7XG4gICAgICAgICAgICAgIF9zZWxmLmRhdGFTZXJ2aWNlLnNldE1vZGFsRGF0YSh7XG4gICAgICAgICAgICAgICAgY29sVG9WaWV3OiBfc2VsZi5jaGFydHNbY3VyckdyYXBoSWRdLmxhc3RMZXZlbENvbHVtbnMsXG4gICAgICAgICAgICAgICAgcmVmRGF0YTogX3NlbGYuY2hhcnRzW2N1cnJHcmFwaElkXS5ncmFwaERhdGFbZS5wb2ludC5uYW1lXSxcbiAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICAgIGxldCBtb2RhbE9wdGlvbnMgPSB7XG4gICAgICAgICAgICAgICAgcGFuZWxDbGFzczogJ2RhdGFQb3B1cC1tb2RhbCcsXG4gICAgICAgICAgICAgICAgYmFja2Ryb3BDbGFzczogJ21vZGFsLWJhY2tkcm9wJyxcbiAgICAgICAgICAgICAgfTtcbiAgICAgICAgICAgICAgX3NlbGYuZGlhbG9nLm9wZW4oRGF0YVBvcHVwQ29tcG9uZW50LCBtb2RhbE9wdGlvbnMpO1xuICAgICAgICAgICAgICAvL1JlZHVjaW5nIEdyYXBoIERyaWxsZG93biBMZXZlbFxuICAgICAgICAgICAgICBfc2VsZi5jaGFydHNbY3VyckdyYXBoSWRdLmN1cnJMZXZlbCAtPSAxO1xuICAgICAgICAgICAgICByZXR1cm47XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIC8vU3RvcmluZyBQcmV2aW91cyBTbmFwc2hvdCBvZiBEYXRhIHRvIHJlc3RvcmUgZ3JhcGggb24gYmFja1xuICAgICAgICAgICAgX3NlbGYuY2hhcnRzW2N1cnJHcmFwaElkXS5wcmV2TGV2ZWxEYXRhLnB1c2goXG4gICAgICAgICAgICAgIChbXSBhcyBhbnlbXSkuY29uY2F0KC4uLk9iamVjdC52YWx1ZXMoX3NlbGYuY2hhcnRzW2N1cnJHcmFwaElkXS5ncmFwaERhdGEpKVxuICAgICAgICAgICAgKTtcblxuICAgICAgICAgICAgLy9Hcm91cCBEYXRhIGFjY29yZGluZyB0byBuZXh0IGRyaWxsZG93biBmaWVsZFxuICAgICAgICAgICAgX3NlbGYuY2hhcnRzW2N1cnJHcmFwaElkXS5ncmFwaERhdGEgPSBsb2Rhc2guZ3JvdXBCeShcbiAgICAgICAgICAgICAgX3NlbGYuY2hhcnRzW2N1cnJHcmFwaElkXS5ncmFwaERhdGFbZS5wb2ludC5uYW1lXSxcbiAgICAgICAgICAgICAgX3NlbGYuY2hhcnRzW2N1cnJHcmFwaElkXS5yb3dzW1xuICAgICAgICAgICAgICAgIF9zZWxmLmNoYXJ0c1tjdXJyR3JhcGhJZF0uY3VyckxldmVsXG4gICAgICAgICAgICAgIF1cbiAgICAgICAgICAgICk7XG4gICAgICAgICAgICBsZXQgY2hhcnQ6IGFueSA9IHRoaXM7XG5cbiAgICAgICAgICAgIF9zZWxmLm1hbmFnZUJyZWFkQ3J1bWIoY3VyckdyYXBoSWQsIF9zZWxmKTtcbiAgICAgICAgICAgIFxuICAgICAgICAgICAgLy9HZXR0aW5nIGRyaWxsZG93biBzZXJpZXMgZGF0YVxuICAgICAgICAgICAgbGV0IHNlcmllcyA9IF9zZWxmLmdldERyaWxsRG93bkRhdGEoXG4gICAgICAgICAgICAgIGUucG9pbnQubmFtZSxcbiAgICAgICAgICAgICAgX3NlbGYuY2hhcnRzW2N1cnJHcmFwaElkXS5ncmFwaERhdGEsXG4gICAgICAgICAgICAgIGN1cnJHcmFwaElkLFxuICAgICAgICAgICAgICBjb2xJZFxuICAgICAgICAgICAgKTtcblxuICAgICAgICAgICAgLy9TaG93IExvYWRpbmcgaW4gQ2hhcnRcbiAgICAgICAgICAgIGNoYXJ0LnNob3dMb2FkaW5nKCdMb2FkaW5nLi4uJyk7XG4gICAgICAgICAgICAvLyBpZiAoXG4gICAgICAgICAgICAvLyAgIF9zZWxmLmNoYXJ0c1tjdXJyR3JhcGhJZF0uZ3JhcGhUeXBlc1swXSA9PVxuICAgICAgICAgICAgLy8gICAgIEdyYXBoVHlwZXMuU1RBQ0tFRF9CQVJfUEVSQ0VOVEFHRSB8fFxuICAgICAgICAgICAgLy8gICBfc2VsZi5jaGFydHNbY3VyckdyYXBoSWRdLmdyYXBoVHlwZXNbMF0gPT1cbiAgICAgICAgICAgIC8vICAgICBHcmFwaFR5cGVzLlNUQUNLRURfQ09MVU1OX1BFUkNFTlRBR0VcbiAgICAgICAgICAgIC8vICkge1xuICAgICAgICAgICAgLy8gICBwbG90T3B0aW9ucy5zZXJpZXNbJ3N0YWNraW5nJ10gPSAnbm9ybWFsJztcbiAgICAgICAgICAgIC8vICAgcGxvdE9wdGlvbnMuc2VyaWVzLmRhdGFMYWJlbHNbJ2Zvcm1hdHRlciddID0gZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgLy8gICAgIHJldHVybiB0aGlzLnk7XG4gICAgICAgICAgICAvLyAgIH07XG4gICAgICAgICAgICAvLyAgIGNoYXJ0LnVwZGF0ZSh7XG4gICAgICAgICAgICAvLyAgICAgcGxvdE9wdGlvbnM6IHBsb3RPcHRpb25zLFxuICAgICAgICAgICAgLy8gICB9KTtcbiAgICAgICAgICAgIC8vIH1cblxuICAgICAgICAgICAgc2V0VGltZW91dCgoKSA9PiB7XG4gICAgICAgICAgICAgIC8vSGlkZSBMb2FkaW5nIGluIGNoYXJ0XG4gICAgICAgICAgICAgIGNoYXJ0LmhpZGVMb2FkaW5nKCk7XG4gICAgICAgICAgICAgIC8vQWRkIERyaWxsZG93biBTZXJpZXMgRGF0YSBhcyBNYWluIFNlcmllc1xuICAgICAgICAgICAgICBjaGFydC51cGRhdGUoe1xuICAgICAgICAgICAgICAgIHBsb3RPcHRpb25zOiBwbG90T3B0aW9ucyxcbiAgICAgICAgICAgICAgICB4QXhpczoge1xuICAgICAgICAgICAgICAgICAgdHlwZTogJ2NhdGVnb3J5JyxcbiAgICAgICAgICAgICAgICAgIGxhYmVsczoge1xuICAgICAgICAgICAgICAgICAgICBzdHlsZToge1xuICAgICAgICAgICAgICAgICAgICAgIGNvbG9yOiAncmVkJyxcbiAgICAgICAgICAgICAgICAgICAgICB0ZXh0RGVjb3JhdGlvbjogJ25vbmUnLFxuICAgICAgICAgICAgICAgICAgICAgIHRleHRPdXRsaW5lOiAnMHB4JyxcbiAgICAgICAgICAgICAgICAgICAgfSxcbiAgICAgICAgICAgICAgICAgIH0sXG4gICAgICAgICAgICAgICAgICBtaW46IDAsXG4gICAgICAgICAgICAgICAgICBtYXg6IDYsXG4gICAgICAgICAgICAgICAgICBhbGxvd0RlY2ltYWxzOiBmYWxzZSxcbiAgICAgICAgICAgICAgICAgIHNjcm9sbGJhcjoge1xuICAgICAgICAgICAgICAgICAgICBlbmFibGVkOiB0cnVlLFxuICAgICAgICAgICAgICAgICAgfSxcbiAgICAgICAgICAgICAgICB9LFxuICAgICAgICAgICAgICAgIHNlcmllczogc2VyaWVzXG4gICAgICAgICAgICAgIH0pXG4gICAgICAgICAgICAgIC8vIGNoYXJ0LmFkZFNlcmllc0FzRHJpbGxkb3duKGUucG9pbnQsIHNlcmllcyk7XG4gICAgICAgICAgICB9LCAxMDAwKTtcbiAgICAgICAgICB9LFxuICAgICAgICAgIC8vSGFuZGxlIERyaWxsVXAgRXZlbnRcbiAgICAgICAgICBkcmlsbHVwOiBhc3luYyBmdW5jdGlvbiAoZTogYW55KSB7XG4gICAgICAgICAgICAvLyBsZXQgY3VyckdyYXBoSWQgPSBlLnNlcmllc09wdGlvbnMuZ3JhcGhJZDsgLy9HcmFwaElkXG4gICAgICAgICAgICAvLyBsZXQgbGV2ZWwgPSBlLnNlcmllc09wdGlvbnMubGV2ZWw7IC8vQ3VycmVudCBMZXZlbCBvZiBEcmlsbGRvd25cbiAgICAgICAgICAgIC8vIGxldCBjaGFydDogYW55ID0gdGhpcztcbiAgICAgICAgICAgIC8vIF9zZWxmLmNoYXJ0c1tjdXJyR3JhcGhJZF0uY3VyckxldmVsID0gbGV2ZWw7XG5cbiAgICAgICAgICAgIC8vIC8vUmVzdG9yaW5nIERhdGEgdXNpbmcgcHJldmlvdXMgc3RvcmUgZGF0YVxuICAgICAgICAgICAgLy8gX3NlbGYuY2hhcnRzW2N1cnJHcmFwaElkXS5ncmFwaERhdGEgPSBhd2FpdCBfc2VsZi5jaGFydHNbXG4gICAgICAgICAgICAvLyAgIGN1cnJHcmFwaElkXG4gICAgICAgICAgICAvLyBdLnByZXZMZXZlbERhdGFbbGV2ZWxdO1xuXG4gICAgICAgICAgICAvLyAvL1JlZnJlc2ggUHJldmlvdXMgRGF0YSBMaXN0XG4gICAgICAgICAgICAvLyBfc2VsZi5jaGFydHNbY3VyckdyYXBoSWRdLnByZXZMZXZlbERhdGEuc3BsaWNlKGxldmVsLCAxKTtcbiAgICAgICAgICAgIC8vIGlmIChcbiAgICAgICAgICAgIC8vICAgbGV2ZWwgPT0gMCAmJlxuICAgICAgICAgICAgLy8gICAoX3NlbGYuY2hhcnRzW2dyYXBoSWRdLmdyYXBoVHlwZXNbMF0gPT1cbiAgICAgICAgICAgIC8vICAgICBHcmFwaFR5cGVzLlNUQUNLRURfQkFSX1BFUkNFTlRBR0UgfHxcbiAgICAgICAgICAgIC8vICAgICBfc2VsZi5jaGFydHNbZ3JhcGhJZF0uZ3JhcGhUeXBlc1swXSA9PVxuICAgICAgICAgICAgLy8gICAgICAgR3JhcGhUeXBlcy5TVEFDS0VEX0NPTFVNTl9QRVJDRU5UQUdFKVxuICAgICAgICAgICAgLy8gKSB7XG4gICAgICAgICAgICAvLyAgIHBsb3RPcHRpb25zLnNlcmllc1snc3RhY2tpbmcnXSA9ICdwZXJjZW50JzsgLy9TdGFja2luZyBvZiB5LWF4aXMgb24gYmFzaXMgb2YgcGVyY2VudGFnZVxuICAgICAgICAgICAgLy8gICAvL0FkZCBQZXJjZW50IFNpZ24gYWZ0ZXIgeS1heGlzIHZhbHVlc1xuICAgICAgICAgICAgLy8gICBwbG90T3B0aW9ucy5zZXJpZXMuZGF0YUxhYmVsc1snZm9ybWF0dGVyJ10gPSBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICAvLyAgICAgcmV0dXJuIHRoaXMucGVyY2VudGFnZS50b0ZpeGVkKDIpICsgJyAlJztcbiAgICAgICAgICAgIC8vICAgfTtcblxuICAgICAgICAgICAgLy8gICBjaGFydC51cGRhdGUoe1xuICAgICAgICAgICAgLy8gICAgIHBsb3RPcHRpb25zOiBwbG90T3B0aW9ucyxcbiAgICAgICAgICAgIC8vICAgfSk7XG4gICAgICAgICAgICAvLyB9XG4gICAgICAgICAgfSxcbiAgICAgICAgfSxcbiAgICAgIH0sXG4gICAgICAvL0NvbmZpZ3VyaW5nIFgtYXhpc1xuICAgICAgeEF4aXM6IHtcbiAgICAgICAgdHlwZTogJ2NhdGVnb3J5JyxcbiAgICAgICAgbGFiZWxzOiB7XG4gICAgICAgICAgc3R5bGU6IHtcbiAgICAgICAgICAgIGNvbG9yOiAncmVkJyxcbiAgICAgICAgICAgIHRleHREZWNvcmF0aW9uOiAnbm9uZScsXG4gICAgICAgICAgICB0ZXh0T3V0bGluZTogJzBweCcsXG4gICAgICAgICAgfSxcbiAgICAgICAgfSxcbiAgICAgICAgbWluOiAwLFxuICAgICAgICBtYXg6XG4gICAgICAgICAgT2JqZWN0LmtleXModGhpcy5jaGFydHNbZ3JhcGhJZF0uZ3JhcGhEYXRhKS5sZW5ndGggPD0gNlxuICAgICAgICAgICAgPyBPYmplY3Qua2V5cyh0aGlzLmNoYXJ0c1tncmFwaElkXS5ncmFwaERhdGEpLmxlbmd0aCAtIDFcbiAgICAgICAgICAgIDogNixcbiAgICAgICAgYWxsb3dEZWNpbWFsczogZmFsc2UsXG4gICAgICAgIHNjcm9sbGJhcjoge1xuICAgICAgICAgIGVuYWJsZWQ6IHRydWUsXG4gICAgICAgIH0sXG4gICAgICB9LFxuICAgICAgLy9Db25maWd1cmluZyBZLWF4aXNcbiAgICAgIHlBeGlzOiBsb2Rhc2gubWFwKHRoaXMuY2hhcnRzW2dyYXBoSWRdLmNvbHVtbnMsICh5OiBhbnkpID0+IHtcbiAgICAgICAgcmV0dXJuIHtcbiAgICAgICAgICBvcHBvc2l0ZTogdHJ1ZSxcbiAgICAgICAgICB0aXRsZToge1xuICAgICAgICAgICAgdGV4dDogbnVsbCwgLy8gSGlkaW5nIHZlcnRpY2FsIGxhYmVscyBvdmVyIHktYXhpc1xuICAgICAgICAgIH0sXG4gICAgICAgIH07XG4gICAgICB9KSxcbiAgICAgIC8vR2V0dGluZyBNYWluIFNlcmllcyBEYXRhXG4gICAgICBzZXJpZXM6IHRoaXMuZ2V0RHJpbGxEb3duRGF0YShcbiAgICAgICAgbnVsbCxcbiAgICAgICAgdGhpcy5jaGFydHNbZ3JhcGhJZF0uZ3JhcGhEYXRhLFxuICAgICAgICB0aGlzLmNoYXJ0c1tncmFwaElkXS5ncmFwaElkXG4gICAgICApLFxuICAgIH07XG4gIH1cblxuICBwcml2YXRlIG1hbmFnZUJyZWFkQ3J1bWIoZ3JhcGhJZDogc3RyaW5nLCBfc2VsZjogYW55KSB7XG4gICAgY29uc3QgZGl2ID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoXCJncmFwaC1vcHRpb25zLVwiICsgZ3JhcGhJZCk7XG4gICAgZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoXCJicmVhZGNydW1iLVwiICsgZ3JhcGhJZCk/LnJlbW92ZSgpO1xuICAgIGNvbnN0IGJyZWFkQ3J1bWIgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KFwiZGl2XCIpO1xuICAgIGlmKF9zZWxmLmNoYXJ0c1tncmFwaElkXS5icmVhZENydW1iLmxlbmd0aCA9PSAxKXtcbiAgICAgIHJldHVybjtcbiAgICB9XG5cbiAgICBicmVhZENydW1iLnNldEF0dHJpYnV0ZSgnc3R5bGUnLCB0aGlzLmJyZWFkY3J1bWJTdHlsZXMpO1xuICAgIGJyZWFkQ3J1bWIuc2V0QXR0cmlidXRlKCdpZCcsIFwiYnJlYWRjcnVtYi1cIiArIGdyYXBoSWQpO1xuICAgIC8vIGhvbWVJY29uLnNldEF0dHJpYnV0ZSgnaWQnLCAnaG9tZS1sYWJlbC0nICsgZ3JhcGhJZCk7XG4gICAgLy8gaG9tZUljb24uc2V0QXR0cmlidXRlKCdjbGFzcycsICdmYSBmYS1ob21lJyk7XG4gICAgX3NlbGYuY2hhcnRzW2dyYXBoSWRdLmJyZWFkQ3J1bWIuZm9yRWFjaCgoYnJlYWRjcnVtYjogYW55LCBpbmRleDogYW55KSA9PiB7XG4gICAgICBjb25zdCBwYXJhID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudChcInBcIik7XG4gICAgICBjb25zdCBzcGFuID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudChcInNwYW5cIik7XG4gICAgICBzcGFuLnNldEF0dHJpYnV0ZShcInN0eWxlXCIsIFwidGV4dC1kZWNvcmF0aW9uOiB1bmRlcmxpbmU7IGN1cnNvcjogcG9pbnRlcjtcIilcbiAgICAgIHNwYW4uc2V0QXR0cmlidXRlKFwiaWRcIiwgYnJlYWRjcnVtYik7XG4gICAgICBzcGFuLmFwcGVuZChicmVhZGNydW1iKTtcbiAgICAgIHBhcmEuYXBwZW5kQ2hpbGQoc3Bhbik7XG4gICAgICBwYXJhLnNldEF0dHJpYnV0ZShcInN0eWxlXCIsIFwibWFyZ2luLWJvdHRvbTogMHB4O1wiKVxuICAgICAgaWYgKGluZGV4ICE9IHRoaXMuY2hhcnRzW2dyYXBoSWRdLmJyZWFkQ3J1bWIubGVuZ3RoIC0gMSkge1xuICAgICAgICBwYXJhLmFwcGVuZChcIiA+IFwiKTtcbiAgICAgICAgc3Bhbi5hZGRFdmVudExpc3RlbmVyKFwiY2xpY2tcIiwgKGV2ZW50IDphbnkpID0+IHtcbiAgICAgICAgICBjb25zb2xlLmxvZyhldmVudC50YXJnZXQuaWQpO1xuICAgICAgICAgIGlmKGV2ZW50LnRhcmdldC5pZCA9PSBcIkhvbWVcIil7XG4gICAgICAgICAgICBfdGhpcy5jaGFydHNbZ3JhcGhJZF0uZ3JhcGhEYXRhID0gX3RoaXMuY2hhcnRzW2dyYXBoSWRdLnByZXZMZXZlbERhdGFbMF07XG4gICAgICAgICAgICBfdGhpcy5idWlsZEdyYXBoKHtcbiAgICAgICAgICAgICAgLi4uX3RoaXMuY2hhcnRzW2dyYXBoSWRdLFxuICAgICAgICAgICAgICBicmVhZENydW1iOiBbJ0hvbWUnXSxcbiAgICAgICAgICAgICAgY3VyckxldmVsOiAwLFxuICAgICAgICAgICAgICBwcmV2TGV2ZWxEYXRhOiBbXSxcbiAgICAgICAgICAgICAgb3JkZXI6IDAsXG4gICAgICAgICAgICAgIHNlbEtleXM6IFtdLFxuICAgICAgICAgICAgICBjb2xUb1Nob3c6ICcnLFxuICAgICAgICAgICAgfSBhcyBHcmFwaERhdGEpXG4gICAgICAgICAgfWVsc2V7XG4gICAgICAgICAgICBjb25zdCBpbmRleCA9IF90aGlzLmNoYXJ0c1tncmFwaElkXS5icmVhZENydW1iLmZpbmRJbmRleCgoZWw6IGFueSkgPT4gZWwgPT0gZXZlbnQudGFyZ2V0LmlkKTtcbiAgICAgICAgICAgIGNvbnNvbGUubG9nKCdpbmRleDogJywgaW5kZXgpO1xuICAgICAgICAgICAgaWYoaW5kZXggPiAwKXtcbiAgICAgICAgICAgICAgLy8gdGhpcy5idWlsZEdyYXBoKClcbiAgICAgICAgICAgICAgY29uc29sZS5sb2coJ3ByZXYgIF90aGlzLmNoYXJ0c1tncmFwaElkXTogJywgX3RoaXMuY2hhcnRzW2dyYXBoSWRdKTtcbiAgICAgICAgICAgICAgLy9SZXN0b3JpbmcgRGF0YSB1c2luZyBwcmV2aW91cyBzdG9yZSBkYXRhXG4gICAgICAgICAgICAgIF90aGlzLmNoYXJ0c1tncmFwaElkXS5jdXJyTGV2ZWwgPSBpbmRleDtcbiAgICAgICAgICAgICAgX3RoaXMuY2hhcnRzW2dyYXBoSWRdLmdyYXBoRGF0YSA9IF90aGlzLmNoYXJ0c1tncmFwaElkXS5wcmV2TGV2ZWxEYXRhW2luZGV4XTtcbiAgICAgICAgICAgICAgXG4gICAgICAgICAgICAgIC8vUmVmcmVzaCBQcmV2aW91cyBEYXRhIExpc3RcbiAgICAgICAgICAgICAgX3RoaXMuY2hhcnRzW2dyYXBoSWRdLnByZXZMZXZlbERhdGEgPSBfdGhpcy5jaGFydHNbZ3JhcGhJZF0ucHJldkxldmVsRGF0YS5zbGljZSgwLCBpbmRleCk7XG4gIFxuICAgICAgICAgICAgICBfdGhpcy5jaGFydHNbZ3JhcGhJZF0uYnJlYWRDcnVtYiA9IF90aGlzLmNoYXJ0c1tncmFwaElkXS5icmVhZENydW1iLnNsaWNlKDAsIGluZGV4ICsgMSk7XG4gICAgICAgICAgICAgIFxuICAgICAgICAgICAgICBfdGhpcy5jaGFydHNbZ3JhcGhJZF0uc2VsS2V5cyA9IF90aGlzLmNoYXJ0c1tncmFwaElkXS5zZWxLZXlzPy5zbGljZSgwLCBpbmRleCk7XG4gICAgICAgICAgICAgIFxuICAgICAgICAgICAgICBjb25zb2xlLmxvZygnX3RoaXMuY2hhcnRzW2dyYXBoSWRdOiAnLCBfdGhpcy5jaGFydHNbZ3JhcGhJZF0pO1xuICAgICAgICAgICAgICBfdGhpcy5idWlsZEdyYXBoKHtcbiAgICAgICAgICAgICAgICAuLi5fdGhpcy5jaGFydHNbZ3JhcGhJZF0sXG4gICAgICAgICAgICAgIH0gYXMgR3JhcGhEYXRhKVxuICAgICAgICAgICAgfVxuICAgICAgICAgIH1cbiAgICAgICAgfSlcbiAgICAgIH1cbiAgICAgIGJyZWFkQ3J1bWIuYXBwZW5kQ2hpbGQocGFyYSk7XG4gICAgICBsZXQgX3RoaXMgPSB0aGlzO1xuICAgIH0pO1xuICAgIGRpdiEuYXBwZW5kQ2hpbGQoYnJlYWRDcnVtYik7XG4gIH1cblxuICBwcml2YXRlIGFwcGx5Q3VzdG9tRmlsdGVyKGQ6IGFueSwgZmlsdGVyOiBGaWx0ZXJzKSB7XG4gICAgbGV0IGlzVmFsaWQgPSBmaWx0ZXIuY3VzdG9tRmlsdGVyLmxlbmd0aCA9PSAwO1xuICAgIGlmIChmaWx0ZXIuY3VzdG9tRmlsdGVyICYmIGZpbHRlci5jdXN0b21GaWx0ZXIubGVuZ3RoID4gMCkge1xuICAgICAgZm9yIChjb25zdCBlbGVtZW50IG9mIGZpbHRlci5jdXN0b21GaWx0ZXIpIHtcbiAgICAgICAgaXNWYWxpZCA9IGZhbHNlO1xuICAgICAgICBjb25zdCBfZmlsdGVyIDogQ3VzdG9tRmlsdGVyID0gZWxlbWVudFxuICAgICAgICBzd2l0Y2ggKF9maWx0ZXIuY3VzdG9tRmlsdGVyVHlwZSkge1xuICAgICAgICAgIGNhc2UgQ3VzdG9tRmlsdGVyVHlwZXMuU0lOR0xFX0VRVUFUSU9OOlxuICAgICAgICAgICAgaWYgKFxuICAgICAgICAgICAgICB0aGlzLmdldEVxdWF0aW9uUmVzdWx0KFxuICAgICAgICAgICAgICAgIGRbX2ZpbHRlci5jdXN0b21GaWx0ZXJ2YXIxXSxcbiAgICAgICAgICAgICAgICBfZmlsdGVyLmN1c3RvbUZpbHRlclZhcjFWYWx1ZSxcbiAgICAgICAgICAgICAgICBfZmlsdGVyLnN5bWJvbDEsXG4gICAgICAgICAgICAgICAgX2ZpbHRlci5maWx0ZXJUeXBlMSxcbiAgICAgICAgICAgICAgICBfZmlsdGVyLmZpbHRlckZvcm1hdDFcbiAgICAgICAgICAgICAgKVxuICAgICAgICAgICAgKSB7XG4gICAgICAgICAgICAgIGlzVmFsaWQgPSB0cnVlO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgY2FzZSBDdXN0b21GaWx0ZXJUeXBlcy5BX09SX0I6XG4gICAgICAgICAgICBpZiAoXG4gICAgICAgICAgICAgICh0aGlzLmdldEVxdWF0aW9uUmVzdWx0KFxuICAgICAgICAgICAgICAgIGRbX2ZpbHRlci5jdXN0b21GaWx0ZXJ2YXIxXSxcbiAgICAgICAgICAgICAgICBfZmlsdGVyLmN1c3RvbUZpbHRlclZhcjFWYWx1ZSxcbiAgICAgICAgICAgICAgICBfZmlsdGVyLnN5bWJvbDEsXG4gICAgICAgICAgICAgICAgX2ZpbHRlci5maWx0ZXJUeXBlMSxcbiAgICAgICAgICAgICAgICBfZmlsdGVyLmZpbHRlckZvcm1hdDFcbiAgICAgICAgICAgICAgKSB8fFxuICAgICAgICAgICAgICB0aGlzLmdldEVxdWF0aW9uUmVzdWx0KFxuICAgICAgICAgICAgICAgIGRbX2ZpbHRlci5jdXN0b21GaWx0ZXJ2YXIyXSxcbiAgICAgICAgICAgICAgICBfZmlsdGVyLmN1c3RvbUZpbHRlclZhcjJWYWx1ZSxcbiAgICAgICAgICAgICAgICBfZmlsdGVyLnN5bWJvbDIsXG4gICAgICAgICAgICAgICAgX2ZpbHRlci5maWx0ZXJUeXBlMixcbiAgICAgICAgICAgICAgICBfZmlsdGVyLmZpbHRlckZvcm1hdDJcbiAgICAgICAgICAgICAgKSlcbiAgICAgICAgICAgICkge1xuICAgICAgICAgICAgICBpc1ZhbGlkID0gdHJ1ZTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgIGNhc2UgQ3VzdG9tRmlsdGVyVHlwZXMuQV9BTkRfQjpcbiAgICAgICAgICAgIGlmIChcbiAgICAgICAgICAgICAgKHRoaXMuZ2V0RXF1YXRpb25SZXN1bHQoXG4gICAgICAgICAgICAgICAgZFtfZmlsdGVyLmN1c3RvbUZpbHRlcnZhcjFdLFxuICAgICAgICAgICAgICAgIF9maWx0ZXIuY3VzdG9tRmlsdGVyVmFyMVZhbHVlLFxuICAgICAgICAgICAgICAgIF9maWx0ZXIuc3ltYm9sMSxcbiAgICAgICAgICAgICAgICBfZmlsdGVyLmZpbHRlclR5cGUxLFxuICAgICAgICAgICAgICAgIF9maWx0ZXIuZmlsdGVyRm9ybWF0MVxuICAgICAgICAgICAgICApICYmXG4gICAgICAgICAgICAgIHRoaXMuZ2V0RXF1YXRpb25SZXN1bHQoXG4gICAgICAgICAgICAgICAgZFtfZmlsdGVyLmN1c3RvbUZpbHRlcnZhcjJdLFxuICAgICAgICAgICAgICAgIF9maWx0ZXIuY3VzdG9tRmlsdGVyVmFyMlZhbHVlLFxuICAgICAgICAgICAgICAgIF9maWx0ZXIuc3ltYm9sMixcbiAgICAgICAgICAgICAgICBfZmlsdGVyLmZpbHRlclR5cGUyLFxuICAgICAgICAgICAgICAgIF9maWx0ZXIuZmlsdGVyRm9ybWF0MlxuICAgICAgICAgICAgICApKVxuICAgICAgICAgICAgKSB7XG4gICAgICAgICAgICAgIGlzVmFsaWQgPSB0cnVlO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgY2FzZSBDdXN0b21GaWx0ZXJUeXBlcy5BX09SX0JfT1JfQzpcbiAgICAgICAgICAgIGlmIChcbiAgICAgICAgICAgICAgKHRoaXMuZ2V0RXF1YXRpb25SZXN1bHQoXG4gICAgICAgICAgICAgICAgZFtfZmlsdGVyLmN1c3RvbUZpbHRlcnZhcjFdLFxuICAgICAgICAgICAgICAgIF9maWx0ZXIuY3VzdG9tRmlsdGVyVmFyMVZhbHVlLFxuICAgICAgICAgICAgICAgIF9maWx0ZXIuc3ltYm9sMSxcbiAgICAgICAgICAgICAgICBfZmlsdGVyLmZpbHRlclR5cGUxLFxuICAgICAgICAgICAgICAgIF9maWx0ZXIuZmlsdGVyRm9ybWF0MVxuICAgICAgICAgICAgICApIHx8XG4gICAgICAgICAgICAgIHRoaXMuZ2V0RXF1YXRpb25SZXN1bHQoXG4gICAgICAgICAgICAgICAgZFtfZmlsdGVyLmN1c3RvbUZpbHRlcnZhcjJdLFxuICAgICAgICAgICAgICAgIF9maWx0ZXIuY3VzdG9tRmlsdGVyVmFyMlZhbHVlLFxuICAgICAgICAgICAgICAgIF9maWx0ZXIuc3ltYm9sMixcbiAgICAgICAgICAgICAgICBfZmlsdGVyLmZpbHRlclR5cGUyLFxuICAgICAgICAgICAgICAgIF9maWx0ZXIuZmlsdGVyRm9ybWF0MlxuICAgICAgICAgICAgICApIHx8XG4gICAgICAgICAgICAgIHRoaXMuZ2V0RXF1YXRpb25SZXN1bHQoXG4gICAgICAgICAgICAgICAgZFtfZmlsdGVyLmN1c3RvbUZpbHRlcnZhcjNdLFxuICAgICAgICAgICAgICAgIF9maWx0ZXIuY3VzdG9tRmlsdGVyVmFyM1ZhbHVlLFxuICAgICAgICAgICAgICAgIF9maWx0ZXIuc3ltYm9sMyxcbiAgICAgICAgICAgICAgICBfZmlsdGVyLmZpbHRlclR5cGUzLFxuICAgICAgICAgICAgICAgIF9maWx0ZXIuZmlsdGVyRm9ybWF0M1xuICAgICAgICAgICAgICApKVxuICAgICAgICAgICAgKSB7XG4gICAgICAgICAgICAgIGlzVmFsaWQgPSB0cnVlO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgY2FzZSBDdXN0b21GaWx0ZXJUeXBlcy5BX0FORF9CX0FORF9DOlxuICAgICAgICAgICAgaWYgKFxuICAgICAgICAgICAgKHRoaXMuZ2V0RXF1YXRpb25SZXN1bHQoXG4gICAgICAgICAgICAgICAgZFtfZmlsdGVyLmN1c3RvbUZpbHRlcnZhcjFdLFxuICAgICAgICAgICAgICAgIF9maWx0ZXIuY3VzdG9tRmlsdGVyVmFyMVZhbHVlLFxuICAgICAgICAgICAgICAgIF9maWx0ZXIuc3ltYm9sMSxcbiAgICAgICAgICAgICAgICBfZmlsdGVyLmZpbHRlclR5cGUxLFxuICAgICAgICAgICAgICAgIF9maWx0ZXIuZmlsdGVyRm9ybWF0MVxuICAgICAgICAgICAgICApICYmXG4gICAgICAgICAgICAgIHRoaXMuZ2V0RXF1YXRpb25SZXN1bHQoXG4gICAgICAgICAgICAgICAgZFtfZmlsdGVyLmN1c3RvbUZpbHRlcnZhcjJdLFxuICAgICAgICAgICAgICAgIF9maWx0ZXIuY3VzdG9tRmlsdGVyVmFyMlZhbHVlLFxuICAgICAgICAgICAgICAgIF9maWx0ZXIuc3ltYm9sMixcbiAgICAgICAgICAgICAgICBfZmlsdGVyLmZpbHRlclR5cGUyLFxuICAgICAgICAgICAgICAgIF9maWx0ZXIuZmlsdGVyRm9ybWF0MlxuICAgICAgICAgICAgICApICYmXG4gICAgICAgICAgICAgIHRoaXMuZ2V0RXF1YXRpb25SZXN1bHQoXG4gICAgICAgICAgICAgICAgZFtfZmlsdGVyLmN1c3RvbUZpbHRlcnZhcjNdLFxuICAgICAgICAgICAgICAgIF9maWx0ZXIuY3VzdG9tRmlsdGVyVmFyM1ZhbHVlLFxuICAgICAgICAgICAgICAgIF9maWx0ZXIuc3ltYm9sMyxcbiAgICAgICAgICAgICAgICBfZmlsdGVyLmZpbHRlclR5cGUzLFxuICAgICAgICAgICAgICAgIF9maWx0ZXIuZmlsdGVyRm9ybWF0M1xuICAgICAgICAgICAgICApKVxuICAgICAgICAgICAgKSB7XG4gICAgICAgICAgICAgIGlzVmFsaWQgPSB0cnVlO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgY2FzZSBDdXN0b21GaWx0ZXJUeXBlcy5BX09SX0JfQU5EX0M6XG4gICAgICAgICAgICBpZiAoXG4gICAgICAgICAgICAgICh0aGlzLmdldEVxdWF0aW9uUmVzdWx0KFxuICAgICAgICAgICAgICAgIGRbX2ZpbHRlci5jdXN0b21GaWx0ZXJ2YXIxXSxcbiAgICAgICAgICAgICAgICBfZmlsdGVyLmN1c3RvbUZpbHRlclZhcjFWYWx1ZSxcbiAgICAgICAgICAgICAgICBfZmlsdGVyLnN5bWJvbDEsXG4gICAgICAgICAgICAgICAgX2ZpbHRlci5maWx0ZXJUeXBlMSxcbiAgICAgICAgICAgICAgICBfZmlsdGVyLmZpbHRlckZvcm1hdDFcbiAgICAgICAgICAgICAgKSB8fFxuICAgICAgICAgICAgICAodGhpcy5nZXRFcXVhdGlvblJlc3VsdChcbiAgICAgICAgICAgICAgICBkW19maWx0ZXIuY3VzdG9tRmlsdGVydmFyMl0sXG4gICAgICAgICAgICAgICAgX2ZpbHRlci5jdXN0b21GaWx0ZXJWYXIyVmFsdWUsXG4gICAgICAgICAgICAgICAgX2ZpbHRlci5zeW1ib2wyLFxuICAgICAgICAgICAgICAgIF9maWx0ZXIuZmlsdGVyVHlwZTIsXG4gICAgICAgICAgICAgICAgX2ZpbHRlci5maWx0ZXJGb3JtYXQyXG4gICAgICAgICAgICAgICkgJiZcbiAgICAgICAgICAgICAgICB0aGlzLmdldEVxdWF0aW9uUmVzdWx0KFxuICAgICAgICAgICAgICAgICAgZFtfZmlsdGVyLmN1c3RvbUZpbHRlcnZhcjNdLFxuICAgICAgICAgICAgICAgICAgX2ZpbHRlci5jdXN0b21GaWx0ZXJWYXIzVmFsdWUsXG4gICAgICAgICAgICAgICAgICBfZmlsdGVyLnN5bWJvbDMsXG4gICAgICAgICAgICAgICAgICBfZmlsdGVyLmZpbHRlclR5cGUzLFxuICAgICAgICAgICAgICAgICAgX2ZpbHRlci5maWx0ZXJGb3JtYXQzXG4gICAgICAgICAgICAgICAgKSkpXG4gICAgICAgICAgICApIHtcbiAgICAgICAgICAgICAgaXNWYWxpZCA9IHRydWU7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBicmVhaztcbiAgICAgICAgICBjYXNlIEN1c3RvbUZpbHRlclR5cGVzLkFfQU5EX0JfT1JfQzpcbiAgICAgICAgICAgIGlmIChcbiAgICAgICAgICAgICAgKHRoaXMuZ2V0RXF1YXRpb25SZXN1bHQoXG4gICAgICAgICAgICAgICAgZFtfZmlsdGVyLmN1c3RvbUZpbHRlcnZhcjFdLFxuICAgICAgICAgICAgICAgIF9maWx0ZXIuY3VzdG9tRmlsdGVyVmFyMVZhbHVlLFxuICAgICAgICAgICAgICAgIF9maWx0ZXIuc3ltYm9sMSxcbiAgICAgICAgICAgICAgICBfZmlsdGVyLmZpbHRlclR5cGUxLFxuICAgICAgICAgICAgICAgIF9maWx0ZXIuZmlsdGVyRm9ybWF0MVxuICAgICAgICAgICAgICApICYmXG4gICAgICAgICAgICAgICh0aGlzLmdldEVxdWF0aW9uUmVzdWx0KFxuICAgICAgICAgICAgICAgIGRbX2ZpbHRlci5jdXN0b21GaWx0ZXJ2YXIyXSxcbiAgICAgICAgICAgICAgICBfZmlsdGVyLmN1c3RvbUZpbHRlclZhcjJWYWx1ZSxcbiAgICAgICAgICAgICAgICBfZmlsdGVyLnN5bWJvbDIsXG4gICAgICAgICAgICAgICAgX2ZpbHRlci5maWx0ZXJUeXBlMixcbiAgICAgICAgICAgICAgICBfZmlsdGVyLmZpbHRlckZvcm1hdDJcbiAgICAgICAgICAgICAgKSB8fFxuICAgICAgICAgICAgICAgIHRoaXMuZ2V0RXF1YXRpb25SZXN1bHQoXG4gICAgICAgICAgICAgICAgICBkW19maWx0ZXIuY3VzdG9tRmlsdGVydmFyM10sXG4gICAgICAgICAgICAgICAgICBfZmlsdGVyLmN1c3RvbUZpbHRlclZhcjNWYWx1ZSxcbiAgICAgICAgICAgICAgICAgIF9maWx0ZXIuc3ltYm9sMyxcbiAgICAgICAgICAgICAgICAgIF9maWx0ZXIuZmlsdGVyVHlwZTMsXG4gICAgICAgICAgICAgICAgICBfZmlsdGVyLmZpbHRlckZvcm1hdDNcbiAgICAgICAgICAgICAgICApKSlcbiAgICAgICAgICAgICkge1xuICAgICAgICAgICAgICBpc1ZhbGlkID0gdHJ1ZTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICB9XG4gIFxuICAgICAgICBpZighaXNWYWxpZCkgYnJlYWs7XG4gICAgICB9XG4gICAgfVxuICAgIHJldHVybiBpc1ZhbGlkO1xuICB9XG5cbiAgcHJpdmF0ZSBnZXRGb3JtYXR0ZWREYXRlKFxuICAgIGlucHV0U3RyOiBhbnksXG4gICAgZm9ybWF0OiBhbnkgPSBEYXRlRm9ybWF0LkREX01NX1lZWVlfSEhfbW1fc3NcbiAgKSB7XG4gICAgaWYgKFxuICAgICAgW1xuICAgICAgICBEYXRlRm9ybWF0LkREX01NX1lZWVksXG4gICAgICAgIERhdGVGb3JtYXQuTU1fRERfWVlZWSxcbiAgICAgICAgRGF0ZUZvcm1hdC5ERF9zX01NX3NfWVlZWSxcbiAgICAgICAgRGF0ZUZvcm1hdC5NTV9zX0REX3NfWVlZWSxcbiAgICAgICAgRGF0ZUZvcm1hdC5ZWVlZX3NfTU1fc19ERCxcbiAgICAgICAgRGF0ZUZvcm1hdC5ZWVlZX01NX0RELFxuICAgICAgXS5pbmRleE9mKGZvcm1hdCkgIT0gLTFcbiAgICApIHtcbiAgICAgIGxldCB0ZW1wQXJyID0gaW5wdXRTdHIuc3BsaXQoJyAnKTtcbiAgICAgIGxldCBkYXRlU3RyID0gdGVtcEFyclswXTtcbiAgICAgIGxldCBbZGF5LCBtb250aCwgeWVhcl0gPSBkYXRlU3RyLnNwbGl0KCctJyk7XG4gICAgICByZXR1cm4gbmV3IERhdGUoK3llYXIsIG1vbnRoIC0gMSwgK2RheSk7XG4gICAgfSBlbHNlIGlmIChmb3JtYXQgPT0gVGltZUZvcm1hdC5ISF9tbV9zcykge1xuICAgICAgbGV0IFtob3VyLCBtaW51dGUsIHNlY29uZF0gPSBpbnB1dFN0clxuICAgICAgICAuc3BsaXQoJzonKVxuICAgICAgICAubWFwKChlbDogYW55KSA9PiBwYXJzZUludChlbCkpO1xuICAgICAgcmV0dXJuIGhvdXIgKiA2MCAqIDYwICsgbWludXRlICogNjAgKyBzZWNvbmQ7XG4gICAgfSBlbHNlIHtcbiAgICAgIGxldCB0ZW1wQXJyID0gaW5wdXRTdHIuc3BsaXQoJyAnKTtcbiAgICAgIGxldCBkYXRlU3RyID0gdGVtcEFyclswXTtcbiAgICAgIGxldCB0aW1lID0gdGVtcEFyclsxXTtcbiAgICAgIGxldCBbZGF5LCBtb250aCwgeWVhcl0gPSBkYXRlU3RyLnNwbGl0KCctJyk7XG4gICAgICBsZXQgW2hvdXIsIG1pbnV0ZV0gPSB0aW1lLnNwbGl0KCc6Jyk7XG4gICAgICBsZXQgc2Vjb25kID0gMDtcbiAgICAgIHJldHVybiBuZXcgRGF0ZSgreWVhciwgbW9udGggLSAxLCArZGF5LCAraG91ciwgK21pbnV0ZSwgK3NlY29uZCk7XG4gICAgfVxuICB9XG5cbiAgcHJpdmF0ZSBnZXRFcXVhdGlvblJlc3VsdChcbiAgICB2YXJpYWJsZTE6IHN0cmluZyB8IG51bWJlcixcbiAgICB2YXJpYWJsZTI6IGFueSxcbiAgICBvcGVyYXRvcjogRmlsdGVyVHlwZXMsXG4gICAgdHlwZTogRGF0YVR5cGUsXG4gICAgZm9ybWF0OiBhbnlcbiAgKSB7XG4gICAgc3dpdGNoIChvcGVyYXRvcikge1xuICAgICAgY2FzZSBGaWx0ZXJUeXBlcy5FUVVBTDpcbiAgICAgICAgaWYgKHZhcmlhYmxlMSA9PSB2YXJpYWJsZTJbMF0pIHtcbiAgICAgICAgICByZXR1cm4gdHJ1ZTtcbiAgICAgICAgfVxuICAgICAgICBicmVhaztcbiAgICAgIGNhc2UgRmlsdGVyVHlwZXMuR1JFQVRFUl9USEFOOlxuICAgICAgICBpZiAodmFyaWFibGUxID4gdmFyaWFibGUyWzBdKSB7XG4gICAgICAgICAgcmV0dXJuIHRydWU7XG4gICAgICAgIH1cbiAgICAgICAgYnJlYWs7XG4gICAgICBjYXNlIEZpbHRlclR5cGVzLkxFU1NfVEhBTjpcbiAgICAgICAgaWYgKHZhcmlhYmxlMSA8IHZhcmlhYmxlMlswXSkge1xuICAgICAgICAgIHJldHVybiB0cnVlO1xuICAgICAgICB9XG4gICAgICAgIGJyZWFrO1xuICAgICAgY2FzZSBGaWx0ZXJUeXBlcy5OT1RfRVFVQUw6XG4gICAgICAgIGlmICh2YXJpYWJsZTEgIT0gdmFyaWFibGUyWzBdKSB7XG4gICAgICAgICAgcmV0dXJuIHRydWU7XG4gICAgICAgIH1cbiAgICAgICAgYnJlYWs7XG4gICAgICBjYXNlIEZpbHRlclR5cGVzLkdSRUFURVJfVEhBTl9FUVVBTDpcbiAgICAgICAgaWYgKHZhcmlhYmxlMSA+PSB2YXJpYWJsZTJbMF0pIHtcbiAgICAgICAgICByZXR1cm4gdHJ1ZTtcbiAgICAgICAgfVxuICAgICAgICBicmVhaztcbiAgICAgIGNhc2UgRmlsdGVyVHlwZXMuTEVTU19USEFOX0VRVUFMOlxuICAgICAgICBpZiAodmFyaWFibGUxIDw9IHZhcmlhYmxlMlswXSkge1xuICAgICAgICAgIHJldHVybiB0cnVlO1xuICAgICAgICB9XG4gICAgICAgIGJyZWFrO1xuICAgICAgY2FzZSBGaWx0ZXJUeXBlcy5CRVRXRUVOX1JBTkdFOlxuICAgICAgICBpZiAodmFyaWFibGUxID49IHZhcmlhYmxlMlswXSAmJiB2YXJpYWJsZTEgPCB2YXJpYWJsZTJbMV0pIHtcbiAgICAgICAgICByZXR1cm4gdHJ1ZTtcbiAgICAgICAgfVxuICAgICAgICBicmVhaztcbiAgICAgIGNhc2UgRmlsdGVyVHlwZXMuSU46XG4gICAgICAgIGlmICh2YXJpYWJsZTIuaW5kZXhPZih2YXJpYWJsZTEudG9TdHJpbmcoKSkgIT0gLTEpIHtcbiAgICAgICAgICByZXR1cm4gdHJ1ZTtcbiAgICAgICAgfVxuICAgICAgICBicmVhaztcbiAgICAgIGNhc2UgRmlsdGVyVHlwZXMuTk9UX0lOOlxuICAgICAgICBpZiAodmFyaWFibGUyLmluZGV4T2YodmFyaWFibGUxLnRvU3RyaW5nKCkpID09IC0xKSB7XG4gICAgICAgICAgcmV0dXJuIHRydWU7XG4gICAgICAgIH1cbiAgICAgICAgYnJlYWs7XG4gICAgICBjYXNlIEZpbHRlclR5cGVzLkJFRk9SRTpcbiAgICAgICAgaWYgKHR5cGUgPT0gRGF0YVR5cGUuREFURSkge1xuICAgICAgICAgIC8vRGF0ZSBUeXBlIHZhcmlhYmxlXG4gICAgICAgICAgbGV0IG9wZXJhbmQxID0gdGhpcy5nZXRGb3JtYXR0ZWREYXRlKHZhcmlhYmxlMSwgZm9ybWF0KTtcbiAgICAgICAgICBsZXQgb3BlcmFuZDIgPSBuZXcgRGF0ZSh2YXJpYWJsZTIpO1xuICAgICAgICAgIGlmIChvcGVyYW5kMSA8IG9wZXJhbmQyKSB7XG4gICAgICAgICAgICByZXR1cm4gdHJ1ZTtcbiAgICAgICAgICB9XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgLy9UaW1lIFR5cGUgdmFyaWFibGVcbiAgICAgICAgICBsZXQgY3VyclNlY29uZHMgPSB0aGlzLmdldEZvcm1hdHRlZERhdGUodmFyaWFibGUxLCBmb3JtYXQpO1xuICAgICAgICAgIGxldCBbaG91ciwgbWluXSA9IHZhcmlhYmxlMi5zcGxpdCgnOicpLm1hcCgoZWw6IGFueSkgPT4gcGFyc2VJbnQoZWwpKTtcbiAgICAgICAgICBsZXQgY29tcGFyZWRTZWMgPSBob3VyICogNjAgKiA2MCArIG1pbiAqIDYwO1xuICAgICAgICAgIGlmIChjdXJyU2Vjb25kcyA8IGNvbXBhcmVkU2VjKSB7XG4gICAgICAgICAgICByZXR1cm4gdHJ1ZTtcbiAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgICAgYnJlYWs7XG4gICAgICBjYXNlIEZpbHRlclR5cGVzLkFGVEVSOlxuICAgICAgICBpZiAodHlwZSA9PSBEYXRhVHlwZS5EQVRFKSB7XG4gICAgICAgICAgLy9EYXRlIFR5cGUgdmFyaWFibGVcbiAgICAgICAgICBsZXQgb3BlcmFuZDEgPSB0aGlzLmdldEZvcm1hdHRlZERhdGUodmFyaWFibGUxLCBmb3JtYXQpO1xuICAgICAgICAgIGxldCBvcGVyYW5kMiA9IG5ldyBEYXRlKHZhcmlhYmxlMik7XG4gICAgICAgICAgaWYgKG9wZXJhbmQxID4gb3BlcmFuZDIpIHtcbiAgICAgICAgICAgIHJldHVybiB0cnVlO1xuICAgICAgICAgIH1cbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAvL1RpbWUgVHlwZSB2YXJpYWJsZVxuICAgICAgICAgIGxldCBjdXJyU2Vjb25kcyA9IHRoaXMuZ2V0Rm9ybWF0dGVkRGF0ZSh2YXJpYWJsZTEsIGZvcm1hdCk7XG4gICAgICAgICAgbGV0IFtob3VyLCBtaW5dID0gdmFyaWFibGUyLnNwbGl0KCc6JykubWFwKChlbDogYW55KSA9PiBwYXJzZUludChlbCkpO1xuICAgICAgICAgIGxldCBjb21wYXJlZFNlYyA9IGhvdXIgKiA2MCAqIDYwICsgbWluICogNjA7XG4gICAgICAgICAgaWYgKGN1cnJTZWNvbmRzID4gY29tcGFyZWRTZWMpIHtcbiAgICAgICAgICAgIHJldHVybiB0cnVlO1xuICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgICBicmVhaztcbiAgICAgIGNhc2UgRmlsdGVyVHlwZXMuQkVUV0VFTjpcbiAgICAgICAgaWYgKHR5cGUgPT0gRGF0YVR5cGUuREFURSkge1xuICAgICAgICAgIC8vRGF0ZSBUeXBlIHZhcmlhYmxlXG4gICAgICAgICAgbGV0IG9wZXJhbmQxID0gdGhpcy5nZXRGb3JtYXR0ZWREYXRlKHZhcmlhYmxlMSwgZm9ybWF0KTtcbiAgICAgICAgICBsZXQgb3BlcmFuZDIgPSBuZXcgRGF0ZSh2YXJpYWJsZTJbMF0pO1xuICAgICAgICAgIGxldCBvcGVyYW5kMyA9IG5ldyBEYXRlKHZhcmlhYmxlMlsxXSk7XG4gICAgICAgICAgaWYgKG9wZXJhbmQxID49IG9wZXJhbmQyICYmIG9wZXJhbmQxIDwgb3BlcmFuZDMpIHtcbiAgICAgICAgICAgIHJldHVybiB0cnVlO1xuICAgICAgICAgIH1cbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAvL1RpbWUgVHlwZSB2YXJpYWJsZVxuICAgICAgICAgIGxldCBjdXJyU2Vjb25kcyA9IHRoaXMuZ2V0Rm9ybWF0dGVkRGF0ZSh2YXJpYWJsZTEsIGZvcm1hdCk7XG4gICAgICAgICAgbGV0IFtob3VyLCBtaW5dID0gdmFyaWFibGUyWzBdXG4gICAgICAgICAgICAuc3BsaXQoJzonKVxuICAgICAgICAgICAgLm1hcCgoZWw6IGFueSkgPT4gcGFyc2VJbnQoZWwpKTtcbiAgICAgICAgICBsZXQgW2VuZGhvdXIsIGVuZG1pbl0gPSB2YXJpYWJsZTJbMV1cbiAgICAgICAgICAgIC5zcGxpdCgnOicpXG4gICAgICAgICAgICAubWFwKChlbDogYW55KSA9PiBwYXJzZUludChlbCkpO1xuICAgICAgICAgIGxldCBjb21wYXJlZFNlYyA9IGhvdXIgKiA2MCAqIDYwICsgbWluICogNjA7XG4gICAgICAgICAgbGV0IGVuZENvbXBhcmVkU2VjID0gZW5kaG91ciAqIDYwICogNjAgKyBlbmRtaW4gKiA2MDtcbiAgICAgICAgICBpZiAoY3VyclNlY29uZHMgPj0gY29tcGFyZWRTZWMgJiYgY3VyclNlY29uZHMgPCBlbmRDb21wYXJlZFNlYykge1xuICAgICAgICAgICAgcmV0dXJuIHRydWU7XG4gICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICAgIGJyZWFrO1xuICAgIH1cbiAgICByZXR1cm4gZmFsc2U7XG4gIH1cblxuICBwcml2YXRlIHNvcnRHcmFwaChlOiBhbnkpIHtcbiAgICBjb25zdCB0ZW1wQXJyID0gZS50YXJnZXQuaWQuc3BsaXQoJ0AnKTtcbiAgICBjb25zdCBncmFwaElkID0gdGVtcEFyclt0ZW1wQXJyLmxlbmd0aCAtIDFdO1xuICAgIGlmICh0aGlzLmNoYXJ0c1tncmFwaElkXS5vcmRlciA8IDEpIHtcbiAgICAgIHRoaXMuY2hhcnRzW2dyYXBoSWRdLm9yZGVyICs9IDE7XG4gICAgfSBlbHNlIHtcbiAgICAgIHRoaXMuY2hhcnRzW2dyYXBoSWRdLm9yZGVyID0gLTE7XG4gICAgfVxuICAgIGlmICh0aGlzLmNoYXJ0c1tncmFwaElkXS5jdXJyTGV2ZWwgIT0gMCkge1xuICAgICAgdGhpcy5jaGFydHNbZ3JhcGhJZF0uZ3JhcGhEYXRhID0gdGhpcy5jaGFydHNbZ3JhcGhJZF0ucHJldkxldmVsRGF0YVswXTtcbiAgICB9XG4gICAgdGhpcy5jaGFydHNbZ3JhcGhJZF0uY3VyckxldmVsID0gMDtcbiAgICBsZXQgY2hhcnRPcHRpb25zOiBhbnkgPSB0aGlzLmNyZWF0ZUNoYXJ0RGF0YShncmFwaElkLCAwKTtcbiAgICB0aGlzLmhpZ2hjaGFydHMuY2hhcnQoZ3JhcGhJZCwgY2hhcnRPcHRpb25zKTtcbiAgICB0aGlzLmFkZEFjdGlvbkJ0bihncmFwaElkKTtcbiAgfVxuXG4gIHByaXZhdGUgZG93bmxvYWRHcmFwaERhdGEoZTogYW55LCBkYXRhOiBhbnksIGxhc3RMZXZlbENvbDogYW55KXtcbiAgICB0aGlzLmRhdGFTZXJ2aWNlLnNldE1vZGFsRGF0YSh7XG4gICAgICBjb2xUb1ZpZXc6IGxhc3RMZXZlbENvbCxcbiAgICAgIHJlZkRhdGE6IGRhdGFcbiAgICB9KTtcbiAgICBsZXQgbW9kYWxPcHRpb25zID0ge1xuICAgICAgcGFuZWxDbGFzczogJ2RhdGFQb3B1cC1tb2RhbCcsXG4gICAgICBiYWNrZHJvcENsYXNzOiAnbW9kYWwtYmFja2Ryb3AnLFxuICAgIH07XG4gICAgdGhpcy5kaWFsb2cub3BlbihEYXRhUG9wdXBDb21wb25lbnQsIG1vZGFsT3B0aW9ucyk7XG4gIH1cblxuICBwcml2YXRlIGFkZEFjdGlvbkJ0bihncmFwaElkOiBzdHJpbmcpIHtcbiAgICBsZXQgX3NlbGYgPSB0aGlzO1xuICAgIGNvbnN0IGRpdiA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ2RpdicpO1xuICAgIGRpdi5zZXRBdHRyaWJ1dGUoJ3N0eWxlJywgdGhpcy5kaXZTdHlsZXMpO1xuICAgIGRpdi5zZXRBdHRyaWJ1dGUoXCJpZFwiLCBcImdyYXBoLW9wdGlvbnMtXCIgKyBncmFwaElkKTtcbiAgICBjb25zdCBzb3J0SWNvbiA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ2knKTtcbiAgICBzb3J0SWNvbi5zZXRBdHRyaWJ1dGUoJ2lkJywgJ3NvcnRAJyArIGdyYXBoSWQpO1xuICAgIHNvcnRJY29uLnNldEF0dHJpYnV0ZSgnc3R5bGUnLCB0aGlzLmljb25TdHlsZXMpO1xuICAgIGlmICh0aGlzLmNoYXJ0c1tncmFwaElkXS5vcmRlciA9PSAxKSB7XG4gICAgICBzb3J0SWNvbi5zZXRBdHRyaWJ1dGUoJ2NsYXNzJywgJ2ZhIGZhLXNvcnQtYW1vdW50LWRlc2MnKTtcbiAgICB9IGVsc2UgaWYgKHRoaXMuY2hhcnRzW2dyYXBoSWRdLm9yZGVyID09IC0xKSB7XG4gICAgICBzb3J0SWNvbi5zZXRBdHRyaWJ1dGUoJ2NsYXNzJywgJ2ZhIGZhLXNvcnQtYW1vdW50LWFzYycpO1xuICAgIH0gZWxzZSB7XG4gICAgICBzb3J0SWNvbi5zZXRBdHRyaWJ1dGUoJ2NsYXNzJywgJ2ZhIGZhLXNvcnQnKTtcbiAgICB9XG4gICAgY29uc3QgZG93bmxvYWRJY29uID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudChcImlcIik7XG4gICAgZG93bmxvYWRJY29uLnNldEF0dHJpYnV0ZSgnaWQnLCAnZG93bmxvYWRAJyArIGdyYXBoSWQpO1xuICAgIGRvd25sb2FkSWNvbi5zZXRBdHRyaWJ1dGUoJ3N0eWxlJywgdGhpcy5pY29uU3R5bGVzKTtcbiAgICBkb3dubG9hZEljb24uc2V0QXR0cmlidXRlKCdjbGFzcycsICdmYSBmYS1kb3dubG9hZCcpXG5cbiAgICBkaXYuYXBwZW5kQ2hpbGQoZG93bmxvYWRJY29uKTtcbiAgICBkaXYuYXBwZW5kQ2hpbGQoc29ydEljb24pO1xuICAgIC8vIGlmICh0aGlzLmNoYXJ0c1tncmFwaElkXS5yb3dzWzBdID09ICcqKipMQUJFTCoqKicpIHtcbiAgICAvLyAgIGNvbnN0IGhvbWVJY29uID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnaWNvbicpO1xuICAgIC8vICAgaG9tZUljb24uc2V0QXR0cmlidXRlKCdzdHlsZScsIHRoaXMuaWNvblN0eWxlcyk7XG4gICAgLy8gICBob21lSWNvbi5zZXRBdHRyaWJ1dGUoJ2lkJywgJ2hvbWUtbGFiZWwtJyArIGdyYXBoSWQpO1xuICAgIC8vICAgaG9tZUljb24uc2V0QXR0cmlidXRlKCdjbGFzcycsICdmYSBmYS1ob21lJyk7XG4gICAgLy8gICBkaXYuYXBwZW5kQ2hpbGQoaG9tZUljb24pO1xuICAgIC8vICAgc2V0VGltZW91dCgoKSA9PiB7XG4gICAgLy8gICAgIGRvY3VtZW50XG4gICAgLy8gICAgICAgLnF1ZXJ5U2VsZWN0b3IoJyNob21lLWxhYmVsLScgKyBncmFwaElkKSFcbiAgICAvLyAgICAgICAuYWRkRXZlbnRMaXN0ZW5lcignY2xpY2snLCBmdW5jdGlvbiAoKSB7XG4gICAgLy8gICAgICAgICBfc2VsZi5idWlsZChcbiAgICAvLyAgICAgICAgICAgV2lkZ2V0VHlwZS5HUkFQSCxcbiAgICAvLyAgICAgICAgICAgT2JqZWN0LmFzc2lnbihPYmplY3QuYXNzaWduKHt9LCBfc2VsZi5jaGFydHNbZ3JhcGhJZF0pLCB7XG4gICAgLy8gICAgICAgICAgICAgZ3JhcGhEYXRhOiBfc2VsZi5jaGFydHNbZ3JhcGhJZF0ucHJldkxldmVsRGF0YVswXSxcbiAgICAvLyAgICAgICAgICAgfSlcbiAgICAvLyAgICAgICAgICk7XG4gICAgLy8gICAgICAgfSk7XG4gICAgLy8gICB9LCA1MDApO1xuICAgIC8vIH1cbiAgICBkb2N1bWVudC5xdWVyeVNlbGVjdG9yKCcjJyArIGdyYXBoSWQpIS5hcHBlbmRDaGlsZChkaXYpO1xuICAgIHRoaXMubWFuYWdlQnJlYWRDcnVtYihncmFwaElkLCB0aGlzKTtcbiAgICBzb3J0SWNvbi5hZGRFdmVudExpc3RlbmVyKCdjbGljaycsIGZ1bmN0aW9uIChlKSB7XG4gICAgICBfc2VsZi5zb3J0R3JhcGgoZSk7XG4gICAgfSk7XG4gICAgZG93bmxvYWRJY29uLmFkZEV2ZW50TGlzdGVuZXIoJ2NsaWNrJywgZnVuY3Rpb24gKGU6IGFueSkge1xuICAgICAgY29uc3QgdGVtcEFyciA9IGUudGFyZ2V0LmlkLnNwbGl0KCdAJyk7XG4gICAgICBjb25zdCBncmFwaElkID0gdGVtcEFyclt0ZW1wQXJyLmxlbmd0aCAtIDFdO1xuICAgICAgX3NlbGYuZG93bmxvYWRHcmFwaERhdGEoZSwgIE9iamVjdC52YWx1ZXMoX3NlbGYuY2hhcnRzW2dyYXBoSWRdLmdyYXBoRGF0YSkuZmxhdCgpLF9zZWxmLmNoYXJ0c1tncmFwaElkXS5sYXN0TGV2ZWxDb2x1bW5zKTtcbiAgICB9KTtcbiAgfVxuXG4gIHByaXZhdGUgYXBwbHlBZ2dyZWdhdGlvbihcbiAgICBhbGxEYXRhOiBhbnksXG4gICAgeUluZGV4OiBudW1iZXIsXG4gICAgYWdncmVhZ2F0aW9uczogQWdncmVnYXRpb25GdW5jdGlvbltdXG4gICkge1xuICAgIGxldCByZXN1bHQgPSAwO1xuICAgIHN3aXRjaCAoYWdncmVhZ2F0aW9uc1t5SW5kZXhdLmFnZ3JlZ2F0aW9uRnVuY3Rpb25zKSB7XG4gICAgICBjYXNlICdTVU0nIC8qIFNVTSAqLzpcbiAgICAgICAgcmVzdWx0ID0gbG9kYXNoLnN1bShhbGxEYXRhLm1hcChOdW1iZXIpKTtcbiAgICAgICAgYnJlYWs7XG4gICAgICBjYXNlICdDT1VOVF9VTklRVUUnIC8qIENPVU5UX1VOSVFVRSAqLzpcbiAgICAgICAgcmVzdWx0ID0gbG9kYXNoLnVuaXEoYWxsRGF0YSkubGVuZ3RoO1xuICAgICAgICBicmVhaztcbiAgICAgIGNhc2UgJ0NPVU5UJyAvKiBDT1VOVCAqLzpcbiAgICAgICAgcmVzdWx0ID0gYWxsRGF0YS5sZW5ndGg7XG4gICAgICAgIGJyZWFrO1xuICAgICAgY2FzZSAnTUFYSU1VTScgLyogTUFYSU1VTSAqLzpcbiAgICAgICAgcmVzdWx0ID0gbG9kYXNoLm1heChhbGxEYXRhLm1hcChOdW1iZXIpKSA/PyAwO1xuICAgICAgICBicmVhaztcbiAgICAgIGNhc2UgJ01JTklNVU0nIC8qIE1JTklNVU0gKi86XG4gICAgICAgIHJlc3VsdCA9IGxvZGFzaC5taW4oYWxsRGF0YS5tYXAoTnVtYmVyKSkgPz8gMDtcbiAgICAgICAgYnJlYWs7XG4gICAgICBjYXNlICdBVkVSQUdFJyAvKiBBVkVSQUdFICovOlxuICAgICAgICByZXN1bHQgPSBsb2Rhc2gubWVhbihhbGxEYXRhLm1hcChOdW1iZXIpKTtcbiAgICAgICAgYnJlYWs7XG4gICAgfVxuICAgIHJldHVybiByZXN1bHQ7XG4gIH1cblxuICBwcml2YXRlIGFwcGx5WWZpbHRlcihkOiBhbnksIHlJbmRleDogbnVtYmVyLCBncmFwaElkOiBzdHJpbmcpIHtcbiAgICBpZiAodGhpcy5jaGFydHNbZ3JhcGhJZF0uZmlsdGVyLnlBeGlzLmxlbmd0aCA+IDApIHtcbiAgICAgIGNvbnN0IGZpbHRlciA9IHRoaXMuY2hhcnRzW2dyYXBoSWRdLmZpbHRlci55QXhpcy5maWx0ZXIoXG4gICAgICAgICh5KSA9PiB0aGlzLmNoYXJ0c1tncmFwaElkXS5jb2x1bW5zW3lJbmRleF0gPT0geS52YXJpYWJsZU5hbWVcbiAgICAgICk7XG4gICAgICBpZiAoZmlsdGVyLmxlbmd0aCA+IDApIHtcbiAgICAgICAgc3dpdGNoIChmaWx0ZXJbMF0uZmlsdGVyVHlwZSkge1xuICAgICAgICAgIGNhc2UgRmlsdGVyVHlwZXMuR1JFQVRFUl9USEFOOlxuICAgICAgICAgICAgaWYgKGQueSA8IGZpbHRlclswXS52YWx1ZXNbMF0pIHtcbiAgICAgICAgICAgICAgZCA9IG51bGw7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBicmVhaztcbiAgICAgICAgICBjYXNlICc8JzpcbiAgICAgICAgICAgIGlmIChkLnkgPiBmaWx0ZXJbMF0udmFsdWVzWzBdKSB7XG4gICAgICAgICAgICAgIGQgPSBudWxsO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgY2FzZSAnPD0nOlxuICAgICAgICAgICAgaWYgKCEoZC55IDw9IGZpbHRlclswXS52YWx1ZXNbMF0pKSB7XG4gICAgICAgICAgICAgIGQgPSBudWxsO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgY2FzZSAnPj0nOlxuICAgICAgICAgICAgaWYgKCEoZC55ID49IGZpbHRlclswXS52YWx1ZXNbMF0pKSB7XG4gICAgICAgICAgICAgIGQgPSBudWxsO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgY2FzZSAnPT0nOlxuICAgICAgICAgICAgaWYgKGQueSAhPSBmaWx0ZXJbMF0udmFsdWVzWzBdKSB7XG4gICAgICAgICAgICAgIGQgPSBudWxsO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgY2FzZSAnIT0nOlxuICAgICAgICAgICAgaWYgKGQueSA9PSBmaWx0ZXJbMF0udmFsdWVzWzBdKSB7XG4gICAgICAgICAgICAgIGQgPSBudWxsO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgY2FzZSAnYmV0JzpcbiAgICAgICAgICAgIGlmICghKGQueSA+PSBmaWx0ZXJbMF0udmFsdWVzWzBdICYmIGQueSA8IGZpbHRlclswXS52YWx1ZXNbMV0pKSB7XG4gICAgICAgICAgICAgIGQgPSBudWxsO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICB9XG4gICAgcmV0dXJuIGQ7XG4gIH1cblxuICBwcml2YXRlIGFwcGx5WGZpbHRlcihcbiAgICBlbDogYW55LFxuICAgIGZpbHRlcnM6IEZpbHRlcnMsXG4gICAgcm93czogc3RyaW5nW10sXG4gICAgY29sdW1uczogc3RyaW5nW10sXG4gICAgY3VyckxldmVsOiBudW1iZXJcbiAgKSB7XG4gICAgaWYgKGZpbHRlcnMueEF4aXMubGVuZ3RoID4gMCkge1xuICAgICAgbGV0IGlzVmFsaWQgPSB0cnVlO1xuICAgICAgY29uc3QgZmlsdGVyID0gZmlsdGVycy54QXhpcy5maWx0ZXIoXG4gICAgICAgIChmKSA9PiBmLnZhcmlhYmxlTmFtZSA9PSByb3dzW2N1cnJMZXZlbF1cbiAgICAgICk7XG4gICAgICBpZiAoZmlsdGVyLmxlbmd0aCA+IDApIHtcbiAgICAgICAgc3dpdGNoIChmaWx0ZXJbMF0uZmlsdGVyVHlwZSkge1xuICAgICAgICAgIGNhc2UgRmlsdGVyVHlwZXMuSU46XG4gICAgICAgICAgICBpZiAoZmlsdGVyWzBdLnZhbHVlcy5pbmRleE9mKGVsLmtleS50b1N0cmluZygpKSA9PSAtMSkge1xuICAgICAgICAgICAgICBpc1ZhbGlkID0gZmFsc2U7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBicmVhaztcbiAgICAgICAgICBjYXNlIEZpbHRlclR5cGVzLk5PVF9JTjpcbiAgICAgICAgICAgIGlmIChmaWx0ZXJbMF0udmFsdWVzLmluZGV4T2YoZWwua2V5LnRvU3RyaW5nKCkpICE9IC0xKSB7XG4gICAgICAgICAgICAgIGlzVmFsaWQgPSBmYWxzZTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgIGNhc2UgRmlsdGVyVHlwZXMuR1JFQVRFUl9USEFOOlxuICAgICAgICAgICAgaWYgKGVsLmtleSA8PSBmaWx0ZXJbMF0udmFsdWVzWzBdKSB7XG4gICAgICAgICAgICAgIGlzVmFsaWQgPSBmYWxzZTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgIGNhc2UgRmlsdGVyVHlwZXMuTEVTU19USEFOOlxuICAgICAgICAgICAgaWYgKGVsLmtleSA+PSBmaWx0ZXJbMF0udmFsdWVzWzBdKSB7XG4gICAgICAgICAgICAgIGlzVmFsaWQgPSBmYWxzZTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgIGNhc2UgRmlsdGVyVHlwZXMuTEVTU19USEFOX0VRVUFMOlxuICAgICAgICAgICAgaWYgKGVsLmtleSA+IGZpbHRlclswXS52YWx1ZXNbMF0pIHtcbiAgICAgICAgICAgICAgaXNWYWxpZCA9IGZhbHNlO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgY2FzZSBGaWx0ZXJUeXBlcy5HUkVBVEVSX1RIQU5fRVFVQUw6XG4gICAgICAgICAgICBpZiAoZWwua2V5IDwgZmlsdGVyWzBdLnZhbHVlc1swXSkge1xuICAgICAgICAgICAgICBpc1ZhbGlkID0gZmFsc2U7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBicmVhaztcbiAgICAgICAgICBjYXNlIEZpbHRlclR5cGVzLkVRVUFMOlxuICAgICAgICAgICAgaWYgKGVsLmtleSAhPSBmaWx0ZXJbMF0udmFsdWVzWzBdKSB7XG4gICAgICAgICAgICAgIGlzVmFsaWQgPSBmYWxzZTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgIGNhc2UgRmlsdGVyVHlwZXMuTk9UX0VRVUFMOlxuICAgICAgICAgICAgaWYgKGVsLmtleSA9PSBmaWx0ZXJbMF0udmFsdWVzWzBdKSB7XG4gICAgICAgICAgICAgIGlzVmFsaWQgPSBmYWxzZTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgIGNhc2UgRmlsdGVyVHlwZXMuQkVUV0VFTl9SQU5HRTpcbiAgICAgICAgICAgIGlmIChlbC5rZXkgPCBmaWx0ZXJbMF0udmFsdWVzWzBdICYmIGVsLmtleSA+PSBmaWx0ZXJbMF0udmFsdWVzWzFdKSB7XG4gICAgICAgICAgICAgIGlzVmFsaWQgPSBmYWxzZTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgIGNhc2UgRmlsdGVyVHlwZXMuQkVGT1JFOlxuICAgICAgICAgICAgaWYgKGZpbHRlclswXS52YXJpYWJsZVR5cGUgPT0gRGF0YVR5cGUuREFURSkge1xuICAgICAgICAgICAgICBsZXQgb3BlcmFuZDEgPSB0aGlzLmdldEZvcm1hdHRlZERhdGUoZWwua2V5LCBmaWx0ZXJbMF0uZm9ybWF0KTtcbiAgICAgICAgICAgICAgbGV0IG9wZXJhbmQyID0gbmV3IERhdGUoZmlsdGVyWzBdLnZhbHVlc1swXSk7XG4gICAgICAgICAgICAgIGlmIChvcGVyYW5kMSA+IG9wZXJhbmQyKSB7XG4gICAgICAgICAgICAgICAgaXNWYWxpZCA9IGZhbHNlO1xuICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICBsZXQgY3VyclNlY29uZHMgPSB0aGlzLmdldEZvcm1hdHRlZERhdGUoZWwua2V5LCBmaWx0ZXJbMF0uZm9ybWF0KTtcbiAgICAgICAgICAgICAgbGV0IFtob3VyLCBtaW5dID0gZmlsdGVyWzBdLnZhbHVlc1swXVxuICAgICAgICAgICAgICAgIC5zcGxpdCgnOicpXG4gICAgICAgICAgICAgICAgLm1hcCgoZWw6IGFueSkgPT4gcGFyc2VJbnQoZWwpKTtcbiAgICAgICAgICAgICAgbGV0IGNvbXBhcmVkU2VjID0gaG91ciAqIDYwICogNjAgKyBtaW4gKiA2MDtcbiAgICAgICAgICAgICAgaWYgKGN1cnJTZWNvbmRzID4gY29tcGFyZWRTZWMpIHtcbiAgICAgICAgICAgICAgICBpc1ZhbGlkID0gZmFsc2U7XG4gICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgIGNhc2UgRmlsdGVyVHlwZXMuQUZURVI6XG4gICAgICAgICAgICBpZiAoZmlsdGVyWzBdLnZhcmlhYmxlVHlwZSA9PSBEYXRhVHlwZS5EQVRFKSB7XG4gICAgICAgICAgICAgIGxldCBvcGVyYW5kMSA9IHRoaXMuZ2V0Rm9ybWF0dGVkRGF0ZShlbC5rZXksIGZpbHRlclswXS5mb3JtYXQpO1xuICAgICAgICAgICAgICBsZXQgb3BlcmFuZDIgPSBuZXcgRGF0ZShmaWx0ZXJbMF0udmFsdWVzWzBdKTtcbiAgICAgICAgICAgICAgaWYgKG9wZXJhbmQxIDwgb3BlcmFuZDIpIHtcbiAgICAgICAgICAgICAgICBpc1ZhbGlkID0gZmFsc2U7XG4gICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgIGxldCBjdXJyU2Vjb25kcyA9IHRoaXMuZ2V0Rm9ybWF0dGVkRGF0ZShlbC5rZXksIGZpbHRlclswXS5mb3JtYXQpO1xuICAgICAgICAgICAgICBsZXQgW2hvdXIsIG1pbl0gPSBmaWx0ZXJbMF0udmFsdWVzWzBdXG4gICAgICAgICAgICAgICAgLnNwbGl0KCc6JylcbiAgICAgICAgICAgICAgICAubWFwKChlbDogYW55KSA9PiBwYXJzZUludChlbCkpO1xuICAgICAgICAgICAgICBsZXQgY29tcGFyZWRTZWMgPSBob3VyICogNjAgKiA2MCArIG1pbiAqIDYwO1xuICAgICAgICAgICAgICBpZiAoY3VyclNlY29uZHMgPCBjb21wYXJlZFNlYykge1xuICAgICAgICAgICAgICAgIGlzVmFsaWQgPSBmYWxzZTtcbiAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgY2FzZSBGaWx0ZXJUeXBlcy5CRVRXRUVOOlxuICAgICAgICAgICAgaWYgKGZpbHRlclswXS52YXJpYWJsZVR5cGUgPT0gRGF0YVR5cGUuREFURSkge1xuICAgICAgICAgICAgICBsZXQgb3BlcmFuZDEgPSB0aGlzLmdldEZvcm1hdHRlZERhdGUoZWwua2V5LCBmaWx0ZXJbMF0uZm9ybWF0KTtcbiAgICAgICAgICAgICAgbGV0IG9wZXJhbmQyID0gbmV3IERhdGUoZmlsdGVyWzBdLnZhbHVlc1swXSk7XG4gICAgICAgICAgICAgIGxldCBvcGVyYW5kMyA9IG5ldyBEYXRlKGZpbHRlclswXS52YWx1ZXNbMV0pO1xuICAgICAgICAgICAgICBpZiAob3BlcmFuZDEgPCBvcGVyYW5kMiAmJiBvcGVyYW5kMSA+PSBvcGVyYW5kMykge1xuICAgICAgICAgICAgICAgIGlzVmFsaWQgPSBmYWxzZTtcbiAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgbGV0IGN1cnJTZWNvbmRzID0gdGhpcy5nZXRGb3JtYXR0ZWREYXRlKGVsLmtleSwgZmlsdGVyWzBdLmZvcm1hdCk7XG4gICAgICAgICAgICAgIGxldCBbaG91ciwgbWluXSA9IGZpbHRlclswXS52YWx1ZXNbMF1cbiAgICAgICAgICAgICAgICAuc3BsaXQoJzonKVxuICAgICAgICAgICAgICAgIC5tYXAoKGVsOiBhbnkpID0+IHBhcnNlSW50KGVsKSk7XG4gICAgICAgICAgICAgIGxldCBbZW5kaG91ciwgZW5kbWluXSA9IGZpbHRlclswXS52YWx1ZXNbMV1cbiAgICAgICAgICAgICAgICAuc3BsaXQoJzonKVxuICAgICAgICAgICAgICAgIC5tYXAoKGVsOiBhbnkpID0+IHBhcnNlSW50KGVsKSk7XG4gICAgICAgICAgICAgIGxldCBjb21wYXJlZFNlYyA9IGhvdXIgKiA2MCAqIDYwICsgbWluICogNjA7XG4gICAgICAgICAgICAgIGxldCBlbmRDb21wYXJlZFNlYyA9IGVuZGhvdXIgKiA2MCAqIDYwICsgZW5kbWluICogNjA7XG4gICAgICAgICAgICAgIGlmIChjdXJyU2Vjb25kcyA8IGNvbXBhcmVkU2VjICYmIGN1cnJTZWNvbmRzID49IGVuZENvbXBhcmVkU2VjKSB7XG4gICAgICAgICAgICAgICAgaXNWYWxpZCA9IGZhbHNlO1xuICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBicmVhaztcbiAgICAgICAgfVxuICAgICAgfVxuXG4gICAgICByZXR1cm4gaXNWYWxpZDtcbiAgICB9IGVsc2Uge1xuICAgICAgcmV0dXJuIHRydWVcbiAgICB9XG4gIH1cblxuICBwcml2YXRlIGdldERyaWxsRG93bkRhdGEoXG4gICAgc2VsS2V5OiBhbnksXG4gICAgZGF0YTogYW55LFxuICAgIGdyYXBoSWQ6IGFueSxcbiAgICBjb2xJZDogYW55ID0gbnVsbFxuICApIHtcbiAgICBsZXQgZ3JhcGhTZXJpZXM6IGFueSA9IFtdOyAvL1NlcmllcyBPYmplY3RcbiAgICBsb2Rhc2guZm9yRWFjaCh0aGlzLmNoYXJ0c1tncmFwaElkXS5jb2x1bW5zLCAoeTogYW55LCB5SW5kZXg6IGFueSkgPT4ge1xuICAgICAgaWYgKFxuICAgICAgICAodGhpcy5jaGFydHNbZ3JhcGhJZF0uY29sVG9TaG93ID09ICcnIHx8XG4gICAgICAgICAgeSA9PSB0aGlzLmNoYXJ0c1tncmFwaElkXS5jb2xUb1Nob3cpXG4gICAgICApIHtcbiAgICAgICAgY29uc3QgZnVuYyA9XG4gICAgICAgICAgdGhpcy5jaGFydHNbZ3JhcGhJZF0uYWdncmVnYXRpb25GdW5jdGlvbnNbeUluZGV4XVxuICAgICAgICAgICAgLmFnZ3JlZ2F0aW9uRnVuY3Rpb25zO1xuICAgICAgICBjb25zdCBzZXJpZXNEYXRhOiBhbnkgPSBbXTsgLy9kYXRhIG9iamVjdCBmb3Igc2VyaWVzXG4gICAgICAgIGxvZGFzaC5mb3JFYWNoKE9iamVjdC5rZXlzKGRhdGEpLCAoZWw6IGFueSkgPT4ge1xuICAgICAgICAgIC8vRmlsdGVyIEFjY29yZGluZyB0byB4LWF4aXNcbiAgICAgICAgICBsZXQgdmFsaWRLZXkgPSB0aGlzLmFwcGx5WGZpbHRlcihcbiAgICAgICAgICAgICAge1xuICAgICAgICAgICAgICAgIGtleTogZWwsXG4gICAgICAgICAgICAgICAgZGF0YTogZGF0YVtlbF0sXG4gICAgICAgICAgICAgIH0sXG4gICAgICAgICAgICAgIHRoaXMuY2hhcnRzW2dyYXBoSWRdLmZpbHRlcixcbiAgICAgICAgICAgICAgdGhpcy5jaGFydHNbZ3JhcGhJZF0ucm93cyxcbiAgICAgICAgICAgICAgdGhpcy5jaGFydHNbZ3JhcGhJZF0uY29sdW1ucyxcbiAgICAgICAgICAgICAgdGhpcy5jaGFydHNbZ3JhcGhJZF0uY3VyckxldmVsXG4gICAgICAgICAgICApO1xuICAgICAgICAgIGRhdGFbZWxdID0gdGhpcy5hcHBseURhdGFGaWx0ZXIoZGF0YVtlbF0sdGhpcy5jaGFydHNbZ3JhcGhJZF0uZmlsdGVyLHRoaXMuY2hhcnRzW2dyYXBoSWRdLmNvbHVtbnMsIGdyYXBoSWQpW3ldO1xuICAgICAgICAgIGlmKHZhbGlkS2V5ICYmIGRhdGFbZWxdICE9IG51bGwpe1xuXG4gICAgICAgICAgICAvL0FkZCBDdXN0b20gVmFyaWFibGVcbiAgICAgICAgICAgIGRhdGFbZWxdID0gdGhpcy5hZGRDdXN0b21WYXJpYWJsZShcbiAgICAgICAgICAgICAgdGhpcy5jaGFydHNbZ3JhcGhJZF0uY3VzdG9tVmFyaWFibGUsXG4gICAgICAgICAgICAgIGRhdGFbZWxdLFxuICAgICAgICAgICAgICBmYWxzZSxcbiAgICAgICAgICAgICAgdGhpcy5jaGFydHNbZ3JhcGhJZF0uZGF0YUZvcm1hdCxcbiAgICAgICAgICAgICAgZmFsc2VcbiAgICAgICAgICAgICk7XG4gICAgICAgICAgICAvL0dldHRpbmcgRGF0YSBBcnJheSB0byBhZ2dyZWdhdGVcbiAgICAgICAgICAgIGxldCB2YXJpYWJsZVR5cGUgPSB0aGlzLmdldFZhcmlhYmxlVHlwZUJ5SGVhZGVyKHksIHRoaXMuY2hhcnRzW2dyYXBoSWRdLmRhdGFGb3JtYXQpO1xuICAgICAgICAgICAgbGV0IHR5cGUgPSBcInN0cmluZ1wiO1xuICAgICAgICAgICAgaWYodmFyaWFibGVUeXBlID09IG51bGwpe1xuICAgICAgICAgICAgICB0eXBlID0gdGhpcy5nZXRWYXJpYWJsZURhdGEoZGF0YVtlbF1bMF1beV0pWzBdO1xuICAgICAgICAgICAgfWVsc2V7XG4gICAgICAgICAgICAgIHR5cGUgPSB2YXJpYWJsZVR5cGUudHlwZTtcbiAgICAgICAgICAgIH1cbiAgXG4gICAgICAgICAgICBsZXQgZGF0YVRvVHJhdmVyc2UgPSBsb2Rhc2gubWFwKGRhdGFbZWxdLCAoZWxEYXRhKSA9PiB7XG4gICAgICAgICAgICAgIHJldHVybiB0eXBlICE9IFwibnVtYmVyXCIgPyBlbERhdGFbeV0gOiBwYXJzZUZsb2F0KGVsRGF0YVt5XSk7XG4gICAgICAgICAgICB9KTtcbiAgICAgICAgICAgIGRhdGFUb1RyYXZlcnNlID0gbG9kYXNoLndpdGhvdXQobG9kYXNoLndpdGhvdXQoZGF0YVRvVHJhdmVyc2UsIHVuZGVmaW5lZCksICcnKTtcbiAgICAgICAgICAgIGxldCBnZW5EYXRhID0ge1xuICAgICAgICAgICAgICBuYW1lOiBlbCxcbiAgICAgICAgICAgICAgZGF0YUxhYmVsczoge1xuICAgICAgICAgICAgICAgIHNoYWRvdzogZmFsc2UsXG4gICAgICAgICAgICAgICAgc3R5bGU6IHtcbiAgICAgICAgICAgICAgICAgIGNvbG9yOiAnYmxhY2snLFxuICAgICAgICAgICAgICAgICAgdGV4dERlY29yYXRpb246ICdub25lJyxcbiAgICAgICAgICAgICAgICAgIHRleHRTaGFkb3c6IGZhbHNlLFxuICBcbiAgICAgICAgICAgICAgICAgIHRleHRPdXRsaW5lOiAwLFxuICAgICAgICAgICAgICAgIH0sXG4gICAgICAgICAgICAgICAgY2xhc3NOYW1lOiAnZ3JhcGgtZGF0YS1sYWJlbCcsXG4gICAgICAgICAgICAgIH0sXG4gICAgICAgICAgICAgIGRyaWxsZG93bjogdHJ1ZSxcbiAgICAgICAgICAgICAgZ3JhcGhJZDogZ3JhcGhJZCxcbiAgICAgICAgICAgICAgY29sSW5kZXg6IHlJbmRleCxcbiAgICAgICAgICAgICAgbGV2ZWw6IHRoaXMuY2hhcnRzW2dyYXBoSWRdLmN1cnJMZXZlbCxcbiAgICAgICAgICAgICAgeTogcGFyc2VGbG9hdChcbiAgICAgICAgICAgICAgICAvLyBuZXcgRGVjaW1hbChcbiAgICAgICAgICAgICAgICAgIHRoaXMuY2hhcnRzW2dyYXBoSWRdLmFnZ3JlZ2F0aW9uRnVuY3Rpb25zW3lJbmRleF1cbiAgICAgICAgICAgICAgICAgICAgLmFnZ3JlZ2F0aW9uRnVuY3Rpb25zID09IEFnZ3JlZ2F0aW9uRnVuY3Rpb25zVHlwZS5OT19GVU5DVElPTlxuICAgICAgICAgICAgICAgICAgICA/IG5ldyBCaWdOdW1iZXIoXG4gICAgICAgICAgICAgICAgICAgICAgICBkYXRhVG9UcmF2ZXJzZS5sZW5ndGggPT0gMFxuICAgICAgICAgICAgICAgICAgICAgICAgICA/IDBcbiAgICAgICAgICAgICAgICAgICAgICAgICAgOiBsb2Rhc2gubWF4KGRhdGFUb1RyYXZlcnNlKVxuICAgICAgICAgICAgICAgICAgICAgICkudG9TdHJpbmcoKSAvL0dldHRpbmcgTWF4IFZhbHVlIG9mIERhdGEgQXJyXG4gICAgICAgICAgICAgICAgICAgIDogdGhpcy5hcHBseUFnZ3JlZ2F0aW9uKFxuICAgICAgICAgICAgICAgICAgICAgICAgZGF0YVRvVHJhdmVyc2UsXG4gICAgICAgICAgICAgICAgICAgICAgICB5SW5kZXgsXG4gICAgICAgICAgICAgICAgICAgICAgICB0aGlzLmNoYXJ0c1tncmFwaElkXS5hZ2dyZWdhdGlvbkZ1bmN0aW9uc1xuICAgICAgICAgICAgICAgICAgICAgIC8vICkgLy8gR2V0dGluZyBBZ2dyZWdhdGVkIFZhbHVlXG4gICAgICAgICAgICAgICAgKS50b1ByZWNpc2lvbigyKVxuICAgICAgICAgICAgICApLFxuICAgICAgICAgICAgfTtcbiAgICAgICAgICAgIC8vQXBwbHlpbmcgQWZ0ZXIgQWdncmVnYXRpb24gRmlsdGVyXG4gICAgICAgICAgICBsZXQgYWZ0ZXJZcmVzdWx0ID0gdGhpcy5hcHBseVlmaWx0ZXIoZ2VuRGF0YSwgeUluZGV4LCBncmFwaElkKTtcbiAgICAgICAgICAgIGlmIChhZnRlcllyZXN1bHQgIT0gbnVsbCkge1xuICAgICAgICAgICAgICBzZXJpZXNEYXRhLnB1c2goYWZ0ZXJZcmVzdWx0KTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICB9XG4gICAgICAgIH0pO1xuICAgICAgICAgZ3JhcGhTZXJpZXMucHVzaCh7XG4gICAgICAgICAgbmFtZTpcbiAgICAgICAgICAgIHNlbEtleSA9PSBudWxsIHx8IHRoaXMuY2hhcnRzW2dyYXBoSWRdLmNvbHVtbnMubGVuZ3RoID4gMVxuICAgICAgICAgICAgICA/IGZ1bmMgIT0gJ05PIEZVTkNUSU9OJ1xuICAgICAgICAgICAgICAgID8gZnVuYyArICcoJyArIHkgKyAnKSdcbiAgICAgICAgICAgICAgICA6IHlcbiAgICAgICAgICAgICAgOiBzZWxLZXksXG4gICAgICAgICAgY29sb3I6IHRoaXMuY2hhcnRzW2dyYXBoSWRdLmNvbG9yc1t5SW5kZXhdLFxuICAgICAgICAgIGdyYXBoSWQ6IGdyYXBoSWQsXG4gICAgICAgICAgY29sSW5kZXg6IHlJbmRleCxcbiAgICAgICAgICBsZXZlbDogdGhpcy5jaGFydHNbZ3JhcGhJZF0uY3VyckxldmVsLFxuICAgICAgICAgIHR5cGU6XG4gICAgICAgICAgICB0aGlzLmNoYXJ0c1tncmFwaElkXS5ncmFwaFR5cGVzW3lJbmRleF0gPT0gJ3N0YWNrZWQtYmFyJyB8fFxuICAgICAgICAgICAgdGhpcy5jaGFydHNbZ3JhcGhJZF0uZ3JhcGhUeXBlc1t5SW5kZXhdID09ICdzdGFja2VkLWJhciUnXG4gICAgICAgICAgICAgID8gJ2JhcidcbiAgICAgICAgICAgICAgOiB0aGlzLmNoYXJ0c1tncmFwaElkXS5ncmFwaFR5cGVzW3lJbmRleF0gPT0gJ3N0YWNrZWQtY29sdW1uJyB8fFxuICAgICAgICAgICAgICAgIHRoaXMuY2hhcnRzW2dyYXBoSWRdLmdyYXBoVHlwZXNbeUluZGV4XSA9PSAnc3RhY2tlZC1jb2x1bW4lJ1xuICAgICAgICAgICAgICA/ICdjb2x1bW4nXG4gICAgICAgICAgICAgIDogdGhpcy5jaGFydHNbZ3JhcGhJZF0uZ3JhcGhUeXBlc1t5SW5kZXhdLFxuICAgICAgICAgIGRhdGE6IHNlcmllc0RhdGEsXG4gICAgICAgIH0pO1xuICAgICAgfVxuICAgIH0pO1xuICAgIC8vQXBwbHkgU29ydGluZyBvdmVyIHNlcmllc1xuICAgIHJldHVybiB0aGlzLmFwcGx5U29ydChncmFwaElkLCBncmFwaFNlcmllcyk7XG4gIH1cblxuICAvL1RvIGJlIGNoZWNrZWRcbiAgcHJpdmF0ZSBhcHBseVNvcnQoZ3JhcGhJZDogc3RyaW5nLCBkYXRhOiBhbnkpIHtcbiAgICBpZiAoZGF0YSA9PSBudWxsKSB7XG4gICAgICByZXR1cm4gW107XG4gICAgfVxuICAgIGlmICh0aGlzLmNoYXJ0c1tncmFwaElkXS5vcmRlciA9PSAxKSB7XG4gICAgICAvL1NvcnQgRGF0YSBpbiBkZXNjZW5kaW5nIG9yZGVyXG4gICAgICByZXR1cm4gbG9kYXNoLm1hcChkYXRhLCAoZWwpID0+IHtcbiAgICAgICAgZWwuZGF0YSA9IGVsLmRhdGEuc29ydCgoZDE6IGFueSwgZDI6IGFueSkgPT4ge1xuICAgICAgICAgIGlmIChkMS55ID4gZDIueSkge1xuICAgICAgICAgICAgcmV0dXJuIC0xO1xuICAgICAgICAgIH1cbiAgICAgICAgICByZXR1cm4gMTtcbiAgICAgICAgfSk7XG4gICAgICAgIHJldHVybiBlbDtcbiAgICAgIH0pO1xuICAgIH0gZWxzZSBpZiAodGhpcy5jaGFydHNbZ3JhcGhJZF0ub3JkZXIgPT0gLTEpIHtcbiAgICAgIC8vU29ydCBEYXRhIGluIGFzY2VuZGluZyBvcmRlclxuICAgICAgcmV0dXJuIGxvZGFzaC5tYXAoZGF0YSwgKGVsKSA9PiB7XG4gICAgICAgIGVsLmRhdGEgPSBlbC5kYXRhLnNvcnQoKGQxOiBhbnksIGQyOiBhbnkpID0+IHtcbiAgICAgICAgICBpZiAoZDEueSA+IGQyLnkpIHtcbiAgICAgICAgICAgIHJldHVybiAxO1xuICAgICAgICAgIH1cbiAgICAgICAgICByZXR1cm4gLTE7XG4gICAgICAgIH0pO1xuICAgICAgICByZXR1cm4gZWw7XG4gICAgICB9KTtcbiAgICB9IGVsc2Uge1xuICAgICAgcmV0dXJuIGRhdGEubWFwKChlbDogYW55KSA9PiB7XG4gICAgICAgIGlmIChlbC5kYXRhLmxlbmd0aCA+IDApIHtcbiAgICAgICAgICBsZXQgdHlwZSA9IHRoaXMuZ2V0VmFyaWFibGVEYXRhKFxuICAgICAgICAgICAgZWwuZGF0YVswXVt0aGlzLmNoYXJ0c1tncmFwaElkXS5yb3dzWzBdXVxuICAgICAgICAgICk7XG4gICAgICAgICAgaWYgKHR5cGVbMF0gPT0gJ3N0cmluZycgfHwgdHlwZVswXSA9PSAnbnVtYmVyJykge1xuICAgICAgICAgICAgZWwuZGF0YSA9IGVsLmRhdGEuc29ydCgoZDE6IGFueSwgZDI6IGFueSkgPT4ge1xuICAgICAgICAgICAgICBpZiAoZDEubmFtZSA+IGQyLm5hbWUpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gMTtcbiAgICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gLTE7XG4gICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH0pO1xuICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICBlbC5kYXRhID0gZWwuZGF0YS5zb3J0KChkMTogYW55LCBkMjogYW55KSA9PiB7XG4gICAgICAgICAgICAgIGlmIChuZXcgRGF0ZShkMS5uYW1lKS5nZXRUaW1lKCkgPiBuZXcgRGF0ZShkMi5uYW1lKS5nZXRUaW1lKCkpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gMTtcbiAgICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gLTE7XG4gICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH0pO1xuICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gZWw7XG4gICAgICB9KTtcbiAgICB9XG4gIH1cblxuICBwcml2YXRlIGdldFZhcmlhYmxlRGF0YShpbnB1dDogYW55KSB7XG4gICAgaWYgKHRoaXMudmFsaWRhdGVUaW1lKGlucHV0KSkge1xuICAgICAgbGV0IHR5cGUgPSBEYXRhVHlwZS5USU1FO1xuICAgICAgcmV0dXJuIFt0eXBlXTtcbiAgICB9IGVsc2UgaWYgKHRoaXMuY2hlY2tEYXRlKGlucHV0KSkge1xuICAgICAgbGV0IHR5cGUgPSBEYXRhVHlwZS5EQVRFO1xuICAgICAgcmV0dXJuIFt0eXBlXTtcbiAgICB9IGVsc2UgaWYgKHRoaXMudmFsaWRhdGVOdW1iZXIoaW5wdXQpKSB7XG4gICAgICBsZXQgdHlwZSA9IERhdGFUeXBlLk5VTUJFUjtcbiAgICAgIHJldHVybiBbdHlwZV07XG4gICAgfSBlbHNlIHtcbiAgICAgIGxldCB0eXBlID0gRGF0YVR5cGUuU1RSSU5HO1xuICAgICAgcmV0dXJuIFt0eXBlXTtcbiAgICB9XG4gIH1cblxuICBwcml2YXRlIGdldFZhcmlhYmxlVHlwZUJ5SGVhZGVyKGhlYWRlcjogYW55LCBmb3JtYXQ6IGFueSkge1xuICAgIGxldCBmb3JtYXRFeGlzdCA9IGZvcm1hdC5maWx0ZXIoXG4gICAgICAoZm9ybWF0OiBhbnkpID0+IGZvcm1hdC5uYW1lLnRvTG93ZXJDYXNlKCkgPT0gaGVhZGVyLnRvTG93ZXJDYXNlKClcbiAgICApO1xuICAgIGlmIChmb3JtYXRFeGlzdC5sZW5ndGggPiAwKSB7XG4gICAgICByZXR1cm4ge1xuICAgICAgICB0eXBlOiBmb3JtYXRFeGlzdFswXS50eXBlLFxuICAgICAgICBmb3JtYXQ6IGZvcm1hdEV4aXN0WzBdLmZvcm1hdCxcbiAgICAgIH07XG4gICAgfSBlbHNlIHtcbiAgICAgIHJldHVybiB7XG4gICAgICAgIHR5cGU6IERhdGFUeXBlLlNUUklORyxcbiAgICAgICAgZm9ybWF0OiAnJyxcbiAgICAgIH07XG4gICAgfVxuICB9XG5cbiAgcHJpdmF0ZSB2YWxpZGF0ZVRpbWUoaW5wdXQ6IGFueSkge1xuICAgIGxldCBwYXR0ZXJuMSA9IC9eKDFbMC0yXXwwP1sxLTldKTooWzAtNV0/WzAtOV0pOihbMC01XT9bMC05XSkgKOKXjz9bQVBdTSk/JC87XG4gICAgbGV0IHBhdHRlcm4yID0gL14oMVswLTJdfDA/WzEtOV0pOihbMC01XT9bMC05XSk6KFswLTVdP1swLTldKSAo4pePP1thcF1tKT8kLztcbiAgICBsZXQgcGF0dGVybjMgPSAvXigxWzAtMl18MD9bMS05XSk6KFswLTVdP1swLTldKSAo4pePP1tBUF1NKT8kLztcbiAgICBsZXQgcGF0dGVybjQgPSAvXigxWzAtMl18MD9bMS05XSk6KFswLTVdP1swLTldKSAo4pePP1thcF1tKT8kLztcbiAgICBsZXQgcGF0dGVybjUgPSAvXigyWzAtM118WzAxXT9bMC05XSk6KFswLTVdP1swLTldKTooWzAtNV0/WzAtOV0pJC87XG4gICAgbGV0IHBhdHRlcm42ID0gL14oMlswLTNdfFswMV0/WzAtOV0pOihbMC01XT9bMC05XSkkLztcblxuICAgIHJldHVybiAoXG4gICAgICBwYXR0ZXJuMS50ZXN0KGlucHV0KSB8fFxuICAgICAgcGF0dGVybjIudGVzdChpbnB1dCkgfHxcbiAgICAgIHBhdHRlcm4zLnRlc3QoaW5wdXQpIHx8XG4gICAgICBwYXR0ZXJuNC50ZXN0KGlucHV0KSB8fFxuICAgICAgcGF0dGVybjUudGVzdChpbnB1dCkgfHxcbiAgICAgIHBhdHRlcm42LnRlc3QoaW5wdXQpXG4gICAgKTtcbiAgfVxuXG4gIHByaXZhdGUgdmFsaWRhdGVOdW1iZXIoZTogYW55KSB7XG4gICAgY29uc3QgcGF0dGVybjIgPSAvXlstK10/WzAtOV0rXFwuWzAtOV0rJC87XG4gICAgY29uc3QgcGF0dGVybiA9IC9eWy0rXT9bMC05XSskLztcblxuICAgIHJldHVybiBwYXR0ZXJuLnRlc3QoZSkgfHwgcGF0dGVybjIudGVzdChlKTtcbiAgfVxuXG4gIHByaXZhdGUgY2hlY2tEYXRlKGlucHV0OiBhbnkpIHtcbiAgICBjb25zdCBwYXR0ZXJuID1cbiAgICAgIC9eKFswLTJdXFxkfFszXVswLTFdKVxcLShbMF1cXGR8WzFdWzAtMl0pXFwtKFsyXVswMV18WzFdWzYtOV0pXFxkezJ9KFxccyhbMC0xXVxcZHxbMl1bMC0zXSkoXFw6WzAtNV1cXGQpezEsMn0pPyQvO1xuICAgIHJldHVybiBwYXR0ZXJuLnRlc3QoaW5wdXQpO1xuICB9XG5cbiAgcHJpdmF0ZSBhZGRDdXN0b21WYXJpYWJsZShcbiAgICBjdXN0b21WYXJpYWJsZTogRGVyaXZlZFZhcmlhYmxlW10sXG4gICAgYWxsRGF0YTogYW55LFxuICAgIGFkZFNsYWI6IGJvb2xlYW4gPSBmYWxzZSxcbiAgICBkYXRhRm9ybWF0OiBEYXRhRm9ybWF0W10sXG4gICAgd2l0aG91dEFnZzogQm9vbGVhblxuICApIHtcbiAgICBsZXQgcmVzdWx0YW50RGF0YSA9IGFsbERhdGE7XG4gICAgaWYgKCFhZGRTbGFiKSB7XG4gICAgICBjdXN0b21WYXJpYWJsZSA9IGN1c3RvbVZhcmlhYmxlLmZpbHRlcigodmFyaWFibGUpID0+ICF2YXJpYWJsZS5pc19zbGFiKTtcbiAgICB9XG4gICAgbG9kYXNoLmZvckVhY2goY3VzdG9tVmFyaWFibGUsICh2YXJpYWJsZSwgaW5kZXgpID0+IHtcbiAgICAgICAgaWYgKHZhcmlhYmxlLmlzX2ZpbHRlcikge1xuICAgICAgICAgIC8vQ2hlY2sgdmFsaWRpdHkgb3ZlciBhbGwgZmlsdGVyc1xuICAgICAgICAgIGxvZGFzaC5mb3JFYWNoKHZhcmlhYmxlLmZpbHRlcnMsIChmaWx0ZXI6IERlcml2ZWRWYXJpYWJsZUZpbHRlcikgPT4ge1xuICAgICAgICAgICAgbGV0IHJlc2lkaW5nRGF0YTogYW55ID0gW107IC8vRGF0YSB3aGVyZSBmaWx0ZXIgaXMgbm90IGFwcGxpY2FibGVcbiAgICAgICAgICAgIGxldCBmaWx0ZXJlZERhdGE6IGFueSA9IGxvZGFzaC5jbG9uZURlZXAocmVzdWx0YW50RGF0YSk7IC8vRGF0YSB3aGVyZSBmaWx0ZXIgaXMgYXBwbGljYWJsZVxuICAgICAgICAgICAgbGV0IGRhdGFUb1RyYXZlcnNlOiBhbnkgPSBudWxsO1xuICAgICAgICAgICAgaWYoZmlsdGVyLmlzQ3VzdG9tVmFsdWUgfHwgIXdpdGhvdXRBZ2cpe1xuICAgICAgICAgICAgICBsb2Rhc2guZm9yRWFjaChcbiAgICAgICAgICAgICAgICBmaWx0ZXIuY29uZGl0aW9ucyxcbiAgICAgICAgICAgICAgICAoY29uZGl0aW9uOiBEZXJpdmVkVmFyaWFibGVGaWx0ZXJDb25kaXRpb24sIGkpID0+IHtcbiAgICAgICAgICAgICAgICAgIGxldCB2YXJpYWJsZUluZm8gOiBhbnkgPSBudWxsO1xuICAgICAgICAgICAgICAgICAgc3dpdGNoIChjb25kaXRpb24ub3BlcmF0b3IpIHtcbiAgICAgICAgICAgICAgICAgICAgY2FzZSBGaWx0ZXJUeXBlcy5JTjpcbiAgICAgICAgICAgICAgICAgICAgICBbZmlsdGVyZWREYXRhLCByZXNpZGluZ0RhdGFdID0gbG9kYXNoLnJlZHVjZShcbiAgICAgICAgICAgICAgICAgICAgICAgIGZpbHRlcmVkRGF0YSxcbiAgICAgICAgICAgICAgICAgICAgICAgIChyZXN1bHQ6IGFueSwgZWxEYXRhKSA9PiB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgIGlmICghT2JqZWN0LmtleXMoZWxEYXRhKS5pbmNsdWRlcyh2YXJpYWJsZS5uYW1lKSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGVsRGF0YVt2YXJpYWJsZS5uYW1lXSA9IDA7XG4gICAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgICAgICAgcmVzdWx0W1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGVsRGF0YVtjb25kaXRpb24udmFyaWFibGUubmFtZV0gIT0gbnVsbCAmJiBjb25kaXRpb24uY29tcGFyYXRpdmVWYXJpYWJsZXMuaW5jbHVkZXMoXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICBlbERhdGFbY29uZGl0aW9uLnZhcmlhYmxlLm5hbWVdLnRvU3RyaW5nKClcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICApXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICA/IDBcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIDogMVxuICAgICAgICAgICAgICAgICAgICAgICAgICBdLnB1c2goZWxEYXRhKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuIHJlc3VsdDtcbiAgICAgICAgICAgICAgICAgICAgICAgIH0sXG4gICAgICAgICAgICAgICAgICAgICAgICBbW10sIFtdXVxuICAgICAgICAgICAgICAgICAgICAgICk7XG4gICAgICAgICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICAgICAgICAgIGNhc2UgRmlsdGVyVHlwZXMuTk9UX0lOOlxuICAgICAgICAgICAgICAgICAgICAgIFtmaWx0ZXJlZERhdGEsIHJlc2lkaW5nRGF0YV0gPSBsb2Rhc2gucmVkdWNlKFxuICAgICAgICAgICAgICAgICAgICAgICAgZmlsdGVyZWREYXRhLFxuICAgICAgICAgICAgICAgICAgICAgICAgKHJlc3VsdDogYW55LCBlbERhdGEpID0+IHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgaWYgKCFPYmplY3Qua2V5cyhlbERhdGEpLmluY2x1ZGVzKHZhcmlhYmxlLm5hbWUpKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgZWxEYXRhW3ZhcmlhYmxlLm5hbWVdID0gMDtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgICAgICByZXN1bHRbXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgZWxEYXRhW2NvbmRpdGlvbi52YXJpYWJsZS5uYW1lXSAhPSBudWxsICYmICFjb25kaXRpb24uY29tcGFyYXRpdmVWYXJpYWJsZXMuaW5jbHVkZXMoXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICBlbERhdGFbY29uZGl0aW9uLnZhcmlhYmxlLm5hbWVdLnRvU3RyaW5nKClcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICApXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICA/IDBcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIDogMVxuICAgICAgICAgICAgICAgICAgICAgICAgICBdLnB1c2goZWxEYXRhKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuIHJlc3VsdDtcbiAgICAgICAgICAgICAgICAgICAgICAgIH0sXG4gICAgICAgICAgICAgICAgICAgICAgICBbW10sIFtdXVxuICAgICAgICAgICAgICAgICAgICAgICk7XG4gICAgICAgICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICAgICAgICAgIGNhc2UgRmlsdGVyVHlwZXMuTEVTU19USEFOOlxuICAgICAgICAgICAgICAgICAgICAgIFtmaWx0ZXJlZERhdGEsIHJlc2lkaW5nRGF0YV0gPSBsb2Rhc2gucmVkdWNlKFxuICAgICAgICAgICAgICAgICAgICAgICAgZmlsdGVyZWREYXRhLFxuICAgICAgICAgICAgICAgICAgICAgICAgKHJlc3VsdDogYW55LCBlbERhdGEpID0+IHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgaWYgKCFPYmplY3Qua2V5cyhlbERhdGEpLmluY2x1ZGVzKHZhcmlhYmxlLm5hbWUpKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgZWxEYXRhW3ZhcmlhYmxlLm5hbWVdID0gMDtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgICAgICByZXN1bHRbXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgZWxEYXRhW2NvbmRpdGlvbi52YXJpYWJsZS5uYW1lXSAhPSBudWxsICYmIGVsRGF0YVtjb25kaXRpb24udmFyaWFibGUubmFtZV0gPFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGNvbmRpdGlvbi5jb21wYXJhdGl2ZVZhcmlhYmxlc1swXVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgPyAwXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICA6IDFcbiAgICAgICAgICAgICAgICAgICAgICAgICAgXS5wdXNoKGVsRGF0YSk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybiByZXN1bHQ7XG4gICAgICAgICAgICAgICAgICAgICAgICB9LFxuICAgICAgICAgICAgICAgICAgICAgICAgW1tdLCBbXV1cbiAgICAgICAgICAgICAgICAgICAgICApO1xuICAgICAgICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgICAgICAgICBjYXNlIEZpbHRlclR5cGVzLkdSRUFURVJfVEhBTjpcbiAgICAgICAgICAgICAgICAgICAgICBbZmlsdGVyZWREYXRhLCByZXNpZGluZ0RhdGFdID0gbG9kYXNoLnJlZHVjZShcbiAgICAgICAgICAgICAgICAgICAgICAgIGZpbHRlcmVkRGF0YSxcbiAgICAgICAgICAgICAgICAgICAgICAgIChyZXN1bHQ6IGFueSwgZWxEYXRhKSA9PiB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgIGlmICghT2JqZWN0LmtleXMoZWxEYXRhKS5pbmNsdWRlcyh2YXJpYWJsZS5uYW1lKSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGVsRGF0YVt2YXJpYWJsZS5uYW1lXSA9IDA7XG4gICAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgICAgICAgcmVzdWx0W1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGVsRGF0YVtjb25kaXRpb24udmFyaWFibGUubmFtZV0gIT0gbnVsbCAmJiBlbERhdGFbY29uZGl0aW9uLnZhcmlhYmxlLm5hbWVdID5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBjb25kaXRpb24uY29tcGFyYXRpdmVWYXJpYWJsZXNbMF1cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgID8gMFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgOiAxXG4gICAgICAgICAgICAgICAgICAgICAgICAgIF0ucHVzaChlbERhdGEpO1xuICAgICAgICAgICAgICAgICAgICAgICAgICByZXR1cm4gcmVzdWx0O1xuICAgICAgICAgICAgICAgICAgICAgICAgfSxcbiAgICAgICAgICAgICAgICAgICAgICAgIFtbXSwgW11dXG4gICAgICAgICAgICAgICAgICAgICAgKTtcbiAgICAgICAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgICAgICAgICAgY2FzZSBGaWx0ZXJUeXBlcy5MRVNTX1RIQU5fRVFVQUw6XG4gICAgICAgICAgICAgICAgICAgICAgW2ZpbHRlcmVkRGF0YSwgcmVzaWRpbmdEYXRhXSA9IGxvZGFzaC5yZWR1Y2UoXG4gICAgICAgICAgICAgICAgICAgICAgICBmaWx0ZXJlZERhdGEsXG4gICAgICAgICAgICAgICAgICAgICAgICAocmVzdWx0OiBhbnksIGVsRGF0YSkgPT4ge1xuICAgICAgICAgICAgICAgICAgICAgICAgICBpZiAoIU9iamVjdC5rZXlzKGVsRGF0YSkuaW5jbHVkZXModmFyaWFibGUubmFtZSkpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBlbERhdGFbdmFyaWFibGUubmFtZV0gPSAwO1xuICAgICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgICAgIHJlc3VsdFtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBlbERhdGFbY29uZGl0aW9uLnZhcmlhYmxlLm5hbWVdICE9IG51bGwgJiYgZWxEYXRhW2NvbmRpdGlvbi52YXJpYWJsZS5uYW1lXSA8PVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGNvbmRpdGlvbi5jb21wYXJhdGl2ZVZhcmlhYmxlc1swXVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgPyAwXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICA6IDFcbiAgICAgICAgICAgICAgICAgICAgICAgICAgXS5wdXNoKGVsRGF0YSk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybiByZXN1bHQ7XG4gICAgICAgICAgICAgICAgICAgICAgICB9LFxuICAgICAgICAgICAgICAgICAgICAgICAgW1tdLCBbXV1cbiAgICAgICAgICAgICAgICAgICAgICApO1xuICAgICAgICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgICAgICAgICBjYXNlIEZpbHRlclR5cGVzLkdSRUFURVJfVEhBTl9FUVVBTDpcbiAgICAgICAgICAgICAgICAgICAgICBbZmlsdGVyZWREYXRhLCByZXNpZGluZ0RhdGFdID0gbG9kYXNoLnJlZHVjZShcbiAgICAgICAgICAgICAgICAgICAgICAgIGZpbHRlcmVkRGF0YSxcbiAgICAgICAgICAgICAgICAgICAgICAgIChyZXN1bHQ6IGFueSwgZWxEYXRhKSA9PiB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgIGlmICghT2JqZWN0LmtleXMoZWxEYXRhKS5pbmNsdWRlcyh2YXJpYWJsZS5uYW1lKSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGVsRGF0YVt2YXJpYWJsZS5uYW1lXSA9IDA7XG4gICAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgICAgICAgcmVzdWx0W1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGVsRGF0YVtjb25kaXRpb24udmFyaWFibGUubmFtZV0gIT0gbnVsbCAmJiBlbERhdGFbY29uZGl0aW9uLnZhcmlhYmxlLm5hbWVdID49XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgY29uZGl0aW9uLmNvbXBhcmF0aXZlVmFyaWFibGVzWzBdXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICA/IDBcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIDogMVxuICAgICAgICAgICAgICAgICAgICAgICAgICBdLnB1c2goZWxEYXRhKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuIHJlc3VsdDtcbiAgICAgICAgICAgICAgICAgICAgICAgIH0sXG4gICAgICAgICAgICAgICAgICAgICAgICBbW10sIFtdXVxuICAgICAgICAgICAgICAgICAgICAgICk7XG4gICAgICAgICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICAgICAgICAgIGNhc2UgRmlsdGVyVHlwZXMuRVFVQUw6XG4gICAgICAgICAgICAgICAgICAgICAgW2ZpbHRlcmVkRGF0YSwgcmVzaWRpbmdEYXRhXSA9IGxvZGFzaC5yZWR1Y2UoXG4gICAgICAgICAgICAgICAgICAgICAgICBmaWx0ZXJlZERhdGEsXG4gICAgICAgICAgICAgICAgICAgICAgICAocmVzdWx0OiBhbnksIGVsRGF0YSkgPT4ge1xuICAgICAgICAgICAgICAgICAgICAgICAgICBpZiAoIU9iamVjdC5rZXlzKGVsRGF0YSkuaW5jbHVkZXModmFyaWFibGUubmFtZSkpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBlbERhdGFbdmFyaWFibGUubmFtZV0gPSAwO1xuICAgICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgICAgIHJlc3VsdFtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBlbERhdGFbY29uZGl0aW9uLnZhcmlhYmxlLm5hbWVdICE9IG51bGwgJiYgZWxEYXRhW2NvbmRpdGlvbi52YXJpYWJsZS5uYW1lXSA9PVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGNvbmRpdGlvbi5jb21wYXJhdGl2ZVZhcmlhYmxlc1swXVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgPyAwXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICA6IDFcbiAgICAgICAgICAgICAgICAgICAgICAgICAgXS5wdXNoKGVsRGF0YSk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybiByZXN1bHQ7XG4gICAgICAgICAgICAgICAgICAgICAgICB9LFxuICAgICAgICAgICAgICAgICAgICAgICAgW1tdLCBbXV1cbiAgICAgICAgICAgICAgICAgICAgICApO1xuICAgICAgICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgICAgICAgICBjYXNlIEZpbHRlclR5cGVzLkJFVFdFRU5fUkFOR0U6XG4gICAgICAgICAgICAgICAgICAgICAgW2ZpbHRlcmVkRGF0YSwgcmVzaWRpbmdEYXRhXSA9IGxvZGFzaC5yZWR1Y2UoXG4gICAgICAgICAgICAgICAgICAgICAgICBmaWx0ZXJlZERhdGEsXG4gICAgICAgICAgICAgICAgICAgICAgICAocmVzdWx0OiBhbnksIGVsRGF0YSkgPT4ge1xuICAgICAgICAgICAgICAgICAgICAgICAgICBpZiAoIU9iamVjdC5rZXlzKGVsRGF0YSkuaW5jbHVkZXModmFyaWFibGUubmFtZSkpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBlbERhdGFbdmFyaWFibGUubmFtZV0gPSAwO1xuICAgICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgICAgIHJlc3VsdFtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBlbERhdGFbY29uZGl0aW9uLnZhcmlhYmxlLm5hbWVdICE9IG51bGwgJiYgZWxEYXRhW2NvbmRpdGlvbi52YXJpYWJsZS5uYW1lXSA+PVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgY29uZGl0aW9uLmNvbXBhcmF0aXZlVmFyaWFibGVzWzBdICYmXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgZWxEYXRhW2NvbmRpdGlvbi52YXJpYWJsZS5uYW1lXSA8XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICBjb25kaXRpb24uY29tcGFyYXRpdmVWYXJpYWJsZXNbMV1cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgID8gMFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgOiAxXG4gICAgICAgICAgICAgICAgICAgICAgICAgIF0ucHVzaChlbERhdGEpO1xuICAgICAgICAgICAgICAgICAgICAgICAgICByZXR1cm4gcmVzdWx0O1xuICAgICAgICAgICAgICAgICAgICAgICAgfSxcbiAgICAgICAgICAgICAgICAgICAgICAgIFtbXSwgW11dXG4gICAgICAgICAgICAgICAgICAgICAgKTtcbiAgICAgICAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgICAgICAgICAgY2FzZSBGaWx0ZXJUeXBlcy5OT1RfRVFVQUw6XG4gICAgICAgICAgICAgICAgICAgICAgW2ZpbHRlcmVkRGF0YSwgcmVzaWRpbmdEYXRhXSA9IGxvZGFzaC5yZWR1Y2UoXG4gICAgICAgICAgICAgICAgICAgICAgICBmaWx0ZXJlZERhdGEsXG4gICAgICAgICAgICAgICAgICAgICAgICAocmVzdWx0OiBhbnksIGVsRGF0YSkgPT4ge1xuICAgICAgICAgICAgICAgICAgICAgICAgICBpZiAoIU9iamVjdC5rZXlzKGVsRGF0YSkuaW5jbHVkZXModmFyaWFibGUubmFtZSkpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBlbERhdGFbdmFyaWFibGUubmFtZV0gPSAwO1xuICAgICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgICAgIHJlc3VsdFtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBlbERhdGFbY29uZGl0aW9uLnZhcmlhYmxlLm5hbWVdICE9IG51bGwgJiYgZWxEYXRhW2NvbmRpdGlvbi52YXJpYWJsZS5uYW1lXSAhPVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGNvbmRpdGlvbi5jb21wYXJhdGl2ZVZhcmlhYmxlc1swXVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgPyAwXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICA6IDFcbiAgICAgICAgICAgICAgICAgICAgICAgICAgXS5wdXNoKGVsRGF0YSk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybiByZXN1bHQ7XG4gICAgICAgICAgICAgICAgICAgICAgICB9LFxuICAgICAgICAgICAgICAgICAgICAgICAgW1tdLCBbXV1cbiAgICAgICAgICAgICAgICAgICAgICApO1xuICAgICAgICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgICAgICAgICBjYXNlIEZpbHRlclR5cGVzLkJFRk9SRTpcbiAgICAgICAgICAgICAgICAgICAgICB2YXJpYWJsZUluZm8gPSB0aGlzLmdldFZhcmlhYmxlVHlwZUJ5SGVhZGVyKFxuICAgICAgICAgICAgICAgICAgICAgICAgY29uZGl0aW9uLnZhcmlhYmxlLm5hbWUsXG4gICAgICAgICAgICAgICAgICAgICAgICBkYXRhRm9ybWF0XG4gICAgICAgICAgICAgICAgICAgICAgKTtcbiAgICAgICAgICAgICAgICAgICAgICBsb2Rhc2guZm9yRWFjaChmaWx0ZXJlZERhdGEsIChlbERhdGEpID0+IHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGxldCB2YXJpYWJsZVR5cGUgPSB2YXJpYWJsZUluZm8udHlwZTtcbiAgICAgICAgICAgICAgICAgICAgICAgIGlmICh2YXJpYWJsZVR5cGUgPT0gRGF0YVR5cGUuREFURSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICBpZiAoXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgdGhpcy5nZXRGb3JtYXR0ZWREYXRlKFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgZWxEYXRhW2NvbmRpdGlvbi52YXJpYWJsZS5uYW1lXSxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHZhcmlhYmxlSW5mby5mb3JtYXRcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICApLmdldFRpbWUoKSA8XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgbmV3IERhdGUoY29uZGl0aW9uLmNvbXBhcmF0aXZlVmFyaWFibGVzWzBdKS5nZXRUaW1lKClcbiAgICAgICAgICAgICAgICAgICAgICAgICAgKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgZmlsdGVyZWREYXRhLnB1c2goZWxEYXRhKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBpZiAoXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICBPYmplY3Qua2V5cyhlbERhdGEpLmluZGV4T2YodmFyaWFibGUubmFtZSkgPT0gLTFcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICApIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGVsRGF0YVt2YXJpYWJsZS5uYW1lXSA9IDA7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHJlc2lkaW5nRGF0YS5wdXNoKGVsRGF0YSk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgIGxldCBjdXJyU2Vjb25kcyA9IHRoaXMuZ2V0Rm9ybWF0dGVkRGF0ZShcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBlbERhdGFbY29uZGl0aW9uLnZhcmlhYmxlLm5hbWVdLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHZhcmlhYmxlSW5mby5mb3JtYXRcbiAgICAgICAgICAgICAgICAgICAgICAgICAgKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgbGV0IFtob3VyLCBtaW5dID0gY29uZGl0aW9uLmNvbXBhcmF0aXZlVmFyaWFibGVzWzBdXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgLnNwbGl0KCc6JylcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAubWFwKChlbDogYW55KSA9PiBwYXJzZUludChlbCkpO1xuICAgICAgICAgICAgICAgICAgICAgICAgICBsZXQgY29tcGFyZWRTZWMgPSBob3VyICogNjAgKiA2MCArIG1pbiAqIDYwO1xuICAgICAgICAgICAgICAgICAgICAgICAgICBpZiAoY3VyclNlY29uZHMgPCBjb21wYXJlZFNlYykge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGZpbHRlcmVkRGF0YS5wdXNoKGVsRGF0YSk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgaWYgKFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgT2JqZWN0LmtleXMoZWxEYXRhKS5pbmRleE9mKHZhcmlhYmxlLm5hbWUpID09IC0xXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICBlbERhdGFbdmFyaWFibGUubmFtZV0gPSAwO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICByZXNpZGluZ0RhdGEucHVzaChlbERhdGEpO1xuICAgICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICAgICAgICAgIGNhc2UgRmlsdGVyVHlwZXMuQUZURVI6XG4gICAgICAgICAgICAgICAgICAgICAgdmFyaWFibGVJbmZvID0gdGhpcy5nZXRWYXJpYWJsZVR5cGVCeUhlYWRlcihcbiAgICAgICAgICAgICAgICAgICAgICAgIGNvbmRpdGlvbi52YXJpYWJsZS5uYW1lLFxuICAgICAgICAgICAgICAgICAgICAgICAgZGF0YUZvcm1hdFxuICAgICAgICAgICAgICAgICAgICAgICk7XG4gICAgICAgICAgICAgICAgICAgICAgbG9kYXNoLmZvckVhY2goZmlsdGVyZWREYXRhLCAoZWxEYXRhKSA9PiB7XG4gICAgICAgICAgICAgICAgICAgICAgICBsZXQgdmFyaWFibGVUeXBlID0gdmFyaWFibGVJbmZvLnR5cGU7XG4gICAgICAgICAgICAgICAgICAgICAgICBpZiAodmFyaWFibGVUeXBlID09IERhdGFUeXBlLkRBVEUpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgaWYgKFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHRoaXMuZ2V0Rm9ybWF0dGVkRGF0ZShcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGVsRGF0YVtjb25kaXRpb24udmFyaWFibGUubmFtZV0sXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICB2YXJpYWJsZUluZm8uZm9ybWF0XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgKS5nZXRUaW1lKCkgPlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIG5ldyBEYXRlKGNvbmRpdGlvbi5jb21wYXJhdGl2ZVZhcmlhYmxlc1swXSkuZ2V0VGltZSgpXG4gICAgICAgICAgICAgICAgICAgICAgICAgICkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGZpbHRlcmVkRGF0YS5wdXNoKGVsRGF0YSk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgaWYgKFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgT2JqZWN0LmtleXMoZWxEYXRhKS5pbmRleE9mKHZhcmlhYmxlLm5hbWUpID09IC0xXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICBlbERhdGFbdmFyaWFibGUubmFtZV0gPSAwO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICByZXNpZGluZ0RhdGEucHVzaChlbERhdGEpO1xuICAgICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICAgICAgICBsZXQgY3VyclNlY29uZHMgPSB0aGlzLmdldEZvcm1hdHRlZERhdGUoXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgZWxEYXRhW2NvbmRpdGlvbi52YXJpYWJsZS5uYW1lXSxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB2YXJpYWJsZUluZm8uZm9ybWF0XG4gICAgICAgICAgICAgICAgICAgICAgICAgICk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgIGxldCBbaG91ciwgbWluXSA9IGNvbmRpdGlvbi5jb21wYXJhdGl2ZVZhcmlhYmxlc1swXVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIC5zcGxpdCgnOicpXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgLm1hcCgoZWw6IGFueSkgPT4gcGFyc2VJbnQoZWwpKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgbGV0IGNvbXBhcmVkU2VjID0gaG91ciAqIDYwICogNjAgKyBtaW4gKiA2MDtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgaWYgKGN1cnJTZWNvbmRzID4gY29tcGFyZWRTZWMpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBmaWx0ZXJlZERhdGEucHVzaChlbERhdGEpO1xuICAgICAgICAgICAgICAgICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGlmIChcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIE9iamVjdC5rZXlzKGVsRGF0YSkuaW5kZXhPZih2YXJpYWJsZS5uYW1lKSA9PSAtMVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgZWxEYXRhW3ZhcmlhYmxlLm5hbWVdID0gMDtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgcmVzaWRpbmdEYXRhLnB1c2goZWxEYXRhKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgICAgICAgICBjYXNlICc8Pic6XG4gICAgICAgICAgICAgICAgICAgICAgdmFyaWFibGVJbmZvID0gdGhpcy5nZXRWYXJpYWJsZVR5cGVCeUhlYWRlcihcbiAgICAgICAgICAgICAgICAgICAgICAgIGNvbmRpdGlvbi52YXJpYWJsZS5uYW1lLFxuICAgICAgICAgICAgICAgICAgICAgICAgZGF0YUZvcm1hdFxuICAgICAgICAgICAgICAgICAgICAgICk7XG4gICAgICAgICAgICAgICAgICAgICAgbG9kYXNoLmZvckVhY2goZmlsdGVyZWREYXRhLCAoZWxEYXRhKSA9PiB7XG4gICAgICAgICAgICAgICAgICAgICAgICBsZXQgdmFyaWFibGVUeXBlID0gdmFyaWFibGVJbmZvLnR5cGU7XG4gICAgICAgICAgICAgICAgICAgICAgICBpZiAodmFyaWFibGVUeXBlID09ICdkYXRlJykge1xuICAgICAgICAgICAgICAgICAgICAgICAgICBsZXQgdmFyRGF0ZSA9IHRoaXMuZ2V0Rm9ybWF0dGVkRGF0ZShcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBlbERhdGFbY29uZGl0aW9uLnZhcmlhYmxlLm5hbWVdLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHZhcmlhYmxlSW5mby5mb3JtYXRcbiAgICAgICAgICAgICAgICAgICAgICAgICAgKS5nZXRUaW1lKCk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgIGlmIChcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB2YXJEYXRlID49XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICBuZXcgRGF0ZShcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgY29uZGl0aW9uLmNvbXBhcmF0aXZlVmFyaWFibGVzWzBdXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICApLmdldFRpbWUoKSAmJlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHZhckRhdGUgPFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgbmV3IERhdGUoXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGNvbmRpdGlvbi5jb21wYXJhdGl2ZVZhcmlhYmxlc1sxXVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgKS5nZXRUaW1lKClcbiAgICAgICAgICAgICAgICAgICAgICAgICAgKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgZmlsdGVyZWREYXRhLnB1c2goZWxEYXRhKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBpZiAoT2JqZWN0LmtleXMoZWxEYXRhKS5pbmNsdWRlcyh2YXJpYWJsZS5uYW1lKSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgZWxEYXRhW3ZhcmlhYmxlLm5hbWVdID0gMDtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgcmVzaWRpbmdEYXRhLnB1c2goZWxEYXRhKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgbGV0IGN1cnJTZWNvbmRzID0gdGhpcy5nZXRGb3JtYXR0ZWREYXRlKFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGVsRGF0YVtjb25kaXRpb24udmFyaWFibGUubmFtZV0sXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgdmFyaWFibGVJbmZvLmZvcm1hdFxuICAgICAgICAgICAgICAgICAgICAgICAgICApO1xuICAgICAgICAgICAgICAgICAgICAgICAgICBsZXQgW2hvdXIsIG1pbl0gPSBjb25kaXRpb24uY29tcGFyYXRpdmVWYXJpYWJsZXNbMF1cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAuc3BsaXQoJzonKVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIC5tYXAoKGVsOiBhbnkpID0+IHBhcnNlSW50KGVsKSk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgIGxldCBbZW5kaG91ciwgZW5kbWluXSA9XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgY29uZGl0aW9uLmNvbXBhcmF0aXZlVmFyaWFibGVzWzFdXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAuc3BsaXQoJzonKVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgLm1hcCgoZWw6IGFueSkgPT4gcGFyc2VJbnQoZWwpKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgbGV0IGNvbXBhcmVkU2VjID0gaG91ciAqIDYwICogNjAgKyBtaW4gKiA2MDtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgbGV0IGVuZGNvbXBhcmVkU2VjID0gZW5kaG91ciAqIDYwICogNjAgKyBlbmRtaW4gKiA2MDtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgaWYgKFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGN1cnJTZWNvbmRzID49IGNvbXBhcmVkU2VjICYmXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgY3VyclNlY29uZHMgPCBlbmRjb21wYXJlZFNlY1xuICAgICAgICAgICAgICAgICAgICAgICAgICApIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBmaWx0ZXJlZERhdGEucHVzaChlbERhdGEpO1xuICAgICAgICAgICAgICAgICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGlmIChPYmplY3Qua2V5cyhlbERhdGEpLmluY2x1ZGVzKHZhcmlhYmxlLm5hbWUpKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICBlbERhdGFbdmFyaWFibGUubmFtZV0gPSAwO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICByZXNpZGluZ0RhdGEucHVzaChlbERhdGEpO1xuICAgICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICAgICAgICB9ICAgICBcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICk7XG4gICAgICAgICAgICAgIGlmIChmaWx0ZXIuaXNDdXN0b21WYWx1ZSkge1xuICAgICAgICAgICAgICAgIC8vSW5zZXJ0IGN1c3RvbSB2YWx1ZVxuICAgICAgICAgICAgICAgIGxldCB2YWx1ZSA9IHRoaXMudmFsaWRhdGVOdW1iZXIoZmlsdGVyLnZhbHVlcylcbiAgICAgICAgICAgICAgICAgID8gcGFyc2VGbG9hdChmaWx0ZXIudmFsdWVzKVxuICAgICAgICAgICAgICAgICAgOiBmaWx0ZXIudmFsdWVzO1xuICAgICAgICAgICAgICAgIHJlc3VsdGFudERhdGEgPSBbXG4gICAgICAgICAgICAgICAgICAuLi5sb2Rhc2gubWFwKGZpbHRlcmVkRGF0YSwgKGQ6IGFueSkgPT4gKHtcbiAgICAgICAgICAgICAgICAgICAgLi4uZCxcbiAgICAgICAgICAgICAgICAgICAgW3ZhcmlhYmxlLm5hbWVdOiB2YWx1ZSxcbiAgICAgICAgICAgICAgICAgIH0pKSxcbiAgICAgICAgICAgICAgICAgIC4uLnJlc2lkaW5nRGF0YSxcbiAgICAgICAgICAgICAgICBdO1xuICAgICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgIC8vSW5zZXJ0IGNhbGN1bGF0ZWQgdmFsdWVcbiAgICAgICAgICAgICAgICBkYXRhVG9UcmF2ZXJzZSA9IGxvZGFzaC53aXRob3V0KFxuICAgICAgICAgICAgICAgICAgbG9kYXNoLm1hcChmaWx0ZXJlZERhdGEsIGZpbHRlci52YWx1ZXMpLFxuICAgICAgICAgICAgICAgICAgdW5kZWZpbmVkXG4gICAgICAgICAgICAgICAgKTtcbiAgICAgICAgICAgICAgICBsZXQgdmFsdWUgPVxuICAgICAgICAgICAgICAgICAgZmlsdGVyLmFnZ3JlZ2F0aW9uRnVuY3Rpb24gPT0gJ05PIEZVTkNUSU9OJ1xuICAgICAgICAgICAgICAgICAgICA/IG51bGxcbiAgICAgICAgICAgICAgICAgICAgOiB0aGlzLmdldEFnZ3JlZ2F0ZWRWYWx1ZU9mQ3VzdG9tVmFyaWFibGUoXG4gICAgICAgICAgICAgICAgICAgICAgICBkYXRhVG9UcmF2ZXJzZSxcbiAgICAgICAgICAgICAgICAgICAgICAgIGZpbHRlclxuICAgICAgICAgICAgICAgICAgICAgICk7XG4gICAgICAgICAgICAgICAgcmVzdWx0YW50RGF0YSA9IFtcbiAgICAgICAgICAgICAgICAgIC4uLmxvZGFzaC5tYXAoZmlsdGVyZWREYXRhLCAoZDogYW55KSA9PiAoe1xuICAgICAgICAgICAgICAgICAgICAuLi5kLFxuICAgICAgICAgICAgICAgICAgICBbdmFyaWFibGUubmFtZV06XG4gICAgICAgICAgICAgICAgICAgICAgdmFsdWUgPT0gbnVsbCA/IGRbZmlsdGVyLnZhbHVlc10gOiB2YWx1ZSxcbiAgICAgICAgICAgICAgICAgIH0pKSxcbiAgICAgICAgICAgICAgICAgIC4uLnJlc2lkaW5nRGF0YSxcbiAgICAgICAgICAgICAgICBdO1xuICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9ZWxzZXtcbiAgICAgICAgICAgICAgcmVzdWx0YW50RGF0YSA9IGxvZGFzaC5jbG9uZURlZXAoZmlsdGVyZWREYXRhKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICB9KTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAvL0Jhc2VkIG9uIE9wZXJhdGlvblxuICAgICAgICAgIGlmICh2YXJpYWJsZS5vcGVyYXRpb25bMF0uaXNBZ2dyZWdhdGlvbiAmJiAhd2l0aG91dEFnZykge1xuICAgICAgICAgICAgLy9DdXN0b20gVmFyaWFibGUgQ29udGFpbiBBZ2dyZWdhdGVkIFZhbHVlXG4gICAgICAgICAgICByZXN1bHRhbnREYXRhID0gdGhpcy5nZXRDdXN0b21WYXJpYWJsZVZhbHVlQWdncmVnYXRlZChcbiAgICAgICAgICAgICAgdmFyaWFibGUsXG4gICAgICAgICAgICAgIHJlc3VsdGFudERhdGFcbiAgICAgICAgICAgICk7XG4gICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIC8vQ3VzdG9tIFZhcmlhYmxlIENvbnRhaW4gTm9uLUFnZ3JlZ2F0ZWQgVmFsdWVcbiAgICAgICAgICAgIHJlc3VsdGFudERhdGEgPSBsb2Rhc2gubWFwKHJlc3VsdGFudERhdGEsIChkOiBhbnkpID0+ICh7XG4gICAgICAgICAgICAgIC4uLmQsXG4gICAgICAgICAgICAgIFt2YXJpYWJsZS5uYW1lXTogdGhpcy5nZXRDdXN0b21WYXJpYWJsZVZhbHVlKHZhcmlhYmxlLCBkKSxcbiAgICAgICAgICAgIH0pKTtcbiAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICB9KTtcbiAgICByZXR1cm4gcmVzdWx0YW50RGF0YTtcbiAgfVxuXG4gIHByaXZhdGUgZ2V0QWdncmVnYXRlZFZhbHVlT2ZDdXN0b21WYXJpYWJsZShcbiAgICBhbGxEYXRhOiBhbnksXG4gICAgZmlsdGVyOiBEZXJpdmVkVmFyaWFibGVGaWx0ZXJcbiAgKTogYW55IHtcbiAgICBsZXQgcmVzdWx0ID0gMDtcbiAgICBzd2l0Y2ggKGZpbHRlci5hZ2dyZWdhdGlvbkZ1bmN0aW9uKSB7XG4gICAgICBjYXNlIEFnZ3JlZ2F0aW9uRnVuY3Rpb25zVHlwZS5TVU06XG4gICAgICAgIHJlc3VsdCA9IGxvZGFzaC5zdW0oYWxsRGF0YS5tYXAoTnVtYmVyKSk7XG4gICAgICAgIGJyZWFrO1xuICAgICAgY2FzZSBBZ2dyZWdhdGlvbkZ1bmN0aW9uc1R5cGUuQ09VTlRfVU5JUVVFOlxuICAgICAgICByZXN1bHQgPSBsb2Rhc2gudW5pcShhbGxEYXRhKS5sZW5ndGg7XG4gICAgICAgIGJyZWFrO1xuICAgICAgY2FzZSBBZ2dyZWdhdGlvbkZ1bmN0aW9uc1R5cGUuQ09VTlQ6XG4gICAgICAgIHJlc3VsdCA9IGFsbERhdGEubGVuZ3RoO1xuICAgICAgICBicmVhaztcbiAgICAgIGNhc2UgQWdncmVnYXRpb25GdW5jdGlvbnNUeXBlLk1BWElNVU06XG4gICAgICAgIHJlc3VsdCA9IGxvZGFzaC5tYXgoYWxsRGF0YS5tYXAoTnVtYmVyKSkgPz8gMDtcbiAgICAgICAgYnJlYWs7XG4gICAgICBjYXNlIEFnZ3JlZ2F0aW9uRnVuY3Rpb25zVHlwZS5NSU5JTVVNOlxuICAgICAgICByZXN1bHQgPSBsb2Rhc2gubWluKGFsbERhdGEubWFwKE51bWJlcikpID8/IDA7XG4gICAgICAgIGJyZWFrO1xuICAgICAgY2FzZSBBZ2dyZWdhdGlvbkZ1bmN0aW9uc1R5cGUuQVZFUkFHRTpcbiAgICAgICAgcmVzdWx0ID0gbG9kYXNoLm1lYW4oYWxsRGF0YS5tYXAoTnVtYmVyKSkgPz8gMDtcbiAgICAgICAgYnJlYWs7XG4gICAgfVxuICAgIHJldHVybiByZXN1bHQ7XG4gIH1cblxuICBwcml2YXRlIGdldEN1c3RvbVZhcmlhYmxlVmFsdWUodmFyaWFibGU6IERlcml2ZWRWYXJpYWJsZSwgZGF0YTogYW55KSB7XG4gICAgbGV0IHRlbXBBcnI6IGFueSA9IHZhcmlhYmxlLmZvcm11bGEudHJpbSgpLnNwbGl0KCcgJyk7XG4gICAgdGVtcEFyciA9IHRlbXBBcnIubWFwKChlbDogYW55KSA9PiB7XG4gICAgICBsZXQgYWxsa2V5cyA9IE9iamVjdC5rZXlzKGRhdGEpO1xuICAgICAgaWYgKGFsbGtleXMuaW5kZXhPZihlbC5yZXBsYWNlQWxsKCdfJywgJyAnKSkgIT0gLTEpIHtcbiAgICAgICAgaWYgKFxuICAgICAgICAgIGRhdGFbZWwucmVwbGFjZUFsbCgnXycsICcgJyldID09ICcnIHx8XG4gICAgICAgICAgZGF0YVtlbC5yZXBsYWNlQWxsKCdfJywgJyAnKV0gPT0gbnVsbFxuICAgICAgICApIHtcbiAgICAgICAgICBlbCA9IDA7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgZWwgPSBuZXcgQmlnTnVtYmVyKGRhdGFbZWwucmVwbGFjZUFsbCgnXycsICcgJyldKTtcbiAgICAgICAgfVxuICAgICAgfSBlbHNlIHtcbiAgICAgICAgaWYgKGVsLmluZGV4T2YoJ18nKSAhPSAtMSkge1xuICAgICAgICAgIGVsID0gMDtcbiAgICAgICAgfVxuICAgICAgfVxuICAgICAgcmV0dXJuIGVsO1xuICAgIH0pO1xuICAgIHJldHVybiBldmFsKHRlbXBBcnIuam9pbignICcpKTtcbiAgfVxuXG4gIHByaXZhdGUgZ2V0Q3VzdG9tVmFyaWFibGVWYWx1ZUFnZ3JlZ2F0ZWQoXG4gICAgdmFyaWFibGU6IERlcml2ZWRWYXJpYWJsZSxcbiAgICBkYXRhOiBhbnlcbiAgKSB7XG4gICAgbGV0IHRlbXBBcnIgPSB2YXJpYWJsZS5mb3JtdWxhLnRyaW0oKS5zcGxpdCgnICcpO1xuICAgIHRlbXBBcnIgPSBsb2Rhc2gubWFwKHRlbXBBcnIsIChlbDogYW55KSA9PiB7XG4gICAgICBsZXQgYWxsa2V5cyA9IE9iamVjdC5rZXlzKGRhdGFbMF0pO1xuICAgICAgaWYgKGFsbGtleXMuaW5kZXhPZihlbC5yZXBsYWNlQWxsKCdfJywgJyAnKSkgIT0gLTEpIHtcbiAgICAgICAgbGV0IGtleSA9IGVsLnJlcGxhY2VBbGwoJ18nLCAnICcpO1xuICAgICAgICBsZXQgZGF0YVRvVHJhdmVyc2UgPSBsb2Rhc2gubWFwKGRhdGEsIGtleSk7XG4gICAgICAgIGRhdGFUb1RyYXZlcnNlID0gbG9kYXNoLndpdGhvdXQoZGF0YVRvVHJhdmVyc2UsICcwJyk7XG4gICAgICAgIGVsID0gbmV3IEJpZ051bWJlcihcbiAgICAgICAgICAoZGF0YVRvVHJhdmVyc2UubGVuZ3RoID09IDBcbiAgICAgICAgICAgID8gMFxuICAgICAgICAgICAgOiBsb2Rhc2gubWF4KGRhdGFUb1RyYXZlcnNlKSkgYXMgc3RyaW5nXG4gICAgICAgICk7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICBpZiAoZWwuaW5kZXhPZignXycpICE9IC0xKSB7XG4gICAgICAgICAgZWwgPSAwO1xuICAgICAgICB9XG4gICAgICB9XG4gICAgICByZXR1cm4gZWw7XG4gICAgfSk7XG4gICAgbGV0IHZhbHVlID0gZXZhbCh0ZW1wQXJyLmpvaW4oJyAnKSk7XG4gICAgcmV0dXJuIGxvZGFzaC5tYXAoZGF0YSwgKGQpID0+ICh7XG4gICAgICAuLi5kLFxuICAgICAgW3ZhcmlhYmxlLm5hbWVdOiB2YWx1ZSxcbiAgICB9KSk7XG4gIH1cbiAgXG5cbiAgLy90cmVuZHMgRGF0YVxuICBwcml2YXRlIGJ1aWxkVHJlbmQodHJlbmREYXRhOiBUcmVuZHNEYXRhKSB7XG4gICAgLy9TZXQgVHJlbmRzT2JqZWN0IHdpdGggR3JhcGhJZFxuICAgIHRoaXMudHJlbmRzW3RyZW5kRGF0YS5ncmFwaElkXSA9IHRyZW5kRGF0YTtcblxuICAgIHRoaXMudHJlbmRzW3RyZW5kRGF0YS5ncmFwaElkXS5ncmFwaERhdGEgPSB0aGlzLnRyZW5kc1t0cmVuZERhdGEuZ3JhcGhJZF0uZ3JhcGhEYXRhLmZpbHRlcigoZDogYW55KSA9PiB0aGlzLmFwcGx5Q3VzdG9tRmlsdGVyKGQsIHRoaXMudHJlbmRzW3RyZW5kRGF0YS5ncmFwaElkXS5maWx0ZXIpKVxuXG4gICAgdGhpcy5pbml0VHJlbmQodHJlbmREYXRhLmdyYXBoSWQpO1xuICB9XG5cbiAgcHJpdmF0ZSBhc3luYyBpbml0VHJlbmQoZ3JhcGhJZDogYW55KSB7XG4gICAgLy9DcmVhdGluZyBDaGFydCBSYXcgSnNvblxuICAgIGNvbnN0IHRyZW5kRGF0YTogYW55ID0gYXdhaXQgdGhpcy5jcmVhdGVUcmVuZERhdGEoZ3JhcGhJZCk7XG5cbiAgICAvL1JlbmRlcmluZyBDaGFydCBvZiBHcmFwaElkXG4gICAgSGlnaGNoYXJ0cy5jaGFydChncmFwaElkLCB0cmVuZERhdGEpO1xuXG4gICAgLy8gdGhpcy5hZGRBY3Rpb25CdG5UcmVuZHMoZ3JhcGhJZCk7XG5cbiAgICByZXR1cm4gdHJ1ZTtcbiAgfVxuXG4gIHByaXZhdGUgZ2V0V2Vla3Moc3RhcnREYXRlOiBEYXRlLCBlbmREYXRlOiBEYXRlKSB7XG4gICAgbGV0IHdlZWtzID0gW107XG4gICAgLy9HZXQgV2Vla3MgZnJvbSBnaXZlbiBkYXRlIFJhbmdlXG4gICAgd2hpbGUgKHN0YXJ0RGF0ZSA8PSBlbmREYXRlKSB7XG4gICAgICBsZXQgdGVtcCA9IG5ldyBEYXRlKHN0YXJ0RGF0ZSk7XG4gICAgICB0ZW1wLnNldERhdGUodGVtcC5nZXREYXRlKCkgKyA2KTtcbiAgICAgIHdlZWtzLnB1c2godGhpcy5jb252ZXJ0RGF0ZShzdGFydERhdGUpICsgJyAtICcgKyB0aGlzLmNvbnZlcnREYXRlKHRlbXApKTtcbiAgICAgIHN0YXJ0RGF0ZSA9IHRlbXA7XG4gICAgfVxuICAgIHJldHVybiB3ZWVrcztcbiAgfVxuXG4gIHByaXZhdGUgZ2V0UXVhcnRlcnMoc3RhcnREYXRlOiBhbnksIGVuZERhdGU6IGFueSkge1xuICAgIGxldCBxdWF0YXJzID0gW107XG4gICAgLy9HZXQgUXVhcnRlcnMgZnJvbSBnaXZlbiBkYXRlIFJhbmdlXG4gICAgd2hpbGUgKHN0YXJ0RGF0ZSA8PSBlbmREYXRlKSB7XG4gICAgICBsZXQgdGVtcCA9IG5ldyBEYXRlKHN0YXJ0RGF0ZSk7XG4gICAgICB0ZW1wLnNldE1vbnRoKHRlbXAuZ2V0TW9udGgoKSArIDIpO1xuICAgICAgcXVhdGFycy5wdXNoKFxuICAgICAgICB0aGlzLmNvbnZlcnREYXRlKHN0YXJ0RGF0ZSkgKyAnIC0gJyArIHRoaXMuY29udmVydERhdGUodGVtcClcbiAgICAgICk7XG4gICAgICBzdGFydERhdGUgPSB0ZW1wO1xuICAgIH1cbiAgICByZXR1cm4gcXVhdGFycztcbiAgfVxuXG4gIHByaXZhdGUgY29udmVydERhdGUoaW5wdXREYXRlOiBEYXRlKSB7XG4gICAgbGV0IGRhdGUgPSBpbnB1dERhdGUuZ2V0RGF0ZSgpO1xuICAgIGxldCBtb250aCA9IGlucHV0RGF0ZS5nZXRNb250aCgpO1xuICAgIGxldCB5ZWFyID0gaW5wdXREYXRlLmdldEZ1bGxZZWFyKCk7XG4gICAgLy9HZXQgRGF0ZSBpbiBGb3JtYXR0ZWQgU3RyaW5nXG4gICAgcmV0dXJuIChcbiAgICAgIFN0cmluZyhkYXRlKS5wYWRTdGFydCgyLCAnMCcpICtcbiAgICAgICctJyArXG4gICAgICBTdHJpbmcobW9udGggKyAxKS5wYWRTdGFydCgyLCAnMCcpICtcbiAgICAgICctJyArXG4gICAgICBTdHJpbmcoeWVhcikucGFkU3RhcnQoNCwgJzAnKVxuICAgICk7XG4gIH1cblxuICBwcml2YXRlIGdldFBsb3RPcHRpb25zVHJlbmRzKGdyYXBoSWQ6IHN0cmluZykge1xuICAgIGxldCBwbG90T3B0aW9ucyA9IHtcbiAgICAgIHNlcmllczoge1xuICAgICAgICB0dXJib1RocmVzaG9sZDogMTAwMDAsXG4gICAgICAgIGRhdGFMYWJlbHM6IHtcbiAgICAgICAgICBjb2xvcjogJ2JsYWNrJyxcbiAgICAgICAgICBlbmFibGVkOiB0cnVlLFxuICAgICAgICAgIHN0eWxlOiB7XG4gICAgICAgICAgICBjb2xvcjogJ2JsYWNrJyxcbiAgICAgICAgICAgIHRleHRTaGFkb3c6IGZhbHNlLFxuICAgICAgICAgICAgdGV4dERlY29yYXRpb246ICdub25lJyxcbiAgICAgICAgICB9LFxuICAgICAgICB9LFxuICAgICAgICBsYWJlbDoge1xuICAgICAgICAgIHN0eWxlOiB7XG4gICAgICAgICAgICBjb2xvcjogJ2JsYWNrJyxcbiAgICAgICAgICB9LFxuICAgICAgICB9LFxuICAgICAgfSxcbiAgICB9O1xuXG4gICAgLy9PcHRpb25zIGZvciBTdGFjayBHcmFwaFxuICAgIC8vIGlmICh0aGlzLnRyZW5kc1tncmFwaElkXS5jb2x1bW5zLmluZGV4T2YoXCIlXCIpID09IC0xKSB7XG4gICAgLy8gICAvL0FkZCBQZXJjZW50IFNpZ24gYWZ0ZXIgeS1heGlzIHZhbHVlc1xuICAgIC8vICAgcGxvdE9wdGlvbnMuc2VyaWVzLmRhdGFMYWJlbHNbJ2Zvcm1hdHRlciddID0gZnVuY3Rpb24gKCkge1xuICAgIC8vICAgICByZXR1cm4gdGhpcy5wZXJjZW50YWdlLnRvRml4ZWQoMikgKyAnICUnO1xuICAgIC8vICAgfTtcbiAgICAvLyB9XG4gICAgcmV0dXJuIHBsb3RPcHRpb25zO1xuICB9XG5cbiAgcHJpdmF0ZSBjcmVhdGVUcmVuZERhdGEoZ3JhcGhJZDogYW55KTogYW55IHtcbiAgICBsZXQgX3NlbGYgPSB0aGlzO1xuXG4gICAgLy9HZXR0aW5nIFBsb3QgT3B0aW9ucyBmb3IgR3JhcGhcbiAgICBjb25zdCBwbG90T3B0aW9ucyA9IHRoaXMuZ2V0UGxvdE9wdGlvbnNUcmVuZHMoZ3JhcGhJZCk7XG4gICAgY29uc3Qgc2VyaWVzRGF0YSA9IHRoaXMuZ2V0U2VyaWVzRGF0YShcbiAgICAgIHRoaXMudHJlbmRzW2dyYXBoSWRdLmdyYXBoRGF0YSxcbiAgICAgIHRoaXMudHJlbmRzW2dyYXBoSWRdLmdyYXBoSWRcbiAgICApO1xuXG4gICAgcmV0dXJuIHtcbiAgICAgIGNyZWRpdHM6IHtcbiAgICAgICAgdGV4dDogdGhpcy5jcmVkaXRUaXRsZSxcbiAgICAgICAgaHJlZjogdGhpcy5jcmVkaXRVcmwsXG4gICAgICAgIHN0eWxlOiB7XG4gICAgICAgICAgZm9udFNpemU6ICcxMnB4JyxcbiAgICAgICAgfSxcbiAgICAgIH0sXG4gICAgICB0aXRsZTogbnVsbCxcbiAgICAgIHBsb3RPcHRpb25zOiBwbG90T3B0aW9ucyxcbiAgICAgIGNoYXJ0OiB7XG4gICAgICAgIHR5cGU6ICdsaW5lJyxcbiAgICAgICAgZXZlbnRzOiB7XG4gICAgICAgICAgLy9IYW5kbGUgRHJpbGxkb3duIEV2ZW50IG9mIEdyYXBoXG4gICAgICAgICAgZHJpbGxkb3duOiBmdW5jdGlvbiAoZTogYW55KSB7XG4gICAgICAgICAgICBpZihlLnBvaW50cyAhPSBmYWxzZSkgcmV0dXJuXG4gICAgICAgICAgICBsZXQgY3VyckdyYXBoSWQgPSBlLnRhcmdldC51c2VyT3B0aW9ucy5zZXJpZXNbMF0uZ3JhcGhJZDsgLy9HcmFwaElkXG4gICAgICAgICAgICBsZXQgY29tcGFyaXNvbktleSA9IGUucG9pbnQub3B0aW9ucy5jb21wYXJpc29uS2V5OyAvL0NvbG9ySW5kZXggb2YgYmFyXG4gICAgICAgICAgICBsZXQgY2hhcnQgOiBhbnkgPSB0aGlzO1xuICAgICAgICAgICAgY2hhcnQuc2hvd0xvYWRpbmcoJ0xvYWRpbmcuLi4nKTtcbiAgICAgICAgICAgIGxldCBzZWxLZXkgPSBlLnBvaW50Lm5hbWU7XG4gICAgICAgICAgICBsZXQgcmFuZ2VEYXRhID0gW107XG4gICAgICAgICAgICBpZihjb21wYXJpc29uS2V5ICE9IG51bGwpe1xuICAgICAgICAgICAgICBsZXQgY29tcGFyaXNvbkRhdGEgPSBsb2Rhc2guZ3JvdXBCeShfc2VsZi50cmVuZHNbY3VyckdyYXBoSWRdLmdyYXBoRGF0YSwgX3NlbGYudHJlbmRzW2N1cnJHcmFwaElkXS5yb3dzKTtcbiAgICAgICAgICAgICAgcmFuZ2VEYXRhID0gX3NlbGYuZ2V0UmFuZ2VPYmooY29tcGFyaXNvbkRhdGFbY29tcGFyaXNvbktleV0sIF9zZWxmLnRyZW5kc1tjdXJyR3JhcGhJZF0ucmFuZ2VGaWx0ZXIsICBfc2VsZi50cmVuZHNbY3VyckdyYXBoSWRdLnJhbmdlLnN0YXJ0RGF0ZSwgX3NlbGYudHJlbmRzW2N1cnJHcmFwaElkXS5yYW5nZS5lbmREYXRlLCBfc2VsZi50cmVuZHNbY3VyckdyYXBoSWRdLmRhdGVWYXJpYWJsZSwgX3NlbGYudHJlbmRzW2N1cnJHcmFwaElkXS5yb3dzLCBfc2VsZi50cmVuZHNbY3VyckdyYXBoSWRdLmZpbHRlciwgY3VyckdyYXBoSWQpXG4gICAgICAgICAgICB9ZWxzZXtcbiAgICAgICAgICAgICAgcmFuZ2VEYXRhID0gX3NlbGYuZ2V0UmFuZ2VPYmooX3NlbGYudHJlbmRzW2N1cnJHcmFwaElkXS5ncmFwaERhdGEsIF9zZWxmLnRyZW5kc1tjdXJyR3JhcGhJZF0ucmFuZ2VGaWx0ZXIsICBfc2VsZi50cmVuZHNbY3VyckdyYXBoSWRdLnJhbmdlLnN0YXJ0RGF0ZSwgX3NlbGYudHJlbmRzW2N1cnJHcmFwaElkXS5yYW5nZS5lbmREYXRlLCBfc2VsZi50cmVuZHNbY3VyckdyYXBoSWRdLmRhdGVWYXJpYWJsZSwgX3NlbGYudHJlbmRzW2N1cnJHcmFwaElkXS5yb3dzLCBfc2VsZi50cmVuZHNbY3VyckdyYXBoSWRdLmZpbHRlciwgY3VyckdyYXBoSWQpXG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBfc2VsZi5kYXRhU2VydmljZS5zZXRNb2RhbERhdGEoe1xuICAgICAgICAgICAgICBjb2xUb1ZpZXc6IF9zZWxmLnRyZW5kc1tjdXJyR3JhcGhJZF0ubGFzdExldmVsQ29sdW1ucyxcbiAgICAgICAgICAgICAgcmVmRGF0YTogcmFuZ2VEYXRhW3NlbEtleV1cbiAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgbGV0IG1vZGFsT3B0aW9ucyA9IHtcbiAgICAgICAgICAgICAgcGFuZWxDbGFzczogJ2RhdGFQb3B1cC1tb2RhbCcsXG4gICAgICAgICAgICAgIGJhY2tkcm9wQ2xhc3M6ICdtb2RhbC1iYWNrZHJvcCcsXG4gICAgICAgICAgICB9O1xuICAgICAgICAgICAgX3NlbGYuZGlhbG9nLm9wZW4oRGF0YVBvcHVwQ29tcG9uZW50LCBtb2RhbE9wdGlvbnMpO1xuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICAgIH0sXG4gICAgICAgIH0sXG4gICAgICB9LFxuICAgICAgeEF4aXM6IHtcbiAgICAgICAgdHlwZTogJ2NhdGVnb3J5JyxcbiAgICAgICAgbGFiZWxzOiB7XG4gICAgICAgICAgc3R5bGU6IHtcbiAgICAgICAgICAgIGNvbG9yOiAncmVkJyxcbiAgICAgICAgICAgIHRleHREZWNvcmF0aW9uOiAnbm9uZScsXG4gICAgICAgICAgICB0ZXh0T3V0bGluZTogJzBweCcsXG4gICAgICAgICAgfSxcbiAgICAgICAgfSxcbiAgICAgICAgbWluOiAwLFxuICAgICAgICBhbGxvd0RlY2ltYWxzOiBmYWxzZSxcbiAgICAgICAgc2Nyb2xsYmFyOiB7XG4gICAgICAgICAgZW5hYmxlZDogdHJ1ZSxcbiAgICAgICAgfSxcbiAgICAgIH0sXG4gICAgICB5QXhpczogW1xuICAgICAgICB7XG4gICAgICAgICAgb3Bwb3NpdGU6IHRydWUsXG4gICAgICAgICAgdGl0bGU6IHtcbiAgICAgICAgICAgIHRleHQ6IG51bGwsXG4gICAgICAgICAgfSxcbiAgICAgICAgfSxcbiAgICAgIF0sXG4gICAgICBzZXJpZXM6IHNlcmllc0RhdGEsXG4gICAgfTtcbiAgfVxuXG4gIHByaXZhdGUgZ2V0U2VyaWVzRGF0YShkYXRhOiBhbnksIGdyYXBoSWQ6IHN0cmluZykge1xuICAgIGxldCBzZXJpZXMgPSBbXTtcbiAgICBpZiAodGhpcy50cmVuZHNbZ3JhcGhJZF0uY29tcGFyaXNvbi5sZW5ndGggPiAwKSB7XG4gICAgICAvL011bHRpLWxpbmUgVHJlbmRzIGZvciBDb21wYXJpc29uXG4gICAgICBsZXQgZmluYWxEYXRhID0gdGhpcy5nZXRDb21wYXJpc29uRGF0YSh0aGlzLnRyZW5kc1tncmFwaElkXS5jb21wYXJpc29uLCB0aGlzLnRyZW5kc1tncmFwaElkXS5ncmFwaERhdGEsIHRoaXMudHJlbmRzW2dyYXBoSWRdLnJvd3MsIHRoaXMudHJlbmRzW2dyYXBoSWRdLnJhbmdlRmlsdGVyLCB0aGlzLnRyZW5kc1tncmFwaElkXS5yYW5nZS5zdGFydERhdGUsIHRoaXMudHJlbmRzW2dyYXBoSWRdLnJhbmdlLmVuZERhdGUsIHRoaXMudHJlbmRzW2dyYXBoSWRdLmRhdGVWYXJpYWJsZSwgdGhpcy50cmVuZHNbZ3JhcGhJZF0uZmlsdGVyLCBncmFwaElkKTtcbiAgICAgIE9iamVjdC5rZXlzKGZpbmFsRGF0YSkuZm9yRWFjaChrZXkgPT4ge1xuICAgICAgICBsZXQgcmFuZ2VEYXRhIDogYW55ID0gW107XG4gICAgICAgIE9iamVjdC5rZXlzKGZpbmFsRGF0YVtrZXldKS5mb3JFYWNoKGtleTIgPT4ge1xuICAgICAgICAgIGxldCB0ZW1wRGF0YSA9IGZpbmFsRGF0YVtrZXldW2tleTJdO1xuICAgICAgICAgIGlmKHRlbXBEYXRhLmxlbmd0aCA+IDApe1xuICAgICAgICAgICAgdGVtcERhdGEgPSB0aGlzLmFkZEN1c3RvbVZhcmlhYmxlKHRoaXMudHJlbmRzW2dyYXBoSWRdLmN1c3RvbVZhcmlhYmxlLCB0ZW1wRGF0YSwgZmFsc2UsIHRoaXMudHJlbmRzW2dyYXBoSWRdLmRhdGFGb3JtYXQsIGZhbHNlKTtcbiAgICAgICAgICAgIGNvbnN0IGVuY291bnRlcmVkVmFsdWVzID0gdGVtcERhdGEubGVuZ3RoXG4gICAgICAgICAgICAgID8gbG9kYXNoLm1hcCh0ZW1wRGF0YSwgdGhpcy50cmVuZHNbZ3JhcGhJZF0uY29sdW1ucylcbiAgICAgICAgICAgICAgOiBbXTtcblxuICAgICAgICAgICAgY29uc3QgZGF0YVRvVHJhdmVyc2UgPSBsb2Rhc2gud2l0aG91dChcbiAgICAgICAgICAgICAgbG9kYXNoLndpdGhvdXQoZW5jb3VudGVyZWRWYWx1ZXMsICcwJyksXG4gICAgICAgICAgICAgICcnXG4gICAgICAgICAgICApO1xuICAgICAgICAgICAgcmFuZ2VEYXRhLnB1c2goe1xuICAgICAgICAgICAgICBuYW1lOiBrZXkyLFxuICAgICAgICAgICAgICBkcmlsbGRvd246IHRydWUsXG4gICAgICAgICAgICAgIGRhdGFMYWJlbHM6IHtcbiAgICAgICAgICAgICAgICBzaGFkb3c6IGZhbHNlLFxuICAgICAgICAgICAgICAgIHN0eWxlOiB7XG4gICAgICAgICAgICAgICAgICBjb2xvcjogJ2JsYWNrJyxcbiAgICAgICAgICAgICAgICAgIHRleHREZWNvcmF0aW9uOiAnbm9uZScsXG4gICAgICAgICAgICAgICAgICB0ZXh0U2hhZG93OiBmYWxzZSxcblxuICAgICAgICAgICAgICAgICAgdGV4dE91dGxpbmU6IDAsXG4gICAgICAgICAgICAgICAgfSxcbiAgICAgICAgICAgICAgICBjbGFzc05hbWU6ICdncmFwaC1kYXRhLWxhYmVsJyxcbiAgICAgICAgICAgICAgfSxcbiAgICAgICAgICAgICAgY29tcGFyaXNvbktleToga2V5LFxuICAgICAgICAgICAgICB5OiB0ZW1wRGF0YS5sZW5ndGhcbiAgICAgICAgICAgICAgICA/IHBhcnNlRmxvYXQoXG4gICAgICAgICAgICAgICAgICAvLyBuZXcgRGVjaW1hbChcbiAgICAgICAgICAgICAgICAgICAgICB0aGlzLnRyZW5kc1tncmFwaElkXS5hZ2dyZWdhdGlvbkZ1bmN0aW9uc1xuICAgICAgICAgICAgICAgICAgICAgICAgLmFnZ3JlZ2F0aW9uRnVuY3Rpb25zID09XG4gICAgICAgICAgICAgICAgICAgICAgQWdncmVnYXRpb25GdW5jdGlvbnNUeXBlLk5PX0ZVTkNUSU9OXG4gICAgICAgICAgICAgICAgICAgICAgICA/IHBhcnNlRmxvYXQoXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgZGF0YVRvVHJhdmVyc2UubGVuZ3RoID09IDBcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgID8gMFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgOiBsb2Rhc2gubWF4KGRhdGFUb1RyYXZlcnNlKVxuICAgICAgICAgICAgICAgICAgICAgICAgICApLnRvU3RyaW5nKClcbiAgICAgICAgICAgICAgICAgICAgICAgIDogdGhpcy5hcHBseUFnZ3JlZ2F0aW9uKGVuY291bnRlcmVkVmFsdWVzLCAwLCBbXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgdGhpcy50cmVuZHNbZ3JhcGhJZF0uYWdncmVnYXRpb25GdW5jdGlvbnMsXG4gICAgICAgICAgICAgICAgICAgICAgICAgIF0pLnRvUHJlY2lzaW9uKDIpXG4gICAgICAgICAgICAgICAgICApXG4gICAgICAgICAgICAgICAgICAvLyApXG4gICAgICAgICAgICAgICAgOiAwLFxuICAgICAgICAgICAgfSlcbiAgICAgICAgICB9XG5cbiAgICAgICAgfSlcbiAgICAgICAgc2VyaWVzLnB1c2goe1xuICAgICAgICAgIG5hbWU6XG4gICAgICAgICAgICBrZXkgK1xuICAgICAgICAgICAgJy0nICtcbiAgICAgICAgICAgIHRoaXMudHJlbmRzW2dyYXBoSWRdLmFnZ3JlZ2F0aW9uRnVuY3Rpb25zLmFnZ3JlZ2F0aW9uRnVuY3Rpb25zICtcbiAgICAgICAgICAgICcoJyArXG4gICAgICAgICAgICB0aGlzLnRyZW5kc1tncmFwaElkXS5jb2x1bW5zICtcbiAgICAgICAgICAgICcpJyxcbiAgICAgICAgICB0eXBlOiAnbGluZScsXG4gICAgICAgICAgZ3JhcGhJZDogZ3JhcGhJZCxcbiAgICAgICAgICBkYXRhOiByYW5nZURhdGEsXG4gICAgICAgICAgY29tcGFyaXNvbktleToga2V5XG4gICAgICAgIH0pXG4gICAgICB9KVxuICAgIH0gZWxzZSB7XG4gICAgICBsZXQgZmluYWxEYXRhID0gdGhpcy5nZXRSYW5nZU9iaih0aGlzLnRyZW5kc1tncmFwaElkXS5ncmFwaERhdGEsIHRoaXMudHJlbmRzW2dyYXBoSWRdLnJhbmdlRmlsdGVyLCB0aGlzLnRyZW5kc1tncmFwaElkXS5yYW5nZS5zdGFydERhdGUsIHRoaXMudHJlbmRzW2dyYXBoSWRdLnJhbmdlLmVuZERhdGUsIHRoaXMudHJlbmRzW2dyYXBoSWRdLmRhdGVWYXJpYWJsZSx0aGlzLnRyZW5kc1tncmFwaElkXS5yb3dzLCB0aGlzLnRyZW5kc1tncmFwaElkXS5maWx0ZXIsIGdyYXBoSWQpO1xuICAgICAgbGV0IHJhbmdlRGF0YSA6IGFueSA9IFtdO1xuICAgICAgT2JqZWN0LmtleXMoZmluYWxEYXRhKS5mb3JFYWNoKGtleSA9PiB7XG4gICAgICAgIGxldCB0ZW1wRGF0YSA9IGZpbmFsRGF0YVtrZXldO1xuICAgICAgICBpZih0ZW1wRGF0YS5sZW5ndGggPiAwKXtcbiAgICAgICAgICB0ZW1wRGF0YSA9IHRoaXMuYWRkQ3VzdG9tVmFyaWFibGUodGhpcy50cmVuZHNbZ3JhcGhJZF0uY3VzdG9tVmFyaWFibGUsIHRlbXBEYXRhLCBmYWxzZSwgdGhpcy50cmVuZHNbZ3JhcGhJZF0uZGF0YUZvcm1hdCwgZmFsc2UpO1xuICAgICAgICAgIGNvbnN0IGVuY291bnRlcmVkVmFsdWVzID0gdGVtcERhdGEubGVuZ3RoXG4gICAgICAgICAgICA/IGxvZGFzaC5tYXAodGVtcERhdGEsIHRoaXMudHJlbmRzW2dyYXBoSWRdLmNvbHVtbnMpXG4gICAgICAgICAgICA6IFtdO1xuXG4gICAgICAgICAgY29uc3QgZGF0YVRvVHJhdmVyc2UgPSBsb2Rhc2gud2l0aG91dChcbiAgICAgICAgICAgIGxvZGFzaC53aXRob3V0KGVuY291bnRlcmVkVmFsdWVzLCAnMCcpLFxuICAgICAgICAgICAgJydcbiAgICAgICAgICApO1xuICAgICAgICAgIHJhbmdlRGF0YS5wdXNoKHtcbiAgICAgICAgICAgIG5hbWU6IGtleSxcbiAgICAgICAgICAgIGRyaWxsZG93bjogdHJ1ZSxcbiAgICAgICAgICAgIGRhdGFMYWJlbHM6IHtcbiAgICAgICAgICAgICAgc2hhZG93OiBmYWxzZSxcbiAgICAgICAgICAgICAgc3R5bGU6IHtcbiAgICAgICAgICAgICAgICBjb2xvcjogJ2JsYWNrJyxcbiAgICAgICAgICAgICAgICB0ZXh0RGVjb3JhdGlvbjogJ25vbmUnLFxuICAgICAgICAgICAgICAgIHRleHRTaGFkb3c6IGZhbHNlLFxuXG4gICAgICAgICAgICAgICAgdGV4dE91dGxpbmU6IDAsXG4gICAgICAgICAgICAgIH0sXG4gICAgICAgICAgICAgIGNsYXNzTmFtZTogJ2dyYXBoLWRhdGEtbGFiZWwnLFxuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIGNvbXBhcmlzb25LZXk6IG51bGwsXG4gICAgICAgICAgICB5OiB0ZW1wRGF0YS5sZW5ndGhcbiAgICAgICAgICAgICAgPyBwYXJzZUZsb2F0KFxuICAgICAgICAgICAgICAgIC8vIG5ldyBEZWNpbWFsKFxuICAgICAgICAgICAgICAgICAgICB0aGlzLnRyZW5kc1tncmFwaElkXS5hZ2dyZWdhdGlvbkZ1bmN0aW9uc1xuICAgICAgICAgICAgICAgICAgICAgIC5hZ2dyZWdhdGlvbkZ1bmN0aW9ucyA9PVxuICAgICAgICAgICAgICAgICAgICBBZ2dyZWdhdGlvbkZ1bmN0aW9uc1R5cGUuTk9fRlVOQ1RJT05cbiAgICAgICAgICAgICAgICAgICAgICA/IHBhcnNlRmxvYXQoXG4gICAgICAgICAgICAgICAgICAgICAgICAgIGRhdGFUb1RyYXZlcnNlLmxlbmd0aCA9PSAwXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgPyAwXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgOiBsb2Rhc2gubWF4KGRhdGFUb1RyYXZlcnNlKVxuICAgICAgICAgICAgICAgICAgICAgICAgKS50b1N0cmluZygpXG4gICAgICAgICAgICAgICAgICAgICAgOiB0aGlzLmFwcGx5QWdncmVnYXRpb24oZW5jb3VudGVyZWRWYWx1ZXMsIDAsIFtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgdGhpcy50cmVuZHNbZ3JhcGhJZF0uYWdncmVnYXRpb25GdW5jdGlvbnMsXG4gICAgICAgICAgICAgICAgICAgICAgICBdKS50b1ByZWNpc2lvbigyKVxuICAgICAgICAgICAgICAgIClcbiAgICAgICAgICAgICAgICAvLyApXG4gICAgICAgICAgICAgIDogMCxcbiAgICAgICAgICB9KVxuICAgICAgICB9XG5cbiAgICAgIH0pXG4gICAgICBzZXJpZXMucHVzaCh7XG4gICAgICAgIG5hbWU6XG4gICAgICAgICAgdGhpcy50cmVuZHNbZ3JhcGhJZF0uYWdncmVnYXRpb25GdW5jdGlvbnMuYWdncmVnYXRpb25GdW5jdGlvbnMgK1xuICAgICAgICAgICcoJyArXG4gICAgICAgICAgdGhpcy50cmVuZHNbZ3JhcGhJZF0uY29sdW1ucyArXG4gICAgICAgICAgJyknLFxuICAgICAgICB0eXBlOiAnbGluZScsXG4gICAgICAgIGdyYXBoSWQ6IGdyYXBoSWQsXG4gICAgICAgIGNvbXBhcmlzb25LZXk6IG51bGwsXG4gICAgICAgIGRhdGE6IHJhbmdlRGF0YVxuICAgICAgfSlcbiAgICB9XG4gICAgcmV0dXJuIHNlcmllcztcbiAgfVxuXG4gIHByaXZhdGUgZ2V0Q29tcGFyaXNvbkRhdGEoY29tcGFyaXNvbjogYW55LCBkYXRhOiBhbnksIHhBeGlzOiBhbnksIHJhbmdlRmlsdGVyOiBhbnksIHN0YXJ0RGF0ZTogYW55LCBlbmREYXRlOiBhbnksIGRhdGVWYXJpYWJsZTogYW55LCBmaWx0ZXI6IEZpbHRlcnMsZ3JhcGhJZDogYW55KXtcbiAgICBsZXQgY29tcGFyaXNvbktleSA9IHhBeGlzO1xuICAgIGxldCBjb21wYXJpc29uRGF0YSA9IGxvZGFzaC5ncm91cEJ5KGRhdGEsIGNvbXBhcmlzb25LZXkpO1xuICAgIGxldCBmaW5hbFJlcyA6IGFueSA9IHt9O1xuICAgIE9iamVjdC5rZXlzKGNvbXBhcmlzb25EYXRhKS5mb3JFYWNoKGtleSA9PiB7XG4gICAgICBpZihjb21wYXJpc29uLmluZGV4T2Yoa2V5KSAhPSAtMSl7XG4gICAgICAgIGxldCByYW5nZU9iaiA9IHRoaXMuZ2V0UmFuZ2VPYmooY29tcGFyaXNvbkRhdGFba2V5XSxyYW5nZUZpbHRlciwgc3RhcnREYXRlLCBlbmREYXRlLCBkYXRlVmFyaWFibGUsIHhBeGlzLCBmaWx0ZXIsIGdyYXBoSWQpXG4gICAgICAgIGZpbmFsUmVzW2tleV0gPSByYW5nZU9iajtcbiAgICAgIH1cbiAgICB9KVxuICAgIHJldHVybiBmaW5hbFJlcztcbiAgfVxuXG4gIHByaXZhdGUgZ2V0UmFuZ2VPYmooZGF0YTogYW55LCByYW5nZUZpbHRlcjogYW55LCBzdGFydERhdGU6IGFueSwgZW5kRGF0ZTogYW55LCBkYXRlVmFyaWFibGU6IGFueSwgeEF4aXM6IGFueSwgZmlsdGVyOiBGaWx0ZXJzLCBncmFwaElkOiBhbnkpe1xuICAgIGxldCByYW5nZU9iaiA6IGFueSA9IHt9O1xuICAgIGxldCBzb3J0ZWRNYXA6IGFueSA9IHt9O1xuICAgIGxldCBzb3J0ZWRLZXkgPSBbXTtcbiAgICBsZXQgZmlsdGVyZWREYXRhID0gW107XG4gICAgc3dpdGNoKHJhbmdlRmlsdGVyKXtcbiAgICAgIGNhc2UgUmFuZ2VGaWx0ZXIuREFJTFk6XG4gICAgICAgIGRhdGEuZm9yRWFjaCgoZDogYW55KSA9PiB7XG4gICAgICAgICAgbGV0IGRhdGVWYWx1ZSA9IGRbZGF0ZVZhcmlhYmxlXS5zcGxpdChcIiBcIilbMF07XG4gICAgICAgICAgZFtcIioqKmRhdGUqKipcIl0gPSBkYXRlVmFsdWU7XG4gICAgICAgICAgaWYodGhpcy5hcHBseURhdGFGaWx0ZXJUcmVuZHMoZCxmaWx0ZXIseEF4aXMsZ3JhcGhJZCkpe1xuICAgICAgICAgICAgZmlsdGVyZWREYXRhLnB1c2goZCk7XG4gICAgICAgICAgfVxuICAgICAgICB9KVxuICAgICAgICByYW5nZU9iaiA9IGxvZGFzaC5ncm91cEJ5KGRhdGEsIFwiKioqZGF0ZSoqKlwiKTtcbiAgICAgICAgc29ydGVkS2V5ID0gT2JqZWN0LmtleXMocmFuZ2VPYmopLnNvcnQoKGEgLCBiKSA9PiB7XG4gICAgICAgICAgbGV0IGRhdGVBID0gdGhpcy5nZXRGb3JtYXR0ZWREYXRlKGEsIERhdGVGb3JtYXQuRERfTU1fWVlZWSk7XG4gICAgICAgICAgbGV0IGRhdGVCID0gdGhpcy5nZXRGb3JtYXR0ZWREYXRlKGIsIERhdGVGb3JtYXQuRERfTU1fWVlZWSk7XG4gICAgICAgICAgcmV0dXJuIGRhdGVBIC0gZGF0ZUI7XG4gICAgICAgIH0pXG4gICAgICAgIHNvcnRlZEtleS5mb3JFYWNoKGtleSA9PiB7XG4gICAgICAgICAgc29ydGVkTWFwW2tleV0gPSByYW5nZU9ialtrZXldO1xuICAgICAgICB9KVxuICAgICAgICBicmVhaztcbiAgICAgIGNhc2UgUmFuZ2VGaWx0ZXIuV0VFS0xZOlxuICAgICAgICBsZXQgYWxsV2Vla3MgPSB0aGlzLmdldFdlZWtzKHN0YXJ0RGF0ZSwgZW5kRGF0ZSk7XG4gICAgICAgIGRhdGEuZm9yRWFjaCgoZDogYW55KSA9PiB7XG4gICAgICAgICAgICBsZXQgdmFyaWFibGVEYXRlID0gdGhpcy5nZXRGb3JtYXR0ZWREYXRlKGRbZGF0ZVZhcmlhYmxlXSk7XG4gICAgICAgICAgICBsZXQgc2VsV2VlayA9IGFsbFdlZWtzLmZpbHRlcih3ZWVrID0+IHtcbiAgICAgICAgICAgICAgbGV0IFtzdGFydFJhbmdlLCBlbmRSYW5nZV0gOiBhbnkgPSB3ZWVrLnNwbGl0KFwiIC0gXCIpO1xuICAgICAgICAgICAgICBzdGFydFJhbmdlID0gdGhpcy5nZXRGb3JtYXR0ZWREYXRlKHN0YXJ0UmFuZ2UsRGF0ZUZvcm1hdC5ERF9NTV9ZWVlZKTtcbiAgICAgICAgICAgICAgZW5kUmFuZ2UgPSB0aGlzLmdldEZvcm1hdHRlZERhdGUoZW5kUmFuZ2UsIERhdGVGb3JtYXQuRERfTU1fWVlZWSk7XG4gICAgICAgICAgICAgIGlmKHZhcmlhYmxlRGF0ZS5nZXRUaW1lKCkgPj0gc3RhcnRSYW5nZS5nZXRUaW1lKCkgJiYgdmFyaWFibGVEYXRlLmdldFRpbWUoKSA8PSBlbmRSYW5nZS5nZXRUaW1lKCkpe1xuICAgICAgICAgICAgICAgIHJldHVybiB0cnVlO1xuICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgIHJldHVybiBmYWxzZTtcbiAgICAgICAgICAgIH0pXG4gICAgICAgICAgICBpZiAoc2VsV2Vlay5sZW5ndGggPiAwKXtcbiAgICAgICAgICAgICAgICBkLnB1dChcIioqKndlZWsqKipcIiwgc2VsV2Vla1swXSk7XG4gICAgICAgICAgICB9ZWxzZSB7XG4gICAgICAgICAgICAgICAgZC5wdXQoXCIqKip3ZWVrKioqXCIsIFwiXCIpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgaWYodGhpcy5hcHBseURhdGFGaWx0ZXJUcmVuZHMoZCxmaWx0ZXIseEF4aXMsZ3JhcGhJZCkpe1xuICAgICAgICAgICAgICAgIGZpbHRlcmVkRGF0YS5wdXNoKGQpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9KTtcbiAgICAgICAgcmFuZ2VPYmogPSBsb2Rhc2guZ3JvdXBCeShkYXRhLCBcIioqKndlZWsqKipcIik7XG4gICAgICAgIHNvcnRlZEtleSA9IE9iamVjdC5rZXlzKHJhbmdlT2JqKS5zb3J0KChhICwgYikgPT4ge1xuICAgICAgICAgIGxldCBkYXRlQSA9IHRoaXMuZ2V0Rm9ybWF0dGVkRGF0ZShhLnNwbGl0KFwiIC0gXCIpWzBdLCBEYXRlRm9ybWF0LkREX01NX1lZWVkpO1xuICAgICAgICAgIGxldCBkYXRlQiA9IHRoaXMuZ2V0Rm9ybWF0dGVkRGF0ZShiLnNwbGl0KFwiIC0gXCIpWzBdLCBEYXRlRm9ybWF0LkREX01NX1lZWVkpO1xuICAgICAgICAgIHJldHVybiBkYXRlQSAtIGRhdGVCO1xuICAgICAgICB9KVxuICAgICAgICBzb3J0ZWRLZXkuZm9yRWFjaChrZXkgPT4ge1xuICAgICAgICAgIHNvcnRlZE1hcFtrZXldID0gcmFuZ2VPYmpba2V5XTtcbiAgICAgICAgfSlcbiAgICAgICAgYnJlYWs7XG4gICAgICBjYXNlIFJhbmdlRmlsdGVyLk1PTlRITFk6XG4gICAgICAgIGRhdGEuZm9yRWFjaCgoZDogYW55KSA9PiB7XG4gICAgICAgICAgbGV0IGRhdGVWYWx1ZSA9IGRbZGF0ZVZhcmlhYmxlXS5zcGxpdChcIiBcIilbMF07XG4gICAgICAgICAgZGF0ZVZhbHVlID0gZGF0ZVZhbHVlLnNwbGl0KFwiLVwiKVsxXSArIGRhdGVWYWx1ZS5zcGxpdChcIi1cIilbMl07XG4gICAgICAgICAgZFtcIioqKm1vbnRoKioqXCJdID0gZGF0ZVZhbHVlO1xuICAgICAgICAgIGlmKHRoaXMuYXBwbHlEYXRhRmlsdGVyVHJlbmRzKGQsZmlsdGVyLHhBeGlzLGdyYXBoSWQpKXtcbiAgICAgICAgICAgIGZpbHRlcmVkRGF0YS5wdXNoKGQpO1xuICAgICAgICAgIH1cbiAgICAgICAgfSlcbiAgICAgICAgcmFuZ2VPYmogPSBsb2Rhc2guZ3JvdXBCeShkYXRhLCBcIioqKm1vbnRoKioqXCIpO1xuICAgICAgICBzb3J0ZWRLZXkgPSBPYmplY3Qua2V5cyhyYW5nZU9iaikuc29ydCgoYSAsIGIpID0+IHtcbiAgICAgICAgICBsZXQgW2RhdGVBTW9udGgsIGRhdGVBWWVhcl0gPSBhLnNwbGl0KFwiLVwiKTtcbiAgICAgICAgICBsZXQgW2RhdGVCTW9udGgsIGRhdGVCWWVhcl0gPSBiLnNwbGl0KFwiLVwiKTtcbiAgICAgICAgICByZXR1cm4gZGF0ZUFZZWFyID09IGRhdGVCWWVhciA/IChwYXJzZUludChkYXRlQU1vbnRoKSAtIHBhcnNlSW50KGRhdGVCTW9udGgpKSA6IChwYXJzZUludChkYXRlQVllYXIpIC0gcGFyc2VJbnQoZGF0ZUJZZWFyKSk7XG4gICAgICAgIH0pXG4gICAgICAgIHNvcnRlZEtleS5mb3JFYWNoKGtleSA9PiB7XG4gICAgICAgICAgc29ydGVkTWFwW2tleV0gPSByYW5nZU9ialtrZXldO1xuICAgICAgICB9KVxuICAgICAgICBicmVhaztcbiAgICAgIGNhc2UgUmFuZ2VGaWx0ZXIuUVVBUlRFUkxZOlxuICAgICAgICBsZXQgYWxsUXVhcnRhcnMgPSB0aGlzLmdldFF1YXJ0ZXJzKHN0YXJ0RGF0ZSwgZW5kRGF0ZSk7XG4gICAgICAgIGRhdGEuZm9yRWFjaCgoZDogYW55KSA9PiB7XG4gICAgICAgICAgICBsZXQgdmFyaWFibGVEYXRlID0gdGhpcy5nZXRGb3JtYXR0ZWREYXRlKGRbZGF0ZVZhcmlhYmxlXSk7XG4gICAgICAgICAgICBsZXQgc2VsUXVhcnRhciA9IGFsbFF1YXJ0YXJzLmZpbHRlcihxdWFydGFyID0+IHtcbiAgICAgICAgICAgICAgbGV0IFtzdGFydFJhbmdlLCBlbmRSYW5nZV0gOiBhbnkgPSBxdWFydGFyLnNwbGl0KFwiIC0gXCIpO1xuICAgICAgICAgICAgICBzdGFydFJhbmdlID0gdGhpcy5nZXRGb3JtYXR0ZWREYXRlKHN0YXJ0UmFuZ2UsRGF0ZUZvcm1hdC5ERF9NTV9ZWVlZKTtcbiAgICAgICAgICAgICAgZW5kUmFuZ2UgPSB0aGlzLmdldEZvcm1hdHRlZERhdGUoZW5kUmFuZ2UsIERhdGVGb3JtYXQuRERfTU1fWVlZWSk7XG4gICAgICAgICAgICAgIGlmKHZhcmlhYmxlRGF0ZS5nZXRUaW1lKCkgPj0gc3RhcnRSYW5nZS5nZXRUaW1lKCkgJiYgdmFyaWFibGVEYXRlLmdldFRpbWUoKSA8PSBlbmRSYW5nZS5nZXRUaW1lKCkpe1xuICAgICAgICAgICAgICAgIHJldHVybiB0cnVlO1xuICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgIHJldHVybiBmYWxzZTtcbiAgICAgICAgICAgIH0pXG4gICAgICAgICAgICBpZiAoc2VsUXVhcnRhci5sZW5ndGggPiAwKXtcbiAgICAgICAgICAgICAgICBkLnB1dChcIioqKnF1YXRhcioqKlwiLCBzZWxRdWFydGFyWzBdKTtcbiAgICAgICAgICAgIH1lbHNlIHtcbiAgICAgICAgICAgICAgICBkLnB1dChcIioqKnF1YXRhcioqKlwiLCBcIlwiKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGlmKHRoaXMuYXBwbHlEYXRhRmlsdGVyVHJlbmRzKGQsZmlsdGVyLHhBeGlzLGdyYXBoSWQpKXtcbiAgICAgICAgICAgICAgICBmaWx0ZXJlZERhdGEucHVzaChkKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfSk7XG4gICAgICAgIHJhbmdlT2JqID0gbG9kYXNoLmdyb3VwQnkoZGF0YSwgXCIqKipxdWF0YXIqKipcIik7XG4gICAgICAgIHNvcnRlZEtleSA9IE9iamVjdC5rZXlzKHJhbmdlT2JqKS5zb3J0KChhICwgYikgPT4ge1xuICAgICAgICAgIGxldCBkYXRlQSA9IHRoaXMuZ2V0Rm9ybWF0dGVkRGF0ZShhLnNwbGl0KFwiIC0gXCIpWzBdLCBEYXRlRm9ybWF0LkREX01NX1lZWVkpO1xuICAgICAgICAgIGxldCBkYXRlQiA9IHRoaXMuZ2V0Rm9ybWF0dGVkRGF0ZShiLnNwbGl0KFwiIC0gXCIpWzBdLCBEYXRlRm9ybWF0LkREX01NX1lZWVkpO1xuICAgICAgICAgIHJldHVybiBkYXRlQSAtIGRhdGVCO1xuICAgICAgICB9KVxuICAgICAgICBzb3J0ZWRLZXkuZm9yRWFjaChrZXkgPT4ge1xuICAgICAgICAgIHNvcnRlZE1hcFtrZXldID0gcmFuZ2VPYmpba2V5XTtcbiAgICAgICAgfSlcbiAgICAgICAgYnJlYWs7XG4gICAgICBjYXNlIFJhbmdlRmlsdGVyLllFQVJMWTpcbiAgICAgICAgZGF0YS5mb3JFYWNoKChkOiBhbnkpID0+IHtcbiAgICAgICAgICBsZXQgZGF0ZVZhbHVlID0gZFtkYXRlVmFyaWFibGVdLnNwbGl0KFwiIFwiKVsyXTtcbiAgICAgICAgICBkW1wiKioqeWVhcioqKlwiXSA9IGRhdGVWYWx1ZTtcbiAgICAgICAgICBpZih0aGlzLmFwcGx5RGF0YUZpbHRlclRyZW5kcyhkLGZpbHRlcix4QXhpcyxncmFwaElkKSl7XG4gICAgICAgICAgICBmaWx0ZXJlZERhdGEucHVzaChkKTtcbiAgICAgICAgICB9XG4gICAgICAgIH0pXG4gICAgICAgIHJhbmdlT2JqID0gbG9kYXNoLmdyb3VwQnkoZGF0YSwgXCIqKip5ZWFyKioqXCIpO1xuICAgICAgICBzb3J0ZWRLZXkgPSBPYmplY3Qua2V5cyhyYW5nZU9iaikuc29ydCgoYSAsIGIpID0+IHtcbiAgICAgICAgICBsZXQgZGF0ZUFZZWFyID0gYTtcbiAgICAgICAgICBsZXQgZGF0ZUJZZWFyID0gYjtcbiAgICAgICAgICByZXR1cm4gKHBhcnNlSW50KGRhdGVBWWVhcikgLSBwYXJzZUludChkYXRlQlllYXIpKTtcbiAgICAgICAgfSlcbiAgICAgICAgc29ydGVkS2V5LmZvckVhY2goa2V5ID0+IHtcbiAgICAgICAgICBzb3J0ZWRNYXBba2V5XSA9IHJhbmdlT2JqW2tleV07XG4gICAgICAgIH0pXG4gICAgICAgIGJyZWFrO1xuICAgIH1cbiAgICByZXR1cm4gc29ydGVkTWFwO1xuICB9XG5cbiAgcHJpdmF0ZSBhcHBseURhdGFGaWx0ZXJUcmVuZHMoZGF0YTogYW55LCBmaWx0ZXI6IEZpbHRlcnMsIHhBeGlzOiBhbnkgLGdyYXBoSWQ6IGFueSkge1xuXG4gICAgbGV0IHNlbFhGaWx0ZXIgPSBmaWx0ZXIueEF4aXMuZmlsdGVyKGYgPT4gZi52YXJpYWJsZU5hbWUgPT0geEF4aXMpO1xuICAgIGxldCBpc1ZhbGlkID0gc2VsWEZpbHRlci5sZW5ndGggPT0gMDtcbiAgICBpZiAoc2VsWEZpbHRlci5sZW5ndGggPiAwKSB7XG4gICAgICAgIGxldCBmaWx0ZXJUb0FwcGx5ID0gc2VsWEZpbHRlclswXTtcbiAgICAgICAgbGV0IHZhbHVlcyA9ICBmaWx0ZXJUb0FwcGx5LnZhbHVlcztcbiAgICAgICAgbGV0IGRhdGFWYWx1ZSA9IGRhdGFbZmlsdGVyVG9BcHBseS52YXJpYWJsZU5hbWVdO1xuICAgICAgICBsZXQgdmFyaWFibGVUeXBlID0gZmlsdGVyVG9BcHBseS52YXJpYWJsZVR5cGU7XG4gICAgICAgIHN3aXRjaCAoZmlsdGVyVG9BcHBseS5maWx0ZXJUeXBlKSB7XG4gICAgICAgICAgICBjYXNlIFwiSU5cIjpcbiAgICAgICAgICAgICAgICBpZiAodmFsdWVzLmluY2x1ZGVzKGRhdGFWYWx1ZS50b1N0cmluZygpKSkge1xuICAgICAgICAgICAgICAgICAgICBpc1ZhbGlkID0gdHJ1ZTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICBjYXNlIFwiTk9UIElOXCI6XG4gICAgICAgICAgICAgICAgaWYgKCF2YWx1ZXMuaW5jbHVkZXMoZGF0YVZhbHVlLnRvU3RyaW5nKCkpKSB7XG4gICAgICAgICAgICAgICAgICAgIGlzVmFsaWQgPSB0cnVlO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgIGNhc2UgXCI+XCI6XG4gICAgICAgICAgICAgICAgaWYgKGRhdGFWYWx1ZSA+IHZhbHVlc1swXSkge1xuICAgICAgICAgICAgICAgICAgICBpc1ZhbGlkID0gdHJ1ZTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICBjYXNlIFwiPFwiOlxuICAgICAgICAgICAgICAgIGlmIChkYXRhVmFsdWUgPCB2YWx1ZXNbMF0pIHtcbiAgICAgICAgICAgICAgICAgICAgaXNWYWxpZCA9IHRydWU7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgY2FzZSBcIj49XCI6XG4gICAgICAgICAgICAgICAgaWYgKGRhdGFWYWx1ZSA+PSB2YWx1ZXNbMF0pIHtcbiAgICAgICAgICAgICAgICAgICAgaXNWYWxpZCA9IHRydWU7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgY2FzZSBcIjw9XCI6XG4gICAgICAgICAgICAgICAgaWYgKGRhdGFWYWx1ZSA8PSB2YWx1ZXMpIHtcbiAgICAgICAgICAgICAgICAgICAgaXNWYWxpZCA9IHRydWU7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgY2FzZSBcIj09XCI6XG4gICAgICAgICAgICAgICAgaWYgKGRhdGFWYWx1ZSA9PSB2YWx1ZXMpIHtcbiAgICAgICAgICAgICAgICAgICAgaXNWYWxpZCA9IHRydWU7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgY2FzZSBcIiE9XCI6XG4gICAgICAgICAgICAgICAgaWYgKGRhdGFWYWx1ZSAhPSB2YWx1ZXNbMF0pIHtcbiAgICAgICAgICAgICAgICAgICAgaXNWYWxpZCA9IGZhbHNlO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgIGNhc2UgXCJiZXRcIjpcbiAgICAgICAgICAgICAgICBpZiAoZGF0YVZhbHVlID49IHZhbHVlc1swXSAmJiBkYXRhVmFsdWUgPCB2YWx1ZXNbMV0pIHtcbiAgICAgICAgICAgICAgICAgICAgaXNWYWxpZCA9IHRydWU7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgICAgIGNhc2UgRmlsdGVyVHlwZXMuQkVGT1JFOlxuICAgICAgICAgICAgICAgIGlmICh2YXJpYWJsZVR5cGUgPT0gRGF0YVR5cGUuREFURSkge1xuICAgICAgICAgICAgICAgICAgbGV0IG9wZXJhbmQxID0gdGhpcy5nZXRGb3JtYXR0ZWREYXRlKFxuICAgICAgICAgICAgICAgICAgICBkYXRhVmFsdWUsXG4gICAgICAgICAgICAgICAgICAgIGZpbHRlclRvQXBwbHkuZm9ybWF0XG4gICAgICAgICAgICAgICAgICApO1xuICAgICAgICAgICAgICAgICAgbGV0IG9wZXJhbmQyID0gbmV3IERhdGUodmFsdWVzWzBdKTtcbiAgICAgICAgICAgICAgICAgIGlmIChvcGVyYW5kMSA8IG9wZXJhbmQyKSB7XG4gICAgICAgICAgICAgICAgICAgIGlzVmFsaWQgPSB0cnVlO1xuICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgICBsZXQgY3VyclNlY29uZHMgPSB0aGlzLmdldEZvcm1hdHRlZERhdGUoXG4gICAgICAgICAgICAgICAgICAgIGRhdGFWYWx1ZSxcbiAgICAgICAgICAgICAgICAgICAgZmlsdGVyVG9BcHBseS5mb3JtYXRcbiAgICAgICAgICAgICAgICAgICk7XG4gICAgICAgICAgICAgICAgICBsZXQgW2hvdXIsIG1pbl0gPSB2YWx1ZXNbMF1cbiAgICAgICAgICAgICAgICAgICAgLnNwbGl0KCc6JylcbiAgICAgICAgICAgICAgICAgICAgLm1hcCgoZWw6IGFueSkgPT4gcGFyc2VJbnQoZWwpKTtcbiAgICAgICAgICAgICAgICAgIGxldCBjb21wYXJlZFNlYyA9IGhvdXIgKiA2MCAqIDYwICsgbWluICogNjA7XG4gICAgICAgICAgICAgICAgICBpZiAoY3VyclNlY29uZHMgPCBjb21wYXJlZFNlYykge1xuICAgICAgICAgICAgICAgICAgICBpc1ZhbGlkID0gdHJ1ZTtcbiAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICAgIGNhc2UgRmlsdGVyVHlwZXMuQUZURVI6XG4gICAgICAgICAgICAgICAgaWYgKHZhcmlhYmxlVHlwZSA9PSBEYXRhVHlwZS5EQVRFKSB7XG4gICAgICAgICAgICAgICAgICBsZXQgb3BlcmFuZDEgPSB0aGlzLmdldEZvcm1hdHRlZERhdGUoXG4gICAgICAgICAgICAgICAgICAgIGRhdGFWYWx1ZSxcbiAgICAgICAgICAgICAgICAgICAgZmlsdGVyVG9BcHBseS5mb3JtYXRcbiAgICAgICAgICAgICAgICAgICk7XG4gICAgICAgICAgICAgICAgICBsZXQgb3BlcmFuZDIgPSBuZXcgRGF0ZSh2YWx1ZXNbMF0pO1xuICAgICAgICAgICAgICAgICAgaWYgKG9wZXJhbmQxID4gb3BlcmFuZDIpIHtcbiAgICAgICAgICAgICAgICAgICAgaXNWYWxpZCA9IHRydWU7XG4gICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICAgIGxldCBjdXJyU2Vjb25kcyA9IHRoaXMuZ2V0Rm9ybWF0dGVkRGF0ZShcbiAgICAgICAgICAgICAgICAgICAgZGF0YVZhbHVlLFxuICAgICAgICAgICAgICAgICAgICBmaWx0ZXJUb0FwcGx5LmZvcm1hdFxuICAgICAgICAgICAgICAgICAgKTtcbiAgICAgICAgICAgICAgICAgIGxldCBbaG91ciwgbWluXSA9IHZhbHVlc1swXVxuICAgICAgICAgICAgICAgICAgICAuc3BsaXQoJzonKVxuICAgICAgICAgICAgICAgICAgICAubWFwKChlbDogYW55KSA9PiBwYXJzZUludChlbCkpO1xuICAgICAgICAgICAgICAgICAgbGV0IGNvbXBhcmVkU2VjID0gaG91ciAqIDYwICogNjAgKyBtaW4gKiA2MDtcbiAgICAgICAgICAgICAgICAgIGlmIChjdXJyU2Vjb25kcyA+IGNvbXBhcmVkU2VjKSB7XG4gICAgICAgICAgICAgICAgICAgIGlzVmFsaWQgPSB0cnVlO1xuICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgICAgY2FzZSBGaWx0ZXJUeXBlcy5CRVRXRUVOOlxuICAgICAgICAgICAgICAgIGlmICh2YXJpYWJsZVR5cGUgPT0gRGF0YVR5cGUuREFURSkge1xuICAgICAgICAgICAgICAgICAgbGV0IG9wZXJhbmQxID0gdGhpcy5nZXRGb3JtYXR0ZWREYXRlKFxuICAgICAgICAgICAgICAgICAgICBkYXRhVmFsdWUsXG4gICAgICAgICAgICAgICAgICAgIGZpbHRlclRvQXBwbHkuZm9ybWF0XG4gICAgICAgICAgICAgICAgICApO1xuICAgICAgICAgICAgICAgICAgbGV0IG9wZXJhbmQyID0gbmV3IERhdGUodmFsdWVzWzBdKTtcbiAgICAgICAgICAgICAgICAgIGxldCBvcGVyYW5kMyA9IG5ldyBEYXRlKHZhbHVlc1sxXSk7XG4gICAgICAgICAgICAgICAgICBpZiAob3BlcmFuZDEgPj0gb3BlcmFuZDIgJiYgb3BlcmFuZDEgPCBvcGVyYW5kMykge1xuICAgICAgICAgICAgICAgICAgICBpc1ZhbGlkID0gdHJ1ZTtcbiAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgICAgbGV0IGN1cnJTZWNvbmRzID0gdGhpcy5nZXRGb3JtYXR0ZWREYXRlKFxuICAgICAgICAgICAgICAgICAgICBkYXRhVmFsdWUsXG4gICAgICAgICAgICAgICAgICAgIGZpbHRlclRvQXBwbHkuZm9ybWF0XG4gICAgICAgICAgICAgICAgICApO1xuICAgICAgICAgICAgICAgICAgbGV0IFtob3VyLCBtaW5dID0gdmFsdWVzWzBdXG4gICAgICAgICAgICAgICAgICAgIC5zcGxpdCgnOicpXG4gICAgICAgICAgICAgICAgICAgIC5tYXAoKGVsOiBhbnkpID0+IHBhcnNlSW50KGVsKSk7XG4gICAgICAgICAgICAgICAgICBsZXQgW2VuZGhvdXIsIGVuZG1pbl0gPSB2YWx1ZXNbMV1cbiAgICAgICAgICAgICAgICAgIC5zcGxpdCgnOicpXG4gICAgICAgICAgICAgICAgICAubWFwKChlbDogYW55KSA9PiBwYXJzZUludChlbCkpO1xuICAgICAgICAgICAgICAgICAgbGV0IGNvbXBhcmVkU2VjID0gaG91ciAqIDYwICogNjAgKyBtaW4gKiA2MDtcbiAgICAgICAgICAgICAgICAgIGxldCBlbmRDb21wYXJlZFNlYyA9IGVuZGhvdXIgKiA2MCAqIDYwICsgZW5kbWluICogNjA7XG4gICAgICAgICAgICAgICAgICBpZiAoIGN1cnJTZWNvbmRzID49IGNvbXBhcmVkU2VjICYmXG4gICAgICAgICAgICAgICAgICAgIGN1cnJTZWNvbmRzIDwgZW5kQ29tcGFyZWRTZWMpIHtcbiAgICAgICAgICAgICAgICAgICAgaXNWYWxpZCA9IHRydWU7XG4gICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICB9XG4gICAgfVxuICAgIC8vIGlmIChpc1ZhbGlkICYmIGZpbHRlci5jdXN0b21GaWx0ZXIubGVuZ3RoID4gMCkge1xuICAgIC8vICAgICBpc1ZhbGlkID0gdGhpcy5hcHBseUN1c3RvbUZpbHRlcihkYXRhLCBmaWx0ZXIpO1xuICAgIC8vIH1cbiAgICByZXR1cm4gaXNWYWxpZDtcbn1cbn1cbiJdfQ==