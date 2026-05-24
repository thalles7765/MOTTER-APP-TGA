import { Component, Input, OnInit, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ToastController, LoadingController, AlertController, ModalController, IonModal, IonIcon, IonFab, IonFabButton, IonButton, IonContent, IonHeader, IonTitle, IonButtons, IonDatetime, IonToolbar, IonInput, IonItem } from '@ionic/angular/standalone';
import { ProductsPage } from '../products/products.page';
import { ClientsPage } from '../clients/clients.page';
import { order } from 'src/app/interfaces/order';
import { order_item } from 'src/app/interfaces/order_item';
import { UtilsService } from 'src/app/services/utils/utils.service';
import { movements_type } from 'src/app/interfaces/movements_type';
import { payments_type } from 'src/app/interfaces/payments_type';
import { MovementsTypeComponent } from '../modals/movements-type/movements-type.component';
import { PaymentsTypeComponent } from '../modals/payments-type/payments-type.component';
import { client } from 'src/app/interfaces/client';
import { ClientService } from 'src/app/services/clients/client.service';
import { addIcons } from 'ionicons';
import {
  add,
  checkmark,
  eye,
  trash
} from 'ionicons/icons';
import { OrdersService } from 'src/app/services/orders/orders.service';
import { SellersComponent } from '../modals/sellers/sellers.component';
import { sellers } from 'src/app/interfaces/sellers';
import { ConfigService } from 'src/app/services/config/config.service';
import { brandConfig } from 'src/app/branding/brand-config';
import { AuthService } from 'src/app/services/auth/auth.service';
import { app_user } from 'src/app/interfaces/app-user';
import { BranchService } from 'src/app/services/branches/branch.service';
import { branch } from 'src/app/interfaces/branch';

@Component({
  selector: 'app-order-new',
  templateUrl: './order-new.component.html',
  styleUrls: ['./order-new.component.scss'],
  imports: [IonItem, IonInput, IonModal, IonButton, IonDatetime, IonIcon, IonContent, IonHeader, IonTitle, IonFab, IonFabButton, IonToolbar, IonButtons, CommonModule, FormsModule]
})
export class OrderNewComponent implements OnInit {
  @Input() editOrderData: order | null = null;
  @Input() editOrderItems: order_item[] | null = null;
  @ViewChild('modalQtd', { static: true }) modalQtd!: IonModal;
  protected brand = brandConfig;
  protected isOpenModal: boolean = false;
  protected typeModal = 1; //1 = QUANTIDADE; 2 = DESCONTO;
  protected qtdOpt: boolean = false;
  private config;
  private currentUser: app_user | null = null;
  protected selectedBranch: branch | null = null;
  protected order = {} as order;
  protected sellers: sellers[] = [];
  protected pays_type: payments_type[] = [];
  protected mov_type: movements_type[] = [];
  protected client_selected = {} as client;
  protected showDate: boolean = false;
  protected showHeader: boolean = true;
  protected hiddenHeader: boolean = false;
  protected isEditMode = false;


  protected product_selected!: order_item | null;

  constructor(private cfgSvc: ConfigService, private authSvc: AuthService, private branchSvc: BranchService, private toastC: ToastController, private loadingController: LoadingController, private orderSvc: OrdersService, private alertController: AlertController, private clientSvc: ClientService, private utilSvc: UtilsService, private modalCtrl: ModalController) {
    addIcons({ add, checkmark, eye, trash })
  }

  async ngOnInit() {
    const loading = await this.loadingController.create({ message: 'Carregando informações...' });
    try {
      await loading.present();
      this.currentUser = await this.authSvc.getCurrentUser();
      this.selectedBranch = await this.branchSvc.getSelectedBranch();

      await this.clientSvc.getData({ codcfo: 'C00001' }).then((data) => {
        console.log('select client')
        console.log(data)
        if (data.status === 200) {
          this.client_selected = this.searchByField(data.data.data, 'CODCFO', 'C00001');
        }
      })

      await this.cfgSvc.getData().then((data) => {
        if (data.status === 200) {
          this.config = data.data.data;
        }
      })

      await this.utilSvc.getSellers().then((data) => {
        if (data.status === 200) {
          this.sellers = data.data.data;
        }
      })

      await this.utilSvc.getMovementsType().then((data) => {
        if (data.status === 200) {
          this.mov_type = data.data.data;
        }
      })

      await this.utilSvc.getPaymentsType().then((data) => {
        if (data.status === 200) {
          this.pays_type = data.data.data;
        }
      })


      if (this.editOrderData) {
        this.hydrateEditOrder(this.editOrderData, this.editOrderItems || []);
      } else {
        this.createMov();
      }
      await loading.dismiss();

      // console.log(this.searchByField(this.pays_type, 'CODCONDPGTO', '00'))
    } catch (error) {
      await loading.dismiss();
      console.log('Erro ao iniciar movimento, verifique o log...')
      console.log(error)

      this.showToast("top", 'Erro ao buscar dados...', 'danger');
      this.cancel();
    }

  }

