import { Component, OnInit, ViewChild, ElementRef } from '@angular/core';
import { Sort } from '@angular/material/sort';
import { WaterService } from '../water.service';
import { sales } from '../models/sales-water';
import { users } from '../models/users';
import { clients } from '../models/clients';
import { StatusBar } from '../models/status-bar';
import { Command } from '../models/command';
import { SalesOther } from '../models/sales-other';
import { SalesOthersItem } from '../models/sales-others-item';
import { FormControl } from '@angular/forms';
import { Observable } from 'rxjs';
import { map, startWith } from 'rxjs/operators';

@Component({
  selector: 'app-sales-water',
  templateUrl: './sales-water.component.html',
  styleUrls: ['./sales-water.component.scss']
})
export class SalesWaterComponent implements OnInit {
  @ViewChild('clientName', {static: false}) nameField: ElementRef;

  IsAllowed: boolean = false;
  IsLocked: boolean = false;
  IsOpenDaysShowed: boolean = false;
  openDays: Array<number>;
  role: string = "";
  selected: number;
  selectedDate = new Date();
  display: string = 'list';
  displayedColumns: string[] = ['name', 'round', 'slim', 'key'];
  itemOrig: sales;
  item = new sales();
  bar = new StatusBar();
  itemClients = new Array<clients>();
  items: Array<sales>;
  filter: string;
  otherPanel: boolean = false;

  blockControl = new FormControl();
  blockFilteredOptions: Observable<string[]>;
  blockOptions: string[] = ['0'];

  lotControl = new FormControl();
  lotFilteredOptions: Observable<string[]>;
  lotOptions: string[] = ['0'];

  nameControl = new FormControl();
  nameFilteredOptions: Observable<string[]>;
  nameOptions: string[] = [];

  addressControl = new FormControl();
  addressFilteredOptions: Observable<string[]>;
  addressOptions: string[] = [];

  isPriceLocked: boolean = false;
  currentURL: string;

  otherSalesItems = new Array<SalesOthersItem>();
  otherQty: number = 1;
  otherItem = new SalesOthersItem();

  deliveries = new Array<users>();
  deliveryFilter = 'all';

  constructor(private service: WaterService) {
    this.role = this.service.current_user.role;
    if (this.role == this.service.user_roles.Delivery)
      this.filter = this.service.order_status.Pickup;
    if (this.service.select_tab != '') {
      this.filter = this.service.select_tab;
      this.service.select_tab = '';
    }
  }

  ngOnInit(): void {
    let path = window.location.href.split('sales');
    this.currentURL = path[0];

    this.filter = this.service.order_status.All;
    this.deliveryFilter = this.service.order_status.All;
    this.selected = this.service.action_day;
    this.deliveries = this.service.delivery_users;
    this.loadData();
    this.loadClientData();
    this.loadCommonSettingsData();
    this.loadOtherSales();
    this.service.Changed.subscribe((cmd: Command) => {
      if (cmd.type == this.service.command_types.Loader && cmd.data == 'settings-common')
        this.loadCommonSettingsData();
      else if (cmd.type == this.service.command_types.Loader && cmd.data == 'users')
        this.deliveries = this.service.delivery_users;
      else if (cmd.type == this.service.command_types.Loader && cmd.data == 'clients')
        this.loadClientData();
    });
  }

  private loadCommonSettingsData() {
    this.setLocked();
    this.loadOpenDays();
  }

  sortData(sort: Sort) {
    if(this.filter != '') {
      let data = this.items.slice();
    
      if (!sort.active || sort.direction === '') {
        this.items = data;
        return;
      }
  
      this.items = data.sort((a, b) => {
        const isAsc = sort.direction === 'asc';
        switch (sort.active) {
          case 'name': return this.service.compare(a.name, b.name, isAsc);
          case 'address': return this.service.compare(a.address, b.address, isAsc);
          case 'contacts': return this.service.compare(a.contact, b.contact, isAsc);
          default: return 0;
        }
      });
    }
  }

