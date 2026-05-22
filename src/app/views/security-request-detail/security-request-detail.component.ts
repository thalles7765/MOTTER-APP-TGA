import { CommonModule } from '@angular/common';
import { Component, Input } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { IonButton, IonButtons, IonContent, IonHeader, IonIcon, IonTextarea, IonTitle, IonToolbar, ModalController } from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { checkmarkCircle, closeCircle, desktop, documentText, lockClosed, person, time } from 'ionicons/icons';
import { brandConfig } from 'src/app/branding/brand-config';
import { security_request } from 'src/app/interfaces/security-request';

@Component({
  selector: 'app-security-request-detail',
  templateUrl: './security-request-detail.component.html',
  styleUrls: ['./security-request-detail.component.scss'],
  standalone: true,
  imports: [CommonModule, FormsModule, IonButton, IonButtons, IonContent, IonHeader, IonIcon, IonTextarea, IonTitle, IonToolbar]
})
export class SecurityRequestDetailComponent {
  @Input() request!: security_request;

  protected brand = brandConfig;
  protected message = '';

  constructor(private modalCtrl: ModalController) {
    addIcons({ checkmarkCircle, closeCircle, desktop, documentText, lockClosed, person, time });
  }

  statusText(status: string) {
    if (status === 'L') {
      return 'Liberado';
    }

    if (status === 'B') {
      return 'Bloqueado';
    }

    return 'Aguardando';
  }

  statusClass(status: string) {
    if (status === 'L') {
      return 'released';
    }

    if (status === 'B') {
      return 'blocked';
    }

    return 'waiting';
  }

  cancel() {
    return this.modalCtrl.dismiss(null, 'cancel');
  }

  release() {
    return this.modalCtrl.dismiss({
      status: 'L',
      message: this.message || 'Liberado'
    }, 'confirm');
  }

  block() {
    return this.modalCtrl.dismiss({
      status: 'B',
      message: this.message || 'Bloqueado'
    }, 'confirm');
  }
}
