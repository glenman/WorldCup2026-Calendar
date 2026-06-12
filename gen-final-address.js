const fs = require('fs');
let ics = fs.readFileSync('worldcup2026.ics', 'utf8');

// 清理重复地址
ics = ics.replace(/(LOCATION:([^\r\n]+)), \2/g, '$1');

// 按事件处理
const events = ics.split('BEGIN:VEVENT').slice(1);
let resultIcs = '';

// 球场映射
const stadiumAddrMap = {
    'Estadio Azteca': 'Estadio Azteca, Calz. de Tlalpan 3465, Santa Úrsula Coapa, Coyoacán, 04650 Ciudad de México, CDMX, Mexico',
    'Estadio Akron': 'Estadio Akron, Calle Circuito JVC 2800, El Salto, Jalisco 45645, Mexico',
    'BMO Field': "BMO Field, 170 Princes' Blvd, Toronto, ON M6K 3C3, Canada",
    'SoFi Stadium': 'SoFi Stadium, 1001 S Stadium Dr, Inglewood, CA 90301, USA',
    'Levis Stadium': 'Levis Stadium, 4900 Marie P DeBartolo Way, Santa Clara, CA 95054, USA',
    'MetLife Stadium': 'MetLife Stadium, 1 MetLife Stadium Dr, East Rutherford, NJ 07073, USA',
    'Gillette Stadium': 'Gillette Stadium, 1 Patriot Pl, Foxborough, MA 02035, USA',
    'BC Place': 'BC Place, 777 Pacific Blvd, Vancouver, BC V6B 4Y8, Canada',
    'NRG Stadium': 'NRG Stadium, 1 NRG Pkwy, Houston, TX 77054, USA',
    'AT&T Stadium': 'AT&T Stadium, 1 AT&T Way, Arlington, TX 76011, USA',
    'Lincoln Financial Field': 'Lincoln Financial Field, 1 Lincoln Financial Field Way, Philadelphia, PA 19148, USA',
    'Estadio BBVA': 'Estadio BBVA, Av. Pablo Livas 2011, Guadalupe, NL 67195, Mexico',
    'Mercedes-Benz Stadium': 'Mercedes-Benz Stadium, 1 AMB Dr NW, Atlanta, GA 30313, USA',
    'Lumen Field': 'Lumen Field, 800 Occidental Ave S, Seattle, WA 98134, USA',
    'Hard Rock Stadium': 'Hard Rock Stadium, 347 Don Shula Dr, Miami Gardens, FL 33056, USA',
    'Arrowhead Stadium': 'Arrowhead Stadium, 1 Arrowhead Dr, Kansas City, MO 64129, USA',
};

for (const ev of events) {
    const loc = ev.match(/LOCATION:([^\r\n]+)/)?.[1] || '';
    const geo = ev.match(/GEO:([^\r\n]+)/)?.[1] || '';
    
    // 找到完整地址
    let standardAddr = null;
    for (const [stadium, addr] of Object.entries(stadiumAddrMap)) {
        if (loc.includes(stadium)) {
            standardAddr = addr;
            break;
        }
    }
    if (!standardAddr) {
        standardAddr = loc;
    }
    
    // 构建事件
    resultIcs += 'BEGIN:VEVENT\r\n';
    resultIcs += 'LOCATION:' + standardAddr + '\r\n';
    
    // 添加其他行
    const lines = ev.split('\r\n').filter(line => 
        !line.startsWith('LOCATION:') && 
        !line.startsWith('GEO:') && 
        !line.startsWith('X-APPLE-')
    );
    for (const line of lines) {
        if (line.trim()) resultIcs += line + '\r\n';
    }
    
    // 添加 GEO 和 X-APPLE
    if (geo) {
        const geoCoords = geo.replace('GEO:', '');
        resultIcs += 'GEO:' + geoCoords + '\r\n';
        resultIcs += 'X-APPLE-STRUCTURED-LOCATION;VALUE=URI;X-APPLE-RADIUS=500;X-TITLE=' + standardAddr + ':geo:' + geoCoords + '\r\n';
    }
    resultIcs += 'END:VEVENT\r\n';
}

const header = ics.match(/BEGIN:VCALENDAR[\s\S]*?BEGIN:VEVENT/)?.[0] || '';
let finalIcs = 'BEGIN:VCALENDAR\r\nVERSION:2.0\r\nPRODID:-//WorldCup26//ZH\r\n';
finalIcs += resultIcs + 'END:VCALENDAR\r\n';

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
        if (errors <= 3) {
            console.log('❌ 不一致');
            console.log('  LOC: ' + loc);
            console.log('  TIT: ' + title);
        }
    }
}

console.log('✅ 验证完成');
console.log('❌ 问题数: ' + errors);
console.log('');
console.log('所有 LOCATION (16个):');
const locs = new Set();
verifyEvents.forEach(ev => {
    const loc = ev.match(/LOCATION:([^\r\n]+)/)?.[1] || '';
    locs.add(loc);
});
locs.forEach(l => console.log('  ' + l));