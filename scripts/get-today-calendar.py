import json, sys, subprocess, datetime

def main():
    days = 1
    if '--days' in sys.argv:
        idx = sys.argv.index('--days')
        if idx + 1 < len(sys.argv):
            days = int(sys.argv[idx + 1])

    cmd = [
        sys.executable,
        '/home/ubuntu/.hermes/skills/productivity/google-workspace/scripts/google_api.py',
        'calendar', 'list', '--max', '50'
    ]
    result = subprocess.run(cmd, capture_output=True, text=True, timeout=15)
    if result.returncode != 0:
        print(json.dumps([]))
        return

    try:
        all_events = json.loads(result.stdout)
    except json.JSONDecodeError:
        print(json.dumps([]))
        return

    today = datetime.date.today()
    end_date = today + datetime.timedelta(days=days)

    filtered = []
    for evt in all_events:
        start = evt.get('start', '')
        start_date_str = start.split('T')[0] if 'T' in start else start
        if not start_date_str:
            continue
        try:
            start_date = datetime.date.fromisoformat(start_date_str)
        except:
            continue
        if today <= start_date < end_date:
            is_all_day = 'T' not in start
            filtered.append({
                'id': evt.get('id', ''),
                'summary': evt.get('summary', ''),
                'start': start,
                'end': evt.get('end', ''),
                'location': evt.get('location', ''),
                'isAllDay': is_all_day
            })

    filtered.sort(key=lambda e: (0 if e['isAllDay'] else 1, e.get('start', '')))
    print(json.dumps(filtered, indent=2))

if __name__ == '__main__':
    main()
