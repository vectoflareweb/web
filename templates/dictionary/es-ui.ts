export const esUi = {
  common: {
    appName: 'MyProduct', toggleTheme: 'Cambiar tema', language: 'Idioma',
    search: 'Buscar', searchPlaceholder: 'Buscar productos, guías, proyectos…',
    searchStart: 'Escribe una palabra clave para empezar a buscar', searchNone: 'Sin resultados',
    searchResultsTitle: 'Buscar', searchResultsFor: 'Resultados para "{query}"', searchResultsEmpty: 'Sin resultados. Prueba con otra palabra clave.',
    typeSolution: 'Solución', typeGuide: 'Guía', typeProject: 'Proyecto', typePage: 'Página',
    loading: 'Cargando…', error: 'Algo salió mal', back: 'Volver', close: 'Cerrar',
    readMore: 'Leer más', viewAll: 'Ver todo', learnMore: 'Más información',
    noResults: 'Sin resultados', tryAgain: 'Intentar de nuevo',
    scrollToTop: 'Ir arriba', menu: 'Menú', skipToContent: 'Ir al contenido',
  },
  nav: {
    home: 'Inicio', products: 'Productos', solutions: 'Soluciones',
    about: 'Nosotros', contact: 'Contacto', faq: 'Preguntas',
    factory: 'Fábrica', quality: 'Calidad',
  },
  footer: {
    tagline: 'Tu eslogan de marca.',
    privacy: 'Política de Privacidad', terms: 'Términos de Servicio',
    contact: 'Contáctenos', sitemap: 'Mapa del sitio',
  },
  hero: {
    cta: 'Solicitar Cotización', ctaSecondary: 'Ver Productos',
  },
  cta: {
    quote: 'Solicitar Cotización', sample: 'Solicitar Muestras', catalog: 'Descargar Catálogo',
  },
  form: {
    name: 'Nombre', email: 'Correo', company: 'Empresa',
    message: 'Mensaje', submit: 'Enviar', country: 'País', phone: 'Teléfono',
  },
  product: {
    moq: 'MOQ', leadTime: 'Plazo de Entrega', sample: 'Muestra',
    certification: 'Certificación', oemOdm: 'OEM/ODM',
    factory: 'Fábrica', quality: 'Calidad', capacity: 'Capacidad',
    material: 'Material', specifications: 'Especificaciones',
  },
} as const

export type UiDictEs = typeof esUi
