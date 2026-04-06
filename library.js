// ============================================================
//  ARDUINO MPB — Biblioteca (exibição, busca, add, delete)
// ============================================================

// ── Definições de notas (pitches.h Arduino) ──────────────────
const DEFINES = `#define NOTE_B0  31
#define NOTE_C1  33
#define NOTE_CS1 35
#define NOTE_D1  37
#define NOTE_DS1 39
#define NOTE_E1  41
#define NOTE_F1  44
#define NOTE_FS1 46
#define NOTE_G1  49
#define NOTE_GS1 52
#define NOTE_A1  55
#define NOTE_AS1 58
#define NOTE_B1  62
#define NOTE_C2  65
#define NOTE_CS2 69
#define NOTE_D2  73
#define NOTE_DS2 78
#define NOTE_E2  82
#define NOTE_F2  87
#define NOTE_FS2 93
#define NOTE_G2  98
#define NOTE_GS2 104
#define NOTE_A2  110
#define NOTE_AS2 117
#define NOTE_B2  123
#define NOTE_C3  131
#define NOTE_CS3 139
#define NOTE_D3  147
#define NOTE_DS3 156
#define NOTE_E3  165
#define NOTE_F3  175
#define NOTE_FS3 185
#define NOTE_G3  196
#define NOTE_GS3 208
#define NOTE_A3  220
#define NOTE_AS3 233
#define NOTE_B3  247
#define NOTE_C4  262
#define NOTE_CS4 277
#define NOTE_D4  294
#define NOTE_DS4 311
#define NOTE_E4  330
#define NOTE_F4  349
#define NOTE_FS4 370
#define NOTE_G4  392
#define NOTE_GS4 415
#define NOTE_A4  440
#define NOTE_AS4 466
#define NOTE_B4  494
#define NOTE_C5  523
#define NOTE_CS5 554
#define NOTE_D5  587
#define NOTE_DS5 622
#define NOTE_E5  659
#define NOTE_F5  698
#define NOTE_FS5 740
#define NOTE_G5  784
#define NOTE_GS5 831
#define NOTE_A5  880
#define NOTE_AS5 932
#define NOTE_B5  988
#define NOTE_C6  1047
#define NOTE_CS6 1109
#define NOTE_D6  1175
#define NOTE_DS6 1245
#define NOTE_E6  1319
#define NOTE_F6  1397
#define NOTE_FS6 1480
#define NOTE_G6  1568
#define NOTE_GS6 1661
#define NOTE_A6  1760
#define NOTE_AS6 1865
#define NOTE_B6  1976
#define NOTE_C7  2093
#define NOTE_CS7 2217
#define NOTE_D7  2349
#define NOTE_DS7 2489
#define NOTE_E7  2637
#define NOTE_F7  2794
#define NOTE_FS7 2960
#define NOTE_G7  3136
#define NOTE_GS7 3322
#define NOTE_A7  3520
#define NOTE_AS7 3729
#define NOTE_B7  3951
#define NOTE_C8  4186
#define NOTE_CS8 4435
#define NOTE_D8  4699
#define NOTE_DS8 4978
#define REST      0`;

const ARDUINO_FOOTER = `
int notes = sizeof(melody) / sizeof(melody[0]) / 2;
int wholenote = (60000 * 4) / tempo;
int divider = 0, noteDuration = 0;

void setup() {
  for (int thisNote = 0; thisNote < notes * 2; thisNote = thisNote + 2) {
    divider = melody[thisNote + 1];
    if (divider > 0) { noteDuration = (wholenote) / divider; }
    else if (divider < 0) { noteDuration = (wholenote) / abs(divider); noteDuration *= 1.5; }
    tone(buzzer, melody[thisNote], noteDuration * 0.9);
    delay(noteDuration);
    noTone(buzzer);
  }
}

void loop() {}`;

// ── Estado ────────────────────────────────────────────────────
let selectedId = null;

// ── localStorage ─────────────────────────────────────────────
function getCustomSongs() {
  try { return JSON.parse(localStorage.getItem('mpb_songs') || '[]'); }
  catch { return []; }
}
function saveCustomSongs(songs) {
  localStorage.setItem('mpb_songs', JSON.stringify(songs));
}
function allSongs() {
  return [...BUILT_IN, ...getCustomSongs()];
}

// ── Montar código Arduino completo ───────────────────────────
function buildCode(song) {
  return `/*\n  ${song.name} - ${song.artist}\n  Buzzer no pino 11 | BPM: ${song.tempo}\n  Gerado por Arduino MPB — Biblioteca Musical\n*/\n${DEFINES}\n\nint tempo = ${song.tempo};\nint buzzer = 11;\n\nint melody[] = {\n  ${song.melody}\n};\n${ARDUINO_FOOTER}`;
}

