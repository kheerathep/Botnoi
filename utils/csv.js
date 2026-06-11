// ==============================================
// utils/csv.js — จัดการอ่าน/เขียนไฟล์ CSV
// ==============================================

const fs = require("fs");
const path = require("path");

// กำหนด path ของโฟลเดอร์ data และไฟล์ interns.csv
const DATA_DIR = path.join(__dirname, "..", "data");
const CSV_PATH = path.join(DATA_DIR, "interns.csv");

// หัวตาราง CSV (BOM + Header)
const CSV_HEADER = '\uFEFF"ชื่อจริง","ชื่อเล่น","อายุ","ตำแหน่ง","ระยะเวลาการฝึกงาน","มหาลัย","Discord ID"\n';


/**
 * ตรวจสอบว่าไฟล์ CSV มีอยู่แล้วหรือยัง ถ้าไม่มีจะสร้างให้พร้อม Header
 */
function ensureCSVExists() {
    if (!fs.existsSync(DATA_DIR)) {
        fs.mkdirSync(DATA_DIR, { recursive: true });
    }
    if (!fs.existsSync(CSV_PATH)) {
        fs.writeFileSync(CSV_PATH, CSV_HEADER);
    }
}


/**
 * แยกข้อมูล 1 บรรทัด CSV ให้เป็น Array — รองรับ escaped quotes ("")
 * @param {string} str - บรรทัด CSV
 * @returns {string[]} Array ของแต่ละ cell
 */
function parseCSVRow(str) {
    const result = [];
    let cell = "";
    let inQuotes = false;

    for (let i = 0; i < str.length; i++) {
        const char = str[i];
        if (inQuotes) {
            if (char === '"') {
                if (str[i + 1] === '"') {
                    cell += '"';
                    i++;
                } else {
                    inQuotes = false;
                }
            } else {
                cell += char;
            }
        } else {
            if (char === '"') {
                inQuotes = true;
            } else if (char === ",") {
                result.push(cell);
                cell = "";
            } else {
                cell += char;
            }
        }
    }
    result.push(cell);
    return result;
}


/**
 * เพิ่มข้อมูล intern 1 รายการลงไฟล์ CSV
 * @param {object} data - ข้อมูล intern
 * @param {string} data.name - ชื่อจริง
 * @param {string} data.nickname - ชื่อเล่น
 * @param {string} data.age - อายุ
 * @param {string} data.position - ตำแหน่ง
 * @param {string} data.duration - ระยะเวลาการฝึกงาน
 * @param {string} data.university - มหาลัย
 * @param {string} data.discordId - Discord User ID
 */
function appendIntern(data) {
    ensureCSVExists();

    const row = [
        data.name,
        data.nickname,
        data.age,
        data.position,
        data.duration,
        data.university,
        data.discordId || "-",
    ];

    // แปลงเป็น CSV format พร้อม escape เครื่องหมายคำพูด
    const csvLine = row.map((v) => `"${v.replace(/"/g, '""')}"`).join(",") + "\n";
    fs.appendFileSync(CSV_PATH, csvLine);
}


/**
 * นับจำนวน intern ทั้งหมดในไฟล์ CSV (ไม่นับ Header)
 * @returns {number} จำนวน intern
 */
function countInterns() {
    ensureCSVExists();

    const content = fs.readFileSync(CSV_PATH, "utf-8");
    // ลบ BOM แล้วแยกบรรทัด กรองบรรทัดว่าง แล้วลบ Header (-1)
    const lines = content
        .replace(/^\uFEFF/, "")
        .split(/\r?\n/)
        .filter((line) => line.trim() !== "");

    return Math.max(0, lines.length - 1);
}


/**
 * อ่านข้อมูล intern ทั้งหมดจากไฟล์ CSV
 * @returns {object[]} Array ของข้อมูล intern
 */
function readAllInterns() {
    ensureCSVExists();

    const content = fs.readFileSync(CSV_PATH, "utf-8");
    const lines = content
        .replace(/^\uFEFF/, "")
        .split(/\r?\n/)
        .filter((line) => line.trim() !== "");

    // ข้ามบรรทัด Header (index 0)
    const interns = [];
    for (let i = 1; i < lines.length; i++) {
        const row = parseCSVRow(lines[i]);
        if (row.length >= 6) {
            interns.push({
                name: row[0].trim(),
                nickname: row[1].trim(),
                age: row[2].trim(),
                position: row[3].trim(),
                duration: row[4].trim(),
                university: row[5].trim(),
                discordId: row[6] ? row[6].trim() : null,
            });
        }
    }
    return interns;
}

/**
 * ค้นหาข้อมูล intern จาก Discord ID
 * @param {string} discordId 
 * @returns {object|null}
 */
function findIntern(discordId) {
    if (!discordId) return null;
    const all = readAllInterns();
    // ค้นหาคนที่มี discordId ตรงกัน (ดึงคนล่าสุด ถ้ามีซ้ำ)
    for (let i = all.length - 1; i >= 0; i--) {
        if (all[i].discordId === discordId) {
            return all[i];
        }
    }
    return null;
}

/**
 * อัปเดตข้อมูล intern ด้วย Discord ID (จะแทนที่บรรทัดล่าสุดที่ตรงกัน)
 * @param {string} discordId 
 * @param {object} newData 
 */
function updateIntern(discordId, newData) {
    ensureCSVExists();
    
    const content = fs.readFileSync(CSV_PATH, "utf-8");
    const lines = content.replace(/^\uFEFF/, "").split(/\r?\n/);
    
    // หาบรรทัดล่าสุดที่ข้อมูลตรงกับ discordId
    let targetIndex = -1;
    for (let i = lines.length - 1; i >= 1; i--) {
        if (lines[i].trim() === "") continue;
        const row = parseCSVRow(lines[i]);
        if (row.length > 6 && row[6].trim() === discordId) {
            targetIndex = i;
            break;
        }
    }

    if (targetIndex !== -1) {
        // อัปเดตบรรทัดเดิม
        const updatedRow = [
            newData.name,
            newData.nickname,
            newData.age,
            newData.position,
            newData.duration,
            newData.university,
            discordId,
        ];
        lines[targetIndex] = updatedRow.map((v) => `"${v.replace(/"/g, '""')}"`).join(",");
        
        // บันทึกกลับลงไฟล์พร้อม BOM
        fs.writeFileSync(CSV_PATH, "\uFEFF" + lines.join("\n"));
        return true;
    }
    return false; // ไม่พบข้อมูลเก่าที่จะให้แก้ไข
}


module.exports = {
    parseCSVRow,
    appendIntern,
    countInterns,
    readAllInterns,
    findIntern,
    updateIntern,
    ensureCSVExists,
    CSV_PATH,
    DATA_DIR,
};
