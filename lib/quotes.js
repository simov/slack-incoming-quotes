
const env = process.env.NODE_ENV || 'development'

var config = require('../config/')[env]
config.hook = process.env.HOOK || config.hook
var quotes = require('../config/quotes')

var fs = require('fs')
var path = require('path')
var db = require('../config/db')

var request = require('@request/client')
var current = db[env].quotes.index


function post () {
  request({
    method: 'POST',
    url: config.hook,
    json: {
      username: config.quotes.username,
      icon_url: config.quotes.icon_url,
      channel: config.quotes.channel,
      text: '> ' + quotes[current]
    },
    callback: (err, res, body) => {
      if (err) {
        console.error(new Date().toString(), err)
      }
      console.log(new Date().toString(), res.statusCode, body)
      current += 1
      db[env].quotes.index = current
      fs.writeFileSync(path.join(__dirname, '../config/db.json'),
        JSON.stringify(db, null, 2), 'utf8')
    }
  })
}


post()
