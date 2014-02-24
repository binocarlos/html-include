/*
  Module dependencies.
*/

var ecstatic = require('ecstatic');
var path = require('path');
var ejs = require('ejs');
var fs = require('fs');
var url = require('url');
var EventEmitter = require('events').EventEmitter;

module.exports = function(options){

	options = options || {};

	var document_root = options.document_root;
	var basevars = options.vars || {};
	var priority = options.priority || 'pages';
	var directoryindex = options.directoryindex || 'index.html';

	var api = new EventEmitter();

	if(!fs.existsSync(document_root)){
		throw new Error('document_root does not exist: ' + document_root);
	}

	var fileserver = ecstatic({
		root:path.normalize(document_root)
	})

	function merge(obj1, obj2){
		var ret = {};
		for (var attrname in obj1) { ret[attrname] = obj1[attrname]; }
		for (var attrname in obj2) { ret[attrname] = obj2[attrname]; }
		return ret;
	}

	function get_vars(vars){
		vars = vars || {};
		var ret = merge(basevars, vars);
		return ret;
	}

	function render_view(filepath, vars, done){
		if(!api.app){
			return done('no app registered to render templates', 500);	
		}
		vars = get_vars(vars);

		function dorender(error){
			if(error){
				return done(error);
			}
			api.app.render(path.normalize(document_root + filepath), vars, done);
		}

		api.emit('page', filepath, vars, dorender);

		if(!vars._async){
			dorender();
		}
	}

	function render_html_page(filepath, vars, done){

		if(!filepath.match(/\.\w+$/)){
			if(priority=='page'){
				if(filepath.charAt(filepath.length-1)=='/'){
					filepath += 'index';
				}
				
				filepath += '.html';
			}
			else{
				if(!filepath.charAt(filepath.length-1)=='/'){
					filepath += '/';
				}

				filepath += directoryindex;
			}
		}

		fs.stat(path.normalize(document_root + filepath), function(error, stat){
			if(!error && stat){
				render_view(filepath, vars, done);
			}
			else{
				done('page not found', 404);
			}
		})	
	}

	function render_request(req, res){
		var vars = req.query || {};
		render_html_page(url.parse(req.url).pathname, vars, function(error, result){
			if(error){
				res.statusCode = result;
				res.end(error.toString());
				return;
			}
			res.send(result);
		})
	}

	// the handler function - checks for local files and serves template if no file
	api.serve = function(req, res, next){
		var path = url.parse(req.url).pathname;
		if(path.match(/\.html?$/) || !path.match(/\.\w+$/)){
			render_request(req, res);
		}
		else{
			fileserver(req, res, function(){
				render_request(req, res);
			});
		}
	}

	api.render = render_html_page;

	api.setup = function(app){
		app.engine('.html', require('ejs').__express);
		app.set('views', document_root);
		app.set('view engine', 'html');

		api.app = app;
	}

	return api;
}