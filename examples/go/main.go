package main

import (
	"bytes"
	"encoding/json"
	"fmt"
	"io"
	"net/http"
)

func main() {
	payload := map[string]any{
		"screen": "orders.list",
		"theme":  "default",
		"locale": "zh-CN",
		"data": map[string]any{
			"customer": "示例客户",
		},
		"content": map[string]any{
			"mode":  "regular",
			"title": "订单中心",
			"text":  "客户：{{ customer }}",
		},
		"actions": []map[string]any{
			{"text": "新建订单", "action": "order.create", "style": "primary"},
			{"text": "返回", "action": "navigation.back", "style": "default"},
		},
		"pagination": map[string]any{
			"mode":        "page",
			"session":     "ORD",
			"page":        2,
			"page_size":   8,
			"total_pages": 3,
			"total_items": 18,
		},
	}

	body, err := json.Marshal(payload)
	if err != nil {
		panic(err)
	}

	resp, err := http.Post("http://127.0.0.1:8787/v1/render", "application/json", bytes.NewReader(body))
	if err != nil {
		panic(err)
	}
	defer resp.Body.Close()

	result, err := io.ReadAll(resp.Body)
	if err != nil {
		panic(err)
	}

	fmt.Println(string(result))
}
