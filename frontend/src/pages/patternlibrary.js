import React, { useState } from 'react';
import {
  Container,
  Grid,
  Box,
  Typography,
  Button,
  Fab,
  TextField,
  InputAdornment,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Paper,
  ToggleButton,
  ToggleButtonGroup,
  Chip,
  Skeleton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  IconButton
} from '@mui/material';
import {
  Add,
  Search,
  ViewModule,
  ViewList,
  FilterList,
  Download,
  Upload,
  Close,
  Favorite,
  FavoriteBorder
} from '@mui/icons-material';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useApi } from '../hooks/useApi';
import { useNavigate } from 'react-router-dom';
import PatternCard from '../components/PatternLibrary/PatternCard';
import PatternFilters from '../components/PatternLibrary/PatternFilters';

const PatternLibrary = () => {
  const navigate = useNavigate();
  const api = useApi();
  const queryClient = useQueryClient();

  const [view, setView] = useState('grid');
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState({
    search: '',
    category: '',
    craft_type: '',
    difficulty: '',
    is_free: null,
    has_file: false
  });
  const [sortBy, setSortBy] = useState('created_at');
  const [importDialogOpen, setImportDialogOpen] = useState(false);

  // Fetch patterns
  const { data, isLoading, error } = useQuery({
    queryKey: ['patterns', filters, sortBy],
    queryFn: () => api.get('/patterns', {
      params: {
        ...filters,
        sort: sortBy
      }
    })
  });

  // Fetch categories
  const { data: categories = [] } = useQuery({
    queryKey: ['pattern-categories'],
    queryFn: () => api.get('/patterns/categories')
  });

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: (id) => api.delete(`/patterns/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries(['patterns']);
    }
  });

  // Toggle favorite mutation
  const toggleFavoriteMutation = useMutation({
    mutationFn: (id) => api.patch(`/patterns/${id}/favorite`),
    onSuccess: () => {
      queryClient.invalidateQueries(['patterns']);
    }
  });

  const handleEdit = (pattern) => {
    navigate(`/patterns/${pattern.id}/edit`);
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this pattern?')) {
      await deleteMutation.mutateAsync(id);
    }
  };

  const handleToggleFavorite = async (id) => {
    await toggleFavoriteMutation.mutateAsync(id);
  };

  const handleCreateProject = (pattern) => {
    navigate('/projects/new', { state: { selectedPattern: pattern } });
  };

  const handleView = (pattern) => {
    navigate(`/patterns/${pattern.id}`);
  };

  const handleImportFromRavelry = () => {
    navigate('/settings/integrations/ravelry');
  };

  const LoadingSkeleton = () => (
    <Grid container spacing={3}>
      {[...Array(6)].map((_, index) => (
        <Grid item xs={12} sm={6} md={4} key={index}>
          <Box>
            <Skeleton variant="rectangular" height={200} />
            <Box sx={{ pt: 2 }}>
              <Skeleton variant="text" height={32} />
              <Skeleton variant="text" />
              <Skeleton variant="text" width="60%" />
            </Box>
          </Box>
        </Grid>
      ))}
    </Grid>
  );

  return (
    <Container maxWidth="lg">
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" gutterBottom>
          Pattern Library
        </Typography>
        <Typography variant="subtitle1" color="textSecondary">
          Organize and manage your knitting and crochet patterns
        </Typography>
      </Box>

      {/* Stats Bar */}
      <Paper sx={{ p: 2, mb: 3 }}>
        <Grid container spacing={2}>
          <Grid item xs={6} sm={3}>
            <Box textAlign="center">
              <Typography variant="h4">{data?.total || 0}</Typography>
              <Typography variant="body2" color="textSecondary">Total Patterns</Typography>
            </Box>
          </Grid>
          <Grid item xs={6} sm={3}>
            <Box textAlign="center">
              <Typography variant="h4">
                {data?.patterns?.filter(p => p.is_favorite).length || 0}
              </Typography>
              <Typography variant="body2" color="textSecondary">Favorites</Typography>
            </Box>
          </Grid>
          <Grid item xs={6} sm={3}>
            <Box textAlign="center">
              <Typography variant="h4">
                {data?.patterns?.filter(p => p.is_free).length || 0}
              </Typography>
              <Typography variant="body2" color="textSecondary">Free Patterns</Typography>
            </Box>
          </Grid>
          <Grid item xs={6} sm={3}>
            <Box textAlign="center">
              <Typography variant="h4">
                {data?.patterns?.filter(p => p.google_drive_file_id).length || 0}
              </Typography>
              <Typography variant="body2" color="textSecondary">With Files</Typography>
            </Box>
          </Grid>
        </Grid>
      </Paper>

      {/* Toolbar */}
      <Paper sx={{ p: 2, mb: 3 }}>
        <Grid container spacing={2} alignItems="center">
          <Grid item xs={12} md={4}>
            <TextField
              fullWidth
              placeholder="Search patterns..."
              value={filters.search}
              onChange={(e) => setFilters({ ...filters, search: e.target.value })}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <Search />
                  </InputAdornment>
                ),
              }}
            />
          </Grid>
          
          <Grid item xs={12} md={3}>
            <FormControl fullWidth>
              <InputLabel>Sort By</InputLabel>
              <Select
                value={sortBy}
                label="Sort By"
                onChange={(e) => setSortBy(e.target.value)}
              >
                <MenuItem value="created_at">Recently Added</MenuItem>
                <MenuItem value="title">Title</MenuItem>
                <MenuItem value="designer">Designer</MenuItem>
                <MenuItem value="difficulty_level">Difficulty</MenuItem>
                <MenuItem value="yardage_required">Yardage</MenuItem>
              </Select>
            </FormControl>
          </Grid>

          <Grid item xs={12} md={5}>
            <Box display="flex" gap={1} justifyContent="flex-end">
              <Button
                variant="outlined"
                startIcon={<Upload />}
                onClick={() => setImportDialogOpen(true)}
              >
                Import
              </Button>
              
              <Button
                variant="outlined"
                startIcon={<FilterList />}
                onClick={() => setShowFilters(!showFilters)}
              >
                Filters
              </Button>
              
              <ToggleButtonGroup
                value={view}
                exclusive
                onChange={(e, newView) => newView && setView(newView)}
                aria-label="view mode"
              >
                <ToggleButton value="grid" aria-label="grid view">
                  <ViewModule />
                </ToggleButton>
                <ToggleButton value="list" aria-label="list view">
                  <ViewList />
                </ToggleButton>
              </ToggleButtonGroup>
            </Box>
          </Grid>
        </Grid>
      </Paper>

      {/* Filters Sidebar */}
      {showFilters && (
        <Grid container spacing={3}>
          <Grid item xs={12} md={3}>
            <PatternFilters
              filters={filters}
              onFiltersChange={setFilters}
              categories={categories}
            />
          </Grid>
          <Grid item xs={12} md={9}>
            {renderContent()}
          </Grid>
        </Grid>
      )}

      {/* Main Content */}
      {!showFilters && renderContent()}

      {/* Floating Action Button */}
      <Fab
        color="primary"
        aria-label="add"
        sx={{ position: 'fixed', bottom: 16, right: 16 }}
        onClick={() => navigate('/patterns/new')}
      >
        <Add />
      </Fab>

      {/* Import Dialog */}
      <Dialog open={importDialogOpen} onClose={() => setImportDialogOpen(false)}>
        <DialogTitle>
          Import Patterns
          <IconButton
            aria-label="close"
            onClick={() => setImportDialogOpen(false)}
            sx={{ position: 'absolute', right: 8, top: 8 }}
          >
            <Close />
          </IconButton>
        </DialogTitle>
        <DialogContent>
          <Box sx={{ pt: 2 }}>
            <Button
              fullWidth
              variant="outlined"
              sx={{ mb: 2 }}
              onClick={handleImportFromRavelry}
            >
              Import from Ravelry
            </Button>
            <Button
              fullWidth
              variant="outlined"
              onClick={() => navigate('/patterns/bulk-upload')}
            >
              Bulk Upload PDFs
            </Button>
          </Box>
        </DialogContent>
      </Dialog>
    </Container>
  );

  function renderContent() {
    if (isLoading) {
      return <LoadingSkeleton />;
    }

    if (error) {
      return (
        <Box textAlign="center" py={8}>
          <Typography color="error">Error loading patterns</Typography>
        </Box>
      );
    }

    if (!data?.patterns || data.patterns.length === 0) {
      return (
        <Box textAlign="center" py={8}>
          <Typography variant="h6" color="textSecondary" gutterBottom>
            No patterns in your library yet
          </Typography>
          <Typography variant="body2" color="textSecondary" sx={{ mb: 3 }}>
            Add patterns manually or import from Ravelry
          </Typography>
          <Box sx={{ display: 'flex', gap: 2, justifyContent: 'center' }}>
            <Button
              variant="contained"
              startIcon={<Add />}
              onClick={() => navigate('/patterns/new')}
            >
              Add Pattern
            </Button>
            <Button
              variant="outlined"
              startIcon={<Upload />}
              onClick={() => setImportDialogOpen(true)}
            >
              Import Patterns
            </Button>
          </Box>
        </Box>
      );
    }

    return (
      <Grid container spacing={3}>
        {data.patterns.map((pattern) => (
          <Grid item xs={12} sm={6} md={view === 'grid' ? 4 : 12} key={pattern.id}>
            <PatternCard
              pattern={pattern}
              onEdit={handleEdit}
              onDelete={handleDelete}
              onToggleFavorite={handleToggleFavorite}
              onCreateProject={handleCreateProject}
              onView={handleView}
              view={view}
            />
          </Grid>
        ))}
      </Grid>
    );
  }
};

export default PatternLibrary;