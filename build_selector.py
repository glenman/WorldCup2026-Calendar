import json, re

# Read current index.html
data = open('index.html').read()

# Extract MATCHES data
m = re.search(r'const MATCHES = ({.*?});', data, re.DOTALL)
matches_data = m.group(1)

# Read the rest of index.html (style + html head/body up to script)
# We need to rebuild: keep style and head structure, replace team selector + script
head_end = data.find('<script>')
before_script = data[:head_end]
after_script_tag = data[data.find('</script>') + len('</script>'):]

# The full HTML structure before script
html_before = data[:head_end]

# Now build the new selector section and script
new_selector = r'''
        <div class="team-selector-section">
            <h3>🎯 选择关注的球队</h3>
            <div id="selected-chips"></div>
            <div class="selector-actions">
                <button class="btn btn-outline" onclick="selectAll()">全选</button>
                <button class="btn btn-outline" onclick="deselectAll()">清空</button>
                <button class="btn btn-outline" onclick="selectAllHost()">只看东道主 🇨🇦🇺🇸🇲🇽</button>
                <button class="btn btn-outline" onclick="selectAllFavorites()">只看豪门 ⭐</button>
            </div>
        </div>

        <div class="group-selector">
'''

# Group data structure from user's message
group_data = [
    ('A组', ['★墨西哥(东道主)', '南非', '韩国', '捷克']),
    ('B组', ['★加拿大(东道主)', '波黑', '卡塔尔', '瑞士']),
    ('C组', ['★巴西', '摩洛哥', '海地', '苏格兰']),
    ('D组', ['★美国(东道主)', '巴拉圭', '澳大利亚', '土耳其']),
    ('E组', ['★德国', '库拉索', '科特迪瓦', '厄瓜多尔']),
    ('F组', ['★荷兰', '日本', '瑞典', '突尼斯']),
    ('G组', ['★比利时', '埃及', '伊朗', '新西兰']),
    ('H组', ['★西班牙', '佛得角', '沙特阿拉伯', '乌拉圭']),
    ('I组', ['★法国', '塞内加尔', '伊拉克', '挪威']),
    ('J组', ['★阿根廷(卫冕冠军)', '阿尔及利亚', '奥地利', '约旦']),
    ('K组', ['★葡萄牙', '刚果(金)', '乌兹别克斯坦', '哥伦比亚']),
    ('L组', ['★英格兰', '克罗地亚', '加纳', '巴拿马']),
]

# Flag emoji mapping
flag_map = {
    '墨西哥': '🇲🇽', '南非': '🇿🇦', '韩国': '🇰🇷', '捷克': '🇨🇿',
    '加拿大': '🇨🇦', '波黑': '🇧🇦', '卡塔尔': '🇶🇦', '瑞士': '🇨🇭',
    '巴西': '🇧🇷', '摩洛哥': '🇲🇦', '海地': '🇭🇹', '苏格兰': '🏴󠁧󠁢󠁳󠁣󠁴󠁿',
    '美国': '🇺🇸', '巴拉圭': '🇵🇾', '澳大利亚': '🇦🇺', '土耳其': '🇹🇷',
    '德国': '🇩🇪', '库拉索': '🇨🇼', '科特迪瓦': '🇨🇮', '厄瓜多尔': '🇪🇨',
    '荷兰': '🇳🇱', '日本': '🇯🇵', '瑞典': '🇸🇪', '突尼斯': '🇹🇳',
    '比利时': '🇧🇪', '埃及': '🇪🇬', '伊朗': '🇮🇷', '新西兰': '🇳🇿',
    '西班牙': '🇪🇸', '佛得角': '🇨🇻', '沙特阿拉伯': '🇸🇦', '乌拉圭': '🇺🇾',
    '法国': '🇫🇷', '塞内加尔': '🇸🇳', '伊拉克': '🇮🇶', '挪威': '🇳🇴',
    '阿根廷': '🇦🇷', '阿尔及利亚': '🇩🇿', '奥地利': '🇦🇹', '约旦': '🇯🇴',
    '葡萄牙': '🇵🇹', '刚果(金)': '🇨🇩', '乌兹别克斯坦': '🇺🇿', '哥伦比亚': '🇨🇴',
    '英格兰': '🏴󠁧󠁢󠁥󠁮󠁧󠁿', '克罗地亚': '🇭🇷', '加纳': '🇬🇭', '巴拿马': '🇵🇦',
}

