client.on('interactionCreate', async interaction => {
  if (!interaction.isChatInputCommand()) return;
  if (interaction.commandName !== '신규') return;

  await interaction.deferReply({ ephemeral: true });

  const now = Date.now();
  const sevenDays = 7 * 24 * 60 * 60 * 1000;
  const roleId = '1018195906807480402'; // 👈 추가

  const members = await interaction.guild.members.fetch();

  const newMembers = members.filter(member =>
    (
      member.joinedTimestamp &&
      (now - member.joinedTimestamp) <= sevenDays
    ) ||
    member.roles.cache.has(roleId) // 👈 역할 포함 조건
  );

  if (newMembers.size === 0) {
    return interaction.editReply({
      content: '📭 조건에 해당하는 멤버가 없습니다.',
      allowedMentions: { parse: [] }
    });
  }

  const mentionList = newMembers
    .map(member => `<@${member.id}>`)
    .join('\n');

  const embed = new EmbedBuilder()
    .setTitle('🆕 신규 멤버 + 특정 역할 멤버 목록')
    .setDescription(mentionList)
    .setColor(0x2ecc71)
    .setFooter({ text: `총 ${newMembers.size}명` })
    .setTimestamp();

  await interaction.editReply({
    embeds: [embed],
    allowedMentions: { parse: [] }
  });
});