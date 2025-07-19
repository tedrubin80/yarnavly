// backend/controllers/shoppingListController.js
const { 
  ShoppingList, 
  ShoppingListItem,
  YarnLine,
  YarnBrand,
  Pattern,
  YarnInventory
} = require('../models');
const { Op } = require('sequelize');
const { logger } = require('../middleware/errorHandler');

class ShoppingListController {
  async getUserShoppingLists(req, res) {
    try {
      const lists = await ShoppingList.findAll({
        where: { user_id: req.user.id },
        include: [{
          model: ShoppingListItem,
          include: [
            {
              model: YarnLine,
              include: [YarnBrand]
            },
            Pattern
          ]
        }],
        order: [
          ['is_active', 'DESC'],
          ['created_at', 'DESC']
        ]
      });

      res.json(lists);
    } catch (error) {
      logger.error('Error fetching shopping lists:', error);
      res.status(500).json({ error: error.message });
    }
  }

  async createShoppingList(req, res) {
    try {
      const { name, description } = req.body;

      // If this is set as active, deactivate other lists
      if (req.body.is_active) {
        await ShoppingList.update(
          { is_active: false },
          { where: { user_id: req.user.id } }
        );
      }

      const list = await ShoppingList.create({
        user_id: req.user.id,
        name: name || 'My Shopping List',
        description,
        is_active: req.body.is_active !== false
      });

      res.status(201).json(list);
    } catch (error) {
      logger.error('Error creating shopping list:', error);
      res.status(500).json({ error: error.message });
    }
  }

  async getShoppingListById(req, res) {
    try {
      const list = await ShoppingList.findOne({
        where: {
          id: req.params.id,
          user_id: req.user.id
        },
        include: [{
          model: ShoppingListItem,
          include: [
            {
              model: YarnLine,
              include: [YarnBrand]
            },
            Pattern
          ]
        }]
      });

      if (!list) {
        return res.status(404).json({ error: 'Shopping list not found' });
      }

      // Calculate total estimated cost
      const totalEstimated = list.ShoppingListItems.reduce((sum, item) => {
        return sum + (item.estimated_price * item.quantity || 0);
      }, 0);

      const totalActual = list.ShoppingListItems
        .filter(item => item.purchased)
        .reduce((sum, item) => {
          return sum + (item.actual_price * item.quantity || 0);
        }, 0);

      res.json({
        ...list.toJSON(),
        totalEstimatedCost: totalEstimated,
        totalActualCost: totalActual,
        itemCount: list.ShoppingListItems.length,
        purchasedCount: list.ShoppingListItems.filter(item => item.purchased).length
      });
    } catch (error) {
      logger.error('Error fetching shopping list:', error);
      res.status(500).json({ error: error.message });
    }
  }

  async updateShoppingList(req, res) {
    try {
      const list = await ShoppingList.findOne({
        where: {
          id: req.params.id,
          user_id: req.user.id
        }
      });

      if (!list) {
        return res.status(404).json({ error: 'Shopping list not found' });
      }

      // If setting as active, deactivate others
      if (req.body.is_active && !list.is_active) {
        await ShoppingList.update(
          { is_active: false },
          { where: { user_id: req.user.id } }
        );
      }

      await list.update(req.body);
      res.json(list);
    } catch (error) {
      logger.error('Error updating shopping list:', error);
      res.status(500).json({ error: error.message });
    }
  }

  async deleteShoppingList(req, res) {
    try {
      const list = await ShoppingList.findOne({
        where: {
          id: req.params.id,
          user_id: req.user.id
        }
      });

      if (!list) {
        return res.status(404).json({ error: 'Shopping list not found' });
      }

      await list.destroy();
      res.json({ message: 'Shopping list deleted successfully' });
    } catch (error) {
      logger.error('Error deleting shopping list:', error);
      res.status(500).json({ error: error.message });
    }
  }

  async addItemToList(req, res) {
    try {
      const list = await ShoppingList.findOne({
        where: {
          id: req.params.id,
          user_id: req.user.id
        }
      });

      if (!list) {
        return res.status(404).json({ error: 'Shopping list not found' });
      }

      const itemData = {
        ...req.body,
        shopping_list_id: list.id
      };

      // Check if item already exists in list
      if (itemData.yarn_line_id) {
        const existingItem = await ShoppingListItem.findOne({
          where: {
            shopping_list_id: list.id,
            yarn_line_id: itemData.yarn_line_id,
            colorway: itemData.colorway || null
          }
        });

        if (existingItem) {
          // Update quantity instead of creating duplicate
          existingItem.quantity += itemData.quantity || 1;
          await existingItem.save();
          return res.json(existingItem);
        }
      }

      const item = await ShoppingListItem.create(itemData);

      // Fetch with associations
      const createdItem = await ShoppingListItem.findByPk(item.id, {
        include: [
          {
            model: YarnLine,
            include: [YarnBrand]
          },
          Pattern
        ]
      });

      res.status(201).json(createdItem);
    } catch (error) {
      logger.error('Error adding item to list:', error);
      res.status(500).json({ error: error.message });
    }
  }

