export class StatusBar {
    label: string;
    status: string;
    show: boolean;

    slim: number;
    round: number;
    amount: number;
  
    selectedSlim: number;
    selectedRound: number;
    selectedAmount: number;

    constructor() {
        this.label = 'Total';
        this.status = 'none';
        this.show = false;
        
        this.slim = 0;
        this.round = 0;
        this.amount = 0;

        this.selectedSlim = 0;
        this.selectedRound = 0;
        this.selectedAmount = 0;
    }
}