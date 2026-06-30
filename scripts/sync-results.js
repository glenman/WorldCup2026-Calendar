// sync-results.js — 从 worldcup26.ir API 同步比赛比分 + 积分
// 替代手工 update-match.js 的自动化方案
// 用法: node scripts/sync-results.js          → 本地运行, 自动 commit + push
//       node scripts/sync-results.js --ci     → CI 模式, 仅写入文件, 由 workflow 负责 git 操作

const https = require('https');
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const IS_CI = process.argv.includes('--ci');
const API_URL = 'https://worldcup26.ir/get/games';
const MATCHES_PATH = path.join(__dirname, '..', 'data', 'worldcup2026-matches.json');
const ROOT_DIR = path.join(__dirname, '..');

// ====== 英文 → 中文队名映射 (与 sync-goals.js 保持一致) ======
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
    'USA': '美国',
    'Paraguay': '巴拉圭',
    'Australia': '澳大利亚',
    'Turkey': '土耳其',
    'Germany': '德国',
    'Cura\u00e7ao': '库拉索',
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

// ====== 反向映射 ======
var EN_TO_ZH = {};
Object.keys(TEAM_MAP).forEach(function (en) {
    EN_TO_ZH[en.toLowerCase()] = TEAM_MAP[en];
});

// ====== 构建中文队名 → match 索引 ======
function loadMatchIndex() {
    var matches = JSON.parse(fs.readFileSync(MATCHES_PATH, 'utf8'));
    var index = {};
    matches.forEach(function (m) {
        var key = m.home_team.name + '|' + m.away_team.name;
        index[key] = m;
    });
    return index;
}

// ====== 根据 API 英文队名查找 match ======
function findMatch(apiGame, matchIndex) {
    var homeEn = (apiGame.home_team_name_en || '').toLowerCase();
    var awayEn = (apiGame.away_team_name_en || '').toLowerCase();
    var homeZh = EN_TO_ZH[homeEn];
    var awayZh = EN_TO_ZH[awayEn];

    if (!homeZh || !awayZh) return null;

    // 正向查找
    var key = homeZh + '|' + awayZh;
    if (matchIndex[key]) return matchIndex[key];

    // 反向查找 (API 主客队方向可能与我们相反)
    var keyRev = awayZh + '|' + homeZh;
    if (matchIndex[keyRev]) return matchIndex[keyRev];

    return null;
}

// ====== 计算积分 ======
function calcPoints(homeScore, awayScore) {
    if (homeScore > awayScore) return { home: 3, away: 0 };
    if (homeScore < awayScore) return { home: 0, away: 3 };
    return { home: 1, away: 1 };
}

// ====== 从 API 获取数据 ======
function fetchAPI() {
    return new Promise(function (resolve, reject) {
        https.get(API_URL, function (res) {
            var data = '';
            res.on('data', function (chunk) { data += chunk; });
            res.on('end', function () {
                try { resolve(JSON.parse(data)); }
                catch (e) { reject(new Error('JSON parse error: ' + e.message)); }
            });
        }).on('error', function (e) {
            reject(new Error('API fetch failed: ' + e.message));
        });
    });
}

