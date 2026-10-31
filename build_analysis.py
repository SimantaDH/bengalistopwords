"""
Build the data exports and the static figures for the Bengali stop-word project.

Run from the repository root:
    python build_analysis.py

Outputs
    bengali_stopwords.json   full annotated table (used by the website)
    bengali_stopwords.csv    the same table as a spreadsheet
    bengali_stopwords.txt    one romanised stop word per line
    bengali_stopwords_bn.txt one Bengali-script stop word per line
    summary.json             headline numbers
    fig*.png                 figures for the README and the report
"""

import csv
import json
import os
import re
import statistics
import sys
from collections import Counter, OrderedDict

import matplotlib

matplotlib.use("Agg")
import matplotlib.pyplot as plt  # noqa: E402

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = HERE  # all project files sit in one folder
sys.path.insert(0, HERE)

from stopword_data import CATEGORIES, ENTRIES  # noqa: E402

DATA = ROOT
FIGS = ROOT
os.makedirs(DATA, exist_ok=True)
os.makedirs(FIGS, exist_ok=True)

MACRO_ORDER = ["Pronominals", "Relational Words", "Adverbials", "Verbal & Negation"]
# Validated categorical palette (light surface #f4ecdc)
MACRO_COLOUR = {
    "Pronominals": "#A86F14",
    "Relational Words": "#00846F",
    "Adverbials": "#B24A3B",
    "Verbal & Negation": "#5352B4",
}
REGISTER_LABEL = {"C": "Standard colloquial (Cholito)",
                  "S": "Literary (Sadhu) / formal",
                  "R": "Regional / informal"}

# ---------------------------------------------------------------- pronoun grid
PARADIGM_COLS = ["Nom. sg.", "Nom. pl.", "Obj. sg.", "Obj. pl.", "Gen. sg.", "Gen. pl."]
PARADIGM = OrderedDict([
    ("1st person", ["ami", "amra", "amake amay", "amaderke amadigoke", "amar", "amader"]),
    ("2nd intimate (tui)", ["tui", "tora", "toke", "toderke", "tor", "toder"]),
    ("2nd familiar (tumi)", ["tumi", "tomra", "tomake tomay", "tomaderke tomadigoke", "tomar", "tomader"]),
    ("2nd formal (apni)", ["apni", "apnara", "apnake", "apnaderke apnadigoke", "apnar", "apnader"]),
    ("3rd ordinary (se)", ["se", "tara", "take tahake", "taderke", "tar tahar", "tader tahader"]),
    ("3rd honorific (tini)", ["tini", "tanra", "tanke", "tanderke", "tanr", "tander"]),
    ("Proximal ordinary", ["iha", "era", "eke ihake", "ederke", "er ihar", "eder ihader"]),
    ("Proximal honorific", ["ini", "enra", "enke", "enderke", "enr", "ender"]),
    ("Distal ordinary", ["o uha", "ora", "oke uhake", "oderke", "or uhar", "oder uhader"]),
    ("Distal honorific", ["uni", "unra", "unke", "underke", "unr", "under"]),
    ("Relative ordinary", ["je jaha", "jara", "jake jahake", "jaderke", "jar jahar", "jader jahader"]),
    ("Relative honorific", ["jini", "janra", "janke", "janderke", "janr", "jander"]),
    ("Interrogative", ["ke", "kara", "kake", "kaderke", "kar", "kader"]),
])

# A short constructed passage (written for this project, not quoted) used to
# show how much of ordinary Bengali prose the list removes.
SAMPLE_BN = (
    "আমি যখন প্রথমে ধানবাদে এসেছিলাম, তখন শহরটা আমার কাছে একটু অচেনা মনে হয়েছিল। "
    "কিন্তু কয়েক দিনের মধ্যে সবকিছু বদলে গেল। এখন আমি রোজ সকালে লাইব্রেরির দিকে হাঁটি, "
    "আর সেখানে পুরোনো বইয়ের পাতার মধ্যে নিজের জন্য একটা শান্ত কোণ খুঁজে পাই। "
    "হয়তো এই কারণে শহরটাকে এখন আর অচেনা লাগে না।"
)


