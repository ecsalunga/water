import { Component, OnInit, ViewChild, ElementRef , Renderer2 } from '@angular/core';
import { WaterService } from './water.service';
import { Command } from './models/command';
import { environment } from '../environments/environment';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent implements OnInit {
  @ViewChild('imageSelector', {static: false}) imageSelector: ElementRef;

  name: string = "Acqua Perfetta";
  branch: string = "";
  version: string = "0.0.0";
  loginAs = "";
  progress: number = 0;
  showProgress: boolean = false;
  constructor(private service: WaterService, private renderer: Renderer2) {}

  ngAfterViewInit() {
    this.service.imageSelector = this.imageSelector;
    this.renderer.listen(this.imageSelector.nativeElement, 'change', (event) => {
      this.service.upload();
    });
  }

  ngOnInit(): void {
    this.name = environment.name(environment.project);
    this.branch = environment.branch(environment.project);
    this.service.address = environment.address(environment.project);
    this.version = environment.version;
    let url = window.location.href;
    
    if(!this.service.current_user.isLogin)
      this.service.getLogin();

    if(url.indexOf('billing') == -1 && url.indexOf('message') == -1) {
      if(!this.service.current_user.isLogin) {
        this.service.saveRequestPath(url);
        this.service.router.navigateByUrl('/login');
      }
    }

    this.service.Changed.subscribe((cmd: Command) => {
      if(cmd.type == this.service.command_types.Progress) {
        this.progress = cmd.data;
        this.showProgress = (cmd.data != 0 && cmd.data != 100);
      }
    });
  }

  upload() {
    console.log("uploading");
  }

  logout() {
    this.service.logOut();
  }

  showLogout() {
    if(this.service.current_user.isLogin)
      this.loginAs = "Hello " + this.service.current_user.username;
    else
      this.loginAs = "";

    return this.service.current_user.isLogin;
  }
}
