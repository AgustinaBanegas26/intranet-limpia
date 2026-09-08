// vite.config.ts
import path from "path";
import { defineConfig } from "file:///C:/Users/Usuario/Documents/GitHub/IntraNet-oficial/Intranet/IntraNet/frontend/node_modules/vite/dist/node/index.js";
import react from "file:///C:/Users/Usuario/Documents/GitHub/IntraNet-oficial/Intranet/IntraNet/frontend/node_modules/@vitejs/plugin-react/dist/index.js";
import tailwindcss from "file:///C:/Users/Usuario/Documents/GitHub/IntraNet-oficial/Intranet/IntraNet/frontend/node_modules/@tailwindcss/vite/dist/index.mjs";
import { VitePWA } from "file:///C:/Users/Usuario/Documents/GitHub/IntraNet-oficial/Intranet/IntraNet/frontend/node_modules/vite-plugin-pwa/dist/index.js";
var __vite_injected_original_dirname = "C:\\Users\\Usuario\\Documents\\GitHub\\IntraNet-oficial\\Intranet\\IntraNet\\frontend";
var vite_config_default = defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    VitePWA({
      registerType: "autoUpdate",
      includeAssets: [
        "logo.png",
        "manifest.webmanifest",
        "icons/apple-touch-icon.png",
        "icons/icon-72x72.png",
        "icons/icon-96x96.png",
        "icons/icon-128x128.png",
        "icons/icon-144x144.png",
        "icons/icon-152x152.png",
        "icons/icon-192x192.png",
        "icons/icon-384x384.png",
        "icons/icon-512x512.png",
        "pwa/icon.png",
        "pwa/splash.png",
        "pwa/splash-640x1136.png",
        "pwa/splash-750x1334.png",
        "pwa/splash-1242x2208.png",
        "pwa/splash-1284x2778.png"
      ],
      manifest: false,
      injectRegister: null,
      workbox: {
        globPatterns: ["**/*.{js,css,html,ico,png,svg,webp,woff2,webmanifest}"],
        navigateFallback: "/index.html",
        navigateFallbackDenylist: [/^\/api\//],
        runtimeCaching: [
          {
            urlPattern: ({ url }) => url.pathname.startsWith("/auth/") || url.pathname.startsWith("/api/") || url.pathname.includes("/auth/"),
            handler: "NetworkOnly",
            options: {
              cacheName: "auth-and-api"
            }
          },
          {
            urlPattern: ({ url }) => {
              const host = url.hostname;
              return host.includes("supabase.co") || host.includes("supabase.in") || url.pathname.includes("/rest/v1/");
            },
            handler: "NetworkFirst",
            options: {
              cacheName: "supabase-api",
              networkTimeoutSeconds: 10,
              expiration: {
                maxEntries: 50,
                maxAgeSeconds: 60 * 5
              },
              cacheableResponse: {
                statuses: [0, 200]
              }
            }
          },
          {
            urlPattern: ({ request }) => request.destination === "image",
            handler: "StaleWhileRevalidate",
            options: {
              cacheName: "images",
              expiration: {
                maxEntries: 60,
                maxAgeSeconds: 60 * 60 * 24 * 30
              }
            }
          },
          {
            urlPattern: ({ request }) => request.destination === "style" || request.destination === "script" || request.destination === "worker",
            handler: "StaleWhileRevalidate",
            options: {
              cacheName: "static-resources"
            }
          }
        ]
      },
      devOptions: {
        // Evita SW en dev: mezclaba chunks viejos de React con los nuevos (useState null).
        enabled: false,
        type: "module"
      }
    })
  ],
  resolve: {
    alias: {
      "@": path.resolve(__vite_injected_original_dirname, "./src"),
      react: path.resolve(__vite_injected_original_dirname, "./node_modules/react"),
      "react-dom": path.resolve(__vite_injected_original_dirname, "./node_modules/react-dom")
    },
    dedupe: ["react", "react-dom", "react-router"]
  },
  optimizeDeps: {
    include: ["react", "react-dom", "react/jsx-runtime", "framer-motion"]
  }
});
export {
  vite_config_default as default
};
//# sourceMappingURL=data:application/json;base64,ewogICJ2ZXJzaW9uIjogMywKICAic291cmNlcyI6IFsidml0ZS5jb25maWcudHMiXSwKICAic291cmNlc0NvbnRlbnQiOiBbImNvbnN0IF9fdml0ZV9pbmplY3RlZF9vcmlnaW5hbF9kaXJuYW1lID0gXCJDOlxcXFxVc2Vyc1xcXFxVc3VhcmlvXFxcXERvY3VtZW50c1xcXFxHaXRIdWJcXFxcSW50cmFOZXQtb2ZpY2lhbFxcXFxJbnRyYW5ldFxcXFxJbnRyYU5ldFxcXFxmcm9udGVuZFwiO2NvbnN0IF9fdml0ZV9pbmplY3RlZF9vcmlnaW5hbF9maWxlbmFtZSA9IFwiQzpcXFxcVXNlcnNcXFxcVXN1YXJpb1xcXFxEb2N1bWVudHNcXFxcR2l0SHViXFxcXEludHJhTmV0LW9maWNpYWxcXFxcSW50cmFuZXRcXFxcSW50cmFOZXRcXFxcZnJvbnRlbmRcXFxcdml0ZS5jb25maWcudHNcIjtjb25zdCBfX3ZpdGVfaW5qZWN0ZWRfb3JpZ2luYWxfaW1wb3J0X21ldGFfdXJsID0gXCJmaWxlOi8vL0M6L1VzZXJzL1VzdWFyaW8vRG9jdW1lbnRzL0dpdEh1Yi9JbnRyYU5ldC1vZmljaWFsL0ludHJhbmV0L0ludHJhTmV0L2Zyb250ZW5kL3ZpdGUuY29uZmlnLnRzXCI7aW1wb3J0IHBhdGggZnJvbSAncGF0aCdcclxuaW1wb3J0IHsgZGVmaW5lQ29uZmlnIH0gZnJvbSAndml0ZSdcclxuaW1wb3J0IHJlYWN0IGZyb20gJ0B2aXRlanMvcGx1Z2luLXJlYWN0J1xyXG5pbXBvcnQgdGFpbHdpbmRjc3MgZnJvbSAnQHRhaWx3aW5kY3NzL3ZpdGUnXHJcbmltcG9ydCB7IFZpdGVQV0EgfSBmcm9tICd2aXRlLXBsdWdpbi1wd2EnXHJcblxyXG5leHBvcnQgZGVmYXVsdCBkZWZpbmVDb25maWcoe1xyXG4gIHBsdWdpbnM6IFtcclxuICAgIHJlYWN0KCksXHJcbiAgICB0YWlsd2luZGNzcygpLFxyXG4gICAgVml0ZVBXQSh7XHJcbiAgICAgIHJlZ2lzdGVyVHlwZTogJ2F1dG9VcGRhdGUnLFxyXG4gICAgICBpbmNsdWRlQXNzZXRzOiBbXHJcbiAgICAgICAgJ2xvZ28ucG5nJyxcclxuICAgICAgICAnbWFuaWZlc3Qud2VibWFuaWZlc3QnLFxyXG4gICAgICAgICdpY29ucy9hcHBsZS10b3VjaC1pY29uLnBuZycsXHJcbiAgICAgICAgJ2ljb25zL2ljb24tNzJ4NzIucG5nJyxcclxuICAgICAgICAnaWNvbnMvaWNvbi05Nng5Ni5wbmcnLFxyXG4gICAgICAgICdpY29ucy9pY29uLTEyOHgxMjgucG5nJyxcclxuICAgICAgICAnaWNvbnMvaWNvbi0xNDR4MTQ0LnBuZycsXHJcbiAgICAgICAgJ2ljb25zL2ljb24tMTUyeDE1Mi5wbmcnLFxyXG4gICAgICAgICdpY29ucy9pY29uLTE5MngxOTIucG5nJyxcclxuICAgICAgICAnaWNvbnMvaWNvbi0zODR4Mzg0LnBuZycsXHJcbiAgICAgICAgJ2ljb25zL2ljb24tNTEyeDUxMi5wbmcnLFxyXG4gICAgICAgICdwd2EvaWNvbi5wbmcnLFxyXG4gICAgICAgICdwd2Evc3BsYXNoLnBuZycsXHJcbiAgICAgICAgJ3B3YS9zcGxhc2gtNjQweDExMzYucG5nJyxcclxuICAgICAgICAncHdhL3NwbGFzaC03NTB4MTMzNC5wbmcnLFxyXG4gICAgICAgICdwd2Evc3BsYXNoLTEyNDJ4MjIwOC5wbmcnLFxyXG4gICAgICAgICdwd2Evc3BsYXNoLTEyODR4Mjc3OC5wbmcnLFxyXG4gICAgICBdLFxyXG4gICAgICBtYW5pZmVzdDogZmFsc2UsXHJcbiAgICAgIGluamVjdFJlZ2lzdGVyOiBudWxsLFxyXG4gICAgICB3b3JrYm94OiB7XHJcbiAgICAgICAgZ2xvYlBhdHRlcm5zOiBbJyoqLyoue2pzLGNzcyxodG1sLGljbyxwbmcsc3ZnLHdlYnAsd29mZjIsd2VibWFuaWZlc3R9J10sXHJcbiAgICAgICAgbmF2aWdhdGVGYWxsYmFjazogJy9pbmRleC5odG1sJyxcclxuICAgICAgICBuYXZpZ2F0ZUZhbGxiYWNrRGVueWxpc3Q6IFsvXlxcL2FwaVxcLy9dLFxyXG4gICAgICAgIHJ1bnRpbWVDYWNoaW5nOiBbXHJcbiAgICAgICAgICB7XHJcbiAgICAgICAgICAgIHVybFBhdHRlcm46ICh7IHVybCB9KSA9PlxyXG4gICAgICAgICAgICAgIHVybC5wYXRobmFtZS5zdGFydHNXaXRoKCcvYXV0aC8nKSB8fFxyXG4gICAgICAgICAgICAgIHVybC5wYXRobmFtZS5zdGFydHNXaXRoKCcvYXBpLycpIHx8XHJcbiAgICAgICAgICAgICAgdXJsLnBhdGhuYW1lLmluY2x1ZGVzKCcvYXV0aC8nKSxcclxuICAgICAgICAgICAgaGFuZGxlcjogJ05ldHdvcmtPbmx5JyxcclxuICAgICAgICAgICAgb3B0aW9uczoge1xyXG4gICAgICAgICAgICAgIGNhY2hlTmFtZTogJ2F1dGgtYW5kLWFwaScsXHJcbiAgICAgICAgICAgIH0sXHJcbiAgICAgICAgICB9LFxyXG4gICAgICAgICAge1xyXG4gICAgICAgICAgICB1cmxQYXR0ZXJuOiAoeyB1cmwgfSkgPT4ge1xyXG4gICAgICAgICAgICAgIGNvbnN0IGhvc3QgPSB1cmwuaG9zdG5hbWVcclxuICAgICAgICAgICAgICByZXR1cm4gKFxyXG4gICAgICAgICAgICAgICAgaG9zdC5pbmNsdWRlcygnc3VwYWJhc2UuY28nKSB8fFxyXG4gICAgICAgICAgICAgICAgaG9zdC5pbmNsdWRlcygnc3VwYWJhc2UuaW4nKSB8fFxyXG4gICAgICAgICAgICAgICAgdXJsLnBhdGhuYW1lLmluY2x1ZGVzKCcvcmVzdC92MS8nKVxyXG4gICAgICAgICAgICAgIClcclxuICAgICAgICAgICAgfSxcclxuICAgICAgICAgICAgaGFuZGxlcjogJ05ldHdvcmtGaXJzdCcsXHJcbiAgICAgICAgICAgIG9wdGlvbnM6IHtcclxuICAgICAgICAgICAgICBjYWNoZU5hbWU6ICdzdXBhYmFzZS1hcGknLFxyXG4gICAgICAgICAgICAgIG5ldHdvcmtUaW1lb3V0U2Vjb25kczogMTAsXHJcbiAgICAgICAgICAgICAgZXhwaXJhdGlvbjoge1xyXG4gICAgICAgICAgICAgICAgbWF4RW50cmllczogNTAsXHJcbiAgICAgICAgICAgICAgICBtYXhBZ2VTZWNvbmRzOiA2MCAqIDUsXHJcbiAgICAgICAgICAgICAgfSxcclxuICAgICAgICAgICAgICBjYWNoZWFibGVSZXNwb25zZToge1xyXG4gICAgICAgICAgICAgICAgc3RhdHVzZXM6IFswLCAyMDBdLFxyXG4gICAgICAgICAgICAgIH0sXHJcbiAgICAgICAgICAgIH0sXHJcbiAgICAgICAgICB9LFxyXG4gICAgICAgICAge1xyXG4gICAgICAgICAgICB1cmxQYXR0ZXJuOiAoeyByZXF1ZXN0IH0pID0+IHJlcXVlc3QuZGVzdGluYXRpb24gPT09ICdpbWFnZScsXHJcbiAgICAgICAgICAgIGhhbmRsZXI6ICdTdGFsZVdoaWxlUmV2YWxpZGF0ZScsXHJcbiAgICAgICAgICAgIG9wdGlvbnM6IHtcclxuICAgICAgICAgICAgICBjYWNoZU5hbWU6ICdpbWFnZXMnLFxyXG4gICAgICAgICAgICAgIGV4cGlyYXRpb246IHtcclxuICAgICAgICAgICAgICAgIG1heEVudHJpZXM6IDYwLFxyXG4gICAgICAgICAgICAgICAgbWF4QWdlU2Vjb25kczogNjAgKiA2MCAqIDI0ICogMzAsXHJcbiAgICAgICAgICAgICAgfSxcclxuICAgICAgICAgICAgfSxcclxuICAgICAgICAgIH0sXHJcbiAgICAgICAgICB7XHJcbiAgICAgICAgICAgIHVybFBhdHRlcm46ICh7IHJlcXVlc3QgfSkgPT5cclxuICAgICAgICAgICAgICByZXF1ZXN0LmRlc3RpbmF0aW9uID09PSAnc3R5bGUnIHx8XHJcbiAgICAgICAgICAgICAgcmVxdWVzdC5kZXN0aW5hdGlvbiA9PT0gJ3NjcmlwdCcgfHxcclxuICAgICAgICAgICAgICByZXF1ZXN0LmRlc3RpbmF0aW9uID09PSAnd29ya2VyJyxcclxuICAgICAgICAgICAgaGFuZGxlcjogJ1N0YWxlV2hpbGVSZXZhbGlkYXRlJyxcclxuICAgICAgICAgICAgb3B0aW9uczoge1xyXG4gICAgICAgICAgICAgIGNhY2hlTmFtZTogJ3N0YXRpYy1yZXNvdXJjZXMnLFxyXG4gICAgICAgICAgICB9LFxyXG4gICAgICAgICAgfSxcclxuICAgICAgICBdLFxyXG4gICAgICB9LFxyXG4gICAgICBkZXZPcHRpb25zOiB7XHJcbiAgICAgICAgLy8gRXZpdGEgU1cgZW4gZGV2OiBtZXpjbGFiYSBjaHVua3Mgdmllam9zIGRlIFJlYWN0IGNvbiBsb3MgbnVldm9zICh1c2VTdGF0ZSBudWxsKS5cclxuICAgICAgICBlbmFibGVkOiBmYWxzZSxcclxuICAgICAgICB0eXBlOiAnbW9kdWxlJyxcclxuICAgICAgfSxcclxuICAgIH0pLFxyXG4gIF0sXHJcbiAgcmVzb2x2ZToge1xyXG4gICAgYWxpYXM6IHtcclxuICAgICAgJ0AnOiBwYXRoLnJlc29sdmUoX19kaXJuYW1lLCAnLi9zcmMnKSxcclxuICAgICAgcmVhY3Q6IHBhdGgucmVzb2x2ZShfX2Rpcm5hbWUsICcuL25vZGVfbW9kdWxlcy9yZWFjdCcpLFxyXG4gICAgICAncmVhY3QtZG9tJzogcGF0aC5yZXNvbHZlKF9fZGlybmFtZSwgJy4vbm9kZV9tb2R1bGVzL3JlYWN0LWRvbScpLFxyXG4gICAgfSxcclxuICAgIGRlZHVwZTogWydyZWFjdCcsICdyZWFjdC1kb20nLCAncmVhY3Qtcm91dGVyJ10sXHJcbiAgfSxcclxuICBvcHRpbWl6ZURlcHM6IHtcclxuICAgIGluY2x1ZGU6IFsncmVhY3QnLCAncmVhY3QtZG9tJywgJ3JlYWN0L2pzeC1ydW50aW1lJywgJ2ZyYW1lci1tb3Rpb24nXSxcclxuICB9LFxyXG59KVxyXG4iXSwKICAibWFwcGluZ3MiOiAiO0FBQTJhLE9BQU8sVUFBVTtBQUM1YixTQUFTLG9CQUFvQjtBQUM3QixPQUFPLFdBQVc7QUFDbEIsT0FBTyxpQkFBaUI7QUFDeEIsU0FBUyxlQUFlO0FBSnhCLElBQU0sbUNBQW1DO0FBTXpDLElBQU8sc0JBQVEsYUFBYTtBQUFBLEVBQzFCLFNBQVM7QUFBQSxJQUNQLE1BQU07QUFBQSxJQUNOLFlBQVk7QUFBQSxJQUNaLFFBQVE7QUFBQSxNQUNOLGNB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
