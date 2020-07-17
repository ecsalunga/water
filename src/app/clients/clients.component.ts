import { Component, OnInit } from '@angular/core';
import { WaterService } from '../water.service';
import { clients } from '../models/clients';
import { FormControl } from '@angular/forms';
import { Observable } from 'rxjs';
import { map, startWith } from 'rxjs/operators';

@Component({
  selector: 'app-clients',
  templateUrl: './clients.component.html',
  styleUrls: ['./clients.component.scss']
})
export class ClientsComponent implements OnInit {
  display: string = 'list';
  displayedColumns: string[] = ['name', 'address', 'contact', 'key'];
  item: clients;
  items: Array<clients>;
  myControl = new FormControl();
  filteredOptions: Observable<string[]>;
  options: string[] = ['Block'];
  
  constructor(private service: WaterService) { }

  ngOnInit(): void {
    this.loadData();
    this.setOption();
  }

  updateAddress() {
    let block = this.item.block ?? "";
    let lot = this.item.lot ?? "";
    let address = (block != "") ? block + ", " + lot : lot;
    this.options = [address=="" ? "Block" : address];
    this.setOption();
  }

  private setOption() {
    this.filteredOptions = this.myControl.valueChanges.pipe(
      startWith(''),
      map(value => this._filter(value))
    );
  }

  private _filter(value: string): string[] {
    const filterValue = value.toLowerCase();

    return this.options.filter(option => option.toLowerCase().indexOf(filterValue) === 0);
  }

  loadData() {
    this.service.db.list<clients>('clients/items').snapshotChanges().subscribe(records => {
      this.items = new Array<clients>();
      records.forEach(item => {
        let i = item.payload.val();
        i.key = item.key;
        this.items.push(i);
      });

      this.items = this.items.sort((a, b) => {
        let isLess = false;

        if(a.block == b.block) {
          if(a.lot > b.lot)
            isLess = true;
        }
        else if(a.block > b.block)
          isLess = true;

        return isLess ? 1 : -1;
      });
    });
  }

  add() {
    this.display = 'form';
    this.item = new clients();
  }

  cancel() {
    this.display = 'list';
  }

  edit(item: clients) {
    this.display = 'form';
    this.item = Object.assign({}, item);
    this.updateAddress();
  }

  toDate(action_date: number): Date {
    return this.service.actionDayToDate(action_date);
  }

  save() {
    let item = new clients();
    item.key = this.item.key ?? "";
    item.block = this.item.block;
    item.lot = this.item.lot;
    item.address = this.item.address ?? "";
    item.name = this.item.name ?? "";
    item.contact = this.item.contact ?? "";
    item.remarks = this.item.remarks ?? "";
    item.action_date = this.service.actionDate();
    item.action_day = this.service.action_day;

    if (item.key == null || item.key == "") {
      item.last_order = item.action_date;
      this.service.db.list('clients/items').push(item);
    }
    else
      this.service.db.object('clients/items/' + item.key).update(item);

    this.display = 'list';
  }
}
