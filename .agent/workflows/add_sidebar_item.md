---
description: Como adicionar um novo item no menu lateral (sidebar)
---

Siga estes passos para adicionar um novo item de navegação no menu lateral da aplicação.

### 1. Editar a configuração do Sidebar

Edite o arquivo `src/components/layout/sidebar.tsx`.

1. Localize a constante `menuSections`.
2. Encontre a seção correspondente ao perfil de usuário (`role`) que deve ver o item (ex: "Ensino" para Professor, "Aprendizado" para Student).
3. Adicione um novo objeto ao array `items` da seção desejada.

```typescript
{
    title: "Título do Item",
    href: "/caminho/do/item", // URL da página
    icon: IconName,           // Importar ícone do lucide-react
    badge: "Novo"             // (Opcional) Texto de badge
},
```

**Importante:** Não esqueça de importar o ícone do `lucide-react` no topo do arquivo.

### 2. Criar a Página (Rota)

Crie a página correspondente ao `href` definido.

Por exemplo, se `href` for `/professor/new-feature`:
1. Crie a pasta `src/app/(dashboard)/professor/new-feature`.
2. Crie o arquivo `page.tsx` dentro dessa pasta.

```tsx
"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function NewFeaturePage() {
    return (
        <div className="space-y-6">
            <h1 className="text-2xl font-bold">Título do Item</h1>
            <Card>
                <CardHeader>
                    <CardTitle>Conteúdo</CardTitle>
                </CardHeader>
                <CardContent>
                    <p>Implementação da nova funcionalidade aqui.</p>
                </CardContent>
            </Card>
        </div>
    );
}
```

### 3. Verificar Permissões (Opcional)

Se a rota requer permissões específicas além do layout padrão do dashboard, verifique se o middleware ou verificação de role na página estão corretos. O layout padrão `(dashboard)` já deve tratar a proteção básica de rotas autenticadas.
