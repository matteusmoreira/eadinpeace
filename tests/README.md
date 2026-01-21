# 🧪 Testes Automatizados - EAD Platform

## 🚀 Início Rápido

### 1. Configure Credenciais

Edite `.env.local` e adicione:

```env
E2E_EMAIL=seu-email-de-teste@example.com
E2E_PASSWORD=sua-senha-de-teste
```

### 2. Inicie o Servidor

```bash
npm run dev
```

### 3. Execute os Testes

Em outro terminal:

```bash
# Ver testes em modo interativo
npm run test:ui

# Ou executar todos os testes
npm test
```

### 4. Faça Login Quando Solicitado

Na primeira execução, uma janela do navegador abrirá para você fazer login. Após o login, feche a janela e os testes continuarão automaticamente.

## 📚 Documentação Completa

Veja [docs/TESTING.md](file:///c:/Users/matte/Desktop/EAD%20Top%202027%20para%20inpeace/docs/TESTING.md) para documentação detalhada.

## 🧪 Testes Disponíveis

- ✅ Criação de cursos
- ✅ Visualização de cursos e aulas
- ✅ Jornada completa do aluno
- ✅ Segurança multi-tenancy
- ✅ Navegação entre páginas

## 📊 Comandos Úteis

```bash
# Modo interativo (recomendado)
npm run test:ui

# Executar todos os testes
npm test

# Executar teste específico
npm test tests/courses/course-creation.spec.ts

# Com debug
npm run test:debug

# Ver relatório HTML
npm run test:report
```

## ⚠️ Importante

- **Sempre execute o servidor (`npm run dev`) antes dos testes**
- **Configure credenciais de teste em `.env.local`**
- **Faça login quando solicitado na primeira execução**

## 🐛 Troubleshooting

Consulte a seção de [Troubleshooting](file:///c:/Users/matte/Desktop/EAD%20Top%202027%20para%20inpeace/docs/TESTING.md#troubleshooting) na documentação completa.
