const fs = require('fs');
let ics = fs.readFileSync('/tmp/old-ics.ics', 'utf8');

// 球场中文名 -> {英文名, 城市英文, 国家英文, 英文地址}
const stadiumMap = {
    '阿兹特克球场': { eng: 'Estadio Azteca', city: 'Mexico City', country: 'Mexico', addr: 'Calz. de Tlalpan 3465, Santa Úrsula Coapa, Coyoacán, 04650 Ciudad de México, CDMX, Mexico', lat: 19.3029, lng: -99.1506 },
    '阿克伦球场': { eng: 'Estadio Akron', city: 'Guadalajara', country: 'Mexico', addr: 'Calle Circuito JVC 2800, El Salto, Jalisco 45645, Mexico', lat: 20.6737, lng: -103.3447 },
    'BMO球场': { eng: 'BMO Field', city: 'Toronto', country: 'Canada', addr: "170 Princes' Blvd, Toronto, ON M6K 3C3, Canada", lat: 43.6332, lng: -79.4186 },
    'SoFi体育场': { eng: 'SoFi Stadium', city: 'Inglewood', country: 'USA', addr: '1001 S Stadium Dr, Inglewood, CA 90301, USA', lat: 33.9535, lng: -118.3392 },
    '李维斯球场': { eng: "Levi's Stadium", city: 'Santa Clara', country: 'USA', addr: '4900 Marie P DeBartolo Way, Santa Clara, CA 95054, USA', lat: 37.4032, lng: -121.9712 },
    '大都会人寿球场': { eng: 'MetLife Stadium', city: 'East Rutherford', country: 'USA', addr: '1 MetLife Stadium Dr, East Rutherford, NJ 07073, USA', lat: 40.8128, lng: -74.0742 },
    '吉列球场': { eng: 'Gillette Stadium', city: 'Foxborough', country: 'USA', addr: '1 Patriot Pl, Foxborough, MA 02035, USA', lat: 42.0909, lng: -71.2643 },
    'BC广场': { eng: 'BC Place', city: 'Vancouver', country: 'Canada', addr: '777 Pacific Blvd, Vancouver, BC V6B 4Y8, Canada', lat: 49.2766, lng: -123.1119 },
    'NRG球场': { eng: 'NRG Stadium', city: 'Houston', country: 'USA', addr: '1 NRG Pkwy, Houston, TX 77054, USA', lat: 29.6847, lng: -95.4108 },
    'AT&T球场': { eng: 'AT&T Stadium', city: 'Arlington', country: 'USA', addr: '1 AT&T Way, Arlington, TX 76011, USA', lat: 32.7390, lng: -97.0931 },
    '林肯金融球场': { eng: 'Lincoln Financial Field', city: 'Philadelphia', country: 'USA', addr: '1 Lincoln Financial Field Way, Philadelphia, PA 19148, USA', lat: 39.9008, lng: -75.1675 },
    'BBVA球场': { eng: 'Estadio BBVA', city: 'Monterrey', country: 'Mexico', addr: 'Av. Pablo Livas 2011, Guadalupe, NL 67195, Mexico', lat: 25.6689, lng: -100.2418 },
    '梅赛德斯-奔驰球场': { eng: 'Mercedes-Benz Stadium', city: 'Atlanta', country: 'USA', addr: '1 AMB Dr NW, Atlanta, GA 30313, USA', lat: 33.7553, lng: -84.4006 },
    '卢门球场': { eng: 'Lumen Field', city: 'Seattle', country: 'USA', addr: '800 Occidental Ave S, Seattle, WA 98134, USA', lat: 47.5952, lng: -122.3316 },
    '硬石体育场': { eng: 'Hard Rock Stadium', city: 'Miami Gardens', country: 'USA', addr: '347 Don Shula Dr, Miami Gardens, FL 33056, USA', lat: 25.9580, lng: -80.2389 },
    '箭头体育场': { eng: 'Arrowhead Stadium', city: 'Kansas City', country: 'USA', addr: '1 Arrowhead Dr, Kansas City, MO 64129, USA', lat: 39.0489, lng: -94.4840 },
};

// 解析旧 ICS 的事件
const events = ics.split('BEGIN:VEVENT').slice(1);
let result = 'BEGIN:VCALENDAR\r\nVERSION:2.0\r\nPRODID:-//WorldCup26//ZH\r\n';

