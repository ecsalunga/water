import { SalesOther } from './sales-other';

export class sales {
    constructor() {
        this.others = new Array<SalesOther>();
    }

    key: string;
    client_key: string;
    name: string;
    block: string;
    lot: string;
    address: string;
    contact: string;
    slim: number;
    round: number;
    price: number;
    amount: number;
    remarks: string;
    status: string;
    promo: number;
    noQR: boolean;
    isSelected: boolean;
    counted: boolean;
    others: Array<SalesOther>;
    action_day: number;
    action_date: number;
}