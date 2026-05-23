import { Component, inject, OnInit, ViewChild, ViewEncapsulation } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ModalController, AlertController, LoadingController, IonAccordion, IonButton, IonAccordionGroup, IonItem, IonList, IonSelect, IonSelectOption, IonDatetime, IonIcon, IonFab, IonFabButton, IonSearchbar, IonHeader, IonToolbar, IonButtons, IonMenuButton, IonTitle, IonContent } from '@ionic/angular/standalone';
import { OrdersService } from 'src/app/services/orders/orders.service';
import { addIcons } from 'ionicons';
import { Share } from '@capacitor/share';
// import * as pdfMake from "pdfmake/build/pdfmake"; 
// import * as pdfFonts from 'pdfmake/build/vfs_fonts';
// import pdfMake from "pdfmake/build/pdfmake";
// import pdfFonts from "pdfmake/build/vfs_fonts";
// import * as pdfMake from 'pdfmake/build/pdfmake';  
// import * as pdfFonts from 'pdfmake/build/vfs_fonts'; 
import * as pdfMake from "pdfmake/build/pdfmake";
import * as pdfFonts from 'pdfmake/build/vfs_fonts';
import { Platform } from '@ionic/angular';
import { FileOpener, FileOpenerOptions } from '@capacitor-community/file-opener';

import { Filesystem, Directory } from '@capacitor/filesystem';

import {
  add,
} from 'ionicons/icons';
import { OrdersDetailComponent } from '../orders-detail/orders-detail.component';
import { OrderNewComponent } from '../order-new/order-new.component';
import { order } from 'src/app/interfaces/order';
import { brandConfig } from 'src/app/branding/brand-config';

@Component({
  selector: 'app-orders',
  templateUrl: './orders.component.html',
  styleUrls: ['./orders.component.scss'],
  encapsulation: ViewEncapsulation.None,
  imports: [IonAccordion, IonButton, IonAccordionGroup, IonItem, IonList, IonSelect, IonSelectOption, IonDatetime, IonSearchbar, IonIcon, IonFab, IonFabButton, IonContent, IonHeader, IonTitle, IonToolbar, CommonModule, FormsModule, IonButtons, IonMenuButton]
})
export class OrdersComponent implements OnInit {
  @ViewChild('accordionGroup', { static: true }) accordionGroup!: IonAccordionGroup;
  @ViewChild('searchGroup', { static: true }) searchGroup!: IonSearchbar;
  @ViewChild('selectGroup', { static: true }) selectGroup!: IonSelect;
  @ViewChild('dateGroup', { static: true }) dateGroup!: IonDatetime;

  private pdfObj: any;
  private orderSvc = inject(OrdersService);
  protected brand = brandConfig;
  protected orders: any[] = [];

  constructor(private modalCtrl: ModalController, private alertController: AlertController, private loadingController: LoadingController, public platform: Platform) {
    addIcons({ add });
  }

  async ngOnInit() {
    await this.searchOrders();
  }


  toggleAccordion = () => {
    const nativeEl = this.accordionGroup;
    if (nativeEl.value === '1') {
      nativeEl.value = undefined;
    } else {
      nativeEl.value = '1';
    }
  };

  changeDate(eventPc) {
    console.log('changed')
    // console.log(eventPc.detail.value)

    const nativeElDate = this.dateGroup;
    const nativeElSelect = this.selectGroup;
    const nativeElSearch = this.searchGroup;

    console.log('search')
    console.log(nativeElSearch.value)

    this.searchOrders();
  }