def build_records():
    records = []
    for roman, bengali, cat, gloss, register, note in ENTRIES:
        label, macro, _ = CATEGORIES[cat]
        records.append(OrderedDict([
            ("roman", roman),
            ("bengali", bengali),
            ("category_id", cat),
            ("category", label),
            ("macro", macro),
            ("gloss", gloss),
            ("register", register),
            ("register_label", REGISTER_LABEL[register]),
            ("note", note),
            ("length", len(roman.replace(" ", ""))),
        ]))
    return records


def tokenise_bn(text):
    return [t for t in re.split(r"[\s।,;:!?\"'()\-–—.]+", text) if t]


def write_exports(records):
    with open(os.path.join(DATA, "bengali_stopwords.csv"), "w", newline="", encoding="utf-8") as fh:
        writer = csv.DictWriter(fh, fieldnames=list(records[0].keys()))
        writer.writeheader()
        writer.writerows(records)

    with open(os.path.join(DATA, "bengali_stopwords.txt"), "w", encoding="utf-8") as fh:
        fh.write("\n".join(r["roman"] for r in records) + "\n")

    seen, bn_lines = set(), []
    for r in records:
        if r["bengali"] and r["bengali"] not in seen:
            seen.add(r["bengali"])
            bn_lines.append(r["bengali"])
    with open(os.path.join(DATA, "bengali_stopwords_bn.txt"), "w", encoding="utf-8") as fh:
        fh.write("\n".join(bn_lines) + "\n")
    return bn_lines


def summarise(records, bn_unique):
    cat_counts = Counter(r["category_id"] for r in records)
    macro_counts = Counter(r["macro"] for r in records)
    reg_counts = Counter(r["register"] for r in records)
    lengths = [r["length"] for r in records]

    script_map = {}
    for r in records:
        if r["bengali"]:
            script_map.setdefault(r["bengali"], []).append(r["roman"])
    collisions = {k: v for k, v in script_map.items() if len(v) > 1}

    bn_set = set(bn_unique)
    tokens = tokenise_bn(SAMPLE_BN)
    hits = [t for t in tokens if t in bn_set]

    initials = Counter(r["roman"][0] for r in records)

    summary = OrderedDict([
        ("total_entries", len(records)),
        ("unique_bengali_forms", len(bn_unique)),
        ("categories", len(CATEGORIES)),
        ("macro_groups", len(MACRO_ORDER)),
        ("flagged_entries", sum(1 for r in records if r["note"])),
        ("multiword_entries", sum(1 for r in records if " " in r["roman"])),
        ("length_mean", round(statistics.mean(lengths), 2)),
        ("length_median", statistics.median(lengths)),
        ("length_min", min(lengths)),
        ("length_max", max(lengths)),
        ("register_counts", dict(reg_counts)),
        ("macro_counts", {m: macro_counts[m] for m in MACRO_ORDER}),
        ("category_counts", {CATEGORIES[k][0]: cat_counts[k] for k in CATEGORIES}),
        ("pronominal_share_pct", round(100 * macro_counts["Pronominals"] / len(records), 1)),
        ("script_collisions", collisions),
        ("initial_letters", dict(sorted(initials.items()))),
        ("sample_text", SAMPLE_BN),
        ("sample_tokens", len(tokens)),
        ("sample_stopword_tokens", len(hits)),
        ("sample_coverage_pct", round(100 * len(hits) / len(tokens), 1)),
        ("sample_notable_misses", ["একটা", "গেল", "মনে", "শহরটাকে"]),
    ])
    with open(os.path.join(DATA, "summary.json"), "w", encoding="utf-8") as fh:
        json.dump(summary, fh, ensure_ascii=False, indent=2)
    return summary


def style_axes(ax):
    for side in ("top", "right"):
        ax.spines[side].set_visible(False)
    ax.spines["left"].set_color("#b9ad97")
    ax.spines["bottom"].set_color("#b9ad97")
    ax.tick_params(colors="#4a4238", labelsize=9)
    ax.grid(axis="x", color="#e3d9c4", linewidth=0.8)
    ax.set_axisbelow(True)


