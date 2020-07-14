import { Component, OnInit } from '@angular/core';
import { WaterService } from '../water.service';
import { expenses } from '../models/expenses';

@Component({
  selector: 'app-expenses',
  templateUrl: './expenses.component.html',
  styleUrls: ['./expenses.component.scss']
})
export class ExpensesComponent implements OnInit {
  display: string = 'list';
  displayedColumns: string[] = ['name', 'category', 'amount', 'remarks', 'action_date'];
  item: expenses;
  items: Array<expenses>;

  constructor(private service: WaterService) {}

  ngOnInit(): void {
    this.service.db.list<expenses>('expenses/items', ref => ref.orderByChild('action_day').equalTo(this.service.Action_Day)).snapshotChanges().subscribe(records => {
      this.items = new Array<expenses>();
      records.forEach(item => {
        let i = item.payload.val();
        i.key = item.key;
        this.items.push(i);
      });
    });
  }

  add() {
    this.display = 'form';
    this.item = new expenses();
  }

  cancel() {
    this.display = 'list';
  }

  toDate(action_date: number): Date {
    return this.service.actionDayToDate(action_date);
  }

  save() {
    let item = new expenses();
    item.name = this.item.name;
    item.category = this.item.category;
    item.amount = this.item.amount;
    item.remarks = this.item.remarks ?? "";
    item.action_date = this.service.actionDate();
    item.action_day =  this.service.Action_Day;
    this.service.db.list('expenses/items').push(item);
    this.display = 'list';
  }
}
