function initializeProgram(vshaderSource, fshaderSource) {
    var vshader = initializeShader(gl.VERTEX_SHADER, vshaderSource);
    var fshader = initializeShader(gl.FRAGMENT_SHADER, fshaderSource);
    if (!vshader || !fshader) {
        if (vshader) gl.deleteShader(vshader);
        if (fshader) gl.deleteShader(fshader);
        return null;
    }

    var program = gl.createProgram();
    gl.attachShader(program, vshader);
    gl.attachShader(program, fshader);
    gl.linkProgram(program);
    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
        console.log(gl.getProgramInfoLog(program));
        gl.deleteProgram(program);
        return null;
    }

    return program;
}



function initializeShader(type, source) {
    var shader = gl.createShader(type);
    gl.shaderSource(shader, source);
    gl.compileShader(shader);
    if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
        console.log(gl.getShaderInfoLog(shader));
        gl.deleteShader(shader);
        return null;
    }
    return shader;
}



function loadTexture(filename) {
    var texture = gl.createTexture();
    var image = document.createElement('img');
    image.onload = function(ev) {
        console.log('Texture "' + filename + '" loaded.');
        gl.activeTexture(gl.TEXTURE0);
        gl.bindTexture(gl.TEXTURE_2D, texture);
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, image);
        gl.generateMipmap(gl.TEXTURE_2D);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR_MIPMAP_LINEAR);
        ev.preventDefault();
        return false;
    };
    image.onerror = function(ev) {
        console.log('Could not load texture "' + filename + '" file.');
        ev.preventDefault();
        return false;
    };
    image.src = 'textures/' + filename;
    return texture;
}



function billboardTransformation(billboard, view) {
    mat4.identity(billboard);
    billboard[0] = view[0];
    billboard[1] = view[4];
    billboard[2] = view[8];
    billboard[4] = view[1];
    billboard[5] = view[5];
    billboard[6] = view[9];
    billboard[8] = view[2];
    billboard[9] = view[6];
    billboard[10] = view[10];
}
