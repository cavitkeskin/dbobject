'use strict';

var mysql = require('mysql'),
    _ = require('underscore'),
    util = require('util'),
	Database = require('./database'),
    debug = require('debug')('dbobject:mysql'),
	error = require('debug')('dbobject:error'),
	tables = [];

class MySQL extends Database {

	constructor (database, user, pass, host){
		super(database, user, pass, host);
        this.initialize();
	}

    initialize(){
        this.conn = mysql.createConnection(this.config);

		this.conn.config.queryFormat = function (query, values) {
			if (!values) return query;
			return query.replace(/\:(\w+)/g, function (txt, key) {
				if (values.hasOwnProperty(key)) {
					return this.escape(values[key]);
				}
				return txt;
			}.bind(this));
		};

		this.conn.on('error', _.bind(function(err){
			//  { [Error: Connection lost: The server closed the connection.] fatal: true, code: 'PROTOCOL_CONNECTION_LOST' }
			if(!err.fatal) return;
			if(err.code != 'PROTOCOL_CONNECTION_LOST')
				throw err;

			error('MYSQL ReConnecting on lost connection', err.stack);
			this.conn = null;
			this.connect();
		}, this));
    }

	get Provider(){ return 'MySQL'; }

	identify(val){
		return '`'+val+'`';
	}

	get iLike(){ return 'like'; }

	connect(callback){
        var self = this;
        return new Promise(function(resolve, reject){
            self.conn.connect(function(err){
                return err ? reject(err) : resolve()
            });
        })
	}

	static escape(val){
		return val;
	}

	query(sql, param){
		debug('MySQL.query(sql, param)', sql, param)
		if(typeof sql === 'object') sql = this.selectSQL(sql)

		return new Promise(function(resolve, reject){
			this.conn.query(sql, param, function(err, data){
				if(err){
					error('SQL ERROR', err.message, sql, param);
					return reject(err)
				}
				resolve(data);
			})
		}.bind(this))
	}

	exec(sql, param){
		debug('MySQL.exec(sql, param)', sql, param)

        if(Array.isArray(param)){
            var que = param.map(function(p){ return this.exec(sql, p)}.bind(this))
            return Promise.all(que).then(function(result){
                var r = result[0];
                var n = result.reduce(function(p, i){ return parseInt(i.affectedRows) + p }, 0)
                return r.affectedRows = n, r
            })
        }

		return this.query(sql, param).then(function(data){
			return _.extend({affectedRows: 0, result: null}, data)
		})
	}

	getTableInfo(tablename, callback, context){
		if(typeof tables[tablename] !== 'undefined')
			return Promise.resolve(tables[tablename]);

		var sql = "\
			SELECT \n\
				column_name as name, \n\
				data_type as type, \n\
				is_nullable='YES' as nullable, \n\
				column_default as 'default', \n\
				character_maximum_length as 'length', \n\
				column_key like '%%PRI%%' as 'primary', \n\
				extra = 'auto_increment' as autoincrement, \n\
				false as readonly \n\
			FROM information_schema.columns \n\
			where table_schema=:schemaname and table_name=:tablename \n\
			order by ordinal_position;";

		return this.keyValue(sql, {schemaname: this.conn.config.database, tablename: tablename}).then(function(data){
			tables[tablename] = data;

			return tables[tablename];
		});
	}

	selectSQL(SQL){

		if (typeof SQL === 'string') return SQL;
		var fields = [], tables = [], where = [];
		SQL = _.extend({field:[], table: [], where: [], order: [], limit: null, offset: null}, SQL);
		_.each(SQL.field, function(val, key){ fields.push(util.format('%s as `%s`',  val, key)); });
		//_.each(SQL.table, function(val, key){ tables.push(util.format('%s as %s',  val.split(' ').length == 1 ? TMySQL.identity(val) : val, key)); });
		_.each(SQL.table, function(val, key){ tables.push( val.split(' ').length == 1 ? util.format('`%s` as %s',  val, key) : val )} );
		_.each(_.omit(SQL.where, function(val){ return !val}), function(val){ where = where.concat(_.isArray(val) ? val : [val]); });
		//if(SQL.order)

		var sql = "select\n\t" + fields.join(",\n\t") + "\nfrom " + tables.join("\n\t");
		if(where.length > 0) sql+= '\nwhere\n\t(' + where.join(') and\n\t(') + ')\n';
		if(SQL.order.length > 0) sql+= '\norder by ' + SQL.order.join(', ');
		if(SQL.limit) sql+=util.format('\nlimit %d', SQL.limit);
		if(SQL.offset) sql+=util.format('\noffset %d', SQL.offset);

		return sql;
	}

	end(callback){
        var self = this;
        return new Promise(function(resolve, reject){
            self.conn.end(function(err){
                return err ? reject(err) : resolve()
            })
        })
	}

}

module.exports = MySQL;
