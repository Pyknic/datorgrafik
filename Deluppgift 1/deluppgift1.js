// Välkommen till första deluppgiften!
//
// Följ instruktionerna på kurssidan och ändra gärna i den här filen.
// Du kan när som helst testa din kod genom att öppna 'index.html' i
// en webbläsare, förslagsvis Chrome.
//
// Tips:
// - Börja med att kika på funktionen createSquare() längre ner och
//   gör små ändringar för att förstå hur den fungerar.
//
// - Se sedan om du kan fylla i createHouse() enligt uppgiftsbeskrivningen.
//   Du behöver även ändra i drawScene() för att huset skall dyka upp.
//
// - För att göra så att man kan slå på/av inställningar, ändra i
//   funktionen keydown().
// 
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

// Här skapas ett objekt i JavaScript med ett antal medlemsvariabler som vi vill
// skall vara globalt tillgängliga. Detta gör det enkelt för oss att komma åt
// värdena i alla funktioner nedan.
//
// Notera att raderna separeras med komma ',' och inte semikolon ';'. Anledningen 
// är att detta endast är en upplistning av alla medlemsvariabler. Vi kan senare 
// komma åt dessa i alla funktioner genom att skriva exempelvis 'shared.worldMatrix'.
var shared = {

    // Transformationsmatriser, 'mat4' är ett externt bibliotek. Se http://glmatrix.net/docs/module-mat4.html
	worldMatrix: mat4.create(),               // W:     Transformerar från modellrymd till världsrymd
	viewMatrix: mat4.create(),                // V:     Transformerar från världsrymd till vy-rymd
	projectionMatrix: mat4.create(),          // P:     Gör avlägsna punkter mindre för att skapa djup-känsla
    viewProjectionMatrix: mat4.create(),      // P*V:   Uppdateras i frameCallback()
    worldViewProjectionMatrix: mat4.create(), // P*V*W: Uppdateras i setWorldViewProjection()

    // Referenser som används när data skickas till grafikkortet
	worldViewProjectionMatrixLocation: null,
	vertexPositionLocation: null,
	vertexColorLocation: null,

    // Används för att räkna ut deltaTime
	time: 0,
	previousTime: 0,

    // Kamerans nuvarande position. Sätts i frameCallback().
    // Du kan använda denna om du vill räkna ut avståndet till kameran.
    // 'vec3' är ett externt bibliotek. Se http://glmatrix.net/docs/module-vec3.html
	cameraPosition: vec3.create(),

    // Data som skall lagras i grafikminnet hamnar i en 'buffer'. Varje buffer
    // får ett unikt tal (en slags referens) som du använder när du vill be
    // grafikkortet att rendera något. Dessa tal lagras här nedan.
    square: { positionBuffer: null, colorBuffer: null, triangleCount: 0 },
    house: { positionBuffer: null, colorBuffer: null, triangleCount: 0 },
    house2: { indexBuffer: null, positionBuffer: null, colorBuffer: null, indiceCount: 0 },
    planes: { indexBuffer: null, positionBuffer: null, colorBuffer: null, indiceCount: 0 },

    // Här har jag definierat en bool för att hålla koll på om scenen är pausad.
    // Du kommer antagligen att behöva definiera dina egna flaggor på liknande sätt.
    paused: false,
    cullBack: false
};



