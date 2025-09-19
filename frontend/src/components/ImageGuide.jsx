import React from 'react';
import { Box, Typography, Card, CardContent, CardMedia } from '@mui/material';

const ImageGuide = ({ 
  selectedType, 
  imageMapping, 
  title = "Guía Visual",
  width = 300,
  height = 200,
  showDescription = true 
}) => {
  if (!selectedType || !imageMapping[selectedType]) {
    return null;
  }

  const imageInfo = imageMapping[selectedType];

  return (
    <Card sx={{ maxWidth: width, mx: 'auto', my: 2 }}>
      {title && (
        <CardContent sx={{ pb: 1 }}>
          <Typography variant="h6" color="primary" gutterBottom>
            {title}
          </Typography>
        </CardContent>
      )}
      
      <CardMedia
        component="img"
        height={height}
        image={imageInfo.src}
        alt={imageInfo.alt}
        sx={{ 
          objectFit: 'cover',
          bgcolor: 'grey.100' 
        }}
        onError={(e) => {
          // Fallback en caso de error al cargar la imagen
          e.target.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMzAwIiBoZWlnaHQ9IjIwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KICA8cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSIjZGRkIi8+CiAgPHRleHQgeD0iNTAlIiB5PSI1MCUiIGZvbnQtZmFtaWx5PSJBcmlhbCwgc2Fucy1zZXJpZiIgZm9udC1zaXplPSIxNCIgZmlsbD0iIzk5OSIgdGV4dC1hbmNob3I9Im1pZGRsZSIgZHk9Ii4zZW0iPkltYWdlbiBubyBkaXNwb25pYmxlPC90ZXh0Pgo8L3N2Zz4K';
        }}
      />
      
      {showDescription && imageInfo.description && (
        <CardContent sx={{ pt: 1 }}>
          <Typography variant="body2" color="text.secondary">
            {imageInfo.description}
          </Typography>
        </CardContent>
      )}
    </Card>
  );
};

export default ImageGuide;