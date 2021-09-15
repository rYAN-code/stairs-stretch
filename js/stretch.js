let camera, scene, renderer, ambient, point, orbitControls;
let width = window.innerWidth;  //窗口宽度
let height = window.innerHeight;    //窗口高度
let raycaster = new THREE.Raycaster();  //射线
let pointer = new THREE.Vector2();  //鼠标二维位置
let selectedObject = null;  //射线选中对象
let mesh;   //整个网格模型

init();
animate();

function init() {
    setScene();
    setLight();
    setCamera();
    setRenderer();
    setController();
    setHelper();
    setMesh();
}

function setScene() {
    scene = new THREE.Scene();
}

function setLight() {
    //点光源
    point = new THREE.PointLight(0xffffff);
    //点光源位置
    point.position.set(-800, 5000, 1000);
    //点光源添加到场景中
    scene.add(point);
    //环境光
    ambient = new THREE.AmbientLight(0x444444);
    scene.add(ambient);
}

function setCamera() {
    const k = width / height; //窗口宽高比
    const s = 4000; //三维场景显示范围控制系数，系数越大，显示的范围越大
    //创建相机对象
    camera = new THREE.OrthographicCamera(-s * k, s * k, s, -s, 0.1, 20000);
    camera.position.set(4000, 1300, 5500); //设置相机位置
    camera.lookAt(scene.position); //设置相机方向(指向的场景对象)
}

function setRenderer() {
    renderer = new THREE.WebGLRenderer();
    renderer.setSize(width, height);//设置渲染区域尺寸
    renderer.setClearColor(0xb9d3ff, 1); //设置背景颜色
    document.body.appendChild(renderer.domElement); //body元素中插入canvas对象
}

function setController() {
    // OrbitControls
    orbitControls = new THREE.OrbitControls(camera, renderer.domElement);
    orbitControls.listenToKeyEvents(window);
}

function setHelper() {
    let axes = new THREE.AxesHelper(3000);
    // scene.add(axes);
}

function setMesh() {
    // let geometry = new THREE.BoxGeometry(800, 800, 800);
    let geometry = new THREE.OctahedronGeometry(800);
    let material = new THREE.MeshLambertMaterial({
        color: 0x80ffff,
        side: THREE.DoubleSide,
    });
    mesh = new THREE.Mesh(geometry, material);
    scene.add(mesh);
}

function render() {
    renderer.render(scene, camera);
}

function animate() {
    requestAnimationFrame(animate);
    render();
}

// 鼠标点击事件，拉伸事件
document.addEventListener('pointerdown', (event) => {
    orbitControls.enabled = true
    pointer.x = (event.clientX / window.innerWidth) * 2 - 1;
    pointer.y = - (event.clientY / window.innerHeight) * 2 + 1;
    // 通过摄像机和鼠标位置更新射线
    raycaster.setFromCamera(pointer, camera);

    const intersects = raycaster.intersectObject(mesh, true);
    if (intersects.length > 0) {
        const res = intersects.filter(function (res) {
            return res && res.object;
        })[0];
        if (res && res.object) {
            selectedObject = res.object;
            orbitControls.enabled = false;
            // 获取根据法向量需要改变的点的下标
            let index = getNormalsIndex(selectedObject, res.face.a);
            // 几何体点坐标的数组
            let pointArr = selectedObject.geometry.attributes.position.array;
            // 获取需要改变的点的所有法向量的点的下标数组
            let indexArr = findPoint(pointArr, index);
            let startPoint = event;
            // 鼠标移动事件，改变点的坐标
            document.addEventListener('pointermove', move);
            function move(event) {
                let temp = event;
                // 获取改变后的坐标数组
                let changeArr = changePointPosition(pointArr, indexArr, res.face.normal, startPoint, event);
                let vertices = new Float32Array(changeArr);
                let attribue = new THREE.BufferAttribute(vertices, 3);
                selectedObject.geometry.attributes.position = attribue;
                // 更新几何体的position和包围盒，包围球
                selectedObject.geometry.attributes.position.needsUpdate = true;
                selectedObject.geometry.computeBoundingBox();
                selectedObject.geometry.computeBoundingSphere();
                // 刷新开始点
                startPoint = temp;
            }
        }
    }
    document.addEventListener('pointerup', () => { document.removeEventListener('pointermove', move) });
})