// Den här funktionen körs automatiskt när sidan laddas (se index.html).
function main(context) {
	gl = context;

    // 'keydown' är en funktion i den här filen. Genom att lägga till den som 
    // en händelse-lyssnare så kommer den att kallas på automatiskt varje gång
    // som användaren trycker ner en knapp.
	window.addEventListener('keydown', keydown);

    // Kompilera och länka ett program som kan köras på grafikkortet.
    // 'vertexShader' och 'fragmentShader' är konstanter som är definierade
    // i botten av den här filen. De innehåller koden för respektive shader.
	var program = initializeProgram(vertexShader, fragmentShader);
	if (!program) {
		window.removeEventListener('keydown', keydown);
		return;
	}

    // Programmet är nu kompilerat. För att kunna invokera ett draw-call måste
    // vi därför veta hur grafikkortet förväntar sig få input-parametrarna.
    // Vår shader har tre inputs, en 'uniform'-matris och två 'attribute'-vektorer.
    // 'uniforms' sätts en gång per draw-call, 'attributes' hämtas automatiskt från
    // varje hörn i modellen som skall renderas. 
	gl.useProgram(program);
	shared.worldViewProjectionMatrixLocation = gl.getUniformLocation(program, 'u_worldViewProjection');
	shared.vertexPositionLocation = gl.getAttribLocation(program, 'a_position');
    shared.vertexColorLocation = gl.getAttribLocation(program, 'a_color');

    // 'attribute'-variabler måste aktiveras. Det behöver dock inte 'uniform'-variabler.
	gl.enableVertexAttribArray(shared.vertexPositionLocation);
	gl.enableVertexAttribArray(shared.vertexColorLocation);

    // Vi genererar en perspectiveMatrix och lagrar i 'shared'. Se kursbok s.96-102
    // Perspektiv-matrisen kommer att förbli konstant så länge vi inte förändrar
    // fönstrets storlek, alltså behöver vi bara göra detta en gång.
	var aspectRatio = gl.drawingBufferWidth / gl.drawingBufferHeight;
	mat4.perspective(shared.projectionMatrix, Math.PI/4, aspectRatio, 1, 150);

    // Skapa geometrin i scenen och bind dem till varsin grafikkortsbuffer.
    // När detta är gjort behöver geometrin inte längre lagras i RAM-minnet.
    createSquare();
    createHouse();
    createHouse2();
    createPlanes();

    //
    // <--- Här bör du lägga till en eller flera gl.enable(...); för att slå
    //      på olika grafikkortsinställningar (exempelvis baksidegallring).
    //      Tips: Googla 'WebGL enable backface culling'
    //
    gl.enable(gl.CULL_FACE);

    // Kör funktionen 'frameCallback' när fönstret är redo att rendera 
    // nästa frame. frameCallback() kommer i sin tur att begära en ny
    // rendering. 'frameCallback' är definierad längre ner i den här filen.
    window.requestAnimationFrame(frameCallback);

}// function main()



// Den här funktionen skapar geometrin för golvet i scenen (två trianglar)
// och binder till en grafikkortsbuffer. Den körs bara en gång, därefter
// finns geometrin lagrad i grafikminnet.
function createSquare()
{
    // Vi skapar en array med hörnpositioner i objektrymd. Varje grupp 
    // om tre flyttal bildar ett hörn. I det här fallet använder vi inte 
    // någon indexlista, alltså behöver vi upprepa samma hörn flera 
    // gånger ([-30, 0, 30] exempelvis). 
    var positions = [
        // Den första triangeln
        -20, 0, -30,
        -20, 0, 30,
        20, 0, -30,

        // Den andra triangeln
        -20, 0, 30,
        20, 0, 30,
        20, 0, -30
    ];

    // Alla hörn skall vara grå. Trots det måste vi ange lika många 
    // färger som vi har vertiser i arrayen ovan, alltså loopar vi 6 
    // gånger.
    var colors = [];
    for (var i = 0; i < 6; i++) { // Gray
        // Detta är ett enkelt (men inte särskilt effektivt) sätt att
        // lägga till element i slutet på en array i JavaScript. Varje
        // färg består av 4 värden. Längden på arrayen kommer alltså
        // att bli 6*4=24, medan antalet värden i positionsarrayen är
        // 6*3=18.
        colors = colors.concat([1.0, 0.5, 0.5, 1]);
    }

    // Vi begär att grafikkortet allokerar en ny buffer och fyller den
    // med innehållet i vår array. Då JavaScript är löst typat till 
    // skillnad från C++ så måste vi kalla på 'new Float32Array()' för
    // att definiera vilken typ av array vi har (32-bitars float). Vi
    // lagrar en referens till vår nya buffer i 'shared.square.positionBuffer'.
    // Denna referens behöver vi när vi vill måla ut golvet.
	shared.square.positionBuffer = gl.createBuffer();
	gl.bindBuffer(gl.ARRAY_BUFFER, shared.square.positionBuffer);
	gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(positions), gl.STATIC_DRAW);

    // Vi gör sedan samma sak med färgerna. Notera att det inte spelar
    // någon roll för grafikkortet vad för typ av data vi lagrar. 
    // Positioner, färger, etc. är bara data!
	shared.square.colorBuffer = gl.createBuffer();
	gl.bindBuffer(gl.ARRAY_BUFFER, shared.square.colorBuffer);
	gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(colors), gl.STATIC_DRAW);

    // Det finns stöd i WebGL för att bara måla ut delar av ett objekt.
    // För att måla ut hela objektet måste vi därför komma ihåg hur många 
    // trianglar det består av (Antalet trianglar = Antalet hörnen / 3).
    shared.square.triangleCount = positions.length / 3;

}// function createSquare()



