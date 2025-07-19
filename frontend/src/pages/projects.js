import React, { useState } from 'react';
import {
  Container,
  Box,
  Typography,
  Button,
  Fab,
  ToggleButton,
  ToggleButtonGroup,
  Paper,
  Tabs,
  Tab,
  Chip,
  Menu,
  MenuItem,
  ListItemIcon,
  ListItemText
} from '@mui/material';
import {
  Add,
  ViewKanban,
  ViewList,
  FilterList,
  Sort,
  Schedule,
  Assignment,
  CheckCircle,
  Pause,
  Cancel
} from '@mui/icons-material';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useApi } from '../hooks/useApi';
import { useNavigate } from 'react-router-dom';
import ProjectKanban from '../components/Projects/ProjectKanban';
import ProjectList from '../components/Projects/ProjectList';
import ProjectFilters from '../components/Projects/ProjectFilters';

const Projects = () => {
  const navigate = useNavigate();
  const api = useApi();
  const queryClient = useQueryClient();

  const [view, setView] = useState('kanban');
  const [selectedTab, setSelectedTab] = useState('all');
  const [showFilters, setShowFilters] = useState(false);
  const [sortAnchorEl, setSortAnchorEl] = useState(null);
  const [sortBy, setSortBy] = useState('updated_at');
  const [filters, setFilters] = useState({
    search: '',
    pattern: '',
    recipient: '',
    yarn: ''
  });

  // Fetch projects
  const { data, isLoading, error } = useQuery({
    queryKey: ['projects', selectedTab, filters, sortBy],
    queryFn: () => api.get('/projects', {
      params: {
        ...filters,
        status: selectedTab === 'all' ? undefined : selectedTab,
        sort: sortBy
      }
    })
  });

  // Update project status mutation
  const updateStatusMutation = useMutation({
    mutationFn: ({ projectId, status }) => 
      api.patch(`/projects/${projectId}/status`, { status }),
    onSuccess: () => {
      queryClient.invalidateQueries(['projects']);
    }
  });

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: (id) => api.delete(`/projects/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries(['projects']);
    }
  });

  const handleProjectMove = async (projectId, newStatus) => {
    await updateStatusMutation.mutateAsync({ projectId, status: newStatus });
  };

  const handleEdit = (project) => {
    navigate(`/projects/${project.id}/edit`);
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this project?')) {
      await deleteMutation.mutateAsync(id);
    }
  };

  const handleTabChange = (event, newValue) => {
    setSelectedTab(newValue);
  };

  const handleSortClick = (event) => {
    setSortAnchorEl(event.currentTarget);
  };

  const handleSortClose = () => {
    setSortAnchorEl(null);
  };

  const handleSortChange = (newSort) => {
    setSortBy(newSort);
    handleSortClose();
  };

  const getStatusIcon = (status) => {
    const icons = {
      'queued': <Schedule />,
      'active': <Assignment color="primary" />,
      'hibernating': <Pause color="warning" />,
      'completed': <CheckCircle color="success" />,
      'frogged': <Cancel color="error" />
    };
    return icons[status] || <Assignment />;
  };

  const getProjectCounts = () => {
    if (!data?.projects) return {};
    
    const counts = {
      all: data.projects.length,
      queued: 0,
      active: 0,
      hibernating: 0,
      completed: 0,
      frogged: 0
    };

    data.projects.forEach(project => {
      counts[project.status]++;
    });

    return counts;
  };

  const counts = getProjectCounts();

  return (
    <Container maxWidth="xl">
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" gutterBottom>
          Projects
        </Typography>
        <Typography variant="subtitle1" color="textSecondary">
          Track your knitting and crochet projects
        </Typography>
      </Box>

      {/* Status Tabs */}
      <Paper sx={{ mb: 3 }}>
        <Tabs
          value={selectedTab}
          onChange={handleTabChange}
          variant="scrollable"
          scrollButtons="auto"
        >
          <Tab 
            label={
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                All
                <Chip label={counts.all || 0} size="small" />
              </Box>
            } 
            value="all" 
          />
          <Tab 
            label={
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                {getStatusIcon('queued')}
                Queue
                <Chip label={counts.queued || 0} size="small" />
              </Box>
            } 
            value="queued" 
          />
          <Tab 
            label={
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                {getStatusIcon('active')}
                Active
                <Chip label={counts.active || 0} size="small" color="primary" />
              </Box>
            } 
            value="active" 
          />
          <Tab 
            label={
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                {getStatusIcon('hibernating')}
                On Hold
                <Chip label={counts.hibernating || 0} size="small" color="warning" />
              </Box>
            } 
            value="hibernating" 
          />
          <Tab 
            label={
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                {getStatusIcon('completed')}
                Completed
                <Chip label={counts.completed || 0} size="small" color="success" />
              </Box>
            } 
            value="completed" 
          />
          <Tab 
            label={
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                {getStatusIcon('frogged')}
                Frogged
                <Chip label={counts.frogged || 0} size="small" color="error" />
              </Box>
            } 
            value="frogged" 
          />
        </Tabs>
      </Paper>

      {/* Toolbar */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 3 }}>
        <Box sx={{ display: 'flex', gap: 1 }}>
          <Button
            variant="outlined"
            startIcon={<FilterList />}
            onClick={() => setShowFilters(!showFilters)}
          >
            Filters
          </Button>
          
          <Button
            variant="outlined"
            startIcon={<Sort />}
            onClick={handleSortClick}
          >
            Sort
          </Button>
        </Box>

        <ToggleButtonGroup
          value={view}
          exclusive
          onChange={(e, newView) => newView && setView(newView)}
          aria-label="view mode"
        >
          <ToggleButton value="kanban" aria-label="kanban view">
            <ViewKanban />
          </ToggleButton>
          <ToggleButton value="list" aria-label="list view">
            <ViewList />
          </ToggleButton>
        </ToggleButtonGroup>
      </Box>

      {/* Sort Menu */}
      <Menu
        anchorEl={sortAnchorEl}
        open={Boolean(sortAnchorEl)}
        onClose={handleSortClose}
      >
        <MenuItem onClick={() => handleSortChange('updated_at')}>
          Recently Updated
        </MenuItem>
        <MenuItem onClick={() => handleSortChange('created_at')}>
          Recently Created
        </MenuItem>
        <MenuItem onClick={() => handleSortChange('priority')}>
          Priority
        </MenuItem>
        <MenuItem onClick={() => handleSortChange('project_name')}>
          Name
        </MenuItem>
        <MenuItem onClick={() => handleSortChange('target_completion_date')}>
          Due Date
        </MenuItem>
      </Menu>

      {/* Filters */}
      {showFilters && (
        <Box sx={{ mb: 3 }}>
          <ProjectFilters
            filters={filters}
            onFiltersChange={setFilters}
          />
        </Box>
      )}

      {/* Content */}
      {isLoading ? (
        <Box textAlign="center" py={8}>
          <Typography>Loading projects...</Typography>
        </Box>
      ) : error ? (
        <Box textAlign="center" py={8}>
          <Typography color="error">Error loading projects</Typography>
        </Box>
      ) : !data?.projects || data.projects.length === 0 ? (
        <Box textAlign="center" py={8}>
          <Typography variant="h6" color="textSecondary" gutterBottom>
            {selectedTab === 'all' 
              ? "No projects yet. Start your first project!"
              : `No ${selectedTab} projects`
            }
          </Typography>
          <Button
            variant="contained"
            startIcon={<Add />}
            onClick={() => navigate('/projects/new')}
            sx={{ mt: 2 }}
          >
            Create Project
          </Button>
        </Box>
      ) : (
        <>
          {view === 'kanban' ? (
            <ProjectKanban
              projects={selectedTab === 'all' ? data.projects : data.projects.filter(p => p.status === selectedTab)}
              onProjectMove={handleProjectMove}
              onEdit={handleEdit}
              onDelete={handleDelete}
            />
          ) : (
            <ProjectList
              projects={selectedTab === 'all' ? data.projects : data.projects.filter(p => p.status === selectedTab)}
              onEdit={handleEdit}
              onDelete={handleDelete}
            />
          )}
        </>
      )}

      {/* Floating Action Button */}
      <Fab
        color="primary"
        aria-label="add"
        sx={{ position: 'fixed', bottom: 16, right: 16 }}
        onClick={() => navigate('/projects/new')}
      >
        <Add />
      </Fab>
    </Container>
  );
};

export default Projects;