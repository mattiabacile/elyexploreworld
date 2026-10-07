"""Check local dependencies and HTML identifiers without third-party packages."""
from pathlib import Path
from html.parser import HTMLParser
from urllib.parse import urlsplit, unquote, parse_qs
import hashlib
import re

ROOT = Path(__file__).resolve().parents[1]
class Page(HTMLParser):
    def __init__(self):
        super().__init__(); self.ids = []; self.refs = []
    def handle_starttag(self, tag, attrs):
        attrs = dict(attrs)
        if 'id' in attrs: self.ids.append(attrs['id'])
        for key in ('href', 'src'):
            if key in attrs: self.refs.append(attrs[key])
        for candidate in attrs.get('srcset', '').split(','):
            if candidate.strip(): self.refs.append(candidate.split()[0])

for file in [*ROOT.glob('*.html'), ROOT / 'admin/index.html']:
    page = Page(); page.feed(file.read_text())
    assert len(page.ids) == len(set(page.ids)), f'Duplicate ID: {file.name}'
    for ref in page.refs:
        url = urlsplit(ref)
        if url.scheme or url.netloc: continue
        target = ((ROOT / unquote(url.path).lstrip('/')) if url.path.startswith('/') else file.parent / unquote(url.path)) if url.path else file
        if target.is_dir(): target = target / 'index.html'
        assert target.is_file(), f'Missing file: {file.name} -> {ref}'
        if target.suffix in ('.css', '.js'):
            version = hashlib.sha256(target.read_bytes()).hexdigest()[:12]
            assert parse_qs(url.query).get('v') == [version], f'Stale asset version: {file.name} -> {ref}'
        if url.fragment and target.suffix == '.html':
            other = Page(); other.feed(target.read_text())
            assert unquote(url.fragment) in other.ids, f'Missing anchor: {file.name} -> {ref}'
for file in [*ROOT.glob('*.js'), *ROOT.glob('*.css'), *ROOT.glob('admin/*.js'), *ROOT.glob('admin/*.css')]:
    source = file.read_text()
    for ref, version in re.findall(r'''["']([\w./-]+\.(?:css|js))\?v=([0-9a-f]{12})["']''', source):
        target = ROOT / ref.lstrip('/') if ref.startswith('/') else file.parent / ref
        assert target.is_file(), f'Missing dynamic resource: {file.name} -> {ref}'
        assert hashlib.sha256(target.read_bytes()).hexdigest()[:12] == version, f'Stale dynamic resource: {file.name} -> {ref}'
    for ref in re.findall(r'''["'](assets/[^"']+)["']''', source):
        assert (ROOT / ref).is_file(), f'Missing asset: {file.name} -> {ref}'
    if file.suffix == '.css':
        for match in re.finditer(r'''url\(\s*(?:(["'])(.*?)\1|([^)]*?))\s*\)''', source):
            ref = match.group(2) if match.group(1) else match.group(3)
            url = urlsplit(ref.strip())
            if url.path and not url.scheme and not url.netloc:
                assert (file.parent / unquote(url.path)).is_file(), f'Missing CSS resource: {file.name} -> {ref}'
        clean = re.sub(r'/\*.*?\*/', '', source, flags=re.S)
        depth = 0
        for char in clean:
            if char == '{': depth += 1
            if char == '}': depth -= 1
            assert depth >= 0, f'Unbalanced CSS: {file.name}'
        assert depth == 0, f'Unbalanced CSS: {file.name}'
print('PASS: local files, images, font resources, links, anchors, IDs, CSS braces and content versions for every stylesheet and script.')
