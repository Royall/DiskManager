/**
 * Created by liuwei on 2016/3/1.
 */
define([
    'jquery',
    'underscore',
    "validate",
    "text!../../template/userManager.html",
    "controls/Common",
    'i18n/' + global.language,
    'controls/List',
    'controls/Ajax',
    "controls/Pager",
    'controls/Dialog',
    'controls/DeptUserBox',
    "dropkick",
    "zTree"
], function ($, _, validate, userManagerTpl, Common, Lang, List, Ajax, Pager, Dialog, DeptUserBox, dropkick, zTree) {

    window.global = window.global || {user: {}, corpList: {}};

    var uMLang = Lang.userManager,
        sLang = Lang.setting,
        cLang = Lang.common;

    var UserManage = {
        el: '.rightContainer',
        ui: {
            companyName: '#company-name',
            btnAddUser: '#add-user',
            btnImportUser: '#import-user',
            btnEditDepartment: '#edit-department',
            btnDeleteDepartment: '#delete-department',
            btnOutUser: '#out-user',
            btnDeleteUser: '#delete-user',
            btnAddDept: '#btnAddDept',
            btnGroup1: ".btn-group-1",
            btnGroup2: ".btn-group-2",
            btnGroup3: ".btn-group-3",
            userType: '#user-type',
            userList: '#user-list',
            btnAddUser2: '#add-user-2',
            userSearch: '#user-search',
            addUser: '#addUser',
            addDeptUser: '#addDeptUser'
        },
        model: {
            pageNo: 1,
            pageSize: 10,
            deptPageSize: 100,//获取部门的一页大小
            corpId: function () {
                var corpId = Common.parseURL(location.href).params.corpId;
                return window.global.user.corpId || corpId
            }(),
            corpData: function () {
                var corpId = window.global.user.corpId || Common.parseURL(location.href).params.corpId;
                return _.find(window.global.corpList, function (v) {
                    return v.corpId == corpId
                });
            }(),
            deptId: 0,
            deptIds: [0]
        },
        accountRule: null,
        /**
         * 初始化
         */
        init: function () {
            this.initList();
            this.initEvents();
            this.initTree();
            this.isInitialized = true;
            this.initData();
            this.getAccountRule();
        },

        /**
         * 初始化事件
         */
        initEvents: function () {

            if (this.isInitialized) {
                return
            }
            var me = this;

            //企业名点击
            $(this.ui.companyName).on('click', function () {
                me.initData();
            });

            //创建用户
            $(this.ui.btnAddUser).on('click', _.bind(me.addUser, this));

            $(this.ui.btnAddUser2).on('click', function () {
                $(this).find('.popList').toggle();
            });

            $(this.ui.addUser).on('click', function (e) {
                $(me.ui.btnAddUser2).find('.popList').hide();
                me.addUser();
                return false;
            });
            $(this.ui.addDeptUser).on('click', function (e) {
                $(me.ui.btnAddUser2).find('.popList').hide();
                me.addDeptUser();
                return false;
            });

            //批量导入用户
            $(this.ui.btnImportUser).on('click', _.bind(me.importUser, this));

            //修改部门设置
            $(this.ui.btnEditDepartment).on('click', _.bind(me.editDepartment, this));

            //删除部门
            $(this.ui.btnDeleteDepartment).on('click', _.bind(me.deleteDepartment, this));

            //移除部门
            $(this.ui.btnOutUser).on('click', _.bind(me.outUsers, this));

            //删除用户
            $(this.ui.btnDeleteUser).on('click', _.bind(me.deleteUsers, this));

            //添加部门
            $(this.ui.btnAddDept).on('click', _.bind(me.addDept, this));

            //搜索用户
            $(this.ui.userSearch).on('keyup', me.userSearch);

        },

        /**
         * 初始化列表
         */
        initList: function () {

            var me = this;

            this.list = this.list || new List({
                    container: '#user-list',
                    data: [],
                    hasCheckBtn: true,
                    key: 'uid',
                    rowClass: function (v) {
                        if (v.role == 'admin') {
                            return 'row-admin'
                        } else {
                            return false
                        }
                    },
                    columns: [
                        {
                            columnId: 'name',
                            columnName: uMLang.userName,
                            titleStyle: '',
                            titleAttr: 'width="20%"',
                            callback: function (value) {
                                //return ['<span class="tf"><a data-action="showDetail" href="javascript:;" title="',value,'">',value,'</a></span>'].join('')
                                return ['<span class="tf">', value, '</span>'].join('')
                            },
                            action: 'showDetail',
                            onClick: $.proxy(me.showDetail, me)
                        },
                        {
                            columnId: 'depts',
                            columnName: uMLang.depart,
                            titleStyle: '',
                            titleAttr: '',
                            callback: function (v) {
                                var depts = _.map(v, function (data) {
                                    return data.name
                                });
                                var deptsStr = depts.join('，') || uMLang.ungrouped;
                                return ['<span title="', deptsStr, '">', deptsStr, '</span>'].join('');
                            }
                        }
                    ],
                    operate: {
                        columnName: cLang.operate,
                        titleStyle: '',
                        titleAttr: '',
                        list: [
                            {
                                name: cLang.out,
                                action: 'out',
                                className: 'btn28 btn_white1 mr_5 out',
                                onClick: _.bind(me.outUser, me)
                            },
                            {
                                name: cLang.setting,
                                action: 'edit',
                                className: 'btn28 btn_white1 mr_5 edit',
                                onClick: _.bind(me.editUser, me)
                            },
                            {
                                name: cLang.del,
                                action: 'delete',
                                className: 'btn28 btn_white1 mr_5 delete',
                                onClick: _.bind(me.deleteUser, me)
                            }
                        ]
                    }
                });
        },

        /**
         * 初始化部门结构
         * @param data
         */
        initTree: function (data) {

            var me = this;

            var setting = {
                view: {
                    showLine: false,
                    showIcon: false,
                    selectedMulti: false,
                    dblClickExpand: false,
                    addDiyDom: addDiyDom
                },
                data: {
                    simpleData: {
                        enable: true,
                        idKey: 'deptId',
                        pIdKey: 'parentId',
                        rootPid: 0
                    }
                },
                async: {
                    type: 'POST',
                    enable: true,
                    url: me.dataAPI.getUrlByFnName('getDeptUsers') + "&type=subgrp",
                    contentType: 'text/plain; charset=UTF-8',
                    deptParam: ["corpId", "deptId"],
                    dataFilter: function (treeId, parentNode, responseData) {
                        if (responseData && responseData.code == "S_OK" && responseData['var']) {

                            _.map(responseData['var'].depts, function (v) {
                                return v.isParent = !v.leaf
                            });
                            return responseData['var'].depts
                        }
                    }
                },

                callback: {
                    onClick: function (event, treeId, treeNode, clickFlag) {
                        var corpId = treeNode.corpId,
                            deptId = treeNode.deptId;

                        this.getZTreeObj(treeId).expandNode(treeNode);

                        me.deptModel = treeNode;

                        me.setBtnStatus('dept');
                        me.getUser({
                            corpId: corpId,
                            deptIds: [deptId]
                        });
                    }
                }
            };


            function addDiyDom(treeId, treeNode) {
                var spaceWidth = 15;
                var switchObj = $("#" + treeNode.tId + "_switch"),
                    icoObj = $("#" + treeNode.tId + "_ico");
                switchObj.remove();
                icoObj.before(switchObj);

                var spaceStr = "<span style='display: inline-block;width:" + (spaceWidth * treeNode.level) + "px'></span>";
                switchObj.before(spaceStr);

            }

            _.map(data, function (v) {
                return v.isParent = !v.leaf
            });


            $.fn.zTree.init($("#depart"), setting, data);
        },

        /**
         * 初始化数据
         */
        initData: function () {
            var me = this;

            this.model.pageNo = 1;
            this.model.deptId = 0;
            this.model.deptIds = [0];

            this.getTopDpt(this.model.corpId);
            this.getTopUser(this.model.corpId);

            $('#company-name').text(me.model.corpData.name || '').attr('title', me.model.corpData.name || '');

            //this.initTree();
            this.setBtnStatus('top');
        },

        getAccountRule: function () {
            var me = this;
            //获取当前企业的密码安全信息，创建用户时使用
            var opts = {
                url: me.dataAPI.getUrlByFnName('getAccountRule'),
                data: {corpId: me.model.corpId},
                success: function (data) {
                    me.accountRule = {};
                    _.each(data, function (v) {
                        var ruleId = v.ruleId;
                        switch (ruleId) {
                            case 1:
                                me.accountRule.length = v;
                                break;
                            case 2:
                                me.accountRule.spChar = v;
                                break;
                            case 3:
                                me.accountRule.caps = v;
                                break;
                            case 4:
                                me.accountRule.weak = v;
                                break;
                            case 5:
                                me.accountRule.timeout = v;
                                break;
                            default:
                        }
                    });

                    //添加验证规则
                    $.validator.addMethod("spChar", function (value, element) {
                        var reg = new RegExp(me.accountRule.spChar.ruleValue);
                        return reg.test(value);
                    }, uMLang.spChar);


                    $.validator.addMethod("caps", function (value, element) {
                        var reg = new RegExp(me.accountRule.caps.ruleValue);
                        return reg.test(value);
                    }, uMLang.caps);

                    $.validator.addMethod("weak", function (value, element) {
                        var reg = new RegExp(me.accountRule.weak.ruleValue);
                        return !reg.test(value);
                    }, uMLang.weak);

                },
                fail: function (data) {
                    Dialog.tips(sLang.getSafeInfoFail+' '+(data.code||''));
                }
            };
            Ajax.request(opts, undefined, true);


        },
        /**
         * 刷新列表
         */
        refresh: function () {
            var me = this;

            this.getUser({
                corpId: me.model.corpId,
                deptIds: me.model.deptIds
            });
        },

        /**
         *更新页面按钮显示状态
         */
        setBtnStatus: function (status) {
            var $btnGroup1 = $(this.ui.btnGroup1),
                $btnGroup2 = $(this.ui.btnGroup2),
                $btnGroup3 = $(this.ui.btnGroup3),
                $userType = $(this.ui.userType),
                $userList = $(this.ui.userList);

            switch (status) {
                case 'top':
                    $btnGroup1.show();
                    $btnGroup2.hide();
                    $btnGroup3.hide();
                    $userType.text(uMLang.allUser);
                    $userList.addClass('list-top');
                    break;
                case 'dept':
                    $btnGroup1.hide();
                    $btnGroup2.show();
                    $btnGroup3.show();
                    $userType.text(uMLang.userList);
                    $userList.removeClass('list-top');
                    break;
                default:
            }

        },

        /**
         * 搜索用户件事件
         */
        userSearch: function (e) {
            var me = UserManage;
            me.setBtnStatus('top');
            var $this = $(this);
            var keyword = $this.val();
            if (e.keyCode == 13) {
                if (keyword == '') {
                    Dialog.tips(sLang.typeKeyword);
                } else {
                    me.userSearchReq(keyword);
                }
            } else if (((e.ctrlKey && e.keyCode == 88) || e.keyCode == 8 || e.keyCode == 46) && keyword == '') {
                me.getTopUser(me.model.corpId);
            }

        },

        /**
         * 搜索用户请求
         * @param keyword
         */
        userSearchReq: function (keyword) {

            $.fn.zTree.getZTreeObj('depart').cancelSelectedNode();

            var me = this;
            var opts = {
                url: me.dataAPI.getUrlByFnName('searchUser') + '&page=' + me.model.pageNo + '&pagesize=' + me.model.pageSize + '&matchrule=like',
                data: {corpId: me.model.corpId, name: keyword},
                success: function (data) {
                    //me.searchLoading.close();
                    me.list.setData(data.users);

                    if (!data.users.length) {
                        $('.pager').html('');
                        return
                    }

                    me.pager = new Pager({
                        el: '.pager',
                        pageNo: data.pageNo,
                        total: data.total,
                        pageSize: me.model.pageSize,
                        onclick: function (page) {
                            me.model.pageNo = page;
                            me.userSearchReq(keyword);
                        }
                    });


                },
                fail: function (data) {
                    //me.searchLoading.close();
                    Dialog.tips(cLang.searchFail+' '+(data.code||''));
                }
            };

            //me.searchLoading=Dialog.loading();
            Ajax.request(opts);


        },

        /**
         * 更新列表数据
         * @param data
         */
        setListData: function (data) {


        },

        /**
         * 获取顶级部门
         * @param corpId
         */
        getTopDpt: function (corpId) {
            var me = this;
            var opts = {
                url: me.dataAPI.getUrlByFnName('getDeptUsers') + '&page=1&pagesize=' + me.model.deptPageSize + '&type=subgrp',
                data: {"corpId": corpId, "deptIds": ["0"]},
                success: function (data) {

                    //console.log('顶级部门数据',data);
                    var tree = data.depts;
                    //
                    me.initTree(tree);
                    //me.topDeptLoading.close();
                },
                fail: function (data) {
                    Dialog.tips(uMLang.getDeptFail+' '+(data.code||''));
                }
            };
            Ajax.request(opts, false, true);
            //me.topDeptLoading=Dialog.loading();
        },

        /**
         * 获取企业所有用户
         * @param corpId
         */
        getTopUser: function (corpId) {
            var me = this;
            me.getUser({
                corpId: corpId,
                deptIds: ["0"],
                alluser: true
            })

        },

        /**
         * 返回部门下的user(不包括子部门中的)
         * @param opts
         */
        getUser: function (opts) {

            var me = this;

            me.model.corpId = opts.corpId;
            me.model.deptIds = opts.deptIds;

            var opt = {
                url: me.dataAPI.getUrlByFnName('getDeptUsers') + '&page=' + me.model.pageNo + '&pagesize=' + me.model.pageSize + '&type=' + (opts.alluser ? 'alluser' : 'user'),
                data: opts,
                success: function (data) {

                    //me.dataLoading.close();

                    me.list.setData(data.users);

                    if (!data.users.length) {
                        $('.pager').html('');
                        return
                    }

                    me.pager = new Pager({
                        el: '.pager',
                        pageNo: data.pageNo,
                        total: data.total,
                        pageSize: me.model.pageSize,
                        onclick: function (page) {
                            me.model.pageNo = page;
                            me.refresh();
                            //me.getDataByPage(page);
                        }
                    });

                },
                fail: function (data) {
                    Dialog.tips(uMLang.getUserInfoFail+' '+(data.code||''));
                    //me.dataLoading.close();
                }
            };

            //me.dataLoading=Dialog.loading();
            Ajax.request(opt);

        },


        /**
         * 表单验证
         */
        userValidate: function () {
            var me = this;

            $('#accountForm').validate({
                rules: {
                    'userId': {
                        required: true
                    },
                    'storageNum': {
                        required: true,
                        number: true
                    },
                    'email': {
                        email: true
                    },
                    'password': {
                        required: true,
                        spChar: !!me.accountRule.spChar.isCheck,
                        caps: !!me.accountRule.caps.isCheck,
                        weak: !!me.accountRule.weak.isCheck,
                        minlength: parseInt(me.accountRule.length.ruleValue, 10)
                    },
                    'password2': {
                        required: true,
                        spChar: !!me.accountRule.spChar.isCheck,
                        caps: !!me.accountRule.caps.isCheck,
                        weak: !!me.accountRule.weak.isCheck,
                        minlength: parseInt(me.accountRule.length.ruleValue, 10),
                        equalTo: "#password"
                    }
                },
                messages: {
                    'userId': {
                        required: uMLang.typeUserName
                    },
                    'storageNum': {
                        required: sLang.typeSpace,
                        number: sLang.typeNumber
                    },
                    email: {
                        email: uMLang.emailNotCorrect
                    },
                    'password': {
                        required: sLang.typePwd,
                        //spChar:true,
                        //caps:true,
                        //weak:true,
                        minlength: sLang.minPsw
                    },
                    'password2': {
                        //spChar:true,
                        //caps:true,
                        //weak:true,
                        minlength: sLang.minPsw,
                        required: sLang.typePwd2,
                        equalTo: sLang.pswNotEqual
                    }
                },
                wrapper: "div",
                errorPlacement: function (error, element) {
                    $(element).parent().append(error.prepend('<i class="i-warm ml_5"></i>'));
                }
            });


        },

        /**
         * 添加用户
         */
        addUser: function () {

            var me = this;

            var loading;
            var success = function (data) {
                Dialog.tips(uMLang.addUserSuc);
                //loading.close();
                me.refresh();


                //console.log('用户添加成功！',data);
            };

            var error = function (data) {
                Dialog.tips(uMLang.addUserFail+' '+(data.code||''));
                //loading.close();
                //console.log('用户添加失败！',data);
            };


            var tplStr = Common.getTemplate(userManagerTpl, '#creatAccount-tpl');
            var html = Common.tpl2Html(tplStr, {size: Common.formatStorageUnit(me.model.corpData.storage) + 'B'});

            var pop = Dialog.pop({
                title: uMLang.addUser,
                content: html,
                okRemovePop: false,
                ok: function () {

                    if (!$('#accountForm').valid()) {
                        return
                    }

                    var corpId = me.model.corpId;
                    var deptIds = me.model.deptIds;
                    var $creatAccount = $('#creatAccount');
                    var storage = Common.convertToB($creatAccount.find('.storageNum').val(), me.addUserUnitSelect.value);

                    //添加用户参数
                    var opts = {
                        "corpId": corpId,
                        "deptIds": deptIds,
                        "name": $creatAccount.find('.name').val(),
                        "userId": $creatAccount.find('.userId').val(),
                        "password": $creatAccount.find('.password').val(),
                        "email": $creatAccount.find('.email').val(),
                        "mobile": $creatAccount.find('.mobile').val(),
                        "role": 'normal',
                        "storage": storage,
                        "passFlag": $creatAccount.find('.passFlag').prop('checked') ? '1' : '0',
                        "createUser": window.global.user.role || 'admin'
                    };

                    Ajax.request({
                        url: me.dataAPI.getUrlByFnName('addUser'),
                        data: opts,
                        success: success,
                        fail: error
                    });
                    //loading=Dialog.loading();
                    pop.removePop();
                },
                onPop: function () {
                    me.addUserUnitSelect = new Dropkick($('#creatAccount .storageUnit')[0]);
                    me.userValidate();
                    Common.checkPswdLv('#password', '.pswd-lv');
                }
            });

        },

        /**
         * 添加已存在的用户到部门
         */
        addDeptUser: function () {
            var me = this;
            var deptUserBox = {};
            var addDeptUserPop;
            var loading = {};
            addDeptUserPop = Dialog.pop({
                title: uMLang.addDeptUser,
                content: '<div id="box"></div>',
                ok: function () {
                    var addData = deptUserBox.getSelected();

                    if (!addData.length) {
                        Dialog.tips(uMLang.selectUser);
                        return
                    }

                    var member = [];
                    _.each(addData, function (v) {
                        member.push(v.uid);
                    });

                    var opts = {
                        url: me.dataAPI.getUrlByFnName('manageDeptMember'),
                        data: {
                            op: 'add',
                            corpId: me.model.corpId,
                            deptId: me.model.deptIds[0],
                            member: member
                        },
                        success: function (data) {
                            //addDeptUserPop.removePop();
                            //loading.close();
                            Dialog.tips(uMLang.addDeptUserSuc);
                            me.refresh();
                        },
                        fail: function (data) {
                            Dialog.tips(uMLang.addDeptUserFail+' '+(data.code||''));
                            //loading.close();
                        }
                    };

                    Ajax.request(opts);
                    addDeptUserPop.removePop();
                    //loading=Dialog.loading();
                },
                okRemovePop: false,
                onPop: function () {
                    deptUserBox = new DeptUserBox({
                        el: '#box',
                        corpId: me.model.corpId
                    });
                }
            });

        },


        /**
         * 修改用户验证
         */
        editUserValidate: function () {
            var me = this;

            $('#accountSettingForm').validate({
                rules: {
                    'storageNum': {
                        required: true,
                        number: true
                    },
                    'email': {
                        email: true
                    },
                    'password': {
                        minlength: parseInt(me.accountRule.length.ruleValue, 10),
                        spChar: !!me.accountRule.spChar.isCheck,
                        caps: !!me.accountRule.caps.isCheck,
                        weak: !!me.accountRule.weak.isCheck
                    },
                    'password2': {
                        //required:true,
                        minlength: parseInt(me.accountRule.length.ruleValue, 10),
                        spChar: !!me.accountRule.spChar.isCheck,
                        caps: !!me.accountRule.caps.isCheck,
                        weak: !!me.accountRule.weak.isCheck,
                        equalTo: "#as-password"
                    }
                },
                messages: {
                    'storageNum': {
                        required: sLang.typeSpace,
                        number: sLang.typeNumber
                    },
                    email: {
                        email: uMLang.emailNotCorrect
                    },
                    'password': {
                        minlength: sLang.minPsw
                    },
                    'password2': {
                        minlength: sLang.minPsw,
                        equalTo: sLang.pswNotEqual
                    }
                },
                wrapper: "div",
                errorPlacement: function (error, element) {
                    $(element).parent().append(error.prepend('<i class="i-warm ml_5"></i>'));
                }
            });

        },
        /**
         * 修改用户
         * @param data
         */
        editUser: function (data) {
            //console.log('设置用户',data);

            var me = this;

            var pop;

            var editUserFn = function () {


                if (!$('#accountSettingForm').valid()) {
                    return
                }


                var $accountSetting = $('#accountSetting');

                var newModel = {
                    name: $accountSetting.find('.name').val(),
                    email: $accountSetting.find('.email').val(),
                    mobile: $accountSetting.find('.mobile').val(),
                    passFlag: $accountSetting.find('.passFlag').prop('checked') ? "1" : "0",
                    storage: Common.convertToB($accountSetting.find('.storageNum').val(), me.accountSettingUnitSelect.value)
                };

                if ($accountSetting.find('.password').val() != '' && $accountSetting.find('.password').val() != '') {
                    newModel.password = $accountSetting.find('.password').val()
                }

                //筛选出要更新的字段
                var updateData = _.omit(newModel, function (value, key, object) {
                    return me.userDetailModel[key] == value
                });


                pop.removePop();

                if (_.isEmpty(updateData)) {
                    return
                }

                updateData.uid = me.userDetailModel.uid;
                updateData.corpId = me.userDetailModel.corpId;


                var opts = {
                    url: me.dataAPI.getUrlByFnName('updateUser'),
                    data: updateData,
                    success: function (data) {
                        Dialog.tips(uMLang.updateUserSuc);
                        me.refresh();
                    },
                    fail: function (data) {
                        Dialog.tips(uMLang.updateUserFail+' '+(data.code||''));
                    }
                };

                Ajax.request(opts);


            };

            var getUserDetailSuccess = function (userData) {

                //console.log('用户详细信息',userData);

                me.userDetailModel = userData;

                var tplStr = Common.getTemplate(userManagerTpl, '#accountSetting-tpl');
                var storageObj = Common.formatStorageUnit(userData.storage);
                var storageObj2 = Common.formatStorageUnit(userData.storage, true);
                var usedStorageObj = Common.formatStorageUnit(userData.usedStorage);

                userData.storageNum = storageObj2.num;

                userData.storageObj = storageObj;
                userData.usedStorageObj = usedStorageObj;

                pop = Dialog.pop({
                    title: uMLang.userSetting,
                    content: Common.tpl2Html(tplStr, userData),
                    okRemovePop: false,
                    width: 460,
                    ok: editUserFn,
                    onPop: function () {
                        me.accountSettingUnitSelect = new Dropkick("#unitSelect");
                        me.accountSettingUnitSelect.select(storageObj2.unit.toString());

                        //左侧选项卡切换
                        $('#accountSetting .popUserSetL>ul>li').on('click.tab', function () {
                            var $this = $(this);
                            var index = $(this).index();
                            $this.addClass('act').siblings().removeClass('act');
                            var ul = $this.parents('.popUserSetL').next().find('.popUserSetRCon>ul');
                            ul.hide().eq(index).show();
                        });

                        me.editUserValidate();
                        Common.checkPswdLv('#as-password', '.pswd-lv');
                    },
                    closePop: function () {
                        $('#accountSetting .popUserSetL>ul>li').off('click.tab');
                    }
                });
            };

            this.getUserDetail({
                data: {"uid": data.uid, "corpId": data.corpId},
                success: getUserDetailSuccess,
                fail: function (data) {
                    //console.log(data)
                    if (data.code == 'UNACTIVED') {
                        Dialog.tips(uMLang.unactived);
                    } else {
                        Dialog.tips(uMLang.getUserInfoFail+' '+(data.code||''));
                    }
                    //console.warn('获取用户信息失败！');
                }
            });

        },

        /**
         * 获取用户详细信息
         */
        getUserDetail: function (opts) {
            var me = this;
            Ajax.request({
                url: me.dataAPI.getUrlByFnName('getUser'),
                data: opts.data,
                success: opts.success,
                fail: opts.fail
            });
        },

        /**
         * 显示用户详细信息
         */
        showDetail: function (data) {
            console.log(data)
        },

        /**
         * 删除用户
         * @param data
         */
        deleteUser: function (data) {
            var me = this;

            if (data.role == 'admin') {
                Dialog.alert(uMLang.cantDelAdmin);
                return
            }

            var loading = {};

            Dialog.confirm(cLang.tips, uMLang.confirmDel, function () {

                //loading=Dialog.loading();

                Ajax.request({
                    url: me.dataAPI.getUrlByFnName('batchDelUser') + "&corpId=" + data.corpId,
                    data: [{uid: data.uid}],
                    success: function () {
                        //loading.close();
                        Dialog.tips(uMLang.delUserSuc);
                        me.refresh();
                    },
                    fail: function (data) {
                        //loading.close();
                        Dialog.tips(uMLang.delUserFail+' '+(data.code||''));
                    }
                });

            });

        },

        /**
         * 批量删除用户
         */
        deleteUsers: function () {
            var me = this;
            var data = this.list.getSelected();
            if (!data.length) {
                Dialog.tips(uMLang.selectDelUser);
                return
            }

            //不能删除管理员
            var param = _.filter(data, function (v) {
                return v.role != 'admin'
            });

            param = _.map(param, function (v) {
                return {uid: v.uid}
            });

            if (!param.length) {
                Dialog.alert(uMLang.cantDelAdmin);
                return
            }

            var opts = {
                url: me.dataAPI.getUrlByFnName('batchDelUser') + "&corpId=" + data[0].corpId,
                data: param,
                success: function (data) {
                    Dialog.tips(uMLang.delUserSuc);
                    me.refresh();
                },
                fail: function (data) {
                    Dialog.tips(uMLang.delUserFail+' '+(data.code||''));
                    //console.log('批量删除用户失败',data);
                }
            };

            Dialog.confirm(cLang.tips, cLang.confirmDel, function () {
                Ajax.request(opts);
            });

        },


        /**
         * 从部门移除单个用户
         */
        outUser: function (data) {
            var me = this;

            var opts = {
                url: me.dataAPI.getUrlByFnName('manageDeptMember'),
                data: {
                    op: 'remove',
                    corpId: me.model.corpId,
                    deptId: me.model.deptIds[0],
                    member: [data.uid]
                },
                success: function (data) {
                    Dialog.tips(uMLang.outUserSuc);
                    me.refresh();
                },
                fail: function (data) {
                    Dialog.tips(uMLang.outUserFail+' '+(data.code||''));
                    //console.warn('移除用户失败',data);
                }
            };

            Dialog.confirm(cLang.tips, uMLang.outConfirm, function () {
                Ajax.request(opts);
            });
        },

        /**
         * 批量从部门移除用户
         */
        outUsers: function () {

            var me = this;
            var data = this.list.getSelected();

            if (!data.length) {
                Dialog.tips(uMLang.selectOutUser);
                return
            }

            var member = _.map(data, function (v) {
                return v.uid
            });

            var opts = {
                url: me.dataAPI.getUrlByFnName('manageDeptMember'),
                data: {
                    op: 'remove',
                    corpId: me.model.corpId,
                    deptId: me.model.deptIds[0],
                    member: member
                },
                success: function (data) {
                    Dialog.tips(uMLang.outUserSuc);
                    me.refresh();
                },
                fail: function (data) {
                    Dialog.tips(uMLang.outUserFail+' '+(data.code||''));
                }
            };

            Dialog.confirm(cLang.tips, uMLang.outConfirms, function () {
                Ajax.request(opts);
            });

        },

        /**
         * 导入用户
         */
        importUser: function () {
            var me = this;
            //console.log('批量导入用户');

            var importUserPop = Dialog.pop({
                title: uMLang.importUser,
                content: Common.tpl2Html(Common.getTemplate(userManagerTpl, '#importLead-tpl')),
                ok: function () {

                    var allowExt = '.xls,.xlsx';
                    var path = $('#file').val();

                    if (path == '') {
                        Dialog.alert(uMLang.selectFile);
                        return
                    } else if (allowExt.indexOf(Common.getFileExt(path)) <= -1) {
                        var str = Common.stringFormat(uMLang.fileTips, allowExt);
                        Dialog.alert(str);
                        return
                    }

                    if ($.browser.msie) {
                        $("#file-form")[0].submit();
                    } else {
                        $("#file-form").submit();
                    }

                    $('.upload-result').html(uMLang.uploading);

                },
                okText: uMLang.importBtn,
                okRemovePop: false,
                onPop: function () {
                    var uploadUrl = me.dataAPI.getUrlByFnName('uploadTemplate');
                    $('#file-form').attr('action', uploadUrl);


                    $('#file-upload-iframe').on('load', function () {

                        var $this = $(this)[0];
                        var data;
                        if ($this.contentWindow) {
                            data = $this.contentWindow.document.body ? $this.contentWindow.document.body.innerHTML : '{}';

                        } else if ($this.contentDocument) {
                            data = $this.contentDocument.document.body ? $this.contentDocument.document.body.innerHTML : '{}';
                        }

                        var rx = new RegExp("<pre.*?>(.*?)</pre>", "i"), am = rx.exec(data);
                        data = (am) ? am[1] : "";
                        data = (new Function("return " + data))();

                        if (data.code == 'S_OK') {
                            //$('.upload-result').html('文件上传成功，请稍后刷新页面查看部门用户数据！');
                            importUserPop.removePop();
                            Dialog.alert(uMLang.uploadTips);

                        } else {
                            $('.upload-result').html('<em style="color:#f00">' + uMLang.uploadFail + '</em>');
                        }

                    });

                }
            });
        },

        /**
         * 验证
         */
        deptAccountValidate: function () {

            var me = this;
            $('#deptAccountForm').validate({
                rules: {
                    'name': {
                        required: true
                    },
                    'storageNum': {
                        required: true,
                        number: true
                    },
                    'userLimit': {
                        required: true,
                        number: true
                    }
                },
                messages: {
                    'name': {
                        required: uMLang.typeDeptName
                    },
                    'storageNum': {
                        required: sLang.typeSpace,
                        number: sLang.typeNumber
                    },
                    'userLimit': {
                        required: sLang.typeUserLimit,
                        number: sLang.typeNumber
                    }
                },
                wrapper: "div",
                errorPlacement: function (error, element) {
                    $(element).parent().append(error.prepend('<i class="i-warm ml_5"></i>'));
                }
            });

        },

        /**
         * 添加部门
         */
        addDept: function () {
            var me = this;
            var tplStr = Common.getTemplate(userManagerTpl, '#creatDept-tpl');
            var data = {
                name: '',
                parentId: '',
                remark: '',
                storage: '',
                userLimit: '',
                storageObj: {
                    num: '',
                    unit: 'M'
                },
                size: Common.formatStorageUnit(me.model.corpData.storage) + 'B'
            };


            var pop = Dialog.pop({
                title: uMLang.addDept,
                content: ['<div id="addDept">', Common.tpl2Html(tplStr, data), '</div>'].join(''),
                okRemovePop: false,
                ok: function () {

                    if (!$('#deptAccountForm').valid()) {
                        return
                    }


                    var $addDept = $('#addDept');
                    var storage = Common.convertToB($addDept.find('.storageNum').val(), me.addDeptUnitSelect.value);

                    var param = {
                        url: me.dataAPI.getUrlByFnName('addDept'),
                        data: {
                            name: $addDept.find('.name').val(),
                            parentId: me.model.deptIds[0],
                            remark: $addDept.find('.remark').val(),
                            storage: storage,
                            userLimit: parseInt($addDept.find('.userLimit').val(), 10),
                            corpId: me.model.corpId
                        },
                        success: function (data) {
                            Dialog.tips(uMLang.addDeptSuc);
                            var treeObj = $.fn.zTree.getZTreeObj('depart');
                            var nodes = treeObj.getNodesByParam("deptId", me.model.deptIds[0], null);

                            if (data.parentId == 0) {
                                data.rootDeptId = data.deptId;
                            } else {
                                data.rootDeptId = me.deptModel.rootDeptId;
                            }


                            if (nodes.length) {
                                data.isParent = false;
                                treeObj.addNodes(nodes[0], data);
                            } else {
                                me.getTopDpt(me.model.corpId);
                            }

                            //todo:部门添加成功后调用用户平台接口
                            Ajax.request({
                                url:'/drive/service/corplib/corplib?func=corplib:addCorpLib',
                                data:{
                                    corpId:me.model.corpId,
                                    usn:window.global.user.usn,
                                    parentId:data.parentId,
                                    deptName:data.name,
                                    userId:window.global.user.userId,
                                    rootDeptId:data.rootDeptId,
                                    corpName:me.model.corpData.name,
                                    deptId:data.deptId
                                },
                                success: function (data) {
                                    console &&  console.log(data)
                                },
                                fail: function () {}
                            },false,true);


                        },
                        fail: function (data) {
                            Dialog.tips(uMLang.addDeptFail+' '+(data.code||''));
                        }
                    };
                    //发送新建部门请求
                    Ajax.request(param);
                    pop.removePop();
                },
                onPop: function () {
                    var $addDept = $('#addDept');
                    me.addDeptUnitSelect = new Dropkick($addDept.find('.storageUnit')[0]);
                    //me.editDeptUnitSelect.select(data.storageObj.unit);
                    me.deptAccountValidate();
                }
            });

        },

        /**
         * 获取部门详情
         */
        getDeptDetail: function (opts) {

            var me = this;
            Ajax.request({
                url: me.dataAPI.getUrlByFnName('getDeptDetail'),
                data: opts.data,
                success: opts.success,
                fail: opts.error
            });


        },

        /**
         * 修改部门设置
         */
        editDepartment: function () {
            var me = this;


            var opts = {
                data: {
                    corpId: me.model.corpId,
                    deptId: me.model.deptIds[0]
                },
                success: function (data) {

                    var tpl = Common.getTemplate(userManagerTpl, '#creatDept-tpl');

                    data.storageObj = Common.formatStorageUnit(data.storage, true);

                    data.size = Common.formatStorageUnit(me.model.corpData.storage) + 'B';

                    var name;

                    var pop = Dialog.pop({
                        title: uMLang.editDept,
                        content: ['<div id="editDept">', Common.tpl2Html(tpl, data), '</div>'].join(''),
                        okRemovePop: false,
                        ok: function () {

                            if (!$('#deptAccountForm').valid()) {
                                return
                            }


                            var $editDept = $('#editDept');
                            var storage = Common.convertToB($editDept.find('.storageNum').val(), me.editDeptUnitSelect.value);
                            var newModel = {
                                name: $editDept.find('.name').val(),
                                storage: storage,
                                userLimit: $editDept.find('.userLimit').val(),
                                remark: $editDept.find('.remark').val()
                            };

                            var updateModel = _.omit(newModel, function (value, key, object) {
                                return data[key] == value
                            });

                            if (_.isEmpty(updateModel)) {
                                return
                            }

                            name = updateModel.name;

                            updateModel.deptId = data.deptId;
                            updateModel.corpId = me.model.corpId;

                            var param = {
                                url: me.dataAPI.getUrlByFnName('updateDept'),
                                data: updateModel,
                                success: function () {
                                    Dialog.tips(uMLang.editDeptSuc);

                                    //如果改了名字，更新节点数据
                                    if (name) {
                                        var treeObj = $.fn.zTree.getZTreeObj('depart');
                                        var nodes = treeObj.getNodesByParam("deptId", updateModel.deptId, null);
                                        nodes[0].name = name;
                                        treeObj.updateNode(nodes[0]);
                                    }

                                },
                                fail: function (data) {
                                    Dialog.tips(uMLang.editDeptFail+' '+(data.code||''));
                                }
                            };
                            //发送修改部门请求
                            Ajax.request(param);
                            pop.removePop();
                        },
                        onPop: function () {
                            var $editDept = $('#editDept');
                            me.editDeptUnitSelect = new Dropkick($editDept.find('.storageUnit')[0]);
                            me.editDeptUnitSelect.select(data.storageObj.unit);

                            me.deptAccountValidate();
                        }
                    });


                },
                fail: function (data) {
                    Dialog.tips(uMLang.getDeptInfoFail+' '+(data.code||''));
                }
            };

            this.getDeptDetail(opts);
        },

        /**
         * 删除部门
         */
        deleteDepartment: function () {

            var me = this;

            Dialog.confirm(cLang.tips, uMLang.delDeptConfirm, function () {

                var opts = {
                    url: me.dataAPI.getUrlByFnName('delDept'),
                    data: {
                        corpId: me.model.corpId,
                        deptIds: me.model.deptIds
                    },
                    success: function () {
                        Dialog.tips(uMLang.delDeptSuc);
                        var treeObj = $.fn.zTree.getZTreeObj('depart');
                        var nodes = treeObj.getNodesByParam("deptId", me.model.deptIds[0], null);
                        treeObj.removeNode(nodes[0]);

                    },
                    fail: function (data) {
                        Dialog.tips(uMLang.delDeptFail+' '+(data.code||''));
                    }
                };

                Ajax.request(opts);

            });

        },

        /**
         * 数据接口定义
         */
        dataAPI: _.extend({}, Common.APIObj, {
            fnName: {
                addUser: 'user:addUser',//添加用户
                updateUser: 'user:updateUser',//修改用户
                delUser: 'user:delUser',//删除用户
                batchDelUser: 'user:batchDelUser',//批量删除用户
                getUser: 'user:getUser',//查询用户信息
                searchUser: 'user:searchUser',//搜索用户信息
                getAccountRule: 'account:getAccountRule',//获取账户密码安全设置项
                getDeptUsers: 'user:getDeptUsers',//查询部门用户信息
                removeUserDept: 'user:removeUserDept', //用户移出部门接口
                addDeptUser: 'user:addDeptUser',//
                manageDeptMember: 'user:manageDeptMember',
                addDept: 'dept:addDept', //新增部门
                updateDept: 'dept:updateDept', //更新部门
                getDeptDetail: 'dept:getDeptDetail', //部门详情
                delDept: 'dept:delDept', //删除部门
                uploadTemplate: 'upload:uploadTemplate'
            }
        })
    };


    return {
        init: function () {
            UserManage.init();
        }
    };
});