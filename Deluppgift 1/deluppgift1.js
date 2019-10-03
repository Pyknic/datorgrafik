// V�lkommen till f�rsta deluppgiften!
//
// F�lj instruktionerna p� kurssidan och �ndra g�rna i den h�r filen.
// Du kan n�r som helst testa din kod genom att �ppna 'index.html' i
// en webbl�sare, f�rslagsvis Chrome.
//
// Tips:
// - B�rja med att kika p� funktionen createSquare() l�ngre ner och
//   g�r sm� �ndringar f�r att f�rst� hur den fungerar.
//
// - Se sedan om du kan fylla i createHouse() enligt uppgiftsbeskrivningen.
//   Du beh�ver �ven �ndra i drawScene() f�r att huset skall dyka upp.
//
// - F�r att g�ra s� att man kan sl� p�/av inst�llningar, �ndra i
//   funktionen keydown().
// 
// - Om saker slutar fungera, f�rs�k kommentera ut �ndringar tills 
//   det fungerar igen.
// 
// - Eventuella fel syns om du h�gerklickar i webbl�saren och v�ljer 'Inspektera'.
//   Du kan �ven skriva kod och evaluera direkt i konsollen d�r.
//
// - F�r att fels�ka din kod, skriv loggmeddelanden med 'console.log("Testar...");'
//
// - Ibland anv�nds 'var' och ibland 'const'. Om du �r os�ker p� vilken du
//   skall anv�nda s� k�r p� 'var'.

var gl;

// H�r skapas ett objekt i JavaScript med ett antal medlemsvariabler som vi vill
// skall vara globalt tillg�ngliga. Detta g�r det enkelt f�r oss att komma �t
// v�rdena i alla funktioner nedan.
//
// Notera att raderna separeras med komma ',' och inte semikolon ';'. Anledningen 
// �r att detta endast �r en upplistning av alla medlemsvariabler. Vi kan senare 
// komma �t dessa i alla funktioner genom att skriva exempelvis 'shared.worldMatrix'.
var shared = {

    // Transformationsmatriser, 'mat4' �r ett externt bibliotek. Se http://glmatrix.net/docs/module-mat4.html
	worldMatrix: mat4.create(),               // W:     Transformerar fr�n modellrymd till v�rldsrymd
	viewMatrix: mat4.create(),                // V:     Transformerar fr�n v�rldsrymd till vy-rymd
	projectionMatrix: mat4.create(),          // P:     G�r avl�gsna punkter mindre f�r att skapa djup-k�nsla
    viewProjectionMatrix: mat4.create(),      // P*V:   Uppdateras i frameCallback()
    worldViewProjectionMatrix: mat4.create(), // P*V*W: Uppdateras i setWorldViewProjection()

    // Referenser som anv�nds n�r data skickas till grafikkortet
	worldViewProjectionMatrixLocation: null,
	vertexPositionLocation: null,
	vertexColorLocation: null,

    // Anv�nds f�r att r�kna ut deltaTime
	time: 0,
	previousTime: 0,

    // Kamerans nuvarande position. S�tts i frameCallback().
    // Du kan anv�nda denna om du vill r�kna ut avst�ndet till kameran.
    // 'vec3' �r ett externt bibliotek. Se http://glmatrix.net/docs/module-vec3.html
	cameraPosition: vec3.create(),

    // Data som skall lagras i grafikminnet hamnar i en 'buffer'. Varje buffer
    // f�r ett unikt tal (en slags referens) som du anv�nder n�r du vill be
    // grafikkortet att rendera n�got. Dessa tal lagras h�r nedan.
    square: { positionBuffer: null, colorBuffer: null, triangleCount: 0 },
    house: { positionBuffer: null, colorBuffer: null, triangleCount: 0 },
    house2: { indexBuffer: null, positionBuffer: null, colorBuffer: null, indiceCount: 0 },
    planes: { indexBuffer: null, positionBuffer: null, colorBuffer: null, indiceCount: 0 },

    // H�r har jag definierat en bool f�r att h�lla koll p� om scenen �r pausad.
    // Du kommer antagligen att beh�va definiera dina egna flaggor p� liknande s�tt.
    paused: false,
    cullBack: false
};



