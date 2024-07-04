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
    //trends Data
    buildTrend(trendData) {
        //Set TrendsObject with GraphId
        this.trends[trendData.graphId] = trendData;
        this.initTrend(trendData.graphId);
    }
    async initTrend(graphId) {
        //Creating Chart Raw Json
        const trendData = await this.createTrendData(graphId);
        //Rendering Chart of GraphId
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoieHNpZ2h0cy1iYWNrZW5kLnNlcnZpY2UuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi8uLi8uLi9wcm9qZWN0cy94LXNpZ2h0cy1jb3JlL3NyYy9saWIvc2VydmljZXMveHNpZ2h0cy1iYWNrZW5kLnNlcnZpY2UudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUEsT0FBTyxFQUFFLFVBQVUsRUFBRSxNQUFNLGVBQWUsQ0FBQztBQUUzQyxPQUFPLEtBQUssVUFBVSxNQUFNLFlBQVksQ0FBQztBQUN6QyxPQUFPLFNBQVMsTUFBTSw4QkFBOEIsQ0FBQztBQUNyRCxPQUFPLEtBQUssTUFBTSxNQUFNLFFBQVEsQ0FBQztBQUNqQyxPQUFPLFlBQVksTUFBTSw4QkFBOEIsQ0FBQztBQUN4RCxPQUFPLGdCQUFnQixNQUFNLHNDQUFzQyxDQUFDO0FBRXBFLE9BQU8sYUFBYSxNQUFNLGtDQUFrQyxDQUFDO0FBQzdELE9BQU8sVUFBVSxNQUFNLDBCQUEwQixDQUFDO0FBQ2xELE9BQU8sS0FBSyxRQUFRLE1BQU0sWUFBWSxDQUFDO0FBSXZDLE9BQU8sRUFFTCxVQUFVLEdBRVgsTUFBTSxnQ0FBZ0MsQ0FBQztBQWlDeEMsT0FBTyxFQUFFLGtCQUFrQixFQUFFLE1BQU0sK0NBQStDLENBQUM7QUFHbkYsT0FBTyxJQUFJLE1BQU0sYUFBYSxDQUFDO0FBQy9CLE9BQU8sRUFBYSxhQUFhLEVBQUUsTUFBTSxzQkFBc0IsQ0FBQzs7Ozs7QUFFaEUsWUFBWSxDQUFDLFVBQVUsQ0FBQyxDQUFDO0FBQ3pCLGdCQUFnQixDQUFDLFVBQVUsQ0FBQyxDQUFDO0FBQzdCLDBCQUEwQjtBQUMxQixVQUFVLENBQUMsVUFBVSxDQUFDLENBQUM7QUFDdkIsYUFBYSxDQUFDLFVBQVUsQ0FBQyxDQUFDO0FBQzFCLFNBQVMsQ0FBQyxVQUFVLENBQUMsQ0FBQztBQUV0QixNQUFNLENBQU4sSUFBWSxVQUlYO0FBSkQsV0FBWSxVQUFVO0lBQ3BCLDZCQUFlLENBQUE7SUFDZiw2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LFNBQVM7U0FDdkMsQ0FBQztJQUNKLENBQUM7O2tIQW42QlUscUJBQXFCO3NIQUFyQixxQkFBcUIsY0FGcEIsTUFBTTsyRkFFUCxxQkFBcUI7a0JBSGpDLFVBQVU7bUJBQUM7b0JBQ1YsVUFBVSxFQUFFLE1BQU07aUJBQ25CIiwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0IHsgSW5qZWN0YWJsZSB9IGZyb20gJ0Bhbmd1bGFyL2NvcmUnO1xuaW1wb3J0IHsgTmdiTW9kYWwsIE5nYk1vZGFsQ29uZmlnIH0gZnJvbSAnQG5nLWJvb3RzdHJhcC9uZy1ib290c3RyYXAnO1xuaW1wb3J0ICogYXMgSGlnaGNoYXJ0cyBmcm9tICdoaWdoY2hhcnRzJztcbmltcG9ydCBEcmlsbGRvd24gZnJvbSAnaGlnaGNoYXJ0cy9tb2R1bGVzL2RyaWxsZG93bic7XG5pbXBvcnQgKiBhcyBsb2Rhc2ggZnJvbSAnbG9kYXNoJztcbmltcG9ydCBIQ19leHBvcnRpbmcgZnJvbSAnaGlnaGNoYXJ0cy9tb2R1bGVzL2V4cG9ydGluZyc7XG5pbXBvcnQgb2ZmbGluZUV4cG9ydGluZyBmcm9tICdoaWdoY2hhcnRzL21vZHVsZXMvb2ZmbGluZS1leHBvcnRpbmcnO1xuaW1wb3J0IGV4cG9ydERhdGEgZnJvbSAnaGlnaGNoYXJ0cy9tb2R1bGVzL2V4cG9ydC1kYXRhJztcbmltcG9ydCBhY2Nlc3NpYmlsaXR5IGZyb20gJ2hpZ2hjaGFydHMvbW9kdWxlcy9hY2Nlc3NpYmlsaXR5JztcbmltcG9ydCBoaWdoU3RvY2tzIGZyb20gJ2hpZ2hjaGFydHMvbW9kdWxlcy9zdG9jayc7XG5pbXBvcnQgKiBhcyBGaWxlU2F2ZSBmcm9tICdmaWxlLXNhdmVyJztcblxuXG5pbXBvcnQgRGVjaW1hbCBmcm9tICdkZWNpbWFsLmpzJztcbmltcG9ydCB7XG4gIEdyYXBoRGF0YSxcbiAgR3JhcGhUeXBlcyxcbiAgR3JhcGhMaXN0LFxufSBmcm9tICcuLi9kYXRhLXR5cGVzL2dyYXBoLWludGVyZmFjZXMnO1xuaW1wb3J0IHtcbiAgUmFuZ2VGaWx0ZXIsXG4gIFRyZW5kc0RhdGEsXG4gIFRyZW5kc0xpc3QsXG59IGZyb20gJy4uL2RhdGEtdHlwZXMvdHJlbmQtaW50ZXJmYWNlcyc7XG5pbXBvcnQge1xuICBBZ2dyZWdhdGlvbkZ1bmN0aW9uLFxuICBBZ2dyZWdhdGlvbkZ1bmN0aW9uc1R5cGUsXG59IGZyb20gJy4uL2RhdGEtdHlwZXMvYWdncmVnYXRpb24taW50ZXJmYWNlcyc7XG5pbXBvcnQge1xuICBDdXN0b21GaWx0ZXIsXG4gIEN1c3RvbUZpbHRlclR5cGVzLFxuICBGaWx0ZXJzLFxuICBGaWx0ZXJUeXBlcyxcbn0gZnJvbSAnLi4vZGF0YS10eXBlcy9maWx0ZXItaW50ZXJmYWNlcyc7XG5pbXBvcnQge1xuICBEZXJpdmVkVmFyaWFibGUsXG4gIERlcml2ZWRWYXJpYWJsZUZpbHRlcixcbiAgRGVyaXZlZFZhcmlhYmxlRmlsdGVyQ29uZGl0aW9uLFxufSBmcm9tICcuLi9kYXRhLXR5cGVzL2Rlcml2ZWQtdmFyaWFibGUtaW50ZXJmYWNlcyc7XG5pbXBvcnQge1xuICBEYXRhRm9ybWF0LFxuICBEYXRhVHlwZSxcbiAgRGF0ZUZvcm1hdCxcbiAgVGltZUZvcm1hdCxcbn0gZnJvbSAnLi4vZGF0YS10eXBlcy92YXJpYWJsZS10eXBlcyc7XG5pbXBvcnQge1xuICBGaWVsZHMsXG4gIFBpdm90RmllbGRzQXJlYSxcbiAgUGl2b3RUYWJsZURhdGEsXG59IGZyb20gJy4uL2RhdGEtdHlwZXMvcGl2b3QtaW50ZXJmYWNlcyc7XG5pbXBvcnQgUGl2b3RHcmlkRGF0YVNvdXJjZSBmcm9tICdkZXZleHRyZW1lL3VpL3Bpdm90X2dyaWQvZGF0YV9zb3VyY2UnO1xuaW1wb3J0IHsgRGF0YVBvcHVwQ29tcG9uZW50IH0gZnJvbSAnLi4vY29tcG9uZW50cy9kYXRhLXBvcHVwL2RhdGEtcG9wdXAuY29tcG9uZW50JztcbmltcG9ydCB7IERhdGFTZXJ2aWNlIH0gZnJvbSAnLi4vc2VydmljZXMvZGF0YS5zZXJ2aWNlJztcbmltcG9ydCB7IERhdGVQaXBlIH0gZnJvbSAnQGFuZ3VsYXIvY29tbW9uJztcbmltcG9ydCBTd2FsIGZyb20gJ3N3ZWV0YWxlcnQyJztcbmltcG9ydCB7IEh0dHBFdmVudCwgSHR0cEV2ZW50VHlwZSB9IGZyb20gJ0Bhbmd1bGFyL2NvbW1vbi9odHRwJztcblxuSENfZXhwb3J0aW5nKEhpZ2hjaGFydHMpO1xub2ZmbGluZUV4cG9ydGluZyhIaWdoY2hhcnRzKTtcbi8vIGV4cG9ydERhdGEoSGlnaGNoYXJ0cyk7XG5oaWdoU3RvY2tzKEhpZ2hjaGFydHMpO1xuYWNjZXNzaWJpbGl0eShIaWdoY2hhcnRzKTtcbkRyaWxsZG93bihIaWdoY2hhcnRzKTtcblxuZXhwb3J0IGVudW0gV2lkZ2V0VHlwZSB7XG4gIEdSQVBIID0gJ2dyYXBoJyxcbiAgVFJFTkQgPSAndHJlbmQnLFxuICBQSVZPVF9UQUJMRSA9ICdwaXZvdF90YWJsZScsXG59XG5cbkBJbmplY3RhYmxlKHtcbiAgcHJvdmlkZWRJbjogJ3Jvb3QnXG59KVxuZXhwb3J0IGNsYXNzIFhzaWdodHNCYWNrZW5kU2VydmljZSB7XG4gIHByaXZhdGUgc3lzdGVtQXBpcyA9IFsnMTk4JywgJzEzOCcsICcyNzknXTtcbiAgcHJpdmF0ZSBtb2RhbERhdGE6IGFueSA9IHt9O1xuICBwcml2YXRlIGhpZ2hjaGFydHM6IHR5cGVvZiBIaWdoY2hhcnRzID0gSGlnaGNoYXJ0cztcbiAgcHJpdmF0ZSBkaXZTdHlsZXMgPVxuICAgICdkaXNwbGF5OiBmbGV4OyBqdXN0aWZ5LWNvbnRlbnQ6IGZsZXgtc3RhcnQ7IGFsaWduLWl0ZW1zOiBjZW50ZXI7IHBvc2l0aW9uOiBhYnNvbHV0ZTsgdG9wOiA1cHg7IGxlZnQ6IDVweDsnO1xuICBwcml2YXRlIGljb25TdHlsZXMgPVxuICAgICdib3JkZXI6IDJweCBzb2xpZCAjZWVlOyBwYWRkaW5nOiA1cHg7IG1pbi13aWR0aDogMjhweDsgdGV4dC1hbGlnbjogY2VudGVyOyBib3JkZXItcmFkaXVzOiA4cHg7IGJhY2tncm91bmQ6ICNjY2M7IGJveC1zaGFkb3c6IDJweCAycHggMnB4ICNjY2M7IG1hcmdpbi1yaWdodDogMTBweDsnO1xuICBwcml2YXRlIGJyZWFkY3J1bWJTdHlsZXMgPVxuICAgICdib3JkZXI6IDJweCBzb2xpZCAjZWVlOyBwYWRkaW5nOiA1cHg7ICBiYWNrZ3JvdW5kOiAjY2NjOyBtaW4td2lkdGg6IDI4cHg7IHRleHQtYWxpZ246IGNlbnRlcjsgYm9yZGVyLXJhZGl1czogOHB4OyBkaXNwbGF5OiBmbGV4OyBib3gtc2hhZG93OiAycHggMnB4IDJweCAjY2NjOyBtYXJnaW4tcmlnaHQ6IDEwcHg7JztcbiAgcHJpdmF0ZSBjcmVkaXRUaXRsZSA9ICdQb3dlcmVkIGJ5IEF4ZXN0cmFjayc7XG4gIHByaXZhdGUgY3JlZGl0VXJsID0gJ2h0dHBzOi8vd3d3LmF4ZXN0cmFjay5jb20vJztcblxuICBwcml2YXRlIGNoYXJ0czogR3JhcGhMaXN0ID0ge307XG4gIHByaXZhdGUgdHJlbmRzOiBUcmVuZHNMaXN0ID0ge307XG5cbiAgY29uc3RydWN0b3IoXG4gICAgcHJpdmF0ZSBkaWFsb2c6IE5nYk1vZGFsLFxuICAgIHByaXZhdGUgbW9kYWxDb25maWc6IE5nYk1vZGFsQ29uZmlnLFxuICAgIHByaXZhdGUgZGF0YVNlcnZpY2U6IERhdGFTZXJ2aWNlLFxuICAgIHByaXZhdGUgZGF0ZVBpcGU6IERhdGVQaXBlXG4gICkge1xuICAgIHRoaXMubW9kYWxDb25maWcubW9kYWxEaWFsb2dDbGFzcyA9ICdkYXRhcG9wdXAtZGFpbG9nJztcbiAgICB0aGlzLm1vZGFsQ29uZmlnLndpbmRvd0NsYXNzID0gJ2RhdGFwb3B1cC13aW5kb3cnO1xuICB9XG5cbiAgcHVibGljIGJ1aWxkKFxuICAgIHdpZGdldFR5cGU6IFdpZGdldFR5cGUsXG4gICAgd2lkZ2V0RGF0YTogR3JhcGhEYXRhIHwgVHJlbmRzRGF0YSB8IFBpdm90VGFibGVEYXRhXG4gICk6IFByb21pc2U8YW55PiB7XG4gICAgcmV0dXJuIG5ldyBQcm9taXNlKChyZXNvbHZlLCByZWplY3QpID0+IHtcbiAgICAgIHN3aXRjaCAod2lkZ2V0VHlwZSkge1xuICAgICAgICBjYXNlIFdpZGdldFR5cGUuR1JBUEg6XG4gICAgICAgICAgcmVzb2x2ZShcbiAgICAgICAgICAgIHRoaXMuYnVpbGRHcmFwaCh7XG4gICAgICAgICAgICAgIC4uLndpZGdldERhdGEsXG4gICAgICAgICAgICAgIGJyZWFkQ3J1bWI6IFsnSG9tZSddLFxuICAgICAgICAgICAgICBjdXJyTGV2ZWw6IDAsXG4gICAgICAgICAgICAgIHByZXZMZXZlbERhdGE6IFtdLFxuICAgICAgICAgICAgICBzZWxLZXlzOiBbXSxcbiAgICAgICAgICAgICAgb3JkZXI6IDAsXG4gICAgICAgICAgICAgIGNvbFRvU2hvdzogJycsXG4gICAgICAgICAgICB9IGFzIEdyYXBoRGF0YSlcbiAgICAgICAgICApO1xuICAgICAgICAgIGJyZWFrO1xuICAgICAgICBjYXNlIFdpZGdldFR5cGUuVFJFTkQ6XG4gICAgICAgICAgbGV0IHdpZGdldDogVHJlbmRzRGF0YSA9IHdpZGdldERhdGEgYXMgVHJlbmRzRGF0YTtcbiAgICAgICAgICByZXNvbHZlKFxuICAgICAgICAgICAgdGhpcy5idWlsZFRyZW5kKHtcbiAgICAgICAgICAgICAgLi4ud2lkZ2V0LFxuICAgICAgICAgICAgICByYXdEYXRhOiB3aWRnZXQuZ3JhcGhEYXRhLFxuICAgICAgICAgICAgICBjdXJyTGV2ZWw6IDEsXG4gICAgICAgICAgICAgIG9yZGVyOiAwLFxuICAgICAgICAgICAgICBwcmV2TGV2ZWxEYXRhOiBbXSxcbiAgICAgICAgICAgIH0gYXMgVHJlbmRzRGF0YSlcbiAgICAgICAgICApO1xuICAgICAgICAgIGJyZWFrO1xuICAgICAgfVxuICAgIH0pO1xuICB9XG5cbiAgLy9HcmFwaCBGdW5jdGlvblxuICBwcml2YXRlIGFzeW5jIGJ1aWxkR3JhcGgoZ3JhcGhEYXRhOiBHcmFwaERhdGEpOiBQcm9taXNlPGJvb2xlYW4+IHtcblxuICAgIC8vU2V0IEdyYXBoT2JqZWN0IHdpdGggR3JhcGhJZFxuICAgIHRoaXMuY2hhcnRzW2dyYXBoRGF0YS5ncmFwaElkXSA9IGdyYXBoRGF0YTtcbiAgICBpZiAodGhpcy5jaGFydHNbZ3JhcGhEYXRhLmdyYXBoSWRdLnJvd3NbdGhpcy5jaGFydHNbZ3JhcGhEYXRhLmdyYXBoSWRdLmN1cnJMZXZlbF0gPT0gJyoqKkxBQkVMKioqJykge1xuICAgICAgLy9DcmVhdGUgTGFiZWwgQmxvY2tcbiAgICAgIGxldCByZXNwb25zZSA9IGF3YWl0IHRoaXMucHVibGlzaExhYmVsKGdyYXBoRGF0YS5ncmFwaElkKTtcbiAgICAgIC8vRGlzcGF0Y2ggYWZ0ZXIgYnVpbGQgZXZlbnRcbiAgICAgIHJldHVybiByZXNwb25zZTtcbiAgICB9IGVsc2Uge1xuICAgICAgLy9DcmVhdGUgR3JhcGhcbiAgICAgIGxldCByZXNwb25zZSA9IGF3YWl0IHRoaXMuc3RhcnRHcmFwaEJ1aWxkZXIoZ3JhcGhEYXRhLmdyYXBoSWQpO1xuICAgICAgLy9EaXNwYXRjaCBhZnRlciBidWlsZCBldmVudFxuICAgICAgcmV0dXJuIHJlc3BvbnNlO1xuICAgIH1cbiAgfVxuXG4gIHByaXZhdGUgYXN5bmMgcHVibGlzaExhYmVsKGdyYXBoSWQ6IHN0cmluZykge1xuICAgIC8vRmx1c2ggQ29udGVudCBvZiBHcmFwaCBEaXZcbiAgICBkb2N1bWVudC5xdWVyeVNlbGVjdG9yKCcjJyArIGdyYXBoSWQpIS5pbm5lckhUTUwgPSAnJztcblxuICAgIC8vTGFiZWxzIERhdGEgY3JlYXRpb25cbiAgICBsZXQgaHRtbERpdiA9IHRoaXMuY2hhcnRzW2dyYXBoSWRdLmdyYXBoRGF0YS5tYXAoKHk6IGFueSwgeUluZGV4OmFueSkgPT4ge1xuICAgICAgcmV0dXJuIHtcbiAgICAgICAgbGFiZWw6IHkubGFiZWwsXG4gICAgICAgIHZhbHVlOiB5LnZhbHVlXG4gICAgICB9O1xuICAgIH0pO1xuXG4gICAgLy9DcmVhdGluZyBMYWJlbCBIdG1sIERVTVBcbiAgICBsZXQgaHRtbCA9IGBcbiAgICA8ZGl2IGNsYXNzPVwiY2FyZFwiIHN0eWxlPVwicGFkZGluZy10b3A6IDMlOyBwYWRkaW5nLWJvdHRvbTogMyU7IHdpZHRoOiBpbmhlcml0O1wiPlxuICAgICR7XG4gICAgICBodG1sRGl2Lmxlbmd0aCA9PSAxXG4gICAgICAgID8gYDxoMyBzdHlsZT1cInRleHQtYWxpZ246IGNlbnRlcjtcIj4ke3RoaXMuY2hhcnRzW2dyYXBoSWRdLmdyYXBoVGl0bGV9PC9oMz5gXG4gICAgICAgIDogYGBcbiAgICB9XG4gICAgPGRpdiBjbGFzcz1cImdyYXBoLWxhYmVsXCIgPlxuICAgICR7aHRtbERpdlxuICAgICAgLm1hcChcbiAgICAgICAgKGQ6IGFueSwgaW5kZXg6IGFueSkgPT4gYFxuICAgICAgICA8ZGl2IGNsYXNzPVwibGFiZWwtaXRlbVwiICR7XG4gICAgICAgICAgdGhpcy5jaGFydHNbZ3JhcGhJZF0uY29sb3JzW2luZGV4XSAhPSB1bmRlZmluZWRcbiAgICAgICAgICAgID8gYHN0eWxlPVwiYmFja2dyb3VuZC1jb2xvcjogJHt0aGlzLmNoYXJ0c1tncmFwaElkXS5jb2xvcnNbaW5kZXhdfVwiYFxuICAgICAgICAgICAgOiAnJ1xuICAgICAgICB9IGlkPVwiY2FyZC1ncmFwaC0ke2dyYXBoSWR9XCIgZGF0YT1cIiR7XG4gICAgICAgICAgdGhpcy5jaGFydHNbZ3JhcGhJZF0uY29sdW1uc1tpbmRleF1cbiAgICAgICAgfVwiPlxuICAgICAgICAgIDxoMyBzdHlsZT1cIiR7dGhpcy5jaGFydHNbZ3JhcGhJZF0uZ3JhcGhEYXRhLmxlbmd0aCA9PSAxID8gJ2ZvbnQtc2l6ZTogMThweDsnIDogJyd9XCIgZGF0YT1cIiR7XG4gICAgICAgICAgdGhpcy5jaGFydHNbZ3JhcGhJZF0uY29sdW1uc1tpbmRleF1cbiAgICAgICAgfVwiPjxiIGRhdGE9XCIke3RoaXMuY2hhcnRzW2dyYXBoSWRdLmNvbHVtbnNbaW5kZXhdfVwiPiR7TWF0aC5yb3VuZChcbiAgICAgICAgICBkLnZhbHVlXG4gICAgICAgICl9PC9iPjwvaDM+XG4gICAgICAgICAgJHtcbiAgICAgICAgICAgIHRoaXMuY2hhcnRzW2dyYXBoSWRdLmdyYXBoRGF0YS5sZW5ndGggPiAxXG4gICAgICAgICAgICAgID8gYDxoMyBkYXRhPVwiJHt0aGlzLmNoYXJ0c1tncmFwaElkXS5jb2x1bW5zW2luZGV4XX1cIj5gICtcbiAgICAgICAgICAgICAgICBkLmxhYmVsICtcbiAgICAgICAgICAgICAgICAnPC9oMz4nXG4gICAgICAgICAgICAgIDogJydcbiAgICAgICAgICB9XG4gICAgICAgIDwvZGl2PlxuXG4gICAgICAgIGBcbiAgICAgIClcbiAgICAgIC5qb2luKCcnKX1cbiAgICAgICAgPC9kaXY+XG4gICAgPC9kaXY+YDtcblxuICAgIC8vUmVuZGVyaW5nIExhYmVsIEhUTUwgRFVNUCBvdmVyIGRvY3VtZW50XG4gICAgZG9jdW1lbnQucXVlcnlTZWxlY3RvcignIycgKyBncmFwaElkKSEuaW5uZXJIVE1MID0gaHRtbDtcblxuICAgIGxldCBfc2VsZiA9IHRoaXM7XG5cbiAgICAvL0xhYmVsIENsaWNrIGhhbmRsZXJcbiAgICBkb2N1bWVudC5xdWVyeVNlbGVjdG9yQWxsKCcjY2FyZC1ncmFwaC0nICsgZ3JhcGhJZCkuZm9yRWFjaCgoY2FyZCkgPT5cbiAgICAgIGNhcmQuYWRkRXZlbnRMaXN0ZW5lcignY2xpY2snLCBmdW5jdGlvbiAoZTogYW55KSB7XG4gICAgICAgIF9zZWxmLmNoYXJ0c1tncmFwaElkXS5jdXJyTGV2ZWwgKz0gMTtcbiAgICAgICAgX3NlbGYuY2hhcnRzW2dyYXBoSWRdLnByZXZMZXZlbERhdGEucHVzaChfc2VsZi5jaGFydHNbZ3JhcGhJZF0uZ3JhcGhEYXRhKTtcbiAgICAgICAgbGV0IGNvbFRvU2hvdyA9IGUudGFyZ2V0LmdldEF0dHJpYnV0ZSgnZGF0YScpO1xuICAgICAgICBfc2VsZi5jaGFydHNbZ3JhcGhJZF0uYnJlYWRDcnVtYi5wdXNoKGNvbFRvU2hvdyk7XG4gICAgICAgIGxldCBkYXRhT2JqID0ge1xuICAgICAgICAgIGdyYXBoSWQ6IGdyYXBoSWQuc3BsaXQoXCItXCIpWzFdLFxuICAgICAgICAgIGN1cnJMZXZlbDogX3NlbGYuY2hhcnRzW2dyYXBoSWRdLmN1cnJMZXZlbCxcbiAgICAgICAgICBjb2xJZDogbnVsbCxcbiAgICAgICAgICBzZWxLZXk6IFtdLFxuICAgICAgICAgIGNvbFRvU2hvdzogY29sVG9TaG93LFxuICAgICAgICAgIGRpcmVjdGlvbjogMCxcbiAgICAgICAgICBkYXRhRmlsdGVyOiBfc2VsZi5jaGFydHNbZ3JhcGhJZF0uZGFzaGJvYXJkRmlsdGVyLFxuICAgICAgICAgIGFkbWluSWQ6IF9zZWxmLmNoYXJ0c1tncmFwaElkXS5hZG1pbklkLFxuICAgICAgICAgIHNoYXJlaWQ6IF9zZWxmLmNoYXJ0c1tncmFwaElkXS5zaGFyZWlkID8/IG51bGwsXG4gICAgICAgICAgc3RhcnREYXRlOiBfc2VsZi5jaGFydHNbZ3JhcGhJZF0ucmFuZ2UhLnN0YXJ0RGF0ZSA/PyBudWxsLFxuICAgICAgICAgIGVuZERhdGU6IF9zZWxmLmNoYXJ0c1tncmFwaElkXS5yYW5nZSEuZW5kRGF0ZSA/PyBudWxsXG4gICAgICAgIH1cbiAgICAgICAgU3dhbC5maXJlKHtcbiAgICAgICAgICB0ZXh0OiBcIlBsZWFzZSBXYWl0Li4uXCIsXG4gICAgICAgICAgYWxsb3dPdXRzaWRlQ2xpY2s6IGZhbHNlXG4gICAgICAgIH0pXG4gICAgICAgIFN3YWwuc2hvd0xvYWRpbmcoKTtcbiAgICAgICAgX3NlbGYuZGF0YVNlcnZpY2UuZ2V0R3JhcGhEcmlsbGRvd25CeUlkKGRhdGFPYmopLnRoZW4oKHJlcyA6IGFueSkgPT4ge1xuICAgICAgICAgIFN3YWwuaGlkZUxvYWRpbmcoKTtcbiAgICAgICAgICBTd2FsLmNsb3NlKCk7XG4gICAgICAgICAgaWYgKF9zZWxmLmNoYXJ0c1tncmFwaElkXS5yb3dzLmxlbmd0aCA9PSAxKSB7XG4gICAgICAgICAgICAvL1JlbmRlcmluZyBMYXN0IGxldmVsIENvbXBvbmVudCwgSW50ZWdlciBzb3J0aW5nRGlyZWN0aW9uXG4gICAgICAgICAgICBfc2VsZi5kYXRhU2VydmljZS5zZXRNb2RhbERhdGEoe1xuICAgICAgICAgICAgICBjb2xUb1ZpZXc6IF9zZWxmLmNoYXJ0c1tncmFwaElkXS5sYXN0TGV2ZWxDb2x1bW5zLFxuICAgICAgICAgICAgICByZWZEYXRhOiByZXMuZGF0YSxcbiAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgbGV0IG1vZGFsT3B0aW9uczogYW55ID0ge1xuICAgICAgICAgICAgICBwYW5lbENsYXNzOiAnZGF0YVBvcHVwLW1vZGFsJyxcbiAgICAgICAgICAgICAgYmFja2Ryb3BDbGFzczogJ21vZGFsLWJhY2tkcm9wJyxcbiAgICAgICAgICAgIH07XG4gICAgICAgICAgICBfc2VsZi5kaWFsb2cub3BlbihEYXRhUG9wdXBDb21wb25lbnQsIG1vZGFsT3B0aW9ucyk7XG4gICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIC8vRmx1c2ggTGFiZWwgQ29udGVudCBmcm9tIGRvY3VtZW50XG4gICAgICAgICAgICBkb2N1bWVudC5xdWVyeVNlbGVjdG9yKCcjJyArIGdyYXBoSWQpIS5pbm5lckhUTUwgPSAnJztcbiAgICAgICAgICAgIFxuICAgICAgICAgICAgX3NlbGYuY2hhcnRzW2dyYXBoSWRdLmdyYXBoRGF0YSA9IHJlcy5kYXRhO1xuICAgICAgICAgICAgLy9HZW5lcmF0aW5nIENoaWxkIEdyYXBoIG9mIExhYmVsXG4gICAgICAgICAgICBfc2VsZi5zdGFydEdyYXBoQnVpbGRlcihncmFwaElkKTtcbiAgICAgICAgICB9XG4gICAgICAgIH0pXG4gICAgICB9KVxuICAgICk7XG4gICAgcmV0dXJuIHRydWU7XG4gIH1cblxuICBwcml2YXRlIGFzeW5jIHN0YXJ0R3JhcGhCdWlsZGVyKFxuICAgIGdyYXBoSWQ6IHN0cmluZ1xuICApIHtcbiAgIFxuXG4gICAgLy8gdGhpcy5jaGFydHNbZ3JhcGhJZF0uY3VyckxldmVsID0gY3VyckxldmVsO1xuICAgIC8vIHRoaXMuY2hhcnRzW2dyYXBoSWRdLnByZXZMZXZlbERhdGEgPSBbXTtcbiAgICAvLyB0aGlzLmNoYXJ0c1tncmFwaElkXS5zZWxLZXlzID0gW107XG4gICAgLy8gdGhpcy5jaGFydHNbZ3JhcGhJZF0uY29sVG9TaG93ID0gY29sVG9TaG93O1xuICAgIC8vIHRoaXMuY2hhcnRzW2dyYXBoSWRdLmN1cnJMZXZlbCA9IDA7XG4gICAgLy9DcmVhdGluZyBDaGFydCBSYXcgSnNvblxuICAgIGxldCBjaGFydE9wdGlvbnM6IGFueSA9IHRoaXMuY3JlYXRlQ2hhcnREYXRhKGdyYXBoSWQsIHRoaXMuY2hhcnRzW2dyYXBoSWRdLmN1cnJMZXZlbCk7XG5cbiAgICAvL1JlbmRlcmluZyBDaGFydCBvZiBHcmFwaElkXG4gICAgdGhpcy5oaWdoY2hhcnRzLmNoYXJ0KHRoaXMuY2hhcnRzW2dyYXBoSWRdLmdyYXBoSWQsIGNoYXJ0T3B0aW9ucyk7XG5cbiAgICAvL0FkZCBBY3Rpb24gQnV0dG9ucyBPdmVyIENoYXJ0XG4gICAgdGhpcy5hZGRBY3Rpb25CdG4oZ3JhcGhJZCk7XG5cbiAgICByZXR1cm4gdHJ1ZTtcbiAgfVxuXG4gIHByaXZhdGUgZ2V0UGxvdE9wdGlvbnMoZ3JhcGhJZDogc3RyaW5nLCBjdXJyTGV2ZWw6IG51bWJlcikge1xuICAgIGxldCBwbG90T3B0aW9uczogYW55ID0ge1xuICAgICAgc2VyaWVzOiB7XG4gICAgICAgIHR1cmJvVGhyZXNob2xkOiAxMDAwMDAwLFxuICAgICAgICBkYXRhTGFiZWxzOiB7XG4gICAgICAgICAgY29sb3I6ICdibGFjaycsXG4gICAgICAgICAgZW5hYmxlZDogdHJ1ZSxcbiAgICAgICAgICBzdHlsZToge1xuICAgICAgICAgICAgY29sb3I6ICdibGFjaycsXG4gICAgICAgICAgICB0ZXh0U2hhZG93OiBmYWxzZSxcbiAgICAgICAgICAgIHRleHREZWNvcmF0aW9uOiAnbm9uZScsXG4gICAgICAgICAgfSxcbiAgICAgICAgfSxcbiAgICAgICAgbGFiZWw6IHtcbiAgICAgICAgICBzdHlsZToge1xuICAgICAgICAgICAgY29sb3I6ICdibGFjaycsXG4gICAgICAgICAgfSxcbiAgICAgICAgfSxcbiAgICAgIH0sXG4gICAgfTtcblxuICAgIC8vT3B0aW9ucyBmb3IgU3RhY2sgR3JhcGhcbiAgICBpZiAoXG4gICAgICB0aGlzLmNoYXJ0c1tncmFwaElkXS5ncmFwaFR5cGVzW2N1cnJMZXZlbF0gPT0gR3JhcGhUeXBlcy5TVEFDS0VEX0JBUiB8fFxuICAgICAgdGhpcy5jaGFydHNbZ3JhcGhJZF0uZ3JhcGhUeXBlc1tjdXJyTGV2ZWxdID09IEdyYXBoVHlwZXMuU1RBQ0tFRF9DT0xVTU5cbiAgICApIHtcbiAgICAgIHBsb3RPcHRpb25zLnNlcmllc1snc3RhY2tpbmcnXSA9ICdub3JtYWwnOyAvL05vcm1hbCBTdGFja2luZyBvZiB5LWF4aXNcbiAgICB9IGVsc2UgaWYgKFxuICAgICAgdGhpcy5jaGFydHNbZ3JhcGhJZF0uZ3JhcGhUeXBlc1tjdXJyTGV2ZWxdID09XG4gICAgICAgIEdyYXBoVHlwZXMuU1RBQ0tFRF9CQVJfUEVSQ0VOVEFHRSB8fFxuICAgICAgdGhpcy5jaGFydHNbZ3JhcGhJZF0uZ3JhcGhUeXBlc1tjdXJyTGV2ZWxdID09XG4gICAgICAgIEdyYXBoVHlwZXMuU1RBQ0tFRF9DT0xVTU5fUEVSQ0VOVEFHRVxuICAgICkge1xuICAgICAgcGxvdE9wdGlvbnMuc2VyaWVzWydzdGFja2luZyddID0gJ3BlcmNlbnQnOyAvL1N0YWNraW5nIG9mIHktYXhpcyBvbiBiYXNpcyBvZiBwZXJjZW50YWdlXG4gICAgICAvL0FkZCBQZXJjZW50IFNpZ24gYWZ0ZXIgeS1heGlzIHZhbHVlc1xuICAgICAgcGxvdE9wdGlvbnMuc2VyaWVzLmRhdGFMYWJlbHNbJ2Zvcm1hdHRlciddID0gZnVuY3Rpb24gKCkge1xuICAgICAgICByZXR1cm4gdGhpcy5wZXJjZW50YWdlLnRvRml4ZWQoMikgKyAnICUnO1xuICAgICAgfTtcbiAgICB9XG4gICAgcmV0dXJuIHBsb3RPcHRpb25zO1xuICB9XG5cbiAgcHJpdmF0ZSBjcmVhdGVDaGFydERhdGEoZ3JhcGhJZDogc3RyaW5nLCBjdXJyTGV2ZWw6IG51bWJlcikge1xuICAgIGxldCBfc2VsZiA9IHRoaXM7XG5cbiAgICAvL0dldHRpbmcgUGxvdCBPcHRpb25zIGZvciBHcmFwaFxuICAgIGxldCBwbG90T3B0aW9ucyA9IHRoaXMuZ2V0UGxvdE9wdGlvbnMoZ3JhcGhJZCwgY3VyckxldmVsKTtcblxuICAgIHJldHVybiB7XG4gICAgICBjcmVkaXRzOiB7XG4gICAgICAgIHRleHQ6IHRoaXMuY3JlZGl0VGl0bGUsXG4gICAgICAgIGhyZWY6IHRoaXMuY3JlZGl0VXJsLFxuICAgICAgICBzdHlsZToge1xuICAgICAgICAgIGZvbnRTaXplOiAnMTJweCcsXG4gICAgICAgIH0sXG4gICAgICB9LFxuICAgICAgdGl0bGU6IG51bGwsXG4gICAgICBwbG90T3B0aW9uczogcGxvdE9wdGlvbnMsXG4gICAgICBjaGFydDoge1xuICAgICAgICBldmVudHM6IHtcbiAgICAgICAgICAvL0hhbmRsZSBEcmlsbGRvd24gRXZlbnQgb2YgR3JhcGhcbiAgICAgICAgICBkcmlsbGRvd246IGZ1bmN0aW9uIChlOiBhbnkpIHtcbiAgICAgICAgICAgIGlmKGUucG9pbnRzICE9IGZhbHNlKSByZXR1cm5cbiAgICAgICAgICAgIGxldCBjaGFydDogYW55ID0gdGhpcztcbiAgICAgICAgICAgIC8vU2hvdyBMb2FkaW5nIGluIENoYXJ0XG4gICAgICAgICAgICBjaGFydC5zaG93TG9hZGluZygnTG9hZGluZy4uLicpO1xuICAgICAgICAgICAgbGV0IGN1cnJHcmFwaElkID0gZS5wb2ludC5vcHRpb25zLmdyYXBoSWQ7IC8vR3JhcGhJZFxuICAgICAgICAgICAgbGV0IGNvbElkID0gZS5wb2ludC5jb2xJbmRleDsgLy9Db2xvckluZGV4IG9mIGJhclxuICAgICAgICAgICAgLy9JbmNyZWFzaW5nIEdyYXBoIERyaWxsZG93biBsZXZlbFxuICAgICAgICAgICAgX3NlbGYuY2hhcnRzW1wiZ3JhcGgtXCIgKyBjdXJyR3JhcGhJZF0uY3VyckxldmVsICs9IDE7XG4gICAgICAgICAgICBfc2VsZi5jaGFydHNbXCJncmFwaC1cIiArIGN1cnJHcmFwaElkXS5icmVhZENydW1iLnB1c2goZS5wb2ludC5uYW1lKTtcbiAgICAgICAgICAgIF9zZWxmLmNoYXJ0c1tcImdyYXBoLVwiICsgY3VyckdyYXBoSWRdLnNlbEtleXM/LnB1c2goZS5wb2ludC5uYW1lKTtcbiAgICAgICAgICAgIGxldCBkYXRhT2JqID0ge1xuICAgICAgICAgICAgICBncmFwaElkOiBjdXJyR3JhcGhJZCxcbiAgICAgICAgICAgICAgY3VyckxldmVsOiBfc2VsZi5jaGFydHNbXCJncmFwaC1cIiArIGN1cnJHcmFwaElkXS5jdXJyTGV2ZWwsXG4gICAgICAgICAgICAgIGNvbElkOiBjb2xJZCxcbiAgICAgICAgICAgICAgc2VsS2V5OiBfc2VsZi5jaGFydHNbXCJncmFwaC1cIiArIGN1cnJHcmFwaElkXS5zZWxLZXlzLFxuICAgICAgICAgICAgICBjb2xUb1Nob3c6IG51bGwsXG4gICAgICAgICAgICAgIGRpcmVjdGlvbjogX3NlbGYuY2hhcnRzW1wiZ3JhcGgtXCIgKyBjdXJyR3JhcGhJZF0ub3JkZXIsXG4gICAgICAgICAgICAgIGRhdGFGaWx0ZXI6IF9zZWxmLmNoYXJ0c1tcImdyYXBoLVwiICsgY3VyckdyYXBoSWRdLmRhc2hib2FyZEZpbHRlcixcbiAgICAgICAgICAgICAgYWRtaW5JZDogX3NlbGYuY2hhcnRzW1wiZ3JhcGgtXCIgKyBjdXJyR3JhcGhJZF0uYWRtaW5JZCxcbiAgICAgICAgICAgICAgc2hhcmVpZDogX3NlbGYuY2hhcnRzW1wiZ3JhcGgtXCIgKyBjdXJyR3JhcGhJZF0uc2hhcmVpZCA/PyBudWxsLFxuICAgICAgICAgICAgICBzdGFydERhdGU6IF9zZWxmLmNoYXJ0c1tcImdyYXBoLVwiICsgY3VyckdyYXBoSWRdLnJhbmdlIS5zdGFydERhdGUgPz8gbnVsbCxcbiAgICAgICAgICAgICAgZW5kRGF0ZTogX3NlbGYuY2hhcnRzW1wiZ3JhcGgtXCIgKyBjdXJyR3JhcGhJZF0ucmFuZ2UhLmVuZERhdGUgPz8gbnVsbFxuICAgICAgICAgICAgfVxuICAgICAgICAgICAgX3NlbGYuZGF0YVNlcnZpY2UuZ2V0R3JhcGhEcmlsbGRvd25CeUlkKGRhdGFPYmopLnRoZW4oKHJlcyA6IGFueSkgPT4ge1xuICAgICAgICAgICAgICAvL09wZW4gTGFzdCBMZXZlbCBDb21wb25lbnRcbiAgICAgICAgICAgICAgaWYgKFxuXG4gICAgICAgICAgICAgICAgX3NlbGYuY2hhcnRzW1wiZ3JhcGgtXCIgKyBjdXJyR3JhcGhJZF0ucm93cy5sZW5ndGggPT0gX3NlbGYuY2hhcnRzW1wiZ3JhcGgtXCIgKyBjdXJyR3JhcGhJZF0uY3VyckxldmVsXG4gICAgICAgICAgICAgICkge1xuICAgICAgICAgICAgICAgIF9zZWxmLmRhdGFTZXJ2aWNlLnNldE1vZGFsRGF0YSh7XG4gICAgICAgICAgICAgICAgICBjb2xUb1ZpZXc6IF9zZWxmLmNoYXJ0c1tcImdyYXBoLVwiICsgY3VyckdyYXBoSWRdLmxhc3RMZXZlbENvbHVtbnMsXG4gICAgICAgICAgICAgICAgICByZWZEYXRhOiByZXMuZGF0YSxcbiAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgICAgICBsZXQgbW9kYWxPcHRpb25zID0ge1xuICAgICAgICAgICAgICAgICAgcGFuZWxDbGFzczogJ2RhdGFQb3B1cC1tb2RhbCcsXG4gICAgICAgICAgICAgICAgICBiYWNrZHJvcENsYXNzOiAnbW9kYWwtYmFja2Ryb3AnLFxuICAgICAgICAgICAgICAgIH07XG4gICAgICAgICAgICAgICAgX3NlbGYuZGlhbG9nLm9wZW4oRGF0YVBvcHVwQ29tcG9uZW50LCBtb2RhbE9wdGlvbnMpO1xuICAgICAgICAgICAgICAgIC8vUmVkdWNpbmcgR3JhcGggRHJpbGxkb3duIExldmVsXG4gICAgICAgICAgICAgICAgX3NlbGYuY2hhcnRzW1wiZ3JhcGgtXCIgKyBjdXJyR3JhcGhJZF0uY3VyckxldmVsIC09IDE7XG4gICAgICAgICAgICAgICAgX3NlbGYuY2hhcnRzW1wiZ3JhcGgtXCIgKyBjdXJyR3JhcGhJZF0uc2VsS2V5cz8ucG9wKCk7XG5cbiAgICAgICAgICAgICAgICBzZXRUaW1lb3V0KCgpID0+IHtcbiAgICAgICAgICAgICAgICAgIC8vSGlkZSBMb2FkaW5nIGluIGNoYXJ0XG4gICAgICAgICAgICAgICAgICBjaGFydC5oaWRlTG9hZGluZygpO1xuICAgICAgICAgICAgICAgIH0sIDEwMDApO1xuICAgICAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgICAgICAgfWVsc2V7XG4gICAgICAgICAgICAgICAgLy9TdG9yaW5nIFByZXZpb3VzIFNuYXBzaG90IG9mIERhdGEgdG8gcmVzdG9yZSBncmFwaCBvbiBiYWNrXG4gICAgICAgICAgICAgICAgX3NlbGYuY2hhcnRzW1wiZ3JhcGgtXCIgKyBjdXJyR3JhcGhJZF0ucHJldkxldmVsRGF0YS5wdXNoKFxuICAgICAgICAgICAgICAgICAgX3NlbGYuY2hhcnRzW1wiZ3JhcGgtXCIgKyBjdXJyR3JhcGhJZF0uZ3JhcGhEYXRhXG4gICAgICAgICAgICAgICAgKTtcblxuICAgICAgICAgICAgICAgIF9zZWxmLm1hbmFnZUJyZWFkQ3J1bWIoXCJncmFwaC1cIiArIGN1cnJHcmFwaElkLCBfc2VsZik7XG4gICAgICAgICAgICAgICAgLy9HZXR0aW5nIGRyaWxsZG93biBzZXJpZXMgZGF0YVxuICAgICAgICAgICAgICAgIGxldCBzZXJpZXMgPSByZXMuZGF0YTtcbiAgICBcbiAgICAgICAgICAgICAgICAvLyBpZiAoXG4gICAgICAgICAgICAgICAgLy8gICBfc2VsZi5jaGFydHNbXCJncmFwaC1cIiArIGN1cnJHcmFwaElkXS5ncmFwaFR5cGVzWzBdID09XG4gICAgICAgICAgICAgICAgLy8gICAgIEdyYXBoVHlwZXMuU1RBQ0tFRF9CQVJfUEVSQ0VOVEFHRSB8fFxuICAgICAgICAgICAgICAgIC8vICAgX3NlbGYuY2hhcnRzW1wiZ3JhcGgtXCIgKyBjdXJyR3JhcGhJZF0uZ3JhcGhUeXBlc1swXSA9PVxuICAgICAgICAgICAgICAgIC8vICAgICBHcmFwaFR5cGVzLlNUQUNLRURfQ09MVU1OX1BFUkNFTlRBR0VcbiAgICAgICAgICAgICAgICAvLyApIHtcbiAgICAgICAgICAgICAgICAvLyAgIHBsb3RPcHRpb25zLnNlcmllc1snc3RhY2tpbmcnXSA9ICdub3JtYWwnO1xuICAgICAgICAgICAgICAgIC8vICAgcGxvdE9wdGlvbnMuc2VyaWVzLmRhdGFMYWJlbHNbJ2Zvcm1hdHRlciddID0gZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgICAgIC8vICAgICByZXR1cm4gdGhpcy55O1xuICAgICAgICAgICAgICAgIC8vICAgfTtcbiAgICAgICAgICAgICAgICAvLyAgIGNoYXJ0LnVwZGF0ZSh7XG4gICAgICAgICAgICAgICAgLy8gICAgIHBsb3RPcHRpb25zOiBwbG90T3B0aW9ucyxcbiAgICAgICAgICAgICAgICAvLyAgIH0pO1xuICAgICAgICAgICAgICAgIC8vIH1cbiAgICAgICAgICAgICAgICBfc2VsZi5jaGFydHNbXCJncmFwaC1cIiArIGN1cnJHcmFwaElkXS5ncmFwaERhdGEgPSBzZXJpZXM7XG4gICAgXG4gICAgICAgICAgICAgICAgc2V0VGltZW91dCgoKSA9PiB7XG4gICAgICAgICAgICAgICAgICAvL0hpZGUgTG9hZGluZyBpbiBjaGFydFxuICAgICAgICAgICAgICAgICAgY2hhcnQuaGlkZUxvYWRpbmcoKTtcbiAgICAgICAgICAgICAgICAgIC8vQWRkIERyaWxsZG93biBTZXJpZXMgRGF0YSBhcyBNYWluIFNlcmllc1xuICAgICAgICAgICAgICAgICAgY2hhcnQudXBkYXRlKHtcbiAgICAgICAgICAgICAgICAgICAgcGxvdE9wdGlvbnM6IHBsb3RPcHRpb25zLFxuICAgICAgICAgICAgICAgICAgICB4QXhpczoge1xuICAgICAgICAgICAgICAgICAgICAgIHR5cGU6ICdjYXRlZ29yeScsXG4gICAgICAgICAgICAgICAgICAgICAgbGFiZWxzOiB7XG4gICAgICAgICAgICAgICAgICAgICAgICBzdHlsZToge1xuICAgICAgICAgICAgICAgICAgICAgICAgICBjb2xvcjogJ3JlZCcsXG4gICAgICAgICAgICAgICAgICAgICAgICAgIHRleHREZWNvcmF0aW9uOiAnbm9uZScsXG4gICAgICAgICAgICAgICAgICAgICAgICAgIHRleHRPdXRsaW5lOiAnMHB4JyxcbiAgICAgICAgICAgICAgICAgICAgICAgIH0sXG4gICAgICAgICAgICAgICAgICAgICAgfSxcbiAgICAgICAgICAgICAgICAgICAgICBtaW46IDAsXG4gICAgICAgICAgICAgICAgICAgICAgbWF4OiA2LFxuICAgICAgICAgICAgICAgICAgICAgIGFsbG93RGVjaW1hbHM6IGZhbHNlLFxuICAgICAgICAgICAgICAgICAgICAgIHNjcm9sbGJhcjoge1xuICAgICAgICAgICAgICAgICAgICAgICAgZW5hYmxlZDogdHJ1ZSxcbiAgICAgICAgICAgICAgICAgICAgICB9LFxuICAgICAgICAgICAgICAgICAgICB9LFxuICAgICAgICAgICAgICAgICAgICBzZXJpZXM6IHNlcmllc1xuICAgICAgICAgICAgICAgICAgfSlcbiAgICAgICAgICAgICAgICAgIC8vIC5hZGRTZXJpZXNBc0RyaWxsZG93bihlLnBvaW50LCB7XG4gICAgICAgICAgICAgICAgICAvLyAgIGRhdGE6IFtzZXJpZXNdLFxuICAgICAgICAgICAgICAgICAgLy8gICBuYW1lOiBlLnBvaW50Lm5hbWVcbiAgICAgICAgICAgICAgICAgIC8vIH0pO1xuICAgICAgICAgICAgICAgIH0sIDEwMDApO1xuICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9KVxuXG5cblxuICAgICAgICAgIH0sXG4gICAgICAgICAgLy9IYW5kbGUgRHJpbGxVcCBFdmVudFxuICAgICAgICAgIGRyaWxsdXA6IGFzeW5jIGZ1bmN0aW9uIChlOiBhbnkpIHtcbiAgICAgICAgICAgIC8vIGxldCBjdXJyR3JhcGhJZCA9IGUuc2VyaWVzT3B0aW9ucy5ncmFwaElkOyAvL0dyYXBoSWRcbiAgICAgICAgICAgIC8vIGxldCBsZXZlbCA9IGUuc2VyaWVzT3B0aW9ucy5sZXZlbDsgLy9DdXJyZW50IExldmVsIG9mIERyaWxsZG93blxuICAgICAgICAgICAgLy8gbGV0IGNoYXJ0OiBhbnkgPSB0aGlzO1xuICAgICAgICAgICAgLy8gX3NlbGYuY2hhcnRzW1wiZ3JhcGgtXCIgKyBjdXJyR3JhcGhJZF0uY3VyckxldmVsID0gbGV2ZWw7XG5cbiAgICAgICAgICAgIC8vIC8vUmVzdG9yaW5nIERhdGEgdXNpbmcgcHJldmlvdXMgc3RvcmUgZGF0YVxuICAgICAgICAgICAgLy8gX3NlbGYuY2hhcnRzW1wiZ3JhcGgtXCIgKyBjdXJyR3JhcGhJZF0uZ3JhcGhEYXRhID0gYXdhaXQgX3NlbGYuY2hhcnRzW1xuICAgICAgICAgICAgLy8gICBcImdyYXBoLVwiICsgY3VyckdyYXBoSWRcbiAgICAgICAgICAgIC8vIF0ucHJldkxldmVsRGF0YVtsZXZlbF07XG5cbiAgICAgICAgICAgIC8vIC8vUmVmcmVzaCBQcmV2aW91cyBEYXRhIExpc3RcbiAgICAgICAgICAgIC8vIF9zZWxmLmNoYXJ0c1tcImdyYXBoLVwiICsgY3VyckdyYXBoSWRdLnByZXZMZXZlbERhdGEuc3BsaWNlKGxldmVsLCAxKTtcbiAgICAgICAgICAgIC8vIF9zZWxmLmNoYXJ0c1tcImdyYXBoLVwiICsgY3VyckdyYXBoSWRdLnNlbEtleXM/LnBvcCgpO1xuICAgICAgICAgICAgLy8gX3NlbGYuY2hhcnRzXG4gICAgICAgICAgICAvLyBpZiAoXG4gICAgICAgICAgICAvLyAgIGxldmVsID09IDAgJiZcbiAgICAgICAgICAgIC8vICAgKF9zZWxmLmNoYXJ0c1tcImdyYXBoLVwiICsgY3VyckdyYXBoSWRdLmdyYXBoVHlwZXNbMF0gPT1cbiAgICAgICAgICAgIC8vICAgICBHcmFwaFR5cGVzLlNUQUNLRURfQkFSX1BFUkNFTlRBR0UgfHxcbiAgICAgICAgICAgIC8vICAgICBfc2VsZi5jaGFydHNbXCJncmFwaC1cIiArIGN1cnJHcmFwaElkXS5ncmFwaFR5cGVzWzBdID09XG4gICAgICAgICAgICAvLyAgICAgICBHcmFwaFR5cGVzLlNUQUNLRURfQ09MVU1OX1BFUkNFTlRBR0UpXG4gICAgICAgICAgICAvLyApIHtcbiAgICAgICAgICAgIC8vICAgcGxvdE9wdGlvbnMuc2VyaWVzWydzdGFja2luZyddID0gJ3BlcmNlbnQnOyAvL1N0YWNraW5nIG9mIHktYXhpcyBvbiBiYXNpcyBvZiBwZXJjZW50YWdlXG4gICAgICAgICAgICAvLyAgIC8vQWRkIFBlcmNlbnQgU2lnbiBhZnRlciB5LWF4aXMgdmFsdWVzXG4gICAgICAgICAgICAvLyAgIHBsb3RPcHRpb25zLnNlcmllcy5kYXRhTGFiZWxzWydmb3JtYXR0ZXInXSA9IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgIC8vICAgICByZXR1cm4gdGhpcy5wZXJjZW50YWdlLnRvRml4ZWQoMikgKyAnICUnO1xuICAgICAgICAgICAgLy8gICB9O1xuXG4gICAgICAgICAgICAvLyAgIGNoYXJ0LnVwZGF0ZSh7XG4gICAgICAgICAgICAvLyAgICAgcGxvdE9wdGlvbnM6IHBsb3RPcHRpb25zLFxuICAgICAgICAgICAgLy8gICAgIHNlcmllczogX3NlbGYuY2hhcnRzW1wiZ3JhcGgtXCIgKyBjdXJyR3JhcGhJZF0uZ3JhcGhEYXRhXG4gICAgICAgICAgICAvLyAgIH0pO1xuICAgICAgICAgICAgLy8gfVxuICAgICAgICAgIH0sXG4gICAgICAgIH0sXG4gICAgICB9LFxuICAgICAgLy9Db25maWd1cmluZyBYLWF4aXNcbiAgICAgIHhBeGlzOiB7XG4gICAgICAgIHR5cGU6ICdjYXRlZ29yeScsXG4gICAgICAgIGxhYmVsczoge1xuICAgICAgICAgIHN0eWxlOiB7XG4gICAgICAgICAgICBjb2xvcjogJ3JlZCcsXG4gICAgICAgICAgICB0ZXh0RGVjb3JhdGlvbjogJ25vbmUnLFxuICAgICAgICAgICAgdGV4dE91dGxpbmU6ICcwcHgnLFxuICAgICAgICAgIH0sXG4gICAgICAgIH0sXG4gICAgICAgIG1pbjogMCxcbiAgICAgICAgbWF4OlxuICAgICAgICAgIE9iamVjdC5rZXlzKHRoaXMuY2hhcnRzW2dyYXBoSWRdLmdyYXBoRGF0YVswXS5kYXRhKS5sZW5ndGggPD0gNlxuICAgICAgICAgICAgPyBPYmplY3Qua2V5cyh0aGlzLmNoYXJ0c1tncmFwaElkXS5ncmFwaERhdGFbMF0uZGF0YSkubGVuZ3RoIC0gMVxuICAgICAgICAgICAgOiA2LFxuICAgICAgICBhbGxvd0RlY2ltYWxzOiBmYWxzZSxcbiAgICAgICAgc2Nyb2xsYmFyOiB7XG4gICAgICAgICAgZW5hYmxlZDogdHJ1ZSxcbiAgICAgICAgfSxcbiAgICAgIH0sXG4gICAgICAvL0NvbmZpZ3VyaW5nIFktYXhpc1xuICAgICAgeUF4aXM6IGxvZGFzaC5tYXAodGhpcy5jaGFydHNbZ3JhcGhJZF0uY29sdW1ucywgKHk6IGFueSkgPT4ge1xuICAgICAgICByZXR1cm4ge1xuICAgICAgICAgIG9wcG9zaXRlOiB0cnVlLFxuICAgICAgICAgIHRpdGxlOiB7XG4gICAgICAgICAgICB0ZXh0OiBudWxsLCAvLyBIaWRpbmcgdmVydGljYWwgbGFiZWxzIG92ZXIgeS1heGlzXG4gICAgICAgICAgfSxcbiAgICAgICAgfTtcbiAgICAgIH0pLFxuICAgICAgLy9HZXR0aW5nIE1haW4gU2VyaWVzIERhdGFcbiAgICAgIHNlcmllczogdGhpcy5jaGFydHNbZ3JhcGhJZF0uZ3JhcGhEYXRhXG4gICAgfTtcbiAgfVxuXG4gIHByaXZhdGUgc29ydEdyYXBoKGU6IGFueSkge1xuICAgIGNvbnN0IHRlbXBBcnIgPSBlLnRhcmdldC5pZC5zcGxpdCgnQCcpO1xuICAgIGNvbnN0IGdyYXBoSWQgPSB0ZW1wQXJyW3RlbXBBcnIubGVuZ3RoIC0gMV07XG4gICAgaWYgKHRoaXMuY2hhcnRzW2dyYXBoSWRdLm9yZGVyIDwgMSkge1xuICAgICAgdGhpcy5jaGFydHNbZ3JhcGhJZF0ub3JkZXIgKz0gMTtcbiAgICB9IGVsc2Uge1xuICAgICAgdGhpcy5jaGFydHNbZ3JhcGhJZF0ub3JkZXIgPSAtMTtcbiAgICB9XG4gICAgbGV0IGQgPSB7XG4gICAgICBncmFwaElkOiBncmFwaElkLnNwbGl0KFwiLVwiKVsxXSxcbiAgICAgIGRhdGFGaWx0ZXI6IHRoaXMuY2hhcnRzW2dyYXBoSWRdLmRhc2hib2FyZEZpbHRlcixcbiAgICAgIGRpcmVjdGlvbjogdGhpcy5jaGFydHNbZ3JhcGhJZF0ub3JkZXIsXG4gICAgICBhZG1pbklkOiB0aGlzLmNoYXJ0c1tncmFwaElkXS5hZG1pbklkLFxuICAgICAgc2hhcmVpZDogdGhpcy5jaGFydHNbZ3JhcGhJZF0uc2hhcmVpZCA/PyBudWxsLFxuICAgICAgc3RhcnREYXRlOiB0aGlzLmNoYXJ0c1tncmFwaElkXS5yYW5nZSEuc3RhcnREYXRlID8/IG51bGwsXG4gICAgICBlbmREYXRlOiB0aGlzLmNoYXJ0c1tncmFwaElkXS5yYW5nZSEuZW5kRGF0ZSA/PyBudWxsXG4gICAgfVxuICAgIFN3YWwuZmlyZSh7XG4gICAgICB0ZXh0OiBcIlBsZWFzZSBXYWl0Li4uXCIsXG4gICAgICBhbGxvd091dHNpZGVDbGljazogZmFsc2VcbiAgICB9KVxuICAgIFN3YWwuc2hvd0xvYWRpbmcoKTtcbiAgICB0aGlzLmRhdGFTZXJ2aWNlLmdldEdyYXBoRGF0YUJ5SWQoZCkudGhlbigocmVzOiBhbnkpID0+IHtcbiAgICAgIFN3YWwuaGlkZUxvYWRpbmcoKTtcbiAgICAgIFN3YWwuY2xvc2UoKTtcbiAgICAgIHRoaXMuY2hhcnRzW2dyYXBoSWRdLmdyYXBoRGF0YSA9IHJlcy5kYXRhO1xuICAgICAgdGhpcy5idWlsZEdyYXBoKHsuLi50aGlzLmNoYXJ0c1tncmFwaElkXSwgXG4gICAgICAgIGJyZWFkQ3J1bWI6IFsnSG9tZSddLFxuICAgICAgICBjdXJyTGV2ZWw6IDAsXG4gICAgICAgIHNlbEtleXM6IFtdLFxuICAgICAgICBwcmV2TGV2ZWxEYXRhOiBbXSxcbiAgICAgICAgY29sVG9TaG93OiAnJ30pO1xuICAgIH0pXG4gIH1cblxuICBwcml2YXRlIGFkZEFjdGlvbkJ0bihncmFwaElkOiBzdHJpbmcpIHtcbiAgICBsZXQgX3NlbGYgPSB0aGlzO1xuICAgIGNvbnN0IGRpdiA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ2RpdicpO1xuICAgIGRpdi5zZXRBdHRyaWJ1dGUoJ3N0eWxlJywgdGhpcy5kaXZTdHlsZXMpO1xuICAgIGRpdi5zZXRBdHRyaWJ1dGUoXCJpZFwiLCBcImdyYXBoLW9wdGlvbnMtXCIgKyBncmFwaElkKTtcbiAgICBjb25zdCBzb3J0SWNvbiA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ2knKTtcbiAgICBzb3J0SWNvbi5zZXRBdHRyaWJ1dGUoJ2lkJywgJ3NvcnRAJyArIGdyYXBoSWQpO1xuICAgIHNvcnRJY29uLnNldEF0dHJpYnV0ZSgnc3R5bGUnLCB0aGlzLmljb25TdHlsZXMpO1xuICAgIGlmICh0aGlzLmNoYXJ0c1tncmFwaElkXS5vcmRlciA9PSAxKSB7XG4gICAgICBzb3J0SWNvbi5zZXRBdHRyaWJ1dGUoJ2NsYXNzJywgJ2ZhIGZhLXNvcnQtYW1vdW50LWRlc2MnKTtcbiAgICB9IGVsc2UgaWYgKHRoaXMuY2hhcnRzW2dyYXBoSWRdLm9yZGVyID09IC0xKSB7XG4gICAgICBzb3J0SWNvbi5zZXRBdHRyaWJ1dGUoJ2NsYXNzJywgJ2ZhIGZhLXNvcnQtYW1vdW50LWFzYycpO1xuICAgIH0gZWxzZSB7XG4gICAgICBzb3J0SWNvbi5zZXRBdHRyaWJ1dGUoJ2NsYXNzJywgJ2ZhIGZhLXNvcnQnKTtcbiAgICB9XG4gICAgY29uc3QgZG93bmxvYWRJY29uID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudChcImlcIik7XG4gICAgZG93bmxvYWRJY29uLnNldEF0dHJpYnV0ZSgnaWQnLCAnZG93bmxvYWRAJyArIGdyYXBoSWQpO1xuICAgIGRvd25sb2FkSWNvbi5zZXRBdHRyaWJ1dGUoJ3N0eWxlJywgdGhpcy5pY29uU3R5bGVzKTtcbiAgICBkb3dubG9hZEljb24uc2V0QXR0cmlidXRlKCdjbGFzcycsICdmYSBmYS1kb3dubG9hZCcpXG5cbiAgICBkaXYuYXBwZW5kQ2hpbGQoZG93bmxvYWRJY29uKTtcbiAgICBkaXYuYXBwZW5kQ2hpbGQoc29ydEljb24pO1xuICAgIGRpdi5hcHBlbmRDaGlsZChzb3J0SWNvbik7XG4gICAgZG9jdW1lbnQucXVlcnlTZWxlY3RvcignIycgKyBncmFwaElkKSEuYXBwZW5kQ2hpbGQoZGl2KTtcbiAgICAvLyBpZiAodGhpcy5jaGFydHNbZ3JhcGhJZF0ucm93c1swXSA9PSAnKioqTEFCRUwqKionKSB7XG4gICAgLy8gfVxuICAgIHRoaXMubWFuYWdlQnJlYWRDcnVtYihncmFwaElkLCB0aGlzKTtcbiAgICBzb3J0SWNvbi5hZGRFdmVudExpc3RlbmVyKCdjbGljaycsIGZ1bmN0aW9uIChlKSB7XG4gICAgICBfc2VsZi5zb3J0R3JhcGgoZSk7XG4gICAgfSk7XG4gICAgZG93bmxvYWRJY29uLmFkZEV2ZW50TGlzdGVuZXIoJ2NsaWNrJywgZnVuY3Rpb24gKGU6IGFueSkge1xuICAgICAgY29uc3QgdGVtcEFyciA9IGUudGFyZ2V0LmlkLnNwbGl0KCdAJyk7XG4gICAgICBjb25zdCBncmFwaElkID0gdGVtcEFyclt0ZW1wQXJyLmxlbmd0aCAtIDFdO1xuICAgICAgbGV0IGRhdGFPYmogPSB7XG4gICAgICAgIGdyYXBoSWQ6IGdyYXBoSWQuc3BsaXQoXCItXCIpWzFdLFxuICAgICAgICBjdXJyTGV2ZWw6IF9zZWxmLmNoYXJ0c1tncmFwaElkXS5jdXJyTGV2ZWwsXG4gICAgICAgIGNvbElkOiBudWxsLFxuICAgICAgICBzZWxLZXk6IF9zZWxmLmNoYXJ0c1tncmFwaElkXS5zZWxLZXlzLFxuICAgICAgICBjb2xUb1Nob3c6IG51bGwsXG4gICAgICAgIGRpcmVjdGlvbjogMCxcbiAgICAgICAgZGF0YUZpbHRlcjogX3NlbGYuY2hhcnRzW2dyYXBoSWRdLmRhc2hib2FyZEZpbHRlcixcbiAgICAgICAgYWRtaW5JZDogX3NlbGYuY2hhcnRzW2dyYXBoSWRdLmFkbWluSWQsXG4gICAgICAgIHNoYXJlaWQ6IF9zZWxmLmNoYXJ0c1tncmFwaElkXS5zaGFyZWlkID8/IG51bGwsXG4gICAgICAgIHN0YXJ0RGF0ZTogX3NlbGYuZGF0ZVBpcGUudHJhbnNmb3JtKF9zZWxmLmNoYXJ0c1tncmFwaElkXS5yYW5nZSEuc3RhcnREYXRlLFwieXl5eS1NTS1kZFwiKSxcbiAgICAgICAgZW5kRGF0ZTogX3NlbGYuZGF0ZVBpcGUudHJhbnNmb3JtKF9zZWxmLmNoYXJ0c1tncmFwaElkXS5yYW5nZSEuZW5kRGF0ZSxcInl5eXktTU0tZGRcIiksXG4gICAgICAgIGZldGNoUmF3RGF0YTogdHJ1ZVxuICAgICAgfVxuICAgICAgX3NlbGYuZG93bmxvYWRHcmFwaERhdGEoZSxncmFwaElkLCBkYXRhT2JqLF9zZWxmLmNoYXJ0c1tncmFwaElkXS5sYXN0TGV2ZWxDb2x1bW5zKTtcbiAgICB9KTtcbiAgfVxuICBcbiAgcHJpdmF0ZSBkb3dubG9hZEdyYXBoRGF0YShlOiBhbnksZ3JhcGhJZDogYW55LCBkYXRhOiBhbnksIGxhc3RMZXZlbENvbDogYW55KXtcbiAgICBTd2FsLmZpcmUoe1xuICAgICAgdGV4dDogXCJEb3dubG9hZGluZy4uLlwiLFxuICAgICAgYWxsb3dPdXRzaWRlQ2xpY2s6IGZhbHNlXG4gICAgfSlcbiAgICBTd2FsLnNob3dMb2FkaW5nKCk7XG4gICAgdGhpcy5kYXRhU2VydmljZS5kb3dubG9hZERyaWxsZG93bkJ5SWQoZGF0YSkuc3Vic2NyaWJlKChyZXMgOiBhbnkpID0+IHtcbiAgICAgIC8vT3BlbiBMYXN0IExldmVsIENvbXBvbmVudFxuICAgICAgdGhpcy5kb3dubG9hZChyZXMpXG4gICAgICAvLyB0aGlzLmRhdGFTZXJ2aWNlLnNldE1vZGFsRGF0YSh7XG4gICAgICAvLyAgIGNvbFRvVmlldzogbGFzdExldmVsQ29sLFxuICAgICAgLy8gICByZWZEYXRhOiByZXMuZGF0YSxcbiAgICAgIC8vIH0pO1xuICAgICAgLy8gbGV0IG1vZGFsT3B0aW9ucyA9IHtcbiAgICAgIC8vICAgcGFuZWxDbGFzczogJ2RhdGFQb3B1cC1tb2RhbCcsXG4gICAgICAvLyAgIGJhY2tkcm9wQ2xhc3M6ICdtb2RhbC1iYWNrZHJvcCcsXG4gICAgICAvLyB9O1xuICAgICAgLy8gdGhpcy5kaWFsb2cub3BlbihEYXRhUG9wdXBDb21wb25lbnQsIG1vZGFsT3B0aW9ucyk7XG4gICAgfSlcbiAgfVxuXG5cbiAgZG93bmxvYWQoaHR0cEV2ZW50OiBIdHRwRXZlbnQ8c3RyaW5nPiB8IEJsb2IpOiB2b2lkIHtcbiAgICAvLyBTd2FsLmZpcmUoe3RleHQ6IFwiRG93bmxvYWRpbmcuLi5cIn0pXG4gICAgLy8gU3dhbC5zaG93TG9hZGluZygpXG4gICAgc3dpdGNoIChodHRwRXZlbnQudHlwZSkge1xuICAgICAgY2FzZSBIdHRwRXZlbnRUeXBlLlNlbnQ6XG4gICAgICAgIGJyZWFrO1xuICAgICAgY2FzZSBIdHRwRXZlbnRUeXBlLlJlc3BvbnNlSGVhZGVyOlxuICAgICAgICBicmVhaztcbiAgICAgIGNhc2UgSHR0cEV2ZW50VHlwZS5Eb3dubG9hZFByb2dyZXNzOlxuICAgICAgICBicmVhaztcbiAgICAgICAgY2FzZSBIdHRwRXZlbnRUeXBlLlJlc3BvbnNlOlxuICAgICAgICAgIGlmICgoaHR0cEV2ZW50LmJvZHkgYXMgYW55KSBpbnN0YW5jZW9mIEFycmF5KSB7XG4gICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICBTd2FsLmNsb3NlKClcbiAgICAgICAgICBTd2FsLmhpZGVMb2FkaW5nKClcbiAgICAgICAgICBsZXQgRVhDRUxfVFlQRSA9XG4gICAgICAgICAgICAnYXBwbGljYXRpb24vdm5kLm9wZW54bWxmb3JtYXRzLW9mZmljZWRvY3VtZW50LnNwcmVhZHNoZWV0bWwuc2hlZXQ7Y2hhcnNldD1VVEYtOCc7XG4gICAgICAgICAgbGV0IEVYQ0VMX0VYVEVOU0lPTiA9ICcueGxzeCc7XG4gICAgICAgICAgY29uc3QgZGF0YSA9IG5ldyBCbG9iKFtodHRwRXZlbnQuYm9keSFdLCB7XG4gICAgICAgICAgICB0eXBlOiBFWENFTF9UWVBFLFxuICAgICAgICAgIH0pO1xuICAgICAgICAgIEZpbGVTYXZlLnNhdmVBcyhkYXRhLCBcImRhdGEueGxzXCIpO1xuICAgICAgICB9XG4gICAgfVxuICB9XG5cblxuXG5cbiAgcHJpdmF0ZSBtYW5hZ2VCcmVhZENydW1iKGdyYXBoSWQ6IHN0cmluZywgX3NlbGY6IGFueSkge1xuICAgIGNvbnN0IGRpdiA9IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKFwiZ3JhcGgtb3B0aW9ucy1cIiArIGdyYXBoSWQpO1xuICAgIGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKFwiYnJlYWRjcnVtYi1cIiArIGdyYXBoSWQpPy5yZW1vdmUoKTtcbiAgICBjb25zdCBicmVhZENydW1iID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudChcImRpdlwiKTtcbiAgICBpZihfc2VsZi5jaGFydHNbZ3JhcGhJZF0uYnJlYWRDcnVtYi5sZW5ndGggPT0gMSl7XG4gICAgICByZXR1cm47XG4gICAgfVxuXG4gICAgYnJlYWRDcnVtYi5zZXRBdHRyaWJ1dGUoJ3N0eWxlJywgdGhpcy5icmVhZGNydW1iU3R5bGVzKTtcbiAgICBicmVhZENydW1iLnNldEF0dHJpYnV0ZSgnaWQnLCBcImJyZWFkY3J1bWItXCIgKyBncmFwaElkKTtcbiAgICAvLyBob21lSWNvbi5zZXRBdHRyaWJ1dGUoJ2lkJywgJ2hvbWUtbGFiZWwtJyArIGdyYXBoSWQpO1xuICAgIC8vIGhvbWVJY29uLnNldEF0dHJpYnV0ZSgnY2xhc3MnLCAnZmEgZmEtaG9tZScpO1xuICAgIF9zZWxmLmNoYXJ0c1tncmFwaElkXS5icmVhZENydW1iLmZvckVhY2goKGJyZWFkY3J1bWI6IGFueSwgaW5kZXg6IGFueSkgPT4ge1xuICAgICAgY29uc3QgcGFyYSA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoXCJwXCIpO1xuICAgICAgY29uc3Qgc3BhbiA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoXCJzcGFuXCIpO1xuICAgICAgc3Bhbi5zZXRBdHRyaWJ1dGUoXCJzdHlsZVwiLCBcInRleHQtZGVjb3JhdGlvbjogdW5kZXJsaW5lOyBjdXJzb3I6IHBvaW50ZXI7XCIpXG4gICAgICBzcGFuLnNldEF0dHJpYnV0ZShcImlkXCIsIGJyZWFkY3J1bWIpO1xuICAgICAgc3Bhbi5hcHBlbmQoYnJlYWRjcnVtYik7XG4gICAgICBwYXJhLmFwcGVuZENoaWxkKHNwYW4pO1xuICAgICAgcGFyYS5zZXRBdHRyaWJ1dGUoXCJzdHlsZVwiLCBcIm1hcmdpbi1ib3R0b206IDBweDtcIilcbiAgICAgIGlmIChpbmRleCAhPSB0aGlzLmNoYXJ0c1tncmFwaElkXS5icmVhZENydW1iLmxlbmd0aCAtIDEpIHtcbiAgICAgICAgcGFyYS5hcHBlbmQoXCIgPiBcIik7XG4gICAgICAgIHNwYW4uYWRkRXZlbnRMaXN0ZW5lcihcImNsaWNrXCIsIChldmVudCA6YW55KSA9PiB7XG4gICAgICAgICAgaWYoZXZlbnQudGFyZ2V0LmlkID09IFwiSG9tZVwiKXtcbiAgICAgICAgICAgICAgbGV0IGQgPSB7XG4gICAgICAgICAgICAgICAgZ3JhcGhJZDogZ3JhcGhJZC5zcGxpdChcIi1cIilbMV0sXG4gICAgICAgICAgICAgICAgZGF0YUZpbHRlcjogdGhpcy5jaGFydHNbZ3JhcGhJZF0uZGFzaGJvYXJkRmlsdGVyLFxuICAgICAgICAgICAgICAgIGRpcmVjdGlvbjogdGhpcy5jaGFydHNbZ3JhcGhJZF0ub3JkZXIsXG4gICAgICAgICAgICAgICAgYWRtaW5JZDogdGhpcy5jaGFydHNbZ3JhcGhJZF0uYWRtaW5JZCxcbiAgICAgICAgICAgICAgICBzaGFyZWlkOiB0aGlzLmNoYXJ0c1tncmFwaElkXS5zaGFyZWlkID8/IG51bGwsXG4gICAgICAgICAgICAgICAgc3RhcnREYXRlOiB0aGlzLmNoYXJ0c1tncmFwaElkXS5yYW5nZSEuc3RhcnREYXRlID8/IG51bGwsXG4gICAgICAgICAgICAgICAgZW5kRGF0ZTogdGhpcy5jaGFydHNbZ3JhcGhJZF0ucmFuZ2UhLmVuZERhdGUgPz8gbnVsbFxuICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgIFN3YWwuZmlyZSh7XG4gICAgICAgICAgICAgICAgdGV4dDogXCJQbGVhc2UgV2FpdC4uLlwiLFxuICAgICAgICAgICAgICAgIGFsbG93T3V0c2lkZUNsaWNrOiBmYWxzZVxuICAgICAgICAgICAgICB9KVxuICAgICAgICAgICAgICBTd2FsLnNob3dMb2FkaW5nKCk7XG4gICAgICAgICAgICAgIHRoaXMuZGF0YVNlcnZpY2UuZ2V0R3JhcGhEYXRhQnlJZChkKS50aGVuKChyZXM6IGFueSkgPT4ge1xuICAgICAgICAgICAgICAgIHRoaXMuY2hhcnRzW2dyYXBoSWRdLmdyYXBoRGF0YSA9IHJlcy5kYXRhO1xuICAgICAgICAgICAgICAgIFN3YWwuaGlkZUxvYWRpbmcoKTtcbiAgICAgICAgICAgICAgICBTd2FsLmNsb3NlKClcbiAgICAgICAgICAgICAgICB0aGlzLmJ1aWxkR3JhcGgoey4uLnRoaXMuY2hhcnRzW2dyYXBoSWRdLCBcbiAgICAgICAgICAgICAgICAgIGJyZWFkQ3J1bWI6IFsnSG9tZSddLFxuICAgICAgICAgICAgICAgICAgY3VyckxldmVsOiAwLFxuICAgICAgICAgICAgICAgICAgc2VsS2V5czogW10sXG4gICAgICAgICAgICAgICAgICBvcmRlcjogMCxcbiAgICAgICAgICAgICAgICAgIHByZXZMZXZlbERhdGE6IFtdLFxuICAgICAgICAgICAgICAgICAgY29sVG9TaG93OiAnJ30pO1xuICAgICAgICAgICAgICB9KVxuICAgICAgICAgICAgLy8gX3RoaXMuY2hhcnRzW2dyYXBoSWRdLmdyYXBoRGF0YSA9IF90aGlzLmNoYXJ0c1tncmFwaElkXS5wcmV2TGV2ZWxEYXRhWzBdO1xuICAgICAgICAgICAgLy8gX3RoaXMuYnVpbGRHcmFwaCh7XG4gICAgICAgICAgICAvLyAgIC4uLl90aGlzLmNoYXJ0c1tncmFwaElkXSxcbiAgICAgICAgICAgIC8vICAgYnJlYWRDcnVtYjogWydIb21lJ10sXG4gICAgICAgICAgICAvLyAgIGN1cnJMZXZlbDogMCxcbiAgICAgICAgICAgIC8vICAgcHJldkxldmVsRGF0YTogW10sXG4gICAgICAgICAgICAvLyAgIG9yZGVyOiAwLFxuICAgICAgICAgICAgLy8gICBzZWxLZXlzOiBbXSxcbiAgICAgICAgICAgIC8vICAgY29sVG9TaG93OiAnJyxcbiAgICAgICAgICAgIC8vIH0gYXMgR3JhcGhEYXRhKVxuICAgICAgICAgIH1lbHNle1xuICAgICAgICAgICAgY29uc3QgaW5kZXggPSBfdGhpcy5jaGFydHNbZ3JhcGhJZF0uYnJlYWRDcnVtYi5maW5kSW5kZXgoKGVsOiBhbnkpID0+IGVsID09IGV2ZW50LnRhcmdldC5pZCk7XG4gICAgICAgICAgICBpZihpbmRleCA+IDApe1xuICAgICAgICAgICAgICAvLyB0aGlzLmJ1aWxkR3JhcGgoKVxuICAgICAgICAgICAgICAvL1Jlc3RvcmluZyBEYXRhIHVzaW5nIHByZXZpb3VzIHN0b3JlIGRhdGFcbiAgICAgICAgICAgICAgX3RoaXMuY2hhcnRzW2dyYXBoSWRdLmN1cnJMZXZlbCA9IGluZGV4O1xuICAgICAgICAgICAgICBfdGhpcy5jaGFydHNbZ3JhcGhJZF0uZ3JhcGhEYXRhID0gX3RoaXMuY2hhcnRzW2dyYXBoSWRdLnByZXZMZXZlbERhdGFbaW5kZXhdO1xuICAgICAgICAgICAgICBcbiAgICAgICAgICAgICAgLy9SZWZyZXNoIFByZXZpb3VzIERhdGEgTGlzdFxuICAgICAgICAgICAgICBfdGhpcy5jaGFydHNbZ3JhcGhJZF0ucHJldkxldmVsRGF0YSA9IF90aGlzLmNoYXJ0c1tncmFwaElkXS5wcmV2TGV2ZWxEYXRhLnNsaWNlKDAsIGluZGV4KTtcbiAgXG4gICAgICAgICAgICAgIF90aGlzLmNoYXJ0c1tncmFwaElkXS5icmVhZENydW1iID0gX3RoaXMuY2hhcnRzW2dyYXBoSWRdLmJyZWFkQ3J1bWIuc2xpY2UoMCwgaW5kZXggKyAxKTtcbiAgICAgICAgICAgICAgXG4gICAgICAgICAgICAgIF90aGlzLmNoYXJ0c1tncmFwaElkXS5zZWxLZXlzID0gX3RoaXMuY2hhcnRzW2dyYXBoSWRdLnNlbEtleXM/LnNsaWNlKDAsIGluZGV4KTtcbiAgICAgICAgICAgICAgXG4gICAgICAgICAgICAgIF90aGlzLmJ1aWxkR3JhcGgoe1xuICAgICAgICAgICAgICAgIC4uLl90aGlzLmNoYXJ0c1tncmFwaElkXSxcbiAgICAgICAgICAgICAgfSBhcyBHcmFwaERhdGEpXG4gICAgICAgICAgICB9XG4gICAgICAgICAgfVxuICAgICAgICB9KVxuICAgICAgfVxuICAgICAgYnJlYWRDcnVtYi5hcHBlbmRDaGlsZChwYXJhKTtcbiAgICAgIGxldCBfdGhpcyA9IHRoaXM7XG4gICAgfSk7XG4gICAgZGl2IS5hcHBlbmRDaGlsZChicmVhZENydW1iKTtcbiAgfVxuXG4gIC8vdHJlbmRzIERhdGFcbiAgcHJpdmF0ZSBidWlsZFRyZW5kKHRyZW5kRGF0YTogVHJlbmRzRGF0YSkge1xuICAgIFxuICAgIC8vU2V0IFRyZW5kc09iamVjdCB3aXRoIEdyYXBoSWRcbiAgICB0aGlzLnRyZW5kc1t0cmVuZERhdGEuZ3JhcGhJZF0gPSB0cmVuZERhdGE7XG5cbiAgICB0aGlzLmluaXRUcmVuZCh0cmVuZERhdGEuZ3JhcGhJZCk7XG4gIH1cblxuICBwcml2YXRlIGFzeW5jIGluaXRUcmVuZChncmFwaElkOiBhbnkpIHtcblxuICAgIC8vQ3JlYXRpbmcgQ2hhcnQgUmF3IEpzb25cbiAgICBjb25zdCB0cmVuZERhdGE6IGFueSA9IGF3YWl0IHRoaXMuY3JlYXRlVHJlbmREYXRhKGdyYXBoSWQpO1xuXG4gICAgLy9SZW5kZXJpbmcgQ2hhcnQgb2YgR3JhcGhJZFxuICAgIHNldFRpbWVvdXQoKCkgPT4ge1xuICAgICAgdGhpcy5oaWdoY2hhcnRzLmNoYXJ0KGdyYXBoSWQsIHRyZW5kRGF0YSk7XG4gICAgfSwgNTAwKVxuXG4gICAgdGhpcy5hZGRBY3Rpb25CdG5UcmVuZHMoZ3JhcGhJZCk7XG5cbiAgICByZXR1cm4gdHJ1ZTtcbiAgfVxuXG4gIHByaXZhdGUgYWRkQWN0aW9uQnRuVHJlbmRzKGdyYXBoSWQ6IHN0cmluZykge1xuICAgIGlmKHRoaXMuc3lzdGVtQXBpcy5pbmNsdWRlcyh0aGlzLnRyZW5kc1tncmFwaElkXS5zb3VyY2VJZCkpe1xuICAgICAgcmV0dXJuO1xuICAgIH1cbiAgICBsZXQgX3NlbGYgPSB0aGlzO1xuICAgIGNvbnN0IGRpdiA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ2RpdicpO1xuICAgIGRpdi5zZXRBdHRyaWJ1dGUoJ3N0eWxlJywgdGhpcy5kaXZTdHlsZXMpO1xuICAgIGxldCBjYWxlbmRhckljb24gPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdpJyk7IC8vQ2FsZW5kYXIgSWNvblxuICAgIGNhbGVuZGFySWNvbi5zZXRBdHRyaWJ1dGUoJ3N0eWxlJywgdGhpcy5pY29uU3R5bGVzKTtcbiAgICBjYWxlbmRhckljb24uc2V0QXR0cmlidXRlKCdjbGFzcycsICdmYSBmYS1jYWxlbmRhcicpO1xuICAgIGNvbnN0IGRvd25sb2FkSWNvbiA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoXCJpXCIpO1xuICAgIGRvd25sb2FkSWNvbi5zZXRBdHRyaWJ1dGUoJ2lkJywgJ2Rvd25sb2FkQCcgKyBncmFwaElkKTtcbiAgICBkb3dubG9hZEljb24uc2V0QXR0cmlidXRlKCdzdHlsZScsIHRoaXMuaWNvblN0eWxlcyk7XG4gICAgZG93bmxvYWRJY29uLnNldEF0dHJpYnV0ZSgnY2xhc3MnLCAnZmEgZmEtZG93bmxvYWQnKVxuXG4gICAgZGl2LmFwcGVuZENoaWxkKGRvd25sb2FkSWNvbik7XG4gICAgZGl2LmFwcGVuZENoaWxkKGNhbGVuZGFySWNvbik7XG4gICAgLy9DYWxlbmRhciBJY29uIENsaWNrIGhhbmRsZXJcbiAgICBjYWxlbmRhckljb24uYWRkRXZlbnRMaXN0ZW5lcignY2xpY2snLCBmdW5jdGlvbiAoZTogYW55KSB7XG4gICAgICB2YXIgX2E7XG4gICAgICBpZiAoZS50YXJnZXQubG9jYWxOYW1lID09ICdpJykge1xuICAgICAgICBpZiAoXG4gICAgICAgICAgKChfYSA9IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKCdoaWRkZW4tZGF0ZS0nICsgZ3JhcGhJZCkpID09PSBudWxsIHx8XG4gICAgICAgICAgX2EgPT09IHZvaWQgMFxuICAgICAgICAgICAgPyB2b2lkIDBcbiAgICAgICAgICAgIDogX2Euc3R5bGUuZGlzcGxheSkgPT0gJ2Jsb2NrJ1xuICAgICAgICApIHtcbiAgICAgICAgICBkb2N1bWVudC5nZXRFbGVtZW50QnlJZCgnaGlkZGVuLWRhdGUtJyArIGdyYXBoSWQpIS5zdHlsZS5kaXNwbGF5ID1cbiAgICAgICAgICAgICdub25lJzsgLy8gSGlkZSBDaGFuZ2UgRGF0ZSBtb2RhbFxuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgIGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKCdoaWRkZW4tZGF0ZS0nICsgZ3JhcGhJZCkhLnN0eWxlLmRpc3BsYXkgPVxuICAgICAgICAgICAgJ2Jsb2NrJzsgLy9TaG93IENoYW5nZSBEYXRlIG1vZGFsXG4gICAgICAgIH1cbiAgICAgIH1cbiAgICB9KTtcbiAgICBsZXQgZGl2MiA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ2RpdicpOyAvL0NoYW5nZSBEYXRlIE1vZGFsXG4gICAgZGl2Mi5zZXRBdHRyaWJ1dGUoXG4gICAgICAnc3R5bGUnLFxuICAgICAgdGhpcy5kaXZTdHlsZXMgK1xuICAgICAgICAnZGlzcGxheTogbm9uZTtwYWRkaW5nOiAzMCU7aGVpZ2h0OiAyMjBweDtiYWNrZ3JvdW5kLWNvbG9yOiAjY2NjO3dpZHRoOiAxNzJweDtib3JkZXItcmFkaXVzOiA1cHg7J1xuICAgICk7XG4gICAgZGl2Mi5zZXRBdHRyaWJ1dGUoJ2lkJywgJ2hpZGRlbi1kYXRlLScgKyBncmFwaElkKTtcbiAgICBsZXQgc3RhcnREYXRlSW5wdXQgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdpbnB1dCcpOyAvL1N0YXJ0IERhdGUgSW5wdXRcbiAgICBsZXQgc3RhcnREYXRlTGFiZWwgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdsYWJlbCcpO1xuICAgIHN0YXJ0RGF0ZUxhYmVsLmlubmVySFRNTCA9ICdTdGFydCBEYXRlJztcbiAgICBzdGFydERhdGVJbnB1dC5zZXRBdHRyaWJ1dGUoJ3R5cGUnLCAnZGF0ZScpO1xuICAgIHN0YXJ0RGF0ZUlucHV0LnNldEF0dHJpYnV0ZSgnY2xhc3MnLCAnZm9ybS1jb250cm9sIHN0YXJ0RGF0ZS0nICsgZ3JhcGhJZCk7XG4gICAgc3RhcnREYXRlSW5wdXQuc2V0QXR0cmlidXRlKCd2YWx1ZScsIHRoaXMudHJlbmRzW2dyYXBoSWRdLnJhbmdlLnN0YXJ0RGF0ZSk7XG4gICAgbGV0IGVuZERhdGVJbnB1dCA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ2lucHV0Jyk7IC8vRW5kIERhdGUgSW5wdXRcbiAgICBsZXQgZW5kRGF0ZUxhYmVsID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnbGFiZWwnKTtcbiAgICBlbmREYXRlTGFiZWwuaW5uZXJIVE1MID0gJ0VuZCBEYXRlJztcbiAgICBlbmREYXRlSW5wdXQuc2V0QXR0cmlidXRlKCd0eXBlJywgJ2RhdGUnKTtcbiAgICBlbmREYXRlSW5wdXQuc2V0QXR0cmlidXRlKCdjbGFzcycsICdmb3JtLWNvbnRyb2wgZW5kRGF0ZS0nICsgZ3JhcGhJZCk7XG4gICAgZW5kRGF0ZUlucHV0LnNldEF0dHJpYnV0ZSgndmFsdWUnLCB0aGlzLnRyZW5kc1tncmFwaElkXS5yYW5nZS5lbmREYXRlKTtcbiAgICBsZXQgc3VibWl0QnV0dG9uID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnYnV0dG9uJyk7XG4gICAgc3VibWl0QnV0dG9uLmlubmVySFRNTCA9ICdEb25lJztcbiAgICBzdWJtaXRCdXR0b24uc2V0QXR0cmlidXRlKCdjbGFzcycsICdidG4gYnRuLXN1Y2Nlc3MnKTtcbiAgICBzdWJtaXRCdXR0b24uc2V0QXR0cmlidXRlKCdzdHlsZScsICdmbG9hdDogcmlnaHQ7Jyk7XG4gICAgLy9IYW5kbGUgU3VibWl0IGJ1dHRvbiBjbGlja1xuICAgIHN1Ym1pdEJ1dHRvbi5hZGRFdmVudExpc3RlbmVyKCdjbGljaycsIGZ1bmN0aW9uICgpIHtcbiAgICAgIGxldCBzdGFydERhdGU6IGFueSA9IGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3IoJy5zdGFydERhdGUtJyArIGdyYXBoSWQpO1xuICAgICAgbGV0IGVuZERhdGU6IGFueSA9IGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3IoJy5lbmREYXRlLScgKyBncmFwaElkKTtcbiAgICAgIGxldCBkID0ge1xuICAgICAgICBncmFwaElkOiBncmFwaElkLnNwbGl0KFwiLVwiKVsxXSxcbiAgICAgICAgZGF0YUZpbHRlcjogX3NlbGYudHJlbmRzW2dyYXBoSWRdLmRhc2hib2FyZEZpbHRlcixcbiAgICAgICAgZGlyZWN0aW9uOiBfc2VsZi50cmVuZHNbZ3JhcGhJZF0ub3JkZXIsXG4gICAgICAgIGFkbWluSWQ6IF9zZWxmLnRyZW5kc1tncmFwaElkXS5hZG1pbklkLFxuICAgICAgICBzaGFyZWlkOiBfc2VsZi50cmVuZHNbZ3JhcGhJZF0uc2hhcmVpZCA/PyBudWxsLFxuICAgICAgICBzdGFydERhdGU6IHN0YXJ0RGF0ZS52YWx1ZSxcbiAgICAgICAgZW5kRGF0ZTogZW5kRGF0ZS52YWx1ZVxuICAgICAgfVxuICAgICAgU3dhbC5maXJlKHtcbiAgICAgICAgdGV4dDogXCJQbGVhc2UgV2FpdC4uLlwiLFxuICAgICAgICBhbGxvd091dHNpZGVDbGljazogZmFsc2VcbiAgICAgIH0pXG4gICAgICBTd2FsLnNob3dMb2FkaW5nKCk7XG4gICAgICBfc2VsZi5kYXRhU2VydmljZS5nZXRHcmFwaERhdGFCeUlkKGQpLnRoZW4oKHJlczogYW55KSA9PiB7XG4gICAgICAgIF9zZWxmLnRyZW5kc1tncmFwaElkXS5ncmFwaERhdGEgPSByZXMuZGF0YTtcbiAgICAgICAgU3dhbC5oaWRlTG9hZGluZygpO1xuICAgICAgICBTd2FsLmNsb3NlKCk7XG4gICAgICAgIF9zZWxmLmJ1aWxkVHJlbmQoX3NlbGYudHJlbmRzW2dyYXBoSWRdKTtcbiAgICAgIH0pXG4gICAgICBkb2N1bWVudC5nZXRFbGVtZW50QnlJZCgnaGlkZGVuLWRhdGUtJyArIGdyYXBoSWQpIS5zdHlsZS5kaXNwbGF5ID0gJ25vbmUnO1xuICAgIH0pO1xuICAgIGRpdjIuYXBwZW5kKFxuICAgICAgc3RhcnREYXRlTGFiZWwsXG4gICAgICBzdGFydERhdGVJbnB1dCxcbiAgICAgIGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ2JyJyksXG4gICAgICBlbmREYXRlTGFiZWwsXG4gICAgICBlbmREYXRlSW5wdXQsXG4gICAgICBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdicicpLFxuICAgICAgc3VibWl0QnV0dG9uXG4gICAgKTsgLy8gQXBwZW5kaW5nIElucHV0cyBpbiBDaGFuZ2UgRGF0ZSBNb2RhbFxuICAgIGRpdi5hcHBlbmQoY2FsZW5kYXJJY29uKTsgLy9BZGQgQ2FsZW5kYXIgaWNvbiBpbiBhY3Rpb24gYnV0dG9uXG4gICAgZGl2LmFwcGVuZENoaWxkKGRpdjIpOyAvL0FkZCBDaGFuZ2UgRGF0ZSBtb2RhbCBpbiBhY3Rpb24gYnV0dG9uXG4gICAgZG9jdW1lbnQucXVlcnlTZWxlY3RvcignIycgKyBncmFwaElkKSEuYXBwZW5kQ2hpbGQoZGl2KTsgLy9SZW5kZXJpbmcgYWN0aW9uIGJ1dHRvbnMgdG8gZ3JhcGggZGl2XG4gICAgZG93bmxvYWRJY29uLmFkZEV2ZW50TGlzdGVuZXIoJ2NsaWNrJywgZnVuY3Rpb24gKGU6IGFueSkge1xuICAgICAgY29uc3QgdGVtcEFyciA9IGUudGFyZ2V0LmlkLnNwbGl0KCdAJyk7XG4gICAgICBjb25zdCBncmFwaElkID0gdGVtcEFyclt0ZW1wQXJyLmxlbmd0aCAtIDFdO1xuICAgICAgbGV0IGRhdGFPYmogPSB7XG4gICAgICAgIGdyYXBoSWQ6IGdyYXBoSWQuc3BsaXQoXCItXCIpWzFdLFxuICAgICAgICBjdXJyTGV2ZWw6IDAsXG4gICAgICAgIGNvbElkOiBudWxsLFxuICAgICAgICBzZWxLZXk6IF9zZWxmLnRyZW5kc1tncmFwaElkXS5zZWxLZXlzLFxuICAgICAgICBjb2xUb1Nob3c6IG51bGwsXG4gICAgICAgIGRpcmVjdGlvbjogMCxcbiAgICAgICAgZGF0YUZpbHRlcjogX3NlbGYudHJlbmRzW2dyYXBoSWRdLmRhc2hib2FyZEZpbHRlcixcbiAgICAgICAgYWRtaW5JZDogX3NlbGYudHJlbmRzW2dyYXBoSWRdLmFkbWluSWQsXG4gICAgICAgIHNoYXJlaWQ6IF9zZWxmLnRyZW5kc1tncmFwaElkXS5zaGFyZWlkID8/IG51bGwsXG4gICAgICAgIHN0YXJ0RGF0ZTogX3NlbGYuZGF0ZVBpcGUudHJhbnNmb3JtKF9zZWxmLnRyZW5kc1tncmFwaElkXS5yYW5nZSEuc3RhcnREYXRlLFwieXl5eS1NTS1kZFwiKSxcbiAgICAgICAgZW5kRGF0ZTogX3NlbGYuZGF0ZVBpcGUudHJhbnNmb3JtKF9zZWxmLnRyZW5kc1tncmFwaElkXS5yYW5nZSEuZW5kRGF0ZSxcInl5eXktTU0tZGRcIiksXG4gICAgICAgIGZldGNoUmF3RGF0YTogdHJ1ZVxuICAgICAgfVxuICAgICAgX3NlbGYuZG93bmxvYWRHcmFwaERhdGEoZSxncmFwaElkLCBkYXRhT2JqLF9zZWxmLnRyZW5kc1tncmFwaElkXS5sYXN0TGV2ZWxDb2x1bW5zKTtcbiAgICB9KTtcbiAgfVxuXG4gIHByaXZhdGUgZ2V0UGxvdE9wdGlvbnNUcmVuZHMoZ3JhcGhJZDogc3RyaW5nKSB7XG4gICAgbGV0IHBsb3RPcHRpb25zID0ge1xuICAgICAgc2VyaWVzOiB7XG4gICAgICAgIHR1cmJvVGhyZXNob2xkOiAxMDAwMCxcbiAgICAgICAgZGF0YUxhYmVsczoge1xuICAgICAgICAgIGNvbG9yOiAnYmxhY2snLFxuICAgICAgICAgIGVuYWJsZWQ6IHRydWUsXG4gICAgICAgICAgc3R5bGU6IHtcbiAgICAgICAgICAgIGNvbG9yOiAnYmxhY2snLFxuICAgICAgICAgICAgdGV4dFNoYWRvdzogZmFsc2UsXG4gICAgICAgICAgICB0ZXh0RGVjb3JhdGlvbjogJ25vbmUnLFxuICAgICAgICAgIH0sXG4gICAgICAgIH0sXG4gICAgICAgIGxhYmVsOiB7XG4gICAgICAgICAgc3R5bGU6IHtcbiAgICAgICAgICAgIGNvbG9yOiAnYmxhY2snLFxuICAgICAgICAgIH0sXG4gICAgICAgIH0sXG4gICAgICB9LFxuICAgIH07XG4gICAgcmV0dXJuIHBsb3RPcHRpb25zO1xuICB9XG5cbiAgcHJpdmF0ZSBjcmVhdGVUcmVuZERhdGEoZ3JhcGhJZDogYW55KTogYW55IHtcbiAgICBsZXQgX3NlbGYgPSB0aGlzO1xuXG4gICAgLy9HZXR0aW5nIFBsb3QgT3B0aW9ucyBmb3IgR3JhcGhcbiAgICBjb25zdCBwbG90T3B0aW9ucyA9IHRoaXMuZ2V0UGxvdE9wdGlvbnNUcmVuZHMoZ3JhcGhJZCk7XG5cbiAgICByZXR1cm4ge1xuICAgICAgY3JlZGl0czoge1xuICAgICAgICB0ZXh0OiB0aGlzLmNyZWRpdFRpdGxlLFxuICAgICAgICBocmVmOiB0aGlzLmNyZWRpdFVybCxcbiAgICAgICAgc3R5bGU6IHtcbiAgICAgICAgICBmb250U2l6ZTogJzEycHgnLFxuICAgICAgICB9LFxuICAgICAgfSxcbiAgICAgIHRpdGxlOiBudWxsLFxuICAgICAgcGxvdE9wdGlvbnM6IHBsb3RPcHRpb25zLFxuICAgICAgY2hhcnQ6IHtcbiAgICAgICAgdHlwZTogJ2xpbmUnLFxuICAgICAgICBldmVudHM6IHtcbiAgICAgICAgICAvL0hhbmRsZSBEcmlsbGRvd24gRXZlbnQgb2YgR3JhcGhcbiAgICAgICAgICBkcmlsbGRvd246IGZ1bmN0aW9uIChlOiBhbnkpIHtcbiAgICAgICAgICAgIGlmKGUucG9pbnRzICE9IGZhbHNlKSByZXR1cm4gXG4gICAgICAgICAgICBsZXQgY3VyckdyYXBoSWQgPSBlLnRhcmdldC51c2VyT3B0aW9ucy5zZXJpZXNbMF0uZ3JhcGhJZDsgLy9HcmFwaElkXG4gICAgICAgICAgICBsZXQgY29sSW5kZXggPSBlLnBvaW50LmNvbEluZGV4OyAvL0NvbG9ySW5kZXggb2YgYmFyXG4gICAgICAgICAgICBsZXQgY29tcGFyaXNvbktleSA9IGUucG9pbnQub3B0aW9ucy5jb21wYXJpc29uS2V5OyAvL0NvbG9ySW5kZXggb2YgYmFyXG4gICAgICAgICAgICBsZXQgY2hhcnQgOiBhbnkgPSB0aGlzO1xuICAgICAgICAgICAgY2hhcnQuc2hvd0xvYWRpbmcoJ0xvYWRpbmcuLi4nKTtcbiAgICAgICAgICAgIGxldCBzZWxLZXkgPSBlLnBvaW50Lm5hbWU7XG4gICAgICAgICAgICBsZXQgZGF0YU9iaiA9IHtcbiAgICAgICAgICAgICAgZ3JhcGhJZDogY3VyckdyYXBoSWQsXG4gICAgICAgICAgICAgIGN1cnJMZXZlbDogMSxcbiAgICAgICAgICAgICAgY29sSWQ6IGNvbEluZGV4LFxuICAgICAgICAgICAgICBzZWxLZXk6IFtzZWxLZXldLFxuICAgICAgICAgICAgICBjb2xUb1Nob3c6IG51bGwsXG4gICAgICAgICAgICAgIGRpcmVjdGlvbjogMCxcbiAgICAgICAgICAgICAgZGF0YUZpbHRlcjogX3NlbGYudHJlbmRzW1wiZ3JhcGgtXCIgKyBjdXJyR3JhcGhJZF0uZGFzaGJvYXJkRmlsdGVyLFxuICAgICAgICAgICAgICBhZG1pbklkOiBfc2VsZi50cmVuZHNbXCJncmFwaC1cIiArIGN1cnJHcmFwaElkXS5hZG1pbklkLFxuICAgICAgICAgICAgICBzaGFyZWlkOiBfc2VsZi50cmVuZHNbXCJncmFwaC1cIiArIGN1cnJHcmFwaElkXS5zaGFyZWlkID8/IG51bGwsXG4gICAgICAgICAgICAgIHN0YXJ0RGF0ZTogX3NlbGYuZGF0ZVBpcGUudHJhbnNmb3JtKF9zZWxmLnRyZW5kc1tcImdyYXBoLVwiICsgY3VyckdyYXBoSWRdLnJhbmdlLnN0YXJ0RGF0ZSxcInl5eXktTU0tZGRcIiksXG4gICAgICAgICAgICAgIGVuZERhdGU6IF9zZWxmLmRhdGVQaXBlLnRyYW5zZm9ybShfc2VsZi50cmVuZHNbXCJncmFwaC1cIiArIGN1cnJHcmFwaElkXS5yYW5nZS5lbmREYXRlLFwieXl5eS1NTS1kZFwiKVxuICAgICAgICAgICAgfVxuICAgICAgICAgICAgaWYoY29tcGFyaXNvbktleSAhPSBudWxsKXtcbiAgICAgICAgICAgICAgZGF0YU9iai5zZWxLZXkucHVzaChjb21wYXJpc29uS2V5KTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIF9zZWxmLmRhdGFTZXJ2aWNlLmdldEdyYXBoRHJpbGxkb3duQnlJZChkYXRhT2JqKS50aGVuKChyZXMgOiBhbnkpID0+IHtcbiAgICAgICAgICAgICAgLy9PcGVuIExhc3QgTGV2ZWwgQ29tcG9uZW50XG4gICAgICAgICAgICAgXG4gICAgICAgICAgICAgIF9zZWxmLmRhdGFTZXJ2aWNlLnNldE1vZGFsRGF0YSh7XG4gICAgICAgICAgICAgICAgY29sVG9WaWV3OiBfc2VsZi50cmVuZHNbXCJncmFwaC1cIiArIGN1cnJHcmFwaElkXS5sYXN0TGV2ZWxDb2x1bW5zLFxuICAgICAgICAgICAgICAgIHJlZkRhdGE6IHJlcy5kYXRhLFxuICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgICAgbGV0IG1vZGFsT3B0aW9ucyA9IHtcbiAgICAgICAgICAgICAgICBwYW5lbENsYXNzOiAnZGF0YVBvcHVwLW1vZGFsJyxcbiAgICAgICAgICAgICAgICBiYWNrZHJvcENsYXNzOiAnbW9kYWwtYmFja2Ryb3AnLFxuICAgICAgICAgICAgICB9O1xuICAgICAgICAgICAgICBfc2VsZi5kaWFsb2cub3BlbihEYXRhUG9wdXBDb21wb25lbnQsIG1vZGFsT3B0aW9ucyk7XG5cbiAgICAgICAgICAgICAgc2V0VGltZW91dCgoKSA9PiB7XG4gICAgICAgICAgICAgICAgLy9IaWRlIExvYWRpbmcgaW4gY2hhcnRcbiAgICAgICAgICAgICAgICBjaGFydC5oaWRlTG9hZGluZygpO1xuICAgICAgICAgICAgICB9LCAxMDAwKTtcbiAgICAgICAgICAgICAgLy8gcmV0dXJuO1xuICAgICAgICAgICAgfSlcbiAgICAgICAgICB9LFxuICAgICAgICB9LFxuICAgICAgfSxcbiAgICAgIHhBeGlzOiB7XG4gICAgICAgIHR5cGU6ICdjYXRlZ29yeScsXG4gICAgICAgIGxhYmVsczoge1xuICAgICAgICAgIHN0eWxlOiB7XG4gICAgICAgICAgICBjb2xvcjogJ3JlZCcsXG4gICAgICAgICAgICB0ZXh0RGVjb3JhdGlvbjogJ25vbmUnLFxuICAgICAgICAgICAgdGV4dE91dGxpbmU6ICcwcHgnLFxuICAgICAgICAgIH0sXG4gICAgICAgIH0sXG4gICAgICAgIG1pbjogMCxcbiAgICAgICAgYWxsb3dEZWNpbWFsczogZmFsc2UsXG4gICAgICAgIHNjcm9sbGJhcjoge1xuICAgICAgICAgIGVuYWJsZWQ6IHRydWUsXG4gICAgICAgIH0sXG4gICAgICB9LFxuICAgICAgeUF4aXM6IFtcbiAgICAgICAge1xuICAgICAgICAgIG9wcG9zaXRlOiB0cnVlLFxuICAgICAgICAgIHRpdGxlOiB7XG4gICAgICAgICAgICB0ZXh0OiBudWxsLFxuICAgICAgICAgIH0sXG4gICAgICAgIH0sXG4gICAgICBdLFxuICAgICAgc2VyaWVzOiB0aGlzLnRyZW5kc1tncmFwaElkXS5ncmFwaERhdGEsXG4gICAgfTtcbiAgfVxufSJdfQ==