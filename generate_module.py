"""
Regenerate bengali_stopwords.py from the master table in stopword_data.py.

Run from the repository root:
    python generate_module.py
"""
import os
import sys

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = HERE  # all project files sit in one folder
sys.path.insert(0, HERE)
from stopword_data import ENTRIES, CATEGORIES

order = list(CATEGORIES.keys())
by = {k: [e for e in ENTRIES if e[2] == k] for k in order}


def block(items, indent="    ", width=72):
    out, line = [], indent
    for it in items:
        tok = '"%s", ' % it
        if len(line) + len(tok) > width and line.strip():
            out.append(line.rstrip())
            line = indent
        line += tok
    if line.strip():
        out.append(line.rstrip())
    return "\n".join(out)


HEADER = '''"""
============================================================
Topic: Indic Language Stop Words for Natural Language Processing
============================================================

Author Name(s): Simanta Nandi
Short Description: This file contains a stop-word list for one Indic
    language, Bengali. These words may be used during text preprocessing
    in Natural Language Processing (NLP).
Semester: Monsoon Semester 2026
Affiliation: Department of Humanities and Social Sciences,
    Indian Institute of Technology (Indian School of Mines) Dhanbad

Licence: Creative Commons Attribution-NonCommercial 4.0 International
    (CC BY-NC 4.0)

============================================================
"""

import re
import unicodedata

'''

parts = [HEADER]
parts.append("# 1. Bengali Stop Words\n# Language: Bengali\n# Script: Bengali (romanised in Latin letters; "
             "the Bengali-script forms follow in section 2)\n")
parts.append("bengali_stopwords = [")
for k in order:
    label = CATEGORIES[k][0]
    parts.append("    # %s (%d)" % (label, len(by[k])))
    parts.append(block([e[0] for e in by[k]]))
parts.append("]\n")

parts.append("\n# 2. The same stop words in Bengali script\n"
             "# Duplicates are removed, because two romanised spellings can stand\n"
             "# for one Bengali word (onno and onnya are both অন্য).\n")
parts.append("bengali_stopwords_script = [")
seen = set()
for k in order:
    items = []
    for e in by[k]:
        if e[1] and e[1] not in seen:
            seen.add(e[1]); items.append(e[1])
    parts.append("    # %s" % CATEGORIES[k][0])
    parts.append(block(items))
parts.append("]\n")

parts.append("\n# 3. Category of every romanised stop word\n")
parts.append("stopword_categories = {")
for k in order:
    parts.append('    "%s": [' % CATEGORIES[k][0])
    parts.append(block([e[0] for e in by[k]], indent="        "))
    parts.append("    ],")
parts.append("}\n")

FOOTER = '''

# 4. Helper functions

def _normalise(text):
    """Return NFC-normalised, lower-case text.

    Bengali letters such as য় and ড় can be typed as one code point or as a
    base letter plus a nukta. NFC makes both spellings identical, so the
    look-up does not miss a word only because of how it was typed.
    """
    return unicodedata.normalize("NFC", text).lower()


_STOP_ROMAN = {_normalise(w) for w in bengali_stopwords if " " not in w}
_STOP_ROMAN_PHRASES = [_normalise(w) for w in bengali_stopwords if " " in w]
_STOP_SCRIPT = {_normalise(w) for w in bengali_stopwords_script if " " not in w}
_STOP_SCRIPT_PHRASES = [_normalise(w) for w in bengali_stopwords_script if " " in w]
_TOKEN = re.compile(r"[\\u0980-\\u09FFA-Za-z]+")


def is_stopword(word):
    """True if the word, in either script, is in the list."""
    w = _normalise(word.strip())
    return w in _STOP_ROMAN or w in _STOP_SCRIPT


def remove_stopwords(text):
    """Tokenise Bengali or romanised Bengali text and drop the stop words.

    Multi-word entries such as "sathe sathe" are removed first, so that the
    two halves are not counted separately.
    """
    clean = _normalise(text)
    for phrase in _STOP_ROMAN_PHRASES + _STOP_SCRIPT_PHRASES:
        clean = clean.replace(phrase, " ")
    tokens = _TOKEN.findall(clean)
    return [t for t in tokens if t not in _STOP_ROMAN and t not in _STOP_SCRIPT]


if __name__ == "__main__":
    print("Romanised stop words:      ", len(bengali_stopwords))
    print("Bengali-script stop words: ", len(bengali_stopwords_script))
    print("Categories:                ", len(stopword_categories))
    for name, words in stopword_categories.items():
        print("  %-42s %3d" % (name, len(words)))

    sample_roman = "ami jokhon prothome ekhane eshechhilam, tokhon shohorta amar kachhe ektu ochena chhilo"
    sample_script = "আমি যখন প্রথমে এখানে এসেছিলাম, তখন শহরটা আমার কাছে একটু অচেনা ছিল"
    print()
    print("Romanised input :", sample_roman)
    print("After filtering :", remove_stopwords(sample_roman))
    print("Bengali input   :", sample_script)
    print("After filtering :", remove_stopwords(sample_script))
'''
parts.append(FOOTER)
open(os.path.join(ROOT, "bengali_stopwords.py"), "w", encoding="utf-8").write("\n".join(parts))
print("bengali_stopwords.py written")
