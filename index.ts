import { Bot } from "grammy";
import { ConvexHttpClient } from "convex/browser";
import { api } from "./convex/_generated/api";

// Инициализация бота
const botToken = process.env.TELEGRAM_BOT_TOKEN!;
console.log("🤖 Основной бот токен:", botToken.substring(0, 10) + "...");
const bot = new Bot(botToken);
const convex = new ConvexHttpClient(process.env.CONVEX_URL!);

// ID администраторов для получения уведомлений
const ADMIN_CHAT_IDS = process.env.ADMIN_CHAT_IDS?.split(',').map(id => parseInt(id.trim())) || [];
console.log("👥 Администраторы:", ADMIN_CHAT_IDS);

// Функция для отправки уведомления о новом лиде
async function sendNewLeadNotification(leadId: any) {
  try {
    const lead = await convex.query(api.leads.getLeadById, { leadId });
    if (!lead) {
      console.error("Lead not found:", leadId);
      return;
    }

    const message = `*Новый лид:*
Имя: ${lead.firstName || "N/A"} ${lead.lastName || ""}
Telegram: ${lead.username ? `@${lead.username}` : "N/A"}
Email: ${lead.email || "N/A"}
Телефон: ${lead.phone || "N/A"}
Страна/Город: ${lead.country || "N/A"} ${lead.city || ""}
Опыт: ${lead.experience || "N/A"} лет
Бюджет: ${lead.budget || "N/A"}
Ниша: ${lead.niche || "N/A"}
Предпочтительное время: ${lead.preferredTime?.join(", ") || "N/A"}
Статус: ${lead.status}
Chat ID: \`${lead.chatId}\`
User ID: \`${lead.userId}\``;

    for (const chatId of ADMIN_CHAT_IDS) {
      await bot.api.sendMessage(chatId, message, { parse_mode: "Markdown" });
    }
  } catch (error) {
    console.error("Ошибка при отправке уведомления о новом лиде:", error);
  }
}

// Функция для отправки уведомления о новом вопросе
async function sendNewQuestionNotification(questionId: any) {
  try {
    const question = await convex.query(api.questions.getQuestionById, { questionId });
    if (!question) {
      console.error("Question not found:", questionId);
      return;
    }
    const lead = await convex.query(api.leads.getLead, { chatId: question.chatId });

    const message = `*Новый вопрос:*
От пользователя: ${lead?.firstName || "N/A"} ${lead?.lastName || ""} (${lead?.username ? `@${lead?.username}` : "N/A"})
Вопрос: ${question.question}
Chat ID: \`${question.chatId}\`
Время: ${new Date(question.createdAt).toLocaleString()}`;

    for (const chatId of ADMIN_CHAT_IDS) {
      await bot.api.sendMessage(chatId, message, { parse_mode: "Markdown" });
    }
  } catch (error) {
    console.error("Ошибка при отправке уведомления о новом вопросе:", error);
  }
}

// Типы для состояний диалога
type DialogStep = 
  | "welcome"
  | "want_details"
  | "how_it_works"
  | "financial_model"
  | "investments"
  | "roles"
  | "qualification"
  | "call_booking"
  | "call_form"
  | "call_form_name"
  | "call_form_contact"
  | "call_form_location"
  | "call_form_experience"
  | "call_form_budget"
  | "call_form_niche"
  | "call_form_time"
  | "call_confirmation"
  | "faq"
  | "beginner_check";

