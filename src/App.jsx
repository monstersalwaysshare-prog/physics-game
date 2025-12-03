// src/App.jsx
import { useEffect, useState } from "react";
import scenariosData from "./data/scenarios.json";
import cardsData from "./data/cards.json";
import { generateCardsForScenario } from "./game/engine.js";

//changed line below for github
// Build a URL for assets that works with Vite's base (/physics-game/)
const getAssetUrl = (assetPath) => {
  if (!assetPath) return "";
  // import.meta.env.BASE_URL is "/physics-game/" in your build
  const base = import.meta.env.BASE_URL || "/";
  // avoid double slashes like "/physics-game//assets/..."
  const cleanPath = assetPath.startsWith("/") ? assetPath.slice(1) : assetPath;
  return base + cleanPath;
};


// Build deck from all scenarios
function buildDeckFromScenarios(scenarios) {
  const deck = [];
  scenarios.forEach((scenario) => {
    const cards = generateCardsForScenario(scenario);
    cards.forEach((card) => {
      deck.push({
        scenarioId: scenario.id,
        scenarioDescription: scenario.description,
        slotId: card.slotId,
        category: card.category,
        cardId: card.cardId,
        isCorrect: card.isCorrect
      });
    });
  });
  return deck;
}

// ---------------------
// Helper: read URL query
// ---------------------
function getModeFromURL() {
  const params = new URLSearchParams(window.location.search);
  const mode = params.get("mode");
  return mode === "teacher" ? "teacher" : "student";
}