/**
 * 根据 normal 法向量,获取 object 网格模型对象需要改变的点的下标
 * @param {选中的网格模型对象} object 
 * @param {选中的face的其中一点的下标} pointIndex 
 * @returns Array   返回同法向量的点的 X 坐标的下标数组
 */
function getNormalsIndex(object, pointIndex) {
    // index 为所在点的x坐标在 position 的下标
    let index = pointIndex * 3;
    // 记录所有同法向量的点的 X 坐标的下标
    let arr = [];
    let pointNormalArr = object.geometry.attributes.normal.array;
    let normalArr = [pointNormalArr[index], pointNormalArr[index + 1], pointNormalArr[index + 2]];
    // 遍历寻找同法向量的点的X坐标的下标
    for (let i = 0; i < pointNormalArr.length; i += 3) {
        if (pointNormalArr[i] === normalArr[0] && pointNormalArr[i + 1] === normalArr[1] && pointNormalArr[i + 2] === normalArr[2]) {
            arr.push(i);
        }
    }
    return arr;
}

/**
 * 寻找与需要改变的点同位置坐标，但不同法向量的点
 * @param {几何体点坐标的数组} pointArr 
 * @param {所有需要找的点的下标数组} index 
 * @returns Array   需要改变的所有点的 X 坐标下标数组
 */
function findPoint(pointArr, index) {
    // 存放需要改变的点的X坐标下标数组
    let arr = [];
    // time 标记存入次数，每个点存入三次不同的向量
    let time = 0;
    for (let i = 0; i < index.length; i++) {
        // comArr 为需要比较的点的X,Y,Z坐标数组
        let comArr = [pointArr[index[i]], pointArr[index[i] + 1], pointArr[index[i] + 2]];
        for (let k = 0; k < pointArr.length; k += 3) {
            if (comArr[0] === pointArr[k] && comArr[1] === pointArr[k + 1] && comArr[2] === pointArr[k + 2]) {
                arr.push(k);
            }
        }
    }
    return arr;
}

/**
 * 改变点的位置坐标
 * @param {几何体点坐标的数组} pointArr 
 * @param {所有需要改变的点的下标数组} indexArr 
 * @param {选中的面中的点的法向量} normal 
 * @param {鼠标开始锚点对象} startPoint 
 * @param {鼠标当前位置对象} event 
 * @returns Array   返回改变后的位置坐标数组
 */
function changePointPosition(pointArr, indexArr, normal, startPoint, event) {
    // 鼠标开始点的二维向量转为三维向量
    let startV3 = screenPointToThreeCoords(startPoint.clientX, startPoint.clientY);
    // 鼠标结束点的二维向量转为三维向量
    let endV3 = screenPointToThreeCoords(event.clientX, event.clientY);
    let distancev3 = new THREE.Vector3();
    distancev3.subVectors(endV3, startV3);
    let distance = distancev3.dot(normal);
    // x,y,z位置坐标需要改变的量
    let xyzArr = [distance * normal.x, distance * normal.y, distance * normal.z];
    let i = 0;
    while (i < indexArr.length) {
        let j = 0;
        pointArr[indexArr[i]] += xyzArr[j];
        pointArr[indexArr[i] + 1] += xyzArr[j + 1];
        pointArr[indexArr[i] + 2] += xyzArr[j + 2];
        i++;
    }
    return pointArr;
}

/**
 * 二维向量转三维向量
 * @param {二维向量的 x 坐标} x 
 * @param {二维向量的 y 坐标} y 
 * @returns THREE.Vector3   返回转换后的三维向量
 */
function screenPointToThreeCoords(x, y) {
    let vec = new THREE.Vector3();

    vec.set((x / renderer.domElement.clientWidth) * 2 - 1, - (y / renderer.domElement.clientHeight) * 2 + 1, -1);

    vec.unproject(camera);

    return vec;
}