export class Cache {
    key: string;
    name: string;
    group: string;
    clients: number;
    expenses_categories: number;
    expenses_items: number;
    other_sales_items: number;
    constructor() {
        this.group = 'cache';
        this.name = 'cache';
        this.clients = -1;
        this.expenses_categories = -1;
        this.expenses_items = -1;
        this.other_sales_items = -1;
    }
}