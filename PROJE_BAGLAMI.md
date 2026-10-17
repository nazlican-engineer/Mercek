# Mercek — güncel proje bağlamı

Kullanıcının paylaştığı [proje kapsamı ve renk paleti PDF’si](docs/kalan_giden_proje_kapsami_ve_renkler.pdf) bu notun referansıdır. PDF değiştirilmeden projeye kopyalandı. Silinen `PROJECT_BRIEF.md` geri oluşturulmadı.

Site adı kullanıcının son kararıyla **Mercek** oldu. PDF’deki eski ad kaynak belgede korunuyor; karşılaştırma sayfasının adı **Karşılaştırmalar** olarak güncellendi.

## Amaç ve kapsam

Sentetik MFG10YearTerminationData verisindeki geçmiş çalışan ayrılmalarını analiz eden Türkçe web uygulaması. Veri hazırlama, SAP tarzı CSV tabloları, DuckDB yıldız şeması, SQL, FastAPI ve React kullanılıyor.

Yıl, gerçek ayrılma tarihi, departman, mağaza, şehir ve ayrılma sebebine göre analiz ve filtreleme yapılacak. Hazır sorular parametreli SQL sorgularıyla cevaplanacak.

Tahmin, risk yüzdesi, model eğitimi, SHAP ve serbest doğal dili SQL’e çeviren yapay zekâ kapsam dışında. Telco ve diğer makine öğrenmesi çalışmaları ayrı proje. Gerçek SAP bağlantısı yok. Veride bulunmayan isim, maaş, mesai, memnuniyet veya performans alanları uydurulmayacak.

## Üç sayfa

| Sayfa | İçerik |
| --- | --- |
| Nabız | Çalışan ve ayrılma sayıları, yıllara ve departmanlara göre özetler |
| Veda defteri | Tarih, yıl, mağaza ve departman filtreleriyle gerçek ayrılma kayıtları |
| Karşılaştırmalar | Mağaza, departman, şehir, cinsiyet, kıdem ve kayıtlı ayrılma sebeplerinin karşılaştırılması |

## Hesap kuralları

- Ham veri: 49.653 kayıt, 18 sütun, 2006–2015; 6.284 benzersiz çalışan.
- Ayrılmış benzersiz çalışan: 1.485; emeklilik 885, istifa 385, işten çıkarılma 215.
- Çalışan sayısı benzersiz EmployeeID üzerinden hesaplanır; yıllık kayıt sayısı ayrı bir ölçüdür.
- Aynı çalışan-yılda ACTIVE ve TERMINATED bulunan beş örnek korunur.
- Ayrılma sayıları gerçek ayrılma olaylarından, tarih filtreleri gerçek ayrılma tarihinden hesaplanır. Geçmiş ACTIVE kayıtlarındaki geleceğe ait ayrılma bilgileri sayımlara katılmaz.
- Bir çalışanın veri sonuna kadar ayrılma kaydı olmaması, bugün hâlâ çalıştığını göstermez.
- Her oranın payı, paydası ve dönemi açıkça belirtilir. Tüm dönem ayrılma yüzdesi yıllık devir oranı diye adlandırılmaz.
- Mağaza/merkez ofis ayrımı BUSINESS_UNIT ile yapılır.

## Görsel tasarım

Kullanıcının son isteğiyle Nabız, grafik ağırlıklı bir analiz panosuna dönüştürüldü. Grafikler masaüstünde ikili, mobilde tek sütunlu panellerde gösterilir. Mercek markası ve pitaya renk paleti korunur. Sistem koyu tema tercihi desteklenecek.

| Rol | Açık tema | Koyu tema |
| --- | --- | --- |
| Zemin | `#fff6f9` | `#1c0d15` |
| Metin | `#2a1020` | `#fff0f6` |
| İkincil metin | `#8a5a70` | `#cfa0b6` |
| Çizgi | `#f2d0df` | `#4a2236` |
| Vurgu | `#d81b72` | `#ff5fa2` |
| Yumuşak dolgu | `#fde1ec` | `#301522` |

