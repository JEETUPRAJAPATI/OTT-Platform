
export interface DownloadItem {
  id: string;
  title: string;
  type: 'movie' | 'tv';
  poster_path: string;
  downloadUrl?: string;
  progress: number;
  status: 'pending' | 'downloading' | 'completed' | 'failed';
  size?: string;
  downloadedAt?: Date;
}

class DownloadService {
  private downloads: DownloadItem[] = [];

  // Get all downloads
  getDownloads(): DownloadItem[] {
    return this.downloads;
  }

  // Add item to downloads
  addDownload(item: {
    id: string;
    title: string;
    type: 'movie' | 'tv';
    poster_path: string;
  }): void {
    const downloadItem: DownloadItem = {
      ...item,
      progress: 0,
      status: 'pending',
    };

    // Check if already exists
    const exists = this.downloads.find(d => d.id === item.id);
    if (!exists) {
      this.downloads.push(downloadItem);
      this.startDownload(downloadItem);
    }
  }

  // Start download process (simulated)
  private startDownload(item: DownloadItem): void {
    // Update status to downloading
    item.status = 'downloading';
    
    // Simulate download progress
    const progressInterval = setInterval(() => {
      item.progress += Math.random() * 20;
      
      if (item.progress >= 100) {
        item.progress = 100;
        item.status = 'completed';
        item.downloadedAt = new Date();
        clearInterval(progressInterval);
      }
    }, 1000);
  }

  // Remove download
  removeDownload(id: string): void {
    this.downloads = this.downloads.filter(d => d.id !== id);
  }

  // Get download by ID
  getDownload(id: string): DownloadItem | undefined {
    return this.downloads.find(d => d.id === id);
  }

  // Check if item is already downloaded or downloading
  isDownloaded(id: string): boolean {
    const download = this.getDownload(id);
    return download ? download.status === 'completed' : false;
  }

  isDownloading(id: string): boolean {
    const download = this.getDownload(id);
    return download ? download.status === 'downloading' : false;
  }

  // Clear all completed downloads
  clearCompleted(): void {
    this.downloads = this.downloads.filter(d => d.status !== 'completed');
  }
}

export const downloadService = new DownloadService();