  GetDate(action_day: number): Date {
    return this.service.actionDayToDate(action_day);
  }

  SetDate() {
    this.loadData();
    this.loadCommonSettingsData();
  }

  private loadOtherSales() {
    this.service.db.list<SalesOthersItem>('settings/items', ref => ref.orderByChild('group').equalTo(this.service.setting_types.OtherSalesItems)).snapshotChanges().subscribe(records => {
      this.otherSalesItems = new Array<SalesOthersItem>();
      records.forEach(item => {
        let i = item.payload.val();
        i.key = item.key;
        this.otherSalesItems.push(i);
      });
    });
  }

  private loadOpenDays() {
    this.openDays = this.service.GetOpenDays();
    this.IsOpenDaysShowed = this.service.IsShowOpenDays();
  }

  setLocked() {
    this.IsLocked = this.service.IsLocked(this.selected);
    this.IsAllowed = this.service.IsAllowed(this.selected);
  }

  isSelected(item: sales): boolean {
    let isSelected = false;

    if (item.key == "total")
      return false;
    else if (this.filter == this.service.order_status.Pickup && item.status == this.service.order_status.Pickup)
      isSelected = (item.isSelected);
    else if (this.filter == this.service.order_status.Preparing && item.status == this.service.order_status.Preparing)
      isSelected = (item.isSelected);
    else if (this.filter == this.service.order_status.Delivered && item.status == this.service.order_status.Delivered)
      isSelected = (item.isSelected);

    return isSelected;
  }

  select(item: sales) {
    if (this.filter == this.service.order_status.Pickup && this.service.current_user.role != this.service.user_roles.Monitor) {
      item.isSelected = !item.isSelected;
      this.service.db.object('sales/water/items/' + item.key).update(item);
    }
    else if (this.service.current_user.role != this.service.user_roles.Delivery) {
      if (this.filter == this.service.order_status.Preparing) {
        item.isSelected = !item.isSelected;
        this.service.db.object('sales/water/items/' + item.key).update(item);
      }
      else if (this.filter == this.service.order_status.Delivered) {
        item.isSelected = !item.isSelected;
        this.service.db.object('sales/water/items/' + item.key).update(item);
      }
    }
  }

  filterDelivery(user_key: string) {
    if(user_key == null || user_key == '')
      this.deliveryFilter = this.service.order_status.All;
    else
      this.deliveryFilter = user_key;

    this.loadData();
  }

  loadData() {
    this.service.db.list<sales>('sales/water/items', ref => ref.orderByChild('action_day').equalTo(this.selected)).snapshotChanges().subscribe(records => {
      this.items = new Array<sales>();

      records.forEach(item => {
        let i = item.payload.val();
        i.key = item.key;

        if (i.client_key == null || i.client_key == '')
          this.mapClient(i)

        if (this.filter == this.service.order_status.All || i.status == this.filter)
        {
          if(this.filter == this.service.order_status.Delivery || this.filter == this.service.order_status.Delivered)
          {
            if(this.service.current_user.role == this.service.user_roles.Delivery)
            {
              if(i.user_key == null || i.user_key == '' || i.user_key == this.service.current_user.key)
                this.items.push(i);
            }
            else {
              if(this.deliveryFilter == this.service.order_status.All || i.user_key == this.deliveryFilter)
                this.items.push(i);
            }
          }
          else
            this.items.push(i);
        }
      });

      this.setData();
    });
  }

