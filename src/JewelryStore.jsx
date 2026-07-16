import React, { useEffect, useState } from "react";
import { supabase } from "./supabase.js";
import {
  ShoppingBag,
  X,
  Plus,
  Minus,
  Menu,
  Instagram,
  Facebook,
  Phone,
  Mail,
  MapPin,
  Truck,
  ShieldCheck,
  Sparkles,
  Check,
  Loader2,
  AlertCircle,
} from "lucide-react";

/* ============================================================
   متجر "بريق" — إكسسوارات نسائية (خواتم وأساور)
   ------------------------------------------------------------
   ملاحظات للمطوّر:
   - المنتجات (الاسم، السعر، الصورة، الفئة، حالة التوفر) ما عادتش
     مكتوبة في الكود — تُدار بالكامل من لوحة التحكم /admin (تبويب
     "المنتجات"). هذا الملف فقط يقرأها من قاعدة البيانات ويعرضها.
   - لكل منتج بلا صورة مرفوعة بعد، يظهر رسم SVG بخط ذهبي بسيط
     (RingIcon / BraceletIcon) كبديل أنيق مؤقت.
   - قاعدة البيانات ولوحة التحكم تعملان عبر Supabase (بدون أي بطاقة بنكية).
     إعداداتها في src/supabase.js وملف .env — راجعي README.md للخطوات.
   - قائمة الولايات (WILAYAS) تحتوي على الولايات الـ58 المعروفة؛
     حدّثها إذا تغيّر التقسيم الإداري الرسمي.
   - ألوان وخطوط الهوية معرّفة مركزيًا في tailwind.config.js، وأنماط
     المكوّنات المركّبة (الأزرار، البطاقات...) في src/index.css.
   ============================================================ */

// ---------- نصوص شارات حالة التوفر ----------
// حقل status لكل منتج له 3 قيم فقط:
//   "available"    → متوفر عادي
//   "out_of_stock" → "نفدت الكمية" — يظهر شارة رمادية وزر "أضف إلى السلة" يتعطّل
//   "coming_soon"  → "قريبًا"      — يظهر شارة ذهبية وزر "أضف إلى السلة" يتعطّل
const STATUS_LABELS = {
  out_of_stock: "نفدت الكمية",
  coming_soon: "قريبًا",
};

// ---------- قائمة ولايات الجزائر ----------
const WILAYAS = [
  "أدرار", "الشلف", "الأغواط", "أم البواقي", "باتنة", "بجاية", "بسكرة", "بشار",
  "البليدة", "البويرة", "تمنراست", "تبسة", "تلمسان", "تيارت", "تيزي وزو", "الجزائر العاصمة",
  "الجلفة", "جيجل", "سطيف", "سعيدة", "سكيكدة", "سيدي بلعباس", "عنابة", "قالمة",
  "قسنطينة", "المدية", "مستغانم", "المسيلة", "معسكر", "ورقلة", "وهران", "البيض",
  "إليزي", "برج بوعريريج", "بومرداس", "الطارف", "تندوف", "تيسمسيلت", "الوادي", "خنشلة",
  "سوق أهراس", "تيبازة", "ميلة", "عين الدفلى", "النعامة", "عين تموشنت", "غرداية", "غليزان",
  "تيميمون", "برج باجي مختار", "أولاد جلال", "بني عباس", "عين صالح", "عين قزام",
  "تقرت", "جانت", "المغير", "المنيعة",
];

// ---------- أيقونة الخاتم (رسم بخط ذهبي بدل الصور) ----------
function RingIcon({ color = "#B78B4C", accent = "#F3DCE1" }) {
  return (
    <svg viewBox="0 0 120 120" className="w-full h-full" aria-hidden="true">
      <circle cx="60" cy="72" r="30" fill="none" stroke={color} strokeWidth="4" />
      <path
        d="M60 20 L75 41 L60 58 L45 41 Z"
        fill={accent}
        stroke={color}
        strokeWidth="3"
        strokeLinejoin="round"
      />
      <path d="M60 22 L60 56 M47 41 L73 41" stroke={color} strokeWidth="1.2" opacity="0.55" />
      <circle cx="90" cy="28" r="2.3" fill={color} opacity="0.6" />
      <circle cx="28" cy="24" r="1.6" fill={color} opacity="0.45" />
    </svg>
  );
}

