// ==============================================
// events/interactionCreate.js — จัดการ Interactions ทั้งหมด
// (Slash Commands + Modal Submit + Button)
// ==============================================

const { appendIntern, updateIntern } = require("../utils/csv");
const { sendToSheets } = require("../utils/sheets");
const {
    createIntroEmbed,
    createSuccessEmbed,
    createErrorEmbed,
    createAdminLogEmbed,
} = require("../utils/embeds");
const {
    ModalBuilder,
    TextInputBuilder,
    TextInputStyle,
    ActionRowBuilder,
    ButtonBuilder,
    ButtonStyle,
} = require("discord.js");

// เก็บข้อมูลชั่วคราวระหว่างหน้า 1 และหน้า 2
const tempRegistrationData = new Map();
const tempEditData = new Map();

module.exports = {
    name: "interactionCreate",
    once: false,

    async execute(interaction) {
        // ========================================
        // 1) จัดการ Slash Commands
        // ========================================
        if (interaction.isChatInputCommand()) {
            const command = interaction.client.commands.get(interaction.commandName);

            if (!command) {
                console.error(`❌ ไม่พบคำสั่ง: ${interaction.commandName}`);
                return;
            }

            try {
                await command.execute(interaction);
            } catch (error) {
                console.error(`❌ Error executing /${interaction.commandName}:`, error);

                const errorEmbed = createErrorEmbed(
                    "เกิดข้อผิดพลาด",
                    "ไม่สามารถทำคำสั่งนี้ได้ โปรดลองใหม่อีกครั้ง"
                );

                if (interaction.replied || interaction.deferred) {
                    await interaction.followUp({ embeds: [errorEmbed], ephemeral: true });
                } else {
                    await interaction.reply({ embeds: [errorEmbed], ephemeral: true });
                }
            }
            return;
        }

        // ========================================
        // 2) จัดการ Button Clicks
        // ========================================
        if (interaction.isButton()) {
            if (interaction.customId === "register_btn_part2") {
                await handleRegisterButtonPart2(interaction);
            } else if (interaction.customId === "edit_btn_part2") {
                await handleEditButtonPart2(interaction);
            }
            return;
        }

        // ========================================
        // 3) จัดการ Modal Submit
        // ========================================
        if (interaction.isModalSubmit()) {
            if (interaction.customId === "register_modal_part1") {
                await handleRegisterModalPart1(interaction);
            } else if (interaction.customId === "register_modal_part2") {
                await handleRegisterModalPart2(interaction);
            } else if (interaction.customId === "edit_modal_part1") {
                await handleEditModalPart1(interaction);
            } else if (interaction.customId === "edit_modal_part2") {
                await handleEditModalPart2(interaction);
            }
            return;
        }
    },
};

/**
 * จัดการฟอร์มหน้า 1
 * - เก็บข้อมูล ชื่อ, ชื่อเล่น, อายุ ไว้ใน Map ชั่วคราว
 * - ส่งปุ่ม (Button) ให้ผู้ใช้กดเพื่อเปิดหน้า 2 (เนื่องจากข้อจำกัดของ Discord ไม่สามารถเด้ง Modal ซ้อน Modal ได้โดยตรง)
 */
async function handleRegisterModalPart1(interaction) {
    try {
        const name = interaction.fields.getTextInputValue("register_name").trim();
        const nickname = interaction.fields.getTextInputValue("register_nickname").trim();
        const age = interaction.fields.getTextInputValue("register_age").trim();

        // เก็บข้อมูลชั่วคราว (ใช้ Discord ID เป็น Key)
        tempRegistrationData.set(interaction.user.id, { name, nickname, age });

        // สร้างปุ่มกดเพื่อไปยังหน้า 2
        const continueBtn = new ButtonBuilder()
            .setCustomId("register_btn_part2")
            .setLabel("กรอกข้อมูลหน้า 2/2 (ต่อ)")
            .setStyle(ButtonStyle.Primary);

        const row = new ActionRowBuilder().addComponents(continueBtn);

        // ตอบกลับผู้ใช้ (ใช้ ephemeral เพื่อความส่วนตัว)
        await interaction.reply({
            content: "✅ บันทึกข้อมูลส่วนแรกเรียบร้อยแล้ว! กรุณากดปุ่มด้านล่างนี้เพื่อกรอกข้อมูลส่วนที่ 2 ต่อไปครับ",
            components: [row],
            ephemeral: true
        });

    } catch (error) {
        console.error("❌ Error handling register modal part 1:", error);
        await interaction.reply({ 
            embeds: [createErrorEmbed("เกิดข้อผิดพลาด", "ไม่สามารถบันทึกข้อมูลหน้าแรกได้ โปรดลองใหม่อีกครั้ง")], 
            ephemeral: true 
        });
    }
}