// Skapar det första huset (du måste själv implementera den här funktionen)
function createHouse() {

    //
    // Den här funktionen måste du själv implementera. Du kan utgå 
    // ifrån koden i 'createSquare()' ovan, men modifiera den så att
    // ett hus skapas. På Canvas finns en bild av huset som du kan
    // kika på för att få koordinaterna rätt. Du måste dock lista 
    // ut hörnordningen på egen hand.
    //
    // Här är de värden som måste sättas i funktionen:
    //     shared.house.positionBuffer
    //     shared.house.colorBuffer
    //     shared.house.triangleCount
    //
	
	var positions = [
        // Framsida
        -1, 0, -1,
        1, 1, -1,
        1, 0, -1,
        -1, 0, -1,
        -1, 1, -1,
        1, 1, -1,
        -1, 1, -1,
        0, 2, -1,
        1, 1, -1,

        // Baksida
        -1, 0, 1,
        1, 0, 1,
        1, 1, 1,
        -1, 0, 1,
        1, 1, 1,
        -1, 1, 1,
        -1, 1, 1,
        1, 1, 1,
        0, 2, 1,

        // Vänster vägg
        -1, 1, 1,
        -1, 1, -1,
        -1, 0, 1,

        -1, 0, 1,
        -1, 1, -1,
        -1, 0, -1,

        0, 2, 1,
        0, 2, -1,
        -1, 1, 1,

        -1, 1, 1,
        0, 2, -1,
        -1, 1, -1,

        // Höger vägg
        1, 1, 1,
        1, 0, 1,
        1, 1, -1,

        1, 0, 1,
        1, 0, -1,
        1, 1, -1,

        0, 2, 1,
        1, 1, 1,
        0, 2, -1,

        1, 1, 1,
        1, 1, -1,
        0, 2, -1,

        // Floor
        -1, 0, 1,
        1, 0, -1,
        1, 0, 1,

        -1, 0, 1,
        -1, 0, -1,
        1, 0, -1
    ];

    const RED    = [1.0, 0.0, 0.0, 1.0];
    const GREEN  = [0.0, 1.0, 0.0, 1.0];
    const BLUE   = [0.0, 0.0, 1.0, 1.0];
    const YELLOW = [1.0, 1.0, 0.0, 1.0];
    const CYAN   = [0.0, 1.0, 1.0, 1.0];
    const WHITE  = [1.0, 1.0, 1.0, 1.0];

    var colors = [];

    // Framsida
    colors = colors.concat(YELLOW);
    colors = colors.concat(BLUE);
    colors = colors.concat(GREEN);
    colors = colors.concat(YELLOW);
    colors = colors.concat(RED);
    colors = colors.concat(BLUE);
    colors = colors.concat(RED);
    colors = colors.concat(CYAN);
    colors = colors.concat(BLUE);

    // Baksida
    colors = colors.concat(CYAN);
    colors = colors.concat(RED);
    colors = colors.concat(YELLOW);
    colors = colors.concat(CYAN);
    colors = colors.concat(YELLOW);
    colors = colors.concat(BLUE);
    colors = colors.concat(BLUE);
    colors = colors.concat(YELLOW);
    colors = colors.concat(GREEN);

    // Vänster vägg
    colors = colors.concat(BLUE);
    colors = colors.concat(RED);
    colors = colors.concat(CYAN);

    colors = colors.concat(CYAN);
    colors = colors.concat(RED);
    colors = colors.concat(YELLOW);

    colors = colors.concat(GREEN);
    colors = colors.concat(CYAN);
    colors = colors.concat(BLUE);

    colors = colors.concat(BLUE);
    colors = colors.concat(CYAN);
    colors = colors.concat(RED);

    // Höger vägg
    colors = colors.concat(YELLOW);
    colors = colors.concat(RED);
    colors = colors.concat(BLUE);

    colors = colors.concat(RED);
    colors = colors.concat(GREEN);
    colors = colors.concat(BLUE);

    colors = colors.concat(GREEN);
    colors = colors.concat(YELLOW);
    colors = colors.concat(CYAN);

    colors = colors.concat(YELLOW);
    colors = colors.concat(BLUE);
    colors = colors.concat(CYAN);

    // Golv
    colors = colors.concat(CYAN);
    colors = colors.concat(GREEN);
    colors = colors.concat(RED);

    colors = colors.concat(CYAN);
    colors = colors.concat(YELLOW);
    colors = colors.concat(GREEN);

    shared.house.positionBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, shared.house.positionBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(positions), gl.STATIC_DRAW);

    shared.house.colorBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, shared.house.colorBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(colors), gl.STATIC_DRAW);

    shared.house.triangleCount = positions.length / 3;

}// function createHouse()



