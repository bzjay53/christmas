/**
 * Christmas API 문서 자동 생성 설정
 * 
 * 이 설정 파일은 Swagger UI 및 ReDoc을 사용하여 OpenAPI 스펙을 시각화합니다.
 */

const SwaggerUIOptions = {
  // Swagger UI 설정
  swaggerOptions: {
    url: '/api/openapi-spec.yaml',
    docExpansion: 'list',
    defaultModelsExpandDepth: 1,
    filter: true,
    syntaxHighlight: {
      activate: true,
      theme: 'agate'
    }
  },
  
  // 커스텀 CSS
  customCss: `
    .swagger-ui .topbar { display: none; }
    .swagger-ui .info { margin: 30px 0; }
    .swagger-ui .scheme-container { padding: 15px 0; }
    .swagger-ui .opblock-tag { font-size: 18px; }
  `,
  
  // API 호스트 설정
  swaggerUrl: null,
  
  // Swagger UI 제목
  customSiteTitle: 'Christmas API 문서',
};

const ReDocOptions = {
  // ReDoc 설정
  specUrl: '/api/openapi-spec.yaml',
  hideHostname: false,
  hideDownloadButton: false,
  disableSearch: false,
  expandResponses: 'all',
  requiredPropsFirst: true,
  sortPropsAlphabetically: false,
  theme: {
    colors: {
      primary: {
        main: '#2c3e50'
      }
    },
    typography: {
      fontSize: '16px',
      fontFamily: 'Roboto, sans-serif',
      headings: {
        fontFamily: 'Montserrat, sans-serif',
        fontWeight: 600
      }
    },
    sidebar: {
      width: '300px',
      backgroundColor: '#f8f9fa'
    }
  }
};

/**
 * API 문서 경로 설정
 */
const ApiDocsConfig = {
  swaggerUiPath: '/api/docs',
  redocPath: '/api/redoc',
  specPath: '/api/openapi-spec.yaml'
};

module.exports = {
  SwaggerUIOptions,
  ReDocOptions,
  ApiDocsConfig
}; 