// Сообщения из ТЗ
const messages = {
  welcome: `Привет! Если коротко: мы вместе с тобой *за 6 месяцев* собираем *B2B-бизнес на ИИ-агентах* с оборотом примерно *$15 000 в месяц*.  
Ещё через несколько месяцев — *готовим и продаём бизнес*. Доход на продаже делим.  
Ищем *10 партнёров (для открытия бизнесов на международном рынке)*. Никаких «курсов» и волшебных кнопок — работаем плечом к плечу.  
Если ты из тех, кто делает — добро пожаловать.`,

  wantDetails: `Супер. Ниже — всё по делу: как это работает, пример цифр, вложения, роли.  
Пролистай, а дальше — на созвон, обсудим, а также проведем собеседование.`,

  howItWorks: `*Первые 4-8 недель.* Открытие компании, счета.  
*2-4 месяца.* Мы вместе запускаем пилоты и выходим на *3–5 платящих клиентов*. Это не «холодные мечты», а конкретные встречи, предложения и сделки. Ты берёшь на себя локальные продажи и связи, мы — сборку ИИ-агентов «под ключ» и упаковку оффера.

*К 4–6 месяцу.* Цель — *стабильные ~$15 000 MRR* за счёт подписок/ретейнеров. Мы настраиваем продуктовые пакеты, метрики, обслуживание, чтобы деньги шли не разово, а регулярно.

*К 10–12 месяцу.* Готовим бизнес к продаже: собираем документы, подтверждаем показатели, приводим процессы в порядок. По нашим кейсам *средняя цена сделки ~50 млн ₽*. Доход от сделки *делим*.

Важно: мы не обещаем «всем и сразу». *Результат зависит от твоей деятельности и исполнения.* Наша задача — ускорять и держать траекторию к цели.`,

  financialModel: `Давай на цифрах, без тумана.  
*Ориентир на 6 месяцев:* выходим на *~$15 000/мес в подписках*. Это обычно *20–30 клиентов* на ретейнерах.

*Что в итоге по этапам:*  
*1–6 месяц.* Продуктовые внедрения: около *30 разработок* с чеком *$2 000–5 000* каждая.  
➜ Валовая выручка ~*$80 000* только на разработках.  
➜ Оценка чистой прибыли ~*30%* → *~$24 000*.

*6–12 месяц.* Подписки + новые клиенты: *~$15 000/мес MRR* и прирост.  
➜ Оценка чистой прибыли с подписок *~70%* → *~$10 000/мес*.

*12+ месяц.* *Продажа бизнеса.*  
➜ Ориентир по сделке ~*40 млн ₽* прибыли.

*Итого ориентир за год:* около *50 млн ₽* прибыли суммарно (разработка + подписки + продажа).  
Это *не обещание*, а рабочая модель, к которой мы ведём: знаем *как* туда прийти шагами — пилоты → MRR → упаковка → сделка.`,

  investments: `Цифры ниже — ориентиры. Они зависят от страны, банка и выбранной модели продаж.

• *Партнёрский взнос* (старт, онбординг, настройка процессов): *от 250 000 ₽*  
• *Регистрация компании* (юрист/сбор документов): *от 100 000 ₽*  
• *Открытие счёта* (банк/финтех): *от 50 000 ₽*  
• *Операционные расходы 3–4 мес.*: от *100 000 ₽*

Мы помогаем подобрать оптимальные и быстрые маршруты по юрлицу/счёту. Наша позиция простая: *минимум лишнего, максимум понятности*.`,

  roles: `*От нас:*
• Полная *сборка ИИ-агентов «под ключ»*: от настройки до качества ответов.  
• *Методика продаж* и продуктовые пакеты: что именно продаём и как.  
• *Подготовка к продаже бизнеса*: документы, показатели, процесс сделки.  
• Помощь с *регистрацией компании* и *открытием счёта*.

*Как мы зарабатываем:* честно и просто — *процент от продажи бизнеса*. Разработку и поддержку агентов делаем *по себестоимости*. Нам выгодно, чтобы ты вырос и *сделка состоялась*.

*От тебя:*
• *Бюджет* на вход и первые месяцы операционки (смотри ориентиры выше).  
• *Личные продажи и нетворк*: встречи, переговоры, первые клиенты.  
• *Английский* для деловой коммуникации (если целевой рынок этого требует).  
• *15–20 часов в неделю* на развитие: созвоны, обратная связь, контроль.

Если всё это про тебя — у нас сойдется темп и результат.`,

  qualification: `Чтобы мы двигались быстро и по делу — отметь галочками:  
☐ Есть опыт: *2+ года* предпринимательства / топ-менеджмента  
☐ Есть *10–20 тёплых контактов* для стартовых встреч в твоём рынке  
☐ Есть *бюджет* на вход и 3–4 месяца операционки  
☐ Готов(а) *лично вести продажи/аккаунт* на старте. Или есть команда

Это не «экзамен». Нам важно понимать, что ты реально готов(а) заходить, и мы сможем дать тебе темп.`,

  callBooking: `Предлагаю *личный созвон на 20–30 минут*. Разберём твой рынок, прикинем путь к ~$15 000/мес и обсудим, как готовим к продаже.  
Формат без «воды»: факты, цифры, следующие шаги.`,

  callForm: `Отлично! Давайте пошагово соберем информацию для записи на звонок.

*Шаг 1 из 7: Как вас зовут?*
Напишите ваше имя и фамилию.`,

  callFormName: `*Шаг 2 из 7: Контакты*
Как с вами связаться? Укажите:
• Telegram (например: @username)
• Email (например: name@example.com)
• Или телефон`,

  callFormContact: `*Шаг 3 из 7: Местоположение*
В какой стране и городе вы находитесь?`,

  callFormLocation: `*Шаг 4 из 7: Опыт*
Сколько лет опыта у вас в предпринимательстве или топ-менеджменте?`,

  callFormExperience: `*Шаг 5 из 7: Бюджет*
Какой бюджет вы готовы вложить в старт и первые месяцы операционки?
(например: 1-2 млн руб, 500-800 тыс руб)`,

  callFormBudget: `*Шаг 6 из 7: Ниша*
В какой сфере/нише вы работаете или планируете работать?
(например: IT-услуги, консалтинг, e-commerce)`,

  callFormTime: `*Шаг 7 из 7: Время для звонка*
Когда вам удобно созвониться? Укажите 2-3 варианта времени.
(например: завтра с 10 до 12, в среду вечером, в пятницу с 14 до 16)`,

  callConfirmation: `Бронь принята. За *2 часа* до встречи напомню здесь же.  
Если планы поменяются — нажми *«Перенести»*.`,

  faq: `*— Есть ли гарантии?*
Честно: *гарантий нет*. Мы не продаём «кнопку». Мы заходим вместе и работаем по взрослому: первые клиенты, MRR, документы, сделка. *Результат зависит от твоей активности и исполнения.* Мы добавляем методику, руки и темп.

*— В чём ваша выгода?*
Прямо: *мы зарабатываем на экзите* — берём процент от продажи бизнеса. Всё, что касается разработки и поддержки агентов, делаем *по себестоимости*. Нам выгодно вырастить и *красиво продать*.

*— В какие ниши вы заходите?*
*Любые B2B-сервисы*, где есть процесс, клиенты и повторяемая ценность: поддержка клиентов, пред- и постпродажные коммуникации, лид-менеджмент, автоматизация маркетинга/операций, внутренние процессы и т. д. Если есть понятная задача бизнеса — мы умеем это собрать.

*— Насколько реальны сроки?*
*1-4 месяца* — первые платящие клиенты. *4–6 месяцев* — цель ~$15 000/мес. *10–12 месяцев* — подготовка к продаже. Это живой темп, без суеты и пустых обещаний.`,

  beginnerCheck: `Сейчас мы набираем тех, кто готов *входить по-взрослому*. Ответь честно на два пункта:

1. Насколько ты уверен(а) в себе как предприниматель — по шкале *1–10*?  
2. Есть ли *1 000 000 ₽+*, которые ты готов(а) вложить в старт и операционку?  

Если по обоим пунктам «да» — двигаемся дальше. Если нет — дам *короткий чек-лист*, чтобы подготовиться, и на этом не потеряемся.`
};

