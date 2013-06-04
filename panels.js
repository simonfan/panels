/*
	One of the big problems in this module is that
	the movement of the panels must be synchronized.
	-------------------------------------------------
	|             | |             | |               |
	|             | |             | |               |
	|             | |             | |               |
	|      P1     | |     P2      | |      P3       |
	|             | |             | |               |
	|             | |             | |               |
	|             | |             | |               |
	|             | |             | |               |
	-------------------------------------------------

	When P1 is expanded, P2 or P3 must contract.

	The plan is to do that through a common controller, 
	the PanelController (backbone collection)
*/

define(['jquery','buildable','backbone','jquery-ui-draggable','underscore','_interface'], 
function(   $   , Buildable , Backbone , undef               , undef      , undef      ) {


	//////////////////////////////////////
	///////////// DIVIDER ////////////////
	//////////////////////////////////////

	var Divider = Object.create(Buildable);

	Divider.extend(Backbone.Events, {
		init: function(data) {

			data = _.extend({}, this.defaults, data);

			_.interface({
				id: 'Divider initialization',
				aux: '',
				obj: data,
				typeofs: {
					no: 'number',

					$dividerUl: 'object',
					prefix: 'object',
					suffix: 'object',

					axis: 'string',
					pos: 'number',
				}
			});

			// bind methods
			_.bindAll(this);

			this.data = data;

			// metadata
			this.no = data.no;
			this.axis = data.axis;

			// status
			this.lastposition = data.pos;
			this.position = data.pos;
			this.movement = 0;			// defines how much has the divider moved since last movement
			this.active = false;

			// outer objects
			this.$dividerUl = data.$dividerUl;
			this.prefix = data.prefix;
			this.suffix = data.suffix;

			// buiulding
			this._buildEl();
			this._buildDraggable();
		//	this._setProxy(['on']);

			// position at the right place
			this.positionAt(data.pos);
		},

		_buildEl: function() {
			this.$el = $('<li id="'+ this.id +'" class="panel-handle '+ this.axis +'"></li>');

			this.$el
				.css({
					position: 'absolute',
				})
				.data('divider-object', this)
				.appendTo(this.$dividerUl);
		},

		_buildDraggable: function() {

			this.$el
				.draggable({
					containment: 'parent',
					axis: this.axis,
				//	start: this._dragStart,
				//	stop: this._dragStop,
				//	drag: this._drag
				})
				.on('drag', this._drag)
				.on('dragstart', this._dragStart)
				.on('dragstop', this._dragStop);
		},

		_dragStart: function(e, ui) {
			this.active = true;

			this.trigger('dragstart');
		},

		_dragStop: function(e, ui) {
			this.active = false;

			// do not know if this is best solution
			this.$el.trigger('drag', e, ui);

			this.trigger('dragstop', this);
		},

		_drag: function(e, ui) {
			var xAxis = (this.axis === 'x'),
				size = xAxis ? this.$el.width() : this.$el.height(),
				ini = xAxis ? this.$el.offset().left : this.$el.offset().top;

			this.lastposition = this.position;
			this.position = ini + size/2;

			// how much has the divider moved
			this.movement = this.position - this.lastposition;

			console.log('MOVEMENT', this.movement)

			this.direction = (this.position - this.lastposition > 0) ? '+' : '-';

			this.trigger('drag', this);
		},

		///////////////////////////
		////////// API ////////////
		///////////////////////////

		positionAt: function(pos) {
			if (this.active) {
				return false;
			}

			var xAxis = (this.axis === 'x'),
				size = xAxis ? this.$el.width() : this.$el.height(),
				style = xAxis ? { left: pos - size/2 } : { top: pos - size/2 };

			this.position = pos;

			this.$el.offset(style);
			return this;
		},

		dragTo: function(pos, options) {
			var _this = this,
				xAxis = (this.axis === 'x'),
				size = xAxis ? this.$el.width() : this.$el.height(),
				style = xAxis ? { left: pos - size/2 } : { top: pos - size/2 },
				options = options || {};

			options.step = function(now, tween) { _this.$el.trigger('drag'); };

			this.$el.animate(style, options);
		},

	});


	//////////////////////////////////////
	///////////// PANEL //////////////////
	//////////////////////////////////////

	var Panel = Object.create(Buildable);
	Panel.extend(Backbone.Events, {
		defaults: {
			axis: 'x',
			priority: 1,
			size: '33.33%',
			min: undefined,
			max: undefined,
		},

		init: function(data) {

			data = _.extend({}, this.defaults, data);

			_.interface({
				id: 'Panel object',
				obj: data,
				typeofs: {
					id: 'string',
					axis: 'string',
					priority: 'number',

					controller: 'object',
					$panelUl: 'object',
				//	$el: 'object',

				//	size: 'number',		size might be either number or proportion (string)
				//	min: 'number',
				//	max: 'number',
				}
			});

			_.bindAll(this);

			this.data = data;

			// metadata
			this.id = data.id;
			this.axis = data.axis;
			this.priority = data.priority;
			this.size_ = data.size;		

			// outer objects
			this.controller = data.controller;
			this.$panelUl = data.$panelUl;

			// building
			this._buildEl(data.$el);

		},

		_buildEl: function($el) {
			this.$el = $el || $('<li id="panel-'+ this.id +'"class="panel"></li>');


			var panelstyle = {};

			// set the size
			if (this.axis === 'x') {
				panelstyle.minWidth = this.data.min;
				panelstyle.maxWidth = this.data.max;
				panelstyle.width = this.data.size;

			} else {
				panelstyle.minHeight = this.data.min;
				panelstyle.maxHeight = this.data.max;
				panelstyle.height = this.data.size;
			}

			this.$el
				.css(panelstyle)
				.appendTo(this.$panelUl);
		},

		///////////////////////////
		////////// API ////////////
		///////////////////////////

		// gets the panels's limits according to the axis
		limits: function(limit) {
			var offset = this.$el.offset(),
				limits;

			if (this.axis === 'x') {
				limits = {
					ini: offset.left,
					end: offset.left + this.$el.outerWidth(),
				}
			} else {
				limits = {
					ini: offset.top,
					end: offset.top + this.$el.outerHeight(),
				}
			}

			return limit ? limits[limit] : limits;
		},

		// sets or gets the panel size
		// if options are passed, assume it is an animation
		size: function(size, options) {
			if (options) {
				return (this.axis === 'x') ? this.$el.animate({ width: size }, options) : this.$el.animate({ height: size }, options);
			} else {
				return (this.axis === 'x') ? this.$el.width(size) : this.$el.height(size);
			}
		},
	});









	///////////////////////////////////////////
	///////////// CONTROLLER //////////////////
	///////////////////////////////////////////

	var PanelController = Object.create(Buildable);

	PanelController.extend(Backbone.Events, {
		init: function(data) {

			_.interface({
				id: 'Panel controller',
				obj: data,
				typeofs: {
					$div: 'object',
					axis: 'string',
				//	calcmethod: 'string',
				}
			});

			_.bindAll(this);

			this.data = data;

			// metadata
			// the axis of the panels
			this.axis = data.axis;

			// options
			this.calcmethod = data.calcmethod || 'basic';

			// outer objects
			// the html element within which the Panel controller 
			// is allowed to do anything it wishes
			this.$div = data.$div;


			// create an object where panels are stored
			this.panelIds = {};	// hash for the ids of each panel
			this.panels = [];
			this.dividers = [];
			this.lastdivpoints = [];
			this.divpoints = [];

			// building
			// setup the html
			this._setupHtml();
		},

		_setupHtml: function() {
			this.$div.addClass('panels');

			this.__setupDividerUl();
			this.__setupPanelUl();
		},

		__setupPanelUl: function() {
			// the <ul> element within which all panels are created
			// try to find an ul inside the given $div
			var $panelUl = this.$div.find('ul.panel-container');

			if ($panelUl) {
				this.$panelUl = $panelUl;

				this.__findPanels();

			} else {
				this.$panelUl = $('<ul class="panel-container"></ul>').appendTo(this.$div);
			}
		},

		__findPanels: function() {
			var _this = this;

			_.each(this.$panelUl.find('li.panel'), function(li, index) {
				var $panel = $(li)
					id = $panel.attr('id') || index;

				_this.append(id, {
					$el: $panel,
				});
			});
		},

		__setupDividerUl: function() {
			// the <ul> element within which all dividers are created
			this.$dividerUl = $('<ul class="panel-handle-container"></ul>').appendTo(this.$div);
		},

		// adds a panel at the end of the existing panels
		append: function(id, paneldata) {
			// build the panel
			var panel = this._buildPanel(id, paneldata);
			this.panelIds[ id ] = this.panels.length; 
			this.panels.push(panel);

			// build the divider
			var divider = this._buildDivider();
			this.dividers.push(divider);

			// update divpoints
			this._updateDivpoints();
		},

		// builds a panel object and returns it
		_buildPanel: function(id, paneldata) {
			if (this.panels[id]) {
				return false;
			}

			paneldata = _.extend(paneldata, {
				id: id + '',
				axis: this.axis,
				controller: this,
				$panelUl: this.$panelUl,
			});

			// build the panel
			return Panel.build(paneldata);
		},

		// builds a divider object and returns it
		_buildDivider: function() {
			var divider;

			// build the divider only if there is already a panel in the panel array.
			if (this.panels.length > 1) {

				var penultimatePanel = this.panels[this.panels.length - 2],
					pos = penultimatePanel.limits('end'),
					no = this.dividers.length;

				divider = Divider.build({
					no: no,
					$dividerUl: this.$dividerUl,
					axis: this.axis,
					pos: pos,

					prefix: this.panels[no - 1],
					suffix: this.panels[no]
				});

				divider.on('drag', this.dividerMove);

			} else {
				// insert a fake divider
				divider = { position: this.offset('left') };
			}

			return divider;
		},

		// handle movement at the dividers
		dividerMove: function(movingDivider) {
			// update the div points
			this._updateDivpoints();

			// normalize the divpoints
			this._calcDivpoints(movingDivider);

			this._setPanelSizes();

			this._setDividerPositions();
		},

		// convert array of sizes to divpoints
		// convert array of divpoints to sizes
		_convert: function(conversion, arr) {
			if (conversion === 'sizes-to-divpoints') {

				var divpoints = [ this.limits('ini') ];

				_.each(arr, function(size, index) {
					divpoints.push(divpoints[index - 1] + size);
				});

				return divpoints;

			} else if (conversion === 'divpoints-to-sizes') {

				var sizes = [];

				_.each(arr, function(divpoint, index) {
					if (index > 0) {
						sizes.push(divpoint - arr[index - 1]);
					}
				});

				return sizes;
			}
		},


		// fetches the divpoints from: 
		// - the divider objects (default)
		// 			OR
		// - the panels
		_updateDivpoints: function(source) {
			var source = source || 'dividers',
				divpoints;

			if (source === 'dividers') {
				// build the new div points
				divpoints = _.pluck(this.dividers, 'position');
				// add the end point
				divpoints.push( this.$div.offset().left + this.$div.width() );

			} else if (source === 'panels') {


				console.log('updated divpoints using panels as source')
				divpoints = [];

				_.each(this.panels, function(panel, index) {
					if (index === 0) {
						// if it is the first panel, add its ini point to the divpoints
						divpoints.push(panel.limits('ini'));
					}

					divpoints.push(panel.limits('end'));
				});
			}

			// set the divpoints to the new ones
			this._setDivpoints(divpoints);
		},

		// sets the divpoints and saves a copy of the old divpoints
		_setDivpoints: function(points) {
			this.lastdivpoints = this.divpoints;

			this.divpoints = points;
		},

		// passes the div points through a calculation method
		// which may analyze the movement of the divider and other factors
		_calcDivpoints: function(movingDivider) {
			var data = {
				divider: movingDivider,
				lastdivpoints: this.lastdivpoints,
				currdivpoints: this.divpoints,
			}

			var points = this._divpointCalcMethods[ this.calcmethod ].call(this, data);

			this._setDivpoints(points)
		},

		// the divpoint calculation methods
		_divpointCalcMethods: {
			basic: function(d) {
				var _this = this,
					divpoints = d.currdivpoints;

				_.each(d.currdivpoints, function(point, index) {
					if (index > 0) {
						var prev = divpoints[index - 1];

						if (point < prev) {

							if (d.divider.direction === '+') {

								divpoints[index] = prev;

							} else if (d.divider.direction === '-') {

								divpoints[index - 1] = point;

							}
						}
					}
				});

				return divpoints;
			},

			'proportional': function(d) {
				var _this = this,
					divpoints = [];

				if (d.divider.direction === '+') {

					console.log('crescent')

					// crescent!!

					var endDivpoint = _.last(this.divpoints),
						lastAfterDividerSize = endDivpoint - d.divider.lastposition;
						dividerIndex = d.divider.no;

					_.each(this.divpoints, function(point, index) {
						if (index > dividerIndex) {

							var afterPointSize = endDivpoint - point,
								pointProp = afterPointSize / lastAfterDividerSize,
								pointMovement = pointProp * d.divider.movement;

							// add the movement to the point
							divpoints[index] = point + pointMovement;

						} else if (index < dividerIndex) {
							divpoints[index] = point;

						} else {
							// index === dividerIndex
							divpoints[index] = d.divider.position;
						}
					});

				} else if (d.divider.direction === '-') {

					// decrescent!
					console.log('decrescent')

					var iniDivpoint = this.divpoints[0],
						lastBeforeDividerSize = d.divider.lastposition - iniDivpoint;
						dividerIndex = d.divider.no;
						
					_.each(this.divpoints, function(point, index) {
						if (index < dividerIndex) {

							var beforePointSize = point - iniDivpoint,
								pointProp = beforePointSize / lastBeforeDividerSize,
								pointMovement = pointProp * d.divider.movement;

							// add the movement to the point
							divpoints[index] = point + pointMovement;

						} else if (index > dividerIndex) {
							divpoints[index] = point;

						} else {
							// index === dividerIndex
							divpoints[index] = d.divider.position;
						}
					});


				}


				console.log('divpoints: ', divpoints);
				console.log('object divpoints: ', this.divpoints );

				console.log('divider pos: ', d.divider.position );


				return divpoints;

				// then discover which group is being compressed and which is being expanded

			},

			'proportional-compress-only': function(divider) {

			}
		},

		// sets the sizes of panels based on the divpoints
		_setPanelSizes: function() {
			var _this = this;

			_.each(this.divpoints, function(point, order) {
				if (order > 0) {
					var size = point - _this.divpoints[order-1];
					_this.panels[order -1].size(size);
				}
			});
		},

		// set divider positions based on the divpoints
		_setDividerPositions: function() {
			var _this = this;

			_.each(this.dividers, function(divider, index) {

				if (typeof divider.positionAt === 'function') {
					divider.positionAt( _this.divpoints[index] );
				}
			});
		},



		////////////////////////////
		/////////// API ////////////
		////////////////////////////

		// change the divpoint calculation method
		setCalcMethod: function(name, method) {
			if (method) {
				this._divpointCalcMethods[name] = method;
			}

			this.calcmethod = name;
		},

		limits: function(limit) {
			var offset = this.$div.offset(),
				limits;

			if (this.axis === 'x') {
				limits = {
					ini: offset.left,
					end: offset.left + this.$div.outerWidth(),
				}
			} else {
				limits = {
					ini: offset.top,
					end: offset.top + this.$div.outerHeight(),
				}
			}

			return limit ? limits[limit] : limits;
		},


		offset: function(what) {
			var offset = this.$div.offset();

			return what ? offset[what] : offset;
		},

		// animates the panels to the required sizes
		arrangePanels: function(sizes, options) {

			var _this = this,
				divpoints = [],
				options = options || {},
				resizeDeferrals = [];

			if ( _.isArray(sizes) ) {

				_.each(this.panels, function(panel, index) {
					// set the panel size
					var defer = panel.size(sizes[index], options);
					resizeDeferrals.push(defer);
				});

			} else {

				_.each(sizes, function(size, id) {
					var index = _this.panelIds[ id ],
						panel = _this.panels[ index ];

					var defer = panel.size(size, options);
					resizeDeferrals.push(defer);
				});
			}

			// wait for the animations to be done and then update the divpoints
			// and divider positions
			$.when.apply(null, resizeDeferrals)
				.then(function() {
					// update the divpoints using the panels as data source
					_this._updateDivpoints('panels');

					// set the divider positions
					_this._setDividerPositions();
				});

			return this;
		},

	});

	// define a jquery plugin behaviour
	$.fn.Panels = function(options) {
		options.$div = this;
		return PanelController.build(options);
	};

	return PanelController;
});