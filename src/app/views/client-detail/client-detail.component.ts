import { Component, Input, OnInit } from '@angular/core';
import { AlertController, ModalController, IonButton, IonContent, IonHeader, IonTitle, IonButtons, IonMenuButton, IonToolbar } from '@ionic/angular/standalone';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { brandConfig } from 'src/app/branding/brand-config';
import { app_user } from 'src/app/interfaces/app-user';
import { branch } from 'src/app/interfaces/branch';
import { AuthService } from 'src/app/services/auth/auth.service';
import { BranchService } from 'src/app/services/branches/branch.service';
import { ClientService } from 'src/app/services/clients/client.service';

@Component({
  selector: 'app-client-detail',
  templateUrl: './client-detail.component.html',
  styleUrls: ['./client-detail.component.scss'],
  imports: [IonButton, IonContent, IonHeader, IonTitle, IonToolbar, IonButtons, CommonModule, FormsModule]
})
export class ClientDetailComponent implements OnInit {
  @Input() client;
  protected brand = brandConfig;
  protected currentUser: app_user | null = null;
  protected selectedBranch: branch | null = null;
  protected editing = false;
  protected saving = false;
  protected form: any = {};

  constructor(
    private alertController: AlertController,
    private modalCtrl: ModalController,
    private authSvc: AuthService,
    private branchSvc: BranchService,
    private clientSvc: ClientService
  ) { }

  cancel() {
    return this.modalCtrl.dismiss(null, 'cancel');
  }

  confirm() {
    return this.modalCtrl.dismiss(null, 'confirm');
  }

  protected canEditClient() {
    return Boolean(this.currentUser?.admin || this.currentUser?.edit_client);
  }

  protected canEditSensitive() {
    return Boolean(this.currentUser?.admin);
  }

  protected startEdit() {
    if (!this.canEditClient()) {
      return;
    }

    this.form = this.buildForm(this.client);
    this.editing = true;
  }

  protected cancelEdit() {
    this.form = this.buildForm(this.client);
    this.editing = false;
  }

  protected async saveClient() {
    if (!this.canEditClient() || !this.client?.CODCFO) {
      return;
    }

    this.saving = true;

    try {
      const payload = this.buildPayload();
      const response = await this.clientSvc.updateClient(this.client.CODCFO, payload);
      const updatedClient = response.data?.data || response.data || payload;
      this.client = { ...this.client, ...payload, ...updatedClient };
      this.form = this.buildForm(this.client);
      this.editing = false;
      await this.showMessage('Cliente atualizado com sucesso.');
      await this.modalCtrl.dismiss(this.client, 'saved');
    } catch (error) {
      await this.showMessage('Nao foi possivel atualizar o cliente.');
    } finally {
      this.saving = false;
    }
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
    this.currentUser = await this.authSvc.getCurrentUser();
    this.selectedBranch = await this.branchSvc.getSelectedBranch();
    this.form = this.buildForm(this.client);
  }

  private buildForm(client: any) {
    return {
      NOMEFANTASIA: client?.NOMEFANTASIA || '',
      RAZAOSOCIAL: client?.RAZAOSOCIAL || '',
      TELEFONE: client?.TELEFONE || '',
      EMAIL: client?.EMAIL || '',
      RUA: client?.RUA || '',
      NUMERO: client?.NUMERO || '',
      BAIRRO: client?.BAIRRO || '',
      CIDADE: client?.CIDADE || '',
      ESTADO: client?.ESTADO || '',
      CEP: client?.CEP || '',
      LIMITECREDITO: Number(client?.LIMITECREDITO || 0),
      DESC_CONCEITO: client?.DESC_CONCEITO || '',
    };
  }

  private buildPayload() {
    const payload: any = {
      CODFILIAL: Number(this.selectedBranch?.CODFILIAL || this.client?.CODFILIAL || 1),
      NOMEFANTASIA: this.form.NOMEFANTASIA,
      RAZAOSOCIAL: this.form.RAZAOSOCIAL,
      TELEFONE: this.form.TELEFONE,
      EMAIL: this.form.EMAIL,
      RUA: this.form.RUA,
      NUMERO: this.form.NUMERO,
      BAIRRO: this.form.BAIRRO,
      CIDADE: this.form.CIDADE,
      ESTADO: this.form.ESTADO,
      CEP: this.form.CEP,
    };

    if (this.canEditSensitive()) {
      payload.LIMITECREDITO = Number(this.form.LIMITECREDITO || 0);
      payload.DESC_CONCEITO = this.form.DESC_CONCEITO;
    }

    return payload;
  }

  private async showMessage(message: string) {
    const alert = await this.alertController.create({
      header: 'Cliente',
      message,
      buttons: ['Fechar'],
    });

    await alert.present();
  }
}
