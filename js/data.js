// SULPHUR — datos de juego extraídos del «Núcleo de reglas» y la «Dirección artística».
// Alpha pool: cartas del documento (doc:true) + cartas nuevas del set alpha.

export const SENDAS = {
  ira: {
    key: 'ira', name: 'Ira', colorName: 'Rojo brasa', color: '#c8361f', light: '#ff8a5c', dark: '#5c140a',
    symbol: 'Llama', theme: 'agresión',
    ambiente: 'Fuego, humo, pantanos hirvientes, cuerpos en tensión',
    criaturas: 'Demonios guerreros, almas iracundas, Flegias',
  },
  gula: {
    key: 'gula', name: 'Gula', colorName: 'Verde bilis', color: '#86a11f', light: '#c9dc5a', dark: '#34400a',
    symbol: 'Boca abierta', theme: 'crecimiento y sacrificio',
    ambiente: 'Lluvia sucia, lodo, carne hinchada, podredumbre fértil',
    criaturas: 'Cerbero, monstruos devoradores, larvas',
  },
  avaricia: {
    key: 'avaricia', name: 'Avaricia', colorName: 'Oro viejo', color: '#b98f2e', light: '#f0cf72', dark: '#4d3708',
    symbol: 'Moneda', theme: 'economía y robo',
    ambiente: 'Pasillos dorados en ruinas, cadenas, pesos imposibles',
    criaturas: 'Pluto, espectros codiciosos, avaros cargando rocas',
  },
  fraude: {
    key: 'fraude', name: 'Fraude', colorName: 'Violeta', color: '#8a45b8', light: '#cf9cf0', dark: '#351449',
    symbol: 'Máscara', theme: 'engaño y cartas ocultas',
    ambiente: 'Túneles, espejos, niebla, formas que no son lo que parecen',
    criaturas: 'Gerión, falsificadores, Caco',
  },
  traicion: {
    key: 'traicion', name: 'Traición', colorName: 'Azul hielo', color: '#4fb0da', light: '#b8ecff', dark: '#0f3d52',
    symbol: 'Cristal', theme: 'control y congelar',
    ambiente: 'Lagos helados, silencio, figuras atrapadas bajo el hielo',
    criaturas: 'Demonios congelados, Lucifer',
  },
};
export const SENDA_KEYS = ['ira', 'gula', 'avaricia', 'fraude', 'traicion'];

export const CIRCLES = [
  null,
  { n: 1, roman: 'I', name: 'Limbo', rule: 'Los Entes no pueden atacar. Ronda de despliegue.',
    ambiente: 'Ruinas etéreas y nubes grises', luz: 'Gris perla, luz difusa, casi sin contraste',
    motivos: 'Columnas clásicas, poetas sin esperanza, niebla',
    band: '#bdb7ab', tint: 0xd9d2c4, fog: 0x2a2826, light: 1.0, accent: 0xe8e2d4, particle: 'fog' },
  { n: 2, roman: 'II', name: 'Lujuria', rule: 'Al inicio de su turno, cada jugador mueve uno de sus Entes a la otra fila.',
    ambiente: 'Cielo tormentoso y vendavales', luz: 'Gris tormenta con rojo tenue',
    motivos: 'Almas arrastradas en espiral, cabellos y telas al viento',
    band: '#8f8385', tint: 0xcdb8b6, fog: 0x2a2224, light: 0.95, accent: 0xc0605a, particle: 'wind' },
  { n: 3, roman: 'III', name: 'Gula', rule: 'Cada jugador roba 1 carta adicional en su paso de robo.',
    ambiente: 'Charcos pútridos y lluvia eterna', luz: 'Verde enfermizo y marrón',
    motivos: 'Lodo, cuerpos hinchados, Cerbero',
    band: '#737646', tint: 0xbfc39a, fog: 0x1f2216, light: 0.9, accent: 0x9aae3c, particle: 'rain' },
  { n: 4, roman: 'IV', name: 'Avaricia', rule: 'La energía no gastada al final del turno se guarda como Oro (máximo 3) y puede gastarse más tarde.',
    ambiente: 'Pasillos dorados en ruinas', luz: 'Oro sucio sobre negro',
    motivos: 'Monedas malditas, rocas empujadas, cadenas',
    band: '#7f6a35', tint: 0xd6c08a, fog: 0x221c10, light: 0.86, accent: 0xd0a440, particle: 'dust' },
  { n: 5, roman: 'V', name: 'Ira', rule: 'Los Entes en Vanguardia tienen +1 de Fuerza.',
    ambiente: 'Pantanos oscuros, fuego y humo', luz: 'Rojo brasa sobre negro',
    motivos: 'Laguna Estigia, cuerpos enfrentados, la barca de Flegias',
    band: '#6e2b1d', tint: 0xd89a84, fog: 0x220d08, light: 0.8, accent: 0xe0502a, particle: 'embers' },
  { n: 6, roman: 'VI', name: 'Herejía', rule: 'Los Entes destruidos se Queman en lugar de ir al Olvido.',
    ambiente: 'Tumbas en llamas y murallas ardientes', luz: 'Naranja y negro, fuego intenso',
    motivos: 'Sepulcros abiertos, la ciudad de Dite',
    band: '#6b3613', tint: 0xd9a676, fog: 0x1e1006, light: 0.75, accent: 0xf07a22, particle: 'embers' },
  { n: 7, roman: 'VII', name: 'Violencia', rule: 'El daño de combate que sobra tras matar a un bloqueador pasa al Peregrino.',
    ambiente: 'Desierto sangriento y ríos de sangre', luz: 'Rojo oscuro, cielo de ceniza',
    motivos: 'Centauros, el Minotauro, bosque de suicidas',
    band: '#4b1d1b', tint: 0xb99088, fog: 0x160908, light: 0.68, accent: 0xa02020, particle: 'ash' },
  { n: 8, roman: 'VIII', name: 'Fraude', rule: 'Los Juicios cuestan 1 menos (mínimo 1).',
    ambiente: 'Túneles oscuros e ilusiones', luz: 'Violeta y sombra',
    motivos: 'Fosas concéntricas, disfraces, Gerión',
    band: '#34233f', tint: 0xa894b4, fog: 0x100a14, light: 0.6, accent: 0x9a5acc, particle: 'motes' },
  { n: 9, roman: 'IX', name: 'Traición', rule: 'Los Entes en Retaguardia no pueden bloquear. Al final de la ronda, Juicio Final.',
    ambiente: 'Paisaje helado, lago congelado', luz: 'Azul hielo, casi monocromo',
    motivos: 'Figuras atrapadas en hielo, Lucifer gigante',
    band: '#17232f', tint: 0x98b4c8, fog: 0x060a0e, light: 0.52, accent: 0x7cc8ee, particle: 'snow' },
];

export const TYPES = {
  ente: { name: 'Ente', where: 'Vanguardia o Retaguardia', when: 'Tu fase principal, pila vacía', what: 'Demonios, bestias y sombras que atacan y bloquean. Fuerza / Resistencia.', frame: 'Filete fino en el color de la Senda', detail: 'Fuerza y Resistencia grabadas en una lápida abajo' },
  ilustre: { name: 'Ilustre', where: 'Vanguardia o Retaguardia', when: 'Tu fase principal, pila vacía', what: 'Ente único con nombre (Francesca, Ulises, Cerbero). Máximo 1 en juego por nombre.', frame: 'Arco gótico sobre la ilustración', detail: 'Nombre en capitular decorada, pequeño sello de «único»' },
  rito: { name: 'Rito', where: 'Va al Olvido tras resolverse', when: 'Tu fase principal, pila vacía', what: 'Efecto único y potente, a velocidad lenta (como un conjuro).', frame: 'Borde de pergamino con esquinas quemadas', detail: 'Sin estadísticas, texto centrado' },
  juicio: { name: 'Juicio', where: 'Va al Olvido tras resolverse', when: 'Cualquier momento con prioridad', what: 'La carta instantánea: respuestas, trucos de combate, anulaciones.', frame: 'Marco de espinas o rayos', detail: 'Icono de balanza junto al coste: se juega en cualquier momento' },
  reliquia: { name: 'Reliquia', where: 'Unida a un Ente o al Peregrino, o suelta ocupando un espacio de Retaguardia', when: 'Tu fase principal, pila vacía', what: 'Equipo y artefactos permanentes (la espada, la guadaña, las cadenas).', frame: 'Marco de metal remachado', detail: 'Icono de cadena si se une a un Ente' },
  alma: { name: 'Alma', where: 'Zona de Almas', when: 'Una por turno, sin usar la pila', what: 'Recurso. Se absuelve o se condena.', frame: 'Sin marco: ilustración a sangre completa', detail: 'Símbolo de Senda grande y línea de Condena abajo' },
  peregrino: { name: 'Peregrino', where: 'Zona del Peregrino', when: 'Empieza en juego', what: 'Líder, Voluntad e identidad del mazo.', frame: 'Retablo con tres paneles', detail: 'Redención a la izquierda con pan de oro, Caída a la derecha en ceniza' },
  circulo: { name: 'Círculo', where: 'Carta de Descenso (compartida)', when: 'Se activa cada ronda', what: 'Regla global del acto actual.' },
};

