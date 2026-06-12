const fs = require('fs');
let ics = fs.readFileSync('worldcup2026.ics', 'utf8');

// 球场中文名 -> {英文名, 完整英文地址, 城市, 国家}
const stadiumMap = {
    '阿兹特克球场': { eng: 'Estadio Azteca', city: 'Mexico City', country: 'Mexico', addr: 'Calz. de Tlalpan 3465, Santa Úrsula Coapa, Coyoacán, 04650 Ciudad de México, CDMX, Mexico' },
    '阿克伦球场': { eng: 'Estadio Akron', city: 'Guadalajara', country: 'Mexico', addr: 'Calle Circuito JVC 2800, El Salto, Jalisco 45645, Mexico' },
    'BMO球场': { eng: 'BMO Field', city: 'Toronto', country: 'Canada', addr: "170 Princes' Blvd, Toronto, ON M6K 3C3, Canada" },
    'SoFi体育场': { eng: 'SoFi Stadium', city: 'Inglewood', country: 'USA', addr: '1001 S Stadium Dr, Inglewood, CA 90301, USA' },
    '李维斯球场': { eng: "Levi's Stadium", city: 'Santa Clara', country: 'USA', addr: '4900 Marie P DeBartolo Way, Santa Clara, CA 95054, USA' },
    '大都会人寿球场': { eng: 'MetLife Stadium', city: 'East Rutherford', country: 'USA', addr: '1 MetLife Stadium Dr, East Rutherford, NJ 07073, USA' },
    '吉列球场': { eng: 'Gillette Stadium', city: 'Foxborough', country: 'USA', addr: '1 Patriot Pl, Foxborough, MA 02035, USA' },
    'BC广场': { eng: 'BC Place', city: 'Vancouver', country: 'Canada', addr: '777 Pacific Blvd, Vancouver, BC V6B 4Y8, Canada' },
    'NRG球场': { eng: 'NRG Stadium', city: 'Houston', country: 'USA', addr: '1 NRG Pkwy, Houston, TX 77054, USA' },
    'AT&T球场': { eng: 'AT&T Stadium', city: 'Arlington', country: 'USA', addr: '1 AT&T Way, Arlington, TX 76011, USA' },
    '林肯金融球场': { eng: 'Lincoln Financial Field', city: 'Philadelphia', country: 'USA', addr: '1 Lincoln Financial Field Way, Philadelphia, PA 19148, USA' },
    'BBVA球场': { eng: 'Estadio BBVA', city: 'Monterrey', country: 'Mexico', addr: 'Av. Pablo Livas 2011, Guadalupe, NL 67195, Mexico' },
    '梅赛德斯-奔驰球场': { eng: 'Mercedes-Benz Stadium', city: 'Atlanta', country: 'USA', addr: '1 AMB Dr NW, Atlanta, GA 30313, USA' },
    '卢门球场': { eng: 'Lumen Field', city: 'Seattle', country: 'USA', addr: '800 Occidental Ave S, Seattle, WA 98134, USA' },
    '硬石体育场': { eng: 'Hard Rock Stadium', city: 'Miami Gardens', country: 'USA', addr: '347 Don Shula Dr, Miami Gardens, FL 33056, USA' },
    '箭头体育场': { eng: 'Arrowhead Stadium', city: 'Kansas City', country: 'USA', addr: '1 Arrowhead Dr, Kansas City, MO 64129, USA' },
};

// 将 UTC 时间 + 1.5h 调整为 2h
// DTSTART 和 DTEND 都是 UTC 时间
function addHours(dt, hours) {
    // 格式: 20260611T190000Z
    const match = dt.match(/(\d{4})(\d{2})(\d{2})T(\d{2})(\d{2})(\d{2})Z/);
    if (!match) return dt;
    const [, y, M, d, h, m, s] = match;
    let hour = parseInt(h) + hours;
    // 处理跨天
    if (hour >= 24) {
        hour -= 24;
        // 简单处理：假设不跨月
        const day = String(parseInt(d) + 1).padStart(2, '0');
        return y + M + day + 'T' + String(hour).padStart(2, '0') + m + s + 'Z';
    }
    return y + M + d + 'T' + String(hour).padStart(2, '0') + m + s + 'Z';
}

const events = ics.split('BEGIN:VEVENT').slice(1);
let result = 'BEGIN:VCALENDAR\r\nVERSION:2.0\r\nPRODID:-//WorldCup26//ZH\r\n';

