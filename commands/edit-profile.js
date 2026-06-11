const { 
    SlashCommandBuilder, 
    ModalBuilder, 
    TextInputBuilder, 
    TextInputStyle, 
    ActionRowBuilder 
} = require("discord.js");
const { findIntern } = require("../utils/csv");
const { createErrorEmbed } = require("../utils/embeds");

module.exports = {
    data: new SlashCommandBuilder()
        .setName("edit-profile")
        .setDescription("✏️ แก้ไขข้อมูลส่วนตัวที่ลงทะเบียนไว้"),

    async execute(interaction) {
        // ค้นหาข้อมูลเดิม
        const internData = findIntern(interaction.user.id);

        if (!internData) {
            const errorEmbed = createErrorEmbed(
                "ไม่พบข้อมูลของคุณ",
                "คุณยังไม่ได้ลงทะเบียน หรือข้อมูลยังไม่ถูกเชื่อมโยงกับบัญชี Discord นี้\n\nโปรดพิมพ์คำสั่ง `/register` เพื่อลงทะเบียนใหม่ครับ"
            );
            await interaction.reply({ embeds: [errorEmbed], ephemeral: true });
            return;
        }

        // สร้าง Modal หน้าที่ 1 สำหรับแก้ไขข้อมูล
        const modal = new ModalBuilder()
            .setCustomId("edit_modal_part1")
            .setTitle("✏️ แก้ไขข้อมูลส่วนตัว (หน้า 1/2)");

        // ดึงค่าเดิมมาใส่
        const nameInput = new TextInputBuilder()
            .setCustomId("edit_name")
            .setLabel("ชื่อ-นามสกุล")
            .setStyle(TextInputStyle.Short)
            .setRequired(true)
            .setMaxLength(100)
            .setValue(internData.name); // ใส่ค่าเดิม

        const nicknameInput = new TextInputBuilder()
            .setCustomId("edit_nickname")
            .setLabel("ชื่อเล่น")
            .setStyle(TextInputStyle.Short)
            .setRequired(true)
            .setMaxLength(50)
            .setValue(internData.nickname);

        const ageInput = new TextInputBuilder()
            .setCustomId("edit_age")
            .setLabel("อายุ")
            .setStyle(TextInputStyle.Short)
            .setRequired(true)
            .setMaxLength(10)
            .setValue(internData.age);

        const rows = [
            new ActionRowBuilder().addComponents(nameInput),
            new ActionRowBuilder().addComponents(nicknameInput),
            new ActionRowBuilder().addComponents(ageInput),
        ];

        modal.addComponents(...rows);

        // แสดง Modal ให้ผู้ใช้
        await interaction.showModal(modal);
    },
};
