from fastapi import FastAPI, HTTPException, Query
from datetime import date
from pathlib import Path
from fastapi.middleware.cors import CORSMiddleware
import duckdb
from backend.assistant import answer_question

# API uygulamasını oluşturuyoruz.
app = FastAPI(title="Mercek", description="Historical employee departure analytics using synthetic records from 2006–2015.")
# React arayüzünün API'ye erişmesine izin veriyoruz.
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://127.0.0.1:5173"
    ],
    allow_methods=["GET"],
    allow_headers=["*"]
)

# API'nin çalışıp çalışmadığını kontrol ediyoruz.
@app.get("/")
def home():
    return {"mesaj": "Mercek API is running"}

# Veritabanının konumunu belirliyoruz.
DB_PATH = (
    Path(__file__).resolve().parent.parent
    / "data/processed/warehouse.duckdb"
)


# Veri setindeki benzersiz çalışan sayısını getiriyoruz.
@app.get("/api/employee-count")
def employee_count():
    con = duckdb.connect(str(DB_PATH), read_only=True)

    try:
        result = con.execute("""
            SELECT COUNT(DISTINCT employee_id)
            FROM dim_employee
        """).fetchone()

        return {"toplam_calisan": result[0]}
    finally:
        con.close()

# Veri setinde ayrılma kaydı bulunan farklı çalışanları sayıyoruz.
@app.get("/api/departure-count")
def departure_count():
    con = duckdb.connect(str(DB_PATH), read_only=True)

    try:
        result = con.execute("""
            SELECT COUNT(DISTINCT employee_key)
            FROM fact_employee_year
            WHERE left_flag = 1
        """).fetchone()

        return {"ayrilan_calisan": result[0]}
    finally:
        con.close()

# Her yılın benzersiz çalışanlarını ve gerçek ayrılmalarını birlikte getiriyoruz.
@app.get("/api/by-year")
def departures_by_year():
    con = duckdb.connect(str(DB_PATH), read_only=True)

    try:
        rows = con.execute("""
            WITH employees AS (
                SELECT status_year AS year,
                    COUNT(DISTINCT employee_key) AS total
                FROM fact_employee_year
                GROUP BY status_year
            ), departures AS (
                SELECT YEAR(termination_date) AS year,
                    COUNT(DISTINCT employee_key) AS total
                FROM fact_employee_year
                WHERE left_flag = 1
                GROUP BY YEAR(termination_date)
            )
            SELECT e.year, e.total, COALESCE(d.total, 0),
                ROUND(100.0 * COALESCE(d.total, 0) / e.total, 2)
            FROM employees AS e
            LEFT JOIN departures AS d ON e.year = d.year
            ORDER BY e.year
        """).fetchall()

        results = []
        for row in rows:
            results.append({
                "yil": row[0],
                "toplam_calisan": row[1],
                "ayrilan_calisan": row[2],
                "ayrilma_yuzdesi": row[3],
            })

        return results
    finally:
        con.close()

# Ayrılan çalışanları kayıtlı ayrılma sebeplerine göre sayıyoruz.
@app.get("/api/by-reason")
def departures_by_reason():
    con = duckdb.connect(str(DB_PATH), read_only=True)

    try:
        rows = con.execute("""
            SELECT
                t.termination_reason,
                COUNT(*) AS ayrilan_calisan
            FROM fact_employee_year AS f
            JOIN dim_termination AS t
                ON f.termination_key = t.termination_key
            WHERE f.left_flag = 1
            GROUP BY t.termination_reason
            ORDER BY ayrilan_calisan DESC
        """).fetchall()

        results = []
        for row in rows:
            results.append({
                "sebep": row[0],
                "ayrilan_calisan": row[1]
            })

        return results
    finally:
        con.close()

