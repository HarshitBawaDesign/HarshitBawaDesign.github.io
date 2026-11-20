import re, pathlib
here = pathlib.Path(__file__).resolve().parent; site = here.parent
src = (site / "media/hobi-icon-logo.svg").read_text()
vb = re.search(r'viewBox="([^"]+)"', src).group(1)
body = src.split("</defs>", 1)[1].rsplit("</svg>", 1)[0]
out = []
for k, e in enumerate(re.findall(r"<(?:path|circle)[^>]*/>", body)):
    cls = (re.search(r'class="([^"]*)"', e) or [None, ""])[1]
    e = re.sub(r'\s*class="[^"]*"', "", e)
    tag = "path" if e.startswith("<path") else "circle"
    if cls == "cls-1": role = "sil"
    elif tag == "circle": role = "eye" if float(re.search(r'r="([^"]+)"', e).group(1)) > 5 else "dot"
    elif cls == "": role = "spark"
    else:
        role = "line"; e = e.replace(f"<{tag}", f'<{tag} stroke-width="{4.31 if cls == "cls-3" else 5.54}"', 1)
    out.append(e.replace(f"<{tag}", f'<{tag} data-r="{role}"', 1))
html = (here / "index.template.html").read_text().replace("%%VB_I%%", vb).replace("%%ICON%%", "".join(out))
(site / "index.html").write_text(html)
print("built", len(html))
