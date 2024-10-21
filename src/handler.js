const axios = require('axios');
const fs = require('fs-extra');
const path = require('path');

class CMSUpdater {
  constructor() {
    this.API_TOKEN = 'WEBFLOW_TOKEN_API_KEY'; // Replace with your API token
    this.COLLECTION_ID = 'BLOG_POST_COLLECTION_ID'; // Replace with your blog post collection ID
    this.CATEGORIES_COLLECTION_ID = 'CATEGORY_COLLECTION_ID'; // Replace with your categories collection ID
    this.BASE_URL = `https://api.webflow.com/v2/collections/${this.COLLECTION_ID}/items`;
    this.CATEGORIES_URL = `https://api.webflow.com/v2/collections/${this.CATEGORIES_COLLECTION_ID}/items`;
    this.MAX_RETRIES = 5;
    this.RATE_LIMIT_INTERVAL = 1000; // 1 second delay to avoid rate limits
    this.RATE_LIMIT_WAIT = 30000; // 30 seconds delay for rate limit
    this.updatedItemsFile = path.join(__dirname, 'updatedItems.json');
    this.updatedItems = fs.existsSync(this.updatedItemsFile) ? fs.readJsonSync(this.updatedItemsFile) : [];
    this.categoryNamesToFind = ['anxiety', 'mental health'];
    this.categoryNameToInclude = 'mental wellness';
    this.categoryIds = {};
  }

  isItemUpdated(itemId) {
    return this.updatedItems.includes(itemId);
  }

  delay(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  async fetchCategories() {
    try {
      const response = await axios.get(`${this.CATEGORIES_URL}?limit=100`, {
        headers: {
          Authorization: `Bearer ${this.API_TOKEN}`,
          'accept-version': '2.0.0',
        },
      });
      return response.data.items;
    } catch (error) {
      console.error('Error fetching categories:', error.response ? error.response.data : error);
      throw error;
    }
  }

  async getCategoryIds() {
    const categories = await this.fetchCategories();

    categories.forEach(category => {
      const categoryName = category.fieldData.name.toLowerCase();
      if (this.categoryNamesToFind.includes(categoryName)) {
        this.categoryIds[categoryName] = category.id;
      }
      if (categoryName === this.categoryNameToInclude) {
        this.categoryIds[this.categoryNameToInclude] = category.id;
      }
    });

    if (!this.categoryIds[this.categoryNameToInclude]) {
      throw new Error(`${this.categoryNameToInclude} category not found in categories collection.`);
    }
  }

  async fetchCMSItems(limit = 100, offset = 0) {
    try {
      const response = await axios.get(`${this.BASE_URL}?limit=${limit}&offset=${offset}`, {
        headers: {
          Authorization: `Bearer ${this.API_TOKEN}`,
          'accept-version': '2.0.0',
        },
      });
      return response.data.items;
    } catch (error) {
      console.error('Error fetching CMS items:', error.response ? error.response.data : error);
      return [];
    }
  }

  async updateCMSItem(itemId, fields) {
    try {
      const response = await axios.patch(`${this.BASE_URL}/${itemId}`, {
        fieldData: {
          keywords: fields.keywords
        }
      }, {
        headers: {
          Authorization: `Bearer ${this.API_TOKEN}`,
          'accept-version': '2.0.0',
          'Content-Type': 'application/json',
        },
      });

      return response.data;
    } catch (error) {
      if (error.response && error.response.status === 429) {
        await this.delay(this.RATE_LIMIT_WAIT);
        return this.updateCMSItem(itemId, fields);
      }
      console.error(`Error updating item ${itemId}:`, error.response ? error.response.data : error);
      throw error;
    }
  }

  async updateItemIfNeeded(item) {
    if (this.isItemUpdated(item.id)) {
      return;
    }

    const keywordIds = item.fieldData.keywords;

    if (!keywordIds) {
      return;
    }

    const keywordsNotToInclude = this.categoryNamesToFind.map(name => this.categoryIds[name]);
    const keywordToInclude = this.categoryIds[this.categoryNameToInclude];

    const updatedKeywordsArr = keywordIds.map((id) => {
      if (keywordsNotToInclude.includes(id)) {
        return keywordToInclude;
      }
      return id;
    });

    const updatedKeywordsSet = new Set(updatedKeywordsArr);

    const hasMentalWellnessCategory = updatedKeywordsSet.has(this.categoryIds[this.categoryNameToInclude]);

    if (hasMentalWellnessCategory) {
      const fields = {
        keywords: [...updatedKeywordsSet],
      };

      let retries = 0;
      let updated = false;

      // Retry logic for updates
      while (retries < this.MAX_RETRIES && !updated) {
        try {
          await this.updateCMSItem(item.id, fields);
          this.updatedItems.push(item.id); // Track updated items
          fs.writeJsonSync(this.updatedItemsFile, this.updatedItems); // Save progress
          updated = true;
        } catch (error) {
          retries++;
        }
      }

      if (!updated) {
        console.error(`Failed to update item ${item.id} after ${this.MAX_RETRIES} attempts.`);
      }
    }
  }

  async processCMSItems(limit = 100) {
    let offset = 0;
    let items;

    do {
      items = await this.fetchCMSItems(limit, offset);
      const updatePromises = items.map(item => this.updateItemIfNeeded(item));
      await Promise.all(updatePromises);

      offset += limit;
    } while (items.length > 0);

    console.log('Processing complete!');
  }
}

// Start the update process
const cmsUpdater = new CMSUpdater();
cmsUpdater.getCategoryIds()
  .then(() => cmsUpdater.processCMSItems())
  .then(() => console.log('Update process finished successfully!'))
  .catch(console.error);