# Ayrılan çalışanları departmanlarına göre sayıyoruz.
@app.get("/api/by-department")
def departures_by_department():
    con = duckdb.connect(str(DB_PATH), read_only=True)

    try:
        rows = con.execute("""
            SELECT
                d.department_name,
                COUNT(*) AS ayrilan_calisan
            FROM fact_employee_year AS f
            JOIN dim_department AS d
                ON f.department_key = d.department_key
            WHERE f.left_flag = 1
            GROUP BY d.department_name
            ORDER BY ayrilan_calisan DESC, d.department_name
        """).fetchall()

        results = []
        for row in rows:
            results.append({
                "departman": row[0],
                "ayrilan_calisan": row[1]
            })

        return results
    finally:
        con.close()

# İstenen yılda ayrılan çalışanları listeliyoruz.
@app.get("/api/departures")
def departures(
    year: int | None = Query(None, ge=2006, le=2015),
    department: str | None = None,
    store: int | None = None,
    city: str | None = None,
    reason: str | None = None,
    start_date: date | None = None,
    end_date: date | None = None,
):
    if start_date and end_date and start_date > end_date:
        raise HTTPException(status_code=422, detail="The start date must not be after the end date.")

    # Filtre değerlerini SQL metnine eklemiyoruz; parametre olarak gönderiyoruz.
    conditions = ["f.left_flag = 1"]
    parameters = []
    filters = [
        (year, "YEAR(f.termination_date) = ?"),
        (department, "d.department_name = ?"),
        (store, "s.store_code = ? AND s.business_unit = 'STORES'"),
        (city, "s.city_name = ?"),
        (reason, "t.termination_reason = ?"),
        (start_date, "f.termination_date >= ?"),
        (end_date, "f.termination_date <= ?"),
    ]
    for value, condition in filters:
        if value is not None:
            conditions.append(condition)
            parameters.append(value)

    con = duckdb.connect(str(DB_PATH), read_only=True)

    try:
        rows = con.execute("""
            SELECT
                e.employee_id,
                f.termination_date,
                t.termination_reason,
                d.department_name,
                j.job_title,
                s.store_code,
                s.city_name,
                s.business_unit,
                f.length_of_service
            FROM fact_employee_year AS f
            JOIN dim_employee AS e
                ON f.employee_key = e.employee_key
            JOIN dim_termination AS t
                ON f.termination_key = t.termination_key
            JOIN dim_department AS d ON f.department_key = d.department_key
            JOIN dim_job AS j ON f.job_key = j.job_key
            JOIN dim_store AS s ON f.store_key = s.store_key
            WHERE """ + " AND ".join(conditions) + """
            ORDER BY f.termination_date, e.employee_id
        """, parameters).fetchall()

        results = []
        for row in rows:
            results.append({
                "calisan_no": row[0],
                "ayrilma_tarihi": row[1],
                "sebep": row[2],
                "departman": row[3],
                "gorev": row[4],
                "magaza_no": row[5],
                "sehir": row[6],
                "is_birimi": row[7],
                "kidem": row[8],
            })

        return results
    finally:
        con.close()

# Yalnızca mağaza birimindeki ayrılmaları mağazalara göre sayıyoruz.
@app.get("/api/by-store")
def departures_by_store():
    con = duckdb.connect(str(DB_PATH), read_only=True)

    try:
        rows = con.execute("""
            SELECT
                s.store_code,
                COUNT(*) AS ayrilan_calisan
            FROM fact_employee_year AS f
            JOIN dim_store AS s
                ON f.store_key = s.store_key
            WHERE f.left_flag = 1
              AND s.business_unit = 'STORES'
            GROUP BY s.store_code
            ORDER BY ayrilan_calisan DESC, s.store_code
        """).fetchall()

        results = []
        for row in rows:
            results.append({
                "magaza_no": row[0],
                "ayrilan_calisan": row[1]
            })

        return results
    finally:
        con.close()


