// SULPHUR — Códice: el contenido íntegro del «Núcleo de reglas» y la «Dirección artística», consultable en la demo.
import { CIRCLES, SENDAS, SENDA_KEYS, TYPES, KEYWORDS, PILGRIMS, PILGRIM_IDS, CARDS } from './data.js';

const ic = k => `<i class="ic" data-ic="${k}"></i>`;
const circleRows = () => CIRCLES.slice(1).map(c => `<tr><td class="num">${c.roman}. ${c.name}</td><td>${c.rule}</td></tr>`).join('');
const circleArt = () => CIRCLES.slice(1).map(c => `<tr><td class="num"><span class="swatch" style="background:${c.band}"></span>${c.roman}. ${c.name}</td><td>${c.ambiente}</td><td>${c.luz}</td><td>${c.motivos}</td></tr>`).join('');
const sendaRows = () => SENDA_KEYS.map(k => { const s = SENDAS[k]; return `<tr><td class="num">${ic(k)} <b style="color:${s.color}">${s.name}</b></td><td><span class="swatch" style="background:${s.color}"></span>${s.colorName}</td><td>${s.symbol}</td><td>${s.ambiente}</td><td>${s.criaturas}</td></tr>`; }).join('');
const typeRows = () => ['ente', 'ilustre', 'rito', 'juicio', 'reliquia', 'alma', 'peregrino', 'circulo'].map(k => { const t = TYPES[k]; return `<tr><td class="num">${t.name}</td><td>${t.where}</td><td>${t.when}</td><td>${t.what}</td></tr>`; }).join('');
const frameRows = () => ['ente', 'ilustre', 'rito', 'juicio', 'reliquia', 'alma', 'peregrino'].map(k => { const t = TYPES[k]; return `<tr><td class="num">${t.name}</td><td>${t.frame}</td><td>${t.detail}</td></tr>`; }).join('');

