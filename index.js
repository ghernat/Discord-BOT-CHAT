require("dotenv").config();
const fs = require("fs");
const config = require("./config.json");
const {
  Client,
  GatewayIntentBits,
  EmbedBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  ModalBuilder,
  TextInputBuilder,
  TextInputStyle,
  PermissionsBitField,
  Partials,
  AttachmentBuilder,
} = require("discord.js");

// تهيئة عميل Discord
const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMembers,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
    GatewayIntentBits.GuildPresences,
  ],
  partials: [Partials.GuildMember],
});

// تسجيل الدخول إلى الخلاف
client.login(process.env.TOKEN).catch((error) => {
  console.error("Failed to login:", error);
});

// بوت جاهز
client.once("ready", () => {
  console.log("Bot is Ready!");
  console.log("Code by GHERNAT FETHI");
  console.log("discord.gg/wicks");
});

// التعامل مع إنشاء الرسالة
client.on("messageCreate", async (message) => {
  console.log("Received message:", message.content);  // سجل التصحيح

  if (!message.content.startsWith("/grt") || message.author.bot) return;

  console.log("Command recognized");  // سجل التصحيح

  const allowedRoleId = process.env.ALLOWED_ROLE_ID || config.allowedRoleId;
  const member = message.guild.members.cache.get(message.author.id);

  if (!hasPermission(member, allowedRoleId)) {
    return message.reply({
      content: "⛔ليس لديك صلاحية لاستخدام هذا الامر!",
      ephemeral: true,
    });
  }

  console.log("Permission granted");  // سجل التصحيح

  const embed = await createEmbed(message.guild);
  const row = createActionRow();

  await message.reply({
    embeds: [embed],
    components: [row],
    ephemeral: true,
  });
});

// التعامل مع التفاعلات
client.on("interactionCreate", async (interaction) => {
  try {
    if (interaction.isButton()) {
      await handleButtonInteraction(interaction);
    } else if (interaction.isModalSubmit()) {
      await handleModalSubmit(interaction);
    }
  } catch (error) {
    console.error("Error in interactionCreate event:", error);
    await interaction.reply({
      content: "حدث خطأ أثناء معالجة التفاعل.",
      ephemeral: true,
    });
  }
});

// وظيفة للتحقق من الأذونات
function hasPermission(member, allowedRoleId) {
  return (
    member.roles.cache.has(allowedRoleId) ||
    member.permissions.has(PermissionsBitField.Flags.Administrator)
  );
}

// وظيفة لإنشاء رسالة تضمين مخصصة
async function createEmbed(guild) {
  const { onlineCount, offlineCount } = await getOnlineOfflineCounts(guild);

  return new EmbedBuilder()
    .setColor("#00ff00")
    .setTitle("Steam")
    .setURL("https://2u.pw/xXcZgVXS")
    .setAuthor({
      name: "Facebook",
      iconURL: "https://img.icons8.com/?size=100&id=13912&format=png&color=000000",
      url: "https://bit.ly/3XDhpDk",
    })
    .setDescription(`الرجاء اختيار نوع الارسال للاعضاء.\n\nالأعضاء المتصلين: ${onlineCount}\nالأعضاء غير المتصلين: ${offlineCount}`)
    .setThumbnail("https://j.top4top.io/p_30913rquz1.png")
    .setImage("https://a.top4top.io/p_3098arx7m1.jpg")
    .setFooter({
      text: "تم التطوير بواسطة GHERNAT FETHI",
      iconURL: "https://k.top4top.io/p_3096rmb6x1.gif",
    })
    .setTimestamp();
}

// وظيفة للحصول على أعداد الأعضاء المتصلين وغير المتصلين
async function getOnlineOfflineCounts(guild) {
  const members = await guild.members.fetch();
  let onlineCount = 0;
  let offlineCount = 0;

  members.forEach(member => {
    if (member.user.bot) return;
    if (member.presence && member.presence.status !== "offline") {
      onlineCount++;
    } else {
      offlineCount++;
    }
  });

  return { onlineCount, offlineCount };
}

