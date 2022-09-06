# [HTML] Mangareader

**See [Releases](https://github.com/luejerry/html-mangareader/releases) for the latest downloads and changelogs.**

**[Try the demo in your browser.](https://luejerry.github.io/html-mangareader-demo)**

Mangareader is a simple image viewer designed for reading digital comic books. It displays images in a folder or ZIP/CBZ/RAR/CBR/7Z/CB7 archive as a single, continuously scrollable page in your default browser.

This project was made out of frustration with the overall clunkiness I experienced with other comic book readers I tried on the Windows platform. If you need features like bookmarks, history, library management, cloud sync, etc. this is not the comic reader for you. This app is focused only on providing a simple and fluid viewing experience.

![Smooth scroll version on Windows 10](https://github.com/luejerry/html-mangareader/blob/master/doc/demo.gif)

## Features

- View your images in a continuously scrollable page.
- Use all the familiar navigation controls available on your browser/device setup.
- Open images directly from a folder or contained in a comic book archive file.
  - Supported archive formats: cbz, cbr, cb7, zip, rar, 7z
  - Supported image formats: bmp, png, jpg, gif, apng, svg, webp
- Light and dark themes.

### Supported platforms

- Windows
- MacOS 12 (beta support)
  - **Note**: does not support RAR/CBR archives

## Install

Application builds are located under [Releases](https://github.com/luejerry/html-mangareader/releases).

Download and extract your desired version, and the application is ready to use. No installation is required.

## Usage

The app can be started in several different ways:

- Run `mangareader.exe` (Windows) or `HTML Mangareader.app` (MacOS) and open an image file or comic book archive.
- Right click an image file or archive, and "Open with..." the Mangareader executable.
- Drag an image file, image folder, or archive onto Mangareader executable or a shortcut.

## For developers

### Prerequisites

- Python 3.7+
- Node.js 16+
- PyInstaller: `pip install pyinstaller` (only required for building binary)

### Setup

First, ensure the prerequisites above are installed on the system.

Then, from the repository root:

1. Install Python dependencies: `pip install -r requirements.txt`
2. Install Node.js dependencies: `npm install`

### Running without building binary (Windows/MacOS)

The application can be started without building a binary. Examples:

#### Start reader with open file prompt

```
npm run start

# or, to autoreload on source file changes:
npm run watch
```

#### Directly open an image, folder, or archive

```
npm run start "path/to/open"

# or, to autoreload on source file changes:
npm run watch "path/to/open"
```

### Build distributable

Building the executable is done using [PyInstaller](https://www.pyinstaller.org/).

#### Windows

Run `build-win.cmd`. The executable will be created in `dist\mangareader`.

PyInstaller options can be configured in the script. See the [documentation](https://pyinstaller.readthedocs.io/en/stable/usage.html) for details.

#### MacOS

From the repository root, run:

```
npm run compile
pyinstaller --noconfirm mangareader-darwin-x86.spec
```

The application bundle will be created at `dist/HTML Mangareader.app`.

**Warning**: building with Python 3.10 has a bug which will prevent the app from being able to open files via the native launch service (i.e. drag-drop file or Open With). Tested working on Python 3.7.5.
