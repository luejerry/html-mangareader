import sys
from os import path
from tkinter import Tk, messagebox
from mangareader.mangarender import extract_render
from mangareader import templates
from time import sleep


def main() -> None:
    if len(sys.argv) <= 1:
        Tk().withdraw()
        messagebox.showinfo(
            'HTML MangaReader - simply the fastest comic book reader',
            'Read your favorite comics by doing one of the following:',
            detail='- Drag an image folder or file onto the MangaReader icon, or\n'
            '- Drag a ZIP or CBZ archive onto the MangaReader icon',
        )
        return
    target_path = '.' if len(sys.argv) <= 1 else sys.argv[1]
    working_dir = getattr(sys, '_MEIPASS', path.abspath(path.dirname(__file__)))
    lib_dir = f'{working_dir}/mangareader'
    try:
        extract_render(
            target_path,
            f'{lib_dir}/doc.template.html',
            f'{lib_dir}/img.template.html',
            f'{lib_dir}/boot.template.html',
            [f'{lib_dir}/styles.css', f'{lib_dir}/scripts.js', f'{lib_dir}/menu.svg',],
            templates.DEFAULT_IMAGETYPES,
        )
    except Exception as e:
        Tk().withdraw()
        messagebox.showerror('MangaReader encountered an error: ' + type(e).__name__, str(e))


if __name__ == '__main__':
    main()
