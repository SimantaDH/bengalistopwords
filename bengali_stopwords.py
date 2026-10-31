"""
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


# 1. Bengali Stop Words
# Language: Bengali
# Script: Bengali (romanised in Latin letters; the Bengali-script forms follow in section 2)

bengali_stopwords = [
    # First-Person Pronouns (8)
    "ami", "amra", "amake", "amader", "amar", "amay", "amadigoke",
    "amaderke",
    # Second-Person Pronouns (21)
    "tumi", "tomra", "tomake", "tomader", "tomar", "tomay",
    "tomadigoke", "tomaderke", "tui", "tora", "toke", "toder", "tor",
    "toderke", "apni", "apnara", "apnake", "apnader", "apnar",
    "apnadigoke", "apnaderke",
    # Third-Person Pronouns (15)
    "se", "tara", "take", "tader", "tar", "tahar", "tahake", "tahader",
    "taderke", "tini", "tanra", "tanke", "tander", "tanr", "tanderke",
    # Proximal & Distal Pronouns (31)
    "era", "eke", "eder", "er", "iha", "ihar", "ihake", "ihader",
    "ederke", "ini", "enra", "enke", "ender", "enr", "enderke", "o",
    "ora", "oke", "oder", "or", "uha", "uhar", "uhake", "uhader",
    "oderke", "uni", "unra", "unke", "under", "unr", "underke",
    # Relative Pronouns (16)
    "je", "jara", "jake", "jader", "jar", "jaha", "jahar", "jahake",
    "jahader", "jaderke", "jini", "janra", "janke", "jander", "janr",
    "janderke",
    # Interrogatives (19)
    "ki", "kee", "ke", "kara", "kake", "kader", "kar", "kaderke",
    "keno", "kobe", "kothay", "kibhabe", "koto", "kon", "konti",
    "kamne", "koy", "kemon", "konta",
    # Reflexive, Reciprocal & Emphatic Forms (7)
    "nijer", "nije", "nijeder", "aposh", "apnio", "tumio", "amio",
    # Demonstratives & Classifier Forms (18)
    "ei", "oi", "sei", "ekti", "duti", "koyekti", "eta", "ota", "seta",
    "jeta", "eti", "oti", "seti", "jeti", "egulo", "ogulo", "segulo",
    "jegulo",
    # Conjunctions & Connectives (28)
    "ebong", "ar", "ba", "athaba", "kintu", "tobe", "karon", "jodi",
    "tahole", "jate", "jodio", "tobu", "tobuo", "kiba", "noba",
    "nocheth", "tathapi", "kimbha", "jeno", "sutorang", "tai",
    "nahole", "noyto", "kenona", "jehetu", "sehetu", "tarpor",
    "tarpore",
    # Postpositions & Case Markers (31)
    "kachhe", "theke", "hote", "cheye", "dara", "diye", "kortrik",
    "sathe", "sange", "majhe", "modhye", "upore", "niche", "pashe",
    "samne", "pichhone", "jonno", "dik", "dike", "bhitore", "baire",
    "chhara", "obdhi", "porjonto", "bina", "proti", "karone", "moto",
    "hishebe", "bishoye", "shomporke",
    # Spatial Deictics (5)
    "ekhane", "okhane", "sekhane", "jekhane", "kothao",
    # Temporal Adverbs (28)
    "aaj", "kal", "gotokal", "agami", "ekhon", "tokhon", "kokhono",
    "jokhon", "sada", "sorboda", "abar", "pore", "age", "nityo",
    "praishoy", "roj", "kakhono", "sathe sathe", "ajkal", "ekhono",
    "ebar", "jotokhon", "totokhon", "konodin", "prothome", "shese",
    "ager", "porer",
    # Quantifiers & Indefinites (24)
    "ek", "anek", "kichu", "sob", "shobai", "protyek", "kono", "keu",
    "aro", "onno", "onnya", "sobkichu", "kom", "beshi", "jothto",
    "poriman", "koyek", "mot", "ektu", "jothesto", "joto", "toto",
    "kauke", "karo",
    # Manner, Degree & Discourse Adverbs (23)
    "erup", "orup", "jemon", "temon", "emon", "sotti", "asole",
    "bastobe", "nihat", "khub", "otyoonto", "pray", "sudhu", "kebal",
    "matro", "emonki", "nischoy", "botey", "hoyto", "bodhoy", "thik",
    "bhabe", "rokom",
    # Auxiliary, Copular & Modal Verbs (28)
    "hoy", "hocche", "hobe", "hoyechhe", "hoyechhilo", "holo", "hoto",
    "hok", "hochhilo", "achhe", "achhi", "chilo", "chhilam", "thakbe",
    "thak", "thake", "koro", "korchhe", "korbe", "korechhe",
    "korechhilo", "kori", "korlam", "korbo", "kora", "korte", "paren",
    "pare",
    # Conjunctive Participles (6)
    "dhore", "niye", "kore", "hoye", "giye", "bole",
    # Negation (9)
    "na", "ni", "nei", "noy", "non", "no", "noi", "hoyni", "korini",
]


# 2. The same stop words in Bengali script
# Duplicates are removed, because two romanised spellings can stand
# for one Bengali word (onno and onnya are both অন্য).

bengali_stopwords_script = [
    # First-Person Pronouns
    "আমি", "আমরা", "আমাকে", "আমাদের", "আমার", "আমায়", "আমাদিগকে",
    "আমাদেরকে",
    # Second-Person Pronouns
    "তুমি", "তোমরা", "তোমাকে", "তোমাদের", "তোমার", "তোমায়",
    "তোমাদিগকে", "তোমাদেরকে", "তুই", "তোরা", "তোকে", "তোদের", "তোর",
    "তোদেরকে", "আপনি", "আপনারা", "আপনাকে", "আপনাদের", "আপনার",
    "আপনাদিগকে", "আপনাদেরকে",
    # Third-Person Pronouns
    "সে", "তারা", "তাকে", "তাদের", "তার", "তাহার", "তাহাকে", "তাহাদের",
    "তাদেরকে", "তিনি", "তাঁরা", "তাঁকে", "তাঁদের", "তাঁর", "তাঁদেরকে",
    # Proximal & Distal Pronouns
    "এরা", "একে", "এদের", "এর", "ইহা", "ইহার", "ইহাকে", "ইহাদের",
    "এদেরকে", "ইনি", "এঁরা", "এঁকে", "এঁদের", "এঁর", "এঁদেরকে", "ও",
    "ওরা", "ওকে", "ওদের", "ওর", "উহা", "উহার", "উহাকে", "উহাদের",
    "ওদেরকে", "উনি", "ওঁরা", "ওঁকে", "ওঁদের", "ওঁর", "ওঁদেরকে",
    # Relative Pronouns
    "যে", "যারা", "যাকে", "যাদের", "যার", "যাহা", "যাহার", "যাহাকে",
    "যাহাদের", "যাদেরকে", "যিনি", "যাঁরা", "যাঁকে", "যাঁদের", "যাঁর",
    "যাঁদেরকে",
    # Interrogatives
    "কি", "কী", "কে", "কারা", "কাকে", "কাদের", "কার", "কাদেরকে", "কেন",
    "কবে", "কোথায়", "কীভাবে", "কত", "কোন", "কোনটি", "কেমনে", "কয়",
    "কেমন", "কোনটা",
    # Reflexive, Reciprocal & Emphatic Forms
    "নিজের", "নিজে", "নিজেদের", "আপস", "আপনিও", "তুমিও", "আমিও",
    # Demonstratives & Classifier Forms
    "এই", "ওই", "সেই", "একটি", "দুটি", "কয়েকটি", "এটা", "ওটা", "সেটা",
    "যেটা", "এটি", "ওটি", "সেটি", "যেটি", "এগুলো", "ওগুলো", "সেগুলো",
    "যেগুলো",
    # Conjunctions & Connectives
    "এবং", "আর", "বা", "অথবা", "কিন্তু", "তবে", "কারণ", "যদি", "তাহলে",
    "যাতে", "যদিও", "তবু", "তবুও", "কিবা", "নচেৎ", "তথাপি", "কিংবা",
    "যেন", "সুতরাং", "তাই", "নাহলে", "নয়তো", "কেননা", "যেহেতু",
    "সেহেতু", "তারপর", "তারপরে",
    # Postpositions & Case Markers
    "কাছে", "থেকে", "হতে", "চেয়ে", "দ্বারা", "দিয়ে", "কর্তৃক",
    "সাথে", "সঙ্গে", "মাঝে", "মধ্যে", "উপরে", "নিচে", "পাশে", "সামনে",
    "পিছনে", "জন্য", "দিক", "দিকে", "ভিতরে", "বাইরে", "ছাড়া", "অবধি",
    "পর্যন্ত", "বিনা", "প্রতি", "কারণে", "মতো", "হিসেবে", "বিষয়ে",
    "সম্পর্কে",
    # Spatial Deictics
    "এখানে", "ওখানে", "সেখানে", "যেখানে", "কোথাও",
    # Temporal Adverbs
    "আজ", "কাল", "গতকাল", "আগামী", "এখন", "তখন", "কখনো", "যখন", "সদা",
    "সর্বদা", "আবার", "পরে", "আগে", "নিত্য", "প্রায়শই", "রোজ", "কখনও",
    "সাথে সাথে", "আজকাল", "এখনো", "এবার", "যতক্ষণ", "ততক্ষণ",
    "কোনোদিন", "প্রথমে", "শেষে", "আগের", "পরের",
    # Quantifiers & Indefinites
    "এক", "অনেক", "কিছু", "সব", "সবাই", "প্রত্যেক", "কোনো", "কেউ",
    "আরও", "অন্য", "সবকিছু", "কম", "বেশি", "যথেষ্ট", "পরিমাণ", "কয়েক",
    "মোট", "একটু", "যত", "তত", "কাউকে", "কারও",
    # Manner, Degree & Discourse Adverbs
    "এরূপ", "ওরূপ", "যেমন", "তেমন", "এমন", "সত্যি", "আসলে", "বাস্তবে",
    "নেহাত", "খুব", "অত্যন্ত", "প্রায়", "শুধু", "কেবল", "মাত্র",
    "এমনকি", "নিশ্চয়", "বটে", "হয়তো", "বোধহয়", "ঠিক", "ভাবে", "রকম",
    # Auxiliary, Copular & Modal Verbs
    "হয়", "হচ্ছে", "হবে", "হয়েছে", "হয়েছিল", "হল", "হত", "হোক",
    "হচ্ছিল", "আছে", "আছি", "ছিল", "ছিলাম", "থাকবে", "থাক", "থাকে",
    "করো", "করছে", "করবে", "করেছে", "করেছিল", "করি", "করলাম", "করব",
    "করা", "করতে", "পারেন", "পারে",
    # Conjunctive Participles
    "ধরে", "নিয়ে", "করে", "হয়ে", "গিয়ে", "বলে",
    # Negation
    "না", "নি", "নেই", "নয়", "নন", "নও", "নই", "হয়নি", "করিনি",
]


# 3. Category of every romanised stop word

stopword_categories = {
    "First-Person Pronouns": [
        "ami", "amra", "amake", "amader", "amar", "amay", "amadigoke",
        "amaderke",
    ],
    "Second-Person Pronouns": [
        "tumi", "tomra", "tomake", "tomader", "tomar", "tomay",
        "tomadigoke", "tomaderke", "tui", "tora", "toke", "toder",
        "tor", "toderke", "apni", "apnara", "apnake", "apnader",
        "apnar", "apnadigoke", "apnaderke",
    ],
    "Third-Person Pronouns": [
        "se", "tara", "take", "tader", "tar", "tahar", "tahake",
        "tahader", "taderke", "tini", "tanra", "tanke", "tander",
        "tanr", "tanderke",
    ],
    "Proximal & Distal Pronouns": [
        "era", "eke", "eder", "er", "iha", "ihar", "ihake", "ihader",
        "ederke", "ini", "enra", "enke", "ender", "enr", "enderke",
        "o", "ora", "oke", "oder", "or", "uha", "uhar", "uhake",
        "uhader", "oderke", "uni", "unra", "unke", "under", "unr",
        "underke",
    ],
    "Relative Pronouns": [
        "je", "jara", "jake", "jader", "jar", "jaha", "jahar",
        "jahake", "jahader", "jaderke", "jini", "janra", "janke",
        "jander", "janr", "janderke",
    ],
    "Interrogatives": [
        "ki", "kee", "ke", "kara", "kake", "kader", "kar", "kaderke",
        "keno", "kobe", "kothay", "kibhabe", "koto", "kon", "konti",
        "kamne", "koy", "kemon", "konta",
    ],
    "Reflexive, Reciprocal & Emphatic Forms": [
        "nijer", "nije", "nijeder", "aposh", "apnio", "tumio", "amio",
    ],
    "Demonstratives & Classifier Forms": [
        "ei", "oi", "sei", "ekti", "duti", "koyekti", "eta", "ota",
        "seta", "jeta", "eti", "oti", "seti", "jeti", "egulo", "ogulo",
        "segulo", "jegulo",
    ],
    "Conjunctions & Connectives": [
        "ebong", "ar", "ba", "athaba", "kintu", "tobe", "karon",
        "jodi", "tahole", "jate", "jodio", "tobu", "tobuo", "kiba",
        "noba", "nocheth", "tathapi", "kimbha", "jeno", "sutorang",
        "tai", "nahole", "noyto", "kenona", "jehetu", "sehetu",
        "tarpor", "tarpore",
    ],
    "Postpositions & Case Markers": [
        "kachhe", "theke", "hote", "cheye", "dara", "diye", "kortrik",
        "sathe", "sange", "majhe", "modhye", "upore", "niche", "pashe",
        "samne", "pichhone", "jonno", "dik", "dike", "bhitore",
        "baire", "chhara", "obdhi", "porjonto", "bina", "proti",
        "karone", "moto", "hishebe", "bishoye", "shomporke",
    ],
    "Spatial Deictics": [
        "ekhane", "okhane", "sekhane", "jekhane", "kothao",
    ],
    "Temporal Adverbs": [
        "aaj", "kal", "gotokal", "agami", "ekhon", "tokhon", "kokhono",
        "jokhon", "sada", "sorboda", "abar", "pore", "age", "nityo",
        "praishoy", "roj", "kakhono", "sathe sathe", "ajkal", "ekhono",
        "ebar", "jotokhon", "totokhon", "konodin", "prothome", "shese",
        "ager", "porer",
    ],
    "Quantifiers & Indefinites": [
        "ek", "anek", "kichu", "sob", "shobai", "protyek", "kono",
        "keu", "aro", "onno", "onnya", "sobkichu", "kom", "beshi",
        "jothto", "poriman", "koyek", "mot", "ektu", "jothesto",
        "joto", "toto", "kauke", "karo",
    ],
    "Manner, Degree & Discourse Adverbs": [
        "erup", "orup", "jemon", "temon", "emon", "sotti", "asole",
        "bastobe", "nihat", "khub", "otyoonto", "pray", "sudhu",
        "kebal", "matro", "emonki", "nischoy", "botey", "hoyto",
        "bodhoy", "thik", "bhabe", "rokom",
    ],
    "Auxiliary, Copular & Modal Verbs": [
        "hoy", "hocche", "hobe", "hoyechhe", "hoyechhilo", "holo",
        "hoto", "hok", "hochhilo", "achhe", "achhi", "chilo",
        "chhilam", "thakbe", "thak", "thake", "koro", "korchhe",
        "korbe", "korechhe", "korechhilo", "kori", "korlam", "korbo",
        "kora", "korte", "paren", "pare",
    ],
    "Conjunctive Participles": [
        "dhore", "niye", "kore", "hoye", "giye", "bole",
    ],
    "Negation": [
        "na", "ni", "nei", "noy", "non", "no", "noi", "hoyni",
        "korini",
    ],
}



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
_TOKEN = re.compile(r"[\u0980-\u09FFA-Za-z]+")


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
