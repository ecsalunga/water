import { Component, OnInit } from '@angular/core';
import { WaterService } from '../water.service';
import { Daily } from '../models/daily';
import { Command } from '../models/command';

@Component({
  selector: 'app-daily',
  templateUrl: './daily.component.html',
  styleUrls: ['./daily.component.scss']
})
export class DailyComponent implements OnInit {
  item: Daily;
  uploadType: string;
  imageUrl: string;
  showImage: boolean = false;
  isLocked: boolean = false;

  constructor(private service: WaterService) { }

  ngOnInit(): void {
    this.item = new Daily();
    this.item.action_day = this.service.action_day;
    this.item.tdsPath = this.service.defaultImagePath;
    this.item.meterPath = this.service.defaultImagePath;
    this.imageUrl = this.service.defaultImagePath;
    this.loadData();

    this.service.Changed.subscribe((cmd: Command) => {
      if(cmd.type == this.service.command_types.ImageUploaded) {
        if(this.uploadType == "TDS") {
          this.item.tdsPath = cmd.data;
          this.service.Message("TDS image uploaded.");
        }
        else if(this.uploadType == "METER") {
          this.item.meterPath = cmd.data;
          this.service.Message("Meter image uploaded.");
        }
      }
    });
  }

  hideImage() {
    this.showImage = false;
  }

  uploadTds() {
    if(this.item.tdsPath != this.service.defaultImagePath) {
      this.imageUrl = this.item.tdsPath;
      this.showImage = true;
    }
    else {
      this.service.imagePath = "/images/tds/" + this.item.action_date + ".png";
      this.uploadType = 'TDS';
      this.service.selectImage();
    }
  }

  uploadMeter() {
    if(this.item.meterPath != this.service.defaultImagePath) {
      this.imageUrl = this.item.meterPath;
      this.showImage = true;
    }
    else {
      this.service.imagePath = "/images/meter/" + this.item.action_date + ".png";
      this.uploadType = 'METER';
      this.service.selectImage();
    }
  }

  getIcon(image: string) {
    let icon = 'publish';

    if(image == "TDS" && this.item.tdsPath != this.service.defaultImagePath)
      icon = 'pageview';
    else if(image == "METER" && this.item.meterPath != this.service.defaultImagePath)
      icon = 'pageview';
    
    return icon;
  }

  loadData() {
    this.service.db.list<Daily>('daily/items', ref => ref.orderByChild('action_day').equalTo(this.service.action_day)).snapshotChanges().subscribe(records => {
      records.forEach(item => {
        this.item = item.payload.val();
        this.item.key = item.key;
      });

      this.isLocked = this.service.IsLocked(this.service.action_day);
    });
  }

  submit() {
    let item = new Daily();
    item.key = this.item.key ?? "";
    item.coh = this.item.coh ?? 0;
    item.tds = this.item.tds ?? 0;
    item.consumption = this.item.consumption ?? 0;
    item.slim_full = this.item.slim_full ?? 0;
    item.round_full = this.item.round_full ?? 0;
    item.meter = this.item.meter ?? 0;
    item.tdsPath = this.item.tdsPath;
    item.meterPath = this.item.meterPath;
    item.action_day = this.item.action_day;
    item.action_date = this.service.actionDate();

    if (item.key == null || item.key == "")
      this.service.db.list('daily/items').push(item);
    else
      this.service.db.object('daily/items/' + item.key).update(item);

    this.service.ToggleLock(this.service.action_day);
    this.service.router.navigateByUrl('/summary');
  }
}
