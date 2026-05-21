import { Component, inject, Input, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AlertController, ModalController, IonButton, IonContent, IonHeader, IonTitle, IonButtons, IonMenuButton, IonToolbar } from '@ionic/angular/standalone';
import { ProductService } from 'src/app/services/products/product.service';
import { CapacitorBarcodeScanner } from '@capacitor/barcode-scanner'
import { ActivatedRoute } from '@angular/router';
import { ConfigService } from 'src/app/services/config/config.service';

@Component({
  selector: 'app-product-detail',
  templateUrl: './product-detail.page.html',
  styleUrls: ['./product-detail.page.scss'],
  providers: [ProductService, CapacitorBarcodeScanner],
  imports: [IonButton, IonContent, IonHeader, IonTitle, IonToolbar, IonButtons, CommonModule, FormsModule]
})
export class ProductDetailPage implements OnInit {
  @Input() product: any;
  protected xConfig;

  private productSvc = inject(ProductService);

  // protected product;
  protected searchText = '';

  constructor(private alertController: AlertController, private cfgSvc: ConfigService, private _route: ActivatedRoute, private modalCtrl: ModalController) { }

  cancel() {
    return this.modalCtrl.dismiss(null, 'cancel');
  }

  confirm() {
    return this.modalCtrl.dismiss(null, 'confirm');
  }

  async ngOnInit() {
    await this.getConfig();
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
