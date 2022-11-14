import { createRouter, createWebHistory } from "vue-router";

export const routes = [
  {
    path: "/",
    component: () => import("@/layout/index.vue"),
    redirect: "/status",
    children: [
      {
        path: "/status",
        component: () => import("@/views/status/index.vue"),
      },
      {
        path: "/edit",
        component: () => import("@/views/edit/index.vue"),
      },
    ],
  },
  {
    path: "/setup/autocut",
    component: () => import("@/views/setup/autocut.vue"),
  },
];

const router = createRouter({
  history: createWebHistory(),
  routes,
});

export default router;
