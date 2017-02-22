/*
	DBObject bir tablo icin sql yazma surecini kisaltmayi amaclar.

	Example usage
		var dbo = new DBObject(tablename, database);

		dbo.select(params, callbak)
		dbo.get(id, callback)
		dbo.insert(data, callback)
		dbo.update(id, data, callback)
		dbo.save(data, callback)
		dbo.delete(id, callback)
*/

'use strict';

var util = require('util'),
    _ = require('underscore'),
	md5 = require('md5'),
	moment = require('moment'),
	debug = require('debug')('lib:dbobject');

class DBObject{
	constructor (tablename, database, options){
		this.options = _.extend({pick: [], omit: []}, options||{})
		if(typeof this.options.pick === 'string') this.options.pick = this.options.pick.split(',')
		if(typeof this.options.omit === 'string') this.options.omit = this.options.omit.split(',')
		this.db = database
		this.tablename = tablename
		this.viewname = null
		this.keyfields = null
		this.fields = null
		this.hiddenfields = []
		//debug('DBObject options', this.options)
	}

	initialize(){
		return Promise.all([this.db.getTableInfo(this.tablename), this.db.getTableInfo(this.tablename+'_view')]).then(function(result){
			if(_.keys(result[1]).length) this.viewname = this.tablename+'_view';
			this.fields = _.mapObject(result[1], function(f, name){ return f['readonly'] = true, f['hide'] = false, f; })
			_.extend(this.fields, _.mapObject(result[0], function(f, name){ return f['readonly'] = false, f['hide'] = false, f; }) )
			this.keyfields = _.pluck(_.select(this.fields, function(item){ return item.primary; }), 'name');
			if(!this.options.pick.length) this.options.pick = _.keys(this.fields)
			return this.fields;
		}.bind(this))
	}

	hide(fields){
		this.hiddenfields = fields.split(',');
	}

	encode(data, fields){
		if(!fields)
			fields = 'id,' + _.filter(this.fields, function(f){ return f.type == 'int'}).map(function(f){ return f.name}).join(',')
		return this.db.encode(data, fields, this.tablename)
	}

	decode(data, fields){
		if(!fields){
			fields = _.filter(this.fields, function(f){ return f.type == 'int'}).map(function(f){ return f.name})
			fields.indexOf('id') >= 0 || fields.unshift('id')
		}
		this.db.decode(data, fields, this.tablename)
	}

	where_object(key, param, field){
		//debug('where_object', key, param, field)
		// distribute param values
		for(var i = 0; i < param[key].value.length; i++)
			//param[key+'_'+i] = param[key].value[i]
			param[key+'_'+i] = param[key+'_'+i] = this.formatter(param[key].value[i], field.type)

		switch(param[key].op){
			case 'between':
				var w = []
				param[key+'_0'] && w.push(util.format('T.%s >= :%s_0', key, key))
				param[key+'_1'] && w.push(util.format('T.%s <= :%s_1', key, key))
				return w.join(' and ')
				break;
			case 'in':
				for(var i = 0; i < param[key].value.length; i++)
					param[key+'_'+i] = param[key].value[i]

				return util.format('T.%s in [%s]', key, _.map(_.range(0, param[key].value.length), function(val){ return ':'+key+'_'+val}).join(', '))
				break;
            case '>':
            case '>=':
                var sql = util.format('T.%s %s :%s', key, param[key].op, key)
                return param[key] = param[key].value, sql
		}
	}

	where_array(key, param, field){
		param[key] = {op: param[key].length == 2 ? 'between' : 'in', value: param[key]}
		return this.where_object(key, param, field)
	}

	formatter(value, type){
		switch(type){
			case 'date':
			case 'datetime':
				return value ? moment(value).format('YYYY-MM-DD') : value
				break;
			default:
				return value
		}
	}

