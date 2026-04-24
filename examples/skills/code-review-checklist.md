## Code Review Checklist

### Security
- [ ] No hardcoded secrets or credentials
- [ ] Input validation on user-supplied data
- [ ] SQL/NoSQL injection prevention
- [ ] XSS prevention for web outputs
- [ ] Proper authentication/authorization checks

### Code Quality
- [ ] Functions are single-purpose and well-named
- [ ] No deeply nested conditionals
- [ ] Consistent naming conventions
- [ ] No code duplication (DRY principle)
- [ ] Magic numbers/strings are constants

### Error Handling
- [ ] All error paths handled gracefully
- [ ] Errors logged with context
- [ ] User-friendly error messages
- [ ] No swallowed exceptions

### Testing
- [ ] Unit tests for new functionality
- [ ] Edge cases covered
- [ ] Integration tests updated
- [ ] No flaky tests introduced

### Documentation
- [ ] Public APIs documented
- [ ] Complex logic explained
- [ ] README updated if needed
- [ ] CHANGELOG entry added
