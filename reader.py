import sys
import traceback
from os import path
from tkinter import Tk, messagebox, filedialog
from mangareader.mangarender import extract_render
from mangareader import templates
from time import sleep


def main() -> None:
    if len(sys.argv) <= 1:
        imagetypes = ';'.join(f'*.{ext}' for ext in templates.DEFAULT_IMAGETYPES)
        archivetypes = ';'.join(
            f'*.{ext}' for ext in (*templates.ZIP_TYPES, *templates.RAR_TYPES, *templates._7Z_TYPES)
        )
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
    with open(f'{working_dir}/version', encoding='utf-8') as version_file:
        version = version_file.read().strip()
    try:
        extract_render(
            path=target_path,
            version=version,
            doc_template_path=f'{lib_dir}/doc.template.html',
            page_template_path=f'{lib_dir}/img.template.html',
            boot_template_path=f'{lib_dir}/boot.template.html',
            asset_paths=(f'{lib_dir}/{asset}' for asset in templates.ASSETS),
            img_types=templates.DEFAULT_IMAGETYPES,
        )
    except Exception as e:
        Tk().withdraw()
        messagebox.showerror(
            'MangaReader encountered an error: ' + type(e).__name__, ''.join(traceback.format_exc())
        )


if __name__ == '__main__':
    main()
