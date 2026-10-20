/* MOLDMATE cart/order + existing admin CSV table */
const APPS_SCRIPT_URL="https://script.google.com/macros/s/AKfycbzGT2p-6GPs3HrTYz8aSriiw6rYmE55UNlDjKM1WudbOYSKX2bz74ZnewgVxNc2a3M_AA/exec";
const CSV_URL="https://docs.google.com/spreadsheets/d/e/2PACX-1vSuCcG6FrMEVLA7uY7oRLRqcdRvXuNaplz2GwlsGs35HHvnbHdRF-kGkeIFuYK0Rjmm82nCwUDv7OjM/pub?gid=0&single=true&output=csv";
const PRODUCTS_URL="products.json", CART_KEY="moldmate_cart_v1";
document.addEventListener("DOMContentLoaded",()=>{if(document.querySelector("[data-products-grid],.product-grid,#productsGrid,#productGrid"))initProductPage();if(document.querySelector("#orderForm"))initOrderPage();if(document.querySelector("#ordersTable tbody"))initAdminPage();updateCartCount();});
async function loadProducts(){const r=await fetch(PRODUCTS_URL,{cache:"no-store"});if(!r.ok)throw Error("โหลด products.json ไม่สำเร็จ");const p=await r.json();if(!Array.isArray(p))throw Error("รูปแบบ products.json ไม่ถูกต้อง");return p;}
function formatBaht(n){n=Number(n);return Number.isFinite(n)?new Intl.NumberFormat("th-TH",{style:"currency",currency:"THB",maximumFractionDigits:2}).format(n):"—";}
function setStatusMessage(e,m,c="notice"){if(e){e.textContent=m;e.className=c;e.hidden=false;}}function clearStatusMessage(e){if(e){e.textContent="";e.hidden=true;}}
function readCart(){try{const a=JSON.parse(localStorage.getItem(CART_KEY)||"[]");return Array.isArray(a)?a.filter(x=>x&&typeof x.id==="string"&&Number.isInteger(Number(x.quantity))&&Number(x.quantity)>0).map(x=>({id:x.id,quantity:Math.min(99,Number(x.quantity))})):[];}catch(e){return [];}}
function saveCart(a){localStorage.setItem(CART_KEY,JSON.stringify(a));updateCartCount();}function updateCartCount(){const n=readCart().reduce((s,x)=>s+x.quantity,0);document.querySelectorAll("#cartCount,[data-cart-count]").forEach(e=>e.textContent=String(n));}
function addToCart(id){const a=readCart(),x=a.find(y=>y.id===id);if(x)x.quantity=Math.min(99,x.quantity+1);else a.push({id,quantity:1});saveCart(a);setStatusMessage(document.querySelector("#cartNotice"),"เพิ่มสินค้าลงตะกร้าแล้ว");}
function createStatusElement(el){const p=document.createElement("p");p.className="notice";p.setAttribute("role","status");p.setAttribute("aria-live","polite");(el.parentElement||document.body).insertBefore(p,el);return p;}
function initProductPage(){const grid=document.querySelector("[data-products-grid],.product-grid,#productsGrid,#productGrid"),status=document.querySelector("#productsStatus,#productStatus,[data-products-status]"),buttons=[...document.querySelectorAll("[data-category-filter],.filter-button[data-category]")];let products=[];const norm=v=>{const s=String(v||"").trim().toLowerCase(),a={"":"all",all:"all","ทั้งหมด":"all",bathroom:"Bathroom Care","bathroom care":"Bathroom Care","bathroom-care":"Bathroom Care",wall:"Wall Care","wall care":"Wall Care","wall-care":"Wall Care",furniture:"Furniture Care","furniture care":"Furniture Care","furniture-care":"Furniture Care",home:"Home Care","home care":"Home Care","home-care":"Home Care",specialist:"Specialist"};return a[s]||products.find(p=>String(p.category).toLowerCase()===s)?.category||"all";};const filtered=c=>c==="all"?products:c==="Specialist"?products.filter(p=>p.usageType==="specialist"):products.filter(p=>p.category===c);const active=c=>buttons.forEach(b=>{const v=norm(b.dataset.categoryFilter??b.dataset.category??b.value);b.classList.toggle("is-active",v===c);b.setAttribute("aria-pressed",String(v===c));});function render(list){grid.replaceChildren();if(!list.length){setStatusMessage(status,"ไม่พบสินค้าที่ตรงกับประเภทที่เลือก");return;}clearStatusMessage(status);list.forEach(p=>{const card=document.createElement("article");card.className="product-card";const media=document.createElement("div");media.className="product-card-media";const img=document.createElement("img");img.className="product-card-image";img.src=p.image||"";img.alt=p.name||"MOLDMATE";img.loading="lazy";img.onerror=()=>{img.removeAttribute("src");media.classList.add("image-unavailable");};media.append(img);const body=document.createElement("div");body.className="product-card-body";const cat=document.createElement("p");cat.className="product-card-category";cat.textContent=p.category||"";const badge=document.createElement("span");badge.className="product-badge";badge.textContent=({trial:"Trial",standard:"Standard",specialist:"Specialist"})[p.usageType]||"Product";const title=document.createElement("h3");title.className="product-card-title";title.textContent=p.name||"";const desc=document.createElement("p");desc.className="product-card-description";desc.textContent=p.description||"";const meta=document.createElement("div");meta.className="product-card-meta";const size=document.createElement("span");size.className="product-size";size.textContent=p.size||"";const price=document.createElement("span");price.className="product-price";price.textContent=formatBaht(p.price);meta.append(size,price);const btn=document.createElement("button");btn.type="button";btn.className="btn btn-primary btn-block";btn.textContent="เพิ่มลงตะกร้า";btn.addEventListener("click",()=>{addToCart(String(p.id));btn.textContent="เพิ่มแล้ว";window.setTimeout(()=>btn.textContent="เพิ่มลงตะกร้า",900);});body.append(cat,badge,title,desc,meta,btn);card.append(media,body);grid.append(card);});}loadProducts().then(a=>{products=a;const c=norm(new URLSearchParams(location.search).get("category")||"all");active(c);render(filtered(c));}).catch(e=>{console.error(e);setStatusMessage(status||grid,"ไม่สามารถโหลดรายการสินค้าได้ กรุณาลองใหม่");});buttons.forEach(b=>b.addEventListener("click",()=>{const c=norm(b.dataset.categoryFilter??b.dataset.category??b.value);active(c);render(filtered(c));const u=new URL(location.href);if(c==="all")u.searchParams.delete("category");else u.searchParams.set("category",({"Bathroom Care":"bathroom","Wall Care":"wall","Furniture Care":"furniture","Home Care":"home",Specialist:"specialist"})[c]||c);history.replaceState({},"",u);}));}
function initOrderPage(){const form=document.querySelector("#orderForm"),box=document.querySelector("#cartItems"),itemsField=document.querySelector("#items"),totalField=document.querySelector("#total"),totalLabel=document.querySelector("#cartGrandTotal"),status=document.querySelector("#cartStatus"),submit=form.querySelector('[type="submit"]');let products=[],cart=[],busy=false;function render(){cart=cart.filter(x=>products.some(p=>p.id===x.id));box.replaceChildren();let total=0;if(!cart.length){const p=document.createElement("p");p.textContent="ยังไม่มีสินค้าในตะกร้า กรุณาเลือกสินค้าก่อนสั่งซื้อ";box.append(p);submit.disabled=true;}else{submit.disabled=false;cart.forEach(item=>{const p=products.find(x=>x.id===item.id),line=p.price*item.quantity;total+=line;const row=document.createElement("div");row.className="cart-item";const d=document.createElement("div");d.className="cart-item-details";const n=document.createElement("strong");n.textContent=p.name;const info=document.createElement("p");info.textContent=p.size+" · "+formatBaht(p.price)+" / ชิ้น";const sum=document.createElement("p");sum.textContent="รวม "+formatBaht(line);d.append(n,info,sum);const controls=document.createElement("div");controls.className="cart-item-controls";const label=document.createElement("label");label.textContent="จำนวน ";const qty=document.createElement("input");qty.type="number";qty.min="1";qty.max="99";qty.step="1";qty.value=String(item.quantity);qty.style.width="5rem";qty.setAttribute("aria-label","จำนวน "+p.name);qty.addEventListener("change",()=>{const v=Number(qty.value);if(!Number.isInteger(v)||v<1||v>99){qty.value=String(item.quantity);return;}item.quantity=v;saveCart(cart);render();});const del=document.createElement("button");del.type="button";del.className="btn btn-secondary";del.textContent="ลบ";del.addEventListener("click",()=>{cart=cart.filter(x=>x.id!==item.id);saveCart(cart);render();});label.append(qty);controls.append(label,del);row.append(d,controls);box.append(row);});}totalLabel.textContent=formatBaht(total);totalField.value=String(total);itemsField.value=cart.map(x=>{const p=products.find(y=>y.id===x.id);return p.name+" ("+p.size+") x "+x.quantity;}).join("; ");clearStatusMessage(status);}loadProducts().then(a=>{products=a;cart=readCart();render();}).catch(e=>{console.error(e);setStatusMessage(status,"โหลดข้อมูลสินค้าไม่สำเร็จ");submit.disabled=true;});form.addEventListener("submit",async ev=>{ev.preventDefault();if(busy)return;cart=readCart();if(!cart.length){alert("กรุณาเพิ่มสินค้าในตะกร้าก่อนสั่งซื้อ");return;}const customerName=document.querySelector("#customerName").value.trim(),contact=document.querySelector("#contact").value.trim(),note=document.querySelector("#note").value.trim();if(!customerName||!contact){alert("กรุณากรอกชื่อและช่องทางติดต่อ");return;}busy=true;submit.disabled=true;submit.textContent="กำลังส่งคำสั่งซื้อ...";try{await fetch(APPS_SCRIPT_URL,{method:"POST",mode:"no-cors",headers:{"Content-Type":"text/plain;charset=utf-8"},body:JSON.stringify({customerName,contact,note,cart:cart.map(x=>({id:x.id,quantity:x.quantity}))})});localStorage.removeItem(CART_KEY);location.href="thankyou.html";}catch(e){console.error(e);setStatusMessage(status,"ส่งคำสั่งซื้อไม่สำเร็จ กรุณาลองใหม่");busy=false;submit.disabled=false;submit.textContent="ยืนยันสั่งซื้อ";}});}

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
