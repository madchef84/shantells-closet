# Shantell's Closet v1.5.0: install files

This release adds an Android APK (self-signed), a Windows installer (NSIS, unsigned) and an unsigned iOS IPA. The live link https://shantells-closet.surge.sh is unchanged.

Live web app (always up to date): https://shantells-closet.surge.sh

Download the install files from the latest GitHub Release:
https://github.com/madchef84/shantells-closet/releases/latest

| Device | File |
|---|---|
| Android | `Shantells-Closet-1.5.0.apk` |
| Windows | `Shantells-Closet-Setup-1.5.0.exe` |
| iPhone/iPad | `Shantells-Closet-1.5.0-unsigned.ipa` |

## Android (sideload the APK)
1. On the phone, open the Release page and tap the `.apk` file to download it.
2. Open it from the download notification or the Files app.
3. If Android says the install is blocked, tap **Settings** and turn on **Allow from this source** for your browser or Files app, then go back and tap **Install**.
4. If Play Protect warns about an unknown app, tap **More details > Install anyway**.
5. Open **Shantell's Closet** from the app drawer. Later versions install over this one because they use the same signing key.

## Windows (installer)
1. Download `Shantells-Closet-Setup-1.5.0.exe` and run it.
2. The installer is not code-signed, so Windows SmartScreen may show "Windows protected your PC". Click **More info**, then **Run anyway**.
3. Follow the installer. It adds Start menu and desktop shortcuts.
4. The app opens the copy of the site bundled inside it, so it works offline. If that copy can't load, it opens the live site instead.

## iPhone / iPad (unsigned IPA via AltStore or Sideloadly)
The IPA is unsigned. A sideloading tool signs it with your own free Apple ID. With a free Apple ID the app expires after 7 days, so refresh it in AltStore, or re-sideload it.

**AltStore**
1. Install AltServer on a Mac or PC (https://altstore.io) and install AltStore on the iPhone.
2. Download the `.ipa` to the iPhone (save it to Files).
3. In AltStore, go to **My Apps > +** and pick the `.ipa`.
4. On iOS 16 and later, turn on **Settings > Privacy & Security > Developer Mode**, then restart the phone.
5. AltStore refreshes the app over Wi-Fi when AltServer is running.

**Sideloadly**
1. Install Sideloadly (https://sideloadly.io) on a Mac or PC and plug in the iPhone.
2. Drag the `.ipa` into Sideloadly, enter your Apple ID and click **Start**.
3. On the iPhone, go to **Settings > General > VPN & Device Management**, tap your Apple ID and choose **Trust**.

## iPhone alternative: Safari "Add to Home Screen" (no sideloading)
1. Open https://shantells-closet.surge.sh in **Safari**.
2. Tap **Share** (the square with an arrow), then **Add to Home Screen**, then **Add**.
3. Launch it from the home-screen icon. It runs full screen and keeps working offline after the first visit. It never expires and updates by itself.