  async searchOrders() {

    // const target = event.target as HTMLIonSearchbarElement;
    // const query = target.value?.toUpperCase() || '';
    const ntElDate = this.dateGroup;
    const ntElSelect = this.selectGroup;
    const ntElSearch = this.searchGroup;
    await this.showLoading();
    // this.searchText = query;
    // console.log(ntElSelect?.value)

    await this.orderSvc.getData({
      search: ntElSearch.value?.toUpperCase(),
      status: ntElSelect?.value === 'D' ? Array(ntElSelect?.value) : ntElSelect.value,
      date_select: ntElDate.value || new Date()
    }).then((data) => {

      if (data.status === 200) {
        this.orders = data.data.data;
      } else {
        console.log('Erro na requisiÃ§Ã£o')
        console.log(data)
      }
    })
    // this.results = this.data.filter((d) => d.toLowerCase().includes(query));
  }

  async showLoading() {
    const loading = await this.loadingController.create({ message: 'Carregando informaÃ§Ãµes...' });
    await loading.present();

    setTimeout(async () => {
      await loading.dismiss();
    }, 1700);
  }

  formatarData(data: Date): string {
    const dia = data.getDate().toString().padStart(2, '0');
    const mes = (data.getMonth() + 1).toString().padStart(2, '0'); // MÃªs comeÃ§a em 0
    const ano = data.getFullYear().toString();
    return `${dia}/${mes}/${ano}`;
  }

  async sharedOrder(xOrder) {
    let xItemMsg = '';
    this.showLoading();

    await this.orderSvc.getItemsOrder(xOrder.IDMOV).then((ItemsOrder) => {
      console.log('items order')
      console.log(ItemsOrder.data)

      if (!ItemsOrder.data.error) {
        if (ItemsOrder.data.data.length > 0) {
          let xItem = '';

          ItemsOrder.data.data.map((item) => {
            let xItem = `*(${item.NSEQ})* / ${item.CODPRD} / ${item.CODUND_ECM}\n${item.NOMEFANTASIA}\nQtd: *${item.QUANTIDADE}* / PreÃ§o: *${item.PRECOUNITARIO.toFixed(2)}*\nTotal: *${item.VALORTOTALITEM.toFixed(2)}*`;

            xItemMsg += xItemMsg !== '' ? `\n\n${xItem}` : xItem;
          })
        }
      }
    })



    // await Share.share({
    //   text: `OrÃ§amento #*${xOrder.NUMEROMOV}*\n\nData:\n*${this.formatarData(new Date(xOrder.DATAEMISSAO))}*\nCliente:\n*${xOrder.NOMEFANTASIA}*\nCondiÃ§Ã£o Pagamento:\n*(${xOrder.CODCPG})* - *${xOrder.DESC_CONDPGTO}*\n\n## *PRODUTOS* ## \n\n${xItemMsg}\n\n## *VALORES* ## \n\nDesconto: *${xOrder.VALORDESC.toFixed(2)}*\nValor Bruto: *${xOrder.VALORBRUTO.toFixed(2)}*\nValor LÃ­quido: *${xOrder.VALORLIQUIDO.toFixed(2)}*\n\nVendedor:\n*(${xOrder.CODVEN1})* - *${xOrder.VENDEDOR}*\n*${xOrder.TELVEND1}*\n\n${this.brand.companyFullName}\n${this.brand.phone}\n\n`,
    // });
  }




