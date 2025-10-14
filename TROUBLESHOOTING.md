# Troubleshooting Guide

## React Version Conflict Error

### Error: "Cannot read properties of undefined (reading 'ReactCurrentOwner')"

This error occurs when React Three Fiber detects multiple React instances.

**Solution:**

1. **Clear all caches and dependencies:**
   ```bash
   rm -rf .next node_modules yarn.lock
   yarn install
   ```

2. **Clear browser cache:**
   - Open DevTools (F12)
   - Right-click the refresh button
   - Select "Empty Cache and Hard Reload"
   - Or use Incognito/Private mode

3. **Restart the dev server:**
   ```bash
   yarn dev
   ```

4. **If the error persists, check for duplicate React:**
   ```bash
   # Should show only one react and react-dom at version 18.3.1
   yarn list react react-dom --depth=0
   ```

### Prevention

The `package.json` includes a `resolutions` field that forces all packages to use the same React version:

```json
"resolutions": {
  "react": "^18.3.1",
  "react-dom": "^18.3.1"
}
```

This ensures no duplicate React instances are installed.

## Build Errors

### TypeScript Errors

If you get TypeScript errors, try:
```bash
rm -rf .next
yarn build
```

### Module Not Found

```bash
rm -rf node_modules yarn.lock
yarn install
```

## Dev Server Issues

### Port Already in Use

If port 3000 is already in use:
```bash
# Kill existing process
pkill -f "next dev"

# Or specify a different port
yarn dev -p 3001
```

### Hot Reload Not Working

1. Check file watchers limit (Linux):
   ```bash
   echo fs.inotify.max_user_watches=524288 | sudo tee -a /etc/sysctl.conf
   sudo sysctl -p
   ```

2. Restart the dev server

## Three.js / Canvas Issues

### Black Screen or No 3D Visualization

1. Check browser console for WebGL errors
2. Ensure GPU acceleration is enabled in browser
3. Try a different browser (Chrome/Firefox recommended)

### LEDs Not Animating

1. Check for JavaScript errors in the console
2. Verify the animation code compiles (check error overlay)
3. Ensure the shape has been compiled successfully

## Performance Issues

### Slow Animation

1. Reduce LED count in the shape
2. Simplify animation calculations
3. Check browser performance in DevTools

### Build Taking Too Long

```bash
# Clear Next.js cache
rm -rf .next

# Use production build
yarn build
yarn start
```

## Common Fixes

### "Module not found" errors
```bash
yarn install
```

### "Cannot find module" errors
```bash
rm -rf .next
yarn dev
```

### Stale state/weird behavior
```bash
# Full clean rebuild
rm -rf .next node_modules yarn.lock
yarn install
yarn dev
```

### Browser shows cached version
- Hard refresh: Ctrl+Shift+R (Windows/Linux) or Cmd+Shift+R (Mac)
- Or use Incognito/Private browsing mode

## Getting Help

If issues persist:

1. Check the error message in the browser console (F12)
2. Check the terminal for build/runtime errors
3. Verify Node.js version: `node --version` (should be 18.18+)
4. Verify Yarn version: `yarn --version` (should be 1.22+)
5. Try the full clean reinstall process above


