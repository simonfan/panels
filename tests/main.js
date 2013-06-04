require.config({
	urlArgs: "bust=" + Math.random(),
	baseUrl: '',
	paths: {
		// basic libraries
		'jquery': 'components/jquery/jquery',
		'underscore': 'components/underscore/underscore',
		'backbone': 'components/backbone/backbone',

		'buildable': 'components/buildable/buildable',
		'_interface': 'components/_interface/_interface',

		// jquery-ui draggable
		// requires: core, widget, mouse and draggable
		'jquery-ui-core': 'components/jquery-ui/ui/jquery.ui.core',
		'jquery-ui-widget': 'components/jquery-ui/ui/jquery.ui.widget',
		'jquery-ui-mouse': 'components/jquery-ui/ui/jquery.ui.mouse',
		'jquery-ui-draggable': 'components/jquery-ui/ui/jquery.ui.draggable',

		// the module files go here
		'panels': '../panels',

		// DEMO
		'demo-main': 'demo',	// the main file for the demo

		// UNIT TESTS
		'tests-main': 'tests',	// the main file for tests

		// other tests go here
		'example-tests': 'tests/example-tests',
	},
	shim: {
		'backbone': {
			deps: ['underscore', 'jquery'],
			exports: 'Backbone'
		},
		'jquery-ui-core': {
			deps: ['jquery']
		},
		'jquery-ui-widget': {
			deps: ['jquery','jquery-ui-core']
		},
		'jquery-ui-mouse': {
			deps: ['jquery','jquery-ui-core','jquery-ui-widget']
		},
		'jquery-ui-draggable': {
			deps: ['jquery','jquery-ui-core','jquery-ui-widget','jquery-ui-mouse']
		},
	}
});
	
if (window.__unit) {

	// load the tests
	require(['tests-main'], function(undef) {

		// tests were already run in the main tests file

		// QUnit was set not to autostart inline in tests.html
		// finally start the QUnit engine.
		QUnit.load();
		QUnit.start();
	});

} else {

	require(['demo-main'], function(demo) {

	});

}