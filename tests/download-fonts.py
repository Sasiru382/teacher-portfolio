"""One-time developer download; production uses only local font files."""
from pathlib import Path
import urllib.request,re
p=Path(__file__).resolve().parents[1]/'assets'/'fonts'
css=[]
for family,name,alias in [('Cormorant Garamond','cormorant','PortfolioSerif'),('Caveat','caveat','PortfolioHand'),('Nunito Sans','nunito','PortfolioSans')]:
    url='https://fonts.googleapis.com/css2?family='+family.replace(' ','+')+':wght@400;600;700&display=swap'
    source=urllib.request.urlopen(url).read().decode()
    for block in source.split('@font-face')[1:]:
        weight=re.search(r'font-weight:\s*(\d+)',block).group(1)
        remote=re.search(r'url\(([^)]+)\)',block).group(1)
        filename=f'{name}-{weight}.ttf'
        urllib.request.urlretrieve(remote,p/filename)
        css.append(f"@font-face {{ font-family: {alias}; src: url('{filename}') format('truetype'); font-display: swap; font-weight: {weight}; font-style: normal; }}")
        print('Downloaded',filename)
(p/'fonts.css').write_text('\n'.join(css)+'\n')
for legacy in ['cormorant.ttf','caveat.ttf','nunito.ttf']:
    (p/legacy).unlink(missing_ok=True)
