import py7zr
from pathlib import Path
from typing import Union


class SevenZipAdapter:
    """
    Minimal wrapper class over py7zr.SevenZipFile to support zipfile-like interface.
    """

    def __init__(self, file: Union[Path, str], mode: str = 'r'):
        self._file = py7zr.SevenZipFile(str(file), mode)

    def __enter__(self):
        return self

    def __exit__(self, type, value, traceback):
        self._file.close()

    def namelist(self):
        return self._file.getnames()

    def extractall(self, path=None, members=None):
        self._file.extractall(path)
