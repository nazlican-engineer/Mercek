"""Hazır soru türlerini ve filtreleri eşleştiren veri asistanı."""
import calendar
from collections import Counter
from datetime import date
from pathlib import Path
import re
import unicodedata

import duckdb

REASONS = {"Retirement": "Emeklilik", "Resignation": "İstifa", "Layoff": "İşten çıkarılma"}
MONTHS = ["ocak", "subat", "mart", "nisan", "mayis", "haziran", "temmuz", "agustos", "eylul", "ekim", "kasim", "aralik"]


def normalize(text):
    text = text.casefold().replace("ı", "i")
    return "".join(char for char in unicodedata.normalize("NFKD", text) if not unicodedata.combining(char))


def clarify(message):
    return {"supported": False, "answer": message}


def entity_matches(text, values):
    # Tam şehir/departman adını arıyoruz; benzer adları birleştirmiyoruz.
    matches = [value for value in values if re.search(r"(?<![a-z])" + re.escape(normalize(value)) + r"(?![a-z])", text)]
    return [value for value in matches if not any(value != other and normalize(value) in normalize(other) for other in matches)]


def answer_question(question: str, db_path: Path):
    text = normalize(question)
    if any(word in text for word in ["tahmin", "ayrilacak", "ayrilabilir", "gelecek", "maas", "memnuniyet", "performans"]):
        return clarify("Geçmiş ayrılma kayıtlarını sorgulayabilirim. Tahmin, maaş veya performans bilgisi bu veride yok.")
    if any(word in text for word in ["oran", "yuzde", "olasilik", "aktif", "calismaya devam", "ayrilmayan", "ayrilmadi", "kadin", "erkek", "cinsiyet"]):
        return clarify("Asistan şu anda gerçekleşen ayrılma sayıları ve listelerini getiriyor. Oranlar için Karşılaştırmalar sayfasını kullanabilirsin.")

    con = duckdb.connect(str(db_path), read_only=True)
    try:
        departments = [row[0] for row in con.execute("SELECT department_name FROM dim_department").fetchall()]
        cities = [row[0] for row in con.execute("SELECT DISTINCT city_name FROM dim_store").fetchall()]
        rows = con.execute("""
            SELECT e.employee_id, f.termination_date, t.termination_reason,
                d.department_name, s.store_code, s.city_name, s.business_unit,
                f.length_of_service
            FROM fact_employee_year f
            JOIN dim_employee e ON f.employee_key = e.employee_key
            JOIN dim_termination t ON f.termination_key = t.termination_key
            JOIN dim_department d ON f.department_key = d.department_key
            JOIN dim_store s ON f.store_key = s.store_key
            WHERE f.left_flag = 1
            ORDER BY f.termination_date, e.employee_id
        """).fetchall()
    finally:
        con.close()

    department = entity_matches(text, departments)
    city = entity_matches(text, cities)
    if len(department) > 1 or len(city) > 1:
        return clarify("Birden fazla şehir veya departman görüyorum. Şimdilik her soruda bir şehir ve bir departman seçebilir misin?")

    locative_names = re.findall(r"(?<![a-z])([a-z]+)[’'](?:da|de|dan|den)(?![a-z])", text)
    known_names = [normalize(value).split()[-1] for value in cities + departments]
    if any(value not in known_names and value not in ["merkez", "ofis"] for value in locative_names):
        return clarify("Yer veya grup adını veride eşleştiremedim. Şehir ve departman adını kontrol edebilir misin?")
    unknown_city = re.search(r"([a-z]+)\s+sehr", text)
    if unknown_city and not city:
        return clarify("Bu şehir adını veride eşleştiremedim. Kayıtlı şehir adlarından birini kullanabilir misin?")

    employee_match = re.search(r"(?<!\d)(\d+)\s*(?:numarali\s+)?calisan", text)
    if not employee_match:
        employee_match = re.search(r"(?:calisan\s*(?:no|numarasi|id)|employeeid)\s*[:#]?\s*(\d+)", text)
    employee = int(employee_match[1]) if employee_match else None
    store_match = re.search(r"(?<!\d)(\d+)\s*(?:numarali\s+)?magaza", text)
    if not store_match:
        store_match = re.search(r"magaza(?:\s*(?:no|numarasi))?\s*[:#]?\s*(\d+)", text)
    store = int(store_match[1]) if store_match else None

    # Çalışan/mağaza numarasını yanlışlıkla yıl saymıyoruz.
    year_text = text
    for match in [employee_match, store_match]:
        if match:
            year_text = year_text[:match.start()] + " " * (match.end() - match.start()) + year_text[match.end():]
    years = sorted(set(int(value) for value in re.findall(r"(?<!\d)(\d{4})(?!\d)", year_text)))
    if any(year < 2006 or year > 2015 for year in years):
        return clarify("Veri seti 2006–2015 yıllarını kapsıyor. Bu aralıktan bir dönem seçebilir misin?")

    if len(years) == 2 and not any(word in text for word in ["karsilastir"]) and re.search(r"\d{4}\s*[-–]\s*\d{4}|yillari arasi", text):
        years = list(range(years[0], years[-1] + 1))

    reason_filters = []
    for reason, keywords in [("Resignation", ["istifa", "resignation", "resignaton"]), ("Retirement", ["emekli", "retirement"]), ("Layoff", ["isten cikar", "layoff", "gonulsuz"])]:
        if any(word in text for word in keywords):
            reason_filters.append(reason)
    if len(reason_filters) > 1:
        return clarify("Birden fazla ayrılma sebebi görüyorum. Tek sebep seç veya 'ayrılma sebeplerini göster' diye sor.")
    reason = reason_filters[0] if reason_filters else None

    month_positions = [(match.start(), index + 1) for index, month in enumerate(MONTHS) if (match := re.search(r"(?<![a-z])" + month + r"(?![a-z])", text))]
    months = [month for _, month in sorted(month_positions)]
    if months and (len(months) > 2 or months[0] > months[-1]):
        return clarify("Tek ay veya aynı yıl içinde sıralı iki ay belirt: örneğin Ocak–Mart 2014.")
    start = end = None
    iso_dates = re.findall(r"(?<!\d)(\d{4}-\d{2}-\d{2})(?!\d)", text)
    local_dates = re.findall(r"(?<!\d)(\d{1,2})[./](\d{1,2})[./](\d{4})(?!\d)", text)
    try:
        dates = [date.fromisoformat(value) for value in iso_dates] + [date(int(y), int(m), int(d)) for d, m, y in local_dates]
        if dates:
            if len(dates) > 2:
                return clarify("En fazla iki tarih belirt: örneğin 01.01.2014 ile 31.03.2014 arasında kaç kişi ayrıldı?")
            start, end = dates[0], dates[-1]
        elif months:
            if len(years) != 1:
                return clarify("Ay filtresi için tek bir yıl belirt: örneğin Ocak–Mart 2014 arasında kaç kişi ayrıldı?")
            ordered_months = sorted(months)
            if len(months) > 1 and not any(word in text for word in ["arasi", "ile", "-", "–"]):
                return clarify("Bir ay aralığı mı istiyorsun? Örneğin: Ocak–Mart 2014 arasında kaç kişi ayrıldı?")
            start = date(years[0], ordered_months[0], 1)
            end_month = ordered_months[-1]
            end = date(years[0], end_month, calendar.monthrange(years[0], end_month)[1])
        if start and (start > end or start.year < 2006 or end.year > 2015):
            return clarify("Tarih aralığını kontrol et. Başlangıç bitişten önce ve iki tarih de 2006–2015 içinde olmalı.")
    except ValueError:
        return clarify("Geçerli bir tarih kullan: örneğin 01.01.2014 ile 31.03.2014 arasında.")
    if not dates and any(word in text for word in ["bugun", "dun", "gecen ay", "son ay", "bu ay"]):
        return clarify("Veri 2015 sonunda bitiyor. Göreli tarih yerine yıl veya açık bir tarih aralığı belirt.")

    tenure = re.search(r"(?:ilk|en fazla)\s+(bir|iki|uc|\d+)\s+yil", text)
    tenure_max = None
    if tenure:
        values = {"bir": 1, "iki": 2, "uc": 3}
        tenure_max = values.get(tenure[1], int(tenure[1]) if tenure[1].isdigit() else 0)
    elif "kidem" in text:
        return clarify("Kıdem filtresini 'ilk iki yılında istifa edenleri getir' veya 'en fazla 5 yıl çalışanları listele' şeklinde sorabilirsin.")

    ranking = "en cok" in text or "en fazla ayril" in text
    comparison = "karsilastir" in text
    grouping = None
    if any(word in text for word in ["sebep", "neden"] ) and not reason:
        grouping = "reason"
    if ranking or "bazinda" in text or comparison:
        if "departman" in text: grouping = "department"
        elif "magaza" in text: grouping = "store"
        elif "sehir" in text: grouping = "city"
        elif comparison and len(years) > 1: grouping = "year"
    if ranking and not grouping:
        return clarify("Neyi sıralayayım: departmanları, mağazaları, şehirleri veya ayrılma sebeplerini?")
    if comparison and not grouping:
        return clarify("Karşılaştırmak için iki yıl belirt veya 'departmanları karşılaştır' diye sor.")
    if "departman" in text and not department and grouping != "department" and not any(word in text for word in ["bilgi", "getir", "liste", "goster", "kim"]):
        return clarify("Departman adını verideki adıyla belirt veya 'departmanlara göre ayrılma sayılarını göster' diye sor.")
    if "magaza" in text and store is None and grouping != "store" and not any(word in text for word in ["bilgi", "getir", "liste", "kim"]):
        return clarify("Mağaza numarası belirt veya 'mağaza bazında ayrılmaları göster' diye sor.")
    if "sehir" in text and not city and grouping != "city" and not any(word in text for word in ["bilgi", "getir", "liste", "kim"]):
        return clarify("Şehir adını belirt veya 'şehir bazında ayrılmaları göster' diye sor.")
    # Adı verilen fakat veride bulunmayan bir grubu filtresiz sorguya çevirmiyoruz.
    unknown_department = re.search(r"([a-z]+)\s+departman", text)
    if unknown_department and not department and unknown_department[1] not in ["hangi", "cok", "fazla", "bes", "uc", "on", "tum", "butun"]:
        return clarify("Bu departman adını eşleştiremedim. Departman adını verideki adıyla yazabilir misin?")

    count_question = any(word in text for word in ["kac", "sayisi", "sayilari", "toplam"])
    list_question = any(word in text for word in ["liste", "getir", "kim", "bilgi", "goster"])
    departure_topic = any(word in text for word in ["ayril", "istifa", "emekli", "isten cikar", "layoff"]) or employee is not None
    if not departure_topic or not (count_question or list_question or ranking or comparison or grouping):
        return clarify("Sorunu şu örneklerden biri gibi yazabilir misin: '2014’te kaç kişi ayrıldı?', '2015’te Meats departmanından istifa edenleri listele', 'En çok istifa görülen beş departmanı göster'.")

    head_office = "merkez ofis" in text or "headoffice" in text
    if head_office and store is not None:
        return clarify("Merkez ofis ile mağaza filtresini aynı anda kullanamam. Birini seçebilir misin?")
    selected = []
    for row in rows:
        emp, exit_date, exit_reason, dept, store_no, city_name, unit, service = row
        if years and not start and exit_date.year not in years: continue
        if start and not start <= exit_date <= end: continue
        if reason and exit_reason != reason: continue
        if department and dept != department[0]: continue
        if city and city_name != city[0]: continue
        if store is not None and (store_no != store or unit != "STORES"): continue
        if head_office and unit != "HEADOFFICE": continue
        if employee is not None and emp != employee: continue
        if tenure_max is not None and (service is None or service > tenure_max): continue
        selected.append(row)

    filters = []
    if start: filters.append(f"{start:%d.%m.%Y} – {end:%d.%m.%Y}")
    elif years: filters.append(", ".join(str(year) for year in years))
    else: filters.append("2006–2015")
    if department: filters.append(department[0])
    if city: filters.append(city[0])
    if store is not None: filters.append(f"Mağaza {store}")
    if head_office: filters.append("Merkez ofis")
    if employee is not None: filters.append(f"Çalışan {employee}")
    if reason: filters.append(REASONS[reason])
    if tenure_max is not None: filters.append(f"Kıdem en fazla {tenure_max} yıl (tam yıl)")
    result = {"supported": True, "source": "DuckDB · Gerçek ayrılma tarihi · Benzersiz çalışan", "filters": filters, "count": len({row[0] for row in selected})}
    if len(years) == 1 and not any([reason, department, city, store is not None, employee is not None, head_office, start, tenure_max is not None, grouping]):
        result["year"] = years[0]
    if grouping:
        indices = {"department": 3, "store": 4, "city": 5, "reason": 2}
        counter = Counter()
        for row in selected:
            if grouping == "store" and row[6] != "STORES": continue
            key = row[1].year if grouping == "year" else row[indices[grouping]]
            counter[key] += 1
        if grouping == "reason":
            for key in REASONS: counter.setdefault(key, 0)
        if grouping == "year":
            for key in years: counter.setdefault(key, 0)
        pairs = sorted(counter.items(), key=lambda item: (item[0] if grouping == "year" else -item[1], str(item[0])))
        if ranking:
            limit_match = re.search(r"(?:ilk|en cok)?\s*(\d+|bes|uc|on)\s+(?:departman|magaza|sehir|sebep)", text)
            limit = {"bes": 5, "uc": 3, "on": 10}.get(limit_match[1], int(limit_match[1]) if limit_match and limit_match[1].isdigit() else 10) if limit_match else 10
            pairs = pairs[:max(1, min(limit, 100))]
        labels = {"department": "Departman", "store": "Mağaza no", "city": "Şehir", "reason": "Sebep", "year": "Yıl"}
        result.update(answer=f"Seçilen koşullara göre {labels[grouping].lower()} bazında ayrılma sayıları aşağıda.", columns=[labels[grouping], "Ayrılan çalışan"], rows=[[REASONS.get(key, key), count] for key, count in pairs])
        if grouping == "store": result["source"] += " · Yalnızca STORES; merkez ofis hariç"
    elif list_question and not count_question or employee is not None:
        result.update(answer=f"Seçilen koşullara uyan {result['count']} ayrılma kaydı bulundu.", columns=["Çalışan no", "Ayrılma tarihi", "Sebep", "Departman", "Mağaza / birim", "Şehir", "Kıdem (yıl)"], rows=[[row[0], row[1].isoformat(), REASONS.get(row[2], row[2]), row[3], f"Mağaza {row[4]}" if row[6] == "STORES" else "Merkez ofis", row[5], row[7]] for row in selected])
    else:
        result["answer"] = f"Seçilen koşullarda {result['count']} çalışan ayrıldı."
    if not selected:
        result["answer"] = "Bu koşullara uyan ayrılma kaydı bulunamadı. Bu, çalışanın hiç çalışmadığı anlamına gelmez."
    return result
