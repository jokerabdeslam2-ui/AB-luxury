# متجر بريق — Bariq Store

واجهة متجر إلكتروني (React + Tailwind CSS) لبيع الخواتم والأساور النسائية، مع **لوحة تحكم داخلية** لاستقبال الطلبات فعليًا عبر قاعدة بيانات حقيقية (Supabase) — **بدون أي بطاقة بنكية أو دفعة مالية**.

---

## 1) التشغيل على جهازك

**المتطلب:** تثبيت [Node.js](https://nodejs.org) (نسخة 18 فأحدث).

```bash
npm install
npm run dev
```

لكن قبل أن تعمل الطلبات وتظهر في اللوحة، يجب إعداد Supabase أولًا (الخطوة التالية).

---

## 2) إعداد قاعدة البيانات (Supabase) — مرة واحدة فقط، ١٠ دقائق، بلا بطاقة

### أ) أنشئي مشروع Supabase
1. افتحي [supabase.com](https://supabase.com) ← **Start your project** ← سجّلي بحساب GitHub أو Google (مجاني، بدون بطاقة)
2. **New project** ← أعطيه اسمًا (مثلاً `bariq-store`) ← اختاري كلمة مرور لقاعدة البيانات (احفظيها في مكان آمن) ← اختاري أقرب منطقة سيرفر (مثلاً أوروبا) ← **Create new project**
3. استني دقيقة أو اثنتين حتى يجهز المشروع

### ب) أنشئي جدول الطلبات
1. من القائمة اليسار: **SQL Editor** ← **New query**
2. الصقي هذا الكود كاملًا واضغطي **Run**:

```sql
create table orders (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz default now(),
  full_name text not null,
  phone text not null,
  wilaya text not null,
  address text not null,
  notes text,
  payment text default 'cod',
  status text default 'جديد',
  items jsonb not null,
  total numeric not null
);

alter table orders enable row level security;

create policy "anyone can insert orders"
on orders for insert
to anon
with check (true);

create policy "authenticated users can read orders"
on orders for select
to authenticated
using (true);

create policy "authenticated users can update orders"
on orders for update
to authenticated
using (true);

create policy "authenticated users can delete orders"
on orders for delete
to authenticated
using (true);

alter publication supabase_realtime add table orders;
```

هذا الكود يبني جدول الطلبات، ويحمي البيانات (أي زبونة تقدر ترسل طلب، لكن فقط أنتِ بعد تسجيل الدخول تقدري تقرئي/تعدّلي/تحذفي الطلبات)، ويفعّل التحديث اللحظي في اللوحة.

### ج) أنشئي حسابك كأدمن
1. من القائمة اليسار: **Authentication** ← **Users** ← **Add user** ← **Create new user**
2. أدخلي بريدك وكلمة مرور، وفعّلي خيار **Auto Confirm User** (مهم، حتى تقدري تدخلي مباشرة بلا تأكيد إيميل)
3. احفظي البريد وكلمة المرور — بيهم غادي تدخلي للوحة التحكم `/admin`

### د) اربطي المشروع بالكود
1. من القائمة اليسار: **Project Settings** (⚙️) ← **API**
2. انسخي القيمتين: **Project URL** و **anon public key**
3. في مجلد المشروع، انسخي ملف `.env.example` وسمّيه `.env`، وعبّئي القيمتين:

```
VITE_SUPABASE_URL=...
VITE_SUPABASE_ANON_KEY=...
```

4. أعيدي تشغيل `npm run dev` بعد حفظ `.env`

---

## 3) لوحة التحكم

افتحي:
```
http://localhost:5173/admin
```
سجّلي الدخول بالبريد وكلمة المرور من الخطوة (ج). ستجدين فيها:
- كل الطلبات لحظيًا (تظهر فور إرسال الزبونة للطلب دون تحديث الصفحة)
- تغيير حالة الطلب (جديد، قيد التحضير، تم الشحن، تم التوصيل، ملغى)
- بحث بالاسم أو الهاتف، وتصفية حسب الحالة
- حذف الطلبات

**رابط `/admin` غير معلن في أي مكان بالموقع العام** — لا تشاركيه إلا مع من تثقين بهم، واحفظي كلمة المرور جيدًا.

---

## 4) بنية المشروع

```
bariq-store/
├── .env                   ← بياناتك لـ Supabase (لا تُشارك أو تُرفع لأي مكان عام)
├── tailwind.config.js     ← ألوان وخطوط الهوية
├── src/
│   ├── JewelryStore.jsx   ← واجهة المتجر (منتجات، سلة، نموذج الطلب)
│   ├── AdminDashboard.jsx ← لوحة التحكم (/admin)
│   ├── supabase.js        ← اتصال المشروع بـ Supabase
│   ├── index.css
│   └── App.jsx            ← التحويل بين المتجر ولوحة التحكم
└── public/
```

### تعديلات شائعة
- **المنتجات والأسعار:** مصفوفة `PRODUCTS` في `src/JewelryStore.jsx`
- **حالة توفر المنتج (نفدت الكمية / قريبًا):** غيّري حقل `status` لأي منتج داخل `PRODUCTS` إلى `"out_of_stock"` أو `"coming_soon"` (أو `"available"` ليعود عاديًا)
- **قائمة الولايات:** مصفوفة `WILAYAS` في نفس الملف
- **الألوان:** `tailwind.config.js`
- **حالات الطلب المتاحة في اللوحة:** مصفوفة `STATUSES` في `src/AdminDashboard.jsx`

---

## 5) نشر الموقع للجمهور (Deploy)

### Vercel (موصى به)
1. ادفعي المجلد إلى مستودع GitHub
2. من [vercel.com](https://vercel.com): **Add New Project** ← اختاري المستودع
3. في **Environment Variables** أضيفي `VITE_SUPABASE_URL` و `VITE_SUPABASE_ANON_KEY`
4. **Deploy** — رابط `/admin` سيعمل تلقائيًا بفضل ملف `vercel.json` المُضمّن

### Netlify
1. نفّذي `npm run build` (ينشئ مجلد `dist`)
2. من **Site settings → Environment variables** أضيفي نفس المتغيرين
3. اسحبي مجلد `dist` إلى [app.netlify.com/drop](https://app.netlify.com/drop)
   (ملف `public/_redirects` مُضمّن مسبقًا لجعل `/admin` يعمل بعد النشر)

**تذكير:** إن نسيتِ إضافة المتغيرين في لوحة Vercel/Netlify، سيبني الموقع بنجاح لكن الطلبات لن تُرسل.

---

## ملاحظة عن الحدود المجانية
مشروع Supabase المجاني يكفي متجرًا صغيرًا/متوسطًا بلا أي مشكلة (٥٠٠ ميغا تخزين، عدد غير محدود من الطلبات ضمن ذلك). الشيء الوحيد المهم: إذا مر المشروع **٧ أيام بلا أي نشاط** (لا زبونة أرسلت طلب ولا أنتِ فتحتِ اللوحة)، يتوقف تلقائيًا مؤقتًا — يكفي تدخلي للوحة Supabase وتضغطي "Restore" لإعادته، بلا فقدان أي بيانات.
