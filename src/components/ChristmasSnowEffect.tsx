// ❄️ 눈 내리는 효과 - 정적 HTML과 동일
import React, { useEffect } from 'react';

const ChristmasSnowEffect: React.FC = () => {
  useEffect(() => {
    // 정적 HTML의 눈 내리는 함수와 동일
    const createSnowflake = () => {
      const snowflake = document.createElement('div');
      snowflake.className = 'snowflake';
      snowflake.innerHTML = Math.random() > 0.5 ? '❄️' : '⭐';
      snowflake.style.left = Math.random() * 100 + 'vw';
      snowflake.style.animationDuration = Math.random() * 5 + 5 + 's';
      snowflake.style.opacity = (Math.random() * 0.6 + 0.4).toString();
      document.body.appendChild(snowflake);

      setTimeout(() => {
        snowflake.remove();
      }, 10000);
    };

    // 1초마다 눈송이 생성
    const snowInterval = setInterval(createSnowflake, 1000);

    return () => clearInterval(snowInterval);
  }, []);

  return null; // 이 컴포넌트는 DOM을 직접 조작하므로 렌더링하지 않음
};

export default ChristmasSnowEffect;