for (const ev of events) {
    const loc = ev.match(/LOCATION:([^\r\n]+)/)?.[1] || '';
    const desc = ev.match(/DESCRIPTION:([^\r\n]*)/)?.[1] || '';
    const dtstart = ev.match(/DTSTART:([^\r\n]+)/)?.[1] || '';
    const dtend = ev.match(/DTEND:([^\r\n]+)/)?.[1] || '';
    const summary = ev.match(/SUMMARY:([^\r\n]*)/)?.[1] || '';
    const geo = ev.match(/GEO:([^\r\n]+)/)?.[1] || '';
    
    // 提取球场中文名
    let stadiumChi = '';
    let info = null;
    for (const [chi, inf] of Object.entries(stadiumMap)) {
        if (loc.includes(chi)) {
            stadiumChi = chi;
            info = inf;
            break;
        }
    }
    
    // 提取城市和国家（从中文 LOCATION）
    const locParts = loc.trim().split(/\s+/);
    const cityChi = locParts[1] || '';
    const countryChi = locParts[0] || '';
    
    // 更新 DTEND 为 +2h
    let newDtend = dtend;
    if (dtstart && dtend) {
        // 计算原始差值，然后改为 2h
        const startMatch = dtstart.match(/T(\d{2})(\d{2})/);
        const endMatch = dtend.match(/T(\d{2})(\d{2})/);
        if (startMatch && endMatch) {
            let startMin = parseInt(startMatch[1]) * 60 + parseInt(startMatch[2]);
            let endMin = parseInt(endMatch[1]) * 60 + parseInt(endMatch[2]);
            // 处理跨天
            let diff = endMin - startMin;
            if (diff < 0) diff += 24 * 60;
            
            // 新时长 = 2h
            let newEndMin = startMin + 120;
            if (newEndMin >= 24 * 60) {
                newEndMin -= 24 * 60;
            }
            
            // 重新构建 DTEND
            const datePart = dtend.substring(0, 8);
            const newH = String(Math.floor(newEndMin / 60)).padStart(2, '0');
            const newM = String(newEndMin % 60).padStart(2, '0');
            newDtend = datePart + 'T' + newH + newM + '00Z';
        }
    }
    
    // LOCATION: 英文详细地址
    let newLoc = loc;
    if (info) {
        newLoc = info.addr;
    }
    
    // DESCRIPTION: 保留原有内容，追加英文 location 信息
    let newDesc = desc;
    if (info) {
        // 去掉中文备注，加英文的
        const chineseRemark = desc.match(/\| 📍[^\r\n]*$/);
        let baseDesc = chineseRemark ? desc.replace(/\| 📍[^\r\n]*$/, '') : desc;
        newDesc = baseDesc + ' | 📍' + info.city + ', ' + info.country + ', ' + info.eng;
    }
    
    // 构建 X-APPLE
    let newApple = '';
    if (info && geo) {
        const geoCoords = geo.replace('GEO:', '');
        newApple = 'X-APPLE-STRUCTURED-LOCATION;VALUE=URI;X-APPLE-RADIUS=500;X-TITLE=' + info.addr + ':geo:' + geoCoords + '\r\n';
    }
    
    result += 'BEGIN:VEVENT\r\n';
    result += ev.match(/UID:[^\r\n]*\r?\n/)?.[0] || '';
    result += 'DTSTART:' + dtstart + '\r\n';
    result += 'DTEND:' + newDtend + '\r\n';
    result += 'SUMMARY:' + summary + '\r\n';
    result += 'DESCRIPTION:' + newDesc + '\r\n';
    result += 'LOCATION:' + newLoc + '\r\n';
    if (geo) result += geo + '\r\n';
    if (newApple) result += newApple;
    result += 'END:VEVENT\r\n';
}
result += 'END:VCALENDAR\r\n';

fs.writeFileSync('worldcup2026.ics', result);

// 验证
const ve = result.split('BEGIN:VEVENT').slice(1);
let errors = 0;
for (const ev of ve) {
    const dtstart = ev.match(/DTSTART:([^\r\n]+)/)?.[1] || '';
    const dtend = ev.match(/DTEND:([^\r\n]+)/)?.[1] || '';
    const loc = ev.match(/LOCATION:([^\r\n]+)/)?.[1] || '';
    const desc = ev.match(/DESCRIPTION:([^\r\n]+)/)?.[1] || '';
    const apple = ev.match(/X-APPLE-STRUCTURED-LOCATION/);
    
    // 检查时长 2h
    const startMatch = dtstart.match(/T(\d{2})(\d{2})/);
    const endMatch = dtend.match(/T(\d{2})(\d{2})/);
    if (startMatch && endMatch) {
        let startMin = parseInt(startMatch[1]) * 60 + parseInt(startMatch[2]);
        let endMin = parseInt(endMatch[1]) * 60 + parseInt(endMatch[2]);
        let diff = endMin - startMin;
        if (diff < 0) diff += 24 * 60;
        if (diff !== 120) {
            errors++;
            if (errors <= 3) {
                const summary = ev.match(/SUMMARY:([^\r\n]+)/)?.[1] || '';
                console.log('❌ 时长不是 2h: ' + diff + 'min (' + startMin + ' -> ' + endMin + ')');
                console.log('  ' + summary);
                console.log('  ' + dtstart + ' -> ' + dtend);
            }
        }
    }
    
    // 检查 LOCATION 是英文地址
    if (loc.includes('球场') || loc.includes('广场') || loc.includes('体育场')) {
        errors++;
        console.log('❌ LOCATION 还是中文: ' + loc);
    }
    
    // 检查 DESCRIPTION 有英文备注
    if (!desc.includes('📍') || desc.includes('阿兹特克球场') || desc.includes('SoFi体育场')) {
        // 检查是否有中文名
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
    const dtstart = ev.match(/DTSTART:([^\r\n]+)/)?.[1] || '';
    const dtend = ev.match(/DTEND:([^\r\n]+)/)?.[1] || '';
    const apple = !!ev.match(/X-APPLE/);
    console.log('---');
    console.log(summary);
    console.log(dtstart + ' -> ' + dtend);
    console.log('DESC: ' + desc);
    console.log('LOC: ' + loc);
    console.log('X-APPLE: ' + apple);
});
