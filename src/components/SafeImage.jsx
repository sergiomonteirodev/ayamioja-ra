import React, { useState } from 'react'

const SafeImage = ({ src, alt, className, style, ...props }) => {
  const [imageSrc, setImageSrc] = useState(src)
  const [hasError, setHasError] = useState(false)

  const handleError = () => {
    console.warn(`Failed to load image: ${src}`)
    setHasError(true)
    // Tentar carregar novamente após um delay
    setTimeout(() => {
      setImageSrc(`${src}?retry=${Date.now()}`)
    }, 1000)
  }

  if (hasError) {
    return (
      <div 
        className={className} 
        style={{
          ...style,
          backgroundColor: '#ccc',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: '#666'
        }}
        {...props}
      >
        📷
      </div>
    )
  }

  return (
    <img
      src={imageSrc}
      alt={alt}
      className={className}
      style={style}
      onError={handleError}
      {...props}
    />
  )
}

export default SafeImage
