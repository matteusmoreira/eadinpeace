# Plano de Implementação - Sistema de Cursos EAD

## 1. CORREÇÃO CRÍTICA - Erro ao salvar curso (campo level)

### convex/schema.ts (linha 64)
Trocar:
```
level: v.union(v.literal("beginner"), v.literal("intermediate"), v.literal("advanced")),
```
Por:
```
level: v.optional(v.union(v.literal("beginner"), v.literal("intermediate"), v.literal("advanced"))),
```

### convex/courses.ts (linha ~615)
Na mutation create, trocar o campo level de obrigatório para opcional

## 2. UPLOAD DE THUMBNAIL - 15MB e formatos específicos

### src/app/(dashboard)/admin/courses/new/page.tsx

Linha 176 - Aumentar limite:
```typescript
const maxSize = 15 * 1024 * 1024; // 15MB
if (file.size > maxSize) {
    toast.error("A imagem deve ter no máximo 15MB");
    return;
}
```

Linha 170 - Validar formatos:
```typescript
const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
const validExtensions = ['.jpg', '.jpeg', '.png', '.webp'];
const fileExtension = file.name.toLowerCase().substring(file.name.lastIndexOf('.'));

if (!validTypes.includes(file.type) && !validExtensions.includes(fileExtension)) {
    toast.error("Formato inválido. Use apenas JPG, JPEG, PNG ou WEBP");
    return;
}
```

## 3. Remover campo Nível
- Tornar opcional no schema (feito no item 1)
- Verificar se existe select de nível na UI e remover

## 4. Slugs nas URLs internas
Verificar arquivos:
- src/app/(dashboard)/admin/courses/page.tsx
- src/app/(dashboard)/professor/courses/page.tsx

## 5. Remover duração de vídeos
Em src/app/(dashboard)/admin/courses/[id]/page.tsx:
- Não exigir campo duration quando type === "video"
- Ou enviar duration: 0 para vídeos

## 6. Interface de gotejamento
Adicionar seção na aba Configurações do curso para configurar dripType

