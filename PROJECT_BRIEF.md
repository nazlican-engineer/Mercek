# Kalan & Giden: Çalışan Ayrılma Analizi ve Tahmin Platformu

> Bu dosya projenin tek kaynağıdır. Codex (veya başka bir asistan) işe başlamadan önce bunu baştan sona okumalı, kararları buradan almalıdır. Açık karar olarak işaretlenmiş yerler dışında burada yazanları değiştirme, değiştirmek gerekiyorsa önce sor.

## 1. Amaç

Bir şirkette çalışanların neden, ne zaman ve hangi ekiplerden ayrıldığını **analiz eden**, hangi çalışanın ayrılma riski taşıdığını **tahmin eden** ve doğal dille soru sorulabilen bir web uygulaması.

**Sahibinin hedefi:** Veri analisti pozisyonları için portföy projesi. İş ilanlarında sık geçen üç beklentiyi tek projede göstermek:
1. **Data warehousing** (yıldız şeması, ETL, SQL)
2. **SAP** (SAP HCM veri modeline uygun tasarım, gerçek SAP erişimi yok)
3. **Tahmin modelleme ve yeni teknolojiler** (ML + LLM tabanlı text-to-SQL)

**Süre:** 15 gün. Proje bitirilebilir olmalı. Süre sıkışırsa kesilecek şeyler belli (bkz. bölüm 12).

## 2. Kapsam

### Kapsam içi
- Veri hazırlama: ham çalışan-yıl verisini temizleme, SAP tarzı CSV'lere bölme
- ETL hattı (Python + pandas) ve veri kalitesi kontrolleri
- DuckDB üzerinde yıldız şemalı veri ambarı
- Keşifsel analiz (ekip, cinsiyet, yıl, kıdem, sebep)
- Ayrılma tahmin modeli (Logistic Regression, XGBoost) ve SHAP açıklamaları
- FastAPI ile API
- React ile 5 sayfalı arayüz
- Claude API ile "Danışman" (text-to-SQL)
- README, ekran görüntüleri, canlı yayın

### Kapsam dışı (yapma)
- Gerçek SAP bağlantısı veya SAP lisansı gerektiren her şey
- Kullanıcı girişi, yetkilendirme, çok kiracılı yapı
- Gerçek zamanlı veri akışı
- Mobil uygulama
- Harita sayfası (opsiyonel, süre kalırsa)

## 3. Dürüstlük kuralları (README'ye de yazılacak)
- Veri setinin kaynağı ve gerçek mi sentetik mi olduğu `data/raw/SOURCE.md` dosyasında yazanla teyit edilir ve README'de aynen belirtilir. Kaynakta belirtilmemişse "kaynağı doğrulanamayan, anonim/sentetik olabilecek veri" diye yazılır.
- Veride **çalışan adı, maaş, mesai, memnuniyet ve performans yoktur**. Bunlar uydurulmaz. Arayüzde çalışanlar `EmployeeID` ile gösterilir.
- SAP tarzı tablolar SAP HCM alan adlarını taklit eder. Gerçek SAP sistemiyle çalışılmadı. CV'de "SAP HCM veri modeline uygun DWH tasarımı" denir, "SAP ile çalıştım" denmez.
- Model özellik bakımından fakirdir (yaş, hizmet süresi, departman, görev, mağaza, şehir, cinsiyet). Başarısı bu sınırla yorumlanır. Yalnızca accuracy değil AUC, recall ve precision de raporlanır.

## 4. Veri seti (KARAR VERİLDİ)

**MFG10YearTerminationData** (Kaggle). 10 yıllık çalışan kayıtları, ayrılma tarihi ve ayrılma sebebi içerir.

### Yapı
Her satır bir **çalışan-yıl kaydıdır**: `EmployeeID × STATUS_YEAR`, kayıt tarihi her yıl 31 Aralık. Aynı çalışan her yıl için ayrı satırda tekrar eder (örnek: 1318 numaralı CEO, 2006-2015 arası 10 satır). Yıl aralığı yaklaşık 2006-2015. Satır ve çalışan sayıları `etl/00_inspect_data.py` ile doğrulanacak, varsayma.

