import { WEAPON_DATA } from '../weapons/WeaponData.js';

function buildWeaponTable() {
  let html = '<div class="stat-table">';
  html += 'Nome           | Dano | Alcance | Munição | Custo                | Cooldown\n';
  html += '───────────────┼──────┼─────────┼─────────┼──────────────────────┼─────────\n';
  for (const [key, w] of Object.entries(WEAPON_DATA)) {
    const cost = Object.entries(w.ammoCost).map(([k,v]) => `${v} ${k}`).join('+');
    const alt = w.ammoCostAlt ? ' ou ' + Object.entries(w.ammoCostAlt).map(([k,v]) => `${v} ${k}`).join('+') : '';
    html += `${w.name.padEnd(15)}| ${String(w.damage).padEnd(5)}| ${(w.range + 'r').padEnd(8)}| ${String(w.maxAmmo).padEnd(8)}| ${(cost + alt).padEnd(21)}| ${w.cooldown / 1000}s\n`;
  }
  html += '</div>';
  return html;
}

const ENEMY_STATS = `
<div class="stat-table">Tipo        | HP     | Dano | Alcance | Velocidade | Cooldown  | Especial
────────────┼────────┼──────┼─────────┼────────────┼───────────┼──────────
Terrestrial | 2-4    | 1    | 0.6r    | 35         | 1500ms    | Nenhum
Eagle       | 2-3    | 1-1.5| 1.5r    | 80         | 1200ms    | Voa (ignora obstáculos)
Guardian    | 5-10   | 3    | 0.5r    | 22         | 2000ms    | Tanque lento
Scout       | 5      | 1    | 0.8r    | 55         | 800ms     | Prioriza estruturas</div>`;

const STRUCTURE_STATS = `
<div class="stat-table">Estrutura      | Tempo Build | Função
───────────────┼─────────────┼────────────────────────────
Miner          | 20s         | Coloque em depósito. Produz recurso continuamente.
Belt           | 3s          | Transporta itens. R para girar direção.
Distillation   | 45s         | 1 Carbon → 3 DistilCarbon
Compression    | 1m 20s      | 2 Powder → 1 CompressedPowder
Biological     | 2m          | 2 Carbon → 1 Diamond</div>`;

