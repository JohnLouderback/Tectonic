export class Utils {
	public static isElement(o: any): boolean{
		return (typeof HTMLElement === "object" ? o instanceof HTMLElement : //DOM2
		o && typeof o === "object" && o !== null && o.nodeType === 1 && typeof o.nodeName==="string");
	}

	public static processTemplateThroughPipes(value) {
		var value = value.split(/(?!\[.*?|.*?\])\|/g);
		console.log(value);
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
			if (typeof elementsObject.get(modelLocation) !== 'undefined') {
				elementsObject.get(modelLocation).forEach(function (node) {
					if (node instanceof Node || node instanceof HTMLElement) {
						App.Dom.templateRenderForTextNode(node, '__template');
					} else {
						App.Dom.templateRenderForAttribute(node.element, node.attribute, true);
					}
				});
			}
		}

		public static updateSubscribedElements(elementsObject, modelLocation) {
			if (typeof elementsObject.get(modelLocation) !== 'undefined') {
				elementsObject.get(modelLocation).forEach(function(item: SubscribedElement) {
					item.attributes.forEach(function(attribute) {
						attribute.callbacks.forEach(function(callback) {
							callback(App.Utils.processTemplateThroughPipes(attribute.expression));
						});
					});
				});
			}
		}
	}
}