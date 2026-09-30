# SULPHUR — Demo jugable

**SULPHUR** es un juego de cartas coleccionables 1 contra 1 ambientado en el Infierno de Dante. Cada jugador es un **Peregrino** que desciende por los nueve Círculos y decide, alma a alma, si **absolver** o **condenar**.

Esta demo jugable en el navegador (Three.js) sirve para aprender las reglas y probar el juego.

## ▶ Jugar

**Online:** https://artearc.github.io/sulphur-tcg/

No hace falta instalar nada: ábrelo en Chrome, Edge o Firefox en un ordenador (recomendado 1280×720 o más).

## Qué hay en la demo

- **Aprender a jugar:** 4 lecciones guiadas (Almas y energía · Condenar y la Balanza · Combate y la Cadena · El Descenso y el Juicio Final). La lección III es el turno de ejemplo del reglamento, jugado paso a paso.
- **Set alpha:** 100 cartas de las cinco Sendas y neutrales, 18 Almas y **7 Peregrinos** (uno por Senda + Francesca y Virgilio). Reglas alpha: el jugador inicial roba, **Gracia** (absolver da +1 de Voluntad), **Asedio**, disparadores «al atacar» y «al cambiar de fila», **Sepultar**, cartas de Destino / Sin Destino y de Oro.
- **Partida contra la IA:** elige tu Peregrino y tu mazo; el rival puede ser aleatorio o elegido, en nivel Fácil, Normal o Difícil.
- **Multijugador:** uno crea una sala y comparte el código de 5 letras; el otro se une. Conexión directa entre navegadores.
- **Constructor de mazos:** 50 cartas + 20 Almas, filtros, curva de costes, guardado y códigos para compartir mazos.
- **Datos del playtest:** cada partida queda registrada en tu navegador; al terminar puedes enviar un informe (Issue de GitHub) o descargar el JSON. Desde la portada: estadísticas y simulación IA contra IA.
- **Códice:** todas las reglas (incluidas las del set alpha), la dirección artística, el glosario y la galería de cartas.

## Controles

| Acción | Cómo |
|---|---|
| Jugar una carta | Arrástrala a la mesa o haz clic en ella |
| Agotar un Alma (+1 energía) | Clic en un Alma tuya enderezada |
| Mover un Ente de fila | Arrástralo a un hueco libre de la otra fila (o clic → menú) |
| Habilidad del Peregrino | Clic en tu Peregrino |
| Inspeccionar una carta | Clic derecho |
| Plegar / mostrar la mano | Tecla **M** |
| Pasar / avanzar | Botón grande abajo a la derecha |

## Jugar en local (opcional)

Necesitas Python 3. Desde la carpeta del proyecto:

```bash
python serve.py
```

y abre http://localhost:5173 (abrir `index.html` con doble clic no funciona: los módulos de JavaScript necesitan un servidor).

## Feedback

Al terminar una partida, pulsa **«Informe de playtest (GitHub)»**: abre un Issue ya rellenado con los datos de la partida; solo tienes que añadir tus comentarios. Para errores o ideas, abre un **Issue** indicando qué pasó, en qué lección o Círculo, y si puedes, una captura.

## Estructura

```
index.html        página principal
css/              estilos de la interfaz
js/engine.js      motor de reglas
js/ai.js          rival (3 niveles)
js/net.js         multijugador P2P (PeerJS)
js/decks.js       constructor de mazos
js/stats.js       datos del playtest y simulación
js/tutorial.js    lecciones guiadas
js/view.js        mesa 3D (Three.js)
js/env.js         escenario, partículas y efectos
js/post.js        postproceso (bloom, gradación…)
js/art.js         arte procedural de cartas
js/ui.js          interfaz y guía
js/codex.js       contenido del Códice
js/data.js        cartas, Círculos y glosario
assets/           logo
```

© Alex Ruiz Chazarra. Todos los derechos reservados sobre el diseño de SULPHUR.
