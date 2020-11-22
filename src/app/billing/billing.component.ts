import { Component, OnInit } from '@angular/core';
import { WaterService } from '../water.service';
import { clients } from '../models/clients';
import { sales } from '../models/sales-water';
import { BillItem } from '../models/bill-item';
import { Command } from '../models/command';
import { FormControl } from '@angular/forms';
import { Observable } from 'rxjs';
import { map, startWith } from 'rxjs/operators';

@Component({
  selector: 'app-billing',
  templateUrl: './billing.component.html',
  styleUrls: ['./billing.component.scss']
})
export class BillingComponent implements OnInit {
  item: clients = new clients();
  itemSales: Array<sales>;
  itemPrevious: Array<sales>
  billItems = Array<BillItem>();
  clientId: string;
  counter: number;
  currentCount = 0;
  promo: number;
  slim = 0;
  round = 0;
  othersTotal = 0;
  total = 0;
  hasItem: boolean = false;
  hasPrevious: boolean = false;
  pickupSale = new sales();
  currentStatus = 'none';
  image = 'assets/gifs/buy.gif';
  message = "";
  header = "Order";
  isLogin = false;
  showInput: boolean = false;
  pickupLabel = 'Order';
  percent = 1;
  isMapping: boolean = false;
  items = new Array<string>();
  mapping: string = "";
  address: string = "";

  addressControl = new FormControl();
  addressFilteredOptions: Observable<string[]>;
  addressOptions: string[] = [];

  constructor(private service: WaterService) { }

  ngOnInit(): void {
    let path = window.location.href.split('billing');
    if (path.length > 1 && path[1].length > 0)
      this.clientId = path[1].replace("/", "");

    this.service.Changed.subscribe((cmd: Command) => {
      if (cmd.type == this.service.command_types.Loader && cmd.data == 'clients')
        this.loadClient();
    });
  }

  updateAddress() {
    this.service.clients.forEach(item => {
      if(this.mapping == item.address)
       this.address = item.address;
    });
  }

  link() {
    if(this.mapping != "") {
      this.service.clients.forEach(item => {
        if(this.address == item.address) {
          item.qrCode = this.clientId;
          this.service.db.object('clients/items/' + item.key).update(item);
          this.service.Message("Client linked.");
          this.address = "";
          this.loadClient();
        }
      });
    }
  }

  private setAddressOptions() {
    this.addressOptions = [];
    this.service.clients.forEach(item => {
      if(item.address.trim() != "")
        this.addressOptions.push(item.address.trim());
    });

    this.addressOptions = this.addressOptions.sort((a, b) => a > b ? 1 : -1);
    this.addressFilteredOptions = this.addressControl.valueChanges.pipe(
      startWith(''),
      map(value => this._filterAddress(value))
    );
  }

  private _filterAddress(value: string): string[] {
    let filterValue = value.toLowerCase();
    return this.addressOptions.filter(option => option.toLowerCase().indexOf(filterValue) !== -1);
  }

  loadClient() {
    let found = false;
    this.isMapping = false;
    
    this.service.clients.forEach(item => {
      this.items.push(item.address);

      if (item.key == this.clientId || item.qrCode == this.clientId) {
        found = true;
        this.item = item;
        this.currentCount = this.item.counter ?? 0;

        this.pickupSale.client_key = this.item.key;
        this.pickupSale.name = this.item.name;
        this.pickupSale.block = this.item.block;
        this.pickupSale.lot = this.item.lot;
        this.pickupSale.address = this.item.address;
        this.pickupSale.contact = this.item.contact;
        this.pickupSale.slim = this.item.slim;
        this.pickupSale.round = this.item.round;
        this.pickupSale.price = this.item.price;
        this.pickupSale.counted = false;
        this.pickupSale.status = this.service.order_status.Pickup;
        this.pickupSale.remarks = this.item.remarks;
        this.pickupSale.isSelected = false;

        let per = ((this.currentCount / 10) * 100);
        this.percent = (per > 100) ? 100 : per;

        this.loadData();
      }
    });

    if(!found && this.service.current_user.isLogin) {
      this.isMapping = true;
      this.setAddressOptions();
    }
  }

