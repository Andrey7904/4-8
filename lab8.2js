window.onload = function() {
    const canvas = document.getElementById('glCanvas');
    const gl = canvas.getContext('webgl');

    if (!gl) {
        console.error('Unable to initialize WebGL. Your browser may not support it.');
        return;
    }

    // Vertex shader program for shadow map
    const vsShadowSource = `
        attribute vec4 aVertexPosition;
        uniform mat4 uLightMatrix;

        void main(void) {
            gl_Position = uLightMatrix * aVertexPosition;
        }
    `;

    // Fragment shader program for shadow map
    const fsShadowSource = `
        precision highp float;

        void main(void) {
            gl_FragColor = vec4(gl_FragCoord.z, gl_FragCoord.z, gl_FragCoord.z, 1.0);
        }
    `;

    // Vertex shader program for scene
    const vsSceneSource = `
        attribute vec4 aVertexPosition;
        attribute vec4 aVertexColor;

        uniform mat4 uModelViewMatrix;
        uniform mat4 uProjectionMatrix;
        uniform mat4 uLightMatrix;

        varying lowp vec4 vColor;
        varying vec4 vShadowCoord;

        void main(void) {
            gl_Position = uProjectionMatrix * uModelViewMatrix * aVertexPosition;
            vColor = aVertexColor;
            vShadowCoord = uLightMatrix * aVertexPosition;
        }
    `;

    // Fragment shader program for scene
    const fsSceneSource = `
        precision lowp float;
        precision lowp int;

        varying lowp vec4 vColor;
        varying vec4 vShadowCoord;

        uniform sampler2D uShadowMap;
        uniform vec3 uLightPosition;
        uniform mat4 uViewMatrix; // Add viewMatrix uniform

        void main(void) {
            vec3 shadowCoord = vShadowCoord.xyz / vShadowCoord.w;
            shadowCoord = shadowCoord * 0.5 + 0.5;
            
            float shadow = 0.0;
            float distance = texture2D(uShadowMap, shadowCoord.xy).r;
            if (shadowCoord.z > distance) {
                shadow = 0.5;
            }
            
            gl_FragColor = vec4(vColor.rgb * (1.0 - shadow), vColor.a);
        }
    `;

    let rotationX = 0;
    let rotationY = 0;
    let cameraPosition = [5, 5, 5];
    let cameraTarget = [0, 0, 0];
    const shadowShaderProgram = initShaderProgram(gl, vsShadowSource, fsShadowSource);
    const sceneShaderProgram = initShaderProgram(gl, vsSceneSource, fsSceneSource);

    const shadowProgramInfo = {
        program: shadowShaderProgram,
        attribLocations: {
            vertexPosition: gl.getAttribLocation(shadowShaderProgram, 'aVertexPosition'),
        },
        uniformLocations: {
            lightMatrix: gl.getUniformLocation(shadowShaderProgram, 'uLightMatrix'),
        },
    };

    const sceneProgramInfo = {
        program: sceneShaderProgram,
        attribLocations: {
            vertexPosition: gl.getAttribLocation(sceneShaderProgram, 'aVertexPosition'),
            vertexColor: gl.getAttribLocation(sceneShaderProgram, 'aVertexColor'),
        },
        uniformLocations: {
            projectionMatrix: gl.getUniformLocation(sceneShaderProgram, 'uProjectionMatrix'),
            modelViewMatrix: gl.getUniformLocation(sceneShaderProgram, 'uModelViewMatrix'),
            lightMatrix: gl.getUniformLocation(sceneShaderProgram, 'uLightMatrix'),
            shadowMap: gl.getUniformLocation(sceneShaderProgram, 'uShadowMap'),
        },
    };

    const buffers = initBuffers(gl);

    const shadowFramebuffer = initFramebuffer(gl);

    drawScene(gl, shadowFramebuffer, shadowProgramInfo, sceneProgramInfo, buffers);

    function initShaderProgram(gl, vsSource, fsSource) {
        const vertexShader = loadShader(gl, gl.VERTEX_SHADER, vsSource);
        const fragmentShader = loadShader(gl, gl.FRAGMENT_SHADER, fsSource);

        const shaderProgram = gl.createProgram();
        gl.attachShader(shaderProgram, vertexShader);
        gl.attachShader(shaderProgram, fragmentShader);
        gl.linkProgram(shaderProgram);

        if (!gl.getProgramParameter(shaderProgram, gl.LINK_STATUS)) {
            console.error('Unable to initialize the shader program: ' + gl.getProgramInfoLog(shaderProgram));
            return null;
        }
        return shaderProgram;
    }

    function loadShader(gl, type, source) {
        const shader = gl.createShader(type);

        gl.shaderSource(shader, source);
        gl.compileShader(shader);

        if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
            console.error('An error occurred compiling the shaders: ' + gl.getShaderInfoLog(shader));
            gl.deleteShader(shader);
            return null;
        }
        return shader;
    }

    function initBuffers(gl) {
        const positionBuffer = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);

        const positions = [
            // Ground
            -3.0, -2.5, 0.0,
             2.0, -2.5, 0.0,
             2.0,  1.5, 0.0,
            -3.0,  1.5, 0.0,
            // Smaller rectangle 1
            -1.5, -0.5, 0.1,
            -0.3, -0.5, 0.1,
            -0.3, 0.1, 0.1,
            -1.5, 0.1, 0.1,
        ];

        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(positions), gl.STATIC_DRAW);

        const faceColors = [
            [0.0, 1.0, 0.0, 1.0],    // Ground: green
            [1.0, 0.0, 0.0, 1.0],    // Smaller rectangle: red
        ];

        var colors = [];

        for (var j = 0; j < faceColors.length; ++j) {
            const c = faceColors[j];
            colors = colors.concat(c, c, c, c);
        }

        const colorBuffer = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, colorBuffer);
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(colors), gl.STATIC_DRAW);

        const indexBuffer = gl.createBuffer();
        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, indexBuffer);

        const indices = [
            0, 1, 2,      0, 2, 3,    // ground
            4, 5, 6,      4, 6, 7,    // smaller rectangle
        ];

        gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(indices), gl.STATIC_DRAW);

        return {
            position: positionBuffer,
            color: colorBuffer,
            indices: indexBuffer,
        };
    }

    function initFramebuffer(gl) {
        const framebuffer = gl.createFramebuffer();
        gl.bindFramebuffer(gl.FRAMEBUFFER, framebuffer);
    
        const texture = gl.createTexture();
        gl.bindTexture(gl.TEXTURE_2D, texture);
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.DEPTH_COMPONENT16, canvas.width, canvas.height, 0, gl.DEPTH_COMPONENT, gl.UNSIGNED_SHORT, null);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    
        gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.DEPTH_ATTACHMENT, gl.TEXTURE_2D, texture, 0);
        gl.bindTexture(gl.TEXTURE_2D, null);
        gl.bindFramebuffer(gl.FRAMEBUFFER, null);
    
        return {
            framebuffer: framebuffer,
            texture: texture,
        };
    }

    function drawScene(gl, shadowFramebuffer, shadowProgramInfo, sceneProgramInfo, buffers) {
        const fieldOfView = 45 * Math.PI / 180;
        const aspect = gl.canvas.clientWidth / gl.canvas.clientHeight;
        const zNear = 0.1;
        const zFar = 100.0;
    
        const lightPosition = [0.5, 0.0, 0.0];
        const lightMatrix = mat4.create();
        mat4.perspective(lightMatrix, fieldOfView, aspect, zNear, zFar);
        mat4.lookAt(lightMatrix, lightPosition, [0.3, 0.1, 0.3], [0, 1, 0]);
    
        // Render to shadow map
        gl.bindFramebuffer(gl.FRAMEBUFFER, shadowFramebuffer.framebuffer);
        gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);
        gl.clear(gl.DEPTH_BUFFER_BIT);
    
        gl.useProgram(shadowProgramInfo.program);
    
        gl.bindBuffer(gl.ARRAY_BUFFER, buffers.position);
        gl.vertexAttribPointer(
            shadowProgramInfo.attribLocations.vertexPosition,
            3, gl.FLOAT, false, 0, 0);
        gl.enableVertexAttribArray(shadowProgramInfo.attribLocations.vertexPosition);
    
        gl.uniformMatrix4fv(
            shadowProgramInfo.uniformLocations.lightMatrix,
            false, lightMatrix);
        
        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, buffers.indices);
        gl.drawElements(gl.TRIANGLES, 12, gl.UNSIGNED_SHORT, 0);
        
        // Render scene
        gl.bindFramebuffer(gl.FRAMEBUFFER, null);
        gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);
        gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
        
        const projectionMatrix = mat4.create();
        mat4.perspective(projectionMatrix, fieldOfView, aspect, zNear, zFar);
        
        const viewMatrix = mat4.create();
        gl.uniformMatrix4fv(
            sceneProgramInfo.uniformLocations.viewMatrix,
            false, viewMatrix);
        
        mat4.lookAt(viewMatrix, cameraPosition, cameraTarget, [10, 10, 0]); // Update lookAt to use cameraPosition and cameraTarget
        
        const modelViewMatrix = mat4.create();
        mat4.translate(modelViewMatrix, modelViewMatrix, [-0.0, 0.0, -6.0]);
        
        gl.useProgram(sceneProgramInfo.program);
        
        gl.bindBuffer(gl.ARRAY_BUFFER, buffers.position);
        gl.vertexAttribPointer(
            sceneProgramInfo.attribLocations.vertexPosition,
            3, gl.FLOAT, false, 0, 0);
        gl.enableVertexAttribArray(sceneProgramInfo.attribLocations.vertexPosition);
        
        gl.bindBuffer(gl.ARRAY_BUFFER, buffers.color);
        gl.vertexAttribPointer(
            sceneProgramInfo.attribLocations.vertexColor,
            4, gl.FLOAT, false, 0, 0);
        gl.enableVertexAttribArray(sceneProgramInfo.attribLocations.vertexColor);
        
        gl.uniformMatrix4fv(
            sceneProgramInfo.uniformLocations.projectionMatrix,
            false, projectionMatrix);
        gl.uniformMatrix4fv(
            sceneProgramInfo.uniformLocations.viewMatrix, // Pass the viewMatrix to the shader
            false, viewMatrix);
        gl.uniformMatrix4fv(
            sceneProgramInfo.uniformLocations.modelViewMatrix,
            false, modelViewMatrix);
        gl.uniformMatrix4fv(
            sceneProgramInfo.uniformLocations.lightMatrix,
            false, lightMatrix);
        gl.uniform1i(sceneProgramInfo.uniformLocations.shadowMap, 0);
        
        gl.activeTexture(gl.TEXTURE0);
        gl.bindTexture(gl.TEXTURE_2D, shadowFramebuffer.texture);
        
        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, buffers.indices);
        gl.drawElements(gl.TRIANGLES, 12, gl.UNSIGNED_SHORT, 0);
    }
    

    function updateCamera() {
        const speed = 0.1;
        document.addEventListener('keydown', function(event) {
            switch(event.key.toLowerCase()) {
                case 'w':
                    cameraPosition[2] -= speed;
                    break;
                case 'a':
                    cameraPosition[0] -= speed;
                    break;
                case 's':
                    cameraPosition[2] += speed;
                    break;
                case 'd':
                    cameraPosition[0] += speed;
                    break;
            }
        });
    }
    

    updateCamera();
}
