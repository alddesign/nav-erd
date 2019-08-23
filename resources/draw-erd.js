//Style - Object
var navObjectEntityWidth = 420;
var navObjectEntityMarginX = 80;
var navObjectEntityMarginY = 70;
var navObjectEntityYOffset = 15;
var navObjectEntityMinHeight = 60;
var navObjectEntitySortAsc = true; //TRUE = Ascending (Object with most Functions first), FALSE = Descending

//Style - Function
var navFunctionEntityHeight = 32;
var navFunctionEntityMaring = 15;
var navFunctionEntityXMargin = 60;
var navFunctionEntityYOffset = 50;

var erdElementId = "ig-erd";
var graph = null;
var paper = null;

var navObjectEntityHeightOffset = navObjectEntityMinHeight;
if (navObjectEntityMinHeight < navFunctionEntityYOffset) { navObjectEntityHeightOffset = navFunctionEntityYOffset;}
var navEntities = null;
var navEnityMapping = null; //Mapping NavObject (data) to NavEntity (drawing)
var totalY = 0;
var maxX = 0;

/*
	Example: navEnityMapping format
	{ 
		"table50032" : {type : "table", entity : <navEntity>},
		"table50032.getnextno" : {type : "table", entity : <navEntity>},
	}
*/
//#region Main
function drawErd()
{

	if(navObjects == null)
	{
		return;
	}

	graph = new joint.dia.Graph;
	navEntities = [];
	navEnityMapping = {};

	dlg("Drawing NAV objects...");
	setTimeout(function()
	{
		createNavObjectEntities(); //!!
		
		paper = createPaper();
		
		graph.addCells(navEntities);

		dlg("Drawing NAV relations...");
		setTimeout(function()
		{
			createRelations(); //!!
			dlg();
		}, 100);
	}, 100);
}
//#endregion

//#region Create and Draw Helpers
function createRelations()
{
	var uid;
	var functionName;
	var callUid;

	var functionUid;
	for(uid in navObjects)
	{
		for(functionName in navObjects[uid].functions)
		{
			for(callUid in navObjects[uid].functions[functionName].calls)
			{
				functionUid = navObjects[uid].functions[functionName].functionUid;
				connectEntities(navEnityMapping[functionUid].entity, "out", navEnityMapping[callUid].entity, "in");
			}
		}
	}	
}

function createNavObjectEntities()
{
	var navObjectsPerRow = 0;
	var len = totalNavObjectsToRender; //Object.keys(navObjects).length;
	for(navObjectsPerRow = 0; (navObjectsPerRow*navObjectsPerRow) < len; navObjectsPerRow++)
	{ /* ... */ }

	maxX = 0;
	totalY = 0;


	var c = 0;
	var x = Math.round(navObjectEntityMarginX / 2);
	var y = navObjectEntityYOffset;
	var maxY = 0;

	var uid;
	for(uid of navObjectUidsSorted)
	{
		var navObject = navObjects[uid];
		if(navObject.render)
		{
			var width = navObjectEntityWidth;
			var height = navObjectEntityHeightOffset +  (navObject.totalFunctionsToRender * (navFunctionEntityHeight + navFunctionEntityMaring));
			var navEntity = createNavObjectEntity(navObject, x, y, width, height);
			
			//Positioning:
			c += 1;
			x += navEntity.attributes.size.width + navObjectEntityMarginX;

			if(navEntity.attributes.size.height > maxY)
			{
				maxY = navEntity.attributes.size.height;
			}

			if(c == navObjectsPerRow)
			{
				y += maxY + navObjectEntityMarginY;
				totalY += maxY + navObjectEntityMarginY;
				if(x > maxX)
				{
					maxX = x;
				}
				maxY = 0;
				c = 0;
				x = Math.round(navObjectEntityMarginX/2);
			}

			//Mapping
			if(navEntity !== null)
			{
				navEnityMapping[navObject.uid] = {
					type : "table",
					entity : navEntity,
				};
			}
			
			navEntities.push(navEntity);
			createNavFunctionEntities(navObject, navEntity);
		}
	}

	totalY += maxY + navObjectEntityMarginY;
}

