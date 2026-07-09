import PieSocket from 'piesocket-js';

class PieSocketService {
  constructor() {
    this.client = null;
  }

  /**
   * Initializes the PieSocket client with the user's profile.
   * @param {string} username - User's name
   * @param {string} email - User's email
   * @returns {PieSocket}
   */
  init(username, email = '') {
    const apiKey = import.meta.env.VITE_PIESOCKET_API_KEY || '';
    const clusterId = import.meta.env.VITE_PIESOCKET_CLUSTER_ID || 'demo';

    // Cleanup previous client connections
    if (this.client) {
      const connections = this.client.getConnections();
      Object.keys(connections).forEach((channelId) => {
        this.client.unsubscribe(channelId);
      });
    }

    // Pass serialized username and email as the userId
    this.client = new PieSocket({
      apiKey,
      clusterId,
      notifySelf: true,
      presence: true,
      userId: JSON.stringify({ username, email }),
    });

    return this.client;
  }

  /**
   * Subscribes to a channel.
   * @param {string} roomName
   * @returns {Promise<Channel>}
   */
  subscribe(roomName) {
    if (!this.client) {
      throw new Error('PieSocket client is not initialized. Call init() first.');
    }
    return this.client.subscribe(roomName);
  }

  /**
   * Unsubscribes from a channel.
   * @param {string} roomName
   */
  unsubscribe(roomName) {
    if (!this.client) return;
    this.client.unsubscribe(roomName);
  }

  getClient() {
    return this.client;
  }
}

export default new PieSocketService();
