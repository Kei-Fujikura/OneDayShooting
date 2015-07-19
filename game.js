/*
 * # tutorial - tmlib.js
 * Fuse26に向けた勉強です
 */

var SCREEN_WIDTH    = 480;              // スクリーン幅
var SCREEN_HEIGHT   = 640;              // スクリーン高さ
var SCREEN_CENTER_X = SCREEN_WIDTH/2;   // スクリーン幅の半分
var SCREEN_CENTER_Y = SCREEN_HEIGHT/2;  // スクリーン高さの半分
var MAP_SPLITS_WIDTH = SCREEN_WIDTH/16; //  enemy_mapの出現単位
var ASSETS = {
    "PLAYER": "e/s_player.png",
    "title_bg": "e/title_back.png",
    "BGM_TITLE": "se/sht_a02.mp3",
    "BGM_MAIN": "se/sht_a05.mp3",
    "ENTER": "se/enter.mp3",
    "SE_CRASH": "se/se_crash.mp3",
    "SE_SHOT": "se/se_shot.mp3",
    "SE_DSHOT": "se/se_dshot2.mp3",
    "SE_CHARGE": "se/se_charge.mp3",
    "E_SHOT_1": "e/e_shot1.png",
    "E_SHOT_2": "e/e_shot2.png",
    "E_SHOT_3": "e/e_shot3.png",
    "ENEMY1": "e/enemy1.png",
    "ENEMY2": "e/enemy1.png",
};

// 5秒に1回くらい回る
var enemy_map = [
    "00000000000000000000",
    "00000100020200010000",
    "00000001000001000000",
    "00000000002020200000",
    "00000000002020200000",
    "00000202020000000000",
    "00000202020000000000",
/*
    "00000000000000000000",
    "00000000000000000000",
    "00000000000000100000",
    "00000000000000000000",
    "00000010000000000000",
    "00000000000000000000",
    "00000000000000100000",
    "00000000000000000000",
    "00000010000000000000"
*/
];

// main
tm.main(function() {
    // キャンバスアプリケーションを生成
    var app = tm.display.CanvasApp("#world");
    // リサイズ
    app.resize(SCREEN_WIDTH, SCREEN_HEIGHT);
    // ウィンドウにフィットさせる
    app.fitWindow();
    app.fps = 30;
    
    // ローダーで画像を読み込む
    var loading = tm.ui.LoadingScene({
        assets: ASSETS,
        width: SCREEN_WIDTH,
        height: SCREEN_HEIGHT,
    });
    
    // 読み込み完了後に呼ばれるメソッドを登録
    loading.onload = function() {
        // メインシーンに入れ替える
        var scene = TitleScene();
        //var scene = MainScene();
        scene.init();
        app.replaceScene(scene);
    };
    // ローディングシーンに入れ替える
    app.replaceScene(loading);

    // 実行
    app.run();
});

