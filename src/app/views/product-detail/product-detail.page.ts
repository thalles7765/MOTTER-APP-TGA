import { Component, inject, Input, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AlertController, ModalController, IonButton, IonContent, IonHeader, IonTitle, IonButtons, IonMenuButton, IonToolbar } from '@ionic/angular/standalone';
import { ProductService } from 'src/app/services/products/product.service';
import { CapacitorBarcodeScanner } from '@capacitor/barcode-scanner'
import { ActivatedRoute } from '@angular/router';
import { ConfigService } from 'src/app/services/config/config.service';
import { brandConfig } from 'src/app/branding/brand-config';
import { BranchService } from 'src/app/services/branches/branch.service';
import { branch } from 'src/app/interfaces/branch';
import { ProductStockBranchesComponent } from '../product-stock-branches/product-stock-branches.component';

type ProductStock = {
  CODEMPRESA: number;
  CODFILIAL: number;
  CODLOC: string;
  SALDOFISICO1: number;
  SALDOFISICO2?: number;
  ESTOQUEMINIMO?: number;
  ESTOQUEMAXIMO?: number;
};

@Component({
  selector: 'app-product-detail',
  templateUrl: './product-detail.page.html',
  styleUrls: ['./product-detail.page.scss'],
  providers: [ProductService, CapacitorBarcodeScanner],
  imports: [IonButton, IonContent, IonHeader, IonTitle, IonToolbar, IonButtons, CommonModule, FormsModule]
})
export class ProductDetailPage implements OnInit {
  @Input() product: any;
  protected brand = brandConfig;
  protected xConfig;
  protected branches: branch[] = [];
  protected selectedBranch: branch | null = null;
  protected canSelectBranch = false;

  private productSvc = inject(ProductService);

  // protected product;
  protected searchText = '';

  constructor(private alertController: AlertController, private cfgSvc: ConfigService, private _route: ActivatedRoute, private modalCtrl: ModalController, private branchSvc: BranchService) { }

  cancel() {
    return this.modalCtrl.dismiss(null, 'cancel');
  }

  confirm() {
    return this.modalCtrl.dismiss(null, 'confirm');
  }

  protected productName() {
    return this.product?.NOMEFANTASIA || this.product?.DESCRICAO || 'Produto sem nome';
  }

  protected curveClass() {
    const curve = String(this.product?.DESC_CURVA || '').toUpperCase();

    if (curve.includes('A')) {
      return 'curve-a';
    }

    if (curve.includes('B')) {
      return 'curve-b';
    }

    return 'curve-c';
  }

  protected curveLetter() {
    return String(this.product?.DESC_CURVA || '')
      .toUpperCase()
      .replace('CURVA', '')
      .replace(/\s/g, '') || '-';
  }

  protected productFlag() {
    if (this.product?.CD_LEGENDA === 6) {
      return { label: 'Promocao', className: 'promo' };
    }

    if (this.product?.CD_LEGENDA === 2) {
      return { label: 'Fora de linha', className: 'inactive' };
    }

    return null;
  }

  async ngOnInit() {
    await this.loadBranchContext();
    await this.getConfig();
  }

  selectedBranchStock() {
    if (!this.selectedBranch) {
      return null;
    }

    return this.productStocks().find((stock) =>
      stock.CODEMPRESA === this.selectedBranch?.CODEMPRESA &&
      stock.CODFILIAL === this.selectedBranch?.CODFILIAL
    ) || null;
  }

  selectedBranchBalance() {
    return this.selectedBranchStock()?.SALDOFISICO1 || 0;
  }

  stockStatusClass() {
    return this.resolveStockStatusClass(this.selectedBranchStock());
  }

  hasOtherBranchBalance() {
    if (!this.canSelectBranch || !this.selectedBranch) {
      return false;
    }

    return this.productStocks().some((stock) =>
      (stock.CODEMPRESA !== this.selectedBranch?.CODEMPRESA ||
        stock.CODFILIAL !== this.selectedBranch?.CODFILIAL) &&
      Number(stock.SALDOFISICO1 || 0) > 0
    );
  }

  async openStockBranches(event?: Event) {
    event?.stopPropagation();

    if (!this.canSelectBranch || this.productStocks().length <= 0) {
      return;
    }

    const modal = await this.modalCtrl.create({
      component: ProductStockBranchesComponent,
      componentProps: {
        product: this.product,
        branches: this.branches
      }
    });

    await modal.present();
  }

  private productStocks(): ProductStock[] {
    return this.product?.saldos || [];
  }

  private resolveStockStatusClass(stock: ProductStock | null) {
    const balance = Number(stock?.SALDOFISICO1 || 0);
    const minStock = Number(stock?.ESTOQUEMINIMO || 0);
    const maxStock = Number(stock?.ESTOQUEMAXIMO || 0);

    if (balance < 0) {
      return 'stock-negative';
    }

    if (minStock > 0 && balance < minStock) {
      return 'stock-low';
    }

    if (maxStock > 0 && balance > maxStock) {
      return 'stock-high';
    }

    if (balance === 0) {
      return 'stock-neutral';
    }

    return 'stock-ok';
  }

  private async loadBranchContext() {
    const [branches, selectedBranch, branchPolicy] = await Promise.all([
      this.branchSvc.getBranches(),
      this.branchSvc.getSelectedBranch(),
      this.branchSvc.getBranchPolicy()
    ]);

    this.branches = branches;
    this.selectedBranch = selectedBranch;
    this.canSelectBranch = branchPolicy.canSelectBranch;
  }

  async getConfig() {
    await this.cfgSvc.getData().then((data) => {
      if (data.status === 200) {
        this.xConfig = data.data.data;
        console.log('@#@#@#@')

        console.log(this.xConfig)
      } else {
        console.log('@@@')
        console.log(data)
      }
    })
  }

  async searchProduct(event: any, typeSearch = 1) {
    if (typeSearch === 1) {
      const target = event.target as HTMLIonSearchbarElement;
      const query = target.value?.toUpperCase() || '';
      this.searchText = query;
    }

    await this.productSvc.getData(this.searchText).then((data) => {

      if (data.status === 200) {
        this.product = data.data.data;
      } else {
        console.log('Erro na requisição')
        console.log(data)
      }
    })
    // this.results = this.data.filter((d) => d.toLowerCase().includes(query));
  }

  async openCamera() {
    CapacitorBarcodeScanner.scanBarcode({
      scanText: 'Leia o código',
      hint: 9,
      scanButton: true
    }).then((res) => {
      // console.log(res.ScanResult);
      if (res.ScanResult) {
        this.searchText = res.ScanResult;
        this.searchProduct(1, 2)
      } else {
        this.alertMsg('Nenhum código foi lido...');
      }
    })
  }


  async alertMsg(msg = 'Mensagem Teste') {
    const alert = await this.alertController.create({
      header: 'Mensagem',
      //subHeader: 'A Sub Header Is Optional',
      message: msg,
      buttons: ['Fechar'],
    });

    await alert.present();
  }

}
