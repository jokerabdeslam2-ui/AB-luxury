import JewelryStore from "./JewelryStore.jsx";
import AdminDashboard from "./AdminDashboard.jsx";

// نقطة الدخول: صفحة المتجر للجميع، ولوحة التحكم فقط عبر الرابط /admin
// (الرابط غير معلن في أي مكان بالموقع العام؛ لا تشاركيه إلا مع من تثقين بهم)
export default function App() {
  const isAdmin = window.location.pathname.replace(/\/+$/, "") === "/admin";
  return isAdmin ? <AdminDashboard /> : <JewelryStore />;
}
