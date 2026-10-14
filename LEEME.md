# AURORA - El Camino del Guerrero

**Musicalizado por HICK. Juego y música creados por Efraín Cabrera.**

Campaña de aventura musical para computadora y celular. El chasqui recorre diez ambientes, recoge pergaminos, completa misiones y enfrenta jefes. La música acompaña cada nivel y se repite si necesitas más tiempo para completarlo.

## Iniciar en computadora

1. Si descargaste el ZIP, extráelo completo.
2. Haz doble clic en **INICIAR.cmd** dentro de la carpeta del juego.
3. Abre **http://127.0.0.1:4173/** y pulsa **Comenzar**.

Mantén abierta la ventana del iniciador mientras juegas. Cierra esa ventana o pulsa **Ctrl+C** para detener el servidor. El iniciador busca Node.js en el equipo y, como alternativa, el runtime incluido con Codex. No descarga ni instala programas automáticamente.

Si el puerto pertenece a otra aplicación, muestra un aviso y no detiene esa aplicación. Puedes iniciarlo manualmente desde una terminal en esta carpeta:

~~~sh
node iniciar-local.mjs --no-open
~~~

Usa la dirección del servidor; el juego necesita HTTP para cargar los módulos y los MP3, en lugar de abrir dist/index.html directamente.

## Controles de computadora

| Acción | Teclas |
|---|---|
| Caminar | ← / → |
| Saltar | Espacio o ↑ |
| Bajar de una plataforma elevada | Mantener ↓ y pulsar Espacio |
| Golpe fuerte con el bastón | A; mantener para repetir |
| Lanzar obsidiana | W |
| Defender frente a ataques | Mantener S |
| Esquivar | D |
| Fuego mágico | Q |
| Recoger, encender, hablar y activar | E |
| Pausar | Escape, P o botón de pausa |

El bastón funciona sin energía. La defensa bloquea ataques desde el lado hacia el que mira el chasqui. La magia consume energía; desde Sacrilegio lanza bolas de fuego. Los tejidos recuperan 20 puntos y los faros recargan toda la energía al interactuar. La obsidiana usa munición y las cajas de suministros la reponen.

## Jugar en celular

Desde una terminal en la carpeta del juego, ejecuta:

~~~sh
INICIAR.cmd --lan
~~~

Conecta el celular y la computadora a la misma red Wi-Fi. El iniciador muestra una o varias direcciones de la red: abre en el celular la que corresponda a esa Wi-Fi. Mantén encendida la computadora y abierto el iniciador. Esta opción admite conexiones locales sin cambiar el firewall ni el router; la configuración de tu equipo o red puede impedir el acceso desde otro dispositivo.

Juega en horizontal. **El celular utiliza controles en pantalla y no necesita teclado.** Las direcciones están a la izquierda; las acciones de salto, bastón, obsidiana, esquiva, defensa y fuego están a la derecha. Al acercarte a un objeto aparece el botón contextual para **Recoger**, **Encender**, **Activar**, **Hablar** o **Entregar**. El texto de ayuda del celular describe botones táctiles.

## Cómo avanzar

Aurora funciona como apertura dentro de la música: recoge tres tejidos y enciende el primer faro para aprender a interactuar. El final de Aurora y el riser dan paso a Ambición; no hay un prólogo separado.

**Desde Ambición, cada nivel requiere recoger tres pergaminos, cumplir sus misiones y derrotar a su jefe.** El panel de objetivos indica qué falta y muestra el progreso. Algunas acciones requieren acercarse y pulsar **E** o tocar el botón contextual: pasar junto a un objeto no lo recoge ni lo activa.

Los recorridos alternan terreno, enemigos, obstáculos, mecanismos y tareas de cada comunidad. Puedes esquivar patrullas o combatirlas. Hay cajas y barricadas destructibles; los objetos que dejan deben recogerse mediante interacción. Las secuencias de símbolos tienen un orden indicado y el juego ofrece pistas al demorarte.

