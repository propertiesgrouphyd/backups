const PAYMENT_SITE = "https://payments.vidhwaan.com";
const INVOICE_CDN = "https://payments.gidigi.in";

const SELLER = {
  brand: "Vidhwaan",
  legalName: "Gidigi Technologies Private Limited",
  state: "Andhra Pradesh"
};

const GST_RATE = 0.18;

const APPS = {
  AIV: {
    name: "AIVidhya",
    url: "https://aividhya.vidhwaan.com",
    amount: 30,
    days: 30,
    prefix: "AIV"
  },

  ECM: {
    name: "E-commerce",
    url: "https://business.vidhwaan.com",
    amount: 1000,
    days: 30,
    prefix: "ECM"
  },


  WEB: {
    name: "Website",
    url: "https://business.vidhwaan.com",
    amount: 1000,
    days: 30,
    prefix: "WEB"
  },

  NEET: {
    name: "VIDHWAAN NEET",
    url: "https://neet.vidhwaan.com",
    amount: 30,
    days: 30,
    prefix: "NEET"
  },

  VAW: {
    name: "VIDHWAAN AI Writer",
    url: "https://writer.vidhwaan.com",
    amount: 1,
    days: 30,
    prefix: "AIW"
  },

  KID: {
    name: "KidLab",
    url: "https://villagekidlab.vidhwaan.com",
    amount: 30,
    days: 30,
    prefix: "KID"
  },

  BIL: {
    name: "Billwaan App",
    url: "https://bill.vidhwaan.com",
    amount: 30,
    days: 30,
    prefix: "BIL"
  },

  GIT: {
    name: "Bhagavad Gita",
    url: "https://gita.vidhwaan.com",
    amount: 30,
    days: 30,
    prefix: "GIT"
  },

  SHOP: {
    name: "Online Shop",
    url: "https://market.vidhwaan.com",
    amount: 30,
    days: 30,
    prefix: "SHOP"
  },

  MKT: {
    name: "Vidhwaan Village Market",
    url: "https://ap.vidhwaan.com",
    amount: 30,
    days: 30,
    prefix: "MKT"
  }
};

const CORS_ORIGINS = new Set([
  PAYMENT_SITE,
  ...Object.values(APPS).map(
    app => app.url
  )
]);

const PENDING_ORDER_TTL = 30 * 60;


/*
 * ============================================================
 * JSON RESPONSE
 * ============================================================
 */

function jsonResponse(data, status = 200, request = null) {
  const headers = {
    "Content-Type": "application/json; charset=utf-8",
    "Cache-Control": "no-store",
    "X-Content-Type-Options": "nosniff",
    "Referrer-Policy": "strict-origin-when-cross-origin"
  };

  const origin = request?.headers.get("Origin");

  if (origin && CORS_ORIGINS.has(origin)) {
    headers["Access-Control-Allow-Origin"] = origin;
    headers["Access-Control-Allow-Methods"] =
      "GET, POST, OPTIONS";
    headers["Access-Control-Allow-Headers"] =
      "Content-Type";
    headers["Vary"] = "Origin";
  }

  return new Response(
    JSON.stringify(data),
    {
      status,
      headers
    }
  );
}


/*
 * ============================================================
 * APPLICATION VALIDATION
 * ============================================================
 */

function canonicalAppUrl(value) {
  if (
    typeof value !== "string" ||
    !value.trim()
  ) {
    throw new Error("Invalid app URL");
  }

  let url;

  try {
    url = new URL(value.trim());
  } catch {
    throw new Error("Invalid app URL");
  }

  if (url.protocol !== "https:") {
    throw new Error("App URL must use HTTPS");
  }

  if (
    url.username ||
    url.password ||
    url.port
  ) {
    throw new Error("Invalid app URL");
  }

  if (
    url.pathname !== "/" ||
    url.search ||
    url.hash
  ) {
    throw new Error("Invalid app URL");
  }

  return `${url.protocol}//${url.hostname}`;
}


function getApp(appId) {

  if (
    typeof appId !== "string" ||
    !appId.trim()
  ) {
    throw new Error(
      "Application ID is required"
    );
  }

  const id =
    appId
      .trim()
      .toUpperCase();

  const app =
    APPS[id];

  if (!app) {
    throw new Error(
      "Application is not registered"
    );
  }

  return {
    id,
    ...app
  };
}


/*
 * ============================================================
 * INDIAN STATES / UNION TERRITORIES
 * ============================================================
 */

const INDIAN_STATES = [
  "Andhra Pradesh",
  "Arunachal Pradesh",
  "Assam",
  "Bihar",
  "Chhattisgarh",
  "Goa",
  "Gujarat",
  "Haryana",
  "Himachal Pradesh",
  "Jharkhand",
  "Karnataka",
  "Kerala",
  "Madhya Pradesh",
  "Maharashtra",
  "Manipur",
  "Meghalaya",
  "Mizoram",
  "Nagaland",
  "Odisha",
  "Punjab",
  "Rajasthan",
  "Sikkim",
  "Tamil Nadu",
  "Telangana",
  "Tripura",
  "Uttar Pradesh",
  "Uttarakhand",
  "West Bengal",
  "Andaman and Nicobar Islands",
  "Chandigarh",
  "Dadra and Nagar Haveli and Daman and Diu",
  "Delhi",
  "Jammu and Kashmir",
  "Ladakh",
  "Lakshadweep",
  "Puducherry"
];

