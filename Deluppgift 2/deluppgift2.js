// Välkommen till andra deluppgiften!
//
// Följ instruktionerna på kurssidan och ändra gärna i den här filen. Du kan när
// som helst testa din kod genom att öppna 'index.html' i en webbläsare,
// förslagsvis Firefox.
//
// Tips:
// - Om saker slutar fungera, försök kommentera ut ändringar tills 
//   det fungerar igen.
// 
// - Eventuella fel syns om du högerklickar i webbläsaren och väljer 'Inspektera'.
//   Du kan även skriva kod och evaluera direkt i konsollen där.
//
// - För att felsöka din kod, skriv loggmeddelanden med 'console.log("Testar...");'
//
// - Ibland används 'var' och ibland 'const'. Om du är osäker på vilken du
//   skall använda så kör på 'var'.

var gl;

var shared = {
    worldMatrix: mat4.create(),
    viewMatrix: mat4.create(),
    projectionMatrix: mat4.create(),
    viewProjectionMatrix: mat4.create(),
    worldViewProjectionMatrix: mat4.create(),
    worldInverseMatrix: mat4.create(),
    billboardMatrix: mat4.create(),
    lightIntensity: 1,
    ambientColor: vec4.create(),
    lightPosition: vec4.fromValues(0, 0, 0, 1),
    lightPositionObject: vec4.create(),

    worldViewProjectionMatrixLocation: null,
    lightingEnabledLocation: null,
    lightIntensityLocation: null,
    ambientColorLocation: null,
    lightPositionLocation: null,
    vertexPositionLocation: null,
    vertexTextureCoordinateLocation: null,
    vertexNormalLocation: null,

    time: 0,
    previousTime: 0,
    run: true,

    worldMatrixStack: [],

    cameraPosition: vec3.create(),
    cameraRotationX: 0,
    cameraRotationY: 0,
    cameraDistance: 0,
    cameraDistanceDelta: 0,

    sunFlareObject: null,
    sphereObject: null,

    sunTexture: null,
    sunFlareTexture: null,
    venusTexture: null,
    earthTexture: null,
    earthAtmosphereTexture: null,
    moonTexture: null,
    marsTexture: null,
    jupiterTexture: null,
    saturnTexture: null,
    saturnRingsTexture: null,

    paused: false
};



//
// Den första funktionen som körs när programmet startar. I den här deluppgiften
// behöver du inte ändra i main, utan det räcker att du ändrar i de funktioner
// som main() kallar på.
//
function main(context) {
    gl = context;

    window.addEventListener("keydown", keydown);
    window.addEventListener("keyup", keyup);
    gl.canvas.addEventListener("mousemove", mousemove);

    var program = initializeProgram(vertexShader, fragmentShader);
    if (!program) {
        window.removeEventListener("keydown", keydown);
        window.removeEventListener("keyup", keyup);
        gl.canvas.removeEventListener("mousemove", mousemove);
        return;
    }

    gl.useProgram(program);
    shared.worldViewProjectionMatrixLocation = gl.getUniformLocation(program, "u_worldViewProjection");
    shared.lightingEnabledLocation = gl.getUniformLocation(program, "u_lightingEnabled");
    shared.lightIntensityLocation = gl.getUniformLocation(program, "u_lightIntensity");
    shared.ambientColorLocation = gl.getUniformLocation(program, "u_ambientColor");
    shared.lightPositionLocation = gl.getUniformLocation(program, "u_lightPosition");
    shared.vertexPositionLocation = gl.getAttribLocation(program, "a_position");
    shared.vertexTextureCoordinateLocation = gl.getAttribLocation(program, "a_textureCoordinate");
    shared.vertexNormalLocation = gl.getAttribLocation(program, "a_normal");
    gl.enableVertexAttribArray(shared.vertexPositionLocation);
    gl.enableVertexAttribArray(shared.vertexTextureCoordinateLocation);
    gl.enableVertexAttribArray(shared.vertexNormalLocation);

    var aspectRatio = gl.drawingBufferWidth / gl.drawingBufferHeight;
    mat4.perspective(shared.projectionMatrix, Math.PI/4, aspectRatio, 1, 200);

    initializeScene();

    window.requestAnimationFrame(frameCallback);
}