| Capítulo | Ambiente y misión principal | Jefe |
|---|---|---|
| Aurora | Costa, naturaleza y aprendizaje de controles | Apertura |
| Ambición | Extracción, máquinas y liberación de custodios | Capitán del Oro |
| Sacrilegio | Santuario, estandarte y símbolos | Profanador de la Llama |
| Abismo | Cornisas, anclas y recuperación de restos | Grúa del Abismo |
| E35 | Carretera en vehículo, bloqueo y mensajero | Convoy de Guerra |
| Radio Comunitaria | Estaciones, inhibidores y defensa de la emisión | Torre de Interferencia |
| Resistencia | Interior de un templo profanado | Mariscal del Templo |
| Cosecha | Acequias, semillas y siembra | Arado de Hierro |
| Av. Carchi | Accesos, rutas y refugios | Comandante Montado |
| Wiracocha | Fuerte, comunidades y protección de la plaza | Fortaleza del Cielo |

Los jefes tienen patrones y fases. Atiende a las señales antes de sus ataques y alterna bastón, esquiva, defensa y magia. En E35, los controles se mantienen durante el recorrido en vehículo.

## Música y duración

**La duración de la campaña es variable.** Ya no hay un cierre automático a los 45 minutos. Los nueve MP3 proporcionados suman aproximadamente **41:25**; cada nivel conserva su canción y la repite si aún no lo has completado. Al derrotar al jefe y avanzar, la pista se desvanece durante tres segundos antes de cargar la siguiente.

Aurora se reproduce una vez. Si el primer MP3 termina mientras sigues en Ambición, vuelve al inicio de Ambición y evita repetir Aurora. Las marcas del primer archivo conservan la interpretación del código nominal de 24 fotogramas reproducido a 23,97 FPS:

| Momento | Código proporcionado | Posición aproximada |
|---|---|---|
| Final de Aurora | 00:02:05:08 | 02:05,490 |
| Entrada de Ambición | 00:02:09:04 | 02:09,328 |

La música permanece al **85 %** dentro del juego; los efectos tienen ajuste separado. La pausa, la pérdida de foco, una pestaña oculta y la espera por carga detienen el avance. El reloj mide tiempo activo, incluidas las repeticiones de las canciones.

Tras vencer al jefe final, la comunidad celebra. Los personajes siguen bailando en el paisaje; el cierre presenta la foto original de HICK, los créditos y estos enlaces:

- [YouTube Music](https://music.youtube.com/channel/UCx0ZqfLq5fHHXCEDXHdBtkA?si=8R6Yc2Nuv8U7aHcu)
- [Apple Music](https://music.apple.com/ec/artist/efrain-cabrera/1117451496)
- [Spotify](https://open.spotify.com/intl-es/artist/5ejScR3xMAsrbSe5ksA6uO?si=UIGyR6YKSLOhsyBaz0cLqw)
- [HICK](https://efraboot.github.io/hick/)

## Guardado

**Continuar** recupera el avance de esta campaña en el navegador y dispositivo usados. El guardado incluye nivel, posición, misiones, objetos, combate y reproducción musical. La transición de audio también puede recuperarse si se guardó durante el cambio de canción.

Esta versión usa un guardado independiente de las entregas anteriores. Los guardados no se sincronizan entre computadora y celular. Para recuperar una partida local, utiliza el mismo navegador y dirección; el puerto habitual es **4173**. Iniciar una partida nueva reemplaza el guardado de esta versión.

## Archivos y comprobaciones

- dist/: juego completo; incluye campaign.js con los datos de la campaña.
- dist/assets/audio/: las nueve pistas originales.
- dist/assets/hick.png y hick-band.png: logo y foto original.
- dist/assets/art/: paisajes, escenarios y jefes.
- INICIAR.cmd e iniciar-local.mjs: iniciador y servidor local.
- ARTE-V3.md: los 19 prompts y archivos de las nuevas ilustraciones; ARTE.md documenta el arte anterior.
- VALIDACION.md: resultados comprobados y límites de las pruebas.
- README.md: guía del repositorio y preparación de GitHub Pages.
- .github/workflows/pages.yml: publicación estática preparada para GitHub Actions.

~~~sh
npm run check
node iniciar-local.mjs --self-check
node iniciar-local.mjs --no-open --port 4174
~~~

La comprobación de sintaxis no instala dependencias. El servidor admite rangos de audio y sirve únicamente dist/. Otro puerto genera un origen distinto para el guardado.

**La publicación en GitHub todavía está pendiente.** El workflow se ha preparado en esta carpeta; crear el repositorio, elegir su visibilidad, subir los archivos y activar Pages son pasos posteriores. Consulta README.md antes de publicar.

