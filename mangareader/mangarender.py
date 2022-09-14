import base64
import json
import os
import re
import tempfile
import zipfile
from concurrent.futures import ThreadPoolExecutor
from configparser import ConfigParser
from multiprocessing import cpu_count
from pathlib import Path
from shutil import copy
from string import Template
from typing import Any, Iterable, List, Optional, Tuple, Union

import py7zr
import rarfile
from PIL import Image

from mangareader.config import CONFIG_KEY
from mangareader.excepts import ImagesNotFound
from mangareader.progress import MRProgressBar
from mangareader.sevenzipadapter import SevenZipAdapter
from mangareader.templates import _7Z_TYPES, IMG_PLACEHOLDER, RAR_TYPES, ZIP_TYPES


def get_image_size(path: Union[Path, str]) -> Optional[Tuple[int, int]]:
    """Get the pixel dimensions (width, height) of an image file.

    Returns None if file is not a valid image.
    """
    try:
    with Image.open(path) as img:
        return img.size
    except:
        return None


def render_from_template(
    paths: Iterable[Union[Path, str]],
    thumbnails: Iterable[Optional[Path]],
    version: str,
    title: str,
    doc_template: str,
    page_template: str,
    config: ConfigParser,
    outfile: str = os.path.join(tempfile.gettempdir(), 'html-mangareader', 'render.html'),
) -> str:
    """Render a list of image paths to the finished HTML document.

    Parameters:
    * `paths`: full file:// paths to images to render on the page.
    * `version`: version number to render on page.
    * `title`: title of the page.
    * `doc_template`: HTML template for the overall document.
    * `page_template`: HTML template for each comic page element.
    * `outfile`: path to write the rendered document to. Defaults to OS temp directory.

    Returns: path to rendered HTML document.

    Throws: `ImagesNotFound` if the image list is empty.
    """
    if not paths:
        raise ImagesNotFound('No images were sent to the renderer.')
    try:
        write_config = json.dumps(
            {
                'disableNavButtons': config[CONFIG_KEY].getboolean('disableNavButtons'),
                'disableNavBar': config[CONFIG_KEY].getboolean('disableNavBar'),
                'dynamicImageLoading': config[CONFIG_KEY].getboolean('dynamicImageLoading'),
            }
        )
    except:
        write_config = '{}'
    with open(outfile, 'w', encoding='utf-8', newline='\r\n') as renderfd:
        html_template = Template(doc_template)
        img_template = Template(page_template)
        img_dimensions = [get_image_size(path) for path in paths]
        img_list = [
            img_template.substitute(
                img=(
                    Path(path).as_uri()
                    if not config[CONFIG_KEY].getboolean('dynamicImageLoading')
                    else IMG_PLACEHOLDER
                ),
                lazyimg=(
                    Path(path).as_uri()
                    if config[CONFIG_KEY].getboolean('dynamicImageLoading')
                    else ''
                ),
                thumbnail=thumbnail.as_uri() if thumbnail else IMG_PLACEHOLDER,
                width=dimensions[0] if dimensions else 0,
                height=dimensions[1] if dimensions else 0,
                id=str(i),
                previd=str(i - 1) if i > 0 else 'none',
                nextid=str(i + 1) if i < len(list(paths)) - 1 else 'none',
            )
            for i, (path, thumbnail, dimensions) in enumerate(
                zip(paths, thumbnails, img_dimensions)
            )
        ]
        doc_string = html_template.substitute(
            pages=''.join(img_list),
            version=version,
            title=title,
            config=base64.b64encode(write_config.encode('utf-8')).decode('utf-8'),
        )
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
        html_boot = Template(boot_template).substitute(document=render, index=str(index))
        bootfd.write(html_boot)
    return outfile


def render_copy(src_paths: Iterable[Union[Path, str]], dest_path: Path) -> None:
    """Copy all files pointed by src_paths to destination."""
    for src in src_paths:
        copy(src, dest_path)


