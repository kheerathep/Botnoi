// ==============================================
// utils/sheets.js — ส่งข้อมูลไปยัง Google Sheets ผ่าน Webhook
// ==============================================


/**
 * ส่งข้อมูล intern ไปยัง Google Sheets ผ่าน Webhook URL
 * มี retry 1 ครั้งถ้าส่งไม่สำเร็จ
 *
 * @param {object} data - ข้อมูล intern
 * @param {string} data.name - ชื่อจริง
 * @param {string} data.nickname - ชื่อเล่น
 * @param {string} data.age - อายุ
 * @param {string} data.position - ตำแหน่ง
 * @param {string} data.duration - ระยะเวลาการฝึกงาน
 * @param {string} data.university - มหาลัย
 * @returns {Promise<boolean>} true ถ้าส่งสำเร็จ, false ถ้าไม่สำเร็จ
 */
async function sendToSheets(data) {
    const webhookUrl = process.env.SHEETS_WEBHOOK_URL;

    // ถ้าไม่ได้ตั้งค่า Webhook URL ให้ข้ามไป
    if (!webhookUrl) {
        console.log("⚠️  SHEETS_WEBHOOK_URL ไม่ได้ตั้งค่า — ข้ามการส่ง Google Sheets");
        return false;
    }

    const payload = {
        name: data.name,
        nickname: data.nickname,
        age: data.age,
        position: data.position,
        duration: data.duration,
        university: data.university,
        discordId: data.discordId || "-",
    };

    // ลองส่งสูงสุด 2 ครั้ง (ครั้งแรก + retry 1 ครั้ง)
    for (let attempt = 1; attempt <= 2; attempt++) {
        try {
            const response = await fetch(webhookUrl, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload),
            });

            if (response.ok) {
                const json = await response.json().catch(() => ({}));
                console.log(`✅ Google Sheets — ส่งสำเร็จ (attempt ${attempt}):`, json);
                return true;
            }

            console.error(`❌ Google Sheets — HTTP ${response.status} (attempt ${attempt})`);
        } catch (err) {
            console.error(`❌ Google Sheets — Error (attempt ${attempt}):`, err.message);
        }

        // รอ 1 วินาทีก่อน retry
        if (attempt < 2) {
            await new Promise((resolve) => setTimeout(resolve, 1000));
        }
    }

    return false;
}


/**
 * ดึงจำนวนสมาชิกจาก Google Sheets ผ่าน Webhook (GET)
 * @returns {Promise<number|null>} จำนวนสมาชิก หรือ null หากมีข้อผิดพลาด
 */
async function getInternCountFromSheets() {
    const webhookUrl = process.env.SHEETS_WEBHOOK_URL;
    if (!webhookUrl) return null;

    try {
        const response = await fetch(webhookUrl);
        if (!response.ok) return null;
        
        const result = await response.json();
        if (result && result.status === "success" && typeof result.count === "number") {
            return result.count;
        }
    } catch (err) {
        console.error("❌ Google Sheets Count Error:", err.message);
    }
    return null;
}


module.exports = { sendToSheets, getInternCountFromSheets };
