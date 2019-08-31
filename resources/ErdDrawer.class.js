"use strict";
class ErdDrawer
{
	constructor()
	{
		/** @type {ErdDataLoader} */
		this.erdDataLoader = null;
		/** @type {Object.<string, NavObject>} */
		this.navObjects = null;
		
		this.init();
	}

	/** @private */
	init()
	{
		this.drawn = false;
		/** @type {Array.<Object>} */
		this.navEntities = [];
		/** @type Object */
		this.graph = new joint.dia.Graph();
		this.paper = null;
		this.totalY = 0;
		this.maxX = 0;
	}

	//#region Main
	/** @param {ErdDataLoader} erdDataLoader */
	drawErd(erdDataLoader)
	{
		this.init();

		this.erdDataLoader = erdDataLoader;
		this.navObjects = this.erdDataLoader.store.navObjects;
		
		try
		{
			this.createNavObjectEntities(); //!!
			this.paper = this.createPaper();
			this.graph.addCells(this.navEntities);
			this.createRelations(); //!!
		}
		catch(ex)
		{
			var error = new Error("Error while drawing ERD:<br/>"+ex.message);
			error.name = ex.name;

			throw error;
		}
		
		this.drawn = true;
		return true;
	}
	//#endregion

	//#region Create and Draw Helpers
	createRelations()
	{
		for(var uid in this.navObjects)
		{
			for(var uidf in this.navObjects[uid].navFunctions)
			{
				/** @type {Object} */ var fromJointJsEntity = this.navObjects[uid].navFunctions[uidf].jointJsEntity;
				for(var uidc in this.navObjects[uid].navFunctions[uidf].navCalls)
				{
					/** @type {NavCall} */ var navCall = this.navObjects[uid].navFunctions[uidf].navCalls[uidc];
					/** @type {Object} */ var toJointJsEntity = this.navObjects[navCall.objectUid].navFunctions[navCall.functionName].jointJsEntity;
					this.connectEntities(fromJointJsEntity, "out", toJointJsEntity, "in", navCall.amount);
				}
			}
		}	
	}

	createNavObjectEntities()
	{
		var navObjectsPerRow = 0;
		for(navObjectsPerRow = 0; (navObjectsPerRow * navObjectsPerRow) < this.erdDataLoader.store.noOfNavObjectsToRender; navObjectsPerRow++)
		{ /* ... */ }

		this.maxX = 0;
		this.totalY = 0;

		var c = 0;
		var x = Math.round(ERDSETTINGS.navObjectEntityMarginX / 2);
		var y = ERDSETTINGS.navObjectEntityYOffset;
		var maxY = 0;

		var uid;
		for(uid of this.erdDataLoader.store.navObjectUidsSorted)
		{
			/** @type {NavObject} */
			var navObject = this.navObjects[uid];
			if(navObject.render)
			{
				var width = ERDSETTINGS.navObjectEntityWidth;
				var height = ERDSETTINGS.navObjectEntityHeightOffset +  (navObject.noOfFunctionToRender * (ERDSETTINGS.navFunctionEntityHeight + ERDSETTINGS.navFunctionEntityMaring));
				var navEntity = this.createNavObjectEntity(navObject, x, y, width, height);
				
				//Positioning:
				c += 1;
				x += navEntity.attributes.size.width + ERDSETTINGS.navObjectEntityMarginX;

				if(navEntity.attributes.size.height > maxY)
				{
					maxY = navEntity.attributes.size.height;
				}

				if(c == navObjectsPerRow)
				{
					y += maxY + ERDSETTINGS.navObjectEntityMarginY;
					this.totalY += maxY + ERDSETTINGS.navObjectEntityMarginY;
					if(x > this.maxX)
					{
						this.maxX = x;
					}
					maxY = 0;
					c = 0;
					x = Math.round(ERDSETTINGS.navObjectEntityMarginX/2);
				}

				//Mapping
				if(navEntity !== null)
				{
					this.navObjects[navObject.uid].jointJsEntity = navEntity;
				}
				
				this.navEntities.push(navEntity);
				this.createNavFunctionEntities(navObject, navEntity);
			}
		}

		this.totalY += maxY + ERDSETTINGS.navObjectEntityMarginY;
	}

	createNavObjectEntity(navObject, x, y, width, height)
	{
		var title = navObject.typeShort + String(navObject.id);
		if(navObject.name != "")
		{
			title += " " + navObject.name;
		}

		var navEntity = new joint.shapes.devs.Coupled(//eslint-disable-line
		{
			position: 
			{
				x: x,
				y: y
			},
			size: 
			{
				width: width,
				height: height
			}
		});

		navEntity.attr(".label/text", title);
		navEntity.attr(".label/font-size", ERDSETTINGS.navObjectFontSize);
		navEntity.attr(".label/font-weight", ERDSETTINGS.navObjectFontWeight);
		navEntity.attr(".label/font-family", ERDSETTINGS.navObjectFontFamily);
		navEntity.attr(".label/fill", ERDSETTINGS.navStrokeColor[navObject.type]);

		navEntity.attr(".body/rx", 5);
		navEntity.attr(".body/ry", 5);
		navEntity.attr(".body/stroke", ERDSETTINGS.navStrokeColor[navObject.type]);
		navEntity.attr(".body/stroke-width", ERDSETTINGS.navObjectstrokeWidth);
		navEntity.attr(".body/fill-opacity", ERDSETTINGS.navObjectFillOpacity);

		return(navEntity);
	}

