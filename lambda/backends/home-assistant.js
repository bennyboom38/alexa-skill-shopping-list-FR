const Base = require('./base');

class HomeAssistant extends Base {
  /**
   * Constructor.
   */
  constructor() {
    super();
  }

  /**
   * Get items.
   *
   * @returns {Array<Object>}
   */
  async list() {
    const res = await this.get(this.api_url, '/shopping_list', null, this.headers);
    return res.data.reverse();
  }

  /**
   * Create item.
   *
   * @param {string} name
   */
  async create(name) {
    await this.post(this.api_url, '/services/shopping_list/add_item', { name }, this.headers);
  }

  /**
   * Print item list.
   *
   * @param {string} name
   */
  async print(entityId) {
    await this.post(this.api_url, '/services/script/turn_on', { entity_id: entityId }, this.headers);
  }

  /**
   * Clear list.
   */
  async clear() {
    await this.post(
      this.api_url,
      '/services/shopping_list/complete_all',
      null,
      this.headers
    );
    await this.post(
      this.api_url,
      '/services/shopping_list/clear_completed_items',
      null,
      this.headers
    );
  }
}

module.exports = HomeAssistant;
