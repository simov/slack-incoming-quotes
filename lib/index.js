
var fs = require('fs')
var request = require('@request/client')


var hooks = (config) =>
  [].concat(config)
    .map(({hook, username, icon_url, channel}) => [].concat(hook)
      .map((hook) => ({hook, username, icon_url, channel}))
      .reduce((all, hook) => all.concat(hook) || all, []))
    .reduce((all, hook) => all.concat(hook) || all, [])

var post = (hooks, quote) => Promise.all(
  hooks.map((hook) => new Promise((resolve, reject) => {
    request({
      method: 'POST',
      url: hook.hook,
      json: {
        username: hook.username,
        icon_url: hook.icon_url,
        channel: hook.channel,
        text: '> ' + quote
      },
      callback: (err, res, body) => (err ? reject(err) : resolve([res, body]))
    })
  }))
)

var store = (env, db, dbpath) => {
  db[env].index++
  fs.writeFileSync(dbpath, JSON.stringify(db, null, 2), 'utf8')
}

var hook = ({env, config, db, dbpath, quotes}) =>
  post(hooks(config.slack), quotes[db[env].index]).then((responses) => (
    store(env, db, dbpath),
    responses
  ))

module.exports = Object.assign(hook, {
  hooks, post, store
})
