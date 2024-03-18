export declare enum DataType {
    STRING = "string",
    NUMBER = "number",
    DATE = "date",
    TIME = "time"
}
export declare enum DateFormat {
    DD_MM_YYYY_hh_mm_ss_a = "DD-MM-YYYY hh:mm:ss a",
    DD_MM_YYYY_HH_mm_ss = "DD-MM-YYYY HH:mm:ss",
    MM_DD_YYYY_hh_mm_ss_a = "MM-DD-YYYY hh:mm:ss a",
    YYYY_MM_DD_hh_mm_ss_a = "YYYY-MM-DD hh:mm:ss a",
    DD_s_MM_s_YYYY_hh_mm_ss_a = "DD/MM/YYYY hh:mm:ss a",
    MM_s_DD_s_YYYY_hh_mm_ss_a = "MM/DD/YYYY hh:mm:ss a",
    YYYY_s_MM_s_DD_hh_mm_ss_a = "YYYY/MM/DD hh:mm:ss a",
    DD_MM_YYYY = "DD-MM-YYYY",
    MM_DD_YYYY = "MM-DD-YYYY",
    YYYY_MM_DD = "YYYY-MM-DD",
    DD_s_MM_s_YYYY = "DD/MM/YYYY",
    MM_s_DD_s_YYYY = "MM/DD/YYYY",
    YYYY_s_MM_s_DD = "YYYY/MM/DD"
}
export declare enum TimeFormat {
    HH_mm_ss = "HH:mm:ss",
    HH_mm = "HH:mm",
    hh_mm_ss_a = "hh:mm:ss a",
    hh_mm_a = "hh:mm a"
}
export interface DataFormat {
    name: string;
    type: DataType;
    format: TimeFormat | DateFormat | string;
}
