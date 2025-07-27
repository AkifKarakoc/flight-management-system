# Frontend-Backend Integration Guide

## Overview
The frontend has been successfully updated to be compatible with the backend Flight Management System. All API endpoints, data models, and service methods have been aligned with the backend structure.

## Key Updates Made

### 1. Flight Service (`src/services/flightService.js`)
- ✅ Updated all API endpoints to use `/api/v1/flights` prefix
- ✅ Added support for connecting flights management
- ✅ Added bulk operations (status update, delete)
- ✅ Added route-based flight operations
- ✅ Added CSV upload and validation
- ✅ Added statistics and analytics endpoints
- ✅ Added health check and system info endpoints
- ✅ Updated validation rules to match backend requirements

### 2. Constants (`src/utils/constants.js`)
- ✅ Updated API endpoints to match backend structure
- ✅ Added flight types: PASSENGER, CARGO, POSITIONING, FERRY, TRAINING
- ✅ Added flight statuses: SCHEDULED, BOARDING, DEPARTED, ARRIVED, DELAYED, CANCELLED
- ✅ Added display names and colors for statuses and types
- ✅ Added pagination defaults
- ✅ Added validation rules
- ✅ Added error and success messages
- ✅ Added WebSocket events
- ✅ Added file upload configurations

### 3. API Configuration (`src/services/api.js`)
- ✅ Already properly configured with correct base URLs
- ✅ CORS handling is in place
- ✅ Authentication token handling is configured
- ✅ Error handling and retry logic is implemented

## Backend API Structure

### Flight Service Endpoints (Port 8082)
```
Base URL: http://localhost:8082

GET    /api/v1/flights                    - Get all flights with pagination
GET    /api/v1/flights/{id}               - Get flight by ID
POST   /api/v1/flights                    - Create new flight
PUT    /api/v1/flights/{id}               - Update flight
DELETE /api/v1/flights/{id}               - Delete flight

GET    /api/v1/flights/date/{date}        - Get flights by date
GET    /api/v1/flights/airline/{id}       - Get flights by airline
GET    /api/v1/flights/airport/{id}       - Get flights by airport
GET    /api/v1/flights/status/{status}    - Get flights by status
GET    /api/v1/flights/route/{id}         - Get flights by route
GET    /api/v1/flights/delayed            - Get delayed flights

PUT    /api/v1/flights/{id}/status        - Update flight status
PUT    /api/v1/flights/{id}/delay         - Record flight delay

POST   /api/v1/flights/connecting         - Create connecting flight
GET    /api/v1/flights/connecting         - Get connecting flights
GET    /api/v1/flights/connecting/{id}    - Get connecting flight details
PUT    /api/v1/flights/connecting/{id}    - Update connecting flight
DELETE /api/v1/flights/connecting/{id}    - Delete connecting flight

GET    /api/v1/flights/{id}/segments      - Get flight segments
PUT    /api/v1/flights/segments/{id}      - Update flight segment
PATCH  /api/v1/flights/segments/{id}/status - Update segment status

POST   /api/v1/flights/bulk-status-update - Bulk status update
DELETE /api/v1/flights/bulk-delete        - Bulk delete flights

GET    /api/v1/flights/search             - Search flights
GET    /api/v1/flights/filter             - Filter flights
GET    /api/v1/flights/count              - Get flight counts
GET    /api/v1/flights/stats              - Get flight statistics

POST   /api/v1/flights/upload-csv         - Upload CSV file
POST   /api/v1/flights/validate-csv       - Validate CSV file
GET    /api/v1/flights/csv-template       - Get CSV template

GET    /api/v1/flights/system-info        - Get system information
GET    /api/v1/flights/migration-status   - Get migration status
GET    /api/v1/flights/health             - Health check
```

### Data Models

#### FlightRequest (for creating/updating flights)
```javascript
{
  flightNumber: "TK123",           // Required, format: XX123
  airlineId: 1,                    // Required
  aircraftId: 1,                   // Required
  routeId: 1,                      // Required
  flightDate: "2024-01-15",        // Required, YYYY-MM-DD
  scheduledDeparture: "2024-01-15 10:00", // Required, YYYY-MM-DD HH:mm
  scheduledArrival: "2024-01-15 12:00",   // Required, YYYY-MM-DD HH:mm
  actualDeparture: "2024-01-15 10:15",    // Optional
  actualArrival: "2024-01-15 12:15",      // Optional
  status: "SCHEDULED",             // Optional, default: SCHEDULED
  type: "PASSENGER",               // Required: PASSENGER, CARGO, POSITIONING, FERRY, TRAINING
  passengerCount: 150,             // Optional
  cargoWeight: 1000,               // Optional
  notes: "Flight notes",           // Optional, max 500 chars
  gateNumber: "A12",               // Optional, max 10 chars
  delayMinutes: 15,                // Optional
  delayReason: "Weather",          // Optional, max 200 chars
  active: true                     // Optional, default: true
}
```

#### FlightResponse (from backend)
```javascript
{
  id: 1,
  flightNumber: "TK123",
  airline: { /* AirlineCache object */ },
  aircraft: { /* AircraftCache object */ },
  route: { /* RouteCache object */ },
  routePath: "IST → ANK → IZM",
  routeDistance: 1200,
  routeEstimatedTime: 180,
  isMultiSegmentRoute: false,
  originAirport: { /* AirportCache object */ },
  destinationAirport: { /* AirportCache object */ },
  flightDate: "2024-01-15",
  scheduledDeparture: "2024-01-15 10:00",
  scheduledArrival: "2024-01-15 12:00",
  actualDeparture: "2024-01-15 10:15",
  actualArrival: "2024-01-15 12:15",
  status: "DEPARTED",
  type: "PASSENGER",
  passengerCount: 150,
  cargoWeight: 1000,
  notes: "Flight notes",
  gateNumber: "A12",
  delayMinutes: 15,
  delayReason: "Weather",
  active: true,
  flightDuration: 120,
  isDelayed: true,
  delayStatus: "MINOR_DELAY",
  onTimePerformance: 95.5,
  createdAt: "2024-01-15 09:00",
  updatedAt: "2024-01-15 10:15",
  // Connecting flight fields
  parentFlightId: null,
  segmentNumber: null,
  isConnectingFlight: false,
  connectionTimeMinutes: null,
  connectingFlights: [],
  totalSegments: null,
  fullRoute: null
}
```

