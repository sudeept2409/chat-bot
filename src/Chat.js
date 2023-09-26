import {
  ChatContainer,
  MainContainer,
  Message,
  MessageInput,
  MessageList,
  TypingIndicator,
} from "@chatscope/chat-ui-kit-react"; 
import styles from "./Chat.module.css";
import { useEffect, useRef, useState } from "react";


const CHATGPT_USER = "ChatGPT";


export default function Chat() {
  const messageInput = useRef(null);
  const [messages, setMessages] = useState([]);
  const [waitingForResponse, setWaitingForResponse] = useState(false);

  
  useEffect(() => {
    if (!waitingForResponse) {
      messageInput.current?.focus();
    }
  }, [waitingForResponse]);

  //Sending the message to bot
  const sendMessage = (innerHtml, textContent, innerText, nodes) => {
    const newMessageList = [...messages];
    const newMessage = {
      content: textContent,
      sentTime: Math.floor(Date.now() / 1000),
      sender: "You",
      direction: "outgoing",
    };
    newMessageList.push(newMessage);
    setMessages([...newMessageList]);

    setWaitingForResponse(true);
    getResponse(newMessageList);
  };


  //Receiving Response from the bot
  const getResponse = async (newMessageList) => {
    const input = newMessageList.map((message) => {
      return {
        role: message.sender === CHATGPT_USER ? "assistant" : "user",
        content: message.content,
      };
    });

    var myHeaders = new Headers();
    myHeaders.append("api-key","");
    myHeaders.append("Content-Type", "application/json");

    var raw = JSON.stringify({
      messages: input,
    });

    var requestOptions = {
      method: "POST",
      headers: myHeaders,
      body: raw,
      redirect: "follow",
    };
    let finalResponse = {};

    fetch(
      "https://openai-demo-mb-001.openai.azure.com/openai/deployments/openaidemomb001/chat/completions?api-version=2023-05-15",
      requestOptions
    )
      .then((response) => response.json())
      .then((result) => {
        console.log(result);
        finalResponse = {
          content: result.choices[0].message?.content,
        };

        const newMessageResponse = {
          content: finalResponse.content,
          sentTime: Math.floor(Date.now() / 1000),
          sender: CHATGPT_USER,
          direction: "incoming",
        };

        newMessageList.push(newMessageResponse);
        setMessages([...newMessageList]);
        setWaitingForResponse(false);
      })
      .catch((error) => console.log("error", error));
   
  };


  //UI for the bot
  return (
    <div className={styles.container}>
      <div className={styles.chatHead}>
        <h2>Conversational Chat Bot</h2>
      </div>
      <div className={styles.chatWrapper}>
          <MainContainer classname={styles.mainContainer}>
            <ChatContainer className={styles.chatContainer}>
              <MessageList
                className={styles.chatMessageList}
                typingIndicator={
                  waitingForResponse && (
                    <TypingIndicator
                      content="ChatGPT is thinking"
                      style={{ background: "#432A74" }}
                    />
                  )
                }
              >
                {messages.map((message) => {
                  return (
                    <Message
                      model={{
                        message: message.content,
                        sentTime: `${message.sentTime}`,
                        sender: message.sender,
                        direction: message.direction,
                        position: "normal",
                        type: "text",
                      }}
                    />
                  );
                })}
              </MessageList>
              <MessageInput
                placeholder="Type message here"
                style={{ background: "#432A74" }}
                onSend={sendMessage}
                autoFocus={true}
                attachButton={false}
                disabled={waitingForResponse}
                ref={messageInput}
              />
            </ChatContainer>
          </MainContainer>        
      </div>
    </div>
  );
}