const STATE_ALIASES = {
  "andaman & nicobar islands":
    "Andaman and Nicobar Islands",

  "dadra and nagar haveli":
    "Dadra and Nagar Haveli and Daman and Diu",

  "daman and diu":
    "Dadra and Nagar Haveli and Daman and Diu",

  "jammu & kashmir":
    "Jammu and Kashmir",

  "nct of delhi":
    "Delhi",

  "pondicherry":
    "Puducherry"
};


function normalizeState(value) {
  if (
    typeof value !== "string" ||
    !value.trim()
  ) {
    throw new Error("State is required");
  }

  const input = value
    .trim()
    .replace(/\s+/g, " ")
    .toLowerCase();

  const canonical =
    STATE_ALIASES[input] ||
    INDIAN_STATES.find(
      state =>
        state.toLowerCase() === input
    );

  if (!canonical) {
    throw new Error("Invalid Indian State/UT");
  }

  return canonical;
}


/*
 * ============================================================
 * TEXT / CUSTOMER VALIDATION
 * ============================================================
 */

function text(value, name, max = 500) {
  if (
    typeof value !== "string" ||
    !value.trim()
  ) {
    throw new Error(`${name} is required`);
  }

  const v = value.trim();

  if (v.length > max) {
    throw new Error(`${name} is too long`);
  }

  return v;
}


function email(value) {
  const v = text(
    value,
    "Email",
    254
  ).toLowerCase();

  if (
    !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v)
  ) {
    throw new Error("Invalid email");
  }

  return v;
}


function phone(value) {
  const v = text(
    value,
    "Phone",
    30
  ).replace(/[\s().-]/g, "");

  if (!/^\+?[0-9]{8,15}$/.test(v)) {
    throw new Error("Invalid phone");
  }

  return v;
}




/* ============================================================
   CLIENT IP
   ============================================================ */

function getClientIp(request) {

  const ip =
    request.headers.get(
      "CF-Connecting-IP"
    );

  if (
    typeof ip !== "string" ||
    !ip.trim()
  ) {

    return null;

  }

  return ip.trim();

}



function customerType(value) {
  const v = text(
    value,
    "Customer type",
    20
  ).toLowerCase();

  if (
    v !== "individual" &&
    v !== "company"
  ) {
    throw new Error("Invalid customer type");
  }

  return v;
}


/*
 * ============================================================
 * GSTIN VALIDATION
 * ============================================================
 */

function validateGstin(value, state) {
  const gstin = text(
    value,
    "GSTIN",
    15
  ).toUpperCase();

  if (
    !/^[0-9]{2}[A-Z0-9]{13}$/.test(gstin)
  ) {
    throw new Error("Invalid GSTIN");
  }

  const stateCode =
    Number(gstin.slice(0, 2));

  const stateCodes = {
    "Andhra Pradesh": 37,
    "Arunachal Pradesh": 12,
    "Assam": 18,
    "Bihar": 10,
    "Chhattisgarh": 22,
    "Goa": 30,
    "Gujarat": 24,
    "Haryana": 6,
    "Himachal Pradesh": 2,
    "Jharkhand": 20,
    "Karnataka": 29,
    "Kerala": 32,
    "Madhya Pradesh": 23,
    "Maharashtra": 27,
    "Manipur": 14,
    "Meghalaya": 17,
    "Mizoram": 15,
    "Nagaland": 13,
    "Odisha": 21,
    "Punjab": 3,
    "Rajasthan": 8,
    "Sikkim": 11,
    "Tamil Nadu": 33,
    "Telangana": 36,
    "Tripura": 16,
    "Uttar Pradesh": 9,
    "Uttarakhand": 5,
    "West Bengal": 19,
    "Andaman and Nicobar Islands": 35,
    "Chandigarh": 4,
    "Dadra and Nagar Haveli and Daman and Diu": 26,
    "Delhi": 7,
    "Jammu and Kashmir": 1,
    "Ladakh": 38,
    "Lakshadweep": 31,
    "Puducherry": 34
  };

  if (
    stateCodes[state] !== stateCode
  ) {
    throw new Error(
      "GSTIN does not match selected State/UT"
    );
  }

  return gstin;
}


function validateCustomer(body) {
  const type =
    customerType(body.customerType);

  const state =
    normalizeState(body.state);

  const customer = {
    firstName: text(
      body.firstName,
      "First name",
      100
    ),

    lastName: text(
      body.lastName,
      "Last name",
      100
    ),

    email: email(body.email),

    phone: phone(body.phone),

    customerType: type,

    state,

    address: text(
      body.address,
      "Billing address",
      1000
    ),

    companyName: "",

    gstin: ""
  };

  if (type === "company") {
    customer.companyName =
      text(
        body.companyName,
        "Company name",
        200
      );

    if (
      body.gstin &&
      String(body.gstin).trim()
    ) {
      customer.gstin =
        validateGstin(
          body.gstin,
          state
        );
    }
  }

  return customer;
}


/*
 * ============================================================
 * GST CALCULATION
 * ============================================================
 */

function calculateGST(app, state) {
  const taxablePaise =
    Math.round(app.amount * 100);

  const totalTaxPaise =
    Math.round(
      taxablePaise * GST_RATE
    );

  const sameState =
    state === SELLER.state;

  if (sameState) {
    const cgstPaise =
      Math.floor(totalTaxPaise / 2);

    const sgstPaise =
      totalTaxPaise - cgstPaise;

    return {
      taxablePaise,
      cgstPaise,
      sgstPaise,
      igstPaise: 0,
      totalTaxPaise,
      totalPaise:
        taxablePaise + totalTaxPaise
    };
  }

  return {
    taxablePaise,
    cgstPaise: 0,
    sgstPaise: 0,
    igstPaise: totalTaxPaise,
    totalTaxPaise,
    totalPaise:
      taxablePaise + totalTaxPaise
  };
}


