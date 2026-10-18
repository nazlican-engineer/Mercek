"""İngilizce soru ifadelerini mevcut sorgu kalıplarına eşliyoruz."""
import re


def query_patterns(text, entity_names):
    # Departman ve şehir adlarının içindeki kelimeleri çevirmiyoruz.
    protected = {}
    for index, name in enumerate(sorted(set(entity_names), key=len, reverse=True)):
        marker = f"zzentity{index}zz"
        pattern = r"(?<![a-z])" + re.escape(name) + r"(?![a-z])"
        if re.search(pattern, text):
            text = re.sub(pattern, marker, text)
            protected[marker] = name

    # İngilizcedeki employee 3008 biçimini de açık kimlik filtresine çeviriyoruz.
    text = re.sub(r"\bemployee\s+(?:id\s*[:#]?\s*)?(\d+)", r"calisan no \1", text)
    replacements = [
        (r"have not left|has not left|did not leave|not resigned|did not resign|have not resigned", "aktif"),
        (r"how many", "kac"),
        (r"number of|count of|total number of", "toplam sayisi"),
        (r"no more than|at most|up to", "en fazla"),
        (r"first", "ilk"),
        (r"most|top", "en cok"),
        (r"length of service|years of service", "kidem"),
        (r"head[ -]office", "merkez ofis"),
        (r"which employees|who", "kimler"),
        (r"compare|comparison", "karsilastir"),
        (r"show|display", "goster"),
        (r"list", "listele"),
        (r"get|give|bring", "getir"),
        (r"information|details|record", "bilgi"),
        (r"records", "bilgiler"),
        (r"employees?", "calisan"),
        (r"departments?", "departman"),
        (r"stores?", "magaza"),
        (r"cities|city", "sehir"),
        (r"resignations?|resigned|resign", "istifa"),
        (r"retirements?|retired|retire", "emekli"),
        (r"laid off|layoffs?|dismissed", "isten cikar"),
        (r"departures?|left|leaving", "ayrilan"),
        (r"reasons?|why", "sebep"),
        (r"tenure", "kidem"),
        (r"total|count", "toplam"),
        (r"across|by|per", "bazinda"),
        (r"between", "arasi"),
        (r"and|to", "ile"),
        (r"years?", "yil"),
        (r"one", "bir"), (r"two", "iki"), (r"three", "uc"),
        (r"five", "bes"), (r"ten", "on"),
        (r"january|jan", "ocak"), (r"february|feb", "subat"),
        (r"march|mar", "mart"), (r"april|apr", "nisan"),
        (r"may", "mayis"), (r"june|jun", "haziran"),
        (r"july|jul", "temmuz"), (r"august|aug", "agustos"),
        (r"september|sep|sept", "eylul"), (r"october|oct", "ekim"),
        (r"november|nov", "kasim"), (r"december|dec", "aralik"),
        (r"predictions?|predict", "tahmin"), (r"future|next", "gelecek"),
        (r"salar(?:y|ies)", "maas"), (r"performance", "performans"),
        (r"satisfaction", "memnuniyet"), (r"percentages?|rates?|probabilit(?:y|ies)|risk", "oran"),
        (r"active|still employed|still working|did not leave|have not left", "aktif"),
        (r"female|women|woman", "kadin"), (r"male|men|man", "erkek"),
        (r"today", "bugun"), (r"yesterday", "dun"),
        (r"last month", "gecen ay"), (r"this month", "bu ay"),
    ]
    for pattern, replacement in replacements:
        text = re.sub(r"\b(?:" + pattern + r")\b", replacement, text)
    for marker, name in protected.items():
        text = text.replace(marker, name)
    return text