// Кнопки для навигации
const keyboards = {
  welcome: {
    reply_markup: {
      inline_keyboard: [
        [{ text: "Хочу детали", callback_data: "want_details" }],
        [{ text: "Я начинающий — уточнить", callback_data: "beginner_check" }],
        [{ text: "FAQ", callback_data: "faq" }]
      ]
    }
  },

  mainMenu: {
    reply_markup: {
      inline_keyboard: [
        [{ text: "Как это работает", callback_data: "how_it_works" }],
        [{ text: "Финмодель (пример)", callback_data: "financial_model" }],
        [{ text: "Вложения", callback_data: "investments" }],
        [{ text: "От нас / От тебя", callback_data: "roles" }],
        [{ text: "Записаться на звонок", callback_data: "call_booking" }],
        [{ text: "FAQ", callback_data: "faq" }]
      ]
    }
  },

  qualification: {
    reply_markup: {
      inline_keyboard: [
        [{ text: "Подтверждаю", callback_data: "qualified" }],
        [{ text: "Записаться на звонок", callback_data: "call_booking" }]
      ]
    }
  },

  callBooking: {
    reply_markup: {
      inline_keyboard: [
        [{ text: "Выбрать время", callback_data: "call_form" }]
      ]
    }
  },

  callForm: {
    reply_markup: {
      inline_keyboard: [
        [{ text: "Назад", callback_data: "call_booking" }]
      ]
    }
  },

  callFormSteps: {
    reply_markup: {
      inline_keyboard: [
        [{ text: "Назад", callback_data: "call_booking" }]
      ]
    }
  },

  callConfirmation: {
    reply_markup: {
      inline_keyboard: [
        [{ text: "Перенести", callback_data: "reschedule_call" }],
        [{ text: "Отменить", callback_data: "cancel_call" }],
        [{ text: "Задать вопрос", callback_data: "ask_question" }]
      ]
    }
  },

  faq: {
    reply_markup: {
      inline_keyboard: [
        [{ text: "Записаться на звонок", callback_data: "call_booking" }],
        [{ text: "Задать вопрос", callback_data: "ask_question" }]
      ]
    }
  }
};