// Skapar det andra huset (du måste ändra här så att den målar ut ett hus
// istället för en kvadrat)
function createHouse2() {

    //
    // Detta hus skall se identiskt ut som det förra, men istället för
    // att ange samma hörn flera gånger skall du använda en indexlista.
    // Nedan finns ett exempel som skapar en rektangel med hjälp av en
    // indexlista.
    //

    // Här lagras varje unikt hörn. När du är färdig kommer den att 
    // bestå av 10 hörnen (index 0 - 9) och alltså totalt 30 nummer.
    var vertices = [
        0, -15, -15, // Hörn 0     <--- OBS! Dessa hörn skall bytas ut!
        0, -15, 15,  // Hörn 1
        0, 15, -15,  // Hörn 2
        0, 15, 15    // Hörn 3
    ];

    // Här lagras varje hörns färg i samma ordning som ovan. När du är 
    // färdig kommer den att bestå av 10 färger (index 0 - 9) och 
    // alltså totalt 40 nummer (10 * 4).
    var colors = [ 
        1, 0, 0, 1, // Röd        <--- OBS! Dessa färger skall bytas ut!
        0, 1, 0, 1, // Grön
        0, 0, 1, 0, // Blå
        1, 1, 1, 1  // Vit
    ];

    // Två trianglar definieras genom att lista indexen i arrayerna ovan.
    // När funktionen är färdig kommer den att bestå av 16 trianglar, dvs. 48 index.
    var indices = [ 
        0, 1, 3, // Första triangeln   <--- OBS! Dessa index skall bytas ut!
        0, 3, 2  // Andra triangeln
    ];

    // Vi allokerar en ny buffer, men detta är en ELEMENT_ARRAY_BUFFER istället för en
    // ARRAY_BUFFER. Det betyder att den lagrar index till andra arrayer. Typen är även
    // Uint16Array (16-bitars unsigned int) istället för Float32Array.
    shared.house2.indexBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, shared.house2.indexBuffer);
    gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(indices), gl.STATIC_DRAW);

    // Precis som tidigare skapar vi en positions-buffer
    shared.house2.positionBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, shared.house2.positionBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vertices), gl.STATIC_DRAW);

    // ...och en color buffer.
    shared.house2.colorBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, shared.house2.colorBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(colors), gl.STATIC_DRAW);

    // Förra gången lagrade vi antalet trianglar. När man målar ut indexerade primitiver
    // behöver man istället ange hur många index man har. Just nu är det 6 st, men när
    // du är färdig med den här funktionen kommer det att vara 16*3=48.
    shared.house2.indiceCount = indices.length;

}// function createHouse2()



