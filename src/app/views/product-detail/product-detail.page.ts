import { Component, inject, Input, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AlertController, ModalController, IonButton, IonContent, IonHeader, IonTitle, IonButtons, IonMenuButton, IonToolbar } from '@ionic/angular/standalone';
import { ProductService } from 'src/app/services/products/product.service';
import { CapacitorBarcodeScanner } from '@capacitor/barcode-scanner'
import { ActivatedRoute } from '@angular/router';
import { ConfigService, ProductPriceOption, SystemConfig } from 'src/app/services/config/config.service';
import { brandConfig } from 'src/app/branding/brand-config';
import { BranchService } from 'src/app/services/branches/branch.service';
import { branch } from 'src/app/interfaces/branch';
import { ProductStockBranchesComponent } from '../product-stock-branches/product-stock-branches.component';
import { ProductPriceBranchesComponent } from '../product-price-branches/product-price-branches.component';
import { AuthService } from 'src/app/services/auth/auth.service';
import { app_user } from 'src/app/interfaces/app-user';
import { UtilsService } from 'src/app/services/utils/utils.service';
import { ProductLookupComponent, ProductLookupType } from '../modals/product-lookup/product-lookup.component';

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
  protected systemConfig!: SystemConfig;
  protected branches: branch[] = [];
  protected selectedBranch: branch | null = null;
  protected canSelectBranch = false;
  protected showMoreInfo = false;
  protected currentUser: app_user | null = null;
  protected editing = false;
  protected saving = false;
  protected form: any = {};

  private productSvc = inject(ProductService);

  // protected product;
  protected searchText = '';

  constructor(private alertController: AlertController, private cfgSvc: ConfigService, private _route: ActivatedRoute, private modalCtrl: ModalController, private branchSvc: BranchService, private authSvc: AuthService, private utilsSvc: UtilsService) { }

  cancel() {
    return this.modalCtrl.dismiss(null, 'cancel');
  }

  confirm() {
    return this.modalCtrl.dismiss(null, 'confirm');
  }

  protected productName() {
    return this.product?.NOMEFANTASIA || this.product?.DESCRICAO || 'Produto sem nome';
  }

  protected canEditProduct() {
    return Boolean(this.currentUser?.admin || this.currentUser?.edit_product);
  }

  protected canEditSensitive() {
    return Boolean(this.currentUser?.admin);
  }

  protected startEdit() {
    if (!this.canEditProduct()) {
      return;
    }

    this.form = this.buildForm(this.product);
    this.editing = true;
  }

  protected cancelEdit() {
    this.form = this.buildForm(this.product);
    this.editing = false;
  }

  protected async saveProduct() {
    if (!this.canEditProduct() || !this.product?.CODPRD) {
      return;
    }

    this.saving = true;

    try {
      if (!this.hasValidForeignKeys()) {
        await this.alertMsg('Selecione grupo, fabricante, unidade, NCM e CEST pela busca antes de salvar.');
        return;
      }

      const payload = this.buildPayload();
      const response = await this.productSvc.updateProduct(this.product.CODPRD, payload);
      const updatedProduct = response.data?.data || response.data || payload;
      this.product = { ...this.product, ...payload, ...updatedProduct };
      this.form = this.buildForm(this.product);
      this.editing = false;
      await this.alertMsg('Produto atualizado com sucesso.');
      await this.modalCtrl.dismiss(this.product, 'saved');
    } catch (error) {
      await this.alertMsg('Nao foi possivel atualizar o produto.');
    } finally {
      this.saving = false;
    }
  }

  protected async resolveProductLookup(type: ProductLookupType, search: string) {
    const normalizedSearch = String(search || '').trim();
    const items = await this.loadLookupItems(type, normalizedSearch);
    const exactItems = items.filter((item) => this.lookupMatches(type, item, normalizedSearch));

    if (exactItems.length === 1) {
      this.applyLookup(type, exactItems[0]);
      return;
    }

    if (items.length === 1) {
      this.applyLookup(type, items[0]);
      return;
    }

    await this.openProductLookup(type, normalizedSearch);
  }

  protected openProductLookup(type: ProductLookupType, search = '') {
    return this.showLookupModal(type, search);
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
    this.currentUser = await this.authSvc.getCurrentUser();
    this.systemConfig = this.cfgSvc.currentConfig();
    this.cfgSvc.config$.subscribe((config) => this.systemConfig = config);
    await this.loadBranchContext();
    await this.getConfig();
    this.form = this.buildForm(this.product);
  }

  selectedBranchStock() {
    if (!this.systemConfig?.habilitaSaldofilial || !this.selectedBranch) {
      return null;
    }

    return this.productStocks().find((stock) =>
      stock.CODEMPRESA === this.selectedBranch?.CODEMPRESA &&
      stock.CODFILIAL === this.selectedBranch?.CODFILIAL
    ) || null;
  }

  selectedBranchBalance() {
    if (!this.systemConfig?.habilitaSaldofilial) {
      return Number(this.product?.SALDOGERALFISICO ?? this.product?.SALDOGERALFISICO1 ?? this.product?.SALDOFISICO1 ?? 0);
    }

    return this.selectedBranchStock()?.SALDOFISICO1 || 0;
  }

  stockStatusClass() {
    return this.resolveStockStatusClass(this.selectedBranchStock());
  }

  hasOtherBranchBalance() {
    if (!this.systemConfig?.habilitaSaldofilial || !this.canSelectBranch || !this.selectedBranch) {
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

    if (!this.systemConfig?.habilitaSaldofilial || !this.canSelectBranch || this.productStocks().length <= 0) {
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

  effectivePrice() {
    return this.effectivePriceInfo().valor;
  }

  effectivePriceLabel() {
    return this.effectivePriceInfo().descricao || 'Preco venda';
  }

  effectivePriceInfo(): ProductPriceOption {
    const selectedPrice = this.systemConfig?.habilitaPrecofilial ? this.selectedBranchPrice() : null;

    if (selectedPrice && selectedPrice.PRECO !== undefined && selectedPrice.PRECO !== null) {
      return {
        codigo: this.cfgSvc.priceNumber(this.systemConfig),
        campo: 'PRECO_FILIAL',
        descricao: this.cfgSvc.priceDescription(this.cfgSvc.priceNumber(this.systemConfig), this.systemConfig),
        valor: Number(selectedPrice.PRECO || 0),
        default: true,
      };
    }

    return this.cfgSvc.priceInfoFromProduct(this.product, this.cfgSvc.priceNumber(this.systemConfig));
  }

  productPriceOptions() {
    return this.cfgSvc.productPriceOptions(this.product);
  }

  protected shouldShowBranchPriceList() {
    return Boolean(this.systemConfig?.habilitaPrecofilial && this.productPrices().length > 0);
  }

  protected branchPriceList() {
    return this.productPrices();
  }

  protected branchPriceListTitle() {
    return this.shouldShowBranchPriceList() ? 'Precos por filial' : 'Precos disponiveis';
  }

  protected branchPriceListCount() {
    return this.shouldShowBranchPriceList()
      ? this.productPrices().length
      : this.productPriceOptions().length;
  }

  protected branchPriceName(price: ProductBranchPrice) {
    return this.resolveBranch(price)?.NOMEFANTASIA || `Filial ${price.CODFILIAL}`;
  }

  protected branchPriceDescription(price: ProductBranchPrice) {
    const priceBranch = this.resolveBranch(price);

    if (!priceBranch) {
      return `Filial ${price.CODFILIAL}`;
    }

    const city = [priceBranch.CIDADE, priceBranch.ESTADO].filter(Boolean).join(' - ');
    return city ? `Filial ${price.CODFILIAL} / ${city}` : `Filial ${price.CODFILIAL}`;
  }

  toggleMoreInfo() {
    this.showMoreInfo = !this.showMoreInfo;
  }

  hasBranchPrices() {
    return this.productPriceBranchCount() > 1;
  }

  async openPriceBranches(event?: Event) {
    event?.stopPropagation();

    if (!this.hasBranchPrices()) {
      return;
    }

    const modal = await this.modalCtrl.create({
      component: ProductPriceBranchesComponent,
      componentProps: {
        product: this.product,
        branches: this.branches,
        selectedBranch: this.selectedBranch,
      }
    });

    await modal.present();
  }

  private productStocks(): ProductStock[] {
    const stocks = this.product?.saldos || [];
    return Array.isArray(stocks) ? stocks.filter((stock) => this.hasSystemBranch(stock)) : [];
  }

  private productPrices(): ProductBranchPrice[] {
    const prices = this.product?.precos_filial || this.product?.PRECOS_FILIAL || this.product?.precosFilial || [];
    return Array.isArray(prices) ? prices.filter((price) => this.hasSystemBranch(price)) : [];
  }

  private productPriceBranchCount() {
    return new Set(
      this.productPrices().map((price) => `${price.CODEMPRESA}-${price.CODFILIAL}`)
    ).size;
  }

  protected selectedBranchPrice() {
    if (!this.selectedBranch) {
      return null;
    }

    return this.productPrices().find((price) =>
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

  private resolveBranch(item: { CODEMPRESA: number; CODFILIAL: number }) {
    return this.branches.find((branch) =>
      Number(branch.CODEMPRESA) === Number(item.CODEMPRESA) &&
      Number(branch.CODFILIAL) === Number(item.CODFILIAL)
    ) || null;
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

  private buildForm(product: any) {
    const selectedPrice = this.selectedBranchPrice();

    return {
      NOMEFANTASIA: product?.NOMEFANTASIA || product?.DESCRICAO || '',
      CODBARRAS: product?.CODBARRAS || '',
      UNIDADE: product?.UNIDADE || 'UN',
      UNIDADE_DESC: product?.UNIDADE_DESC || product?.DESC_UNIDADE || '',
      CODGRUPO: product?.CODGRUPO || '',
      DESC_GRUPO: product?.DESC_GRUPO || '',
      CODFAB: product?.CODFAB || '',
      DESC_FABRICANTE: product?.DESC_FABRICANTE || '',
      DEPOSITO: product?.DEPOSITO || '',
      PRATELEIRA: product?.PRATELEIRA || '',
      CODCLAS: product?.CODCLAS || '',
      DESC_NCM: product?.DESC_NCM || product?.NCM_DESCRICAO || '',
      CEST: product?.CEST || '',
      DESC_CEST: product?.DESC_CEST || product?.CEST_DESCRICAO || '',
      CUSTOUNITARIO: Number(product?.CUSTOUNITARIO || 0),
      CUSTOMEDIO: Number(product?.CUSTOMEDIO || 0),
      PRECO_FILIAL: Number(selectedPrice?.PRECO ?? 0),
      precos: this.cfgSvc.productPriceOptions(product).map((price) => ({ ...price })),
    };
  }

  private buildPayload() {
    const payload: any = {
      CODFILIAL: Number(this.selectedBranch?.CODFILIAL || this.product?.CODFILIAL || 1),
      NOMEFANTASIA: this.form.NOMEFANTASIA,
      DESCRICAO: this.form.NOMEFANTASIA,
      CODBARRAS: this.form.CODBARRAS,
      UNIDADE: this.form.UNIDADE,
      CODUND: this.form.UNIDADE,
      CODGRUPO: this.form.CODGRUPO,
      DESC_GRUPO: this.form.DESC_GRUPO,
      CODFAB: this.form.CODFAB,
      DESC_FABRICANTE: this.form.DESC_FABRICANTE,
      DEPOSITO: this.form.DEPOSITO,
      PRATELEIRA: this.form.PRATELEIRA,
      CODCLAS: this.form.CODCLAS,
      CEST: this.form.CEST,
    };

    if (this.canEditSensitive()) {
      payload.CUSTOUNITARIO = Number(this.form.CUSTOUNITARIO || 0);
      payload.CUSTOMEDIO = Number(this.form.CUSTOMEDIO || 0);
      payload.precos = (this.form.precos || []).map((price: ProductPriceOption) => ({
        codigo: price.codigo,
        campo: price.campo,
        descricao: price.descricao,
        valor: Number(price.valor || 0),
        default: Boolean(price.default),
      }));

      const selectedPrice = this.selectedBranchPrice();
      if (selectedPrice && this.selectedBranch) {
        payload.precos_filial = this.productPrices().map((price) =>
          Number(price.CODFILIAL) === Number(this.selectedBranch?.CODFILIAL) && Number(price.CODEMPRESA) === Number(this.selectedBranch?.CODEMPRESA)
            ? { ...price, PRECO: Number(this.form.PRECO_FILIAL || 0) }
            : price
        );
      }
    }

    return payload;
  }

  private async showLookupModal(type: ProductLookupType, search = '') {
    const modal = await this.modalCtrl.create({
      component: ProductLookupComponent,
      componentProps: {
        lookupType: type,
        title: this.lookupTitle(type),
        searchText: search,
      }
    });

    await modal.present();
    const { data, role } = await modal.onWillDismiss();

    if (role === 'confirm' && data) {
      this.applyLookup(type, data);
    }
  }

  private requestLookup(type: ProductLookupType, params: any) {
    if (type === 'cest') {
      return this.utilsSvc.getCest(params);
    }

    if (type === 'fiscal-classifications') {
      return this.utilsSvc.getFiscalClassifications(params);
    }

    if (type === 'manufacturers') {
      return this.utilsSvc.getManufacturers(params);
    }

    if (type === 'units') {
      return this.utilsSvc.getUnits(params);
    }

    return this.utilsSvc.getGroups(params);
  }

  private applyLookup(type: ProductLookupType, item: any) {
    if (type === 'groups') {
      this.form.CODGRUPO = item.CODGRUPO || '';
      this.form.DESC_GRUPO = item.DESCRICAO || '';
      return;
    }

    if (type === 'manufacturers') {
      this.form.CODFAB = item.CODFAB || '';
      this.form.DESC_FABRICANTE = item.NOME || item.DESCRICAO || '';
      return;
    }

    if (type === 'units') {
      this.form.UNIDADE = item.CODUND || '';
      this.form.UNIDADE_DESC = item.DESCRICAO || '';
      return;
    }

    if (type === 'fiscal-classifications') {
      this.form.CODCLAS = item.CODCLAS || '';
      this.form.DESC_NCM = item.DESCRICAO || '';
      return;
    }

    this.form.CEST = item.CEST || '';
    this.form.DESC_CEST = item.DESCRICAO || '';
  }

  private lookupMatches(type: ProductLookupType, item: any, search: string) {
    const normalized = this.normalizeLookupValue(search);

    if (!normalized) {
      return false;
    }

    return [
      item?.CEST,
      item?.CODCLAS,
      item?.CODGRUPO,
      item?.CODFAB,
      item?.CODUND,
      item?.DESCRICAO,
      item?.NOME,
    ].some((value) => this.normalizeLookupValue(value) === normalized);
  }

  private lookupTitle(type: ProductLookupType) {
    if (type === 'cest') {
      return 'CEST';
    }

    if (type === 'fiscal-classifications') {
      return 'Classificacao fiscal';
    }

    if (type === 'manufacturers') {
      return 'Fabricantes';
    }

    if (type === 'units') {
      return 'Unidades';
    }

    return 'Grupos';
  }

  private extractList(responseData: any) {
    if (Array.isArray(responseData?.data)) {
      return responseData.data;
    }

    return Array.isArray(responseData) ? responseData : [];
  }

  private normalizeLookupValue(value: any) {
    return String(value || '').trim().toUpperCase();
  }

  private async loadLookupItems(type: ProductLookupType, search: string) {
    const response = await this.requestLookup(type, { search });
    let items = this.extractList(response.data);

    if (items.length <= 0 && search) {
      const fallbackResponse = await this.requestLookup(type, {});
      items = this.extractList(fallbackResponse.data)
        .filter((item) => this.lookupContains(type, item, search));
    }

    return items;
  }

  private lookupContains(type: ProductLookupType, item: any, search: string) {
    const normalized = this.normalizeLookupValue(search);

    if (!normalized) {
      return true;
    }

    return [
      item?.CEST,
      item?.NCM,
      item?.CODCLAS,
      item?.CODGRUPO,
      item?.CODFAB,
      item?.CODUND,
      item?.DESCRICAO,
      item?.NOME,
    ].some((value) => this.normalizeLookupValue(value).includes(normalized));
  }

  private hasValidForeignKeys() {
    return Boolean(
      this.form.UNIDADE &&
      (!this.form.DESC_GRUPO || this.form.CODGRUPO) &&
      (!this.form.DESC_FABRICANTE || this.form.CODFAB) &&
      (!this.form.CODCLAS || this.form.CODCLAS) &&
      (!this.form.CEST || this.form.CEST)
    );
  }

}
