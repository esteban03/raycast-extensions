# Generador de RUT para Raycast

Un generador de RUT chileno para Raycast.

Genera RUTs chilenos válidos para desarrollo, pruebas, formularios, datos de seed y flujos de QA.

<img width="896" height="606" alt="image" src="https://github.com/user-attachments/assets/19d8ace9-6421-4f69-92e1-6390f17ffff8" />

## Características

- Genera 10 RUTs chilenos válidos a la vez
- Copia un RUT al portapapeles
- Copia la lista completa de RUTs generados
- Regenera la lista rápidamente
- Permite elegir entre formatos comunes:
  - `12.345.678-5`
  - `12345678-5`
  - `123456785`

## Formato por defecto

El formato por defecto es:

```txt
12.345.678-5
```

Puedes cambiar el formato desde las acciones del comando en Raycast.

## Desarrollo

Instalar dependencias:

```bash
npm install
```

Ejecutar la extensión localmente:

```bash
npm run dev
```

Ejecutar validaciones:

```bash
npm test
npm run typecheck
npm run lint
```

## Licencia

MIT
