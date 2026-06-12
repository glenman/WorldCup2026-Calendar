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

// 替换所有 LOCATION 和 X-TITLE
for (const [stadium, addr] of Object.entries(addrMap)) {
    // 替换 LOCATION 行
    ics = ics.replace(
        new RegExp('(LOCATION:)[^\\r\\n]*(' + stadium.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + ')[^\\r\\n]*', 'g'),
        '$1' + addr
    );
    // 替换 X-TITLE
    ics = ics.replace(
        new RegExp('(X-APPLE-STRUCTURED-LOCATION;VALUE=URI;X-APPLE-RADIUS=500;X-TITLE=)[^:]+(:geo:[^\\r\\n]*)', 'g'),
        `$1${addr}$2`
    );
}

fs.writeFileSync('worldcup2026.ics', ics);

// 验证
const events = ics.split('BEGIN:VEVENT').slice(1);
let errors = 0;
for (const ev of events) {
    const loc = ev.match(/LOCATION:([^\r\n]+)/)?.[1] || '';
    const title = ev.match(/X-APPLE-STRUCTURED-LOCATION;.*?X-TITLE=([^:]+):geo:/)?.[1] || '';
    const xappleCount = (ev.match(/X-APPLE/g) || []).length;
    
    if (loc !== title) {
        errors++;
        if (errors <= 3) {
            console.log('❌ 不一致');
            console.log('  LOC: ' + loc);
            console.log('  TIT: ' + title);
        }
    }
    if (xappleCount > 1) {
        errors++;
        console.log('❌ 重复 X-APPLE: ' + xappleCount);
    }
}

console.log('✅ 验证完成');
console.log('❌ 问题数: ' + errors);
console.log('');
console.log('示例 (5个):');
const samples = events.slice(0, 5);
samples.forEach(ev => {
    const summary = ev.match(/SUMMARY:([^\r\n]+)/)?.[1] || '';
    const loc = ev.match(/LOCATION:([^\r\n]+)/)?.[1] || '';
    const title = ev.match(/X-APPLE-STRUCTURED-LOCATION;.*?X-TITLE=([^:]+):geo:/)?.[1] || '';
    const geo = ev.match(/GEO:([^\r\n]+)/)?.[1] || '';
    console.log('---');
    console.log(summary);
    console.log('LOC: ' + loc);
    console.log('TIT: ' + title);
    console.log('GEO: ' + geo);
    console.log('一致: ' + (loc === title));
});