// Den h�r funktionen k�rs automatiskt n�r sidan laddas (se index.html).
function main(context) {
	gl = context;

    // 'keydown' �r en funktion i den h�r filen. Genom att l�gga till den som 
    // en h�ndelse-lyssnare s� kommer den att kallas p� automatiskt varje g�ng
    // som anv�ndaren trycker ner en knapp.
	window.addEventListener('keydown', keydown);

    // Kompilera och l�nka ett program som kan k�ras p� grafikkortet.
    // 'vertexShader' och 'fragmentShader' �r konstanter som �r definierade
    // i botten av den h�r filen. De inneh�ller koden f�r respektive shader.
	var program = initializeProgram(vertexShader, fragmentShader);
	if (!program) {
		window.removeEventListener('keydown', keydown);
		return;
	}

    // Programmet �r nu kompilerat. F�r att kunna invokera ett draw-call m�ste
    // vi d�rf�r veta hur grafikkortet f�rv�ntar sig f� input-parametrarna.
    // V�r shader har tre inputs, en 'uniform'-matris och tv� 'attribute'-vektorer.
    // 'uniforms' s�tts en g�ng per draw-call, 'attributes' h�mtas automatiskt fr�n
    // varje h�rn i modellen som skall renderas. 
	gl.useProgram(program);
	shared.worldViewProjectionMatrixLocation = gl.getUniformLocation(program, 'u_worldViewProjection');
	shared.vertexPositionLocation = gl.getAttribLocation(program, 'a_position');
    shared.vertexColorLocation = gl.getAttribLocation(program, 'a_color');

    // 'attribute'-variabler m�ste aktiveras. Det beh�ver dock inte 'uniform'-variabler.
	gl.enableVertexAttribArray(shared.vertexPositionLocation);
	gl.enableVertexAttribArray(shared.vertexColorLocation);

    // Vi genererar en perspectiveMatrix och lagrar i 'shared'. Se kursbok s.96-102
    // Perspektiv-matrisen kommer att f�rbli konstant s� l�nge vi inte f�r�ndrar
    // f�nstrets storlek, allts� beh�ver vi bara g�ra detta en g�ng.
	var aspectRatio = gl.drawingBufferWidth / gl.drawingBufferHeight;
	mat4.perspective(shared.projectionMatrix, Math.PI/4, aspectRatio, 1, 150);

    // Skapa geometrin i scenen och bind dem till varsin grafikkortsbuffer.
    // N�r detta �r gjort beh�ver geometrin inte l�ngre lagras i RAM-minnet.
    createSquare();
    createHouse();
    createHouse2();
    createPlanes();

    //
    // <--- H�r b�r du l�gga till en eller flera gl.enable(...); f�r att sl�
    //      p� olika grafikkortsinst�llningar (exempelvis baksidegallring).
    //      Tips: Googla 'WebGL enable backface culling'
    //
    gl.enable(gl.CULL_FACE);

    // K�r funktionen 'frameCallback' n�r f�nstret �r redo att rendera 
    // n�sta frame. frameCallback() kommer i sin tur att beg�ra en ny
    // rendering. 'frameCallback' �r definierad l�ngre ner i den h�r filen.
    window.requestAnimationFrame(frameCallback);

}// function main()



