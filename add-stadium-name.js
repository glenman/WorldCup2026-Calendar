const fs = require('fs');
let ics = fs.readFileSync('worldcup2026.ics', 'utf8');

const stadiumChiMap = {
    'Estadio Azteca': '阿兹特克球场',
    'Estadio Akron': '阿克伦球场',
    'BMO Field': 'BMO球场',
    'SoFi Stadium': 'SoFi体育场',
    'Levis Stadium': '李维斯球场',
    'MetLife Stadium': '大都会人寿球场',
    'Gillette Stadium': '吉列球场',
    'BC Place': 'BC广场',
    'NRG Stadium': 'NRG球场',
    'AT&T Stadium': 'AT&T球场',
    'Lincoln Financial Field': '林肯金融球场',
    'Estadio BBVA': 'BBVA球场',
    'Mercedes-Benz Stadium': '梅赛德斯-奔驰球场',
    'Lumen Field': '卢门球场',
    'Hard Rock Stadium': '硬石体育场',
    'Arrowhead Stadium': '箭头体育场',
};

const events = ics.split('BEGIN:VEVENT').slice(1);
let result = 'BEGIN:VCALENDAR\r\nVERSION:2.0\r\nPRODID:-//WorldCup26//ZH\r\n';

for (const ev of events) {
    const location = ev.match(/LOCATION:([^\r\n]+)/)?.[1] || '';
    const descLine = ev.match(/DESCRIPTION:([^\r\n]*)/)?.[1] || '';
    
    let stadiumChi = '';
    for (const [engName, chiName] of Object.entries(stadiumChiMap)) {
        if (location.includes(engName)) {
            stadiumChi = chiName;
            break;
        }
    }
    
    // 构建新事件
    result += 'BEGIN:VEVENT\r\n';
    result += ev.match(/UID:[^\r\n]*\r?\n/)?.[0] || '';
    result += ev.match(/DTSTART:[^\r\n]*\r?\n/)?.[0] || '';
    result += ev.match(/DTEND:[^\r\n]*\r?\n/)?.[0] || '';
    result += ev.match(/SUMMARY:[^\r\n]*\r?\n/)?.[0] || '';
    result += 'DESCRIPTION:' + descLine;
    if (stadiumChi) result += '\r\n📍' + stadiumChi;
    result += '\r\n';
    result += 'LOCATION:' + location + '\r\n';
    result += ev.match(/GEO:[^\r\n]*\r?\n/)?.[0] || '';
    const apple = ev.match(/X-APPLE-STRUCTURED-LOCATION[^:\r\n]*:[^\r\n]*/)?.[0];
    if (apple) result += apple + '\r\n';
    result += 'END:VEVENT\r\n';
}
result += 'END:VCALENDAR\r\n';

fs.writeFileSync('worldcup2026.ics', result);

// 验证
const ve = result.split('BEGIN:VEVENT').slice(1);
let withChi = 0, withoutChi = 0;
for (const ev of ve) {
    const desc = ev.match(/DESCRIPTION:[^\r\n]*\r?\n([^R]*)(📍|$)/)?.[0] || '';
    if (desc.includes('📍')) withChi++;
    else withoutChi++;
}
console.log('有球场名: ' + withChi);
console.log('无球场名: ' + withoutChi);
console.log('');
ve.slice(0, 3).forEach(ev => {
    const summary = ev.match(/SUMMARY:([^\r\n]+)/)?.[1] || '';
    const desc = ev.match(/DESCRIPTION:([^\r\n]+)/)?.[1] || '';
    const rest = ev.replace(/DESCRIPTION:[^\r\n]*\r?\n/, '').substring(0, 50);
    console.log('---');
    console.log(summary);
    console.log('DESC: ' + desc);
    console.log(rest);
});
