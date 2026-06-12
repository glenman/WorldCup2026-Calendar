const fs = require('fs');
let ics = fs.readFileSync('worldcup2026.ics', 'utf8');

// 清理重复地址
const cleanDuplicates = (text) => {
    // 匹配重复的地址模式
    return text.replace(/(LOCATION:[^\r\n]+), \1/g, '$1');
};

// 清理 X-TITLE 格式
const cleanXTitle = (text) => {
    // 匹配 X-TITLE=BMO Field, 170... 格式，改为纯地址
    return text.replace(/X-TITLE=[^,]+, ([^:]+):geo:/g, 'X-TITLE=$1:geo:');
};

ics = cleanDuplicates(ics);
ics = cleanXTitle(ics);

fs.writeFileSync('worldcup2026.ics', ics);

// 最终验证
const events = ics.split('BEGIN:VEVENT').slice(1);
let cleanCount = 0;
let issueCount = 0;

for (const ev of events) {
    const loc = ev.match(/LOCATION:([^\r\n]+)/)?.[1];
    const title = ev.match(/X-APPLE-STRUCTURED-LOCATION;.*?X-TITLE=([^:]+)/)?.[1];
    const geo = ev.match(/GEO:([^\r\n]+)/)?.[1];
    
    if (loc && title && geo) {
        // 检查是否有明显问题
        const hasIssue = (loc.includes(', ,') || loc.length > 200 || title.length > 200);
        if (!hasIssue) {
            cleanCount++;
        } else {
            console.log('❌ 问题地址:');
            console.log('  LOCATION: ' + loc);
            console.log('  X-TITLE: ' + title);
            console.log('  GEO: ' + geo);
            issueCount++;
        }
    }
}

console.log('✅ 有效事件: ' + cleanCount);
console.log('❌ 问题地址: ' + issueCount);
console.log('');
console.log('示例:');
console.log(ics.substring(ics.indexOf('wc26-1'), ics.indexOf('wc26-1') + 500));