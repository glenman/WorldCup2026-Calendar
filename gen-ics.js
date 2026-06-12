const fs = require('fs');
const html = fs.readFileSync('index.html', 'utf8');

// Hard-code stadium data from the HTML
const stadiums = {
    '阿兹特克球场': {name:'Estadio Azteca', lat:19.3029, lng:-99.1506},
    '阿克伦球场': {name:'Estadio Akron', lat:20.6737, lng:-103.3447},
    'BBVA球场': {name:'Estadio BBVA', lat:25.6689, lng:-100.2418},
    'NRG球场': {name:'NRG Stadium', lat:29.6847, lng:-95.4108},
    'SoFi体育场': {name:'SoFi Stadium', lat:33.9535, lng:-118.3392},
    '李维斯球场': {name:'Levis Stadium', lat:37.4032, lng:-121.9712},
    '大都会人寿球场': {name:'MetLife Stadium', lat:40.8128, lng:-74.0742},
    '林肯金融球场': {name:'Lincoln Financial Field', lat:39.9008, lng:-75.1675},
    '吉列球场': {name:'Gillette Stadium', lat:42.0909, lng:-71.2643},
    '卢门球场': {name:'Lumen Field', lat:47.5952, lng:-122.3316},
    '梅赛德斯-奔驰球场': {name:'Mercedes-Benz Stadium', lat:33.7553, lng:-84.4006},
    '硬石体育场': {name:'Hard Rock Stadium', lat:25.9580, lng:-80.2389},
    '箭头体育场': {name:'Arrowhead Stadium', lat:39.0489, lng:-94.4840},
    'AT&T球场': {name:'AT&T Stadium', lat:32.7390, lng:-97.0931},
    'BMO球场': {name:'BMO Field', lat:43.6332, lng:-79.4186},
    'BC广场': {name:'BC Place', lat:49.2766, lng:-123.1119},
};

