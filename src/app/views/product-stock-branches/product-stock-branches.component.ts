import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ModalController, IonButton, IonContent, IonHeader, IonTitle, IonToolbar, IonButtons, IonIcon } from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { business, location, cube } from 'ionicons/icons';
import { branch } from 'src/app/interfaces/branch';
import { brandConfig } from 'src/app/branding/brand-config';

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
  selector: 'app-product-stock-branches',
  templateUrl: './product-stock-branches.component.html',
  styleUrls: ['./product-stock-branches.component.scss'],
  standalone: true,
  imports: [CommonModule, IonButton, IonContent, IonHeader, IonTitle, IonToolbar, IonButtons, IonIcon]
})
export class ProductStockBranchesComponent {
  @Input() product: any;
  @Input() branches: branch[] = [];

  protected brand = brandConfig;

  constructor(private modalCtrl: ModalController) {
    addIcons({ business, location, cube });
  }

  get stocks(): ProductStock[] {
    return this.product?.saldos || [];
  }

  branchName(stock: ProductStock) {
    return this.resolveBranch(stock)?.NOMEFANTASIA || `Filial ${stock.CODFILIAL}`;
  }

  branchDocument(stock: ProductStock) {
    return this.resolveBranch(stock)?.CGC || 'CNPJ nao informado';
  }

  branchCity(stock: ProductStock) {
    const stockBranch = this.resolveBranch(stock);

    if (!stockBranch) {
      return 'Cidade nao informada';
    }

    return `${stockBranch.CIDADE} - ${stockBranch.ESTADO}`;
  }

  stockStatusClass(stock: ProductStock) {
    const balance = Number(stock.SALDOFISICO1 || 0);
    const minStock = Number(stock.ESTOQUEMINIMO || 0);
    const maxStock = Number(stock.ESTOQUEMAXIMO || 0);

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

  cancel() {
    return this.modalCtrl.dismiss(null, 'cancel');
  }

  private resolveBranch(stock: ProductStock) {
    return this.branches.find((item) =>
      item.CODEMPRESA === stock.CODEMPRESA && item.CODFILIAL === stock.CODFILIAL
    );
  }
}