  setData() {
    this.bar = new StatusBar();
    let status = this.service.order_status.None;

    if (this.filter == this.service.order_status.Pickup)
      status = this.service.order_status.Preparing;
    else if (this.filter == this.service.order_status.Preparing)
      status = this.service.order_status.Delivery;
    else if (this.filter == this.service.order_status.Delivered)
      status = this.service.order_status.Paid;

    this.bar.status = status;

    this.items.forEach(item => {
      if (this.filter == this.service.order_status.All) {
        if (item.status != this.service.order_status.Cancelled) {
          this.bar.slim += item.slim;
          this.bar.round += item.round;
          this.bar.amount += item.amount;
        }
      }
      else {
        this.bar.slim += item.slim;
        this.bar.round += item.round;
        this.bar.amount += item.amount;

        if (item.others != null) {
          item.others.forEach(other => {
            this.bar.amount += (other.price * other.quantity);
          });
        }
      }

      if (this.filter != this.service.order_status.All && item.isSelected) {
        this.bar.selectedSlim += item.slim;
        this.bar.selectedRound += item.round;
        this.bar.selectedAmount += item.amount;

        if (item.others != null) {
          item.others.forEach(other => {
            this.bar.selectedAmount += (other.price * other.quantity);
          });
        }
      }
    });

    this.bar.show = (this.items.length > 0);
  }

  isNoAction(): boolean {
    return (this.isSelectAction() && !this.hasSelected());
  }

  isSelectAction(): boolean {
    return (this.filter == this.service.order_status.Pickup 
      || this.filter == this.service.order_status.Preparing
      || this.filter == this.service.order_status.Delivered);
  }

  getFooterRound(): number {
    if(this.isNoAction())
      return 0;

    return this.hasSelected() ? this.bar.selectedRound : this.bar.round;
  }

  getFooterSlim(): number {
    if(this.isNoAction())
      return 0;

    return this.hasSelected() ? this.bar.selectedSlim : this.bar.slim;
  }

  getStatusValue(): number {
    if(this.hasSelected())
    {
      if(this.filter == this.service.order_status.Delivered)
        return this.bar.selectedAmount;
      else
        return (this.bar.selectedSlim ?? 0) + (this.bar.selectedRound ?? 0);
    }

    if(this.filter == this.service.order_status.Delivered)
      return this.bar.amount;

    if(this.filter == this.service.order_status.Paid)
      return this.bar.amount;

    return (this.bar.slim ?? 0) + (this.bar.round ?? 0);
  }

  isAmount() {
    return (this.filter == this.service.order_status.Delivered || this.filter == this.service.order_status.Paid);
  }

  showSelectedDelivered() {
    return (this.hasSelected() && this.filter == this.service.order_status.Delivered);
  }

  showFooterAction(): boolean {
    let show = false;

    if (this.hasSelected()
      && this.service.current_user.role != this.service.user_roles.Delivery
      && this.bar.status != this.service.order_status.None)
      show = true;

    return show;
  }

  hasSelected(): boolean {
    return (this.bar.selectedSlim > 0 || this.bar.selectedRound > 0 || this.bar.selectedAmount > 0);
  }

  setNext(user_key: string) {
    this.items.forEach(item => {
      if (item.isSelected) {
        let status = this.service.order_status.Preparing;

        if (this.filter == this.service.order_status.Preparing)
          status = this.service.order_status.Delivery;
        else if (this.filter == this.service.order_status.Delivered) {
          status = this.service.order_status.Paid;
        }

        if(user_key != null && user_key != '')
          item.user_key = user_key;

        this.setStatus(status, item)
      }
    });
  }

  loadClientData() {
    this.itemClients = this.service.clients;
    this.setNameOptions();
    this.setBlockOptions();
    this.setAddressOptions();
  }

  dateSelected() {
    this.selected = this.service.getActionDay(this.selectedDate);
    this.loadData();
    this.setLocked();
  }

  getIcon(status: string): string {
    let icon = '';

    if (status == this.service.order_status.Pickup)
      icon = 'connect_without_contact';
    else if (status == this.service.order_status.Preparing)
      icon = 'wash';
    else if (status == this.service.order_status.Delivery)
      icon = 'two_wheeler';
    else if (status == this.service.order_status.Delivered)
      icon = 'house';
    else if (status == this.service.order_status.Paid)
      icon = 'check';
    else if (status == this.service.order_status.Cancelled)
      icon = 'cancel';

    return icon;
  }

  mapClient(item: sales) {
    this.itemClients.forEach(client => {
      if (item.name.toLowerCase() == client.name.toLowerCase() && item.address.toLowerCase() == client.address.toLowerCase()) {
        item.client_key = client.key;
        this.service.db.object('sales/water/items/' + item.key).update(item);
      }
    });
  }