function rupees(paise) {
  return Number(
    (paise / 100).toFixed(2)
  );
}


/*
 * ============================================================
 * RAZORPAY API
 * ============================================================
 */

async function razorpayRequest(
  env,
  path,
  options = {}
) {
  if (
    !env.RAZORPAY_KEY_ID ||
    !env.RAZORPAY_KEY_SECRET
  ) {
    throw new Error(
      "Razorpay configuration is missing"
    );
  }

  const credentials =
    btoa(
      `${env.RAZORPAY_KEY_ID}:${env.RAZORPAY_KEY_SECRET}`
    );

  const response =
    await fetch(
      `https://api.razorpay.com/v1${path}`,
      {
        ...options,

        headers: {
          "Authorization":
            `Basic ${credentials}`,

          "Content-Type":
            "application/json",

          ...(options.headers || {})
        }
      }
    );

  const data =
    await response
      .json()
      .catch(() => null);

  if (!response.ok) {
    throw new Error(
      data?.error?.description ||
      "Razorpay API request failed"
    );
  }

  return data;
}


async function createRazorpayOrder(
  env,
  amountPaise,
  app
) {
  const receipt =
    `${app.prefix}-${crypto.randomUUID()}`;

  return razorpayRequest(
    env,
    "/orders",
    {
      method: "POST",

      body: JSON.stringify({
        amount: amountPaise,
        currency: "INR",
        receipt,

        notes: {
          app: app.url,
          subscriptionDays:
            String(app.days)
        }
      })
    }
  );
}


/*
 * ============================================================
 * TEMPORARY ORDER STORAGE
 * ============================================================
 */

async function savePendingOrder(
  env,
  orderId,
  data
) {
  if (!env.PENDING_ORDERS) {
    throw new Error(
      "Pending order storage is not configured"
    );
  }

  await env.PENDING_ORDERS.put(
    `order:${orderId}`,
    JSON.stringify(data),
    {
      expirationTtl:
        PENDING_ORDER_TTL
    }
  );
}


async function getPendingOrder(
  env,
  orderId
) {
  if (!env.PENDING_ORDERS) {
    throw new Error(
      "Pending order storage is not configured"
    );
  }

  const value =
    await env.PENDING_ORDERS.get(
      `order:${orderId}`
    );

  if (!value) {
    return null;
  }

  try {
    return JSON.parse(value);
  } catch {
    throw new Error(
      "Invalid pending order data"
    );
  }
}


async function deletePendingOrder(
  env,
  orderId
) {
  if (!env.PENDING_ORDERS) {
    throw new Error(
      "Pending order storage is not configured"
    );
  }

  await env.PENDING_ORDERS.delete(
    `order:${orderId}`
  );
}


/*
 * ============================================================
 * CREATE ORDER
 * ============================================================
 */

async function createOrder(
  request,
  env
) {
  let body;

  try {
    body =
      await request.json();
  } catch {
    throw new Error(
      "Invalid JSON request"
    );
  }

  if (
    !body ||
    typeof body !== "object" ||
    Array.isArray(body)
  ) {
    throw new Error(
      "Invalid request"
    );
  }


  const app =
    getApp(body.appId);


  if (
    typeof body.appUrl !== "string" ||
    canonicalAppUrl(body.appUrl) !== app.url
  ) {
    throw new Error(
      "Application URL does not match"
    );
  }



  if (
    body.termsAccepted !== true
  ) {
    throw new Error(
      "Terms & Conditions must be accepted"
    );
  }


  const customer =
    validateCustomer(body);


  const clientIp =
    getClientIp(request);


  const gst =
    calculateGST(
      app,
      customer.state
    );


  const order =
    await createRazorpayOrder(
      env,
      gst.totalPaise,
      app
    );


  if (
    !order?.id ||
    Number(order.amount) !==
      gst.totalPaise ||
    order.currency !== "INR"
  ) {
    throw new Error(
      "Invalid Razorpay order response"
    );
  }


  const pendingOrder = {
    orderId:
      order.id,
    clientIp,

    app: {
      id: app.id,
      url: app.url,
      name: app.name,
      days: app.days,
      prefix: app.prefix
    },

    customer,

    gst: {
      taxablePaise:
        gst.taxablePaise,

      cgstPaise:
        gst.cgstPaise,

      sgstPaise:
        gst.sgstPaise,

      igstPaise:
        gst.igstPaise,

      totalTaxPaise:
        gst.totalTaxPaise,

      totalPaise:
        gst.totalPaise
    },

    createdAt:
      new Date().toISOString()
  };


  await savePendingOrder(
    env,
    order.id,
    pendingOrder
  );


  return {
    order: {
      id: order.id,
      amount: order.amount,
      currency: order.currency
    },

    app: {
      url: app.url,
      name: app.name,
      days: app.days
    },

    gst: {
      taxableAmount:
        rupees(
          gst.taxablePaise
        ),

      cgst:
        rupees(
          gst.cgstPaise
        ),

      sgst:
        rupees(
          gst.sgstPaise
        ),

      igst:
        rupees(
          gst.igstPaise
        ),

      totalTax:
        rupees(
          gst.totalTaxPaise
        ),

      totalAmount:
        rupees(
          gst.totalPaise
        )
    }
  };
}


/*
 * ============================================================
 * RAZORPAY SIGNATURE VERIFICATION
 * ============================================================
 */

