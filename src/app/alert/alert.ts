import { ClrAlertType } from "./clr-alert-type";


export class AlertDetails {
    type: ClrAlertType;
    message: string;
    closable?: boolean = true;
    duration?: number = 0;
}

export const DEFAULT_ALERT_SUCCESS_DURATION = 2000;
export const DEFAULT_ALERT_ERROR_DURATION = 3000;
export const DEFAULT_ALERT_WARNING_DURATION = 3000;