  setStatus(status: string, item: sales) {
    item.status = status;
    item.isSelected = false;

    if (!item.counted && (item.status == this.service.order_status.Delivered || item.status == this.service.order_status.Paid))
      this.setCounter(item, true);
    else if (item.counted && item.status == this.service.order_status.Cancelled)
      this.setCounter(item, false);

    this.service.db.object('sales/water/items/' + item.key).update(item);
  }

  setCounter(item: sales, isCount: boolean) {
    this.itemClients.forEach(client => {
      if (client.key == item.client_key) {
        client.slim = item.slim ?? 0;
        client.round = item.round ?? 0;

        if (isCount)
          client.counter += client.slim + client.round;
        else {
          client.counter -= client.slim + client.round;
          item.promo = 0;
        }

        this.service.db.object('clients/items/' + client.key).update(client);
        item.counted = isCount;

      }
    });
  }

  canSave(): boolean {
    if (this.service.current_user.role == this.service.user_roles.Admin)
      return true;

    if (this.IsLocked)
      return false;

    if (this.service.current_user.role == this.service.user_roles.Monitor
      && (this.itemOrig == null
        || (this.item.status == this.itemOrig.status && this.itemOrig.status != this.service.order_status.Paid)))
      return true;

    if (this.service.current_user.role == this.service.user_roles.Delivery
      && this.itemOrig == null
      && this.item.status == this.service.order_status.Pickup)
      return true;

    return this.service.CanExecute(status, this.itemOrig);
  }

  canExecute(status: string, item: sales): boolean {
    if (this.service.current_user.role == this.service.user_roles.Admin)
      return true;

    if (this.IsLocked)
      return false;

    return this.service.CanExecute(status, item);
  }

  add() {
    this.display = 'form';
    this.itemOrig = null;
    this.item = new sales();
    this.item.status = this.service.order_status.Pickup;
    this.item.counted = false;
    this.otherPanel = false;
    if(this.otherSalesItems.length > 0)
      this.otherItem = this.otherSalesItems[0];

    this.otherQty = 1;

    setTimeout(() => { this.nameField.nativeElement.focus(); }, 300);
  }

  addOther() {
    if(this.otherQty > 0) {
      let exists = false; 

      this.item.others.forEach(other => {
        if(other.name == this.otherItem.name) {
          exists = true;
          other.quantity += this.otherQty;
        }
      });

      if(!exists) {
        let i = new SalesOther();
        i.name = this.otherItem.name;
        i.price = this.otherItem.price;
        i.quantity = this.otherQty;
        this.item.others.push(i);
      }
      
      this.otherQty = 1;
    }
  }

  removeOther(index: number) {
    this.item.others.splice(index, 1);
  }

  edit(item: sales) {
    this.display = 'form';
    this.itemOrig = item;
    this.isPriceLocked = true;
    this.item = Object.assign({}, item);
    this.item.others = item.others ?? new Array<SalesOther>();
    this.otherItem = this.otherSalesItems[0];
    this.otherQty = 1;
    this.otherPanel = false;
  }

  cancel() {
    this.display = 'list';
    this.otherPanel = true;
  }

  toDate(action_date: number): Date {
    return this.service.actionDayToDate(action_date);
  }

  show(status: string) {
    this.filter = status;
    this.deliveryFilter = this.service.order_status.All;
    this.loadData();
  }

