# Mercek’i Docker ile çalıştırma

Docker, uygulamanın kodunu ve ihtiyaç duyduğu çalışma ortamını imaj olarak paketler. Konteyner, bu imajın çalışan hâlidir. Compose ise birden fazla konteyneri birlikte başlatır.

## Bizim projede ne var?

```text
Tarayıcı → localhost:8080 → frontend (Nginx) → backend (FastAPI) → warehouse.duckdb
```

| Dosya | Görevi |
| --- | --- |
| `backend/Dockerfile` | Python, API kütüphaneleri, kod ve hazır ambar dosyasından API imajını oluşturur |
| `frontend/Dockerfile` | React’i Node.js ile derler; sonucu Nginx ile sunar |
| `frontend/nginx.conf` | Siteyi sunar; `/api` isteklerini backend konteynerine iletir |
| `compose.yaml` | İki servisi ve aralarındaki ağı birlikte yönetir |
| `.dockerignore`, `frontend/.dockerignore` | Özel ve gereksiz dosyaları derleme paketinden dışarıda tutar |

DuckDB bir dosya veritabanıdır; üçüncü bir veritabanı konteyneri gerekmiyor. Hazır sentetik `warehouse.duckdb`, backend imajına kopyalanır. API dosyayı salt okunur açar. Ham CSV, notebook ve kişisel bilgisayar dosyaları imaja alınmaz.

## 1. Docker Desktop’ı kur

Windows için [Docker Desktop kurulumunu](https://docs.docker.com/desktop/setup/install/windows-install/) takip et. Kurulumun istediği WSL 2 / yeniden başlatma adımlarını tamamla; Docker Desktop’ı aç ve Linux konteyner motorunun hazır olmasını bekle. Sonra yeni bir terminalde kontrol et:

```powershell
docker --version
docker compose version
docker info
```

Bu projeyi Docker ile çalıştıracak kişinin Python ve Node.js’i bilgisayarına ayrıca kurması gerekmez. İlk imaj oluşturulurken internet bağlantısı gerekir.

## 2. Proje ana klasöründe başlat

`compose.yaml` dosyasının bulunduğu klasörde:

```powershell
docker compose up --build -d
```

`--build` imajları hazırlar, `-d` servisleri terminali meşgul etmeden çalıştırır. Frontend, backend’in gerçek ambar sorgusu başarılı olduktan sonra başlar.

- Site: **http://localhost:8080**
- API kontrolü: **http://localhost:8080/api/summary**
- API dokümanı: **http://localhost:8080/docs**

Normal geliştirmedeki 5173 ve 8000 portları yerine tarayıcı tek bir adres kullanır. API’nin 8000 portu bilgisayara açılmaz; frontend bu servise Compose ağı üzerinden ulaşır. `backend`, ağdaki servis adıdır; bir şifre veya dış sunucu değildir.

## 3. Çalıştığını kontrol et

```powershell
docker compose ps
docker compose logs --tail=50
```

İki servisin de sağlıklı (`healthy`) olması beklenir. API kontrolünde toplam çalışan 6284, ayrılan çalışan 1485 dönmelidir. Asistana “2014 yılında kaç çalışan ayrıldı?” sorulduğunda 253 cevabı beklenir.

## 4. Kapat veya yeniden oluştur

```powershell
docker compose down
```

Bu komut projedeki konteynerleri ve Compose ağını kaldırır; bilgisayarındaki proje dosyalarını silmez. Veritabanı imaj içinde hazır bulunduğundan tekrar başlatıldığında aynı veri kullanılabilir. Bu sürüm veritabanına yazmaz; kullanıcı konuşmaları tarayıcı belleğindedir, kalıcı kaydedilmez.

Kod veya `warehouse.duckdb` değişirse tekrar `docker compose up --build -d` çalıştır. Normal Vite geliştirme sunucusundaki gibi canlı yenileme bu Docker düzeninde yoktur.

## Sık karşılaşılan durumlar

- **`docker` tanınmıyor:** Docker Desktop kurulmamış veya terminal kurulumdan sonra yeniden açılmamış olabilir.
- **Docker motoruna bağlanılamıyor:** Docker Desktop’ın açık ve motorunun hazır olduğunu kontrol et.
- **8080 portu kullanılıyor:** `compose.yaml` içindeki `127.0.0.1:8080:8080` satırında yalnızca `8080` kısmını, örneğin `8081` yap; siteyi yeni porttan aç.
- **Backend sağlıklı olmuyor:** `docker compose logs backend` ile hataya bak. Hazır ambarın `data/processed/warehouse.duckdb` içinde bulunduğunu kontrol et.

## Doğrulama durumu

18 Ekim 2026’da `docker compose up --build -d` ile iki imaj oluşturuldu ve iki konteyner de `healthy` durumuna geçti. Nginx üzerinden site, API dokümanı ve sorgular test edildi: toplam çalışan 6.284, ayrılan 1.485, 2014 ayrılma sayısı 253. Tarayıcıda pano, karşılaştırmalar ve 2014–2015 asistan tablosu kontrol edildi. Backend portu dışarıya açılmadı; site yalnızca `127.0.0.1:8080` üzerinde sunuluyor.

Başvuru: [Docker Compose başlangıç rehberi](https://docs.docker.com/compose/gettingstarted/) · [Çok aşamalı imaj oluşturma](https://docs.docker.com/build/building/multi-stage/).

## Çalışma yetkileri ve proxy kontrolleri

API `appuser`, Nginx `nginx` kullanıcısıyla çalışır; ikisinin de çalışma dosya sistemi salt okunurdur. Ek Linux yetkileri kaldırılmış, sonradan yetki kazanımı engellenmiştir. Nginx’in geçici dosyaları sınırlı `/tmp` alanında tutulur; konteyner içinde de 8080 portu kullanılır. Tarayıcı adresi değişmez: `http://localhost:8080`.

Nginx API servis adını Docker DNS üzerinden yeniden çözer; backend yeniden oluşturulursa eski adrese bağlı kalmaz. Bağlantı ve yanıt süreleri sınırlıdır. Sorgu parametreleri API’ye korunarak iletilir. İki konteynerin kullanıcı, sağlık ve salt okunur ayarları Docker üzerinde doğrulandı.
