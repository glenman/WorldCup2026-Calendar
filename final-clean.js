const fs = require('fs');
let ics = fs.readFileSync('worldcup2026.ics', 'utf8');

// 1. 移除所有重复的 X-APPLE 行
ics = ics.replace(/(X-APPLE-STRUCTURED-LOCATION;VALUE=URI;X-APPLE-RADIUS=500;X-TITLE=[^\r\n]+:[^\r\n]+)[\r\n]+\1+/g, '$1');

// 2. 移除 LOCATION 中的重复地址（地址后跟逗号+重复地址）
ics = ics.replace(/(LOCATION:([^\r\n]+)), \2/g, '$1');

// 3. 移除多余的空白行
ics = ics.replace(/(\r?\n){3,}/g, '\r\n\r\n');

// 4. 确保 LOCATION 行顺序正确（放在 UID 前面）
// 重新构建每个事件
let result = '';
const events = ics.split('BEGIN:VEVENT').slice(1);

for (const ev of events) {
    // 分离出不同类型的行
    const lines = ev.split('\r\n');
    let uid = '', dtstart = '', dtend = '', summary = '', desc = '', location = '', geo = '', xapple = '', rest = '';
    
    for (const line of lines) {
        if (line.startsWith('UID:')) uid = line;
        else if (line.startsWith('DTSTART:')) dtstart = line;
        else if (line.startsWith('DTEND:')) dtend = line;
        else if (line.startsWith('SUMMARY:')) summary = line;
        else if (line.startsWith('DESCRIPTION:')) desc = line;
        else if (line.startsWith('LOCATION:')) location = line;
        else if (line.startsWith('GEO:')) geo = line;
        else if (line.startsWith('X-APPLE-STRUCTURED-LOCATION')) xapple = line;
        else if (line.trim()) rest = line;
    }
    
    // 重新构建事件
    result += 'BEGIN:VEVENT\r\n';
    result += uid + '\r\n';
    result += dtstart + '\r\n';
    result += dtend + '\r\n';
    result += summary + '\r\n';
    result += desc + '\r\n';
    result += location + '\r\n';
    result += geo + '\r\n';
    if (xapple) result += xapple + '\r\n';
    if (rest) result += rest + '\r\n';
    result += 'END:VEVENT\r\n';
}

// 添加日历头
const header = ics.match(/BEGIN:VCALENDAR[\s\S]*?BEGIN:VEVENT/)?.[0] || '';
let finalIcs = 'BEGIN:VCALENDAR\r\nVERSION:2.0\r\nPRODID:-//WorldCup26//ZH\r\n';
finalIcs += result + 'END:VCALENDAR\r\n';

fs.writeFileSync('worldcup2026.ics', finalIcs);

// 验证
let errors = 0;
const verifyEvents = finalIcs.split('BEGIN:VEVENT').slice(1);
for (const ev of verifyEvents) {
    const xappleCount = (ev.match(/X-APPLE-STRUCTURED-LOCATION/g) || []).length;
    const loc = ev.match(/LOCATION:([^\r\n]+)/)?.[1] || '';
    
    if (xappleCount > 1) {
        errors++;
        console.log('❌ 重复 X-APPLE: ' + xappleCount);
    }
    if (loc.includes(', ') && ev.match(/LOCATION:([^\r\n]+), \1/)) {
        errors++;
        console.log('❌ 重复 LOCATION: ' + loc);
    }
}

console.log('✅ 验证完成');
console.log('❌ 问题数: ' + errors);
console.log('');
console.log('示例 (前3个):');
verifyEvents.slice(0, 3).forEach(ev => {
    const summary = ev.match(/SUMMARY:([^\r\n]+)/)?.[1] || '';
    const loc = ev.match(/LOCATION:([^\r\n]+)/)?.[1] || '';
    const title = ev.match(/X-APPLE-STRUCTURED-LOCATION;.*?X-TITLE=([^:]+):geo:/)?.[1] || '';
    const xappleCount = (ev.match(/X-APPLE/g) || []).length;
    console.log('---');
    console.log(summary);
    console.log('LOC: ' + loc);
    console.log('TIT: ' + title);
    console.log('X-APPLE count: ' + xappleCount);
    console.log('一致: ' + (loc === title));
});