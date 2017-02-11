
const env = process.env.NODE_ENV || 'development'

var fs = require('fs')
var path = require('path')
var request = require('@request/client')

var config = require('../config/config')[env]
var quotes = require('../config/quotes')
var db = require('../config/db')
var dbpath = path.join(__dirname, '../config/db.json')
var index = db[env].index


var post = (quote) => Promise.all(
  [].concat(config.slack.hook).map((hook) => new Promise((resolve, reject) => {
    request({
      method: 'POST',
      url: hook,
      json: {
        username: config.slack.username,
        icon_url: config.slack.icon_url,
        channel: config.slack.channel,
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
  post(quotes[index]).then((responses) => (
    store(),
    responses
  ))

module.exports = {post, store, check}
