
module.exports = {
  getMustChangePassword: async () => {
    if (global.__dbFail) throw new Error('DB connection failed')
    return false
  },
}
