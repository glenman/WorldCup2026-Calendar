#!/usr/bin/env python3
"""Generate ICS calendar and HTML page for 2026 FIFA World Cup Group Stage matches."""

import json
from datetime import datetime, timedelta

MATCHES = [
    ("6", "12", "3:00", "A组", "墨西哥 vs 南非", "墨西哥城", "阿兹特克球场"),
    ("6", "12", "10:00", "A组", "韩国 vs 捷克", "瓜达拉哈拉", "阿克伦球场"),
    ("6", "13", "3:00", "B组", "加拿大 vs 波黑", "多伦多", "BMO球场"),
    ("6", "13", "9:00", "D组", "美国 vs 巴拉圭", "洛杉矶", "SoFi体育场"),
    ("6", "14", "3:00", "B组", "卡塔尔 vs 瑞士", "旧金山湾区", "李维斯球场"),
    ("6", "14", "6:00", "C组", "巴西 vs 摩洛哥", "纽约/新泽西", "大都会人寿球场"),
    ("6", "14", "9:00", "C组", "海地 vs 苏格兰", "波士顿", "吉列球场"),
    ("6", "14", "12:00", "D组", "澳大利亚 vs 土耳其", "温哥华", "BC广场"),
    ("6", "15", "1:00", "E组", "德国 vs 库拉索", "休斯顿", "NRG球场"),
    ("6", "15", "4:00", "F组", "荷兰 vs 日本", "达拉斯", "AT&T球场"),
    ("6", "15", "7:00", "E组", "科特迪瓦 vs 厄瓜多尔", "费城", "林肯金融球场"),
    ("6", "15", "10:00", "F组", "瑞典 vs 突尼斯", "蒙特雷", "BBVA球场"),
    ("6", "16", "0:00", "H组", "西班牙 vs 佛得角", "亚特兰大", "梅赛德斯-奔驰球场"),
    ("6", "16", "3:00", "G组", "比利时 vs 埃及", "西雅图", "卢门球场"),
    ("6", "16", "6:00", "H组", "沙特阿拉伯 vs 乌拉圭", "迈阿密", "硬石体育场"),
    ("6", "16", "9:00", "G组", "伊朗 vs 新西兰", "洛杉矶", "SoFi体育场"),
    ("6", "17", "3:00", "I组", "法国 vs 塞内加尔", "纽约/新泽西", "大都会人寿球场"),
    ("6", "17", "6:00", "I组", "伊拉克 vs 挪威", "波士顿", "吉列球场"),
    ("6", "17", "9:00", "J组", "阿根廷 vs 阿尔及利亚", "堪萨斯城", "箭头体育场"),
    ("6", "17", "12:00", "J组", "奥地利 vs 约旦", "旧金山湾区", "李维斯球场"),
    ("6", "18", "1:00", "K组", "葡萄牙 vs 刚果(金)", "休斯顿", "NRG球场"),
    ("6", "18", "4:00", "L组", "英格兰 vs 克罗地亚", "达拉斯", "AT&T球场"),
    ("6", "18", "7:00", "L组", "加纳 vs 巴拿马", "多伦多", "BMO球场"),
    ("6", "18", "10:00", "K组", "乌兹别克斯坦 vs 哥伦比亚", "墨西哥城", "阿兹特克球场"),
    ("6", "19", "0:00", "A组", "捷克 vs 南非", "亚特兰大", "梅赛德斯-奔驰球场"),
    ("6", "19", "3:00", "B组", "瑞士 vs 波黑", "洛杉矶", "SoFi体育场"),
    ("6", "19", "6:00", "B组", "加拿大 vs 卡塔尔", "温哥华", "BC广场"),
    ("6", "19", "9:00", "A组", "墨西哥 vs 韩国", "瓜达拉哈拉", "阿克伦球场"),
    ("6", "20", "3:00", "D组", "美国 vs 澳大利亚", "西雅图", "卢门球场"),
    ("6", "20", "6:00", "C组", "苏格兰 vs 摩洛哥", "波士顿", "吉列球场"),
    ("6", "20", "8:30", "C组", "巴西 vs 海地", "费城", "林肯金融球场"),
    ("6", "20", "11:00", "D组", "土耳其 vs 巴拉圭", "旧金山湾区", "李维斯球场"),
    ("6", "21", "1:00", "F组", "荷兰 vs 瑞典", "休斯顿", "NRG球场"),
    ("6", "21", "4:00", "E组", "德国 vs 科特迪瓦", "多伦多", "BMO球场"),
    ("6", "21", "8:00", "E组", "厄瓜多尔 vs 库拉索", "堪萨斯城", "箭头体育场"),
    ("6", "21", "12:00", "F组", "突尼斯 vs 日本", "蒙特雷", "BBVA球场"),
    ("6", "22", "0:00", "H组", "西班牙 vs 沙特阿拉伯", "亚特兰大", "梅赛德斯-奔驰球场"),
    ("6", "22", "3:00", "G组", "比利时 vs 伊朗", "洛杉矶", "SoFi体育场"),
    ("6", "22", "6:00", "H组", "乌拉圭 vs 佛得角", "迈阿密", "硬石体育场"),
    ("6", "22", "9:00", "G组", "新西兰 vs 埃及", "温哥华", "BC广场"),
    ("6", "23", "1:00", "J组", "阿根廷 vs 奥地利", "达拉斯", "AT&T球场"),
    ("6", "23", "5:00", "I组", "法国 vs 伊拉克", "费城", "林肯金融球场"),
    ("6", "23", "8:00", "I组", "挪威 vs 塞内加尔", "纽约/新泽西", "大都会人寿球场"),
    ("6", "23", "11:00", "J组", "约旦 vs 阿尔及利亚", "旧金山湾区", "李维斯球场"),
    ("6", "24", "1:00", "K组", "葡萄牙 vs 乌兹别克斯坦", "休斯顿", "NRG球场"),
    ("6", "24", "4:00", "L组", "英格兰 vs 加纳", "波士顿", "吉列球场"),
    ("6", "24", "7:00", "L组", "巴拿马 vs 克罗地亚", "多伦多", "BMO球场"),
    ("6", "24", "10:00", "K组", "哥伦比亚 vs 刚果(金)", "瓜达拉哈拉", "阿克伦球场"),
    ("6", "25", "3:00", "B组", "波黑 vs 卡塔尔", "西雅图", "卢门球场"),
    ("6", "25", "3:00", "B组", "瑞士 vs 加拿大", "温哥华", "BC广场"),
    ("6", "25", "6:00", "C组", "摩洛哥 vs 海地", "亚特兰大", "梅赛德斯-奔驰球场"),
    ("6", "25", "6:00", "C组", "苏格兰 vs 巴西", "迈阿密", "硬石体育场"),
    ("6", "25", "9:00", "A组", "南非 vs 韩国", "蒙特雷", "BBVA球场"),
    ("6", "25", "9:00", "A组", "捷克 vs 墨西哥", "墨西哥城", "阿兹特克球场"),
    ("6", "26", "4:00", "E组", "库拉索 vs 科特迪瓦", "费城", "林肯金融球场"),
    ("6", "26", "4:00", "E组", "厄瓜多尔 vs 德国", "纽约/新泽西", "大都会人寿球场"),
    ("6", "26", "7:00", "F组", "日本 vs 瑞典", "达拉斯", "AT&T球场"),
    ("6", "26", "7:00", "F组", "突尼斯 vs 荷兰", "堪萨斯城", "箭头体育场"),
    ("6", "26", "10:00", "D组", "巴拉圭 vs 澳大利亚", "旧金山湾区", "李维斯球场"),
    ("6", "26", "10:00", "D组", "土耳其 vs 美国", "洛杉矶", "SoFi体育场"),
    ("6", "27", "3:00", "I组", "塞内加尔 vs 伊拉克", "多伦多", "BMO球场"),
    ("6", "27", "3:00", "I组", "挪威 vs 法国", "波士顿", "吉列球场"),
    ("6", "27", "8:00", "H组", "佛得角 vs 沙特阿拉伯", "休斯顿", "NRG球场"),
    ("6", "27", "8:00", "H组", "乌拉圭 vs 西班牙", "瓜达拉哈拉", "阿克伦球场"),
    ("6", "27", "11:00", "G组", "埃及 vs 伊朗", "西雅图", "卢门球场"),
    ("6", "27", "11:00", "G组", "新西兰 vs 比利时", "温哥华", "BC广场"),
    ("6", "28", "5:00", "L组", "克罗地亚 vs 加纳", "费城", "林肯金融球场"),
    ("6", "28", "5:00", "L组", "巴拿马 vs 英格兰", "纽约/新泽西", "大都会人寿球场"),
    ("6", "28", "7:30", "K组", "刚果(金) vs 乌兹别克斯坦", "亚特兰大", "梅赛德斯-奔驰球场"),
    ("6", "28", "7:30", "K组", "哥伦比亚 vs 葡萄牙", "迈阿密", "硬石体育场"),
]

