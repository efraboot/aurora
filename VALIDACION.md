# Validación de AURORA

## Campaña v3

Esta revisión avanza por misiones y jefes. La música repite el nivel actual y la campaña no termina automáticamente al llegar a 45 minutos. Los resultados de entregas anteriores se conservan como antecedentes y no sustituyen pruebas de estas nuevas mecánicas.

### Audio: 18 pruebas aprobadas

La suite actual usa audio y solicitudes simulados. Su registro incluye una huella SHA256 del módulo examinado.

- Inicio desde Aurora sin prólogo y música fija al 85 %, incluso frente a un ajuste guardado de volumen cero.
- Marcas originales de Aurora, riser y Ambición; Aurora no vuelve a aparecer al repetir la primera pista.
- Repetición del mismo MP3 al terminar, sin avanzar automáticamente de nivel.
- Tiempo activo acumulado durante repeticiones y ausencia de final automático a los 2700 segundos.
- Cambio explícito de nivel con fade de tres segundos y prevención de avances duplicados.
- Pausa del reloj y del fade; continuación del tiempo restante.
- Restauración de una transición guardada a mitad del fade.
- Recuperación de la pista correcta tras un fallo al cargar el siguiente nivel.
- Guardado durante carga pendiente y recuperación sin reproducir la pista anterior.
- Pausa y reanudación durante una carga de transición.
- Cancelación de una transición antigua sin reemplazar un inicio posterior.
- Guardado de la posición exacta y reloj detenido durante buffering.
- Recuperación tras error de medios desde la posición actual.
- Cierre final explícito con fade, sin repetición del cierre.
- Recuperación de contadores de repeticiones y caché limitada a pista actual y siguiente.
- Fin de pista durante pausa: espera a Continuar para repetir.
- Transición solicitada durante pausa: espera a reanudar para consumir el fade.
- Cancelación de una reanudación pendiente sin alterar una campaña nueva.

### Sintaxis y preparación local

La comprobación local de package.json v3 pasó para main.js, audio.js, campaign.js, engine.js, world.js e iniciar-local.mjs. Verifica sintaxis; no demuestra por sí sola que una campaña completa pueda terminarse.

Se preparó .github/workflows/pages.yml conforme a la documentación oficial de GitHub Pages: carga de dist/ y despliegue estático con las acciones oficiales. No se creó repositorio, no se subieron archivos, no se ejecutó el workflow remoto y no hay una publicación confirmada.

### Motor: 30 pruebas aprobadas

La suite v3 recorre las 27 misiones, la recogida manual de pergaminos y las nueve victorias de jefe con entradas, colisiones y proyectiles del motor real. También comprueba puertas cerradas, regreso a misiones pendientes, fases y mecanismos de jefes, munición, magia, defensa, esquiva, daño, muerte, puntos seguros y restauración del guardado.

Para recorrer toda la campaña técnica se usan teletransportes entre sectores y protección temporal en las pruebas de accesibilidad de jefes. Una prueba separada del Capitán utiliza salud normal y esquivas sin esa protección. Esto comprueba mecanismos y posibilidad de avanzar, pero no sustituye una partida humana para ajustar dificultad y ritmo.

### Gráficos e integración

Se generaron e inspeccionaron diez fondos y nueve jefes con transparencia mediante ChatGPT Images. Los prompts y destinos están en ARTE-V3.md. El contrato del dibujante se examinó con diez capítulos, nueve jefes y siete clases de ataque, sin coordenadas no finitas.

En el navegador local se comprobaron el título sin duración fija, controles A/W separados, objetivos de misión, puerta de tres pergaminos, jefe y cambio de Sacrilegio a Abismo tras victoria. La pausa conserva solo el ajuste de efectos; no presenta volumen de música. También se comprobó la repetición real de Wiracocha sin cambiar de nivel, la victoria final, la celebración y la carga de la foto original. Las pruebas de arena utilizan requisitos de misión y salud reducida preparados por la interfaz temporal de QA; no se presentan como una partida completa.

## Antecedentes comprobados

### Servidor local: 17 comprobaciones

El iniciador no cambió durante esta revisión. Su servidor se comprobó en 127.0.0.1:4174 con **--no-open** y se detuvo al terminar: GET/HEAD, MIME de recursos, longitud y rangos de MP3, rangos 206/416, confinamiento de rutas, 404 y 405. También pasaron sus autopruebas de opciones, rutas y cálculo de rangos.

### Segunda versión

Se registraron **18 pruebas de motor**, **6 de audio simulado** y **16 observaciones de interfaz**. Incluían bastón, magia de área, energía manual, faros reutilizables, recogida de objetos, puertas y acertijos, guardado, título separado de los créditos y controles táctiles emulados.

Esas pruebas corresponden al motor anterior, sin misiones de campaña ni jefes. Tampoco prueban el nuevo fuego persistente, la obsidiana, el vehículo o el cierre actual.

### Primera versión

El registro inicial contiene **32 comprobaciones** en Edge con teclado y emulación táctil: identidad, recursos, movimiento, pausa, marcas musicales, combate, transiciones, guardado, cierre y controles. Usaba prólogo y distribución anterior de teclas.

## Alcance

No se realizó una partida humana continua de toda la campaña. Las pruebas de audio utilizan medios simulados. Los controles móviles se han comprobado por emulación en entregas anteriores; los teléfonos físicos, Safari/iOS y una conexión Wi-Fi real requieren prueba directa. La apertura manual del navegador mediante doble clic en INICIAR.cmd tampoco se ha automatizado: el servidor se examinó con **--no-open**.

El workflow de Pages está preparado, sin prueba remota de despliegue. La dificultad y el ritmo de una campaña completa necesitan una partida real después de la validación técnica.
