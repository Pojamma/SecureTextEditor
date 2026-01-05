# Performance Testing Guide

**Created**: January 4, 2026
**Purpose**: Guide for testing SecureTextEditor performance

---

## Quick Start

The dev server is running at: **http://localhost:3001**

### Test Files Available

Located in `test-files/` directory:

| File | Size | Lines | Use Case |
|------|------|-------|----------|
| `test_100KB.txt` | 100 KB | 795 lines | Baseline/small file test |
| `test_500KB.txt` | 500 KB | 3,947 lines | Medium file test |
| `test_1MB.txt` | 1 MB | 8,075 lines | Large file threshold (target spec) |
| `test_2MB.txt` | 2 MB | 16,094 lines | Very large file test |
| `test_5MB.txt` | 5 MB | 40,107 lines | Stress test |

---

## Testing Methods

### Method 1: Manual Testing in Browser

1. **Open the app**:
   ```
   http://localhost:3001
   ```

2. **Open Browser DevTools**:
   - Chrome/Edge: F12 or Ctrl+Shift+I
   - Firefox: F12 or Ctrl+Shift+I

3. **Test file loading**:
   - Go to Performance tab in DevTools
   - Click Record
   - In the app: File → New Document
   - Paste content from test files (or use file picker if implemented)
   - Stop recording
   - Analyze: Parse time, Render time, Memory usage

4. **Test editing performance**:
   - Load 1MB file
   - Enable Performance Monitor (Ctrl+Shift+P → "Performance monitor")
   - Type continuously - monitor FPS and JS heap
   - Scroll rapidly - check for smooth 60 FPS
   - Search (Ctrl+F) for "Line 4000" - measure time

5. **Test multi-tab performance**:
   - Open 10 tabs with large files
   - Go to Memory tab in DevTools
   - Take heap snapshot before and after
   - Switch between tabs - measure switch time
   - Close tabs - verify memory is freed

### Method 2: Automated Performance Test Suite

1. **Open the test suite**:
   ```
   http://localhost:3001/performance-test.html
   ```

2. **Run tests**:
   - Click "Run All Tests" for complete suite
   - Or run individual test categories:
     - "Test Encryption Performance" - AES-256-GCM speed
     - "Test Memory Usage" - Heap allocation tracking
     - "Test Render Performance" - DOM manipulation speed

3. **Review results**:
   - Results display inline with color coding:
     - 🟢 Green (PASS): Meets performance targets
     - 🟡 Yellow (WARN): Acceptable but could be better
     - 🔴 Red (FAIL): Below performance targets
   - Export results by screenshot or copy/paste

4. **Document findings**:
   - Record results in `PERFORMANCE_TESTING.md`
   - Note any issues or bottlenecks
   - Compare against target benchmarks

---

## Performance Targets

### File Loading
- **100 KB**: < 200ms (instant)
- **500 KB**: < 500ms (fast)
- **1 MB**: < 1s (quick)
- **2 MB**: < 2s (acceptable)
- **5 MB**: < 5s (usable)

### Editing
- **Typing lag**: < 100ms (imperceptible)
- **Scrolling**: 60 FPS (smooth)
- **Search**: < 500ms for simple search on 1MB file

### Multi-Tab
- **Tab switch**: < 200ms
- **Memory per tab**: ~10-20MB for 1MB file
- **Maximum tabs**: 10+ with 1MB files without degradation

### Encryption (with 600,000 PBKDF2 iterations)
- **1 MB**: < 3s encrypt, < 3s decrypt
- **5 MB**: < 10s encrypt, < 10s decrypt

---

## Chrome DevTools Tips

### Performance Tab
1. **Record**:
   - Clear browser cache first (Ctrl+Shift+Delete)
   - Click Record (circle icon)
   - Perform action (load file, type, scroll)
   - Click Stop

2. **Analyze**:
   - **Main thread**: Look for long tasks (yellow/red bars)
   - **Network**: Check file load time
   - **Scripting**: JavaScript execution time
   - **Rendering**: Layout and paint operations
   - **Bottom-Up tab**: Find slowest functions

### Memory Tab
1. **Heap Snapshot**:
   - Take snapshot before action
   - Perform action (load files, open tabs)
   - Take snapshot after action
   - Compare snapshots to find leaks

2. **Allocation Timeline**:
   - Click Record
   - Perform actions
   - Stop recording
   - Blue bars show allocations
   - Gray bars show deallocations
   - Growing blue = potential leak

### Performance Monitor
1. **Enable**: Ctrl+Shift+P → "Show Performance Monitor"
2. **Metrics tracked**:
   - CPU usage
   - JS heap size
   - DOM nodes
   - JS event listeners
   - Layouts per second
   - Style recalculations

---

## Testing Checklist

### File Loading Performance
- [ ] Test 100KB file load time
- [ ] Test 500KB file load time
- [ ] Test 1MB file load time
- [ ] Test 2MB file load time
- [ ] Test 5MB file load time
- [ ] Record memory usage for each

### Editing Performance
- [ ] Type in 1MB file - check lag
- [ ] Scroll through 1MB file - check FPS
- [ ] Search in 1MB file - check speed
- [ ] Type in 5MB file - check lag
- [ ] Scroll through 5MB file - check FPS

