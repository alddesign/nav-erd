//Globals
var navObjects = null;
var totalNavObjects = 0;
var totalNavObjectsIncluded = 0;
var totalNavObjectsRendered = 0;
var navObjectsSorted = null;

var erdId = "ig-erd";
var fileId = "ig-file";
var loaderId = "ig-loader";
var newLine = "\r\n";
var dlgId = "ig-dlg";
var callUidSeparator = ".";//String.fromCharCode(9); //TAB
var triggers = ["OnInsert","OnModify","OnDelete","OnRename","OnValidate","OnLookup","OnInitReport","OnPreReport","OnPostReport","OnPreDataItem","OnAfterGetRecord","OnPostDataItem","OnAfterAssignField","OnAfterAssignVariable","OnAfterGetField","OnAfterGetRecord","OnAfterInitRecord","OnAfterInsertRecord","OnAfterModifyRecord","OnBeforeInsertRecord","OnBeforeModifyRecord","OnBeforePassField","OnBeforePassVariable","OnInitXMLport","OnPreXMLport","OnPostXMLport","OnPreXMLItem","OnInit","OnOpenPage","OnClosePage","OnFindRecord","OnNextRecord","OnAfterGetCurrRecord","OnAfterGetRecord","OnNewRecord","OnInsertRecord","OnModifyRecord","OnDeleteRecord","OnQueryClosePage","OnValidate (Page fields)","OnLookup (Page fields)","OnDrillDown","OnAssistEdit","OnControlAddin","OnAction","OnBeforeTestRun","OnAfterTestRun","OnBeforeOpen"];
var isDlg = false;

function loadFile()
{	
	var file = document.getElementById(fileId).files[0];
	var reader = new FileReader();

	reader.onload = function(progressEvent)
	{
		lines = this.result.split(newLine);
		parseFile(lines);
	};

	reader.readAsText(file);
}

function parseFile(lines)
{
	dlg("Loading NAV objects...");
	setTimeout(function()
	{
		loadNavObjects(lines, true); //Load Objects, Functios, Vars,... (Entities)
		dlg("Loading NAV relations..");
		setTimeout(function()
		{
			loadNavObjects(lines, false); //Load Calls (Relations)
			drawErd(); //!!
		}, 100);
	}, 100); 

}