CITY_TIMEZONE = {
    # EDT/PST varies by location
    "纽约/新泽西": "America/New_York",
    "波士顿": "America/New_York",
    "费城": "America/New_York",
    "迈阿密": "America/New_York",
    "亚特兰大": "America/New_York",
    "多伦多": "America/Toronto",
    "休斯顿": "America/Chicago",
    "达拉斯": "America/Chicago",
    "堪萨斯城": "America/Chicago",
    "洛杉矶": "America/Los_Angeles",
    "旧金山湾区": "America/Los_Angeles",
    "西雅图": "America/Los_Angeles",
    "温哥华": "America/Vancouver",
    "墨西哥城": "America/Mexico_City",
    "瓜达拉哈拉": "America/Mexico_City",
    "蒙特雷": "America/Monterrey",
}


def generate_ics():
    ics_content = "BEGIN:VCALENDAR\nVERSION:2.0\nPRODID:-//WorldCup2026 Calendar//ZH\n"
    
    for month, day, time_str, group, match_str, city, stadium in MATCHES:
        # Parse Beijing time and convert to EDT (UTC-4) and PDT (UTC-7)
        bj_hour, bj_min = time_str.split(":")
        
        # Create Beijing time datetime (UTC+8)
        bj_dt = datetime(2026, int(month), int(day), int(bj_hour), int(bj_min.replace(".", "")))
        # Convert to UTC
        utc_dt = bj_dt - timedelta(hours=8)
        
        year = utc_dt.strftime("%Y")
        month_str = utc_dt.strftime("%m")
        day_str = utc_dt.strftime("%d")
        utc_hour = utc_dt.strftime("%H")
        utc_min = utc_dt.strftime("%M")
        
        summary = f"2026世界杯 - {match_str}"
        location = f"{city} - {stadium}"
        description = f"{group}\n北京时间 {month}月{day}日 {time_str}\n球场: {stadium}\n城市: {city}"
        
        # Use UTC for simplicity
        ics_content += f"BEGIN:VEVENT\n"
        ics_content += f"SUMMARY:{summary}\n"
        ics_content += f"DTSTART;TZID=UTC:{year}{month_str}{day_str}T{utc_hour}{utc_min}00Z\n"
        ics_content += f"LOCATION:{location}\n"
        ics_content += f"DESCRIPTION:{description}\n"
        ics_content += f"END:VEVENT\n"
    
    ics_content += "END:VCALENDAR"
    return ics_content


def generate_json():
    json_data = []
    for month, day, time_str, group, match_str, city, stadium in MATCHES:
        json_data.append({
            "date": f"2026-{month}-{day}",
            "time_beijing": time_str,
            "group": group,
            "match": match_str,
            "city": city,
            "stadium": stadium,
        })
    return json.dumps(json_data, ensure_ascii=False, indent=2)


if __name__ == "__main__":
    ics = generate_ics()
    with open("worldcup2026.ics", "w") as f:
        f.write(ics)
    print(f"✅ Generated worldcup2026.ics ({len(MATCHES)} 场比赛)")
    
    json_data = generate_json()
    with open("data/worldcup2026-matches.json", "w") as f:
        f.write(json_data)
    print("✅ Generated data/worldcup2026-matches.json")