// ====== 淘汰赛占位符解析 ======
// 根据已完成的淘汰赛结果，将下游比赛的 "MXX胜者"/"MXX负者" 替换为实际球队
// 胜者判断：常规赛分高者胜，若平局则看点球比分
function KO_winner(m) {
    var hs = m.home_team.score, as = m.away_team.score;
    if (hs === as && m.penalty) {
        return m.penalty.home > m.penalty.away ? m.home_team : m.away_team;
    }
    return hs > as ? m.home_team : m.away_team;
}
function KO_loser(m) {
    var hs = m.home_team.score, as = m.away_team.score;
    if (hs === as && m.penalty) {
        return m.penalty.home > m.penalty.away ? m.away_team : m.home_team;
    }
    return hs > as ? m.away_team : m.home_team;
}
function resolveKnockoutPlaceholders(matches) {
    // 构建占位符 → {flag, name} 映射
    var placeholderMap = {};
    matches.forEach(function (m) {
        if (m.match_type !== '淘汰赛') return;
        if (m.status !== '已结束') return;
        var hs = m.home_team.score;
        var as = m.away_team.score;
        if (hs === null || hs === undefined || as === null || as === undefined) return;

        var winner = KO_winner(m);
        var loser = KO_loser(m);

        // 只有双方都是真实队名才记录（源数据必须确认）
        function isPH(name) { return name.startsWith('M') || name.includes('组') || name.includes('小组第三'); }
        if (!isPH(winner.name) && !isPH(loser.name)) {
            placeholderMap['M' + m.match_number + '胜者'] = { flag: winner.flag, name: winner.name };
            placeholderMap['M' + m.match_number + '负者'] = { flag: loser.flag, name: loser.name };
            console.log('  🔗 M' + m.match_number + '胜者 → ' + winner.name + ', M' + m.match_number + '负者 → ' + loser.name);
        }
    });

    if (Object.keys(placeholderMap).length === 0) {
        console.log('  (无占位符需要解析)');
        return 0;
    }

    // 应用占位符到下游比赛
    var count = 0;
    matches.forEach(function (m) {
        ['home_team', 'away_team'].forEach(function (side) {
            var t = m[side];
            var key = t.name;
            if (placeholderMap[key]) {
                var resolved = placeholderMap[key];
                if (t.name !== resolved.name) {
                    console.log('  ✅ ' + key + ' → ' + resolved.flag + ' ' + resolved.name + ' (M' + m.match_number + ' ' + side + ')');
                    t.flag = resolved.flag;
                    t.name = resolved.name;
                    count++;
                }
            }
        });
    });

    return count;
}