function createNavObjectEntity(navObject, x, y, width, height)
{
	var title = navObject.typeShort + String(navObject.id);
	if(navObject.name != "")
	{
		title += " " + navObject.name;
	}

	var navEntity = new joint.shapes.devs.Coupled(
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
	navEntity.attr(".label/font-size", navObjectFontSize);
	navEntity.attr(".label/font-weight", navObjectFontWeight);
	navEntity.attr(".label/font-family", navObjectFontFamily);
	navEntity.attr(".label/fill", getNavObjectStroke(navObject.type));

	navEntity.attr(".body/rx", 5);
	navEntity.attr(".body/ry", 5);
	navEntity.attr(".body/stroke", getNavObjectStroke(navObject.type));
	navEntity.attr(".body/stroke-width", navObjectStrokeWidth);
	navEntity.attr(".body/fill-opacity", navObjectFillOpacity);

	return(navEntity);
}

function createNavFunctionEntities(navObject, navObjectEntity)
{
	var x = navObjectEntity.attributes.position.x + navFunctionEntityXMargin;
	var y = navObjectEntity.attributes.position.y + navFunctionEntityYOffset;
	var width = navObjectEntity.attributes.size.width - (2 * navFunctionEntityXMargin);
	var height = navFunctionEntityHeight;

	var functionName;
	for(functionName in navObject.functions)
	{
		//Functions
		var navFunction = navObject.functions[functionName];
		if(navFunction.render)
		{
			var navEntity = null;

			navEntity = createNavFunctionEntity(navFunction, x, y, width, height);
			navObjectEntity.embed(navEntity);
			navEntities.push(navEntity);
			y += height + navFunctionEntityMaring;

			//Mapping
			if(navEntity !== null)
			{
				navEnityMapping[navFunction.functionUid] = {
					type : "function",
					entity : navEntity,
				};
			}
		}
	}
}

function createNavFunctionEntity(navFunction, x, y, width, height)
{	
	var title = navFunction.realName + "()";
	var inPorts = ["in"];
	var outPorts = ["out"];
	if(navFunction.type == 0)
	{
		inPorts = [];
	}

	var navEntity = new joint.shapes.devs.Atomic(
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
	navEntity.attr(".label/font-size", navFunctionFontSize);
	navEntity.attr(".label/font-weight", navFunctionFontWeight);
	navEntity.attr(".label/font-family", navFunctionFontFamily);
	navEntity.attr(".label/fill", getNavFunctionStroke(navFunction.type));

	navEntity.attr(".body/rx", getNavFunctionRx(navFunction.type));
	navEntity.attr(".body/ry", getNavFunctionRy(navFunction.type));
	navEntity.attr(".body/stroke", getNavFunctionStroke(navFunction.type));
	navEntity.attr(".body/stroke-width", navFunctionStrokeWidth);
	navEntity.attr(".body/fill-opacity", navFunctionFillOpacity);

	return(navEntity);
}

function connectEntities(source, sourcePort, target, targetPort) 
{
	
	var link = new joint.shapes.devs.Link({
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
						text : "1",
						fill : linkLabelFill,
						"font-size" : linkLabelFontSize,
						"font-weight" : linkLabelFontWeight,
						"font-family" : linkLabelFontFamily
					},
					rect : 
					{
						stroke : linkLabelStrokeFill,
						strokeWidth : linkLabelStrokeWidth,
						rx : 5,
						ry : 5
					}
				},
				position : 0.5
			}
		]
	});

	link.addTo(graph).reparent();
}
//#endregion

//#region Helpers

function createPaper()
{
	return new joint.dia.Paper(
	{
		el: document.getElementById(erdElementId),
		width: maxX + 10,
		height: totalY,
		gridSize: 1,
		model: graph,
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
	
			return parentView.model instanceof joint.shapes.devs.Coupled;
		},
	
		validateConnection: function(sourceView, sourceMagnet, targetView, targetMagnet) {
	
			return sourceMagnet != targetMagnet;
		}
	});
}
//#endregion