export const KEYWORDS = {
  vuelo: { name: 'Vuelo', text: 'Solo puede ser bloqueado por Entes con Vuelo.' },
  primerGolpe: { name: 'Primer golpe', text: 'Hace su daño antes que el resto.' },
  guardian: { name: 'Guardián', text: 'Puede bloquear desde la Retaguardia.' },
  embestida: { name: 'Embestida', text: 'Puede atacar el turno en que entra.' },
  iraCiega: { name: 'Ira ciega', text: 'Debe atacar cada turno si puede.' },
  asedio: { name: 'Asedio', text: 'Al atacar, puede elegir como objetivo un Ente de la Retaguardia rival en lugar del Peregrino. Si no lo bloquean, le hace su daño a ese Ente (y el Ente no devuelve el golpe).' },
};

// ─────────────────────────────────────────────────────────────────────────────
// ALPHA POOL — primer set jugable. Mecánicas:
//  cond  { if: virtuoso|corrupto|tibio|destino|sinDestino|circulo|oro|olvido, n, f, r, kw }  (estático)
//  scale { per: olvidoEntes|oro, f, r, max }                                                  (estático)
//  onEnter / onDeath / onAttack / onMove / onAllyDeath: disparadores (entran en la Cadena)
//  aura  { attacking, senda, f, r }: bonus a tus Entes mientras está en juego
//  fx de los Ritos/Juicios y líneas de Condena: operaciones del motor (engine.js → doOp)
// Las marcadas doc:true aparecen literalmente en el Núcleo de reglas.
// ─────────────────────────────────────────────────────────────────────────────
export const CARDS = {
  // ═══════════════ IRA — agresión, Asedio, «al atacar», cartas de principio de partida ═══════════════
  diablillo: { name: 'Diablillo de Dite', type: 'ente', sub: 'Demonio', senda: 'ira', cost: 1, req: ['ira'], f: 2, r: 2, text: '', doc: true, circle: 6 },
  tamborilero: { name: 'Tamborilero infernal', type: 'ente', sub: 'Demonio', senda: 'ira', cost: 2, req: ['ira'], f: 1, r: 2,
    text: '*Apoyo:* mientras está en Retaguardia, tus Entes de Ira tienen +1/+0.', apoyo: { senda: 'ira', f: 1 }, doc: true, circle: 5 },
  iracundo: { name: 'Iracundo de la Estigia', type: 'ente', sub: 'Alma iracunda', senda: 'ira', cost: 2, req: ['ira'], f: 3, r: 2, kw: ['iraCiega'], text: '*Ira ciega.*', circle: 5 },
  guerrero: { name: 'Demonio guerrero', type: 'ente', sub: 'Demonio', senda: 'ira', cost: 3, req: ['ira'], f: 3, r: 2, kw: ['embestida'], text: '*Embestida.*', circle: 5 },
  condenado: { name: 'Condenado en llamas', type: 'ente', sub: 'Alma iracunda', senda: 'ira', cost: 2, req: ['ira'], f: 2, r: 2,
    cond: { if: 'corrupto', f: 2, kw: ['embestida'] }, text: '{horns} *Corrupto:* tiene +2/+0 y *Embestida.*', circle: 6 },
  furiaSin: { name: 'Furia de la Estigia', type: 'ente', sub: 'Demonio', senda: 'ira', cost: 2, req: ['ira'], f: 2, r: 1, kw: ['embestida'],
    cond: { if: 'sinDestino', f: 1 }, text: '*Embestida.* *Sin Destino:* tiene +1/+0.', circle: 5 },
  antorchas: { name: 'Portador de antorchas', type: 'ente', sub: 'Demonio', senda: 'ira', cost: 3, req: ['ira'], f: 2, r: 3,
    onAttack: [{ op: 'damage', n: 1 }], onAttackTarget: 'enemyEnte', text: '*Al atacar,* inflige 1 de daño a un Ente rival.', circle: 6 },
  ariete: { name: 'Demonio del ariete', type: 'ente', sub: 'Demonio', senda: 'ira', cost: 3, req: ['ira', 'ira'], f: 3, r: 3, kw: ['asedio'], text: '*Asedio.*', circle: 6 },
  brasa: { name: 'Brasa de la Estigia', type: 'ente', sub: 'Alma iracunda', senda: 'ira', cost: 3, req: ['ira', 'ira'], f: 3, r: 3,
    cond: { if: 'circulo', n: 5, f: 1, r: 1 }, text: '*Círculo V o más:* tiene +1/+1.', circle: 5 },
  flegias: { name: 'Flegias', type: 'ilustre', sub: 'Barquero de la Estigia', senda: 'ira', cost: 4, req: ['ira', 'ira'], f: 4, r: 3, kw: ['embestida', 'primerGolpe'], text: '*Embestida. Primer golpe.*', circle: 5 },
  capaneo: { name: 'Capaneo', type: 'ilustre', sub: 'Blasfemo del arenal', senda: 'ira', cost: 5, req: ['ira', 'ira', 'ira'], f: 5, r: 5, kw: ['asedio'],
    cond: { if: 'destino', f: 2 }, text: '*Asedio.* *Destino:* tiene +2/+0.', circle: 7 },
  hoguera: { name: 'Hoguera de la Estigia', type: 'rito', sub: 'Rito', senda: 'ira', cost: 3, req: ['ira'], target: 'ente', harm: true, fx: [{ op: 'damage', n: 3 }], text: 'Inflige 3 de daño a un Ente.', circle: 5 },
  ascuas: { name: 'Tormenta de ascuas', type: 'rito', sub: 'Rito', senda: 'ira', cost: 4, req: ['ira', 'ira', 'ira'], fx: [{ op: 'damageAll', n: 2, who: 'enemyVan' }], text: 'Inflige 2 de daño a cada Ente de la Vanguardia rival.', circle: 6 },
  impetu: { name: 'Ímpetu', type: 'juicio', sub: 'Juicio', senda: 'ira', cost: 1, req: ['ira'], target: 'ente', harm: false, fx: [{ op: 'protect' }], text: 'El Ente objetivo no puede ser elegido por Juicios rivales este turno.', doc: true, circle: 5 },
  furia: { name: 'Furia', type: 'juicio', sub: 'Juicio', senda: 'ira', cost: 1, req: ['ira'], target: 'ente', harm: false, fx: [{ op: 'buff', f: 2, r: 0 }], text: 'Un Ente recibe +2/+0 este turno.', circle: 5 },
  rabia: { name: 'Rabia de Argenti', type: 'juicio', sub: 'Juicio', senda: 'ira', cost: 2, req: ['ira', 'ira'], target: 'combatEnte', harm: true, fx: [{ op: 'damage', n: 3 }], text: 'Inflige 3 de daño a un Ente que esté atacando o bloqueando.', circle: 5 },
  espada: { name: 'Espada de Dite', type: 'reliquia', sub: 'Reliquia', senda: 'ira', cost: 2, req: ['ira'], attach: 'ownEnte', equip: { f: 2 }, text: 'Unida a un Ente: tiene +2/+0.', circle: 6 },
  estandarte: { name: 'Estandarte ardiente', type: 'reliquia', sub: 'Reliquia', senda: 'ira', cost: 3, req: ['ira', 'ira'], attach: 'loose', aura: { attacking: true, f: 1 }, text: 'Suelta en Retaguardia: tus Entes atacantes tienen +1/+0.', circle: 6 },

  // ═══════════════ GULA — crecimiento, sacrificio, Voluntad, Olvido ═══════════════
  larva: { name: 'Larva del fango', type: 'ente', sub: 'Larva', senda: 'gula', cost: 1, req: ['gula'], f: 1, r: 2, onDeath: [{ op: 'gainWill', n: 2 }], text: '*Al morir,* tu Peregrino gana 2 de Voluntad.', circle: 3 },
  sanguijuela: { name: 'Sanguijuela del cieno', type: 'ente', sub: 'Larva', senda: 'gula', cost: 1, req: ['gula'], f: 1, r: 1,
    cond: { if: 'destino', f: 2, r: 2 }, text: '*Destino:* tiene +2/+2.', circle: 3 },
  gloton: { name: 'Glotón bajo la lluvia', type: 'ente', sub: 'Alma glotona', senda: 'gula', cost: 2, req: ['gula'], f: 2, r: 3, cond: { if: 'virtuoso', f: 1, r: 1 }, text: '{halo} *Virtuoso:* tiene +1/+1.', circle: 3 },
  gusano: { name: 'Gusano del lodo', type: 'ente', sub: 'Larva', senda: 'gula', cost: 2, req: ['gula'], f: 1, r: 3, kw: ['guardian'],
    onMove: [{ op: 'grow', f: 1, r: 1 }], text: '*Guardián.* *Al cambiar de fila,* recibe +1/+1 para siempre.', circle: 3 },
  devorador: { name: 'Devorador hinchado', type: 'ente', sub: 'Monstruo devorador', senda: 'gula', cost: 3, req: ['gula'], f: 2, r: 3,
    ability: { cost: 1, sacrifice: true, fx: [{ op: 'grow', f: 2, r: 2 }], text: 'Paga 1, sacrifica otro Ente tuyo: recibe +2/+2 para siempre.' }, text: 'Paga 1, sacrifica otro Ente tuyo: recibe +2/+2 para siempre.', circle: 3 },
  carronero: { name: 'Carroñero del fango', type: 'ente', sub: 'Monstruo devorador', senda: 'gula', cost: 3, req: ['gula', 'gula'], f: 2, r: 2,
    scale: { per: 'olvidoEntes', f: 1, r: 1, max: 3, div: 2 }, text: 'Tiene +1/+1 por cada 2 Entes en tu Olvido (máximo +3/+3).', circle: 3 },
  bestia: { name: 'Bestia del lodo', type: 'ente', sub: 'Monstruo devorador', senda: 'gula', cost: 5, req: ['gula', 'gula'], f: 4, r: 5, onEnter: [{ op: 'gainWill', n: 2 }], text: '*Al entrar,* tu Peregrino gana 2 de Voluntad.', circle: 3 },
  titan: { name: 'Titán del cieno', type: 'ente', sub: 'Monstruo devorador', senda: 'gula', cost: 6, req: ['gula', 'gula', 'gula'], f: 5, r: 6, kw: ['guardian'], text: '*Guardián.*', circle: 3 },
  cerbero: { name: 'Cerbero', type: 'ilustre', sub: 'Bestia', senda: 'gula', cost: 4, req: ['gula'], f: 4, r: 4, kw: ['guardian'], text: '*Guardián.*', doc: true, circle: 3 },
  erisicton: { name: 'Erisicton', type: 'ilustre', sub: 'El hambre eterna', senda: 'gula', cost: 4, req: ['gula', 'gula'], f: 3, r: 4,
    onAllyDeath: [{ op: 'grow', f: 1, r: 1 }], text: 'Cuando otro Ente tuyo muere, recibe +1/+1 para siempre.', circle: 3 },
  festin: { name: 'Festín', type: 'rito', sub: 'Rito', senda: 'gula', cost: 2, req: ['gula'], target: 'ownEnte', harm: false, fx: [{ op: 'sacrifice' }, { op: 'draw', n: 2 }, { op: 'gainWill', n: 2 }], text: 'Sacrifica un Ente tuyo: roba 2 cartas y ganas 2 de Voluntad.', circle: 3 },
  exhumar: { name: 'Exhumación', type: 'rito', sub: 'Rito', senda: 'gula', cost: 2, req: ['gula'], fx: [{ op: 'exhume' }], text: 'Devuelve a tu mano el último Ente que llegó a tu Olvido.', circle: 6 },
  banquete: { name: 'Banquete de Cerbero', type: 'rito', sub: 'Rito', senda: 'gula', cost: 2, req: ['gula', 'gula'], fx: [{ op: 'mill', n: 3, who: 'self' }, { op: 'draw', n: 1 }], text: '*Sepultar 3* en tu propio mazo. Roba 1.', circle: 3 },
  lluviaEterna: { name: 'Lluvia eterna', type: 'rito', sub: 'Rito', senda: 'gula', cost: 5, req: ['gula', 'gula', 'gula'], fx: [{ op: 'growAll', f: 1, r: 1 }], text: 'Cada Ente tuyo recibe +1/+1 para siempre.', circle: 3 },
  lluvia: { name: 'Lluvia sucia', type: 'juicio', sub: 'Juicio', senda: 'gula', cost: 2, req: ['gula'], target: 'ente', harm: false, fx: [{ op: 'buff', f: 0, r: 3 }], text: 'Un Ente recibe +0/+3 este turno.', circle: 3 },
  hambre: { name: 'Hambre insaciable', type: 'juicio', sub: 'Juicio', senda: 'gula', cost: 2, req: ['gula'], target: 'ownEnte', harm: false, fx: [{ op: 'sacrifice' }, { op: 'gainWill', n: 3 }], text: 'Sacrifica un Ente tuyo: ganas 3 de Voluntad.', circle: 3 },
  colmillo: { name: 'Colmillo de Cerbero', type: 'reliquia', sub: 'Reliquia', senda: 'gula', cost: 1, req: ['gula'], attach: 'ownEnte', equip: { f: 1, r: 1 }, text: 'Unida a un Ente: tiene +1/+1.', circle: 3 },

  // ═══════════════ AVARICIA — Oro, robo, muros, control del combate ═══════════════
  prodigo: { name: 'Pródigo', type: 'ente', sub: 'Alma avara', senda: 'avaricia', cost: 1, req: ['avaricia'], f: 2, r: 1, onDeath: [{ op: 'gainGold', n: 1 }], text: '*Al morir,* ganas 1 de Oro.', circle: 4 },
  prestamista: { name: 'Prestamista de Dite', type: 'ente', sub: 'Alma avara', senda: 'avaricia', cost: 2, req: ['avaricia'], f: 2, r: 2, onEnter: [{ op: 'gainGold', n: 1 }], text: '*Al entrar,* ganas 1 de Oro.', circle: 4 },
  avaro: { name: 'Avaro con su roca', type: 'ente', sub: 'Alma avara', senda: 'avaricia', cost: 2, req: ['avaricia'], f: 1, r: 4, kw: ['guardian'], text: '*Guardián.*', circle: 4 },
  codicioso: { name: 'Espectro codicioso', type: 'ente', sub: 'Espectro', senda: 'avaricia', cost: 3, req: ['avaricia'], f: 2, r: 3, onEnter: [{ op: 'draw', n: 1 }], text: '*Al entrar,* roba 1.', circle: 4 },
  arcas: { name: 'Guardián de las arcas', type: 'ente', sub: 'Demonio', senda: 'avaricia', cost: 3, req: ['avaricia', 'avaricia'], f: 2, r: 4, kw: ['guardian'],
    cond: { if: 'oro', f: 1 }, text: '*Guardián.* *Si tienes Oro,* tiene +1/+0.', circle: 4 },
  tesorero: { name: 'Tesorero de la Ciudad', type: 'ente', sub: 'Demonio', senda: 'avaricia', cost: 5, req: ['avaricia', 'avaricia'], f: 4, r: 5,
    onEnter: [{ op: 'gainGold', n: 2 }], cond: { if: 'destino', f: 2, r: 0 }, text: '*Al entrar,* ganas 2 de Oro. *Destino:* tiene +2/+0.', circle: 4 },
  rodador: { name: 'Rodador de pesos', type: 'ente', sub: 'Alma avara', senda: 'avaricia', cost: 4, req: ['avaricia', 'avaricia', 'avaricia'], f: 4, r: 4, kw: ['asedio'],
    scale: { per: 'oro', f: 1, r: 0, max: 3 }, text: '*Asedio.* Tiene +1/+0 por cada Oro que tengas.', circle: 4 },
  pluto: { name: 'Pluto', type: 'ilustre', sub: 'Demonio de la riqueza', senda: 'avaricia', cost: 4, req: ['avaricia'], f: 3, r: 5, onEnter: [{ op: 'gainGold', n: 2 }, { op: 'draw', n: 1 }], text: '*Al entrar,* ganas 2 de Oro y robas 1.', circle: 4 },
  moneda: { name: 'Moneda maldita', type: 'rito', sub: 'Rito', senda: 'avaricia', cost: 1, req: ['avaricia'], fx: [{ op: 'draw', n: 1 }, { op: 'gainGold', n: 1 }], text: 'Roba 1. Ganas 1 de Oro.', circle: 4 },
  usura: { name: 'Usura', type: 'rito', sub: 'Rito', senda: 'avaricia', cost: 1, req: ['avaricia', 'avaricia'], fx: [{ op: 'spendGoldDraw' }], text: 'Gasta todo tu Oro: roba 1 carta por cada Oro gastado.', circle: 4 },
  rueda: { name: 'Rueda de los avaros', type: 'rito', sub: 'Rito', senda: 'avaricia', cost: 5, req: ['avaricia', 'avaricia', 'avaricia'], fx: [{ op: 'draw', n: 3 }], text: 'Roba 3.', circle: 4 },
  soborno: { name: 'Soborno', type: 'juicio', sub: 'Juicio', senda: 'avaricia', cost: 2, req: ['avaricia', 'avaricia'], target: 'attacker', harm: true, fx: [{ op: 'removeCombat' }, { op: 'gainGold', n: 1 }], text: 'El Ente atacante objetivo deja de atacar. Ganas 1 de Oro.', circle: 4 },
  muralla: { name: 'Muralla de monedas', type: 'juicio', sub: 'Juicio', senda: 'avaricia', cost: 4, req: ['avaricia', 'avaricia'], fx: [{ op: 'fog' }], text: 'Este turno, tu Peregrino no recibe daño de combate.', circle: 4 },
  balanzaMercader: { name: 'Balanza del mercader', type: 'juicio', sub: 'Juicio', senda: 'avaricia', cost: 2, req: ['avaricia'], fx: [{ op: 'draw', n: 1 }, { op: 'gainGold', n: 1 }], text: 'Roba 1. Ganas 1 de Oro.', circle: 4 },
  pesos: { name: 'Pesos imposibles', type: 'reliquia', sub: 'Reliquia', senda: 'avaricia', cost: 3, req: ['avaricia'], attach: 'anyEnte', harm: true, equip: { noCombat: true }, text: 'Unida a un Ente: no puede atacar ni bloquear.', circle: 4 },
  caronteMoneda: { name: 'Óbolo de Caronte', type: 'reliquia', sub: 'Reliquia', senda: 'avaricia', cost: 2, req: ['avaricia'], attach: 'loose', startTurn: [{ op: 'gainGold', n: 1 }], text: 'Suelta en Retaguardia: al inicio de tu turno, ganas 1 de Oro.', circle: 4 },

  // ═══════════════ FRAUDE — engaño, anulación, rebote, Sepultar, cambiar de fila ═══════════════
  espectro: { name: 'Espectro de la niebla', type: 'ente', sub: 'Sombra', senda: 'fraude', cost: 2, req: ['fraude'], f: 2, r: 2, kw: ['vuelo'], text: '*Vuelo.*', circle: 8 },
  falsificador: { name: 'Falsificador', type: 'ente', sub: 'Falsario', senda: 'fraude', cost: 2, req: ['fraude'], f: 3, r: 2, onEnter: [{ op: 'draw', n: 1 }, { op: 'discard', n: 1 }], text: '*Al entrar,* roba 1 y descarta 1.', circle: 8 },
  adivino: { name: 'Adivino de cabeza torcida', type: 'ente', sub: 'Falsario', senda: 'fraude', cost: 2, req: ['fraude'], f: 2, r: 2, onEnter: [{ op: 'scry', n: 3 }], text: '*Al entrar,* mira las 3 cartas superiores de un mazo y ordénalas.', circle: 8 },
  ladron: { name: 'Ladrón de sombras', type: 'ente', sub: 'Sombra', senda: 'fraude', cost: 2, req: ['fraude'], f: 2, r: 2, kw: ['vuelo'],
    onAttack: [{ op: 'mill', n: 2, who: 'opp' }], text: '*Vuelo.* *Al atacar,* *Sepultar 2.*', circle: 8 },
  hipocrita: { name: 'Hipócrita de capa plomiza', type: 'ente', sub: 'Falsario', senda: 'fraude', cost: 3, req: ['fraude'], f: 3, r: 4,
    onMove: [{ op: 'loseWillOpp', n: 1 }], text: '*Al cambiar de fila,* el Peregrino rival pierde 1 de Voluntad.', circle: 8 },
  alquimista: { name: 'Alquimista de Malebolge', type: 'ente', sub: 'Falsario', senda: 'fraude', cost: 3, req: ['fraude', 'fraude'], f: 3, r: 3, onEnter: [{ op: 'mill', n: 3, who: 'opp' }], text: '*Al entrar,* *Sepultar 3.*', circle: 8 },
  gerion: { name: 'Gerión', type: 'ilustre', sub: 'Monstruo del fraude', senda: 'fraude', cost: 5, req: ['fraude', 'fraude'], f: 5, r: 5, kw: ['vuelo'], cond: { if: 'corrupto', f: 2 }, text: '*Vuelo.* {horns} *Corrupto:* tiene +2/+0.', circle: 8 },
  diomedes: { name: 'Diomedes', type: 'ilustre', sub: 'Llama doble', senda: 'fraude', cost: 4, req: ['fraude'], f: 3, r: 3, onEnter: [{ op: 'draw', n: 2 }], text: '*Al entrar,* roba 2.', circle: 8 },
  caco: { name: 'Caco', type: 'ilustre', sub: 'Centauro ladrón', senda: 'fraude', cost: 4, req: ['fraude', 'fraude', 'fraude'], f: 4, r: 4, kw: ['asedio'],
    onAttack: [{ op: 'mill', n: 2, who: 'opp' }], text: '*Asedio.* *Al atacar,* *Sepultar 2.*', circle: 8 },
  espejismo: { name: 'Espejismo', type: 'rito', sub: 'Rito', senda: 'fraude', cost: 2, req: ['fraude'], target: 'ente', harm: true, fx: [{ op: 'bounce' }], text: 'Devuelve un Ente a la mano de su dueño.', circle: 8 },
  sepultura: { name: 'Fosa de Malebolge', type: 'rito', sub: 'Rito', senda: 'fraude', cost: 2, req: ['fraude'], fx: [{ op: 'mill', n: 4, who: 'opp' }], text: '*Sepultar 4.*', circle: 8 },
  laberinto: { name: 'Laberinto de espejos', type: 'rito', sub: 'Rito', senda: 'fraude', cost: 4, req: ['fraude', 'fraude', 'fraude'], fx: [{ op: 'bounceAll', who: 'enemyVan', maxCost: 3 }], text: 'Devuelve a su mano cada Ente de la Vanguardia rival con coste 3 o menos.', circle: 8 },
  engano: { name: 'Engaño', type: 'juicio', sub: 'Juicio', senda: 'fraude', cost: 2, req: ['fraude'], target: 'chainJuicio', harm: true, fx: [{ op: 'counter' }], text: 'Anula el Juicio objetivo de la Cadena.', circle: 8 },
  promesa: { name: 'Falsa promesa', type: 'juicio', sub: 'Juicio', senda: 'fraude', cost: 2, req: ['fraude', 'fraude'], target: 'chainAny', harm: true, fx: [{ op: 'counter' }], text: 'Anula el Juicio, la habilidad o el disparador objetivo de la Cadena.', circle: 8 },
  desvio: { name: 'Desvío', type: 'juicio', sub: 'Juicio', senda: 'fraude', cost: 1, req: ['fraude'], target: 'ente', harm: true, fx: [{ op: 'shift' }], text: 'Mueve un Ente a la otra fila (si ataca o bloquea, sale del combate).', circle: 8 },
  mascara: { name: 'Máscara del falsario', type: 'reliquia', sub: 'Reliquia', senda: 'fraude', cost: 1, req: ['fraude'], attach: 'pilgrim', equip: { abilityDiscount: 1 }, text: 'Unida a tu Peregrino: su habilidad base cuesta 1 menos.', circle: 8 },

  // ═══════════════ TRAICIÓN — control, congelar, muros, eliminación, final de partida ═══════════════
  traidor: { name: 'Traidor en el hielo', type: 'ente', sub: 'Alma traidora', senda: 'traicion', cost: 1, req: ['traicion'], f: 1, r: 3, text: '', circle: 9 },
  sombraHelada: { name: 'Sombra helada', type: 'ente', sub: 'Sombra', senda: 'traicion', cost: 2, req: ['traicion'], f: 1, r: 2, kw: ['vuelo', 'guardian'], text: '*Vuelo. Guardián.*', circle: 9 },
  centinela: { name: 'Centinela de hielo', type: 'ente', sub: 'Demonio congelado', senda: 'traicion', cost: 2, req: ['traicion'], f: 1, r: 4, onDeath: [{ op: 'draw', n: 1 }], text: '*Al morir,* roba 1.', doc: true, circle: 9 },
  carcelero: { name: 'Carcelero de Antenora', type: 'ente', sub: 'Demonio', senda: 'traicion', cost: 3, req: ['traicion'], f: 2, r: 4, onEnter: [{ op: 'tap' }], onEnterTarget: 'enemyEnte', text: '*Al entrar,* agota un Ente rival.', circle: 9 },
  congelado: { name: 'Demonio congelado', type: 'ente', sub: 'Demonio', senda: 'traicion', cost: 3, req: ['traicion'], f: 2, r: 5, kw: ['guardian'], text: '*Guardián.*', circle: 9 },
  judeca: { name: 'Guardián de Judeca', type: 'ente', sub: 'Demonio congelado', senda: 'traicion', cost: 4, req: ['traicion', 'traicion', 'traicion'], f: 3, r: 6, kw: ['guardian'],
    cond: { if: 'circulo', n: 7, f: 3 }, text: '*Guardián.* *Círculo VII o más:* tiene +3/+0.', circle: 9 },
  ugolino: { name: 'Ugolino', type: 'ilustre', sub: 'Traidor', senda: 'traicion', cost: 4, req: ['traicion'], f: 3, r: 5, onEnter: [{ op: 'tap', freeze: true }], onEnterTarget: 'enemyEnte', text: '*Al entrar,* agota un Ente rival: no se endereza en su próximo Enderezar.', circle: 9 },
  bruto: { name: 'Bruto', type: 'ilustre', sub: 'Traidor de Roma', senda: 'traicion', cost: 4, req: ['traicion', 'traicion'], f: 4, r: 4, kw: ['asedio'],
    onAttack: [{ op: 'tap' }], onAttackTarget: 'enemyEnte', text: '*Asedio.* *Al atacar,* agota un Ente rival.', circle: 9 },
  lucifer: { name: 'Lucifer', type: 'ilustre', sub: 'Emperador del hielo', senda: 'traicion', cost: 7, req: ['traicion', 'traicion', 'traicion'], f: 7, r: 7, kw: ['vuelo'],
    cond: { if: 'destino', f: 0, r: 0, kw: ['asedio'] }, text: '*Vuelo.* *Destino:* tiene *Asedio.*', circle: 9 },
  cocito: { name: 'Lago Cocito', type: 'rito', sub: 'Rito', senda: 'traicion', cost: 5, req: ['traicion', 'traicion'], fx: [{ op: 'tapAllEnemy', freeze: true }], text: 'Agota los Entes rivales: no se enderezan en su próximo Enderezar.', circle: 9 },
  silencio: { name: 'Silencio helado', type: 'juicio', sub: 'Juicio', senda: 'traicion', cost: 2, req: ['traicion'], target: 'attacker', harm: true, fx: [{ op: 'removeCombat' }], text: 'El Ente atacante objetivo deja de atacar.', doc: true, circle: 9 },
  escarcha: { name: 'Escarcha', type: 'juicio', sub: 'Juicio', senda: 'traicion', cost: 1, req: ['traicion'], target: 'ente', harm: true, fx: [{ op: 'tap' }, { op: 'draw', n: 1 }], text: 'Agota el Ente objetivo. Roba 1.', circle: 9 },
  lanza: { name: 'Lanza de hielo', type: 'juicio', sub: 'Juicio', senda: 'traicion', cost: 2, req: ['traicion', 'traicion'], target: 'ente', filter: { maxF: 3 }, harm: true, fx: [{ op: 'destroy' }], text: 'Destruye un Ente con Fuerza 3 o menos.', circle: 9 },
  ventisca: { name: 'Ventisca de Cocito', type: 'juicio', sub: 'Juicio', senda: 'traicion', cost: 4, req: ['traicion', 'traicion', 'traicion'], fx: [{ op: 'removeCombatAll' }], text: 'Todos los Entes atacantes dejan de atacar.', circle: 9 },
  cadenas: { name: 'Cadenas de hielo', type: 'reliquia', sub: 'Reliquia', senda: 'traicion', cost: 2, req: ['traicion'], attach: 'anyEnte', harm: true, equip: { noCombat: true }, text: 'Unida a un Ente: no puede atacar ni bloquear.', circle: 9 },

  // ═══════════════ NEUTRALES — tinta pura ═══════════════
  almaErrante: { name: 'Alma errante', type: 'ente', sub: 'Alma sin esperanza', senda: null, cost: 1, req: [], f: 1, r: 1, onMove: [{ op: 'draw', n: 1 }], text: '*Al cambiar de fila,* roba 1.', circle: 2 },
  poeta: { name: 'Poeta del Limbo', type: 'ente', sub: 'Alma sin esperanza', senda: null, cost: 2, req: [], f: 1, r: 3, cond: { if: 'virtuoso', kw: ['guardian'] }, text: '{halo} *Virtuoso:* tiene *Guardián.*', circle: 1 },
  arquero: { name: 'Centauro arquero', type: 'ente', sub: 'Bestia', senda: null, cost: 3, req: [], f: 2, r: 2, kw: ['asedio'], text: '*Asedio.*', circle: 7 },
  arpia: { name: 'Arpía del bosque', type: 'ente', sub: 'Bestia', senda: null, cost: 3, req: [], f: 2, r: 2, kw: ['vuelo'], cond: { if: 'circulo', n: 7, f: 2 }, text: '*Vuelo.* *Círculo VII o más:* tiene +2/+0.', circle: 7 },
  centauro: { name: 'Centauro', type: 'ente', sub: 'Bestia', senda: null, cost: 4, req: [], f: 3, r: 3, kw: ['primerGolpe'], text: '*Primer golpe.*', circle: 7 },
  minotauro: { name: 'Minotauro', type: 'ilustre', sub: 'Bestia', senda: null, cost: 5, req: [], f: 5, r: 4, kw: ['iraCiega'], text: '*Ira ciega.*', circle: 7 },
  minos: { name: 'Minos', type: 'ilustre', sub: 'Juez del Infierno', senda: null, cost: 3, req: [], f: 2, r: 3, onEnter: [{ op: 'descend' }], text: '*Al entrar,* *Descender.*', circle: 2 },
  caronte: { name: 'Caronte', type: 'ilustre', sub: 'Barquero del Aqueronte', senda: null, cost: 4, req: [], f: 3, r: 4, kw: ['guardian'], onEnter: [{ op: 'draw', n: 1 }], text: '*Guardián.* *Al entrar,* roba 1.', circle: 1 },
  descensoForzado: { name: 'Descenso forzado', type: 'rito', sub: 'Rito', senda: null, cost: 2, req: [], fx: [{ op: 'descend' }, { op: 'draw', n: 1 }], text: '*Descender.* Roba 1.', circle: 2 },
  campanas: { name: 'Campanas del Juicio', type: 'rito', sub: 'Rito', senda: null, cost: 3, req: [], fx: [{ op: 'draw', n: 3, if: 'destino' }, { op: 'draw', n: 1, if: 'sinDestino' }], text: 'Roba 1. *Destino:* roba 3 en su lugar.', circle: 9 },
  prevision: { name: 'Previsión', type: 'juicio', sub: 'Juicio', senda: null, cost: 2, req: [], fx: [{ op: 'draw', n: 2 }], text: 'Roba 2.', doc: true, circle: 1 },
  extremos: { name: 'Juicio de los extremos', type: 'juicio', sub: 'Juicio', senda: null, cost: 2, req: [], fx: [{ op: 'punishExtreme', n: 3 }], text: 'Si el rival es Virtuoso o Corrupto, su Peregrino pierde 3 de Voluntad.', circle: 1 },
  contricion: { name: 'Contrición', type: 'juicio', sub: 'Juicio', senda: null, cost: 1, req: [], target: 'ownSoul', harm: false, fx: [{ op: 'flip' }], text: 'Mueve tu Balanza: voltea una de tus Almas.', circle: 1 },
  tibios: { name: 'Oración de los tibios', type: 'juicio', sub: 'Juicio', senda: null, cost: 2, req: [], fx: [{ op: 'gainWill', n: 3, if: 'tibio' }], text: 'Si eres Tibio, ganas 3 de Voluntad.', circle: 1 },
  vendaval: { name: 'Vendaval de Lujuria', type: 'juicio', sub: 'Juicio', senda: null, cost: 1, req: [], target: 'ente', harm: false, fx: [{ op: 'shift' }], text: 'Mueve un Ente a la otra fila (si ataca o bloquea, sale del combate).', circle: 2 },
  lampara: { name: 'Lámpara votiva', type: 'reliquia', sub: 'Reliquia', senda: null, cost: 2, req: [], attach: 'loose', endTurn: [{ op: 'gainWill', n: 1 }], text: 'Suelta en Retaguardia: al final de tu turno, ganas 1 de Voluntad.', circle: 1 },
  corona: { name: 'Corona de espinas', type: 'reliquia', sub: 'Reliquia', senda: null, cost: 2, req: [], attach: 'pilgrim', startTurn: [{ op: 'gainWill', n: 1 }], text: 'Unida a tu Peregrino: al inicio de tu turno, ganas 1 de Voluntad.', circle: 1 },
  guadana: { name: 'La guadaña', type: 'reliquia', sub: 'Reliquia', senda: null, cost: 3, req: [], attach: 'ownEnte', equip: { f: 1, r: 1, kw: ['primerGolpe'] }, text: 'Unida a un Ente: tiene +1/+1 y *Primer golpe.*', circle: 7 },
};

