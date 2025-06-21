import { useEffect, useState } from 'react'

interface Snowflake {
  id: number
  left: number
  animationDuration: number
  opacity: number
  size: 'small' | 'medium' | 'large'
}

export function SnowEffect() {
  const [snowflakes, setSnowflakes] = useState<Snowflake[]>([])

  useEffect(() => {
    const createSnowflake = (): Snowflake => ({
      id: Math.random(),
      left: Math.random() * 100,
      animationDuration: Math.random() * 4 + 6, // 6-10 seconds
      opacity: Math.random() * 0.8 + 0.2, // 0.2-1.0
      size: Math.random() > 0.8 ? 'large' : Math.random() > 0.6 ? 'medium' : 'small'
    })

    // Create initial snowflakes
    const initialSnowflakes = Array.from({ length: 15 }, createSnowflake)
    setSnowflakes(initialSnowflakes)

    // Add new snowflakes periodically
    const interval = setInterval(() => {
      setSnowflakes(prev => {
        // Remove old snowflakes and add new ones
        const filtered = prev.slice(-20) // Keep only last 20
        return [...filtered, createSnowflake()]
      })
    }, 800)

    return () => clearInterval(interval)
  }, [])

  return (
    <div className="pointer-events-none fixed inset-0 z-10">
      {snowflakes.map((flake) => (
        <div
          key={flake.id}
          className={`snow-particle snow-${flake.size}`}
          style={{
            left: `${flake.left}%`,
            animationDuration: `${flake.animationDuration}s`,
            opacity: flake.opacity,
          }}
        >
          ❄
        </div>
      ))}
    </div>
  )
}