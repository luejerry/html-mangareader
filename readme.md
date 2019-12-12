# [HTML] Mangareader

Mangareader is a simple image viewer designed for reading digital comic books. It displays images in a folder or ZIP/CBZ archive as a single, continuously scrollable page in your default browser.

I made this out of frustration with the bloat and clunkiness I experienced with other comic book readers I've tried for the Windows platform. If you need features like bookmarks, history, library management, cloud sync, etc. this is not the comic reader for you. This app is focused only on simplicity and speed.

![Smooth scroll version on Windows 10](https://github.com/luejerry/html-mangareader/blob/master/doc/demo.gif)

## Features

- View your images in a continously scrollable page.
- Use all the familiar navigation controls available on your browser/device setup.
- Responsive and touch-friendly pagination controls also available for a more traditional viewing experience.
- Open images in a folder or contained in a ZIP/CBZ file, of any format supported by the browser.

### Planned features

- RAR/CBR support.
- 7z/CB7 support.
- MacOS binary (for now, see Build section below to build your own).

## Install (Windows)

Windows binaries are located in the `dist` directory.

Download and extract your desired version, and the application is ready to use. No installation is required.

## Usage (Windows)

The app can be started in several different ways:

- Right click an image file or ZIP/CBZ, and "Open with..." the Mangareader executable.
- Drag an image file, image folder, or ZIP/CBZ onto Mangareader executable or a shortcut.
- Set Mangareader as the default application to open an image or ZIP/CBZ file.

## Build (Windows) (WIP)

To build the executable file, install PyInstaller and run

```
pyinstaller mangareader.spec
```

Note: need to actually provide the command line instructions here since the spec file hardcodes an absolute path.
