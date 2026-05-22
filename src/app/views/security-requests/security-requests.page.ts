import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { IonButton, IonButtons, IonContent, IonHeader, IonIcon, IonMenuButton, IonTitle, IonToolbar, LoadingController, ModalController, ToastController } from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { checkmarkCircle, closeCircle, desktop, eye, refresh, shieldCheckmark, time } from 'ionicons/icons';
import { brandConfig } from 'src/app/branding/brand-config';
import { branch } from 'src/app/interfaces/branch';
import { security_request } from 'src/app/interfaces/security-request';
import { BranchService } from 'src/app/services/branches/branch.service';
import { SecurityService } from 'src/app/services/security/security.service';
import { SecurityRequestDetailComponent } from '../security-request-detail/security-request-detail.component';

type SecurityStatusFilter = 'all' | 'A' | 'L' | 'B';

@Component({
  selector: 'app-security-requests',
  templateUrl: './security-requests.page.html',
  styleUrls: ['./security-requests.page.scss'],
  standalone: true,
  imports: [CommonModule, IonButton, IonButtons, IonContent, IonHeader, IonIcon, IonMenuButton, IonTitle, IonToolbar]
})
export class SecurityRequestsPage implements OnInit {
  protected brand = brandConfig;
  protected selectedBranch: branch | null = null;
  protected requests: security_request[] = [];
  protected activeFilter: SecurityStatusFilter = 'A';

  protected filterOptions: { key: SecurityStatusFilter; label: string }[] = [
    { key: 'A', label: 'Aguardando' },
    { key: 'L', label: 'Liberados' },
    { key: 'B', label: 'Bloqueados' },
    { key: 'all', label: 'Todos' },
  ];

  constructor(
    private branchSvc: BranchService,
    private securitySvc: SecurityService,
    private loadingController: LoadingController,
    private modalController: ModalController,
    private toastController: ToastController
  ) {
    addIcons({ checkmarkCircle, closeCircle, desktop, eye, refresh, shieldCheckmark, time });
  }

  async ngOnInit() {
    await this.loadRequests();
  }

  get filteredRequests() {
    if (this.activeFilter === 'all') {
      return this.requests;
    }

    return this.requests.filter((request) => request.STATUS === this.activeFilter);
  }

  get waitingCount() {
    return this.requests.filter((request) => request.STATUS === 'A').length;
  }

  async loadRequests() {
    const loading = await this.loadingController.create({ message: 'Carregando solicitações...' });

    try {
      await loading.present();
      this.selectedBranch = await this.branchSvc.getSelectedBranch();

      if (!this.selectedBranch) {
        this.requests = [];
        await this.showToast('Selecione uma filial para visualizar as solicitações.');
        return;
      }

      this.requests = await this.securitySvc.getRequests(this.selectedBranch.CODFILIAL);
    } catch (error) {
      await this.showToast('Não foi possível carregar as solicitações.');
    } finally {
      await loading.dismiss();
    }
  }

  setFilter(filter: SecurityStatusFilter) {
    this.activeFilter = filter;
  }

  isFilterActive(filter: SecurityStatusFilter) {
    return this.activeFilter === filter;
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

  async openRequest(request: security_request) {
    const modal = await this.modalController.create({
      component: SecurityRequestDetailComponent,
      componentProps: { request },
      cssClass: 'security-request-modal'
    });

    await modal.present();
    const { data, role } = await modal.onWillDismiss<{ status: 'L' | 'B'; message: string }>();

    if (role === 'confirm' && data) {
      await this.updateRequest(request, data.status, data.message);
    }
  }

  async updateRequest(request: security_request, status: 'L' | 'B', message: string) {
    const previousStatus = request.STATUS;
    request.STATUS = status;

    try {
      await this.securitySvc.updateRequest({
        ID: request.IDSOLICITA,
        CODFILIAL: request.CODFILIAL,
        STATUS: status,
        MENSAGEM: message || this.statusText(status)
      });

      await this.showToast(status === 'L' ? 'Solicitação liberada.' : 'Solicitação bloqueada.');
      await this.loadRequests();
    } catch (error) {
      request.STATUS = previousStatus;
      await this.showToast('Não foi possível atualizar a solicitação.');
    }
  }

  private async showToast(message: string) {
    const toast = await this.toastController.create({
      message,
      duration: 2200,
      position: 'top'
    });

    await toast.present();
  }
}
