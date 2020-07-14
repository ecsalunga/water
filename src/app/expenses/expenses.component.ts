import { Component, OnInit } from '@angular/core';
import { WaterService } from '../water.service';
import { expenses } from '../models/expenses';
import { category } from '../models/category';

@Component({
  selector: 'app-expenses',
  templateUrl: './expenses.component.html',
  styleUrls: ['./expenses.component.scss']
})
export class ExpensesComponent implements OnInit {
  display: string = 'list';
  displayedColumns: string[] = ['name', 'category', 'amount', 'key'];
  item: expenses;
  items: Array<expenses>;
  categories: Array<category>;

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
    this.categories = this.service.expenses_categories;
    this.item = new expenses();
    this.item.category = "Others";
  }

  cancel() {
    this.display = 'list';
  }

  edit(item: expenses) {
    this.display = 'form';
    this.categories = this.service.expenses_categories;
    this.item = Object.assign({}, item);
  }

  toDate(action_date: number): Date {
    return this.service.actionDayToDate(action_date);
  }

  save() {
    let item = new expenses();
    item.key = this.item.key ?? "";
    item.name = this.item.name;
    item.category = this.item.category;
    item.amount = this.item.amount;
    item.remarks = this.item.remarks ?? "";
    item.action_date = this.service.actionDate();
    item.action_day =  this.service.Action_Day;

    if(item.key == null || item.key == "")
      this.service.db.list('expenses/items').push(item);
    else
      this.service.db.object('expenses/items/' + item.key).update(item);

    this.display = 'list';
  }
}
