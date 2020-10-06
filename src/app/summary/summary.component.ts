import { Component, OnInit } from '@angular/core';
import { WaterService } from '../water.service';
import { WaterSalesStatus } from '../models/sales-water-status';

import { others } from '../models/sales-others';
import { sales } from '../models/sales-water';
import { expenses } from '../models/expenses';
import { Command } from '../models/command';

@Component({
  selector: 'app-summary',
  templateUrl: './summary.component.html',
  styleUrls: ['./summary.component.scss']
})
export class SummaryComponent implements OnInit {
  IsLockDisplayed: boolean = false;
  IsOpenDaysShowed: boolean = false;
  openDays: Array<number>;
  date_locked: string = 'lock';
  LockColor: string = 'warn';
  role: string = "";
  selected: number;
  selectedDate = new Date();
  summary = { expenses: 0, water: 0, others: 0, diff: 0 };
  status: { 'Pending': WaterSalesStatus, 'Delivered': WaterSalesStatus, 'Free': WaterSalesStatus, 'Paid': WaterSalesStatus };

  constructor(private service: WaterService) { }

  ngOnInit(): void {
    this.role = this.service.current_user.role;
    this.selected = this.service.action_day;
    // status
    this.status = { 
      Pending: new WaterSalesStatus('Pending', this.service.order_status.All),
      Delivered: new WaterSalesStatus('Delivered', this.service.order_status.Delivered),
      Free: new WaterSalesStatus('Free', this.service.order_status.All),
      Paid: new WaterSalesStatus('Paid', this.service.order_status.Paid)
    };
    this.loadData();
    this.loadCommonSettingsData();
    this.service.Changed.subscribe((cmd: Command) => {
      if(cmd.type == this.service.command_types.Loader && cmd.data == 'settings-common')
        this.loadCommonSettingsData();
    });
  }

  private loadCommonSettingsData() {
    this.setLock();
    this.loadOpenDays();
    this.setIsLockDisplayed();
  }

  GetDate(action_day: number): Date {
    return this.service.actionDayToDate(action_day);
  }

  SetDate() {
    this.loadData();
    this.loadCommonSettingsData();
  }

  private loadOpenDays() {
    this.openDays = this.service.GetOpenDays();
    this.IsOpenDaysShowed = this.service.IsShowOpenDays();
  }

  dateSelected() {
    this.selected = this.service.getActionDay(this.selectedDate);
    this.loadData();
    this.setLock();
  }

  toggleLock() {
    let isLocked = this.service.ToggleLock(this.selected);
    this.date_locked = (isLocked ? 'lock' : 'lock_open');
    
    if(this.role == this.service.user_roles.Monitor) {
      this.IsLockDisplayed = !this.service.IsLocked(this.selected);
      this.selected = this.service.action_day;
      this.loadData();
    }
  }

  setIsLockDisplayed() {
    this.IsLockDisplayed = false;
    if(this.role == this.service.user_roles.Admin)
      this.IsLockDisplayed = true;
    else if(this.role == this.service.user_roles.Monitor)
      this.IsLockDisplayed = !this.service.IsLocked(this.selected);
  }

  setLock() {
    let isLocked = this.service.IsLocked(this.selected);
    this.date_locked = (isLocked ? 'lock' : 'lock_open');
    this.LockColor = (isLocked ? 'warn' : 'primary');
  }

  countPromo(item: sales) {
    if(item.promo > 0) {
      if(item.slim > 0)
        this.status.Free.slim += item.promo;
      else
        this.status.Free.round += item.promo;
    }
  }

  loadData() {
    this.service.db.list<sales>('sales/water/items', ref => ref.orderByChild('action_day').equalTo(this.selected)).snapshotChanges().subscribe(records => {
      this.summary.water = 0;
      
      // status
      this.status = { 
        Pending: new WaterSalesStatus('Pending', this.service.order_status.All),
        Delivered: new WaterSalesStatus('Delivered', this.service.order_status.Delivered),
        Free: new WaterSalesStatus('Free', this.service.order_status.All),
        Paid: new WaterSalesStatus('Paid', this.service.order_status.Paid)
      };

      records.forEach(item => {
        let i = item.payload.val();
        if(i.status == this.service.order_status.Paid) {
          this.summary.water += i.amount;

          this.status.Paid.slim += i.slim;
          this.status.Paid.round += i.round;

          this.countPromo(i);
        }
        else if(i.status == this.service.order_status.Delivered) {
          this.status.Delivered.slim += i.slim;
          this.status.Delivered.round += i.round;

          this.countPromo(i);
        }
        else if(i.status != this.service.order_status.Cancelled) {
          this.status.Pending.slim += i.slim;
          this.status.Pending.round += i.round;

          this.countPromo(i);
        }
      });

      this.computeDiff();
    });

    this.service.db.list<others>('sales/others/items', ref => ref.orderByChild('action_day').equalTo(this.selected)).snapshotChanges().subscribe(records => {
      this.summary.others = 0;

      records.forEach(item => {
        let i = item.payload.val();
        this.summary.others += i.amount;
      });

      this.computeDiff();
    });

    this.service.db.list<expenses>('expenses/items', ref => ref.orderByChild('action_day').equalTo(this.selected)).snapshotChanges().subscribe(records => {
      this.summary.expenses = 0;

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