/**
 * จัดการเมื่อผู้ใช้กดปุ่มเพื่อเริ่มกรอกฟอร์มหน้า 2
 */
async function handleRegisterButtonPart2(interaction) {
    try {
        // ตรวจสอบว่ายังมีข้อมูลหน้า 1 อยู่ในระบบไหม
        if (!tempRegistrationData.has(interaction.user.id)) {
            await interaction.reply({
                embeds: [createErrorEmbed("เซสชันหมดอายุ", "ไม่พบข้อมูลจากหน้าแรก โปรดพิมพ์ /register เพื่อเริ่มกรอกใหม่")],
                ephemeral: true
            });
            return;
        }

        // สร้าง Modal หน้าที่ 2
        const modal = new ModalBuilder()
            .setCustomId("register_modal_part2")
            .setTitle("📋 ฟอร์มลงทะเบียน (หน้า 2/2)");

        // Field 4: ตำแหน่ง (Short)
        const positionInput = new TextInputBuilder()
            .setCustomId("register_position")
            .setLabel("ตำแหน่งที่ฝึกงาน")
            .setPlaceholder("เช่น Frontend, Backend")
            .setStyle(TextInputStyle.Short)
            .setRequired(true)
            .setMaxLength(100);

        // Field 5: ระยะเวลาฝึกงาน (Short)
        const durationInput = new TextInputBuilder()
            .setCustomId("register_duration")
            .setLabel("ระยะเวลาฝึกงาน")
            .setPlaceholder("เช่น 4 เดือน, 1 เทอม")
            .setStyle(TextInputStyle.Short)
            .setRequired(true)
            .setMaxLength(50);

        // Field 6: มหาวิทยาลัย (Short)
        const uniInput = new TextInputBuilder()
            .setCustomId("register_university")
            .setLabel("มหาวิทยาลัย / สถานศึกษา")
            .setPlaceholder("เช่น จุฬาลงกรณ์มหาวิทยาลัย")
            .setStyle(TextInputStyle.Short)
            .setRequired(true)
            .setMaxLength(100);

        const rows = [
            new ActionRowBuilder().addComponents(positionInput),
            new ActionRowBuilder().addComponents(durationInput),
            new ActionRowBuilder().addComponents(uniInput),
        ];

        modal.addComponents(...rows);

        // แสดง Modal หน้า 2
        await interaction.showModal(modal);

    } catch (error) {
        console.error("❌ Error showing modal part 2 from button:", error);
        await interaction.reply({
            embeds: [createErrorEmbed("เกิดข้อผิดพลาด", "ไม่สามารถเปิดแบบฟอร์มหน้าที่ 2 ได้ โปรดลองใหม่อีกครั้ง")],
            ephemeral: true
        });
    }
}

/**
 * จัดการข้อมูลที่ส่งมาจาก Modal หน้า 2
 * - ดึงข้อมูลหน้า 1 จาก Map มารวมกับหน้า 2
 * - บันทึกลง CSV, ส่ง Google Sheets, ให้ยศ, ส่ง Embed
 */
