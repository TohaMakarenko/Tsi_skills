/**
 * Shows input window.
 * @param  {String} caption Window caption.
 * @param  {Function} handler Buttons handler and ESC key press handler.
 * @param  {Array} buttons Control buttons array.
 * Example:
 * buttons: ['yes', 'no', {
 *	className: 'Terrasoft.Button',
 *	returnCode: 'customButton',
 *	style: 'green',
 *	caption: 'myButton'
 * }]
 * @param  {Object} scope Context of handler execution.
 * @param  {Object} controls Custom control elements configuration
 * Example:
 {
	link: {
		dataValueType: Terrasoft.DataValueType.TEXT,
		caption: 'Text',
		value: 'Text',
		renderTo: 'custom-container'
	},
	checkbox: {
		dataValueType: Terrasoft.DataValueType.BOOLEAN,
		caption: 'Boolean',
		value: true,
		renderTo: 'custom-container'
	},
	date: {
		dataValueType: Terrasoft.DataValueType.DATE,
		caption: 'Date',
		value: new Date(Date.now()),
		renderTo: 'custom-container'
	}
}
 * @param  {Object} cfg {@link Terrasoft.utils#showMessageBox cfg}
 */
Terrasoft.utils.inputBox = function(caption, handler, buttons, scope, controls, cfg) {
	var messageBox = Terrasoft.MessageBox;
	var config = {
		caption: caption || "",
		handler: handler,
		buttons: buttons,
		scope: scope,
		controlConfig: controls,
		style: Terrasoft.MessageBoxStyles.BLUE
	};
	messageBox.applyDefaultConfig();
	Ext.apply(messageBox, cfg, config);
	messageBox.reConfigurateButtonItems();
	messageBox.setVisible(true);
};