# Firebase por flavor

Para habilitar Push Notifications via FCM, adicione o arquivo real do Firebase em cada flavor:

- `android/app/src/medianeira/google-services.json`
- `android/app/src/robertopf/google-services.json`
- `android/app/src/mercandressa/google-services.json`
- `android/app/src/hafam/google-services.json`
- `android/app/src/eletroheloy/google-services.json`

O Gradle aplica `com.google.gms.google-services` automaticamente quando encontrar pelo menos um desses arquivos.