// ─────────────── ALMAS (mazo de recursos) ───────────────
// Regla alpha «Gracia»: al absolver cualquier Alma, tu Peregrino gana 1 de Voluntad.
export const SOULS = {
  paolo: { name: 'Paolo', senda: null, condemn: { target: 'ente', harm: false, fx: [{ op: 'buff', f: 1, r: 0 }] }, text: 'Un Ente recibe +1/+0 este turno.', doc: true, pose: 'embrace' },
  limbo: { name: 'Alma del Limbo', senda: null, condemn: { fx: [{ op: 'draw', n: 1 }] }, text: 'Roba 1.', pose: 'stand' },
  vestibulo: { name: 'Alma del Vestíbulo', senda: null, condemn: { target: 'ente', harm: false, fx: [{ op: 'shift' }] }, text: 'Mueve un Ente a la otra fila.', pose: 'cower' },
  argenti: { name: 'Filippo Argenti', senda: 'ira', condemn: { target: 'ente', harm: true, fx: [{ op: 'damage', n: 1 }] }, text: 'Inflige 1 de daño a un Ente.', pose: 'rage' },
  estigia: { name: 'Alma de la Estigia', senda: 'ira', condemn: { fx: [{ op: 'loseWillOpp', n: 1 }] }, text: 'El Peregrino rival pierde 1 de Voluntad.', pose: 'drown' },
  furibunda: { name: 'Alma furibunda', senda: 'ira', condemn: { target: 'ownEnte', harm: false, fx: [{ op: 'buff', f: 2, r: 0 }] }, text: 'Un Ente tuyo recibe +2/+0 este turno.', pose: 'rage' },
  ciacco: { name: 'Ciacco', senda: 'gula', condemn: { fx: [{ op: 'draw', n: 1 }] }, text: 'Roba 1.', doc: true, pose: 'kneel' },
  lluviaAlma: { name: 'Alma bajo la lluvia', senda: 'gula', condemn: { fx: [{ op: 'gainWill', n: 2 }] }, text: 'Tu Peregrino gana 2 de Voluntad.', pose: 'cower' },
  hinchada: { name: 'Alma hinchada', senda: 'gula', condemn: { target: 'ownEnte', harm: false, fx: [{ op: 'grow', f: 1, r: 1 }] }, text: 'Un Ente tuyo recibe +1/+1 para siempre.', pose: 'kneel' },
  avara: { name: 'Alma avara', senda: 'avaricia', condemn: { fx: [{ op: 'gainGold', n: 2 }] }, text: 'Ganas 2 de Oro.', pose: 'push' },
  prodiga: { name: 'Pródiga arrepentida', senda: 'avaricia', condemn: { fx: [{ op: 'draw', n: 1 }] }, text: 'Roba 1.', pose: 'push' },
  rueda: { name: 'Alma de la rueda', senda: 'avaricia', condemn: { fx: [{ op: 'loseWillOpp', n: 1 }] }, text: 'El Peregrino rival pierde 1 de Voluntad.', pose: 'push' },
  guido: { name: 'Guido da Montefeltro', senda: 'fraude', condemn: { fx: [{ op: 'revealHand' }, { op: 'draw', n: 1 }] }, text: 'Mira la mano del rival. Roba 1.', pose: 'hood' },
  falsaria: { name: 'Alma falsaria', senda: 'fraude', condemn: { fx: [{ op: 'loseWillOpp', n: 1 }] }, text: 'El Peregrino rival pierde 1 de Voluntad.', pose: 'hood' },
  malebolge: { name: 'Alma de Malebolge', senda: 'fraude', condemn: { fx: [{ op: 'mill', n: 3, who: 'opp' }] }, text: '*Sepultar 3.*', pose: 'hood' },
  bocca: { name: 'Bocca degli Abati', senda: 'traicion', condemn: { target: 'ente', harm: true, fx: [{ op: 'tap' }] }, text: 'Agota un Ente.', pose: 'trapped' },
  cocitoAlma: { name: 'Alma del Cocito', senda: 'traicion', condemn: { fx: [{ op: 'draw', n: 1 }] }, text: 'Roba 1.', pose: 'trapped' },
  antenora: { name: 'Alma de Antenora', senda: 'traicion', condemn: { target: 'enemyEnte', harm: true, fx: [{ op: 'tap', freeze: true }] }, text: 'Agota un Ente rival: no se endereza en su próximo Enderezar.', pose: 'trapped' },
};

