// --- WebGL Dark Veil Effect ---
function initDarkVeil() {
  const canvas = document.getElementById('veil-canvas');
  if (!canvas) return;

  const gl = canvas.getContext('webgl');
  if (!gl) {
    console.error('WebGL is not supported.');
    return;
  }

  const vertexShaderSource = `
      attribute vec2 position;
      void main() {
          gl_Position = vec4(position, 0.0, 1.0);
      }
  `;

  const fragmentShaderSource = `
      #ifdef GL_ES
      precision lowp float;
      #endif
      uniform vec2 uResolution;
      uniform float uTime;
      uniform float uHueShift;
      uniform float uNoise;
      uniform float uScan;
      uniform float uScanFreq;
      uniform float uWarp;
      #define iTime uTime
      #define iResolution uResolution

      vec4 buf[8];
      float rand(vec2 c){return fract(sin(dot(c,vec2(12.9898,78.233)))*43758.5453);}

      mat3 rgb2yiq=mat3(0.299,0.587,0.114,0.596,-0.274,-0.322,0.211,-0.523,0.312);
      mat3 yiq2rgb=mat3(1.0,0.956,0.621,1.0,-0.272,-0.647,1.0,-1.106,1.703);

      vec3 hueShiftRGB(vec3 col,float deg){
          vec3 yiq=rgb2yiq*col;
          float rad=radians(deg);
          float cosh=cos(rad),sinh=sin(rad);
          vec3 yiqShift=vec3(yiq.x,yiq.y*cosh-yiq.z*sinh,yiq.y*sinh+yiq.z*cosh);
          return clamp(yiq2rgb*yiqShift,0.0,1.0);
      }

      vec4 sigmoid(vec4 x){return 1./(1.+exp(-x));}

      vec4 cppn_fn(vec2 coordinate,float in0,float in1,float in2){
          buf[6]=vec4(coordinate.x,coordinate.y,0.3948333106474662+in0,0.36+in1);
          buf[7]=vec4(0.14+in2,sqrt(coordinate.x*coordinate.x+coordinate.y*coordinate.y),0.,0.);
          buf[0]=mat4(vec4(6.5404263,-3.6126034,0.7590882,-1.13613),vec4(2.4582713,3.1660357,1.2219609,0.06276096),vec4(-5.478085,-6.159632,1.8701609,-4.7742867),vec4(6.039214,-5.542865,-0.90925294,3.251348))*buf[6]+mat4(vec4(0.8473259,-5.722911,3.975766,1.6522468),vec4(-0.24321538,0.5839259,-1.7661959,-5.350116),vec4(0.,0.,0.,0.),vec4(0.,0.,0.,0.))*buf[7]+vec4(0.21808943,1.1243913,-1.7969975,5.0294676);
          buf[1]=mat4(vec4(-3.3522482,-6.0612736,0.55641043,-4.4719114),vec4(0.8631464,1.7432913,5.643898,1.6106541),vec4(2.4941394,-3.5012043,1.7184316,6.357333),vec4(3.310376,8.209261,1.1355612,-1.165539))*buf[6]+mat4(vec4(5.24046,-13.034365,0.009859298,15.870829),vec4(2.987511,3.129433,-0.89023495,-1.6822904),vec4(0.,0.,0.,0.),vec4(0.,0.,0.,0.))*buf[7]+vec4(-5.9457836,-6.573602,-0.8812491,1.5436668);
          buf[0]=sigmoid(buf[0]);buf[1]=sigmoid(buf[1]);
          buf[2]=mat4(vec4(-15.219568,8.095543,-2.429353,-1.9381982),vec4(-5.951362,4.3115187,2.6393783,1.274315),vec4(-7.3145227,6.7297835,5.2473326,5.9411426),vec4(5.0796127,8.979051,-1.7278991,-1.158976))*buf[6]+mat4(vec4(-11.967154,-11.608155,6.1486754,11.237008),vec4(2.124141,-6.263192,-1.7050359,-0.7021966),vec4(0.,0.,0.,0.),vec4(0.,0.,0.,0.))*buf[7]+vec4(-4.17164,-3.2281182,-4.576417,-3.6401186);
          buf[3]=mat4(vec4(3.1832156,-13.738922,1.879223,3.233465),vec4(0.64300746,12.768129,1.9141049,0.50990224),vec4(-0.049295485,4.4807224,1.4733979,1.801149),vec4(5.0039253,13.000481,3.3991797,-4.5561905))*buf[6]+mat4(vec4(-0.1285731,7.720628,-3.1425676,4.742367),vec4(0.6393625,3.714393,-0.8108378,-0.39174938),vec4(0.,0.,0.,0.),vec4(0.,0.,0.,0.))*buf[7]+vec4(-1.1811101,-21.621881,0.7851888,1.2329718);
          buf[2]=sigmoid(buf[2]);buf[3]=sigmoid(buf[3]);
          buf[4]=mat4(vec4(5.214916,-7.183024,2.7228765,2.6592617),vec4(-5.601878,-25.3591,4.067988,0.4602802),vec4(-10.57759,24.286327,21.102104,37.546658),vec4(4.3024497,-1.9625226,2.3458803,-1.372816))*buf[0]+mat4(vec4(-17.6526,-10.507558,2.2587414,12.462782),vec4(6.265566,-502.75443,-12.642513,0.9112289),vec4(-10.983244,20.741234,-9.701768,-0.7635988),vec4(5.383626,1.4819539,-4.1911616,-4.8444734))*buf[1]+mat4(vec4(12.785233,-16.345072,-0.39901125,1.7955981),vec4(-30.48365,-1.8345358,1.4542528,-1.1118771),vec4(19.872723,-7.337935,-42.941723,-98.52709),vec4(8.337645,-2.7312303,-2.2927687,-36.142323))*buf[2]+mat4(vec4(-16.298317,3.5471997,-0.44300047,-9.444417),vec4(57.5077,-35.609753,16.163465,-4.1534753),vec4(-0.07470326,-3.8656476,-7.0901804,3.1523974),vec4(-12.559385,-7.077619,1.490437,-0.8211543))*buf[3]+vec4(-7.67914,15.927437,1.3207729,-1.6686112);
          buf[5]=mat4(vec4(-1.4109162,-0.372762,-3.770383,-21.367174),vec4(-6.2103205,-9.35908,0.92529047,8.82561),vec4(11.460242,-22.348068,13.625772,-18.693201),vec4(-0.3429052,-3.9905605,-2.4626114,-0.45033523))*buf[0]+mat4(vec4(7.3481627,-4.3661838,-6.3037653,-3.868115),vec4(1.5462853,6.5488915,1.9701879,-0.58291394),vec4(6.5858274,-2.2180402,3.7127688,-1.3730392),vec4(-5.7973905,10.134961,-2.3395722,-5.965605))*buf[1]+mat4(vec4(-2.5132585,-6.6685553,-1.4029363,-0.16285264),vec4(-0.37908727,0.53738135,4.389061,-1.3024765),vec4(-0.70647055,2.0111287,-5.1659346,-3.728635),vec4(-13.562562,10.487719,-0.9173751,-2.6487076))*buf[2]+mat4(vec4(-8.645013,6.5546675,-6.3944063,-5.5933375),vec4(-0.57783127,-1.077275,36.91025,5.736769),vec4(14.283112,3.7146652,7.1452246,-4.5958776),vec4(2.7192075,3.6021907,-4.366337,-2.3653464))*buf[3]+mat4(vec4(3.4992442,-196.91893,-8.923708,2.8142626),vec4(3.4806502,-3.1846354,5.1725626,5.1804223),vec4(-2.4009497,15.585794,1.2863957,2.0252278),vec4(-71.25271,-62.441242,-8.138444,0.50670296))*buf[4]+mat4(vec4(-12.291733,-11.176166,-7.3474145,4.390294),vec4(10.805477,5.6337385,-0.9385842,-4.7348723),vec4(-12.869276,-7.039391,5.3029537,7.5436664),vec4(1.4593618,8.91898,3.5101583,5.840625))*buf[5]+vec4(2.2415268,-6.705987,-0.98861027,-2.117676);
          buf[4]=sigmoid(buf[4]);buf[5]=sigmoid(buf[5]);
          buf[6]=mat4(vec4(-1.61102,0.7970257,1.4675229,0.20917463),vec4(-28.793737,-7.1390953,1.5025433,4.656581),vec4(-10.94861,39.66238,0.74318546,-10.095605),vec4(-0.7229728,-1.5483948,0.7301322,2.1687684))*buf[0]+mat4(vec4(3.2547753,21.489103,-1.0194173,-3.3100595),vec4(-3.7316632,-3.3792162,-7.223193,-0.23685838),vec4(13.1804495,0.7916005,5.338587,5.687114),vec4(-4.167605,-17.798311,-6.815736,-1.6451967))*buf[1]+mat4(vec4(0.604885,-7.800309,-7.213122,-2.741014),vec4(-3.522382,-0.12359311,-0.5258442,0.43852118),vec4(9.6752825,-22.853785,2.062431,0.099892326),vec4(-4.3196306,-17.730087,2.5184598,5.30267))*buf[2]+mat4(vec4(-6.545563,-15.790176,-6.0438633,-5.415399),vec4(-43.591583,28.551912,-16.00161,18.84728),vec4(4.212382,8.394307,3.0958717,8.657522),vec4(-5.0237565,-4.450633,-4.4768,-5.5010443))*buf[3]+mat4(vec4(1.6985557,-67.05806,6.897715,1.9004834),vec4(1.8680354,2.3915145,2.5231109,4.081538),vec4(11.158006,1.7294737,2.0738268,7.386411),vec4(-4.256034,-306.24686,8.258898,-17.132736))*buf[4]+mat4(vec4(1.6889864,-4.5852966,3.8534803,-6.3482175),vec4(1.3543309,-1.2640043,9.932754,2.9079645),vec4(-5.2770967,0.07150358,-0.13962056,3.3269649),vec4(28.34703,-4.918278,6.1044083,4.085355))*buf[5]+vec4(6.6818056,12.522166,-3.7075126,-4.104386);
          buf[7]=mat4(vec4(-8.265602,-4.7027016,5.098234,0.7509808),vec4(8.6507845,-17.15949,16.51939,-8.884479),vec4(-4.036479,-2.3946867,-2.6055532,-1.9866527),vec4(-2.2167742,-1.8135649,-5.9759874,4.8846445))*buf[0]+mat4(vec4(6.7790847,3.5076547,-2.8191125,-2.7028968),vec4(-5.743024,-0.27844876,1.4958696,-5.0517144),vec4(13.122226,15.735168,-2.9397483,-4.101023),vec4(-14.375265,-5.030483,-6.2599335,2.9848232))*buf[1]+mat4(vec4(4.0950394,-0.94011575,-5.674733,4.755022),vec4(4.3809423,4.8310084,1.7425908,-3.437416),vec4(2.117492,0.16342592,-104.56341,16.949184),vec4(-5.22543,-2.994248,3.8350096,-1.9364246))*buf[2]+mat4(vec4(-5.900337,1.7946124,-13.604192,-3.8060522),vec4(6.6583457,31.911177,25.164474,91.811147),vec4(11.840538,4.1503043,-0.7314397,6.768467),vec4(-6.3967767,4.034772,6.1714606,-0.32874924))*buf[3]+mat4(vec4(3.4992442,-196.91893,-8.923708,2.8142626),vec4(3.4806502,-3.1846354,5.1725626,5.1804223),vec4(-2.4009497,15.585794,1.2863957,2.0252278),vec4(-71.25271,-62.441242,-8.138444,0.50670296))*buf[4]+mat4(vec4(-12.291733,-11.176166,-7.3474145,4.390294),vec4(10.805477,5.6337385,-0.9385842,-4.7348723),vec4(-12.869276,-7.039391,5.3029537,7.5436664),vec4(1.4593618,8.91898,3.5101583,5.840625))*buf[5]+vec4(2.2415268,-6.705987,-0.98861027,-2.117676);
          buf[6]=sigmoid(buf[6]);buf[7]=sigmoid(buf[7]);
          buf[0]=mat4(vec4(1.6794263,1.3817469,2.9625452,0.),vec4(-1.8834411,-1.4806935,-3.5924516,0.),vec4(-1.3279216,-1.0918057,-2.3124623,0.),vec4(0.2662234,0.23235129,0.44178495,0.))*buf[0]+mat4(vec4(-0.6299101,-0.5945583,-0.9125601,0.),vec4(0.17828953,0.18300213,0.18182953,0.),vec4(-2.96544,-2.5819945,-4.9001055,0.),vec4(1.4195864,1.1868085,2.5176322,0.))*buf[1]+mat4(vec4(-1.2584374,-1.0552157,-2.1688404,0.),vec4(-0.7200217,-0.52666044,-1.438251,0.),vec4(0.15345335,0.15196142,0.272854,0.),vec4(0.945728,0.8861938,1.2766753,0.))*buf[2]+mat4(vec4(-2.4218085,-1.968602,-4.35166,0.),vec4(-22.683098,-18.0544,-41.954372,0.),vec4(0.63792,0.5470648,1.1078634,0.),vec4(-1.5489894,-1.3075932,-2.6444845,0.))*buf[3]+mat4(vec4(-0.49252132,-0.39877754,-0.91366625,0.),vec4(0.95609266,0.7923952,1.640221,0.),vec4(0.30616966,0.15693925,0.8639857,0.),vec4(1.1825981,0.94504964,2.176963,0.))*buf[4]+mat4(vec4(0.35446745,0.3293795,0.59547555,0.),vec4(-0.58784515,-0.48177817,-1.0614829,0.),vec4(2.5271258,1.9991658,4.6846647,0.),vec4(0.13042648,0.08864098,0.30187556,0.))*buf[5]+mat4(vec4(-1.7718065,-1.4033192,-3.3355875,0.),vec4(3.1664357,2.638297,5.378702,0.),vec4(-3.1724713,-2.6107926,-5.549295,0.),vec4(-2.851368,-2.249092,-5.3013067,0.))*buf[6]+mat4(vec4(1.5203838,1.2212278,2.8404984,0.),vec4(1.5210563,1.2651345,2.683903,0.),vec4(2.9789467,2.4364579,5.2347264,0.),vec4(2.2270417,1.8825914,3.8028636,0.))*buf[7]+vec4(-1.5468478,-3.6171484,0.24762098,0.);
          buf[0]=sigmoid(buf[0]);
          return vec4(buf[0].x,buf[0].y,buf[0].z,1.);
      }

      void mainImage(out vec4 fragColor,in vec2 fragCoord){
          vec2 uv=fragCoord/uResolution.xy*2.-1.;
          uv.y*=-1.;
          uv *= 0.7;
          uv += vec2(0.5, -0.4);
          uv+=uWarp*vec2(sin(uv.y*6.283+uTime*0.5),cos(uv.x*6.283+uTime*0.5))*0.05;
          fragColor=cppn_fn(uv,0.1*sin(0.3*uTime),0.1*sin(0.69*uTime),0.1*sin(0.44*uTime));
      }

      void main(){
          vec4 col;mainImage(col,gl_FragCoord.xy);
          col.rgb=hueShiftRGB(col.rgb,uHueShift);
          float scanline_val=sin(gl_FragCoord.y*uScanFreq)*0.5+0.5;
          col.rgb*=1.-(scanline_val*scanline_val)*uScan;
          col.rgb+=(rand(gl_FragCoord.xy+uTime)-0.5)*uNoise;
          gl_FragColor=vec4(clamp(col.rgb,0.0,1.0),1.0);
      }
  `;

  function compileShader(gl, type, source) {
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

  const vertexShader = compileShader(gl, gl.VERTEX_SHADER, vertexShaderSource);
  const fragmentShader = compileShader(gl, gl.FRAGMENT_SHADER, fragmentShaderSource);

  const program = gl.createProgram();
  gl.attachShader(program, vertexShader);
  gl.attachShader(program, fragmentShader);
  gl.linkProgram(program);
  gl.useProgram(program);

  const vertices = new Float32Array([-1.0, -1.0, 1.0, -1.0, -1.0, 1.0, -1.0, 1.0, 1.0, -1.0, 1.0, 1.0]);
  const buffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
  gl.bufferData(gl.ARRAY_BUFFER, vertices, gl.STATIC_DRAW);

  const positionLocation = gl.getAttribLocation(program, 'position');
  gl.enableVertexAttribArray(positionLocation);
  gl.vertexAttribPointer(positionLocation, 2, gl.FLOAT, false, 0, 0);

  const uTimeLocation = gl.getUniformLocation(program, 'uTime');
  const uResolutionLocation = gl.getUniformLocation(program, 'uResolution');
  const uHueShiftLocation = gl.getUniformLocation(program, 'uHueShift');
  const uNoiseLocation = gl.getUniformLocation(program, 'uNoise');
  const uScanLocation = gl.getUniformLocation(program, 'uScan');
  const uScanFreqLocation = gl.getUniformLocation(program, 'uScanFreq');
  const uWarpLocation = gl.getUniformLocation(program, 'uWarp');

  function resize() {
    const dpr = Math.min(window.devicePixelRatio, 2);
    canvas.width = canvas.clientWidth * dpr;
    canvas.height = canvas.clientHeight * dpr;
    gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);
    gl.uniform2f(uResolutionLocation, gl.canvas.width, gl.canvas.height);
  }
  window.addEventListener('resize', resize);
  resize();

  const startTime = performance.now();
  const speed = 1.2;

  function animate() {
    const currentTime = performance.now();
    const elapsedTime = (currentTime - startTime) / 1000;

    gl.uniform1f(uTimeLocation, elapsedTime * speed);
    gl.uniform1f(uHueShiftLocation, 0.0);
    gl.uniform1f(uNoiseLocation, 0.05);
    gl.uniform1f(uScanLocation, 0.0);
    gl.uniform1f(uScanFreqLocation, 0.0);
    gl.uniform1f(uWarpLocation, 0.2);

    gl.drawArrays(gl.TRIANGLES, 0, 6);
    requestAnimationFrame(animate);
  }
  animate();
}

