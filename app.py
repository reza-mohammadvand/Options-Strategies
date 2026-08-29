from flask import Flask, jsonify, request
import requests
import pandas as pd
import re
import jdatetime
import time
from flask import Response
import json
from flask_cors import CORS
from flask import render_template


app = Flask(__name__)
CORS(app)

# ✅ مپ نماد اختیار → نماد پایه
mapping = {
    "طوتعاون":"وتعاون","طهمن":"خبهمن","طهرم":"اهرم","طنارنج":"نارنج","طموج":"موج",
    "طملي":"فملی","طملت":"وبملت","طمخا":"اخابر","طكاريس":"کاریس","طفلا":"فولاد",
    "طفصبا":"فصبا","طفزر":"فزر","طفرابورس":"فرابورس","ططعام":"طعام","طصاد":"وبصادر",
    "طشنا":"شپنا","طستر":"خگستر","طسپا":"خساپا","طسامان":"سامان","طرويين":"رویین",
    "طران":"خودران","طذوب":"ذوب","طخود":"خودرو","طخاور":"خاور","طجهش":"جهش",
    "طجار":"وتجارت","طتيام":"تیام","طتوان":"توان","طتاص":"تاصیکو","طتاب":"شتاب",
    "طپناه":"پناه","طپتروآبان":"پتروآبان","طپادا":"پادا","طبيد":"بیدار",
    "طبساما":"بساما","طامين شهر":"امین شهر","طاطلس":"اطلس","طاساس":"آساس",
    "ضوتعاون":"وتعاون","ضهمن":"خبهمن","ضهرم":"اهرم","ضنارنج":"نارنج","ضموج":"موج",
    "ضملي":"فملی","ضملت":"وبملت","ضمخا":"اخابر","ضكاريس":"کاریس","ضفلا":"فولاد",
    "ضفصبا":"فصبا","ضفزر":"فزر","ضفرابورس":"فرابورس","ضطعام":"طعام","ضصاد":"وبصادر",
    "ضشنا":"شپنا","ضستر":"خگستر","ضستا":"شستا","طستا":"شستا","ضسپا":"خساپا","ضسامان":"سامان",
    "ضرويين":"رویین","ضران":"خودران","ضذوب":"ذوب","ضخود":"خودرو","ضخاور":"خاور",
    "ضجهش":"جهش","ضجار":"وتجارت","ضتيام":"تیام","ضتوان":"توان","ضتاص":"تاصیکو",
    "ضتاب":"شتاب","ضپناه":"پناه","ضپتروآبان":"پتروآبان","ضپادا":"پادا",
    "ضبيد":"بیدار","ضبساما":"بساما","ضامين شهر":"امین شهر","ضاطلس":"اطلس",
    "ضاساس":"آساس"
}

def get_best_limits(ins_code):
    url = f"http://cdn.tsetmc.com/api/BestLimits/{ins_code}"

    try:
        res = requests.get(url, timeout=5)
        data = res.json()
    except:
        return None, None, None, None

    best_limits = data.get('bestLimits', [])
    if not best_limits:
        return None, None, None, None

    first = best_limits[0]

    buy_price = first.get('buyPrice') or first.get('pMeDem')
    buy_volume = first.get('buyVolume') or first.get('qTitMeDem')

    sell_price = first.get('sellPrice') or first.get('pMeOf')
    sell_volume = first.get('sellVolume') or first.get('qTitMeOf')

    return buy_price, buy_volume, sell_price, sell_volume

def format_num(x):
    try:
        return f"{int(x):,}"
    except:
        return x
    
def parse_number(value):
    """
    تبدیل مقدار رشته‌ای به عدد.
    در صورت نامعتبر بودن مقدار، None برمی‌گرداند.
    """
    try:
        return float(str(value).replace(",", "").strip())
    except (TypeError, ValueError):
        return None