  async updateListItem(req, res) {
    try {
      const item = await ShoppingListItem.findByPk(req.params.itemId, {
        include: [{
          model: ShoppingList,
          where: { user_id: req.user.id }
        }]
      });

      if (!item) {
        return res.status(404).json({ error: 'Item not found' });
      }

      await item.update(req.body);

      const updatedItem = await ShoppingListItem.findByPk(item.id, {
        include: [
          {
            model: YarnLine,
            include: [YarnBrand]
          },
          Pattern
        ]
      });

      res.json(updatedItem);
    } catch (error) {
      logger.error('Error updating list item:', error);
      res.status(500).json({ error: error.message });
    }
  }

  async removeItemFromList(req, res) {
    try {
      const item = await ShoppingListItem.findByPk(req.params.itemId, {
        include: [{
          model: ShoppingList,
          where: { user_id: req.user.id }
        }]
      });

      if (!item) {
        return res.status(404).json({ error: 'Item not found' });
      }

      await item.destroy();
      res.json({ message: 'Item removed from list' });
    } catch (error) {
      logger.error('Error removing item from list:', error);
      res.status(500).json({ error: error.message });
    }
  }

  async markItemPurchased(req, res) {
    try {
      const { actual_price, purchase_notes } = req.body;

      const item = await ShoppingListItem.findByPk(req.params.itemId, {
        include: [{
          model: ShoppingList,
          where: { user_id: req.user.id }
        }]
      });

      if (!item) {
        return res.status(404).json({ error: 'Item not found' });
      }

      await item.update({
        purchased: true,
        purchase_date: new Date(),
        actual_price: actual_price || item.estimated_price,
        notes: purchase_notes ? `${item.notes || ''}\nPurchase: ${purchase_notes}` : item.notes
      });

      // If it's yarn, optionally create inventory entry
      if (req.body.add_to_inventory && item.yarn_line_id) {
        await YarnInventory.create({
          user_id: req.user.id,
          yarn_line_id: item.yarn_line_id,
          colorway: item.colorway,
          skeins_total: item.quantity,
          skeins_remaining: item.quantity,
          total_yardage: item.YarnLine?.yardage_per_skein * item.quantity || 0,
          remaining_yardage: item.YarnLine?.yardage_per_skein * item.quantity || 0,
          purchase_date: new Date(),
          purchase_price: actual_price || item.estimated_price,
          vendor: item.vendor,
          notes: `Added from shopping list: ${item.ShoppingList.name}`
        });
      }

      res.json(item);
    } catch (error) {
      logger.error('Error marking item as purchased:', error);
      res.status(500).json({ error: error.message });
    }
  }

  async getActiveList(req, res) {
    try {
      let list = await ShoppingList.findOne({
        where: {
          user_id: req.user.id,
          is_active: true
        },
        include: [{
          model: ShoppingListItem,
          where: { purchased: false },
          required: false,
          include: [
            {
              model: YarnLine,
              include: [YarnBrand]
            },
            Pattern
          ]
        }]
      });

      if (!list) {
        // Create a default active list
        list = await ShoppingList.create({
          user_id: req.user.id,
          name: 'My Shopping List',
          is_active: true
        });
        list.ShoppingListItems = [];
      }

      res.json(list);
    } catch (error) {
      logger.error('Error fetching active list:', error);
      res.status(500).json({ error: error.message });
    }
  }

  async exportShoppingList(req, res) {
    try {
      const list = await ShoppingList.findOne({
        where: {
          id: req.params.id,
          user_id: req.user.id
        },
        include: [{
          model: ShoppingListItem,
          include: [
            {
              model: YarnLine,
              include: [YarnBrand]
            },
            Pattern
          ]
        }]
      });

      if (!list) {
        return res.status(404).json({ error: 'Shopping list not found' });
      }

      const { format = 'text' } = req.query;

      if (format === 'json') {
        res.json(list);
      } else if (format === 'csv') {
        const csv = this.generateCSV(list);
        res.setHeader('Content-Type', 'text/csv');
        res.setHeader('Content-Disposition', `attachment; filename="${list.name}.csv"`);
        res.send(csv);
      } else {
        // Default to text format
        const text = this.generateTextList(list);
        res.setHeader('Content-Type', 'text/plain');
        res.setHeader('Content-Disposition', `attachment; filename="${list.name}.txt"`);
        res.send(text);
      }
    } catch (error) {
      logger.error('Error exporting shopping list:', error);
      res.status(500).json({ error: error.message });
    }
  }

