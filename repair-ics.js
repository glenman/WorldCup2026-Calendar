const fs = require('fs');
let ics = fs.readFileSync('worldcup2026.ics', 'utf8');

// 先从 GitHub 拉取干净版本
// 由于网络问题，手动解析当前文件

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

// 解析当前损坏的文件，提取正确的数据
// 用 "BEGIN:VEVENT" 分隔事件
const rawEvents = ics.split('BEGIN:VEVENT').slice(1);
let validEvents = [];

for (const raw of rawEvents) {
    const lines = raw.split('\r\n').filter(l => l.trim());
    
    // 提取各字段
    let uid = '', dtstart = '', dtend = '', summary = '', desc = '', location = '', geo = '';
    let inEvent = false;
    
    for (const line of lines) {
        if (line === 'END:VEVENT') {
            inEvent = false;
            continue;
        }
        if (!inEvent) {
            // 跳过空的或者不属于事件的行
            if (line.startsWith('BEGIN:VEVENT')) {
                inEvent = true;
                continue;
            }
            // 如果第一个非空行就是 END:VEVENT，跳过
            if (line === 'END:VEVENT') continue;
        }
        
        if (line.startsWith('UID:')) uid = line;
        else if (line.startsWith('DTSTART:')) dtstart = line;
        else if (line.startsWith('DTEND:')) dtend = line;
        else if (line.startsWith('SUMMARY:')) summary = line;
        else if (line.startsWith('DESCRIPTION:')) desc = line;
        else if (line.startsWith('LOCATION:')) location = line;
        else if (line.startsWith('GEO:')) geo = line;
    }
    
    if (uid && dtstart) {
        validEvents.push({ uid, dtstart, dtend, summary, desc, location, geo });
    }
}

console.log('解析到 ' + validEvents.length + ' 个事件');

// 生成正确的 ICS
let result = 'BEGIN:VCALENDAR\r\nVERSION:2.0\r\nPRODID:-//WorldCup26//ZH\r\n';

for (const ev of validEvents) {
    // 找到标准地址
    let standardAddr = ev.location;
    for (const [stadium, addr] of Object.entries(stadiumAddrMap)) {
        if (ev.location.includes(stadium)) {
            standardAddr = addr;
            break;
        }
    }
    
    const geoCoords = ev.geo ? ev.geo.replace('GEO:', '') : '';
    
    result += 'BEGIN:VEVENT\r\n';
    result += ev.uid + '\r\n';
    result += ev.dtstart + '\r\n';
    result += ev.dtend + '\r\n';
    result += ev.summary + '\r\n';
    result += ev.desc + '\r\n';
    result += 'LOCATION:' + standardAddr + '\r\n';
    result += 'GEO:' + geoCoords + '\r\n';
    if (geoCoords) {
        result += 'X-APPLE-STRUCTURED-LOCATION;VALUE=URI;X-APPLE-RADIUS=500;X-TITLE=' + standardAddr + ':geo:' + geoCoords + '\r\n';
    }
    result += 'END:VEVENT\r\n';
}

result += 'END:VCALENDAR\r\n';

fs.writeFileSync('worldcup2026.ics', result);

// 验证
const verifyEvents = result.split('BEGIN:VEVENT').slice(1);
let errors = 0;
for (const ev of verifyEvents) {
    const hasEnd = ev.includes('END:VEVENT');
    const hasGeo = ev.includes('GEO:');
    const hasApple = ev.includes('X-APPLE-STRUCTURED-LOCATION');
    const loc = ev.match(/LOCATION:([^\r\n]+)/)?.[1] || '';
    const title = ev.match(/X-APPLE-STRUCTURED-LOCATION;.*?X-TITLE=([^:]+):geo:/)?.[1] || '';
    
    if (!hasEnd || !hasGeo || !hasApple) {
        errors++;
        console.log('❌ 缺少字段');
        console.log('  hasEnd: ' + hasEnd + ', hasGeo: ' + hasGeo + ', hasApple: ' + hasApple);
    }
    if (loc && title && loc !== title) {
        errors++;
        if (errors <= 2) {
            console.log('❌ LOC/TIT 不一致');
        }
    }
}

console.log('✅ 验证完成');
console.log('❌ 问题数: ' + errors);
console.log('');
console.log('文件行数: ' + result.split('\r\n').length);
console.log('');
console.log('前3个事件预览:');
verifyEvents.slice(0, 3).forEach(ev => {
    const summary = ev.match(/SUMMARY:([^\r\n]+)/)?.[1] || '';
    const loc = ev.match(/LOCATION:([^\r\n]+)/)?.[1] || '';
    const geo = ev.match(/GEO:([^\r\n]+)/)?.[1] || '';
    console.log('---');
    console.log(summary);
    console.log('LOC: ' + loc);
    console.log('GEO: ' + geo);
    console.log('有 X-APPLE: ' + ev.includes('X-APPLE-STRUCTURED-LOCATION'));
});
