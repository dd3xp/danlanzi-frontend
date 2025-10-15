type EventCallback = () => void;

class EventBus {
  private listeners: { [key: string]: EventCallback[] } = {};

  subscribe(event: string, callback: EventCallback) {
    if (!this.listeners[event]) {
      this.listeners[event] = [];
    }
    this.listeners[event].push(callback);

    // 返回取消订阅的函数
    return () => {
      this.listeners[event] = this.listeners[event].filter(cb => cb !== callback);
    };
  }

  emit(event: string) {
    if (this.listeners[event]) {
      this.listeners[event].forEach(callback => callback());
    }
  }
}

export const eventBus = new EventBus();

// 定义事件名常量
export const EVENTS = {
  AVATAR_UPDATED: 'AVATAR_UPDATED'
} as const;
