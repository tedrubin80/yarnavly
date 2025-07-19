import React from 'react';
import {
  Container,
  Grid,
  Paper,
  Typography,
  Box,
  Card,
  CardContent,
  CardActions,
  Button,
  LinearProgress,
  Chip,
  Avatar,
  List,
  ListItem,
  ListItemAvatar,
  ListItemText,
  ListItemSecondaryAction,
  IconButton,
  Divider
} from '@mui/material';
import {
  Inventory,
  LibraryBooks,
  Assignment,
  TrendingUp,
  ShoppingCart,
  CloudSync,
  Add,
  ArrowForward,
  Edit,
  CheckCircle,
  Schedule
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { useApi } from '../hooks/useApi';
import { format } from 'date-fns';

const StatCard = ({ title, value, icon, color = 'primary', onClick }) => (
  <Card 
    sx={{ 
      height: '100%', 
      cursor: onClick ? 'pointer' : 'default',
      '&:hover': onClick ? { boxShadow: 4 } : {}
    }}
    onClick={onClick}
  >
    <CardContent>
      <Box display="flex" alignItems="center" justifyContent="space-between">
        <Box>
          <Typography color="textSecondary" gutterBottom variant="subtitle2">
            {title}
          </Typography>
          <Typography variant="h4">
            {value}
          </Typography>
        </Box>
        <Avatar sx={{ bgcolor: `${color}.main`, width: 56, height: 56 }}>
          {icon}
        </Avatar>
      </Box>
    </CardContent>
  </Card>
);

const Dashboard = () => {
  const navigate = useNavigate();
  const api = useApi();

  // Fetch dashboard data
  const { data: stats } = useQuery({
    queryKey: ['dashboard-stats'],
    queryFn: () => api.get('/dashboard/stats')
  });

  const { data: recentProjects } = useQuery({
    queryKey: ['recent-projects'],
    queryFn: () => api.get('/projects?limit=5&status=active')
  });

  const { data: lowStockYarn } = useQuery({
    queryKey: ['low-stock-yarn'],
    queryFn: () => api.get('/yarn/low-stock?limit=5')
  });

  const { data: recentActivity } = useQuery({
    queryKey: ['recent-activity'],
    queryFn: () => api.get('/activity/recent?limit=10')
  });

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" gutterBottom>
          Welcome back!
        </Typography>
        <Typography variant="subtitle1" color="textSecondary">
          Here's what's happening with your yarn projects
        </Typography>
      </Box>

      {/* Stats Grid */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Total Yarn"
            value={stats?.totalYarn || 0}
            icon={<Inventory />}
            color="primary"
            onClick={() => navigate('/yarn')}
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Patterns"
            value={stats?.totalPatterns || 0}
            icon={<LibraryBooks />}
            color="secondary"
            onClick={() => navigate('/patterns')}
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Active Projects"
            value={stats?.activeProjects || 0}
            icon={<Assignment />}
            color="warning"
            onClick={() => navigate('/projects?status=active')}
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Completed"
            value={stats?.completedProjects || 0}
            icon={<CheckCircle />}
            color="success"
            onClick={() => navigate('/projects?status=completed')}
          />
        </Grid>
      </Grid>

      <Grid container spacing={3}>
        {/* Active Projects */}
        <Grid item xs={12} md={8}>
          <Paper sx={{ p: 3 }}>
            <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
              <Typography variant="h6">Active Projects</Typography>
              <Button
                startIcon={<Add />}
                onClick={() => navigate('/projects/new')}
              >
                New Project
              </Button>
            </Box>

            {recentProjects?.projects?.length > 0 ? (
              <List>
                {recentProjects.projects.map((project, index) => (
                  <React.Fragment key={project.id}>
                    <ListItem>
                      <ListItemAvatar>
                        <Avatar sx={{ bgcolor: 'secondary.main' }}>
                          {project.pattern?.craft_type === 'knitting' ? '🧶' : '🪡'}
                        </Avatar>
                      </ListItemAvatar>
                      <ListItemText
                        primary={project.project_name}
                        secondary={
                          <Box>
                            <Typography variant="body2" color="textSecondary">
                              {project.pattern?.title}
                            </Typography>
                            <LinearProgress
                              variant="determinate"
                              value={project.progress_percentage || 25}
                              sx={{ mt: 1, height: 6, borderRadius: 3 }}
                            />
                          </Box>
                        }
                      />
                      <ListItemSecondaryAction>
                        <IconButton
                          edge="end"
                          onClick={() => navigate(`/projects/${project.id}`)}
                        >
                          <ArrowForward />
                        </IconButton>
                      </ListItemSecondaryAction>
                    </ListItem>
                    {index < recentProjects.projects.length - 1 && <Divider />}
                  </React.Fragment>
                ))}
              </List>
            ) : (
              <Box textAlign="center" py={4}>
                <Typography color="textSecondary">
                  No active projects. Start a new one!
                </Typography>
                <Button
                  variant="contained"
                  startIcon={<Add />}
                  sx={{ mt: 2 }}
                  onClick={() => navigate('/projects/new')}
                >
                  Create Project
                </Button>
              </Box>
            )}
          </Paper>
        </Grid>

        {/* Low Stock Yarn */}
        <Grid item xs={12} md={4}>
          <Paper sx={{ p: 3 }}>
            <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
              <Typography variant="h6">Low Stock Alert</Typography>
              <Chip label={lowStockYarn?.length || 0} color="warning" size="small" />
            </Box>

            {lowStockYarn?.length > 0 ? (
              <List dense>
                {lowStockYarn.map((yarn) => (
                  <ListItem key={yarn.id}>
                    <ListItemAvatar>
                      <Avatar sx={{ width: 32, height: 32 }}>
                        {yarn.skeins_remaining}
                      </Avatar>
                    </ListItemAvatar>
                    <ListItemText
                      primary={`${yarn.yarn_line?.brand?.name} ${yarn.yarn_line?.name}`}
                      secondary={yarn.colorway}
                    />
                    <ListItemSecondaryAction>
                      <IconButton
                        size="small"
                        onClick={() => navigate(`/yarn/${yarn.id}`)}
                      >
                        <ShoppingCart fontSize="small" />
                      </IconButton>
                    </ListItemSecondaryAction>
                  </ListItem>
                ))}
              </List>
            ) : (
              <Box textAlign="center" py={4}>
                <Typography color="textSecondary">
                  All yarn stock levels look good!
                </Typography>
              </Box>
            )}
          </Paper>

          {/* Quick Actions */}
          <Paper sx={{ p: 3, mt: 3 }}>
            <Typography variant="h6" gutterBottom>
              Quick Actions
            </Typography>
            <Grid container spacing={2}>
              <Grid item xs={6}>
                <Button
                  fullWidth
                  variant="outlined"
                  startIcon={<Add />}
                  onClick={() => navigate('/yarn/new')}
                >
                  Add Yarn
                </Button>
              </Grid>
              <Grid item xs={6}>
                <Button
                  fullWidth
                  variant="outlined"
                  startIcon={<Add />}
                  onClick={() => navigate('/patterns/new')}
                >
                  Add Pattern
                </Button>
              </Grid>
              <Grid item xs={6}>
                <Button
                  fullWidth
                  variant="outlined"
                  startIcon={<CloudSync />}
                  onClick={() => navigate('/settings/sync')}
                >
                  Sync Data
                </Button>
              </Grid>
              <Grid item xs={6}>
                <Button
                  fullWidth
                  variant="outlined"
                  startIcon={<ShoppingCart />}
                  onClick={() => navigate('/shopping-list')}
                >
                  Shop List
                </Button>
              </Grid>
            </Grid>
          </Paper>
        </Grid>

        {/* Recent Activity */}
        <Grid item xs={12}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
              Recent Activity
            </Typography>
            {recentActivity?.length > 0 ? (
              <List>
                {recentActivity.map((activity, index) => (
                  <React.Fragment key={activity.id}>
                    <ListItem>
                      <ListItemAvatar>
                        <Avatar sx={{ bgcolor: 'grey.300' }}>
                          {activity.type === 'project' && <Assignment />}
                          {activity.type === 'yarn' && <Inventory />}
                          {activity.type === 'pattern' && <LibraryBooks />}
                        </Avatar>
                      </ListItemAvatar>
                      <ListItemText
                        primary={activity.description}
                        secondary={format(new Date(activity.created_at), 'MMM d, h:mm a')}
                      />
                    </ListItem>
                    {index < recentActivity.length - 1 && <Divider />}
                  </React.Fragment>
                ))}
              </List>
            ) : (
              <Box textAlign="center" py={4}>
                <Typography color="textSecondary">
                  No recent activity
                </Typography>
              </Box>
            )}
          </Paper>
        </Grid>
      </Grid>
    </Container>
  );
};

export default Dashboard;