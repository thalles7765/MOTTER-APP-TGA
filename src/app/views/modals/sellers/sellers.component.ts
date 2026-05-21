import { Component, Input, OnInit } from '@angular/core';
import { LoadingController, ModalController, IonHeader, IonToolbar, IonButton, IonButtons, IonTitle, IonContent } from '@ionic/angular/standalone';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { UtilsService } from 'src/app/services/utils/utils.service';
import { sellers } from 'src/app/interfaces/sellers';

@Component({
  selector: 'app-sellers',
  templateUrl: './sellers.component.html',
  styleUrls: ['./sellers.component.scss'],
  imports: [IonButton, IonContent, IonHeader, IonTitle, IonToolbar, CommonModule, FormsModule, IonButtons]
})
export class SellersComponent implements OnInit {
  @Input() sellers: sellers[] = [];

  constructor(private loadingController: LoadingController, private utilSvc: UtilsService, private modalCtrl: ModalController) { }

  ngOnInit() {
    if (this.sellers.length <= 0) {
      this.utilSvc.getSellers().then((data) => {
        if (data.status === 200) {
          this.sellers = data.data.data;
        }
      })
    }
  }

  cancel() {
    return this.modalCtrl.dismiss(null, 'cancel');
  }

  confirm(seller) {
    return this.modalCtrl.dismiss(seller, 'confirm');
  }

}
