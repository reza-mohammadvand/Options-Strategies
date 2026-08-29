from flask import Flask, jsonify, render_template, send_file
import requests
import pandas as pd
import time
import io

app = Flask(__name__)

INS_CODE = "8175784894140974"

history = []
full_history = []


def fetch_data():
    url = f"http://cdn.tsetmc.com/api/BestLimits/{INS_CODE}"

    try:
        res = requests.get(url, timeout=5)
        data = res.json()
    except:
        return

    best_limits = data.get('bestLimits', [])

    if not best_limits:
        return

    buy_total = 0
    sell_total = 0

    # ✅ گرفتن آخرین قیمت (فروش ردیف اول)
    first_row = best_limits[0]

    sell_price_first = (
        first_row.get('sellPrice')
        or first_row.get('pMeOf')
        or 0
    )

    last_price = sell_price_first if sell_price_first else None

    # ✅ محاسبه مجموع‌ها
    for row in best_limits:

        buy_volume = row.get('buyVolume') or row.get('qTitMeDem') or 0
        buy_price = row.get('buyPrice') or row.get('pMeDem') or 0

        sell_volume = row.get('sellVolume') or row.get('qTitMeOf') or 0
        sell_price = row.get('sellPrice') or row.get('pMeOf') or 0

        buy_total += buy_volume * buy_price
        sell_total += sell_volume * sell_price

    # ✅ نسبت
    if sell_total == 0:
        ratio = None
    else:
        ratio = round(buy_total / sell_total, 2)

    record = {
        "timestamp": time.time(),
        "time": time.strftime("%H:%M:%S"),
        "buy": buy_total,
        "sell": sell_total,
        "ratio": ratio,
        "price": last_price   # 👈 درست شد
    }

    history.append(record)
    full_history.append(record)

    # محدود کردن حافظه
    if len(history) > 100:
        history.pop(0)


@app.route("/")
def index():
    return render_template("index.html")


@app.route("/data")
def data():
    try:
        fetch_data()
        return jsonify(history)
    except Exception as e:
        print("ERROR:", e)
        return jsonify({"error": str(e)}), 500


@app.route("/export")
def export_excel():

    export_data = []

    for i in range(len(full_history)):
        item = full_history[i].copy()

        current_time = item["timestamp"]

        # ================= تغییر 30 ثانیه =================
        if i >= 5 and full_history[i]["ratio"] and full_history[i-5]["ratio"]:
            old = full_history[i-5]["ratio"]
            item["change_6"] = round((item["ratio"] / old - 1) * 100, 2) if old != 0 else None
        else:
            item["change_6"] = None

        # ================= تغییر 5 ثانیه =================
        if i >= 1 and full_history[i]["ratio"] and full_history[i-1]["ratio"]:
            prev = full_history[i-1]["ratio"]
            item["change_1"] = round((item["ratio"] / prev - 1) * 100, 2) if prev != 0 else None
        else:
            item["change_1"] = None

        # ================= میانگین 10 دقیقه =================
        ten_min_ago = current_time - 600

        last_10m_ratios = [
            x["ratio"] for x in full_history
            if x["timestamp"] >= ten_min_ago and x["ratio"] is not None
        ]

        if last_10m_ratios:
            avg = sum(last_10m_ratios) / len(last_10m_ratios)

            if avg != 0 and item["ratio"] is not None:
                item["avg_10m"] = round((item["ratio"] / avg - 1) * 100, 2)
            else:
                item["avg_10m"] = None
        else:
            item["avg_10m"] = None

        export_data.append(item)

    df = pd.DataFrame(export_data)

    output = io.BytesIO()
    df.to_excel(output, index=False)
    output.seek(0)

    return send_file(
        output,
        download_name="power_ratio.xlsx",
        as_attachment=True
    )


if __name__ == "__main__":
    app.run(debug=True)