// ====== 主流程 ======
async function main() {
    console.log('[sync-results] 从 API 获取数据...');
    var apiData = await fetchAPI();

    if (!apiData.games || !Array.isArray(apiData.games)) {
        console.error('[sync-results] 错误: API 返回格式不正确');
        process.exit(1);
    }

    console.log('[sync-results] 共 ' + apiData.games.length + ' 场比赛');
    var matchIndex = loadMatchIndex();
    var updated = 0;
    var skipped = 0;

    apiData.games.forEach(function (g) {
        // 只处理已完成的比赛（小组赛 + 淘汰赛）
        if (g.finished !== 'TRUE') return;

        var m = findMatch(g, matchIndex);
        if (!m) return;

        var homeEn = g.home_team_name_en || '';
        var awayEn = g.away_team_name_en || '';
        var homeZh = EN_TO_ZH[homeEn.toLowerCase()];
        var awayZh = EN_TO_ZH[awayEn.toLowerCase()];

        // 确定 API 方向是否与我们一致
        var isSameDirection = (m.home_team.name === homeZh && m.away_team.name === awayZh);

        var homeScore = parseInt(g.home_score) || 0;
        var awayScore = parseInt(g.away_score) || 0;

        // 淘汰赛点球比分
        var homePk = (g.home_penalty_score !== undefined && g.home_penalty_score !== null)
            ? parseInt(g.home_penalty_score) : null;
        var awayPk = (g.away_penalty_score !== undefined && g.away_penalty_score !== null)
            ? parseInt(g.away_penalty_score) : null;

        var points = calcPoints(homeScore, awayScore);

        // 检查是否需要更新（含点球比分变化）
        var oldHomeScore = m.home_team.score;
        var oldAwayScore = m.away_team.score;
        var oldPenalty = m.penalty;
        var penaltyChanged = (homePk !== null || awayPk !== null) &&
            (!oldPenalty || oldPenalty.home !== homePk || oldPenalty.away !== awayPk);

        if (isSameDirection) {
            if (oldHomeScore === homeScore && oldAwayScore === awayScore && !penaltyChanged && m.status === '已结束') {
                skipped++;
                return;
            }
            m.home_team.score = homeScore;
            m.home_team.points = points.home;
            m.away_team.score = awayScore;
            m.away_team.points = points.away;
        } else {
            // 方向相反: API 的 home ↔ 我们的 away
            if (oldHomeScore === awayScore && oldAwayScore === homeScore && !penaltyChanged && m.status === '已结束') {
                skipped++;
                return;
            }
            m.home_team.score = awayScore;
            m.home_team.points = points.away;
            m.away_team.score = homeScore;
            m.away_team.points = points.home;
            // 交换点球比分
            var tmpPk = homePk; homePk = awayPk; awayPk = tmpPk;
        }

        // 存储点球比分（淘汰赛）
        if (m.match_type === '淘汰赛') {
            if (homePk !== null || awayPk !== null) {
                if (!m.penalty) m.penalty = {};
                m.penalty.home = homePk;
                m.penalty.away = awayPk;
            }
        }

        m.status = '已结束';
        updated++;

        var pkStr = (homePk !== null && awayPk !== null)
            ? ' (' + homePk + ':' + awayPk + ' PK)'
            : '';
        console.log('  ✅ ' + m.home_team.flag + ' ' + m.home_team.name + ' ' +
            m.home_team.score + ':' + m.away_team.score + ' ' +
            m.away_team.flag + ' ' + m.away_team.name + pkStr +
            ' (' + m.group + ' ' + m.round + ')');
    });

    console.log('[sync-results] 更新: ' + updated + ' 场, 跳过(无变化): ' + skipped + ' 场');

    // ── 淘汰赛占位符解析 ──
    var allMatches = [];
    Object.keys(matchIndex).forEach(function (k) {
        allMatches.push(matchIndex[k]);
    });
    allMatches.sort(function (a, b) { return a.match_number - b.match_number; });

    var resolved = resolveKnockoutPlaceholders(allMatches);
    if (resolved > 0) {
        console.log('[sync-results] 淘汰赛占位符解析: ' + resolved + ' 处已更新');
        // 回写到 matchIndex
        allMatches.forEach(function (m) {
            var key = m.home_team.name + '|' + m.away_team.name;
            if (matchIndex[key]) matchIndex[key] = m;
        });
    }

    if (updated === 0 && resolved === 0 && !IS_CI) {
        console.log('[sync-results] 没有比分变化');
        return;
    }

    // 写入 matches.json
    allMatches.sort(function (a, b) { return a.match_number - b.match_number; });
    fs.writeFileSync(MATCHES_PATH, JSON.stringify(allMatches, null, 2), 'utf8');
    console.log('[sync-results] matches.json 已更新');

    // 只更新 ICS 文件（不调用 build.js，不重建积分榜）
    console.log('[sync-results] 执行 update-ics.js 更新日历...');
    execSync('node ' + path.join(__dirname, 'update-ics.js'), { cwd: ROOT_DIR, stdio: 'inherit' });

    // 本地模式: 自动 git commit + push
    if (!IS_CI && updated > 0) {
        try {
            console.log('[sync-results] 自动推送...');
            var commitMsg = '[auto] sync match results from API (' + updated + ' games updated)';
            execSync('git add data/worldcup2026-matches.json data/worldcup2026-group_standings.json worldcup2026.ics', { cwd: ROOT_DIR, stdio: 'pipe' });
            execSync('git commit -m "' + commitMsg + '"', { cwd: ROOT_DIR, stdio: 'pipe' });
            execSync('git push origin gh-pages', { cwd: ROOT_DIR, stdio: 'pipe' });
            console.log('[sync-results] 已推送到远程');
        } catch (e) {
            console.log('[sync-results] ⚠ Git 推送失败（可手动推送）:', e.message);
        }
    }

    console.log('🎉 sync-results 完成! 共更新 ' + updated + ' 场比赛。');
}

main().catch(function (e) {
    console.error('[sync-results] 错误:', e.message);
    process.exit(1);
});
