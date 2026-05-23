import { Component, Input, OnInit } from '@angular/core';
import { AlertController, ModalController, IonButton, IonContent, IonHeader, IonTitle, IonButtons, IonMenuButton, IonToolbar } from '@ionic/angular/standalone';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { brandConfig } from 'src/app/branding/brand-config';

@Component({
  selector: 'app-client-detail',
  templateUrl: './client-detail.component.html',
  styleUrls: ['./client-detail.component.scss'],
  imports: [IonButton, IonContent, IonHeader, IonTitle, IonToolbar, IonButtons, CommonModule, FormsModule]
})
export class ClientDetailComponent implements OnInit {
  @Input() client;
  protected brand = brandConfig;

  constructor(private alertController: AlertController, private modalCtrl: ModalController) { }

  cancel() {
    return this.modalCtrl.dismiss(null, 'cancel');
  }

  confirm() {
    return this.modalCtrl.dismiss(null, 'confirm');
  }

  protected clientName() {
    return this.client?.NOMEFANTASIA || this.client?.RAZAOSOCIAL || 'Cliente sem nome';
  }

  protected status() {
    const overdue = Number(this.client?.VALOR_VENCIDO || 0);
    const open = Number(this.client?.VALOR_ABERTO || 0);
    const limit = Number(this.client?.LIMITECREDITO || 0);

    if (overdue > 0) {
      return { label: 'Devedor', className: 'danger', text: 'Cliente com valor vencido' };
    }

    if (open > 0) {
      return { label: 'Em aberto', className: 'warning', text: 'Cliente com valores a vencer' };
    }

    if (limit > 0) {
      return { label: 'Bom limite', className: 'success', text: 'Cliente com limite saudavel' };
    }

    return { label: 'Neutro', className: 'neutral', text: 'Sem alerta financeiro' };
  }

  protected availableLimit() {
    return Math.max(
      Number(this.client?.LIMITECREDITO || 0) - Number(this.client?.VALOR_ABERTO || 0) - Number(this.client?.VALOR_VENCIDO || 0),
      0
    );
  }

  protected conceptClass() {
    const concept = String(this.client?.DESC_CONCEITO || '').toUpperCase();

    if (concept === 'OTIMO' || concept === 'BOM') {
      return 'success';
    }

    if (concept === 'REGULAR' || concept === 'RUIM') {
      return 'warning';
    }

    return concept ? 'danger' : 'neutral';
  }

  async ngOnInit() {

  }
}
