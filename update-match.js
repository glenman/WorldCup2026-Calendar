const fs = require('fs');
let ics = fs.readFileSync('worldcup2026.ics', 'utf8');

const target = [
  'BEGIN:VEVENT',
  'UID:wc26-3@worldcup26',
  'DTSTART:20260612T190000Z',
  'DTEND:20260612T210000Z',
  'SUMMARY:🇨🇦 加拿大 vs 🇧🇦 波黑',
  'DESCRIPTION:小组赛 B组',
  "LOCATION:BMO Field, 170 Princes' Boulevard, Toronto, ON M6K 3C3, Canada",
  'GEO:43.6332;-79.4186',
  "X-APPLE-STRUCTURED-LOCATION;VALUE=URI;X-APPLE-RADIUS=500;X-TITLE=BMO Field, 170 Princes' Boulevard, Toronto, ON M6K 3C3, Canada:geo:43.6332,-79.4186",
  'END:VEVENT'
].join('\r\n');

// Match the whole event block using regex
const pattern = /BEGIN:VEVENT\r?\nUID:wc26-3@worldcup26\r?\n[\s\S]*?END:VEVENT/;

const newIcs = ics.replace(pattern, target);
if (newIcs === ics) {
    console.log('❌ No match');
} else {
    fs.writeFileSync('worldcup2026.ics', newIcs);
    console.log('✅ Updated');
    const idx = newIcs.indexOf('wc26-3');
    console.log(newIcs.substring(idx, idx+550));
}