async function verifyRazorpaySignature(
  orderId,
  paymentId,
  signature,
  secret
) {
  if (
    typeof orderId !== "string" ||
    !orderId ||
    typeof paymentId !== "string" ||
    !paymentId ||
    typeof signature !== "string" ||
    !signature ||
    typeof secret !== "string" ||
    !secret
  ) {
    throw new Error(
      "Invalid payment verification data"
    );
  }


  const message =
    `${orderId}|${paymentId}`;

  const encoder =
    new TextEncoder();


  const key =
    await crypto.subtle.importKey(
      "raw",
      encoder.encode(secret),
      {
        name: "HMAC",
        hash: "SHA-256"
      },
      false,
      ["sign"]
    );


  const signatureBytes =
    await crypto.subtle.sign(
      "HMAC",
      key,
      encoder.encode(message)
    );


  const expectedSignature =
    [...new Uint8Array(
      signatureBytes
    )]
      .map(
        byte =>
          byte
            .toString(16)
            .padStart(2, "0")
      )
      .join("");


  if (
    expectedSignature.length !==
    signature.length
  ) {
    throw new Error(
      "Invalid payment signature"
    );
  }


  let difference = 0;

  for (
    let i = 0;
    i < expectedSignature.length;
    i++
  ) {
    difference |=
      expectedSignature.charCodeAt(i) ^
      signature.charCodeAt(i);
  }


  if (difference !== 0) {
    throw new Error(
      "Invalid payment signature"
    );
  }


  return true;
}


async function verifyPaymentRequest(
  request,
  env
) {
  let body;

  try {
    body =
      await request.json();
  } catch {
    throw new Error(
      "Invalid JSON request"
    );
  }


  if (
    !body ||
    typeof body !== "object" ||
    Array.isArray(body)
  ) {
    throw new Error(
      "Invalid verification request"
    );
  }


  const orderId =
    typeof body.razorpayOrderId === "string"
      ? body.razorpayOrderId.trim()
      : "";


  const paymentId =
    typeof body.razorpayPaymentId === "string"
      ? body.razorpayPaymentId.trim()
      : "";


  const signature =
    typeof body.razorpaySignature === "string"
      ? body.razorpaySignature.trim()
      : "";


  if (!orderId) {
    throw new Error(
      "Razorpay order ID is required"
    );
  }


  if (!paymentId) {
    throw new Error(
      "Razorpay payment ID is required"
    );
  }


  if (!signature) {
    throw new Error(
      "Razorpay signature is required"
    );
  }


  if (!env.RAZORPAY_KEY_SECRET) {
    throw new Error(
      "Razorpay secret is not configured"
    );
  }


  await verifyRazorpaySignature(
    orderId,
    paymentId,
    signature,
    env.RAZORPAY_KEY_SECRET
  );


  return {
    orderId,
    paymentId,
    signature
  };
}


/*
 * ============================================================
 * RAZORPAY PAYMENT CONFIRMATION
 * ============================================================
 */

async function getRazorpayOrder(
  env,
  orderId
) {
  return razorpayRequest(
    env,
    `/orders/${encodeURIComponent(
      orderId
    )}`,
    {
      method: "GET"
    }
  );
}


async function getRazorpayPayment(
  env,
  paymentId
) {
  return razorpayRequest(
    env,
    `/payments/${encodeURIComponent(
      paymentId
    )}`,
    {
      method: "GET"
    }
  );
}


async function confirmRazorpayPayment(
  env,
  orderId,
  paymentId
) {
  const order =
    await getRazorpayOrder(
      env,
      orderId
    );


  const payment =
    await getRazorpayPayment(
      env,
      paymentId
    );


  if (
    payment.order_id !== orderId
  ) {
    throw new Error(
      "Payment does not belong to this order"
    );
  }


  if (
    Number(payment.amount) !==
    Number(order.amount)
  ) {
    throw new Error(
      "Payment amount does not match order"
    );
  }


  if (
    payment.currency !== "INR"
  ) {
    throw new Error(
      "Invalid payment currency"
    );
  }


  if (
    payment.status !== "captured"
  ) {
    throw new Error(
      "Payment has not been captured"
    );
  }


  if (
    order.status !== "paid"
  ) {
    throw new Error(
      "Razorpay order is not paid"
    );
  }


  return {
    order,
    payment
  };
}


/*
 * ============================================================
 * D1 PAYMENT IDEMPOTENCY
 * ============================================================
 */

async function paymentAlreadyProcessed(
  env,
  paymentId
) {
  if (!env.DB) {
    throw new Error(
      "Database is not configured"
    );
  }

  const result =
    await env.DB
      .prepare(
        `SELECT payment_id
         FROM payment_idempotency
         WHERE payment_id = ?1
         LIMIT 1`
      )
      .bind(paymentId)
      .first();

  return Boolean(result);
}


async function markPaymentProcessed(
  env,
  paymentId
) {
  if (!env.DB) {
    throw new Error(
      "Database is not configured"
    );
  }

  const result =
    await env.DB
      .prepare(
        `INSERT OR IGNORE INTO payment_idempotency
         (payment_id)
         VALUES (?1)`
      )
      .bind(paymentId)
      .run();

  return result.meta.changes === 1;
}


/*
 * ============================================================
 * FINANCIAL YEAR
 * ============================================================
 */

function getIndiaFinancialYear() {
  const now =
    new Date();

  const indiaDate =
    new Date(
      now.toLocaleString(
        "en-US",
        {
          timeZone:
            "Asia/Kolkata"
        }
      )
    );

  const year =
    indiaDate.getFullYear();

  const month =
    indiaDate.getMonth() + 1;


  if (month >= 4) {
    return `${year}-${String(
      year + 1
    ).slice(-2)}`;
  }


  return `${year - 1}-${String(
    year
  ).slice(-2)}`;
}


