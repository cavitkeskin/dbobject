
var config = require('./config.json').mysql,
    MySQL = require('../index').MySQL,
    assert = require('assert'),
    expect = require('expect.js');

var db;

describe('mysql', function(){
    before('connect', function(done){
        db = new MySQL(config.storage, config.username, config.password, config.host);
        db.connect().then(function(){
            done()
        }).catch(done)
    })

    before('drop tables lobor', function(done){
        db.exec('drop table if exists labor;').then(function(result){
            done();
        }).catch(done)
    })

    before('drop tables employee', function(done){
        db.exec('drop table if exists employee;').then(function(result){
            done();
        }).catch(done)
    })

    it('create table employee', function(done){
        var sql = [ 'create table employee (',
                        'id integer not null auto_increment,',
                        'name varchar(48),',
                        'created_at datetime not null default current_timestamp,',
                        'primary key(id)',
                    ');'].join('\n');
        db.exec(sql).then(function(result){
            done()
        }).catch(done);
    })

    it('insert data', function(done){
        db.exec('insert into employee (name) values(:name)', {name: 'Tom Cruise'}).then(function(result){
            done()
        }).catch(done)
    })

    it('insert data multiple', function(done){
        var data = [{name: 'Robin Williams'}, {name: 'Matt Damon'}]
        db.exec('insert into employee (name) values(:name);', data).then(function(result){
            done()
        }).catch(done)
    })

    it('query', function(done){
        db.query('select * from employee order by id;').then(function(result){
            expect(result).to.be.an('array')
            expect(result.length).to.eql(3)
            done()
        }).catch(done)
    })

    it('first', function(done){
        db.first('select id, name from employee order by id;').then(function(result){
            expect(result).to.be.an('object')
            expect(result).to.only.have.keys('id', 'name')
            expect(result).to.eql({id: 1, name: 'Tom Cruise'})
            done()
        }).catch(done)
    })

    it('value', function(done){
        db.value('select name from employee where id > 1 order by id').then(function(result){
            expect(result).to.eql('Robin Williams');
            done();
        }).catch(done);
    })

    it('values', function(done){
        db.values('select id from employee where id > 1 order by id').then(function(result){
            expect(result).to.eql([2, 3]);
            done();
        }).catch(done);
    })

    it('keyValue', function(done){
        db.keyValue('select name, id*id*id from employee where id > 1 order by id').then(function(result){
            expect(result).to.eql({'Robin Williams': 8, 'Matt Damon': 27})
            done();
        }).catch(done);
    })

    it('keyValue for more than 2 columns', function(done){
        db.keyValue('select name, id, created_at from employee where id > 1 order by id').then(function(result){
            expect(result).to.only.have.keys('Robin Williams', 'Matt Damon')
            expect(result['Robin Williams']).to.only.have.keys('id', 'name', 'created_at')
            done();
        }).catch(done);
    })

    it('create labor', function(done){
        var sql = [ 'create table labor (',
                        'employee int not null,',
                        'date date not null,',
                        'hours real not null,',
                        'rate real not null,',
                        'primary key(employee, date),',
                        'foreign key(employee) references employee(id)',
                    ');'].join('\n')
        db.exec(sql).then(function(result){
            done()
        }).catch(done)
    })

    it('exec multiple', function(done){
        var data = [
            {employee: 1, date: '2017-01-01', hours: 3.5, rate: 8.25},
            {employee: 1, date: '2017-01-02', hours: 5, rate: 8.70},
            {employee: 2, date: '2017-01-03', hours: 3.5, rate: 9.99},
            {employee: 3, date: '2017-01-03', hours: 1, rate: 13.5}
        ]
        db.exec('insert into labor (employee, date, hours, rate) values(:employee, :date, :hours, :rate);', data).then(function(result){
            expect(result.affectedRows).to.eql(4)
            done()
        }).catch(done)
    })

    after('end', function(done){
        db.end().then(function(){
            done();
        }).catch(done);
    })
})
