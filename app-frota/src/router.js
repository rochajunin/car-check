import { createRouter, createWebHistory } from 'vue-router';
import MotoristaView from './views/MotoristaView.vue';
import AdminView from './views/AdminView.vue';

const routes = [
  { path: '/', redirect: '/motorista' },
  { path: '/motorista', component: MotoristaView },
  { path: '/admin', component: AdminView }
];

export const router = createRouter({
  history: createWebHistory(),
  routes
});