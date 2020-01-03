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

- Run `mangareader.exe` and open an image file or ZIP/CBZ.
- Right click an image file or ZIP/CBZ, and "Open with..." the Mangareader executable.
- Drag an image file, image folder, or ZIP/CBZ onto Mangareader executable or a shortcut.

## Build

The application can be started directly by running `reader.py` (Python 3.5+); no external dependencies are required. Building the executable is done using [PyInstaller](https://www.pyinstaller.org/).

### Prerequisites

- Python 3.5+
- PyInstaller: `pip install pyinstaller`

### Building on Windows

Run `build-win.cmd`. The executable will be created in `dist\mangareader`.

PyInstaller options can be configured in the script. See the [documentation](https://pyinstaller.readthedocs.io/en/stable/usage.html) for details.
