# Android Release — инструкция (этап B)

> Актуально: 30.08.2026. Что уже готово и какие шаги остались до публикации в Google Play.

## 1. Что уже готово

| Артефакт | Путь | Примечание |
|---|---|---|
| Debug APK (тест на устройстве) | `android/app/build/outputs/apk/debug/app-debug.apk` | собран на `VITE_API_URL=http://192.168.0.148:3002/api` (LAN IP) |
| **Release keystore** | `android/app/keystore/swiftmatch-release.jks` | RSA-2048, 10000 дней, PKCS12, alias `swiftmatch-release`. **СЕКРЕТ, gitignored — не коммитить, бекапить отдельно** |
| Креды keystore | `android/app/keystore/keystore-credentials.txt` | STORE_PASSWORD / KEY_ALIAS / KEY_PASSWORD. **СЕКРЕТ, gitignored** |
| **Release APK** | `android/app/build/outputs/apk/release/app-release.apk` (22.6 MB) | подписан, apksigner verify OK, SHA-256 `0af36dbf52737b09134b3282599702f313dc7331378989cc8a4f0f9417e6ec41` |
| **Release AAB** | `android/app/build/outputs/bundle/release/app-release.aab` (21.6 MB) | для Google Play |

`android/app/build.gradle` уже содержит `signingConfigs.release` (читает env `KEYSTORE_PATH`/`KEYSTORE_STORE_PASSWORD`/`KEYSTORE_KEY_ALIAS`/`KEYSTORE_KEY_PASSWORD` с fallback на `keystore/keystore-credentials.txt`). `android/gradle.properties` — `android.enableAppCompression=false` (обход бага AGP 8.13 MD5-hash на Windows).

## 2. Как пересобрать release заново

Из `android/` (JDK 21! AGP 8.14.3 не работает на JDK 25):

```bash
export JAVA_HOME="<путь к JDK 21>"
# (опц.) если пароли не в keystore-credentials.txt:
# export KEYSTORE_STORE_PASSWORD=... KEYSTORE_KEY_ALIAS=swiftmatch-release KEYSTORE_KEY_PASSWORD=...

./gradlew assembleRelease        # -> outputs/apk/release/app-release.apk
./gradlew bundleRelease          # -> outputs/bundle/release/app-release.aab
```

Проверка подписи:

```bash
./gradlew signingReport | grep -A2 "Variant: release"
# или
apksigner verify --print-certs app/build/outputs/apk/release/app-release.apk
```

⚠️ Перед сборкой APK для **прода**: собрать фронт с прод-доменом `https://swiftmatch.app` (`VITE_API_URL` + `VITE_WS_URL`), затем `npx cap sync android`, затем `gradlew assembleRelease/bundleRelease`. Текущий release собран на dev/LAN IP — для прода пересобрать.

## 3. Шаги до публикации в Google Play (внешние действия)

1. **Создать Play Console аккаунт** (developer, $25 разово).
2. **Upload key**: выпущенный `app-release.aab` подписан app-signing key (самозаверенным из нашего keystore). Google Play использует **App Signing Play**: можно загрузить AAB, подписанный нашим key — Google переподпишет для распространения. Этот же keystore важен как источник **upload key** при регистрации ключа в Play Console. НЕ терять keystore — без него нельзя обновлять приложение.
3. **Секретность keystore**: файл `swiftmatch-release.jks` + `keystore-credentials.txt` — бэкап в надёжное место (менеджер паролей / офлайн). Потеря keystore = невозможность обновить приложение.
4. **App Links / deep links** (для верификации емейла, deeplink'ов): домен + `assetlinks.json` в корне домена с **SHA256 fingerprint** нашего signing cert (см. SHA-256 выше) + `settings`-манифест `android:pathPrefix`. Включить `autoVerify=true`.
5. **Политика и контент**: Privacy Policy + Terms (уже есть на `/legal/*`), классификация 17+.
6. **Прод-бинарь**: пересобрать с прод-доменом (п.2), загрузить AAB в Play Console → внутреннее тестирование → продакшен.

## 4. Критичные правила

- **Никогда не коммитить** `keystore/*.jks`, `keystore-credentials.txt` (уже в `android/.gitignore`), `.env`.
- Keystore и credentials — **только backup**, не в git и не в облачные репозитории без шифрования.
- Debug и Release не путать: на устройство для ручного теста ставится Debug APK; в Play — только подписанный AAB.
