import MainLayout from '@/layouts/MainLayout.vue';

const flightRoutes = {
  path: '/flights',
  component: MainLayout,
  meta: {
    requiresAuth: true,
    resource: 'Flight',
    breadcrumb: 'Flights'
  },
  children: [
    {
      path: '',
      name: 'FlightManagement',
      component: () => import('@/pages/flights/FlightManagement.vue'),
      meta: { title: 'Flight Management', action: 'list' }
    },
    {
      path: 'create',
      name: 'FlightCreate',
      component: () => import('@/pages/flights/FlightCreate.vue'),
      meta: { title: 'Create Flight', action: 'create', breadcrumb: 'Create' }
    },
    {
      path: 'edit/:id',
      name: 'FlightEdit',
      component: () => import('@/pages/flights/FlightEdit.vue'),
      meta: { title: 'Edit Flight', action: 'edit', breadcrumb: 'Edit' }
    },
    {
      path: 'view/:id',
      name: 'FlightView',
      component: () => import('@/pages/flights/FlightView.vue'),
      meta: { title: 'View Flight', action: 'view', breadcrumb: 'View' }
    },
    {
      path: 'upload',
      name: 'FlightUpload',
      component: () => import('@/pages/flights/FlightUpload.vue'),
      meta: { title: 'Upload Flights', action: 'upload', breadcrumb: 'Upload' }
    }
  ]
};

export default flightRoutes;
