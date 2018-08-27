var app = getApp()
var dialog = require("../../utils/dialog")

Page({
    data:{
        album:[],
        title:'',
        id:'',
        countShow:true,
        currentIndex:1,
      imageUrl: '',
      imageUrls: ['https://ss3.bdstatic.com/70cFv8Sh_Q1YnxGkpoWK1HF6hhy/it/u=463882794,1348260465&fm=26&gp=0.jpg', 'https://ss3.bdstatic.com/70cFv8Sh_Q1YnxGkpoWK1HF6hhy/it/u=1125678520,932208071&fm=26&gp=0.jpg', 'https://ss2.bdstatic.com/70cFvnSh_Q1YnxGkpoWK1HF6hhy/it/u=3932673481,3866679581&fm=26&gp=0.jpg', 'https://ss2.bdstatic.com/70cFvnSh_Q1YnxGkpoWK1HF6hhy/it/u=3143497914,3783741282&fm=26&gp=0.jpg', 'https://ss2.bdstatic.com/70cFvnSh_Q1YnxGkpoWK1HF6hhy/it/u=1087822958,2728090746&fm=26&gp=0.jpg', 'https://ss0.bdstatic.com/70cFuHSh_Q1YnxGkpoWK1HF6hhy/it/u=4171337231,231636153&fm=26&gp=0.jpg',  'https://ss1.bdstatic.com/70cFvXSh_Q1YnxGkpoWK1HF6hhy/it/u=2990725208,76145519&fm=26&gp=0.jpg']
    },
  onShareAppMessage: function () {
    this.imageUrl = this.data.imageUrls[Math.floor(Math.random() * this.data.imageUrls.length)];
    return {
      title: '快来看看你们最爱的男神女神吧！',
      // desc: '明星云集之地，就等你来了！',
      path: '/pages/index/index',
      imageUrl: this.imageUrl
    }
  },
    onLoad:function(options){
        this.setData({
            title:options.title,
            id:options.id,
        })
        dialog.loading()
        //请求数据
        var that = this
        wx.request({
        url:app.globalData.api.mingxingurl+"detail"+"?d="+this.data.id,
          success:function(ret){
            ret = ret['data']
            if(ret['code'] == 0){
              that.setData({
                  title:ret['title'],
              })
              var imgList = ret['data']['imgList'];
              // console.log("imgList: " + JSON.stringify(imgList));
              var imgObjList = [];
              imgList.forEach(function(item,index){
                imgObjList.push({
                      url:item,
                      w:750,
                      h:375
                })
              })
              // console.log("imgObjList: " + JSON.stringify(imgObjList));
              that.setData({
                album:imgObjList,
                albumUrlList:imgList,
                total:imgList.length,
                loaded:0
              })
            }else{
              dialog.toast("网络出错啦~")
            }
          },
          fail: function() {
            // console.log('跳转到news页面失败') //fail
          },
          complete:function(){
            setTimeout(function(){
              dialog.hide()
            },1000)
          }
        })
    },
    onReady:function(){
        wx.setNavigationBarTitle({title:this.data.title})
    },
    imageload:function(e){
      var h = e.detail.height
      var w = e.detail.width
      var index = e.currentTarget.dataset.index
       var album = this.data.album
        album[index].h = parseInt(750 * h / w)
        this.setData({
          album:album
        })
    },
    preiviewwImage(e){
      wx.previewImage({
        current:e.currentTarget.dataset.src,
        urls:this.data.albumUrlList
      })
    },
    swiperChange:function(e){
      this.setData({currentIndex:parseInt(e.detail.current)+1});
    },
    imageLongTap:function(e){
      wx.showActionSheet({
        itemList:['保存图片'],
        success:function(res){
          if(res.tapIndex == 0){
            var imageSrc = e.currentTarget.dataset.src
            // console.log(imageSrc)
            wx.downloadFile({
              url: imageSrc, 
                    success: function(res) {
                      // console.log(res)
                        wx.saveFile({
                          tempFilePath: res.tempFilePath,
                          success: function(res){
                            // console.log(res.savedFilePath)
                            dialog.toast("保存成功")
                          },
                          fail: function(e) {
                            dialog.toast("保存出错")
                          }
                        })
                    },
                    fail:function(e){
                      dialog.toast("图片下载失败")
                    }
            })
          }
        }
      })
    },
    hideCount:function(){
      this.setData({countShow:false})
    }
})