window.app = new Vue({
    el: '#app',
    data() {
        return {
            sdkappid: 1400352261,
            account: 'user',
            userSig: 'eJwtzMEOgjAQBNB-6dmQ7dKlhMSDMYYLJzDeIVS7KloBUWL8dxvqaTJvkvmIfVFFk*lFJjACsVo6t*Y28pEXfg4*gg-tpXaOW5FJBRATYiLDYt6Oe*OdiBAAgo7cLZYmKaFW8f*FT-7WVOmuvGJd2IIa*VB5rzVuDnZrdUeNLV9lfh6gmaf5vhbfH*EoMQI_',
            //board(涂鸦)
            tic: null,
            drawEnable: true, //是否可以涂鸦
            synDrawEnable: true, //是否将你画的涂鸦同步给其他人
            toolType: 1,
            brushThin: 100,
            backgroundImage: "背景图",
            backgroundImageH5: "背景图H5",
            backgroundColor: "#ff0000",
            globalBackgroundColor: "#ff0000",
            brushColor: "#ff0000",
            textColor: "#ff0000",
            textStyle: "#ff0000",
            textFamily: "sans-serif,serif,monospace",
            textSize: 320,
            scaleSize: 100,
            fitMode: 1,
            ration: "16:9",
            canRedo: 0,
            canUndo: 0,

            //board(白板操作)
            teduBoard: null,
            boardData: {
                currentBoardId: null, //当前白板ID
                boardIdlist: [], //白板ID列表
                current: 0, //当前白板index
                total: 0 //总页数
            },

            //当前用户状态
            STATUS_UNINIT: 0,
            STATUS_UNLOGIN: 1,
            STATUS_LOGINED: 2,
            STATUS_INCLASS: 3,
            status: 0,

            //board(文件操作)
            currentFileId: null, // 当前文件Id
            fileInfoList: [], // 所有文件信息
            thumbUrls: [], // 缩略图

            form: {
                name: 'user',
                roomID: ''
            }
        }
    },
    created() {
        this.init()
    },
    methods: {
        init() {
            var that = this
            this.initData();
            this.tic = new TIC({});
            this.tic.init(that.sdkappid, res => {
                if (res.code) {
                    console.log('初始化失败', res)
                } else {
                    console.log('初始化成功', this.tic)
                    this.status = this.STATUS_UNLOGIN;
                }
            });
        },
        login() {
            this.tic.login({
                userId: this.account,
                userSig: this.userSig
            }, (res) => {
                if (res.code) {
                    this.$message.error('登陆失败')
                } else {
                    this.$message.success('登录成功');
                    // 增加事件监听
                    this.status = this.STATUS_LOGINED;
                }
            });
        },
        initData() {
            this.drawEnable = true; //是否可以涂鸦
            this.synDrawEnable = true; //是否将你画的涂鸦同步给其他人
            this.toolType = 1;
            this.brushThin = 100;
            this.backgroundImage = "背景图";
            this.backgroundImageH5 = "背景图H5";
            this.backgroundColor = "#ff0000";
            this.globalBackgroundColor = "#ff0000";
            this.brushColor = "#ff0000";
            this.textColor = "#ff0000";
            this.textStyle = "#ff0000";
            this.textFamily = "sans-serif,serif,monospace";
            this.textSize = 320;
            this.scaleSize = 100;
            this.fitMode = 1;
            this.ration = "16:9";
            this.canRedo = 0;
            this.canUndo = 0;
        },
        createClassroom() {
            if (!this.form.roomID) {
                this.$message.error('房间号不能为空');
                return;
            }

            this.tic.createClassroom({
                classId: this.form.roomID,
                classScene: TIC.CONSTANT.TICClassScene.TIC_CLASS_SCENE_VIDEO_CALL // 1：直播模式 0: 实时模式
            }, (res) => {
                if (res.code) {
                    if (res.code == 10021) {
                        this.$message.info('该课堂已被他人创建，请直接加入');
                        this.joinClassroom()
                    } else if (res.code == 10025) {
                        this.$message.info('您已经创建过这个课堂，请直接加入');
                        this.joinClassroom()
                    } else {
                        this.$message.error('房间创建失败');
                    }
                } else {
                    this.$message.success('房间创建成功');
                    this.joinClassroom()
                }
            });
        },
        joinClassroom() {
            this.tic.joinClassroom({
                // compatSaas: true,
                classId: this.form.roomID
            }, {
                // mode: TIC.CONSTANT.TICClassScene.TIC_CLASS_SCENE_LIVE //直播模式，支持1000人以上场景
                mode: TIC.CONSTANT.TICClassScene.TIC_CLASS_SCENE_VIDEO_CALL, // //实时通话模式，支持1000人以下场景，低延时
                // role: TIC.CONSTANT.TICRoleType.TIC_ROLE_TYPE_ANCHOR // 主播，只在TIC.CONSTANT.TICClassScene.TIC_CLASS_SCENE_LIVE模式下有效
                // role: TIC.CONSTANT.TICRoleType.TIC_ROLE_TYPE_AUDIENCE // 观众（观众角色没有发布本地流的权限，只有收看远端流的权限。如果观众想要连麦跟主播互动， 请先通过 switchRole() 切换角色到主播 anchor 后再发布本地流），只在TIC.CONSTANT.TICClassScene.TIC_CLASS_SCENE_LIVE模式下有效
            }, {
                id: 'paint_box',
                ratio: '16:9',
                smoothLevel: 0,
                boardContentFitMode: 1,
                toolType: 1,
            }, res => {
                if (res.code) {
                    this.$message.error('加入课堂失败')
                    console.log(res)
                } else {
                    this.status = this.STATUS_INCLASS;
                    this.$message.success('加入课堂成功');
                    window.teduBoard = this.teduBoard = this.tic.getBoardInstance();
                    this.initBoardEvent();
                }
            });
        },
        quitClassroom(callback) {
            this.tic.quitClassroom(res => {
                if (res.code) {
                    this.$message.error('退出课堂失败')
                } else {
                    this.initData();
                    this.status = this.STATUS_LOGINED;
                    this.$message.success('退出课堂成功');
                    this.destoryClassRoom()
                }
            });
        },
        destoryClassRoom() {
            this.tic.destroyClassroom(this.form.roomID, res => {
                if (res.code) {
                    this.$message.error('销毁课堂失败');
                } else {
                    this.$message.success('销毁课堂成功');
                }

            })
        },
        // 监听白板事件（按需监听）
        initBoardEvent() {
            var teduBoard = this.teduBoard;
            // 撤销状态改变
            teduBoard.on(TEduBoard.EVENT.TEB_OPERATE_CANUNDO_STATUS_CHANGED, (enable) => {
                this.canUndo = enable ? 1 : 0;
                console.log('======================:  ', 'TEB_OPERATE_CANUNDO_STATUS_CHANGED', enable ? '可撤销' : '不可撤销');
            });

            // 重做状态改变
            teduBoard.on(TEduBoard.EVENT.TEB_OPERATE_CANREDO_STATUS_CHANGED, (enable) => {
                this.canRedo = enable ? 1 : 0;
                console.log('======================:  ', 'TEB_OPERATE_CANREDO_STATUS_CHANGED', enable ? '可恢复' : '不可恢复');
            });

            // 新增白板
            teduBoard.on(TEduBoard.EVENT.TEB_ADDBOARD, (boardIds, fid) => {
                console.log('======================:  ', 'TEB_ADDBOARD', ' boardIds:', boardIds, ' fid:', fid);
                this.proBoardData();
            });

            // 白板同步数据回调(收到该回调时需要将回调数据通过信令通道发送给房间内其他人，接受者收到后调用AddSyncData接口将数据添加到白板以实现数据同步)
            // TIC已经处理好了，可忽略该事件
            teduBoard.on(TEduBoard.EVENT.TEB_SYNCDATA, (data) => {
                console.log('======================:  ', 'TEB_SYNCDATA');
            });

            // 收到白板初始化完成事件后，表示白板已处于正常工作状态（此时白板为空白白板，历史数据尚未拉取完成）
            teduBoard.on(TEduBoard.EVENT.TEB_INIT, () => {
                console.log('======================:  ', 'TEB_INIT');
                this.$message.info('TIC', "onTEBInit finished");
            });

            teduBoard.on(TEduBoard.EVENT.TEB_HISTROYDATA_SYNCCOMPLETED, () => {
                console.log('======================:  ', 'TEB_HISTROYDATA_SYNCCOMPLETED');
                this.$message.info('TIC', "onTEBHistory Sync Completed finished");
            });

            // 白板错误回调
            teduBoard.on(TEduBoard.EVENT.TEB_ERROR, (code, msg) => {
                console.error('======================:  ', 'TEB_ERROR', ' code:', code, ' msg:', msg);
                this.$message.info('TIC', "onTEBError code=" + code + " msg:" + msg);
            });

            // 白板警告回调
            teduBoard.on(TEduBoard.EVENT.TEB_WARNING, (code, msg) => {
                console.error('======================:  ', 'TEB_WARNING', ' code:', code, ' msg:', msg);
                this.$message.info('TIC', "onTEBWarning code=" + code + " msg:" + msg);
            });

            // 图片状态加载回调
            teduBoard.on(TEduBoard.EVENT.TEB_IMAGE_STATUS_CHANGED, (status, data) => {
                console.log('======================:  ', 'TEB_IMAGE_STATUS_CHANGED', ' status:', status, ' data:', data);
            });

            // 删除白板页回调
            teduBoard.on(TEduBoard.EVENT.TEB_DELETEBOARD, (boardIds, fid) => {
                console.log('======================:  ', 'TEB_DELETEBOARD', ' boardIds:', boardIds, ' fid:', fid);
                this.proBoardData();
            });

            // 跳转白板页回调
            teduBoard.on(TEduBoard.EVENT.TEB_GOTOBOARD, (boardId, fid) => {
                console.log('======================:  ', 'TEB_GOTOBOARD', ' boardId:', boardId, ' fid:', fid);
                this.proBoardData();
            });

            // ppt动画步数改变回调
            teduBoard.on(TEduBoard.EVENT.TEB_GOTOSTEP, (step, count) => {
                console.log('======================:  ', 'TEB_GOTOSTEP', ' step:', step, ' count:', count);
            });

            // 增加H5动画PPT文件回调
            teduBoard.on(TEduBoard.EVENT.TEB_ADDH5PPTFILE, (fid) => {
                console.log('======================:  ', 'TEB_ADDH5PPTFILE', ' fid:', fid);
                this.proBoardData();
            });

            // 增加文件回调
            teduBoard.on(TEduBoard.EVENT.TEB_ADDFILE, (fid) => {
                console.log('======================:  ', 'TEB_ADDFILE', ' fid:', fid);
                this.proBoardData();
            });

            // 增加转码文件回调
            teduBoard.on(TEduBoard.EVENT.TEB_ADDTRANSCODEFILE, (fid) => {
                console.log('======================:  ', 'TEB_ADDTRANSCODEFILE', ' fid:', fid);
                this.proBoardData();
            });
            // 增加Images文件回调
            teduBoard.on(TEduBoard.EVENT.TEB_ADDIMAGESFILE, (fid) => {
                console.log('======================:  ', 'TEB_ADDIMAGESFILE', ' fid:', fid);
                this.proBoardData();
            });

            // 删除文件回调
            teduBoard.on(TEduBoard.EVENT.TEB_DELETEFILE, (fid) => {
                console.log('======================:  ', 'TEB_DELETEFILE', ' fid:', fid);
                this.proBoardData();
            });

            // 文件上传状态
            teduBoard.on(TEduBoard.EVENT.TEB_FILEUPLOADSTATUS, (status, data) => {
                console.log('======================:  ', 'TEB_FILEUPLOADSTATUS', status, data);
                if (status === 1) {
                    this.showTip('上传成功');
                } else {
                    this.showTip('上传失败');
                }
                document.getElementById('file_input').value = '';
            });

            // 切换文件回调
            teduBoard.on(TEduBoard.EVENT.TEB_SWITCHFILE, (fid) => {
                console.log('======================:  ', 'TEB_SWITCHFILE', ' fid:', fid);
                this.proBoardData();
            });

            // 上传背景图片的回调
            teduBoard.on(TEduBoard.EVENT.TEB_SETBACKGROUNDIMAGE, (fileName, fileUrl, userData) => {
                console.log('======================:  ', 'TEB_SETBACKGROUNDIMAGE', '  fileName:', fileName, '  fileUrl:', fileUrl, ' userData:', userData);
            });

            // 增加图片元素
            teduBoard.on(TEduBoard.EVENT.TEB_ADDIMAGEELEMENT, (fileName, fileUrl, userData) => {
                console.log('======================:  ', 'TEB_ADDIMAGEELEMENT', '  fileName:', fileName, '  fileUrl:', fileUrl, ' userData:', userData);
            });

            // 文件上传进度
            teduBoard.on(TEduBoard.EVENT.TEB_FILEUPLOADPROGRESS, (data) => {
                console.log('======================:  ', 'TEB_FILEUPLOADPROGRESS:: ', data);
                this.showTip('上传进度:' + parseInt(data.percent * 100) + '%');
            });

            // H5背景加载状态
            teduBoard.on(TEduBoard.EVENT.TEB_H5BACKGROUND_STATUS_CHANGED, (status, data) => {
                console.log('======================:  ', 'TEB_H5BACKGROUND_STATUS_CHANGED:: status:', status, '  data:', data);
            });

            // 转码进度
            teduBoard.on(TEduBoard.EVENT.TEB_TRANSCODEPROGRESS, res => {
                console.log('=======  TEB_TRANSCODEPROGRESS 转码进度：', JSON.stringify(res));
                if (res.code) {
                    this.showErrorTip('转码失败code:' + res.code + ' message:' + res.message);
                } else {
                    let status = res.status;
                    if (status === 'ERROR') {
                        this.showErrorTip('转码失败');
                    } else if (status === 'UPLOADING') {
                        this.showTip('上传中，当前进度:' + parseInt(res.progress) + '%');
                    } else if (status === 'CREATED') {
                        this.showTip('创建转码任务');
                    } else if (status === 'QUEUED') {
                        this.showTip('正在排队等待转码');
                    } else if (status === 'PROCESSING') {
                        this.showTip('转码中，当前进度:' + res.progress + '%');
                    } else if (status === 'FINISHED') {
                        this.showTip('转码完成');
                        this.teduBoard.addTranscodeFile({
                            url: res.resultUrl,
                            title: res.title,
                            pages: res.pages,
                            resolution: res.resolution
                        });
                    }
                }
            });
        },
        /**
         * 白板事件回调处理
         * @param {*} data 
         */
        proBoardData(data) {
            this.fileInfoList = this.teduBoard.getFileInfoList();
            this.currentFileId = this.teduBoard.getCurrentFile();
            this.thumbUrls = this.teduBoard.getThumbnailImages(this.currentFileId);
            var fileInfo = this.teduBoard.getFileInfo(this.currentFileId);
            if (fileInfo) {
                this.boardData = {
                    currentBoardId: this.currentFileId,
                    boardIdlist: this.teduBoard.getFileBoardList(this.currentFileId),
                    current: fileInfo.currentPageIndex + 1,
                    total: fileInfo.pageCount
                }
            }
        },
    }
})