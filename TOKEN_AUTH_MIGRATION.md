# Token-Based Authentication Migration

Your ChurchMS system has been successfully converted from CSRF session-based authentication to token-based authentication using Laravel Sanctum.

## What Changed

### Backend Changes

1. **User Model** (`backend/app/Models/User.php`)
   - Added `HasApiTokens` trait for token management

2. **Sanctum Configuration** (`backend/config/sanctum.php`)
   - Disabled stateful domains (set to empty array)
   - Removed CSRF token validation middleware
   - Now using pure token-based authentication

3. **Authentication Controllers**
   - **AuthenticatedSessionController** (`backend/app/Http/Controllers/Auth/AuthenticatedSessionController.php`)
     - Login now returns a JSON response with `token` and `user` data
     - Tokens are created using `createToken()` method
     - Old tokens are deleted on new login
     - Logout now deletes the current access token
   
   - **RegisteredUserController** (`backend/app/Http/Controllers/Auth/RegisteredUserController.php`)
     - Registration now returns a JSON response with `token` and `user` data
     - New users automatically receive an auth token

4. **API Routes** (`backend/routes/api.php`)
   - All routes using `auth:sanctum` middleware now work with Bearer tokens
   - No changes needed as `auth:sanctum` automatically supports both session and token auth

### Frontend Changes

1. **Axios Configuration** (`frontend/src/lib/axios.js`)
   - Removed `withCredentials` and `withXSRFToken` options
   - Added request interceptor to attach Bearer token from localStorage
   - Added response interceptor to handle 401 errors and clear invalid tokens
   - Automatic redirect to login on 401 errors

2. **Auth Hook** (`frontend/src/hooks/auth.jsx`)
   - Removed all `csrf()` calls
   - Login and register now save tokens to `localStorage`
   - User data is only fetched if a token exists
   - Logout removes token from `localStorage`
   - Better error handling for 401 responses

3. **Echo/WebSocket Configuration** (`frontend/src/lib/echo.js`)
   - Updated to use Bearer token authentication instead of CSRF cookies
   - Token retrieved from localStorage instead of cookies
   - Removed CSRF cookie fetch call
   - Broadcasting authorization now uses Bearer token

## How It Works

### Authentication Flow

1. **Login/Register**:
   ```
   User submits credentials → Backend validates → Backend creates token → 
   Frontend receives token → Token stored in localStorage → Token used for all subsequent requests
   ```

2. **API Requests**:
   ```
   Request initiated → Axios interceptor adds Authorization header → 
   Backend validates token → Response returned
   ```

3. **Logout**:
   ```
   User logs out → Token deleted from backend → Token removed from localStorage → 
   User redirected to login
   ```

## Token Storage

Tokens are stored in the browser's `localStorage` under the key `auth_token`.

**Security Note**: localStorage is susceptible to XSS attacks. For production, consider:
- Implementing proper Content Security Policy (CSP)
- Using httpOnly cookies (requires adjusting the implementation)
- Implementing token refresh mechanism
- Setting token expiration times

## API Usage

### Making Authenticated Requests

All authenticated API requests now require the `Authorization` header:

```javascript
Authorization: Bearer <token>
```

This is automatically handled by the Axios interceptor, so no manual header setting is needed in your frontend code.

### Token Format

Tokens are returned in this format:
```json
{
  "token": "1|laravel_sanctum_token_here",
  "user": { /* user data */ }
}
```

## Testing

To test the token-based authentication:

1. **Clear existing sessions**:
   ```bash
   # Clear browser localStorage
   localStorage.clear()
   
   # Or clear specific token
   localStorage.removeItem('auth_token')
   ```

2. **Test login**:
   - Login with valid credentials
   - Check browser console/Network tab for token in response
   - Verify token is saved in localStorage
   - Subsequent API calls should include `Authorization: Bearer <token>` header

3. **Test protected routes**:
   - Try accessing protected API endpoints
   - Verify requests include Authorization header
   - Check that 401 responses clear token and redirect to login

4. **Test logout**:
   - Logout and verify token is removed from localStorage
   - Try accessing protected routes (should fail with 401)

## Migration Steps for Users

Existing users will need to:
1. Log out from the old system
2. Log back in to receive a new token
3. The system will automatically handle token storage and usage

## Rollback (If Needed)

If you need to rollback to session-based authentication:

1. Restore `backend/config/sanctum.php`:
   - Add back stateful domains
   - Uncomment CSRF validation middleware

2. Restore `frontend/src/lib/axios.js`:
   - Add back `withCredentials: true` and `withXSRFToken: true`

3. Restore `frontend/src/hooks/auth.jsx`:
   - Add back `csrf()` function and calls

4. Restore authentication controllers to return `response()->noContent()`

## Benefits of Token-Based Auth

✅ **Stateless**: No server-side session storage needed
✅ **Scalable**: Works better with load balancers and multiple servers
✅ **Mobile-friendly**: Easier to implement in mobile apps
✅ **API-first**: Better suited for API consumption
✅ **CORS-friendly**: No cookie-related CORS issues

## Important Notes

- Tokens are stored in `personal_access_tokens` table
- Old tokens are deleted when a user logs in again
- Each user can have multiple tokens if needed (currently configured to delete old ones)
- Tokens don't expire by default (configure in `backend/config/sanctum.php` if needed)

## Configuration Options

In `backend/config/sanctum.php`:

```php
// Set token expiration (in minutes, null = never expires)
'expiration' => 60 * 24 * 7, // 7 days

// Add token prefix for security scanning
'token_prefix' => env('SANCTUM_TOKEN_PREFIX', ''),
```

## Support

For issues or questions about the token-based authentication system:
1. Check Laravel Sanctum documentation: https://laravel.com/docs/sanctum
2. Verify tokens are being created (check `personal_access_tokens` table)
3. Check browser console for errors
4. Verify Authorization headers are being sent in requests
