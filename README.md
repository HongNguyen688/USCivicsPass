# USCivicsPass 🇺🇸

A comprehensive, interactive web application designed to help applicants prepare for the United States Naturalization Interview and Test. Built with React and Vite, this platform provides all the tools needed to pass the civics, reading, writing, and N-400 interview portions.

## ✨ Features

- **Multiple Study Guides**: Choose between the standard **100 Questions (2008 version)** and the expanded **128 Questions (2020 version)** depending on your filing requirements.
- **Interactive Flashcards**: Master all civics questions using beautifully designed, flippable flashcards.
- **Practice Quizzes**: Simulate the actual interview experience with randomized quizzes tailored to your guide (10 questions/6 to pass for 2008, 20 questions/12 to pass for 2020).
- **Reading & Writing Modules**: Practice your English literacy skills with dedicated sentence dictation and reading exercises.
- **N-400 Application Review**: Prepare for the personal, vocabulary, and character questions frequently asked during the actual N-400 interview.
- **Text-to-Speech Audio**: Built-in audio pronunciation for every question and answer, featuring adjustable playback speeds to improve listening comprehension.
- **Multilingual Subtitles**: Dual-language support available in Spanish, Vietnamese, Korean, and Chinese to assist non-native English speakers.

## 🚀 Getting Started

### Prerequisites
Make sure you have [Node.js](https://nodejs.org/) installed on your machine.

### Installation

1. Clone the repository and navigate directly to the project folder:
   ```bash
   cd NewUSCitizenshipTest
   ```

2. Install the necessary dependencies:
   ```bash
   npm install
   ```

### Running Locally

To start the local development server:
```bash
npm run dev
```
Once the server starts, open your browser and navigate to `http://localhost:5173`.

### 🧪 Running Tests

This project includes unit tests configured with **Vitest** and **React Testing Library**. 

To run the test suite in interactive watch mode, use:
```bash
npm run test
```

To run the tests sequentially just once, use:
```bash
npm run test -- --run
```

## 🛠 Technologies Used
- **React 19**
- **Vite**
- **CSS3** (Custom styling with a premium glassmorphism design system)
- **Vitest** & **React Testing Library**

## 📄 License
© 2026 HN - USCivicsPass. All rights reserved.
