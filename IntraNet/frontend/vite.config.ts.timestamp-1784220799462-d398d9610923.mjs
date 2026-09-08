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
        "favicon.png",
        "icons/icon-tab.png",
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
        maximumFileSizeToCacheInBytes: 5 * 1024 * 1024,
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
//# sourceMappingURL=data:application/json;base64,ewogICJ2ZXJzaW9uIjogMywKICAic291cmNlcyI6IFsidml0ZS5jb25maWcudHMiXSwKICAic291cmNlc0NvbnRlbnQiOiBbImNvbnN0IF9fdml0ZV9pbmplY3RlZF9vcmlnaW5hbF9kaXJuYW1lID0gXCJDOlxcXFxVc2Vyc1xcXFxVc3VhcmlvXFxcXERvY3VtZW50c1xcXFxHaXRIdWJcXFxcSW50cmFOZXQtb2ZpY2lhbFxcXFxJbnRyYW5ldFxcXFxJbnRyYU5ldFxcXFxmcm9udGVuZFwiO2NvbnN0IF9fdml0ZV9pbmplY3RlZF9vcmlnaW5hbF9maWxlbmFtZSA9IFwiQzpcXFxcVXNlcnNcXFxcVXN1YXJpb1xcXFxEb2N1bWVudHNcXFxcR2l0SHViXFxcXEludHJhTmV0LW9maWNpYWxcXFxcSW50cmFuZXRcXFxcSW50cmFOZXRcXFxcZnJvbnRlbmRcXFxcdml0ZS5jb25maWcudHNcIjtjb25zdCBfX3ZpdGVfaW5qZWN0ZWRfb3JpZ2luYWxfaW1wb3J0X21ldGFfdXJsID0gXCJmaWxlOi8vL0M6L1VzZXJzL1VzdWFyaW8vRG9jdW1lbnRzL0dpdEh1Yi9JbnRyYU5ldC1vZmljaWFsL0ludHJhbmV0L0ludHJhTmV0L2Zyb250ZW5kL3ZpdGUuY29uZmlnLnRzXCI7aW1wb3J0IHBhdGggZnJvbSAncGF0aCdcclxuaW1wb3J0IHsgZGVmaW5lQ29uZmlnIH0gZnJvbSAndml0ZSdcclxuaW1wb3J0IHJlYWN0IGZyb20gJ0B2aXRlanMvcGx1Z2luLXJlYWN0J1xyXG5pbXBvcnQgdGFpbHdpbmRjc3MgZnJvbSAnQHRhaWx3aW5kY3NzL3ZpdGUnXHJcbmltcG9ydCB7IFZpdGVQV0EgfSBmcm9tICd2aXRlLXBsdWdpbi1wd2EnXHJcblxyXG5leHBvcnQgZGVmYXVsdCBkZWZpbmVDb25maWcoe1xyXG4gIHBsdWdpbnM6IFtcclxuICAgIHJlYWN0KCksXHJcbiAgICB0YWlsd2luZGNzcygpLFxyXG4gICAgVml0ZVBXQSh7XHJcbiAgICAgIHJlZ2lzdGVyVHlwZTogJ2F1dG9VcGRhdGUnLFxyXG4gICAgICBpbmNsdWRlQXNzZXRzOiBbXHJcbiAgICAgICAgJ2Zhdmljb24ucG5nJyxcclxuICAgICAgICAnaWNvbnMvaWNvbi10YWIucG5nJyxcclxuICAgICAgICAnbG9nby5wbmcnLFxyXG4gICAgICAgICdtYW5pZmVzdC53ZWJtYW5pZmVzdCcsXHJcbiAgICAgICAgJ2ljb25zL2FwcGxlLXRvdWNoLWljb24ucG5nJyxcclxuICAgICAgICAnaWNvbnMvaWNvbi03Mng3Mi5wbmcnLFxyXG4gICAgICAgICdpY29ucy9pY29uLTk2eDk2LnBuZycsXHJcbiAgICAgICAgJ2ljb25zL2ljb24tMTI4eDEyOC5wbmcnLFxyXG4gICAgICAgICdpY29ucy9pY29uLTE0NHgxNDQucG5nJyxcclxuICAgICAgICAnaWNvbnMvaWNvbi0xNTJ4MTUyLnBuZycsXHJcbiAgICAgICAgJ2ljb25zL2ljb24tMTkyeDE5Mi5wbmcnLFxyXG4gICAgICAgICdpY29ucy9pY29uLTM4NHgzODQucG5nJyxcclxuICAgICAgICAnaWNvbnMvaWNvbi01MTJ4NTEyLnBuZycsXHJcbiAgICAgICAgJ3B3YS9pY29uLnBuZycsXHJcbiAgICAgICAgJ3B3YS9zcGxhc2gucG5nJyxcclxuICAgICAgICAncHdhL3NwbGFzaC02NDB4MTEzNi5wbmcnLFxyXG4gICAgICAgICdwd2Evc3BsYXNoLTc1MHgxMzM0LnBuZycsXHJcbiAgICAgICAgJ3B3YS9zcGxhc2gtMTI0MngyMjA4LnBuZycsXHJcbiAgICAgICAgJ3B3YS9zcGxhc2gtMTI4NHgyNzc4LnBuZycsXHJcbiAgICAgIF0sXHJcbiAgICAgIG1hbmlmZXN0OiBmYWxzZSxcclxuICAgICAgaW5qZWN0UmVnaXN0ZXI6IG51bGwsXHJcbiAgICAgIHdvcmtib3g6IHtcclxuICAgICAgICBtYXhpbXVtRmlsZVNpemVUb0NhY2hlSW5CeXRlczogNSAqIDEwMjQgKiAxMDI0LFxyXG4gICAgICAgIGdsb2JQYXR0ZXJuczogWycqKi8qLntqcyxjc3MsaHRtbCxpY28scG5nLHN2Zyx3ZWJwLHdvZmYyLHdlYm1hbmlmZXN0fSddLFxyXG4gICAgICAgIG5hdmlnYXRlRmFsbGJhY2s6ICcvaW5kZXguaHRtbCcsXHJcbiAgICAgICAgbmF2aWdhdGVGYWxsYmFja0RlbnlsaXN0OiBbL15cXC9hcGlcXC8vXSxcclxuICAgICAgICBydW50aW1lQ2FjaGluZzogW1xyXG4gICAgICAgICAge1xyXG4gICAgICAgICAgICB1cmxQYXR0ZXJuOiAoeyB1cmwgfSkgPT5cclxuICAgICAgICAgICAgICB1cmwucGF0aG5hbWUuc3RhcnRzV2l0aCgnL2F1dGgvJykgfHxcclxuICAgICAgICAgICAgICB1cmwucGF0aG5hbWUuc3RhcnRzV2l0aCgnL2FwaS8nKSB8fFxyXG4gICAgICAgICAgICAgIHVybC5wYXRobmFtZS5pbmNsdWRlcygnL2F1dGgvJyksXHJcbiAgICAgICAgICAgIGhhbmRsZXI6ICdOZXR3b3JrT25seScsXHJcbiAgICAgICAgICAgIG9wdGlvbnM6IHtcclxuICAgICAgICAgICAgICBjYWNoZU5hbWU6ICdhdXRoLWFuZC1hcGknLFxyXG4gICAgICAgICAgICB9LFxyXG4gICAgICAgICAgfSxcclxuICAgICAgICAgIHtcclxuICAgICAgICAgICAgdXJsUGF0dGVybjogKHsgdXJsIH0pID0+IHtcclxuICAgICAgICAgICAgICBjb25zdCBob3N0ID0gdXJsLmhvc3RuYW1lXHJcbiAgICAgICAgICAgICAgcmV0dXJuIChcclxuICAgICAgICAgICAgICAgIGhvc3QuaW5jbHVkZXMoJ3N1cGFiYXNlLmNvJykgfHxcclxuICAgICAgICAgICAgICAgIGhvc3QuaW5jbHVkZXMoJ3N1cGFiYXNlLmluJykgfHxcclxuICAgICAgICAgICAgICAgIHVybC5wYXRobmFtZS5pbmNsdWRlcygnL3Jlc3QvdjEvJylcclxuICAgICAgICAgICAgICApXHJcbiAgICAgICAgICAgIH0sXHJcbiAgICAgICAgICAgIGhhbmRsZXI6ICdOZXR3b3JrRmlyc3QnLFxyXG4gICAgICAgICAgICBvcHRpb25zOiB7XHJcbiAgICAgICAgICAgICAgY2FjaGVOYW1lOiAnc3VwYWJhc2UtYXBpJyxcclxuICAgICAgICAgICAgICBuZXR3b3JrVGltZW91dFNlY29uZHM6IDEwLFxyXG4gICAgICAgICAgICAgIGV4cGlyYXRpb246IHtcclxuICAgICAgICAgICAgICAgIG1heEVudHJpZXM6IDUwLFxyXG4gICAgICAgICAgICAgICAgbWF4QWdlU2Vjb25kczogNjAgKiA1LFxyXG4gICAgICAgICAgICAgIH0sXHJcbiAgICAgICAgICAgICAgY2FjaGVhYmxlUmVzcG9uc2U6IHtcclxuICAgICAgICAgICAgICAgIHN0YXR1c2VzOiBbMCwgMjAwXSxcclxuICAgICAgICAgICAgICB9LFxyXG4gICAgICAgICAgICB9LFxyXG4gICAgICAgICAgfSxcclxuICAgICAgICAgIHtcclxuICAgICAgICAgICAgdXJsUGF0dGVybjogKHsgcmVxdWVzdCB9KSA9PiByZXF1ZXN0LmRlc3RpbmF0aW9uID09PSAnaW1hZ2UnLFxyXG4gICAgICAgICAgICBoYW5kbGVyOiAnU3RhbGVXaGlsZVJldmFsaWRhdGUnLFxyXG4gICAgICAgICAgICBvcHRpb25zOiB7XHJcbiAgICAgICAgICAgICAgY2FjaGVOYW1lOiAnaW1hZ2VzJyxcclxuICAgICAgICAgICAgICBleHBpcmF0aW9uOiB7XHJcbiAgICAgICAgICAgICAgICBtYXhFbnRyaWVzOiA2MCxcclxuICAgICAgICAgICAgICAgIG1heEFnZVNlY29uZHM6IDYwICogNjAgKiAyNCAqIDMwLFxyXG4gICAgICAgICAgICAgIH0sXHJcbiAgICAgICAgICAgIH0sXHJcbiAgICAgICAgICB9LFxyXG4gICAgICAgICAge1xyXG4gICAgICAgICAgICB1cmxQYXR0ZXJuOiAoeyByZXF1ZXN0IH0pID0+XHJcbiAgICAgICAgICAgICAgcmVxdWVzdC5kZXN0aW5hdGlvbiA9PT0gJ3N0eWxlJyB8fFxyXG4gICAgICAgICAgICAgIHJlcXVlc3QuZGVzdGluYXRpb24gPT09ICdzY3JpcHQnIHx8XHJcbiAgICAgICAgICAgICAgcmVxdWVzdC5kZXN0aW5hdGlvbiA9PT0gJ3dvcmtlcicsXHJcbiAgICAgICAgICAgIGhhbmRsZXI6ICdTdGFsZVdoaWxlUmV2YWxpZGF0ZScsXHJcbiAgICAgICAgICAgIG9wdGlvbnM6IHtcclxuICAgICAgICAgICAgICBjYWNoZU5hbWU6ICdzdGF0aWMtcmVzb3VyY2VzJyxcclxuICAgICAgICAgICAgfSxcclxuICAgICAgICAgIH0sXHJcbiAgICAgICAgXSxcclxuICAgICAgfSxcclxuICAgICAgZGV2T3B0aW9uczoge1xyXG4gICAgICAgIGVuYWJsZWQ6IGZhbHNlLFxyXG4gICAgICAgIHR5cGU6ICdtb2R1bGUnLFxyXG4gICAgICB9LFxyXG4gICAgfSksXHJcbiAgXSxcclxuICByZXNvbHZlOiB7XHJcbiAgICBhbGlhczoge1xyXG4gICAgICAnQCc6IHBhdGgucmVzb2x2ZShfX2Rpcm5hbWUsICcuL3NyYycpLFxyXG4gICAgICByZWFjdDogcGF0aC5yZXNvbHZlKF9fZGlybmFtZSwgJy4vbm9kZV9tb2R1bGVzL3JlYWN0JyksXHJcbiAgICAgICdyZWFjdC1kb20nOiBwYXRoLnJlc29sdmUoX19kaXJuYW1lLCAnLi9ub2RlX21vZHVsZXMvcmVhY3QtZG9tJyksXHJcbiAgICB9LFxyXG4gICAgZGVkdXBlOiBbJ3JlYWN0JywgJ3JlYWN0LWRvbScsICdyZWFjdC1yb3V0ZXInXSxcclxuICB9LFxyXG4gIG9wdGltaXplRGVwczoge1xyXG4gICAgaW5jbHVkZTogWydyZWFjdCcsICdyZWFjdC1kb20nLCAncmVhY3QvanN4LXJ1bnRpbWUnLCAnZnJhbWVyLW1vdGlvbiddLFxyXG4gIH0sXHJcbn0pXHJcbiJdLAogICJtYXBwaW5ncyI6ICI7QUFBMmEsT0FBTyxVQUFVO0FBQzViLFNBQVMsb0JBQW9CO0FBQzdCLE9BQU8sV0FBVztBQUNsQixPQUFPLGlCQUFpQjtBQUN4QixTQUFTLGVBQWU7QUFKeEIsSUFBTSxtQ0FBbUM7QUFNekMsSUFBTyxzQkFBUSxhQUFhO0FBQUEsRUFDMUIsU0FBUztBQUFBLElBQ1AsTUFBTTtBQUFBLElBQ04sWUFBWTtBQUFB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
