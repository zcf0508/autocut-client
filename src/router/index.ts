import { createRouter, createWebHistory } from "vue-router";

export const routes = [
  {
    path: "/",
    component: () => import("@/layout/index.vue"),
    children: [
    ],
  },
];

const router = createRouter({
  history: createWebHistory(),
  routes,
});

export default router;
