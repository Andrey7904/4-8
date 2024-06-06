let lidOpen = false;
const lidOffset = [0.0, 0.6, 0.5];

// Функція для ініціалізації WebGL для куба
function initGL_1() {
    const canvas = document.getElementById('glCanvas');
    const gl = canvas.getContext('webgl');

    const vsSource = `
        attribute vec4 aVertexPosition;
        attribute vec4 aVertexColor;

        uniform mat4 uModelViewMatrix;
        uniform mat4 uProjectionMatrix;

        varying lowp vec4 vColor;

        void main(void) {
            gl_Position = uProjectionMatrix * uModelViewMatrix * aVertexPosition;
            vColor = aVertexColor;
        }
    `;
    const fsSource = `
        varying lowp vec4 vColor;

        void main(void) {
            gl_FragColor = vColor;
        }
    `;

    const shaderProgram = initShaderProgram(gl, vsSource, fsSource);
    const programInfo = {
        program: shaderProgram,
        attribLocations: {
            vertexPosition: gl.getAttribLocation(shaderProgram, 'aVertexPosition'),
            vertexColor: gl.getAttribLocation(shaderProgram, 'aVertexColor'),
        },
        uniformLocations: {
            projectionMatrix: gl.getUniformLocation(shaderProgram, 'uProjectionMatrix'),
            modelViewMatrix: gl.getUniformLocation(shaderProgram, 'uModelViewMatrix'),
        },
    };

    return { gl, programInfo };
}

// Функція для ініціалізації WebGL для кришки
function initGL_2() {
    const canvas = document.getElementById('glCanvas');
    const gl = canvas.getContext('webgl');

    const vsSource = `
        attribute vec4 aVertexPosition;
        attribute vec4 aVertexColor;

        uniform mat4 uModelViewMatrix;
        uniform mat4 uProjectionMatrix;

        varying lowp vec4 vColor;

        void main(void) {
            gl_Position = uProjectionMatrix * uModelViewMatrix * aVertexPosition;
            vColor = aVertexColor;
        }
    `;
    const fsSource = `
        varying lowp vec4 vColor;

        void main(void) {
            gl_FragColor = vColor;
        }
    `;

    const shaderProgram = initShaderProgram(gl, vsSource, fsSource);
    const programInfo = {
        program: shaderProgram,
        attribLocations: {
            vertexPosition: gl.getAttribLocation(shaderProgram, 'aVertexPosition'),
            vertexColor: gl.getAttribLocation(shaderProgram, 'aVertexColor'),
        },
        uniformLocations: {
            projectionMatrix: gl.getUniformLocation(shaderProgram, 'uProjectionMatrix'),
            modelViewMatrix: gl.getUniformLocation(shaderProgram, 'uModelViewMatrix'),
        },
    };

    return { gl, programInfo };
}

// Функція для рендерингу куба
function draw_crate(gl, programInfo, buffers) {
    gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);  // Передня грань
    gl.drawArrays(gl.TRIANGLE_STRIP, 4, 4);  // Задня грань
    gl.drawArrays(gl.TRIANGLE_STRIP, 8, 4);  // Верхня грань
    gl.drawArrays(gl.TRIANGLE_STRIP, 12, 4); // Нижня грань
    gl.drawArrays(gl.TRIANGLE_STRIP, 16, 4); // Права грань
    gl.drawArrays(gl.TRIANGLE_STRIP, 20, 4); // Ліва грань
}

// Функція для рендерингу кришки
function draw_lid(gl, programInfo, buffers) {
    gl.drawArrays(gl.TRIANGLE_STRIP, 24, 4);  // Передня грань кришки
    gl.drawArrays(gl.TRIANGLE_STRIP, 28, 4);  // Задня грань кришки
    gl.drawArrays(gl.TRIANGLE_STRIP, 32, 4);
    gl.drawArrays(gl.TRIANGLE_STRIP, 36, 4);
    gl.drawArrays(gl.TRIANGLE_STRIP, 40, 4);
    gl.drawArrays(gl.TRIANGLE_STRIP, 44, 4);
}

// Функція для ініціалізації буферів
function initBuffers(gl, vertices) {
    const positionBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vertices), gl.STATIC_DRAW);

    const colorBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, colorBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vertices), gl.STATIC_DRAW);

    return {
        position: positionBuffer,
        color: colorBuffer,
    };
}

