# Mercek

Güncel kapsam ve tasarım: [Proje bağlamı](PROJE_BAGLAMI.md) · [Kapsam ve renk paleti PDF’si](docs/kalan_giden_proje_kapsami_ve_renkler.pdf).

Çalışan ayrılmalarını yıl, departman, mağaza ve kayıtlı ayrılma sebebine göre inceleyen veri analizi ve raporlama projesi.

**Durum:** Veri analizi, SAP tarzı kaynak tablolar ve DuckDB veri ambarı hazır. FastAPI ve React ile Nabız, Veda defteri ve Karşılaştırmalar sayfaları yerelde çalışıyor. Tarih ve grup filtreleri, etiketli grafikler, CSV indirme ve açık/koyu tema mevcut. Ayrılma tahmini ve yapay zekâ bu sürümün kapsamında değil.

## Veri

AIHR Employee Churn eğitiminde kullanılan MFG10YearTerminationData verisi sentetiktir; gerçek çalışan verisi değildir. Ham veri 49.653 satır ve 18 sütundan oluşur; 2006–2015 arasında 6.284 benzersiz çalışan içerir. Kaydedilmiş 1.485 ayrılmanın 885'i emeklilik, 385'i istifa, 215'i işten çıkarılmadır.

Aynı çalışan farklı yıllarda tekrar bulunur. Çalışan sayısı ile kayıt sayısı aynı değildir. Çalışan adları, maaş, mesai ve memnuniyet bilgisi yoktur.

Kaynak: [AIHR Employee Churn tutorial](https://www.aihr.com/blog/tutorial-people-analytics-r-employee-churn/). İndirme ve temizlik notları: [kaynak açıklaması](data/raw/SOURCE.md), [analiz bulguları](ANALIZ_NOTLARI.md).

## Mevcut akış

```text
Ham CSV → temiz veri → SAP tarzı CSV tabloları → DuckDB veri ambarı → FastAPI → React
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

PDF’nin pitaya renk paleti ve tek sütun düzeniyle üç sayfa oluşturuldu:

- **Nabız:** Genel sayılar ve yıllık/departman bazında özetler.
- **Veda defteri:** Yıl, tarih aralığı, mağaza, şehir, departman ve sebep filtreleri; çalışan numarası arama, sayfalama ve filtreli CSV indirme.
- **Karşılaştırmalar:** Departman, mağaza, şehir, cinsiyet ve kıdem gruplarını kişi sayısı veya ayrılma yüzdesiyle karşılaştırma.

Yıl grafiğindeki bir nokta veya altındaki yıl bağlantısı ilgili yılın kayıtlarını, sebep satırındaki ok ilgili sebebin kayıtlarını açar. Filtreler kayıtlı veriden parametreli SQL ile hesaplanır. Serbest doğal dil sorgusu ve tahmin yoktur. Uygulama yereldir; yayımlanmamıştır.



## API ve arayüzü yerelde çalıştırma

Proje ana klasöründeki terminalde:

```powershell
python -m pip install -r backend/requirements.txt
python -m uvicorn backend.main:app --reload
```

Ayrı bir terminalde:

```powershell
cd frontend
npm ci
npm run dev
```

API: `http://127.0.0.1:8000`. API test ekranı: `http://127.0.0.1:8000/docs`. Arayüz: `http://localhost:5173` (terminalde gösterilen adresi kontrol edin). Geliştirme CORS izni localhost ve 127.0.0.1 için 5173 portuna tanımlı. İki sunucu da açık kalmalıdır.


## Arayüz ve ölçümler

- Açık/koyu tema sistem tercihine uyar. Grafik değerleri doğrudan etiketlidir.
- Nabız özetleri tüm veri dönemine aittir; 6.284 benzersiz çalışan, 1.485 ayrılma ve %23,63 dönem payı. Bu yıllık devir oranı değildir.
- Karşılaştırmalar sayfasında her çalışan seçilen yılın veya tüm dönemin son kaydıyla bir kez gruplandırılır. Kıdem bu kayda aittir. Yıl seçilirse payda o yılda gözlenen benzersiz çalışanlardır; yıl başı/sonu ortalama personel hesabı kullanılmaz.
- Mağaza analizlerinde yalnızca STORES birimi kullanılır. Şehir yazımları korunmuştur.
- CSV, listede seçilen filtreler ve çalışan numarası aramasına uyan bütün sonuçları indirir; sadece görünen sayfayı indirmez.
- `/api/departures` yıl gönderilmezse bütün dönemi getirir. Opsiyonel parametreler: `year`, `department`, `store`, `city`, `reason`, `start_date`, `end_date`.
- Vite geliştirme sunucusu `/api` isteklerini `127.0.0.1:8000` adresine iletir. API farklı adreste çalışırsa arayüzde `VITE_API_URL` ayarlanabilir; ilgili CORS izni de güncellenmelidir.

Derleme: `cd frontend` ardından `npm run build`. Canlı yayın ve Docker henüz hazırlanmadı.

## Ekran görüntüleri

- [Nabız](docs/screenshots/nabiz.png)
- [Yıllık alan grafiği ve tablosu](docs/screenshots/yillik-alan-grafigi.png)
- [Veda defteri](docs/screenshots/veda-defteri.png)
- [Karşılaştırmalar](docs/screenshots/mercek.png)

Yerel kontroller: API toplamları ve filtreleri kaynak CSV ile karşılaştırıldı. Gerçek tarayıcıda yıl grafiğinden geçiş, filtreler, CSV indirme, sayfalama, boş sonuç, açık/koyu tema, API hata/yeniden deneme ve 320 piksel ekran genişliği kontrol edildi. React üretim derlemesi başarılı.


### Yıllık alan grafiği

Nabız'daki alan grafiği başlangıçta yıllık ayrılma payını gösterir. “Oran (%) / Ayrılan kişi” seçimi grafiğin ölçüsünü değiştirir. Aynı anda farklı ölçekte iki dolu alan çizilmez. Nokta ayrıntıları toplam çalışanı, ayrılanı ve yüzdeyi birlikte gösterir; grafik altındaki tabloda on yılın bütün değerleri kalıcı olarak görünür.

`GET /api/by-year` her yıl için `yil`, `toplam_calisan`, `ayrilan_calisan`, `ayrilma_yuzdesi` döndürür. Payda, o yıl herhangi bir kaydı bulunan benzersiz çalışanlardır; yıllık satır toplamı kullanılmaz. Ayrılmalar gerçek ayrılma tarihinin yılına göre sayılır. Bu, yıl başı/sonu ortalama çalışanla hesaplanan devir oranı değildir.

### Grafik ağırlıklı analiz panosu

Nabız altı grafik içerir: yıllık alan, yıllara göre ayrılma sebepleri (yığılmış sütun), sebep dağılımı (halka), departmanlar, ilk 10 mağaza ve ayrılma anındaki kıdem. Ortak yıl filtresi özet sayıları ve dönem grafiklerini günceller; iki yıllık eğilim grafiği bütün yılları korur. Departmanlar kişi sayısı veya ayrılma payına göre sıralanabilir. Halka grafiğin sebep satırları filtreli kayıt listesini açar. Mağaza grafiği merkez ofisi dışarıda bırakır. Yeni grafikler `/api/departures`, `/api/by-year` ve `/api/breakdown` verilerini kullanır; ek grafik kütüphanesi kurulmadı.

[Güncel Nabız panosu](docs/screenshots/nabiz.png) · [Koyu tema](docs/screenshots/pano-koyu.png).
