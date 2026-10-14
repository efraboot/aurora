# AURORA - El Camino del Guerrero

**Musicalizado por HICK. Juego y música creados por Efraín Cabrera.**

Juego web estático de aventura musical con diez ambientes, misiones, tres pergaminos por nivel de combate y jefes. Funciona en computadora y celular con botones táctiles. Su duración depende del avance: la canción del nivel se repite hasta completarlo.

## Jugar localmente

En Windows, haz doble clic en **INICIAR.cmd** y mantén su ventana abierta. Abre http://127.0.0.1:4173/. Requiere Node.js instalado o el runtime incluido con Codex.

~~~sh
node iniciar-local.mjs --no-open
INICIAR.cmd --lan
~~~

**--lan** muestra la dirección para un celular conectado a la misma Wi-Fi. La [guía de juego](LEEME.md) explica controles, música, misiones y guardado. Los [resultados de validación](VALIDACION.md) distinguen las pruebas actuales de las versiones anteriores.

## Estructura

- **dist/**: contenido listo para servir; no requiere compilación ni paquetes.
- **dist/campaign.js**: niveles, misiones y jefes.
- **dist/assets/**: audio, ilustraciones, logo, foto y tipografía.
- **.github/workflows/pages.yml**: workflow estático preparado para Pages.
- **package.json**: comprobación local de sintaxis con npm run check.
- **ARTE-V3.md**: prompts y archivos de las 19 ilustraciones nuevas; ARTE.md documenta el arte anterior.

Los archivos de .openai/, work/, tests/, logs/ y las copias archivadas quedan excluidos mediante .gitignore. Los MP3 y las imágenes del juego sí forman parte de dist/.

## Preparación de GitHub Pages

**Estado: archivos preparados localmente; repositorio y publicación pendientes.**

Cuando se decida publicar, coloca el contenido de esta carpeta en la raíz del repositorio elegido, incluida .github/. El workflow utiliza **main**; cambia ese nombre si la rama principal es otra. En **Settings → Pages → Source**, selecciona **GitHub Actions**. Se activa al enviar cambios de dist/ a main o manualmente desde Actions. Publica únicamente dist/, sin instalar Node ni ejecutar un build. Usa checkout@v6, configure-pages@v5, upload-pages-artifact@v4 y deploy-pages@v4. [Documentación oficial del workflow](https://docs.github.com/en/pages/getting-started-with-github-pages/using-custom-workflows-with-github-pages).

**Un repositorio privado no garantiza un sitio Pages privado.** Pages normalmente es público; el control de acceso privado requiere opciones de GitHub Enterprise Cloud para organizaciones. Si el sitio es público, sus MP3, imágenes y código cliente son accesibles y descargables mediante sus direcciones. Esta versión no aplica protección de descarga. [Visibilidad del sitio](https://docs.github.com/en/pages/getting-started-with-github-pages/configuring-a-publishing-source-for-your-github-pages-site), [acceso privado](https://docs.github.com/en/enterprise-cloud%40latest/pages/getting-started-with-github-pages/changing-the-visibility-of-your-github-pages-site).

Antes de subir la entrega completa, comprueba el tamaño final: el sitio publicado admite **1 GB**, con límite blando de **100 GB al mes** de transferencia. GitHub bloquea archivos individuales de más de **100 MiB**; las subidas por navegador admiten hasta **25 MiB por archivo**. [Límites de Pages](https://docs.github.com/en/pages/getting-started-with-github-pages/github-pages-limits), [archivos grandes](https://docs.github.com/en/repositories/working-with-files/managing-large-files/about-large-files-on-github).

La disponibilidad de Pages en repositorios privados depende del plan. Este workflow no crea un repositorio, no configura autenticación y no publica por sí solo desde la copia local.

## Créditos y enlaces

La pantalla final incluye la foto original de HICK y una celebración animada.

- [YouTube Music](https://music.youtube.com/channel/UCx0ZqfLq5fHHXCEDXHdBtkA?si=8R6Yc2Nuv8U7aHcu)
- [Apple Music](https://music.apple.com/ec/artist/efrain-cabrera/1117451496)
- [Spotify](https://open.spotify.com/intl-es/artist/5ejScR3xMAsrbSe5ksA6uO?si=UIGyR6YKSLOhsyBaz0cLqw)
- [HICK](https://efraboot.github.io/hick/)
