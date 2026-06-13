// update-match.js — 根据 "球队A vs 球队B X:Y" 更新比赛结果，并重新生成积分榜+ICS
// 用法: node scripts/update-match.js "墨西哥 vs 南非 2:0"

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const rootDir = path.join(__dirname, '..');
const matchesPath = path.join(rootDir, 'data', 'worldcup2026-matches.json');

if (process.argv.length < 3) {
    console.log('用法: node scripts/update-match.js "球队A vs 球队B 2:1"');
    console.log('示例: node scripts/update-match.js "墨西哥 vs 南非 2:0"');
    process.exit(1);
}

const input = process.argv[2].trim();
console.log('[update-match] 解析输入:', input);

// 解析 "球队A vs 球队B X:Y"
const re = /^(.+?)\s+vs\s+(.+?)\s+(\d+):(\d+)$/;
const match = input.match(re);

if (!match) {
    console.error('❌ 格式错误! 请使用: "球队A vs 球队B 2:1"');
    console.error('   注意: vs 前后各有一个空格');
    process.exit(1);
}

const teamA = match[1].trim();
const teamB = match[2].trim();
const scoreA = parseInt(match[3]);
const scoreB = parseInt(match[4]);

console.log(`[update-match] 查找: ${teamA} vs ${teamB} ${scoreA}:${scoreB}`);

// 读取比赛数据
const matches = JSON.parse(fs.readFileSync(matchesPath, 'utf-8'));

// 查找匹配的比赛（主队 vs 客队，或 客队 vs 主队——因为不知道哪边是主队）
let found = null;
for (const m of matches) {
    const home = m.home_team.name;
    const away = m.away_team.name;
    if ((home === teamA && away === teamB) || (home === teamB && away === teamA)) {
        found = m;
        break;
    }
}

if (!found) {
    console.error(`❌ 未找到匹配: ${teamA} vs ${teamB}`);
    console.error('   请确认球队名称与 matches.json 中一致');
    process.exit(1);
}

// 判断方向——确保比分对应正确的队伍
let homeScore, awayScore;
if (found.home_team.name === teamA && found.away_team.name === teamB) {
    homeScore = scoreA;
    awayScore = scoreB;
} else {
    // 输入顺序与主客队相反
    homeScore = scoreB;
    awayScore = scoreA;
}

// 计算积分
let homePoints, awayPoints;
if (homeScore > awayScore) {
    homePoints = 3;
    awayPoints = 0;
} else if (homeScore < awayScore) {
    homePoints = 0;
    awayPoints = 3;
} else {
    homePoints = 1;
    awayPoints = 1;
}

// 更新
found.home_team.score = homeScore;
found.home_team.points = homePoints;
found.away_team.score = awayScore;
found.away_team.points = awayPoints;
found.status = '已结束';

console.log(`✅ 更新: ${found.home_team.flag} ${found.home_team.name} ${homeScore}:${awayScore} ${found.away_team.flag} ${found.away_team.name}`);
console.log(`   ${found.home_team.name} ${homePoints}分, ${found.away_team.name} ${awayPoints}分`);
console.log(`   轮次: ${found.round} | ${found.group} | ${found.stadium}`);

// 写入 matches.json
fs.writeFileSync(matchesPath, JSON.stringify(matches, null, 2), 'utf-8');
console.log('[update-match] matches.json 已更新');

// 运行 build.js 重新生成 standings + ICS
console.log('[update-match] 执行 build.js...');
execSync('node ' + path.join(__dirname, 'build.js'), { cwd: rootDir, stdio: 'inherit' });

console.log('🎉 完成! 刷新浏览器即可看到更新。');
