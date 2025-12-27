import { useState } from "react";
import UploadVideo from "./components/UploadVideo";

function App() {
  const [video, setVideo] = useState(null);

  return (
    <div className="min-h-screen bg-gray-100 p-6">
      <UploadVideo onUpload={setVideo} />

      {video && (
        <div className="mt-6 bg-white p-4 rounded-xl shadow">
          <h3 className="text-xl font-bold">{video.title}</h3>

          <p className="mt-2 text-gray-700">
            <strong>Summary:</strong> {video.summary}
          </p>

          <h4 className="mt-3 font-semibold">Key Concepts</h4>
          <ul className="list-disc pl-6">
            {video.keyConcepts.map((k, i) => (
              <li key={i}>{k}</li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

export default App;