// --- Scroll-triggered animations ---
function initScrollAnimations() {
  const animatedElements = document.querySelectorAll('.fade-in-up');
  if (!animatedElements.length) return;

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add('visible');
        }
      });
    },
    {
      threshold: 0.2,
    }
  );

  animatedElements.forEach((element) => {
    observer.observe(element);
  });
}

// --- Animated Grid Functionality ---
function initAnimatedGrid() {
  const canvas = document.getElementById('animatedGridCanvas');
  if (!canvas) return;

  const ctx = canvas.getContext('2d');
  const squareSize = 40;
  const speed = 0.5;
  const borderColor = 'rgba(30, 42, 71, 0.5)';
  let gridOffset = { x: 0, y: 0 };

  const resizeCanvas = () => {
    const parent = canvas.parentElement;
    canvas.width = parent.clientWidth;
    canvas.height = parent.clientHeight;
  };

  const drawGrid = () => {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.strokeStyle = borderColor;
    ctx.lineWidth = 1;
    const startX = Math.floor(gridOffset.x / squareSize) * squareSize;
    const startY = Math.floor(gridOffset.y / squareSize) * squareSize;

    for (let x = startX; x < canvas.width + squareSize; x += squareSize) {
      for (let y = startY; y < canvas.height + squareSize; y += squareSize) {
        const squareX = x - (gridOffset.x % squareSize);
        const squareY = y - (gridOffset.y % squareSize);
        ctx.strokeRect(squareX, squareY, squareSize, squareSize);
      }
    }
  };

  const updateAnimation = () => {
    gridOffset.x = (gridOffset.x - speed) % squareSize;
    gridOffset.y = (gridOffset.y - speed) % squareSize;
    drawGrid();
    requestAnimationFrame(updateAnimation);
  };

  window.addEventListener('resize', resizeCanvas);
  resizeCanvas();
  updateAnimation();
}

