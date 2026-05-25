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
import { Preferences } from '@capacitor/preferences';
import { ProductPriceBranchesComponent } from '../product-price-branches/product-price-branches.component';
import { ConfigService, ProductPriceOption, SystemConfig } from 'src/app/services/config/config.service';

type ProductStock = {
  CODEMPRESA: number;
  CODFILIAL: number;
  CODLOC: string;
  SALDOFISICO1: number;
  SALDOFISICO2?: number;
  ESTOQUEMINIMO?: number;
  ESTOQUEMAXIMO?: number;
};

type ProductBranchPrice = {
  CODEMPRESA: number;
  CODFILIAL: number;
  PRECO?: number;
  CUSTOUNITARIO?: number;
  CUSTOMEDIO?: number;
  CUSTOREPOSICAOA?: number;
  CUSTOREPOSICAOB?: number;
  MARGEMLUCRO?: number;
  ESTOQUEMINIMO?: number;
  ESTOQUEMAXIMO?: number;
  PONTOPEDIDO?: number;
  DTULTIMAVENDA?: string | null;
  DTULTIMACOMPRA?: string | null;
  ULTPRECOCOMPRA?: number;
  QTDULTIMACOMPRA?: number;
  NUMDOCULTCOMPRA?: string | null;
  ULTPRECOVENDA?: number;
};

type ProductFilter = 'withStock' | 'withoutStock' | 'withoutPrice' | 'withPrice' | 'withPromotion' | 'withoutPromotion';
type SearchMode = 'contains' | 'starts' | 'equals';

const productSearchModeKey = 'products_search_mode';

@Component({
  selector: 'app-products',
  templateUrl: './products.page.html',
  styleUrls: ['./products.page.scss'],
  providers: [ProductService, CapacitorBarcodeScanner],
  imports: [IonButton, IonButtons, IonSearchbar, IonContent, IonHeader, IonTitle, IonToolbar, IonButtons, IonMenuButton, CommonModule, FormsModule]
})
export class ProductsPage implements OnInit {
  @Input() status_modal = 0;
  @Input() priceNumberOverride: number | string | null = null;

  private productSvc = inject(ProductService);

  protected brand = brandConfig;
  protected products: any[] = [];
  protected branches: branch[] = [];
  protected selectedBranch: branch | null = null;
  protected canSelectBranch = false;
  protected systemConfig!: SystemConfig;
  protected searchText = '';
  protected searchMode: SearchMode = 'contains';
  protected showFilters = false;
  protected activeFilters = new Set<ProductFilter>();
  protected searchModeOptions: { key: SearchMode; label: string }[] = [
    { key: 'starts', label: 'Inicia' },
    { key: 'contains', label: 'Contem' },
    { key: 'equals', label: 'Igual' },
  ];
  protected productFilters: { key: ProductFilter; label: string }[] = [
    { key: 'withStock', label: 'C/ Saldo' },
    { key: 'withoutStock', label: 'S/ Saldo' },
    { key: 'withoutPrice', label: 'Sem Preço' },
    { key: 'withPrice', label: 'Com Preço' },
    { key: 'withPromotion', label: 'C/ Promoção' },
    { key: 'withoutPromotion', label: 'S/ Promoção' },
  ];

  constructor(private loadingController: LoadingController, private alertController: AlertController, private _route: Router, private modalCtrl: ModalController, private branchSvc: BranchService, private configSvc: ConfigService) { }

  async ngOnInit() {
    this.systemConfig = this.configSvc.currentConfig();
    this.configSvc.config$.subscribe((config) => this.systemConfig = config);
    await this.loadSystemConfig();
    await this.loadSavedSearchMode();
    await this.loadBranchContext();
    await this.getProdutcts();

    console.log('status modal', this.status_modal)
  }

  cancel() {
    return this.modalCtrl.dismiss(null, 'cancel');
  }

