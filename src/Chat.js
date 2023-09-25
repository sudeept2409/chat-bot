import {
  ChatContainer,
  MainContainer,
  Message,
  MessageInput,
  MessageList,
  TypingIndicator,
} from "@chatscope/chat-ui-kit-react"; // not able to resolve @chatscope/chat-ui-kit-react
import styles from "./Chat.module.css";
import { useEffect, useRef, useState } from "react";
// import { ChatCompletionRequestMessageRoleEnum, Configuration, OpenAIApi } from "openai"; //Showing error about not finding the methods ChatCompletionRequestMessageRoleEnum, Configuration, OpenAIApi
import { OpenAIClient, OpenAIKeyCredential } from "@azure/openai";
// import { ChatRole } from "@azure/openai";
const CHATGPT_USER = "ChatGPT";
const DEAFULT_BEHAVIOR = "General Conversation";
const CONFIGURATION = new OpenAIKeyCredential(
  "3289261e6cc84fa8aef58d38e2264fa9"
);
const OPENAI_CLIENT = new OpenAIClient(
  "https://openai-demo-mb-001.openai.azure.com/",
  CONFIGURATION,
  "2023-05-15"
);

export default function Chat() {
  const messageInput = useRef(null);
  const [messages, setMessages] = useState([]);
  const [behaviorInput, setBehaviorInput] = useState(DEAFULT_BEHAVIOR);
  const [behavior, setBehavior] = useState(DEAFULT_BEHAVIOR);

  const [waitingForResponse, setWaitingForResponse] = useState(false);

  useEffect(() => {
    if (!waitingForResponse) {
      messageInput.current?.focus();
    }
  }, [waitingForResponse]);

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

  const getResponse = async (newMessageList) => {
    const systemMessage = {
      role: "System",
      content: behavior,
    };

    const input = newMessageList.map((message) => {
      return {
        role: message.sender === CHATGPT_USER ? "assistant" : "user",
        content: message.content,
      };
    });

    // const response = await OPENAI_CLIENT.getChatCompletions(
    //   "openaidemomb001",
    //   input
    // );
    var myHeaders = new Headers();
    myHeaders.append("api-key", "3289261e6cc84fa8aef58d38e2264fa9");
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
    // console.log(response);
  };

  const updateBehavior = () => {
    const finalBehavior = behaviorInput.trim().length
      ? behaviorInput.trim()
      : DEAFULT_BEHAVIOR;
    setBehavior(finalBehavior);
  };

  return (
    <div className={styles.container}>
      <div className={styles.inputContainer}>
        <input
          className={styles.input}
          value={behaviorInput}
          onChange={(e) => setBehaviorInput(e.target.value)}
        />
        <button className={styles.submit} onClick={updateBehavior}>
          Update Behavior
        </button>
      </div>
      <div className={styles.chatWrapper}>
        <div className={styles.chatContainer}>
          <MainContainer>
            <ChatContainer>
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
    </div>
  );
}
