// ============================================================
//  ARDUINO MPB — Geração com IA (Groq API — gratuita)
//  Modelo: llama-3.3-70b-versatile
// ============================================================

// Sugestões de músicas para os chips de atalho
const MPB_CHIPS = [
  'Cálice - Chico Buarque',
  'Flor de Maracujá - Tim Maia',
  'Preciso me Encontrar - Cartola',
  'Coração de Estudante - Milton Nascimento',
  'Beto Bom de Bola - Jorge Ben Jor',
  'Menina Moça - Roberto Carlos',
  'Cigano - Maria Bethânia',
  'Travessia - Milton Nascimento',
  'O Barquinho - Roberto Menescal',
  'Meu Caro Amigo - Chico Buarque'
];

// Guarda o último código gerado para poder salvar
let lastGenCode   = '';
let lastGenName   = '';
let lastGenArtist = '';
let lastGenTempo  = 120;
let lastGenMelody = '';

// ── Inicializar chips de atalho ───────────────────────────────
function initChips() {
  document.getElementById('mpbChips').innerHTML = MPB_CHIPS.map(s =>
    `<span class="chip" onclick="setChip('${s}')">${s.split(' - ')[0]}</span>`
  ).join('');
}

function setChip(name) {
  document.getElementById('songInput').value = name;
  generateWithGroq();
}

// ── Mostrar/ocultar chave ─────────────────────────────────────
function toggleKey() {
  const inp = document.getElementById('groqKey');
  const btn = document.getElementById('toggleKeyBtn');
  if (inp.type === 'password') {
    inp.type = 'text';
    btn.textContent = 'Ocultar';
  } else {
    inp.type = 'password';
    btn.textContent = 'Mostrar';
  }
}

// ── Gerar música com Groq ─────────────────────────────────────
async function generateWithGroq() {
  const song   = document.getElementById('songInput').value.trim();
  const apiKey = document.getElementById('groqKey').value.trim();
  const status = document.getElementById('genStatus');

  if (!song)   return;
  if (!apiKey) { status.textContent = '❌ Insira sua chave do Groq antes de gerar.'; return; }

  const btn = document.getElementById('genBtn');
  btn.disabled = true;
  btn.textContent = 'Gerando...';
  status.textContent = '⏳ A IA está compondo a música...';
  document.getElementById('genResult').style.display = 'none';

  const systemPrompt = `Você é especialista em converter músicas em código Arduino para buzzer piezoelétrico.
Gere o código COMPLETO e FIEL à melodia original.
Responda APENAS com o código Arduino puro, sem markdown, sem crases, sem explicações.
Buzzer sempre no pino 11. Use o BPM real da música. Inclua TODOS os #define de notas.
Notas pontuadas = valores negativos (ex: -4). Use REST para silêncios.

FORMATO OBRIGATÓRIO:
/*
  [Nome da Música] - [Artista]
  Buzzer no pino 11.
*/
#define NOTE_B0  31
... (todos os defines até NOTE_DS8 e REST)
#define REST      0

int tempo = [BPM real];
int buzzer = 11;

int melody[] = {
  [notas reais da música, par NOTA,DURACAO]
};

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

  try {
    const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model: 'llama-3.3-70b-versatile',
        max_tokens: 4000,
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user',   content: `Gere o código Arduino completo para tocar "${song}" no buzzer pino 11. Seja fiel às notas e BPM originais da música.` }
        ]
      })
    });

    const data = await res.json();
    if (data.error) throw new Error(data.error.message);

    const code = data.choices[0].message.content.trim();
    lastGenCode = code;

    // Extrair nome, artista, tempo e melody do código gerado
    const headerMatch = code.match(/\/\*\s*\n\s*(.+?)\s*-\s*(.+?)\n/);
    lastGenName   = headerMatch ? headerMatch[1].trim() : song;
    lastGenArtist = headerMatch ? headerMatch[2].trim() : 'Desconhecido';

    const tempoMatch  = code.match(/int tempo\s*=\s*(\d+)/);
    lastGenTempo = tempoMatch ? parseInt(tempoMatch[1]) : 120;

    const melodyMatch = code.match(/int melody\[\] = \{([\s\S]*?)\};/);
    lastGenMelody = melodyMatch ? melodyMatch[1].trim() : '';

    // Exibir resultado
    document.getElementById('genOut').textContent  = code;
    document.getElementById('genLbl').textContent  = `📄 ${lastGenName} — ${lastGenArtist}`;
    document.getElementById('genResult').style.display = 'block';
    status.textContent = '✅ Código gerado! Copie e cole no Arduino IDE, ou salve na biblioteca.';

  } catch (err) {
    status.textContent = '❌ Erro: ' + err.message;
  }

  btn.disabled = false;
  btn.textContent = 'Gerar código';
}

// ── Copiar código gerado ──────────────────────────────────────
function copyGen() {
  navigator.clipboard.writeText(document.getElementById('genOut').textContent).then(() => {
    const b = document.querySelector('#genResult .copy-btn');
    if (b) { b.textContent = 'Copiado!'; setTimeout(() => b.textContent = 'Copiar código', 2000); }
  });
}

// ── Salvar na biblioteca ──────────────────────────────────────
function saveGenerated() {
  if (!lastGenCode) return;
  if (!lastGenMelody) {
    alert('Não foi possível extrair as notas. Tente usar "Adicionar música" manualmente.'); return;
  }
  saveGeneratedSong(lastGenName, lastGenArtist, lastGenTempo, lastGenMelody);
}
