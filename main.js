// 変数
let scene, camera, renderer, ambientLight, directionalLight, directionalLight2, floor, dice, plate;
let places = [
	{ name: "1号館", posX: 2.8, posY: 1.2, posZ: 1.25 },
	{ name: "2号館", posX: 1.2, posY: 1, posZ: 1.7 },
	{ name: "3号館", posX: 1, posY: 1.2, posZ: 0.15 },
	{ name: "体育館", posX: -1.4, posY: 1.2, posZ: -1.35 },
	{ name: "食堂", posX: 2.5, posY: 1.2, posZ: 0 }
];

let explains = [
	"本館です。",
	"図書館や演習室、情報基盤センターがあります。",
	"多くの教室、研究室があります。",
	"ここには体育館の説明が入ります",
	"ここには食堂の説明が入ります"
];

let facilities = [
	["事務室", "医務室", "学生相談室"],
	["図書館", "情報基盤センター", "情報処理演習室", "GLOBAL COMMONS"],
	["31A教室", "FEISホール"],
	["体育館", "トレーニングルーム", "部室"],
	["食堂", "キャンパスショップ"]
];

let button = new Array(places.length);
// クリック検知関連
let container;
let mouse;
let raycaster;
let clickFlg = false;
let moveFlg = false;
let selectNum;

// イニシャライザ
function init() {
	// シーン
	scene = new THREE.Scene();

	// カメラ
	camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 0.1, 1000);
	camera.position.set(3.5, 4, 6);

	// レンダラー
	renderer = new THREE.WebGLRenderer({
		antialias: true,
		alpha: true
	});

	renderer.setSize(window.innerWidth, window.innerHeight);

	// カメラを操作できるようにする
	const controls = new THREE.OrbitControls(camera, renderer.domElement);

	// カメラ操作を滑らかにする
	controls.enableDamping = true;
	controls.dampingFactor = 0.2;

	// カメラの移動範囲を上半分に設定
	controls.maxPolarAngle = Math.PI / 2;

	renderer.domElement.id = "canvas";
	document.body.appendChild(renderer.domElement);

	// 環境光
	ambientLight = new THREE.AmbientLight(0xffffff, 1);
	scene.add(ambientLight);

	// 平行光1
	directionalLight = new THREE.DirectionalLight(0xffffff, 0.4);
	directionalLight.position.set(1, 5, -1);
	directionalLight.castShadow = true;
	scene.add(directionalLight);

	// 平行光2
	directionalLight2 = new THREE.DirectionalLight(0xffffff, 0.2);
	directionalLight2.position.set(-3, 5, 1);
	directionalLight2.castShadow = true;
	scene.add(directionalLight2);

	// ボックスのサイズ
	const geometry = new THREE.BoxGeometry(1, 0.1, 1);
	const material = new THREE.MeshBasicMaterial({ color: 0x6699ff });
	floor = new THREE.Mesh(geometry, material);
	floor.position.set(0, -0.44, 0);
	floor.name = "floor";
	//scene.add(floor);

	// 3Dモデルの読み込み
	const loader = new THREE.GLTFLoader();

	loader.load("./Models/TCU_Map.gltf", function (gltf) {
		dice = gltf.scene;
		scene.add(dice);
	});

	// ボタン用モデルの読み込み
	for (let i = 0; i < button.length; i++) {
		loader.load(`./Models/TextPlate${i}.gltf`, function (gltf) {
			button[i] = gltf.scene;
			button[i].position.set(places[i].posX, places[i].posY, places[i].posZ);
			button[i].traverse(object => {
				if (object.isMesh) {
					object.material.trasparent = true;
					object.material.opacity = 0;
				}
			});
			// 子オブジェクトにnameを設定する
			button[i].children.forEach(element => {
				element.name = places[i].name;
				element.children.forEach(element => {
					element.name = places[i].name;
				});
			});
			button[i].scale.set(0.25, 0.25, 0.25);
			scene.add(button[i]);
		});
	}
}

// アニメーション
function animate() {
	requestAnimationFrame(animate);

	let camPos = camera.position;
	button.forEach(element => {
		// カメラに正面を向ける
		element.quaternion.copy(camera.quaternion);
		// カメラの距離に応じてボタンサイズを変更
		let btnPos = element.position;
		let dist = Math.sqrt(
			Math.pow(camPos.x - btnPos.x, 2) + Math.pow(camPos.y - btnPos.y, 2) + Math.pow(camPos.z - btnPos.z, 2)
		);
		if (dist > 10) {
			dist = 10;
		} else if (dist < 5) {
			dist = 5;
		}

		element.scale.set(dist / 30, dist / 30, dist / 30);
	});

	raycaster.setFromCamera(mouse, camera);
	const intersects = raycaster.intersectObjects(scene.children);

	if (intersects.length > 0) {
		const obj = intersects[0].object;

		// カーソルが重なっているオブジェクトがplacesとして登録されているか
		if (places.some(place => place.name === obj.name)) {
			if (moveFlg) {
				clickFlg = true;
				selectNum = places.map(element => element.name).indexOf(obj.name);
			}
		} else {
			clickFlg = false;
		}
	} else {
		clickFlg = false;
	}

	if (clickFlg) {
		container.style.cursor = "pointer";
	} else {
		container.style.cursor = "default";
	}

	renderer.render(scene, camera);
}

// ウィンドウ変更時にサイズを維持する処理
function onWindowResize() {
	camera.aspect = window.innerWidth / window.innerHeight;
	camera.updateProjectionMatrix();
	renderer.setSize(window.innerWidth, window.innerHeight);
}

window.addEventListener("resize", onWindowResize);

function setControll() {
	//canvasを取得
	container = document.getElementById("canvas");

	//マウス座標管理用のベクトル
	mouse = new THREE.Vector2();
	//レイキャストを生成
	raycaster = new THREE.Raycaster();

	//マウスイベントを登録
	container.addEventListener("mousemove", handleMouseMove);
	container.addEventListener("click", handleClick);

	function handleMouseMove(event) {
		moveFlg = true;

		const element = event.currentTarget;

		//canvas上のマウスのXY座標
		const x = event.clientX - element.offsetLeft;
		const y = event.clientY - element.offsetTop;

		//canvasの幅と高さを取得
		const w = element.offsetWidth;
		const h = element.offsetHeight;

		//マウス座標を-1〜1の範囲に変換
		mouse.x = (x / w) * 2 - 1;
		mouse.y = -(y / h) * 2 + 1;
	}

	function handleClick(event) {
		if (clickFlg) {
			$("#name").text(places[selectNum].name);
			$("#explain").text(explains[selectNum]);
			$("#facilities").empty();
			facilities[selectNum].forEach(element => {
				$("#facilities").append("<li>" + element + "</li>");
			});
			$("#panel").css({
				visibility: "visible"
			});
			$("#panel").removeClass("fadeout");
			$("#panel").addClass("fadein");
		}
	}
}

init();
setControll();
animate();

// 説明パネルを閉じる処理
$("#panel").click(function () {
	$("#panel").css({
		visibility: "hidden"
	});
	$("#panel").removeClass("fadein");
	$("#panel").addClass("fadeout");
});

// 操作説明を開く処理
$("#btn").click(function () {
	$(this).toggleClass("active");
	$(".operation_panel").toggleClass("active");
	$(".operation_panel").css({
		visibility: $(".operation_panel").css("visibility") == "hidden" ? "visible" : "hidden"
	});
});
