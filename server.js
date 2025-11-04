const { google } = require('googleapis');
const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');

const app = express();

const HINH_THUC_MAP = {
    1: 'Gọi điện',
    2: 'Email',
    3: 'Trực tiếp'
};

app.use(bodyParser.json());
app.use(cors({ origin: 'https://www.onepasskr.com' }));

const SHEET_ID = '1JCULUXyRO5k3LDx_z2z0oCaUWZTNJzmiFzilXIbaq38';

const auth = new google.auth.GoogleAuth({
    credentials: JSON.parse(process.env.GOOGLE_SERVICE_KEY),
    scopes: ['https://www.googleapis.com/auth/spreadsheets']
});

const sheets = google.sheets({ version: 'v4', auth });

const HEADER = ['TenDichVu','TenHinhThuc','HoTen','Email','MaVung','SoDienThoai','TieuDe','NoiDung','HinhThucID','ChonNgay','Gio','NgayTao'];

async function ensureHeader() {
    try {
        const res = await sheets.spreadsheets.values.get({
            spreadsheetId: SHEET_ID,
            range: 'YeuCau!A1:L1'
        });

        if (!res.data.values || res.data.values.length === 0) {
            await sheets.spreadsheets.values.update({
                spreadsheetId: SHEET_ID,
                range: 'YeuCau!A1',
                valueInputOption: 'USER_ENTERED',
                resource: { values: [HEADER] }
            });
            console.log('✅ Header đã tạo');
        }
    } catch (err) {
        console.error('Lỗi ensureHeader:', err.message);
        throw err;
    }
}

function formatPhone(maVung, soDienThoai) {
    let mv = String(maVung).trim();
    if (!mv.startsWith('+')) mv = '+' + mv;

    let sd = String(soDienThoai).trim();
    if (!sd.startsWith('0')) sd = '0' + sd;

    mv = `'${mv}`;
    sd = `'${sd}`;

    return { MaVung: mv, SoDienThoai: sd };
}

async function addRowToSheet(data) {
    await ensureHeader();

    const values = [[
        data.TenDichVu || '',
        data.TenHinhThuc || '',
        data.HoTen || '',
        data.Email || '',
        data.MaVung || '',
        data.SoDienThoai || '',
        data.TieuDe || '',
        data.NoiDung || '',
        data.HinhThucID || '',
        data.ChonNgay || '',
        data.Gio || '',
        new Date().toLocaleString('vi-VN', { timeZone: 'Asia/Ho_Chi_Minh' })
    ]];

    console.log('📤 Gửi lên Google Sheets:', values[0]);

    await sheets.spreadsheets.values.append({
        spreadsheetId: SHEET_ID,
        range: 'YeuCau!A2',
        valueInputOption: 'USER_ENTERED',
        resource: { values }
    });
}


app.post('/api/tuvan', async (req, res) => {
    let { TenDichVu, HoTen, MaVung, SoDienThoai } = req.body;
    if (!TenDichVu || !HoTen || !MaVung || !SoDienThoai)
        return res.status(400).json({ error: "Thiếu dữ liệu bắt buộc" });

    ({ MaVung, SoDienThoai } = formatPhone(MaVung, SoDienThoai));

    try {
        await addRowToSheet({
            TenDichVu,
            TenHinhThuc:'',
            HoTen,
            Email:'',
            MaVung,
            SoDienThoai,
            TieuDe:'',
            NoiDung:'',
            HinhThucID:'',
            ChonNgay:'',
            Gio:''
        });
        res.json({ message: '✅ Lưu vào Google Sheet thành công!' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: err.message });
    }
});

app.post('/api/tuvangoidien', async (req, res) => {
    let { TenDichVu, HoTen, Email, MaVung, SoDienThoai, HinhThucID } = req.body;
    if (!HoTen || !MaVung || !SoDienThoai || !Email)
        return res.status(400).json({ error: "Thiếu dữ liệu bắt buộc" });

    ({ MaVung, SoDienThoai } = formatPhone(MaVung, SoDienThoai));
    HinhThucID = HinhThucID || 1; 
    const TenHinhThuc = HINH_THUC_MAP[HinhThucID];

    try {
        await addRowToSheet({
            TenDichVu: TenDichVu || '',
            TenHinhThuc,
            HoTen,
            Email,
            MaVung,
            SoDienThoai,
            TieuDe: '',
            NoiDung: '',
            HinhThucID,
            ChonNgay: '',
            Gio: ''
        });
        res.json({ message: '✅ Lưu vào Google Sheet thành công!' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: err.message });
    }
});