// وظيفة لإنشاء صف عمل باستخدام الأزرار
function createActionRow() {
  return new ActionRowBuilder().addComponents(
    new ButtonBuilder()
      .setCustomId("send_all")
      .setLabel("📩 ارسل للجميع")
      .setStyle(ButtonStyle.Primary),
    new ButtonBuilder()
      .setCustomId("send_online")
      .setLabel("📩 ارسل للمتصلين")
      .setStyle(ButtonStyle.Success),
    new ButtonBuilder()
      .setCustomId("send_offline")
      .setLabel("📩 ارسل للغير المتصلين")
      .setStyle(ButtonStyle.Danger)
  );
}

// التعامل مع تفاعلات الزر
async function handleButtonInteraction(interaction) {
  const customIdMap = {
    send_all: "modal_all",
    send_online: "modal_online",
    send_offline: "modal_offline",
  };

  const customId = customIdMap[interaction.customId];
  if (!customId) return;

  const modal = new ModalBuilder()
    .setCustomId(customId)
    .setTitle("Type your message");

  const messageInput = new TextInputBuilder()
    .setCustomId("messageInput")
    .setLabel("✒️ اكتب رسالتك هنا")
    .setStyle(TextInputStyle.Paragraph);

  const fileInput = new TextInputBuilder()
    .setCustomId("fileInput")
    .setLabel("📎 ضع رابط الملف هنا (اختياري)")
    .setStyle(TextInputStyle.Short)
    .setRequired(false);

  modal.addComponents(
    new ActionRowBuilder().addComponents(messageInput),
    new ActionRowBuilder().addComponents(fileInput)
  );

  await interaction.showModal(modal);
}

// التعامل مع التقديمات المشروطة
async function handleModalSubmit(interaction) {
  const message = interaction.fields.getTextInputValue("messageInput");
  const fileUrl = interaction.fields.getTextInputValue("fileInput");
  const guild = interaction.guild;
  if (!guild) return;

  await interaction.deferReply({
    ephemeral: true,
  });

  const membersToSend = filterMembers(guild.members.cache, interaction.customId);

  const sendMessages = membersToSend.map(async (member) => {
    try {
      const messageEmbed = new EmbedBuilder()
        .setColor("#00ff00")
        .setTitle("رسالة جديدة")
        .setDescription(message)
        .setFooter({
          text: "تم التطوير بواسطة GHERNAT FETHI",
          iconURL: "https://k.top4top.io/p_3096rmb6x1.gif",
        })
        .setTimestamp()
        .setThumbnail("https://j.top4top.io/p_30913rquz1.png")
        .setImage("https://a.top4top.io/p_3098arx7m1.jpg");

      const attachments = [];

      if (fileUrl) {
        attachments.push(new AttachmentBuilder(fileUrl));
      }

      const actionRow = new ActionRowBuilder().addComponents(
        new ButtonBuilder()
          .setLabel("YouTube")
          .setURL("https://www.youtube.com/")
          .setStyle(ButtonStyle.Link),
        new ButtonBuilder()
          .setLabel("Facebook")
          .setURL("https://www.facebook.com/")
          .setStyle(ButtonStyle.Link)
      );

      await member.send({
        embeds: [messageEmbed],
        files: attachments,
        content: `<@${member.user.id}>`,
        allowedMentions: { parse: ["users"] },
        components: [actionRow]
      });
    } catch (error) {
      console.error(`Error sending message to ${member.user.tag}:`, error);
    }
  });

  await Promise.all(sendMessages);

  await interaction.editReply({
    content: "تم ارسال رسالتك الى الاعضاء بنجاح✅.",
  });
}

// وظيفة لتصفية الأعضاء بناءً على نوع التفاعل
function filterMembers(members, customId) {
  return members.filter((member) => {
    if (member.user.bot) return false;
    if (customId === "modal_all") return true;
    if (customId === "modal_online") {
      return member.presence && member.presence.status !== "offline";
    }
    if (customId === "modal_offline") {
      return !member.presence || member.presence.status === "offline";
    }
  });
}