  async generatePdf(xOrder: order) {
    // console.log('generate pdf');
    (<any>pdfMake).addVirtualFileSystem(pdfFonts);
    const brandLogo = await this.assetToDataUrl(this.brand.assets.logo);
    const pdfPrimary = this.brand.theme?.["--ion-color-primary"] || '#04467c';
    const pdfSecondary = this.brand.theme?.["--ion-color-secondary"] || '#252525';

    console.log(xOrder);
    let xItens: any[] = [[
      {
        "text": 'CÃ³digo',
        "bold": true,
        "fontSize": 8,
        "color": "white",
        "fillColor": pdfPrimary
      },
      {
        "text": 'DescriÃ§Ã£o',
        "bold": true,
        "fontSize": 8,
        "color": "white",
        "fillColor": pdfPrimary
      },
      {
        "text": 'Unidade',
        "bold": true,
        "fontSize": 8,
        "color": "white",
        "fillColor": pdfPrimary
      },
      {
        "text": 'Unit.',
        "bold": true,
        "fontSize": 8,
        "color": "white",
        "fillColor": pdfPrimary
      },
      {
        "text": 'Qtd',
        "bold": true,
        "fontSize": 8,
        "color": "white",
        "fillColor": pdfPrimary
      },
      {
        "text": 'Desc.',
        "bold": true,
        "color": "white",
        "fillColor": pdfPrimary,
        "fontSize": 8,
      },
      {
        "text": 'Total',
        "bold": true,
        "fontSize": 8,
        "color": "white",
        "fillColor": pdfPrimary
      }
    ]]

    console.log(this.formatarData(new Date(xOrder.DATAEMISSAO)))
    await this.orderSvc.getItemsOrder(xOrder.IDMOV).then((ItemsOrder) => {
      // console.log('items order')
      // console.log(ItemsOrder.data)

      console.log(ItemsOrder.data.data)

      if (!ItemsOrder.data.error) {
        if (ItemsOrder.data.data.length > 0) {


          ItemsOrder.data.data.map((item) => {
            // if (ItemsOrder.data.data.length === 1) {
            //   xItens.push(
            //     {
            //       "text": item.NOMEFANTASIA,
            //       "bold": true,
            //     },
            //     {
            //       "text": item.VALORUNITARIO,
            //     },
            //     {
            //       "text": item.QUANTIDADE,
            //     },
            //     {
            //       "text": item.VALORDESC,
            //     },
            //     {
            //       "text": item.VALORTOTALITEM,
            //       "bold": true,
            //     }
            //   )
            // } else {
            xItens.push([
              {
                "text": item.CODPRD,
                "bold": true,
                "color": "black",
                "fontSize": 10,
              },
              {
                "text": item.NOMEFANTASIA,
                "bold": true,
                "color": "black",
                "fontSize": 10,
              },
              {
                "text": item.CODUND_ECM,
                "color": "black",
                "fontSize": 10,
              },
              {
                "text": item.PRECOUNITARIO.toFixed(2),
                "color": "black",
                "fontSize": 10,
              },
              {
                "text": item.QUANTIDADE.toFixed(2),
                "color": "black",
                "fontSize": 10,
              },
              {
                "text": item.VALORDESC.toFixed(2),
                "color": "black",
                "fontSize": 10,
              },
              {
                "text": `R$ ${item.VALORTOTALITEM.toFixed(2)}`,
                "bold": true,
                "color": "black",
                "fontSize": 10,
              }]
            )

          })
        }
      }
    })


    var dd = {
      header: {
        columns: [
          // { text: `${this.brand.companyName} - App`, fontSize: 8, bold:true, italics: true, marginLeft:40, marginTop: 15 },
          { text: 'Orçamento gerado via aplicativo mobile', marginLeft: 40, fontSize: 8, italics: true, bold: true, marginTop: 15, color: pdfSecondary },
          { text: 'Versão do sistema 1.5', fontSize: 8, italics: true, marginLeft: 170, bold: true, marginTop: 15, color: pdfSecondary },
        ]
      },
      footer: {
        columns: [
          { text: 'Motter Sistemas', marginLeft: 40, style: 'documentFooterCenter', bold: true, fontSize: 10, color: pdfSecondary },
          { text: this.brand.website, marginLeft: 35, style: 'documentFooterRight', color: pdfPrimary },
        ]
      },
      content: [
        // Header
        {
          columns: [
            {
              image: brandLogo,
              width: 150,
            },
            [
              {
                text: this.brand.companyFullName,
                fontSize: 18,
                bold: true,
                marginTop: 15,
                width: '*'
              },
              {
                stack: [
                  {
                    columns: [
                      {
                        text: this.brand.companyDocument,
                        width: '*'
                      },
                      {
                        text: this.brand.stateRegistration ? `Insc.: ${this.brand.stateRegistration}` : '',
                        width: 120
                      }
                    ]
                  },
                  {
                    columns: [
                      {
                        text: this.brand.cityState,
                        width: '*'
                      },
                      {
                        text: this.brand.phone,
                        bold: true,
                        width: 120
                      }
                    ]
                  },
                  {
                    columns: [
                      {
                        text: this.brand.zipCode,
                        width: '*'

                      },
                      {
                        text: this.brand.mobilePhone,
                        bold: true,
                        width: 120

                      }
                    ]
                  },

                ]
              }
            ],
          ],
        },
        // Billing Headers
        {
          columns: [
            {
              text: 'Vendedor',
              fontSize: 8,
              width: '*'
            },
            {
              text: 'EmissÃ£o',
              fontSize: 8
            },
            // {
            //   text: 'Movimento',
            //   fontSize: 8
            // },
            {
              text: 'Pagamento',
              fontSize: 8
            },
            {
              text: 'NÂº Documento',
              fontSize: 8
            },
          ]
        },
        // Billing Details
        {
          columns: [
            {
              text: `(${xOrder.CODVEN1}) - ${xOrder.VENDEDOR}`,
              bold: true,
              fontSize: 10,
              width: '*'
            },
            {
              text: `${this.formatarData(new Date(xOrder.DATAEMISSAO))}`,
              bold: true,
              fontSize: 10,
            },
            // {
            //   text: `(${xOrder.CODTMV}) - ${xOrder.NOME}`,
            //   bold: true,
            //   fontSize: 10,

            // },
            {
              text: `(${xOrder.CODCPG}) - ${xOrder.DESC_CONDPGTO}`,
              bold: true,
              fontSize: 10,
            },
            {
              text: `${xOrder.NUMEROMOV}`,
              bold: true,
              fontSize: 10,
            },
          ]
        },
        // Billing Address Title
        {
          columns: [
            {
              text: 'Cliente',
              fontSize: 8,
              marginTop: 5
            },
            {
              text: 'Contato',
              fontSize: 8,
              marginTop: 5
            },
          ]

        },
        // Billing Address
        {
          columns: [
            {
              text: `${xOrder.CODCFO}\n${xOrder.NOMEFANTASIA}`,
              bold: true,
              fontSize: 10,
            },
            {
              text: `${xOrder.TELEFONE_CLIENTE}\n${xOrder.CIDADE_CLIENTE} - ${xOrder.ESTADO_CLIENTE}`,
              bold: true,
              fontSize: 10,
            },
          ]
        },
        // Line breaks
        '\n',
        // Items
        {
          table: {
            // headers are automatically repeated if the table spans over multiple pages
            // you can declare how many rows should be treated as headers
            headerRows: 1,
            widths: [40, '*', 'auto', 'auto', 'auto', 'auto', 'auto'],

            body:
              // Table Header
              xItens,
            // [
            //   {
            //     text: 'teste',
            //     bold: true,
            //   },
            //   {
            //     text: '0',
            //   },
            //   {
            //     text: '0',
            //   },
            //   {
            //     text: '0',
            //   },
            //   {
            //     text: '0',
            //     bold: true,
            //   }
            // ],
            // END Items

          }, // table
          //  layout: 'lightHorizontalLines'
        },
        // TOTAL
        '\n',
        {
          table: {
            // headers are automatically repeated if the table spans over multiple pages
            // you can declare how many rows should be treated as headers
            headerRows: 0,
            widths: ['*', 'auto'],

            body: [
              // Total
              [
                {
                  text: 'Valor Bruto',
                  style: 'itemsFooterSubTitle',
                },
                {
                  text: `R$ ${xOrder.VALORBRUTO.toFixed(2)}`,
                  style: 'itemsFooterSubValue',
                  bold: true,
                }
              ],
              [
                {
                  text: 'Desconto',
                  style: 'itemsFooterSubTitle',
                },
                {
                  text: `R$ ${xOrder.VALORDESC.toFixed(2)}`,
                  style: 'itemsFooterSubValue',
                  bold: true,
                }
              ],
              [
                {
                  text: 'Total',
                  style: 'itemsFooterTotalTitle'
                },
                {
                  text: `R$ ${xOrder.VALORLIQUIDO.toFixed(2)}`,
                  style: 'itemsFooterTotalValue',
                  bold: true,
                }
              ],
            ]
          }, // table
          layout: 'lightHorizontalLines'
        },
        // Signature
        '\n\n',
        {
          text: 'AVISOS',
          style: 'notesTitle',
          bold: true,
        },
        {
          text: `O VALOR DESSE ORÃ‡AMENTO ESTARÃ SUJEITO A\nALTERAÃ‡Ã•ES EM DECORRÃŠNCIA DE ATUALIZAÃ‡ÃƒO DE PREÃ‡O DO FORNECEDOR.`,
          style: 'notesText',
          fontSize: 8
        },
        {
          text: `VALIDADE DO ORÃ‡AMENTO PRA 10 DIAS A CONTAR DA DATA DE EMISSÃƒO`,
          style: 'notesText',
          marginTop: 4,
          fontSize: 8
        }
        // {
        //   text: `( * ) Estoque indisponÃ­vel ou parcial por ocasiÃ£o do ORÃ‡AMENTO.`,
        //   style: 'notesText',
        //   fontSize: 10
        // }
      ],

      center: {
        alignment: 'center',
      },
      defaultStyle: {
        columnGap: 20,
      }
    }

    this.pdfObj = pdfMake.createPdf(dd);
    console.log(this.pdfObj);
  }

