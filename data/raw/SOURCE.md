# Veri kaynağı

İndirme tarihi: 8 Ekim 2026.

Kaynak: Lyndon Sundmark, AIHR Employee Churn tutorial.
https://www.aihr.com/blog/tutorial-people-analytics-r-employee-churn/

İndirilen arşiv:
https://www.aihr.com/wp-content/uploads/2016/09/Datasets-Tutorial-People-Analytics.zip

Arşivden `MFG10YearTerminationData.csv` çıkarıldı. Ham CSV değiştirilmedi. Veri tamamen kurgusaldır (sentetik); gerçek şirket çalışanları değildir. Lisans koşulları ayrıca doğrulanmadı.

Ham veri: 49.653 satır, 18 sütun, 6.284 benzersiz çalışan; 2006–2015. TERMINATED kayıtları: 1.485; emeklilik 885, istifa 385, işten çıkarılma 215. `Resignaton` kaynak dosyadaki yazımdır.

Aynı çalışan/yıl çiftinde beş fazla kayıt vardır. Aynı yıl ACTIVE ve TERMINATED kayıtları birlikte bulunduğu için kullanıcının kararıyla korundular. Dolayısıyla çalışan-yıl çifti tek başına benzersiz satır anahtarı değildir.

Ham veride boş hücre yok; `1900-01-01` ve `Not Applicable` gibi işaret değerleri var. Temizlenmiş ayrı dosyada 1900-01-01 tarihleri boş değere çevrildi, tarih türleri düzenlendi ve Resignaton yazımı Resignation yapıldı. İki tarih tutarsızlığı işaretlendi. Şehir yazımları birleştirilmedi. Ham veri korunuyor.

İsim, maaş, mesai ve memnuniyet alanları yok. ACTIVE kayıtlarında daha sonraki ayrılmaların bilgileri bulunabileceği için ayrılma sayıları gerçek TERMINATED olaylarından hesaplanır. Tarih filtresinde `recorddate_key` ile gerçek ayrılma tarihi karıştırılmamalıdır.

İlk veri kontrolünün sayıları ve dosya özeti: `dataset_summary.json`. Ayrıntılı güncel bulgular: `ANALIZ_NOTLARI.md`.
