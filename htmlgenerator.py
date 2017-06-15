import sys
import os
import tempfile

# Recognized image file type extensions
imagetypes = {'jpg', 'png', 'bmp', 'jpeg', 'gif'}

# Boilerplate for the output HTML file
htmltemplatehead = ['<!doctype html>',
                    '<html>',
                    '<head><meta charset="utf-8"><title>Images</title>',
                    '<style>',
                    'body {font-size: 80px; background-color: #F0F0F0}',
                    # 'div {display: inline-block}',
                    'img {box-shadow: 0px 0px 10px 0px #8A8A8A; border-radius: 3px}',
                    '.next, .prev {position: absolute; top: 0; bottom: 0; display: inline-flex; flex-direction: column; justify-content: center; z-index: 10}',
                    '.prev {left: 0; right: 50%; text-align:left; align-items: flex-start}',
                    '.next {left: 50%; right: 0; text-align:right; align-items: flex-end}',
                    'a {opacity: 0; color: #888888; transition: opacity 0.2s}',
                    'a:hover {opacity: 1;}',
                    '.arrow {position: fixed; top: 50%; z-index: -1}',
                    '</style>',
                    '</head>',
                    '<body>']
htmltemplatefoot = ['</body></html>']
htmltemplateimg = '<div id="{id}" align="center" style="position:relative">\n' \
                  '<a href="#{previd}">' \
                  '<span class="prev">' \
    '<div class="arrow">❮</div></span></a>\n' \
                  '<a href="#{nextid}">' \
                  '<span class="next"><div class="arrow">❯</div></span></a>\n' \
                  '<img src={img} /></div>\n'

def render(path):
    files = filter(lambda e: os.path.isfile(os.path.join(path, e)), os.listdir(path))
    imagefiles = list(filter(lambda f: f.split('.')[-1].lower() in imagetypes, files))
    # print (list(files))
    if len(imagefiles) == 0:
        print('No image files were found in path: {0}'.format(path))
        return
    renderfd = open(os.path.join(path, 'imagesrender.html'), 'w', encoding='utf-8', newline='\r\n')
    renderfd.writelines(htmltemplatehead)
    for id in range(0, len(imagefiles)):
        renderfd.write(htmltemplateimg.format(img=imagefiles[id], id=id, previd=(id - 1), nextid=(id + 1)))
    renderfd.writelines(htmltemplatefoot)
    renderfd.close()

# arg in sys.argv

def render_from_template(path, 
                         doc_template, page_template, img_types,
                         outfile=tempfile.gettempdir()):
    files = filter(lambda e: os.path.isfile(os.path.join(path, e)),
                   os.listdir(path))
    imagefiles = list(filter(lambda f: f.split('.')[-1].lower() in imagetypes,
                             files))
    if not imagefiles:
        print('No image files were found in path: {0}'.format(path))
        return
    
    pass

if __name__ == '__main__':
    path = '.' if len(sys.argv) <= 1 else sys.argv[1]
    render(path)