# [HTML] Mangareader

Mangareader is an elegantly simple image viewer designed for reading digital comic books. It displays images in a folder or ZIP/CBZ archive as a single, continuously scrollable page in your default browser. "Oh look, yet another bloated Electron app that demands 500 megs of RAM to load a couple images," I can already hear you think. Fear not. There is no background server process. No Chromium or other unnecessary bloat. No process stays running after the page is rendered. No internet connection. No Javascript. Just local organic HTML and CSS in the browser you already have open.

I made this out of frustration with the bloat and clunkiness I experienced with other comic book readers I've tried for the Windows platform. If you need features like bookmarks, history, library management, cloud sync, and who knows what else, this is not the comic reader for you. This app is focused only on simplicity and speed.

![Smooth scroll version on Windows 10](https://github.com/luejerry/html-mangareader/blob/master/doc/demo.gif)

## Features

* View your images in a continously scrollable page.
* Use all the familiar navigation controls available on your browser/device setup. Smooth scroll, inertial scroll, horizontal scroll, pinch-zoom, 60fps hardware acceleration. Say goodbye to the awkward and jerky navigation of other comic readers.
* Responsive and touch-friendly pagination controls also available for a more traditional viewing experience.
* Open images in a folder or contained in a ZIP/CBZ file, of any format supported by the browser.

### Features intentionally omitted

* Library management.
* Bookmarks and history.
* Custom key bindings.
* Image autoscaling.
* Fancy animations.

### Planned features

* RAR/CBR support.
* 7z/CB7 support.
* MacOS binary.

## Install (Windows)

Windows binaries are located in the `dist` directory.

* `mangareader-win-64.zip`: The pure, lightweight Mangareader application.
* `mangareader-smoothscroll-win-64.zip`: Using the pagination controls smoothly scrolls to the next/previous image, rather than instantly jumping to it. This is done via Javascript.

Download and extract your desired version, and the application is ready to use. No installation is required.

## Usage (Windows)

The app can be started in several different ways:

* Right click an image file or ZIP/CBZ, and "Open with..." the Mangareader executable.
* Drag an image file, image folder, or ZIP/CBZ onto Mangareader executable or a shortcut.
* Set Mangareader as the default application to open an image or ZIP/CBZ file.