for (const ev of events) {
    const loc = ev.match(/LOCATION:([^\r\n]+)/)?.[1] || '';
    const desc = ev.match(/DESCRIPTION:([^\r\n]*)/)?.[1] || '';
    const summary = ev.match(/SUMMARY:([^\r\n]*)/)?.[1] || '';
    
    // 从 LOCATION 中提取城市+球场名（格式: 国家 城市 球场名）
    let stadiumChi = '', cityChi = '', countryChi = '';
    for (const chi of Object.keys(stadiumMap)) {
        if (loc.includes(chi)) {
            stadiumChi = chi;
            break;
        }
    }
    
    // 提取城市名（第二个词）和国家名（第一个词）
    const locParts = loc.split(/\s+/);
    countryChi = locParts[0] || '';
    cityChi = locParts[1] || '';
    
    // 获取英文名和英文地址
    const info = stadiumMap[stadiumChi];
    
    // 构建 LOCATION: 中文 国家 城市 球场名
    let newLoc = loc.trim();
    
    // 构建 DESCRIPTION: 小组赛 A组 📍城市, 国家, 球场名
    let newDesc = desc;
    if (stadiumChi) {
        newDesc = desc + ' | 📍' + cityChi + ', ' + countryChi + ', ' + stadiumChi;
    }
    
    // 构建 GEO
    const lat = info ? info.lat : 0;
    const lng = info ? info.lng : 0;
    const geo = 'GEO:' + lat + ',' + lng + '\r\n';
    
    // 构建 X-APPLE-STRUCTURED-LOCATION
    const apple = 'X-APPLE-STRUCTURED-LOCATION;VALUE=URI;X-APPLE-RADIUS=500;X-TITLE=' + info?.addr + ':geo:' + lat + ',' + lng + '\r\n';
    
    result += 'BEGIN:VEVENT\r\n';
    result += ev.match(/UID:[^\r\n]*\r?\n/)?.[0] || '';
    result += ev.match(/DTSTART:[^\r\n]*\r?\n/)?.[0] || '';
    result += ev.match(/DTEND:[^\r\n]*\r?\n/)?.[0] || '';
    result += 'SUMMARY:' + summary + '\r\n';
    result += 'DESCRIPTION:' + newDesc + '\r\n';
    result += 'LOCATION:' + newLoc + '\r\n';
    result += geo;
    if (info) result += apple;
    result += 'END:VEVENT\r\n';
}
result += 'END:VCALENDAR\r\n';

fs.writeFileSync('worldcup2026.ics', result);

// 验证
const ve = result.split('BEGIN:VEVENT').slice(1);
let errors = 0;
for (const ev of ve) {
    const loc = ev.match(/LOCATION:([^\r\n]+)/)?.[1] || '';
    const desc = ev.match(/DESCRIPTION:([^\r\n]+)/)?.[1] || '';
    const geo = ev.match(/GEO:([^\r\n]+)/)?.[1] || '';
    const apple = ev.match(/X-APPLE-STRUCTURED-LOCATION/)?.[0];
    
    if (!loc.includes('球场') && !loc.includes('广场')) {
        errors++;
        console.log('❌ LOCATION 不含球场名: ' + loc);
    }
    if (!desc.includes('📍')) {
        errors++;
        console.log('❌ DESCRIPTION 不含备注: ' + desc);
    }
    if (!geo) {
        errors++;
        console.log('❌ 无 GEO');
    }
    if (!apple) {
        errors++;
        console.log('❌ 无 X-APPLE');
    }
}

console.log('✅ 验证完成');
console.log('❌ 问题数: ' + errors);
console.log('');
console.log('示例 (前5个):');
ve.slice(0, 5).forEach(ev => {
    const summary = ev.match(/SUMMARY:([^\r\n]+)/)?.[1] || '';
    const desc = ev.match(/DESCRIPTION:([^\r\n]+)/)?.[1] || '';
    const loc = ev.match(/LOCATION:([^\r\n]+)/)?.[1] || '';
    const geo = ev.match(/GEO:([^\r\n]+)/)?.[1] || '';
    console.log('---');
    console.log(summary);
    console.log('DESC: ' + desc);
    console.log('LOC: ' + loc);
    console.log('GEO: ' + geo);
    console.log('有 X-APPLE: ' + !!ev.match(/X-APPLE/));
});
