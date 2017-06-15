DOC_TEMPLATE = (
    '<!doctype html>'
    '<html>'
    '<head><meta charset="utf-8"><title>Images</title>'
    '<style>'
    'body {font-size: 80px; background-color: #F0F0F0}'
    'img {box-shadow: 0px 0px 10px 0px #8A8A8A; border-radius: 3px}'
    '.next, .prev {position: absolute; top: 0; bottom: 0; display: inline-flex; flex-direction: column; justify-content: center;}'
    '.prev {left: 0; right: 50%; text-align:left; align-items: flex-start}'
    '.next {left: 50%; right: 0; text-align:right; align-items: flex-end}'
    'a {opacity: 0; color: #888888; transition: opacity 0.2s}'
    'a:hover {opacity: 1;}'
    '</style>'
    '</head>'
    '<body>'
    '$body'
    '</body>'
    '</html>'
)

IMG_TEMPLATE = (
    '<div id="$id" align="center" style="position:relative">\n'
    '<a href="#$previd">'
    '<span class="prev">❮</span></a>\n'
    '<a href="#$nextid">'
    '<span class="next">❯</span></a>\n'
    '<img src=$img /></div>\n'
)

DEFAULT_IMAGETYPES = {
    'jpg',
    'png',
    'bmp',
    'jpeg',
    'gif'
}