// --- Main Project JavaScript ---

let uploadedFiles = [];
let sofData = [];
let filteredData = [];
let currentSort = { field: null, direction: 'asc' };

function initTheme() {
  document.documentElement.setAttribute('data-theme', 'dark');
}

function initFileUpload() {
  localStorage.removeItem('sofData');
  const uploadZone = document.getElementById('uploadZone');
  const fileInput = document.getElementById('fileInput');
  const processButton = document.getElementById('processButton');
  if (!uploadZone || !fileInput || !processButton) return;
  uploadZone.addEventListener('click', (e) => {
    if (e.target !== fileInput) fileInput.click();
  });
  uploadZone.addEventListener('dragover', (e) => {
    e.preventDefault();
    uploadZone.classList.add('drag-over');
  });
  uploadZone.addEventListener('dragleave', (e) => {
    e.preventDefault();
    uploadZone.classList.remove('drag-over');
  });
  uploadZone.addEventListener('drop', (e) => {
    e.preventDefault();
    uploadZone.classList.remove('drag-over');
    const files = Array.from(e.dataTransfer.files);
    handleFiles(files);
  });
  fileInput.addEventListener('change', (e) => {
    const files = Array.from(e.target.files);
    handleFiles(files);
  });
  processButton.addEventListener('click', (event) => {
    processFiles(event);
  });
}

