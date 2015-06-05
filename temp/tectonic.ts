/// <reference path="lib.es6.d.ts"/>

declare var MutationSummary;

interface InternalModelWrapper {
	model: Object;
}

interface SubscribedElement {
	element: HTMLElement;
	attributes: [{
		attribute: string;
		expression: string;
		callbacks: Array<Function>;
	}]
}

interface SubscribedAttrTemplate {
	element: Node;
	attribute: string;
}

class App {
	private static internalModelWrapper: InternalModelWrapper = {model: {}};
	public static regexForTemplate: string = '\\$\\{(.*?)\\}';
	public static regexForModelPaths: string = '((App|this)\\.(.*?)(?!\\[.*?|.*?\\])(?:\\||$|\\n|\\*|\\+|\\\\|\\-|\\s|\\(|\\)|\\|\\||&&|\\?|\\:|\\!))';
	public static elementToModelMap: Map<string, Array<SubscribedAttrTemplate|Node>> = new Map([['', []]]);
	public static subscribedElementsToModelMap: Map<string, Array<SubscribedElement>> = new Map([['', []]]);
	public static set model(value: Object) {
		for (var key in value) {
			if (value.hasOwnProperty(key)) {
				App.internalModelWrapper.model[key] = value[key]
			}
		}
		App.Utils.Observe.observeObjects(false, App.internalModelWrapper);
	}
	public static get model(): Object {
		return App.internalModelWrapper.model;
	}

	public static initialize() {
		App.Utils.Observe.observeObjects(false, App.internalModelWrapper);
		App.Dom.initialize();
	}
}
////////////////////////////////
module App {
////////////////////////////////
export class Utils {
	public static isElement(o: any): boolean{
		return (typeof HTMLElement === "object" ? o instanceof HTMLElement : //DOM2
		o && typeof o === "object" && o !== null && o.nodeType === 1 && typeof o.nodeName==="string");
	}

	public static processTemplateThroughPipes(value) {
		var value = value.split(/(?!\[.*?|.*?\])\|/g);
		var returnVal = eval(value[0].trim());
		if(typeof returnVal !== 'undefined') {
			returnVal = String(returnVal).trim();
			if (value.length <= 1) {
				return returnVal;
			} else {
				for (var i = 1; i < value.length; i++) {
					var func = value[i].trim();
					var args = App.Utils.splitParametersBySpaces(func);
					for (var n = 1; n < args.length; n++) {
						args[n] = App.Utils.unwrapQuotes(App.Utils.castStringToType(args[n]));
					}
					func = args.shift();
					if (typeof App.Pipes[func] !== 'undefined') {
						args.unshift(returnVal);
						returnVal = App.Pipes[func](returnVal, args);
					} else if (typeof String(returnVal)[func] !== 'undefined') {
						returnVal = window['String']['prototype'][func].apply(returnVal, args);
					}
				}
				// If the value is not defined or otherwise a value we don't want to display
				if (typeof returnVal === 'undefined' || String(returnVal).toLowerCase() === 'nan' || String(returnVal).toLowerCase() === 'undefined') {
					return ""; // Return an empty stirng
				} else { // If the value is good to display
					return returnVal; // Return the value
				}
			}
		} else {
			return '';
		}
	}

	public static splitParametersBySpaces(string) {
		var string = string;
		var arr = [];
		var inQuoteDouble = false;
		var inQuoteSingle = false;
		var lastSpace = -1;
		var lastChar = "";
		var numberOfSpaces = 0;
		var charArr = string.trim().split('');
		for (var i = 0; i < charArr.length; i++) {
			var currChar = charArr[i];
			if (currChar !== " " || currChar !== lastChar) {
				if (currChar === " " && !inQuoteDouble && !inQuoteSingle) {
					arr.push(string.substr(lastSpace + 1, i - lastSpace - 1).trim());
					lastSpace = i;
				} else if (currChar === "\"" && lastChar !== "\\" && !inQuoteSingle) {
					if (inQuoteDouble) {
						inQuoteDouble = false;
					} else {
						inQuoteDouble = true;
					}
				} else if (currChar === "'" && lastChar !== "\\" && !inQuoteDouble) {
					if (inQuoteSingle) {
						inQuoteSingle = false;
					} else {
						inQuoteSingle = true;
					}
				}
			}
			lastChar = currChar;
		}
		arr.push(string.substr(lastSpace + 1, (string.length - 1) - lastSpace).trim());
		return arr;
	}

	public static castStringToType(string) {
		if (string.trim().toLowerCase() === 'true') {
			return true;
		} else if (string.trim().toLowerCase() === 'false') {
			return false
		} else {
			return string;
		}
	}