def extract_expiry_data(desc):
    """
    استخراج تاریخ سررسید و تعداد روز باقی‌مانده از توضیحات نماد.
    """
    expire_date = ""
    days_remaining = None

    pattern_slash = re.search(r'\d{4}/\d{2}/\d{2}', desc)
    pattern8 = re.search(r'-(\d{8})', desc)
    pattern6 = re.search(r'-(\d{6})', desc)

    if pattern_slash:
        expire_date = pattern_slash.group(0)

    elif pattern8:
        raw = pattern8.group(1)
        expire_date = f"{raw[:4]}/{raw[4:6]}/{raw[6:8]}"

    elif pattern6:
        raw = pattern6.group(1)
        year = 1400 + int(raw[:2])
        expire_date = f"{year}/{raw[2:4]}/{raw[4:6]}"

    if expire_date:
        try:
            year, month, day = map(int, expire_date.split("/"))

            expiry_date = jdatetime.date(year, month, day)
            today_jalali = jdatetime.date.today()

            difference = (
                expiry_date.togregorian()
                - today_jalali.togregorian()
            )

            days_remaining = difference.days

        except (TypeError, ValueError):
            days_remaining = None

    return expire_date, days_remaining

def generate_spread_data(
    base_symbol="",
    min_trade_value=None,
    days_value=None,
    days_operator=None
):
    """
    دریافت نمادهای اختیار خرید و اعمال فیلترهای اسپرد.

    base_symbol:
        نماد پایه مانند اهرم

    min_trade_value:
        حداقل ارزش معاملات به ریال

    days_value:
        تعداد روز تا سررسید

    days_operator:
        gte = بیشتر یا مساوی
        lte = کمتر یا مساوی
        eq  = مساوی
    """

    market_url = "https://old.tsetmc.com/tsev2/data/MarketWatchPlus.aspx"

    try:
        response = requests.get(market_url, timeout=10)
        response.raise_for_status()
        response.encoding = "utf-8"

    except requests.RequestException as error:
        print("MarketWatch error:", error)
        return []

    rows = response.text.strip().split(";")

    # قیمت آخرین معامله تمام نمادهای بازار
    market_data = {}

    for row in rows:
        fields = row.split(",")

        if len(fields) < 25:
            continue

        market_symbol = fields[2].strip()
        market_last_price = parse_number(fields[7])

        if market_last_price is not None:
            market_data[market_symbol] = market_last_price

    candidates = []

    

    for row in rows:
        fields = row.split(",")

        if len(fields) < 25:
            continue

        ins_code = fields[0].strip()
        symbol = fields[2].strip()
        desc = fields[3].strip()
        # آخرین قیمت نماد اختیار
        option_last_price = parse_number(fields[7])

        # استخراج قیمت اعمال از توضیحات نماد
        strike = None

        strike_match = re.search(r'-(\d+)-', desc)

        if strike_match:
            strike = parse_number(strike_match.group(1))

        # فقط اختیار خرید
        if not symbol.startswith("ض"):
            continue

        # حذف اعداد انتهای نماد، مانند ضهرم1234 ← ضهرم
        clean_symbol = re.sub(r'\d+', '', symbol).strip()

        # پیدا کردن نماد پایه از mapping
        option_base_symbol = mapping.get(clean_symbol)

        if not option_base_symbol:
            continue

        # قیمت آخرین معامله نماد پایه
        base_price = market_data.get(option_base_symbol)

        if base_price is None:
            continue

        # محاسبه اهرم
        leverage = None

        if (
            option_last_price is not None
            and option_last_price > 0
        ):
            leverage = round(
                base_price / option_last_price,
                2
            )

        # فیلتر نماد پایه
        if base_symbol and option_base_symbol != base_symbol:
            continue

        # ارزش معاملات
        trade_value = parse_number(fields[10])

        if min_trade_value is not None:
            if trade_value is None:
                continue

            if trade_value < min_trade_value:
                continue

        # تاریخ سررسید و روز باقی‌مانده
        expire_date, days_remaining = extract_expiry_data(desc)

        # موقعیت باز
        open_interest = parse_number(fields[24])

        # وضعیت اختیار خرید
        status = ""

        if strike is not None and base_price is not None:

            if base_price > strike:
                status = "ITM"

            elif base_price < strike:
                status = "OTM"

            else:
                status = "ATM"

        # فیلتر روز تا سررسید
        if days_value is not None:

            if days_remaining is None:
                continue

            if days_operator == "gte" and days_remaining < days_value:
                continue

            if days_operator == "lte" and days_remaining > days_value:
                continue

            if days_operator == "eq" and days_remaining != days_value:
                continue

        # فقط اطلاعات نمادهای عبورکرده ذخیره می‌شود.
        candidates.append({
            "ins_code": ins_code,
            "symbol": symbol,
            "base_symbol": option_base_symbol,

            "base_price": base_price,
            "option_last_price": option_last_price,
            "leverage": leverage,

            "strike": strike,
            "open_interest": open_interest,
            "status": status,

            "expire_date": expire_date,
            "days_remaining": days_remaining,
            "trade_value": trade_value
        })

    output = []

    # فقط برای نمادهای عبورکرده، اطلاعات سفارش‌ها دریافت می‌شود.
    for item in candidates:

        buy_price, buy_volume, sell_price, sell_volume = get_best_limits(
            item["ins_code"]
        )

        output.append({
            "نماد اختیار": item["symbol"],
            "نماد پایه": item["base_symbol"],

            "آخرین قیمت نماد پایه": (
                format_num(item["base_price"])
                if item["base_price"] is not None
                else ""
            ),

            "آخرین قیمت نماد اختیار": (
                format_num(item["option_last_price"])
                if item["option_last_price"] is not None
                else ""
            ),

            "اهرم": (
                item["leverage"]
                if item["leverage"] is not None
                else ""
            ),

            "قیمت اعمال": (
                format_num(item["strike"])
                if item["strike"] is not None
                else ""
            ),

            "وضعیت": item["status"],

            "موقعیت باز": (
                format_num(item["open_interest"])
                if item["open_interest"] is not None
                else ""
            ),

            "ارزش معاملات": (
                format_num(item["trade_value"])
                if item["trade_value"] is not None
                else ""
            ),

            "تاریخ سررسید": item["expire_date"],

            "روز باقی‌مانده": (
                item["days_remaining"]
                if item["days_remaining"] is not None
                else ""
            ),

            "قیمت خرید": (
                format_num(buy_price)
                if buy_price is not None
                else ""
            ),

            "حجم خرید": (
                format_num(buy_volume)
                if buy_volume is not None
                else ""
            ),

            "قیمت فروش": (
                format_num(sell_price)
                if sell_price is not None
                else ""
            ),

            "حجم فروش": (
                format_num(sell_volume)
                if sell_volume is not None
                else ""
            )
        })

    return output


