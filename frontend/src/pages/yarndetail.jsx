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
  Tab,
  Tabs,
  List,
  ListItem,
  ListItemText,
  ListItemAvatar,
  Avatar,
  ListItemSecondaryAction,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Card,
  CardMedia,
  CardContent,
  LinearProgress,
  Breadcrumbs,
  Link
} from '@mui/material';
import {
  Edit,
  Delete,
  ShoppingCart,
  Assignment,
  PhotoCamera,
  ArrowForward,
  Inventory,
  LocationOn,
  CalendarToday,
  AttachMoney,
  Label,
  Warning,
  Add,
  Remove
} from '@mui/icons-material';
import { useParams, useNavigate, Link as RouterLink } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useApi } from '../hooks/useApi';
import { format } from 'date-fns';

const YarnDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const api = useApi();
  const queryClient = useQueryClient();

  const [selectedTab, setSelectedTab] = useState(0);
  const [useDialogOpen, setUseDialogOpen] = useState(false);
  const [useAmount, setUseAmount] = useState({ skeins: 0, yardage: 0 });
  const [selectedProject, setSelectedProject] = useState(null);

  // Fetch yarn details
  const { data: yarn, isLoading, error } = useQuery({
    queryKey: ['yarn', id],
    queryFn: () => api.get(`/yarn/${id}`)
  });

  // Fetch yarn usage
  const { data: usage } = useQuery({
    queryKey: ['yarn-usage', id],
    queryFn: () => api.get(`/yarn/${id}/usage`),
    enabled: selectedTab === 1
  });

  // Fetch user projects for assignment
  const { data: projects } = useQuery({
    queryKey: ['projects', 'active'],
    queryFn: () => api.get('/projects?status=active')
  });

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: () => api.delete(`/yarn/${id}`),
    onSuccess: () => {
      navigate('/yarn');
    }
  });

  // Use yarn mutation
  const useYarnMutation = useMutation({
    mutationFn: (data) => api.post(`/yarn/${id}/use`, data),
    onSuccess: () => {
      queryClient.invalidateQueries(['yarn', id]);
      queryClient.invalidateQueries(['yarn-usage', id]);
      setUseDialogOpen(false);
      setUseAmount({ skeins: 0, yardage: 0 });
      setSelectedProject(null);
    }
  });

  const handleDelete = async () => {
    if (window.confirm('Are you sure you want to delete this yarn? This action cannot be undone.')) {
      await deleteMutation.mutateAsync();
    }
  };

  const handleUseYarn = async () => {
    await useYarnMutation.mutateAsync({
      skeins_used: useAmount.skeins,
      yardage_used: useAmount.yardage,
      project_id: selectedProject,
      usage_notes: ''
    });
  };

  const handleAddToShoppingList = async () => {
    await api.post(`/yarn/${id}/add-to-shopping-list`, { quantity: 1 });
    // Show success message
  };

  if (isLoading) {
    return (
      <Container maxWidth="lg" sx={{ mt: 4 }}>
        <Typography>Loading...</Typography>
      </Container>
    );
  }

  if (error || !yarn) {
    return (
      <Container maxWidth="lg" sx={{ mt: 4 }}>
        <Typography color="error">Error loading yarn details</Typography>
      </Container>
    );
  }

  const remainingPercentage = (yarn.remaining_yardage / yarn.total_yardage) * 100;
  const isLowStock = remainingPercentage < 25;

  return (
    <Container maxWidth="lg" sx={{ mt: 4 }}>
      {/* Breadcrumbs */}
      <Breadcrumbs sx={{ mb: 2 }}>
        <Link component={RouterLink} to="/yarn" underline="hover">
          Yarn Inventory
        </Link>
        <Typography color="text.primary">{yarn.colorway}</Typography>
      </Breadcrumbs>

      {/* Header */}
      <Paper sx={{ p: 3, mb: 3 }}>
        <Grid container spacing={3}>
          <Grid item xs={12} md={8}>
            <Typography variant="h4" gutterBottom>
              {yarn.yarn_line?.brand?.name} {yarn.yarn_line?.name}
            </Typography>
            <Typography variant="h5" color="primary" gutterBottom>
              {yarn.colorway}
            </Typography>
            
            <Box sx={{ display: 'flex', gap: 1, mb: 2 }}>
              <Chip label={yarn.yarn_line?.weight_category} />
              <Chip label={yarn.color_family} variant="outlined" />
              {yarn.condition !== 'excellent' && (
                <Chip label={yarn.condition} color="warning" />
              )}
              {isLowStock && (
                <Chip 
                  label="Low Stock" 
                  color="error" 
                  icon={<Warning />} 
                />
              )}
            </Box>

            {/* Yarn details */}
            <Grid container spacing={2}>
              <Grid item xs={6} sm={3}>
                <Typography variant="caption" color="textSecondary">
                  Remaining
                </Typography>
                <Typography variant="h6">
                  {yarn.skeins_remaining} / {yarn.skeins_total} skeins
                </Typography>
              </Grid>
              <Grid item xs={6} sm={3}>
                <Typography variant="caption" color="textSecondary">
                  Yardage
                </Typography>
                <Typography variant="h6">
                  {yarn.remaining_yardage} / {yarn.total_yardage} yds
                </Typography>
              </Grid>
              <Grid item xs={6} sm={3}>
                <Typography variant="caption" color="textSecondary">
                  Weight
                </Typography>
                <Typography variant="h6">
                  {yarn.yarn_line?.weight_grams}g
                </Typography>
              </Grid>
              <Grid item xs={6} sm={3}>
                <Typography variant="caption" color="textSecondary">
                  Fiber
                </Typography>
                <Typography variant="h6" noWrap>
                  {yarn.yarn_line?.fiber_content || 'Unknown'}
                </Typography>
              </Grid>
            </Grid>

            {/* Progress bar */}
            <Box sx={{ mt: 3 }}>
              <Typography variant="body2" color="textSecondary" gutterBottom>
                Yarn Usage
              </Typography>
              <LinearProgress 
                variant="determinate" 
                value={remainingPercentage} 
                sx={{ height: 10, borderRadius: 5 }}
                color={isLowStock ? 'error' : 'primary'}
              />
              <Typography variant="caption" color="textSecondary">
                {remainingPercentage.toFixed(0)}% remaining
              </Typography>
            </Box>
          </Grid>

          <Grid item xs={12} md={4}>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              <Button
                variant="contained"
                startIcon={<Edit />}
                onClick={() => navigate(`/yarn/${id}/edit`)}
                fullWidth
              >
                Edit Details
              </Button>
              
              <Button
                variant="outlined"
                startIcon={<Assignment />}
                onClick={() => setUseDialogOpen(true)}
                fullWidth
              >
                Use Yarn
              </Button>
              
              <Button
                variant="outlined"
                startIcon={<ShoppingCart />}
                onClick={handleAddToShoppingList}
                fullWidth
              >
                Add to Shopping List
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

      {/* Tabs */}
      <Paper sx={{ mb: 3 }}>
        <Tabs value={selectedTab} onChange={(e, v) => setSelectedTab(v)}>
          <Tab label="Details" />
          <Tab label="Usage History" />
          <Tab label="Photos" />
        </Tabs>
      </Paper>

      {/* Tab Content */}
      {selectedTab === 0 && (
        <Grid container spacing={3}>
          <Grid item xs={12} md={6}>
            <Paper sx={{ p: 3 }}>
              <Typography variant="h6" gutterBottom>
                Purchase Information
              </Typography>
              <List>
                {yarn.vendor && (
                  <ListItem>
                    <ListItemAvatar>
                      <Avatar><ShoppingCart /></Avatar>
                    </ListItemAvatar>
                    <ListItemText
                      primary="Vendor"
                      secondary={yarn.vendor}
                    />
                  </ListItem>
                )}
                {yarn.purchase_date && (
                  <ListItem>
                    <ListItemAvatar>
                      <Avatar><CalendarToday /></Avatar>
                    </ListItemAvatar>
                    <ListItemText
                      primary="Purchase Date"
                      secondary={format(new Date(yarn.purchase_date), 'MMMM d, yyyy')}
                    />
                  </ListItem>
                )}
                {yarn.purchase_price && (
                  <ListItem>
                    <ListItemAvatar>
                      <Avatar><AttachMoney /></Avatar>
                    </ListItemAvatar>
                    <ListItemText
                      primary="Price"
                      secondary={`$${yarn.purchase_price}`}
                    />
                  </ListItem>
                )}
              </List>
            </Paper>
          </Grid>

          <Grid item xs={12} md={6}>
            <Paper sx={{ p: 3 }}>
              <Typography variant="h6" gutterBottom>
                Storage & Organization
              </Typography>
              <List>
                {yarn.storage_location && (
                  <ListItem>
                    <ListItemAvatar>
                      <Avatar><LocationOn /></Avatar>
                    </ListItemAvatar>
                    <ListItemText
                      primary="Storage Location"
                      secondary={yarn.storage_location}
                    />
                  </ListItem>
                )}
                {yarn.storage_bin && (
                  <ListItem>
                    <ListItemAvatar>
                      <Avatar><Inventory /></Avatar>
                    </ListItemAvatar>
                    <ListItemText
                      primary="Storage Bin"
                      secondary={yarn.storage_bin}
                    />
                  </ListItem>
                )}
                {yarn.dye_lot && (
                  <ListItem>
                    <ListItemAvatar>
                      <Avatar><Label /></Avatar>
                    </ListItemAvatar>
                    <ListItemText
                      primary="Dye Lot"
                      secondary={yarn.dye_lot}
                    />
                  </ListItem>
                )}
              </List>
            </Paper>
          </Grid>

          {yarn.notes && (
            <Grid item xs={12}>
              <Paper sx={{ p: 3 }}>
                <Typography variant="h6" gutterBottom>
                  Notes
                </Typography>
                <Typography variant="body1">
                  {yarn.notes}
                </Typography>
              </Paper>
            </Grid>
          )}

          {yarn.tags && yarn.tags.length > 0 && (
            <Grid item xs={12}>
              <Paper sx={{ p: 3 }}>
                <Typography variant="h6" gutterBottom>
                  Tags
                </Typography>
                <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                  {yarn.tags.map((tag, index) => (
                    <Chip key={index} label={tag} />
                  ))}
                </Box>
              </Paper>
            </Grid>
          )}
        </Grid>
      )}

      {selectedTab === 1 && (
        <Paper sx={{ p: 3 }}>
          <Typography variant="h6" gutterBottom>
            Usage History
          </Typography>
          {usage && usage.length > 0 ? (
            <List>
              {usage.map((use) => (
                <ListItem key={use.id}>
                  <ListItemText
                    primary={`${use.skeins_used} skeins (${use.yardage_used} yards)`}
                    secondary={
                      <React.Fragment>
                        {use.Project?.project_name} • {format(new Date(use.added_at), 'MMM d, yyyy')}
                        {use.usage_notes && <Typography variant="caption" display="block">{use.usage_notes}</Typography>}
                      </React.Fragment>
                    }
                  />
                  <ListItemSecondaryAction>
                    <IconButton onClick={() => navigate(`/projects/${use.Project?.id}`)}>
                      <ArrowForward />
                    </IconButton>
                  </ListItemSecondaryAction>
                </ListItem>
              ))}
            </List>
          ) : (
            <Typography color="textSecondary">No usage history yet</Typography>
          )}
        </Paper>
      )}

      {selectedTab === 2 && (
        <Grid container spacing={2}>
          {yarn.photos && yarn.photos.length > 0 ? (
            yarn.photos.map((photo, index) => (
              <Grid item xs={12} sm={6} md={4} key={index}>
                <Card>
                  <CardMedia
                    component="img"
                    height="200"
                    image={photo.thumbnail_url || '/placeholder.jpg'}
                    alt={`Yarn photo ${index + 1}`}
                  />
                  <CardContent>
                    <Typography variant="caption">
                      {photo.filename}
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
            ))
          ) : (
            <Grid item xs={12}>
              <Paper sx={{ p: 8, textAlign: 'center' }}>
                <PhotoCamera sx={{ fontSize: 48, color: 'text.secondary', mb: 2 }} />
                <Typography color="textSecondary" gutterBottom>
                  No photos yet
                </Typography>
                <Button
                  variant="outlined"
                  startIcon={<PhotoCamera />}
                  onClick={() => navigate(`/yarn/${id}/edit`)}
                >
                  Add Photos
                </Button>
              </Paper>
            </Grid>
          )}
        </Grid>
      )}

      {/* Use Yarn Dialog */}
      <Dialog open={useDialogOpen} onClose={() => setUseDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Record Yarn Usage</DialogTitle>
        <DialogContent>
          <Box sx={{ pt: 2 }}>
            <Typography variant="body2" color="textSecondary" gutterBottom>
              Current stock: {yarn.skeins_remaining} skeins ({yarn.remaining_yardage} yards)
            </Typography>
            
            <Grid container spacing={2} sx={{ mt: 1 }}>
              <Grid item xs={6}>
                <TextField
                  label="Skeins Used"
                  type="number"
                  fullWidth
                  value={useAmount.skeins}
                  onChange={(e) => setUseAmount({ ...useAmount, skeins: parseFloat(e.target.value) || 0 })}
                  inputProps={{ min: 0, max: yarn.skeins_remaining, step: 0.1 }}
                />
              </Grid>
              <Grid item xs={6}>
                <TextField
                  label="Yardage Used"
                  type="number"
                  fullWidth
                  value={useAmount.yardage}
                  onChange={(e) => setUseAmount({ ...useAmount, yardage: parseInt(e.target.value) || 0 })}
                  inputProps={{ min: 0, max: yarn.remaining_yardage }}
                />
              </Grid>
            </Grid>

            <TextField
              select
              label="Project (optional)"
              fullWidth
              sx={{ mt: 2 }}
              value={selectedProject || ''}
              onChange={(e) => setSelectedProject(e.target.value)}
            >
              <MenuItem value="">No project</MenuItem>
              {projects?.projects?.map((project) => (
                <MenuItem key={project.id} value={project.id}>
                  {project.project_name}
                </MenuItem>
              ))}
            </TextField>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setUseDialogOpen(false)}>Cancel</Button>
          <Button 
            onClick={handleUseYarn} 
            variant="contained"
            disabled={useAmount.skeins === 0 && useAmount.yardage === 0}
          >
            Record Usage
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default YarnDetail;