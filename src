(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){

},{}],2:[function(require,module,exports){
// shim for using process in browser

var process = module.exports = {};
var queue = [];
var draining = false;
var currentQueue;
var queueIndex = -1;

function cleanUpNextTick() {
    draining = false;
    if (currentQueue.length) {
        queue = currentQueue.concat(queue);
    } else {
        queueIndex = -1;
    }
    if (queue.length) {
        drainQueue();
    }
}

function drainQueue() {
    if (draining) {
        return;
    }
    var timeout = setTimeout(cleanUpNextTick);
    draining = true;

    var len = queue.length;
    while(len) {
        currentQueue = queue;
        queue = [];
        while (++queueIndex < len) {
            currentQueue[queueIndex].run();
        }
        queueIndex = -1;
        len = queue.length;
    }
    currentQueue = null;
    draining = false;
    clearTimeout(timeout);
}

process.nextTick = function (fun) {
    var args = new Array(arguments.length - 1);
    if (arguments.length > 1) {
        for (var i = 1; i < arguments.length; i++) {
            args[i - 1] = arguments[i];
        }
    }
    queue.push(new Item(fun, args));
    if (queue.length === 1 && !draining) {
        setTimeout(drainQueue, 0);
    }
};

// v8 likes predictible objects
function Item(fun, array) {
    this.fun = fun;
    this.array = array;
}
Item.prototype.run = function () {
    this.fun.apply(null, this.array);
};
process.title = 'browser';
process.browser = true;
process.env = {};
process.argv = [];
process.version = ''; // empty string to avoid regexp issues
process.versions = {};

function noop() {}

process.on = noop;
process.addListener = noop;
process.once = noop;
process.off = noop;
process.removeListener = noop;
process.removeAllListeners = noop;
process.emit = noop;

process.binding = function (name) {
    throw new Error('process.binding is not supported');
};

// TODO(shtylman)
process.cwd = function () { return '/' };
process.chdir = function (dir) {
    throw new Error('process.chdir is not supported');
};
process.umask = function() { return 0; };

},{}],3:[function(require,module,exports){

/**
 * Contains the JailedSite object used both by the application
 * site, and by each plugin
 */

(function(){
     
    /**
     * JailedSite object represents a single site in the
     * communication protocol between the application and the plugin
     * 
     * @param {Object} connection a special object allowing to send
     * and receive messages from the opposite site (basically it
     * should only provide send() and onMessage() methods)
     */
    JailedSite = function(connection) {
        this._interface = {};
        this._remote = null;
        this._remoteUpdateHandler = function(){};
        this._getInterfaceHandler = function(){};
        this._interfaceSetAsRemoteHandler = function(){};
        this._disconnectHandler = function(){};
        this._store = new ReferenceStore;

        var me = this;
        this._connection = connection;
        this._connection.onMessage(
            function(data){ me._processMessage(data); }
        );

        this._connection.onDisconnect(
            function(m){
                me._disconnectHandler(m);
            }
        );
    }


    /**
     * Set a handler to be called when the remote site updates its
     * interface
     * 
     * @param {Function} handler
     */
    JailedSite.prototype.onRemoteUpdate = function(handler) {
        this._remoteUpdateHandler = handler;
    }


    /**
     * Set a handler to be called when received a responce from the
     * remote site reporting that the previously provided interface
     * has been succesfully set as remote for that site
     * 
     * @param {Function} handler
     */
    JailedSite.prototype.onInterfaceSetAsRemote = function(handler) {
        this._interfaceSetAsRemoteHandler = handler;
    }


    /**
     * Set a handler to be called when the remote site requests to
     * (re)send the interface. Used to detect an initialzation
     * completion without sending additional request, since in fact
     * 'getInterface' request is only sent by application at the last
     * step of the plugin initialization
     * 
     * @param {Function} handler
     */
    JailedSite.prototype.onGetInterface = function(handler) {
        this._getInterfaceHandler = handler;
    }


    /**
     * @returns {Object} set of remote interface methods
     */
    JailedSite.prototype.getRemote = function() {
        return this._remote;
    }


    /**
     * Sets the interface of this site making it available to the
     * remote site by sending a message with a set of methods names
     * 
     * @param {Object} _interface to set
     */
    JailedSite.prototype.setInterface = function(_interface) {
        this._interface = _interface;
        this._sendInterface();
    }


    /**
     * Sends the actual interface to the remote site upon it was
     * updated or by a special request of the remote site
     */
    JailedSite.prototype._sendInterface = function() {
        var names = [];
        for (var name in this._interface) {
            if (this._interface.hasOwnProperty(name)) {
                names.push(name);
            }
        }

        this._connection.send({type:'setInterface', api: names});
    }


    /**
     * Handles a message from the remote site
     */
    JailedSite.prototype._processMessage = function(data) {
         switch(data.type) {
         case 'method':
             var method = this._interface[data.name];
             var args = this._unwrap(data.args);
             method.apply(null, args);
             break;
         case 'callback':
             var method = this._store.fetch(data.id)[data.num];
             var args = this._unwrap(data.args);
             method.apply(null, args);
             break;
         case 'setInterface':
             this._setRemote(data.api);
             break;
         case 'getInterface':
             this._sendInterface();
             this._getInterfaceHandler();
             break;
         case 'interfaceSetAsRemote':
             this._interfaceSetAsRemoteHandler();
             break;
         case 'disconnect':
             this._disconnectHandler();
             this._connection.disconnect();
             break;
         }
    }


    /**
     * Sends a requests to the remote site asking it to provide its
     * current interface
     */
    JailedSite.prototype.requestRemote = function() {
        this._connection.send({type:'getInterface'});
    }


    /**
     * Sets the new remote interface provided by the other site
     * 
     * @param {Array} names list of function names
     */
    JailedSite.prototype._setRemote = function(names) {
        this._remote = {};
        var i, name;
        for (i = 0; i < names.length; i++) {
            name = names[i];
            this._remote[name] = this._genRemoteMethod(name);
        }

        this._remoteUpdateHandler();
        this._reportRemoteSet();
    }
     
     
    /**
     * Generates the wrapped function corresponding to a single remote
     * method. When the generated function is called, it will send the
     * corresponding message to the remote site asking it to execute
     * the particular method of its interface
     * 
     * @param {String} name of the remote method
     * 
     * @returns {Function} wrapped remote method
     */
    JailedSite.prototype._genRemoteMethod = function(name) {
        var me = this;
        var remoteMethod = function() {
            me._connection.send({
                type: 'method',
                name: name,
                args: me._wrap(arguments)
            });
        };

        return remoteMethod;
    }


    /**
     * Sends a responce reporting that interface just provided by the
     * remote site was sucessfully set by this site as remote
     */
    JailedSite.prototype._reportRemoteSet = function() {
        this._connection.send({type:'interfaceSetAsRemote'});
    }


    /**
     * Prepares the provided set of remote method arguments for
     * sending to the remote site, replaces all the callbacks with
     * identifiers
     * 
     * @param {Array} args to wrap 
     * 
     * @returns {Array} wrapped arguments
     */
    JailedSite.prototype._wrap = function(args) {
        var wrapped = [];
        var callbacks = {};
        var callbacksPresent = false;
        for (var i = 0; i < args.length; i++) {
            if (typeof args[i] == 'function') {
                callbacks[i] = args[i];
                wrapped[i] = {type: 'callback', num : i};
                callbacksPresent = true;
            } else {
                wrapped[i] = {type: 'argument', value : args[i]};
            }
        }

        var result = {args: wrapped};

        if (callbacksPresent) {
            result.callbackId = this._store.put(callbacks);
        }

        return result;
    }


    /**
     * Unwraps the set of arguments delivered from the remote site,
     * replaces all callback identifiers with a function which will
     * initiate sending that callback identifier back to other site
     * 
     * @param {Object} args to unwrap
     * 
     * @returns {Array} unwrapped args
     */
    JailedSite.prototype._unwrap = function(args) {
        var called = false;
        
        // wraps each callback so that the only one could be called
        var once = function(cb) {
            return function() {
                if (!called) {
                    called = true;
                    cb.apply(this, arguments);
                } else {
                    var msg =
                      'A callback from this set has already been executed';
                    throw new Error(msg);
                }
            };
        }
        
        var result = [];
        var i, arg, cb, me = this;
        for (i = 0; i < args.args.length; i++) {
            arg = args.args[i];
            if (arg.type == 'argument') {
                result.push(arg.value);
            } else {
                cb = once(
                    this._genRemoteCallback(args.callbackId, i)
                );
                result.push(cb);
            }
        }

        return result;
    }
     
     
    /**
     * Generates the wrapped function corresponding to a single remote
     * callback. When the generated function is called, it will send
     * the corresponding message to the remote site asking it to
     * execute the particular callback previously saved during a call
     * by the remote site a method from the interface of this site
     * 
     * @param {Number} id of the remote callback to execute
     * @param {Number} argNum argument index of the callback
     * 
     * @returns {Function} wrapped remote callback
     */
    JailedSite.prototype._genRemoteCallback = function(id, argNum) {
        var me = this;
        var remoteCallback = function() {
            me._connection.send({
                type : 'callback',
                id   : id,
                num  : argNum,
                args : me._wrap(arguments)
            });
        };

        return remoteCallback;
    }

     
    /**
     * Sends the notification message and breaks the connection
     */
    JailedSite.prototype.disconnect = function() {
        this._connection.send({type: 'disconnect'});
        this._connection.disconnect();
    }
    
     
    /**
     * Set a handler to be called when received a disconnect message
     * from the remote site
     * 
     * @param {Function} handler
     */
    JailedSite.prototype.onDisconnect = function(handler) {
        this._disconnectHandler = handler;
    }
     
     
     

    /**
     * ReferenceStore is a special object which stores other objects
     * and provides the references (number) instead. This reference
     * may then be sent over a json-based communication channel (IPC
     * to another Node.js process or a message to the Worker). Other
     * site may then provide the reference in the responce message
     * implying the given object should be activated.
     * 
     * Primary usage for the ReferenceStore is a storage for the
     * callbacks, which therefore makes it possible to initiate a
     * callback execution by the opposite site (which normally cannot
     * directly execute functions over the communication channel).
     * 
     * Each stored object can only be fetched once and is not
     * available for the second time. Each stored object must be
     * fetched, since otherwise it will remain stored forever and
     * consume memory.
     * 
     * Stored object indeces are simply the numbers, which are however
     * released along with the objects, and are later reused again (in
     * order to postpone the overflow, which should not likely happen,
     * but anyway).
     */
    var ReferenceStore = function() {
        this._store = {};    // stored object
        this._indices = [0]; // smallest available indices
    }


    /**
     * @function _genId() generates the new reference id
     * 
     * @returns {Number} smallest available id and reserves it
     */
    ReferenceStore.prototype._genId = function() {
        var id;
        if (this._indices.length == 1) {
            id = this._indices[0]++;
        } else {
            id = this._indices.shift();
        }

        return id;
    }


    /**
     * Releases the given reference id so that it will be available by
     * another object stored
     * 
     * @param {Number} id to release
     */
    ReferenceStore.prototype._releaseId = function(id) {
        for (var i = 0; i < this._indices.length; i++) {
            if (id < this._indices[i]) {
                this._indices.splice(i, 0, id);
                break;
            }
        }

        // cleaning-up the sequence tail
        for (i = this._indices.length-1; i >= 0; i--) {
            if (this._indices[i]-1 == this._indices[i-1]) {
                this._indices.pop();
            } else {
                break;
            }
        }
    }


    /**
     * Stores the given object and returns the refernce id instead
     * 
     * @param {Object} obj to store
     * 
     * @returns {Number} reference id of the stored object
     */
    ReferenceStore.prototype.put = function(obj) {
        var id = this._genId();
        this._store[id] = obj;
        return id;
    }


    /**
     * Retrieves previously stored object and releases its reference
     * 
     * @param {Number} id of an object to retrieve
     */
    ReferenceStore.prototype.fetch = function(id) {
        var obj = this._store[id];
        this._store[id] = null;
        delete this._store[id];
        this._releaseId(id);
        return obj;
    }


})();


},{}],4:[function(require,module,exports){
(function (process,__dirname){
/**
 * @fileoverview Jailed - safe yet flexible sandbox
 * @version 0.2.0
 *
 * @license MIT, see http://github.com/asvd/jailed
 * Copyright (c) 2014 asvd <heliosframework@gmail.com>
 *
 * Main library script, the only one to be loaded by a developer into
 * the application. Other scrips shipped along will be loaded by the
 * library either here (application site), or into the plugin site
 * (Worker/child process):
 *
 *  _JailedSite.js    loaded into both applicaiton and plugin sites
 *  _frame.html       sandboxed frame (web)
 *  _frame.js         sandboxed frame code (web)
 *  _pluginWeb.js     platform-dependent plugin routines (web)
 *  _pluginNode.js    platform-dependent plugin routines (Node.js)
 *  _pluginCore.js    common plugin site protocol implementation
 */


var __jailed__path__;
if (typeof window == 'undefined') {
	// Node.js
	__jailed__path__ = __dirname + '/';
} else {
	// web
	var scripts = document.getElementsByTagName('script');
	__jailed__path__ = scripts[scripts.length-1].src
			.split('?')[0]
			.split('/')
			.slice(0, -1)
			.join('/')+'/';
}


(function (root, factory) {
	if (typeof define === 'function' && define.amd) {
		define(['exports'], factory);
	} else if (typeof exports !== 'undefined') {
		factory(exports);
	} else {
		factory((root.jailed = {}));
	}
}(this, function (exports) {
	var isNode = typeof window == 'undefined';


	/**
	 * A special kind of event:
	 *  - which can only be emitted once;
	 *  - executes a set of subscribed handlers upon emission;
	 *  - if a handler is subscribed after the event was emitted, it
	 *    will be invoked immideately.
	 *
	 * Used for the events which only happen once (or do not happen at
	 * all) during a single plugin lifecycle - connect, disconnect and
	 * connection failure
	 */
	var Whenable = function() {
		this._emitted = false;
		this._handlers = [];
	}


	/**
	 * Emits the Whenable event, calls all the handlers already
	 * subscribed, switches the object to the 'emitted' state (when
	 * all future subscibed listeners will be immideately issued
	 * instead of being stored)
	 */
	Whenable.prototype.emit = function(){
		if (!this._emitted) {
			this._emitted = true;

			var handler;
			while(handler = this._handlers.pop()) {
				setTimeout(handler,0);
			}
		}
	}


	/**
	 * Saves the provided function as a handler for the Whenable
	 * event. This handler will then be called upon the event emission
	 * (if it has not been emitted yet), or will be scheduled for
	 * immediate issue (if the event has already been emmitted before)
	 *
	 * @param {Function} handler to subscribe for the event
	 */
	Whenable.prototype.whenEmitted = function(handler){
		handler = this._checkHandler(handler);
		if (this._emitted) {
			setTimeout(handler, 0);
		} else {
			this._handlers.push(handler);
		}
	}


	/**
	 * Checks if the provided object is suitable for being subscribed
	 * to the event (= is a function), throws an exception if not
	 *
	 * @param {Object} obj to check for being subscribable
	 *
	 * @throws {Exception} if object is not suitable for subscription
	 *
	 * @returns {Object} the provided object if yes
	 */
	Whenable.prototype._checkHandler = function(handler){
		var type = typeof handler;
		if (type != 'function') {
			var msg =
				'A function may only be subsribed to the event, '
				+ type
				+ ' was provided instead'
			throw new Error(msg);
		}

		return handler;
	}



	/**
	 * Initializes the library site for Node.js environment (loads
	 * _JailedSite.js)
	 */
	var initNode = function() {
		require('./_JailedSite.js');
	}


	/**
	 * Initializes the library site for web environment (loads
	 * _JailedSite.js)
	 */
	var platformInit;
	var initWeb = function() {
		// loads additional script to the application environment
		var load = function(path, cb) {
			var script = document.createElement('script');
			script.src = path;

			var clear = function() {
				script.onload = null;
				script.onerror = null;
				script.onreadystatechange = null;
				script.parentNode.removeChild(script);
			}

			var success = function() {
				clear();
				cb();
			}

			script.onerror = clear;
			script.onload = success;
			script.onreadystatechange = function() {
				var state = script.readyState;
				if (state==='loaded' || state==='complete') {
					success();
				}
			}

			document.body.appendChild(script);
		}

		platformInit = new Whenable;
		var origOnload = window.onload || function(){};

		window.onload = function(){
			origOnload();
			load(
				__jailed__path__+'_JailedSite.js',
				function(){ platformInit.emit(); }
			);
		}
	}


	var BasicConnection;

	/**
	 * Creates the platform-dependent BasicConnection object in the
	 * Node.js environment
	 */
	var basicConnectionNode = function() {
		var childProcess = require('child_process');

		/**
		 * Platform-dependent implementation of the BasicConnection
		 * object, initializes the plugin site and provides the basic
		 * messaging-based connection with it
		 *
		 * For Node.js the plugin is created as a forked process
		 */
		BasicConnection = function() {
			this._disconnected = false;
			this._messageHandler = function(){};
			this._disconnectHandler = function(){};

			/*
			 var child = require('child_process');
			 var debug = process.execArgv.indexOf('--debug') !== -1;
			 if(debug) {
			 //Set an unused port number.
			 process.execArgv.push('--debug=' + (40894));
			 }
			 child.fork(__dirname + '/task.js');
			 */


			var debug = process.execArgv.indexOf('--debug-brk') !== -1;
			if(debug) {
				console.log("DEBUG");
				process.execArgv.push('--debug-brk=' + 40894);
			}


			this._process = childProcess.fork(
				__jailed__path__+'_pluginNode.js'
			);

			var me = this;
			this._process.on('message', function(m){
				me._messageHandler(m);
			});

			this._process.on('exit', function(m){
				me._disconnected = true;
				me._disconnectHandler(m);
			});
		}


		/**
		 * Sets-up the handler to be called upon the BasicConnection
		 * initialization is completed.
		 *
		 * For Node.js the connection is fully initialized within the
		 * constructor, so simply calls the provided handler.
		 *
		 * @param {Function} handler to be called upon connection init
		 */
		BasicConnection.prototype.whenInit = function(handler) {
			handler();
		}


		/**
		 * Sends a message to the plugin site
		 *
		 * @param {Object} data to send
		 */
		BasicConnection.prototype.send = function(data) {
			if (!this._disconnected) {
				this._process.send(data);
			}
		}


		/**
		 * Adds a handler for a message received from the plugin site
		 *
		 * @param {Function} handler to call upon a message
		 */
		BasicConnection.prototype.onMessage = function(handler) {
			this._messageHandler = function(data) {
				// broken stack would break the IPC in Node.js
				try {
					handler(data);
				} catch (e) {
					console.error();
					console.error(e.stack);
				}
			}
		}


		/**
		 * Adds a handler for the event of plugin disconnection
		 * (= plugin process exit)
		 *
		 * @param {Function} handler to call upon a disconnect
		 */
		BasicConnection.prototype.onDisconnect = function(handler) {
			this._disconnectHandler = handler;
		}


		/**
		 * Disconnects the plugin (= kills the forked process)
		 */
		BasicConnection.prototype.disconnect = function() {
			this._process.kill('SIGKILL');
			this._disconnected = true;
		}

	}


	/**
	 * Creates the platform-dependent BasicConnection object in the
	 * web-browser environment
	 */
	var basicConnectionWeb = function() {
		var perm = ['allow-scripts'];

		if (__jailed__path__.substr(0,7).toLowerCase() == 'file://') {
			// local instance requires extra permission
			perm.push('allow-same-origin');
		}

		// frame element to be cloned
		var sample = document.createElement('iframe');
		sample.src = __jailed__path__ + '_frame.html';
		sample.sandbox = perm.join(' ');
		sample.style.display = 'none';


		/**
		 * Platform-dependent implementation of the BasicConnection
		 * object, initializes the plugin site and provides the basic
		 * messaging-based connection with it
		 *
		 * For the web-browser environment, the plugin is created as a
		 * Worker in a sandbaxed frame
		 */
		BasicConnection = function() {
			this._init = new Whenable;
			this._disconnected = false;

			var me = this;
			platformInit.whenEmitted(function() {
				if (!me._disconnected) {
					me._frame = sample.cloneNode(false);
					document.body.appendChild(me._frame);

					window.addEventListener('message', function (e) {
						if (e.origin === "null" &&
							e.source === me._frame.contentWindow) {
							if (e.data.type == 'initialized') {
								me._init.emit();
							} else {
								me._messageHandler(e.data);
							}
						}
					});
				}
			});
		}


		/**
		 * Sets-up the handler to be called upon the BasicConnection
		 * initialization is completed.
		 *
		 * For the web-browser environment, the handler is issued when
		 * the plugin worker successfully imported and executed the
		 * _pluginWeb.js, and replied to the application site with the
		 * initImprotSuccess message.
		 *
		 * @param {Function} handler to be called upon connection init
		 */
		BasicConnection.prototype.whenInit = function(handler) {
			this._init.whenEmitted(handler);
		}


		/**
		 * Sends a message to the plugin site
		 *
		 * @param {Object} data to send
		 */
		BasicConnection.prototype.send = function(data) {
			this._frame.contentWindow.postMessage(
				{type: 'message', data: data}, '*'
			);
		}


		/**
		 * Adds a handler for a message received from the plugin site
		 *
		 * @param {Function} handler to call upon a message
		 */
		BasicConnection.prototype.onMessage = function(handler) {
			this._messageHandler = handler;
		}


		/**
		 * Adds a handler for the event of plugin disconnection
		 * (not used in case of Worker)
		 *
		 * @param {Function} handler to call upon a disconnect
		 */
		BasicConnection.prototype.onDisconnect = function(){};


		/**
		 * Disconnects the plugin (= kills the frame)
		 */
		BasicConnection.prototype.disconnect = function() {
			if (!this._disconnected) {
				this._disconnected = true;
				if (typeof this._frame != 'undefined') {
					this._frame.parentNode.removeChild(this._frame);
				}  // otherwise farme is not yet created
			}
		}

	}


	if (isNode) {
		initNode();
		basicConnectionNode();
	} else {
		initWeb();
		basicConnectionWeb();
	}



	/**
	 * Application-site Connection object constructon, reuses the
	 * platform-dependent BasicConnection declared above in order to
	 * communicate with the plugin environment, implements the
	 * application-site protocol of the interraction: provides some
	 * methods for loading scripts and executing the given code in the
	 * plugin
	 */
	var Connection = function(){
		this._platformConnection = new BasicConnection;

		this._importCallbacks = {};
		this._executeSCb = function(){};
		this._executeFCb = function(){};
		this._messageHandler = function(){};

		var me = this;
		this.whenInit = function(cb){
			me._platformConnection.whenInit(cb);
		};

		this._platformConnection.onMessage(function(m) {
			switch(m.type) {
				case 'message':
					me._messageHandler(m.data);
					break;
				case 'importSuccess':
					me._handleImportSuccess(m.url);
					break;
				case 'importFailure':
					me._handleImportFailure(m.url);
					break;
				case 'executeSuccess':
					me._executeSCb();
					break;
				case 'executeFailure':
					me._executeFCb();
					break;
			}
		});
	}


	/**
	 * Tells the plugin to load a script with the given path, and to
	 * execute it. Callbacks executed upon the corresponding responce
	 * message from the plugin site
	 *
	 * @param {String} path of a script to load
	 * @param {Function} sCb to call upon success
	 * @param {Function} fCb to call upon failure
	 */
	Connection.prototype.importScript = function(path, sCb, fCb) {
		var f = function(){};
		this._importCallbacks[path] = {sCb: sCb||f, fCb: fCb||f};
		this._platformConnection.send({type: 'import', url: path});
	}


	/**
	 * Tells the plugin to load a script with the given path, and to
	 * execute it in the JAILED environment. Callbacks executed upon
	 * the corresponding responce message from the plugin site
	 *
	 * @param {String} path of a script to load
	 * @param {Function} sCb to call upon success
	 * @param {Function} fCb to call upon failure
	 */
	Connection.prototype.importJailedScript = function(path, sCb, fCb) {
		var f = function(){};
		this._importCallbacks[path] = {sCb: sCb||f, fCb: fCb||f};
		this._platformConnection.send({type: 'importJailed', url: path});
	}


	/**
	 * Sends the code to the plugin site in order to have it executed
	 * in the JAILED enviroment. Assuming the execution may only be
	 * requested once by the Plugin object, which means a single set
	 * of callbacks is enough (unlike importing additional scripts)
	 *
	 * @param {String} code code to execute
	 * @param {Function} sCb to call upon success
	 * @param {Function} fCb to call upon failure
	 */
	Connection.prototype.execute = function(code, sCb, fCb) {
		this._executeSCb = sCb||function(){};
		this._executeFCb = fCb||function(){};
		this._platformConnection.send({type: 'execute', code: code});
	}


	/**
	 * Adds a handler for a message received from the plugin site
	 *
	 * @param {Function} handler to call upon a message
	 */
	Connection.prototype.onMessage = function(handler) {
		this._messageHandler = handler;
	}


	/**
	 * Adds a handler for a disconnect message received from the
	 * plugin site
	 *
	 * @param {Function} handler to call upon disconnect
	 */
	Connection.prototype.onDisconnect = function(handler) {
		this._platformConnection.onDisconnect(handler);
	}


	/**
	 * Sends a message to the plugin
	 *
	 * @param {Object} data of the message to send
	 */
	Connection.prototype.send = function(data) {
		this._platformConnection.send({
			type: 'message',
			data: data
		});
	}


	/**
	 * Handles import succeeded message from the plugin
	 *
	 * @param {String} url of a script loaded by the plugin
	 */
	Connection.prototype._handleImportSuccess = function(url) {
		var sCb = this._importCallbacks[url].sCb;
		this._importCallbacks[url] = null;
		delete this._importCallbacks[url];
		sCb();
	}


	/**
	 * Handles import failure message from the plugin
	 *
	 * @param {String} url of a script loaded by the plugin
	 */
	Connection.prototype._handleImportFailure = function(url) {
		var fCb = this._importCallbacks[url].fCb;
		this._importCallbacks[url] = null;
		delete this._importCallbacks[url];
		fCb();
	}


	/**
	 * Disconnects the plugin when it is not needed anymore
	 */
	Connection.prototype.disconnect = function() {
		this._platformConnection.disconnect();
	}




	/**
	 * Plugin constructor, represents a plugin initialized by a script
	 * with the given path
	 *
	 * @param {String} url of a plugin source
	 * @param {Object} _interface to provide for the plugin
	 */
	var Plugin = function(url, _interface) {
		this._path = url;
		this._initialInterface = _interface||{};
		this._connect();
	}


	/**
	 * DynamicPlugin constructor, represents a plugin initialized by a
	 * string containing the code to be executed
	 *
	 * @param {String} code of the plugin
	 * @param {Object} _interface to provide to the plugin
	 */
	var DynamicPlugin = function(code, _interface) {
		this._code = code;
		this._initialInterface = _interface||{};
		this._connect();
	}


	/**
	 * Creates the connection to the plugin site
	 */
	DynamicPlugin.prototype._connect =
		Plugin.prototype._connect = function() {
			this.remote = null;

			this._connect    = new Whenable;
			this._fail       = new Whenable;
			this._disconnect = new Whenable;

			var me = this;

			// binded failure callback
			this._fCb = function(){
				me._fail.emit();
				me.disconnect();
			}

			this._connection = new Connection;
			this._connection.whenInit(function(){
				me._init();
			});
		}


	/**
	 * Creates the Site object for the plugin, and then loads the
	 * common routines (_JailedSite.js)
	 */
	DynamicPlugin.prototype._init =
		Plugin.prototype._init = function() {
			this._site = new JailedSite(this._connection);

			var me = this;
			this._site.onDisconnect(function() {
				me._disconnect.emit();
			});

			var sCb = function() {
				me._loadCore();
			}

			this._connection.importScript(
				__jailed__path__+'_JailedSite.js', sCb, this._fCb
			);
		}


	/**
	 * Loads the core scirpt into the plugin
	 */
	DynamicPlugin.prototype._loadCore =
		Plugin.prototype._loadCore = function() {
			var me = this;
			var sCb = function() {
				me._sendInterface();
			}

			this._connection.importScript(
				__jailed__path__+'_pluginCore.js', sCb, this._fCb
			);
		}


	/**
	 * Sends to the remote site a signature of the interface provided
	 * upon the Plugin creation
	 */
	DynamicPlugin.prototype._sendInterface =
		Plugin.prototype._sendInterface = function() {
			var me = this;
			this._site.onInterfaceSetAsRemote(function() {
				if (!me._connected) {
					me._loadPlugin();
				}
			});

			this._site.setInterface(this._initialInterface);
		}


	/**
	 * Loads the plugin body (loads the plugin url in case of the
	 * Plugin)
	 */
	Plugin.prototype._loadPlugin = function() {
		var me = this;
		var sCb = function() {
			me._requestRemote();
		}

		this._connection.importJailedScript(this._path, sCb, this._fCb);
	}


	/**
	 * Loads the plugin body (executes the code in case of the
	 * DynamicPlugin)
	 */
	DynamicPlugin.prototype._loadPlugin = function() {
		var me = this;
		var sCb = function() {
			me._requestRemote();
		}

		this._connection.execute(this._code, sCb, this._fCb);
	}


	/**
	 * Requests the remote interface from the plugin (which was
	 * probably set by the plugin during its initialization), emits
	 * the connect event when done, then the plugin is fully usable
	 * (meaning both the plugin and the application can use the
	 * interfaces provided to each other)
	 */
	DynamicPlugin.prototype._requestRemote =
		Plugin.prototype._requestRemote = function() {
			var me = this;
			this._site.onRemoteUpdate(function(){
				me.remote = me._site.getRemote();
				me._connect.emit();
			});

			this._site.requestRemote();
		}


	/**
	 * Disconnects the plugin immideately
	 */
	DynamicPlugin.prototype.disconnect =
		Plugin.prototype.disconnect = function() {
			this._connection.disconnect();
			this._disconnect.emit();
		}


	/**
	 * Saves the provided function as a handler for the connection
	 * failure Whenable event
	 *
	 * @param {Function} handler to be issued upon disconnect
	 */
	DynamicPlugin.prototype.whenFailed =
		Plugin.prototype.whenFailed = function(handler) {
			this._fail.whenEmitted(handler);
		}


	/**
	 * Saves the provided function as a handler for the connection
	 * success Whenable event
	 *
	 * @param {Function} handler to be issued upon connection
	 */
	DynamicPlugin.prototype.whenConnected =
		Plugin.prototype.whenConnected = function(handler) {
			this._connect.whenEmitted(handler);
		}


	/**
	 * Saves the provided function as a handler for the connection
	 * failure Whenable event
	 *
	 * @param {Function} handler to be issued upon connection failure
	 */
	DynamicPlugin.prototype.whenDisconnected =
		Plugin.prototype.whenDisconnected = function(handler) {
			this._disconnect.whenEmitted(handler);
		}



	exports.Plugin = Plugin;
	exports.DynamicPlugin = DynamicPlugin;

}));


}).call(this,require('_process'),"/temp\\modules\\jailed")
},{"./_JailedSite.js":3,"_process":2,"child_process":1}],5:[function(require,module,exports){
if (!String.prototype.startsWith) {
	String.prototype.startsWith = function(searchString, position) {
		position = position || 0;
		return this.lastIndexOf(searchString, position) === position;
	};
}
////////////////////////////////
// Copyright 2011 Google Inc.
//
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//     http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.
var __extends = this.__extends || function (d, b) {
		for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
		function __() { this.constructor = d; }
		__.prototype = b.prototype;
		d.prototype = new __();
	};
var MutationObserverCtor;
if (typeof WebKitMutationObserver !== 'undefined')
	MutationObserverCtor = WebKitMutationObserver;
else
	MutationObserverCtor = MutationObserver;
if (MutationObserverCtor === undefined) {
	console.error('DOM Mutation Observers are required.');
	console.error('https://developer.mozilla.org/en-US/docs/DOM/MutationObserver');
	throw Error('DOM Mutation Observers are required');
}
var NodeMap = (function () {
	function NodeMap() {
		this.nodes = [];
		this.values = [];
	}
	NodeMap.prototype.isIndex = function (s) {
		return +s === s >>> 0;
	};
	NodeMap.prototype.nodeId = function (node) {
		var id = node[NodeMap.ID_PROP];
		if (!id)
			id = node[NodeMap.ID_PROP] = NodeMap.nextId_++;
		return id;
	};
	NodeMap.prototype.set = function (node, value) {
		var id = this.nodeId(node);
		this.nodes[id] = node;
		this.values[id] = value;
	};
	NodeMap.prototype.get = function (node) {
		var id = this.nodeId(node);
		return this.values[id];
	};
	NodeMap.prototype.has = function (node) {
		return this.nodeId(node) in this.nodes;
	};
	NodeMap.prototype.delete = function (node) {
		var id = this.nodeId(node);
		delete this.nodes[id];
		this.values[id] = undefined;
	};
	NodeMap.prototype.keys = function () {
		var nodes = [];
		for (var id in this.nodes) {
			if (!this.isIndex(id))
				continue;
			nodes.push(this.nodes[id]);
		}
		return nodes;
	};
	NodeMap.ID_PROP = '__mutation_summary_node_map_id__';
	NodeMap.nextId_ = 1;
	return NodeMap;
})();
/**
 *  var reachableMatchableProduct = [
 *  //  STAYED_OUT,  ENTERED,     STAYED_IN,   EXITED
 *    [ STAYED_OUT,  STAYED_OUT,  STAYED_OUT,  STAYED_OUT ], // STAYED_OUT
 *    [ STAYED_OUT,  ENTERED,     ENTERED,     STAYED_OUT ], // ENTERED
 *    [ STAYED_OUT,  ENTERED,     STAYED_IN,   EXITED     ], // STAYED_IN
 *    [ STAYED_OUT,  STAYED_OUT,  EXITED,      EXITED     ]  // EXITED
 *  ];
 */
var Movement;
(function (Movement) {
	Movement[Movement["STAYED_OUT"] = 0] = "STAYED_OUT";
	Movement[Movement["ENTERED"] = 1] = "ENTERED";
	Movement[Movement["STAYED_IN"] = 2] = "STAYED_IN";
	Movement[Movement["REPARENTED"] = 3] = "REPARENTED";
	Movement[Movement["REORDERED"] = 4] = "REORDERED";
	Movement[Movement["EXITED"] = 5] = "EXITED";
})(Movement || (Movement = {}));
function enteredOrExited(changeType) {
	return changeType === Movement.ENTERED || changeType === Movement.EXITED;
}
var NodeChange = (function () {
	function NodeChange(node, childList, attributes, characterData, oldParentNode, added, attributeOldValues, characterDataOldValue) {
		if (childList === void 0) { childList = false; }
		if (attributes === void 0) { attributes = false; }
		if (characterData === void 0) { characterData = false; }
		if (oldParentNode === void 0) { oldParentNode = null; }
		if (added === void 0) { added = false; }
		if (attributeOldValues === void 0) { attributeOldValues = null; }
		if (characterDataOldValue === void 0) { characterDataOldValue = null; }
		this.node = node;
		this.childList = childList;
		this.attributes = attributes;
		this.characterData = characterData;
		this.oldParentNode = oldParentNode;
		this.added = added;
		this.attributeOldValues = attributeOldValues;
		this.characterDataOldValue = characterDataOldValue;
		this.isCaseInsensitive =
			this.node.nodeType === Node.ELEMENT_NODE &&
			this.node instanceof HTMLElement &&
			this.node.ownerDocument instanceof HTMLDocument;
	}
	NodeChange.prototype.getAttributeOldValue = function (name) {
		if (!this.attributeOldValues)
			return undefined;
		if (this.isCaseInsensitive)
			name = name.toLowerCase();
		return this.attributeOldValues[name];
	};
	NodeChange.prototype.getAttributeNamesMutated = function () {
		var names = [];
		if (!this.attributeOldValues)
			return names;
		for (var name in this.attributeOldValues) {
			names.push(name);
		}
		return names;
	};
	NodeChange.prototype.attributeMutated = function (name, oldValue) {
		this.attributes = true;
		this.attributeOldValues = this.attributeOldValues || {};
		if (name in this.attributeOldValues)
			return;
		this.attributeOldValues[name] = oldValue;
	};
	NodeChange.prototype.characterDataMutated = function (oldValue) {
		if (this.characterData)
			return;
		this.characterData = true;
		this.characterDataOldValue = oldValue;
	};
	// Note: is it possible to receive a removal followed by a removal. This
	// can occur if the removed node is added to an non-observed node, that
	// node is added to the observed area, and then the node removed from
	// it.
	NodeChange.prototype.removedFromParent = function (parent) {
		this.childList = true;
		if (this.added || this.oldParentNode)
			this.added = false;
		else
			this.oldParentNode = parent;
	};
	NodeChange.prototype.insertedIntoParent = function () {
		this.childList = true;
		this.added = true;
	};
	// An node's oldParent is
	//   -its present parent, if its parentNode was not changed.
	//   -null if the first thing that happened to it was an add.
	//   -the node it was removed from if the first thing that happened to it
	//      was a remove.
	NodeChange.prototype.getOldParent = function () {
		if (this.childList) {
			if (this.oldParentNode)
				return this.oldParentNode;
			if (this.added)
				return null;
		}
		return this.node.parentNode;
	};
	return NodeChange;
})();
var ChildListChange = (function () {
	function ChildListChange() {
		this.added = new NodeMap();
		this.removed = new NodeMap();
		this.maybeMoved = new NodeMap();
		this.oldPrevious = new NodeMap();
		this.moved = undefined;
	}
	return ChildListChange;
})();
var TreeChanges = (function (_super) {
	__extends(TreeChanges, _super);
	function TreeChanges(rootNode, mutations) {
		_super.call(this);
		this.rootNode = rootNode;
		this.reachableCache = undefined;
		this.wasReachableCache = undefined;
		this.anyParentsChanged = false;
		this.anyAttributesChanged = false;
		this.anyCharacterDataChanged = false;
		for (var m = 0; m < mutations.length; m++) {
			var mutation = mutations[m];
			switch (mutation.type) {
				case 'childList':
					this.anyParentsChanged = true;
					for (var i = 0; i < mutation.removedNodes.length; i++) {
						var node = mutation.removedNodes[i];
						this.getChange(node).removedFromParent(mutation.target);
					}
					for (var i = 0; i < mutation.addedNodes.length; i++) {
						var node = mutation.addedNodes[i];
						this.getChange(node).insertedIntoParent();
					}
					break;
				case 'attributes':
					this.anyAttributesChanged = true;
					var change = this.getChange(mutation.target);
					change.attributeMutated(mutation.attributeName, mutation.oldValue);
					break;
				case 'characterData':
					this.anyCharacterDataChanged = true;
					var change = this.getChange(mutation.target);
					change.characterDataMutated(mutation.oldValue);
					break;
			}
		}
	}
	TreeChanges.prototype.getChange = function (node) {
		var change = this.get(node);
		if (!change) {
			change = new NodeChange(node);
			this.set(node, change);
		}
		return change;
	};
	TreeChanges.prototype.getOldParent = function (node) {
		var change = this.get(node);
		return change ? change.getOldParent() : node.parentNode;
	};
	TreeChanges.prototype.getIsReachable = function (node) {
		if (node === this.rootNode)
			return true;
		if (!node)
			return false;
		this.reachableCache = this.reachableCache || new NodeMap();
		var isReachable = this.reachableCache.get(node);
		if (isReachable === undefined) {
			isReachable = this.getIsReachable(node.parentNode);
			this.reachableCache.set(node, isReachable);
		}
		return isReachable;
	};
	// A node wasReachable if its oldParent wasReachable.
	TreeChanges.prototype.getWasReachable = function (node) {
		if (node === this.rootNode)
			return true;
		if (!node)
			return false;
		this.wasReachableCache = this.wasReachableCache || new NodeMap();
		var wasReachable = this.wasReachableCache.get(node);
		if (wasReachable === undefined) {
			wasReachable = this.getWasReachable(this.getOldParent(node));
			this.wasReachableCache.set(node, wasReachable);
		}
		return wasReachable;
	};
	TreeChanges.prototype.reachabilityChange = function (node) {
		if (this.getIsReachable(node)) {
			return this.getWasReachable(node) ?
				Movement.STAYED_IN : Movement.ENTERED;
		}
		return this.getWasReachable(node) ?
			Movement.EXITED : Movement.STAYED_OUT;
	};
	return TreeChanges;
})(NodeMap);
var MutationProjection = (function () {
	// TOOD(any)
	function MutationProjection(rootNode, mutations, selectors, calcReordered, calcOldPreviousSibling) {
		this.rootNode = rootNode;
		this.mutations = mutations;
		this.selectors = selectors;
		this.calcReordered = calcReordered;
		this.calcOldPreviousSibling = calcOldPreviousSibling;
		this.treeChanges = new TreeChanges(rootNode, mutations);
		this.entered = [];
		this.exited = [];
		this.stayedIn = new NodeMap();
		this.visited = new NodeMap();
		this.childListChangeMap = undefined;
		this.characterDataOnly = undefined;
		this.matchCache = undefined;
		this.processMutations();
	}
	MutationProjection.prototype.processMutations = function () {
		if (!this.treeChanges.anyParentsChanged &&
			!this.treeChanges.anyAttributesChanged)
			return;
		var changedNodes = this.treeChanges.keys();
		for (var i = 0; i < changedNodes.length; i++) {
			this.visitNode(changedNodes[i], undefined);
		}
	};
	MutationProjection.prototype.visitNode = function (node, parentReachable) {
		if (this.visited.has(node))
			return;
		this.visited.set(node, true);
		var change = this.treeChanges.get(node);
		var reachable = parentReachable;
		// node inherits its parent's reachability change unless
		// its parentNode was mutated.
		if ((change && change.childList) || reachable == undefined)
			reachable = this.treeChanges.reachabilityChange(node);
		if (reachable === Movement.STAYED_OUT)
			return;
		// Cache match results for sub-patterns.
		this.matchabilityChange(node);
		if (reachable === Movement.ENTERED) {
			this.entered.push(node);
		}
		else if (reachable === Movement.EXITED) {
			this.exited.push(node);
			this.ensureHasOldPreviousSiblingIfNeeded(node);
		}
		else if (reachable === Movement.STAYED_IN) {
			var movement = Movement.STAYED_IN;
			if (change && change.childList) {
				if (change.oldParentNode !== node.parentNode) {
					movement = Movement.REPARENTED;
					this.ensureHasOldPreviousSiblingIfNeeded(node);
				}
				else if (this.calcReordered && this.wasReordered(node)) {
					movement = Movement.REORDERED;
				}
			}
			this.stayedIn.set(node, movement);
		}
		if (reachable === Movement.STAYED_IN)
			return;
		// reachable === ENTERED || reachable === EXITED.
		for (var child = node.firstChild; child; child = child.nextSibling) {
			this.visitNode(child, reachable);
		}
	};
	MutationProjection.prototype.ensureHasOldPreviousSiblingIfNeeded = function (node) {
		if (!this.calcOldPreviousSibling)
			return;
		this.processChildlistChanges();
		var parentNode = node.parentNode;
		var nodeChange = this.treeChanges.get(node);
		if (nodeChange && nodeChange.oldParentNode)
			parentNode = nodeChange.oldParentNode;
		var change = this.childListChangeMap.get(parentNode);
		if (!change) {
			change = new ChildListChange();
			this.childListChangeMap.set(parentNode, change);
		}
		if (!change.oldPrevious.has(node)) {
			change.oldPrevious.set(node, node.previousSibling);
		}
	};
	MutationProjection.prototype.getChanged = function (summary, selectors, characterDataOnly) {
		this.selectors = selectors;
		this.characterDataOnly = characterDataOnly;
		for (var i = 0; i < this.entered.length; i++) {
			var node = this.entered[i];
			var matchable = this.matchabilityChange(node);
			if (matchable === Movement.ENTERED || matchable === Movement.STAYED_IN)
				summary.added.push(node);
		}
		var stayedInNodes = this.stayedIn.keys();
		for (var i = 0; i < stayedInNodes.length; i++) {
			var node = stayedInNodes[i];
			var matchable = this.matchabilityChange(node);
			if (matchable === Movement.ENTERED) {
				summary.added.push(node);
			}
			else if (matchable === Movement.EXITED) {
				summary.removed.push(node);
			}
			else if (matchable === Movement.STAYED_IN && (summary.reparented || summary.reordered)) {
				var movement = this.stayedIn.get(node);
				if (summary.reparented && movement === Movement.REPARENTED)
					summary.reparented.push(node);
				else if (summary.reordered && movement === Movement.REORDERED)
					summary.reordered.push(node);
			}
		}
		for (var i = 0; i < this.exited.length; i++) {
			var node = this.exited[i];
			var matchable = this.matchabilityChange(node);
			if (matchable === Movement.EXITED || matchable === Movement.STAYED_IN)
				summary.removed.push(node);
		}
	};
	MutationProjection.prototype.getOldParentNode = function (node) {
		var change = this.treeChanges.get(node);
		if (change && change.childList)
			return change.oldParentNode ? change.oldParentNode : null;
		var reachabilityChange = this.treeChanges.reachabilityChange(node);
		if (reachabilityChange === Movement.STAYED_OUT || reachabilityChange === Movement.ENTERED)
			throw Error('getOldParentNode requested on invalid node.');
		return node.parentNode;
	};
	MutationProjection.prototype.getOldPreviousSibling = function (node) {
		var parentNode = node.parentNode;
		var nodeChange = this.treeChanges.get(node);
		if (nodeChange && nodeChange.oldParentNode)
			parentNode = nodeChange.oldParentNode;
		var change = this.childListChangeMap.get(parentNode);
		if (!change)
			throw Error('getOldPreviousSibling requested on invalid node.');
		return change.oldPrevious.get(node);
	};
	MutationProjection.prototype.getOldAttribute = function (element, attrName) {
		var change = this.treeChanges.get(element);
		if (!change || !change.attributes)
			throw Error('getOldAttribute requested on invalid node.');
		var value = change.getAttributeOldValue(attrName);
		if (value === undefined)
			throw Error('getOldAttribute requested for unchanged attribute name.');
		return value;
	};
	MutationProjection.prototype.attributeChangedNodes = function (includeAttributes) {
		if (!this.treeChanges.anyAttributesChanged)
			return {}; // No attributes mutations occurred.
		var attributeFilter;
		var caseInsensitiveFilter;
		if (includeAttributes) {
			attributeFilter = {};
			caseInsensitiveFilter = {};
			for (var i = 0; i < includeAttributes.length; i++) {
				var attrName = includeAttributes[i];
				attributeFilter[attrName] = true;
				caseInsensitiveFilter[attrName.toLowerCase()] = attrName;
			}
		}
		var result = {};
		var nodes = this.treeChanges.keys();
		for (var i = 0; i < nodes.length; i++) {
			var node = nodes[i];
			var change = this.treeChanges.get(node);
			if (!change.attributes)
				continue;
			if (Movement.STAYED_IN !== this.treeChanges.reachabilityChange(node) ||
				Movement.STAYED_IN !== this.matchabilityChange(node)) {
				continue;
			}
			var element = node;
			var changedAttrNames = change.getAttributeNamesMutated();
			for (var j = 0; j < changedAttrNames.length; j++) {
				var attrName = changedAttrNames[j];
				if (attributeFilter &&
					!attributeFilter[attrName] &&
					!(change.isCaseInsensitive && caseInsensitiveFilter[attrName])) {
					continue;
				}
				var oldValue = change.getAttributeOldValue(attrName);
				if (oldValue === element.getAttribute(attrName))
					continue;
				if (caseInsensitiveFilter && change.isCaseInsensitive)
					attrName = caseInsensitiveFilter[attrName];
				result[attrName] = result[attrName] || [];
				result[attrName].push(element);
			}
		}
		return result;
	};
	MutationProjection.prototype.getOldCharacterData = function (node) {
		var change = this.treeChanges.get(node);
		if (!change || !change.characterData)
			throw Error('getOldCharacterData requested on invalid node.');
		return change.characterDataOldValue;
	};
	MutationProjection.prototype.getCharacterDataChanged = function () {
		if (!this.treeChanges.anyCharacterDataChanged)
			return []; // No characterData mutations occurred.
		var nodes = this.treeChanges.keys();
		var result = [];
		for (var i = 0; i < nodes.length; i++) {
			var target = nodes[i];
			if (Movement.STAYED_IN !== this.treeChanges.reachabilityChange(target))
				continue;
			var change = this.treeChanges.get(target);
			if (!change.characterData ||
				target.textContent == change.characterDataOldValue)
				continue;
			result.push(target);
		}
		return result;
	};
	MutationProjection.prototype.computeMatchabilityChange = function (selector, el) {
		if (!this.matchCache)
			this.matchCache = [];
		if (!this.matchCache[selector.uid])
			this.matchCache[selector.uid] = new NodeMap();
		var cache = this.matchCache[selector.uid];
		var result = cache.get(el);
		if (result === undefined) {
			result = selector.matchabilityChange(el, this.treeChanges.get(el));
			cache.set(el, result);
		}
		return result;
	};
	MutationProjection.prototype.matchabilityChange = function (node) {
		var _this = this;
		// TODO(rafaelw): Include PI, CDATA?
		// Only include text nodes.
		if (this.characterDataOnly) {
			switch (node.nodeType) {
				case Node.COMMENT_NODE:
				case Node.TEXT_NODE:
					return Movement.STAYED_IN;
				default:
					return Movement.STAYED_OUT;
			}
		}
		// No element filter. Include all nodes.
		if (!this.selectors)
			return Movement.STAYED_IN;
		// Element filter. Exclude non-elements.
		if (node.nodeType !== Node.ELEMENT_NODE)
			return Movement.STAYED_OUT;
		var el = node;
		var matchChanges = this.selectors.map(function (selector) {
			return _this.computeMatchabilityChange(selector, el);
		});
		var accum = Movement.STAYED_OUT;
		var i = 0;
		while (accum !== Movement.STAYED_IN && i < matchChanges.length) {
			switch (matchChanges[i]) {
				case Movement.STAYED_IN:
					accum = Movement.STAYED_IN;
					break;
				case Movement.ENTERED:
					if (accum === Movement.EXITED)
						accum = Movement.STAYED_IN;
					else
						accum = Movement.ENTERED;
					break;
				case Movement.EXITED:
					if (accum === Movement.ENTERED)
						accum = Movement.STAYED_IN;
					else
						accum = Movement.EXITED;
					break;
			}
			i++;
		}
		return accum;
	};
	MutationProjection.prototype.getChildlistChange = function (el) {
		var change = this.childListChangeMap.get(el);
		if (!change) {
			change = new ChildListChange();
			this.childListChangeMap.set(el, change);
		}
		return change;
	};
	MutationProjection.prototype.processChildlistChanges = function () {
		if (this.childListChangeMap)
			return;
		this.childListChangeMap = new NodeMap();
		for (var i = 0; i < this.mutations.length; i++) {
			var mutation = this.mutations[i];
			if (mutation.type != 'childList')
				continue;
			if (this.treeChanges.reachabilityChange(mutation.target) !== Movement.STAYED_IN &&
				!this.calcOldPreviousSibling)
				continue;
			var change = this.getChildlistChange(mutation.target);
			var oldPrevious = mutation.previousSibling;
			function recordOldPrevious(node, previous) {
				if (!node ||
					change.oldPrevious.has(node) ||
					change.added.has(node) ||
					change.maybeMoved.has(node))
					return;
				if (previous &&
					(change.added.has(previous) ||
					change.maybeMoved.has(previous)))
					return;
				change.oldPrevious.set(node, previous);
			}
			for (var j = 0; j < mutation.removedNodes.length; j++) {
				var node = mutation.removedNodes[j];
				recordOldPrevious(node, oldPrevious);
				if (change.added.has(node)) {
					change.added.delete(node);
				}
				else {
					change.removed.set(node, true);
					change.maybeMoved.delete(node);
				}
				oldPrevious = node;
			}
			recordOldPrevious(mutation.nextSibling, oldPrevious);
			for (var j = 0; j < mutation.addedNodes.length; j++) {
				var node = mutation.addedNodes[j];
				if (change.removed.has(node)) {
					change.removed.delete(node);
					change.maybeMoved.set(node, true);
				}
				else {
					change.added.set(node, true);
				}
			}
		}
	};
	MutationProjection.prototype.wasReordered = function (node) {
		if (!this.treeChanges.anyParentsChanged)
			return false;
		this.processChildlistChanges();
		var parentNode = node.parentNode;
		var nodeChange = this.treeChanges.get(node);
		if (nodeChange && nodeChange.oldParentNode)
			parentNode = nodeChange.oldParentNode;
		var change = this.childListChangeMap.get(parentNode);
		if (!change)
			return false;
		if (change.moved)
			return change.moved.get(node);
		change.moved = new NodeMap();
		var pendingMoveDecision = new NodeMap();
		function isMoved(node) {
			if (!node)
				return false;
			if (!change.maybeMoved.has(node))
				return false;
			var didMove = change.moved.get(node);
			if (didMove !== undefined)
				return didMove;
			if (pendingMoveDecision.has(node)) {
				didMove = true;
			}
			else {
				pendingMoveDecision.set(node, true);
				didMove = getPrevious(node) !== getOldPrevious(node);
			}
			if (pendingMoveDecision.has(node)) {
				pendingMoveDecision.delete(node);
				change.moved.set(node, didMove);
			}
			else {
				didMove = change.moved.get(node);
			}
			return didMove;
		}
		var oldPreviousCache = new NodeMap();
		function getOldPrevious(node) {
			var oldPrevious = oldPreviousCache.get(node);
			if (oldPrevious !== undefined)
				return oldPrevious;
			oldPrevious = change.oldPrevious.get(node);
			while (oldPrevious &&
			(change.removed.has(oldPrevious) || isMoved(oldPrevious))) {
				oldPrevious = getOldPrevious(oldPrevious);
			}
			if (oldPrevious === undefined)
				oldPrevious = node.previousSibling;
			oldPreviousCache.set(node, oldPrevious);
			return oldPrevious;
		}
		var previousCache = new NodeMap();
		function getPrevious(node) {
			if (previousCache.has(node))
				return previousCache.get(node);
			var previous = node.previousSibling;
			while (previous && (change.added.has(previous) || isMoved(previous)))
				previous = previous.previousSibling;
			previousCache.set(node, previous);
			return previous;
		}
		change.maybeMoved.keys().forEach(isMoved);
		return change.moved.get(node);
	};
	return MutationProjection;
})();
var Summary = (function () {
	function Summary(projection, query) {
		var _this = this;
		this.projection = projection;
		this.added = [];
		this.removed = [];
		this.reparented = query.all || query.element || query.characterData ? [] : undefined;
		this.reordered = query.all ? [] : undefined;
		projection.getChanged(this, query.elementFilter, query.characterData);
		if (query.all || query.attribute || query.attributeList) {
			var filter = query.attribute ? [query.attribute] : query.attributeList;
			var attributeChanged = projection.attributeChangedNodes(filter);
			if (query.attribute) {
				this.valueChanged = attributeChanged[query.attribute] || [];
			}
			else {
				this.attributeChanged = attributeChanged;
				if (query.attributeList) {
					query.attributeList.forEach(function (attrName) {
						if (!_this.attributeChanged.hasOwnProperty(attrName))
							_this.attributeChanged[attrName] = [];
					});
				}
			}
		}
		if (query.all || query.characterData) {
			var characterDataChanged = projection.getCharacterDataChanged();
			if (query.characterData)
				this.valueChanged = characterDataChanged;
			else
				this.characterDataChanged = characterDataChanged;
		}
		if (this.reordered)
			this.getOldPreviousSibling = projection.getOldPreviousSibling.bind(projection);
	}
	Summary.prototype.getOldParentNode = function (node) {
		return this.projection.getOldParentNode(node);
	};
	Summary.prototype.getOldAttribute = function (node, name) {
		return this.projection.getOldAttribute(node, name);
	};
	Summary.prototype.getOldCharacterData = function (node) {
		return this.projection.getOldCharacterData(node);
	};
	Summary.prototype.getOldPreviousSibling = function (node) {
		return this.projection.getOldPreviousSibling(node);
	};
	return Summary;
})();
// TODO(rafaelw): Allow ':' and '.' as valid name characters.
var validNameInitialChar = /[a-zA-Z_]+/;
var validNameNonInitialChar = /[a-zA-Z0-9_\-]+/;
// TODO(rafaelw): Consider allowing backslash in the attrValue.
// TODO(rafaelw): There's got a to be way to represent this state machine
// more compactly???
function escapeQuotes(value) {
	return '"' + value.replace(/"/, '\\\"') + '"';
}
var Qualifier = (function () {
	function Qualifier() {
	}
	Qualifier.prototype.matches = function (oldValue) {
		if (oldValue === null)
			return false;
		if (this.attrValue === undefined)
			return true;
		if (!this.contains)
			return this.attrValue == oldValue;
		var tokens = oldValue.split(' ');
		for (var i = 0; i < tokens.length; i++) {
			if (this.attrValue === tokens[i])
				return true;
		}
		return false;
	};
	Qualifier.prototype.toString = function () {
		if (this.attrName === 'class' && this.contains)
			return '.' + this.attrValue;
		if (this.attrName === 'id' && !this.contains)
			return '#' + this.attrValue;
		if (this.contains)
			return '[' + this.attrName + '~=' + escapeQuotes(this.attrValue) + ']';
		if ('attrValue' in this)
			return '[' + this.attrName + '=' + escapeQuotes(this.attrValue) + ']';
		return '[' + this.attrName + ']';
	};
	return Qualifier;
})();
var Selector = (function () {
	function Selector() {
		this.uid = Selector.nextUid++;
		this.qualifiers = [];
	}
	Object.defineProperty(Selector.prototype, "caseInsensitiveTagName", {
		get: function () {
			return this.tagName.toUpperCase();
		},
		enumerable: true,
		configurable: true
	});
	Object.defineProperty(Selector.prototype, "selectorString", {
		get: function () {
			return this.tagName + this.qualifiers.join('');
		},
		enumerable: true,
		configurable: true
	});
	Selector.prototype.isMatching = function (el) {
		return el[Selector.matchesSelector](this.selectorString);
	};
	Selector.prototype.wasMatching = function (el, change, isMatching) {
		if (!change || !change.attributes)
			return isMatching;
		var tagName = change.isCaseInsensitive ? this.caseInsensitiveTagName : this.tagName;
		if (tagName !== '*' && tagName !== el.tagName)
			return false;
		var attributeOldValues = [];
		var anyChanged = false;
		for (var i = 0; i < this.qualifiers.length; i++) {
			var qualifier = this.qualifiers[i];
			var oldValue = change.getAttributeOldValue(qualifier.attrName);
			attributeOldValues.push(oldValue);
			anyChanged = anyChanged || (oldValue !== undefined);
		}
		if (!anyChanged)
			return isMatching;
		for (var i = 0; i < this.qualifiers.length; i++) {
			var qualifier = this.qualifiers[i];
			var oldValue = attributeOldValues[i];
			if (oldValue === undefined)
				oldValue = el.getAttribute(qualifier.attrName);
			if (!qualifier.matches(oldValue))
				return false;
		}
		return true;
	};
	Selector.prototype.matchabilityChange = function (el, change) {
		var isMatching = this.isMatching(el);
		if (isMatching)
			return this.wasMatching(el, change, isMatching) ? Movement.STAYED_IN : Movement.ENTERED;
		else
			return this.wasMatching(el, change, isMatching) ? Movement.EXITED : Movement.STAYED_OUT;
	};
	Selector.parseSelectors = function (input) {
		var selectors = [];
		var currentSelector;
		var currentQualifier;
		function newSelector() {
			if (currentSelector) {
				if (currentQualifier) {
					currentSelector.qualifiers.push(currentQualifier);
					currentQualifier = undefined;
				}
				selectors.push(currentSelector);
			}
			currentSelector = new Selector();
		}
		function newQualifier() {
			if (currentQualifier)
				currentSelector.qualifiers.push(currentQualifier);
			currentQualifier = new Qualifier();
		}
		var WHITESPACE = /\s/;
		var valueQuoteChar;
		var SYNTAX_ERROR = 'Invalid or unsupported selector syntax.';
		var SELECTOR = 1;
		var TAG_NAME = 2;
		var QUALIFIER = 3;
		var QUALIFIER_NAME_FIRST_CHAR = 4;
		var QUALIFIER_NAME = 5;
		var ATTR_NAME_FIRST_CHAR = 6;
		var ATTR_NAME = 7;
		var EQUIV_OR_ATTR_QUAL_END = 8;
		var EQUAL = 9;
		var ATTR_QUAL_END = 10;
		var VALUE_FIRST_CHAR = 11;
		var VALUE = 12;
		var QUOTED_VALUE = 13;
		var SELECTOR_SEPARATOR = 14;
		var state = SELECTOR;
		var i = 0;
		while (i < input.length) {
			var c = input[i++];
			switch (state) {
				case SELECTOR:
					if (c.match(validNameInitialChar)) {
						newSelector();
						currentSelector.tagName = c;
						state = TAG_NAME;
						break;
					}
					if (c == '*') {
						newSelector();
						currentSelector.tagName = '*';
						state = QUALIFIER;
						break;
					}
					if (c == '.') {
						newSelector();
						newQualifier();
						currentSelector.tagName = '*';
						currentQualifier.attrName = 'class';
						currentQualifier.contains = true;
						state = QUALIFIER_NAME_FIRST_CHAR;
						break;
					}
					if (c == '#') {
						newSelector();
						newQualifier();
						currentSelector.tagName = '*';
						currentQualifier.attrName = 'id';
						state = QUALIFIER_NAME_FIRST_CHAR;
						break;
					}
					if (c == '[') {
						newSelector();
						newQualifier();
						currentSelector.tagName = '*';
						currentQualifier.attrName = '';
						state = ATTR_NAME_FIRST_CHAR;
						break;
					}
					if (c.match(WHITESPACE))
						break;
					throw Error(SYNTAX_ERROR);
				case TAG_NAME:
					if (c.match(validNameNonInitialChar)) {
						currentSelector.tagName += c;
						break;
					}
					if (c == '.') {
						newQualifier();
						currentQualifier.attrName = 'class';
						currentQualifier.contains = true;
						state = QUALIFIER_NAME_FIRST_CHAR;
						break;
					}
					if (c == '#') {
						newQualifier();
						currentQualifier.attrName = 'id';
						state = QUALIFIER_NAME_FIRST_CHAR;
						break;
					}
					if (c == '[') {
						newQualifier();
						currentQualifier.attrName = '';
						state = ATTR_NAME_FIRST_CHAR;
						break;
					}
					if (c.match(WHITESPACE)) {
						state = SELECTOR_SEPARATOR;
						break;
					}
					if (c == ',') {
						state = SELECTOR;
						break;
					}
					throw Error(SYNTAX_ERROR);
				case QUALIFIER:
					if (c == '.') {
						newQualifier();
						currentQualifier.attrName = 'class';
						currentQualifier.contains = true;
						state = QUALIFIER_NAME_FIRST_CHAR;
						break;
					}
					if (c == '#') {
						newQualifier();
						currentQualifier.attrName = 'id';
						state = QUALIFIER_NAME_FIRST_CHAR;
						break;
					}
					if (c == '[') {
						newQualifier();
						currentQualifier.attrName = '';
						state = ATTR_NAME_FIRST_CHAR;
						break;
					}
					if (c.match(WHITESPACE)) {
						state = SELECTOR_SEPARATOR;
						break;
					}
					if (c == ',') {
						state = SELECTOR;
						break;
					}
					throw Error(SYNTAX_ERROR);
				case QUALIFIER_NAME_FIRST_CHAR:
					if (c.match(validNameInitialChar)) {
						currentQualifier.attrValue = c;
						state = QUALIFIER_NAME;
						break;
					}
					throw Error(SYNTAX_ERROR);
				case QUALIFIER_NAME:
					if (c.match(validNameNonInitialChar)) {
						currentQualifier.attrValue += c;
						break;
					}
					if (c == '.') {
						newQualifier();
						currentQualifier.attrName = 'class';
						currentQualifier.contains = true;
						state = QUALIFIER_NAME_FIRST_CHAR;
						break;
					}
					if (c == '#') {
						newQualifier();
						currentQualifier.attrName = 'id';
						state = QUALIFIER_NAME_FIRST_CHAR;
						break;
					}
					if (c == '[') {
						newQualifier();
						state = ATTR_NAME_FIRST_CHAR;
						break;
					}
					if (c.match(WHITESPACE)) {
						state = SELECTOR_SEPARATOR;
						break;
					}
					if (c == ',') {
						state = SELECTOR;
						break;
					}
					throw Error(SYNTAX_ERROR);
				case ATTR_NAME_FIRST_CHAR:
					if (c.match(validNameInitialChar)) {
						currentQualifier.attrName = c;
						state = ATTR_NAME;
						break;
					}
					if (c.match(WHITESPACE))
						break;
					throw Error(SYNTAX_ERROR);
				case ATTR_NAME:
					if (c.match(validNameNonInitialChar)) {
						currentQualifier.attrName += c;
						break;
					}
					if (c.match(WHITESPACE)) {
						state = EQUIV_OR_ATTR_QUAL_END;
						break;
					}
					if (c == '~') {
						currentQualifier.contains = true;
						state = EQUAL;
						break;
					}
					if (c == '=') {
						currentQualifier.attrValue = '';
						state = VALUE_FIRST_CHAR;
						break;
					}
					if (c == ']') {
						state = QUALIFIER;
						break;
					}
					throw Error(SYNTAX_ERROR);
				case EQUIV_OR_ATTR_QUAL_END:
					if (c == '~') {
						currentQualifier.contains = true;
						state = EQUAL;
						break;
					}
					if (c == '=') {
						currentQualifier.attrValue = '';
						state = VALUE_FIRST_CHAR;
						break;
					}
					if (c == ']') {
						state = QUALIFIER;
						break;
					}
					if (c.match(WHITESPACE))
						break;
					throw Error(SYNTAX_ERROR);
				case EQUAL:
					if (c == '=') {
						currentQualifier.attrValue = '';
						state = VALUE_FIRST_CHAR;
						break;
					}
					throw Error(SYNTAX_ERROR);
				case ATTR_QUAL_END:
					if (c == ']') {
						state = QUALIFIER;
						break;
					}
					if (c.match(WHITESPACE))
						break;
					throw Error(SYNTAX_ERROR);
				case VALUE_FIRST_CHAR:
					if (c.match(WHITESPACE))
						break;
					if (c == '"' || c == "'") {
						valueQuoteChar = c;
						state = QUOTED_VALUE;
						break;
					}
					currentQualifier.attrValue += c;
					state = VALUE;
					break;
				case VALUE:
					if (c.match(WHITESPACE)) {
						state = ATTR_QUAL_END;
						break;
					}
					if (c == ']') {
						state = QUALIFIER;
						break;
					}
					if (c == "'" || c == '"')
						throw Error(SYNTAX_ERROR);
					currentQualifier.attrValue += c;
					break;
				case QUOTED_VALUE:
					if (c == valueQuoteChar) {
						state = ATTR_QUAL_END;
						break;
					}
					currentQualifier.attrValue += c;
					break;
				case SELECTOR_SEPARATOR:
					if (c.match(WHITESPACE))
						break;
					if (c == ',') {
						state = SELECTOR;
						break;
					}
					throw Error(SYNTAX_ERROR);
			}
		}
		switch (state) {
			case SELECTOR:
			case TAG_NAME:
			case QUALIFIER:
			case QUALIFIER_NAME:
			case SELECTOR_SEPARATOR:
				// Valid end states.
				newSelector();
				break;
			default:
				throw Error(SYNTAX_ERROR);
		}
		if (!selectors.length)
			throw Error(SYNTAX_ERROR);
		return selectors;
	};
	Selector.nextUid = 1;
	Selector.matchesSelector = (function () {
		var element = document.createElement('div');
		if (typeof element['webkitMatchesSelector'] === 'function')
			return 'webkitMatchesSelector';
		if (typeof element['mozMatchesSelector'] === 'function')
			return 'mozMatchesSelector';
		if (typeof element['msMatchesSelector'] === 'function')
			return 'msMatchesSelector';
		return 'matchesSelector';
	})();
	return Selector;
})();
var attributeFilterPattern = /^([a-zA-Z:_]+[a-zA-Z0-9_\-:\.]*)$/;
function validateAttribute(attribute) {
	if (typeof attribute != 'string')
		throw Error('Invalid request opion. attribute must be a non-zero length string.');
	attribute = attribute.trim();
	if (!attribute)
		throw Error('Invalid request opion. attribute must be a non-zero length string.');
	if (!attribute.match(attributeFilterPattern))
		throw Error('Invalid request option. invalid attribute name: ' + attribute);
	return attribute;
}
function validateElementAttributes(attribs) {
	if (!attribs.trim().length)
		throw Error('Invalid request option: elementAttributes must contain at least one attribute.');
	var lowerAttributes = {};
	var attributes = {};
	var tokens = attribs.split(/\s+/);
	for (var i = 0; i < tokens.length; i++) {
		var name = tokens[i];
		if (!name)
			continue;
		var name = validateAttribute(name);
		var nameLower = name.toLowerCase();
		if (lowerAttributes[nameLower])
			throw Error('Invalid request option: observing multiple case variations of the same attribute is not supported.');
		attributes[name] = true;
		lowerAttributes[nameLower] = true;
	}
	return Object.keys(attributes);
}
function elementFilterAttributes(selectors) {
	var attributes = {};
	selectors.forEach(function (selector) {
		selector.qualifiers.forEach(function (qualifier) {
			attributes[qualifier.attrName] = true;
		});
	});
	return Object.keys(attributes);
}
var MutationSummary = (function () {
	function MutationSummary(opts) {
		var _this = this;
		this.connected = false;
		this.options = MutationSummary.validateOptions(opts);
		this.observerOptions = MutationSummary.createObserverOptions(this.options.queries);
		this.root = this.options.rootNode;
		this.callback = this.options.callback;
		this.elementFilter = Array.prototype.concat.apply([], this.options.queries.map(function (query) {
			return query.elementFilter ? query.elementFilter : [];
		}));
		if (!this.elementFilter.length)
			this.elementFilter = undefined;
		this.calcReordered = this.options.queries.some(function (query) {
			return query.all;
		});
		this.queryValidators = []; // TODO(rafaelw): Shouldn't always define this.
		if (MutationSummary.createQueryValidator) {
			this.queryValidators = this.options.queries.map(function (query) {
				return MutationSummary.createQueryValidator(_this.root, query);
			});
		}
		this.observer = new MutationObserverCtor(function (mutations) {
			_this.observerCallback(mutations);
		});
		this.reconnect();
	}
	MutationSummary.createObserverOptions = function (queries) {
		var observerOptions = {
			childList: true,
			subtree: true
		};
		var attributeFilter;
		function observeAttributes(attributes) {
			if (observerOptions.attributes && !attributeFilter)
				return; // already observing all.
			observerOptions.attributes = true;
			observerOptions.attributeOldValue = true;
			if (!attributes) {
				// observe all.
				attributeFilter = undefined;
				return;
			}
			// add to observed.
			attributeFilter = attributeFilter || {};
			attributes.forEach(function (attribute) {
				attributeFilter[attribute] = true;
				attributeFilter[attribute.toLowerCase()] = true;
			});
		}
		queries.forEach(function (query) {
			if (query.characterData) {
				observerOptions.characterData = true;
				observerOptions.characterDataOldValue = true;
				return;
			}
			if (query.all) {
				observeAttributes();
				observerOptions.characterData = true;
				observerOptions.characterDataOldValue = true;
				return;
			}
			if (query.attribute) {
				observeAttributes([query.attribute.trim()]);
				return;
			}
			var attributes = elementFilterAttributes(query.elementFilter).concat(query.attributeList || []);
			if (attributes.length)
				observeAttributes(attributes);
		});
		if (attributeFilter)
			observerOptions.attributeFilter = Object.keys(attributeFilter);
		return observerOptions;
	};
	MutationSummary.validateOptions = function (options) {
		for (var prop in options) {
			if (!(prop in MutationSummary.optionKeys))
				throw Error('Invalid option: ' + prop);
		}
		if (typeof options.callback !== 'function')
			throw Error('Invalid options: callback is required and must be a function');
		if (!options.queries || !options.queries.length)
			throw Error('Invalid options: queries must contain at least one query request object.');
		var opts = {
			callback: options.callback,
			rootNode: options.rootNode || document,
			observeOwnChanges: !!options.observeOwnChanges,
			oldPreviousSibling: !!options.oldPreviousSibling,
			queries: []
		};
		for (var i = 0; i < options.queries.length; i++) {
			var request = options.queries[i];
			// all
			if (request.all) {
				if (Object.keys(request).length > 1)
					throw Error('Invalid request option. all has no options.');
				opts.queries.push({ all: true });
				continue;
			}
			// attribute
			if ('attribute' in request) {
				var query = {
					attribute: validateAttribute(request.attribute)
				};
				query.elementFilter = Selector.parseSelectors('*[' + query.attribute + ']');
				if (Object.keys(request).length > 1)
					throw Error('Invalid request option. attribute has no options.');
				opts.queries.push(query);
				continue;
			}
			// element
			if ('element' in request) {
				var requestOptionCount = Object.keys(request).length;
				var query = {
					element: request.element,
					elementFilter: Selector.parseSelectors(request.element)
				};
				if (request.hasOwnProperty('elementAttributes')) {
					query.attributeList = validateElementAttributes(request.elementAttributes);
					requestOptionCount--;
				}
				if (requestOptionCount > 1)
					throw Error('Invalid request option. element only allows elementAttributes option.');
				opts.queries.push(query);
				continue;
			}
			// characterData
			if (request.characterData) {
				if (Object.keys(request).length > 1)
					throw Error('Invalid request option. characterData has no options.');
				opts.queries.push({ characterData: true });
				continue;
			}
			throw Error('Invalid request option. Unknown query request.');
		}
		return opts;
	};
	MutationSummary.prototype.createSummaries = function (mutations) {
		if (!mutations || !mutations.length)
			return [];
		var projection = new MutationProjection(this.root, mutations, this.elementFilter, this.calcReordered, this.options.oldPreviousSibling);
		var summaries = [];
		for (var i = 0; i < this.options.queries.length; i++) {
			summaries.push(new Summary(projection, this.options.queries[i]));
		}
		return summaries;
	};
	MutationSummary.prototype.checkpointQueryValidators = function () {
		this.queryValidators.forEach(function (validator) {
			if (validator)
				validator.recordPreviousState();
		});
	};
	MutationSummary.prototype.runQueryValidators = function (summaries) {
		this.queryValidators.forEach(function (validator, index) {
			if (validator)
				validator.validate(summaries[index]);
		});
	};
	MutationSummary.prototype.changesToReport = function (summaries) {
		return summaries.some(function (summary) {
			var summaryProps = ['added', 'removed', 'reordered', 'reparented',
				'valueChanged', 'characterDataChanged'];
			if (summaryProps.some(function (prop) { return summary[prop] && summary[prop].length; }))
				return true;
			if (summary.attributeChanged) {
				var attrNames = Object.keys(summary.attributeChanged);
				var attrsChanged = attrNames.some(function (attrName) {
					return !!summary.attributeChanged[attrName].length;
				});
				if (attrsChanged)
					return true;
			}
			return false;
		});
	};
	MutationSummary.prototype.observerCallback = function (mutations) {
		if (!this.options.observeOwnChanges)
			this.observer.disconnect();
		var summaries = this.createSummaries(mutations);
		this.runQueryValidators(summaries);
		if (this.options.observeOwnChanges)
			this.checkpointQueryValidators();
		if (this.changesToReport(summaries))
			this.callback(summaries);
		// disconnect() may have been called during the callback.
		if (!this.options.observeOwnChanges && this.connected) {
			this.checkpointQueryValidators();
			this.observer.observe(this.root, this.observerOptions);
		}
	};
	MutationSummary.prototype.reconnect = function () {
		if (this.connected)
			throw Error('Already connected');
		this.observer.observe(this.root, this.observerOptions);
		this.connected = true;
		this.checkpointQueryValidators();
	};
	MutationSummary.prototype.takeSummaries = function () {
		if (!this.connected)
			throw Error('Not connected');
		var summaries = this.createSummaries(this.observer.takeRecords());
		return this.changesToReport(summaries) ? summaries : undefined;
	};
	MutationSummary.prototype.disconnect = function () {
		var summaries = this.takeSummaries();
		this.observer.disconnect();
		this.connected = false;
		return summaries;
	};
	MutationSummary.NodeMap = NodeMap; // exposed for use in TreeMirror.
	MutationSummary.parseElementFilter = Selector.parseSelectors; // exposed for testing.
	MutationSummary.optionKeys = {
		'callback': true,
		'queries': true,
		'rootNode': true,
		'oldPreviousSibling': true,
		'observeOwnChanges': true
	};
	return MutationSummary;
})();

////////////////////////////////
/// <reference path="lib.es6.d.ts"/>
var __extends = this.__extends || function (d, b) {
    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
    function __() { this.constructor = d; }
    __.prototype = b.prototype;
    d.prototype = new __();
};
var App = (function () {
    function App() {
    }
    Object.defineProperty(App, "model", {
        get: function () {
            return App.internalModelWrapper.model;
        },
        set: function (value) {
            for (var key in value) {
                if (value.hasOwnProperty(key)) {
                    App.internalModelWrapper.model[key] = value[key];
                }
            }
            App.Utils.Observe.observeObjects(false, App.internalModelWrapper);
        },
        enumerable: true,
        configurable: true
    });
    App.initialize = function () {
        App.Utils.Observe.observeObjects(false, App.internalModelWrapper);
        App.Dom.initialize();
    };
    App.internalModelWrapper = { model: {} };
    App.regexForTemplate = '\\$\\{(.*?)\\}';
    App.regexForModelPaths = '((App|this)\\.(.*?)(?!\\[.*?|.*?\\])(?:\\||$|\\n|\\*|\\+|\\\\|\\-|\\s|\\(|\\)|\\|\\||&&|\\?|\\:|\\!))';
    App.elementToModelMap = new Map([['', []]]);
    App.subscribedElementsToModelMap = new Map([['', []]]);
    return App;
})();
var App;
(function (App_1) {
    var Utils = (function () {
        function Utils() {
        }
        Utils.isElement = function (o) {
            return (typeof HTMLElement === "object" ? o instanceof HTMLElement :
                o && typeof o === "object" && o !== null && o.nodeType === 1 && typeof o.nodeName === "string");
        };
        Utils.processTemplateThroughPipes = function (value) {
            var value = value.split(/(?!\[.*?|.*?\])\|/g);
            var returnVal = eval(value[0].trim());
            if (typeof returnVal !== 'undefined') {
                returnVal = String(returnVal).trim();
                if (value.length <= 1) {
                    return returnVal;
                }
                else {
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
                        }
                        else if (typeof String(returnVal)[func] !== 'undefined') {
                            returnVal = window['String']['prototype'][func].apply(returnVal, args);
                        }
                    }
                    if (typeof returnVal === 'undefined' || String(returnVal).toLowerCase() === 'nan' || String(returnVal).toLowerCase() === 'undefined') {
                        return "";
                    }
                    else {
                        return returnVal;
                    }
                }
            }
            else {
                return '';
            }
        };
        Utils.splitParametersBySpaces = function (string) {
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
                    }
                    else if (currChar === "\"" && lastChar !== "\\" && !inQuoteSingle) {
                        if (inQuoteDouble) {
                            inQuoteDouble = false;
                        }
                        else {
                            inQuoteDouble = true;
                        }
                    }
                    else if (currChar === "'" && lastChar !== "\\" && !inQuoteDouble) {
                        if (inQuoteSingle) {
                            inQuoteSingle = false;
                        }
                        else {
                            inQuoteSingle = true;
                        }
                    }
                }
                lastChar = currChar;
            }
            arr.push(string.substr(lastSpace + 1, (string.length - 1) - lastSpace).trim());
            return arr;
        };
        Utils.castStringToType = function (string) {
            if (string.trim().toLowerCase() === 'true') {
                return true;
            }
            else if (string.trim().toLowerCase() === 'false') {
                return false;
            }
            else {
                return string;
            }
        };
        Utils.unwrapQuotes = function (string) {
            var string = string.trim();
            var firstChar = string.substr(0, 1);
            var lastChar = string.substr(string.length - 1);
            if (firstChar === "\"" && lastChar === "\"") {
                string = string.substr(1, string.length - 2).replace(/\\"/g, "\"");
            }
            else if (firstChar === "'" && lastChar === "'") {
                string = string.substr(1, string.length - 2).replace(/\\'/g, "'");
            }
            return string;
        };
        return Utils;
    })();
    App_1.Utils = Utils;
    var Utils;
    (function (Utils) {
        var Observe = (function () {
            function Observe() {
            }
            Observe.observeObjects = function (unobserve, objectToObserve, objectLocationString, previousObjects) {
                var observationAction = unobserve ? 'unobserve' : 'observe';
                var witnessedObjects = App.Utils.Observe.witnessedObjects;
                var observerFunctions = App.Utils.Observe.observerFunctions;
                var observeObjects = App.Utils.Observe.observeObjects;
                previousObjects = previousObjects || [];
                for (var key in objectToObserve) {
                    if (objectToObserve.hasOwnProperty(key) || Array.isArray(objectToObserve)) {
                        var value = objectToObserve[key];
                        if ((value !== null &&
                            (typeof value === 'object' || Array.isArray(value))) &&
                            !App.Utils.isElement(value) &&
                            (function () {
                                var wasNotSeen = true;
                                previousObjects.forEach(function (object) {
                                    if (object === value)
                                        wasNotSeen = false;
                                });
                                return wasNotSeen;
                            })()) {
                            previousObjects.push(value);
                            var thisLocation = "";
                            if (typeof objectLocationString === "undefined")
                                thisLocation = "" + key;
                            else {
                                if (!isNaN(key)) {
                                    thisLocation = objectLocationString + "[" + key + "]";
                                }
                                else {
                                    thisLocation = objectLocationString + "." + key;
                                }
                            }
                            witnessedObjects[thisLocation] = value;
                            var changeHandlerFunction = observerFunctions[thisLocation] ? observerFunctions[thisLocation] : function (changes) {
                                changes.forEach(function (change) {
                                    var key = !isNaN(change.name) ? '[' + change.name + ']' : '.' + change.name;
                                    var modelPath = thisLocation + key;
                                    var newValue = change.object[change.name];
                                    var oldValue = change.oldValue;
                                    if (typeof newValue === 'object' || Array.isArray(newValue)) {
                                        observeObjects(unobserve, value, thisLocation, previousObjects);
                                    }
                                    App.Utils.Observe.setElementsToValue(App.elementToModelMap, modelPath, newValue);
                                    App.Utils.Observe.updateSubscribedElements(App.subscribedElementsToModelMap, modelPath);
                                    if (Array.isArray(newValue))
                                        var logValue = JSON.stringify(newValue);
                                    else
                                        logValue = "'" + newValue + "'";
                                });
                            };
                            if (!observerFunctions[thisLocation])
                                observerFunctions[thisLocation] = changeHandlerFunction;
                            Object[observationAction](value, changeHandlerFunction);
                            observeObjects(unobserve, value, thisLocation, previousObjects);
                        }
                    }
                }
            };
            Observe.setElementsToValue = function (elementsObject, modelLocation, value) {
                var boundElements = document.querySelectorAll('input[data-bind-to="App.' + modelLocation + '"]:not([data-bind-on]), input[data-bind-to="App.' + modelLocation + '"][data-bind-on=input]');
                for (var i = 0; i < boundElements.length; i++) {
                    App.Dom.twoWayBinderInHandler(boundElements[i], value);
                }
                elementsObject.forEach(function (value, key) {
                    if (key.startsWith(modelLocation)) {
                        value.forEach(function (node) {
                            if (node instanceof Node || node instanceof HTMLElement) {
                                App.Dom.templateRenderForTextNode(node, '__template');
                            }
                            else {
                                App.Dom.templateRenderForAttribute(node.element, node.attribute, true);
                            }
                        });
                    }
                });
            };
            Observe.updateSubscribedElements = function (elementsObject, modelLocation) {
                elementsObject.forEach(function (value, key) {
                    if (key.startsWith(modelLocation)) {
                        value.forEach(function (item) {
                            item.attributes.forEach(function (attribute) {
                                attribute.callbacks.forEach(function (callback) {
                                    callback(App.Utils.processTemplateThroughPipes(attribute.expression));
                                });
                            });
                        });
                    }
                });
            };
            Observe.observerFunctions = {};
            Observe.witnessedObjects = {};
            return Observe;
        })();
        Utils.Observe = Observe;
        var Sandbox = (function () {
            function Sandbox() {
            }
            Sandbox.evaluate = function (code) {
                return new Promise(function (resolve, reject) {
                });
            };
            Sandbox.jailed = require('./modules/jailed/jailed.js');
            return Sandbox;
        })();
        Utils.Sandbox = Sandbox;
    })(Utils = App_1.Utils || (App_1.Utils = {}));
    var Dom = (function () {
        function Dom() {
        }
        Dom.initialize = function () {
            var doc = document.querySelectorAll('*');
            for (var i = 0; i < doc.length; i++) {
                App.Dom.textNodeSearch(doc[i]);
                for (var n = 0; n < doc[i].attributes.length; n++) {
                    App.Dom.templateRenderForAttribute(doc[i], doc[i].attributes[n].name);
                }
            }
            var observer = new MutationSummary({
                callback: function (summaries) {
                    App.Dom.templateFinder(summaries);
                },
                queries: [{
                        all: true
                    }]
            });
            document.querySelector('body').addEventListener('input', function (event) {
                App.Dom.twoWayBinderOutHandler(event, 'input[data-bind-to]:not([data-bind-on]), input[data-bind-to][data-bind-on=input]');
            });
            document.querySelector('body').addEventListener('change', function (event) {
                App.Dom.twoWayBinderOutHandler(event, '[data-bind-to][data-bind-on=change]');
            });
        };
        Dom.templateFinder = function (summaries) {
            summaries[0].added.forEach(function (el) {
                App.Dom.textNodeSearch(el);
            });
            summaries[0].characterDataChanged.forEach(function (el) {
                App.Dom.textNodeSearch(el);
            });
            for (var key in summaries[0].attributeChanged) {
                var attributes = summaries[0].attributeChanged;
                if (attributes.hasOwnProperty(key)) {
                    attributes[key].forEach(function (el) {
                        App.Dom.templateRenderForAttribute(el, key);
                    });
                }
            }
        };
        Dom.textNodeSearch = function (el) {
            if (el.nodeType === 3) {
                App.Dom.templateRenderForTextNode(el, 'nodeValue');
            }
            else {
                for (var i = 0; i < el.childNodes.length; i++) {
                    if (el.childNodes[i].nodeType === 3) {
                        App.Dom.templateRenderForTextNode(el.childNodes[i], 'nodeValue');
                    }
                }
            }
        };
        Dom.templateRenderForTextNode = function (el, templateProperty) {
            var regexForTemplate = new RegExp(App.regexForTemplate, 'g');
            var regexForModelPaths = new RegExp(App.regexForModelPaths, 'g');
            var matches = el[templateProperty].match(regexForTemplate);
            if (matches) {
                el['__template'] = el[templateProperty];
                el.nodeValue = el[templateProperty].replace(regexForTemplate, function (match, submatch) {
                    var modelPaths;
                    while ((modelPaths = regexForModelPaths.exec(submatch)) !== null) {
                        var modelPath = modelPaths[3].trim();
                        if (typeof App.elementToModelMap.get(modelPath) === 'undefined') {
                            App.elementToModelMap.set(modelPath, []);
                        }
                        if ((function () {
                            var notAlreadyInModel = true;
                            App.elementToModelMap.get(modelPath).forEach(function (node) {
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
        };
        Dom.templateRenderForAttribute = function (el, attribute, useAttributeTemplate) {
            useAttributeTemplate = useAttributeTemplate || false;
            var regexForTemplate = new RegExp(App.regexForTemplate, 'g');
            var regexForModelPaths = new RegExp(App.regexForModelPaths, 'g');
            var attributeValue;
            if (useAttributeTemplate) {
                attributeValue = el['__' + attribute + 'Template'];
            }
            else {
                attributeValue = el.getAttribute(attribute);
            }
            var matches = attributeValue.match(regexForTemplate);
            if (matches) {
                el['__' + attribute + 'Template'] = attributeValue;
                el.setAttribute(attribute, attributeValue.replace(regexForTemplate, function (match, submatch) {
                    var modelPaths;
                    while ((modelPaths = regexForModelPaths.exec(submatch)) !== null) {
                        var modelPath = modelPaths[3].trim();
                        if (typeof App.elementToModelMap.get(modelPath) === 'undefined') {
                            App.elementToModelMap.set(modelPath, []);
                        }
                        if ((function () {
                            var notAlreadyInModel = true;
                            App.elementToModelMap.get(modelPath).forEach(function (item) {
                                if (typeof item.nodeValue === 'undefined' && el === item.element && attribute === item.attribute) {
                                    notAlreadyInModel = false;
                                }
                            });
                            return notAlreadyInModel;
                        }())) {
                            var SubscribedAttrTemplate = {
                                element: el,
                                attribute: attribute
                            };
                            App.elementToModelMap.get(modelPath).push(SubscribedAttrTemplate);
                        }
                    }
                    return App.Utils.processTemplateThroughPipes(submatch);
                }));
            }
        };
        Dom.twoWayBinderOutHandler = function (event, selector) {
            var targetEl = event.target;
            if (targetEl.matches(selector)) {
                var modelPath = targetEl.getAttribute('data-bind-to');
                var value = targetEl.value;
                if (value.length === 0) {
                    value = '""';
                }
                else if (isNaN(value)) {
                    value = '"' + value.replace(/("|\\)/g, '\\$&') + '"';
                }
                eval(modelPath + ' = ' + value);
            }
        };
        Dom.twoWayBinderInHandler = function (el, value) {
            el.value = value;
        };
        return Dom;
    })();
    App_1.Dom = Dom;
    var Pipes = (function () {
        function Pipes() {
        }
        Pipes.toUpperCase = function (string) {
            return string.toUpperCase();
        };
        return Pipes;
    })();
    App_1.Pipes = Pipes;
    var Element = (function () {
        function Element(el) {
            this.subscribedAttrs = [];
            if (!App[this.getClassName()].registered) {
                this.register();
            }
            if (!el) {
                this.el = new App[this.getClassName()].el;
            }
            else {
                this.el = el;
            }
            this.el['__controller'] = this;
        }
        Element.prototype.subscribeAttrToModelPath = function (attribute, callback) {
            var index = 0;
            var el = this.el;
            var regexForModelPaths = new RegExp(App.regexForModelPaths, 'g');
            var expression = el.getAttribute(attribute);
            var subscribedAttribute = {
                attribute: attribute,
                subscribedModelPaths: []
            };
            var modelPaths;
            while ((modelPaths = regexForModelPaths.exec(expression)) !== null) {
                var modelPath = modelPaths[3].trim();
                subscribedAttribute.subscribedModelPaths.push(modelPath);
                if (typeof App.subscribedElementsToModelMap.get(modelPath) === 'undefined') {
                    App.subscribedElementsToModelMap.set(modelPath, []);
                }
                if (!App.subscribedElementsToModelMap.get(modelPath).some(function (value) {
                    if (value.element === el) {
                        if (!value.attributes.some(function (attr) {
                            if (attr.attribute === attribute) {
                                attr.callbacks.push(callback);
                                return true;
                            }
                        })) {
                            value.attributes.push({
                                attribute: attribute,
                                expression: expression,
                                callbacks: [callback]
                            });
                        }
                        return true;
                    }
                })) {
                    var subscribedElement = {
                        element: el,
                        attributes: [{
                                attribute: attribute,
                                expression: expression,
                                callbacks: [callback]
                            }]
                    };
                    App.subscribedElementsToModelMap.get(modelPath).push(subscribedElement);
                }
            }
            this.subscribedAttrs.push(subscribedAttribute);
            App.Utils.Observe.updateSubscribedElements(App.subscribedElementsToModelMap, modelPath);
        };
        Element.prototype.getClassName = function () {
            var funcNameRegex = /function (.{1,})\(/;
            var results = (funcNameRegex).exec(this["constructor"].toString());
            return (results && results.length > 1) ? results[1] : "";
        };
        Element.prototype.register = function () {
            if (!App[this.getClassName()].registered) {
                App[this.getClassName()].registered = true;
                var guiElement = this;
                var document = window.document;
                App[this.getClassName()].el = document.registerElement('app-' + this.getClassName().toLowerCase(), {
                    prototype: Object.create(HTMLElement.prototype, {
                        createdCallback: {
                            value: function () {
                                if (typeof this['__controller'] === 'undefined' || !this['__controller']) {
                                    this['__controller'] = new App[guiElement.getClassName()](this);
                                }
                                var shadow = this.createShadowRoot();
                                var observer = new MutationSummary({
                                    callback: function (summaries) {
                                        App.Dom.templateFinder(summaries);
                                    },
                                    queries: [{
                                            all: true
                                        }],
                                    rootNode: shadow
                                });
                                shadow.innerHTML = "<content></content>";
                            }
                        },
                        attributeChangedCallback: function () {
                        }
                    })
                });
            }
        };
        Element.registered = false;
        return Element;
    })();
    App_1.Element = Element;
    var Print = (function (_super) {
        __extends(Print, _super);
        function Print(e) {
            _super.call(this, e);
            var element = this.el;
            this.subscribeAttrToModelPath('value', function (value) {
                element.innerHTML = value;
            });
        }
        return Print;
    })(Element);
    App_1.Print = Print;
    var If = (function (_super) {
        __extends(If, _super);
        function If(e) {
            _super.call(this, e);
            var element = this.el;
            this.subscribeAttrToModelPath('condition', function (value) {
                var val = App.Utils.castStringToType(value);
                if (val) {
                    element.setAttribute('evaluates-to', 'true');
                    element.style.display = 'block';
                }
                else {
                    element.setAttribute('evaluates-to', 'false');
                    element.style.display = 'none';
                }
                var nextSibling = element.nextElementSibling;
                var nextTagName = nextSibling.tagName;
                if (typeof nextSibling !== 'undefined' && typeof nextTagName !== 'undefined' && nextTagName.toLowerCase() === 'app-else' && typeof nextSibling['__controller'] !== 'undefined') {
                    nextSibling['__controller'].update(App.Utils.castStringToType(element.getAttribute('evaluates-to')));
                }
            });
        }
        return If;
    })(Element);
    App_1.If = If;
    var Else = (function (_super) {
        __extends(Else, _super);
        function Else(e) {
            _super.call(this, e);
        }
        Else.prototype.update = function (ifVal) {
            var element = this.el;
            if (!ifVal) {
                element.style.display = 'block';
            }
            else {
                element.style.display = 'none';
            }
        };
        return Else;
    })(Element);
    App_1.Else = Else;
})(App || (App = {}));
for (var guiClass in App) {
    if (App.hasOwnProperty(guiClass)) {
        if (typeof App[guiClass].prototype !== "undefined" && typeof App[guiClass].prototype.register !== "undefined" && typeof App[guiClass].registered !== "undefined" && !App[guiClass].registered) {
            App[guiClass].prototype.register();
        }
    }
}
App.initialize();
//

},{"./modules/jailed/jailed.js":4}]},{},[5]);
