# [HTML] Mangareader

**See [Releases](https://github.com/luejerry/html-mangareader/releases) for the latest downloads and changelogs.**

Mangareader is a simple image viewer designed for reading digital comic books. It displays images in a folder or ZIP/CBZ/RAR/CBR archive as a single, continuously scrollable page in your default browser.

I made this out of frustration with the bloat and clunkiness I experienced with other comic book readers I've tried for the Windows platform. If you need features like bookmarks, history, library management, cloud sync, etc. this is not the comic reader for you. This app is focused only on simplicity and speed.

![Smooth scroll version on Windows 10](https://github.com/luejerry/html-mangareader/blob/master/doc/demo.gif)

**Not convinced? [Try the demo in your browser.](https://luejerry.github.io/html-mangareader-demo)**

## Features

- View your images in a continuously scrollable page.
- Use all the familiar navigation controls available on your browser/device setup.
- Responsive and touch-friendly pagination controls also available for a more traditional viewing experience.
- Open images in a folder or contained in a ZIP/CBZ/RAR/CBR/7Z/CB7 file, of any format supported by the browser.
- Light and dark themes.

### Planned features

- MacOS binary.
- UI improvements to View Options.

## Install (Windows)

Windows binaries are located under [Releases](https://github.com/luejerry/html-mangareader/releases).

Download and extract your desired version, and the application is ready to use. No installation is required.

## Usage (Windows)

The app can be started in several different ways:

- Run `mangareader.exe` and open an image file or ZIP/CBZ/RAR/CBR.
- Right click an image file or archive, and "Open with..." the Mangareader executable.
- Drag an image file, image folder, or archive onto Mangareader executable or a shortcut.

## For developers

### Prerequisites

- Python 3.5+
- PyInstaller: `pip install pyinstaller` (only required for building)
- Rarfile: `pip install rarfile` or `pip install -r requirements.txt`
- py7zr: `pip install py7zr` or `pip install -r requirements.txt`

### Running without building (Windows/MacOS)

The application can be started directly through Python without building. Examples:

#### Start reader with open file prompt

```
python reader.py
```

#### Directly open an image, folder, or archive

```
python reader.py "path/to/open"
```

### Building on Windows

Building the executable is done using [PyInstaller](https://www.pyinstaller.org/).

Run `build-win.cmd`. The executable will be created in `dist\mangareader`.

PyInstaller options can be configured in the script. See the [documentation](https://pyinstaller.readthedocs.io/en/stable/usage.html) for details.
