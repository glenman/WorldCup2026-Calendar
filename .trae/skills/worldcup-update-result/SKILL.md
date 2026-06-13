---
name: "worldcup-update-result"
description: "Update World Cup 2026 match results in matches.json, group standings, and ICS calendar. Invoke when user provides a match score like '球队A vs 球队B 2:1' or asks to update/record a match result."
---

# World Cup 2026 Match Result Updater

This skill updates a World Cup 2026 match result across all data files.

## When to Invoke

The user provides a match score in any of these formats:
- `墨西哥 vs 南非 2:0`
- `巴西 3:1 摩洛哥`
- Any sentence containing "TeamA vs TeamB X:Y" or "TeamA X:Y TeamB"
- User says "更新比分" / "update score" / "record result"

## How to Update

### Step 1: Parse the user's input

Extract team names and score from the user's input. Support these patterns:
- `"球队A vs 球队B 2:1"` (recommended)
- `"球队A 2:1 球队B"` (convert to "球队A vs 球队B 2:1")

### Step 2: Run the update script

```bash
node scripts/update-match.js "球队A vs 球队B X:Y"
```

Execute from the project root directory: `d:\Workspace\WorldCup2026-Calendar`

### Step 3: Confirm results

The script will:
1. Find the match in `data/worldcup2026-matches.json` (handles home/away direction automatically)
2. Update `home_team.score`, `home_team.points`, `away_team.score`, `away_team.points`, `status`
3. Run `build.js` to regenerate `data/worldcup2026-group_standings.json` and `worldcup2026.ics`

Report the updated match details to the user: group, round, venue, and new standings.

## Example

User: `"加拿大 vs 波黑 1:0"`

Response: Run `node scripts/update-match.js "加拿大 vs 波黑 1:0"` from `d:\Workspace\WorldCup2026-Calendar`, then report updated B组 standings.
