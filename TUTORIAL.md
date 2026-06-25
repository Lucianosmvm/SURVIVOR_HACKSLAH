# Tutorial — Adicionar Personagens e Inimigos

Todo o conteúdo do jogo vive em **catálogos** dentro de `index.html` (bloco `<script>`).
Para adicionar conteúdo você **só edita o catálogo** — a lógica do jogo não precisa mudar.

- Personagens → array `CLASSES` (procure por `const CLASSES=[`)
- Inimigos comuns → array `ENEMIES` (procure por `const ENEMIES=[`)
- Chefes → array `BOSSES` (procure por `const BOSSES=[`)

> Dica: abra `index.html` e use Ctrl+F com `const CLASSES`, `const ENEMIES`, `const BOSSES`.

---

## 1. Adicionar um Personagem

Adicione uma entrada nova ao array `CLASSES`. Modelo completo:

```js
{
  id:'warrior',                       // único, minúsculo, sem espaço
  icon:'🪓',                          // emoji (mostrado até ter imagem)
  name:'Guerreiro',                   // nome exibido
  desc:'Machado giratório brutal.',   // descrição curta
  color:'#ff8a5a',                    // cor tema (hex)
  start:'whip',                       // arma inicial — chave de WEAPONS (ver lista)
  rarity:'rare',                      // common | rare | epic | legendary
  startLevel:1,                       // nível inicial do herói
  unlockCost:400,                     // ouro p/ desbloquear (0 = grátis)
  isLocked:true,                      // true = começa bloqueado
  attrs:{ hp:150, speed:2.7, attack:20, defense:12 }, // hp e speed afetam o jogo; attack/defense são exibição
  abilities:['Chicote','Furacão de Aço'],             // nomes exibidos
  ult:{ id:'whirl', name:'Furacão de Aço', icon:'🌀', cd:14, desc:'Gira cortando tudo.' }, // ver ULTs
  passive:'+3 armadura inicial',      // texto exibido da passiva
  init:P=>{ P.armor+=3; }             // efeito real da passiva (opcional)
}
```

### Campos

| Campo | Tipo | O que faz |
|---|---|---|
| `id` | string | Identificador único. Também define a imagem padrão `Img/<id>.png`. |
| `icon` | string | Emoji mostrado quando não há imagem. |
| `name` / `desc` | string | Nome e descrição na UI. |
| `color` | string | Cor tema (hex). |
| `start` | string | Arma inicial — **tem que existir em `WEAPONS`**. |
| `rarity` | string | `common`, `rare`, `epic` ou `legendary` (cor/rótulo). |
| `startLevel` | number | Nível inicial. |
| `unlockCost` | number | Ouro para desbloquear. `0` = liberado. |
| `isLocked` | bool | `true` começa bloqueado; `false` já liberado. |
| `attrs.hp` / `attrs.speed` | number | **Usados na jogabilidade** (vida e velocidade reais). |
| `attrs.attack` / `attrs.defense` | number | Apenas exibição no painel ATRIBUTOS. |
| `abilities` | array | Lista de nomes exibidos. |
| `ult` | object | Habilidade definitiva (ver abaixo). |
| `passive` | string | Texto da passiva. |
| `init(P)` | função | Aplica o efeito da passiva ao iniciar a partida. Opcional. |

### ULTs disponíveis (campo `ult.id`)

Reaproveite uma destas (o efeito já está programado):

| `ult.id` | Efeito |
|---|---|
| `storm` | Chuva de raios na tela toda. |
| `whirl` | Gira cortando tudo + invencível 3s. |
| `volley` | Salva de 24 flechas em leque. |
| `reap` | Explode tudo perto e cura muito. |

> Para uma ult **nova**, é preciso programar — adicione um `else if(id==='suaUlt')` na função `castUlt(id)`. Isso é lógica, não catálogo.

### Armas iniciais válidas (campo `start`)

`bolt`, `blade`, `arrow`, `aura`, `nova`, `chain`, `fire`, `boomerang`, `whip`, `meteor`, `poison`, `holy`

### Passivas — o que `init(P)` pode mexer

`init` recebe o jogador `P`. Campos úteis:

| Campo | Significado | Exemplo |
|---|---|---|
| `P.armor` | Armadura (reduz dano) | `P.armor+=3` |
| `P.magnet` | Alcance de coleta | `P.magnet=240` |
| `P.healOnKill` | Cura por abate | `P.healOnKill=2` |
| `P.boltBonus` | Bônus de dano do `bolt` | `P.boltBonus=0.25` |
| `P.might` | Multiplicador de dano | `P.might+=0.1` |
| `P.haste` | Velocidade de ataque | `P.haste+=0.1` |
| `P.crit` | Chance de crítico | `P.crit+=0.05` |
| `P.regen` | Vida/segundo | `P.regen+=0.5` |

