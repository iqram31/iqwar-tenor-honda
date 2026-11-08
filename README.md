# Simulasi Kredit Motor Honda

Aplikasi React + Vite untuk menghitung simulasi kredit motor Honda: pilih motor, tipe dan warna, atur uang muka (DP) atau angsuran, lalu bandingkan angsuran tiap tenor.

**Demo:** https://iqram31.github.io/iqwar-tenor-honda/

## Fitur
- 33 model Honda (Matic, Cub, Sport, EV) beserta harga OTR per tipe dari [astra-honda.com](https://www.astra-honda.com/product)
- Pilih tipe/varian dan warna motor
- Slider DP (5%–80% OTR) dan slider angsuran (dua arah, saling terhubung)
- Kartu tenor 11, 17, 23, 29, 35 bulan
- Ringkasan: pokok hutang, total bunga, total dibayar
- Bunga flat per tenor bisa diatur sendiri
- Bagikan hasil simulasi via WhatsApp

## Rumus
Bunga flat (umum di leasing motor):

```
Pokok    = OTR - DP
Bunga    = Pokok × bunga_flat_per_tahun × (tenor / 12)
Angsuran = (Pokok + Bunga) / tenor
```

Default bunga flat: 11 bln 28%, 17 bln 27%, 23 bln 26%, 29 bln 25%, 35 bln 24% per tahun.
Hasilnya estimasi. Angsuran sebenarnya tergantung leasing, wilayah, asuransi dan promo.

## Menjalankan
```bash
npm install
npm run dev        # development
npm run build      # build ke folder dist
npm run fetch-data # perbarui harga dari API astra-honda.com
```

## Deploy
Setiap push ke `main` otomatis di-deploy ke GitHub Pages lewat GitHub Actions (`.github/workflows/deploy.yml`).
Di repo GitHub, buka **Settings → Pages → Source** lalu pilih **GitHub Actions**.