# Build group HTML
for group_name, teams in group_data:
    new_selector += f'''            <div class="group-card">
                <div class="group-header" onclick="toggleGroup(this)">
                    <span class="group-name">{group_name}</span>
                    <span class="group-arrow">▼</span>
                </div>
                <div class="group-body">'''
    
    for rank_label in ['种子队', '第2档', '第3档', '第4档']:
        idx = ['种子队', '第2档', '第3档', '第4档'].index(rank_label)
        if idx < len(teams):
            team = teams[idx]
            # Clean name
            clean_name = re.sub(r'★.*', '', team).strip()
            flag = flag_map.get(clean_name, '⚽')
            # For host teams, add host badge
            is_host = '(东道主)' in team or '(卫冕冠军)' in team
            host_badge = '👑' if is_host else ''
            new_selector += f'''                    <div class="rank-row">
                        <span class="rank-label">{rank_label}</span>
                        <div class="team-chips">'''
            # Chip
            new_selector += f'''                            <div class="team-chip" onclick="toggleTeam(this, '{clean_name}')" data-team='{flag} {clean_name}'>
                                {flag} {clean_name} {host_badge}
                            </div>'''
            new_selector += '''                        </div>
                    </div>'''
    
    new_selector += '''                </div>
            </div>'''

new_selector += '''        </div>

        <div class="team-selector-section">
            <h3>📋 已选赛程预览</h3>
            <div class="selector-actions">
                <button class="btn" onclick="generateAndCopyLink()">🔗 生成订阅链接并复制</button>
                <button class="btn btn-outline" onclick="downloadSelectedICS()">📥 下载选中球队 ICS</button>
            </div>
            <div id="selected-count" style="margin-top:12px;font-size:0.9rem;color:var(--text-muted);"></div>
        </div>

        <div id="calendar-app"></div>
'''

# Replace the old selector section
old_selector_start = data.find('<div class="team-selector-section">')
old_selector_end = data.find('</div>\n\n        <div id="calendar-app">')
if old_selector_end < 0:
    old_selector_end = data.find('<div id="calendar-app">')

new_html = html_before + new_selector + after_script_tag

