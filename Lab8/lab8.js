document.addEventListener("DOMContentLoaded", function () {
    const canvas = document.getElementById('glCanvas');
    let gl = canvas.getContext('webgl');
    
    if (!gl) {
        console.error('WebGL not supported, falling back on experimental-webgl');
        gl = canvas.getContext('experimental-webgl');
    }
  
    if (!gl) {
        alert('Your browser does not support WebGL');
        return;
    }
  
    // Define shader source codes
    const vertexShaderSource = `
    attribute vec3 a_Vertex;
    attribute vec3 a_Color;
    uniform mat4 u_Scene_transform;
    uniform mat4 u_Camera_model_transform;
    uniform mat4 u_Light_transform;
    varying vec4 v_Vertex_camera_space;
    varying vec4 v_Vertex_shadow_map;
    varying vec3 v_Color;
    void main() {
        v_Vertex_shadow_map = u_Light_transform * vec4(a_Vertex, 1.0);
        v_Vertex_camera_space = u_Camera_model_transform * vec4(a_Vertex, 1.0);
        gl_Position = u_Scene_transform * vec4(a_Vertex, 1.0);
        v_Color = a_Color;
    }
    `;
  
    const fragmentShaderSource = `
    precision mediump float;
    uniform sampler2D u_Shadow_map;
    uniform vec3 u_Light_color;
    varying vec4 v_Vertex_camera_space;
    varying vec4 v_Vertex_shadow_map;
    varying vec3 v_Color;
  
    bool in_shadow(vec4 vertex_relative_to_light, sampler2D shadow_map) {
        vec3 ndc = vertex_relative_to_light.xyz / vertex_relative_to_light.w;
        vec3 percentages = ndc * 0.5 + 0.5;
        vec4 shadow_map_color = texture2D(shadow_map, percentages.xy);
        float shadow_map_distance = shadow_map_color.r;
        return percentages.z > shadow_map_distance + 0.005;
    }
  
    void main() {
        vec3 light_effect = u_Light_color;
        if (in_shadow(v_Vertex_shadow_map, u_Shadow_map)) {
            light_effect *= 0.4; // Make the shadow semi-transparent
        }
        gl_FragColor = vec4(v_Color * light_effect, 1.0);
    }
    `;
  
    // Compile shaders
    function compileShader(gl, source, type) {
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
  
    const vertexShader = compileShader(gl, vertexShaderSource, gl.VERTEX_SHADER);
    const fragmentShader = compileShader(gl, fragmentShaderSource, gl.FRAGMENT_SHADER);
  
    // Link shaders to create program
    const shaderProgram = gl.createProgram();
    gl.attachShader(shaderProgram, vertexShader);
    gl.attachShader(shaderProgram, fragmentShader);
    gl.linkProgram(shaderProgram);
    if (!gl.getProgramParameter(shaderProgram, gl.LINK_STATUS)) {
        console.error('Unable to initialize the shader program: ' + gl.getProgramInfoLog(shaderProgram));
    }
  
    // Use the program
    gl.useProgram(shaderProgram);
  
    // Get attribute and uniform locations
    const vertexPositionAttribute = gl.getAttribLocation(shaderProgram, 'a_Vertex');
    const vertexColorAttribute = gl.getAttribLocation(shaderProgram, 'a_Color');
    gl.enableVertexAttribArray(vertexPositionAttribute);
    gl.enableVertexAttribArray(vertexColorAttribute);
  
    const sceneTransformUniform = gl.getUniformLocation(shaderProgram, 'u_Scene_transform');
    const cameraModelTransformUniform = gl.getUniformLocation(shaderProgram, 'u_Camera_model_transform');
    const lightTransformUniform = gl.getUniformLocation(shaderProgram, 'u_Light_transform');
    const shadowMapUniform = gl.getUniformLocation(shaderProgram, 'u_Shadow_map');
    const lightColorUniform = gl.getUniformLocation(shaderProgram, 'u_Light_color');
  
    // Create buffers
    const vertices = new Float32Array([
        // Ground rectangle (light gray)
        -2.0, -0.5, -2.0,  0.7, 0.7, 0.7,
         2.0, -0.5, -2.0,  0.7, 0.7, 0.7,
         2.0, -0.5,  2.0,  0.7, 0.7, 0.7,
        -2.0, -0.5,  2.0,  0.7, 0.7, 0.7,
  
        // Smaller rectangle 1 (green)
        1.5, -0.5, +0.7,  0.0, 1.0, 0.0,
         -1.5, -0.5, -0.3,  0.0, 1.0, 0.0,
         -1.5,  0.5, -2.2,  0.0, 1.0, 0.0,
        1.5,  0.5, -0.7,  0.0, 1.0, 0.0,
  
        // Smaller rectangle 2 (blue)
        0.5, -0.5,  1.5,  0.0, 0.0, 1.0,
        1.3, -0.5,  1.5,  0.0, 0.0, 1.0,
        1.3,  0.3,  1.5,  0.0, 0.0, 1.0,
        0.5,  0.3,  1.5,  0.0, 0.0, 1.0,
    ]);
  
    const indices = new Uint16Array([
        0, 1, 2, 0, 2, 3,
        4, 5, 6, 4, 6, 7,
        8, 9, 10, 8, 10, 11,
    ]);
  
    const vertexBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, vertexBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, vertices, gl.STATIC_DRAW);
  
    const indexBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, indexBuffer);
    gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, indices, gl.STATIC_DRAW);
  
    // Set up the scene transformations
    const projectionMatrix = mat4.create();
    mat4.perspective(projectionMatrix, Math.PI / 4, canvas.width / canvas.height, 0.1, 100.0);
  
    const viewMatrix = mat4.create();
    mat4.lookAt(viewMatrix, [4, 4, 5], [0, 0, 0], [0, 1, 0]);
  
    const modelMatrix = mat4.create();
  
    const sceneTransform = mat4.create();
    mat4.multiply(sceneTransform, projectionMatrix, viewMatrix);
    mat4.multiply(sceneTransform, sceneTransform, modelMatrix);
  
    // Light transformations
    const lightPosition = [1.30, -0.00, -0.00];
    const lightColor = [1, 1, 1];
    const lightProjectionMatrix = mat4.create();
    mat4.perspective(lightProjectionMatrix, Math.PI / 4, 1.0, 2.1, 100.0);
  
    const lightViewMatrix = mat4.create();
    mat4.lookAt(lightViewMatrix, lightPosition, [-8.0, -4.5, -1.0], [0.0, 1.0, 0.0]);
  
    const lightTransform = mat4.create();
    mat4.multiply(lightTransform, lightProjectionMatrix, lightViewMatrix);
  
    // Set the uniform values
    gl.uniformMatrix4fv(sceneTransformUniform, false, sceneTransform);
    gl.uniformMatrix4fv(cameraModelTransformUniform, false, viewMatrix);
    gl.uniformMatrix4fv(lightTransformUniform, false, lightTransform);
    gl.uniform3fv(lightColorUniform, lightColor);
  
    // Set the shadow map texture
    const shadowMapSize = 1024;
    // Create a renderbuffer for the depth attachment
    const shadowDepthRenderbuffer = gl.createRenderbuffer();
    gl.bindRenderbuffer(gl.RENDERBUFFER, shadowDepthRenderbuffer);
    gl.renderbufferStorage(gl.RENDERBUFFER, gl.DEPTH_COMPONENT16, shadowMapSize, shadowMapSize);
  
    // Create the framebuffer and attach the renderbuffer
    const shadowFramebuffer = gl.createFramebuffer();
    gl.bindFramebuffer(gl.FRAMEBUFFER, shadowFramebuffer);
    gl.framebufferRenderbuffer(gl.FRAMEBUFFER, gl.DEPTH_ATTACHMENT, gl.RENDERBUFFER, shadowDepthRenderbuffer);
  
    const shadowFramebufferStatus = gl.checkFramebufferStatus(gl.FRAMEBUFFER);
    if (shadowFramebufferStatus !== gl.FRAMEBUFFER_COMPLETE) {
        console.error('Framebuffer not complete: ' + shadowFramebufferStatus.toString());
        // Handle the error or try alternative approaches
    }
    gl.bindFramebuffer(gl.FRAMEBUFFER, null);
  
    // Function to render the shadow map
    function renderShadowMap() {
      gl.bindFramebuffer(gl.FRAMEBUFFER, shadowFramebuffer);
      gl.viewport(0, 0, shadowMapSize, shadowMapSize);
      gl.clear(gl.DEPTH_BUFFER_BIT);
  
      // Disable the vertex color attribute for the shadow map rendering pass
      gl.disableVertexAttribArray(vertexColorAttribute);
  
      // Set the light transform for shadow map rendering
      gl.uniformMatrix4fv(lightTransformUniform, false, lightTransform);
  
      gl.bindBuffer(gl.ARRAY_BUFFER, vertexBuffer);
      gl.vertexAttribPointer(vertexPositionAttribute, 3, gl.FLOAT, false, 6 * Float32Array.BYTES_PER_ELEMENT, 0);
      gl.enableVertexAttribArray(vertexPositionAttribute);
      gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, indexBuffer);
      gl.drawElements(gl.TRIANGLES, indices.length, gl.UNSIGNED_SHORT, 0);
  
      gl.bindFramebuffer(gl.FRAMEBUFFER, null);
    }
  
    // Function to render the scene
    function renderScene() {
      gl.viewport(0, 0, canvas.width, canvas.height);
      gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
  
      // Set the scene transform for camera rendering
      gl.uniformMatrix4fv(sceneTransformUniform, false, sceneTransform);
      gl.uniformMatrix4fv(cameraModelTransformUniform, false, viewMatrix);
      gl.uniform1i(shadowMapUniform, 0);
  
      gl.bindBuffer(gl.ARRAY_BUFFER, vertexBuffer);
      gl.vertexAttribPointer(vertexPositionAttribute, 3, gl.FLOAT, false, 6 * Float32Array.BYTES_PER_ELEMENT, 0);
      gl.enableVertexAttribArray(vertexPositionAttribute);
      gl.vertexAttribPointer(vertexColorAttribute, 3, gl.FLOAT, false, 6 * Float32Array.BYTES_PER_ELEMENT, 3 * Float32Array.BYTES_PER_ELEMENT);
      gl.enableVertexAttribArray(vertexColorAttribute);
      gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, indexBuffer);
      gl.drawElements(gl.TRIANGLES, indices.length, gl.UNSIGNED_SHORT, 0);
    }
  
    function render() {
        renderShadowMap();
        renderScene();
        requestAnimationFrame(render);
    }
  
    // Enable depth testing
    gl.enable(gl.DEPTH_TEST);
  
    // Set clear color to black, fully opaque
    gl.clearColor(0.0, 0.0, 0.0, 1.0);
  
    // Start rendering
    render();
  });