	public static unwrapQuotes(string) {
		var string = string.trim();
		var firstChar = string.substr(0,1);
		var lastChar = string.substr(string.length - 1);
		if (firstChar === "\"" && lastChar === "\"") {
			string = string.substr(1, string.length - 2).replace(/\\"/g, "\"");
		} else if (firstChar === "'" && lastChar === "'") {
			string = string.substr(1, string.length - 2).replace(/\\'/g, "'");
		}
		return string;
	}
}

export module Utils {
	export class Observe {

		public static observerFunctions: Object = {};//Object containing properties whose name matches the locations in the watched model and whose values are equal to the observer functions.
		public static witnessedObjects: Object = {};
		public static observeObjects (unobserve: boolean, objectToObserve: Object|Array<any>, objectLocationString?: string, previousObjects?: Array<Object>): void {
			//LOOP THROUGH ALL SUPPLIED MODELS AND RECURSIVELY OBSERVE OBJECTS WITHIN OBJECTS
			var observationAction: string = unobserve ? 'unobserve' : 'observe';//Variable used to decide which function is called depending on whether we're observing or unobserving.
			var witnessedObjects: Object = App.Utils.Observe.witnessedObjects;
			var observerFunctions: Object = App.Utils.Observe.observerFunctions;
			var observeObjects: Function = App.Utils.Observe.observeObjects;
			previousObjects = previousObjects || [];//array of previously observed objects. We keep this to prevent redundant observation in circular structures

			for (var key in objectToObserve) {
				if (objectToObserve.hasOwnProperty(key) || Array.isArray(objectToObserve)) {
					var value = objectToObserve[key];
					if ((value !== null && //check if value is not null
					(typeof value === 'object' || Array.isArray(value))) && //and it is an object or an array
					!App.Utils.isElement(value) && //and also not a DOM element
					(function () { //finally check that this object is not reference to a previously observed object
						var wasNotSeen = true;
						previousObjects.forEach(function (object) {
							if (object === value)
								wasNotSeen = false;
						});
						return wasNotSeen;
					})()) {
						previousObjects.push(value);//add this object to the array of previously seen objects.

						var thisLocation = "";//variable for storing the current location

						if (typeof objectLocationString === "undefined")//If there is no object location string, create a new one.
							thisLocation = "" + key;
						else { //Otherwise...
							if (!isNaN(key)) {//if the key is an array index
								thisLocation = objectLocationString + "[" + key + "]";
							} else { //or if the key is an object property
								thisLocation = objectLocationString + "." + key;
							}
						}

						witnessedObjects[thisLocation] = value;//Add this object or array to the witnessedObjects object which contains a mapping of locations to object or arrays

						//OBSERVE CHANGES IN MODEL'S DATASTRUCTURE TO REFLECT
						var changeHandlerFunction = observerFunctions[thisLocation] ? observerFunctions[thisLocation] : function (changes) {
							changes.forEach(function (change) {//For every change in the object...
								var key = !isNaN(change.name) ? '[' + change.name + ']' : '.' + change.name; //set key based on whether the key is an array index or object property.
								var modelPath = thisLocation + key;
								//var elementSelector = "[" + options.dataBindToAttr + "='" + modelPath + "'],[" + options.dataWatchingAttr + "*='" + modelPath + ",'],[" + options.dataWatchingAttr + "$='" + modelPath + "']";
								var newValue = change.object[change.name];
								var oldValue = change.oldValue;
								//var $element = $(elementSelector);

								if (typeof newValue === 'object' || Array.isArray(newValue)) { //If the new value is an object or an array
									observeObjects(unobserve, value, thisLocation, previousObjects);//Observe this object or array and all of its obserable children.
								}

								App.Utils.Observe.setElementsToValue(App.elementToModelMap, modelPath, newValue);
								App.Utils.Observe.updateSubscribedElements(App.subscribedElementsToModelMap, modelPath);

								if (Array.isArray(newValue))//If the new value is an array
									var logValue = JSON.stringify(newValue);//set the logging value as a stringified array
								else//Otherwise...
									logValue = "'" + newValue + "'";//display as a quoted string.

								//console.log(thisLocation + key + " is now equal to " + logValue + " as observed in the model.");

								/*if (typeof options.modelChangeCallback === "function") {//If there is a callback function specified by the user
									console.log("Model change callback executed for change in " + thisLocation + key);//show log information
									options.modelChangeCallback({
										locationPathString: modelPath, //the location in the model as a string
										$boundElements    : $element, //the bound elements as a jquery collection
										newValue          : newValue, //the new value of the property
										oldValue          : oldValue //the old value of the property
									});//run it now.
								}
								else {
										console.log("No callback supplied for model change thus no function was called");
								}*/

							});

						};
						if (!observerFunctions[thisLocation])//if the function for this location is not stored...
							observerFunctions[thisLocation] = changeHandlerFunction;//...store it
						Object[observationAction](value, changeHandlerFunction);//use this function for handling model changes

						observeObjects(unobserve, value, thisLocation, previousObjects);//recursively observe this object or array.

					}
				}
			}
		}

