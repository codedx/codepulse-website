var handlebars = require('handlebars'),
	fs = require('fs'),
	rmrf = require('rimraf'),
	mkdirp = require('mkdirp'),
	ncp = require('ncp').ncp,
	path = require('path'),
	templateManifest = require('./templates/manifest'),
	baseTemplatePath = './templates',
	baseDistPath = './dist',
	templates = {},
	faqData = require('./data/faqs'),
	urlData = require('./data/urls')

// generate handlebars templates from the templateManifest,
// and register each one as partials
;(function(){
	var key, relPath, templatePath, source

	for(key in templateManifest){
		relPath = templateManifest[key]
		templatePath = path.join(baseTemplatePath, relPath)
		source = fs.readFileSync(templatePath, 'utf-8')
		templates[key] = handlebars.compile(source)
		handlebars.registerPartial(key, templates[key])
	}
})()

// transform the faq.json answers into handlebar templates
;(function(){
	for(var key in faqData){
		var qa = faqData[key], answer = qa.answer
		if(typeof answer == 'string'){
			qa.answer = handlebars.compile(answer)
		} else if(Array.isArray(answer)){
			qa.answer = answer.map(function(a){
				return handlebars.compile(a)
			})
		}
	}
})()

// Enable {{#wrap with='templateKey'}} in templates.
// The wrapper must embed {{{__wrapped_content}}} for this to work.
handlebars.registerHelper('wrap', function(options){

	// render the wrapped template first..
	var wrappedContent = options.fn(this)
	var wrapperTemplate = templates[options.hash['with']]

	// ...then call the wrapper, using the wrapped template's
	// output as the input to __wrapped_content
	var data = options.data.root
	data['__wrapped_content'] = wrappedContent
	return wrapperTemplate(data)
})

function getUrl(name) {
	return urlData[name] || '#todo'
}

// creates <a target="_blank" href="...">{{...}}</a>
// where the href is based on a mapping from urls.json
handlebars.registerHelper('link', function(context, options){
	var url = getUrl(context)

	var attribs = {
		target: '_blank'
	}

	for(var key in options.hash){
		attribs[key] = options.hash[key]
	}

	var s = "<a href=\"" + url + "\""

	for(var key in attribs){
		s += ' '
		s += key
		s += '="'
		s += attribs[key]
		s += '"'
	}

	s += '>'
	s += options.fn(this)
	s += "</a>"
	return s
})

// similar to the link helper, but just returns the url
handlebars.registerHelper('url', function(context, options){
	return getUrl(context)
})

handlebars.registerHelper('trackLink', function(context, options){
	return "trackLink('" + (getUrl(context)) + "'); return false;"
})

// clean the 'dist' directory
rmrf.sync(baseDistPath)
mkdirp.sync(baseDistPath)

// runs a template function to generate an output file
function generateTemplateOutput(templateName, outputRelPath, templateData){
	templateData = templateData || {}
	var output = templates[templateName](templateData),
		outputPath = path.join(baseDistPath, outputRelPath)
	fs.writeFileSync(outputPath, output, 'utf-8')
}

// generate dist/index.html
generateTemplateOutput('index', 'index.html', {
	pageTitle: "Code Pulse | Real-Time Code Coverage",
	navLinks: require('./data/index-navigation'),
	includes: [
		{css: "deps/carousel.css"},
		{css: "deps/overview.css"},
		{css: "deps/features.css"},
		{css: "deps/why.css"},
		{css: 'deps/how.css'},
		{js:  'deps/latest-version.js'},
		{js:  'deps/jquerypp.hover.js'},
		{js:  'deps/how.js'},
		{js:  'deps/footer.js'}
	]
})

// generate dist/faq.html
generateTemplateOutput('faq', 'faq.html', {
	pageTitle: "Code Pulse | FAQ",
	faqs: faqData,
	includes: [
		{js: 'deps/faq.js'}
	]
})

// generate dist/deps/* by copying the static-deps folder (async!)
ncp('./static-deps', path.join(baseDistPath, '/deps'), function(err, result){
	// blank callback function for now...
})