//
// Körs i början av programmet. Här läser du exempelvis in dina texturer.
//
function initializeScene() {
    shared.cameraDistance = 120;

    shared.sunFlareObject = twgl.primitives.createPlaneBufferInfo(gl, 55, 55);
    shared.sphereObject   = twgl.primitives.createSphereBufferInfo(gl, 4, 32, 32);

    // Tips: Notera hur vi skapar planet för solar-flare objektet ovan. Du kan
    //       göra något liknande för saturnus ringar.

    shared.sunTexture      = loadTexture("sun.png");
    shared.sunFlareTexture = loadTexture("lensflare.png");
    shared.venusTexture    = loadTexture("venus.png");

    shared.lightIntensity = 1.0;
    shared.ambientColor   = vec4.fromValues(0.3, 0.3, 0.3, 1);
}



//
// Körs varje gång en knapp trycks ner.
//
function keydown(event) {
    switch (event.key) {
        case "p":
            shared.paused = !shared.paused;
            break;
        case "ArrowUp":
            shared.cameraDistanceDelta = -1;
            break;
        case "ArrowDown":
            shared.cameraDistanceDelta = 1;
            break;
        case 'q':
            shared.lightIntensity += 0.1;
            break;
        case 'a':
            shared.lightIntensity -= 0.1;
            break;
        case 'w':
            shared.ambientColor[0] += 0.1;
            break;
        case 's':
            shared.ambientColor[0] -= 0.1;
            break;
    }
}


//
// Körs varje gång en knapp släpps.
//
function keyup(event) {
    switch (event.key) {
        case 'ArrowUp':
        case 'ArrowDown':
            shared.cameraDistanceDelta = 0;
            break;
    }
}



//
// Körs varje gång musen flyttar på sig. Du behöver inte ändra i den här
// funktionen.
//
function mousemove(event) {
    if (event.buttons === 1) {
        shared.cameraRotationX += -event.movementY * 0.01;
        shared.cameraRotationY += event.movementX * 0.01;

        const limitAngleX = Math.PI / 3;
        shared.cameraRotationX = Math.max(shared.cameraRotationX, -limitAngleX);
        shared.cameraRotationX = Math.min(shared.cameraRotationX, limitAngleX);
    }
}



//
// Denna funktion körs en gång varje frame. Den rensar skärmen, uppdaterar
// kameran och målar sedan ut allt på skärmen. Du behöver inte göra några
// ändringar här.
//
function frameCallback(time) {
    const origo = vec3.fromValues(0, 0, 0);
    const up    = vec3.fromValues(0, 1, 0);
    const deltaTime = time - shared.previousTime;
    if (!shared.paused) {
        shared.time += deltaTime;
    }

    shared.previousTime = time;

    // Rensa färg- och djupbuffern.
    gl.clearColor(0, 0, 0, 1);
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

    // Aktivera backface culling (baksidegallring) och depth testing (djupsortering)
    gl.enable(gl.CULL_FACE);
    gl.enable(gl.DEPTH_TEST);

    // Uppdatera kameran och räkna ut den nya vy-matrisen.
    shared.cameraDistance += shared.cameraDistanceDelta * deltaTime * 35;
    vec3.set(shared.cameraPosition, 0, 0, -shared.cameraDistance);
    vec3.rotateX(shared.cameraPosition, shared.cameraPosition, origo, shared.cameraRotationX);
    vec3.rotateY(shared.cameraPosition, shared.cameraPosition, origo, shared.cameraRotationY);
    mat4.lookAt(shared.viewMatrix, shared.cameraPosition, origo, up);
    mat4.multiply(shared.viewProjectionMatrix, shared.projectionMatrix, shared.viewMatrix);

    // Måla ut scenen, se implementationen nedan...
    const timeInSecs = shared.time * 0.001;
    drawScene(timeInSecs);

    // Om du inte kört popWorldMatrix() lika många gånger som du kört
    // pushWorldMatrix() så kommer det att bli fel. Tänk så här:
    // Du har en hög med fotografier
    //     pushWorldMatrix() tar ett foto av världen och lägger överst i högen
    //     popWorldMatrix()  tar bort det översta fotot och återställer världen
    //                       till hur det såg ut på fotot.
    // Du måste ha exakt 0 foton kvar i högen slutet av varje iteration.
    if (shared.worldMatrixStack.length > 0) {
        console.error('worldMatrixStack: Push and pop misalignment');
        shared.run = false;
    }

    // Ifall inte programmet har avbrutits, begär en ny rendering.
    if (shared.run) {
        window.requestAnimationFrame(frameCallback);
    }
}



