// build.js — 一站式构建脚本
// 1. 从 matches.json 计算小组积分榜 → 写入 group_standings.json
// 2. 生成 worldcup2026.ics

const fs = require('fs');
const path = require('path');

const rootDir = path.join(__dirname, '..');
const matchesPath = path.join(rootDir, 'data', 'worldcup2026-matches.json');
const standingsPath = path.join(rootDir, 'data', 'worldcup2026-group_standings.json');
const icsPath = path.join(rootDir, 'worldcup2026.ics');

// ──────── 场地坐标数据 ────────
const STADIUM_GEO = {
    '阿兹特克球场': { name: 'Estadio Azteca', address: 'Calz. de Tlalpan 3465, Santa Úrsula Coapa, Coyoacán, 04650 Ciudad de México, CDMX, Mexico', lat: 19.3029, lng: -99.1506 },
    '阿克伦球场': { name: 'Estadio Akron', address: 'Calle Circuito JVC 2800, El Salto, Jalisco 45645, Mexico', lat: 20.6737, lng: -103.3447 },
    'BBVA球场': { name: 'Estadio BBVA', address: 'Av. Pablo Livas 2011, Guadalupe, NL 67195, Mexico', lat: 25.6689, lng: -100.2418 },
    'NRG球场': { name: 'NRG Stadium', address: '1 NRG Pkwy, Houston, TX 77054, USA', lat: 29.6847, lng: -95.4108 },
    'SoFi体育场': { name: 'SoFi Stadium', address: '1001 S Stadium Dr, Inglewood, CA 90301, USA', lat: 33.9535, lng: -118.3392 },
    '李维斯球场': { name: 'Levis Stadium', address: '4900 Marie P DeBartolo Way, Santa Clara, CA 95054, USA', lat: 37.4032, lng: -121.9712 },
    '大都会人寿球场': { name: 'MetLife Stadium', address: '1 MetLife Stadium Dr, East Rutherford, NJ 07073, USA', lat: 40.8128, lng: -74.0742 },
    '林肯金融球场': { name: 'Lincoln Financial Field', address: '1 Lincoln Financial Field Way, Philadelphia, PA 19148, USA', lat: 39.9008, lng: -75.1675 },
    '吉列球场': { name: 'Gillette Stadium', address: '1 Patriot Pl, Foxborough, MA 02035, USA', lat: 42.0909, lng: -71.2643 },
    '卢门球场': { name: 'Lumen Field', address: '800 Occidental Ave S, Seattle, WA 98134, USA', lat: 47.5952, lng: -122.3316 },
    '梅赛德斯-奔驰球场': { name: 'Mercedes-Benz Stadium', address: '1 AMB Dr NW, Atlanta, GA 30313, USA', lat: 33.7553, lng: -84.4006 },
    '硬石体育场': { name: 'Hard Rock Stadium', address: '347 Don Shula Dr, Miami Gardens, FL 33056, USA', lat: 25.9580, lng: -80.2389 },
    '箭头体育场': { name: 'Arrowhead Stadium', address: '1 Arrowhead Dr, Kansas City, MO 64129, USA', lat: 39.0489, lng: -94.4840 },
    'AT&T球场': { name: 'AT&T Stadium', address: '1 AT&T Way, Arlington, TX 76011, USA', lat: 32.7390, lng: -97.0931 },
    'BMO球场': { name: 'BMO Field', address: "170 Princes' Blvd, Toronto, ON M6K 3C3, Canada", lat: 43.6332, lng: -79.4186 },
    'BC广场': { name: 'BC Place', address: '777 Pacific Blvd, Vancouver, BC V6B 4Y8, Canada', lat: 49.2766, lng: -123.1119 },
};

// ──────── 读取比赛数据 ────────
const matches = JSON.parse(fs.readFileSync(matchesPath, 'utf-8'));
const GROUP_ORDER = ['A组', 'B组', 'C组', 'D组', 'E组', 'F组', 'G组', 'H组', 'I组', 'J组', 'K组', 'L组'];