/*
 * ============================================================
 * INVOICE NUMBER
 * ============================================================
 */

async function generateInvoiceNumber(
  env
) {
  if (!env.DB) {
    throw new Error(
      "Database is not configured"
    );
  }

  const financialYear =
    getIndiaFinancialYear();


  const result =
    await env.DB
      .prepare(
        `INSERT INTO invoice_sequences
         (financial_year, last_number)
         VALUES (?1, 1)
         ON CONFLICT(financial_year)
         DO UPDATE SET
           last_number =
             invoice_sequences.last_number + 1
         RETURNING last_number`
      )
      .bind(financialYear)
      .first();


  if (
    !result ||
    typeof result.last_number !== "number"
  ) {
    throw new Error(
      "Unable to generate invoice number"
    );
  }


  const sequence =
    String(
      result.last_number
    ).padStart(8, "0");

  return {
    financialYear,

    invoiceNumber:
      `VIDHWAAN/${String(
        new Date().toLocaleString(
          "en-US",
          {
            timeZone: "Asia/Kolkata",
            day: "2-digit"
          }
        )
      )}/${String(
        new Date().toLocaleString(
          "en-US",
          {
            timeZone: "Asia/Kolkata",
            month: "2-digit"
          }
        )
      )}/${financialYear}/${sequence}`
  };

}


/*
 * ============================================================
 * UNIQUE ID
 * ============================================================
 */

function generateUniqueId(prefix) {
  const bytes =
    new Uint8Array(8);

  crypto.getRandomValues(
    bytes
  );

  const alphabet =
    "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";

  let value = "";

  for (const byte of bytes) {
    value +=
      alphabet[
        byte % alphabet.length
      ];
  }

  return `${prefix}-${value}`;
}

/*
 * ============================================================
 * BUILD INVOICE
 * ============================================================
 */

function buildInvoice(
  pendingOrder,
  razorpayOrder,
  razorpayPayment,
  invoiceNumber,
  uniqueId
) {
  const now =
    new Date();

  const customer =
    pendingOrder.customer;

  const app =
    pendingOrder.app;

  const gst =
    pendingOrder.gst;


  return {
    version: 1,

    uniqueId,

    invoiceNumber,

    invoiceDate:
      now.toISOString(),


    seller: {
      brand:
        SELLER.brand,

      legalName:
        SELLER.legalName,

      state:
        SELLER.state
    },


    customer: {

      firstName:
        customer.firstName,

      lastName:
        customer.lastName,

      email:
        customer.email,

      phone:
        customer.phone,

      customerType:
        customer.customerType,

      companyName:
        customer.companyName,

      gstin:
        customer.gstin,

      state:
        customer.state,

      address:
        customer.address
    },


    requestInfo: {

      ipAddress:
        pendingOrder.clientIp || null

    },

    subscription: {

      appId:
        app.id,

      appUrl:
        app.url,

      appName:
        app.name,

      days:
        app.days
    },


    amounts: {
      taxableAmount:
        rupees(
          gst.taxablePaise
        ),

      cgst:
        rupees(
          gst.cgstPaise
        ),

      sgst:
        rupees(
          gst.sgstPaise
        ),

      igst:
        rupees(
          gst.igstPaise
        ),

      totalTax:
        rupees(
          gst.totalTaxPaise
        ),

      grandTotal:
        rupees(
          gst.totalPaise
        ),

      currency:
        "INR"
    },


    payment: {
      razorpayOrderId:
        razorpayOrder.id,

      razorpayPaymentId:
        razorpayPayment.id,

      status:
        razorpayPayment.status,

      method:
        razorpayPayment.method ||
        null,

      amount:
        rupees(
          razorpayPayment.amount
        ),

      currency:
        razorpayPayment.currency,

      paidAt:
        razorpayPayment.created_at
          ? new Date(
              razorpayPayment.created_at *
                1000
            ).toISOString()
          : now.toISOString()
    },


    subscriptionPeriod: {
      startDate: null,
      expiryDate: null
    },


    statusUrl:
      `${PAYMENT_SITE}/status?id=${encodeURIComponent(
        uniqueId
      )}`,


    invoiceUrl:
      `${INVOICE_CDN}/invoices/${encodeURIComponent(
        uniqueId
      )}.json`
  };
}


/*
 * ============================================================
 * SUBSCRIPTION DATES
 * ============================================================
 */

function getSubscriptionPeriod(
  days
) {
  if (
    !Number.isInteger(days) ||
    days <= 0
  ) {
    throw new Error(
      "Invalid subscription duration"
    );
  }


  const start =
    new Date();

  const expiry =
    new Date(start);


  expiry.setUTCDate(
    expiry.getUTCDate() + days
  );


  return {
    startDate:
      start.toISOString(),

    expiryDate:
      expiry.toISOString()
  };
}


function finalizeInvoiceDates(
  invoice,
  days
) {
  const period =
    getSubscriptionPeriod(
      days
    );


  invoice.subscriptionPeriod = {
    startDate:
      period.startDate,

    expiryDate:
      period.expiryDate
  };


  return invoice;
}


/*
 * ============================================================
 * R2 INVOICE STORAGE
 * ============================================================
 */

