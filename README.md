# MOTTER APP

Aplicativo Ionic/Angular com Capacitor e flavors Android por empresa.

## Requisitos

- Node.js 22 ou superior. Ambiente atual validado com Node.js 24.15.0.
- JDK 21 LTS configurado no ambiente.
- Android SDK instalado com API 36.
- Gradle wrapper do projeto. Nao instale Gradle global manualmente para este app.
- Dependencias instaladas com:

```powershell
npm install
```

Configure `JAVA_HOME` apontando para a pasta raiz do JDK 21, por exemplo:

```text
C:\Program Files\Microsoft\jdk-21.0.10.7-hotspot
```

No `Path`, mantenha `%JAVA_HOME%\bin` antes de atalhos antigos do Java, principalmente antes de:

```text
C:\Program Files\Common Files\Oracle\Java\javapath
```

Valide o ambiente:

```powershell
node -v
npm.cmd -v
java -version
npm run check:jdk21
android\gradlew.bat -p android --version
```

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

```powershell
npm run build:medianeira
npm run build:robertopf
npm run build:mercandressa
npm run build:hafam
npm run build:eletroheloy
```

## Sync Android

Depois de alterar assets, plugins, configuracoes do Capacitor ou flavors:

```powershell
npm run sync:android
```

Esse comando valida o JDK 21 e depois executa:

```powershell
npx cap sync android
```

## Versionamento Debug Android

Todo comando `npm run android:<flavor>` incrementa automaticamente a versao em `android/app/build.gradle` antes de gerar o APK debug.

Campos atualizados:

```text
versionCode = codigo interno usado pelo Android para aceitar atualizacao
versionName = versao visivel, no formato 1.0.<versionCode>
```

Isso garante que o APK debug novo possa atualizar o app ja instalado no aparelho quando o `applicationId` do flavor for o mesmo.

Exemplos:

```powershell
npm run android:robertopf
npm run android:medianeira
```

Se voce gerar o APK manualmente direto pelo Gradle, rode primeiro:

```powershell
npm run version:android-debug -- robertopf
```

Depois siga com o build web, sync e Gradle. Sem aumentar o `versionCode`, o Android pode recusar a instalacao por cima ou manter uma versao anterior.

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
npm run version:android-debug -- robertopf
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
