// src/components/YarnInventory/YarnCard.jsx
import React, { useState } from 'react';
import { Card, CardContent, CardActions, Button, Chip, Typography, Box, IconButton, Menu, MenuItem } from '@mui/material';
import { MoreVert, Edit, Delete, Visibility, ShoppingCart } from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';

const YarnCard = ({ yarn, onEdit, onDelete, onAddToProject }) => {
  const [anchorEl, setAnchorEl] = useState(null);
  const navigate = useNavigate();

  const handleMenuClick = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
  };

  const getWeightColor = (weight) => {
    const colors = {
      'Lace': '#E1BEE7',
      'DK': '#81C784',
      'Worsted': '#64B5F6',
      'Aran': '#FFB74D',
      'Chunky': '#F06292'
    };
    return colors[weight] || '#BDBDBD';
  };

  const remainingPercentage = (yarn.remaining_yardage / yarn.total_yardage) * 100;
  const isLowStock = remainingPercentage < 25;

  return (
    <Card 
      sx={{ 
        height: '100%', 
        display: 'flex', 
        flexDirection: 'column',
        position: 'relative',
        '&:hover': { boxShadow: 4 }
      }}
    >
      {/* Yarn Photo */}
      <Box
        sx={{
          height: 200,
          backgroundImage: yarn.photos?.[0] ? `url(${yarn.photos[0].thumbnail_url})` : 'none',
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          backgroundColor: yarn.photos?.[0] ? 'transparent' : '#f5f5f5',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center'
        }}
      >
        {!yarn.photos?.[0] && (
          <Typography variant="h6" color="textSecondary">
            No Photo
          </Typography>
        )}
        
        {/* Low Stock Warning */}
        {isLowStock && (
          <Chip
            label="Low Stock"
            color="warning"
            size="small"
            sx={{ position: 'absolute', top: 8, left: 8 }}
          />
        )}
      </Box>

      <CardContent sx={{ flexGrow: 1, pb: 1 }}>
        {/* Brand and Yarn Line */}
        <Typography variant="h6" component="h3" gutterBottom noWrap>
          {yarn.yarn_line?.brand?.name} {yarn.yarn_line?.name}
        </Typography>

        {/* Colorway */}
        <Typography variant="body1" color="primary" gutterBottom>
          {yarn.colorway}
        </Typography>

        {/* Weight Category */}
        <Chip
          label={yarn.yarn_line?.weight_category}
          size="small"
          sx={{ 
            backgroundColor: getWeightColor(yarn.yarn_line?.weight_category),
            mb: 1
          }}
        />

        {/* Yardage Info */}
        <Box sx={{ mt: 1 }}>
          <Typography variant="body2" color="textSecondary">
            {yarn.skeins_remaining} of {yarn.skeins_total} skeins
          </Typography>
          <Typography variant="body2" color="textSecondary">
            {yarn.remaining_yardage} of {yarn.total_yardage} yards
          </Typography>
        </Box>

        {/* Storage Location */}
        {yarn.storage_location && (
          <Typography variant="body2" color="textSecondary" sx={{ mt: 1 }}>
            📍 {yarn.storage_location}
          </Typography>
        )}

        {/* Tags */}
        <Box sx={{ mt: 1, display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
          {yarn.tags?.slice(0, 3).map((tag, index) => (
            <Chip key={index} label={tag} size="small" variant="outlined" />
          ))}
          {yarn.tags?.length > 3 && (
            <Chip label={`+${yarn.tags.length - 3}`} size="small" variant="outlined" />
          )}
        </Box>
      </CardContent>

      <CardActions sx={{ justifyContent: 'space-between', pt: 0 }}>
        <Button 
          size="small" 
          startIcon={<Visibility />}
          onClick={() => navigate(`/yarn/${yarn.id}`)}
        >
          View
        </Button>
        
        <IconButton
          size="small"
          onClick={handleMenuClick}
        >
          <MoreVert />
        </IconButton>

        <Menu
          anchorEl={anchorEl}
          open={Boolean(anchorEl)}
          onClose={handleMenuClose}
        >
          <MenuItem onClick={() => { onEdit(yarn); handleMenuClose(); }}>
            <Edit fontSize="small" sx={{ mr: 1 }} />
            Edit
          </MenuItem>
          <MenuItem onClick={() => { onAddToProject(yarn); handleMenuClose(); }}>
            <ShoppingCart fontSize="small" sx={{ mr: 1 }} />
            Add to Project
          </MenuItem>
          <MenuItem onClick={() => { onDelete(yarn.id); handleMenuClose(); }}>
            <Delete fontSize="small" sx={{ mr: 1 }} />
            Delete
          </MenuItem>
        </Menu>
      </CardActions>
    </Card>
  );
};

export default YarnCard;

// src/components/YarnInventory/YarnFilters.jsx
import React from 'react';
import {
  Card,
  CardContent,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Chip,
  Box,
  Button,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Typography,
  Slider,
  FormGroup,
  FormControlLabel,
  Checkbox
} from '@mui/material';
import { ExpandMore, Clear } from '@mui/icons-material';

const YarnFilters = ({ filters, onFiltersChange, brands, categories }) => {
  const handleFilterChange = (field, value) => {
    onFiltersChange({ ...filters, [field]: value });
  };

  const clearFilters = () => {
    onFiltersChange({
      search: '',
      brand: '',
      weight: '',
      color: '',
      yardageMin: 0,
      yardageMax: 1000,
      showOnlyAvailable: false,
      tags: []
    });
  };

  const weightCategories = [
    'Lace', 'Light Fingering', 'Fingering', 'Sport', 'DK',
    'Worsted', 'Aran', 'Chunky', 'Super Chunky', 'Jumbo'
  ];

  const colorFamilies = [
    'Red', 'Blue', 'Green', 'Yellow', 'Purple', 'Orange',
    'Brown', 'Black', 'White', 'Grey', 'Pink', 'Variegated'
  ];

  return (
    <Card>
      <CardContent>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
          <Typography variant="h6">Filters</Typography>
          <Button startIcon={<Clear />} onClick={clearFilters} size="small">
            Clear All
          </Button>
        </Box>

        {/* Search */}
        <TextField
          fullWidth
          label="Search yarn..."
          value={filters.search}
          onChange={(e) => handleFilterChange('search', e.target.value)}
          sx={{ mb: 2 }}
        />

        {/* Quick Filters */}
        <FormGroup row sx={{ mb: 2 }}>
          <FormControlLabel
            control={
              <Checkbox
                checked={filters.showOnlyAvailable}
                onChange={(e) => handleFilterChange('showOnlyAvailable', e.target.checked)}
              />
            }
            label="Available only"
          />
        </FormGroup>

        {/* Advanced Filters */}
        <Accordion>
          <AccordionSummary expandIcon={<ExpandMore />}>
            <Typography>Advanced Filters</Typography>
          </AccordionSummary>
          <AccordionDetails>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              {/* Brand Filter */}
              <FormControl fullWidth>
                <InputLabel>Brand</InputLabel>
                <Select
                  value={filters.brand}
                  onChange={(e) => handleFilterChange('brand', e.target.value)}
                >
                  <MenuItem value="">All Brands</MenuItem>
                  {brands.map((brand) => (
                    <MenuItem key={brand.id} value={brand.id}>
                      {brand.name}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>

              {/* Weight Category */}
              <FormControl fullWidth>
                <InputLabel>Weight</InputLabel>
                <Select
                  value={filters.weight}
                  onChange={(e) => handleFilterChange('weight', e.target.value)}
                >
                  <MenuItem value="">All Weights</MenuItem>
                  {weightCategories.map((weight) => (
                    <MenuItem key={weight} value={weight}>
                      {weight}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>

              {/* Color Family */}
              <FormControl fullWidth>
                <InputLabel>Color</InputLabel>
                <Select
                  value={filters.color}
                  onChange={(e) => handleFilterChange('color', e.target.value)}
                >
                  <MenuItem value="">All Colors</MenuItem>
                  {colorFamilies.map((color) => (
                    <MenuItem key={color} value={color}>
                      {color}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>

              {/* Yardage Range */}
              <Box>
                <Typography gutterBottom>Yardage Range</Typography>
                <Slider
                  value={[filters.yardageMin, filters.yardageMax]}
                  onChange={(e, newValue) => {
                    handleFilterChange('yardageMin', newValue[0]);
                    handleFilterChange('yardageMax', newValue[1]);
                  }}
                  valueLabelDisplay="auto"
                  min={0}
                  max={2000}
                  step={50}
                />
              </Box>
            </Box>
          </AccordionDetails>
        </Accordion>

        {/* Active Filters */}
        {Object.values(filters).some(Boolean) && (
          <Box sx={{ mt: 2 }}>
            <Typography variant="subtitle2" gutterBottom>Active Filters:</Typography>
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
              {filters.search && (
                <Chip
                  label={`Search: ${filters.search}`}
                  onDelete={() => handleFilterChange('search', '')}
                  size="small"
                />
              )}
              {filters.brand && (
                <Chip
                  label={`Brand: ${brands.find(b => b.id === filters.brand)?.name}`}
                  onDelete={() => handleFilterChange('brand', '')}
                  size="small"
                />
              )}
              {filters.weight && (
                <Chip
                  label={`Weight: ${filters.weight}`}
                  onDelete={() => handleFilterChange('weight', '')}
                  size="small"
                />
              )}
            </Box>
          </Box>
        )}
      </CardContent>
    </Card>
  );
};

export default YarnFilters;

// src/components/PatternLibrary/PatternCard.jsx
import React, { useState } from 'react';
import {
  Card,
  CardContent,
  CardActions,
  Button,
  Typography,
  Box,
  Chip,
  IconButton,
  Menu,
  MenuItem,
  Rating,
  Tooltip
} from '@mui/material';
import {
  MoreVert,
  Edit,
  Delete,
  Download,
  Favorite,
  FavoriteBorder,
  Visibility,
  AddCircle
} from '@mui/icons-material';

const PatternCard = ({ pattern, onEdit, onDelete, onToggleFavorite, onCreateProject, onView }) => {
  const [anchorEl, setAnchorEl] = useState(null);

  const handleMenuClick = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
  };

  const getDifficultyColor = (level) => {
    const colors = {
      1: '#4CAF50', // Easy - Green
      2: '#8BC34A', // Easy-Medium
      3: '#FFC107', // Medium - Yellow
      4: '#FF9800', // Medium-Hard - Orange
      5: '#F44336'  // Hard - Red
    };
    return colors[level] || '#9E9E9E';
  };

  const getDifficultyLabel = (level) => {
    const labels = {
      1: 'Beginner',
      2: 'Easy',
      3: 'Intermediate',
      4: 'Advanced',
      5: 'Expert'
    };
    return labels[level] || 'Unknown';
  };

  return (
    <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      {/* Pattern Thumbnail */}
      <Box
        sx={{
          height: 200,
          backgroundImage: pattern.thumbnail_drive_id 
            ? `url(/api/drive/thumbnail/${pattern.thumbnail_drive_id})` 
            : 'none',
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          backgroundColor: '#f5f5f5',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          position: 'relative'
        }}
      >
        {!pattern.thumbnail_drive_id && (
          <Typography variant="h6" color="textSecondary">
            {pattern.file_type?.toUpperCase() || 'PATTERN'}
          </Typography>
        )}

        {/* Favorite Button */}
        <IconButton
          sx={{ position: 'absolute', top: 8, right: 8 }}
          onClick={() => onToggleFavorite(pattern.id)}
        >
          {pattern.is_favorite ? <Favorite color="error" /> : <FavoriteBorder />}
        </IconButton>

        {/* Free Badge */}
        {pattern.is_free && (
          <Chip
            label="FREE"
            color="success"
            size="small"
            sx={{ position: 'absolute', top: 8, left: 8 }}
          />
        )}
      </Box>

      <CardContent sx={{ flexGrow: 1, pb: 1 }}>
        {/* Title */}
        <Typography variant="h6" component="h3" gutterBottom noWrap>
          {pattern.title}
        </Typography>

        {/* Designer */}
        <Typography variant="body2" color="textSecondary" gutterBottom>
          by {pattern.designer?.name || 'Unknown Designer'}
        </Typography>

        {/* Category and Craft Type */}
        <Box sx={{ display: 'flex', gap: 1, mb: 1 }}>
          <Chip label={pattern.craft_type} size="small" />
          {pattern.category?.name && (
            <Chip label={pattern.category.name} size="small" variant="outlined" />
          )}
        </Box>

        {/* Difficulty */}
        {pattern.difficulty_level && (
          <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
            <Typography variant="body2" sx={{ mr: 1 }}>
              Difficulty:
            </Typography>
            <Chip
              label={getDifficultyLabel(pattern.difficulty_level)}
              size="small"
              sx={{ backgroundColor: getDifficultyColor(pattern.difficulty_level), color: 'white' }}
            />
          </Box>
        )}

        {/* Ravelry Rating */}
        {pattern.ravelry_rating && (
          <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
            <Rating value={pattern.ravelry_rating} readOnly size="small" />
            <Typography variant="body2" sx={{ ml: 1 }}>
              ({pattern.ravelry_rating_count})
            </Typography>
          </Box>
        )}

        {/* Yarn Requirements */}
        {pattern.yardage_required && (
          <Typography variant="body2" color="textSecondary">
            Yarn: {pattern.yardage_required}
            {pattern.yardage_max && pattern.yardage_max !== pattern.yardage_required 
              ? ` - ${pattern.yardage_max}` 
              : ''} yards
          </Typography>
        )}

        {/* Tags */}
        <Box sx={{ mt: 1, display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
          {pattern.tags?.slice(0, 2).map((tag, index) => (
            <Chip key={index} label={tag} size="small" variant="outlined" />
          ))}
          {pattern.tags?.length > 2 && (
            <Chip label={`+${pattern.tags.length - 2}`} size="small" variant="outlined" />
          )}
        </Box>
      </CardContent>

      <CardActions sx={{ justifyContent: 'space-between', pt: 0 }}>
        <Button
          size="small"
          startIcon={<Visibility />}
          onClick={() => onView(pattern)}
        >
          View
        </Button>

        <Button
          size="small"
          startIcon={<AddCircle />}
          onClick={() => onCreateProject(pattern)}
        >
          Start Project
        </Button>

        <IconButton size="small" onClick={handleMenuClick}>
          <MoreVert />
        </IconButton>

        <Menu anchorEl={anchorEl} open={Boolean(anchorEl)} onClose={handleMenuClose}>
          <MenuItem onClick={() => { onEdit(pattern); handleMenuClose(); }}>
            <Edit fontSize="small" sx={{ mr: 1 }} />
            Edit
          </MenuItem>
          <MenuItem onClick={() => window.open(`/api/patterns/${pattern.id}/download`)}>
            <Download fontSize="small" sx={{ mr: 1 }} />
            Download
          </MenuItem>
          <MenuItem onClick={() => { onDelete(pattern.id); handleMenuClose(); }}>
            <Delete fontSize="small" sx={{ mr: 1 }} />
            Delete
          </MenuItem>
        </Menu>
      </CardActions>
    </Card>
  );
};

export default PatternCard;

// src/components/Projects/ProjectKanban.jsx
import React from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Chip,
  Avatar,
  LinearProgress,
  IconButton,
  Menu,
  MenuItem
} from '@mui/material';
import { MoreVert, Edit, Delete } from '@mui/icons-material';
import { DragDropContext, Droppable, Draggable } from 'react-beautiful-dnd';

const ProjectCard = ({ project, index, onEdit, onDelete }) => {
  const [anchorEl, setAnchorEl] = React.useState(null);

  const getStatusColor = (status) => {
    const colors = {
      queued: '#9E9E9E',
      active: '#2196F3',
      completed: '#4CAF50',
      frogged: '#F44336',
      hibernating: '#FF9800'
    };
    return colors[status] || '#9E9E9E';
  };

  const calculateProgress = (project) => {
    if (project.status === 'completed') return 100;
    if (project.status === 'queued') return 0;
    // Calculate based on progress entries or manual percentage
    return project.progress_percentage || 25;
  };

  return (
    <Draggable draggableId={project.id.toString()} index={index}>
      {(provided, snapshot) => (
        <Card
          ref={provided.innerRef}
          {...provided.draggableProps}
          {...provided.dragHandleProps}
          sx={{
            mb: 1,
            opacity: snapshot.isDragging ? 0.8 : 1,
            transform: snapshot.isDragging ? 'rotate(5deg)' : 'none'
          }}
        >
          <CardContent sx={{ p: 2, '&:last-child': { pb: 2 } }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <Box sx={{ flexGrow: 1 }}>
                <Typography variant="h6" noWrap gutterBottom>
                  {project.project_name}
                </Typography>
                
                <Typography variant="body2" color="textSecondary" gutterBottom>
                  {project.pattern?.title}
                </Typography>

                {project.pattern?.designer && (
                  <Typography variant="body2" color="textSecondary" gutterBottom>
                    by {project.pattern.designer.name}
                  </Typography>
                )}

                {/* Progress Bar */}
                <Box sx={{ mt: 1, mb: 1 }}>
                  <LinearProgress
                    variant="determinate"
                    value={calculateProgress(project)}
                    sx={{ height: 6, borderRadius: 3 }}
                  />
                  <Typography variant="caption" color="textSecondary">
                    {calculateProgress(project)}% complete
                  </Typography>
                </Box>

                {/* Due Date */}
                {project.target_completion_date && (
                  <Typography variant="body2" color="textSecondary">
                    Due: {new Date(project.target_completion_date).toLocaleDateString()}
                  </Typography>
                )}

                {/* Recipient */}
                {project.recipient && (
                  <Chip
                    label={`Gift for ${project.recipient}`}
                    size="small"
                    color="secondary"
                    sx={{ mt: 1 }}
                  />
                )}
              </Box>

              <IconButton
                size="small"
                onClick={(e) => setAnchorEl(e.currentTarget)}
              >
                <MoreVert />
              </IconButton>
            </Box>

            {/* Project Photos */}
            {project.progress_photos?.length > 0 && (
              <Box sx={{ display: 'flex', gap: 1, mt: 1 }}>
                {project.progress_photos.slice(0, 3).map((photo, index) => (
                  <Avatar
                    key={index}
                    src={photo.thumbnail_url}
                    sx={{ width: 40, height: 40 }}
                    variant="rounded"
                  />
                ))}
                {project.progress_photos.length > 3 && (
                  <Avatar sx={{ width: 40, height: 40 }} variant="rounded">
                    +{project.progress_photos.length - 3}
                  </Avatar>
                )}
              </Box>
            )}

            <Menu
              anchorEl={anchorEl}
              open={Boolean(anchorEl)}
              onClose={() => setAnchorEl(null)}
            >
              <MenuItem onClick={() => { onEdit(project); setAnchorEl(null); }}>
                <Edit fontSize="small" sx={{ mr: 1 }} />
                Edit
              </MenuItem>
              <MenuItem onClick={() => { onDelete(project.id); setAnchorEl(null); }}>
                <Delete fontSize="small" sx={{ mr: 1 }} />
                Delete
              </MenuItem>
            </Menu>
          </CardContent>
        </Card>
      )}
    </Draggable>
  );
};

const ProjectColumn = ({ status, projects, onEdit, onDelete }) => {
  const getColumnTitle = (status) => {
    const titles = {
      queued: 'Queue',
      active: 'In Progress',
      completed: 'Completed',
      hibernating: 'On Hold',
      frogged: 'Frogged'
    };
    return titles[status] || status;
  };

  const getColumnColor = (status) => {
    const colors = {
      queued: '#f5f5f5',
      active: '#e3f2fd',
      completed: '#e8f5e8',
      hibernating: '#fff3e0',
      frogged: '#ffebee'
    };
    return colors[status] || '#f5f5f5';
  };

  return (
    <Box sx={{ minWidth: 300, maxWidth: 300 }}>
      <Box
        sx={{
          p: 2,
          backgroundColor: getColumnColor(status),
          borderRadius: 1,
          mb: 1
        }}
      >
        <Typography variant="h6">
          {getColumnTitle(status)} ({projects.length})
        </Typography>
      </Box>

      <Droppable droppableId={status}>
        {(provided, snapshot) => (
          <Box
            ref={provided.innerRef}
            {...provided.droppableProps}
            sx={{
              minHeight: 500,
              backgroundColor: snapshot.isDraggingOver ? '#f0f0f0' : 'transparent',
              borderRadius: 1,
              p: 1
            }}
          >
            {projects.map((project, index) => (
              <ProjectCard
                key={project.id}
                project={project}
                index={index}
                onEdit={onEdit}
                onDelete={onDelete}
              />
            ))}
            {provided.placeholder}
          </Box>
        )}
      </Droppable>
    </Box>
  );
};

const ProjectKanban = ({ projects, onProjectMove, onEdit, onDelete }) => {
  const statuses = ['queued', 'active', 'hibernating', 'completed', 'frogged'];

  const handleDragEnd = (result) => {
    if (!result.destination) return;

    const { source, destination, draggableId } = result;
    if (source.droppableId === destination.droppableId) return;

    onProjectMove(parseInt(draggableId), destination.droppableId);
  };

  const groupedProjects = statuses.reduce((acc, status) => {
    acc[status] = projects.filter(project => project.status === status);
    return acc;
  }, {});

  return (
    <DragDropContext onDragEnd={handleDragEnd}>
      <Box sx={{ display: 'flex', gap: 2, overflowX: 'auto', p: 2 }}>
        {statuses.map(status => (
          <ProjectColumn
            key={status}
            status={status}
            projects={groupedProjects[status]}
            onEdit={onEdit}
            onDelete={onDelete}
          />
        ))}
      </Box>
    </DragDropContext>
  );
};

export default ProjectKanban;