  async showToast(position: 'top' | 'middle' | 'bottom', message_toast = '', color_toast = 'primary', time_toast = 1500) {
    const toast = await this.toastC.create({
      message: message_toast,
      duration: time_toast,
      position: position,
      color: color_toast
    });

    await toast.present();
  }

  createMov() {
    const defaultMovement = this.currentUser?.default_movement || '2.1.01';
    const defaultSeller = this.currentUser?.default_seller || this.config?.codven;

    this.order.CODEMPRESA = Number(this.selectedBranch?.CODEMPRESA || 1);
    this.order.CODFILIAL = Number(this.selectedBranch?.CODFILIAL || this.currentUser?.default_branch || 1);
    this.order.CODLOC = '001'; // LOCAL PADRAO
    this.order.CODTMV = defaultMovement; // ORCAMENTO
    this.order.CODCFO = 'C00001'; // CONSUMIDOR
    this.order.CODCPG = '00'; // 00 = AVISTA
    this.order.DATAEMISSAO = new Date();
    this.order.DATAMOVIMENTO = new Date();
    this.order.DATASAIDA = new Date();
    this.order.STATUS = 'F';
    this.order.STATUSPEDIDO = 'D';
    this.order.PERCENTUALDESC = 0;
    this.order.VALORDESC = 0;
    this.order.VALOROUTROS = 0;
    this.order.VALORTOTALPRODUTO = 0;
    this.order.VALORBRUTO = 0;
    this.order.VALORLIQUIDO = 0;
    this.order.CODVEN1 = defaultSeller;
    // this.order.ITEMS = [];
    this.order.CLIENTE = this.client_selected;
    this.order.VENDEDOR = this.searchByField(this.sellers, 'CODVEN', defaultSeller) || this.sellers[0] || null;
    this.order.MOVIMENTO = this.searchByField(this.mov_type, 'CODTIPOMOV', defaultMovement) || this.searchByField(this.mov_type, 'CODTIPOMOV', '2.1.01') || this.mov_type[0] || null;
    this.order.PAGAMENTO = this.searchByField(this.pays_type, 'CODCONDPGTO', '00') || this.pays_type[0] || null;

  }

  protected branchLabel() {
    const codfilial = this.order?.CODFILIAL || this.selectedBranch?.CODFILIAL;
    const branchName = this.selectedBranch?.NOMEFANTASIA;
    const branchCity = this.selectedBranch?.CIDADE;

    if (branchName) {
      return `${codfilial} - ${branchName}`;
      // return `${codfilial} - ${branchName}${branchCity ? ` / ${branchCity}` : ''}`;
    }

    return codfilial ? `Filial ${codfilial}` : 'Filial nao definida';
  }

