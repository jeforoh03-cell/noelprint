# Undangan Jesslyn — Mode Editor dan Tamu

Repositori: jeforoh03-cell/noelprint
Lokasi: undangan-jesslyn/

## Mode
- index.html — halaman tamu tanpa fitur pengeditan.
- tamu.html — halaman khusus untuk mengisi nama tamu / keluarga, membuat tautan, menyalin tautan, dan melihat cover penerima.
- editor.html — halaman editor lengkap dengan pengubahan konten, foto, galeri, rundown acara, dan tombol "Publikasikan ke GitHub".

## Alamat
- Tamu: https://jeforoh03-cell.github.io/noelprint/undangan-jesslyn/
- Isi nama tamu: https://jeforoh03-cell.github.io/noelprint/undangan-jesslyn/tamu.html
- Editor: https://jeforoh03-cell.github.io/noelprint/undangan-jesslyn/editor.html

## Mengubah undangan secara online
Cara cepat: buka halaman tamu tanpa parameter penerima, lalu pilih **Isi nama tamu / keluarga** di cover. Halaman `tamu.html` memakai alur yang sama dengan undangan ulang tahun Jesslyn:

1. Isi nama orang atau keluarga, misalnya **Keluarga Budi**.
2. Tekan **Buat Tautan Undangan**.
3. Pilih **Salin Tautan** untuk dibagikan, atau **Lihat Undangan** untuk memeriksa cover.

Nama disimpan dalam parameter `?to=` pada tautan, sehingga setiap tamu mendapat nama masing-masing tanpa publikasi ulang. Tombol pengisian nama disembunyikan pada tautan yang sudah memiliki penerima. Tautan lama `?edit=1` diarahkan ke halaman pengisian nama yang baru. Undangan tetap dimulai dari cover saat dibuka.

Untuk membuat nama penerima pada cover, buka **Editor → Edit Undangan → Buat tautan nama tamu / keluarga**. Isi nama, lalu pilih **Salin tautan tamu**. Setiap tautan menampilkan nama penerima masing-masing tanpa publikasi ulang. Nama default untuk tautan tanpa penerima dapat diisi pada **Data anak & keluarga → Nama tamu / keluarga default (opsional)**.

Contoh: `https://jeforoh03-cell.github.io/noelprint/undangan-jesslyn/?to=Keluarga%20Budi`

1. Buka halaman Editor dan tekan "Edit Undangan".
2. Ubah data undangan sesuai kebutuhan; tekan "Terapkan & Lihat" untuk pratinjau. Buka Edit Undangan lagi untuk publikasi.
3. Buat fine-grained Personal Access Token melalui GitHub → Settings → Developer settings → Personal access tokens → Fine-grained tokens.
4. Batasi token hanya untuk repo noelprint dan berikan izin **Contents: Read and write**.
5. Ketik token di formulir publikasi dalam editor (jangan membagikannya).
6. Klik **Publikasikan ke GitHub**; ketika berhasil, refresh halaman tamu setelah perubahan GitHub Pages dipublikasikan.

## Perhatian
- Website ini dihosting statis melalui GitHub Pages. Editor memublikasikan perubahan halaman tamu melalui API GitHub.
- Editor publik hanya dapat mengirim pembaruan bila memiliki token dengan izin tulis; halaman editor tidak menggunakan password statis di dalam kode.
- Token tidak disimpan di HTML undangan atau penyimpanan lokal.
- Undangan menggunakan tautan WhatsApp untuk konfirmasi kehadiran; tidak ada database RSVP.
- Saat dibuka online, editor memuat data undangan terbaru dari halaman tamu.
- GitHub Pages mungkin perlu diaktifkan pada Settings → Pages (Deploy from a branch → main → /(root)), jika situs belum tampil.


