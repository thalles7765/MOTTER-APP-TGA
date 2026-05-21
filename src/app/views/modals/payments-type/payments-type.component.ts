import { Component, Input, OnInit } from '@angular/core';
import { LoadingController, ModalController, IonHeader, IonToolbar, IonButton, IonButtons, IonTitle, IonContent } from '@ionic/angular/standalone';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { payments_type } from 'src/app/interfaces/payments_type';
import { UtilsService } from 'src/app/services/utils/utils.service';
import { brandConfig } from 'src/app/branding/brand-config';

@Component({
  selector: 'app-payments-type',
  templateUrl: './payments-type.component.html',
  styleUrls: ['./payments-type.component.scss'],
  imports: [IonButton, IonContent, IonHeader, IonTitle, IonToolbar, CommonModule, FormsModule, IonButtons]
})
export class PaymentsTypeComponent implements OnInit {
  @Input() payments: payments_type[] = [];
  protected brand = brandConfig;

  constructor(private loadingController: LoadingController, private utilSvc: UtilsService, private modalCtrl: ModalController) { }

  ngOnInit() {
    if (this.payments.length <= 0) {
      this.utilSvc.getPaymentsType().then((data) => {
        if (data.status === 200) {
          this.payments = data.data.data;
        }
      })
    }
  }

  cancel() {
    return this.modalCtrl.dismiss(null, 'cancel');
  }

  confirm(payment) {
    return this.modalCtrl.dismiss(payment, 'confirm');
  }

}
