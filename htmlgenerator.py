import sys
import os
import tempfile
from string import Template
import pathlib
import templates

def render_from_template(path, 
                         doc_template, page_template, img_types,
                         outfile=os.path.join(tempfile.gettempdir(), 'render.html')):
    files = filter(lambda e: os.path.isfile(os.path.join(path, e)),
                   os.listdir(path))
    imagefiles = filter(lambda f: f.split('.')[-1].lower() in img_types, files)
    if not imagefiles:
        print('No image files were found in path: {0}'.format(path))
        return
    imagepaths = [pathlib.Path(os.path.abspath(p)).as_uri() for p in imagefiles]
    with open(outfile, 'w', encoding='utf-8', newline='\r\n') as renderfd:
        doc_template = Template(templates.DOC_TEMPLATE)
        img_template = Template(templates.IMG_TEMPLATE)
        img_list = [img_template.substitute(img=imagepaths[i], id=i, previd=(i-1), nextid=(i+1))
                    for i in range(0, len(imagepaths))]
        doc_string = doc_template.substitute(body=''.join(img_list))
        renderfd.write(doc_string)
    print("view saved to " + outfile)
    return

if __name__ == '__main__':
    path = '.' if len(sys.argv) <= 1 else sys.argv[1]
    # render_from_template(path, templates.DOC_TEMPLATE, templates.IMG_TEMPLATE, templates.DEFAULT_IMAGETYPES, os.path.join(path, 'render.html'))
    render_from_template(path, templates.DOC_TEMPLATE, templates.IMG_TEMPLATE, templates.DEFAULT_IMAGETYPES)