"use strict";
class NavObjectStorage
{
    constructor()
    {    
        /** @type {Object.<string,NavObject>} */ this.navObjects = {};
        /**@type {Array.<string>} */ this.navObjectUidsSorted = [];
        /** @type {number} */ this.noOfNavObjectsToRender = 0;
    }

    /** Resets every calculated value of every objects/function inside */
    reset()
    {
        this.noOfNavObjectsToRender = 0;
        for(var uido in this.navObjects) //Object
        {
            this.navObjects[uido].reset();
            for(var uidf in this.navObjects[uido].navFunctions) //Functions
            {
                this.navObjects[uido].navFunctions[uidf].reset();
            }
        }
    }

    /** Recalculates every value of every objects/function inside */
    update()
    {
        this.reset();

        this.navObjectUidsSorted = Object.keys(this.navObjects);
        this.navObjectUidsSorted.sort();

        for(var uido in this.navObjects) //Object
        {
            for(var uidf in this.navObjects[uido].navFunctions) //Functions
            {
                for(var uidc in this.navObjects[uido].navFunctions[uidf].navCalls) //Calls
                {
                    var amount = this.navObjects[uido].navFunctions[uidf].navCalls[uidc].amount;
                    var uidoRef = this.navObjects[uido].navFunctions[uidf].navCalls[uidc].objectUid;
                    var uidfRef = this.navObjects[uido].navFunctions[uidf].navCalls[uidc].functionName;

                    //This object, outgoing calls
                    this.navObjects[uido].noOfCalls += amount;
                    this.navObjects[uido].noOfCallsOut += amount;
                    this.navObjects[uido].navFunctions[uidf].noOfCalls += amount;
                    this.navObjects[uido].navFunctions[uidf].noOfCallsOut += amount;
                    
                    //Other object, incomming calls
                    this.navObjects[uidoRef].noOfCalls += amount;
                    this.navObjects[uidoRef].noOfCallsIn += amount;
                    this.navObjects[uidoRef].navFunctions[uidfRef].noOfCalls += amount;
                    this.navObjects[uidoRef].navFunctions[uidfRef].noOfCallsIn += amount;
                }  
                
                this.navObjects[uido].navFunctions[uidf].render = 
                (
                    //Local
                    (this.navObjects[uido].navFunctions[uidf].type === 0 && ERDSETTINGS.showLocalFunctions == "all") ||
                    (this.navObjects[uido].navFunctions[uidf].type === 0 && ERDSETTINGS.showLocalFunctions == "with_calls" && this.navObjects[uido].navFunctions[uidf].noOfCalls > 0) ||
                    //Global
                    (this.navObjects[uido].navFunctions[uidf].type === 1 && ERDSETTINGS.showGlobalFunctions == "all") ||
                    (this.navObjects[uido].navFunctions[uidf].type === 1 && ERDSETTINGS.showGlobalFunctions == "with_calls" && this.navObjects[uido].navFunctions[uidf].noOfCalls > 0) ||
                    //Trigger
                    (this.navObjects[uido].navFunctions[uidf].type === 2 && ERDSETTINGS.showTriggerFunctions == "all") ||
                    (this.navObjects[uido].navFunctions[uidf].type === 2 && ERDSETTINGS.showTriggerFunctions == "with_calls" && this.navObjects[uido].navFunctions[uidf].noOfCalls > 0)
                );

                this.navObjects[uido].noOfFunctionToRender += this.navObjects[uido].navFunctions[uidf].render ? 1 : 0;
                
            }

            this.navObjects[uido].render = 
            (
                (ERDSETTINGS.showObjects == "all") ||
                (ERDSETTINGS.showObjects == "included" && this.navObjects[uido].included) ||
                (ERDSETTINGS.showObjects == "included_with_calls" && (this.navObjects[uido].totalCalls > 0 && this.navObjects[uido].included))
            );

            this.noOfNavObjectsToRender += this.navObjects[uido].render ? 1 : 0;
        }
    }

    /**
     * Adds an object or updates existig (not included) object.
     * @param {NavObject} navObject 
     */
    addOrUpdateObject(navObject)
    {
		if(this.navObjects[navObject.uid] === undefined || (this.navObjects[navObject.uid].included === false && navObject.included === true))
		{
            this.navObjects[navObject.uid] = navObject;
		}
    }
}

