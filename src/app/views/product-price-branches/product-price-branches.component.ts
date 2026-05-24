import { CommonModule } from '@angular/common';
import { Component, Input, OnInit } from '@angular/core';
import { IonButton, IonButtons, IonContent, IonHeader, IonIcon, IonTitle, IonToolbar, ModalController } from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { business, location, pricetag } from 'ionicons/icons';
import { brandConfig } from 'src/app/branding/brand-config';
import { branch } from 'src/app/interfaces/branch';
import { AuthService } from 'src/app/services/auth/auth.service';

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
  selector: 'app-product-price-branches',
  templateUrl: './product-price-branches.component.html',
  styleUrls: ['./product-price-branches.component.scss'],
  standalone: true,
  imports: [CommonModule, IonButton, IonButtons, IonContent, IonHeader, IonIcon, IonTitle, IonToolbar]
})
export class ProductPriceBranchesComponent implements OnInit {
  @Input() product: any;
  @Input() branches: branch[] = [];
  @Input() selectedBranch: branch | null = null;

  protected brand = brandConfig;
  protected isAdmin = false;

  constructor(private modalCtrl: ModalController, private authSvc: AuthService) {
    addIcons({ business, location, pricetag });
  }

  async ngOnInit() {
    this.isAdmin = await this.authSvc.isAdmin();
  }

  get prices(): ProductBranchPrice[] {
    const prices = this.product?.precos_filial || this.product?.PRECOS_FILIAL || this.product?.precosFilial || [];
    return Array.isArray(prices) ? prices.filter((price) => this.resolveBranch(price)) : [];
  }

  selectedPrice() {
    const selected = this.selectedBranchPrice();
    return selected?.PRECO ?? this.product?.PRECO2 ?? this.product?.PRECO ?? 0;
  }

  branchName(price: ProductBranchPrice) {
    return this.resolveBranch(price)?.NOMEFANTASIA || `Filial ${price.CODFILIAL}`;
  }

  branchDocument(price: ProductBranchPrice) {
    return this.resolveBranch(price)?.CGC || 'CNPJ nao informado';
  }

  branchCity(price: ProductBranchPrice) {
    const priceBranch = this.resolveBranch(price);

    if (!priceBranch) {
      return 'Cidade nao informada';
    }

    return `${priceBranch.CIDADE} - ${priceBranch.ESTADO}`;
  }

  branchAddress(price: ProductBranchPrice) {
    const priceBranch = this.resolveBranch(price);

    if (!priceBranch) {
      return 'Endereco nao informado';
    }

    return `${priceBranch.RUA || ''}, ${priceBranch.NUMERO || 'S/N'} - ${priceBranch.BAIRRO || ''}`.trim();
  }

  isSelectedBranch(price: ProductBranchPrice) {
    return Boolean(
      this.selectedBranch &&
      price.CODEMPRESA === this.selectedBranch.CODEMPRESA &&
      price.CODFILIAL === this.selectedBranch.CODFILIAL
    );
  }

  differenceValue(price: ProductBranchPrice) {
    return Number(price.PRECO || 0) - Number(this.selectedPrice() || 0);
  }

  differencePercent(price: ProductBranchPrice) {
    const selected = Number(this.selectedPrice() || 0);

    if (selected === 0) {
      return 0;
    }

    return (this.differenceValue(price) / selected) * 100;
  }

  differenceClass(price: ProductBranchPrice) {
    const difference = this.differenceValue(price);

    if (difference > 0) {
      return 'price-higher';
    }

    if (difference < 0) {
      return 'price-lower';
    }

    return 'price-equal';
  }

  cancel() {
    return this.modalCtrl.dismiss(null, 'cancel');
  }

  private selectedBranchPrice() {
    if (!this.selectedBranch) {
      return null;
    }

    return this.prices.find((price) =>
      price.CODEMPRESA === this.selectedBranch?.CODEMPRESA &&
      price.CODFILIAL === this.selectedBranch?.CODFILIAL
    ) || null;
  }

  private resolveBranch(price: ProductBranchPrice) {
    return this.branches.find((item) =>
      item.CODEMPRESA === price.CODEMPRESA && item.CODFILIAL === price.CODFILIAL
    );
  }
}
