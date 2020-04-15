import sys
import traceback
import webbrowser
from argparse import ArgumentParser, Namespace
from os import path
from tkinter import Tk, messagebox, filedialog
from mangareader.mangarender import extract_render
from mangareader import templates
from time import sleep


def parse_args() -> Namespace:
    parser = ArgumentParser(description='Mangareader')
    parser.add_argument('path', nargs='?', help='Path to image, folder, or comic book archive')
    parser.add_argument('--no-browser', action='store_true')
    return parser.parse_args()


def main() -> None:
    args = parse_args()
    if not args.path:
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
        target_path = args.path
    working_dir = getattr(sys, '_MEIPASS', path.abspath(path.dirname(__file__)))
    lib_dir = f'{working_dir}/mangareader'
    with open(f'{working_dir}/version', encoding='utf-8') as version_file:
        version = version_file.read().strip()
    try:
        boot_path = extract_render(
            path=target_path,
            version=version,
            doc_template_path=f'{lib_dir}/doc.template.html',
            page_template_path=f'{lib_dir}/img.template.html',
            boot_template_path=f'{lib_dir}/boot.template.html',
            asset_paths=(f'{lib_dir}/{asset}' for asset in templates.ASSETS),
            img_types=templates.DEFAULT_IMAGETYPES,
        )
        if args.no_browser:
            print(boot_path)
        else:
            webbrowser.open(boot_path.as_uri())
    except Exception as e:
        Tk().withdraw()
        messagebox.showerror(
            'Mangareader encountered an error: ' + type(e).__name__, ''.join(traceback.format_exc())
        )


if __name__ == '__main__':
    main()