async function saveInvoiceToR2(
  env,
  invoice
) {
  if (!env.INVOICES) {
    throw new Error(
      "Invoice storage is not configured"
    );
  }


  if (
    !invoice?.uniqueId
  ) {
    throw new Error(
      "Invoice unique ID is missing"
    );
  }


  const key =
    `invoices/${invoice.uniqueId}.json`;


  const body =
    JSON.stringify(
      invoice,
      null,
      2
    );


  const savedObject =
    await env.INVOICES.put(
      key,
      body,
      {
        httpMetadata: {
          contentType:
            "application/json; charset=utf-8",

          cacheControl:
            "public, max-age=31536000, immutable"
        }
      }
    );


  if (!savedObject) {
    throw new Error(
      "Invoice could not be saved to storage"
    );
  }


  const saved =
    await env.INVOICES.head(
      key
    );


  if (!saved) {
    throw new Error(
      "Invoice could not be confirmed in storage"
    );
  }


  return {
    key,

    url:
      `${INVOICE_CDN}/${key}`
  };
}


/*
 * ============================================================
 * CLOUDFLARE EXACT URL CACHE PURGE
 * ============================================================
 */

async function purgeInvoiceCache(
  env,
  invoiceUrl
) {
  if (
    !env.CF_ZONE_ID ||
    !env.CF_API_TOKEN
  ) {
    throw new Error(
      "Cloudflare purge configuration is missing"
    );
  }


  if (
    typeof invoiceUrl !== "string" ||
    !invoiceUrl.startsWith(
      `${INVOICE_CDN}/invoices/`
    )
  ) {
    throw new Error(
      "Invalid invoice URL"
    );
  }


  const response =
    await fetch(
      `https://api.cloudflare.com/client/v4/zones/${encodeURIComponent(
        env.CF_ZONE_ID
      )}/purge_cache`,
      {
        method: "POST",

        headers: {
          "Authorization":
            `Bearer ${env.CF_API_TOKEN}`,

          "Content-Type":
            "application/json"
        },

        body: JSON.stringify({
          files: [
            invoiceUrl
          ]
        })
      }
    );


  const data =
    await response
      .json()
      .catch(() => null);


  if (
    !response.ok ||
    data?.success !== true
  ) {
    throw new Error(
      data?.errors?.[0]?.message ||
      "Invoice cache purge failed"
    );
  }


  return true;
}


/*
 * ============================================================
 * COMPLETE PAYMENT
 * ============================================================
 */

async function completePayment(
  request,
  env
) {
  /*
   * ==========================================================
   * VERIFY REQUEST + SIGNATURE
   * ==========================================================
   */

  const verification =
    await verifyPaymentRequest(
      request,
      env
    );


  const orderId =
    verification.orderId;

  const paymentId =
    verification.paymentId;


  /*
   * ==========================================================
   * CHECK DUPLICATE PAYMENT EARLY
   * ==========================================================
   */

  if (
    await paymentAlreadyProcessed(
      env,
      paymentId
    )
  ) {
    throw new Error(
      "Payment has already been processed"
    );
  }


  /*
   * ==========================================================
   * LOAD TRUSTED ORDER DATA
   * ==========================================================
   */

  const pendingOrder =
    await getPendingOrder(
      env,
      orderId
    );


  if (!pendingOrder) {
    throw new Error(
      "Payment session expired or not found"
    );
  }


  if (
    pendingOrder.orderId !==
    orderId
  ) {
    throw new Error(
      "Order data does not match"
    );
  }


  /*
   * ==========================================================
   * VERIFY PAYMENT DIRECTLY WITH RAZORPAY
   * ==========================================================
   */

  const {
    order,
    payment
  } =
    await confirmRazorpayPayment(
      env,
      orderId,
      paymentId
    );


  /*
   * ==========================================================
   * VERIFY FINAL AMOUNT
   * ==========================================================
   */

  if (
    Number(order.amount) !==
    Number(
      pendingOrder.gst.totalPaise
    )
  ) {
    throw new Error(
      "Paid amount does not match purchase amount"
    );
  }


  /*
   * ==========================================================
   * GENERATE PERMANENT IDENTIFIERS
   * ==========================================================
   */

  const uniqueId =
    generateUniqueId(
      pendingOrder.app.prefix
    );


  const {
    invoiceNumber
  } =
    await generateInvoiceNumber(
      env
    );


  /*
   * ==========================================================
   * BUILD INVOICE
   * ==========================================================
   */

  let invoice =
    buildInvoice(
      pendingOrder,
      order,
      payment,
      invoiceNumber,
      uniqueId
    );


  /*
   * ==========================================================
   * SUBSCRIPTION PERIOD
   * ==========================================================
   */

  invoice =
    finalizeInvoiceDates(
      invoice,
      pendingOrder.app.days
    );


  /*
   * ==========================================================
   * SAVE PERMANENT INVOICE TO R2
   * ==========================================================
   */

  const storage =
    await saveInvoiceToR2(
      env,
      invoice
    );


  /*
   * ==========================================================
   * PURGE EXACT PUBLIC URL
   * ==========================================================
   */

  await purgeInvoiceCache(
    env,
    storage.url
  );


  /*
   * ==========================================================
   * ATOMIC PAYMENT CLAIM
   *
   * We claim ONLY after the permanent invoice has been
   * successfully written and confirmed in R2.
   *
   * This keeps the simple D1 payment_idempotency table.
   * ==========================================================
   */

  const claimed =
    await markPaymentProcessed(
      env,
      paymentId
    );


  if (!claimed) {
    throw new Error(
      "Payment has already been processed"
    );
  }


  /*
   * ==========================================================
   * DELETE TEMPORARY ORDER DATA
   * ==========================================================
   */

  await deletePendingOrder(
    env,
    orderId
  );


  /*
   * ==========================================================
   * FINAL RESPONSE
   * ==========================================================
   */

  return {
    success: true,

    uniqueId,

    invoiceNumber,

    statusUrl:
      invoice.statusUrl,

    invoiceUrl:
      invoice.invoiceUrl,

    subscription: {
      startDate:
        invoice
          .subscriptionPeriod
          .startDate,

      expiryDate:
        invoice
          .subscriptionPeriod
          .expiryDate
    }
  };
}


