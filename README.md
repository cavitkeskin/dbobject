# dbobject

Please look at the test cases to see usage.

        var db = require('dbobject').MySQL
        db.connect('database', 'username', 'password', 'host').then(function(){
          var dbo = db.dbobject('tablename')
          return dbo.sarch({name: 'baz'})
        }).then(function(result){
          console.log(result)
        })


# ToDo
- PostgreSQL implementation
