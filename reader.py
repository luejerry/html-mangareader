import sys
from os import path
from tkinter import Tk, messagebox, filedialog
from mangareader.mangarender import extract_render
from mangareader import templates
from time import sleep


def main() -> None:
    if len(sys.argv) <= 1:
        imagetypes = ';'.join(f'*.{ext}' for ext in templates.DEFAULT_IMAGETYPES)
        archivetypes = '*.cbz;*.zip'
        filetypes = (
            ('Supported files', ';'.join((imagetypes, archivetypes))),
            ('Images', imagetypes),
            ('Comic book archive', archivetypes),
            ('All files', '*'),
        )
        target_path = filedialog.askopenfilename(
            filetypes=filetypes, title='Open Image - Mangareader',
        )
        if not target_path:
            return
    else:
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