/*
 * ============================================================
 * HEALTH CHECK
 * ============================================================
 */

function healthResponse() {
  return new Response(
    JSON.stringify({
      success: true,
      service: "vidhwaan-payments",
      status: "ok"
    }),
    {
      status: 200,
      headers: {
        "Content-Type":
          "application/json; charset=utf-8",

        "Cache-Control":
          "no-store",

        "X-Content-Type-Options":
          "nosniff"
      }
    }
  );
}



/*
 * ============================================================
 * DAILY GITHUB R2 BACKUP
 * ============================================================
 */

function getIndiaDateString(date) {

  return new Intl.DateTimeFormat(
    "en-CA",
    {
      timeZone: "Asia/Kolkata",
      year: "numeric",
      month: "2-digit",
      day: "2-digit"
    }
  ).format(date);

}


function getPreviousIndiaDate() {

  const now =
    new Date();

  const indiaNow =
    new Date(
      now.toLocaleString(
        "en-US",
        {
          timeZone: "Asia/Kolkata"
        }
      )
    );

  indiaNow.setDate(
    indiaNow.getDate() - 1
  );

  return getIndiaDateString(
    indiaNow
  );

}


function base64Encode(value) {

  const bytes =
    new TextEncoder().encode(value);

  let binary = "";

  const chunkSize = 0x8000;

  for (
    let i = 0;
    i < bytes.length;
    i += chunkSize
  ) {

    binary += String.fromCharCode(
      ...bytes.subarray(
        i,
        i + chunkSize
      )
    );

  }

  return btoa(binary);

}


async function githubRequest(
  env,
  path,
  options = {}
) {

  if (
    !env.GITHUB_TOKEN ||
    !env.GITHUB_OWNER ||
    !env.GITHUB_REPO
  ) {
    throw new Error(
      "GitHub backup configuration is missing: GITHUB_TOKEN, GITHUB_OWNER or GITHUB_REPO"
    );
  }

  const response =
    await fetch(
      `https://api.github.com/repos/${encodeURIComponent(
        env.GITHUB_OWNER
      )}/${encodeURIComponent(
        env.GITHUB_REPO
      )}/${path}`,
      {
        ...options,

        headers: {
          "Accept":
            "application/vnd.github+json",

          "Authorization":
            `Bearer ${env.GITHUB_TOKEN}`,

          "X-GitHub-Api-Version":
            "2026-03-10",

          "User-Agent":
            "Vidhwaan-Payment-Worker",

          "Content-Type":
            "application/json",

          ...(options.headers || {})
        }
      }
    );

  return response;
}

async function uploadJsonToGitHub(
  env,
  githubPath,
  content,
  message
) {

  const encoded =
    base64Encode(content);

  const existingResponse =
    await githubRequest(
      env,
      `contents/${githubPath}`,
      {
        method: "GET"
      }
    );

  let sha = null;

  if (existingResponse.ok) {

    const existing =
      await existingResponse.json();

    sha =
      existing.sha;

  } else if (
    existingResponse.status !== 404
  ) {

    const errorText =
      await existingResponse.text();

    throw new Error(
      `GitHub file lookup failed for ${githubPath}: ` +
      `${existingResponse.status} ${errorText}`
    );
  }

  const body = {
    message,
    content: encoded
  };

  if (sha) {
    body.sha = sha;
  }

  const response =
    await githubRequest(
      env,
      `contents/${githubPath}`,
      {
        method: "PUT",
        body:
          JSON.stringify(body)
      }
    );

  if (!response.ok) {

    const errorText =
      await response.text();

    throw new Error(
      `GitHub upload failed for ${githubPath}: ` +
      `${response.status} ${errorText}`
    );
  }

  console.log(
    `GitHub uploaded successfully: ${githubPath}`
  );

  return true;
}



async function backupPreviousDayInvoicesToGitHub(
  env
) {

  if (!env.INVOICES) {
    throw new Error(
      "Invoice R2 storage is not configured"
    );
  }

  const backupDate =
    getPreviousIndiaDate();

  let cursor = undefined;

  let totalR2Objects = 0;
  let jsonObjects = 0;
  let matchingInvoices = 0;
  let backedUp = 0;

  console.log(
    `Starting GitHub backup for yesterday: ${backupDate}`
  );

  do {

    const listOptions = {
      limit: 1000
    };

    if (cursor) {
      listOptions.cursor = cursor;
    }

    const result =
      await env.INVOICES.list(
        listOptions
      );

    for (
      const object of result.objects
    ) {

      totalR2Objects++;

      if (
        !object.key ||
        !object.key
          .toLowerCase()
          .endsWith(".json")
      ) {
        continue;
      }

      jsonObjects++;

      /*
       * R2 already provides the object's
       * upload timestamp in object.uploaded.
       *
       * We use this timestamp to determine
       * the Indian calendar date.
       *
       * IMPORTANT:
       * We do NOT open/read the JSON just
       * to find its date.
       */

      if (!object.uploaded) {
        console.error(
          `R2 object has no uploaded timestamp: ${object.key}`
        );
        continue;
      }

      const uploadedIndiaDate =
        getIndiaDateString(
          new Date(object.uploaded)
        );

      /*
       * ONLY yesterday's R2 objects.
       */

      if (
        uploadedIndiaDate !==
        backupDate
      ) {
        continue;
      }

      matchingInvoices++;

      /*
       * Only now do we read the JSON,
       * because this file has already been
       * confirmed as yesterday's invoice.
       */

      const r2Object =
        await env.INVOICES.get(
          object.key
        );

      if (!r2Object) {
        console.error(
          `R2 object not found: ${object.key}`
        );
        continue;
      }

      const content =
        await r2Object.text();

      /*
       * Validate that it is actually JSON
       * before sending it to GitHub.
       */

      try {
        JSON.parse(content);
      } catch (error) {
        console.error(
          `Invalid JSON skipped: ${object.key}`,
          error
        );
        continue;
      }

      const githubPath =
        `backup/${backupDate}/${object.key}`;

      await uploadJsonToGitHub(
        env,
        githubPath,
        content,
        `Backup invoices for ${backupDate}`
      );

      backedUp++;
    }

    cursor =
      result.truncated
        ? result.cursor
        : undefined;

  } while (cursor);

  console.log(
    `GitHub backup completed: ` +
    `date=${backupDate}, ` +
    `R2 objects=${totalR2Objects}, ` +
    `JSON objects=${jsonObjects}, ` +
    `yesterday invoices=${matchingInvoices}, ` +
    `uploaded=${backedUp}`
  );

  return {
    success: true,
    date: backupDate,
    checked: totalR2Objects,
    jsonObjects,
    matchingInvoices,
    backedUp
  };
}