		public static setElementsToValue(elementsObject, modelLocation, value) {
			var boundElements = document.querySelectorAll('input[data-bind-to="App.' + modelLocation + '"]:not([data-bind-on]), input[data-bind-to="App.' + modelLocation + '"][data-bind-on=input]');
			for (var i = 0; i < boundElements.length; i++) {
				App.Dom.twoWayBinderInHandler(boundElements[i], value);
			}

			elementsObject.forEach(function(value: Array<any>, key: string) {
				if (key.startsWith(modelLocation)) {
					value.forEach(function (node) {
						if (node instanceof Node || node instanceof HTMLElement) {
							App.Dom.templateRenderForTextNode(node, '__template');
						} else {
							App.Dom.templateRenderForAttribute(node.element, node.attribute, true);
						}
					});
				}
			});
		}

		public static updateSubscribedElements(elementsObject, modelLocation) {
			elementsObject.forEach(function(value: Array<SubscribedElement>, key: string) {
				if (key.startsWith(modelLocation)) {
					value.forEach(function (item:SubscribedElement) {
						item.attributes.forEach(function (attribute) {
							attribute.callbacks.forEach(function (callback) {
								callback(App.Utils.processTemplateThroughPipes(attribute.expression));
							});
						});
					});
				}
			});
		}
	}

	export class Sandbox {
		public static evaluate(code) {
			var workerStr = `
			onmessage = function (oEvent) {
				postMessage({
					"id": oEvent.data.id,
					"evaluated": eval(oEvent.data.code)
				});
			}
			`;
			var blob = new Blob([workerStr], {type: 'application/javascript'});
			var aListeners = [], oParser = new Worker(URL.createObjectURL(blob));

			oParser.onmessage = function (oEvent) {
				debugger;
				if (aListeners[oEvent.data.id]) { aListeners[oEvent.data.id](oEvent.data.evaluated); }
				delete aListeners[oEvent.data.id];
			};


			return (function (code, fListener) {
				aListeners.push(fListener || null);
				oParser.postMessage({
					"id": aListeners.length - 1,
					"code": code
				});
			})(code, function(data){ console.log(data); });

		}
	}
}
////////////////////////////////
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

