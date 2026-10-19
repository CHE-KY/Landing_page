/* =========================================================
   MOLDMATE - Shared JavaScript
   ใช้ร่วมกันใน product.html, order.html และ admin.html
   ========================================================= */

/*
 * จุดตั้งค่า:
 * 1) APPS_SCRIPT_URL: URL ของ Google Apps Script Web App
 * 2) CSV_URL: URL ของ Google Sheets ที่เผยแพร่เป็น CSV
 *
 * หากเปลี่ยน Web App หรือชีต ให้แก้ URL ในตัวแปรด้านล่าง
 */
const APPS_SCRIPT_URL =
  "https://script.google.com/macros/s/AKfycbzGT2p-6GPs3HrTYz8aSriiw6rYmE55UNlDjKM1WudbOYSKX2bz74ZnewgVxNc2a3M_AA/exec";

const CSV_URL =
  "https://docs.google.com/spreadsheets/d/e/2PACX-1vSuCcG6FrMEVLA7uY7oRLRqcdRvXuNaplz2GwlsGs35HHvnbHdRF-kGkeIFuYK0Rjmm82nCwUDv7OjM/pub?gid=0&single=true&output=csv";

const PRODUCTS_URL = "products.json";

document.addEventListener("DOMContentLoaded", () => {
  if (hasProductPageElements()) {
    initProductPage();
  }

  if (hasOrderPageElements()) {
    initOrderPage();
  }

  if (hasAdminPageElements()) {
    initAdminPage();
  }
});

/* =========================================================
   Shared helpers
   ========================================================= */

function hasProductPageElements() {
  return Boolean(
    document.querySelector(
      "#productsGrid, #productGrid, .product-grid, [data-products-grid]"
    )
  );
}

function hasOrderPageElements() {
  return Boolean(
    document.querySelector("#items") &&
    document.querySelector("#total")
  );
}

function hasAdminPageElements() {
  return Boolean(document.querySelector("#ordersTable tbody"));
}

async function loadProducts() {
  const response = await fetch(PRODUCTS_URL, { cache: "no-store" });

  if (!response.ok) {
    throw new Error(`โหลด ${PRODUCTS_URL} ไม่สำเร็จ (${response.status})`);
  }

  const products = await response.json();

  if (!Array.isArray(products)) {
    throw new Error("รูปแบบ products.json ไม่ถูกต้อง");
  }

  return products;
}

function formatBaht(value) {
  const amount = Number(value);

  if (!Number.isFinite(amount)) {
    return "—";
  }

  return new Intl.NumberFormat("th-TH", {
    style: "currency",
    currency: "THB",
    maximumFractionDigits: 2
  }).format(amount);
}

function setStatusMessage(container, message, className = "notice") {
  if (!container) return;

  container.textContent = message;
  container.className = className;
  container.hidden = false;
}

function clearStatusMessage(container) {
  if (!container) return;

  container.textContent = "";
  container.hidden = true;
}

/* =========================================================
   1. product.html - Product list and filters
   ========================================================= */

