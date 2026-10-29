import { fileURLToPath } from 'node:url'
import { transformWithOxc } from 'vite'
import type { ConfigEnv, Plugin, UserConfig, ViteDevServer } from 'vite'
// import * as babel from '@babel/core'
// import { luentPreTransform as BabelLuentPlugin } from '@luently/babel-plugin-luent'

type CompileLuent = (
  source: string,
  file: string
) => { code?: string; map?: object } | null | undefined

const pluginFile = fileURLToPath(import.meta.url)
let devServer: ViteDevServer | undefined
let workspaceCompiler: Promise<CompileLuent> | undefined
let compileLuentSource = 'luent-compiler'

interface LuentPluginOptions {
  useWorkspace?: boolean
}

// [] generate html from html.tsx

// const VIRTUAL_PREFIX = '\0luent:'

// interface Page {
//   id: string
//   route: string
// }

// interface ClientModule {
//   id: string
//   sourceId: string
// }


export default function LuentPlugin(options: LuentPluginOptions = {}): Plugin {
  // const pages = new Map<string, Page>()
  // const clientModules = new Map<string, ClientModule>()

  return {
    name: 'luent',
    enforce: 'pre',

    configureServer(server) {
      devServer = server
    },

    async config(userConfig: UserConfig, env: ConfigEnv) {
      const { command, isSsrBuild } = env
      const conditions = userConfig.resolve?.conditions ?? []
      const workspaceConditions = options.useWorkspace
        ? composeList('luentWorkspace', conditions)
        : conditions
      const configuredExtensions = userConfig.resolve?.extensions
      const optimizeDeps = userConfig.optimizeDeps
      const ssrOptions = typeof userConfig.ssr === 'object' && userConfig.ssr !== null ? userConfig.ssr : undefined

      // const input = await discoverPages({
      //   forEach(id, route) {
      //     pages.set(id, { id, route })
      //   }
      // })

      return {
        resolve: {
          ...userConfig.resolve,
          conditions: workspaceConditions,
          ...(configuredExtensions
            ? { extensions: composeList('.nsx', composeList('.ns', configuredExtensions)) }
            : {}),
        },
        ...(options.useWorkspace
          ? {
              optimizeDeps: {
                ...optimizeDeps,
                rolldownOptions: {
                  ...(optimizeDeps?.rolldownOptions ?? {}),
                  resolve: {
                    ...(optimizeDeps?.rolldownOptions?.resolve ?? {}),
                    conditionNames: composeList(
                      'luentWorkspace',
                      optimizeDeps?.rolldownOptions?.resolve?.conditionNames ?? []
                    ),
                  },
                },
              },
              ssr: {
                ...ssrOptions,
                noExternal: composeNoExternal(ssrOptions?.noExternal),
                resolve: {
                  ...(ssrOptions?.resolve ?? {}),
                  conditions: composeList(
                    'luentWorkspace',
                    ssrOptions?.resolve?.conditions ?? []
                  ),
                  externalConditions: composeList(
                    'luentWorkspace',
                    ssrOptions?.resolve?.externalConditions ?? []
                  ),
                },
              },
            }
          : {}),
        oxc: {
          ...(userConfig.oxc || {}),
          jsx: {
            throwIfNamespace: false,
            pure: false,
          },
        },
        define: {
          ...(userConfig.define ?? {}),
          __INTERNAL__: false,
          __TEST__: JSON.stringify(process.env.NODE_ENV === 'test'),
          __DEV__: command !== 'build',
          __SSR__: Boolean(isSsrBuild),
        },
        // build: {
        //   rolldownOptions: {
        //     input
        //   }
        // }
      }
    },

    // buildStart() {
    //   for (const page of pages.values()) {
    //     const clientEntry = `${VIRTUAL_PREFIX}page:${page.id}`

    //     this.emitFile({
    //       type: 'chunk',
    //       id: clientEntry,
    //       name: `${page.route || 'index'}.client`,
    //     })
    //   }
    // },

    // TODO: move .nsx transform to transform()
    // async load(id) {
    //   const fileName = id.split('?')[0]
    //   if (!fileName.endsWith('.nsx')) {
    //     return null
    //   }

    //   const { transpileNoriScript } = await import('@luently/noriscript/transpile')

    //   const code = await readFile(fileName, 'utf8')
    //   const { transpiled } = transpileNoriScript(fileName, code)

    //   const result = await babel.transformAsync(transpiled.code, {
    //     plugins: [
    //       BabelLuentPlugin,
    //       ['@babel/plugin-syntax-typescript', { isTSX: true }]
    //     ],
    //     filename: fileName,
    //     sourceMaps: true,
    //     generatorOpts: {
    //       jsescOption: {
    //         minimal: true
    //       }
    //     }
    //   })

    //   if (!result?.code) {
    //     return null
    //   }

    //   const normalized = await transformWithOxc(result.code, fileName.replace(/\.nsx$/, '.tsx'), {
    //     jsx: {
    //       runtime: 'automatic',
    //       importSource: 'luent',
    //       throwIfNamespace: false
    //     },
    //     sourcemap: true
    //   }, result.map)

    //   return {
    //     code: normalized.code,
    //     map: normalized.map
    //   }
    // },

    async transform(code, id) {
      const fileName = id.split('?')[0]
      if (!fileName.endsWith('.jsx') && !fileName.endsWith('.tsx')) {
        return null
      }

      // const parserPlugins: ('jsx' | 'typescript')[] = fileName.endsWith('.tsx')
      //   ? ['jsx', 'typescript']
      //   : ['jsx']

      // // TODO: migrate to oxc
      // const result = await babel.transformAsync(code, {
      //   plugins: [
      //     BabelLuentPlugin,
      //     ['@babel/plugin-syntax-typescript', { disallowAmbiguousJSXLike: false }]
      //   ],
      //   parserOpts: {
      //     plugins: parserPlugins
      //   },
      //   filename: fileName,
      //   sourceMaps: true,
      //   generatorOpts: {
      //     jsescOption: {
      //       minimal: true
      //     }
      //   }
      // })

      const compileLuent = await loadCompileLuent(options.useWorkspace)
      const result = compileLuent(code, fileName)
      console.log('compile luent?...', fileName, compileLuentSource)

      // testCompile()

      // console.log('RESULT', result.code)

      if (!result?.code) {
        return null
      }

      const normalized = await transformWithOxc(result.code, fileName, {
        jsx: {
          runtime: 'automatic',
          importSource: 'luent',
          throwIfNamespace: false,
          pure: false
        },
        sourcemap: true
      }, result.map)

      return {
        code: normalized.code,
        map: normalized.map
      }
    },

    // generateBundle() {
    //   for (const page of pages) {
    //     const Page = await loadPage(server, page)

    //     const html = renderToString(Page)

    //     const extracted = extractPortals(html)
    //     const finalHtml = injectPortals(extracted)

    //     // Write finalHtml to dist/...
    //   }
    // }
  }
}

