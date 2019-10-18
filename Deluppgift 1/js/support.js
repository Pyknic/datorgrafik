function initializeProgram(vshaderSource, fshaderSource)
{
    var vshader = initializeShader(gl.VERTEX_SHADER, vshaderSource);
    var fshader = initializeShader(gl.FRAGMENT_SHADER, fshaderSource);
    if (!vshader || !fshader)
    {
        if (vshader) gl.deleteShader(vshader);
        if (fshader) gl.deleteShader(fshader);
        return null;
    }

    var program = gl.createProgram();
    gl.attachShader(program, vshader);
    gl.attachShader(program, fshader);
    gl.linkProgram(program);
    if (!gl.getProgramParameter(program, gl.LINK_STATUS))
    {
        console.log(gl.getProgramInfoLog(program));
        gl.deleteProgram(program);
        return null;
    }

    return program;
}



function initializeShader(type, source)
{
    var shader = gl.createShader(type);
    gl.shaderSource(shader, source);
    gl.compileShader(shader);
    if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS))
    {
        console.log(gl.getShaderInfoLog(shader));
        gl.deleteShader(shader);
        return null;
    }
    return shader;
}