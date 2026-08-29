let originalData = [];
let filteredData = [];

let currentSort = {
    column: null,
    direction: null
};

let valueFilterType = null;
let daysFilterType = null;

// فیلتر روز مخصوص تب اسپرد
let spreadDaysFilterType = null;

let spreadOriginalData = [];

let spreadCurrentSort = {
    column: null,
    direction: null
};

// ردیف انتخاب‌شده در هر جدول
const selectedRowKeys = {
    market: null,
    spread: null,
    spreadCalculation: null
};

// اطلاعات جدول محاسبات اسپرد
let spreadCalculationOriginalData = [];

let spreadCalculationSort = {
    column: null,
    direction: null
};


const mapping = {
    "طوتعاون":"وتعاون","طهمن":"خبهمن","طهرم":"اهرم","طموج":"موج",
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

async function loadData() {
    try {
        
        const res = await fetch("http://192.168.100.189:5000/data");
        const data = await res.json();

        originalData = data;

        // 👇 چک کن آیا فیلتر داریم یا نه
        if (hasActiveFilters()) {
            applyFilters();
        } else {
            filteredData = data;
            renderTable(filteredData);
        }

        const tableHead = document.querySelector("#table thead");
        tableHead.innerHTML = "";

        if (data.length === 0) return;

        let headers = Object.keys(data[0]);

        let headRow = "<tr>";
        headers.forEach(h =>
            headRow += `<th onclick="sortTable('${h}')">${h}</th>`,
        );
        headRow += "</tr>";

        tableHead.innerHTML = headRow;


    } catch (err) {
        console.error("ERROR:", err);
    }
}

function renderTable(data) {

    const tableBody = document.querySelector(
        "#table tbody"
    );

    if (!tableBody) {
        return;
    }

    tableBody.innerHTML = "";

    if (!Array.isArray(data) || data.length === 0) {

        tableBody.innerHTML = `
            <tr>
                <td colspan="20">
                    اطلاعاتی برای نمایش وجود ندارد.
                </td>
            </tr>
        `;

        return;
    }

    const headers = Object.keys(data[0]);

    data.forEach((row, index) => {

        const tr = document.createElement("tr");

        const rowKey = getTableRowKey(
            "market",
            row,
            index
        );

        applyRowSelection({
            tableName: "market",
            tableSelector: "#table",
            rowElement: tr,
            rowKey
        });

        headers.forEach(header => {

            const td = document.createElement("td");

            td.classList.add("number-cell");
            td.textContent = row[header] ?? "";

            tr.appendChild(td);
        });

        tableBody.appendChild(tr);
    });
}

// ================= SORT =================
function sortTable(column) {

    if (currentSort.column !== column) {
        currentSort = { column: column, direction: "desc" }; // 👈 تغییر اینجا
    } else if (currentSort.direction === "desc") {
        currentSort.direction = "asc";
    } else {
        currentSort = { column: null, direction: null };
        renderTable(filteredData);
        return;
    }

    let sorted = [...filteredData];

    sorted.sort((a, b) => {
        let valA = a[column];
        let valB = b[column];

        if (typeof valA === "string") valA = valA.replace(/,/g, "");
        if (typeof valB === "string") valB = valB.replace(/,/g, "");

        valA = isNaN(valA) ? valA : Number(valA);
        valB = isNaN(valB) ? valB : Number(valB);

        if (valA < valB) return currentSort.direction === "asc" ? -1 : 1;
        if (valA > valB) return currentSort.direction === "asc" ? 1 : -1;
        return 0;
    });

    renderTable(sorted);
}

// ================= FILTER =================
function applyFilters() {
    
    const baseSymbolFilters = getSelectedValues(
        "filter-base-symbol"
    );
    let symbol = document.getElementById("filter-symbol").value.trim();
    let status = document.getElementById("filter-status").value.trim();

    let value = document.getElementById("filter-value").value;

    let days = document.getElementById("filter-days").value;

    filteredData = originalData.filter(row => {

        // --- فیلتر نماد پایه (هوشمند) ---
        if (baseSymbolFilters.length > 0) {

            const optionSymbol =
                row["نماد اختیار"] ?? "";

            const cleanSymbol =
                optionSymbol
                    .replace(/\d+/g, "")
                    .trim();

            const base =
                mapping[cleanSymbol] || "";

            if (!baseSymbolFilters.includes(base)) {
                return false;
            }
        }

        // --- نماد ---
        if (symbol && !row["نماد اختیار"]?.includes(symbol)) {
            return false;
        }

        // --- وضعیت ---
        if (status && row["وضعیت"] !== status) {
            return false;
        }

        // --- ارزش معاملات ---
        if (value && valueFilterType) {

            let inputValue = Number(value) * 1000000;

            let v = row["ارزش معاملات"]
                ? Number(row["ارزش معاملات"].replace(/,/g, ""))
                : 0;

            if (valueFilterType === "gt" && !(v >= inputValue)) return false;
            if (valueFilterType === "lt" && !(v <= inputValue)) return false;
        }
        // --- روز باقی‌مانده ---
        if (days && daysFilterType) {

            let d = Number(row["روز باقی‌مانده"]) || 0;

            if (daysFilterType === "gt" && !(d >= Number(days))) return false;
            if (daysFilterType === "lt" && !(d <= Number(days))) return false;

            if (daysFilterType === "gte" && !(d >= Number(days))) return false;
            if (daysFilterType === "lte" && !(d <= Number(days))) return false;
            if (daysFilterType === "eq" && !(d === Number(days))) return false;
        }

        return true;
    });

    renderTable(filteredData);
}

// ================= RESET =================
function resetFilters() {

    valueFilterType = null;
    daysFilterType = null;

    document.getElementById("value-up")?.classList.remove("active");
    document.getElementById("value-down")?.classList.remove("active");
    document.getElementById("days-up")?.classList.remove("active");
    document.getElementById("days-down")?.classList.remove("active");

    clearMultiSelect("filter-base-symbol");
    document.getElementById("filter-symbol").value = "";
    document.getElementById("filter-status").value = "";
    document.getElementById("filter-value").value = "";
    document.getElementById("filter-days").value = "";

    filteredData = originalData;

    renderTable(filteredData);
}


function hasActiveFilters() {

    return (
        getSelectedValues(
            "filter-base-symbol"
        ).length > 0 ||

        document
            .getElementById("filter-symbol")
            ?.value ||

        document
            .getElementById("filter-status")
            ?.value ||

        document
            .getElementById("filter-value")
            ?.value ||

        document
            .getElementById("filter-days")
            ?.value
    );
}

function getSelectedValues(dropdownId) {

    const dropdown = document.getElementById(
        dropdownId
    );

    if (!dropdown) {
        return [];
    }

    return Array.from(
        dropdown.querySelectorAll(
            '.check-dropdown-option input[type="checkbox"]:checked'
        )
    ).map(checkbox => checkbox.value);
}


function updateCheckDropdownLabel(dropdown) {

    if (!dropdown) {
        return;
    }

    const selectedValues = getSelectedValues(
        dropdown.id
    );

    const label = dropdown.querySelector(
        ".check-dropdown-label"
    );

    const placeholder =
        dropdown.dataset.placeholder ||
        "انتخاب نماد";

    if (!label) {
        return;
    }

    if (selectedValues.length === 0) {

        label.textContent = placeholder;

        dropdown.classList.remove(
            "has-selection"
        );

    } else if (selectedValues.length <= 2) {

        label.textContent =
            selectedValues.join("، ");

        dropdown.classList.add(
            "has-selection"
        );

    } else {

        label.textContent =
            `${selectedValues.length} نماد انتخاب شد`;

        dropdown.classList.add(
            "has-selection"
        );
    }
}


function clearMultiSelect(dropdownId) {

    const dropdown = document.getElementById(
        dropdownId
    );

    if (!dropdown) {
        return;
    }

    dropdown
        .querySelectorAll(
            '.check-dropdown-option input[type="checkbox"]'
        )
        .forEach(checkbox => {
            checkbox.checked = false;
        });

    updateCheckDropdownLabel(dropdown);
}


function closeAllCheckDropdowns(
    exceptDropdown = null
) {

    document
        .querySelectorAll(".check-dropdown.open")
        .forEach(dropdown => {

            if (dropdown === exceptDropdown) {
                return;
            }

            dropdown.classList.remove("open");

            const toggle = dropdown.querySelector(
                ".check-dropdown-toggle"
            );

            toggle?.setAttribute(
                "aria-expanded",
                "false"
            );
        });
}


function initializeCheckDropdown(dropdown) {

    if (
        !dropdown ||
        dropdown.dataset.initialized === "true"
    ) {
        return;
    }

    const toggle = dropdown.querySelector(
        ".check-dropdown-toggle"
    );

    const menu = dropdown.querySelector(
        ".check-dropdown-menu"
    );

    if (!toggle || !menu) {
        return;
    }

    toggle.addEventListener(
        "click",
        function (event) {

            event.stopPropagation();

            const willOpen =
                !dropdown.classList.contains("open");

            closeAllCheckDropdowns(dropdown);

            dropdown.classList.toggle(
                "open",
                willOpen
            );

            toggle.setAttribute(
                "aria-expanded",
                String(willOpen)
            );
        }
    );

    /*
        کلیک داخل منو باعث بسته‌شدن
        dropdown نمی‌شود.
    */
    menu.addEventListener(
        "click",
        function (event) {
            event.stopPropagation();
        }
    );

    dropdown.dataset.initialized = "true";

    /*
        listenerهای عمومی فقط یک بار
        به document اضافه می‌شوند.
    */
    if (!window.checkDropdownEventsInitialized) {

        document.addEventListener(
            "click",
            function () {
                closeAllCheckDropdowns();
            }
        );

        document.addEventListener(
            "keydown",
            function (event) {

                if (event.key === "Escape") {
                    closeAllCheckDropdowns();
                }
            }
        );

        window.checkDropdownEventsInitialized = true;
    }
}


function populateBaseSymbolDropdown() {

    const baseSymbols =
        Object.values(mapping);

    const uniqueSymbols = [
        ...new Set(baseSymbols)
    ].sort((firstSymbol, secondSymbol) => {

        return firstSymbol.localeCompare(
            secondSymbol,
            "fa"
        );
    });

    const dropdownIds = [
        "filter-base-symbol",
        "spread-base-symbol"
    ];

    dropdownIds.forEach(dropdownId => {

        const dropdown = document.getElementById(
            dropdownId
        );

        if (!dropdown) {
            return;
        }

        const menu = dropdown.querySelector(
            ".check-dropdown-menu"
        );

        if (!menu) {
            return;
        }

        menu.innerHTML = "";

        uniqueSymbols.forEach(symbol => {

            const optionLabel =
                document.createElement("label");

            optionLabel.className =
                "check-dropdown-option";

            const checkbox =
                document.createElement("input");

            checkbox.type = "checkbox";
            checkbox.value = symbol;

            const optionText =
                document.createElement("span");

            optionText.textContent = symbol;

            checkbox.addEventListener(
                "change",
                function () {
                    updateCheckDropdownLabel(
                        dropdown
                    );
                }
            );

            optionLabel.appendChild(checkbox);
            optionLabel.appendChild(optionText);

            menu.appendChild(optionLabel);
        });

        initializeCheckDropdown(dropdown);
        updateCheckDropdownLabel(dropdown);
    });
}

function setValueFilter(type) {
    valueFilterType = type;

    document.getElementById("value-up")?.classList.remove("active");
    document.getElementById("value-down")?.classList.remove("active");

    document.getElementById(type === "gt" ? "value-up" : "value-down")
        ?.classList.add("active");
}

function setDaysFilter(type) {
    daysFilterType = type;

    document.getElementById("days-up")?.classList.remove("active");
    document.getElementById("days-down")?.classList.remove("active");

    document.getElementById(type === "gt" ? "days-up" : "days-down")
        ?.classList.add("active");
}

function setSpreadDaysFilter(type) {

    spreadDaysFilterType = type;

    const buttons = [
        "days-up-spread",
        "days-down-spread",
        "days-equal-spread"
    ];

    buttons.forEach(id => {
        document
            .getElementById(id)
            ?.classList.remove("active");
    });

    const activeButtonMap = {
        gte: "days-up-spread",
        lte: "days-down-spread",
        eq: "days-equal-spread"
    };

    document
        .getElementById(activeButtonMap[type])
        ?.classList.add("active");
}

function escapeHtml(value) {

    return String(value ?? "").replace(
        /[&<>"']/g,
        character => ({
            "&": "&amp;",
            "<": "&lt;",
            ">": "&gt;",
            '"': "&quot;",
            "'": "&#039;"
        })[character]
    );
}

function getTableRowKey(tableName, row, index) {

    if (tableName === "market") {
        return String(
            row["نماد اختیار"] ??
            `market-${index}`
        );
    }

    if (tableName === "spread") {
        return String(
            row["نماد اختیار"] ??
            `spread-${index}`
        );
    }

    if (tableName === "spreadCalculation") {
        return [
            row["روز تا سررسید"] ?? "",
            row["خرید"] ?? "",
            row["فروش"] ?? ""
        ].join("|");
    }

    return String(index);
}


function selectTableRow(
    tableName,
    tableSelector,
    rowElement,
    rowKey
) {

    selectedRowKeys[tableName] = rowKey;

    document
        .querySelectorAll(`${tableSelector} tbody tr`)
        .forEach(tr => {
            tr.classList.remove("selected-row");
        });

    rowElement.classList.add("selected-row");
}


function applyRowSelection({
    tableName,
    tableSelector,
    rowElement,
    rowKey
}) {

    rowElement.dataset.rowKey = rowKey;

    if (selectedRowKeys[tableName] === rowKey) {
        rowElement.classList.add("selected-row");
    }

    rowElement.addEventListener("click", function () {
        selectTableRow(
            tableName,
            tableSelector,
            rowElement,
            rowKey
        );
    });
}

function renderSpreadTable(data) {

    const tableHead = document.querySelector(
        "#spread-table thead"
    );

    const tableBody = document.querySelector(
        "#spread-table tbody"
    );

    if (!tableHead || !tableBody) {
        return;
    }

    tableHead.innerHTML = "";
    tableBody.innerHTML = "";

    if (!Array.isArray(data) || data.length === 0) {

        tableBody.innerHTML = `
            <tr>
                <td>
                    نمادی مطابق فیلترهای انتخاب‌شده پیدا نشد
                </td>
            </tr>
        `;

        return;
    }

    // دریافت سرستون‌ها از کلیدهای داده
    const headers = Object.keys(data[0]);

    // ساخت سرستون‌ها
    const headRow = document.createElement("tr");

    headers.forEach(header => {

        const th = document.createElement("th");

        let sortIcon = "";

        if (spreadCurrentSort.column === header) {

            if (spreadCurrentSort.direction === "desc") {
                sortIcon = " ▼";
            }

            if (spreadCurrentSort.direction === "asc") {
                sortIcon = " ▲";
            }
        }

        th.textContent = header + sortIcon;

        th.addEventListener("click", function () {
            sortSpreadTable(header);
        });

        headRow.appendChild(th);
    });

    tableHead.appendChild(headRow);

    // ساخت ردیف‌های جدول
    data.forEach((row, index) => {

        const tr = document.createElement("tr");

        const rowKey = getTableRowKey(
            "spread",
            row,
            index
        );

        applyRowSelection({
            tableName: "spread",
            tableSelector: "#spread-table",
            rowElement: tr,
            rowKey
        });

        headers.forEach(header => {

            const td = document.createElement("td");

            td.classList.add("number-cell");
            td.textContent = row[header] ?? "";

            tr.appendChild(td);
        });

        tableBody.appendChild(tr);
    });
}

function sortSpreadTable(column) {

    // اگر روی ستون جدید کلیک شده باشد، ابتدا نزولی مرتب می‌شود
    if (spreadCurrentSort.column !== column) {

        spreadCurrentSort = {
            column: column,
            direction: "desc"
        };

    } else if (spreadCurrentSort.direction === "desc") {

        // کلیک دوم: صعودی
        spreadCurrentSort.direction = "asc";

    } else {

        // کلیک سوم: بازگشت به ترتیب اولیه
        spreadCurrentSort = {
            column: null,
            direction: null
        };

        renderSpreadTable(spreadOriginalData);
        return;
    }

    const sortedData = [...spreadOriginalData];

    sortedData.sort((a, b) => {

        let valueA = normalizeSpreadSortValue(a[column]);
        let valueB = normalizeSpreadSortValue(b[column]);

        if (valueA < valueB) {
            return spreadCurrentSort.direction === "asc" ? -1 : 1;
        }

        if (valueA > valueB) {
            return spreadCurrentSort.direction === "asc" ? 1 : -1;
        }

        return 0;
    });

    renderSpreadTable(sortedData);
}

function normalizeSpreadSortValue(value) {

    if (value === null || value === undefined || value === "") {
        return "";
    }

    let normalizedValue = String(value).trim();

    // تبدیل ارقام فارسی به انگلیسی
    normalizedValue = normalizedValue.replace(
        /[۰-۹]/g,
        digit => "۰۱۲۳۴۵۶۷۸۹".indexOf(digit)
    );

    // تبدیل ارقام عربی به انگلیسی
    normalizedValue = normalizedValue.replace(
        /[٠-٩]/g,
        digit => "٠١٢٣٤٥٦٧٨٩".indexOf(digit)
    );

    // حذف کاما از اعداد
    normalizedValue = normalizedValue.replace(/,/g, "");

    // تشخیص تاریخ مانند 1405/05/20
    if (/^\d{4}\/\d{2}\/\d{2}$/.test(normalizedValue)) {

        return Number(
            normalizedValue.replace(/\//g, "")
        );
    }

    // تشخیص عدد
    if (
        normalizedValue !== "" &&
        !Number.isNaN(Number(normalizedValue))
    ) {
        return Number(normalizedValue);
    }

    // مقدار متنی
    return normalizedValue;
}

async function loadSpreadData() {

    const baseSymbols = getSelectedValues(
        "spread-base-symbol"
    );

    const tradeValue = document
        .getElementById("spread-value")
        .value
        .trim();

    const days = document
        .getElementById("spread-days")
        .value
        .trim();

    const applyButton = document.getElementById(
        "apply-spread-filter"
    );

    const calculateButton = document.getElementById(
        "calculate-spread-button"
    );

    const tableBody = document.querySelector(
        "#spread-table tbody"
    );

    if (baseSymbols.length === 0) {
        alert("لطفاً حداقل یک نماد پایه را انتخاب کنید.");
        return;
    }

    if (days && !spreadDaysFilterType) {
        alert(
            "برای تعداد روز تا سررسید، یکی از حالت‌های بالا، پایین یا مساوی را انتخاب کنید."
        );

        return;
    }


    try {

        // غیرفعال‌کردن دکمه هنگام دریافت اطلاعات
        if (applyButton) {
            applyButton.disabled = true;
            applyButton.textContent = "در حال دریافت...";
        }

        // غیرفعال‌کردن دکمه اسپرد تا پایان دریافت
        if (calculateButton) {
            calculateButton.disabled = true;
        }

        // پاک‌کردن محاسبات قبلی
        resetSpreadCalculationTable();

        // نمایش وضعیت بارگذاری در جدول اول
        if (tableBody) {
            tableBody.innerHTML = `
                <tr>
                    <td>
                       ... در حال دریافت اطلاعات
                    </td>
                </tr>
            `;
        }

        // ارسال درخواست به Flask
        /*
    برای هر نماد انتخاب‌شده یک درخواست ارسال می‌شود.
    نیازی به تغییر Flask نیست.
    */
    const requests = baseSymbols.map(
        async baseSymbol => {

            const parameters =
                new URLSearchParams();

            parameters.set(
                "base_symbol",
                baseSymbol
            );

            if (tradeValue) {
                parameters.set(
                    "value",
                    tradeValue
                );
            }

            if (days) {
                parameters.set(
                    "days",
                    days
                );

                parameters.set(
                    "days_operator",
                    spreadDaysFilterType
                );
            }

            const response = await fetch(
                `/spread-data?${parameters.toString()}`
            );

            const result =
                await response.json();

            if (!response.ok) {
                throw new Error(
                    result.error ||
                    `خطا در دریافت اطلاعات ${baseSymbol}`
                );
            }

            if (!Array.isArray(result)) {
                throw new Error(
                    `خروجی نماد ${baseSymbol} نامعتبر است.`
                );
            }

            return result;
        }
    );

    const results =
        await Promise.all(requests);

    /*
        ترکیب نتایج تمام نمادها
    */
    const mergedResults =
        results.flat();

    /*
        جلوگیری از ردیف تکراری بر اساس نماد اختیار
    */
    const result = [
        ...new Map(
            mergedResults.map(row => [
                row["نماد اختیار"],
                row
            ])
        ).values()
    ];

        // ذخیره اطلاعات جدول اول اسپرد
        spreadOriginalData = result;

        // ریست سورت جدول اول
        spreadCurrentSort = {
            column: null,
            direction: null
        };

        // نمایش جدول اول
        renderSpreadTable(
            spreadOriginalData
        );

        // فعال‌کردن دکمه اسپرد در صورت وجود حداقل دو نماد
        if (calculateButton) {
            calculateButton.disabled =
                spreadOriginalData.length < 2;
        }

    } catch (error) {

        console.error(
            "Load spread data error:",
            error
        );

        // پاک‌کردن اطلاعات قبلی
        spreadOriginalData = [];

        spreadCurrentSort = {
            column: null,
            direction: null
        };

        // نمایش خطا در جدول
        if (tableBody) {
            tableBody.innerHTML = `
                <tr>
                    <td>
                        ${escapeHtml(
                            error.message ||
                            "خطا در دریافت اطلاعات"
                        )}
                    </td>
                </tr>
            `;
        }

        if (calculateButton) {
            calculateButton.disabled = true;
        }

    } finally {

        if (applyButton) {
            applyButton.disabled = false;
            applyButton.textContent = "اعمال فیلتر";
        }
    }
}

document.querySelectorAll(".tab-btn").forEach(btn => {

    btn.addEventListener("click", function () {

        // حذف active از همه دکمه‌ها
        document.querySelectorAll(".tab-btn").forEach(b => 
            b.classList.remove("active")
        );

        // حذف active از همه تب‌ها
        document.querySelectorAll(".tab-content").forEach(tab => 
            tab.classList.remove("active")
        );

        // فعال کردن دکمه کلیک شده
        this.classList.add("active");

        // پیدا کردن تب مربوطه
        const tabId = this.dataset.tab;
        document.getElementById(tabId).classList.add("active");
    });

});

/* document.querySelectorAll('.arrow-buttons').forEach(group => {

    const buttons = group.querySelectorAll('button');

    buttons.forEach(btn => {
        btn.addEventListener('click', function () {

            // فقط همین گروه
            buttons.forEach(b => b.classList.remove('active'));

            this.classList.add('active');

            // تشخیص اینکه مربوط به کدوم فیلتره
            if (this.id.includes("value")) {
                valueFilterType = this.id.includes("up") ? "gt" : "lt";
            }

            if (this.id.includes("days")) {
                daysFilterType = this.id.includes("up") ? "gt" : "lt";
            }

            if (this.dataset.type) {
                daysFilterType = this.dataset.type;
            }

            console.log("Value:", valueFilterType, "Days:", daysFilterType);
        });
    });

});
*/


function parseSpreadNumber(value) {

    if (
        value === null ||
        value === undefined ||
        value === ""
    ) {
        return null;
    }

    let normalizedValue = String(value).trim();

    // تبدیل اعداد فارسی به انگلیسی
    normalizedValue = normalizedValue.replace(
        /[۰-۹]/g,
        digit => "۰۱۲۳۴۵۶۷۸۹".indexOf(digit)
    );

    // تبدیل اعداد عربی به انگلیسی
    normalizedValue = normalizedValue.replace(
        /[٠-٩]/g,
        digit => "٠١٢٣٤٥٦٧٨٩".indexOf(digit)
    );

    // حذف جداکننده هزارگان و درصد
    normalizedValue = normalizedValue
        .replace(/,/g, "")
        .replace(/٪|%/g, "")
        .trim();

    const numericValue = Number(normalizedValue);

    return Number.isFinite(numericValue)
        ? numericValue
        : null;
}

function roundSpreadNumber(value, digits = 2) {

    if (!Number.isFinite(value)) {
        return null;
    }

    const multiplier = 10 ** digits;

    return Math.round(
        (value + Number.EPSILON) * multiplier
    ) / multiplier;
}

function formatSpreadNumber(value, digits = 2) {

    if (!Number.isFinite(value)) {
        return "";
    }

    return value.toLocaleString("en-US", {
        minimumFractionDigits: 0,
        maximumFractionDigits: digits
    });
}

function calculateSpreadMetrics({
    buyStrike,
    sellStrike,

    buyOptionSellPrice,
    sellOptionBuyPrice,

    buyOptionSellVolume,
    sellOptionBuyVolume,

    baseLastPrice,
    daysRemaining
}) {

    /*
        حداکثر زیان:
        قیمت خرید نماد فروش
        منهای قیمت فروش نماد خرید
    */
    const maxLoss =
        sellOptionBuyPrice - buyOptionSellPrice;

    /*
        هزینه استراتژی
    */
    const strategyCost =
        buyOptionSellPrice - sellOptionBuyPrice;

    /*
        اهرم استراتژی
    */
    const strategyLeverage =
        strategyCost !== 0
            ? baseLastPrice / strategyCost
            : null;

    /*
        حداکثر سود
    */
    const maxProfit =
        (
            sellStrike - buyStrike
        ) + maxLoss;

    /*
        نسبت بازدهی به‌صورت اعشاری

        مثال:
        0.25 یعنی 25 درصد
    */
    const returnRate =
        maxLoss !== 0
            ? maxProfit / Math.abs(maxLoss)
            : null;

    /*
        بازدهی درصدی

        گردکردن در زمان نمایش انجام می‌شود.
    */
    const returnPercent =
        returnRate !== null
            ? returnRate * 100
            : null;

    /*
        ریوارد به ریسک قبلی
    */
    const riskToReward =
        maxLoss !== 0
            ? Math.abs(
                maxProfit / maxLoss
            )
            : null;

    /*
        قیمت سر به سر
    */
    const breakEvenPrice =
        buyStrike - maxLoss;

    /*
        فاصله تا سر به سر به‌صورت درصد

        Math.round حذف شده تا امکان نمایش
        یک رقم اعشار وجود داشته باشد.
    */
    const distanceToBreakEven =
        baseLastPrice !== 0
            ? (
                (
                    breakEvenPrice /
                    baseLastPrice
                ) - 1
            ) * 100
            : null;

    /*
        فاصله تا حداکثر سود به‌صورت درصد

        دارایی پایه تقسیم بر قیمت اعمال
        نماد فروش، منهای یک
    */
    const distanceToMaxProfit =
        sellStrike !== 0
            ? /*(*/
                (
                    baseLastPrice /
                    sellStrike
                /*) - 1*/
            ) /* * 100*/
            : null;

    /*
        حجم قابل معامله
    */
    const tradeableVolume =
        buyOptionSellVolume !== null &&
        sellOptionBuyVolume !== null
            ? Math.min(
                buyOptionSellVolume,
                sellOptionBuyVolume
            )
            : null;

    /*
        مبلغ
    */
    const amount =
        tradeableVolume !== null &&
        buyOptionSellPrice !== null
            ? (
                tradeableVolume *
                buyOptionSellPrice *
                1000
            )
            : null;

    /*
        YTM مطابق فرمول درخواستی:

        (1 + بازدهی اعشاری)
        به توان
        (365 / روز تا سررسید)
        ضرب در 100

        برای جلوگیری از خروجی NaN:
        - روز سررسید باید بیشتر از صفر باشد.
        - پایه توان باید مثبت باشد.
    */
    const ytmBase =
        returnRate !== null
            ? 1 + returnRate
            : null;

    const ytm =
        ytmBase !== null &&
        ytmBase > 0 &&
        daysRemaining !== null &&
        daysRemaining > 0
            ? (Math.pow(
                ytmBase,
                30 / daysRemaining
            ) - 1 ) * 100
            : null;

    return {
        maxLoss,
        maxProfit,

        riskToReward,

        returnRate,
        returnPercent,
        ytm,

        breakEvenPrice,
        distanceToBreakEven,
        distanceToMaxProfit,

        tradeableVolume,
        amount,
        strategyLeverage
    };
}
function calculateSpreadTable() {

    if (
        !Array.isArray(spreadOriginalData) ||
        spreadOriginalData.length < 2
    ) {
        alert(
            "برای محاسبه اسپرد حداقل دو نماد باید از فیلتر عبور کنند."
        );

        return;
    }

    /*
        گروه‌بندی نمادها بر اساس تاریخ سررسید
    */
    /*
        گروه‌بندی بر اساس دو شرط:

        1. تاریخ سررسید یکسان
        2. نماد پایه یکسان

        بنابراین قراردادهای مربوط به دو دارایی پایه مختلف
        هیچ‌وقت در یک اسپرد قرار نمی‌گیرند.
    */
    const expiryGroups = new Map();

    spreadOriginalData.forEach(row => {

        const expiryDate = String(
            row["تاریخ سررسید"] ?? ""
        ).trim();

        const baseSymbol = String(
            row["نماد پایه"] ?? ""
        ).trim();

        const strikePrice = parseSpreadNumber(
            row["قیمت اعمال"]
        );

        /*
            ردیف‌هایی که اطلاعات ضروری ندارند
            وارد محاسبات نمی‌شوند.
        */
        if (
            !expiryDate ||
            !baseSymbol ||
            strikePrice === null
        ) {
            return;
        }

        /*
            کلید هر گروه از ترکیب نماد پایه
            و تاریخ سررسید ساخته می‌شود.
        */
        const groupKey =
            `${baseSymbol}|||${expiryDate}`;

        if (!expiryGroups.has(groupKey)) {

            expiryGroups.set(groupKey, {
                baseSymbol,
                expiryDate,
                rows: []
            });
        }

        expiryGroups
            .get(groupKey)
            .rows
            .push(row);
    });

    const calculatedRows = [];

    /*
        مرتب‌سازی خود گروه‌های سررسید بر اساس تاریخ
    */
    const sortedExpiryGroups = [
        ...expiryGroups.values()
    ].sort((groupA, groupB) => {

        /*
            ابتدا نمادهای پایه کنار یکدیگر قرار می‌گیرند.
        */
        const baseComparison =
            groupA.baseSymbol.localeCompare(
                groupB.baseSymbol,
                "fa"
            );

        if (baseComparison !== 0) {
            return baseComparison;
        }

        /*
            داخل هر نماد پایه، سررسیدها
            از نزدیک‌ترین به دورترین مرتب می‌شوند.
        */
        const dateA = Number(
            groupA.expiryDate.replace(/\//g, "")
        );

        const dateB = Number(
            groupB.expiryDate.replace(/\//g, "")
        );

        return dateA - dateB;
    });

    sortedExpiryGroups.forEach(group => {

        const {
            baseSymbol,
            expiryDate,
            rows: groupRows
        } = group;

        /*
            حداقل دو قرارداد از یک نماد پایه
            و یک سررسید برای تشکیل اسپرد لازم است.
        */
        if (groupRows.length < 2) {
            return;
        }

        const daysRemaining = parseSpreadNumber(
            groupRows[0]["روز باقی‌مانده"]
        );

            /*
                مرتب‌سازی قیمت اعمال به‌صورت نزولی:
                بالاترین قیمت اعمال در ابتدای آرایه
                و پایین‌ترین در انتهای آرایه.
            */
            const sortedByStrikeDescending = [
                ...groupRows
            ].sort((rowA, rowB) => {

                const strikeA = parseSpreadNumber(
                    rowA["قیمت اعمال"]
                );

                const strikeB = parseSpreadNumber(
                    rowB["قیمت اعمال"]
                );

                return strikeB - strikeA;
            });

            /*
                چون نماد خرید باید کمترین قیمت اعمال
                را داشته باشد، پیمایش خرید از انتهای
                آرایه نزولی شروع می‌شود.
            */
            for (
                let buyIndex =
                    sortedByStrikeDescending.length - 1;

                buyIndex >= 1;

                buyIndex--
            ) {

                const buyRow =
                    sortedByStrikeDescending[buyIndex];

                const buySymbol =
                    buyRow["نماد اختیار"];

                const buyBaseSymbol = String(
                    buyRow["نماد پایه"] ?? ""
                ).trim();

                const buyStrike = parseSpreadNumber(
                    buyRow["قیمت اعمال"]
                );

                /*
                 چون این نماد در ستون خرید قرار دارد،
                 برای خرید آن باید از قیمت فروش بازار استفاده کنیم.
                */
                const buyOptionSellPrice = parseSpreadNumber(
                    buyRow["قیمت فروش"]
                );

                /*
                    حجم قابل خرید از این نماد،
                    همان حجم فروش موجود در سرخط فروش است.
                */
                const buyOptionSellVolume = parseSpreadNumber(
                    buyRow["حجم فروش"]
                );

                const baseLastPrice = parseSpreadNumber(
                    buyRow["آخرین قیمت نماد پایه"]
                );

                if (
                    buyStrike === null ||
                    buyOptionSellPrice === null ||
                    baseLastPrice === null
                ) {
                    continue;
                }

                /*
                    نمادهای قبل از buyIndex همگی
                    قیمت اعمال بالاتری دارند.
                */
                for (
                    let sellIndex = 0;

                    sellIndex < buyIndex;

                    sellIndex++
                ) {

                    const sellRow =
                        sortedByStrikeDescending[
                            sellIndex
                        ];

                    const sellSymbol =
                        sellRow["نماد اختیار"];

                    const sellBaseSymbol = String(
                        sellRow["نماد پایه"] ?? ""
                    ).trim();

                    const sellStrike =
                        parseSpreadNumber(
                            sellRow["قیمت اعمال"]
                        );

                    /*
                        چون این نماد در ستون فروش قرار دارد،
                        برای فروش آن باید از قیمت خرید بازار استفاده کنیم.
                    */
                    const sellOptionBuyPrice =
                        parseSpreadNumber(
                            sellRow["قیمت خرید"]
                        );

                    /*
                        حجم قابل فروش از این نماد،
                        همان حجم خرید موجود در سرخط خرید است.
                    */
                    const sellOptionBuyVolume =
                        parseSpreadNumber(
                            sellRow["حجم خرید"]
                        );

                    if (
                        sellStrike === null ||
                        sellOptionBuyPrice === null
                    ) {
                        continue;
                    }

                    /*
                        فقط قیمت اعمال بالاتر به‌عنوان
                        نماد فروش پذیرفته می‌شود.
                        این شرط نمادهای دارای قیمت
                        اعمال مساوی را حذف می‌کند.
                    */
                    if (sellStrike <= buyStrike) {
                        continue;
                    }
                    /*
                        جلوگیری قطعی از ترکیب قراردادهای
                        مربوط به دو دارایی پایه متفاوت
                    */
                    if (
                        !buyBaseSymbol ||
                        !sellBaseSymbol ||
                        buyBaseSymbol !== sellBaseSymbol
                    ) {
                        continue;
                    }
                    const metrics =
                        calculateSpreadMetrics({
                            buyStrike,
                            sellStrike,

                            buyOptionSellPrice,
                            sellOptionBuyPrice,

                            buyOptionSellVolume,
                            sellOptionBuyVolume,

                            baseLastPrice,
                            daysRemaining
                        });
                    /*
                        حذف ترکیب دارای حداکثر سود منفی
                    */
                    if (
                        metrics.maxProfit === null ||
                        !Number.isFinite(metrics.maxProfit) ||
                        metrics.maxProfit < 0
                    ) {
                        continue;
                    }
                    calculatedRows.push({

                        /*
                            اضافه‌شدن تاریخ سررسید برای
                            تشخیص دسته‌ها ضروری است.
                        */
                        "روز تا سررسید":
                            daysRemaining !== null
                                ? daysRemaining
                                : "",

                        "خرید":
                            buySymbol,

                        "فروش":
                            sellSymbol,

                        /*
                            قیمت فروش نمادی که در ستون خرید است
                        */
                        "قیمت فروش نماد خرید":
                            formatSpreadNumber(
                                buyOptionSellPrice
                            ),

                        /*
                            قیمت خرید نمادی که در ستون فروش است
                        */
                        "قیمت خرید نماد فروش":
                            formatSpreadNumber(
                                sellOptionBuyPrice
                            ),

                        "اهرم استراتژی":
                            metrics.strategyLeverage !== null
                                ? formatSpreadNumber(
                                    metrics.strategyLeverage,
                                    2
                                )
                                : "",

                        "حداکثر زیان":
                            formatSpreadNumber(
                                metrics.maxLoss
                            ),

                        "حداکثر سود":
                            formatSpreadNumber(
                                metrics.maxProfit
                            ),

                        // "بازدهی ٪":
                        //     metrics.returnPercent !== null
                        //         ? formatSpreadNumber(
                        //             metrics.returnPercent,
                        //             0
                        //         )
                        //         : "",

                        "YTM ماهانه ٪":
                            metrics.ytm !== null
                                ? formatSpreadNumber(
                                    metrics.ytm,
                                    1
                                )
                                : "",

                        "  ریوارد به ریسک":
                            metrics.riskToReward !== null
                                ? formatSpreadNumber(
                                    metrics.riskToReward,
                                    4
                                )
                                : "",

                        // "قیمت سر به سر":
                        //     formatSpreadNumber(
                        //         metrics.breakEvenPrice
                        //     ),

                        "فاصله تا سر به سر %":
                            metrics.distanceToBreakEven !== null
                                ? formatSpreadNumber(
                                    metrics.distanceToBreakEven,
                                    1
                                )
                                : "",

                        "فاصله تا حداکثر سود %":
                            metrics.distanceToMaxProfit !== null
                                ? formatSpreadNumber(
                                    metrics.distanceToMaxProfit,
                                    3
                                )
                                : "",

                        "حجم قابل معامله":
                            metrics.tradeableVolume !== null
                                ? formatSpreadNumber(
                                    metrics.tradeableVolume,
                                    0
                                )
                                : "",

                        "مبلغ":
                            metrics.amount !== null
                                ? formatSpreadNumber(
                                    metrics.amount,
                                    0
                                )
                                : ""
                    });
                }
            }
        }
    );

    spreadCalculationOriginalData =
        calculatedRows;

    spreadCalculationSort = {
        column: null,
        direction: null
    };

    renderSpreadCalculationTable(
        spreadCalculationOriginalData
    );

    if (calculatedRows.length === 0) {
        alert(
            "هیچ دو نمادی با تاریخ سررسید مشترک و قیمت اعمال متفاوت پیدا نشد."
        );
    }
}

function renderSpreadCalculationTable(data) {

    const tableHead = document.querySelector(
        "#spread-calculation-table thead"
    );

    const tableBody = document.querySelector(
        "#spread-calculation-table tbody"
    );

    if (!tableHead || !tableBody) {
        return;
    }

    tableHead.innerHTML = "";
    tableBody.innerHTML = "";

    if (
        !Array.isArray(data) ||
        data.length === 0
    ) {
        tableBody.innerHTML = `
            <tr>
                <td>
                    ترکیب اسپردی مطابق شرایط موجود نیست.
                </td>
            </tr>
        `;

        return;
    }

    /*
        سرستون‌ها مستقیماً از خروجی محاسبات
        دریافت می‌شوند.
    */
    const headers = Object.keys(data[0]);

    const headRow =
        document.createElement("tr");

    headers.forEach(header => {

        const th =
            document.createElement("th");

        let sortIcon = "";

        if (
            spreadCalculationSort.column === header
        ) {

            if (
                spreadCalculationSort.direction ===
                "desc"
            ) {
                sortIcon = " ▼";
            }

            if (
                spreadCalculationSort.direction ===
                "asc"
            ) {
                sortIcon = " ▲";
            }
        }

        th.textContent =
            header + sortIcon;

        th.addEventListener(
            "click",
            function () {
                sortSpreadCalculationTable(
                    header
                );
            }
        );

        headRow.appendChild(th);
    });

    tableHead.appendChild(headRow);

    data.forEach((row, index) => {

        const tr = document.createElement("tr");

        const rowKey = getTableRowKey(
            "spreadCalculation",
            row,
            index
        );

        applyRowSelection({
            tableName: "spreadCalculation",
            tableSelector: "#spread-calculation-table",
            rowElement: tr,
            rowKey
        });

        headers.forEach(header => {

            const td = document.createElement("td");

            td.classList.add("number-cell");
            td.textContent = row[header] ?? "";

            tr.appendChild(td);
        });

        tableBody.appendChild(tr);
    });
}

function sortSpreadCalculationTable(column) {

    /*
        کلیک اول: نزولی
        کلیک دوم: صعودی
        کلیک سوم: ترتیب اولیه
    */
    if (
        spreadCalculationSort.column !== column
    ) {

        spreadCalculationSort = {
            column: column,
            direction: "desc"
        };

    } else if (
        spreadCalculationSort.direction === "desc"
    ) {

        spreadCalculationSort.direction =
            "asc";

    } else {

        spreadCalculationSort = {
            column: null,
            direction: null
        };

        renderSpreadCalculationTable(
            spreadCalculationOriginalData
        );

        return;
    }

    const sortedData = [
        ...spreadCalculationOriginalData
    ];

    sortedData.sort((rowA, rowB) => {

        let valueA =
            normalizeSpreadSortValue(
                rowA[column]
            );

        let valueB =
            normalizeSpreadSortValue(
                rowB[column]
            );

        /*
            قراردادن مقادیر خالی در انتهای جدول
        */
        const emptyA =
            valueA === "" ||
            valueA === null ||
            valueA === undefined;

        const emptyB =
            valueB === "" ||
            valueB === null ||
            valueB === undefined;

        if (emptyA && emptyB) {
            return 0;
        }

        if (emptyA) {
            return 1;
        }

        if (emptyB) {
            return -1;
        }

        if (valueA < valueB) {
            return (
                spreadCalculationSort.direction ===
                "asc"
            ) ? -1 : 1;
        }

        if (valueA > valueB) {
            return (
                spreadCalculationSort.direction ===
                "asc"
            ) ? 1 : -1;
        }

        return 0;
    });

    renderSpreadCalculationTable(
        sortedData
    );
}

function resetSpreadCalculationTable() {

    spreadCalculationOriginalData = [];

    spreadCalculationSort = {
        column: null,
        direction: null
    };

    const tableHead = document.querySelector(
        "#spread-calculation-table thead"
    );

    const tableBody = document.querySelector(
        "#spread-calculation-table tbody"
    );

    if (tableHead) {
        tableHead.innerHTML = "";
    }

    if (tableBody) {
        tableBody.innerHTML = `
            <tr>
                <td>
                    برای محاسبه مجدد، دکمه اسپرد را بزنید
                </td>
            </tr>
        `;
    }
}

document.addEventListener(
    "DOMContentLoaded",
    function () {

        // ساخت فوری dropdown نمادها
        populateBaseSymbolDropdown();

        // دریافت اطلاعات جدول بازار
        loadData();
    }
);