import { BookOpen, LayoutDashboard, GraduationCap, Users, CheckCircle, Camera, FileText, Upload, Smartphone } from 'lucide-react'

interface PlaceholderProps {
  label: string
  hint?: string
  tall?: boolean
}

function ScreenshotPlaceholder({ label, hint, tall }: PlaceholderProps) {
  return (
    <div className={`w-full rounded-xl border-2 border-dashed border-gray-300 bg-gray-50 flex flex-col items-center justify-center gap-2 text-center px-4 ${tall ? 'min-h-64' : 'min-h-40'}`}>
      <Camera size={24} className="text-gray-300" />
      <p className="text-sm font-bold text-gray-400">{label}</p>
      {hint && <p className="text-xs text-gray-400">{hint}</p>}
    </div>
  )
}

interface StepProps {
  number: number
  text: string
}

function Step({ number, text }: StepProps) {
  return (
    <li className="flex items-start gap-3">
      <span className="shrink-0 w-6 h-6 rounded-full bg-blue-600 text-white text-xs font-bold flex items-center justify-center mt-0.5">{number}</span>
      <span className="text-sm text-gray-700 leading-relaxed">{text}</span>
    </li>
  )
}

interface SectionProps {
  icon: React.ReactNode
  title: string
  badge?: string
  description: string
  children: React.ReactNode
}

function Section({ icon, title, badge, description, children }: SectionProps) {
  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
      <div className="flex items-center gap-3 px-6 py-4 border-b border-gray-100 bg-gray-50">
        <div className="w-9 h-9 rounded-lg bg-blue-100 flex items-center justify-center text-blue-600">{icon}</div>
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <h2 className="text-base font-bold text-gray-900">{title}</h2>
            {badge && <span className="rounded-full bg-blue-100 text-blue-700 text-xs font-bold px-2 py-0.5">{badge}</span>}
          </div>
          <p className="text-xs text-gray-500 mt-0.5">{description}</p>
        </div>
      </div>
      <div className="p-6">{children}</div>
    </div>
  )
}