function App() {
  const [deck, setDeck] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [score, setScore] = useState(0);
  const [strikes, setStrikes] = useState(0);
  const [finished, setFinished] = useState(false);

  // UI polish state
  const [feedback, setFeedback] = useState(null);
  const [isWaiting, setIsWaiting] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);

  // ---------------------
  // NEW: mode state
  // ---------------------
  const [mode, setMode] = useState("student");

  useEffect(() => {
    // Mode detection happens once on mount
    const detectedMode = getModeFromURL();
    setMode(detectedMode);

    if (!scenariosData.scenarios || scenariosData.scenarios.length === 0) {
      console.error("No scenarios found");
      return;
    }

    const builtDeck = buildDeckFromScenarios(scenariosData.scenarios);
    setDeck(builtDeck);
    setCurrentIndex(0);
    setScore(0);
    setStrikes(0);
    setFinished(false);
    setFeedback(null);
    setIsWaiting(false);
  }, []);

  function getCardInfo(cardId) {
    return cardsData.cards?.find((c) => c.id === cardId) || null;
  }

  function playSound(kind) {
    const src =
      kind === "correct"
        ? "/sounds/correct.mp3"
        : "/sounds/incorrect.mp3";

    new Audio(src).play().catch(() => {});
  }

  function handleAnswer(answerIsYes) {
    if (finished || isWaiting) return;

    const currentCard = deck[currentIndex];
    const isCorrectAnswer = answerIsYes === currentCard.isCorrect;

    const newScore = isCorrectAnswer ? score + 1 : score;
    const newStrikes = isCorrectAnswer ? strikes : strikes + 1;

    setScore(newScore);
    setStrikes(newStrikes);
    setFeedback(isCorrectAnswer ? "correct" : "incorrect");
    setIsWaiting(true);
    playSound(isCorrectAnswer ? "correct" : "incorrect");

    const nextIndex = currentIndex + 1;
    const totalCards = deck.length;

    // ------------------------------------------------------------
    // END RULES DIFFER BY MODE
    // Student mode: end when strikes >= 3 or no cards left
    // Teacher mode: ignore strikes, only end when no cards left
    // ------------------------------------------------------------
    let willFinish = false;
    if (mode === "student") {
      if (newStrikes >= 3 || nextIndex >= totalCards) {
        willFinish = true;
      }
    } else {
      // Teacher mode
      if (nextIndex >= totalCards) {
        willFinish = true;
      }
    }

    setTimeout(() => {
      if (willFinish) {
        setFinished(true);
      } else {
        setCurrentIndex(nextIndex);
      }
      setFeedback(null);
      setIsWaiting(false);
    }, 700);
  }

  if (deck.length === 0 && !finished) {
    return <p style={{ padding: 20 }}>Loading scenarios...</p>;
  }

  if (finished) {
    const totalQuestions = deck.length;
    const studentPassingFraction = 39 / 42;
    const studentPassingScore = Math.ceil(studentPassingFraction * totalQuestions);
    const studentPassed = score >= studentPassingScore;

    return (
      <div style={{ padding: 20, maxWidth: 600, margin: "0 auto", fontFamily: "sans-serif" }}>
        <h1>Physics Game – Summary</h1>

        <p>
          Mode: {mode === "teacher" ? "Teacher (practice mode)" : "Student"}
        </p>

        <p>
          Total questions: {totalQuestions}
          <br />
          Score: {score}
          <br />
          Strikes: {strikes}
        </p>

        {mode === "student" && (
          <p>
            Passing threshold: {studentPassingScore} correct{" "}
            {totalQuestions === 42 ? "(39 / 42 rule)" : "(scaled)"}
            <br />
            Result: <strong>{studentPassed ? "Pass" : "Try again"}</strong>
          </p>
        )}

        {mode === "teacher" && (
          <p style={{ fontStyle: "italic" }}>
            Teacher mode: no passing requirement.  
            Use browser refresh to start again.
          </p>
        )}
      </div>
    );
  }

  const currentCard = deck[currentIndex];
  const cardInfo = getCardInfo(currentCard.cardId);
  const scenarioIndex =
    scenariosData.scenarios.findIndex((s) => s.id === currentCard.scenarioId) + 1;
  const totalQuestions = deck.length;
  const progressFraction = currentIndex / totalQuestions;
  const progressPercent = Math.round(progressFraction * 100);

  let cardBackground = "#fff";
  let cardBorder = "#ccc";
  if (feedback === "correct") {
    cardBackground = "#e6ffed";
    cardBorder = "#2e7d32";
  } else if (feedback === "incorrect") {
    cardBackground = "#ffe6e6";
    cardBorder = "#c62828";
  }

  const showFullscreenImage =
    isFullscreen && cardInfo && cardInfo.type === "image";

  return (
    <div style={{ padding: 20, maxWidth: 600, margin: "0 auto", fontFamily: "sans-serif" }}>
      <h1>Physics Game</h1>

      <p style={{ fontSize: 12, color: "#777", marginTop: -12 }}>
        {mode === "teacher" ? "Teacher Mode (secret URL)" : "Student Mode"}
      </p>

      {/* Progress bar */}
      <div style={{ marginBottom: 16 }}>
        <div style={{ height: 10, background: "#eee", borderRadius: 999 }}>
          <div
            style={{
              width: `${progressPercent}%`,
              height: "100%",
              background: "#1976d2",
              transition: "width 0.3s ease"
            }}
          />
        </div>
        <p style={{ fontSize: 12, color: "#666", marginTop: 4 }}>
          Question {currentIndex + 1} of {totalQuestions} ({progressPercent}%)
        </p>
      </div>

      <h2>
        Scenario {scenarioIndex} of {scenariosData.scenarios.length}
      </h2>
      <p>{currentCard.scenarioDescription}</p>

      <div
        style={{
          border: `2px solid ${cardBorder}`,
          borderRadius: 12,
          padding: 16,
          marginTop: 16,
          marginBottom: 16,
          minHeight: 120,
          backgroundColor: cardBackground,
          cursor: cardInfo?.type === "image" ? "pointer" : "default"
        }}
        onClick={() => {
          if (cardInfo?.type === "image") setIsFullscreen(true);
        }}
      >
        {cardInfo?.type === "image" ? (
          <img
            //src={cardInfo.asset} //changed line below for github
            src={getAssetUrl(cardInfo.asset)}
            alt={cardInfo.id}
            style={{
              width: "100%",
              maxWidth: 450,
              height: "auto",
              borderRadius: 8,
              display: "block",
              margin: "0 auto"
            }}
          />
        ) : (
          <p style={{ fontSize: 18, textAlign: "center" }}>{cardInfo?.text}</p>
        )}
      </div>

      <p style={{ fontSize: 14, color: "#555" }}>
        Does this card correctly represent the scenario?
      </p>

      <div style={{ display: "flex", gap: 12, marginTop: 8 }}>
        <button
          onClick={() => handleAnswer(true)}
          disabled={isWaiting}
          style={{
            flex: 1,
            padding: "14px 0",
            fontSize: 18,
            fontWeight: "bold",
            borderRadius: 999,
            border: "none",
            backgroundColor: isWaiting ? "#c8e6c9" : "#4caf50",
            color: "#fff"
          }}
        >
          Yes
        </button>
        <button
          onClick={() => handleAnswer(false)}
          disabled={isWaiting}
          style={{
            flex: 1,
            padding: "14px 0",
            fontSize: 18,
            fontWeight: "bold",
            borderRadius: 999,
            border: "none",
            backgroundColor: isWaiting ? "#ffcdd2" : "#f44336",
            color: "#fff"
          }}
        >
          No
        </button>
      </div>

      <p style={{ marginTop: 12 }}>Score: {score}</p>
      <p>Strikes: {strikes} / 3</p>

      {/* Fullscreen image */}
      {showFullscreenImage && (
        <div
          onClick={() => setIsFullscreen(false)}
          style={{
            position: "fixed",
            inset: 0,
            backgroundColor: "rgba(0,0,0,0.7)",
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            padding: 16,
            zIndex: 9999
          }}
        >
          <img
            //src={cardInfo.asset} //changed for github
            src={getAssetUrl(cardInfo.asset)}
            alt={cardInfo.id}
            style={{
              maxWidth: "100%",
              maxHeight: "100%",
              borderRadius: 12
            }}
          />
        </div>
      )}
    </div>
  );
}

export default App;