def fig_categories(records):
    counts = Counter(r["category_id"] for r in records)
    order = sorted(CATEGORIES, key=lambda k: (MACRO_ORDER.index(CATEGORIES[k][1]), -counts[k]))
    labels = [CATEGORIES[k][0] for k in order]
    values = [counts[k] for k in order]
    colours = [MACRO_COLOUR[CATEGORIES[k][1]] for k in order]

    fig, ax = plt.subplots(figsize=(10, 7.2), facecolor="#f4ecdc")
    ax.set_facecolor("#f4ecdc")
    bars = ax.barh(labels[::-1], values[::-1], color=colours[::-1], height=0.7,
                   edgecolor="#f4ecdc", linewidth=2)
    for b, v in zip(bars, values[::-1]):
        ax.text(b.get_width() + 0.4, b.get_y() + b.get_height() / 2, str(v),
                va="center", fontsize=9, color="#2b251e")
    style_axes(ax)
    ax.set_xlabel("Number of stop words", color="#4a4238")
    ax.set_title("Bengali stop words by category (n = %d)" % len(records),
                 loc="left", fontsize=14, color="#2b251e", pad=14, family="serif")
    handles = [plt.Rectangle((0, 0), 1, 1, color=MACRO_COLOUR[m]) for m in MACRO_ORDER]
    ax.legend(handles, MACRO_ORDER, frameon=False, loc="lower right", fontsize=9)
    fig.tight_layout()
    fig.savefig(os.path.join(FIGS, "fig1_category_breakdown.png"), dpi=180)
    plt.close(fig)


def fig_macro(summary):
    vals = [summary["macro_counts"][m] for m in MACRO_ORDER]
    fig, ax = plt.subplots(figsize=(6.5, 6.5), facecolor="#f4ecdc")
    wedges, _ = ax.pie(vals, colors=[MACRO_COLOUR[m] for m in MACRO_ORDER], startangle=90,
                       counterclock=False, wedgeprops=dict(width=0.36, edgecolor="#f4ecdc", linewidth=3))
    total = sum(vals)
    ax.text(0, 0.06, str(total), ha="center", va="center", fontsize=30, family="serif", color="#2b251e")
    ax.text(0, -0.16, "stop words", ha="center", va="center", fontsize=11, color="#4a4238")
    ax.legend(wedges, ["%s  %d (%.0f%%)" % (m, v, 100 * v / total) for m, v in zip(MACRO_ORDER, vals)],
              frameon=False, loc="lower center", bbox_to_anchor=(0.5, -0.12), ncol=2, fontsize=9)
    ax.set_title("Four functional families", fontsize=14, family="serif", color="#2b251e")
    fig.tight_layout()
    fig.savefig(os.path.join(FIGS, "fig2_macro_groups.png"), dpi=180)
    plt.close(fig)


def fig_paradigm():
    fig, ax = plt.subplots(figsize=(12, 7.4), facecolor="#f4ecdc")
    ax.set_facecolor("#f4ecdc")
    rows = list(PARADIGM.keys())
    for i, row in enumerate(rows):
        for j, cell in enumerate(PARADIGM[row]):
            forms = cell.split()
            shade = "#e8c98f" if len(forms) == 1 else "#c99a45"
            ax.add_patch(plt.Rectangle((j + 0.04, i + 0.06), 0.92, 0.88, color=shade, linewidth=0))
            ax.text(j + 0.5, i + 0.5, " / ".join(forms), ha="center", va="center",
                    fontsize=8.5, color="#2b251e")
    ax.set_xlim(0, len(PARADIGM_COLS))
    ax.set_ylim(len(rows), 0)
    ax.set_xticks([x + 0.5 for x in range(len(PARADIGM_COLS))])
    ax.set_xticklabels(PARADIGM_COLS, fontsize=9, color="#4a4238")
    ax.xaxis.tick_top()
    ax.set_yticks([y + 0.5 for y in range(len(rows))])
    ax.set_yticklabels(rows, fontsize=9, color="#4a4238")
    for s in ax.spines.values():
        s.set_visible(False)
    ax.tick_params(length=0)
    ax.set_title("The pronoun paradigm captured by the list (darker cells hold two forms of one slot)",
                 loc="left", fontsize=12, family="serif", color="#2b251e", pad=30)
    fig.tight_layout()
    fig.savefig(os.path.join(FIGS, "fig3_pronoun_paradigm.png"), dpi=180)
    plt.close(fig)


