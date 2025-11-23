module.exports = (bot) => {
  // Generic text handler for short-lived interactions (e.g., echo)
  bot.on('text', async (ctx, next) => {
    try {
      if (ctx.session && ctx.session.pendingEcho) {
        const text = ctx.message.text;
        // Clear session flags before replying to avoid loops
        ctx.session.pendingEcho = false;
        const featureId = ctx.session.pendingEchoFeature;
        ctx.session.pendingEchoFeature = null;

        if (!text || text.trim().length === 0) {
          return ctx.reply('❗ Please send some text to echo back.');
        }

        await ctx.reply(`🔁 Echo: ${text}`);
        return;
      }

      // If not handled here, continue to other handlers
      await next();
    } catch (error) {
      console.error('Error in textHandler:', error);
      await next();
    }
  });
};
