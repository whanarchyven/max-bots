#!/usr/bin/env bun

import { spawn } from "child_process";

console.log("🚀 Запуск Max Bot - все сервисы");
console.log("================================");

// Проверяем токен
const mainToken = process.env.TELEGRAM_BOT_TOKEN;

console.log("🔍 Проверка токена:");
console.log("Основной бот:", mainToken?.substring(0, 10) + "...");

if (!mainToken) {
  console.error("❌ ОШИБКА: Не указан TELEGRAM_BOT_TOKEN!");
  console.error("Проверьте файл .env");
  process.exit(1);
}

console.log("✅ Токен установлен, продолжаем...");

// Запуск Convex
console.log("🔧 Запуск Convex...");
const convex = spawn("bunx", ["convex", "dev"], {
  stdio: "inherit",
  shell: true
});

// Ждем немного
setTimeout(() => {
  // Запуск основного бота
  console.log("🤖 Запуск основного бота...");
  const mainBot = spawn("bun", ["run", "index.ts"], {
    stdio: "inherit",
    shell: true
  });

  console.log("✅ Все сервисы запущены!");
  console.log("💡 Для остановки нажмите Ctrl+C");

  // Обработка завершения
  process.on("SIGINT", () => {
    console.log("\n🛑 Остановка сервисов...");
    convex.kill("SIGTERM");
    mainBot.kill("SIGTERM");
    process.exit(0);
  });
}, 3000);
