// ❄️ 눈 내리는 효과 - 토글 가능한 버전
import React, { useEffect } from 'react';

interface ChristmasSnowEffectProps {
  enabled?: boolean;
}

const ChristmasSnowEffect: React.FC<ChristmasSnowEffectProps> = ({ enabled = true }) => {
  useEffect(() => {
    if (!enabled) {
      // 눈 효과가 비활성화되면 모든 기존 눈송이 제거
      const existingSnowflakes = document.querySelectorAll('.snowflake');
      existingSnowflakes.forEach(snowflake => snowflake.remove());
      return;
    }

    // 정적 HTML의 눈 내리는 함수와 동일
    const createSnowflake = () => {
      const snowflake = document.createElement('div');
      snowflake.className = 'snowflake active'; // active 클래스 추가
      snowflake.innerHTML = Math.random() > 0.5 ? '❄️' : '⭐';
      snowflake.style.left = Math.random() * 100 + 'vw';
      snowflake.style.animationDuration = Math.random() * 5 + 5 + 's';
      snowflake.style.opacity = (Math.random() * 0.6 + 0.4).toString();
      document.body.appendChild(snowflake);

      setTimeout(() => {
        if (snowflake.parentNode) {
          snowflake.remove();
        }
      }, 10000);
    };

    // 1초마다 눈송이 생성
    const snowInterval = setInterval(createSnowflake, 1000);

    return () => {
      clearInterval(snowInterval);
      // 컴포넌트 언마운트 시 모든 눈송이 제거
      const existingSnowflakes = document.querySelectorAll('.snowflake');
      existingSnowflakes.forEach(snowflake => snowflake.remove());
    };
  }, [enabled]);

  return null; // 이 컴포넌트는 DOM을 직접 조작하므로 렌더링하지 않음
};

export default ChristmasSnowEffect;