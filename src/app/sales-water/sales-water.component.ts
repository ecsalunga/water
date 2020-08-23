import { Component, OnInit } from '@angular/core';
import { WaterService } from '../water.service';
import { sales } from '../models/sales-water';
import { clients } from '../models/clients';
import { Command } from '../models/command';
import { FormControl } from '@angular/forms';
import { Observable } from 'rxjs';
import { map, startWith } from 'rxjs/operators';

@Component({
  selector: 'app-sales-water',
  templateUrl: './sales-water.component.html',
  styleUrls: ['./sales-water.component.scss']
})
export class SalesWaterComponent implements OnInit {
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
  item: sales;
  itemClients = new Array<clients>();
  items: Array<sales>;
  filter: string = 'all';

  blockControl = new FormControl();
  blockFilteredOptions: Observable<string[]>;
  blockOptions: string[] = ['Block'];

  lotControl = new FormControl();
  lotFilteredOptions: Observable<string[]>;
  lotOptions: string[] = ['Lot'];

  nameControl = new FormControl();
  nameFilteredOptions: Observable<string[]>;
  nameOptions: string[] = [];

  addressControl = new FormControl();
  addressFilteredOptions: Observable<string[]>;
  addressOptions: string[] = [];

  constructor(private service: WaterService) { }

  ngOnInit(): void {
    this.role = this.service.current_user.role;
    this.selected = this.service.action_day;
    this.loadData();
    this.loadClientData();
    this.loadCommonSettingsData();
    this.service.Changed.subscribe((cmd: Command) => {
      if (cmd.type == this.service.command_types.Loader && cmd.data == 'settings-common')
        this.loadCommonSettingsData();
    });
  }

