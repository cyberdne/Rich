module.exports = {
  // Simple action handler (no actions defined for ping)
  async handleAction(ctx, action, feature) {
    try {
      await ctx.answerCbQuery();
      await ctx.reply('Pong! 🏓');
      return true;
    } catch (error) {
      console.error('Error in ping.handleAction:', error);
      return false;
    }
  },

  // Callback handler: return false for unhandled callbacks
  async handleCallback(ctx, callbackData) {
    try {
      // No custom callback handling for ping
      return false;
    } catch (error) {
      console.error('Error in ping.handleCallback:', error);
      return false;
    }
  }
};