/*
 * ============================================================
 * WORKER ROUTER
 * ============================================================
 */

export default {

  async scheduled(
    controller,
    env,
    ctx
  ) {

    try {

      console.log(
        `Cron triggered: ${controller.cron}`
      );

      const result =
        await backupPreviousDayInvoicesToGitHub(
          env
        );

      console.log(
        "GitHub daily backup successful:",
        JSON.stringify(result)
      );

    } catch (error) {

      console.error(
        "Scheduled GitHub backup failed:",
        error?.stack ||
        error?.message ||
        error
      );

      throw error;
    }
  },

  async fetch(
    request,
    env
  ) {
    try {
      const url =
        new URL(request.url);


      /*
       * --------------------------------------------------------
       * CORS PREFLIGHT
       * --------------------------------------------------------
       */

      if (
        request.method === "OPTIONS"
      ) {
        const origin =
          request.headers.get(
            "Origin"
          );

        if (
          origin &&
          !CORS_ORIGINS.has(origin)
        ) {
          return new Response(
            "Forbidden",
            {
              status: 403
            }
          );
        }

        const headers = {
          "Access-Control-Allow-Methods":
            "GET, POST, OPTIONS",

          "Access-Control-Allow-Headers":
            "Content-Type",

          "Access-Control-Max-Age":
            "86400",

          "X-Content-Type-Options":
            "nosniff"
        };

        if (origin) {
          headers[
            "Access-Control-Allow-Origin"
          ] = origin;

          headers["Vary"] =
            "Origin";
        }

        return new Response(
          null,
          {
            status: 204,
            headers
          }
        );
      }


      /*
       * --------------------------------------------------------
       * HEALTH
       * --------------------------------------------------------
       */

      if (
        url.pathname === "/health" &&
        request.method === "GET"
      ) {
        return healthResponse();
      }


      /*
       * --------------------------------------------------------
       * CREATE RAZORPAY ORDER
       * --------------------------------------------------------
       */

      if (
        url.pathname ===
          "/api/create-order" &&
        request.method === "POST"
      ) {
        const result =
          await createOrder(
            request,
            env
          );

        return jsonResponse(
          {
            success: true,
            ...result
          },
          200,
          request
        );
      }


      /*
       * --------------------------------------------------------
       * VERIFY + COMPLETE PAYMENT
       * --------------------------------------------------------
       */

      if (
        url.pathname ===
          "/api/verify-payment" &&
        request.method === "POST"
      ) {
        const result =
          await completePayment(
            request,
            env
          );

        return jsonResponse(
          result,
          200,
          request
        );
      }


      /*
       * --------------------------------------------------------
       * METHOD NOT ALLOWED
       * --------------------------------------------------------
       */

      if (
        url.pathname ===
          "/api/create-order" ||
        url.pathname ===
          "/api/verify-payment"
      ) {
        return jsonResponse(
          {
            success: false,
            error:
              "Method not allowed"
          },
          405,
          request
        );
      }


      /*
       * --------------------------------------------------------
       * NOT FOUND
       * --------------------------------------------------------
       */

      return jsonResponse(
        {
          success: false,
          error:
            "Not found"
        },
        404,
        request
      );


    } catch (error) {
      console.error(
        "Worker error:",
        error
      );


      const message =
        error instanceof Error
          ? error.message
          : "Internal server error";


      const safeErrors = new Set([
        "Invalid JSON request",
        "Invalid request",
        "Invalid app URL",
        "App URL must use HTTPS",
        "Invalid application URL",
        "Application ID is required",
        "Application is not registered",
        "Application URL does not match",
        "Terms & Conditions must be accepted",
        "State is required",
        "Invalid Indian State/UT",
        "Invalid email",
        "Invalid phone",
        "Invalid customer type",
        "Invalid GSTIN",
        "GSTIN does not match selected State/UT",
        "Payment session expired or not found",
        "Order data does not match",
        "Payment does not belong to this order",
        "Payment amount does not match order",
        "Invalid payment currency",
        "Payment has not been captured",
        "Razorpay order is not paid",
        "Paid amount does not match purchase amount",
        "Payment has already been processed"
      ]);


      const status =
        safeErrors.has(message)
          ? 400
          : 500;


      return jsonResponse(
        {
          success: false,
          error:
            message
        },
        status,
        request
      );
    }
  }
};