async function handleRegisterModalPart2(interaction) {
    try {
        // ดึงข้อมูลหน้า 1 ที่เก็บไว้
        const part1Data = tempRegistrationData.get(interaction.user.id);
        
        if (!part1Data) {
            await interaction.reply({ 
                embeds: [createErrorEmbed("เซสชันหมดอายุ", "ไม่พบข้อมูลจากหน้าแรก โปรดพิมพ์ /register เพื่อเริ่มใหม่")], 
                ephemeral: true 
            });
            return;
        }

        // Defer reply เพื่อให้มีเวลาประมวลผล
        await interaction.deferReply({ ephemeral: true });

        const position = interaction.fields.getTextInputValue("register_position").trim();
        const duration = interaction.fields.getTextInputValue("register_duration").trim();
        const university = interaction.fields.getTextInputValue("register_university").trim();

        // รวมข้อมูล
        const data = { 
            name: part1Data.name, 
            nickname: part1Data.nickname, 
            age: part1Data.age, 
            position, 
            duration, 
            university,
            discordId: interaction.user.id
        };

        // ลบข้อมูลชั่วคราวออก
        tempRegistrationData.delete(interaction.user.id);

        // ========================================
        // บันทึกลง CSV
        // ========================================
        appendIntern(data);
        console.log(`📋 ลงทะเบียน: ${data.name} (${data.nickname}) — ${position}`);

        // ========================================
        // ส่ง Google Sheets
        // ========================================
        sendToSheets(data).catch((err) =>
            console.error("❌ Error sending to Google Sheets:", err)
        );

        // ========================================
        // แจ้งเตือนเข้า Admin Log
        // ========================================
        const adminLogChannelId = process.env.ADMIN_LOG_CHANNEL_ID;
        if (adminLogChannelId) {
            const adminChannel = interaction.client.channels.cache.get(adminLogChannelId);
            if (adminChannel) {
                const adminEmbed = createAdminLogEmbed("สมัครใหม่", data, interaction.user);
                adminChannel.send({ embeds: [adminEmbed] }).catch(console.error);
            }
        }

        // ========================================
        // ส่งข้อความทักทาย (Welcome DM)
        // ========================================
        try {
            const dmEmbed = createSuccessEmbed(
                "ยินดีต้อนรับสู่ทีม Academy!",
                `สวัสดีครับคุณ **${data.name} (${data.nickname})**\n\nการลงทะเบียนของคุณสำเร็จแล้ว!\nคุณสามารถดูข้อมูลตัวเองได้โดยพิมพ์ \`/profile\` ในเซิร์ฟเวอร์\nและหากต้องการแก้ไขข้อมูล ให้พิมพ์ \`/edit-profile\` ครับ`
            );
            await interaction.user.send({ embeds: [dmEmbed] });
            console.log(`✉️ ส่ง Welcome DM ให้ ${data.nickname} สำเร็จ`);
        } catch (err) {
            console.log(`⚠️ ไม่สามารถส่ง DM ให้ ${data.nickname} ได้ (อาจจะปิดรับ DM อยู่)`);
        }

        // ========================================
        // ให้ยศตามตำแหน่ง (Frontend / Backend)
        // ========================================
        let roleName = null;
        if (interaction.member) {
            const posLower = position.toLowerCase();
            let roleId = null;

            if (posLower.includes("frontend") || posLower.includes("ฟร้อน") || posLower.includes("ฟรอนท์")) {
                roleId = process.env.FRONTEND_ROLE_ID;
            } else if (posLower.includes("backend") || posLower.includes("แบ็ก") || posLower.includes("แบค")) {
                roleId = process.env.BACKEND_ROLE_ID;
            }

            if (roleId) {
                const role = interaction.guild.roles.cache.get(roleId);
                if (role) {
                    try {
                        await interaction.member.roles.add(role);
                        roleName = role.name;
                        console.log(`🏷️  ให้ยศ ${role.name} แก่ ${data.name}`);
                    } catch (err) {
                        console.error(`❌ Error adding role: ${err.message}`);
                    }
                } else {
                    console.error(`⚠️  ไม่พบ Role ID: ${roleId}`);
                }
            }
        }

        // ========================================
        // ส่ง Embed แนะนำตัวไปที่ Intro Channel
        // ========================================
        const introChannelId = process.env.INTRO_CHANNEL_ID;
        if (introChannelId) {
            const introChannel = interaction.client.channels.cache.get(introChannelId);
            if (introChannel) {
                const introEmbed = createIntroEmbed(data, interaction.user);
                await introChannel.send({ embeds: [introEmbed] });
                console.log(`🎉 ส่ง Embed แนะนำตัวไปที่ #${introChannel.name}`);
            } else {
                console.error(`⚠️  ไม่พบ Intro Channel ID: ${introChannelId}`);
            }
        }

        // ========================================
        // ตอบกลับผู้ใช้ (ephemeral)
        // ========================================
        let successMsg = "ข้อมูลของคุณถูกบันทึกเรียบร้อยแล้ว!";
        if (roleName) {
            successMsg += `\nคุณได้รับยศ **${roleName}** ในเซิร์ฟเวอร์`;
        }
        if (introChannelId) {
            successMsg += `\nข้อความแนะนำตัวถูกส่งไปที่ <#${introChannelId}> แล้ว`;
        }

        const successEmbed = createSuccessEmbed("ลงทะเบียนสำเร็จ!", successMsg);
        await interaction.editReply({ embeds: [successEmbed], components: [] }); // เอาปุ่มของหน้าแรกออกด้วย

    } catch (error) {
        console.error("❌ Error handling register modal part 2:", error);

        const errorEmbed = createErrorEmbed(
            "เกิดข้อผิดพลาด",
            "ไม่สามารถบันทึกข้อมูลได้ โปรดลองใหม่อีกครั้ง หรือติดต่อผู้ดูแล"
        );

        if (interaction.deferred || interaction.replied) {
            await interaction.editReply({ embeds: [errorEmbed] });
        } else {
            await interaction.reply({ embeds: [errorEmbed], ephemeral: true });
        }
    }
}


