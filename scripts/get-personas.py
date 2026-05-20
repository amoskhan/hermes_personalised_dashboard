#!/usr/bin/env python3
"""Read Hermes config.yaml and return available personas + current active one."""
import yaml, json, os

CONFIG_PATH = os.path.expanduser('~/.hermes/config.yaml')

# Load config
with open(CONFIG_PATH) as f:
    config = yaml.safe_load(f)

# Extract personas from agent section
personalities = config.get('agent', {}).get('personalities', {})
personas = []
for name, description in personalities.items():
    # Truncate long descriptions for display
    desc_short = description.strip().split('\n')[0][:100]
    if len(description.strip()) > 100:
        desc_short += '…'
    personas.append({
        'id': name,
        'name': name.capitalize(),
        'description': desc_short.replace('"', '').replace("'", ""),
        'prompt': description.strip()
    })

# Get active persona
active = config.get('display', {}).get('personality', 'helpful')

print(json.dumps({
    'personas': personas,
    'active': active,
    'count': len(personas)
}, indent=2))
