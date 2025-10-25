import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

// Создать или обновить переписку
export const upsertConversation = mutation({
  args: {
    chatId: v.string(),
    userId: v.string(),
    username: v.optional(v.string()),
    firstName: v.optional(v.string()),
    lastName: v.optional(v.string()),
    currentStep: v.string(),
    lastMessageId: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const now = Date.now();
    
    // Проверяем, существует ли уже переписка
    const existing = await ctx.db
      .query("conversations")
      .withIndex("by_chat_id", (q) => q.eq("chatId", args.chatId))
      .first();

    if (existing) {
      // Обновляем существующую переписку
      await ctx.db.patch(existing._id, {
        userId: args.userId,
        username: args.username,
        firstName: args.firstName,
        lastName: args.lastName,
        currentStep: args.currentStep,
        lastMessageId: args.lastMessageId,
        updatedAt: now,
        isActive: true,
      });
      return existing._id;
    } else {
      // Создаем новую переписку
      return await ctx.db.insert("conversations", {
        chatId: args.chatId,
        userId: args.userId,
        username: args.username,
        firstName: args.firstName,
        lastName: args.lastName,
        currentStep: args.currentStep,
        lastMessageId: args.lastMessageId,
        createdAt: now,
        updatedAt: now,
        isActive: true,
      });
    }
  },
});

// Получить переписку по chatId
export const getConversation = query({
  args: { chatId: v.string() },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("conversations")
      .withIndex("by_chat_id", (q) => q.eq("chatId", args.chatId))
      .first();
  },
});

// Обновить шаг в переписке
export const updateConversationStep = mutation({
  args: {
    chatId: v.string(),
    step: v.string(),
    lastMessageId: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const conversation = await ctx.db
      .query("conversations")
      .withIndex("by_chat_id", (q) => q.eq("chatId", args.chatId))
      .first();

    if (conversation) {
      await ctx.db.patch(conversation._id, {
        currentStep: args.step,
        lastMessageId: args.lastMessageId,
        updatedAt: Date.now(),
      });
    }
  },
});

// Добавить сообщение в переписку
export const addMessage = mutation({
  args: {
    chatId: v.string(),
    messageId: v.number(),
    text: v.string(),
    messageType: v.string(),
    step: v.string(),
    metadata: v.optional(v.any()),
  },
  handler: async (ctx, args) => {
    return await ctx.db.insert("messages", {
      chatId: args.chatId,
      messageId: args.messageId,
      text: args.text,
      messageType: args.messageType,
      timestamp: Date.now(),
      step: args.step,
      metadata: args.metadata,
    });
  },
});

// Получить историю сообщений для переписки
export const getMessages = query({
  args: { chatId: v.string() },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("messages")
      .withIndex("by_chat_id", (q) => q.eq("chatId", args.chatId))
      .order("desc")
      .collect();
  },
});

// Получить все активные переписки
export const getActiveConversations = query({
  handler: async (ctx) => {
    return await ctx.db
      .query("conversations")
      .filter((q) => q.eq(q.field("isActive"), true))
      .order("desc")
      .collect();
  },
});