// Skapar det första huset (du måste själv implementera den här funktionen)
function createPlanes() {
    //
    // Här skapar du två halvtransparenta planes enligt uppgiften. Du kan skapa dem
    // i samma objekt. Här är de värden som måste sättas:
    //     shared.planes.indexBuffer
    //     shared.planes.positionBuffer
    //     shared.planes.colorBuffer
    //     shared.planes.triangleCount
    //

}// function createPlanes()



// Denna funktion körs varje gång en knapp trycks ner på tangentbordet.
// Jag har lagt in ett par tomma if-satser nedan som du förväntas modifiera.
// Lösningen är något mer komplicerad än för 'shared.paused', men inte mycket.
//
// Tips: Google is your friend.
//
function keydown(event) {

    // Om det var knappen 'p', sätt 'paused' till motsatsen till 'paused'.
    if (event.key == 'p') {
        shared.paused = !shared.paused;
    }
        
    // Slå på/av djup-testning.
    if (event.key == 'd') {
        if (shared.depthTest) {
            shared.depthTest = false;
            gl.disable(gl.DEPTH_TEST);
        } else {
            shared.depthTest = true;
            gl.enable(gl.DEPTH_TEST);
        }
    }

    // Slå på/av backface-culling.
    if (event.key == 'c') {
        if (shared.cullBack) {
            shared.cullBack = false;
            gl.disable(gl.CULL_FACE);
        } else {
            shared.cullBack = true;
            gl.enable(gl.CULL_FACE);
        }
    }

    // Växla mellan 'over' och 'add' som metod för alpha-blending.
    if (event.key == 'b') {
        //
        // Den här funktionen skriver du själv.
        //
    }
}// function keydown()



// Den här funktionen kallas på varje frame. Den beräknar delta-tiden sedan
// den föregående framen och invokerar sedan 'frame'-funktionen. Därefter
// begär den en ny rendering. Du behöver inte ändra något i den här funktionen.
function frameCallback(time) {

    // Beräkna tiden sedan den föregående fram-en och uppdatera klockan.
    var deltaTime = time - shared.previousTime;
    if (!shared.paused) shared.time += deltaTime;
    shared.previousTime = time;
    var timeSecs = shared.time * 0.001;

    // Rensa skärmens färg- och djupbuffer.
    gl.clearColor(0, 0, 0, 1);
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

    // Flytta kameran till en position x = cos(t)*d, z = sin(t)*d 
    // där t är tiden i sekunder och d är avståndet (y är uppåt).
    const cameraDistance = 80;
    vec3.set(shared.cameraPosition, Math.cos(timeSecs) * cameraDistance, 0, Math.sin(timeSecs) * cameraDistance);
    mat4.lookAt(shared.viewMatrix, shared.cameraPosition, vec3.fromValues(0, 0, 0), vec3.fromValues(0, 1, 0));

    // Av prestandaskäl kan vi multiplicera perspektiv-matrisen med vy-matrisen en gång
    // och använda det framräknade värdet framöver (se kursboken s.65).
    mat4.multiply(shared.viewProjectionMatrix, shared.projectionMatrix, shared.viewMatrix);

    // Det är dags att måla ut scenen!
    drawScene(timeSecs);

    // Schemalägg en ny utritning så snart som möjligt. Detta gör att vi inte 
    // behöver ha en while()-loop som blockar CPUn. 
    window.requestAnimationFrame(frameCallback);

}// function frameCallback()



