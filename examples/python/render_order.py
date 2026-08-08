import json
from urllib.request import Request, urlopen

payload = {
    "screen": "orders.list",
    "theme": "default",
    "locale": "zh-CN",
    "data": {"customer": "示例客户"},
    "content": {
        "mode": "regular",
        "title": "订单中心",
        "text": "客户：{{ customer }}",
    },
    "actions": [
        {"text": "新建订单", "action": "order.create", "style": "primary"},
        {"text": "返回", "action": "navigation.back", "style": "default"},
    ],
    "pagination": {
        "mode": "page",
        "session": "ORD",
        "page": 2,
        "page_size": 8,
        "total_pages": 3,
        "total_items": 18,
    },
}

request = Request(
    "http://127.0.0.1:8787/v1/render",
    data=json.dumps(payload).encode("utf-8"),
    headers={"Content-Type": "application/json"},
    method="POST",
)

with urlopen(request) as response:
    print(json.dumps(json.load(response), ensure_ascii=False, indent=2))
