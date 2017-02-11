
var hook = require('../')

hook.check()
  .then((responses) => responses && responses.forEach(([res, body]) =>
    console.log(new Date().toString(), res.statusCode, body)
  ))
  .catch((err) =>
    console.error(new Date().toString(), err))
