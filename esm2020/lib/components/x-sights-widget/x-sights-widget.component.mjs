import { Component, Input, Output, EventEmitter } from '@angular/core';
import { WidgetType } from '../../x-sights-core.service';
import * as i0 from "@angular/core";
import * as i1 from "../../x-sights-core.service";
import * as i2 from "../../services/xsights-backend.service";
import * as i3 from "../../services/data.service";
import * as i4 from "@angular/common";
import * as i5 from "devextreme-angular";
import * as i6 from "devextreme-angular/ui/nested";
export class XSightsWidgetComponent {
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
                let response = await _self.xsightsBackend.build(WidgetType.TREND, graphData);
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
                    await _self.xsights.build(WidgetType.PIVOT_TABLE, tableData);
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
                    let response = this.xsightsBackend.build(WidgetType.GRAPH, graphdata);
                }, 500);
                resolve(true);
            }
        });
    }
}
XSightsWidgetComponent.ɵfac = i0.ɵɵngDeclareFactory({ minVersion: "12.0.0", version: "13.0.3", ngImport: i0, type: XSightsWidgetComponent, deps: [{ token: i1.XSightsCoreService }, { token: i2.XsightsBackendService }, { token: i3.DataService }, { token: i4.DatePipe }], target: i0.ɵɵFactoryTarget.Component });
XSightsWidgetComponent.ɵcmp = i0.ɵɵngDeclareComponent({ minVersion: "12.0.0", version: "13.0.3", type: XSightsWidgetComponent, selector: "x-sights-widget", inputs: { widgetId: "widgetId", graphPrefix: "graphPrefix", startDate: "startDate", endDate: "endDate", adminId: "adminId", isLoad: "isLoad", graphData: "graphData" }, outputs: { widgetLoaded: "widgetLoaded" }, usesOnChanges: true, ngImport: i0, template: "<ng-container *ngIf=\"graphData != null\">\n    <div class=\"header-classs\" *ngIf=\"graphData.graphtype == 2\">\n        <h3>{{graphData.name}}</h3>\n    </div>\n    <div class=\"graph-class\" *ngIf=\"graphData.graphtype != 2 && !isLoad\">\n        <h3>{{graphData.name}}</h3>\n    </div>\n    <ng-container *ngIf=\"isLoad && graphData.graphtype != 2 && graphData.graphtype != 3\">\n        <div class=\"widgetContainer\" style=\"padding: 0px;\"> <!-- loader start -->\n            <h3 *ngIf=\"graphData.structure.xAxis[0] != '***LABEL***'\" style=\"text-align: center; background-color: #eee; padding: 2px;\">{{graphData.name}}</h3>\n            <div [id]=\"'graph-' + graphPrefix + widgetId\"  style=\"position: relative; padding: 10px; padding-top: 45px;\">\n                <div class=\"lds-ellipsis\">\n                    <div></div>\n                    <div></div>\n                    <div></div>\n                    <div></div>\n                </div> <!-- loader end -->\n            </div>\n        </div>\n    </ng-container>\n    <div *ngIf=\"isLoad && graphData.graphtype == 3 && pivotTable\"\n        style=\"display: flex; flex-direction:column; width: 100%; align-items: center;\">\n        <p style=\"font-size: 16px; font-weight: 600;\">{{graphData.name}}</p> <dx-pivot-grid [allowSortingBySummary]=\"true\"\n            [allowSorting]=\"true\" [allowFiltering]=\"true\" [showBorders]=\"true\" [dataSource]=\"pivotTable\"> <dxo-field-chooser\n                [enabled]=\"false\"></dxo-field-chooser> </dx-pivot-grid>\n    </div>\n</ng-container>", styles: [".widgetContainer{position:relative;min-height:300px;width:-webkit-fill-available;display:flex;align-items:center;justify-content:center}.header-classs{padding:20px;width:100%;background:#eac9a8;color:#fff;display:flex;align-items:center;justify-content:center}.graph-class{height:200px;width:100%;display:flex;align-items:center;justify-content:center;background:#eee}.graph-class h3{margin-bottom:0;font-size:28px;font-weight:400}.header-classs h3{margin-bottom:0;font-size:31px;font-weight:500}.lds-ellipsis{display:flex;align-items:center;position:relative;width:80px;margin:auto;height:80px}.lds-ellipsis div{position:absolute;top:33px;width:13px;height:13px;border-radius:50%;background:#000;animation-timing-function:cubic-bezier(0,1,1,0)}.lds-ellipsis div:nth-child(1){left:8px;animation:lds-ellipsis1 .6s infinite}.lds-ellipsis div:nth-child(2){left:8px;animation:lds-ellipsis2 .6s infinite}.lds-ellipsis div:nth-child(3){left:32px;animation:lds-ellipsis2 .6s infinite}.lds-ellipsis div:nth-child(4){left:56px;animation:lds-ellipsis3 .6s infinite}@keyframes lds-ellipsis1{0%{transform:scale(0)}to{transform:scale(1)}}@keyframes lds-ellipsis3{0%{transform:scale(1)}to{transform:scale(0)}}@keyframes lds-ellipsis2{0%{transform:translate(0)}to{transform:translate(24px)}}\n"], components: [{ type: i5.DxPivotGridComponent, selector: "dx-pivot-grid", inputs: ["allowExpandAll", "allowFiltering", "allowSorting", "allowSortingBySummary", "dataFieldArea", "dataSource", "disabled", "elementAttr", "encodeHtml", "export", "fieldChooser", "fieldPanel", "headerFilter", "height", "hideEmptySummaryCells", "hint", "loadPanel", "rowHeaderLayout", "rtlEnabled", "scrolling", "showBorders", "showColumnGrandTotals", "showColumnTotals", "showRowGrandTotals", "showRowTotals", "showTotalsPrior", "stateStoring", "tabIndex", "texts", "visible", "width", "wordWrapEnabled"], outputs: ["onCellClick", "onCellPrepared", "onContentReady", "onContextMenuPreparing", "onDisposing", "onExporting", "onInitialized", "onOptionChanged", "allowExpandAllChange", "allowFilteringChange", "allowSortingChange", "allowSortingBySummaryChange", "dataFieldAreaChange", "dataSourceChange", "disabledChange", "elementAttrChange", "encodeHtmlChange", "exportChange", "fieldChooserChange", "fieldPanelChange", "headerFilterChange", "heightChange", "hideEmptySummaryCellsChange", "hintChange", "loadPanelChange", "rowHeaderLayoutChange", "rtlEnabledChange", "scrollingChange", "showBordersChange", "showColumnGrandTotalsChange", "showColumnTotalsChange", "showRowGrandTotalsChange", "showRowTotalsChange", "showTotalsPriorChange", "stateStoringChange", "tabIndexChange", "textsChange", "visibleChange", "widthChange", "wordWrapEnabledChange"] }, { type: i6.DxoFieldChooserComponent, selector: "dxo-field-chooser", inputs: ["allowSearch", "applyChangesMode", "enabled", "height", "layout", "searchTimeout", "texts", "title", "width"] }], directives: [{ type: i4.NgIf, selector: "[ngIf]", inputs: ["ngIf", "ngIfThen", "ngIfElse"] }] });
i0.ɵɵngDeclareClassMetadata({ minVersion: "12.0.0", version: "13.0.3", ngImport: i0, type: XSightsWidgetComponent, decorators: [{
            type: Component,
            args: [{ selector: 'x-sights-widget', template: "<ng-container *ngIf=\"graphData != null\">\n    <div class=\"header-classs\" *ngIf=\"graphData.graphtype == 2\">\n        <h3>{{graphData.name}}</h3>\n    </div>\n    <div class=\"graph-class\" *ngIf=\"graphData.graphtype != 2 && !isLoad\">\n        <h3>{{graphData.name}}</h3>\n    </div>\n    <ng-container *ngIf=\"isLoad && graphData.graphtype != 2 && graphData.graphtype != 3\">\n        <div class=\"widgetContainer\" style=\"padding: 0px;\"> <!-- loader start -->\n            <h3 *ngIf=\"graphData.structure.xAxis[0] != '***LABEL***'\" style=\"text-align: center; background-color: #eee; padding: 2px;\">{{graphData.name}}</h3>\n            <div [id]=\"'graph-' + graphPrefix + widgetId\"  style=\"position: relative; padding: 10px; padding-top: 45px;\">\n                <div class=\"lds-ellipsis\">\n                    <div></div>\n                    <div></div>\n                    <div></div>\n                    <div></div>\n                </div> <!-- loader end -->\n            </div>\n        </div>\n    </ng-container>\n    <div *ngIf=\"isLoad && graphData.graphtype == 3 && pivotTable\"\n        style=\"display: flex; flex-direction:column; width: 100%; align-items: center;\">\n        <p style=\"font-size: 16px; font-weight: 600;\">{{graphData.name}}</p> <dx-pivot-grid [allowSortingBySummary]=\"true\"\n            [allowSorting]=\"true\" [allowFiltering]=\"true\" [showBorders]=\"true\" [dataSource]=\"pivotTable\"> <dxo-field-chooser\n                [enabled]=\"false\"></dxo-field-chooser> </dx-pivot-grid>\n    </div>\n</ng-container>", styles: [".widgetContainer{position:relative;min-height:300px;width:-webkit-fill-available;display:flex;align-items:center;justify-content:center}.header-classs{padding:20px;width:100%;background:#eac9a8;color:#fff;display:flex;align-items:center;justify-content:center}.graph-class{height:200px;width:100%;display:flex;align-items:center;justify-content:center;background:#eee}.graph-class h3{margin-bottom:0;font-size:28px;font-weight:400}.header-classs h3{margin-bottom:0;font-size:31px;font-weight:500}.lds-ellipsis{display:flex;align-items:center;position:relative;width:80px;margin:auto;height:80px}.lds-ellipsis div{position:absolute;top:33px;width:13px;height:13px;border-radius:50%;background:#000;animation-timing-function:cubic-bezier(0,1,1,0)}.lds-ellipsis div:nth-child(1){left:8px;animation:lds-ellipsis1 .6s infinite}.lds-ellipsis div:nth-child(2){left:8px;animation:lds-ellipsis2 .6s infinite}.lds-ellipsis div:nth-child(3){left:32px;animation:lds-ellipsis2 .6s infinite}.lds-ellipsis div:nth-child(4){left:56px;animation:lds-ellipsis3 .6s infinite}@keyframes lds-ellipsis1{0%{transform:scale(0)}to{transform:scale(1)}}@keyframes lds-ellipsis3{0%{transform:scale(1)}to{transform:scale(0)}}@keyframes lds-ellipsis2{0%{transform:translate(0)}to{transform:translate(24px)}}\n"] }]
        }], ctorParameters: function () { return [{ type: i1.XSightsCoreService }, { type: i2.XsightsBackendService }, { type: i3.DataService }, { type: i4.DatePipe }]; }, propDecorators: { widgetId: [{
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoieC1zaWdodHMtd2lkZ2V0LmNvbXBvbmVudC5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uLy4uLy4uLy4uLy4uL3Byb2plY3RzL3gtc2lnaHRzLWNvcmUvc3JjL2xpYi9jb21wb25lbnRzL3gtc2lnaHRzLXdpZGdldC94LXNpZ2h0cy13aWRnZXQuY29tcG9uZW50LnRzIiwiLi4vLi4vLi4vLi4vLi4vLi4vcHJvamVjdHMveC1zaWdodHMtY29yZS9zcmMvbGliL2NvbXBvbmVudHMveC1zaWdodHMtd2lkZ2V0L3gtc2lnaHRzLXdpZGdldC5jb21wb25lbnQuaHRtbCJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFDQSxPQUFPLEVBQUUsU0FBUyxFQUFFLEtBQUssRUFBVSxNQUFNLEVBQUUsWUFBWSxFQUFpQixNQUFNLGVBQWUsQ0FBQztBQUU5RixPQUFPLEVBQUUsVUFBVSxFQUFzQixNQUFNLDZCQUE2QixDQUFDOzs7Ozs7OztBQVE3RSxNQUFNLE9BQU8sc0JBQXNCO0lBYWpDLFlBQ1UsT0FBMkIsRUFDM0IsY0FBcUMsRUFDckMsV0FBd0IsRUFDeEIsUUFBa0I7UUFIbEIsWUFBTyxHQUFQLE9BQU8sQ0FBb0I7UUFDM0IsbUJBQWMsR0FBZCxjQUFjLENBQXVCO1FBQ3JDLGdCQUFXLEdBQVgsV0FBVyxDQUFhO1FBQ3hCLGFBQVEsR0FBUixRQUFRLENBQVU7UUFoQm5CLGFBQVEsR0FBVyxDQUFDLENBQUM7UUFDckIsZ0JBQVcsR0FBVyxFQUFFLENBQUM7UUFDekIsY0FBUyxHQUFRLElBQUksQ0FBQztRQUN0QixZQUFPLEdBQVEsSUFBSSxDQUFDO1FBQ3BCLFlBQU8sR0FBUSxHQUFHLENBQUM7UUFDbkIsV0FBTSxHQUFZLElBQUksQ0FBQztRQUN0QixpQkFBWSxHQUFzQixJQUFJLFlBQVksRUFBRSxDQUFDO1FBQ3RELGNBQVMsR0FBUSxJQUFJLENBQUM7UUFDL0IsV0FBTSxHQUFRLEVBQUUsQ0FBQztRQUNqQixlQUFVLEdBQVEsSUFBSSxDQUFDO1FB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UUFBUSxDQUFDLFVBQVU7b0JBQzNCLGVBQWUsRUFBRSxFQUFFO2lCQUNwQixDQUFDO2dCQUNGLFVBQVUsQ0FBQyxHQUFHLEVBQUU7b0JBQ2QsSUFBSSxRQUFRLEdBQUcsSUFBSSxDQUFDLGNBQWMsQ0FBQyxLQUFLLENBQUMsVUFBVSxDQUFDLEtBQUssRUFBRSxTQUFTLENBQUMsQ0FBQztnQkFDeEUsQ0FBQyxFQUFFLEdBQUcsQ0FBQyxDQUFBO2dCQUNQLE9BQU8sQ0FBQyxJQUFJLENBQUMsQ0FBQzthQUNmO1FBQ0gsQ0FBQyxDQUFDLENBQUM7SUFDTCxDQUFDOzttSEFwTFUsc0JBQXNCO3VHQUF0QixzQkFBc0IsK1JDWG5DLGlpREEwQmU7MkZEZkYsc0JBQXNCO2tCQUxsQyxTQUFTOytCQUNFLGlCQUFpQjs4TEFLbEIsUUFBUTtzQkFBaEIsS0FBSztnQkFDRyxXQUFXO3NCQUFuQixLQUFLO2dCQUNHLFNBQVM7c0JBQWpCLEtBQUs7Z0JBQ0csT0FBTztzQkFBZixLQUFLO2dCQUNHLE9BQU87c0JBQWYsS0FBSztnQkFDRyxNQUFNO3NCQUFkLEtBQUs7Z0JBQ0ksWUFBWTtzQkFBckIsTUFBTTtnQkFDRSxTQUFTO3NCQUFqQixLQUFLIiwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0IHsgRGF0ZVBpcGUgfSBmcm9tICdAYW5ndWxhci9jb21tb24nO1xuaW1wb3J0IHsgQ29tcG9uZW50LCBJbnB1dCwgT25Jbml0LCBPdXRwdXQsIEV2ZW50RW1pdHRlciwgU2ltcGxlQ2hhbmdlcyB9IGZyb20gJ0Bhbmd1bGFyL2NvcmUnO1xuaW1wb3J0IHsgRGF0YVNlcnZpY2UgfSBmcm9tICcuLi8uLi9zZXJ2aWNlcy9kYXRhLnNlcnZpY2UnO1xuaW1wb3J0IHsgV2lkZ2V0VHlwZSwgWFNpZ2h0c0NvcmVTZXJ2aWNlIH0gZnJvbSAnLi4vLi4veC1zaWdodHMtY29yZS5zZXJ2aWNlJztcbmltcG9ydCB7IFhzaWdodHNCYWNrZW5kU2VydmljZSB9IGZyb20gJy4uLy4uL3NlcnZpY2VzL3hzaWdodHMtYmFja2VuZC5zZXJ2aWNlJztcblxuQENvbXBvbmVudCh7XG4gIHNlbGVjdG9yOiAneC1zaWdodHMtd2lkZ2V0JyxcbiAgdGVtcGxhdGVVcmw6ICcuL3gtc2lnaHRzLXdpZGdldC5jb21wb25lbnQuaHRtbCcsXG4gIHN0eWxlVXJsczogWycuL3gtc2lnaHRzLXdpZGdldC5jb21wb25lbnQuc2NzcyddLFxufSlcbmV4cG9ydCBjbGFzcyBYU2lnaHRzV2lkZ2V0Q29tcG9uZW50IGltcGxlbWVudHMgT25Jbml0IHtcbiAgQElucHV0KCkgd2lkZ2V0SWQ6IG51bWJlciA9IDA7XG4gIEBJbnB1dCgpIGdyYXBoUHJlZml4OiBzdHJpbmcgPSAnJztcbiAgQElucHV0KCkgc3RhcnREYXRlOiBhbnkgPSBudWxsO1xuICBASW5wdXQoKSBlbmREYXRlOiBhbnkgPSBudWxsO1xuICBASW5wdXQoKSBhZG1pbklkOiBhbnkgPSAnMCc7XG4gIEBJbnB1dCgpIGlzTG9hZDogYm9vbGVhbiA9IHRydWU7XG4gIEBPdXRwdXQoKSB3aWRnZXRMb2FkZWQ6IEV2ZW50RW1pdHRlcjxhbnk+ID0gbmV3IEV2ZW50RW1pdHRlcigpO1xuICBASW5wdXQoKSBncmFwaERhdGE6IGFueSA9IG51bGw7XG4gIGZpZWxkczogYW55ID0gW107XG4gIHBpdm90VGFibGU6IGFueSA9IG51bGw7XG4gIHN0cnVjdHVyZTogYW55ID0gbnVsbDtcblxuICBjb25zdHJ1Y3RvcihcbiAgICBwcml2YXRlIHhzaWdodHM6IFhTaWdodHNDb3JlU2VydmljZSxcbiAgICBwcml2YXRlIHhzaWdodHNCYWNrZW5kOiBYc2lnaHRzQmFja2VuZFNlcnZpY2UsXG4gICAgcHJpdmF0ZSBkYXRhU2VydmljZTogRGF0YVNlcnZpY2UsXG4gICAgcHJpdmF0ZSBkYXRlUGlwZTogRGF0ZVBpcGVcbiAgKSB7XG4gICAgaWYgKHRoaXMuc3RhcnREYXRlID09IG51bGwpIHtcbiAgICAgIHRoaXMuc3RhcnREYXRlID0gdGhpcy5kYXRlUGlwZS50cmFuc2Zvcm0oXG4gICAgICAgIG5ldyBEYXRlKG5ldyBEYXRlKCkuc2V0RGF0ZShuZXcgRGF0ZSgpLmdldERhdGUoKSAtIDMpKSxcbiAgICAgICAgJ3l5eXktTU0tZGQnXG4gICAgICApO1xuICAgIH1cbiAgICBpZiAodGhpcy5lbmREYXRlID09IG51bGwpIHtcbiAgICAgIHRoaXMuZW5kRGF0ZSA9IHRoaXMuZGF0ZVBpcGUudHJhbnNmb3JtKG5ldyBEYXRlKCksICd5eXl5LU1NLWRkJyk7XG4gICAgfVxuICB9XG5cbiAgbmdPbkluaXQoKTogdm9pZCB7XG4gICAgXG4gIH1cbiAgbmdBZnRlckNvbnRlbnRJbml0KCkge1xuICAgIC8vQ2FsbGVkIGFmdGVyIG5nT25Jbml0IHdoZW4gdGhlIGNvbXBvbmVudCdzIG9yIGRpcmVjdGl2ZSdzIGNvbnRlbnQgaGFzIGJlZW4gaW5pdGlhbGl6ZWQuXG4gICAgLy9BZGQgJ2ltcGxlbWVudHMgQWZ0ZXJDb250ZW50SW5pdCcgdG8gdGhlIGNsYXNzLlxuICB9XG5cbiAgbmdPbkNoYW5nZXMoY2hhbmdlczogU2ltcGxlQ2hhbmdlcykge1xuICAgIC8vQ2FsbGVkIGJlZm9yZSBhbnkgb3RoZXIgbGlmZWN5Y2xlIGhvb2suIFVzZSBpdCB0byBpbmplY3QgZGVwZW5kZW5jaWVzLCBidXQgYXZvaWQgYW55IHNlcmlvdXMgd29yayBoZXJlLlxuICAgIC8vQWRkICcke2ltcGxlbWVudHMgT25DaGFuZ2VzfScgdG8gdGhlIGNsYXNzLlxuICAgIGlmIChcbiAgICAgIGNoYW5nZXNbJ3dpZGdldElkJ10uY3VycmVudFZhbHVlICE9IGNoYW5nZXNbJ3dpZGdldElkJ10ucHJldmlvdXNWYWx1ZSB8fFxuICAgICAgY2hhbmdlc1snYWRtaW5JZCddLmN1cnJlbnRWYWx1ZSAhPSBjaGFuZ2VzWydhZG1pbklkJ10ucHJldmlvdXNWYWx1ZSB8fFxuICAgICAgY2hhbmdlc1snc3RhcnREYXRlJ10uY3VycmVudFZhbHVlICE9IGNoYW5nZXNbJ3N0YXJ0RGF0ZSddLnByZXZpb3VzVmFsdWUgfHxcbiAgICAgIGNoYW5nZXNbJ2VuZERhdGUnXS5jdXJyZW50VmFsdWUgIT0gY2hhbmdlc1snZW5kRGF0ZSddLnByZXZpb3VzVmFsdWVcbiAgICApIHtcbiAgICAgIHRoaXMucmVuZGVyV2lkZ2V0KCk7XG4gICAgfVxuICB9XG5cbiAgcmVuZGVyV2lkZ2V0KCkge1xuICAgIGlmKHRoaXMuaXNMb2FkKXtcbiAgICAgIHRoaXMuZHJhd1dpZGdldEJ5SWQoKS50aGVuKCgpID0+IHtcbiAgICAgICAgdGhpcy53aWRnZXRMb2FkZWQuZW1pdCh7XG4gICAgICAgICAgaXNMb2FkZWQ6IHRydWVcbiAgICAgICAgfSk7XG4gICAgICB9KTtcbiAgICB9ZWxzZXtcbiAgICAgIHRoaXMud2lkZ2V0TG9hZGVkLmVtaXQoe1xuICAgICAgICBpc0xvYWRlZDogdHJ1ZVxuICAgICAgfSk7XG4gICAgfVxuICB9XG5cbiAgZHJhd1dpZGdldEJ5SWQoKSB7XG4gICAgcmV0dXJuIG5ldyBQcm9taXNlKGFzeW5jIChyZXNvbHZlLCByZWplY3QpID0+IHtcbiAgICAgICAgbGV0IGQgPSB7XG4gICAgICAgICAgZ3JhcGhJZDogdGhpcy53aWRnZXRJZCxcbiAgICAgICAgICBkYXRhRmlsdGVyOiB7fSxcbiAgICAgICAgICBkaXJlY3Rpb246IDAsXG4gICAgICAgICAgYWRtaW5JZDogdGhpcy5hZG1pbklkLFxuICAgICAgICAgIHNoYXJlaWQ6IG51bGxcbiAgICAgICAgfVxuICAgICAgICBsZXQgc3RydWN0dXJlID0gSlNPTi5wYXJzZSh0aGlzLmdyYXBoRGF0YS5zdHJ1Y3R1cmUpO1xuICAgICAgICB0aGlzLnN0cnVjdHVyZSA9IHN0cnVjdHVyZTtcbiAgICAgICAgdGhpcy5kYXRhU2VydmljZS5nZXRHcmFwaERhdGFCeUlkKGQpLnRoZW4oKHJlczogYW55KSA9PiB7XG4gICAgICAgICAgbGV0IGdyYXBoRGF0YSA9IHJlcy5kYXRhO1xuICAgICAgICAgIFxuICAgICAgICAgIGlmICh0aGlzLmdyYXBoRGF0YS5ncmFwaHR5cGUgIT0gMikge1xuICAgICAgICAgICAgbGV0IHRlbXBHcmFwaERhdGEgPSB7XG4gICAgICAgICAgICAgIHJvd3M6IHN0cnVjdHVyZS54QXhpcyxcbiAgICAgICAgICAgICAgY29sdW1uczogc3RydWN0dXJlLnlBeGlzLFxuICAgICAgICAgICAgICBhZ2dyZWdhdGlvbkZ1bmN0aW9uczogc3RydWN0dXJlLmFnZ3JlYWdhdGlvbnMsXG4gICAgICAgICAgICAgIGZpbHRlcjogc3RydWN0dXJlLmZpbHRlcixcbiAgICAgICAgICAgICAgY3VzdG9tVmFyaWFibGU6IHN0cnVjdHVyZS5kZXJpdmVkVmFyaWFibGVzLFxuICAgICAgICAgICAgICBkYXRhRm9ybWF0OiBbXSxcbiAgICAgICAgICAgICAgY29sVG9TaG93OiBudWxsLFxuICAgICAgICAgICAgICBsYXN0TGV2ZWxDb2x1bW5zOiBzdHJ1Y3R1cmUubGFzdExldmVsRGF0YSA/PyBbXSxcbiAgICAgICAgICAgICAgY2hhcnRUeXBlOiBzdHJ1Y3R1cmUuY2hhcnRUeXBlLFxuICAgICAgICAgICAgICByYW5nZUZpbHRlcjogc3RydWN0dXJlLnJhbmdlRmlsdGVyLFxuICAgICAgICAgICAgICBkYXRlVmFyaWFibGU6IHN0cnVjdHVyZS5kYXRlVmFyaWFibGUsXG4gICAgICAgICAgICAgIGNvbXBhcmlzb246IHN0cnVjdHVyZS5jb21wYXJpc29uLFxuICAgICAgICAgICAgICBjb2xDb2xvdXJzOiBzdHJ1Y3R1cmUuY29sQ29sb3VycyxcbiAgICAgICAgICAgICAgc3RhcnREYXRlOiBzdHJ1Y3R1cmUuc3RhcnREYXRlLFxuICAgICAgICAgICAgICBlbmREYXRlOiBzdHJ1Y3R1cmUuZW5kRGF0ZVxuICAgICAgICAgICAgfTtcbiAgICAgICAgICAgIHRoaXMuYnVpbGRDaGFydCh0aGlzLmdyYXBoRGF0YSwgZ3JhcGhEYXRhLCB0ZW1wR3JhcGhEYXRhKTtcbiAgICAgICAgICB9XG4gICAgICAgIH0pO1xuICAgIH0pXG4gIH1cblxuICBidWlsZENoYXJ0KHdpZGdldERhdGE6IGFueSwgZGF0YTogYW55LCB0ZW1wRGF0YTogYW55KSB7XG4gICAgbGV0IF9zZWxmID0gdGhpcztcbiAgICByZXR1cm4gbmV3IFByb21pc2UoYXN5bmMgKHJlc29sdmUsIHJlamVjdCkgPT4ge1xuICAgICAgaWYgKHdpZGdldERhdGEuZ3JhcGh0eXBlID09IDEpIHtcbiAgICAgICAgbGV0IHJhbmdlID0ge1xuICAgICAgICAgIHN0YXJ0RGF0ZTogdGhpcy5kYXRlUGlwZS50cmFuc2Zvcm0oXG4gICAgICAgICAgICB0ZW1wRGF0YS5zdGFydERhdGUsXG4gICAgICAgICAgICAneXl5eS1NTS1kZCdcbiAgICAgICAgICApLFxuICAgICAgICAgIGVuZERhdGU6IHRoaXMuZGF0ZVBpcGUudHJhbnNmb3JtKFxuICAgICAgICAgICAgdGVtcERhdGEuZW5kRGF0ZSxcbiAgICAgICAgICAgICd5eXl5LU1NLWRkJ1xuICAgICAgICAgICksXG4gICAgICAgIH07XG4gICAgICAgIGxldCBncmFwaERhdGEgPSB7XG4gICAgICAgICAgZ3JhcGhJZDogJ2dyYXBoLScgKyB3aWRnZXREYXRhLmlkLFxuICAgICAgICAgIGdyYXBoVGl0bGU6IHdpZGdldERhdGEuZ3JhcGhuYW1lLFxuICAgICAgICAgIHJvd3M6IHRlbXBEYXRhLnJvd3NbMF0sXG4gICAgICAgICAgY29sdW1uczogdGVtcERhdGEuY29sdW1uc1swXSxcbiAgICAgICAgICBncmFwaFR5cGVzOiB0ZW1wRGF0YS5jaGFydFR5cGVbMF0sXG4gICAgICAgICAgZ3JhcGhEYXRhOiBkYXRhLFxuICAgICAgICAgIGFnZ3JlZ2F0aW9uRnVuY3Rpb25zOiB0ZW1wRGF0YS5hZ2dyZWdhdGlvbkZ1bmN0aW9uc1swXSxcbiAgICAgICAgICBmaWx0ZXI6IHRlbXBEYXRhLmZpbHRlcixcbiAgICAgICAgICBjb2xvcnM6IHRlbXBEYXRhLmNvbENvbG91cnNbMF0sXG4gICAgICAgICAgcmFuZ2U6IHJhbmdlLFxuICAgICAgICAgIGRhdGVWYXJpYWJsZTogdGVtcERhdGEuZGF0ZVZhcmlhYmxlLFxuICAgICAgICAgIHJhbmdlRmlsdGVyOiB0ZW1wRGF0YS5yYW5nZUZpbHRlcixcbiAgICAgICAgICBjb21wYXJpc29uOiB0ZW1wRGF0YS5jb21wYXJpc29uID8/IFtdLFxuICAgICAgICAgIGN1c3RvbVZhcmlhYmxlOiB0ZW1wRGF0YS5jdXN0b21WYXJpYWJsZSxcbiAgICAgICAgICBkYXRhRm9ybWF0OiB0ZW1wRGF0YS5kYXRhRm9ybWF0ID8/IFtdLFxuICAgICAgICAgIGxhc3RMZXZlbENvbHVtbnM6IHRlbXBEYXRhLmxhc3RMZXZlbENvbHVtbnMgPz8gW10sXG4gICAgICAgICAgc2VsS2V5czogW10sXG4gICAgICAgICAgYWRtaW5JZDogdGhpcy5hZG1pbklkLFxuICAgICAgICAgIHNvdXJjZUlkOiB3aWRnZXREYXRhLnNvdXJjZWlkLFxuICAgICAgICAgIGRhc2hib2FyZEZpbHRlcjogW11cbiAgICAgICAgfTtcbiAgICAgICAgbGV0IHJlc3BvbnNlID0gYXdhaXQgX3NlbGYueHNpZ2h0c0JhY2tlbmQuYnVpbGQoV2lkZ2V0VHlwZS5UUkVORCwgZ3JhcGhEYXRhKTtcbiAgICAgICAgcmVzb2x2ZShyZXNwb25zZSk7XG4gICAgICB9IGVsc2UgaWYgKHdpZGdldERhdGEuZ3JhcGh0eXBlID09IDMpIHtcbiAgICAgICAgbGV0IHRhYmxlRGF0YSA9IHtcbiAgICAgICAgICByb3dzOiB0ZW1wRGF0YS5yb3dzLFxuICAgICAgICAgIGNvbHVtbjogdGVtcERhdGEuY29sdW1ucyxcbiAgICAgICAgICBhZ2dyZWdhdGlvbkZ1bmN0aW9uOiB0ZW1wRGF0YS5hZ2dyZWdhdGlvbkZ1bmN0aW9ucyxcbiAgICAgICAgICBmaWx0ZXI6IHRlbXBEYXRhLmZpbHRlcixcbiAgICAgICAgICBkZXJpdmVkVmFyaWFibGVzOiB0ZW1wRGF0YS5jdXN0b21WYXJpYWJsZSxcbiAgICAgICAgICBkYXRhRm9ybWF0OiB0ZW1wRGF0YS5kYXRhRm9ybWF0ID8/IFtdLFxuICAgICAgICAgIGRhdGE6IGRhdGEsXG4gICAgICAgICAgY2F0ZWdvcmllczogdGVtcERhdGEuY2hhcnRUeXBlXG4gICAgICAgIH07XG4gICAgICAgIF9zZWxmLnBpdm90VGFibGUgPVxuICAgICAgICAgIGF3YWl0IF9zZWxmLnhzaWdodHMuYnVpbGQoV2lkZ2V0VHlwZS5QSVZPVF9UQUJMRSwgdGFibGVEYXRhKTtcbiAgICAgICAgcmVzb2x2ZSh0cnVlKTtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIGxldCBncmFwaGRhdGEgPSB7XG4gICAgICAgICAgZ3JhcGhJZDogJ2dyYXBoLScgKyB3aWRnZXREYXRhLmlkLFxuICAgICAgICAgIGdyYXBoVGl0bGU6IHdpZGdldERhdGEuZ3JhcGhuYW1lLFxuICAgICAgICAgIHJvd3M6IHRlbXBEYXRhLnJvd3MsXG4gICAgICAgICAgYWRtaW5JZDogdGhpcy5hZG1pbklkLFxuICAgICAgICAgIGNvbHVtbnM6IHRlbXBEYXRhLmNvbHVtbnMsXG4gICAgICAgICAgYWdncmVnYXRpb25GdW5jdGlvbnM6IHRlbXBEYXRhLmFnZ3JlZ2F0aW9uRnVuY3Rpb25zLFxuICAgICAgICAgIGZpbHRlcjogdGVtcERhdGEuZmlsdGVyLFxuICAgICAgICAgIGN1c3RvbVZhcmlhYmxlOiB0ZW1wRGF0YS5jdXN0b21WYXJpYWJsZSxcbiAgICAgICAgICBzZWxLZXlzOiBbXSxcbiAgICAgICAgICBzb3VyY2VJZDogd2lkZ2V0RGF0YS5zb3VyY2VpZCxcbiAgICAgICAgICBkYXRhRm9ybWF0OiB0ZW1wRGF0YS5kYXRhRm9ybWF0ID8/IFtdLFxuICAgICAgICAgIGxhc3RMZXZlbENvbHVtbnM6IHRlbXBEYXRhLmxhc3RMZXZlbENvbHVtbnMgPz8gW10sXG4gICAgICAgICAgZ3JhcGhUeXBlczogdGVtcERhdGEuY2hhcnRUeXBlLFxuICAgICAgICAgIGdyYXBoRGF0YTogZGF0YSxcbiAgICAgICAgICBjb2xvcnM6IHRlbXBEYXRhLmNvbENvbG91cnMsXG4gICAgICAgICAgZGFzaGJvYXJkRmlsdGVyOiBbXVxuICAgICAgICB9O1xuICAgICAgICBzZXRUaW1lb3V0KCgpID0+IHtcbiAgICAgICAgICBsZXQgcmVzcG9uc2UgPSB0aGlzLnhzaWdodHNCYWNrZW5kLmJ1aWxkKFdpZGdldFR5cGUuR1JBUEgsIGdyYXBoZGF0YSk7XG4gICAgICAgIH0sIDUwMClcbiAgICAgICAgcmVzb2x2ZSh0cnVlKTtcbiAgICAgIH1cbiAgICB9KTtcbiAgfVxufVxuIiwiPG5nLWNvbnRhaW5lciAqbmdJZj1cImdyYXBoRGF0YSAhPSBudWxsXCI+XG4gICAgPGRpdiBjbGFzcz1cImhlYWRlci1jbGFzc3NcIiAqbmdJZj1cImdyYXBoRGF0YS5ncmFwaHR5cGUgPT0gMlwiPlxuICAgICAgICA8aDM+e3tncmFwaERhdGEubmFtZX19PC9oMz5cbiAgICA8L2Rpdj5cbiAgICA8ZGl2IGNsYXNzPVwiZ3JhcGgtY2xhc3NcIiAqbmdJZj1cImdyYXBoRGF0YS5ncmFwaHR5cGUgIT0gMiAmJiAhaXNMb2FkXCI+XG4gICAgICAgIDxoMz57e2dyYXBoRGF0YS5uYW1lfX08L2gzPlxuICAgIDwvZGl2PlxuICAgIDxuZy1jb250YWluZXIgKm5nSWY9XCJpc0xvYWQgJiYgZ3JhcGhEYXRhLmdyYXBodHlwZSAhPSAyICYmIGdyYXBoRGF0YS5ncmFwaHR5cGUgIT0gM1wiPlxuICAgICAgICA8ZGl2IGNsYXNzPVwid2lkZ2V0Q29udGFpbmVyXCIgc3R5bGU9XCJwYWRkaW5nOiAwcHg7XCI+IDwhLS0gbG9hZGVyIHN0YXJ0IC0tPlxuICAgICAgICAgICAgPGgzICpuZ0lmPVwiZ3JhcGhEYXRhLnN0cnVjdHVyZS54QXhpc1swXSAhPSAnKioqTEFCRUwqKionXCIgc3R5bGU9XCJ0ZXh0LWFsaWduOiBjZW50ZXI7IGJhY2tncm91bmQtY29sb3I6ICNlZWU7IHBhZGRpbmc6IDJweDtcIj57e2dyYXBoRGF0YS5uYW1lfX08L2gzPlxuICAgICAgICAgICAgPGRpdiBbaWRdPVwiJ2dyYXBoLScgKyBncmFwaFByZWZpeCArIHdpZGdldElkXCIgIHN0eWxlPVwicG9zaXRpb246IHJlbGF0aXZlOyBwYWRkaW5nOiAxMHB4OyBwYWRkaW5nLXRvcDogNDVweDtcIj5cbiAgICAgICAgICAgICAgICA8ZGl2IGNsYXNzPVwibGRzLWVsbGlwc2lzXCI+XG4gICAgICAgICAgICAgICAgICAgIDxkaXY+PC9kaXY+XG4gICAgICAgICAgICAgICAgICAgIDxkaXY+PC9kaXY+XG4gICAgICAgICAgICAgICAgICAgIDxkaXY+PC9kaXY+XG4gICAgICAgICAgICAgICAgICAgIDxkaXY+PC9kaXY+XG4gICAgICAgICAgICAgICAgPC9kaXY+IDwhLS0gbG9hZGVyIGVuZCAtLT5cbiAgICAgICAgICAgIDwvZGl2PlxuICAgICAgICA8L2Rpdj5cbiAgICA8L25nLWNvbnRhaW5lcj5cbiAgICA8ZGl2ICpuZ0lmPVwiaXNMb2FkICYmIGdyYXBoRGF0YS5ncmFwaHR5cGUgPT0gMyAmJiBwaXZvdFRhYmxlXCJcbiAgICAgICAgc3R5bGU9XCJkaXNwbGF5OiBmbGV4OyBmbGV4LWRpcmVjdGlvbjpjb2x1bW47IHdpZHRoOiAxMDAlOyBhbGlnbi1pdGVtczogY2VudGVyO1wiPlxuICAgICAgICA8cCBzdHlsZT1cImZvbnQtc2l6ZTogMTZweDsgZm9udC13ZWlnaHQ6IDYwMDtcIj57e2dyYXBoRGF0YS5uYW1lfX08L3A+IDxkeC1waXZvdC1ncmlkIFthbGxvd1NvcnRpbmdCeVN1bW1hcnldPVwidHJ1ZVwiXG4gICAgICAgICAgICBbYWxsb3dTb3J0aW5nXT1cInRydWVcIiBbYWxsb3dGaWx0ZXJpbmddPVwidHJ1ZVwiIFtzaG93Qm9yZGVyc109XCJ0cnVlXCIgW2RhdGFTb3VyY2VdPVwicGl2b3RUYWJsZVwiPiA8ZHhvLWZpZWxkLWNob29zZXJcbiAgICAgICAgICAgICAgICBbZW5hYmxlZF09XCJmYWxzZVwiPjwvZHhvLWZpZWxkLWNob29zZXI+IDwvZHgtcGl2b3QtZ3JpZD5cbiAgICA8L2Rpdj5cbjwvbmctY29udGFpbmVyPiJdfQ==