// backend/routes/shoppingList.js
const express = require('express');
const router = express.Router();
const { auth } = require('../middleware/auth');
const shoppingListController = require('../controllers/shoppingListController');

// List operations
router.get('/', auth, shoppingListController.getUserShoppingLists);
router.post('/', auth, shoppingListController.createShoppingList);
router.get('/active', auth, shoppingListController.getActiveList);
router.get('/suggestions', auth, shoppingListController.suggestItems);
router.get('/:id', auth, shoppingListController.getShoppingListById);
router.put('/:id', auth, shoppingListController.updateShoppingList);
router.delete('/:id', auth, shoppingListController.deleteShoppingList);
router.get('/:id/export', auth, shoppingListController.exportShoppingList);

// Item operations
router.post('/:id/items', auth, shoppingListController.addItemToList);
router.put('/items/:itemId', auth, shoppingListController.updateListItem);
router.delete('/items/:itemId', auth, shoppingListController.removeItemFromList);
router.post('/items/:itemId/purchase', auth, shoppingListController.markItemPurchased);

module.exports = router;