  private hydrateEditOrder(orderData: any, orderItems: any[]) {
    this.isEditMode = true;
    this.order = {
      ...orderData,
      CODEMPRESA: Number(orderData.CODEMPRESA || 1),
      IDMOV: Number(orderData.IDMOV),
      CODFILIAL: Number(orderData.CODFILIAL || 0),
      CODLOC: orderData.CODLOC || '001',
      CODTMV: orderData.CODTMV,
      CODCFO: orderData.CODCFO,
      CODCPG: orderData.CODCPG,
      CODVEN1: orderData.CODVEN1,
      STATUSPEDIDO: orderData.STATUSPEDIDO || 'D',
      VALORDESC: Number(orderData.VALORDESC || 0),
      PERCENTUALDESC: Number(orderData.PERCENTUALDESC || 0),
      VALOROUTROS: Number(orderData.VALOROUTROS || orderData.VALORBRUTO || 0),
      VALORTOTALPRODUTO: Number(orderData.VALORTOTALPRODUTO || orderData.VALORBRUTO || 0),
      VALORBRUTO: Number(orderData.VALORBRUTO || 0),
      VALORLIQUIDO: Number(orderData.VALORLIQUIDO || 0),
      OBSERVACAO: orderData.OBSERVACAO || '',
      CLIENTE: this.searchByField(this.client_selected ? [this.client_selected] : [], 'CODCFO', orderData.CODCFO) || {
        CODCFO: orderData.CODCFO,
        NOMEFANTASIA: orderData.NOMECONSUMIDOR || orderData.NOMEFANTASIA,
      } as any,
      VENDEDOR: this.searchByField(this.sellers, 'CODVEN', orderData.CODVEN1) || {
        CODVEN: orderData.CODVEN1,
        NOME: orderData.VENDEDOR,
      } as any,
      MOVIMENTO: this.searchByField(this.mov_type, 'CODTIPOMOV', orderData.CODTMV) || {
        CODTIPOMOV: orderData.CODTMV,
        NOME: orderData.NOME,
        DESCMAXIMOMOV: 100,
      } as any,
      PAGAMENTO: this.searchByField(this.pays_type, 'CODCONDPGTO', orderData.CODCPG) || {
        CODCONDPGTO: orderData.CODCPG,
        NOME: orderData.DESC_CONDPGTO,
      } as any,
      ITEMS: this.normalizeEditItems(orderItems),
    } as order;

    if (this.order.ITEMS?.length) {
      this.showHeader = false;
      this.hiddenHeader = true;
    }

    this.recalcValueTotal(this.order.ITEMS);
  }

  private normalizeEditItems(items: any[]) {
    return (items || [])
      .map((item, index) => this.normalizeOrderItem(item, Number(item.NSEQ || index + 1)))
      .sort((a, b) => Number(a.NSEQ || 0) - Number(b.NSEQ || 0));
  }

  private normalizeOrderItem(item: any, nseq: number) {
    const unitPrice = Number(item.PRECOUNITARIO ?? item.PRECO2 ?? item.VALORUNITARIO ?? item.PRECOBASE ?? 0);
    const quantity = Number(item.QUANTIDADE || 1);
    const total = Number(item.VALORTOTALITEM ?? (quantity * unitPrice));

    return {
      ...item,
      CODEMPRESA: Number(item.CODEMPRESA || this.order?.CODEMPRESA || 1),
      IDMOV: Number(item.IDMOV || this.order?.IDMOV || 0),
      NSEQ: nseq,
      QUANTIDADE: quantity,
      PRECO2: unitPrice,
      PRECOUNITARIO: unitPrice,
      VALORUNITARIO: Number(item.VALORUNITARIO ?? unitPrice),
      PRECOBASE: Number(item.PRECOBASE ?? unitPrice),
      PRECOTABELA: Number(item.PRECOTABELA ?? unitPrice),
      VALORTOTALITEM: total,
      VALORFINANCEIRO: Number(item.VALORFINANCEIRO ?? total),
      VALORDESC: Number(item.VALORDESC || 0),
      CODUND: item.CODUND || item.CODUND_ECM || item.UNIDADE || 'UN',
      UNIDADE: item.UNIDADE || item.CODUND || item.CODUND_ECM || 'UN',
      CODSIT: item.CODSIT || '01',
      STATUS: item.STATUS || 'D',
      CUSTOMEDIO: Number(item.CUSTOMEDIO || 0),
      CUSTOUNITARIO: Number(item.CUSTOUNITARIO || item.CUSTOMEDIO || 0),
    } as order_item;
  }

  searchByField(array, field = '', value = ''): any {
    if (array.length > 0) {
      // return array.find(item => item[field] === value);
      const foundItem = array.find(item => item[field] === value);
      return foundItem || null;

    } else {
      return null;
    }
  }

  changeDate(eventPc) {
    this.order.DATAEMISSAO = eventPc.detail.value;
    this.order.DATAMOVIMENTO = eventPc.detail.value;
    this.order.DATASAIDA = eventPc.detail.value;
  }

