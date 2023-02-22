import React, { useState, useEffect } from 'react';
import axios from 'axios';

function Transcriber({ audio_file, setTranscription }) {
  const [headers, setHeaders] = useState({});

  useEffect(() => {
    setHeaders({ Authorization: process.env.REACT_APP_ASSEMBLY_AI_API_KEY });
  }, []);

  const upload = async (audio_file) => {
    const endpoint = 'https://api.assemblyai.com/v2/upload';
    const response = await axios.post(endpoint, read_file(audio_file), {
      headers,
    });
    return response.data.upload_url;
  };

  const kickoff = async (url) => {
    const endpoint = 'https://api.assemblyai.com/v2/transcript';
    const data = { audio_url: url };
    const response = await axios.post(endpoint, data, { headers });
    return response.data.id;
  };

  const poll = async (transcription_id) => {
    const endpoint = `https://api.assemblyai.com/v2/transcript/${transcription_id}`;
    let status = 'processing';
    let response;
    while (status !== 'completed' && status !== 'error') {
      response = await axios.get(endpoint, { headers });
      if (!response.data.status) {
        throw new Error('No status in response');
      }
      status = response.data.status;
    }
    return response.data;
  };

  const transcribe = async (audio_file) => {
    const transcription_id = await kickoff(await upload(audio_file));
    const response = await poll(transcription_id);
    setTranscription(response);
  };

  return transcribe(audio_file);
};