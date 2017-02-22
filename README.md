# dbobject

Please look at the test cases to see usage.

```javascript
var MySQL = require('dbobject').MySQL,
    db = new MySQL('database', 'username', 'password', 'host')

db.connect().then(function(){
    var dbo = db.dbobject('tablename')
    return dbo.sarch({name: 'baz'})
}).then(function(result){
    console.log(result)
}).catch(function(err){
    console.log(err)
})
```

# ToDo
- PostgreSQL implementation
