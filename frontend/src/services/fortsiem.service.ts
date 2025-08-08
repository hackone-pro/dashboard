import axios from 'axios'

const FORTISIEM_URL = 'https://148.230.50.68:14006/phoenix/rest';

export async function getEventQuery(username: string, password: string, body: any) {
  const response = await axios.post(
    `${FORTISIEM_URL}/query/eventQuery`,
    body,
    {
      auth: { username, password }
    }
  );
  return response.data;
}