// --------------------------------------------
// メインシーン
// --------------------------------------------
tm.define("MainScene", {
    superClass: "tm.app.Scene",
    
    init: function() {
        this.superInit();
        this.scene_count = 0;

        // BGM
        this.bgm = tm.asset.AssetManager.get("BGM_MAIN");
        this.bgm.loop = true;
        this.bgm.play();

        // 効果音
        this.se_crash = tm.asset.AssetManager.get("SE_CRASH");
        this.se_charge = tm.asset.AssetManager.get("SE_CHARGE");
        this.se_dshot = tm.asset.AssetManager.get("SE_DSHOT");
        this.se_shot = tm.asset.AssetManager.get("SE_SHOT");


        // 背景
        //this.bg = tm.display.Sprite("bg").addChildTo(this);
        //this.bg.origin.set(0, 0);
        
        // assets で指定したキーを指定することで画像を表示
        this.player = tm.display.Sprite("PLAYER").addChildTo(this);
        this.player.setPosition(SCREEN_CENTER_X, SCREEN_CENTER_Y+160).setScale(2, 2);
        this.player.downFlags = false;
        this.keyZ_count = 0;

        //
        this.gameover_label = tm.display.Label("GAME OVER").addChildTo(this);
        this.gameover_label.setPosition(SCREEN_CENTER_X, SCREEN_CENTER_Y);
        this.gameover_label.setScale(0,0);

        // 弾
        this.shoots = [];
        this.enemies = []
    },
    
    update: function(app) {
        if(this.player.downFlags==false){
            this.scene_count++;
            this.__GenerateEnemy(app);
            this.__PlayerAction(app);
            this.__EnemyAction(app);
            this.__ShootsMove(app);
            this.__HitCheck(app);
            this.__ClearObjects(app);
        }else{
            // ゲームオーバー
            if(!this.se_crash.isPlay){
                // 爆発音が終わった後
                this.gameover_label.setScale(2,2);
            }
        }
    },
    __ClearObjects: function(app){
        var en = this.enemies;
        var enlen = en.length;
        var sh = this.shoots;
        var shlen = sh.length;

        // 敵 - 消滅
        for(var i = 0; i < enlen; i++){
            if(en[i].y < -800 || en[i].hp <= 0){
                // エリア外
                en[i].remove();
                en.splice(i--,1);
                enlen=en.length;
            }
        }

        // 弾 - 消滅
        for(var i = 0; i < shlen; i++){
            if(sh[i].y < -40 || sh[i].hp <= 0){
                // エリア外, HPなし
                sh[i].remove();
                sh.splice(i--,1);
                shlen=sh.length;
            }
        }

    },

    __EnemyAction: function(app){
        var en = this.enemies;
        var len = this.enemies.length;
        for(var i = 0; i < len; i++){
            en[i].func(this.player);
        }

    },

    __GenerateEnemy: function(app){
        var line = parseInt(this.scene_count/150);
        if(this.scene_count%150 != 1){
            return;
        }
        if(enemy_map.length-1 > line){
            var dat = enemy_map[enemy_map.length-line-1].split("");
        }else{
            return;
        }

        for(var i in dat){
            //console.log(i,dat[i]);
            this.__CreateEnemy(app,dat[i],i);
        }
    },

    __CreateEnemy: function(app,id,x){
        var e = null;
        var xpos = (x-2)*MAP_SPLITS_WIDTH;
        id = parseInt(id);
        switch(id){
        default:
        case (0):
            break;
        case (1):
            // プレーヤの少し手前のYで折り返すやつ5体
            this.__CreateEnemy1(app,xpos);
            break;
        case (2):
            // サインカーブで動くやつ2体
            this.__CreateEnemy2(app,xpos);
            break;
        }
    },

    __CreateEnemy2: function(app,xpos){
        var e = null;
        for(var i = 0; i < 2; i++){
            e = tm.display.Sprite("ENEMY2").addChildTo(this);
            e.hp = 2;
            e.__x = -0.3*i; //sin計算のx
            e.setPosition(xpos, -60-i*80).setScale(2, 2);
            e.func = function(player){
                this.x = xpos+Math.sin(this.__x)*80;
                this.__x += 0.04;
                this.y += 2;
            }
            this.enemies.push(e);
        }
    },

    __CreateEnemy1: function(app,xpos){
        var e = null;
        for(var i = 0; i < 5; i++){
            e = tm.display.Sprite("ENEMY1").addChildTo(this);
            e.hp = 2;
            e.setPosition(xpos, -60-i*80).setScale(2, 2);
            e.count = 0;
            e.mode = 0;
            e.movex = 0;
            e.movey = 0;
            e.func = function(player){
                var movey = 4;
                this.count ++;
                switch(this.mode){
                case (0): // 真下へ
                    this.movex = 0;
                    this.movey = movey;
                    if(player.y-100<this.y){
                        this.mode = 1;
                        this.count = 0;
                    }
                    break;
                case (1): // playerの方に向かう
                    if(this.x < player.x){
                        this.movex = 5;
                    }else{
                        this.movex = -5;
                    }
                    this.movey = 0;
                    this.mode = 2;
                    break;
                case (2): // playerの方に向かう
                    if(this.count > 40){
                        this.mode = 3;
                    }
                    break;
                case (3): // 上に戻る
                    this.movex = 0;
                    this.movey = -movey;
                    break;
                }
                this.y += this.movey;
                this.x += this.movex;
                if(this.x > SCREEN_WIDTH-40){
                    this.x = SCREEN_WIDTH-40;
                }
                if(this.x < 40){
                    this.x = 40;
                }
            }
            this.enemies.push(e);
        }
    },

    __HitCheck: function(app){
        // 弾と敵
        for(var j in this.shoots){
            if(this.shoots[j].player){
                for(var i in this.enemies){
                    if( this.shoots[j].isHitElement(this.enemies[i]) ){
                        var life = this.enemies[i].hp;
                        this.enemies[i].hp -= this.shoots[j].hp;
                        this.shoots[j].hp -= life;
                    }
                }
            }
        }

        // 弾とプレーヤ
        for(var i in this.enemies){
            if( this.player.isHitElement(this.enemies[i]) ){
                this.player.downFlags = true;
            }
        }

        // 敵とプレーヤ


        // 死んだ
        if(this.player.downFlags){
            this.bgm.stop();            
            this.se_crash.play();
        }
    },

    __PlayerAction: function(app){
        this.__PlayerMove(app);
        this.__PlayerShoot(app);
    },

    __PlayerMove: function(app){
        var key = app.keyboard;
        var move = 5;
        if(key.getKey("left")){
            this.player.x -= move;
        }
        if(key.getKey("right")){
            this.player.x += move;
        }
        if(key.getKey("up")){
            this.player.y -= move;
        }
        if(key.getKey("down")){
            this.player.y += move;
        }
        if(this.player.x < 30)this.player.x = 30;
        if(this.player.y < 60)this.player.y = 60;
        if(this.player.x > SCREEN_WIDTH- 30)this.player.x = SCREEN_WIDTH- 30;
        if(this.player.y > SCREEN_HEIGHT- 60)this.player.y = SCREEN_HEIGHT- 60;
    },
    __PlayerShoot: function(app){
        var key = app.keyboard;

        // countup
        if(key.getKey("Z")){
            this.keyZ_count++;
        } else {
            // パワーショット1,2
            if(key.getKeyUp("Z") && this.keyZ_count > 100){
                this.keyZ_count=-2;
            }else if(key.getKeyUp("Z") && this.keyZ_count > 30){
                this.keyZ_count=-1;
            }else{
                this.keyZ_count=0;
            }
        }

        // ノーマルショット
        if(this.keyZ_count%8==1){
            this.__CreateBullet(app,"player",1);
        }

        // パワーショット1
        if(this.keyZ_count==-1){
            this.__CreateBullet(app,"player",2);
        } else if(this.keyZ_count==-2){
            this.__CreateBullet(app,"player",3);
        }
    },
    __ShootsMove: function(){
        var sh = this.shoots;
        var len = this.shoots.length;
        for(var i = 0; i < len; i++){
            if(typeof(sh[i].func)=="undefined"){
                sh[i].y -= 15;
            }else{
                sh[i].func();
            }
        }
    },
    __CreateBullet: function(app,mode,level){
        if(mode==="player"){
            var p = this.player;
            if(level===1){
                var s = tm.display.Sprite("E_SHOT_1").addChildTo(this);
                s.hp = 1;
                s.setScale(3,3);
                this.se_shot.clone().play();
            }else if(level===2){
                var s = tm.display.Sprite("E_SHOT_2").addChildTo(this);
                s.hp = 4;
                s.func = function(){
                    this.y -= 20;
                }
                s.setScale(3,3);
                this.se_dshot.clone().play();
            }else if(level===3){
                var s = tm.display.Sprite("E_SHOT_3").addChildTo(this);
                s.hp = 14;
                s.func = function(){
                    this.y -= 30;
                }
                s.setScale(5,5);
                this.se_charge.clone().play();
            }
            s.player = true;
            s.setPosition(p.x,p.y-20);
            this.shoots.push(s);
        }

    }
});

