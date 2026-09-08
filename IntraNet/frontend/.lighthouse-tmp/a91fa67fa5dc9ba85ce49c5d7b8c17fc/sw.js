import {registerRoute as workbox_routing_registerRoute} from 'C:/Users/Usuario/Documents/GitHub/IntraNet-oficial/Intranet/IntraNet/frontend/node_modules/workbox-routing/registerRoute.mjs';
import {NetworkOnly as workbox_strategies_NetworkOnly} from 'C:/Users/Usuario/Documents/GitHub/IntraNet-oficial/Intranet/IntraNet/frontend/node_modules/workbox-strategies/NetworkOnly.mjs';
import {ExpirationPlugin as workbox_expiration_ExpirationPlugin} from 'C:/Users/Usuario/Documents/GitHub/IntraNet-oficial/Intranet/IntraNet/frontend/node_modules/workbox-expiration/ExpirationPlugin.mjs';
import {CacheableResponsePlugin as workbox_cacheable_response_CacheableResponsePlugin} from 'C:/Users/Usuario/Documents/GitHub/IntraNet-oficial/Intranet/IntraNet/frontend/node_modules/workbox-cacheable-response/CacheableResponsePlugin.mjs';
import {NetworkFirst as workbox_strategies_NetworkFirst} from 'C:/Users/Usuario/Documents/GitHub/IntraNet-oficial/Intranet/IntraNet/frontend/node_modules/workbox-strategies/NetworkFirst.mjs';
import {StaleWhileRevalidate as workbox_strategies_StaleWhileRevalidate} from 'C:/Users/Usuario/Documents/GitHub/IntraNet-oficial/Intranet/IntraNet/frontend/node_modules/workbox-strategies/StaleWhileRevalidate.mjs';
import {clientsClaim as workbox_core_clientsClaim} from 'C:/Users/Usuario/Documents/GitHub/IntraNet-oficial/Intranet/IntraNet/frontend/node_modules/workbox-core/clientsClaim.mjs';
import {precacheAndRoute as workbox_precaching_precacheAndRoute} from 'C:/Users/Usuario/Documents/GitHub/IntraNet-oficial/Intranet/IntraNet/frontend/node_modules/workbox-precaching/precacheAndRoute.mjs';
import {cleanupOutdatedCaches as workbox_precaching_cleanupOutdatedCaches} from 'C:/Users/Usuario/Documents/GitHub/IntraNet-oficial/Intranet/IntraNet/frontend/node_modules/workbox-precaching/cleanupOutdatedCaches.mjs';
import {NavigationRoute as workbox_routing_NavigationRoute} from 'C:/Users/Usuario/Documents/GitHub/IntraNet-oficial/Intranet/IntraNet/frontend/node_modules/workbox-routing/NavigationRoute.mjs';
import {createHandlerBoundToURL as workbox_precaching_createHandlerBoundToURL} from 'C:/Users/Usuario/Documents/GitHub/IntraNet-oficial/Intranet/IntraNet/frontend/node_modules/workbox-precaching/createHandlerBoundToURL.mjs';/**
 * Welcome to your Workbox-powered service worker!
 *
 * You'll need to register this file in your web app.
 * See https://goo.gl/nhQhGp
 *
 * The rest of the code is auto-generated. Please don't update this file
 * directly; instead, make changes to your Workbox build configuration
 * and re-run your build process.
 * See https://goo.gl/2aRDsh
 */




self.skipWaiting();
workbox_core_clientsClaim();
/**
 * The precacheAndRoute() method efficiently caches and responds to
 * requests for URLs in the manifest.
 * See https://goo.gl/S9QRab
 */
