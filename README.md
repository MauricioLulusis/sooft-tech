<div align="center">

```
███████╗ ██████╗  ██████╗ ███████╗████████╗
██╔════╝██╔═══██╗██╔═══██╗██╔════╝╚══██╔══╝
███████╗██║   ██║██║   ██║█████╗     ██║
╚════██║██║   ██║██║   ██║██╔══╝     ██║
███████║╚██████╔╝╚██████╔╝██║        ██║
╚══════╝ ╚═════╝  ╚═════╝ ╚═╝        ╚═╝
```

**Sooft Technology · AI Engineering**

</div>

# sooft

`sooft` es el **gestor de assets para agentes de IA** de Sooft Technology — un solo
comando para distribuir tus convenciones de ingeniería (**reglas / steering files**)
y **hooks** de ciclo de vida a todos los agentes de IA del equipo, desde un repo Git
compartido.

Escribí tus estándares una sola vez; instalalos en el formato nativo de cada agente
([Claude Code](https://claude.com/claude-code), Cursor). La instalación es un flujo
**plan → aprobar → merge**: aditivo, idempotente y exactamente reversible.

```bash
npx sooft add sooft-tech/standards      # plan → aprobar → merge
npx sooft list                          # qué está instalado, y dónde
npx sooft remove sooft-standards        # saca exactamente lo que un pack instaló
```

## Por qué

Los agentes de IA solo respetan las convenciones que pueden ver. Copiar y pegar
reglas y hooks en cada repo y cada config de agente se desalinea al toque. `sooft`
trata esos assets como un **paquete versionado e instalable** — publicás una vez,
instalás en todos lados, actualizás cuando haga falta y desinstalás limpio.

- **Un comando, muchos agentes.** Detecta automáticamente Claude Code / Cursor en
  el workspace y coloca los assets en la ubicación nativa de cada uno.
- **Nada corre en silencio.** Los hooks son comandos que el agente ejecuta en su
  propio ciclo de vida, así que `add` siempre muestra el plan completo y pregunta
  antes de escribir.
- **Merge, nunca pisa.** Los bloques de hooks quedan marcados por pack, así que las
  instalaciones son aditivas y `remove` saca exactamente lo que aportó un pack — tu
  config escrita a mano y los demás packs nunca se tocan.
- **Cero dependencias.** ESM puro de Node. Corre con `node`, `npx` o instalación
  global — sin build step, sin dependencias de runtime.

## Instalación

```bash
npm i -g @sooft/cli        # el comando `sooft` ya queda en tu PATH
# o corré sin instalar:
npx @sooft/cli <comando>
```

Requiere **Node ≥ 18**.

## Inicio rápido

```bash
# 1. Armá un pack (reglas + hooks) y publicalo en un repo Git
sooft init sooft-standards

# 2. En cualquier repo, instalalo
sooft add sooft-tech/standards          # owner/repo
sooft add ./sooft-standards             # path local
sooft add https://git.example.com/team/standards.git   # cualquier remoto git

# 3. Administralo
sooft list                              # packs instalados + dónde quedaron
sooft check                             # detecta drift contra el manifest
sooft remove sooft-standards            # desinstalación limpia
sooft doctor                            # salud del entorno + del workspace
```

## Sooft AI Rails — un comando, todas las herramientas

`sooft agent install` distribuye la metodología **Sooft Engineering AI Rails**
(el repo [`sooft-ai-standards`](https://github.com/sooft-tech/sooft-ai-standards) —
skills, subagentes, hooks e instrucciones) en **todas** las herramientas de IA que
detecte: Claude Code, GitHub Copilot (CLI + VS Code), Cursor, Kiro, Windsurf y el
genérico `.agents/`. Cada herramienta recibe los artefactos en su ubicación
**nativa**.

```bash
sooft agent source sooft-tech/sooft-ai-standards   # configurá la fuente una vez (repo, URL git o path)
sooft agent install                                # instala en todas las herramientas detectadas
sooft agent install --all                           # ...o forzá todas las soportadas
sooft agent install --dry-run                       # previsualizá el plan, sin escribir nada
sooft agent update                                  # reinstala, reemplazando la instalación anterior
sooft agent remove                                  # saca exactamente lo que se instaló
```

| Herramienta | Recibe |
| --- | --- |
| **Claude Code** | skills → `.claude/skills/`, subagentes → `.claude/agents/` |
| **GitHub Copilot** | subagentes, prompts, hooks → `.github/`, instrucciones → `.github/copilot-instructions.md` |
| **Cursor** | reglas → `.cursor/rules/sooft-ai-rails.mdc` |
| **Kiro** | steering → `.kiro/steering/sooft-ai-rails.md` |
| **Windsurf** | reglas → `.windsurf/rules/sooft-ai-rails.md` |
| **Genérico** | skills → `.agents/skills/` |

Cada instalación queda registrada en `.sooft/manifest.json`, así que `agent remove`
es exacto y reversible. La metodología impone **gates de aprobación** humana (PRD →
SPEC → PLAN → código → review): el agente nunca escribe código sin un plan
aprobado.

## Comandos

| Comando | Descripción |
| --- | --- |
| `agent install` | Instala Sooft AI Rails en todas las herramientas de IA detectadas (`--all`, `--dry-run`) |
| `agent update` | Reinstala los estándares, reemplazando la instalación anterior |
| `agent remove` | Saca todo lo que instalaron los estándares |
| `agent source [url]` | Muestra o configura la fuente de los estándares (`owner/repo`, URL git o path) |
| `init [nombre]` | Arma un pack de assets de Sooft (`sooft.pack.json` + reglas + hooks) |
| `add <fuente>` | Instala un pack desde `owner/repo[/subdir][@ref]`, una URL git o un path local — plan → aprobar → merge |
| `list`, `ls` | Packs instalados por scope, con resumen de dónde quedaron |
| `check` | Verifica que los archivos instalados sigan coincidiendo con el manifest (detección de drift) |
| `remove <nombre>`, `rm` | Saca exactamente los archivos + entradas de hooks que aportó un pack |
| `doctor` | Runtime, agentes detectados y estado del workspace |

**Flags:** `-g/--global` (scope home), `--agent <nombre>` (repetible: `claude`,
`cursor`), `-y/--yes` (saltea la aprobación), `--dry-run` (solo previsualiza),
`--json`, `--no-banner`, `-v/--version`, `-h/--help`.

**Códigos de salida:** `0` ok · `1` rechazado/falló · `2` uso incorrecto · `3` no se instaló nada.

## Formato de pack

Un **pack de assets de Sooft** es un directorio con un manifest `sooft.pack.json`:

```jsonc
{
  "name": "sooft-standards",
  "version": "1.0.0",
  "description": "Convenciones de ingeniería de Sooft",
  "rules": ["rules/engineering.md"],   // markdown que se distribuye a los agentes
  "hooks": "hooks.json"                 // hooks de ciclo de vida (opcional)
}
```

`hooks.json` usa el formato de hooks de Claude Code (`SessionStart`,
`PostToolUse`, …). Armá un pack listo para editar con `sooft init`.

## Destinos de instalación

| Agente | Reglas | Hooks |
| --- | --- | --- |
| **Claude Code** | `.claude/rules/<pack>-<archivo>.md` | mergeados en `.claude/settings.json` |
| **Cursor** | `.cursor/rules/<pack>-<archivo>.mdc` | mergeados en `.cursor/hooks.json` |

Sin `--agent`, los destinos se detectan automáticamente del workspace, con
Claude Code como fallback. Usá `-g` para instalar en el scope home del usuario
en vez del repo.

## Variables de entorno

- `SOOFT_NO_BANNER` — oculta el banner con el wordmark.
- `NO_COLOR` — desactiva el color (el banner igual se imprime, sin color).
- `FORCE_COLOR` — fuerza color aunque la salida esté siendo redirigida (piped).
- `GITHUB_TOKEN` / `GH_TOKEN` — los usa git para repos privados.

## Desarrollo

```bash
npm test              # corre la suite (test runner nativo de Node, cero deps)
npm run sooft -- --help
```

- **Runtime:** Node ≥ 18, ESM, cero dependencias de runtime.
- **Estructura:** launcher en `bin/` · módulos en `src/` + `src/commands/` · `tests/`.
- **Estilo:** nombres de archivo en minúscula-con-guiones, `const` antes que `let`, módulos chicos.

## Licencia

MIT © Sooft Technology
