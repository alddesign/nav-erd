# nav-erd
Microsoft Dynamics NAV Entity Relationship Diagram.
Creates an Entity Relationship Diagram based on MS Dynamic NAV objects.
These are NOT Table relations (1..n, n..1), but relations between NAV objects on code level. Which means: calling functions from other Objects and so on.

## Usage
1. Download, unzip, and just open "index.html" (no webserver needed)
2. Select "Browse", open a dynamics nav objects.txt file (no .fob files)
3. Select "Load ERD"
4. Done - the ERD is beeing generated

## Hints:
- Files with huge or many objects will take some time.
- edit "ErdSettings.js" to change look/feel and behavior.
- Further Documentation is on the way
- ES6 compatible browser needed. Works best with these (best-to-worst):  
