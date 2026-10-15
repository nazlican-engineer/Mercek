# Kalan & Giden: Çalışan Ayrılma Analizi

Bu dosya güncel proje kapsamını belirler. 15 Ekim 2026 kararıyla tahmin modeli proje kapsamından çıkarıldı. Önceki model eğitimi ve doğal dil modeli gereksinimleri geçerli değil.

## Amaç

Veri analisti portföyü için çalışanların geçmişte ne zaman, hangi departman ve mağazalardan, hangi kayıtlı sebeplerle ayrıldığını gösteren küçük bir web uygulaması. Mevcut analiz, SAP tarzı kaynak tablolar ve DuckDB veri ambarı temel alınacak.

## Kapsam

- pandas ile veri hazırlama ve kalite kontrolleri.
- SAP HCM alan adlarından esinlenen PA0000, PA0001 ve PA0002 CSV tabloları.
- DuckDB yıldız şeması ve SQL analizleri.
- Yıl, tarih aralığı, departman, mağaza, şehir ve ayrılma sebebine göre filtreleme.
- FastAPI üzerinden ambar sorguları ve React ile Türkçe web arayüzü.
- Hazır sorular ve filtrelerle geçmiş kayıtlara erişim: “2014'te kaç kişi ayrıldı?”, “Bu mağazada kaç kişi istifa etti?”
- README, kaynak açıklaması, kurulum ve ekran görüntüleri; uygulama tamamlandığında yayın.

Tahmin, risk yüzdesi, SHAP, model eğitimi ve serbest doğal dili SQL'e çeviren yapay zekâ entegrasyonu bu sürümde yapılmayacak. Soruların cevapları SQL ile kayıtlı veriden hesaplanacak. Kendi modelini öğrenme çalışmaları bu projenin dışında yürütülecek.

## Veri ve mevcut bulgular

Kaynak: AIHR Employee Churn tutorial, MFG10YearTerminationData. Veri sentetik; gerçek şirket çalışanlarına ait olduğu iddia edilmeyecek.

- Ham veri: 49.653 satır, 18 sütun, 6.284 benzersiz çalışan; 2006–2015.
- Ayrılmış benzersiz çalışan: 1.485; emeklilik 885, istifa 385, işten çıkarılma 215.
- Bir satır çalışan durumunun belirli bir tarihteki kaydıdır; aynı çalışan farklı yıllarda tekrar bulunur.
- Aynı çalışan-yılda hem ACTIVE hem TERMINATED kaydı bulunan beş örnek korunmuştur. Bu yüzden çalışan-yıl çifti tek başına satır anahtarı sayılmaz.
- ACTIVE kayıtları yıl sonu gözlemleridir. TERMINATED kayıtlarının kayıt tarihi ayın ilk günü olabilir; gerçek ayrılma tarihi ayrı sütundadır. Tarih filtresiyle ayrılmaları hesaplarken gerçek ayrılma tarihi kullanılmalı.
- Sonradan ayrılanların geçmiş ACTIVE kayıtlarında gelecekteki ayrılma bilgisi bulunabilir. Ayrılma sayısı ve sebebi gerçek TERMINATED/ayrılma olaylarından hesaplanmalı.
- Temiz veride tarih sütunları düzenlendi, 1900-01-01 tarihleri boş değere çevrildi, Resignaton yazımı Resignation yapıldı. Beş çift kayıt silinmedi, şehir yazımları birleştirilmedi. İki tarih tutarsızlığı işaretlendi.
- İsim, maaş, mesai, memnuniyet ve performans alanları yok; eklenmeyecek veya uydurulmayacak.

Ayrıntılı bulgular `ANALIZ_NOTLARI.md` içinde.

## Mevcut dosyalar

- `notebooks/01_analiz.ipynb`: keşifsel analiz.
- `notebooks/02_sap_hazirlama.ipynb`: SAP tarzı CSV ve çalışan-yıl metriklerini hazırlama.
- `notebooks/03_duckdb_ambar.ipynb`: veri ambarını oluşturma ve kontroller.
- `data/raw/`: ham CSV, kaynak açıklaması ve orijinal kaynak belgeleri.
- `data/processed/MFG10YearTerminationData_clean.csv`: temiz veri.
- `data/processed/PA0000_actions.csv`: işe giriş ve ayrılma olayları.
- `data/processed/PA0001_org_assignment.csv`: organizasyon kayıtları.
- `data/processed/PA0002_personal_data.csv`: kişisel bilgiler.
- `data/processed/employee_year_metrics.csv`: yaş, kıdem ve yıllık durum kayıtları.
- `data/processed/warehouse.duckdb`: veri ambarı.