// Den h�r funktionen skapar geometrin f�r golvet i scenen (tv� trianglar)
// och binder till en grafikkortsbuffer. Den k�rs bara en g�ng, d�refter
// finns geometrin lagrad i grafikminnet.
function createSquare()
{
    // Vi skapar en array med h�rnpositioner i objektrymd. Varje grupp 
    // om tre flyttal bildar ett h�rn. I det h�r fallet anv�nder vi inte 
    // n�gon indexlista, allts� beh�ver vi upprepa samma h�rn flera 
    // g�nger ([-30, 0, 30] exempelvis). 
    var positions = [
        // Den f�rsta triangeln
        -20, 0, -30,
        -20, 0, 30,
        20, 0, -30,

        // Den andra triangeln
        -20, 0, 30,
        20, 0, 30,
        20, 0, -30
    ];

    // Alla h�rn skall vara gr�. Trots det m�ste vi ange lika m�nga 
    // f�rger som vi har vertiser i arrayen ovan, allts� loopar vi 6 
    // g�nger.
    var colors = [];
    for (var i = 0; i < 6; i++) { // Gray
        // Detta �r ett enkelt (men inte s�rskilt effektivt) s�tt att
        // l�gga till element i slutet p� en array i JavaScript. Varje
        // f�rg best�r av 4 v�rden. L�ngden p� arrayen kommer allts�
        // att bli 6*4=24, medan antalet v�rden i positionsarrayen �r
        // 6*3=18.
        colors = colors.concat([1.0, 0.5, 0.5, 1]);
    }

    // Vi beg�r att grafikkortet allokerar en ny buffer och fyller den
    // med inneh�llet i v�r array. D� JavaScript �r l�st typat till 
    // skillnad fr�n C++ s� m�ste vi kalla p� 'new Float32Array()' f�r
    // att definiera vilken typ av array vi har (32-bitars float). Vi
    // lagrar en referens till v�r nya buffer i 'shared.square.positionBuffer'.
    // Denna referens beh�ver vi n�r vi vill m�la ut golvet.
	shared.square.positionBuffer = gl.createBuffer();
	gl.bindBuffer(gl.ARRAY_BUFFER, shared.square.positionBuffer);
	gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(positions), gl.STATIC_DRAW);

    // Vi g�r sedan samma sak med f�rgerna. Notera att det inte spelar
    // n�gon roll f�r grafikkortet vad f�r typ av data vi lagrar. 
    // Positioner, f�rger, etc. �r bara data!
	shared.square.colorBuffer = gl.createBuffer();
	gl.bindBuffer(gl.ARRAY_BUFFER, shared.square.colorBuffer);
	gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(colors), gl.STATIC_DRAW);

    // Det finns st�d i WebGL f�r att bara m�la ut delar av ett objekt.
    // F�r att m�la ut hela objektet m�ste vi d�rf�r komma ih�g hur m�nga 
    // trianglar det best�r av (Antalet trianglar = Antalet h�rnen / 3).
    shared.square.triangleCount = positions.length / 3;

}// function createSquare()



