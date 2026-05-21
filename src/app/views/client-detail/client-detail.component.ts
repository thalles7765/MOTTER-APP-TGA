import { Component, Input, OnInit } from '@angular/core';
import { AlertController, ModalController, IonButton, IonContent, IonHeader, IonTitle, IonButtons, IonMenuButton, IonToolbar } from '@ionic/angular/standalone';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-client-detail',
  templateUrl: './client-detail.component.html',
  styleUrls: ['./client-detail.component.scss'],
  imports: [IonButton, IonContent, IonHeader, IonTitle, IonToolbar, IonButtons, CommonModule, FormsModule]
})
export class ClientDetailComponent implements OnInit {
  @Input() client;

  constructor(private alertController: AlertController, private modalCtrl: ModalController) { }

  cancel() {
    return this.modalCtrl.dismiss(null, 'cancel');
  }

  confirm() {
    return this.modalCtrl.dismiss(null, 'confirm');
  }

  async ngOnInit() {

  }
}