Sem passiva mecânica? Omita o `init`.

### Imagem do personagem

- Coloque o arquivo em `Img/<id>.png` (ex.: `Img/warrior.png`).
- Nome diferente? Adicione o campo `img:'Img/meu_arquivo.png'`.
- **Sem arquivo → mostra o emoji** (`icon`). Não quebra.

⚠️ **PWA/offline**: se quiser que a imagem funcione offline, adicione `./Img/warrior.png` ao `PRECACHE` em `sw.js` e suba `CACHE_VERSION`.

---

## 1b. Personagem com sprite animado (caminhada etc.)

Personagem **estático** = 1 imagem, recortada em círculo (ex.: `Guerreiro`).
Personagem **animado** = **spritesheet** (uma imagem única com vários quadros) + campo `sprite` no `CLASSES`.

> **Spritesheet (imagem única) é o recomendado**, não imagens separadas por quadro:
> 1 só request, sem flicker de carregamento, 1 textura no cache da GPU, e o corte é só matemática (`sx = idx*larguraDoQuadro`).

### Passo 1 — Preparar a arte

- **Grade uniforme**: todo quadro com o **mesmo tamanho** (W×H). O corte é automático: `larguraQuadro = imagem.width / cols`.
- **Uma linha por animação**: linha 0 = `walk`, linha 1 = `attack`, etc. (campo `row`).
- **Fundo transparente** (PNG com alpha). Se a arte vier com fundo branco, remova antes (o `Barbaro.png` teve o branco convertido em transparente).
- O personagem deve **olhar para a direita** — o jogo espelha sozinho ao andar para a esquerda.

Exemplo: `Barbaro.png` = 679×147, 5 quadros lado a lado em 1 linha → quadro ≈ 135.8×147.

### Passo 2 — Salvar a imagem

`Img/<NomeDaArte>.png`. Como o nome difere do `id`, aponte com o campo `img`.

### Passo 3 — Declarar no `CLASSES`

Adicione o campo `sprite` na entrada do personagem:

```js
{
  id:'barbarian', icon:'🪓', name:'Bárbaro', desc:'Viking com machado pesado.',
  color:'#7bbf5a', start:'whip', img:'Img/Barbaro.png',
  rarity:'rare', startLevel:1, isLocked:false,
  attrs:{ hp:170, speed:2.6, attack:24, defense:10 },
  abilities:['Chicote','Furacão de Aço'],
  ult:{ id:'whirl', name:'Furacão de Aço', icon:'🌀', cd:18, desc:'Gira cortando tudo.' },
  passive:'+20 vida inicial', init:P=>{},

  // ↓ isto transforma o personagem em animado
  sprite:{
    cols:5, rows:1, fps:9,        // grade 5×1, 9 quadros por segundo
    anims:{
      idle:{ row:0, from:0, to:0 },   // parado = trava no quadro 0
      walk:{ row:0, from:0, to:4 }    // andando = cicla quadros 0..4
    }
  }
}
```

### Campos de `sprite`

| Campo | O que faz |
|---|---|
| `cols` / `rows` | Grade de quadros na imagem. Tamanho do quadro = `width/cols` × `height/rows` (automático). |
| `fps` | Velocidade da animação (quadros por segundo). |
| `anims` | Cada animação aponta uma linha (`row`) e um intervalo de quadros `from`..`to`. |
| `anims.idle` | **Obrigatória** — usada quando o jogador está parado. Geralmente `from:0,to:0`. |
| `anims.walk` | Usada enquanto anda/dá dash. |

> O jogo já alterna `walk`/`idle` sozinho via `P.moving`. Você só descreve os quadros.

### Mais animações (ataque, idle animado…)

Basta arte com mais linhas e mais entradas em `anims`:

```js
sprite:{ cols:6, rows:3, fps:10, anims:{
  idle:{row:0, from:0, to:3},
  walk:{row:1, from:0, to:5},
  attack:{row:2, from:0, to:4}
}}
```

⚠️ Hoje o motor só dispara `walk` e `idle` automaticamente. Para tocar `attack` (ou outra),
é preciso lógica: trocar `P.moving?'walk':'idle'` na chamada `drawCharSprite(...)` por uma
escolha que olhe o estado do jogador (ex.: `P.attacking`). Isso é lógica, não catálogo.

### Como funciona por dentro (referência)

