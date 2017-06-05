//index.js
//获取应用实例
var app = getApp()
var dialog = require("../../utils/dialog.js")
var wxNotificationCenter = require("../../utils/WxNotificationCenter.js")

Page({
   data: {
    contentList:[],
    currentType:wx.getStorageSync('currentType'),
    types:[],
    tabs: [],
    index:0,
    stv: {
      windowWidth: 0,
      lineWidth: 0,
      offset: 0,
      tStart: false
    },
    activeTab: 0
  },
  onShareAppMessage: function () {
    return { 
      title: '51明星图',
      desc: '帅锅美女明星一网打尽，快来看看吧。', 
      path: 'pages/index/index' 
    }
  },
  handlerStart(e) {
    let {clientX, clientY} = e.touches[0];
    this.startX = clientX;
    this.tapStartX = clientX;
    this.tapStartY = clientY;
    this.data.stv.tStart = true;
    this.tapStartTime = e.timeStamp;
    this.setData({stv: this.data.stv})
  },
  handlerMove(e) {
    let {clientX, clientY} = e.touches[0];
    let {stv} = this.data;
    let offsetX = this.startX - clientX;
    this.startX = clientX;
    stv.offset += offsetX;
    if(stv.offset <= 0) {
      stv.offset = 0;
    } else if(stv.offset >= stv.windowWidth*(this.tabsCount-1)) {
      stv.offset = stv.windowWidth*(this.tabsCount-1);
    }
    this.setData({stv: stv});
  },
  handlerCancel(e) {

  },
  handlerEnd(e) {
    let {clientX, clientY} = e.changedTouches[0];
    let endTime = e.timeStamp;
    let {tabs, stv, activeTab} = this.data;
    let {offset, windowWidth} = stv;
    //快速滑动
    if(endTime - this.tapStartTime <= 300) {
      //向左
      if(Math.abs(this.tapStartY - clientY) < 50) {
        if(this.tapStartX - clientX > 5) {
          if(activeTab < this.tabsCount -1) {
            this.setData({activeTab: ++activeTab});
          }
        } else {
          if(activeTab > 0) {
            this.setData({activeTab: --activeTab});
          }
        }
        stv.offset = stv.windowWidth*activeTab;
      } else {
        //快速滑动 但是Y距离大于50 所以用户是左右滚动
        let page = Math.round(offset/windowWidth);
        if (activeTab != page) {
          this.setData({activeTab: page});
        }
        stv.offset = stv.windowWidth*page;
      }
    } else {
      let page = Math.round(offset/windowWidth);
      if (activeTab != page) {
        this.setData({activeTab: page});
      }
      stv.offset = stv.windowWidth*page;
    }
    stv.tStart = false;
    this.setData({stv: this.data.stv});
    // console.log("this.data.index: " + this.data.index);
    // console.log("activeTab: " + activeTab);
    this.changeType(activeTab);
  },
  //点击某一个title条
  changeType:function(activeTab){
    // console.log("changeType activeTab: " + activeTab);
    var type = "";
    if(activeTab === 0){
      type = "nv";
    }else if(activeTab === 1){
      type = "nan";
    }
    if(type == this.data.currentType){
      return;
    }
    this.setData({currentType:type})
    app.globalData.currentType = type
    // console.log("type: " + type);
    this.getList(type)
  },
  _updateSelectedPage(page) {
    let {tabs, stv, activeTab} = this.data;
    activeTab = page;
    this.setData({activeTab: activeTab})
    stv.offset = stv.windowWidth*activeTab;
    this.setData({stv: this.data.stv});
    this.setData({index: page});
    this.changeType(activeTab);
  },
  handlerTabTap(e) {
    this._updateSelectedPage(e.currentTarget.dataset.index);
  },
  //加载第一个类型的列表
  onLoad:function(){
    this.setData({
        types:wx.getStorageSync('types') ? wx.getStorageSync('types') : app.globalData.types
    });
    this.setData({
      tabs:this.data.types
    });
    let {tabs} = this.data;
      var res = wx.getSystemInfoSync()
      this.windowWidth = res.windowWidth;
      this.data.stv.lineWidth = this.windowWidth / this.data.tabs.length;
      this.data.stv.windowWidth = res.windowWidth;
      this.setData({stv: this.data.stv})
      this.tabsCount = tabs.length;
  
    if(!this.data.currentType){
      let that = this
      this.data.types.every(function(item){
        if(item.is_show){
            wx.setStorageSync('currentType', item.value)
            that.setData({currentType:item.value})
            return false
          }else{
            return true
          }
      })
    }
    
    if(this.data.currentType){
        this.getList(this.data.currentType)
    }

    //添加通知监听
    wxNotificationCenter.addNotification("typesChangeNotification",this.typesChangeNotificationHandler,this)
  },
  //接收类别编辑页面中修改了类别标签的通知，重新处理
  typesChangeNotificationHandler:function(){
    this.setData({
        types:wx.getStorageSync('types'),
        currentType:wx.getStorageSync('currentType')
      })
      this.getList(wx.getStorageSync('currentType')) 
  },
  getList:function(type){
    dialog.loading()
        var that = this
        //请求数据
        wx.request({
          url:app.globalData.api.mingxingurl+"pic"+"?type="+type,
          success:function(ret){
            ret = ret['data']
            if(ret['code'] == 0 ){
              that.setData({
              contentList:ret['data']
              })
            }else{
              setTimeout(function(){
                dialog.toast("网络超时啦~")
              },1)
            }
          },
          complete:function(){
            wx.stopPullDownRefresh()
            setTimeout(function(){
              dialog.hide()
            },1000)
          }
        })
  },
  onPullDownRefresh:function(){
    this.getList(this.data.currentType)
  },
  gotoTypeEdit:function(e){
    wx.navigateTo({
      url: '../types/types?id=1',
    })
  },
  gotoAlbum:function(e){
    // console.log("gotoAlbum");
    let param = e.currentTarget.dataset, 
    index = param.id.lastIndexOf("\/"),
    title = param.title,
    id = param.id.substring(index + 1, param.id.length).replace(/[^0-9]/ig,"");
    // console.log("param: " + param);
    // console.log("title: " + title);
    // console.log("id: " + id);
    var url = "../album/album?title="+title+"&id="+id;
    // console.log("ready");
    wx.navigateTo({
      url:url,
      success: function(res){
        // console.log('跳转到album页面成功')// success
      },
      fail: function() {
      // console.log('跳转到album页面失败')  // fail
      },
      complete: function() {
        // console.log('跳转到album页面完成') // complete
      }
    })
  }
})
