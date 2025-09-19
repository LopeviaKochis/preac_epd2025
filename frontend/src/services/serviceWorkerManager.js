// Servicio para manejo de Service Worker y funcionalidad PWA
class ServiceWorkerManager {
  constructor() {
    this.isRegistered = false;
    this.registration = null;
    this.isOnline = navigator.onLine;
    this.callbacks = {
      update: [],
      offline: [],
      online: [],
      install: []
    };
    
    this.init();
  }

  // Inicializar Service Worker
  async init() {
    // Verificar soporte
    if (!('serviceWorker' in navigator)) {
      console.warn('⚠️ Service Worker no soportado en este navegador');
      return;
    }

    try {
      // Registrar Service Worker
      this.registration = await navigator.serviceWorker.register('/sw.js', {
        scope: '/'
      });

      console.log('✅ Service Worker registrado:', this.registration.scope);
      this.isRegistered = true;

      // Configurar event listeners
      this.setupEventListeners();
      
      // Notificar instalación exitosa
      this.notifyCallbacks('install', { success: true });

      // Verificar actualizaciones
      this.checkForUpdates();

    } catch (error) {
      console.error('❌ Error registrando Service Worker:', error);
      this.notifyCallbacks('install', { success: false, error });
    }
  }

  // Configurar event listeners
  setupEventListeners() {
    // Listener para actualizaciones del SW
    this.registration.addEventListener('updatefound', () => {
      const newWorker = this.registration.installing;
      
      newWorker.addEventListener('statechange', () => {
        if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
          console.log('🔄 Nueva versión disponible');
          this.notifyCallbacks('update', { available: true });
        }
      });
    });

    // Listener para cambios de conectividad
    window.addEventListener('online', () => {
      console.log('🌐 Conexión restaurada');
      this.isOnline = true;
      this.notifyCallbacks('online');
      this.syncPendingData();
    });

    window.addEventListener('offline', () => {
      console.log('📵 Sin conexión - modo offline');
      this.isOnline = false;
      this.notifyCallbacks('offline');
    });