  decrementQtd(xProduct) {
    if (this.order.ITEMS[this.order.ITEMS.indexOf(xProduct)].QUANTIDADE > 1) {
      this.order.ITEMS[this.order.ITEMS.indexOf(xProduct)].QUANTIDADE--;
      this.order.ITEMS[this.order.ITEMS.indexOf(xProduct)].VALORTOTALITEM = this.order.ITEMS[this.order.ITEMS.indexOf(xProduct)].QUANTIDADE * this.order.ITEMS[this.order.ITEMS.indexOf(xProduct)].PRECO2;
      this.order.VALOROUTROS -= xProduct.PRECO2;
      this.order.VALORBRUTO -= xProduct.PRECO2;
      this.order.VALORTOTALPRODUTO -= xProduct.PRECO2;
      this.order.VALORLIQUIDO -= xProduct.PRECO2;
    }
  }

  incrementQtd(xProduct, qtd: any = 1, type = 2) {
    if (!qtd)
      qtd = 1

    if (type === 1) {
      this.order.ITEMS[this.order.ITEMS.indexOf(xProduct)].QUANTIDADE = qtd;
      this.order.ITEMS[this.order.ITEMS.indexOf(xProduct)].VALORTOTALITEM = this.order.ITEMS[this.order.ITEMS.indexOf(xProduct)].QUANTIDADE * this.order.ITEMS[this.order.ITEMS.indexOf(xProduct)].PRECO2;
    } else {
      this.order.ITEMS[this.order.ITEMS.indexOf(xProduct)].QUANTIDADE += qtd;
      this.order.ITEMS[this.order.ITEMS.indexOf(xProduct)].VALORTOTALITEM = this.order.ITEMS[this.order.ITEMS.indexOf(xProduct)].QUANTIDADE * this.order.ITEMS[this.order.ITEMS.indexOf(xProduct)].PRECO2;
    }

    this.recalcValueTotal(this.order.ITEMS);
  }

  incrementDiscount(valueDesc: any = 0, increment = 1) {

    if (increment === 1) {
      if (((valueDesc / this.order.VALORBRUTO) * 100) > this.order.MOVIMENTO.DESCMAXIMOMOV) {
        this.showToast('top', 'Desconto maior que permitido!', 'warning');
        return
      }

      this.order.VALORDESC = Number(valueDesc)
      this.order.PERCENTUALDESC = (valueDesc / this.order.VALORBRUTO) * 100;
    } else {
      if (this.order.PERCENTUALDESC + Number(valueDesc) > this.order.MOVIMENTO.DESCMAXIMOMOV) {
        this.showToast('top', 'Desconto maior que permitido!', 'warning');
        return
      }

      this.order.PERCENTUALDESC += Number(valueDesc);
      this.order.VALORDESC = this.order.VALORBRUTO * (this.order.PERCENTUALDESC / 100);
    }

    this.recalcValueTotal(this.order.ITEMS);
  }

  recalcValueTotal(Items: order_item[] | null) {

    let xTotal = 0;
    let xTotalDesc = 0;

    if (Items)
      Items.map((item: order_item) => {
        item.PRECOUNITARIO = Number(item.PRECOUNITARIO ?? item.PRECO2 ?? item.VALORUNITARIO ?? 0);
        item.PRECO2 = Number(item.PRECO2 ?? item.PRECOUNITARIO ?? 0);
        item.VALORUNITARIO = Number(item.VALORUNITARIO ?? item.PRECOUNITARIO ?? item.PRECO2 ?? 0);
        item.VALORTOTALITEM = Number(item.QUANTIDADE || 0) * Number(item.PRECOUNITARIO || item.PRECO2 || 0);
        xTotal += Number(item.VALORTOTALITEM || 0);
        xTotalDesc += Number(item.VALORDESC || 0);
      })

    // this.order.VALORDESC += xTotalDesc;
    // this.order.PERCENTUALDESC = (this.order.VALORDESC / xTotal) * 100;
    this.order.VALORLIQUIDO = xTotal - this.order.VALORDESC;
    this.order.VALOROUTROS = xTotal;
    this.order.VALORBRUTO = xTotal;
    this.order.VALORTOTALPRODUTO = xTotal;

    console.log(this.order.PERCENTUALDESC)
  }



