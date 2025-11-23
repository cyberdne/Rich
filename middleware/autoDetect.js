const logger = require('../utils/logger');
const aiService = require('../modules/ai/aiService');
const { getUser } = require('../database/users');
const keyboards = require('../config/keyboards');

/**
 * Auto-detect middleware: If a text message doesn't start with '/', route it to AI chat reply.
 * Admins and verified users get full access; unverified users must verify first.
 */
function setupAutoDetect() {
  return async (ctx, next) => {
    try {
      if (!ctx.message || ctx.message.text === undefined) return await next();

      const text = ctx.message.text.trim();

      // Ignore explicit commands
      if (text.startsWith('/')) return await next();

      // Only handle plain text messages
      // Check user verification (admins auto-verified in users DB)
      const from = ctx.from;
      if (!from) return await next();

      // Load user record from DB to check verification flag
      let userRecord = null;
      try {
        userRecord = await getUser(from.id);
      } catch (err) {
        logger.warn('Failed to load user for autoDetect:', err.message);
      }

      // If user exists and not verified, prompt verification (admins are verified by default)
      if (userRecord && userRecord.verified !== true) {
        // Avoid spamming verification prompt repeatedly during same session
        if (!ctx.session) ctx.session = {};
        if (!ctx.session.verifiedPromptSent) {
          ctx.session.verifiedPromptSent = true;
          try {
            await ctx.reply('🔐 Please verify to unlock the bot features. Click the button below to verify.', {
              reply_markup: keyboards.getVerificationKeyboard()
            });
          } catch (err) {
            logger.warn('Failed to send verification prompt:', err.message);
          }
        }
        return; // stop processing unverified user's message
      }

      // Simple heuristic: if message looks like a question or longer than 3 words, send to AI chat
      const isQuestion = text.includes('?');
      const wordCount = text.split(/\s+/).filter(Boolean).length;

      if (isQuestion || wordCount >= 4) {
        try {
          // Rate limiting should be handled elsewhere; be defensive here
          const reply = await aiService.chatReply(ctx.from.id, text, { ctx });
          if (reply) {
            await ctx.reply(reply);
            return; // handled
          }
        } catch (err) {
          logger.error('AI chat reply error:', err);
          // fall through to next so user is not blocked
        }
      }

      // Not auto-detected, continue to next handlers
      await next();
    } catch (error) {
      logger.error('Error in autoDetect middleware:', error);
      await next();
    }
  };
}

module.exports = {
  setupAutoDetect,
};