// Den här funktionen behöver du inte ändra i, men här är en beskrivning av hur den fungerar:
//
// Illusionen av 3D skapas genom att varje hörn i objektet transformeras med hjälp av tre 
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
// I och med att vi redan räknat ut P*V varje gång kameran flyttar på sig, kan vi helt enkelt
// multiplicera denna matris med W och skicka den resulterande matrisen till grafikshaderns
// uniform-variabel. Detta måste vi göra varje draw-call, d.v.s. varje gång vi vill rendera
// något i världen med en ny position eller rotation. p hämtar shadern automatiskt från
// vertex-buffern när den itererar över alla hörnen i modellen.
//
// Du kan läsa om bakgrunden till varför vi gör detta i kursboken på s.15-17
//
function setWorldViewProjection() {
	mat4.multiply(shared.worldViewProjectionMatrix, shared.viewProjectionMatrix, shared.worldMatrix);
    gl.uniformMatrix4fv(shared.worldViewProjectionMatrixLocation, false, shared.worldViewProjectionMatrix);

}// function setWorldViewProjection()



// Den här funktionen målar ut scenen. Varje gång du vill måla ut ett nytt objekt
// (ett nytt draw-call) så måste du förbereda P*V*W-matrisen som du vill skicka med
// till shader-programmet. Detta görs med funktionen setWorldViewProjection(). Den
// tar inga in-parametrar, istället manipulerar du 'shared.worldMatrix'.
function drawScene(time) {

    // Bara ett kortare namn (detta är en pekare)
	var world = shared.worldMatrix; 



    // ----------------------------------------------------
    // Detta 'nollställer' världsmatrisen.
    mat4.identity(world); 

    // Vi skapar en vektor med längd 20 som pekar neråt, sedan använder vi
    // den för att göra om 'world' till en translation-matris (se kursboken s.59).
    // Om vi därefter multiplicerar matrisen med en position så kommer positionen
    // flyttas nedåt 20 steg.
    const squareOffset = vec3.fromValues(0, -20, 0); 
    mat4.translate(world, world, squareOffset);

    // Nu när vi har vår världsmatris (W) så kan vi räkna ut P*V*W-matrisen som
    // skall skickas till grafikkortet. Vi gör detta genom att kalla på
    // setWorldViewProjection(). Notera att den inte tar några in-parametrar.
    // Istället läser den direkt från 'shared.worldMatrix'.
    setWorldViewProjection();

    // Nu har grafikkortet fått transformationsmatrisen så vi kan rendera
    // golvet. Hela den här processen från mat4.identity(world) till 
    // drawSquare() är ett draw-call. Vi måste upprepa den här processen för
    // varje objekt vi vill rendera.
    drawSquare();
    // ----------------------------------------------------



    mat4.identity(world);
    const houseMove  = vec3.fromValues(-30.0, -8.0, 0.0);
    const houseScale = vec3.fromValues(10.0, 10.0, 10.0);
    mat4.translate(world, world, houseMove);
    mat4.rotateZ(world, world, time * 1.5);
    mat4.scale(world, world, houseScale);
    setWorldViewProjection();
    drawHouse();



    //
    // <-- Här implementerar du koden som kör drawHouse2() 
    //

    //
    // <-- Här implementerar du koden som kör drawPlanes()
    //

    // Tips: Tänk på att sätta världsmatrisen till identity mellan olika draw-calls
    // och att köra setWorldViewProjection() för att skicka matrisen till grafikkortet
    // innan rendering.
    //
    // Tips: För en fullständig lista över vilka funktioner som finns i mat4,
    // gå till http://glmatrix.net/docs/module-mat4.html

}// function drawScene()


// Den här funktionen målar ut golvet i scenen. Du behöver inte göra några ändringar
// här. För att göra om golvet till en rektangel och byta färg ändrar du istället i
// funktionen createSquare() som ligger längre upp.
function drawSquare()
{
	gl.bindBuffer(gl.ARRAY_BUFFER, shared.square.positionBuffer);
	gl.vertexAttribPointer(shared.vertexPositionLocation, 3, gl.FLOAT, gl.FALSE, 0, 0);

	gl.bindBuffer(gl.ARRAY_BUFFER, shared.square.colorBuffer);
	gl.vertexAttribPointer(shared.vertexColorLocation, 4, gl.FLOAT, gl.FALSE, 0, 0);

	gl.drawArrays(gl.TRIANGLES, 0, shared.square.triangleCount);
}// function drawSquare()



