# AURORA - El Camino del Guerrero

**Musicalizado por HICK. Juego y música creados por Efraín Cabrera.**

[Jugar AURORA](https://efraboot.github.io/aurora/) · [Repositorio](https://github.com/efraboot/aurora) · [Web de HICK](https://efraboot.github.io/hick/)

Aventura musical para computadora y celular. Un chasqui recorre diez ambientes, completa misiones, recoge tres pergaminos por nivel de combate y enfrenta nueve jefes. La duración depende del jugador: la canción se repite mientras el nivel sigue pendiente y se desvanece al vencer al jefe.

La campaña incluye costa con barcos, santuario en llamas, cañón, carretera en vehículo, comunidades, un templo profanado, terrazas de cultivo, ciudad y plaza de liberación. Tiene bastón, obsidiana, magia con energía, defensa, esquiva y controles táctiles. El cierre presenta personajes celebrando, la foto original de HICK y enlaces a sus plataformas musicales.

## Jugar localmente

En Windows, extrae el ZIP completo, haz doble clic en **INICIAR.cmd** y mantén su ventana abierta. Abre http://127.0.0.1:4173/. Requiere Node.js instalado o el runtime incluido con Codex.

~~~sh
node iniciar-local.mjs --no-open
INICIAR.cmd --lan
~~~

**--lan** muestra la dirección para un celular conectado a la misma Wi-Fi. También puedes abrir el enlace público directamente desde el celular. La [guía de juego](LEEME.md) explica controles, objetivos, música y guardado.

## Estructura

- **dist/**: juego completo; no necesita compilación ni dependencias.
- **dist/campaign.js**: niveles, misiones y jefes.
- **dist/engine.js**: movimiento, combate, objetos y progreso.
- **dist/audio.js**: reproducción, repeticiones y transiciones musicales.
- **dist/world.js**: escenarios, personajes y animación.
- **dist/assets/**: nueve MP3 originales, ilustraciones, logo, foto y tipografía.
- **ARTE-V3.md**: los 19 prompts y destinos de las nuevas ilustraciones generadas con ChatGPT Images.
- **ARTE.md**: documentación del arte anterior.
- **VALIDACION.md**: pruebas realizadas y alcance de la revisión.

## GitHub Pages

El sitio está publicado en **https://efraboot.github.io/aurora/** desde el repositorio público **efraboot/aurora**. El primer despliegue terminó correctamente mediante [GitHub Actions](https://github.com/efraboot/aurora/actions/runs/38653313247).

El workflow **.github/workflows/pages.yml** publica únicamente **dist/** al cambiar esa carpeta en **main**, al modificar el propio workflow o al ejecutarlo manualmente. En Settings → Pages, el origen seleccionado es **GitHub Actions**. No necesita instalar paquetes ni ejecutar un build. [Documentación oficial](https://docs.github.com/en/pages/getting-started-with-github-pages/using-custom-workflows-with-github-pages).

La música, las imágenes y el código cliente forman parte del repositorio público. La tipografía conserva su licencia en dist/assets/Skranji-OFL.txt. Las carpetas .openai/, work/, tests/, logs/, los archivos de QA y las copias archivadas están excluidos de la entrega.

## Validación

Se aprobaron **30 pruebas del motor** y **18 de audio simulado**, además de comprobaciones de interfaz local, vista táctil emulada, cierre y despliegue. Las nueve pistas, la foto y las ilustraciones subidas se compararon con los archivos locales. La dificultad y el ritmo todavía requieren una partida humana completa; los teléfonos físicos y Safari/iOS no se han probado directamente.

~~~sh
npm run check
node iniciar-local.mjs --self-check
~~~
