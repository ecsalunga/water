import { Component, OnInit } from '@angular/core';
import { WaterService } from '../water.service';
import { sales } from '../models/sales-water';

@Component({
  selector: 'app-sales-water',
  templateUrl: './sales-water.component.html',
  styleUrls: ['./sales-water.component.scss']
})
export class SalesWaterComponent implements OnInit {
  display: string = 'list';
  displayedColumns: string[] = ['address', 'round', 'slim', 'status'];
  item: sales;
  items: Array<sales>;
  filter:string = 'all';
  constructor(private service: WaterService) {}

  ngOnInit(): void {
    this.loadData();
  }

  loadData() {
    this.service.db.list<sales>('sales/water/items', ref => ref.orderByChild('action_day').equalTo(this.service.action_day)).snapshotChanges().subscribe(records => {
      this.items = new Array<sales>();
      records.forEach(item => {
        let i = item.payload.val();
        i.key = item.key;
        if(this.filter == 'all' || i.status == this.filter)
          this.items.push(i);
      });
    });
  }

  getIcon(status: string): string {
    let icon = '';

    if(status == 'new')
      icon = 'fiber_new';
    else if(status == 'delivery')
      icon = 'two_wheeler';
    else if(status == 'delivered')
      icon = 'check';
    else if(status == 'cancelled')
      icon = 'cancel';
      
    return icon;
  }

  setStatus(status: string, item: sales) {
    item.status = status;
    this.service.db.object('sales/water/items/' + item.key).update(item);
  }

  add() {
    this.display = 'form';
    this.item = new sales();
    this.item.status = "new";
  }

  edit(item: sales) {
    this.display = 'form';
    this.item = Object.assign({}, item);
  }

  cancel() {
    this.display = 'list';
  }

  toDate(action_date: number): Date {
    return this.service.actionDayToDate(action_date);
  }

  show(status: string) {
    this.filter = status;
    this.loadData();
  }

  save() {
    let item = new sales();
    item.key = this.item.key ?? "";
    item.address = this.item.address;
    item.contact = this.item.contact;
    item.amount = this.item.amount;
    item.round = this.item.round;
    item.slim = this.item.slim;
    item.status = this.item.status;
    item.remarks = this.item.remarks ?? "";
    item.action_date = this.service.actionDate();
    item.action_day =  this.service.action_day;

    if(item.key == null || item.key == "")
      this.service.db.list('sales/water/items').push(item);
    else
      this.service.db.object('sales/water/items/' + item.key).update(item);
      
    this.display = 'list';
  }
}