//
// Det är här allting målas ut. Till en början har vi bara en planet (Venus) och
// solen. Du kan skapa fler planeter genom att skapa egna funktioner liknande
// dessa.
//
function drawScene(time) {

    // Vi skapar en pekare till världsmatrisen så att vi inte behöver skriva
    // "shared.worldMatrix" hela tiden.
    //
    // worldMatrix == matris som transformerar positioner från objektrymd till
    //                världsrymd.
    //
    var world = shared.worldMatrix;
    mat4.identity(world); // Nollställer världsmatrisen

    drawVenus(world, time);
    //
    // <-- Måla ut dina egna planeter här!
    //

    // Det är viktigt att solen målas ut sist. Anledningen är att denna funktion
    // gör förändringar i vymatrisen för att kunna måla ut solstrålarna platt på
    // skärmen. Om något annat målas ut efter detta så kommer alltså vymatrisen
    // att vara fel och objektet kommer också att bli platt sett ovanifrån.
    drawSun();
}


//
// Den här funktionen innehåller början till den första planeten. Du behöver
// färdigställa funktionen, och därefter kan du använda den som bas för att
// skapa andra planeter.
//
// Parametrar:
//     world  den nuvarande världsmatrisen (matris som omvandlar en punkt i
//            objektkoordinater till världskoordinater)
//     time   tiden i sekunder sedan programmet startade
//
function drawVenus(world, time) {

    // Sparar undan vår nuvarande världsmatris överst på stacken. Vi kan
    // fortsätta arbeta på transformationen, och sedan återställa den till det
    // tillstånd den hade tidigare när vi är klara.
    pushWorldMatrix();

    // Nedan genomförs 4 transformationer på världsmatrisen. Ett trick när du
    // läser dessa är att läsa nedanifrån och upp. Du har en sfär centrerad
    // kring origo. Det första som händer är att sfären skalas ned till 60% av
    // storleken. Därefter roteras den "time" radianer kring y-axeln. Därefter
    // flyttas den 15 steg längst med x-axeln och slutligen roteras den återigen
    // kring origo med "time / 4" radianer. Time är tiden i sekunder sedan
    // programmet började köra.
    //
    // Anledningen varför vi läser nedanifrån och upp är att dessa
    // transformationer inte körs omedelbart utan vi lagrar ner dem i en matris.
    // Matrisen skickas sedan till grafikkortet som använder den för att
    // transformera alla vertiser i modellen. Matrisen är alltid 4x4, oavsett
    // hur många transformationer vi lagrar ner.
    mat4.rotateY(world, world, time / 4);
    mat4.translate(world, world, vec3.fromValues(20, 0, 0));
    mat4.rotateY(world, world, time);
    mat4.scale(world, world, vec3.fromValues(0.6, 0.6, 0.6));

    // Skicka matrisen och ljus-informationen till grafikkortet
    setTransformationAndLighting(true);

    // Välj vilken textur som skall användas när modellen målas ut.
    gl.bindTexture(gl.TEXTURE_2D, shared.venusTexture);

    // Här skickas draw-callet för planeten. Efter den här raden kan
    // världsmatrisen modifieras fritt.
    drawObject(shared.sphereObject);

    // -----------------------------------------------------------------------//
    // Här skulle du exempelvis kunna köra "pushWorldMatrix()" igen för att
    // börja arbeta på en måne. Du har då kvar alla transformationer som du
    // gjort för planeten och i och med att man läser nerifrån och upp så kommer
    // transformationer du gör för månen att "köras först" innan månen flyttas
    // ut i planetens koordinatsystem. När du är klar med månen och har kört
    // drawObject(...) avslutar du månen med att köra "popWorldMatrix()".
    // -----------------------------------------------------------------------//

    // Plockar ut den senast tillagda världsmatrisen från stacken, vilket
    // återställer den transformation vi arbetade på tidigare. Du måste köra
    // "pop" lika många gånger som du kört "push".
    popWorldMatrix();
}