	/**
	 * Drawing Functions
	 * @param {NavObject} navObject 
	 * @param {Object} navObjectEntity 
	 */
	createNavFunctionEntities(navObject, navObjectEntity)
	{
		var x = navObjectEntity.attributes.position.x + ERDSETTINGS.navFunctionEntityXMargin;
		var y = navObjectEntity.attributes.position.y + ERDSETTINGS.navFunctionEntityYOffset;
		var width = navObjectEntity.attributes.size.width - (2 * ERDSETTINGS.navFunctionEntityXMargin);
		var height = ERDSETTINGS.navFunctionEntityHeight;

		for(var uidf in navObject.navFunctions)
		{
			//Functions
			var navFunction = navObject.navFunctions[uidf];
			if(navFunction.render)
			{
				var navEntity = null;

				navEntity = this.createNavFunctionEntity(navFunction, x, y, width, height);
				navObjectEntity.embed(navEntity);
				this.navEntities.push(navEntity);
				y += height + ERDSETTINGS.navFunctionEntityMaring;

				//Mapping
				if(navEntity !== null)
				{
					this.navObjects[navObject.uid].navFunctions[uidf].jointJsEntity = navEntity;
				}
			}
		}
	}

	/**
	 * Drawing one function
	 * @param {NavFunction} navFunction 
	 * @param {number} x 
	 * @param {number} y 
	 * @param {number} width 
	 * @param {number} height 
	 */
	createNavFunctionEntity(navFunction, x, y, width, height)
	{	
		var title = navFunction.realName + "()";
		var inPorts = ["in"];
		var outPorts = ["out"];
		if(navFunction.type == 0)
		{
			inPorts = [];
		}

		var navEntity = new joint.shapes.devs.Atomic(//eslint-disable-line
		{
			position: 
			{
				x: x,
				y: y
			},
			size: 
			{
				width: width,
				height: height
			},
			inPorts : inPorts,
			outPorts : outPorts
		});

		navEntity.attr(".label/text", title);
		navEntity.attr(".label/font-size", ERDSETTINGS.navFunctionFontSize);
		navEntity.attr(".label/font-weight", ERDSETTINGS.navFunctionFontWeight);
		navEntity.attr(".label/font-family", ERDSETTINGS.navFunctionFontFamily);
		navEntity.attr(".label/fill", ERDSETTINGS.navFunctionStroke[navFunction.type]);

		navEntity.attr(".body/rx", ERDSETTINGS.navFunctionRx[navFunction.type]);
		navEntity.attr(".body/ry", ERDSETTINGS.navFunctionRx[navFunction.type]);
		navEntity.attr(".body/stroke", ERDSETTINGS.navFunctionStroke[navFunction.type]);
		navEntity.attr(".body/stroke-width", ERDSETTINGS.navFunctionStrokeWidth);
		navEntity.attr(".body/fill-opacity", ERDSETTINGS.navFunctionFillOpacity);

		return(navEntity);
	}

	connectEntities(source, sourcePort, target, targetPort, amount = 1) 
	{
		var link = new joint.shapes.devs.Link(
		{
			source: {
				id: source.id,
				port: sourcePort
			},
			target: {
				id: target.id,
				port: targetPort
			},
			labels : 
			[
				{
					attrs : 
					{
						text : 
						{
							text : amount.toString(),
							fill : ERDSETTINGS.linkLabelFill,
							"font-size" : ERDSETTINGS.linkLabelFontSize,
							"font-weight" : ERDSETTINGS.linkLabelFontWeight,
							"font-family" : ERDSETTINGS.linkLabelFontFamily
						},
						rect : 
						{
							stroke : ERDSETTINGS.linkLabelStrokeFill,
							strokeWidth : ERDSETTINGS.linkLabelStrokeWidth,
							rx : 5,
							ry : 5
						}
					},
					position : 0.5
				}
			]
		});

		link.addTo(this.graph).reparent();
	}
	//#endregion

	//#region Helpers
	createPaper()
	{
		return new joint.dia.Paper(//eslint-disable-line
		{
			el: document.getElementById(ERDSETTINGS.htmlIdErdDiv),
			width: this.maxX + 10,
			height: this.totalY,
			gridSize: 1,
			model: this.graph,
			snapLinks: true,
			linkPinning: false,
			embeddingMode: true,
			highlighting: {
				'default': {
					name: 'stroke',
					options: {
						padding: 6
					}
				},
				'embedding': {
					name: 'addClass',
					options: {
						className: 'highlighted-parent'
					}
				}
			},
		
			validateEmbedding: function(childView, parentView) {
		
				return parentView.model instanceof joint.shapes.devs.Coupled;//eslint-disable-line
			},
		
			validateConnection: function(sourceView, sourceMagnet, targetView, targetMagnet) {
		
				return sourceMagnet != targetMagnet;
			}
		});
	}
	//#endregion

	/**
	 * @public
	 * @param {*} link Html <a> DOM object to use
	 */
	downloadSvg(link)
	{
		var svg = document.querySelector("svg");
		var erd = document.getElementById(ERDSETTINGS.htmlIdErdDiv);

		if(!this.drawn || svg === undefined)
		{
			return;
		}

		//Set SVG widht and height to its actuale value in pixel:
		svg.attributes.width.value = String($(erd).css("width"));
		svg.attributes.height.value = String($(erd).css("height"));

		//Replace special chars
		var tspans = svg.getElementsByTagName("tspan");
		var c;
		for(c = 0; c < tspans.length; c++)
		{
			tspans[c].textContent = tspans[c].textContent.replace(new RegExp(String.fromCharCode(160), "g"), " ");
		}

		//Make it base64
		var base64svg = "data:image/svg+xml;base64," + btoa(new XMLSerializer().serializeToString(svg));
		link.href = base64svg;
	}
}