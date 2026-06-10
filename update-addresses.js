const fs = require('fs');
let ics = fs.readFileSync('worldcup2026.ics', 'utf8');

// 球场名 -> 标准英文地址
const addrMap = {
    '阿兹特克球场': 'Calz. de Tlalpan 3465, Santa Úrsula Coapa, Coyoacán, 04650 Ciudad de México, CDMX, Mexico',
    '阿克伦球场': 'Estadio Akron, Calle Circuito JVC 2800, 45645 El Salto, Jal., Mexico',
    'BMO球场': "170 Princes' Boulevard, Toronto, ON M6K 3C3, Canada",
    'SoFi体育场': '1001 S Stadium Drive, Inglewood, CA 90301, United States',
    '李维斯球场': '4900 Marie P DeBartolo Way, Santa Clara, CA 95054, United States',
    '大都会人寿球场': '1 MetLife Stadium Dr, East Rutherford, NJ 07073, United States',
    '吉列球场': '1 Patriot Pl, Foxborough, MA 02035, United States',
    'BC广场': '777 Pacific Blvd, Vancouver, BC V6B 4Y8, Canada',
    'NRG球场': '1 NRG Pkwy, Houston, TX 77054, United States',
    'AT&T球场': '1 AT&T Way, Arlington, TX 76011, United States',
    '林肯金融球场': '1 Lincoln Financial Field Way, Philadelphia, PA 19148, United States',
    'BBVA球场': 'Estadio BBVA, Av. Pablo Livas 2011, La Pastora, 67195 Guadalupe, N.L., Mexico',
    '梅赛德斯-奔驰球场': '1 AMB Dr NW, Atlanta, GA 30313, United States',
    '卢门球场': '800 Occidental Ave S, Seattle, WA 98134, United States',
    '硬石体育场': '347 Don Shula Dr, Miami Gardens, FL 33056, United States',
    '箭头体育场': '1 Arrowhead Dr, Kansas City, MO 64129, United States',
};

for (const [stadium, address] of Object.entries(addrMap)) {
    // X-TITLE 后面可能是球场中文名或球场英文名，都要替换
    // 先替换可能存在的球场英文名（Estadio Azteca 等）
    const stadiumNames = [
        'Estadio Azteca', 'Estadio Akron', 'BMO Field', 'SoFi Stadium',
        'Levis Stadium', 'MetLife Stadium', 'Gillette Stadium', 'BC Place',
        'NRG Stadium', 'AT&T Stadium', 'Lincoln Financial Field',
        'Estadio BBVA', 'Mercedes-Benz Stadium', 'Lumen Field',
        'Hard Rock Stadium', 'Arrowhead Stadium',
        stadium  // 也替换中文球场名
    ];
    
    for (const sName of stadiumNames) {
        const pattern = new RegExp(
            '(X-APPLE-STRUCTURED-LOCATION;VALUE=URI;X-APPLE-RADIUS=500;X-TITLE=)' +
            sName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') +
            '(:geo:[^\\r\\n]*)',
            'g'
        );
        ics = ics.replace(pattern, `$1${address}$2`);
    }
}

fs.writeFileSync('worldcup2026.ics', ics);

// Verify
let foundIssues = false;
for (const sName of [
    'Estadio Azteca', 'Estadio Akron', 'BMO Field', 'SoFi Stadium',
    'Levis Stadium', 'MetLife Stadium', 'Gillette Stadium', 'BC Place',
    'NRG Stadium', 'AT&T Stadium', 'Lincoln Financial Field',
    'Estadio BBVA', 'Mercedes-Benz Stadium', 'Lumen Field',
    'Hard Rock Stadium', 'Arrowhead Stadium',
    '阿兹特克球场', '阿克伦球场', 'BMO球场', 'SoFi体育场',
    '李维斯球场', '大都会人寿球场', '吉列球场', 'BC广场',
    'NRG球场', 'AT&T球场', '林肯金融球场', 'BBVA球场',
    '梅赛德斯-奔驰球场', '卢门球场', '硬石体育场', '箭头体育场'
]) {
    if (ics.includes('X-TITLE=' + sName + ':geo:')) {
        console.log('❌ Still has X-TITLE=' + sName);
        foundIssues = true;
    }
}
if (!foundIssues) console.log('✅ All X-TITLEs updated');

// Show sample
const idx = ics.indexOf('wc26-1');
console.log('\n--- Sample events ---');
console.log(ics.substring(idx, idx+700));