### Multi-Tab Performance
- [ ] Open 5 tabs with 1MB files
- [ ] Open 10 tabs with 1MB files
- [ ] Switch between tabs - measure time
- [ ] Check total memory usage
- [ ] Close all tabs - verify memory freed

### Encryption Performance
- [ ] Encrypt 1MB file - measure time
- [ ] Decrypt 1MB file - measure time
- [ ] Encrypt 5MB file - measure time
- [ ] Decrypt 5MB file - measure time
- [ ] Monitor CPU usage during encryption

### Responsive Design
- [ ] Test at 320px width (small phone)
- [ ] Test at 375px width (iPhone SE)
- [ ] Test at 414px width (large phone)
- [ ] Test at 768px width (tablet portrait)
- [ ] Test at 1024px width (tablet landscape)
- [ ] Test at 1920px width (desktop)

---

## Common Performance Issues

### Issue: Slow File Loading
**Symptoms**: Long delay when opening large files
**Check**:
- Network tab: Is file transfer slow?
- Performance tab: Long parse/render time?
- Memory tab: Running out of memory?

**Possible Causes**:
- Large file being parsed all at once
- Inefficient text processing
- Too many DOM nodes created

**Solutions**:
- Implement virtual scrolling (CodeMirror 6 has this)
- Use lazy rendering
- Chunk large operations

### Issue: Typing Lag
**Symptoms**: Delay between keypress and character appearing
**Check**:
- Performance monitor: CPU spikes on keypress?
- Performance tab: Long tasks on main thread?

**Possible Causes**:
- Re-rendering entire document on each keystroke
- Heavy change listeners
- Slow state updates

**Solutions**:
- Use React.memo for components
- Debounce expensive operations
- Optimize state management

### Issue: Memory Leaks
**Symptoms**: Memory grows continuously, doesn't free on tab close
**Check**:
- Memory tab: Heap snapshots show growth
- Multiple snapshots show retention

**Possible Causes**:
- Event listeners not cleaned up
- References to closed documents
- Cached data not cleared

**Solutions**:
- Clean up event listeners in useEffect
- Clear document data on tab close
- Implement proper garbage collection

### Issue: Slow Tab Switching
**Symptoms**: Delay when clicking tab
**Check**:
- Performance tab: Long tasks on tab switch?

**Possible Causes**:
- Re-rendering all tabs on switch
- Loading document from storage on each switch
- Heavy component mounting

**Solutions**:
- Keep document state in memory
- Use React.lazy for tab content
- Memoize tab components

---

## Recording Results

### Template for PERFORMANCE_TESTING.md

After running tests, update `PERFORMANCE_TESTING.md` with:

1. **Test environment details**:
   - Browser version
   - OS version
   - Hardware specs

2. **Fill in result tables**:
   - Copy timing measurements
   - Record memory usage
   - Note any issues observed

3. **Document problems**:
   - Add to "Performance Issues Found" section
   - Categorize by severity (Critical/High/Medium/Low)
   - Include reproduction steps

4. **Recommendations**:
   - List optimizations needed
   - Prioritize by impact vs effort

---

## Next Steps After Testing

1. **Review results** in `PERFORMANCE_TESTING.md`
2. **Identify critical issues** (if any)
3. **Implement optimizations** for high-impact problems
4. **Re-test** after optimizations
5. **Update `tasks.md`** with findings
6. **Document** any configuration changes needed

---

## Advanced Testing (Optional)

### Lighthouse Performance Audit
```bash
# Install Lighthouse CLI
npm install -g lighthouse

# Run audit
lighthouse http://localhost:3001 --view
```

### Bundle Analysis
```bash
# Analyze bundle size
npm run build
npx vite-bundle-visualizer
```

### Automated Testing
Create performance regression tests:
```javascript
// Example: performance.test.ts
import { encryptDocument } from './encryption.service';

test('encryption performance', async () => {
  const text = 'x'.repeat(1024 * 1024); // 1MB
  const start = performance.now();
  await encryptDocument(text, 'password');
  const duration = performance.now() - start;
  expect(duration).toBeLessThan(3000); // Should complete in < 3s
});
```

---

## Questions to Answer

As you test, answer these questions:

1. **Is the app responsive with 1MB files?**
   - Can you type without lag?
   - Does scrolling feel smooth?
   - Is search fast enough?

2. **How many tabs can you open before slowdown?**
   - 5 tabs? 10 tabs? 20 tabs?
   - What's the memory usage?
   - When does it start to feel sluggish?

3. **Is encryption fast enough?**
   - Would you wait 5 seconds to encrypt a 5MB file?
   - Is the UI blocked during encryption?
   - Should we add a progress indicator?

4. **Are there any memory leaks?**
   - Does memory grow continuously?
   - Is memory freed when closing tabs?
   - Are there retained objects in heap snapshots?

5. **Does the UI work on all screen sizes?**
   - Is everything accessible on mobile (320px)?
   - Do touch targets meet minimum size (44px)?
   - Is text readable at all sizes?

---

**Good luck with testing! Document everything and prioritize user experience.**
