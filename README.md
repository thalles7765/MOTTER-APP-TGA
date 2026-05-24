# MOTTER APP

Aplicativo Ionic/Angular com Capacitor e flavors Android por empresa.

## Requisitos

- Node.js instalado
- Java 17 configurado no ambiente
- Android SDK/Gradle funcionando
- Dependencias instaladas com:

```powershell
npm install
```

O projeto usa um patch local para manter os plugins Capacitor compatíveis com Java 17:

```powershell
npm run patch:android-java17
```

Esse patch tambem roda automaticamente no `postinstall` e durante o `sync:android`.

## Rodar Em Desenvolvimento

Medianeira:

```powershell
npm run start:medianeira
```

RobertoPF:

```powershell
npm run start:robertopf
```

Mercandressa:

```powershell
npm run start:mercandressa
```

Hafam:

```powershell
npm run start:hafam
```

Eletro Heloy:

```powershell
npm run start:eletroheloy
```

Para escolher uma porta especifica:

```powershell
npm run start:medianeira -- --host 0.0.0.0 --port 4201
```

## Build Web Por Flavor

Medianeira:

```powershell
npm run build:medianeira
```

RobertoPF:

```powershell
npm run build:robertopf
```

Mercandressa:

```powershell
npm run build:mercandressa
```

Hafam:

```powershell
npm run build:hafam
```

Eletro Heloy:

```powershell
npm run build:eletroheloy
```

## Sync Android

Depois de alterar assets, plugins, configuracoes do Capacitor ou flavors:

```powershell
npm run sync:android
```

Esse comando executa:

```powershell
npm run patch:android-java17
npx cap sync android
npm run patch:android-java17
```

## Gerar APK Debug

Medianeira:

```powershell
npm run android:medianeira
```

APK gerado em:

```text
android/app/build/outputs/apk/medianeira/debug/app-medianeira-debug.apk
```

RobertoPF:

```powershell
npm run android:robertopf
```

APK gerado em:

```text
android/app/build/outputs/apk/robertopf/debug/app-robertopf-debug.apk
```

Mercandressa:

```powershell
npm run android:mercandressa
```

APK gerado em:

```text
android/app/build/outputs/apk/mercandressa/debug/app-mercandressa-debug.apk
```

Hafam:

```powershell
npm run android:hafam
```

APK gerado em:

```text
android/app/build/outputs/apk/hafam/debug/app-hafam-debug.apk
```

Eletro Heloy:

```powershell
npm run android:eletroheloy
```

APK gerado em:

```text
android/app/build/outputs/apk/eletroheloy/debug/app-eletroheloy-debug.apk
```

## Build Android Manual

Quando precisar rodar passo a passo:

```powershell
npm run build:robertopf
npm run sync:android
cd android
gradlew.bat assembleRobertopfDebug
```

Troque `RobertopfDebug` por:

- `MedianeiraDebug`
- `RobertopfDebug`
- `MercandressaDebug`
- `HafamDebug`
- `EletroheloyDebug`

## Flavors

Os arquivos principais de configuracao por empresa ficam em:

```text
src/environments/environment.ts
src/environments/environment.prod.ts
src/environments/environment.robertopf.ts
src/environments/environment.robertopf.prod.ts
src/environments/environment.mercandressa.ts
src/environments/environment.mercandressa.prod.ts
src/environments/environment.hafam.ts
src/environments/environment.hafam.prod.ts
src/environments/environment.eletroheloy.ts
src/environments/environment.eletroheloy.prod.ts
```

Assets por empresa ficam em:

```text
src/assets/brands/medianeira
src/assets/brands/robertopf
src/assets/brands/mercandressa
src/assets/brands/hafam
src/assets/brands/eletroheloy
```

Arquivos Android por flavor ficam em:

```text
android/app/src/medianeira
android/app/src/robertopf
android/app/src/mercandressa
android/app/src/hafam
android/app/src/eletroheloy
```

## Firebase Push

Quando usar push notifications, cada flavor deve ter seu arquivo:

```text
android/app/src/medianeira/google-services.json
android/app/src/robertopf/google-services.json
android/app/src/mercandressa/google-services.json
android/app/src/hafam/google-services.json
android/app/src/eletroheloy/google-services.json
```

Sem esse arquivo, o build do flavor pode falhar ou o push pode nao registrar corretamente.
