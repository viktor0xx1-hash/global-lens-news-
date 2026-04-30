import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import { fileURLToPath } from "url";
import fs from "fs";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  const app = express();
  const PORT = 3000;

  // Health check
  app.get("/api/health", (req, res) => {
    res.json({ status: "ok" });
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    // Production serving with SEO injection
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath, { index: false })); // Don't serve index.html automatically

    app.get('*all', (req, res) => {
      const url = req.originalUrl;
      const indexHtmlPath = path.join(distPath, 'index.html');
      
      try {
        if (!fs.existsSync(indexHtmlPath)) {
          return res.status(404).send("Build not found. Please run npm run build.");
        }

        let html = fs.readFileSync(indexHtmlPath, 'utf-8');

        // Dynamic Meta Injection Mapping
        let title = "Global Lens | Geopolitical World News & Africa Updates";
        let description = "World-class geopolitical analysis, real-time world news, and specialized Africa updates. Stay informed with Global Lens.";
        
        if (url.includes('/category/geopolitics')) {
          title = "World News & Geopolitics | Global Lens Intelligence";
          description = "Expert analysis on global power shifts, security, and world events. Stay updated with our geopolitical intelligence stream.";
        } else if (url.includes('/category/economy')) {
          title = "Global Economy & Markets | Global Lens Intelligence";
          description = "Tracking the financial forces shaping our world. Real-time economic updates, market shifts, and global trade analysis.";
        } else if (url.includes('/category/diplomacy')) {
          title = "Diplomacy & International Relations | Global Lens Intelligence";
          description = "Inside global negotiations and international relations. Diplomatic updates, geopolitical strategy, and conflict resolution analysis.";
        } else if (url.includes('/category/africa')) {
          title = "Africa Updates & Intelligence | Global Lens Africa News";
          description = "Specialized reporting on the African continent. Security, development, and political shifts across Africa's corridors of power.";
        } else if (url.includes('/about')) {
          title = "About Global Lens | Our Geopolitical Perspective";
          description = "Global Lens is an independent intelligence platform providing balanced perspectives on world news and Africa updates.";
        } else if (url.includes('/article/')) {
          // Heuristic for articles: extract slug from URL
          const parts = url.split('/').filter(Boolean);
          const rawSlug = parts[parts.length - 1];
          if (rawSlug) {
            const cleanTitle = rawSlug.split('-').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
            title = `${cleanTitle} | Intelligence Report`;
            description = `Detailed intelligence report and geopolitical analysis on: ${cleanTitle}. Reported by Global Lens.`;
          }
        }

        // Replace placeholders (handles both formats)
        html = html.replace(/<title>.*?<\/title>/, `<title>${title}</title>`);
        html = html.replace(/<meta name="description" content=".*?" \/>/, `<meta name="description" content="${description}" />`);
        
        // Dynamic Canonical Injection
        const canonicalUrl = `https://globallens.online${url === '/' ? '' : url.split('?')[0]}`;
        html = html.replace('</title>', `</title>\n    <link rel="canonical" href="${canonicalUrl}" />`);

        html = html.replace(/<meta property="og:title" content=".*?" \/>/, `<meta property="og:title" content="${title}" />`);
        html = html.replace(/<meta property="og:description" content=".*?" \/>/, `<meta property="og:description" content="${description}" />`);
        html = html.replace(/<meta property="og:url" content=".*?" \/>/, `<meta property="og:url" content="https://globallens.online${url}" />`);
        html = html.replace(/<meta property="twitter:title" content=".*?" \/>/, `<meta property="twitter:title" content="${title}" />`);
        html = html.replace(/<meta property="twitter:description" content=".*?" \/>/, `<meta property="twitter:description" content="${description}" />`);

        res.status(200).set({ 'Content-Type': 'text/html' }).send(html);
      } catch (e) {
        console.error("SEO Injection Error:", e);
        res.sendFile(indexHtmlPath);
      }
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
