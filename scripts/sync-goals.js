// sync-goals.js — 从 worldcup26.ir API 同步进球记录
// 用法: node scripts/sync-goals.js          → 本地运行, 自动 commit + push
//       node scripts/sync-goals.js --ci     → CI 模式, 仅生成 JSON, 由 workflow 负责 git 操作

const https = require('https');
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const IS_CI = process.argv.includes('--ci');

// ====== 球员名归一化映射: API中同一个人可能有缩写/全名两种写法 ======
const NAME_NORMALIZE = {
    'K. Mbappé': 'Kylian Mbappé',
    'K. Mbappe': 'Kylian Mbappé',
};

function normalizeScorerName(name, team, allScorersInTeam) {
    // 1. 精确映射
    if (NAME_NORMALIZE[name]) return NAME_NORMALIZE[name];

    // 2. 通用缩写归一化: "X. Lastname" → "Fullname Lastname"
    var abbrMatch = name.match(/^([A-Z])\.\s+(.+)$/);
    if (abbrMatch) {
        var initial = abbrMatch[1].toLowerCase();
        var lastName = abbrMatch[2].toLowerCase();
        // 在队友中查找匹配的全名
        for (var i = 0; i < allScorersInTeam.length; i++) {
            var other = allScorersInTeam[i];
            var parts = other.split(/\s+/);
            if (parts.length >= 2) {
                var otherLast = parts[parts.length - 1].toLowerCase();
                var otherFirst = parts[0].toLowerCase();
                if (otherLast === lastName && otherFirst[0] === initial && other !== name) {
                    NAME_NORMALIZE[name] = other; // 缓存
                    return other;
                }
            }
        }
    }

    return name;
}

const API_URL = 'https://worldcup26.ir/get/games';
const OUTPUT = path.join(__dirname, '..', 'data', 'wc2026-goals.json');
const MATCHES_PATH = path.join(__dirname, '..', 'data', 'worldcup2026-matches.json');

// ====== 英文 → 中文队名映射 ======
const TEAM_MAP = {
    'Mexico': '墨西哥',
    'South Africa': '南非',
    'South Korea': '韩国',
    'Czech Republic': '捷克',
    'Canada': '加拿大',
    'Bosnia and Herzegovina': '波黑',
    'Qatar': '卡塔尔',
    'Switzerland': '瑞士',
    'Brazil': '巴西',
    'Morocco': '摩洛哥',
    'Haiti': '海地',
    'Scotland': '苏格兰',
    'United States': '美国',
    'Paraguay': '巴拉圭',
    'Australia': '澳大利亚',
    'Turkey': '土耳其',
    'Germany': '德国',
    'Curaçao': '库拉索',
    'Ivory Coast': '科特迪瓦',
    'Ecuador': '厄瓜多尔',
    'Netherlands': '荷兰',
    'Japan': '日本',
    'Sweden': '瑞典',
    'Tunisia': '突尼斯',
    'Belgium': '比利时',
    'Egypt': '埃及',
    'Iran': '伊朗',
    'New Zealand': '新西兰',
    'Spain': '西班牙',
    'Cape Verde': '佛得角',
    'Saudi Arabia': '沙特阿拉伯',
    'Uruguay': '乌拉圭',
    'France': '法国',
    'Senegal': '塞内加尔',
    'Iraq': '伊拉克',
    'Norway': '挪威',
    'Argentina': '阿根廷',
    'Algeria': '阿尔及利亚',
    'Austria': '奥地利',
    'Jordan': '约旦',
    'Portugal': '葡萄牙',
    'Democratic Republic of the Congo': '刚果(金)',
    'Uzbekistan': '乌兹别克斯坦',
    'Colombia': '哥伦比亚',
    'England': '英格兰',
    'Croatia': '克罗地亚',
    'Ghana': '加纳',
    'Panama': '巴拿马',
};

// ====== 反向映射: 英文队名 → 中文队名 ======
var EN_TO_ZH = {};
Object.keys(TEAM_MAP).forEach(function (en) {
    EN_TO_ZH[en.toLowerCase()] = TEAM_MAP[en];
});

// ====== 加载我们 matches.json 并构建 {home_en, away_en} → 中文信息索引 ======
function loadMatchIndex() {
    const matches = JSON.parse(fs.readFileSync(MATCHES_PATH, 'utf8'));
    const index = {};
    matches.forEach(function (m) {
        var homeEn = m.venue && m.venue.includes && false ? '' : ''; // not available
        // Build key from Chinese names (stable within our data)
        var key = m.home_team.name + '|' + m.away_team.name;
        index[key] = {
            match_number: m.match_number,
            group: m.group,
            round: m.round,
            match_type: m.match_type,
            home_zh: m.home_team.name,
            away_zh: m.away_team.name,
            home_flag: m.home_team.flag,
            away_flag: m.away_team.flag,
        };
    });
    return index;
}

