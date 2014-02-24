html-include
============

Process .html files as ejs templates from the document_root

## usage

Create a html-include handler for a folder full of .html files:

```js
var htmlinclude = require('html-include');

var app = express();

var includes = htmlinclude({

	// the root folder with our .html files
	document_root:__dirname + '/www',

	// allow '/contact' = '/contact.html'
	allowdirs:true,
})

// this registers the .html -> ejs template handler
includes.setup(app);

// we can fill in page specific template variables here
includes.on('page', function(filepath, vars){
	if(filepath.match(/\/contact/){
		vars.title = 'Contact Page';
	}
})

// your application routes
app.get('/my/app/etc', function(req, res, next){

})

// mount the actual file server
app.use(includes.serve)
```

Inside each .html file we can use the 'include' function for things like headers and footers:

## index.html

```html
<% include header.html %>

This is the index page

<% include footer.html %>
```

## header.html

```html
<html>
	<head>
		<title><%= pagetitle %></title>
	</head>
<body>
```

## footer.html

```html
</body>
</html>
```

## page events

each time a template is rendered - the 'page' event is fired with the originating request and a vars object to be populated:

```js
includes.on('page', function(filepath, vars){
	if(filepath.match(/\/contact/){
		vars.title = 'Contact Page';
	}
	else if(filepath.match(/\/shop/){
		vars.title = 'Shop Page';
	}
})
```

## render

you can call the render method from elsewhere in your logic:

```js
app.get('/mypath', function(req, res, next){
	if(req.params.flag){
		includes.render('/myflag.html', {
			flag:true
		})
	}
	else{
		next();
	}
})
```

## license

MIT