import os
import re
import tempfile
import webbrowser
import zipfile
from pathlib import Path
from string import Template
from typing import List, Any
from excepts import ImagesNotFound


def render_from_template(
    paths: List[str],
    doc_template: str,
    page_template: str,
    outfile: str = os.path.join(
        tempfile.gettempdir(), 'html-mangareader', 'render.html'
    ),
) -> str:
    """Render a list of image paths to the finished HTML document.

    Parameters:
    * `paths`: full file:// paths to images to render on the page.
    * `doc_template`: HTML template for the overall document.
    * `page_template`: HTML template for each comic page element.
    * `outfile`: path to write the rendered document to. Defaults to OS temp directory.

    Returns: path to rendered HTML document.

    Throws: `ImagesNotFound` if the image list is empty.
    """
    if not paths:
        raise ImagesNotFound('No images were sent to the renderer.')
    imagepaths = [Path(p).as_uri() for p in paths]
    os.makedirs(os.path.dirname(outfile), exist_ok=True)
    with open(outfile, 'w', encoding='utf-8', newline='\r\n') as renderfd:
        html_template = Template(doc_template)
        img_template = Template(page_template)
        img_list = [
            img_template.substitute(
                img=imagepaths[i], id=i, previd=(i - 1), nextid=(i + 1)
            )
            for i in range(0, len(imagepaths))
        ]
        doc_string = html_template.substitute(body=''.join(img_list))
        renderfd.write(doc_string)
    # print("view saved to " + outfile)
    return outfile


def render_bootstrap(outfile: str, render: str, index: int, boot_template: str) -> str:
    """Render the bootstrap document, which redirects to the main HTML document at the opened image.
    This is required because an HTML bookmark link cannot be used as a file:// URI.

    Parameters:
    * `outfile`: path to write the rendered document to.
    * `render`: path to the main HTML document.
    * `index`: the image number to jump to in the main document after redirect.
    * `boot_template`: HTML template for the bootstrap document.

    Returns: path to the rendered bootstrap document.
    """
    with open(outfile, 'w', encoding='utf-8', newline='\r\n') as bootfd:
        html_boot = Template(boot_template).substitute(document=render, index=index)
        bootfd.write(html_boot)
    return outfile


def scan_directory(path: str, img_types: List[str]) -> List[Path]:
    """Get a list of image file paths from a directory.

    Parameters:
    * `path`: directory to scan for images.
    * `img_types`: list of recognized image file extensions.

    Returns: list of absolute paths to image files.

    Throws: `ImagesNotFound` if no images were found in the directory.
    """
    files = filter(lambda f: f.is_file(), Path(path).iterdir())
    # files = filter(lambda f: os.path.isfile(os.path.join(path, f)), os.listdir(path))
    imagefiles = list(filter(lambda f: f.suffix.lower()[1:] in img_types, files))
    if not imagefiles:
        raise ImagesNotFound(
            'No image files were found in directory "{}"'.format(Path(path).resolve())
        )
    return [
        p if p.is_absolute() else p.resolve()
        for p in sorted(imagefiles, key=filename_comparator)
    ]


def extract_zip(
    path: str,
    img_types: List[str],
    outpath: str = os.path.join(tempfile.gettempdir(), 'html-mangareader'),
) -> List[Path]:
    """Extract image files found in a zip/cbz file.

    Parameters:
    * `path`: path to archive.
    * `img_types`: list of recognized image file extensions.
    * `outpath`: directory to extract images to. Defaults to OS temp directory.

    Returns: list of absolute paths to extracted image files.

    Throws:
    * `ImagesNotFound` if no images were found in the archive.
    * `BadZipFile` if archive could not be read.
    """
    with zipfile.ZipFile(path, mode='r') as zip_file:
        imagefiles = list(
            filter(lambda f: f.split('.')[-1].lower() in img_types, zip_file.namelist())
        )
        if not imagefiles:
            raise ImagesNotFound(
                'No image files were found in archive: {}'.format(path)
            )
        zip_file.extractall(outpath, imagefiles)
        return [
            Path(outpath) / image
            for image in sorted(imagefiles, key=filename_comparator)
        ]


def extract_render(
    path: str,
    doc_template: str,
    page_template: str,
    boot_template: str,
    img_types: List[str],
    outpath: str = Path(tempfile.gettempdir()) / 'html-mangareader',
) -> None:
    """Main controller procedure. Handles opening of archive, image, or directory and renders the images
    appropriately for each, then opens the document in the user's default browser.

    Parameters:
    * `path`: path to image, directory, or archive.
    * `doc_template`: HTML template for the main document.
    * `page_template`: HTML template for individual comic page elements.
    * `boot_template`: HTML template for bootstrap document.
    * `imge_types`: list of recognized image file extensions.
    * `outpath`: directory to write temporary files in. Defaults to OS temp directory.

    Returns: None.

    Throws:
    * `BadZipFile`: if an opened file was not an image file, but could not be read as a zip archive.
    * `ImagesNotFound`: if no images could be found in an opened directory or archive.
    """
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
                    raise zipfile.BadZipfile(
                        '"{}" does not appear to be a valid zip/cbz file.'.format(path)
                    ).with_traceback(e.__traceback__)
        else:
            imgpath = scan_directory(path, img_types)
        renderfile = render_from_template(
            imgpath, doc_template, page_template, str(outpath / 'render.html')
        )
        bootfile = render_bootstrap(
            str(outpath / 'boot.html'), Path(renderfile).as_uri(), start, boot_template
        )
        webbrowser.open(Path(bootfile).as_uri())
    except ImagesNotFound:
        raise
    return


def filename_comparator(filename: str) -> List[Any]:
    """Natural sort comparison key function for filename sorting."""
    return [
        int(s) if s.isdigit() else s.lower() for s in re.split(r'(\d+)', str(filename))
    ]
