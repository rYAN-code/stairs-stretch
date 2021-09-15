let camera, scene, renderer, ambient, point, orbitControls, dragControls;
let raycaster = new THREE.Raycaster();  //射线
let pointer = new THREE.Vector2();  //鼠标二维位置
let width = window.innerWidth;  //窗口宽度
let height = window.innerHeight;    //窗口高度
let objects = [];   // 存放拖拽对象
let hoverEnable = true; // 控制悬停效果
let selectedObject = null;  //射线选中对象
let selectedFace = null;    //射线选中面
let materialIndex = null;   //材质下标
let group = new THREE.Group();  //整个网格模型
// x, y, z 轴的单位向量
let v_x = new THREE.Vector3(1, 0, 0);
let v_y = new THREE.Vector3(0, 1, 0);
let v_z = new THREE.Vector3(0, 0, 1);

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
    // DragControls
    dragControls = new THREE.DragControls(objects, camera, renderer.domElement);
    dragControls.addEventListener('drag', render);
}

function setHelper() {
    let axes = new THREE.AxesHelper(3000);
    // scene.add(axes);
}

function setMesh() {
    /**
     * 根据参数建立 BoxGeometry 的网格模型
     * @param {几何体的x} x 
     * @param {几何体的y} y 
     * @param {几何体的z} z 
     * @param {材质颜色} materialColor 
     * @returns THREE.Mesh
     */
    function boxGeometry(x, y, z, materialColor) {
        // 采用 BoxGeometry 立方体几何
        let geometry = new THREE.BoxGeometry(x, y, z);
        let mats = []
        let material1 = new THREE.MeshLambertMaterial({
            color: materialColor,
            side: THREE.DoubleSide,
        });
        let material2 = new THREE.MeshLambertMaterial({
            color: materialColor,
            side: THREE.DoubleSide,
        });
        let material3 = new THREE.MeshLambertMaterial({
            color: materialColor,
            side: THREE.DoubleSide,
        });
        let material4 = new THREE.MeshLambertMaterial({
            color: materialColor,
            side: THREE.DoubleSide,
        });
        let material5 = new THREE.MeshLambertMaterial({
            color: materialColor,
            side: THREE.DoubleSide,
        });
        let material6 = new THREE.MeshLambertMaterial({
            color: materialColor,
            side: THREE.DoubleSide,
        });
        mats.push(material1)
        mats.push(material2)
        mats.push(material3)
        mats.push(material4)
        mats.push(material5)
        mats.push(material6)
        // 返回网格模型对象Mesh
        mesh = new THREE.Mesh(geometry, mats);
        // 用名字记录其材质颜色
        mesh.name = materialColor
        return mesh
    }
    /**
     * 根据参数采用 ExtrudeBufferGeometry 建立一个台阶的网格模型
     * @param {台阶宽度} width 
     * @param {台阶高度} height 
     * @param {台阶长度} deepth 
     * @returns THREE.Mesh
     */
    function secondStair(width, height, deepth) {
        // 描述楼梯的梯形侧面轮廓对象
        let shape = new THREE.Shape();
        shape.moveTo(width, 0);
        shape.lineTo(width, height);
        shape.lineTo(0, height);
        shape.lineTo(0, height / 2);
        shape.lineTo(width, 0);

        let extrudeSettings = {
            steps: 2,
            depth: deepth,
            bevelEnabled: false,
        };
        // 采用挤压几何体 ExtrudeBufferGeometry
        let geometry = new THREE.ExtrudeBufferGeometry(shape, extrudeSettings);
        let mats = []
        let material1 = new THREE.MeshLambertMaterial({
            color: 0xff0000,
            side: THREE.DoubleSide,
        });
        let material2 = new THREE.MeshLambertMaterial({
            color: 0xff0000,
            side: THREE.DoubleSide,
        });
        mats.push(material1)
        mats.push(material2)
        let mesh = new THREE.Mesh(geometry, mats);
        // 调整几何体的z轴
        mesh.translateOnAxis(v_z, - deepth / 2);
        mesh.name = '#f00'
        return mesh;
    }


    // 第一个台阶网格模型
    let meshFirstStair = boxGeometry(260, 100, 1200, 0xff0000);
    meshFirstStair.translateOnAxis(v_y, 50);

    // 第二个台阶网格模型
    let meshSecondStair = secondStair(260, 200, 1200);
    meshSecondStair.translateOnAxis(v_x, -390);

    // group1 记录剩下的台阶
    let group1 = new THREE.Group();
    // 剩余的台阶
    for (let i = 1; i < 16; i++) {
        let secondMesh = secondStair(260, 200, 1200);
        secondMesh.translateOnAxis(v_x, - (260 * i + 390)).translateOnAxis(v_y, 100 * i);
        group1.add(secondMesh);
    }
    // 平台的网格模型
    let meshPlatform = boxGeometry(1340, 150, 2500, '#80ffff');
    meshPlatform.translateOnAxis(v_x, -4960).translateOnAxis(v_y, 1750).translateOnAxis(v_z, -650);
    group1.add(meshFirstStair, meshSecondStair, meshPlatform);
    // 井的网格模型
    let distance = boxGeometry(4420, 150, 100, '#0000b3');
    distance.translateOnAxis(v_x, -2080).translateOnAxis(v_y, 1750).translateOnAxis(v_z, -650)
    // group2表示绕y轴旋转180度和调整后的group1
    let group2 = group1.clone().rotateY(Math.PI).translateOnAxis(v_z, 1300).translateOnAxis(v_x, 4160);
    group.add(group1, distance, group2)
    scene.add(group)
}