// Skapar det f�rsta huset (du m�ste sj�lv implementera den h�r funktionen)
function createHouse() {

    //
    // Den h�r funktionen m�ste du sj�lv implementera. Du kan utg� 
    // ifr�n koden i 'createSquare()' ovan, men modifiera den s� att
    // ett hus skapas. P� Canvas finns en bild av huset som du kan
    // kika p� f�r att f� koordinaterna r�tt. Du m�ste dock lista 
    // ut h�rnordningen p� egen hand.
    //
    // H�r �r de v�rden som m�ste s�ttas i funktionen:
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

        // V�nster v�gg
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

        // H�ger v�gg
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

    // V�nster v�gg
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

    // H�ger v�gg
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



// Skapar det andra huset (du m�ste �ndra h�r s� att den m�lar ut ett hus
// ist�llet f�r en kvadrat)
function createHouse2() {

    //
    // Detta hus skall se identiskt ut som det f�rra, men ist�llet f�r
    // att ange samma h�rn flera g�nger skall du anv�nda en indexlista.
    // Nedan finns ett exempel som skapar en rektangel med hj�lp av en
    // indexlista.
    //

    // H�r lagras varje unikt h�rn. N�r du �r f�rdig kommer den att 
    // best� av 10 h�rnen (index 0 - 9) och allts� totalt 30 nummer.
    var vertices = [
        0, -15, -15, // H�rn 0     <--- OBS! Dessa h�rn skall bytas ut!
        0, -15, 15,  // H�rn 1
        0, 15, -15,  // H�rn 2
        0, 15, 15    // H�rn 3
    ];

    // H�r lagras varje h�rns f�rg i samma ordning som ovan. N�r du �r 
    // f�rdig kommer den att best� av 10 f�rger (index 0 - 9) och 
    // allts� totalt 40 nummer (10 * 4).
    var colors = [ 
        1, 0, 0, 1, // R�d        <--- OBS! Dessa f�rger skall bytas ut!
        0, 1, 0, 1, // Gr�n
        0, 0, 1, 0, // Bl�
        1, 1, 1, 1  // Vit
    ];

    // Tv� trianglar definieras genom att lista indexen i arrayerna ovan.
    // N�r funktionen �r f�rdig kommer den att best� av 16 trianglar, dvs. 48 index.
    var indices = [ 
        0, 1, 3, // F�rsta triangeln   <--- OBS! Dessa index skall bytas ut!
        0, 3, 2  // Andra triangeln
    ];

    // Vi allokerar en ny buffer, men detta �r en ELEMENT_ARRAY_BUFFER ist�llet f�r en
    // ARRAY_BUFFER. Det betyder att den lagrar index till andra arrayer. Typen �r �ven
    // Uint16Array (16-bitars unsigned int) ist�llet f�r Float32Array.
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

    // F�rra g�ngen lagrade vi antalet trianglar. N�r man m�lar ut indexerade primitiver
    // beh�ver man ist�llet ange hur m�nga index man har. Just nu �r det 6 st, men n�r
    // du �r f�rdig med den h�r funktionen kommer det att vara 16*3=48.
    shared.house2.indiceCount = indices.length;

}// function createHouse2()



// Skapar det f�rsta huset (du m�ste sj�lv implementera den h�r funktionen)
function createPlanes() {
    //
    // H�r skapar du tv� halvtransparenta planes enligt uppgiften. Du kan skapa dem
    // i samma objekt. H�r �r de v�rden som m�ste s�ttas:
    //     shared.planes.indexBuffer
    //     shared.planes.positionBuffer
    //     shared.planes.colorBuffer
    //     shared.planes.triangleCount
    //

}// function createPlanes()



// Denna funktion k�rs varje g�ng en knapp trycks ner p� tangentbordet.
// Jag har lagt in ett par tomma if-satser nedan som du f�rv�ntas modifiera.
// L�sningen �r n�got mer komplicerad �n f�r 'shared.paused', men inte mycket.
//
// Tips: Google is your friend.
//
function keydown(event) {

    // Om det var knappen 'p', s�tt 'paused' till motsatsen till 'paused'.
    if (event.key == 'p') {
        shared.paused = !shared.paused;
    }
        
    // Sl� p�/av djup-testning.
    if (event.key == 'd') {
        if (shared.depthTest) {
            shared.depthTest = false;
            gl.disable(gl.DEPTH_TEST);
        } else {
            shared.depthTest = true;
            gl.enable(gl.DEPTH_TEST);
        }
    }

    // Sl� p�/av backface-culling.
    if (event.key == 'c') {
        if (shared.cullBack) {
            shared.cullBack = false;
            gl.disable(gl.CULL_FACE);
        } else {
            shared.cullBack = true;
            gl.enable(gl.CULL_FACE);
        }
    }

    // V�xla mellan 'over' och 'add' som metod f�r alpha-blending.
    if (event.key == 'b') {
        //
        // Den h�r funktionen skriver du sj�lv.
        //
    }
}// function keydown()



// Den h�r funktionen kallas p� varje frame. Den ber�knar delta-tiden sedan
// den f�reg�ende framen och invokerar sedan 'frame'-funktionen. D�refter
// beg�r den en ny rendering. Du beh�ver inte �ndra n�got i den h�r funktionen.
function frameCallback(time) {

    // Ber�kna tiden sedan den f�reg�ende fram-en och uppdatera klockan.
    var deltaTime = time - shared.previousTime;
    if (!shared.paused) shared.time += deltaTime;
    shared.previousTime = time;
    var timeSecs = shared.time * 0.001;

    // Rensa sk�rmens f�rg- och djupbuffer.
    gl.clearColor(0, 0, 0, 1);
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

    // Flytta kameran till en position x = cos(t)*d, z = sin(t)*d 
    // d�r t �r tiden i sekunder och d �r avst�ndet (y �r upp�t).
    const cameraDistance = 80;
    vec3.set(shared.cameraPosition, Math.cos(timeSecs) * cameraDistance, 0, Math.sin(timeSecs) * cameraDistance);
    mat4.lookAt(shared.viewMatrix, shared.cameraPosition, vec3.fromValues(0, 0, 0), vec3.fromValues(0, 1, 0));

    // Av prestandask�l kan vi multiplicera perspektiv-matrisen med vy-matrisen en g�ng
    // och anv�nda det framr�knade v�rdet fram�ver (se kursboken s.65).
    mat4.multiply(shared.viewProjectionMatrix, shared.projectionMatrix, shared.viewMatrix);

    // Det �r dags att m�la ut scenen!
    drawScene(timeSecs);

    // Schemal�gg en ny utritning s� snart som m�jligt. Detta g�r att vi inte 
    // beh�ver ha en while()-loop som blockar CPUn. 
    window.requestAnimationFrame(frameCallback);

}// function frameCallback()



// Den h�r funktionen beh�ver du inte �ndra i, men h�r �r en beskrivning av hur den fungerar:
//
// Illusionen av 3D skapas genom att varje h�rn i objektet transformeras med hj�lp av tre 
// matriser...
// 
//      s = P*V*W*p
// 
// ...d�r p �r h�rnets position (i objektrymd) och s �r positionen p� sk�rmen som vi s�ker.
// W = worldMatrix, allts� matrisen som flyttar en position fr�n objekt-rymd till v�rlds-rymd
// V = viewMatrix, allts� matrisen som flyttar positionen fr�n v�rlds-rymd till vy-rymd
// P = perspectiveMatrix, allts� matrisen som skapar en djupk�nsla genom att f�rminska objekt som
//     ligger l�ngt bort fr�n kameran.
//
// I och med att vi redan r�knat ut P*V varje g�ng kameran flyttar p� sig, kan vi helt enkelt
// multiplicera denna matris med W och skicka den resulterande matrisen till grafikshaderns
// uniform-variabel. Detta m�ste vi g�ra varje draw-call, d.v.s. varje g�ng vi vill rendera
// n�got i v�rlden med en ny position eller rotation. p h�mtar shadern automatiskt fr�n
// vertex-buffern n�r den itererar �ver alla h�rnen i modellen.
//
// Du kan l�sa om bakgrunden till varf�r vi g�r detta i kursboken p� s.15-17
//
function setWorldViewProjection() {
	mat4.multiply(shared.worldViewProjectionMatrix, shared.viewProjectionMatrix, shared.worldMatrix);
    gl.uniformMatrix4fv(shared.worldViewProjectionMatrixLocation, false, shared.worldViewProjectionMatrix);

}// function setWorldViewProjection()



// Den h�r funktionen m�lar ut scenen. Varje g�ng du vill m�la ut ett nytt objekt
// (ett nytt draw-call) s� m�ste du f�rbereda P*V*W-matrisen som du vill skicka med
// till shader-programmet. Detta g�rs med funktionen setWorldViewProjection(). Den
// tar inga in-parametrar, ist�llet manipulerar du 'shared.worldMatrix'.
function drawScene(time) {

    // Bara ett kortare namn (detta �r en pekare)
	var world = shared.worldMatrix; 



    // ----------------------------------------------------
    // Detta 'nollst�ller' v�rldsmatrisen.
    mat4.identity(world); 

    // Vi skapar en vektor med l�ngd 20 som pekar ner�t, sedan anv�nder vi
    // den f�r att g�ra om 'world' till en translation-matris (se kursboken s.59).
    // Om vi d�refter multiplicerar matrisen med en position s� kommer positionen
    // flyttas ned�t 20 steg.
    const squareOffset = vec3.fromValues(0, -20, 0); 
    mat4.translate(world, world, squareOffset);

    // Nu n�r vi har v�r v�rldsmatris (W) s� kan vi r�kna ut P*V*W-matrisen som
    // skall skickas till grafikkortet. Vi g�r detta genom att kalla p�
    // setWorldViewProjection(). Notera att den inte tar n�gra in-parametrar.
    // Ist�llet l�ser den direkt fr�n 'shared.worldMatrix'.
    setWorldViewProjection();

    // Nu har grafikkortet f�tt transformationsmatrisen s� vi kan rendera
    // golvet. Hela den h�r processen fr�n mat4.identity(world) till 
    // drawSquare() �r ett draw-call. Vi m�ste upprepa den h�r processen f�r
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
    // <-- H�r implementerar du koden som k�r drawHouse2() 
    //

    //
    // <-- H�r implementerar du koden som k�r drawPlanes()
    //

    // Tips: T�nk p� att s�tta v�rldsmatrisen till identity mellan olika draw-calls
    // och att k�ra setWorldViewProjection() f�r att skicka matrisen till grafikkortet
    // innan rendering.
    //
    // Tips: F�r en fullst�ndig lista �ver vilka funktioner som finns i mat4,
    // g� till http://glmatrix.net/docs/module-mat4.html

}// function drawScene()


// Den h�r funktionen m�lar ut golvet i scenen. Du beh�ver inte g�ra n�gra �ndringar
// h�r. F�r att g�ra om golvet till en rektangel och byta f�rg �ndrar du ist�llet i
// funktionen createSquare() som ligger l�ngre upp.
function drawSquare()
{
	gl.bindBuffer(gl.ARRAY_BUFFER, shared.square.positionBuffer);
	gl.vertexAttribPointer(shared.vertexPositionLocation, 3, gl.FLOAT, gl.FALSE, 0, 0);

	gl.bindBuffer(gl.ARRAY_BUFFER, shared.square.colorBuffer);
	gl.vertexAttribPointer(shared.vertexColorLocation, 4, gl.FLOAT, gl.FALSE, 0, 0);

	gl.drawArrays(gl.TRIANGLES, 0, shared.square.triangleCount);
}// function drawSquare()



// Den h�r funktionen m�lar ut det f�rsta huset i scenen. Du beh�ver inte g�ra 
// n�gra �ndringar h�r. Huset skapar du i funktionen createHouse()
function drawHouse() {
    gl.bindBuffer(gl.ARRAY_BUFFER, shared.house.positionBuffer);
    gl.vertexAttribPointer(shared.vertexPositionLocation, 3, gl.FLOAT, gl.FALSE, 0, 0);

    gl.bindBuffer(gl.ARRAY_BUFFER, shared.house.colorBuffer);
    gl.vertexAttribPointer(shared.vertexColorLocation, 4, gl.FLOAT, gl.FALSE, 0, 0);

    gl.drawArrays(gl.TRIANGLES, 0, shared.house.triangleCount);
}// function drawHouse()



// Den h�r funktionen m�lar ut det andra huset i scenen. Du beh�ver inte g�ra 
// n�gra �ndringar h�r. Huset skapar du i funktionen createHouse2()
function drawHouse2() {
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, shared.house2.indexBuffer);
    
    gl.bindBuffer(gl.ARRAY_BUFFER, shared.house2.positionBuffer);
    gl.vertexAttribPointer(shared.vertexPositionLocation, 3, gl.FLOAT, gl.FALSE, 0, 0);

    gl.bindBuffer(gl.ARRAY_BUFFER, shared.house2.colorBuffer);
    gl.vertexAttribPointer(shared.vertexColorLocation, 4, gl.FLOAT, gl.FALSE, 0, 0);
    
    gl.drawElements(gl.TRIANGLES, shared.house2.indiceCount, gl.UNSIGNED_SHORT, 0);
}// function drawHouse2()



