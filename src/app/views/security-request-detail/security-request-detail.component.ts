import { CommonModule } from '@angular/common';
import { Component, Input } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { IonButton, IonButtons, IonContent, IonHeader, IonIcon, IonTextarea, IonTitle, IonToolbar, ModalController } from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { business, checkmarkCircle, closeCircle, desktop, documentText, lockClosed, person, time } from 'ionicons/icons';
import { brandConfig } from 'src/app/branding/brand-config';
import { branch } from 'src/app/interfaces/branch';
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
  @Input() branches: branch[] = [];

  protected brand = brandConfig;
  protected message = '';

  constructor(private modalCtrl: ModalController) {
    addIcons({ business, checkmarkCircle, closeCircle, desktop, documentText, lockClosed, person, time });
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

  branchName() {
    return this.requestBranch()?.NOMEFANTASIA || 'Filial nao encontrada';
  }

  branchDocument() {
    return this.requestBranch()?.CGC || 'CNPJ nao informado';
  }

  branchCity() {
    const currentBranch = this.requestBranch();

    if (!currentBranch) {
      return 'Cidade nao informada';
    }

    return `${currentBranch.CIDADE} - ${currentBranch.ESTADO}`;
  }

  branchAddress() {
    const currentBranch = this.requestBranch();

    if (!currentBranch) {
      return 'Endereco nao informado';
    }

    return [
      currentBranch.RUA,
      currentBranch.NUMERO,
      currentBranch.COMPLEMENTO,
      currentBranch.BAIRRO,
      currentBranch.CEP
    ].filter(Boolean).join(', ');
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

  private requestBranch() {
    return this.branches.find((item) => item.CODFILIAL === this.request.CODFILIAL) || null;
  }
}
