Changes (only additive, mobile unchanged):
- index.html: <style id="desktop-fullwidth-fix"> + resize script before </head>
- pos_system.html: same fix block before </head>
Note: PWA ka purana chhota window size Chrome yaad rakhta hai. Naya code window ko auto-maximize karega;
agar phir bhi chhota khule to app ko ek baar uninstall -> reinstall kar lein aur manifest.json me "display": "standalone" rakhein.
