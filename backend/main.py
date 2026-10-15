from fastapi import FastAPI
from pathlib import Path
from fastapi.middleware.cors import CORSMiddleware
import duckdb

# API uygulamasını oluşturuyoruz.
app = FastAPI()
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
    return {"mesaj": "Kalan & Giden API çalışıyor"}

# Veritabanının konumunu belirliyoruz.
DB_PATH = (
    Path(__file__).resolve().parent.parent
    / "data/processed/warehouse.duckdb"
)


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

# Gerçek ayrılma tarihine göre yıllık ayrılma sayılarını getiriyoruz.
@app.get("/api/by-year")
def departures_by_year():
    con = duckdb.connect(str(DB_PATH), read_only=True)

    try:
        rows = con.execute("""
            SELECT
                YEAR(termination_date) AS yil,
                COUNT(*) AS ayrilan_calisan
            FROM fact_employee_year
            WHERE left_flag = 1
            GROUP BY YEAR(termination_date)
            ORDER BY yil
        """).fetchall()

        results = []
        for row in rows:
            results.append({
                "yil": row[0],
                "ayrilan_calisan": row[1]
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
def departures(year: int = 2014):
    con = duckdb.connect(str(DB_PATH), read_only=True)

    try:
        rows = con.execute("""
            SELECT
                e.employee_id,
                f.termination_date,
                t.termination_reason
            FROM fact_employee_year AS f
            JOIN dim_employee AS e
                ON f.employee_key = e.employee_key
            JOIN dim_termination AS t
                ON f.termination_key = t.termination_key
            WHERE f.left_flag = 1
              AND YEAR(f.termination_date) =?
            ORDER BY f.termination_date, e.employee_id
        """, [year]).fetchall()

        results = []
        for row in rows:
            results.append({
                "calisan_no": row[0],
                "ayrilma_tarihi": row[1],
                "sebep": row[2]
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