export const CODEX = [
  { group: 'Núcleo de reglas', id: 'vision', title: 'Visión general', html: `
<p class="lead">Sulphur es un TCG 1vs1 en el que cada jugador es un <b>Peregrino</b> que desciende por los 9 círculos del Infierno y decide, alma a alma, si <b>absolver</b> o <b>condenar</b>. Una partida al mejor de uno dura 20–40 minutos según el mazo: los agresivos ganan hacia el círculo V o VI y los de control llegan al Juicio Final.</p>
<h3>Pilares de diseño</h3>
<ul>
<li><b>Cada alma es un dilema.</b> Absolver da color y virtud a largo plazo; condenar da poder inmediato y corrupción.</li>
<li><b>La partida cambia de acto.</b> El círculo activo altera una regla global cada ronda, en orden fijo y conocido.</li>
<li><b>Interacción en ambos turnos.</b> Los Juicios se juegan en cualquier momento, con una pila más simple que la de Magic.</li>
<li><b>Profundidad sin texto largo.</b> Cartas de 1–2 líneas; la dificultad está en el tempo, la balanza y el combate.</li>
</ul>
<h3>Qué toma de cada referente</h3>
<ul>
<li><b>De Magic:</b> la pila, las respuestas instantáneas, el combate con bloqueadores y el líder que define la identidad del mazo.</li>
<li><b>De Sorcery y Entropy:</b> el mazo de recursos separado, el robo eligiendo mazo y el umbral de color que no se gasta.</li>
<li><b>Propio:</b> la Balanza entre Virtud y Corrupción y el Descenso por los círculos como reloj de la partida.</li>
</ul>` },

  { group: 'Núcleo de reglas', id: 'mesa', title: 'Disposición en mesa', html: `
<p class="lead">Cada jugador usa 6 zonas y hay una compartida, todas reconocibles sin tapete: dos filas de juego, una fila de Almas, tres montones de cartas y el Peregrino con su dado de Voluntad. El Descenso es una sola carta de referencia con un d10.</p>
<p>Sin tapete, la regla es la de siempre: lo más cercano al rival es tu <b>Vanguardia</b>, lo que está detrás es tu <b>Retaguardia</b>, y al fondo van tus <b>Almas</b>, tu <b>Peregrino</b> y tus <b>mazos</b>. Todo lo que cambia de valor se marca con un dado.</p>
<table><tr><th>Zona</th><th>Qué hay</th><th>Cómo se marca sin tapete</th></tr>
<tr><td class="num">Vanguardia</td><td>Hasta 5 Entes que atacan y bloquean</td><td>Fila más cercana al rival</td></tr>
<tr><td class="num">Retaguardia</td><td>Hasta 3 Entes de Apoyo o Reliquias sueltas</td><td>Fila justo detrás</td></tr>
<tr><td class="num">Almas</td><td>Tus recursos</td><td>Fila al fondo: absueltas boca arriba, condenadas boca abajo; la diferencia es tu Balanza</td></tr>
<tr><td class="num">Peregrino</td><td>Tu líder y sus Reliquias</td><td>Centro del fondo, con un d20 encima para la Voluntad</td></tr>
<tr><td class="num">Mazos</td><td>Mazo Principal y Mazo de Almas</td><td>Dos montones; los dorsos distintos evitan confusiones</td></tr>
<tr><td class="num">Olvido</td><td>Descartes y cartas destruidas</td><td>Montón boca arriba junto a los mazos</td></tr>
<tr><td class="num">Descenso (compartida)</td><td>Los 9 Círculos</td><td>Una carta a un lado de la mesa con un d10</td></tr></table>
<p>El exilio no necesita zona: una carta <b>Quemada</b> sale de la partida y se guarda en la caja. Es la versión de Sulphur del exilio de Magic.</p>
<p class="note">En la demo: tus Almas absueltas se colocan a la izquierda (lado de la Virtud) y las condenadas a la derecha (lado de la Corrupción), para que la Balanza se lea de un vistazo. La Balanza física junto al Peregrino y su placa con la aguja muestran la misma diferencia.</p>` },

  { group: 'Núcleo de reglas', id: 'peregrino', title: 'El Peregrino', html: `
<p class="lead">El Peregrino es tu comandante: empieza en juego, define qué cartas puede llevar tu mazo y es el objetivo que el rival quiere derribar. Ejemplos: Dante, Virgilio, Eneas, Francesca, Farinata, Ulises.</p>
<h3>Qué tiene impreso</h3>
<ul>
<li><b>Voluntad 20.</b> Es tu vida y se marca con un d20 sobre el Peregrino. Si llega a 0, pierdes.</li>
<li><b>Sendas (1 o 2).</b> Son sus colores. Tu mazo solo puede incluir cartas de esas Sendas o neutrales, como la identidad de color en Commander.</li>
<li><b>Habilidad base.</b> Una habilidad activada, una vez por turno. Por ejemplo, Virgilio: «Paga 2: mira las 3 cartas superiores de un mazo y ordénalas».</li>
<li><b>Redención y Caída.</b> Dos habilidades bloqueadas que se desbloquean con la Balanza.</li>
</ul>
<h3>Reglas del Peregrino</h3>
<ul>
<li>No ataca ni bloquea. Es el corazón de tu mesa, no una criatura más.</li>
<li>Aporta sus Sendas como umbral permanente desde el turno 1, así que nunca te quedas sin color.</li>
<li>Solo el daño de combate no bloqueado y los efectos que digan «Peregrino» reducen su Voluntad.</li>
<li>Puede llevar Reliquias equipadas, que modifican su habilidad o le dan protección.</li>
</ul>` },

  { group: 'Núcleo de reglas', id: 'tipos', title: 'Tipos de carta y anatomía', html: `
<p class="lead">Hay cuatro tipos en el mazo principal, más las Almas (mazo de recursos), el Peregrino y la carta de Descenso (compartida). Cinco Sendas dan identidad a las cartas: ${ic('ira')} Ira (rojo, agresión), ${ic('gula')} Gula (verde enfermizo, crecimiento y sacrificio), ${ic('avaricia')} Avaricia (oro, economía y robo), ${ic('fraude')} Fraude (violeta, engaño y cartas ocultas) y ${ic('traicion')} Traición (azul hielo, control y congelar).</p>
<table><tr><th>Tipo</th><th>Dónde está</th><th>Cuándo se juega</th><th>Qué hace</th></tr>${typeRows()}</table>
<h3>Anatomía de una carta del mazo principal</h3>
<ul>
<li><b>Arriba a la izquierda:</b> coste en energía (número) y, a su lado, los símbolos de Senda que exige como umbral.</li>
<li><b>Centro:</b> ilustración a sangre, ocupando al menos dos tercios de la carta, en estilo de grabado.</li>
<li><b>Franja de nombre:</b> nombre y línea de tipo (por ejemplo, «Ente — Demonio, Ira»).</li>
<li><b>Caja de texto:</b> 1–2 líneas. Las habilidades condicionadas llevan un icono de halo ${ic('halo')} (Virtuoso) o de cuernos ${ic('horns')} (Corrupto).</li>
<li><b>Abajo:</b> Fuerza | Resistencia en grande, legibles a un metro.</li>
</ul>
<h3>Anatomía de un Alma</h3>
<ul>
<li>Símbolo de Senda grande en el centro, sobre la ilustración del alma.</li>
<li>Abajo, la línea de <b>Condena</b>: el efecto inmediato que obtienes si la condenas (por ejemplo, «Roba 1» o «Un Ente recibe +1/+0 este turno»).</li>
<li>Dorso distinto al del mazo principal, para reconocerla en mano y en mesa.</li>
</ul>` },

  { group: 'Núcleo de reglas', id: 'recursos', title: 'Recursos: Almas, energía y Sendas', html: `
<p class="lead">Cada turno puedes jugar un Alma y elegir cómo: absolverla te da color y virtud, condenarla te da un efecto inmediato y corrupción. Las dos dan energía, así que nunca hay <i>screw</i> de recursos; la decisión es qué tipo de ventaja quieres.</p>
<div class="two">
<div class="box gold"><h3>${ic('halo')} Absolver</h3><ul>
<li>El Alma entra <b>boca arriba</b> en tu Zona de Almas.</li><li>Se agota para dar 1 de energía.</li>
<li>Aporta su símbolo de Senda a tu umbral mientras está en juego.</li><li>Mueve tu Balanza 1 paso hacia la <b>Virtud</b>.</li></ul></div>
<div class="box ash"><h3>${ic('horns')} Condenar</h3><ul>
<li>El Alma entra <b>boca abajo</b> en tu Zona de Almas.</li><li>Se agota para dar 1 de energía.</li>
<li>Resuelves de inmediato su línea de Condena.</li><li>No aporta Senda. Mueve tu Balanza 1 paso hacia la <b>Corrupción</b>.</li></ul></div></div>
<h3>${ic('energia')} Energía y umbral</h3>
<ul>
<li><b>La energía se gasta:</b> agotas Almas para pagar el número del coste. La energía no gastada se pierde al final de cada fase.</li>
<li><b>El umbral no se gasta:</b> basta con tener en juego esos símbolos (Almas absueltas y el Peregrino) al jugar la carta.</li>
<li><b>Ejemplo:</b> una carta «4 + ${ic('ira')}${ic('ira')}» exige dos símbolos de Ira en tu umbral y cuesta 4 Almas agotadas.</li>
</ul>
<h3>Reglas de las Almas</h3>
<ul>
<li>Máximo 1 Alma jugada por turno, salvo que una carta diga otra cosa.</li>
<li>Jugar un Alma no usa la pila ni te quita la prioridad.</li>
<li>Algunos efectos pueden voltear un Alma (de absuelta a condenada o al revés), lo que cambia tu umbral y tu Balanza.</li>
</ul>
<p class="note">En la demo: pulsa un Alma tuya enderezada para agotarla y añadir 1 de energía a tu reserva. Al pagar un coste, la demo usa primero la reserva, luego agota Almas automáticamente y, por último, el Oro.</p>` },

  { group: 'Núcleo de reglas', id: 'balanza', title: 'La Balanza: Virtud y Corrupción', html: `
<p class="lead">La Balanza no se marca con nada: es la diferencia entre tus Almas absueltas (boca arriba) y condenadas (boca abajo). Los dos jugadores la leen de un vistazo en la mesa.</p>
<table><tr><th>Diferencia en tus Almas</th><th>Estado</th><th>Efecto</th></tr>
<tr><td>3 o más absueltas de ventaja</td><td class="num">${ic('halo')} Virtuoso</td><td>Se activan las habilidades con icono de halo.</td></tr>
<tr><td>Menos de 3 de ventaja hacia cualquier lado</td><td class="num">Tibio</td><td>Sin bonus. Estás a salvo de los Juicios que castigan extremos.</td></tr>
<tr><td>3 o más condenadas de ventaja</td><td class="num">${ic('horns')} Corrupto</td><td>Se activan las habilidades con icono de cuernos.</td></tr>
<tr><td>5 absueltas de ventaja</td><td class="num">Destino: Redención</td><td>Se desbloquea para siempre la habilidad de Redención de tu Peregrino.</td></tr>
<tr><td>5 condenadas de ventaja</td><td class="num">Destino: Caída</td><td>Se desbloquea para siempre la habilidad de Caída de tu Peregrino.</td></tr></table>
<h3>Reglas de la Balanza</h3>
<ul>
<li>Cambia al jugar Almas y cuando un efecto voltea, sacrifica o devuelve un Alma. Cuando una carta dice «mueve tu Balanza», significa voltear una de tus Almas.</li>
<li><b>Ejemplo:</b> con 6 absueltas y 2 condenadas tienes 4 de ventaja hacia la Virtud. Eres Virtuoso y estás a una de la Redención.</li>
<li>El primer Destino que alcances es el tuyo: el otro queda bloqueado el resto de la partida.</li>
<li>La habilidad del Destino se conserva aunque después la diferencia baje.</li>
<li>Hay Juicios que castigan al rival Virtuoso o Corrupto. Los extremos dan poder y te exponen; el centro es seguro pero no da nada.</li>
<li>En el Juicio Final, el tibio pierde los empates, un guiño a los indecisos que Dante encuentra en el Vestíbulo.</li>
</ul>` },

  { group: 'Núcleo de reglas', id: 'descenso', title: 'El Descenso: los 9 Círculos', html: `
<p class="lead">La partida avanza un círculo por ronda, en el orden canónico, y el círculo activo aplica una regla global a los dos jugadores. Como el orden es fijo y público, puedes construir tu mazo pensando en qué círculo quieres presionar o cerrar la partida.</p>
<h3>Cómo funciona</h3>
<ul>
<li>Los 9 Círculos van impresos en una única carta de Descenso, a un lado de la mesa. Un d10 sobre ella marca el círculo activo.</li>
<li>Una <b>ronda</b> son dos turnos, uno de cada jugador.</li>
<li>Al inicio de cada ronda, en el turno del jugador inicial, el dado del Descenso sube un número.</li>
<li>Al terminar la ronda del Noveno Círculo llega el <b>Juicio Final</b> y la partida acaba. Con unos 2 minutos por turno, ese techo queda cerca de los 36 minutos.</li>
<li>Algunas cartas tienen <b>Descender</b>: el dado sube un círculo de inmediato. Los mazos agresivos lo usan para llegar antes a Ira y Violencia; los de control, para adelantar el Juicio Final.</li>
</ul>
<h3>Set de círculos de ejemplo (temporada 1)</h3>
<table><tr><th>Círculo</th><th>Regla global mientras está activo</th></tr>${circleRows()}</table>
<p>Cada temporada competitiva publica una carta de Descenso nueva, con otras versiones de los círculos. Así se renueva el formato sin cambiar el orden.</p>` },

  { group: 'Núcleo de reglas', id: 'turno', title: 'Estructura del turno', html: `
<p class="lead">El turno sigue el esquema de Magic con menos pasos. Solo hay prioridad donde puede pasar algo, y los Juicios pueden jugarse en cualquier momento en que tengas prioridad.</p>
<h3>Preparación de la partida</h3>
<ol>
<li>Cada jugador coloca su Peregrino en su zona y baraja su Mazo Principal y su Mazo de Almas.</li>
<li>Se decide al azar quién empieza. El dado del Descenso se pone en 1 (Limbo).</li>
<li>Cada jugador roba 7 cartas una a una, eligiendo cada vez de qué mazo. No hay mulligan: la elección de mazo ya ajusta la mano.</li>
</ol>
<h3>Turno</h3>
<ol>
<li><b>Inicio.</b> <i>a.</i> Enderezar: endereza tus Almas, Entes y Reliquias agotadas. <i>b.</i> Descenso: solo en el turno del jugador inicial, el dado del Descenso sube un número. <i>c.</i> Robo: roba 1 carta del Mazo Principal o 1 Alma. <b>Alpha:</b> el jugador inicial también roba en su primer turno.</li>
<li><b>Fase principal 1.</b> Juega hasta 1 Alma, Entes, Ritos, Reliquias y Juicios. Mueve Entes entre filas (una vez por Ente y turno).</li>
<li><b>Combate.</b> Ver la sección de Combate.</li>
<li><b>Fase principal 2.</b> Igual que la primera, pero no puedes volver a jugar Alma si ya jugaste una.</li>
<li><b>Final.</b> Se resuelven los efectos «al final del turno», se borra el daño de los Entes y descartas hasta 7 cartas.</li>
</ol>` },

  { group: 'Núcleo de reglas', id: 'combate', title: 'Combate', html: `
<p class="lead">El combate usa dos filas en lugar de una cuadrícula: la Vanguardia lucha y la Retaguardia apoya y está protegida. Es posicional como Sorcery, pero en una sola línea de decisiones, sin casillas ni movimiento por el mapa.</p>
<h3>Las dos filas</h3>
<ul>
<li><b>Vanguardia (hasta 5 Entes).</b> Puede atacar y bloquear. Es vulnerable.</li>
<li><b>Retaguardia (3 espacios).</b> Para Entes o Reliquias sueltas, que compiten por el mismo hueco. No ataca ni bloquea, así que no muere en combate. Activa las habilidades de <b>Apoyo</b> («Mientras está en Retaguardia, tus Entes de Ira tienen +1/+0»).</li>
<li>Un Ente puede cambiar de fila una vez por turno, en tu fase principal. Un Ente que entra en juego elige fila.</li>
</ul>
<h3>Pasos del combate</h3>
<ol>
<li><b>Declarar atacantes.</b> Agota los Entes de Vanguardia que atacan. Todos atacan al Peregrino rival. Los Entes que entraron este turno no pueden atacar. <i>Ventana de Juicios.</i></li>
<li><b>Declarar bloqueadores.</b> El defensor asigna Entes de Vanguardia enderezados, uno por atacante como máximo. <i>Ventana de Juicios.</i></li>
<li><b>Daño.</b> Atacantes y bloqueadores se hacen daño a la vez, igual a su Fuerza. Un Ente muere si recibe daño igual o mayor a su Resistencia. Los atacantes no bloqueados restan su Fuerza a la Voluntad del Peregrino.</li>
<li><b>Fin del combate.</b> Se resuelven los efectos «al morir» en orden APNAP. <i>Ventana de Juicios.</i></li>
</ol>
<h3>Palabras clave de combate (núcleo)</h3>
<table>${Object.entries(KEYWORDS).map(([k, v]) => `<tr><td class="num">${ic(k)} ${v.name}</td><td>${v.text}</td></tr>`).join('')}</table>` },

  { group: 'Núcleo de reglas', id: 'cadena', title: 'La Cadena y la prioridad', html: `
<p class="lead">La pila de Sulphur se llama <b>Cadena</b> y funciona como la de Magic, pero sin capas ni habilidades de maná. Los Juicios y las habilidades activadas entran en la Cadena y se resuelven de la <b>última a la primera</b>.</p>
<h3>Prioridad</h3>
<ul>
<li>El jugador activo recibe la prioridad primero; luego pasa al rival (orden APNAP).</li>
<li>Con prioridad puedes jugar un Juicio, activar una habilidad o pasar.</li>
<li>Cuando los dos pasan seguidos con la Cadena vacía, el juego avanza al siguiente paso.</li>
<li>Cuando los dos pasan con algo en la Cadena, se resuelve lo último añadido y el jugador activo recibe de nuevo la prioridad.</li>
</ul>
<h3>Simplificaciones respecto a Magic</h3>
<ul>
<li>Jugar Almas y agotarlas para energía no usa la Cadena.</li>
<li>No hay prioridad en Enderezar ni en Robo. La primera ventana de un turno es tras el Descenso.</li>
<li>Los disparadores simultáneos se añaden en orden APNAP; dentro de cada jugador, en el orden que él elija.</li>
<li>Sin capas: los efectos continuos se aplican en el orden en que entraron en juego.</li>
</ul>
<h3>Ventanas de Juicio clave</h3>
<ul>
<li>En la fase principal del rival, en respuesta a sus Entes, Ritos o Reliquias.</li>
<li>Tras declarar atacantes, tras declarar bloqueadores y al final del combate.</li>
<li>Al final del turno del rival: el momento típico de las cartas de robo o de despliegue sorpresa.</li>
</ul>
<p class="note">En la demo: cuando juegas algo, pasas la prioridad automáticamente para que el rival pueda responder. Si en una ventana no tienes ninguna respuesta posible, pasas solo; si la tienes, la mesa se detiene y te lo indica. Como en el ejemplo del documento (Cerbero va a la Cadena), también los Entes, Ritos y Reliquias pasan por la Cadena antes de resolverse.</p>` },

  { group: 'Núcleo de reglas', id: 'ejemplo', title: 'Ejemplo de un turno completo', html: `
<p class="lead">Un turno del círculo V con todas sus fases, una respuesta en la Cadena y un combate. Las cartas son inventadas para ilustrar las reglas (todas están en la demo).</p>
<table><tr><th></th><th>Jugadora A (activa, jugadora inicial)</th><th>Jugador B</th></tr>
<tr><td class="num">Peregrino</td><td>Francesca (Ira y Gula), Voluntad 14</td><td>Virgilio (Traición y Fraude), Voluntad 17</td></tr>
<tr><td class="num">Almas</td><td>5: 3 absueltas y 2 condenadas (Tibia)</td><td>5: 4 absueltas y 1 condenada (Virtuoso)</td></tr>
<tr><td class="num">Vanguardia</td><td>Diablillo de Dite, 2/2</td><td>Centinela de hielo, 1/4</td></tr>
<tr><td class="num">Retaguardia</td><td>Tamborilero infernal (Apoyo: tus Entes de Ira tienen +1/+0)</td><td>Vacía</td></tr>
<tr><td class="num">Mano</td><td>4 cartas</td><td>5 cartas</td></tr></table>
<h3>1. Inicio</h3><ol><li>Enderezar: A endereza sus 5 Almas y sus Entes.</li><li>Descenso: A es la jugadora inicial, así que el d10 pasa de 4 a 5. Entra Ira: los Entes en Vanguardia tienen +1 de Fuerza.</li><li>Robo: A elige el Mazo Principal y roba una carta. Tras el Descenso hay ventana de prioridad; nadie juega nada.</li></ol>
<h3>2. Fase principal 1</h3><ol><li>A juega el Alma Paolo y decide condenarla: va boca abajo y resuelve su Condena, «un Ente recibe +1/+0 este turno», sobre el Diablillo. Ahora tiene 3 absueltas y 3 condenadas: sigue Tibia, pero se ha acercado a la Corrupción.</li><li>A juega Cerbero (Ilustre, coste 4 + Gula), un 4/4. Cumple el umbral gracias a Francesca y agota 4 de sus 6 Almas. Lo coloca en Vanguardia.</li><li>Cerbero va a la Cadena. B tiene prioridad y pasa; Cerbero entra en juego.</li></ol>
<h3>3. Combate</h3><ol><li>Declarar atacantes: Cerbero acaba de entrar y no puede atacar. A ataca con el Diablillo, que ahora es 5/2: base 2, +1 por Ira, +1 del Tamborilero y +1 de Paolo.</li><li>Ventana de Juicios: B juega Silencio helado (coste 2): «el Ente atacante objetivo deja de atacar». Va a la Cadena.</li><li>A responde con Ímpetu (coste 1): «el Ente objetivo no puede ser elegido por Juicios rivales este turno». La Cadena queda así: Ímpetu arriba, Silencio helado debajo.</li><li>Los dos pasan. Resuelve Ímpetu primero y el Diablillo queda protegido. Al resolver Silencio helado, su objetivo ya no es legal y se anula.</li><li>Declarar bloqueadores: B bloquea con el Centinela de hielo.</li><li>Daño: el Diablillo hace 5 al Centinela, que muere; el Centinela hace 1 al Diablillo, que sobrevive. No hay daño al Peregrino: sin Violencia activa, el sobrante no pasa.</li><li>Fin del combate: se dispara «al morir, roba 1» del Centinela. Va a la Cadena, nadie responde y B roba 1.</li></ol>
<h3>4. Fase principal 2</h3><p>A tiene 1 Alma sin agotar, pero no le queda nada útil de coste 1. Ya jugó Alma este turno, así que no puede jugar otra.</p>
<h3>5. Final</h3><ol><li>B aprovecha la última ventana del turno rival: juega Previsión (coste 2), «roba 2».</li><li>Se borra el daño del Diablillo y termina el efecto de Paolo. A tiene 2 cartas en mano, por debajo del límite de 7.</li><li>Empieza el turno de B en el mismo círculo V. El Descenso no avanza porque B no es el jugador inicial.</li></ol>
<p><b>Resultado:</b> A ha desplegado a Cerbero y eliminado el único bloqueador de B, pero ha gastado su truco. B ha perdido mesa, aunque tiene 6 cartas en mano frente a las 2 de A. Así funciona la tensión central: A gana tempo y B gana cartas.</p>` },

  { group: 'Núcleo de reglas', id: 'victoria', title: 'Victoria y construcción de mazo', html: `
<p class="lead">Se gana derribando al Peregrino rival o llegando al Juicio Final en mejor posición. Hay tres formas de terminar la partida:</p>
<ul>
<li><b>Derrota del Peregrino:</b> su Voluntad llega a 0.</li>
<li><b>Agotamiento:</b> un jugador debe robar y no quedan cartas en ninguno de sus dos mazos. Pierde.</li>
<li><b>Juicio Final:</b> al terminar la ronda del Noveno Círculo, gana quien tenga más Voluntad. Si hay empate, gana quien esté más lejos del centro de la Balanza; el tibio pierde. Si también empatan, es tablas.</li>
</ul>
<h3>Construcción de mazo</h3>
<table><tr><th>Parte</th><th>Tamaño</th><th>Límites</th></tr>
<tr><td class="num">Peregrino</td><td>1</td><td>Define las Sendas permitidas.</td></tr>
<tr><td class="num">Mazo Principal</td><td>50 cartas exactas</td><td>Máximo 3 copias por nombre; Ilustres, máximo 1. Solo Sendas del Peregrino o neutrales.</td></tr>
<tr><td class="num">Mazo de Almas</td><td>20 cartas exactas</td><td>Copias libres. Solo Sendas del Peregrino o neutrales.</td></tr>
<tr><td class="num">Banquillo</td><td>Hasta 10 cartas</td><td>Para cambios entre partidas de una ronda al mejor de 3.</td></tr></table>
<p>La carta de Descenso no forma parte del mazo: se usa la de la temporada vigente.</p>
<p class="note">Los dos mazos de la demo (Francesca y Virgilio) cumplen estas reglas: 50 cartas en el Mazo Principal, 20 en el de Almas, máximo 3 copias y 1 por Ilustre.</p>` },

  { group: 'Núcleo de reglas', id: 'preguntas', title: 'Preguntas abiertas del playtest', html: `
<p class="lead">Decisiones que conviene validar jugando con dos mazos de prueba de unas 30 cartas cada uno.</p>
<ul>
<li>¿Voluntad 20 y 9 rondas encajan en 20–40 minutos al mejor de uno? Un mazo agresivo debería ganar hacia el círculo V o VI.</li>
<li>¿Condenar compensa lo suficiente perder el color? ¿Hace falta que algunas líneas de Condena sean más fuertes?</li>
<li>¿La Retaguardia de 3 espacios es demasiado segura? Probar con 2.</li>
<li>¿El Limbo sin ataques corrige bien la ventaja del jugador inicial?</li>
<li>¿Cinco Sendas son demasiadas para el primer set? Alternativa: lanzar con tres.</li>
<li>¿El Destino bloqueado (solo uno por partida) crea decisiones interesantes o castiga demasiado?</li>
</ul>` },

  { group: 'Dirección artística', id: 'arte', title: 'Visión artística', html: `
<p class="lead">Sulphur se ve como un <b>libro antiguo del Infierno que arde</b>: grabado gótico en tinta negra sobre papel envejecido, con un único color vivo por carta que marca su Senda. En una mesa llena de ilustración digital pintada, una carta de Sulphur debe reconocerse a dos metros.</p>
<h3>Tres ideas que guían todo</h3>
<ul>
<li><b>Tinta y fuego.</b> La base es monocroma, de línea y trama como un grabado. El color aparece solo donde importa: la llama, la sangre, el oro, el hielo.</li>
<li><b>Descenso visible.</b> Cuanto más profundo el círculo, más oscuro y opresivo el ambiente. El Limbo es gris y etéreo; la Traición, casi negra y helada.</li>
<li><b>Juicio moral en la imagen.</b> Las almas absueltas se iluminan con un halo de pan de oro; las condenadas quedan en sombra y ceniza. El jugador debe sentir que elige un destino, no solo un recurso.</li>
</ul>
<h3>Tono</h3>
<p>Trágico, solemne y bello antes que gore. El horror está en la escala, la desolación y la expresión de las almas, no en la víscera. Es un juego para mayores de 14 años con aspiración de pieza de colección.</p>
<p class="note">En la demo: todas las ilustraciones se generan como grabado (trama cruzada sobre papel) con un único acento de Senda; las Almas usan el pan de oro de la redención. La mesa cambia de luz y color con cada Círculo, del gris perla del Limbo al azul casi negro de la Traición.</p>` },

  { group: 'Dirección artística', id: 'referentes', title: 'Referentes visuales', html: `
<p class="lead">La base son los grandes ilustradores históricos de la Divina Comedia, todos de dominio público, filtrados por la estética oscura contemporánea del GDD de Sulphur.</p>
<table><tr><th>Referente</th><th>Qué tomar</th><th>Qué evitar</th></tr>
<tr><td class="num">Gustave Doré, grabados del Infierno (1861)</td><td>Trama de líneas, escala monumental, luz dramática entre tinieblas</td><td>Copiar composiciones concretas</td></tr>
<tr><td class="num">William Blake, acuarelas de Dante</td><td>Figuras retorcidas, color plano y simbólico, fuego como forma</td><td>Su paleta pastel</td></tr>
<tr><td class="num">Sandro Botticelli, dibujos de la Commedia</td><td>Narración en varias escenas, detalle en multitudes de almas</td><td>El dibujo sin sombra, poco legible en carta</td></tr>
<tr><td class="num">Iconografía medieval y retablos</td><td>Pan de oro, halos, marcos arquitectónicos</td><td>Rigidez y figuras planas</td></tr>
<tr><td class="num">Blasphemous (referente del GDD)</td><td>Imaginería religiosa española, penitencia, belleza en el sufrimiento</td><td>El pixel art</td></tr>
<tr><td class="num">Grabados de danzas de la muerte</td><td>Esqueletos narrativos, humor negro sutil</td><td>Caricatura excesiva</td></tr></table>
<p>Un guiño propio: el <b>sello de Sulphur, la figura de seis brazos</b> del GDD, funciona como marca de agua en los dorsos y en la carta de Descenso. <span class="seal-inline" data-ic="seal"></span></p>` },

  { group: 'Dirección artística', id: 'sendas', title: 'Las cinco Sendas', html: `
<p class="lead">Cada Senda tiene un único color de acento sobre el grabado negro, un símbolo y un ambiente propio. El color de acento es lo primero que se lee en la mesa, así que nunca se repite entre Sendas.</p>
<table><tr><th>Senda</th><th>Color de acento</th><th>Símbolo</th><th>Ambiente</th><th>Criaturas típicas</th></tr>${sendaRows()}</table>
<p>Las cartas neutrales no llevan color de acento: son grabado puro sobre papel.</p>
<p class="note">Accesibilidad: cada Senda se distingue por color, por la forma de su símbolo (llama, boca, moneda, máscara, cristal) y por su motivo visual, para jugadores daltónicos.</p>` },

  { group: 'Dirección artística', id: 'circulos-arte', title: 'Los 9 círculos (ambiente)', html: `
<p class="lead">Los biomas del GDD de Sulphur pasan directamente al juego de cartas. Cada círculo da ambiente a las ilustraciones ambientadas en él y a su franja en la carta de Descenso, que se oscurece de arriba abajo.</p>
<table><tr><th>Círculo</th><th>Ambiente</th><th>Luz y color</th><th>Motivos recurrentes</th></tr>${circleArt()}</table>
<p><b>Regla de progresión:</b> del círculo I al IX, cada ilustración tiene menos cielo y más peso sobre las figuras. El Limbo se abre al horizonte; la Traición no tiene salida visible.</p>` },

  { group: 'Dirección artística', id: 'diseno', title: 'Diseño de carta', html: `
<p class="lead">La ilustración ocupa al menos dos tercios de la carta y el marco es mínimo, como el grabado enmarcado de una página. Cada tipo de carta se distingue por la forma de su marco, no solo por el texto, para que se reconozca sin leer.</p>
<table><tr><th>Tipo</th><th>Marco</th><th>Detalle distintivo</th></tr>${frameRows()}</table>
<h3>Virtud y Corrupción en la carta</h3>
<ul>
<li>Las habilidades de Virtuoso llevan un halo dorado ${ic('halo')} junto al texto.</li>
<li>Las de Corrupto llevan unos cuernos negros ${ic('horns')}.</li>
<li>En las Almas, la mitad superior de la ilustración sugiere redención y la inferior condena, para que girarla boca abajo tenga sentido visual.</li>
</ul>
<h3>Dorsos</h3>
<div class="backs"><figure><canvas data-back="main"></canvas><figcaption>Mazo Principal</figcaption></figure><figure><canvas data-back="soul"></canvas><figcaption>Mazo de Almas</figcaption></figure></div>
<ul>
<li><b>Mazo Principal:</b> negro con el sello de Sulphur en tinta roja.</li>
<li><b>Mazo de Almas:</b> papel envejecido con el sello en tinta negra. El contraste entre los dos dorsos hace imposible confundir los mazos.</li>
<li>Una Alma condenada boca abajo muestra ese dorso claro: la mesa de un jugador corrupto se ve literalmente más pálida y vacía.</li>
</ul>` },

  { group: 'Dirección artística', id: 'tipografia', title: 'Tipografía e iconografía', html: `
<p class="lead">Dos familias bastan: una con carácter para nombres y títulos, y una legible para el texto de reglas. La legibilidad manda sobre la ambientación en todo lo que se juega.</p>
<h3>Tipografía</h3>
<ul>
<li><b>Nombres y títulos:</b> <span class="disp">una letra de imprenta antigua o gótica suave</span>, con el trazo irregular del logotipo de Sulphur. Solo en nombres, nunca en texto de reglas. <i>(En la demo: IM Fell English.)</i></li>
<li><b>Texto de reglas:</b> una serif clásica de libro, a un cuerpo mínimo legible en carta impresa. <i>(En la demo: EB Garamond.)</i></li>
<li><b>Números</b> (coste, Fuerza, Resistencia): cifras grandes en la misma serif, en negrita, legibles a un metro.</li>
</ul>
<h3>Iconos</h3>
<p>Un icono por Senda: ${ic('ira')} llama, ${ic('gula')} boca, ${ic('avaricia')} moneda, ${ic('fraude')} máscara y ${ic('traicion')} cristal. Siempre en su color de acento y con forma distinta, para jugadores daltónicos.</p>
<p>${ic('halo')} Halo (Virtuoso), ${ic('horns')} cuernos (Corrupto), ${ic('balance')} balanza (Juicio) y ${ic('chain')} cadena (Reliquia unida). Todos dibujados en el mismo trazo de grabado que las ilustraciones, no como iconos planos de aplicación.</p>
<p>Palabras clave en la demo: ${Object.entries(KEYWORDS).map(([k, v]) => `${ic(k)} ${v.name}`).join(' · ')}.</p>` },

  { group: 'Dirección artística', id: 'ilustradores', title: 'Guía para ilustradores', html: `
<p class="lead">Cada artista puede aportar su estilo, pero dentro de unas reglas comunes que hacen que todas las cartas parezcan del mismo libro.</p>
<h3>Reglas comunes</h3>
<ul>
<li>Base monocroma de tinta o trama, con un solo color de acento: el de la Senda de la carta.</li>
<li>La figura principal se lee en silueta a tamaño de carta. Si no se entiende en una miniatura de 3 cm, no sirve.</li>
<li>Luz dramática desde una sola fuente, casi siempre fuego o un resplandor sagrado.</li>
<li>Dejar el tercio inferior con menos detalle, porque ahí van el nombre y el texto.</li>
<li>Los Ilustres (Francesca, Ulises, Farinata) tienen expresión y rostro reconocibles; los Entes genéricos pueden ser masas y formas.</li>
</ul>
<h3>Qué evitar</h3>
<ul>
<li>Gore explícito y desnudez gratuita: el horror viene de la escala y la desolación.</li>
<li>Paletas saturadas de ilustración digital genérica.</li>
<li>Copiar composiciones concretas de Doré o Blake: son inspiración, no plantilla.</li>
<li>Fondos detallados detrás del texto.</li>
</ul>
<h3>Plantilla de encargo</h3>
<table><tr><th>Campo</th><th>Ejemplo</th></tr>
<tr><td class="num">Nombre de la carta</td><td>Centinela de hielo</td></tr>
<tr><td class="num">Tipo y Senda</td><td>Ente, Traición</td></tr>
<tr><td class="num">Círculo de ambientación</td><td>IX. Traición</td></tr>
<tr><td class="num">Qué debe transmitir</td><td>Un guardián lento e inamovible, medio fundido con el hielo</td></tr>
<tr><td class="num">Momento o pose</td><td>Inmóvil, mirando al frente, con escarcha cubriéndole los hombros</td></tr>
<tr><td class="num">Color de acento</td><td>Azul hielo</td></tr>
<tr><td class="num">Formato</td><td>Vertical, ilustración a dos tercios de carta, tercio inferior despejado</td></tr></table>` },

  { group: 'Dirección artística', id: 'materiales', title: 'Materiales físicos', html: `
<p class="lead">Los componentes siguen la idea del libro antiguo: papel, tinta, metal envejecido y fuego. Solo hay tres piezas aparte de las cartas.</p>
<ul>
<li><b>Carta de Descenso:</b> una columna con los 9 círculos, cada franja con su color del I al IX, del gris perla al azul casi negro. Numerados en romanos y con la regla de cada uno.</li>
<li><b>Dados:</b> un d20 para la Voluntad y un d10 para el Descenso, en negro con números en tinta roja o dorada, a juego con los dorsos.</li>
<li><b>Caja de mazo:</b> con forma de libro encuadernado, lomo con el sello de Sulphur. Tiene dos compartimentos (Mazo Principal y Almas) y un hueco para las cartas Quemadas.</li>
<li><b>Tapete opcional:</b> no es necesario para jugar. Si existe, es un grabado del descenso completo con las zonas marcadas como inscripciones discretas en los márgenes, no como recuadros de colores.</li>
</ul>
<p class="note">En la demo, la mesa es ese tapete opcional: un grabado del embudo del Descenso con las zonas inscritas en los márgenes.</p>` },

  { group: 'Set alpha', id: 'alpha', title: 'Reglas del set alpha', html: `
<p class="lead">El <b>alpha pool</b> es el primer conjunto equilibrado de SULPHUR para el playtest: <b>${Object.keys(CARDS).length} cartas</b> de las cinco Sendas y neutrales, 18 Almas y 7 Peregrinos. Estas reglas se añaden al Núcleo o lo concretan.</p>
<h3>Cambios de reglas</h3>
<ul>
<li><b>El jugador inicial roba</b> en su primer turno.</li>
<li><b>Gracia:</b> cada vez que absuelves un Alma, tu Peregrino gana <b>1 de Voluntad</b>. Absolver ya no es solo color y Virtud: también es aguante frente a los mazos agresivos. Condenar sigue dando su efecto inmediato.</li>
<li><b>Umbral exigente:</b> muchas cartas piden dos o tres símbolos iguales. Los Peregrinos siguen aportando sus símbolos, pero para jugar lo más potente de una Senda hay que absolver Almas de esa Senda.</li>
<li><b>Destino a 5</b> de ventaja, pensado para el medio y final de partida. Las cartas con <b>Sin Destino</b> son fuertes al principio; las cartas con <b>Destino</b> despiertan cuando ya has elegido camino.</li>
<li><b>La Cadena funciona como la pila de Magic:</b> lo último que entra se resuelve primero. Los disparadores entran en el orden en que suceden; si varios del mismo jugador ocurren a la vez, ese jugador elige su orden (primero los del jugador activo).</li>
<li>Las <b>Reliquias</b> unidas a un Ente van al <b>Olvido</b> cuando ese Ente deja la mesa.</li>
<li>Cada vez que un efecto dice «roba», eliges de qué mazo.</li>
</ul>
<h3>Palabras clave nuevas</h3>
<ul>
<li><b>Asedio:</b> al atacar, este Ente puede apuntar a un Ente de la Retaguardia rival en lugar de al Peregrino. Si nadie lo bloquea, le hace su daño (y ese Ente no devuelve el golpe). La Retaguardia deja de ser un refugio seguro.</li>
<li><b>Al atacar:</b> disparador que entra en la Cadena al declarar a este Ente como atacante.</li>
<li><b>Al cambiar de fila:</b> disparador cada vez que este Ente pasa de Vanguardia a Retaguardia o al revés (por tu movimiento, por Lujuria o por un efecto).</li>
<li><b>Sepultar N:</b> pon las N cartas superiores del Mazo Principal de un jugador en su Olvido. Algunas cartas crecen con tu Olvido; otras usan Sepultar para agotar el mazo rival.</li>
<li><b>Oro:</b> las cartas de Avaricia usan el Oro también fuera del Círculo IV: hay cartas que lo generan, que lo gastan y que crecen con él.</li>
</ul>
<h3>Los siete Peregrinos</h3>
<table><tr><th>Peregrino</th><th>Habilidad base</th><th>Redención</th><th>Caída</th></tr>${PILGRIM_IDS.map(pid => { const P = PILGRIMS[pid]; return `<tr><td class="num"><b>${P.name}</b><br><small>${P.sendas.map(k => SENDAS[k].name).join(' · ')} · ${P.style}</small></td><td>${P.ability.text}</td><td>${P.redencion.text}</td><td>${P.caida.text}</td></tr>`; }).join('')}</table>
<h3>Contra el agresivo</h3>
<ul><li>Gracia (+1 de Voluntad al absolver), Guardianes más baratos y robustos, respuestas de coste bajo y cartas <b>Sin Destino</b> que también sirven a los mazos lentos. Los agresivos, a cambio, tienen Asedio y cartas «al atacar».</li></ul>
<h3>Ideas de reglas de Círculo en estudio</h3>
<p>Las reglas actuales de los Círculos se mantienen. Estas variantes buscan que cada Círculo cambie más la partida; se probarán en el siguiente alpha:</p>
<ul>
<li><b>II · Lujuria:</b> además, cada Ente que cambia de fila recibe +1/+0 hasta final de turno (premia los disparadores «al cambiar de fila»).</li>
<li><b>III · Gula:</b> al final de tu turno, si tienes más de 7 cartas en la mano, descarta hasta 7.</li>
<li><b>VI · Herejía:</b> cada vez que se Quema un Ente, su controlador pierde 1 de Voluntad.</li>
<li><b>VII · Violencia:</b> los Entes con Asedio ignoran a los Guardianes.</li>
<li><b>VIII · Fraude:</b> la primera vez que cada jugador juega un Juicio en su turno, Sepulta 1.</li>
<li><b>IX · Traición:</b> al final de cada turno, el jugador con menos Voluntad puede mover de fila un Ente rival.</li>
</ul>
<p>Cartas del alpha que ya aprovechan los Círculos: las que dicen <b>«Círculo V o más»</b> o <b>«Círculo VII o más»</b>, los disparadores «al cambiar de fila» (brillan en Lujuria), las de Oro (Avaricia) y los Juicios baratos de Fraude.</p>` },

  { group: 'La demo', id: 'galeria', title: 'Galería de cartas', html: `<p class="lead">El <b>alpha pool</b> completo. Las cartas marcadas con <b>«del documento»</b> aparecen literalmente en el Núcleo de reglas; el resto son cartas del set alpha que usan las mecánicas del Núcleo y las reglas alpha. Haz clic en una carta para leerla.</p><div id="gallery"></div>` },

  { group: 'La demo', id: 'controles', title: 'Cómo se juega la demo', html: `
<h3>Controles</h3>
<ul>
<li><b>Aprender a jugar:</b> cuatro lecciones guiadas (portada). La voz del Libro ilumina y señala cada elemento; tú juegas cada acción. La lección III es el turno de ejemplo de este Núcleo de reglas, jugado.</li>
<li><b>Tecla M</b> o el botón «Plegar mano»: esconde la mano para ver la mesa entera.</li>
<li>Durante la partida, las <b>marcas de la guía</b> señalan con una línea el objeto del que hablan (la Balanza, la Cadena, el Descenso…), y los efectos dejan <b>textos que vuelan</b>: la energía hacia tu marcador, el símbolo absuelto hacia tu umbral, «Balanza → Virtud».</li>
<li>Las <b>flechas</b> muestran a quién apunta cada ataque y cada objetivo; en la Cadena, las insignias <b>1º, 2º…</b> dicen el orden de resolución.</li>
<li><b>Pasa el cursor</b> sobre cualquier carta, zona, dado o la Balanza para ver su explicación. Sobre un Ente en juego verás el desglose de su Fuerza y Resistencia (base + Círculo + Apoyo + efectos).</li>
<li><b>Clic derecho</b> sobre una carta: inspeccionarla a pantalla completa.</li>
<li><b>Arrastra</b> una carta de tu mano a la mesa, o <b>haz clic</b> en ella: se iluminan los lugares y objetivos válidos.</li>
<li><b>Clic en un Alma tuya</b> enderezada: la agotas y ganas 1 de energía.</li>
<li><b>Clic en un Ente tuyo</b>: moverlo de fila (una vez por turno) o activar su habilidad.</li>
<li><b>Clic en tu Peregrino</b>: activar su habilidad base (una vez por turno).</li>
<li>El botón de la derecha avanza: «Pasar prioridad», «Ir a combate», «Terminar turno»…</li>
</ul>
<h3>Decisiones de implementación de la demo</h3>
<ul>
<li><b>Partida contra la IA:</b> eliges tu Peregrino y tu mazo; el rival puede ser aleatorio o elegido, en tres niveles. <b>Fácil</b> juega sin plan; <b>Normal</b> juega bien sus cartas; <b>Difícil</b> calcula el combate, busca daño letal, guarda respuestas y elige mejor entre absolver y condenar.</li>
<li><b>Multijugador:</b> uno crea la sala y comparte el código de 5 letras; el otro se une. La conexión es directa entre los dos navegadores.</li>
<li><b>Constructor de mazos:</b> 50 cartas en el Mazo Principal y 20 Almas, máximo 3 copias (Ilustres: 1), solo de las Sendas de tu Peregrino o neutrales. Puedes compartir un mazo copiando su código.</li>
<li><b>Datos del playtest:</b> cada partida se registra en tu navegador. Al terminar puedes enviarla como informe en GitHub o descargarla en JSON; desde la portada verás las estadísticas y podrás simular partidas IA contra IA.</li>
<li>Los 7 Peregrinos jugables: Francesca y Virgilio son los del ejemplo del documento; los otros cinco (uno por Senda) son del set alpha. Sus Redenciones y Caídas son de ejemplo.</li>
<li>Cuando un efecto dice «roba», eliges de qué mazo robar, igual que en el paso de robo.</li>
<li>Las Reliquias unidas a un Ente van al Olvido cuando ese Ente deja la mesa.</li>
<li>Lujuria: al inicio de su turno, el jugador activo mueve uno de sus Entes a la otra fila (no cuenta como su movimiento del turno).</li>
<li>Avaricia: la energía que quede en tu reserva al final de tu fase principal 2 o de tu turno se guarda como Oro (máximo 3).</li>
<li>Herramienta de demo «Descender»: sube el Descenso un círculo para explorar los nueve Círculos y el Juicio Final sin jugar una partida completa. No es una regla del juego ni está disponible online.</li>
</ul>` },
];
