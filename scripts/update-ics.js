// update-ics.js — 仅从 matches.json 生成 worldcup2026.ics
// 不调用 build.js，不重新计算积分榜

const fs = require('fs');
const path = require('path');

const rootDir = path.join(__dirname, '..');
const matchesPath = path.join(rootDir, 'data', 'worldcup2026-matches.json');
const icsPath = path.join(rootDir, 'worldcup2026.ics');

const matches = JSON.parse(fs.readFileSync(matchesPath, 'utf8'));

// 场地坐标
const venueGeo = {
    'Los Angeles Stadium': { lat: 33.9556, lng: -118.3391, address: 'Los Angeles Stadium, 19500 S Avalon Blvd, Carson, CA 90746, USA' },
    'Gillette Stadium': { lat: 42.0909, lng: -71.2643, address: 'Gillette Stadium, 1 Gillette Stadium Rd, Foxborough, MA 02035, USA' },
    'Monterrey Stadium': { lat: 25.7265, lng: -100.2786, address: 'Monterrey Stadium, Av. Universidad S/N, San Nicolás de los Garza, México' },
    'NRG Stadium': { lat: 29.6847, lng: -95.4108, address: 'NRG Stadium, 1 NRG Pkwy, Houston, TX 77054, USA' },
    'New York New Jersey Stadium': { lat: 40.8135, lng: -74.0745, address: 'MetLife Stadium, 1 MetLife Stadium Dr, East Rutherford, NJ 07073, USA' },
    'Dallas Stadium': { lat: 32.7473, lng: -96.9976, address: 'AT&T Stadium, 1 AT&T Way, Arlington, TX 76011, USA' },
    'Estadio Azteca': { lat: 19.3029, lng: -99.1506, address: 'Estadio Azteca, Calz. de Tlalpan No. 5, Axocopilco, Ciudad de México' },
    'Atlanta Stadium': { lat: 33.7477, lng: -84.4003, address: 'Mercedes-Benz Stadium, 1 AMB Dr NE, Atlanta, GA 30313, USA' },
    'San Francisco Bay Area Stadium': { lat: 37.4032, lng: -121.9849, address: 'Levi\'s Stadium, 4900 Marie P DeBartolo Way, Santa Clara, CA 95054, USA' },
    'Seattle Stadium': { lat: 47.5952, lng: -122.3316, address: 'Lumen Field, 800 Occidental Ave S, Seattle, WA 98134, USA' },
    'Toronto Stadium': { lat: 43.6314, lng: -79.4197, address: 'BMO Field, 170 Princes\' Blvd, Toronto, ON M6K 3C3, Canada' },
    'BC Place': { lat: 49.2766, lng: -123.1119, address: 'BC Place, 777 Pacific Blvd, Vancouver, BC V6B 0Y1, Canada' },
    'Hard Rock Stadium': { lat: 25.9580, lng: -80.2386, address: 'Hard Rock Stadium, 347 Don Shula Dr Suite 102, Miami Gardens, FL 33056, USA' },
    'Arrowhead Stadium': { lat: 39.0489, lng: -94.4840, address: 'Arrowhead Stadium, 1 Arrowhead Dr, Kansas City, MO 64129, USA' },
    'Philadelphia Stadium': { lat: 39.9069, lng: -75.1665, address: 'Lincoln Financial Field, 1 Lincoln Financial Field Way, Philadelphia, PA 19148, USA' },
};

function generateICS(matches) {
    let ics = 'BEGIN:VCALENDAR\r\nVERSION:2.0\r\nPRODID:-//WorldCup26//ZH\r\n';
    
    for (const m of matches) {
        // 生成全部比赛（小组赛 + 淘汰赛）
        
        const [h, min] = m.time_cn.split(':').map(Number);
        const dayMatch = m.date_cn.match(/(\d+)月(\d+)日/);
        const monthNum = dayMatch ? parseInt(dayMatch[1]) : 6;
        const dayNum = dayMatch ? parseInt(dayMatch[2]) : 0;
        const utcH = (h - 8 + 24) % 24;
        const utcDay = (h < 8) ? dayNum - 1 : dayNum;
        const utcDate = Date.UTC(2026, monthNum - 1, utcDay, utcH, min);
        const iso = new Date(utcDate).toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
        
        const scoreStr = m.status === '已结束'
            ? `${m.home_team.flag || ''} ${m.home_team.name} ${m.home_team.score}:${m.away_team.score} ${m.away_team.flag || ''} ${m.away_team.name}`
            : `${m.home_team.flag || ''} ${m.home_team.name} vs ${m.away_team.flag || ''} ${m.away_team.name}`;
        
        const summarySuffix = m.match_type === '淘汰赛' ? ` (${m.round})` : '';
        
        let desc = `淘汰赛 ${m.round} | 📍${m.venue || ''}`;
        
        const venue = venueGeo[m.stadium];
        const location = m.venue || '';
        let geo = null;
        if (venue) {
            geo = { lat: venue.lat, lng: venue.lng };
        }
        
        const uid = `wc2026-match-${m.match_number}@worldcup26-calendar`;
        
        ics += 'BEGIN:VEVENT\r\n';
        ics += `UID:${uid}\r\n`;
        ics += `DTSTART:${iso}\r\n`;
        ics += `DTEND:${new Date(utcDate + 7200000).toISOString().replace(/[-:]/g, '').split('.')[0]}Z\r\n`;
        ics += `SUMMARY:${scoreStr}${summarySuffix}\r\n`;
        ics += `DESCRIPTION:${desc}\r\n`;
        ics += `LOCATION:${location}\r\n`;
        if (geo) {
            ics += `GEO:${geo.lat};${geo.lng}\r\n`;
            ics += `X-APPLE-STRUCTURED-LOCATION;VALUE=URI;X-APPLE-RADIUS=500;X-TITLE=${geo.address}:geo:${geo.lat},${geo.lng}\r\n`;
        }
        ics += 'END:VEVENT\r\n';
    }
    ics += 'END:VCALENDAR\r\n';
    return ics;
}

const ics = generateICS(matches);
fs.writeFileSync(icsPath, ics, 'utf8');
console.log(`[update-ics] Generated ICS with ${matches.length} matches (all rounds)`);
