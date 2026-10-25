//este achivo es para poder hacer pruebas de integración con supertest,
//  ya que si no se hace de esta manera, supertest no puede hacer las pruebas correctamente.
let state = null
module.exports = {
  __setState(s) { state = s },
  __wasUpdated() { return state?.updateCalled },
  from(table) {
    if (table === 'empleados') {
      return {
        select() {
          return {
            in() {
              return Promise.resolve({
                data: [{ id: 1, nombre: 'Test', apellido: 'User', email_corporativo: 't@t.com', area: null, sucursal: null, cargo: null, legajo: null }],
                error: null,
              })
            },
          }
        },
      }
    }
    return {
      select() {
        return {
          eq() {
            return {
              async maybeSingle() {
                return { data: state.existing, error: null }
              },
            }
          },
        }
      },
      update() {
        return {
          eq() {
            return {
              select() {
                return {
                  async maybeSingle() {
                    state.updateCalled = true
                    return { data: { ...state.existing, estado: state.targetEstado }, error: null }
                  },
                }
              },
            }
          },
        }
      },
    }
  },
}
