// src/admin/App.js - Main admin application
import React from 'react';
import { Admin, Resource, CustomRoutes } from 'react-admin';
import { Route } from 'react-router-dom';
import simpleRestProvider from 'ra-data-simple-rest';
import authProvider from './authProvider';
import Dashboard from './Dashboard';
import { Layout } from './Layout';

// Resource components
import { UserList, UserEdit, UserCreate } from './resources/users';
import { YarnInventoryList, YarnInventoryEdit, YarnInventoryShow } from './resources/yarnInventory';
import { PatternList, PatternEdit, PatternShow } from './resources/patterns';
import { ProjectList, ProjectEdit, ProjectShow } from './resources/projects';
import { BrandList, BrandEdit, BrandCreate } from './resources/brands';
import { YarnLineList, YarnLineEdit, YarnLineCreate } from './resources/yarnLines';
import { SyncLogList } from './resources/syncLogs';
import { BackupList } from './resources/backups';

// Custom pages
import SystemSettings from './pages/SystemSettings';
import SystemStats from './pages/SystemStats';
import BulkOperations from './pages/BulkOperations';

const dataProvider = simpleRestProvider('/api/admin');

const AdminApp = () => (
  <Admin
    dataProvider={dataProvider}
    authProvider={authProvider}
    dashboard={Dashboard}
    layout={Layout}
    title="Yarn Management Admin"
  >
    {/* User Management */}
    <Resource
      name="users"
      list={UserList}
      edit={UserEdit}
      create={UserCreate}
      options={{ label: 'Users' }}
    />

    {/* Yarn Management */}
    <Resource
      name="yarn-inventory"
      list={YarnInventoryList}
      edit={YarnInventoryEdit}
      show={YarnInventoryShow}
      options={{ label: 'Yarn Inventory' }}
    />

    <Resource
      name="brands"
      list={BrandList}
      edit={BrandEdit}
      create={BrandCreate}
      options={{ label: 'Yarn Brands' }}
    />

    <Resource
      name="yarn-lines"
      list={YarnLineList}
      edit={YarnLineEdit}
      create={YarnLineCreate}
      options={{ label: 'Yarn Lines' }}
    />

    {/* Pattern Management */}
    <Resource
      name="patterns"
      list={PatternList}
      edit={PatternEdit}
      show={PatternShow}
      options={{ label: 'Pattern Library' }}
    />

    {/* Project Management */}
    <Resource
      name="projects"
      list={ProjectList}
      edit={ProjectEdit}
      show={ProjectShow}
      options={{ label: 'Projects' }}
    />

    {/* System Monitoring */}
    <Resource
      name="sync-logs"
      list={SyncLogList}
      options={{ label: 'Sync Logs' }}
    />

    <Resource
      name="backups"
      list={BackupList}
      options={{ label: 'Backups' }}
    />

    {/* Custom Routes */}
    <CustomRoutes>
      <Route path="/settings" element={<SystemSettings />} />
      <Route path="/stats" element={<SystemStats />} />
      <Route path="/bulk-operations" element={<BulkOperations />} />
    </CustomRoutes>
  </Admin>
);

export default AdminApp;

// src/admin/Dashboard.js - Admin dashboard
import React from 'react';
import {
  Card,
  CardContent,
  CardHeader,
  Grid,
  Typography,
  Box
} from '@mui/material';
import {
  Inventory,
  LibraryBooks,
  Assignment,
  People,
  CloudSync,
  Storage
} from '@mui/icons-material';
import { useGetList } from 'react-admin';

const StatCard = ({ title, value, icon, color = 'primary' }) => (
  <Card>
    <CardContent>
      <Box display="flex" alignItems="center" justifyContent="space-between">
        <Box>
          <Typography color="textSecondary" gutterBottom variant="h6">
            {title}
          </Typography>
          <Typography variant="h4">
            {value}
          </Typography>
        </Box>
        <Box color={`${color}.main`}>
          {icon}
        </Box>
      </Box>
    </CardContent>
  </Card>
);

