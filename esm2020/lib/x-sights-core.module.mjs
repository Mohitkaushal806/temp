import { CommonModule, DatePipe } from '@angular/common';
import { HttpClientModule } from '@angular/common/http';
import { NgModule } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { BrowserModule } from '@angular/platform-browser';
import { XSightsCoreComponent } from './x-sights-core.component';
import { DxPivotGridModule } from 'devextreme-angular';
import { ToastrModule } from 'ngx-toastr';
import { ChartsModule } from 'ng2-charts';
import { NgbModalModule, NgbModule, NgbActiveModal, } from '@ng-bootstrap/ng-bootstrap';
import { TableModule } from 'primeng/table';
import { AngularPivotTableModule } from 'angular-pivot-table';
import { HighchartsChartModule } from 'highcharts-angular';
import { NgSelect2Module } from 'ng-select2';
import { NgMultiSelectDropDownModule } from 'ng-multiselect-dropdown';
import { XSightsPublicDashboardComponent } from './components/x-sights-public-dashboard/x-sights-public-dashboard.component';
import { XSightsDashboardComponent } from './components/x-sights-dashboard/x-sights-dashboard.component';
import { DataPopupComponent } from './components/data-popup/data-popup.component';
import { XSightsWidgetComponent } from './components/x-sights-widget/x-sights-widget.component';
import { XSightsBackendDashboardComponent } from './components/x-sights-backend-dashboard/x-sights-backend-dashboard.component';
import { XSightsBackendPublicDashboardComponent } from './components/x-sights-backend-public-dashboard/x-sights-backend-public-dashboard.component';
import * as i0 from "@angular/core";
import * as i1 from "ngx-toastr";
import * as i2 from "ng-multiselect-dropdown";
export class XSightsCoreModule {
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
        HttpClientModule, i1.ToastrModule, NgSelect2Module, i2.NgMultiSelectDropDownModule, NgbModalModule,
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoieC1zaWdodHMtY29yZS5tb2R1bGUuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi8uLi9wcm9qZWN0cy94LXNpZ2h0cy1jb3JlL3NyYy9saWIveC1zaWdodHMtY29yZS5tb2R1bGUudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUEsT0FBTyxFQUFFLFlBQVksRUFBRSxRQUFRLEVBQUUsTUFBTSxpQkFBaUIsQ0FBQztBQUN6RCxPQUFPLEVBQUUsZ0JBQWdCLEVBQUUsTUFBTSxzQkFBc0IsQ0FBQztBQUN4RCxPQUFPLEVBQUUsUUFBUSxFQUFFLE1BQU0sZUFBZSxDQUFDO0FBQ3pDLE9BQU8sRUFBRSxXQUFXLEVBQUUsTUFBTSxnQkFBZ0IsQ0FBQztBQUM3QyxPQUFPLEVBQUUsYUFBYSxFQUFFLE1BQU0sMkJBQTJCLENBQUM7QUFDMUQsT0FBTyxFQUFFLG9CQUFvQixFQUFFLE1BQU0sMkJBQTJCLENBQUM7QUFFakUsT0FBTyxFQUFFLGlCQUFpQixFQUFFLE1BQU0sb0JBQW9CLENBQUM7QUFDdkQsT0FBTyxFQUFFLFlBQVksRUFBRSxNQUFNLFlBQVksQ0FBQztBQUMxQyxPQUFPLEVBQUUsWUFBWSxFQUFFLE1BQU0sWUFBWSxDQUFDO0FBRTFDLE9BQU8sRUFDTCxjQUFjLEVBQ2QsU0FBUyxFQUNULGNBQWMsR0FDZixNQUFNLDRCQUE0QixDQUFDO0FBQ3BDLE9BQU8sRUFBRSxXQUFXLEVBQUUsTUFBTSxlQUFlLENBQUM7QUFDNUMsT0FBTyxFQUFFLHVCQUF1QixFQUFFLE1BQU0scUJBQXFCLENBQUM7QUFDOUQsT0FBTyxFQUFFLHFCQUFxQixFQUFFLE1BQU0sb0JBQW9CLENBQUM7QUFFM0QsT0FBTyxFQUFFLGVBQWUsRUFBRSxNQUFNLFlBQVksQ0FBQztBQUM3QyxPQUFPLEVBQUUsMkJBQTJCLEVBQUUsTUFBTSx5QkFBeUIsQ0FBQztBQUN0RSxPQUFPLEVBQUUsK0JBQStCLEVBQUUsTUFBTSw0RUFBNEUsQ0FBQztBQUM3SCxPQUFPLEVBQUUseUJBQXlCLEVBQUUsTUFBTSw4REFBOEQsQ0FBQztBQUN6RyxPQUFPLEVBQUUsa0JBQWtCLEVBQUUsTUFBTSw4Q0FBOEMsQ0FBQztBQUNsRixPQUFPLEVBQUUsc0JBQXNCLEVBQUUsTUFBTSx3REFBd0QsQ0FBQztBQUNoRyxPQUFPLEVBQUUsZ0NBQWdDLEVBQUUsTUFBTSw4RUFBOEUsQ0FBQztBQUNoSSxPQUFPLEVBQUUsc0NBQXNDLEVBQUUsTUFBTSw0RkFBNEYsQ0FBQzs7OztBQTJDcEosTUFBTSxPQUFPLGlCQUFpQjs7OEdBQWpCLGlCQUFpQjsrR0FBakIsaUJBQWlCLGNBRmhCLG9CQUFvQixrQkFyQzlCLG9CQUFvQjtRQUNwQixrQkFBa0I7UUFDbEIsK0JBQStCO1FBQy9CLHlCQUF5QjtRQUN6QixzQkFBc0I7UUFDdEIsZ0NBQWdDO1FBQ2hDLHNDQUFzQyxhQUd0QyxZQUFZO1FBQ1osaUJBQWlCO1FBQ2pCLHVCQUF1QjtRQUN2QixXQUFXO1FBQ1gsZ0JBQWdCLG1CQUVoQixlQUFlLGtDQUVmLGNBQWM7UUFDZCxhQUFhO1FBQ2IsU0FBUztRQUNULHFCQUFxQjtRQUNyQixZQUFZO1FBQ1osV0FBVyxhQU9ULG9CQUFvQjtRQUNwQix5QkFBeUI7UUFDekIsZ0NBQWdDO1FBQ2hDLHNDQUFzQztRQUN0QyxrQkFBa0I7UUFDbEIsc0JBQXNCO1FBQ3RCLCtCQUErQjsrR0FJeEIsaUJBQWlCLGFBZmpCO1FBQ1QsY0FBYztRQUNkLFFBQVE7S0FDVCxZQW5CUTtZQUNQLFlBQVk7WUFDWixpQkFBaUI7WUFDakIsdUJBQXVCO1lBQ3ZCLFdBQVc7WUFDWCxnQkFBZ0I7WUFDaEIsWUFBWSxDQUFDLE9BQU8sRUFBRTtZQUN0QixlQUFlO1lBQ2YsMkJBQTJCLENBQUMsT0FBTyxFQUFFO1lBQ3JDLGNBQWM7WUFDZCxhQUFhO1lBQ2IsU0FBUztZQUNULHFCQUFxQjtZQUNyQixZQUFZO1lBQ1osV0FBVztTQUNaOzJGQWdCVSxpQkFBaUI7a0JBekM3QixRQUFRO21CQUFDO29CQUNSLFlBQVksRUFBRTt3QkFDWixvQkFBb0I7d0JBQ3BCLGtCQUFrQjt3QkFDbEIsK0JBQStCO3dCQUMvQix5QkFBeUI7d0JBQ3pCLHNCQUFzQjt3QkFDdEIsZ0NBQWdDO3dCQUNoQyxzQ0FBc0M7cUJBQ3ZDO29CQUNELE9BQU8sRUFBRTt3QkFDUCxZQUFZO3dCQUNaLGlCQUFpQjt3QkFDakIsdUJBQXVCO3dCQUN2QixXQUFXO3dCQUNYLGdCQUFnQjt3QkFDaEIsWUFBWSxDQUFDLE9BQU8sRUFBRTt3QkFDdEIsZUFBZTt3QkFDZiwyQkFBMkIsQ0FBQyxPQUFPLEVBQUU7d0JBQ3JDLGNBQWM7d0JBQ2QsYUFBYTt3QkFDYixTQUFTO3dCQUNULHFCQUFxQjt3QkFDckIsWUFBWTt3QkFDWixXQUFXO3FCQUNaO29CQUNELFNBQVMsRUFBRTt3QkFDVCxjQUFjO3dCQUNkLFFBQVE7cUJBQ1Q7b0JBQ0QsT0FBTyxFQUFFO3dCQUNMLG9CQUFvQjt3QkFDcEIseUJBQXlCO3dCQUN6QixnQ0FBZ0M7d0JBQ2hDLHNDQUFzQzt3QkFDdEMsa0JBQWtCO3dCQUNsQixzQkFBc0I7d0JBQ3RCLCtCQUErQjtxQkFDbEM7b0JBQ0QsU0FBUyxFQUFFLENBQUMsb0JBQW9CLENBQUM7aUJBQ2xDIiwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0IHsgQ29tbW9uTW9kdWxlLCBEYXRlUGlwZSB9IGZyb20gJ0Bhbmd1bGFyL2NvbW1vbic7XG5pbXBvcnQgeyBIdHRwQ2xpZW50TW9kdWxlIH0gZnJvbSAnQGFuZ3VsYXIvY29tbW9uL2h0dHAnO1xuaW1wb3J0IHsgTmdNb2R1bGUgfSBmcm9tICdAYW5ndWxhci9jb3JlJztcbmltcG9ydCB7IEZvcm1zTW9kdWxlIH0gZnJvbSAnQGFuZ3VsYXIvZm9ybXMnO1xuaW1wb3J0IHsgQnJvd3Nlck1vZHVsZSB9IGZyb20gJ0Bhbmd1bGFyL3BsYXRmb3JtLWJyb3dzZXInO1xuaW1wb3J0IHsgWFNpZ2h0c0NvcmVDb21wb25lbnQgfSBmcm9tICcuL3gtc2lnaHRzLWNvcmUuY29tcG9uZW50JztcblxuaW1wb3J0IHsgRHhQaXZvdEdyaWRNb2R1bGUgfSBmcm9tICdkZXZleHRyZW1lLWFuZ3VsYXInO1xuaW1wb3J0IHsgVG9hc3RyTW9kdWxlIH0gZnJvbSAnbmd4LXRvYXN0cic7XG5pbXBvcnQgeyBDaGFydHNNb2R1bGUgfSBmcm9tICduZzItY2hhcnRzJztcblxuaW1wb3J0IHtcbiAgTmdiTW9kYWxNb2R1bGUsXG4gIE5nYk1vZHVsZSxcbiAgTmdiQWN0aXZlTW9kYWwsXG59IGZyb20gJ0BuZy1ib290c3RyYXAvbmctYm9vdHN0cmFwJztcbmltcG9ydCB7IFRhYmxlTW9kdWxlIH0gZnJvbSAncHJpbWVuZy90YWJsZSc7XG5pbXBvcnQgeyBBbmd1bGFyUGl2b3RUYWJsZU1vZHVsZSB9IGZyb20gJ2FuZ3VsYXItcGl2b3QtdGFibGUnO1xuaW1wb3J0IHsgSGlnaGNoYXJ0c0NoYXJ0TW9kdWxlIH0gZnJvbSAnaGlnaGNoYXJ0cy1hbmd1bGFyJztcblxuaW1wb3J0IHsgTmdTZWxlY3QyTW9kdWxlIH0gZnJvbSAnbmctc2VsZWN0Mic7XG5pbXBvcnQgeyBOZ011bHRpU2VsZWN0RHJvcERvd25Nb2R1bGUgfSBmcm9tICduZy1tdWx0aXNlbGVjdC1kcm9wZG93bic7XG5pbXBvcnQgeyBYU2lnaHRzUHVibGljRGFzaGJvYXJkQ29tcG9uZW50IH0gZnJvbSAnLi9jb21wb25lbnRzL3gtc2lnaHRzLXB1YmxpYy1kYXNoYm9hcmQveC1zaWdodHMtcHVibGljLWRhc2hib2FyZC5jb21wb25lbnQnO1xuaW1wb3J0IHsgWFNpZ2h0c0Rhc2hib2FyZENvbXBvbmVudCB9IGZyb20gJy4vY29tcG9uZW50cy94LXNpZ2h0cy1kYXNoYm9hcmQveC1zaWdodHMtZGFzaGJvYXJkLmNvbXBvbmVudCc7XG5pbXBvcnQgeyBEYXRhUG9wdXBDb21wb25lbnQgfSBmcm9tICcuL2NvbXBvbmVudHMvZGF0YS1wb3B1cC9kYXRhLXBvcHVwLmNvbXBvbmVudCc7XG5pbXBvcnQgeyBYU2lnaHRzV2lkZ2V0Q29tcG9uZW50IH0gZnJvbSAnLi9jb21wb25lbnRzL3gtc2lnaHRzLXdpZGdldC94LXNpZ2h0cy13aWRnZXQuY29tcG9uZW50JztcbmltcG9ydCB7IFhTaWdodHNCYWNrZW5kRGFzaGJvYXJkQ29tcG9uZW50IH0gZnJvbSAnLi9jb21wb25lbnRzL3gtc2lnaHRzLWJhY2tlbmQtZGFzaGJvYXJkL3gtc2lnaHRzLWJhY2tlbmQtZGFzaGJvYXJkLmNvbXBvbmVudCc7XG5pbXBvcnQgeyBYU2lnaHRzQmFja2VuZFB1YmxpY0Rhc2hib2FyZENvbXBvbmVudCB9IGZyb20gJy4vY29tcG9uZW50cy94LXNpZ2h0cy1iYWNrZW5kLXB1YmxpYy1kYXNoYm9hcmQveC1zaWdodHMtYmFja2VuZC1wdWJsaWMtZGFzaGJvYXJkLmNvbXBvbmVudCc7XG5cbkBOZ01vZHVsZSh7XG4gIGRlY2xhcmF0aW9uczogW1xuICAgIFhTaWdodHNDb3JlQ29tcG9uZW50LCBcbiAgICBEYXRhUG9wdXBDb21wb25lbnQsXG4gICAgWFNpZ2h0c1B1YmxpY0Rhc2hib2FyZENvbXBvbmVudCxcbiAgICBYU2lnaHRzRGFzaGJvYXJkQ29tcG9uZW50LFxuICAgIFhTaWdodHNXaWRnZXRDb21wb25lbnQsXG4gICAgWFNpZ2h0c0JhY2tlbmREYXNoYm9hcmRDb21wb25lbnQsXG4gICAgWFNpZ2h0c0JhY2tlbmRQdWJsaWNEYXNoYm9hcmRDb21wb25lbnRcbiAgXSxcbiAgaW1wb3J0czogW1xuICAgIENvbW1vbk1vZHVsZSxcbiAgICBEeFBpdm90R3JpZE1vZHVsZSxcbiAgICBBbmd1bGFyUGl2b3RUYWJsZU1vZHVsZSxcbiAgICBUYWJsZU1vZHVsZSxcbiAgICBIdHRwQ2xpZW50TW9kdWxlLFxuICAgIFRvYXN0ck1vZHVsZS5mb3JSb290KCksXG4gICAgTmdTZWxlY3QyTW9kdWxlLFxuICAgIE5nTXVsdGlTZWxlY3REcm9wRG93bk1vZHVsZS5mb3JSb290KCksXG4gICAgTmdiTW9kYWxNb2R1bGUsXG4gICAgQnJvd3Nlck1vZHVsZSxcbiAgICBOZ2JNb2R1bGUsXG4gICAgSGlnaGNoYXJ0c0NoYXJ0TW9kdWxlLFxuICAgIENoYXJ0c01vZHVsZSxcbiAgICBGb3Jtc01vZHVsZVxuICBdLFxuICBwcm92aWRlcnM6IFtcbiAgICBOZ2JBY3RpdmVNb2RhbCxcbiAgICBEYXRlUGlwZVxuICBdLFxuICBleHBvcnRzOiBbXG4gICAgICBYU2lnaHRzQ29yZUNvbXBvbmVudCxcbiAgICAgIFhTaWdodHNEYXNoYm9hcmRDb21wb25lbnQsXG4gICAgICBYU2lnaHRzQmFja2VuZERhc2hib2FyZENvbXBvbmVudCxcbiAgICAgIFhTaWdodHNCYWNrZW5kUHVibGljRGFzaGJvYXJkQ29tcG9uZW50LFxuICAgICAgRGF0YVBvcHVwQ29tcG9uZW50LFxuICAgICAgWFNpZ2h0c1dpZGdldENvbXBvbmVudCxcbiAgICAgIFhTaWdodHNQdWJsaWNEYXNoYm9hcmRDb21wb25lbnRcbiAgXSxcbiAgYm9vdHN0cmFwOiBbWFNpZ2h0c0NvcmVDb21wb25lbnRdXG59KVxuZXhwb3J0IGNsYXNzIFhTaWdodHNDb3JlTW9kdWxlIHsgfVxuIl19