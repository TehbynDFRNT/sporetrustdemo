"use client";

import { useState } from "react";

export default function FaqAccordion({ items }) {
  const [openIndex, setOpenIndex] = useState(0);

  return (
    <div className="faq-accordion">
      {items.map(([question, answer], index) => {
        const isOpen = openIndex === index;
        const panelId = `faq-panel-${index}`;
        const buttonId = `faq-button-${index}`;

        return (
          <div className={isOpen ? "qa open" : "qa"} key={question}>
            <button
              id={buttonId}
              className="qa-trigger"
              type="button"
              aria-expanded={isOpen}
              aria-controls={panelId}
              onClick={() => setOpenIndex(index)}
            >
              <span>{question}</span>
            </button>
            <div
              id={panelId}
              className="qa-panel"
              role="region"
              aria-labelledby={buttonId}
              aria-hidden={!isOpen}
            >
              <div className="qa-panel-inner">
                <p>{answer}</p>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
