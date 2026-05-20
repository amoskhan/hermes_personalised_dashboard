import json, sys, subprocess

def main():
    # Run the calendar list command
    cmd = [
        sys.executable,
        '/home/ubuntu/.hermes/skills/productivity/google-workspace/scripts/google_api.py',
        'calendar', 'list', '--max', '30'
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

    import datetime
    today = datetime.date.today().isoformat()

    today_events = []
    for evt in all_events:
        start = evt.get('start', '')
        start_date = start.split('T')[0] if 'T' in start else start
        if start_date == today:
            is_all_day = 'T' not in start
            today_events.append({
                'id': evt.get('id', ''),
                'summary': evt.get('summary', ''),
                'start': start,
                'end': evt.get('end', ''),
                'location': evt.get('location', ''),
                'isAllDay': is_all_day
            })

    # Sort: all-day first, then by start time
    today_events.sort(key=lambda e: (0 if e['isAllDay'] else 1, e.get('start', '')))
    print(json.dumps(today_events, indent=2))

if __name__ == '__main__':
    main()
