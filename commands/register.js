// ==============================================
// commands/register.js — คำสั่ง /register
// เปิด Modal Form สำหรับลงทะเบียนฝึกงาน
// ==============================================

const {
    SlashCommandBuilder,
    ModalBuilder,
    TextInputBuilder,
    TextInputStyle,
    ActionRowBuilder,
} = require("discord.js");


module.exports = {
    // กำหนดข้อมูลของ Slash Command
    data: new SlashCommandBuilder()
        .setName("register")
        .setDescription("📋 ลงทะเบียนข้อมูลฝึกงาน — กรอกฟอร์มเพื่อเข้าร่วมทีม Academy"),

    /**
     * ทำงานเมื่อผู้ใช้พิมพ์ /register
     * จะเปิด Modal (popup form) ที่มี 5 ช่อง
     */
    async execute(interaction) {
        // สร้าง Modal (popup form) หน้าที่ 1
        const modal = new ModalBuilder()
            .setCustomId("register_modal_part1")
            .setTitle("📋 ฟอร์มลงทะเบียน (หน้า 1/2)");

        // Field 1: ชื่อจริง (Short)
        const nameInput = new TextInputBuilder()
            .setCustomId("register_name")
            .setLabel("ชื่อ-นามสกุล")
            .setPlaceholder("เช่น สมชาย ใจดี")
            .setStyle(TextInputStyle.Short)
            .setRequired(true)
            .setMaxLength(100);

        // Field 2: ชื่อเล่น (Short)
        const nicknameInput = new TextInputBuilder()
            .setCustomId("register_nickname")
            .setLabel("ชื่อเล่น")
            .setPlaceholder("เช่น ชาย")
            .setStyle(TextInputStyle.Short)
            .setRequired(true)
            .setMaxLength(50);

        // Field 3: อายุ (Short)
        const ageInput = new TextInputBuilder()
            .setCustomId("register_age")
            .setLabel("อายุ")
            .setPlaceholder("เช่น 22")
            .setStyle(TextInputStyle.Short)
            .setRequired(true)
            .setMaxLength(10);

        // สร้าง ActionRow สำหรับแต่ละ field
        const rows = [
            new ActionRowBuilder().addComponents(nameInput),
            new ActionRowBuilder().addComponents(nicknameInput),
            new ActionRowBuilder().addComponents(ageInput),
        ];

        modal.addComponents(...rows);

        // แสดง Modal หน้า 1 ให้ผู้ใช้
        await interaction.showModal(modal);
    },
};
