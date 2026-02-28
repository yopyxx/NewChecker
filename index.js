const {
  Client,
  GatewayIntentBits,
  SlashCommandBuilder,
  REST,
  Routes,
  EmbedBuilder,
} = require('discord.js');

// ====== 설정값 ======
const token = process.env.TOKEN;               // 환경변수 TOKEN
const clientId = '1476971350014034012';
const guildId  = '1018194815286001756';
const roleId   = '1018195906807480402';        // 포함할 역할 ID

if (!token) {
  console.error('❌ 환경변수 TOKEN이 설정되지 않았습니다. (.env 또는 호스팅 환경변수 확인)');
  process.exit(1);
}

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMembers, // members.fetch() 하려면 필요
  ],
});

// ====== 슬래시 명령어 등록 ======
async function registerSlashCommands() {
  const commands = [
    new SlashCommandBuilder()
      .setName('신규')
      .setDescription('가입 7일 이내 멤버 + 특정 역할 멤버 목록 보기')
      .toJSON(),
  ];

  const rest = new REST({ version: '10' }).setToken(token);

  try {
    await rest.put(
      Routes.applicationGuildCommands(clientId, guildId),
      { body: commands }
    );
    console.log('✅ 슬래시 명령어 등록 완료');
  } catch (err) {
    console.error('❌ 슬래시 명령어 등록 실패:', err);
  }
}

// ====== 봇 준비 ======
client.once('ready', async () => {
  console.log(`✅ ${client.user.tag} 준비 완료!`);

  // 개발 편의상: 봇 켤 때마다 길드 명령 갱신
  // 운영에선 별도 deploy 스크립트로 빼는 걸 추천 (원하면 만들어드림)
  await registerSlashCommands();
});

// ====== 명령어 처리 ======
client.on('interactionCreate', async (interaction) => {
  try {
    if (!interaction.isChatInputCommand()) return;
    if (interaction.commandName !== '신규') return;

    await interaction.deferReply({ ephemeral: true });

    const now = Date.now();
    const sevenDays = 7 * 24 * 60 * 60 * 1000;

    // 멤버 전체 fetch
    const members = await interaction.guild.members.fetch();

    // 가입 7일 이내 OR 역할 보유자
    const filtered = members.filter((member) => {
      const joined = member.joinedTimestamp;
      const isNew = typeof joined === 'number' && (now - joined) <= sevenDays;
      const hasRole = member.roles?.cache?.has(roleId) === true;
      return isNew || hasRole;
    });

    if (filtered.size === 0) {
      return interaction.editReply({
        content: '📭 조건에 해당하는 멤버가 없습니다.',
        allowedMentions: { parse: [] },
      });
    }

    // 멘션 문자열(알림 차단은 allowedMentions로 처리)
    const mentionList = filtered.map((m) => `<@${m.id}>`).join('\n');

    const embed = new EmbedBuilder()
      .setTitle('🆕 신규 멤버(7일) + 특정 역할 멤버')
      .setDescription(mentionList)
      .setColor(0x2ecc71)
      .setFooter({ text: `총 ${filtered.size}명` })
      .setTimestamp();

    await interaction.editReply({
      embeds: [embed],
      allowedMentions: { parse: [] },
    });
  } catch (err) {
    console.error('❌ interaction 처리 중 오류:', err);

    // 이미 deferReply 했는지에 따라 처리
    if (interaction.deferred || interaction.replied) {
      await interaction.editReply({
        content: '⚠️ 처리 중 오류가 발생했습니다. 콘솔 로그를 확인해주세요.',
        allowedMentions: { parse: [] },
      }).catch(() => {});
    } else {
      await interaction.reply({
        content: '⚠️ 처리 중 오류가 발생했습니다. 콘솔 로그를 확인해주세요.',
        ephemeral: true,
        allowedMentions: { parse: [] },
      }).catch(() => {});
    }
  }
});


client.login(token);
