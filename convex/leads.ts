import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

// Создать или обновить лида
export const upsertLead = mutation({
  args: {
    chatId: v.string(),
    userId: v.string(),
    username: v.optional(v.string()),
    firstName: v.optional(v.string()),
    lastName: v.optional(v.string()),
    email: v.optional(v.string()),
    phone: v.optional(v.string()),
    country: v.optional(v.string()),
    city: v.optional(v.string()),
    experience: v.optional(v.number()),
    budget: v.optional(v.string()),
    niche: v.optional(v.string()),
    preferredTime: v.optional(v.array(v.string())),
    qualification: v.optional(v.object({
      hasExperience: v.boolean(),
      hasContacts: v.boolean(),
      hasBudget: v.boolean(),
      readyToSell: v.boolean(),
    })),
    status: v.optional(v.string()),
    notes: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const now = Date.now();
    
    console.log("Upserting lead with args:", JSON.stringify(args, null, 2));
    
    // Проверяем, существует ли уже лид
    const existing = await ctx.db
      .query("leads")
      .withIndex("by_chat_id", (q) => q.eq("chatId", args.chatId))
      .first();

    if (existing) {
      console.log("Updating existing lead:", existing._id);
      // Обновляем существующего лида - только переданные поля
      const updateData: any = {
        updatedAt: now,
      };
      
      // Обновляем только те поля, которые переданы
      if (args.username !== undefined) updateData.username = args.username;
      if (args.firstName !== undefined) updateData.firstName = args.firstName;
      if (args.lastName !== undefined) updateData.lastName = args.lastName;
      if (args.email !== undefined) updateData.email = args.email;
      if (args.phone !== undefined) updateData.phone = args.phone;
      if (args.country !== undefined) updateData.country = args.country;
      if (args.city !== undefined) updateData.city = args.city;
      if (args.experience !== undefined) updateData.experience = args.experience;
      if (args.budget !== undefined) updateData.budget = args.budget;
      if (args.niche !== undefined) updateData.niche = args.niche;
      if (args.preferredTime !== undefined) updateData.preferredTime = args.preferredTime;
      if (args.qualification !== undefined) updateData.qualification = args.qualification;
      if (args.status !== undefined) updateData.status = args.status;
      if (args.notes !== undefined) updateData.notes = args.notes;
      
      console.log("Update data:", JSON.stringify(updateData, null, 2));
      
      await ctx.db.patch(existing._id, updateData);
      return existing._id;
    } else {
      console.log("Creating new lead");
      // Создаем нового лида
      const newLead = await ctx.db.insert("leads", {
        chatId: args.chatId,
        userId: args.userId,
        username: args.username,
        firstName: args.firstName,
        lastName: args.lastName,
        email: args.email,
        phone: args.phone,
        country: args.country,
        city: args.city,
        experience: args.experience,
        budget: args.budget,
        niche: args.niche,
        preferredTime: args.preferredTime,
        qualification: args.qualification || {
          hasExperience: false,
          hasContacts: false,
          hasBudget: false,
          readyToSell: false,
        },
        status: args.status || "new",
        createdAt: now,
        updatedAt: now,
      });
      console.log("Created new lead:", newLead);
      return newLead;
    }
  },
});

// Получить лида по chatId
export const getLead = query({
  args: { chatId: v.string() },
  handler: async (ctx, args) => {
    const lead = await ctx.db
      .query("leads")
      .withIndex("by_chat_id", (q) => q.eq("chatId", args.chatId))
      .first();
    console.log("Retrieved lead for chatId", args.chatId, ":", JSON.stringify(lead, null, 2));
    return lead;
  },
});

// Получить лида по ID
export const getLeadById = query({
  args: { leadId: v.id("leads") },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.leadId);
  },
});

// Обновить статус лида
export const updateLeadStatus = mutation({
  args: {
    chatId: v.string(),
    status: v.string(),
    notes: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const lead = await ctx.db
      .query("leads")
      .withIndex("by_chat_id", (q) => q.eq("chatId", args.chatId))
      .first();

    if (lead) {
      await ctx.db.patch(lead._id, {
        status: args.status,
        notes: args.notes,
        updatedAt: Date.now(),
      });
    }
  },
});

// Обновить квалификацию лида
export const updateLeadQualification = mutation({
  args: {
    chatId: v.string(),
    qualification: v.object({
      hasExperience: v.boolean(),
      hasContacts: v.boolean(),
      hasBudget: v.boolean(),
      readyToSell: v.boolean(),
    }),
  },
  handler: async (ctx, args) => {
    const lead = await ctx.db
      .query("leads")
      .withIndex("by_chat_id", (q) => q.eq("chatId", args.chatId))
      .first();

    if (lead) {
      await ctx.db.patch(lead._id, {
        qualification: args.qualification,
        updatedAt: Date.now(),
      });
    }
  },
});

// Получить всех лидов
export const getAllLeads = query({
  args: { status: v.optional(v.string()) },
  handler: async (ctx, args) => {
    if (args.status) {
      return await ctx.db
        .query("leads")
        .withIndex("by_status", (q) => q.eq("status", args.status!))
        .order("desc")
        .collect();
    } else {
      return await ctx.db
        .query("leads")
        .order("desc")
        .collect();
    }
  },
});

// Получить лидов по статусу
export const getLeadsByStatus = query({
  args: { status: v.string() },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("leads")
      .withIndex("by_status", (q) => q.eq("status", args.status))
      .order("desc")
      .collect();
  },
});

// Получить статистику лидов
export const getLeadsStats = query({
  handler: async (ctx) => {
    const allLeads = await ctx.db.query("leads").collect();
    
    const stats = {
      total: allLeads.length,
      new: 0,
      qualified: 0,
      scheduled: 0,
      completed: 0,
      rejected: 0,
    };

    allLeads.forEach(lead => {
      switch (lead.status) {
        case "new":
          stats.new++;
          break;
        case "qualified":
          stats.qualified++;
          break;
        case "scheduled":
          stats.scheduled++;
          break;
        case "completed":
          stats.completed++;
          break;
        case "rejected":
          stats.rejected++;
          break;
      }
    });

    return stats;
  },
});

// Отладочная функция - получить все лиды с полной информацией
export const debugGetAllLeads = query({
  handler: async (ctx) => {
    const allLeads = await ctx.db.query("leads").collect();
    console.log("All leads in database:", JSON.stringify(allLeads, null, 2));
    return allLeads;
  },
});