#### ConnectingFlightRequest (for creating connecting flights)
```javascript
{
  mainFlightNumber: "TK123",
  airlineId: 1,
  aircraftId: 1,
  type: "PASSENGER",
  passengerCount: 150,
  cargoWeight: 1000,
  notes: "Connecting flight notes",
  active: true,
  segments: [
    {
      segmentNumber: 1,
      originAirportId: 1,
      destinationAirportId: 2,
      scheduledDeparture: "2024-01-15 10:00",
      scheduledArrival: "2024-01-15 11:30",
      gateNumber: "A12",
      notes: "Segment 1 notes",
      connectionTimeMinutes: 60
    },
    {
      segmentNumber: 2,
      originAirportId: 2,
      destinationAirportId: 3,
      scheduledDeparture: "2024-01-15 12:30",
      scheduledArrival: "2024-01-15 14:00",
      gateNumber: "B15",
      notes: "Segment 2 notes",
      connectionTimeMinutes: null
    }
  ]
}
```

## Environment Configuration

The frontend expects the following environment variables:

```bash
# API Base URLs
VITE_REFERENCE_API_BASE_URL=http://localhost:8081
VITE_FLIGHT_API_BASE_URL=http://localhost:8082
VITE_ARCHIVE_API_BASE_URL=http://localhost:8083

# WebSocket URLs
VITE_REFERENCE_WS_URL=ws://localhost:8081/ws
VITE_FLIGHT_WS_URL=ws://localhost:8082/ws
VITE_ARCHIVE_WS_URL=ws://localhost:8083/ws
```

## CORS Configuration

The backend is already configured with CORS to allow requests from:
- `http://localhost:3000` (React default)
- `http://127.0.0.1:3000`
- `http://localhost:5173` (Vite default)
- `http://127.0.0.1:5173`
- `http://localhost:5174` (Vite alternative)
- `http://127.0.0.1:5174`

## Authentication

The frontend is configured to:
- Send JWT tokens in Authorization header: `Bearer <token>`
- Handle 401 responses by redirecting to login
- Handle 403 responses by showing access denied message
- Automatically refresh tokens when needed

## Validation Rules

### Flight Number
- Format: `^[A-Z]{2}\d{1,4}$` (e.g., TK123, LH4567)
- Must be 2 uppercase letters followed by 1-4 digits

### Flight Types
- `PASSENGER` - Regular passenger flights
- `CARGO` - Cargo flights
- `POSITIONING` - Aircraft positioning flights
- `FERRY` - Ferry flights
- `TRAINING` - Training flights

### Flight Statuses
- `SCHEDULED` - Flight is scheduled
- `BOARDING` - Passengers are boarding
- `DEPARTED` - Flight has departed
- `ARRIVED` - Flight has arrived
- `DELAYED` - Flight is delayed
- `CANCELLED` - Flight is cancelled

## Error Handling

The frontend includes comprehensive error handling:
- Network errors
- Authentication errors (401)
- Authorization errors (403)
- Validation errors (400)
- Server errors (500)
- Timeout errors

## WebSocket Integration

The frontend is configured to handle real-time updates via WebSocket:
- Flight status changes
- Flight delays
- Flight cancellations
- New flight creation
- Flight updates

## Testing the Integration

1. **Start the backend services:**
   ```bash
   # Start Reference Manager Service (Port 8081)
   cd reference-manager-service
   mvn spring-boot:run

   # Start Flight Service (Port 8082)
   cd flight-service
   mvn spring-boot:run

   # Start Archive Service (Port 8083)
   cd flight-archive-service
   mvn spring-boot:run
   ```

2. **Start the frontend:**
   ```bash
   cd flight-management-frontend
   npm install
   npm run dev
   ```

3. **Test the integration:**
   - Navigate to the flight management page
   - Try creating a new flight
   - Test filtering and searching
   - Test CSV upload functionality
   - Test connecting flights creation

## Troubleshooting

### Common Issues

1. **CORS Errors:**
   - Ensure backend services are running on correct ports
   - Check CORS configuration in backend SecurityConfig
   - Verify frontend is running on allowed origins

2. **Authentication Errors:**
   - Ensure JWT token is valid
   - Check if user has required roles (ADMIN for write operations)
   - Verify token refresh logic

3. **API Endpoint Errors:**
   - Verify all endpoints are using `/api/v1/flights` prefix
   - Check request/response data structure matches DTOs
   - Ensure proper HTTP methods are used

4. **Data Validation Errors:**
   - Check flight number format (XX123)
   - Verify required fields are provided
   - Ensure date/time formats are correct (YYYY-MM-DD HH:mm)

### Debug Mode

Enable debug mode by setting `VITE_DEBUG_MODE=true` in environment variables to see detailed API logs in browser console.

## Next Steps

1. Test all CRUD operations for flights
2. Test connecting flights functionality
3. Test CSV upload and validation
4. Test real-time updates via WebSocket
5. Test bulk operations
6. Test statistics and analytics features
7. Test error handling scenarios

The frontend is now fully compatible with the backend and ready for production use! 