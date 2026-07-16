import React, { useEffect, useState } from "react";
import {
  LogOut,
  Loader2,
  Package,
  Phone,
  MapPin,
  Trash2,
  Search,
  AlertCircle,
} from "lucide-react";
import { supabase } from "./supabase.js";

/* ============================================================
   لوحة تحكم الطلبات — /admin
   ------------------------------------------------------------
   - محمية بتسجيل دخول Supabase (بريد إلكتروني + كلمة مرور)، وليس
     كلمة مرور ثابتة داخل الكود، لأن الكود يصل لأي شخص يفتح الموقع.
   - أنشئي مستخدم الأدمن من: Supabase Dashboard → Authentication → Users
     (راجعي README.md للخطوات، لا يحتاج أي بطاقة بنكية).
   - رابط اللوحة لا يظهر في أي مكان بالموقع العام؛ فقط من يعرف
     الرابط (yoursite.com/admin) يصل لصفحة الدخول، والبيانات نفسها
     محمية بسياسات Row Level Security الموضّحة في README.md.
   ============================================================ */

const STATUSES = ["جديد", "قيد التحضير", "تم الشحن", "تم التوصيل", "ملغى"];

const STATUS_STYLES = {
  "جديد": "bg-amber-50 text-amber-700 border-amber-200",
  "قيد التحضير": "bg-blue-50 text-blue-700 border-blue-200",
  "تم الشحن": "bg-indigo-50 text-indigo-700 border-indigo-200",
  "تم التوصيل": "bg-green-50 text-green-700 border-green-200",
  "ملغى": "bg-red-50 text-red-700 border-red-200",
};

function LoginScreen() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    const { error: signInError } = await supabase.auth.signInWithPassword({
      email: email.trim(),
      password,
    });
    if (signInError) {
      setError("البريد أو كلمة المرور غير صحيحة، أو لم يتم إعداد Supabase بعد.");
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-ivory flex items-center justify-center px-4" dir="rtl" lang="ar">
      <form onSubmit={handleLogin} className="w-full max-w-sm bg-white border border-gold-soft rounded-2xl p-6 shadow-sm">
        <h1 className="font-display text-2xl text-charcoal mb-1 text-center">لوحة تحكم بريق</h1>
        <p className="text-sm text-charcoal-soft text-center mb-6">دخول مخصّص لصاحبة المتجر فقط</p>

        <label className="block text-sm font-medium mb-1.5">البريد الإلكتروني</label>
        <input
          type="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="input-field mb-4"
          dir="ltr"
          placeholder="admin@example.com"
        />

        <label className="block text-sm font-medium mb-1.5">كلمة المرور</label>
        <input
          type="password"
          required
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="input-field mb-4"
          dir="ltr"
        />

        {error && (
          <p className="flex items-center gap-1.5 text-sm text-red-600 mb-4">
            <AlertCircle size={15} /> {error}
          </p>
        )}

        <button type="submit" disabled={loading} className="btn-primary w-full justify-center">
          {loading ? <Loader2 size={18} className="animate-spin" /> : "تسجيل الدخول"}
        </button>
      </form>
    </div>
  );
}

function OrderCard({ order, onStatusChange, onDelete }) {
  const date = order.created_at ? new Date(order.created_at) : null;
  const dateLabel = date
    ? date.toLocaleString("ar-DZ", { dateStyle: "medium", timeStyle: "short" })
    : "—";

  return (
    <div className="bg-white border border-gold-soft rounded-2xl p-4 sm:p-5">
      <div className="flex flex-wrap items-start justify-between gap-2 mb-3">
        <div>
          <p className="font-semibold text-charcoal">{order.full_name}</p>
          <p className="text-xs text-charcoal-soft">{dateLabel}</p>
        </div>
        <span className={`text-xs font-semibold border rounded-full px-3 py-1 ${STATUS_STYLES[order.status] || ""}`}>
          {order.status}
        </span>
      </div>

      <div className="flex flex-col gap-1.5 text-sm text-charcoal-soft mb-3">
        <a href={`tel:${order.phone}`} className="flex items-center gap-2 hover:text-gold-dark w-fit" dir="ltr">
          <Phone size={14} /> {order.phone}
        </a>
        <p className="flex items-center gap-2">
          <MapPin size={14} className="shrink-0" /> {order.wilaya} — {order.address}
        </p>
        {order.notes && <p className="text-xs">ملاحظات: {order.notes}</p>}
      </div>

      <div className="border-t border-gold-soft pt-3 mb-3">
        <p className="text-xs font-semibold text-charcoal-soft mb-1.5 flex items-center gap-1.5">
          <Package size={14} /> المنتجات
        </p>
        <ul className="text-sm flex flex-col gap-1">
          {(order.items || []).map((item, idx) => (
            <li key={idx} className="flex items-center justify-between">
              <span>{item.name} × {item.qty}</span>
              <span>{(item.price * item.qty).toLocaleString("ar-DZ")} د.ج</span>
            </li>
          ))}
        </ul>
        <div className="flex items-center justify-between font-bold text-gold-dark mt-2 pt-2 border-t border-gold-soft">
          <span>المجموع</span>
          <span>{Number(order.total || 0).toLocaleString("ar-DZ")} د.ج</span>
        </div>
      </div>

      <div className="flex items-center gap-2">
        <select
          value={order.status}
          onChange={(e) => onStatusChange(order.id, e.target.value)}
          className="input-field flex-1 text-sm"
          style={{ padding: ".5rem .75rem" }}
        >
          {STATUSES.map((s) => (
            <option key={s} value={s}>{s}</option>
          ))}
        </select>
        <button
          onClick={() => onDelete(order.id)}
          className="p-2.5 rounded-xl border border-gold-soft text-charcoal-soft hover:text-red-600 hover:border-red-200 transition-colors"
          aria-label="حذف الطلب"
        >
          <Trash2 size={16} />
        </button>
      </div>
    </div>
  );
}

