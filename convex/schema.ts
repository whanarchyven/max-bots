import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  // Таблица для хранения всех переписок с пользователями
  conversations: defineTable({
    chatId: v.string(), // Telegram chat ID
    userId: v.string(), // Telegram user ID
    username: v.optional(v.string()),
    firstName: v.optional(v.string()),
    lastName: v.optional(v.string()),
    currentStep: v.string(), // Текущий шаг в диалоге
    lastMessageId: v.optional(v.number()), // ID последнего сообщения
    createdAt: v.number(), // Время создания
    updatedAt: v.number(), // Время последнего обновления
    isActive: v.boolean(), // Активен ли диалог
    metadata: v.optional(v.any()), // Дополнительные данные
  })
    .index("by_chat_id", ["chatId"])
    .index("by_user_id", ["userId"])
    .index("by_created_at", ["createdAt"]),

  // Таблица для хранения сообщений в переписках
  messages: defineTable({
    chatId: v.string(),
    messageId: v.number(),
    text: v.string(),
    messageType: v.string(), // 'user' | 'bot'
    timestamp: v.number(),
    step: v.string(), // На каком шаге было отправлено сообщение
    metadata: v.optional(v.any()),
  })
    .index("by_chat_id", ["chatId"])
    .index("by_timestamp", ["timestamp"]),

  // Таблица для хранения лидов
  leads: defineTable({
    chatId: v.string(),
    userId: v.string(),
    username: v.optional(v.string()),
    firstName: v.optional(v.string()),
    lastName: v.optional(v.string()),
    email: v.optional(v.string()),
    phone: v.optional(v.string()),
    country: v.optional(v.string()),
    city: v.optional(v.string()),
    experience: v.optional(v.number()), // Опыт в годах
    budget: v.optional(v.string()), // Бюджет (вилка)
    niche: v.optional(v.string()), // Ниша/сфера
    preferredTime: v.optional(v.array(v.string())), // Удобное время для звонка
    qualification: v.object({
      hasExperience: v.boolean(),
      hasContacts: v.boolean(),
      hasBudget: v.boolean(),
      readyToSell: v.boolean(),
    }),
    status: v.string(), // 'new' | 'qualified' | 'scheduled' | 'completed' | 'rejected'
    callScheduled: v.optional(v.number()), // Время запланированного звонка
    notes: v.optional(v.string()),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_chat_id", ["chatId"])
    .index("by_status", ["status"])
    .index("by_created_at", ["createdAt"]),

  // Таблица для хранения записей на звонки
  callBookings: defineTable({
    chatId: v.string(),
    leadId: v.id("leads"),
    preferredTimes: v.array(v.string()),
    selectedTime: v.optional(v.string()),
    status: v.string(), // 'pending' | 'confirmed' | 'completed' | 'cancelled'
    reminderSent: v.boolean(),
    createdAt: v.number(),
    scheduledFor: v.optional(v.number()),
  })
    .index("by_chat_id", ["chatId"])
    .index("by_status", ["status"])
    .index("by_scheduled_for", ["scheduledFor"]),

  // Таблица для хранения вопросов пользователей
  questions: defineTable({
    chatId: v.string(),
    leadId: v.id("leads"),
    question: v.string(),
    answer: v.optional(v.string()),
    status: v.string(), // 'pending' | 'answered' | 'closed'
    createdAt: v.number(),
    answeredAt: v.optional(v.number()),
  })
    .index("by_chat_id", ["chatId"])
    .index("by_lead_id", ["leadId"])
    .index("by_status", ["status"])
    .index("by_created_at", ["createdAt"]),
});