						var SubscribedAttrTemplate:SubscribedAttrTemplate = {
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
////////////////////////////////
export class Pipes {
	public static toUpperCase(string: string) {
		return string.toUpperCase();
	}
}
////////////////////////////////
declare var App;

export interface SubscribedAttribute {
	attribute: string;
	subscribedModelPaths: Array<string>;
}

export class Element {

	public static registered: boolean = false;
	public static el: HTMLElement;
	public el: HTMLElement;
	public subscribedAttrs: Array<SubscribedAttribute> = [];

	constructor(el?) {
		if(!App[this.getClassName()].registered) {
			this.register();
		}
		if (!el) {
			this.el = new App[this.getClassName()].el;
		} else {
			this.el = el;
		}
		this.el['__controller'] = this;
	}

	protected subscribeAttrToModelPath(attribute: string, callback: Function) {
		var index = 0;
		var el = this.el;
		var regexForModelPaths = new RegExp(App.regexForModelPaths, 'g');
		var expression = el.getAttribute(attribute);
		var subscribedAttribute:SubscribedAttribute = {
			attribute           : attribute,
			subscribedModelPaths: []
		};
		var modelPaths: Array<string>;
		while ((modelPaths = regexForModelPaths.exec(expression)) !== null) {
			var modelPath = modelPaths[3].trim();
			subscribedAttribute.subscribedModelPaths.push(modelPath);
			if (typeof App.subscribedElementsToModelMap.get(modelPath) === 'undefined') {
				App.subscribedElementsToModelMap.set(modelPath, []);
			}

			// If this element is not in the subscribed map.
			if (!App.subscribedElementsToModelMap.get(modelPath).some(function (value:SubscribedElement) {
				if (value.element === el) {
					// If we find the element, check to see if it has this attribute already
					if (!value.attributes.some(function (attr) {
							// If this attribute exists already
							if (attr.attribute === attribute) {
								attr.callbacks.push(callback); // Then push the additional callback
								return true
							}
						})) {
						// If this attribute does not exist for the current element, add it
						value.attributes.push({
							attribute : attribute,
							expression: expression,
							callbacks : [callback]
						});
					}
					return true;
				}
			})) {
				// If this element is not in the subscribed map...
				var subscribedElement:SubscribedElement = {
					element   : el,
					attributes: [{
						attribute : attribute,
						expression: expression,
						callbacks : [callback]
					}]
				};
				// Push it
				App.subscribedElementsToModelMap.get(modelPath).push(subscribedElement);
			}
		}
		// And push it to this element's list of subscribed attributes
		this.subscribedAttrs.push(subscribedAttribute);
		// Set initial value
		App.Utils.Observe.updateSubscribedElements(App.subscribedElementsToModelMap, modelPath);
	}

	/*protected updateSubscribedAttr(attribute: string) {
		var el = this.el;
		this.subscribedAttrs.some(function(subscribedAttribute: SubscribedAttribute) {
			if (subscribedAttribute.attribute === attribute) {
				App.subscribedElementsToModelMap.get(subscribedAttribute.subscribedModelPath).some(function(subscribedElement: SubscribedElement) {
					if(subscribedElement.element === el) {
						// TODO: finish this function.
						return true;
					}
				});
				return true;
			}
		});
	}*/

	protected getClassName(): string {
		var funcNameRegex = /function (.{1,})\(/; // This is for ES5 and ES3 Builds
		//var funcNameRegex = /class (.*?)\s*?\{/; //This is for ES6 Builds
		var results = (funcNameRegex).exec(this["constructor"].toString());
		return (results && results.length > 1) ? results[1] : "";
	}

	protected register(): void {
		if (!App[this.getClassName()].registered) {

			App[this.getClassName()].registered = true;

			var guiElement = this;
			var document:any = window.document;

			App[this.getClassName()].el = document.registerElement('app-' + this.getClassName().toLowerCase(), {
				prototype: Object.create(HTMLElement.prototype, {
					createdCallback: {
						value: function() {
							if (typeof this['__controller'] === 'undefined' || !this['__controller']) {
								this['__controller'] = new App[guiElement.getClassName()](this);
							}

							var shadow = this.createShadowRoot();

							var observer = new MutationSummary({
								callback: function (summaries) {
									App.Dom.templateFinder(summaries);
								},
								queries : [{
									all: true
								}],
								rootNode: shadow
							});
							shadow.innerHTML = "<content></content>";
						}
					},
					attributeChangedCallback: function() {

					}
				})
			});
		}
	}

}
////////////////////////////////
declare var App;
export class Print extends Element{
	constructor(e?) {
		super(e);
		var element = this.el;
		this.subscribeAttrToModelPath('value', function(value){
			element.innerHTML = value;
		});
	}
}
////////////////////////////////
declare var App;
export class If extends Element{
	constructor(e?) {
		super(e);
		var element = this.el;
		this.subscribeAttrToModelPath('condition', function(value){
			var val = App.Utils.castStringToType(value);
			if (val) {
				element.setAttribute('evaluates-to', 'true');
				element.style.display = 'block';
			} else {
				element.setAttribute('evaluates-to', 'false');
				element.style.display = 'none';
			}
			var nextSibling = element.nextElementSibling;
			var nextTagName = nextSibling.tagName;
			if(typeof nextSibling !== 'undefined' && typeof nextTagName !== 'undefined' && nextTagName.toLowerCase() === 'app-else' && typeof nextSibling['__controller'] !== 'undefined') {
				nextSibling['__controller'].update(App.Utils.castStringToType(element.getAttribute('evaluates-to')));
			}
		});
	}
}
////////////////////////////////
declare var App;
export class Else extends Element {
	constructor(e?) {
		super(e);
	}

	public update(ifVal: boolean) {
		var element = this.el;
		if (!ifVal) {
			element.style.display = 'block'
		} else {
			element.style.display = 'none'
		}
	}
}
////////////////////////////////
}

for (var guiClass in App) {
	if (App.hasOwnProperty(guiClass)) {
		if (typeof App[guiClass].prototype !== "undefined" && typeof App[guiClass].prototype.register !== "undefined" && typeof App[guiClass].registered !== "undefined" && !App[guiClass].registered) {
			App[guiClass].prototype.register();
		}
	}
}
App.initialize();

window['App'] = App;
//# sourceMappingURL=tectonic.ts.map