DOC_TEMPLATE = (
    '<!doctype html>'
    '<html>'
    '<head><meta charset="utf-8"><title>Images</title>'
    '<style>'
    'body {font-size: 80px; background-color: #F0F0F0}'
    'img {box-shadow: 0px 2px 7px 0px rgba(0,0,0,0.1); border-radius: 5px; border-style: solid; border-width: 1px; border-color: #DDDDDD}'
    '.next, .prev {position: absolute; top: 0; bottom: 0; z-index: 10; opacity: 0; transition: opacity 0.2s}'
    '.next:hover, .prev:hover {opacity: 1}'
    '.prev {left: 0; right: 50%; text-align:left}'
    '.next {left: 50%; right: 0; text-align:right}'
    # 'a {opacity: 0; color: #888888; transition: opacity 0.2s}'
    # 'a:hover {opacity: 1;}'
    '.arrow {position: fixed; top: 50%; margin-top: -50px; z-index: -1; color: #888888}'
    '.left {left: 0}'
    '.right {right: 0}'
    '</style>'
    '</head>'
    '<body>'
    '$body'
    '</body>'
    '</html>'
)

IMG_TEMPLATE = (
    '<div id="_$id" align="center" style="position:relative; margin: 50px 0">\n'
    '<a href="#_$previd">'
    '<span class="prev">'
    '<div class="arrow left">❮</div>'
    '</span></a>\n'
    '<a href="#_$nextid">'
    '<span class="next">'
    '<div class="arrow right">❯</div>'
    '</span></a>\n'
    '<img src=$img /></div>\n'
)

BOOT_TEMPLATE = (
    '<html><head>'
    '<meta http-equiv="refresh" content="0; url=$document#_$index">'
    '</head></html>'
)

DEFAULT_IMAGETYPES = {
    'jpg',
    'png',
    'bmp',
    'jpeg',
    'gif'
}