def generate_data():
    url = "https://old.tsetmc.com/tsev2/data/MarketWatchPlus.aspx"

    for _ in range(10):
        r = requests.get(url)
        r.encoding = "utf-8"
        rows = r.text.strip().split(';')

        market_data = {}
        for row in rows:
            f = row.split(',')
            if len(f) < 25:
                continue
            market_data[f[2]] = f[7]

        output = []
        today_jalali = jdatetime.date.today()

        for row in rows:
            f = row.split(',')
            if len(f) < 25:
                continue

            symbol = f[2]
            desc = f[3]

            ins_code = f[0]   # 👈 خیلی مهم (کد نماد)
            #buy_price, buy_vol, sell_price, sell_vol = get_best_limits(ins_code)

            if not (symbol.startswith("ط") or symbol.startswith("ض")):
                continue

            base_key = re.sub(r'\d+', '', symbol)
            base_symbol = mapping.get(base_key, "")
            base_price = market_data.get(base_symbol, "")

            if not base_price.isdigit():
                continue

            last_price = f[7]
            close_price = f[6]
            trade_value = f[10]

            if not last_price.isdigit():
                continue

            last_price = float(last_price)
            base_price = float(base_price)

            # strike
            strike = ""
            m = re.search(r'-(\d+)-', desc)
            if m:
                strike = float(m.group(1))

            # expire date
            expire_date = ""
            days_remaining = ""

            pattern_slash = re.search(r'\d{4}/\d{2}/\d{2}', desc)
            pattern8 = re.search(r'-(\d{8})', desc)
            pattern6 = re.search(r'-(\d{6})', desc)

            if pattern_slash:
                expire_date = pattern_slash.group(0)
            elif pattern8:
                raw = pattern8.group(1)
                expire_date = f"{raw[:4]}/{raw[4:6]}/{raw[6:8]}"
            elif pattern6:
                raw = pattern6.group(1)
                year = 1400 + int(raw[:2])
                expire_date = f"{year}/{raw[2:4]}/{raw[4:6]}"

            if expire_date:
                try:
                    y, m, d = map(int, expire_date.split('/'))
                    expiry = jdatetime.date(y, m, d)
                    diff = expiry.togregorian() - today_jalali.togregorian()
                    days_remaining = diff.days
                except:
                    days_remaining = ""

            leverage = round(base_price / last_price, 2) if last_price > 0 else ""

            if base_price > 0 and strike != "":
                is_call = symbol.startswith("ض")

                breakeven_calc = (strike + last_price) if is_call else (strike - last_price)

                intrinsic_diff = round((breakeven_calc / base_price) - 1, 4)
            else:
                intrinsic_diff = ""

            if symbol.startswith("ض"):
                breakeven = round(strike + last_price, 2)
            else:
                breakeven = round(strike - last_price, 2)

            open_interest = f[24] if len(f) > 24 else ""

            # status
            if strike != "":
                if symbol.startswith("ض"):
                    status = "ITM" if base_price > strike else ("OTM" if base_price < strike else "ATM")
                else:
                    status = "OTM" if base_price > strike else ("ITM" if base_price < strike else "ATM")
            else:
                status = ""

            output.append({
                "نماد اختیار": symbol,

                "قیمت نماد پایه": format_num(base_price),
                "قیمت اعمال": format_num(strike),

                "تاریخ سررسید": expire_date,

                "آخرین قیمت اختیار": format_num(last_price),
                "قیمت پایانی اختیار": format_num(close_price) if close_price.isdigit() else None,

                "ارزش معاملات": format_num(trade_value) if trade_value.isdigit() else None,

                "روز باقی‌مانده": days_remaining,
                "اهرم": leverage,
                "وضعیت": status,

                "موقعیت باز": format_num(open_interest),

                "فاصله تا سر‌به‌سر": round(intrinsic_diff * 100, 2) if intrinsic_diff != "" else "",
                "قیمت سر‌به‌سر": format_num(breakeven),
            })

        if len(output) > 0:
            return output

        time.sleep(2)

    return []