	// ---==[ SELECT ]==---
	selectSQL(param, options){
		var db = this.db
		//options = _.extend({fields: _.keys(this.fields)}, options);
		options = _.defaults(options||{}, this.options)

		var sql = {field: {}, table: {}, where: {}, limit: 100, offset: 0};

		if(this.keyfields.join(',') != 'id')
			sql['field']['id'] = util.format("concat_ws('-', %s)", _.map(this.keyfields, function(field){ return 't.'+field; }).join(', '));

		_.each(_.difference(options.pick, options.omit), function(field){
			sql['field'][field] = 't.'+field;
		});

/*
		_.each(_.difference(_.intersection(options.fields, _.keys(this.fields)), this.hiddenfields), function(field){
			sql['field'][field] = 't.'+field;
		});
*/

		sql['table']['t'] = this.db.identify(this.viewname || this.tablename) + ' as t';

		// gelen butun parametreler isleme girer, eger parametrelerde bir temizlik yapilacak ise api servislerinde yapilmali
		_.each(param, function(val, key){
			switch(key){
				case 'que':
					var ques = [];
					_.each(this.fields, function(field, name){
						if(field.type == 'varchar')
							ques.push(util.format('t.%s %s :que', field.name, db.iLike));
					})
					sql.where['que'] = ques.join(' or ');
					param.que = util.format('%%%s%%', val.trim());
					break;
				default:
					var field = this.fields[key];
					if(!field) break;

					if(Array.isArray(val))
						sql.where[key] = this.where_array(key, param, field)
					else if(typeof val === 'object' && val !== null)
						sql.where[key] = this.where_object(key, param, field)
					else if(val === null)
						sql.where[key] = util.format('t.%s is null', key);
					else
						switch(field.type){
							case 'varchar':
							case 'text':
								sql.where[key] = util.format('t.%s %s :%s', key, db.iLike, key);
								param[key] = util.format('%%%s%%', val)
								break;
							case 'int':
								sql.where[key] = util.format('t.%s = :%s', key, key);
								param[key] = this.formatter(val, field.type)
								break;
							case 'date':
							case 'datetime':
								sql.where[key] = util.format('t.%s = :%s', key, key);
								param[key] = this.formatter(val, field.type)
								break;
							default:
								debug('uncougtch data type:', field.name, field.type)
								sql.where[key] = util.format('t.%s = :%s', key, key);
						}
					break;
			}
		}, this)

		// apply options
		_.each(options, function(val, key){
			switch (key) {
				case 'order':
					sql['order'] = [];
					_.each(val.split(','), function(f){
						sql.order.push( (f.indexOf('.')>-1?'':'t.') + f.trim());
					});
					break;
				case 'limit':
					sql['limit'] = val;
					break;
				case 'offset':
					sql['offset'] = val;
					break;
			}
		});
        debug('SelectSQL', sql, param)
		return {sql: sql, param: param}
	}

	select(param, options){
		return this
			.initialize()
			.then(this.selectSQL.bind(this, param, options))
			.then(function(result){
				return this.db.query(result.sql, result.param)
			}.bind(this))
	}

	search(param, options){
		return this.select(param, options)
	}

	// ---==[ GET ]==---
	getSQL(id){
		var sql = {field: {}, table: {}, where: {}};
		if(this.keyfields.join(',') != 'id')
			sql['field']['id'] = util.format("concat_ws('-', %s)", _.map(this.keyfields, function(field){ return 't.'+field; }).join(', '));

		_.each(_.difference(_.keys(this.fields), this.hiddenfields), function(field){
			sql['field'][field] = 't.'+field;
		});

		sql['table']['t'] = this.db.identify(this.viewname || this.tablename) + ' as t';

		var param = _.object(this.keyfields, String(id).split('-'));
		sql['where'] = _.map(this.keyfields, function(name){ return 't.'+name+' = :'+name});

		return {sql: sql, param: param}
	}

	get(id){
		var db = this.db;
		return this.initialize()
			.then(this.getSQL.bind(this, id))
			.then(function(result){ return db.query(result.sql, result.param) })
			.then(function(data){ return data[0] || null })
	}

