module.exports = async (ctx) => {
  try {
    // Jika ada inline query, balas dengan kosong
    // Biar bot tidak error dan tidak memproses apa pun
    await ctx.answerInlineQuery([]);
  } catch (err) {
    console.error('Inline query error:', err.message);
  }
};
