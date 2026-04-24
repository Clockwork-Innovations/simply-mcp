# Simply MCP - Shareholder Presentation

Interactive React-based slideshow for presenting Simply MCP to stakeholders.

## Quick Start

### Option 1: Direct Browser (Recommended)
```bash
# Open directly in browser
open docs/presentation/index.html
# or
xdg-open docs/presentation/index.html  # Linux
```

### Option 2: Local Server
```bash
# Using Python
cd docs/presentation
python3 -m http.server 8080

# Using Node
npx serve docs/presentation
```

Then open http://localhost:8080

## Navigation

| Key | Action |
|-----|--------|
| `→` / `Space` / `Enter` | Next slide |
| `←` / `Backspace` | Previous slide |
| `1-9`, `0` | Jump to slide 1-10 |
| Click navigation dots | Jump to any slide |

## Slides Overview

1. **Title** - Simply MCP introduction
2. **Problem** - Traditional MCP development pain points
3. **Solution** - Factory function approach
4. **Factory Functions** - createTool, createResource, createPrompt, createApp, createAgent, createServer
5. **MCP-UI** - Secure generated UI with sandboxed execution
6. **Progressive Disclosure** - 60-67% token reduction
7. **Code Execution** - Multi-tier isolation (QuickJS, Docker, Firecracker)
8. **Agents** - Autonomous AI entities with workflows
9. **Security** - Enterprise defense-in-depth
10. **Metrics** - Performance benchmarks
11. **Business Value** - ROI and cost savings
12. **Future** - Roadmap and call to action

## Customization

The presentation is a single HTML file using:
- React 18 (via CDN)
- Babel for JSX transformation
- Inter font family
- Custom CSS animations

Edit `index.html` to modify content, styling, or add slides.

## Presenting Tips

- Use **Fullscreen** (F11) for best experience
- Progress bar shows position at top
- Navigation dots on right side for quick jumps
- Slide counter in bottom right
