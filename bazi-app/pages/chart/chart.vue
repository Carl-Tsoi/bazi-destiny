<template>
  <view class="page">
    <view v-if="chart" class="section"><view class="st">四柱八字</view>
      <view class="bt"><view class="tr"><text v-for="k in o" :key="'h'+k" class="th">{{k.replace('柱','')}}</text></view>
        <view class="tr"><text v-for="k in o" :key="'s'+k" class="td ss">{{chart.pillars[k].shishen}}</text></view>
        <view class="tr"><text v-for="k in o" :key="'g'+k" class="td gz" :style="{color:wc(chart.pillars[k].gan)}">{{chart.pillars[k].gan}}</text></view>
        <view class="tr"><text v-for="k in o" :key="'z'+k" class="td gz" :style="{color:wc(chart.pillars[k].zhi)}">{{chart.pillars[k].zhi}}</text></view>
      </view>
    </view>

    <view v-if="l3" class="section"><view class="st">五行力量</view>
      <view v-for="el in els" :key="el" class="bar"><text class="bl" :style="{color:ec(el)}">{{el}}</text>
        <view class="btk"><view class="bf" :style="{width:bw(el)+'%',background:ec(el)}"></view></view>
        <text class="bv">{{(l3.elementScores[el]||0).toFixed(1)}}</text>
      </view>
      <view class="sr"><text>自党{{l3.ziDang?.toFixed(1)}} · 异党{{l3.yiDang?.toFixed(1)}}</text><text :class="['sb',l3.dayStrength==='身强'?'s':'w']">{{l3.dayStrength}}</text></view>
    </view>

    <view v-if="l4" class="section"><view class="st">用神喜忌</view>
      <view class="yr">
        <view class="yc xi"><text class="yl">喜用</text><text class="yv">{{l4.xiShen.join('、')||l4.yongShen}}</text></view>
        <view class="yc ji"><text class="yl">忌神</text><text class="yv">{{l4.jiShen.join('、')||'—'}}</text></view>
      </view>
      <view v-for="e in l4.engines" :key="e.name" class="ei"><text class="en">{{e.name}}</text><text class="ed">{{e.diagnostics[0]}}</text></view>
    </view>

    <view class="section">
      <view class="submit-btn" @tap="loadR"><text>加载完整报告</text></view>
      <scroll-view v-if="rpt" scroll-y class="rs"><rich-text :nodes="rh"></rich-text></scroll-view>
    </view>
  </view>
</template>

<script>
const API='http://localhost:3100';
export default {
  data(){return{sid:null,chart:null,l3:null,l4:null,rpt:null,rh:'',o:['时柱','日柱','月柱','年柱'],els:['木','火','土','金','水']}},
  onLoad(o){if(o.id){this.sid=parseInt(o.id);this.load()}},
  methods:{
    wc(c){const m={甲:'#4CAF50',乙:'#4CAF50',丙:'#F44336',丁:'#F44336',戊:'#8B4513',己:'#8B4513',庚:'#DAA520',辛:'#DAA520',壬:'#2196F3',癸:'#2196F3'};return m[c]||'#999'},
    ec(e){const m={木:'#4CAF50',火:'#F44336',土:'#8B4513',金:'#DAA520',水:'#2196F3'};return m[e]||'#999'},
    bw(e){if(!this.l3)return 0;const s=this.l3.elementScores;const mx=Math.max(...Object.values(s).map(v=>Math.abs(v)),1);return Math.round(Math.abs(s[e]||0)/mx*100)},
    async load(){const r=await uni.request({url:API+'/api/subjects/'+this.sid});const d=r.data;if(d.l2)this.chart=d.l2;if(d.l3)this.l3=d.l3;if(d.l4)this.l4=d.l4},
    async loadR(){uni.showLoading({title:'加载中...'});try{const r=await uni.request({url:API+'/api/subjects/'+this.sid+'/report'});this.rpt=r.data;this.rh=r.data.replace(/<span /g,'<span ').replace(/\n/g,'<br/>');uni.hideLoading()}catch(e){uni.hideLoading()}}
  }
};
</script>

<style scoped>
.page{background:#0f0f1a;min-height:100vh;padding:20rpx}
.section{background:#1a1a2e;border-radius:16rpx;padding:24rpx;margin-bottom:20rpx;border:1px solid #2a2a3e}
.st{color:#c9a96e;font-size:30rpx;margin-bottom:16rpx;border-bottom:1px solid #2a2a3e;padding-bottom:12rpx}
.bt{width:100%}.tr{display:flex}.th{flex:1;text-align:center;color:#888;font-size:24rpx;padding:8rpx 0}
.td{flex:1;text-align:center;color:#fff;padding:12rpx 0}.td.ss{color:#aaa;font-size:24rpx}.td.gz{font-size:36rpx;font-weight:bold}
.bar{display:flex;align-items:center;margin-bottom:12rpx}.bl{width:40rpx;font-size:26rpx;text-align:center}
.btk{flex:1;height:16rpx;background:#0f0f1a;border-radius:8rpx;margin:0 16rpx;overflow:hidden}
.bf{height:100%;border-radius:8rpx;min-width:4rpx}.bv{width:60rpx;font-size:24rpx;color:#aaa;text-align:right}
.sr{display:flex;justify-content:space-between;align-items:center;margin-top:16rpx;color:#aaa;font-size:26rpx}
.sb{padding:6rpx 24rpx;border-radius:20rpx;font-size:24rpx}.sb.s{background:#c9a96e;color:#1a1a2e}.sb.w{background:#444;color:#aaa}
.yr{display:flex;gap:16rpx;margin-bottom:16rpx}.yc{flex:1;border-radius:12rpx;padding:20rpx;text-align:center}
.yc.xi{background:rgba(201,169,110,.15);border:1px solid #c9a96e}.yc.ji{background:rgba(100,100,100,.15);border:1px solid #555}
.yl{display:block;font-size:24rpx;color:#888;margin-bottom:8rpx}.yv{display:block;font-size:30rpx;color:#fff;font-weight:bold}
.ei{display:flex;justify-content:space-between;padding:12rpx 0;border-bottom:1px solid #1a1a2e}.en{color:#c9a96e;font-size:24rpx}.ed{color:#aaa;font-size:24rpx;text-align:right;flex:1;margin-left:16rpx}
.rs{max-height:1200rpx}.submit-btn{background:linear-gradient(135deg,#c9a96e,#b8860b);border-radius:12rpx;padding:24rpx;text-align:center}
.submit-btn text{color:#1a1a2e;font-size:32rpx;font-weight:bold}
</style>
