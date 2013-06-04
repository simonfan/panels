define(['jquery','panels'], function($, Panels) {


/*
	window.xPanels = Panels.build({
		$div: $('#x-panels'),
		axis: 'x',
	});
*/

	window.xPanels = $('#x-panels').Panels({
		axis: 'x',
		calcmethod: 'proportional'
	});
});