//
// Målar ut solen.
//
function drawSun() {
    var world = shared.worldMatrix;

    setTransformationAndLighting(false);
    gl.bindTexture(gl.TEXTURE_2D, shared.sunTexture);
    drawObject(shared.sphereObject);

    billboardTransformation(shared.billboardMatrix, shared.viewMatrix);
    mat4.translate(world, world, vec3.fromValues(0, 0, 5));
    mat4.rotateX(world, world, Math.PI / 2);
    mat4.scale(world, world, vec3.fromValues(0.7, 0.7, 0.7));
    mat4.multiply(world, shared.billboardMatrix, world);

    setTransformationAndLighting(false);
    gl.bindTexture(gl.TEXTURE_2D, shared.sunFlareTexture);
    gl.enable(gl.BLEND);
    gl.blendFunc(gl.SRC_ALPHA, gl.ONE);
    drawObject(shared.sunFlareObject);
    gl.disable(gl.BLEND);
}



//
// Sparar undan den nuvarande världsmatrisen så att vi kan påbörja en ny
// transformation. Kör denna funktion före du påbörjar varje planet, måne, etc.
//
function pushWorldMatrix() {
    shared.worldMatrixStack.push(mat4.clone(shared.worldMatrix));
}


//
// 'Poppar' transformationsstacken, det vill säga återställ och ta bort den
// senast pushade transformationen. Detta kör du varje gång du är klar med ett
// objekt och alla dess barn.
//
function popWorldMatrix() {
    if (shared.worldMatrixStack.length === 0) {
        console.log("worldMatrixStack: Can't pop matrix from empty stack");
    }

    mat4.copy(shared.worldMatrix, shared.worldMatrixStack.pop());
}



