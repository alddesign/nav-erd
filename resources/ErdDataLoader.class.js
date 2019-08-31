"use strict";
class ErdDataLoader
{
	constructor()
	{
		this.init(); 
	}

	init()
	{
		this.loaded = false;
		/** @type {NavObjectStorage} */this.store = new NavObjectStorage();
	}

	/**
	 * Parsing the source file
	 * @param {Array.<string>} lines 
	 */
	load(lines)
	{
		this.init();

		this.parseFile(lines);

		if(this.store.noOfNavObjectsToRender < 1)
		{
			var error = new Error("No NAV Objects found. Are you providing a the a correct file? (NAV ojects as text)");
			error.name = "ERD Error";

			throw error;
		}

		this.loaded = true;
		return true;
	}

	parseFile(lines)
	{
		this.loadnavObjects(lines, true); //Load Objects, Functios, Vars,... (Entities)
		this.loadnavObjects(lines, false); //Load Calls (Relations)

		this.store.update();
	}

	//#region Main
	/* NAV Objects (example) : See nav-object.example.js*/
	loadnavObjects(lines = [], loadObjects = true)
	{
		var line = "";
		/** @type {ErdLineScope} */
		var scope = new ErdLineScope();

		for(var c = 0; c < lines.length; c++)
		{
			line = String(lines[c]);
			
			scope.functionLine = false;
			line = this.prepareLine(line, scope);
			scope.triggerLine = this.lineIsTrigger(line);

			if(!scope.inBlockComment)
			{
				//Object
				if(line.match(/^OBJECT (Table|Page|Codeunit|Report|XMLport|Query|MenuSuite)/) !== null)
				{
					scope.currentNavObject = this.newNavObjectFound(line, loadObjects);

					scope.currentFunction = null;
					scope.inLocalVars = false;
					scope.inGlobalVars = false;
				}

				//Global Var Scope Start
				if(line.match(/^ +VAR/) !== null && c >= 2 && lines[c-1].match(/^ +{$/) !== null && lines[c-2].match(/^ +CODE$/) !== null)
				{
					scope.inGlobalVars = true;
					scope.inLocalVars = false;
					scope.currentFunction = null;
				}
				//Local Var Scope Start, Global Var Scope End
				if(line.match(/^ +VAR/) !== null && c >= 1 && (lines[c-1].match(/^ +PROCEDURE .+/) !== null || lines[c-1].match(/^ +LOCAL PROCEDURE .+/) !== null))
				{
					scope.inGlobalVars = false;
					scope.inLocalVars = true;
				}

				//Trigger
				if(scope.triggerLine > 0)
				{
					scope.inGlobalVars = false;
					scope.inLocalVars = scope.triggerLine === 2;
					scope.currentFunction = this.newNavTriggerFunctionFound(line, scope.currentNavObject, loadObjects);
				}

				//Local Var Scope End
				if(scope.inLocalVars && line.match(/^ +BEGIN$/) !== null)
				{
					scope.inLocalVars = false;
				}

				//Var (Check if line matches "  CMWoMgt@1000000001 : Codeunit 70030;" )
				if(loadObjects && (scope.inGlobalVars || scope.inLocalVars) && line.match(/^ +.+@[0-9]{10} : .+;$/) !== null && line.match(/^ +PROCEDURE .+/) === null)
				{
					this.newVarFound(line, scope.currentNavObject, scope.inLocalVars, scope.currentFunction, scope.loadObjects);	
				}

				//Function Start
				if(line.match(/^ +PROCEDURE .+/) !== null || line.match(/^ +LOCAL PROCEDURE .+/) !== null)
				{
					scope.currentFunction = this.newNavFunctionFound(line, scope.currentNavObject, scope.loadObjects);
					scope.functionLine = true;
					scope.inGlobalVars = false;
				}

				//Calls
				if(!loadObjects && !scope.inGlobalVars && !scope.inLocalVars && !scope.functionLine && scope.currentFunction != null)
				{
					this.findCalls(line, scope.currentNavObject, scope.currentFunction);
				}
			}
		}

		if(!loadObjects)
		{
			this.store.update();
		}
	}
	//#endregion

	/**
	 * Finds calls...
	 * @param {string} line 
	 * @param {NavObject} currentNavObject 
	 * @param {NavFunction} currentNavFunction 
	 */
	findCalls(line, currentNavObject, currentNavFunction)
	{
		var vars = Object.assign(
			{}, 
			this.store.navObjects[currentNavObject.uid].navFunctions[currentNavFunction.name].navParams, //params
			this.store.navObjects[currentNavObject.uid].navFunctions[currentNavFunction.name].navVars, //locals
			this.store.navObjects[currentNavObject.uid].navVars //globals
		);

		line = line.toLowerCase();

		var functionName = "";
		for(var varName in vars)
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
					var toNavObject = this.store.navObjects[vars[varName].objectUid];

					if(toNavObject.navFunctions[functionName] != undefined)
					{ 
						var navCall = new NavCall(toNavObject.type, toNavObject.id, functionName);
						this.store.navObjects[currentNavObject.uid].navFunctions[currentNavFunction.name].addOrUpdateCall(navCall);
					}
				}
			}	
		}
	}

	/**
	 * VAR found in line
	 * @param {string} line 
	 * @param {boolean} local Indicates wether the Var is in Object (FALSE) or Function (FALSE) context.
	 * @param {NavObject} currentNavObject
	 * @param {NavFunction} currentFunction
	 */
	newVarFound(line, currentNavObject, local = false, currentFunction = null)
	{
		line = line.replace(/^ +/, ""); //Trim leading spaces " "
		line = line.replace(/;$/, ""); //Trim tailing ";"
		var navVar = this.parseParamVar(line);

		if(navVar != null)
		{
			if(local)
			{
				this.store.navObjects[currentNavObject.uid].navFunctions[currentFunction.name].navVars[navVar.name] = navVar;
			}
			else
			{
				this.store.navObjects[currentNavObject.uid].navVars[navVar.name] = navVar;
			}

			var navObject = new NavObject(navVar.objectType, navVar.objectId, "", false);
			this.store.addOrUpdateObject(navObject);
		}
	}

	/**
	 * Trigger function found in line
	 * @param {string} line 
	 * @param {navObject} currentNavObject 
	 * @param {boolean} loadObjects 
	 */
	newNavTriggerFunctionFound(line, currentNavObject, loadObjects = true)
	{
		var name;

		line = line.substr(line.lastIndexOf(" ") + 1);
		name = line.substr(0, line.indexOf("="));

		//Function
		var navFunction = new NavFunction(name, null, 2, true); //trigger functions have no id!
		if(loadObjects)
		{
			this.store.navObjects[currentNavObject.uid].addOrUpdateFunction(navFunction);
		}
		return(navFunction);
	}

	/**
	 * Function found in line
	 * @param {string} line 
	 * @param {navObject} currentNavObject 
	 * @param {boolean} loadObjects 
	 */
	newNavFunctionFound(line, currentNavObject, loadObjects = true)
	{
		var type;
		var name;
		var id;
		/** @type {object.<string,NavVar>} */ 
		var params = {};

		type = (line.match(/^ +LOCAL PROCEDURE .+/) !== null) ? 0 : 1;
		line = line.substring(line.indexOf("PROCEDURE ") + 10);
		name = line.substring(0, line.indexOf("@"));
		line = line.substring(line.indexOf("@") + 1);
		id = line.substring(0, line.indexOf("("));
		line = line.substring(line.indexOf("(") + 1, line.lastIndexOf(");"));

		//Params
		var paramsText = line.split(";");
		/** @type {NavVar} */ 
		var param;

		for(var c = 0; c < paramsText.length; c++)
		{
			param = this.parseParamVar(paramsText[c]);
			if(param != null)
			{
				params[param.name] = param;
				if(loadObjects)
				{
					var navObject = new NavObject(param.objectType, param.objectId, "", false);
					this.store.addOrUpdateObject(navObject);
				}
			}
		}

		//Function
		var navFunction = new NavFunction(name, id, type, true, params);
		if(loadObjects)
		{
			this.store.navObjects[currentNavObject.uid].addOrUpdateFunction(navFunction);
		}
		return(navFunction);
	}

	/**
	 * Object found in line
	 * @param {string} line 
	 * @param {boolean} loadObjects 
	 */
	newNavObjectFound(line, loadObjects = true)
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

		var navObject = new NavObject(type, id, name, true); 
		if(loadObjects)
		{
			this.store.addOrUpdateObject(navObject);
		}

		return(navObject);
	} 
	//#endregion

	//#region Object & Functions Helpers
	/**
	 * Parses text to parm/var Object.
	 * @param {String} text Text to be parsed to param/var. Example: "VAR Rec@1000000000 : Record 5092" 
	 * @returns	{NavVar}
	*/
	parseParamVar(text)
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

		return new NavVar(name, id, objectType, objectId, temp);
	}
	//#endregion

	//#region Line Helpers
	lineIsTrigger(line)
	{
		for(var trigger of ERDSETTINGS.triggers)
		{
			if(line.match(new RegExp("^ +" + trigger + "\\=BEGIN$")) !== null) // OnInsert=BEGIN
			{
				return(1);
			}

			if(line.match(new RegExp("^ +" + trigger + "\\=VAR$")) !== null) // OnInsert=VAR
			{
				return(2);
			}
		}

		return(0);
	}

	/**
	 * Removes String literals, Comments and recognizes Comment Blocks
	 * @param {string} line 
	 * @param {ErdLineScope} scope 
	 * @returns {string} line
	 */
	prepareLine(line, scope)
	{
		if(scope.inGlobalVars || scope.inLocalVars || line === "")
		{
			return line;
		}

		/** @type {Array.<string>} */
		var matches = [];

		//Remove string literals is the saves way to start:
		matches = line.match(new RegExp(/'[^']*'/g));
		var match;
		if(matches !== null)
		{
			for(match of matches) { line = line.replace(match, ""); }
		}

		//Remove block comments which {are} inline
		matches = line.match(new RegExp(/{[^}]*}/g));
		if(matches !== null)
		{
			for(match of matches) { line = line.replace(match, ""); }
		}

		/*
		//Check line/block comments
		var l = line.length;
		var s = "";
		var templine = "";
		for(var c = 0; c < l; c++)
		{
			s = line[c];
			
			if(scope.inBlockComment === false)
			{
				if(s === "/" && line[c+1] === "/") //Line ends here
				{
					break;
				}
				if(s === "{")
				{
					scope.inBlockComment = true;
					break;
				}
				templine += s;
			}
			if(scope.inBlockComment === true)
			{
				if(s === "}")
				{
					scope.inBlockComment = false;
				}
			}
		}
		line = templine;
		*/

		return line;
	}
}