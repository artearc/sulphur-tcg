# SULPHUR — Demo jugable

**SULPHUR** es un juego de cartas coleccionables 1 contra 1 ambientado en el Infierno de Dante. Cada jugador es un **Peregrino** que desciende por los nueve Círculos y decide, alma a alma, si **absolver** o **condenar**.

Esta demo jugable en el navegador (Three.js) sirve para aprender las reglas y probar el juego.

## ▶ Jugar

**Online:** https://USUARIO.github.io/REPOSITORIO/ *(enlace de GitHub Pages)*

No hace falta instalar nada: ábrelo en Chrome, Edge o Firefox en un ordenador (recomendado 1280×720 o más).

## Qué hay en la demo

- **Aprender a jugar:** 4 lecciones guiadas (Almas y energía · Condenar y la Balanza · Combate y la Cadena · El Descenso y el Juicio Final). La lección III es el turno de ejemplo del reglamento, jugado paso a paso.
- **Partida libre** contra un rival de práctica, con Francesca (Ira · Gula) o Virgilio (Traición · Fraude).
- **Códice:** todas las reglas, la dirección artística, el glosario y la galería de cartas.

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

Si encuentras un error o tienes ideas, abre un **Issue** en este repositorio indicando qué pasó, en qué lección o Círculo, y si puedes, una captura.

## Estructura

```
index.html        página principal
css/              estilos de la interfaz
js/engine.js      motor de reglas
js/ai.js          rival de práctica
js/tutorial.js    lecciones guiadas
js/view.js        mesa 3D (Three.js)
js/env.js         escenario, partículas y efectos
js/post.js        postproceso (bloom, gradación…)
js/art.js         arte procedural de cartas
js/ui.js          interfaz, guía y Códice
js/data.js        cartas, Círculos y glosario
assets/           logo
```

© Alex Ruiz Chazarra. Todos los derechos reservados sobre el diseño de SULPHUR.
