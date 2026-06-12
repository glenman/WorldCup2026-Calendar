const fs = require('fs');
let ics = fs.readFileSync('worldcup2026.ics', 'utf8');

// 体育场英文名 -> 标准纯地址映射
const stadiumNameMap = {
    'Estadio Azteca': 'Calz. de Tlalpan 3465, Santa Úrsula Coapa, Coyoacán, 04650 Ciudad de México, CDMX, Mexico',
    'Estadio Akron': 'Calle Circuito JVC 2800, 45645 El Salto, Jal., Mexico',
    'BMO Field': "170 Princes' Boulevard, Toronto, ON M6K 3C3, Canada",
    'SoFi Stadium': '1001 S Stadium Drive, Inglewood, CA 90301, United States',
    'Levis Stadium': '4900 Marie P DeBartolo Way, Santa Clara, CA 95054, United States',
    'MetLife Stadium': '1 MetLife Stadium Dr, East Rutherford, NJ 07073, United States',
    'Gillette Stadium': '1 Patriot Pl, Foxborough, MA 02035, United States',
    'BC Place': '777 Pacific Blvd, Vancouver, BC V6B 4Y8, Canada',
    'NRG Stadium': '1 NRG Pkwy, Houston, TX 77054, United States',
    'AT&T Stadium': '1 AT&T Way, Arlington, TX 76011, United States',
    'Lincoln Financial Field': '1 Lincoln Financial Field Way, Philadelphia, PA 19148, United States',
    'Estadio BBVA': 'Av. Pablo Livas 2011, La Pastora, 67195 Guadalupe, N.L., Mexico',
    'Mercedes-Benz Stadium': '1 AMB Dr NW, Atlanta, GA 30313, United States',
    'Lumen Field': '800 Occidental Ave S, Seattle, WA 98134, United States',
    'Hard Rock Stadium': '347 Don Shula Dr, Miami Gardens, FL 33056, United States',
    'Arrowhead Stadium': '1 Arrowhead Dr, Kansas City, MO 64129, United States',
};

// 中文球场名 -> 标准纯地址映射（用于替换 LOCATION 中的中文+体育场名）
const chineseStadiumMap = {
    '阿兹特克球场': 'Calz. de Tlalpan 3465, Santa Úrsula Coapa, Coyoacán, 04650 Ciudad de México, CDMX, Mexico',
    '阿克伦球场': 'Calle Circuito JVC 2800, 45645 El Salto, Jal., Mexico',
    'BMO球场': "170 Princes' Boulevard, Toronto, ON M6K 3C3, Canada",
    'SoFi体育场': '1001 S Stadium Drive, Inglewood, CA 90301, United States',
    '李维斯球场': '4900 Marie P DeBartolo Way, Santa Clara, CA 95054, United States',
    '大都会人寿球场': '1 MetLife Stadium Dr, East Rutherford, NJ 07073, United States',
    '吉列球场': '1 Patriot Pl, Foxborough, MA 02035, United States',
    'BC广场': '777 Pacific Blvd, Vancouver, BC V6B 4Y8, Canada',
    'NRG球场': '1 NRG Pkwy, Houston, TX 77054, United States',
    'AT&T球场': '1 AT&T Way, Arlington, TX 76011, United States',
    '林肯金融球场': '1 Lincoln Financial Field Way, Philadelphia, PA 19148, United States',
    'BBVA球场': 'Av. Pablo Livas 2011, La Pastora, 67195 Guadalupe, N.L., Mexico',
    '梅赛德斯-奔驰球场': '1 AMB Dr NW, Atlanta, GA 30313, United States',
    '卢门球场': '800 Occidental Ave S, Seattle, WA 98134, United States',
    '硬石体育场': '347 Don Shula Dr, Miami Gardens, FL 33056, United States',
    '箭头体育场': '1 Arrowhead Dr, Kansas City, MO 64129, United States',
};

// 替换英文体育场名
for (const [name, addr] of Object.entries(stadiumNameMap)) {
    // LOCATION 替换
    ics = ics.replace(new RegExp('LOCATION:' + name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g'), 'LOCATION:' + addr);
    // X-TITLE 替换
    ics = ics.replace(new RegExp('(X-APPLE-STRUCTURED-LOCATION;VALUE=URI;X-APPLE-RADIUS=500;X-TITLE=)' + name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + '(:geo:[^\\r\\n]*)', 'g'), `$1${addr}$2`);
}

// 替换中文球场名
for (const [name, addr] of Object.entries(chineseStadiumMap)) {
    ics = ics.replace(new RegExp('LOCATION:[^\\r\\n]*?' + name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + '[^\\r\\n]*', 'g'), 'LOCATION:' + addr);
}

fs.writeFileSync('worldcup2026.ics', ics);

// 验证
let errors = 0;
const events = ics.split('BEGIN:VEVENT').slice(1);
for (const ev of events) {
    const loc = ev.match(/LOCATION:([^\r\n]+)/)?.[1];
    const xtitle = ev.match(/X-APPLE-STRUCTURED-LOCATION;.*?X-TITLE=([^:]+)/)?.[1];
    
    // 检查是否还有体育场名
    const allNames = [...Object.keys(stadiumNameMap), ...Object.keys(chineseStadiumMap)];
    for (const name of allNames) {
        if (loc && loc.includes(name)) {
            console.log('❌ LOCATION 还有: ' + name + ' -> ' + loc);
            errors++;
        }
        if (xtitle && xtitle.includes(name)) {
            console.log('❌ X-TITLE 还有: ' + name);
            errors++;
        }
    }
}

console.log('✅ 地址修正完成');
console.log('❌ 错误数: ' + errors);
console.log('');
console.log('示例:');
console.log(ics.substring(ics.indexOf('wc26-1'), ics.indexOf('wc26-1') + 600));