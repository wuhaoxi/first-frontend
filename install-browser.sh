#!/bin/bash
set -e
cd /Users/wuhaoxuan/Documents/aiagent/my-first-project/frontend
echo "=== Installing Playwright Chromium ==="
npx playwright install chromium 2>&1
echo "=== Done ==="
