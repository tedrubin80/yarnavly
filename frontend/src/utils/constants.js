export const YARN_WEIGHTS = [
  { value: 'lace', label: 'Lace (0)' },
  { value: 'light-fingering', label: 'Light Fingering (1)' },
  { value: 'fingering', label: 'Fingering (2)' },
  { value: 'sport', label: 'Sport (3)' },
  { value: 'dk', label: 'DK (4)' },
  { value: 'worsted', label: 'Worsted (5)' },
  { value: 'aran', label: 'Aran (6)' },
  { value: 'chunky', label: 'Chunky (7)' },
  { value: 'super-chunky', label: 'Super Chunky (8)' },
  { value: 'jumbo', label: 'Jumbo (9+)' }
];

export const COLOR_FAMILIES = [
  'Red', 'Orange', 'Yellow', 'Green', 'Blue', 'Purple', 
  'Pink', 'Brown', 'Black', 'White', 'Grey', 'Beige',
  'Variegated', 'Self-striping', 'Gradient', 'Speckled'
];

export const CRAFT_TYPES = [
  { value: 'knitting', label: 'Knitting' },
  { value: 'crochet', label: 'Crochet' },
  { value: 'weaving', label: 'Weaving' },
  { value: 'spinning', label: 'Spinning' },
  { value: 'dyeing', label: 'Dyeing' }
];

export const PROJECT_STATUSES = [
  { value: 'queued', label: 'Queued', color: '#9E9E9E' },
  { value: 'active', label: 'In Progress', color: '#2196F3' },
  { value: 'hibernating', label: 'On Hold', color: '#FF9800' },
  { value: 'completed', label: 'Completed', color: '#4CAF50' },
  { value: 'frogged', label: 'Frogged', color: '#F44336' }
];

export const DIFFICULTY_LEVELS = [
  { value: 1, label: 'Beginner', color: '#4CAF50' },
  { value: 2, label: 'Easy', color: '#8BC34A' },
  { value: 3, label: 'Intermediate', color: '#FFC107' },
  { value: 4, label: 'Advanced', color: '#FF9800' },
  { value: 5, label: 'Expert', color: '#F44336' }
];

export const FILE_TYPES = {
  patterns: ['pdf', 'doc', 'docx'],
  images: ['jpg', 'jpeg', 'png', 'gif', 'webp']
};

export const MAX_FILE_SIZE = 50 * 1024 * 1024; // 50MB