const fs = require('fs');
let ics = fs.readFileSync('worldcup2026.ics', 'utf8');

// 修复 X-TITLE 问题 - 它不应该被逗号截断
// 格式应该是: X-APPLE-STRUCTURED-LOCATION;VALUE=URI;X-APPLE-RADIUS=500;X-TITLE=完整地址:geo:lat,lon

// 找到所有 X-APPLE-STRUCTURED-LOCATION 行并修复
ics = ics.replace(/X-APPLE-STRUCTURED-LOCATION;VALUE=URI;X-APPLE-RADIUS=500;X-TITLE=([^:]*):geo:/g, function(match, titlePart) {
    // 如果标题部分包含逗号但后面还有内容，说明被截断了
    // 需要找到完整的标题
    return match; // 暂时保持原样
});

// 更好的方法：重新生成所有 X-APPLE-STRUCTURED-LOCATION
const events = ics.split('BEGIN:VEVENT').slice(1);
let fixedIcs = '';

for (const ev of events) {
    const loc = ev.match(/LOCATION:([^\r\n]+)/)?.[1] || '';
    const geo = ev.match(/GEO:([^\r\n]+)/)?.[1] || '';
    
    // 提取经纬度
    const geoCoords = geo ? geo.replace('GEO:', '') : '';
    
    // 用 LOCATION 作为 X-TITLE
    if (loc && geoCoords) {
        // 替换现有的 X-APPLE 行
        const cleaned = ev.replace(/X-APPLE-STRUCTURED-LOCATION[^\\r\\n]*\r?\n/, '');
        fixedIcs += 'BEGIN:VEVENT\r\n';
        fixedIcs += cleaned.replace('END:VEVENT', '') + '\r\n';
        // 在 GEO 行后添加 X-APPLE
        fixedIcs = fixedIcs.replace(
            'GEO:' + geoCoords + '\r\n',
            'GEO:' + geoCoords + '\r\nX-APPLE-STRUCTURED-LOCATION;VALUE=URI;X-APPLE-RADIUS=500;X-TITLE=' + loc + ':geo:' + geoCoords + '\r\n'
        );
        fixedIcs += 'END:VEVENT\r\n';
    } else {
        fixedIcs += ev + '\r\n';
    }
}

// 添加结束标记
if (!fixedIcs.endsWith('END:VCALENDAR\r\n')) {
    fixedIcs += 'END:VCALENDAR\r\n';
}

// 重新构建完整 ICS
let resultIcs = 'BEGIN:VCALENDAR\r\nVERSION:2.0\r\nPRODID:-//WorldCup26//ZH\r\n';
const eventBlocks = fixedIcs.split('BEGIN:VEVENT').slice(1);
eventBlocks.forEach(block => {
    resultIcs += 'BEGIN:VEVENT' + block.replace(/^BEGIN:VEVENT\r?\n/, '').replace(/\r?\nEND:VEVENT\r?\n$/, '\r\nEND:VEVENT\r\n');
});
resultIcs += 'END:VCALENDAR\r\n';

fs.writeFileSync('worldcup2026.ics', resultIcs);

// 验证
const finalEvents = resultIcs.split('BEGIN:VEVENT').slice(1);
let errors = 0;
for (const ev of finalEvents) {
    const xapple = ev.match(/X-APPLE-STRUCTURED-LOCATION;VALUE=URI;X-APPLE-RADIUS=500;X-TITLE=([^:]+):geo:/)?.[1];
    if (!xapple || xapple.length < 10) {
        console.log('❌ 短标题: ' + xapple);
        errors++;
    }
}

console.log('✅ 所有 X-TITLE 已修复为完整地址');
console.log('❌ 错误数: ' + errors);
console.log('');
console.log('示例:');
console.log(resultIcs.substring(resultIcs.indexOf('wc26-1'), resultIcs.indexOf('wc26-1') + 600));