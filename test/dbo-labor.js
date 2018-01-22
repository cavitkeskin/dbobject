var config = require('./config.json').mysql,
    db = require('../index').mysql(config.database, config.user, config.password, config.host);
    assert = require('assert'),
    expect = require('expect.js');

var dbo;

describe('mysql.dbobject', function(){
    before('connect', function(done){
        dbo = db.dbobject('labor')
        done()
        // db.connect().then(function(){
        //     dbo = db.dbobject('employee')
        //     done()
        // }).catch(done)
    })

    it('search', function(done){
        dbo.search().then(function(result){
            // console.log(result)
            expect(result).to.be.an('array')
            expect(result.length).to.eql(4)
            done()
        }).catch(done)
    })

    it('search({date:\'2017-01-03\'})', function(done){
        dbo.search({date: '2017-01-03'}).then(function(result){
            //console.log(result)
            expect(result).to.be.an('array')
            expect(result.length).to.eql(2)
            done()
        }).catch(done)
    })

    it('get(id)', function(done){
        dbo.get('3-20170103').then(function(result){
            expect(result).to.be.an('object')
            expect(result.id).to.eql('3-20170103')
            done()
        }).catch(done)
    })

    it('insert({})', function(done){
        var data = {name: 'Jeremy Renner'}
        dbo.insert(data).then(function(result){
            expect(result).to.be.an('object')
            expect(result.id).to.eql(4)
            expect(result.name).to.eql('Jeremy Renner')
            done()
        }).catch(done)
    })

    it('insert([])', function(done){
        var data = [{name: 'Dev Patel'}, {name: 'Nicole Kidman'}]
        dbo.insert(data).then(function(result){
            expect(result).to.be.an('array')
            expect(result.length).to.eql(2)
            expect(result[0].name).to.eql(data[0].name)
            expect(result[1].name).to.eql(data[1].name)
            done()
        }).catch(done)
    })

    it('update(id, data)', function(done){
        var id = 4,
            data = {name: 'Kate Beckinsale'}
        dbo.update(id, data).then(function(result){
            expect(result).to.be.an('object')
            expect(result.id).to.eql(id)
            expect(result.name).to.eql(data.name)
            done()
        }).catch(done)
    })

    it('delete(id)', function(done){
        var id = 4
        dbo.delete(id).then(function(result){
            expect(result).to.eql(true)
            return dbo.get(id)
        }).then(function(result){
            expect(result).to.eql(null)
            done()
        }).catch(done)
    })


})