// --------------------------------------------
// タイトルシーン
// --------------------------------------------
tm.define("TitleScene", {
    superClass: "tm.app.Scene",
    
    init: function() {
        this.superInit();

        // グローバルカウンタ
        this.scene_count = 0;

        // 音
        this.bgm = tm.asset.AssetManager.get("BGM_TITLE");
        this.bgm.loop = true;
        this.bgm.play();
        this.se_enter = tm.asset.AssetManager.get("ENTER");

        this.TITLE_TEXT = {
            title: "1晩シューティング",
            tapme: "tap me !!"
        }

        // assets で指定したキーを指定することで画像を表示
        // 背景
        this.bg1 = tm.display.Sprite("title_bg").addChildTo(this);
        this.bg1.origin.set(0, 0);
        this.bg1.setPosition(0,0);
        this.bg2 = tm.display.Sprite("title_bg").addChildTo(this);
        this.bg2.origin.set(0,0);
        this.bg2.setPosition(0,-640);
        
        // ラベル
        this.label = tm.display.Label(this.TITLE_TEXT.title).addChildTo(this);
        this.label.setPosition(SCREEN_CENTER_X, SCREEN_CENTER_Y-64);
        this.label.setScale(2,2)

        // tap me
        this.tapme = tm.display.Label(this.TITLE_TEXT.tapme).addChildTo(this);
        this.tapme.setPosition(SCREEN_CENTER_X, SCREEN_CENTER_Y+100);
        this.tapme.setScale(2,2);

        // taped
        this.tapped_count = 0;
    },
    
    update: function(app) {
        var res = false;
        this.scene_count += 1;

        if(this.tapped_count === 0){
            this.defaultaction(app);
            this.tapaction(app);
        }else{
            this.tapped_count += 1;
            res = this.tappedaction(app);
        }

        if(res){
            this.se_enter.stop();
            app.replaceScene(MainScene());
        }
    },

    defaultaction: function(app){

        // 背景をくるくるまわす
        this.bg1.y += 1;
        this.bg2.y += 1;
        if(this.bg1.y > 640){
            this.bg1.y = -640;
        }
        if(this.bg2.y > 640){
            this.bg2.y = -640;
        }

        // tap me点滅
        if( this.scene_count%36 > 18){
            this.tapme.setScale(0,0);
        }else{
            this.tapme.setScale(2,2);
        }

    },

    tapaction: function(app){
        var pointing = app.pointing;
        if(pointing.getPointing() || app.keyboard.getKey("Z")){
            this.tapped_count = 1;
            this.bgm.stop();
            this.se_enter.play();
        }
    },

    tappedaction: function(){
        // tap me点滅
        if( this.scene_count%8 > 4){
            this.tapme.setScale(0,0);
        }else{
            this.tapme.setScale(2,2);
        }

        if(this.tapped_count>80){
            return true;
        }
        return false;
    }
});


