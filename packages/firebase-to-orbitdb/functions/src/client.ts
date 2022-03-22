import axios from 'axios';
import { ORBITDB_RPC } from './utils/environment';

export const client = axios.create({ baseURL: ORBITDB_RPC });