workbox_precaching_precacheAndRoute([
  {
    "url": "manifest.webmanifest",
    "revision": "0ed0aeb15ac379596a9e6a0caf957e79"
  },
  {
    "url": "logo.png",
    "revision": "5679e4d36e12b40d09b5b13685927b92"
  },
  {
    "url": "index.html",
    "revision": "458b9683ffaf7dbac3e9101d7a88f2ba"
  },
  {
    "url": "pwa/splash.png",
    "revision": "d0ec794fdbc29568df989f0e2536a531"
  },
  {
    "url": "pwa/splash-750x1334.png",
    "revision": "814456ea3529d519adb4704474964625"
  },
  {
    "url": "pwa/splash-640x1136.png",
    "revision": "e79b39fc2a0c39892ff5358686d5701f"
  },
  {
    "url": "pwa/splash-1284x2778.png",
    "revision": "d0ec794fdbc29568df989f0e2536a531"
  },
  {
    "url": "pwa/splash-1242x2208.png",
    "revision": "00e343f86f7041a0ef939ba77a279cd5"
  },
  {
    "url": "pwa/icon.png",
    "revision": "249ac82b46e38b553ed0c137d3b378ac"
  },
  {
    "url": "icons/icon-96x96.png",
    "revision": "dd6c8515d499ab2cd75f59a8997767cd"
  },
  {
    "url": "icons/icon-72x72.png",
    "revision": "5276546d8ca0b4d99797ac0e524a3705"
  },
  {
    "url": "icons/icon-512x512.png",
    "revision": "ef230407e8ea1af958691702d15ec79e"
  },
  {
    "url": "icons/icon-384x384.png",
    "revision": "9d41412ada0a02958ef183b909842907"
  },
  {
    "url": "icons/icon-192x192.png",
    "revision": "5679e4d36e12b40d09b5b13685927b92"
  },
  {
    "url": "icons/icon-152x152.png",
    "revision": "c6d28037b8d3dff365fb17e1b7693b13"
  },
  {
    "url": "icons/icon-144x144.png",
    "revision": "256318a164633f3d3ddb86e768acb1e4"
  },
  {
    "url": "icons/icon-128x128.png",
    "revision": "edac93a5afbf9c32438132298f4a6d17"
  },
  {
    "url": "icons/apple-touch-icon.png",
    "revision": "18eb21a925a88145ed7baddf3420c484"
  },
  {
    "url": "assets/workbox-window.prod.es5-BqEJf4Xk.js",
    "revision": null
  },
  {
    "url": "assets/index-DNyENHLK.css",
    "revision": null
  },
  {
    "url": "assets/index-Ca0Q1mMX.js",
    "revision": null
  },
  {
    "url": "logo.png",
    "revision": "5679e4d36e12b40d09b5b13685927b92"
  },
  {
    "url": "manifest.webmanifest",
    "revision": "0ed0aeb15ac379596a9e6a0caf957e79"
  },
  {
    "url": "icons/apple-touch-icon.png",
    "revision": "18eb21a925a88145ed7baddf3420c484"
  },
  {
    "url": "icons/icon-128x128.png",
    "revision": "edac93a5afbf9c32438132298f4a6d17"
  },
  {
    "url": "icons/icon-144x144.png",
    "revision": "256318a164633f3d3ddb86e768acb1e4"
  },
  {
    "url": "icons/icon-152x152.png",
    "revision": "c6d28037b8d3dff365fb17e1b7693b13"
  },
  {
    "url": "icons/icon-192x192.png",
    "revision": "5679e4d36e12b40d09b5b13685927b92"
  },
  {
    "url": "icons/icon-384x384.png",
    "revision": "9d41412ada0a02958ef183b909842907"
  },
  {
    "url": "icons/icon-512x512.png",
    "revision": "ef230407e8ea1af958691702d15ec79e"
  },
  {
    "url": "icons/icon-72x72.png",
    "revision": "5276546d8ca0b4d99797ac0e524a3705"
  },
  {
    "url": "icons/icon-96x96.png",
    "revision": "dd6c8515d499ab2cd75f59a8997767cd"
  },
  {
    "url": "pwa/icon.png",
    "revision": "249ac82b46e38b553ed0c137d3b378ac"
  },
  {
    "url": "pwa/splash-1242x2208.png",
    "revision": "00e343f86f7041a0ef939ba77a279cd5"
  },
  {
    "url": "pwa/splash-1284x2778.png",
    "revision": "d0ec794fdbc29568df989f0e2536a531"
  },
  {
    "url": "pwa/splash-640x1136.png",
    "revision": "e79b39fc2a0c39892ff5358686d5701f"
  },
  {
    "url": "pwa/splash-750x1334.png",
    "revision": "814456ea3529d519adb4704474964625"
  },
  {
    "url": "pwa/splash.png",
    "revision": "d0ec794fdbc29568df989f0e2536a531"
  }
], {});
workbox_precaching_cleanupOutdatedCaches();workbox_routing_registerRoute(new workbox_routing_NavigationRoute(workbox_precaching_createHandlerBoundToURL("/index.html"), {
    denylist: [/^\/api\//],}));
workbox_routing_registerRoute(({ url }) => url.pathname.startsWith("/auth/") || url.pathname.startsWith("/api/") || url.pathname.includes("/auth/"), new workbox_strategies_NetworkOnly({ "cacheName":"auth-and-api", plugins: [] }), 'GET');
workbox_routing_registerRoute(({ url }) => {
              const host = url.hostname;
              return host.includes("supabase.co") || host.includes("supabase.in") || url.pathname.includes("/rest/v1/");
            }, new workbox_strategies_NetworkFirst({ "cacheName":"supabase-api","networkTimeoutSeconds":10, plugins: [new workbox_expiration_ExpirationPlugin({ maxEntries: 50, maxAgeSeconds: 300 }), new workbox_cacheable_response_CacheableResponsePlugin({ statuses: [ 0, 200 ] })] }), 'GET');
workbox_routing_registerRoute(({ request }) => request.destination === "image", new workbox_strategies_StaleWhileRevalidate({ "cacheName":"images", plugins: [new workbox_expiration_ExpirationPlugin({ maxEntries: 60, maxAgeSeconds: 2592000 })] }), 'GET');
workbox_routing_registerRoute(({ request }) => request.destination === "style" || request.destination === "script" || request.destination === "worker", new workbox_strategies_StaleWhileRevalidate({ "cacheName":"static-resources", plugins: [] }), 'GET');