// ==============================================
// ส่วนการทำงานสำหรับ /edit-profile
// ==============================================

async function handleEditModalPart1(interaction) {
    try {
        const name = interaction.fields.getTextInputValue("edit_name").trim();
        const nickname = interaction.fields.getTextInputValue("edit_nickname").trim();
        const age = interaction.fields.getTextInputValue("edit_age").trim();

        tempEditData.set(interaction.user.id, { name, nickname, age });

        const continueBtn = new ButtonBuilder()
            .setCustomId("edit_btn_part2")
            .setLabel("แก้ไขข้อมูลหน้า 2/2 (ต่อ)")
            .setStyle(ButtonStyle.Success);

        const row = new ActionRowBuilder().addComponents(continueBtn);

        await interaction.reply({
            content: "✅ บันทึกข้อมูลแก้ไขส่วนแรกแล้ว! กรุณากดปุ่มด้านล่างเพื่อแก้ไขข้อมูลส่วนที่ 2 ครับ",
            components: [row],
            ephemeral: true
        });

    } catch (error) {
        console.error("❌ Error handling edit modal part 1:", error);
        await interaction.reply({ 
            embeds: [createErrorEmbed("เกิดข้อผิดพลาด", "ไม่สามารถบันทึกข้อมูลหน้าแรกได้")], 
            ephemeral: true 
        });
    }
}

async function handleEditButtonPart2(interaction) {
    try {
        if (!tempEditData.has(interaction.user.id)) {
            await interaction.reply({
                embeds: [createErrorEmbed("เซสชันหมดอายุ", "ไม่พบข้อมูลจากหน้าแรก โปรดพิมพ์ /edit-profile เพื่อเริ่มใหม่")],
                ephemeral: true
            });
            return;
        }

        const { findIntern } = require("../utils/csv");
        const internData = findIntern(interaction.user.id) || {};

        const modal = new ModalBuilder()
            .setCustomId("edit_modal_part2")
            .setTitle("✏️ แก้ไขข้อมูลส่วนตัว (หน้า 2/2)");

        const positionInput = new TextInputBuilder()
            .setCustomId("edit_position")
            .setLabel("ตำแหน่งที่ฝึกงาน")
            .setStyle(TextInputStyle.Short)
            .setRequired(true)
            .setMaxLength(100)
            .setValue(internData.position || "");

        const durationInput = new TextInputBuilder()
            .setCustomId("edit_duration")
            .setLabel("ระยะเวลาฝึกงาน")
            .setStyle(TextInputStyle.Short)
            .setRequired(true)
            .setMaxLength(50)
            .setValue(internData.duration || "");

        const uniInput = new TextInputBuilder()
            .setCustomId("edit_university")
            .setLabel("มหาวิทยาลัย / สถานศึกษา")
            .setStyle(TextInputStyle.Short)
            .setRequired(true)
            .setMaxLength(100)
            .setValue(internData.university || "");

        const rows = [
            new ActionRowBuilder().addComponents(positionInput),
            new ActionRowBuilder().addComponents(durationInput),
            new ActionRowBuilder().addComponents(uniInput),
        ];

        modal.addComponents(...rows);
        await interaction.showModal(modal);

    } catch (error) {
        console.error("❌ Error showing edit modal part 2:", error);
        await interaction.reply({
            embeds: [createErrorEmbed("เกิดข้อผิดพลาด", "ไม่สามารถเปิดแบบฟอร์มหน้าที่ 2 ได้")],
            ephemeral: true
        });
    }
}