  confirm(product) {
    this.modalCtrl.dismiss(this.productWithBranchPrice(product), 'confirm');
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

  setSearchMode(mode: SearchMode) {
    this.searchMode = mode;
  }

  async saveSearchMode() {
    await Preferences.set({ key: productSearchModeKey, value: this.searchMode });
    this.showFilters = false;
    await this.alertMsg('Filtros salvos.');
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

    await this.productSvc.getData(this.searchText, this.searchMode).then((data) => {

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
    await this.productSvc.getData('', this.searchMode).then((data) => {

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
      componentProps: { product: this.productWithBranchPrice(xproduct) }
    });

    modal.present();

    const { data, role } = await modal.onWillDismiss();
    if (role === 'saved' && data?.CODPRD) {
      this.products = this.products.map((product) => product.CODPRD === data.CODPRD ? { ...product, ...data } : product);
    }
  }

  selectedBranchStock(product: any) {
    if (!this.systemConfig?.habilitaSaldofilial || !this.selectedBranch) {
      return null;
    }

    return this.productStocks(product).find((stock) =>
      stock.CODEMPRESA === this.selectedBranch?.CODEMPRESA &&
      stock.CODFILIAL === this.selectedBranch?.CODFILIAL
    ) || null;
  }

  selectedBranchBalance(product: any) {
    if (!this.systemConfig?.habilitaSaldofilial) {
      return Number(product?.SALDOGERALFISICO ?? product?.SALDOGERALFISICO1 ?? product?.SALDOFISICO1 ?? 0);
    }

    return this.selectedBranchStock(product)?.SALDOFISICO1 || 0;
  }

  stockStatusClass(product: any) {
    return this.resolveStockStatusClass(this.selectedBranchStock(product));
  }

  hasOtherBranchBalance(product: any) {
    if (!this.systemConfig?.habilitaSaldofilial || !this.canSelectBranch || !this.selectedBranch) {
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

    if (!this.systemConfig?.habilitaSaldofilial || !this.canSelectBranch || this.productStocks(product).length <= 0) {
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

  effectivePrice(product: any) {
    return this.effectivePriceInfo(product).valor;
  }

  effectivePriceLabel(product: any) {
    return this.effectivePriceInfo(product).descricao || this.configSvc.priceDescription(this.displayPriceNumber());
  }

  effectivePriceInfo(product: any): ProductPriceOption {
    const selectedPrice = this.systemConfig?.habilitaPrecofilial ? this.selectedBranchPrice(product) : null;

    if (selectedPrice && selectedPrice.PRECO !== undefined && selectedPrice.PRECO !== null) {
      return {
        codigo: this.displayPriceNumber(),
        campo: 'PRECO_FILIAL',
        descricao: this.configSvc.priceDescription(this.displayPriceNumber(), this.systemConfig),
        valor: Number(selectedPrice.PRECO || 0),
        default: true,
      };
    }

    const override = this.displayPriceOverride();
    return this.configSvc.priceInfoFromProduct(product, override || this.configSvc.priceNumber(this.systemConfig));
  }

  hasBranchPrices(product: any) {
    return this.productPriceBranchCount(product) > 1;
  }

  async openPriceBranches(product: any, event?: Event) {
    event?.preventDefault();
    event?.stopPropagation();

    if (!this.hasBranchPrices(product)) {
      return;
    }

    const modal = await this.modalCtrl.create({
      component: ProductPriceBranchesComponent,
      componentProps: {
        product,
        branches: this.branches,
        selectedBranch: this.selectedBranch,
      }
    });

    await modal.present();
  }

  private productStocks(product: any): ProductStock[] {
    const stocks = product?.saldos || [];
    return Array.isArray(stocks) ? stocks.filter((stock) => this.hasSystemBranch(stock)) : [];
  }

  private productPrices(product: any): ProductBranchPrice[] {
    const prices = product?.precos_filial || product?.PRECOS_FILIAL || product?.precosFilial || [];
    return Array.isArray(prices) ? prices.filter((price) => this.hasSystemBranch(price)) : [];
  }

  private productPriceBranchCount(product: any) {
    return new Set(
      this.productPrices(product).map((price) => `${price.CODEMPRESA}-${price.CODFILIAL}`)
    ).size;
  }

  private selectedBranchPrice(product: any) {
    if (!this.selectedBranch) {
      return null;
    }

    return this.productPrices(product).find((price) =>
      price.CODEMPRESA === this.selectedBranch?.CODEMPRESA &&
      price.CODFILIAL === this.selectedBranch?.CODFILIAL
    ) || null;
  }

  private hasSystemBranch(item: { CODEMPRESA: number; CODFILIAL: number }) {
    return this.branches.some((branch) =>
      Number(branch.CODEMPRESA) === Number(item.CODEMPRESA) &&
      Number(branch.CODFILIAL) === Number(item.CODFILIAL)
    );
  }

  private productWithBranchPrice(product: any) {
    const priceInfo = this.effectivePriceInfo(product);
    const defaultPrice = priceInfo.valor;

    return {
      ...product,
      PRECO2: defaultPrice,
      PRECO: defaultPrice,
      PRECOUNITARIO: defaultPrice,
      VALORUNITARIO: defaultPrice,
      PRECOBASE: defaultPrice,
      PRECOTABELA: defaultPrice,
      PRECO_TABELA_APP: defaultPrice,
      QUALPRECO_APP: priceInfo.codigo,
      DESCPRECO_APP: priceInfo.descricao,
    };
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

    const hasPrice = this.effectivePrice(product) > 0;

    return (withPrice && hasPrice) || (withoutPrice && !hasPrice);
  }

  private displayPriceOverride() {
    const override = Number(this.priceNumberOverride || 0);

    if (this.status_modal === 1 && override >= 1 && override <= 5) {
      return override;
    }

    return null;
  }

  private displayPriceNumber() {
    return this.displayPriceOverride() || this.configSvc.priceNumber(this.systemConfig);
  }

  private async loadSystemConfig() {
    try {
      const response = await this.configSvc.getData();
      this.systemConfig = response.data.data;
    } catch {
      this.systemConfig = this.configSvc.currentConfig();
    }
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

  private async loadSavedSearchMode() {
    const saved = await Preferences.get({ key: productSearchModeKey });
    const value = saved.value as SearchMode | null;

    if (value === 'starts' || value === 'contains' || value === 'equals') {
      this.searchMode = value;
    }
  }

}