app.post('/api/tuvanemail', async (req, res) => {
    let { TenDichVu, HoTen, Email, MaVung, SoDienThoai, TieuDe, NoiDung, HinhThucID } = req.body;
    if (!HoTen || !MaVung || !SoDienThoai || !Email || !TieuDe || !NoiDung)
        return res.status(400).json({ error: "Thiếu dữ liệu bắt buộc" });

    ({ MaVung, SoDienThoai } = formatPhone(MaVung, SoDienThoai));
    HinhThucID = HinhThucID || 2; 

    try {
        await addRowToSheet({
            TenDichVu: TenDichVu || '',
            TenHinhThuc:'',
            HoTen,
            Email,
            MaVung,
            SoDienThoai,
            TieuDe,
            NoiDung,
            HinhThucID,
            ChonNgay:'',
            Gio:''
        });
        res.json({ message: '✅ Lưu vào Google Sheet thành công!' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: err.message });
    }
});

app.post('/api/tuvantructiep', async (req, res) => {
    let { TenDichVu, HoTen, Email, MaVung, SoDienThoai, ChonNgay, Gio, HinhThucID } = req.body;
    if (!HoTen || !MaVung || !SoDienThoai || !Email || !ChonNgay || !Gio)
        return res.status(400).json({ error: "Thiếu dữ liệu bắt buộc" });

    ({ MaVung, SoDienThoai } = formatPhone(MaVung, SoDienThoai));
    HinhThucID = HinhThucID || 3; 

    try {
        await addRowToSheet({
            TenDichVu: TenDichVu || '',
            TenHinhThuc:'',
            HoTen,
            Email,
            MaVung,
            SoDienThoai,
            TieuDe:'',
            NoiDung:'',
            HinhThucID,
            ChonNgay,
            Gio
        });
        res.json({ message: '✅ Lưu vào Google Sheet thành công!' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: err.message });
    }
});

app.post('/api/tuvandichvu', async (req, res) => {
    let { TenDichVu, HoTen, Email, MaVung, SoDienThoai } = req.body;

    if (!TenDichVu || !HoTen || !Email || !MaVung || !SoDienThoai) {
        return res.status(400).json({ error: "Thiếu dữ liệu bắt buộc" });
    }

    ({ MaVung, SoDienThoai } = formatPhone(MaVung, SoDienThoai));

    try {
        await addRowToSheet({
            TenDichVu,
            TenHinhThuc: '',
            HoTen,
            Email,
            MaVung,
            SoDienThoai,
            TieuDe: '',
            NoiDung: '',
            HinhThucID: '',
            ChonNgay: '',
            Gio: ''
        });
        res.json({ message: '✅ Lưu yêu cầu tư vấn dịch vụ thành công!' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: err.message });
    }
});
app.post("/api/save-email", async (req, res) => {
  const { email } = req.body;
  if (!email || !email.includes("@"))
    return res.status(400).json({ error: "Email không hợp lệ." });

  try {
    const client = await auth.getClient();
    const sheetsClient = google.sheets({ version: "v4", auth: client });
    const SHEET_NAME = "DanhSachEmail";

    // Header
    const readRes = await sheetsClient.spreadsheets.values.get({
      spreadsheetId: SHEET_ID,
      range: `${SHEET_NAME}!A1:B1`,
    });

    const rows = readRes.data.values || [];
    const hasHeader =
      rows.length > 0 &&
      rows[0][0]?.toLowerCase().includes("email") &&
      rows[0][1]?.toLowerCase().includes("time");

    if (!hasHeader) {
      await sheetsClient.spreadsheets.values.update({
        spreadsheetId: SHEET_ID,
        range: `${SHEET_NAME}!A1:B1`,
        valueInputOption: "RAW",
        requestBody: { values: [["Email", "Time"]] },
      });
      console.log("✅ Header được tạo cho DanhSachEmail");
    }

    // Ghi email
    await sheetsClient.spreadsheets.values.append({
      spreadsheetId: SHEET_ID,
      range: `${SHEET_NAME}!A:B`,
      valueInputOption: "RAW",
      insertDataOption: "INSERT_ROWS",
      requestBody: {
        values: [[email, new Date().toLocaleString("vi-VN", { timeZone: "Asia/Ho_Chi_Minh" })]],
      },
    });

    console.log(`✅ Email đã lưu: ${email}`);
    res.json({ message: "✅ Email đã được lưu thành công!" });
  } catch (err) {
    console.error("🔥 Lỗi /api/save-email:", err.message);
    res.status(500).json({ error: "Không thể lưu email." });
  }
});


const port = process.env.PORT || 3000;
app.listen(port, () => console.log(`Server chạy port ${port}`));
