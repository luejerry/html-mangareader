import sys
import traceback
import webbrowser
from argparse import ArgumentParser, Namespace
from os import path
import platform
from tkinter import Tk, messagebox, filedialog
from mangareader.mangarender import extract_render
from mangareader import templates
from mangareader.config import CONFIG_KEY, get_or_create_config


def parse_args() -> Namespace:
    """
    Parse command line arguments.
    """
    parser = ArgumentParser(description='Mangareader')
    parser.add_argument('path', nargs='?', help='Path to image, folder, or comic book archive')
    parser.add_argument('--no-browser', action='store_true')
    return parser.parse_args()


def get_platform_args() -> Namespace:
    """
    Get program arguments based on platform. On Windows, arguments are obtained directly via
    command line args. On MacOS, arguments must be obtained from an Open Document (`odoc`) event
    sent by the OS Launch Services.
    """
    cli_args = parse_args()
    if platform.system() == 'Darwin' and not cli_args.path:
        # MacOS only: when launching by drag-dropping a file to the app icon or using Open With
        # menu, the app does not receive the file path in the command line arguments. To work
        # around this, we create a temporary Tk window to catch the OpenDocument event that
        # provides the file path to open
        tk = Tk()

        def set_path(*args):
            cli_args.path = args[0]
            tk.destroy()

        tk.createcommand('::tk::mac::OpenDocument', set_path)
        # If no event is received in 10ms, assume app was launched without a file to open
        tk.after(10, lambda: tk.destroy())
        tk.mainloop()
    return cli_args


def main() -> None:
    config = get_or_create_config()
    args = get_platform_args()
    if not args.path:
        imagetypes = [f'.{ext}' for ext in templates.DEFAULT_IMAGETYPES]
        archivetypes = [
            f'.{ext}' for ext in (*templates.ZIP_TYPES, *templates.RAR_TYPES, *templates._7Z_TYPES)
        ]
        filetypes = (
            ('Supported files', [*imagetypes, *archivetypes]),
            ('Images', imagetypes),
            ('Comic book archive', archivetypes),
            ('All files', ['*']),
        )
        target_path = filedialog.askopenfilename(
            filetypes=filetypes,
            title='Open Image - Mangareader',
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
            doc_template_path=f'{lib_dir}/{templates.HTML_TEMPLATES["doc"]}',
            page_template_path=f'{lib_dir}/{templates.HTML_TEMPLATES["page"]}',
            boot_template_path=f'{lib_dir}/{templates.HTML_TEMPLATES["boot"]}',
            asset_paths=(f'{lib_dir}/{asset}' for asset in templates.ASSETS),
            img_types=templates.DEFAULT_IMAGETYPES,
            config=config,
        )
        if args.no_browser:
            print(boot_path)
        else:
            if config[CONFIG_KEY]['browser']:
                webbrowser.register(
                    config[CONFIG_KEY]['browser'],
                    None,
                    instance=webbrowser.GenericBrowser(config[CONFIG_KEY]['browser']),
                    preferred=True,
                )
            webbrowser.get().open(boot_path.as_uri())
    except Exception as e:
        Tk().withdraw()
        messagebox.showerror(
            'Mangareader encountered an error: ' + type(e).__name__, ''.join(traceback.format_exc())
        )


if __name__ == '__main__':
    main()