// ---------- أيقونة السوار ----------
function BraceletIcon({ color = "#B78B4C", accent = "#F3DCE1" }) {
  return (
    <svg viewBox="0 0 120 120" className="w-full h-full" aria-hidden="true">
      <ellipse cx="60" cy="62" rx="42" ry="25" fill="none" stroke={color} strokeWidth="4" />
      <circle cx="60" cy="37" r="4.5" fill={accent} stroke={color} strokeWidth="2" />
      <circle cx="28" cy="48" r="2" fill={color} opacity="0.55" />
      <circle cx="92" cy="48" r="2" fill={color} opacity="0.55" />
      <circle cx="20" cy="66" r="1.6" fill={color} opacity="0.4" />
      <circle cx="100" cy="66" r="1.6" fill={color} opacity="0.4" />
    </svg>
  );
}

// ---------- غلاف بصري للمنتج: صورة حقيقية إن وُجدت، وإلا رسم SVG بديل ----------
function ProductVisual({ product }) {
  const Icon = product.category === "ring" ? RingIcon : BraceletIcon;
  const isUnavailable = product.status && product.status !== "available";

  if (product.image_url) {
    return (
      <div className="relative w-full aspect-square overflow-hidden bg-blush-light">
        {product.status === "out_of_stock" && (
          <span className="status-badge status-badge-out">{STATUS_LABELS.out_of_stock}</span>
        )}
        {product.status === "coming_soon" && (
          <span className="status-badge status-badge-soon">{STATUS_LABELS.coming_soon}</span>
        )}
        <img
          src={product.image_url}
          alt={product.name}
          className="w-full h-full object-cover"
          style={isUnavailable ? { opacity: 0.5, filter: "grayscale(0.3)" } : undefined}
          loading="lazy"
        />
      </div>
    );
  }

  return (
    <div
      className="relative w-full aspect-square flex items-center justify-center p-8"
      style={{ background: `linear-gradient(155deg, ${product.accent || "#F3DCE1"} 0%, #FFFFFF 75%)` }}
    >
      {product.status === "out_of_stock" && (
        <span className="status-badge status-badge-out">{STATUS_LABELS.out_of_stock}</span>
      )}
      {product.status === "coming_soon" && (
        <span className="status-badge status-badge-soon">{STATUS_LABELS.coming_soon}</span>
      )}
      <div className="w-28 h-28" style={isUnavailable ? { opacity: 0.45 } : undefined}>
        <Icon color={product.color || "#B78B4C"} accent="#FFFFFF" />
      </div>
    </div>
  );
}

// ---------- شعار المتجر: حرف "ب" داخل إطار خاتم ذهبي ----------
function LogoMark({ size = "w-10 h-10" }) {
  return (
    <div className={`${size} logo-mark shrink-0`} aria-hidden="true">
      <span className="font-display logo-letter">ب</span>
    </div>
  );
}

// ---------- فاصل زخرفي (خط ذهبي رفيع + معين صغير) ----------
function Divider() {
  return (
    <div className="flex items-center justify-center px-6 py-1" aria-hidden="true">
      <span className="divider-line" />
      <span className="divider-dot" />
      <span className="divider-line" />
    </div>
  );
}