  private getSales() : sales {
    let item = new sales();

    if(this.item.name == null || this.item.name == '') {
      this.service.Message("Name is required");
      return item;
    }

    if(this.item.address == null || this.item.address == '') {
      this.service.Message("Address is required");
      return item;
    }

    if(this.item.amount == null || this.item.amount < 1) {
      this.service.Message("Invalid amount");
      return item;
    }

    item.key = this.item.key ?? "";
    item.client_key = this.item.client_key ?? "";
    item.user_key = this.item.user_key ?? "";
    item.name = this.item.name ?? "";
    item.block = this.item.block ?? "";
    item.lot = this.item.lot ?? "";
    item.address = this.item.address ?? "";
    item.contact = this.item.contact ?? "";
    item.slim = this.item.slim ?? 0;
    item.round = this.item.round ?? 0;
    item.amount = this.item.amount;
    item.status = this.item.status;
    item.price = (item.amount / (item.slim + item.round));

    if(item.price == null || item.price == Infinity || item.price == NaN)
      item.price = 0;

    item.others = this.item.others;
    item.remarks = this.item.remarks ?? "";
    item.isSelected = (this.role == this.service.user_roles.Delivery && item.status == this.service.order_status.Pickup);
    item.action_date = this.service.actionDate();
    item.action_day = this.selected;

    return item;
  }

  save() {
    let item = this.getSales();

    if(item.action_day > 0) {
      this.saveClient();
      item.noQR = this.item.noQR ?? false;
      item.counted = this.item.counted ?? false;
  
      if (item.counted && item.status == this.service.order_status.Cancelled)
        this.setCounter(item, false);
  
      if (item.key == null || item.key == "")
        this.service.db.list('sales/water/items').push(item);
      else
        this.service.db.object('sales/water/items/' + item.key).update(item);
  
      this.display = 'list';
      this.otherPanel = true;
    }
  }

  getOthersTotal(): number {
    let amount = 0;

    this.item.others.forEach(other =>  {
      amount += (other.price * other.quantity);
    });

    return amount;
  }

  private saveClient() {
    let isExists = false;
    this.itemClients.forEach(item => {
      if (item.name.toLowerCase() == this.item.name.toLowerCase() && item.address.toLowerCase() == this.item.address.toLowerCase()) {

        let hasUpdate = false;
        isExists = true;

        if (item.price < 1) {
          item.slim = this.item.slim ?? 0;
          item.round = this.item.round ?? 0;
          
          item.price = (this.item.amount / (item.slim + item.round));
          if(item.price == null || item.price == Infinity || item.price == NaN)
            item.price = 0;

          hasUpdate = true;
        }

        if (!this.item.counted && (this.item.status == this.service.order_status.Delivered || this.item.status == this.service.order_status.Paid)) {
          item.slim = this.item.slim ?? 0;
          item.round = this.item.round ?? 0;
          item.counter += item.slim + item.round;
          item.last_order = item.action_date = item.action_date;

          this.item.counted = true;
          hasUpdate = true;
        }

        if (hasUpdate) {
          this.service.db.object('clients/items/' + item.key).update(item);
        }

        this.item.noQR = item.noQR ?? false;
      }
    });

    if (!isExists) {
      let item = new clients();
      item.key = "";
      item.qrCode = "";
      item.name = this.item.name;
      item.block = this.item.block ?? "";
      item.lot = this.item.lot ?? "";
      item.address = this.item.address;
      item.contact = this.item.contact ?? "";
      item.slim = this.item.slim ?? 0;
      item.round = this.item.round ?? 0;

      if (!this.item.counted && this.item.status == this.service.order_status.Paid) {
        item.counter = item.slim + item.round;
        this.item.counted = true;
      }
      else
        item.counter = 0;

      item.price = (this.item.amount / (item.slim + item.round));
      if(item.price == null || item.price == Infinity || item.price == NaN)
        item.price = 0;

      item.remarks = this.item.remarks ?? "";
      item.action_date = this.service.actionDate();
      item.action_day = this.service.action_day;
      item.last_order = item.action_date;
      this.service.db.list('clients/items').push(item);
    }
  }

  private setBlockOptions() {
    this.blockOptions = [];
    this.itemClients.forEach(item => {
      let block = item.block.trim();
      if (block != '' && this.blockOptions.indexOf(block) == -1)
        this.blockOptions.push(block);
    });

    this.blockOptions = this.blockOptions.sort((a, b) => a > b ? 1 : -1);
    this.blockFilteredOptions = this.blockControl.valueChanges.pipe(
      startWith(''),
      map(value => this._filterBlock(value))
    );
  }