export function HowTo() {
  return (
    <div className="p-4 sm:p-6 max-w-3xl mx-auto space-y-6 pb-16">
      {/* Page header */}
      <div className="flex items-center gap-3">
        <BookOpen size={24} className="text-gray-700" />
        <div>
          <h1 className="text-xl font-bold text-gray-900">คู่มือการใช้งาน</h1>
          <p className="text-sm text-gray-500">ระบบแจก iPad โรงเรียนภูเขียว</p>
        </div>
      </div>

      {/* ── 1. Dashboard ─────────────────────────────────────────────────────── */}
      <Section
        icon={<LayoutDashboard size={18} />}
        title="หน้า Dashboard"
        badge="หน้าแรก"
        description="ภาพรวมสถิติการแจก iPad ทั้งหมด"
      >
        <div className="grid md:grid-cols-2 gap-6">
          <div className="space-y-4">
            <ol className="space-y-3">
              <Step number={1} text="เปิดระบบ จะเข้าสู่หน้า Dashboard โดยอัตโนมัติ" />
              <Step number={2} text="ดูจำนวนนักเรียนและครูทั้งหมดที่แสดงในการ์ดสถิติ" />
              <Step number={3} text="ตรวจสอบยอดจับคู่แล้ว / ส่งมอบแล้ว / รอดำเนินการ" />
              <Step number={4} text="ข้อมูลอัปเดตอัตโนมัติทุกครั้งที่มีการเปลี่ยนแปลง" />
            </ol>
          </div>
          <ScreenshotPlaceholder label="ภาพหน้า Dashboard" hint="วางภาพหน้าจอ Dashboard ที่นี่" tall />
        </div>
      </Section>

      {/* ── 2. Students ──────────────────────────────────────────────────────── */}
      <Section
        icon={<GraduationCap size={18} />}
        title="หน้านักเรียน"
        description="จัดการการจับคู่ iPad ให้นักเรียน"
      >
        <div className="space-y-6">
          {/* Filter */}
          <div>
            <h3 className="text-sm font-bold text-gray-800 mb-3">การค้นหาและกรองข้อมูล</h3>
            <div className="grid md:grid-cols-2 gap-4">
              <ol className="space-y-3">
                <Step number={1} text="พิมพ์ชื่อหรือรหัสนักเรียนในช่องค้นหา" />
                <Step number={2} text="กรองตามชั้น / ห้อง / สถานะ โดยใช้ dropdown" />
                <Step number={3} text="กด 'ล้างตัวกรอง' เพื่อแสดงทั้งหมด" />
              </ol>
              <ScreenshotPlaceholder label="แถบค้นหาและกรอง" hint="วางภาพแถบ filter ที่นี่" />
            </div>
          </div>

          <div className="border-t border-gray-100 pt-5">
            <h3 className="text-sm font-bold text-gray-800 mb-3">การจับคู่ iPad (ปุ่ม จับคู่)</h3>
            <div className="grid md:grid-cols-2 gap-4">
              <ol className="space-y-3">
                <Step number={1} text="กดปุ่มสีน้ำเงิน 'จับคู่' ในแถวนักเรียนที่ยังไม่มีเครื่อง" />
                <Step number={2} text="กรอก Serial Number โดยพิมพ์หรือสแกน Barcode" />
                <Step number={3} text="กรอกชื่อครูที่ปรึกษาในช่อง 'ครูที่ปรึกษา'" />
                <Step number={4} text="กด 'บันทึก' เพื่อยืนยันการจับคู่" />
              </ol>
              <ScreenshotPlaceholder label="หน้าต่างจับคู่ iPad" hint="วางภาพ popup จับคู่ที่นี่" />
            </div>
          </div>

          <div className="border-t border-gray-100 pt-5">
            <h3 className="text-sm font-bold text-gray-800 mb-3">การยืนยันส่งมอบ (ปุ่ม ยืนยัน)</h3>
            <div className="grid md:grid-cols-2 gap-4">
              <ol className="space-y-3">
                <Step number={1} text="หลังจับคู่แล้ว สถานะจะเปลี่ยนเป็น 'จับคู่แล้ว' และปุ่มสีเขียว 'ยืนยัน' จะปรากฏ" />
                <Step number={2} text="กดปุ่ม 'ยืนยัน' เพื่อเปิดหน้ายืนยันในแท็บใหม่" />
                <Step number={3} text="ดำเนินการยืนยันในหน้าที่เปิดขึ้นมา (ดูหัวข้อ 'หน้ายืนยันรับ iPad')" />
              </ol>
              <ScreenshotPlaceholder label="ปุ่มสถานะในตารางนักเรียน" hint="วางภาพแถวนักเรียนพร้อมปุ่มที่นี่" />
            </div>
          </div>
        </div>
      </Section>

      {/* ── 3. Teachers ──────────────────────────────────────────────────────── */}
      <Section
        icon={<Users size={18} />}
        title="หน้าครู"
        description="จัดการการจับคู่ iPad ให้ครู"
      >
        <div className="grid md:grid-cols-2 gap-6">
          <div className="space-y-4">
            <ol className="space-y-3">
              <Step number={1} text="กด 'เพิ่มครู' เพื่อเพิ่มรายชื่อครูใหม่ (ชื่อ, อีเมล, กลุ่มสาระ)" />
              <Step number={2} text="กรองครูตามกลุ่มสาระหรือสถานะได้จาก dropdown" />
              <Step number={3} text="กด 'จับคู่' และกรอก Serial Number เพื่อมอบ iPad ให้ครู" />
              <Step number={4} text="กด 'ยืนยัน' เพื่อเปิดหน้ายืนยันส่งมอบ (เหมือนหน้านักเรียน)" />
              <Step number={5} text="กดปุ่ม 'ลบ' เพื่อลบรายชื่อครูออกจากระบบ" />
            </ol>
          </div>
          <ScreenshotPlaceholder label="หน้าครู" hint="วางภาพหน้าจอหน้าครูที่นี่" tall />
        </div>
      </Section>

      {/* ── 4. Confirm ───────────────────────────────────────────────────────── */}
      <Section
        icon={<CheckCircle size={18} />}
        title="หน้ายืนยันรับ iPad"
        badge="/confirm/..."
        description="หน้าสำหรับถ่ายภาพและยืนยันการส่งมอบ — เปิดในแท็บใหม่"
      >
        <div className="space-y-6">
          <div className="grid md:grid-cols-2 gap-4">
            <ol className="space-y-3">
              <Step number={1} text="หน้านี้เปิดโดยอัตโนมัติเมื่อกดปุ่ม 'ยืนยัน' จากหน้านักเรียนหรือครู" />
              <Step number={2} text="ตรวจสอบข้อมูลอุปกรณ์และผู้รับให้ถูกต้อง" />
              <Step number={3} text="ถ่ายภาพหลักฐานโดยกด 'ถ่ายจากกล้อง' หรือ 'เลือกจากแกลเลอรี่'" />
              <Step number={4} text="กรอกชื่อผู้ส่งมอบ (ครูที่ปรึกษา/กรรมการ)" />
              <Step number={5} text="กด 'ยืนยันรับเครื่องแล้ว' เพื่อบันทึก" />
              <Step number={6} text="หลังยืนยันสำเร็จ กด 'ปิดแท็บนี้' เพื่อปิดหน้า" />
            </ol>
            <div className="space-y-3">
              <ScreenshotPlaceholder label="หน้าฟอร์มยืนยัน" hint="วางภาพฟอร์มก่อนยืนยันที่นี่" />
              <ScreenshotPlaceholder label="หน้าสำเร็จหลังยืนยัน" hint="วางภาพหน้า success ที่นี่" />
            </div>
          </div>
          <div className="rounded-xl bg-yellow-50 border border-yellow-200 px-4 py-3">
            <p className="text-xs font-bold text-yellow-800">หมายเหตุ</p>
            <p className="text-xs text-yellow-700 mt-0.5">ต้องถ่ายภาพหลักฐานก่อนจึงจะกดยืนยันได้ — ภาพจะถูกบันทึกเป็นหลักฐานในระบบ</p>
          </div>
        </div>
      </Section>

      {/* ── 5. Student Upload ────────────────────────────────────────────────── */}
      <Section
        icon={<Smartphone size={18} />}
        title="หน้าส่งภาพนักเรียน"
        badge="/student-upload"
        description="นักเรียนส่งภาพหลักฐานการรับ iPad ด้วยตนเอง"
      >
        <div className="space-y-6">
          <div className="grid md:grid-cols-2 gap-4">
            <div className="space-y-4">
              <div>
                <h3 className="text-sm font-bold text-gray-800 mb-3">ขั้นตอนสำหรับนักเรียน</h3>
                <ol className="space-y-3">
                  <Step number={1} text="เปิด URL: http://[ที่อยู่เซิร์ฟเวอร์]/student-upload" />
                  <Step number={2} text="กรอกรหัสนักเรียน (Student ID)" />
                  <Step number={3} text="กรอกเลขประจำตัวประชาชน 13 หลัก" />
                  <Step number={4} text="กด 'เข้าสู่ระบบ' — ระบบจะแสดงข้อมูลของนักเรียน" />
                  <Step number={5} text="ถ่ายภาพ 1–3 ภาพ: ภาพนักเรียนพร้อม iPad, ภาพกับผู้ปกครอง ฯลฯ" />
                  <Step number={6} text="กด 'ส่งภาพหลักฐาน' เพื่อบันทึก" />
                </ol>
              </div>
              <div className="rounded-xl bg-blue-50 border border-blue-200 px-4 py-3">
                <p className="text-xs font-bold text-blue-800">สำหรับผู้ดูแลระบบ</p>
                <p className="text-xs text-blue-700 mt-0.5">แชร์ลิงก์หน้านี้ให้นักเรียนทาง Line, QR Code หรือ Google Classroom</p>
              </div>
            </div>
            <div className="space-y-3">
              <ScreenshotPlaceholder label="หน้าล็อกอินนักเรียน" hint="วางภาพหน้าล็อกอินที่นี่" />
              <ScreenshotPlaceholder label="หน้าอัปโหลดภาพ" hint="วางภาพหน้าอัปโหลดที่นี่" />
            </div>
          </div>
        </div>
      </Section>

      {/* ── 6. Import CSV ────────────────────────────────────────────────────── */}
      <Section
        icon={<Upload size={18} />}
        title="นำเข้าข้อมูลนักเรียน (Import CSV)"
        badge="นักเรียน → Import CSV"
        description="อัปโหลดรายชื่อนักเรียนจากไฟล์ CSV"
      >
        <div className="grid md:grid-cols-2 gap-6">
          <div className="space-y-4">
            <ol className="space-y-3">
              <Step number={1} text="ไปที่หน้า 'นักเรียน' แล้วกดปุ่ม 'Import CSV' มุมขวาบน" />
              <Step number={2} text="เตรียมไฟล์ CSV ให้มีคอลัมน์: student_id, name, national_id, grade, class_room" />
              <Step number={3} text="ลากไฟล์มาวาง หรือกด 'เลือกไฟล์' เพื่อเลือกไฟล์ CSV" />
              <Step number={4} text="ระบบจะแสดงตัวอย่างข้อมูล ตรวจสอบให้ถูกต้อง" />
              <Step number={5} text="กด 'นำเข้า' เพื่อบันทึกข้อมูลลงระบบ" />
              <Step number={6} text="นักเรียนที่มีรหัสซ้ำจะถูกข้ามโดยอัตโนมัติ" />
            </ol>
            <div className="rounded-xl bg-gray-50 border border-gray-200 px-4 py-3">
              <p className="text-xs font-bold text-gray-700 mb-1.5">ตัวอย่างหัวคอลัมน์ CSV</p>
              <code className="text-xs text-gray-600 font-mono block">student_id, name, national_id, grade, class_room</code>
              <code className="text-xs text-gray-500 font-mono block mt-0.5">12345, นายทดสอบ ระบบ, 1234567890123, 4, 1</code>
            </div>
          </div>
          <ScreenshotPlaceholder label="หน้า Import CSV" hint="วางภาพหน้า import ที่นี่" tall />
        </div>
      </Section>

      {/* ── 7. Reports ───────────────────────────────────────────────────────── */}
      <Section
        icon={<FileText size={18} />}
        title="หน้ารายงาน"
        description="ดูสรุปและส่งออกข้อมูลการแจก iPad"
      >
        <div className="grid md:grid-cols-2 gap-6">
          <ol className="space-y-3">
            <Step number={1} text="เข้าเมนู 'รายงาน' จากแถบด้านซ้าย" />
            <Step number={2} text="ดูตารางสรุปการแจกแยกตามชั้น/ห้อง" />
            <Step number={3} text="กรองข้อมูลตามสถานะหรือประเภทผู้รับ" />
            <Step number={4} text="กด 'Export' เพื่อดาวน์โหลดข้อมูลเป็น CSV" />
          </ol>
          <ScreenshotPlaceholder label="หน้ารายงาน" hint="วางภาพหน้าจอรายงานที่นี่" tall />
        </div>
      </Section>

      {/* ── Footer note ──────────────────────────────────────────────────────── */}
      <div className="rounded-xl bg-gray-100 border border-gray-200 px-5 py-4 text-center">
        <p className="text-xs text-gray-500">หากมีปัญหาการใช้งาน กรุณาติดต่อผู้ดูแลระบบ</p>
        <p className="text-xs text-gray-400 mt-0.5">ระบบแจก iPad · โรงเรียนภูเขียว</p>
      </div>
    </div>
  )
}
