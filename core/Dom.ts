export class Dom {
	public static initialize() {
		var doc = document.querySelectorAll('*');

		for (var i = 0; i < doc.length; i++) {
			App.Dom.textNodeSearch(doc[i]);
			for (var n = 0; n < doc[i].attributes.length; n++) {
				App.Dom.templateRenderForAttribute(doc[i], doc[i].attributes[n].name);
			}
		}

		var observer = new MutationSummary({
			callback: function(summaries) {
				App.Dom.templateFinder(summaries);
			},
			queries: [{
				all: true
			}]
		});

		document.querySelector('body').addEventListener('input', function(event) {
			App.Dom.twoWayBinderOutHandler(event, 'input[data-bind-to]:not([data-bind-on]), input[data-bind-to][data-bind-on=input]')
		});

		document.querySelector('body').addEventListener('change', function(event) {
			App.Dom.twoWayBinderOutHandler(event, '[data-bind-to][data-bind-on=change]')
		});
	}

	public static templateFinder(summaries) {
		summaries[0].added.forEach(function(el: HTMLElement) {
			App.Dom.textNodeSearch(el);
		});

		summaries[0].characterDataChanged.forEach(function(el: HTMLElement) {
			App.Dom.textNodeSearch(el);
		});

		for(var key in summaries[0].attributeChanged) {
			var attributes = summaries[0].attributeChanged;
			if (attributes.hasOwnProperty(key)) {
				attributes[key].forEach(function(el) {
					App.Dom.templateRenderForAttribute(el, key);
				})
			}
		}
	}

	public static textNodeSearch(el) {
		if(el.nodeType === 3) {
			App.Dom.templateRenderForTextNode(el, 'nodeValue');
		} else {
			for (var i = 0; i < el.childNodes.length; i++) {
				if (el.childNodes[i].nodeType === 3) {
					App.Dom.templateRenderForTextNode(el.childNodes[i], 'nodeValue');
				}
			}
		}
	}

	public static templateRenderForTextNode(el: Node, templateProperty: string) {
		var regexForTemplate: RegExp = new RegExp(App.regexForTemplate, 'g');
		var regexForModelPaths: RegExp = new RegExp(App.regexForModelPaths, 'g');
		var matches: Object = el[templateProperty].match(regexForTemplate);
		if(matches) {
			el['__template'] = el[templateProperty];
			el.nodeValue = el[templateProperty].replace(regexForTemplate, function(match, submatch) {
				var modelPaths: Array<string>;
				while ((modelPaths = regexForModelPaths.exec(submatch)) !== null) {
					var modelPath = modelPaths[3].trim();
					if (typeof App.elementToModelMap.get(modelPath) === 'undefined') {
						App.elementToModelMap.set(modelPath, []);
					}
					if ((function () { // If node isn't already in this model path
							var notAlreadyInModel:boolean = true;
							App.elementToModelMap.get(modelPath).forEach(function (node:Node) {
								if (el === node) {
									notAlreadyInModel = false;
								}
							});
							return notAlreadyInModel;
						}())) {

						App.elementToModelMap.get(modelPath).push(el);
					}
				}
				return App.Utils.processTemplateThroughPipes(submatch);
			});
		}
	}

	public static templateRenderForAttribute(el: HTMLElement, attribute: string, useAttributeTemplate?: boolean) {
		useAttributeTemplate = useAttributeTemplate || false;
		var regexForTemplate: RegExp = new RegExp(App.regexForTemplate, 'g');
		var regexForModelPaths: RegExp = new RegExp(App.regexForModelPaths, 'g');
		var attributeValue: string;

		if (useAttributeTemplate) {
			attributeValue = el['__' + attribute + 'Template'];
		} else {
			attributeValue = el.getAttribute(attribute);
		}

		var matches: Object = attributeValue.match(regexForTemplate);
		if(matches) {
			el['__' + attribute + 'Template'] = attributeValue;
			el.setAttribute(attribute, attributeValue.replace(regexForTemplate, function(match, submatch) {
				var modelPaths: Array<string>;
				while ((modelPaths = regexForModelPaths.exec(submatch)) !== null) {
					var modelPath = modelPaths[3].trim();
					if (typeof App.elementToModelMap.get(modelPath) === 'undefined') {
						App.elementToModelMap.set(modelPath, []);
					}
					if ((function () { // If node isn't already in this model path
							var notAlreadyInModel:boolean = true;
							App.elementToModelMap.get(modelPath).forEach(function (item) {
								if (typeof item.nodeValue === 'undefined' && el === item.element && attribute === item.attribute) {
									notAlreadyInModel = false;
								}
							});
							return notAlreadyInModel;
						}())) {

						let SubscribedAttrTemplate:SubscribedAttrTemplate = {
							element  : el,
							attribute: attribute
						};

						App.elementToModelMap.get(modelPath).push(SubscribedAttrTemplate);
					}
				}
				return App.Utils.processTemplateThroughPipes(submatch);
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