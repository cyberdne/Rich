module.exports = {
  // Handle an action that triggers an echo flow
  async handleAction(ctx, action, feature) {
    try {
      await ctx.answerCbQuery();
      // Ask the user to send the text to echo
      await ctx.reply('Please send the text you want me to echo back.');
      // Set a short-lived session flag so next text message will be echoed
      if (!ctx.session) ctx.session = {};
      ctx.session.pendingEcho = true;
      ctx.session.pendingEchoFeature = feature.id;
      return true;
    } catch (error) {
      console.error('Error in echo.handleAction:', error);
      return false;
    }
  },

  // No custom callback handling
  async handleCallback(ctx, callbackData) {
    return false;
  }
};
