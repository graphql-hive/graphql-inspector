import { parseEndpoint } from '../helpers/utils.js';

describe('parseEndpoint', () => {
  it('should parse an endpoint URL and provide default headers', () => {
    const endpoint = parseEndpoint('https://api.github.com');
    expect(endpoint).toEqual({
      url: 'https://api.github.com',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
    });
  });

  it('should parse an endpoint object and provide default headers', () => {
    const endpoint = parseEndpoint({ url: 'https://api.github.com', method: 'GET' });
    expect(endpoint).toEqual({
      url: 'https://api.github.com',
      method: 'GET',
    });
  });
});