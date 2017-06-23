# [HTML] Mangareader

Mangareader is an elegantly simple image viewer designed for reading digital comic books. It displays images in a folder or ZIP/CBZ archive as a single, continuously scrollable page in your default browser. No background server process. No scripts. No Chromium or other unnecessary bloat. No process stays running after the page is rendered. Just HTML and CSS in the browser you already have open.

I made this out of frustration with the bloat and clunkiness I experienced with other comic book readers I've tried for the Windows platform. If you need features like bookmarks, history, library management, cloud sync, and who knows what else, this is not the comic reader for you. This app does just one thing, which it does better than any other comic reader, and that is reading comics.

## Features

* View your images in a continously scrollable page.
* Unobtrusive and touch-friendly pagination controls also available for a more traditional viewing experience.
* Zoom in and out as you would with your browser.
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