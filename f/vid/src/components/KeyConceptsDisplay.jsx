import { useState } from "react";
import "../styles/key-concepts.css";

export default function KeyConceptsDisplay({ concepts = [] }) {
  const [expandedIndex, setExpandedIndex] = useState(null);

  const toggleExpand = (index) => {
    setExpandedIndex(expandedIndex === index ? null : index);
  };

  if (!concepts || concepts.length === 0) {
    return <div className="concepts-empty">No key concepts available</div>;
  }

  // Normalize concept data - handle both old (string) and new (object) formats
  const normalizedConcepts = concepts.map((concept) => {
    if (typeof concept === "string") {
      // Old format: concept is just a string
      return {
        topic: concept,
        definition: "Concept extracted from transcript",
      };
    }
    // New format: concept is { topic, definition, _id? }
    return {
      topic: concept.topic || "Unknown Concept",
      definition:
        concept.definition || "No definition available",
    };
  });

  return (
    <div className="key-concepts-container">
      <h3 className="concepts-title">🎯 Key Concepts</h3>
      <div className="concepts-list">
        {normalizedConcepts.map((concept, index) => (
          <div
            key={index}
            className={`concept-item ${expandedIndex === index ? "expanded" : ""}`}
            onClick={() => toggleExpand(index)}
          >
            <div className="concept-header">
              <span className="concept-number">{index + 1}</span>
              <span className="concept-topic">{concept.topic}</span>
              <span className="concept-toggle-icon">
                {expandedIndex === index ? "▼" : "▶"}
              </span>
            </div>

            {expandedIndex === index && (
              <div className="concept-definition">
                {concept.definition}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