class NavObject
{
    /**
     * Constructor
     * @param {string} type 
     * @param {number} id 
     * @param {string} name 
     * @param {boolean} included 
     */
    constructor(type, id, name, included)
    {
		/** @type string */ this.uid = ErdUtil.uid(type, id);
		/** @type string */ this.type = type;
		/** @type string */ this.typeShort = ErdUtil.shortType(type);
		/** @type number */ this.id = id;
		/** @type string */ this.name = name;
		/** @type boolean */ this.included = included;

        /** @type {Object.<string,NavFunction>} */ this.navFunctions = {};
        /** @type {Object.<string,NavVar>} */ this.navVars = {};

        /** @type {Object} */ this.jointJsEntity = null;
        this.reset();
    }	
    
    reset()
    {
        //Extended
        /** @type boolean */ this.render = false; //calculated via update
        /** @type number */ this.noOfCalls = 0; //calculated via update
        /** @type number */ this.noOfCallsIn = 0; //calculated via update
        /** @type number */ this.noOfCallsOut = 0; //calculated via update
        /** @type number */ this.noOfFunctionToRender = 0; //calculated via update
    }

    /**
	 * Adds function or updates existig (not included) function.
	 * @param {NavFunction} navFunction The function to add/update.
	 */
	addOrUpdateFunction(navFunction)
	{
		if(this.navFunctions[navFunction.name] === undefined || (this.navFunctions[navFunction.name].included === false && navFunction.included === true))
		{
            this.navFunctions[navFunction.name] = navFunction;
		}
	}
}

class NavFunction
{
    /**
     * Constructor
     * @param {string} realName 
     * @param {number} id 
     * @param {number} type 
     * @param {bool} included 
     * @param {Object.<string,NavVar>} params
     */
    constructor(realName, id, type, included, params = {})
    {
        /** @type string */ this.name = realName.toLocaleLowerCase();
        /** @type string */ this.realName = realName;
        /** @type number */ this.id = id;
        /** @type number */ this.type = type; //0 = local, 1 = global, 2 = trigger
        /** @type boolean */ this.included = included;

        /** @type {Object.<string,NavVar>} */ this.navParams = params;
        /** @type {Object.<string,NavVar>} */ this.navVars = {};
        /** @type {Object.<string,NavCall>} */ this.navCalls = {};

        /** @type {Object} */ this.jointJsEntity = null;
    }

    reset()
    {
        //Extended
        /** @type number */ this.render =  false; //calculated via update
        /** @type number */ this.noOfCalls = 0; //calculated via update
        /** @type number */ this.noOfCallsIn = 0; //calculated via update
        /** @type boolean */ this.noOfCallsOut = 0; //calculated via update
    }

    /**
     * Adds an outgoing call or increases the amount
     * @param {NavCall} navCall 
     */
    addOrUpdateCall(navCall)
    {
        if(this.navCalls[navCall.callUid] === undefined)
        {
            this.navCalls[navCall.callUid] = navCall;
        }
        else
        {
            this.navCalls[navCall.callUid].amount += 1;
        }
    }
}

class NavCall
{
    /**
     * Constructor.
     * 
     * A call from inside an objects function to another object´s function.
     * @param {string} objectType 
     * @param {number} objectId 
     * @param {string} functionName 
     */
    constructor(objectType, objectId, functionName)
    {
        /** @param {string} */ this.callUid = ErdUtil.callUid(objectType, objectId, functionName);
        /** @param {string} */ this.objectType = objectType;
        /** @param {number} */ this.objectId = objectId;
        /** @param {string} */ this.objectUid = ErdUtil.uid(objectType, objectId);
        /** @param {string} */ this.functionName = functionName;

        /** @param {number} */ this.amount = 1;
    }
}

class NavVar
{
    /**
     * Constructor.
     * 
     * NAV Variable or Parameter inside a object/function. 
     * Only vars of other NAV objects (No vars of tye int,text,bool,...), so we can find function calls in code. 
     * 
     * @param {string} realName 
     * @param {number} id 
     * @param {string} objectType 
     * @param {number} objectId 
     * @param {boolean} temp 
     * @param {boolean} ref
     */
    constructor(realName, id, objectType, objectId, temp, ref = false)
    {
        /** @param {string} */ this.name = realName.toLocaleLowerCase();
        /** @param {string} */ this.realName = realName;
        /** @param {number} */ this.id = id;
        /** @param {string} */ this.objectType = objectType;
        /** @param {number} */ this.objectId = objectId;
        /** @param {string} */ this.objectUid = ErdUtil.uid(objectType, objectId);
        /** @param {boolean} */ this.temp = temp;
        /** @param {boolean} */ this.ref = ref;
    }
}

