const axios = require('axios');

class RavelryService {
  constructor(username, password) {
    this.auth = {
      username: username,
      password: password
    };
    this.baseURL = 'https://api.ravelry.com';
  }

  async searchPatterns(query, options = {}) {
    try {
      const params = {
        query,
        page_size: options.limit || 20,
        page: options.page || 1,
        ...options
      };

      const response = await axios.get(`${this.baseURL}/patterns/search.json`, {
        auth: this.auth,
        params
      });

      return response.data;
    } catch (error) {
      throw new Error(`Ravelry API error: ${error.message}`);
    }
  }

  async getPattern(patternId) {
    try {
      const response = await axios.get(`${this.baseURL}/patterns/${patternId}.json`, {
        auth: this.auth
      });

      return response.data.pattern;
    } catch (error) {
      throw new Error(`Ravelry API error: ${error.message}`);
    }
  }

  async searchYarns(query, options = {}) {
    try {
      const params = {
        query,
        page_size: options.limit || 20,
        page: options.page || 1,
        ...options
      };

      const response = await axios.get(`${this.baseURL}/yarns/search.json`, {
        auth: this.auth,
        params
      });

      return response.data;
    } catch (error) {
      throw new Error(`Ravelry API error: ${error.message}`);
    }
  }

  async getUserStash(username) {
    try {
      const response = await axios.get(`${this.baseURL}/people/${username}/stash.json`, {
        auth: this.auth
      });

      return response.data.stash;
    } catch (error) {
      throw new Error(`Ravelry API error: ${error.message}`);
    }
  }

  async getUserQueue(username) {
    try {
      const response = await axios.get(`${this.baseURL}/people/${username}/queue.json`, {
        auth: this.auth
      });

      return response.data.queued_projects;
    } catch (error) {
      throw new Error(`Ravelry API error: ${error.message}`);
    }
  }

  async getUserProjects(username) {
    try {
      const response = await axios.get(`${this.baseURL}/people/${username}/projects.json`, {
        auth: this.auth
      });

      return response.data.projects;
    } catch (error) {
      throw new Error(`Ravelry API error: ${error.message}`);
    }
  }
}

module.exports = RavelryService;