// ──────── 1. 计算积分榜 ────────
function computeStandings(matches) {
    const groups = {};
    for (const g of GROUP_ORDER) {
        groups[g] = {};
    }

    for (const m of matches) {
        if (m.match_type !== '小组赛' || !m.group) continue;
        const g = m.group;
        if (!groups[g]) groups[g] = {};

        const home = m.home_team.name;
        const away = m.away_team.name;
        const hs = m.home_team.score || 0;
        const as = m.away_team.score || 0;

        if (!groups[g][home]) groups[g][home] = { team: home, played: 0, won: 0, drawn: 0, lost: 0, gf: 0, ga: 0, gd: 0, points: 0 };
        if (!groups[g][away]) groups[g][away] = { team: away, played: 0, won: 0, drawn: 0, lost: 0, gf: 0, ga: 0, gd: 0, points: 0 };

        if (m.status !== '已结束' || (!hs && !as && hs !== 0)) continue;

        groups[g][home].played++;
        groups[g][away].played++;
        groups[g][home].gf += hs;
        groups[g][home].ga += as;
        groups[g][away].gf += as;
        groups[g][away].ga += hs;

        if (hs > as) {
            groups[g][home].won++;
            groups[g][home].points += 3;
            groups[g][away].lost++;
        } else if (hs < as) {
            groups[g][away].won++;
            groups[g][away].points += 3;
            groups[g][home].lost++;
        } else {
            groups[g][home].drawn++;
            groups[g][away].drawn++;
            groups[g][home].points += 1;
            groups[g][away].points += 1;
        }
    }

    const result = {};
    for (const g of GROUP_ORDER) {
        const teamsArr = Object.values(groups[g]);
        for (const t of teamsArr) {
            t.gd = t.gf - t.ga;
        }
        teamsArr.sort((a, b) => b.points - a.points || b.gd - a.gd || b.gf - a.gf);
        teamsArr.forEach((t, i) => { t.standing = i + 1; });
        result[g] = { group: g, teams: teamsArr };
    }
    return result;
}

const standings = computeStandings(matches);
fs.writeFileSync(standingsPath, JSON.stringify(standings, null, 2), 'utf-8');
console.log('[build] group_standings.json updated');

// ──────── 2. 解析淘汰赛占位符 ────────

// 构建队名→国旗 映射表（从已确认的球队数据中提取）
function buildFlagMap(matches) {
    const map = {};
    for (const m of matches) {
        for (const side of ['home_team', 'away_team']) {
            const t = m[side];
            if (t.flag && t.flag !== '🏳' && t.name && !t.name.startsWith('M') && !t.name.includes('组') && !t.name.includes('小组第三')) {
                map[t.name] = t.flag;
            }
        }
    }
    return map;
}

// 判断小组是否已完成（所有球队打了3场）
function isGroupComplete(standings, groupName) {
    const teams = standings[groupName]?.teams || [];
    if (teams.length < 4) return false;
    return teams.every(t => t.played >= 3);
}

// 判断某组是否存在（至少打过比赛）
function isGroupActive(standings, groupName) {
    const teams = standings[groupName]?.teams || [];
    return teams.some(t => t.played > 0);
}

// 构建占位符解析映射表
function buildPlaceholderMap(standings, matches, flagMap) {
    const map = {};

    // a) "X组第一/第二/第三" → 根据积分榜（仅已完成的小组）
    for (const g of GROUP_ORDER) {
        if (!isGroupComplete(standings, g)) continue;
        const teams = standings[g].teams;
        const posLabels = ['第一', '第二', '第三'];
        for (let i = 0; i < 3; i++) {
            const key = `${g}${posLabels[i]}`;
            const team = teams[i];
            map[key] = {
                flag: flagMap[team.team] || team.team,
                name: team.team
            };
            console.log(`  [resolve] ${key} → ${team.team}`);
        }
    }

    // b) "小组第三(N)" → 根据全部12组第三名排名
    const allGroupsComplete = GROUP_ORDER.every(g => isGroupComplete(standings, g));

    const all3rd = [];
    for (const g of GROUP_ORDER) {
        const teams = standings[g]?.teams || [];
        if (teams.length >= 3) {
            all3rd.push({ ...teams[2], group: g });
        }
    }
    // 排序：积分 → 净胜球 → 进球 → 红黄牌待定
    all3rd.sort((a, b) => b.points - a.points || b.gd - a.gd || b.gf - a.gf);

    if (allGroupsComplete) {
        // 全部完赛：解析全部 1~8
        const top8 = all3rd.slice(0, 8);
        for (let i = 0; i < top8.length; i++) {
            const key = `小组第三(${i + 1})`;
            const team = top8[i];
            map[key] = { flag: flagMap[team.team] || team.team, name: team.team };
            console.log(`  [resolve] ${key} → ${team.team} (${team.group}, ${team.points}pt GD${team.gd >= 0 ? '+' + team.gd : team.gd})`);
        }
    } else {
        // 有小组未完赛：只解析前 3 名（4pt GD0+ 锁定），第 4~8 名可能被 J/K 组挤掉
        const incomplete = GROUP_ORDER.filter(g => !isGroupComplete(standings, g));
        const safeCutoff = 3; // 只解析小数第三(1)~(3)，(4)~(8) 待定
        const safeN = Math.min(safeCutoff, all3rd.length);
        for (let i = 0; i < safeN; i++) {
            const key = `小组第三(${i + 1})`;
            const team = all3rd[i];
            map[key] = { flag: flagMap[team.team] || team.team, name: team.team };
            console.log(`  [resolve] ${key} → ${team.team} (${team.group}, ${team.points}pt GD${team.gd >= 0 ? '+' + team.gd : team.gd}) [locked]`);
        }
        console.log(`  [resolve] ⚠ 小组第三(4)~(8) 待定 — 以下小组未完赛: ${incomplete.join(', ')}，排名可能变动`);
    }

    // c) "MXX胜者"/"MXX负者" → 根据已完成淘汰赛的结果
    const matchById = {};
    for (const m of matches) {
        matchById[m.match_number] = m;
    }
    for (const m of matches) {
        if (m.match_type !== '淘汰赛') continue;
        if (m.status !== '已结束') continue;
        const hs = m.home_team.score;
        const as = m.away_team.score;
        if (hs === null || hs === undefined || as === null || as === undefined) continue;

        function KOwinner(m) {
            var hs = m.home_team.score, as = m.away_team.score;
            if (hs === as && m.penalty) return m.penalty.home > m.penalty.away ? m.home_team : m.away_team;
            return hs > as ? m.home_team : m.away_team;
        }
        function KOloser(m) {
            var hs = m.home_team.score, as = m.away_team.score;
            if (hs === as && m.penalty) return m.penalty.home > m.penalty.away ? m.away_team : m.home_team;
            return hs > as ? m.away_team : m.home_team;
        }
        const winner = KOwinner(m);
        const loser = KOloser(m);

        // 只有双方都是真实队名（非占位符）才记录
        const isPlaceholder = (name) => name.startsWith('M') || name.includes('组') || name.includes('小组第三');
        if (!isPlaceholder(winner.name) && !isPlaceholder(loser.name)) {
            map[`M${m.match_number}胜者`] = { flag: winner.flag, name: winner.name };
            map[`M${m.match_number}负者`] = { flag: loser.flag, name: loser.name };
            console.log(`  [resolve] M${m.match_number}胜者 → ${winner.name}, M${m.match_number}负者 → ${loser.name}`);
        }
    }

    return map;
}

