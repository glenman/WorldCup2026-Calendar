const fs = require('fs');
let ics = fs.readFileSync('worldcup2026.ics', 'utf8');

// 修复 X-TITLE 中的重复地址
// 格式: X-TITLE=地址1, 地址1:geo:...
// 应该变成: X-TITLE=地址1:geo:...
ics = ics.replace(
    /X-TITLE=([^:]+), \1:geo:/g,
    'X-TITLE=$1:geo:'
);

// 移除多余的 END:VEVENT
ics = ics.replace(/END:VEVENT\r?\nEND:VEVENT/g, 'END:VEVENT');

fs.writeFileSync('worldcup2026.ics', ics);

// 验证
let errors = 0;
const events = ics.split('BEGIN:VEVENT').slice(1);
for (const ev of events) {
    const loc = ev.match(/LOCATION:([^\r\n]+)/)?.[1] || '';
    const title = ev.match(/X-APPLE-STRUCTURED-LOCATION;.*?X-TITLE=([^:]+):geo:/)?.[1] || '';
    const xappleCount = (ev.match(/X-APPLE/g) || []).length;
    
    if (loc !== title) {
        errors++;
        if (errors <= 2) {
            console.log('❌ 不一致');
            console.log('  LOC: ' + loc);
            console.log('  TIT: ' + title);
        }
    }
    if (xappleCount > 1) {
        errors++;
        console.log('❌ 重复 X-APPLE: ' + xappleCount);
    }
}

console.log('✅ 验证完成');
console.log('❌ 问题数: ' + errors);
console.log('');
console.log('示例 (前5个):');
events.slice(0, 5).forEach(ev => {
    const summary = ev.match(/SUMMARY:([^\r\n]+)/)?.[1] || '';
    const loc = ev.match(/LOCATION:([^\r\n]+)/)?.[1] || '';
    const title = ev.match(/X-APPLE-STRUCTURED-LOCATION;.*?X-TITLE=([^:]+):geo:/)?.[1] || '';
    const geo = ev.match(/GEO:([^\r\n]+)/)?.[1] || '';
    console.log('---');
    console.log(summary);
    console.log('LOC: ' + loc);
    console.log('TIT: ' + title);
    console.log('GEO: ' + geo);
    console.log('一致: ' + (loc === title));
});