export const DOC_CONTENT = {
  rules: {
    title: '📖 Regras e UX — Comece Aqui!',
    body: `<h3>🎯 Objetivo</h3>
Sobreviva o maior número de waves possível! Construa uma base automatizada para gerar munição e recursos.

<h3>🕹️ Controles</h3>
<div class="stat-table">WASD ........... Mover personagem
Click .......... Atirar na direção do mouse
B .............. Abrir menu de construção
E .............. Interagir com Arsenal (trocar arma, recarregar)
F .............. Retomar construção pausada
R .............. Girar direção do Belt (durante posicionamento)
ESC ............ Cancelar construção / fechar menus
SPACE .......... Pausar / Retomar jogo</div>

<h3>📋 Fluxo Básico</h3>
1. Comece perto do Arsenal — pegue sua primeira arma (Regular, já vem com munição)
2. Explore e encontre depósitos de Powder (azul) e Carbon (cinza)
3. Construa Miners nos depósitos para produzir recursos automaticamente
4. Conecte Miners ao Arsenal com Belts para transporte automático
5. Deposite recursos no Arsenal (botão Depositar) e recarregue armas
6. Construa indústrias para refinar recursos (Compression, Distillation, Biological)
7. Sobreviva às waves de inimigos! Cada wave fica mais forte

<h3>📦 Recursos</h3>
<div class="stat-table">Powder ............. Recurso básico (depósitos azuis)
Carbon ............. Recurso básico (depósitos cinzas)
CompressedPowder ... 2 Powder → 1 CP (via Compression)
DistilCarbon ....... 1 Carbon → 3 DC (via Distillation)
Diamond ............ 2 Carbon → 1 Di (via Biological)</div>

<h3>📌 Dica importante</h3>
Seu inventário é limitado a 10 itens! Deposite recursos no Arsenal frequentemente.
O jogo salva automaticamente. Se sair e voltar, continue de onde parou.`
  },

  stats: {
    title: '📊 Stats Completo',
    body: `<h3>🔫 Armas</h3>
${buildWeaponTable()}
<em>* DistilCarbon causa -20% dano nas armas que o usam.</em>

<h3>👾 Inimigos</h3>
${ENEMY_STATS}

<h3>🏗️ Estruturas</h3>
${STRUCTURE_STATS}

<h3>🌊 Waves por Estágio</h3>
<div class="stat-table">Estágio 1: +1 Terrestrial por wave
Estágio 2: +1 Terr/wave + 1 Eagle/Guardian a cada 2 waves
Estágio 3: +1 (Terr/Eagle/Guard) por wave
Estágio 4: +1 Eagle/Guard por wave + Scout na wave 5
Estágio 5+: +1 (Terr/Eagle/Guard) + 1 (Eagle/Guard/Scout) por wave (escalando)</div>

<h3>⚙️ Taxas de Produção</h3>
<div class="stat-table">Miner (Powder): 0.2 por segundo → 1 a cada 5s
Miner (Carbon): 0.1 por segundo → 1 a cada 10s
Distillation:   1 Carbon → 3 DC a cada 0.5s
Compression:    2 Powder → 1 CP a cada 3s
Biological:     2 Carbon → 1 Diamond a cada 6s</div>`
  },

  tips: {
    title: '💡 Dicas',
    body: `<h3>🏁 Início de Jogo</h3>
• Construa 2-3 Miners de Powder logo no começo — munição Regular usa Powder
• Posicione Belts conectando Miners ao Arsenal mais próximo
• Não se afaste muito do Arsenal nas primeiras waves

<h3>⚔️ Combate</h3>
• Clique perto de um inimigo — o jogo faz snap automático no alvo mais próximo
• Se aparecer "Fora de alcance", chegue mais perto ou use Longgun (2.5r)
• Pocket tem alcance curto (0.5r) mas cadência altíssima — boa para emergências
• A cada wave, você regenera +1 HP automaticamente
• A cada kill, você regenera +2 HP

<h3>🏭 Automação</h3>
• Belts podem se conectar a Miners → Indústrias → Arsenal
• Use R para girar a direção do Belt antes de posicionar
• Indústrias precisam de input (belt apontando para elas) e produzem output
• Se não houver belt de saída, a indústria dropa itens no chão

<h3>🛡️ Defesa</h3>
• Scouts priorizam destruir suas estruturas! Proteja-as
• Guardians são lentos mas tankam muito (5-10 HP) — use Longgun ou Bioweapon
• Eagles voam e ignoram obstáculos — mantenha distância

<h3>💎 Late Game</h3>
• Diamond é o recurso mais valioso — desbloqueando Sharp e Bioweapon
• Bioweapon causa 10 de dano mas só tem 1 munição — use com sabedoria
• Sharp tem 12 munição e 3 de dano — excelente custo-benefício com Diamond
• Flamethrower tem cadência absurda (100ms) — derrete grupos de inimigos

<h3>💾 Save</h3>
• O jogo salva automaticamente a cada 30 segundos
• Ao morrer, o save é apagado (rogue-like!)`
  },

  related: {
    title: '🔗 Relacionados & Curiosidades',
    body: `<h3>🎮 Inspiração</h3>
Powder Survival é inspirado em jogos de automação e tower defense como Factorio e Shapez.io, combinados com combate survival estilo top-down shooter.

<h3>🧪 O Sistema de Pólvora</h3>
Toda a economia do jogo gira em torno de dois recursos básicos: Powder (pólvora) e Carbon. A ideia é que munição real depende de compostos químicos — e o jogador precisa construir uma cadeia de produção para refinar esses materiais.

<h3>📐 Unidade de Distância: "r"</h3>
O jogo usa uma unidade própria chamada "r" (range unit), onde 1r = 100 pixels. Isso facilita o balanceamento: a arma Regular tem 1r de alcance, Longgun tem 2.5r, etc.

<h3>🦅 Tipos de Inimigos</h3>
Cada inimigo tem um papel tático:
• <em>Terrestrial</em>: infantaria básica, vem em massa
• <em>Eagle</em>: rápido e voa — força o jogador a reagir
• <em>Guardian</em>: tanque pesado — precisa de armas de alto dano
• <em>Scout</em>: sabotador — ataca suas estruturas, não você!

<h3>♻️ Ciclo de Recursos</h3>
Powder → CompressedPowder (para armas médias)
Carbon → DistilCarbon (ammo alternativa, -20% dano)
Carbon → Diamond (recurso premium para armas top)

<h3>🔢 Números Curiosos</h3>
• A Pocket dispara 1 tiro a cada 200ms — 5 tiros por segundo!
• O Flamethrower dispara a cada 100ms — 10 tiros por segundo!
• O Bioweapon tem apenas 1 munição, mas causa 10 de dano
• Uma Biological precisa de 2 minutos para ser construída
• 6 waves por estágio, 90 segundos entre waves`
  }
};