const Dashboard = () => {
  const { data: users } = useGetList('users');
  const { data: yarnInventory } = useGetList('yarn-inventory');
  const { data: patterns } = useGetList('patterns');
  const { data: projects } = useGetList('projects');
  const { data: syncLogs } = useGetList('sync-logs', {
    filter: { status: 'error' },
    sort: { field: 'created_at', order: 'DESC' },
    pagination: { page: 1, perPage: 10 }
  });

  return (
    <Box p={3}>
      <Typography variant="h4" gutterBottom>
        System Overview
      </Typography>
      
      <Grid container spacing={3}>
        <Grid item xs={12} sm={6} md={4}>
          <StatCard
            title="Total Users"
            value={users?.length || 0}
            icon={<People fontSize="large" />}
            color="primary"
          />
        </Grid>
        
        <Grid item xs={12} sm={6} md={4}>
          <StatCard
            title="Yarn Inventory Items"
            value={yarnInventory?.length || 0}
            icon={<Inventory fontSize="large" />}
            color="secondary"
          />
        </Grid>
        
        <Grid item xs={12} sm={6} md={4}>
          <StatCard
            title="Pattern Library"
            value={patterns?.length || 0}
            icon={<LibraryBooks fontSize="large" />}
            color="success"
          />
        </Grid>
        
        <Grid item xs={12} sm={6} md={4}>
          <StatCard
            title="Active Projects"
            value={projects?.filter(p => p.status === 'active').length || 0}
            icon={<Assignment fontSize="large" />}
            color="warning"
          />
        </Grid>
        
        <Grid item xs={12} sm={6} md={4}>
          <StatCard
            title="Sync Errors"
            value={syncLogs?.length || 0}
            icon={<CloudSync fontSize="large" />}
            color="error"
          />
        </Grid>
        
        <Grid item xs={12} sm={6} md={4}>
          <StatCard
            title="Storage Used"
            value="2.3 GB"
            icon={<Storage fontSize="large" />}
            color="info"
          />
        </Grid>
      </Grid>

      <Box mt={4}>
        <Grid container spacing={3}>
          <Grid item xs={12} md={6}>
            <Card>
              <CardHeader title="Recent Activity" />
              <CardContent>
                <Typography variant="body2">
                  Recent user activities and system events would be displayed here.
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          
          <Grid item xs={12} md={6}>
            <Card>
              <CardHeader title="System Health" />
              <CardContent>
                <Typography variant="body2">
                  System performance metrics and health indicators.
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      </Box>
    </Box>
  );
};

export default Dashboard;

// src/admin/resources/users.js - User management
import React from 'react';
import {
  List,
  Datagrid,
  TextField,
  EmailField,
  DateField,
  EditButton,
  Edit,
  SimpleForm,
  TextInput,
  SelectInput,
  Create,
  BooleanField,
  BooleanInput,
  DateInput
} from 'react-admin';

export const UserList = () => (
  <List>
    <Datagrid>
      <TextField source="id" />
      <TextField source="first_name" />
      <TextField source="last_name" />
      <EmailField source="email" />
      <TextField source="role" />
      <BooleanField source="ravelry_connected" />
      <BooleanField source="google_drive_connected" />
      <DateField source="created_at" />
      <EditButton />
    </Datagrid>
  </List>
);

export const UserEdit = () => (
  <Edit>
    <SimpleForm>
      <TextInput source="first_name" />
      <TextInput source="last_name" />
      <TextInput source="email" type="email" />
      <SelectInput source="role" choices={[
        { id: 'user', name: 'User' },
        { id: 'admin', name: 'Admin' }
      ]} />
      <TextInput source="ravelry_username" />
      <BooleanInput source="is_active" />
      <DateInput source="created_at" disabled />
    </SimpleForm>
  </Edit>
);

export const UserCreate = () => (
  <Create>
    <SimpleForm>
      <TextInput source="first_name" required />
      <TextInput source="last_name" required />
      <TextInput source="email" type="email" required />
      <TextInput source="password" type="password" required />
      <SelectInput source="role" choices={[
        { id: 'user', name: 'User' },
        { id: 'admin', name: 'Admin' }
      ]} defaultValue="user" />
    </SimpleForm>
  </Create>
);