def scan_directory(path: Union[str, Path], img_types: Iterable[str]) -> List[Path]:
    """Get a list of image file paths from a directory.

    Parameters:
    * `path`: directory to scan for images.
    * `img_types`: list of recognized image file extensions.

    Returns: list of absolute paths to image files.

    Throws: `ImagesNotFound` if no images were found in the directory.
    """
    files = filter(lambda f: f.is_file(), Path(path).iterdir())
    imagefiles = list(filter(lambda f: f.suffix.lower()[1:] in img_types, files))
    if not imagefiles:
        raise ImagesNotFound(f'No image files were found in directory "{Path(path).resolve()}"')
    return [
        p if p.is_absolute() else p.resolve() for p in sorted(imagefiles, key=filename_comparator)
    ]


def extract_archive(
    img_types: Iterable[str],
    archive: Union[zipfile.ZipFile, rarfile.RarFile],
    outpath: str = os.path.join(tempfile.gettempdir(), 'html-mangareader'),
) -> List[Path]:
    """Extract image files in archive to the outpath."""
    imagefiles = list(filter(lambda f: f.split('.')[-1].lower() in img_types, archive.namelist()))
    if not imagefiles:
        raise ImagesNotFound()
    archive.extractall(outpath, imagefiles)
    return [Path(outpath) / image for image in sorted(imagefiles, key=filename_comparator)]


def extract_zip(
    path: Path,
    img_types: Iterable[str],
    outpath: str = os.path.join(tempfile.gettempdir(), 'html-mangareader'),
) -> List[Path]:
    """Extract image files found in an archive file.

    Parameters:
    * `path`: path to archive.
    * `img_types`: list of recognized image file extensions.
    * `outpath`: directory to extract images to. Defaults to OS temp directory.

    Returns: list of absolute paths to extracted image files.

    Throws:
    * `ImagesNotFound` if no images were found in the archive.
    * `BadZipFile` if CBZ/ZIP archive could not be read.
    * `BadRarFile` if CBR/RAR archive could not be read.
    * `Bad7zFile` if CB7/7Z archive could not be read.
    """
    file_ext = path.suffix.lower()[1:]
    try:
        if file_ext in ZIP_TYPES:
            with zipfile.ZipFile(path, mode='r') as zip_file:
                return extract_archive(img_types, zip_file)
        elif file_ext in RAR_TYPES:
            with rarfile.RarFile(path, mode='r') as rar_file:
                return extract_archive(img_types, rar_file)
        elif file_ext in _7Z_TYPES:
            with SevenZipAdapter(path, mode='r') as _7z_file:
                return extract_archive(img_types, _7z_file)
        else:
            raise ImagesNotFound(f'Unknown archive format: {path}')
    except ImagesNotFound:
        raise ImagesNotFound(f'No image files were found in archive: {path}')


def resolve_template(path: Union[Path, str]) -> str:
    """Load the file at path a a UTF-8 string."""
    with open(path, encoding='utf-8') as template_file:
        return template_file.read()


def create_out_path(outpath: Path) -> None:
    """Create the output directory for the rendered page files. If outpath is a file, it is deleted."""
    if outpath.exists() and outpath.is_file():
        outpath.unlink()
    outpath.mkdir(parents=True, exist_ok=True)


def create_thumbnails(
    paths: Iterable[Union[Path, str]],
    outpath: Path,
    progress_bar: MRProgressBar = None,
) -> Iterable[Path]:
    """Create thumbnails for all images in paths and save them to outpath."""
    executor = ThreadPoolExecutor(max_workers=cpu_count() - 1)

    # Render thumbnails in parallel. No need to await these since the webapp can be started before
    # this is completed. The last task to be completed exits the program
    def task(path: Union[Path, str]):
        path = Path(path)
        try:
        with Image.open(path) as img:
            img.thumbnail((2000, 360), Image.Resampling.NEAREST)
            img.save(outpath / f'{path.stem}_thumbnail.png')
        except:
            pass
        finally:
        if progress_bar:
                progress_bar.increment()

    for p in paths:
        executor.submit(task, p)
    return ((outpath / f'{Path(path).stem}_thumbnail.png') for path in paths)


