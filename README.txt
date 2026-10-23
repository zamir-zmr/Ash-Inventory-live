FIX 1 (pos_system.html): desktop par cart bar ("X ITEMS") ab left me rehta hai aur Order Bill panel ke neeche nahi jata.
FIX 2 (index.html): startup blink/flash fix - dark pehla paint, POS iframe fade-in, window resize sirf ek baar.

IMPORTANT - manifest.json me ye do values rakhein (PWA window ka pehla black/white flash isi se control hota hai):
  "background_color": "#0E1116",
  "theme_color": "#0E1116"
Phir app uninstall -> reinstall karein (Chrome manifest purana cache rakhta hai).