// src/admin/resources/yarnInventory.js - Yarn inventory management
import React from 'react';
import {
  List,
  Datagrid,
  TextField,
  NumberField,
  DateField,
  EditButton,
  ShowButton,
  Edit,
  Show,
  SimpleForm,
  SimpleShowLayout,
  TextInput,
  NumberInput,
  DateInput,
  SelectInput,
  ImageField,
  ArrayField,
  SingleFieldList,
  ChipField
} from 'react-admin';

export const YarnInventoryList = () => (
  <List>
    <Datagrid>
      <TextField source="id" />
      <TextField source="yarn_line.brand.name" label="Brand" />
      <TextField source="yarn_line.name" label="Yarn Line" />
      <TextField source="colorway" />
      <TextField source="weight_category" />
      <NumberField source="skeins_remaining" />
      <NumberField source="remaining_yardage" />
      <TextField source="storage_location" />
      <ShowButton />
      <EditButton />
    </Datagrid>
  </List>
);

export const YarnInventoryShow = () => (
  <Show>
    <SimpleShowLayout>
      <TextField source="yarn_line.brand.name" label="Brand" />
      <TextField source="yarn_line.name" label="Yarn Line" />
      <TextField source="colorway" />
      <TextField source="color_family" />
      <TextField source="weight_category" />
      <NumberField source="skeins_total" />
      <NumberField source="skeins_remaining" />
      <NumberField source="total_yardage" />
      <NumberField source="remaining_yardage" />
      <TextField source="storage_location" />
      <TextField source="storage_bin" />
      <DateField source="purchase_date" />
      <NumberField source="purchase_price" options={{ style: 'currency', currency: 'USD' }} />
      <TextField source="vendor" />
      <TextField source="notes" />
      <ArrayField source="photos">
        <SingleFieldList>
          <ImageField source="thumbnail_url" />
        </SingleFieldList>
      </ArrayField>
      <ArrayField source="tags">
        <SingleFieldList>
          <ChipField source="name" />
        </SingleFieldList>
      </ArrayField>
    </SimpleShowLayout>
  </Show>
);

export const YarnInventoryEdit = () => (
  <Edit>
    <SimpleForm>
      <TextInput source="colorway" />
      <SelectInput source="color_family" choices={[
        { id: 'red', name: 'Red' },
        { id: 'blue', name: 'Blue' },
        { id: 'green', name: 'Green' },
        { id: 'yellow', name: 'Yellow' },
        { id: 'purple', name: 'Purple' },
        { id: 'orange', name: 'Orange' },
        { id: 'brown', name: 'Brown' },
        { id: 'black', name: 'Black' },
        { id: 'white', name: 'White' },
        { id: 'grey', name: 'Grey' },
        { id: 'variegated', name: 'Variegated' },
        { id: 'self-striping', name: 'Self-striping' }
      ]} />
      <NumberInput source="skeins_remaining" step={0.1} />
      <NumberInput source="remaining_yardage" />
      <TextInput source="storage_location" />
      <TextInput source="storage_bin" />
      <TextInput source="vendor" />
      <NumberInput source="purchase_price" step={0.01} />
      <DateInput source="purchase_date" />
      <TextInput source="notes" multiline />
    </SimpleForm>
  </Edit>
);

// src/admin/pages/SystemSettings.js - System configuration
import React, { useState, useEffect } from 'react';
import {
  Card,
  CardContent,
  CardHeader,
  Grid,
  TextField,
  Button,
  Switch,
  FormControlLabel,
  Typography,
  Box,
  Snackbar,
  Alert
} from '@mui/material';
import { Save, Backup, Sync } from '@mui/icons-material';

