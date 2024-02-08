import { OnInit } from '@angular/core';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import { DataService } from '../../services/data.service';
import * as i0 from "@angular/core";
export declare class DataPopupComponent implements OnInit {
    private activeModal;
    private dataService;
    keys: any;
    dataSource: any;
    columnToView: any[];
    constructor(activeModal: NgbActiveModal, dataService: DataService);
    ngOnInit(): void;
    closeModal(): void;
    exportExcel(): void;
    saveAsExcelFile(buffer: any, fileName: any): void;
    static ɵfac: i0.ɵɵFactoryDeclaration<DataPopupComponent, never>;
    static ɵcmp: i0.ɵɵComponentDeclaration<DataPopupComponent, "lib-data-popup", never, {}, {}, never, never>;
}