  loadData() {
    this.service.db.list<sales>('sales/water/items', ref => ref.orderByChild('client_key').equalTo(this.clientId)).snapshotChanges().subscribe(records => {
      this.slim = 0;
      this.round = 0;
      this.promo = 0;
      this.othersTotal = 0;
      this.counter = this.currentCount;

      this.itemSales = new Array<sales>();
      this.itemPrevious = new Array<sales>();
      this.billItems = new Array<BillItem>();

      this.currentStatus = this.service.order_status.None;
      this.hasPrevious = false;

      records.forEach(item => {
        let i = item.payload.val();
        i.key = item.key;
        if (i.status == this.service.order_status.Delivery && !i.counted && i.action_day == this.service.action_day) {
          this.slim += i.slim;
          this.round += i.round;

          i.promo = 0;
          for (let x = 0; x < i.slim + i.round; x++) {
            this.counter++;

            while (this.counter > 10) {
              this.counter = this.counter - 11;
              this.promo += 1;
              i.promo += 1;
            }
          }

          // remove promo
          if (this.item.noPromo) {
            this.promo = 0;
            i.promo = 0;
          }

          if (i.promo > 0)
            i.amount = i.amount - (i.promo * i.price);

          if (i.others != null) {
            i.others.forEach(other => {
              let bill = new BillItem();
              bill.name = other.name;
              bill.quantity = other.quantity
              bill.amount = (other.price * other.quantity);
              this.othersTotal += bill.amount;
              this.billItems.push(bill);
            });
          }

          this.itemSales.push(i);
        }
        else if (i.status != this.service.order_status.Delivery
          && i.status != this.service.order_status.Paid
          && i.status != this.service.order_status.Cancelled
          && !i.counted && i.action_day == this.service.action_day) {
          this.currentStatus = i.status;
          this.pickupSale = i;
        }
        else if (i.counted)
          this.itemPrevious.push(i);
      });

      if (this.itemPrevious.length > 0 && this.service.current_user.role == this.service.user_roles.Admin) {
        this.itemPrevious = this.itemPrevious.sort((a, b) => a.action_date > b.action_date ? -1 : 1);
        if (this.itemPrevious.length > 10)
          this.itemPrevious = this.itemPrevious.slice(0, 10);

        this.hasPrevious = true;
      }

      this.compute();
    });
  }

  pickup() {
    this.pickupSale.key = this.pickupSale.key ?? "";
    this.pickupSale.slim = this.pickupSale.slim ?? 0;
    this.pickupSale.round = this.pickupSale.round ?? 0;
    let total = (this.pickupSale.slim + this.pickupSale.round);

    if (total > 0 && this.pickupSale.slim >= 0 && this.pickupSale.round >= 0) {
      this.pickupSale.action_date = this.service.actionDate();
      this.pickupSale.action_day = this.service.action_day;
      this.pickupSale.amount = ((this.pickupSale.slim * this.pickupSale.price) + (this.pickupSale.round * this.pickupSale.price));
      this.pickupSale.isSelected = this.service.current_user.isLogin;

      if (this.pickupSale.key == "")
        this.service.db.list('sales/water/items').push(this.pickupSale);
      else
        this.service.db.object('sales/water/items/' + this.pickupSale.key).update(this.pickupSale);

      if (this.service.current_user.isLogin) {
        this.service.select_tab = this.service.order_status.Pickup;
        this.service.router.navigateByUrl('/sales');
      }
    }
    else
      this.service.Message("Invalid amount.");
  }

  GetDate(action_day: number): Date {
    return this.service.actionDayToDate(action_day);
  }

  compute() {
    this.showInput = false;
    this.hasItem = (this.itemSales.length > 0 || this.billItems.length > 0);
    this.total = (((this.slim + this.round) * this.item.price) + this.othersTotal) - (this.item.price * this.promo);
    this.isLogin = (this.service.current_user.isLogin && this.service.current_user.role != this.service.user_roles.Monitor);

    if (!this.hasItem && this.currentStatus == 'none') {
      this.header = "Order";
      this.message = "Enter your order(s) below";
      this.image = 'assets/gifs/buy.gif';
      this.showInput = true;
      this.pickupLabel = (this.isLogin ? 'Pickup' : 'Order');
    }
    else if (this.isLogin && this.currentStatus == this.service.order_status.Pickup && !this.pickupSale.isSelected) {
      this.header = "Update order";
      this.message = "Enter the client order(s) below";
      this.image = 'assets/gifs/buy.gif';
      this.showInput = true;
      this.pickupLabel = 'Update pickup';
    }
    else if (this.currentStatus == this.service.order_status.Pickup && this.pickupSale.isSelected) {
      this.header = "Processing";
      this.message = "Your order is being processed";
      this.image = 'assets/gifs/processing.gif';
    }
    else if (this.currentStatus == this.service.order_status.Pickup) {
      this.header = "On our way";
      this.message = "Our staff are on their way to pickup your bottles";
      this.image = 'assets/gifs/pickup.gif';
    }
    else if (this.currentStatus == this.service.order_status.Preparing) {
      this.header = "Preparing your order";
      this.message = "Our staff are currently preparing your order(s)";
      this.image = 'assets/gifs/preparing.gif';
    }
    else if (this.hasItem) {
      this.header = "Delivering your order";
      this.message = "Our staff are on their way to deliver your order(s)";
      this.image = 'assets/gifs/delivery.gif';
    }
  }

  delivered() {
    this.item.counter = this.counter;
    this.service.db.object('clients/items/' + this.item.key).update(this.item);

    this.itemSales.forEach(item => {
      item.status = this.service.order_status.Delivered;
      item.isSelected = true;
      item.counted = true;
      this.service.db.object('sales/water/items/' + item.key).update(item);
    });

    this.service.select_tab = this.service.order_status.Delivered;
    this.service.router.navigateByUrl('/sales');
  }

  print() {
    window.print();
  }
}
