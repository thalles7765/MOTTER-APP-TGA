// This file can be replaced during build by using the `fileReplacements` array.
// `ng build` replaces `environment.ts` with `environment.prod.ts`.
// The list of file replacements can be found in `angular.json`.

export const environment = {
  production: false,
  flavor: "medianeira",
  appName: "Medianeira App",
  companyName: "Medianeira",
  companyFullName: "Medianeira Ferragens",
  website: "http://www.medianeiraferragens.com.br/",
  assets: {
    logo: "assets/brands/medianeira/logo.png",
    menuLogo: "assets/brands/medianeira/Splash/img432xRect.png",
    favicon: "assets/brands/medianeira/icon/favicon.png",
    banners: [
      "assets/brands/medianeira/banners/1.png",
      "assets/brands/medianeira/banners/2.png",
      "assets/brands/medianeira/banners/3.png",
      "assets/brands/medianeira/banners/4.png"
    ]
  },
  theme: {
    "--ion-color-primary": "#f2612a",
    "--ion-color-secondary": "#04467c",
    "--ion-color-tertiary": "#252525",
    "--app-header-background": "#ffffff",
    "--app-border-color": "#f2612a"
  },
  url_api: "http://85.31.63.163:5120/api/v1"
  // url_api: "http://localhost:5100/api/v1",
  // url_api: "http://213.136.73.210:5100/api/v1"
  // url_api: "http://localhost:3333/api/v1"
};

/*
 * For easier debugging in development mode, you can import the following file
 * to ignore zone related error stack frames such as `zone.run`, `zoneDelegate.invokeTask`.
 *
 * This import should be commented out in production mode because it will have a negative impact
 * on performance if an error is thrown.
 */
// import 'zone.js/plugins/zone-error';  // Included with Angular CLI.
