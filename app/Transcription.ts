import React, { useState, useEffect } from 'react';
import axios from 'axios';

import * as FileSystem from 'expo-file-system';

import { ASSEMBLY_AI_KEY } from './Keys.js';

export async function transcribe({ audio_file }) {
    const headers = { Authorization: ASSEMBLY_AI_KEY };

    async function upload(audio_uri) {
        const assembly = axios.create({
            baseURL: "https://api.assemblyai.com/v2",
            headers: {
                "authorization": headers.Authorization,
                "transfer-encoding": "chunked",
            },
        });
        console.log("audio_file: ", audio_uri);
        try {
            // const fileInfo = await FileSystem.getInfoAsync(audio_uri);
            // console.log("fileInfo: ", fileInfo);
            const data = await FileSystem.readAsStringAsync(audio_uri, {
                encoding: FileSystem.EncodingType.Base64,
            });
            console.log("data: ", data);
            assembly
                .post("/upload", data)
                .then((res) => {
                    console.log(res.data)
                    return res.data.upload_url;
                })
                .catch((err) => console.error("Error in upload: ", err));
        } catch (err) {
            console.error('Error getting file info:', err);
        }
    }

    // async function upload(audio_file) {
    //     const endpoint = 'https://api.assemblyai.com/v2/upload';
    //     const response = await axios.post(endpoint, audio_file, {
    //         headers,
    //     });
    //     return response.data.upload_url;
    // }

    async function kickoff(url) {
        console.log("URL passed to kickoff: ", url)
        const assembly = axios.create({
            baseURL: "https://api.assemblyai.com/v2",
            headers: { "authorization": headers.Authorization }
        });
        assembly
            .post("/transcript", {
                audio_url: url
            })
            .then((res) => console.log("In kickoff: ", res.data))
            .catch((err) => console.error("In kickoff: ", err));
    }

    async function poll(transcription_id) {
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
    }

    console.log('Headers', headers);
    console.log('uri', audio_file);

    const transcription_id = await kickoff(await upload(audio_file));

    console.log("transcription_id: ", transcription_id);
    return await poll(transcription_id);
}