/**
 * Bunny Stream Integration Service
 * 
 * Bunny Stream é uma plataforma de streaming de vídeo.
 * 
 * Para usar:
 * 1. Crie uma conta em bunny.net
 * 2. Crie uma Video Library
 * 3. Obtenha as credenciais:
 *    - BUNNY_API_KEY: API Key da sua conta
 *    - BUNNY_LIBRARY_ID: ID da Video Library
 *    - BUNNY_CDN_HOSTNAME: Hostname do CDN (ex: vz-xxxxx.b-cdn.net)
 * 
 * Documentação: https://docs.bunny.net/docs/stream-api-overview
 */

export interface BunnyVideo {
    guid: string;
    title: string;
    dateUploaded: string;
    views: number;
    isProcessing: boolean;
    status: number; // 1 = Processing, 2 = Transcoding, 3 = Finished, 4 = Error
    length: number; // Duration in seconds
    thumbnailUrl: string;
    storageSize: number;
    encodeProgress: number;
    availableResolutions: string;
}

export interface BunnyUploadResponse {
    videoId: string;
    uploadUrl: string;
}

export interface BunnyConfig {
    apiKey: string;
    libraryId: string;
    cdnHostname: string;
}

// Default configuration from environment
const getConfig = (): BunnyConfig => {
    return {
        apiKey: process.env.NEXT_PUBLIC_BUNNY_API_KEY || "",
        libraryId: process.env.NEXT_PUBLIC_BUNNY_LIBRARY_ID || "",
        cdnHostname: process.env.NEXT_PUBLIC_BUNNY_CDN_HOSTNAME || "",
    };
};

/**
 * Bunny Stream API Service
 */
export class BunnyStreamService {
    private apiKey: string;
    private libraryId: string;
    private cdnHostname: string;
    private baseUrl = "https://video.bunnycdn.com/library";

    constructor(config?: Partial<BunnyConfig>) {
        const defaultConfig = getConfig();
        this.apiKey = config?.apiKey || defaultConfig.apiKey;
        this.libraryId = config?.libraryId || defaultConfig.libraryId;
        this.cdnHostname = config?.cdnHostname || defaultConfig.cdnHostname;
    }

    /**
     * Check if Bunny Stream is configured
     */
    isConfigured(): boolean {
        return !!(this.apiKey && this.libraryId);
    }

    /**
     * Get authorization headers
     */
    private getHeaders() {
        return {
            "AccessKey": this.apiKey,
            "Content-Type": "application/json",
        };
    }

    /**
     * Create a new video entry and get upload URL
     */
    async createVideo(title: string): Promise<BunnyUploadResponse> {
        if (!this.isConfigured()) {
            throw new Error("Bunny Stream não está configurado. Verifique as variáveis de ambiente.");
        }

        const response = await fetch(`${this.baseUrl}/${this.libraryId}/videos`, {
            method: "POST",
            headers: this.getHeaders(),
            body: JSON.stringify({ title }),
        });

        if (!response.ok) {
            const error = await response.text();
            throw new Error(`Erro ao criar vídeo: ${error}`);
        }

        const data = await response.json();

        return {
            videoId: data.guid,
            uploadUrl: `${this.baseUrl}/${this.libraryId}/videos/${data.guid}`,
        };
    }

    /**
     * Upload video file to Bunny Stream
     */
    async uploadVideo(
        videoId: string,
        file: File,
        onProgress?: (progress: number) => void
    ): Promise<boolean> {
        if (!this.isConfigured()) {
            throw new Error("Bunny Stream não está configurado.");
        }

        return new Promise((resolve, reject) => {
            const xhr = new XMLHttpRequest();

            xhr.upload.addEventListener("progress", (event) => {
                if (event.lengthComputable && onProgress) {
                    const progress = Math.round((event.loaded / event.total) * 100);
                    onProgress(progress);
                }
            });

            xhr.addEventListener("load", () => {
                if (xhr.status >= 200 && xhr.status < 300) {
                    resolve(true);
                } else {
                    reject(new Error(`Upload falhou: ${xhr.statusText}`));
                }
            });

            xhr.addEventListener("error", () => {
                reject(new Error("Erro de rede durante o upload"));
            });

            xhr.open("PUT", `${this.baseUrl}/${this.libraryId}/videos/${videoId}`);
            xhr.setRequestHeader("AccessKey", this.apiKey);
            xhr.send(file);
        });
    }

    /**
     * Get video details
     */
    async getVideo(videoId: string): Promise<BunnyVideo> {
        if (!this.isConfigured()) {
            throw new Error("Bunny Stream não está configurado.");
        }

        const response = await fetch(
            `${this.baseUrl}/${this.libraryId}/videos/${videoId}`,
            {
                method: "GET",
                headers: this.getHeaders(),
            }
        );

        if (!response.ok) {
            throw new Error(`Erro ao buscar vídeo: ${response.statusText}`);
        }

        return await response.json();
    }

    /**
     * List all videos in the library
     */
    async listVideos(page = 1, itemsPerPage = 100): Promise<BunnyVideo[]> {
        if (!this.isConfigured()) {
            throw new Error("Bunny Stream não está configurado.");
        }

        const response = await fetch(
            `${this.baseUrl}/${this.libraryId}/videos?page=${page}&itemsPerPage=${itemsPerPage}`,
            {
                method: "GET",
                headers: this.getHeaders(),
            }
        );

        if (!response.ok) {
            throw new Error(`Erro ao listar vídeos: ${response.statusText}`);
        }

        const data = await response.json();
        return data.items || [];
    }

    /**
     * Delete a video
     */
    async deleteVideo(videoId: string): Promise<boolean> {
        if (!this.isConfigured()) {
            throw new Error("Bunny Stream não está configurado.");
        }

        const response = await fetch(
            `${this.baseUrl}/${this.libraryId}/videos/${videoId}`,
            {
                method: "DELETE",
                headers: this.getHeaders(),
            }
        );

        return response.ok;
    }

    /**
     * Get embed URL for video player
     */
    getEmbedUrl(videoId: string): string {
        return `https://iframe.mediadelivery.net/embed/${this.libraryId}/${videoId}`;
    }

    /**
     * Get direct video URL (for custom players)
     */
    getDirectUrl(videoId: string, resolution = "720p"): string {
        if (!this.cdnHostname) {
            // Fallback to default CDN pattern
            return `https://${this.libraryId}.b-cdn.net/${videoId}/play_${resolution}.mp4`;
        }
        return `https://${this.cdnHostname}/${videoId}/play_${resolution}.mp4`;
    }

    /**
     * Get thumbnail URL
     */
    getThumbnailUrl(videoId: string): string {
        if (!this.cdnHostname) {
            return `https://${this.libraryId}.b-cdn.net/${videoId}/thumbnail.jpg`;
        }
        return `https://${this.cdnHostname}/${videoId}/thumbnail.jpg`;
    }

    /**
     * Get HLS streaming URL
     */
    getHlsUrl(videoId: string): string {
        if (!this.cdnHostname) {
            return `https://${this.libraryId}.b-cdn.net/${videoId}/playlist.m3u8`;
        }
        return `https://${this.cdnHostname}/${videoId}/playlist.m3u8`;
    }
}

// Export a default instance
export const bunnyStream = new BunnyStreamService();

// Helper function to check video processing status
export const isVideoReady = (status: number): boolean => status === 3;
export const isVideoProcessing = (status: number): boolean => status === 1 || status === 2;
export const isVideoError = (status: number): boolean => status === 4;