function initProductPage() {
  const grid = document.querySelector(
    "#productsGrid, #productGrid, .product-grid, [data-products-grid]"
  );

  if (!grid) return;

  const status = document.querySelector(
    "#productsStatus, #productStatus, [data-products-status]"
  );

  const filterButtons = Array.from(
    document.querySelectorAll(
      "[data-category-filter], .filter-button[data-category]"
    )
  );

  let allProducts = [];

  loadProducts()
    .then((products) => {
      allProducts = products;
      applyInitialCategory();
    })
    .catch((error) => {
      console.error("โหลดรายการสินค้าไม่สำเร็จ:", error);
      setStatusMessage(
        status || createStatusElement(grid),
        "ไม่สามารถโหลดรายการสินค้าได้ กรุณาลองใหม่อีกครั้ง"
      );
    });

  function applyInitialCategory() {
    const params = new URLSearchParams(window.location.search);
    const requestedCategory = normalizeCategoryParameter(
      params.get("category")
    );

    if (requestedCategory) {
      setActiveFilter(requestedCategory);
      renderProducts(filterProducts(allProducts, requestedCategory));
    } else {
      setActiveFilter("all");
      renderProducts(allProducts);
    }
  }

  function normalizeCategoryParameter(value) {
    if (!value) return "all";

    const normalized = value.trim().toLowerCase();
    const mapping = {
      all: "all",
      bathroom: "Bathroom Care",
      "bathroom-care": "Bathroom Care",
      wall: "Wall Care",
      "wall-care": "Wall Care",
      furniture: "Furniture Care",
      "furniture-care": "Furniture Care",
      home: "Home Care",
      "home-care": "Home Care",
      specialist: "Specialist"
    };

    if (mapping[normalized]) return mapping[normalized];

    const exactCategory = allProducts.find(
      (product) => String(product.category).toLowerCase() === normalized
    );

    return exactCategory ? exactCategory.category : "all";
  }

  function filterProducts(products, category) {
    if (!category || category === "all") return products;

    if (category === "Specialist") {
      return products.filter(
        (product) =>
          product.usageType === "specialist" ||
          ["Grout Care", "Painted Surface"].includes(product.category)
      );
    }

    return products.filter((product) => product.category === category);
  }

  function setActiveFilter(category) {
    filterButtons.forEach((button) => {
      const buttonCategory = getButtonCategory(button);
      const isActive = buttonCategory === category;

      button.classList.toggle("is-active", isActive);
      button.setAttribute("aria-pressed", String(isActive));
    });
  }

  function getButtonCategory(button) {
    const rawValue =
      button.dataset.categoryFilter ??
      button.dataset.category ??
      button.value ??
      "";

    const normalized = rawValue.trim().toLowerCase();

    const aliases = {
      "": "all",
      all: "all",
      "ทั้งหมด": "all",
      bathroom: "Bathroom Care",
      "bathroom care": "Bathroom Care",
      "bathroom-care": "Bathroom Care",
      wall: "Wall Care",
      "wall care": "Wall Care",
      "wall-care": "Wall Care",
      furniture: "Furniture Care",
      "furniture care": "Furniture Care",
      "furniture-care": "Furniture Care",
      home: "Home Care",
      "home care": "Home Care",
      "home-care": "Home Care",
      specialist: "Specialist"
    };

    return aliases[normalized] || rawValue;
  }

  filterButtons.forEach((button) => {
    button.addEventListener("click", () => {
      const category = getButtonCategory(button);
      setActiveFilter(category);
      renderProducts(filterProducts(allProducts, category));

      const url = new URL(window.location.href);
      if (category === "all") {
        url.searchParams.delete("category");
      } else {
        const categoryParam = {
          "Bathroom Care": "bathroom",
          "Wall Care": "wall",
          "Furniture Care": "furniture",
          "Home Care": "home",
          Specialist: "specialist"
        };
        url.searchParams.set(
          "category",
          categoryParam[category] || category
        );
      }

      window.history.replaceState({}, "", url);
    });
  });

  function renderProducts(products) {
    grid.replaceChildren();

    if (!products.length) {
      setStatusMessage(
        status || createStatusElement(grid),
        "ไม่พบสินค้าที่ตรงกับประเภทที่เลือก"
      );
      return;
    }

    clearStatusMessage(status);

    products.forEach((product) => {
      const card = document.createElement("article");
      card.className = "product-card";
      card.dataset.category = String(product.category || "");

      const media = document.createElement("div");
      media.className = "product-card-media";

      const image = document.createElement("img");
      image.className = "product-card-image";
      image.src = String(product.image || "");
      image.alt = String(product.name || "MOLDMATE product");
      image.loading = "lazy";
      image.addEventListener("error", () => {
        image.alt = `${String(product.name || "สินค้า")} (ไม่พบไฟล์รูปภาพ)`;
        image.removeAttribute("src");
        media.classList.add("image-unavailable");
      });
      media.append(image);

      const body = document.createElement("div");
      body.className = "product-card-body";

      const category = document.createElement("p");
      category.className = "product-card-category";
      category.textContent = String(product.category || "");

      const badge = document.createElement("span");
      badge.className = `product-badge product-badge--${safeUsageType(
        product.usageType
      )}`;
      badge.textContent = usageTypeLabel(product.usageType);

      const title = document.createElement("h3");
      title.className = "product-card-title";
      title.textContent = String(product.name || "");

      const description = document.createElement("p");
      description.className = "product-card-description";
      description.textContent = String(product.description || "");

      const meta = document.createElement("div");
      meta.className = "product-card-meta";

      const size = document.createElement("span");
      size.className = "product-size";
      size.textContent = String(product.size || "");

      const price = document.createElement("span");
      price.className = "product-price";
      price.textContent = formatBaht(product.price);

      meta.append(size, price);

      const orderLink = document.createElement("a");
      orderLink.className = "btn btn-primary btn-block";
      orderLink.textContent = "สั่งซื้อ";
      orderLink.href = buildOrderUrl(product);

      body.append(category, badge, title, description, meta, orderLink);
      card.append(media, body);
      grid.append(card);
    });
  }
}

