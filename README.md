# Kalan & Giden

Çalışan ayrılmalarını yıl, departman, mağaza ve kayıtlı ayrılma sebebine göre inceleyen veri analizi ve raporlama projesi.

**Durum:** Veri analizi, SAP tarzı kaynak tablolar ve DuckDB veri ambarı hazır. FastAPI ile temel veri sorguları ve React ekranında toplam çalışan, ayrılan çalışan ve yıllık ayrılma listesi çalışıyor. Arayüz geliştirmesi sürüyor. Ayrılma tahmini ve yapay zekâ bu sürümün kapsamında değil.

## Veri

AIHR Employee Churn eğitiminde kullanılan MFG10YearTerminationData verisi sentetiktir; gerçek çalışan verisi değildir. Ham veri 49.653 satır ve 18 sütundan oluşur; 2006–2015 arasında 6.284 benzersiz çalışan içerir. Kaydedilmiş 1.485 ayrılmanın 885'i emeklilik, 385'i istifa, 215'i işten çıkarılmadır.

Aynı çalışan farklı yıllarda tekrar bulunur. Çalışan sayısı ile kayıt sayısı aynı değildir. Çalışan adları, maaş, mesai ve memnuniyet bilgisi yoktur.

Kaynak: [AIHR Employee Churn tutorial](https://www.aihr.com/blog/tutorial-people-analytics-r-employee-churn/). İndirme ve temizlik notları: [kaynak açıklaması](data/raw/SOURCE.md), [analiz bulguları](ANALIZ_NOTLARI.md).

## Mevcut akış

```text
Ham CSV → temiz veri → SAP tarzı CSV tabloları → DuckDB veri ambarı → SQL analizleri
```

Notebook'ları şu sırayla inceleyin:

1. [01_analiz.ipynb](notebooks/01_analiz.ipynb): veriyi tanıma, kalite kontrolleri ve grafikler.
2. [02_sap_hazirlama.ipynb](notebooks/02_sap_hazirlama.ipynb): PA0000, PA0001, PA0002 ve yıllık metrikler.
3. [03_duckdb_ambar.ipynb](notebooks/03_duckdb_ambar.ipynb): kaynak tablolar, boyutlar ve çalışan kayıtları.

SAP alan adlarından esinlenen CSV tabloları kullanılmıştır; gerçek SAP sistemine bağlanılmamıştır.

## Yerelde inceleme

Python ortamına analiz araçlarını kurun:

```powershell
python -m pip install pandas numpy matplotlib seaborn duckdb jupyter ipykernel
```

VS Code'da proje klasörünü açıp notebook için bu Python ortamını seçin. Notebook'ları `notebooks` klasöründe çalıştırın; göreli `../data/` yolları bu klasöre göredir. Jupyter ile açmak için:

```powershell
python -m notebook --notebook-dir=notebooks
```

Hazırlanmış dosyalar `data/processed/` içinde; ambar `warehouse.duckdb` dosyasıdır. Ambar notebook'undaki `CREATE TABLE IF NOT EXISTS`, mevcut tabloları yeniden yüklemez. Kaynak veriler değişirse mevcut ambarın yenilenmesi ayrıca ele alınmalıdır.

## Web uygulaması ve sonraki adımlar

FastAPI ve React ile üç sayfa planlanıyor:

- **Nabız:** Genel sayılar ve yıllık/departman bazında özetler.
- **Veda defteri:** Tarih aralığı, mağaza ve departmana göre ayrılan çalışan listesi.
- **Mercek:** Ayrılma sebepleri, mağazalar, şehirler ve diğer kırılımlar.

“2014'te kaç kişi ayrıldı?” gibi hazır sorular ve filtreler kayıtlı veriden SQL ile cevaplanacak. Yerel başlangıç arayüzü hazır; üç sayfalı uygulama henüz tamamlanmadı veya yayımlanmadı.

Kapsam ve çalışma kuralları: [PROJECT_BRIEF.md](PROJECT_BRIEF.md).


## API ve arayüzü yerelde çalıştırma

Proje ana klasöründeki terminalde:

```powershell
python -m pip install fastapi uvicorn duckdb
python -m uvicorn backend.main:app --reload
```

Ayrı bir terminalde:

```powershell
cd frontend
npm ci
npm run dev
```

API: `http://127.0.0.1:8000`. API test ekranı: `http://127.0.0.1:8000/docs`. Arayüz: `http://localhost:5173` (terminalde gösterilen adresi kontrol edin). Geliştirme CORS izni localhost ve 127.0.0.1 için 5173 portuna tanımlı. İki sunucu da açık kalmalıdır.