const SystemSettings = () => {
  const [settings, setSettings] = useState({
    auto_backup_enabled: true,
    backup_frequency_days: 7,
    max_file_size_mb: 50,
    ravelry_sync_enabled: true,
    google_drive_folder_name: 'Yarn Management Backup',
    notification_emails: 'admin@example.com',
    max_users: 10,
    storage_limit_gb: 100
  });
  
  const [showSuccess, setShowSuccess] = useState(false);

  const handleSave = async () => {
    try {
      // API call to save settings
      console.log('Saving settings:', settings);
      setShowSuccess(true);
    } catch (error) {
      console.error('Error saving settings:', error);
    }
  };

  const handleBackupNow = async () => {
    try {
      // API call to trigger backup
      console.log('Starting backup...');
    } catch (error) {
      console.error('Error starting backup:', error);
    }
  };

  const handleSyncAll = async () => {
    try {
      // API call to sync all users
      console.log('Starting sync for all users...');
    } catch (error) {
      console.error('Error starting sync:', error);
    }
  };

  return (
    <Box p={3}>
      <Typography variant="h4" gutterBottom>
        System Settings
      </Typography>

      <Grid container spacing={3}>
        <Grid item xs={12} md={6}>
          <Card>
            <CardHeader title="Backup Settings" />
            <CardContent>
              <FormControlLabel
                control={
                  <Switch
                    checked={settings.auto_backup_enabled}
                    onChange={(e) => setSettings(prev => ({
                      ...prev,
                      auto_backup_enabled: e.target.checked
                    }))}
                  />
                }
                label="Enable automatic backups"
              />
              
              <TextField
                fullWidth
                margin="normal"
                label="Backup frequency (days)"
                type="number"
                value={settings.backup_frequency_days}
                onChange={(e) => setSettings(prev => ({
                  ...prev,
                  backup_frequency_days: parseInt(e.target.value)
                }))}
              />
              
              <TextField
                fullWidth
                margin="normal"
                label="Google Drive folder name"
                value={settings.google_drive_folder_name}
                onChange={(e) => setSettings(prev => ({
                  ...prev,
                  google_drive_folder_name: e.target.value
                }))}
              />
              
              <Box mt={2}>
                <Button
                  variant="outlined"
                  startIcon={<Backup />}
                  onClick={handleBackupNow}
                >
                  Backup Now
                </Button>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={6}>
          <Card>
            <CardHeader title="Sync Settings" />
            <CardContent>
              <FormControlLabel
                control={
                  <Switch
                    checked={settings.ravelry_sync_enabled}
                    onChange={(e) => setSettings(prev => ({
                      ...prev,
                      ravelry_sync_enabled: e.target.checked
                    }))}
                  />
                }
                label="Enable Ravelry sync"
              />
              
              <Box mt={2}>
                <Button
                  variant="outlined"
                  startIcon={<Sync />}
                  onClick={handleSyncAll}
                >
                  Sync All Users
                </Button>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={6}>
          <Card>
            <CardHeader title="System Limits" />
            <CardContent>
              <TextField
                fullWidth
                margin="normal"
                label="Maximum file size (MB)"
                type="number"
                value={settings.max_file_size_mb}
                onChange={(e) => setSettings(prev => ({
                  ...prev,
                  max_file_size_mb: parseInt(e.target.value)
                }))}
              />
              
              <TextField
                fullWidth
                margin="normal"
                label="Maximum users"
                type="number"
                value={settings.max_users}
                onChange={(e) => setSettings(prev => ({
                  ...prev,
                  max_users: parseInt(e.target.value)
                }))}
              />
              
              <TextField
                fullWidth
                margin="normal"
                label="Storage limit (GB)"
                type="number"
                value={settings.storage_limit_gb}
                onChange={(e) => setSettings(prev => ({
                  ...prev,
                  storage_limit_gb: parseInt(e.target.value)
                }))}
              />
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={6}>
          <Card>
            <CardHeader title="Notifications" />
            <CardContent>
              <TextField
                fullWidth
                margin="normal"
                label="Admin notification emails"
                value={settings.notification_emails}
                onChange={(e) => setSettings(prev => ({
                  ...prev,
                  notification_emails: e.target.value
                }))}
                helperText="Comma-separated email addresses"
              />
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      <Box mt={3}>
        <Button
          variant="contained"
          startIcon={<Save />}
          onClick={handleSave}
          size="large"
        >
          Save Settings
        </Button>
      </Box>

      <Snackbar
        open={showSuccess}
        autoHideDuration={6000}
        onClose={() => setShowSuccess(false)}
      >
        <Alert onClose={() => setShowSuccess(false)} severity="success">
          Settings saved successfully!
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default SystemSettings;