import { stat } from "fs";

export class WaterSalesStatus {
    label: string;
    status: string;
    slim: number;
    round: number;

    constructor(label: string, status: string) {
        this.label = label;
        this.status = status;
        
        this.slim = 0;
        this.round = 0;
    }
}