    // Listener para mensajes del SW
    navigator.serviceWorker.addEventListener('message', (event) => {
      this.handleServiceWorkerMessage(event.data);
    });
  }

  // Manejar mensajes del Service Worker
  handleServiceWorkerMessage(data) {
    const { type, action, payload } = data;

    switch (type) {
      case 'BACKGROUND_SYNC':
        if (action === 'sync_pending_data') {
          this.syncPendingData();
        }
        break;
      
      case 'CACHE_UPDATE':
        console.log('📦 Cache actualizado:', payload);
        break;
        
      default:
        console.log('📨 Mensaje del SW:', data);
    }
  }

  // Verificar actualizaciones
  async checkForUpdates() {
    if (!this.registration) return;

    try {
      await this.registration.update();
    } catch (error) {
      console.warn('❌ Error verificando actualizaciones:', error);
    }
  }

  // Activar nueva versión
  async activateUpdate() {
    if (!this.registration || !this.registration.waiting) {
      return false;
    }

    // Enviar mensaje para activar nueva versión
    this.registration.waiting.postMessage({ type: 'SKIP_WAITING' });

    // Recargar página cuando esté activo
    navigator.serviceWorker.addEventListener('controllerchange', () => {
      window.location.reload();
    });

    return true;
  }

  // Cachear URLs específicas
  async cacheUrls(urls) {
    if (!this.isRegistered) return;

    return new Promise((resolve) => {
      const messageChannel = new MessageChannel();
      
      messageChannel.port1.onmessage = (event) => {
        resolve(event.data);
      };

      navigator.serviceWorker.controller.postMessage({
        type: 'CACHE_URLS',
        payload: { urls }
      }, [messageChannel.port2]);
    });
  }

  // Obtener versión del cache
  async getCacheVersion() {
    if (!this.isRegistered) return null;

    return new Promise((resolve) => {
      const messageChannel = new MessageChannel();
      
      messageChannel.port1.onmessage = (event) => {
        resolve(event.data.version);
      };

      navigator.serviceWorker.controller.postMessage({
        type: 'GET_VERSION'
      }, [messageChannel.port2]);
    });
  }

  // Limpiar cache
  async clearCache() {
    if (!this.isRegistered) return;

    return new Promise((resolve) => {
      const messageChannel = new MessageChannel();
      
      messageChannel.port1.onmessage = (event) => {
        resolve(event.data);
      };

      navigator.serviceWorker.controller.postMessage({
        type: 'CLEAR_CACHE'
      }, [messageChannel.port2]);
    });
  }

  // Sincronizar datos pendientes
  async syncPendingData() {
    console.log('🔄 Sincronizando datos pendientes...');

    try {
      // Obtener datos pendientes del localStorage
      const pendingData = this.getPendingData();
      
      if (pendingData.length === 0) {
        console.log('✅ No hay datos pendientes para sincronizar');
        return;
      }

      // Procesar cada item pendiente
      const results = await Promise.allSettled(
        pendingData.map(item => this.processPendingItem(item))
      );

      // Limpiar datos sincronizados exitosamente
      const successfulIds = results
        .map((result, index) => result.status === 'fulfilled' ? pendingData[index].id : null)
        .filter(id => id !== null);

      this.removePendingData(successfulIds);

      console.log(`✅ Sincronizados ${successfulIds.length} de ${pendingData.length} items`);

    } catch (error) {
      console.error('❌ Error sincronizando datos:', error);
    }
  }

  // Obtener datos pendientes del localStorage
  getPendingData() {
    try {
      const pending = localStorage.getItem('preac_pending_sync');
      return pending ? JSON.parse(pending) : [];
    } catch (error) {
      console.error('❌ Error obteniendo datos pendientes:', error);
      return [];
    }
  }

  // Agregar datos para sincronización posterior
  addPendingData(type, data) {
    try {
      const pending = this.getPendingData();
      const item = {
        id: Date.now() + Math.random(),
        type,
        data,
        timestamp: new Date().toISOString(),
        retries: 0
      };

      pending.push(item);
      localStorage.setItem('preac_pending_sync', JSON.stringify(pending));
      
      console.log('📝 Datos agregados para sincronización:', type);
      
      // Intentar sincronizar inmediatamente si hay conexión
      if (this.isOnline) {
        setTimeout(() => this.syncPendingData(), 1000);
      }

    } catch (error) {
      console.error('❌ Error agregando datos pendientes:', error);
    }
  }

  // Procesar item pendiente
  async processPendingItem(item) {
    const { type, data } = item;

    switch (type) {
      case 'notification':
        return await this.syncNotification(data);
      
      case 'calculation':
        return await this.syncCalculation(data);
      
      case 'user_data':
        return await this.syncUserData(data);
      
      default:
        throw new Error(`Tipo de sincronización no soportado: ${type}`);
    }
  }

  // Sincronizar notificación
  async syncNotification(data) {
    const response = await fetch('/api/notifications/send', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('token')}`
      },
      body: JSON.stringify(data)
    });

    if (!response.ok) {
      throw new Error(`Error enviando notificación: ${response.statusText}`);
    }

    return await response.json();
  }

  // Sincronizar cálculo
  async syncCalculation(data) {
    const { endpoint, payload } = data;
    
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('token')}`
      },
      body: JSON.stringify(payload)
    });

    if (!response.ok) {
      throw new Error(`Error sincronizando cálculo: ${response.statusText}`);
    }

    return await response.json();
  }

  // Sincronizar datos de usuario
  async syncUserData(data) {
    const response = await fetch('/api/auth/update-profile', {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('token')}`
      },
      body: JSON.stringify(data)
    });

    if (!response.ok) {
      throw new Error(`Error sincronizando datos de usuario: ${response.statusText}`);
    }

    return await response.json();
  }

  // Remover datos pendientes sincronizados
  removePendingData(ids) {
    try {
      const pending = this.getPendingData();
      const filtered = pending.filter(item => !ids.includes(item.id));
      localStorage.setItem('preac_pending_sync', JSON.stringify(filtered));
    } catch (error) {
      console.error('❌ Error removiendo datos sincronizados:', error);
    }
  }

  // Registrar callback para eventos
  on(event, callback) {
    if (this.callbacks[event]) {
      this.callbacks[event].push(callback);
    }
  }

  // Desregistrar callback
  off(event, callback) {
    if (this.callbacks[event]) {
      const index = this.callbacks[event].indexOf(callback);
      if (index > -1) {
        this.callbacks[event].splice(index, 1);
      }
    }
  }

  // Notificar callbacks
  notifyCallbacks(event, data = {}) {
    if (this.callbacks[event]) {
      this.callbacks[event].forEach(callback => {
        try {
          callback(data);
        } catch (error) {
          console.error(`❌ Error en callback ${event}:`, error);
        }
      });
    }
  }

  // Verificar si está online
  isAppOnline() {
    return this.isOnline;
  }

  // Obtener información del estado
  getStatus() {
    return {
      isRegistered: this.isRegistered,
      isOnline: this.isOnline,
      pendingItems: this.getPendingData().length,
      version: this.registration?.active?.scriptURL || null
    };
  }

  // Instalar prompt de instalación PWA
  async promptInstall() {
    // Esta funcionalidad se maneja desde el componente principal
    // ya que necesita acceso al evento beforeinstallprompt
    return new Promise((resolve) => {
      window.dispatchEvent(new CustomEvent('pwa-install-prompt', {
        detail: { resolve }
      }));
    });
  }
}

// Crear instancia global
const serviceWorkerManager = new ServiceWorkerManager();

export default serviceWorkerManager;