// Функция для сохранения сообщения в базу данных
async function saveMessage(chatId: string, messageId: number, text: string, messageType: string, step: string) {
  try {
    await convex.mutation(api.conversations.addMessage, {
      chatId,
      messageId,
      text,
      messageType,
      step,
    });
  } catch (error) {
    console.error("Ошибка при сохранении сообщения:", error);
  }
}

// Функция для обновления шага диалога
async function updateDialogStep(chatId: string, step: string, messageId?: number) {
  try {
    await convex.mutation(api.conversations.updateConversationStep, {
      chatId,
      step,
      lastMessageId: messageId,
    });
  } catch (error) {
    console.error("Ошибка при обновлении шага диалога:", error);
  }
}

// Функция для создания/обновления лида
async function upsertLead(chatId: string, userId: string, userInfo: any, additionalData: any = {}) {
  try {
    await convex.mutation(api.leads.upsertLead, {
      chatId,
      userId,
      username: userInfo.username,
      firstName: userInfo.first_name,
      lastName: userInfo.last_name,
      ...additionalData,
    });
  } catch (error) {
    console.error("Ошибка при создании/обновлении лида:", error);
  }
}

// Функция для обработки пошаговой анкеты
async function processStepForm(chatId: string, userId: string, text: string, ctx: any, currentStep: string) {
  try {
    let nextStep = "";
    let responseText = "";
    let keyboard = keyboards.callFormSteps;

    switch (currentStep) {
      case "call_form_name":
        // Сохраняем имя
        console.log("Saving name:", text.trim(), "for chatId:", chatId, "userId:", userId);
        await convex.mutation(api.leads.upsertLead, {
          chatId,
          userId,
          firstName: text.trim(),
        });
        nextStep = "call_form_contact";
        responseText = messages.callFormName;
        break;

      case "call_form_contact":
        // Сохраняем контакты
        console.log("Saving contact:", text.trim(), "for chatId:", chatId);
        await convex.mutation(api.leads.upsertLead, {
          chatId,
          userId,
          email: text.includes('@') ? text.trim() : undefined,
          phone: text.includes('@') ? undefined : text.trim(),
        });
        nextStep = "call_form_location";
        responseText = messages.callFormContact;
        break;

      case "call_form_location":
        // Сохраняем местоположение
        await convex.mutation(api.leads.upsertLead, {
          chatId,
          userId,
          country: text.trim(),
        });
        nextStep = "call_form_experience";
        responseText = messages.callFormLocation;
        break;

      case "call_form_experience":
        // Сохраняем опыт
        const experience = parseInt(text.match(/\d+/)?.[0] || '0');
        await convex.mutation(api.leads.upsertLead, {
          chatId,
          userId,
          experience: experience,
        });
        nextStep = "call_form_budget";
        responseText = messages.callFormExperience;
        break;

      case "call_form_budget":
        // Сохраняем бюджет
        await convex.mutation(api.leads.upsertLead, {
          chatId,
          userId,
          budget: text.trim(),
        });
        nextStep = "call_form_niche";
        responseText = messages.callFormBudget;
        break;

      case "call_form_niche":
        // Сохраняем нишу
        await convex.mutation(api.leads.upsertLead, {
          chatId,
          userId,
          niche: text.trim(),
        });
        nextStep = "call_form_time";
        responseText = messages.callFormTime;
        break;

      case "call_form_time":
        // Проверяем, это первое заполнение или изменение времени
        const existingLead = await convex.query(api.leads.getLead, { chatId });
        const isReschedule = existingLead && existingLead.status === "qualified";

        if (isReschedule) {
          // Обновляем только время для существующей записи
          await convex.mutation(api.leads.upsertLead, {
            chatId,
            userId,
            preferredTime: [text.trim()],
          });

          // Обновляем запись на звонок
          const booking = await convex.query(api.callBookings.getCallBooking, { chatId });
          if (booking) {
            await convex.mutation(api.callBookings.updateCallBooking, {
              chatId,
              selectedTime: text.trim(),
              status: "pending",
            });
          }

          nextStep = "call_confirmation";
          responseText = "*Время звонка обновлено!* За *2 часа* до встречи напомню здесь же.";
          keyboard = keyboards.callConfirmation;
        } else {
          // Первое заполнение - сохраняем время и завершаем анкету
          await convex.mutation(api.leads.upsertLead, {
            chatId,
            userId,
            preferredTime: [text.trim()],
            status: "qualified",
          });

          // Создаем запись на звонок ТОЛЬКО на последнем шаге
          const lead = await convex.query(api.leads.getLead, { chatId });
          if (lead) {
            await convex.mutation(api.callBookings.createCallBooking, {
              chatId,
              leadId: lead._id,
              preferredTimes: [text.trim()],
            });

            // Отправляем уведомление о новом лиде
            await sendNewLeadNotification(lead._id);
          }

          nextStep = "call_confirmation";
          responseText = "*Спасибо! Я получил вашу заявку.* В ближайшее время с вами свяжется наш менеджер для уточнения деталей и выбора удобного времени для звонка.";
          keyboard = keyboards.callConfirmation;
        }
        break;

      default:
        responseText = "Произошла ошибка. Попробуйте начать заново.";
        keyboard = keyboards.callBooking;
    }

    // Отправляем ответ
    await ctx.reply(responseText, {
      parse_mode: "Markdown",
      reply_markup: keyboard.reply_markup
    });

    // Обновляем шаг диалога
    if (nextStep) {
      await updateDialogStep(chatId, nextStep);
    }

  } catch (error) {
    console.error("Ошибка при обработке шага анкеты:", error);
    await ctx.reply("Произошла ошибка при обработке ваших данных. Попробуйте еще раз или обратитесь к администратору.", {
      parse_mode: "Markdown"
    });
  }
}

