#!/usr/bin/env python3
"""Set the active Hermes persona via config."""
import yaml, json, os, sys

CONFIG_PATH = os.path.expanduser('~/.hermes/config.yaml')

persona_name = sys.argv[1].strip().lower() if len(sys.argv) > 1 else 'helpful'

# Load config
with open(CONFIG_PATH) as f:
    config = yaml.safe_load(f)

# Validate persona exists
personalities = config.get('agent', {}).get('personalities', {})
if persona_name not in personalities:
    print(json.dumps({
        'status': 'error',
        'message': f"Persona '{persona_name}' not found. Available: {', '.join(personalities.keys())}"
    }))
    sys.exit(1)

# Ensure display section exists
if 'display' not in config:
    config['display'] = {}
old = config['display'].get('personality', 'helpful')
config['display']['personality'] = persona_name

# Write back
with open(CONFIG_PATH, 'w') as f:
    yaml.dump(config, f, default_flow_style=False, sort_keys=False, allow_unicode=True)

print(json.dumps({
    'status': 'ok',
    'previous': old,
    'active': persona_name
}))
