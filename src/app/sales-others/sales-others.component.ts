import { Component, OnInit } from '@angular/core';
import { WaterService } from '../water.service';
import { others } from '../models/sales-others';

@Component({
  selector: 'app-sales-others',
  templateUrl: './sales-others.component.html',
  styleUrls: ['./sales-others.component.scss']
})
export class SalesOthersComponent implements OnInit {
  display: string = 'list';
  displayedColumns: string[] = ['address', 'contact', 'name', 'amount', 'remarks', 'action_date'];
  item: others;
  items: Array<others>;

  constructor(private service: WaterService) {}

  ngOnInit(): void {
    this.service.db.list<others>('sales/others/items', ref => ref.orderByChild('action_day').equalTo(this.service.Action_Day)).snapshotChanges().subscribe(records => {
      this.items = new Array<others>();
      records.forEach(item => {
        let i = item.payload.val();
        i.key = item.key;
        this.items.push(i);
      });
    });
  }

  add() {
    this.display = 'form';
    this.item = new others();
  }

  cancel() {
    this.display = 'list';
  }

  toDate(action_date: number): Date {
    return this.service.actionDayToDate(action_date);
  }

  save() {
    let item = new others();
    item.name = this.item.name;
    item.address = this.item.address;
    item.contact = this.item.contact;
    item.amount = this.item.amount;
    item.remarks = this.item.remarks ?? "";
    item.action_date = this.service.actionDate();
    item.action_day =  this.service.Action_Day;

    this.service.db.list('sales/others/items').push(item);
    this.display = 'list';
  }
}