// Den här funktionen målar ut det första huset i scenen. Du behöver inte göra 
// några ändringar här. Huset skapar du i funktionen createHouse()
function drawHouse() {
    gl.bindBuffer(gl.ARRAY_BUFFER, shared.house.positionBuffer);
    gl.vertexAttribPointer(shared.vertexPositionLocation, 3, gl.FLOAT, gl.FALSE, 0, 0);

    gl.bindBuffer(gl.ARRAY_BUFFER, shared.house.colorBuffer);
    gl.vertexAttribPointer(shared.vertexColorLocation, 4, gl.FLOAT, gl.FALSE, 0, 0);

    gl.drawArrays(gl.TRIANGLES, 0, shared.house.triangleCount);
}// function drawHouse()



// Den här funktionen målar ut det andra huset i scenen. Du behöver inte göra 
// några ändringar här. Huset skapar du i funktionen createHouse2()
function drawHouse2() {
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, shared.house2.indexBuffer);
    
    gl.bindBuffer(gl.ARRAY_BUFFER, shared.house2.positionBuffer);
    gl.vertexAttribPointer(shared.vertexPositionLocation, 3, gl.FLOAT, gl.FALSE, 0, 0);

    gl.bindBuffer(gl.ARRAY_BUFFER, shared.house2.colorBuffer);
    gl.vertexAttribPointer(shared.vertexColorLocation, 4, gl.FLOAT, gl.FALSE, 0, 0);
    
    gl.drawElements(gl.TRIANGLES, shared.house2.indiceCount, gl.UNSIGNED_SHORT, 0);
}// function drawHouse2()



// Den här funktionen målar ut de semi-transparenta planen. Du måste implementera 
// den på egen hand. Du kommer att behöva använda funktionerna gl.disable(),
// gl.blendFunc() och gl.enable() på rätt sätt.
// 
// Tips: Kolla på funktionen drawHouse2() som också målar ut geometri med en 
// indexlista.
//
// Tips: Du kan hitta mycket tips genom att Googla på exempelvis 'WebGL set blend mode'
//
function drawPlanes() {

    //
    // <-- Måla ut de halvtransparenta planen här med hjälp av en index-lista
    //

}// function drawPlanes()



// --------------------------------------------------------------------------------
// Här nedanför finns programkoden för respektive shader. Dessa skall inte
// ändras i den här kursen, men kika för all del på hur koden är skriven.
// Språket som koden är skriven i kallas GLSL och liknar c++.
//
// Ordlista:
//
// uniform:     Input variabel som sätts en gång per draw-call. 
// attribute:   Input som hämtas från en buffer en gång per hörn.
// varying:     Sätts i vertexShadern som en slags returvärde. fragmentShadern
//              körs sedan en gång för varje pixel (fragment) i en triangel
//              genom att interpolera dessa värden med avseende på avståndet
//              till just det hörnet.
// gl_Position  Ett speciellt returvärde i vertexShadern som berättar vart hörnet
//              skall målas ut i vy-rymd.
// gl_FragColor Ett speciellt returnvärde i fragmentShadern som berättar vilken 
//              färg pixeln (fragmentet) skall få. Pixeln anges i RGBA 
//              (x=red, y=green, z=blue, w=alpha).
//




// Körs på grafikkortet för varje hörn i modellen.
//     u_worldViewProjection sätts i vår kod ovan varje draw-call.
//     a_position och a_color läses från var sin buffer som lagras i grafikminnet.
//     v_color och gl_Position är returvärden som den här funktionen returnerar.
var vertexShader =
`
	uniform mat4 u_worldViewProjection;
	attribute vec4 a_position;
	attribute vec4 a_color;
	varying vec4 v_color;

	void main(void)
	{
		v_color = a_color;
		gl_Position = u_worldViewProjection * a_position;
	}
`;

// Körs på grafikkortet för varje pixel.
//     v_color sätts till ett interpolerat värde baserat på
//     avståndet till varje hörn i triangeln.
var fragmentShader =
`
	varying highp vec4 v_color;

	void main(void)
	{
		gl_FragColor = v_color;
	}
`;
