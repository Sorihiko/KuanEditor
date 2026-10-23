"""Assemble Kuan.html from the files under src/.
Usage:  python src/build.py      (writes Kuan.html next to the src folder)

All script files run in ONE shared scope, in the order listed in SCRIPTS below
(they are simply joined together inside one <script>). So a file can use anything
defined in a file listed before it; functions can be used from anywhere.
To add a new file: create it, then add its path to STYLES or SCRIPTS."""
import os
D = os.path.dirname(os.path.abspath(__file__))

STYLES = [
    'styles/theme.css',         # colours and fonts (CSS variables)
    'styles/layout.css',        # page layout, panels, tabs, docking, menu bar
    'styles/bin.css',
    'styles/tools.css',
    'styles/monitor.css',
    'styles/effects.css',
    'styles/style-export.css',
    'styles/timeline.css',
    'styles/widgets.css',       # menus, popups, toast, misc controls
]

SCRIPTS = [
    # interface language: English dictionary + the translator (must come first)
    'config/i18n-en.js',
    'ui/i18n.js',
    # settings: presets, defaults, labels, menus (plain data, safe to edit)
    'config/lyric-styles.js',
    'config/hit-effects.js',
    'config/kiai.js',
    'config/particles.js',
    'config/spectrum.js',
    'config/clips.js',
    'config/screen-fx.js',
    'config/workspaces.js',
    'config/menus.js',
    # engine: parsing, generation, export (no UI)
    'engine/util.js',
    'engine/sample.js',
    'engine/state.js',
    'engine/parse.js',
    'engine/timing.js',
    'engine/glyphs.js',
    'engine/lyrics.js',
    'engine/media.js',
    'engine/clips.js',
    'engine/hit-effects.js',
    'engine/kiai.js',
    'engine/screen-fx.js',
    'engine/particles.js',
    'engine/osb-import.js',
    'engine/spectrum.js',
    'engine/build.js',
    'engine/evaluate.js',
    'engine/export.js',
    'engine/optimize.js',
    'engine/lrc-edit.js',
    # user interface
    'ui/dock.js',
    'ui/glview.js',
    'ui/base.js',
    'ui/clock-audio.js',
    'ui/history.js',
    'ui/stats.js',
    'ui/export-panel.js',
    'ui/shortcuts.js',
    'ui/bin.js',
    'ui/monitor.js',
    'ui/notes.js',
    'ui/timeline-draw.js',
    'ui/tracks.js',
    'ui/clip-menu.js',
    'ui/timeline-input.js',
    'ui/effect-controls.js',
    'ui/fx-particles.js',
    'ui/fx-effects.js',
    'ui/fx-screen.js',
    'ui/fx-image.js',
    'ui/style-panel.js',
    'ui/difficulties.js',
    'ui/project-file.js',
    'ui/folder.js',
    'ui/frame-loop.js',
    'ui/boot.js',
    'ui/menubar.js',
]

def rd(n):
    with open(os.path.join(D, n), encoding='utf-8') as f:
        return f.read()

def build():
    css = ''.join(rd(n) for n in STYLES)
    js = '(function(){\n"use strict";\n' + ''.join(rd(n) for n in SCRIPTS) + '\n})();'
    page = rd('index.html').replace('<!-- @styles -->', '<style>\n' + css + '</style>', 1)
    out = os.path.join(os.path.dirname(D), 'Kuan.html')
    with open(out, 'w', encoding='utf-8') as f:
        f.write(page + '\n<script>\n' + js + '\n</script>\n')
    print('built', out)

if __name__ == '__main__':
    build()
