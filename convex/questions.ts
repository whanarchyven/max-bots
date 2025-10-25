import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

// Создать вопрос
export const createQuestion = mutation({
  args: {
    chatId: v.string(),
    leadId: v.id("leads"),
    question: v.string(),
  },
  handler: async (ctx, args) => {
    console.log("Creating question:", args.question, "for leadId:", args.leadId);
    
    return await ctx.db.insert("questions", {
      chatId: args.chatId,
      leadId: args.leadId,
      question: args.question,
      status: "pending",
      createdAt: Date.now(),
    });
  },
});

// Получить вопросы по chatId
export const getQuestionsByChatId = query({
  args: { chatId: v.string() },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("questions")
      .withIndex("by_chat_id", (q) => q.eq("chatId", args.chatId))
      .order("desc")
      .collect();
  },
});

// Получить вопросы по leadId
export const getQuestionsByLeadId = query({
  args: { leadId: v.id("leads") },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("questions")
      .withIndex("by_lead_id", (q) => q.eq("leadId", args.leadId))
      .order("desc")
      .collect();
  },
});

// Получить все вопросы
export const getAllQuestions = query({
  args: { status: v.optional(v.string()) },
  handler: async (ctx, args) => {
    if (args.status) {
      return await ctx.db
        .query("questions")
        .withIndex("by_status", (q) => q.eq("status", args.status!))
        .order("desc")
        .collect();
    } else {
      return await ctx.db
        .query("questions")
        .order("desc")
        .collect();
    }
  },
});

// Получить вопрос по ID
export const getQuestionById = query({
  args: { questionId: v.id("questions") },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.questionId);
  },
});

// Ответить на вопрос
export const answerQuestion = mutation({
  args: {
    questionId: v.id("questions"),
    answer: v.string(),
  },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.questionId, {
      answer: args.answer,
      status: "answered",
      answeredAt: Date.now(),
    });
  },
});

// Закрыть вопрос
export const closeQuestion = mutation({
  args: { questionId: v.id("questions") },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.questionId, {
      status: "closed",
    });
  },
});

// Получить статистику вопросов
export const getQuestionsStats = query({
  handler: async (ctx) => {
    const allQuestions = await ctx.db.query("questions").collect();
    
    const stats = {
      total: allQuestions.length,
      pending: 0,
      answered: 0,
      closed: 0,
    };

    allQuestions.forEach(question => {
      switch (question.status) {
        case "pending":
          stats.pending++;
          break;
        case "answered":
          stats.answered++;
          break;
        case "closed":
          stats.closed++;
          break;
      }
    });

    return stats;
  },
});