function safeUsageType(value) {
  const allowed = new Set(["trial", "standard", "specialist"]);
  return allowed.has(value) ? value : "trial";
}

function usageTypeLabel(value) {
  const labels = {
    trial: "Trial",
    standard: "Standard",
    specialist: "Specialist"
  };

  return labels[value] || "Product";
}

function buildOrderUrl(product) {
  const params = new URLSearchParams();
  const itemName = `${String(product.name || "")} ${String(
    product.size || ""
  )}`.trim();

  params.set("item", itemName);
  params.set("price", String(product.price ?? ""));
  if (product.id) params.set("productId", String(product.id));

  return `order.html?${params.toString()}`;
}

function createStatusElement(referenceElement) {
  const status = document.createElement("p");
  status.className = "notice";
  status.setAttribute("role", "status");
  status.setAttribute("aria-live", "polite");

  const parent = referenceElement.parentElement || document.body;
  parent.insertBefore(status, referenceElement);
  return status;
}

/* =========================================================
   2. order.html - Prefill, validate and submit an order
   ========================================================= */

function initOrderPage() {
  const itemsField = document.querySelector("#items");
  const totalField = document.querySelector("#total");

  if (!itemsField || !totalField) return;

  const form =
    document.querySelector("#orderForm") ||
    itemsField.closest("form") ||
    totalField.closest("form");

  const customerNameField = document.querySelector("#customerName");
  const contactField = document.querySelector("#contact");
  const noteField = document.querySelector("#note");
  const submitButton =
    (form && form.querySelector('[type="submit"]')) ||
    document.querySelector("#submitOrder");

  const params = new URLSearchParams(window.location.search);
  const requestedItem = params.get("item");
  const requestedPrice = params.get("price");
  const requestedProductId = params.get("productId");

  let matchedProduct = null;

  if (requestedItem) itemsField.value = requestedItem;
  if (requestedPrice !== null && totalField.value === "") {
    totalField.value = requestedPrice;
  }

  // ตรวจสอบสินค้าและราคาอ้างอิงจาก products.json ไม่เชื่อราคาใน URL
  if (requestedItem || requestedProductId) {
    loadProducts()
      .then((products) => {
        matchedProduct = products.find(
          (product) =>
            requestedProductId &&
            String(product.id) === String(requestedProductId)
        );

        if (!matchedProduct && requestedItem) {
          const normalizedItem = normalizeItemName(requestedItem);
          matchedProduct = products.find((product) => {
            const fullName = normalizeItemName(
              `${product.name} ${product.size}`
            );
            return (
              normalizedItem === fullName ||
              normalizedItem === normalizeItemName(product.name)
            );
          });
        }

        if (matchedProduct) {
          itemsField.value = `${matchedProduct.name} ${matchedProduct.size}`;
          totalField.value = String(matchedProduct.price);
          totalField.dataset.priceVerified = "true";
          totalField.dataset.productId = String(matchedProduct.id);
        } else {
          totalField.dataset.priceVerified = "false";
        }
      })
      .catch((error) => {
        console.error("ตรวจสอบข้อมูลสินค้าไม่สำเร็จ:", error);
        totalField.dataset.priceVerified = "false";
      });
  }

  if (!form) {
    console.warn(
      "ไม่พบฟอร์มคำสั่งซื้อ (#orderForm หรือ form ที่ครอบ #items/#total)"
    );
    return;
  }

  let isSubmitting = false;

  form.addEventListener("submit", async (event) => {
    event.preventDefault();

    if (isSubmitting) return;

    const customerName = customerNameField
      ? customerNameField.value.trim()
      : "";
    const contact = contactField ? contactField.value.trim() : "";
    const items = itemsField.value.trim();
    const totalText = totalField.value.trim();
    const total = Number(totalText);
    const note = noteField ? noteField.value.trim() : "";

    if (!customerName || !contact || !items || !totalText) {
      alert("กรุณากรอกชื่อลูกค้า ช่องทางติดต่อ รายการสินค้า และจำนวนเงินให้ครบถ้วน");
      return;
    }

    if (!Number.isFinite(total) || total < 0) {
      alert("กรุณาระบุจำนวนเงินให้ถูกต้อง");
      totalField.focus();
      return;
    }

    // หากเป็นสินค้าที่อยู่ใน products.json ให้ใช้ราคาอ้างอิงจากไฟล์นั้น
    if (matchedProduct) {
      totalField.value = String(matchedProduct.price);
    } else if (
      params.has("productId") ||
      params.has("item") ||
      params.has("price")
    ) {
      alert(
        "ไม่สามารถยืนยันสินค้าและราคาจากรายการสินค้าได้ กรุณากลับไปเลือกสินค้าจากหน้ารายการสินค้าอีกครั้ง"
      );
      return;
    }

    const payload = {
      customerName,
      contact,
      items,
      total: Number(totalField.value),
      note
    };

    isSubmitting = true;
    if (submitButton) {
      submitButton.disabled = true;
      submitButton.dataset.originalText =
        submitButton.textContent || "ยืนยันสั่งซื้อ";
      submitButton.textContent = "กำลังส่งคำสั่งซื้อ...";
    }

    try {
      await fetch(APPS_SCRIPT_URL, {
        method: "POST",
        body: JSON.stringify(payload)
      });

      // ตามข้อกำหนด: เปลี่ยนหน้าเมื่อ fetch ได้รับการตอบกลับ
      // การตอบกลับ HTTP ที่เป็น error อาจไม่ทำให้ fetch reject
      window.location.href = "thankyou.html";
    } catch (error) {
      console.error(error);
      alert("เกิดข้อผิดพลาด กรุณาลองใหม่อีกครั้ง");

      isSubmitting = false;
      if (submitButton) {
        submitButton.disabled = false;
        submitButton.textContent =
          submitButton.dataset.originalText || "ยืนยันสั่งซื้อ";
      }
    }
  });
}