function handleFiles(files) {
  const processButton = document.getElementById('processButton');
  const validFiles = files.filter((file) => {
    const extension = file.name.split('.').pop().toLowerCase();
    return ['pdf', 'doc', 'docx'].includes(extension);
  });
  if (validFiles.length === 0) {
    alert('Please select valid SOF files (PDF, DOC, DOCX)');
    return;
  }
  uploadedFiles = [...uploadedFiles, ...validFiles];
  displayFileList();
  if (processButton) {
    processButton.style.display = uploadedFiles.length > 0 ? 'flex' : 'none';
  }
}

function displayFileList() {
  const fileList = document.getElementById('fileList');
  if (!fileList) return;
  fileList.innerHTML = uploadedFiles
    .map((file, index) => {
      const fileExtension = file.name.split('.').pop().toLowerCase();
      const fileTypeIcon = getFileTypeIcon(fileExtension);
      return `
        <div class="file-item" style="animation: slideInUp 0.5s ease-out ${index * 0.1}s both;">
            <div class="file-info">
                ${fileTypeIcon}
                <div class="file-details">
                    <span class="file-name">${file.name}</span>
                    <span class="file-size">${formatFileSize(file.size)}</span>
                </div>
            </div>
            <div class="file-status success">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <polyline points="20,6 9,17 4,12"></polyline>
                </svg>
                Ready
            </div>
        </div>`;
    })
    .join('');
}

