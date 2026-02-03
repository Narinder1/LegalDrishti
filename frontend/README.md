# LegalDrishti - Next.js Frontend

## Quick Start

```bash
# Install dependencies
npm install

# Run development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to view the app.

## Project Structure

```
src/
├── app/                    # Next.js App Router
│   ├── layout.tsx          # Root layout with Header/Footer
│   ├── page.tsx            # Home page (3-panel layout)
│   └── globals.css         # Global styles + CSS variables
│
├── components/
│   ├── layout/             # Header, Footer
│   └── home/               # LeftSidebar, MainContent, RightSidebar
│
└── config/
    ├── site.ts             # Site name, contact, stats (CHANGE HERE)
    └── theme.ts            # Color tokens
```

## Configuration

### Change Project Name
Edit `src/config/site.ts`:
```ts
export const siteConfig = {
  name: "LegalDrishti",  // Change this
  tagline: "Legal Network",
  // ...
}
```

### Change Colors
Edit `tailwind.config.ts` to modify primary (blue) and secondary (green) colors.

## Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run lint` - Run ESLint
