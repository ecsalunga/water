import { Component, OnInit } from '@angular/core';
import { WaterService } from '../water.service';
import { expenses } from '../models/expenses';
import { ExpensesCategory } from '../models/expenses-category';
import { FormControl } from '@angular/forms';
import { Observable } from 'rxjs';
import { map, startWith } from 'rxjs/operators';

@Component({
  selector: 'app-expenses',
  templateUrl: './expenses.component.html',
  styleUrls: ['./expenses.component.scss']
})
export class ExpensesComponent implements OnInit {
  role: string = "";
  selected: number;
  selectedDate = new Date();
  display: string = 'list';
  displayedColumns: string[] = ['name', 'amount', 'key'];
  item: expenses;
  items: Array<expenses>;
  categories: Array<ExpensesCategory>;

  nameControl = new FormControl();
  nameFilteredOptions: Observable<string[]>;
  nameOptions: string[] = [];

  constructor(private service: WaterService) { }

  ngOnInit(): void {
    this.role = this.service.current_user.role;
    this.selected = this.service.action_day;
    this.loadData();
  }

  loadData() {
    this.service.db.list<expenses>('expenses/items', ref => ref.orderByChild('action_day').equalTo(this.selected)).snapshotChanges().subscribe(records => {
      this.items = new Array<expenses>();
      records.forEach(item => {
        let i = item.payload.val();
        i.key = item.key;
        this.items.push(i);
      });
    });
  }

  dateSelected() {
    this.selected = this.service.getActionDay(this.selectedDate);
    this.loadData();
  }

  add() {
    this.setCommon();
    this.item = new expenses();
    this.item.category = "Others";
  }

  cancel() {
    this.display = 'list';
  }

  edit(item: expenses) {
    this.setCommon();
    this.item = Object.assign({}, item);
  }

  private setCommon() {
    this.display = 'form';
    this.categories = this.service.expenses_categories;
    this.setNameOptions();
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
    item.action_day = this.selected;

    if (item.key == null || item.key == "")
      this.service.db.list('expenses/items').push(item);
    else
      this.service.db.object('expenses/items/' + item.key).update(item);

    this.display = 'list';
  }

  private setNameOptions() {
    this.nameOptions = [];
    this.service.expneses_items.forEach(item => {
      this.nameOptions.push(item.name);
    });

    this.nameOptions = this.nameOptions.sort((a, b) => a > b ? 1 : -1);
    this.nameFilteredOptions = this.nameControl.valueChanges.pipe(
      startWith(''),
      map(value => this._filterName(value))
    );
  }

  private _filterName(value: string): string[] {
    const filterValue = value.toLowerCase();
    return this.nameOptions.filter(option => option.toLowerCase().indexOf(filterValue) === 0);
  }
}
