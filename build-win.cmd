pyi-makespec --add-data="mangareader\build\styles.css;mangareader\build" ^
  --add-data="mangareader\build\scripts.js;mangareader\build" ^
  --add-data="mangareader\static-assets\menu.svg;mangareader\static-assets" ^
  --add-data="mangareader\static-assets\menu-light.svg;mangareader\static-assets" ^
  --add-data="mangareader\static-assets\scroll.svg;mangareader\static-assets" ^
  --add-data="mangareader\static-assets\scroll-light.svg;mangareader\static-assets" ^
  --add-data="mangareader\static-assets\boot.template.html;mangareader\static-assets" ^
  --add-data="mangareader\static-assets\doc.template.html;mangareader\static-assets" ^
  --add-data="mangareader\static-assets\img.template.html;mangareader\static-assets" ^
  --add-data="mangareader\static-assets\roboto-regular.woff2;mangareader\static-assets" ^
  --add-data="mangareader\static-assets\roboto-bold.woff2;mangareader\static-assets" ^
  --add-data="mangareader\static-assets\zenscroll.js;mangareader\static-assets" ^
  --add-data="version;." ^
  --add-data="unrar.exe;." ^
  --icon="icon\air1.ico" ^
  --name="mangareader" ^
  --noconsole ^
reader.py && ^
pyinstaller --noconfirm mangareader.spec
