/**
 * Semua string antarmuka. Komponen tidak boleh meng-hardcode teks UI —
 * ambil lewat `useTranslations(lang)` dari ./utils.
 */
export const languages = {
  id: 'Bahasa Indonesia',
  en: 'English',
} as const;

export type Lang = keyof typeof languages;
export const defaultLang: Lang = 'id';
export const langs = Object.keys(languages) as Lang[];

/** Kode BCP 47 untuk <html lang>, hreflang, dan Intl. */
export const locales: Record<Lang, string> = {
  id: 'id-ID',
  en: 'en-US',
};

export const ui = {
  id: {
    'site.title': 'Evolusi Dunia',
    'site.tagline': 'Dari dinosaurus pertama sampai kecerdasan buatan',
    'site.description':
      'Perjalanan 252 juta tahun dalam lima belas bab: dari Trias saat dinosaurus pertama muncul sampai era kecerdasan buatan, dengan angka waktu yang merujuk ke sumber ilmiah.',
    'skip.toContent': 'Lewati ke konten utama',
    'nav.label': 'Navigasi utama',
    'nav.home': 'Beranda',
    'nav.eras': 'Semua era',
    'lang.label': 'Pilih bahasa',
    'lang.current': 'Bahasa saat ini',
    'breadcrumb.label': 'Jejak navigasi',
    'era.readMore': 'Selengkapnya',
    'era.readMoreAbout': 'Selengkapnya tentang {title}',
    'era.chapter': 'Bab',
    'era.of': 'dari',
    'era.range': 'Rentang waktu',
    'era.keyEvents': 'Peristiwa kunci',
    'era.sources': 'Sumber',
    'era.sourcesNote':
      'Angka waktu geologi mengikuti International Chronostratigraphic Chart (ICS) edisi 2026/06.',
    'era.backToHome': 'Kembali ke era ini di beranda',
    'era.prev': 'Era sebelumnya',
    'era.next': 'Era berikutnya',
    'era.pagination': 'Navigasi antar-era',
    'era.needsReview':
      'Sebagian klaim di halaman ini ditulis dengan hati-hati dan masih menunggu tinjauan ahli.',
    'era.imageCredit': 'Kredit',
    'era.imageLicense': 'Lisensi',
    'era.imageSource': 'Sumber',
    'eras.title': 'Semua era',
    'eras.lead':
      'Lima belas bab sejarah Bumi dan manusia, diurutkan dari yang tertua. Skala waktunya tidak linear: bab-bab awal mencakup puluhan juta tahun, bab terakhir hanya beberapa dekade.',
    'eras.span': 'Rentang',
    'time.yearsAgo': 'tahun lalu',
    'time.bce': 'SM',
    'time.ce': 'M',
    'time.now': 'kini',
    'time.million': 'juta',
    'time.thousand': 'ribu',
    'time.years': 'tahun',
    'time.later': 'kemudian',
    'time.jump': '{span} kemudian',
    'time.scaleLabel': 'Skala waktu logaritmik',
    'time.scaleNote': 'Posisi pada garis ini mengikuti skala logaritmik agar sejarah manusia tetap terlihat.',
    'home.eyebrow': 'Sebuah atlas waktu',
    'home.title.line1': 'Evolusi',
    'home.title.line2': 'Dunia',
    'home.lead':
      'Dua ratus lima puluh dua juta tahun, dari daratan tunggal Pangea sampai jaringan mesin yang belajar. Gulir untuk berjalan maju melintasi waktu.',
    'home.scrollHint': 'Gulir untuk mulai',
    'home.skipIntro': 'Lewati intro',
    'home.outro.eyebrow': 'Akhir perjalanan, untuk saat ini',
    'home.outro.title': 'Satu titik cahaya',
    'home.outro.body':
      'Dari 251,9 juta tahun lalu sampai hari ini: benua bergeser dan bertabrakan, dinosaurus datang lalu punah, mamalia berkembang, genus Homo menyebar ke seluruh dunia, dan dalam beberapa ribu tahun terakhir manusia belajar menulis, membangun mesin, lalu menghubungkan dunia lewat jaringan. Semua itu terjadi di satu planet kecil.',
    'home.outro.cta': 'Lihat daftar semua era',
    'home.outro.stat1': 'tahun ditempuh',
    'home.outro.stat2': 'bab',
    'home.outro.stat3': 'sumber dirujuk',
    'globe.label': 'Globe: rekonstruksi benua pada masa {title}',
    'globe.static': 'Gambar statis globe dengan garis pantai rekonstruksi untuk {title}',
    'globe.drag': 'Seret untuk memutar globe',
    'footer.note':
      'Dibuat sebagai proyek edukasi. Angka dan klaim merujuk ke sumber yang tercantum di tiap halaman era.',
    'footer.credits': 'Kredit & lisensi',
    'footer.source': 'Kode sumber',
    'footer.data':
      'Paleogeografi: model lempeng Müller dkk. (2019), EarthByte/GPlates, CC BY-SA 4.0.',
    'notFound.title': 'Halaman tidak ditemukan',
    'notFound.body': 'Halaman yang Anda cari tidak ada, atau mungkin telah hilang ditelan waktu.',
    'notFound.home': 'Kembali ke beranda',
  },
  en: {
    'site.title': 'Evolution of the World',
    'site.tagline': 'From the first dinosaurs to artificial intelligence',
    'site.description':
      'A 252-million-year walk in fifteen chapters, from the Triassic and the first dinosaurs to the age of AI, with every date traced to a scientific source.',
    'skip.toContent': 'Skip to main content',
    'nav.label': 'Main navigation',
    'nav.home': 'Home',
    'nav.eras': 'All eras',
    'lang.label': 'Choose language',
    'lang.current': 'Current language',
    'breadcrumb.label': 'Breadcrumb',
    'era.readMore': 'Read more',
    'era.readMoreAbout': 'Read more about {title}',
    'era.chapter': 'Chapter',
    'era.of': 'of',
    'era.range': 'Time span',
    'era.keyEvents': 'Key events',
    'era.sources': 'Sources',
    'era.sourcesNote':
      'Geological dates follow the International Chronostratigraphic Chart (ICS), 2026/06 edition.',
    'era.backToHome': 'Back to this era on the home page',
    'era.prev': 'Previous era',
    'era.next': 'Next era',
    'era.pagination': 'Era navigation',
    'era.needsReview':
      'Some claims on this page are written conservatively and are still awaiting expert review.',
    'era.imageCredit': 'Credit',
    'era.imageLicense': 'License',
    'era.imageSource': 'Source',
    'eras.title': 'All eras',
    'eras.lead':
      'Fifteen chapters of Earth and human history, oldest first. The time scale is not linear: the early chapters span tens of millions of years, the last one only a few decades.',
    'eras.span': 'Span',
    'time.yearsAgo': 'years ago',
    'time.bce': 'BCE',
    'time.ce': 'CE',
    'time.now': 'today',
    'time.million': 'million',
    'time.thousand': 'thousand',
    'time.years': 'years',
    'time.later': 'later',
    'time.jump': '{span} later',
    'time.scaleLabel': 'Logarithmic time scale',
    'time.scaleNote': 'Positions on this line follow a logarithmic scale so that human history stays visible.',
    'home.eyebrow': 'An atlas of time',
    'home.title.line1': 'Evolution of',
    'home.title.line2': 'the World',
    'home.lead':
      'Two hundred and fifty-two million years, from the single landmass of Pangaea to networks of machines that learn. Scroll to move forward through time.',
    'home.scrollHint': 'Scroll to begin',
    'home.skipIntro': 'Skip intro',
    'home.outro.eyebrow': 'The end of the road, for now',
    'home.outro.title': 'A single point of light',
    'home.outro.body':
      'From 251.9 million years ago to today: continents drifted and collided, dinosaurs rose and vanished, mammals spread out, the genus Homo walked across the globe, and in the last few thousand years people learned to write, built machines, and wired the world together. All of it happened on one small planet.',
    'home.outro.cta': 'See the list of all eras',
    'home.outro.stat1': 'years travelled',
    'home.outro.stat2': 'chapters',
    'home.outro.stat3': 'sources cited',
    'globe.label': 'Globe: reconstructed continents during the {title}',
    'globe.static': 'Static globe image with reconstructed coastlines for the {title}',
    'globe.drag': 'Drag to rotate the globe',
    'footer.note':
      'An educational project. Figures and claims are traced to the sources listed on each era page.',
    'footer.credits': 'Credits & licences',
    'footer.source': 'Source code',
    'footer.data':
      'Palaeogeography: Müller et al. (2019) plate model, EarthByte/GPlates, CC BY-SA 4.0.',
    'notFound.title': 'Page not found',
    'notFound.body': 'The page you are looking for does not exist, or it may have been lost to time.',
    'notFound.home': 'Back to the home page',
  },
} as const satisfies Record<Lang, Record<string, string>>;

export type UIKey = keyof (typeof ui)['id'];
