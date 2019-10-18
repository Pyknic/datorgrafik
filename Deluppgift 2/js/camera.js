/*

 createCamera(): Initierar kameran

 rotateCameraX(): Roterar kameran kring x-axeln
 rotateCameraY(): Roterar kameran kring y-axeln
 rotateCameraZ(): Roterar kameran kring z-axeln

 translateCameraX(): Translerar kameran utmed x-axeln
 translateCameraY(): Translerar kameran utmed y-axeln
 translateCameraZ(): Translerar kameran utmed z-axeln

 updateCamera(): Beräknar transformationsmatrisen för kameran

*/


// Skapar ett objekt som håller reda på de vektorer, matriser och den quaternion
// som behövs för att rendera världen ur ett valfritt perspektiv (en kamera).
function createCamera(positionX, positionY, positionZ) {
	return {
		// Vi lagras kamerans position som en vektor.
		position: vec3.fromValues(positionX, positionY, positionZ),

		// Kamera-matrisen (eller vy-matrisen) är den matris som transformerar
		// en vektor från världs-rymd till vy-rymd.
		matrix: mat4.create(),

		// Just nu är dessa enkla enhetsvektorer, men varje gång vi roterar
		// kameran så kommer vi att uppdatera dessa så att vi alltid kan veta
		// kamerans orientering i världs-rymd. Om vi exempelvis vill flytta på
		// kameran i sidled kan vi helt enkelt addera eller subtrahera
		// camera.right till/från camera.position, och det kommer att bli rätt
		// oavsett åt vilket håll kameran är vänd.
		right: vec3.fromValues(1, 0, 0),
		up: vec3.fromValues(0, 1, 0),
		forward: vec3.fromValues(0, 0, 1),

		// En vektor som alltid pekar rakt upp, oavsett kamerans orientering
		// (du kan se denna variabel som en konstant).
		upReference: vec3.fromValues(0, 1, 0),

		// Vissa beräkningar kräver att vi mellanlagrar värden i en temporär
		// variabel. För att undvika att allokera dessa varje gång funktionen
		// körs så har vi här valt att lagra dem som en medlemsvariabel.
		temporaryVector: vec3.create(),
		temporaryQuat: quat.create()
	};
}



function translateCameraX(camera, amount, viewRelative) {
	if (viewRelative) {
		vec3.scaleAndAdd(camera.position, camera.position, camera.right, -amount);
	} else {
		vec3.set(camera.temporaryVector, amount, 0, 0);
		vec3.add(camera.position, camera.position, camera.temporaryVector);
	}
}



function translateCameraY(camera, amount, viewRelative)
{
	if (viewRelative)
	{
		vec3.scaleAndAdd(camera.position, camera.position, camera.up, amount);
	}
	else
	{
		vec3.set(camera.temporaryVector, 0, amount, 0);
		vec3.add(camera.position, camera.position, camera.temporaryVector);
	}
}



function translateCameraZ(camera, amount, viewRelative)
{
	if (viewRelative)
	{
		vec3.scaleAndAdd(camera.position, camera.position, camera.forward, amount);
	}
	else
	{
		vec3.set(camera.temporaryVector, 0, 0, amount);
		vec3.add(camera.position, camera.position, camera.temporaryVector);
	}
}



function rotateCameraX(camera, angle)
{
	quat.setAxisAngle(camera.temporaryQuat, camera.right, -angle);
	vec3.transformQuat(camera.forward, camera.forward, camera.temporaryQuat);
}



function rotateCameraY(camera, angle)
{
	quat.setAxisAngle(camera.temporaryQuat, camera.up, -angle);
	vec3.transformQuat(camera.forward, camera.forward, camera.temporaryQuat);
}



function rotateCameraZ(camera, angle)
{
	quat.setAxisAngle(camera.temporaryQuat, camera.forward, angle);
	vec3.transformQuat(camera.up, camera.up, camera.temporaryQuat);
}



function updateCamera(camera)
{
	vec3.cross(camera.right, camera.forward, camera.upReference);
	vec3.normalize(camera.right, camera.right);

	mat4.identity(camera.matrix);
	vec3.set(camera.temporaryVector, 0, 0, 0);
	mat4.lookAt(camera.matrix, camera.temporaryVector, camera.forward, camera.up);

	vec3.negate(camera.temporaryVector, camera.position);
	mat4.translate(camera.matrix, camera.matrix, camera.temporaryVector);
}
