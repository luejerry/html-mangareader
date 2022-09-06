# -*- mode: python ; coding: utf-8 -*-


block_cipher = None


a = Analysis(
    ['reader.py'],
    pathex=[],
    binaries=[],
    datas=[('mangareader/build/styles.css', 'mangareader/build'), ('mangareader/build/scripts.js', 'mangareader/build'), ('mangareader/static-assets/menu.svg', 'mangareader/static-assets'), ('mangareader/static-assets/menu-light.svg', 'mangareader/static-assets'), ('mangareader/static-assets/scroll.svg', 'mangareader/static-assets'), ('mangareader/static-assets/scroll-light.svg', 'mangareader/static-assets'), ('mangareader/static-assets/boot.template.html', 'mangareader/static-assets'), ('mangareader/static-assets/doc.template.html', 'mangareader/static-assets'), ('mangareader/static-assets/img.template.html', 'mangareader/static-assets'), ('mangareader/static-assets/roboto-regular.woff2', 'mangareader/static-assets'), ('mangareader/static-assets/roboto-bold.woff2', 'mangareader/static-assets'), ('mangareader/static-assets/zenscroll.js', 'mangareader/static-assets'), ('version', '.')],
    hiddenimports=[],
    hookspath=[],
    hooksconfig={},
    runtime_hooks=[],
    excludes=[],
    win_no_prefer_redirects=False,
    win_private_assemblies=False,
    cipher=block_cipher,
    noarchive=False,
)
pyz = PYZ(a.pure, a.zipped_data, cipher=block_cipher)

exe = EXE(
    pyz,
    a.scripts,
    [],
    exclude_binaries=True,
    name='HTML Mangareader',
    debug=False,
    bootloader_ignore_signals=False,
    strip=False,
    upx=True,
    console=False,
    disable_windowed_traceback=False,
    argv_emulation=False,
    target_arch=None,
    codesign_identity=None,
    entitlements_file=None,
    icon='icon/air.icns',
)
coll = COLLECT(
    exe,
    a.binaries,
    a.zipfiles,
    a.datas,
    strip=False,
    upx=True,
    upx_exclude=[],
    name='HTML Mangareader',
)
app = BUNDLE(
    coll,
    name='HTML Mangareader.app',
    icon='icon/air.icns',
    bundle_identifier=None,
    info_plist={
        'NSPrincipalClass': 'NSApplication',
        'CFBundleDocumentTypes': [
            {
                'CFBundleTypeName': 'Images',
                'CFBundleTypeRole': 'Viewer',
                'LSItemContentTypes': [
                    'public.jpeg',
                    'public.png',
                    'com.compuserve.gif',
                    'org.webmproject.webp',
                    'com.microsoft.bmp',
                    'public.svg-image'
                ],
                'LSHandlerRank': 'Default',
                'NSExportableTypes': [
                    'public.jpeg',
                    'public.png',
                    'com.compuserve.gif',
                    'org.webmproject.webp',
                    'com.microsoft.bmp',
                    'public.svg-image'
                ]
            },
            {
                'CFBundleTypeName': 'Comic book archives',
                'CFBundleTypeRole': 'Viewer',
                'LSItemContentTypes': [
                    'public.comic.archive',
                    'public.zip-archive',
                    'org.7-zip.7-zip-archive',
                ],
                'NSExportableTypes': [
                    'public.comic.archive',
                    'public.zip-archive',
                    'org.7-zip.7-zip-archive',
                ]
            }
        ],
        'UTImportedTypeDeclarations': [
            {
                'UTTypeIdentifier': 'public.comic.archive',
                'UTTypeDescription': 'Comic book archive',
                'UTTypeConformsTo': ['public.data'],
                'UTTypeTagSpecification': {
                    'public.filename-extension': ['cbz', 'cb7']
                }
            }
        ]
    }
)