### Sütunlar
`EmployeeID, recorddate_key, birthdate_key, orighiredate_key, terminationdate_key, age, length_of_service, city_name, department_name, job_title, store_name, gender_short, gender_full, termreason_desc, termtype_desc, STATUS_YEAR, STATUS, BUSINESS_UNIT`

### Bilinen tuzaklar
- `terminationdate_key` aktif çalışanlarda `1900-01-01` (boş anlamında). ETL'de NULL yapılır.
- `recorddate_key` "12/31/2006 0:00" biçiminde, diğer tarihler ISO (`1954-01-03`). Ayrı ayrı parse edilir.
- `STATUS = TERMINATED` satırı çalışanın son yılıdır. `termreason_desc` ve `termtype_desc` yalnızca bu satırlarda anlamlıdır, aktif satırlarda "Not Applicable".
- Departman, görev, mağaza ve şehir adları Kanada'daki bir şirkete ait görünüyor (örnek: Vancouver). Gerçek değerler `00_inspect_data.py` çıktısından alınır, uydurulmaz.

### Veride OLMAYANLAR
Çalışan adı, maaş, mesai, memnuniyet, performans, terfi. Bu alanlara bağlı her fikir (maaş bandı, memnuniyet sürgüsü, `PA0008_pay`) projeden çıkarıldı.

### Veri seti ne kazandırıyor
Gerçek ayrılma tarihi, ayrılma sebebi ve türü (gönüllü / zorunlu) var. Bu yüzden "bu tarihte kim ayrıldı?" ve "neden ayrıldı?" soruları sentetik veri olmadan cevaplanır.

### Önceki taslak
IBM HR veri setine göre yazılmış `01_generate_raw.py` taslağı **iptal**, kullanılmayacak.

## 5. Mimari

```
React (Vite)                       arayüz
    | HTTP
FastAPI (Python)                   API, tahmin, Danışman
    |
DuckDB (yıldız şeması)             veri ambarı
    ^
ETL (pandas) <- SAP tarzı CSV'ler  PA0000, PA0001, PA0002, PA0008
    ^
scikit-learn / XGBoost + SHAP      ayrılma tahmini
Claude API                         text-to-SQL
```

### Klasör yapısı
```
attrition-insights/
  data/raw/            ham veri (MFG10YearTerminationData.csv, SOURCE.md) ve SAP tarzı CSV'ler
  data/processed/      warehouse.duckdb, model çıktıları
  etl/                 inceleme, SAP tarzı CSV, kalite kontrol, ambara yükleme
  sql/                 schema.sql, queries.sql
  notebooks/           keşifsel analiz
  ml/                  eğitim, değerlendirme, SHAP
  backend/             FastAPI
  frontend/            React
  PROJECT_BRIEF.md
  README.md
```

### Ortam (sahibinin bilgisayarı)
- Windows, PowerShell, VS Code
- Node v24.18.0, Python 3.14.5
- Python 3.14 çok yeni. `xgboost` veya `shap` kurulumunda sorun çıkarsa Python 3.12 kurulup sanal ortam yenilenecek.
- Sanal ortam: `.venv`. Etkinleştirme: `.\.venv\Scripts\Activate.ps1`

## 6. Veri modeli

### SAP tarzı kaynak tablolar (CSV, `data/raw/` altında üretilir)
| Dosya | Kaynak sütunlar | SAP alanları |
|---|---|---|
| `PA0000_actions.csv` | EmployeeID, orighiredate_key, terminationdate_key, termreason_desc, termtype_desc | PERNR, BEGDA, MASSN (01 işe giriş, 10 ayrılma), MASSG (sebep), TERMTYPE (tür) |
| `PA0001_org_assignment.csv` | EmployeeID, recorddate_key, department_name, job_title, store_name, city_name, BUSINESS_UNIT | PERNR, BEGDA, ORGEH_TXT, PLANS, WERKS, ORT01, GSBER (yıllık kayıt) |
| `PA0002_personal_data.csv` | EmployeeID, birthdate_key, gender_short | PERNR, GBDAT, GESCH (1 erkek, 2 kadın) |

`PA0008_pay` (maaş) **yok**, çünkü veride maaş bilgisi yok.