# Now build the new script
new_script = r'''
<script>
// Team flag map
const FLAG_MAP = {
    '墨西哥': '🇲🇽', '南非': '🇿🇦', '韩国': '🇰🇷', '捷克': '🇨🇿',
    '加拿大': '🇨🇦', '波黑': '🇧🇦', '卡塔尔': '🇶🇦', '瑞士': '🇨🇭',
    '巴西': '🇧🇷', '摩洛哥': '🇲🇦', '海地': '🇭🇹', '苏格兰': '🏴󠁧󠁢󠁳󠁣󠁴󠁿',
    '美国': '🇺🇸', '巴拉圭': '🇵🇾', '澳大利亚': '🇦🇺', '土耳其': '🇹🇷',
    '德国': '🇩🇪', '库拉索': '🇨🇼', '科特迪瓦': '🇨🇮', '厄瓜多尔': '🇪🇨',
    '荷兰': '🇳🇱', '日本': '🇯🇵', '瑞典': '🇸🇪', '突尼斯': '🇹🇳',
    '比利时': '🇧🇪', '埃及': '🇪🇬', '伊朗': '🇮🇷', '新西兰': '🇳🇿',
    '西班牙': '🇪🇸', '佛得角': '🇨🇻', '沙特阿拉伯': '🇸🇦', '乌拉圭': '🇺🇾',
    '法国': '🇫🇷', '塞内加尔': '🇸🇳', '伊拉克': '🇮🇶', '挪威': '🇳🇴',
    '阿根廷': '🇦🇷', '阿尔及利亚': '🇩🇿', '奥地利': '🇦🇹', '约旦': '🇯🇴',
    '葡萄牙': '🇵🇹', '刚果(金)': '🇨🇩', '乌兹别克斯坦': '🇺🇿', '哥伦比亚': '🇨🇴',
    '英格兰': '🏴󠁧󠁢󠁥󠁮󠁧󠁿', '克罗地亚': '🇭🇷', '加纳': '🇬🇭', '巴拿马': '🇵🇦',
};

// Host teams and fan favorites
const HOST_TEAMS = ['墨西哥', '加拿大', '美国'];
const FAN_FAVORITES = ['巴西', '法国', '德国', '阿根廷', '西班牙', '英格兰', '葡萄牙', '意大利'];

// Selected teams
let selectedTeams = new Set();

// Parse URL query params for pre-selected teams
function initFromURL() {
    const params = new URLSearchParams(window.location.search);
    const teamsParam = params.get('teams');
    if (teamsParam) {
        const names = teamsParam.split(',').map(s => s.trim()).filter(Boolean);
        names.forEach(name => {
            if (FLAG_MAP[name]) {
                selectedTeams.add(name);
            }
        });
    }
}

// Toggle team selection
function toggleTeam(el, name) {
    if (selectedTeams.has(name)) {
        selectedTeams.delete(name);
        el.classList.remove('selected');
    } else {
        selectedTeams.add(name);
        el.classList.add('selected');
    }
    updateChips();
    updateCalendar();
}

// Update chips display
function updateChips() {
    const container = document.getElementById('selected-chips');
    const countEl = document.getElementById('selected-count');
    if (selectedTeams.size === 0) {
        container.innerHTML = '<div class="no-selection">点击球队添加到关注列表，或点击上方快捷按钮</div>';
        countEl.textContent = '';
    } else {
        const flagNames = Array.from(selectedTeams).map(n => {
            const flag = FLAG_MAP[n] || '⚽';
            return `<div class="chip" onclick="removeTeam('${n}')" title="点击移除">${flag} ${n} ✕</div>`;
        }).join('');
        container.innerHTML = '<div class="chips-row">' + flagNames + '</div>';
        countEl.textContent = `已选 ${selectedTeams.size} 支球队`;
    }
}

// Remove team from selection
function removeTeam(name) {
    selectedTeams.delete(name);
    // Update chip UI
    document.querySelectorAll('.team-chip').forEach(el => {
        if (el.dataset.team && el.dataset.team.includes(name)) {
            el.classList.remove('selected');
        }
    });
    updateChips();
    updateCalendar();
}

// Select all teams
function selectAll() {
    Object.keys(FLAG_MAP).forEach(name => selectedTeams.add(name));
    document.querySelectorAll('.team-chip').forEach(el => el.classList.add('selected'));
    updateChips();
    updateCalendar();
}

// Deselect all
function deselectAll() {
    selectedTeams.clear();
    document.querySelectorAll('.team-chip').forEach(el => el.classList.remove('selected'));
    updateChips();
    updateCalendar();
}

// Select only host teams
function selectAllHost() {
    selectedTeams.clear();
    HOST_TEAMS.forEach(name => selectedTeams.add(name));
    document.querySelectorAll('.team-chip').forEach(el => {
        const name = getChipName(el.dataset.team);
        if (HOST_TEAMS.includes(name)) el.classList.add('selected');
    });
    updateChips();
    updateCalendar();
}

// Select fan favorites
function selectAllFavorites() {
    selectedTeams.clear();
    FAN_FAVORITES.forEach(name => selectedTeams.add(name));
    document.querySelectorAll('.team-chip').forEach(el => {
        const name = getChipName(el.dataset.team);
        if (FAN_FAVORITES.includes(name)) el.classList.add('selected');
    });
    updateChips();
    updateCalendar();
}

function getChipName(datasetTeam) {
    if (!datasetTeam) return '';
    // Remove flag emoji prefix
    return datasetTeam.replace(/^[\w\U000e0000-\U000e007f]+[\s]*/, '');
}

// Generate and copy subscribe link
function generateAndCopyLink() {
    if (selectedTeams.size === 0) {
        alert('请至少选择一支球队');
        return;
    }
    const teamsParam = Array.from(selectedTeams).join(',');
    const url = window.location.origin + window.location.pathname + '?teams=' + encodeURIComponent(teamsParam);
    
    navigator.clipboard.writeText(url).then(() => {
        alert('✅ 订阅链接已复制！\n\n' + url + '\n\n分享给好友，他们打开后可以看到选中球队的赛程。');
    }).catch(() => {
        prompt('请手动复制以下链接：', url);
    });
}

// Download ICS for selected teams
function downloadSelectedICS() {
    if (selectedTeams.size === 0) {
        alert('请至少选择一支球队');
        return;
    }
    
    const filtered = getSelectedMatches();
    if (filtered.length === 0) {
        alert('未找到选中球队的比赛');
        return;
    }
    
    let ics = 'BEGIN:VCALENDAR\r\nVERSION:2.0\r\nPRODID:-//WorldCup26//ZH\r\n';
    let idx = 1;
    for (const m of filtered) {
        const [h, mi] = m.t.split(':').map(Number);
        const utcH = h - 8;
        const dayNum = parseInt(m.day.replace('月','').replace('日',''));
        let utcDate;
        if (utcH < 0) {
            utcDate = new Date(2026, 5, dayNum - 1, utcH + 24, mi);
        } else {
            utcDate = new Date(2026, 5, dayNum, utcH, mi);
        }
        const iso = utcDate.toISOString().replace(/[-:]/g,'').split('.')[0] + 'Z';
        ics += 'BEGIN:VEVENT\r\n';
        ics += 'UID:wc26-' + idx + '@worldcup26\r\n';
        ics += 'DTSTART:' + iso + '\r\n';
        const endDt = new Date(utcDate.getTime() + 5400000);
        ics += 'DTEND:' + endDt.toISOString().replace(/[-:]/g,'').split('.')[0] + 'Z\r\n';
        ics += 'SUMMARY:' + m.m + '\r\n';
        const teamsList = Array.from(selectedTeams).map(n => FLAG_MAP[n] + ' ' + n).join(' | ');
        ics += 'DESCRIPTION:小组赛 ' + m.g + '\\n场地: ' + m.s + '\\n城市: ' + m.c + '\\n' + teamsList + '\r\n';
        ics += 'LOCATION:' + m.c + ' - ' + m.s + '\r\n';
        ics += 'END:VEVENT\r\n';
        idx++;
    }
    ics += 'END:VCALENDAR\r\n';
    
    const blob = new Blob([ics], {type: 'text/calendar'});
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    const teamStr = Array.from(selectedTeams).slice(0, 3).join('-');
    a.download = '世界杯2026_' + teamStr + '.ics';
    a.click();
    URL.revokeObjectURL(url);
}

function getSelectedMatches() {
    const result = [];
    for (const [day, dayMatches] of Object.entries(MATCHES)) {
        dayMatches.forEach(m => {
            // Check if match involves any selected team
            const matchTeams = extractTeams(m.m);
            for (const st of selectedTeams) {
                if (matchTeams.includes(st)) {
                    result.push({...m, day});
                    break;
                }
            }
        });
    }
    return result;
}

function extractTeams(matchStr) {
    // Extract team names from match string like "🇲🇽 墨西哥 vs 🇿🇦 南非"
    const parts = matchStr.split(' vs ');
    if (parts.length !== 2) return [];
    return [parts[0].trim(), parts[1].trim()];
}

function updateCalendar() {
    const filtered = getSelectedMatches();
    renderCalendar(filtered);
}

function renderCalendar(filteredMatches) {
    const container = document.getElementById('calendar-app');
    const teamCount = selectedTeams.size;
    
    // Banner for multi-team selection
    let bannerHtml = '';
    if (teamCount > 0) {
        const flagNames = Array.from(selectedTeams).map(n => FLAG_MAP[n] + ' ' + n).slice(0, 10).join(' ');
        bannerHtml = '<div class="team-banner">' +
            '<div class="team-banner-name">' + teamCount + ' 支球队专属赛程</div>' +
            '<div class="team-banner-count">' + flagNames + '</div>' +
        '</div>';
    }
    
    if (filteredMatches && filteredMatches.length === 0) {
        container.innerHTML = bannerHtml + '<div class="empty-state"><p>😕 没有找到选中球队的比赛</p></div>';
        return;
    }
    
    const byDay = {};
    if (filteredMatches) {
        filteredMatches.forEach(m => {
            if (!byDay[m.day]) byDay[m.day] = [];
            byDay[m.day].push(m);
        });
    } else {
        for (const [day, dayMatches] of Object.entries(MATCHES)) {
            byDay[day] = dayMatches;
        }
    }
    
    const days = Object.keys(byDay);
    let html = bannerHtml;
    days.forEach(day => {
        const dayMatches = byDay[day];
        html += '<div class="date-header"><span>📅 ' + day + '</span><span class="day-count">' + dayMatches.length + ' 场</span></div>';
        dayMatches.forEach(m => {
            html += '<div class="match-card">' +
                '<div class="match-time">' + m.t + '</div>' +
                '<div class="match-info">' +
                    '<div class="match-name">' + m.m + '</div>' +
                    '<div class="match-meta">📍 ' + m.c + ' · ' + m.s + '</div>' +
                '</div>' +
                '<span class="group-badge">' + m.g + '</span>' +
            '</div>';
        });
    });
    container.innerHTML = html;
}

// Toggle group expand/collapse
function toggleGroup(header) {
    const body = header.nextElementSibling;
    const arrow = header.querySelector('.group-arrow');
    if (body.style.display === 'none') {
        body.style.display = '';
        arrow.textContent = '▼';
    } else {
        body.style.display = 'none';
        arrow.textContent = '▶';
    }
}

// Initialize
initFromURL();
updateChips();
renderCalendar(null);
</script>
'''

# Combine
final_html = new_html + new_script + '</script>' + after_script_tag[len('</script>'):]

# Fix: remove duplicate closing script tag
final_html = final_html.replace('</script></script>', '</script>')

# Write
with open('index.html', 'w', encoding='utf-8') as f:
    f.write(final_html)

print(f'✅ Written {len(final_html)} chars')

# Verify
if 'toggleGroup' in final_html and 'generateAndCopyLink' in final_html:
    print('✅ Multi-select feature included')
if 'SELECT_TEAMS' in final_html or len([k for k in match_data.keys()]) > 0:
    print('✅ MATCHES data included')
