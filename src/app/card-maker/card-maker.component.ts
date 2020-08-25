import { Component, ViewChild, ElementRef, OnInit } from '@angular/core';
import { WaterService } from '../water.service';
import { clients } from '../models/clients';
import { Card } from '../models/card';
import { NgxQrcodeElementTypes, NgxQrcodeErrorCorrectionLevels } from '@techiediaries/ngx-qrcode';
import { Document, Packer, Paragraph, Media, Table, TableRow, TableCell, AlignmentType, HeadingLevel, WidthType } from "docx";
import { saveAs } from "file-saver/FileSaver";

@Component({
  selector: 'app-card-maker',
  templateUrl: './card-maker.component.html',
  styleUrls: ['./card-maker.component.scss']
})
export class CardMakerComponent implements OnInit {
  @ViewChild('dataContainer') dataContainer: ElementRef;

  elementType = NgxQrcodeElementTypes.URL;
  correctionLevel = NgxQrcodeErrorCorrectionLevels.HIGH;
  
  displayedColumns: string[] = ['name', 'address'];
  currentURL: string;
  itemSelected = new Array<clients>();
  itemCards = new Array<any>();
  cards: Array<Card>;
  items: Array<clients>;

  constructor(private service: WaterService) { }

  ngOnInit(): void {
    let path = window.location.href.split('card');
    this.currentURL = path[0];
    this.loadData();
  }

  loadData() {
    this.service.db.list<clients>('clients/items', ref => ref.orderByChild('name')).snapshotChanges().subscribe(records => {
      this.items = new Array<clients>();
      records.forEach(item => {
        let i = item.payload.val();
        i.key = item.key;
        this.items.push(i);
      });
    });
  }

  select(item: clients) {
    let reSelected = false;
    this.itemSelected.forEach(i => {
      let items = new Array<clients>();
      this.itemSelected.forEach(i => {
        if(i.key != item.key)
          items.push(i);
      });

      if(items.length != this.itemSelected.length) {
        reSelected = true;
        this.itemSelected = items;
        this.loadSelected();
      }
    });
    
    if(!reSelected && this.itemSelected.length < 6) {
        this.itemSelected.push(item);
        this.loadSelected();
    }
  }

  isSelected(item: clients): boolean {
    let isSelected = false;
    this.itemSelected.forEach(i => {
      this.itemSelected.forEach(i => {
        if(i.key == item.key)
          isSelected = true;
      });
    });

    return isSelected;
  }

  loadSelected() {
    this.itemCards = new Array<any>();

    let cardItem = { item1: null, item2: null };
    let ctr = 0;
    this.itemSelected.forEach(item => {
      ctr++;

      if(ctr == 1)
        cardItem.item1 = item;
      else if(ctr == 2) {
        cardItem.item2 = item;
        this.itemCards.push(cardItem);
        cardItem = { item1: null, item2: null };
        ctr = 0;
      }
    });

    if(ctr != 0)
      this.itemCards.push(cardItem);
  }

  getClientPath(item: clients) {
    return this.currentURL + "billing/" + item.key;
  }

  generate() {
    let items = this.dataContainer.nativeElement.childNodes;

    this.cards = new Array<Card>();
    items.forEach(tr => {
      tr.childNodes.forEach(td => {
        if(td.id != null) {
          let card = new Card();
          card.key = td.id;
  
          this.itemSelected.forEach(item => {
            if(item.key == card.key) {
              card.name = item.name;
              card.address = item.address;
            }
          });
  
          td.childNodes.forEach(element => {
            if(element.tagName == "NGX-QRCODE") {
              let img = element.firstChild.firstChild;
              card.imageSrc = img.src;
            }
          });
          
          this.cards.push(card);
        }
      });
    });

    this.download();
  }

  download() {
    let doc = new Document();
    let trs = new Array<TableRow>();
    let tcs = new Array<TableCell>();
    let ctr = 0;

    this.cards.forEach(card => {
      ctr++;

      let margin  =  new Paragraph({});

      let acqua =  new Paragraph({
        text: "Acqua Perfetta",
        heading: HeadingLevel.HEADING_1,
        alignment: AlignmentType.CENTER
      });

      let address = new Paragraph({
        text: "Blk 25 Lot 9 Fiesta Ave. Fiesta Pandan",
        alignment: AlignmentType.CENTER
      });

      let contact = new Paragraph({
        text: "+63 927 968 1748",
        alignment: AlignmentType.CENTER
      });

      let img = Media.addImage(doc, card.imageSrc, 200, 200);
      let qr = new Paragraph({
        alignment: AlignmentType.CENTER
      });

      qr.addChildElement(img);

      let client = new Paragraph({
        text: card.address,
        alignment: AlignmentType.CENTER
      });

      let tc = new TableCell({ 
        children: [margin, acqua, address, contact, margin, client, qr],
        width: {
          size: 50,
          type: WidthType.PERCENTAGE,
        }
      });
      tcs.push(tc);

      if(ctr == 2) {
        ctr = 0;
        let tr = new TableRow({
          children: tcs
        });
        trs.push(tr);
        tcs = new Array<TableCell>();
      }
    });

    if(tcs.length > 0) {
      let tr = new TableRow({
        children: tcs
      });
      trs.push(tr);
    }

    let table = new Table({
      rows: trs
    });

    doc.addSection({
      properties: {},
      children: [table],
    });
    
    Packer.toBlob(doc).then(blob => {
      saveAs(blob, "card.docx");
    });
  }
}