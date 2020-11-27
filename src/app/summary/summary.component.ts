import { Component, OnInit } from '@angular/core';
import { WaterService } from '../water.service';
import { WaterSalesStatus } from '../models/sales-water-status';

import { sales } from '../models/sales-water';
import { expenses } from '../models/expenses';
import { Command } from '../models/command';
import { Daily } from '../models/daily';

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
  item: Daily;
  isLocked: boolean = true;
  imageUrl: string;
  showImage: boolean = false;
  summary = { expenses: 0, water: 0, others: 0, diff: 0 };
  status: { 'Pending': WaterSalesStatus, 'Estimated': WaterSalesStatus, 'Delivered': WaterSalesStatus, 'Free': WaterSalesStatus, 'Paid': WaterSalesStatus };

  constructor(private service: WaterService) { }

  ngOnInit(): void {
    this.role = this.service.current_user.role;
    this.selected = this.service.action_day;
    this.imageUrl = this.service.defaultImagePath;

    this.resetStatus();
    this.loadData();
    this.loadCommonSettingsData();
    this.service.Changed.subscribe((cmd: Command) => {
      if(cmd.type == this.service.command_types.Loader && cmd.data == 'settings-common')
        this.loadCommonSettingsData();
    });
  }

  private resetStatus() {
    this.status = { 
      Pending: new WaterSalesStatus('Pending', this.service.order_status.All),
      Estimated: new WaterSalesStatus('Estimated', this.service.order_status.All),
      Delivered: new WaterSalesStatus('Delivered', this.service.order_status.Delivered),
      Free: new WaterSalesStatus('Free', this.service.order_status.All),
      Paid: new WaterSalesStatus('Paid', this.service.order_status.Paid)
    };
  }

  private loadCommonSettingsData() {
    this.setLock();
    this.loadOpenDays();
    this.setIsLockDisplayed();
  }

  hideImage() {
    this.showImage = false;
  }

  displayImage(imageType: string) {
    if(imageType == 'TDS') {
      this.imageUrl = this.item.tdsPath;
      this.showImage = true;
    }
    else {
      this.imageUrl = this.item.meterPath;
      this.showImage = true;
    }

    window.scroll(0,0);
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
    this.isLocked = this.service.ToggleLock(this.selected);
    this.date_locked = (this.isLocked ? 'lock' : 'lock_open');
    
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
    this.isLocked = this.service.IsLocked(this.selected);
    this.date_locked = (this.isLocked ? 'lock' : 'lock_open');
    this.LockColor = (this.isLocked ? 'warn' : 'primary');
  }

  countPromo(item: sales) {
    if(item.promo > 0) {
      if(item.slim > 0)
        this.status.Free.slim += item.promo;
      else
        this.status.Free.round += item.promo;
    }
  }

  countEstimated(item: sales) {
    this.service.clients.forEach(client => {
      if(client.key == item.client_key) {
        let total = client.counter + item.slim + item.round;
        if(total > 10)
          this.status.Estimated.slim += (total / 11);
      }
    });
  }

  loadData() {
    this.loadDaily();
    
    this.service.db.list<sales>('sales/water/items', ref => ref.orderByChild('action_day').equalTo(this.selected)).snapshotChanges().subscribe(records => {
      this.summary.water = 0;
      this.summary.others = 0;
      this.resetStatus();

      records.forEach(item => {
        let i = item.payload.val();
        if(i.status == this.service.order_status.Paid) {
          this.status.Paid.slim += i.slim;
          this.status.Paid.round += i.round;

          this.summary.water += i.amount;
          if(i.others != null) {
            i.others.forEach(other => {
              this.summary.others += (other.price * other.quantity);
            });
          }

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

          this.countEstimated(i);
        }
      });

      this.status.Paid.slim -= this.status.Free.slim;
      this.status.Paid.round -= this.status.Free.round;

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

  loadDaily() {
    this.service.db.list<Daily>('daily/items', ref => ref.orderByChild('action_day').equalTo(this.selected)).snapshotChanges().subscribe(records => {
      records.forEach(item => {
        this.item = item.payload.val();
        this.item.key = item.key;
      });
    });
  }

  computeDiff() {
    this.summary.diff = (this.summary.water + this.summary.others) - this.summary.expenses;
  }
}
