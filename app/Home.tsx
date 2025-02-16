"use client";

import { FFmpeg } from '@ffmpeg/ffmpeg';
import { fetchFile, toBlobURL } from '@ffmpeg/util';
import { useEffect, useRef, useState } from 'react';

export default function Home() {
  const [loaded, setLoaded] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [outputURL, setOutputURL] = useState<string | null>(null);
  const ffmpegRef = useRef(new FFmpeg());
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const messageRef = useRef<HTMLParagraphElement | null>(null);

  const load = async () => {
    setIsLoading(true);
    const baseURL = "https://unpkg.com/@ffmpeg/core@0.12.10/dist/umd";
    const ffmpeg = ffmpegRef.current;
    ffmpeg.on("log", ({ message }) => {
      if (messageRef.current) messageRef.current.innerHTML = message;
    });
    await ffmpeg.load({
      coreURL: await toBlobURL(`${baseURL}/ffmpeg-core.js`, "text/javascript"),
      wasmURL: await toBlobURL(`${baseURL}/ffmpeg-core.wasm`, "application/wasm"),
    });
    setLoaded(true);
    setIsLoading(false);
  };

  const transcode = async () => {
    if (!selectedFile) return;
    setOutputURL(null);
    const ffmpeg = ffmpegRef.current;
    await ffmpeg.writeFile("input.mp4", await fetchFile(selectedFile));
    await ffmpeg.exec([
      "-i", "input.mp4", // input file
      "-vcodec", "libx264", // video codec
      "-b:v", "2000k", // video bitrate
      "-vf", "scale=-2:1280", // video resolution
      "-preset", "fast", // encoding speed
      "output.mp4" // output file
    ]);
    const data = (await ffmpeg.readFile("output.mp4")) as any;
    const url = URL.createObjectURL(new Blob([data.buffer], { type: "video/mp4" }));
    setOutputURL(url);
    if (videoRef.current) videoRef.current.src = url;
  };

  useEffect(() => {
    if (selectedFile) {
      transcode();
    }
  }, [selectedFile]);

  return loaded ? (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-100 p-6">
      <div className="bg-white shadow-lg rounded-lg p-6 w-full max-w-lg text-center">
        <h1 className="text-2xl font-semibold mb-4">Video Transcoder</h1>
        <input
          type="file"
          accept="video/*"
          onChange={(e) => setSelectedFile(e.target.files?.[0] || null)}
          className="block w-full text-sm text-gray-900 border border-gray-300 rounded-lg cursor-pointer bg-gray-50 p-2 mb-4"
        />
        <video ref={videoRef} controls className="w-full rounded-lg shadow"></video>
        <br />
        {outputURL && (
          <a
            href={outputURL}
            download={selectedFile ? selectedFile.name.replace(/\s/g, '_').replace(/\.[^.]+$/, '_compressed.mp4') : 'output_compressed.mp4'}
            className="mt-4 block text-blue-600 underline"
          >
            Download Converted Video
          </a>
        )}
        <p ref={messageRef} className="text-sm text-gray-600 mt-2"></p>
      </div>
    </div>
  ) : (
    <div className="flex items-center justify-center min-h-screen">
      <button
        className="flex items-center bg-blue-500 hover:bg-blue-700 text-white py-3 px-6 rounded-lg"
        onClick={load}
      >
        {isLoading ? 'Loading...' : 'Load ffmpeg-core'}
      </button>
    </div>
  );
}
