import {
    ChatContainer,
    MainContainer,
    Message,
    MessageInput,
    MessageList,
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
  
    const sendMessage = async (innerHtml, textContent, innerText, nodes) => {
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
  
      const response = await getResponse();
      const newMessageResponse = {
        content: response.content,
        sentTime: Math.floor(Date.now() / 1000),
        sender: CHATGPT_USER,
        direction: "incoming",
      };
  
      newMessageList.push(newMessageResponse);
      setMessages([...newMessageList]);
      setWaitingForResponse(false);
    };
  
    const getResponse = async () => {
      await new Promise((f) => setTimeout(f, 1000));
      return {
        content: `${Math.random()}`,
      };
    };
  
    return (
      <div className={styles.container}>
        <div></div>
        <div className={styles.chatwrapper}>
          <div className={styles.chatContainer}>
            <MainContainer>
              <ChatContainer>
                <MessageList>
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
      </div>
    );
  }
  