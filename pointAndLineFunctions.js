// Eaton Wu
// CS 510-01
// 09/19/2023

'use strict';

// Global variables that are set and used
// across the application
let gl,
    program,
    verticesSize,
    vertexBuffer,
    vertices,
    drawingTop,
    drawingLeft,
    canvas,
    printDebug,
    lineStart,
    lineEnd= false;

// Given an id, extract the content's of a shader script
// from the DOM and return the compiled shader
function getShader(id) {
    const script = document.getElementById(id);
    const shaderString = script.text.trim();

    // Assign shader depending on the type of shader
    let shader;
    if (script.type === 'x-shader/x-vertex') {
        shader = gl.createShader(gl.VERTEX_SHADER);
    }
    else if (script.type === 'x-shader/x-fragment') {
        shader = gl.createShader(gl.FRAGMENT_SHADER);
    }
    else {
        return null;
    }

    // Compile the shader using the supplied shader code
    gl.shaderSource(shader, shaderString);
    gl.compileShader(shader);

    // Ensure the shader is valid
    if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
        console.error(gl.getShaderInfoLog(shader));
        return null;
    }

    return shader;
}

// Create a program with the appropriate vertex and fragment shaders
function initProgram() {
    const vertexShader = getShader('vertex-shader');
    const fragmentShader = getShader('fragment-shader');

    // Create a program
    program = gl.createProgram();
    // Attach the shaders to this program
    gl.attachShader(program, vertexShader);
    gl.attachShader(program, fragmentShader);
    gl.linkProgram(program);

    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
        console.error('Could not initialize shaders');
    }

    // Use this program instance
    gl.useProgram(program);
    // We attach the location of these shader values to the program instance
    // for easy access later in the code
    program.aVertexPosition = gl.getAttribLocation(program, 'aVertexPosition');
}

// Set up the buffers
function initBuffers() {

    // NOTE: this has to contain enough points for the initial drawing!
    vertices = new Float32Array(90000);

    verticesSize = 0;

    // Setting up the VBO
    vertexBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, vertexBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, vertices, gl.DYNAMIC_DRAW);

    // unset buffer
    gl.bindBuffer(gl.ARRAY_BUFFER, null);
}

// We call draw to render to our canvas
function draw() {
    // Clear the scene
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
    gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);

    // Clear canvas
    gl.clear(gl.COLOR_BUFFER_BIT);

    // Use the buffers we've constructed
    gl.bindBuffer(gl.ARRAY_BUFFER, vertexBuffer);
    gl.vertexAttribPointer(program.aVertexPosition, 3, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(program.aVertexPosition);

    // Draw to the scene using an array of points
    gl.drawArrays(gl.POINTS, 0, verticesSize);

    // unset buffer
    gl.bindBuffer(gl.ARRAY_BUFFER, null);
}

// Entry point to our application
function init() {

    // Retrieve the canvas
    canvas = utils.getCanvas('webgl-canvas');
    // Set the canvas to the size of the screen
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    canvas.onmouseup = function (ev) { addMousePoint(ev) };

    printDebug = false;

    // figure out the top and left of our particular window
    drawingTop = 0;
    drawingLeft = 0;
    let tmpCanvas = canvas;
    while (tmpCanvas && tmpCanvas.tagName !== 'BODY') {
        drawingTop += tmpCanvas.offsetTop;
        drawingLeft += tmpCanvas.offsetLeft; // gets the offset of the left side
        tmpCanvas = tmpCanvas.offsetParent;
    }
    drawingLeft += window.scrollX;
    drawingTop -= window.scrollY;

    lineStart = -2;
    lineEnd = -2;

    // Retrieve a WebGL context
    gl = utils.getGLContext(canvas);
    // Set the clear color to be black
    gl.clearColor(0, 0, 0, 1);

    // Call the functions in an appropriate order
    initProgram();
    initBuffers();
    setDataForDrawTest();
    draw();
}

// adds a point to a vertex array to then be drawn
function addPoint(x, y) {
    if (printDebug) {
        console.log("adding point " + x + " " + y)
    }
    let arrayPos = verticesSize * 3;
    vertices[arrayPos] = x;
    vertices[arrayPos + 1] = y;
    vertices[arrayPos + 2] = 0;
    verticesSize += 1;
}


function midpointLineLow(startX, startY, endX, endY) {
    let tempList = [];
    let incE, incNE, x, y, d;
    let dy = endY - startY, dx = endX - startX;

    incE = 2 * dy;
    incNE = 2 * (dy - dx);
    d = incE - dx;
    let y_increment = 1;

    // if slope is negative
    if (dy < 0) {
        y_increment = -1;
        incE = -incE;
    }

    for (x = startX, y = startY; x <= endX; ++x) {
        let coords = worldToNormalized(x, y);
        if (printDebug) {
            console.log("Drawing point (" + x + "," + y + ") at (" + coords[0] + "," + coords[1] + ")");
        }
        addPoint(coords[0], coords[1]);
        tempList.push([x, y]);
        if (d <= 0) {
            d += incE;
        }
        else {
            d += incNE;
            y += y_increment;
        }
    }
    return tempList;
}

