#!/bin/bash

echo "🚀 Настройка PM2 для Max Bot"
echo "============================="

# Создаем папку для логов
mkdir -p logs

# Устанавливаем PM2 глобально
echo "📦 Установка PM2..."
bun add -g pm2

# Проверяем установку
echo "✅ Проверка PM2..."
pm2 --version

echo ""
echo "🎯 Готово! Теперь можно использовать:"
echo ""
echo "Запуск:"
echo "  bun run pm2:start"
echo ""
echo "Остановка:"
echo "  bun run pm2:stop"
echo ""
echo "Перезапуск:"
echo "  bun run pm2:restart"
echo ""
echo "Статус:"
echo "  bun run pm2:status"
echo ""
echo "Логи:"
echo "  bun run pm2:logs"
echo "  bun run pm2:logs:bot"
echo "  bun run pm2:logs:convex"
echo ""
echo "Удаление:"
echo "  bun run pm2:delete"
