import os
import re
import tempfile
import webbrowser
import zipfile
from pathlib import Path
from string import Template

from excepts import ImagesNotFound


# todo: take list of explicit image paths, which are passed in from listdir or the unzip
def render_from_template(paths,
                         doc_template, page_template, img_types,
                         outfile=os.path.join(tempfile.gettempdir(), 'html-mangareader', 'render.html')):
    if not paths:
        raise ImagesNotFound('No images were sent to the renderer.')
    imagepaths = [Path(p).as_uri() for p in paths]
    os.makedirs(os.path.dirname(outfile), exist_ok=True)
    with open(outfile, 'w', encoding='utf-8', newline='\r\n') as renderfd:
        html_template = Template(doc_template)
        img_template = Template(page_template)
        img_list = [img_template.substitute(img=imagepaths[i], id=i, previd=(i - 1), nextid=(i + 1))
                    for i in range(0, len(imagepaths))]
        doc_string = html_template.substitute(body=''.join(img_list))
        renderfd.write(doc_string)
    # print("view saved to " + outfile)
    return outfile


def render_bootstrap(outfile, render, index, boot_template):
    with open(outfile, 'w', encoding='utf-8', newline='\r\n') as bootfd:
        html_boot = Template(boot_template).substitute(document=render, index=index)
        bootfd.write(html_boot)
    return outfile


def scan_directory(path, img_types):
    files = filter(lambda f: f.is_file(), Path(path).iterdir())
    # files = filter(lambda f: os.path.isfile(os.path.join(path, f)), os.listdir(path))
    imagefiles = list(filter(lambda f: f.suffix.lower()[1:] in img_types, files))
    if not imagefiles:
        raise ImagesNotFound('No image files were found in directory "{}"'.format(Path(path).resolve()))
    return [p if p.is_absolute() else p.resolve() for p in sorted(imagefiles, key=filename_comparator)]


def extract_zip(path, img_types, outpath=os.path.join(tempfile.gettempdir(), 'html-mangareader')):
    with zipfile.ZipFile(path, mode='r') as zip_file:
        imagefiles = list(filter(lambda f: f.split('.')[-1].lower() in img_types, zip_file.namelist()))
        if not imagefiles:
            raise ImagesNotFound('No image files were found in archive: {}'.format(path))
        zip_file.extractall(outpath, imagefiles)
        return [Path(outpath) / image for image in sorted(imagefiles, key=filename_comparator)]


def extract_render(path, doc_template, page_template, boot_template, img_types,
                   outpath=Path(tempfile.gettempdir()) / 'html-mangareader'):
    start = 0
    pPath = Path(path).resolve()
    try:
        if pPath.is_file():
            if pPath.suffix.lower()[1:] in img_types:
                imgpath = scan_directory(pPath.parent, img_types)
                start = imgpath.index(pPath)
            else:
                try:
                    imgpath = extract_zip(path, img_types, str(outpath))
                except zipfile.BadZipFile as e:
                    raise zipfile.BadZipfile('"{}" does not appear to be a valid zip/cbz file.'.format(path)) \
                        .with_traceback(e.__traceback__)
        else:
            imgpath = scan_directory(path, img_types)
        renderfile = render_from_template(imgpath, doc_template, page_template, img_types, str(outpath / 'render.html'))
        bootfile = render_bootstrap(str(outpath/'boot.html'), Path(renderfile).as_uri(), start, boot_template)
        webbrowser.open(Path(bootfile).as_uri())
    except ImagesNotFound:
        raise
    return


def filename_comparator(filename):
    """Natural sort comparison key function. Thanks to <https://stackoverflow.com/a/16090640> for this bit of genius"""
    return [int(s) if s.isdigit() else s.lower()
            for s in re.split(r'(\d+)', str(filename))]