def extract_render(
    path: str,
    version: str,
    doc_template_path: str,
    page_template_path: str,
    boot_template_path: str,
    asset_paths: Iterable[str],
    img_types: Iterable[str],
    config: ConfigParser,
    progress_bar: MRProgressBar,
    outpath: Path = Path(tempfile.gettempdir()) / 'html-mangareader',
) -> Path:
    """Main controller procedure. Handles opening of archive, image, or directory and renders the images
    appropriately for each, then opens the document in the user's default browser.

    Parameters:
    * `path`: path to image, directory, or archive.
    * `version`: version of the app to display to user.
    * `doc_template_path`: path to HTML template for the main document.
    * `page_template_path`: path to HTML template for individual comic page elements.
    * `boot_template_path`: path to HTML template for bootstrap document.
    * `asset_paths`: paths of static assets to copy.
    * `image_types`: list of recognized image file extensions.
    * `outpath`: directory to write temporary files in. Defaults to OS temp directory.

    Returns: Path to the bootstrap document, which can be opened in a web browser.

    Throws:
    * `BadZipFile`: opened file was a zip file, but could not be read.
    * `BadRarFile`: opened file was a rar file, but could not be read.
    * `Bad7zFile`: opened file was a 7z file, but could not be read.
    * `ImagesNotFound`: if no images could be found in an opened directory or archive.
    """
    start = 0
    pPath = Path(path).resolve()
    doc_template, page_template, boot_template = (
        resolve_template(p) for p in (doc_template_path, page_template_path, boot_template_path)
    )
    try:
        if pPath.is_file():
            if pPath.suffix.lower()[1:] in img_types:
                imgpaths = scan_directory(pPath.parent, img_types)
                start = imgpaths.index(pPath)
                title = pPath.parent.name
            else:
                try:
                    imgpaths = extract_zip(pPath, img_types, str(outpath))
                    title = pPath.name
                except zipfile.BadZipFile as e:
                    raise zipfile.BadZipfile(
                        f'"{path}" does not appear to be a valid zip/cbz file.'
                    ).with_traceback(e.__traceback__)
                except rarfile.BadRarFile as e:
                    raise rarfile.BadRarFile(
                        f'"{path}" does not appear to be a valid rar/cbr file.'
                    ).with_traceback(e.__traceback__)
                except py7zr.Bad7zFile as e:
                    raise py7zr.Bad7zFile(
                        f'"{path}" does not appear to be a valid 7z/cb7 file.'
                    ).with_traceback(e.__traceback__)
        else:
            imgpaths = scan_directory(path, img_types)
            title = pPath.name
        create_out_path(outpath)
        render_copy(asset_paths, outpath)
        if not config[CONFIG_KEY].getboolean('disableNavBar'):
            progress_bar.set_total(len(imgpaths))
            thumbnail_paths: Iterable[Optional[Path]] = create_thumbnails(
                imgpaths, outpath, progress_bar
            )
        else:
            thumbnail_paths = (None for _ in imgpaths)
            progress_bar.tk.after_idle(lambda: progress_bar.tk.destroy())

        renderfile = render_from_template(
            paths=imgpaths,
            thumbnails=thumbnail_paths,
            version=version,
            title=title,
            doc_template=doc_template,
            page_template=page_template,
            outfile=str(outpath / 'index.html'),
            config=config,
        )
        bootfile = render_bootstrap(
            outfile=str(outpath / 'boot.html'),
            render=Path(renderfile).as_uri(),
            index=start,
            boot_template=boot_template,
        )
        return Path(bootfile)

    except ImagesNotFound:
        raise
    return


def filename_comparator(filename: Union[str, Path]) -> List[Any]:
    """Natural sort comparison key function for filename sorting."""
    return [int(s) if s.isdigit() else s.lower() for s in re.split(r'(\d+)', str(filename))]
