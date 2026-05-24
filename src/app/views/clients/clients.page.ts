import { Component, inject, Input, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { LoadingController, ModalController, ToastController, IonSearchbar, IonHeader, IonToolbar, IonButton, IonButtons, IonMenuButton, IonTitle, IonContent } from '@ionic/angular/standalone';
import { ClientService } from 'src/app/services/clients/client.service';
import { ClientDetailComponent } from '../client-detail/client-detail.component';
import { brandConfig } from 'src/app/branding/brand-config';
import { Preferences } from '@capacitor/preferences';

type SearchMode = 'contains' | 'starts' | 'equals';

const clientSearchModeKey = 'clients_search_mode';

@Component({
  selector: 'app-clients',
  templateUrl: './clients.page.html',
  styleUrls: ['./clients.page.scss'],
  imports: [IonButton, IonSearchbar, IonContent, IonHeader, IonTitle, IonToolbar, CommonModule, FormsModule, IonButtons, IonMenuButton]
})
export class ClientsPage implements OnInit {
  @Input() status_modal = 0;

  private clientSvc = inject(ClientService);
  protected brand = brandConfig;
  protected clients: any[] = [];
  protected searchQuery = '';
  protected searchMode: SearchMode = 'contains';
  protected showFilters = false;
  protected activeFilter: 'all' | 'debtor' | 'open' | 'goodLimit' | 'noLimit' = 'all';
  protected searchModeOptions: { key: SearchMode; label: string }[] = [
    { key: 'starts', label: 'Inicia' },
    { key: 'contains', label: 'Contem' },
    { key: 'equals', label: 'Igual' },
  ];
  protected filterOptions = [
    { key: 'all', label: 'Todos' },
    { key: 'debtor', label: 'Devedores' },
    { key: 'open', label: 'A vencer' },
    { key: 'goodLimit', label: 'Bom limite' },
    { key: 'noLimit', label: 'Sem limite' },
  ] as const;

  constructor(private loadingController: LoadingController, private modalCtrl: ModalController, private toastController: ToastController) { }

  async ngOnInit() {
    await this.loadSavedSearchMode();
    await this.getClients();
  }

  cancel() {
    return this.modalCtrl.dismiss(null, 'cancel');
  }

  confirm(client) {
    return this.modalCtrl.dismiss(client, 'confirm');
  }

  protected clientName(client: any) {
    return client?.NOMEFANTASIA || client?.RAZAOSOCIAL || 'Cliente sem nome';
  }

  protected get filteredClients() {
    if (this.activeFilter === 'debtor') {
      return this.clients.filter((client) => Number(client?.VALOR_VENCIDO || 0) > 0);
    }

    if (this.activeFilter === 'open') {
      return this.clients.filter((client) => Number(client?.VALOR_ABERTO || 0) > 0 && Number(client?.VALOR_VENCIDO || 0) <= 0);
    }

    if (this.activeFilter === 'goodLimit') {
      return this.clients.filter((client) => Number(client?.LIMITECREDITO || 0) > 0 && Number(client?.VALOR_VENCIDO || 0) <= 0);
    }

    if (this.activeFilter === 'noLimit') {
      return this.clients.filter((client) => Number(client?.LIMITECREDITO || 0) <= 0);
    }

    return this.clients;
  }

  protected clientStatus(client: any) {
    const overdue = Number(client?.VALOR_VENCIDO || 0);
    const open = Number(client?.VALOR_ABERTO || 0);
    const limit = Number(client?.LIMITECREDITO || 0);

    if (overdue > 0) {
      return { label: 'Devedor', className: 'danger', note: 'Possui parcelas vencidas' };
    }

    if (open > 0) {
      return { label: 'Em aberto', className: 'warning', note: 'Tem títulos a vencer' };
    }

    if (limit > 100) {
      return { label: 'Bom limite', className: 'success', note: 'Crédito disponível' };
    }

    return { label: 'Neutro', className: 'neutral', note: 'Sem movimentação financeira' };
  }

  protected availableLimit(client: any) {
    return Math.max(Number(client?.LIMITECREDITO || 0) - Number(client?.VALOR_ABERTO || 0) - Number(client?.VALOR_VENCIDO || 0), 0);
  }

  async copyClientWhatsapp(client: any, event?: Event) {
    event?.stopPropagation();

    const text = [
      `*${this.clientName(client)}*`,
      '',
      '*Cadastro*',
      `Codigo: ${client?.CODCFO || 'N/A'}`,
      `Razao Social: ${client?.RAZAOSOCIAL || 'N/A'}`,
      `CPF/CNPJ: ${client?.CGCCFO || 'N/A'}`,
      '',
      '*Contato*',
      `Telefone: ${client?.TELEFONE || 'N/A'}`,
      `Email: ${client?.EMAIL || 'N/A'}`,
      '',
      '*Endereco*',
      `${client?.RUA || 'N/A'}, ${client?.NUMERO || 'S/N'}`,
      `${client?.BAIRRO || 'N/A'} - ${client?.CIDADE || 'N/A'} / ${client?.ESTADO || 'N/A'}`,
      `CEP: ${client?.CEP || 'N/A'}`,
      '',
      '*Financeiro*',
      `Limite: ${this.formatCurrency(client?.LIMITECREDITO)}`,
      `Disponivel: ${this.formatCurrency(this.availableLimit(client))}`,
      `A vencer: ${this.formatCurrency(client?.VALOR_ABERTO)}`,
      `Vencido: ${this.formatCurrency(client?.VALOR_VENCIDO)}`,
      `Conceito: ${client?.DESC_CONCEITO || 'N/A'}`,
      '',
      '*Movimentacao*',
      `Ultima compra: ${this.formatDate(client?.DATAULTMOVIMENTO)}`,
      `Ultima alteracao: ${this.formatDate(client?.DATAULTALTERACAO)}`,
    ].join('\n');

    await navigator.clipboard.writeText(text);
    await this.showToast('Dados do cliente copiados para WhatsApp.');
  }

  protected conceptClass(client: any) {
    const concept = String(client?.DESC_CONCEITO || '').toUpperCase();

    if (concept === 'OTIMO' || concept === 'BOM') {
      return 'success';
    }

    if (concept === 'REGULAR' || concept === 'RUIM') {
      return 'warning';
    }

    return concept ? 'danger' : 'neutral';
  }

  setFilter(filter: 'all' | 'debtor' | 'open' | 'goodLimit' | 'noLimit') {
    this.activeFilter = filter;
  }

  setSearchMode(mode: SearchMode) {
    this.searchMode = mode;
  }

  async saveSearchMode() {
    await Preferences.set({ key: clientSearchModeKey, value: this.searchMode });
    this.showFilters = false;
    await this.showToast('Tipo de pesquisa salvo.');
  }

  async searchClients() {
    const query = this.searchQuery.toUpperCase();
    const loading = await this.loadingController.create({ message: 'Carregando informações...' });

    try {
      await loading.present();
      await this.clientSvc.getData({ search: query, search_type: this.searchMode }).then(async (data) => {

        if (data.status === 200) {
          this.clients = data.data.data;
        } else {
          console.log('Erro na requisição')
          console.log(data)
        }
      }).catch(async () => await loading.dismiss())

      await loading.dismiss();
    } catch (error) {
      await loading.dismiss();
    }
  }

  async openModal(xCliente) {
    const modal = await this.modalCtrl.create({
      component: ClientDetailComponent,
      componentProps: { client: xCliente }
    });

    modal.present();

    const { data, role } = await modal.onWillDismiss();
    // if (role === 'confirm') {
    //   this.message = `Hello, ${data}!`;
    // }
  }

  async showLoading() {
    const loading = await this.loadingController.create();
    await loading.present();

    setTimeout(async () => {
      await loading.dismiss();
    }, 1800);
  }

  async getClients() {
    // await this.showLoading();
    const loading = await this.loadingController.create({ message: 'Carregando informações...' });
    try {
      await loading.present();
      await this.clientSvc.getData({ search_type: this.searchMode }).then(async (data) => {
        if (data.status === 200) {
          this.clients = data.data.data;
        } else {
          console.log('@@@')
          console.log(data)
        }
        await loading.dismiss()
      }).catch(async () => await loading.dismiss())
    } catch (error) {
      await loading.dismiss();
    }


  }

  private formatCurrency(value: any) {
    return Number(value || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
  }

  private formatDate(value: any) {
    return value ? new Date(value).toLocaleDateString('pt-BR') : 'N/A';
  }

  private async showToast(message: string) {
    const toast = await this.toastController.create({
      message,
      duration: 1800,
      position: 'top'
    });

    await toast.present();
  }

  private async loadSavedSearchMode() {
    const saved = await Preferences.get({ key: clientSearchModeKey });
    const value = saved.value as SearchMode | null;

    if (value === 'starts' || value === 'contains' || value === 'equals') {
      this.searchMode = value;
    }
  }

}
