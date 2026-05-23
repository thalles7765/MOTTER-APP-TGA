import { Component, CUSTOM_ELEMENTS_SCHEMA, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MenuController, AlertController, IonHeader, IonToolbar, IonButtons, IonMenuButton, IonTitle, IonContent, IonItem, IonLabel, IonSelect, IonSelectOption } from '@ionic/angular/standalone';
import { Router } from '@angular/router';
import { brandConfig } from 'src/app/branding/brand-config';
import { BranchService } from 'src/app/services/branches/branch.service';
import { branch } from 'src/app/interfaces/branch';

@Component({
    selector: 'app-home',
    templateUrl: './home.page.html',
    styleUrls: ['./home.page.scss'],
    imports: [IonItem, IonLabel, IonSelect, IonSelectOption, IonContent, IonHeader, IonTitle, IonToolbar, IonButtons, IonMenuButton, CommonModule, FormsModule]
})
export class HomePage implements OnInit {
  public brand = brandConfig;
  protected branches: branch[] = [];
  protected selectedBranch: branch | null = null;
  protected selectedBranchCode: number | null = null;
  protected canSelectBranch = false;
  protected menuItems = [
    {
      title: 'Produtos',
      subtitle: 'Consulta de catálogo e saldos',
      url: '/app/products',
      icon: 'assets/icon/produto.png',
      accent: 'products'
    },
    {
      title: 'Clientes',
      subtitle: 'Carteira e informações comerciais',
      url: '/app/clients',
      icon: 'assets/icon/cliente.png',
      accent: 'clients'
    },
    {
      title: 'Movimentos',
      subtitle: 'Pedidos, orçamentos e histórico',
      url: '/app/orders',
      icon: 'assets/icon/venda2.png',
      accent: 'orders'
    },
  ];

  protected socialItems = [
    { title: 'Website', icon: 'assets/icon/website.png', url: this.brand.website },
    { title: 'Facebook', icon: 'assets/icon/facebook.png' },
    { title: 'Instagram', icon: 'assets/icon/instagram.png' },
  ];

  constructor(public menuCtrl: MenuController, private alertController: AlertController, private _route: Router, private branchSvc: BranchService) {
    
   }

  async ngOnInit() {
    this.menuCtrl.enable(true, 'menuOpt');
    await this.loadBranches();
  }

  async funcEmpty() {
    const alert = await this.alertController.create({
      header: 'Função Indisponível',
      //subHeader: 'A Sub Header Is Optional',
      message: 'Este recurso deve ser disponibilizado em breve, por favor aguarde!',
      buttons: ['Fechar'],
    });

    await alert.present();
  }

  async urlNotFound() {
    const alert = await this.alertController.create({
      header: 'URL inválida',
      //subHeader: 'A Sub Header Is Optional',
      message: 'Você tentou acessar um endereço que não existe, verifique!',
      buttons: ['Fechar'],
    });

    await alert.present();
  }



  async navigateURL(url = '') {
    if (!this.selectedBranch) {
      await this.showBranchRequired();
      return;
    }

    if (url) {
      this._route.navigateByUrl(url);
    } else {
      await this.urlNotFound();
    }
  }

  openExternalUrl(url?: string) {
    if (!url) {
      return;
    }

    window.open(url, '_blank');
  }

  async changeBranch(branchCode: number) {
    const selectedBranch = this.branches.find((item) => item.CODFILIAL === Number(branchCode));

    if (!selectedBranch) {
      this.selectedBranch = null;
      this.selectedBranchCode = null;
      await this.branchSvc.clearSelectedBranch();
      return;
    }

    await this.branchSvc.setSelectedBranch(selectedBranch);
    this.selectedBranch = selectedBranch;
    this.selectedBranchCode = selectedBranch.CODFILIAL;
  }

  private async loadBranches() {
    const [branches, selectedBranch, policy] = await Promise.all([
      this.branchSvc.getBranches(true),
      this.branchSvc.getSelectedBranch(),
      this.branchSvc.getBranchPolicy(),
    ]);

    this.branches = branches;
    this.canSelectBranch = policy.canSelectBranch;
    this.selectedBranch = selectedBranch;
    this.selectedBranchCode = selectedBranch?.CODFILIAL || null;

    if (!this.selectedBranch && branches.length === 1) {
      await this.changeBranch(branches[0].CODFILIAL);
    }
  }

  private async showBranchRequired() {
    const alert = await this.alertController.create({
      header: 'Selecione uma filial',
      message: 'Para acessar as telas do aplicativo, selecione uma filial primeiro.',
      buttons: ['Fechar'],
    });

    await alert.present();
  }

}