// Den h�r funktionen m�lar ut de semi-transparenta planen. Du m�ste implementera 
// den p� egen hand. Du kommer att beh�va anv�nda funktionerna gl.disable(),
// gl.blendFunc() och gl.enable() p� r�tt s�tt.
// 
// Tips: Kolla p� funktionen drawHouse2() som ocks� m�lar ut geometri med en 
// indexlista.
//
// Tips: Du kan hitta mycket tips genom att Googla p� exempelvis 'WebGL set blend mode'
//
function drawPlanes() {

    //
    // <-- M�la ut de halvtransparenta planen h�r med hj�lp av en index-lista
    //

}// function drawPlanes()



// --------------------------------------------------------------------------------
// H�r nedanf�r finns programkoden f�r respektive shader. Dessa skall inte
// �ndras i den h�r kursen, men kika f�r all del p� hur koden �r skriven.
// Spr�ket som koden �r skriven i kallas GLSL och liknar c++.
//
// Ordlista:
//
// uniform:     Input variabel som s�tts en g�ng per draw-call. 
// attribute:   Input som h�mtas fr�n en buffer en g�ng per h�rn.
// varying:     S�tts i vertexShadern som en slags returv�rde. fragmentShadern
//              k�rs sedan en g�ng f�r varje pixel (fragment) i en triangel
//              genom att interpolera dessa v�rden med avseende p� avst�ndet
//              till just det h�rnet.
// gl_Position  Ett speciellt returv�rde i vertexShadern som ber�ttar vart h�rnet
//              skall m�las ut i vy-rymd.
// gl_FragColor Ett speciellt returnv�rde i fragmentShadern som ber�ttar vilken 
//              f�rg pixeln (fragmentet) skall f�. Pixeln anges i RGBA 
//              (x=red, y=green, z=blue, w=alpha).
//




// K�rs p� grafikkortet f�r varje h�rn i modellen.
//     u_worldViewProjection s�tts i v�r kod ovan varje draw-call.
//     a_position och a_color l�ses fr�n var sin buffer som lagras i grafikminnet.
//     v_color och gl_Position �r returv�rden som den h�r funktionen returnerar.
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

// K�rs p� grafikkortet f�r varje pixel.
//     v_color s�tts till ett interpolerat v�rde baserat p�
//     avst�ndet till varje h�rn i triangeln.
var fragmentShader =
`
	varying highp vec4 v_color;

	void main(void)
	{
		gl_FragColor = v_color;
	}
`;