const matchData = {
"6月12日": [
{m:"🇲🇽 墨西哥 vs 🇿🇦 南非", c:"墨西哥城", s:"阿兹特克球场", t:"3:00", g:"A组"},
{m:"🇰🇷 韩国 vs 🇨🇿 捷克", c:"瓜达拉哈拉", s:"阿克伦球场", t:"10:00", g:"A组"}
],
"6月13日": [
{m:"🇨🇦 加拿大 vs 🇧🇦 波黑", c:"多伦多", s:"BMO球场", t:"3:00", g:"B组"},
{m:"🇺🇸 美国 vs 🇵🇾 巴拉圭", c:"洛杉矶", s:"SoFi体育场", t:"9:00", g:"D组"}
],
"6月14日": [
{m:"🇶🇦 卡塔尔 vs 🇨🇭 瑞士", c:"旧金山湾区", s:"李维斯球场", t:"3:00", g:"B组"},
{m:"🇧🇷 巴西 vs 🇲🇦 摩洛哥", c:"纽约/新泽西", s:"大都会人寿球场", t:"6:00", g:"C组"},
{m:"🇭🇹 海地 vs 🏴󠁧󠁢󠁳󠁣󠁴󠁿 苏格兰", c:"波士顿", s:"吉列球场", t:"9:00", g:"C组"},
{m:"🇦🇺 澳大利亚 vs 🇹🇷 土耳其", c:"温哥华", s:"BC广场", t:"12:00", g:"D组"}
],
"6月15日": [
{m:"🇩🇪 德国 vs 🇨🇼 库拉索", c:"休斯顿", s:"NRG球场", t:"1:00", g:"E组"},
{m:"🇳🇱 荷兰 vs 🇯🇵 日本", c:"达拉斯", s:"AT&T球场", t:"4:00", g:"F组"},
{m:"🇨🇮 科特迪瓦 vs 🇪🇨 厄瓜多尔", c:"费城", s:"林肯金融球场", t:"7:00", g:"E组"},
{m:"🇸🇪 瑞典 vs 🇹🇳 突尼斯", c:"蒙特雷", s:"BBVA球场", t:"10:00", g:"F组"}
],
"6月16日": [
{m:"🇪🇸 西班牙 vs 🇨🇻 佛得角", c:"亚特兰大", s:"梅赛德斯-奔驰球场", t:"0:00", g:"H组"},
{m:"🇧🇪 比利时 vs 🇪🇬 埃及", c:"西雅图", s:"卢门球场", t:"3:00", g:"G组"},
{m:"🇸🇦 沙特阿拉伯 vs 🇺🇾 乌拉圭", c:"迈阿密", s:"硬石体育场", t:"6:00", g:"H组"},
{m:"🇮🇷 伊朗 vs 🇳🇿 新西兰", c:"洛杉矶", s:"SoFi体育场", t:"9:00", g:"G组"}
],
"6月17日": [
{m:"🇫🇷 法国 vs 🇸🇳 塞内加尔", c:"纽约/新泽西", s:"大都会人寿球场", t:"3:00", g:"I组"},
{m:"🇮🇶 伊拉克 vs 🇳🇴 挪威", c:"波士顿", s:"吉列球场", t:"6:00", g:"I组"},
{m:"🇦🇷 阿根廷 vs 🇩🇿 阿尔及利亚", c:"堪萨斯城", s:"箭头体育场", t:"9:00", g:"J组"},
{m:"🇦🇹 奥地利 vs 🇯🇴 约旦", c:"旧金山湾区", s:"李维斯球场", t:"12:00", g:"J组"}
],
"6月18日": [
{m:"🇵🇹 葡萄牙 vs 🇨🇩 刚果(金)", c:"休斯顿", s:"NRG球场", t:"1:00", g:"K组"},
{m:"🏴󠁧󠁢󠁥󠁮󠁧󠁿 英格兰 vs 🇭🇷 克罗地亚", c:"达拉斯", s:"AT&T球场", t:"4:00", g:"L组"},
{m:"🇬🇭 加纳 vs 🇵🇦 巴拿马", c:"多伦多", s:"BMO球场", t:"7:00", g:"L组"},
{m:"🇺🇿 乌兹别克斯坦 vs 🇨🇴 哥伦比亚", c:"墨西哥城", s:"阿兹特克球场", t:"10:00", g:"K组"}
],
"6月19日": [
{m:"🇨🇿 捷克 vs 🇿🇦 南非", c:"亚特兰大", s:"梅赛德斯-奔驰球场", t:"0:00", g:"A组"},
{m:"🇨🇭 瑞士 vs 🇧🇦 波黑", c:"洛杉矶", s:"SoFi体育场", t:"3:00", g:"B组"},
{m:"🇨🇦 加拿大 vs 🇶🇦 卡塔尔", c:"温哥华", s:"BC广场", t:"6:00", g:"B组"},
{m:"🇲🇽 墨西哥 vs 🇰🇷 韩国", c:"瓜达拉哈拉", s:"阿克伦球场", t:"9:00", g:"A组"}
],
"6月20日": [
{m:"🇺🇸 美国 vs 🇦🇺 澳大利亚", c:"西雅图", s:"卢门球场", t:"3:00", g:"D组"},
{m:"🏴󠁧󠁢󠁳󠁣󠁴󠁿 苏格兰 vs 🇲🇦 摩洛哥", c:"波士顿", s:"吉列球场", t:"6:00", g:"C组"},
{m:"🇧🇷 巴西 vs 🇭🇹 海地", c:"费城", s:"林肯金融球场", t:"8:30", g:"C组"},
{m:"🇹🇷 土耳其 vs 🇵🇾 巴拉圭", c:"旧金山湾区", s:"李维斯球场", t:"11:00", g:"D组"}
],
"6月21日": [
{m:"🇳🇱 荷兰 vs 🇸🇪 瑞典", c:"休斯顿", s:"NRG球场", t:"1:00", g:"F组"},
{m:"🇩🇪 德国 vs 🇨🇮 科特迪瓦", c:"多伦多", s:"BMO球场", t:"4:00", g:"E组"},
{m:"🇪🇨 厄瓜多尔 vs 🇨🇼 库拉索", c:"堪萨斯城", s:"箭头体育场", t:"8:00", g:"E组"},
{m:"🇹🇳 突尼斯 vs 🇯🇵 日本", c:"蒙特雷", s:"BBVA球场", t:"12:00", g:"F组"}
],
"6月22日": [
{m:"🇪🇸 西班牙 vs 🇸🇦 沙特阿拉伯", c:"亚特兰大", s:"梅赛德斯-奔驰球场", t:"0:00", g:"H组"},
{m:"🇧🇪 比利时 vs 🇮🇷 伊朗", c:"洛杉矶", s:"SoFi体育场", t:"3:00", g:"G组"},
{m:"🇺🇾 乌拉圭 vs 🇨🇻 佛得角", c:"迈阿密", s:"硬石体育场", t:"6:00", g:"H组"},
{m:"🇳🇿 新西兰 vs 🇪🇬 埃及", c:"温哥华", s:"BC广场", t:"9:00", g:"G组"}
],
"6月23日": [
{m:"🇦🇷 阿根廷 vs 🇦🇹 奥地利", c:"达拉斯", s:"AT&T球场", t:"1:00", g:"J组"},
{m:"🇫🇷 法国 vs 🇮🇶 伊拉克", c:"费城", s:"林肯金融球场", t:"5:00", g:"I组"},
{m:"🇳🇴 挪威 vs 🇸🇳 塞内加尔", c:"纽约/新泽西", s:"大都会人寿球场", t:"8:00", g:"I组"},
{m:"🇯🇴 约旦 vs 🇩🇿 阿尔及利亚", c:"旧金山湾区", s:"李维斯球场", t:"11:00", g:"J组"}
],
"6月24日": [
{m:"🇵🇹 葡萄牙 vs 🇺🇿 乌兹别克斯坦", c:"休斯顿", s:"NRG球场", t:"1:00", g:"K组"},
{m:"🏴󠁧󠁢󠁥󠁮󠁧󠁿 英格兰 vs 🇬🇭 加纳", c:"波士顿", s:"吉列球场", t:"4:00", g:"L组"},
{m:"🇵🇦 巴拿马 vs 🇭🇷 克罗地亚", c:"多伦多", s:"BMO球场", t:"7:00", g:"L组"},
{m:"🇨🇴 哥伦比亚 vs 🇨🇩 刚果(金)", c:"瓜达拉哈拉", s:"阿克伦球场", t:"10:00", g:"K组"}
],
"6月25日": [
{m:"🇧🇦 波黑 vs 🇶🇦 卡塔尔", c:"西雅图", s:"卢门球场", t:"3:00", g:"B组"},
{m:"🇨🇭 瑞士 vs 🇨🇦 加拿大", c:"温哥华", s:"BC广场", t:"3:00", g:"B组"},
{m:"🇲🇦 摩洛哥 vs 🇭🇹 海地", c:"亚特兰大", s:"梅赛德斯-奔驰球场", t:"6:00", g:"C组"},
{m:"🏴󠁧󠁢󠁳󠁣󠁴󠁿 苏格兰 vs 🇧🇷 巴西", c:"迈阿密", s:"硬石体育场", t:"6:00", g:"C组"},
{m:"🇿🇦 南非 vs 🇰🇷 韩国", c:"蒙特雷", s:"BBVA球场", t:"9:00", g:"A组"},
{m:"🇨🇿 捷克 vs 🇲🇽 墨西哥", c:"墨西哥城", s:"阿兹特克球场", t:"9:00", g:"A组"}
],
"6月26日": [
{m:"🇨🇼 库拉索 vs 🇨🇮 科特迪瓦", c:"费城", s:"林肯金融球场", t:"4:00", g:"E组"},
{m:"🇪🇨 厄瓜多尔 vs 🇩🇪 德国", c:"纽约/新泽西", s:"大都会人寿球场", t:"4:00", g:"E组"},
{m:"🇯🇵 日本 vs 🇸🇪 瑞典", c:"达拉斯", s:"AT&T球场", t:"7:00", g:"F组"},
{m:"🇹🇳 突尼斯 vs 🇳🇱 荷兰", c:"堪萨斯城", s:"箭头体育场", t:"7:00", g:"F组"},
{m:"🇵🇾 巴拉圭 vs 🇦🇺 澳大利亚", c:"旧金山湾区", s:"李维斯球场", t:"10:00", g:"D组"},
{m:"🇹🇷 土耳其 vs 🇺🇸 美国", c:"洛杉矶", s:"SoFi体育场", t:"10:00", g:"D组"}
],
"6月27日": [
{m:"🇸🇳 塞内加尔 vs 🇮🇶 伊拉克", c:"多伦多", s:"BMO球场", t:"3:00", g:"I组"},
{m:"🇳🇴 挪威 vs 🇫🇷 法国", c:"波士顿", s:"吉列球场", t:"3:00", g:"I组"},
{m:"🇨🇻 佛得角 vs 🇸🇦 沙特阿拉伯", c:"休斯顿", s:"NRG球场", t:"8:00", g:"H组"},
{m:"🇺🇾 乌拉圭 vs 🇪🇸 西班牙", c:"瓜达拉哈拉", s:"阿克伦球场", t:"8:00", g:"H组"},
{m:"🇪🇬 埃及 vs 🇮🇷 伊朗", c:"西雅图", s:"卢门球场", t:"11:00", g:"G组"},
{m:"🇳🇿 新西兰 vs 🇧🇪 比利时", c:"温哥华", s:"BC广场", t:"11:00", g:"G组"}
],
"6月28日": [
{m:"🇭🇷 克罗地亚 vs 🇬🇭 加纳", c:"费城", s:"林肯金融球场", t:"5:00", g:"L组"},
{m:"🇵🇦 巴拿马 vs 🏴󠁧󠁢󠁥󠁮󠁧󠁿 英格兰", c:"纽约/新泽西", s:"大都会人寿球场", t:"5:00", g:"L组"},
{m:"🇨🇩 刚果(金) vs 🇺🇿 乌兹别克斯坦", c:"亚特兰大", s:"梅赛德斯-奔驰球场", t:"7:30", g:"K组"},
{m:"🇨🇴 哥伦比亚 vs 🇵🇹 葡萄牙", c:"迈阿密", s:"硬石体育场", t:"7:30", g:"K组"},
{m:"🇩🇿 阿尔及利亚 vs 🇦🇹 奥地利", c:"休斯顿", s:"NRG球场", t:"10:00", g:"J组"},
{m:"🇯🇴 约旦 vs 🇦🇷 阿根廷", c:"西雅图", s:"卢门球场", t:"10:00", g:"J组"}
]
};