- `spriteFrame(sp, anim, t)` → calcula o índice do quadro pelo tempo: `from + floor(t*fps) % nQuadros`.
- `drawCharSprite(cx, sp, img, x, y, size, anim, t, flip)` → corta `idx*larguraQuadro` da folha e desenha centralizado, preservando proporção; `flip` espelha na horizontal.
- Estado do jogador: `P.animT` (tempo acumulado) e `P.moving` (true ao andar/dash), atualizados no loop.
- Retrato do lobby: o 1º quadro é recortado para um `<canvas>` (`setPortraitFrame`) — **não usa `toDataURL`** (quebra em `file://`).

### Diferença rápida: estático × animado

| | Estático | Animado (sprite) |
|---|---|---|
| Arte | 1 imagem qualquer | spritesheet em grade uniforme |
| Campo extra | nenhum | `sprite:{...}` |
| Desenho no jogo | recorte circular | quadro da folha, espelhado ao virar |
| Fundo | tanto faz (vai pro círculo) | **precisa ser transparente** |

---

## 2. Adicionar um Inimigo comum

Adicione ao array `ENEMIES`:

```js
{ id:'ghost', name:'Espectro', c:'#aef', r:10, hp:20, spd:1.8, dmg:10, xp:2, gold:2, minTime:60, weight:10 },
```

### Campos

| Campo | Tipo | O que faz |
|---|---|---|
| `id` | string | Identificador único. |
| `name` | string | Nome (telas/depuração). |
| `c` | string | Cor (hex). |
| `r` | number | Raio / tamanho. |
| `hp` | number | Vida base (escala com a dificuldade ao longo do tempo). |
| `spd` | number | Velocidade base. |
| `dmg` | number | Dano de contato. |
| `xp` | number | XP solto ao morrer. |
| `gold` | number | Ouro solto ao morrer. |
| `minTime` | number | Segundos de jogo até começar a aparecer (`0` = desde o início). |
| `weight` | number | Peso relativo de spawn entre os elegíveis. |

### Como o spawn escolhe

A cada spawn o jogo filtra os inimigos já liberados (`gameTime >= minTime`) e sorteia
por `weight`. **Maior peso = aparece mais.**

Exemplo de balanceamento (pesos atuais):

| Inimigo | minTime | weight | Chance (quando todos liberados) |
|---|---|---|---|
| grunt | 0 | 40 | 40% |
| swarm | 0 | 20 | 20% |
| fast | 30 | 25 | 25% |
| tank | 120 | 15 | 15% |

> Quer um inimigo raro de fim de jogo? Use `minTime` alto e `weight` baixo (ex.: `minTime:180, weight:5`).

---

## 3. Adicionar um Chefe

Adicione ao array `BOSSES` (mesmos campos do inimigo + `boss:true` + `warn`):

```js
{ id:'titan', name:'Titã', c:'#f80', r:44, hp:1200, spd:0.9, dmg:40, xp:60, gold:60, boss:true, warn:'⚠️ TITÃ!' },
```

| Campo extra | O que faz |
|---|---|
| `boss:true` | Marca como chefe (HP maior, mais partículas, dropa mais orbes, +20 vida máx ao matar). |
| `warn` | Texto do aviso exibido quando o chefe surge. |

⚠️ Hoje o jogo invoca **sempre `BOSSES[0]`** (a cada 60s). Para alternar entre vários chefes,
edite `spawnBoss()` — troque `const b=BOSSES[0];` por um sorteio/rotação. Está comentado no código.

---

## 4. Checklist final

Depois de editar qualquer catálogo:

1. **Vírgulas**: cada entrada do array termina com `,`. Erro de vírgula quebra tudo.
2. **`id` único** dentro do mesmo array.
3. Personagem: `start` existe em `WEAPONS` e `ult.id` é um dos 4 válidos (ou você programou um novo).
4. Imagem (opcional) em `Img/<id>.png`.
5. Animado? `sprite:{cols,rows,fps,anims:{idle,walk}}`, arte em **grade uniforme** e **fundo transparente**.
6. Testar no navegador (F12 → Console não pode ter erro vermelho).
7. Offline (PWA): novos arquivos de imagem → `PRECACHE` em `sw.js` + subir `CACHE_VERSION`.

### Validação rápida de sintaxe (terminal)

```bash
node -e "const fs=require('fs');const h=fs.readFileSync('index.html','utf8');const m=[...h.matchAll(/<script(?:\s[^>]*)?>([\s\S]*?)<\/script>/g)].filter(x=>x[1].trim());new Function(m.map(x=>x[1]).join('\n;\n'));console.log('JS OK')"
```

`JS OK` = sintaxe válida. Erro = mostra a linha do problema.
