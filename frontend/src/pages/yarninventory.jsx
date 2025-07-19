import React, { useState } from 'react';
import {
  Container,
  Grid,
  Box,
  Typography,
  Button,
  Card,
  CardContent,
  Fab,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  IconButton,
  Chip,
  InputAdornment,
  ToggleButton,
  ToggleButtonGroup,
  Paper,
  Skeleton
} from '@mui/material';
import {
  Add,
  Search,
  ViewModule,
  ViewList,
  FilterList,
  Sort,
  Close,
  PhotoCamera
} from '@mui/icons-material';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useApi } from '../hooks/useApi';
import { useNavigate } from 'react-router-dom';
import YarnCard from '../components/YarnInventory/YarnCard';
import YarnFilters from '../components/YarnInventory/YarnFilters';

const YarnInventory = () => {
  const navigate = useNavigate();
  const api = useApi();
  const queryClient = useQueryClient();

  const [view, setView] = useState('grid');
  const [filters, setFilters] = useState({
    search: '',
    brand: '',
    weight: '',
    color: '',
    showOnlyAvailable: false
  });
  const [sortBy, setSortBy] = useState('created_at');
  const [showFilters, setShowFilters] = useState(false);
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [selectedYarn, setSelectedYarn] = useState(null);

  // Fetch yarn inventory
  const { data, isLoading, error } = useQuery({
    queryKey: ['yarn-inventory', filters, sortBy],
    queryFn: () => api.get('/yarn', {
      params: {
        ...filters,
        sort: sortBy
      }
    })
  });

  // Fetch brands for filters
  const { data: brands = [] } = useQuery({
    queryKey: ['yarn-brands'],
    queryFn: () => api.get('/yarn/brands')
  });

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: (id) => api.delete(`/yarn/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries(['yarn-inventory']);
    }
  });

  const handleEdit = (yarn) => {
    navigate(`/yarn/${yarn.id}/edit`);
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this yarn?')) {
      await deleteMutation.mutateAsync(id);
    }
  };

  const handleAddToProject = (yarn) => {
    navigate('/projects/new', { state: { selectedYarn: yarn } });
  };

  const handleViewChange = (event, newView) => {
    if (newView !== null) {
      setView(newView);
    }
  };

  const LoadingSkeleton = () => (
    <Grid container spacing={3}>
      {[...Array(6)].map((_, index) => (
        <Grid item xs={12} sm={6} md={4} key={index}>
          <Card>
            <Skeleton variant="rectangular" height={200} />
            <CardContent>
              <Skeleton variant="text" height={32} />
              <Skeleton variant="text" />
              <Skeleton variant="text" width="60%" />
            </CardContent>
          </Card>
        </Grid>
      ))}
    </Grid>
  );

  return (
    <Container maxWidth="lg">
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" gutterBottom>
          Yarn Inventory
        </Typography>
        <Typography variant="subtitle1" color="textSecondary">
          Manage your yarn collection
        </Typography>
      </Box>

      {/* Toolbar */}
      <Paper sx={{ p: 2, mb: 3 }}>
        <Grid container spacing={2} alignItems="center">
          <Grid item xs={12} md={4}>
            <TextField
              fullWidth
              placeholder="Search yarn..."
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
          
          <Grid item xs={12} md={4}>
            <FormControl fullWidth>
              <InputLabel>Sort By</InputLabel>
              <Select
                value={sortBy}
                label="Sort By"
                onChange={(e) => setSortBy(e.target.value)}
              >
                <MenuItem value="created_at">Recently Added</MenuItem>
                <MenuItem value="colorway">Colorway</MenuItem>
                <MenuItem value="remaining_yardage">Yardage</MenuItem>
                <MenuItem value="brand">Brand</MenuItem>
              </Select>
            </FormControl>
          </Grid>

          <Grid item xs={12} md={4}>
            <Box display="flex" gap={1} justifyContent="flex-end">
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
                onChange={handleViewChange}
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
            <YarnFilters
              filters={filters}
              onFiltersChange={setFilters}
              brands={brands}
              categories={[]}
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
        onClick={() => navigate('/yarn/new')}
      >
        <Add />
      </Fab>
    </Container>
  );

  function renderContent() {
    if (isLoading) {
      return <LoadingSkeleton />;
    }

    if (error) {
      return (
        <Box textAlign="center" py={8}>
          <Typography color="error">Error loading yarn inventory</Typography>
        </Box>
      );
    }

    if (!data?.yarn || data.yarn.length === 0) {
      return (
        <Box textAlign="center" py={8}>
          <Typography variant="h6" color="textSecondary" gutterBottom>
            No yarn in your inventory yet
          </Typography>
          <Button
            variant="contained"
            startIcon={<Add />}
            onClick={() => navigate('/yarn/new')}
            sx={{ mt: 2 }}
          >
            Add Your First Yarn
          </Button>
        </Box>
      );
    }

    return (
      <Grid container spacing={3}>
        {data.yarn.map((yarn) => (
          <Grid item xs={12} sm={6} md={view === 'grid' ? 4 : 12} key={yarn.id}>
            <YarnCard
              yarn={yarn}
              onEdit={handleEdit}
              onDelete={handleDelete}
              onAddToProject={handleAddToProject}
              view={view}
            />
          </Grid>
        ))}
      </Grid>
    );
  }
};

export default YarnInventory;