### Veri ambarı (DuckDB, yıldız şeması)
**Tanecik (grain): çalışan × yıl.**

- **fact_employee_year:** employee_key, department_key, job_key, store_key, date_key (kayıt tarihi), termination_key, left_flag (yalnızca ayrıldığı yılın satırında 1), age, length_of_service
- **dim_employee:** employee_id, doğum tarihi, cinsiyet, işe giriş tarihi, ayrılma tarihi (yoksa NULL)
- **dim_department:** departman adı
- **dim_job:** görev adı
- **dim_store:** mağaza no, şehir, business_unit
- **dim_date:** tarih, yıl, çeyrek, ay, ay adı
- **dim_termination:** ayrılma sebebi, ayrılma türü (aktifler için "Not Applicable" satırı)

**Hesap kuralı:** Ayrılma oranı = o yıl `left_flag = 1` olan satır sayısı / o yılki toplam satır sayısı. Toplam çalışan sayısı yıldan yıla değişir, tek bir sabit sayı kullanılmaz.

Örnek sorular JOIN'lerle cevaplanabilmeli: "2014'te şehir bazında ayrılanlar", "gönüllü ve zorunlu ayrılma dağılımı", "bu tarihte kimler ayrıldı?"

## 7. Sayfalar (sahibi isimleri bilinçli seçti, değiştirme)

Bu isimler, ilham alınan referans siteyle benzemesin diye özellikle seçildi.

| Sayfa | İçerik |
|---|---|
| **Nabız** | Tek cümlelik özet başlık ("2006'dan beri X kişi veda etti"), departmanlara göre tek şerit grafik, yıllara göre büyüyen daireler |
| **Veda defteri** | Yıl seçimi (açılır liste), o yıl ayrılanların satır satır listesi: ayrılma tarihi, çalışan no, departman, görev, şehir, kaç yıl kaldı, sebep ve tür (gönüllü / zorunlu) |
| **Mercek** | Cinsiyet şeridi, departman, şehir, sebep ve gönüllü/zorunlu sayı listeleri |
| **Ya giderse?** | Çalışan profili kur (yaş, hizmet süresi, departman, görev, şehir, cinsiyet), model tahminiyle gitme ihtimalini ve nedenlerini (SHAP) göster |
| **Danışman** | Doğal dil sorusu, altında üretilen SQL, cevap cümlesi |

**Tasarım prototipi** (`attrition-insights-demo.html`) onaylı, ama **sentetik IBM verisine göre yazılmış**. Düzeni, renkleri ve yazı tipini birebir izle. İçerik şunlarda değişir:
- Departman adları ve sayıları gerçek veriden gelir (demodaki Satış, Yazılım vb. uydurma).
- Çalışan adları yok, `EmployeeID` gösterilir.
- Ya giderse? sayfasındaki "akşamlara taşan iş", "keyif" ve "maaş" sürgüleri **kalkar**. Yerine yaş, hizmet süresi ve açılır listeler (departman, görev, şehir, cinsiyet) gelir.
- Ayrılma sebepleri verideki gerçek değerlerdir.

## 8. Tasarım yönergesi

**Karakter:** Sade, editoryal, tek sütun, geniş boşluklar. Kart, kenar çubuğu ve klasik "pano" görünümünden bilinçli olarak kaçınılıyor. Referans bir havacılık arşivi sitesinin koyu lacivert ve kart düzenine benzememeli.

**Renk (pitaya / ejder meyvesi teması):**

| Token | Açık | Koyu |
|---|---|---|
| bg | `#fff6f9` | `#1c0d15` |
| tx | `#2a1020` | `#fff0f6` |
| mut | `#8a5a70` | `#cfa0b6` |
| line | `#f2d0df` | `#4a2236` |
| ac (vurgu) | `#d81b72` | `#ff5fa2` |
| soft | `#fde1ec` | `#301522` |
| seri renkleri | `#a1124f`, `#d81b72`, `#f06fa6`, `#f8b3d0`, yeşil `#8cc63f`, koyu yeşil `#3d7a1e` | yeşiller açılır |

