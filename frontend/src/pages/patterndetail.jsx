import React, { useState } from 'react';
import {
  Container,
  Paper,
  Grid,
  Typography,
  Box,
  Button,
  Chip,
  Divider,
  Breadcrumbs,
  Link,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Rating,
  Card,
  CardContent,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem
} from '@mui/material';
import {
  Edit,
  Delete,
  Download,
  Favorite,
  FavoriteBorder,
  AddCircle,
  Straighten,
  Category,
  Person,
  AttachMoney,
  CalendarToday,
  Description,
  CloudDownload,
  Visibility,
  ShoppingCart,
  Assignment
} from '@mui/icons-material';
import { useParams, useNavigate, Link as RouterLink } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useApi } from '../hooks/useApi';
import { format } from 'date-fns';

const PatternDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const api = useApi();
  const queryClient = useQueryClient();

  const [createProjectDialogOpen, setCreateProjectDialogOpen] = useState(false);
  const [projectName, setProjectName] = useState('');
  const [selectedYarn, setSelectedYarn] = useState([]);

  // Fetch pattern details
  const { data: pattern, isLoading, error } = useQuery({
    queryKey: ['pattern', id],
    queryFn: () => api.get(`/patterns/${id}`)
  });

  // Fetch similar patterns
  const { data: similarPatterns } = useQuery({
    queryKey: ['similar-patterns', id],
    queryFn: () => api.get(`/patterns/recommendations/similar/${id}`),
    enabled: !!pattern
  });

  // Fetch user's yarn for project creation
  const { data: userYarn } = useQuery({
    queryKey: ['user-yarn'],
    queryFn: () => api.get('/yarn'),
    enabled: createProjectDialogOpen
  });

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: () => api.delete(`/patterns/${id}`),
    onSuccess: () => {
      navigate('/patterns');
    }
  });

  // Toggle favorite mutation
  const toggleFavoriteMutation = useMutation({
    mutationFn: () => api.patch(`/patterns/${id}/favorite`),
    onSuccess: () => {
      queryClient.invalidateQueries(['pattern', id]);
    }
  });

  // Create project mutation
  const createProjectMutation = useMutation({
    mutationFn: (data) => api.post('/projects', data),
    onSuccess: (data) => {
      navigate(`/projects/${data.id}`);
    }
  });

  const handleDelete = async () => {
    if (window.confirm('Are you sure you want to delete this pattern? This action cannot be undone.')) {
      await deleteMutation.mutateAsync();
    }
  };

  const handleToggleFavorite = async () => {
    await toggleFavoriteMutation.mutateAsync();
  };

  const handleDownload = () => {
    window.open(`/api/patterns/${id}/download`, '_blank');
  };

  const handleView = () => {
    window.open(`/api/patterns/${id}/view`, '_blank');
  };

  const handleCreateProject = async () => {
    await createProjectMutation.mutateAsync({
      pattern_id: pattern.id,
      project_name: projectName || `${pattern.title} Project`,
      yarn_inventory_ids: selectedYarn,
      status: 'queued'
    });
  };

  if (isLoading) {
    return (
      <Container maxWidth="lg" sx={{ mt: 4 }}>
        <Typography>Loading...</Typography>
      </Container>
    );
  }

  if (error || !pattern) {
    return (
      <Container maxWidth="lg" sx={{ mt: 4 }}>
        <Typography color="error">Error loading pattern details</Typography>
      </Container>
    );
  }

  const getDifficultyColor = (level) => {
    const colors = {
      1: '#4CAF50',
      2: '#8BC34A',
      3: '#FFC107',
      4: '#FF9800',
      5: '#F44336'
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
    <Container maxWidth="lg" sx={{ mt: 4 }}>
      {/* Breadcrumbs */}
      <Breadcrumbs sx={{ mb: 2 }}>
        <Link component={RouterLink} to="/patterns" underline="hover">
          Pattern Library
        </Link>
        <Typography color="text.primary">{pattern.title}</Typography>
      </Breadcrumbs>

      {/* Header */}
      <Paper sx={{ p: 3, mb: 3 }}>
        <Grid container spacing={3}>
          <Grid item xs={12} md={8}>
            <Box sx={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
              <Box>
                <Typography variant="h4" gutterBottom>
                  {pattern.title}
                </Typography>
                {pattern.PatternDesigner && (
                  <Typography variant="h6" color="textSecondary" gutterBottom>
                    by {pattern.PatternDesigner.name}
                  </Typography>
                )}
              </Box>
              <IconButton onClick={handleToggleFavorite} size="large">
                {pattern.is_favorite ? 
                  <Favorite color="error" fontSize="large" /> : 
                  <FavoriteBorder fontSize="large" />
                }
              </IconButton>
            </Box>

            <Box sx={{ display: 'flex', gap: 1, mb: 2, flexWrap: 'wrap' }}>
              <Chip label={pattern.craft_type} />
              {pattern.PatternCategory && (
                <Chip label={pattern.PatternCategory.name} variant="outlined" />
              )}
              {pattern.difficulty_level && (
                <Chip 
                  label={getDifficultyLabel(pattern.difficulty_level)}
                  sx={{ 
                    backgroundColor: getDifficultyColor(pattern.difficulty_level), 
                    color: 'white' 
                  }}
                />
              )}
              {pattern.is_free && (
                <Chip label="FREE" color="success" />
              )}
              {pattern.google_drive_file_id && (
                <Chip label="File Available" icon={<CloudDownload />} color="primary" />
              )}
            </Box>

            {/* Ravelry Rating */}
            {pattern.ravelry_rating && (
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <Rating value={pattern.ravelry_rating} readOnly />
                <Typography variant="body2" sx={{ ml: 1 }}>
                  {pattern.ravelry_rating} ({pattern.ravelry_rating_count} ratings)
                </Typography>
              </Box>
            )}

            {/* Key Details Grid */}
            <Grid container spacing={2}>
              {pattern.yardage_required && (
                <Grid item xs={6} sm={3}>
                  <Typography variant="caption" color="textSecondary">
                    Yardage Required
                  </Typography>
                  <Typography variant="h6">
                    {pattern.yardage_required}
                    {pattern.yardage_max && pattern.yardage_max !== pattern.yardage_required 
                      ? `-${pattern.yardage_max}` 
                      : ''} yards
                  </Typography>
                </Grid>
              )}
              
              {pattern.needle_sizes && pattern.needle_sizes.length > 0 && (
                <Grid item xs={6} sm={3}>
                  <Typography variant="caption" color="textSecondary">
                    Needle Sizes
                  </Typography>
                  <Typography variant="h6">
                    {pattern.needle_sizes.join(', ')}
                  </Typography>
                </Grid>
              )}

              {pattern.gauge_stitches && (
                <Grid item xs={6} sm={3}>
                  <Typography variant="caption" color="textSecondary">
                    Gauge
                  </Typography>
                  <Typography variant="h6">
                    {pattern.gauge_stitches} sts / {pattern.gauge_measurement || '4"'}
                  </Typography>
                </Grid>
              )}

              {pattern.sizes_available && pattern.sizes_available.length > 0 && (
                <Grid item xs={6} sm={3}>
                  <Typography variant="caption" color="textSecondary">
                    Sizes
                  </Typography>
                  <Typography variant="h6" noWrap>
                    {pattern.sizes_available.join(', ')}
                  </Typography>
                </Grid>
              )}
            </Grid>
          </Grid>

          <Grid item xs={12} md={4}>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              <Button
                variant="contained"
                startIcon={<AddCircle />}
                onClick={() => setCreateProjectDialogOpen(true)}
                fullWidth
              >
                Start Project
              </Button>
              
              {pattern.google_drive_file_id && (
                <>
                  <Button
                    variant="outlined"
                    startIcon={<Visibility />}
                    onClick={handleView}
                    fullWidth
                  >
                    View Pattern
                  </Button>
                  
                  <Button
                    variant="outlined"
                    startIcon={<Download />}
                    onClick={handleDownload}
                    fullWidth
                  >
                    Download PDF
                  </Button>
                </>
              )}
              
              <Button
                variant="outlined"
                startIcon={<Edit />}
                onClick={() => navigate(`/patterns/${id}/edit`)}
                fullWidth
              >
                Edit Details
              </Button>
              
              <Button
                variant="outlined"
                color="error"
                startIcon={<Delete />}
                onClick={handleDelete}
                fullWidth
              >
                Delete
              </Button>
            </Box>
          </Grid>
        </Grid>
      </Paper>

      {/* Details Sections */}
      <Grid container spacing={3}>
        {/* Pattern Information */}
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
              Pattern Information
            </Typography>
            <List>
              {pattern.pattern_source && (
                <ListItem>
                  <ListItemIcon>
                    <Description />
                  </ListItemIcon>
                  <ListItemText
                    primary="Source"
                    secondary={
                      <Box>
                        {pattern.pattern_source}
                        {pattern.source_details && (
                          <Typography variant="body2" color="textSecondary">
                            {Object.entries(pattern.source_details).map(([key, value]) => 
                              `${key}: ${value}`
                            ).join(', ')}
                          </Typography>
                        )}
                      </Box>
                    }
                  />
                </ListItem>
              )}
              
              {pattern.purchase_date && (
                <ListItem>
                  <ListItemIcon>
                    <CalendarToday />
                  </ListItemIcon>
                  <ListItemText
                    primary="Purchase Date"
                    secondary={format(new Date(pattern.purchase_date), 'MMMM d, yyyy')}
                  />
                </ListItem>
              )}
              
              {pattern.price !== null && (
                <ListItem>
                  <ListItemIcon>
                    <AttachMoney />
                  </ListItemIcon>
                  <ListItemText
                    primary="Price"
                    secondary={pattern.is_free ? 'Free' : `$${pattern.price} ${pattern.currency}`}
                  />
                </ListItem>
              )}
            </List>
          </Paper>
        </Grid>

        {/* Techniques */}
        {pattern.techniques && pattern.techniques.length > 0 && (
          <Grid item xs={12} md={6}>
            <Paper sx={{ p: 3 }}>
              <Typography variant="h6" gutterBottom>
                Techniques
              </Typography>
              <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                {pattern.techniques.map((technique, index) => (
                  <Chip key={index} label={technique} />
                ))}
              </Box>
            </Paper>
          </Grid>
        )}

        {/* Notes */}
        {(pattern.pattern_notes || pattern.personal_notes) && (
          <Grid item xs={12}>
            <Paper sx={{ p: 3 }}>
              <Typography variant="h6" gutterBottom>
                Notes
              </Typography>
              {pattern.pattern_notes && (
                <Box sx={{ mb: 2 }}>
                  <Typography variant="subtitle2" color="textSecondary">
                    Pattern Notes
                  </Typography>
                  <Typography variant="body1">
                    {pattern.pattern_notes}
                  </Typography>
                </Box>
              )}
              {pattern.personal_notes && (
                <Box>
                  <Typography variant="subtitle2" color="textSecondary">
                    Personal Notes
                  </Typography>
                  <Typography variant="body1">
                    {pattern.personal_notes}
                  </Typography>
                </Box>
              )}
            </Paper>
          </Grid>
        )}

        {/* Tags */}
        {pattern.tags && pattern.tags.length > 0 && (
          <Grid item xs={12}>
            <Paper sx={{ p: 3 }}>
              <Typography variant="h6" gutterBottom>
                Tags
              </Typography>
              <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                {pattern.tags.map((tag, index) => (
                  <Chip key={index} label={tag} variant="outlined" />
                ))}
              </Box>
            </Paper>
          </Grid>
        )}

        {/* Similar Patterns */}
        {similarPatterns && similarPatterns.length > 0 && (
          <Grid item xs={12}>
            <Paper sx={{ p: 3 }}>
              <Typography variant="h6" gutterBottom>
                Similar Patterns
              </Typography>
              <Grid container spacing={2}>
                {similarPatterns.slice(0, 4).map((similar) => (
                  <Grid item xs={12} sm={6} md={3} key={similar.id}>
                    <Card 
                      sx={{ cursor: 'pointer' }}
                      onClick={() => navigate(`/patterns/${similar.id}`)}
                    >
                      <CardContent>
                        <Typography variant="subtitle1" noWrap>
                          {similar.title}
                        </Typography>
                        <Typography variant="body2" color="textSecondary">
                          {similar.PatternDesigner?.name}
                        </Typography>
                        <Box sx={{ mt: 1 }}>
                          <Chip 
                            label={similar.PatternCategory?.name} 
                            size="small" 
                          />
                        </Box>
                      </CardContent>
                    </Card>
                  </Grid>
                ))}
              </Grid>
            </Paper>
          </Grid>
        )}
      </Grid>

      {/* Create Project Dialog */}
      <Dialog 
        open={createProjectDialogOpen} 
        onClose={() => setCreateProjectDialogOpen(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Start New Project</DialogTitle>
        <DialogContent>
          <Box sx={{ pt: 2 }}>
            <TextField
              label="Project Name"
              fullWidth
              value={projectName}
              onChange={(e) => setProjectName(e.target.value)}
              placeholder={`${pattern.title} Project`}
              sx={{ mb: 2 }}
            />
            
            <FormControl fullWidth>
              <InputLabel>Select Yarn (optional)</InputLabel>
              <Select
                multiple
                value={selectedYarn}
                onChange={(e) => setSelectedYarn(e.target.value)}
                renderValue={(selected) => `${selected.length} yarn(s) selected`}
              >
                {userYarn?.yarn?.map((yarn) => (
                  <MenuItem key={yarn.id} value={yarn.id}>
                    {yarn.yarn_line?.brand?.name} {yarn.yarn_line?.name} - {yarn.colorway}
                    <Typography variant="caption" sx={{ ml: 1 }}>
                      ({yarn.remaining_yardage} yards available)
                    </Typography>
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setCreateProjectDialogOpen(false)}>
            Cancel
          </Button>
          <Button onClick={handleCreateProject} variant="contained">
            Create Project
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default PatternDetail;