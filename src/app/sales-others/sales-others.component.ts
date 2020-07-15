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
  displayedColumns: string[] = ['address', 'name', 'amount', 'key'];
  item: others;
  items: Array<others>;

  constructor(private service: WaterService) {}

  ngOnInit(): void {
    this.service.db.list<others>('sales/others/items', ref => ref.orderByChild('action_day').equalTo(this.service.action_day)).snapshotChanges().subscribe(records => {
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

  edit(item: others) {
    this.display = 'form';
    this.item = Object.assign({}, item);
  }

  save() {
    let item = new others();
    item.key = this.item.key ?? "";
    item.name = this.item.name;
    item.address = this.item.address;
    item.contact = this.item.contact;
    item.amount = this.item.amount;
    item.remarks = this.item.remarks ?? "";
    item.action_date = this.service.actionDate();
    item.action_day =  this.service.action_day;

    if(item.key == null || item.key == "")
      this.service.db.list('sales/others/items').push(item);
    else
      this.service.db.object('sales/others/items/' + item.key).update(item);

    this.display = 'list';
  }
}
