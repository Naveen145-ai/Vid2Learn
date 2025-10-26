// src/components/VideoCard.jsx
const VideoCard = ({ title, videoUrl, audioUrl, transcript, summary, keyConcepts, quiz }) => {
  return (
    <div className="bg-white p-4 rounded-xl shadow-md border border-gray-200">
      <h3 className="text-lg font-bold mb-2">{title}</h3>

      {videoUrl && (
        <video src={videoUrl} controls className="w-full rounded-md mb-2" />
      )}
      {audioUrl && (
        <audio src={audioUrl} controls className="w-full mb-2" />
      )}

      {transcript && (
        <div className="mb-2">
          <h4 className="font-semibold">Transcript:</h4>
          <p className="text-sm text-gray-700">{transcript}</p>
        </div>
      )}

      {summary && (
        <div className="mb-2">
          <h4 className="font-semibold">Summary:</h4>
          <p className="text-sm text-gray-700">{summary}</p>
        </div>
      )}

      {keyConcepts?.length > 0 && (
        <div className="mb-2">
          <h4 className="font-semibold">Key Concepts:</h4>
          <ul className="list-disc ml-5 text-sm text-gray-700">
            {keyConcepts.map((concept, i) => (
              <li key={i}>{concept}</li>
            ))}
          </ul>
        </div>
      )}

      {quiz?.length > 0 && (
        <div>
          <h4 className="font-semibold">Quiz:</h4>
          {quiz.map((q, i) => (
            <div key={i} className="mb-1 text-sm">
              <p>{i + 1}. {q.question}</p>
              <ul className="list-disc ml-5">
                {q.options.map((opt, idx) => (
                  <li key={idx}>{opt}</li>
                ))}
              </ul>
              <p className="text-green-600 font-semibold">Answer: {q.answer}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default VideoCard;
