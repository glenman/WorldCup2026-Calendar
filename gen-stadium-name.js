const fs = require('fs');
let ics = fs.readFileSync('worldcup2026.ics', 'utf8');

// 球场 → "体育场名, 街道地址"格式
const addrMap = {
    '阿兹特克球场': 'Estadio Azteca, Calz. de Tlalpan 3465, Santa Úrsula Coapa, Coyoacán, 04650 Ciudad de México, CDMX, Mexico',
    '阿克伦球场': 'Estadio Akron, Calle Circuito JVC 2800, El Salto, Jalisco 45645, Mexico',
    'BMO球场': "BMO Field, 170 Princes' Blvd, Toronto, ON M6K 3C3, Canada",
    'SoFi体育场': 'SoFi Stadium, 1001 S Stadium Dr, Inglewood, CA 90301, USA',
    '李维斯球场': 'Levi\'s Stadium, 4900 Marie P DeBartolo Way, Santa Clara, CA 95054, USA',
    '大都会人寿球场': 'MetLife Stadium, 1 MetLife Stadium Dr, East Rutherford, NJ 07073, USA',
    '吉列球场': 'Gillette Stadium, 1 Patriot Pl, Foxborough, MA 02035, USA',
    'BC广场': 'BC Place, 777 Pacific Blvd, Vancouver, BC V6B 4Y8, Canada',
    'NRG球场': 'NRG Stadium, 1 NRG Pkwy, Houston, TX 77054, USA',
    'AT&T球场': 'AT&T Stadium, 1 AT&T Way, Arlington, TX 76011, USA',
    '林肯金融球场': 'Lincoln Financial Field, 1 Lincoln Financial Field Way, Philadelphia, PA 19148, USA',
    'BBVA球场': 'Estadio BBVA, Av. Pablo Livas 2011, Guadalupe, NL 67195, Mexico',
    '梅赛德斯-奔驰球场': 'Mercedes-Benz Stadium, 1 AMB Dr NW, Atlanta, GA 30313, USA',
    '卢门球场': 'Lumen Field, 800 Occidental Ave S, Seattle, WA 98134, USA',
    '硬石体育场': 'Hard Rock Stadium, 347 Don Shula Dr, Miami Gardens, FL 33056, USA',
    '箭头体育场': 'Arrowhead Stadium, 1 Arrowhead Dr, Kansas City, MO 64129, USA',
};

// 按事件逐个处理
let resultIcs = '';
const events = ics.split('BEGIN:VEVENT').slice(1);

for (const ev of events) {
    const locMatch = ev.match(/LOCATION:([^\r\n]+)/);
    const loc = locMatch ? locMatch[1] : '';
    const geoMatch = ev.match(/GEO:([^\r\n]+)/);
    const geo = geoMatch ? geoMatch[1] : '';
    
    // 找到标准地址
    let standardAddr = null;
    for (const [stadium, addr] of Object.entries(addrMap)) {
        if (loc.includes(stadium)) {
            standardAddr = addr;
            break;
        }
    }
    if (!standardAddr) {
        for (const addr of Object.values(addrMap)) {
            if (loc.includes(addr.split(',')[0])) {
                standardAddr = addr;
                break;
            }
        }
    }
    if (!standardAddr) {
        standardAddr = loc;
    }
    
    // 构建新事件
    const lines = ev.split('\r\n').filter(line => !line.startsWith('X-APPLE-') && !line.startsWith('LOCATION:'));
    resultIcs += 'BEGIN:VEVENT\r\n';
    resultIcs += 'LOCATION:' + standardAddr + '\r\n';
    for (const line of lines) {
        if (line.startsWith('LOCATION:')) continue;
        resultIcs += line + '\r\n';
    }
    if (geo) {
        resultIcs = resultIcs.replace(
            'GEO:' + geo + '\r\n',
            'GEO:' + geo + '\r\nX-APPLE-STRUCTURED-LOCATION;VALUE=URI;X-APPLE-RADIUS=500;X-TITLE=' + standardAddr + ':geo:' + geo.replace('GEO:', '') + '\r\n'
        );
    }
    resultIcs += 'END:VEVENT\r\n';
}

const header = ics.match(/BEGIN:VCALENDAR[\s\S]*?BEGIN:VEVENT/)?.[0] || '';
let finalIcs = 'BEGIN:VCALENDAR\r\nVERSION:2.0\r\nPRODID:-//WorldCup26//ZH\r\n';
finalIcs += resultIcs + 'END:VCALENDAR\r\n';

// 清理
finalIcs = finalIcs.replace(/(X-APPLE-STRUCTURED-LOCATION[^:]+:[^:]+:[^\r\n]+)\r?\n\1/g, '$1');
finalIcs = finalIcs.replace(/END:VEVENT\r?\nEND:VEVENT/g, 'END:VEVENT');

fs.writeFileSync('worldcup2026.ics', finalIcs);

// 验证
let errors = 0;
const verifyEvents = finalIcs.split('BEGIN:VEVENT').slice(1);
for (const ev of verifyEvents) {
    const loc = ev.match(/LOCATION:([^\r\n]+)/)?.[1] || '';
    const title = ev.match(/X-APPLE-STRUCTURED-LOCATION;.*?X-TITLE=([^:]+):geo:/)?.[1] || '';
    const xappleCount = (ev.match(/X-APPLE-STRUCTURED-LOCATION/g) || []).length;
    
    if (xappleCount > 1) {
        errors++;
        console.log('❌ 重复 X-APPLE: ' + xappleCount);
    }
    if (loc && title && loc !== title) {
        errors++;
        if (errors <= 2) {
            console.log('❌ 不一致');
            console.log('  LOC: ' + loc);
            console.log('  TIT: ' + title);
        }
    }
}

console.log('✅ 验证完成');
console.log('❌ 问题数: ' + errors);
console.log('');
console.log('示例 (前5个):');
verifyEvents.slice(0, 5).forEach(ev => {
    const summary = ev.match(/SUMMARY:([^\r\n]+)/)?.[1] || '';
    const loc = ev.match(/LOCATION:([^\r\n]+)/)?.[1] || '';
    const title = ev.match(/X-APPLE-STRUCTURED-LOCATION;.*?X-TITLE=([^:]+):geo:/)?.[1] || '';
    console.log('---');
    console.log(summary);
    console.log('LOC: ' + loc);
    console.log('TIT: ' + title);
    console.log('一致: ' + (loc === title));
});