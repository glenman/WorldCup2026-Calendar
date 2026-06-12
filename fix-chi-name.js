const fs = require('fs');
let ics = fs.readFileSync('worldcup2026.ics', 'utf8');

// 英文地址 -> {中文球场名, 城市, 国家}
const stadiumInfo = {
    'Calz. de Tlalpan 3465': { chi: '阿兹特克球场', city: 'Mexico City', country: 'Mexico' },
    'Calle Circuito JVC 2800': { chi: '阿克伦球场', city: 'Guadalajara', country: 'Mexico' },
    "170 Princes": { chi: 'BMO球场', city: 'Toronto', country: 'Canada' },
    '1001 S Stadium Dr': { chi: 'SoFi体育场', city: 'Inglewood', country: 'USA' },
    '4900 Marie P DeBartolo': { chi: '李维斯球场', city: 'Santa Clara', country: 'USA' },
    '1 MetLife Stadium Dr': { chi: '大都会人寿球场', city: 'East Rutherford', country: 'USA' },
    '1 Patriot Pl': { chi: '吉列球场', city: 'Foxborough', country: 'USA' },
    '777 Pacific Blvd': { chi: 'BC广场', city: 'Vancouver', country: 'Canada' },
    '1 NRG Pkwy': { chi: 'NRG球场', city: 'Houston', country: 'USA' },
    '1 AT&T Way': { chi: 'AT&T球场', city: 'Arlington', country: 'USA' },
    '1 Lincoln Financial Field Way': { chi: '林肯金融球场', city: 'Philadelphia', country: 'USA' },
    'Av. Pablo Livas 2011': { chi: 'BBVA球场', city: 'Monterrey', country: 'Mexico' },
    '1 AMB Dr NW': { chi: '梅赛德斯-奔驰球场', city: 'Atlanta', country: 'USA' },
    '800 Occidental Ave S': { chi: '卢门球场', city: 'Seattle', country: 'USA' },
    '347 Don Shula Dr': { chi: '硬石体育场', city: 'Miami Gardens', country: 'USA' },
    '1 Arrowhead Dr': { chi: '箭头体育场', city: 'Kansas City', country: 'USA' },
};

const events = ics.split('BEGIN:VEVENT').slice(1);
let result = 'BEGIN:VCALENDAR\r\nVERSION:2.0\r\nPRODID:-//WorldCup26//ZH\r\n';

for (const ev of events) {
    const loc = ev.match(/LOCATION:([^\r\n]+)/)?.[1] || '';
    let desc = ev.match(/DESCRIPTION:([^\r\n]*)/)?.[1] || '';
    const dtstart = ev.match(/DTSTART:([^\r\n]+)/)?.[1] || '';
    const dtend = ev.match(/DTEND:([^\r\n]+)/)?.[1] || '';
    const summary = ev.match(/SUMMARY:([^\r\n]*)/)?.[1] || '';
    const geo = ev.match(/GEO:([^\r\n]+)/)?.[1] || '';
    
    // 从 LOCATION 地址中提取球场信息
    let info = null;
    for (const [key, val] of Object.entries(stadiumInfo)) {
        if (loc.includes(key)) {
            info = val;
            break;
        }
    }
    
    // 去掉已有的 📍 备注部分，重新构建
    desc = desc.replace(/\s*\|\s*📍[^\r\n]*$/, '');
    
    // 构建新 DESCRIPTION
    let newDesc = desc;
    if (info) {
        newDesc = desc + ' | 📍' + info.city + ', ' + info.country + ', ' + info.chi;
    }
    
    result += 'BEGIN:VEVENT\r\n';
    result += ev.match(/UID:[^\r\n]*\r?\n/)?.[0] || '';
    result += 'DTSTART:' + dtstart + '\r\n';
    result += 'DTEND:' + dtend + '\r\n';
    result += 'SUMMARY:' + summary + '\r\n';
    result += 'DESCRIPTION:' + newDesc + '\r\n';
    result += 'LOCATION:' + loc + '\r\n';
    if (geo) result += geo + '\r\n';
    const apple = ev.match(/X-APPLE-STRUCTURED-LOCATION[^:\r\n]*:[^\r\n]*/)?.[0];
    if (apple) result += apple + '\r\n';
    result += 'END:VEVENT\r\n';
}
result += 'END:VCALENDAR\r\n';

fs.writeFileSync('worldcup2026.ics', result);

// 验证
const ve = result.split('BEGIN:VEVENT').slice(1);
let errors = 0;
for (const ev of ve) {
    const desc = ev.match(/DESCRIPTION:([^\r\n]+)/)?.[1] || '';
    const chiCount = (desc.match(/📍/g) || []).length;
    if (chiCount !== 1) {
        errors++;
        if (errors <= 3) {
            console.log('❌ 📍 数量不对: ' + chiCount);
            console.log('  DESC: ' + desc);
        }
    }
}

console.log('✅ 验证完成');
console.log('❌ 问题数: ' + errors);
console.log('');
console.log('示例 (前5个):');
ve.slice(0, 5).forEach(ev => {
    const summary = ev.match(/SUMMARY:([^\r\n]+)/)?.[1] || '';
    const desc = ev.match(/DESCRIPTION:([^\r\n]+)/)?.[1] || '';
    console.log('---');
    console.log(summary);
    console.log('DESC: ' + desc);
});