function getFileTypeIcon(extension) {
  const iconColors = {
    pdf: '#DC2626',
    doc: '#2563EB',
    docx: '#059669',
  };
  return `
      <svg viewBox="0 0 24 24" width="32" height="32" style="min-width: 32px;">
          <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" fill="${iconColors[extension] || '#6B7280'}"/>
          <polyline points="14,2 14,8 20,8" fill="rgba(255,255,255,0.3)"/>
          <text x="12" y="18" font-size="6" fill="white" text-anchor="middle" font-weight="bold">${extension.toUpperCase()}</text>
      </svg>`;
}

function formatFileSize(bytes) {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

async function processFiles(event) {
    event.preventDefault();
    if (uploadedFiles.length === 0) {
        alert('Please select files to process.');
        return;
    }
    const processButton = document.getElementById('processButton');
    const buttonTextSpan = processButton.querySelector('span');
    const progressSection = document.getElementById('progressSection');
    const progressFill = document.getElementById('progressFill');
    const progressText = document.getElementById('progressText');
    const progressPercentage = document.getElementById('progressPercentage');
    const forceRepaint = (element) => element.offsetHeight;
    processButton.disabled = true;
    progressSection.style.display = 'block';
    progressFill.style.transition = 'none';
    progressFill.style.width = '0%';
    progressPercentage.textContent = '0%';
    forceRepaint(progressFill);
    progressFill.style.transition = 'width 0.5s ease-in-out';
    buttonTextSpan.textContent = 'Uploading Files...';
    progressText.textContent = 'Uploading files to the server...';
    setTimeout(() => {
        progressFill.style.width = '40%';
        progressPercentage.textContent = '40%';
    }, 100);
    const formData = new FormData();
    uploadedFiles.forEach(file => formData.append('files', file));
    try {
        const processPromise = fetch('/process', {
            method: 'POST',
            body: formData,
        });
        setTimeout(() => {
            buttonTextSpan.textContent = 'Processing Files...';
            progressText.textContent = 'AI is processing your documents...';
            progressFill.style.width = '90%';
            progressPercentage.textContent = '90%';
        }, 1500);
        const response = await processPromise;
        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.detail || 'Server processing failed.');
        }
        const processedData = await response.json();
        buttonTextSpan.textContent = 'Success!';
        progressText.textContent = 'All files processed successfully!';
        progressFill.style.width = '100%';
        progressPercentage.textContent = '100%';
        progressSection.style.background = 'linear-gradient(135deg, rgba(5, 150, 105, 0.1), rgba(16, 185, 129, 0.1))';
        progressFill.style.background = 'linear-gradient(135deg, #059669, #10B981)';
        setTimeout(() => {
            localStorage.setItem('sofData', JSON.stringify(processedData));
            window.location.href = '/data';
        }, 1000);
    } catch (error) {
        console.error('Error processing files:', error);
        progressFill.style.width = '100%';
        progressPercentage.textContent = 'Error';
        progressText.textContent = `An error occurred: ${error.message}`;
        progressSection.style.background = 'linear-gradient(135deg, rgba(220, 38, 38, 0.1), rgba(239, 68, 68, 0.1))';
        progressFill.style.background = 'linear-gradient(135deg, #DC2626, #EF4444)';
        buttonTextSpan.textContent = 'Process Files';
        processButton.disabled = false;
    }
}