function escHtml(t) {
  return t.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

// ── Renderizar cards ──────────────────────────────────────────
function renderLibrary() {
  const q = document.getElementById('searchInput').value.toLowerCase();
  const songs = allSongs().filter(s =>
    s.name.toLowerCase().includes(q) ||
    s.artist.toLowerCase().includes(q) ||
    (s.genre || '').toLowerCase().includes(q)
  );
  const customIds = getCustomSongs().map(s => s.id);
  const grid = document.getElementById('songGrid');

  if (!songs.length) {
    grid.innerHTML = '<div class="no-results">Nenhuma música encontrada.</div>';
    document.getElementById('codeArea').innerHTML = '';
    return;
  }

  grid.innerHTML = songs.map(s => `
    <div class="song-card${s.id === selectedId ? ' selected' : ''}" onclick="selectSong('${s.id}')">
      ${customIds.includes(s.id) ? '<span class="s-custom">✏️ minha</span>' : ''}
      <div class="s-bpm">${s.tempo} BPM</div>
      <div class="s-name">${s.name}</div>
      <div class="s-artist">${s.artist}</div>
      <span class="s-genre">${s.genre || 'MPB'}</span>
      ${customIds.includes(s.id)
        ? `<button class="btn-del" onclick="deleteSong(event,'${s.id}')" title="Remover">🗑️</button>`
        : ''}
    </div>`).join('');

  if (selectedId) renderCode(selectedId);
}

function selectSong(id) {
  selectedId = id;
  renderLibrary();
}

function renderCode(id) {
  const song = allSongs().find(s => s.id === id);
  if (!song) return;
  const code = buildCode(song);
  document.getElementById('codeArea').innerHTML = `
    <div class="codebox">
      <div class="codebox-hdr">
        <span class="song-lbl">📄 ${song.name} — ${song.artist}</span>
        <button class="copy-btn" onclick="copyCodeLib()">Copiar código</button>
      </div>
      <pre id="libPre">${escHtml(code)}</pre>
      <div class="tip">Copie, abra o <strong>Arduino IDE</strong>, cole e clique em <strong>Upload</strong>. Se o ritmo estiver errado, ajuste <code>int tempo</code>.</div>
    </div>`;
}

function copyCodeLib() {
  const el = document.getElementById('libPre');
  if (!el) return;
  navigator.clipboard.writeText(el.textContent).then(() => {
    const btn = document.querySelector('#codeArea .copy-btn');
    if (btn) { btn.textContent = 'Copiado!'; setTimeout(() => btn.textContent = 'Copiar código', 2000); }
  });
}

function deleteSong(e, id) {
  e.stopPropagation();
  if (!confirm('Remover esta música da biblioteca?')) return;
  saveCustomSongs(getCustomSongs().filter(s => s.id !== id));
  if (selectedId === id) {
    selectedId = null;
    document.getElementById('codeArea').innerHTML = '';
  }
  renderLibrary();
}

// ── Modal Adicionar ───────────────────────────────────────────
function openModal() {
  document.getElementById('addModal').classList.add('open');
}
function closeModal() {
  document.getElementById('addModal').classList.remove('open');
  ['addName','addArtist','addGenre','addTempo','addMelody'].forEach(id => {
    document.getElementById(id).value = '';
  });
}
function saveNewSong() {
  const name   = document.getElementById('addName').value.trim();
  const artist = document.getElementById('addArtist').value.trim();
  const melody = document.getElementById('addMelody').value.trim();
  if (!name || !artist || !melody) {
    alert('Preencha ao menos Nome, Artista e as Notas.'); return;
  }
  const tempo = parseInt(document.getElementById('addTempo').value) || 120;
  const genre = document.getElementById('addGenre').value.trim() || 'MPB';
  const id = 'custom_' + Date.now();
  const songs = getCustomSongs();
  songs.push({ id, name, artist, genre, tempo, melody });
  saveCustomSongs(songs);
  closeModal();
  selectedId = id;
  renderLibrary();
}

// ── Salvar música gerada pela IA ──────────────────────────────
function saveGeneratedSong(name, artist, tempo, melody) {
  const id = 'custom_' + Date.now();
  const songs = getCustomSongs();
  songs.push({ id, name, artist, genre: 'MPB', tempo, melody });
  saveCustomSongs(songs);
  selectedId = id;
  showTab('biblioteca', document.querySelectorAll('.tab')[0]);
  alert(`✅ "${name}" salva na biblioteca!`);
  renderLibrary();
}
