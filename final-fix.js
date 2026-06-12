const fs = require('fs');
let ics = fs.readFileSync('worldcup2026.ics', 'utf8');

// 英文地址 -> {中文球场名, 城市, 国家, 完整英文地址}
const stadiumInfo = {
    'Calz. de Tlalpan 3465': { chi: '阿兹特克球场', city: '墨西哥城', country: '墨西哥', addr: 'Calz. de Tlalpan 3465, Santa Úrsula Coapa, Coyoacán, 04650 Ciudad de México, CDMX, Mexico' },
    'Calle Circuito JVC 2800': { chi: '阿克伦球场', city: '瓜达拉哈拉', country: '墨西哥', addr: 'Calle Circuito JVC 2800, El Salto, Jalisco 45645, Mexico' },
    "170 Princes": { chi: 'BMO球场', city: '多伦多', country: '加拿大', addr: "170 Princes' Blvd, Toronto, ON M6K 3C3, Canada" },
    '1001 S Stadium Dr': { chi: 'SoFi体育场', city: '洛杉矶', country: '美国', addr: '1001 S Stadium Dr, Inglewood, CA 90301, USA' },
    '4900 Marie P DeBartolo': { chi: '李维斯球场', city: '旧金山湾区', country: '美国', addr: '4900 Marie P DeBartolo Way, Santa Clara, CA 95054, USA' },
    '1 MetLife Stadium Dr': { chi: '大都会人寿球场', city: '纽约/新泽西', country: '美国', addr: '1 MetLife Stadium Dr, East Rutherford, NJ 07073, USA' },
    '1 Patriot Pl': { chi: '吉列球场', city: '波士顿', country: '美国', addr: '1 Patriot Pl, Foxborough, MA 02035, USA' },
    '777 Pacific Blvd': { chi: 'BC广场', city: '温哥华', country: '加拿大', addr: '777 Pacific Blvd, Vancouver, BC V6B 4Y8, Canada' },
    '1 NRG Pkwy': { chi: 'NRG球场', city: '休斯顿', country: '美国', addr: '1 NRG Pkwy, Houston, TX 77054, USA' },
    '1 AT&T Way': { chi: 'AT&T球场', city: '达拉斯', country: '美国', addr: '1 AT&T Way, Arlington, TX 76011, USA' },
    '1 Lincoln Financial Field Way': { chi: '林肯金融球场', city: '费城', country: '美国', addr: '1 Lincoln Financial Field Way, Philadelphia, PA 19148, USA' },
    'Av. Pablo Livas 2011': { chi: 'BBVA球场', city: '蒙特雷', country: '墨西哥', addr: 'Av. Pablo Livas 2011, Guadalupe, NL 67195, Mexico' },
    '1 AMB Dr NW': { chi: '梅赛德斯-奔驰球场', city: '亚特兰大', country: '美国', addr: '1 AMB Dr NW, Atlanta, GA 30313, USA' },
    '800 Occidental Ave S': { chi: '卢门球场', city: '西雅图', country: '美国', addr: '800 Occidental Ave S, Seattle, WA 98134, USA' },
    '347 Don Shula Dr': { chi: '硬石体育场', city: '迈阿密', country: '美国', addr: '347 Don Shula Dr, Miami Gardens, FL 33056, USA' },
    '1 Arrowhead Dr': { chi: '箭头体育场', city: '堪萨斯城', country: '美国', addr: '1 Arrowhead Dr, Kansas City, MO 64129, USA' },
};

const events = ics.split('BEGIN:VEVENT').slice(1);
let result = 'BEGIN:VCALENDAR\r\nVERSION:2.0\r\nPRODID:-//WorldCup26//ZH\r\n';

for (const ev of events) {
    let desc = ev.match(/DESCRIPTION:([^\r\n]*)/)?.[1] || '';
    let loc = ev.match(/LOCATION:([^\r\n]+)/)?.[1] || '';
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
    
    // LOCATION: 恢复中文格式
    if (info) {
        loc = info.country + ' ' + info.city + ' ' + info.chi;
    }
    
    // DESCRIPTION: 去掉已有备注，重新加
    desc = desc.replace(/\s*\|\s*📍[^\r\n]*$/, '');
    let newDesc = desc;
    if (info) {
        // 用英文名 + 中文名
        const engMap = {
            '阿兹特克球场': 'Estadio Azteca',
            '阿克伦球场': 'Estadio Akron',
            'BMO球场': 'BMO Field',
            'SoFi体育场': 'SoFi Stadium',
            '李维斯球场': "Levi's Stadium",
            '大都会人寿球场': 'MetLife Stadium',
            '吉列球场': 'Gillette Stadium',
            'BC广场': 'BC Place',
            'NRG球场': 'NRG Stadium',
            'AT&T球场': 'AT&T Stadium',
            '林肯金融球场': 'Lincoln Financial Field',
            'BBVA球场': 'Estadio BBVA',
            '梅赛德斯-奔驰球场': 'Mercedes-Benz Stadium',
            '卢门球场': 'Lumen Field',
            '硬石体育场': 'Hard Rock Stadium',
            '箭头体育场': 'Arrowhead Stadium',
        };
        newDesc = desc + ' | 📍' + info.city + ', ' + info.country + ', ' + engMap[info.chi] + ' (' + info.chi + ')';
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
const chiNames = Object.values(stadiumInfo).map(s => s.chi);
for (const ev of ve) {
    const loc = ev.match(/LOCATION:([^\r\n]+)/)?.[1] || '';
    let desc = ev.match(/DESCRIPTION:([^\r\n]+)/)?.[1] || '';
    
    // 检查 LOCATION 是中文格式
    const hasChiInLoc = chiNames.some(chi => loc.includes(chi));
    if (!hasChiInLoc) {
        errors++;
        if (errors <= 3) {
            console.log('❌ LOCATION 不是中文: ' + loc);
        }
    }
    
    // 检查 DESCRIPTION 有中文名
    const hasChiInDesc = chiNames.some(chi => desc.includes(chi));
    if (!hasChiInDesc) {
        errors++;
        if (errors <= 3) {
            console.log('❌ DESCRIPTION 无中文名: ' + desc);
        }
    }
}

console.log('✅ 验证完成');
console.log('❌ 问题数: ' + errors);
console.log('');
console.log('示例 (前5个):');
ve.slice(0, 5).forEach(ev => {
    const summary = ev.match(/SUMMARY:([^\r\n]+)/)?.[1] || '';
    let desc = ev.match(/DESCRIPTION:([^\r\n]+)/)?.[1] || '';
    const loc = ev.match(/LOCATION:([^\r\n]+)/)?.[1] || '';
    const dtstart = ev.match(/DTSTART:([^\r\n]+)/)?.[1] || '';
    const dtend = ev.match(/DTEND:([^\r\n]+)/)?.[1] || '';
    console.log('---');
    console.log(summary);
    console.log(dtstart + ' -> ' + dtend);
    console.log('DESC: ' + desc);
    console.log('LOC: ' + loc);
});
