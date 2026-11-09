// Exporta la aplicación Express para que Supertest y los adaptadores de despliegue puedan invocarla sin abrir un puerto.
const app = require('../src/index')

module.exports = app