async function loadCompileLuent(useWorkspace?: boolean): Promise<CompileLuent> {
  if (!useWorkspace) {
    const mod = await import('luent-compiler')
    compileLuentSource = 'luent-compiler'
    return mod.compileLuent
  }

  if (!devServer) {
    throw new Error(
      'vite-plugin-luent: useWorkspace requires the dev server before luent-compiler can be loaded from source'
    )
  }

  workspaceCompiler ??= devServer.pluginContainer
    .resolveId('luent-compiler', pluginFile, { ssr: true })
    .then(async (resolved) => {
      if (!resolved || resolved.external) {
        throw new Error(
          `vite-plugin-luent: failed to resolve workspace luent-compiler from ${pluginFile}`
        )
      }

      compileLuentSource = resolved.id
      const mod = await devServer!.ssrLoadModule(resolved.id) as { compileLuent: CompileLuent }
      if (typeof mod.compileLuent !== 'function') {
        throw new Error('vite-plugin-luent: workspace luent-compiler did not export compileLuent')
      }
      return mod.compileLuent
    })

  return workspaceCompiler
}

function composeList(item: string, existing: string[]): string[] {
  return [item, ...existing.filter((c) => c !== item)]
}

function composeNoExternal(
  existing: true | string | RegExp | (string | RegExp)[] | undefined
): true | (string | RegExp)[] {
  const workspacePackages = /^(luent|@luently\/)/

  if (existing === true) {
    return true
  }

  if (existing === undefined) {
    return [workspacePackages]
  }

  const list = Array.isArray(existing) ? existing : [existing]
  if (list.some((item) => item instanceof RegExp && item.source === workspacePackages.source)) {
    return list
  }

  return [...list, workspacePackages]
}

// const testSource = `
//     import { ion, style, FromTag, If, Thru } from 'luent';

// export function HabitTracker(setup: FromTag<{
//   habit: string,
//   goal?: number
// }>) {
//   const { habit, goal = 5 } = setup

//   const count = ion(0)
//   const achieved = ion(() => count() === goal)

//   return <>
//     <div>
//       {habit}
//       <ul class='tracker'>
//         {Thru(goal, n =>
//           <li
//             class={['unit', { 'filled': () => n <= count() }]}
//             on:click={() => count.value = n}
//           ></li>
//         )}
//         {If(achieved,
//           <li class='star'>🌟</li>
//         )}
//       </ul>
//     </div>

//     {style\`
//         ul.tracker {
//           display: inline-flex;
//           gap: 0.25rem;
//           margin: 0 0 0 0.5rem;
//           padding: 0;
//           list-style-type: none;
//           vertical-align: middle;
//         }

//         li {
//           width: .85rem;
//           height: .85rem;
//           display: inline-flex;
//           align-items: center;
//           justify-content: center;
//           line-height: 1;
//           background-color: transparent;
//           box-sizing: border-box;
//           text-align: center;
//         }

//         li.unit {
//           border: 1px solid currentColor;
//           border-radius: 50%;
//           transition: background-color 0.15s ease;
//         }

//         li.filled {
//           background-color: currentColor;
//         }

//         li.star {
//           font-size: 0.95rem;
//         }
//       \`}
//   </>
// }
//     `

//     let testRan = false;

// async function testCompile() {
//   if (testRan) return;
//   testRan = true;
//   const fileName = 'HabitTracker.tsx'

//         const parserPlugins: ('jsx' | 'typescript')[] = fileName.endsWith('.tsx')
//         ? ['jsx', 'typescript']
//         : ['jsx']

//       // TODO: migrate to oxc
//       const resultB = await babel.transformAsync(testSource, {
//         plugins: [
//           BabelLuentPlugin,
//           ['@babel/plugin-syntax-typescript', { disallowAmbiguousJSXLike: false }]
//         ],
//         parserOpts: {
//           plugins: parserPlugins
//         },
//         filename: fileName,
//         sourceMaps: true,
//         generatorOpts: {
//           jsescOption: {
//             minimal: true
//           }
//         }
//       })

//   const result = compileLuent(testSource, fileName)
//     console.log('COMPILE RESULT', result.code)
//     // console.log('BABEL RESULT', resultB.code)
// }