// ─────────────── PEREGRINOS ───────────────
export const PILGRIMS = {
  francesca: {
    name: 'Francesca', full: 'Francesca da Rimini', sendas: ['ira', 'gula'], will: 20, playable: true, style: 'agresivo',
    ability: { cost: 2, target: 'ownEnte', harm: false, fx: [{ op: 'buff', f: 1, r: 1 }], text: 'Paga 2: un Ente tuyo recibe +1/+1 este turno.' },
    redencion: { text: 'Tus Entes en Vanguardia tienen +0/+1.' }, caida: { text: 'Tus Entes atacantes tienen +1/+0.' },
    blurb: 'Ira y Gula: presiona pronto y crece con lo que sacrifica.',
  },
  virgilio: {
    name: 'Virgilio', full: 'Virgilio', sendas: ['traicion', 'fraude'], will: 20, playable: true, style: 'control',
    ability: { cost: 1, fx: [{ op: 'scry', n: 3 }], text: 'Paga 1: mira las 3 cartas superiores de un mazo y ordénalas.', doc: true },
    redencion: { text: 'Tus Juicios cuestan 1 menos (mínimo 1). Cuando se resuelve un Juicio tuyo, ganas 1 de Voluntad.' }, caida: { text: 'Cuando se resuelve un Juicio tuyo, el Peregrino rival pierde 2 de Voluntad.' },
    blurb: 'Traición y Fraude: responde, congela y llega al Juicio Final.',
  },
  farinata: {
    name: 'Farinata', full: 'Farinata degli Uberti', sendas: ['ira'], will: 20, playable: true, style: 'agresivo',
    ability: { cost: 2, fx: [{ op: 'loseWillOpp', n: 1 }], text: 'Paga 2: el Peregrino rival pierde 1 de Voluntad.' },
    redencion: { text: 'Tus Entes de Ira tienen +0/+1.' }, caida: { text: 'Al inicio de tu turno, el Peregrino rival pierde 1 de Voluntad.' },
    blurb: 'Ira pura: fuego directo, Asedio y ataques que no dan respiro.',
  },
  forese: {
    name: 'Forese', full: 'Forese Donati', sendas: ['gula'], will: 20, playable: true, style: 'medio',
    ability: { cost: 4, target: 'ownEnte', harm: false, fx: [{ op: 'grow', f: 1, r: 1 }], text: 'Paga 4: un Ente tuyo recibe +1/+1 para siempre.' },
    redencion: { text: 'Al absolver un Alma, tu Ente con menos Fuerza recibe +1/+1 para siempre.' }, caida: { text: 'Cuando un Ente tuyo muere, el Peregrino rival pierde 1 de Voluntad.' },
    blurb: 'Gula pura: Entes que crecen, sacrificio y el Olvido como despensa.',
  },
  eneas: {
    name: 'Eneas', full: 'Eneas', sendas: ['avaricia'], will: 20, playable: true, style: 'control',
    ability: { cost: 3, fx: [{ op: 'draw', n: 1 }, { op: 'gainGold', n: 1 }], text: 'Paga 3: roba 1 y ganas 1 de Oro.' },
    redencion: { text: 'Al inicio de tu turno, ganas 1 de Oro.' }, caida: { text: 'Si tienes Oro, tus Entes en Vanguardia tienen +1/+0.' },
    blurb: 'Avaricia pura: la rama dorada. Acumula Oro, levanta muros y roba.',
  },
  ulises: {
    name: 'Ulises', full: 'Ulises', sendas: ['fraude'], will: 20, playable: true, style: 'medio',
    ability: { cost: 2, fx: [{ op: 'revealHand' }, { op: 'draw', n: 1 }], text: 'Paga 2: mira la mano del rival y roba 1.' },
    redencion: { text: 'Tus Juicios no pueden ser anulados.' }, caida: { text: 'Cuando juegas un Juicio, Sepultar 2.' },
    blurb: 'Fraude puro: engaño, anulaciones y un mazo rival que se vacía.',
  },
  dante: {
    name: 'Dante', full: 'Dante Alighieri', sendas: ['traicion'], will: 20, playable: true, style: 'control',
    ability: { cost: 3, target: 'enemyEnte', harm: true, fx: [{ op: 'tap', freeze: true }], text: 'Paga 3: agota un Ente rival; no se endereza en su próximo Enderezar.' },
    redencion: { text: 'Tus Entes con Guardián tienen +0/+2.' }, caida: { text: 'Los Entes rivales congelados tienen -1/-1.' },
    blurb: 'Traición pura: hielo, muros y un final de partida implacable.',
  },
};
export const PILGRIM_IDS = ['francesca', 'virgilio', 'farinata', 'forese', 'eneas', 'ulises', 'dante'];