// Функція для компіляції шейдерів
function initShaderProgram(gl, vsSource, fsSource) {
    const vertexShader = loadShader(gl, gl.VERTEX_SHADER, vsSource);
    const fragmentShader = loadShader(gl, gl.FRAGMENT_SHADER, fsSource);

    const shaderProgram = gl.createProgram();
    gl.attachShader(shaderProgram, vertexShader);
    gl.attachShader(shaderProgram, fragmentShader);
    gl.linkProgram(shaderProgram);

    if (!gl.getProgramParameter(shaderProgram, gl.LINK_STATUS)) {
        console.error('Could not initialize shader program: ', gl.getProgramInfoLog(shaderProgram));
        return null;
    }

    return shaderProgram;
}

// Функція для завантаження шейдерів
function loadShader(gl, type, source) {
    const shader = gl.createShader(type);
    gl.shaderSource(shader, source);
    gl.compileShader(shader);

    if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
        console.error('An error occurred compiling the shaders: ', gl.getShaderInfoLog(shader));
        gl.deleteShader(shader);
        return null;
    }

    return shader;
}

// Функція трансформації для обертання вздовж осі Y
function rotate_Y(matrix, thetaY) {
    mat4.rotate(matrix, matrix, thetaY, [0, 1, 0]);
}

// Функція перспективи
function setPerspective(matrix, fov, aspect, near, far) {
    mat4.perspective(matrix, fov, aspect, near, far);
}

// Функція для передачі атрибутів у шейдери
function passAttribData(gl, data, buffer, loc, size, type, normalized, stride, offset) {
    gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(data), gl.STATIC_DRAW);
    gl.vertexAttribPointer(loc, size, type, normalized, stride, offset);
    gl.enableVertexAttribArray(loc);
}

let crateRotationY = 0;
let lidRotationX = 0;

