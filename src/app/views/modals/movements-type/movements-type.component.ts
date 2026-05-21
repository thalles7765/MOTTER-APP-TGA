import { Component, Input, OnInit } from '@angular/core';
import { LoadingController, ModalController, IonHeader, IonToolbar, IonButton, IonButtons, IonTitle, IonContent } from '@ionic/angular/standalone';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { movements_type } from 'src/app/interfaces/movements_type';
import { UtilsService } from 'src/app/services/utils/utils.service';

@Component({
  selector: 'app-movements-type',
  templateUrl: './movements-type.component.html',
  styleUrls: ['./movements-type.component.scss'],
  imports: [IonButton, IonContent, IonHeader, IonTitle, IonToolbar, CommonModule, FormsModule, IonButtons]
})
export class MovementsTypeComponent implements OnInit {
  @Input() movements: movements_type[] = [];

  constructor(private loadingController: LoadingController, private utilSvc: UtilsService, private modalCtrl: ModalController) { }

  ngOnInit() {
    if (this.movements.length <= 0) {
      this.utilSvc.getMovementsType().then((data) => {
        if (data.status === 200) {
          this.movements = data.data.data;
        }
      })
    }
  }

  cancel() {
    return this.modalCtrl.dismiss(null, 'cancel');
  }

  confirm(client) {
    return this.modalCtrl.dismiss(client, 'confirm');
  }

}
