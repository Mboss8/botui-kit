#!/usr/bin/env bash
set -euo pipefail

curl -sS -X POST 'http://127.0.0.1:8787/v1/render' \
  -H 'Content-Type: application/json' \
  --data-binary @- <<'JSON'
{
  "screen": "orders.report",
  "theme": "business",
  "locale": "zh-CN",
  "data": {
    "customer": "<Acme & Co>",
    "total": "100 USD"
  },
  "content": {
    "mode": "rich",
    "blocks": [
      {
        "type": "heading",
        "text": {"i18n": "report.title", "fallback": "订单报告：{{ customer }}"}
      },
      {
        "type": "paragraph",
        "text": "金额：{{ total }}"
      },
      {
        "type": "table",
        "bordered": true,
        "rows": [
          [
            {"text": "项目", "header": true},
            {"text": "数值", "header": true}
          ],
          [
            {"text": "合计"},
            {"text": "{{ total }}"}
          ]
        ]
      }
    ]
  },
  "actions": [
    {
      "text": {"i18n": "navigation.back", "fallback": "返回"},
      "action": "navigation.back",
      "style": "default"
    }
  ]
}
JSON
