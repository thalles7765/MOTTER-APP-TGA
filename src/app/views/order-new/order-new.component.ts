import { Component, OnInit, ViewChild } from '@angular/core';
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
  eye
} from 'ionicons/icons';
import { OrdersService } from 'src/app/services/orders/orders.service';
import { SellersComponent } from '../modals/sellers/sellers.component';
import { sellers } from 'src/app/interfaces/sellers';
import { ConfigService } from 'src/app/services/config/config.service';
import { brandConfig } from 'src/app/branding/brand-config';
import { AuthService } from 'src/app/services/auth/auth.service';
import { app_user } from 'src/app/interfaces/app-user';

@Component({
  selector: 'app-order-new',
  templateUrl: './order-new.component.html',
  styleUrls: ['./order-new.component.scss'],
  imports: [IonItem, IonInput, IonModal, IonButton, IonDatetime, IonIcon, IonContent, IonHeader, IonTitle, IonFab, IonFabButton, IonToolbar, IonButtons, CommonModule, FormsModule]
})
export class OrderNewComponent implements OnInit {
  @ViewChild('modalQtd', { static: true }) modalQtd!: IonModal;
  protected brand = brandConfig;
  protected isOpenModal: boolean = false;
  protected typeModal = 1; //1 = QUANTIDADE; 2 = DESCONTO;
  protected qtdOpt: boolean = false;
  private config;
  private currentUser: app_user | null = null;
  protected order = {} as order;
  protected sellers: sellers[] = [];
  protected pays_type: payments_type[] = [];
  protected mov_type: movements_type[] = [];
  protected client_selected = {} as client;
  protected showDate: boolean = false;
  protected showHeader: boolean = true;
  protected hiddenHeader: boolean = false;


  protected product_selected!: order_item | null;

  constructor(private cfgSvc: ConfigService, private authSvc: AuthService, private toastC: ToastController, private loadingController: LoadingController, private orderSvc: OrdersService, private alertController: AlertController, private clientSvc: ClientService, private utilSvc: UtilsService, private modalCtrl: ModalController) {
    addIcons({ add, checkmark, eye })
  }

  async ngOnInit() {
    const loading = await this.loadingController.create({ message: 'Carregando informações...' });
    try {
      await loading.present();
      this.currentUser = await this.authSvc.getCurrentUser();

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


      this.createMov();
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

    this.order.CODEMPRESA = 1;
    this.order.CODFILIAL = 2;
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
        xTotal += item.VALORTOTALITEM;
        xTotalDesc += item.VALORDESC;
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

    this.order.ITEMS.push({ ...xProduct, QUANTIDADE: 1, VALORTOTALITEM: xProduct.PRECO2, VALORFINANCEIRO: xProduct.PRECO2, VALORUNITARIO: xProduct.PRECO2 });
    this.showToast('bottom', 'Produto adicionado!');

    this.order.VALOROUTROS += xProduct.PRECO2;
    this.order.VALORBRUTO += xProduct.PRECO2;
    this.order.VALORTOTALPRODUTO += xProduct.PRECO2;
    this.order.VALORLIQUIDO += xProduct.PRECO2;
  }

  async removeProduct(xProduct: order_item) {
    const alert = await this.alertController.create({
      header: 'Remover produto?',
      cssClass: 'order-remove-alert',
      message: [
        `<strong>${xProduct.CODPRD} - ${xProduct.NOMEFANTASIA}</strong>`,
        `Quantidade: <strong>${Number(xProduct.QUANTIDADE || 0).toLocaleString('pt-BR', { minimumFractionDigits: 4, maximumFractionDigits: 4 })}</strong>`,
        `Unitario: <strong>${Number(xProduct.PRECO2 || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</strong>`,
        `Total: <strong>${Number(xProduct.VALORTOTALITEM || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</strong>`,
      ].join('<br>'),
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
    const loading = await this.loadingController.create({ message: 'Gerando Movimento...' });
    try {
      await loading.present();
      this.orderSvc.createOrder(this.order).then(async (result) => {
        console.log(result);

        if (result.status === 200) {
          this.showToast('bottom', 'Movimento gerado com sucesso!', 'success');
          this.confirm();
        }
        await loading.dismiss();
      }).catch(async (err) => await loading.dismiss())
    } catch {
      await loading.dismiss();
    }
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