  private loadCommonSettingsData() {
    this.setLocked();
    this.loadOpenDays();
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

  setLocked() {
    this.IsLocked = this.service.IsLocked(this.selected);
    this.IsAllowed = this.service.IsAllowed(this.selected);
  }

  loadData() {
    this.service.db.list<sales>('sales/water/items', ref => ref.orderByChild('action_day').equalTo(this.selected)).snapshotChanges().subscribe(records => {
      this.items = new Array<sales>();
      records.forEach(item => {
        let i = item.payload.val();
        i.key = item.key;

        if (i.client_key == null)
          this.mapClient(i)

        if (this.filter == 'all' || i.status == this.filter)
          this.items.push(i);
      });
    });
  }

  loadClientData() {
    this.service.db.list<clients>('clients/items').snapshotChanges().subscribe(records => {
      this.itemClients = new Array<clients>();
      records.forEach(item => {
        let i = item.payload.val();
        i.key = item.key;
        this.itemClients.push(i);
      });

      this.setNameOptions();
      this.setBlockOptions();
      this.setAddressOptions();
    });
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
    else  if (status == this.service.order_status.Preparing)
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
    if (!item.counted && (item.status == this.service.order_status.Delivered || item.status == this.service.order_status.Paid))
      this.countOrder(item);

    this.service.db.object('sales/water/items/' + item.key).update(item);
  }

  countOrder(item: sales) {
    this.itemClients.forEach(client => {
      if (client.key == item.client_key) {
        client.slim = item.slim ?? 0;
        client.round = item.round ?? 0;
        client.counter += client.slim + client.round;
        this.service.db.object('clients/items/' + client.key).update(client);
        item.counted = true;
      }
    });
  }

  CanEdit(item: sales): boolean {
    if (this.service.current_user.role == this.service.user_roles.Admin)
      return true;
    else if (this.IsAllowed
      && item.status != this.service.order_status.Delivered
      && item.status != this.service.order_status.Paid
      && item.status != this.service.order_status.Cancelled)
      return true;

    return false;
  }

  canSave(): boolean {
    if (this.service.current_user.role == this.service.user_roles.Admin)
      return true;
  
    if(this.IsLocked)
      return false;

    if (this.service.current_user.role == this.service.user_roles.Monitor
      && (this.itemOrig == null 
        || this.item.status == this.itemOrig.status))
      return true;
    
    return this.canExecute(this.item.status, this.itemOrig);
  }

  canExecute(status: string, item: sales): boolean {
    if (this.service.current_user.role == this.service.user_roles.Admin)
      return true;
  
    if(this.IsLocked)
      return false;

    return this.service.CanExecute(status, item);
  }

  add() {
    this.display = 'form';
    this.itemOrig = null;
    this.item = new sales();
    this.item.status = this.service.order_status.Pickup;
    this.item.counted = false;
  }

  edit(item: sales) {
    this.display = 'form';
    this.itemOrig = item;
    this.item = Object.assign({}, item);
  }

  cancel() {
    this.display = 'list';
  }

  toDate(action_date: number): Date {
    return this.service.actionDayToDate(action_date);
  }

  show(status: string) {
    this.filter = status;
    this.loadData();
  }

  save() {
    let item = new sales();
    item.key = this.item.key ?? "";
    item.name = this.item.name ?? "";
    item.block = this.item.block ?? "";
    item.lot = this.item.lot ?? "";
    item.address = this.item.address ?? "";
    item.contact = this.item.contact ?? "";
    item.slim = this.item.slim ?? 0;
    item.round = this.item.round ?? 0;
    item.amount = this.item.amount;
    item.status = this.item.status;
    item.price = this.item.price ?? 0;
    item.remarks = this.item.remarks ?? "";
    item.action_date = this.service.actionDate();
    item.action_day = this.selected;

    this.saveClient();
    item.counted = this.item.counted ?? false;

    if (item.key == null || item.key == "")
      this.service.db.list('sales/water/items').push(item);
    else
      this.service.db.object('sales/water/items/' + item.key).update(item);

    this.display = 'list';
  }

  private saveClient() {
    let isExists = false;
    this.itemClients.forEach(item => {
      if (item.name.toLowerCase() == this.item.name.toLowerCase() && item.address.toLowerCase() == this.item.address.toLowerCase()) {
        if (!this.item.counted && (this.item.status == this.service.order_status.Delivered || this.item.status == this.service.order_status.Paid)) {
          item.slim = this.item.slim ?? 0;
          item.round = this.item.round ?? 0;
          item.counter += item.slim + item.round;
          item.last_order = item.action_date = item.action_date;
          this.service.db.object('clients/items/' + item.key).update(item);
          this.item.counted = true;
        }

        isExists = true;
      }
    });

    if (!isExists) {
      let item = new clients();
      item.key = "";
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
      if (this.blockOptions.indexOf(item.block) == -1)
        this.blockOptions.push(item.block);
    });

    this.blockOptions = this.blockOptions.sort((a, b) => a > b ? 1 : -1);
    this.blockFilteredOptions = this.blockControl.valueChanges.pipe(
      startWith(''),
      map(value => this._filterBlock(value))
    );
  }

  private _filterBlock(value: string): string[] {
    const filterValue = value.toLowerCase();
    return this.blockOptions.filter(option => option.toLowerCase().indexOf(filterValue) === 0);
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
  }

  private setLotOptions() {
    this.lotOptions = ['Lot'];
    this.itemClients.forEach(item => {
      if (item.block == this.item.block) {
        if (this.lotOptions.indexOf(item.lot) == -1)
          this.lotOptions.push(item.lot);
      }
    });

    this.lotOptions = this.lotOptions.sort((a, b) => a > b ? 1 : -1);
    this.lotFilteredOptions = this.lotControl.valueChanges.pipe(
      startWith(''),
      map(value => this._filterLot(value))
    );
  }

  private _filterLot(value: string): string[] {
    const filterValue = value.toLowerCase();
    return this.lotOptions.filter(option => option.toLowerCase().indexOf(filterValue) === 0);
  }

  private setNameOptions() {
    this.nameOptions = [];
    this.itemClients.forEach(item => {
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

  private setAddressOptions() {
    this.addressOptions = [];
    this.itemClients.forEach(item => {
      this.addressOptions.push(item.address);
    });

    this.addressOptions = this.addressOptions.sort((a, b) => a > b ? 1 : -1);
    this.addressFilteredOptions = this.addressControl.valueChanges.pipe(
      startWith(''),
      map(value => this._filterAddress(value))
    );
  }

  private _filterAddress(value: string): string[] {
    const filterValue = value.toLowerCase();
    return this.addressOptions.filter(option => option.toLowerCase().indexOf(filterValue) === 0);
  }
}