  private async assetToDataUrl(assetUrl: string) {
    const response = await fetch(assetUrl);
    const blob = await response.blob();

    return await new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(String(reader.result));
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  }

  async openNewOrder() {
    const modal = await this.modalCtrl.create({
      component: OrderNewComponent,
      // componentProps: { order: orderData }
    });

    modal.present();

    const { data, role } = await modal.onWillDismiss();
    if (role === 'confirm') {
      // this.message = `Hello, ${data}!`;
      this.searchOrders();
    }
  }



  async openDetail(orderData) {
    const modal = await this.modalCtrl.create({
      component: OrdersDetailComponent,
      componentProps: { order: orderData }
    });

    modal.present();

    const { data, role } = await modal.onWillDismiss();
    // if (role === 'confirm') {
    //   this.message = `Hello, ${data}!`;
    // }
  }


  async downloadPdf(orderData) {
    try {
      await this.generatePdf(orderData);

      // if (this.platform.is('capacitor') || this.platform.is('mobile')) {
      if (this.platform.is('capacitor') || this.platform.is('android')) {

        this.pdfObj.getBase64(async (data) => {
          try {
            let path = `orcamentos/orc_${orderData.NUMEROMOV}.pdf`
            console.log(data)

            const result = await Filesystem.writeFile({
              path,
              data,
              directory: Directory.Documents,
              recursive: true
            }).then(async (createdFile) => {
              const fileOpenerOptions: FileOpenerOptions = {
                filePath: createdFile.uri,
                contentType: 'application/pdf',
                openWithDefault: true,
              };
              await FileOpener.open(fileOpenerOptions);
            })


          } catch (error) {

          }
        })

      } else {
        this.pdfObj.open();
      }
    } catch (error) {

    }
  }


  async getOrders() {
    await this.orderSvc.getData().then((data) => {
      if (data.status === 200) {
        this.orders = data.data.data;
      } else {
        console.log('@@@')
        console.log(data)
      }
    })
  }

  async funcEmpty() {
    const alert = await this.alertController.create({
      header: 'FunÃ§Ã£o IndisponÃ­vel',
      //subHeader: 'A Sub Header Is Optional',
      message: 'Este recurso deve ser disponibilizado em breve, por favor aguarde!',
      buttons: ['Fechar'],
    });

    await alert.present();
  }
}
