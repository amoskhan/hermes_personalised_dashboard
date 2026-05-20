#!/usr/bin/env python3
"""Fetch recent GitHub activity across Amos's repos."""
import json, urllib.request, sys
from datetime import datetime, timezone

REPOS = [
    'amoskhan/hermes_personalised_dashboard',
    'amoskhan/SG-PE-Syllabus-Bot',
    'amoskhan/Kinetix-Lab',
    'amoskhan/amosportfolio5',
    'amoskhan/vault',
]

def fetch_json(url):
    req = urllib.request.Request(url, headers={'User-Agent': 'Hermes-Dashboard'})
    try:
        with urllib.request.urlopen(req, timeout=10) as resp:
            return json.loads(resp.read())
    except:
        return []

def relative_time(iso_str):
    if not iso_str:
        return ''
    try:
        dt = datetime.fromisoformat(iso_str.replace('Z', '+00:00'))
        now = datetime.now(timezone.utc)
        diff = now - dt
        mins = int(diff.total_seconds() / 60)
        if mins < 1: return 'just now'
        if mins < 60: return f'{mins}m ago'
        hours = mins // 60
        if hours < 24: return f'{hours}h ago'
        days = hours // 24
        if days < 7: return f'{days}d ago'
        return f'{days // 7}w ago'
    except:
        return iso_str[:10]

def main():
    result = {'repos': [], 'total_commits': 0}

    for repo in REPOS:
        commits = fetch_json(f'https://api.github.com/repos/{repo}/commits?per_page=5')

        if not commits or 'message' in commits:
            continue

        repo_info = fetch_json(f'https://api.github.com/repos/{repo}') or {}
        pushed = repo_info.get('pushed_at', '')
        description = repo_info.get('description', '')

        repo_data = {
            'name': repo.split('/')[1],
            'full_name': repo,
            'url': f'https://github.com/{repo}',
            'description': description or '',
            'pushed_at': relative_time(pushed),
            'commits': []
        }

        for c in commits[:5]:
            commit = c.get('commit', {})
            sha = c.get('sha', '')[:7]
            message = commit.get('message', '').split('\n')[0][:80]
            author = commit.get('author', {})
            author_name = author.get('name', 'Unknown')
            date = commit.get('committer', {}).get('date', '')

            repo_data['commits'].append({
                'sha': sha,
                'message': message,
                'author': author_name,
                'date': relative_time(date)
            })

        result['repos'].append(repo_data)
        result['total_commits'] += len(repo_data['commits'])

    # Sort by most recently pushed
    result['repos'].sort(key=lambda r: r['pushed_at'], reverse=True)
    print(json.dumps(result, indent=2))

if __name__ == '__main__':
    main()