// ====== 根据 API 英文队名查找我们 match 的中文信息 ======
function findMatch(apiGame, matchIndex) {
    var homeEn = (apiGame.home_team_name_en || '').toLowerCase();
    var awayEn = (apiGame.away_team_name_en || '').toLowerCase();
    var homeZh = EN_TO_ZH[homeEn];
    var awayZh = EN_TO_ZH[awayEn];

    if (!homeZh || !awayZh) {
        // 淘汰赛可能用 label 而非队名, 跳过
        return null;
    }

    var key = homeZh + '|' + awayZh;
    var chi = matchIndex[key];
    if (chi) {
        // 验证: API 的 home/away 和我们的 home/away 一致
        if (chi.home_zh === homeZh && chi.away_zh === awayZh) return chi;
    }

    // 可能主客队方向不同, 反转查找
    var keyRev = awayZh + '|' + homeZh;
    var chiRev = matchIndex[keyRev];
    if (chiRev) {
        return {
            match_number: chiRev.match_number,
            group: chiRev.group,
            round: chiRev.round,
            match_type: chiRev.match_type,
            // API 的方向, 不是我们 JSON 的方向
            home_zh: homeZh,
            away_zh: awayZh,
            home_flag: chiRev.away_flag, // 注意: 方向可能颠倒
            away_flag: chiRev.home_flag,
        };
    }

    return null; // 淘汰赛或未匹配
}

// ====== 解析进球字符串 ======
function parseScorers(raw, homeAway) {
    if (!raw || raw === 'null' || raw === '""') return [];

    // 清理: 移除可能的转义和多余引号
    var cleaned = raw.replace(/\\"/g, '"').replace(/\u201C/g, '"').replace(/\u201D/g, '"');

    // 尝试作为 JSON 数组解析
    try {
        var arr = JSON.parse(cleaned);
        return arr.map(function (s) { return parseScorerEntry(s, homeAway); })
            .filter(Boolean);
    } catch (e) { /* 降级到正则提取 */ }

    // 正则提取: "Name 12'" 或 "Name 45'+2'" 格式
    var results = [];
    var re = /"([^"]+?)"|([\w.\- ']+?\d{1,3}'[\d\+']*)/g;
    var match;
    while ((match = re.exec(cleaned)) !== null) {
        var entry = match[1] || match[2];
        if (entry) {
            var parsed = parseScorerEntry(entry, homeAway);
            if (parsed) results.push(parsed);
        }
    }

    return results;
}