@app.route("/")
def index():
    return render_template("index.html")


@app.route("/data")
def get_data():
    data = generate_data()
    return Response(
        json.dumps(data, ensure_ascii=False),
        content_type="application/json; charset=utf-8"
    )


@app.route("/spread-data")
def get_spread_data():

    base_symbol = request.args.get(
        "base_symbol",
        default="",
        type=str
    ).strip()

    value_input = request.args.get(
        "value",
        default="",
        type=str
    ).strip()

    days_input = request.args.get(
        "days",
        default="",
        type=str
    ).strip()

    days_operator = request.args.get(
        "days_operator",
        default="",
        type=str
    ).strip()

    # انتخاب نماد پایه اجباری است تا برای همه نمادها
    # درخواست BestLimits ارسال نشود.
    if not base_symbol:
        return Response(
            json.dumps(
                {"error": "لطفاً نماد پایه را انتخاب کنید."},
                ensure_ascii=False
            ),
            status=400,
            content_type="application/json; charset=utf-8"
        )

    min_trade_value = None
    days_value = None

    # عدد واردشده در ارزش معاملات در 10,000,000 ضرب می‌شود.
    if value_input:
        try:
            min_trade_value = float(value_input) * 10_000_000

        except ValueError:
            return Response(
                json.dumps(
                    {"error": "مقدار ارزش معاملات نامعتبر است."},
                    ensure_ascii=False
                ),
                status=400,
                content_type="application/json; charset=utf-8"
            )

    if days_input:
        try:
            days_value = int(days_input)

        except ValueError:
            return Response(
                json.dumps(
                    {"error": "تعداد روز تا سررسید نامعتبر است."},
                    ensure_ascii=False
                ),
                status=400,
                content_type="application/json; charset=utf-8"
            )

        if days_operator not in {"gte", "lte", "eq"}:
            return Response(
                json.dumps(
                    {
                        "error": (
                            "برای فیلتر روز تا سررسید، "
                            "یکی از دکمه‌های بالا، پایین یا مساوی را انتخاب کنید."
                        )
                    },
                    ensure_ascii=False
                ),
                status=400,
                content_type="application/json; charset=utf-8"
            )

    data = generate_spread_data(
        base_symbol=base_symbol,
        min_trade_value=min_trade_value,
        days_value=days_value,
        days_operator=days_operator
    )

    return Response(
        json.dumps(data, ensure_ascii=False),
        content_type="application/json; charset=utf-8"
    )



if __name__ == "__main__":
    app.run(host="0.0.0.0", port=5000, debug=True)