
var argv = require('minimist')(process.argv.slice(2))

var fs = require('fs')
var path = require('path')
var request = require('@request/client')

var env, config, db, dbpath, quotes


var init = (args = {}) => (
  env = args.env || process.env.NODE_ENV || argv.env || 'development',

  config = (args.config || require(path.resolve(process.cwd(), argv.config)))[env],

  dbpath = !args.db && path.resolve(process.cwd(), argv.db),
  db = args.db || require(dbpath),

  quotes = args.quotes || require(path.resolve(process.cwd(), argv.quotes)),

  {env, config, db, dbpath, quotes}
)

var hooks = (config) =>
  [].concat(config)
    .map(({hook, username, icon_url, channel}) => [].concat(hook)
      .map((hook) => ({hook, username, icon_url, channel}))
      .reduce((all, hook) => all.concat(hook) || all, []))
    .reduce((all, hook) => all.concat(hook) || all, [])

var post = (quote) => Promise.all(
  hooks(config.slack).map((hook) => new Promise((resolve, reject) => {
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

var store = () => {
  db[env].index++
  fs.writeFileSync(dbpath, JSON.stringify(db, null, 2), 'utf8')
}

var check = () =>
  post(quotes[db[env].index]).then((responses) => (
    store(),
    responses
  ))

module.exports = {init, hooks, post, store, check}