function initDataPage() {
  const storedData = localStorage.getItem('sofData');
  if (storedData) {
    try {
      sofData = JSON.parse(storedData);
      filteredData = [...sofData];
    } catch (e) {
      console.error("Error parsing SOF data from localStorage", e);
      sofData = [];
      filteredData = [];
    }
  } else {
    sofData = [];
    filteredData = [];
  }
  initializeDataControls();
  displayData();
  lucide.createIcons();
}

function initializeDataControls() {
  const exportCSVBtn = document.getElementById('exportCSV');
  const exportJSONBtn = document.getElementById('exportJSON');
  if (exportCSVBtn) {
    exportCSVBtn.addEventListener('click', () => exportData('csv'));
  }
  if (exportJSONBtn) {
    exportJSONBtn.addEventListener('click', () => exportData('json'));
  }
}

function formatDateTime(date, time) {
  if (!date) return 'N/A';
  return `${date}${time ? ' @ ' + time : ''}`;
}

function getEventCategoryClass(eventType) {
    if (!eventType) return 'event-row-operational';
    const type = eventType.toLowerCase();
    if (type.includes('cargo') || type.includes('discharge') || type.includes('loading') || type.includes('bunkering')) {
        return 'event-row-productive';
    }
    if (type.includes('delay') || type.includes('stoppage') || type.includes('rain') || type.includes('breakdown')) {
        return 'event-row-delay';
    }
    if (type.includes('idle') || type.includes('wait') || type.includes('standby')) {
        return 'event-row-idle';
    }
    return 'event-row-operational';
}

function displayData() {
  const container = document.getElementById('sof-data-container');
  const noDataContainer = document.getElementById('noData');

  if (!container || !noDataContainer) return;

  container.innerHTML = '';

  if (!filteredData || filteredData.length === 0) {
    container.style.display = 'none';
    noDataContainer.style.display = 'block';
    return;
  }

  container.style.display = 'block';
  noDataContainer.style.display = 'none';

  // Create and manage a single tooltip for the page
  let tooltip = document.querySelector('.gantt-tooltip');
  if (!tooltip) {
    tooltip = document.createElement('div');
    tooltip.className = 'gantt-tooltip';
    document.body.appendChild(tooltip);
  }

  filteredData.forEach((doc, index) => {
    const docDetails = doc.document_details || {};
    const parties = docDetails.parties || {};
    const cargo = docDetails.cargo || {};
    const events = doc.events || [];
    const laytime = doc.laytime_notes || {};
    const approvals = doc.approvals || [];
    const uniqueId = `doc-${index}`;

    const cardHTML = `
      <div class="sof-document-card">
        <div class="sof-card-header">
          <div class="sof-header-title">
            <i data-lucide="ship"></i>
            <h2>${docDetails.vessel_name || 'N/A'}</h2>
          </div>
          <span class="sof-header-pills">
            <span class="pill port">${docDetails.port_name || 'N/A'}</span>
            <span class="pill voyage">${docDetails.voyage_number || 'N/A'}</span>
            <span class="pill file">${doc.fileName || 'N/A'}</span>
          </span>
        </div>

        <div class="sof-card-body">
          <h3 class="sof-section-title">Document Details</h3>
          <div class="sof-details-grid">
            <div><strong>Source:</strong> ${docDetails.document_source || 'N/A'}</div>
            <div><strong>Date:</strong> ${docDetails.date_of_document || 'N/A'}</div>
            <div><strong>Shipowner:</strong> ${parties.shipowner_name || 'N/A'}</div>
            <div><strong>Charterer:</strong> ${parties.charterer_name || 'N/A'}</div>
            <div><strong>Agent:</strong> ${parties.port_agent_name || 'N/A'}</div>
          </div>
          <div class="sof-details-grid cargo-grid">
            <div><strong>Operation:</strong> ${cargo.operation_type || 'N/A'}</div>
            <div><strong>Cargo:</strong> ${cargo.cargo_type || 'N/A'}</div>
            <div><strong>Quantity:</strong> ${cargo.quantity ? `${cargo.quantity} ${cargo.unit}` : 'N/A'}</div>
          </div>

          <div class="view-controls">
            <h3 class="sof-section-title">Events Log</h3>
            <button id="tableViewBtn-${uniqueId}" class="view-toggle-btn active">Table View</button>
            <button id="timelineViewBtn-${uniqueId}" class="view-toggle-btn">Timeline View</button>
          </div>

          <div class="events-table-container" id="events-table-container-${uniqueId}">
            <table class="events-table">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Event Type</th>
                  <th>Start</th>
                  <th>End</th>
                  <th>Duration (Hrs)</th>
                  <th>Remarks & Weather</th>
                </tr>
              </thead>
              <tbody>
                ${events.map(event => `
                  <tr class="event-row ${getEventCategoryClass(event.event_type)}">
                    <td>${event.event_id}</td>
                    <td class="event-type-cell">${event.event_type || 'N/A'}</td>
                    <td>${formatDateTime(event.start_date, event.start_time)}</td>
                    <td>${formatDateTime(event.end_date, event.end_time)}</td>
                    <td>${event.duration_hours != null ? event.duration_hours.toFixed(2) : 'N/A'}</td>
                    <td class="remarks-cell">
                      ${event.remarks || ''}
                      ${event.weather_conditions ? `<div class="weather-tag">${event.weather_conditions}</div>` : ''}
                    </td>
                  </tr>
                `).join('')}
              </tbody>
            </table>
          </div>

          <div class="timeline-view-container" id="timeline-view-container-${uniqueId}" style="display: none;">
             <div id="gantt-chart-${uniqueId}"></div>
          </div>

          <h3 class="sof-section-title">Laytime Notes</h3>
          <div class="laytime-section">
            <p><strong>Free Time Periods:</strong> ${laytime.free_time_periods_identified || 'N/A'}</p>
            <p><strong>Suspensions:</strong> ${laytime.suspension_periods_identified || 'N/A'}</p>
            <p><strong>Remarks on Delays:</strong> ${laytime.remarks_on_interruptions_or_delays || 'N/A'}</p>
          </div>

          <h3 class="sof-section-title">Approvals</h3>
          <div class="sof-details-grid approvals-grid">
            ${approvals.map(app => `
              <div><strong>${app.role || 'N/A'}:</strong> ${app.name || 'N/A'} on ${app.date_signed || 'N/A'}</div>
            `).join('')}
          </div>
        </div>
      </div>
    `;
    container.innerHTML += cardHTML;

    renderTimeline(events, uniqueId, tooltip);
    setupViewToggles(uniqueId);
  });

  lucide.createIcons();
}