  generateTextList(list) {
    let text = `${list.name}\n`;
    text += `${list.description || ''}\n`;
    text += `Created: ${list.created_at.toLocaleDateString()}\n`;
    text += '='.repeat(50) + '\n\n';

    const unpurchased = list.ShoppingListItems.filter(item => !item.purchased);
    const purchased = list.ShoppingListItems.filter(item => item.purchased);

    if (unpurchased.length > 0) {
      text += 'TO BUY:\n';
      unpurchased.forEach(item => {
        text += `□ ${item.quantity}x `;
        
        if (item.YarnLine) {
          text += `${item.YarnLine.YarnBrand.name} ${item.YarnLine.name}`;
          if (item.colorway) text += ` - ${item.colorway}`;
        } else if (item.Pattern) {
          text += `Pattern: ${item.Pattern.title}`;
        } else {
          text += item.item_name;
        }
        
        if (item.estimated_price) {
          text += ` ($${item.estimated_price * item.quantity})`;
        }
        
        if (item.vendor) text += ` @ ${item.vendor}`;
        if (item.notes) text += `\n   Notes: ${item.notes}`;
        text += '\n';
      });
    }

    if (purchased.length > 0) {
      text += '\n\nPURCHASED:\n';
      purchased.forEach(item => {
        text += `☑ ${item.quantity}x `;
        
        if (item.YarnLine) {
          text += `${item.YarnLine.YarnBrand.name} ${item.YarnLine.name}`;
          if (item.colorway) text += ` - ${item.colorway}`;
        } else if (item.Pattern) {
          text += `Pattern: ${item.Pattern.title}`;
        } else {
          text += item.item_name;
        }
        
        if (item.actual_price) {
          text += ` ($${item.actual_price * item.quantity})`;
        }
        
        text += ` - ${item.purchase_date.toLocaleDateString()}`;
        text += '\n';
      });
    }

    const totalEstimated = unpurchased.reduce((sum, item) => 
      sum + (item.estimated_price * item.quantity || 0), 0
    );
    const totalSpent = purchased.reduce((sum, item) => 
      sum + (item.actual_price * item.quantity || 0), 0
    );

    text += '\n' + '='.repeat(50) + '\n';
    text += `Total Estimated: $${totalEstimated.toFixed(2)}\n`;
    text += `Total Spent: $${totalSpent.toFixed(2)}\n`;

    return text;
  }

  generateCSV(list) {
    const rows = [];
    rows.push(['Shopping List', list.name]);
    rows.push(['Created', list.created_at.toLocaleDateString()]);
    rows.push(['']);
    rows.push(['Status', 'Type', 'Quantity', 'Item', 'Details', 'Est. Price', 'Actual Price', 'Vendor', 'Notes']);

    list.ShoppingListItems.forEach(item => {
      let itemName = '';
      let details = '';

      if (item.YarnLine) {
        itemName = `${item.YarnLine.YarnBrand.name} ${item.YarnLine.name}`;
        details = item.colorway || '';
      } else if (item.Pattern) {
        itemName = item.Pattern.title;
        details = item.Pattern.designer || '';
      } else {
        itemName = item.item_name;
      }

      rows.push([
        item.purchased ? 'Purchased' : 'To Buy',
        item.item_type,
        item.quantity,
        itemName,
        details,
        item.estimated_price || '',
        item.actual_price || '',
        item.vendor || '',
        item.notes || ''
      ]);
    });

    return rows.map(row => row.map(cell => `"${cell}"`).join(',')).join('\n');
  }

  async suggestItems(req, res) {
    try {
      const userId = req.user.id;
      const { type = 'all' } = req.query;

      const suggestions = [];

      if (type === 'all' || type === 'yarn') {
        // Suggest yarn based on low stock
        const lowStockYarn = await YarnInventory.findAll({
          where: {
            user_id: userId,
            skeins_remaining: { [Op.lt]: 2 }
          },
          include: [{
            model: YarnLine,
            include: [YarnBrand]
          }],
          limit: 5
        });

        lowStockYarn.forEach(yarn => {
          suggestions.push({
            type: 'yarn',
            reason: 'Low stock',
            item: {
              yarn_line_id: yarn.yarn_line_id,
              colorway: yarn.colorway,
              name: `${yarn.YarnLine.YarnBrand.name} ${yarn.YarnLine.name} - ${yarn.colorway}`,
              current_stock: yarn.skeins_remaining,
              suggested_quantity: 3
            }
          });
        });

        // Suggest yarn based on active projects
        const activeProjects = await Project.findAll({
          where: {
            user_id: userId,
            status: 'active'
          },
          include: [Pattern]
        });

        // This would need more sophisticated logic to match yarn requirements
      }

      if (type === 'all' || type === 'pattern') {
        // Suggest patterns based on stash
        const yarnInStash = await YarnInventory.findAll({
          where: {
            user_id: userId,
            remaining_yardage: { [Op.gte]: 200 }
          },
          include: [{
            model: YarnLine
          }],
          attributes: ['yarn_line_id', 'remaining_yardage'],
          group: ['yarn_line_id', 'YarnLine.id', 'remaining_yardage'],
          order: [['remaining_yardage', 'DESC']],
          limit: 3
        });

        // This would need pattern matching logic
      }

      res.json(suggestions);
    } catch (error) {
      logger.error('Error generating suggestions:', error);
      res.status(500).json({ error: error.message });
    }
  }
}

module.exports = new ShoppingListController();