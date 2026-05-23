import { Component, inject, Input, OnInit, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { LoadingController, AlertController, ModalController, IonButton, IonSearchbar, IonContent, IonHeader, IonTitle, IonButtons, IonMenuButton, IonToolbar } from '@ionic/angular/standalone';
import { ProductService } from 'src/app/services/products/product.service';
import { CapacitorBarcodeScanner } from '@capacitor/barcode-scanner'
import { Router } from '@angular/router';
import { ProductDetailPage } from '../product-detail/product-detail.page';
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

type ProductFilter = 'withStock' | 'withoutStock' | 'withoutPrice' | 'withPrice' | 'withPromotion' | 'withoutPromotion';

@Component({
  selector: 'app-products',
  templateUrl: './products.page.html',
  styleUrls: ['./products.page.scss'],
  providers: [ProductService, CapacitorBarcodeScanner],
  imports: [IonButton, IonButtons, IonSearchbar, IonContent, IonHeader, IonTitle, IonToolbar, IonButtons, IonMenuButton, CommonModule, FormsModule]
})
export class ProductsPage implements OnInit {
  @Input() status_modal = 0;

  private productSvc = inject(ProductService);

  protected brand = brandConfig;
  protected products: any[] = [];
  protected branches: branch[] = [];
  protected selectedBranch: branch | null = null;
  protected canSelectBranch = false;
  protected searchText = '';
  protected activeFilters = new Set<ProductFilter>();
  protected productFilters: { key: ProductFilter; label: string }[] = [
    { key: 'withStock', label: 'C/ Saldo' },
    { key: 'withoutStock', label: 'S/ Saldo' },
    { key: 'withoutPrice', label: 'Sem Preço' },
    { key: 'withPrice', label: 'Com Preço' },
    { key: 'withPromotion', label: 'C/ Promoção' },
    { key: 'withoutPromotion', label: 'S/ Promoção' },
  ];

  constructor(private loadingController: LoadingController, private alertController: AlertController, private _route: Router, private modalCtrl: ModalController, private branchSvc: BranchService) { }

  async ngOnInit() {
    await this.loadBranchContext();
    await this.getProdutcts();

    console.log('status modal', this.status_modal)
  }

  cancel() {
    return this.modalCtrl.dismiss(null, 'cancel');
  }

  confirm(product) {
    this.modalCtrl.dismiss(product, 'confirm');
  }

  protected productName(product: any) {
    return product?.NOMEFANTASIA || product?.DESCRICAO || 'Produto sem nome';
  }

  protected curveClass(product: any) {
    const curve = String(product?.DESC_CURVA || '').toUpperCase();

    if (curve.includes('A')) {
      return 'curve-a';
    }

    if (curve.includes('B')) {
      return 'curve-b';
    }

    return 'curve-c';
  }

  protected curveLetter(product: any) {
    return String(product?.DESC_CURVA || '')
      .toUpperCase()
      .replace('CURVA', '')
      .replace(/\s/g, '') || '-';
  }

  protected productFlag(product: any) {
    if (product?.CD_LEGENDA === 6) {
      return { label: 'Promocao', className: 'promo' };
    }

    if (product?.CD_LEGENDA === 2) {
      return { label: 'Fora de linha', className: 'inactive' };
    }

    return null;
  }

  get filteredProducts() {
    return this.products.filter((product) =>
      this.matchesStockFilters(product) &&
      this.matchesPriceFilters(product) &&
      this.matchesPromotionFilters(product)
    );
  }

  toggleFilter(filter: ProductFilter) {
    if (this.activeFilters.has(filter)) {
      this.activeFilters.delete(filter);
      return;
    }

    this.activeFilters.add(filter);
  }

  isFilterActive(filter: ProductFilter) {
    return this.activeFilters.has(filter);
  }

  clearFilters() {
    this.activeFilters.clear();
  }

  async showLoading() {
    const loading = await this.loadingController.create({ message: 'Carregando informações...' });
    await loading.present();

    setTimeout(async () => {
      await loading.dismiss();
    }, 1800);
  }

  async searchProduct(event?: any, typeSearch = 1) {
    if (typeSearch === 1 && event?.target) {
      const target = event.target as HTMLIonSearchbarElement;
      const query = target.value?.toUpperCase() || '';
      this.searchText = query;
    }

    this.showLoading();

    await this.productSvc.getData(this.searchText).then((data) => {

      if (data.status === 200) {
        this.products = data.data.data;
      } else {
        console.log('Erro na requisição')
        console.log(data)
      }
    })
    // this.results = this.data.filter((d) => d.toLowerCase().includes(query));
  }

  async getProdutcts() {
    await this.showLoading();
    await this.productSvc.getData().then((data) => {

      if (data.status === 200) {
        this.products = data.data.data;
      } else {
        console.log('@@@')
        console.log(data)
      }
    })
  }

  async openCamera() {
    CapacitorBarcodeScanner.scanBarcode({
      scanText: 'Leia o código',
      hint: 9,
      scanButton: false
    }).then((res) => {
      // console.log(res.ScanResult);
      if (res.ScanResult) {
        this.searchText = res.ScanResult;
        this.searchProduct(undefined, 2)
      } else {
        this.alertMsg('Nenhum código foi identificado...');
      }
    })
  }

  async openModal(xproduct) {
    const modal = await this.modalCtrl.create({
      component: ProductDetailPage,
      componentProps: { product: xproduct }
    });

    modal.present();

    const { data, role } = await modal.onWillDismiss();
    // if (role === 'confirm') {
    //   this.message = `Hello, ${data}!`;
    // }
  }

  selectedBranchStock(product: any) {
    if (!this.selectedBranch) {
      return null;
    }

    return this.productStocks(product).find((stock) =>
      stock.CODEMPRESA === this.selectedBranch?.CODEMPRESA &&
      stock.CODFILIAL === this.selectedBranch?.CODFILIAL
    ) || null;
  }

  selectedBranchBalance(product: any) {
    return this.selectedBranchStock(product)?.SALDOFISICO1 || 0;
  }

  stockStatusClass(product: any) {
    return this.resolveStockStatusClass(this.selectedBranchStock(product));
  }

  hasOtherBranchBalance(product: any) {
    if (!this.canSelectBranch || !this.selectedBranch) {
      return false;
    }

    return this.productStocks(product).some((stock) =>
      (stock.CODEMPRESA !== this.selectedBranch?.CODEMPRESA ||
        stock.CODFILIAL !== this.selectedBranch?.CODFILIAL) &&
      Number(stock.SALDOFISICO1 || 0) > 0
    );
  }

  async openStockBranches(product: any, event?: Event) {
    event?.stopPropagation();

    if (!this.canSelectBranch || this.productStocks(product).length <= 0) {
      return;
    }

    const modal = await this.modalCtrl.create({
      component: ProductStockBranchesComponent,
      componentProps: {
        product,
        branches: this.branches
      }
    });

    await modal.present();
  }

  private productStocks(product: any): ProductStock[] {
    return product?.saldos || [];
  }

  private matchesStockFilters(product: any) {
    const withStock = this.activeFilters.has('withStock');
    const withoutStock = this.activeFilters.has('withoutStock');

    if (!withStock && !withoutStock) {
      return true;
    }

    const hasStock = this.selectedBranchBalance(product) > 0;

    return (withStock && hasStock) || (withoutStock && !hasStock);
  }

  private matchesPriceFilters(product: any) {
    const withPrice = this.activeFilters.has('withPrice');
    const withoutPrice = this.activeFilters.has('withoutPrice');

    if (!withPrice && !withoutPrice) {
      return true;
    }

    const hasPrice = Number(product?.PRECO2 || 0) > 0;

    return (withPrice && hasPrice) || (withoutPrice && !hasPrice);
  }

  private matchesPromotionFilters(product: any) {
    const withPromotion = this.activeFilters.has('withPromotion');
    const withoutPromotion = this.activeFilters.has('withoutPromotion');

    if (!withPromotion && !withoutPromotion) {
      return true;
    }

    const hasPromotion = product?.CD_LEGENDA === 6;

    return (withPromotion && hasPromotion) || (withoutPromotion && !hasPromotion);
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

  async navigateURL(url = '', data) {

    return;
    console.log('navigate')
    console.log(data)
    if (url) {
      this._route.navigate([url], { queryParams: data });
    }
    // else {
    //   await this.urlNotFound();
    // }
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