- Başlıklar ve büyük sayılar: Georgia. Arayüz metni: Trebuchet MS.
- Logo: CSS ile yarım pitaya; pembe kenar, beyaz iç, siyah tohumlar.
- Cinsiyet grafiklerinde kadın magenta, erkek yaprak yeşili (`#8cc63f`; gerektiğinde okunaklı koyu yeşil `#3d7a1e`). Koyu temada yeşiller açılacak.
- Ayrılma sebeplerinde yeşil kullanılmayacak. Sebepler için `#a1124f`, `#d81b72`, `#f06fa6`; her çubukta doğrudan etiket bulunacak.
- Grafiklerin çoğu tek vurgu renginde sıralı çubuk olacak. Değerler yalnızca hover ile gösterilmeyecek.
- `#f8b3d0` dolgu için kullanılabilir; açık pembe ve açık yeşil küçük metin veya ince çizgi için kullanılmayacak. PDF’deki kontrast değerlendirmesi uygulanan gerçek zemin ve yazı boyutlarında yeniden kontrol edilecek.
- Sayı ve sebep etiketlerinde nötr “ayrıldı” kullanılacak; “veda” yalnızca sayfa adında kalacak.
- Türkçe arayüz, klavyeyle erişim, görünür odak göstergesi ve anlamlı etiketler korunacak.

## PDF’den sonraki mevcut durum

PDF, geliştirme öncesi bir durum özeti de içeriyor. Uygulanan gerçek durum aşağıdadır; PDF’deki planlanan uçlar mevcut uçlar gibi varsayılmamalı.

- Analiz, SAP hazırlığı ve DuckDB ambar notebook’ları mevcut.
- `backend/main.py` içinde temel FastAPI sorguları ve yerel React erişimi için CORS var.
- API: `/`, `/api/employee-count`, `/api/departure-count`, `/api/by-year`, `/api/by-reason`, `/api/by-department`, `/api/departures`, `/api/by-store`, `/api/summary`, `/api/filters`, `/api/breakdown`.
- `/api/departures?year=2015` gibi yıl parametresiyle liste alınabiliyor. SQL’de `?` ve parametre listesi kullanılıyor.
- React arayüzünde Nabız, Veda defteri ve Karşılaştırmalar yerelde oluşturuldu. Pitaya paleti, açık/koyu tema, yıllık grafik, grup karşılaştırmaları, kayıt filtreleri, arama, sayfalama ve CSV indirme mevcut. Sayfalar API’den gerçek ambar hesaplarını alıyor.
- Web uygulaması henüz yayımlanmadı. Docker, yerel uygulama çalıştıktan sonraki aşama.

## Çalışma biçimi ve sıradaki adım

Kullanıcıyla küçük adımlarla, açıklayarak ilerle. Kod sade, yorumlar kısa ve Türkçe olsun. Kullanıcı açıkça istediğinde dosyalara değişiklik yap; her adımda kapsamı gereksiz büyütme. GitHub’a gönderme kullanıcı istediğinde yapılır.

Üç sayfalı ilk sürüm kullanıcı incelemesine hazır. Sıradaki adım kullanıcıyla ekranları inceleyip tasarım ve içerik geri bildirimlerini uygulamak. Docker ve yayın ayrıca ele alınacak. Her çalışanın tek grupta sayılması için Karşılaştırmalar seçili dönemin son gözlemini kullanır; bu kural arayüzde açıklanır.

Üç sayfanın gerçek ambar verileriyle çalışması, filtrelerin SQL sonuçlarıyla doğrulanması, hazır soruların doğru cevaplanması ve README’de kaynak, sentetik veri açıklaması, kurulum ve ekran görüntülerinin bulunması tamamlanma koşullarıdır.


## Yıllık grafik güncellemesi

Kullanıcının isteğiyle Nabız’daki yıllık çubuklar alan grafiğine çevrildi. Varsayılan ölçü, o yıl gözlenen benzersiz çalışanlar içindeki ayrılma payı; ikinci seçenek ayrılan kişi sayısı. Nokta ayrıntıları, klavyeyle kayıt listesine geçiş ve bütün yılları gösteren çalışan/ayrılma/yüzde tablosu mevcut. Payda yıllık benzersiz çalışan sayısıdır; beş tekrar kaydı iki kez sayılmaz. Bu gösterim standart yıllık devir oranı olarak adlandırılmaz.

## Grafik ağırlıklı pano güncellemesi

Nabız’da altı grafik bulunur: yıllık alan, yıllık sebep bazında yığılmış sütun, sebeplerin halka grafiği, departman çubukları, ilk 10 mağaza ve ayrılma anındaki kıdem dağılımı. Ortak yıl filtresi özet sayıları ve son dört grafiği günceller. İlk iki grafik on yıllık bağlamı korur; yığılmış grafikte seçilen yıl vurgulanır. Sebep yüzdelerinin paydası seçilen dönemde ayrılanlar, departman paylarının paydası ilgili gruptaki benzersiz çalışanlardır. Mağazalar yalnızca STORES birimidir. Yığılmış grafiğin tam değerleri açılır tabloda, diğer grafiklerin değerleri doğrudan görünür.
