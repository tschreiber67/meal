MEAL PLANNER 0.1

A working local recipe planner and grocery-list generator.

QUICK START

Extract the ZIP. Open a terminal in the meal-planner-starter folder.

node --version
node scripts/preflight.mjs
node --test
node server.mjs

Open http://127.0.0.1:3000 in a browser on the same computer.
Press Ctrl+C in the terminal to stop the server.

Requires an existing Node.js 18 or later runtime and a modern browser.
Node itself is not bundled. No npm install, package download, database,
account, API key, cloud service, or external connection is required.
The local server uses the loopback interface only.

CURRENT FEATURES

Browse eight recipes using 18 fictional food records.
Add meals to dates and meal slots. Change servings or remove meals.
See a consolidated grocery list that updates when the plan changes.
Save plans in browser storage. Export and import plans as JSON files.
Export grocery lists as text or JSON.
Run the same grocery calculations from the command line.

TERMINAL COMMANDS

node cli.mjs recipes
node cli.mjs plan
node cli.mjs groceries
node cli.mjs groceries fixtures/plan-week.json --format json
node cli.mjs validate fixtures/plan-week.json

To save a result without a browser:

node cli.mjs groceries > grocery-list.txt
node cli.mjs groceries --format json > grocery-list.json

All commands default to fixtures/plan-week.json if no plan file is supplied.
Examples use a fixed week in October 2026; this is editable example data.

WHAT IS NOT IMPLEMENTED

Nutrition aggregation, nutrition readouts, goal comparisons, food pricing,
package purchasing, pantry subtraction and automatic meal selection are not
implemented. Food records already include fictional nutrient fields to support
adding nutrition aggregation. Existing tests check the current planner and
grocery behavior only. Passing them does not verify nutrition calculations.

The next bounded backend change is described in NUTRITION_REQUIREMENTS.txt.
Its expected values are in fixtures/nutrition/. No nutrition implementation or
nutrition acceptance test suite is included in this starting version.

FILES

src/catalog.mjs          Catalog validation and indexing.
src/planner.mjs          Plan validation, portion scaling, grocery aggregation.
src/load.mjs             Local JSON file loading for Node.
cli.mjs                  Terminal interface.
server.mjs               Static local file server; no application database.
public/                  Browser editor using the same planner module.
data/                    Fictional foods and sample recipes.
fixtures/                Valid, empty and invalid example plans.
fixtures/nutrition/      Inputs and expected values for the next backend change.
test/                    Current baseline tests.
examples/                Readable outputs from the current example plan.
ARCHITECTURE.txt          Current boundaries and data flow.
DATA_NOTES.txt            Units, sample-data limits and fixture meanings.
NUTRITION_REQUIREMENTS.txt  Technical specification for the next change.
LICENSE.txt              MIT license for this starter.
reference-data/          Bundled USDA/BLS reference inputs and source notices.

Use JSON exports to transfer a plan between browsers or computers. Browser
storage is specific to the local origin and can be cleared by the browser.
There is no remote backup or synchronization.

Checks were run on Node 24.22.1. Node 18 is the intended minimum, not a claim
that this archive bundles or has been run on every supported Node version.

Baseline calculation, CLI and local-server checks pass. Browser JavaScript
syntax was checked, but live browser interactions have not yet been verified.

OFFLINE SOURCE BUNDLE

reference-data/SOURCES.txt lists the included USDA recipes, nutrition records,
portion weights and government price tables. Open that file to see contents,
source dates, units and limitations. Source data is included in this ZIP; the
sandbox does not need to download it.

The source bundle is not loaded by the current app. The visible baseline and
nutrition fixtures still use the labeled fictional foods in data/. The next
backend change remains the one in NUTRITION_REQUIREMENTS.txt. Source imports,
food matching and price conversions have not been implemented.
