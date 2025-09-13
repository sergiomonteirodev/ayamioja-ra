import http from 'k6/http';
import { sleep } from 'k6';

export let options = {
  vus: 100,         // 1000 "usuários"
  duration: '30s',   // dura 30 segundos
};

export default function () {
  http.get('https://sergiomonteirodev.github.io/ayamioja-ra/');
  sleep(1); // simula tempo entre ações do usuário
}