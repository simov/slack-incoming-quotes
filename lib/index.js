
var fs = require('fs')
var request = require('@request/client')


var error = (res, body) => [
  res.statusCode,
  res.statusMessage,
  typeof body === 'object' ? JSON.stringify(body) : body
].join(' ')

var hooks = (config) =>
  [].concat(config)
    .map(({hook, username, icon_url, channel}) => [].concat(hook)
      .map((hook) => ({hook, username, icon_url, channel}))
      .reduce((all, hook) => all.concat(hook) || all, []))
    .reduce((all, hook) => all.concat(hook) || all, [])

var post = (hooks, quote, bot) => Promise.all(
  hooks.map((hook) => new Promise((resolve, reject) => {
    request({
      method: 'POST',
      url: hook.hook,
      json: {
        username: hook.username === '[NAME]' ? bot.username : hook.username,
        icon_url: hook.icon_url === '[IMAGE]' ? bot.icon_url : hook.icon_url,
        channel: hook.channel,
        text: '> ' + quote
      },
      callback: (err, res, body) => (
        err ? reject(err) :
        res.statusCode !== 200 ? reject(new Error(error(res, body))) :
        resolve([res, body])
      )
    })
  }))
)

var random = (min, max) =>
  Math.floor(Math.random() * (max - min)) + min

var pick = {
  serial: (quotes, index) => (
    index = (index >= quotes.length) ? 0 : index,
    {index, text: quotes[index]}
  ),

  random: (quotes, indexes) => (
    indexes = (indexes.length === quotes.length) ? [] : indexes,
    quotes
      .map((quote, index) => ({index, text: quote}))
      .filter((quote, index) => !indexes.includes(index))
      [random(0, quotes.length - indexes.length)]
  )
}

var store = (db, env, dbpath, next, index) => {
  if (next === 'serial') {
    db[env].serial = index + 1
  }
  else if (next === 'random') {
    db[env].random.push(index)
  }

  fs.writeFileSync(dbpath, JSON.stringify(db, null, 2), 'utf8')
}

var send = ({env, config, db, dbpath, quotes, next, bot}) =>
  (
    (
      quote =
        pick[next](quotes, db[env][next])
    ) =>
    post(
      hooks(config.slack),
      quote.text,
      bot ? bot[random(0, bot.length - 1)] : null
    )
    .then((responses) => (
      store(db, env, dbpath, next, quote.index),
      responses
    ))
  )()


module.exports = Object.assign(send, {
  error, hooks, post, store, send
})