export default function AdminDashboard() {
  const [authLoading, setAuthLoading] = useState(true);
  const [session, setSession] = useState(null);
  const [orders, setOrders] = useState([]);
  const [ordersLoading, setOrdersLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState("الكل");
  const [search, setSearch] = useState("");

  // ---------- مراقبة حالة تسجيل الدخول ----------
  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      setAuthLoading(false);
    });
    const { data: listener } = supabase.auth.onAuthStateChange((_event, newSession) => {
      setSession(newSession);
    });
    return () => listener.subscription.unsubscribe();
  }, []);

  // ---------- جلب الطلبات والاستماع لتحديثاتها لحظيًا ----------
  const fetchOrders = async () => {
    const { data, error } = await supabase
      .from("orders")
      .select("*")
      .order("created_at", { ascending: false });
    if (!error) setOrders(data || []);
    setOrdersLoading(false);
  };

  useEffect(() => {
    if (!session) return;
    fetchOrders();

    // إعادة الجلب تلقائيًا عند أي تغيير في جدول الطلبات (طلب جديد، تعديل حالة، حذف)
    const channel = supabase
      .channel("orders-changes")
      .on("postgres_changes", { event: "*", schema: "public", table: "orders" }, () => {
        fetchOrders();
      })
      .subscribe();

    return () => supabase.removeChannel(channel);
  }, [session]);

  const handleStatusChange = async (orderId, status) => {
    await supabase.from("orders").update({ status }).eq("id", orderId);
  };

  const handleDelete = async (orderId) => {
    if (window.confirm("هل تريدين حذف هذا الطلب نهائيًا؟")) {
      await supabase.from("orders").delete().eq("id", orderId);
    }
  };

  const filteredOrders = orders.filter((o) => {
    const matchesStatus = statusFilter === "الكل" || o.status === statusFilter;
    const q = search.trim();
    const matchesSearch = !q || o.full_name?.includes(q) || o.phone?.includes(q);
    return matchesStatus && matchesSearch;
  });

  if (authLoading) {
    return (
      <div className="min-h-screen bg-ivory flex items-center justify-center">
        <Loader2 size={28} className="animate-spin text-gold" />
      </div>
    );
  }

  if (!session) return <LoginScreen />;

  return (
    <div dir="rtl" lang="ar" className="min-h-screen bg-ivory font-body text-charcoal">
      <header className="sticky top-0 z-10 bg-ivory/95 backdrop-blur border-b border-gold-soft">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <h1 className="font-display text-xl">لوحة تحكم بريق</h1>
          <button onClick={() => supabase.auth.signOut()} className="btn-outline" style={{ padding: ".5rem 1.1rem", fontSize: ".875rem" }}>
            <LogOut size={16} /> تسجيل الخروج
          </button>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 sm:px-6 py-6">
        {/* أدوات التصفية والبحث */}
        <div className="flex flex-col sm:flex-row gap-3 mb-6">
          <div className="relative flex-1">
            <Search size={16} className="absolute top-1/2 -translate-y-1/2 right-3 text-charcoal-soft" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="بحث بالاسم أو رقم الهاتف..."
              className="input-field"
              style={{ paddingRight: "2.25rem" }}
            />
          </div>
          <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="input-field sm:w-52">
            <option value="الكل">كل الحالات</option>
            {STATUSES.map((s) => (
              <option key={s} value={s}>{s}</option>
            ))}
          </select>
        </div>

        {ordersLoading ? (
          <div className="flex justify-center py-16">
            <Loader2 size={26} className="animate-spin text-gold" />
          </div>
        ) : filteredOrders.length === 0 ? (
          <p className="text-center text-charcoal-soft py-16">لا توجد طلبات مطابقة حاليًا.</p>
        ) : (
          <div className="grid sm:grid-cols-2 gap-4">
            {filteredOrders.map((order) => (
              <OrderCard key={order.id} order={order} onStatusChange={handleStatusChange} onDelete={handleDelete} />
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