  addProduct(xProduct: order_item) {
    if (!this.order.ITEMS) {
      this.order.ITEMS = [];
    }

    if (this.hiddenHeader === false) {
      this.showHeader = false;
      this.hiddenHeader = !this.hiddenHeader;
    }

    const nextNseq = this.nextItemSequence();
    const newItem = this.normalizeOrderItem({ ...xProduct, QUANTIDADE: 1 }, nextNseq);
    this.order.ITEMS.push(newItem);
    this.showToast('bottom', 'Produto adicionado!');

    this.recalcValueTotal(this.order.ITEMS);
  }

  private nextItemSequence() {
    const items = this.order.ITEMS || [];
    const maxSequence = items.reduce((max, item) => Math.max(max, Number(item.NSEQ || 0)), 0);
    return maxSequence + 1;
  }

    async alertFilial() {
    const alert = await this.alertController.create({
      header: 'Trocar Filial?',
      cssClass: 'order-remove-alert',
      message: [
        `Para alterar a filial do movimento é necessário ir até a tela inicial e selecionar outra.`,
      ].join('\n'),
      buttons: [
        {
          text: 'Fechar',
          role: 'cancel',
        }
      ],
    });

    await alert.present();
  }

  async removeProduct(xProduct: order_item) {
    const alert = await this.alertController.create({
      header: 'Remover produto?',
      cssClass: 'order-remove-alert',
      message: [
        `${xProduct.CODPRD} - ${xProduct.NOMEFANTASIA}\n`,
        `Quantidade: ${Number(xProduct.QUANTIDADE || 0).toLocaleString('pt-BR', { minimumFractionDigits: 4, maximumFractionDigits: 4 })}\n`,
        `Unitario: ${Number(xProduct.PRECOUNITARIO || xProduct.PRECO2 || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}\n`,
        `Total: ${Number(xProduct.VALORTOTALITEM || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}`,
      ].join('\n'),
      buttons: [
        {
          text: 'Manter produto',
          role: 'cancel',
        },
        {
          text: 'Remover da venda',
          role: 'destructive',
          handler: () => this.confirmRemoveProduct(xProduct),
        },
      ],
    });

    await alert.present();
  }

  private confirmRemoveProduct(xProduct: order_item) {
    this.order.ITEMS.splice(this.order.ITEMS.indexOf(xProduct), 1);
    this.showToast('bottom', 'Produto removido!');

    this.recalcValueTotal(this.order.ITEMS);
  }

  async confirmOrder() {
    if (this.isEditMode && this.order.STATUSPEDIDO !== 'D') {
      this.showToast('top', 'Apenas movimentos pendentes podem ser editados.', 'warning');
      return;
    }

    if (!this.order.ITEMS?.length) {
      this.showToast('top', 'Adicione ao menos um produto.', 'warning');
      return;
    }

    this.recalcValueTotal(this.order.ITEMS);
    this.order.ITEMS = this.order.ITEMS.map((item, index) => this.prepareItemPayload(item, index + 1));

    const loading = await this.loadingController.create({ message: this.isEditMode ? 'Atualizando Movimento...' : 'Gerando Movimento...' });
    try {
      await loading.present();
      const request = this.isEditMode ? this.orderSvc.updateOrder(this.buildUpdatePayload()) : this.orderSvc.createOrder(this.order);
      request.then(async (result) => {
        console.log(result);

        if (result.status === 200) {
          this.showToast('bottom', this.isEditMode ? 'Movimento atualizado com sucesso!' : 'Movimento gerado com sucesso!', 'success');
          this.confirm();
        }
        await loading.dismiss();
      }).catch(async (err) => await loading.dismiss())
    } catch {
      await loading.dismiss();
    }
  }

