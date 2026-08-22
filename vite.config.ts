import { defineConfig } from 'vite'
import mdx from 'fumadocs-mdx/vite'
import { devtools } from '@tanstack/devtools-vite'

import { tanstackStart } from '@tanstack/react-start/plugin/vite'

import viteReact from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { cloudflare } from '@cloudflare/vite-plugin'

const config = defineConfig({
  build: { target: 'es2022' },
  resolve: { tsconfigPaths: true },
  plugins: [
    mdx(),
    devtools(),
    cloudflare({ viteEnvironment: { name: 'ssr' } }),
    tailwindcss(),
    tanstackStart({
      importProtection: {
        // auth.client.ts is isomorphic (guards window access internally);
        // allow server-side route files to import it.
        server: { excludeFiles: ['**/features/auth/auth.client.*'] },
      },
    }),
    viteReact(),
  ],
})

export default config