function normalizeItemName(value) {
  return String(value || "")
    .trim()
    .replace(/\s+/g, " ")
    .toLowerCase();
}

/* =========================================================
   3. admin.html - Load and render published CSV orders
   ========================================================= */

function initAdminPage() {
  const tbody = document.querySelector("#ordersTable tbody");
  if (!tbody) return;

  const table = document.querySelector("#ordersTable");
  const status =
    document.querySelector("#ordersStatus, #adminStatus") ||
    createStatusElement(table || tbody);

  loadOrdersCsv()
    .then((orders) => {
      tbody.replaceChildren();

      if (!orders.length) {
        setStatusMessage(status, "ยังไม่มีรายการสั่งซื้อ");
        return;
      }

      clearStatusMessage(status);

      orders
        .sort((a, b) => compareOrderDates(b.date, a.date))
        .forEach((order) => {
          const row = document.createElement("tr");

          [
            order.date,
            order.customerName,
            order.contact,
            order.items,
            formatBaht(order.total),
            order.note
          ].forEach((value) => {
            const cell = document.createElement("td");
            cell.textContent = value == null ? "" : String(value);
            row.append(cell);
          });

          tbody.append(row);
        });
    })
    .catch((error) => {
      console.error("โหลดข้อมูลคำสั่งซื้อไม่สำเร็จ:", error);
      tbody.replaceChildren();
      setStatusMessage(
        status,
        "ไม่สามารถโหลดรายการคำสั่งซื้อได้ กรุณาตรวจสอบ URL และการเผยแพร่ CSV"
      );
    });
}

