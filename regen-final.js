const fs = require('fs');
let ics = fs.readFileSync('worldcup2026.ics', 'utf8');

// 球场中文 → 标准地址映射
const addrMap = {
    '阿兹特克球场': 'Calz. de Tlalpan 3465, Santa Úrsula Coapa, Coyoacán, 04650 Ciudad de México, CDMX, Mexico',
    '阿克伦球场': 'Calle Circuito JVC 2800, El Salto, Jalisco 45645, Mexico',
    'BMO球场': "170 Princes' Blvd, Toronto, ON M6K 3C3, Canada",
    'SoFi体育场': '1001 S Stadium Dr, Inglewood, CA 90301, USA',
    '李维斯球场': '4900 Marie P DeBartolo Way, Santa Clara, CA 95054, USA',
    '大都会人寿球场': '1 MetLife Stadium Dr, East Rutherford, NJ 07073, USA',
    '吉列球场': '1 Patriot Pl, Foxborough, MA 02035, USA',
    'BC广场': '777 Pacific Blvd, Vancouver, BC V6B 4Y8, Canada',
    'NRG球场': '1 NRG Pkwy, Houston, TX 77054, USA',
    'AT&T球场': '1 AT&T Way, Arlington, TX 76011, USA',
    '林肯金融球场': '1 Lincoln Financial Field Way, Philadelphia, PA 19148, USA',
    'BBVA球场': 'Av. Pablo Livas 2011, Guadalupe, NL 67195, Mexico',
    '梅赛德斯-奔驰球场': '1 AMB Dr NW, Atlanta, GA 30313, USA',
    '卢门球场': '800 Occidental Ave S, Seattle, WA 98134, USA',
    '硬石体育场': '347 Don Shula Dr, Miami Gardens, FL 33056, USA',
    '箭头体育场': '1 Arrowhead Dr, Kansas City, MO 64129, USA',
};

// 按事件逐个处理
let resultIcs = '';
const events = ics.split('BEGIN:VEVENT').slice(1);

for (const ev of events) {
    // 获取原始 LOCATION
    const locMatch = ev.match(/LOCATION:([^\r\n]+)/);
    const loc = locMatch ? locMatch[1] : '';
    
    // 获取 GEO
    const geoMatch = ev.match(/GEO:([^\r\n]+)/);
    const geo = geoMatch ? geoMatch[1] : '';
    
    // 根据原始 LOCATION 找到对应的标准地址
    let standardAddr = null;
    for (const [stadium, addr] of Object.entries(addrMap)) {
        if (loc.includes(stadium)) {
            standardAddr = addr;
            break;
        }
    }
    
    // 如果没找到中文，尝试英文地址匹配
    if (!standardAddr) {
        for (const addr of Object.values(addrMap)) {
            if (loc.includes(addr.split(',')[0])) { // 街道地址开头
                standardAddr = addr;
                break;
            }
        }
    }
    
    // 如果没有找到标准地址，用原始 LOCATION
    if (!standardAddr) {
        standardAddr = loc;
    }
    
    // 构建新的事件 - 去掉所有 X-APPLE 行
    const lines = ev.split('\r\n').filter(line => !line.startsWith('X-APPLE-'));
    
    // 添加新的 LOCATION 和 X-APPLE
    resultIcs += 'BEGIN:VEVENT\r\n';
    resultIcs += 'LOCATION:' + standardAddr + '\r\n';
    for (const line of lines) {
        if (line.startsWith('LOCATION:')) continue; // 跳过旧的 LOCATION
        resultIcs += line + '\r\n';
    }
    // GEO 后添加 X-APPLE
    if (geo) {
        resultIcs = resultIcs.replace(
            'GEO:' + geo + '\r\n',
            'GEO:' + geo + '\r\nX-APPLE-STRUCTURED-LOCATION;VALUE=URI;X-APPLE-RADIUS=500;X-TITLE=' + standardAddr + ':geo:' + geo.replace('GEO:', '') + '\r\n'
        );
    }
    resultIcs += 'END:VEVENT\r\n';
}

fs.writeFileSync('worldcup2026.ics', resultIcs);

// 验证
let errors = 0;
const verifyEvents = resultIcs.split('BEGIN:VEVENT').slice(1);
for (const ev of verifyEvents) {
    const loc = ev.match(/LOCATION:([^\r\n]+)/)?.[1] || '';
    const title = ev.match(/X-APPLE-STRUCTURED-LOCATION;.*?X-TITLE=([^:]+):geo:/)?.[1] || '';
    const xappleCount = (ev.match(/X-APPLE/g) || []).length;
    
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
console.log('示例 (5个):');
verifyEvents.slice(0, 5).forEach(ev => {
    const summary = ev.match(/SUMMARY:([^\r\n]+)/)?.[1] || '';
    const loc = ev.match(/LOCATION:([^\r\n]+)/)?.[1] || '';
    const title = ev.match(/X-APPLE-STRUCTURED-LOCATION;.*?X-TITLE=([^:]+):geo:/)?.[1] || '';
    const geo = ev.match(/GEO:([^\r\n]+)/)?.[1] || '';
    const xappleCount = (ev.match(/X-APPLE/g) || []).length;
    console.log('---');
    console.log(summary);
    console.log('LOC: ' + loc);
    console.log('TIT: ' + title);
    console.log('GEO: ' + geo);
    console.log('X-APPLE count: ' + xappleCount);
    console.log('一致: ' + (loc === title));
});