Model notebook'ları, deneme raporları ve model çıktı klasörleri kaldırıldı. İşlem kilidi nedeniyle boş `ml` klasörü yerelde kalabilir; proje tarafından kullanılmıyor ve Git boş klasörü izlemez.

## Web uygulaması planı

Üç sayfa:

| Sayfa | İçerik |
| --- | --- |
| Nabız | Genel çalışan ve ayrılma sayıları, yıllara ve departmanlara göre özetler |
| Veda defteri | Tarih, yıl, mağaza ve departman filtreleriyle ayrılma kayıtları |
| Mercek | Mağaza, departman, şehir, cinsiyet, kıdem ve kayıtlı ayrılma sebeplerinin karşılaştırılması |

Hazır soru ve filtreler uygun sayfalarda bulunacak. Tahmin amaçlı “Ya giderse?” ve yapay zekâ “Danışman” sayfaları yapılmayacak.

Planlanan API uçları: `GET /api/summary`, `GET /api/by-year`, `GET /api/departures`, `GET /api/breakdown`. Yıl örnekleri veri aralığından seçilecek. Uygulamada hazır parametreli sorgular kullanılacak; kullanıcıdan serbest SQL çalıştırılmayacak. Bunlar henüz oluşturulmuş uç noktalar değil.

## Hesaplama kuralları

- Toplam çalışan, benzersiz EmployeeID sayısıdır; yıllık satır sayısıyla karıştırılmaz.
- Ayrılanlar, gerçek ayrılma olaylarına ve benzersiz çalışanlara göre sayılır.
- Veri sonuna kadar ayrılma kaydı bulunmaması, kişinin bugün hâlâ çalıştığını göstermez.
- Her oran açık pay ve paydayla adlandırılır. Tüm dönem ayrılan/çalışan oranı, yıllık devir oranı gibi sunulmaz.
- Mağaza ve merkez ofis BUSINESS_UNIT ile ayrılır. Sadece store_name numarasına bakılarak merkez ofis kayıtları mağaza sayılmaz.
- Veri ambarının mevcut şeması notebook ve veritabanından kontrol edilir; eski taslak şema uygulanmış gerçeklik gibi sunulmaz.

## Tasarım yönergesi


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
- Dil: arayüz tamamı Türkçe, resmi değil sıcak bir ton ("veda etti")
- Erişilebilirlik: klavye odak halkası, anlamlı `aria-label`'lar, yeterli kontrast


## Sıradaki iş

Önce mevcut ambar ve SQL hesaplarını web uygulamasının ihtiyaçlarıyla eşleştirmek. Sonra FastAPI, ardından Nabız, Veda defteri ve Mercek sayfalarını oluşturmak. Web sitesi henüz geliştirilmedi; hazır veya yayında olduğu söylenmeyecek.

## Çalışma kuralları

- Kısa, anlaşılır kod ve bir–iki satırlık Türkçe yorumlar.
- Kullanıcının kendi analiz notlarını koru.
- Gerçek SAP bağlantısı yok; CSV tasarımı SAP tarzı olarak belirtilir.
- Yayın, ekran görüntüleri ve CV başarı ifadeleri yalnızca gerçekten tamamlandığında eklenir.
- Tahmin ve yapay zekâ işlerini yeni onay olmadan kapsama geri ekleme.

## Tamamlanma koşulları

- Analiz, SAP hazırlığı ve ambar adımları çalışır ve bağlantılıdır.
- Üç sayfa gerçek ambar hesaplarını gösterir; filtreler SQL sonuçlarıyla doğrulanır.
- Hazır sorular kayıtlı veriden doğru cevaplanır.
- Kaynak, sentetik veri açıklaması, kurulum ve ekran görüntüleri README'de yer alır.
- GitHub deposu güncel, yayın bağlantısı uygulama gerçekten yayımlandığında eklenmiştir.
