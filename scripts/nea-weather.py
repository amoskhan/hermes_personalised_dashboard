#!/usr/bin/env python3
"""Fetch Singapore weather from NEA via data.gov.sg API (official SG government source)."""

import json, sys, urllib.request
from datetime import datetime, timezone, timedelta

SGT = timezone(timedelta(hours=8))

# Areas closest to East Coast Park
ECP_AREAS = ["Bedok", "Marine Parade", "Changi", "Kallang", "Geylang"]

def fetch_json(url, timeout=10):
    req = urllib.request.Request(url, headers={"User-Agent": "visual-os/1.0"})
    with urllib.request.urlopen(req, timeout=timeout) as resp:
        return json.loads(resp.read())

def get_weather():
    today = datetime.now(SGT).strftime("%Y-%m-%d")
    result = {
        "source": "NEA/data.gov.sg",
        "nowcast": {},
        "forecast_today": {},
        "forecast_tonight": {},
        "summary": "",
    }

    # 1. 2-hour nowcast (most current)
    try:
        url = f"https://api.data.gov.sg/v1/environment/2-hour-weather-forecast?date={today}"
        data = fetch_json(url)
        forecasts = data["items"][0]["forecasts"]
        ecp_forecasts = [f for f in forecasts if f["area"] in ECP_AREAS]
        result["nowcast"] = {
            "areas": {f["area"]: f["forecast"] for f in ecp_forecasts},
            "all_clear": all("Rain" not in f["forecast"] and "Shower" not in f["forecast"] and "Thunder" not in f["forecast"] for f in ecp_forecasts),
        }
    except Exception as e:
        result["nowcast"] = {"error": str(e)}

    # 2. 24-hour forecast
    try:
        url = f"https://api.data.gov.sg/v1/environment/24-hour-weather-forecast?date={today}"
        data = fetch_json(url)
        periods = data["items"][0].get("periods", [])
        for p in periods:
            start = p.get("time", {}).get("start", "")
            if "18:00" in start:
                result["forecast_tonight"] = {
                    "east": p["regions"].get("east", ""),
                    "period": f"{p['time']['start']} to {p['time']['end']}",
                }
            elif "12:00" in start and "18:00" not in start:
                result["forecast_today"] = {
                    "east": p["regions"].get("east", ""),
                    "period": f"{p['time']['start']} to {p['time']['end']}",
                }
    except Exception as e:
        pass

    # Build summary string
    nowcast = result["nowcast"]
    tonight = result["forecast_tonight"]
    today_f = result["forecast_today"]

    parts = []
    if nowcast.get("all_clear"):
        parts.append("☀️ No rain expected near ECP")
    elif nowcast.get("areas"):
        statuses = list(set(nowcast["areas"].values()))
        parts.append(f"⛅ {', '.join(statuses)} near ECP")

    if tonight.get("east"):
        parts.append(f"🌙 Tonight: {tonight['east']}")
    if today_f.get("east"):
        parts.append(f"☁️ Today: {today_f['east']}")

    result["summary"] = " · ".join(parts) if parts else "Weather unavailable"
    return result

if __name__ == "__main__":
    print(json.dumps(get_weather()))