function getStadiumGeo(stadiumName) {
    if (!stadiums[stadiumName]) return '';
    var s = stadiums[stadiumName];
    var geo = 'GEO:' + s.lat + ';' + s.lng + '\r\n';
    var xapple = 'X-APPLE-STRUCTURED-LOCATION;VALUE=URI;X-APPLE-RADIUS=500;X-TITLE=' + s.name + ':geo:' + s.lat + ',' + s.lng + '\r\n';
    return geo + xapple;
}

let ics = 'BEGIN:VCALENDAR\r\nVERSION:2.0\r\nPRODID:-//WorldCup26//ZH\r\n';
let idx = 1;
for (const [day, matches] of Object.entries(matchData)) {
    for (const m of matches) {
        const [h, min] = m.t.split(':').map(Number);
        const dayNum = parseInt(day.match(/(\d+)[^\d]*$/)?.[1]);
        const utcH = (h - 8 + 24) % 24;
        const utcDay = (h < 8) ? dayNum - 1 : dayNum;
        const utcDate = Date.UTC(2026, 5, utcDay, utcH, min);
        const iso = new Date(utcDate).toISOString().replace(/[-:]/g,'').split('.')[0] + 'Z';
        ics += 'BEGIN:VEVENT\r\n';
        ics += 'UID:wc26-' + idx + '@worldcup26\r\n';
        ics += 'DTSTART:' + iso + '\r\n';
        const endDt = new Date(utcDate + 7200000);
        ics += 'DTEND:' + endDt.toISOString().replace(/[-:]/g,'').split('.')[0] + 'Z\r\n';
        ics += 'SUMMARY:' + m.m + '\r\n';
        ics += 'DESCRIPTION:小组赛 ' + m.g + '\r\n';
        ics += 'LOCATION:' + m.c + ' ' + m.s + '\r\n';
        ics += getStadiumGeo(m.s);
        ics += 'END:VEVENT\r\n';
        idx++;
    }
}
ics += 'END:VCALENDAR\r\n';

fs.writeFileSync('worldcup2026.ics', ics);
console.log('Generated ' + (idx-1) + ' events');
console.log('--- First event: ---');
console.log(ics.substring(0, 700));
