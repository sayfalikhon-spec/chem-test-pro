CHEM TEST PRO — насб дар Termux

1) ZIP-ро кушоед ва папкаи CHEM_TEST_PRO-ро ба хотираи телефон гузаронед.
2) Дар Termux ба папкаи лоиҳа дароед. Масалан:
   cd /sdcard/Download/CHEM_TEST_PRO
   (агар иҷозати хотира надошта бошед: termux-setup-storage)
3) Инҳоро иҷро кунед:
   pkg update
   pkg install nodejs-lts
   npm install
   npm start
4) Дар браузер кушоед:
   http://127.0.0.1:3000

Барои дастрасӣ аз интернет (равзанаи дуюми Termux):
   cloudflared tunnel --url http://localhost:3000

Муҳим:
- Равзанаи Termux бо node server.js бояд фаъол монад.
- Равзанаи cloudflared низ бояд фаъол монад.
- Аввалин корбари сабтиномшуда администратор мешавад.
- Маълумот дар data.json нигоҳ дошта мешавад. Онро пок накунед, агар натиҷаҳоятонро нигоҳ доштан хоҳед.
- Барои сомонаи доимӣ hosting бо диски доимӣ лозим аст; Quick Tunnel танҳо барои санҷиш аст.
