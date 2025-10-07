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
app.use(cors({ origin: 'https://onepass-xi.vercel.app' }));


const SHEET_ID = '1JCULUXyRO5k3LDx_z2z0oCaUWZTNJzmiFzilXIbaq38';
const SERVICE_ACCOUNT_FILE = process.env.GOOGLE_SERVICE_KEY;

const auth = new google.auth.GoogleAuth({
    keyFile: SERVICE_ACCOUNT_FILE,
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
        new Date().toLocaleString()
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
        await addRowToSheet({ TenDichVu, TenHinhThuc:'', HoTen, Email:'', MaVung, SoDienThoai, TieuDe:'', NoiDung:'', HinhThucID:'', ChonNgay:'', Gio:'' });
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
        await addRowToSheet({ TenDichVu: TenDichVu || '', TenHinhThuc:'', HoTen, Email, MaVung, SoDienThoai, TieuDe, NoiDung, HinhThucID, ChonNgay:'', Gio:'' });
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
        await addRowToSheet({ TenDichVu: TenDichVu || '', TenHinhThuc:'', HoTen, Email, MaVung, SoDienThoai, TieuDe:'', NoiDung:'', HinhThucID, ChonNgay, Gio });
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

    // Chuẩn hóa số điện thoại và mã vùng
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
const port = 3000;
app.listen(port, () => console.log(`Server chạy port ${port}`));