// ─────────────── construcción de mazos ───────────────
export const DECK_RULES = { main: 50, souls: 20, maxCopies: 3, maxIlustre: 1, sideboard: 10 };
export function legalFor(pid, id) {
  const P = PILGRIMS[pid]; const d = CARDS[id] || SOULS[id]; if (!d) return false;
  return !d.senda || P.sendas.includes(d.senda);
}
export function validateDeck(pid, main, souls) {
  const errs = []; let nm = 0, ns = 0;
  for (const [id, n] of Object.entries(main)) {
    const d = CARDS[id]; if (!d) { errs.push(`Carta desconocida: ${id}`); continue; } nm += n;
    if (!legalFor(pid, id)) errs.push(`${d.name} no es de las Sendas de tu Peregrino.`);
    if (d.type === 'ilustre' && n > 1) errs.push(`${d.name}: los Ilustres van 1 por mazo.`);
    else if (n > 3) errs.push(`${d.name}: máximo 3 copias.`);
  }
  for (const [id, n] of Object.entries(souls)) { const d = SOULS[id]; if (!d) { errs.push(`Alma desconocida: ${id}`); continue; } ns += n; if (!legalFor(pid, id)) errs.push(`${d.name} no es de las Sendas de tu Peregrino.`); }
  if (nm !== 50) errs.push(`El Mazo Principal debe tener 50 cartas exactas (tiene ${nm}).`);
  if (ns !== 20) errs.push(`El Mazo de Almas debe tener 20 Almas exactas (tiene ${ns}).`);
  return { ok: errs.length === 0, errs, nm, ns };
}
// Mazo sugerido: todas las cartas de sus Sendas (3 copias; Ilustres 1), rellenado con neutrales y recortado a 50.
const NEUTRAL_PRIORITY = ['prevision', 'caronte', 'arquero', 'centauro', 'poeta', 'almaErrante', 'arpia', 'minos', 'vendaval', 'tibios', 'campanas', 'lampara', 'corona', 'guadana', 'extremos', 'contricion', 'minotauro', 'descensoForzado'];
export function suggestedDeck(pid) {
  const P = PILGRIMS[pid]; const main = {};
  // Con dos Sendas el umbral se reparte: el mazo sugerido evita las cartas de tres símbolos iguales.
  const triple = id => CARDS[id].req.length >= 3 && new Set(CARDS[id].req).size === 1;
  const own = Object.keys(CARDS).filter(id => CARDS[id].senda && P.sendas.includes(CARDS[id].senda) && !(P.sendas.length > 1 && triple(id)));
  const copies = P.sendas.length === 1 ? 3 : 2;
  for (const id of own) main[id] = CARDS[id].type === 'ilustre' ? 1 : copies;
  const count = () => Object.values(main).reduce((a, b) => a + b, 0);
  // recorta por coste alto si sobra
  const byCost = own.filter(id => CARDS[id].type !== 'ilustre').sort((a, b) => CARDS[b].cost - CARDS[a].cost || CARDS[b].req.length - CARDS[a].req.length);
  let k = 0; while (count() > 50 && k < 200) { const id = byCost[k % byCost.length]; if (main[id] > 1) main[id]--; k++; }
  for (const id of NEUTRAL_PRIORITY) { if (count() >= 50) break; const add = Math.min(CARDS[id].type === 'ilustre' ? 1 : 2, 50 - count()); main[id] = (main[id] || 0) + add; }
  let j = 0; const fill = own.filter(id => CARDS[id].type !== 'ilustre').sort((a, b) => CARDS[a].cost - CARDS[b].cost);
  while (count() < 50 && j < 300) { const id = fill[j % fill.length]; if ((main[id] || 0) < 3) main[id] = (main[id] || 0) + 1; j++; }
  const souls = {}; const ownSouls = Object.keys(SOULS).filter(id => SOULS[id].senda && P.sendas.includes(SOULS[id].senda));
  const per = Math.floor(17 / ownSouls.length); ownSouls.forEach(id => souls[id] = per);
  const neutralSouls = ['limbo', 'paolo', 'vestibulo']; let s = Object.values(souls).reduce((a, b) => a + b, 0), i = 0;
  while (s < 20) { const id = i < ownSouls.length ? ownSouls[i] : neutralSouls[i % 3]; souls[id] = (souls[id] || 0) + 1; s++; i++; }
  return { main, souls };
}

