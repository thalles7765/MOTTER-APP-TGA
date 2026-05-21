import { Component, CUSTOM_ELEMENTS_SCHEMA, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MenuController, AlertController, IonHeader, IonToolbar, IonButtons, IonMenuButton, IonTitle, IonContent, IonButton, IonIcon, IonGrid, IonRow, IonCol } from '@ionic/angular/standalone';
import { Router, RouterLink } from '@angular/router';
import { brandConfig } from 'src/app/branding/brand-config';

@Component({
    selector: 'app-home',
    templateUrl: './home.page.html',
    styleUrls: ['./home.page.scss'],
    imports: [IonCol, IonRow, IonGrid, IonContent, IonHeader, IonGrid, IonRow, IonTitle, IonToolbar, IonButtons, IonMenuButton, CommonModule, FormsModule]
})
export class HomePage implements OnInit {
  public brand = brandConfig;

  constructor(public menuCtrl: MenuController, private alertController: AlertController, private _route: Router) {
    
   }

  ngOnInit() {
    console.log('teste');
    this.menuCtrl.enable(true, 'menuOpt');
  }

  async funcEmpty() {
    const alert = await this.alertController.create({
      header: 'Função Indisponível',
      //subHeader: 'A Sub Header Is Optional',
      message: 'Este recurso deve ser disponibilizado em breve, por favor aguarde!',
      buttons: ['Fechar'],
    });

    await alert.present();
  }

  async urlNotFound() {
    const alert = await this.alertController.create({
      header: 'URL inválida',
      //subHeader: 'A Sub Header Is Optional',
      message: 'Você tentou acessar um endereço que não existe, verifique!',
      buttons: ['Fechar'],
    });

    await alert.present();
  }



  async navigateURL(url = '') {
    if (url) {
      this._route.navigateByUrl(url);
    } else {
      await this.urlNotFound();
    }
  }

}
