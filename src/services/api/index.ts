import { doRequest } from '../../common/utils';

export default class ApiService {
  static createUrl(baseUrl: string, path: string): string {
    return `${baseUrl}${path}`;
  }

  static validateApiKey(baseUrl: string, apiKey: string) {
    const path: string = '/user/checkapikey';
    const url: string = this.createUrl(baseUrl, path);
    return doRequest(url, 'POST', { apiKey });
  }

  static fetchConfig(baseUrl: string, apiKey: string) {
    const path: string = '/immersive-config';
    const url: string = this.createUrl(baseUrl, path);
    return doRequest(url, 'POST', { apiKey });
  }

  static async fetchWaterMark(baseUrl: string, apiKey: string) {
    const path = '/user/watermark';
    const url = this.createUrl(baseUrl, path);
    const { message } = await doRequest(url, 'POST', { apiKey });
    return message;
  }
}