function render() {
    const crate = initGL_1();
    const lid = initGL_2();

    const vertices = [
        // Вершини куба і кришки (однакові)
        // Передня грань
        -0.5, 0.5, 0.5, 1.0, 0.0, 0.0, 1.0,  // Верхній лівий вершинний
        0.5, 0.5, 0.5, 1.0, 0.0, 0.0, 1.0,   // Верхній правий вершинний
        -0.5, -0.5, 0.5, 1.0, 0.0, 0.0, 1.0,  // Нижній лівий вершинний
        0.5, -0.5, 0.5, 1.0, 0.0, 0.0, 1.0,  // Нижній правий вершинний

        // Задня грань
        -0.5, 0.5, -0.5, 0.0, 1.0, 0.0, 1.0, // Верхній лівий вершинний
        0.5, 0.5, -0.5, 0.0, 1.0, 0.0, 1.0,  // Верхній правий вершинний
        -0.5, -0.5, -0.5, 0.0, 1.0, 0.0, 1.0, // Нижній лівий вершинний
        0.5, -0.5, -0.5, 0.0, 1.0, 0.0, 1.0,  // Нижній правий вершинний

        // Верхня грань
        -0.5, 0.5, -0.5, 0.0, 0.0, 1.0, 1.0, // Верхній лівий вершинний
        0.5, 0.5, -0.5, 0.0, 0.0, 1.0, 1.0,  // Верхній правий вершинний
        -0.5, 0.5, 0.5, 0.0, 0.0, 1.0, 1.0, // Нижній лівий вершинний
        0.5, 0.5, 0.5, 0.0, 0.0, 1.0, 1.0,  // Нижній правий вершинний

        // Нижня грань
        -0.5, -0.5, -0.5, 1.0, 1.0, 0.0, 1.0, // Верхній лівий вершинний
        0.5, -0.5, -0.5, 1.0, 1.0, 0.0, 1.0,  // Верхній правий вершинний
        -0.5, -0.5, 0.5, 1.0, 1.0, 0.0, 1.0, // Нижній лівий вершинний
        0.5, -0.5, 0.5, 1.0, 1.0, 0.0, 1.0,  // Нижній правий вершинний

        // Права грань
        0.5, 0.5, -0.5, 1.0, 0.0, 1.0, 1.0, // Верхній лівий вершинний
        0.5, 0.5, 0.5, 1.0, 0.0, 1.0, 1.0,  // Верхній правий вершинний
        0.5, -0.5, -0.5, 1.0, 0.0, 1.0, 1.0, // Нижній лівий вершинний
        0.5, -0.5, 0.5, 1.0, 0.0, 1.0, 1.0,  // Нижній правий вершинний

        // Ліва грань
        -0.5, 0.5, -0.5, 0.0, 1.0, 1.0, 1.0, // Верхній лівий вершинний
        -0.5, 0.5, 0.5, 0.0, 1.0, 1.0, 1.0,  // Верхній правий вершинний
        -0.5, -0.5, -0.5, 0.0, 1.0, 1.0, 1.0, // Нижній лівий вершинний
        -0.5, -0.5, 0.5, 0.0, 1.0, 1.0, 1.0,  // Нижній правий вершинний

        // Передня грань кришки
        -0.5, 0.6, 0.5, 1.0, 0.5, 0.0, 1.0,  // Верхній лівий вершинний кришки
        0.5, 0.6, 0.5, 1.0, 0.5, 0.0, 1.0,  // Верхній правий вершинний кришки
        -0.5, 0.6, -0.5, 1.0, 0.5, 0.0, 1.0, // Нижній лівий вершинний кришки
        0.5, 0.6, -0.5, 1.0, 0.5, 0.0, 1.0,  // Нижній правий вершинний кришки
        // Задня грань кришки
        -0.5, 0.5, 0.5, 0.5, 1.0, 0.0, 1.0,  // Верхній лівий вершинний кришки
        0.5, 0.5, 0.5, 0.5, 1.0, 0.0, 1.0,  // Верхній правий вершинний кришки
        -0.5, 0.5, -0.5, 0.5, 1.0, 0.0, 1.0, // Нижній лівий вершинний кришки
        0.5, 0.5, -0.5, 0.5, 1.0, 0.0, 1.0,  // Нижній правий вершинний кришки
        // Верхня грань кришки
        -0.5, 0.6, -0.5, 1.0, 1.0, 1.0, 1.0,  // Верхній лівий вершинний кришки
        0.5, 0.6, -0.5, 1.0, 1.0, 1.0, 1.0,  // Верхній правий вершинний кришки
        -0.5, 0.5, -0.5, 1.0, 1.0, 1.0, 1.0,  // Нижній лівий вершинний кришки
        0.5, 0.5, -0.5, 1.0, 1.0, 1.0, 1.0,  // Нижній правий вершинний кришки
        // Нижня грань кришки
        -0.5, 0.6, 0.5, 0.3, 0.7, 1.0, 1.0,  // Верхній лівий вершинний кришки
        0.5, 0.6, 0.5, 0.3, 0.7, 1.0, 1.0,  // Верхній правий вершинний кришки
        -0.5, 0.5, 0.5, 0.3, 0.7, 1.0, 1.0,  // Нижній лівий вершинний кришки
        0.5, 0.5, 0.5, 0.3, 0.7, 1.0, 1.0,  // Нижній правий вершинний кришки
        // Права грань кришки
        0.5, 0.6, 0.5, 0.7, 0.3, 1.0, 1.0,  // Верхній лівий вершинний кришки
        0.5, 0.6, -0.5, 0.7, 0.3, 1.0, 1.0,  // Верхній правий вершинний кришки
        0.5, 0.5, 0.5, 0.7, 0.3, 1.0, 1.0,  // Нижній лівий вершинний кришки
        0.5, 0.5, -0.5, 0.7, 0.3, 1.0, 1.0,  // Нижній правий вершинний кришки
        // Ліва грань кришки
        -0.5, 0.6, 0.5, 1.0, 1.0, 0.0, 1.0,  // Верхній лівий вершинний кришки
        -0.5, 0.6, -0.5, 1.0, 1.0, 0.0, 1.0,  // Верхній правий вершинний кришки
        -0.5, 0.5, 0.5, 1.0, 1.0, 0.0, 1.0,  // Нижній лівий вершинний кришки
        -0.5, 0.5, -0.5, 1.0, 1.0, 0.0, 1.0,  // Нижній правий вершинний кришки
    ];

    const buffers = initBuffers(crate.gl, vertices);

    const fieldOfView = 45 * Math.PI / 180;
    const aspect = crate.gl.canvas.clientWidth / crate.gl.canvas.clientHeight;
    const zNear = 0.1;
    const zFar = 100.0;
    const projectionMatrix = mat4.create();

    setPerspective(projectionMatrix, fieldOfView, aspect, zNear, zFar);

    const modelViewMatrix = mat4.create();
    mat4.translate(modelViewMatrix, modelViewMatrix, [0.0, 0.0, -6.0]);
    mat4.rotate(modelViewMatrix, modelViewMatrix, Math.PI / 6, [1, 0, 0]);
    rotate_Y(modelViewMatrix, crateRotationY);

    crate.gl.clearColor(0.0, 0.0, 0.0, 1.0);
    crate.gl.clearDepth(1.0);
    crate.gl.enable(crate.gl.DEPTH_TEST);
    crate.gl.depthFunc(crate.gl.LEQUAL);
    crate.gl.clear(crate.gl.COLOR_BUFFER_BIT | crate.gl.DEPTH_BUFFER_BIT);

    passAttribData(crate.gl, vertices, buffers.position, crate.programInfo.attribLocations.vertexPosition, 3, crate.gl.FLOAT, false, 28, 0);
    passAttribData(crate.gl, vertices, buffers.color, crate.programInfo.attribLocations.vertexColor, 4, crate.gl.FLOAT, false, 28, 12);

    crate.gl.useProgram(crate.programInfo.program);
    crate.gl.uniformMatrix4fv(crate.programInfo.uniformLocations.projectionMatrix, false, projectionMatrix);
    crate.gl.uniformMatrix4fv(crate.programInfo.uniformLocations.modelViewMatrix, false, modelViewMatrix);

    draw_crate(crate.gl, crate.programInfo, buffers);

    lid.gl.clearColor(0.0, 0.0, 0.0, 1.0);
    lid.gl.clearDepth(1.0);
    lid.gl.enable(lid.gl.DEPTH_TEST);
    lid.gl.depthFunc(lid.gl.LEQUAL);

    passAttribData(lid.gl, vertices, buffers.position, lid.programInfo.attribLocations.vertexPosition, 3, lid.gl.FLOAT, false, 28, 0);
    passAttribData(lid.gl, vertices, buffers.color, lid.programInfo.attribLocations.vertexColor, 4, lid.gl.FLOAT, false, 28, 12);

    lid.gl.useProgram(lid.programInfo.program);
    lid.gl.uniformMatrix4fv(lid.programInfo.uniformLocations.projectionMatrix, false, projectionMatrix);

    const lidModelViewMatrix = mat4.create();
    mat4.translate(lidModelViewMatrix, lidModelViewMatrix, [0.0, 0.0, -6.0]);
    mat4.rotate(lidModelViewMatrix, lidModelViewMatrix, Math.PI / 6, [1, 0, 0]);
    rotate_Y(lidModelViewMatrix, crateRotationY); // Apply crate rotation around Y axis first
    mat4.translate(lidModelViewMatrix, lidModelViewMatrix, [0.0, 0.5, 0.5]);
    mat4.rotate(lidModelViewMatrix, lidModelViewMatrix, lidRotationX, [1, 0, 0]); // Apply lid rotation around X axis
    mat4.translate(lidModelViewMatrix, lidModelViewMatrix, [0.0, -0.5, -0.5]);

    lid.gl.uniformMatrix4fv(lid.programInfo.uniformLocations.modelViewMatrix, false, lidModelViewMatrix);

    draw_lid(lid.gl, lid.programInfo, buffers);

    requestAnimationFrame(render);
}

// Обробка натискання клавіш
document.addEventListener('keydown', function(event) {
    if (event.key === "ArrowLeft") {
        crateRotationY -= Math.PI / 36;
    } else if (event.key === "ArrowRight") {
        crateRotationY += Math.PI / 36;
    } else if (event.key === "ArrowUp") {
        if (lidRotationX < Math.PI / 2) {
            lidRotationX += Math.PI / 36;
        }
    } else if (event.key === "ArrowDown") {
        if (lidRotationX > 0) {
            lidRotationX -= Math.PI / 36;
        }
    }
});

render();
