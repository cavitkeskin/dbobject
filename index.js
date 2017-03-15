'use strict';

/*

    usage
        - ()
        - initialize(dialect, credentials)
        - mysql(credentials)
        - postgresql(credentials)
        - instance()
        - clone()



*/

var instance = undefined;

class Helper {
    get instance(){
        return instance;
    }

    mysql(database, user, pass, host){
        var MySQL = require('./src/mysql')
        var db = new MySQL(database, user, pass, host)
        if(!instance) instance = db
        return db
    }

    postgresql(database, user, pass, host){
        var PostgreSQL = require('src/postgresql')
        var db = new MySQL(database, user, pass, host)
        if(!instance) instance = db
        return db
    }

    clone(){
        return instance.clone()
    }

    connect(){
        return instance.connect.apply(instance, arguments)
    }

    query(){
        return instance.query.apply(instance, arguments)
    }

    exec(){
        return instance.exec.apply(instance, arguments)
    }

    first(){
        return instance.first.apply(instance, arguments)
    }

    value(){
        return instance.value.apply(instance, arguments)
    }

    values(){
        return instance.values.apply(instance, arguments)
    }

    keyValue(){
        return instance.keyValue.apply(instance, arguments)
    }

    dbobject(){
        return instance.dbobject.apply(instance, arguments)
    }

    end(){
        return instance.end();
    }

}

module.exports = new Helper();
