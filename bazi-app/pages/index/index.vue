<template>
  <view class="page">
    <view class="input-card">
      <view class="form-row"><text class="label">姓名</text><input class="input" v-model="form.name" placeholder="请输入姓名" placeholder-class="ph" /></view>
      <view class="form-row"><text class="label">性别</text>
        <view class="gender-toggle">
          <view :class="['btn',form.gender==='M'?'active':'']" @tap="form.gender='M'">男</view>
          <view :class="['btn',form.gender==='F'?'active':'']" @tap="form.gender='F'">女</view>
        </view>
      </view>
      <view class="form-row"><text class="label">出生</text>
        <picker mode="date" :value="form.date" @change="e=>form.date=e.detail.value"><view class="pv">{{form.date||'选择日期'}}</view></picker>
        <picker mode="time" :value="form.time" @change="e=>form.time=e.detail.value"><view class="pv">{{form.time||'12:00'}}</view></picker>
      </view>
      <view class="submit-btn" @tap="doCalc"><text>开始排盘</text></view>
    </view>

    <view v-if="chart" class="card">
      <view class="card-title">四柱八字</view>
      <view class="bazi-table">
        <view class="tr"><text v-for="k in o" :key="'h'+k" class="th">{{{时柱:'时',日柱:'日',月柱:'月',年柱:'年'}[k]}}</text></view>
        <view class="tr"><text v-for="k in o" :key="'s'+k" class="td ss">{{chart.pillars[k].shishen}}</text></view>
        <view class="tr"><text v-for="k in o" :key="'g'+k" class="td gz" :style="{color:wc(chart.pillars[k].gan)}">{{chart.pillars[k].gan}}</text></view>
        <view class="tr"><text v-for="k in o" :key="'z'+k" class="td gz" :style="{color:wc(chart.pillars[k].zhi)}">{{chart.pillars[k].zhi}}</text></view>
      </view>
    </view>

    <view v-if="l4" class="cards-row">
      <view class="ic"><text class="il">格局</text><text class="iv">{{pattern}}</text></view>
      <view class="ic"><text class="il">用神</text><text class="iv">{{l4.yongShen}}</text></view>
      <view class="ic"><text class="il">日主</text><text class="iv">{{dayGan}}{{dayEl}}</text></view>
      <view class="ic"><text class="il">强弱</text><text class="iv">{{l3?.dayStrength}}</text></view>
    </view>

    <view v-if="l4" class="submit-btn sec" @tap="$emit('viewReport')||uni.navigateTo({url:'/pages/chart/chart?id='+sid})"><text>查看完整报告</text></view>
  </view>
</template>

<script>
const API='http://localhost:3100';
export default {
  data(){return{form:{name:'',gender:'M',date:'',time:'12:00'},sid:null,chart:null,l3:null,l4:null,pattern:'',dayGan:'',dayEl:'',o:['时柱','日柱','月柱','年柱']}},
  methods:{
    wc(c){const m={甲:'#4CAF50',乙:'#4CAF50',丙:'#F44336',丁:'#F44336',戊:'#8B4513',己:'#8B4513',庚:'#DAA520',辛:'#DAA520',壬:'#2196F3',癸:'#2196F3'};return m[c]||'#999'},
    async doCalc(){
      if(!this.form.name||!this.form.date){uni.showToast({title:'请填写姓名和日期',icon:'none'});return}
      uni.showLoading({title:'排盘中...'});
      try{
        const dt=this.form.date+'T'+this.form.time;
        const r=await uni.request({url:API+'/api/subjects',method:'POST',data:{name:this.form.name,gender:this.form.gender,datetime:dt}});
        uni.hideLoading();
        if(r.data.subjectId){this.sid=r.data.subjectId;await this.load()}
      }catch(e){uni.hideLoading();uni.showToast({title:'失败',icon:'none'})}
    },
    async load(){
      const r=await uni.request({url:API+'/api/subjects/'+this.sid});
      const d=r.data;
      if(d.l2){this.chart=d.l2;this.pattern=d.l2.pattern||'正格';this.dayGan=d.l2.dayGan;this.dayEl={甲:'木',乙:'木',丙:'火',丁:'火',戊:'土',己:'土',庚:'金',辛:'金',壬:'水',癸:'水'}[d.l2.dayGan]||''}
      if(d.l3)this.l3=d.l3;
      if(d.l4)this.l4=d.l4;
    }
  }
};
</script>

<style scoped>
.page{background:#0f0f1a;min-height:100vh;padding:20rpx}
.input-card{background:#1a1a2e;border-radius:16rpx;padding:30rpx;margin-bottom:20rpx;border:1px solid #2a2a3e}
.form-row{display:flex;align-items:center;margin-bottom:24rpx}
.label{width:100rpx;color:#c9a96e;font-size:28rpx}
.input{flex:1;background:#0f0f1a;border-radius:8rpx;padding:16rpx 20rpx;color:#fff;font-size:28rpx}
.ph{color:#555}
.gender-toggle{display:flex;gap:16rpx}
.gender-toggle .btn{padding:12rpx 40rpx;border-radius:8rpx;background:#0f0f1a;color:#888;font-size:28rpx}
.gender-toggle .btn.active{background:#c9a96e;color:#1a1a2e}
.pv{background:#0f0f1a;border-radius:8rpx;padding:16rpx 20rpx;color:#fff;font-size:28rpx;margin-right:16rpx}
.submit-btn{background:linear-gradient(135deg,#c9a96e,#b8860b);border-radius:12rpx;padding:24rpx;text-align:center;margin-top:20rpx}
.submit-btn text{color:#1a1a2e;font-size:32rpx;font-weight:bold}
.submit-btn.sec{background:#2a2a3e}
.submit-btn.sec text{color:#c9a96e}
.card{background:#1a1a2e;border-radius:16rpx;padding:24rpx;margin-bottom:20rpx;border:1px solid #2a2a3e}
.card-title{color:#c9a96e;font-size:30rpx;margin-bottom:16rpx}
.bazi-table{width:100%}
.tr{display:flex}
.th{flex:1;text-align:center;color:#888;font-size:24rpx;padding:8rpx 0}
.td{flex:1;text-align:center;color:#fff;padding:12rpx 0}
.td.ss{color:#aaa;font-size:24rpx}
.td.gz{font-size:36rpx;font-weight:bold}
.cards-row{display:flex;flex-wrap:wrap;gap:16rpx;margin-bottom:20rpx}
.ic{flex:1;min-width:40%;background:#1a1a2e;border-radius:12rpx;padding:20rpx;text-align:center;border:1px solid #2a2a3e}
.il{display:block;color:#888;font-size:24rpx;margin-bottom:8rpx}
.iv{display:block;color:#c9a96e;font-size:32rpx;font-weight:bold}
</style>