function setupViewToggles(uniqueId) {
    const tableViewBtn = document.getElementById(`tableViewBtn-${uniqueId}`);
    const timelineViewBtn = document.getElementById(`timelineViewBtn-${uniqueId}`);
    const tableContainer = document.getElementById(`events-table-container-${uniqueId}`);
    const timelineContainer = document.getElementById(`timeline-view-container-${uniqueId}`);

    if (!tableViewBtn || !timelineViewBtn || !tableContainer || !timelineContainer) return;

    tableViewBtn.addEventListener('click', () => {
        tableContainer.style.display = 'block';
        timelineContainer.style.display = 'none';
        tableViewBtn.classList.add('active');
        timelineViewBtn.classList.remove('active');
    });

    timelineViewBtn.addEventListener('click', () => {
        tableContainer.style.display = 'none';
        timelineContainer.style.display = 'block';
        timelineViewBtn.classList.add('active');
        tableViewBtn.classList.remove('active');
    });
}

function parseSofDate(dateStr, timeStr) {
    if (!dateStr || !timeStr) return null;

    const months = { 'Jan': 0, 'Feb': 1, 'Mar': 2, 'Apr': 3, 'May': 4, 'Jun': 5, 'Jul': 6, 'Aug': 7, 'Sep': 8, 'Oct': 9, 'Nov': 10, 'Dec': 11 };
    const dateParts = dateStr.split('-');
    if (dateParts.length !== 3) return null;

    const monthStr = dateParts[1];
    const monthKey = monthStr.charAt(0).toUpperCase() + monthStr.slice(1).toLowerCase();

    const day = parseInt(dateParts[0], 10);
    const month = months[monthKey];
    let year = parseInt(dateParts[2], 10);

    if (year < 100) {
        year += 2000;
    }

    const timeParts = timeStr.split(':');
    if (timeParts.length !== 2) return null;

    const hours = parseInt(timeParts[0], 10);
    const minutes = parseInt(timeParts[1], 10);

    if (isNaN(day) || month === undefined || isNaN(year) || isNaN(hours) || isNaN(minutes)) {
        return null;
    }
    return new Date(Date.UTC(year, month, day, hours, minutes));
}

