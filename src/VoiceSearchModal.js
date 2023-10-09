import React, { useEffect, useRef } from "react";
import Modal from "react-bootstrap/Modal";
import "./microphone.css";
import { ReactComponent as MicIcon } from "./mic.svg";
// import { IconName } from "react-icons/fa";

const VoiceSearchModal = ({ sendMessage, setShowVoiceModal }) => {
  const messageRef = useRef();
  useEffect(() => {
    let speech = true;
    window.SpeechRecognition = window.webkitSpeechRecognition;
    const recognition = new window.SpeechRecognition();
    recognition.interimResults = true;

    recognition.addEventListener("result", (e) => {
      const transcript = Array.from(e.results)
        .map((result) => result[0])
        .map((result) => result.transcript);
      // convert_text.innerHTML = transcript;
      console.log(transcript);
      // console.log(messageRef.current.innerHTML);
      if (messageRef.current) {
        messageRef.current.innerHTML = transcript;
      }
    });
    recognition.addEventListener("speechend", (event) => {
      console.log("Speech recognition stopped");
      recognition.stop();
      sendMessage(undefined, messageRef.current.innerHTML);
      setShowVoiceModal(false);
    });
    if (speech) {
      recognition.start();
      console.log("started");
    }
    console.log("createStory");
  }, []);

  return (
    <Modal size="xl" show backdrop="static" keyboard={false} centered>
      <Modal.Header>
        <Modal.Title>I'm Listening, Please</Modal.Title>
        <div className="container">
          <button id="speech" className="btn">
            <div className="pulse-ring"></div>
            <MicIcon className="svg-fill-white ds-svg-icon" /> 
          </button>
        </div>
      </Modal.Header>
      <Modal.Body>
        <span ref={messageRef}>Your message will come here</span>
      </Modal.Body>
    </Modal>
  );
};

export default VoiceSearchModal;
