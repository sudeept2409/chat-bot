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
import axios from "axios";
import * as XLSX from "xlsx";
import { AzureKeyCredential, OpenAIClient } from "@azure/openai";
import ClubsUseCase from "./usecase/TestCases.xlsx";

const CHATGPT_USER = "ChatGPT";
const CONFIGURATION = new AzureKeyCredential(
  ""
);
const OPENAI_CLIENT = new OpenAIClient(
  "https://openai-demo-mb-001.openai.azure.com",
  CONFIGURATION,
  { apiVersion: "2023-05-15" }
);

export default function Chat() {
  const [fileData, setFileData] = useState([]);
  const messageInput = useRef(null);
  const [messages, setMessages] = useState([]);
  const [waitingForResponse, setWaitingForResponse] = useState(false);
  const [jsonStoryResponse, setJsonStoryResponse] = useState({});

  useEffect(() => {
    const reader = new FileReader();
    reader.onload = async (evt) => {
      // evt = on_file_select event
      /* Parse data */
      const bstr = evt.target.result;
      const workBook = XLSX.read(bstr, { type: "binary" });
      /* Get first worksheet */
      const sheetName = workBook.SheetNames[0];
      const sheet = workBook.Sheets[sheetName];
      /* Convert array of arrays */
      const data = XLSX.utils.sheet_to_json(sheet, { header: 1 });
      /* Update state */
      console.log("Data>>>" + data);
      fileData.push(data);
      sendMessage(
        fileData,
        `I am a business analyst and I need your help to create a Jira story. This is the details of my application 
        [
        ["UseCase","E2E Test Cases","Status","Defect ID"],
        ["Login/Logout","Login to Geo Club through integrated login. Username and password is required for Login. Username can only be validated using memberid and first name. All the validation in the application should consider success and error scenario. All pages should be Accessibility compliant."],
        ["Validation","Username can only be validated using Member Id and First Name"]
        ]
              
        Take this as a reference only. Ask description to generate a new story. Ask relevant questions during the conversation. I would like the response in JSON format and it is mandatory that all the fields of the JSON should be a string. Please add a field "success": true in the final response.  Also add field "issueType" in the final response whose value can be one of Story/Bug/Epic depending on the issue type. Please ask me the following questions together:
        
        "1. Summary: The summary should be brief, but it should provide enough information for someone to understand the story without having to read the full description. 
        2. Description: The description should be detailed, informative, comprehensive and well-organized. It should include all of the information(like purpose and dependencies) that is necessary to understand the JIRA story.  Structure must be point wise (like 1., 2., 3. and so on). Don't send '\n' in the response."`
      );
      setFileData(data);
    };

    // Use the Fetch API to fetch the contents of the file
    fetch(ClubsUseCase)
      .then((response) => response.blob())
      .then((blob) => {
        // Do something with the Blob object, such as uploading it to a server
        console.log("Got blob:", blob);
        reader.readAsBinaryString(blob);
      })
      .catch((error) => console.error(error));
  }, []);

  useEffect(() => {
    if (!waitingForResponse) {
      messageInput.current?.focus();
    }
  }, [waitingForResponse]);

  //Sending the message to bot
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
    const finalResponse = await getResponse(newMessageList);
    const newMessageResponse = {
      content: finalResponse.content,
      sentTime: Math.floor(Date.now() / 1000),
      sender: CHATGPT_USER,
      direction: "incoming",
    };

    newMessageList.push(newMessageResponse);
    setMessages([...newMessageList]);
    setWaitingForResponse(false);
  };

  //Receiving Response from the bot
  const getResponse = async (newMessageList) => {
    const input = newMessageList.map((message) => {
      return {
        role: message.sender === CHATGPT_USER ? "assistant" : "user",
        content: message.content,
      };
    });

    const response = await OPENAI_CLIENT.getChatCompletions(
      "openaidemomb001",
      input,
      { maxTokens: 256 }
    );
    const finalResponse = {
      content: response?.choices[0].message?.content,
    };
    console.log(finalResponse);
    // const responseStr = finalResponse.content;
    // if (responseStr.includes("{") && responseStr.includes("}")) {
    //   const jsonString = responseStr.substring(responseStr.indexOf("{"), responseStr.indexOf("}") + 1);
    //   const responseObj = JSON.parse(jsonString);
    //   setJsonStoryResponse(responseObj);
    //   console.log(responseObj);
    // }
    return finalResponse;
  };

  const regenerateResponse = () => {
    const regeneratePrompt = "Please regenerate a new response.";
    sendMessage(regeneratePrompt, regeneratePrompt);
  };

  const createStory = () => {
    let responseObj = {};
    const responseStr = messages[messages.length - 1].content;
    console.log("responseStr", responseStr);
    if (responseStr.includes("{") && responseStr.includes("}")) {
      const jsonString = responseStr.substring(
        responseStr.indexOf("{"),
        responseStr.indexOf("}") + 1
      );
      console.log("jsonString==>", jsonString);
      responseObj = JSON.parse(jsonString);
      console.log("responseObj==>", responseObj);
    }
    axios({
      url: "http://127.0.0.1:5000/jira",
      method: "POST",
      data: {
        fields: {
          project: {
            key: "OP",
          },
          issuetype: {
            name: `${responseObj.issueType
              .charAt(0)
              .toUpperCase()}${responseObj.issueType.slice(1)}`,
            // name: "Story",
          },
          summary: responseObj.summary,
          description: responseObj.description,
          labels: ["forgot-username"],
        },
      },
    })
      .then((res) => {
        console.log(res);
      })
      .catch((err) => {
        console.log(err);
      });
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
          <div className={styles.userResponse}>
            <button
              type="button"
              onClick={regenerateResponse}
              className={styles.userResponseButtons}
            >
              Regenerate Response
            </button>
            <button
              type="button"
              onClick={createStory}
              className={styles.userResponseButtons}
            >
              Create Jira Story
            </button>
          </div>
        </MainContainer>
      </div>
    </div>
  );
}