// 淘汰赛占位符解析已禁用（2026-06-28）
// 淘汰赛对阵已通过 API 和手动方式确定，后续通过 sync-results workflow 同步结果
console.log('[build] knockout placeholder resolution DISABLED');

// ──────── 2. 生成 ICS ────────
// 格式化比分（淘汰赛含点球）
function formatScore(m) {
    var hs = m.home_team.score, as = m.away_team.score;
    if (m.penalty && m.penalty.home !== null && m.penalty.away !== null) {
        return '(' + m.penalty.home + ')' + hs + ':' + as + '(' + m.penalty.away + ')';
    }
    return hs + ':' + as;
}

function generateICS(matches) {
    let ics = 'BEGIN:VCALENDAR\r\nVERSION:2.0\r\nPRODID:-//WorldCup26//ZH\r\n';

    for (const m of matches) {
        const [h, min] = m.time_cn.split(':').map(Number);
        const dayMatch = m.date_cn.match(/(\d+)月(\d+)日/);
        const monthNum = dayMatch ? parseInt(dayMatch[1]) : 6;
        const dayNum = dayMatch ? parseInt(dayMatch[2]) : 0;
        const utcH = (h - 8 + 24) % 24;
        const utcDay = (h < 8) ? dayNum - 1 : dayNum;
        const utcDate = Date.UTC(2026, monthNum - 1, utcDay, utcH, min);
        const iso = new Date(utcDate).toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';

        const scoreStr = m.status === '已结束'
            ? `${m.home_team.flag} ${m.home_team.name} ${formatScore(m)} ${m.away_team.flag} ${m.away_team.name}`
            : `${m.home_team.flag} ${m.home_team.name} vs ${m.away_team.flag} ${m.away_team.name}`;

        const summarySuffix = m.match_type === '淘汰赛' ? ` (${m.round})` : '';

        let desc = m.match_type === '淘汰赛'
            ? `淘汰赛 ${m.round} | 📍${m.venue}`
            : `${m.match_type} ${m.group} | 📍${m.venue}`;
        if (m.status === '已结束') {
            desc += ` | 比分: ${formatScore(m)}`;
        }

        const geo = STADIUM_GEO[m.stadium];
        const location = geo ? geo.address : m.venue + ' ' + m.stadium;

        ics += 'BEGIN:VEVENT\r\n';
        ics += `UID:wc26-${m.match_number}@worldcup26\r\n`;
        ics += `DTSTART:${iso}\r\n`;
        const endDt = new Date(utcDate + 7200000);
        ics += 'DTEND:' + endDt.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z\r\n';
        ics += 'SUMMARY:' + scoreStr + summarySuffix + '\r\n';
        ics += 'DESCRIPTION:' + desc + '\r\n';
        ics += 'LOCATION:' + location + '\r\n';
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
fs.writeFileSync(icsPath, ics, 'utf-8');
console.log('[build] worldcup2026.ics generated');

// ──────── 统计输出 ────────
const finished = matches.filter(m => m.status === '已结束').length;
console.log(`[build] Total: ${matches.length} matches, ${finished} finished`);

for (const g of GROUP_ORDER) {
    const t = standings[g].teams;
    const scored = t.filter(x => x.played > 0);
    if (scored.length > 0) {
        const complete = isGroupComplete(standings, g) ? ' ✓' : '';
        console.log(`  ${g}: ${t.map(x => `${x.team}(${x.points}pt)`).join(' ')}${complete}`);
    }
}
