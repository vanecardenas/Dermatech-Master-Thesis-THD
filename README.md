# Dermatech

This is the repository for the dermatech application.
This application was developed by Susana Vanessa Cardenas Garcia as a part of the master thesis
"Decision Support for Surgical Techniques With an Interactive Digital Application in a Dermatological Practice"
for the Technische Hochschule Deggendorf in the year 2021-2022.

## Deployed Version of the Application

The application is deployed and hosted on firebase and available at the following address:
https://dermatech-test.web.app/

## Local Execution of the Application

To execute the application locally, you have to have a current version of NodeJs installed.
NodeJs is available at the following address:
https://nodejs.org

Steps to execute the application locally:

- Install NodeJs (if not done yet)
- Clone or download the repository
- Navigate into the repository folder in your terminal
- Run: `npm install`
- Resolve errors in a dependency (refer to the section below)
- Run: `ng serve`
- The application should be available at `localhost:4200`

## Resolve local Errors

The version by Three.js (r105) used in this project may cause error in the typescript compiler.
For successfull compilation, local files of the package threejs have to be adapted as follows:

- node_modules\three\src\renderers\webvr\WebVRManager.d.ts : Change type VRDisplay to any
- node_modules\three\src\geometries\ExtrudeGeometry.d.ts : Comment out / delete import line of UVGenerator
- node_modules\three\src\materials\ShaderMaterial.d.ts : Comment out / delete import line of ShaderMaterialParameters
