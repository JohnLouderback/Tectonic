export class Dom {
	public static initialize() {
		var doc = document.querySelectorAll('*');
		console.log(doc);

		for (var i = 0; i < doc.length; i++) {
			Gui.Dom.textNodeSearch(doc[i]);
			for (var n = 0; n < doc[i].attributes.length; n++) {
				Gui.Dom.templateRenderForAttribute(doc[i], doc[i].attributes[n].name);
			}
		}

		var observer = new MutationSummary({
			callback: function(summaries) {
				Gui.Dom.templateFinder(summaries);
			},
			queries: [{
				all: true
			}]
		});

		document.querySelector('body').addEventListener('input', function(event) {
			Gui.Dom.twoWayBinderOutHandler(event, 'input[data-bind-to]:not([data-bind-on]), input[data-bind-to][data-bind-on=input]')
		});

		document.querySelector('body').addEventListener('change', function(event) {
			Gui.Dom.twoWayBinderOutHandler(event, '[data-bind-to][data-bind-on=change]')
		});
	}

	public static templateFinder(summaries) {
		summaries[0].added.forEach(function(el: HTMLElement) {
			Gui.Dom.textNodeSearch(el);
		});

		summaries[0].characterDataChanged.forEach(function(el: HTMLElement) {
			Gui.Dom.textNodeSearch(el);
		});

		for(var key in summaries[0].attributeChanged) {
			var attributes = summaries[0].attributeChanged;
			if (attributes.hasOwnProperty(key)) {
				attributes[key].forEach(function(el) {
					Gui.Dom.templateRenderForAttribute(el, key);
				})
			}
		}
	}

	public static textNodeSearch(el) {
		if(el.nodeType === 3) {
			Gui.Dom.templateRenderForTextNode(el, 'nodeValue');
		} else {
			for (var i = 0; i < el.childNodes.length; i++) {
				if (el.childNodes[i].nodeType === 3) {
					Gui.Dom.templateRenderForTextNode(el.childNodes[i], 'nodeValue');
				}
			}
		}
	}

	public static templateRenderForTextNode(el, templateProperty: string) {
		var regex = new RegExp(Gui.regexForTemplate, 'g');
		var matches = el[templateProperty].match(regex);
		if(matches) {
			el.__template = el[templateProperty];
			el.nodeValue = el[templateProperty].replace(regex, function(match, submatch) {
				var modelPath = submatch.match(/Gui\.(.*?)(?!\[.*?|.*?\])(\||$|\n)/)[1].trim();
				if (typeof Gui.elementToModelMap[modelPath] === 'undefined') {
					Gui.elementToModelMap[modelPath] = [];
				}
				if ((function(){ // If node isn't already in this model path
						var notAlreadyInModel = true;
						Gui.elementToModelMap[modelPath].forEach(function(node) {
							if(el === node) {
								notAlreadyInModel = false;
							}
						});
						return notAlreadyInModel;
					}())) {

					Gui.elementToModelMap[modelPath].push(el);
				}

				return Gui.Utils.processTemplateThroughPipes(submatch);
			});
		}
	}

	public static templateRenderForAttribute(el, attribute: string, useAttributeTemplate?: boolean) {
		useAttributeTemplate = useAttributeTemplate || false;
		var regex = new RegExp(Gui.regexForTemplate, 'g');
		var attributeValue;

		if (useAttributeTemplate) {
			attributeValue = el['__' + attribute + 'Template'];
		} else {
			attributeValue = el.getAttribute(attribute);
		}

		var matches = attributeValue.match(regex);
		if(matches) {
			el['__' + attribute + 'Template'] = attributeValue;
			el.setAttribute(attribute, attributeValue.replace(regex, function(match, submatch) {
				var modelPath = submatch.match(/Gui\.(.*?)(?!\[.*?|.*?\])(\||$|\n)/)[1].trim();
				if (typeof Gui.elementToModelMap[modelPath] === 'undefined') {
					Gui.elementToModelMap[modelPath] = [];
				}
				if ((function(){ // If node isn't already in this model path
						var notAlreadyInModel = true;
						Gui.elementToModelMap[modelPath].forEach(function(item) {
							if(typeof item.nodeValue === 'undefined' && el === item.element && attribute === item.attribute) {
								notAlreadyInModel = false;
							}
						});
						return notAlreadyInModel;
					}())) {

					Gui.elementToModelMap[modelPath].push({
						element: el,
						attribute: attribute
					});
				}

				return Gui.Utils.processTemplateThroughPipes(submatch);
			}));
		}
	}

	public static twoWayBinderOutHandler(event, selector) {
		var targetEl:any = event.target;
		if (targetEl.matches(selector)) {
			var modelPath = targetEl.getAttribute('data-bind-to');
			var value = targetEl.value;
			if (value.length === 0) {
				value = '""';
			} else	if (isNaN(value)) {
				value = '"' + value.replace(/("|\\)/g, '\\$&') + '"';
			}
			eval(modelPath + ' = ' + value);
		}
	}

	public static twoWayBinderInHandler(el, value) {
		el.value = value;
	}
}