async function handleEditModalPart2(interaction) {
    try {
        const part1Data = tempEditData.get(interaction.user.id);
        if (!part1Data) {
            await interaction.reply({ 
                embeds: [createErrorEmbed("เซสชันหมดอายุ", "ไม่พบข้อมูลจากหน้าแรก โปรดพิมพ์ /edit-profile เพื่อเริ่มใหม่")], 
                ephemeral: true 
            });
            return;
        }

        await interaction.deferReply({ ephemeral: true });

        const position = interaction.fields.getTextInputValue("edit_position").trim();
        const duration = interaction.fields.getTextInputValue("edit_duration").trim();
        const university = interaction.fields.getTextInputValue("edit_university").trim();

        const data = { 
            name: part1Data.name, 
            nickname: part1Data.nickname, 
            age: part1Data.age, 
            position, 
            duration, 
            university,
            discordId: interaction.user.id
        };

        tempEditData.delete(interaction.user.id);

        // อัปเดต CSV
        const updated = updateIntern(interaction.user.id, data);
        if (!updated) {
            // ถ้าย้อนแย้งกับ findIntern ตอนแรก (เกิดได้ยาก)
            appendIntern(data); 
        }

        // ส่ง Google Sheets
        sendToSheets(data).catch((err) => console.error("❌ Error sending to Sheets:", err));

        // Admin Log
        const adminLogChannelId = process.env.ADMIN_LOG_CHANNEL_ID;
        if (adminLogChannelId) {
            const adminChannel = interaction.client.channels.cache.get(adminLogChannelId);
            if (adminChannel) {
                const adminEmbed = createAdminLogEmbed("อัปเดตข้อมูล", data, interaction.user);
                adminChannel.send({ embeds: [adminEmbed] }).catch(console.error);
            }
        }

        // แจ้งเตือน DM
        try {
            const dmEmbed = createSuccessEmbed(
                "อัปเดตข้อมูลสำเร็จ!",
                `คุณได้แก้ไขข้อมูลโปรไฟล์เรียบร้อยแล้ว\nตรวจสอบข้อมูลล่าสุดได้ด้วยคำสั่ง \`/profile\``
            );
            await interaction.user.send({ embeds: [dmEmbed] });
        } catch (err) {
            // ไม่ปริ้นท์ error หากผู้ใช้ปิด DM
        }

        // ตอบกลับสำเร็จ
        const successEmbed = createSuccessEmbed("อัปเดตข้อมูลสำเร็จ!", "ข้อมูลของคุณถูกแก้ไขเรียบร้อยแล้ว!");
        await interaction.editReply({ embeds: [successEmbed], components: [] });

    } catch (error) {
        console.error("❌ Error handling edit modal part 2:", error);
        const errorEmbed = createErrorEmbed("เกิดข้อผิดพลาด", "ไม่สามารถแก้ไขข้อมูลได้ โปรดลองใหม่อีกครั้ง");
        if (interaction.deferred || interaction.replied) {
            await interaction.editReply({ embeds: [errorEmbed] });
        } else {
            await interaction.reply({ embeds: [errorEmbed], ephemeral: true });
        }
    }
}
