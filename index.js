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

var instance = null;

class Helper {
    get instance(){
        return instance;
    }

    mysql(database, user, pass, host){
        var MySQL = require('./src/mysql.js')
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

/*
    # initialize (setting up application)
    var DB = require('dbobject');
    var db = DB.mysql(...)
    -- or --
    var db = require('dbobject').mysql(...);

    # get db instance anywhere
    var db = require('dbobject').instance;

    # when you need to new connection
    var db = require('dbobject').clone()

    # when you need to get new instance
    var db = require('dbobject').mysql(...)

    # dbobject methods
    property instance
    function mysql(...)
    function postgresql(...)
    function clone(...)

    # inherited from instance
    function query()
    function exec()
    function first()
    function value()
    function values()
    function keyValue()
    function dbobject()

    # entity
    var dbo = require('dbobject').dbobject(tablename)
    -- or --
    var dbo = require('dbobject').instance.dbobject(tablename)

    # entity methods
    dbo.select()
    dbo.insert()
    dbo.update()
    dbo.delete()



*/

module.exports = new Helper();
