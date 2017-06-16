DOC_TEMPLATE = (
    '<!doctype html>'
    '<html>'
    '<head><meta charset="utf-8"><title>Images</title>'
    '<style>'
    'body {font-size: 80px; background-color: #F0F0F0}'
    'img {box-shadow: 0px 2px 7px 0px rgba(0,0,0,0.1); border-radius: 5px; border-style: solid; border-width: 1px; border-color: #DDDDDD}'
    '.next, .prev {position: absolute; top: 0; bottom: 0; display: inline-flex; flex-direction: column; justify-content: center; z-index: 10; opacity: 0; transition: opacity 0.2s}'
    '.next:hover, .prev:hover {opacity: 1}'
    '.prev {left: 0; right: 50%; text-align:left; align-items: flex-start}'
    '.next {left: 50%; right: 0; text-align:right; align-items: flex-end}'
    # 'a {opacity: 0; color: #888888; transition: opacity 0.2s}'
    # 'a:hover {opacity: 1;}'
    '.arrow {position: fixed; top: 50%; margin-top: -50px; z-index: -1; color: #888888}'
    '</style>'
    '</head>'
    '<body>'
    '$body'
    '</body>'
    '</html>'
)

IMG_TEMPLATE = (
    '<div id="$id" align="center" style="position:relative; margin: 50px 0">\n'
    '<a href="#$previd">'
    '<span class="prev">'
    '<div class="arrow">❮</div>'
    '</span></a>\n'
    '<a href="#$nextid">'
    '<span class="next">'
    '<div class="arrow">❯</div>'
    '</span></a>\n'
    '<img src=$img /></div>\n'
)

DEFAULT_IMAGETYPES = {
    'jpg',
    'png',
    'bmp',
    'jpeg',
    'gif'
}