async function loadOrdersCsv() {
  const response = await fetch(CSV_URL, { cache: "no-store" });

  if (!response.ok) {
    throw new Error(`โหลด CSV ไม่สำเร็จ (${response.status})`);
  }

  const csvText = await response.text();
  const rows = parseCsv(csvText).filter((row) =>
    row.some((cell) => String(cell).trim() !== "")
  );

  if (!rows.length) return [];

  const headerInfo = detectCsvHeader(rows[0]);
  let dataRows;
  let columnMap;

  if (headerInfo.hasHeader) {
    columnMap = headerInfo.columnMap;
    dataRows = rows.slice(1);
  } else {
    // กรณี CSV ไม่มีหัวตาราง ใช้ลำดับคอลัมน์ที่กำหนดไว้:
    // วันเวลา, ชื่อลูกค้า, ช่องทางติดต่อ, รายการสินค้า, จำนวนเงิน, หมายเหตุ
    columnMap = {
      date: 0,
      customerName: 1,
      contact: 2,
      items: 3,
      total: 4,
      note: 5
    };
    dataRows = rows;
  }

  return dataRows
    .filter((row) => row.some((cell) => String(cell).trim() !== ""))
    .map((row) => ({
      date: getCsvCell(row, columnMap.date),
      customerName: getCsvCell(row, columnMap.customerName),
      contact: getCsvCell(row, columnMap.contact),
      items: getCsvCell(row, columnMap.items),
      total: parseAmount(getCsvCell(row, columnMap.total)),
      note: getCsvCell(row, columnMap.note)
    }));
}

/**
 * CSV parser ที่รองรับ:
 * - comma ภายในค่าที่ครอบด้วย double quote
 * - double quote ที่ escape ด้วย double double-quote ("")
 * - line break ภายใน quoted field
 */
function parseCsv(text) {
  const rows = [];
  let row = [];
  let field = "";
  let insideQuotes = false;

  for (let i = 0; i < text.length; i += 1) {
    const char = text[i];
    const nextChar = text[i + 1];

    if (char === '"') {
      if (insideQuotes && nextChar === '"') {
        field += '"';
        i += 1;
      } else {
        insideQuotes = !insideQuotes;
      }
    } else if (char === "," && !insideQuotes) {
      row.push(field);
      field = "";
    } else if ((char === "\n" || char === "\r") && !insideQuotes) {
      if (char === "\r" && nextChar === "\n") i += 1;

      row.push(field);
      rows.push(row);
      row = [];
      field = "";
    } else {
      field += char;
    }
  }

  row.push(field);
  if (row.some((cell) => cell !== "") || rows.length === 0) {
    rows.push(row);
  }

  return rows.map((cells) =>
    cells.map((cell, index) => {
      let value = cell;
      if (index === 0) value = value.replace(/^\uFEFF/, "");
      return value.trim();
    })
  );
}

