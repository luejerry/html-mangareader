from tkinter import Tk
from tkinter.ttk import Label, Progressbar


class MRProgressBar:
    tk: Tk
    progress: Progressbar
    label: Label
    count: int
    total: int

    def __init__(self, tk: Tk):
        self.tk = tk
        self.progress = Progressbar(tk, orient='horizontal', length=380, mode='determinate')
        self.count = 0
        self.label = Label(tk, text='Select a file to open')
        self.progress.grid(row=0, column=0, padx=10, pady=10)
        self.label.grid(row=1, column=0, padx=10, pady=5)

    def set_total(self, total: int) -> None:
        self.total = total

    def increment(self) -> None:
        self.count += 1
        self.progress.step(100 / self.total)
        self.label['text'] = f'Processed image {self.count}/{self.total}'
        if self.count == self.total:
            self.tk.destroy()
