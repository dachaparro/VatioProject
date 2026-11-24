# Vatio — control del consumo eléctrico del hogar

Aplicación móvil híbrida construida con **Ionic 8 + Angular 19 + Capacitor 7** para el módulo
Énfasis en programación móvil (Politécnico Grancolombiano). Entrega 2, semana 5.

El usuario registra las lecturas de su medidor (con foto opcional), define un **límite mensual de kWh**
y recibe avisos al llegar al 80 % y al 100 % del límite o cuando la proyección indica que lo superará.
Todos los datos se guardan solo en el teléfono.

## Requisitos

- Node.js 20 o superior
- Para Android: Android Studio (incluye el SDK) y Java 21

## Ejecutar en el navegador

```bash
npm install
npx ng serve
```

Abrir http://localhost:4200. En la pantalla de bienvenida se puede usar **"Probar con datos de ejemplo"**
para ver la app con seis meses de lecturas.

## Generar el APK

**Opción A: Android Studio**

```bash
npm install
npx ng build
npx cap sync android
npx cap open android
```

En Android Studio: *Build > Build App Bundle(s) / APK(s) > Build APK(s)*. El archivo queda en
`android/app/build/outputs/apk/debug/app-debug.apk`.

**Opción B: GitHub Actions (sin instalar nada)**

Subir el proyecto a un repositorio de GitHub. El flujo `.github/workflows/apk.yml` compila el APK
automáticamente; se descarga desde *Actions > Compilar APK > (última ejecución) > Artifacts > vatio-apk*.

## Estructura

```
src/app/
  core/
    models.ts          Modelos: Config, Lectura, Equipo
    calc.ts            Cálculos: consumo, proyección, factura, series de las gráficas
    data.service.ts    Persistencia local con Capacitor Preferences
    foto.service.ts    Cámara y galería (Capacitor Camera + Filesystem)
    avisos.service.ts  Notificaciones locales del límite y recordatorios
  shared/
    grafica-barras.component.ts  Gráfica SVG con línea del límite
  pages/
    onboarding/   1. Configuración inicial
    inicio/       2. Inicio (resumen del periodo)
    lectura/      3. Registrar / editar lectura
    historial/    5. Historial con gráficas
    limite/       6. Límite mensual y avisos
    equipos/      7. Electrodomésticos
    equipo/          Agregar / editar electrodoméstico
    ajustes/      8. Ajustes
android/          Proyecto nativo Android generado por Capacitor
```

La pantalla 4 del diseño (notificación del límite) es la notificación del sistema que genera
`avisos.service.ts`; dentro de la app se muestra además como mensaje emergente.

## Plugins nativos usados

| Plugin | Uso |
| --- | --- |
| @capacitor/camera | Foto del medidor desde cámara o galería |
| @capacitor/filesystem | Guardar las fotos y el CSV exportado |
| @capacitor/preferences | Almacenamiento local de configuración, lecturas y equipos |
| @capacitor/local-notifications | Avisos del límite y recordatorio de lectura |
| @capacitor/share | Compartir el CSV exportado |
