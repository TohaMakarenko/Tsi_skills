(function(global) {

	function prepareCoreModulePath(path) {
		var coreModulesPath = global.Terrasoft && global.Terrasoft.coreModulesPath;
		if (coreModulesPath) {
			path = coreModulesPath + path;
		}
		return path;
	}

	var requirejsMapConfig = {
		"css": prepareCoreModulePath("requirejs/css"),
		"less-rtl": prepareCoreModulePath("requirejs/less-rtl"),
		"less": prepareCoreModulePath("requirejs/less-loader"),
		"less-parser": prepareCoreModulePath("requirejs/less-parser"),
		"text": prepareCoreModulePath("requirejs/text")
	};

	function mapResourcesToPath(resources, modulePath, loader) {
		return resources.map(function(item) {
			/**
			 * TODO CRM-34171
			 * When UseStaticFileContent is enabled, module path is not defined in descriptors.
			 * Therefore we need to set it to a default directory.
			 */
			if (!modulePath && Terrasoft.useStaticFileContent) {
				modulePath = "conf/content";
			}
			return [loader, "!", modulePath, "/", item].join("");
		});
	}

	function prepareConfig(coreModules) {
		var shim = {};
		var paths = {
			profile: prepareCoreModulePath("requirejs/profile"),
			async: prepareCoreModulePath("requirejs/async")
		};
		var terrasoftDeps = [];
		var fakeModules = [];
		for (var propertyName in coreModules) {
			if (coreModules.hasOwnProperty(propertyName)) {
				var module = coreModules[propertyName];
				var moduleName = propertyName;
				var nameParts = moduleName.split("!");
				if (nameParts.length > 1) {
					var loaderName = nameParts[0];
					if (requirejsMapConfig.hasOwnProperty(loaderName)) {
						nameParts[0] = requirejsMapConfig[loaderName];
					}
					moduleName = nameParts.join("!");
				}
				var moduleDeps = module.deps || [];
				var modulePath = prepareCoreModulePath(module.path);
				if (module.css) {
					moduleDeps = moduleDeps.concat(mapResourcesToPath(module.css, modulePath, "css"));
				}
				if (module.less) {
					moduleDeps = moduleDeps.concat(mapResourcesToPath(module.less, modulePath, "less"));
				}
				var fileName = module.file || moduleName;
				if (fileName === "-") {
					fakeModules.push({
						name: moduleName,
						deps: moduleDeps
					});
				} else {
					paths[moduleName] = [modulePath, fileName].join("/");
				}
				if (module.requireDefine !== false) {
					var moduleShim = shim[moduleName] = {
						deps: moduleDeps
					};
					if (module.exports) {
						moduleShim.exports = module.exports;
					}
				}
				if (module.external) {
					continue;
				}
				terrasoftDeps.push(moduleName);
			}
		}
		fakeModules.push({
			name: "terrasoft",
			deps: terrasoftDeps,
			factory: function() {
				return Terrasoft;
			}
		});
		return {
			shim: shim,
			paths: paths,
			fakeModules: fakeModules
		};
	}

	function init(coreModules, baseUrl) {
		var define = global.define;
		var config = prepareConfig(coreModules);
		var urlArgs;
		try {
			if (Terrasoft && Terrasoft.hasOwnProperty("clientCoreUrl") && Terrasoft.hasOwnProperty("clientCoreHash")) {
				urlArgs = "hash=" + Terrasoft.clientCoreHash;
			}
		} catch (e) {
			
		}
		var requireJsConfig = {
			baseUrl: baseUrl,
			paths: config.paths,
			shim: config.shim,
			map: {
				"*": requirejsMapConfig
			}
		};
		if (urlArgs) {
			requireJsConfig[urlArgs] = urlArgs;
		}
		requirejs.config(requireJsConfig);
		var fakeModules = config.fakeModules;
		for (var i = fakeModules.length; i--;) {
			var definition = fakeModules[i];
			define(definition.name, definition.deps, definition.factory || {});
		}
		define("sandbox", ["ext-base", "core-base"], function(Ext, core) {
			var ptpEvents = core.ptpEvents;
			var observable = core.observable;
			var getFormattedString = core.getFormattedString;
			var subscribers = core.subscribers;
			var sandboxConstructor = function() {};
			var dynamicMessages = {};
			var systemMessages = [
				"CanBeDestroyed"
			];
			var prepareRequireModuleDescriptorsConfig = function(core, moduleNames) {
				var getModuleDescriptorRequestConfig = function(moduleName) {
					var config = {};
					var params = moduleName.split("!");
					config.name = params.pop();
					config.mode = params.pop() || "get";
					return config;
				};
				moduleNames = moduleNames || [];
				var descriptorsRequestBody = [];
				var descriptorsConfigForLoad = {};
				var requestedDescriptors = {};
				for (var index in moduleNames) {
					if (!moduleNames.hasOwnProperty(index)) {
						continue;
					}
					var config = getModuleDescriptorRequestConfig(moduleNames[index]);
					if (config.mode === "force") {
						core.setModuleDescriptor(config.name, null);
					}
					var moduleDescriptor = core.getModuleDescriptor(config.name);
					if (moduleDescriptor === null) {
						descriptorsConfigForLoad[config.name] = config;
						requestedDescriptors[config.name] = null;
						descriptorsRequestBody.push(config.name);
					} else {
						requestedDescriptors[config.name] = moduleDescriptor;
					}
				}
				return {
					descriptorsRequestBody: descriptorsRequestBody,
					descriptorsConfigForLoad: descriptorsConfigForLoad,
					requestedDescriptors: requestedDescriptors
				};
			};

			/**
			 * Внутренний обработчик широковещательного сообщения. Используется для фильтрации сообщений по тегам. Если
			 * совпадает хотя бы один из тегов указанных при публикации и подписке сообщения, вызывается
			 * зарегистрированный обработчик. Если теги не были указаны ни при подписке, ни при публикации, вызывается
			 * так же обработчик.
			 * @param eventArgs {Object} Параметры публикатора сообщения
			 * - **eventName** {Object}: Название сообщения
			 * - **eventArguments** {Object}: Параметры сообщения
			 * - **tags** {String[]}: Теги фильтрации сообщения
			 * @private
			 */
			function innerEventHandler(eventArgs) {
				var eventName = eventArgs.eventName;
				var publisherTags = eventArgs.tags;
				var publisherTagsLength = publisherTags.length;
				for (var moduleId in subscribers) {
					if (!subscribers.hasOwnProperty(moduleId)) {
						continue;
					}
					var moduleSubscribers = subscribers[moduleId];
					var eventListeners = moduleSubscribers[eventName];
					if (eventListeners) {
						for (var i = 0, listenersLength = eventListeners.length; i < listenersLength; i++) {
							var listener = eventListeners[i];
							var subscriberTags = listener.tags;
							var executeConfig = {
								fn: listener.handler,
								scope: listener.scope || observable,
								args: [eventArgs.eventArguments],
								errorInfo: {
									moduleId: moduleId,
									eventName: eventName
								}
							};
							if (publisherTagsLength === 0 && subscriberTags.length === 0) {
								core.safeExecute(executeConfig);
								continue;
							}
							for (var j = 0; j < publisherTagsLength; j++) {
								var publishTag = publisherTags[j];
								if (subscriberTags.indexOf(publishTag) >= 0) {
									core.safeExecute(executeConfig);
									break;
								}
							}
						}
					}
				}
			}

			function emptyModuleDefinition() {
				return null;
			}

			/**
			 * Вызывает обработчик ptp сообщения. Если при подписке на сообщение, в качестве обработчика была
			 * передана не функция, вызов не происходит.
			 * @param cfg {Object} Праметры вызова
			 * - **eventName** {String}: Название сообщения
			 * - **handler** {Function}: Обработчик сообщения
			 * - **eventArguments** {Object}: Параметры сообщения
			 * - **scope** {Object}: Контекст выполнения обработчика
			 * @return {*} Результат выполнения обработчика сообщения. Если обработчик не был вызван, вернется null.
			 * @private
			 */
			function firePtpEvent(cfg) {
				var result = null;
				var ptpHandler = cfg.handler;
				if (typeof ptpHandler === "function") {
					result = core.safeExecute({
						fn: ptpHandler,
						scope: cfg.scope,
						args: [cfg.eventArguments],
						errorInfo: {
							moduleName: this.moduleName,
							moduleId: this.id,
							eventName: cfg.eventName
						}
					});
				}
				return result;
			}

			/**
			 * Выполняет фильтрацию ptp сообщений и запуск сообщения.
			 * @param cfg {Object} Параметры обработчика
			 * - **moduleId** String: Идентификатор модуля
			 * - **eventName** String: Название ptp сообщения
			 * - **tags** String[]: Теги фильтрации
			 * @return {*} Результат, который вернул обработчик, если ни один обработчик не был найден,
			 * возвращает null.
			 * @private
			 */
			function publishPtpMessage(cfg) {
				var publishTags = cfg.tags;
				var eventName = cfg.eventName;
				var ptpEvent = ptpEvents[eventName];
				for (var moduleId in ptpEvent) {
					if (!ptpEvent.hasOwnProperty(moduleId)) {
						continue;
					}
					var ptpEventListeners = ptpEvent[moduleId];
					for (var i = 0, listenersLength = ptpEventListeners.length; i < listenersLength; i++) {
						var ptpEventListener = ptpEventListeners[i];
						var subscriberTags = ptpEventListener.tags;
						var firePtpEventConfig = {
							eventName: eventName,
							handler: ptpEventListener.handler,
							eventArguments: cfg.eventArguments,
							scope: ptpEventListener.scope || observable
						};
						if (publishTags.length === 0 && subscriberTags.length === 0) {
							return firePtpEvent(firePtpEventConfig);
						}
						for (var j = 0, len = publishTags.length; j < len; j++) {
							var publishTag = publishTags[j];
							if (subscriberTags.indexOf(publishTag) >= 0) {
								return firePtpEvent(firePtpEventConfig);
							}
						}
					}
				}
				return null;
			}

			/**
			 * Проверяет дескриптор сообщения модуля и допустимость выполнения операции.
			 * @private
			 * @param {Object} config Параметры выполнения операции.
			 * @param {Terrasoft.MessageDirectionType} config.messageDirection Направление сообщения.
			 * @param {String} config.eventName Название сообщения.
			 * @param {Object} config.eventDescriptor Дескриптор сообщения модуля.
			 * @param {Object} config.moduleId Идентификатор модуля.
			 * @param {Object} config.moduleName Название модуля.
			 * @throws {Terrasoft.UnsupportedTypeException}
			 * Бросает исключение если дескриптор сообщения null.
			 * @throws {Terrasoft.UnsupportedTypeException}
			 * Бросает исключение если выполняется недопустимая операция - публикация сообщения для которого в
			 * дескрипторе установлена подписка. Либо подписка на сообщение для которого в дескрипторе установлена
			 * операция публикации
			 * @throws {Terrasoft.UnsupportedTypeException}
			 * Бросает исключение если в дескрипторе сообщения установлен не валидный режим ('ptp' или 'broadcast').
			 */
			function checkEventDescriptor(config) {
				var messageDirection = config.messageDirection;
				var eventName = config.eventName;
				var eventDescriptor = config.eventDescriptor;
				var moduleId = config.moduleId;
				var moduleName = config.moduleName;
				var messageTemplate = "";
				var messageParams = {};
				var throwException = false;
				if (systemMessages.indexOf(eventName) !== -1) {
					return;
				}
				if (!eventDescriptor) {
					throwException = true;
					messageTemplate = "Message {messageName} is not defined in {moduleName} ({moduleId}) module";
					messageParams = {
						messageName: eventName,
						moduleId: moduleId,
						moduleName: moduleName
					};
				} else if (eventDescriptor.direction !== messageDirection &&
						eventDescriptor.direction !== Terrasoft.MessageDirectionType.BIDIRECTIONAL) {
					throwException = true;
					messageTemplate = "Message {messageName} cannot be {operation} in {moduleName} ({moduleId}), " +
						"message direction set as {messageDirection}";
					messageParams = {
						messageName: eventName,
						operation: messageDirection,
						moduleId: moduleId,
						moduleName: moduleName,
						messageDirection: eventDescriptor.direction
					};
				} else if (eventDescriptor.mode !== "ptp" && eventDescriptor.mode !== "broadcast") {
					throwException = true;
					messageTemplate = "{eventMode} is not supported type of message in {moduleName} ({moduleId}) module";
					messageParams = {
						eventMode: eventDescriptor.mode,
						moduleId: moduleId,
						moduleName: moduleName
					};
				}
				if (throwException) {
					var message = getFormattedString(messageTemplate, messageParams);
					throw new Terrasoft.UnsupportedTypeException({
						message: message
					});
				}
			}

			/**
			 * Удаляет обработчик ptp сообщения.
			 * @param {Object} cfg Параметры обработчика.
			 * @param {String} cfg.moduleId Идентификатор модуля.
			 * @param {String} cfg.eventName Название ptp сообщения.
			 * @param {String[]} cfg.tags Теги фильтрации.
			 * @return {Boolean} True если дубликат был найден и удален, иначе false.
			 * @private
			 */
			function removePtpMessageHandler(cfg) {
				var moduleId = cfg.moduleId;
				var eventName = cfg.eventName;
				var tags = cfg.tags;
				var handlerRemoved = false;
				var ptpEvent = ptpEvents[eventName];
				var ptpEventListeners = ptpEvent[moduleId];
				var listener;
				for (var i = 0, listenersLength = ptpEventListeners.length; i < listenersLength; i++) {
					var ptpEventListener = ptpEventListeners[i];
					var listenerTags = ptpEventListener.tags;
					if (listenerTags.join("") === tags.join("")) {
						ptpEventListeners.splice(i, 1);
						listener = ptpEventListener.listener;
						handlerRemoved = true;
						break;
					}
				}
				if (handlerRemoved) {
					var listeners = subscribers[moduleId];
					var eventListeners = listeners[eventName];
					var listenerIndex = eventListeners.indexOf(listener);
					eventListeners.splice(listenerIndex, 1);
				}
				return handlerRemoved;
			}

			/**
			 * Регистрирует в системе обработчик сообщения.
			 * @private
			 * @param cfg {Object} Параметры обработчика.
			 * @param cfg.moduleId {String} Идентификатор модуля.
			 * @param cfg.eventName {String} Название сообщения.
			 * @param cfg.tags {String[]} Теги фильтрации.
			 * @param cfg.handler {Function} Обработчик сообщения.
			 * @param cfg.scope {Object} Контекст вызова обработчика.
			 * @return {Object} Конфигурация обработчика.
			 * @return {Function} return.handler Обработчик сообщения.
			 * @return {Object} return.scope Контекст вызова обработчика.
			 * @return {String[]} return.tags Теги фильтрации.
			 */
			function addListener(cfg) {
				var moduleId = cfg.moduleId;
				var eventName = cfg.eventName;
				var tags = cfg.tags;
				var listeners = subscribers[moduleId];
				if (!listeners) {
					listeners = subscribers[moduleId] = {};
				}
				var eventListeners = listeners[eventName];
				if (!eventListeners) {
					eventListeners = listeners[eventName] = [];
				}
				var listener = {
					handler: cfg.handler,
					scope: cfg.scope,
					tags: tags
				};
				eventListeners.push(listener);
				return listener;
			}

			/**
			 * Регистрирует в системе обработчик ptp сообщения. Если для модуля уже был зарегистрирован
			 * обработчик такого же сообщения с такими же тегами фильтрации, он будет удален, а вместо него будет
			 * зарегистрирован новый обработчик.
			 * @param cfg {Object} Параметры обработчика
			 * - **moduleId** String: Идентификатор модуля
			 * - **eventName** String: Название ptp сообщения
			 * - **tags** String[]: Теги фильтрации
			 * - **handler** Function: Обработчик сообщения
			 * - **listener** Object: Ссылка на зарегистрированное сообщения (см. addListener())
			 * @private
			 */
			function addPtpListener(cfg) {
				var moduleId = cfg.moduleId;
				var eventName = cfg.eventName;
				var tags = cfg.tags;
				var ptpEvent = ptpEvents[eventName];
				if (!ptpEvent) {
					ptpEvent = ptpEvents[eventName] = {};
				}
				var ptpEventListeners = ptpEvent[moduleId];
				if (!ptpEventListeners) {
					ptpEventListeners = ptpEvent[moduleId] = [];
				} else {
					removePtpMessageHandler({
						moduleId: moduleId,
						eventName: eventName,
						tags: tags
					});
				}
				ptpEventListeners.push({
					handler: cfg.handler,
					scope: cfg.scope,
					tags: tags,
					listener: cfg.listener
				});
			}

			/**
			 * Выполняет проверку тегов. Если объект тегов null, возвращает пустой массив. Если объект тегов не является
			 * массивом, выводит сообщение в консоль и возвращает массив из одного переданного элемента
			 * приведенного к строке.
			 * @param tags {Object} Объект тегов фильтрации
			 * @return {String[]} Массив тегов фильтрации
			 * @private
			 */
			function processTags(tags) {
				var processedTags = tags || [];
				if (processedTags.constructor !== Array) {
					core.writeErrorMessage(Terrasoft.Resources.Core.unsupportedTagsTypeError);
					processedTags = [tags.toString()];
				}
				return processedTags;
			}

			var exports = {
				/**
				 * Выполняет подписку модуля на сообщение. Если заданы теги фильтрации, то управление в обработчик
				 * будет передаваться в том случае, если при публикации сообщения был установлен хотя бы один из
				 * тегов подписки.
				 * @param {String} eventName Название сообщения
				 * @param {Function} eventHandler Обработчик сообщения
				 * @param {Object} scope Контекст выполнения функции-обработчика
				 * @param {String[]} tags - Теги для фильтрации сообщений
				 */
				subscribe: function(eventName, eventHandler, scope, tags) {
					if (scope && !Ext.isObject(scope)) {
						tags = scope;
					}
					var eventDescriptor = this.getEventDescriptor(eventName);
					var moduleId = this.id;
					checkEventDescriptor({
						messageDirection: Terrasoft.MessageDirectionType.SUBSCRIBE,
						eventName: eventName,
						eventDescriptor: eventDescriptor,
						moduleId: moduleId,
						moduleName: this.moduleName
					});
					var listenerTags = processTags(tags);
					var listener = addListener({
						moduleId: moduleId,
						eventName: eventName,
						tags: listenerTags,
						handler: eventHandler,
						scope: scope
					});
					if (eventDescriptor && eventDescriptor.mode === "ptp") {
						addPtpListener({
							moduleId: moduleId,
							eventName: eventName,
							tags: listenerTags,
							handler: eventHandler,
							scope: scope,
							listener: listener
						});
					} else {
						if (!observable.hasListener(eventName)) {
							observable.on(eventName, innerEventHandler);
						}
					}
				},

				/**
				 * Unsubscribes from ptp message event.
				 * @param {String} eventName Message name.
				 * @param {String[]} tags Tags for message filtering.
				 */
				unsubscribePtp: function(eventName, tags) {
					var listenerTags = processTags(tags);
					removePtpMessageHandler({
						moduleId: this.id,
						eventName: eventName,
						tags: listenerTags
					});
				},

				/**
				 * Выполняет публикацию модулем сообщения.  Если заданы теги фильтрации, то управление получит тот
				 * обработчик, при подписке которого был установлен хотя бы один из переданных тегов.
				 * @param {String} eventName Название сообщения
				 * @param {Object} eventArguments Параметры сообщения
				 * @param {String[]} tags - Теги для фильтрации сообщений
				 * @return {*}
				 */
				publish: function(eventName, eventArguments, tags) {
					var eventDescriptor = this.getEventDescriptor(eventName);
					var result = null;
					var publishTags = processTags(tags);
					checkEventDescriptor({
						messageDirection: Terrasoft.MessageDirectionType.PUBLISH,
						eventName: eventName,
						eventDescriptor: eventDescriptor,
						moduleId: this.id,
						moduleName: this.moduleName
					});
					if (eventDescriptor && eventDescriptor.mode === "ptp") {
						result = publishPtpMessage({
							eventName: eventName,
							eventArguments: eventArguments,
							tags: publishTags
						});
					} else {
						var args = {
							eventName: eventName,
							eventArguments: eventArguments,
							tags: publishTags
						};
						result = observable.fireEvent(eventName, args);
					}
					return result;
				},

				clearListeners: function() {
					core.removeModuleListeners(this.moduleName, this.id);
				},

				getCurrentModuleDynamicMessages: function() {
					if (!dynamicMessages[this.id]) {
						dynamicMessages[this.id] = {};
					}
					return dynamicMessages[this.id];
				},
				/**
				 * Получает конфигурацию события из дескриптора модуля или списка динамически добавленных сообщений
				 * @param {String} eventName имя сообщения
				 * @return {Object} Объект, содержащий направление сообщения и его тип
				 */
				getEventDescriptor: function(eventName) {
					var moduleDynamicMessages = this.getCurrentModuleDynamicMessages();
					if (moduleDynamicMessages[eventName]) {
						return moduleDynamicMessages[eventName];
					}
					var moduleDescriptor = core.getModuleDescriptor(this.moduleName);
					return moduleDescriptor && moduleDescriptor.messages && moduleDescriptor.messages[eventName] || null;
				},

				/**
				 * Загружает дескрипторы модулей, имена которых переданы первым параметром
				 * @param {Array} moduleNames массив, содержащий коллекцию имен модулей
				 * @param {Function} callback Функция, которая будет вызвана при получении ответа от сервера
				 * @param {Object} scope Контекст, в котором будет вызвана функция callback
				 */
				 //TODO: #CRM-33247 remove calls from configuration modules
				requireModuleDescriptors: function(moduleNames, callback, scope) {
					var self = this;
					var config = prepareRequireModuleDescriptorsConfig(core, moduleNames);
					if (config.descriptorsRequestBody.length > 0) {
						var jsonData = config.descriptorsRequestBody;
						Terrasoft.ServiceProvider.executeRequest("QueryModuleDescriptors", jsonData, function(result) {
							if (result.success) {
								var moduleDescriptors = result;
								var descriptorsConfigForLoad = config.descriptorsConfigForLoad;
								var requestedDescriptors = config.requestedDescriptors;
								for (var moduleName in moduleDescriptors) {
									if (!moduleDescriptors.hasOwnProperty(moduleName)) {
										continue;
									}
									var moduleDescriptor = moduleDescriptors[moduleName];
									var moduleConfig = descriptorsConfigForLoad[moduleName];
									if (moduleDescriptor !== null) {
										core.setModuleDescriptor(moduleName, moduleDescriptor);
										requestedDescriptors[moduleName] = moduleDescriptor;
									} else if (moduleConfig.mode === "find") {
										core.setModuleDescriptor(moduleName, {
											path: null
										});
										define(moduleConfig.name, emptyModuleDefinition);
									} else {
										throw new Terrasoft.exceptions.ItemNotFoundException();
									}
								}
								if (callback) {
									core.safeExecute({
										fn: callback,
										scope: scope || this,
										args: [requestedDescriptors],
										errorInfo: {
											moduleName: self.moduleName,
											moduleId: self.id
										}
									});
								}
							}
						}, this);
					} else {
						if (callback) {
							core.safeExecute({
								fn: callback,
								scope: scope || this,
								args: [config.requestedDescriptors],
								errorInfo: {
									moduleName: self.moduleName,
									moduleId: self.id
								}
							});
						}
					}
				},
				loadModule: core.loadModule,
				unloadModule: core.unloadModule,

				/**
				 * Расширяет набор сообщений, обрабатываемых модулем. Расширение должно быть произведено до вызовов
				 * методов publish и subscribe
				 * @param {Object} messageConfig объект, содержащий конфигурацию сообщений
				 */
				registerMessages: function(messageConfig) {
					var moduleDynamicMessages = this.getCurrentModuleDynamicMessages();
					for (var msgName in messageConfig) {
						if (messageConfig.hasOwnProperty(msgName)) {
							var config = messageConfig[msgName];
							if (!this.getEventDescriptor(msgName) ||
									(config && config.direction === Terrasoft.MessageDirectionType.BIDIRECTIONAL)) {
								moduleDynamicMessages[msgName] = config;
							}
						}
					}
				},

				/**
				 * Удаляет динамически зарегистрированные сообщения
				 * @param {Array} messages (optional) - массив имен сообщений для очистки регистрации. Если
				 * пуст - очищаются все
				 */
				unRegisterMessages: function(messages) {
					var moduleId = this.id;
					var listeners = subscribers[moduleId];
					var moduleDynamicMessages = this.getCurrentModuleDynamicMessages();
					var removeAllMessages = true;
					var key;
					if (!messages) {
						messages = [];
						for (key in moduleDynamicMessages) {
							if (moduleDynamicMessages.hasOwnProperty(key)) {
								messages.push(key);
							}
						}
					}
					for (var i = 0, messagesLength = messages.length; i < messagesLength; i++) {
						var msgName = messages[i];
						if (moduleDynamicMessages.hasOwnProperty(msgName)) {
							if (moduleDynamicMessages[msgName].mode === "ptp") {
								var ptpEvent = ptpEvents[msgName];
								if (ptpEvent) {
									ptpEvent[moduleId] = null;
									delete ptpEvent[moduleId];
								}
							}
							moduleDynamicMessages[msgName] = null;
							delete moduleDynamicMessages[msgName];
						}
						if (listeners && listeners.hasOwnProperty(msgName)) {
							listeners[msgName] = null;
							delete listeners[msgName];
						}
					}
					for (key in moduleDynamicMessages) {
						if (moduleDynamicMessages.hasOwnProperty(key)) {
							removeAllMessages = false;
							break;
						}
					}
					if (removeAllMessages) {
						dynamicMessages[moduleId] = null;
						delete dynamicMessages[moduleId];
					}
				}

			};
			sandboxConstructor.prototype = exports;
			sandboxConstructor.constructor = sandboxConstructor;
			return sandboxConstructor;
		});
		require(["less"]);
	}

	var bootstrap = {
		init: init,
		"mapResourcesToPath": mapResourcesToPath
	};

	var define = global.define;
	if (define) {
		define(bootstrap);
	} else {
		global.Bootstrap = bootstrap;
	}

})(this);