// Обработка команды /start
bot.command("start", async (ctx) => {
  if (!ctx.from) return;
  
  const chatId = ctx.chat.id.toString();
  const userId = ctx.from.id.toString();
  const userInfo = ctx.from;

  // Создаем/обновляем переписку
  await convex.mutation(api.conversations.upsertConversation, {
    chatId,
    userId,
    username: userInfo.username,
    firstName: userInfo.first_name,
    lastName: userInfo.last_name,
    currentStep: "welcome",
  });

  // Создаем/обновляем лида
  await upsertLead(chatId, userId, userInfo);

  // Отправляем приветственное сообщение
  const message = await ctx.reply(messages.welcome, { 
    ...keyboards.welcome, 
    parse_mode: "Markdown" 
  });
  
  // Сохраняем сообщение
  await saveMessage(chatId, message.message_id, messages.welcome, "bot", "welcome");
});

// Обработка callback запросов
bot.on("callback_query", async (ctx) => {
  if (!ctx.from || !ctx.chat) return;
  
  const chatId = ctx.chat.id.toString();
  const userId = ctx.from.id.toString();
  const callbackData = ctx.callbackQuery.data;
  const userInfo = ctx.from;

  // Обновляем переписку
  await convex.mutation(api.conversations.upsertConversation, {
    chatId,
    userId,
    username: userInfo.username,
    firstName: userInfo.first_name,
    lastName: userInfo.last_name,
    currentStep: callbackData || "unknown",
  });

  let responseText = "";
  let keyboard: any = null;

  switch (callbackData) {
    case "want_details":
      responseText = messages.wantDetails;
      keyboard = keyboards.mainMenu;
      break;

    case "how_it_works":
      responseText = messages.howItWorks;
      keyboard = keyboards.mainMenu;
      break;

    case "financial_model":
      responseText = messages.financialModel;
      keyboard = keyboards.mainMenu;
      break;

    case "investments":
      responseText = messages.investments;
      keyboard = keyboards.mainMenu;
      break;

    case "roles":
      responseText = messages.roles;
      keyboard = keyboards.mainMenu;
      break;

    case "qualification":
      responseText = messages.qualification;
      keyboard = keyboards.qualification;
      break;

    case "call_booking":
      responseText = messages.callBooking;
      keyboard = keyboards.callBooking;
      break;

    case "call_form":
      responseText = messages.callForm;
      keyboard = keyboards.callForm;
      // Обновляем шаг диалога на первый шаг анкеты
      await updateDialogStep(chatId, "call_form_name");
      break;

    case "faq":
      responseText = messages.faq;
      keyboard = keyboards.faq;
      break;

    case "beginner_check":
      responseText = messages.beginnerCheck;
      keyboard = {
        reply_markup: {
          inline_keyboard: [
            [{ text: "Да, готов(а)", callback_data: "ready_yes" }],
            [{ text: "Нет, 1 млн нет", callback_data: "ready_no" }]
          ]
        }
      };
      break;

    case "ready_yes":
      responseText = "Отлично! Переходим к деталям.";
      keyboard = keyboards.mainMenu;
      break;

    case "ready_no":
      responseText = "Понятно. Вот короткий чек-лист для подготовки:\n\n1. Накопите опыт в предпринимательстве (2+ года)\n2. Соберите бюджет от 1 млн ₽\n3. Постройте сеть контактов в вашей нише\n4. Изучите B2B-продажи\n\nКогда будете готовы — возвращайтесь!";
      keyboard = keyboards.welcome;
      break;

    case "qualified":
      responseText = "Отлично! Теперь можем перейти к записи на звонок.";
      keyboard = keyboards.callBooking;
      break;


    case "reschedule_call":
      responseText = "Хорошо, давайте перенесем звонок. Выберите новое время:";
      keyboard = keyboards.callBooking;
      // Обновляем шаг для изменения времени
      await updateDialogStep(chatId, "call_form_time");
      break;

    case "cancel_call":
      responseText = "Звонок отменен. Если передумаете — всегда можете записаться снова.";
      keyboard = keyboards.welcome;
      break;

    case "ask_question":
      responseText = "Задайте ваш вопрос, и я постараюсь на него ответить.";
      break;

    default:
      responseText = "Не понимаю эту команду. Попробуйте еще раз.";
      keyboard = keyboards.welcome;
  }

  // Отправляем ответ
  await ctx.answerCallbackQuery();
  const message = await ctx.editMessageText(responseText, { 
    ...(keyboard || {}), 
    parse_mode: "Markdown" 
  });
  
  // Сохраняем сообщение
  if (message && typeof message === 'object' && 'message_id' in message) {
    await saveMessage(chatId, message.message_id, responseText, "bot", callbackData || "unknown");
  }
});