// ====== 解析单个进球条目: "J. Quiñones 9'" → {scorer, minute, ...} ======
function parseScorerEntry(entry, homeAway) {
    if (!entry || entry === 'null') return null;
    entry = entry.trim().replace(/^"+|"+$/g, '');

    // 匹配末尾的时间: 数字(分钟) + ' + 可选补时 + 可选(p/OG)
    // 例如: "9'", "45'+5'", "90'+8'(p)", "76'"
    var timeMatch = entry.match(/\((\d+)[\+']+(\d*)'[^\)]*\)\s*$/);
    if (!timeMatch) {
        timeMatch = entry.match(/(\d+)[\+']+(\d*)'[^'\)]*$/);
    }
    if (!timeMatch) {
        // 普通进球 "67'"
        timeMatch = entry.match(/(\d+)'/);
    }

    if (!timeMatch) return null;

    var minute = parseInt(timeMatch[1], 10);
    var stoppage = timeMatch[2] ? parseInt(timeMatch[2], 10) : 0;
    var actualMinute = minute + stoppage;

    var namePart = entry.substring(0, entry.length - timeMatch[0].length).trim();
    if (!namePart && timeMatch[1]) {
        // 降级: 用正则找到数字前的内容
        namePart = entry.replace(/\d+[\+']*\d*'.*$/, '').trim();
    }
    namePart = namePart.replace(/^"+|"+$/g, '').replace(/[\(\)]/g, '').trim();

    if (!namePart) return null;

    var isPenalty = /\(p\)/.test(timeMatch[0]) || /\(p\)/.test(entry);
    var isOwnGoal = /\(OG\)/i.test(timeMatch[0]) || /own/i.test(namePart) || /og/i.test(entry);

    var half = actualMinute <= 45 ? 1 : (actualMinute <= 90 ? 2 : 3);
    var minuteDisplay = minute + "'";
    if (stoppage > 0) minuteDisplay = minute + "'+" + stoppage + "'";
    if (isPenalty) minuteDisplay += ' (p)';
    if (isOwnGoal) minuteDisplay += ' (OG)';

    return {
        scorer: namePart,
        minute: actualMinute,
        minute_display: minuteDisplay,
        own_goal: isOwnGoal,
        penalty: isPenalty,
        half: half,
    };
}

// ====== 从 API 获取数据 ======
function fetchAPI() {
    return new Promise(function (resolve, reject) {
        https.get(API_URL, function (res) {
            var data = '';
            res.on('data', function (chunk) { data += chunk; });
            res.on('end', function () {
                try {
                    resolve(JSON.parse(data));
                } catch (e) {
                    reject(new Error('JSON parse error: ' + e.message));
                }
            });
        }).on('error', function (e) {
            reject(new Error('API fetch failed: ' + e.message));
        });
    });
}

// ====== 主流程 ======
async function main() {
    console.log('[sync-goals] 从 API 获取数据...');
    var apiData = await fetchAPI();

    if (!apiData.games || !Array.isArray(apiData.games)) {
        console.error('[sync-goals] 错误: API 返回格式不正确');
        process.exit(1);
    }

    console.log('[sync-goals] 共 ' + apiData.games.length + ' 场比赛');
    var matchIndex = loadMatchIndex();

    // ====== 第一遍: 收集所有球队的进球者姓名 (用于缩写归一化) ======
    var teamAllScorers = {}; // {球队中文名: [scorerName, ...]}
    apiData.games.forEach(function (g) {
        var homeScorers = parseScorers(g.home_scorers, 'home');
        var awayScorers = parseScorers(g.away_scorers, 'away');
        var chi = findMatch(g, matchIndex);
        if (!chi) return;
        var homeZh = chi.home_zh;
        var awayZh = chi.away_zh;
        if (!teamAllScorers[homeZh]) teamAllScorers[homeZh] = [];
        if (!teamAllScorers[awayZh]) teamAllScorers[awayZh] = [];
        homeScorers.forEach(function (s) { teamAllScorers[homeZh].push(s.scorer); });
        awayScorers.forEach(function (s) { teamAllScorers[awayZh].push(s.scorer); });
    });

    // ====== 第二遍: 构建进球记录 (应用姓名归一化) ======
    var allGoals = [];
    var total = 0;
    var withScorers = 0;

    apiData.games.forEach(function (g) {
        var homeScorers = parseScorers(g.home_scorers, 'home');
        var awayScorers = parseScorers(g.away_scorers, 'away');
        var chi = findMatch(g, matchIndex);

        // 只处理已结束且有进球的小组赛
        if (!chi) return;
        if (homeScorers.length === 0 && awayScorers.length === 0) return;

        var matchNum = chi.match_number;

        var homeZh = chi.home_zh;
        var awayZh = chi.away_zh;

        homeScorers.forEach(function (s) {
            allGoals.push({
                match_number: matchNum,
                group: chi.group,
                round: chi.round,
                match_type: chi.match_type,
                home_team: homeZh,
                away_team: awayZh,
                team: homeZh,
                team_en: g.home_team_name_en,
                scorer: normalizeScorerName(s.scorer, homeZh, teamAllScorers[homeZh] || []),
                minute: s.minute,
                minute_display: s.minute_display,
                own_goal: s.own_goal,
                penalty: s.penalty,
                half: s.half,
            });
            total++;
        });

        awayScorers.forEach(function (s) {
            allGoals.push({
                match_number: matchNum,
                group: chi.group,
                round: chi.round,
                match_type: chi.match_type,
                home_team: homeZh,
                away_team: awayZh,
                team: awayZh,
                team_en: g.away_team_name_en,
                scorer: normalizeScorerName(s.scorer, awayZh, teamAllScorers[awayZh] || []),
                minute: s.minute,
                minute_display: s.minute_display,
                own_goal: s.own_goal,
                penalty: s.penalty,
                half: s.half,
            });
            total++;
        });

        withScorers++;
    });

    // 按 match_number 和时间排序
    allGoals.sort(function (a, b) {
        if (a.match_number !== b.match_number) return a.match_number - b.match_number;
        return a.minute - b.minute;
    });

    var output = {
        updated_at: new Date().toISOString(),
        source: API_URL,
        total_match_count: apiData.games.length,
        matches_with_goals: withScorers,
        total_goals: total,
        goals: allGoals,
    };

    fs.writeFileSync(OUTPUT, JSON.stringify(output, null, 2), 'utf8');
    console.log('[sync-goals] 写入 ' + OUTPUT);
    console.log('[sync-goals] ' + withScorers + ' 场比赛有进球记录, 共 ' + total + ' 个进球');

    // 如果有变动则 commit + push (CI 模式下跳过, 由 workflow 处理)
    if (!IS_CI) {
        try {
            execSync('git add data/wc2026-goals.json scripts/sync-goals.js', { cwd: path.join(__dirname, '..') });
            var diff = execSync('git diff --cached --name-only', { cwd: path.join(__dirname, '..'), encoding: 'utf8' }).trim();
            if (diff) {
                execSync('git commit -m "' + total + ' goals synced from worldcup26.ir API"', { cwd: path.join(__dirname, '..') });
                execSync('git push origin gh-pages', { cwd: path.join(__dirname, '..') });
                console.log('[sync-goals] 已推送到远程');
            } else {
                console.log('[sync-goals] 无变动, 跳过推送');
            }
        } catch (e) {
            console.log('[sync-goals] 推送失败 (SSL/网络): ' + e.message.substring(0, 80));
        }
    } else {
        console.log('[sync-goals] CI 模式: 跳过 git 操作, 由 workflow 负责提交');
    }

    console.log('  Done!');
}

main().catch(function (e) {
    console.error('[sync-goals] 错误:', e.message);
    process.exit(1);
});
