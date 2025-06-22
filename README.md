# Tyre Advisor

A modern web application that provides personalized tyre recommendations for cyclists based on their riding style, preferences, and requirements. The application scrapes data from cycling websites and uses AI-powered analysis to deliver tailored suggestions.

## Features

- **Personalized Recommendations**: Get tyre suggestions based on your riding style, terrain, weather conditions, and preferences
- **Real-time Data**: Scrapes current tyre information from Pinkbike and Singletrackworld
- **Interactive Refinement**: Ask follow-up questions to refine your recommendations
- **Modern UI**: Built with Mantine UI for a beautiful and responsive interface
- **Smart Analysis**: AI-powered recommendation engine that considers multiple factors

## Tech Stack

- **Frontend**: Next.js 14 with TypeScript
- **UI Framework**: Mantine UI v7
- **Web Scraping**: Axios + Cheerio
- **AI Integration**: OpenAI API (configurable)
- **Styling**: Mantine's built-in styling system

## Getting Started

### Prerequisites

- Node.js 18+ 
- npm or yarn

### Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd tyre-advisor
```

2. Install dependencies:
```bash
npm install
```

3. Set up environment variables (optional):
```bash
cp .env.example .env.local
```

Add your OpenAI API key if you want to use AI-powered recommendations:
```bash
OPENAI_API_KEY=your_api_key_here
```

4. Run the development server:
```bash
npm run dev
```

5. Open [http://localhost:3000](http://localhost:3000) in your browser.

## Usage

1. **Fill out the form**: Answer questions about your riding style, terrain, weather conditions, and preferences
2. **Get recommendations**: Receive 3 personalized tyre options with detailed information
3. **Refine results**: Ask follow-up questions to get more specific recommendations
4. **Compare options**: Review pros, cons, and specifications for each tyre

## Data Sources

The application scrapes tyre data from:
- **Pinkbike**: Cycling marketplace and reviews
- **Singletrackworld**: Mountain biking community and reviews

## Project Structure

```
tyre-advisor/
├── app/                    # Next.js app directory
│   ├── layout.tsx         # Root layout with Mantine provider
│   └── page.tsx           # Main application page
├── lib/                   # Core logic
│   ├── tyre-advisor.ts    # Main recommendation engine
│   ├── ai-analyzer.ts     # AI analysis logic
│   └── scrapers/          # Web scraping modules
│       ├── pinkbike.ts    # Pinkbike scraper
│       └── singletrackworld.ts # Singletrackworld scraper
├── types/                 # TypeScript type definitions
│   └── tyre.ts           # Tyre-related interfaces
├── theme.ts              # Mantine theme configuration
└── package.json          # Dependencies and scripts
```

## Configuration

### Environment Variables

- `OPENAI_API_KEY`: Your OpenAI API key for AI-powered recommendations
- `NEXT_PUBLIC_APP_URL`: Your application URL (for production)

### Customization

You can customize the application by:
- Modifying the theme in `theme.ts`
- Adding new data sources in the `scrapers/` directory
- Updating the recommendation logic in `ai-analyzer.ts`
- Adding new form fields in `app/page.tsx`

## Deployment

### Vercel (Recommended)

1. Push your code to GitHub
2. Connect your repository to Vercel
3. Deploy automatically

### Other Platforms

The application can be deployed to any platform that supports Next.js:
- Netlify
- Railway
- DigitalOcean App Platform
- AWS Amplify

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## License

This project is licensed under the MIT License.

## Disclaimer

This application is for educational and informational purposes. Always verify tyre specifications and compatibility with your bike before making a purchase. The recommendations are based on scraped data and should not be considered as professional advice.

## Support

If you encounter any issues or have questions, please open an issue on GitHub.