  private _filterBlock(value: string): string[] {
    if(value != null && value != '') {
      const filterValue = value.toLowerCase();
      return this.blockOptions.filter(option => option.toLowerCase().indexOf(filterValue) !== -1);
    }

    return new Array<string>();
  }

  updateLotOptions() {
    this.setLotOptions();
    this.blockLotUpdate();
  }

  blockLotUpdate() {
    this.itemClients.forEach(item => {
      if (item.block == this.item.block && item.lot == this.item.lot) {
        this.item.name = item.name;
        this.item.address = item.address;
        this.updateCommon(item);
      }
    });
  }

  priceUpdate() {
    if (this.item.price != null && this.item.price > 0)
      this.item.amount = (((this.item.slim ?? 0) * this.item.price) + ((this.item.round ?? 0) * this.item.price));
  }

  updateName() {
    this.itemClients.forEach(item => {
      if (item.name.toLowerCase() == this.item.name.toLowerCase()) {
        this.item.block = item.block;
        this.item.lot = item.lot;
        this.item.address = item.address;
        this.updateCommon(item);
      }
    });
  }

  updateAddress() {
    this.itemClients.forEach(item => {
      if (item.address.toLowerCase() == this.item.address.toLowerCase()) {
        this.item.name = item.name;
        this.item.block = item.block;
        this.item.lot = item.lot;
        this.updateCommon(item);
      }
    });
  }

  private updateCommon(item: clients) {
    this.item.contact = item.contact;
    this.item.slim = item.slim;
    this.item.round = item.round;
    this.item.price = item.price;
    this.item.amount = ((this.item.slim * item.price) + (this.item.round * item.price));
    this.item.remarks = item.remarks;

    this.isPriceLocked = (item.price > 0);
  }

  private setLotOptions() {
    this.lotOptions = [];
    this.itemClients.forEach(item => {
      if (item.block == this.item.block) {
        if (this.lotOptions.indexOf(item.lot.trim()) == -1)
          this.lotOptions.push(item.lot.trim());
      }
    });

    this.lotOptions = this.lotOptions.sort((a, b) => a > b ? 1 : -1);
    this.lotFilteredOptions = this.lotControl.valueChanges.pipe(
      startWith(''),
      map(value => this._filterLot(value))
    );
  }

  private _filterLot(value: string): string[] {
    if(value != null && value != '') {
      const filterValue = value.toLowerCase();
      return this.lotOptions.filter(option => option.toLowerCase().indexOf(filterValue) !== -1);
    }

    return new Array<string>();
  }

  private setNameOptions() {
    this.nameOptions = [];
    this.itemClients.forEach(item => {
      this.nameOptions.push(item.name.trim());
    });

    this.nameOptions = this.nameOptions.sort((a, b) => a > b ? 1 : -1);
    this.nameFilteredOptions = this.nameControl.valueChanges.pipe(
      startWith(''),
      map(value => this._filterName(value))
    );
  }

  private _filterName(value: string): string[] {
    if(value != null && value != '') {
      const filterValue = value.toLowerCase();
      return this.nameOptions.filter(option => option.toLowerCase().indexOf(filterValue) !== -1);
    }
    
    return new Array<string>();
  }

  private setAddressOptions() {
    this.addressOptions = [];
    this.itemClients.forEach(item => {
      this.addressOptions.push(item.address.trim());
    });

    this.addressOptions = this.addressOptions.sort((a, b) => a > b ? 1 : -1);
    this.addressFilteredOptions = this.addressControl.valueChanges.pipe(
      startWith(''),
      map(value => this._filterAddress(value))
    );
  }

  private _filterAddress(value: string): string[] {
    if(value != null && value != '') {
      const filterValue = value.toLowerCase();
      return this.addressOptions.filter(option => option.toLowerCase().indexOf(filterValue) !== -1);
    }

    return new Array<string>();
  }

  qrCode(item: sales) {
    let url = this.currentURL + "billing/" + item.client_key;
    window.open(url, "_blank");
  }
}
