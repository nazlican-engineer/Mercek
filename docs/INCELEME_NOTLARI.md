# Mercek: sorgu, Docker, proxy ve arayüz incelemesi

18 Ekim 2026. Paylaşılan yapılacaklar dosyası `0/0` ve “incelenmeyi bekleyen dosyalar” satırından oluşuyordu; ayrıntılı eksik maddeleri yoktu. Aşağıdaki maddeler, belirtilen dosyaların doğrudan incelenmesiyle bulundu ve giderildi.

- [x] **Kıdem sınırı:** “İlk iki yıl” artık `kıdem < 2`; “en fazla 2 yıl” `kıdem <= 2`. İlk iki yılda istifa edenlerin sayısı 163.
- [x] **Tarih sırası:** ISO ve gün/ay/yıl biçimleri birlikte yazıldığında sorudaki sıra korunuyor. Ters tarih ve yıl aralıkları açıklama isteğiyle karşılanıyor.
- [x] **Mağaza toplamı:** Mağaza bazlı cevapta toplam ve satırların ikisi de yalnızca STORES birimini kapsıyor.
- [x] **Sorgu güvenliği:** Asistan kullanıcı metnini SQL olarak çalıştırmıyor; sabit salt okunur sorguları kullanıyor. API filtre değerleri parametreli kalıyor. SQL benzeri metinlerin tabloyu değiştirmediği ve filtreyi genişletmediği kontrol edildi.
- [x] **Docker yetkileri:** API zaten yönetici olmayan kullanıcıdaydı; Nginx de bu düzene geçirildi. İki serviste salt okunur dosya sistemi, tüm ek yetkilerin kaldırılması ve sonradan yetki kazanımının engellenmesi doğrulandı.
- [x] **Proxy:** Docker DNS çözümlemesi ve bağlantı/yanıt süreleri tanımlandı. API yolları ve parametreleri korundu; site ve API dokümanı kontrol edildi.
- [x] **CSV:** Formül olarak yorumlanabilecek metinler etkisizleştiriliyor; Türkçe, tırnak ve sayısal değerler korunuyor.
- [x] **İstek yönetimi:** Hızlı filtre değişiminde eski veri gösterilmiyor. İstekler iptal edilebiliyor ve 20 saniyede zaman aşımına uğruyor; tekrar deneme korunuyor.

## Kontroller

- `python -m unittest discover -s tests -v`: 11 test grubu geçti; beklenen sonuçlar temiz CSV ile karşılaştırıldı.
- `node --test frontend/src/csv.test.js`: 2 test geçti.
- Docker Compose imajları oluşturuldu; iki konteyner de sağlıklı.
- Nginx/Compose üzerinden API özeti, asistan, API dokümanı ve sorgu parametreleri doğrulandı.
- Frontend derlemesi geçti. Kod kontrolünde yalnızca mevcut `components.jsx` Fast Refresh uyarıları kaldı; hata yok.

Bu kayıt, paylaşılan dosyada bulunmayan bir yapılacaklar listesinin tamamlandığı anlamına gelmez. Ayrıntılı liste paylaşılırsa ayrıca karşılaştırılmalıdır.
