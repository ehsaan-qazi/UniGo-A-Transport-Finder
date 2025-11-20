# UniGo – A Transport Finder

UniGo is a web-based application designed to help students and commuters quickly find optimal transport routes between major universities and key locations in Islamabad. The project uses dynamic pathfinding algorithms to calculate the best routes based on distance and transfer penalties.

🌐 **Live Demo:** [View Project](https://ehsaan-qazi.github.io/UniGo-A-Transport-Finder/)

---

![Image of UniGo](pic.png)

---

## 📌 Current Status

✅ **Core Features Completed** – The application now features dynamic routing with Dijkstra's pathfinding algorithm, real-time route calculation, and an intuitive user interface for selecting departure and destination points.

---

## ✨ Features

- **Dynamic Route Finding** – Uses Dijkstra's algorithm with transfer penalties to calculate optimal routes between locations
- **Metro Transit Integration** – Supports Red Line, Orange Line, and Blue Line metro routes
- **Feeder Route Network** – Includes 15+ feeder routes connecting universities and major locations
- **Smart Transfer Penalties** – Prioritizes direct routes while accounting for necessary transfers
- **Clean Modern UI** – Responsive design that works on desktop and mobile devices
- **Location Coverage** – Includes major universities (COMSATS, NUST, QAU, IIU, etc.) and key landmarks
- **Interactive Search** – Select from dropdown menus of universities and major areas
- **Route Visualization** – Clear display of step-by-step route instructions with route names

---

## 🛠️ Tech Stack

- **Frontend:** HTML5, CSS3, JavaScript (ES6+)
- **Algorithms:** Dijkstra's Shortest Path with State-Space Optimization
- **Data Processing:** Graph generation from Metro Transit routes
- **Hosting:** GitHub Pages

---

## 🚀 How It Works

1. **Graph Generation**: The `scripts/generate_graph.js` script processes `Metro-Transit.json` to create a graph with nodes (stations) and edges (routes) with real-world distances calculated using the Haversine formula.

2. **Pathfinding**: The `src/pathfinder.js` implements a State-Space Dijkstra algorithm that tracks `(Node, Route)` states to correctly apply transfer penalties and find optimal routes.

3. **Route Display**: The UI formats and displays the calculated route with clear instructions for each segment.

---

## 📂 Project Structure

```
UniGo/
├── index.html              # Main landing page
├── about.html              # About page
├── profile.html            # Profile page
├── route.html              # Route details page
├── search.html             # Search results page
├── config.js               # Application configuration
├── Metro-Transit.json      # Source data for routes
├── coordinates.json        # Location coordinates
├── data/
│   ├── graph.json         # Generated graph data
│   └── unigo_transport_routes_full_slugged.json
├── src/
│   ├── css/               # Stylesheets
│   ├── js/                # JavaScript modules
│   │   ├── components/    # UI components
│   │   ├── core/          # Core functionality
│   │   └── utils/         # Utility functions
│   └── pathfinder.js      # Dijkstra's algorithm implementation
├── scripts/
│   └── generate_graph.js  # Graph generation tool
└── images/                # Image assets
```

---

## 🚀 Getting Started

### Running Locally

1. Clone the repository:
   ```bash
   git clone https://github.com/ehsaan-qazi/UniGo-A-Transport-Finder.git
   cd UniGo-A-Transport-Finder
   ```

2. Open `index.html` in your browser or use a local server:
   ```bash
   # Using Python
   python -m http.server 8000
   
   # Using Node.js
   npx serve
   ```

3. Navigate to `http://localhost:8000` in your browser.

### Regenerating Graph Data

If you modify `Metro-Transit.json`, regenerate the graph:

```bash
cd scripts
node generate_graph.js
```

---

## 🗺️ Route Coverage

### Metro Lines
- **Red Line**: Saddar to Secretariat
- **Orange Line**: Peshawar Mor to Airport
- **Blue Line**: PIMS to Blue Area

### Universities
- COMSATS University Islamabad
- NUST (National University of Sciences & Technology)
- Quaid-i-Azam University (QAU)
- International Islamic University (IIU)
- Bahria University, Air University, FAST-NUCES, and more

### Major Locations
- Saddar, Faizabad, Blue Area, G-9 Markaz, G-10 Markaz, G-11 Markaz
- Centaurus Mall, Peshawar Mor, and other key points

---

## 🤝 Contributing

Contributions are welcome! If you'd like to:
- Add new routes or locations
- Improve the pathfinding algorithm
- Enhance the UI/UX
- Fix bugs or add features

Please open an issue or submit a pull request.

---

## 📄 License

This project is licensed under the [Apache License 2.0](http://www.apache.org/licenses/).

---

## 👨‍💻 Author

**M. Ehsaan ur Rehman Qazi**  
- GitHub: [ehsaan-qazi](https://github.com/ehsaan-qazi)
- LinkedIn: [LinkedIn](https://www.linkedin.com/in/ehsaanqazi)
- Email: ehsaanbusinesshandle@gmail.com

---

## 🙏 Acknowledgments

- Metro Transit data based on Islamabad Metro Bus system
- Haversine formula for distance calculations
- State-Space Dijkstra algorithm for optimal routing