export default function JewelryStore() {
  // ---------- بيانات المنتجات (تأتي من لوحة التحكم /admin عبر Supabase) ----------
  const [products, setProducts] = useState([]);
  const [productsLoading, setProductsLoading] = useState(true);

  useEffect(() => {
    const fetchProducts = async () => {
      console.log("1. جاري الاتصال بقاعدة البيانات...");
      
      const { data, error } = await supabase
        .from("products")
        .select("*")
        .order("created_at", { ascending: true });
      
      if (error) {
        console.error("2. خطأ من Supabase ❌:", error);
      } else {
        console.log("2. السلع اللي جابها Supabase ✅:", data);
      }

      if (!error) setProducts(data || []);
      setProductsLoading(false);
    };
    fetchProducts();

    const channel = supabase
      .channel("products-changes")
      .on("postgres_changes", { event: "*", schema: "public", table: "products" }, fetchProducts)
      .subscribe();
    return () => supabase.removeChannel(channel);
  }, []);


  // ---------- حالة السلة ----------
  const [cart, setCart] = useState([]); // [{id, qty}]
  const [cartOpen, setCartOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [activeCategory, setActiveCategory] = useState("all"); // all | ring | bracelet
  const [justAddedId, setJustAddedId] = useState(null);

  // ---------- حالة نموذج الطلب ----------
  const [form, setForm] = useState({
    fullName: "",
    phone: "",
    wilaya: "",
    address: "",
    notes: "",
    payment: "cod",
  });
  const [formErrors, setFormErrors] = useState({});
  const [orderPlaced, setOrderPlaced] = useState(false);
  const [orderSubmitting, setOrderSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState("");

  // ---------- عمليات السلة ----------
  const addToCart = (id) => {
    const product = products.find((p) => p.id === id);
    if (product?.status && product.status !== "available") return; // حماية إضافية: لا تُضاف منتجات نفدت أو "قريبًا"
    setCart((prev) => {
      const existing = prev.find((item) => item.id === id);
      if (existing) {
        return prev.map((item) => (item.id === id ? { ...item, qty: item.qty + 1 } : item));
      }
      return [...prev, { id, qty: 1 }];
    });
    setJustAddedId(id);
    window.clearTimeout(window.__bariqAddTimeout);
    window.__bariqAddTimeout = window.setTimeout(() => setJustAddedId(null), 1400);
  };

  const changeQty = (id, delta) => {
    setCart((prev) =>
      prev
        .map((item) => (item.id === id ? { ...item, qty: item.qty + delta } : item))
        .filter((item) => item.qty > 0)
    );
  };

  const removeFromCart = (id) => setCart((prev) => prev.filter((item) => item.id !== id));

  const cartItems = cart
    .map((item) => ({ ...item, product: products.find((p) => p.id === item.id) }))
    .filter((item) => item.product);

  const cartCount = cartItems.reduce((sum, item) => sum + item.qty, 0);
  const cartTotal = cartItems.reduce((sum, item) => sum + item.qty * item.product.price, 0);

  // ---------- التمرير إلى قسم معيّن ----------
  const scrollToSection = (id) => {
    setMobileMenuOpen(false);
    document.getElementById(id)?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  const goToCategory = (cat) => {
    setActiveCategory(cat);
    scrollToSection("products");
  };

  const visibleProducts =
    activeCategory === "all" ? products : products.filter((p) => p.category === activeCategory);

  // ---------- إرسال نموذج الطلب ----------
  const handleFormChange = (field, value) => setForm((prev) => ({ ...prev, [field]: value }));

  const handleSubmitOrder = async (e) => {
    e.preventDefault();
    const errors = {};
    if (!form.fullName.trim()) errors.fullName = "الاسم الكامل مطلوب";
    if (!/^0[5-7][0-9]{8}$/.test(form.phone.trim())) errors.phone = "أدخلي رقم هاتف جزائري صحيح";
    if (!form.wilaya) errors.wilaya = "يرجى اختيار الولاية";
    if (!form.address.trim()) errors.address = "العنوان مطلوب لتوصيل الطلب";
    if (cartItems.length === 0) errors.cart = "السلة فارغة، أضيفي منتجًا أولاً";

    setFormErrors(errors);
    setSubmitError("");
    if (Object.keys(errors).length > 0) return;

    // ---------- إرسال الطلب فعليًا إلى قاعدة البيانات (Supabase) ----------
    setOrderSubmitting(true);
    try {
      const { error } = await supabase.from("orders").insert({
        full_name: form.fullName.trim(),
        phone: form.phone.trim(),
        wilaya: form.wilaya,
        address: form.address.trim(),
        notes: form.notes.trim(),
        payment: "cod",
        status: "جديد",
        items: cartItems.map((item) => ({
          id: item.product.id,
          name: item.product.name,
          price: item.product.price,
          qty: item.qty,
        })),
        total: cartTotal,
      });
      if (error) throw error;
      setOrderPlaced(true);
      setCart([]);
      setForm({ fullName: "", phone: "", wilaya: "", address: "", notes: "", payment: "cod" });
    } catch (err) {
      setSubmitError(
        "تعذّر إرسال الطلب. تأكدي من اتصالك بالإنترنت، أو أن إعدادات Supabase مُفعّلة بشكل صحيح (راجعي README.md)."
      );
    } finally {
      setOrderSubmitting(false);
    }
  };

  return (
    <div dir="rtl" lang="ar" className="min-h-screen bg-ivory font-body text-charcoal">
      {/* ============ الهيدر (Header) ============ */}
      <header className="sticky top-0 z-40 bg-ivory/95 backdrop-blur border-b border-gold-soft">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          {/* الشعار */}
          <button
            onClick={() => scrollToSection("home")}
            className="flex items-center gap-2"
            aria-label="الانتقال إلى الصفحة الرئيسية"
          >
            <LogoMark />
            <span className="font-display text-xl text-charcoal">بريق</span>
          </button>

          {/* روابط التصفح (لشاشات الحاسوب) */}
          <nav className="hidden md:flex items-center gap-8" aria-label="أقسام المتجر">
            <button
              onClick={() => goToCategory("all")}
              className={`nav-link ${activeCategory === "all" ? "active" : ""}`}
            >
              الرئيسية
            </button>
            <button
              onClick={() => goToCategory("ring")}
              className={`nav-link ${activeCategory === "ring" ? "active" : ""}`}
            >
              الخواتم
            </button>
            <button
              onClick={() => goToCategory("bracelet")}
              className={`nav-link ${activeCategory === "bracelet" ? "active" : ""}`}
            >
              الأساور
            </button>
          </nav>

          {/* سلة المشتريات + قائمة الهاتف */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => setCartOpen(true)}
              className="relative p-2 text-charcoal hover:text-gold-dark transition-colors"
              aria-label={`سلة المشتريات، ${cartCount} منتج`}
            >
              <ShoppingBag size={24} strokeWidth={1.6} />
              {cartCount > 0 && (
                <span className="absolute -top-1 -left-1 bg-gold text-white text-xs font-bold w-5 h-5 rounded-full flex items-center justify-center">
                  {cartCount}
                </span>
              )}
            </button>
            <button
              onClick={() => setMobileMenuOpen((v) => !v)}
              className="md:hidden p-2 text-charcoal"
              aria-label="فتح قائمة التصفح"
              aria-expanded={mobileMenuOpen}
            >
              {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
          </div>
        </div>

        {/* قائمة الجوال المنسدلة */}
        {mobileMenuOpen && (
          <nav className="md:hidden border-t border-gold-soft bg-ivory px-4 py-3 flex flex-col gap-3" aria-label="أقسام المتجر (جوال)">
            <button onClick={() => goToCategory("all")} className="nav-link text-right py-1">الرئيسية</button>
            <button onClick={() => goToCategory("ring")} className="nav-link text-right py-1">الخواتم</button>
            <button onClick={() => goToCategory("bracelet")} className="nav-link text-right py-1">الأساور</button>
          </nav>
        )}
      </header>

      {/* ============ Hero Section ============ */}
      <section id="home" className="relative overflow-hidden">
        <div
          className="absolute inset-0"
          style={{ background: "linear-gradient(160deg, #F8ECEF 0%, #FBF8F3 55%, #FBF8F3 100%)" }}
          aria-hidden="true"
        />
        <div className="relative max-w-6xl mx-auto px-4 sm:px-6 py-16 sm:py-24 grid md:grid-cols-2 gap-10 items-center">
          <div className="text-center md:text-right order-2 md:order-1">
            <p className="text-gold-dark font-semibold tracking-wide mb-3 flex items-center justify-center md:justify-start gap-2">
              <Sparkles size={16} /> إكسسوارات نسائية راقية
            </p>
            <h1 className="font-display text-4xl sm:text-5xl leading-snug text-charcoal mb-5">
              بريقٌ يُكمل أناقتك
            </h1>
            <p className="text-charcoal-soft text-base sm:text-lg leading-loose mb-8 max-w-md mx-auto md:mx-0">
              خواتم وأساور مختارة بعناية لتلمسي رفاهية التفاصيل الصغيرة، بتصاميم بسيطة
              تدوم أناقتها. توصيل لكل ولايات الوطن مع الدفع عند الاستلام.
            </p>
            <button onClick={() => scrollToSection("products")} className="btn-primary">
              تسوقي الآن
              <ShoppingBag size={18} />
            </button>
          </div>

          {/* تركيبة زخرفية بديلة عن صورة فوتوغرافية */}
          <div className="order-1 md:order-2 flex items-center justify-center">
            <div className="relative w-64 h-64 sm:w-80 sm:h-80">
              <div className="absolute inset-0 rounded-full bg-blush opacity-70 blur-2xl" aria-hidden="true" />
              <div className="relative w-full h-full flex items-center justify-center animate-float">
                <div className="w-40 h-40 sm:w-48 sm:h-48">
                  <RingIcon color="#B78B4C" accent="#FFFFFF" />
                </div>
              </div>
              <div className="absolute bottom-2 left-0 w-24 h-24 sm:w-28 sm:h-28 animate-float" style={{ animationDelay: "1.2s" }}>
                <BraceletIcon color="#9C6B3E" accent="#F3DCE1" />
              </div>
            </div>
          </div>
        </div>
      </section>

      <Divider />

      {/* ============ شريط الثقة (تفاصيل تهم المتسوقة الجزائرية) ============ */}
      <section className="max-w-6xl mx-auto px-4 sm:px-6 py-8 grid grid-cols-1 sm:grid-cols-3 gap-6 text-center">
        <div className="flex flex-col items-center gap-2">
          <Truck size={26} className="text-gold-dark" strokeWidth={1.6} />
          <p className="text-sm font-medium">توصيل لكل الولايات</p>
        </div>
        <div className="flex flex-col items-center gap-2">
          <ShieldCheck size={26} className="text-gold-dark" strokeWidth={1.6} />
          <p className="text-sm font-medium">الدفع عند الاستلام</p>
        </div>
        <div className="flex flex-col items-center gap-2">
          <Sparkles size={26} className="text-gold-dark" strokeWidth={1.6} />
          <p className="text-sm font-medium">قطع مختارة بعناية</p>
        </div>
      </section>

      {/* ============ Featured Products ============ */}
      <section id="products" className="max-w-6xl mx-auto px-4 sm:px-6 py-10 sm:py-14">
        <div className="text-center mb-10">
          <h2 className="font-display text-3xl text-charcoal mb-2">مجموعتنا المختارة</h2>
          <p className="text-charcoal-soft">قطع تجمع بين البساطة والأناقة، بأسعار بالدينار الجزائري</p>
        </div>

        {/* أزرار تصفية سريعة (تعمل مع روابط الهيدر) */}
        <div className="flex items-center justify-center gap-3 mb-8">
          {[
            { key: "all", label: "الكل" },
            { key: "ring", label: "خواتم" },
            { key: "bracelet", label: "أساور" },
          ].map((f) => (
            <button
              key={f.key}
              onClick={() => setActiveCategory(f.key)}
              className={activeCategory === f.key ? "btn-primary" : "btn-outline"}
              style={{ padding: ".5rem 1.25rem", fontSize: ".875rem" }}
            >
              {f.label}
            </button>
          ))}
        </div>

        {productsLoading ? (
          <div className="flex justify-center py-16">
            <Loader2 size={28} className="animate-spin text-gold" />
          </div>
        ) : visibleProducts.length === 0 ? (
          <p className="text-center text-charcoal-soft py-16">
            لا توجد منتجات بعد — أضيفيها من لوحة التحكم /admin.
          </p>
        ) : (
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
            {visibleProducts.map((product) => (
              <div key={product.id} className="card-product flex flex-col">
                <ProductVisual product={product} />
                <div className="p-4 flex flex-col flex-1">
                  <h3 className="font-semibold text-charcoal mb-1">{product.name}</h3>
                  <p className="text-xs text-charcoal-soft mb-3 leading-relaxed flex-1">{product.description}</p>
                  <div className="flex items-center justify-between mb-3">
                    <span className="font-bold text-gold-dark">{product.price.toLocaleString("ar-DZ")} د.ج</span>
                  </div>
                  <button
                    onClick={() => addToCart(product.id)}
                    disabled={product.status && product.status !== "available"}
                    className="btn-primary justify-center w-full"
                    style={{ padding: ".6rem 1rem", fontSize: ".875rem" }}
                  >
                    {product.status === "out_of_stock" ? (
                      "نفدت الكمية"
                    ) : product.status === "coming_soon" ? (
                      "قريبًا"
                    ) : justAddedId === product.id ? (
                      <>
                        <Check size={16} /> أُضيف
                      </>
                    ) : (
                      <>
                        <ShoppingBag size={16} /> أضف إلى السلة
                      </>
                    )}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      <Divider />

      {/* ============ Checkout Section ============ */}
      <section id="checkout" className="max-w-4xl mx-auto px-4 sm:px-6 py-10 sm:py-14">
        <div className="text-center mb-8">
          <h2 className="font-display text-3xl text-charcoal mb-2">إتمام الطلب</h2>
          <p className="text-charcoal-soft">عبّئي بياناتك وسنتواصل معك لتأكيد الطلب قبل التوصيل</p>
        </div>

        {orderPlaced ? (
          <div className="bg-blush-light border border-gold-soft rounded-2xl p-8 text-center">
            <div className="w-14 h-14 rounded-full bg-gold flex items-center justify-center mx-auto mb-4">
              <Check size={28} className="text-white" />
            </div>
            <h3 className="font-display text-2xl mb-2">شكرًا لكِ، تم استلام طلبك</h3>
            <p className="text-charcoal-soft mb-4">
              سيتصل بكِ فريقنا قريبًا لتأكيد الطلب. الدفع سيكون عند الاستلام كما اخترتِ.
            </p>
            <button onClick={() => setOrderPlaced(false)} className="btn-outline">
              إتمام طلب جديد
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmitOrder} className="grid md:grid-cols-5 gap-8">
            {/* بيانات التوصيل */}
            <div className="md:col-span-3 flex flex-col gap-4">
              <div>
                <label className="block text-sm font-medium mb-1.5">الاسم الكامل</label>
                <input
                  type="text"
                  value={form.fullName}
                  onChange={(e) => handleFormChange("fullName", e.target.value)}
                  className={`input-field ${formErrors.fullName ? "input-error" : ""}`}
                  placeholder="مثال: أمينة بلقاسمي"
                />
                {formErrors.fullName && <p className="text-xs text-red-600 mt-1">{formErrors.fullName}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium mb-1.5">رقم الهاتف</label>
                <input
                  type="tel"
                  value={form.phone}
                  onChange={(e) => handleFormChange("phone", e.target.value)}
                  className={`input-field ${formErrors.phone ? "input-error" : ""}`}
                  placeholder="0555 12 34 56"
                  dir="ltr"
                />
                {formErrors.phone && <p className="text-xs text-red-600 mt-1">{formErrors.phone}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium mb-1.5">الولاية</label>
                <select
                  value={form.wilaya}
                  onChange={(e) => handleFormChange("wilaya", e.target.value)}
                  className={`input-field ${formErrors.wilaya ? "input-error" : ""}`}
                >
                  <option value="">اختاري الولاية</option>
                  {WILAYAS.map((w) => (
                    <option key={w} value={w}>{w}</option>
                  ))}
                </select>
                {formErrors.wilaya && <p className="text-xs text-red-600 mt-1">{formErrors.wilaya}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium mb-1.5">العنوان بالتفصيل</label>
                <input
                  type="text"
                  value={form.address}
                  onChange={(e) => handleFormChange("address", e.target.value)}
                  className={`input-field ${formErrors.address ? "input-error" : ""}`}
                  placeholder="الحي، الشارع، رقم المنزل"
                />
                {formErrors.address && <p className="text-xs text-red-600 mt-1">{formErrors.address}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium mb-1.5">ملاحظات إضافية (اختياري)</label>
                <textarea
                  value={form.notes}
                  onChange={(e) => handleFormChange("notes", e.target.value)}
                  className="input-field resize-none"
                  rows={3}
                  placeholder="أفضل وقت للتوصيل، علامة مميزة بالعنوان..."
                />
              </div>

              {/* طريقة الدفع — الدفع عند الاستلام كخيار أساسي */}
              <div>
                <label className="block text-sm font-medium mb-2">طريقة الدفع</label>
                <div className="flex flex-col gap-3">
                  <label className={`radio-card selected flex items-center justify-between`}>
                    <span className="flex items-center gap-2">
                      <input type="radio" name="payment" checked readOnly style={{ accentColor: "#B78B4C" }} />
                      <span className="font-medium">الدفع عند الاستلام</span>
                    </span>
                    <span className="badge-recommended">الأكثر طلبًا</span>
                  </label>
                  <label className="radio-card disabled flex items-center justify-between">
                    <span className="flex items-center gap-2">
                      <input type="radio" name="payment" disabled />
                      <span className="font-medium">تحويل بنكي / بريدي</span>
                    </span>
                    <span className="text-xs text-charcoal-soft">قريبًا</span>
                  </label>
                </div>
              </div>
            </div>

            {/* ملخص الطلب */}
            <div className="md:col-span-2">
              <div className="bg-white border border-gold-soft rounded-2xl p-5 sticky top-24">
                <h3 className="font-display text-xl mb-4">ملخص الطلب</h3>
                {cartItems.length === 0 ? (
                  <p className="text-sm text-charcoal-soft">لم تُضيفي أي منتج بعد.</p>
                ) : (
                  <div className="flex flex-col gap-3 mb-4">
                    {cartItems.map((item) => (
                      <div key={item.id} className="flex items-center justify-between text-sm">
                        <span>{item.product.name} × {item.qty}</span>
                        <span className="font-medium">
                          {(item.product.price * item.qty).toLocaleString("ar-DZ")} د.ج
                        </span>
                      </div>
                    ))}
                  </div>
                )}
                {formErrors.cart && <p className="text-xs text-red-600 mb-3">{formErrors.cart}</p>}
                <div className="border-t border-gold-soft pt-3 flex items-center justify-between mb-1">
                  <span className="font-semibold">المجموع</span>
                  <span className="font-bold text-gold-dark text-lg">
                    {cartTotal.toLocaleString("ar-DZ")} د.ج
                  </span>
                </div>
                <p className="text-xs text-charcoal-soft mb-4">
                  * رسوم التوصيل تُحدَّد حسب الولاية وتُدفع عند الاستلام
                </p>
                {submitError && (
                  <p className="flex items-start gap-1.5 text-xs text-red-600 mb-3">
                    <AlertCircle size={14} className="shrink-0 mt-0.5" /> {submitError}
                  </p>
                )}
                <button type="submit" disabled={orderSubmitting} className="btn-primary w-full justify-center">
                  {orderSubmitting ? (
                    <>
                      <Loader2 size={18} className="animate-spin" /> جارٍ الإرسال...
                    </>
                  ) : (
                    "تأكيد الطلب"
                  )}
                </button>
              </div>
            </div>
          </form>
        )}
      </section>

      {/* ============ Footer ============ */}
      <footer className="bg-footer text-blush-light mt-10">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-12 grid sm:grid-cols-3 gap-10">
          <div>
            <div className="flex items-center gap-2 mb-3">
              <LogoMark />
              <span className="font-display text-xl text-white">بريق</span>
            </div>
            <p className="text-sm leading-loose" style={{ color: "#D8C9B8" }}>
              إكسسوارات نسائية راقية — خواتم وأساور مختارة بعناية لتلمسي الفخامة
              في التفاصيل الصغيرة، بتوصيل لكل ولايات الجزائر.
            </p>
          </div>

          <div>
            <h4 className="text-white font-semibold mb-3">روابط سريعة</h4>
            <ul className="flex flex-col gap-2 text-sm" style={{ color: "#D8C9B8" }}>
              <li><button onClick={() => goToCategory("all")} className="hover:text-white transition-colors">الرئيسية</button></li>
              <li><button onClick={() => goToCategory("ring")} className="hover:text-white transition-colors">الخواتم</button></li>
              <li><button onClick={() => goToCategory("bracelet")} className="hover:text-white transition-colors">الأساور</button></li>
              <li><button onClick={() => scrollToSection("checkout")} className="hover:text-white transition-colors">إتمام الطلب</button></li>
            </ul>
          </div>

          <div>
            <h4 className="text-white font-semibold mb-3">تواصلي معنا</h4>
            <ul className="flex flex-col gap-2 text-sm mb-4" style={{ color: "#D8C9B8" }}>
              <li className="flex items-center gap-2"><Phone size={15} /> 0555 00 00 00</li>
              <li className="flex items-center gap-2"><Mail size={15} /> contact@bariq-dz.com</li>
              <li className="flex items-center gap-2"><MapPin size={15} /> الجزائر العاصمة، الجزائر</li>
            </ul>
            <div className="flex items-center gap-3">
              <a href="#" aria-label="صفحتنا على إنستغرام" className="social-icon"><Instagram size={17} /></a>
              <a href="#" aria-label="صفحتنا على فيسبوك" className="social-icon"><Facebook size={17} /></a>
            </div>
          </div>
        </div>
        <div className="border-t text-center text-xs py-4" style={{ borderColor: "rgba(255,255,255,0.1)", color: "#B8A990" }}>
          © {new Date().getFullYear()} بريق — جميع الحقوق محفوظة
        </div>
      </footer>

      {/* ============ سلة المشتريات (Drawer) ============ */}
      {cartOpen && (
        <div className="fixed inset-0 z-50 flex justify-start">
          <button
            className="absolute inset-0 bg-black/40"
            onClick={() => setCartOpen(false)}
            aria-label="إغلاق السلة"
          />
          <div className="relative w-full max-w-sm bg-ivory h-full shadow-2xl flex flex-col">
            <div className="flex items-center justify-between p-4 border-b border-gold-soft">
              <h3 className="font-display text-xl">سلة المشتريات</h3>
              <button onClick={() => setCartOpen(false)} aria-label="إغلاق" className="p-1">
                <X size={22} />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-4">
              {cartItems.length === 0 ? (
                <p className="text-sm text-charcoal-soft text-center mt-10">سلتك فارغة حاليًا</p>
              ) : (
                cartItems.map((item) => (
                  <div key={item.id} className="flex items-center gap-3 border-b border-gold-soft pb-4">
                    <div className="w-16 h-16 rounded-xl overflow-hidden shrink-0">
                      <ProductVisual product={item.product} />
                    </div>
                    <div className="flex-1">
                      <p className="font-medium text-sm">{item.product.name}</p>
                      <p className="text-xs text-gold-dark font-semibold mb-2">
                        {item.product.price.toLocaleString("ar-DZ")} د.ج
                      </p>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => changeQty(item.id, -1)}
                          className="w-6 h-6 rounded-full border border-gold-soft flex items-center justify-center"
                          aria-label="إنقاص الكمية"
                        >
                          <Minus size={12} />
                        </button>
                        <span className="text-sm w-4 text-center">{item.qty}</span>
                        <button
                          onClick={() => changeQty(item.id, 1)}
                          className="w-6 h-6 rounded-full border border-gold-soft flex items-center justify-center"
                          aria-label="زيادة الكمية"
                        >
                          <Plus size={12} />
                        </button>
                      </div>
                    </div>
                    <button
                      onClick={() => removeFromCart(item.id)}
                      className="p-1 text-charcoal-soft hover:text-red-600"
                      aria-label={`إزالة ${item.product.name}`}
                    >
                      <X size={16} />
                    </button>
                  </div>
                ))
              )}
            </div>

            {cartItems.length > 0 && (
              <div className="p-4 border-t border-gold-soft">
                <div className="flex items-center justify-between mb-3">
                  <span className="font-semibold">المجموع</span>
                  <span className="font-bold text-gold-dark">{cartTotal.toLocaleString("ar-DZ")} د.ج</span>
                </div>
                <button
                  onClick={() => {
                    setCartOpen(false);
                    scrollToSection("checkout");
                  }}
                  className="btn-primary w-full justify-center"
                >
                  إتمام الشراء
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
