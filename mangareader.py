import sys
from tkinter import Tk, messagebox
from mangarender import extract_render
import templates


def main() -> None:
    if len(sys.argv) <= 1:
        Tk().withdraw()
        messagebox.showinfo('HTML MangaReader - simply the fastest comic book reader',
                            'Read your favorite comics by doing one of the following:',
                            detail=
                            '- Drag an image folder or file onto the MangaReader icon, or\n'
                            '- Drag a ZIP or CBZ archive onto the MangaReader icon')
        return
    path = '.' if len(sys.argv) <= 1 else sys.argv[1]
    try:
        extract_render(path, templates.DOC_TEMPLATE, templates.IMG_TEMPLATE, templates.BOOT_TEMPLATE,
                       templates.DEFAULT_IMAGETYPES)
    except Exception as e:
        Tk().withdraw()
        messagebox.showerror('MangaReader encountered an error: ' + type(e).__name__,
                             str(e))

if __name__ == '__main__':
    main()