// Обработка текстовых сообщений
bot.on("message:text", async (ctx) => {
  if (!ctx.from) return;
  
  const chatId = ctx.chat.id.toString();
  const userId = ctx.from.id.toString();
  const text = ctx.message.text;
  const messageId = ctx.message.message_id;

  // Получаем текущий шаг диалога
  const conversation = await convex.query(api.conversations.getConversation, { chatId });
  
  if (!conversation) {
    await ctx.reply("Пожалуйста, начните с команды /start", { 
      parse_mode: "Markdown" 
    });
    return;
  }

  // Сохраняем сообщение пользователя
  await saveMessage(chatId, messageId, text, "user", conversation.currentStep);

  // Обработка в зависимости от текущего шага
  switch (conversation.currentStep) {
    case "ask_question":
      // Сохраняем вопрос в базу данных
      const lead = await convex.query(api.leads.getLead, { chatId });
      if (lead) {
        const questionId = await convex.mutation(api.questions.createQuestion, {
          chatId,
          leadId: lead._id,
          question: text,
        });

        // Отправляем уведомление о новом вопросе
        await sendNewQuestionNotification(questionId);

        await ctx.reply("*Спасибо за вопрос!* Я передам его команде, и мы обязательно ответим.", { 
          parse_mode: "Markdown" 
        });
      } else {
        await ctx.reply("Произошла ошибка. Попробуйте начать с команды /start", { 
          parse_mode: "Markdown" 
        });
      }
      break;

    case "call_form_name":
    case "call_form_contact":
    case "call_form_location":
    case "call_form_experience":
    case "call_form_budget":
    case "call_form_niche":
    case "call_form_time":
      // Обрабатываем пошаговую анкету пользователя
      await processStepForm(chatId, userId, text, ctx, conversation.currentStep);
      break;

    default:
      await ctx.reply("Используйте кнопки для навигации по боту.", { 
        parse_mode: "Markdown" 
      });
  }
});

