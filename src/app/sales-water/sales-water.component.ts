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
  displayedColumns: string[] = ['address', 'contact', 'round', 'slim', 'amount', 'remarks', 'action_date'];
  item: sales;
  items: Array<sales>;

  constructor(private service: WaterService) {}

  ngOnInit(): void {
    this.service.db.list<sales>('sales/water/items', ref => ref.orderByChild('action_day').equalTo(this.service.Action_Day)).snapshotChanges().subscribe(records => {
      this.items = new Array<sales>();
      records.forEach(item => {
        let i = item.payload.val();
        i.key = item.key;
        this.items.push(i);
      });
    });
  }

  add() {
    this.display = 'form';
    this.item = new sales();
  }

  cancel() {
    this.display = 'list';
  }

  toDate(action_date: number): Date {
    return this.service.actionDayToDate(action_date);
  }

  save() {
    let item = new sales();
    item.address = this.item.address;
    item.contact = this.item.contact;
    item.amount = this.item.amount;
    item.round = this.item.round;
    item.slim = this.item.slim;
    item.remarks = this.item.remarks ?? "";
    item.action_date = this.service.actionDate();
    item.action_day =  this.service.Action_Day;

    this.service.db.list('sales/water/items').push(item);
    this.display = 'list';
  }
}
