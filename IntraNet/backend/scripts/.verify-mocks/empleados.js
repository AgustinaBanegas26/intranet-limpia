//este achivo es para poder hacer pruebas de integración con supertest,
//  ya que si no se hace de esta manera, supertest no puede hacer las pruebas correctamente.
module.exports = {
  getMustChangePassword: async () => {
    if (global.__dbFail) throw new Error('DB connection failed')
    return false
  },
}