// Админские команды
bot.command("stats", async (ctx) => {
  if (!ADMIN_CHAT_IDS.includes(ctx.chat.id)) {
    await ctx.reply("У вас нет прав для выполнения этой команды.");
    return;
  }
  
  try {
    const stats = await convex.query(api.leads.getLeadsStats);
    const questionStats = await convex.query(api.questions.getQuestionsStats);

    const message = `*Статистика системы:*

*Лиды:*
Всего: ${stats.total}
Новые: ${stats.new}
Квалифицированные: ${stats.qualified}
Запланированы звонки: ${stats.scheduled}
Завершены: ${stats.completed}
Отклонены: ${stats.rejected}

*Вопросы:*
Всего: ${questionStats.total}
В ожидании: ${questionStats.pending}
Отвечены: ${questionStats.answered}
Закрыты: ${questionStats.closed}`;
    
    await ctx.reply(message, { parse_mode: "Markdown" });
  } catch (error) {
    console.error("Ошибка получения статистики:", error);
    await ctx.reply("Ошибка получения статистики.");
  }
});

bot.command("leads", async (ctx) => {
  if (!ADMIN_CHAT_IDS.includes(ctx.chat.id)) {
    await ctx.reply("У вас нет прав для выполнения этой команды.");
    return;
  }
  
  try {
    const leads = await convex.query(api.leads.getAllLeads, {});
    let message = "*Список лидов:*\n\n";
    
    if (leads && leads.length > 0) {
      leads.forEach(lead => {
        message += `*ID:* \`${lead._id}\`\n`;
        message += `*Имя:* ${lead.firstName || "N/A"}\n`;
        message += `*Telegram:* ${lead.username ? `@${lead.username}` : "N/A"}\n`;
        message += `*Статус:* ${lead.status}\n`;
        message += `*Время звонка:* ${lead.preferredTime?.join(", ") || "N/A"}\n`;
        message += `--------------------\n`;
      });
    } else {
      message += "Лиды не найдены.";
    }
    
    await ctx.reply(message, { parse_mode: "Markdown" });
  } catch (error) {
    console.error("Ошибка получения лидов:", error);
    await ctx.reply("Ошибка получения лидов.");
  }
});

bot.command("questions", async (ctx) => {
  if (!ADMIN_CHAT_IDS.includes(ctx.chat.id)) {
    await ctx.reply("У вас нет прав для выполнения этой команды.");
    return;
  }
  
  try {
    const questions = await convex.query(api.questions.getAllQuestions, {});
    let message = "*Список вопросов:*\n\n";
    
    if (questions && questions.length > 0) {
      for (const q of questions) {
        const lead = await convex.query(api.leads.getLead, { chatId: q.chatId });
        message += `*ID:* \`${q._id}\`\n`;
        message += `*От:* ${lead?.firstName || "N/A"} (${lead?.username ? `@${lead?.username}` : "N/A"})\n`;
        message += `*Вопрос:* ${q.question}\n`;
        message += `*Статус:* ${q.status}\n`;
        message += `--------------------\n`;
      }
    } else {
      message += "Вопросы не найдены.";
    }
    
    await ctx.reply(message, { parse_mode: "Markdown" });
  } catch (error) {
    console.error("Ошибка получения вопросов:", error);
    await ctx.reply("Ошибка получения вопросов.");
  }
});

// Обработка ошибок
bot.catch((err) => {
  console.error("Ошибка в боте:", err);
});

// Запуск бота
if (process.env.TELEGRAM_BOT_TOKEN) {
  try {
    bot.start();
    console.log("🤖 Основной бот запущен!");
  } catch (error) {
    console.error("❌ Ошибка запуска основного бота:", error);
  }
} else {
  console.error("❌ Не указан TELEGRAM_BOT_TOKEN в переменных окружения");
}