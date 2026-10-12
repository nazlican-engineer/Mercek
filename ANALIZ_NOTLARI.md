# Çalışan ayrılma analizi — bulgular ve temizleme kararları

Son güncelleme: 12 Ekim 2026. Bu belge ilk inceleme ve keşif analizini özetler. Ham CSV değiştirilmemiştir. Aşağıdaki temizleme kararları henüz uygulanmamıştır.

## Kaynak ve kapsam

- Dosya: `data/raw/MFG10YearTerminationData.csv`.
- Kaynak: Lyndon Sundmark, [AIHR Employee Churn](https://www.aihr.com/blog/tutorial-people-analytics-r-employee-churn/).
- Arşivdeki açıklama: `data/raw/EmployeeChurn.rmd`.
- Veri tamamen kurgusal/sentetiktir; gerçek şirket sonuçları gibi sunulmaz.
- Kaynak açıklamasına göre her yılın sonunda aktif olanların kayıtları ile yıl içinde gerçekleşen ayrılmalar bir aradadır.
- İsim, maaş, mesai, memnuniyet, performans ve terfi bilgileri yoktur.
- Veri 2006–2015 dönemini kapsar. Sonraki yıllardaki çalışan durumları bilinmez.
- Lisans koşulları ayrıca doğrulanmamıştır.

## Sütunlar

| Sütun | Anlamı |
|---|---|
| EmployeeID | Çalışan kimliği; aynı çalışan farklı yıllarda tekrar eder |
| recorddate_key | Satırın temsil ettiği kayıt tarihi; sisteme giriş zamanını kanıtlamaz |
| birthdate_key | Doğum tarihi |
| orighiredate_key | İlk işe giriş tarihi |
| terminationdate_key | Ayrılma tarihi; 1900-01-01 özel işaret değeri olarak değerlendirilir |
| age | Kaynak kayıttaki yaş |
| length_of_service | Kaynak kayıttaki kıdem, yıl |
| city_name | Kayıttaki şehir; ikamet adresi olduğu kesinleştirilmemiştir |
| department_name | Departman |
| job_title | Unvan |
| store_name | Mağaza/birim numarası; mağaza adı veya adresi değildir |
| gender_short | Cinsiyet kısa kodu |
| gender_full | Cinsiyet açık yazımı |
| termreason_desc | Ayrılma sebebi |
| termtype_desc | Ayrılma türü |
| STATUS_YEAR | Kaydın ait olduğu yıl |
| STATUS | İlgili yıldaki ACTIVE veya TERMINATED durumu |
| BUSINESS_UNIT | STORES veya HEADOFFICE |

## Boyut ve çalışan durumları

| Ölçü | Sonuç |
|---|---:|
| Satır | 49.653 |
| Sütun | 18 |
| Benzersiz çalışan | 6.284 |
| Departman | 21 |
| ACTIVE satırı | 48.168 |
| TERMINATED satırı | 1.485 |
| Benzersiz ayrılan çalışan | 1.485 |
| Hiç TERMINATED kaydı olmayan çalışan | 4.799 |
| Hem ACTIVE hem TERMINATED kaydı bulunan çalışan | 1.339 |
| ACTIVE kaydı bulunmayan, yalnızca TERMINATED kaydı olan çalışan | 146 |

Satır sayısı çalışan sayısı değildir. TERMINATED kayıtlarında her ayrılan çalışan bir kez bulunur. Dönem boyunca ayrılanların benzersiz çalışanlar içindeki payı yaklaşık %23,63; ayrılmış satırların tüm satırlardaki payı yaklaşık %2,99'dur. Bunlar yıllık personel devir oranları değildir.

146 çalışanın 134'ü 2006'da, 13'ü işe girdiği yıl ayrılmıştır. Bu iki grup örtüşebilir; doğrudan toplanmaz. Hiçbiri 31 Aralık'ta ayrılmamıştır. Önceki aktif yılların veri kapsamı dışında olması veya işe girilen yıl içinde ayrılma olası açıklamalardır; tüm çalışanlar için neden kesinleştirilmemiştir.

## Eksik değerler ve özel işaretler

- İlk okumada Pandas'ın eksik kabul ettiği NaN hücre yoktur. Bu, verinin hatasız olduğunu göstermez.
- 42.450 satırda ayrılma tarihi `1900-01-01` olarak yazılmıştır. Bu tarih gerçek ayrılma tarihi olarak kullanılmayacaktır. Kaynak açıklamasında bu işaretin anlamı açıkça tanımlanmamıştır; kayıtlarla yapılan inceleme temel alınmıştır.
- ACTIVE satırların 42.450'sinde bu tarih işareti, 5.718'inde başka bir ayrılma tarihi vardır.
- Sebep ve tür sütunlarında 41.853'er `Not Applicable` vardır. Sebebi `Not Applicable` olan bütün satırlar ACTIVE'dir. Tersi geçerli değildir.
- ACTIVE satırların 6.315'inde sebep `Not Applicable` değildir. Geçmiş aktif kayıtlarda sonraki ayrılma bilgileri bulunabilir.
- `Not Applicable`, uygulanamaz anlamına gelir; tek başına günümüzde aktiflik göstergesi değildir.

## Ayrılma sebebi ve türü

| Sebep (kaynak yazımı) | Çalışan | Tür |
|---|---:|---|
| Retirement | 885 | Voluntary |
| Resignaton | 385 | Voluntary |
| Layoff | 215 | Involuntary |

Gönüllü ayrılma toplamı 1.270, gönülsüz ayrılma toplamı 215'tir. Sebep–tür çapraz tablosunda ters eşleşme yoktur. TERMINATED satırlarda sebep ve tür için `Not Applicable` bulunmamıştır. Kayıtlı sebep, modelin risk açıklamasından farklıdır; ilişkilerden kişisel ayrılma nedeni çıkarılmaz.

## Yaş, kıdem ve istifa

| Ölçü | Yaş | Kıdem (yıl) |
|---|---:|---:|
| Minimum | 19 | 0 |
| Maksimum | 65 | 26 |
| Ortalama | 42,08 | 10,43 |
| Medyan | 42 | 10 |

Bu özetler tüm satırlar üzerinden hesaplanmıştır; benzersiz çalışan ortalamaları değildir. Kıdemin 0 olması tam bir yılın tamamlanmadığı anlamına gelebilir. Kimlik ve mağaza kodlarının ortalaması yorumlanmaz.

Yaş ve kıdem kutu grafiklerinde standart 1,5 × IQR ölçütüne göre aykırı değer görünmemiştir. Bu nedenle kayıt silinmemiştir. Kıdemi yaşından büyük kayıt bulunmamıştır.

| Ayrılma sebebi | Ortalama kıdem | Ortalama yaş |
|---|---:|---:|
| Layoff | 11,95 | 40,80 |
| Resignaton | 4,64 | 30,10 |
| Retirement | 14,15 | 63,34 |

İstifalarda 1 yıl kıdemli 132 kişi, 0 yıl kıdemli 31 kişi vardır. Toplam 163 kişi, 385 istifanın yaklaşık %42,3'üdür. Bu dağılım istifa riskini tek başına göstermez; payda olarak ilgili kıdemdeki çalışanların sayısı ve gözlem süresi gerekir.

## Departman analizleri

En çok ayrılma Meats (377), Produce (353), Customer Service (262), Dairy (191), Bakery (112) ve Processed Foods (90) departmanlarındadır. İlk üç departman 992 ayrılmayla toplamın yaklaşık %66,8'ini oluşturur.

Departman bazında farklı ayrılan çalışan / o departmanda kaydı bulunan farklı çalışan hesaplanmıştır. Accounting ve bazı merkez ofis departmanlarında %100 bulunmuştur. Bu, dönem içinde veride görülen bütün çalışanların ayrılma kaydı olduğunu gösterir; aynı anda ayrılma veya güncel risk anlamına gelmez. Departman değiştiren çalışanlar farklı departmanların toplamlarında sayılabilir.

Notebook'ta departman–yıl ayrılma sayıları, departman–sebep çapraz tablosu, departman ayrılma payı grafiği ve çalışan sayılarına göre Layoff payı grafiği hazırlanmıştır.

## Cinsiyet analizleri

| Cinsiyet | Ayrılma payı (%) | İstifa payı (%) | Layoff | Resignaton | Retirement | Toplam ayrılan |
|---|---:|---:|---:|---:|---:|---:|
| Female | 27,91 | 6,44 | 113 | 211 | 591 | 915 |
| Male | 18,96 | 5,79 | 102 | 174 | 294 | 570 |

Paylar ilgili cinsiyetteki farklı çalışan sayısına göre, bütün dönem üzerinden hesaplanmıştır. İstifa payı farkı yaklaşık 0,65 yüzde puandır. Sayı olarak en büyük ayrılma farkı emekliliktedir. Bu gözlemler nedensellik veya istatistiksel anlamlılık kanıtlamaz.

## Şehir ve mağaza analizleri

- Şehir bazında en çok ayrılma Vancouver (296), Victoria (151), Nanaimo (82) kayıtlarındadır.
- `New Westminster` altında 70, `New Westminister` altında 44 ayrılan çalışan vardır. Birlikte benzersiz ayrılan sayısı 114'tür.
- İlk yazım mağaza 21, ikinci yazım mağaza 20 ile eşleşir. Bütün kayıtlarda iki yazım arasında ortak EmployeeID bulunmamıştır.
- [Resmî şehir adı New Westminster'dır](https://www.newwestcity.ca/). Bu, kaynak dosyadaki iki kategorinin aynı şehri temsil ettiğini tek başına kanıtlamaz. Farklı mağaza veya çalışan grupları da farklı şehir olduklarını kanıtlamaz. İki yazım şimdilik korunacaktır.
- `store_name = 35` içinde 585 HEADOFFICE, 558 STORES satırı vardır. Bunlar satır sayılarıdır.
- İş birimi filtresi olmadan 35 kodunda 207 ayrılan çalışan sayılmıştır. Yalnızca STORES seçilince sayı 138'dir. İlk hesap iki defa sayma hatası değil, iki iş birimini birlikte gruplama sorunudur.
- Mağaza analizleri sadece STORES üzerinden hesaplanmıştır. 35'te 138, 37'de 102, 18'de 82 ayrılan çalışan vardır.
- Bazı mağazalarda dönemlik ayrılma payı %100'dür. Küçük ve büyük paydalar vardır: mağaza 4 için 1/1, mağaza 37 için 102/102. Mağaza 35 için 138/141 ≈ %97,87.
- Mağaza 37'de 93 emeklilik ve 9 Layoff bulunur; istifa yoktur. Emeklilikler dönem boyunca, 9 Layoff'un tamamı 2015'te gerçekleşmiştir. Mağazanın kapandığı kanıtlanmamıştır.

## Tarih ve kayıt tutarlılığı

- İşe giriş, ayrılma, doğum ve kayıt tarihleri tarihe çevrilebilmiştir; okunamayan değer sayıları 0'dır.
- 1900 işareti dışarıda bırakıldığında ayrılma tarihi işe girişten önce olan kayıt yoktur.
- TERMINATED kayıtlarında 1900 tarih işareti yoktur.
- TERMINATED kayıtlarının ayrılma yılı STATUS_YEAR ile eşleşir.
- Bütün kayıtların recorddate_key yılı STATUS_YEAR ile eşleşir.
- Doğum tarihi işe giriş tarihinde veya sonrasında olan kayıt yoktur.
- ACTIVE kayıtların hiçbiri işe girişten önce değildir.
- Ayrılma tarihinden kesin olarak sonra ACTIVE görünen kayıt yoktur. Bu kontrolde `<` kullanılır; aynı günler ayrı değerlendirilir.
- Çalışan bazında doğum ve ilk işe giriş tarihleri sabittir. 1900 işareti dışarıda bırakıldığında birden fazla farklı ayrılma tarihi olan çalışan yoktur.

### Aynı çalışan–yıl için çift kayıtlar

Tamamen aynı satır tekrarı yoktur. EmployeeID × STATUS_YEAR bazında 5 ek satır vardır. Çalışanlar: 3008 (2007), 3401 (2008), 7007 (2009), 7023 (2014), 8296 (2013).

Bu eşleşmelerde ACTIVE ve TERMINATED birlikte bulunur. ACTIVE kayıt tarihi ile ayrılma tarihi aynı yılın 31 Aralık günüdür. Gün içi sıralama bilinmez; otomatik olarak hatalı ilan edilmemiştir. Kullanıcının kararıyla iki kayıt da temizlenmiş analiz tablosunda korunacaktır. Modelde nasıl kullanılacakları ayrıca kararlaştırılacaktır.

### Kayıt tarihi işe girişten önce olan iki satır

| EmployeeID | Kayıt tarihi | İşe giriş | Ayrılma | Fark |
|---|---|---|---|---|
| 6918 | 2008-03-01 | 2008-03-10 | 2008-03-13 | Kayıt tarihi girişten 9 gün önce |
| 8264 | 2013-08-01 | 2013-08-27 | 2013-08-30 | Kayıt tarihi girişten 26 gün önce |

İkisi de TERMINATED'dir ve girişten 3 gün sonra ayrılmıştır. 1.485 TERMINATED kaydının tamamında kayıt tarihi ayın ilk günüdür. Bu, sistematik bir ay başlangıcı kuralı olasılığını destekler; kayıt ayı ile ayrılma ayının tüm satırlarda eşleşmesi kesinleştirilmemiştir. Kaynak açıklaması bu kuralı açıkça tanımlamaz. İki satır korunacak ve işaretlenecektir.

## Onaylanan temizleme kararları

1. Ham CSV korunur; temizlenmiş çıktı ayrı oluşturulur.
2. Dört tarih sütunu tarih tipine çevrilir.
3. Ayrılma tarihindeki 1900-01-01 işaretleri eksik değere (NaT/NULL) çevrilir.
4. Beş çalışan–yıl eşleşmesindeki ACTIVE ve TERMINATED satırları korunur; otomatik silinmez.
5. Kayıt tarihi işe girişten önce olan iki satıra `date_conflict_flag = True` atanır. Diğer satırlarda False olur. Bu işaret kesin hata veya silme kararı değildir. Tarihler değiştirilmez.
6. `Resignaton` yazımı temizlenmiş çıktıda `Resignation` yapılır.
7. Şehir adları aynı kalır. `Not Applicable` için ayrıca bir dönüşüm onaylanmamıştır.

## Model ve ambar için açık noktalar

- Analiz tablosu ile model özellik tablosu ayrı hazırlanacaktır. Kayıtları korumak, her satırı modele olduğu gibi vermek anlamına gelmez.
- Ayrılma tarihi, sebebi, türü ve STATUS özellik olamaz. STATUS hedef etiket oluşturmak için kullanılabilir. EmployeeID kimlik içindir.
- Geçmiş ACTIVE kayıtlarda sonraki ayrılma bilgisinin bulunması nedeniyle veri sızıntısına dikkat edilir.
- Hedef henüz kesinleştirilmelidir: o yıl ayrıldı mı, gelecek 12 ayda ayrılır mı veya yalnızca istifa mı? Bunlar farklı problemlerdir.
- Tahmin anında hangi özelliklerin bilinebileceği ve zaman temelli değerlendirme ayrıca tasarlanacaktır. İki tarih satırının model etkisi eğitim yapılmadan kesinleştirilemez.
- Çift kayıtları koruyan tablo EmployeeID × STATUS_YEAR bazında benzersiz değildir. Ambarın tek satırlık çalışan–yıl hedefi ile bu kararın nasıl uzlaştırılacağı ayrıca ele alınmalıdır.
- Dönemlik farklı çalışan payları yıllık devir oranı veya geleceğe yönelik risk değildir. Sentetik bulgular gerçek şirketlere doğrudan genellenmez.

## Sonraki adım

Onaylanan temizleme işlemlerini küçük adımlarla uygulamak; her adımda değişen değer sayısını ve korunması gereken satır/çalışan sayılarını kontrol etmek. Beklenen satır sayısı 49.653, farklı çalışan sayısı 6.284'tür. Bu belge oluşturulurken temizlik uygulanmamıştır.