# Ana sayfadaki sayılar yalnızca veri dönemi için hesaplanıyor.
@app.get("/api/summary")
def summary():
    con = duckdb.connect(str(DB_PATH), read_only=True)
    try:
        row = con.execute("""
            SELECT COUNT(DISTINCT employee_key),
                COUNT(DISTINCT CASE WHEN left_flag = 1 THEN employee_key END),
                MIN(status_year), MAX(status_year)
            FROM fact_employee_year
        """).fetchone()
        return {"toplam_calisan": row[0], "ayrilan_calisan": row[1],
                "ayrilma_kaydi_olmayan": row[0] - row[1],
                "ilk_yil": row[2], "son_yil": row[3],
                "ayrilma_yuzdesi": round(100 * row[1] / row[0], 2)}
    finally:
        con.close()


# Açılır listeler için veride bulunan seçenekleri getiriyoruz.
@app.get("/api/filters")
def filter_options():
    con = duckdb.connect(str(DB_PATH), read_only=True)
    try:
        departments = con.execute("SELECT department_name FROM dim_department ORDER BY department_name").fetchall()
        stores = con.execute("""
            SELECT DISTINCT store_code, city_name FROM dim_store
            WHERE business_unit = 'STORES' ORDER BY store_code
        """).fetchall()
        cities = con.execute("SELECT DISTINCT city_name FROM dim_store ORDER BY city_name").fetchall()
        return {"yillar": list(range(2006, 2016)),
                "departmanlar": [row[0] for row in departments],
                "sehirler": [row[0] for row in cities],
                "magazalar": [{"kod": row[0], "sehir": row[1]} for row in stores]}
    finally:
        con.close()


# Grupları her çalışanın dönemdeki son kaydına göre karşılaştırıyoruz.
@app.get("/api/breakdown")
def breakdown(
    group_by: str = "department",
    year: int | None = Query(None, ge=2006, le=2015),
):
    groups = {
        "department": "d.department_name",
        "store": "'Store ' || CAST(s.store_code AS VARCHAR) || ' · ' || s.city_name",
        "city": "s.city_name",
        "gender": "CASE WHEN e.gender_code = 1 THEN 'Male' WHEN e.gender_code = 2 THEN 'Female' ELSE 'Unspecified' END",
        "tenure": "CASE WHEN f.length_of_service <= 2 THEN '0–2 years' WHEN f.length_of_service <= 5 THEN '3–5 years' WHEN f.length_of_service <= 10 THEN '6–10 years' WHEN f.length_of_service <= 15 THEN '11–15 years' ELSE '16+ years' END",
    }
    if group_by not in groups:
        raise HTTPException(status_code=422, detail="Invalid comparison group.")

    period_filter = "WHERE status_year = ?" if year is not None else ""
    store_filter = "WHERE s.business_unit = 'STORES'" if group_by == "store" else ""
    con = duckdb.connect(str(DB_PATH), read_only=True)
    try:
        rows = con.execute("""
            WITH latest AS (
                SELECT * FROM fact_employee_year
                """ + period_filter + """
                QUALIFY ROW_NUMBER() OVER (
                    PARTITION BY employee_key
                    ORDER BY status_year DESC, left_flag DESC, record_date DESC
                ) = 1
            )
            SELECT """ + groups[group_by] + """ AS label,
                COUNT(*) AS total, SUM(f.left_flag) AS departures,
                ROUND(100.0 * SUM(f.left_flag) / COUNT(*), 2) AS rate
            FROM latest AS f
            JOIN dim_employee AS e ON f.employee_key = e.employee_key
            JOIN dim_department AS d ON f.department_key = d.department_key
            JOIN dim_store AS s ON f.store_key = s.store_key
            """ + store_filter + """
            GROUP BY label ORDER BY departures DESC, label
        """, [year] if year is not None else []).fetchall()
        return [{"grup": row[0], "toplam_calisan": row[1],
                 "ayrilan_calisan": row[2], "ayrilma_yuzdesi": row[3]} for row in rows]
    finally:
        con.close()


# Hazır soru türlerini ve verideki filtreleri eşleştiriyoruz.
@app.get("/api/assistant")
def assistant(question: str = Query(..., min_length=1, max_length=300)):
    return answer_question(question, DB_PATH)
