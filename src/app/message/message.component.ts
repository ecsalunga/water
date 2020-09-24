import { Component, OnInit } from '@angular/core';
import { WaterService } from '../water.service';

@Component({
  selector: 'app-message',
  templateUrl: './message.component.html',
  styleUrls: ['./message.component.scss']
})
export class MessageComponent implements OnInit {
  message = "";

  constructor(private service: WaterService) { this.message = this.service.message; }

  ngOnInit(): void {
  }

}
