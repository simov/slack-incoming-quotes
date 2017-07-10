#!/usr/bin/env node

var argv = require('minimist')(process.argv.slice(2))

if (argv.help) {
  console.log('--env environment')
  console.log('--config path/to/config.json')
  console.log('--db path/to/db.json')
  console.log('--quotes path/to/quotes.json')
  console.log('--next serial|random')
  console.log('--bot path/to/bot.json')
  process.exit()
}

;['config', 'db', 'quotes'].forEach((key) => {
  if (!argv[key]) {
    console.error(`Specify --${key} path/to/config.json`)
    process.exit()
  }
})

if (!argv.next) {
  console.error('Specify --next serial|random')
  process.exit()
}


var path = require('path')


var env = process.env.NODE_ENV || argv.env || 'development'
var config = require(path.resolve(process.cwd(), argv.config))[env]

var dbpath = path.resolve(process.cwd(), argv.db)
var db = require(dbpath)

var quotes = require(path.resolve(process.cwd(), argv.quotes))


var hook = require('../')

hook({
  env, config, db, dbpath, quotes,
  next: argv.next,
  bot: argv.bot ? require(path.resolve(process.cwd(), argv.bot)) : null
})
.then((responses) => {
  responses.forEach(([res, body]) => {
    console.log(new Date().toString(), res.statusCode, body)
  })
})
.catch((err) => console.error(new Date().toString(), err))
