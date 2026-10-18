"""Hazır soru türlerini ve filtreleri eşleştiren veri asistanı."""
import calendar
from collections import Counter
from datetime import date
from pathlib import Path
import re
import unicodedata

import duckdb
from backend.question_language import query_patterns

REASONS = {"Retirement": "Retirement", "Resignation": "Resignation", "Layoff": "Layoff"}
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

    text = query_patterns(text, [normalize(value) for value in departments + cities])
    if any(word in text for word in ["tahmin", "ayrilacak", "ayrilabilir", "gelecek", "maas", "memnuniyet", "performans"]):
        return clarify("I can query historical departure records. Predictions, salary, and performance information are not available in this dataset.")
    if any(word in text for word in ["oran", "yuzde", "olasilik", "aktif", "calismaya devam", "ayrilmayan", "ayrilmadi", "kadin", "erkek", "cinsiyet"]):
        return clarify("I currently support recorded departure counts and lists. Percentage and gender analyses are available on the Comparisons page.")


    department = entity_matches(text, departments)
    city = entity_matches(text, cities)
    if len(department) > 1 or len(city) > 1:
        return clarify("I found more than one city or department. Please select one city and one department per question.")

    locative_names = re.findall(r"(?<![a-z])([a-z]+)[’'](?:da|de|dan|den)(?![a-z])", text)
    known_names = [normalize(value).split()[-1] for value in cities + departments]
    if any(value not in known_names and value not in ["merkez", "ofis"] for value in locative_names):
        return clarify("I could not match that location or group. Please check the city or department name.")
    unknown_city = re.search(r"([a-z]+)\s+sehr", text)
    if unknown_city and not city:
        return clarify("I could not find that city in the dataset. Please use a city name from the records.")

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
        return clarify("The dataset covers 2006–2015. Please choose a period within that range.")

    year_range = re.search(r"(\d{4})\s*[-–]\s*(\d{4})|(?P<first>\d{4}).*?(?P<last>\d{4})\s+yillari arasi", year_text)
    if year_range and not re.search(r"\d{4}-\d{2}-\d{2}", year_text):
        first = int(year_range[1] or year_range["first"])
        last = int(year_range[2] or year_range["last"])
        if first > last:
            return clarify("The start year must not be after the end year.")
        if not "karsilastir" in text:
            years = list(range(first, last + 1))

    reason_filters = []
    for reason, keywords in [("Resignation", ["istifa", "resignation", "resignaton"]), ("Retirement", ["emekli", "retirement"]), ("Layoff", ["isten cikar", "layoff", "gonulsuz"])]:
        if any(word in text for word in keywords):
            reason_filters.append(reason)
    if len(reason_filters) > 1:
        return clarify("I found more than one departure reason. Select one reason, or ask 'Show departure reasons'.")
    reason = reason_filters[0] if reason_filters else None

    month_positions = [(match.start(), index + 1) for index, month in enumerate(MONTHS) if (match := re.search(r"(?<![a-z])" + month + r"(?![a-z])", text))]
    months = [month for _, month in sorted(month_positions)]
    if months and (len(months) > 2 or months[0] > months[-1]):
        return clarify("Specify one month or two months in chronological order within a single year, for example January–March 2014.")
    start = end = None
    try:
        # Farklı tarih biçimleri kullanılsa da sorudaki sıralamayı koruyoruz.
        date_tokens = re.finditer(r"(?<!\d)(\d{4}-\d{2}-\d{2}|\d{1,2}[./]\d{1,2}[./]\d{4})(?!\d)", text)
        dates = []
        for token in date_tokens:
            value = token[0]
            if "-" in value:
                dates.append(date.fromisoformat(value))
            else:
                day, month, year = re.split(r"[./]", value)
                dates.append(date(int(year), int(month), int(day)))
        if dates:
            if len(dates) > 2:
                return clarify("Specify at most two dates, for example: How many employees left between 2014-01-01 and 2014-03-31?")
            start, end = dates[0], dates[-1]
        elif months:
            if len(years) != 1:
                return clarify("Specify one year for a month filter, for example: How many employees left between January and March 2014?")
            ordered_months = sorted(months)
            if len(months) > 1 and not any(word in text for word in ["arasi", "ile", "-", "–"]):
                return clarify("Do you mean a month range? For example: How many employees left between January and March 2014?")
            start = date(years[0], ordered_months[0], 1)
            end_month = ordered_months[-1]
            end = date(years[0], end_month, calendar.monthrange(years[0], end_month)[1])
        if start and (start > end or start.year < 2006 or end.year > 2015):
            return clarify("Check the date range. The start must not be after the end, and both dates must be within 2006–2015.")
    except ValueError:
        return clarify("Use valid dates, for example 2014-01-01 to 2014-03-31. Numeric dates can also use DD.MM.YYYY or DD/MM/YYYY.")
    if not dates and any(word in text for word in ["bugun", "dun", "gecen ay", "son ay", "bu ay"]):
        return clarify("The data ends in 2015. Specify a year or an exact date range instead of a relative date.")

    tenure = re.search(r"(?:ilk|en fazla)\s+(bir|iki|uc|\d+)\s+yil", text)
    tenure_max = None
    first_years = bool(tenure and tenure[0].startswith("ilk"))
    if tenure:
        values = {"bir": 1, "iki": 2, "uc": 3}
        tenure_max = values.get(tenure[1], int(tenure[1]) if tenure[1].isdigit() else 0)
    elif "kidem" in text:
        return clarify("For tenure filters, try 'List employees who resigned in their first two years' or 'List departures with at most 5 years of service'.")

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
        return clarify("What should I rank: departments, stores, cities, or departure reasons?")
    if comparison and not grouping:
        return clarify("Specify two years to compare, or ask 'Compare departments by departures'.")
    if "departman" in text and not department and grouping != "department" and not any(word in text for word in ["bilgi", "getir", "liste", "goster", "kim"]):
        return clarify("Specify a department name from the data, or ask 'Show departure counts by department'.")
    if "magaza" in text and store is None and grouping != "store" and not any(word in text for word in ["bilgi", "getir", "liste", "kim"]):
        return clarify("Specify a store number, or ask 'Show departures by store'.")
    if "sehir" in text and not city and grouping != "city" and not any(word in text for word in ["bilgi", "getir", "liste", "kim"]):
        return clarify("Specify a city name, or ask 'Show departures by city'.")
    # Adı verilen fakat veride bulunmayan bir grubu filtresiz sorguya çevirmiyoruz.
    unknown_department = re.search(r"([a-z]+)\s+departman", text)
    if unknown_department and not department and unknown_department[1] not in ["hangi", "cok", "fazla", "bes", "uc", "on", "tum", "butun", "bazinda", "the", "all", "of"]:
        return clarify("I could not match that department. Please use its name as shown in the dataset.")

    count_question = any(word in text for word in ["kac", "sayisi", "sayilari", "toplam"])
    list_question = any(word in text for word in ["liste", "getir", "kim", "bilgi", "goster"])
    departure_topic = any(word in text for word in ["ayril", "istifa", "emekli", "isten cikar", "layoff"]) or employee is not None
    if not departure_topic or not (count_question or list_question or ranking or comparison or grouping):
        return clarify("Try one of these patterns: 'How many employees left in 2014?', 'List resignations from the Meats department in 2015', or 'Show the top five departments by resignations'.")

    head_office = "merkez ofis" in text or "headoffice" in text
    if head_office and store is not None:
        return clarify("Head office and a store filter cannot be combined. Please choose one.")
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
        if tenure_max is not None:
            if service is None: continue
            if first_years and service >= tenure_max: continue
            if not first_years and service > tenure_max: continue
        if grouping == "store" and unit != "STORES": continue
        selected.append(row)

    filters = []
    if start: filters.append(f"{start:%Y-%m-%d} – {end:%Y-%m-%d}")
    elif years: filters.append(", ".join(str(year) for year in years))
    else: filters.append("2006–2015")
    if department: filters.append(department[0])
    if city: filters.append(city[0])
    if store is not None: filters.append(f"Store {store}")
    if head_office: filters.append("Head office")
    if employee is not None: filters.append(f"Employee {employee}")
    if reason: filters.append(REASONS[reason])
    if tenure_max is not None:
        filters.append(f"Tenure under {tenure_max} completed years" if first_years else f"Tenure at most {tenure_max} completed years")
    result = {"supported": True, "source": "DuckDB · Actual departure date · Unique employees", "filters": filters, "count": len({row[0] for row in selected})}
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
        labels = {"department": "Department", "store": "Store ID", "city": "City", "reason": "Reason", "year": "Year"}
        result.update(answer=f"Departure counts by {labels[grouping].lower()} for the selected filters are shown below.", columns=[labels[grouping], "Employees who left"], rows=[[REASONS.get(key, key), count] for key, count in pairs])
        if grouping == "store": result["source"] += " · STORES only; head office excluded"
    elif list_question and not count_question or employee is not None:
        result.update(answer=f"Found {result['count']:,} departure records matching your filters.", columns=["Employee ID", "Departure date", "Reason", "Department", "Store / unit", "City", "Tenure (years)"], rows=[[row[0], row[1].isoformat(), REASONS.get(row[2], row[2]), row[3], f"Store {row[4]}" if row[6] == "STORES" else "Head office", row[5], row[7]] for row in selected])
    else:
        result["answer"] = f"{result['count']:,} employees left under the selected conditions."
    if not selected:
        result["answer"] = "No departure records match these filters. This does not establish whether an employee was ever employed."
    return result