def fig_lengths(records):
    lengths = Counter(r["length"] for r in records)
    xs = list(range(min(lengths), max(lengths) + 1))
    fig, ax = plt.subplots(figsize=(9, 4.6), facecolor="#f4ecdc")
    ax.set_facecolor("#f4ecdc")
    ax.bar(xs, [lengths.get(x, 0) for x in xs], color="#A86F14", width=0.8,
           edgecolor="#f4ecdc", linewidth=2)
    style_axes(ax)
    ax.grid(axis="y", color="#e3d9c4", linewidth=0.8)
    ax.grid(axis="x", visible=False)
    ax.set_xticks(xs)
    ax.set_xlabel("Length of romanised form (letters)", color="#4a4238")
    ax.set_ylabel("Stop words", color="#4a4238")
    ax.set_title("Most stop words are short: four to six letters", loc="left",
                 fontsize=13, family="serif", color="#2b251e")
    fig.tight_layout()
    fig.savefig(os.path.join(FIGS, "fig4_word_length.png"), dpi=180)
    plt.close(fig)


def fig_register(records):
    by = Counter((r["macro"], r["register"]) for r in records)
    fig, ax = plt.subplots(figsize=(9, 4.2), facecolor="#f4ecdc")
    ax.set_facecolor("#f4ecdc")
    regs = [("C", "#b9ad97"), ("S", "#A86F14"), ("R", "#5352B4")]
    left = [0] * len(MACRO_ORDER)
    for code, col in regs:
        vals = [by[(m, code)] for m in MACRO_ORDER]
        ax.barh(MACRO_ORDER[::-1], vals[::-1], left=left[::-1], color=col, height=0.6,
                edgecolor="#f4ecdc", linewidth=2, label=REGISTER_LABEL[code])
        left = [l + v for l, v in zip(left, vals)]
    style_axes(ax)
    ax.set_xlabel("Stop words", color="#4a4238")
    ax.legend(frameon=False, fontsize=9, loc="lower right")
    ax.set_title("Where the literary Sadhu forms sit", loc="left", fontsize=13,
                 family="serif", color="#2b251e")
    fig.tight_layout()
    fig.savefig(os.path.join(FIGS, "fig5_register.png"), dpi=180)
    plt.close(fig)


def main():
    records = build_records()
    bn_unique = write_exports(records)
    summary = summarise(records, bn_unique)

    payload = OrderedDict([
        ("meta", OrderedDict([
            ("title", "Bengali Stop Words for Natural Language Processing"),
            ("author", "Simanta Nandi"),
            ("licence", "CC BY-NC 4.0"),
            ("version", "1.0"),
        ])),
        ("macro_order", MACRO_ORDER),
        ("categories", OrderedDict((k, {"label": v[0], "macro": v[1], "description": v[2]})
                                   for k, v in CATEGORIES.items())),
        ("paradigm", {"columns": PARADIGM_COLS, "rows": PARADIGM}),
        ("summary", summary),
        ("entries", records),
    ])
    with open(os.path.join(DATA, "bengali_stopwords.json"), "w", encoding="utf-8") as fh:
        json.dump(payload, fh, ensure_ascii=False, indent=1)

    # The website reads the same table from a script file, so that it also
    # works when index.html is opened straight from disk.
    js_dir = ROOT
    os.makedirs(js_dir, exist_ok=True)
    with open(os.path.join(js_dir, "data.js"), "w", encoding="utf-8") as fh:
        fh.write("/* Generated by build_analysis.py. Do not edit by hand. */\n")
        fh.write("window.STOPWORDS = ")
        json.dump(payload, fh, ensure_ascii=False, separators=(",", ":"))
        fh.write(";\n")

    fig_categories(records)
    fig_macro(summary)
    fig_paradigm()
    fig_lengths(records)
    fig_register(records)

    for key in ("total_entries", "unique_bengali_forms", "flagged_entries", "length_mean",
                "length_median", "pronominal_share_pct", "sample_tokens",
                "sample_stopword_tokens", "sample_coverage_pct"):
        print("%-24s %s" % (key, summary[key]))
    print("register", summary["register_counts"])
    print("macro", summary["macro_counts"])
    print("collisions", summary["script_collisions"])


if __name__ == "__main__":
    main()
