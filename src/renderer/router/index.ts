import { createRouter, createWebHashHistory } from "vue-router";
import Layout from "@/layout/index.vue"
import Status from "@/views/status/index.vue"
import Edit from "@/views/edit/index.vue"
import SetupAutocut from "@/views/setup/autocut.vue"

export const routes = [
  {
    path: "/",
    component: Layout,
    redirect: "/status",
    children: [
      {
        path: "/status",
        component: Status,
      },
      {
        path: "/edit",
        component: Edit,
      },
    ],
  },
  {
    path: "/setup/autocut",
    component: SetupAutocut,
  },
];

const router = createRouter({
  history: createWebHashHistory(),
  routes,
});

export default router;
