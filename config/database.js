const axios = require('axios');
const { createLogger } = require('../middleware/logger');

const logger = createLogger('xano');

// Configuración de Xano
const xanoConfig = {
  baseURL: process.env.XANO_API_URL || 'https://your-workspace.xano.io/api:version',
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  }
};

// Crear instancia de axios para Xano
const xanoAPI = axios.create(xanoConfig);

// Interceptor para requests - agregar token de autenticación si existe
xanoAPI.interceptors.request.use(
  (config) => {
    const token = config.headers.Authorization || process.env.XANO_API_KEY;
    if (token) {
      config.headers.Authorization = token.startsWith('Bearer ') ? token : `Bearer ${token}`;
    }
    
    logger.debug('Xano API Request', {
      method: config.method?.toUpperCase(),
      url: config.url,
      hasAuth: !!config.headers.Authorization
    });
    
    return config;
  },
  (error) => {
    logger.error('Error en request a Xano', { error: error.message });
    return Promise.reject(error);
  }
);

// Interceptor para responses - manejo de errores
xanoAPI.interceptors.response.use(
  (response) => {
    logger.debug('Xano API Response', {
      status: response.status,
      url: response.config.url,
      dataSize: JSON.stringify(response.data).length
    });
    return response;
  },
  (error) => {
    const errorInfo = {
      status: error.response?.status,
      statusText: error.response?.statusText,
      url: error.config?.url,
      method: error.config?.method?.toUpperCase(),
      message: error.response?.data?.message || error.message
    };
    
    logger.error('Error en response de Xano', errorInfo);
    
    // Personalizar errores según el código de estado
    if (error.response?.status === 401) {
      error.message = 'Token de autenticación inválido o expirado';
    } else if (error.response?.status === 403) {
      error.message = 'No tienes permisos para realizar esta acción';
    } else if (error.response?.status === 404) {
      error.message = 'Recurso no encontrado';
    } else if (error.response?.status >= 500) {
      error.message = 'Error interno del servidor';
    }
    
    return Promise.reject(error);
  }
);

// Función para probar la conexión con Xano
const testConnection = async () => {
  try {
    const response = await xanoAPI.get('/health');
    
    logger.info('Conexión con Xano establecida exitosamente', {
      status: response.status,
      timestamp: new Date().toISOString()
    });
    
    return true;
  } catch (error) {
    logger.error('Error al conectar con Xano', { 
      error: error.message,
      status: error.response?.status 
    });
    throw error;
  }
};

// Función helper para realizar peticiones GET
const get = async (endpoint, params = {}, token = null) => {
  try {
    const config = {};
    if (token) {
      config.headers = { Authorization: `Bearer ${token}` };
    }
    if (Object.keys(params).length > 0) {
      config.params = params;
    }
    
    const response = await xanoAPI.get(endpoint, config);
    return response.data;
  } catch (error) {
    throw error;
  }
};

// Función helper para realizar peticiones POST
const post = async (endpoint, data = {}, token = null) => {
  try {
    const config = {};
    if (token) {
      config.headers = { Authorization: `Bearer ${token}` };
    }
    
    const response = await xanoAPI.post(endpoint, data, config);
    return response.data;
  } catch (error) {
    throw error;
  }
};

// Función helper para realizar peticiones PUT
const put = async (endpoint, data = {}, token = null) => {
  try {
    const config = {};
    if (token) {
      config.headers = { Authorization: `Bearer ${token}` };
    }
    
    const response = await xanoAPI.put(endpoint, data, config);
    return response.data;
  } catch (error) {
    throw error;
  }
};

// Función helper para realizar peticiones DELETE
const del = async (endpoint, token = null) => {
  try {
    const config = {};
    if (token) {
      config.headers = { Authorization: `Bearer ${token}` };
    }
    
    const response = await xanoAPI.delete(endpoint, config);
    return response.data;
  } catch (error) {
    throw error;
  }
};

// Función helper para realizar peticiones PATCH
const patch = async (endpoint, data = {}, token = null) => {
  try {
    const config = {};
    if (token) {
      config.headers = { Authorization: `Bearer ${token}` };
    }
    
    const response = await xanoAPI.patch(endpoint, data, config);
    return response.data;
  } catch (error) {
    throw error;
  }
};

// Función para manejar paginación de Xano
const getPaginated = async (endpoint, page = 1, limit = 10, params = {}, token = null) => {
  try {
    const paginationParams = {
      page,
      per_page: limit,
      ...params
    };
    
    const response = await get(endpoint, paginationParams, token);
    
    // Xano devuelve la paginación en headers o en el response
    return {
      data: response.items || response.data || response,
      pagination: {
        page: response.page || page,
        per_page: response.per_page || limit,
        total: response.total || response.count,
        pages: response.pages || Math.ceil((response.total || response.count || 0) / limit)
      }
    };
  } catch (error) {
    throw error;
  }
};

module.exports = {
  xanoAPI,
  get,
  post,
  put,
  del,
  patch,
  getPaginated,
  testConnection
};