- Kadın = magenta, erkek = yaprak yeşili
- `prefers-color-scheme: dark` desteklenecek
- Başlıklar ve büyük sayılar Georgia (serif), arayüz metni Trebuchet MS
- Logo: yarım pitaya ikonu (pembe kenarlı, beyaz içi siyah tohumlu, CSS ile)
- Dil: arayüz tamamı Türkçe, resmi değil sıcak bir ton ("veda etti", "Ya giderse?")
- Erişilebilirlik: klavye odak halkası, anlamlı `aria-label`'lar, yeterli kontrast

## 9. Tahmin modeli
- **Birim:** çalışan-yıl satırı. Hedef: `left_flag` (çalışan o yıl ayrılıyor mu). Ayrıca ikinci bir deneme: yalnızca **gönüllü** ayrılma (termtype = Voluntary).
- **Özellikler:** age, length_of_service, department, job_title, store, city, gender, business_unit.
- **Özellik olarak KULLANILMAZ (sızıntı):** termreason_desc, termtype_desc, terminationdate_key, STATUS. `STATUS_YEAR` varsayılan olarak kullanılmaz.
- **Bölme:** Aynı çalışanın farklı yılları hem eğitimde hem testte olmamalı. Ya `EmployeeID` bazlı grup ayrımı ya da zamana göre ayrım (2006-2014 eğitim, 2015 test).
- **Dengesizlik:** ayrılma satırları çok azdır (oran `00_inspect_data.py` çıktısında). Class weight veya benzeri uygulanır.
- **Modeller:** Logistic Regression (taban çizgisi), XGBoost.
- **Metrikler:** AUC, recall, precision, confusion matrix.
- **Beklenti:** Özellik az olduğundan başarı mütevazı olabilir. Yaş ve hizmet süresi baskın çıkacaktır, çünkü emeklilik yaşa bağlı ayrılmalardır. Emeklilik kaynaklı ayrılmalar ayrı raporlanır, bu bir bulgudur, hata değil.
- Çalışan bazlı risk skoru (%) ve SHAP ile en etkili 3-4 neden.
- Model dosyası `ml/` altında kaydedilir, API başlangıçta yükler.

## 10. Danışman (text-to-SQL)
- Girdi: Türkçe soru. Çıktı: SQL, sonuç tablosu, tek cümlelik Türkçe cevap
- Claude API kullanılır. Prompt'a yıldız şeması ve alan açıklamaları verilir.
- **Güvenlik (zorunlu):** Üretilen SQL çalıştırılmadan önce doğrulanır. Yalnızca tek bir `SELECT` ifadesine izin verilir. `INSERT, UPDATE, DELETE, DROP, ATTACH, COPY, PRAGMA` ve noktalı virgülle birden fazla ifade reddedilir. DuckDB bağlantısı salt okunur açılır.
- API anahtarı `.env` dosyasında tutulur, repoya girmez (`.gitignore`).
- Cevaplanamayan veya şema dışı sorularda uydurma yerine açıkça "bunu veriden cevaplayamıyorum" der.
- Test soruları (en az 5 doğru cevap şartı):
  1. 2014'te kaç kişi ayrıldı?
  2. Hangi departmanda en çok ayrılma var?
  3. Kadınların ve erkeklerin ayrılma oranı nedir?
  4. Gönüllü ve zorunlu ayrılmaların dağılımı nedir?
  5. Hangi şehirde en çok ayrılma var?
  6. Mart 2012'de hangi çalışanlar ayrıldı?

## 11. API uç noktaları (taslak)
- `GET /api/summary` : toplam çalışan, ayrılan, oran, en çok kaybeden ekip, cinsiyet payı
- `GET /api/by-year` : yıllara göre ayrılma sayıları
- `GET /api/departures?year=2024` : o yıl ayrılanların listesi
- `GET /api/breakdown` : ekip, cinsiyet, sebep kırılımları
- `POST /api/predict` : profil alır, olasılık ve SHAP nedenlerini döner
- `POST /api/ask` : soru alır, SQL + sonuç + cevap döner

## 12. 15 günlük plan