  private prepareItemPayload(item: order_item, sequence: number) {
    const normalizedItem = this.normalizeOrderItem(item, Number(item.NSEQ || sequence));

    return {
      ...normalizedItem,
      CODEMPRESA: Number(this.order.CODEMPRESA || normalizedItem.CODEMPRESA || 1),
      IDMOV: Number(this.order.IDMOV || normalizedItem.IDMOV || 0),
      NSEQ: Number(normalizedItem.NSEQ || sequence),
      CODPRD: normalizedItem.CODPRD,
      QUANTIDADE: Number(normalizedItem.QUANTIDADE || 0),
      PRECOUNITARIO: Number(normalizedItem.PRECOUNITARIO || normalizedItem.PRECO2 || 0),
      VALORTOTALITEM: Number(normalizedItem.VALORTOTALITEM || 0),
      VALORUNITARIO: Number(normalizedItem.VALORUNITARIO || normalizedItem.PRECOUNITARIO || normalizedItem.PRECO2 || 0),
      PRECOBASE: Number(normalizedItem.PRECOBASE || normalizedItem.PRECOUNITARIO || normalizedItem.PRECO2 || 0),
      PRECOTABELA: Number(normalizedItem.PRECOTABELA || normalizedItem.PRECOUNITARIO || normalizedItem.PRECO2 || 0),
      CUSTOMEDIO: Number(normalizedItem.CUSTOMEDIO || 0),
      CUSTOUNITARIO: Number(normalizedItem.CUSTOUNITARIO || normalizedItem.CUSTOMEDIO || 0),
      CODUND: normalizedItem.CODUND || normalizedItem.UNIDADE || 'UN',
      CODSIT: normalizedItem.CODSIT || '01',
      STATUS: (normalizedItem as any).STATUS || 'D',
    } as order_item;
  }

  private buildUpdatePayload() {
    return {
      CODEMPRESA: Number(this.order.CODEMPRESA || 1),
      IDMOV: Number(this.order.IDMOV),
      CODTMV: this.order.CODTMV,
      STATUSPEDIDO: this.order.STATUSPEDIDO || 'D',
      VALORBRUTO: Number(this.order.VALORBRUTO || 0),
      VALORLIQUIDO: Number(this.order.VALORLIQUIDO || 0),
      VALORDESC: Number(this.order.VALORDESC || 0),
      OBSERVACAO: this.order.OBSERVACAO || '',
      ITEMS: this.order.ITEMS,
    } as order;
  }

  async openAddProduct() {
    const modal = await this.modalCtrl.create({
      component: ProductsPage,
      componentProps: { status_modal: 1 }
    });

    modal.present();

    const { data, role } = await modal.onWillDismiss();
    if (role === 'confirm') {
      // console.log('confirmou')
      // console.log(data)

      if (data?.CODPRD) {
        this.addProduct(data);

        console.log(this.order);
      }
    }
  }

  async openModalQtdDesc(xProduct: order_item | null, typeModal = 1) {
    this.typeModal = typeModal;

    if (typeModal === 2 && this.order.VALORLIQUIDO <= 0) {
      this.showToast('top', 'Valor do movimento inválido para desconto!', 'warning');
      return
    }

    this.isOpenModal = !this.isOpenModal;

    if (typeModal === 1) {
      this.product_selected = xProduct;
    }

  }

  async openModal(modalNm = 1) {
    let modal;

    if (modalNm === 1) { //MOVIMENTOS
      modal = await this.modalCtrl.create({
        component: MovementsTypeComponent,
        componentProps: { movements: this.mov_type }
      });
    } else if (modalNm === 2) { // CONDIÇÃO PGTO
      modal = await this.modalCtrl.create({
        component: PaymentsTypeComponent,
        componentProps: { payments: this.pays_type }
      });
    } else if (modalNm === 3) { //VENDEDOR
      modal = await this.modalCtrl.create({
        component: SellersComponent,
        componentProps: { sellers: this.sellers }
      });
    } else { //CLIENTE
      modal = await this.modalCtrl.create({
        component: ClientsPage,
        componentProps: { status_modal: 1 }
      });
    }


    modal.present();

    const { data, role } = await modal.onWillDismiss();
    if (role === 'confirm') {
      // console.log('confirmou 22')
      // console.log(data)
      if (data?.CODPRD) {
        this.addProduct(data);
      }
      if (data?.CODCFO) {
        this.order.CODCFO = data.CODCFO;
        this.order.CLIENTE = data;
      }
      if (data?.CODVEN) {
        this.order.CODVEN1 = data.CODVEN;
        this.order.VENDEDOR = data;
      }
      if (data?.CODTIPOMOV) {
        this.order.CODTMV = data.CODTIPOMOV;
        this.order.MOVIMENTO = data;
      }
      if (data?.CODCONDPGTO) {
        this.order.CODCPG = data.CODCONDPGTO;
        this.order.PAGAMENTO = data;
      }
    }
  }


  cancel() {
    return this.modalCtrl.dismiss(null, 'cancel');
  }

  confirm() {
    return this.modalCtrl.dismiss(null, 'confirm');
  }

}
