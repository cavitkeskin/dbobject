'use strict';

var util = require('util'),
	_ = require('underscore'),
	md5 = require('md5');

let SecretKey = 'Aks739@jS#491'

class Database {

	constructor (database, user, pass, host){
		this.config = {
			database : database,
			user     : user,
			password : pass,
			host     : host,
			typeCast : true,
			dateStrings: 'date'
		};
	}

	first(sql, param){
		return this.query(sql, param).then(function(data){
			return _.first(data)
		})
	}

	/**
		return with first column of first row
	*/
	value(sql, param){
		return this.query(sql, param).then(function(data){
			return data ? _.first(_.values(data[0])) : null
		})
	}

	/**
		return an array with first columns of each records
	*/
	values(sql, param){
		return this.query(sql, param).then(function(data){
			return (data||[]).map(function(item){ return _.first(_.values(item)) })
		})
	}

	keyValue(sql, param){
		return this.query(sql, param).then(function(data){
			var result = {};
			_.each(data, function(item){
				var vals = _.values(item);
				var key = vals.shift();
				result[key] = vals.length == 1 ? vals[0] : item;
			})
			return result;
		})
	}

	encode(data, fields, map){
		if(typeof fields === 'string')
			fields = fields.split(',');

		if(typeof map === 'string')
			map = {id: map};

		if(Array.isArray(data)){
			_.each(data, function(item){
				this.encode(item, fields, map)
			}.bind(this))
			return data;
		} else if(data != null && typeof data === 'object'){
			_.each(_.pick(data, fields), function(val, key){
				data[key] = this.encode(val, _.has(map, key) ? map[key] : key) //md5([key=='id'?tablename:key,SecretKey,val].join('-'))+val
			}.bind(this))
			return data;
		} else {
			return data == null ? null : md5([fields[0], SecretKey, data].join('-'))+data
		}
	}

	decode(data, fields, map){
		if(typeof fields === 'string')
			fields = fields.split(',');

		if(typeof map === 'string')
			map = {id: map};

		if(Array.isArray(data)){
			_.each(data, function(item){
				this.decode(item, fields, map)
			}.bind(this))
			return data;
		} else if(data != null && typeof data === 'object'){
			_.each(_.pick(data, fields), function(val, key){
				data[key] = this.decode(val, _.has(map, key) ? map[key] : key); //key=='id'?tablename:key)
			}.bind(this))
			return data;
		} else {
			var t = String(data).match(/^([a-f0-9]{32})([\w-]+)/);
			if(!t) return null;
			return md5([fields[0], SecretKey, t[2]].join('-')) == t[1] ? t[2] : null
		}
	}

	selectSQL(SQL){
		if (typeof SQL === 'string') return SQL;
		var fields = [], tables = [], where = [];
		SQL = _.extend({field:[], table: [], where: [], order: [], limit: null, offset: null}, SQL);
		_.each(SQL.field, function(val, key){ fields.push(util.format('%s as %s',  val, this.identity(key))); }, this);
		_.each(SQL.table, function(val, key){ tables.push(val.split(' ').length == 1 ? util.format('%s as %s',  this.identity(val), key) : val); }, this);
		_.each(SQL.where, function(val){ where = where.concat(_.isArray(val) ? val : [val]); });

		var sql = "select\n\t" + fields.join(",\n\t") + "\nfrom " + tables.join("\n\t");
		if(where.length > 0) sql+= '\nwhere\n\t(' + where.join(') and\n\t(') + ')\n';
		if(SQL.order.length > 0) sql+= '\norder by ' + SQL.order.join(', ');
		if(SQL.limit) sql+=util.format('\nlimit %d', SQL.limit);
		if(SQL.offset) sql+=util.format('\noffset %d', SQL.offset);
		return sql;
	}
}

module.exports = Database;
