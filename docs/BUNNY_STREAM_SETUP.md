# Bunny Stream Configuration Guide

Este documento explica como configurar o Bunny Stream para streaming de vídeos na plataforma.

## Opção 1: Configuração via Painel Admin (Recomendado)

A forma mais fácil de configurar o Bunny Stream é através do painel de administração:

1. Acesse o painel como **Administrador**
2. No menu lateral, vá para **Configurações > Vídeo/Bunny**
3. Preencha as credenciais:
   - **API Key**: Chave de API do Bunny
   - **Library ID**: ID da Video Library
   - **CDN Hostname**: Hostname do CDN (opcional)
4. Ative a opção "Ativar Bunny Stream"
5. Clique em "Testar Conexão" para verificar
6. Salve as alterações

## Opção 2: Configuração via Variáveis de Ambiente

Você também pode configurar via variáveis de ambiente no arquivo `.env.local`:

```env
# Bunny Stream
NEXT_PUBLIC_BUNNY_API_KEY=sua-api-key-aqui
NEXT_PUBLIC_BUNNY_LIBRARY_ID=12345
NEXT_PUBLIC_BUNNY_CDN_HOSTNAME=vz-xxxxxx.b-cdn.net
```

> **Nota**: As configurações do painel admin têm prioridade sobre as variáveis de ambiente.

## Obtendo as Credenciais no Bunny.net

### 1. Criar conta no Bunny.net

1. Acesse [bunny.net](https://bunny.net) e crie uma conta
2. No dashboard, vá para **Stream** > **Video Libraries**
3. Clique em **Add Video Library** e dê um nome

### 2. Obter credenciais

#### API Key
1. Acesse **Account** > **API** no menu
2. Copie a **API Key**

#### Library ID
1. Vá para **Stream** > **Video Libraries**
2. Selecione sua library
3. O **Library ID** está na URL ou nas configurações

#### CDN Hostname
1. Na sua Video Library, vá para **Delivery**
2. Copie o **Hostname** (ex: `vz-xxxxxx.b-cdn.net`)

## 4. Uso nos componentes

### Upload de vídeo
```tsx
import { BunnyVideoUpload } from "@/components/bunny-video-upload";

<BunnyVideoUpload
    onUploadComplete={(videoId, embedUrl) => {
        console.log("Video uploaded:", videoId);
        // Salvar videoId no banco de dados
    }}
    onError={(error) => console.error(error)}
/>
```

### Player de vídeo
```tsx
import { BunnyPlayer } from "@/components/bunny-player";

<BunnyPlayer
    videoId="xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"
    title="Nome do vídeo"
    autoplay={false}
    controls={true}
/>
```

### Thumbnail
```tsx
import { BunnyThumbnail } from "@/components/bunny-player";

<BunnyThumbnail
    videoId="xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"
    alt="Thumbnail do vídeo"
    onClick={() => openPlayer()}
/>
```

## 5. Integração com Lições

Ao criar/editar uma lição do tipo "video":
1. Selecione "Bunny Stream" como provider
2. Use o componente de upload ou insira o Video ID manualmente
3. O videoId será salvo no campo `videoUrl` da lição
4. O player carregará automaticamente o vídeo

## Preços (referência)

- **Storage**: $0.004/GB/mês
- **Bandwidth**: $0.01/GB (varia por região)
- **Encoding**: Gratuito
- **Trial**: 14 dias grátis

## Limites

- Tamanho máximo de upload: 2GB (via API)
- Formatos suportados: MP4, MOV, WebM, AVI, MKV
- Resoluções: até 4K (depende do plano)

## Troubleshooting

### Erro "Bunny Stream não está configurado"
- Verifique se as variáveis de ambiente estão definidas corretamente
- Reinicie o servidor de desenvolvimento após alterar `.env.local`

### Vídeo não carrega
- Verifique se o videoId está correto
- O vídeo pode ainda estar processando (aguarde alguns minutos)
- Verifique as configurações de CORS na Library

### Upload falha
- Verifique o tamanho do arquivo (máx 2GB)
- Confirme que o formato é suportado
- Verifique a API Key e Library ID