// ─────────────── GLOSARIO (tooltips) ───────────────
export const GLOSSARY = {
  'Peregrino': 'Tu líder. Empieza en juego, tiene 20 de Voluntad, define tus Sendas y tiene una habilidad base (1 vez por turno), Redención y Caída. No ataca ni bloquea.',
  'Voluntad': 'La vida del Peregrino (d20). Empieza en 20; si llega a 0, pierdes.',
  'Senda': 'Identidad de color: Ira, Gula, Avaricia, Fraude y Traición. Tu mazo solo lleva cartas de las Sendas de tu Peregrino o neutrales.',
  'Umbral': 'Los símbolos de Senda que tienes en juego (Almas absueltas + tu Peregrino). No se gasta: basta con tenerlos al jugar la carta.',
  'Energía': 'Se obtiene agotando Almas (1 cada una) y se gasta en el número del coste. La no gastada se pierde al final de cada fase.',
  'Oro': 'Energía guardada (máximo 3) que puede gastarse más tarde. Se gana en el Círculo IV (Avaricia) con la energía no gastada al final del turno, y con cartas de Avaricia.',
  'Alma': 'Carta del Mazo de Almas. Juegas máximo 1 por turno, sin usar la Cadena, y eliges absolverla o condenarla.',
  'Absolver': 'El Alma entra boca arriba: da 1 de energía al agotarse, aporta su símbolo de Senda al umbral, mueve tu Balanza hacia la Virtud y (Gracia) tu Peregrino gana 1 de Voluntad.',
  'Gracia': 'Regla alpha: al absolver un Alma, tu Peregrino gana 1 de Voluntad.',
  'Condenar': 'El Alma entra boca abajo: da 1 de energía al agotarse, resuelves de inmediato su línea de Condena, no aporta Senda y mueve tu Balanza hacia la Corrupción.',
  'Condena': 'La línea inferior de un Alma: el efecto inmediato que obtienes si la condenas.',
  'Balanza': 'La diferencia entre tus Almas absueltas y condenadas. Virtuoso con 3+ absueltas de ventaja, Corrupto con 3+ condenadas, Tibio en medio.',
  'Virtuoso': 'Tienes 3 o más Almas absueltas de ventaja. Se activan las habilidades con icono de halo.',
  'Corrupto': 'Tienes 3 o más Almas condenadas de ventaja. Se activan las habilidades con icono de cuernos.',
  'Tibio': 'Menos de 3 de ventaja hacia cualquier lado. Sin bonus, a salvo de los Juicios que castigan extremos; pierde los empates del Juicio Final.',
  'Destino': 'Con 5 de ventaja se desbloquea para siempre la Redención (Virtud) o la Caída (Corrupción) de tu Peregrino. Las cartas con «Destino:» mejoran cuando ya lo has alcanzado.',
  'Sin Destino': 'Las cartas con «Sin Destino:» mejoran mientras aún no hayas alcanzado tu Destino: premian la presión temprana.',
  'Redención': 'Habilidad del Peregrino que se desbloquea para siempre con 5 Almas absueltas de ventaja.',
  'Caída': 'Habilidad del Peregrino que se desbloquea para siempre con 5 Almas condenadas de ventaja.',
  'Descenso': 'La carta compartida con los 9 Círculos. Un d10 marca el activo. Sube 1 al inicio de cada ronda, en el turno del jugador inicial.',
  'Descender': 'El dado del Descenso sube un círculo de inmediato.',
  'Círculo': 'Cada Círculo aplica una regla global a los dos jugadores mientras está activo. Algunas cartas mejoran a partir de cierto Círculo.',
  'Ronda': 'Dos turnos, uno de cada jugador.',
  'Cadena': 'La pila de Sulphur. Juicios, habilidades activadas y disparadores entran en la Cadena y se resuelven de la última a la primera.',
  'Prioridad': 'El derecho a actuar. El jugador activo la recibe primero. Con prioridad puedes jugar un Juicio, activar una habilidad o pasar.',
  'APNAP': 'Orden jugador activo, luego jugador no activo. Los disparadores de cada jugador entran en el orden en que se dispararon.',
  'Juicio': 'Carta instantánea: se juega en cualquier momento con prioridad. Respuestas, trucos de combate, anulaciones.',
  'Rito': 'Efecto único y potente a velocidad lenta: solo en tu fase principal con la Cadena vacía. Va al Olvido tras resolverse.',
  'Ente': 'Criatura que ocupa la Vanguardia o la Retaguardia. Tiene Fuerza / Resistencia.',
  'Ilustre': 'Ente único con nombre. Máximo 1 copia en el mazo y 1 en juego por nombre.',
  'Reliquia': 'Equipo o artefacto permanente: unida a un Ente o al Peregrino, o suelta ocupando un espacio de Retaguardia. Si su Ente deja la mesa, va al Olvido.',
  'Vanguardia': 'Fila más cercana al rival. Hasta 5 Entes que atacan y bloquean. Es vulnerable.',
  'Retaguardia': 'Fila justo detrás (3 espacios) para Entes o Reliquias sueltas. No ataca ni bloquea; activa las habilidades de Apoyo. Solo la alcanza el Asedio.',
  'Apoyo': 'Habilidad que funciona mientras el Ente está en tu Retaguardia.',
  'Olvido': 'Descartes, cartas destruidas y cartas sepultadas, en un montón boca arriba junto a los mazos.',
  'Sepultar': 'Sepultar N: el rival pone las N cartas superiores de su Mazo Principal en su Olvido (si dice «en tu propio mazo», las tuyas). Acerca al Agotamiento y alimenta el Olvido.',
  'Quemar': 'Una carta Quemada sale de la partida (se guarda en la caja). Es el exilio de Sulphur.',
  'Quema': 'Una carta Quemada sale de la partida (se guarda en la caja). Es el exilio de Sulphur.',
  'Fuerza': 'El daño que hace un Ente en combate.',
  'Resistencia': 'Un Ente muere si recibe daño igual o mayor a su Resistencia. El daño se borra al final del turno.',
  'Agotar': 'Girar una carta 90°. Las Almas se agotan para dar energía; los Entes al atacar.',
  'Enderezar': 'Al inicio de tu turno enderezas tus Almas, Entes y Reliquias agotadas.',
  'Vuelo': KEYWORDS.vuelo.text, 'Primer golpe': KEYWORDS.primerGolpe.text, 'Guardián': KEYWORDS.guardian.text,
  'Embestida': KEYWORDS.embestida.text, 'Ira ciega': KEYWORDS.iraCiega.text, 'Asedio': KEYWORDS.asedio.text,
  'Al morir': 'Disparador: cuando el Ente muere, su efecto entra en la Cadena.',
  'Al entrar': 'Disparador: cuando el Ente entra en juego, su efecto entra en la Cadena.',
  'Al atacar': 'Disparador: cuando el Ente es declarado atacante, su efecto entra en la Cadena.',
  'Al cambiar de fila': 'Disparador: cuando el Ente pasa de la Vanguardia a la Retaguardia o al revés (por ti, por un efecto o por Lujuria).',
  'Juicio Final': 'Al terminar la ronda del Noveno Círculo gana quien tenga más Voluntad. Empate: gana quien esté más lejos del centro de la Balanza; el tibio pierde. Si siguen empatados, tablas.',
  'Agotamiento': 'Si debes robar y no quedan cartas en ninguno de tus dos mazos, pierdes.',
};

export function buildDeckList(map) {
  const out = [];
  for (const [id, n] of Object.entries(map)) for (let i = 0; i < n; i++) out.push(id);
  return out;
}
