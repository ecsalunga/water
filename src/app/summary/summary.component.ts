import { Component, OnInit } from '@angular/core';
import { WaterService } from '../water.service';

import { others } from '../models/sales-others';
import { sales } from '../models/sales-water';
import { expenses } from '../models/expenses';

@Component({
  selector: 'app-summary',
  templateUrl: './summary.component.html',
  styleUrls: ['./summary.component.scss']
})
export class SummaryComponent implements OnInit {
  selected: number;
  selectedDate = new Date();
  summary = { expenses: 0, water: 0, others: 0, diff: 0 };

  constructor(private service: WaterService) {}

  ngOnInit(): void {
    this.selected = this.service.Action_Day;
    this.loadData();
  }

  dateSelected() {
    console.log(this.selectedDate);
    this.selected =  this.service.getActionDay(this.selectedDate);
    this.loadData();
  }

  loadData() {
    this.summary = { expenses: 0, water: 0, others: 0, diff: 0 };

    this.service.db.list<sales>('sales/water/items', ref => ref.orderByChild('action_day').equalTo(this.selected)).snapshotChanges().subscribe(records => {
      records.forEach(item => {
        let i = item.payload.val();
        this.summary.water += i.amount;
      });

      this.computeDiff();
    });

    this.service.db.list<others>('sales/others/items', ref => ref.orderByChild('action_day').equalTo(this.selected)).snapshotChanges().subscribe(records => {
      records.forEach(item => {
        let i = item.payload.val();
        this.summary.others += i.amount;
      });
      
      this.computeDiff();
    });

    this.service.db.list<expenses>('expenses/items', ref => ref.orderByChild('action_day').equalTo(this.selected)).snapshotChanges().subscribe(records => {
      records.forEach(item => {
        let i = item.payload.val();
        this.summary.expenses += i.amount;
      });

      this.computeDiff();
    });
  }

  computeDiff() {
    this.summary.diff = (this.summary.water + this.summary.others) - this.summary.expenses;
  }
}
