// src/components/VideoCard.jsx
const VideoCard = ({ title, duration }) => {
  return (
    <div className="bg-white p-4 rounded-xl shadow-md hover:shadow-lg transition cursor-pointer border border-gray-200">
      <div className="h-40 bg-gray-100 rounded-lg mb-3 flex items-center justify-center text-gray-400 font-semibold">
        Thumbnail
      </div>
      <h3 className="text-lg font-semibold text-gray-800">{title}</h3>
      <p className="text-gray-500">{duration}</p>
    </div>
  );
};

export default VideoCard;