//#region Main
/* NAV Objects (example) :
{
	table50000 :
	{
		uid : "table50000"
		type : "table",
		typeShort : "t",
		id : 50000,
		name : "IG General Setup",
		included : true,
		functions : 
		{
			createnewsetup : 
			{
				name : "createnewsetup",
				realname : "CreateNewSetup",
				functionUid : "table50000.createnewsetup",
				id : 1000005,
				included : true,
				type : 0, //0 = local, 1 = global, 2 = trigger
				params : 
				{
					rec : {name : "rec", realName : "Rec", id=1000000, objectType : "table", objectId : 50001, objectUid = "table50001", temp : false},
					...
				}
				vars: 
				{
					igtaskmgt : {name : "igtaskmgt", realName : "IGTaskMgt", id : 1000002, objectType : "codeunit", objectId : 50030, objectUid = "codeunit50030", temp : false},
					...
				}
				calls : 
				{
					"codunit50012.checksetup" : {callUid : "codunit50012.checksetup", objectType : "codeunit", objectId : 50012, objectUid : "codeunit500012", functionName : "checksetup", amount : 1},
				},
				totalCalls : 0,
				totalCallsIn : 0,
				totalCallsOut : 0
			},
			OnDelete :
			{ ... }
		},
		vars
		{
			itemrec : {name : "itemrec", realName : "ItemRec", id=1000000, objectType : "table", objectId : 27, objectUid = "table27" temp : false},
			...
		},
		totalCalls : 0,
		totalCallsIn : 0,
		totalCallsOut : 0,		
		totalLocalFunctions : 2,
		totalGlobalFunctions : 5,
		totalTriggerFunctions : 3,
		totalLocalFunctionsWithCalls : 0,
		totalGlobalFunctionsWithCalls : 4,
		totalTriggerFunctionsWithCalls : 1
	},
	...
}
*/
function loadNavObjects(lines = [], loadObjects = true)
{
	if(loadObjects)
	{
		navObjects = {};
		navObjectsSorted = [];
	}

	var line = "";
	var currentNavObject = null;
	var currentFunction = null;
	var inLocalVarScope = false;
	var inGlobalVarScope = false;
	var inBlockComment = false;
	var functionLine = false;
	var triggerLine = 0;
	var varLine = false;

	var c;
	for(c = 0; c < lines.length; c++)
	{
		line = String(lines[c]);
		functionLine = false;
		//Comments
		line = removeLineComments(line);
		line = removeStringLiterals(line);
		inBlockComment = isInBlockComment(line, inBlockComment);
		triggerLine = lineIsTrigger(line);

		if(!inBlockComment)
		{
			//Object
			if(line.match(/^OBJECT (Table|Page|Codeunit|Report|XMLport|Query|MenuSuite)/) !== null)
			{
				currentNavObject = newNavObjectFound(line, loadObjects);

				currentFunction = null;
				inLocalVarScope = false;
				inGlobalVarScope = false;
			}

			//Global Var Scope Start
			if(line.match(/^ +VAR/) !== null && c >= 2 && lines[c-1].match(/^ +{$/) !== null && lines[c-2].match(/^ +CODE$/) !== null)
			{
				inGlobalVarScope = true;
				inLocalVarScope = false;
				currentFunction = null;
			}
			//Local Var Scope Start, Global Var Scope End
			if(line.match(/^ +VAR/) !== null && c >= 1 && (lines[c-1].match(/^ +PROCEDURE .+/) !== null || lines[c-1].match(/^ +LOCAL PROCEDURE .+/) !== null))
			{
				inGlobalVarScope = false;
				inLocalVarScope = true;
			}

			//Trigger
			if(triggerLine > 0)
			{
				inGlobalVarScope = false;
				inLocalVarScope = triggerLine == 2;
				currentFunction = newNavTriggerFunctionFound(line, currentNavObject, loadObjects);
			}

			//Local Var Scope End
			if(inLocalVarScope && line.match(/^ +BEGIN$/) !== null)
			{
				inLocalVarScope = false;
			}

			//Var (Check if line matches "  CMWoMgt@1000000001 : Codeunit 70030;" )
			if(loadObjects && (inGlobalVarScope || inLocalVarScope) && line.match(/^ +.+\@[0-9]{10} : .+\;$/) !== null && line.match(/^ +PROCEDURE .+/) === null)
			{
				newVarFound(line, currentNavObject, inLocalVarScope, currentFunction, loadObjects);	
			}

			//Function Start
			if(line.match(/^ +PROCEDURE .+/) !== null || line.match(/^ +LOCAL PROCEDURE .+/) !== null)
			{
				currentFunction = newNavFunctionFound(line, currentNavObject, loadObjects);
				inGlobalVarScope = false;
			}

			//Calls
			if(!loadObjects && !inGlobalVarScope && !inLocalVarScope && !functionLine && currentFunction != null)
			{
				findCalls(line, currentNavObject, currentFunction);
			}
		}
	}

	if(!loadObjects)
	{
		prepareNavObjects();
	}
}
//#endregion

//#region Found
function findCalls(line, currentNavObject, currentFunction)
{
	var vars = Object.assign
	(
		{}, 
		navObjects[currentNavObject.uid].functions[currentFunction.name].params, //params
		navObjects[currentNavObject.uid].functions[currentFunction.name].vars, //locals
		navObjects[currentNavObject.uid].vars //globals
	);

	line = line.toLowerCase();

	var varName;
	var functionName = "";
	var call = null;
	var toNavObject = null;
	for(varName in vars)
	{
		if(line.match(new RegExp(".*"+varName+"\\..*;")) !== null) //Line matches VarName.<?>;
		{
			functionName = "";
			line = line.substr(line.indexOf(varName + ".") + (varName + ".").length);

			if(line.indexOf("(") > -1)
			{
				functionName = line.substr(0, line.indexOf("(")).toLowerCase();
			}
			else
			{
				functionName = line.substr(0, line.indexOf(";")).toLowerCase();
			}

			//Found a call
			if(functionName != "")
			{
				if(navObjects[vars[varName].objectUid].functions[functionName] != undefined)
				{ 
					toNavObject = navObjects[vars[varName].objectUid];
					call = createCall(toNavObject, toNavObject.functions[functionName]);
					addOrUpdateCall(currentNavObject, currentFunction, call);
				}
			}
		}	
	}
}

/**
 * Processes a line with Var information and adds the new var to existing navObject or Function.
 * @param {String} line The line with the Var information.
 * @param {Boolean} local Indicates wether the Var is in Object (FALSE) or Function (FALSE) context.
 * @param {Object} currentNavObject The parente navObject.
 * @param {Object} currentFunction The parent Function.
 */
function newVarFound(line, currentNavObject, local = false, currentFunction = null)
{
	line = line.replace(/^ +/, ""); //Trim leading spaces " "
	line = line.replace(/;$/, ""); //Trim tailing ";"
	var navVar = parseParamVar(line);

	if(navVar != null)
	{
		if(local)
		{
			navObjects[currentNavObject.uid].functions[currentFunction.name].vars[navVar.name] = navVar;
		}
		else
		{
			navObjects[currentNavObject.uid].vars[navVar.name] = navVar;
		}

		var navObject = createNavObject(navVar.objectType, navVar.objectId, "", false);
		addOrUpdateNavObject(navObject);
	}
}

function newNavTriggerFunctionFound(line, currentNavObject, loadObjects = true)
{
	var local = true;
	var name;
	var id = null;
	var params = {};

	line = line.substr(line.lastIndexOf(" ") + 1);
	name = line.substr(0, line.indexOf("="));

	//Function
	var navFunction = createFunction(name, id, 2, true, params);
	if(loadObjects)
	{
		addOrUpdateFunction(currentNavObject, navFunction);
	}
	return(navFunction);
}

function newNavFunctionFound(line, currentNavObject, loadObjects = true)
{
	var type;
	var name;
	var id;
	var params = {};

	type = (line.match(/^ +LOCAL PROCEDURE .+/) !== null) ? 0 : 1;
	line = line.substring(line.indexOf("PROCEDURE ") + 10);
	name = line.substring(0, line.indexOf("@"));
	line = line.substring(line.indexOf("@") + 1)
	id = line.substring(0, line.indexOf("("));
	line = line.substring(line.indexOf("(") + 1, line.lastIndexOf(");"));

	//Params
	var paramsText = line.split(";");
	var param;
	var navObject;
	var c;
	for(c = 0; c < paramsText.length; c++)
	{
		param = parseParamVar(paramsText[c]);
		if(param != null)
		{
			params[param.name] = param;
			if(loadObjects)
			{
				navObject = createNavObject(param.objectType, param.objectId, "", false);
				addOrUpdateNavObject(navObject);
			}
		}
	}

	//Function
	var navFunction = createFunction(name, id, type, true, params);
	if(loadObjects)
	{
		addOrUpdateFunction(currentNavObject, navFunction);
	}
	return(navFunction);
}

function newNavObjectFound(line, loadObjects = true)
{
	var type = "";

	switch(true)
	{
		case line.indexOf("OBJECT Table ") == 0 	: type = "table"; line = line.substring(13); break;
		case line.indexOf("OBJECT Page ") == 0 		: type = "page"; line = line.substring(12); break;
		case line.indexOf("OBJECT Codeunit ") == 0 	: type = "codeunit"; line = line.substring(16); break;
		case line.indexOf("OBJECT Report ") == 0 	: type = "report"; line = line.substring(14); break;
		case line.indexOf("OBJECT XMLport ") == 0 	: type = "xmlport"; line = line.substring(15); break;
		case line.indexOf("OBJECT Query ") == 0 	: type = "query"; line = line.substring(13); break;
		case line.indexOf("OBJECT MenuSuite ") == 0 : type = "menusuite"; line = line.substring(17); break;
	}

	var id = line.substring(0, line.indexOf(" "));
	var name = line.substring(line.indexOf(" ") + 1);

	var navObject = createNavObject(type, id, name, true) 
	if(loadObjects)
	{
		addOrUpdateNavObject(navObject);
	}

	return(navObject);
} 
//#endregion

//#region Object & Functions Helpers
function prepareNavObjects()
{
	var uid;
	var functionUid;
	for(uid in navObjects)
	{
		//Objects
		navObjects[uid].totalCalls = navObjects[uid].totalCallsIn + navObjects[uid].totalCallsOut;
		for(functionUid in navObject.functions)
		{
			//Funcitons
			navObject.functions[functionUid].totalCalls = navObject.functions[functionUid].totalCallsIn + navObject.functions[functionUid].totalCallsOut;
			if(navObject.functions[functionUid].totalCallsIn > 0 ||navObject.functions[functionUid].totalCallsOut > 0)
			{
				switch(navFunction.type)
				{
					case 0 : navObjects[uid].totalLocalFunctionsWithCalls += 1; break;
					case 1 : navObjects[uid].totalGlobalFunctionsWithCalls += 1; break;
					case 2 : navObjects[uid].totalTriggerFunctionsWithCalls += 1; break;
				}
			}
		}

		if(navObjects[uid].included)
		{
			if(navObjects[uid].totalCalls > 0)
			{
				
			}
			else
			{

			}
		}
		else
		{
			if(navObjects[uid].totalCalls > 0)
			{

			}
			else
			{
				
			}
		}

		navObjects[uid].totalFunctionsRendered = calculateTotalFunctionsRendered(navObjects[uid]);

	}

	//Custom Sort method
	/*navObjectsSorted.sort(function(a,b)
	{ 
		return(b[1] - a[1]); 
	});*/
}

/**
 * Adds function to navObject or updates existig (not included) function.
 * @param {String} objectUid The uid of the navObject.
 * @param {Object} navFunction The function to add/update.
 */
function addOrUpdateFunction(navObject, navFunction)
{
	navFunction.functionUid = createFunctionUid(navObject, navFunction);
	if(navObjects[navObject.uid].functions[navFunction.name] === undefined)
	{
		navObjects[navObject.uid].functions[navFunction.name] = navFunction;
		switch(navObjects[navObject.uid].functions[navFunction.name].type)
		{ 
			case 0 : navObjects[navObject.uid].totalLocalFunctions += 1; break;
			case 1 : navObjects[navObject.uid].totalGlobalFunctions += 1; break;
			case 2 : navObjects[navObject.uid].totalTriggerFunctions += 1; break;
		}
	}
	else
	{
		//Update only if existing function is not inclueded.
		if(navFunction.included && !navObjects[navObject.uid].functions[navFunction.name].included)
		{
			navObjects[navObject.uid].functions[navFunction.name] = navFunction;
		}
	}
}

function createFunction(realName, id, type = 0, included = false, params = {}, vars = {}, calls = {})
{
	return 
	({
		name : realName.toLowerCase(), 
		realName : realName, 
		id : id, 
		functionUid : null, 
		type : type, //0 = local, 1 = global, 2 = trigger 
		included : included, 
		params : params, 
		vars : vars, 
		calls : calls,
		totalCalls : 0,
		totalCallsIn : 0,
		totalCallsOut : 0
	});
}

function createFunctionUid(navObject, navFunction)
{
	return(navObject.uid + callUidSeparator + navFunction.name);
}

/**
 * Parses text to parm/var Object.
 * @param {String} text Text to be parsed to param/var. Example: "VAR Rec@1000000000 : Record 5092" 
 * @returns	{Object} param/var object. Returns null if not able to parse, or param/var is not needed (datatype text,interger,...)
*/
function parseParamVar(text)
{
	if(text == "")
	{
		return(null);
	}

	if(text.indexOf("VAR ") == 0)
	{
		text = text.substring(3);
	}
	var name = text.substr(0, text.indexOf("@"));
	text = text.substring(text.indexOf("@") + 1);
	var id = text.substr(0, text.indexOf(" : "));
	text = text.substring(text.indexOf(" : ") + 3);

	//Check vartype
	var objectType = "";
	var temp = false;
	switch(true)
	{
		case text.indexOf("Record") == 0 			: objectType = "table"; break;
		case text.indexOf("TEMPORARY Record") == 0 	: 
			objectType = "table"; 
			temp = true;
			text = text.substring(text.indexOf(" ") + 1); 
			break;
		case text.indexOf("Page") == 0 				: objectType = "page"; break;
		case text.indexOf("Codeunit") == 0			: objectType = "codeunit"; break;
		case text.indexOf("Report") == 0			: objectType = "report"; break;
		case text.indexOf("XMLport") == 0			: objectType = "xmlport"; break;
		case text.indexOf("Query") == 0				: objectType = "query"; break;
		case text.indexOf("MenuSuite") == 0			: objectType = "menusuite"; break;
		default 									: return(null);
	}

	text = text.substring(text.indexOf(" ") + 1);
	var objectId = parseInt(text);

	return(createParamVar(name, id, objectType, objectId, temp));
}

/**
 * Creates a param(var) object.
 * @returns param(var) object. 
 */
function createParamVar(realName, id, objectType, objectId, temp = false)
{  
	return {name : realName.toLowerCase(), realName : realName, id : id, objectType : objectType, objectId : objectId, objectUid : createUid(objectType, objectId), temp : temp};
}

/**
 * Creates a NavObject object.
 * @returns NavObject object. 
 */
function createNavObject(type, id, name, included, functions = {}, vars = {})
{
	return
	({
		uid : createUid(type, id), 
		type : type, 
		typeShort : typeToTypeShort(type), 
		id : id, 
		name : name, 
		included : included, 
		functions : functions, 
		vars : vars,
		totalTriggerFunctions : 0,
		totalTriggerFunctionsWithCalls : 0,
		totalLocalFunctions : 0,
		totalLocalFunctionsWithCalls : 0,
		totalGlobalFunctions : 0,
		totalGlobalFunctionsWithCalls : 0,
		totalCalls : 0,
		totalCallsIn : 0,
		totalCallsOut : 0
	});
}

/**
 * Adds new, or updates existing NavObject.
 * @param {Object} navObject The navObject to add/update.
 */
function addOrUpdateNavObject(navObject)
{
	if(navObjects[navObject.uid] === undefined)
	{
		navObjects[navObject.uid] = navObject
	}
	else
	{
		if(navObject.included)
		{
			navObjects[navObject.uid].name = navObject.name;
			navObjects[navObject.uid].included = navObject.included;
		}
	}
}

function createCall(toNavObject, toFunction)
{
	return {
		callUid : createCallUid(toNavObject.type, toNavObject.id, toFunction.name), 
		objectType : toNavObject.type, 
		objectId : toNavObject.id, 
		objectUid : createUid(toNavObject.type, toNavObject.id), 
		functionName : toFunction.name, 
		amount : 0
	};
}

function addOrUpdateCall(fromNavObject, fromFunction, call)
{
	if(navObjects[fromNavObject.uid].functions[fromFunction.name].calls[call.callUid] == undefined)
	{
		navObjects[fromNavObject.uid].functions[fromFunction.name].calls[call.callUid] = call;
	}
	navObjects[fromNavObject.uid].functions[fromFunction.name].calls[call.callUid].amount += 1;

	navObjects[fromNavObject.uid].totalCallsOut += 1;
	navObjects[fromNavObject.uid].functoins[fromFunction.name].totalCallsOut += 1;

	navObjects[call.objectUid].totalCallsIn += 1;
	navObjects[call.objectUid].functions[call.functionName].totalCallsIn += 1;
}

function createCallUid(objectType, objectId, functionName)
{
	return(createUid(objectType, objectId) + callUidSeparator + functionName.toLowerCase());
}

function createUid(type, id)
{
	return(type + String(id));
}

function typeToTypeShort(type)
{
	switch(type)
	{
		case "table" : return("T");
		case "page" : return("P");
		case "codeunit" : return("C");
		case "report" : return("R");
		case "xmlport" : return("X");
		case "query" : return("Q");
		case "menusuite" : return("M");
		default : return("");
	}
}
//#endregion

//#region Line Helpers
function lineIsTrigger(line)
{
	var c;
	for(c in triggers)
	{
		if(line.match(new RegExp("^ +" + triggers[c] + "\\=BEGIN$")) !== null) // OnInsert=BEGIN
		{
			return(1);
		}

		if(line.match(new RegExp("^ +" + triggers[c] + "\\=VAR$")) !== null) // OnInsert=VAR
		{
			return(2);
		}
	}

	return(0);
}

/**
 * Removes inline comments from the line.
 * @param {String} line The text line with potential comments.
 * @returns {String} The text line without comments.
 */
function removeLineComments(line)
{
	if(line.indexOf("//") > -1)
	{
		line = line.substring(0,line.indexOf("//"));
	}

	while(line.indexOf("/*") > -1 && line.indexOf("*/") > -1)
	{
		line = line.substr(0, line.indexOf("/*")) + line.substr(line.indexOf("*/") + 2);
	}

	return(line);
}

/**
 * Checks if code is currently in a block comment section.
 * @param {String} line The text line.
 * @param {Boolean} inBlockComment Code is currently in a block comment section.
 * @returns {Boolean} TRUE if code is currently in a block comment section, FALSE if not.
 */
function isInBlockComment(line, inBlockComment)
{
	if(inBlockComment)
	{
		return(line.indexOf("*/") == -1);
	}
	else
	{
		return(line.indexOf("/*") > -1);
	}
}

function removeStringLiterals(line)
{
	while(true)
	{
		var first = line.indexOf("'");
		var second = line.indexOf("'", first + 1);
		if(first > -1 && second > first)
		{
			line = line.substr(0, first) + line.substr(second + 1);
		}
		else
		{
			break;
		}
	}

	return(line);
}

function downloadSvg(link)
{
	var svg = document.querySelector("svg");
	var erd = document.getElementById(erdId);

	if(svg === undefined)
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

function dlg(message = null)
{
	if(message !== null)
    {
		if(isDlg)
		{
			dlg(null);
		}
		isDlg = true;
		$('body').loadingModal({ text: message });
    }
    else
    {
		if(isDlg)
		{
			isDlg = false;
			$('body').loadingModal('destroy');
		}
    }
}


//#endregion