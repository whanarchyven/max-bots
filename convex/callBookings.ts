import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

// Создать запись на звонок
export const createCallBooking = mutation({
  args: {
    chatId: v.string(),
    leadId: v.id("leads"),
    preferredTimes: v.array(v.string()),
    selectedTime: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    return await ctx.db.insert("callBookings", {
      chatId: args.chatId,
      leadId: args.leadId,
      preferredTimes: args.preferredTimes,
      selectedTime: args.selectedTime,
      status: "pending",
      reminderSent: false,
      createdAt: Date.now(),
    });
  },
});

// Обновить запись на звонок
export const updateCallBooking = mutation({
  args: {
    chatId: v.string(),
    selectedTime: v.string(),
    status: v.optional(v.string()),
    scheduledFor: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const booking = await ctx.db
      .query("callBookings")
      .withIndex("by_chat_id", (q) => q.eq("chatId", args.chatId))
      .first();

    if (booking) {
      await ctx.db.patch(booking._id, {
        selectedTime: args.selectedTime,
        status: args.status || booking.status,
        scheduledFor: args.scheduledFor,
      });
    }
  },
});

// Получить запись на звонок
export const getCallBooking = query({
  args: { chatId: v.string() },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("callBookings")
      .withIndex("by_chat_id", (q) => q.eq("chatId", args.chatId))
      .first();
  },
});

// Получить все записи на звонки
export const getAllCallBookings = query({
  args: { status: v.optional(v.string()) },
  handler: async (ctx, args) => {
    if (args.status) {
      return await ctx.db
        .query("callBookings")
        .withIndex("by_status", (q) => q.eq("status", args.status!))
        .order("desc")
        .collect();
    } else {
      return await ctx.db
        .query("callBookings")
        .order("desc")
        .collect();
    }
  },
});

// Получить предстоящие звонки
export const getUpcomingCalls = query({
  handler: async (ctx) => {
    const now = Date.now();
    return await ctx.db
      .query("callBookings")
      .withIndex("by_scheduled_for", (q) => q.gte("scheduledFor", now))
      .filter((q) => q.eq(q.field("status"), "confirmed"))
      .order("asc")
      .collect();
  },
});

// Отметить напоминание как отправленное
export const markReminderSent = mutation({
  args: { chatId: v.string() },
  handler: async (ctx, args) => {
    const booking = await ctx.db
      .query("callBookings")
      .withIndex("by_chat_id", (q) => q.eq("chatId", args.chatId))
      .first();

    if (booking) {
      await ctx.db.patch(booking._id, {
        reminderSent: true,
      });
    }
  },
});

// Отменить запись на звонок
export const cancelCallBooking = mutation({
  args: { chatId: v.string() },
  handler: async (ctx, args) => {
    const booking = await ctx.db
      .query("callBookings")
      .withIndex("by_chat_id", (q) => q.eq("chatId", args.chatId))
      .first();

    if (booking) {
      await ctx.db.patch(booking._id, {
        status: "cancelled",
      });
    }
  },
});