function render() {
    renderer.render(scene, camera);
}

function animate() {
    requestAnimationFrame(animate);
    render();
}

// 事件监听
window.addEventListener('resize', onWindowResize);
document.addEventListener('pointermove', onPointerMove);
document.addEventListener('dblclick', ondblclick);

// 窗口大小改变重设渲染大小
function onWindowResize() {

    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();

    renderer.setSize(window.innerWidth, window.innerHeight);

}

// 鼠标hover效果
function onPointerMove(event) {
    if (hoverEnable) {
        if (selectedObject) {
            // 把选中对象改为非选中状态，把选中对象清除
            selectedObject.material[materialIndex].color.set(selectedObject.name)
            selectedObject = null;
        }
        // 将鼠标位置归一化为设备坐标。x 和 y 方向的取值范围是 (-1 to +1)
        pointer.x = (event.clientX / window.innerWidth) * 2 - 1;
        pointer.y = - (event.clientY / window.innerHeight) * 2 + 1;
        // 通过摄像机和鼠标位置更新射线
        raycaster.setFromCamera(pointer, camera);

        const intersects = raycaster.intersectObject(group, true);
        if (intersects.length > 0) {
            const res = intersects.filter(function (res) {
                return res && res.object;
            })[0];
            if (res && res.object) {
                // 选中的几何体对象
                selectedObject = res.object
                // 改变选中的几何体的面的颜色
                materialIndex = res.face.materialIndex
                selectedObject.material[materialIndex].color.set('#fff')
            }
        }
    }
}

// 鼠标点击拖拽几何体
function ondblclick(event) {
    // 点击非几何体区域把鼠标悬停改变颜色和 OrbitControls 打开
    hoverEnable = true
    orbitControls.enabled = true
    if (selectedObject) {
        // 把选中对象改为非选中状态，把选中对象清除
        selectedObject.material.forEach(items => {
            items.color.set(selectedObject.name)
        })
        selectedObject = null;
    }
    // 将鼠标位置归一化为设备坐标。x 和 y 方向的取值范围是 (-1 to +1)
    pointer.x = (event.clientX / window.innerWidth) * 2 - 1;
    pointer.y = - (event.clientY / window.innerHeight) * 2 + 1;
    // 通过摄像机和鼠标位置更新射线
    raycaster.setFromCamera(pointer, camera);

    const intersects = raycaster.intersectObject(group, true);
    if (intersects.length > 0) {
        const res = intersects.filter(function (res) {
            return res && res.object;
        })[0];
        if (res && res.object) {
            // 选中的几何体对象
            selectedObject = res.object;
            // 改变选中的几何体的面的颜色
            materialIndex = res.face.materialIndex
            selectedObject.material.forEach(items => {
                items.color.set('#fff')
            })
            // 关闭鼠标悬停效果和 OrbitControls 功能
            hoverEnable = false
            orbitControls.enabled = false
            // 把选中对象传入给 DragControls 的操作数组
            objects.push(selectedObject)
        }
    }
}
