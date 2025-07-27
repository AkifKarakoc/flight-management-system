import MainLayout from '@/layouts/MainLayout.vue';

const airlineRoutes = {
  path: '/reference/airlines',
  component: MainLayout,
  meta: { requiresAuth: true, breadcrumb: 'Airlines' },
  children: [
    {
      path: '',
      name: 'AirlineManagement',
      component: () => import('@/pages/reference/airlines/AirlineManagement.vue'),
      meta: { title: 'Airline Management' }
    },
    {
      path: 'create',
      name: 'AirlineCreate',
      component: () => import('@/pages/reference/airlines/AirlineCreate.vue'),
      meta: { title: 'Create Airline', breadcrumb: 'Create' }
    },
    {
      path: 'edit/:id',
      name: 'AirlineEdit',
      component: () => import('@/pages/reference/airlines/AirlineEdit.vue'),
      meta: { title: 'Edit Airline', breadcrumb: 'Edit' }
    }
  ]
};

// YENİ EKLENEN KISIM
const aircraftRoutes = {
  path: '/reference/aircrafts',
  component: MainLayout,
  meta: { requiresAuth: true, breadcrumb: 'Aircrafts' },
  children: [
    {
      path: '',
      name: 'AircraftManagement',
      component: () => import('@/pages/reference/aircraft/AircraftManagement.vue'),
      meta: { title: 'Aircraft Management' }
    },
    {
      path: 'create',
      name: 'AircraftCreate',
      component: () => import('@/pages/reference/aircraft/AircraftCreate.vue'),
      meta: { title: 'Create Aircraft', breadcrumb: 'Create' }
    },
    {
      path: 'edit/:id',
      name: 'AircraftEdit',
      component: () => import('@/pages/reference/aircraft/AircraftEdit.vue'),
      meta: { title: 'Edit Aircraft', breadcrumb: 'Edit' }
    }
  ]
};

const airportRoutes = {
  path: '/reference/airports',
  component: MainLayout,
  meta: {
    requiresAuth: true,
    resource: 'Airport',
    breadcrumb: 'Airports'
  },
  children: [
    {
      path: '',
      name: 'AirportManagement',
      component: () => import('@/pages/reference/airports/AirportManagement.vue'),
      meta: { title: 'Airport Management', action: 'list' }
    },
    {
      path: 'create',
      name: 'AirportCreate',
      component: () => import('@/pages/reference/airports/AirportCreate.vue'),
      meta: { title: 'Create Airport', action: 'create', breadcrumb: 'Create' }
    },
    {
      path: 'edit/:id',
      name: 'AirportEdit',
      component: () => import('@/pages/reference/airports/AirportEdit.vue'),
      meta: { title: 'Edit Airport', action: 'edit', breadcrumb: 'Edit' }
    }
  ]
};

const crewRoutes = {
  path: '/reference/crew-members',
  component: MainLayout,
  meta: {
    requiresAuth: true,
    resource: 'CrewMember',
    breadcrumb: 'Crew Members'
  },
  children: [
    {
      path: '',
      name: 'CrewManagement',
      component: () => import('@/pages/reference/crew/CrewManagement.vue'),
      meta: { title: 'Crew Management', action: 'list' }
    },
    {
      path: 'create',
      name: 'CrewCreate',
      component: () => import('@/pages/reference/crew/CrewCreate.vue'),
      meta: { title: 'Create Crew Member', action: 'create', breadcrumb: 'Create' }
    },
    {
      path: 'edit/:id',
      name: 'CrewEdit',
      component: () => import('@/pages/reference/crew/CrewEdit.vue'),
      meta: { title: 'Edit Crew Member', action: 'edit', breadcrumb: 'Edit' }
    }
  ]
};

const routeRoutes = {
  path: '/reference/routes',
  component: MainLayout,
  meta: {
    requiresAuth: true,
    resource: 'Route',
    breadcrumb: 'Routes'
  },
  children: [
    {
      path: '',
      name: 'RouteManagement',
      component: () => import('@/pages/reference/routes/RouteManagement.vue'),
      meta: { title: 'Route Management', action: 'list' }
    },
    {
      path: 'create',
      name: 'RouteCreate',
      component: () => import('@/pages/reference/routes/RouteCreate.vue'),
      meta: { title: 'Create Route', action: 'create', breadcrumb: 'Create' }
    },
    {
      path: 'edit/:id',
      name: 'RouteEdit',
      component: () => import('@/pages/reference/routes/RouteEdit.vue'),
      meta: { title: 'Edit Route', action: 'edit', breadcrumb: 'Edit' }
    }
  ]
};

const referenceRoutes = {
  path: '/reference',
  component: MainLayout,
  meta: { requiresAuth: true, breadcrumb: 'Reference Data' },
  children: [
    // Mevcut diğer referans rotaları buraya eklenebilir.
  ]
};

// Rotaları birleştirip export ediyoruz.
export default [
  referenceRoutes,
  airlineRoutes,
  aircraftRoutes,
  airportRoutes,
  crewRoutes,
  routeRoutes
];
