#!/bin/bash

echo "🚀 Iniciando projeto React - AYÀ MI O JÁ"
echo "========================================"

# Verificar se node está instalado
if ! command -v node &> /dev/null; then
    echo "❌ Node.js não encontrado. Instale o Node.js primeiro."
    exit 1
fi

# Verificar se npm está instalado
if ! command -v npm &> /dev/null; then
    echo "❌ npm não encontrado. Instale o npm primeiro."
    exit 1
fi

echo "📦 Instalando dependências..."
npm install

if [ $? -eq 0 ]; then
    echo "✅ Dependências instaladas com sucesso!"
    echo ""
    echo "🌐 Iniciando servidor de desenvolvimento..."
    echo "   Acesse: http://localhost:3000"
    echo "   Para parar: Ctrl+C"
    echo ""
    npm run dev
else
    echo "❌ Erro ao instalar dependências."
    exit 1
fi
