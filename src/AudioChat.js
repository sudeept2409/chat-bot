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
import VoiceSearchModal from "./VoiceSearchModal";
import { ReactComponent as MicIcon } from "./mic.svg";

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
  const [showButtons, setShowButtons] = useState(false);
  const [showVoiceModal, setShowVoiceModal] = useState(false);

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
      // sendMessage(
      //   fileData,
      //   `I am a business analyst and I need your help to create a Jira story. I am working in an application which is working like this:
      //   [["UseCase","E2E Test Cases","Status","Defect ID"],

      //   ["Login/Logout","Login to Geo Club through integrated login. Username and password is required for Login. FOrgot username page has Member Id and First name for validation. All the validation in the application should consider success and error scenario. All pages should be Accessibility compliant."],

      //   ["Validation","Username can only be validated using Member Id and First Name"]] - take it as a reference/example, don't create any sample story of this.

      //   I want to create a new JIRA issue for a new requirement for my application. Ask description of new requirement to generate a new JIRA issue. Ask relevant questions during the conversation. I would like the response in JSON format and it is mandatory that all the fields of the JSON should be a string. Please add a field "success": true in the final response.  Also add field "issueType" in the final response whose value can be one of Story/Bug/Epic depending on the issue type of the new requirement. Also add Summary and Description field in the final response and ask me the following questions together and don't send the sample json during  the conversation, send the json only in final response:

      //   "1. Summary: The summary should be brief, but it should provide enough information for someone to understand the story without having to read the full description.

      //   2. Description: The description should be detailed, informative, comprehensive and well-organized. It should include all of the information(like purpose and dependencies) that is necessary to understand the JIRA story.  Structure must be point wise (like 1., 2., 3. and so on). Don't send ' ' in the response."`
      // );
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
      [
        {
          role: "system",
          content: `I am a business analyst and I need your help to create a Jira story. I am working in an application which is working like this: There is a Login page to Geo Club through integrated login. Username and password is required for Login. There is a forgot username link which redirects to forgot username page. Forgot username page has Member Id and First name as input field and a continue button. All the validation in the application should consider success and error scenario. All pages should be Accessibility compliant,         

        - take it as a reference/example, don't create any sample story of this.                       

        I want to create a new JIRA issue for a new requirement for my application. Ask description of new requirement to generate a new JIRA issue. Ask relevant questions during the conversation. I would like the response in valid JSON format and it is mandatory that all the fields of the JSON should be a string. Please add a field "success": true in the final response.  Also add field "issueType" in the final response whose value can be one of Story/Bug/Epic depending on the issue type of the new requirement. Also add Summary and Description field in the final response and ask me the following questions together and don't send the sample json during  the conversation, send the valid json only in final response:                  

        "1. Summary: The summary should be brief, but it should provide enough information for someone to understand the story without having to read the full description.         

        2. Description: The description should be detailed, informative, comprehensive and well-organized. It should include all of the information(like purpose and dependencies) that is necessary to understand the JIRA story.  Structure must be point wise (like 1., 2., 3. and so on). Don't send ' ' in the response."
        This is the sample JSON of the final response: {"success": true, "issueType": "Story/Bug/Epic", "summary": "Summary of the story", "description": "Description of the story"}`,
        },
        ...input,
      ],
      { maxTokens: 500 }
    );
    const finalResponse = {
      content: response?.choices[0].message?.content,
    };
    console.log(finalResponse);
    let responseStr = finalResponse.content;
    if (responseStr.includes("{") && responseStr.includes("}")) {
      responseStr = responseStr.replace(/\n/g, "");
      responseStr = responseStr.replace(/,}/g, "}");
      const jsonString = responseStr.substring(
        responseStr.indexOf("{"),
        responseStr.indexOf("}") + 1
      );
      console.log(jsonString);
      const responseObj = JSON.parse(jsonString.trim());
      console.log(responseObj);
      setJsonStoryResponse(responseObj);
      setShowButtons(true);
      console.log(responseObj);
    }
    return finalResponse;
  };

  const regenerateResponse = () => {
    const regeneratePrompt = "Please regenerate a new response.";
    sendMessage(regeneratePrompt, regeneratePrompt);
    setShowButtons(false);
  };

  const createStory = () => {
    var speech = true;
    window.SpeechRecognition = window.webkitSpeechRecognition;
    const recognition = new window.SpeechRecognition();
    recognition.interimResults = true;

    recognition.addEventListener("result", (e) => {
      const transcript = Array.from(e.results)
        .map((result) => result[0])
        .map((result) => result.transcript);
      // convert_text.innerHTML = transcript;
      console.log(transcript);
    });
    recognition.addEventListener("speechend", (event) => {
      console.log("Speech recognition stopped");
      recognition.stop();
    });
    if (speech) {
      recognition.start();
      console.log("started");
    }
    console.log("createStory");
    // let responseObj = {};
    // const responseStr = messages[messages.length - 1].content;
    // console.log("responseStr", responseStr);
    // if (responseStr.includes("{") && responseStr.includes("}")) {
    //   const jsonString = responseStr.substring(
    //     responseStr.indexOf("{"),
    //     responseStr.indexOf("}") + 1
    //   );
    //   console.log("jsonString==>", jsonString);
    //   responseObj = JSON.parse(jsonString);
    //   console.log("responseObj==>", responseObj);
    // }
    // setShowButtons(false);
    // axios({
    //   url: "http://127.0.0.1:5000/jira",
    //   method: "POST",
    //   data: {
    //     fields: {
    //       project: {
    //         key: "OP",
    //       },
    //       issuetype: {
    //         name: `${jsonStoryResponse.issueType
    //           .charAt(0)
    //           .toUpperCase()}${jsonStoryResponse.issueType.slice(1)}`,
    //         // name: "Story",
    //       },
    //       summary: jsonStoryResponse.summary,
    //       description: jsonStoryResponse.description,
    //       labels: ["forgot-username"],
    //     },
    //   },
    // })
    //   .then((res) => {
    //     console.log(res);
    //   })
    //   .catch((err) => {
    //     console.log(err);
    //   });
  };

  //UI for the bot
  return (
    <div className={styles.container}>
      {showVoiceModal && <VoiceSearchModal sendMessage={sendMessage} setShowVoiceModal={setShowVoiceModal} />}
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
          {!showButtons && (
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
              <a href="#" onClick={() => setShowVoiceModal(true)}>
                <MicIcon className="svg-fill-white ds-svg-icon" />
              </a>
            </div>
          )}
        </MainContainer>
      </div>
    </div>
  );
}