// Den här funktionen behöver du inte ändra i, men här är en beskrivning av hur
// den fungerar:
//
// Illusionen av 3D skapas genom att varje hörn i objektet transformeras med
// hjälp av tre
// matriser...
//
//      s = P*V*W*p
//
// ...där p är hörnets position (i objektrymd) och s är positionen på skärmen som vi söker.
// W = worldMatrix, alltså matrisen som flyttar en position från objekt-rymd till världs-rymd
// V = viewMatrix, alltså matrisen som flyttar positionen från världs-rymd till vy-rymd
// P = perspectiveMatrix, alltså matrisen som skapar en djupkänsla genom att förminska objekt som
//     ligger långt bort från kameran.
//
// I och med att vi redan räknat ut P*V varje gång kameran flyttar på sig, kan
// vi helt enkelt multiplicera denna matris med W och skicka den resulterande
// matrisen till grafikshaderns uniform-variabel. Detta måste vi göra varje
// draw-call, d.v.s. varje gång vi vill rendera något i världen med en ny
// position eller rotation. p hämtar shadern automatiskt från vertex-buffern när
// den itererar över alla hörnen i modellen.
//
// Du kan läsa om bakgrunden till varför vi gör detta i kursboken på s.15-17
//
// I den förra deluppgiften fanns en liknande funktion. Skillnaden är att vi för
// ljusberäkningarna även måste skicka vilken färg och intensitet ljuset skall
// ha, samt att vi behöver räkna ut ljusets position i objektets koordinatsystem
// så att vi vet hur ljust objektet skall vara.
//
function setTransformationAndLighting(lighting) {
    mat4.multiply(shared.worldViewProjectionMatrix, shared.viewProjectionMatrix, shared.worldMatrix);
    gl.uniformMatrix4fv(shared.worldViewProjectionMatrixLocation, false, shared.worldViewProjectionMatrix);

    gl.uniform1i(shared.lightingEnabledLocation, lighting);
    gl.uniform1f(shared.lightIntensityLocation, shared.lightIntensity);

    mat4.invert(shared.worldInverseMatrix, shared.worldMatrix);
    vec4.transformMat4(shared.lightPositionObject, shared.lightPosition, shared.worldInverseMatrix);
    gl.uniform4fv(shared.lightPositionLocation, shared.lightPositionObject);

    gl.uniform4fv(shared.ambientColorLocation, shared.ambientColor);
}



//
// Den här funktionen genomför ett drawcall. Först talar vi om för grafikkortet
// vilka buffrar (arrayer i grafikminnet) som skall användas för att populera de
// olika parametrarna i vertis-shadern. Därefter kör vi "gl.drawElements" vilket
// triggar en utmålning.
//
function drawObject(object) {
    gl.bindBuffer(gl.ARRAY_BUFFER, object.attribs.position.buffer);
    gl.vertexAttribPointer(shared.vertexPositionLocation, object.attribs.position.numComponents, object.attribs.position.type, gl.FALSE, 0, 0);

    gl.bindBuffer(gl.ARRAY_BUFFER, object.attribs.texcoord.buffer);
    gl.vertexAttribPointer(shared.vertexTextureCoordinateLocation, object.attribs.texcoord.numComponents, object.attribs.texcoord.type, gl.FALSE, 0, 0);

    gl.bindBuffer(gl.ARRAY_BUFFER, object.attribs.normal.buffer);
    gl.vertexAttribPointer(shared.vertexNormalLocation, object.attribs.normal.numComponents, object.attribs.normal.type, gl.FALSE, 0, 0);

    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, object.indices);
    gl.drawElements(gl.TRIANGLES, object.numElements, object.elementType, 0);
}


const vertexShader =
    `
	uniform mat4 u_worldViewProjection;
	uniform bool u_lightingEnabled;
	uniform float u_lightIntensity;
	uniform vec4 u_lightPosition;
	attribute vec4 a_position;
	attribute vec2 a_textureCoordinate;
	attribute vec3 a_normal;
	varying vec2 v_textureCoordinate;
	varying float v_diffuse;

	void main(void)
	{
		v_diffuse = 0.0;
		if (u_lightingEnabled)
		{
			vec3 lightDirection = normalize(u_lightPosition.xyz - a_position.xyz); 
			v_diffuse = max(dot(a_normal, lightDirection), 0.0) * u_lightIntensity;
		}
		v_textureCoordinate = a_textureCoordinate;
		gl_Position = u_worldViewProjection * a_position;
	}
`;



const fragmentShader =
    `
	uniform sampler2D texture;
	uniform bool u_lightingEnabled;
	uniform highp vec4 u_ambientColor;
	varying highp vec2 v_textureCoordinate;
	varying highp float v_diffuse;
	precision highp float;

	void main(void)
	{
		vec4 lighting = vec4(1);
		if (u_lightingEnabled)
		{
			lighting = vec4(v_diffuse, v_diffuse, v_diffuse, 1) + u_ambientColor;
		}
		gl_FragColor = texture2D(texture, v_textureCoordinate) * lighting;
	}
`;