function renderTimeline(events, uniqueId, tooltip) {
    const ganttContainer = document.querySelector(`#gantt-chart-${uniqueId}`);
    if (!ganttContainer) return;

    const validEvents = events
        .map(e => ({
            ...e,
            startDate: parseSofDate(e.start_date, e.start_time),
            endDate: parseSofDate(e.end_date, e.end_time)
        }))
        .filter(e => e.startDate)
        .map(e => {
            if (!e.endDate || e.endDate <= e.startDate) {
                e.endDate = new Date(e.startDate.getTime() + (2 * 60 * 60 * 1000));
            }
            return e;
        });

    if (validEvents.length === 0) {
        ganttContainer.innerHTML = '<p style="color: var(--text-secondary); padding: 1rem;">No valid time data to display.</p>';
        return;
    }

    const allDates = validEvents.flatMap(e => [e.startDate, e.endDate]);
    let minDate = new Date(Math.min.apply(null, allDates));
    let maxDate = new Date(Math.max.apply(null, allDates));

    minDate.setUTCHours(0, 0, 0, 0);
    maxDate.setUTCHours(23, 59, 59, 999);

    const totalDuration = maxDate.getTime() - minDate.getTime();

    // Build Header
    let daysHtml = '';
    let hoursHtml = '';
    const tempDate = new Date(minDate);

    while (tempDate <= maxDate) {
        daysHtml += `<div class="gantt-day">${tempDate.getUTCDate()} ${tempDate.toLocaleString('default', { month: 'short', timeZone: 'UTC' })}</div>`;
        hoursHtml += `<div class="gantt-hour">00</div><div class="gantt-hour">12</div>`;
        tempDate.setUTCDate(tempDate.getUTCDate() + 1);
    }

    // Build Rows
    let labelsHtml = '';
    let bodyHtml = '';
    validEvents.forEach(event => {
        labelsHtml += `<div class="gantt-row-label">${event.event_type}</div>`;

        const left = ((event.startDate.getTime() - minDate.getTime()) / totalDuration) * 100;
        const width = ((event.endDate.getTime() - event.startDate.getTime()) / totalDuration) * 100;
        const categoryClass = getEventCategoryClass(event.event_type).replace('event-row-', 'bar-');

        const barHtml = `
            <div class="gantt-bar ${categoryClass}"
                 style="left: ${left}%; width: ${width}%;"
                 data-event-name="${event.event_type}"
                 data-start-date="${formatDateTime(event.start_date, event.start_time)}"
                 data-end-date="${formatDateTime(event.end_date, event.end_time)}"
                 data-remarks="${event.remarks || 'No remarks.'}"
            ></div>`;

        bodyHtml += `<div class="gantt-row"><div class="gantt-row-bars">${barHtml}</div></div>`;
    });

    ganttContainer.innerHTML = `
        <div class="custom-gantt-chart">
            <div class="gantt-labels">
                <div class="gantt-header-label">Event</div>
                ${labelsHtml}
            </div>
            <div class="gantt-timeline">
                <div class="gantt-header-timeline">
                    <div class="gantt-days-row">${daysHtml}</div>
                    <div class="gantt-hours-row">${hoursHtml}</div>
                </div>
                <div class="gantt-body">${bodyHtml}</div>
            </div>
        </div>
    `;

    // Tooltip Logic
    ganttContainer.addEventListener('mouseover', (e) => {
        if (e.target.classList.contains('gantt-bar')) {
            const data = e.target.dataset;
            tooltip.innerHTML = `
                <div class="gantt-tooltip-header">${data.eventName}</div>
                <div class="gantt-tooltip-body">
                    <p><strong>From:</strong> ${data.startDate}</p>
                    <p><strong>To:</strong> ${data.endDate}</p>
                    <p class="gantt-tooltip-remarks"><strong>Remarks:</strong> ${data.remarks}</p>
                </div>`;
            tooltip.style.display = 'block';
        }
    });

    ganttContainer.addEventListener('mousemove', (e) => {
        if (tooltip.style.display === 'block') {
            tooltip.style.left = `${e.clientX + 15}px`;
            tooltip.style.top = `${e.clientY + 15}px`;
        }
    });

    ganttContainer.addEventListener('mouseout', (e) => {
        if (e.target.classList.contains('gantt-bar')) {
            tooltip.style.display = 'none';
        }
    });
}

function exportData(format) {
  if (filteredData.length === 0) {
    alert('No data to export');
    return;
  }
  const filename = `sof_data_${new Date().toISOString().split('T')[0]}`;
  if (format === 'csv') {
    exportCSV(filteredData, filename);
  } else if (format === 'json') {
    exportJSON(filteredData, filename);
  }
}

function exportCSV(data, filename) {
  const headers = [
    'FileName', 'VesselName', 'PortName', 'VoyageNumber', 'CargoType', 'Quantity', 'Unit',
    'EventID', 'EventType', 'StartDate', 'StartTime', 'EndDate', 'EndTime', 'DurationHours', 'Remarks', 'Weather'
  ];

  let csvRows = [headers.join(',')];

  data.forEach(doc => {
    const docDetails = doc.document_details || {};
    const cargo = docDetails.cargo || {};

    if (doc.events && doc.events.length > 0) {
      doc.events.forEach(event => {
        const row = [
          `"${doc.fileName || ''}"`,
          `"${docDetails.vessel_name || ''}"`,
          `"${docDetails.port_name || ''}"`,
          `"${docDetails.voyage_number || ''}"`,
          `"${cargo.cargo_type || ''}"`,
          `"${cargo.quantity || ''}"`,
          `"${cargo.unit || ''}"`,
          `"${event.event_id || ''}"`,
          `"${event.event_type || ''}"`,
          `"${event.start_date || ''}"`,
          `"${event.start_time || ''}"`,
          `"${event.end_date || ''}"`,
          `"${event.end_time || ''}"`,
          `"${event.duration_hours != null ? event.duration_hours.toFixed(2) : ''}"`,
          `"${(event.remarks || '').replace(/"/g, '""')}"`,
          `"${(event.weather_conditions || '').replace(/"/g, '""')}"`
        ];
        csvRows.push(row.join(','));
      });
    }
  });

  const csvContent = csvRows.join('\n');
  downloadFile(csvContent, `${filename}.csv`, 'text/csv;charset=utf-8;');
}

function exportJSON(data, filename) {
  const jsonContent = JSON.stringify(data, null, 2);
  downloadFile(jsonContent, `${filename}.json`, 'application/json');
}

function downloadFile(content, filename, contentType) {
  const blob = new Blob([content], { type: contentType });
  const url = window.URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  window.URL.revokeObjectURL(url);
}

function init() {
  initTheme();
  initScrollAnimations();
  const currentPage = window.location.pathname.split('/').pop();

  if (currentPage === 'upload' || window.location.pathname.endsWith('/upload/')) {
    initFileUpload();
    initAnimatedGrid();
  } else if (currentPage === 'data' || window.location.pathname.endsWith('/data/')) {
    initDataPage();
    initAnimatedGrid();
  } else {
    initDarkVeil();
    initAnimatedGrid();
  }
}

document.addEventListener('DOMContentLoaded', init);