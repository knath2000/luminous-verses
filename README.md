# Luminous Verses

Luminous Verses is a spiritual web application built with Next.js 15, React 19, and TypeScript, designed to provide a contemplative and child-friendly experience for engaging with the Quran.

## Features

- Beautiful cosmic/glass morphism UI
- Audio playback of Quranic verses
- Autoplay functionality with intelligent verse progression
- Customizable settings (autoplay, translations, transliteration)
- Surah list modal for easy navigation
- Responsive design for mobile and desktop

## Getting Started

Follow these steps to set up and run the project locally:

1.  **Clone the repository:**

    ```bash
    git clone https://github.com/knath2000/luminous-verses.git
    cd luminous-verses
    ```

2.  **Install dependencies:**

    ```bash
    npm install
    # or yarn install
    # or pnpm install
    # or bun install
    ```

3.  **Set up environment variables:**

    Copy the example environment file and update it with your configuration.

    ```bash
    cp .env.local.example .env.local
    ```

    Edit the `.env.local` file and provide values for the required variables.

4.  **Run the development server:**

    ```bash
    npm run dev
    # or yarn dev
    # or pnpm dev
    # or bun dev
    ```

    Open [http://localhost:3000](http://localhost:3000) in your browser to see the application.

## Deployment on Vercel

The easiest way to deploy Luminous Verses is using the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme).

1.  **Connect your GitHub repository:**

    Go to the [Vercel dashboard](https://vercel.com/dashboard) and import your Git repository (`https://github.com/knath2000/luminous-verses.git`).

2.  **Configure Project Settings:**

    Vercel should automatically detect that it's a Next.js project. Ensure the root directory is correct if your project is in a subdirectory.

3.  **Configure Environment Variables:**

    In your Vercel project settings, navigate to "Environment Variables" and add the variables defined in `.env.local.example`. **Do not commit your `.env.local` file to Git.**

4.  **Deploy:**

    Vercel will automatically build and deploy your application on every push to the main branch. You can also trigger deployments manually from the dashboard or using the Vercel CLI.

## Project Structure

```
luminous-verses/
├── .gitignore
├── .env.local.example
├── next.config.ts
├── package.json
├── postcss.config.mjs
├── README.md
├── tsconfig.json
├── vercel.json
├── memory-bank/
├── public/
└── src/
    └── app/
        ├── components/
        ├── contexts/
        ├── hooks/
        ├── utils/
        ├── globals.css
        ├── layout.tsx
        └── page.tsx
```

## Contributing

Contributions are welcome! Please follow the standard GitHub flow: fork the repository, create a branch, make your changes, and open a pull request.

## License

[Specify your project's license here]

## Acknowledgements

- [Quran.com API](https://api.quran.com/)
- [Vercel](https://vercel.com/)
- [Next.js](https://nextjs.org/)
- [React](https://react.dev/)
- [TypeScript](https://www.typescriptlang.org/)