	// ---==[ INSERT ]==---
	insertSQL(values){
		var db = this.db,
			fields = _.intersection(
				_.keys(values),
				_.keys(_.pick(this.fields, function(f, name){ return !(f.autoincrement || f.readonly)}))
			);
		var param = _.mapObject(_.pick(values, fields), function(val){ return val === '' ? null : val});

		var sql = util.format(
			'INSERT INTO %s (%s) values(%s)',
			db.identify(this.tablename),
			_.map(fields, function(key){ return db.identify(key)}).join(', '),
			_.map(fields, function(key){
				var field = this.fields[key]
				switch(field.type){
					case 'timestamp':
						if(param[key] == 'current_timestamp')
							return 'current_timestamp'
						else
							return ':'+key
						break;
					default:
						return ':'+key
				}
			}.bind(this)).join(', ')
		)

		if(db.Provider == 'PgSQL'){
			sql += ' RETURNING ' + _.map(this.keyfields, function(key){ return db.identify(key)}).join(', ')
		}

		return {sql: sql, param: param}
	}

	insert(values){
		var db = this.db
		if(Array.isArray(values)){
			var promises = values.map( this.insert.bind(this) )
			return Promise.all(promises)
		}

		return this.initialize()
			.then(this.insertSQL.bind(this, values))
			.then(function(result){ return db.exec(result.sql, result.param) })
			.then(function(res){
				if(this.db.Provider == 'PgSQL'){
					var id = _.values(res.result[0]).join('-');
				} else {
					var id = res.insertId ? res.insertId :  _.values(_.pick(values, this.keyfields)).join('-')
				}
				return this.get(id)
			}.bind(this))
	}

	// ---==[ UPDATE ]==---
	updateSQL(id, values){
		var db = this.db;

		// requested fields
		var	fields = _.intersection(
				_.keys(values),
				_.keys(_.pick(this.fields, function(f, name){ return !(f.autoincrement || f.readonly)}))
			);
		// update params
		var param = _.mapObject(_.pick(values, fields), function(val){ return val === '' ? null : val});
		_.extend(param, _.object(_.map(this.keyfields, function(key){return 'key_'+key}), String(id).split('-')))

		// build update sql
		var sql = util.format(
			'update %s set %s',
			db.identify(this.tablename),
			_.map(fields, function(key){
				var field = this.fields[key]
				switch(field.type){
					case 'timestamp':
						if(param[key] == 'current_timestamp')
							return util.format('%s = %s', db.identify(key), 'current_timestamp')
						else
							return util.format('%s = :%s', db.identify(key), key)
						break;
					default:
						//debug(field.type)
						return util.format('%s = :%s', db.identify(key), key)
				}

			}.bind(this)).join(', ')
		)

		// add where clause
		sql += util.format(' where %s', _.map(this.keyfields, function(key){ return util.format('%s = :key_%s', db.identify(key), key)}).join(' and '));
		//debug(['UPDATE', sql, param])
		return {sql: sql, param: param}
	}

	update(id, values){
		var db = this.db

		return this
			.initialize()
			.then(this.updateSQL.bind(this, id, values))
			.then(function(result){ return db.exec(result.sql, result.param) })
			.then(function(result){
				return this.get(id)
			}.bind(this))
	}

	// ---==[ DELETE ]==---
	delete(id){
		var db = this.db

		return this.initialize()
			.then(function(){
				var param = _.object(this.keyfields, String(id).split('-')),
					sql = util.format('delete from %s WHERE %s ',
						db.identify(this.tablename),
						_.map(_.keys(param), function(key){ return util.format('%s = :%s', db.identify(key), key)}).join(' and ')
					)
				return this.db.exec(sql, param).then(function(res){ return res.affectedRows ? true : false })
			}.bind(this))
	}

	// ---==[ SAVE ]==---
	save(data){
		if(Array.isArray(data)){
			var promises = data.map(function(item){ return this.save(item) }.bind(this))
			return Promise.all(promises)
		}

		return new Promise(function(resolve, reject){
			this.initialize()
				.then(function(){
					// find record id
					return _.values(_.pick(data, this.keyfields)).join('-')
				}.bind(this))
				.then(this.get.bind(this))
				.then(function(rec){
					var id = _.values(_.pick(data, this.keyfields)).join('-')
					return rec ? this.update(id, data) : this.insert(data)
				}.bind(this))
				.then(resolve)
				.catch(reject)
		}.bind(this))
	}
};

module.exports = DBObject;