function detectCsvHeader(firstRow) {
  const normalized = firstRow.map(normalizeHeader);
  const aliases = {
    date: [
      "timestamp",
      "datetime",
      "date",
      "orderdate",
      "orderdatetime",
      "วันเวลาที่รับคำสั่งซื้อ",
      "วันเวลา",
      "วันที่",
      "เวลา"
    ],
    customerName: [
      "customername",
      "name",
      "customer",
      "ชื่อลูกค้า",
      "ชื่อ"
    ],
    contact: [
      "contact",
      "phone",
      "telephone",
      "line",
      "เบอร์โทรศัพท์",
      "เบอร์โทร",
      "ช่องทางติดต่อ"
    ],
    items: [
      "items",
      "item",
      "product",
      "products",
      "รายการสินค้า",
      "สินค้า"
    ],
    total: [
      "total",
      "amount",
      "price",
      "grandtotal",
      "จำนวนเงินรวม",
      "จำนวนเงิน",
      "ยอดรวม",
      "ราคา"
    ],
    note: ["note", "notes", "remark", "remarks", "หมายเหตุ"]
  };

  const columnMap = {};
  Object.entries(aliases).forEach(([fieldName, possibleNames]) => {
    const index = normalized.findIndex((header) =>
      possibleNames.includes(header)
    );
    if (index !== -1) columnMap[fieldName] = index;
  });

  const recognizedCount = Object.keys(columnMap).length;
  const hasHeader =
    recognizedCount >= 2 &&
    (columnMap.date !== undefined ||
      columnMap.customerName !== undefined ||
      columnMap.items !== undefined);

  if (!hasHeader) {
    return { hasHeader: false, columnMap: null };
  }

  // หากมีหัวตารางแต่ขาดบางคอลัมน์ ให้ใช้ลำดับมาตรฐานเป็น fallback
  const defaults = {
    date: 0,
    customerName: 1,
    contact: 2,
    items: 3,
    total: 4,
    note: 5
  };

  Object.keys(defaults).forEach((key) => {
    if (columnMap[key] === undefined) {
      columnMap[key] = defaults[key];
    }
  });

  return { hasHeader: true, columnMap };
}

function normalizeHeader(value) {
  return String(value || "")
    .trim()
    .toLowerCase()
    .replace(/[\s_\-./()[\]]/g, "");
}

function getCsvCell(row, index) {
  if (index === undefined || index === null || index < 0) return "";
  return row[index] == null ? "" : String(row[index]).trim();
}

function parseAmount(value) {
  const normalized = String(value || "")
    .replace(/฿|บาท|THB/gi, "")
    .replace(/,/g, "")
    .trim();

  if (!normalized) return 0;

  const amount = Number(normalized);
  return Number.isFinite(amount) ? amount : 0;
}

function compareOrderDates(a, b) {
  const timeA = parseDateValue(a);
  const timeB = parseDateValue(b);

  if (timeA === null && timeB === null) return 0;
  if (timeA === null) return 1;
  if (timeB === null) return -1;
  return timeA - timeB;
}

function parseDateValue(value) {
  const text = String(value || "").trim();
  if (!text) return null;

  // รองรับวันที่ ISO และรูปแบบวันที่ที่ JavaScript อ่านได้โดยตรง
  const direct = Date.parse(text);
  if (!Number.isNaN(direct)) return direct;

  // รองรับ d/m/yyyy และ d-m-yyyy พร้อมเวลาเสริม
  const match = text.match(
    /^(\d{1,2})[/-](\d{1,2})[/-](\d{4})(?:\s+(\d{1,2}):(\d{2})(?::(\d{2}))?)?$/
  );

  if (!match) return null;

  let day = Number(match[1]);
  let month = Number(match[2]);
  let year = Number(match[3]);
  const hour = Number(match[4] || 0);
  const minute = Number(match[5] || 0);
  const second = Number(match[6] || 0);

  // แปลงปี พ.ศ. เป็น ค.ศ. เมื่อมีลักษณะเป็นปี พ.ศ.
  if (year >= 2400) year -= 543;

  // สร้าง Date แบบ local เพื่อรองรับวันเวลาที่บันทึกในชีต
  const date = new Date(year, month - 1, day, hour, minute, second);
  return Number.isNaN(date.getTime()) ? null : date.getTime();
}