function negativeMidpointLineHigh(startX, startY, endX, endY) {
    let tempList = [];
    let incS, incSE, x, y, d;
    let dy = endY - startY, dx = endX - startX;

    incS = 2 * dx;
    incSE = 2 * (dy + dx);
    d = dx + incS;

    for (x = startX, y = startY; y > endY; y--) {
        let coords= worldToNormalized(x, y);
        if (printDebug) {
            console.log("Drawing point (" + x + "," + y + ") at (" + coords[0] + "," + coords[1] + ")");
        }
        addPoint(coords[0], coords[1]);
        tempList.push([x, y]);
        if (d <= 0) {
            d += incS;
        }
        else {
            d += incSE;
            x += 1;
        }
    }
    return tempList;
}


function negativeMidpointLineLow(startX, startY, endX, endY) {
    let tempList = [];
    let incE, incSE, x, y, d;
    let dy = endY - startY, dx = endX - startX;

    incE = 2 * dy;
    incSE = 2 * (dy + dx);
    d = incE + dx;

    for (x = startX, y = startY; x <= endX; ++x) {
        let coords = worldToNormalized(x, y);
        if (printDebug) {
            console.log("Drawing point (" + x + "," + y + ") at (" + coords[0] + "," + coords[1] + ")");
        }
        addPoint(coords[0], coords[1]);
        tempList.push([x, y]);
        if (d > 0) {
            d += incE;
        }
        else {
            d += incSE;
            y -= 1;
        }
    }
}

function midpointLineHigh(startX, startY, endX, endY) {
    let tempList = [];
    let incN, incNE, x, y, d;
    let dy = endY - startY, dx = endX - startX;

    incN = -2 * dx;
    incNE = 2 * (dy - dx);
    d = dy - incN;

    for (x = startX, y = startY; y <= endY; ++y) {
        let coords= worldToNormalized(x, y);
        if (printDebug) {
            console.log("Drawing point (" + x + "," + y + ") at (" + coords[0] + "," + coords[1] + ")");
        }
        addPoint(coords[0], coords[1]);
        tempList.push([x, y]);
        if (d > 0) {
            d += incN;
        }
        else {
            d += incNE;
            x += 1;
        }
    }
}



function midpointLineDrawing(startX, startY, endX, endY) {
    console.log("Drawing line from (" + startX + "," + startY + ") to (" + endX + "," + endY + ") with slope" +
        " " + (endY - startY) + '/' + (endX - startX));
    let tempList = [];

    let x, y;
    let dy = endY - startY, dx = endX - startX;

    if (startX > endX) {
        let temp = startX;
        startX = endX;
        endX = temp;
        temp = startY;
        startY = endY;
        endY = temp;
    }

    // checking for infinite slope
    if (startX === endX) {
        // if endY > startY, set y to startY and increment until endY
        if (endY > startY) {
            for (x = startX, y = startY; y <= endY; y++) {
                let coords = worldToNormalized(x, y);
                if (printDebug) {
                    console.log("Drawing point (" + x + "," + y + ") at (" + coords[0] + "," + coords[1] + ")");
                }
                addPoint(coords[0], coords[1]);
                tempList.push([x, y]);
            }
        }
        else {
            for (x = startX, y = startY; y >= endY; y--) {
                let coords = worldToNormalized(x, y);
                if (printDebug) {
                    console.log("Drawing point (" + x + "," + y + ") at (" + coords[0] + "," + coords[1] + ")");
                }
                addPoint(coords[0], coords[1]);
                tempList.push([x, y]);
            }
        }
        return tempList;
    }

    // checking for 1 slope
    if (dx === dy) {
        console.log("Slope 1 line detected")
        for (x = startX, y = startY; x <= endX; x++) {
            let coords = worldToNormalized(x, y);
            if (printDebug) {
                console.log("Drawing point (" + x + "," + y + ") at (" + coords[0] + "," + coords[1] + ")");
            }
            addPoint(coords[0], coords[1]);
            tempList.push([x, y]);
            y++;
        }
        return tempList;
    }

    let slope = dy / dx;

    if (Math.abs(dy) < Math.abs(dx)) { // slope is less than 1
        // slope is numerically negative, but drawn as positive slope
        if (slope < 0) {
            negativeMidpointLineLow(startX, startY, endX, endY);
        }
        else { // slope is positive, but drawn as negative slope
            midpointLineLow(startX, startY, endX, endY);
        }
    }
    else { // slope is greater than 1
        if (slope < 0) {
            negativeMidpointLineHigh(startX, startY, endX, endY);
        }
        else {
            midpointLineHigh(startX, startY, endX, endY); // works good
        }
    }
}


function worldToNormalized(x, y) {
    // takes a point in world coordinates and returns a point in normalized coordinates
    let translationX = (-2 * drawingLeft / canvas.width) - 1;
    let xNorm = 2 * x / canvas.width + translationX;
    let yNorm = 2 * (drawingTop - y) / canvas.height + 1;
    return [xNorm, yNorm];
}