| Gün | İş |
|---|---|
| 1 | Ortam, klasör yapısı, `00_inspect_data.py` ile veriyi tanıma |
| 2 | Temizleme (1900-01-01 → NULL, tarih biçimleri) ve SAP tarzı CSV'ler |
| 3 | Veri kalitesi kontrolleri, ETL'in ilk adımı |
| 4 | ETL tamamlama |
| 5 | DuckDB yıldız şeması, yükleme, örnek SQL sorguları |
| 6 | Keşifsel analiz: ekip, cinsiyet, yıl, kıdem |
| 7 | Derin analiz: mesai, maaş, memnuniyet ilişkileri |
| 8 | Özellik hazırlama, train/test ayrımı |
| 9 | Logistic Regression ve XGBoost, karşılaştırma |
| 10 | SHAP, çalışan bazlı risk skoru |
| 11 | FastAPI |
| 12 | React: Nabız, Veda defteri, Mercek |
| 13 | React: Ya giderse? |
| 14 | Danışman |
| 15 | Test, README, ekran görüntüleri, yayın |

**Süre sıkışırsa:** Danışman'ı hazır sorularla sınırla, harita sayfasını yapma. Warehouse ve tahmin modelini **kesme**, çünkü proje amacı bunlar.

## 13. Çalışma kuralları (Codex için)
1. Her adımda önce ne yapacağını kısaca söyle, sonra yap.
2. Her gün sonunda çalışır durumda bir çıktı bırak ve neyin bittiğini yaz.
3. Kod yorumları ve değişken adları İngilizce, arayüz metinleri ve README Türkçe olabilir.
4. Sentetik olan her alanı kodda ve README'de işaretle.
5. Rastgelelik gerektiren her yerde sabit tohum kullan (tekrarlanabilirlik).
6. Gizli anahtarları koda yazma. `.env` ve `.gitignore` kullan.
7. Küçük, test edilebilir adımlarla ilerle. Her ETL adımından sonra satır sayısı ve boş değer kontrolü yap.
8. Karar gereken bir yerde (özellikle bölüm 4'teki açık karar) tahmin yürütme, sahibine sor.
9. Gereksiz bağımlılık ekleme. Python tarafında: pandas, numpy, duckdb, scikit-learn, xgboost, shap, fastapi, uvicorn, anthropic, python-dotenv.

## 14. Bitti sayılması için
- [ ] 5 sayfanın hepsi gerçek ambar verisiyle çalışıyor
- [ ] Model raporu (AUC, recall, confusion matrix) ve SHAP grafiği README'de
- [ ] Danışman en az 5 test sorusunu doğru cevaplıyor ve tehlikeli SQL'i reddediyor
- [ ] README: amaç, mimari, sentetik veri açıklaması, kurulum, ekran görüntüleri
- [ ] Canlı bağlantı ve GitHub deposu hazır

## 15. CV maddeleri (proje bitince)
- Yıldız şemalı DuckDB veri ambarı tasarladım, SAP HCM yapısına uygun ETL hattı kurdum.
- Çalışan ayrılmasını XGBoost ile tahmin ettim (AUC: X), SHAP ile nedenlerini açıkladım.
- Claude API ile doğal dil sorularını güvenli SQL'e çeviren bir danışman geliştirdim.
- React ve FastAPI ile uçtan uca web uygulaması yayına aldım.

## 16. Şu anki durum
- Node ve Python kurulu, sürümler yukarıda.
- Statik tasarım prototipi hazır ve onaylı (içeriği IBM verisine göre, bölüm 7'deki notlara bak).
- **Veri seti seçildi:** MFG10YearTerminationData, `data/raw/` içinde. Yapısı çalışan-yıl.
- Proje klasörü açık: `Çalışan_ayrılma_analizi`. `analiz.ipynb` şu an `data/raw` içinde, `notebooks/` klasörüne taşınacak. Brief PDF yerine bu `.md` dosyası kök klasörde olmalı.
- **Sıradaki iş:** `etl/00_inspect_data.py` çalıştırılacak, çıktı (`data/processed/inspect_report.txt`) incelenip bölüm 4 ve 6 gerçek sayılarla netleştirilecek. Ardından `etl/01_prepare_raw.py` (temizleme ve SAP tarzı CSV'ler).
