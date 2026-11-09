// Endpoint de diagnóstico del despliegue serverless: confirma que la función responde.
module.exports = (req, res) => {
  res.status(200).json({
    ok: true,
    message: "Vercel funciona"
  });
};
