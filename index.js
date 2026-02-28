const {
  Client,
  GatewayIntentBits,
  SlashCommandBuilder,
  REST,
  Routes,
  EmbedBuilder
} = require('discord.js');

const token = process.env.TOKEN;
const clientId = '1476971350014034012';
const guildId = '1018194815286001756';

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMembers
  ]
});

/* -------------------- 슬래시 명령어 등록 -------------------- */

const commands = [
  new SlashCommandBuilder()
    .setName('신규')
    .setDescription('가입 7일 이내 멤버 목록 보기')
    .toJSON()
];

const rest = new REST({ version: '10' }).setToken(token);

(async () => {
  try {
    await rest.put(
      Routes.applicationGuildCommands(clientId, guildId),
      { body: commands }
    );
    console.log('슬래시 명령어 등록 완료');
  } catch (error) {
    console.error(error);
  }
})();

/* -------------------- 봇 준비 -------------------- */

client.once('ready', () => {
  console.log(`${client.user.tag} 준비 완료!`);
});

/* -------------------- 명령어 실행 -------------------- */

client.on('interactionCreate', async interaction => {
  if (!interaction.isChatInputCommand()) return;
  if (interaction.commandName !== '신규') return;

  await interaction.deferReply({ ephemeral: true }); // 👈 사용한 사람만 보기

  const now = Date.now();
  const sevenDays = 7 * 24 * 60 * 60 * 1000;

  const members = await interaction.guild.members.fetch();

  const newMembers = members.filter(member =>
    member.joinedTimestamp &&
    (now - member.joinedTimestamp) <= sevenDays
  );

  if (newMembers.size === 0) {
    return interaction.editReply({
      content: '📭 현재 7일 이내 가입한 멤버가 없습니다.',
      allowedMentions: { parse: [] } // 🔕 멘션 알림 방지
    });
  }

  const mentionList = newMembers
    .map(member => `<@${member.id}>`)
    .join('\n');

  const embed = new EmbedBuilder()
    .setTitle('🆕 신규 멤버 목록 (7일 이내)')
    .setDescription(mentionList)
    .setColor(0x2ecc71)
    .setFooter({ text: `총 ${newMembers.size}명` })
    .setTimestamp();

  await interaction.editReply({
    embeds: [embed],
    allowedMentions: { parse: [] } // 🔕 멘션 알림 절대 안 감
  });
});

client.login(TOKEN);