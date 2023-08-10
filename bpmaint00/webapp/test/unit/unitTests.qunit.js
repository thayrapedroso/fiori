/* global QUnit */
QUnit.config.autostart = false;

sap.ui.getCore().attachInit(function () {
	"use strict";

	sap.ui.require([
		"bpmaint00/bpmaint00/test/unit/AllTests"
	], function () {
		QUnit.start();
	});
});