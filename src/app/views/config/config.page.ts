import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonInput, IonButtons, IonMenuButton, IonContent, IonHeader, IonTitle, IonToolbar } from '@ionic/angular/standalone';
import { ConfigService } from 'src/app/services/config/config.service';
import { brandConfig } from 'src/app/branding/brand-config';

@Component({
  selector: 'app-config',
  templateUrl: './config.page.html',
  styleUrls: ['./config.page.scss'],
  imports: [IonInput, IonContent, IonHeader, IonTitle, IonToolbar, CommonModule, FormsModule, IonMenuButton, IonButtons]
})
export class ConfigPage implements OnInit {
  protected brand = brandConfig;
  protected xConfig;

  constructor(private configSvc: ConfigService) { }

  async ngOnInit() {
    await this.getConfig();
  }


  async getConfig() {
    await this.configSvc.getData().then((data) => {
      if (data.status === 200) {
        this.xConfig = data.data.data;

        console.log(this.xConfig)
      } else {
        console.log('@@@')
        console.log(data)
      }
    })
  }

}
