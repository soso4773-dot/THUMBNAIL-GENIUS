import path from 'path';
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode }) => {
    // Vercel 환경 변수는 process.env에 자동으로 주입됨
    // 로컬 개발 시에는 loadEnv로 .env 파일에서 읽음
    const env = loadEnv(mode, process.cwd(), '');
    const apiKey = process.env.GEMINI_API_KEY || env.GEMINI_API_KEY || '';
    
    // 빌드 타임에 환경 변수가 있는지 확인 (디버깅용 - 배포 후 제거 가능)
    if (!apiKey && mode === 'production') {
      console.warn('⚠️ GEMINI_API_KEY가 설정되지 않았습니다. Vercel 환경 변수를 확인하세요.');
    }
    
    return {
      server: {
        port: 3000,
        host: '0.0.0.0',
      },
      plugins: [react()],
      define: {
        'process.env.API_KEY': JSON.stringify(apiKey),
        'process.env.GEMINI_API_KEY': JSON.stringify(apiKey)
      },
      resolve: {
        alias: {
          '@': path.resolve(__dirname, '.'),
        }
      }
    };
});