function setDataForDrawTest() {
    // sets the vertex buffer to draw all
    // line types you believe should be drawn
    // note that it should use the midPointLineDrawing algorithm
    // This code may be creative in nature involving color and 
    // different shapes

    // draw the four quadrants
    console.log("canvas width: " + canvas.width + " canvas height: " + canvas.height);

    console.log("Drawing quadrants");

    // 0 and infinite slope tests (x and y-axis)
    midpointLineDrawing(drawingLeft, canvas.height / 2, canvas.width, canvas.height / 2);
    midpointLineDrawing(canvas.width / 2, canvas.height, canvas.width / 2, drawingTop);

    console.log("Drawing low slope lines");

    // center of top left quadrant to center (positive slope inwards)
    midpointLineDrawing(drawingLeft, canvas.height / 4, canvas.width / 2, canvas.height / 2);

    // center to bottom right center (positive slope outwards)
    midpointLineDrawing(canvas.width / 2, canvas.height / 2, canvas.width, canvas.height * .75);

    // bottom center left to center (negative slope inwards)
    midpointLineDrawing(drawingLeft, canvas.height  * .75, canvas.width / 2, canvas.height / 2);

    // top right to center (negative slope outwards)
    midpointLineDrawing(canvas.width / 2, canvas.height / 2, canvas.width, canvas.height * .25);

    // top center to middle of positive x axis ( so it looks cool )
    midpointLineDrawing(canvas.width / 2, drawingTop, canvas.width * .75, canvas.height / 2);

    // top center to middle of negative x axis ( so it looks cool )
    midpointLineDrawing(canvas.width / 2, drawingTop, canvas.width * .25, canvas.height / 2);

    // bottom center to middle of positive x axis ( so it looks cool )
    midpointLineDrawing(canvas.width / 2, canvas.height, canvas.width * .75, canvas.height / 2);

    // bottom center to middle of negative x axis ( so it looks cool )
    midpointLineDrawing(canvas.width / 2, canvas.height, canvas.width * .25, canvas.height / 2);

    console.log("Drawing high slope lines");
    // center to 13/25 of the way up the right side (negative slope outwards)
    midpointLineDrawing(canvas.width / 2, canvas.height / 2, (canvas.width * 13/25 )  , drawingTop);

    // center to 13/25 of the way down the right side (positive slope outwards)
    midpointLineDrawing(canvas.width / 2, canvas.height / 2, (canvas.width * 13/25) , canvas.height);

    // center to 13/25 of the way up the left side (positive slope inwards)
    midpointLineDrawing((canvas.width * 12/25) , drawingTop, canvas.width / 2, canvas.height / 2);

    // center to 13/25 of the way down the left side (negative slope inwards)
    midpointLineDrawing((canvas.width * 12/25) , canvas.height, canvas.width / 2, canvas.height / 2);


    console.log("Slope 1 tests");
    // slope 1 tests
    // positive slope 1 line outwards
    midpointLineDrawing(canvas.width / 2, canvas.height / 2, (canvas.width / 2 + 100), (canvas.height /2) + 100);

    // positive slope 1 line inwards
    midpointLineDrawing((canvas.width / 2 - 100), (canvas.height /2) - 100, canvas.width / 2, canvas.height / 2);

    // negative slope 1 line outwards
    midpointLineDrawing(canvas.width / 2, canvas.height / 2, (canvas.width / 2 + 100), (canvas.height /2) - 100);
    // negative slope 1 line inwards
    midpointLineDrawing((canvas.width / 2 - 100), (canvas.height /2) + 100, canvas.width / 2, canvas.height / 2);


    gl.bindBuffer(gl.ARRAY_BUFFER, vertexBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, vertices, gl.DYNAMIC_DRAW);
    // unset buffer
    gl.bindBuffer(gl.ARRAY_BUFFER, null);

    draw();
}



function addMousePoint(ev) {
    let translationX = (-2 * drawingLeft / canvas.width) - 1;
    let x = 2 * ev.clientX / canvas.width + translationX;
    let y = 2 * (drawingTop - ev.clientY) / canvas.height + 1;

    console.log("ev.clientX: " + ev.clientX + " ev.clientY: " + ev.clientY);
    console.log("adding " + x + " " + y);
    addPoint(x, y);

    gl.bindBuffer(gl.ARRAY_BUFFER, vertexBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, vertices, gl.STATIC_DRAW);
    // unset buffer
    gl.bindBuffer(gl.ARRAY_BUFFER, null);

    if (lineStart === -2) {
        lineStart = [ev.clientX, ev.clientY];
    }
    else if (lineEnd === -2) {
        lineEnd = [ev.clientX, ev.clientY];
        midpointLineDrawing(lineStart[0], lineStart[1], lineEnd[0], lineEnd[1]);

        draw();

        lineStart = -2;
        lineEnd = -2;
    }

    // draw the new buffer stuff
    draw();
}

// Call init once the webpage has loaded
window.onload = init;