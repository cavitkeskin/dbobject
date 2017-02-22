# dbobject

### initialize

you need to initialize this module with calling mysql or postgresql methods

```javascript
    var db = require('dbobject');

    // initialize for mysql
    db.mysql('database', 'username', 'password', 'host');
    // initialize for postgresql
    db.postgresql('database', 'username', 'password', 'host');

```

### call anywhere

just require dbobject when you need to reach database

```javascript
    var db = require('dbobject')
```

### methods
- mysql(database, user, pass, host)
- postgresql(database, user, pass, host)
- query(sql, options)
- exec(sql, options)
- first(sql, options)
- value(sql, options)
- values(sql, options)
- keyValue(sql, options)
- dbobject(tablename, options)
- end()

### dbobject methods
- select(query, options)
- insert(values)
- update(id, values)
- delete(id)

## Usage

sample usage for database queries

```javascript
var db = require('dbobject')

// initialize
db.mysql('database', 'username', 'password', 'host')

db.query('select * from employee').then(function(result){
    console.log(result)
}).catch(function(err){
    console.log(err)
}).then(function(){
    db.end()
})
```

sample usage with dbobject (simplified crud functions for api services)

```javascript
var db = require('dbobject')

db.mysql('database', 'username', 'password', 'host')

var dbo = db.dbobject('tablename')

dbo.search({title: 'manager'}).then(function(result){
    console.log(result)
}).catch(function(err){
    console.log(err)
})
```

sample nodejs/express module for api usage  

```javascript
var express = require('express'),
    router = express.Router(),
    db = require(dbobject),
    dbo = db.dbobject('article')

router.get('/', (req, res, next) => {
	dbo.search(req.query).then(function(result){
		res.json(result)
	}).catch(next)
})

router.get('/:id', (req, res, next) => {
	dbo.search(req.params.id).then(function(result){
		res.json(result)
	}).catch(next)
})

router.post('/', (req, res, next) => {
	dbo.insert(req.body).then(function(result){
		res.json(result)
	}).catch(next)
})

router.put('/id', (req, res, next) => {
	dbo.update(req.params.id, req.body).then(function(result){
		res.json(result)
	}).catch(next)
})

router.delete('/id', (req, res, next) => {
	dbo.delete(req.params.id).then(function(result){
		res.json(result)
	}).catch(next)
})

module.exports = router;

```

# ToDo
- PostgreSQL implementation
