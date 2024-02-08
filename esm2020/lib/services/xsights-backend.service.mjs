import { Injectable } from '@angular/core';
import * as Highcharts from 'highcharts';
import Drilldown from 'highcharts/modules/drilldown';
import * as lodash from 'lodash';
import HC_exporting from 'highcharts/modules/exporting';
import offlineExporting from 'highcharts/modules/offline-exporting';
import accessibility from 'highcharts/modules/accessibility';
import highStocks from 'highcharts/modules/stock';
import * as FileSave from 'file-saver';
import { GraphTypes, } from '../data-types/graph-interfaces';
import { DataPopupComponent } from '../components/data-popup/data-popup.component';
import Swal from 'sweetalert2';
import { HttpEventType } from '@angular/common/http';
import * as i0 from "@angular/core";
import * as i1 from "@ng-bootstrap/ng-bootstrap";
import * as i2 from "../services/data.service";
import * as i3 from "@angular/common";
HC_exporting(Highcharts);
offlineExporting(Highcharts);
// exportData(Highcharts);
highStocks(Highcharts);
accessibility(Highcharts);
Drilldown(Highcharts);
export var WidgetType;
(function (WidgetType) {
    WidgetType["GRAPH"] = "graph";
    WidgetType["TREND"] = "trend";
    WidgetType["PIVOT_TABLE"] = "pivot_table";
})(WidgetType || (WidgetType = {}));
export class XsightsBackendService {
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
XsightsBackendService.ɵfac = i0.ɵɵngDeclareFactory({ minVersion: "12.0.0", version: "13.0.3", ngImport: i0, type: XsightsBackendService, deps: [{ token: i1.NgbModal }, { token: i1.NgbModalConfig }, { token: i2.DataService }, { token: i3.DatePipe }], target: i0.ɵɵFactoryTarget.Injectable });
XsightsBackendService.ɵprov = i0.ɵɵngDeclareInjectable({ minVersion: "12.0.0", version: "13.0.3", ngImport: i0, type: XsightsBackendService, providedIn: 'root' });
i0.ɵɵngDeclareClassMetadata({ minVersion: "12.0.0", version: "13.0.3", ngImport: i0, type: XsightsBackendService, decorators: [{
            type: Injectable,
            args: [{
                    providedIn: 'root'
                }]
        }], ctorParameters: function () { return [{ type: i1.NgbModal }, { type: i1.NgbModalConfig }, { type: i2.DataService }, { type: i3.DatePipe }]; } });
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoieHNpZ2h0cy1iYWNrZW5kLnNlcnZpY2UuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi8uLi8uLi9wcm9qZWN0cy94LXNpZ2h0cy1jb3JlL3NyYy9saWIvc2VydmljZXMveHNpZ2h0cy1iYWNrZW5kLnNlcnZpY2UudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUEsT0FBTyxFQUFFLFVBQVUsRUFBRSxNQUFNLGVBQWUsQ0FBQztBQUUzQyxPQUFPLEtBQUssVUFBVSxNQUFNLFlBQVksQ0FBQztBQUN6QyxPQUFPLFNBQVMsTUFBTSw4QkFBOEIsQ0FBQztBQUNyRCxPQUFPLEtBQUssTUFBTSxNQUFNLFFBQVEsQ0FBQztBQUNqQyxPQUFPLFlBQVksTUFBTSw4QkFBOEIsQ0FBQztBQUN4RCxPQUFPLGdCQUFnQixNQUFNLHNDQUFzQyxDQUFDO0FBRXBFLE9BQU8sYUFBYSxNQUFNLGtDQUFrQyxDQUFDO0FBQzdELE9BQU8sVUFBVSxNQUFNLDBCQUEwQixDQUFDO0FBQ2xELE9BQU8sS0FBSyxRQUFRLE1BQU0sWUFBWSxDQUFDO0FBSXZDLE9BQU8sRUFFTCxVQUFVLEdBRVgsTUFBTSxnQ0FBZ0MsQ0FBQztBQWlDeEMsT0FBTyxFQUFFLGtCQUFrQixFQUFFLE1BQU0sK0NBQStDLENBQUM7QUFHbkYsT0FBTyxJQUFJLE1BQU0sYUFBYSxDQUFDO0FBQy9CLE9BQU8sRUFBYSxhQUFhLEVBQUUsTUFBTSxzQkFBc0IsQ0FBQzs7Ozs7QUFFaEUsWUFBWSxDQUFDLFVBQVUsQ0FBQyxDQUFDO0FBQ3pCLGdCQUFnQixDQUFDLFVBQVUsQ0FBQyxDQUFDO0FBQzdCLDBCQUEwQjtBQUMxQixVQUFVLENBQUMsVUFBVSxDQUFDLENBQUM7QUFDdkIsYUFBYSxDQUFDLFVBQVUsQ0FBQyxDQUFDO0FBQzFCLFNBQVMsQ0FBQyxVQUFVLENBQUMsQ0FBQztBQUV0QixNQUFNLENBQU4sSUFBWSxVQUlYO0FBSkQsV0FBWSxVQUFVO0lBQ3BCLDZCQUFlLENBQUE7SUFDZiw2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QztpQkFDRjthQUNGO1lBQ0QsS0FBSyxFQUFFO2dCQUNMLElBQUksRUFBRSxVQUFVO2dCQUNoQixNQUFNLEVBQUU7b0JBQ04sS0FBSyxFQUFFO3dCQUNMLEtBQUssRUFBRSxLQUFLO3dCQUNaLGNBQWMsRUFBRSxNQUFNO3dCQUN0QixXQUFXLEVBQUUsS0FBSztxQkFDbkI7aUJBQ0Y7Z0JBQ0QsR0FBRyxFQUFFLENBQUM7Z0JBQ04sYUFBYSxFQUFFLEtBQUs7Z0JBQ3BCLFNBQVMsRUFBRTtvQkFDVCxPQUFPLEVBQUUsSUFBSTtpQkFDZDthQUNGO1lBQ0QsS0FBSyxFQUFFO2dCQUNMO29CQUNFLFFBQVEsRUFBRSxJQUFJO29CQUNkLEtBQUssRUFBRTt3QkFDTCxJQUFJLEVBQUUsSUFBSTtxQkFDWDtpQkFDRjthQUNGO1lBQ0QsTUFBTSxFQUFFLElBQUksQ0FBQyxNQUFNLENBQUMsT0FBTyxDQUFDLENBQUMsU0FBUztTQUN2QyxDQUFDO0lBQ0osQ0FBQzs7a0hBMTZCVSxxQkFBcUI7c0hBQXJCLHFCQUFxQixjQUZwQixNQUFNOzJGQUVQLHFCQUFxQjtrQkFIakMsVUFBVTttQkFBQztvQkFDVixVQUFVLEVBQUUsTUFBTTtpQkFDbkIiLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgeyBJbmplY3RhYmxlIH0gZnJvbSAnQGFuZ3VsYXIvY29yZSc7XG5pbXBvcnQgeyBOZ2JNb2RhbCwgTmdiTW9kYWxDb25maWcgfSBmcm9tICdAbmctYm9vdHN0cmFwL25nLWJvb3RzdHJhcCc7XG5pbXBvcnQgKiBhcyBIaWdoY2hhcnRzIGZyb20gJ2hpZ2hjaGFydHMnO1xuaW1wb3J0IERyaWxsZG93biBmcm9tICdoaWdoY2hhcnRzL21vZHVsZXMvZHJpbGxkb3duJztcbmltcG9ydCAqIGFzIGxvZGFzaCBmcm9tICdsb2Rhc2gnO1xuaW1wb3J0IEhDX2V4cG9ydGluZyBmcm9tICdoaWdoY2hhcnRzL21vZHVsZXMvZXhwb3J0aW5nJztcbmltcG9ydCBvZmZsaW5lRXhwb3J0aW5nIGZyb20gJ2hpZ2hjaGFydHMvbW9kdWxlcy9vZmZsaW5lLWV4cG9ydGluZyc7XG5pbXBvcnQgZXhwb3J0RGF0YSBmcm9tICdoaWdoY2hhcnRzL21vZHVsZXMvZXhwb3J0LWRhdGEnO1xuaW1wb3J0IGFjY2Vzc2liaWxpdHkgZnJvbSAnaGlnaGNoYXJ0cy9tb2R1bGVzL2FjY2Vzc2liaWxpdHknO1xuaW1wb3J0IGhpZ2hTdG9ja3MgZnJvbSAnaGlnaGNoYXJ0cy9tb2R1bGVzL3N0b2NrJztcbmltcG9ydCAqIGFzIEZpbGVTYXZlIGZyb20gJ2ZpbGUtc2F2ZXInO1xuXG5cbmltcG9ydCBEZWNpbWFsIGZyb20gJ2RlY2ltYWwuanMnO1xuaW1wb3J0IHtcbiAgR3JhcGhEYXRhLFxuICBHcmFwaFR5cGVzLFxuICBHcmFwaExpc3QsXG59IGZyb20gJy4uL2RhdGEtdHlwZXMvZ3JhcGgtaW50ZXJmYWNlcyc7XG5pbXBvcnQge1xuICBSYW5nZUZpbHRlcixcbiAgVHJlbmRzRGF0YSxcbiAgVHJlbmRzTGlzdCxcbn0gZnJvbSAnLi4vZGF0YS10eXBlcy90cmVuZC1pbnRlcmZhY2VzJztcbmltcG9ydCB7XG4gIEFnZ3JlZ2F0aW9uRnVuY3Rpb24sXG4gIEFnZ3JlZ2F0aW9uRnVuY3Rpb25zVHlwZSxcbn0gZnJvbSAnLi4vZGF0YS10eXBlcy9hZ2dyZWdhdGlvbi1pbnRlcmZhY2VzJztcbmltcG9ydCB7XG4gIEN1c3RvbUZpbHRlcixcbiAgQ3VzdG9tRmlsdGVyVHlwZXMsXG4gIEZpbHRlcnMsXG4gIEZpbHRlclR5cGVzLFxufSBmcm9tICcuLi9kYXRhLXR5cGVzL2ZpbHRlci1pbnRlcmZhY2VzJztcbmltcG9ydCB7XG4gIERlcml2ZWRWYXJpYWJsZSxcbiAgRGVyaXZlZFZhcmlhYmxlRmlsdGVyLFxuICBEZXJpdmVkVmFyaWFibGVGaWx0ZXJDb25kaXRpb24sXG59IGZyb20gJy4uL2RhdGEtdHlwZXMvZGVyaXZlZC12YXJpYWJsZS1pbnRlcmZhY2VzJztcbmltcG9ydCB7XG4gIERhdGFGb3JtYXQsXG4gIERhdGFUeXBlLFxuICBEYXRlRm9ybWF0LFxuICBUaW1lRm9ybWF0LFxufSBmcm9tICcuLi9kYXRhLXR5cGVzL3ZhcmlhYmxlLXR5cGVzJztcbmltcG9ydCB7XG4gIEZpZWxkcyxcbiAgUGl2b3RGaWVsZHNBcmVhLFxuICBQaXZvdFRhYmxlRGF0YSxcbn0gZnJvbSAnLi4vZGF0YS10eXBlcy9waXZvdC1pbnRlcmZhY2VzJztcbmltcG9ydCBQaXZvdEdyaWREYXRhU291cmNlIGZyb20gJ2RldmV4dHJlbWUvdWkvcGl2b3RfZ3JpZC9kYXRhX3NvdXJjZSc7XG5pbXBvcnQgeyBEYXRhUG9wdXBDb21wb25lbnQgfSBmcm9tICcuLi9jb21wb25lbnRzL2RhdGEtcG9wdXAvZGF0YS1wb3B1cC5jb21wb25lbnQnO1xuaW1wb3J0IHsgRGF0YVNlcnZpY2UgfSBmcm9tICcuLi9zZXJ2aWNlcy9kYXRhLnNlcnZpY2UnO1xuaW1wb3J0IHsgRGF0ZVBpcGUgfSBmcm9tICdAYW5ndWxhci9jb21tb24nO1xuaW1wb3J0IFN3YWwgZnJvbSAnc3dlZXRhbGVydDInO1xuaW1wb3J0IHsgSHR0cEV2ZW50LCBIdHRwRXZlbnRUeXBlIH0gZnJvbSAnQGFuZ3VsYXIvY29tbW9uL2h0dHAnO1xuXG5IQ19leHBvcnRpbmcoSGlnaGNoYXJ0cyk7XG5vZmZsaW5lRXhwb3J0aW5nKEhpZ2hjaGFydHMpO1xuLy8gZXhwb3J0RGF0YShIaWdoY2hhcnRzKTtcbmhpZ2hTdG9ja3MoSGlnaGNoYXJ0cyk7XG5hY2Nlc3NpYmlsaXR5KEhpZ2hjaGFydHMpO1xuRHJpbGxkb3duKEhpZ2hjaGFydHMpO1xuXG5leHBvcnQgZW51bSBXaWRnZXRUeXBlIHtcbiAgR1JBUEggPSAnZ3JhcGgnLFxuICBUUkVORCA9ICd0cmVuZCcsXG4gIFBJVk9UX1RBQkxFID0gJ3Bpdm90X3RhYmxlJyxcbn1cblxuQEluamVjdGFibGUoe1xuICBwcm92aWRlZEluOiAncm9vdCdcbn0pXG5leHBvcnQgY2xhc3MgWHNpZ2h0c0JhY2tlbmRTZXJ2aWNlIHtcbiAgcHJpdmF0ZSBzeXN0ZW1BcGlzID0gWycxOTgnLCAnMTM4JywgJzI3OSddO1xuICBwcml2YXRlIG1vZGFsRGF0YTogYW55ID0ge307XG4gIHByaXZhdGUgaGlnaGNoYXJ0czogdHlwZW9mIEhpZ2hjaGFydHMgPSBIaWdoY2hhcnRzO1xuICBwcml2YXRlIGRpdlN0eWxlcyA9XG4gICAgJ2Rpc3BsYXk6IGZsZXg7IGp1c3RpZnktY29udGVudDogZmxleC1zdGFydDsgYWxpZ24taXRlbXM6IGNlbnRlcjsgcG9zaXRpb246IGFic29sdXRlOyB0b3A6IDVweDsgbGVmdDogNXB4Oyc7XG4gIHByaXZhdGUgaWNvblN0eWxlcyA9XG4gICAgJ2JvcmRlcjogMnB4IHNvbGlkICNlZWU7IHBhZGRpbmc6IDVweDsgbWluLXdpZHRoOiAyOHB4OyB0ZXh0LWFsaWduOiBjZW50ZXI7IGJvcmRlci1yYWRpdXM6IDhweDsgYmFja2dyb3VuZDogI2NjYzsgYm94LXNoYWRvdzogMnB4IDJweCAycHggI2NjYzsgbWFyZ2luLXJpZ2h0OiAxMHB4Oyc7XG4gIHByaXZhdGUgYnJlYWRjcnVtYlN0eWxlcyA9XG4gICAgJ2JvcmRlcjogMnB4IHNvbGlkICNlZWU7IHBhZGRpbmc6IDVweDsgIGJhY2tncm91bmQ6ICNjY2M7IG1pbi13aWR0aDogMjhweDsgdGV4dC1hbGlnbjogY2VudGVyOyBib3JkZXItcmFkaXVzOiA4cHg7IGRpc3BsYXk6IGZsZXg7IGJveC1zaGFkb3c6IDJweCAycHggMnB4ICNjY2M7IG1hcmdpbi1yaWdodDogMTBweDsnO1xuICBwcml2YXRlIGNyZWRpdFRpdGxlID0gJ1Bvd2VyZWQgYnkgQXhlc3RyYWNrJztcbiAgcHJpdmF0ZSBjcmVkaXRVcmwgPSAnaHR0cHM6Ly93d3cuYXhlc3RyYWNrLmNvbS8nO1xuXG4gIHByaXZhdGUgY2hhcnRzOiBHcmFwaExpc3QgPSB7fTtcbiAgcHJpdmF0ZSB0cmVuZHM6IFRyZW5kc0xpc3QgPSB7fTtcblxuICBjb25zdHJ1Y3RvcihcbiAgICBwcml2YXRlIGRpYWxvZzogTmdiTW9kYWwsXG4gICAgcHJpdmF0ZSBtb2RhbENvbmZpZzogTmdiTW9kYWxDb25maWcsXG4gICAgcHJpdmF0ZSBkYXRhU2VydmljZTogRGF0YVNlcnZpY2UsXG4gICAgcHJpdmF0ZSBkYXRlUGlwZTogRGF0ZVBpcGVcbiAgKSB7XG4gICAgdGhpcy5tb2RhbENvbmZpZy5tb2RhbERpYWxvZ0NsYXNzID0gJ2RhdGFwb3B1cC1kYWlsb2cnO1xuICAgIHRoaXMubW9kYWxDb25maWcud2luZG93Q2xhc3MgPSAnZGF0YXBvcHVwLXdpbmRvdyc7XG4gIH1cblxuICBwdWJsaWMgYnVpbGQoXG4gICAgd2lkZ2V0VHlwZTogV2lkZ2V0VHlwZSxcbiAgICB3aWRnZXREYXRhOiBHcmFwaERhdGEgfCBUcmVuZHNEYXRhIHwgUGl2b3RUYWJsZURhdGFcbiAgKTogUHJvbWlzZTxhbnk+IHtcbiAgICByZXR1cm4gbmV3IFByb21pc2UoKHJlc29sdmUsIHJlamVjdCkgPT4ge1xuICAgICAgc3dpdGNoICh3aWRnZXRUeXBlKSB7XG4gICAgICAgIGNhc2UgV2lkZ2V0VHlwZS5HUkFQSDpcbiAgICAgICAgICByZXNvbHZlKFxuICAgICAgICAgICAgdGhpcy5idWlsZEdyYXBoKHtcbiAgICAgICAgICAgICAgLi4ud2lkZ2V0RGF0YSxcbiAgICAgICAgICAgICAgYnJlYWRDcnVtYjogWydIb21lJ10sXG4gICAgICAgICAgICAgIGN1cnJMZXZlbDogMCxcbiAgICAgICAgICAgICAgcHJldkxldmVsRGF0YTogW10sXG4gICAgICAgICAgICAgIHNlbEtleXM6IFtdLFxuICAgICAgICAgICAgICBvcmRlcjogMCxcbiAgICAgICAgICAgICAgY29sVG9TaG93OiAnJyxcbiAgICAgICAgICAgIH0gYXMgR3JhcGhEYXRhKVxuICAgICAgICAgICk7XG4gICAgICAgICAgYnJlYWs7XG4gICAgICAgIGNhc2UgV2lkZ2V0VHlwZS5UUkVORDpcbiAgICAgICAgICBsZXQgd2lkZ2V0OiBUcmVuZHNEYXRhID0gd2lkZ2V0RGF0YSBhcyBUcmVuZHNEYXRhO1xuICAgICAgICAgIHJlc29sdmUoXG4gICAgICAgICAgICB0aGlzLmJ1aWxkVHJlbmQoe1xuICAgICAgICAgICAgICAuLi53aWRnZXQsXG4gICAgICAgICAgICAgIHJhd0RhdGE6IHdpZGdldC5ncmFwaERhdGEsXG4gICAgICAgICAgICAgIGN1cnJMZXZlbDogMSxcbiAgICAgICAgICAgICAgb3JkZXI6IDAsXG4gICAgICAgICAgICAgIHByZXZMZXZlbERhdGE6IFtdLFxuICAgICAgICAgICAgfSBhcyBUcmVuZHNEYXRhKVxuICAgICAgICAgICk7XG4gICAgICAgICAgYnJlYWs7XG4gICAgICB9XG4gICAgfSk7XG4gIH1cblxuICAvL0dyYXBoIEZ1bmN0aW9uXG4gIHByaXZhdGUgYXN5bmMgYnVpbGRHcmFwaChncmFwaERhdGE6IEdyYXBoRGF0YSk6IFByb21pc2U8Ym9vbGVhbj4ge1xuXG4gICAgLy9TZXQgR3JhcGhPYmplY3Qgd2l0aCBHcmFwaElkXG4gICAgdGhpcy5jaGFydHNbZ3JhcGhEYXRhLmdyYXBoSWRdID0gZ3JhcGhEYXRhO1xuICAgIGlmICh0aGlzLmNoYXJ0c1tncmFwaERhdGEuZ3JhcGhJZF0ucm93c1t0aGlzLmNoYXJ0c1tncmFwaERhdGEuZ3JhcGhJZF0uY3VyckxldmVsXSA9PSAnKioqTEFCRUwqKionKSB7XG4gICAgICAvL0NyZWF0ZSBMYWJlbCBCbG9ja1xuICAgICAgbGV0IHJlc3BvbnNlID0gYXdhaXQgdGhpcy5wdWJsaXNoTGFiZWwoZ3JhcGhEYXRhLmdyYXBoSWQpO1xuICAgICAgLy9EaXNwYXRjaCBhZnRlciBidWlsZCBldmVudFxuICAgICAgcmV0dXJuIHJlc3BvbnNlO1xuICAgIH0gZWxzZSB7XG4gICAgICAvL0NyZWF0ZSBHcmFwaFxuICAgICAgbGV0IHJlc3BvbnNlID0gYXdhaXQgdGhpcy5zdGFydEdyYXBoQnVpbGRlcihncmFwaERhdGEuZ3JhcGhJZCk7XG4gICAgICAvL0Rpc3BhdGNoIGFmdGVyIGJ1aWxkIGV2ZW50XG4gICAgICByZXR1cm4gcmVzcG9uc2U7XG4gICAgfVxuICB9XG5cbiAgcHJpdmF0ZSBhc3luYyBwdWJsaXNoTGFiZWwoZ3JhcGhJZDogc3RyaW5nKSB7XG4gICAgLy9GbHVzaCBDb250ZW50IG9mIEdyYXBoIERpdlxuICAgIGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3IoJyMnICsgZ3JhcGhJZCkhLmlubmVySFRNTCA9ICcnO1xuXG4gICAgLy9MYWJlbHMgRGF0YSBjcmVhdGlvblxuICAgIGxldCBodG1sRGl2ID0gdGhpcy5jaGFydHNbZ3JhcGhJZF0uZ3JhcGhEYXRhLm1hcCgoeTogYW55LCB5SW5kZXg6YW55KSA9PiB7XG4gICAgICByZXR1cm4ge1xuICAgICAgICBsYWJlbDogeS5sYWJlbCxcbiAgICAgICAgdmFsdWU6IHkudmFsdWVcbiAgICAgIH07XG4gICAgfSk7XG5cbiAgICAvL0NyZWF0aW5nIExhYmVsIEh0bWwgRFVNUFxuICAgIGxldCBodG1sID0gYFxuICAgIDxkaXYgY2xhc3M9XCJjYXJkXCIgc3R5bGU9XCJwYWRkaW5nLXRvcDogMyU7IHBhZGRpbmctYm90dG9tOiAzJTsgd2lkdGg6IGluaGVyaXQ7XCI+XG4gICAgJHtcbiAgICAgIGh0bWxEaXYubGVuZ3RoID09IDFcbiAgICAgICAgPyBgPGgzIHN0eWxlPVwidGV4dC1hbGlnbjogY2VudGVyO1wiPiR7dGhpcy5jaGFydHNbZ3JhcGhJZF0uZ3JhcGhUaXRsZX08L2gzPmBcbiAgICAgICAgOiBgYFxuICAgIH1cbiAgICA8ZGl2IGNsYXNzPVwiZ3JhcGgtbGFiZWxcIiA+XG4gICAgJHtodG1sRGl2XG4gICAgICAubWFwKFxuICAgICAgICAoZDogYW55LCBpbmRleDogYW55KSA9PiBgXG4gICAgICAgIDxkaXYgY2xhc3M9XCJsYWJlbC1pdGVtXCIgJHtcbiAgICAgICAgICB0aGlzLmNoYXJ0c1tncmFwaElkXS5jb2xvcnNbaW5kZXhdICE9IHVuZGVmaW5lZFxuICAgICAgICAgICAgPyBgc3R5bGU9XCJiYWNrZ3JvdW5kLWNvbG9yOiAke3RoaXMuY2hhcnRzW2dyYXBoSWRdLmNvbG9yc1tpbmRleF19XCJgXG4gICAgICAgICAgICA6ICcnXG4gICAgICAgIH0gaWQ9XCJjYXJkLWdyYXBoLSR7Z3JhcGhJZH1cIiBkYXRhPVwiJHtcbiAgICAgICAgICB0aGlzLmNoYXJ0c1tncmFwaElkXS5jb2x1bW5zW2luZGV4XVxuICAgICAgICB9XCI+XG4gICAgICAgICAgPGgzIHN0eWxlPVwiJHt0aGlzLmNoYXJ0c1tncmFwaElkXS5ncmFwaERhdGEubGVuZ3RoID09IDEgPyAnZm9udC1zaXplOiAxOHB4OycgOiAnJ31cIiBkYXRhPVwiJHtcbiAgICAgICAgICB0aGlzLmNoYXJ0c1tncmFwaElkXS5jb2x1bW5zW2luZGV4XVxuICAgICAgICB9XCI+PGIgZGF0YT1cIiR7dGhpcy5jaGFydHNbZ3JhcGhJZF0uY29sdW1uc1tpbmRleF19XCI+JHtNYXRoLnJvdW5kKFxuICAgICAgICAgIGQudmFsdWVcbiAgICAgICAgKX08L2I+PC9oMz5cbiAgICAgICAgICAke1xuICAgICAgICAgICAgdGhpcy5jaGFydHNbZ3JhcGhJZF0uZ3JhcGhEYXRhLmxlbmd0aCA+IDFcbiAgICAgICAgICAgICAgPyBgPGgzIGRhdGE9XCIke3RoaXMuY2hhcnRzW2dyYXBoSWRdLmNvbHVtbnNbaW5kZXhdfVwiPmAgK1xuICAgICAgICAgICAgICAgIGQubGFiZWwgK1xuICAgICAgICAgICAgICAgICc8L2gzPidcbiAgICAgICAgICAgICAgOiAnJ1xuICAgICAgICAgIH1cbiAgICAgICAgPC9kaXY+XG5cbiAgICAgICAgYFxuICAgICAgKVxuICAgICAgLmpvaW4oJycpfVxuICAgICAgICA8L2Rpdj5cbiAgICA8L2Rpdj5gO1xuXG4gICAgLy9SZW5kZXJpbmcgTGFiZWwgSFRNTCBEVU1QIG92ZXIgZG9jdW1lbnRcbiAgICBkb2N1bWVudC5xdWVyeVNlbGVjdG9yKCcjJyArIGdyYXBoSWQpIS5pbm5lckhUTUwgPSBodG1sO1xuXG4gICAgbGV0IF9zZWxmID0gdGhpcztcblxuICAgIC8vTGFiZWwgQ2xpY2sgaGFuZGxlclxuICAgIGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3JBbGwoJyNjYXJkLWdyYXBoLScgKyBncmFwaElkKS5mb3JFYWNoKChjYXJkKSA9PlxuICAgICAgY2FyZC5hZGRFdmVudExpc3RlbmVyKCdjbGljaycsIGZ1bmN0aW9uIChlOiBhbnkpIHtcbiAgICAgICAgX3NlbGYuY2hhcnRzW2dyYXBoSWRdLmN1cnJMZXZlbCArPSAxO1xuICAgICAgICBfc2VsZi5jaGFydHNbZ3JhcGhJZF0ucHJldkxldmVsRGF0YS5wdXNoKF9zZWxmLmNoYXJ0c1tncmFwaElkXS5ncmFwaERhdGEpO1xuICAgICAgICBsZXQgY29sVG9TaG93ID0gZS50YXJnZXQuZ2V0QXR0cmlidXRlKCdkYXRhJyk7XG4gICAgICAgIF9zZWxmLmNoYXJ0c1tncmFwaElkXS5icmVhZENydW1iLnB1c2goY29sVG9TaG93KTtcbiAgICAgICAgbGV0IGRhdGFPYmogPSB7XG4gICAgICAgICAgZ3JhcGhJZDogZ3JhcGhJZC5zcGxpdChcIi1cIilbMV0sXG4gICAgICAgICAgY3VyckxldmVsOiBfc2VsZi5jaGFydHNbZ3JhcGhJZF0uY3VyckxldmVsLFxuICAgICAgICAgIGNvbElkOiBudWxsLFxuICAgICAgICAgIHNlbEtleTogW10sXG4gICAgICAgICAgY29sVG9TaG93OiBjb2xUb1Nob3csXG4gICAgICAgICAgZGlyZWN0aW9uOiAwLFxuICAgICAgICAgIGRhdGFGaWx0ZXI6IF9zZWxmLmNoYXJ0c1tncmFwaElkXS5kYXNoYm9hcmRGaWx0ZXIsXG4gICAgICAgICAgYWRtaW5JZDogX3NlbGYuY2hhcnRzW2dyYXBoSWRdLmFkbWluSWQsXG4gICAgICAgICAgc2hhcmVpZDogX3NlbGYuY2hhcnRzW2dyYXBoSWRdLnNoYXJlaWQgPz8gbnVsbCxcbiAgICAgICAgICBzdGFydERhdGU6IF9zZWxmLmNoYXJ0c1tncmFwaElkXS5yYW5nZSEuc3RhcnREYXRlID8/IG51bGwsXG4gICAgICAgICAgZW5kRGF0ZTogX3NlbGYuY2hhcnRzW2dyYXBoSWRdLnJhbmdlIS5lbmREYXRlID8/IG51bGxcbiAgICAgICAgfVxuICAgICAgICBTd2FsLmZpcmUoe1xuICAgICAgICAgIHRleHQ6IFwiUGxlYXNlIFdhaXQuLi5cIixcbiAgICAgICAgICBhbGxvd091dHNpZGVDbGljazogZmFsc2VcbiAgICAgICAgfSlcbiAgICAgICAgU3dhbC5zaG93TG9hZGluZygpO1xuICAgICAgICBfc2VsZi5kYXRhU2VydmljZS5nZXRHcmFwaERyaWxsZG93bkJ5SWQoZGF0YU9iaikudGhlbigocmVzIDogYW55KSA9PiB7XG4gICAgICAgICAgU3dhbC5oaWRlTG9hZGluZygpO1xuICAgICAgICAgIFN3YWwuY2xvc2UoKTtcbiAgICAgICAgICBpZiAoX3NlbGYuY2hhcnRzW2dyYXBoSWRdLnJvd3MubGVuZ3RoID09IDEpIHtcbiAgICAgICAgICAgIC8vUmVuZGVyaW5nIExhc3QgbGV2ZWwgQ29tcG9uZW50LCBJbnRlZ2VyIHNvcnRpbmdEaXJlY3Rpb25cbiAgICAgICAgICAgIF9zZWxmLmRhdGFTZXJ2aWNlLnNldE1vZGFsRGF0YSh7XG4gICAgICAgICAgICAgIGNvbFRvVmlldzogX3NlbGYuY2hhcnRzW2dyYXBoSWRdLmxhc3RMZXZlbENvbHVtbnMsXG4gICAgICAgICAgICAgIHJlZkRhdGE6IHJlcy5kYXRhLFxuICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICBsZXQgbW9kYWxPcHRpb25zOiBhbnkgPSB7XG4gICAgICAgICAgICAgIHBhbmVsQ2xhc3M6ICdkYXRhUG9wdXAtbW9kYWwnLFxuICAgICAgICAgICAgICBiYWNrZHJvcENsYXNzOiAnbW9kYWwtYmFja2Ryb3AnLFxuICAgICAgICAgICAgfTtcbiAgICAgICAgICAgIF9zZWxmLmRpYWxvZy5vcGVuKERhdGFQb3B1cENvbXBvbmVudCwgbW9kYWxPcHRpb25zKTtcbiAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgLy9GbHVzaCBMYWJlbCBDb250ZW50IGZyb20gZG9jdW1lbnRcbiAgICAgICAgICAgIGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3IoJyMnICsgZ3JhcGhJZCkhLmlubmVySFRNTCA9ICcnO1xuICAgICAgICAgICAgXG4gICAgICAgICAgICBfc2VsZi5jaGFydHNbZ3JhcGhJZF0uZ3JhcGhEYXRhID0gcmVzLmRhdGE7XG4gICAgICAgICAgICAvL0dlbmVyYXRpbmcgQ2hpbGQgR3JhcGggb2YgTGFiZWxcbiAgICAgICAgICAgIF9zZWxmLnN0YXJ0R3JhcGhCdWlsZGVyKGdyYXBoSWQpO1xuICAgICAgICAgIH1cbiAgICAgICAgfSlcbiAgICAgIH0pXG4gICAgKTtcbiAgICByZXR1cm4gdHJ1ZTtcbiAgfVxuXG4gIHByaXZhdGUgYXN5bmMgc3RhcnRHcmFwaEJ1aWxkZXIoXG4gICAgZ3JhcGhJZDogc3RyaW5nXG4gICkge1xuICAgXG5cbiAgICAvLyB0aGlzLmNoYXJ0c1tncmFwaElkXS5jdXJyTGV2ZWwgPSBjdXJyTGV2ZWw7XG4gICAgLy8gdGhpcy5jaGFydHNbZ3JhcGhJZF0ucHJldkxldmVsRGF0YSA9IFtdO1xuICAgIC8vIHRoaXMuY2hhcnRzW2dyYXBoSWRdLnNlbEtleXMgPSBbXTtcbiAgICAvLyB0aGlzLmNoYXJ0c1tncmFwaElkXS5jb2xUb1Nob3cgPSBjb2xUb1Nob3c7XG4gICAgLy8gdGhpcy5jaGFydHNbZ3JhcGhJZF0uY3VyckxldmVsID0gMDtcbiAgICAvL0NyZWF0aW5nIENoYXJ0IFJhdyBKc29uXG4gICAgbGV0IGNoYXJ0T3B0aW9uczogYW55ID0gdGhpcy5jcmVhdGVDaGFydERhdGEoZ3JhcGhJZCwgdGhpcy5jaGFydHNbZ3JhcGhJZF0uY3VyckxldmVsKTtcblxuICAgIC8vUmVuZGVyaW5nIENoYXJ0IG9mIEdyYXBoSWRcbiAgICB0aGlzLmhpZ2hjaGFydHMuY2hhcnQodGhpcy5jaGFydHNbZ3JhcGhJZF0uZ3JhcGhJZCwgY2hhcnRPcHRpb25zKTtcblxuICAgIC8vQWRkIEFjdGlvbiBCdXR0b25zIE92ZXIgQ2hhcnRcbiAgICB0aGlzLmFkZEFjdGlvbkJ0bihncmFwaElkKTtcblxuICAgIHJldHVybiB0cnVlO1xuICB9XG5cbiAgcHJpdmF0ZSBnZXRQbG90T3B0aW9ucyhncmFwaElkOiBzdHJpbmcsIGN1cnJMZXZlbDogbnVtYmVyKSB7XG4gICAgbGV0IHBsb3RPcHRpb25zOiBhbnkgPSB7XG4gICAgICBzZXJpZXM6IHtcbiAgICAgICAgdHVyYm9UaHJlc2hvbGQ6IDEwMDAwMDAsXG4gICAgICAgIGRhdGFMYWJlbHM6IHtcbiAgICAgICAgICBjb2xvcjogJ2JsYWNrJyxcbiAgICAgICAgICBlbmFibGVkOiB0cnVlLFxuICAgICAgICAgIHN0eWxlOiB7XG4gICAgICAgICAgICBjb2xvcjogJ2JsYWNrJyxcbiAgICAgICAgICAgIHRleHRTaGFkb3c6IGZhbHNlLFxuICAgICAgICAgICAgdGV4dERlY29yYXRpb246ICdub25lJyxcbiAgICAgICAgICB9LFxuICAgICAgICB9LFxuICAgICAgICBsYWJlbDoge1xuICAgICAgICAgIHN0eWxlOiB7XG4gICAgICAgICAgICBjb2xvcjogJ2JsYWNrJyxcbiAgICAgICAgICB9LFxuICAgICAgICB9LFxuICAgICAgfSxcbiAgICB9O1xuXG4gICAgLy9PcHRpb25zIGZvciBTdGFjayBHcmFwaFxuICAgIGlmIChcbiAgICAgIHRoaXMuY2hhcnRzW2dyYXBoSWRdLmdyYXBoVHlwZXNbY3VyckxldmVsXSA9PSBHcmFwaFR5cGVzLlNUQUNLRURfQkFSIHx8XG4gICAgICB0aGlzLmNoYXJ0c1tncmFwaElkXS5ncmFwaFR5cGVzW2N1cnJMZXZlbF0gPT0gR3JhcGhUeXBlcy5TVEFDS0VEX0NPTFVNTlxuICAgICkge1xuICAgICAgcGxvdE9wdGlvbnMuc2VyaWVzWydzdGFja2luZyddID0gJ25vcm1hbCc7IC8vTm9ybWFsIFN0YWNraW5nIG9mIHktYXhpc1xuICAgIH0gZWxzZSBpZiAoXG4gICAgICB0aGlzLmNoYXJ0c1tncmFwaElkXS5ncmFwaFR5cGVzW2N1cnJMZXZlbF0gPT1cbiAgICAgICAgR3JhcGhUeXBlcy5TVEFDS0VEX0JBUl9QRVJDRU5UQUdFIHx8XG4gICAgICB0aGlzLmNoYXJ0c1tncmFwaElkXS5ncmFwaFR5cGVzW2N1cnJMZXZlbF0gPT1cbiAgICAgICAgR3JhcGhUeXBlcy5TVEFDS0VEX0NPTFVNTl9QRVJDRU5UQUdFXG4gICAgKSB7XG4gICAgICBwbG90T3B0aW9ucy5zZXJpZXNbJ3N0YWNraW5nJ10gPSAncGVyY2VudCc7IC8vU3RhY2tpbmcgb2YgeS1heGlzIG9uIGJhc2lzIG9mIHBlcmNlbnRhZ2VcbiAgICAgIC8vQWRkIFBlcmNlbnQgU2lnbiBhZnRlciB5LWF4aXMgdmFsdWVzXG4gICAgICBwbG90T3B0aW9ucy5zZXJpZXMuZGF0YUxhYmVsc1snZm9ybWF0dGVyJ10gPSBmdW5jdGlvbiAoKSB7XG4gICAgICAgIHJldHVybiB0aGlzLnBlcmNlbnRhZ2UudG9GaXhlZCgyKSArICcgJSc7XG4gICAgICB9O1xuICAgIH1cbiAgICByZXR1cm4gcGxvdE9wdGlvbnM7XG4gIH1cblxuICBwcml2YXRlIGNyZWF0ZUNoYXJ0RGF0YShncmFwaElkOiBzdHJpbmcsIGN1cnJMZXZlbDogbnVtYmVyKSB7XG4gICAgbGV0IF9zZWxmID0gdGhpcztcblxuICAgIC8vR2V0dGluZyBQbG90IE9wdGlvbnMgZm9yIEdyYXBoXG4gICAgbGV0IHBsb3RPcHRpb25zID0gdGhpcy5nZXRQbG90T3B0aW9ucyhncmFwaElkLCBjdXJyTGV2ZWwpO1xuXG4gICAgcmV0dXJuIHtcbiAgICAgIGNyZWRpdHM6IHtcbiAgICAgICAgdGV4dDogdGhpcy5jcmVkaXRUaXRsZSxcbiAgICAgICAgaHJlZjogdGhpcy5jcmVkaXRVcmwsXG4gICAgICAgIHN0eWxlOiB7XG4gICAgICAgICAgZm9udFNpemU6ICcxMnB4JyxcbiAgICAgICAgfSxcbiAgICAgIH0sXG4gICAgICB0aXRsZTogbnVsbCxcbiAgICAgIHBsb3RPcHRpb25zOiBwbG90T3B0aW9ucyxcbiAgICAgIGNoYXJ0OiB7XG4gICAgICAgIGV2ZW50czoge1xuICAgICAgICAgIC8vSGFuZGxlIERyaWxsZG93biBFdmVudCBvZiBHcmFwaFxuICAgICAgICAgIGRyaWxsZG93bjogZnVuY3Rpb24gKGU6IGFueSkge1xuICAgICAgICAgICAgaWYoZS5wb2ludHMgIT0gZmFsc2UpIHJldHVyblxuICAgICAgICAgICAgbGV0IGNoYXJ0OiBhbnkgPSB0aGlzO1xuICAgICAgICAgICAgLy9TaG93IExvYWRpbmcgaW4gQ2hhcnRcbiAgICAgICAgICAgIGNoYXJ0LnNob3dMb2FkaW5nKCdMb2FkaW5nLi4uJyk7XG4gICAgICAgICAgICBsZXQgY3VyckdyYXBoSWQgPSBlLnBvaW50Lm9wdGlvbnMuZ3JhcGhJZDsgLy9HcmFwaElkXG4gICAgICAgICAgICBsZXQgY29sSWQgPSBlLnBvaW50LmNvbEluZGV4OyAvL0NvbG9ySW5kZXggb2YgYmFyXG4gICAgICAgICAgICAvL0luY3JlYXNpbmcgR3JhcGggRHJpbGxkb3duIGxldmVsXG4gICAgICAgICAgICBfc2VsZi5jaGFydHNbXCJncmFwaC1cIiArIGN1cnJHcmFwaElkXS5jdXJyTGV2ZWwgKz0gMTtcbiAgICAgICAgICAgIF9zZWxmLmNoYXJ0c1tcImdyYXBoLVwiICsgY3VyckdyYXBoSWRdLmJyZWFkQ3J1bWIucHVzaChlLnBvaW50Lm5hbWUpO1xuICAgICAgICAgICAgX3NlbGYuY2hhcnRzW1wiZ3JhcGgtXCIgKyBjdXJyR3JhcGhJZF0uc2VsS2V5cz8ucHVzaChlLnBvaW50Lm5hbWUpO1xuICAgICAgICAgICAgbGV0IGRhdGFPYmogPSB7XG4gICAgICAgICAgICAgIGdyYXBoSWQ6IGN1cnJHcmFwaElkLFxuICAgICAgICAgICAgICBjdXJyTGV2ZWw6IF9zZWxmLmNoYXJ0c1tcImdyYXBoLVwiICsgY3VyckdyYXBoSWRdLmN1cnJMZXZlbCxcbiAgICAgICAgICAgICAgY29sSWQ6IGNvbElkLFxuICAgICAgICAgICAgICBzZWxLZXk6IF9zZWxmLmNoYXJ0c1tcImdyYXBoLVwiICsgY3VyckdyYXBoSWRdLnNlbEtleXMsXG4gICAgICAgICAgICAgIGNvbFRvU2hvdzogbnVsbCxcbiAgICAgICAgICAgICAgZGlyZWN0aW9uOiBfc2VsZi5jaGFydHNbXCJncmFwaC1cIiArIGN1cnJHcmFwaElkXS5vcmRlcixcbiAgICAgICAgICAgICAgZGF0YUZpbHRlcjogX3NlbGYuY2hhcnRzW1wiZ3JhcGgtXCIgKyBjdXJyR3JhcGhJZF0uZGFzaGJvYXJkRmlsdGVyLFxuICAgICAgICAgICAgICBhZG1pbklkOiBfc2VsZi5jaGFydHNbXCJncmFwaC1cIiArIGN1cnJHcmFwaElkXS5hZG1pbklkLFxuICAgICAgICAgICAgICBzaGFyZWlkOiBfc2VsZi5jaGFydHNbXCJncmFwaC1cIiArIGN1cnJHcmFwaElkXS5zaGFyZWlkID8/IG51bGwsXG4gICAgICAgICAgICAgIHN0YXJ0RGF0ZTogX3NlbGYuY2hhcnRzW1wiZ3JhcGgtXCIgKyBjdXJyR3JhcGhJZF0ucmFuZ2UhLnN0YXJ0RGF0ZSA/PyBudWxsLFxuICAgICAgICAgICAgICBlbmREYXRlOiBfc2VsZi5jaGFydHNbXCJncmFwaC1cIiArIGN1cnJHcmFwaElkXS5yYW5nZSEuZW5kRGF0ZSA/PyBudWxsXG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBfc2VsZi5kYXRhU2VydmljZS5nZXRHcmFwaERyaWxsZG93bkJ5SWQoZGF0YU9iaikudGhlbigocmVzIDogYW55KSA9PiB7XG4gICAgICAgICAgICAgIC8vT3BlbiBMYXN0IExldmVsIENvbXBvbmVudFxuICAgICAgICAgICAgICBpZiAoXG5cbiAgICAgICAgICAgICAgICBfc2VsZi5jaGFydHNbXCJncmFwaC1cIiArIGN1cnJHcmFwaElkXS5yb3dzLmxlbmd0aCA9PSBfc2VsZi5jaGFydHNbXCJncmFwaC1cIiArIGN1cnJHcmFwaElkXS5jdXJyTGV2ZWxcbiAgICAgICAgICAgICAgKSB7XG4gICAgICAgICAgICAgICAgX3NlbGYuZGF0YVNlcnZpY2Uuc2V0TW9kYWxEYXRhKHtcbiAgICAgICAgICAgICAgICAgIGNvbFRvVmlldzogX3NlbGYuY2hhcnRzW1wiZ3JhcGgtXCIgKyBjdXJyR3JhcGhJZF0ubGFzdExldmVsQ29sdW1ucyxcbiAgICAgICAgICAgICAgICAgIHJlZkRhdGE6IHJlcy5kYXRhLFxuICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgICAgIGxldCBtb2RhbE9wdGlvbnMgPSB7XG4gICAgICAgICAgICAgICAgICBwYW5lbENsYXNzOiAnZGF0YVBvcHVwLW1vZGFsJyxcbiAgICAgICAgICAgICAgICAgIGJhY2tkcm9wQ2xhc3M6ICdtb2RhbC1iYWNrZHJvcCcsXG4gICAgICAgICAgICAgICAgfTtcbiAgICAgICAgICAgICAgICBfc2VsZi5kaWFsb2cub3BlbihEYXRhUG9wdXBDb21wb25lbnQsIG1vZGFsT3B0aW9ucyk7XG4gICAgICAgICAgICAgICAgLy9SZWR1Y2luZyBHcmFwaCBEcmlsbGRvd24gTGV2ZWxcbiAgICAgICAgICAgICAgICBfc2VsZi5jaGFydHNbXCJncmFwaC1cIiArIGN1cnJHcmFwaElkXS5jdXJyTGV2ZWwgLT0gMTtcbiAgICAgICAgICAgICAgICBfc2VsZi5jaGFydHNbXCJncmFwaC1cIiArIGN1cnJHcmFwaElkXS5zZWxLZXlzPy5wb3AoKTtcblxuICAgICAgICAgICAgICAgIHNldFRpbWVvdXQoKCkgPT4ge1xuICAgICAgICAgICAgICAgICAgLy9IaWRlIExvYWRpbmcgaW4gY2hhcnRcbiAgICAgICAgICAgICAgICAgIGNoYXJ0LmhpZGVMb2FkaW5nKCk7XG4gICAgICAgICAgICAgICAgfSwgMTAwMCk7XG4gICAgICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICAgICAgICB9ZWxzZXtcbiAgICAgICAgICAgICAgICAvL1N0b3JpbmcgUHJldmlvdXMgU25hcHNob3Qgb2YgRGF0YSB0byByZXN0b3JlIGdyYXBoIG9uIGJhY2tcbiAgICAgICAgICAgICAgICBfc2VsZi5jaGFydHNbXCJncmFwaC1cIiArIGN1cnJHcmFwaElkXS5wcmV2TGV2ZWxEYXRhLnB1c2goXG4gICAgICAgICAgICAgICAgICBfc2VsZi5jaGFydHNbXCJncmFwaC1cIiArIGN1cnJHcmFwaElkXS5ncmFwaERhdGFcbiAgICAgICAgICAgICAgICApO1xuXG4gICAgICAgICAgICAgICAgX3NlbGYubWFuYWdlQnJlYWRDcnVtYihcImdyYXBoLVwiICsgY3VyckdyYXBoSWQsIF9zZWxmKTtcbiAgICAgICAgICAgICAgICAvL0dldHRpbmcgZHJpbGxkb3duIHNlcmllcyBkYXRhXG4gICAgICAgICAgICAgICAgbGV0IHNlcmllcyA9IHJlcy5kYXRhO1xuICAgIFxuICAgICAgICAgICAgICAgIC8vIGlmIChcbiAgICAgICAgICAgICAgICAvLyAgIF9zZWxmLmNoYXJ0c1tcImdyYXBoLVwiICsgY3VyckdyYXBoSWRdLmdyYXBoVHlwZXNbMF0gPT1cbiAgICAgICAgICAgICAgICAvLyAgICAgR3JhcGhUeXBlcy5TVEFDS0VEX0JBUl9QRVJDRU5UQUdFIHx8XG4gICAgICAgICAgICAgICAgLy8gICBfc2VsZi5jaGFydHNbXCJncmFwaC1cIiArIGN1cnJHcmFwaElkXS5ncmFwaFR5cGVzWzBdID09XG4gICAgICAgICAgICAgICAgLy8gICAgIEdyYXBoVHlwZXMuU1RBQ0tFRF9DT0xVTU5fUEVSQ0VOVEFHRVxuICAgICAgICAgICAgICAgIC8vICkge1xuICAgICAgICAgICAgICAgIC8vICAgcGxvdE9wdGlvbnMuc2VyaWVzWydzdGFja2luZyddID0gJ25vcm1hbCc7XG4gICAgICAgICAgICAgICAgLy8gICBwbG90T3B0aW9ucy5zZXJpZXMuZGF0YUxhYmVsc1snZm9ybWF0dGVyJ10gPSBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICAgICAgLy8gICAgIHJldHVybiB0aGlzLnk7XG4gICAgICAgICAgICAgICAgLy8gICB9O1xuICAgICAgICAgICAgICAgIC8vICAgY2hhcnQudXBkYXRlKHtcbiAgICAgICAgICAgICAgICAvLyAgICAgcGxvdE9wdGlvbnM6IHBsb3RPcHRpb25zLFxuICAgICAgICAgICAgICAgIC8vICAgfSk7XG4gICAgICAgICAgICAgICAgLy8gfVxuICAgICAgICAgICAgICAgIF9zZWxmLmNoYXJ0c1tcImdyYXBoLVwiICsgY3VyckdyYXBoSWRdLmdyYXBoRGF0YSA9IHNlcmllcztcbiAgICBcbiAgICAgICAgICAgICAgICBzZXRUaW1lb3V0KCgpID0+IHtcbiAgICAgICAgICAgICAgICAgIC8vSGlkZSBMb2FkaW5nIGluIGNoYXJ0XG4gICAgICAgICAgICAgICAgICBjaGFydC5oaWRlTG9hZGluZygpO1xuICAgICAgICAgICAgICAgICAgLy9BZGQgRHJpbGxkb3duIFNlcmllcyBEYXRhIGFzIE1haW4gU2VyaWVzXG4gICAgICAgICAgICAgICAgICBjaGFydC51cGRhdGUoe1xuICAgICAgICAgICAgICAgICAgICBwbG90T3B0aW9uczogcGxvdE9wdGlvbnMsXG4gICAgICAgICAgICAgICAgICAgIHhBeGlzOiB7XG4gICAgICAgICAgICAgICAgICAgICAgdHlwZTogJ2NhdGVnb3J5JyxcbiAgICAgICAgICAgICAgICAgICAgICBsYWJlbHM6IHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHN0eWxlOiB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgIGNvbG9yOiAncmVkJyxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgdGV4dERlY29yYXRpb246ICdub25lJyxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgdGV4dE91dGxpbmU6ICcwcHgnLFxuICAgICAgICAgICAgICAgICAgICAgICAgfSxcbiAgICAgICAgICAgICAgICAgICAgICB9LFxuICAgICAgICAgICAgICAgICAgICAgIG1pbjogMCxcbiAgICAgICAgICAgICAgICAgICAgICBtYXg6IDYsXG4gICAgICAgICAgICAgICAgICAgICAgYWxsb3dEZWNpbWFsczogZmFsc2UsXG4gICAgICAgICAgICAgICAgICAgICAgc2Nyb2xsYmFyOiB7XG4gICAgICAgICAgICAgICAgICAgICAgICBlbmFibGVkOiB0cnVlLFxuICAgICAgICAgICAgICAgICAgICAgIH0sXG4gICAgICAgICAgICAgICAgICAgIH0sXG4gICAgICAgICAgICAgICAgICAgIHNlcmllczogc2VyaWVzXG4gICAgICAgICAgICAgICAgICB9KVxuICAgICAgICAgICAgICAgICAgLy8gLmFkZFNlcmllc0FzRHJpbGxkb3duKGUucG9pbnQsIHtcbiAgICAgICAgICAgICAgICAgIC8vICAgZGF0YTogW3Nlcmllc10sXG4gICAgICAgICAgICAgICAgICAvLyAgIG5hbWU6IGUucG9pbnQubmFtZVxuICAgICAgICAgICAgICAgICAgLy8gfSk7XG4gICAgICAgICAgICAgICAgfSwgMTAwMCk7XG4gICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH0pXG5cblxuXG4gICAgICAgICAgfSxcbiAgICAgICAgICAvL0hhbmRsZSBEcmlsbFVwIEV2ZW50XG4gICAgICAgICAgZHJpbGx1cDogYXN5bmMgZnVuY3Rpb24gKGU6IGFueSkge1xuICAgICAgICAgICAgLy8gbGV0IGN1cnJHcmFwaElkID0gZS5zZXJpZXNPcHRpb25zLmdyYXBoSWQ7IC8vR3JhcGhJZFxuICAgICAgICAgICAgLy8gbGV0IGxldmVsID0gZS5zZXJpZXNPcHRpb25zLmxldmVsOyAvL0N1cnJlbnQgTGV2ZWwgb2YgRHJpbGxkb3duXG4gICAgICAgICAgICAvLyBsZXQgY2hhcnQ6IGFueSA9IHRoaXM7XG4gICAgICAgICAgICAvLyBfc2VsZi5jaGFydHNbXCJncmFwaC1cIiArIGN1cnJHcmFwaElkXS5jdXJyTGV2ZWwgPSBsZXZlbDtcblxuICAgICAgICAgICAgLy8gLy9SZXN0b3JpbmcgRGF0YSB1c2luZyBwcmV2aW91cyBzdG9yZSBkYXRhXG4gICAgICAgICAgICAvLyBfc2VsZi5jaGFydHNbXCJncmFwaC1cIiArIGN1cnJHcmFwaElkXS5ncmFwaERhdGEgPSBhd2FpdCBfc2VsZi5jaGFydHNbXG4gICAgICAgICAgICAvLyAgIFwiZ3JhcGgtXCIgKyBjdXJyR3JhcGhJZFxuICAgICAgICAgICAgLy8gXS5wcmV2TGV2ZWxEYXRhW2xldmVsXTtcblxuICAgICAgICAgICAgLy8gLy9SZWZyZXNoIFByZXZpb3VzIERhdGEgTGlzdFxuICAgICAgICAgICAgLy8gX3NlbGYuY2hhcnRzW1wiZ3JhcGgtXCIgKyBjdXJyR3JhcGhJZF0ucHJldkxldmVsRGF0YS5zcGxpY2UobGV2ZWwsIDEpO1xuICAgICAgICAgICAgLy8gX3NlbGYuY2hhcnRzW1wiZ3JhcGgtXCIgKyBjdXJyR3JhcGhJZF0uc2VsS2V5cz8ucG9wKCk7XG4gICAgICAgICAgICAvLyBfc2VsZi5jaGFydHNcbiAgICAgICAgICAgIC8vIGlmIChcbiAgICAgICAgICAgIC8vICAgbGV2ZWwgPT0gMCAmJlxuICAgICAgICAgICAgLy8gICAoX3NlbGYuY2hhcnRzW1wiZ3JhcGgtXCIgKyBjdXJyR3JhcGhJZF0uZ3JhcGhUeXBlc1swXSA9PVxuICAgICAgICAgICAgLy8gICAgIEdyYXBoVHlwZXMuU1RBQ0tFRF9CQVJfUEVSQ0VOVEFHRSB8fFxuICAgICAgICAgICAgLy8gICAgIF9zZWxmLmNoYXJ0c1tcImdyYXBoLVwiICsgY3VyckdyYXBoSWRdLmdyYXBoVHlwZXNbMF0gPT1cbiAgICAgICAgICAgIC8vICAgICAgIEdyYXBoVHlwZXMuU1RBQ0tFRF9DT0xVTU5fUEVSQ0VOVEFHRSlcbiAgICAgICAgICAgIC8vICkge1xuICAgICAgICAgICAgLy8gICBwbG90T3B0aW9ucy5zZXJpZXNbJ3N0YWNraW5nJ10gPSAncGVyY2VudCc7IC8vU3RhY2tpbmcgb2YgeS1heGlzIG9uIGJhc2lzIG9mIHBlcmNlbnRhZ2VcbiAgICAgICAgICAgIC8vICAgLy9BZGQgUGVyY2VudCBTaWduIGFmdGVyIHktYXhpcyB2YWx1ZXNcbiAgICAgICAgICAgIC8vICAgcGxvdE9wdGlvbnMuc2VyaWVzLmRhdGFMYWJlbHNbJ2Zvcm1hdHRlciddID0gZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgLy8gICAgIHJldHVybiB0aGlzLnBlcmNlbnRhZ2UudG9GaXhlZCgyKSArICcgJSc7XG4gICAgICAgICAgICAvLyAgIH07XG5cbiAgICAgICAgICAgIC8vICAgY2hhcnQudXBkYXRlKHtcbiAgICAgICAgICAgIC8vICAgICBwbG90T3B0aW9uczogcGxvdE9wdGlvbnMsXG4gICAgICAgICAgICAvLyAgICAgc2VyaWVzOiBfc2VsZi5jaGFydHNbXCJncmFwaC1cIiArIGN1cnJHcmFwaElkXS5ncmFwaERhdGFcbiAgICAgICAgICAgIC8vICAgfSk7XG4gICAgICAgICAgICAvLyB9XG4gICAgICAgICAgfSxcbiAgICAgICAgfSxcbiAgICAgIH0sXG4gICAgICAvL0NvbmZpZ3VyaW5nIFgtYXhpc1xuICAgICAgeEF4aXM6IHtcbiAgICAgICAgdHlwZTogJ2NhdGVnb3J5JyxcbiAgICAgICAgbGFiZWxzOiB7XG4gICAgICAgICAgc3R5bGU6IHtcbiAgICAgICAgICAgIGNvbG9yOiAncmVkJyxcbiAgICAgICAgICAgIHRleHREZWNvcmF0aW9uOiAnbm9uZScsXG4gICAgICAgICAgICB0ZXh0T3V0bGluZTogJzBweCcsXG4gICAgICAgICAgfSxcbiAgICAgICAgfSxcbiAgICAgICAgbWluOiAwLFxuICAgICAgICBtYXg6XG4gICAgICAgICAgT2JqZWN0LmtleXModGhpcy5jaGFydHNbZ3JhcGhJZF0uZ3JhcGhEYXRhWzBdLmRhdGEpLmxlbmd0aCA8PSA2XG4gICAgICAgICAgICA/IE9iamVjdC5rZXlzKHRoaXMuY2hhcnRzW2dyYXBoSWRdLmdyYXBoRGF0YVswXS5kYXRhKS5sZW5ndGggLSAxXG4gICAgICAgICAgICA6IDYsXG4gICAgICAgIGFsbG93RGVjaW1hbHM6IGZhbHNlLFxuICAgICAgICBzY3JvbGxiYXI6IHtcbiAgICAgICAgICBlbmFibGVkOiB0cnVlLFxuICAgICAgICB9LFxuICAgICAgfSxcbiAgICAgIC8vQ29uZmlndXJpbmcgWS1heGlzXG4gICAgICB5QXhpczogbG9kYXNoLm1hcCh0aGlzLmNoYXJ0c1tncmFwaElkXS5jb2x1bW5zLCAoeTogYW55KSA9PiB7XG4gICAgICAgIHJldHVybiB7XG4gICAgICAgICAgb3Bwb3NpdGU6IHRydWUsXG4gICAgICAgICAgdGl0bGU6IHtcbiAgICAgICAgICAgIHRleHQ6IG51bGwsIC8vIEhpZGluZyB2ZXJ0aWNhbCBsYWJlbHMgb3ZlciB5LWF4aXNcbiAgICAgICAgICB9LFxuICAgICAgICB9O1xuICAgICAgfSksXG4gICAgICAvL0dldHRpbmcgTWFpbiBTZXJpZXMgRGF0YVxuICAgICAgc2VyaWVzOiB0aGlzLmNoYXJ0c1tncmFwaElkXS5ncmFwaERhdGFcbiAgICB9O1xuICB9XG5cbiAgcHJpdmF0ZSBzb3J0R3JhcGgoZTogYW55KSB7XG4gICAgY29uc3QgdGVtcEFyciA9IGUudGFyZ2V0LmlkLnNwbGl0KCdAJyk7XG4gICAgY29uc3QgZ3JhcGhJZCA9IHRlbXBBcnJbdGVtcEFyci5sZW5ndGggLSAxXTtcbiAgICBpZiAodGhpcy5jaGFydHNbZ3JhcGhJZF0ub3JkZXIgPCAxKSB7XG4gICAgICB0aGlzLmNoYXJ0c1tncmFwaElkXS5vcmRlciArPSAxO1xuICAgIH0gZWxzZSB7XG4gICAgICB0aGlzLmNoYXJ0c1tncmFwaElkXS5vcmRlciA9IC0xO1xuICAgIH1cbiAgICBsZXQgZCA9IHtcbiAgICAgIGdyYXBoSWQ6IGdyYXBoSWQuc3BsaXQoXCItXCIpWzFdLFxuICAgICAgZGF0YUZpbHRlcjogdGhpcy5jaGFydHNbZ3JhcGhJZF0uZGFzaGJvYXJkRmlsdGVyLFxuICAgICAgZGlyZWN0aW9uOiB0aGlzLmNoYXJ0c1tncmFwaElkXS5vcmRlcixcbiAgICAgIGFkbWluSWQ6IHRoaXMuY2hhcnRzW2dyYXBoSWRdLmFkbWluSWQsXG4gICAgICBzaGFyZWlkOiB0aGlzLmNoYXJ0c1tncmFwaElkXS5zaGFyZWlkID8/IG51bGwsXG4gICAgICBzdGFydERhdGU6IHRoaXMuY2hhcnRzW2dyYXBoSWRdLnJhbmdlIS5zdGFydERhdGUgPz8gbnVsbCxcbiAgICAgIGVuZERhdGU6IHRoaXMuY2hhcnRzW2dyYXBoSWRdLnJhbmdlIS5lbmREYXRlID8/IG51bGxcbiAgICB9XG4gICAgU3dhbC5maXJlKHtcbiAgICAgIHRleHQ6IFwiUGxlYXNlIFdhaXQuLi5cIixcbiAgICAgIGFsbG93T3V0c2lkZUNsaWNrOiBmYWxzZVxuICAgIH0pXG4gICAgU3dhbC5zaG93TG9hZGluZygpO1xuICAgIHRoaXMuZGF0YVNlcnZpY2UuZ2V0R3JhcGhEYXRhQnlJZChkKS50aGVuKChyZXM6IGFueSkgPT4ge1xuICAgICAgU3dhbC5oaWRlTG9hZGluZygpO1xuICAgICAgU3dhbC5jbG9zZSgpO1xuICAgICAgdGhpcy5jaGFydHNbZ3JhcGhJZF0uZ3JhcGhEYXRhID0gcmVzLmRhdGE7XG4gICAgICB0aGlzLmJ1aWxkR3JhcGgoey4uLnRoaXMuY2hhcnRzW2dyYXBoSWRdLCBcbiAgICAgICAgYnJlYWRDcnVtYjogWydIb21lJ10sXG4gICAgICAgIGN1cnJMZXZlbDogMCxcbiAgICAgICAgc2VsS2V5czogW10sXG4gICAgICAgIG9yZGVyOiAwLFxuICAgICAgICBwcmV2TGV2ZWxEYXRhOiBbXSxcbiAgICAgICAgY29sVG9TaG93OiAnJ30pO1xuICAgIH0pXG4gIH1cblxuICBwcml2YXRlIGFkZEFjdGlvbkJ0bihncmFwaElkOiBzdHJpbmcpIHtcbiAgICBsZXQgX3NlbGYgPSB0aGlzO1xuICAgIGNvbnN0IGRpdiA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ2RpdicpO1xuICAgIGRpdi5zZXRBdHRyaWJ1dGUoJ3N0eWxlJywgdGhpcy5kaXZTdHlsZXMpO1xuICAgIGRpdi5zZXRBdHRyaWJ1dGUoXCJpZFwiLCBcImdyYXBoLW9wdGlvbnMtXCIgKyBncmFwaElkKTtcbiAgICBjb25zdCBzb3J0SWNvbiA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ2knKTtcbiAgICBzb3J0SWNvbi5zZXRBdHRyaWJ1dGUoJ2lkJywgJ3NvcnRAJyArIGdyYXBoSWQpO1xuICAgIHNvcnRJY29uLnNldEF0dHJpYnV0ZSgnc3R5bGUnLCB0aGlzLmljb25TdHlsZXMpO1xuICAgIGlmICh0aGlzLmNoYXJ0c1tncmFwaElkXS5vcmRlciA9PSAxKSB7XG4gICAgICBzb3J0SWNvbi5zZXRBdHRyaWJ1dGUoJ2NsYXNzJywgJ2ZhIGZhLXNvcnQtYW1vdW50LWRlc2MnKTtcbiAgICB9IGVsc2UgaWYgKHRoaXMuY2hhcnRzW2dyYXBoSWRdLm9yZGVyID09IC0xKSB7XG4gICAgICBzb3J0SWNvbi5zZXRBdHRyaWJ1dGUoJ2NsYXNzJywgJ2ZhIGZhLXNvcnQtYW1vdW50LWFzYycpO1xuICAgIH0gZWxzZSB7XG4gICAgICBzb3J0SWNvbi5zZXRBdHRyaWJ1dGUoJ2NsYXNzJywgJ2ZhIGZhLXNvcnQnKTtcbiAgICB9XG4gICAgY29uc3QgZG93bmxvYWRJY29uID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudChcImlcIik7XG4gICAgZG93bmxvYWRJY29uLnNldEF0dHJpYnV0ZSgnaWQnLCAnZG93bmxvYWRAJyArIGdyYXBoSWQpO1xuICAgIGRvd25sb2FkSWNvbi5zZXRBdHRyaWJ1dGUoJ3N0eWxlJywgdGhpcy5pY29uU3R5bGVzKTtcbiAgICBkb3dubG9hZEljb24uc2V0QXR0cmlidXRlKCdjbGFzcycsICdmYSBmYS1kb3dubG9hZCcpXG5cbiAgICBkaXYuYXBwZW5kQ2hpbGQoZG93bmxvYWRJY29uKTtcbiAgICBkaXYuYXBwZW5kQ2hpbGQoc29ydEljb24pO1xuICAgIGRpdi5hcHBlbmRDaGlsZChzb3J0SWNvbik7XG4gICAgZG9jdW1lbnQucXVlcnlTZWxlY3RvcignIycgKyBncmFwaElkKSEuYXBwZW5kQ2hpbGQoZGl2KTtcbiAgICAvLyBpZiAodGhpcy5jaGFydHNbZ3JhcGhJZF0ucm93c1swXSA9PSAnKioqTEFCRUwqKionKSB7XG4gICAgLy8gfVxuICAgIHRoaXMubWFuYWdlQnJlYWRDcnVtYihncmFwaElkLCB0aGlzKTtcbiAgICBzb3J0SWNvbi5hZGRFdmVudExpc3RlbmVyKCdjbGljaycsIGZ1bmN0aW9uIChlKSB7XG4gICAgICBfc2VsZi5zb3J0R3JhcGgoZSk7XG4gICAgfSk7XG4gICAgZG93bmxvYWRJY29uLmFkZEV2ZW50TGlzdGVuZXIoJ2NsaWNrJywgZnVuY3Rpb24gKGU6IGFueSkge1xuICAgICAgY29uc3QgdGVtcEFyciA9IGUudGFyZ2V0LmlkLnNwbGl0KCdAJyk7XG4gICAgICBjb25zdCBncmFwaElkID0gdGVtcEFyclt0ZW1wQXJyLmxlbmd0aCAtIDFdO1xuICAgICAgbGV0IGRhdGFPYmogPSB7XG4gICAgICAgIGdyYXBoSWQ6IGdyYXBoSWQuc3BsaXQoXCItXCIpWzFdLFxuICAgICAgICBjdXJyTGV2ZWw6IF9zZWxmLmNoYXJ0c1tncmFwaElkXS5jdXJyTGV2ZWwsXG4gICAgICAgIGNvbElkOiBudWxsLFxuICAgICAgICBzZWxLZXk6IF9zZWxmLmNoYXJ0c1tncmFwaElkXS5zZWxLZXlzLFxuICAgICAgICBjb2xUb1Nob3c6IG51bGwsXG4gICAgICAgIGRpcmVjdGlvbjogMCxcbiAgICAgICAgZGF0YUZpbHRlcjogX3NlbGYuY2hhcnRzW2dyYXBoSWRdLmRhc2hib2FyZEZpbHRlcixcbiAgICAgICAgYWRtaW5JZDogX3NlbGYuY2hhcnRzW2dyYXBoSWRdLmFkbWluSWQsXG4gICAgICAgIHNoYXJlaWQ6IF9zZWxmLmNoYXJ0c1tncmFwaElkXS5zaGFyZWlkID8/IG51bGwsXG4gICAgICAgIHN0YXJ0RGF0ZTogX3NlbGYuZGF0ZVBpcGUudHJhbnNmb3JtKF9zZWxmLmNoYXJ0c1tncmFwaElkXS5yYW5nZSEuc3RhcnREYXRlLFwieXl5eS1NTS1kZFwiKSxcbiAgICAgICAgZW5kRGF0ZTogX3NlbGYuZGF0ZVBpcGUudHJhbnNmb3JtKF9zZWxmLmNoYXJ0c1tncmFwaElkXS5yYW5nZSEuZW5kRGF0ZSxcInl5eXktTU0tZGRcIiksXG4gICAgICAgIGZldGNoUmF3RGF0YTogdHJ1ZVxuICAgICAgfVxuICAgICAgX3NlbGYuZG93bmxvYWRHcmFwaERhdGEoZSxncmFwaElkLCBkYXRhT2JqLF9zZWxmLmNoYXJ0c1tncmFwaElkXS5sYXN0TGV2ZWxDb2x1bW5zKTtcbiAgICB9KTtcbiAgfVxuICBcbiAgcHJpdmF0ZSBkb3dubG9hZEdyYXBoRGF0YShlOiBhbnksZ3JhcGhJZDogYW55LCBkYXRhOiBhbnksIGxhc3RMZXZlbENvbDogYW55KXtcbiAgICBTd2FsLmZpcmUoe1xuICAgICAgdGV4dDogXCJEb3dubG9hZGluZy4uLlwiLFxuICAgICAgYWxsb3dPdXRzaWRlQ2xpY2s6IGZhbHNlXG4gICAgfSlcbiAgICBTd2FsLnNob3dMb2FkaW5nKCk7XG4gICAgdGhpcy5kYXRhU2VydmljZS5kb3dubG9hZERyaWxsZG93bkJ5SWQoZGF0YSkuc3Vic2NyaWJlKChyZXMgOiBhbnkpID0+IHtcbiAgICAgIC8vT3BlbiBMYXN0IExldmVsIENvbXBvbmVudFxuICAgICAgdGhpcy5kb3dubG9hZChyZXMpXG4gICAgICAvLyB0aGlzLmRhdGFTZXJ2aWNlLnNldE1vZGFsRGF0YSh7XG4gICAgICAvLyAgIGNvbFRvVmlldzogbGFzdExldmVsQ29sLFxuICAgICAgLy8gICByZWZEYXRhOiByZXMuZGF0YSxcbiAgICAgIC8vIH0pO1xuICAgICAgLy8gbGV0IG1vZGFsT3B0aW9ucyA9IHtcbiAgICAgIC8vICAgcGFuZWxDbGFzczogJ2RhdGFQb3B1cC1tb2RhbCcsXG4gICAgICAvLyAgIGJhY2tkcm9wQ2xhc3M6ICdtb2RhbC1iYWNrZHJvcCcsXG4gICAgICAvLyB9O1xuICAgICAgLy8gdGhpcy5kaWFsb2cub3BlbihEYXRhUG9wdXBDb21wb25lbnQsIG1vZGFsT3B0aW9ucyk7XG4gICAgfSlcbiAgfVxuXG5cbiAgZG93bmxvYWQoaHR0cEV2ZW50OiBIdHRwRXZlbnQ8c3RyaW5nPiB8IEJsb2IpOiB2b2lkIHtcbiAgICAvLyBTd2FsLmZpcmUoe3RleHQ6IFwiRG93bmxvYWRpbmcuLi5cIn0pXG4gICAgLy8gU3dhbC5zaG93TG9hZGluZygpXG4gICAgc3dpdGNoIChodHRwRXZlbnQudHlwZSkge1xuICAgICAgY2FzZSBIdHRwRXZlbnRUeXBlLlNlbnQ6XG4gICAgICAgIGJyZWFrO1xuICAgICAgY2FzZSBIdHRwRXZlbnRUeXBlLlJlc3BvbnNlSGVhZGVyOlxuICAgICAgICBicmVhaztcbiAgICAgIGNhc2UgSHR0cEV2ZW50VHlwZS5Eb3dubG9hZFByb2dyZXNzOlxuICAgICAgICBicmVhaztcbiAgICAgICAgY2FzZSBIdHRwRXZlbnRUeXBlLlJlc3BvbnNlOlxuICAgICAgICAgIGlmICgoaHR0cEV2ZW50LmJvZHkgYXMgYW55KSBpbnN0YW5jZW9mIEFycmF5KSB7XG4gICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICBTd2FsLmNsb3NlKClcbiAgICAgICAgICBTd2FsLmhpZGVMb2FkaW5nKClcbiAgICAgICAgICBsZXQgRVhDRUxfVFlQRSA9XG4gICAgICAgICAgICAnYXBwbGljYXRpb24vdm5kLm9wZW54bWxmb3JtYXRzLW9mZmljZWRvY3VtZW50LnNwcmVhZHNoZWV0bWwuc2hlZXQ7Y2hhcnNldD1VVEYtOCc7XG4gICAgICAgICAgbGV0IEVYQ0VMX0VYVEVOU0lPTiA9ICcueGxzeCc7XG4gICAgICAgICAgY29uc3QgZGF0YSA9IG5ldyBCbG9iKFtodHRwRXZlbnQuYm9keSFdLCB7XG4gICAgICAgICAgICB0eXBlOiBFWENFTF9UWVBFLFxuICAgICAgICAgIH0pO1xuICAgICAgICAgIEZpbGVTYXZlLnNhdmVBcyhkYXRhLCBcImRhdGEueGxzXCIpO1xuICAgICAgICB9XG4gICAgfVxuICB9XG5cblxuXG5cbiAgcHJpdmF0ZSBtYW5hZ2VCcmVhZENydW1iKGdyYXBoSWQ6IHN0cmluZywgX3NlbGY6IGFueSkge1xuICAgIGNvbnN0IGRpdiA9IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKFwiZ3JhcGgtb3B0aW9ucy1cIiArIGdyYXBoSWQpO1xuICAgIGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKFwiYnJlYWRjcnVtYi1cIiArIGdyYXBoSWQpPy5yZW1vdmUoKTtcbiAgICBjb25zdCBicmVhZENydW1iID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudChcImRpdlwiKTtcbiAgICBpZihfc2VsZi5jaGFydHNbZ3JhcGhJZF0uYnJlYWRDcnVtYi5sZW5ndGggPT0gMSl7XG4gICAgICByZXR1cm47XG4gICAgfVxuXG4gICAgYnJlYWRDcnVtYi5zZXRBdHRyaWJ1dGUoJ3N0eWxlJywgdGhpcy5icmVhZGNydW1iU3R5bGVzKTtcbiAgICBicmVhZENydW1iLnNldEF0dHJpYnV0ZSgnaWQnLCBcImJyZWFkY3J1bWItXCIgKyBncmFwaElkKTtcbiAgICAvLyBob21lSWNvbi5zZXRBdHRyaWJ1dGUoJ2lkJywgJ2hvbWUtbGFiZWwtJyArIGdyYXBoSWQpO1xuICAgIC8vIGhvbWVJY29uLnNldEF0dHJpYnV0ZSgnY2xhc3MnLCAnZmEgZmEtaG9tZScpO1xuICAgIF9zZWxmLmNoYXJ0c1tncmFwaElkXS5icmVhZENydW1iLmZvckVhY2goKGJyZWFkY3J1bWI6IGFueSwgaW5kZXg6IGFueSkgPT4ge1xuICAgICAgY29uc3QgcGFyYSA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoXCJwXCIpO1xuICAgICAgY29uc3Qgc3BhbiA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoXCJzcGFuXCIpO1xuICAgICAgc3Bhbi5zZXRBdHRyaWJ1dGUoXCJzdHlsZVwiLCBcInRleHQtZGVjb3JhdGlvbjogdW5kZXJsaW5lOyBjdXJzb3I6IHBvaW50ZXI7XCIpXG4gICAgICBzcGFuLnNldEF0dHJpYnV0ZShcImlkXCIsIGJyZWFkY3J1bWIpO1xuICAgICAgc3Bhbi5hcHBlbmQoYnJlYWRjcnVtYik7XG4gICAgICBwYXJhLmFwcGVuZENoaWxkKHNwYW4pO1xuICAgICAgcGFyYS5zZXRBdHRyaWJ1dGUoXCJzdHlsZVwiLCBcIm1hcmdpbi1ib3R0b206IDBweDtcIilcbiAgICAgIGlmIChpbmRleCAhPSB0aGlzLmNoYXJ0c1tncmFwaElkXS5icmVhZENydW1iLmxlbmd0aCAtIDEpIHtcbiAgICAgICAgcGFyYS5hcHBlbmQoXCIgPiBcIik7XG4gICAgICAgIHNwYW4uYWRkRXZlbnRMaXN0ZW5lcihcImNsaWNrXCIsIChldmVudCA6YW55KSA9PiB7XG4gICAgICAgICAgY29uc29sZS5sb2coZXZlbnQudGFyZ2V0LmlkKTtcbiAgICAgICAgICBpZihldmVudC50YXJnZXQuaWQgPT0gXCJIb21lXCIpe1xuICAgICAgICAgICAgICBsZXQgZCA9IHtcbiAgICAgICAgICAgICAgICBncmFwaElkOiBncmFwaElkLnNwbGl0KFwiLVwiKVsxXSxcbiAgICAgICAgICAgICAgICBkYXRhRmlsdGVyOiB0aGlzLmNoYXJ0c1tncmFwaElkXS5kYXNoYm9hcmRGaWx0ZXIsXG4gICAgICAgICAgICAgICAgZGlyZWN0aW9uOiB0aGlzLmNoYXJ0c1tncmFwaElkXS5vcmRlcixcbiAgICAgICAgICAgICAgICBhZG1pbklkOiB0aGlzLmNoYXJ0c1tncmFwaElkXS5hZG1pbklkLFxuICAgICAgICAgICAgICAgIHNoYXJlaWQ6IHRoaXMuY2hhcnRzW2dyYXBoSWRdLnNoYXJlaWQgPz8gbnVsbCxcbiAgICAgICAgICAgICAgICBzdGFydERhdGU6IHRoaXMuY2hhcnRzW2dyYXBoSWRdLnJhbmdlIS5zdGFydERhdGUgPz8gbnVsbCxcbiAgICAgICAgICAgICAgICBlbmREYXRlOiB0aGlzLmNoYXJ0c1tncmFwaElkXS5yYW5nZSEuZW5kRGF0ZSA/PyBudWxsXG4gICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgU3dhbC5maXJlKHtcbiAgICAgICAgICAgICAgICB0ZXh0OiBcIlBsZWFzZSBXYWl0Li4uXCIsXG4gICAgICAgICAgICAgICAgYWxsb3dPdXRzaWRlQ2xpY2s6IGZhbHNlXG4gICAgICAgICAgICAgIH0pXG4gICAgICAgICAgICAgIFN3YWwuc2hvd0xvYWRpbmcoKTtcbiAgICAgICAgICAgICAgdGhpcy5kYXRhU2VydmljZS5nZXRHcmFwaERhdGFCeUlkKGQpLnRoZW4oKHJlczogYW55KSA9PiB7XG4gICAgICAgICAgICAgICAgdGhpcy5jaGFydHNbZ3JhcGhJZF0uZ3JhcGhEYXRhID0gcmVzLmRhdGE7XG4gICAgICAgICAgICAgICAgU3dhbC5oaWRlTG9hZGluZygpO1xuICAgICAgICAgICAgICAgIFN3YWwuY2xvc2UoKVxuICAgICAgICAgICAgICAgIHRoaXMuYnVpbGRHcmFwaCh7Li4udGhpcy5jaGFydHNbZ3JhcGhJZF0sIFxuICAgICAgICAgICAgICAgICAgYnJlYWRDcnVtYjogWydIb21lJ10sXG4gICAgICAgICAgICAgICAgICBjdXJyTGV2ZWw6IDAsXG4gICAgICAgICAgICAgICAgICBzZWxLZXlzOiBbXSxcbiAgICAgICAgICAgICAgICAgIG9yZGVyOiAwLFxuICAgICAgICAgICAgICAgICAgcHJldkxldmVsRGF0YTogW10sXG4gICAgICAgICAgICAgICAgICBjb2xUb1Nob3c6ICcnfSk7XG4gICAgICAgICAgICAgIH0pXG4gICAgICAgICAgICAvLyBfdGhpcy5jaGFydHNbZ3JhcGhJZF0uZ3JhcGhEYXRhID0gX3RoaXMuY2hhcnRzW2dyYXBoSWRdLnByZXZMZXZlbERhdGFbMF07XG4gICAgICAgICAgICAvLyBfdGhpcy5idWlsZEdyYXBoKHtcbiAgICAgICAgICAgIC8vICAgLi4uX3RoaXMuY2hhcnRzW2dyYXBoSWRdLFxuICAgICAgICAgICAgLy8gICBicmVhZENydW1iOiBbJ0hvbWUnXSxcbiAgICAgICAgICAgIC8vICAgY3VyckxldmVsOiAwLFxuICAgICAgICAgICAgLy8gICBwcmV2TGV2ZWxEYXRhOiBbXSxcbiAgICAgICAgICAgIC8vICAgb3JkZXI6IDAsXG4gICAgICAgICAgICAvLyAgIHNlbEtleXM6IFtdLFxuICAgICAgICAgICAgLy8gICBjb2xUb1Nob3c6ICcnLFxuICAgICAgICAgICAgLy8gfSBhcyBHcmFwaERhdGEpXG4gICAgICAgICAgfWVsc2V7XG4gICAgICAgICAgICBjb25zdCBpbmRleCA9IF90aGlzLmNoYXJ0c1tncmFwaElkXS5icmVhZENydW1iLmZpbmRJbmRleCgoZWw6IGFueSkgPT4gZWwgPT0gZXZlbnQudGFyZ2V0LmlkKTtcbiAgICAgICAgICAgIGNvbnNvbGUubG9nKCdpbmRleDogJywgaW5kZXgpO1xuICAgICAgICAgICAgaWYoaW5kZXggPiAwKXtcbiAgICAgICAgICAgICAgLy8gdGhpcy5idWlsZEdyYXBoKClcbiAgICAgICAgICAgICAgY29uc29sZS5sb2coJ3ByZXYgIF90aGlzLmNoYXJ0c1tncmFwaElkXTogJywgX3RoaXMuY2hhcnRzW2dyYXBoSWRdKTtcbiAgICAgICAgICAgICAgLy9SZXN0b3JpbmcgRGF0YSB1c2luZyBwcmV2aW91cyBzdG9yZSBkYXRhXG4gICAgICAgICAgICAgIF90aGlzLmNoYXJ0c1tncmFwaElkXS5jdXJyTGV2ZWwgPSBpbmRleDtcbiAgICAgICAgICAgICAgX3RoaXMuY2hhcnRzW2dyYXBoSWRdLmdyYXBoRGF0YSA9IF90aGlzLmNoYXJ0c1tncmFwaElkXS5wcmV2TGV2ZWxEYXRhW2luZGV4XTtcbiAgICAgICAgICAgICAgXG4gICAgICAgICAgICAgIC8vUmVmcmVzaCBQcmV2aW91cyBEYXRhIExpc3RcbiAgICAgICAgICAgICAgX3RoaXMuY2hhcnRzW2dyYXBoSWRdLnByZXZMZXZlbERhdGEgPSBfdGhpcy5jaGFydHNbZ3JhcGhJZF0ucHJldkxldmVsRGF0YS5zbGljZSgwLCBpbmRleCk7XG4gIFxuICAgICAgICAgICAgICBfdGhpcy5jaGFydHNbZ3JhcGhJZF0uYnJlYWRDcnVtYiA9IF90aGlzLmNoYXJ0c1tncmFwaElkXS5icmVhZENydW1iLnNsaWNlKDAsIGluZGV4ICsgMSk7XG4gICAgICAgICAgICAgIFxuICAgICAgICAgICAgICBfdGhpcy5jaGFydHNbZ3JhcGhJZF0uc2VsS2V5cyA9IF90aGlzLmNoYXJ0c1tncmFwaElkXS5zZWxLZXlzPy5zbGljZSgwLCBpbmRleCk7XG4gICAgICAgICAgICAgIFxuICAgICAgICAgICAgICBjb25zb2xlLmxvZygnX3RoaXMuY2hhcnRzW2dyYXBoSWRdOiAnLCBfdGhpcy5jaGFydHNbZ3JhcGhJZF0pO1xuICAgICAgICAgICAgICBfdGhpcy5idWlsZEdyYXBoKHtcbiAgICAgICAgICAgICAgICAuLi5fdGhpcy5jaGFydHNbZ3JhcGhJZF0sXG4gICAgICAgICAgICAgIH0gYXMgR3JhcGhEYXRhKVxuICAgICAgICAgICAgfVxuICAgICAgICAgIH1cbiAgICAgICAgfSlcbiAgICAgIH1cbiAgICAgIGJyZWFkQ3J1bWIuYXBwZW5kQ2hpbGQocGFyYSk7XG4gICAgICBsZXQgX3RoaXMgPSB0aGlzO1xuICAgIH0pO1xuICAgIGRpdiEuYXBwZW5kQ2hpbGQoYnJlYWRDcnVtYik7XG4gIH1cblxuICAvL3RyZW5kcyBEYXRhXG4gIHByaXZhdGUgYnVpbGRUcmVuZCh0cmVuZERhdGE6IFRyZW5kc0RhdGEpIHtcbiAgICBcbiAgICAvL1NldCBUcmVuZHNPYmplY3Qgd2l0aCBHcmFwaElkXG4gICAgdGhpcy50cmVuZHNbdHJlbmREYXRhLmdyYXBoSWRdID0gdHJlbmREYXRhO1xuXG4gICAgdGhpcy5pbml0VHJlbmQodHJlbmREYXRhLmdyYXBoSWQpO1xuICB9XG5cbiAgcHJpdmF0ZSBhc3luYyBpbml0VHJlbmQoZ3JhcGhJZDogYW55KSB7XG5cbiAgICAvL0NyZWF0aW5nIENoYXJ0IFJhdyBKc29uXG4gICAgY29uc3QgdHJlbmREYXRhOiBhbnkgPSBhd2FpdCB0aGlzLmNyZWF0ZVRyZW5kRGF0YShncmFwaElkKTtcbiAgICBjb25zb2xlLmxvZygndHJlbmREYXRhOiAnLCB0cmVuZERhdGEpO1xuXG4gICAgLy9SZW5kZXJpbmcgQ2hhcnQgb2YgR3JhcGhJZFxuICAgIGNvbnNvbGUubG9nKCdncmFwaElkOiAnLCBncmFwaElkKTtcbiAgICBzZXRUaW1lb3V0KCgpID0+IHtcbiAgICAgIHRoaXMuaGlnaGNoYXJ0cy5jaGFydChncmFwaElkLCB0cmVuZERhdGEpO1xuICAgIH0sIDUwMClcblxuICAgIHRoaXMuYWRkQWN0aW9uQnRuVHJlbmRzKGdyYXBoSWQpO1xuXG4gICAgcmV0dXJuIHRydWU7XG4gIH1cblxuICBwcml2YXRlIGFkZEFjdGlvbkJ0blRyZW5kcyhncmFwaElkOiBzdHJpbmcpIHtcbiAgICBpZih0aGlzLnN5c3RlbUFwaXMuaW5jbHVkZXModGhpcy50cmVuZHNbZ3JhcGhJZF0uc291cmNlSWQpKXtcbiAgICAgIHJldHVybjtcbiAgICB9XG4gICAgbGV0IF9zZWxmID0gdGhpcztcbiAgICBjb25zdCBkaXYgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdkaXYnKTtcbiAgICBkaXYuc2V0QXR0cmlidXRlKCdzdHlsZScsIHRoaXMuZGl2U3R5bGVzKTtcbiAgICBsZXQgY2FsZW5kYXJJY29uID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnaScpOyAvL0NhbGVuZGFyIEljb25cbiAgICBjYWxlbmRhckljb24uc2V0QXR0cmlidXRlKCdzdHlsZScsIHRoaXMuaWNvblN0eWxlcyk7XG4gICAgY2FsZW5kYXJJY29uLnNldEF0dHJpYnV0ZSgnY2xhc3MnLCAnZmEgZmEtY2FsZW5kYXInKTtcbiAgICBjb25zdCBkb3dubG9hZEljb24gPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KFwiaVwiKTtcbiAgICBkb3dubG9hZEljb24uc2V0QXR0cmlidXRlKCdpZCcsICdkb3dubG9hZEAnICsgZ3JhcGhJZCk7XG4gICAgZG93bmxvYWRJY29uLnNldEF0dHJpYnV0ZSgnc3R5bGUnLCB0aGlzLmljb25TdHlsZXMpO1xuICAgIGRvd25sb2FkSWNvbi5zZXRBdHRyaWJ1dGUoJ2NsYXNzJywgJ2ZhIGZhLWRvd25sb2FkJylcblxuICAgIGRpdi5hcHBlbmRDaGlsZChkb3dubG9hZEljb24pO1xuICAgIGRpdi5hcHBlbmRDaGlsZChjYWxlbmRhckljb24pO1xuICAgIC8vQ2FsZW5kYXIgSWNvbiBDbGljayBoYW5kbGVyXG4gICAgY2FsZW5kYXJJY29uLmFkZEV2ZW50TGlzdGVuZXIoJ2NsaWNrJywgZnVuY3Rpb24gKGU6IGFueSkge1xuICAgICAgdmFyIF9hO1xuICAgICAgaWYgKGUudGFyZ2V0LmxvY2FsTmFtZSA9PSAnaScpIHtcbiAgICAgICAgaWYgKFxuICAgICAgICAgICgoX2EgPSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZCgnaGlkZGVuLWRhdGUtJyArIGdyYXBoSWQpKSA9PT0gbnVsbCB8fFxuICAgICAgICAgIF9hID09PSB2b2lkIDBcbiAgICAgICAgICAgID8gdm9pZCAwXG4gICAgICAgICAgICA6IF9hLnN0eWxlLmRpc3BsYXkpID09ICdibG9jaydcbiAgICAgICAgKSB7XG4gICAgICAgICAgZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoJ2hpZGRlbi1kYXRlLScgKyBncmFwaElkKSEuc3R5bGUuZGlzcGxheSA9XG4gICAgICAgICAgICAnbm9uZSc7IC8vIEhpZGUgQ2hhbmdlIERhdGUgbW9kYWxcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICBkb2N1bWVudC5nZXRFbGVtZW50QnlJZCgnaGlkZGVuLWRhdGUtJyArIGdyYXBoSWQpIS5zdHlsZS5kaXNwbGF5ID1cbiAgICAgICAgICAgICdibG9jayc7IC8vU2hvdyBDaGFuZ2UgRGF0ZSBtb2RhbFxuICAgICAgICB9XG4gICAgICB9XG4gICAgfSk7XG4gICAgbGV0IGRpdjIgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdkaXYnKTsgLy9DaGFuZ2UgRGF0ZSBNb2RhbFxuICAgIGRpdjIuc2V0QXR0cmlidXRlKFxuICAgICAgJ3N0eWxlJyxcbiAgICAgIHRoaXMuZGl2U3R5bGVzICtcbiAgICAgICAgJ2Rpc3BsYXk6IG5vbmU7cGFkZGluZzogMzAlO2hlaWdodDogMjIwcHg7YmFja2dyb3VuZC1jb2xvcjogI2NjYzt3aWR0aDogMTcycHg7Ym9yZGVyLXJhZGl1czogNXB4OydcbiAgICApO1xuICAgIGRpdjIuc2V0QXR0cmlidXRlKCdpZCcsICdoaWRkZW4tZGF0ZS0nICsgZ3JhcGhJZCk7XG4gICAgbGV0IHN0YXJ0RGF0ZUlucHV0ID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnaW5wdXQnKTsgLy9TdGFydCBEYXRlIElucHV0XG4gICAgbGV0IHN0YXJ0RGF0ZUxhYmVsID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnbGFiZWwnKTtcbiAgICBzdGFydERhdGVMYWJlbC5pbm5lckhUTUwgPSAnU3RhcnQgRGF0ZSc7XG4gICAgc3RhcnREYXRlSW5wdXQuc2V0QXR0cmlidXRlKCd0eXBlJywgJ2RhdGUnKTtcbiAgICBzdGFydERhdGVJbnB1dC5zZXRBdHRyaWJ1dGUoJ2NsYXNzJywgJ2Zvcm0tY29udHJvbCBzdGFydERhdGUtJyArIGdyYXBoSWQpO1xuICAgIHN0YXJ0RGF0ZUlucHV0LnNldEF0dHJpYnV0ZSgndmFsdWUnLCB0aGlzLnRyZW5kc1tncmFwaElkXS5yYW5nZS5zdGFydERhdGUpO1xuICAgIGxldCBlbmREYXRlSW5wdXQgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdpbnB1dCcpOyAvL0VuZCBEYXRlIElucHV0XG4gICAgbGV0IGVuZERhdGVMYWJlbCA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ2xhYmVsJyk7XG4gICAgZW5kRGF0ZUxhYmVsLmlubmVySFRNTCA9ICdFbmQgRGF0ZSc7XG4gICAgZW5kRGF0ZUlucHV0LnNldEF0dHJpYnV0ZSgndHlwZScsICdkYXRlJyk7XG4gICAgZW5kRGF0ZUlucHV0LnNldEF0dHJpYnV0ZSgnY2xhc3MnLCAnZm9ybS1jb250cm9sIGVuZERhdGUtJyArIGdyYXBoSWQpO1xuICAgIGVuZERhdGVJbnB1dC5zZXRBdHRyaWJ1dGUoJ3ZhbHVlJywgdGhpcy50cmVuZHNbZ3JhcGhJZF0ucmFuZ2UuZW5kRGF0ZSk7XG4gICAgbGV0IHN1Ym1pdEJ1dHRvbiA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ2J1dHRvbicpO1xuICAgIHN1Ym1pdEJ1dHRvbi5pbm5lckhUTUwgPSAnRG9uZSc7XG4gICAgc3VibWl0QnV0dG9uLnNldEF0dHJpYnV0ZSgnY2xhc3MnLCAnYnRuIGJ0bi1zdWNjZXNzJyk7XG4gICAgc3VibWl0QnV0dG9uLnNldEF0dHJpYnV0ZSgnc3R5bGUnLCAnZmxvYXQ6IHJpZ2h0OycpO1xuICAgIC8vSGFuZGxlIFN1Ym1pdCBidXR0b24gY2xpY2tcbiAgICBzdWJtaXRCdXR0b24uYWRkRXZlbnRMaXN0ZW5lcignY2xpY2snLCBmdW5jdGlvbiAoKSB7XG4gICAgICBsZXQgc3RhcnREYXRlOiBhbnkgPSBkb2N1bWVudC5xdWVyeVNlbGVjdG9yKCcuc3RhcnREYXRlLScgKyBncmFwaElkKTtcbiAgICAgIGxldCBlbmREYXRlOiBhbnkgPSBkb2N1bWVudC5xdWVyeVNlbGVjdG9yKCcuZW5kRGF0ZS0nICsgZ3JhcGhJZCk7XG4gICAgICBsZXQgZCA9IHtcbiAgICAgICAgZ3JhcGhJZDogZ3JhcGhJZC5zcGxpdChcIi1cIilbMV0sXG4gICAgICAgIGRhdGFGaWx0ZXI6IF9zZWxmLnRyZW5kc1tncmFwaElkXS5kYXNoYm9hcmRGaWx0ZXIsXG4gICAgICAgIGRpcmVjdGlvbjogX3NlbGYudHJlbmRzW2dyYXBoSWRdLm9yZGVyLFxuICAgICAgICBhZG1pbklkOiBfc2VsZi50cmVuZHNbZ3JhcGhJZF0uYWRtaW5JZCxcbiAgICAgICAgc2hhcmVpZDogX3NlbGYudHJlbmRzW2dyYXBoSWRdLnNoYXJlaWQgPz8gbnVsbCxcbiAgICAgICAgc3RhcnREYXRlOiBzdGFydERhdGUudmFsdWUsXG4gICAgICAgIGVuZERhdGU6IGVuZERhdGUudmFsdWVcbiAgICAgIH1cbiAgICAgIFN3YWwuZmlyZSh7XG4gICAgICAgIHRleHQ6IFwiUGxlYXNlIFdhaXQuLi5cIixcbiAgICAgICAgYWxsb3dPdXRzaWRlQ2xpY2s6IGZhbHNlXG4gICAgICB9KVxuICAgICAgU3dhbC5zaG93TG9hZGluZygpO1xuICAgICAgX3NlbGYuZGF0YVNlcnZpY2UuZ2V0R3JhcGhEYXRhQnlJZChkKS50aGVuKChyZXM6IGFueSkgPT4ge1xuICAgICAgICBfc2VsZi50cmVuZHNbZ3JhcGhJZF0uZ3JhcGhEYXRhID0gcmVzLmRhdGE7XG4gICAgICAgIFN3YWwuaGlkZUxvYWRpbmcoKTtcbiAgICAgICAgU3dhbC5jbG9zZSgpO1xuICAgICAgICBfc2VsZi5idWlsZFRyZW5kKF9zZWxmLnRyZW5kc1tncmFwaElkXSk7XG4gICAgICB9KVxuICAgICAgZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoJ2hpZGRlbi1kYXRlLScgKyBncmFwaElkKSEuc3R5bGUuZGlzcGxheSA9ICdub25lJztcbiAgICB9KTtcbiAgICBkaXYyLmFwcGVuZChcbiAgICAgIHN0YXJ0RGF0ZUxhYmVsLFxuICAgICAgc3RhcnREYXRlSW5wdXQsXG4gICAgICBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdicicpLFxuICAgICAgZW5kRGF0ZUxhYmVsLFxuICAgICAgZW5kRGF0ZUlucHV0LFxuICAgICAgZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnYnInKSxcbiAgICAgIHN1Ym1pdEJ1dHRvblxuICAgICk7IC8vIEFwcGVuZGluZyBJbnB1dHMgaW4gQ2hhbmdlIERhdGUgTW9kYWxcbiAgICBkaXYuYXBwZW5kKGNhbGVuZGFySWNvbik7IC8vQWRkIENhbGVuZGFyIGljb24gaW4gYWN0aW9uIGJ1dHRvblxuICAgIGRpdi5hcHBlbmRDaGlsZChkaXYyKTsgLy9BZGQgQ2hhbmdlIERhdGUgbW9kYWwgaW4gYWN0aW9uIGJ1dHRvblxuICAgIGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3IoJyMnICsgZ3JhcGhJZCkhLmFwcGVuZENoaWxkKGRpdik7IC8vUmVuZGVyaW5nIGFjdGlvbiBidXR0b25zIHRvIGdyYXBoIGRpdlxuICAgIGRvd25sb2FkSWNvbi5hZGRFdmVudExpc3RlbmVyKCdjbGljaycsIGZ1bmN0aW9uIChlOiBhbnkpIHtcbiAgICAgIGNvbnN0IHRlbXBBcnIgPSBlLnRhcmdldC5pZC5zcGxpdCgnQCcpO1xuICAgICAgY29uc3QgZ3JhcGhJZCA9IHRlbXBBcnJbdGVtcEFyci5sZW5ndGggLSAxXTtcbiAgICAgIGxldCBkYXRhT2JqID0ge1xuICAgICAgICBncmFwaElkOiBncmFwaElkLnNwbGl0KFwiLVwiKVsxXSxcbiAgICAgICAgY3VyckxldmVsOiAwLFxuICAgICAgICBjb2xJZDogbnVsbCxcbiAgICAgICAgc2VsS2V5OiBfc2VsZi50cmVuZHNbZ3JhcGhJZF0uc2VsS2V5cyxcbiAgICAgICAgY29sVG9TaG93OiBudWxsLFxuICAgICAgICBkaXJlY3Rpb246IDAsXG4gICAgICAgIGRhdGFGaWx0ZXI6IF9zZWxmLnRyZW5kc1tncmFwaElkXS5kYXNoYm9hcmRGaWx0ZXIsXG4gICAgICAgIGFkbWluSWQ6IF9zZWxmLnRyZW5kc1tncmFwaElkXS5hZG1pbklkLFxuICAgICAgICBzaGFyZWlkOiBfc2VsZi50cmVuZHNbZ3JhcGhJZF0uc2hhcmVpZCA/PyBudWxsLFxuICAgICAgICBzdGFydERhdGU6IF9zZWxmLmRhdGVQaXBlLnRyYW5zZm9ybShfc2VsZi50cmVuZHNbZ3JhcGhJZF0ucmFuZ2UhLnN0YXJ0RGF0ZSxcInl5eXktTU0tZGRcIiksXG4gICAgICAgIGVuZERhdGU6IF9zZWxmLmRhdGVQaXBlLnRyYW5zZm9ybShfc2VsZi50cmVuZHNbZ3JhcGhJZF0ucmFuZ2UhLmVuZERhdGUsXCJ5eXl5LU1NLWRkXCIpLFxuICAgICAgICBmZXRjaFJhd0RhdGE6IHRydWVcbiAgICAgIH1cbiAgICAgIF9zZWxmLmRvd25sb2FkR3JhcGhEYXRhKGUsZ3JhcGhJZCwgZGF0YU9iaixfc2VsZi50cmVuZHNbZ3JhcGhJZF0ubGFzdExldmVsQ29sdW1ucyk7XG4gICAgfSk7XG4gIH1cblxuICBwcml2YXRlIGdldFBsb3RPcHRpb25zVHJlbmRzKGdyYXBoSWQ6IHN0cmluZykge1xuICAgIGxldCBwbG90T3B0aW9ucyA9IHtcbiAgICAgIHNlcmllczoge1xuICAgICAgICB0dXJib1RocmVzaG9sZDogMTAwMDAsXG4gICAgICAgIGRhdGFMYWJlbHM6IHtcbiAgICAgICAgICBjb2xvcjogJ2JsYWNrJyxcbiAgICAgICAgICBlbmFibGVkOiB0cnVlLFxuICAgICAgICAgIHN0eWxlOiB7XG4gICAgICAgICAgICBjb2xvcjogJ2JsYWNrJyxcbiAgICAgICAgICAgIHRleHRTaGFkb3c6IGZhbHNlLFxuICAgICAgICAgICAgdGV4dERlY29yYXRpb246ICdub25lJyxcbiAgICAgICAgICB9LFxuICAgICAgICB9LFxuICAgICAgICBsYWJlbDoge1xuICAgICAgICAgIHN0eWxlOiB7XG4gICAgICAgICAgICBjb2xvcjogJ2JsYWNrJyxcbiAgICAgICAgICB9LFxuICAgICAgICB9LFxuICAgICAgfSxcbiAgICB9O1xuICAgIHJldHVybiBwbG90T3B0aW9ucztcbiAgfVxuXG4gIHByaXZhdGUgY3JlYXRlVHJlbmREYXRhKGdyYXBoSWQ6IGFueSk6IGFueSB7XG4gICAgbGV0IF9zZWxmID0gdGhpcztcblxuICAgIC8vR2V0dGluZyBQbG90IE9wdGlvbnMgZm9yIEdyYXBoXG4gICAgY29uc3QgcGxvdE9wdGlvbnMgPSB0aGlzLmdldFBsb3RPcHRpb25zVHJlbmRzKGdyYXBoSWQpO1xuXG4gICAgcmV0dXJuIHtcbiAgICAgIGNyZWRpdHM6IHtcbiAgICAgICAgdGV4dDogdGhpcy5jcmVkaXRUaXRsZSxcbiAgICAgICAgaHJlZjogdGhpcy5jcmVkaXRVcmwsXG4gICAgICAgIHN0eWxlOiB7XG4gICAgICAgICAgZm9udFNpemU6ICcxMnB4JyxcbiAgICAgICAgfSxcbiAgICAgIH0sXG4gICAgICB0aXRsZTogbnVsbCxcbiAgICAgIHBsb3RPcHRpb25zOiBwbG90T3B0aW9ucyxcbiAgICAgIGNoYXJ0OiB7XG4gICAgICAgIHR5cGU6ICdsaW5lJyxcbiAgICAgICAgZXZlbnRzOiB7XG4gICAgICAgICAgLy9IYW5kbGUgRHJpbGxkb3duIEV2ZW50IG9mIEdyYXBoXG4gICAgICAgICAgZHJpbGxkb3duOiBmdW5jdGlvbiAoZTogYW55KSB7XG4gICAgICAgICAgICBpZihlLnBvaW50cyAhPSBmYWxzZSkgcmV0dXJuIFxuICAgICAgICAgICAgbGV0IGN1cnJHcmFwaElkID0gZS50YXJnZXQudXNlck9wdGlvbnMuc2VyaWVzWzBdLmdyYXBoSWQ7IC8vR3JhcGhJZFxuICAgICAgICAgICAgbGV0IGNvbEluZGV4ID0gZS5wb2ludC5jb2xJbmRleDsgLy9Db2xvckluZGV4IG9mIGJhclxuICAgICAgICAgICAgbGV0IGNvbXBhcmlzb25LZXkgPSBlLnBvaW50Lm9wdGlvbnMuY29tcGFyaXNvbktleTsgLy9Db2xvckluZGV4IG9mIGJhclxuICAgICAgICAgICAgbGV0IGNoYXJ0IDogYW55ID0gdGhpcztcbiAgICAgICAgICAgIGNoYXJ0LnNob3dMb2FkaW5nKCdMb2FkaW5nLi4uJyk7XG4gICAgICAgICAgICBsZXQgc2VsS2V5ID0gZS5wb2ludC5uYW1lO1xuICAgICAgICAgICAgbGV0IGRhdGFPYmogPSB7XG4gICAgICAgICAgICAgIGdyYXBoSWQ6IGN1cnJHcmFwaElkLFxuICAgICAgICAgICAgICBjdXJyTGV2ZWw6IDEsXG4gICAgICAgICAgICAgIGNvbElkOiBjb2xJbmRleCxcbiAgICAgICAgICAgICAgc2VsS2V5OiBbc2VsS2V5XSxcbiAgICAgICAgICAgICAgY29sVG9TaG93OiBudWxsLFxuICAgICAgICAgICAgICBkaXJlY3Rpb246IDAsXG4gICAgICAgICAgICAgIGRhdGFGaWx0ZXI6IF9zZWxmLnRyZW5kc1tcImdyYXBoLVwiICsgY3VyckdyYXBoSWRdLmRhc2hib2FyZEZpbHRlcixcbiAgICAgICAgICAgICAgYWRtaW5JZDogX3NlbGYudHJlbmRzW1wiZ3JhcGgtXCIgKyBjdXJyR3JhcGhJZF0uYWRtaW5JZCxcbiAgICAgICAgICAgICAgc2hhcmVpZDogX3NlbGYudHJlbmRzW1wiZ3JhcGgtXCIgKyBjdXJyR3JhcGhJZF0uc2hhcmVpZCA/PyBudWxsLFxuICAgICAgICAgICAgICBzdGFydERhdGU6IF9zZWxmLmRhdGVQaXBlLnRyYW5zZm9ybShfc2VsZi50cmVuZHNbXCJncmFwaC1cIiArIGN1cnJHcmFwaElkXS5yYW5nZS5zdGFydERhdGUsXCJ5eXl5LU1NLWRkXCIpLFxuICAgICAgICAgICAgICBlbmREYXRlOiBfc2VsZi5kYXRlUGlwZS50cmFuc2Zvcm0oX3NlbGYudHJlbmRzW1wiZ3JhcGgtXCIgKyBjdXJyR3JhcGhJZF0ucmFuZ2UuZW5kRGF0ZSxcInl5eXktTU0tZGRcIilcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGlmKGNvbXBhcmlzb25LZXkgIT0gbnVsbCl7XG4gICAgICAgICAgICAgIGRhdGFPYmouc2VsS2V5LnB1c2goY29tcGFyaXNvbktleSk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBfc2VsZi5kYXRhU2VydmljZS5nZXRHcmFwaERyaWxsZG93bkJ5SWQoZGF0YU9iaikudGhlbigocmVzIDogYW55KSA9PiB7XG4gICAgICAgICAgICAgIC8vT3BlbiBMYXN0IExldmVsIENvbXBvbmVudFxuICAgICAgICAgICAgIFxuICAgICAgICAgICAgICBfc2VsZi5kYXRhU2VydmljZS5zZXRNb2RhbERhdGEoe1xuICAgICAgICAgICAgICAgIGNvbFRvVmlldzogX3NlbGYudHJlbmRzW1wiZ3JhcGgtXCIgKyBjdXJyR3JhcGhJZF0ubGFzdExldmVsQ29sdW1ucyxcbiAgICAgICAgICAgICAgICByZWZEYXRhOiByZXMuZGF0YSxcbiAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICAgIGxldCBtb2RhbE9wdGlvbnMgPSB7XG4gICAgICAgICAgICAgICAgcGFuZWxDbGFzczogJ2RhdGFQb3B1cC1tb2RhbCcsXG4gICAgICAgICAgICAgICAgYmFja2Ryb3BDbGFzczogJ21vZGFsLWJhY2tkcm9wJyxcbiAgICAgICAgICAgICAgfTtcbiAgICAgICAgICAgICAgX3NlbGYuZGlhbG9nLm9wZW4oRGF0YVBvcHVwQ29tcG9uZW50LCBtb2RhbE9wdGlvbnMpO1xuXG4gICAgICAgICAgICAgIHNldFRpbWVvdXQoKCkgPT4ge1xuICAgICAgICAgICAgICAgIC8vSGlkZSBMb2FkaW5nIGluIGNoYXJ0XG4gICAgICAgICAgICAgICAgY2hhcnQuaGlkZUxvYWRpbmcoKTtcbiAgICAgICAgICAgICAgfSwgMTAwMCk7XG4gICAgICAgICAgICAgIC8vIHJldHVybjtcbiAgICAgICAgICAgIH0pXG4gICAgICAgICAgfSxcbiAgICAgICAgfSxcbiAgICAgIH0sXG4gICAgICB4QXhpczoge1xuICAgICAgICB0eXBlOiAnY2F0ZWdvcnknLFxuICAgICAgICBsYWJlbHM6IHtcbiAgICAgICAgICBzdHlsZToge1xuICAgICAgICAgICAgY29sb3I6ICdyZWQnLFxuICAgICAgICAgICAgdGV4dERlY29yYXRpb246ICdub25lJyxcbiAgICAgICAgICAgIHRleHRPdXRsaW5lOiAnMHB4JyxcbiAgICAgICAgICB9LFxuICAgICAgICB9LFxuICAgICAgICBtaW46IDAsXG4gICAgICAgIGFsbG93RGVjaW1hbHM6IGZhbHNlLFxuICAgICAgICBzY3JvbGxiYXI6IHtcbiAgICAgICAgICBlbmFibGVkOiB0cnVlLFxuICAgICAgICB9LFxuICAgICAgfSxcbiAgICAgIHlBeGlzOiBbXG4gICAgICAgIHtcbiAgICAgICAgICBvcHBvc2l0ZTogdHJ1ZSxcbiAgICAgICAgICB0aXRsZToge1xuICAgICAgICAgICAgdGV4dDogbnVsbCxcbiAgICAgICAgICB9LFxuICAgICAgICB9LFxuICAgICAgXSxcbiAgICAgIHNlcmllczogdGhpcy50cmVuZHNbZ3JhcGhJZF0uZ3JhcGhEYXRhLFxuICAgIH07XG4gIH1cbn0iXX0=